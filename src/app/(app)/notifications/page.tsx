'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCheck, CircleAlert, Clock3, Inbox, Sparkles, Target } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/components/LanguageProvider';
import { EmptyState } from '@/components/shared/EmptyState';
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

function NotificationsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const urlState = parseNotificationsUrlState(searchParams);
  const scope = urlState.scope;
  const typeFilter = urlState.type;

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
        <PageHeading title={t('notifications.title')} />
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

      <SurfaceCard className="p-4 md:p-5">
        <div className="grid gap-4">
          <Tabs value={scope} onValueChange={(value) => replaceNotificationsState(value as typeof scope, typeFilter)}>
            <div className="overflow-x-auto pb-1">
              <TabsList className="w-max min-w-full justify-start rounded-2xl">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.key}
                    value={tab.key}
                    className="gap-2 rounded-xl px-4 py-2 text-sm"
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

          <div className="flex flex-wrap gap-2">
            {typeFilters.map((filter) => (
              <Button
                key={filter.key}
                type="button"
                size="sm"
                variant={typeFilter === filter.key ? 'primary' : 'ghost'}
                onClick={() => replaceNotificationsState(scope, filter.key)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <div className="grid gap-5">
          <SectionHeading title={t('notifications.feedTitle')} />

          {notificationsQuery.isLoading ? (
            <EmptyState title={t('common.loading')} compact />
          ) : notificationsQuery.isError ? (
            <EmptyState title={t('notifications.loadError')} compact />
          ) : notifications.length === 0 ? (
            <EmptyState
              title={t('notifications.empty')}
              icon={<Inbox size={20} />}
            />
          ) : (
            <div className="grid gap-3">
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
    ? 'border-border-subtle bg-surface-1'
    : notification.priority === 'critical'
      ? 'border-danger/25 bg-danger-soft/25'
      : notification.priority === 'important'
        ? 'border-warning/25 bg-warning-soft/25'
        : 'border-accent/25 bg-surface-accent/45';

  const Icon =
    notification.type === 'wishlist_due'
      ? Sparkles
      : notification.type === 'budget_exceeded'
        ? CircleAlert
        : Target;

  return (
    <article
      className={cn(
        'grid gap-4 rounded-[calc(var(--radius-card)-0.1rem)] border p-4 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-start',
        surfaceClassName
      )}
    >
      <div className={cn('grid h-10 w-10 place-items-center rounded-[calc(var(--radius-control)+0.05rem)]', iconToneClassName)}>
        <Icon size={18} />
      </div>

      <div className="grid min-w-0 gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={getPriorityBadgeVariant(notification.priority)}>
            {t(`notifications.priority.${notification.priority}`)}
          </Badge>
          <span className="text-xs text-text-3">{t(`notifications.type.${notification.type}`)}</span>
          {!notification.is_read ? (
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
          ) : null}
        </div>

        <div className="grid gap-1">
          <strong className="text-sm font-semibold tracking-[-0.02em] text-text-1">
            {notification.title}
          </strong>
          <p className="m-0 text-sm leading-6 text-text-2">{notification.body}</p>
        </div>

        <span className="inline-flex items-center gap-2 text-xs text-text-3">
          <Clock3 size={14} />
          {formatDate(notification.created_at, language)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 lg:justify-end">
        {!notification.is_read ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => onMarkRead(notification.id)}
            disabled={markReadPending}
          >
            {t('notifications.markRead')}
          </Button>
        ) : null}
        {notification.action_url ? (
          <Button asChild variant="secondary">
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
