import { beforeEach, describe, expect, it } from 'vitest'
import {
  deriveEndingConfiguration,
  ENDING_PROFILES,
} from '../reconstruction/endingProfiles'
import { getReconstructionDurations } from '../reconstruction/reconstructionConfig'
import { type FragmentId, useExperienceStore } from '../state/experienceStore'

const orders: Array<[FragmentId, FragmentId, FragmentId]> = [
  ['identity', 'fear', 'hope'],
  ['identity', 'hope', 'fear'],
  ['fear', 'identity', 'hope'],
  ['fear', 'hope', 'identity'],
  ['hope', 'identity', 'fear'],
  ['hope', 'fear', 'identity'],
]

function collect(order: readonly FragmentId[]) {
  useExperienceStore.getState().enterChamber()
  order.forEach((fragment) => {
    expect(useExperienceStore.getState().requestFragment(fragment)).toBe(true)
    expect(useExperienceStore.getState().beginFragmentReveal(fragment)).toBe(true)
    expect(useExperienceStore.getState().completeFragmentReveal(fragment)).toBe(true)
    expect(useExperienceStore.getState().requestReturn()).toBe(true)
    expect(useExperienceStore.getState().completeReturn(fragment)).toBe(true)
  })
}

function finishReconstruction() {
  const store = useExperienceStore.getState()
  expect(store.beginReconstruction()).toBe(true)
  expect(useExperienceStore.getState().completeRecognition()).toBe(true)
  expect(useExperienceStore.getState().completeCollapse()).toBe(true)
  expect(useExperienceStore.getState().completeVoid()).toBe(true)
  expect(useExperienceStore.getState().completeRecall()).toBe(true)
  expect(useExperienceStore.getState().completeRebuild()).toBe(true)
  expect(useExperienceStore.getState().completeReveal()).toBe(true)
  expect(useExperienceStore.getState().revealFinalText(2)).toBe(true)
}

describe('order-dependent reconstruction', () => {
  beforeEach(() => useExperienceStore.getState().resetExperience())

  it('cannot begin before three unique memories and a restored chamber', () => {
    useExperienceStore.getState().enterChamber()
    expect(useExperienceStore.getState().beginReconstruction()).toBe(false)
    collect(['identity', 'fear'])
    expect(useExperienceStore.getState().beginReconstruction()).toBe(false)
  })

  it.each(orders)('derives deterministic modifiers for %s', (...values: unknown[]) => {
    const order = values as [FragmentId, FragmentId, FragmentId]
    const first = deriveEndingConfiguration(order)
    const second = deriveEndingConfiguration([...order])

    expect(first).toEqual(second)
    expect(first?.profile.id).toBe(order[0])
    expect(first?.motionModifier).toBe(order[1])
    expect(first?.detailModifier).toBe(order[2])
    expect(first?.order).toEqual(order)
  })

  it('rejects incomplete or duplicate profile input', () => {
    expect(deriveEndingConfiguration(['identity', 'fear'])).toBeNull()
    expect(deriveEndingConfiguration(['identity', 'identity', 'hope'])).toBeNull()
  })

  it.each(orders)(
    'guards every phase and reaches ending for %s',
    (...values: unknown[]) => {
      const order = values as [FragmentId, FragmentId, FragmentId]
      collect(order)

      expect(useExperienceStore.getState().beginReconstruction()).toBe(true)
      expect(useExperienceStore.getState().beginReconstruction()).toBe(false)
      expect(useExperienceStore.getState().inputLocked).toBe(true)
      expect(useExperienceStore.getState().endingProfileId).toBe(order[0])

      expect(useExperienceStore.getState().completeCollapse()).toBe(false)
      expect(useExperienceStore.getState().completeRecognition()).toBe(true)
      expect(useExperienceStore.getState().completeCollapse()).toBe(true)
      expect(useExperienceStore.getState().completeVoid()).toBe(true)
      expect(useExperienceStore.getState().completeRecall()).toBe(true)
      expect(useExperienceStore.getState().completeRebuild()).toBe(true)
      expect(useExperienceStore.getState().completeReveal()).toBe(true)

      let state = useExperienceStore.getState()
      expect(state.phase).toBe('ending')
      expect(state.finalTextStep).toBe(1)
      expect(state.replayAvailable).toBe(false)
      expect(state.inputLocked).toBe(true)
      expect(state.finalCameraSettled).toBe(true)

      expect(state.revealFinalText(2)).toBe(true)
      state = useExperienceStore.getState()
      expect(state.finalTextStep).toBe(2)
      expect(state.replayAvailable).toBe(true)
      expect(state.inputLocked).toBe(false)
    },
  )

  it('does not expose final text or replay before ending', () => {
    collect(['hope', 'fear', 'identity'])
    expect(useExperienceStore.getState().revealFinalText(1)).toBe(false)
    expect(useExperienceStore.getState().requestReplay()).toBe(false)
    expect(useExperienceStore.getState().finalTextStep).toBe(0)
  })

  it('replay resets every journey field while preserving preferences', () => {
    useExperienceStore.getState().setAudioEnabled(false)
    useExperienceStore.getState().setReducedMotion(true)
    useExperienceStore.getState().setQuality('low')
    collect(['fear', 'hope', 'identity'])
    finishReconstruction()

    expect(useExperienceStore.getState().requestReplay()).toBe(true)
    expect(useExperienceStore.getState().requestReplay()).toBe(false)
    expect(useExperienceStore.getState().completeReplayReset()).toBe(true)
    const state = useExperienceStore.getState()

    expect(state.phase).toBe('chamber')
    expect(state.collectedFragments).toEqual([])
    expect(state.collectionOrder).toEqual([])
    expect(state.reconstructionInitiated).toBe(false)
    expect(state.endingProfileId).toBeNull()
    expect(state.finalTextStep).toBe(0)
    expect(state.replayAvailable).toBe(false)
    expect(state.finalCameraSettled).toBe(false)
    expect(state.inputLocked).toBe(false)
    expect(state.audioEnabled).toBe(false)
    expect(state.reducedMotion).toBe(true)
    expect(state.quality).toBe('low')
  })

  it('supports a complete second journey after replay', () => {
    collect(['identity', 'fear', 'hope'])
    finishReconstruction()
    useExperienceStore.getState().requestReplay()
    useExperienceStore.getState().completeReplayReset()
    collect(['hope', 'identity', 'fear'])
    finishReconstruction()

    expect(useExperienceStore.getState().phase).toBe('ending')
    expect(useExperienceStore.getState().endingProfileId).toBe('hope')
    expect(useExperienceStore.getState().collectionOrder).toEqual([
      'hope',
      'identity',
      'fear',
    ])
  })
})

describe('reconstruction configuration', () => {
  it('defines responsive final cameras for every foundation', () => {
    Object.values(ENDING_PROFILES).forEach((profile) => {
      expect(profile.camera.desktopPosition).toHaveLength(3)
      expect(profile.camera.tabletPosition).toHaveLength(3)
      expect(profile.camera.mobilePosition).toHaveLength(3)
      expect(profile.camera.target).toHaveLength(3)
      expect(profile.camera.mobileFov).toBeGreaterThan(profile.camera.desktopFov)
    })
  })

  it('uses narrative fades and non-zero timing in reduced motion', () => {
    const standard = getReconstructionDurations(false)
    const reduced = getReconstructionDurations(true)

    Object.keys(standard).forEach((key) => {
      const duration = key as keyof typeof standard
      expect(reduced[duration]).toBeGreaterThan(0)
      expect(reduced[duration]).toBeLessThan(standard[duration])
    })
  })
})
