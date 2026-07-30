import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173'
const output = resolve(
  process.env.SPECTACLE_REFINEMENT_VIDEO_DIR ?? 'docs/evidence/phase6.7.1/video',
)
const rawVideo = resolve(output, 'felicia-phase671-walkthrough-video.webm')
const rawAudio = resolve(output, 'felicia-phase671-browser-audio.wav')
const finalVideo = resolve(output, 'felicia-phase671-walkthrough.webm')
const diagnosticsPath = resolve(output, 'felicia-phase671-walkthrough-diagnostics.json')
const audioSource =
  process.env.FELICIA_AUDIO_SOURCE ??
  'alsa_output.pci-0000_00_1f.3-platform-skl_hda_dsp_generic.HiFi__Speaker__sink.monitor'

function run(command, args) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, { stdio: ['ignore', 'ignore', 'pipe'] })
    let errorOutput = ''
    child.stderr.on('data', (chunk) => {
      errorOutput += chunk.toString()
    })
    child.on('error', rejectRun)
    child.on('exit', (code) => {
      if (code === 0) resolveRun()
      else rejectRun(new Error(`${command} exited ${code}: ${errorOutput}`))
    })
  })
}

function startAudioCapture() {
  const child = spawn(
    'ffmpeg',
    [
      '-y',
      '-hide_banner',
      '-loglevel',
      'error',
      '-f',
      'pulse',
      '-i',
      audioSource,
      '-ac',
      '2',
      '-ar',
      '48000',
      '-c:a',
      'pcm_s16le',
      rawAudio,
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  )
  let errorOutput = ''
  child.stderr.on('data', (chunk) => {
    errorOutput += chunk.toString()
  })
  return {
    child,
    error: () => errorOutput,
  }
}

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
  await page.waitForTimeout(6_400)
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
const audioCapture = startAudioCapture()
const audioStartedAt = performance.now()
await new Promise((resolveDelay) => setTimeout(resolveDelay, 400))
const page = await context.newPage()
const audioLeadSeconds = (performance.now() - audioStartedAt) / 1000
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
await page.waitForTimeout(3_200)
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
await waitForPhase(page, 'reconstruction-recall')
audioCheckpoints.push(await checkpoint('ordered-recall'))
await waitForPhase(page, 'reconstruction-rebuilding', 12_000)
audioCheckpoints.push(await checkpoint('rebuilding'))
await waitForPhase(page, 'ending', 12_000)
audioCheckpoints.push(await checkpoint('tableau'))

const replay = page.getByRole('button', { name: /reenter memory/i })
await replay.waitFor({ state: 'visible', timeout: 8_000 })
audioCheckpoints.push(await checkpoint('replay-available'))
await page.waitForTimeout(4_500)
await replay.click()
await waitForPhase(page, 'chamber')
audioCheckpoints.push(await checkpoint('replayed'))
await page.waitForTimeout(2_500)

const video = page.video()
await context.close()
audioCapture.child.kill('SIGINT')
const audioExitCode = await new Promise((resolveExit) => {
  audioCapture.child.once('exit', (code) => resolveExit(code))
})
if (audioExitCode !== 0 && audioExitCode !== 255) {
  throw new Error(
    `Browser audio capture exited ${audioExitCode}: ${audioCapture.error()}`,
  )
}
await video?.saveAs(rawVideo)
await browser.close()

await run('ffmpeg', [
  '-y',
  '-hide_banner',
  '-loglevel',
  'error',
  '-i',
  rawVideo,
  '-ss',
  audioLeadSeconds.toFixed(3),
  '-i',
  rawAudio,
  '-map',
  '0:v:0',
  '-map',
  '1:a:0',
  '-c:v',
  'copy',
  '-c:a',
  'libopus',
  '-b:a',
  '160k',
  '-shortest',
  finalVideo,
])
await Promise.all([unlink(rawVideo), unlink(rawAudio)])

await writeFile(
  diagnosticsPath,
  JSON.stringify(
    {
      baseURL,
      finalVideo: 'video/felicia-phase671-walkthrough.webm',
      audioSource,
      audioLeadSeconds,
      consoleIssues,
      audioCheckpoints,
    },
    null,
    2,
  ),
)
console.log(
  JSON.stringify(
    { finalVideo, rawVideo, rawAudio, diagnosticsPath, consoleIssues },
    null,
    2,
  ),
)
