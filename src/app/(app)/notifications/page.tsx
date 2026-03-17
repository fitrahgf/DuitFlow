'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useSyncExternalStore } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCheck, CircleAlert, Clock3, Inbox, Sparkles, Target } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/components/LanguageProvider';
import {
  EmptyState,
  EmptyStateWorkspace,
} from '@/components/shared/EmptyState';
import {
  PageHeader,
  PageHeaderActions,
  PageHeading,
  PageShell,
  SectionHeading,
  SurfaceCard,
} from '@/components/shared/PagePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NOTIFICATIONS_REFRESH_EVENT } from '@/lib/events';
import { getErrorMessage } from '@/lib/errors';
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  syncSystemNotifications,
  type NotificationPriority,
  type NotificationType,
} from '@/lib/queries/notifications';
import { queryKeys } from '@/lib/queries/keys';
import {
  parseNotificationsUrlState,
  serializeNotificationsUrlState,
} from '@/lib/url-state';
import { cn } from '@/lib/utils';

function formatDate(value: string, language: 'en' | 'id') {
  return new Date(value).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getPriorityBadgeVariant(priority: NotificationPriority) {
  if (priority === 'critical') {
    return 'danger';
  }

  if (priority === 'important') {
    return 'warning';
  }

  return 'default';
}

function NotificationOverviewStat({
  label,
  value,
  meta,
  tone = 'default',
}: {
  label: string;
  value: React.ReactNode;
  meta?: React.ReactNode;
  tone?: 'default' | 'accent' | 'warning';
}) {
  const dotClassName =
    tone === 'accent'
      ? 'bg-accent'
      : tone === 'warning'
        ? 'bg-warning'
        : 'bg-text-3/35';

  return (
    <div className="grid gap-1 px-3 py-2.5 first:pl-0 last:pr-0">
      <div className="inline-flex items-center gap-2">
        <span className={cn('h-1.5 w-1.5 rounded-full', dotClassName)} aria-hidden="true" />
        <span className="text-[0.74rem] font-medium tracking-[0.01em] text-text-2">
          {label}
        </span>
      </div>
      <strong className="text-[0.98rem] font-semibold tracking-[-0.04em] text-text-1">
        {value}
      </strong>
      {meta ? <span className="text-[0.78rem] text-text-2">{meta}</span> : null}
    </div>
  );
}

function NotificationsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const urlState = parseNotificationsUrlState(searchParams);
  const scope = urlState.scope;
  const typeFilter = urlState.type;
  const tabsReady = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications.list(scope, typeFilter),
    queryFn: () => fetchNotifications(scope, typeFilter),
  });

  const unreadCountQuery = useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: fetchUnreadNotificationCount,
  });

  useEffect(() => {
    let active = true;

    const syncAndRefresh = async (showError = false) => {
      try {
        await syncSystemNotifications();
        if (!active) {
          return;
        }
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview }),
        ]);
      } catch (error) {
        if (showError && active) {
          toast.error(getErrorMessage(error, t('notifications.syncError')));
        }
      }
    };

    void syncAndRefresh(false);

    const handleRefresh = () => {
      void syncAndRefresh(false);
    };

    window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, handleRefresh);

    return () => {
      active = false;
      window.removeEventListener(NOTIFICATIONS_REFRESH_EVENT, handleRefresh);
    };
  }, [queryClient, t]);

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount }),
      ]);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, t('notifications.markReadError')));
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount }),
      ]);
      toast.success(t('notifications.markAllSuccess'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, t('notifications.markAllError')));
    },
  });

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = unreadCountQuery.data ?? 0;
  const tabs: { key: typeof scope; label: string }[] = [
    { key: 'all', label: t('notifications.tabs.all') },
    { key: 'unread', label: t('notifications.tabs.unread') },
    { key: 'read', label: t('notifications.tabs.read') },
  ];
  const typeFilters: { key: typeof typeFilter; label: string }[] = [
    { key: 'all', label: t('notifications.filters.all') },
    { key: 'wishlist_due', label: t('notifications.filters.wishlistDue') },
    { key: 'budget_warning', label: t('notifications.filters.budgetWarning') },
    { key: 'budget_exceeded', label: t('notifications.filters.budgetExceeded') },
  ];
  const activeScopeLabel =
    tabs.find((tab) => tab.key === scope)?.label ?? t('notifications.tabs.all');
  const activeTypeLabel =
    typeFilters.find((filter) => filter.key === typeFilter)?.label ?? t('notifications.filters.all');
  const replaceNotificationsState = (nextScope: typeof scope, nextType: typeof typeFilter) => {
    const nextQueryString = serializeNotificationsUrlState({
      scope: nextScope,
      type: nextType,
    });
    const currentQueryString = searchParams.toString();

    if (nextQueryString === currentQueryString) {
      return;
    }

    router.replace(nextQueryString ? `${pathname}?${nextQueryString}` : pathname, {
      scroll: false,
    });
  };

  return (
    <PageShell className="animate-fade-in">
      <PageHeader>
        <PageHeading title={t('notifications.title')} subtitle={t('notifications.subtitle')} />
        <PageHeaderActions>
          <Button
            type="button"
            variant="secondary"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending || unreadCount === 0}
          >
            <CheckCheck size={16} />
            {t('notifications.markAll')}
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <SurfaceCard padding="compact">
        <div className="grid gap-3">
          <div className="grid gap-2.5 border-b border-border-subtle pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <SectionHeading title={t('notifications.feedTitle')} />
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="accent">{activeScopeLabel}</Badge>
                {typeFilter !== 'all' ? <Badge>{activeTypeLabel}</Badge> : null}
              </div>
            </div>

            <div className="grid gap-0 border-t border-border-subtle/80 pt-2 sm:grid-cols-3 sm:divide-x sm:divide-border-subtle/80">
              <NotificationOverviewStat
                label={t('notifications.summary.total')}
                value={notificationsQuery.isLoading ? '...' : notifications.length}
              />
              <NotificationOverviewStat
                label={t('notifications.summary.unread')}
                value={unreadCountQuery.isLoading ? '...' : unreadCount}
                tone={unreadCount > 0 ? 'warning' : 'default'}
              />
              <NotificationOverviewStat
                label={t('notifications.summary.scope')}
                value={activeScopeLabel}
                meta={activeTypeLabel}
                tone="accent"
              />
            </div>

            {tabsReady ? (
              <Tabs value={scope} onValueChange={(value) => replaceNotificationsState(value as typeof scope, typeFilter)}>
                <div className="pb-1">
                  <TabsList className="!grid !w-full grid-cols-3 justify-start overflow-hidden rounded-[calc(var(--radius-card)-0.08rem)]">
                    {tabs.map((tab) => (
                      <TabsTrigger
                        key={tab.key}
                        value={tab.key}
                        className="min-w-0 w-full gap-2 rounded-[calc(var(--radius-control)-0.06rem)] px-2.5 py-1.5 text-[0.78rem]"
                      >
                        <span>{tab.label}</span>
                        {tab.key === 'unread' ? (
                          <span className="inline-flex h-5 min-w-[1.35rem] items-center justify-center rounded-full bg-surface-1/80 px-1.5 text-[0.68rem] font-bold text-text-3">
                            {unreadCount}
                          </span>
                        ) : null}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </Tabs>
            ) : (
              <div className="grid w-full grid-cols-3 gap-2 pb-1">
                {tabs.map((tab) => (
                  <div
                    key={tab.key}
                    className="flex min-h-[2.75rem] items-center justify-center rounded-xl border border-border-subtle bg-surface-2/85 px-2.5 text-sm font-semibold text-text-3"
                  >
                    {tab.label}
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {typeFilters.map((filter) => (
                <Button
                  key={filter.key}
                  type="button"
                  size="sm"
                  variant={typeFilter === filter.key ? 'primary' : 'ghost'}
                  className={cn(
                    'justify-center px-2.5 sm:justify-start',
                    typeFilter !== filter.key &&
                      'border-transparent text-text-2 hover:bg-surface-2/88 hover:text-text-1',
                  )}
                  onClick={() => replaceNotificationsState(scope, filter.key)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          {notificationsQuery.isLoading ? (
            <EmptyState title={t('common.loading')} compact />
          ) : notificationsQuery.isError ? (
            <EmptyState title={t('notifications.loadError')} compact />
          ) : notifications.length === 0 ? (
            <EmptyStateWorkspace
              eyebrow={t('notifications.feedTitle')}
              title={t('notifications.empty')}
              description={t('notifications.emptyHint')}
              icon={<Inbox size={20} />}
              meta={
                <>
                  <Badge variant="accent">{activeScopeLabel}</Badge>
                  {typeFilter !== 'all' ? <Badge>{activeTypeLabel}</Badge> : null}
                </>
              }
              supporting={
                <NotificationSignalsAside
                  language={language}
                  signals={typeFilters.slice(1).map((filter) => filter.label)}
                />
              }
            />
          ) : (
            <div className="grid gap-0 divide-y divide-border-subtle/80">
              {notifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  language={language}
                  t={t}
                  onMarkRead={(notificationId) => markReadMutation.mutate(notificationId)}
                  markReadPending={markReadMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </SurfaceCard>
    </PageShell>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <PageShell className="animate-fade-in">
          <PageHeader>
            <PageHeading title="Notifications" />
          </PageHeader>
          <SurfaceCard>
            <EmptyState title="Loading..." compact />
          </SurfaceCard>
        </PageShell>
      }
    >
      <NotificationsPageContent />
    </Suspense>
  );
}

function NotificationRow({
  notification,
  language,
  t,
  onMarkRead,
  markReadPending,
}: {
  notification: {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    priority: NotificationPriority;
    is_read: boolean;
    action_url: string | null;
    created_at: string;
  };
  language: 'en' | 'id';
  t: (key: string) => string;
  onMarkRead: (notificationId: string) => void;
  markReadPending: boolean;
}) {
  const iconToneClassName =
    notification.priority === 'critical'
      ? 'bg-danger-soft text-danger'
      : notification.priority === 'important'
        ? 'bg-warning-soft text-warning'
        : 'bg-accent-soft text-accent-strong';

  const surfaceClassName = notification.is_read
    ? 'bg-transparent'
    : notification.priority === 'critical'
      ? 'bg-danger-soft/18'
      : notification.priority === 'important'
        ? 'bg-warning-soft/18'
        : 'bg-surface-accent/35';
  const indicatorToneClassName =
    notification.priority === 'critical'
      ? 'bg-danger'
      : notification.priority === 'important'
        ? 'bg-warning'
        : 'bg-accent';

  const Icon =
    notification.type === 'wishlist_due'
      ? Sparkles
      : notification.type === 'budget_exceeded'
        ? CircleAlert
        : Target;

  return (
    <article
      className={cn(
        'relative grid gap-3 px-3 py-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-start',
        surfaceClassName
      )}
    >
      {!notification.is_read ? (
        <span
          className={cn(
            'absolute bottom-3 left-0 top-3 w-1 rounded-full',
            indicatorToneClassName
          )}
          aria-hidden="true"
        />
      ) : null}
      <div className={cn('grid h-9 w-9 place-items-center rounded-[calc(var(--radius-control)+0.05rem)]', iconToneClassName)}>
        <Icon size={18} />
      </div>

      <div className="grid min-w-0 gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={getPriorityBadgeVariant(notification.priority)}>
            {t(`notifications.priority.${notification.priority}`)}
          </Badge>
          <span className="text-[0.74rem] font-medium text-text-2">{t(`notifications.type.${notification.type}`)}</span>
          {!notification.is_read ? (
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
          ) : null}
        </div>

        <div className="grid gap-1">
          <strong className="text-sm font-semibold tracking-[-0.02em] text-text-1">
            {notification.title}
          </strong>
          <p className="m-0 text-sm leading-5 text-text-2 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden">
            {notification.body}
          </p>
        </div>

        <span className="inline-flex items-center gap-2 text-[0.74rem] text-text-2">
          <Clock3 size={14} />
          {formatDate(notification.created_at, language)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 lg:justify-end">
        {!notification.is_read ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onMarkRead(notification.id)}
            disabled={markReadPending}
          >
            {t('notifications.markRead')}
          </Button>
        ) : null}
        {notification.action_url ? (
          <Button asChild variant="secondary" size="sm">
            <Link
              href={notification.action_url}
              onClick={() => {
                if (!notification.is_read) {
                  onMarkRead(notification.id);
                }
              }}
            >
              {t('notifications.openAction')}
            </Link>
          </Button>
        ) : null}
      </div>
    </article>
  );
}

function NotificationSignalsAside({
  language,
  signals,
}: {
  language: 'en' | 'id';
  signals: string[];
}) {
  return (
    <>
      <span className="text-[0.74rem] font-medium tracking-[0.01em] text-text-2">
        {language === 'id' ? 'Sinyal yang masuk' : 'Signals that land here'}
      </span>
      <div className="grid gap-0 divide-y divide-border-subtle/80">
        {signals.map((signal) => (
          <div
            key={signal}
            className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
          >
            <span className="text-sm font-medium text-text-2">{signal}</span>
            <span className="h-2.5 w-2.5 rounded-full bg-accent/65" aria-hidden="true" />
          </div>
        ))}
      </div>
    </>
  );
}
