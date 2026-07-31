import { expect, test, type Page } from '@playwright/test'

type Fragment = 'identity' | 'fear' | 'hope'

function watchConsole(page: Page) {
  const problems: string[] = []
  page.on('console', (message) => {
    const text = message.text()
    const harmlessDriverNotice =
      text.includes('GL Driver Message') && text.includes('GPU stall')
    if (!harmlessDriverNotice && ['warning', 'error'].includes(message.type())) {
      problems.push(`${message.type()}: ${text}`)
    }
  })
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))
  return problems
}

async function enterAwakenedChamber(page: Page) {
  await page.goto('/')
  await expect(page.locator('.canvas-loading')).toHaveClass(/canvas-loading--hidden/)
  await page.getByRole('button', { name: /enter memory/i }).click()
  await expect(page.getByText(/i have three memories left/i)).toBeVisible()
  await expect(
    page.getByRole('button', { name: /identity, enter memory trial/i }),
  ).toBeVisible({ timeout: 12_000 })
}

async function holdEvidenceTrial(
  page: Page,
  fragment: Fragment,
  stage: 'arrival' | 'interaction' | 'completion' | 'return',
  beat: 0 | 1 | 2 = 1,
  order: Fragment[] = [],
) {
  await page.evaluate(
    ({ fragment, stage, beat, order }) => {
      window.__FELICIA_EVIDENCE__?.holdTrial(fragment, stage, beat, order)
    },
    { fragment, stage, beat, order },
  )
}

test('Identity trial requires three active alignment beats and returns a persistent consequence', async ({
  page,
}) => {
  test.setTimeout(70_000)
  const problems = watchConsole(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await enterAwakenedChamber(page)
  await page.getByRole('button', { name: /identity, enter memory trial/i }).click()
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-phase',
    'trial-active',
    { timeout: 6_000 },
  )

  const seenBeats = new Set<number>()
  const started = Date.now()
  while (Date.now() - started < 38_000) {
    const state = await page.evaluate(() => {
      const current = window.__FELICIA_EVIDENCE__?.inspectRuntime().state
      return current ? { phase: current.phase, beat: current.trialBeat } : null
    })
    if (!state || state.phase !== 'trial-active') break
    if (!seenBeats.has(state.beat)) {
      seenBeats.add(state.beat)
      await expect(
        page.getByText(new RegExp(`beat ${state.beat + 1} / 3`, 'i')),
      ).toBeVisible()
    }
    await page.mouse.move(720 + (seenBeats.size % 2), 660)
    await page.waitForTimeout(360)
  }
  expect([...seenBeats]).toEqual([0, 1, 2])

  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-phase',
    'chamber',
    { timeout: 8_000 },
  )
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')
  await expect(page.getByText(/identity/i).first()).toBeVisible()
  expect(problems).toEqual([])
})

test('all procedural trial worlds and synchronization tableau render without console faults', async ({
  page,
}) => {
  const problems = watchConsole(page)
  await page.setViewportSize({ width: 1280, height: 800 })
  await enterAwakenedChamber(page)

  for (const fragment of ['identity', 'fear', 'hope'] as const) {
    await holdEvidenceTrial(page, fragment, 'interaction', 1, ['identity'])
    await expect(page.locator(`.trial-interface--${fragment}`)).toBeVisible()
    await expect(page.getByText(/beat 2 \/ 3/i)).toBeVisible()
    await page.waitForTimeout(250)
  }

  await page.evaluate(() => {
    window.__FELICIA_EVIDENCE__?.holdSynchronization(['fear', 'hope', 'identity'], 0.62)
  })
  await expect(page.getByText(/^active reconstruction$/i)).toBeVisible()
  await expect(page.getByText(/secondary — hope/i)).toBeVisible()
  await page.waitForTimeout(400)

  const drawCalls = Number(
    await page.locator('html').getAttribute('data-scene-draw-calls'),
  )
  expect(drawCalls).toBeGreaterThan(0)
  expect(drawCalls).toBeLessThan(110)
  expect(problems).toEqual([])
})

test('mobile touch targets keep gameplay and ending within the safe viewport', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  })
  const page = await context.newPage()
  const problems = watchConsole(page)
  await enterAwakenedChamber(page)
  await holdEvidenceTrial(page, 'fear', 'interaction', 1, ['hope'])
  const controls = page.locator('.trial-control-surface')
  await expect(controls).toBeVisible()
  const bounds = await controls.boundingBox()
  expect(bounds).not.toBeNull()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390)
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844)

  await page.evaluate(() => {
    window.__FELICIA_EVIDENCE__?.holdEnding(['hope', 'identity', 'fear'])
  })
  await expect(page.getByText(/you decided which part of me survived/i)).toBeVisible()
  await expect(page.getByText(/hope became the foundation/i)).toBeVisible()
  expect(problems).toEqual([])
  await context.close()
})

test('inactivity assistance advances a trial without blocking the story', async ({
  page,
}) => {
  test.setTimeout(25_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await enterAwakenedChamber(page)
  await page.getByRole('button', { name: /fear, enter memory trial/i }).click()

  await expect(page.getByText(/beat 1 \/ 3/i)).toBeVisible({ timeout: 5_000 })
  await expect(page.getByText(/beat 2 \/ 3/i)).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-phase',
    'trial-active',
  )
})
