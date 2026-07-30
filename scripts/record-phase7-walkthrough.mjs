import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173'
const output = resolve(process.env.PHASE7_VIDEO_DIR ?? 'docs/evidence/phase7/video')
const order = ['fear', 'hope', 'identity']
const report = {
  baseURL,
  order,
  milestones: [],
  consoleIssues: [],
  activeInteractionSeconds: 0,
  passiveAnimationSeconds: 0,
}

let startedAt = 0
let activeStartedAt = 0

function elapsed() {
  return Number(((Date.now() - startedAt) / 1000).toFixed(2))
}

function mark(name) {
  report.milestones.push({ name, elapsedSeconds: elapsed() })
}

function beginActive() {
  activeStartedAt = Date.now()
}

function endActive() {
  report.activeInteractionSeconds += (Date.now() - activeStartedAt) / 1000
  activeStartedAt = 0
}

async function waitForPhase(page, phase, timeout = 35_000) {
  await page.locator(`[data-phase="${phase}"]`).waitFor({ timeout })
  mark(phase)
}

async function liveState(page) {
  return page.evaluate(() => {
    const state = window.__FELICIA_EVIDENCE__?.inspectRuntime().state
    return state
      ? {
          phase: state.phase,
          beat: state.trialBeat,
          sync: state.reconstructionSync,
        }
      : null
  })
}

async function moveHuman(page, x, y) {
  await page.mouse.move(x, y, { steps: 8 })
}

async function playTrial(page, fragment) {
  const button = page.getByRole('button', {
    name: new RegExp(`${fragment}, enter memory trial`, 'i'),
  })
  const buttonBounds = await button.boundingBox()
  if (buttonBounds) {
    await moveHuman(
      page,
      buttonBounds.x + buttonBounds.width / 2,
      buttonBounds.y + buttonBounds.height / 2,
    )
  }
  await page.waitForTimeout(450)
  await button.click()
  mark(`${fragment}-departure`)
  await waitForPhase(page, 'trial-active', 8_000)
  mark(`${fragment}-arrival`)
  beginActive()

  let announcedBeat = -1
  while (true) {
    const state = await liveState(page)
    if (!state || state.phase !== 'trial-active') break
    if (state.beat !== announcedBeat) {
      announcedBeat = state.beat
      mark(`${fragment}-beat-${state.beat + 1}`)
    }

    if (fragment === 'fear') {
      const direction = ['left', 'up', 'right'][state.beat]
      const shield = page.getByRole('button', {
        name: new RegExp(`${direction} shield`, 'i'),
      })
      const bounds = await shield.boundingBox()
      if (bounds) {
        await moveHuman(page, bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
        await shield.click({ timeout: 1_200 }).catch(() => undefined)
      }
    } else {
      const normalizedX = fragment === 'identity' ? 0 : [-0.39, 0.35, 0][state.beat]
      const x = ((normalizedX + 1) / 2) * 1440
      const y = 700 + Math.sin(Date.now() * 0.0012) * 16
      await moveHuman(page, x, y)
    }
    await page.waitForTimeout(460)
  }

  endActive()
  mark(`${fragment}-completion`)
  await page.locator('[data-phase="trial-returning"]').waitFor({ timeout: 5_000 })
  mark(`${fragment}-return`)
  await page
    .locator(
      '[data-phase="chamber"], [data-phase="ready-for-reconstruction"], [data-phase="reconstruction-synchronizing"]',
    )
    .first()
    .waitFor({ timeout: 8_000 })
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
startedAt = Date.now()

page.on('console', (message) => {
  const text = message.text()
  const harmless = text.includes('GL Driver Message') && text.includes('GPU stall')
  if (!harmless && ['warning', 'error'].includes(message.type())) {
    report.consoleIssues.push(`${message.type()}: ${text}`)
  }
})
page.on('pageerror', (error) => {
  report.consoleIssues.push(`pageerror: ${error.message}`)
})

await page.goto(baseURL, { waitUntil: 'domcontentloaded' })
await page.locator('.canvas-loading--hidden').waitFor({ timeout: 20_000 })
await page.evaluate(() => {
  const cursor = document.createElement('i')
  cursor.id = 'walkthrough-cursor'
  cursor.setAttribute('aria-hidden', 'true')
  document.body.append(cursor)
  const style = document.createElement('style')
  style.textContent = `
    #walkthrough-cursor {
      position: fixed;
      z-index: 80;
      width: 14px;
      height: 14px;
      margin: -7px 0 0 -7px;
      border: 1px solid rgb(240 232 243 / 82%);
      border-radius: 50%;
      box-shadow: 0 0 16px rgb(222 197 232 / 45%);
      pointer-events: none;
      transition: transform 120ms ease, background 120ms ease;
    }
    body:active #walkthrough-cursor {
      transform: scale(.72);
      background: rgb(236 226 240 / 34%);
    }
  `
  document.head.append(style)
  window.addEventListener('pointermove', (event) => {
    cursor.style.left = `${event.clientX}px`
    cursor.style.top = `${event.clientY}px`
  })
})
await page.waitForTimeout(1_400)
mark('intro-understood')
const enter = page.getByRole('button', { name: /enter memory/i })
const enterBounds = await enter.boundingBox()
if (enterBounds) {
  await moveHuman(
    page,
    enterBounds.x + enterBounds.width / 2,
    enterBounds.y + enterBounds.height / 2,
  )
}
await enter.click()
mark('felicia-first-pulse')
await page.waitForFunction(
  () => window.__FELICIA_EVIDENCE__?.startAudioCapture() === true,
  undefined,
  { timeout: 5_000 },
)
report.audioStartOffsetSeconds = elapsed()
await page
  .getByRole('button', { name: /fear, enter memory trial/i })
  .waitFor({ state: 'visible', timeout: 12_000 })
mark('awakening-settled')

for (const fragment of order) {
  await playTrial(page, fragment)
}

await page.getByRole('heading', { name: /memory set complete/i }).waitFor({
  state: 'visible',
  timeout: 5_000,
})
mark('memory-set-complete')
await waitForPhase(page, 'reconstruction-synchronizing', 5_000)
const sync = page.locator('.synchronization-interface button')
const syncBounds = await sync.boundingBox()
if (syncBounds) {
  await moveHuman(
    page,
    syncBounds.x + syncBounds.width / 2,
    syncBounds.y + syncBounds.height / 2,
  )
}
beginActive()
await page.mouse.down()
while ((await liveState(page))?.phase === 'reconstruction-synchronizing') {
  if (syncBounds) {
    await moveHuman(
      page,
      syncBounds.x + syncBounds.width * (0.46 + Math.sin(Date.now() * 0.001) * 0.08),
      syncBounds.y + syncBounds.height / 2,
    )
  }
  await page.waitForTimeout(520)
}
await page.mouse.up()
endActive()
mark('synchronization-complete')
report.passiveAnimationStartSeconds = elapsed()
await waitForPhase(page, 'ending', 25_000)
report.passiveAnimationSeconds = elapsed() - report.passiveAnimationStartSeconds

beginActive()
for (let index = 0; index < 10; index += 1) {
  await moveHuman(
    page,
    720 + Math.sin(index * 0.72) * 280,
    440 + Math.cos(index * 0.58) * 120,
  )
  await page.waitForTimeout(700)
}
endActive()
await page.getByText(/fear became the foundation/i).waitFor({
  state: 'visible',
  timeout: 6_000,
})
await page.getByRole('button', { name: /reenter memory/i }).waitFor({
  state: 'visible',
  timeout: 12_000,
})
mark('ending-explored-and-explained')
await page.waitForTimeout(2_000)

const audioBase64 = await page.evaluate(
  () => window.__FELICIA_EVIDENCE__?.stopAudioCapture() ?? Promise.resolve(''),
)
await writeFile(
  resolve(output, 'felicia-phase7-browser-audio.webm'),
  Buffer.from(audioBase64, 'base64'),
)
const video = page.video()
await context.close()
await video?.saveAs(resolve(output, 'felicia-phase7-first-time-walkthrough-video.webm'))
await browser.close()

report.durationSeconds = elapsed()
report.activeInteractionSeconds = Number(report.activeInteractionSeconds.toFixed(2))
report.passiveAnimationSeconds = Number(report.passiveAnimationSeconds.toFixed(2))
await writeFile(
  resolve(output, 'felicia-phase7-walkthrough-diagnostics.json'),
  JSON.stringify(report, null, 2),
)
console.log(JSON.stringify(report, null, 2))
