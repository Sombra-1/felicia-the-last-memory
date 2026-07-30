import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4174'
const output = resolve(
  process.env.SPECTACLE_REFINEMENT_DIR ?? 'docs/evidence/phase6.7.1/screenshots',
)
const desktop = { width: 1440, height: 900 }
const consoleIssues = []
const captures = []

async function preparePage(page) {
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
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(
    () =>
      document
        .querySelector('.canvas-loading')
        ?.classList.contains('canvas-loading--hidden'),
    undefined,
    { timeout: 20_000 },
  )
  await page.addStyleTag({
    content: `
      .experience-diagnostics { display: none !important; }
      html, body, button, canvas { cursor: none !important; }
    `,
  })
}

async function screenshot(page, filename) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  })
  await page.waitForTimeout(350)
  await page.screenshot({ path: resolve(output, filename), fullPage: true })
  captures.push(filename)
}

async function waitForPhase(page, phase, timeout = 12_000) {
  await page.locator(`[data-phase="${phase}"]`).waitFor({ timeout })
}

async function enter(page) {
  await preparePage(page)
  await page.getByRole('button', { name: /enter memory/i }).click()
  await waitForPhase(page, 'chamber')
}

async function collect(page, fragment, final = false) {
  await page
    .getByRole('button', { name: new RegExp(`${fragment}, available`, 'i') })
    .click()
  const continueButton = page.getByRole('button', { name: /continue/i })
  await continueButton.waitFor({ state: 'visible', timeout: 10_000 })
  await continueButton.click()
  await waitForPhase(page, final ? 'ready-for-reconstruction' : 'chamber')
}

async function captureEnding(browser, order, filename, viewport = desktop) {
  const context = await browser.newContext({
    reducedMotion: 'reduce',
    viewport,
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
  await screenshot(page, filename)
  await context.close()
}

await mkdir(output, { recursive: true })
const browser = await chromium.launch()

const stagedContext = await browser.newContext({ viewport: desktop })
const stagedPage = await stagedContext.newPage()
await preparePage(stagedPage)
await stagedPage.waitForFunction(() => Boolean(window.__FELICIA_EVIDENCE__))

for (const stage of [
  { index: 0, progress: 0.82, filename: 'ordered-recall-first-memory.png' },
  { index: 1, progress: 0.76, filename: 'ordered-recall-second-memory.png' },
  { index: 2, progress: 0.82, filename: 'ordered-recall-completed.png' },
]) {
  await stagedPage.evaluate(({ index, progress }) => {
    window.__FELICIA_EVIDENCE__?.holdRecall(['identity', 'fear', 'hope'], index, progress)
  }, stage)
  await screenshot(stagedPage, stage.filename)
}

await stagedPage.evaluate(() => {
  window.__FELICIA_EVIDENCE__?.holdSignature(['identity', 'fear', 'hope'], 0.72)
})
await screenshot(stagedPage, 'refined-signature-shot.png')
await stagedContext.close()

await captureEnding(browser, ['identity', 'fear', 'hope'], 'identity-ending.png')
await captureEnding(browser, ['fear', 'identity', 'hope'], 'fear-ending.png')
await captureEnding(browser, ['hope', 'fear', 'identity'], 'hope-ending.png')
await captureEnding(browser, ['hope', 'identity', 'fear'], 'mobile-hope-ending.png', {
  width: 390,
  height: 844,
})

await browser.close()
await writeFile(
  resolve(output, 'capture-diagnostics.json'),
  JSON.stringify({ baseURL, captures, consoleIssues }, null, 2),
)
console.log(JSON.stringify({ baseURL, output, captures, consoleIssues }, null, 2))
