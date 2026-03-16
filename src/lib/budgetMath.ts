export type BudgetTone = 'ok' | 'warning' | 'danger';

export interface BudgetLike {
  category_id: string | null;
  total_limit?: number | null;
  amount_limit?: number | null;
}

export interface ExpenseLike {
  amount: number;
  category_id: string | null;
}

export function getBudgetTone(ratio: number): BudgetTone {
  if (ratio >= 1) {
    return 'danger';
  }

  if (ratio >= 0.8) {
    return 'warning';
  }

  return 'ok';
}

export function sumSpentForCategory<TExpense extends ExpenseLike>(
  categoryId: string,
  expenses: TExpense[]
) {
  return expenses
    .filter((expense) => expense.category_id === categoryId)
    .reduce((sum, expense) => sum + expense.amount, 0);
}

export function summarizeBudgetUsage<TBudget extends BudgetLike, TExpense extends ExpenseLike>(
  budgets: TBudget[],
  expenses: TExpense[]
) {
  const globalBudget = budgets.find((budget) => budget.category_id === null && Boolean(budget.total_limit)) ?? null;
  const categoryBudgets = budgets.filter((budget) => budget.category_id !== null && Boolean(budget.amount_limit));
  const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const overallLimit =
    globalBudget?.total_limit ??
    categoryBudgets.reduce((sum, budget) => sum + (budget.amount_limit ?? 0), 0);
  const overallSpent = globalBudget
    ? totalExpense
    : categoryBudgets.reduce(
        (sum, budget) => sum + sumSpentForCategory(budget.category_id!, expenses),
        0
      );
  const remaining = Math.max(overallLimit - overallSpent, 0);
  const ratio = overallLimit > 0 ? overallSpent / overallLimit : 0;

  return {
    globalBudget,
    categoryBudgets,
    totalExpense,
    overallLimit,
    overallSpent,
    remaining,
    ratio,
    tone: getBudgetTone(ratio),
  };
}
