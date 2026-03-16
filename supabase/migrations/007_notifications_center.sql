-- ============================================
-- DuitFlow - Notifications center hardening
-- Adds dedupe and update metadata for system-generated notifications.
-- ============================================

ALTER TABLE IF EXISTS notifications
  ADD COLUMN IF NOT EXISTS dedupe_key TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

UPDATE notifications
SET updated_at = COALESCE(updated_at, created_at, now());

CREATE INDEX IF NOT EXISTS notifications_user_type_idx
  ON notifications (user_id, type, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS notifications_user_dedupe_idx
  ON notifications (user_id, dedupe_key);

DROP TRIGGER IF EXISTS set_notifications_updated_at ON notifications;
CREATE TRIGGER set_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
