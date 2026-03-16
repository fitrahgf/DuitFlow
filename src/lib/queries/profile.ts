import { createClient } from '@/lib/supabase/client';
import type { Theme } from '@/components/ThemeProvider';
import type { Language } from '@/lib/i18n/dictionaries';

export interface NotificationPreferences {
  wishlist_due: boolean;
  budget_warning: boolean;
  budget_exceeded: boolean;
}

export interface ProfileRecord {
  id: string;
  full_name: string | null;
  display_name: string | null;
  preferred_language: Language;
  timezone: string;
  currency_code: string;
  theme_preference: Theme;
  notification_preferences: NotificationPreferences;
}

export interface ProfileQueryResult {
  email: string | null;
  profile: ProfileRecord;
}

const defaultNotificationPreferences: NotificationPreferences = {
  wishlist_due: true,
  budget_warning: true,
  budget_exceeded: true,
};

function normalizeNotificationPreferences(
  value: unknown
): NotificationPreferences {
  if (
    typeof value === 'object' &&
    value !== null &&
    'wishlist_due' in value &&
    'budget_warning' in value &&
    'budget_exceeded' in value
  ) {
    return {
      wishlist_due: Boolean(value.wishlist_due),
      budget_warning: Boolean(value.budget_warning),
      budget_exceeded: Boolean(value.budget_exceeded),
    };
  }

  return defaultNotificationPreferences;
}

export async function fetchCurrentProfile(): Promise<ProfileQueryResult> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error('You need to sign in first.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, full_name, display_name, preferred_language, timezone, currency_code, theme_preference, notification_preferences'
    )
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    email: user.email ?? null,
    profile: {
      id: user.id,
      full_name: data?.full_name ?? user.user_metadata.full_name ?? null,
      display_name: data?.display_name ?? user.user_metadata.full_name ?? null,
      preferred_language: (data?.preferred_language ?? 'id') as Language,
      timezone: data?.timezone ?? 'Asia/Jakarta',
      currency_code: data?.currency_code ?? 'IDR',
      theme_preference: (data?.theme_preference ?? 'system') as Theme,
      notification_preferences: normalizeNotificationPreferences(data?.notification_preferences),
    },
  };
}
