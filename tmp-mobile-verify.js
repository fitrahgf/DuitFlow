const { chromium } = require('playwright');

async function login(page) {
  await page.goto('http://127.0.0.1:3000/login');
  await page.getByLabel(/email/i).fill('fitrah.gf@gmail.com');
  await page.getByLabel(/password/i).fill('gilang28k');
  const submit = page.getByRole('button', { name: /sign in|masuk|login/i }).first();
  await submit.click();
  await page.waitForURL('**/dashboard');
}

async function getOverflowState(page) {
  return page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    return {
      viewportWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      candidates: Array.from(document.querySelectorAll('body *'))
        .filter((element) => {
          const style = window.getComputedStyle(element);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            return false;
          }
          const rect = element.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return false;
          return rect.left < -1 || rect.right > viewportWidth + 1;
        })
        .slice(0, 6)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName.toLowerCase(),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            text: (element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80),
          };
        }),
    };
  });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await login(page);

  const routes = ['/dashboard', '/reports', '/wishlist'];
  for (const route of routes) {
    await page.goto(`http://127.0.0.1:3000${route}`);
    const overflow = await getOverflowState(page);
    const quickAddVisible = route === '/dashboard'
      ? await page.locator('input[placeholder*="kopi"]').first().isVisible().catch(() => false)
      : null;
    console.log(JSON.stringify({ route, overflow, quickAddVisible }, null, 2));
  }

  await browser.close();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
