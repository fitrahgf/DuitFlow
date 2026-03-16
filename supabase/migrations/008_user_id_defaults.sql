-- ============================================
-- DuitFlow - User ownership defaults for RLS tables
-- Ensures inserts from authenticated clients satisfy
-- row-level security even when user_id is omitted.
-- ============================================

ALTER TABLE IF EXISTS categories
  ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE IF EXISTS wallets
  ALTER COLUMN user_id SET DEFAULT auth.uid();
