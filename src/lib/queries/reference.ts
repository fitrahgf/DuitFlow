import { createClient } from '@/lib/supabase/client';

export interface CategoryOption {
  id: string;
  name: string;
  icon: string | null;
  type?: 'income' | 'expense';
}

export interface WalletOption {
  id: string;
  name: string;
  icon: string | null;
  type: 'cash' | 'bank' | 'e-wallet' | 'other';
  is_active?: boolean;
  is_archived?: boolean;
}

export async function fetchCategories(type?: 'income' | 'expense') {
  const supabase = createClient();
  let query = supabase
    .from('categories')
    .select('id, name, icon, type')
    .eq('is_archived', false)
    .order('name');

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as CategoryOption[];
}

export async function fetchActiveWallets() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('wallets')
    .select('id, name, icon, type, is_active, is_archived')
    .eq('is_active', true)
    .eq('is_archived', false)
    .order('name');

  if (error) {
    throw error;
  }

  return (data ?? []) as WalletOption[];
}
