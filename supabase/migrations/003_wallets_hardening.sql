-- ============================================
-- DuitFlow - Wallet hardening for existing databases
-- Keeps wallet schema, policies, and triggers aligned after wallet rollout.
-- ============================================

ALTER TABLE IF EXISTS wallets
  DROP CONSTRAINT IF EXISTS wallets_user_id_fkey;

ALTER TABLE IF EXISTS wallets
  ADD CONSTRAINT wallets_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS transactions
  ADD COLUMN IF NOT EXISTS wallet_id UUID;

ALTER TABLE IF EXISTS transactions
  DROP CONSTRAINT IF EXISTS transactions_wallet_id_fkey;

ALTER TABLE IF EXISTS transactions
  ADD CONSTRAINT transactions_wallet_id_fkey
  FOREIGN KEY (wallet_id) REFERENCES wallets(id);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own wallets" ON wallets;
CREATE POLICY "Users can view their own wallets"
  ON wallets FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own wallets" ON wallets;
CREATE POLICY "Users can insert their own wallets"
  ON wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own wallets" ON wallets;
CREATE POLICY "Users can update their own wallets"
  ON wallets FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own wallets" ON wallets;
CREATE POLICY "Users can delete their own wallets"
  ON wallets FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (user_id, name, type, color, icon, balance)
  VALUES (new.id, 'Cash', 'cash', 'hsl(145, 65%, 50%)', '💵', 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON profiles;
CREATE TRIGGER on_auth_user_created_wallet
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_wallet();

CREATE OR REPLACE FUNCTION public.update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
    IF OLD.wallet_id IS NOT NULL THEN
      IF OLD.type = 'income' THEN
        UPDATE wallets SET balance = balance - OLD.amount WHERE id = OLD.wallet_id;
      ELSE
        UPDATE wallets SET balance = balance + OLD.amount WHERE id = OLD.wallet_id;
      END IF;
    END IF;
  END IF;

  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF NEW.wallet_id IS NOT NULL THEN
      IF NEW.type = 'income' THEN
        UPDATE wallets SET balance = balance + NEW.amount WHERE id = NEW.wallet_id;
      ELSE
        UPDATE wallets SET balance = balance - NEW.amount WHERE id = NEW.wallet_id;
      END IF;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_transaction_change_update_wallet ON transactions;
CREATE TRIGGER on_transaction_change_update_wallet
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_wallet_balance();
