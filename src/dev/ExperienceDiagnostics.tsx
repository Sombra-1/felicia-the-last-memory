import { feliciaAudioEngine } from '../audio/FeliciaAudioEngine'
import { useExperienceStore } from '../state/experienceStore'
import { useRuntimeDiagnostics } from './runtimeDiagnostics'

function gain(value: number) {
  return value.toFixed(4)
}

export function ExperienceDiagnostics() {
  if (!import.meta.env.DEV) return null

  return <ExperienceDiagnosticsPanel />
}

function ExperienceDiagnosticsPanel() {
  const phase = useExperienceStore((state) => state.phase)
  const inputLocked = useExperienceStore((state) => state.inputLocked)
  const audioContextStatus = useExperienceStore((state) => state.audioContextStatus)
  const masterGain = useExperienceStore((state) => state.masterGain)
  const ambientGain = useExperienceStore((state) => state.ambientGain)
  const cueGain = useExperienceStore((state) => state.cueGain)
  const lastAudioEvent = useExperienceStore((state) => state.lastAudioEvent)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const collectionOrder = useExperienceStore((state) => state.collectionOrder)
  const runtime = useRuntimeDiagnostics()

  return (
    <>
      <style>{diagnosticsStyles}</style>
      <aside className="experience-diagnostics" aria-label="Development diagnostics">
        <strong>Rescue diagnostics</strong>
        <dl>
          <div>
            <dt>Phase</dt>
            <dd>{phase}</dd>
          </div>
          <div>
            <dt>Input lock</dt>
            <dd>{String(inputLocked)}</dd>
          </div>
          <div>
            <dt>GSAP</dt>
            <dd>{runtime.activeSequence}</dd>
          </div>
          <div>
            <dt>Camera owner</dt>
            <dd>{runtime.cameraOwner}</dd>
          </div>
          <div>
            <dt>Sound state</dt>
            <dd>{audioContextStatus}</dd>
          </div>
          <div>
            <dt>Master</dt>
            <dd>{gain(masterGain)}</dd>
          </div>
          <div>
            <dt>Ambient</dt>
            <dd>{gain(ambientGain)}</dd>
          </div>
          <div>
            <dt>Cue</dt>
            <dd>{gain(cueGain)}</dd>
          </div>
          <div>
            <dt>Audio event</dt>
            <dd>{lastAudioEvent}</dd>
          </div>
          <div>
            <dt>Fragment</dt>
            <dd>{activeFragment ?? 'none'}</dd>
          </div>
          <div>
            <dt>Order</dt>
            <dd>{collectionOrder.join(' → ') || 'none'}</dd>
          </div>
        </dl>
        <button
          className="experience-diagnostics__calibrate"
          type="button"
          onClick={async () => {
            const ready = await feliciaAudioEngine.unlock()
            if (ready) feliciaAudioEngine.playCalibrationSequence()
          }}
        >
          Play calibration sequence
        </button>
      </aside>
    </>
  )
}

const diagnosticsStyles = `
  .experience-diagnostics {
    position: fixed;
    z-index: 30;
    right: 1rem;
    bottom: 1rem;
    width: min(23rem, calc(100vw - 2rem));
    max-height: 46vh;
    overflow: auto;
    border: 1px solid rgb(210 202 225 / 24%);
    padding: 0.85rem;
    color: #e6e0ec;
    background: rgb(7 7 10 / 92%);
    box-shadow: 0 1rem 3rem rgb(0 0 0 / 48%);
    font-family: var(--mono);
    font-size: 0.58rem;
    letter-spacing: 0.06em;
    backdrop-filter: blur(14px);
    pointer-events: none;
  }

  .experience-diagnostics > strong {
    display: block;
    margin-bottom: 0.7rem;
    color: #f0ebf4;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .experience-diagnostics dl {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.35rem 0.8rem;
    margin: 0;
  }

  .experience-diagnostics dl > div {
    min-width: 0;
  }

  .experience-diagnostics dt {
    color: #81788a;
  }

  .experience-diagnostics dd {
    overflow: hidden;
    margin: 0.12rem 0 0;
    color: #cfc8d6;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .experience-diagnostics__calibrate {
    width: 100%;
    margin-top: 0.8rem;
    border: 1px solid rgb(210 202 225 / 24%);
    padding: 0.55rem 0.75rem;
    color: #e6e0ec;
    background: rgb(255 255 255 / 4%);
    cursor: pointer;
    font: inherit;
    letter-spacing: inherit;
    text-transform: uppercase;
    pointer-events: auto;
  }
`
