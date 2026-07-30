import { expect, test } from '@playwright/test'
import {
  enterAwakened,
  holdEnding,
  holdSynchronization,
  watchConsole,
} from './phase7-helpers'

test('Firefox preserves trial controls, synchronization, ending causality, audio, and replay', async ({
  browserName,
  page,
}) => {
  const problems = watchConsole(page)
  await enterAwakened(page, { viewport: { width: 1024, height: 768 } })
  await expect(page.getByRole('button', { name: /mute ambient sound/i })).toBeVisible()

  await page.evaluate(() => {
    window.__FELICIA_EVIDENCE__?.holdTrial('fear', 'interaction', 1, ['hope'])
  })
  await expect(page.getByText(/i calculated what would disappear/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /up shield/i })).toBeVisible()

  const order = ['hope', 'fear', 'identity'] as const
  await holdSynchronization(page, [...order], 0.72)
  await expect(page.getByText(/final accent — identity/i)).toBeVisible()
  await holdEnding(page, [...order])
  await expect(page.getByText(/hope became the foundation/i)).toBeVisible()

  const replay = page.getByRole('button', { name: /reenter memory/i })
  await replay.click()
  await expect(page.locator('.experience-shell')).toHaveAttribute('data-phase', 'chamber')
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-ambient-start-count',
    '1',
  )
  expect(problems, `${browserName} console`).toEqual([])
})
