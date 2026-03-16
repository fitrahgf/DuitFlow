-- Wallets Table
CREATE TABLE IF NOT EXISTS wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('cash', 'bank', 'e-wallet', 'other')) DEFAULT 'cash',
  balance INTEGER DEFAULT 0,
  color TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add wallet_id to transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES wallets;

-- Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Wallets
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

-- Update Transactions Policy (Ensure user owns the wallet they are using)
-- This is optional as the FK check and user_id check in transactions already covers basic security.

-- Function to create a default Cash wallet for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (user_id, name, type, color, icon, balance)
  VALUES (new.id, 'Cash', 'cash', 'hsl(145, 65%, 50%)', '💵', 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user profile
DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON profiles;
CREATE TRIGGER on_auth_user_created_wallet
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_wallet();

-- Function to update wallet balance on transaction
CREATE OR REPLACE FUNCTION public.update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle DELETION or UPDATE (old wallet)
  IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
    IF OLD.wallet_id IS NOT NULL THEN
      IF OLD.type = 'income' THEN
        UPDATE wallets SET balance = balance - OLD.amount WHERE id = OLD.wallet_id;
      ELSE
        UPDATE wallets SET balance = balance + OLD.amount WHERE id = OLD.wallet_id;
      END IF;
    END IF;
  END IF;

  -- Handle INSERT or UPDATE (new wallet)
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

-- Trigger for transactions
DROP TRIGGER IF EXISTS on_transaction_change_update_wallet ON transactions;
CREATE TRIGGER on_transaction_change_update_wallet
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_wallet_balance();
