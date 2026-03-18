import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';

const { handleTelegramUpdate } = vi.hoisted(() => ({
  handleTelegramUpdate: vi.fn(),
}));

vi.mock('@/lib/telegram/bot', () => ({
  handleTelegramUpdate,
}));

describe('telegram webhook route', () => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  afterEach(() => {
    handleTelegramUpdate.mockReset();
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_WEBHOOK_SECRET;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('returns 500 when processing fails so Telegram can retry', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'bot-token';
    process.env.TELEGRAM_WEBHOOK_SECRET = 'secret';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
    handleTelegramUpdate.mockRejectedValue(new Error('boom'));

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost/api/telegram/webhook', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-telegram-bot-api-secret-token': 'secret',
        },
        body: JSON.stringify({ update_id: 1 }),
      })
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: 'processing_failed',
    });
  }, 10000);

  it('rejects malformed payloads with 400', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'bot-token';
    process.env.TELEGRAM_WEBHOOK_SECRET = 'secret';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost/api/telegram/webhook', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-telegram-bot-api-secret-token': 'secret',
        },
        body: '{',
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: 'invalid_payload',
    });
  });
});
