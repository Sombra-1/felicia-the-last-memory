import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4174'
const output = resolve(process.env.RESCUE_EVIDENCE_DIR ?? 'docs/submission/screenshots')

async function waitForCanvas(page) {
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(
    () =>
      document
        .querySelector('.canvas-loading')
        ?.classList.contains('canvas-loading--hidden'),
    undefined,
    { timeout: 20_000 },
  )
}

async function enter(page, settleEntrance = false) {
  await waitForCanvas(page)
  await page.getByRole('button', { name: /enter memory/i }).click()
  await page.locator('[data-phase="chamber"]').waitFor()
  if (settleEntrance) await page.waitForTimeout(3_800)
}

async function reveal(page, fragment) {
  await page
    .getByRole('button', { name: new RegExp(`${fragment}, available`, 'i') })
    .click()
  await page.getByRole('button', { name: /continue/i }).waitFor({ timeout: 8_000 })
}

async function continueFromReveal(page, final = false) {
  await page.getByRole('button', { name: /continue/i }).click()
  await page
    .locator(final ? '[data-phase="ready-for-reconstruction"]' : '[data-phase="chamber"]')
    .waitFor({ timeout: 8_000 })
}

async function clearFocus(page) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  })
}

async function captureEnding(browser, order, filename, viewport) {
  const context = await browser.newContext({
    reducedMotion: 'reduce',
    viewport,
  })
  const page = await context.newPage()
  await enter(page)
  for (const [index, fragment] of order.entries()) {
    await reveal(page, fragment)
    await continueFromReveal(page, index === 2)
  }
  await page.getByRole('button', { name: /complete reconstruction/i }).click()
  await page.locator('[data-phase="ending"]').waitFor({ timeout: 20_000 })
  const replay = page.getByRole('button', { name: /reenter memory/i })
  await replay.waitFor({ state: 'visible', timeout: 8_000 })
  await page.waitForFunction(
    () => {
      const button = [...document.querySelectorAll('button')].find((candidate) =>
        /reenter memory/i.test(candidate.textContent ?? ''),
      )
      return button instanceof HTMLButtonElement && !button.disabled
    },
    undefined,
    { timeout: 8_000 },
  )
  await clearFocus(page)
  await page.screenshot({ path: resolve(output, filename), fullPage: true })
  await context.close()
}

await mkdir(output, { recursive: true })
const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
const consoleIssues = []
page.on('console', (message) => {
  if (message.type() === 'error' || message.type() === 'warning') {
    consoleIssues.push(`${message.type()}: ${message.text()}`)
  }
})
page.on('pageerror', (error) => consoleIssues.push(`pageerror: ${error.message}`))

await enter(page, true)
await clearFocus(page)
await page.screenshot({ path: resolve(output, 'initial-chamber.png'), fullPage: true })
await page.getByRole('button', { name: /mute ambient sound/i }).click()
await page.getByRole('button', { name: /enable ambient sound/i }).waitFor()
await page.getByRole('button', { name: /enable ambient sound/i }).click()
await page.getByRole('button', { name: /mute ambient sound/i }).waitFor()

if (process.env.RESCUE_CAPTURE_MODE === 'sound-only') {
  await context.close()
  await browser.close()
  console.log(JSON.stringify({ baseURL, output, consoleIssues }, null, 2))
  process.exit(0)
}

for (const [index, fragment] of ['identity', 'fear', 'hope'].entries()) {
  await reveal(page, fragment)
  await clearFocus(page)
  await page.screenshot({
    path: resolve(output, `${fragment}-reveal.png`),
    fullPage: true,
  })
  await continueFromReveal(page, index === 2)
}

await context.close()
await captureEnding(browser, ['identity', 'fear', 'hope'], 'identity-ending.png', {
  width: 1440,
  height: 900,
})
await captureEnding(browser, ['fear', 'identity', 'hope'], 'fear-ending.png', {
  width: 1440,
  height: 900,
})
await captureEnding(browser, ['hope', 'fear', 'identity'], 'hope-ending.png', {
  width: 1440,
  height: 900,
})
await captureEnding(browser, ['hope', 'fear', 'identity'], 'mobile-hope-ending.png', {
  width: 390,
  height: 844,
})

await browser.close()
console.log(JSON.stringify({ baseURL, output, consoleIssues }, null, 2))
