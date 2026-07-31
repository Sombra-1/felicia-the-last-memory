import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const baseURL = process.env.PHASE8_BASE_URL ?? 'http://127.0.0.1:5173'
const output =
  process.env.PHASE8_METRICS_PATH ?? 'docs/evidence/phase8-first-pass/performance.json'

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
  await page.waitForTimeout(500)

  return page.evaluate(async () => {
    const frameCount = 12
    const startedAt = performance.now()

    await new Promise((resolve) => {
      let frames = 0
      const advance = () => {
        frames += 1
        if (frames >= frameCount) {
          resolve()
          return
        }
        requestAnimationFrame(advance)
      }
      requestAnimationFrame(advance)
    })

    const elapsed = performance.now() - startedAt
    const memory = performance.memory

    return {
      fps: Number(((frameCount * 1000) / elapsed).toFixed(1)),
      frameTimeMs: Number((elapsed / frameCount).toFixed(2)),
      drawCalls: Number(document.documentElement.dataset.sceneDrawCalls),
      triangles: Number(document.documentElement.dataset.sceneTriangles),
      quality: document.querySelector('.experience-shell')?.dataset.quality ?? null,
      jsHeapMb: memory ? Number((memory.usedJSHeapSize / 1024 / 1024).toFixed(1)) : null,
    }
  })
}

async function measureContext(browser, viewport, mobile = false) {
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
    window.__FELICIA_EVIDENCE__?.holdSynchronization(['identity', 'fear', 'hope'], 0.76),
  )
  const reconstruction = await sample(page)

  await page.evaluate(() =>
    window.__FELICIA_EVIDENCE__?.holdEnding(['identity', 'fear', 'hope']),
  )
  const identityEnding = await sample(page)

  await context.close()
  return { viewport, opening, identity, reconstruction, identityEnding, consoleProblems }
}

await mkdir(path.dirname(output), { recursive: true })
const browser = await chromium.launch({ headless: true })
const result = {
  capturedAt: new Date().toISOString(),
  baseURL,
  desktop: await measureContext(browser, { width: 1440, height: 900 }),
  mobile: await measureContext(browser, { width: 390, height: 844 }, true),
  notes: [
    'FPS is a 12-frame requestAnimationFrame sample in headless Chromium using software-rendered SwiftShader; use it for relative scene comparison, not as a hardware-browser certification.',
    'No shadow maps are used.',
    'Memory glass uses layered Fresnel/clearcoat surfaces without costly physical transmission.',
  ],
}
await browser.close()

await writeFile(output, JSON.stringify(result, null, 2))
console.log(JSON.stringify({ output, result }, null, 2))
