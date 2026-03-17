export const queryKeys = {
  dashboard: {
    overview: ["dashboard", "overview"] as const,
  },
  profile: {
    me: ["profile", "me"] as const,
  },
  telegram: {
    connection: ["telegram", "connection"] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (scope: "all" | "unread" | "read" = "all", type: string = "all") =>
      ["notifications", "list", scope, type] as const,
    unreadCount: ["notifications", "unread-count"] as const,
  },
  budgets: {
    all: ["budgets"] as const,
    month: (monthKey: string) => ["budgets", "month", monthKey] as const,
  },
  reports: {
    overview: ["reports", "overview"] as const,
  },
  wishlist: {
    all: ["wishlist"] as const,
    list: ["wishlist", "list"] as const,
  },
  categories: {
    all: ["categories"] as const,
    list: (type: "all" | "income" | "expense" = "all") =>
      ["categories", "list", type] as const,
  },
  projects: {
    all: ["projects"] as const,
    list: ["projects", "list"] as const,
  },
  subscriptions: {
    all: ["subscriptions"] as const,
    list: ["subscriptions", "list"] as const,
  },
  wallets: {
    all: ["wallets"] as const,
    active: ["wallets", "active"] as const,
    list: (view: "active" | "archived") => ["wallets", "list", view] as const,
    detail: (walletId: string) => ["wallets", "detail", walletId] as const,
  },
  transactions: {
    all: ["transactions"] as const,
    list: (scope: string = "all") => ["transactions", "list", scope] as const,
  },
  transfers: {
    all: ["transfers"] as const,
    list: ["transfers", "list"] as const,
    detail: (transferGroupId: string) =>
      ["transfers", "detail", transferGroupId] as const,
  },
};
