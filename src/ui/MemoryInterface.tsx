import { FRAGMENT_PROTOTYPES, getFragmentPrototype } from '../content/fragments'
import { deriveEndingConfiguration } from '../reconstruction/endingProfiles'
import { selectCollectionProgress, useExperienceStore } from '../state/experienceStore'
import {
  selectFearShield,
  setReconstructionHold,
  setTrialPointer,
} from '../trials/trialControls'
import { FEAR_DIRECTIONS, TRIAL_DEFINITIONS } from '../trials/trialConfig'
import { trialRuntime } from '../trials/trialRuntime'

const orderNumerals = ['I', 'II', 'III'] as const
const orderRoles = ['Foundation', 'Secondary', 'Final accent'] as const

function MemoryOrder({ compact = false }: { compact?: boolean }) {
  const collectionOrder = useExperienceStore((state) => state.collectionOrder)
  return (
    <ol
      className={`memory-order${compact ? ' memory-order--compact' : ''}`}
      aria-label="Chosen memory order"
      data-count={collectionOrder.length}
    >
      {orderNumerals.map((numeral, index) => {
        const id = collectionOrder[index]
        const fragment = id ? getFragmentPrototype(id) : null
        return (
          <li key={numeral} className={fragment ? `is-filled is-${fragment.id}` : ''}>
            <span>{numeral}</span>
            <strong>{fragment?.label ?? 'Awaiting return'}</strong>
            <small>{orderRoles[index]}</small>
          </li>
        )
      })}
    </ol>
  )
}

function ChamberInterface() {
  const phase = useExperienceStore((state) => state.phase)
  const entranceComplete = useExperienceStore((state) => state.entranceComplete)
  const collected = useExperienceStore((state) => state.collectedFragments)
  const inputLocked = useExperienceStore((state) => state.inputLocked)
  const progress = useExperienceStore(selectCollectionProgress)

  return (
    <>
      <div
        className="memory-progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={3}
        aria-valuenow={progress}
        aria-label={`${progress} of 3 memories recovered`}
      >
        <span>FELICIA · memories embodied</span>
        <strong>{progress} / 3</strong>
        <div className="memory-progress__marks" aria-hidden="true">
          {FRAGMENT_PROTOTYPES.map((fragment) => (
            <i
              key={fragment.id}
              className={
                collected.includes(fragment.id) ? `is-collected is-${fragment.id}` : ''
              }
            />
          ))}
        </div>
      </div>
      <MemoryOrder />

      {phase === 'chamber' && !entranceComplete && (
        <div className="awakening-copy" aria-live="polite">
          <span>FELICIA · consciousness fragment</span>
          <p>I have three memories left.</p>
        </div>
      )}

      {phase === 'chamber' && entranceComplete && progress < 3 && (
        <div className="fragment-selector">
          <div className="selection-guidance">
            <p>
              {progress === 0
                ? 'Choose which memory becomes my foundation.'
                : 'Choose the next memory trial.'}
            </p>
            <span>
              {progress === 0
                ? 'Enter a portal. What returns will permanently change FELICIA.'
                : 'The recovered memories will influence what follows.'}
            </span>
          </div>
          <div className="fragment-selector__controls">
            {FRAGMENT_PROTOTYPES.map((fragment) => {
              const recovered = collected.includes(fragment.id)
              return (
                <button
                  key={fragment.id}
                  className={`fragment-control fragment-control--${fragment.id}`}
                  type="button"
                  disabled={recovered || inputLocked}
                  data-fragment={fragment.id}
                  aria-label={`${fragment.label}, ${
                    recovered ? 'recovered' : 'enter memory trial'
                  }`}
                  onClick={() =>
                    useExperienceStore.getState().requestFragment(fragment.id)
                  }
                >
                  <span>{fragment.index}</span>
                  <strong>{fragment.label}</strong>
                  <small>{recovered ? 'Embodied' : 'Enter trial'}</small>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {phase === 'chamber' && (
        <p className="felicia-identification">
          <span>FELICIA</span>
          Central consciousness
        </p>
      )}
    </>
  )
}

function TrialInterface() {
  const phase = useExperienceStore((state) => state.phase)
  const fragment = useExperienceStore((state) => state.activeFragment)
  const beat = useExperienceStore((state) => state.trialBeat)
  const score = useExperienceStore((state) => state.trialScore)
  const assisted = useExperienceStore((state) => state.trialAssisted)
  const order = useExperienceStore((state) => state.collectionOrder)
  if (!fragment) return null

  const definition = TRIAL_DEFINITIONS[fragment]
  const activeBeat = definition.beats[Math.min(beat, 2)]
  const transitioning = phase === 'trial-departure' || phase === 'trial-arrival'
  const returning = phase === 'trial-completing' || phase === 'trial-returning'
  const foundation = order[0]

  const updatePointer = (clientX: number, clientY: number, element: HTMLElement) => {
    const bounds = element.getBoundingClientRect()
    const x = ((clientX - bounds.left) / Math.max(bounds.width, 1)) * 2 - 1
    const y = -(((clientY - bounds.top) / Math.max(bounds.height, 1)) * 2 - 1)
    setTrialPointer(x, y)
  }

  return (
    <div className={`trial-interface trial-interface--${fragment}`} aria-live="polite">
      <header className="trial-interface__header">
        <span>
          Memory trial · {definition.world}
          {foundation && foundation !== fragment
            ? ` · ${getFragmentPrototype(foundation).label} foundation active`
            : ''}
        </span>
        <strong>{definition.label}</strong>
      </header>

      {transitioning && (
        <div className="trial-transition-copy">
          <span>
            {phase === 'trial-departure' ? 'Entering memory' : 'Signal settling'}
          </span>
          <strong>
            {fragment === 'identity'
              ? 'Follow the mirrored plane'
              : fragment === 'fear'
                ? 'Pass through the shield aperture'
                : 'Rise along the living filament'}
          </strong>
        </div>
      )}

      {phase === 'trial-active' && (
        <>
          <div className="trial-narrative">
            <span>
              Beat {beat + 1} / 3 · {definition.verb}
            </span>
            <blockquote>{activeBeat.revelation}</blockquote>
            <p>{activeBeat.instruction}</p>
          </div>

          <div
            className="trial-control-surface"
            role="group"
            aria-label={`${definition.label} trial interaction`}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId)
              updatePointer(event.clientX, event.clientY, event.currentTarget)
            }}
            onPointerMove={(event) => {
              if (
                event.pointerType === 'mouse' ||
                event.currentTarget.hasPointerCapture(event.pointerId)
              ) {
                updatePointer(event.clientX, event.clientY, event.currentTarget)
              }
            }}
          >
            {fragment === 'identity' && (
              <div className="identity-control">
                <button
                  type="button"
                  aria-label="Rotate alignment left"
                  onClick={() =>
                    setTrialPointer(Math.max(-1, trialRuntime.pointerX - 0.3), 0)
                  }
                >
                  ←
                </button>
                <span>
                  Move through the illuminated axis
                  <small>Pointer, drag, or ← →</small>
                </span>
                <button
                  type="button"
                  aria-label="Rotate alignment right"
                  onClick={() =>
                    setTrialPointer(Math.min(1, trialRuntime.pointerX + 0.3), 0)
                  }
                >
                  →
                </button>
              </div>
            )}
            {fragment === 'fear' && (
              <div className="fear-control">
                {FEAR_DIRECTIONS.map((direction) => (
                  <button
                    key={direction}
                    type="button"
                    className={trialRuntime.fearShield === direction ? 'is-active' : ''}
                    onPointerDown={() => selectFearShield(direction)}
                    onClick={() => selectFearShield(direction)}
                  >
                    {direction === 'left' ? '←' : direction === 'right' ? '→' : '↑'}
                    <small>{direction} shield</small>
                  </button>
                ))}
              </div>
            )}
            {fragment === 'hope' && (
              <div className="hope-control">
                <span>Guide the signal through the open light</span>
                <small>Move, drag, or use ← →</small>
              </div>
            )}
          </div>
          <div
            className="trial-beat-meter"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={3}
            aria-valuenow={beat}
            aria-label={`${beat} of 3 trial beats completed`}
          >
            {definition.beats.map((_, index) => (
              <i
                key={index}
                className={
                  index < beat ? 'is-complete' : index === beat ? 'is-active' : ''
                }
              />
            ))}
          </div>
        </>
      )}

      {returning && (
        <div className="trial-completion-copy">
          <span>
            {phase === 'trial-completing' ? 'Memory resolved' : 'Returning to FELICIA'}
          </span>
          <strong>
            {phase === 'trial-completing'
              ? `${definition.label} · ${assisted ? 'assisted resonance' : score >= 94 ? 'resonant' : 'stable'}`
              : fragment === 'identity'
                ? 'The pleating law is settling into FELICIA'
                : fragment === 'fear'
                  ? 'The compression scar is becoming a permanent shelter'
                  : 'The opened seam is becoming a path beyond FELICIA'}
          </strong>
        </div>
      )}
    </div>
  )
}

function ReconstructionInterface() {
  const phase = useExperienceStore((state) => state.phase)
  const order = useExperienceStore((state) => state.collectionOrder)
  const index = useExperienceStore((state) => state.reconstructionMemoryIndex)
  const sync = useExperienceStore((state) => state.reconstructionSync)
  const holding = useExperienceStore((state) => state.reconstructionHolding)
  const foundation = order[0] ? getFragmentPrototype(order[0]) : null
  const active =
    index >= 0 && order[index] ? getFragmentPrototype(order[index]) : foundation

  if (phase === 'ready-for-reconstruction') {
    return (
      <div className="memory-set-complete" aria-live="assertive">
        <span className="memory-set-complete__eyebrow">All trials returned</span>
        <h2>Memory set complete</h2>
        <MemoryOrder compact />
        <p>
          {foundation?.label} is FELICIA’s foundation.
          <span> Prepare to steady the crease that will govern her form.</span>
        </p>
        <i aria-hidden="true" />
      </div>
    )
  }

  if (phase === 'reconstruction-synchronizing') {
    const role = index === 0 ? 'Foundation' : index === 1 ? 'Secondary' : 'Final accent'
    return (
      <div className="synchronization-interface" aria-live="polite">
        <span>Active reconstruction</span>
        <strong>
          {role} — {active?.label}
        </strong>
        <p>Hold to steady the travelling crease as the world turns through FELICIA.</p>
        <button
          type="button"
          className={holding ? 'is-holding' : ''}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId)
            setReconstructionHold(true)
          }}
          onPointerUp={() => setReconstructionHold(false)}
          onPointerCancel={() => setReconstructionHold(false)}
          onKeyDown={(event) => {
            if (event.code === 'Space' || event.code === 'Enter') {
              event.preventDefault()
              setReconstructionHold(true)
            }
          }}
          onKeyUp={() => setReconstructionHold(false)}
          onClick={() => {
            const state = useExperienceStore.getState()
            state.setReconstructionSync(state.reconstructionSync + 0.035)
          }}
        >
          <span>{holding ? 'Holding the fold' : 'Hold to steady the fold'}</span>
          <i style={{ '--sync': sync } as React.CSSProperties} />
        </button>
        <div
          className="synchronization-meter"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(sync * 100)}
        >
          <i style={{ width: `${Math.round(sync * 100)}%` }} />
        </div>
        <MemoryOrder compact />
      </div>
    )
  }

  return (
    <div
      className={`reconstruction-status${index === 0 ? ' is-foundation' : ''}`}
      aria-live="assertive"
    >
      <span>Reconstruction · the world is turning inside out</span>
      <strong>
        {phase === 'reconstruction-initiating'
          ? `Foundation — ${foundation?.label ?? ''}`
          : phase === 'reconstruction-collapse'
            ? `${foundation?.label ?? ''} is imposing the first folding law`
            : phase === 'reconstruction-void'
              ? 'The old surface has released'
              : phase === 'reconstruction-recall'
                ? `${index === 0 ? 'Foundation' : index === 1 ? 'Secondary' : 'Final accent'} — ${active?.label ?? ''}`
                : phase === 'reconstruction-rebuilding'
                  ? `The field is reforming under ${foundation?.label ?? ''}`
                  : 'Living consciousness resolved'}
      </strong>
      <div className="reconstruction-status__order">
        {order.map((fragment, orderIndex) => (
          <i
            key={fragment}
            className={`is-${fragment}${orderIndex === index ? ' is-active' : ''}`}
          >
            {orderNumerals[orderIndex]} · {getFragmentPrototype(fragment).label}
          </i>
        ))}
      </div>
    </div>
  )
}

function EndingInterface() {
  const order = useExperienceStore((state) => state.collectionOrder)
  const finalTextStep = useExperienceStore((state) => state.finalTextStep)
  const replayAvailable = useExperienceStore((state) => state.replayAvailable)
  const explorable = useExperienceStore((state) => state.endingExplorationReady)
  const ending = deriveEndingConfiguration(order)
  if (!ending) return null

  return (
    <div className="ending-interface" aria-live="polite">
      <p className="ending-foundation">
        Living consciousness · {ending.profile.label} foundation
      </p>
      {explorable && <p className="ending-explore-cue">Move to inspect what survived.</p>}
      <blockquote>
        <p className={finalTextStep >= 1 ? 'is-visible' : ''}>
          You did not recover my memory.
        </p>
        <p className={finalTextStep >= 2 ? 'is-visible' : ''}>
          You decided which part of me survived.
        </p>
      </blockquote>
      <p className={`ending-supporting${finalTextStep >= 2 ? ' is-visible' : ''}`}>
        {ending.orderExplanation}
      </p>
      <div className="ending-actions">
        <span>{ending.signature}</span>
        {replayAvailable && (
          <button
            type="button"
            onClick={() => useExperienceStore.getState().requestReplay()}
          >
            Reenter memory <i aria-hidden="true">↺</i>
          </button>
        )}
      </div>
    </div>
  )
}

export function MemoryInterface() {
  const phase = useExperienceStore((state) => state.phase)
  const notice = useExperienceStore((state) => state.interactionNotice)
  const feedbackId = useExperienceStore((state) => state.interactionFeedbackId)
  if (phase === 'loading' || phase === 'intro') return null

  const isTrial = phase.startsWith('trial-')
  const isReconstruction =
    phase === 'ready-for-reconstruction' || phase.startsWith('reconstruction-')

  return (
    <section
      className={`memory-interface memory-interface--${phase}`}
      aria-label="FELICIA memory trial controls"
    >
      {phase === 'chamber' && <ChamberInterface />}
      {isTrial && <TrialInterface />}
      {isReconstruction && <ReconstructionInterface />}
      {phase === 'ending' && <EndingInterface />}
      <div className="sr-only" role="status" aria-live="assertive">
        {phase === 'trial-active'
          ? 'Trial active. Complete three forgiving interaction beats.'
          : phase === 'reconstruction-synchronizing'
            ? 'Hold Space, Enter, pointer, or touch to synchronize the memory streams.'
            : phase === 'ending'
              ? 'Reconstruction complete. Move the pointer or touch to inspect FELICIA.'
              : ''}
      </div>
      {notice && phase !== 'ending' && (
        <p
          key={feedbackId}
          className="interaction-feedback"
          role="status"
          aria-live="polite"
        >
          <i aria-hidden="true" />
          {notice}
        </p>
      )}
    </section>
  )
}
