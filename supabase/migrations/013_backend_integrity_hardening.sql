-- ============================================
-- DuitFlow - Backend integrity hardening
-- Locks system-owned transaction semantics and wallet balances
-- so authenticated clients cannot forge finance state.
-- ============================================

CREATE OR REPLACE FUNCTION public.can_bypass_finance_integrity_guards()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(current_setting('request.jwt.claim.role', true), '') = 'service_role'
    OR COALESCE(current_setting('app.finance_guard_bypass', true), '') = 'on';
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.enforce_transaction_system_fields()
RETURNS TRIGGER AS $$
DECLARE
  is_privileged BOOLEAN;
  next_source TEXT;
  old_source TEXT;
BEGIN
  is_privileged := public.can_bypass_finance_integrity_guards();
  next_source := COALESCE(NULLIF(BTRIM(NEW.source), ''), 'manual');
  old_source := 'manual';

  IF TG_OP = 'UPDATE' THEN
    old_source := COALESCE(NULLIF(BTRIM(OLD.source), ''), 'manual');
  END IF;

  IF is_privileged THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
    AND (
      old_source IN ('system_transfer', 'telegram_bot')
      OR OLD.transfer_group_id IS NOT NULL
      OR OLD.transfer_entry_kind IS NOT NULL
    ) THEN
    RAISE EXCEPTION 'Protected system transactions must be changed through backend procedures.';
  END IF;

  IF next_source IN ('system_transfer', 'telegram_bot') THEN
    RAISE EXCEPTION 'System transaction sources cannot be written directly from the client.';
  END IF;

  IF NEW.transfer_group_id IS NOT NULL OR NEW.transfer_entry_kind IS NOT NULL THEN
    RAISE EXCEPTION 'Transfer metadata can only be written by backend procedures.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS before_transactions_enforce_integrity ON transactions;
CREATE TRIGGER before_transactions_enforce_integrity
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_transaction_system_fields();

CREATE OR REPLACE FUNCTION public.enforce_wallet_balance_integrity()
RETURNS TRIGGER AS $$
DECLARE
  is_privileged BOOLEAN;
BEGIN
  is_privileged := public.can_bypass_finance_integrity_guards();

  IF is_privileged THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.balance := COALESCE(NEW.initial_balance, NEW.balance, 0);
    RETURN NEW;
  END IF;

  IF NEW.balance IS DISTINCT FROM OLD.balance THEN
    RAISE EXCEPTION 'Wallet balance is derived and cannot be updated directly.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS before_wallets_enforce_balance_integrity ON wallets;
CREATE TRIGGER before_wallets_enforce_balance_integrity
  BEFORE INSERT OR UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION public.enforce_wallet_balance_integrity();

CREATE OR REPLACE FUNCTION public.recalculate_wallet_balance(target_wallet_id UUID)
RETURNS VOID AS $$
BEGIN
  IF target_wallet_id IS NULL THEN
    RETURN;
  END IF;

  PERFORM set_config('app.finance_guard_bypass', 'on', true);

  UPDATE wallets
  SET balance = public.compute_wallet_balance(target_wallet_id)
  WHERE id = target_wallet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.insert_transfer_group_entries(
  p_transfer_group_id UUID,
  p_actor UUID,
  p_from_wallet_id UUID,
  p_to_wallet_id UUID,
  p_amount INTEGER,
  p_fee_amount INTEGER,
  p_note TEXT,
  p_transfer_date DATE
)
RETURNS VOID AS $$
DECLARE
  from_wallet_name TEXT;
  to_wallet_name TEXT;
  normalized_note TEXT;
BEGIN
  PERFORM set_config('app.finance_guard_bypass', 'on', true);

  SELECT name INTO from_wallet_name FROM wallets WHERE id = p_from_wallet_id;
  SELECT name INTO to_wallet_name FROM wallets WHERE id = p_to_wallet_id;
  normalized_note := NULLIF(BTRIM(p_note), '');

  INSERT INTO transactions (
    user_id,
    amount,
    type,
    title,
    note,
    date,
    transaction_date,
    wallet_id,
    source,
    transfer_group_id,
    transfer_entry_kind
  )
  VALUES
    (
      p_actor,
      p_amount,
      'expense',
      COALESCE('Transfer to ' || to_wallet_name, 'Transfer out'),
      normalized_note,
      p_transfer_date,
      p_transfer_date,
      p_from_wallet_id,
      'system_transfer',
      p_transfer_group_id,
      'out'
    ),
    (
      p_actor,
      p_amount,
      'income',
      COALESCE('Transfer from ' || from_wallet_name, 'Transfer in'),
      normalized_note,
      p_transfer_date,
      p_transfer_date,
      p_to_wallet_id,
      'system_transfer',
      p_transfer_group_id,
      'in'
    );

  IF p_fee_amount > 0 THEN
    INSERT INTO transactions (
      user_id,
      amount,
      type,
      title,
      note,
      date,
      transaction_date,
      wallet_id,
      source,
      transfer_group_id,
      transfer_entry_kind
    )
    VALUES (
      p_actor,
      p_fee_amount,
      'expense',
      'Transfer fee',
      normalized_note,
      p_transfer_date,
      p_transfer_date,
      p_from_wallet_id,
      'manual',
      p_transfer_group_id,
      'fee'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_transfer_group_with_entries(
  p_transfer_group_id UUID,
  p_from_wallet_id UUID,
  p_to_wallet_id UUID,
  p_amount INTEGER,
  p_fee_amount INTEGER DEFAULT 0,
  p_note TEXT DEFAULT NULL,
  p_transfer_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID AS $$
DECLARE
  actor UUID;
BEGIN
  actor := auth.uid();

  IF actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  IF p_from_wallet_id = p_to_wallet_id THEN
    RAISE EXCEPTION 'Source and destination wallet must be different.';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be greater than zero.';
  END IF;

  IF p_fee_amount IS NULL OR p_fee_amount < 0 THEN
    RAISE EXCEPTION 'Transfer fee cannot be negative.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM transfer_groups
    WHERE id = p_transfer_group_id
      AND user_id = actor
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Transfer group not found.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM wallets
    WHERE id = p_from_wallet_id
      AND user_id = actor
      AND is_active = true
      AND is_archived = false
  ) THEN
    RAISE EXCEPTION 'Source wallet is unavailable.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM wallets
    WHERE id = p_to_wallet_id
      AND user_id = actor
      AND is_active = true
      AND is_archived = false
  ) THEN
    RAISE EXCEPTION 'Destination wallet is unavailable.';
  END IF;

  PERFORM set_config('app.finance_guard_bypass', 'on', true);

  UPDATE transfer_groups
  SET
    from_wallet_id = p_from_wallet_id,
    to_wallet_id = p_to_wallet_id,
    amount = p_amount,
    fee_amount = p_fee_amount,
    note = NULLIF(BTRIM(p_note), ''),
    transfer_date = COALESCE(p_transfer_date, CURRENT_DATE),
    deleted_at = NULL,
    updated_at = now()
  WHERE id = p_transfer_group_id;

  UPDATE transactions
  SET
    deleted_at = now(),
    updated_at = now()
  WHERE transfer_group_id = p_transfer_group_id
    AND deleted_at IS NULL;

  PERFORM public.insert_transfer_group_entries(
    p_transfer_group_id,
    actor,
    p_from_wallet_id,
    p_to_wallet_id,
    p_amount,
    p_fee_amount,
    p_note,
    COALESCE(p_transfer_date, CURRENT_DATE)
  );

  RETURN p_transfer_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.soft_delete_transfer_group(
  p_transfer_group_id UUID
)
RETURNS VOID AS $$
DECLARE
  actor UUID;
BEGIN
  actor := auth.uid();

  IF actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  PERFORM set_config('app.finance_guard_bypass', 'on', true);

  UPDATE transfer_groups
  SET
    deleted_at = COALESCE(deleted_at, now()),
    updated_at = now()
  WHERE id = p_transfer_group_id
    AND user_id = actor
    AND deleted_at IS NULL;

  UPDATE transactions
  SET
    deleted_at = COALESCE(deleted_at, now()),
    updated_at = now()
  WHERE transfer_group_id = p_transfer_group_id
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
