import { createClient } from '@/lib/supabase/client';

export interface ReportTransaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  title: string | null;
  note: string | null;
  date: string;
  created_at?: string | null;
  transaction_date?: string | null;
  transfer_group_id?: string | null;
  transfer_entry_kind?: 'out' | 'in' | 'fee' | null;
  source: 'manual' | 'quick_add' | 'system_transfer' | 'wishlist_conversion';
  category_id: string | null;
  wallet_id: string | null;
  categories?: { name: string; icon: string | null; color: string | null } | null;
  wallets?: {
    name: string;
    type: 'cash' | 'bank' | 'e-wallet' | 'other';
  } | null;
}

export interface ReportWalletSummary {
  id: string;
  name: string;
  balance: number;
  color: string | null;
  type: 'cash' | 'bank' | 'e-wallet' | 'other';
  is_active: boolean;
  is_archived: boolean;
}

export interface ReportsOverview {
  transactions: ReportTransaction[];
  wallets: ReportWalletSummary[];
}

export async function fetchReportsOverview(): Promise<ReportsOverview> {
  const supabase = createClient();

  const [transactionsResult, walletsResult] = await Promise.all([
    supabase
      .from('transactions')
      .select(
        'id, amount, type, title, note, date, created_at, transaction_date, transfer_group_id, transfer_entry_kind, source, category_id, wallet_id, categories(name, icon, color), wallets(name, type)'
      )
      .is('deleted_at', null)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.from('wallets').select('id, name, balance, color, type, is_active, is_archived').order('name'),
  ]);

  if (transactionsResult.error) {
    throw transactionsResult.error;
  }

  if (walletsResult.error) {
    throw walletsResult.error;
  }

  return {
    transactions: (transactionsResult.data ?? []) as ReportTransaction[],
    wallets: (walletsResult.data ?? []) as ReportWalletSummary[],
  };
}
