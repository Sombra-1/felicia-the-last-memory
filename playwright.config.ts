import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 3,
  retries: 0,
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    colorScheme: 'dark',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'firefox',
      testMatch: /cross-browser\.spec\.ts/,
      use: { browserName: 'firefox' },
    },
  ],
  webServer: {
    command: 'rtk npm run dev -- --host 127.0.0.1 --port 4173 --force',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
