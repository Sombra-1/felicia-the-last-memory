import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4174'
const output = resolve(process.env.SPECTACLE_VIDEO_DIR ?? 'docs/evidence/phase6.7/video')
const rawVideo = resolve(output, 'felicia-phase67-walkthrough-video.webm')
const diagnosticsPath = resolve(output, 'felicia-phase67-walkthrough-diagnostics.json')

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

async function collect(page, fragment, final = false) {
  const fragmentControl = page.locator(`[data-fragment="${fragment}"]`)
  await fragmentControl.waitFor({ state: 'visible', timeout: 10_000 })
  await fragmentControl.click()
  const continueButton = page.getByRole('button', { name: /continue/i })
  await continueButton.waitFor({ state: 'visible', timeout: 10_000 })
  await page.waitForTimeout(4_200)
  await continueButton.click()
  await waitForPhase(page, final ? 'ready-for-reconstruction' : 'chamber')
  await page.waitForTimeout(1_800)
}

await mkdir(output, { recursive: true })
const browser = await chromium.launch({
  headless: false,
  args: ['--autoplay-policy=user-gesture-required'],
})
const context = await browser.newContext({
  colorScheme: 'dark',
  viewport: { width: 1440, height: 900 },
  recordVideo: {
    dir: output,
    size: { width: 1440, height: 900 },
  },
})
const page = await context.newPage()
const consoleIssues = []
const audioCheckpoints = []

page.on('console', (message) => {
  const text = message.text()
  const harmlessReadback =
    text.includes('GL Driver Message') && text.includes('GPU stall due to ReadPixels')
  if (!harmlessReadback && (message.type() === 'warning' || message.type() === 'error')) {
    consoleIssues.push(`${message.type()}: ${text}`)
  }
})
page.on('pageerror', (error) => consoleIssues.push(`pageerror: ${error.message}`))

function checkpoint(label) {
  return page.locator('.experience-shell').evaluate((shell, checkpointLabel) => {
    return {
      label: checkpointLabel,
      phase: shell.getAttribute('data-phase'),
      audioStatus: shell.getAttribute('data-audio-status'),
      audioEnabled: shell.getAttribute('data-audio-enabled'),
      audioEvent: shell.getAttribute('data-last-audio-event'),
      ambientStarts: shell.getAttribute('data-ambient-start-count'),
    }
  }, label)
}

await waitForCanvas(page)
await page.waitForTimeout(2_800)
await page.getByRole('button', { name: /enter memory/i }).click()
await waitForPhase(page, 'chamber')
await page.waitForTimeout(5_200)
audioCheckpoints.push(await checkpoint('awakening-complete'))

await collect(page, 'identity')
audioCheckpoints.push(await checkpoint('identity-returned'))
await collect(page, 'fear')
audioCheckpoints.push(await checkpoint('fear-returned'))
await collect(page, 'hope', true)
audioCheckpoints.push(await checkpoint('hope-returned'))

await page.getByRole('button', { name: /complete reconstruction/i }).click()
await waitForPhase(page, 'reconstruction-collapse')
audioCheckpoints.push(await checkpoint('collapse'))
await waitForPhase(page, 'reconstruction-void')
audioCheckpoints.push(await checkpoint('void'))
await waitForPhase(page, 'reconstruction-rebuilding', 12_000)
audioCheckpoints.push(await checkpoint('rebuilding'))
await waitForPhase(page, 'ending', 12_000)
audioCheckpoints.push(await checkpoint('tableau'))

const replay = page.getByRole('button', { name: /reenter memory/i })
await replay.waitFor({ state: 'visible', timeout: 9_000 })
audioCheckpoints.push(await checkpoint('replay-available'))
await page.waitForTimeout(8_000)
await replay.click()
await waitForPhase(page, 'chamber')
audioCheckpoints.push(await checkpoint('replayed'))
await page.waitForTimeout(2_500)

const video = page.video()
await context.close()
await video?.saveAs(rawVideo)
await browser.close()

await writeFile(
  diagnosticsPath,
  JSON.stringify({ baseURL, consoleIssues, audioCheckpoints }, null, 2),
)
console.log(JSON.stringify({ rawVideo, diagnosticsPath, consoleIssues }, null, 2))
