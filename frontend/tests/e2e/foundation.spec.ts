import { expect, test } from '@playwright/test';

import { expectNoHorizontalOverflow } from './support/layout-assertions';

const REVIEWER_EMAIL = 'e2e-reviewer@simpleinvoice.test';
const REVIEWER_PASSWORD = 'E2eReviewerPass123!';

test('redirects unauthenticated protected navigation to the login page', async ({ page }) => {
  const response = await page.goto('/invoices');

  await expect(page).toHaveURL('/login');
  await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
    'href',
    '#main-content',
  );

  expect(response?.headers()['x-content-type-options']).toBe('nosniff');
  expect(response?.headers()['x-frame-options']).toBe('DENY');
});

test('signs in, stores the session client-side, and signs out', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(REVIEWER_EMAIL);
  await page.getByLabel('Password', { exact: true }).fill(REVIEWER_PASSWORD);
  const [loginResponse] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' && response.url().endsWith('/auth/login'),
    ),
    page.getByRole('button', { name: 'Sign in' }).click(),
  ]);
  await expect(page).toHaveURL('/invoices');
  await expect(page.getByRole('heading', { name: 'Invoices', exact: true })).toBeVisible();
  expect(loginResponse.status()).toBe(200);

  const storedAuth = await page.evaluate(() => localStorage.getItem('simpleinvoice.auth'));
  expect(storedAuth).toContain(REVIEWER_EMAIL);

  const cookies = await page.context().cookies();
  expect(cookies.some(({ name }) => name.startsWith('simpleinvoice_'))).toBe(false);

  await page.goto('/login');
  await expect(page).toHaveURL('/invoices');

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL('/login');
  await page.goto('/invoices');
  await expect(page).toHaveURL('/login');
});

test('shows a generic accessible sign-in failure', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(REVIEWER_EMAIL);
  await page.getByLabel('Password', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in' }).click();

  const alert = page.getByText('The email or password is incorrect.', { exact: true });
  await expect(alert).toHaveAttribute('role', 'alert');
  await expect(page).toHaveURL('/login');
});

test('renders the global not-found page', async ({ page }) => {
  await page.goto('/route-that-does-not-exist');

  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return home' })).toHaveAttribute('href', '/');
});

test('supports a keyboard-only sign-in path with visible focus', async ({ page }) => {
  await page.goto('/login');
  await expect(page).toHaveTitle('Sign in | SimpleInvoice');

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'SimpleInvoice home' })).toBeFocused();
  for (let attempt = 0; attempt < 10; attempt += 1) {
    if ((await page.evaluate(() => document.activeElement?.id)) === 'email') break;
    await page.keyboard.press('Tab');
  }
  await expect(page.getByLabel('Email')).toBeFocused();
  await page.keyboard.type(REVIEWER_EMAIL);
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Password', { exact: true })).toBeFocused();
  await page.keyboard.type(REVIEWER_PASSWORD);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page).toHaveURL('/invoices');
  await expect(page.getByRole('heading', { name: 'Invoices', exact: true })).toBeVisible();
});

test('keeps public states usable across representative widths', async ({ page }) => {
  for (const width of [320, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/login');
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});
