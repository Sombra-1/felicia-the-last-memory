import { expect, test } from '@playwright/test'
import {
  enterAwakened,
  holdEnding,
  holdSynchronization,
  type Order,
  watchConsole,
} from './phase7-helpers'

const orders: Order[] = [
  ['identity', 'fear', 'hope'],
  ['identity', 'hope', 'fear'],
  ['fear', 'identity', 'hope'],
  ['fear', 'hope', 'identity'],
  ['hope', 'identity', 'fear'],
  ['hope', 'fear', 'identity'],
]

const secondaryLanguage = {
  identity: /identity shaped how i understood myself/i,
  fear: /fear shaped how i endured/i,
  hope: /hope shaped what i could become/i,
} as const

const finalLanguage = {
  identity: /identity remained as the final definition/i,
  fear: /fear remained as the last protective instinct/i,
  hope: /hope remained as the final possibility/i,
} as const

test('active synchronization exposes all three authored roles and player progress', async ({
  page,
}) => {
  const problems = watchConsole(page)
  await enterAwakened(page, { viewport: { width: 1440, height: 900 } })
  const order: Order = ['fear', 'hope', 'identity']

  for (const [progress, copy] of [
    [0.2, /foundation — fear/i],
    [0.55, /secondary — hope/i],
    [0.82, /final accent — identity/i],
  ] as const) {
    await holdSynchronization(page, order, progress)
    await expect(page.getByText(copy)).toBeVisible()
    await expect(page.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      String(Math.round(progress * 100)),
    )
  }

  const sync = page.locator('.synchronization-interface button')
  await sync.focus()
  await page.keyboard.down('Space')
  await expect(sync).toHaveClass(/is-holding/)
  await page.keyboard.up('Space')
  expect(problems).toEqual([])
})

test('all six orders produce deterministic foundation, secondary, and final roles', async ({
  page,
}) => {
  const problems = watchConsole(page)
  await enterAwakened(page, { viewport: { width: 1024, height: 768 } })

  for (const order of orders) {
    await holdEnding(page, order)
    await expect(
      page.getByText(new RegExp(`${order[0]} became the foundation`, 'i')),
    ).toBeVisible()
    await expect(page.getByText(secondaryLanguage[order[1]])).toBeVisible()
    await expect(page.getByText(finalLanguage[order[2]])).toBeVisible()
    await expect(
      page.getByText(order.map((fragment) => fragment.toUpperCase()).join(' · '), {
        exact: true,
      }),
    ).toBeVisible()
  }
  expect(problems).toEqual([])
})

test('signature transformation stays below the investigated draw-call boundary', async ({
  page,
}) => {
  await enterAwakened(page, { viewport: { width: 1440, height: 900 } })
  await page.evaluate(() => {
    window.__FELICIA_EVIDENCE__?.holdSignature(['fear', 'identity', 'hope'], 0.76)
  })
  await expect(page.getByText(/field is reforming under fear/i)).toBeVisible()
  await page.waitForTimeout(400)
  const drawCalls = Number(
    await page.locator('html').getAttribute('data-scene-draw-calls'),
  )
  expect(drawCalls).toBeGreaterThan(0)
  expect(drawCalls).toBeLessThan(100)
})

test('three replay cycles reset the chamber without duplicate ambient loops', async ({
  page,
}) => {
  await enterAwakened(page)
  const shell = page.locator('.experience-shell')
  for (const order of orders.slice(0, 3)) {
    await holdEnding(page, order)
    await page.getByRole('button', { name: /reenter memory/i }).click()
    await expect(shell).toHaveAttribute('data-phase', 'chamber')
    await expect(shell).toHaveAttribute('data-memory-order', 'none')
    await expect(shell).toHaveAttribute('data-ambient-start-count', '1')
    await expect(shell).toHaveAttribute('data-input-locked', 'false')
  }
})
