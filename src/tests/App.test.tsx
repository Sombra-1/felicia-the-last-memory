import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../app/App'
import { feliciaAudioEngine } from '../audio/FeliciaAudioEngine'
import { useExperienceStore } from '../state/experienceStore'

vi.mock('../experience/ExperienceCanvas', () => ({
  ExperienceCanvas: () => <div data-testid="experience-canvas" />,
}))

describe('App shell', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
    feliciaAudioEngine.dispose()
    useExperienceStore.getState().resetExperience()
  })

  it('presents a clear entry action and advances to the chamber phase', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: /enter memory/i }))

    expect(useExperienceStore.getState().phase).toBe('chamber')
    expect(screen.getByText(/i have three memories left/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/chosen memory order/i)).toBeInTheDocument()
    expect(await screen.findByTestId('experience-canvas')).toBeInTheDocument()
  })

  it('directly unlocks audio and acknowledges entry from the primary click', async () => {
    const unlock = vi.spyOn(feliciaAudioEngine, 'unlock').mockResolvedValue(true)
    const signature = vi
      .spyOn(feliciaAudioEngine, 'playActivationSignature')
      .mockReturnValue(true)
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: /enter memory/i }))

    expect(unlock).toHaveBeenCalled()
    expect(signature).toHaveBeenCalledOnce()
    expect(
      screen.getByText(/sound enabled. entering felicia’s memory/i),
    ).toBeInTheDocument()
  })

  it('exposes an accessible sound toggle', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.queryByRole('button', { name: /sound/i })).not.toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: /enter memory/i }))
    useExperienceStore.getState().setAudioDiagnostics({
      status: 'running',
      ambientStartCount: 1,
      lastEvent: 'ambient-start',
      masterGain: 0.34,
      ambientGain: 0.68,
      cueGain: 0.4,
    })
    const toggle = await screen.findByRole('button', {
      name: /mute ambient sound/i,
    })
    await user.click(toggle)

    expect(screen.getByRole('button', { name: /enable ambient sound/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('uses the same state path for keyboard fragment activation', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: /enter memory/i }))
    useExperienceStore.getState().completeEntrance()
    const identity = await screen.findByRole('button', {
      name: /identity, enter memory trial/i,
    })
    identity.focus()
    await user.keyboard('{Enter}')

    expect(useExperienceStore.getState().activeFragment).toBe('identity')
    expect(useExperienceStore.getState().phase).toBe('trial-departure')
    expect(useExperienceStore.getState().inputLocked).toBe(true)
  })
})
