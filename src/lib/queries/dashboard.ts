import type { TransactionListItem } from '@/lib/queries/transactions';
import { createClient } from '@/lib/supabase/client';

export interface DashboardTransaction extends Omit<TransactionListItem, 'categories'> {
  categories?: { name: string; icon: string | null; color: string | null } | null;
}

export interface DashboardWalletSummary {
  id: string;
  name: string;
  balance: number;
  color: string | null;
  type: 'cash' | 'bank' | 'e-wallet' | 'other';
}

export interface DashboardBudgetRecord {
  id: string;
  total_limit: number | null;
  amount_limit: number | null;
  category_id: string | null;
  categories?: { name: string; color: string | null; icon: string | null } | null;
}

export interface DashboardWishlistItem {
  id: string;
  item_name: string;
  target_price: number | null;
  url: string | null;
  review_date: string;
  status: 'pending_review' | 'postponed';
}

export interface DashboardOverview {
  monthKey: string;
  transactions: DashboardTransaction[];
  wallets: DashboardWalletSummary[];
  budgets: DashboardBudgetRecord[];
  wishlist: DashboardWishlistItem[];
}

export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  const supabase = createClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [transactionsResult, walletsResult, budgetsResult, wishlistResult] = await Promise.all([
    supabase
      .from('transactions')
      .select(
        'id, amount, type, title, note, date, created_at, transaction_date, transfer_group_id, transfer_entry_kind, source, category_id, wallet_id, deleted_at, updated_at, categories(name, icon, color), wallets(name, type)'
      )
      .is('deleted_at', null)
      .gte('transaction_date', startOfMonth)
      .lte('transaction_date', endOfMonth)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('wallets')
      .select('id, name, balance, color, type')
      .eq('is_active', true)
      .eq('is_archived', false)
      .order('balance', { ascending: false }),
    supabase
      .from('budgets')
      .select('id, total_limit, amount_limit, category_id, categories(name, color, icon)')
      .eq('month_key', monthKey)
      .order('created_at', { ascending: true }),
    supabase
      .from('wishlist')
      .select('id, item_name, target_price, url, review_date, status')
      .in('status', ['pending_review', 'postponed'])
      .order('review_date', { ascending: true })
      .limit(6),
  ]);

  if (transactionsResult.error) {
    throw transactionsResult.error;
  }

  if (walletsResult.error) {
    throw walletsResult.error;
  }

  if (budgetsResult.error) {
    throw budgetsResult.error;
  }

  if (wishlistResult.error) {
    throw wishlistResult.error;
  }

  return {
    monthKey,
    transactions: (transactionsResult.data ?? []) as DashboardTransaction[],
    wallets: (walletsResult.data ?? []) as DashboardWalletSummary[],
    budgets: (budgetsResult.data ?? []) as DashboardBudgetRecord[],
    wishlist: (wishlistResult.data ?? []) as DashboardWishlistItem[],
  };
}
