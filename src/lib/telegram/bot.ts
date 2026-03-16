import { formatCurrencyAmount } from '@/lib/currency';
import type { Language } from '@/lib/i18n/dictionaries';
import {
  parseSmartInput,
  type SmartParserCategoryOption,
  type SmartParserWalletOption,
} from '@/lib/smartParser';
import { createAdminClient } from '@/lib/supabase/admin';
import { extractReceiptTransactionFromImage } from '@/lib/telegram/receipt';
import {
  getLocalDateInTimezone,
  hashTelegramLinkToken,
  parseTelegramCommand,
} from '@/lib/telegram/server';

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

interface TelegramPhotoSize {
  file_id: string;
  width: number;
  height: number;
  file_size?: number;
}

interface TelegramDocument {
  file_id: string;
  mime_type?: string;
  file_name?: string;
  file_size?: number;
}

interface TelegramMessage {
  message_id: number;
  text?: string;
  caption?: string;
  photo?: TelegramPhotoSize[];
  document?: TelegramDocument;
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

type TelegramTransactionRow = {
  title: string | null;
  amount: number;
  type: 'income' | 'expense';
  transaction_date: string | null;
  date: string | null;
  source?: string | null;
  wallets?: { name: string | null } | null;
};

const BOT_RUNTIME_ERROR = 'Telegram bot is not configured yet.';
const TELEGRAM_IMAGE_SIZE_LIMIT_BYTES = 8 * 1024 * 1024;

interface TelegramFileInfo {
  file_path: string;
  file_size?: number;
}

interface TelegramImageAttachment {
  fileId: string;
  mimeType: string | null;
  fileSize: number | null;
}

interface TelegramTransactionDraft {
  amount: number;
  type: 'income' | 'expense';
  title: string;
  note: string | null;
  categoryId: string | null;
  walletId: string;
  walletName: string;
  transactionDate: string;
}

function resolveTelegramLanguage(languageCode?: string | null): Language {
  return languageCode?.toLowerCase().startsWith('id') ? 'id' : 'en';
}

function textByLanguage(language: Language, messages: { id: string; en: string }) {
  return language === 'id' ? messages.id : messages.en;
}

function getTelegramBotToken() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    throw new Error(BOT_RUNTIME_ERROR);
  }

  return botToken;
}

async function sendTelegramMessage(chatId: string, text: string) {
  const botToken = getTelegramBotToken();

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

function pickTelegramImageAttachment(message: TelegramMessage): TelegramImageAttachment | null {
  if (message.photo && message.photo.length > 0) {
    const sortedPhotos = [...message.photo].sort((left, right) => {
      const leftScore = left.file_size ?? left.width * left.height;
      const rightScore = right.file_size ?? right.width * right.height;
      return rightScore - leftScore;
    });
    const bestPhoto = sortedPhotos[0];

    return {
      fileId: bestPhoto.file_id,
      mimeType: 'image/jpeg',
      fileSize: bestPhoto.file_size ?? null,
    };
  }

  if (message.document?.mime_type?.startsWith('image/')) {
    return {
      fileId: message.document.file_id,
      mimeType: message.document.mime_type,
      fileSize: message.document.file_size ?? null,
    };
  }

  return null;
}

async function fetchTelegramFileInfo(fileId: string) {
  const botToken = getTelegramBotToken();
  const response = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${encodeURIComponent(fileId)}`);
  const payload = (await response.json()) as {
    ok?: boolean;
    result?: TelegramFileInfo;
    description?: string;
  };

  if (!response.ok || !payload.ok || !payload.result?.file_path) {
    throw new Error(payload.description || 'Failed to fetch Telegram file info.');
  }

  return payload.result;
}

function inferMimeType(filePath: string, fallbackMimeType: string | null) {
  if (fallbackMimeType) {
    return fallbackMimeType;
  }

  const normalizedPath = filePath.toLowerCase();

  if (normalizedPath.endsWith('.png')) {
    return 'image/png';
  }

  if (normalizedPath.endsWith('.webp')) {
    return 'image/webp';
  }

  return 'image/jpeg';
}

async function downloadTelegramFileAsDataUrl(fileId: string, fallbackMimeType: string | null) {
  const botToken = getTelegramBotToken();
  const fileInfo = await fetchTelegramFileInfo(fileId);

  if ((fileInfo.file_size ?? 0) > TELEGRAM_IMAGE_SIZE_LIMIT_BYTES) {
    throw new Error('telegram_image_too_large');
  }

  const response = await fetch(`https://api.telegram.org/file/bot${botToken}/${fileInfo.file_path}`);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to download Telegram file: ${body}`);
  }

  const arrayBuffer = await response.arrayBuffer();

  if (arrayBuffer.byteLength > TELEGRAM_IMAGE_SIZE_LIMIT_BYTES) {
    throw new Error('telegram_image_too_large');
  }

  const mimeType = inferMimeType(fileInfo.file_path, fallbackMimeType);
  const base64 = Buffer.from(arrayBuffer).toString('base64');

  return `data:${mimeType};base64,${base64}`;
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
    return { ok: false, reason: 'invalid_token' };
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
    return { ok: false, reason: 'already_linked' };
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

async function fetchRecentTelegramTransactions(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('transactions')
    .select('title, amount, type, transaction_date, date, source, wallets(name)')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    throw error;
  }

  return (data ?? []) as TelegramTransactionRow[];
}

async function fetchTodayTelegramSummary(userId: string, today: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('transactions')
    .select('amount, type, source')
    .eq('user_id', userId)
    .eq('transaction_date', today)
    .is('deleted_at', null);

  if (error) {
    throw error;
  }

  const rows = (
    (data ?? []) as Array<{ amount: number; type: 'income' | 'expense'; source?: string | null }>
  ).filter((row) => row.source !== 'system_transfer');

  const income = rows
    .filter((row) => row.type === 'income')
    .reduce((sum, row) => sum + row.amount, 0);
  const expense = rows
    .filter((row) => row.type === 'expense')
    .reduce((sum, row) => sum + row.amount, 0);

  return {
    income,
    expense,
    net: income - expense,
    count: rows.length,
  };
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

async function persistTelegramTransaction(userId: string, draft: TelegramTransactionDraft) {
  const admin = createAdminClient();
  const { error } = await admin.from('transactions').insert({
    user_id: userId,
    amount: draft.amount,
    type: draft.type,
    title: draft.title,
    note: draft.note,
    category_id: draft.categoryId,
    wallet_id: draft.walletId,
    source: 'telegram_bot',
    date: draft.transactionDate,
    transaction_date: draft.transactionDate,
  });

  if (error) {
    throw error;
  }
}

async function sendSavedTelegramTransactionMessage(
  chatId: string,
  profile: TelegramProfileRow,
  draft: TelegramTransactionDraft,
  source: 'text' | 'receipt'
) {
  const sourceLabel = source === 'receipt'
    ? textByLanguage(profile.preferred_language, {
        id: 'Tersimpan dari struk',
        en: 'Saved from receipt',
      })
    : textByLanguage(profile.preferred_language, {
        id: 'Tersimpan',
        en: 'Saved',
      });

  await sendTelegramMessage(
    chatId,
    textByLanguage(profile.preferred_language, {
      id: `${sourceLabel}: ${draft.title} - ${formatCurrencyAmount(
        draft.amount,
        profile.preferred_language,
        profile.currency_code
      )} - ${draft.walletName}`,
      en: `${sourceLabel}: ${draft.title} - ${formatCurrencyAmount(
        draft.amount,
        profile.preferred_language,
        profile.currency_code
      )} - ${draft.walletName}`,
    })
  );
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
  const draft: TelegramTransactionDraft = {
    amount: preview.amount,
    type: preview.type,
    title: preview.title,
    note: null,
    categoryId: preview.categoryId,
    walletId: preview.walletId!,
    walletName: preview.walletName ?? wallets.find((wallet) => wallet.id === preview.walletId)?.name ?? '-',
    transactionDate: localDate,
  };

  await persistTelegramTransaction(connection.user_id, draft);
  await sendSavedTelegramTransactionMessage(chatId, profile, draft, 'text');
}

async function createTelegramReceiptTransaction(
  chatId: string,
  message: TelegramMessage,
  connection: TelegramConnectionRow,
  attachment: TelegramImageAttachment
) {
  const [profile, wallets, categories] = await Promise.all([
    fetchTelegramProfile(connection.user_id),
    fetchTelegramWallets(connection.user_id),
    fetchTelegramCategories(connection.user_id),
  ]);

  if (wallets.length === 0) {
    await sendTelegramMessage(
      chatId,
      textByLanguage(profile.preferred_language, {
        id: 'Buat dompet aktif dulu di DuitFlow sebelum kirim struk dari Telegram.',
        en: 'Create an active wallet in DuitFlow before uploading receipts from Telegram.',
      })
    );
    return;
  }

  if (!process.env.GROQ_API_KEY) {
    await sendTelegramMessage(
      chatId,
      textByLanguage(profile.preferred_language, {
        id: 'Fitur struk AI belum aktif. Tambahkan GROQ_API_KEY di environment server dulu.',
        en: 'AI receipt parsing is not enabled yet. Add GROQ_API_KEY to the server environment first.',
      })
    );
    return;
  }

  if ((attachment.fileSize ?? 0) > TELEGRAM_IMAGE_SIZE_LIMIT_BYTES) {
    await sendTelegramMessage(
      chatId,
      textByLanguage(profile.preferred_language, {
        id: 'Foto struk terlalu besar. Kirim versi yang lebih kecil atau kompres dulu.',
        en: 'The receipt image is too large. Send a smaller or compressed version.',
      })
    );
    return;
  }

  const caption = message.caption?.trim() ?? '';
  const captionPreview = caption
    ? parseSmartInput(caption, {
        wallets,
        categories,
      })
    : null;

  try {
    const imageDataUrl = await downloadTelegramFileAsDataUrl(attachment.fileId, attachment.mimeType);
    const extracted = await extractReceiptTransactionFromImage({
      imageDataUrl,
      caption,
      language: profile.preferred_language,
      wallets,
      categories,
      timezone: profile.timezone,
      walletIdOverride: captionPreview?.walletId ?? null,
      categoryIdOverride: captionPreview?.categoryId ?? null,
    });

    if (!extracted.isReceipt || !extracted.title || extracted.amount <= 0) {
      await sendTelegramMessage(
        chatId,
        textByLanguage(profile.preferred_language, {
          id: 'Aku belum bisa membaca struk ini dengan yakin. Coba foto yang lebih jelas atau unggah ulang dengan pencahayaan yang lebih baik.',
          en: 'I could not read this receipt confidently. Try a clearer photo or re-upload it with better lighting.',
        })
      );
      return;
    }

    if (!extracted.walletId || !extracted.walletName) {
      await sendTelegramMessage(
        chatId,
        textByLanguage(profile.preferred_language, {
          id: 'Struknya kebaca, tapi dompetnya belum jelas. Kirim ulang foto dengan caption nama dompet, mis. "cash" atau "bca".',
          en: 'I could read the receipt, but the wallet is still unclear. Re-send the image with a wallet name caption like "cash" or "bca".',
        })
      );
      return;
    }

    const draft: TelegramTransactionDraft = {
      amount: extracted.amount,
      type: extracted.type,
      title: extracted.title,
      note: extracted.note,
      categoryId: extracted.categoryId,
      walletId: extracted.walletId,
      walletName: extracted.walletName,
      transactionDate: extracted.transactionDate,
    };

    await persistTelegramTransaction(connection.user_id, draft);
    await sendSavedTelegramTransactionMessage(chatId, profile, draft, 'receipt');
  } catch (error) {
    if (error instanceof Error && error.message === 'telegram_image_too_large') {
      await sendTelegramMessage(
        chatId,
        textByLanguage(profile.preferred_language, {
          id: 'Foto struk terlalu besar. Kirim versi yang lebih kecil atau kompres dulu.',
          en: 'The receipt image is too large. Send a smaller or compressed version.',
        })
      );
      return;
    }

    throw error;
  }
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
        `- ${wallet.name}: ${formatCurrencyAmount(
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
      ...wallets.map((wallet) => `- ${wallet.name}`),
    ].join('\n')
  );
}

async function sendStatus(chatId: string, connection: TelegramConnectionRow) {
  const profile = await fetchTelegramProfile(connection.user_id);

  await sendTelegramMessage(
    chatId,
    textByLanguage(profile.preferred_language, {
      id: [
        'Status bot:',
        '- Terhubung: ya',
        `- Username Telegram: ${connection.telegram_username ? `@${connection.telegram_username}` : '-'}`,
        `- Bahasa: ${profile.preferred_language.toUpperCase()}`,
        `- Mata uang: ${profile.currency_code}`,
        `- Zona waktu: ${profile.timezone}`,
      ].join('\n'),
      en: [
        'Bot status:',
        '- Connected: yes',
        `- Telegram username: ${connection.telegram_username ? `@${connection.telegram_username}` : '-'}`,
        `- Language: ${profile.preferred_language.toUpperCase()}`,
        `- Currency: ${profile.currency_code}`,
        `- Timezone: ${profile.timezone}`,
      ].join('\n'),
    })
  );
}

async function sendTodaySummary(chatId: string, connection: TelegramConnectionRow) {
  const profile = await fetchTelegramProfile(connection.user_id);
  const today = getLocalDateInTimezone(profile.timezone);
  const summary = await fetchTodayTelegramSummary(connection.user_id, today);

  await sendTelegramMessage(
    chatId,
    textByLanguage(profile.preferred_language, {
      id: [
        `Ringkasan hari ini (${today})`,
        `- Pemasukan: ${formatCurrencyAmount(summary.income, profile.preferred_language, profile.currency_code)}`,
        `- Pengeluaran: ${formatCurrencyAmount(summary.expense, profile.preferred_language, profile.currency_code)}`,
        `- Selisih: ${formatCurrencyAmount(summary.net, profile.preferred_language, profile.currency_code, { signDisplay: 'always' })}`,
        `- Transaksi: ${summary.count}`,
      ].join('\n'),
      en: [
        `Today summary (${today})`,
        `- Income: ${formatCurrencyAmount(summary.income, profile.preferred_language, profile.currency_code)}`,
        `- Expense: ${formatCurrencyAmount(summary.expense, profile.preferred_language, profile.currency_code)}`,
        `- Net: ${formatCurrencyAmount(summary.net, profile.preferred_language, profile.currency_code, { signDisplay: 'always' })}`,
        `- Transactions: ${summary.count}`,
      ].join('\n'),
    })
  );
}

async function sendLatestTransactions(chatId: string, connection: TelegramConnectionRow) {
  const profile = await fetchTelegramProfile(connection.user_id);
  const transactions = await fetchRecentTelegramTransactions(connection.user_id);

  if (transactions.length === 0) {
    await sendTelegramMessage(
      chatId,
      textByLanguage(profile.preferred_language, {
        id: 'Belum ada transaksi terbaru.',
        en: 'No recent transactions yet.',
      })
    );
    return;
  }

  const lines = transactions.map((transaction) => {
    const sign = transaction.type === 'income' ? '+' : '-';
    const date = transaction.transaction_date || transaction.date || '-';
    const walletName = transaction.wallets?.name ? ` - ${transaction.wallets.name}` : '';

    return `${sign} ${transaction.title || '-'} - ${formatCurrencyAmount(
      transaction.amount,
      profile.preferred_language,
      profile.currency_code
    )}${walletName} - ${date}`;
  });

  await sendTelegramMessage(
    chatId,
    [
      textByLanguage(profile.preferred_language, {
        id: 'Transaksi terbaru:',
        en: 'Recent transactions:',
      }),
      ...lines,
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
        '- kopi 25rb cash',
        '- gaji 5jt bca',
        '- upload foto struk, lalu tambahkan caption nama dompet jika perlu',
        '',
        'Perintah:',
        '- /commands',
        '- /balance',
        '- /wallets',
        '- /today',
        '- /latest',
        '- /status',
        '- /unlink',
      ].join('\n'),
      en: [
        'Send transactions directly from chat.',
        '',
        'Examples:',
        '- coffee 25k cash',
        '- salary 5m bca',
        '- upload a receipt image and add a wallet name in the caption if needed',
        '',
        'Commands:',
        '- /commands',
        '- /balance',
        '- /wallets',
        '- /today',
        '- /latest',
        '- /status',
        '- /unlink',
      ].join('\n'),
    })
  );
}

export async function handleTelegramUpdate(update: TelegramUpdate) {
  const message = update.message;

  if (!message || message.chat.type !== 'private') {
    return;
  }

  const imageAttachment = pickTelegramImageAttachment(message);

  if (!message.text && !message.caption && !imageAttachment) {
    return;
  }

  const chatId = String(message.chat.id);
  const fallbackLanguage = resolveTelegramLanguage(message.from?.language_code);
  const command = message.text ? parseTelegramCommand(message.text) : null;

  if (command?.command === 'start') {
    const token = command.args[0];

    if (token) {
      const linkResult = await linkTelegramAccount(token, message);

      if (!linkResult.ok) {
        await sendTelegramMessage(
          chatId,
          textByLanguage(fallbackLanguage, {
            id:
              linkResult.reason === 'already_linked'
                ? 'Akun Telegram ini sudah terhubung ke user lain.'
                : 'Token koneksi tidak valid atau sudah kedaluwarsa. Buat link baru dari Pengaturan DuitFlow.',
            en:
              linkResult.reason === 'already_linked'
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
    const activeLanguage = existingConnection
      ? await fetchTelegramProfile(existingConnection.user_id).then((profile) => profile.preferred_language)
      : fallbackLanguage;

    await sendTelegramMessage(
      chatId,
      textByLanguage(activeLanguage, {
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

  if (command?.command === 'help' || command?.command === 'commands') {
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

  if (command?.command === 'today') {
    await sendTodaySummary(chatId, connection);
    return;
  }

  if (command?.command === 'latest') {
    await sendLatestTransactions(chatId, connection);
    return;
  }

  if (command?.command === 'status') {
    await sendStatus(chatId, connection);
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

  if (imageAttachment) {
    await createTelegramReceiptTransaction(chatId, message, connection, imageAttachment);
    return;
  }

  if (message.text) {
    await createTelegramTransaction(chatId, message.text, connection);
  }
}
