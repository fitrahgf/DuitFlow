import { expect, test, type Locator, type Page } from '@playwright/test';

const e2eUserEmail = process.env.E2E_USER_EMAIL;
const e2eUserPassword = process.env.E2E_USER_PASSWORD;

type PublicRouteAudit = {
  path: '/login' | '/register' | '/forgot-password';
  heading: RegExp;
  primaryAction: RegExp;
  labels: RegExp[];
};

type AppRouteAudit = {
  path:
    | '/dashboard'
    | '/transactions'
    | '/wallets'
    | '/budgets'
    | '/reports'
    | '/transfer'
    | '/categories'
    | '/projects'
    | '/wishlist'
    | '/notifications'
    | '/subscriptions'
    | '/settings';
  keyLocator?: (page: Page) => Locator;
  expectsFab?: boolean;
};

const publicRoutes: PublicRouteAudit[] = [
  {
    path: '/login',
    heading: /sign in to continue|masuk untuk melanjutkan/i,
    primaryAction: /sign in|masuk/i,
    labels: [/email/i, /password/i],
  },
  {
    path: '/register',
    heading: /start your workspace|mulai workspace anda/i,
    primaryAction: /create account|buat akun/i,
    labels: [/full name|nama lengkap/i, /email/i, /password/i, /confirm password|konfirmasi password/i],
  },
  {
    path: '/forgot-password',
    heading: /recover your account|pulihkan akun anda/i,
    primaryAction: /send reset link|kirim link reset/i,
    labels: [/email/i],
  },
];

const appRoutes: AppRouteAudit[] = [
  {
    path: '/dashboard',
    keyLocator: (page) =>
      page
        .getByRole('link', { name: /tambah transaksi|add transaction/i })
        .or(page.getByPlaceholder(/coffee 25k cash|kopi 25rb cash/i)),
  },
  {
    path: '/transactions',
    keyLocator: (page) => page.getByPlaceholder(/search transactions|cari transaksi/i),
  },
  {
    path: '/wallets',
    keyLocator: (page) => page.getByRole('button', { name: /add wallet|tambah dompet/i }),
  },
  {
    path: '/budgets',
    keyLocator: (page) => page.getByRole('button', { name: /new budget|budget baru|add budget|tambah budget/i }).first(),
  },
  {
    path: '/reports',
    keyLocator: (page) => page.getByRole('button', { name: /reset filters|reset filter/i }).first(),
  },
  {
    path: '/transfer',
    keyLocator: (page) => page.getByRole('button', { name: /new transfer|transfer baru/i }),
  },
  {
    path: '/categories',
  },
  {
    path: '/projects',
  },
  {
    path: '/wishlist',
  },
  {
    path: '/notifications',
    keyLocator: (page) => page.getByRole('button', { name: /mark all read|tandai semua dibaca/i }).first(),
  },
  {
    path: '/subscriptions',
  },
  {
    path: '/settings',
    keyLocator: (page) => page.getByRole('tab', { name: /profile|regional|appearance|notifications|integrations|bahasa/i }).first(),
    expectsFab: false,
  },
];

async function preparePage(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
}

async function login(page: Page) {
  await preparePage(page);
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(e2eUserEmail!);
  await page.getByLabel(/password/i).fill(e2eUserPassword!);
  await page.getByRole('button', { name: /sign in|masuk/i }).click();
  await page.waitForURL('**/dashboard');
}

async function expectNoHorizontalOverflow(page: Page, route: string) {
  const layoutState = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const candidates = Array.from(document.querySelectorAll<HTMLElement>('body *'))
      .filter((element) => {
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
          return false;
        }

        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          return false;
        }

        return rect.left < -1 || rect.right > viewportWidth + 1;
      })
      .slice(0, 8)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          text: (element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 80),
        };
      });

    return {
      viewportWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      candidates,
    };
  });

  expect(
    layoutState.scrollWidth,
    `${route} should not create document-level horizontal overflow`
  ).toBeLessThanOrEqual(layoutState.viewportWidth + 1);
  expect(
    layoutState.bodyScrollWidth,
    `${route} should not create body-level horizontal overflow`
  ).toBeLessThanOrEqual(layoutState.viewportWidth + 1);
  expect(layoutState.candidates, `${route} has overflowing visible elements`).toEqual([]);
}

async function expectTouchTarget(locator: Locator, label: string) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, `${label} should render with a measurable box`).not.toBeNull();
  expect(box!.width, `${label} width should be at least 44px`).toBeGreaterThanOrEqual(44);
  expect(box!.height, `${label} height should be at least 44px`).toBeGreaterThanOrEqual(44);
}

async function expectBelowMaxHeight(locator: Locator, maxHeight: number, label: string) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, `${label} should render with a measurable box`).not.toBeNull();
  expect(box!.height, `${label} should stay within ${maxHeight}px`).toBeLessThanOrEqual(maxHeight);
}

async function expectInFirstViewport(locator: Locator, viewportHeight: number, label: string) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, `${label} should render with a measurable box`).not.toBeNull();
  expect(box!.y, `${label} should appear within the first viewport`).toBeLessThan(viewportHeight - 40);
}

async function auditPublicRoute(page: Page, route: PublicRouteAudit) {
  await preparePage(page);
  await page.goto(route.path);

  await expect(page.getByRole('heading', { name: route.heading }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: route.primaryAction }).first()).toBeVisible();

  for (const label of route.labels) {
    await expect(page.getByLabel(label).first()).toBeVisible();
  }

  await expectNoHorizontalOverflow(page, route.path);
}

async function auditAppRoute(page: Page, route: AppRouteAudit) {
  await page.goto(route.path);
  await expect(page.locator('h1').first()).toBeVisible();
  if (route.keyLocator) {
    await expect(route.keyLocator(page).first()).toBeVisible();
  }
  await expectNoHorizontalOverflow(page, route.path);
}

test.describe('ui-ux audit: desktop auth routes', () => {
  test.use({ viewport: { width: 1440, height: 960 } });

  for (const route of publicRoutes) {
    test(`${route.path} is structured and overflow-free`, async ({ page }) => {
      await auditPublicRoute(page, route);
    });
  }
});

test.describe('ui-ux audit: mobile auth routes', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });

  for (const route of publicRoutes) {
    test(`${route.path} is touch-safe and overflow-free`, async ({ page }) => {
      await auditPublicRoute(page, route);

      await expectTouchTarget(page.getByRole('button', { name: route.primaryAction }).first(), `${route.path} primary action`);
      for (const label of route.labels) {
        await expectTouchTarget(page.getByLabel(label).first(), `${route.path} field ${label}`);
      }
    });
  }
});

test.describe('ui-ux audit: authenticated app routes', () => {
  test.skip(!e2eUserEmail || !e2eUserPassword, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required.');

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.describe('desktop', () => {
    test.use({ viewport: { width: 1440, height: 960 } });

    for (const route of appRoutes) {
      test(`${route.path} stays clean on desktop`, async ({ page }) => {
        await auditAppRoute(page, route);
      });
    }
  });

  test.describe('mobile', () => {
    test.use({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });

    for (const route of appRoutes) {
      test(`${route.path} stays clean on mobile`, async ({ page }) => {
        await auditAppRoute(page, route);

        await expect(page.getByRole('navigation', { name: /mobile navigation/i })).toBeVisible();
        await expectBelowMaxHeight(page.locator('header').first(), 72, `${route.path} mobile header`);
        if (route.expectsFab !== false) {
          await expectTouchTarget(
            page.getByRole('button', { name: /quick add|input cepat/i }).last(),
            `${route.path} floating quick action`
          );
        }
        if (route.keyLocator) {
          await expectInFirstViewport(route.keyLocator(page).first(), 844, `${route.path} primary content`);
        }
      });
    }

    test('/dashboard quick add sheet fits inside the viewport', async ({ page }) => {
      await page.goto('/dashboard');
      await page.getByRole('button', { name: /quick add|input cepat/i }).last().click();
      await expectBelowMaxHeight(page.getByTestId('quick-transaction-sheet'), 844, 'dashboard quick add sheet');
    });

    test('/wallets add wallet dialog fits inside the viewport', async ({ page }) => {
      await page.goto('/wallets');
      await page.getByRole('button', { name: /add wallet|tambah dompet/i }).first().click();
      await expectBelowMaxHeight(page.getByRole('dialog').first(), 844, 'wallets dialog');
    });
  });
});
