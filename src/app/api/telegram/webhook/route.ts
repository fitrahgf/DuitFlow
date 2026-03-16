import { NextResponse } from 'next/server';
import { handleTelegramUpdate, type TelegramUpdate } from '@/lib/telegram/bot';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!process.env.TELEGRAM_BOT_TOKEN || !webhookSecret || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false, error: 'telegram_not_configured' }, { status: 500 });
  }

  const incomingSecret = request.headers.get('x-telegram-bot-api-secret-token');

  if (incomingSecret !== webhookSecret) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  const update = (await request.json()) as TelegramUpdate;

  try {
    await handleTelegramUpdate(update);
  } catch (error) {
    console.error('Telegram webhook error', error);
  }

  return NextResponse.json({ ok: true });
}
