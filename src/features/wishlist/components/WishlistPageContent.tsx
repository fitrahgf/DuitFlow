"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { addDays } from "date-fns";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShoppingBasket, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCurrencyPreferences } from "@/components/CurrencyPreferencesProvider";
import type { TransactionFormPrefill } from "@/components/TransactionForm";
import { useLanguage } from "@/components/LanguageProvider";
import {
  PageHeader,
  PageHeaderActions,
  PageHeading,
  PageShell,
} from "@/components/shared/PagePrimitives";
import { Button } from "@/components/ui/button";
import {
  WishlistBoardSection,
  WishlistConvertDialog,
  WishlistDueBanner,
  WishlistFormDialog,
  WishlistReviewDialog,
  WishlistSummarySection,
} from "@/features/wishlist/components/WishlistSections";
import {
  formatWishlistDate,
  getWishlistCardTone,
  getWishlistCoolingProgress,
  getWishlistCountdownLabel,
  getWishlistDefaults,
  getWishlistPriorityVariant,
  getWishlistProgressTone,
  getWishlistReviewDefaults,
  getWishlistStatusVariant,
  isWishlistReviewDue,
  toDateInputValue,
  type WishlistTab,
} from "@/features/wishlist/lib/wishlistPresentation";
import { NOTIFICATIONS_REFRESH_EVENT } from "@/lib/events";
import { getErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/queries/keys";
import { fetchActiveWallets } from "@/lib/queries/reference";
import { fetchWishlistItems, type WishlistItem } from "@/lib/queries/wishlist";
import { createClient } from "@/lib/supabase/client";
import {
  wishlistFormSchema,
  wishlistReviewSchema,
  type WishlistFormInput,
  type WishlistFormValues,
  type WishlistReviewInput,
  type WishlistReviewValues,
} from "@/lib/validators/wishlist";

export function WishlistPageContent() {
  const { t, language } = useLanguage();
  const { formatCurrency } = useCurrencyPreferences();
  const queryClient = useQueryClient();
  const [supabase] = useState(() => createClient());
  const [activeTab, setActiveTab] = useState<WishlistTab>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [reviewingItem, setReviewingItem] = useState<WishlistItem | null>(null);
  const [convertingItem, setConvertingItem] = useState<WishlistItem | null>(
    null,
  );

  const itemsQuery = useQuery({
    queryKey: queryKeys.wishlist.list,
    queryFn: fetchWishlistItems,
  });
  const walletsQuery = useQuery({
    queryKey: queryKeys.wallets.active,
    queryFn: fetchActiveWallets,
  });

  const wishlistForm = useForm<
    WishlistFormInput,
    undefined,
    WishlistFormValues
  >({
    resolver: zodResolver(wishlistFormSchema),
    defaultValues: getWishlistDefaults(),
  });

  const reviewForm = useForm<
    WishlistReviewInput,
    undefined,
    WishlistReviewValues
  >({
    resolver: zodResolver(wishlistReviewSchema),
    defaultValues: getWishlistReviewDefaults(),
  });

  useEffect(() => {
    wishlistForm.reset(getWishlistDefaults(editingItem));
  }, [editingItem, wishlistForm]);

  useEffect(() => {
    reviewForm.reset(getWishlistReviewDefaults());
  }, [reviewForm, reviewingItem]);

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
        editingItem?.status === "approved_to_buy" ||
        editingItem?.status === "purchased" ||
        editingItem?.status === "cancelled"
          ? editingItem.status
          : "pending_review";

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
          preservedStatus === "approved_to_buy" ||
          preservedStatus === "purchased" ||
          preservedStatus === "cancelled"
            ? editingItem?.review_date
            : computedReviewDate,
        selected_wallet_id: values.selected_wallet_id || null,
        status: preservedStatus,
      };

      if (editingItem) {
        const { error } = await supabase
          .from("wishlist")
          .update(payload)
          .eq("id", editingItem.id);

        if (error) {
          throw error;
        }

        return;
      }

      const { error } = await supabase.from("wishlist").insert(payload);

      if (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      setIsFormOpen(false);
      setEditingItem(null);
      await invalidateWishlistData();
      window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
      toast.success(t("wishlist.form.saveSuccess"));
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, t("wishlist.form.saveError"))),
  });

  const reviewWishlistMutation = useMutation({
    mutationFn: async (values: WishlistReviewValues) => {
      if (!reviewingItem) {
        return;
      }

      const payload: Record<string, string | number | null> = {
        status: values.next_status,
      };

      if (values.next_status === "postponed") {
        const postponeDays = Number(values.postpone_days ?? "3");
        payload.cooling_days = postponeDays;
        payload.review_date = toDateInputValue(
          addDays(new Date(), postponeDays),
        );
      }

      const { error } = await supabase
        .from("wishlist")
        .update(payload)
        .eq("id", reviewingItem.id);

      if (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      setReviewingItem(null);
      await invalidateWishlistData();
      window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
      toast.success(t("wishlist.review.saveSuccess"));
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, t("wishlist.review.saveError"))),
  });

  const markPurchasedMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("wishlist")
        .update({ status: "purchased" })
        .eq("id", itemId);

      if (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      await invalidateWishlistData();
      window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
      toast.success(t("wishlist.actions.purchaseSuccess"));
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, t("wishlist.actions.purchaseError"))),
  });

  const items = itemsQuery.data ?? [];
  const wallets = walletsQuery.data ?? [];
  const selectableWallets =
    editingItem?.wallets &&
    !wallets.some((wallet) => wallet.id === editingItem.wallets?.id)
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
  const dueItems = items.filter(isWishlistReviewDue);
  const approvedItems = items.filter(
    (item) => item.status === "approved_to_buy",
  );
  const pendingItems = items.filter(
    (item) => item.status === "pending_review" && !isWishlistReviewDue(item),
  );
  const postponedItems = items.filter(
    (item) => item.status === "postponed" && !isWishlistReviewDue(item),
  );
  const purchasedItems = items.filter((item) => item.status === "purchased");
  const cancelledItems = items.filter((item) => item.status === "cancelled");

  const tabs: { key: WishlistTab; label: string; count: number }[] = [
    { key: "all", label: t("wishlist.tabs.all"), count: items.length },
    { key: "due", label: t("wishlist.tabs.due"), count: dueItems.length },
    {
      key: "pending",
      label: t("wishlist.tabs.pending"),
      count: pendingItems.length,
    },
    {
      key: "approved",
      label: t("wishlist.tabs.approved"),
      count: approvedItems.length,
    },
    {
      key: "postponed",
      label: t("wishlist.tabs.postponed"),
      count:
        postponedItems.length +
        dueItems.filter((item) => item.status === "postponed").length,
    },
    {
      key: "purchased",
      label: t("wishlist.tabs.purchased"),
      count: purchasedItems.length,
    },
    {
      key: "cancelled",
      label: t("wishlist.tabs.cancelled"),
      count: cancelledItems.length,
    },
  ];

  const sectionsByTab: Record<
    WishlistTab,
    { title: string; items: WishlistItem[] }[]
  > = {
    all: [
      { title: t("wishlist.sections.due"), items: dueItems },
      { title: t("wishlist.sections.approved"), items: approvedItems },
      { title: t("wishlist.sections.pending"), items: pendingItems },
      { title: t("wishlist.sections.postponed"), items: postponedItems },
      {
        title: t("wishlist.sections.history"),
        items: [...purchasedItems, ...cancelledItems],
      },
    ],
    due: [{ title: t("wishlist.sections.due"), items: dueItems }],
    pending: [{ title: t("wishlist.sections.pending"), items: pendingItems }],
    approved: [
      { title: t("wishlist.sections.approved"), items: approvedItems },
    ],
    postponed: [
      {
        title: t("wishlist.sections.postponed"),
        items: [
          ...postponedItems,
          ...dueItems.filter((item) => item.status === "postponed"),
        ],
      },
    ],
    purchased: [
      { title: t("wishlist.sections.purchased"), items: purchasedItems },
    ],
    cancelled: [
      { title: t("wishlist.sections.cancelled"), items: cancelledItems },
    ],
  };

  const activeSections = sectionsByTab[activeTab];
  const hasAnyVisibleItem = activeSections.some(
    (section) => section.items.length > 0,
  );
  const totalTrackedValue = items.reduce(
    (sum, item) => sum + (item.target_price ?? 0),
    0,
  );
  const linkedWalletCount = items.filter(
    (item) => item.selected_wallet_id,
  ).length;
  const convertingPrefill: TransactionFormPrefill | null = convertingItem
    ? {
        title: convertingItem.item_name,
        amount: convertingItem.target_price ?? undefined,
        type: "expense",
        wallet_id: convertingItem.selected_wallet_id ?? undefined,
        note: convertingItem.note ?? convertingItem.reason ?? undefined,
      }
    : null;

  return (
    <PageShell className="animate-fade-in">
      <PageHeader>
        <PageHeading title={t("wishlist.title")} subtitle={t("wishlist.subtitle")} />
        <PageHeaderActions>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setActiveTab("due");

              if (dueItems[0]) {
                setReviewingItem(dueItems[0]);
              }
            }}
            disabled={dueItems.length === 0}
          >
            <Sparkles size={16} />
            {t("wishlist.actions.reviewNow")}
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
            {t("wishlist.addItem")}
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <WishlistSummarySection
        isLoading={itemsQuery.isLoading}
        itemsCount={items.length}
        dueCount={dueItems.length}
        approvedCount={approvedItems.length}
        linkedWalletCount={linkedWalletCount}
        totalTrackedValue={totalTrackedValue}
        t={t}
        formatCurrency={formatCurrency}
      />

      <WishlistDueBanner dueCount={dueItems.length} t={t} />

      <WishlistBoardSection
        items={items}
        activeTab={activeTab}
        tabs={tabs}
        activeSections={activeSections}
        hasAnyVisibleItem={hasAnyVisibleItem}
        isLoading={itemsQuery.isLoading}
        isError={itemsQuery.isError}
        convertPending={markPurchasedMutation.isPending}
        language={language}
        t={t}
        onTabChange={(value) => setActiveTab(value as WishlistTab)}
        onCreateItem={() => {
          setEditingItem(null);
          setIsFormOpen(true);
        }}
        onEditItem={(item) => {
          setEditingItem(item);
          setIsFormOpen(true);
        }}
        onReviewItem={setReviewingItem}
        onConvertItem={setConvertingItem}
        formatDate={formatWishlistDate}
        getCountdownLabel={getWishlistCountdownLabel}
        getPriorityVariant={getWishlistPriorityVariant}
        getStatusVariant={getWishlistStatusVariant}
        getCardTone={getWishlistCardTone}
        getProgressTone={getWishlistProgressTone}
        isReviewDue={isWishlistReviewDue}
        getCoolingProgress={getWishlistCoolingProgress}
      />

      <WishlistFormDialog
        open={isFormOpen}
        editingItem={editingItem}
        wallets={selectableWallets}
        walletsLoading={walletsQuery.isLoading}
        savePending={saveWishlistMutation.isPending}
        form={wishlistForm}
        t={t}
        onOpenChange={(open) => {
          setIsFormOpen(open);

          if (!open) {
            setEditingItem(null);
          }
        }}
        onSubmit={(values) => saveWishlistMutation.mutate(values)}
      />

      <WishlistReviewDialog
        reviewingItem={reviewingItem}
        open={Boolean(reviewingItem)}
        savePending={reviewWishlistMutation.isPending}
        form={reviewForm}
        t={t}
        language={language}
        formatCurrency={formatCurrency}
        formatDate={formatWishlistDate}
        getStatusVariant={getWishlistStatusVariant}
        onOpenChange={(open) => {
          if (!open) {
            setReviewingItem(null);
          }
        }}
        onSubmit={(values) => reviewWishlistMutation.mutate(values)}
      />

      <WishlistConvertDialog
        open={Boolean(convertingItem)}
        prefill={convertingPrefill}
        t={t}
        onOpenChange={(open) => {
          if (!open) {
            setConvertingItem(null);
          }
        }}
        onSuccess={() => {
          const convertedItem = convertingItem;
          setConvertingItem(null);

          if (convertedItem) {
            markPurchasedMutation.mutate(convertedItem.id);
          }
        }}
      />
    </PageShell>
  );
}
