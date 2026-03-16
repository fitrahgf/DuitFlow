import { createClient } from '@/lib/supabase/client';
import { buildTelegramDeepLink, sanitizeTelegramBotUsername } from '@/lib/telegram/shared';

export interface TelegramConnectionStatus {
  connected: boolean;
  username: string | null;
  linkedAt: string | null;
  botUsername: string;
}

export interface TelegramConnectLinkResult {
  token: string;
  expiresAt: string;
  url: string;
}

export async function fetchTelegramConnection() {
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
    .from('telegram_connections')
    .select('telegram_username, linked_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    connected: Boolean(data),
    username: data?.telegram_username ?? null,
    linkedAt: data?.linked_at ?? null,
    botUsername: sanitizeTelegramBotUsername(process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME),
  } satisfies TelegramConnectionStatus;
}

export async function createTelegramConnectLink() {
  const supabase = createClient();
  const botUsername = sanitizeTelegramBotUsername(process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME);

  if (!botUsername) {
    throw new Error('Telegram bot username is not configured.');
  }

  const { data, error } = await supabase.rpc('create_telegram_link_token');

  if (error) {
    throw error;
  }

  const token = typeof data === 'object' && data && 'token' in data ? String(data.token) : '';
  const expiresAt =
    typeof data === 'object' && data && 'expires_at' in data ? String(data.expires_at) : '';

  if (!token || !expiresAt) {
    throw new Error('Failed to create the Telegram connect token.');
  }

  return {
    token,
    expiresAt,
    url: buildTelegramDeepLink(botUsername, token),
  } satisfies TelegramConnectLinkResult;
}

export async function disconnectTelegramConnection(userId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('telegram_connections')
    .delete()
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
}
