import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4190'
const output = resolve(
  process.env.RESCUE_METRICS_PATH ?? 'docs/submission/scene-metrics.json',
)

async function metrics(page) {
  await page.waitForFunction(
    () =>
      document.documentElement.dataset.sceneDrawCalls !== undefined &&
      document.documentElement.dataset.sceneTriangles !== undefined,
  )
  await page.waitForTimeout(900)
  return page.evaluate(() => ({
    drawCalls: Number(document.documentElement.dataset.sceneDrawCalls),
    triangles: Number(document.documentElement.dataset.sceneTriangles),
  }))
}

async function collect(page, fragment, final = false) {
  await page
    .getByRole('button', { name: new RegExp(`${fragment}, available`, 'i') })
    .click()
  const continueButton = page.getByRole('button', { name: /continue/i })
  await continueButton.waitFor({ state: 'visible' })
  await continueButton.click()
  await page
    .locator(final ? '[data-phase="ready-for-reconstruction"]' : '[data-phase="chamber"]')
    .waitFor()
}

await mkdir(resolve('docs/submission'), { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.emulateMedia({ reducedMotion: 'reduce' })
await page.goto(baseURL)
await page.waitForFunction(() =>
  document.querySelector('.canvas-loading')?.classList.contains('canvas-loading--hidden'),
)
await page.getByRole('button', { name: /enter memory/i }).click()
await page.locator('[data-phase="chamber"]').waitFor()
await page.waitForTimeout(1_100)

const result = {
  initialChamber: await metrics(page),
  allCollectedChamber: null,
  reconstructionPeak: null,
  identityEnding: null,
  fearEnding: null,
  hopeEnding: null,
  fixedCosts: {
    activeLights: 3,
    shadowMaps: 0,
    highParticles: 88,
    mediumParticles: 52,
    lowParticles: 24,
    postprocessing: 'high/medium on; low off',
  },
}

await collect(page, 'identity')
await collect(page, 'fear')
await collect(page, 'hope', true)
result.allCollectedChamber = await metrics(page)
await page.getByRole('button', { name: /complete reconstruction/i }).click()
const peak = { drawCalls: 0, triangles: 0 }
const deadline = Date.now() + 12_000
while (Date.now() < deadline) {
  const sample = await metrics(page)
  peak.drawCalls = Math.max(peak.drawCalls, sample.drawCalls)
  peak.triangles = Math.max(peak.triangles, sample.triangles)
  const phase = await page.locator('.experience-shell').getAttribute('data-phase')
  if (phase === 'ending') break
}
result.reconstructionPeak = peak

for (const [key, order] of [
  ['identityEnding', ['identity', 'fear', 'hope']],
  ['fearEnding', ['fear', 'identity', 'hope']],
  ['hopeEnding', ['hope', 'fear', 'identity']],
]) {
  await page.evaluate(
    (endingOrder) => window.__FELICIA_EVIDENCE__?.holdEnding(endingOrder),
    order,
  )
  result[key] = await metrics(page)
}

await browser.close()
await writeFile(output, JSON.stringify(result, null, 2))
console.log(JSON.stringify({ output, result }, null, 2))
