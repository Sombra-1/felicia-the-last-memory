import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

type Fragment = 'identity' | 'fear' | 'hope'
type Order = [Fragment, Fragment, Fragment]

const evidenceDirectory = resolve('docs/evidence/phase4')
const orders: Order[] = [
  ['identity', 'fear', 'hope'],
  ['identity', 'hope', 'fear'],
  ['fear', 'identity', 'hope'],
  ['fear', 'hope', 'identity'],
  ['hope', 'identity', 'fear'],
  ['hope', 'fear', 'identity'],
]

function watchConsole(page: Page) {
  const problems: string[] = []
  page.on('console', (message) => {
    const text = message.text()
    const harmlessDriverNotice =
      text.includes('GL Driver Message') && text.includes('GPU stall due to ReadPixels')
    if (
      !harmlessDriverNotice &&
      (message.type() === 'error' || message.type() === 'warning')
    ) {
      problems.push(`${message.type()}: ${text}`)
    }
  })
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))
  return problems
}

async function enter(page: Page) {
  await page.goto('/')
  await expect(page.locator('.canvas-loading')).toHaveClass(/canvas-loading--hidden/)
  await page.getByRole('button', { name: /enter memory/i }).click()
  await expect(page.locator('.experience-shell')).toHaveAttribute('data-phase', 'chamber')
}

async function collect(page: Page, fragment: Fragment, final = false) {
  await page
    .getByRole('button', { name: new RegExp(`${fragment}, available`, 'i') })
    .click()
  await expect(page.getByRole('button', { name: /continue/i })).toBeVisible({
    timeout: 12_000,
  })
  await page.getByRole('button', { name: /continue/i }).click()
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-phase',
    final ? 'ready-for-reconstruction' : 'chamber',
    { timeout: 8_000 },
  )
}

async function prepare(page: Page, order: Order) {
  await enter(page)
  for (let index = 0; index < order.length; index += 1) {
    await collect(page, order[index], index === 2)
  }
}

async function reconstruct(
  page: Page,
  activation: 'pointer' | 'keyboard' | 'touch' = 'pointer',
) {
  const trigger = page.getByRole('button', { name: /complete reconstruction/i })
  if (activation === 'keyboard') {
    await trigger.focus()
    await page.keyboard.press('Enter')
  } else if (activation === 'touch') {
    await trigger.tap()
  } else {
    await trigger.click()
  }
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-input-locked',
    'true',
  )
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-phase',
    'ending',
    {
      timeout: 25_000,
    },
  )
  await expect(
    page.getByText('You decided which part of me survived.', { exact: true }),
  ).toBeVisible({ timeout: 5_000 })
  await expect(page.getByRole('button', { name: /reenter memory/i })).toBeEnabled()
}

async function startTrace(context: BrowserContext) {
  await mkdir(evidenceDirectory, { recursive: true })
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true })
}

async function sceneMetrics(page: Page) {
  await page.waitForTimeout(350)
  return {
    drawCalls: Number(await page.locator('html').getAttribute('data-scene-draw-calls')),
    triangles: Number(await page.locator('html').getAttribute('data-scene-triangles')),
  }
}

test('standard Identity-first reconstruction captures every authored stage', async ({
  context,
  page,
}) => {
  test.setTimeout(240_000)
  await startTrace(context)
  const problems = watchConsole(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await prepare(page, ['identity', 'fear', 'hope'])
  await page.screenshot({
    path: resolve(evidenceDirectory, 'ready-for-reconstruction.png'),
    fullPage: true,
  })

  await page.evaluate(() =>
    window.__FELICIA_EVIDENCE__?.holdStage('reconstruction-collapse'),
  )
  await page.screenshot({
    path: resolve(evidenceDirectory, 'collapse.png'),
    fullPage: true,
  })
  await page.evaluate(() => window.__FELICIA_EVIDENCE__?.holdStage('reconstruction-void'))
  await page.screenshot({
    path: resolve(evidenceDirectory, 'void.png'),
    fullPage: true,
  })
  await page.evaluate(() =>
    window.__FELICIA_EVIDENCE__?.holdStage('reconstruction-recall'),
  )
  await page.screenshot({
    path: resolve(evidenceDirectory, 'memory-recall.png'),
    fullPage: true,
  })
  const recallMetrics = await sceneMetrics(page)
  console.log(
    `reconstruction transient peak: ${recallMetrics.drawCalls} draw calls, ${recallMetrics.triangles} triangles`,
  )
  await page.evaluate(() => window.__FELICIA_EVIDENCE__?.releaseToReady())

  const trigger = page.getByRole('button', { name: /complete reconstruction/i })
  await trigger.evaluate((button) => {
    button.click()
    button.click()
    button.click()
  })
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-input-locked',
    'true',
  )
  await page.keyboard.press('Escape')
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-input-locked',
    'true',
  )
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-phase',
    'ending',
    {
      timeout: 12_000,
    },
  )
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-ending-profile',
    'identity',
  )
  await expect(page.getByRole('button', { name: /reenter memory/i })).toBeEnabled({
    timeout: 4_000,
  })
  await page.screenshot({
    path: resolve(evidenceDirectory, 'identity-first-final.png'),
    fullPage: true,
  })
  const identityMetrics = await sceneMetrics(page)
  expect(identityMetrics.drawCalls).toBeLessThanOrEqual(45)
  console.log(
    `identity ending: ${identityMetrics.drawCalls} draw calls, ${identityMetrics.triangles} triangles`,
  )
  await context.tracing.stop({
    path: resolve(evidenceDirectory, 'standard-reconstruction-trace.zip'),
  })
  expect(problems).toEqual([])
})

test('all six orders finish deterministically and retain secondary order', async ({
  page,
}) => {
  test.setTimeout(240_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1024, height: 768 })
  const problems = watchConsole(page)

  for (const order of orders) {
    await prepare(page, order)
    await reconstruct(page, order[0] === 'fear' ? 'keyboard' : 'pointer')
    await expect(page.locator('.experience-shell')).toHaveAttribute(
      'data-ending-profile',
      order[0],
    )
    await expect(
      page.getByText(order.map((fragment) => fragment.toUpperCase()).join(' · '), {
        exact: true,
      }),
    ).toBeVisible()

    if (order.join('-') === 'identity-hope-fear') {
      await page.screenshot({
        path: resolve(evidenceDirectory, 'identity-secondary-variation.png'),
        fullPage: true,
      })
    }
    if (order.join('-') === 'fear-identity-hope') {
      await page.screenshot({
        path: resolve(evidenceDirectory, 'fear-first-final.png'),
        fullPage: true,
      })
      const metrics = await sceneMetrics(page)
      expect(metrics.drawCalls).toBeLessThanOrEqual(45)
      console.log(
        `fear ending: ${metrics.drawCalls} draw calls, ${metrics.triangles} triangles`,
      )
    }
    if (order.join('-') === 'hope-identity-fear') {
      await page.screenshot({
        path: resolve(evidenceDirectory, 'hope-first-final.png'),
        fullPage: true,
      })
      const metrics = await sceneMetrics(page)
      expect(metrics.drawCalls).toBeLessThanOrEqual(45)
      console.log(
        `hope ending: ${metrics.drawCalls} draw calls, ${metrics.triangles} triangles`,
      )
    }

    await page.getByRole('button', { name: /reenter memory/i }).click()
    await expect(page.locator('.experience-shell')).toHaveAttribute(
      'data-phase',
      'chamber',
      {
        timeout: 3_000,
      },
    )
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  }
  expect(problems).toEqual([])
})

test('reduced-motion replay supports a second complete journey without reload', async ({
  context,
  page,
}) => {
  test.setTimeout(90_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await startTrace(context)
  await page.setViewportSize({ width: 1024, height: 768 })
  await prepare(page, ['hope', 'fear', 'identity'])
  await reconstruct(page)
  await page.getByRole('button', { name: /reenter memory/i }).click()
  await expect(page.locator('.experience-shell')).toHaveAttribute('data-phase', 'chamber')
  await page.screenshot({
    path: resolve(evidenceDirectory, 'chamber-after-replay-reset.png'),
    fullPage: true,
  })

  for (const [index, fragment] of (
    ['fear', 'identity', 'hope'] as Fragment[]
  ).entries()) {
    await collect(page, fragment, index === 2)
  }
  await reconstruct(page, 'keyboard')
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-ending-profile',
    'fear',
  )
  await context.tracing.stop({
    path: resolve(evidenceDirectory, 'reduced-motion-replay-trace.zip'),
  })
})

test('mobile touch ending stays within safe bounds and low quality remains lean', async ({
  browser,
}) => {
  test.setTimeout(60_000)
  await mkdir(evidenceDirectory, { recursive: true })
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  const problems = watchConsole(page)
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
  await prepare(page, ['hope', 'identity', 'fear'])
  await expect(page.locator('.experience-shell')).toHaveAttribute('data-quality', 'low')
  await reconstruct(page, 'touch')

  const replay = page.getByRole('button', { name: /reenter memory/i })
  const bounds = await replay.boundingBox()
  expect(bounds).not.toBeNull()
  expect(bounds!.height).toBeGreaterThanOrEqual(44)
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390)
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844)

  await page.screenshot({
    path: resolve(evidenceDirectory, 'mobile-hope-final.png'),
    fullPage: true,
  })
  expect(problems).toEqual([])
  await context.close()
})

test('visibility restoration advances a suspended stage instead of getting stuck', async ({
  page,
}) => {
  test.setTimeout(45_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await prepare(page, ['identity', 'fear', 'hope'])
  await page.getByRole('button', { name: /complete reconstruction/i }).click()
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(page.locator('.experience-shell')).not.toHaveAttribute(
    'data-phase',
    'reconstruction-initiating',
    { timeout: 2_000 },
  )
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-phase',
    'ending',
    {
      timeout: 8_000,
    },
  )
})
