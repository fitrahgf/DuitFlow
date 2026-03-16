-- ============================================
-- DuitFlow - Finance foundation hardening
-- Aligns schema with the PRD while preserving compatibility
-- with the current application rollout.
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================
-- Profiles enrichment
-- =========================
ALTER TABLE IF EXISTS profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Jakarta',
  ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT 'IDR',
  ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"wishlist_due": true, "budget_warning": true, "budget_exceeded": true}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

UPDATE profiles
SET
  full_name = COALESCE(NULLIF(full_name, ''), display_name),
  timezone = COALESCE(timezone, 'Asia/Jakarta'),
  currency_code = COALESCE(currency_code, 'IDR'),
  theme_preference = COALESCE(theme_preference, 'system'),
  updated_at = COALESCE(updated_at, created_at, now());

ALTER TABLE IF EXISTS profiles
  DROP CONSTRAINT IF EXISTS profiles_theme_preference_check;

ALTER TABLE IF EXISTS profiles
  ADD CONSTRAINT profiles_theme_preference_check
  CHECK (theme_preference IN ('light', 'dark', 'system'));

DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    display_name,
    full_name,
    timezone,
    currency_code,
    theme_preference
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    'Asia/Jakarta',
    'IDR',
    'system'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- Categories hardening
-- =========================
ALTER TABLE IF EXISTS categories
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'expense',
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

UPDATE categories
SET
  type = CASE
    WHEN lower(name) IN ('gaji', 'salary', 'bonus', 'hadiah', 'gift', 'cashback')
      THEN 'income'
    ELSE COALESCE(type, 'expense')
  END,
  is_archived = COALESCE(is_archived, false),
  updated_at = COALESCE(updated_at, created_at, now());

ALTER TABLE IF EXISTS categories
  DROP CONSTRAINT IF EXISTS categories_type_check;

ALTER TABLE IF EXISTS categories
  ADD CONSTRAINT categories_type_check
  CHECK (type IN ('income', 'expense'));

CREATE INDEX IF NOT EXISTS categories_user_archived_idx
  ON categories (user_id, type, is_archived);

DROP TRIGGER IF EXISTS set_categories_updated_at ON categories;
CREATE TRIGGER set_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, icon, color, is_default, type)
  SELECT
    NEW.id,
    defaults.name,
    defaults.icon,
    defaults.color,
    true,
    defaults.type
  FROM (
    VALUES
      ('Food', 'food', '#FF6B6B', 'expense'),
      ('Transportation', 'transport', '#4ECDC4', 'expense'),
      ('Bills', 'bill', '#45B7D1', 'expense'),
      ('Entertainment', 'game', '#96CEB4', 'expense'),
      ('Shopping', 'shopping', '#FFEAA7', 'expense'),
      ('Other', 'shopping', '#888888', 'expense'),
      ('Salary', 'income', '#22C55E', 'income'),
      ('Bonus', 'gift', '#84CC16', 'income'),
      ('Gift', 'gift', '#F59E0B', 'income')
  ) AS defaults(name, icon, color, type)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.categories existing
    WHERE existing.user_id = NEW.id
      AND lower(existing.name) = lower(defaults.name)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

INSERT INTO public.categories (user_id, name, icon, color, is_default, type, is_archived, created_at, updated_at)
SELECT
  users.id,
  defaults.name,
  defaults.icon,
  defaults.color,
  true,
  defaults.type,
  false,
  now(),
  now()
FROM auth.users AS users
CROSS JOIN (
  VALUES
    ('Salary', 'income', '#22C55E', 'income'),
    ('Bonus', 'gift', '#84CC16', 'income'),
    ('Gift', 'gift', '#F59E0B', 'income')
) AS defaults(name, icon, color, type)
WHERE NOT EXISTS (
  SELECT 1
  FROM categories
  WHERE categories.user_id = users.id
    AND lower(categories.name) = lower(defaults.name)
);

-- =========================
-- Wallets hardening
-- =========================
ALTER TABLE IF EXISTS wallets
  ADD COLUMN IF NOT EXISTS initial_balance INTEGER,
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

INSERT INTO wallets (user_id, name, type, color, icon, balance, initial_balance, is_active, is_archived)
SELECT
  users.id,
  'Cash',
  'cash',
  'hsl(145, 65%, 50%)',
  'cash',
  0,
  0,
  true,
  false
FROM auth.users AS users
WHERE NOT EXISTS (
  SELECT 1
  FROM wallets
  WHERE wallets.user_id = users.id
);

UPDATE wallets AS wallet
SET
  initial_balance = COALESCE(
    wallet.initial_balance,
    wallet.balance - COALESCE((
      SELECT SUM(
        CASE
          WHEN transactions.type = 'income' THEN transactions.amount
          ELSE -transactions.amount
        END
      )
      FROM transactions
      WHERE transactions.wallet_id = wallet.id
    ), 0),
    0
  ),
  is_archived = COALESCE(wallet.is_archived, false),
  updated_at = COALESCE(wallet.updated_at, wallet.created_at, now());

ALTER TABLE IF EXISTS wallets
  ALTER COLUMN initial_balance SET DEFAULT 0;

CREATE INDEX IF NOT EXISTS wallets_user_archived_idx
  ON wallets (user_id, is_archived, is_active);

DROP TRIGGER IF EXISTS set_wallets_updated_at ON wallets;
CREATE TRIGGER set_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (
    user_id,
    name,
    type,
    color,
    icon,
    balance,
    initial_balance,
    is_active,
    is_archived
  )
  SELECT
    NEW.id,
    'Cash',
    'cash',
    'hsl(145, 65%, 50%)',
    'cash',
    0,
    0,
    true,
    false
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.wallets
    WHERE wallets.user_id = NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- Transactions hardening
-- =========================
ALTER TABLE IF EXISTS transactions
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS subcategory_id UUID,
  ADD COLUMN IF NOT EXISTS transaction_date DATE,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS transfer_group_id UUID,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

UPDATE transactions
SET
  transaction_date = COALESCE(transaction_date, date, CURRENT_DATE),
  date = COALESCE(date, transaction_date, CURRENT_DATE),
  title = COALESCE(NULLIF(title, ''), NULLIF(note, ''), initcap(type), 'Transaction'),
  source = COALESCE(source, 'manual'),
  updated_at = COALESCE(updated_at, created_at, now());

WITH default_wallets AS (
  SELECT DISTINCT ON (wallets.user_id)
    wallets.user_id,
    wallets.id
  FROM wallets
  ORDER BY wallets.user_id, wallets.created_at
)
UPDATE transactions
SET wallet_id = default_wallets.id
FROM default_wallets
WHERE transactions.user_id = default_wallets.user_id
  AND transactions.wallet_id IS NULL;

ALTER TABLE IF EXISTS transactions
  DROP CONSTRAINT IF EXISTS transactions_source_check;

ALTER TABLE IF EXISTS transactions
  ADD CONSTRAINT transactions_source_check
  CHECK (source IN ('manual', 'quick_add', 'system_transfer', 'wishlist_conversion'));

ALTER TABLE IF EXISTS transactions
  ALTER COLUMN transaction_date SET DEFAULT CURRENT_DATE;

ALTER TABLE IF EXISTS transactions
  ALTER COLUMN source SET DEFAULT 'manual';

ALTER TABLE IF EXISTS transactions
  ALTER COLUMN wallet_id SET NOT NULL;

ALTER TABLE IF EXISTS transactions
  ALTER COLUMN title SET NOT NULL;

CREATE INDEX IF NOT EXISTS transactions_user_date_idx
  ON transactions (user_id, deleted_at, transaction_date DESC);

CREATE INDEX IF NOT EXISTS transactions_wallet_idx
  ON transactions (wallet_id, deleted_at, transaction_date DESC);

CREATE INDEX IF NOT EXISTS transactions_category_idx
  ON transactions (category_id, deleted_at);

CREATE OR REPLACE FUNCTION public.normalize_transaction_record()
RETURNS TRIGGER AS $$
BEGIN
  NEW.transaction_date = COALESCE(NEW.transaction_date, NEW.date, CURRENT_DATE);
  NEW.date = COALESCE(NEW.date, NEW.transaction_date, CURRENT_DATE);
  NEW.title = COALESCE(NULLIF(BTRIM(NEW.title), ''), NULLIF(BTRIM(NEW.note), ''), initcap(NEW.type), 'Transaction');
  NEW.source = COALESCE(NULLIF(BTRIM(NEW.source), ''), 'manual');
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS before_transactions_normalize ON transactions;
CREATE TRIGGER before_transactions_normalize
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION public.normalize_transaction_record();

-- =========================
-- Transfer groups
-- =========================
CREATE TABLE IF NOT EXISTS transfer_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  from_wallet_id UUID REFERENCES wallets(id) ON DELETE RESTRICT NOT NULL,
  to_wallet_id UUID REFERENCES wallets(id) ON DELETE RESTRICT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  fee_amount INTEGER NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
  note TEXT,
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CHECK (from_wallet_id <> to_wallet_id)
);

ALTER TABLE transfer_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own transfer groups" ON transfer_groups;
CREATE POLICY "Users can manage own transfer groups"
  ON transfer_groups FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS transfer_groups_user_date_idx
  ON transfer_groups (user_id, deleted_at, transfer_date DESC);

DROP TRIGGER IF EXISTS set_transfer_groups_updated_at ON transfer_groups;
CREATE TRIGGER set_transfer_groups_updated_at
  BEFORE UPDATE ON transfer_groups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE IF EXISTS transactions
  DROP CONSTRAINT IF EXISTS transactions_transfer_group_id_fkey;

ALTER TABLE IF EXISTS transactions
  ADD CONSTRAINT transactions_transfer_group_id_fkey
  FOREIGN KEY (transfer_group_id) REFERENCES transfer_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS transactions_transfer_group_idx
  ON transactions (transfer_group_id);

-- =========================
-- Budgets
-- =========================
CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  month_key TEXT NOT NULL,
  total_limit INTEGER CHECK (total_limit IS NULL OR total_limit > 0),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  amount_limit INTEGER CHECK (amount_limit IS NULL OR amount_limit > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (month_key ~ '^[0-9]{4}-[0-9]{2}$'),
  CHECK (total_limit IS NOT NULL OR amount_limit IS NOT NULL)
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own budgets" ON budgets;
CREATE POLICY "Users can manage own budgets"
  ON budgets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS budgets_user_month_category_idx
  ON budgets (user_id, month_key, COALESCE(category_id, '00000000-0000-0000-0000-000000000000'::uuid));

DROP TRIGGER IF EXISTS set_budgets_updated_at ON budgets;
CREATE TRIGGER set_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- Notifications
-- =========================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (priority IN ('critical', 'important', 'info'))
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;
CREATE POLICY "Users can manage own notifications"
  ON notifications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notifications_user_state_idx
  ON notifications (user_id, is_read, created_at DESC);

-- =========================
-- Wallet balance recalculation based on ledger
-- =========================
CREATE OR REPLACE FUNCTION public.compute_wallet_balance(target_wallet_id UUID)
RETURNS INTEGER AS $$
DECLARE
  computed_balance INTEGER;
BEGIN
  SELECT
    COALESCE(wallets.initial_balance, 0)
    + COALESCE(SUM(
      CASE
        WHEN transactions.type = 'income' THEN transactions.amount
        WHEN transactions.type = 'expense' THEN -transactions.amount
        ELSE 0
      END
    ), 0)
  INTO computed_balance
  FROM wallets
  LEFT JOIN transactions
    ON transactions.wallet_id = wallets.id
    AND transactions.deleted_at IS NULL
  WHERE wallets.id = target_wallet_id
  GROUP BY wallets.id, wallets.initial_balance;

  RETURN COALESCE(computed_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.recalculate_wallet_balance(target_wallet_id UUID)
RETURNS VOID AS $$
BEGIN
  IF target_wallet_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE wallets
  SET balance = public.compute_wallet_balance(target_wallet_id)
  WHERE id = target_wallet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.sync_wallet_balance_from_transactions()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    PERFORM public.recalculate_wallet_balance(OLD.wallet_id);
  END IF;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.recalculate_wallet_balance(NEW.wallet_id);
  ELSIF TG_OP = 'UPDATE' AND NEW.wallet_id IS DISTINCT FROM OLD.wallet_id THEN
    PERFORM public.recalculate_wallet_balance(NEW.wallet_id);
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_transaction_change_update_wallet ON transactions;
CREATE TRIGGER on_transaction_change_update_wallet
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION public.sync_wallet_balance_from_transactions();

CREATE OR REPLACE FUNCTION public.sync_wallet_balance_from_wallets()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.recalculate_wallet_balance(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_wallet_change_recalculate_balance ON wallets;
CREATE TRIGGER on_wallet_change_recalculate_balance
  AFTER INSERT OR UPDATE OF initial_balance ON wallets
  FOR EACH ROW EXECUTE FUNCTION public.sync_wallet_balance_from_wallets();

DO $$
DECLARE
  wallet_record RECORD;
BEGIN
  FOR wallet_record IN SELECT id FROM wallets LOOP
    PERFORM public.recalculate_wallet_balance(wallet_record.id);
  END LOOP;
END $$;
