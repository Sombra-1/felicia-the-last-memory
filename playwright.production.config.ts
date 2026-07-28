import { defineConfig } from '@playwright/test'

const productionURL =
  process.env.PLAYWRIGHT_BASE_URL ?? 'https://felicia-the-last-memory.ayx1.chatgpt.site'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 2,
  retries: 0,
  timeout: 30_000,
  use: {
    baseURL: productionURL,
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
})
