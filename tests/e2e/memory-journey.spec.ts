import { expect, test, type Page } from '@playwright/test'
import {
  enterAwakened,
  holdChamber,
  holdEnding,
  holdSynchronization,
  type Fragment,
  watchConsole,
} from './phase7-helpers'

async function playKeyboardTrial(page: Page, fragment: Fragment) {
  const control = page.getByRole('button', {
    name: new RegExp(`${fragment}, enter memory trial`, 'i'),
  })
  await control.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-phase',
    'trial-active',
    { timeout: 5_000 },
  )

  let configuredBeat = -1
  const started = Date.now()
  while (Date.now() - started < 24_000) {
    const state = await page.evaluate(() => {
      const current = window.__FELICIA_EVIDENCE__?.inspectRuntime().state
      return current ? { phase: current.phase, beat: current.trialBeat } : null
    })
    if (!state || state.phase !== 'trial-active') break
    if (state.beat !== configuredBeat) {
      configuredBeat = state.beat
      await expect(
        page.getByText(new RegExp(`beat ${state.beat + 1} / 3`, 'i')),
      ).toBeVisible()
      if (fragment === 'identity') {
        await page.keyboard.press('ArrowLeft')
        await page.keyboard.press('ArrowRight')
      } else if (fragment === 'fear') {
        await page.keyboard.press(['ArrowLeft', 'ArrowUp', 'ArrowRight'][state.beat])
      } else if (state.beat === 0) {
        await page.keyboard.press('ArrowLeft')
        await page.keyboard.press('ArrowLeft')
      } else if (state.beat === 1) {
        await page.keyboard.press('ArrowRight')
        await page.keyboard.press('ArrowRight')
        await page.keyboard.press('ArrowRight')
        await page.keyboard.press('ArrowRight')
      } else {
        await page.keyboard.press('ArrowLeft')
        await page.keyboard.press('ArrowLeft')
      }
    }
    await page.keyboard.press('x')
    await page.waitForTimeout(280)
  }

  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-phase',
    /chamber|ready-for-reconstruction|reconstruction-synchronizing/,
    { timeout: 7_000 },
  )
}

test('keyboard-only player completes all trials, active reconstruction, ending, and replay', async ({
  page,
}) => {
  test.setTimeout(120_000)
  const problems = watchConsole(page)
  await enterAwakened(page, { viewport: { width: 1024, height: 768 } })

  await playKeyboardTrial(page, 'identity')
  await playKeyboardTrial(page, 'fear')
  await playKeyboardTrial(page, 'hope')
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-memory-order',
    'identity-fear-hope',
  )
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-phase',
    'reconstruction-synchronizing',
    { timeout: 5_000 },
  )

  await page.keyboard.down('Space')
  await page.waitForTimeout(10_000)
  await page.keyboard.up('Space')
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-phase',
    'ending',
    { timeout: 12_000 },
  )
  await expect(page.getByText(/identity became the foundation/i)).toBeVisible({
    timeout: 5_000,
  })
  const replay = page.getByRole('button', { name: /reenter memory/i })
  await expect(replay).toBeVisible({ timeout: 7_000 })
  await replay.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('.experience-shell')).toHaveAttribute('data-phase', 'chamber')
  expect(problems).toEqual([])
})

async function playTouchTrial(page: Page, fragment: Fragment, width: number) {
  await page
    .getByRole('button', {
      name: new RegExp(`${fragment}, enter memory trial`, 'i'),
    })
    .tap()
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-phase',
    'trial-active',
    { timeout: 5_000 },
  )
  const started = Date.now()
  while (Date.now() - started < 24_000) {
    const state = await page.evaluate(() => {
      const current = window.__FELICIA_EVIDENCE__?.inspectRuntime().state
      return current ? { phase: current.phase, beat: current.trialBeat } : null
    })
    if (!state || state.phase !== 'trial-active') break
    const beat = state.beat
    if (fragment === 'fear') {
      const direction = ['left', 'up', 'right'][beat]
      await page
        .getByRole('button', { name: new RegExp(`${direction} shield`, 'i') })
        .tap()
    } else {
      const normalizedX = fragment === 'identity' ? 0 : [-0.39, 0.35, 0][beat]
      await page.touchscreen.tap(Math.round(((normalizedX + 1) / 2) * width), 720)
    }
    await page.waitForTimeout(300)
  }
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-phase',
    /chamber|ready-for-reconstruction|reconstruction-synchronizing/,
    { timeout: 7_000 },
  )
}

test('mobile touch player completes a live trial and retains touch control through the full journey', async ({
  browser,
}) => {
  test.setTimeout(100_000)
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  const problems = watchConsole(page)
  await enterAwakened(page, { viewport: { width: 390, height: 844 } })
  await playTouchTrial(page, 'hope', 390)

  await page.evaluate(() => {
    window.__FELICIA_EVIDENCE__?.holdTrial('identity', 'interaction', 1, ['hope'])
  })
  await page.touchscreen.tap(195, 720)
  await expect(page.getByText(/beat 2 \/ 3/i)).toBeVisible()
  await holdChamber(page, ['hope', 'identity'])

  await page.evaluate(() => {
    window.__FELICIA_EVIDENCE__?.holdTrial('fear', 'interaction', 1, ['hope', 'identity'])
  })
  await page.getByRole('button', { name: /up shield/i }).tap()
  await holdChamber(page, ['hope', 'identity', 'fear'])
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-memory-order',
    'hope-identity-fear',
  )
  await holdSynchronization(page, ['hope', 'identity', 'fear'], 0.8)
  const sync = page.locator('.synchronization-interface button')
  for (let press = 0; press < 4; press += 1) {
    await sync.tap()
    await page.waitForTimeout(180)
  }
  await holdEnding(page, ['hope', 'identity', 'fear'])
  await expect(page.getByText(/hope became the foundation/i)).toBeVisible({
    timeout: 5_000,
  })
  expect(problems).toEqual([])
  await context.close()
})

test('rapid input cannot skip a trial or record memory before return', async ({
  page,
}) => {
  await enterAwakened(page)
  const identity = page.getByRole('button', {
    name: /identity, enter memory trial/i,
  })
  await identity.click({ clickCount: 2 })
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-active-fragment',
    'identity',
  )
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-memory-order',
    'none',
  )
})
