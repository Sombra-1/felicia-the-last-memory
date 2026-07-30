import { expect, test } from '@playwright/test'
import { enterAwakened, holdEnding, type Order, watchConsole } from './phase7-helpers'

const orders: Order[] = [
  ['identity', 'fear', 'hope'],
  ['identity', 'hope', 'fear'],
  ['fear', 'identity', 'hope'],
  ['fear', 'hope', 'identity'],
  ['hope', 'identity', 'fear'],
  ['hope', 'fear', 'identity'],
]

test('all order profiles survive rapid resize, orientation, and visibility restoration', async ({
  page,
}) => {
  const problems = watchConsole(page)
  await enterAwakened(page)
  for (const order of orders) {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.setViewportSize({ width: 844, height: 390 })
    await page.setViewportSize({ width: 1024, height: 768 })
    await holdEnding(page, order)
    await expect(page.locator('.experience-shell')).toHaveAttribute(
      'data-ending-profile',
      order[0],
    )
  }
  expect(problems).toEqual([])
})

test('rapid competing portal activation locks exactly one transition', async ({
  page,
}) => {
  await enterAwakened(page)
  await page.evaluate(() => {
    const buttons = [...document.querySelectorAll<HTMLButtonElement>('[data-fragment]')]
    buttons.forEach((button) => {
      button.click()
      button.click()
    })
  })
  const shell = page.locator('.experience-shell')
  await expect(shell).toHaveAttribute('data-phase', 'trial-departure')
  await expect(shell).toHaveAttribute('data-active-fragment', 'identity')
  await expect(shell).toHaveAttribute('data-input-locked', 'true')
})

test('an interrupted transition resolves to a stable trial arrival on visibility restore', async ({
  page,
}) => {
  await enterAwakened(page)
  await page.getByRole('button', { name: /hope, enter memory trial/i }).click()
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-phase',
    /trial-arrival|trial-active/,
    { timeout: 4_000 },
  )
})
