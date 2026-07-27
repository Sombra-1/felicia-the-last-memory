import { expect, test, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const evidenceDirectory = resolve('docs/evidence')

async function collectRuntimeProblems(page: Page) {
  const problems: string[] = []
  page.on('console', (message) => {
    const text = message.text()
    const isScreenshotDriverNotice =
      text.includes('GL Driver Message') && text.includes('GPU stall due to ReadPixels')

    if (isScreenshotDriverNotice) return
    if (message.type() === 'error' || message.type() === 'warning') {
      problems.push(`${message.type()}: ${text}`)
    }
  })
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))
  return problems
}

for (const viewport of [
  { name: 'desktop-1440x900', width: 1440, height: 900 },
  { name: 'desktop-1366x768', width: 1366, height: 768 },
  { name: 'tablet-1024x768', width: 1024, height: 768 },
  { name: 'tablet-768x1024', width: 768, height: 1024 },
  { name: 'mobile-430x932', width: 430, height: 932 },
  { name: 'mobile-390x844', width: 390, height: 844 },
  { name: 'mobile-360x800', width: 360, height: 800 },
]) {
  test(`${viewport.name} renders the complete composition without runtime problems`, async ({
    page,
  }) => {
    const problems = await collectRuntimeProblems(page)
    await page.setViewportSize(viewport)
    await page.goto('/')

    await expect(page.locator('canvas')).toBeVisible()
    await expect(page.locator('.canvas-loading')).toHaveClass(/canvas-loading--hidden/)
    await expect(page.locator('.fragment-label')).toHaveCount(3)
    const safeAreaVariables = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement)
      return [
        styles.getPropertyValue('--safe-top'),
        styles.getPropertyValue('--safe-right'),
        styles.getPropertyValue('--safe-bottom'),
        styles.getPropertyValue('--safe-left'),
      ]
    })
    expect(safeAreaVariables.every((value) => value.trim().length > 0)).toBe(true)

    for (const label of await page.locator('.fragment-label').all()) {
      await expect(label).toBeVisible()
      const bounds = await label.boundingBox()
      expect(bounds).not.toBeNull()
      expect(bounds!.x + bounds!.width).toBeGreaterThan(0)
      expect(bounds!.x).toBeLessThan(viewport.width)
      expect(bounds!.y + bounds!.height).toBeGreaterThan(0)
      expect(bounds!.y).toBeLessThan(viewport.height)
    }

    await page.waitForTimeout(900)
    await expect(page.locator('html')).toHaveAttribute('data-scene-draw-calls', /\d+/)
    const drawCalls = Number(
      await page.locator('html').getAttribute('data-scene-draw-calls'),
    )
    const triangles = Number(
      await page.locator('html').getAttribute('data-scene-triangles'),
    )
    expect(drawCalls).toBeGreaterThan(0)
    expect(drawCalls).toBeLessThan(64)
    console.log(`${viewport.name}: ${drawCalls} draw calls, ${triangles} triangles`)

    await mkdir(evidenceDirectory, { recursive: true })
    await page.screenshot({
      path: resolve(evidenceDirectory, `${viewport.name}.png`),
      fullPage: true,
    })

    expect(problems).toEqual([])
  })
}

test('reduced motion and low quality preferences reach the rendered experience', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      configurable: true,
      get: () => 2,
    })
    Object.defineProperty(navigator, 'deviceMemory', {
      configurable: true,
      get: () => 2,
    })
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-reduced-motion',
    'true',
  )
  await expect(page.locator('.experience-shell')).toHaveAttribute('data-quality', 'low')
  await expect(page.locator('.canvas-loading')).toHaveClass(/canvas-loading--hidden/)
})
