export interface SmartParserWalletOption {
  id: string;
  name: string;
}

export interface SmartParserCategoryOption {
  id: string;
  name: string;
  type?: 'income' | 'expense';
}

export interface ParsedInput {
  rawInput: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  walletId: string | null;
  walletName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  missing: Array<'title' | 'amount' | 'wallet'>;
  status: 'ready' | 'partial' | 'invalid';
  usedDefaultWallet: boolean;
}

const categoryKeywords: Record<string, string[]> = {
  Food: [
    'makan',
    'nasi',
    'ayam',
    'bakso',
    'sate',
    'soto',
    'rendang',
    'food',
    'lunch',
    'dinner',
    'breakfast',
    'snack',
    'kopi',
    'coffee',
    'teh',
    'tea',
    'jus',
    'juice',
    'minum',
    'drink',
    'cafe',
    'pizza',
    'burger',
    'roti',
    'milk',
    'martabak',
    'indomie',
    'mie',
  ],
  Transportation: [
    'bensin',
    'fuel',
    'gas',
    'pertamax',
    'pertalite',
    'toll',
    'tol',
    'parkir',
    'parking',
    'ojek',
    'gojek',
    'grab',
    'taxi',
    'taksi',
    'bus',
    'kereta',
    'train',
    'transport',
    'mrt',
    'lrt',
    'transjakarta',
  ],
  Bills: [
    'listrik',
    'electricity',
    'air',
    'water',
    'pln',
    'internet',
    'wifi',
    'pulsa',
    'token',
    'rent',
    'sewa',
    'cicilan',
    'kredit',
    'insurance',
    'asuransi',
    'tax',
    'pajak',
    'bill',
    'tagihan',
  ],
  Entertainment: [
    'nonton',
    'film',
    'movie',
    'bioskop',
    'cinema',
    'game',
    'spotify',
    'netflix',
    'youtube',
    'disney',
    'hiburan',
    'travel',
    'liburan',
    'vacation',
    'ticket',
    'tiket',
    'concert',
    'konser',
  ],
  Shopping: [
    'beli',
    'buy',
    'belanja',
    'shop',
    'shopping',
    'baju',
    'sepatu',
    'tas',
    'gadget',
    'phone',
    'hp',
    'laptop',
    'elektronik',
    'tokopedia',
    'shopee',
    'lazada',
    'amazon',
  ],
  Salary: ['gaji', 'salary', 'payroll'],
  Bonus: ['bonus', 'incentive', 'insentif'],
  Gift: ['gift', 'hadiah', 'cashback', 'reward'],
};

const incomeKeywords = ['gaji', 'salary', 'bonus', 'gift', 'hadiah', 'cashback', 'income', 'pemasukan'];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function detectType(input: string, amountToken: string | null) {
  const lowerInput = input.toLowerCase();

  if ((amountToken ?? '').trim().startsWith('+')) {
    return 'income';
  }

  if (incomeKeywords.some((keyword) => lowerInput.includes(keyword))) {
    return 'income';
  }

  return 'expense';
}

function parseAmount(input: string) {
  const amountRegex = /([+-]?)(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta)?/i;
  const match = input.match(amountRegex);

  if (!match) {
    return { amount: 0, token: null as string | null };
  }

  let amount = Number.parseFloat(match[2].replace(',', '.'));
  const suffix = (match[3] || '').toLowerCase();

  if (suffix === 'k' || suffix === 'rb' || suffix === 'ribu') {
    amount *= 1000;
  }

  if (suffix === 'jt' || suffix === 'juta') {
    amount *= 1000000;
  }

  return {
    amount: Math.round(amount),
    token: match[0],
  };
}

function findWallet(input: string, wallets: SmartParserWalletOption[]) {
  const lowerInput = input.toLowerCase();
  const sortedWallets = [...wallets].sort((left, right) => right.name.length - left.name.length);

  for (const wallet of sortedWallets) {
    const regex = new RegExp(`(?:^|\\s)${escapeRegExp(wallet.name.toLowerCase())}(?=\\s|$)`, 'i');
    const match = lowerInput.match(regex);

    if (match) {
      return {
        wallet,
        token: match[0].trim(),
      };
    }
  }

  return null;
}

function cleanTitle(rawInput: string, amountToken: string | null, walletToken: string | null) {
  let title = rawInput;

  if (amountToken) {
    title = title.replace(amountToken, ' ');
  }

  if (walletToken) {
    title = title.replace(new RegExp(`(?:^|\\s)${escapeRegExp(walletToken)}(?=\\s|$)`, 'i'), ' ');
  }

  return title.replace(/\s+/g, ' ').trim();
}

function findCategory(
  title: string,
  type: 'income' | 'expense',
  categories: SmartParserCategoryOption[]
) {
  const lowerTitle = title.toLowerCase();
  const eligibleCategories = categories.filter((category) => !category.type || category.type === type);

  for (const category of eligibleCategories) {
    if (lowerTitle.includes(category.name.toLowerCase())) {
      return category;
    }
  }

  for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((keyword) => lowerTitle.includes(keyword))) {
      return (
        eligibleCategories.find((category) => category.name.toLowerCase() === categoryName.toLowerCase()) ?? null
      );
    }
  }

  return null;
}

export function parseSmartInput(
  input: string,
  options: {
    wallets?: SmartParserWalletOption[];
    categories?: SmartParserCategoryOption[];
  } = {}
): ParsedInput {
  const trimmed = input.trim();
  const wallets = options.wallets ?? [];
  const categories = options.categories ?? [];
  const { amount, token: amountToken } = parseAmount(trimmed);
  const detectedType = detectType(trimmed, amountToken);
  const walletMatch = findWallet(trimmed, wallets);
  const fallbackWallet = !walletMatch && wallets.length === 1 ? wallets[0] : null;
  const wallet = walletMatch?.wallet ?? fallbackWallet;
  const title = cleanTitle(trimmed, amountToken, walletMatch?.token ?? null);
  const category = title ? findCategory(title, detectedType, categories) : null;

  const missing: Array<'title' | 'amount' | 'wallet'> = [];

  if (!title) {
    missing.push('title');
  }

  if (!amount) {
    missing.push('amount');
  }

  if (!wallet?.id) {
    missing.push('wallet');
  }

  const status =
    missing.length === 0 ? 'ready' : missing.length === 3 ? 'invalid' : 'partial';

  return {
    rawInput: trimmed,
    title,
    amount,
    type: detectedType,
    walletId: wallet?.id ?? null,
    walletName: wallet?.name ?? null,
    categoryId: category?.id ?? null,
    categoryName: category?.name ?? null,
    missing,
    status,
    usedDefaultWallet: Boolean(fallbackWallet),
  };
}
