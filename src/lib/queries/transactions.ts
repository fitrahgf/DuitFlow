import { createClient } from '@/lib/supabase/client';

export type TransactionTypeFilter = 'all' | 'income' | 'expense' | 'transfer';
export type TransactionPeriodFilter = 'all' | 'month' | '30d' | '7d' | 'custom';
export type TransactionSourceFilter =
  | 'all'
  | 'manual'
  | 'quick_add'
  | 'system_transfer'
  | 'wishlist_conversion';
export type TransactionSortOption = 'newest' | 'oldest' | 'highest' | 'lowest';

export interface TransactionFilters {
  search: string;
  type: TransactionTypeFilter;
  walletId: string;
  categoryId: string;
  period: TransactionPeriodFilter;
  customFrom: string;
  customTo: string;
  source: TransactionSourceFilter;
  minAmount: string;
  maxAmount: string;
  sort: TransactionSortOption;
}

export const defaultTransactionFilters: TransactionFilters = {
  search: '',
  type: 'all',
  walletId: '',
  categoryId: '',
  period: 'all',
  customFrom: '',
  customTo: '',
  source: 'all',
  minAmount: '',
  maxAmount: '',
  sort: 'newest',
};

export interface TransactionListItem {
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
  source: Exclude<TransactionSourceFilter, 'all'>;
  category_id: string | null;
  wallet_id: string | null;
  deleted_at?: string | null;
  updated_at?: string | null;
  categories?: { name: string; icon: string | null } | null;
  wallets?: {
    name: string;
    type: 'cash' | 'bank' | 'e-wallet' | 'other';
  } | null;
}

export async function fetchTransactions() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('transactions')
    .select(
      'id, amount, type, title, note, date, created_at, transaction_date, transfer_group_id, transfer_entry_kind, source, category_id, wallet_id, deleted_at, updated_at, categories(name, icon), wallets(name, type)'
    )
    .is('deleted_at', null)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as TransactionListItem[];
}

export interface SuggestionTransactionItem {
  title: string | null;
  type: 'income' | 'expense';
  category_id: string | null;
  wallet_id: string | null;
  transaction_date: string | null;
  created_at: string | null;
}

export async function fetchRecentLabeledTransactionsForSuggestions(limit: number = 300) {
  const supabase = createClient();

  const normalizedLimit = Math.max(1, Math.min(300, Number.isFinite(limit) ? limit : 300));

  const { data, error } = await supabase
    .from('transactions')
    .select('title, type, category_id, wallet_id, transaction_date, created_at')
    .is('deleted_at', null)
    .is('transfer_group_id', null)
    .not('title', 'is', null)
    .neq('title', '')
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(normalizedLimit);

  if (error) {
    throw error;
  }

  return (data ?? []) as SuggestionTransactionItem[];
}
