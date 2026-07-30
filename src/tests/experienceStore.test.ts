import { beforeEach, describe, expect, it } from 'vitest'
import {
  fragmentIds,
  selectAllFragmentsCollected,
  selectCollectionProgress,
  selectFirstSelectedFragment,
  selectMostRecentFragment,
  selectRemainingFragments,
  type FragmentId,
  useExperienceStore,
} from '../state/experienceStore'

const collectionOrders: FragmentId[][] = [
  ['identity', 'fear', 'hope'],
  ['identity', 'hope', 'fear'],
  ['fear', 'identity', 'hope'],
  ['fear', 'hope', 'identity'],
  ['hope', 'identity', 'fear'],
  ['hope', 'fear', 'identity'],
]

function completeFragment(fragment: FragmentId) {
  const store = useExperienceStore.getState()
  expect(store.requestFragment(fragment)).toBe(true)
  expect(useExperienceStore.getState().phase).toBe('trial-departure')
  expect(useExperienceStore.getState().inputLocked).toBe(true)
  expect(useExperienceStore.getState().beginTrialArrival(fragment)).toBe(true)
  expect(useExperienceStore.getState().beginTrial(fragment)).toBe(true)
  expect(useExperienceStore.getState().phase).toBe('trial-active')
  expect(useExperienceStore.getState().completeTrialBeat()).toBe(true)
  expect(useExperienceStore.getState().completeTrialBeat()).toBe(true)
  expect(useExperienceStore.getState().completeTrialBeat()).toBe(true)
  expect(useExperienceStore.getState().phase).toBe('trial-completing')
  expect(useExperienceStore.getState().beginTrialReturn(fragment)).toBe(true)
  expect(useExperienceStore.getState().phase).toBe('trial-returning')
  expect(useExperienceStore.getState().completeTrialReturn(fragment)).toBe(true)
}

describe('experience state machine', () => {
  beforeEach(() => {
    useExperienceStore.getState().resetExperience()
  })

  it('starts with no collected fragments and a restored chamber camera', () => {
    const state = useExperienceStore.getState()

    expect(state.collectedFragments).toEqual([])
    expect(state.collectionOrder).toEqual([])
    expect(state.activeFragment).toBeNull()
    expect(state.inputLocked).toBe(false)
    expect(state.chamberCameraRestored).toBe(true)
    expect(state.memorySetComplete).toBe(false)
    expect(selectCollectionProgress(state)).toBe(0)
  })

  it('locks transitions, unlocks gameplay, and commits only after physical return', () => {
    useExperienceStore.getState().enterChamber()
    expect(useExperienceStore.getState().requestFragment('identity')).toBe(true)
    expect(useExperienceStore.getState().requestFragment('fear')).toBe(false)
    expect(useExperienceStore.getState().interactionNotice).toMatch(
      /transition is still resolving/i,
    )
    expect(useExperienceStore.getState().inputLocked).toBe(true)

    useExperienceStore.getState().beginTrialArrival('identity')
    useExperienceStore.getState().beginTrial('identity')
    expect(useExperienceStore.getState().inputLocked).toBe(false)
    expect(useExperienceStore.getState().collectionOrder).toEqual([])
    useExperienceStore.getState().completeTrialBeat()
    useExperienceStore.getState().completeTrialBeat()
    useExperienceStore.getState().completeTrialBeat()
    expect(useExperienceStore.getState().inputLocked).toBe(true)
    useExperienceStore.getState().beginTrialReturn('identity')
    useExperienceStore.getState().completeTrialReturn('identity')
    expect(useExperienceStore.getState().inputLocked).toBe(false)
    expect(useExperienceStore.getState().collectionOrder).toEqual(['identity'])
  })

  it('acknowledges accepted actions and records rejected repeated input', () => {
    useExperienceStore.getState().enterChamber()
    const entryFeedback = useExperienceStore.getState().interactionFeedbackId

    expect(useExperienceStore.getState().requestFragment('fear')).toBe(true)
    const accepted = useExperienceStore.getState()
    expect(accepted.interactionNotice).toBe('FEAR LINK ESTABLISHED')
    expect(accepted.interactionFeedbackId).toBeGreaterThan(entryFeedback)

    expect(useExperienceStore.getState().requestFragment('hope')).toBe(false)
    const rejected = useExperienceStore.getState()
    expect(rejected.interactionNotice).toMatch(/still resolving/i)
    expect(rejected.interactionFeedbackId).toBeGreaterThan(accepted.interactionFeedbackId)
  })

  it('appends a completed fragment exactly once and blocks reactivation', () => {
    useExperienceStore.getState().enterChamber()
    completeFragment('hope')

    expect(useExperienceStore.getState().collectionOrder).toEqual(['hope'])
    expect(useExperienceStore.getState().requestFragment('hope')).toBe(false)
    expect(useExperienceStore.getState().completeTrialBeat()).toBe(false)
    expect(useExperienceStore.getState().collectionOrder).toEqual(['hope'])
  })

  it.each(collectionOrders)(
    'completes the unique collection order %s',
    (...order: unknown[]) => {
      const fragments = order as FragmentId[]
      useExperienceStore.getState().enterChamber()

      fragments.forEach((fragment, index) => {
        completeFragment(fragment)
        const state = useExperienceStore.getState()
        expect(selectCollectionProgress(state)).toBe(index + 1)
        expect(selectMostRecentFragment(state)).toBe(fragment)
        expect(selectAllFragmentsCollected(state)).toBe(index === 2)
        expect(selectRemainingFragments(state)).toEqual(
          fragmentIds.filter(
            (candidate) => !fragments.slice(0, index + 1).includes(candidate),
          ),
        )
      })

      const finalState = useExperienceStore.getState()
      expect(finalState.collectionOrder).toEqual(fragments)
      expect(selectFirstSelectedFragment(finalState)).toBe(fragments[0])
      expect(finalState.phase).toBe('ready-for-reconstruction')
      expect(finalState.chamberCameraRestored).toBe(true)
      expect(finalState.inputLocked).toBe(true)
      expect(finalState.memorySetComplete).toBe(true)
      expect(finalState.interactionNotice).toBe('MEMORY SET COMPLETE')
    },
  )

  it('names each recorded memory role as the order is established', () => {
    useExperienceStore.getState().enterChamber()

    completeFragment('fear')
    expect(useExperienceStore.getState().interactionNotice).toBe(
      'FEAR RECORDED AS FOUNDATION',
    )

    completeFragment('hope')
    expect(useExperienceStore.getState().interactionNotice).toBe(
      'HOPE RECORDED AS SECONDARY MEMORY',
    )
  })

  it('does not reach all-collected state with fewer than three unique fragments', () => {
    useExperienceStore.getState().enterChamber()
    completeFragment('identity')
    completeFragment('fear')

    expect(selectAllFragmentsCollected(useExperienceStore.getState())).toBe(false)
    expect(useExperienceStore.getState().phase).toBe('chamber')
  })

  it('reset restores interaction state while preserving user preferences', () => {
    useExperienceStore.getState().setAudioEnabled(false)
    useExperienceStore.getState().setReducedMotion(true)
    useExperienceStore.getState().setQuality('low')
    useExperienceStore.getState().enterChamber()
    completeFragment('fear')

    useExperienceStore.getState().resetExperience()
    const state = useExperienceStore.getState()

    expect(state.phase).toBe('loading')
    expect(state.collectedFragments).toEqual([])
    expect(state.collectionOrder).toEqual([])
    expect(state.activeFragment).toBeNull()
    expect(state.inputLocked).toBe(false)
    expect(state.instructionDismissed).toBe(false)
    expect(state.memorySetComplete).toBe(false)
    expect(state.audioEnabled).toBe(false)
    expect(state.reducedMotion).toBe(true)
    expect(state.quality).toBe('low')
  })
})
