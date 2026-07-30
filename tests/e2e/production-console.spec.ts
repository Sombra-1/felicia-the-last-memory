import { expect, test } from '@playwright/test'
import { enterAwakened, watchConsole } from './phase7-helpers'

test('built experience opens a trial without production console errors', async ({
  page,
}) => {
  const problems = watchConsole(page)
  await enterAwakened(page)

  await page.getByRole('button', { name: /identity, enter memory trial/i }).click()
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-phase',
    'trial-active',
    { timeout: 6_000 },
  )
  await page.mouse.move(420, 380)
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(1_000)

  expect(problems).toEqual([])
})
