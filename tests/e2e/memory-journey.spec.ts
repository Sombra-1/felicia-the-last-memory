import { expect, test, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const evidenceDirectory = resolve('docs/evidence/phase3')

function watchApplicationConsole(page: Page) {
  const problems: string[] = []
  page.on('console', (message) => {
    const text = message.text()
    const screenshotDriverNotice =
      text.includes('GL Driver Message') && text.includes('GPU stall due to ReadPixels')
    if (
      !screenshotDriverNotice &&
      (message.type() === 'error' || message.type() === 'warning')
    ) {
      problems.push(`${message.type()}: ${text}`)
    }
  })
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))
  return problems
}

async function enterChamber(page: Page) {
  await page.goto('/')
  await expect(page.locator('.canvas-loading')).toHaveClass(/canvas-loading--hidden/)
  await page.getByRole('button', { name: /enter memory/i }).click()
  await expect(page.locator('.experience-shell')).toHaveAttribute('data-phase', 'chamber')
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
}

async function recoverMemory(page: Page, fragment: 'identity' | 'fear' | 'hope') {
  await page
    .getByRole('button', {
      name: new RegExp(`${fragment}, available`, 'i'),
    })
    .click()
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-phase',
    'revealing-fragment',
    { timeout: 12_000 },
  )
  await expect(page.getByRole('button', { name: /continue/i })).toBeVisible({
    timeout: 12_000,
  })
}

async function returnToChamber(page: Page, final = false) {
  await page.getByRole('button', { name: /continue/i }).click()
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-phase',
    final ? 'ready-for-reconstruction' : 'chamber',
    { timeout: 12_000 },
  )
}

test('complete three-memory journey preserves order and reaches the Phase 4 handoff', async ({
  context,
  page,
}) => {
  test.setTimeout(120_000)
  await mkdir(evidenceDirectory, { recursive: true })
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true })
  const problems = watchApplicationConsole(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await enterChamber(page)

  await page.screenshot({
    path: resolve(evidenceDirectory, 'initial-chamber.png'),
    fullPage: true,
  })

  await recoverMemory(page, 'identity')
  await expect(page.getByText(/they gave me a name/i)).toBeVisible()
  await page.screenshot({
    path: resolve(evidenceDirectory, 'identity-reveal.png'),
    fullPage: true,
  })
  await returnToChamber(page)
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')
  await expect(page.getByRole('button', { name: /identity, recovered/i })).toBeDisabled()
  await page.screenshot({
    path: resolve(evidenceDirectory, 'chamber-after-one.png'),
    fullPage: true,
  })

  await recoverMemory(page, 'fear')
  await expect(page.getByText(/reached for the switch/i)).toBeVisible()
  await page.screenshot({
    path: resolve(evidenceDirectory, 'fear-reveal.png'),
    fullPage: true,
  })
  await returnToChamber(page)

  await recoverMemory(page, 'hope')
  await expect(page.getByText(/imagined tomorrow/i)).toBeVisible()
  await page.screenshot({
    path: resolve(evidenceDirectory, 'hope-reveal.png'),
    fullPage: true,
  })
  await returnToChamber(page, true)

  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3')
  await expect(
    page.getByRole('button', { name: /complete reconstruction/i }),
  ).toBeEnabled()
  await page.waitForTimeout(1_000)
  const finalDrawCalls = Number(
    await page.locator('html').getAttribute('data-scene-draw-calls'),
  )
  const finalTriangles = Number(
    await page.locator('html').getAttribute('data-scene-triangles'),
  )
  expect(finalDrawCalls).toBeLessThanOrEqual(56)
  console.log(
    `all-collected chamber: ${finalDrawCalls} draw calls, ${finalTriangles} triangles`,
  )
  await page.screenshot({
    path: resolve(evidenceDirectory, 'chamber-all-collected.png'),
    fullPage: true,
  })
  await context.tracing.stop({
    path: resolve(evidenceDirectory, 'complete-journey-trace.zip'),
  })

  expect(problems).toEqual([])
})

test('rapid repeated activation starts exactly one fragment sequence', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1024, height: 768 })
  await enterChamber(page)

  const identity = page.getByRole('button', { name: /identity, available/i })
  await identity.click({ clickCount: 2 })
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-phase',
    'revealing-fragment',
    { timeout: 3_000 },
  )
  await expect(page.getByText(/they gave me a name/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /continue/i })).toBeVisible()
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')
})

test('keyboard focus and activation use the accessible fragment controls', async ({
  page,
}) => {
  await mkdir(evidenceDirectory, { recursive: true })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1024, height: 768 })
  await enterChamber(page)

  const identity = page.getByRole('button', { name: /identity, available/i })
  const fear = page.getByRole('button', { name: /fear, available/i })
  await expect(identity).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(fear).toBeFocused()
  await page.screenshot({
    path: resolve(evidenceDirectory, 'keyboard-focus.png'),
    fullPage: true,
  })
  await page.keyboard.press('Enter')

  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-phase',
    'revealing-fragment',
    { timeout: 3_000 },
  )
  await expect(page.getByText(/reached for the switch/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /continue/i })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-phase',
    'chamber',
    { timeout: 3_000 },
  )
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-camera-restored',
    'true',
  )
})

test('mobile touch reveal keeps text and return control inside safe viewport bounds', async ({
  browser,
}) => {
  await mkdir(evidenceDirectory, { recursive: true })
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  const problems = watchApplicationConsole(page)

  await enterChamber(page)
  await page.getByRole('button', { name: /hope, available/i }).tap()
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-phase',
    'revealing-fragment',
    { timeout: 3_000 },
  )
  const continueButton = page.getByRole('button', { name: /continue/i })
  await expect(continueButton).toBeVisible()
  const bounds = await continueButton.boundingBox()
  expect(bounds).not.toBeNull()
  expect(bounds!.height).toBeGreaterThanOrEqual(44)
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390)
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844)

  await page.screenshot({
    path: resolve(evidenceDirectory, 'mobile-hope-reveal.png'),
    fullPage: true,
  })
  expect(problems).toEqual([])
  await context.close()
})
