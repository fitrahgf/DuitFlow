'use client';

import { useCallback, useEffect, useState } from 'react';
import { Pencil, Tags, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/ConfirmDialogProvider';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  MetricCard,
  PageHeader,
  PageHeaderActions,
  PageHeading,
  PageShell,
  SectionHeading,
  SurfaceCard,
} from '@/components/shared/PagePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/components/LanguageProvider';
import { getCategoryIcon } from '@/lib/icons';
import { createClient } from '@/lib/supabase/client';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
}

const iconOptions = [
  'shopping',
  'food',
  'coffee',
  'transport',
  'bill',
  'home',
  'electricity',
  'phone',
  'game',
  'health',
  'flight',
  'gift',
  'income',
  'expense',
];

export default function CategoriesPage() {
  const { t, language } = useLanguage();
  const confirm = useConfirmDialog();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('shopping');
  const [color, setColor] = useState('#94a3b8');
  const [submitting, setSubmitting] = useState(false);
  const [supabase] = useState(() => createClient());

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
    }

    setCategories((data ?? []) as Category[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const handleOpenForm = (category: Category | null = null) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setIcon(category.icon);
      setColor(category.color);
    } else {
      setEditingCategory(null);
      setName('');
      setIcon('shopping');
      setColor('#94a3b8');
    }

    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
    setName('');
    setIcon('shopping');
    setColor('#94a3b8');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error(t('auth.login.error'));
      }

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({ name: name.trim(), icon, color })
          .eq('id', editingCategory.id);

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase.from('categories').insert({
          user_id: user.id,
          name: name.trim(),
          icon,
          color,
        });

        if (error) {
          throw error;
        }
      }

      handleCloseForm();
      toast.success(t('common.saved'));
      void fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(t('transactions.form.saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const accepted = await confirm({
      title: t('common.delete'),
      description: t('categories.confirmDelete'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      tone: 'danger',
    });

    if (!accepted) {
      return;
    }

    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) {
      toast.error(t('transactions.deleteError'));
      return;
    }

    toast.success(t('common.deleted'));
    void fetchCategories();
  };

  const defaultCategories = categories.filter((category) => category.is_default);
  const customCategories = categories.length - defaultCategories.length;

  return (
    <PageShell className="animate-fade-in">
      <PageHeader>
        <PageHeading title={t('categories.title')} />
        <PageHeaderActions>
          <Button type="button" variant="primary" onClick={() => handleOpenForm()}>
            <Tags size={16} />
            {t('categories.addCategory')}
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard label={t('categories.title')} value={loading ? '...' : categories.length} />
        <MetricCard
          label={t('categories.systemDefault')}
          value={loading ? '...' : defaultCategories.length}
          tone="accent"
        />
        <MetricCard
          label={t('categories.customCategory')}
          value={loading ? '...' : customCategories}
          tone="success"
        />
      </section>

      <SurfaceCard>
        <div className="grid gap-5">
          <SectionHeading title={language === 'id' ? 'Daftar kategori' : 'Category list'} />

          {loading ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={`category-skeleton-${index}`} className="grid gap-4 p-5 shadow-none">
                  <div className="skeleton h-12 w-12 rounded-2xl" />
                  <div className="grid gap-2">
                    <div className="skeleton skeleton-line skeleton-line--sm" />
                    <div className="skeleton skeleton-line skeleton-line--lg" />
                  </div>
                </Card>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <EmptyState
              title={t('categories.title')}
              icon={<Tags size={20} />}
              action={
                <Button type="button" variant="primary" onClick={() => handleOpenForm()}>
                  <Tags size={16} />
                  {t('categories.addCategory')}
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {categories.map((category) => (
                <article
                  key={category.id}
                  className="grid gap-4 rounded-[calc(var(--radius-card)-0.1rem)] border border-border-subtle bg-surface-2/55 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="grid h-12 w-12 place-items-center rounded-2xl border"
                      style={{
                        backgroundColor: `${category.color}18`,
                        color: category.color,
                        borderColor: `${category.color}35`,
                      }}
                    >
                      {getCategoryIcon(category.name, 'expense', 22, category.icon)}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-2xl"
                        onClick={() => handleOpenForm(category)}
                        aria-label={t('categories.form.edit')}
                        title={t('categories.form.edit')}
                      >
                        <Pencil size={16} />
                      </Button>
                      {!category.is_default ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-2xl text-danger"
                          onClick={() => {
                            void handleDelete(category.id);
                          }}
                          aria-label={t('common.delete')}
                          title={t('common.delete')}
                        >
                          <Trash2 size={16} />
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <strong className="truncate text-base font-semibold tracking-[-0.03em] text-text-1">
                      {category.name}
                    </strong>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={category.is_default ? 'accent' : 'default'}>
                        {category.is_default
                          ? t('categories.systemDefault')
                          : t('categories.customCategory')}
                      </Badge>
                      <span className="text-xs text-text-3">{category.icon}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </SurfaceCard>

      <Dialog open={isFormOpen} onOpenChange={(open) => (open ? setIsFormOpen(true) : handleCloseForm())}>
        <DialogContent className="max-w-[38rem]">
          <DialogHeader>
            <DialogTitle>{editingCategory ? t('categories.form.edit') : t('categories.form.new')}</DialogTitle>
          </DialogHeader>

          <form className="grid gap-4 pt-2" onSubmit={handleSubmit}>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_7.5rem]">
              <div className="grid gap-2">
                <label
                  className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3"
                  htmlFor="category-name"
                >
                  {t('categories.form.name')}
                </label>
                <Input
                  id="category-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="min-h-[2.85rem] px-3.5 py-2.5"
                  placeholder="Health, Gift, Hobby"
                  required
                />
              </div>

              <div className="grid gap-2">
                <label
                  className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3"
                  htmlFor="category-color"
                >
                  {t('categories.form.color')}
                </label>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    id="category-color"
                    type="color"
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                    className="h-[2.85rem] w-full rounded-[calc(var(--radius-card)-0.18rem)] border border-border-subtle bg-surface-1 p-1.5"
                  />
                </div>
              </div>
            </div>

            <div className="flex min-h-[2.85rem] items-center gap-3 rounded-[calc(var(--radius-card)-0.18rem)] border border-border-subtle bg-surface-2/70 px-3.5">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              <span className="text-sm text-text-2">{color}</span>
            </div>

            <div className="grid gap-2">
              <span className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3">
                {t('categories.form.selectIcon')}
              </span>
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
                {iconOptions.map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant={icon === option ? 'primary' : 'secondary'}
                    className="min-h-[2.75rem] rounded-[calc(var(--radius-card)-0.18rem)] px-0"
                    onClick={() => setIcon(option)}
                    title={option}
                  >
                    {getCategoryIcon(option, 'expense', 18, option)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-2.5 pt-1 sm:grid-cols-2">
              <Button type="button" variant="secondary" onClick={handleCloseForm}>
                {t('categories.form.cancel')}
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? t('categories.form.saving') : t('categories.form.save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
