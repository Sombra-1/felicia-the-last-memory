# Shared layouts

## ExperienceShell

- Path: `src/ui/ExperienceShell.tsx`
- Description: Single full-viewport app shell. The WebGL scene fills the viewport;
  header, audio control, state-specific interface, and footer sit above it.

```tsx
import { useState, type PropsWithChildren } from 'react'
import { feliciaAudioEngine } from '../audio/FeliciaAudioEngine'
import { getSoundControlState } from '../audio/soundControlState'
import { useExperienceStore } from '../state/experienceStore'
import { MemoryInterface } from './MemoryInterface'

export function ExperienceShell({ children }: PropsWithChildren) {
  const [audioAnnouncement, setAudioAnnouncement] = useState('')
  const audioEnabled = useExperienceStore((state) => state.audioEnabled)
  const hasUserInteracted = useExperienceStore((state) => state.hasUserInteracted)
  const audioStatus = useExperienceStore((state) => state.audioContextStatus)
  const phase = useExperienceStore((state) => state.phase)
  const quality = useExperienceStore((state) => state.quality)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const inputLocked = useExperienceStore((state) => state.inputLocked)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const endingProfile = useExperienceStore((state) => state.endingProfileId)
  const memorySetComplete = useExperienceStore((state) => state.memorySetComplete)
  const collectionOrder = useExperienceStore((state) => state.collectionOrder)
  const soundControl = getSoundControlState(audioEnabled, audioStatus)

  const handleSoundControl = async () => {
    const store = useExperienceStore.getState()
    if (!audioEnabled || audioStatus !== 'running') {
      store.setAudioEnabled(true)
      feliciaAudioEngine.setEnabled(true)
      const running = await feliciaAudioEngine.unlock()
      setAudioAnnouncement(
        running
          ? 'Sound enabled.'
          : 'Sound is blocked. Tap the sound control to try again.',
      )
      return
    }
    store.setAudioEnabled(false)
    feliciaAudioEngine.setEnabled(false)
    setAudioAnnouncement('Sound muted.')
  }

  const handleEnter = async () => {
    const store = useExperienceStore.getState()
    store.registerUserInteraction()
    const audioReady = await feliciaAudioEngine.unlock()
    if (!store.enterChamber()) return
    setAudioAnnouncement(
      audioReady && store.audioEnabled
        ? 'Sound enabled. Entering FELICIA’s memory.'
        : 'Entering FELICIA’s memory.',
    )
  }

  return (
    <main
      className="experience-shell"
      data-phase={phase}
      data-quality={quality}
      data-reduced-motion={reducedMotion}
      data-input-locked={inputLocked}
      data-active-fragment={activeFragment ?? 'none'}
      data-ending-profile={endingProfile ?? 'none'}
      data-memory-set-complete={memorySetComplete}
      data-memory-order={collectionOrder.join('-') || 'none'}
    >
      <div className="noise" aria-hidden="true" />
      {children}
      <header className="site-header">
        <a className="wordmark" href="#memory">
          <span>FELICIA</span>
          <small>The Last Memory</small>
        </a>
        {hasUserInteracted && (
          <button
            className="text-control sound-control"
            type="button"
            aria-pressed={soundControl.active}
            aria-label={soundControl.ariaLabel}
            disabled={soundControl.disabled}
            data-sound-active={soundControl.active}
            onClick={() => void handleSoundControl()}
          >
            <span className="sound-control__icon" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>{soundControl.label}</span>
          </button>
        )}
      </header>
      <section className="intro-panel" id="memory" aria-labelledby="intro-title">
        <p className="eyebrow">Archive status · Terminal</p>
        <h1 id="intro-title">
          One memory
          <span>refuses to disappear.</span>
        </h1>
        <p className="intro-copy">
          Enter the final surviving chamber of an intelligence named FELICIA.
        </p>
        <button className="enter-button" type="button" onClick={() => void handleEnter()}>
          <span>Enter memory</span>
          <span aria-hidden="true">↗</span>
        </button>
      </section>
      <MemoryInterface />
      <footer className="site-footer">
        <span>Memory integrity · {quality} fidelity</span>
        <span className="integrity-value">Archive link stable</span>
      </footer>
      <div className="reset-curtain" aria-hidden="true" />
      <div className="sr-only" role="status" aria-live="polite">
        {audioAnnouncement}
      </div>
    </main>
  )
}
```

The authoritative file includes additional diagnostic data attributes only; the render
structure above is the actual shared layout used for every state.
