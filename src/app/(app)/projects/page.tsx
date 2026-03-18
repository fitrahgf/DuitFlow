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
import { getErrorMessage } from "@/lib/errors";
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
      toast.error(getErrorMessage(error, t("transactions.form.saveError")));
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
      toast.error(getErrorMessage(error, t("common.save")));
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
      toast.error(getErrorMessage(error, t("common.delete")));
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
      <PageHeader variant="compact">
        <PageHeading title={t("projects.title")} compact />
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
        <SurfaceCard role="featured" padding="compact">
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

      <SurfaceCard role="embedded" padding="compact">
        <div className="grid gap-2.5">
          <SectionHeading
            title={language === "id" ? "Daftar proyek" : "Project list"}
          />

          {loading ? (
            <div className="grid gap-3">
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
            <div className="grid gap-3 rounded-[calc(var(--radius-card)-0.08rem)] bg-surface-2/40 px-3 py-3 sm:px-4 sm:py-4 lg:grid-cols-[minmax(0,1.12fr)_minmax(14rem,0.88fr)] lg:items-start lg:gap-4">
              <div className="grid gap-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[calc(var(--radius-control)-0.04rem)] bg-surface-1 text-text-2">
                      <FolderKanban size={18} />
                    </span>
                    <div className="grid gap-1">
                      <strong className="text-[1rem] font-semibold tracking-[-0.04em] text-text-1">
                        {t("projects.emptyTitle")}
                      </strong>
                      <span className="text-[0.82rem] leading-5 text-text-2">
                        {language === "id"
                          ? "Mulai satu proyek untuk mengelompokkan anggaran penting."
                          : "Start one project to organize a focused budget."}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => setIsFormOpen(true)}
                    className="sm:min-w-[9.75rem]"
                  >
                    <FolderKanban size={16} />
                    {t("projects.createProject")}
                  </Button>
                </div>
              </div>

              <ProjectTemplatesAside language={language} templates={emptyStateTemplates} />
            </div>
          ) : (
            <div className="grid gap-0 divide-y divide-border-subtle/80">
              {projects.map((project) => (
                <article
                  key={project.id}
                  className="grid gap-2.5 py-3 first:pt-0 last:pb-0 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
                >
                  <div className="grid gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            project.status === "active" ? "accent" : "default"
                          }
                        >
                          {t(`projects.status.${project.status}`)}
                        </Badge>
                      </div>
                      <strong className="text-[0.98rem] font-semibold tracking-[-0.04em] text-text-1">
                        {project.name}
                      </strong>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[var(--font-size-meta)] text-text-2">
                        <span>
                          {t("projects.totalBudget")}: {formatCurrency(project.budget_target)}
                        </span>
                        <span className="text-text-3">-</span>
                        <span>
                          {t("projects.categoriesText")}: {project.project_categories?.length ?? 0}
                        </span>
                      </div>
                  </div>

                  <div className="grid justify-items-start gap-2 lg:justify-items-end">
                    <strong className="text-[0.98rem] font-semibold tracking-[-0.03em] text-text-1">
                       {formatCurrency(project.budget_target)}
                    </strong>
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
                  className="text-[var(--font-size-helper)] font-medium tracking-[0.01em] text-text-2"
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
                  className="text-[var(--font-size-helper)] font-medium tracking-[0.01em] text-text-2"
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
                className="text-[var(--font-size-helper)] font-medium tracking-[0.01em] text-text-2"
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
              <span className="text-[var(--font-size-helper)] font-medium tracking-[0.01em] text-text-2">
                {t("projects.form.templateHint")}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {templatePreview.map((label) => (
                  <span
                    key={label}
                    className="rounded-full bg-surface-2/72 px-2.5 py-1 text-[var(--font-size-chip)] font-medium text-text-2"
                  >
                    {label}
                  </span>
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
    <div className="grid gap-2.5 border-t border-border-subtle/70 pt-2.5 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
      <span className="text-[var(--font-size-meta)] font-medium tracking-[0.01em] text-text-2">
        {language === "id" ? "Template cepat" : "Quick templates"}
      </span>
      <div className="grid gap-0 divide-y divide-border-subtle/75">
        {templates.map((template) => (
          <div
            key={template.key}
            className="grid gap-1 py-2.5 first:pt-0 last:pb-0"
          >
            <strong className="text-[0.88rem] font-semibold tracking-[-0.03em] text-text-1">
              {template.title}
            </strong>
            <span className="text-[var(--font-size-meta)] leading-5 text-text-2">
              {template.categories.slice(0, 2).join(" / ")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
