import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4174'
const output = resolve(
  process.env.SPECTACLE_EVIDENCE_DIR ?? 'docs/evidence/phase6.7/screenshots',
)
const mode = process.env.SPECTACLE_CAPTURE_MODE ?? 'all'
const desktop = { width: 1440, height: 900 }

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

async function waitForPhase(page, phase, timeout = 12_000) {
  await page.locator(`[data-phase="${phase}"]`).waitFor({ timeout })
}

async function enter(page) {
  await waitForCanvas(page)
  await page.getByRole('button', { name: /enter memory/i }).click()
  await waitForPhase(page, 'chamber')
}

async function clearFocus(page) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  })
}

async function collect(page, fragment, final = false, screenshot = null) {
  await page
    .getByRole('button', { name: new RegExp(`${fragment}, available`, 'i') })
    .click()
  const continueButton = page.getByRole('button', { name: /continue/i })
  await continueButton.waitFor({ state: 'visible', timeout: 10_000 })
  if (screenshot) {
    await clearFocus(page)
    await page.screenshot({ path: resolve(output, screenshot), fullPage: true })
  }
  await continueButton.click()
  await waitForPhase(page, final ? 'ready-for-reconstruction' : 'chamber')
}

async function captureProfile(browser, order, filename) {
  const context = await browser.newContext({
    reducedMotion: 'reduce',
    viewport: desktop,
  })
  const page = await context.newPage()
  await enter(page)
  for (const [index, fragment] of order.entries()) {
    await collect(page, fragment, index === 2)
  }
  await page.getByRole('button', { name: /complete reconstruction/i }).click()
  await waitForPhase(page, 'ending', 15_000)
  await page.getByRole('button', { name: /reenter memory/i }).waitFor({
    state: 'visible',
    timeout: 8_000,
  })
  await clearFocus(page)
  await page.screenshot({ path: resolve(output, filename), fullPage: true })
  await context.close()
}

await mkdir(output, { recursive: true })
const browser = await chromium.launch()
const consoleIssues = []

if (mode === 'all' || mode === 'journey') {
  const context = await browser.newContext({ viewport: desktop })
  const page = await context.newPage()
  page.on('console', (message) => {
    const text = message.text()
    const harmlessReadback =
      text.includes('GL Driver Message') && text.includes('GPU stall due to ReadPixels')
    if (
      !harmlessReadback &&
      (message.type() === 'error' || message.type() === 'warning')
    ) {
      consoleIssues.push(`${message.type()}: ${text}`)
    }
  })
  page.on('pageerror', (error) => consoleIssues.push(`pageerror: ${error.message}`))

  await enter(page)
  await page.waitForTimeout(3_850)
  await clearFocus(page)
  await page.screenshot({
    path: resolve(output, 'opening-hero.png'),
    fullPage: true,
  })

  await collect(page, 'identity', false, 'identity-reveal.png')
  await collect(page, 'fear', false, 'fear-reveal.png')
  await collect(page, 'hope', true, 'hope-reveal.png')

  await page.getByRole('button', { name: /complete reconstruction/i }).click()
  await waitForPhase(page, 'reconstruction-collapse')
  await page.waitForTimeout(180)
  await page.screenshot({ path: resolve(output, 'collapse.png'), fullPage: true })

  await waitForPhase(page, 'reconstruction-recall')
  await page.waitForTimeout(260)
  await page.screenshot({
    path: resolve(output, 'ordered-recall.png'),
    fullPage: true,
  })

  await waitForPhase(page, 'reconstruction-rebuilding')
  await page.waitForTimeout(1_850)
  await page.screenshot({
    path: resolve(output, 'signature-wow.png'),
    fullPage: true,
  })

  await waitForPhase(page, 'ending', 12_000)
  await page.getByRole('button', { name: /reenter memory/i }).waitFor({
    state: 'visible',
    timeout: 9_000,
  })
  await clearFocus(page)
  await page.screenshot({
    path: resolve(output, 'identity-ending.png'),
    fullPage: true,
  })
  await context.close()
}

if (mode === 'all' || mode === 'profiles') {
  await captureProfile(browser, ['fear', 'identity', 'hope'], 'fear-ending.png')
  await captureProfile(browser, ['hope', 'fear', 'identity'], 'hope-ending.png')
}

await browser.close()
await writeFile(
  resolve(output, 'capture-diagnostics.json'),
  JSON.stringify({ baseURL, mode, consoleIssues }, null, 2),
)
console.log(JSON.stringify({ baseURL, output, mode, consoleIssues }, null, 2))
