import { describe, expect, it } from 'vitest';
import {
  getLocalDateInTimezone,
  hashTelegramLinkToken,
  parseTelegramCommand,
} from '@/lib/telegram/server';
import { buildTelegramDeepLink, sanitizeTelegramBotUsername } from '@/lib/telegram/shared';

describe('telegram helpers', () => {
  it('normalizes bot usernames and builds deep links', () => {
    expect(sanitizeTelegramBotUsername('@DuitFlowMoneyTrack_Bot')).toBe('DuitFlowMoneyTrack_Bot');
    expect(buildTelegramDeepLink('@DuitFlowMoneyTrack_Bot', 'abc123')).toBe(
      'https://t.me/DuitFlowMoneyTrack_Bot?start=abc123'
    );
  });

  it('parses commands and strips bot mentions', () => {
    expect(parseTelegramCommand('/start token123')).toEqual({
      command: 'start',
      args: ['token123'],
    });

    expect(parseTelegramCommand('/balance@DuitFlowMoneyTrack_Bot')).toEqual({
      command: 'balance',
      args: [],
    });

    expect(parseTelegramCommand('coffee 25k cash')).toBeNull();
  });

  it('hashes link tokens deterministically and formats local dates', () => {
    expect(hashTelegramLinkToken('abc123')).toBe(
      '6ca13d52ca70c883e0f0bb101e425a89e8624de51db2d2392593af6a84118090'
    );
    expect(getLocalDateInTimezone('Asia/Jakarta')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
