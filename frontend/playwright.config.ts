import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3100';
const apiBaseURL = process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://127.0.0.1:4100';
const databaseUrl =
  process.env.PLAYWRIGHT_DATABASE_URL ??
  'postgres://simple_invoice:simple_invoice@127.0.0.1:5432/simple_invoice';
const localChromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export default defineConfig({
  testDir: './tests/e2e',
  // Tests share one real database; running sequentially keeps counts and
  // pagination assertions deterministic across specs.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: existsSync(localChromePath) ? { executablePath: localChromePath } : {},
      },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : [
        {
          // Requires a reachable PostgreSQL database at PLAYWRIGHT_DATABASE_URL
          // (defaults to the standard docker-compose instance). Seeding is
          // idempotent, so a prior run's data is safely reused.
          command: 'npm run seed && npm run start:dev',
          cwd: '../backend',
          url: `${apiBaseURL}/api/docs-json`,
          reuseExistingServer: false,
          timeout: 60_000,
          env: {
            NODE_ENV: 'test',
            PORT: '4100',
            DATABASE_URL: databaseUrl,
            JWT_SECRET: 'TEST_ONLY_E2E_JWT_SECRET_DO_NOT_USE_IN_PRODUCTION',
            JWT_EXPIRES_IN_SECONDS: '3600',
            CORS_ORIGIN: baseURL,
            SEED_USER_EMAIL: 'e2e-reviewer@simpleinvoice.test',
            SEED_USER_PASSWORD: 'E2eReviewerPass123!',
            SEED_USER_FULLNAME: 'E2E Reviewer',
          },
        },
        {
          command: 'npm run dev -- --port 3100',
          url: baseURL,
          reuseExistingServer: false,
          timeout: 120_000,
          env: {
            NEXT_DIST_DIR: '.next-e2e',
            NEXT_PUBLIC_API_BASE_URL: apiBaseURL,
          },
        },
      ],
});
