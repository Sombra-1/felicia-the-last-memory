import { expect, test } from '@playwright/test'
import {
  enterAwakened,
  holdChamber,
  holdEnding,
  holdSynchronization,
  watchConsole,
} from './phase7-helpers'

test('a first-time judge can explain goal, active trial, order, and consequence', async ({
  page,
}) => {
  const problems = watchConsole(page)
  await enterAwakened(page, {
    reducedMotion: false,
    viewport: { width: 1440, height: 900 },
  })
  await expect(page.getByText(/choose which memory becomes my foundation/i)).toBeVisible()
  await expect(page.getByText(/central consciousness/i)).toBeVisible()

  await page.evaluate(() => {
    window.__FELICIA_EVIDENCE__?.holdTrial('hope', 'interaction', 1, ['fear'])
  })
  await expect(page.getByText(/beat 2 \/ 3/i)).toBeVisible()
  await expect(page.getByText(/no one instructed me to/i)).toBeVisible()
  await expect(page.getByText(/fear foundation active/i)).toBeVisible()

  await holdChamber(page, ['fear', 'hope'])
  await expect(page.locator('.memory-order li').nth(0)).toContainText(/fear/i)
  await expect(page.locator('.memory-order li').nth(1)).toContainText(/hope/i)

  const order = ['fear', 'hope', 'identity'] as const
  await holdSynchronization(page, [...order], 0.62)
  await expect(page.getByText(/secondary — hope/i)).toBeVisible()
  await holdEnding(page, [...order])
  await expect(page.getByText(/fear became the foundation/i)).toBeVisible()
  await expect(page.getByText(/hope shaped what i could become/i)).toBeVisible()
  await expect(page.getByText(/identity remained as the final definition/i)).toBeVisible()
  expect(problems).toEqual([])
})

test('mobile retains concise controls and readable ending semantics', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  const problems = watchConsole(page)
  await enterAwakened(page, { viewport: { width: 390, height: 844 } })
  await page.evaluate(() => {
    window.__FELICIA_EVIDENCE__?.holdTrial('fear', 'interaction', 1, ['hope'])
  })
  const surface = page.locator('.trial-control-surface')
  const surfaceBounds = await surface.boundingBox()
  expect(surfaceBounds).not.toBeNull()
  expect(surfaceBounds!.x).toBeGreaterThanOrEqual(0)
  expect(surfaceBounds!.x + surfaceBounds!.width).toBeLessThanOrEqual(390)

  await holdEnding(page, ['hope', 'identity', 'fear'])
  const ending = page.locator('.ending-interface')
  const endingBounds = await ending.boundingBox()
  expect(endingBounds).not.toBeNull()
  expect(endingBounds!.x).toBeGreaterThanOrEqual(0)
  expect(endingBounds!.x + endingBounds!.width).toBeLessThanOrEqual(390)
  expect(problems).toEqual([])
  await context.close()
})
