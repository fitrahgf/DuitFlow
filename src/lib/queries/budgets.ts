import { createClient } from '@/lib/supabase/client';

export interface BudgetCategoryRef {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
}

export interface BudgetRecord {
  id: string;
  month_key: string;
  total_limit: number | null;
  amount_limit: number | null;
  category_id: string | null;
  categories?: BudgetCategoryRef | null;
}

export interface BudgetExpenseRecord {
  id: string;
  amount: number;
  category_id: string | null;
  transaction_date: string | null;
  date: string;
  categories?: BudgetCategoryRef | null;
}

export interface BudgetOverview {
  monthKey: string;
  budgets: BudgetRecord[];
  expenses: BudgetExpenseRecord[];
}

function getMonthRange(monthKey: string) {
  const [yearPart, monthPart] = monthKey.split('-');
  const year = Number(yearPart);
  const month = Number(monthPart) - 1;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export async function fetchBudgetOverview(monthKey: string): Promise<BudgetOverview> {
  const supabase = createClient();
  const { start, end } = getMonthRange(monthKey);

  const [budgetsResult, expensesResult] = await Promise.all([
    supabase
      .from('budgets')
      .select('id, month_key, total_limit, amount_limit, category_id, categories(id, name, color, icon)')
      .eq('month_key', monthKey)
      .order('created_at', { ascending: true }),
    supabase
      .from('transactions')
      .select('id, amount, category_id, transaction_date, date, categories(id, name, color, icon)')
      .eq('type', 'expense')
      .neq('source', 'system_transfer')
      .is('deleted_at', null)
      .gte('transaction_date', start)
      .lte('transaction_date', end),
  ]);

  if (budgetsResult.error) {
    throw budgetsResult.error;
  }

  if (expensesResult.error) {
    throw expensesResult.error;
  }

  return {
    monthKey,
    budgets: (budgetsResult.data ?? []) as BudgetRecord[],
    expenses: (expensesResult.data ?? []) as BudgetExpenseRecord[],
  };
}
