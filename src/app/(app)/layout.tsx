'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  CreditCard,
  FolderKanban,
  Gift,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  Target,
  Tags,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import MoreNavigationSheet from '@/components/MoreNavigationSheet';
import MobileBottomNav from '@/components/MobileBottomNav';
import QuickTransactionSheet from '@/components/QuickTransactionSheet';
import { CurrencyPreferencesProvider } from '@/components/CurrencyPreferencesProvider';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/LanguageProvider';
import { useTheme } from '@/components/ThemeProvider';
import { NOTIFICATIONS_REFRESH_EVENT } from '@/lib/events';
import { fetchUnreadNotificationCount, syncSystemNotifications } from '@/lib/queries/notifications';
import { queryKeys } from '@/lib/queries/keys';
import { fetchCurrentProfile } from '@/lib/queries/profile';
import { cn } from '@/lib/utils';

type NavPlacement = 'desktop' | 'tablet' | 'mobile-primary' | 'mobile-secondary';
type NavHref =
  | '/dashboard'
  | '/transactions'
  | '/transfer'
  | '/budgets'
  | '/reports'
  | '/wallets'
  | '/categories'
  | '/projects'
  | '/wishlist'
  | '/notifications'
  | '/subscriptions'
  | '/settings';

interface NavItemConfig {
  href: NavHref;
  labelKey: string;
  icon: LucideIcon;
  placement: NavPlacement[];
  group: 'core' | 'planning' | 'settings';
}

interface RenderNavItem {
  href: NavHref;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  badgeCount: number;
}

const navItems: NavItemConfig[] = [
  {
    href: '/dashboard',
    labelKey: 'nav.dashboard',
    icon: LayoutDashboard,
    placement: ['desktop', 'tablet', 'mobile-primary'],
    group: 'core',
  },
  {
    href: '/transactions',
    labelKey: 'nav.transactions',
    icon: CreditCard,
    placement: ['desktop', 'tablet', 'mobile-primary'],
    group: 'core',
  },
  {
    href: '/transfer',
    labelKey: 'nav.transfer',
    icon: ArrowLeftRight,
    placement: ['desktop', 'mobile-secondary'],
    group: 'core',
  },
  {
    href: '/wallets',
    labelKey: 'nav.wallets',
    icon: Wallet,
    placement: ['desktop', 'tablet', 'mobile-primary'],
    group: 'core',
  },
  {
    href: '/budgets',
    labelKey: 'nav.budgets',
    icon: Target,
    placement: ['desktop', 'mobile-secondary'],
    group: 'planning',
  },
  {
    href: '/reports',
    labelKey: 'nav.reports',
    icon: BarChart3,
    placement: ['desktop', 'mobile-secondary'],
    group: 'planning',
  },
  {
    href: '/categories',
    labelKey: 'nav.categories',
    icon: Tags,
    placement: ['desktop', 'tablet', 'mobile-secondary'],
    group: 'core',
  },
  {
    href: '/projects',
    labelKey: 'nav.projects',
    icon: FolderKanban,
    placement: ['desktop', 'mobile-secondary'],
    group: 'planning',
  },
  {
    href: '/wishlist',
    labelKey: 'nav.wishlist',
    icon: Gift,
    placement: ['desktop', 'mobile-secondary'],
    group: 'planning',
  },
  {
    href: '/notifications',
    labelKey: 'nav.notifications',
    icon: Inbox,
    placement: ['desktop', 'tablet', 'mobile-secondary'],
    group: 'settings',
  },
  {
    href: '/subscriptions',
    labelKey: 'nav.subscriptions',
    icon: Bell,
    placement: ['desktop', 'mobile-secondary'],
    group: 'planning',
  },
  {
    href: '/settings',
    labelKey: 'nav.settings',
    icon: Settings,
    placement: ['desktop', 'mobile-secondary'],
    group: 'settings',
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [desktopMoreExpanded, setDesktopMoreExpanded] = useState(false);
  const [quickTransactionOpen, setQuickTransactionOpen] = useState(false);
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
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);
    };

    void getUser();
  }, [supabase.auth]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMoreOpen(false);
      setDesktopMoreExpanded(false);
      setQuickTransactionOpen(false);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle('app-shell-locked', moreOpen || quickTransactionOpen);
    return () => document.body.classList.remove('app-shell-locked');
  }, [moreOpen, quickTransactionOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMoreOpen(false);
        setDesktopMoreExpanded(false);
        setQuickTransactionOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
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
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview }),
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
    const profile = profileQuery.data?.profile;
    if (!profile) {
      return;
    }

    if (profile.preferred_language && profile.preferred_language !== language) {
      setLanguage(profile.preferred_language);
    }

    if (profile.theme_preference && profile.theme_preference !== theme) {
      setTheme(profile.theme_preference);
    }
  }, [language, profileQuery.data?.profile, setLanguage, setTheme, theme]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const getInitials = (email: string) => email.slice(0, 2).toUpperCase();
  const profileName =
    profileQuery.data?.profile.full_name ||
    profileQuery.data?.profile.display_name ||
    user?.user_metadata?.full_name ||
    'User';
  const userEmail = profileQuery.data?.email || user?.email || null;
  const unreadCount = unreadNotificationsQuery.data ?? 0;

  const toRenderItem = (item: NavItemConfig): RenderNavItem => ({
    href: item.href,
    label: t(item.labelKey),
    icon: <item.icon size={18} />,
    active: pathname === item.href,
    badgeCount: item.href === '/notifications' ? unreadCount : 0,
  });

  const getItemsByHref = (hrefs: NavHref[]) =>
    hrefs.map((href) => {
      const match = navItems.find((item) => item.href === href);

      if (!match) {
        throw new Error(`Missing nav item config for ${href}`);
      }

      return toRenderItem(match);
    });

  const desktopCore = getItemsByHref(['/dashboard', '/transactions', '/wallets', '/transfer']);
  const desktopPlanning = getItemsByHref(['/budgets', '/reports', '/wishlist']);
  const desktopMoreItems = getItemsByHref(['/categories', '/projects', '/subscriptions']);
  const desktopUtilities = getItemsByHref(['/notifications', '/settings']);
  const tabletPrimary = getItemsByHref(['/dashboard', '/transactions', '/wallets', '/notifications']);
  const mobilePrimary = getItemsByHref(['/dashboard', '/transactions', '/wallets']);
  const moreItems = getItemsByHref([
    '/transfer',
    '/budgets',
    '/reports',
    '/categories',
    '/projects',
    '/wishlist',
    '/subscriptions',
    '/settings',
  ]);
  const pageMap = navItems.reduce<Record<string, string>>((accumulator, item) => {
    accumulator[item.href] = t(item.labelKey);
    return accumulator;
  }, {});
  const currentPage = pageMap[pathname] || 'DuitFlow';

  const showFab = pathname !== '/settings';
  const unreadBadgeLabel = unreadCount > 99 ? '99+' : unreadCount;
  const desktopMoreActive = desktopMoreItems.some((item) => item.active);

  const navLinkClass = (active: boolean) =>
    cn(
      'inline-flex min-h-[2.75rem] items-center gap-3 rounded-[calc(var(--radius-control)+0.1rem)] border border-transparent px-3 py-2.5 text-sm font-medium text-text-3 transition hover:border-border-subtle hover:bg-surface-1 hover:text-text-1',
      active && 'border-border-subtle bg-surface-1 text-text-1 shadow-xs'
    );

  return (
    <CurrencyPreferencesProvider currencyCode={profileQuery.data?.profile.currency_code}>
      <div className="min-h-screen md:grid md:grid-cols-[4.75rem_minmax(0,1fr)] lg:grid-cols-[16.25rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border-subtle bg-canvas/80 px-4 py-5 backdrop-blur-xl lg:flex">
        <div className="mb-7 grid gap-2">
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-[1.35rem] font-extrabold tracking-[-0.06em]">
            <span className="text-accent-strong">Duit</span>Flow
          </Link>
          <span className="max-w-[12rem] truncate text-xs text-text-3">{userEmail || 'Workspace'}</span>
        </div>

        <nav className="grid gap-5">
          <div className="grid gap-1.5">
            <span className="px-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-text-3">{t('nav.core')}</span>
            {desktopCore.map((item) => (
              <Link key={item.href} href={item.href} className={navLinkClass(item.active)}>
                <span className="grid h-5 w-5 place-items-center">{item.icon}</span>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.badgeCount > 0 ? (
                  <span className="inline-flex min-w-[1.2rem] items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[0.58rem] font-extrabold text-white">
                    {unreadBadgeLabel}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>

          <div className="grid gap-1.5">
            <span className="px-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-text-3">{t('nav.planning')}</span>
            {desktopPlanning.map((item) => (
              <Link key={item.href} href={item.href} className={navLinkClass(item.active)}>
                <span className="grid h-5 w-5 place-items-center">{item.icon}</span>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.badgeCount > 0 ? (
                  <span className="inline-flex min-w-[1.2rem] items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[0.58rem] font-extrabold text-white">
                    {unreadBadgeLabel}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>

          <div className="grid gap-1.5">
            <button
              type="button"
              className={navLinkClass(desktopMoreExpanded || desktopMoreActive)}
              onClick={() => setDesktopMoreExpanded((current) => !current)}
              aria-expanded={desktopMoreExpanded}
            >
              <span className="grid h-5 w-5 place-items-center">
                <Menu size={18} />
              </span>
              <span className="min-w-0 flex-1 truncate">{t('nav.more')}</span>
            </button>

            {desktopMoreExpanded ? (
              <div className="grid gap-1">
                {desktopMoreItems.map((item) => (
                  <Link key={item.href} href={item.href} className={cn(navLinkClass(item.active), 'ml-3 pl-4')}>
                    <span className="grid h-5 w-5 place-items-center">{item.icon}</span>
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </nav>

        <div className="mt-auto grid gap-4 border-t border-border-subtle pt-5">
          {desktopUtilities.map((item) => (
            <Link key={item.href} href={item.href} className={navLinkClass(item.active)}>
              <span className="grid h-5 w-5 place-items-center">{item.icon}</span>
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.badgeCount > 0 ? (
                <span className="inline-flex min-w-[1.2rem] items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[0.58rem] font-extrabold text-white">
                  {unreadBadgeLabel}
                </span>
              ) : null}
            </Link>
          ))}

          <button
            type="button"
            className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[calc(var(--radius-card)-0.1rem)] border border-border-subtle bg-surface-1 px-3.5 py-3 text-left transition hover:border-border-strong hover:bg-surface-2"
            onClick={handleSignOut}
            title={t('nav.signOut')}
          >
            <div className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-xs font-semibold text-text-1">
              {user ? getInitials(user.email || 'U') : '?'}
            </div>
            <div className="min-w-0 grid gap-0.5">
              <strong className="truncate text-sm">{profileName}</strong>
              <span className="truncate text-xs text-text-3">{userEmail || t('nav.signOut')}</span>
            </div>
            <LogOut size={16} className="text-text-3" />
          </button>
        </div>
      </aside>

      <aside className="sticky top-0 hidden h-screen flex-col items-center gap-4 border-r border-border-subtle bg-canvas/80 px-3 py-4 backdrop-blur-xl md:flex lg:hidden">
        <Link
          href="/dashboard"
          className="grid h-11 w-11 place-items-center rounded-[calc(var(--radius-control)+0.1rem)] border border-border-subtle bg-surface-1 text-[0.68rem] font-extrabold tracking-[-0.04em]"
          aria-label="DuitFlow"
        >
          DF
        </Link>

        <nav className="mt-1 grid gap-2">
          {tabletPrimary.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative grid h-11 w-11 place-items-center rounded-[calc(var(--radius-control)+0.1rem)] border border-transparent text-text-3 transition hover:border-border-subtle hover:bg-surface-1 hover:text-text-1',
                item.active && 'border-border-subtle bg-surface-1 text-text-1 shadow-xs'
              )}
              aria-current={item.active ? 'page' : undefined}
              title={item.label}
            >
              {item.icon}
              {item.badgeCount > 0 ? (
                <span className="absolute right-0 top-0 inline-flex min-w-[1rem] items-center justify-center rounded-full bg-accent px-1 py-0.5 text-[0.56rem] font-extrabold text-white">
                  {unreadBadgeLabel}
                </span>
              ) : null}
            </Link>
          ))}

          <button
            type="button"
            className={cn(
              'grid h-11 w-11 place-items-center rounded-[calc(var(--radius-control)+0.1rem)] border border-transparent text-text-3 transition hover:border-border-subtle hover:bg-surface-1 hover:text-text-1',
              moreOpen && 'border-border-subtle bg-surface-1 text-text-1 shadow-xs'
            )}
            onClick={() => setMoreOpen(true)}
            title={t('nav.more')}
            aria-label={t('nav.more')}
          >
            <Menu size={18} />
          </button>
        </nav>

        <button
          type="button"
          className="mt-auto grid h-10 w-10 place-items-center rounded-full border border-border-subtle bg-surface-1 text-xs font-semibold text-text-1"
          onClick={handleSignOut}
          title={t('nav.signOut')}
        >
          {user ? getInitials(user.email || 'U') : '?'}
        </button>
      </aside>

      <main className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border-subtle bg-canvas/82 px-4 py-3 backdrop-blur-xl md:px-6 lg:hidden">
          <h2 className="truncate text-[0.98rem] font-semibold tracking-[-0.03em] text-text-1">{currentPage}</h2>
          <div className="flex items-center gap-3">
            <Link
              href="/notifications"
              className={cn(
                'relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-surface-1 text-text-3 transition hover:border-border-strong hover:bg-surface-2 hover:text-text-1',
                pathname === '/notifications' && 'bg-surface-2 text-text-1 shadow-xs'
              )}
              aria-label={t('nav.notifications')}
              title={t('nav.notifications')}
            >
              <Bell size={18} />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-w-[1rem] items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[0.58rem] font-extrabold text-white">
                  {unreadBadgeLabel}
                </span>
              ) : null}
            </Link>
          </div>
        </header>

        <div className="mx-auto w-full max-w-shell px-4 pb-[calc(6.25rem+var(--safe-bottom))] pt-5 md:px-6 md:pb-10 lg:px-8">
          {children}
        </div>
      </main>

      <MobileBottomNav
        leftItems={mobilePrimary.slice(0, 2)}
        rightItems={mobilePrimary.slice(2)}
        moreLabel={t('nav.more')}
        moreIcon={<Menu size={18} />}
        moreActive={moreOpen}
        onMore={() => setMoreOpen(true)}
      />

      {showFab && (
        <Button
          type="button"
          variant="primary"
          size="icon"
          className="fixed bottom-[calc(2.65rem+var(--safe-bottom))] left-1/2 z-50 h-14 w-14 -translate-x-1/2 rounded-[1.1rem] shadow-sm md:hidden"
          onClick={() => setQuickTransactionOpen(true)}
          aria-label={t('nav.quickTransaction')}
          title={t('nav.quickTransaction')}
        >
          <Plus size={20} />
        </Button>
      )}

      <MoreNavigationSheet
        open={moreOpen}
        title={t('nav.more')}
        items={moreItems}
        signOutLabel={t('nav.signOut')}
        onClose={() => setMoreOpen(false)}
        onSignOut={handleSignOut}
        userName={profileName}
        userEmail={userEmail}
      />

      <QuickTransactionSheet
        key={quickTransactionOpen ? 'quick-sheet-open' : 'quick-sheet-closed'}
        open={quickTransactionOpen}
        onClose={() => setQuickTransactionOpen(false)}
      />
      </div>
    </CurrencyPreferencesProvider>
  );
}
