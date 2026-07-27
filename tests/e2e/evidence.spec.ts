import { expect, test, type Browser, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

type Fragment = 'identity' | 'fear' | 'hope'
const evidenceDirectory = resolve('docs/evidence/phase5')

async function clearFocus(page: Page) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    window.scrollTo(0, 0)
  })
}

async function enter(page: Page) {
  await page.goto('/')
  await expect(page.locator('.canvas-loading')).toHaveClass(/canvas-loading--hidden/)
  await page.getByRole('button', { name: /enter memory/i }).click()
  await expect(page.locator('.experience-shell')).toHaveAttribute('data-phase', 'chamber')
}

async function reveal(page: Page, fragment: Fragment) {
  await page
    .getByRole('button', { name: new RegExp(`${fragment}, available`, 'i') })
    .click()
  await expect(page.getByRole('button', { name: /continue/i })).toBeVisible({
    timeout: 8_000,
  })
}

async function finishReveal(page: Page, final = false) {
  await page.getByRole('button', { name: /continue/i }).click()
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-phase',
    final ? 'ready-for-reconstruction' : 'chamber',
    { timeout: 8_000 },
  )
}

test('capture calibrated candidate screenshots at clean authored stages', async ({
  page,
}) => {
  test.setTimeout(150_000)
  await mkdir(evidenceDirectory, { recursive: true })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1440, height: 900 })
  await enter(page)
  await clearFocus(page)
  await page.screenshot({
    path: resolve(evidenceDirectory, '01-initial-chamber.png'),
    fullPage: true,
  })

  await reveal(page, 'hope')
  await clearFocus(page)
  await page.screenshot({
    path: resolve(evidenceDirectory, '02-hope-reveal.png'),
    fullPage: true,
  })
  await finishReveal(page)
  await reveal(page, 'fear')
  await clearFocus(page)
  await page.screenshot({
    path: resolve(evidenceDirectory, '03-fear-reveal.png'),
    fullPage: true,
  })
  await finishReveal(page)
  await reveal(page, 'identity')
  await clearFocus(page)
  await page.screenshot({
    path: resolve(evidenceDirectory, '04-identity-reveal.png'),
    fullPage: true,
  })
  await finishReveal(page, true)

  await page.evaluate(() =>
    window.__FELICIA_EVIDENCE__?.holdStage('reconstruction-collapse'),
  )
  await clearFocus(page)
  await page.screenshot({
    path: resolve(evidenceDirectory, '05-reconstruction-collapse.png'),
    fullPage: true,
  })
  await page.evaluate(() =>
    window.__FELICIA_EVIDENCE__?.holdStage('reconstruction-recall'),
  )
  await clearFocus(page)
  await page.screenshot({
    path: resolve(evidenceDirectory, '06-ordered-recall.png'),
    fullPage: true,
  })

  const endings: Array<{
    name: string
    order: [Fragment, Fragment, Fragment]
  }> = [
    { name: '07-identity-first-ending.png', order: ['identity', 'fear', 'hope'] },
    { name: '08-fear-first-ending.png', order: ['fear', 'identity', 'hope'] },
    { name: '09-hope-first-ending.png', order: ['hope', 'fear', 'identity'] },
  ]
  for (const ending of endings) {
    await page.evaluate(
      (order) => window.__FELICIA_EVIDENCE__?.holdEnding(order),
      ending.order,
    )
    await clearFocus(page)
    await page.screenshot({
      path: resolve(evidenceDirectory, ending.name),
      fullPage: true,
    })
  }
})

test('capture a calibrated mobile ending', async ({ page }) => {
  await mkdir(evidenceDirectory, { recursive: true })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 430, height: 932 })
  await enter(page)
  await page.evaluate(() =>
    window.__FELICIA_EVIDENCE__?.holdEnding(['hope', 'fear', 'identity']),
  )
  await expect(page.getByRole('button', { name: /reenter memory/i })).toBeVisible()
  await clearFocus(page)
  await page.screenshot({
    path: resolve(evidenceDirectory, '10-mobile-hope-ending.png'),
    fullPage: true,
  })
})

async function recordWalkthrough(browser: Browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: evidenceDirectory,
      size: { width: 1440, height: 900 },
    },
  })
  const page = await context.newPage()
  await enter(page)
  for (const [index, fragment] of (
    ['hope', 'fear', 'identity'] as Fragment[]
  ).entries()) {
    await reveal(page, fragment)
    await page.waitForTimeout(1_500)
    await finishReveal(page, index === 2)
  }
  await page.getByRole('button', { name: /complete reconstruction/i }).click()
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-phase',
    'ending',
    { timeout: 25_000 },
  )
  await expect(page.getByRole('button', { name: /reenter memory/i })).toBeEnabled({
    timeout: 5_000,
  })
  await page.waitForTimeout(2_000)
  await page.getByRole('button', { name: /reenter memory/i }).click()
  await expect(page.locator('.experience-shell')).toHaveAttribute('data-phase', 'chamber')
  await page.waitForTimeout(1_000)
  const video = page.video()
  await context.close()
  await video?.saveAs(resolve(evidenceDirectory, 'hope-first-walkthrough.webm'))
}

test('record a clean Hope, Fear, Identity walkthrough', async ({ browser }) => {
  test.setTimeout(120_000)
  await mkdir(evidenceDirectory, { recursive: true })
  await recordWalkthrough(browser)
})
