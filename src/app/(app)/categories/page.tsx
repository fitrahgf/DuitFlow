"use client";

import { useState } from "react";
import { Pencil, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirmDialog } from "@/components/ConfirmDialogProvider";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  useCategoriesPageQuery,
  useDeleteCategoryMutation,
  useSaveCategoryMutation,
} from "@/features/categories/hooks";
import type { CategoryRecord } from "@/features/categories/queries";
import {
  PageHeader,
  PageHeaderActions,
  PageHeading,
  PageShell,
  SurfaceCard,
} from "@/components/shared/PagePrimitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/LanguageProvider";
import { getCategoryIcon } from "@/lib/icons";

const iconOptions = [
  "shopping",
  "food",
  "coffee",
  "transport",
  "bill",
  "home",
  "electricity",
  "phone",
  "game",
  "health",
  "flight",
  "gift",
  "income",
  "expense",
];

export default function CategoriesPage() {
  const { t, language } = useLanguage();
  const confirm = useConfirmDialog();
  const categoriesQuery = useCategoriesPageQuery();
  const saveCategoryMutation = useSaveCategoryMutation();
  const deleteCategoryMutation = useDeleteCategoryMutation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRecord | null>(
    null,
  );
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("shopping");
  const [color, setColor] = useState("#94a3b8");
  const categories = categoriesQuery.data ?? [];
  const loading = categoriesQuery.isLoading;
  const submitting = saveCategoryMutation.isPending;

  const handleOpenForm = (category: CategoryRecord | null = null) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setIcon(category.icon);
      setColor(category.color);
    } else {
      setEditingCategory(null);
      setName("");
      setIcon("shopping");
      setColor("#94a3b8");
    }

    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
    setName("");
    setIcon("shopping");
    setColor("#94a3b8");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    try {
      await saveCategoryMutation.mutateAsync({
        id: editingCategory?.id,
        name,
        icon,
        color,
      });
      handleCloseForm();
      toast.success(t("common.saved"));
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error(t("transactions.form.saveError"));
    }
  };

  const handleDelete = async (id: string) => {
    const accepted = await confirm({
      title: t("common.delete"),
      description: t("categories.confirmDelete"),
      confirmLabel: t("common.delete"),
      cancelLabel: t("common.cancel"),
      tone: "danger",
    });

    if (!accepted) {
      return;
    }

    try {
      await deleteCategoryMutation.mutateAsync(id);
      toast.success(t("common.deleted"));
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error(t("transactions.deleteError"));
    }
  };

  const defaultCategories = categories.filter(
    (category) => category.is_default,
  );
  const customCategories = categories.length - defaultCategories.length;

  return (
    <PageShell className="animate-fade-in">
      <PageHeader variant="compact">
        <PageHeading title={t("categories.title")} compact />
        <PageHeaderActions>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="max-sm:min-w-max"
            onClick={() => handleOpenForm()}
          >
            <Tags size={16} />
            {t("categories.addCategory")}
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <SurfaceCard role="embedded" padding="compact">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle/80 pb-2.5">
            <div className="grid gap-0.5">
              <h2 className="m-0 text-[1rem] font-semibold tracking-[-0.04em] text-text-1">
                {language === "id" ? "Daftar kategori" : "Category list"}
              </h2>
              <span className="text-[var(--font-size-meta)] text-text-2">
                {language === "id"
                  ? `${defaultCategories.length} sistem, ${customCategories} custom`
                  : `${defaultCategories.length} system, ${customCategories} custom`}
              </span>
            </div>
            <div className="grid gap-0 divide-y divide-border-subtle/70 text-right sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <CategoryStatItem
                label={language === "id" ? "Total" : "Total"}
                value={loading ? "..." : String(categories.length)}
              />
              <CategoryStatItem
                label={language === "id" ? "Custom" : "Custom"}
                value={loading ? "..." : `${customCategories}/${categories.length}`}
              />
            </div>
          </div>

          {loading ? (
            <div className="grid gap-0 divide-y divide-border-subtle/80">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`category-skeleton-${index}`}
                  className="grid gap-2.5 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="skeleton h-9 w-9 rounded-[1rem]" />
                    <div className="grid min-w-0 flex-1 gap-2">
                      <div className="skeleton skeleton-line skeleton-line--sm" />
                      <div className="skeleton skeleton-line skeleton-line--lg" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <EmptyState
              title={t("categories.title")}
              icon={<Tags size={20} />}
              variant="featured"
              action={
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => handleOpenForm()}
                >
                  <Tags size={16} />
                  {t("categories.addCategory")}
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3">
              <CategoryGroupSection
                title={language === "id" ? "Default" : "Default"}
                description={
                  language === "id"
                    ? "Kategori bawaan sistem."
                    : "Built-in system categories."
                }
                categories={defaultCategories}
                t={t}
                onEdit={handleOpenForm}
                onDelete={handleDelete}
              />
              <CategoryGroupSection
                title={language === "id" ? "Custom" : "Custom"}
                description={
                  language === "id"
                    ? "Kategori yang Anda buat sendiri."
                    : "Categories you created."
                }
                categories={categories.filter((category) => !category.is_default)}
                t={t}
                onEdit={handleOpenForm}
                onDelete={handleDelete}
              />
            </div>
          )}
        </div>
      </SurfaceCard>

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) =>
          open ? setIsFormOpen(true) : handleCloseForm()
        }
      >
        <DialogContent className="max-w-[38rem]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory
                ? t("categories.form.edit")
                : t("categories.form.new")}
            </DialogTitle>
          </DialogHeader>

          <form className="grid gap-4 pt-2" onSubmit={handleSubmit}>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_9rem]">
              <div className="grid gap-2">
                <label
                  className="text-[var(--font-size-helper)] font-medium tracking-[0.01em] text-text-2"
                  htmlFor="category-name"
                >
                  {t("categories.form.name")}
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
                  className="text-[var(--font-size-helper)] font-medium tracking-[0.01em] text-text-2"
                  htmlFor="category-color"
                >
                  {t("categories.form.color")}
                </label>
                <div className="flex items-center gap-2 rounded-[calc(var(--radius-card)-0.18rem)] border border-border-subtle bg-surface-2/55 p-1.5">
                  <input
                    id="category-color"
                    type="color"
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                    className="h-10 w-12 shrink-0 rounded-[calc(var(--radius-card)-0.24rem)] border border-border-subtle bg-surface-1 p-1"
                  />
                  <span className="text-[var(--font-size-meta)] font-medium text-text-2">
                    {color}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <span className="text-[var(--font-size-helper)] font-medium tracking-[0.01em] text-text-2">
                {t("categories.form.selectIcon")}
              </span>
              <div className="grid grid-cols-5 gap-1.25 sm:grid-cols-7">
                {iconOptions.map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant={icon === option ? "primary" : "secondary"}
                    className="min-h-[2.45rem] rounded-[calc(var(--radius-card)-0.18rem)] px-0"
                    onClick={() => setIcon(option)}
                    title={option}
                  >
                    {getCategoryIcon(option, "expense", 18, option)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-2.5 pt-1 sm:grid-cols-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseForm}
              >
                {t("categories.form.cancel")}
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting
                  ? t("categories.form.saving")
                  : t("categories.form.save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function CategoryStatItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid gap-0.5 px-0 py-1.5 first:pt-0 last:pb-0 sm:px-3 sm:py-0 sm:first:pl-0 sm:last:pr-0">
      <span className="text-[var(--font-size-meta)] font-medium text-text-2">{label}</span>
      <strong className="text-[0.96rem] font-semibold tracking-[-0.04em] text-text-1">
        {value}
      </strong>
    </div>
  );
}

function CategoryGroupSection({
  title,
  description,
  categories,
  t,
  onEdit,
  onDelete,
}: {
  title: string;
  description: string;
  categories: CategoryRecord[];
  t: (key: string) => string;
  onEdit: (category: CategoryRecord) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <section className="grid gap-2">
      <div className="grid gap-0.5">
        <h3 className="m-0 text-[0.92rem] font-semibold tracking-[-0.03em] text-text-1">
          {title}
        </h3>
        <span className="text-[var(--font-size-meta)] text-text-2">{description}</span>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-[calc(var(--radius-card)-0.16rem)] border border-dashed border-border-subtle/80 px-3 py-2.5 text-[var(--font-size-meta)] text-text-2">
          {t("common.noData")}
        </div>
      ) : (
        <div className="grid gap-0 divide-y divide-border-subtle/80 rounded-[calc(var(--radius-card)-0.14rem)] border border-border-subtle/70 bg-surface-1/72 px-3">
          {categories.map((category) => (
            <article
              key={category.id}
              className="grid gap-2.5 py-2.5 first:pt-3 last:pb-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center"
            >
              <div
                className="grid h-9 w-9 place-items-center rounded-[1rem] border md:self-start"
                style={{
                  backgroundColor: `${category.color}18`,
                  color: category.color,
                  borderColor: `${category.color}35`,
                }}
              >
                {getCategoryIcon(category.name, "expense", 20, category.icon)}
              </div>

              <div className="grid gap-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="truncate text-[0.94rem] font-semibold tracking-[-0.03em] text-text-1">
                    {category.name}
                  </strong>
                  <Badge
                    variant={category.is_default ? "accent" : "default"}
                    className="h-6 rounded-full px-2.5"
                  >
                    {category.is_default
                      ? t("categories.systemDefault")
                      : t("categories.customCategory")}
                  </Badge>
                </div>
              </div>

              <div className="inline-flex items-center gap-0.5 rounded-full border border-border-subtle/75 bg-surface-2/45 p-0.5 md:justify-self-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => onEdit(category)}
                  aria-label={t("categories.form.edit")}
                  title={t("categories.form.edit")}
                >
                  <Pencil size={16} />
                </Button>
                {!category.is_default ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-danger"
                    onClick={() => {
                      void onDelete(category.id);
                    }}
                    aria-label={t("common.delete")}
                    title={t("common.delete")}
                  >
                    <Trash2 size={16} />
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
