"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Menu, Plus } from "lucide-react";
import MoreNavigationSheet from "@/components/MoreNavigationSheet";
import MobileBottomNav from "@/components/MobileBottomNav";
import QuickTransactionSheet from "@/components/QuickTransactionSheet";
import { CurrencyPreferencesProvider } from "@/components/CurrencyPreferencesProvider";
import { useLanguage } from "@/components/LanguageProvider";
import AppShell from "@/components/shell/AppShell";
import ShellHeader from "@/components/shell/ShellHeader";
import Sidebar from "@/components/shell/Sidebar";
import { buildShellNavigation } from "@/components/shell/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { NOTIFICATIONS_REFRESH_EVENT } from "@/lib/events";
import {
  fetchUnreadNotificationCount,
  syncSystemNotifications,
} from "@/lib/queries/notifications";
import { queryKeys } from "@/lib/queries/keys";
import { fetchCurrentProfile } from "@/lib/queries/profile";
import { createClient } from "@/lib/supabase/client";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t, setLanguage, language } = useLanguage();
  const { setTheme } = useTheme();
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [quickTransactionOpen, setQuickTransactionOpen] = useState(false);
  const lastAppliedLanguageRef = useRef<string | null>(null);
  const lastAppliedThemeRef = useRef<string | null>(null);

  const profileQuery = useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: fetchCurrentProfile,
    retry: false,
  });

  const unreadNotificationsQuery = useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: fetchUnreadNotificationCount,
  });

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        setUser(currentUser);
      } catch {
        setUser(null);
      }
    };

    void getUser();
  }, [supabase.auth]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMoreOpen(false);
      setQuickTransactionOpen(false);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle(
      "app-shell-locked",
      moreOpen || quickTransactionOpen,
    );

    return () => document.body.classList.remove("app-shell-locked");
  }, [moreOpen, quickTransactionOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMoreOpen(false);
        setQuickTransactionOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    let active = true;

    const syncNotifications = async () => {
      try {
        await syncSystemNotifications();

        if (!active) {
          return;
        }

        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: queryKeys.notifications.all,
          }),
          queryClient.invalidateQueries({
            queryKey: queryKeys.dashboard.overview,
          }),
        ]);
      } catch {
        // Notifications are helpful but should not block shell rendering.
      }
    };

    void syncNotifications();

    const handleRefresh = () => {
      void syncNotifications();
    };

    window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, handleRefresh);

    return () => {
      active = false;
      window.removeEventListener(NOTIFICATIONS_REFRESH_EVENT, handleRefresh);
    };
  }, [queryClient]);

  useEffect(() => {
    const nextLanguage = profileQuery.data?.profile.preferred_language;

    if (!nextLanguage || lastAppliedLanguageRef.current === nextLanguage) {
      return;
    }

    lastAppliedLanguageRef.current = nextLanguage;
    setLanguage(nextLanguage);
  }, [profileQuery.data?.profile.preferred_language, setLanguage]);

  useEffect(() => {
    const nextTheme = profileQuery.data?.profile.theme_preference;

    if (!nextTheme || lastAppliedThemeRef.current === nextTheme) {
      return;
    }

    lastAppliedThemeRef.current = nextTheme;
    setTheme(nextTheme);
  }, [profileQuery.data?.profile.theme_preference, setTheme]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const getInitials = (email: string) => email.slice(0, 2).toUpperCase();
  const profileName =
    profileQuery.data?.profile.full_name ||
    profileQuery.data?.profile.display_name ||
    user?.user_metadata?.full_name ||
    "User";
  const userEmail = profileQuery.data?.email || user?.email || null;
  const userInitials = user ? getInitials(user.email || "U") : "?";
  const unreadCount = unreadNotificationsQuery.data ?? 0;
  const wideContentRoutes = [
    "/dashboard",
    "/transactions",
    "/wallets",
    "/reports",
    "/budgets",
    "/transfer",
  ];
  const contentSize = wideContentRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )
    ? "wide"
    : "default";

  const {
    desktopSections,
    tabletPrimary,
    mobilePrimary,
    moreItems,
    currentPage,
    brandMeta,
    accountLabel,
    activeAccountLabel,
    unreadBadgeLabel,
  } = buildShellNavigation({
    pathname,
    unreadCount,
    t,
    language,
  });

  return (
    <CurrencyPreferencesProvider
      currencyCode={profileQuery.data?.profile.currency_code}
    >
      <AppShell
        contentSize={contentSize}
        sidebar={
          <Sidebar
            accountLabel={accountLabel}
            activeAccountLabel={activeAccountLabel}
            brandMeta={brandMeta}
            desktopSections={desktopSections}
            moreLabel={t("nav.more")}
            moreOpen={moreOpen}
            profileName={profileName}
            quickTransactionLabel={t("nav.quickTransaction")}
            signOutLabel={t("nav.signOut")}
            tabletPrimary={tabletPrimary}
            unreadBadgeLabel={unreadBadgeLabel}
            userEmail={userEmail}
            userInitials={userInitials}
            onOpenMore={() => setMoreOpen(true)}
            onOpenQuickTransaction={() => setQuickTransactionOpen(true)}
            onSignOut={handleSignOut}
          />
        }
        header={
          <ShellHeader
            currentPage={currentPage}
            notificationsActive={pathname === "/notifications"}
            notificationsLabel={t("nav.notifications")}
            unreadBadgeLabel={unreadBadgeLabel}
            unreadCount={unreadCount}
          />
        }
        mobileNav={
          <MobileBottomNav
            leftItems={mobilePrimary.slice(0, 2)}
            rightItems={mobilePrimary.slice(2)}
            moreLabel={t("nav.more")}
            moreIcon={<Menu size={18} />}
            moreActive={moreOpen}
            onMore={() => setMoreOpen(true)}
            actionLabel={t("nav.quickTransaction")}
            actionIcon={<Plus size={20} />}
            onAction={() => setQuickTransactionOpen(true)}
          />
        }
        overlays={
          <>
            <MoreNavigationSheet
              open={moreOpen}
              title={t("nav.more")}
              items={moreItems}
              signOutLabel={t("nav.signOut")}
              onClose={() => setMoreOpen(false)}
              onSignOut={handleSignOut}
              userName={profileName}
              userEmail={userEmail}
            />

            <QuickTransactionSheet
              key={
                quickTransactionOpen ? "quick-sheet-open" : "quick-sheet-closed"
              }
              open={quickTransactionOpen}
              onClose={() => setQuickTransactionOpen(false)}
            />
          </>
        }
      >
        {children}
      </AppShell>
    </CurrencyPreferencesProvider>
  );
}
