export interface WalletLedgerTransaction {
  amount: number;
  type: 'income' | 'expense';
  deleted_at?: string | null;
}

export function summarizeWalletFlows<TTransaction extends WalletLedgerTransaction>(transactions: TTransaction[]) {
  const activeTransactions = transactions.filter((transaction) => transaction.deleted_at == null);
  const incomeTotal = activeTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenseTotal = activeTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    activeTransactions,
    incomeTotal,
    expenseTotal,
    transactionCount: activeTransactions.length,
  };
}

export function computeWalletLedgerBalance<TTransaction extends WalletLedgerTransaction>(
  initialBalance: number,
  transactions: TTransaction[]
) {
  const { incomeTotal, expenseTotal } = summarizeWalletFlows(transactions);
  return initialBalance + incomeTotal - expenseTotal;
}
