import type { PropsWithChildren } from 'react'
import { feliciaAudioEngine } from '../audio/FeliciaAudioEngine'
import { useExperienceStore } from '../state/experienceStore'
import { MemoryInterface } from './MemoryInterface'

export function ExperienceShell({ children }: PropsWithChildren) {
  const audioEnabled = useExperienceStore((state) => state.audioEnabled)
  const hasUserInteracted = useExperienceStore((state) => state.hasUserInteracted)
  const audioStatus = useExperienceStore((state) => state.audioContextStatus)
  const ambientStartCount = useExperienceStore((state) => state.ambientStartCount)
  const lastAudioEvent = useExperienceStore((state) => state.lastAudioEvent)
  const phase = useExperienceStore((state) => state.phase)
  const quality = useExperienceStore((state) => state.quality)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const inputLocked = useExperienceStore((state) => state.inputLocked)
  const cameraRestored = useExperienceStore((state) => state.chamberCameraRestored)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const endingProfile = useExperienceStore((state) => state.endingProfileId)
  const replayAvailable = useExperienceStore((state) => state.replayAvailable)
  const setAudioEnabled = useExperienceStore((state) => state.setAudioEnabled)

  return (
    <main
      className="experience-shell"
      data-phase={phase}
      data-quality={quality}
      data-reduced-motion={reducedMotion}
      data-input-locked={inputLocked}
      data-camera-restored={cameraRestored}
      data-active-fragment={activeFragment ?? 'none'}
      data-ending-profile={endingProfile ?? 'none'}
      data-replay-available={replayAvailable}
      data-audio-status={audioStatus}
      data-audio-enabled={audioEnabled}
      data-ambient-start-count={ambientStartCount}
      data-last-audio-event={lastAudioEvent}
    >
      <div className="noise" aria-hidden="true" />
      {children}

      <header className="site-header">
        <a className="wordmark" href="#memory" aria-label="FELICIA home">
          <span>FELICIA</span>
          <small>The Last Memory</small>
        </a>
        {hasUserInteracted && (
          <button
            className="text-control sound-control"
            type="button"
            aria-pressed={!audioEnabled}
            aria-label={
              audioStatus === 'unavailable'
                ? 'Sound unavailable'
                : audioEnabled
                  ? 'Mute ambient sound'
                  : 'Enable ambient sound'
            }
            disabled={audioStatus === 'unavailable'}
            onClick={() => setAudioEnabled(!audioEnabled)}
          >
            <span className="sound-control__icon" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>
              {audioStatus === 'unavailable'
                ? 'Sound unavailable'
                : audioEnabled
                  ? 'Sound on'
                  : 'Sound off'}
            </span>
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
        <button
          className="enter-button"
          type="button"
          onPointerDown={() => void feliciaAudioEngine.unlock()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              void feliciaAudioEngine.unlock()
            }
          }}
          onClick={() => {
            const store = useExperienceStore.getState()
            store.registerUserInteraction()
            store.enterChamber()
          }}
        >
          <span>Enter memory</span>
          <span aria-hidden="true">↗</span>
        </button>
      </section>

      <MemoryInterface />

      <footer className="site-footer">
        <span>Memory integrity · {quality} fidelity</span>
        <span className="integrity-value">
          {phase === 'loading' ? '03 fragments detected' : 'Archive link stable'}
        </span>
      </footer>
      <div className="reset-curtain" aria-hidden="true" />
    </main>
  )
}
