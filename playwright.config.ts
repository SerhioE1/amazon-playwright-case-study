import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const isHeaded = String(process.env.HEADED).toLowerCase() === 'true';
const baseURL = process.env.BASE_URL || 'https://www.amazon.com';

export default defineConfig({
  testDir: './src',

  // Global timeout per test
  timeout: 60_000,

  // Timeout for expect assertions if Playwright test runner is used later
  expect: {
    timeout: 10_000
  },

  // No retries for now, because this is a case study and failures
  // should stay visible instead of being hidden by automatic reruns
  retries: 0,

  // Folder for Playwright artifacts
  outputDir: 'test-results/',

  use: {
    baseURL,
    headless: !isHeaded,

    // Useful default viewport for desktop Amazon flows
    viewport: { width: 1440, height: 900 },

    // Reasonable defaults for slow dynamic UI
    actionTimeout: 15_000,
    navigationTimeout: 30_000,

    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure'
  },

  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/playwright-report', open: 'never' }]
  ],

  // Cross-platform / multi-browser support
  // Playwright automatically manages browser binaries for Windows, Linux and macOS.
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        browserName: 'chromium'
      }
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        browserName: 'firefox'
      }
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        browserName: 'webkit'
      }
    }
  ]
});