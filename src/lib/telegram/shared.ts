export function sanitizeTelegramBotUsername(username?: string | null) {
  return username?.trim().replace(/^@+/, '') || '';
}

export function buildTelegramDeepLink(username: string, payload: string) {
  const normalizedUsername = sanitizeTelegramBotUsername(username);

  if (!normalizedUsername) {
    throw new Error('Telegram bot username is not configured.');
  }

  return `https://t.me/${normalizedUsername}?start=${encodeURIComponent(payload)}`;
}
