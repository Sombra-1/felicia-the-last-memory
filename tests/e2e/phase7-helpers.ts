import { expect, type Page } from '@playwright/test'

export type Fragment = 'identity' | 'fear' | 'hope'
export type Order = [Fragment, Fragment, Fragment]

export function watchConsole(page: Page) {
  const problems: string[] = []
  page.on('console', (message) => {
    const text = message.text()
    const harmless = text.includes('GL Driver Message') && text.includes('GPU stall')
    if (!harmless && ['warning', 'error'].includes(message.type())) {
      problems.push(`${message.type()}: ${text}`)
    }
  })
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))
  return problems
}

export async function enterAwakened(
  page: Page,
  options: { reducedMotion?: boolean; viewport?: { width: number; height: number } } = {},
) {
  if (options.reducedMotion ?? true) {
    await page.emulateMedia({ reducedMotion: 'reduce' })
  }
  if (options.viewport) await page.setViewportSize(options.viewport)
  await page.goto('/')
  await expect(page.locator('.canvas-loading')).toHaveClass(/canvas-loading--hidden/)
  await page.getByRole('button', { name: /enter memory/i }).click()
  await expect(page.locator('.experience-shell')).toHaveAttribute('data-phase', 'chamber')
  await expect(
    page.getByRole('button', { name: /identity, enter memory trial/i }),
  ).toBeVisible({ timeout: 12_000 })
}

export async function holdChamber(page: Page, order: Fragment[]) {
  await page.evaluate((value) => {
    window.__FELICIA_EVIDENCE__?.holdChamber(value)
  }, order)
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-memory-order',
    order.join('-') || 'none',
  )
}

export async function holdEnding(page: Page, order: Order) {
  await page.evaluate((value) => {
    window.__FELICIA_EVIDENCE__?.holdEnding(value)
  }, order)
  await expect(page.locator('.experience-shell')).toHaveAttribute('data-phase', 'ending')
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-ending-profile',
    order[0],
  )
}

export async function holdSynchronization(page: Page, order: Order, progress = 0.64) {
  await page.evaluate(
    ({ value, progress }) => {
      window.__FELICIA_EVIDENCE__?.holdSynchronization(value, progress)
    },
    { value: order, progress },
  )
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-phase',
    'reconstruction-synchronizing',
  )
}
