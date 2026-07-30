import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173'
const output = resolve(process.env.JUDGE_CLARITY_DIR ?? 'docs/evidence/phase6.7.2/video')
const order = ['fear', 'hope', 'identity']
const diagnostics = {
  baseURL,
  order,
  milestones: [],
  consoleIssues: [],
}

function mark(name) {
  diagnostics.milestones.push({
    name,
    elapsedSeconds: Number(((Date.now() - startedAt) / 1000).toFixed(2)),
  })
}

async function waitForPhase(page, phase, timeout = 35_000) {
  await page.locator(`[data-phase="${phase}"]`).waitFor({ timeout })
  mark(phase)
}

await mkdir(output, { recursive: true })
const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: {
    dir: output,
    size: { width: 1440, height: 900 },
  },
})
const page = await context.newPage()
const startedAt = Date.now()

page.on('console', (message) => {
  const text = message.text()
  const harmlessReadback =
    text.includes('GL Driver Message') && text.includes('GPU stall due to ReadPixels')
  if (!harmlessReadback && (message.type() === 'error' || message.type() === 'warning')) {
    diagnostics.consoleIssues.push(`${message.type()}: ${text}`)
  }
})
page.on('pageerror', (error) => {
  diagnostics.consoleIssues.push(`pageerror: ${error.message}`)
})

await page.goto(baseURL, { waitUntil: 'domcontentloaded' })
await page.locator('.canvas-loading--hidden').waitFor({ timeout: 20_000 })
await page.addStyleTag({
  content: '.experience-diagnostics { display: none !important; }',
})
await page.waitForTimeout(1_500)
await page.getByRole('button', { name: /enter memory/i }).click()
await waitForPhase(page, 'chamber')
await page
  .getByText(/choose the order in which felicia remembers/i)
  .waitFor({ state: 'visible' })
mark('opening-instruction-understood')
await page.waitForTimeout(3_000)

for (const [index, fragment] of order.entries()) {
  await page
    .getByRole('button', { name: new RegExp(`${fragment}, available`, 'i') })
    .click()
  await page.getByRole('button', { name: /continue/i }).waitFor({
    state: 'visible',
    timeout: 10_000,
  })
  mark(`${fragment}-recorded-${index + 1}`)
  await page.waitForTimeout(2_000)
  await page.getByRole('button', { name: /continue/i }).click()
  await waitForPhase(page, index === 2 ? 'ready-for-reconstruction' : 'chamber')
  if (index < 2) {
    await page.waitForTimeout(1_500)
  }
}

await page
  .getByRole('heading', { name: /memory set complete/i })
  .waitFor({ state: 'visible' })
mark('completion-payoff-visible')
await waitForPhase(page, 'reconstruction-initiating', 5_000)
await page.getByText(/foundation — fear/i).waitFor({ state: 'visible' })
mark('foundation-causality-visible')
await waitForPhase(page, 'ending')
await page
  .getByText('Fear became the foundation. Hope and Identity survived as echoes.', {
    exact: true,
  })
  .waitFor({ state: 'visible', timeout: 8_000 })
await page.getByRole('button', { name: /reenter memory/i }).waitFor({
  state: 'visible',
  timeout: 8_000,
})
mark('ending-explanation-visible')
await page.waitForTimeout(4_000)

const video = page.video()
await context.close()
await video?.saveAs(resolve(output, 'felicia-phase672-first-time-walkthrough.webm'))
await browser.close()

diagnostics.durationSeconds = Number(((Date.now() - startedAt) / 1000).toFixed(2))
await writeFile(
  resolve(output, 'felicia-phase672-first-time-walkthrough-diagnostics.json'),
  JSON.stringify(diagnostics, null, 2),
)

console.log(JSON.stringify(diagnostics, null, 2))
