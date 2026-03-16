import { expect, test, type Page } from '@playwright/test';

const smokeUserEmail = process.env.E2E_USER_EMAIL;
const smokeUserPassword = process.env.E2E_USER_PASSWORD;
const runId = `${Date.now()}`;
const createdWalletName = `Smoke Wallet ${runId.slice(-6)}`;
const incomeTitle = `Smoke Income ${runId.slice(-6)}`;
const expenseTitle = `Smoke Expense ${runId.slice(-6)}`;

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(smokeUserEmail!);
  await page.getByLabel(/password/i).fill(smokeUserPassword!);
  await page.getByRole('button', { name: /sign in|masuk/i }).click();
  await page.waitForURL('**/dashboard');
}

async function openRegionalSettings(page: Page) {
  await page.goto('/settings');
  await page.getByRole('tab', { name: /language|bahasa/i }).click();
  await expect(page.getByLabel(/currency|mata uang/i)).toBeVisible();
}

async function switchCurrency(page: Page, currencyCode: 'IDR' | 'USD', expectedPreview: RegExp) {
  await openRegionalSettings(page);
  await page.getByLabel(/currency|mata uang/i).selectOption(currencyCode);
  await page.getByRole('button', { name: /save settings|simpan pengaturan/i }).click();
  await expect(page.getByText(expectedPreview)).toBeVisible();
}

async function openAddWalletDialog(page: Page) {
  await page.goto('/wallets');
  await page.getByRole('button', { name: /add wallet|tambah dompet/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

async function createWallet(page: Page, expectedAmount: string) {
  await openAddWalletDialog(page);
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel(/wallet name|nama dompet/i).fill(createdWalletName);
  const openingBalanceInput = dialog.getByLabel(/opening balance|saldo awal/i);
  await openingBalanceInput.fill('400000');
  await expect(openingBalanceInput).toHaveValue(expectedAmount);
  await dialog.getByRole('button', { name: /save|simpan/i }).click();
  await expect(page.getByText(createdWalletName)).toBeVisible();
}

async function openAddTransactionDialog(page: Page) {
  await page.goto('/transactions');
  await page.getByRole('button', { name: /add transaction|tambah transaksi/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

async function createTransaction(
  page: Page,
  options: {
    type: 'income' | 'expense';
    title: string;
    expectedAmount: string;
  }
) {
  await openAddTransactionDialog(page);
  const dialog = page.getByRole('dialog');
  await dialog
    .getByRole('button', { name: options.type === 'income' ? /income|pemasukan/i : /expense|pengeluaran/i })
    .click();

  const amountInput = dialog.getByLabel(/amount|nominal/i);
  await amountInput.fill('400000');
  await expect(amountInput).toHaveValue(options.expectedAmount);
  await dialog.getByLabel(/title|judul/i).fill(options.title);
  await dialog.getByRole('button', { name: /save|simpan/i }).click();
  await expect(page.getByText(options.title)).toBeVisible();
}

async function getTransferWalletOptions(page: Page) {
  const dialog = page.getByRole('dialog');
  const options = await dialog.locator('#transfer-from-wallet option').evaluateAll((nodes) =>
    nodes
      .map((node) => ({
        value: (node as HTMLOptionElement).value,
        label: node.textContent?.trim() ?? '',
      }))
      .filter((option) => option.value)
  );

  return options;
}

async function createTransfer(page: Page) {
  await page.goto('/transfer');
  await page.getByRole('button', { name: /new transfer|transfer baru/i }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  const walletOptions = await getTransferWalletOptions(page);
  expect(walletOptions.length).toBeGreaterThan(1);

  const sourceWallet = walletOptions.find((option) => option.label !== createdWalletName) ?? walletOptions[0];
  const destinationWallet =
    walletOptions.find((option) => option.label === createdWalletName && option.label !== sourceWallet.label) ??
    walletOptions.find((option) => option.label !== sourceWallet.label);

  expect(destinationWallet).toBeDefined();

  await dialog.getByLabel(/from wallet|dompet asal/i).selectOption(sourceWallet.value);
  await dialog.getByLabel(/to wallet|dompet tujuan/i).selectOption(destinationWallet!.value);
  await dialog.getByLabel(/amount|nominal/i).fill('125000');
  await dialog.getByLabel(/note|catatan/i).fill(`Smoke transfer ${runId.slice(-6)}`);
  await dialog.getByRole('button', { name: /save|simpan/i }).click();
  await expect(dialog).not.toBeVisible();
}

test.describe.serial('daily-use smoke', () => {
  test.skip(!smokeUserEmail || !smokeUserPassword, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required.');

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('logs in with the smoke account', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('switches currency to USD and saves settings', async ({ page }) => {
    await switchCurrency(page, 'USD', /\$ ?1,234,567/);
  });

  test('creates a wallet with grouped amount input', async ({ page }) => {
    await createWallet(page, '400,000');
  });

  test('creates income and expense transactions with grouped amount input', async ({ page }) => {
    await createTransaction(page, {
      type: 'income',
      title: incomeTitle,
      expectedAmount: '400,000',
    });
    await createTransaction(page, {
      type: 'expense',
      title: expenseTitle,
      expectedAmount: '400,000',
    });
  });

  test('creates a transfer between wallets', async ({ page }) => {
    await createTransfer(page);
  });

  test('switches currency back to IDR and reflects thousand separators', async ({ page }) => {
    await switchCurrency(page, 'IDR', /Rp\s?1\.234\.567/);

    await page.goto('/transactions');
    await page.getByRole('button', { name: /add transaction|tambah transaksi/i }).click();
    const dialog = page.getByRole('dialog');
    const amountInput = dialog.getByLabel(/amount|nominal/i);
    await amountInput.fill('400000');
    await expect(amountInput).toHaveValue('400.000');
  });

  test('persists transaction filters in the URL after refresh', async ({ page }) => {
    await page.goto('/transactions');
    const searchInput = page.getByPlaceholder(/search transactions|cari transaksi/i);
    await searchInput.fill(expenseTitle);

    await expect(page).toHaveURL(new RegExp(`q=${encodeURIComponent(expenseTitle).replace(/%20/g, '\\+')}`));
    await page.reload();
    await expect(searchInput).toHaveValue(expenseTitle);
    await expect(page.getByText(expenseTitle)).toBeVisible();
  });

  test('exports the current filtered transaction view to CSV', async ({ page }) => {
    await page.goto('/transactions');
    await page.getByPlaceholder(/search transactions|cari transaksi/i).fill(expenseTitle);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /export csv|ekspor csv/i }).click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^duitflow-transactions-\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
