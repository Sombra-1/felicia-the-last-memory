import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const baseURL = process.env.RECOVERY_BASE_URL ?? 'http://127.0.0.1:5173'
const evidenceRoot =
  process.env.RECOVERY_EVIDENCE_DIR ?? 'docs/evidence/phase8-recovery-gate'
const frameDir = path.join(evidenceRoot, 'frames')
const videoDir = path.join(evidenceRoot, 'video')
await mkdir(frameDir, { recursive: true })
await mkdir(videoDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const diagnostics = {
  baseURL,
  capturedAt: new Date().toISOString(),
  viewport: { width: 1440, height: 900 },
  consoleProblems: [],
  frames: [],
  videos: [],
}

function watchConsole(page, label) {
  page.on('console', (message) => {
    if (!['warning', 'error'].includes(message.type())) return
    const text = message.text()
    if (text.includes('GL Driver Message') && text.includes('GPU stall')) return
    diagnostics.consoleProblems.push(`${label}:${message.type()}: ${text}`)
  })
  page.on('pageerror', (error) => {
    diagnostics.consoleProblems.push(`${label}:pageerror: ${error.message}`)
  })
}

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

async function capture(page, filename) {
  const target = path.join(frameDir, filename)
  await page.screenshot({ path: target, animations: 'disabled' })
  diagnostics.frames.push(target)
}

{
  const context = await browser.newContext({
    viewport: diagnostics.viewport,
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  watchConsole(page, 'stills')
  await enter(page)

  await page.evaluate(() => window.__FELICIA_EVIDENCE__?.holdChamber([]))
  await page.waitForTimeout(700)
  await capture(page, '01-recovered-opening-hero.png')

  await page.evaluate(() =>
    window.__FELICIA_EVIDENCE__?.holdTrial('identity', 'arrival', 0, []),
  )
  await page.waitForTimeout(700)
  await capture(page, '02-identity-arrival.png')

  await page.evaluate(() =>
    window.__FELICIA_EVIDENCE__?.holdTrial('identity', 'interaction', 1, []),
  )
  await page.waitForTimeout(700)
  await capture(page, '03-identity-active.png')

  await page.evaluate(() =>
    window.__FELICIA_EVIDENCE__?.holdSynchronization(['identity', 'fear', 'hope'], 0.78),
  )
  await page.waitForTimeout(700)
  await capture(page, '04-anatomy-first-reconstruction-closeup.png')

  await page.evaluate(() =>
    window.__FELICIA_EVIDENCE__?.holdSignature(['identity', 'fear', 'hope'], 0.54),
  )
  await page.waitForTimeout(700)
  await capture(page, '05-identity-foundation-formation.png')

  await page.evaluate(() =>
    window.__FELICIA_EVIDENCE__?.holdEnding(['identity', 'fear', 'hope']),
  )
  await page.waitForTimeout(700)
  await capture(page, '06-identity-final-profile.png')
  await context.close()
}

{
  const context = await browser.newContext({
    viewport: diagnostics.viewport,
    deviceScaleFactor: 1,
    recordVideo: { dir: videoDir, size: diagnostics.viewport },
  })
  const page = await context.newPage()
  watchConsole(page, 'identity-transition')
  await enter(page)
  const video = page.video()
  await page.evaluate(() =>
    window.__FELICIA_EVIDENCE__?.playTrialTransition('identity', []),
  )
  await page.waitForFunction(
    () =>
      document.querySelector('.experience-shell')?.dataset.phase === 'trial-departure',
  )
  await page.waitForTimeout(1_050)
  await capture(page, '07-identity-transition-midpoint.png')
  await page.waitForFunction(
    () => document.querySelector('.experience-shell')?.dataset.phase === 'trial-active',
    undefined,
    { timeout: 30_000 },
  )
  await page.waitForTimeout(700)
  await context.close()
  const target = path.join(videoDir, 'identity-material-transition-raw.webm')
  await video?.saveAs(target)
  diagnostics.videos.push(target)
}

{
  const context = await browser.newContext({
    viewport: diagnostics.viewport,
    deviceScaleFactor: 1,
    recordVideo: { dir: videoDir, size: diagnostics.viewport },
  })
  const page = await context.newPage()
  watchConsole(page, 'reconstruction')
  await enter(page)
  const video = page.video()
  await page.evaluate(() =>
    window.__FELICIA_EVIDENCE__?.playReconstruction(['identity', 'fear', 'hope']),
  )
  await page.waitForTimeout(350)
  const hold = page.getByRole('button', { name: /hold to synchronize/i })
  await hold.hover()
  await page.mouse.down()
  await page.waitForFunction(
    () =>
      document.querySelector('.experience-shell')?.dataset.phase ===
      'reconstruction-rebuilding',
    undefined,
    { timeout: 60_000 },
  )
  await page.waitForTimeout(1_500)
  await page.waitForFunction(
    () => document.querySelector('.experience-shell')?.dataset.phase === 'ending',
    undefined,
    { timeout: 60_000 },
  )
  await page.mouse.up()
  await page.waitForTimeout(1_100)
  await context.close()
  const target = path.join(videoDir, 'anatomy-first-reconstruction-raw.webm')
  await video?.saveAs(target)
  diagnostics.videos.push(target)
}

await browser.close()
await writeFile(
  path.join(evidenceRoot, 'capture-diagnostics.json'),
  `${JSON.stringify(diagnostics, null, 2)}\n`,
)

if (diagnostics.consoleProblems.length > 0) {
  console.error(diagnostics.consoleProblems.join('\n'))
  process.exitCode = 1
} else {
  console.log(
    `Captured ${diagnostics.frames.length} frames and ${diagnostics.videos.length} raw videos.`,
  )
}
