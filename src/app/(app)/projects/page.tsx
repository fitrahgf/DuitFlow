'use client';

import { useCallback, useEffect, useState } from 'react';
import { FolderKanban, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/ConfirmDialogProvider';
import { useCurrencyPreferences } from '@/components/CurrencyPreferencesProvider';
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
import { CurrencyInput } from '@/components/ui/currency-input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/components/LanguageProvider';
import { projectTemplates } from '@/lib/projectTemplates';
import { createClient } from '@/lib/supabase/client';

interface ProjectCategory {
  id: string;
  name: string;
  budget_allocated: number;
}

interface Project {
  id: string;
  name: string;
  budget_target: number;
  status: 'active' | 'completed' | 'archived';
  project_categories: ProjectCategory[];
}

const nativeSelectClassName =
  'flex min-h-[3rem] w-full rounded-xl border border-border-subtle bg-surface-1 px-4 py-3 text-sm text-text-1 outline-none transition hover:border-border-strong focus:border-accent focus:ring-4 focus:ring-accent-soft/70';

export default function ProjectsPage() {
  const { t, language } = useLanguage();
  const { formatCurrency } = useCurrencyPreferences();
  const confirm = useConfirmDialog();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [budgetTarget, setBudgetTarget] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof projectTemplates>('custom');
  const [submitting, setSubmitting] = useState(false);
  const [supabase] = useState(() => createClient());

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*, project_categories(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      setLoading(false);
      return;
    }

    setProjects((data ?? []) as Project[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  const resetForm = () => {
    setName('');
    setBudgetTarget('');
    setSelectedTemplate('custom');
    setIsFormOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim() || !budgetTarget) {
      return;
    }

    setSubmitting(true);

    try {
      const { data: createdProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: name.trim(),
          budget_target: parseInt(budgetTarget, 10),
          status: 'active',
        })
        .select()
        .single();

      if (projectError) {
        throw projectError;
      }

      const template = projectTemplates[selectedTemplate];
      const categoriesToInsert = template.subcategoryKeys.map((key) => ({
        project_id: createdProject.id,
        name: t(key),
        budget_allocated: 0,
      }));

      const { error: categoryError } = await supabase
        .from('project_categories')
        .insert(categoriesToInsert);

      if (categoryError) {
        throw categoryError;
      }

      resetForm();
      toast.success(t('common.saved'));
      void fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error(t('transactions.form.saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: Project['status']) => {
    const { error } = await supabase.from('projects').update({ status }).eq('id', id);

    if (!error) {
      toast.success(t(`projects.status.${status}`));
      void fetchProjects();
    }
  };

  const handleDelete = async (id: string) => {
    const accepted = await confirm({
      title: t('common.delete'),
      description: t('projects.confirmDelete'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      tone: 'danger',
    });

    if (!accepted) {
      return;
    }

    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (!error) {
      toast.success(t('common.deleted'));
      void fetchProjects();
    }
  };

  const activeProjects = projects.filter((project) => project.status === 'active');
  const totalBudget = projects.reduce((sum, project) => sum + project.budget_target, 0);
  const templatePreview = projectTemplates[selectedTemplate].subcategoryKeys.map((key) => t(key));

  return (
    <PageShell className="animate-fade-in">
      <PageHeader>
        <PageHeading title={t('projects.title')} />
        <PageHeaderActions>
          <Button type="button" variant="primary" onClick={() => setIsFormOpen(true)}>
            <FolderKanban size={16} />
            {t('projects.createProject')}
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t('projects.title')} value={loading ? '...' : projects.length} />
        <MetricCard label={t('projects.status.active')} value={loading ? '...' : activeProjects.length} tone="accent" />
        <MetricCard label={t('projects.totalBudget')} value={loading ? '...' : formatCurrency(totalBudget)} tone="success" />
        <MetricCard
          label={t('projects.categoriesText')}
          value={loading ? '...' : projects.reduce((sum, project) => sum + (project.project_categories?.length ?? 0), 0)}
        />
      </section>

      <SurfaceCard>
        <div className="grid gap-5">
          <SectionHeading title={language === 'id' ? 'Daftar proyek' : 'Project list'} />

          {loading ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={`project-skeleton-${index}`} className="grid gap-4 p-5 shadow-none">
                  <div className="skeleton skeleton-line skeleton-line--sm" />
                  <div className="skeleton skeleton-line skeleton-line--lg" />
                  <div className="skeleton skeleton-line skeleton-line--md" />
                </Card>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <EmptyState
              title={t('projects.noProjects')}
              icon={<FolderKanban size={20} />}
              action={
                <Button type="button" variant="primary" onClick={() => setIsFormOpen(true)}>
                  <FolderKanban size={16} />
                  {t('projects.createProject')}
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {projects.map((project) => (
                <article
                  key={project.id}
                  className="grid gap-5 rounded-[calc(var(--radius-card)-0.1rem)] border border-border-subtle bg-surface-2/55 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="grid gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={project.status === 'active' ? 'accent' : 'default'}>
                          {t(`projects.status.${project.status}`)}
                        </Badge>
                        <Badge>{project.project_categories?.length ?? 0}</Badge>
                      </div>
                      <strong className="text-lg font-semibold tracking-[-0.04em] text-text-1">
                        {project.name}
                      </strong>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {project.status === 'active' ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleUpdateStatus(project.id, 'completed')}
                        >
                          {t('projects.status.markDone')}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleUpdateStatus(project.id, 'active')}
                        >
                          <RotateCcw size={14} />
                          {t('projects.status.reopen')}
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-danger"
                        onClick={() => {
                          void handleDelete(project.id);
                        }}
                      >
                        <Trash2 size={14} />
                        {t('common.delete')}
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-text-3">
                    <span>{t('projects.totalBudget')}</span>
                    <strong className="text-base font-semibold tracking-[-0.03em] text-text-1">
                      {formatCurrency(project.budget_target)}
                    </strong>
                  </div>

                  <div className="grid gap-2">
                    <span className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3">
                      {t('projects.categoriesText')}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {project.project_categories?.map((category) => (
                        <Badge key={category.id}>{category.name}</Badge>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </SurfaceCard>

      <Dialog open={isFormOpen} onOpenChange={(open) => (open ? setIsFormOpen(true) : resetForm())}>
        <DialogContent className="max-w-[38rem]">
          <DialogHeader>
            <DialogTitle>{t('projects.form.new')}</DialogTitle>
          </DialogHeader>

          <form className="grid gap-4 pt-2" onSubmit={handleSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <label
                  className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3"
                  htmlFor="project-name"
                >
                  {t('projects.form.name')}
                </label>
                <Input
                  id="project-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="min-h-[2.85rem] px-3.5 py-2.5"
                  placeholder="Bali Trip 2026"
                  required
                />
              </div>

              <div className="grid gap-2">
                <label
                  className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3"
                  htmlFor="project-budget"
                >
                  {t('projects.form.budgetTarget')}
                </label>
                <CurrencyInput
                  id="project-budget"
                  value={budgetTarget}
                  onValueChange={setBudgetTarget}
                  className="min-h-[2.85rem] px-3.5 py-2.5"
                  placeholder="5000000"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label
                className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3"
                htmlFor="project-template"
              >
                {t('projects.form.template')}
              </label>
              <select
                id="project-template"
                className={`${nativeSelectClassName} min-h-[2.85rem] px-3.5 py-2.5`}
                value={selectedTemplate}
                onChange={(event) =>
                  setSelectedTemplate(event.target.value as keyof typeof projectTemplates)
                }
              >
                {Object.entries(projectTemplates).map(([key, template]) => (
                  <option key={key} value={key}>
                    {t(template.nameKey)}
                  </option>
                ))}
              </select>
            </div>

            <Card className="border-border-subtle bg-surface-2/55 p-3 shadow-none">
              <div className="grid gap-2">
                <span className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3">
                  {t('projects.form.templateHint')}
                </span>
                <div className="flex flex-wrap gap-2">
                  {templatePreview.map((label) => (
                    <Badge key={label}>{label}</Badge>
                  ))}
                </div>
              </div>
            </Card>

            <div className="grid gap-2.5 pt-1 sm:grid-cols-2">
              <Button type="button" variant="secondary" onClick={resetForm}>
                {t('projects.form.cancel')}
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? t('projects.form.creating') : t('projects.form.create')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
