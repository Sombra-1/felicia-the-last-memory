import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    colorScheme: 'dark',
    browserName: 'webkit',
  },
  projects: [
    {
      name: 'webkit',
      testMatch: /cross-browser\.spec\.ts/,
      use: { browserName: 'webkit' },
    },
  ],
  webServer: {
    command: 'rtk npm run dev -- --host 127.0.0.1 --port 4173 --force',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
