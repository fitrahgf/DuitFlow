"use client";

import { useState } from "react";
import { FolderKanban, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirmDialog } from "@/components/ConfirmDialogProvider";
import { useCurrencyPreferences } from "@/components/CurrencyPreferencesProvider";
import {
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useProjectsQuery,
  useUpdateProjectStatusMutation,
} from "@/features/projects/hooks";
import type { ProjectRecord } from "@/features/projects/queries";
import { EmptyStateWorkspace } from "@/components/shared/EmptyState";
import {
  PageHeader,
  PageHeaderActions,
  PageHeading,
  PageShell,
  SectionHeading,
  SurfaceCard,
} from "@/components/shared/PagePrimitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { useLanguage } from "@/components/LanguageProvider";
import { projectTemplates } from "@/lib/projectTemplates";

function ProjectSummaryStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "default" | "accent" | "success";
}) {
  const dotClassName =
    tone === "accent"
      ? "bg-accent"
      : tone === "success"
        ? "bg-success"
        : "bg-text-3/35";

  return (
    <div className="grid gap-0.5 px-3 py-2.5 first:pl-0 last:pr-0">
      <div className="inline-flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dotClassName}`} aria-hidden="true" />
        <span className="text-[0.74rem] font-medium tracking-[0.01em] text-text-2">
          {label}
        </span>
      </div>
      <strong className="text-[1rem] font-semibold tracking-[-0.04em] text-text-1">
        {value}
      </strong>
    </div>
  );
}

export default function ProjectsPage() {
  const { t, language } = useLanguage();
  const { formatCurrency } = useCurrencyPreferences();
  const confirm = useConfirmDialog();
  const projectsQuery = useProjectsQuery();
  const createProjectMutation = useCreateProjectMutation();
  const updateProjectStatusMutation = useUpdateProjectStatusMutation();
  const deleteProjectMutation = useDeleteProjectMutation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [budgetTarget, setBudgetTarget] = useState("");
  const [selectedTemplate, setSelectedTemplate] =
    useState<keyof typeof projectTemplates>("custom");
  const projects = projectsQuery.data ?? [];
  const loading = projectsQuery.isLoading;
  const submitting = createProjectMutation.isPending;

  const resetForm = () => {
    setName("");
    setBudgetTarget("");
    setSelectedTemplate("custom");
    setIsFormOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim() || !budgetTarget) {
      return;
    }

    try {
      const template = projectTemplates[selectedTemplate];
      await createProjectMutation.mutateAsync({
        name,
        budgetTarget: parseInt(budgetTarget, 10),
        categoryNames: template.subcategoryKeys.map((key) => t(key)),
      });
      resetForm();
      toast.success(t("common.saved"));
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error(t("transactions.form.saveError"));
    }
  };

  const handleUpdateStatus = async (
    id: string,
    status: ProjectRecord["status"],
  ) => {
    try {
      await updateProjectStatusMutation.mutateAsync({ id, status });
      toast.success(t(`projects.status.${status}`));
    } catch (error) {
      console.error("Error updating project status:", error);
    }
  };

  const handleDelete = async (id: string) => {
    const accepted = await confirm({
      title: t("common.delete"),
      description: t("projects.confirmDelete"),
      confirmLabel: t("common.delete"),
      cancelLabel: t("common.cancel"),
      tone: "danger",
    });

    if (!accepted) {
      return;
    }

    try {
      await deleteProjectMutation.mutateAsync(id);
      toast.success(t("common.deleted"));
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const activeProjects = projects.filter(
    (project) => project.status === "active",
  );
  const totalBudget = projects.reduce(
    (sum, project) => sum + project.budget_target,
    0,
  );
  const templatePreview = projectTemplates[
    selectedTemplate
  ].subcategoryKeys.map((key) => t(key));
  const emptyStateTemplates = Object.entries(projectTemplates)
    .filter(([key]) => key !== "custom")
    .slice(0, 3)
    .map(([key, template]) => ({
      key,
      title: t(template.nameKey),
      categories: template.subcategoryKeys.slice(0, 3).map((categoryKey) => t(categoryKey)),
    }));
  const showSummaryStrip = loading || projects.length > 0;

  return (
    <PageShell className="animate-fade-in">
      <PageHeader>
        <PageHeading title={t("projects.title")} subtitle={t("projects.subtitle")} />
        <PageHeaderActions>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="max-sm:min-w-max"
            onClick={() => setIsFormOpen(true)}
          >
            <FolderKanban size={16} />
            {t("projects.createProject")}
          </Button>
        </PageHeaderActions>
      </PageHeader>

      {showSummaryStrip ? (
        <SurfaceCard padding="compact">
          <div className="grid gap-0 sm:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-border-subtle/80">
            <ProjectSummaryStat
              label={t("projects.title")}
              value={loading ? "..." : projects.length}
            />
            <ProjectSummaryStat
              label={t("projects.status.active")}
              value={loading ? "..." : activeProjects.length}
              tone="accent"
            />
            <ProjectSummaryStat
              label={t("projects.totalBudget")}
              value={loading ? "..." : formatCurrency(totalBudget)}
              tone="success"
            />
            <ProjectSummaryStat
              label={t("projects.categoriesText")}
              value={
                loading
                  ? "..."
                  : projects.reduce(
                      (sum, project) =>
                        sum + (project.project_categories?.length ?? 0),
                      0,
                    )
              }
            />
          </div>
        </SurfaceCard>
      ) : null}

      <SurfaceCard padding="compact">
        <div className="grid gap-2.5">
          <SectionHeading
            title={language === "id" ? "Daftar proyek" : "Project list"}
          />

          {loading ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card
                  key={`project-skeleton-${index}`}
                  className="grid gap-4 p-4 shadow-none"
                >
                  <div className="skeleton skeleton-line skeleton-line--sm" />
                  <div className="skeleton skeleton-line skeleton-line--lg" />
                  <div className="skeleton skeleton-line skeleton-line--md" />
                </Card>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <EmptyStateWorkspace
              eyebrow={language === "id" ? "Workspace proyek" : "Project workspace"}
              title={t("projects.emptyTitle")}
              description={t("projects.emptyDescription")}
              icon={<FolderKanban size={20} />}
              action={
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setIsFormOpen(true)}
                >
                  <FolderKanban size={16} />
                  {t("projects.createProject")}
                </Button>
              }
              supporting={
                <ProjectTemplatesAside
                  language={language}
                  templates={emptyStateTemplates}
                />
              }
            />
          ) : (
            <div className="grid gap-3 xl:grid-cols-2">
              {projects.map((project) => (
                <article
                  key={project.id}
                  className="grid gap-3 rounded-[calc(var(--radius-card)-0.1rem)] border border-border-subtle bg-surface-2/55 p-3.5"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="grid gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            project.status === "active" ? "accent" : "default"
                          }
                        >
                          {t(`projects.status.${project.status}`)}
                        </Badge>
                        <Badge>{project.project_categories?.length ?? 0}</Badge>
                      </div>
                      <strong className="text-base font-semibold tracking-[-0.04em] text-text-1">
                        {project.name}
                      </strong>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {project.status === "active" ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            handleUpdateStatus(project.id, "completed")
                          }
                        >
                          {t("projects.status.markDone")}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            handleUpdateStatus(project.id, "active")
                          }
                        >
                          <RotateCcw size={14} />
                          {t("projects.status.reopen")}
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
                        {t("common.delete")}
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-text-3">
                    <span>{t("projects.totalBudget")}</span>
                    <strong className="text-base font-semibold tracking-[-0.03em] text-text-1">
                      {formatCurrency(project.budget_target)}
                    </strong>
                  </div>

                  <div className="grid gap-2">
                    <span className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3">
                      {t("projects.categoriesText")}
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

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => (open ? setIsFormOpen(true) : resetForm())}
      >
        <DialogContent className="max-w-[38rem]">
          <DialogHeader>
            <DialogTitle>{t("projects.form.new")}</DialogTitle>
          </DialogHeader>

          <form className="grid gap-4 pt-2" onSubmit={handleSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <label
                  className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3"
                  htmlFor="project-name"
                >
                  {t("projects.form.name")}
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
                  {t("projects.form.budgetTarget")}
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
                {t("projects.form.template")}
              </label>
              <NativeSelect
                id="project-template"
                value={selectedTemplate}
                onChange={(event) =>
                  setSelectedTemplate(
                    event.target.value as keyof typeof projectTemplates,
                  )
                }
              >
                {Object.entries(projectTemplates).map(([key, template]) => (
                  <option key={key} value={key}>
                    {t(template.nameKey)}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="grid gap-2 border-t border-border-subtle/80 pt-3">
              <span className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3">
                {t("projects.form.templateHint")}
              </span>
              <div className="flex flex-wrap gap-2">
                {templatePreview.map((label) => (
                  <Badge key={label}>{label}</Badge>
                ))}
              </div>
            </div>

            <div className="grid gap-2.5 pt-1 sm:grid-cols-2">
              <Button type="button" variant="secondary" onClick={resetForm}>
                {t("projects.form.cancel")}
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting
                  ? t("projects.form.creating")
                  : t("projects.form.create")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function ProjectTemplatesAside({
  language,
  templates,
}: {
  language: "en" | "id";
  templates: Array<{
    key: string;
    title: string;
    categories: string[];
  }>;
}) {
  return (
    <>
      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-text-3">
        {language === "id" ? "Template cepat" : "Quick templates"}
      </span>
      <div className="grid gap-0 divide-y divide-border-subtle/80">
        {templates.map((template) => (
          <div
            key={template.key}
            className="grid gap-2 py-2.5 first:pt-0 last:pb-0"
          >
            <strong className="text-sm font-semibold tracking-[-0.03em] text-text-1">
              {template.title}
            </strong>
            <div className="flex flex-wrap gap-1.5">
              {template.categories.map((category) => (
                <Badge key={category}>{category}</Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
