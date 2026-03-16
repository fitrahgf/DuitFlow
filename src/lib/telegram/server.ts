import { createHash } from 'node:crypto';

export interface ParsedTelegramCommand {
  command: string;
  args: string[];
}

export function hashTelegramLinkToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function parseTelegramCommand(text: string): ParsedTelegramCommand | null {
  const trimmed = text.trim();

  if (!trimmed.startsWith('/')) {
    return null;
  }

  const [rawCommand, ...args] = trimmed.split(/\s+/);
  const command = rawCommand.slice(1).split('@')[0]?.toLowerCase();

  if (!command) {
    return null;
  }

  return {
    command,
    args,
  };
}

export function getLocalDateInTimezone(timezone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone || 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
