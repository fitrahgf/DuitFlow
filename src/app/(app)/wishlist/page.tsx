'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { addDays, differenceInCalendarDays, parseISO } from 'date-fns';
import { useEffect, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle,
  Clock3,
  ExternalLink,
  Pencil,
  ShoppingBasket,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { useCurrencyPreferences } from '@/components/CurrencyPreferencesProvider';
import TransactionForm, { type TransactionFormPrefill } from '@/components/TransactionForm';
import { EmptyState } from '@/components/shared/EmptyState';
import { FieldError } from '@/components/shared/FieldError';
import { useLanguage } from '@/components/LanguageProvider';
import {
  MetricCard,
  PageHeader,
  PageHeaderActions,
  PageHeading,
  PageShell,
  ProgressMeter,
  SectionHeading,
  SurfaceCard,
} from '@/components/shared/PagePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CurrencyInput } from '@/components/ui/currency-input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { NOTIFICATIONS_REFRESH_EVENT } from '@/lib/events';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/queries/keys';
import { fetchActiveWallets } from '@/lib/queries/reference';
import { fetchWishlistItems, type WishlistItem } from '@/lib/queries/wishlist';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import {
  wishlistFormSchema,
  wishlistReviewSchema,
  type WishlistFormInput,
  type WishlistFormValues,
  type WishlistReviewInput,
  type WishlistReviewValues,
} from '@/lib/validators/wishlist';

type WishlistTab =
  | 'all'
  | 'due'
  | 'pending'
  | 'approved'
  | 'postponed'
  | 'purchased'
  | 'cancelled';

function toDateInputValue(value: Date) {
  return value.toISOString().split('T')[0];
}

function formatDate(value: string, language: 'en' | 'id') {
  return new Date(value).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getWishlistDefaults(item?: WishlistItem | null): WishlistFormInput {
  return {
    item_name: item?.item_name ?? '',
    target_price: item?.target_price ?? undefined,
    url: item?.url ?? '',
    note: item?.note ?? '',
    priority: item?.priority ?? 'medium',
    reason: item?.reason ?? '',
    cooling_days: String(item?.cooling_days ?? 3) as '3' | '5' | '7',
    selected_wallet_id: item?.selected_wallet_id ?? '',
  };
}

function getReviewDefaults(): WishlistReviewInput {
  return {
    next_status: 'approved_to_buy',
    postpone_days: '3',
  };
}

function isReviewDue(item: WishlistItem) {
  if (item.status !== 'pending_review' && item.status !== 'postponed') return false;
  return differenceInCalendarDays(parseISO(item.review_date), new Date()) <= 0;
}

function getCountdownLabel(item: WishlistItem, language: 'en' | 'id') {
  const difference = differenceInCalendarDays(parseISO(item.review_date), new Date());

  if (item.status === 'approved_to_buy') return language === 'id' ? 'Siap dikonversi' : 'Ready to convert';
  if (difference <= 0) return language === 'id' ? 'Siap ditinjau' : 'Ready to review';
  if (difference === 1) return language === 'id' ? '1 hari lagi' : '1 day left';
  return language === 'id' ? `${difference} hari lagi` : `${difference} days left`;
}

function getCoolingProgress(item: WishlistItem) {
  const remainingDays = differenceInCalendarDays(parseISO(item.review_date), new Date());
  const totalDays = Math.max(item.cooling_days, 1);
  return Math.min(Math.max((totalDays - Math.max(remainingDays, 0)) / totalDays, 0), 1);
}

function getPriorityVariant(priority: WishlistItem['priority']) {
  return priority === 'high' ? 'danger' : priority === 'low' ? 'accent' : 'warning';
}

function getStatusVariant(status: WishlistItem['status']) {
  if (status === 'purchased') return 'success';
  if (status === 'cancelled') return 'danger';
  if (status === 'approved_to_buy') return 'accent';
  return 'warning';
}

function getCardTone(item: WishlistItem) {
  if (item.status === 'purchased' || item.status === 'cancelled') return 'bg-surface-2/55';
  if (item.status === 'approved_to_buy') return 'border-accent/18 bg-surface-1';
  if (isReviewDue(item)) return 'border-warning/18 bg-surface-2/55';
  return '';
}

function getProgressTone(item: WishlistItem): 'accent' | 'success' | 'warning' | 'danger' {
  if (item.status === 'purchased') return 'success';
  if (item.status === 'cancelled') return 'danger';
  if (item.status === 'approved_to_buy') return 'accent';
  return isReviewDue(item) ? 'warning' : 'accent';
}

function FormField({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

function SegmentedChoices({
  label,
  suffix,
  value,
  onChange,
}: {
  label: string;
  suffix: string;
  value?: string;
  onChange: (nextValue: '3' | '5' | '7') => void;
}) {
  return (
    <div className="grid gap-2">
      <span className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3">{label}</span>
      <div className="grid grid-cols-3 gap-2">
        {(['3', '5', '7'] as const).map((dayValue) => (
          <button
            key={dayValue}
            type="button"
            className={cn(
              'inline-flex min-h-[2.7rem] items-center justify-center rounded-[calc(var(--radius-card)-0.18rem)] border px-3 text-sm font-semibold transition',
              value === dayValue
                ? 'border-accent bg-accent-soft text-accent-strong'
                : 'border-border-subtle bg-surface-1 text-text-2 hover:border-border-strong hover:bg-surface-2'
            )}
            onClick={() => onChange(dayValue)}
          >
            {dayValue} {suffix}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const { t, language } = useLanguage();
  const { formatCurrency } = useCurrencyPreferences();
  const queryClient = useQueryClient();
  const [supabase] = useState(() => createClient());
  const [activeTab, setActiveTab] = useState<WishlistTab>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [reviewingItem, setReviewingItem] = useState<WishlistItem | null>(null);
  const [convertingItem, setConvertingItem] = useState<WishlistItem | null>(null);

  const itemsQuery = useQuery({ queryKey: queryKeys.wishlist.list, queryFn: fetchWishlistItems });
  const walletsQuery = useQuery({ queryKey: queryKeys.wallets.active, queryFn: fetchActiveWallets });

  const { register, handleSubmit, reset, setValue, control, formState: { errors } } =
    useForm<WishlistFormInput, undefined, WishlistFormValues>({
      resolver: zodResolver(wishlistFormSchema),
      defaultValues: getWishlistDefaults(),
    });

  const {
    register: registerReview,
    handleSubmit: handleReviewSubmit,
    reset: resetReview,
    setValue: setReviewValue,
    control: reviewControl,
    formState: { errors: reviewErrors },
  } = useForm<WishlistReviewInput, undefined, WishlistReviewValues>({
    resolver: zodResolver(wishlistReviewSchema),
    defaultValues: getReviewDefaults(),
  });

  const selectedPriority = useWatch({ control, name: 'priority', defaultValue: 'medium' });
  const selectedCoolingDays = useWatch({ control, name: 'cooling_days', defaultValue: '3' });
  const nextReviewStatus = useWatch({ control: reviewControl, name: 'next_status', defaultValue: 'approved_to_buy' });
  const selectedPostponeDays = useWatch({ control: reviewControl, name: 'postpone_days', defaultValue: '3' });

  useEffect(() => {
    reset(getWishlistDefaults(editingItem));
  }, [editingItem, reset]);

  useEffect(() => {
    resetReview(getReviewDefaults());
  }, [reviewingItem, resetReview]);

  const invalidateWishlistData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview }),
    ]);
  };

  const saveWishlistMutation = useMutation({
    mutationFn: async (values: WishlistFormValues) => {
      const today = new Date();
      const coolingDays = Number(values.cooling_days);
      const computedReviewDate = toDateInputValue(addDays(today, coolingDays));
      const preservedStatus =
        editingItem?.status === 'approved_to_buy' ||
        editingItem?.status === 'purchased' ||
        editingItem?.status === 'cancelled'
          ? editingItem.status
          : 'pending_review';

      const payload = {
        item_name: values.item_name.trim(),
        target_price: values.target_price ?? null,
        price: values.target_price ?? null,
        url: values.url || null,
        note: values.note?.trim() || null,
        priority: values.priority,
        reason: values.reason?.trim() || null,
        cooling_days: coolingDays,
        start_date: editingItem?.start_date ?? toDateInputValue(today),
        review_date:
          preservedStatus === 'approved_to_buy' || preservedStatus === 'purchased' || preservedStatus === 'cancelled'
            ? editingItem?.review_date
            : computedReviewDate,
        selected_wallet_id: values.selected_wallet_id || null,
        status: preservedStatus,
      };

      if (editingItem) {
        const { error } = await supabase.from('wishlist').update(payload).eq('id', editingItem.id);
        if (error) throw error;
        return;
      }

      const { error } = await supabase.from('wishlist').insert(payload);
      if (error) throw error;
    },
    onSuccess: async () => {
      setIsFormOpen(false);
      setEditingItem(null);
      await invalidateWishlistData();
      window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
      toast.success(t('wishlist.form.saveSuccess'));
    },
    onError: (error) => toast.error(getErrorMessage(error, t('wishlist.form.saveError'))),
  });

  const reviewWishlistMutation = useMutation({
    mutationFn: async (values: WishlistReviewValues) => {
      if (!reviewingItem) return;

      const payload: Record<string, string | number | null> = { status: values.next_status };
      if (values.next_status === 'postponed') {
        const postponeDays = Number(values.postpone_days ?? '3');
        payload.cooling_days = postponeDays;
        payload.review_date = toDateInputValue(addDays(new Date(), postponeDays));
      }

      const { error } = await supabase.from('wishlist').update(payload).eq('id', reviewingItem.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      setReviewingItem(null);
      await invalidateWishlistData();
      window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
      toast.success(t('wishlist.review.saveSuccess'));
    },
    onError: (error) => toast.error(getErrorMessage(error, t('wishlist.review.saveError'))),
  });

  const markPurchasedMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from('wishlist').update({ status: 'purchased' }).eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await invalidateWishlistData();
      window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
      toast.success(t('wishlist.actions.purchaseSuccess'));
    },
    onError: (error) => toast.error(getErrorMessage(error, t('wishlist.actions.purchaseError'))),
  });

  const items = itemsQuery.data ?? [];
  const wallets = walletsQuery.data ?? [];
  const selectableWallets =
    editingItem?.wallets && !wallets.some((wallet) => wallet.id === editingItem.wallets?.id)
      ? [
          {
            id: editingItem.wallets.id,
            name: editingItem.wallets.name,
            icon: null,
            type: editingItem.wallets.type,
          },
          ...wallets,
        ]
      : wallets;
  const dueItems = items.filter(isReviewDue);
  const approvedItems = items.filter((item) => item.status === 'approved_to_buy');
  const pendingItems = items.filter((item) => item.status === 'pending_review' && !isReviewDue(item));
  const postponedItems = items.filter((item) => item.status === 'postponed' && !isReviewDue(item));
  const purchasedItems = items.filter((item) => item.status === 'purchased');
  const cancelledItems = items.filter((item) => item.status === 'cancelled');

  const tabs: { key: WishlistTab; label: string; count: number }[] = [
    { key: 'all', label: t('wishlist.tabs.all'), count: items.length },
    { key: 'due', label: t('wishlist.tabs.due'), count: dueItems.length },
    { key: 'pending', label: t('wishlist.tabs.pending'), count: pendingItems.length },
    { key: 'approved', label: t('wishlist.tabs.approved'), count: approvedItems.length },
    {
      key: 'postponed',
      label: t('wishlist.tabs.postponed'),
      count: postponedItems.length + dueItems.filter((item) => item.status === 'postponed').length,
    },
    { key: 'purchased', label: t('wishlist.tabs.purchased'), count: purchasedItems.length },
    { key: 'cancelled', label: t('wishlist.tabs.cancelled'), count: cancelledItems.length },
  ];

  const sectionsByTab: Record<WishlistTab, { title: string; items: WishlistItem[] }[]> = {
    all: [
      { title: t('wishlist.sections.due'), items: dueItems },
      { title: t('wishlist.sections.approved'), items: approvedItems },
      { title: t('wishlist.sections.pending'), items: pendingItems },
      { title: t('wishlist.sections.postponed'), items: postponedItems },
      { title: t('wishlist.sections.history'), items: [...purchasedItems, ...cancelledItems] },
    ],
    due: [{ title: t('wishlist.sections.due'), items: dueItems }],
    pending: [{ title: t('wishlist.sections.pending'), items: pendingItems }],
    approved: [{ title: t('wishlist.sections.approved'), items: approvedItems }],
    postponed: [
      {
        title: t('wishlist.sections.postponed'),
        items: [...postponedItems, ...dueItems.filter((item) => item.status === 'postponed')],
      },
    ],
    purchased: [{ title: t('wishlist.sections.purchased'), items: purchasedItems }],
    cancelled: [{ title: t('wishlist.sections.cancelled'), items: cancelledItems }],
  };

  const activeSections = sectionsByTab[activeTab];
  const hasAnyVisibleItem = activeSections.some((section) => section.items.length > 0);
  const totalTrackedValue = items.reduce((sum, item) => sum + (item.target_price ?? 0), 0);
  const linkedWalletCount = items.filter((item) => item.selected_wallet_id).length;
  const convertingPrefill: TransactionFormPrefill | null = convertingItem
    ? {
        title: convertingItem.item_name,
        amount: convertingItem.target_price ?? undefined,
        type: 'expense',
        wallet_id: convertingItem.selected_wallet_id ?? undefined,
        note: convertingItem.note ?? convertingItem.reason ?? undefined,
      }
    : null;

  return (
    <PageShell className="animate-fade-in">
      <PageHeader>
        <PageHeading title={t('wishlist.title')} />
        <PageHeaderActions>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setActiveTab('due');
              if (dueItems[0]) {
                setReviewingItem(dueItems[0]);
              }
            }}
            disabled={dueItems.length === 0}
          >
            <Sparkles size={16} />
            {t('wishlist.actions.reviewNow')}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              setEditingItem(null);
              setIsFormOpen(true);
            }}
          >
            <ShoppingBasket size={16} />
            {t('wishlist.addItem')}
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t('wishlist.tabs.all')} value={itemsQuery.isLoading ? '...' : items.length} />
        <MetricCard
          label={t('wishlist.tabs.due')}
          value={itemsQuery.isLoading ? '...' : dueItems.length}
          tone={dueItems.length > 0 ? 'warning' : 'default'}
        />
        <MetricCard
          label={t('wishlist.tabs.approved')}
          value={itemsQuery.isLoading ? '...' : approvedItems.length}
          tone={approvedItems.length > 0 ? 'accent' : 'default'}
        />
        <MetricCard
          label={t('wishlist.meta.wallet')}
          value={itemsQuery.isLoading ? '...' : linkedWalletCount}
          meta={itemsQuery.isLoading ? undefined : formatCurrency(totalTrackedValue)}
          tone="accent"
        />
      </section>

      {dueItems.length > 0 ? (
        <SurfaceCard className="border-accent/18 bg-surface-1">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-[calc(var(--radius-control)+0.05rem)] bg-accent-soft text-accent-strong">
                <Sparkles size={18} />
              </span>
              <div className="grid gap-1">
                <strong className="text-sm font-semibold tracking-[-0.02em] text-text-1">
                  {t('wishlist.sections.due')}
                </strong>
              </div>
            </div>
            <Badge variant="accent">{dueItems.length}</Badge>
          </div>
        </SurfaceCard>
      ) : null}

      <SurfaceCard>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as WishlistTab)} className="grid gap-3">
          <div className="pb-1">
            <TabsList className="!grid !w-full grid-cols-2 justify-start overflow-hidden rounded-2xl md:!flex md:flex-wrap">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="min-w-0 w-full gap-2 rounded-xl px-3 py-2 text-sm md:flex-1"
                >
                  <span>{tab.label}</span>
                  <span className="inline-flex h-5 min-w-[1.35rem] items-center justify-center rounded-full bg-surface-1/80 px-1.5 text-[0.68rem] font-bold text-text-3">
                    {tab.count}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            {itemsQuery.isLoading ? (
              <EmptyState title={t('common.loading')} compact />
            ) : itemsQuery.isError ? (
              <EmptyState title={t('wishlist.loadError')} compact />
            ) : items.length === 0 ? (
              <EmptyState
                title={t('wishlist.noItems')}
                icon={<ShoppingBasket size={20} />}
                action={
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => {
                      setEditingItem(null);
                      setIsFormOpen(true);
                    }}
                  >
                    <ShoppingBasket size={16} />
                    {t('wishlist.addItem')}
                  </Button>
                }
              />
            ) : !hasAnyVisibleItem ? (
              <EmptyState
                title={t('wishlist.emptyTab')}
                compact
                icon={<Clock3 size={18} />}
              />
            ) : (
              <div className="grid gap-3.5">
                {activeSections.map((section) =>
                  section.items.length > 0 ? (
                    <section key={section.title} className="grid gap-3">
                      <details className="group rounded-[var(--radius-card)] border border-border-subtle bg-surface-1 sm:hidden" open>
                        <summary className="flex list-none items-center justify-between gap-3 px-3.5 py-3">
                          <strong className="text-sm font-semibold tracking-[-0.03em] text-text-1">{section.title}</strong>
                          <span className="text-xs font-semibold text-text-3 transition-transform duration-300 group-open:rotate-180">v</span>
                        </summary>
                        <div className="border-t border-border-subtle px-3.5 py-3">
                          <div className="grid gap-3">
                            {section.items.map((item) => (
                              <WishlistItemCard
                                key={item.id}
                                item={item}
                                language={language}
                                t={t}
                                onEdit={() => {
                                  setEditingItem(item);
                                  setIsFormOpen(true);
                                }}
                                onReview={() => setReviewingItem(item)}
                                onConvert={() => setConvertingItem(item)}
                                convertPending={markPurchasedMutation.isPending}
                              />
                            ))}
                          </div>
                        </div>
                      </details>
                      <div className="hidden gap-4 sm:grid">
                        <SectionHeading title={section.title} />
                        <div className="grid gap-4 2xl:grid-cols-2">
                          {section.items.map((item) => (
                            <WishlistItemCard
                              key={item.id}
                              item={item}
                              language={language}
                              t={t}
                              onEdit={() => {
                                setEditingItem(item);
                                setIsFormOpen(true);
                              }}
                              onReview={() => setReviewingItem(item)}
                              onConvert={() => setConvertingItem(item)}
                              convertPending={markPurchasedMutation.isPending}
                            />
                          ))}
                        </div>
                      </div>
                    </section>
                  ) : null
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SurfaceCard>

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditingItem(null);
          }
        }}
      >
        <DialogContent className="max-w-[40rem]">
          <DialogHeader>
            <DialogTitle>{editingItem ? t('wishlist.form.edit') : t('wishlist.form.new')}</DialogTitle>
          </DialogHeader>

          <form
            className="grid gap-4 pt-2"
            onSubmit={handleSubmit((values) => saveWishlistMutation.mutate(values))}
          >
            <input type="hidden" {...register('priority')} />
            <input type="hidden" {...register('cooling_days')} />

            <div className="grid gap-3 md:grid-cols-2">
              <FormField label={t('wishlist.form.name')} htmlFor="wishlist-item-name" error={errors.item_name?.message}>
                <Input id="wishlist-item-name" className="min-h-[2.85rem] px-3.5 py-2.5" {...register('item_name')} />
              </FormField>

              <FormField
                label={t('wishlist.form.price')}
                htmlFor="wishlist-target-price"
                error={errors.target_price?.message}
              >
                <Controller
                  control={control}
                  name="target_price"
                  render={({ field }) => (
                    <CurrencyInput
                      id="wishlist-target-price"
                      name={field.name}
                      placeholder="1500000"
                      value={field.value}
                      onBlur={field.onBlur}
                      onNumberValueChange={field.onChange}
                      ref={field.ref}
                      className="min-h-[2.85rem] px-3.5 py-2.5"
                    />
                  )}
                />
              </FormField>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <FormField label={t('wishlist.form.url')} htmlFor="wishlist-url" error={errors.url?.message}>
                <Input id="wishlist-url" type="url" className="min-h-[2.85rem] px-3.5 py-2.5" placeholder="https://..." {...register('url')} />
              </FormField>

              <FormField
                label={t('wishlist.form.wallet')}
                htmlFor="wishlist-wallet"
                error={errors.selected_wallet_id?.message}
              >
                <select id="wishlist-wallet" className="flex min-h-[2.85rem] w-full rounded-xl border border-border-subtle bg-surface-1 px-3.5 py-2.5 text-sm text-text-1 outline-none transition hover:border-border-strong focus:border-accent focus:ring-4 focus:ring-accent-soft/70" {...register('selected_wallet_id')}>
                  <option value="">
                    {walletsQuery.isLoading ? t('common.loading') : t('wishlist.form.walletOptional')}
                  </option>
                  {selectableWallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.name}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <ChoicePills
                label={t('wishlist.form.priority')}
                value={selectedPriority}
                onChange={(value) =>
                  setValue('priority', value as WishlistFormValues['priority'], {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                options={[
                  { value: 'low', label: t('wishlist.priority.low'), tone: 'accent' },
                  { value: 'medium', label: t('wishlist.priority.medium'), tone: 'warning' },
                  { value: 'high', label: t('wishlist.priority.high'), tone: 'danger' },
                ]}
              />

              <SegmentedChoices
                label={t('wishlist.form.coolingPeriod')}
                suffix={t('wishlist.form.days')}
                value={selectedCoolingDays}
                onChange={(value) =>
                  setValue('cooling_days', value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <FormField label={t('wishlist.form.reason')} htmlFor="wishlist-reason" error={errors.reason?.message}>
                <Textarea
                  id="wishlist-reason"
                  rows={4}
                  className="min-h-[5.25rem] resize-y px-3.5 py-2.5"
                  placeholder={t('wishlist.form.reasonPlaceholder')}
                  {...register('reason')}
                />
              </FormField>

              <FormField label={t('wishlist.form.note')} htmlFor="wishlist-note" error={errors.note?.message}>
                <Textarea
                  id="wishlist-note"
                  rows={4}
                  className="min-h-[5.25rem] resize-y px-3.5 py-2.5"
                  placeholder={t('wishlist.form.notePlaceholder')}
                  {...register('note')}
                />
              </FormField>
            </div>

            <div className="grid gap-2.5 pt-1 sm:grid-cols-2">
              <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" variant="primary" disabled={saveWishlistMutation.isPending}>
                {saveWishlistMutation.isPending ? t('common.loading') : t('common.save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(reviewingItem)}
        onOpenChange={(open) => {
          if (!open) {
            setReviewingItem(null);
          }
        }}
      >
        <DialogContent className="max-w-[36rem]">
          <DialogHeader>
            <DialogTitle>{t('wishlist.review.title')}</DialogTitle>
          </DialogHeader>

          {reviewingItem ? (
            <div className="grid gap-4 pt-2">
              <Card className="border-border-subtle bg-surface-2/55 p-3 shadow-none">
                <div className="grid gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="grid gap-1">
                      <strong className="text-base font-semibold tracking-[-0.03em] text-text-1">
                        {reviewingItem.item_name}
                      </strong>
                      <span className="text-sm text-text-3">
                        {reviewingItem.target_price ? formatCurrency(reviewingItem.target_price) : '-'}
                      </span>
                    </div>
                    <Badge variant={getStatusVariant(reviewingItem.status)}>
                      {t(`wishlist.status.${reviewingItem.status}`)}
                    </Badge>
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-3">
                    <MetaStat
                      label={t('wishlist.meta.reviewDate')}
                      value={formatDate(reviewingItem.review_date, language)}
                    />
                    <MetaStat
                      label={t('wishlist.meta.coolingDays')}
                      value={`${reviewingItem.cooling_days} ${t('wishlist.form.days').toLowerCase()}`}
                    />
                    <MetaStat
                      label={t('wishlist.meta.wallet')}
                      value={reviewingItem.wallets?.name ?? t('wishlist.form.walletOptional')}
                    />
                  </div>
                </div>
              </Card>

              <form
                className="grid gap-4"
                onSubmit={handleReviewSubmit((values) => reviewWishlistMutation.mutate(values))}
              >
                <input type="hidden" {...registerReview('next_status')} />
                <input type="hidden" {...registerReview('postpone_days')} />

                <ChoicePills
                  label={t('wishlist.review.action')}
                  value={nextReviewStatus}
                  onChange={(value) =>
                    setReviewValue('next_status', value as WishlistReviewValues['next_status'], {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  options={[
                    {
                      value: 'approved_to_buy',
                      label: t('wishlist.actions.approve'),
                      tone: 'accent',
                      icon: <CheckCircle size={16} />,
                    },
                    {
                      value: 'postponed',
                      label: t('wishlist.actions.postpone'),
                      tone: 'warning',
                      icon: <Clock3 size={16} />,
                    },
                    {
                      value: 'cancelled',
                      label: t('wishlist.actions.cancel'),
                      tone: 'danger',
                      icon: <XCircle size={16} />,
                    },
                  ]}
                />

                {nextReviewStatus === 'postponed' ? (
                  <SegmentedChoices
                    label={t('wishlist.review.postponeDays')}
                    suffix={t('wishlist.form.days')}
                    value={selectedPostponeDays}
                    onChange={(value) =>
                      setReviewValue('postpone_days', value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />
                ) : null}

                <FieldError message={reviewErrors.postpone_days?.message} />

                <div className="grid gap-2.5 pt-1 sm:grid-cols-2">
                  <Button type="button" variant="secondary" onClick={() => setReviewingItem(null)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" variant="primary" disabled={reviewWishlistMutation.isPending}>
                    {reviewWishlistMutation.isPending ? t('common.loading') : t('wishlist.review.save')}
                  </Button>
                </div>
              </form>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(convertingItem)}
        onOpenChange={(open) => {
          if (!open) {
            setConvertingItem(null);
          }
        }}
      >
        <DialogContent className="max-w-[42rem] overflow-hidden p-0" hideClose>
          <DialogHeader className="sr-only">
            <DialogTitle>{t('transactions.form.new')}</DialogTitle>
          </DialogHeader>
          <TransactionForm
            initialValues={convertingPrefill}
            createSource="wishlist_conversion"
            onSuccess={() => {
              const convertedItem = convertingItem;
              setConvertingItem(null);
              if (convertedItem) {
                markPurchasedMutation.mutate(convertedItem.id);
              }
            }}
            onCancel={() => setConvertingItem(null)}
          />
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

type ChoiceTone = 'default' | 'accent' | 'warning' | 'danger' | 'success';

const choiceToneClassName: Record<ChoiceTone, string> = {
  default: 'border-border-subtle bg-surface-1 text-text-2',
  accent: 'border-accent bg-accent-soft text-accent-strong',
  warning: 'border-warning/30 bg-warning-soft text-warning',
  danger: 'border-danger/30 bg-danger-soft text-danger',
  success: 'border-success/30 bg-success-soft text-success',
};

function ChoicePills({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; tone: ChoiceTone; icon?: ReactNode }>;
}) {
  return (
      <div className="grid gap-2">
        <span className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3">{label}</span>
      <div className="grid gap-2 sm:grid-cols-3">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={cn(
              'inline-flex min-h-[2.7rem] items-center justify-center gap-2 rounded-[calc(var(--radius-card)-0.18rem)] border px-3 text-sm font-semibold transition',
              value === option.value
                ? choiceToneClassName[option.tone]
                : 'border-border-subtle bg-surface-2/55 text-text-2 hover:border-border-strong hover:bg-surface-2'
            )}
            onClick={() => onChange(option.value)}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MetaStat({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="grid gap-1 rounded-[calc(var(--radius-card)-0.15rem)] border border-border-subtle bg-surface-2/55 p-3">
      <span className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-text-3">{label}</span>
      <strong className="text-sm font-semibold tracking-[-0.02em] text-text-1">{value}</strong>
    </div>
  );
}

function WishlistItemCard({
  item,
  language,
  t,
  onEdit,
  onReview,
  onConvert,
  convertPending,
}: {
  item: WishlistItem;
  language: 'en' | 'id';
  t: (key: string) => string;
  onEdit: () => void;
  onReview: () => void;
  onConvert: () => void;
  convertPending: boolean;
}) {
  const { formatCurrency } = useCurrencyPreferences();
  const isDue = isReviewDue(item);
  const progressValue =
    item.status === 'approved_to_buy' || item.status === 'purchased' || item.status === 'cancelled'
      ? 1
      : getCoolingProgress(item);
  const statusSummary =
    item.status === 'purchased'
      ? {
          icon: <CheckCircle size={16} className="text-success" />,
          label: t('wishlist.status.purchased'),
        }
      : item.status === 'cancelled'
        ? {
            icon: <XCircle size={16} className="text-danger" />,
            label: t('wishlist.status.cancelled'),
          }
        : item.status === 'approved_to_buy'
          ? {
              icon: <Sparkles size={16} className="text-accent-strong" />,
              label: getCountdownLabel(item, language),
            }
          : {
              icon: <Clock3 size={16} className={cn(isDue ? 'text-warning' : 'text-text-3')} />,
              label: getCountdownLabel(item, language),
            };

  return (
    <Card className={cn('grid gap-3.5 p-3.5 md:p-5', getCardTone(item), item.status === 'purchased' && 'opacity-90')}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="grid gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getStatusVariant(item.status)}>{t(`wishlist.status.${item.status}`)}</Badge>
            {item.priority === 'high' ? (
              <Badge variant={getPriorityVariant(item.priority)}>{t(`wishlist.priority.${item.priority}`)}</Badge>
            ) : null}
            {isDue ? <Badge variant="warning">{t('wishlist.actions.reviewNow')}</Badge> : null}
          </div>

          <div className="grid gap-0.5">
            <strong className="text-base font-semibold tracking-[-0.04em] text-text-1">{item.item_name}</strong>
            <span className="text-sm text-text-3">{item.target_price ? formatCurrency(item.target_price) : '-'}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          {item.url ? (
            <Button asChild variant="ghost" size="sm">
              <a href={item.url} target="_blank" rel="noreferrer">
                <ExternalLink size={14} />
                {t('wishlist.link')}
              </a>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-2xl"
            onClick={onEdit}
            aria-label={t('wishlist.form.edit')}
            title={t('wishlist.form.edit')}
          >
            <Pencil size={16} />
          </Button>
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3">
            {t('wishlist.coolingLabel')}
          </span>
          <span className="inline-flex items-center gap-2 text-sm font-medium text-text-2">
            {statusSummary.icon}
            <span>{statusSummary.label}</span>
          </span>
        </div>
        <ProgressMeter
          value={progressValue}
          tone={getProgressTone(item)}
          className="h-2.5 bg-surface-2"
          ariaLabel={item.item_name}
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <MetaStat label={t('wishlist.meta.reviewDate')} value={formatDate(item.review_date, language)} />
        <MetaStat
          label={t('wishlist.meta.coolingDays')}
          value={`${item.cooling_days} ${t('wishlist.form.days').toLowerCase()}`}
        />
        <MetaStat
          label={t('wishlist.meta.wallet')}
          value={item.wallets?.name ?? t('wishlist.form.walletOptional')}
        />
      </div>

      {item.reason || item.note ? (
        <>
          <div className="hidden gap-4 md:grid md:grid-cols-2">
            {item.reason ? (
              <div className="grid gap-1">
                <span className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3">
                  {t('wishlist.form.reason')}
                </span>
                <p className="m-0 text-sm leading-6 text-text-2">{item.reason}</p>
              </div>
            ) : null}
            {item.note ? (
              <div className="grid gap-1">
                <span className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3">
                  {t('wishlist.form.note')}
                </span>
                <p className="m-0 text-sm leading-6 text-text-2">{item.note}</p>
              </div>
            ) : null}
          </div>
          <details className="group rounded-[calc(var(--radius-card)-0.14rem)] border border-border-subtle bg-surface-1/70 md:hidden">
            <summary className="flex list-none items-center justify-between gap-3 px-3 py-2.5">
              <span className="text-sm font-medium text-text-2">{language === 'id' ? 'Detail' : 'Details'}</span>
              <span className="text-xs font-semibold text-text-3 transition-transform duration-300 group-open:rotate-180">v</span>
            </summary>
            <div className="grid gap-3 border-t border-border-subtle px-3 py-3">
              {item.reason ? (
                <div className="grid gap-1">
                  <span className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3">
                    {t('wishlist.form.reason')}
                  </span>
                  <p className="m-0 text-sm leading-5 text-text-2">{item.reason}</p>
                </div>
              ) : null}
              {item.note ? (
                <div className="grid gap-1">
                  <span className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3">
                    {t('wishlist.form.note')}
                  </span>
                  <p className="m-0 text-sm leading-5 text-text-2">{item.note}</p>
                </div>
              ) : null}
            </div>
          </details>
        </>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {isDue ? (
          <Button type="button" variant="secondary" size="sm" onClick={onReview}>
            <Sparkles size={14} />
            {t('wishlist.actions.reviewNow')}
          </Button>
        ) : null}
        {item.status === 'approved_to_buy' ? (
          <Button type="button" variant="primary" size="sm" onClick={onConvert} disabled={convertPending}>
            <ShoppingBasket size={14} />
            {t('wishlist.actions.convert')}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
