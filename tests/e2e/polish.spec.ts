import { expect, test } from '@playwright/test'
import {
  enterAwakened,
  holdEnding,
  holdSynchronization,
  watchConsole,
} from './phase7-helpers'

test('adaptive audio follows trial, synchronization, ending, visibility, and replay', async ({
  page,
}) => {
  const problems = watchConsole(page)
  await enterAwakened(page)
  const shell = page.locator('.experience-shell')
  await expect(shell).toHaveAttribute('data-audio-status', 'running')
  await page.getByRole('button', { name: /hope, enter memory trial/i }).click()
  await expect(shell).toHaveAttribute('data-last-audio-event', 'fragment-hope')
  await expect(shell).toHaveAttribute('data-phase', 'trial-active', {
    timeout: 5_000,
  })
  await expect(shell).toHaveAttribute('data-last-audio-event', 'trial-hope-1')

  await holdSynchronization(page, ['hope', 'fear', 'identity'], 0.5)
  await expect(shell).toHaveAttribute(
    'data-last-audio-event',
    'reconstruction-synchronizing',
  )
  await holdEnding(page, ['hope', 'fear', 'identity'])
  await expect(shell).toHaveAttribute('data-last-audio-event', 'ending-hope')

  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(shell).toHaveAttribute('data-audio-status', 'suspended')
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(shell).toHaveAttribute('data-audio-status', 'running')
  expect(problems).toEqual([])
})

test('persisted mute never blocks the visual journey', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('felicia-audio-enabled', 'false')
  })
  await enterAwakened(page)
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-audio-enabled',
    'false',
  )
  await page.evaluate(() => {
    window.__FELICIA_EVIDENCE__?.holdTrial('identity', 'interaction', 1, [])
  })
  await expect(page.getByText(/they taught me what the name/i)).toBeVisible()
})

test('audio failure exposes a safe disabled control while trials remain playable', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: undefined,
    })
    Object.defineProperty(window, 'webkitAudioContext', {
      configurable: true,
      value: undefined,
    })
  })
  await enterAwakened(page)
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-audio-status',
    'unavailable',
  )
  await expect(page.getByRole('button', { name: /sound unavailable/i })).toBeDisabled()
  await page.getByRole('button', { name: /identity, enter memory trial/i }).click()
  await expect(page.locator('.experience-shell')).toHaveAttribute(
    'data-phase',
    'trial-active',
    { timeout: 5_000 },
  )
})

test('WebGL failure renders an accessible guarded retry surface', async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null
  })
  await page.goto('/')
  const fallback = page.getByRole('alert')
  await expect(fallback).toContainText(/memory chamber could not open/i)
  const retry = page.getByRole('button', { name: /retry memory/i })
  await retry.click()
  await retry.click()
  await expect(page.getByRole('button', { name: /retry unavailable/i })).toBeDisabled()
})
