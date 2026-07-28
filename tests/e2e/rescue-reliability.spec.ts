import { expect, test, type Page } from '@playwright/test'

type Fragment = 'identity' | 'fear' | 'hope'

const orders: Array<[Fragment, Fragment, Fragment]> = [
  ['identity', 'fear', 'hope'],
  ['identity', 'hope', 'fear'],
  ['fear', 'identity', 'hope'],
  ['fear', 'hope', 'identity'],
  ['hope', 'identity', 'fear'],
  ['hope', 'fear', 'identity'],
]

async function collect(page: Page, fragment: Fragment, final: boolean) {
  const control = page.getByRole('button', {
    name: new RegExp(`${fragment}, available`, 'i'),
  })
  await control.click()
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-phase',
    /approaching-fragment|revealing-fragment/,
  )
  await expect(page.getByRole('button', { name: /continue/i })).toBeEnabled({
    timeout: 6_000,
  })
  await page.getByRole('button', { name: /continue/i }).click()
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-phase',
    final ? 'ready-for-reconstruction' : 'chamber',
    { timeout: 6_000 },
  )
}

test.describe('twenty independently reported rescue journeys', () => {
  test.describe.configure({ mode: 'parallel' })
  for (let journey = 0; journey < 20; journey += 1) {
    test(`journey ${journey + 1} resolves ${orders[journey % orders.length].join(
      '-',
    )}`, async ({ page }) => {
      test.setTimeout(60_000)
      const order = orders[journey % orders.length]
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/')
      await expect(page.locator('.canvas-loading')).toHaveClass(/canvas-loading--hidden/)
      await page.getByRole('button', { name: /enter memory/i }).click()
      const shell = page.locator('.experience-shell')
      await expect(shell).toHaveAttribute('data-phase', 'chamber')

      for (const [index, fragment] of order.entries()) {
        await collect(page, fragment, index === 2)
      }

      const reconstruction = page.getByRole('button', {
        name: /complete reconstruction/i,
      })
      await reconstruction.evaluate((button) => {
        button.click()
        button.click()
      })
      await expect(shell).toHaveAttribute('data-phase', 'ending', {
        timeout: 12_000,
      })
      await expect(shell).toHaveAttribute('data-ending-profile', order[0])
      const replay = page.getByRole('button', { name: /reenter memory/i })
      await expect(replay).toBeEnabled({ timeout: 5_000 })
      await replay.click()
      await expect(shell).toHaveAttribute('data-phase', 'chamber', {
        timeout: 5_000,
      })
      await expect(shell).toHaveAttribute('data-input-locked', 'false')
      await expect(shell).toHaveAttribute('data-ambient-start-count', '1')
      await expect(
        page.getByRole('button', { name: /identity, available/i }),
      ).toBeEnabled()
    })
  }
})

test('rapid competing input and resize during approach settle to one memory', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('.canvas-loading')).toHaveClass(/canvas-loading--hidden/)
  await page.getByRole('button', { name: /enter memory/i }).click()

  await page.evaluate(() => {
    const buttons = [...document.querySelectorAll<HTMLButtonElement>('[data-fragment]')]
    buttons.forEach((button) => {
      button.click()
      button.click()
    })
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.setViewportSize({ width: 844, height: 390 })
  await page.setViewportSize({ width: 390, height: 844 })

  await expect(page.getByRole('button', { name: /continue/i })).toBeEnabled({
    timeout: 6_000,
  })
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-active-fragment',
    'identity',
  )
  await page.getByRole('button', { name: /continue/i }).click()
  await expect(page.locator('.experience-shell')).toHaveAttribute('data-phase', 'chamber')
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-input-locked',
    'false',
  )
})

test('three consecutive replay cycles remain deterministic in one page', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('.canvas-loading')).toHaveClass(/canvas-loading--hidden/)
  await page.getByRole('button', { name: /enter memory/i }).click()
  const shell = page.locator('.experience-shell')

  for (const order of orders.slice(0, 3)) {
    for (const [index, fragment] of order.entries()) {
      await collect(page, fragment, index === 2)
    }
    await page.getByRole('button', { name: /complete reconstruction/i }).click()
    await expect(shell).toHaveAttribute('data-phase', 'ending', {
      timeout: 12_000,
    })
    await expect(shell).toHaveAttribute('data-ending-profile', order[0])
    const replay = page.getByRole('button', { name: /reenter memory/i })
    await expect(replay).toBeEnabled({ timeout: 5_000 })
    await replay.click()
    await expect(shell).toHaveAttribute('data-phase', 'chamber')
    await expect(shell).toHaveAttribute('data-ambient-start-count', '1')
    await expect(shell).toHaveAttribute('data-input-locked', 'false')
  }
})
