import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const baseURL = process.env.PHASE8_BASE_URL ?? 'http://127.0.0.1:5173'
const evidenceRoot =
  process.env.PHASE8_EVIDENCE_DIR ?? 'docs/evidence/phase8-completion-pass'
const frameDir = path.join(evidenceRoot, 'frames')
const videoDir = path.join(evidenceRoot, 'video')
await mkdir(frameDir, { recursive: true })
await mkdir(videoDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const diagnostics = {
  baseURL,
  capturedAt: new Date().toISOString(),
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

async function stills() {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  watchConsole(page, 'stills')
  await enter(page)

  await page.evaluate(() => window.__FELICIA_EVIDENCE__?.holdChamber([]))
  await page.waitForTimeout(700)
  await capture(page, '01-opening-updated.png')

  await page.evaluate(() =>
    window.__FELICIA_EVIDENCE__?.holdTrial('fear', 'impact', 0, ['identity']),
  )
  await page.waitForTimeout(100)
  await page.evaluate(() => {
    const trial = window.__FELICIA_EVIDENCE__?.inspectRuntime().trial
    if (!trial) return
    trial.fearDirection = 'left'
    trial.fearShield = 'left'
    trial.fearPulse = 0.84
    trial.beatEnergy = 1
  })
  await page.waitForTimeout(800)
  await capture(page, '02-fear-implemented.png')

  await page.evaluate(() =>
    window.__FELICIA_EVIDENCE__?.holdTrial('hope', 'gate-opening', 0, [
      'identity',
      'fear',
    ]),
  )
  await page.waitForTimeout(100)
  await page.evaluate(() => {
    const trial = window.__FELICIA_EVIDENCE__?.inspectRuntime().trial
    if (!trial) return
    trial.hopeGateX = -0.72
    trial.hopeSignalX = -0.7
    trial.hopeSignalY = -0.82
    trial.beatEnergy = 0.94
    trial.inputEnergy = 0.84
  })
  await page.waitForTimeout(800)
  await capture(page, '03-hope-implemented.png')

  await page.evaluate(() =>
    window.__FELICIA_EVIDENCE__?.holdSynchronization(['identity', 'fear', 'hope'], 0.78),
  )
  await page.waitForTimeout(750)
  await capture(page, '04-reconstruction-synchronization.png')

  await page.evaluate(() =>
    window.__FELICIA_EVIDENCE__?.holdSignature(['identity', 'fear', 'hope'], 0.58),
  )
  await page.waitForTimeout(850)
  await capture(page, '05-reconstruction-formation.png')

  const endings = [
    ['identity', ['identity', 'fear', 'hope']],
    ['fear', ['fear', 'identity', 'hope']],
    ['hope', ['hope', 'identity', 'fear']],
  ]
  for (const [label, order] of endings) {
    await page.evaluate(
      ([endingOrder]) => window.__FELICIA_EVIDENCE__?.holdEnding(endingOrder),
      [order],
    )
    await page.waitForTimeout(900)
    await capture(page, `06-ending-${label}.png`)
  }
  await context.close()
}

async function transition(fragment) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    recordVideo: { dir: videoDir, size: { width: 1440, height: 900 } },
  })
  const page = await context.newPage()
  watchConsole(page, `${fragment}-transition`)
  await enter(page)
  const video = page.video()
  await page.evaluate(
    ([selected]) => window.__FELICIA_EVIDENCE__?.playTrialTransition(selected, []),
    [fragment],
  )
  await page.waitForFunction(
    () =>
      document.querySelector('.experience-shell')?.dataset.phase === 'trial-departure',
  )
  await page.waitForTimeout(1_020)
  await capture(page, `${fragment === 'fear' ? '07' : '08'}-${fragment}-transition.png`)
  await page.waitForFunction(
    () => document.querySelector('.experience-shell')?.dataset.phase === 'trial-active',
    undefined,
    { timeout: 30_000 },
  )
  await page.waitForTimeout(650)
  await context.close()
  const target = path.join(videoDir, `${fragment}-transition-raw.webm`)
  await video?.saveAs(target)
  diagnostics.videos.push(target)
}

async function reconstruction() {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    recordVideo: { dir: videoDir, size: { width: 1440, height: 900 } },
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
  await page.waitForTimeout(1_600)
  await page.waitForFunction(
    () => document.querySelector('.experience-shell')?.dataset.phase === 'ending',
    undefined,
    { timeout: 60_000 },
  )
  await page.mouse.up()
  await page.waitForTimeout(1_200)
  await context.close()
  const target = path.join(videoDir, 'full-reconstruction-raw.webm')
  await video?.saveAs(target)
  diagnostics.videos.push(target)
}

await stills()
if (!process.env.PHASE8_STILLS_ONLY) {
  await transition('fear')
  await transition('hope')
  await reconstruction()
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
    `Captured ${diagnostics.frames.length} frames and ${diagnostics.videos.length} videos.`,
  )
}
