-- ============================================
-- DuitFlow - Function search_path hardening
-- Fixes Supabase linter warning 0011 by setting
-- an explicit search_path for security-sensitive
-- public functions.
-- ============================================

ALTER FUNCTION public.set_updated_at()
  SET search_path = public;

ALTER FUNCTION public.update_wallet_balance()
  SET search_path = public;

ALTER FUNCTION public.normalize_transaction_record()
  SET search_path = public;

ALTER FUNCTION public.compute_wallet_balance(UUID)
  SET search_path = public;

ALTER FUNCTION public.recalculate_wallet_balance(UUID)
  SET search_path = public;

ALTER FUNCTION public.sync_wallet_balance_from_transactions()
  SET search_path = public;

ALTER FUNCTION public.sync_wallet_balance_from_wallets()
  SET search_path = public;

ALTER FUNCTION public.insert_transfer_group_entries(UUID, UUID, UUID, UUID, INTEGER, INTEGER, TEXT, DATE)
  SET search_path = public;

ALTER FUNCTION public.create_transfer_group_with_entries(UUID, UUID, INTEGER, INTEGER, TEXT, DATE)
  SET search_path = public;

ALTER FUNCTION public.update_transfer_group_with_entries(UUID, UUID, UUID, INTEGER, INTEGER, TEXT, DATE)
  SET search_path = public;

ALTER FUNCTION public.soft_delete_transfer_group(UUID)
  SET search_path = public;

ALTER FUNCTION public.normalize_wishlist_record()
  SET search_path = public;
