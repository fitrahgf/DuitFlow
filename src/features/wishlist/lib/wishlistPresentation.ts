"use client";

import { differenceInCalendarDays, parseISO } from "date-fns";
import type { WishlistItem } from "@/lib/queries/wishlist";
import type {
  WishlistFormInput,
  WishlistReviewInput,
} from "@/lib/validators/wishlist";

export type WishlistTab =
  | "all"
  | "due"
  | "pending"
  | "approved"
  | "postponed"
  | "purchased"
  | "cancelled";

export function toDateInputValue(value: Date) {
  return value.toISOString().split("T")[0];
}

export function formatWishlistDate(value: string, language: "en" | "id") {
  return new Date(value).toLocaleDateString(
    language === "id" ? "id-ID" : "en-US",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}

export function getWishlistDefaults(
  item?: WishlistItem | null,
): WishlistFormInput {
  return {
    item_name: item?.item_name ?? "",
    target_price: item?.target_price ?? undefined,
    url: item?.url ?? "",
    note: item?.note ?? "",
    priority: item?.priority ?? "medium",
    reason: item?.reason ?? "",
    cooling_days: String(item?.cooling_days ?? 3) as "3" | "5" | "7",
    selected_wallet_id: item?.selected_wallet_id ?? "",
  };
}

export function getWishlistReviewDefaults(): WishlistReviewInput {
  return {
    next_status: "approved_to_buy",
    postpone_days: "3",
  };
}

export function isWishlistReviewDue(item: WishlistItem) {
  if (item.status !== "pending_review" && item.status !== "postponed") {
    return false;
  }

  return differenceInCalendarDays(parseISO(item.review_date), new Date()) <= 0;
}

export function getWishlistCountdownLabel(
  item: WishlistItem,
  language: "en" | "id",
) {
  const difference = differenceInCalendarDays(
    parseISO(item.review_date),
    new Date(),
  );

  if (item.status === "approved_to_buy") {
    return language === "id" ? "Siap dikonversi" : "Ready to convert";
  }

  if (difference <= 0) {
    return language === "id" ? "Siap ditinjau" : "Ready to review";
  }

  if (difference === 1) {
    return language === "id" ? "1 hari lagi" : "1 day left";
  }

  return language === "id"
    ? `${difference} hari lagi`
    : `${difference} days left`;
}

export function getWishlistCoolingProgress(item: WishlistItem) {
  const remainingDays = differenceInCalendarDays(
    parseISO(item.review_date),
    new Date(),
  );
  const totalDays = Math.max(item.cooling_days, 1);

  return Math.min(
    Math.max((totalDays - Math.max(remainingDays, 0)) / totalDays, 0),
    1,
  );
}

export function getWishlistPriorityVariant(priority: WishlistItem["priority"]) {
  return priority === "high"
    ? "danger"
    : priority === "low"
      ? "accent"
      : "warning";
}

export function getWishlistStatusVariant(status: WishlistItem["status"]) {
  if (status === "purchased") {
    return "success";
  }

  if (status === "cancelled") {
    return "danger";
  }

  if (status === "approved_to_buy") {
    return "accent";
  }

  return "warning";
}

export function getWishlistCardTone(item: WishlistItem) {
  if (item.status === "purchased" || item.status === "cancelled") {
    return "bg-surface-2/55";
  }

  if (item.status === "approved_to_buy") {
    return "border-accent/18 bg-surface-1";
  }

  if (isWishlistReviewDue(item)) {
    return "border-warning/18 bg-surface-2/55";
  }

  return "";
}

export function getWishlistProgressTone(
  item: WishlistItem,
): "accent" | "success" | "warning" | "danger" {
  if (item.status === "purchased") {
    return "success";
  }

  if (item.status === "cancelled") {
    return "danger";
  }

  if (item.status === "approved_to_buy") {
    return "accent";
  }

  return isWishlistReviewDue(item) ? "warning" : "accent";
}
