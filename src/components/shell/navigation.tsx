import type { ReactNode } from "react";
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  CreditCard,
  FolderKanban,
  Gift,
  Inbox,
  LayoutDashboard,
  Settings,
  Target,
  Tags,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavHref =
  | "/dashboard"
  | "/transactions"
  | "/transfer"
  | "/budgets"
  | "/reports"
  | "/wallets"
  | "/categories"
  | "/projects"
  | "/wishlist"
  | "/notifications"
  | "/subscriptions"
  | "/settings";

type NavGroup = "core" | "planning" | "settings";

interface NavItemConfig {
  href: NavHref;
  labelKey: string;
  icon: LucideIcon;
  group: NavGroup;
}

export interface ShellNavItem {
  href: NavHref;
  label: string;
  icon: ReactNode;
  active: boolean;
  badgeCount: number;
  group: NavGroup;
}

export interface ShellNavSection {
  key: NavGroup;
  label: string;
  items: ShellNavItem[];
}

const navItems: NavItemConfig[] = [
  {
    href: "/dashboard",
    labelKey: "nav.dashboard",
    icon: LayoutDashboard,
    group: "core",
  },
  {
    href: "/transactions",
    labelKey: "nav.transactions",
    icon: CreditCard,
    group: "core",
  },
  {
    href: "/transfer",
    labelKey: "nav.transfer",
    icon: ArrowLeftRight,
    group: "core",
  },
  { href: "/wallets", labelKey: "nav.wallets", icon: Wallet, group: "core" },
  {
    href: "/budgets",
    labelKey: "nav.budgets",
    icon: Target,
    group: "planning",
  },
  {
    href: "/reports",
    labelKey: "nav.reports",
    icon: BarChart3,
    group: "planning",
  },
  {
    href: "/categories",
    labelKey: "nav.categories",
    icon: Tags,
    group: "core",
  },
  {
    href: "/projects",
    labelKey: "nav.projects",
    icon: FolderKanban,
    group: "planning",
  },
  {
    href: "/wishlist",
    labelKey: "nav.wishlist",
    icon: Gift,
    group: "planning",
  },
  {
    href: "/notifications",
    labelKey: "nav.notifications",
    icon: Inbox,
    group: "settings",
  },
  {
    href: "/subscriptions",
    labelKey: "nav.subscriptions",
    icon: Bell,
    group: "planning",
  },
  {
    href: "/settings",
    labelKey: "nav.settings",
    icon: Settings,
    group: "settings",
  },
];

const desktopSectionOrder: Record<NavGroup, NavHref[]> = {
  core: ["/dashboard", "/transactions", "/wallets", "/transfer", "/categories"],
  planning: [
    "/budgets",
    "/reports",
    "/wishlist",
    "/projects",
    "/subscriptions",
  ],
  settings: ["/notifications", "/settings"],
};

const tabletPrimaryOrder: NavHref[] = [
  "/dashboard",
  "/transactions",
  "/wallets",
  "/notifications",
];
const mobilePrimaryOrder: NavHref[] = [
  "/dashboard",
  "/transactions",
  "/wallets",
];
const moreItemsOrder: NavHref[] = [
  "/transfer",
  "/budgets",
  "/reports",
  "/categories",
  "/projects",
  "/wishlist",
  "/subscriptions",
  "/settings",
];

interface BuildShellNavigationOptions {
  pathname: string;
  unreadCount: number;
  t: (key: string) => string;
  language: string;
}

export function buildShellNavigation({
  pathname,
  unreadCount,
  t,
  language,
}: BuildShellNavigationOptions) {
  const toRenderItem = (item: NavItemConfig): ShellNavItem => ({
    href: item.href,
    label: t(item.labelKey),
    icon: <item.icon size={16} />,
    active: pathname === item.href,
    badgeCount: item.href === "/notifications" ? unreadCount : 0,
    group: item.group,
  });

  const getItemsByHref = (hrefs: NavHref[]) =>
    hrefs.map((href) => {
      const match = navItems.find((item) => item.href === href);

      if (!match) {
        throw new Error(`Missing nav item config for ${href}`);
      }

      return toRenderItem(match);
    });

  const desktopSections: ShellNavSection[] = [
    {
      key: "core",
      label: language === "id" ? "Ruang kerja" : "Workspace",
      items: getItemsByHref(desktopSectionOrder.core),
    },
    {
      key: "planning",
      label: language === "id" ? "Perencanaan" : "Planning",
      items: getItemsByHref(desktopSectionOrder.planning),
    },
    {
      key: "settings",
      label: language === "id" ? "Sistem" : "System",
      items: getItemsByHref(desktopSectionOrder.settings),
    },
  ];

  const pageMap = navItems.reduce<Record<string, string>>(
    (accumulator, item) => {
      accumulator[item.href] = t(item.labelKey);
      return accumulator;
    },
    {},
  );

  return {
    desktopSections,
    tabletPrimary: getItemsByHref(tabletPrimaryOrder),
    mobilePrimary: getItemsByHref(mobilePrimaryOrder),
    moreItems: getItemsByHref(moreItemsOrder),
    currentPage: pageMap[pathname] || "DuitFlow",
    activeAccountLabel: language === "id" ? "Akun aktif" : "Active account",
    unreadBadgeLabel: unreadCount > 99 ? "99+" : unreadCount,
  };
}
