# Playwright UI/UX Audit

Automated UI/UX smoke audit for DuitFlow using Playwright.

## What it checks

- public auth pages render correctly
- no horizontal overflow on desktop and mobile
- primary actions and core fields stay visible
- mobile touch targets stay at least 44px
- authenticated app pages can also be checked if E2E credentials are provided

## Files

- `e2e/ui-ux.spec.ts`

## Run

Install Playwright browser once:

```bash
npx playwright install chromium
```

Run the UI/UX audit:

```bash
npm run test:e2e:ux
```

Run headed for manual observation:

```bash
npx playwright test e2e/ui-ux.spec.ts --headed
```

## Optional full-app audit

To include authenticated pages like `/dashboard` and `/transactions`, set:

```bash
E2E_USER_EMAIL=your-email@example.com
E2E_USER_PASSWORD=your-password
```

Then run:

```bash
npm run test:e2e:ux
```
