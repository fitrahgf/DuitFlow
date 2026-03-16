import { getTransactionDisplayDate, type TransactionDisplayItem } from '@/lib/transactionFeed';

export interface ExportTransactionCsvRow {
  date: string;
  kind: 'transaction' | 'transfer';
  type: 'income' | 'expense' | 'transfer';
  title: string;
  amount: number;
  currency_code: string;
  wallet: string;
  category: string;
  source: string;
  note: string;
}

const exportTransactionColumns: Array<keyof ExportTransactionCsvRow> = [
  'date',
  'kind',
  'type',
  'title',
  'amount',
  'currency_code',
  'wallet',
  'category',
  'source',
  'note',
];

function escapeCsvValue(value: unknown) {
  const normalizedValue = String(value ?? '');

  if (/[",\r\n]/.test(normalizedValue)) {
    return `"${normalizedValue.replace(/"/g, '""')}"`;
  }

  return normalizedValue;
}

export function buildCsvContent<T extends object>(
  rows: T[],
  columns: Array<keyof T>
) {
  const header = columns.join(',');
  const dataRows = rows.map((row) => columns.map((column) => escapeCsvValue(row[column])).join(','));

  return `\uFEFF${[header, ...dataRows].join('\r\n')}`;
}

export function buildTransactionCsvRows(
  transactions: TransactionDisplayItem[],
  currencyCode: string
): ExportTransactionCsvRow[] {
  return transactions.map((transaction) => {
    if (transaction.kind === 'transfer') {
      return {
        date: getTransactionDisplayDate(transaction),
        kind: 'transfer',
        type: 'transfer',
        title: transaction.title,
        amount: transaction.amount,
        currency_code: currencyCode,
        wallet: `${transaction.fromWalletName} -> ${transaction.toWalletName}`,
        category: '',
        source: transaction.source,
        note: transaction.note ?? '',
      };
    }

    return {
      date: getTransactionDisplayDate(transaction),
      kind: 'transaction',
      type: transaction.type,
      title: transaction.title ?? transaction.note ?? '',
      amount: transaction.amount,
      currency_code: currencyCode,
      wallet: transaction.wallets?.name ?? '',
      category: transaction.categories?.name ?? '',
      source: transaction.source,
      note: transaction.note ?? '',
    };
  });
}

export function buildTransactionCsvContent(rows: ExportTransactionCsvRow[]) {
  return buildCsvContent(rows, exportTransactionColumns);
}

export function downloadCsvFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(objectUrl);
}
