import { expect, test, type Page } from '@playwright/test'

type Fragment = 'identity' | 'fear' | 'hope'

async function collect(page: Page, fragment: Fragment, final = false) {
  await page
    .getByRole('button', { name: new RegExp(`${fragment}, available`, 'i') })
    .click()
  await expect(page.getByRole('button', { name: /continue/i })).toBeVisible({
    timeout: 6_000,
  })
  await page.getByRole('button', { name: /continue/i }).click()
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-phase',
    final ? 'ready-for-reconstruction' : 'chamber',
    { timeout: 6_000 },
  )
}

test('complete Hope-first journey, sound lifecycle, focus, and replay', async ({
  browserName,
  page,
}) => {
  test.setTimeout(60_000)
  const problems: string[] = []
  page.on('pageerror', (error) => problems.push(error.message))
  page.on('console', (message) => {
    const text = message.text()
    const harmlessReadbackNotice =
      text.includes('GL Driver Message') && text.includes('GPU stall due to ReadPixels')
    if (
      !harmlessReadbackNotice &&
      (message.type() === 'error' || message.type() === 'warning')
    ) {
      problems.push(`${message.type()}: ${text}`)
    }
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1024, height: 768 })
  await page.goto('/')
  await expect(page.locator('.canvas-loading')).toHaveClass(/canvas-loading--hidden/)
  await page.getByRole('button', { name: /enter memory/i }).click()
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-audio-status',
    /running|suspended/,
  )
  await expect(page.getByRole('button', { name: /identity, available/i })).toBeFocused()

  await collect(page, 'hope')
  await collect(page, 'fear')
  await collect(page, 'identity', true)
  await page.getByRole('button', { name: /complete reconstruction/i }).click()
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-phase',
    'ending',
    { timeout: 10_000 },
  )
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-ending-profile',
    'hope',
  )
  const replay = page.getByRole('button', { name: /reenter memory/i })
  await expect(replay).toBeFocused({ timeout: 4_000 })
  await replay.click()
  await expect(page.locator('.experience-shell')).toHaveAttribute('data-phase', 'chamber')
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-ambient-start-count',
    '1',
  )
  await expect(page.locator('body')).toHaveCSS(
    'font-family',
    /Avenir|Segoe UI|Helvetica|system-ui/,
  )

  expect(problems, `${browserName} console`).toEqual([])
})
