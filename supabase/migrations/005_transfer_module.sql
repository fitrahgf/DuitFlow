-- ============================================
-- DuitFlow - Transfer module procedures
-- Adds transfer-specific entry metadata and atomic RPC helpers.
-- ============================================

ALTER TABLE IF EXISTS transactions
  ADD COLUMN IF NOT EXISTS transfer_entry_kind TEXT;

ALTER TABLE IF EXISTS transactions
  DROP CONSTRAINT IF EXISTS transactions_transfer_entry_kind_check;

ALTER TABLE IF EXISTS transactions
  ADD CONSTRAINT transactions_transfer_entry_kind_check
  CHECK (
    transfer_entry_kind IS NULL
    OR transfer_entry_kind IN ('out', 'in', 'fee')
  );

CREATE INDEX IF NOT EXISTS transactions_transfer_entry_kind_idx
  ON transactions (transfer_group_id, transfer_entry_kind, deleted_at);

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

CREATE OR REPLACE FUNCTION public.create_transfer_group_with_entries(
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
  new_transfer_group_id UUID;
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

  new_transfer_group_id := gen_random_uuid();

  INSERT INTO transfer_groups (
    id,
    user_id,
    from_wallet_id,
    to_wallet_id,
    amount,
    fee_amount,
    note,
    transfer_date
  )
  VALUES (
    new_transfer_group_id,
    actor,
    p_from_wallet_id,
    p_to_wallet_id,
    p_amount,
    p_fee_amount,
    NULLIF(BTRIM(p_note), ''),
    COALESCE(p_transfer_date, CURRENT_DATE)
  );

  PERFORM public.insert_transfer_group_entries(
    new_transfer_group_id,
    actor,
    p_from_wallet_id,
    p_to_wallet_id,
    p_amount,
    p_fee_amount,
    p_note,
    COALESCE(p_transfer_date, CURRENT_DATE)
  );

  RETURN new_transfer_group_id;
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
