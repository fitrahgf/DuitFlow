-- ============================================
-- DuitFlow - Wishlist module hardening
-- Expands wishlist into a real review workflow with
-- richer statuses and purchase conversion support.
-- ============================================

ALTER TABLE IF EXISTS wishlist
  ADD COLUMN IF NOT EXISTS target_price INTEGER,
  ADD COLUMN IF NOT EXISTS note TEXT,
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS cooling_days INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS review_date DATE,
  ADD COLUMN IF NOT EXISTS selected_wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

UPDATE wishlist
SET
  target_price = COALESCE(target_price, price),
  start_date = COALESCE(start_date, created_at::date, CURRENT_DATE),
  cooling_days = COALESCE(
    cooling_days,
    GREATEST(1, COALESCE(unlock_date::date - COALESCE(created_at::date, CURRENT_DATE), 3))
  ),
  review_date = COALESCE(review_date, unlock_date::date, COALESCE(created_at::date, CURRENT_DATE) + 3),
  priority = COALESCE(NULLIF(priority, ''), 'medium'),
  updated_at = COALESCE(updated_at, created_at, now()),
  status = CASE status
    WHEN 'cooling' THEN 'pending_review'
    WHEN 'bought' THEN 'purchased'
    WHEN 'cancelled' THEN 'cancelled'
    ELSE COALESCE(status, 'pending_review')
  END;

ALTER TABLE IF EXISTS wishlist
  DROP CONSTRAINT IF EXISTS wishlist_status_check;

ALTER TABLE IF EXISTS wishlist
  ADD CONSTRAINT wishlist_status_check
  CHECK (status IN ('pending_review', 'approved_to_buy', 'cancelled', 'postponed', 'purchased'));

ALTER TABLE IF EXISTS wishlist
  DROP CONSTRAINT IF EXISTS wishlist_priority_check;

ALTER TABLE IF EXISTS wishlist
  ADD CONSTRAINT wishlist_priority_check
  CHECK (priority IN ('low', 'medium', 'high'));

ALTER TABLE IF EXISTS wishlist
  DROP CONSTRAINT IF EXISTS wishlist_cooling_days_check;

ALTER TABLE IF EXISTS wishlist
  ADD CONSTRAINT wishlist_cooling_days_check
  CHECK (cooling_days > 0);

CREATE INDEX IF NOT EXISTS wishlist_user_status_review_idx
  ON wishlist (user_id, status, review_date);

CREATE INDEX IF NOT EXISTS wishlist_user_wallet_idx
  ON wishlist (user_id, selected_wallet_id);

CREATE OR REPLACE FUNCTION public.normalize_wishlist_record()
RETURNS TRIGGER AS $$
BEGIN
  NEW.target_price = COALESCE(NEW.target_price, NEW.price);
  NEW.price = COALESCE(NEW.price, NEW.target_price);
  NEW.priority = COALESCE(NULLIF(BTRIM(NEW.priority), ''), 'medium');
  NEW.cooling_days = COALESCE(NEW.cooling_days, 3);
  NEW.start_date = COALESCE(NEW.start_date, CURRENT_DATE);
  NEW.review_date = COALESCE(NEW.review_date, NEW.start_date + NEW.cooling_days);
  NEW.unlock_date = COALESCE(NEW.unlock_date, NEW.review_date::timestamptz);
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS before_wishlist_normalize ON wishlist;
CREATE TRIGGER before_wishlist_normalize
  BEFORE INSERT OR UPDATE ON wishlist
  FOR EACH ROW EXECUTE FUNCTION public.normalize_wishlist_record();
