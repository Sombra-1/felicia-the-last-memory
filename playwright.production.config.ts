import { defineConfig } from '@playwright/test'

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? 'https://felicia-the-last-memory.ayx1.chatgpt.site'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /cross-browser\.spec\.ts/,
  workers: 1,
  retries: 1,
  timeout: 60_000,
  use: {
    baseURL,
    colorScheme: 'dark',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'production-chromium', use: { browserName: 'chromium' } },
    { name: 'production-firefox', use: { browserName: 'firefox' } },
  ],
})
