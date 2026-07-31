import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const baseURL = process.env.RECOVERY_BASE_URL ?? 'http://127.0.0.1:5173'
const evidenceRoot =
  process.env.RECOVERY_REVIEW_DIR ?? 'docs/evidence/phase8-recovery-full-review'
const frameDir = path.join(evidenceRoot, 'frames')
const mobileDir = path.join(evidenceRoot, 'mobile')
const videoDir = path.join(evidenceRoot, 'video')

await Promise.all([
  mkdir(frameDir, { recursive: true }),
  mkdir(mobileDir, { recursive: true }),
  mkdir(videoDir, { recursive: true }),
])

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

async function capture(page, directory, filename) {
  const target = path.join(directory, filename)
  await page.screenshot({ path: target, animations: 'disabled' })
  diagnostics.frames.push(target)
}

async function desktopStills() {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  watchConsole(page, 'desktop-stills')
  await enter(page)

  const holdTrial = async (fragment, stage, beat, order, filename) => {
    await page.evaluate(
      ([memory, trialStage, trialBeat, collectionOrder]) =>
        window.__FELICIA_EVIDENCE__?.holdTrial(
          memory,
          trialStage,
          trialBeat,
          collectionOrder,
        ),
      [fragment, stage, beat, order],
    )
    await page.waitForTimeout(760)
    await capture(page, frameDir, filename)
  }

  await page.evaluate(() => window.__FELICIA_EVIDENCE__?.holdChamber([]))
  await page.waitForTimeout(700)
  await capture(page, frameDir, '01-opening-hero.png')

  await holdTrial('identity', 'interaction', 1, [], '02-identity-alignment.png')

  await holdTrial('fear', 'arrival', 0, ['identity'], '03-fear-arrival.png')
  await holdTrial('fear', 'incoming', 0, ['identity'], '04-fear-incoming.png')
  await page.evaluate(() => {
    const trial = window.__FELICIA_EVIDENCE__?.inspectRuntime().trial
    if (!trial) return
    trial.fearDirection = 'left'
    trial.fearShield = 'left'
    trial.fearPulse = 0.92
    trial.beatEnergy = 1
  })
  await page.waitForTimeout(320)
  await capture(page, frameDir, '05-fear-impact.png')
  await holdTrial('fear', 'completion', 2, ['identity'], '06-fear-completion.png')

  await holdTrial('hope', 'arrival', 0, ['identity', 'fear'], '07-hope-arrival.png')
  await holdTrial('hope', 'gate-opening', 1, ['identity', 'fear'], '08-hope-growth.png')
  await holdTrial('hope', 'completion', 2, ['identity', 'fear'], '09-hope-completion.png')

  await page.evaluate(() =>
    window.__FELICIA_EVIDENCE__?.holdChamber(['identity', 'fear', 'hope']),
  )
  await page.waitForTimeout(760)
  await capture(page, frameDir, '10-integrated-anatomy.png')

  await page.evaluate(() =>
    window.__FELICIA_EVIDENCE__?.holdSynchronization(['identity', 'fear', 'hope'], 0.78),
  )
  await page.waitForTimeout(760)
  await capture(page, frameDir, '11-synchronization-node.png')

  await page.evaluate(() =>
    window.__FELICIA_EVIDENCE__?.holdRecall(['identity', 'fear', 'hope'], 0, 0.76),
  )
  await page.waitForTimeout(760)
  await capture(page, frameDir, '12-anatomical-extraction.png')

  await page.evaluate(() =>
    window.__FELICIA_EVIDENCE__?.holdSignature(['identity', 'fear', 'hope'], 0.58),
  )
  await page.waitForTimeout(820)
  await capture(page, frameDir, '13-foundation-formation.png')

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
    await page.waitForTimeout(860)
    await capture(page, frameDir, `14-ending-${label}.png`)
  }

  await context.close()
}

async function mobileStills() {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  })
  const page = await context.newPage()
  watchConsole(page, 'mobile-stills')
  await enter(page)

  await page.evaluate(() =>
    window.__FELICIA_EVIDENCE__?.holdTrial('fear', 'impact', 0, ['identity']),
  )
  await page.waitForTimeout(760)
  await capture(page, mobileDir, '01-fear-impact-mobile.png')

  await page.evaluate(() =>
    window.__FELICIA_EVIDENCE__?.holdTrial('hope', 'gate-opening', 1, [
      'identity',
      'fear',
    ]),
  )
  await page.waitForTimeout(760)
  await capture(page, mobileDir, '02-hope-growth-mobile.png')

  await page.evaluate(() =>
    window.__FELICIA_EVIDENCE__?.holdEnding(['hope', 'identity', 'fear']),
  )
  await page.waitForTimeout(860)
  await capture(page, mobileDir, '03-hope-ending-mobile.png')

  await context.close()
}

async function trialTransition(fragment, order, kind, frameNumber) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    recordVideo: { dir: videoDir, size: { width: 1440, height: 900 } },
  })
  const page = await context.newPage()
  watchConsole(page, `${fragment}-${kind}`)
  await enter(page)
  const video = page.video()

  if (kind === 'departure') {
    await page.evaluate(
      ([selected, collectionOrder]) =>
        window.__FELICIA_EVIDENCE__?.playTrialTransition(selected, collectionOrder),
      [fragment, order],
    )
    await page.waitForFunction(
      () =>
        document.querySelector('.experience-shell')?.dataset.phase === 'trial-departure',
    )
    await page.waitForTimeout(760)
    await capture(page, frameDir, `${frameNumber}-${fragment}-departure-midpoint.png`)
    await page.waitForFunction(
      () => document.querySelector('.experience-shell')?.dataset.phase === 'trial-active',
      undefined,
      { timeout: 30_000 },
    )
  } else {
    await page.evaluate(
      ([selected, collectionOrder]) =>
        window.__FELICIA_EVIDENCE__?.playTrialReturn(selected, collectionOrder),
      [fragment, order],
    )
    await page.waitForFunction(
      () =>
        document.querySelector('.experience-shell')?.dataset.phase === 'trial-returning',
    )
    await page.waitForTimeout(760)
    await capture(page, frameDir, `${frameNumber}-${fragment}-return-midpoint.png`)
    await page.waitForFunction(
      () => {
        const phase = document.querySelector('.experience-shell')?.dataset.phase
        return phase === 'chamber' || phase === 'ready-for-reconstruction'
      },
      undefined,
      { timeout: 30_000 },
    )
  }

  await page.waitForTimeout(700)
  await context.close()
  const target = path.join(videoDir, `${fragment}-${kind}-raw.webm`)
  await video?.saveAs(target)
  await video?.delete()
  diagnostics.videos.push(target)
}

async function reconstruction() {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    recordVideo: { dir: videoDir, size: { width: 1440, height: 900 } },
  })
  const page = await context.newPage()
  watchConsole(page, 'full-reconstruction')
  await enter(page)
  const video = page.video()

  await page.waitForFunction(
    () => window.__FELICIA_EVIDENCE__?.startAudioCapture() === true,
  )
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
  await page.waitForTimeout(1_800)

  const audioBase64 = await page.evaluate(
    () => window.__FELICIA_EVIDENCE__?.stopAudioCapture() ?? Promise.resolve(''),
  )
  const audioTarget = path.join(videoDir, 'full-reconstruction-browser-audio.webm')
  await writeFile(audioTarget, Buffer.from(audioBase64, 'base64'))
  diagnostics.videos.push(audioTarget)

  await context.close()
  const target = path.join(videoDir, 'full-reconstruction-raw.webm')
  await video?.saveAs(target)
  await video?.delete()
  diagnostics.videos.push(target)
}

await desktopStills()
await mobileStills()

if (!process.env.RECOVERY_STILLS_ONLY) {
  await trialTransition('identity', [], 'departure', '15')
  await trialTransition('identity', [], 'return', '16')
  await trialTransition('fear', ['identity'], 'departure', '17')
  await trialTransition('fear', ['identity'], 'return', '18')
  await trialTransition('hope', ['identity', 'fear'], 'departure', '19')
  await trialTransition('hope', ['identity', 'fear'], 'return', '20')
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
    `Captured ${diagnostics.frames.length} frames and ${diagnostics.videos.length} video/audio files.`,
  )
}
