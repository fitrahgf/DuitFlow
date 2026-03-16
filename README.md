# DuitFlow

DuitFlow adalah aplikasi personal finance berbasis Next.js + Supabase untuk transaksi harian, transfer antar dompet, budget, wishlist, subscriptions, reports, notifications, dan settings regional seperti bahasa serta mata uang.

## Stack

- Next.js App Router
- React 19
- TanStack Query
- Supabase Auth + Database
- Tailwind CSS
- Vitest
- Playwright

## Local Setup

1. Install dependency:

```bash
npm install
```

2. Pastikan environment berikut tersedia di `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=DuitFlowMoneyTrack_Bot
TELEGRAM_BOT_TOKEN=...
TELEGRAM_WEBHOOK_SECRET=...
SUPABASE_SERVICE_ROLE_KEY=...
```

3. Jalankan app:

```bash
npm run dev
```

App default berjalan di `http://localhost:3000`.

## Auth Notes

- Untuk dev/staging, gunakan project Supabase non-production.
- Disarankan mematikan email confirmation di environment testing agar register/login dan smoke QA tidak terhambat.
- Jika environment tetap strict, flow register akan mengarahkan user ke login dengan notice untuk cek email, dan login menyediakan action kirim ulang email konfirmasi.

## Quality Checks

```bash
npm run lint
npm test
npm run build
```

## E2E Smoke Tests

Tambahkan test account ke environment shell sebelum menjalankan Playwright:

```bash
E2E_USER_EMAIL=...
E2E_USER_PASSWORD=...
```

Install browser Playwright sekali:

```bash
npx playwright install chromium
```

Jalankan smoke suite:

```bash
npm run test:e2e
```

Atau mode UI:

```bash
npm run test:e2e:ui
```

Smoke suite mencakup:

- auth login
- settings currency switch
- create wallet
- create income transaction
- create expense transaction
- create transfer
- formatted amount input untuk `IDR` dan `USD`
- transaction filter persistence via URL
- CSV export

Jika `E2E_USER_EMAIL` atau `E2E_USER_PASSWORD` belum di-set, test akan di-skip agar harness tetap runnable di local setup yang belum lengkap.

## Manual QA

Checklist manual QA ada di [docs/qa/stability-daily-use.md](docs/qa/stability-daily-use.md).

## Telegram Bot

Telegram bot memakai webhook Vercel di `/api/telegram/webhook`.

Environment yang dibutuhkan:

```bash
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=DuitFlowMoneyTrack_Bot
TELEGRAM_BOT_TOKEN=...
TELEGRAM_WEBHOOK_SECRET=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Setelah deploy ke Vercel, set webhook Telegram:

```bash
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://duit-flow.vercel.app/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>
```

Flow koneksi user:

- buka `Settings > Telegram`
- klik `Connect bot`
- Telegram akan membuka chat bot dengan token sekali pakai
- setelah terhubung, user bisa kirim pesan seperti `kopi 25rb cash`

Command awal yang tersedia:

- `/help`
- `/balance`
- `/wallets`
- `/unlink`
