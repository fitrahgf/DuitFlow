export type SuggestionLanguage = 'auto' | 'en' | 'id';
export type SuggestionTransactionType = 'income' | 'expense';

export interface SuggestionTransactionLike {
  title: string | null;
  type: SuggestionTransactionType;
  category_id: string | null;
  wallet_id: string | null;
  transaction_date: string | null;
  created_at: string | null;
}

export interface SmartSuggestion {
  id: string;
  label: string;
  score: number;
}

type SuggestionEntry = {
  tokens: Set<string>;
  type: SuggestionTransactionType;
  categoryId: string | null;
  walletId: string | null;
  date: Date | null;
};

export interface SuggestionModel {
  entries: SuggestionEntry[];
  categoryHistoryCount: number;
  walletHistoryCount: number;
  language: SuggestionLanguage;
  now: Date;
}

export interface BuildSuggestionModelOptions {
  language?: SuggestionLanguage;
  now?: Date;
  txLimit?: number;
}

export interface SuggestionOptions {
  topK: number;
  minHistory: number;
  minSimilarity: number;
  minTopScore: number;
  decayDays: number;
}

const DEFAULT_SUGGESTION_OPTIONS: SuggestionOptions = {
  topK: 3,
  minHistory: 10,
  minSimilarity: 0.2,
  minTopScore: 0.35,
  decayDays: 30,
};

const AMOUNT_SUFFIXES = new Set(['k', 'rb', 'ribu', 'jt', 'juta', 'm', 'million', 'millions']);
const CURRENCY_TOKENS = new Set(['rp', 'idr', 'usd', 'sgd', 'aud', 'eur', 'gbp', 'jpy']);

const STOPWORDS_EN = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'to',
  'from',
  'for',
  'of',
  'in',
  'on',
  'at',
  'with',
  'without',
  'this',
  'that',
  'these',
  'those',
  'my',
  'your',
  'our',
  'their',
  'me',
  'you',
  'it',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'paid',
  'pay',
  'payment',
]);

const STOPWORDS_ID = new Set([
  'dan',
  'atau',
  'di',
  'ke',
  'dari',
  'untuk',
  'dengan',
  'tanpa',
  'yang',
  'ini',
  'itu',
  'aja',
  'nih',
  'via',
  'pake',
  'pakai',
  'buat',
  'dgn',
]);

function buildStopwords(language: SuggestionLanguage) {
  if (language === 'en') {
    return STOPWORDS_EN;
  }

  if (language === 'id') {
    return STOPWORDS_ID;
  }

  return new Set([...STOPWORDS_EN, ...STOPWORDS_ID]);
}

function parseSuggestionDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function toUtcDay(value: Date) {
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
}

function diffDaysUtc(now: Date, past: Date) {
  const dayMs = 24 * 60 * 60 * 1000;
  const delta = Math.floor((toUtcDay(now) - toUtcDay(past)) / dayMs);
  return Math.max(0, delta);
}

function jaccard(left: Set<string>, right: Set<string>) {
  if (left.size === 0 || right.size === 0) {
    return 0;
  }

  let intersection = 0;
  for (const token of left) {
    if (right.has(token)) {
      intersection += 1;
    }
  }

  const union = left.size + right.size - intersection;
  if (union <= 0) {
    return 0;
  }

  return intersection / union;
}

export function tokenizeTitle(title: string, language: SuggestionLanguage = 'auto') {
  const stopwords = buildStopwords(language);
  const normalized = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  if (!normalized) {
    return [];
  }

  const tokens = normalized
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  const unique = new Set<string>();

  for (const token of tokens) {
    if (token.length <= 1) {
      continue;
    }

    if (stopwords.has(token)) {
      continue;
    }

    if (CURRENCY_TOKENS.has(token) || AMOUNT_SUFFIXES.has(token)) {
      continue;
    }

    if (/\d/.test(token)) {
      continue;
    }

    unique.add(token);
  }

  return [...unique];
}

export function buildSuggestionModel(
  transactions: SuggestionTransactionLike[],
  options: BuildSuggestionModelOptions = {}
): SuggestionModel {
  const language = options.language ?? 'auto';
  const now = options.now ?? new Date();
  const txLimit = Math.max(1, Math.min(300, Number.isFinite(options.txLimit) ? (options.txLimit ?? 300) : 300));

  let categoryHistoryCount = 0;
  let walletHistoryCount = 0;

  const entries: SuggestionEntry[] = [];

  for (const transaction of transactions.slice(0, txLimit)) {
    const title = transaction.title?.trim() ?? '';
    if (!title) {
      continue;
    }

    const tokens = tokenizeTitle(title, language);
    if (tokens.length === 0) {
      continue;
    }

    const entry: SuggestionEntry = {
      tokens: new Set(tokens),
      type: transaction.type,
      categoryId: transaction.category_id,
      walletId: transaction.wallet_id,
      date: parseSuggestionDate(transaction.transaction_date) ?? parseSuggestionDate(transaction.created_at),
    };

    if (entry.categoryId) {
      categoryHistoryCount += 1;
    }

    if (entry.walletId) {
      walletHistoryCount += 1;
    }

    entries.push(entry);
  }

  return {
    entries,
    categoryHistoryCount,
    walletHistoryCount,
    language,
    now,
  };
}

function mergeOptions(overrides?: Partial<SuggestionOptions>) {
  return { ...DEFAULT_SUGGESTION_OPTIONS, ...(overrides ?? {}) };
}

function suggestFromHistory(
  model: SuggestionModel,
  inputTitle: string,
  type: SuggestionTransactionType,
  getCandidateId: (entry: SuggestionEntry) => string | null,
  labelById: Record<string, string>,
  overrides?: Partial<SuggestionOptions>
) {
  const options = mergeOptions(overrides);
  const normalizedTitle = inputTitle.trim();

  if (!normalizedTitle) {
    return [] as SmartSuggestion[];
  }

  const inputTokensArray = tokenizeTitle(normalizedTitle, model.language);
  if (inputTokensArray.length === 0) {
    return [] as SmartSuggestion[];
  }

  const inputTokens = new Set(inputTokensArray);
  const scores = new Map<string, number>();
  const now = model.now;

  for (const entry of model.entries) {
    if (entry.type !== type) {
      continue;
    }

    const candidateId = getCandidateId(entry);
    if (!candidateId || !labelById[candidateId]) {
      continue;
    }

    const similarity = jaccard(inputTokens, entry.tokens);
    if (similarity < options.minSimilarity) {
      continue;
    }

    const daysSince = entry.date ? diffDaysUtc(now, entry.date) : 0;
    const weight = Math.exp(-daysSince / options.decayDays);
    const contribution = similarity * weight;
    scores.set(candidateId, (scores.get(candidateId) ?? 0) + contribution);
  }

  const ranked = [...scores.entries()]
    .map(([id, score]) => ({ id, score, label: labelById[id] }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.label.localeCompare(right.label);
    });

  const topScore = ranked[0]?.score ?? 0;
  if (topScore < options.minTopScore) {
    return [] as SmartSuggestion[];
  }

  return ranked.slice(0, options.topK).map((item) => ({ id: item.id, label: item.label, score: item.score }));
}

export function suggestCategory(
  model: SuggestionModel,
  inputTitle: string,
  type: SuggestionTransactionType,
  categoryLabelById: Record<string, string>,
  overrides?: Partial<SuggestionOptions>
) {
  const options = mergeOptions(overrides);

  if (model.categoryHistoryCount < options.minHistory) {
    return [] as SmartSuggestion[];
  }

  return suggestFromHistory(
    model,
    inputTitle,
    type,
    (entry) => entry.categoryId,
    categoryLabelById,
    overrides
  );
}

export function suggestWallet(
  model: SuggestionModel,
  inputTitle: string,
  type: SuggestionTransactionType,
  walletLabelById: Record<string, string>,
  overrides?: Partial<SuggestionOptions>
) {
  const options = mergeOptions(overrides);

  if (model.walletHistoryCount < options.minHistory) {
    return [] as SmartSuggestion[];
  }

  return suggestFromHistory(
    model,
    inputTitle,
    type,
    (entry) => entry.walletId,
    walletLabelById,
    overrides
  );
}

