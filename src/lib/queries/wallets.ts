import { createClient } from '@/lib/supabase/client';
import { computeWalletLedgerBalance, summarizeWalletFlows } from '@/lib/walletBalance';

export interface WalletListItem {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'e-wallet' | 'other';
  balance: number;
  initial_balance: number;
  color: string | null;
  icon: string | null;
  is_active: boolean;
  is_archived: boolean;
  transaction_count: number;
  income_total: number;
  expense_total: number;
  last_transaction_date: string | null;
}

export interface WalletDetailTransaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  title: string | null;
  note: string | null;
  transaction_date: string | null;
  date: string;
  categories?: { name: string; icon: string } | null;
}

export interface WalletDetail {
  wallet: WalletListItem;
  transactions: WalletDetailTransaction[];
}

interface WalletRow {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'e-wallet' | 'other';
  balance: number;
  initial_balance?: number | null;
  color?: string | null;
  icon?: string | null;
  is_active?: boolean | null;
  is_archived?: boolean | null;
}

function buildWalletSummary<
  TWallet extends {
    id: string;
    name: string;
    type: 'cash' | 'bank' | 'e-wallet' | 'other';
    balance: number;
    initial_balance?: number | null;
    color?: string | null;
    icon?: string | null;
    is_active?: boolean | null;
    is_archived?: boolean | null;
  },
>( 
  wallets: TWallet[],
  transactions: WalletTransactionRow[]
): WalletListItem[] {
  return wallets.map((wallet) => {
    const walletTransactions = transactions.filter((transaction) => transaction.wallet_id === wallet.id);
    const { activeTransactions, incomeTotal, expenseTotal, transactionCount } =
      summarizeWalletFlows(walletTransactions);
    const computedBalance = computeWalletLedgerBalance(wallet.initial_balance ?? 0, walletTransactions);

    return {
      id: wallet.id,
      name: wallet.name,
      type: wallet.type,
      balance: Number.isFinite(wallet.balance) ? wallet.balance : computedBalance,
      initial_balance: wallet.initial_balance ?? 0,
      color: wallet.color ?? null,
      icon: wallet.icon ?? null,
      is_active: Boolean(wallet.is_active ?? true),
      is_archived: Boolean(wallet.is_archived ?? false),
      transaction_count: transactionCount,
      income_total: incomeTotal,
      expense_total: expenseTotal,
      last_transaction_date: activeTransactions[0] ? transactionDateFor(activeTransactions[0]) : null,
    };
  });
}

function transactionDateFor(transaction: WalletDetailTransaction) {
  return transaction.transaction_date || transaction.date;
}

type WalletTransactionRow = WalletDetailTransaction & { wallet_id: string };

export async function fetchWallets(view: 'active' | 'archived') {
  const supabase = createClient();
  const { data: wallets, error: walletsError } = await supabase
    .from('wallets')
    .select('id, name, type, balance, initial_balance, color, icon, is_active, is_archived')
    .eq('is_archived', view === 'archived')
    .order('created_at', { ascending: true });

  if (walletsError) {
    throw walletsError;
  }

  const walletRows = (wallets ?? []) as WalletRow[];

  if (walletRows.length === 0) {
    return [] as WalletListItem[];
  }

  const walletIds = walletRows.map((wallet) => wallet.id);
  const { data: transactions, error: transactionsError } = await supabase
    .from('transactions')
    .select('id, wallet_id, amount, type, title, note, transaction_date, date')
    .in('wallet_id', walletIds)
    .is('deleted_at', null)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (transactionsError) {
    throw transactionsError;
  }

  return buildWalletSummary(walletRows, (transactions ?? []) as WalletTransactionRow[]);
}

export async function fetchWalletDetail(walletId: string) {
  const supabase = createClient();
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('id, name, type, balance, initial_balance, color, icon, is_active, is_archived')
    .eq('id', walletId)
    .single();

  if (walletError) {
    throw walletError;
  }

  const { data: transactions, error: transactionsError } = await supabase
    .from('transactions')
    .select('id, wallet_id, amount, type, title, note, transaction_date, date, categories(name, icon)')
    .eq('wallet_id', walletId)
    .is('deleted_at', null)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (transactionsError) {
    throw transactionsError;
  }

  const walletSummary = buildWalletSummary(
    [(wallet as WalletRow)],
    (transactions ?? []) as WalletTransactionRow[]
  )[0];

  return {
    wallet: walletSummary,
    transactions: ((transactions ?? []) as WalletTransactionRow[])
      .slice(0, 10)
      .map(({ wallet_id, ...transaction }) => {
        void wallet_id;
        return transaction;
      }),
  } as WalletDetail;
}
