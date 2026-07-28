import { expect, test, type Page } from '@playwright/test'

type Fragment = 'identity' | 'fear' | 'hope'

async function enter(page: Page) {
  await page.goto('/')
  await expect(page.locator('.canvas-loading')).toHaveClass(/canvas-loading--hidden/)
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-audio-status',
    'idle',
  )
  await expect(page.getByRole('button', { name: /ambient sound/i })).toHaveCount(0)
  await page.getByRole('button', { name: /enter memory/i }).click()
  await expect(page.locator('.experience-shell')).toHaveAttribute('data-phase', 'chamber')
}

async function collect(page: Page, fragment: Fragment, final = false) {
  await page
    .getByRole('button', { name: new RegExp(`${fragment}, available`, 'i') })
    .click()
  const continueButton = page.getByRole('button', { name: /continue/i })
  await expect(continueButton).toBeVisible({ timeout: 5_000 })
  await expect(continueButton).toBeFocused()
  await continueButton.click()
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-phase',
    final ? 'ready-for-reconstruction' : 'chamber',
    { timeout: 5_000 },
  )
}

async function completeJourney(page: Page, order: [Fragment, Fragment, Fragment]) {
  for (let index = 0; index < order.length; index += 1) {
    await collect(page, order[index], index === 2)
  }
  const reconstruction = page.getByRole('button', {
    name: /complete reconstruction/i,
  })
  await expect(reconstruction).toBeFocused()
  await reconstruction.press('Enter')
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-phase',
    'ending',
    { timeout: 10_000 },
  )
  const replay = page.getByRole('button', { name: /reenter memory/i })
  await expect(replay).toBeEnabled({ timeout: 4_000 })
  await expect(replay).toBeFocused()
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

test('unmuted audio follows fragment, order, ending, visibility, and replay lifecycle', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await enter(page)
  const shell = page.locator('.experience-shell')
  await expect(shell).toHaveAttribute('data-audio-status', 'running')
  await expect(shell).toHaveAttribute('data-ambient-start-count', '1')
  await expect(page.getByRole('button', { name: /mute ambient sound/i })).toBeVisible()

  await page.getByRole('button', { name: /hope, available/i }).click()
  await expect(shell).toHaveAttribute('data-last-audio-event', 'fragment-hope')
  const continueButton = page.getByRole('button', { name: /continue/i })
  await expect(continueButton).toBeVisible({ timeout: 5_000 })
  await continueButton.click()
  await expect(shell).toHaveAttribute('data-phase', 'chamber')

  await collect(page, 'fear')
  await collect(page, 'identity', true)
  await page.getByRole('button', { name: /complete reconstruction/i }).press('Space')
  await expect(shell).toHaveAttribute('data-phase', 'reconstruction-recall', {
    timeout: 5_000,
  })
  await expect(shell).toHaveAttribute(
    'data-last-audio-event',
    'reconstruction-recall-hope-fear-identity',
  )
  await expect(shell).toHaveAttribute('data-phase', 'ending', {
    timeout: 8_000,
  })
  await expect(shell).toHaveAttribute('data-last-audio-event', 'ending-hope')
  await expect(page.getByRole('button', { name: /reenter memory/i })).toBeFocused()

  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(shell).toHaveAttribute('data-audio-status', 'suspended')
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(shell).toHaveAttribute('data-audio-status', 'running')

  await page.getByRole('button', { name: /reenter memory/i }).click()
  await expect(shell).toHaveAttribute('data-phase', 'chamber')
  await expect(shell).toHaveAttribute('data-ambient-start-count', '1')
  await expect(page.getByRole('button', { name: /identity, available/i })).toBeFocused()
})

test('persisted mute remains silent through a complete journey and replay', async ({
  page,
}) => {
  test.setTimeout(50_000)
  await page.addInitScript(() => {
    window.localStorage.setItem('felicia-audio-enabled', 'false')
  })
  await enter(page)
  const shell = page.locator('.experience-shell')
  await expect(shell).toHaveAttribute('data-audio-enabled', 'false')
  await expect(
    page.getByRole('button', { name: /enable ambient sound/i }),
  ).toHaveAttribute('aria-pressed', 'false')

  await completeJourney(page, ['identity', 'fear', 'hope'])
  await expect(shell).not.toHaveAttribute('data-last-audio-event', 'ending-identity')
  await page.getByRole('button', { name: /reenter memory/i }).click()
  await expect(shell).toHaveAttribute('data-audio-enabled', 'false')
  await expect(shell).toHaveAttribute('data-ambient-start-count', '1')
})

test('audio failure never blocks the visual experience', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: undefined,
    })
    Object.defineProperty(window, 'webkitAudioContext', {
      configurable: true,
      value: undefined,
    })
  })
  await enter(page)
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-audio-status',
    'unavailable',
  )
  await expect(page.getByRole('button', { name: /sound unavailable/i })).toBeDisabled()
  await page.getByRole('button', { name: /identity, available/i }).click()
  await expect(page.getByRole('button', { name: /continue/i })).toBeVisible({
    timeout: 5_000,
  })
})

test('WebGL failure renders an accessible guarded retry surface', async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null
  })
  await page.goto('/')
  const fallback = page.getByRole('alert')
  await expect(fallback).toContainText(/memory chamber could not open/i)
  const retry = page.getByRole('button', { name: /retry memory/i })
  await retry.click()
  await expect(retry).toBeVisible()
  await retry.click()
  await expect(page.getByRole('button', { name: /retry unavailable/i })).toBeDisabled()
})
