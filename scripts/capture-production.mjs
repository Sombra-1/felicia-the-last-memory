import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? 'https://felicia-the-last-memory.ayx1.chatgpt.site'
const output = resolve('docs/submission/screenshots')

async function enter(page) {
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  await page.waitForFunction(
    () =>
      document
        .querySelector('.canvas-loading')
        ?.classList.contains('canvas-loading--hidden'),
    undefined,
    { timeout: 20_000 },
  )
  await page.getByRole('button', { name: /enter memory/i }).click()
  await page.locator('[data-phase="chamber"]').waitFor()
}

async function collect(page, fragment, final = false) {
  await page
    .getByRole('button', { name: new RegExp(`${fragment}, available`, 'i') })
    .click()
  await page.getByRole('button', { name: /continue/i }).waitFor()
  await page.getByRole('button', { name: /continue/i }).click()
  await page
    .locator(final ? '[data-phase="ready-for-reconstruction"]' : '[data-phase="chamber"]')
    .waitFor()
}

async function clearFocus(page) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    window.scrollTo(0, 0)
  })
}

async function ending(browser, order, path, viewport) {
  const context = await browser.newContext({
    reducedMotion: 'reduce',
    viewport,
  })
  const page = await context.newPage()
  await enter(page)
  for (const [index, fragment] of order.entries()) {
    await collect(page, fragment, index === order.length - 1)
  }
  await page.getByRole('button', { name: /complete reconstruction/i }).click()
  await page.locator('[data-phase="ending"]').waitFor({ timeout: 20_000 })
  await page.getByRole('button', { name: /reenter memory/i }).waitFor()
  await clearFocus(page)
  await page.screenshot({ path: resolve(output, path), fullPage: true })
  await context.close()
}

await mkdir(output, { recursive: true })
const browser = await chromium.launch()

const chamberContext = await browser.newContext({
  reducedMotion: 'reduce',
  viewport: { width: 1440, height: 900 },
})
const chamber = await chamberContext.newPage()
await enter(chamber)
await clearFocus(chamber)
await chamber.screenshot({
  path: resolve(output, 'initial-chamber.png'),
  fullPage: true,
})
await chamber.getByRole('button', { name: /hope, available/i }).click()
await chamber.getByRole('button', { name: /continue/i }).waitFor()
await clearFocus(chamber)
await chamber.screenshot({
  path: resolve(output, 'hope-memory-reveal.png'),
  fullPage: true,
})
await chamberContext.close()

await ending(browser, ['fear', 'identity', 'hope'], 'fear-first-ending.png', {
  width: 1440,
  height: 900,
})
await ending(browser, ['hope', 'fear', 'identity'], 'hope-first-ending.png', {
  width: 1440,
  height: 900,
})
await ending(browser, ['hope', 'fear', 'identity'], 'mobile-hope-ending.png', {
  width: 430,
  height: 932,
})

await browser.close()
console.log(`Captured production screenshots from ${baseURL}`)
