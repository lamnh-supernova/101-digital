import { expect, test, type Page } from '@playwright/test';

async function signIn(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill('e2e-reviewer@simpleinvoice.test');
  await page.getByLabel('Password', { exact: true }).fill('E2eReviewerPass123!');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/invoices');
}

test('creates an invoice once and finds it back in the list', async ({ page }) => {
  const invoiceNumber = `E2E-CREATE-${Date.now()}`;
  await signIn(page);
  await page.getByRole('link', { name: 'New invoice' }).first().click();
  await expect(page).toHaveURL('/invoices/new');

  await page.getByLabel('Invoice number').fill(invoiceNumber);
  await page.locator('#invoice-date').fill('2026-07-12');
  await page.locator('#due-date').fill('2026-08-12');
  await page.getByLabel('Customer name').fill('Playwright Reviewer');
  await page.getByLabel('Customer email').fill('reviewer@example.test');
  await page.getByLabel('Item name').fill('Consulting services');
  await page.getByLabel('Quantity').fill('2');
  await page.getByLabel('Rate').fill('125.50');

  // The live summary renders in both a mobile and a sticky desktop copy.
  await expect(page.getByText('£276.10')).toHaveCount(2);
  const submit = page.getByRole('button', { name: 'Review and create invoice' });
  await submit.dblclick();
  await expect(page.getByText(`Invoice ${invoiceNumber} was created.`)).toBeVisible();

  await page.getByRole('link', { name: 'View refreshed invoice list' }).click();
  await expect(page).toHaveURL('/invoices');
  await expect(page.getByRole('heading', { name: 'Invoice results' })).toBeVisible();

  await page
    .getByRole('searchbox', { name: 'Search invoice number or customer' })
    .fill(invoiceNumber);
  await expect(page.getByRole('rowheader', { name: new RegExp(invoiceNumber) })).toBeVisible();
});

test('blocks an invalid invoice in the browser with accessible errors', async ({ page }) => {
  let createRequests = 0;
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith('/invoices')) {
      createRequests += 1;
    }
  });

  await signIn(page);
  await page.goto('/invoices/new');
  await page.getByRole('button', { name: 'Review and create invoice' }).click();

  await expect(
    page.getByRole('alert').filter({ hasText: 'Check the highlighted fields' }),
  ).toBeVisible();
  await expect(page.getByLabel('Invoice number')).toBeFocused();
  await expect(page.getByLabel('Invoice number')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('Invoice number is required.')).toBeVisible();
  expect(createRequests).toBe(0);
});

test('rejects a duplicate invoice number with an inline conflict message', async ({ page }) => {
  const invoiceNumber = `E2E-DUPLICATE-${Date.now()}`;
  await signIn(page);
  await page.goto('/invoices/new');

  async function fillAndSubmit(): Promise<void> {
    await page.getByLabel('Invoice number').fill(invoiceNumber);
    await page.locator('#invoice-date').fill('2026-07-12');
    await page.locator('#due-date').fill('2026-08-12');
    await page.getByLabel('Customer name').fill('Playwright Reviewer');
    await page.getByLabel('Customer email').fill('reviewer@example.test');
    await page.getByLabel('Item name').fill('Consulting services');
    await page.getByLabel('Quantity').fill('1');
    await page.getByLabel('Rate').fill('10');
    await page.getByRole('button', { name: 'Review and create invoice' }).click();
  }

  await fillAndSubmit();
  await expect(page.getByText(`Invoice ${invoiceNumber} was created.`)).toBeVisible();

  await page.goto('/invoices/new');
  await fillAndSubmit();
  await expect(
    page.getByText('That invoice number may already exist. Review it and try again.'),
  ).toBeVisible();
});
