'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { addMonths } from 'date-fns';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Pencil, Target, Trash2 } from 'lucide-react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/ConfirmDialogProvider';
import { useCurrencyPreferences } from '@/components/CurrencyPreferencesProvider';
import { FieldError } from '@/components/shared/FieldError';
import { useLanguage } from '@/components/LanguageProvider';
import { EmptyState } from '@/components/shared/EmptyState';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CurrencyInput } from '@/components/ui/currency-input';
import { getBudgetTone, summarizeBudgetUsage, type BudgetTone } from '@/lib/budgetMath';
import { NOTIFICATIONS_REFRESH_EVENT, TRANSACTIONS_CHANGED_EVENT } from '@/lib/events';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/queries/keys';
import { fetchBudgetOverview, type BudgetRecord } from '@/lib/queries/budgets';
import { fetchCategories } from '@/lib/queries/reference';
import { createClient } from '@/lib/supabase/client';
import { budgetFormSchema, type BudgetFormInput, type BudgetFormValues } from '@/lib/validators/budget';

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthKeyToDate(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

function formatMonthLabel(monthKey: string, language: 'en' | 'id') {
  return monthKeyToDate(monthKey).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function getDefaultValues(monthKey: string, budget?: BudgetRecord | null): BudgetFormInput {
  if (!budget) {
    return {
      month_key: monthKey,
      mode: 'overall',
      category_id: '',
      limit: 0,
    };
  }

  return {
    month_key: budget.month_key,
    mode: budget.category_id ? 'category' : 'overall',
    category_id: budget.category_id ?? '',
    limit: budget.total_limit ?? budget.amount_limit ?? 0,
  };
}

const toneToProgressTone: Record<BudgetTone, 'success' | 'warning' | 'danger'> = {
  ok: 'success',
  warning: 'warning',
  danger: 'danger',
};

const toneToBadgeVariant: Record<BudgetTone, 'success' | 'warning' | 'danger'> = {
  ok: 'success',
  warning: 'warning',
  danger: 'danger',
};

export default function BudgetsPage() {
  const { t, language } = useLanguage();
  const { formatCurrency } = useCurrencyPreferences();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();
  const [monthKey, setMonthKey] = useState(() => getMonthKey(new Date()));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetRecord | null>(null);
  const [initialMode, setInitialMode] = useState<'overall' | 'category'>('overall');
  const [supabase] = useState(() => createClient());

  const budgetQuery = useQuery({
    queryKey: queryKeys.budgets.month(monthKey),
    queryFn: () => fetchBudgetOverview(monthKey),
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.list('expense'),
    queryFn: () => fetchCategories('expense'),
  });

  useEffect(() => {
    const handleTransactionsChanged = () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview }),
      ]);
    };

    window.addEventListener(TRANSACTIONS_CHANGED_EVENT, handleTransactionsChanged);
    return () => window.removeEventListener(TRANSACTIONS_CHANGED_EVENT, handleTransactionsChanged);
  }, [queryClient]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<BudgetFormInput, undefined, BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: getDefaultValues(monthKey, null),
  });

  const formMode = useWatch({ control, name: 'mode' }) ?? initialMode;

  useEffect(() => {
    reset(
      editingBudget
        ? getDefaultValues(monthKey, editingBudget)
        : {
            month_key: monthKey,
            mode: initialMode,
            category_id: '',
            limit: 0,
          }
    );
  }, [editingBudget, initialMode, monthKey, reset]);

  const budgets = budgetQuery.data?.budgets ?? [];
  const expenses = budgetQuery.data?.expenses ?? [];
  const categories = categoriesQuery.data ?? [];

  const budgetSummary = summarizeBudgetUsage(budgets, expenses);
  const globalBudget = budgets.find((budget) => budget.category_id === null) ?? null;
  const categoryBudgets = budgets.filter((budget) => budget.category_id !== null);
  const totalSpent = budgetSummary.totalExpense;
  const overallLimit = budgetSummary.overallLimit;
  const remaining = budgetSummary.remaining;
  const overallRatio = budgetSummary.ratio;
  const overallTone = budgetSummary.tone;

  const spentByCategory = new Map<string, number>();

  expenses.forEach((expense) => {
    if (!expense.category_id) {
      return;
    }

    spentByCategory.set(expense.category_id, (spentByCategory.get(expense.category_id) ?? 0) + expense.amount);
  });

  const categoryRows = categoryBudgets
    .map((budget) => {
      const spent = spentByCategory.get(budget.category_id!) ?? 0;
      const limit = budget.amount_limit ?? 0;
      const ratio = limit > 0 ? spent / limit : 0;

      return {
        budget,
        spent,
        limit,
        ratio,
        tone: getBudgetTone(ratio),
      };
    })
    .sort((left, right) => right.ratio - left.ratio);

  const trackedCategoryIds = new Set(categoryBudgets.map((budget) => budget.category_id));
  const untrackedBucket = new Map<string, { id: string; name: string; spent: number }>();

  expenses.forEach((expense) => {
    if (!expense.category_id || trackedCategoryIds.has(expense.category_id)) {
      return;
    }

    const current = untrackedBucket.get(expense.category_id) ?? {
      id: expense.category_id,
      name: expense.categories?.name || t('common.uncategorized'),
      spent: 0,
    };

    current.spent += expense.amount;
    untrackedBucket.set(expense.category_id, current);
  });

  const untrackedSpending = [...untrackedBucket.values()]
    .sort((left, right) => right.spent - left.spent)
    .slice(0, 5);

  const saveBudgetMutation = useMutation({
    mutationFn: async (values: BudgetFormValues) => {
      const payload =
        values.mode === 'overall'
          ? {
              month_key: values.month_key,
              category_id: null,
              total_limit: values.limit,
              amount_limit: null,
            }
          : {
              month_key: values.month_key,
              category_id: values.category_id,
              total_limit: null,
              amount_limit: values.limit,
            };

      const duplicateBudget = budgets.find((budget) => {
        if (editingBudget && budget.id === editingBudget.id) {
          return false;
        }

        if (values.mode === 'overall') {
          return budget.category_id === null;
        }

        return budget.category_id === values.category_id;
      });

      if (editingBudget) {
        const { error } = await supabase.from('budgets').update(payload).eq('id', editingBudget.id);

        if (error) {
          throw error;
        }

        return;
      }

      if (duplicateBudget) {
        const { error } = await supabase.from('budgets').update(payload).eq('id', duplicateBudget.id);

        if (error) {
          throw error;
        }

        return;
      }

      const { error } = await supabase.from('budgets').insert(payload);

      if (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      setIsFormOpen(false);
      setEditingBudget(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview }),
      ]);
      window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
      toast.success(t('budgets.form.saveSuccess'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, t('budgets.form.saveError')));
    },
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      const { error } = await supabase.from('budgets').delete().eq('id', budgetId);

      if (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview }),
      ]);
      window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
      toast.success(t('budgets.deleteSuccess'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, t('budgets.deleteError')));
    },
  });

  const openCreateForm = (mode: 'overall' | 'category') => {
    setEditingBudget(null);
    setInitialMode(mode);
    setIsFormOpen(true);
  };

  const openEditForm = (budget: BudgetRecord) => {
    setEditingBudget(budget);
    setInitialMode(budget.category_id ? 'category' : 'overall');
    setIsFormOpen(true);
  };

  const handleDelete = async (budgetId: string) => {
    const accepted = await confirm({
      title: t('common.delete'),
      description: t('budgets.confirmDelete'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      tone: 'danger',
    });

    if (!accepted) {
      return;
    }

    deleteBudgetMutation.mutate(budgetId);
  };

  const monthLabel = formatMonthLabel(monthKey, language);

  return (
    <PageShell className="animate-fade-in">
      <PageHeader>
        <PageHeading title={t('budgets.title')} />
        <PageHeaderActions>
          <Button type="button" variant="secondary" onClick={() => openCreateForm('overall')}>
            {t('budgets.addOverall')}
          </Button>
          <Button type="button" variant="primary" onClick={() => openCreateForm('category')}>
            {t('budgets.addCategory')}
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <SurfaceCard className="p-4 md:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-11 w-11 rounded-2xl"
            onClick={() => setMonthKey(getMonthKey(addMonths(monthKeyToDate(monthKey), -1)))}
            aria-label={t('budgets.previousMonth')}
            title={t('budgets.previousMonth')}
          >
            <ChevronLeft size={16} />
          </Button>

          <div className="grid gap-1 text-center">
            <span className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3">
              {t('budgets.currentMonth')}
            </span>
            <strong className="text-lg font-semibold tracking-[-0.03em] text-text-1">{monthLabel}</strong>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-11 w-11 rounded-2xl"
            onClick={() => setMonthKey(getMonthKey(addMonths(monthKeyToDate(monthKey), 1)))}
            aria-label={t('budgets.nextMonth')}
            title={t('budgets.nextMonth')}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </SurfaceCard>

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditingBudget(null);
          }
        }}
      >
        <DialogContent className="max-w-[31rem]">
          <DialogHeader>
            <DialogTitle>{editingBudget ? t('budgets.form.edit') : t('budgets.form.new')}</DialogTitle>
          </DialogHeader>

          <form
            className="grid gap-3 pt-2"
            onSubmit={handleSubmit((values) => saveBudgetMutation.mutate(values))}
          >
            <input type="hidden" {...register('month_key')} />

            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
              <label
                className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3"
                htmlFor="budget-mode"
              >
                {t('budgets.form.scope')}
              </label>
              <select
                id="budget-mode"
                className="flex min-h-[2.85rem] w-full rounded-xl border border-border-subtle bg-surface-1 px-3.5 py-2.5 text-sm text-text-1 outline-none transition hover:border-border-strong focus:border-accent focus:ring-4 focus:ring-accent-soft/70"
                {...register('mode')}
                disabled={Boolean(editingBudget)}
                onChange={(event) =>
                  setValue('mode', event.target.value as 'overall' | 'category', {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                <option value="overall">{t('budgets.form.overall')}</option>
                <option value="category">{t('budgets.form.category')}</option>
              </select>
              </div>

              <div className="grid gap-2">
                {formMode === 'category' ? (
                  <>
                    <label
                      className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3"
                      htmlFor="budget-category"
                    >
                      {t('budgets.form.categoryLabel')}
                    </label>
                    <select
                      id="budget-category"
                      className="flex min-h-[2.85rem] w-full rounded-xl border border-border-subtle bg-surface-1 px-3.5 py-2.5 text-sm text-text-1 outline-none transition hover:border-border-strong focus:border-accent focus:ring-4 focus:ring-accent-soft/70"
                      {...register('category_id')}
                      disabled={Boolean(editingBudget)}
                    >
                      <option value="">{t('budgets.form.chooseCategory')}</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <FieldError message={errors.category_id ? t('budgets.form.categoryRequired') : undefined} />
                  </>
                ) : (
                  <div className="hidden md:block" />
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <label
                className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3"
                htmlFor="budget-limit"
              >
                {t('budgets.form.limit')}
              </label>
              <Controller
                control={control}
                name="limit"
                render={({ field }) => (
                  <CurrencyInput
                    id="budget-limit"
                    name={field.name}
                  placeholder="1000000"
                  value={field.value}
                  onBlur={field.onBlur}
                  onNumberValueChange={field.onChange}
                  ref={field.ref}
                  className="min-h-[2.85rem] px-3.5 py-2.5"
                />
              )}
            />
              <FieldError message={errors.limit ? t('budgets.form.limitInvalid') : undefined} />
            </div>

            <div className="grid gap-2.5 pt-1 sm:grid-cols-2">
              <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" variant="primary" disabled={saveBudgetMutation.isPending}>
                {saveBudgetMutation.isPending ? t('common.loading') : t('common.save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t('budgets.summary.spent')} value={formatCurrency(totalSpent)} tone="danger" />
        <MetricCard
          label={t('budgets.summary.limit')}
          value={overallLimit > 0 ? formatCurrency(overallLimit) : '-'}
          tone="accent"
        />
        <MetricCard
          label={t('budgets.summary.remaining')}
          value={overallLimit > 0 ? formatCurrency(remaining) : '-'}
          tone={overallTone === 'danger' ? 'danger' : 'success'}
        />
        <MetricCard label={t('budgets.summary.tracked')} value={categoryBudgets.length} />
      </section>

      {budgetQuery.isLoading ? (
        <SurfaceCard>
          <EmptyState title={t('common.loading')} compact />
        </SurfaceCard>
      ) : budgetQuery.isError ? (
        <SurfaceCard>
          <EmptyState title={t('budgets.loadError')} compact />
        </SurfaceCard>
      ) : (
        <>
          <section className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <SurfaceCard>
              <div className="grid gap-5">
                <SectionHeading
                  title={t('budgets.overallTitle')}
                  actions={
                    globalBudget ? (
                      <>
                        <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-2xl" onClick={() => openEditForm(globalBudget)}>
                          <Pencil size={16} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-2xl text-danger"
                          onClick={() => {
                            void handleDelete(globalBudget.id);
                          }}
                          disabled={deleteBudgetMutation.isPending}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </>
                    ) : null
                  }
                />

                {globalBudget ? (
                  <div className="grid gap-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <MetricCard
                        label={t('budgets.summary.limit')}
                        value={formatCurrency(globalBudget.total_limit ?? 0)}
                        tone="accent"
                      />
                      <MetricCard
                        label={t('budgets.summary.spent')}
                        value={formatCurrency(totalSpent)}
                        tone="danger"
                      />
                      <MetricCard
                        label={t('budgets.summary.remaining')}
                        value={formatCurrency(remaining)}
                        tone={overallTone === 'danger' ? 'danger' : 'success'}
                      />
                    </div>

                    <div className="grid gap-3">
                      <ProgressMeter
                        value={overallRatio}
                        tone={toneToProgressTone[overallTone]}
                        className="h-2.5 bg-surface-2"
                        ariaLabel={t('budgets.overallTitle')}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <Badge variant={toneToBadgeVariant[overallTone]}>
                          {overallRatio >= 1
                            ? t('budgets.status.exceeded')
                            : overallRatio >= 0.8
                              ? t('budgets.status.warning')
                              : t('budgets.status.ok')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    title={t('budgets.noOverall')}
                    compact
                    icon={<Target size={18} />}
                  />
                )}
              </div>
            </SurfaceCard>

            <SurfaceCard>
              <div className="grid gap-5">
                <SectionHeading title={t('budgets.categoryTitle')} />

                {categoryRows.length === 0 ? (
                  <EmptyState title={t('budgets.noCategories')} compact icon={<Target size={18} />} />
                ) : (
                  <div className="grid gap-3">
                    {categoryRows.map(({ budget, spent, limit, ratio, tone }) => (
                      <div key={budget.id} className="grid gap-3 rounded-[calc(var(--radius-card)-0.1rem)] border border-border-subtle bg-surface-2/55 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="grid gap-1">
                            <strong className="text-sm font-semibold tracking-[-0.02em] text-text-1">
                              {budget.categories?.name || t('common.uncategorized')}
                            </strong>
                            <span className="text-xs text-text-3">
                              {formatCurrency(spent)} / {formatCurrency(limit)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-2xl" onClick={() => openEditForm(budget)}>
                              <Pencil size={16} />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-2xl text-danger"
                              onClick={() => {
                                void handleDelete(budget.id);
                              }}
                              disabled={deleteBudgetMutation.isPending}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <ProgressMeter
                            value={ratio}
                            tone={toneToProgressTone[tone]}
                            className="h-2 bg-surface-1"
                            ariaLabel={budget.categories?.name || t('common.uncategorized')}
                          />
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <Badge variant={toneToBadgeVariant[tone]}>
                              {ratio >= 1
                                ? t('budgets.status.exceeded')
                                : ratio >= 0.8
                                  ? t('budgets.status.warning')
                                  : t('budgets.status.ok')}
                            </Badge>
                            <span className="text-xs text-text-3">{Math.round(ratio * 100)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SurfaceCard>
          </section>

          <SurfaceCard>
            <div className="grid gap-5">
              <SectionHeading title={t('budgets.untrackedTitle')} />

              {untrackedSpending.length === 0 ? (
                <EmptyState title={t('budgets.noUntracked')} compact icon={<Target size={18} />} />
              ) : (
                <div className="grid gap-3">
                  {untrackedSpending.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 rounded-[calc(var(--radius-card)-0.1rem)] border border-border-subtle bg-surface-2/55 px-4 py-3"
                    >
                      <span className="text-sm text-text-2">{item.name}</span>
                      <strong className="text-sm font-semibold tracking-[-0.03em] text-text-1">
                        {formatCurrency(item.spent)}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SurfaceCard>
        </>
      )}
    </PageShell>
  );
}
