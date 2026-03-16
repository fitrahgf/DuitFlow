import { formatCurrencyAmount } from '@/lib/currency';
import type { Language } from '@/lib/i18n/dictionaries';
import { parseSmartInput, type SmartParserCategoryOption, type SmartParserWalletOption } from '@/lib/smartParser';
import { createAdminClient } from '@/lib/supabase/admin';
import { getLocalDateInTimezone, hashTelegramLinkToken, parseTelegramCommand } from '@/lib/telegram/server';

interface TelegramUser {
  id: number;
  is_bot?: boolean;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
}

interface TelegramChat {
  id: number;
  type: string;
}

interface TelegramMessage {
  message_id: number;
  text?: string;
  from?: TelegramUser;
  chat: TelegramChat;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

interface TelegramConnectionRow {
  user_id: string;
  telegram_user_id: string;
  telegram_chat_id: string;
  telegram_username: string | null;
}

type TelegramLinkResult =
  | { ok: true; userId: string }
  | { ok: false; reason: 'invalid_token' | 'already_linked' };

interface TelegramProfileRow {
  preferred_language: Language;
  timezone: string;
  currency_code: string;
}

interface TelegramWalletRow extends SmartParserWalletOption {
  is_active?: boolean;
  is_archived?: boolean;
  balance?: number;
}

type TelegramCategoryRow = SmartParserCategoryOption & { is_archived?: boolean };

const BOT_RUNTIME_ERROR = 'Telegram bot is not configured yet.';

function resolveTelegramLanguage(languageCode?: string | null): Language {
  return languageCode?.toLowerCase().startsWith('id') ? 'id' : 'en';
}

function textByLanguage(language: Language, messages: { id: string; en: string }) {
  return language === 'id' ? messages.id : messages.en;
}

async function sendTelegramMessage(chatId: string, text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    throw new Error(BOT_RUNTIME_ERROR);
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram sendMessage failed: ${body}`);
  }
}

async function findTelegramConnection(chatId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('telegram_connections')
    .select('user_id, telegram_user_id, telegram_chat_id, telegram_username')
    .eq('telegram_chat_id', chatId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as TelegramConnectionRow | null;
}

async function linkTelegramAccount(token: string, message: TelegramMessage): Promise<TelegramLinkResult> {
  const admin = createAdminClient();
  const chatId = String(message.chat.id);
  const telegramUserId = String(message.from?.id ?? message.chat.id);
  const tokenHash = hashTelegramLinkToken(token);

  const { data: tokenRow, error: tokenError } = await admin
    .from('telegram_link_tokens')
    .select('id, user_id, expires_at, used_at')
    .eq('token_hash', tokenHash)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (tokenError) {
    throw tokenError;
  }

  if (!tokenRow) {
    return { ok: false, reason: 'invalid_token' as const };
  }

  const linkTokenRow = tokenRow as { id: string; user_id: string };

  const { data: existingConnection, error: existingError } = await admin
    .from('telegram_connections')
    .select('user_id')
    .or(`telegram_user_id.eq.${telegramUserId},telegram_chat_id.eq.${chatId}`)
    .maybeSingle();

  if (existingError && existingError.code !== 'PGRST116') {
    throw existingError;
  }

  const existingConnectionRow = (existingConnection ?? null) as { user_id: string } | null;

  if (existingConnectionRow && existingConnectionRow.user_id !== linkTokenRow.user_id) {
    return { ok: false, reason: 'already_linked' as const };
  }

  const { error: upsertError } = await admin.from('telegram_connections').upsert(
    {
      user_id: linkTokenRow.user_id,
      telegram_user_id: telegramUserId,
      telegram_chat_id: chatId,
      telegram_username: message.from?.username ?? null,
      telegram_first_name: message.from?.first_name ?? null,
      telegram_last_name: message.from?.last_name ?? null,
      linked_at: new Date().toISOString(),
      last_interaction_at: new Date().toISOString(),
      is_active: true,
    },
    { onConflict: 'user_id' }
  );

  if (upsertError) {
    throw upsertError;
  }

  const { error: tokenUpdateError } = await admin
    .from('telegram_link_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', linkTokenRow.id);

  if (tokenUpdateError) {
    throw tokenUpdateError;
  }

  return { ok: true, userId: linkTokenRow.user_id };
}

async function fetchTelegramProfile(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select('preferred_language, timezone, currency_code')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const profileRow = (data ?? null) as Partial<TelegramProfileRow> | null;

  return {
    preferred_language: (profileRow?.preferred_language ?? 'id') as Language,
    timezone: profileRow?.timezone ?? 'Asia/Jakarta',
    currency_code: profileRow?.currency_code ?? 'IDR',
  } satisfies TelegramProfileRow;
}

async function fetchTelegramWallets(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('wallets')
    .select('id, name, is_active, is_archived, balance')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .eq('is_active', true)
    .order('name');

  if (error) {
    throw error;
  }

  return (data ?? []) as TelegramWalletRow[];
}

async function fetchTelegramCategories(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('categories')
    .select('id, name, type, is_archived')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('name');

  if (error) {
    throw error;
  }

  return (data ?? []) as TelegramCategoryRow[];
}

async function touchTelegramConnection(chatId: string) {
  const admin = createAdminClient();
  await admin
    .from('telegram_connections')
    .update({ last_interaction_at: new Date().toISOString() })
    .eq('telegram_chat_id', chatId);
}

async function disconnectTelegramConnection(chatId: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('telegram_connections')
    .delete()
    .eq('telegram_chat_id', chatId);

  if (error) {
    throw error;
  }
}

async function createTelegramTransaction(chatId: string, text: string, connection: TelegramConnectionRow) {
  const [profile, wallets, categories] = await Promise.all([
    fetchTelegramProfile(connection.user_id),
    fetchTelegramWallets(connection.user_id),
    fetchTelegramCategories(connection.user_id),
  ]);

  if (wallets.length === 0) {
    await sendTelegramMessage(
      chatId,
      textByLanguage(profile.preferred_language, {
        id: 'Buat dompet aktif dulu di DuitFlow sebelum kirim transaksi dari Telegram.',
        en: 'Create an active wallet in DuitFlow before adding transactions from Telegram.',
      })
    );
    return;
  }

  const preview = parseSmartInput(text, {
    wallets,
    categories,
  });

  if (preview.status !== 'ready') {
    const walletHint =
      preview.missing.includes('wallet') && wallets.length > 1
        ? textByLanguage(profile.preferred_language, {
            id: '\nTambahkan nama dompet, mis. "kopi 25rb cash".',
            en: '\nInclude the wallet name, e.g. "coffee 25k cash".',
          })
        : '';

    await sendTelegramMessage(
      chatId,
      textByLanguage(profile.preferred_language, {
        id: `Belum lengkap. Coba format seperti "kopi 25rb cash" atau "gaji 5jt bca".${walletHint}`,
        en: `Not enough detail. Try "coffee 25k cash" or "salary 5m bca".${walletHint}`,
      })
    );
    return;
  }

  const localDate = getLocalDateInTimezone(profile.timezone);
  const admin = createAdminClient();
  const { error } = await admin.from('transactions').insert({
    user_id: connection.user_id,
    amount: preview.amount,
    type: preview.type,
    title: preview.title,
    note: null,
    category_id: preview.categoryId,
    wallet_id: preview.walletId,
    source: 'telegram_bot',
    date: localDate,
    transaction_date: localDate,
  });

  if (error) {
    throw error;
  }

  await sendTelegramMessage(
    chatId,
    textByLanguage(profile.preferred_language, {
      id: `Tersimpan: ${preview.title} • ${formatCurrencyAmount(
        preview.amount,
        profile.preferred_language,
        profile.currency_code
      )} • ${preview.walletName}`,
      en: `Saved: ${preview.title} • ${formatCurrencyAmount(
        preview.amount,
        profile.preferred_language,
        profile.currency_code
      )} • ${preview.walletName}`,
    })
  );
}

async function sendBalance(chatId: string, connection: TelegramConnectionRow) {
  const [profile, wallets] = await Promise.all([
    fetchTelegramProfile(connection.user_id),
    fetchTelegramWallets(connection.user_id),
  ]);

  if (wallets.length === 0) {
    await sendTelegramMessage(
      chatId,
      textByLanguage(profile.preferred_language, {
        id: 'Belum ada dompet aktif.',
        en: 'No active wallets yet.',
      })
    );
    return;
  }

  const totalBalance = wallets.reduce((sum, wallet) => sum + (wallet.balance ?? 0), 0);
  const lines = wallets
    .slice(0, 5)
    .map(
      (wallet) =>
        `• ${wallet.name}: ${formatCurrencyAmount(
          wallet.balance ?? 0,
          profile.preferred_language,
          profile.currency_code
        )}`
    );

  await sendTelegramMessage(
    chatId,
    [
      textByLanguage(profile.preferred_language, {
        id: `Saldo total: ${formatCurrencyAmount(totalBalance, profile.preferred_language, profile.currency_code)}`,
        en: `Total balance: ${formatCurrencyAmount(totalBalance, profile.preferred_language, profile.currency_code)}`,
      }),
      ...lines,
    ].join('\n')
  );
}

async function sendWallets(chatId: string, connection: TelegramConnectionRow) {
  const [profile, wallets] = await Promise.all([
    fetchTelegramProfile(connection.user_id),
    fetchTelegramWallets(connection.user_id),
  ]);

  if (wallets.length === 0) {
    await sendTelegramMessage(
      chatId,
      textByLanguage(profile.preferred_language, {
        id: 'Belum ada dompet aktif.',
        en: 'No active wallets yet.',
      })
    );
    return;
  }

  await sendTelegramMessage(
    chatId,
    [
      textByLanguage(profile.preferred_language, {
        id: 'Dompet aktif:',
        en: 'Active wallets:',
      }),
      ...wallets.map((wallet) => `• ${wallet.name}`),
    ].join('\n')
  );
}

async function sendHelp(chatId: string, language: Language) {
  await sendTelegramMessage(
    chatId,
    textByLanguage(language, {
      id: [
        'Kirim transaksi langsung dari chat.',
        '',
        'Contoh:',
        '• kopi 25rb cash',
        '• gaji 5jt bca',
        '',
        'Perintah:',
        '• /balance',
        '• /wallets',
        '• /unlink',
      ].join('\n'),
      en: [
        'Send transactions directly from chat.',
        '',
        'Examples:',
        '• coffee 25k cash',
        '• salary 5m bca',
        '',
        'Commands:',
        '• /balance',
        '• /wallets',
        '• /unlink',
      ].join('\n'),
    })
  );
}

export async function handleTelegramUpdate(update: TelegramUpdate) {
  const message = update.message;

  if (!message?.text || message.chat.type !== 'private') {
    return;
  }

  const chatId = String(message.chat.id);
  const fallbackLanguage = resolveTelegramLanguage(message.from?.language_code);
  const command = parseTelegramCommand(message.text);

  if (command?.command === 'start') {
    const token = command.args[0];

    if (token) {
      const linkResult = await linkTelegramAccount(token, message);

      if (!linkResult.ok) {
        await sendTelegramMessage(
          chatId,
          textByLanguage(fallbackLanguage, {
            id: linkResult.reason === 'already_linked'
              ? 'Akun Telegram ini sudah terhubung ke user lain.'
              : 'Token koneksi tidak valid atau sudah kedaluwarsa. Buat link baru dari Pengaturan DuitFlow.',
            en: linkResult.reason === 'already_linked'
              ? 'This Telegram account is already linked to another user.'
              : 'This connect token is invalid or expired. Create a new link from DuitFlow Settings.',
          })
        );
        return;
      }

      const profile = await fetchTelegramProfile(linkResult.userId);
      await sendTelegramMessage(
        chatId,
        textByLanguage(profile.preferred_language, {
          id: 'Bot terhubung. Kirim transaksi seperti "kopi 25rb cash" atau pakai /help.',
          en: 'Bot connected. Send entries like "coffee 25k cash" or use /help.',
        })
      );
      return;
    }

    const existingConnection = await findTelegramConnection(chatId);
    await sendTelegramMessage(
      chatId,
      textByLanguage(existingConnection ? await fetchTelegramProfile(existingConnection.user_id).then((profile) => profile.preferred_language) : fallbackLanguage, {
        id: existingConnection
          ? 'Bot siap dipakai. Coba kirim "kopi 25rb cash" atau pakai /help.'
          : 'Hubungkan bot dari Pengaturan DuitFlow, lalu kirim transaksi langsung dari chat.',
        en: existingConnection
          ? 'Bot is ready. Try "coffee 25k cash" or use /help.'
          : 'Connect the bot from DuitFlow Settings, then send transactions directly from chat.',
      })
    );
    return;
  }

  const connection = await findTelegramConnection(chatId);

  if (!connection) {
    await sendTelegramMessage(
      chatId,
      textByLanguage(fallbackLanguage, {
        id: 'Bot belum terhubung. Buka DuitFlow > Pengaturan > Telegram untuk connect.',
        en: 'Bot is not linked yet. Open DuitFlow > Settings > Telegram to connect it.',
      })
    );
    return;
  }

  await touchTelegramConnection(chatId);
  const profile = await fetchTelegramProfile(connection.user_id);

  if (command?.command === 'help') {
    await sendHelp(chatId, profile.preferred_language);
    return;
  }

  if (command?.command === 'balance') {
    await sendBalance(chatId, connection);
    return;
  }

  if (command?.command === 'wallets') {
    await sendWallets(chatId, connection);
    return;
  }

  if (command?.command === 'unlink') {
    await disconnectTelegramConnection(chatId);
    await sendTelegramMessage(
      chatId,
      textByLanguage(profile.preferred_language, {
        id: 'Bot dilepas. Hubungkan lagi dari Pengaturan DuitFlow kapan saja.',
        en: 'Bot disconnected. Reconnect it anytime from DuitFlow Settings.',
      })
    );
    return;
  }

  await createTelegramTransaction(chatId, message.text, connection);
}
