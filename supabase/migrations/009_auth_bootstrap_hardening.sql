-- ============================================
-- DuitFlow - Auth bootstrap hardening
-- Ensures signup triggers keep working even when
-- older databases missed part of the rollout.
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Jakarta',
  ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT 'IDR',
  ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"wishlist_due": true, "budget_warning": true, "budget_exceeded": true}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE IF EXISTS public.profiles
  ALTER COLUMN preferred_language SET DEFAULT 'en',
  ALTER COLUMN timezone SET DEFAULT 'Asia/Jakarta',
  ALTER COLUMN currency_code SET DEFAULT 'IDR',
  ALTER COLUMN theme_preference SET DEFAULT 'system',
  ALTER COLUMN notification_preferences SET DEFAULT '{"wishlist_due": true, "budget_warning": true, "budget_exceeded": true}'::jsonb,
  ALTER COLUMN updated_at SET DEFAULT now();

UPDATE public.profiles
SET
  full_name = COALESCE(NULLIF(full_name, ''), display_name),
  preferred_language = COALESCE(NULLIF(preferred_language, ''), 'en'),
  timezone = COALESCE(NULLIF(timezone, ''), 'Asia/Jakarta'),
  currency_code = COALESCE(NULLIF(currency_code, ''), 'IDR'),
  theme_preference = CASE
    WHEN theme_preference IN ('light', 'dark', 'system') THEN theme_preference
    ELSE 'system'
  END,
  notification_preferences = COALESCE(
    notification_preferences,
    '{"wishlist_due": true, "budget_warning": true, "budget_exceeded": true}'::jsonb
  ),
  updated_at = COALESCE(updated_at, created_at, now());

ALTER TABLE IF EXISTS public.profiles
  DROP CONSTRAINT IF EXISTS profiles_theme_preference_check;

ALTER TABLE IF EXISTS public.profiles
  ADD CONSTRAINT profiles_theme_preference_check
  CHECK (theme_preference IN ('light', 'dark', 'system'));

ALTER TABLE IF EXISTS public.categories
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'expense',
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE IF EXISTS public.categories
  ALTER COLUMN user_id SET DEFAULT auth.uid(),
  ALTER COLUMN type SET DEFAULT 'expense',
  ALTER COLUMN is_archived SET DEFAULT false,
  ALTER COLUMN updated_at SET DEFAULT now();

UPDATE public.categories
SET
  type = CASE
    WHEN lower(name) IN ('gaji', 'salary', 'bonus', 'hadiah', 'gift', 'cashback')
      THEN 'income'
    ELSE COALESCE(NULLIF(type, ''), 'expense')
  END,
  is_archived = COALESCE(is_archived, false),
  updated_at = COALESCE(updated_at, created_at, now());

ALTER TABLE IF EXISTS public.categories
  DROP CONSTRAINT IF EXISTS categories_type_check;

ALTER TABLE IF EXISTS public.categories
  ADD CONSTRAINT categories_type_check
  CHECK (type IN ('income', 'expense'));

ALTER TABLE IF EXISTS public.wallets
  ADD COLUMN IF NOT EXISTS initial_balance INTEGER,
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE IF EXISTS public.wallets
  ALTER COLUMN user_id SET DEFAULT auth.uid(),
  ALTER COLUMN balance SET DEFAULT 0,
  ALTER COLUMN initial_balance SET DEFAULT 0,
  ALTER COLUMN is_archived SET DEFAULT false,
  ALTER COLUMN updated_at SET DEFAULT now();

UPDATE public.wallets
SET
  initial_balance = COALESCE(initial_balance, balance, 0),
  is_archived = COALESCE(is_archived, false),
  updated_at = COALESCE(updated_at, created_at, now());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  resolved_name TEXT;
BEGIN
  resolved_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
    NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
    'User'
  );

  INSERT INTO public.profiles (
    id,
    display_name,
    full_name,
    preferred_language,
    timezone,
    currency_code,
    theme_preference,
    notification_preferences
  )
  VALUES (
    NEW.id,
    resolved_name,
    resolved_name,
    'en',
    'Asia/Jakarta',
    'IDR',
    'system',
    '{"wishlist_due": true, "budget_warning": true, "budget_exceeded": true}'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_new_user_create_categories ON auth.users;
CREATE TRIGGER on_new_user_create_categories
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_categories();

DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON public.profiles;
CREATE TRIGGER on_auth_user_created_wallet
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_wallet();
