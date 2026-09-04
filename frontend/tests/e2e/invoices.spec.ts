import { expect, test, type Page } from '@playwright/test';

import { expectNoHorizontalOverflow } from './support/layout-assertions';

async function signIn(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill('e2e-reviewer@simpleinvoice.test');
  await page.getByLabel('Password', { exact: true }).fill('E2eReviewerPass123!');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/invoices');
  await expect(page.getByRole('heading', { name: 'Invoice results' })).toBeVisible();
}

test('keeps search, filters, sorting, and pagination in canonical URL state', async ({ page }) => {
  await signIn(page);

  await page.getByRole('searchbox', { name: 'Search invoice number or customer' }).fill('IV1000');
  await expect(page).toHaveURL('/invoices?keyword=IV1000');
  await expect(page.getByRole('rowheader', { name: /IV1000/ })).toBeVisible();

  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(page).toHaveURL('/invoices');
  await page.getByLabel('Status').selectOption('Paid');
  await expect(page).toHaveURL('/invoices?status=Paid');
  await expect(page.getByRole('table').getByText('Paid', { exact: true }).first()).toBeVisible();

  await page.goto('/invoices');
  await page.getByLabel('Sort by').selectOption('totalAmount');
  await expect(page).toHaveURL('/invoices?sortBy=totalAmount');

  await page.goto('/invoices');
  await page.getByLabel('Invoices per page').selectOption('20');
  await expect(page).toHaveURL('/invoices?pageSize=20');

  // 10 is the default page size, so it is omitted from the canonical URL.
  await page.goto('/invoices');
  const firstPageInvoice = await page.getByRole('rowheader').first().innerText();
  await page.getByRole('link', { name: 'Next' }).click();
  await expect(page).toHaveURL('/invoices?page=2');
  const secondPageInvoice = await page.getByRole('rowheader').first().innerText();
  expect(secondPageInvoice).not.toBe(firstPageInvoice);

  await page.reload();
  await expect(page).toHaveURL('/invoices?page=2');
  await page.goBack();
  await expect(page).toHaveURL('/invoices');
  await page.goForward();
  await expect(page).toHaveURL('/invoices?page=2');
});

test('opens a keyboard-accessible detail view fetched by id', async ({ page }) => {
  await signIn(page);

  const firstRow = page
    .getByRole('row')
    .filter({ has: page.getByRole('rowheader') })
    .first();
  const invoiceNumber = (await firstRow.getByRole('rowheader').innerText()).split('\n')[0]?.trim();
  await firstRow.getByRole('link', { name: /View invoice/ }).focus();
  await page.keyboard.press('Enter');

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const heading = dialog.locator('#invoice-detail-heading');
  if (invoiceNumber) {
    await expect(heading).toHaveText(invoiceNumber);
  }
  await expect(heading).toBeFocused();
  await page.getByRole('link', { name: 'Close' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('uses mobile invoice cards without viewport overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);

  await expect(page.getByRole('list', { name: 'Invoices' })).toBeVisible();
  await expect(page.getByRole('table')).toBeHidden();
  await expectNoHorizontalOverflow(page);

  await page
    .getByRole('link', { name: /View invoice/ })
    .first()
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  // The drawer slides in over 0.2s; let the transform settle before measuring.
  await page.waitForTimeout(300);
  await expectNoHorizontalOverflow(page);
});

test('supports keyboard Escape close with focus restoration', async ({ page }) => {
  await signIn(page);

  const invoiceLink = page.getByRole('link', { name: /View invoice/ }).first();
  await invoiceLink.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(invoiceLink).toBeFocused();
});

test('has no page overflow across representative application widths', async ({ page }) => {
  await signIn(page);

  for (const width of [320, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/invoices');
    await expect(page.getByRole('navigation', { name: 'Invoice navigation' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Invoices' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    if (width < 1024) {
      await expect(page.getByRole('list', { name: 'Invoices' })).toBeVisible();
      await expect(page.getByRole('table')).toBeHidden();
    } else {
      await expect(page.getByRole('table')).toBeVisible();
      await expect(page.getByRole('list', { name: 'Invoices' })).toBeHidden();
    }

    await expectNoHorizontalOverflow(page);
  }

  await page.goto('/invoices/new');
  await expect(page).toHaveTitle('Create invoice | SimpleInvoice');
  await expect(page.getByRole('link', { name: 'New invoice' })).toHaveAttribute(
    'aria-current',
    'page',
  );

  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole('heading', { name: 'Calculated summary' }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});
