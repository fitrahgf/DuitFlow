import { z } from 'zod';
import type { Language } from '@/lib/i18n/dictionaries';
import { getLocalDateInTimezone } from '@/lib/telegram/server';

export type ReceiptTransactionType = 'income' | 'expense';

export interface ReceiptWalletOption {
  id: string;
  name: string;
}

export interface ReceiptCategoryOption {
  id: string;
  name: string;
  type?: ReceiptTransactionType;
}

export interface ReceiptResolutionOptions {
  wallets: ReceiptWalletOption[];
  categories: ReceiptCategoryOption[];
  timezone: string;
  walletIdOverride?: string | null;
  categoryIdOverride?: string | null;
}

export interface ResolvedReceiptTransaction {
  isReceipt: boolean;
  title: string;
  amount: number;
  type: ReceiptTransactionType;
  transactionDate: string;
  walletId: string | null;
  walletName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  note: string | null;
  confidence: number | null;
  reason: string | null;
}

interface RawGroqReceiptResponse {
  is_receipt?: boolean;
  title?: string | null;
  amount?: number | string | null;
  type?: string | null;
  transaction_date?: string | null;
  wallet_name?: string | null;
  category_name?: string | null;
  note?: string | null;
  confidence?: number | string | null;
  reason?: string | null;
}

const GROQ_RESPONSES_URL = 'https://api.groq.com/openai/v1/responses';
const DEFAULT_GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
const rawReceiptResponseSchema = z
  .object({
    is_receipt: z.boolean().optional(),
    title: z.string().nullable().optional(),
    amount: z.union([z.number(), z.string()]).nullable().optional(),
    type: z.string().nullable().optional(),
    transaction_date: z.string().nullable().optional(),
    wallet_name: z.string().nullable().optional(),
    category_name: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
    confidence: z.union([z.number(), z.string()]).nullable().optional(),
    reason: z.string().nullable().optional(),
  })
  .passthrough();

const receiptJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'is_receipt',
    'title',
    'amount',
    'type',
    'transaction_date',
    'wallet_name',
    'category_name',
    'note',
    'confidence',
    'reason',
  ],
  properties: {
    is_receipt: { type: 'boolean' },
    title: { type: 'string' },
    amount: { type: 'integer', minimum: 0 },
    type: { type: 'string', enum: ['income', 'expense'] },
    transaction_date: {
      anyOf: [
        { type: 'string', pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' },
        { type: 'null' },
      ],
    },
    wallet_name: {
      anyOf: [{ type: 'string' }, { type: 'null' }],
    },
    category_name: {
      anyOf: [{ type: 'string' }, { type: 'null' }],
    },
    note: {
      anyOf: [{ type: 'string' }, { type: 'null' }],
    },
    confidence: {
      anyOf: [{ type: 'number', minimum: 0, maximum: 1 }, { type: 'null' }],
    },
    reason: {
      anyOf: [{ type: 'string' }, { type: 'null' }],
    },
  },
} as const;

function normalizeMatchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function clampConfidence(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return null;
  }

  return Math.min(1, Math.max(0, value));
}

function normalizeConfidence(value: number | string | null | undefined) {
  if (typeof value === 'number') {
    return clampConfidence(value);
  }

  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const parsed = Number.parseFloat(value.trim());
  return clampConfidence(parsed);
}

function normalizeAmount(value: number | string | null | undefined) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  }

  if (typeof value !== 'string' || !value.trim()) {
    return 0;
  }

  const sanitized = value.replace(/[^0-9.,-]/g, '').trim();

  if (!sanitized) {
    return 0;
  }

  const hasComma = sanitized.includes(',');
  const hasDot = sanitized.includes('.');
  let normalized = sanitized;

  if (hasComma && hasDot) {
    normalized = sanitized.replace(/[.,](?=.*[.,])/g, '');
    normalized = normalized.replace(',', '.');
  } else if (hasComma) {
    normalized = sanitized.replace(/\./g, '');
    normalized = normalized.replace(',', '.');
  } else {
    normalized = sanitized.replace(/,/g, '');
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
}

function normalizeTransactionType(value: string | null | undefined): ReceiptTransactionType {
  const normalized = value?.trim().toLowerCase();

  if (normalized === 'income' || normalized === 'pemasukan') {
    return 'income';
  }

  return 'expense';
}

function normalizeTitle(value: string | null | undefined) {
  return (value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

function normalizeOptionalNote(value: string | null | undefined) {
  const normalized = (value ?? '').replace(/\s+/g, ' ').trim();
  return normalized ? normalized.slice(0, 500) : null;
}

function normalizeTransactionDate(value: string | null | undefined, timezone: string) {
  const fallback = getLocalDateInTimezone(timezone);

  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return fallback;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? fallback : value;
}

function matchNamedOption<TOption extends { id: string; name: string }>(
  options: TOption[],
  hint: string | null | undefined
) {
  const normalizedHint = normalizeMatchText(hint ?? '');

  if (!normalizedHint) {
    return null;
  }

  const exactMatch =
    options.find((option) => normalizeMatchText(option.name) === normalizedHint) ?? null;

  if (exactMatch) {
    return exactMatch;
  }

  return (
    options.find((option) => {
      const normalizedName = normalizeMatchText(option.name);
      return normalizedName.includes(normalizedHint) || normalizedHint.includes(normalizedName);
    }) ?? null
  );
}

export function resolveReceiptTransaction(
  rawReceipt: RawGroqReceiptResponse,
  options: ReceiptResolutionOptions
): ResolvedReceiptTransaction {
  const parsed = rawReceiptResponseSchema.parse(rawReceipt);
  const type = normalizeTransactionType(parsed.type);
  const title = normalizeTitle(parsed.title);
  const amount = normalizeAmount(parsed.amount);
  const eligibleCategories = options.categories.filter(
    (category) => !category.type || category.type === type
  );

  const overrideWallet =
    options.walletIdOverride
      ? options.wallets.find((wallet) => wallet.id === options.walletIdOverride) ?? null
      : null;
  const matchedWallet =
    overrideWallet ??
    matchNamedOption(options.wallets, parsed.wallet_name) ??
    (options.wallets.length === 1 ? options.wallets[0] : null);

  const overrideCategory =
    options.categoryIdOverride
      ? eligibleCategories.find((category) => category.id === options.categoryIdOverride) ?? null
      : null;
  const matchedCategory =
    overrideCategory ?? matchNamedOption(eligibleCategories, parsed.category_name);

  return {
    isReceipt: Boolean(parsed.is_receipt),
    title,
    amount,
    type,
    transactionDate: normalizeTransactionDate(parsed.transaction_date, options.timezone),
    walletId: matchedWallet?.id ?? null,
    walletName: matchedWallet?.name ?? null,
    categoryId: matchedCategory?.id ?? null,
    categoryName: matchedCategory?.name ?? null,
    note: normalizeOptionalNote(parsed.note),
    confidence: normalizeConfidence(parsed.confidence),
    reason: normalizeOptionalNote(parsed.reason),
  };
}

function buildReceiptPrompt({
  caption,
  language,
  wallets,
  categories,
}: {
  caption: string;
  language: Language;
  wallets: ReceiptWalletOption[];
  categories: ReceiptCategoryOption[];
}) {
  const expenseCategories = categories
    .filter((category) => !category.type || category.type === 'expense')
    .map((category) => category.name);
  const incomeCategories = categories
    .filter((category) => category.type === 'income')
    .map((category) => category.name);

  return [
    language === 'id'
      ? 'Ekstrak satu transaksi keuangan dari gambar struk, nota, invoice, bukti transfer, atau bukti pembayaran.'
      : 'Extract one finance transaction from this receipt, invoice, payment proof, or transfer proof image.',
    language === 'id'
      ? 'Pilih tipe "expense" jika pemilik akun membayar uang. Pilih "income" jika pemilik akun menerima uang.'
      : 'Choose "expense" when the account owner paid money. Choose "income" when the account owner received money.',
    language === 'id'
      ? 'Gunakan grand total / total bayar / amount paid / amount received sebagai amount. Abaikan nomor referensi, pajak parsial, change, dan subtotal jika ada total final.'
      : 'Use the grand total / total paid / amount paid / amount received as the amount. Ignore reference numbers, partial tax rows, change, and subtotals when a final total exists.',
    language === 'id'
      ? 'Jika gambar bukan struk atau bukti transaksi yang masuk akal, set is_receipt=false dan amount=0.'
      : 'If the image is not a plausible receipt or transaction proof, set is_receipt=false and amount=0.',
    language === 'id'
      ? 'title harus singkat dan jelas, mis. nama merchant atau tujuan transaksi.'
      : 'title must be short and clear, such as the merchant or transaction purpose.',
    language === 'id'
      ? 'wallet_name harus null atau salah satu nama dompet yang tersedia jika benar-benar cocok.'
      : 'wallet_name must be null or exactly one of the available wallet names when clearly matched.',
    language === 'id'
      ? 'category_name harus null atau salah satu kategori yang tersedia jika benar-benar cocok.'
      : 'category_name must be null or exactly one of the available categories when clearly matched.',
    `Caption from user: ${caption || '(none)'}`,
    `Available wallets: ${wallets.length > 0 ? wallets.map((wallet) => wallet.name).join(', ') : '(none)'}`,
    `Available expense categories: ${expenseCategories.length > 0 ? expenseCategories.join(', ') : '(none)'}`,
    `Available income categories: ${incomeCategories.length > 0 ? incomeCategories.join(', ') : '(none)'}`,
  ].join('\n');
}

export async function extractReceiptTransactionFromImage({
  imageDataUrl,
  caption,
  language,
  wallets,
  categories,
  timezone,
  walletIdOverride,
  categoryIdOverride,
}: {
  imageDataUrl: string;
  caption: string;
  language: Language;
  wallets: ReceiptWalletOption[];
  categories: ReceiptCategoryOption[];
  timezone: string;
  walletIdOverride?: string | null;
  categoryIdOverride?: string | null;
}) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured.');
  }

  const model = process.env.GROQ_VISION_MODEL ?? DEFAULT_GROQ_VISION_MODEL;
  const response = await fetch(GROQ_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_output_tokens: 350,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: buildReceiptPrompt({ caption, language, wallets, categories }),
            },
            {
              type: 'input_image',
              detail: 'auto',
              image_url: imageDataUrl,
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'receipt_extraction',
          schema: receiptJsonSchema,
        },
      },
    }),
  });

  const payload = (await response.json()) as {
    output_text?: string;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message || 'Groq receipt extraction failed.');
  }

  if (!payload.output_text) {
    throw new Error('Groq receipt extraction returned no output.');
  }

  const parsed = JSON.parse(payload.output_text) as RawGroqReceiptResponse;

  return resolveReceiptTransaction(parsed, {
    wallets,
    categories,
    timezone,
    walletIdOverride,
    categoryIdOverride,
  });
}
