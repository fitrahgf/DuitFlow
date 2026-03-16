-- ============================================
-- DuitFlow - Telegram bot integration
-- Adds account linking and transaction source
-- support for Telegram bot workflows.
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.telegram_connections (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_user_id TEXT NOT NULL UNIQUE,
  telegram_chat_id TEXT NOT NULL UNIQUE,
  telegram_username TEXT,
  telegram_first_name TEXT,
  telegram_last_name TEXT,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_interaction_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.telegram_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own telegram connection" ON public.telegram_connections;
CREATE POLICY "Users can view own telegram connection"
  ON public.telegram_connections FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own telegram connection" ON public.telegram_connections;
CREATE POLICY "Users can delete own telegram connection"
  ON public.telegram_connections FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_telegram_connections_updated_at ON public.telegram_connections;
CREATE TRIGGER set_telegram_connections_updated_at
  BEFORE UPDATE ON public.telegram_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.telegram_link_tokens (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_link_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own telegram link tokens" ON public.telegram_link_tokens;
CREATE POLICY "Users can view own telegram link tokens"
  ON public.telegram_link_tokens FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own telegram link tokens" ON public.telegram_link_tokens;
CREATE POLICY "Users can delete own telegram link tokens"
  ON public.telegram_link_tokens FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS telegram_link_tokens_user_idx
  ON public.telegram_link_tokens (user_id, expires_at DESC);

ALTER TABLE IF EXISTS public.transactions
  DROP CONSTRAINT IF EXISTS transactions_source_check;

ALTER TABLE IF EXISTS public.transactions
  ADD CONSTRAINT transactions_source_check
  CHECK (source IN ('manual', 'quick_add', 'system_transfer', 'wishlist_conversion', 'telegram_bot'));

CREATE OR REPLACE FUNCTION public.create_telegram_link_token()
RETURNS JSONB AS $$
DECLARE
  actor UUID := auth.uid();
  new_token TEXT;
  token_expiry TIMESTAMPTZ := now() + interval '15 minutes';
BEGIN
  IF actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  DELETE FROM public.telegram_link_tokens
  WHERE user_id = actor
    OR expires_at <= now()
    OR used_at IS NOT NULL;

  new_token := encode(extensions.gen_random_bytes(24), 'hex');

  INSERT INTO public.telegram_link_tokens (
    user_id,
    token_hash,
    expires_at
  )
  VALUES (
    actor,
    encode(extensions.digest(new_token, 'sha256'), 'hex'),
    token_expiry
  );

  RETURN jsonb_build_object(
    'token', new_token,
    'expires_at', token_expiry
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.create_telegram_link_token() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_telegram_link_token() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_telegram_link_token() TO service_role;
