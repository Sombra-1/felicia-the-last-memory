import { FRAGMENT_PROTOTYPES, getFragmentPrototype } from '../content/fragments'
import { deriveEndingConfiguration } from '../reconstruction/endingProfiles'
import { selectCollectionProgress, useExperienceStore } from '../state/experienceStore'

export function MemoryInterface() {
  const phase = useExperienceStore((state) => state.phase)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const collectedFragments = useExperienceStore((state) => state.collectedFragments)
  const collectionOrder = useExperienceStore((state) => state.collectionOrder)
  const inputLocked = useExperienceStore((state) => state.inputLocked)
  const fragmentTextVisible = useExperienceStore((state) => state.fragmentTextVisible)
  const instructionDismissed = useExperienceStore((state) => state.instructionDismissed)
  const finalTextStep = useExperienceStore((state) => state.finalTextStep)
  const replayAvailable = useExperienceStore((state) => state.replayAvailable)
  const interactionNotice = useExperienceStore((state) => state.interactionNotice)
  const interactionFeedbackId = useExperienceStore((state) => state.interactionFeedbackId)
  const progress = useExperienceStore(selectCollectionProgress)
  const activeMemory = activeFragment ? getFragmentPrototype(activeFragment) : null
  const ending = deriveEndingConfiguration(collectionOrder)
  const chamberVisible = phase === 'chamber' || phase === 'ready-for-reconstruction'
  const revealComplete =
    activeFragment !== null && collectedFragments.includes(activeFragment)
  const ordinaryInterfaceVisible =
    !phase.startsWith('reconstruction-') && phase !== 'ending' && phase !== 'resetting'

  if (phase === 'loading' || phase === 'intro') return null

  return (
    <section
      className={`memory-interface memory-interface--${phase}`}
      aria-label="Memory recovery controls"
    >
      {ordinaryInterfaceVisible && (
        <div
          className="memory-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={3}
          aria-valuenow={progress}
          aria-label={`${progress} of 3 memories recovered`}
        >
          <span>Memory</span>
          <strong>{progress} / 3</strong>
          <div className="memory-progress__marks" aria-hidden="true">
            {FRAGMENT_PROTOTYPES.map((fragment) => (
              <i
                key={fragment.id}
                className={
                  collectedFragments.includes(fragment.id)
                    ? `is-collected is-${fragment.id}`
                    : ''
                }
              />
            ))}
          </div>
        </div>
      )}

      {chamberVisible && phase !== 'ready-for-reconstruction' && (
        <div className="fragment-selector">
          {!instructionDismissed && (
            <p className="selection-prompt">Select a memory fragment</p>
          )}
          <div className="fragment-selector__controls">
            {FRAGMENT_PROTOTYPES.map((fragment) => {
              const collected = collectedFragments.includes(fragment.id)
              return (
                <button
                  key={fragment.id}
                  className={`fragment-control fragment-control--${fragment.id}`}
                  type="button"
                  disabled={collected || inputLocked}
                  data-fragment={fragment.id}
                  aria-label={`${fragment.label}, ${
                    collected ? 'recovered' : 'available'
                  }`}
                  onClick={() =>
                    useExperienceStore.getState().requestFragment(fragment.id)
                  }
                >
                  <span>{fragment.index}</span>
                  <strong>{fragment.label}</strong>
                  <small>{collected ? 'Recovered' : 'Available'}</small>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {activeMemory && (
        <div
          className={`memory-reveal${fragmentTextVisible ? ' is-visible' : ''}`}
          aria-live="polite"
        >
          <p className="memory-reveal__index">
            {activeMemory.index} · {activeMemory.label}
          </p>
          <blockquote>
            <p>{activeMemory.text}</p>
            <p>{activeMemory.secondaryText}</p>
          </blockquote>
          <div className="memory-reveal__status">
            <span>
              {phase === 'approaching-fragment'
                ? 'Establishing connection'
                : phase === 'returning-to-chamber'
                  ? 'Restoring chamber'
                  : revealComplete
                    ? 'Memory recovered'
                    : 'Reading fragment'}
            </span>
            {phase === 'revealing-fragment' && revealComplete && (
              <button
                className="return-control"
                type="button"
                onClick={() => useExperienceStore.getState().requestReturn()}
              >
                Continue
                <span aria-hidden="true">↘</span>
              </button>
            )}
          </div>
        </div>
      )}

      {phase === 'ready-for-reconstruction' && (
        <div className="reconstruction-trigger" aria-live="polite">
          <p>The chamber remembers your order.</p>
          <span>{collectionOrder.join(' · ')}</span>
          <button
            type="button"
            disabled={inputLocked}
            onClick={() => useExperienceStore.getState().beginReconstruction()}
          >
            Complete reconstruction
            <i aria-hidden="true">↗</i>
          </button>
        </div>
      )}

      {phase.startsWith('reconstruction-') && (
        <div className="reconstruction-status" aria-live="assertive">
          <span>Reconstruction</span>
          <strong>
            {phase === 'reconstruction-initiating'
              ? 'Recognition'
              : phase === 'reconstruction-collapse'
                ? 'Chamber integrity failing'
                : phase === 'reconstruction-void'
                  ? 'Signal remaining'
                  : phase === 'reconstruction-recall'
                    ? 'Memory order recalled'
                    : phase === 'reconstruction-rebuilding'
                      ? 'Consciousness reforming'
                      : 'Foundation resolved'}
          </strong>
        </div>
      )}

      {phase === 'ending' && ending && (
        <div className="ending-interface" aria-live="polite">
          <p className="ending-foundation">Foundation · {ending.profile.label}</p>
          <blockquote>
            <p className={finalTextStep >= 1 ? 'is-visible' : ''}>
              You did not recover my memory.
            </p>
            <p className={finalTextStep >= 2 ? 'is-visible' : ''}>
              You decided which part of me survived.
            </p>
          </blockquote>
          <p className={`ending-supporting${finalTextStep >= 2 ? ' is-visible' : ''}`}>
            {ending.profile.supportingLine}
          </p>
          <div className="ending-actions">
            <span>{ending.signature}</span>
            <button
              type="button"
              disabled={!replayAvailable}
              onClick={() => useExperienceStore.getState().requestReplay()}
            >
              Reenter memory
              <i aria-hidden="true">↺</i>
            </button>
          </div>
        </div>
      )}

      <div className="sr-only" role="status" aria-live="assertive">
        {phase === 'reconstruction-initiating'
          ? 'Reconstruction initiated. Input is locked during the sequence.'
          : phase === 'ending'
            ? `Reconstruction complete. Foundation ${ending?.profile.label ?? ''}.`
            : ''}
      </div>
      {interactionNotice && phase !== 'ending' && (
        <p
          key={interactionFeedbackId}
          className="interaction-feedback"
          role="status"
          aria-live="polite"
        >
          <i aria-hidden="true" />
          {interactionNotice}
        </p>
      )}
    </section>
  )
}
