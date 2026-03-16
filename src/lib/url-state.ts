import { normalizeCurrencyInput } from '@/lib/currency-input';
import type {
  TransactionFilters,
  TransactionPeriodFilter,
  TransactionSortOption,
  TransactionSourceFilter,
  TransactionTypeFilter,
} from '@/lib/queries/transactions';
import type { NotificationType } from '@/lib/queries/notifications';

export interface TransactionUrlState {
  q: string;
  type: TransactionTypeFilter;
  wallet: string;
  category: string;
  source: TransactionSourceFilter;
  period: TransactionPeriodFilter;
  from: string;
  to: string;
  min: string;
  max: string;
  sort: TransactionSortOption;
}

export interface ReportsUrlState {
  period: 'all' | 'month' | '30d' | '7d' | 'custom';
  wallet: string;
  category: string;
  from: string;
  to: string;
  keyword: string;
}

export interface NotificationsUrlState {
  scope: 'all' | 'unread' | 'read';
  type: NotificationType | 'all';
}

const transactionTypeValues = new Set<TransactionTypeFilter>(['all', 'income', 'expense', 'transfer']);
const transactionSourceValues = new Set<TransactionSourceFilter>([
  'all',
  'manual',
  'quick_add',
  'system_transfer',
  'wishlist_conversion',
]);
const transactionPeriodValues = new Set<TransactionPeriodFilter>(['all', 'month', '30d', '7d', 'custom']);
const transactionSortValues = new Set<TransactionSortOption>(['newest', 'oldest', 'highest', 'lowest']);
const reportPeriodValues = new Set<ReportsUrlState['period']>(['all', 'month', '30d', '7d', 'custom']);
const notificationScopeValues = new Set<NotificationsUrlState['scope']>(['all', 'unread', 'read']);
const notificationTypeValues = new Set<NotificationsUrlState['type']>([
  'all',
  'wishlist_due',
  'budget_warning',
  'budget_exceeded',
]);

function toSearchParams(searchParams: URLSearchParams | { toString(): string }) {
  return new URLSearchParams(searchParams.toString());
}

function normalizeEnumValue<T extends string>(value: string | null, validValues: Set<T>, fallback: T) {
  if (value && validValues.has(value as T)) {
    return value as T;
  }

  return fallback;
}

function normalizeDateValue(value: string | null) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') ? value ?? '' : '';
}

function normalizeTextValue(value: string | null) {
  return value?.trim() ?? '';
}

function setParam(params: URLSearchParams, key: string, value: string, defaultValue = '') {
  if (value && value !== defaultValue) {
    params.set(key, value);
  }
}

export function parseTransactionUrlState(searchParams: URLSearchParams | { toString(): string }): TransactionUrlState {
  const params = toSearchParams(searchParams);

  return {
    q: normalizeTextValue(params.get('q')),
    type: normalizeEnumValue(params.get('type'), transactionTypeValues, 'all'),
    wallet: normalizeTextValue(params.get('wallet')),
    category: normalizeTextValue(params.get('category')),
    source: normalizeEnumValue(params.get('source'), transactionSourceValues, 'all'),
    period: normalizeEnumValue(params.get('period'), transactionPeriodValues, 'all'),
    from: normalizeDateValue(params.get('from')),
    to: normalizeDateValue(params.get('to')),
    min: normalizeCurrencyInput(params.get('min') ?? ''),
    max: normalizeCurrencyInput(params.get('max') ?? ''),
    sort: normalizeEnumValue(params.get('sort'), transactionSortValues, 'newest'),
  };
}

export function transactionUrlStateToFilters(state: TransactionUrlState): TransactionFilters {
  return {
    search: state.q,
    type: state.type,
    walletId: state.wallet,
    categoryId: state.category,
    source: state.source,
    period: state.period,
    customFrom: state.from,
    customTo: state.to,
    minAmount: state.min,
    maxAmount: state.max,
    sort: state.sort,
  };
}

export function transactionFiltersToUrlState(filters: TransactionFilters): TransactionUrlState {
  return {
    q: normalizeTextValue(filters.search),
    type: filters.type,
    wallet: filters.walletId,
    category: filters.categoryId,
    source: filters.source,
    period: filters.period,
    from: filters.customFrom,
    to: filters.customTo,
    min: normalizeCurrencyInput(filters.minAmount),
    max: normalizeCurrencyInput(filters.maxAmount),
    sort: filters.sort,
  };
}

export function serializeTransactionUrlState(state: TransactionUrlState) {
  const params = new URLSearchParams();

  setParam(params, 'q', state.q);
  setParam(params, 'type', state.type, 'all');
  setParam(params, 'wallet', state.wallet);
  setParam(params, 'category', state.category);
  setParam(params, 'source', state.source, 'all');
  setParam(params, 'period', state.period, 'all');

  if (state.period === 'custom') {
    setParam(params, 'from', state.from);
    setParam(params, 'to', state.to);
  }

  setParam(params, 'min', state.min);
  setParam(params, 'max', state.max);
  setParam(params, 'sort', state.sort, 'newest');

  return params.toString();
}

export function parseReportsUrlState(searchParams: URLSearchParams | { toString(): string }): ReportsUrlState {
  const params = toSearchParams(searchParams);

  return {
    period: normalizeEnumValue(params.get('period'), reportPeriodValues, 'month'),
    wallet: normalizeTextValue(params.get('wallet')),
    category: normalizeTextValue(params.get('category')),
    from: normalizeDateValue(params.get('from')),
    to: normalizeDateValue(params.get('to')),
    keyword: normalizeTextValue(params.get('keyword')),
  };
}

export function serializeReportsUrlState(state: ReportsUrlState) {
  const params = new URLSearchParams();

  setParam(params, 'period', state.period, 'month');
  setParam(params, 'wallet', state.wallet);
  setParam(params, 'category', state.category);

  if (state.period === 'custom') {
    setParam(params, 'from', state.from);
    setParam(params, 'to', state.to);
  }

  setParam(params, 'keyword', state.keyword);

  return params.toString();
}

export function parseNotificationsUrlState(
  searchParams: URLSearchParams | { toString(): string }
): NotificationsUrlState {
  const params = toSearchParams(searchParams);

  return {
    scope: normalizeEnumValue(params.get('scope'), notificationScopeValues, 'all'),
    type: normalizeEnumValue(params.get('type'), notificationTypeValues, 'all'),
  };
}

export function serializeNotificationsUrlState(state: NotificationsUrlState) {
  const params = new URLSearchParams();

  setParam(params, 'scope', state.scope, 'all');
  setParam(params, 'type', state.type, 'all');

  return params.toString();
}
