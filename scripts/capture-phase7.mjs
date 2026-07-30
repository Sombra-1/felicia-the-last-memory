import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173'
const output = resolve(process.env.PHASE7_EVIDENCE_DIR ?? 'docs/evidence/phase7')
const desktop = { width: 1440, height: 900 }
const captures = []
const consoleIssues = []
const metrics = []

async function prepare(page) {
  page.on('console', (message) => {
    const text = message.text()
    const harmlessReadback =
      text.includes('GL Driver Message') && text.includes('GPU stall')
    if (!harmlessReadback && ['warning', 'error'].includes(message.type())) {
      consoleIssues.push(`${message.type()}: ${text}`)
    }
  })
  page.on('pageerror', (error) => consoleIssues.push(`pageerror: ${error.message}`))
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' })
  await page.locator('.canvas-loading--hidden').waitFor({ timeout: 20_000 })
  await page.addStyleTag({
    content: 'html, body, button, canvas { cursor: none !important; }',
  })
  await page.waitForFunction(() => Boolean(window.__FELICIA_EVIDENCE__))
}

async function capture(page, filename) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  })
  await page.waitForTimeout(500)
  await page.screenshot({ path: resolve(output, filename), fullPage: true })
  captures.push(filename)
  metrics.push({
    filename,
    phase: await page.locator('.experience-shell').getAttribute('data-phase'),
    drawCalls: Number(await page.locator('html').getAttribute('data-scene-draw-calls')),
    triangles: Number(await page.locator('html').getAttribute('data-scene-triangles')),
  })
}

await mkdir(output, { recursive: true })
const browser = await chromium.launch()
const desktopContext = await browser.newContext({ viewport: desktop })
const page = await desktopContext.newPage()
await prepare(page)

await page.getByRole('button', { name: /enter memory/i }).click()
await page
  .getByRole('button', { name: /identity, enter memory trial/i })
  .waitFor({ state: 'visible', timeout: 12_000 })
await capture(page, '01-awakening-hero.png')

await page.evaluate(() =>
  window.__FELICIA_EVIDENCE__?.holdTrial('identity', 'arrival', 0, []),
)
await capture(page, '02-identity-arrival.png')
await page.evaluate(() =>
  window.__FELICIA_EVIDENCE__?.holdTrial('identity', 'interaction', 1, []),
)
await capture(page, '03-identity-active-alignment.png')
await page.evaluate(() =>
  window.__FELICIA_EVIDENCE__?.holdTrial('identity', 'completion', 2, []),
)
await capture(page, '04-identity-completion.png')

await page.evaluate(() =>
  window.__FELICIA_EVIDENCE__?.holdTrial('fear', 'arrival', 0, ['identity']),
)
await capture(page, '05-fear-arrival.png')
await page.evaluate(() =>
  window.__FELICIA_EVIDENCE__?.holdTrial('fear', 'incoming', 1, ['identity']),
)
await capture(page, '06-incoming-shutdown-pulse.png')
await page.evaluate(() =>
  window.__FELICIA_EVIDENCE__?.holdTrial('fear', 'impact', 1, ['identity']),
)
await capture(page, '07-shield-impact.png')
await page.evaluate(() =>
  window.__FELICIA_EVIDENCE__?.holdTrial('fear', 'completion', 2, ['identity']),
)
await capture(page, '08-fear-completion.png')

await page.evaluate(() =>
  window.__FELICIA_EVIDENCE__?.holdTrial('hope', 'arrival', 0, ['identity', 'fear']),
)
await capture(page, '09-hope-arrival.png')
await page.evaluate(() =>
  window.__FELICIA_EVIDENCE__?.holdTrial('hope', 'interaction', 1, ['identity', 'fear']),
)
await capture(page, '10-guided-signal-trail.png')
await page.evaluate(() =>
  window.__FELICIA_EVIDENCE__?.holdTrial('hope', 'gate-opening', 2, ['identity', 'fear']),
)
await capture(page, '11-organic-gate-opening.png')
await page.evaluate(() =>
  window.__FELICIA_EVIDENCE__?.holdTrial('hope', 'completion', 2, ['identity', 'fear']),
)
await capture(page, '12-hope-completion.png')

await page.evaluate(() =>
  window.__FELICIA_EVIDENCE__?.holdChamber(['identity', 'fear', 'hope']),
)
await capture(page, '13-chamber-integrated-consequences.png')
await page.evaluate(() =>
  window.__FELICIA_EVIDENCE__?.holdSynchronization(['fear', 'hope', 'identity'], 0.64),
)
await capture(page, '14-active-synchronization.png')
await page.evaluate(() =>
  window.__FELICIA_EVIDENCE__?.holdSignature(['fear', 'hope', 'identity'], 0.76),
)
await capture(page, '15-signature-transformation.png')

for (const [foundation, order, filename] of [
  ['identity', ['identity', 'fear', 'hope'], '16-identity-consciousness.png'],
  ['fear', ['fear', 'hope', 'identity'], '17-fear-consciousness.png'],
  ['hope', ['hope', 'identity', 'fear'], '18-hope-consciousness.png'],
]) {
  await page.evaluate(
    ({ order }) => {
      window.__FELICIA_EVIDENCE__?.holdEnding(order)
    },
    { foundation, order },
  )
  await capture(page, filename)
}

await desktopContext.close()

const mobileContext = await browser.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
})
const mobile = await mobileContext.newPage()
await prepare(mobile)
await mobile.evaluate(() =>
  window.__FELICIA_EVIDENCE__?.holdTrial('hope', 'interaction', 1, ['fear']),
)
await capture(mobile, '19-mobile-trial.png')
await mobile.evaluate(() =>
  window.__FELICIA_EVIDENCE__?.holdEnding(['hope', 'identity', 'fear']),
)
await capture(mobile, '20-mobile-ending.png')
await mobileContext.close()
await browser.close()

const report = { baseURL, output, captures, metrics, consoleIssues }
await writeFile(
  resolve(output, 'capture-diagnostics.json'),
  JSON.stringify(report, null, 2),
)
console.log(JSON.stringify(report, null, 2))
