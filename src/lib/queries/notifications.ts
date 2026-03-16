import { createClient } from '@/lib/supabase/client';

type NotificationScope = 'all' | 'unread' | 'read';
export type NotificationType = 'wishlist_due' | 'budget_warning' | 'budget_exceeded';
export type NotificationPriority = 'critical' | 'important' | 'info';

export interface NotificationRecord {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  priority: NotificationPriority;
  is_read: boolean;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
  updated_at?: string | null;
  dedupe_key?: string | null;
}

export interface NotificationSyncResult {
  synced: boolean;
  reason?: string;
  month_key?: string;
  desired_count?: number;
  deleted_count?: number;
}

export async function fetchNotifications(
  scope: NotificationScope = 'all',
  type: NotificationType | 'all' = 'all'
): Promise<NotificationRecord[]> {
  const supabase = createClient();
  let query = supabase
    .from('notifications')
    .select('id, type, title, body, priority, is_read, action_url, read_at, created_at, updated_at, dedupe_key')
    .order('created_at', { ascending: false });

  if (scope === 'unread') {
    query = query.eq('is_read', false);
  }

  if (scope === 'read') {
    query = query.eq('is_read', true);
  }

  if (type !== 'all') {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as NotificationRecord[];
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId);

  if (error) {
    throw error;
  }
}

export async function markAllNotificationsAsRead() {
  const supabase = createClient();
  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('is_read', false);

  if (error) {
    throw error;
  }
}

export async function syncSystemNotifications() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('sync_system_notifications');

  if (error) {
    throw error;
  }

  return (data ?? null) as NotificationSyncResult | null;
}
