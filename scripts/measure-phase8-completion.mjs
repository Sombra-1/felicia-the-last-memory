import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const baseURL = process.env.PHASE8_BASE_URL ?? 'http://127.0.0.1:5173'
const output =
  process.env.PHASE8_METRICS_PATH ??
  'docs/evidence/phase8-completion-pass/performance.json'

async function enter(page) {
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' })
  await page.locator('.canvas-loading').waitFor({ state: 'attached' })
  await page.waitForFunction(() =>
    document
      .querySelector('.canvas-loading')
      ?.classList.contains('canvas-loading--hidden'),
  )
  await page.getByRole('button', { name: /enter memory/i }).click()
  await page.waitForFunction(() => Boolean(window.__FELICIA_EVIDENCE__))
}

async function sample(page) {
  await page.waitForFunction(
    () =>
      document.documentElement.dataset.sceneDrawCalls !== undefined &&
      document.documentElement.dataset.sceneTriangles !== undefined,
  )
  await page.waitForTimeout(550)
  return page.evaluate(() => ({
    drawCalls: Number(document.documentElement.dataset.sceneDrawCalls),
    triangles: Number(document.documentElement.dataset.sceneTriangles),
    quality: document.querySelector('.experience-shell')?.dataset.quality ?? null,
  }))
}

async function measure(browser, viewport, mobile = false) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: mobile ? 2 : 1,
    hasTouch: mobile,
    isMobile: mobile,
  })
  const page = await context.newPage()
  const consoleProblems = []
  page.on('console', (message) => {
    if (!['warning', 'error'].includes(message.type())) return
    const text = message.text()
    if (text.includes('GL Driver Message') && text.includes('GPU stall')) return
    consoleProblems.push(`${message.type()}: ${text}`)
  })
  page.on('pageerror', (error) => consoleProblems.push(`pageerror: ${error.message}`))

  await enter(page)
  await page.evaluate(() => window.__FELICIA_EVIDENCE__?.holdChamber([]))
  const opening = await sample(page)
  await page.evaluate(() =>
    window.__FELICIA_EVIDENCE__?.holdTrial('identity', 'interaction', 1, []),
  )
  const identity = await sample(page)
  await page.evaluate(() =>
    window.__FELICIA_EVIDENCE__?.holdTrial('fear', 'impact', 0, ['identity']),
  )
  const fear = await sample(page)
  await page.evaluate(() =>
    window.__FELICIA_EVIDENCE__?.holdTrial('hope', 'gate-opening', 0, [
      'identity',
      'fear',
    ]),
  )
  const hope = await sample(page)
  await page.evaluate(() =>
    window.__FELICIA_EVIDENCE__?.holdSignature(['identity', 'fear', 'hope'], 0.58),
  )
  const reconstruction = await sample(page)
  await page.evaluate(() =>
    window.__FELICIA_EVIDENCE__?.holdEnding(['identity', 'fear', 'hope']),
  )
  const identityEnding = await sample(page)
  await page.evaluate(() =>
    window.__FELICIA_EVIDENCE__?.holdEnding(['fear', 'identity', 'hope']),
  )
  const fearEnding = await sample(page)
  await page.evaluate(() =>
    window.__FELICIA_EVIDENCE__?.holdEnding(['hope', 'identity', 'fear']),
  )
  const hopeEnding = await sample(page)

  await context.close()
  return {
    viewport,
    opening,
    identity,
    fear,
    hope,
    reconstruction,
    identityEnding,
    fearEnding,
    hopeEnding,
    consoleProblems,
  }
}

await mkdir(path.dirname(output), { recursive: true })
const browser = await chromium.launch({ headless: true })
const result = {
  capturedAt: new Date().toISOString(),
  baseURL,
  desktop: await measure(browser, { width: 1440, height: 900 }),
  mobile: await measure(browser, { width: 390, height: 844 }, true),
  notes: [
    'These are stable scene-complexity measurements, not SwiftShader frame-rate estimates.',
    'No shadow maps or physical transmission are used.',
    'Only the active trial world is visible.',
  ],
}
await browser.close()
await writeFile(output, `${JSON.stringify(result, null, 2)}\n`)
console.log(JSON.stringify({ output, result }, null, 2))
