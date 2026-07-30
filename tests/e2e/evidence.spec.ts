import { expect, test } from '@playwright/test'
import {
  enterAwakened,
  holdChamber,
  holdEnding,
  holdSynchronization,
  watchConsole,
} from './phase7-helpers'

test('the evidence bridge holds every required Phase 7 review composition', async ({
  page,
}) => {
  const problems = watchConsole(page)
  await enterAwakened(page, {
    reducedMotion: false,
    viewport: { width: 1440, height: 900 },
  })
  for (const fragment of ['identity', 'fear', 'hope'] as const) {
    await page.evaluate((value) => {
      window.__FELICIA_EVIDENCE__?.holdTrial(value, 'arrival', 0, [])
    }, fragment)
    await expect(page.locator(`.trial-interface--${fragment}`)).toBeVisible()
    await page.evaluate((value) => {
      window.__FELICIA_EVIDENCE__?.holdTrial(value, 'interaction', 1, [])
    }, fragment)
    await expect(page.getByText(/beat 2 \/ 3/i)).toBeVisible()
  }

  await holdChamber(page, ['identity', 'fear', 'hope'])
  await expect(page.locator('.memory-progress')).toHaveAttribute('aria-valuenow', '3')
  await holdSynchronization(page, ['fear', 'hope', 'identity'])
  await expect(page.getByText(/active reconstruction ritual/i)).toBeVisible()
  await page.evaluate(() => {
    window.__FELICIA_EVIDENCE__?.holdSignature(['fear', 'hope', 'identity'], 0.76)
  })
  await expect(page.getByText(/forming from fear/i)).toBeVisible()
  await holdEnding(page, ['fear', 'hope', 'identity'])
  await expect(page.getByText(/fear became the foundation/i)).toBeVisible()
  expect(problems).toEqual([])
})

test('low quality keeps the same trial logic without crossing 100 draw calls', async ({
  page,
}) => {
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
  await enterAwakened(page)
  await expect(page.locator('.experience-shell')).toHaveAttribute('data-quality', 'low')
  await page.evaluate(() => {
    window.__FELICIA_EVIDENCE__?.holdTrial('hope', 'interaction', 1, ['fear'])
  })
  await page.waitForTimeout(300)
  const drawCalls = Number(
    await page.locator('html').getAttribute('data-scene-draw-calls'),
  )
  expect(drawCalls).toBeGreaterThan(0)
  expect(drawCalls).toBeLessThan(100)
})
