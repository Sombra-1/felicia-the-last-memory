import { create } from 'zustand'
import type {
  AudioContextStatus,
  AudioDiagnostics,
  AudioEvent,
} from '../audio/audioConfig'

export const fragmentIds = ['identity', 'fear', 'hope'] as const

export type FragmentId = (typeof fragmentIds)[number]
export type ExperiencePhase =
  | 'loading'
  | 'intro'
  | 'chamber'
  | 'trial-departure'
  | 'trial-arrival'
  | 'trial-active'
  | 'trial-completing'
  | 'trial-returning'
  | 'ready-for-reconstruction'
  | 'reconstruction-synchronizing'
  | 'reconstruction-initiating'
  | 'reconstruction-collapse'
  | 'reconstruction-void'
  | 'reconstruction-recall'
  | 'reconstruction-rebuilding'
  | 'reconstruction-reveal'
  | 'ending'
  | 'resetting'
export type QualityLevel = 'low' | 'medium' | 'high'
export type TrialGrade = 'resonant' | 'stable' | 'assisted'

export interface TrialResult {
  score: number
  grade: TrialGrade
  assisted: boolean
}

export interface ExperienceState {
  phase: ExperiencePhase
  collectedFragments: FragmentId[]
  collectionOrder: FragmentId[]
  activeFragment: FragmentId | null
  inputLocked: boolean
  fragmentTextVisible: boolean
  chamberCameraRestored: boolean
  instructionDismissed: boolean
  audioEnabled: boolean
  audioVolume: number
  hasUserInteracted: boolean
  audioContextStatus: AudioContextStatus
  ambientStartCount: number
  lastAudioEvent: AudioEvent
  masterGain: number
  ambientGain: number
  cueGain: number
  entranceComplete: boolean
  interactionNotice: string
  interactionFeedbackId: number
  reducedMotion: boolean
  quality: QualityLevel
  loadingProgress: number
  reconstructionInitiated: boolean
  memorySetComplete: boolean
  trialBeat: 0 | 1 | 2 | 3
  trialScore: number
  trialAssisted: boolean
  trialResults: Partial<Record<FragmentId, TrialResult>>
  reconstructionSync: number
  reconstructionHolding: boolean
  endingProfileId: FragmentId | null
  reconstructionMemoryIndex: -1 | 0 | 1 | 2
  finalTextStep: 0 | 1 | 2
  replayAvailable: boolean
  finalCameraSettled: boolean
  endingExplorationReady: boolean
  enterChamber: () => boolean
  completeEntrance: () => boolean
  requestFragment: (fragment: FragmentId) => boolean
  beginTrialArrival: (fragment: FragmentId) => boolean
  beginTrial: (fragment: FragmentId) => boolean
  completeTrialBeat: (assisted?: boolean) => boolean
  beginTrialReturn: (fragment: FragmentId) => boolean
  completeTrialReturn: (fragment: FragmentId) => boolean
  beginSynchronization: () => boolean
  setReconstructionHolding: (holding: boolean) => void
  setReconstructionSync: (progress: number) => void
  beginReconstruction: () => boolean
  completeRecognition: () => boolean
  completeCollapse: () => boolean
  completeVoid: () => boolean
  setReconstructionMemory: (index: 0 | 1 | 2) => boolean
  completeRecall: () => boolean
  completeRebuild: () => boolean
  completeReveal: () => boolean
  revealFinalText: (step: 1 | 2) => boolean
  makeReplayAvailable: () => boolean
  makeEndingExplorable: () => boolean
  requestReplay: () => boolean
  completeReplayReset: () => boolean
  setLoadingProgress: (progress: number) => void
  setAudioEnabled: (enabled: boolean) => void
  setAudioVolume: (volume: number) => void
  registerUserInteraction: () => void
  setAudioDiagnostics: (diagnostics: AudioDiagnostics) => void
  setReducedMotion: (enabled: boolean) => void
  setQuality: (quality: QualityLevel) => void
  resetExperience: () => void
}

const initialExperienceState = {
  phase: 'loading' as ExperiencePhase,
  collectedFragments: [] as FragmentId[],
  collectionOrder: [] as FragmentId[],
  activeFragment: null as FragmentId | null,
  inputLocked: false,
  fragmentTextVisible: false,
  chamberCameraRestored: true,
  instructionDismissed: false,
  audioEnabled: true,
  audioVolume: 0.72,
  hasUserInteracted: false,
  audioContextStatus: 'idle' as AudioContextStatus,
  ambientStartCount: 0,
  lastAudioEvent: 'none' as AudioEvent,
  masterGain: 0,
  ambientGain: 0,
  cueGain: 0,
  entranceComplete: false,
  interactionNotice: '',
  interactionFeedbackId: 0,
  reducedMotion: false,
  quality: 'high' as QualityLevel,
  loadingProgress: 0,
  reconstructionInitiated: false,
  memorySetComplete: false,
  trialBeat: 0 as 0 | 1 | 2 | 3,
  trialScore: 100,
  trialAssisted: false,
  trialResults: {} as Partial<Record<FragmentId, TrialResult>>,
  reconstructionSync: 0,
  reconstructionHolding: false,
  endingProfileId: null as FragmentId | null,
  reconstructionMemoryIndex: -1 as -1 | 0 | 1 | 2,
  finalTextStep: 0 as 0 | 1 | 2,
  replayAvailable: false,
  finalCameraSettled: false,
  endingExplorationReady: false,
}

export const selectFirstSelectedFragment = (state: ExperienceState) =>
  state.collectionOrder[0] ?? null

export const selectMostRecentFragment = (state: ExperienceState) =>
  state.collectionOrder.at(-1) ?? null

export const selectRemainingFragments = (state: ExperienceState) =>
  fragmentIds.filter((fragment) => !state.collectedFragments.includes(fragment))

export const selectAllFragmentsCollected = (state: ExperienceState) =>
  state.collectedFragments.length === fragmentIds.length

export const selectCollectionProgress = (state: ExperienceState) =>
  state.collectedFragments.length

export const useExperienceStore = create<ExperienceState>((set, get) => ({
  ...initialExperienceState,
  enterChamber: () => {
    const { phase } = get()
    if (phase !== 'loading' && phase !== 'intro') return false

    set({
      phase: 'chamber',
      chamberCameraRestored: true,
      inputLocked: false,
      entranceComplete: false,
      interactionNotice: 'Memory link accepted.',
      interactionFeedbackId: get().interactionFeedbackId + 1,
    })
    return true
  },
  completeEntrance: () => {
    const state = get()
    if (state.entranceComplete || state.phase !== 'chamber') return false
    set({ entranceComplete: true })
    return true
  },
  requestFragment: (fragment) => {
    const state = get()
    const canBegin =
      state.phase === 'chamber' &&
      !state.inputLocked &&
      !state.collectedFragments.includes(fragment)

    if (!canBegin) {
      const label = fragment[0].toUpperCase() + fragment.slice(1)
      const message = state.collectedFragments.includes(fragment)
        ? `${label} is already recovered.`
        : state.inputLocked
          ? 'The current transition is still resolving.'
          : 'That memory is not available in this moment.'
      set({
        interactionNotice: message,
        interactionFeedbackId: state.interactionFeedbackId + 1,
      })
      return false
    }

    set({
      phase: 'trial-departure',
      activeFragment: fragment,
      inputLocked: true,
      fragmentTextVisible: false,
      chamberCameraRestored: false,
      instructionDismissed: true,
      entranceComplete: true,
      interactionNotice: `${fragment.toUpperCase()} LINK ESTABLISHED`,
      interactionFeedbackId: state.interactionFeedbackId + 1,
    })
    return true
  },
  beginTrialArrival: (fragment) => {
    const state = get()
    if (state.phase !== 'trial-departure' || state.activeFragment !== fragment) {
      return false
    }

    set({
      phase: 'trial-arrival',
      inputLocked: true,
    })
    return true
  },
  beginTrial: (fragment) => {
    const state = get()
    if (state.phase !== 'trial-arrival' || state.activeFragment !== fragment) {
      return false
    }

    set({
      phase: 'trial-active',
      inputLocked: false,
      fragmentTextVisible: true,
      trialBeat: 0,
      trialScore: 100,
      trialAssisted: false,
      interactionNotice:
        fragment === 'identity'
          ? 'ALIGN THE FIRST SIGNAL AXIS'
          : fragment === 'fear'
            ? 'PROTECT THE CORE'
            : 'GUIDE THE LIVING SIGNAL',
      interactionFeedbackId: state.interactionFeedbackId + 1,
    })
    return true
  },
  completeTrialBeat: (assisted = false) => {
    const state = get()
    if (state.phase !== 'trial-active' || state.activeFragment === null) {
      return false
    }

    const nextBeat = (state.trialBeat + 1) as 1 | 2 | 3
    const nextScore = Math.max(60, state.trialScore - (assisted ? 12 : 0))
    const isComplete = nextBeat === 3
    set({
      phase: isComplete ? 'trial-completing' : 'trial-active',
      inputLocked: isComplete,
      fragmentTextVisible: true,
      trialBeat: nextBeat,
      trialScore: nextScore,
      trialAssisted: state.trialAssisted || assisted,
      interactionNotice: isComplete
        ? `${state.activeFragment.toUpperCase()} TRIAL COMPLETE`
        : `RESONANCE ${nextBeat + 1} OF 3`,
      interactionFeedbackId: state.interactionFeedbackId + 1,
    })
    return true
  },
  beginTrialReturn: (fragment) => {
    const state = get()
    if (state.phase !== 'trial-completing' || state.activeFragment !== fragment) {
      return false
    }
    set({
      phase: 'trial-returning',
      inputLocked: true,
      fragmentTextVisible: false,
    })
    return true
  },
  completeTrialReturn: (fragment) => {
    const state = get()
    if (state.phase !== 'trial-returning' || state.activeFragment !== fragment) {
      return false
    }
    const nextOrder = [...state.collectionOrder, fragment]
    const memoryRole =
      nextOrder.length === 1
        ? 'FOUNDATION'
        : nextOrder.length === 2
          ? 'SECONDARY MEMORY'
          : 'FINAL MEMORY'
    const grade: TrialGrade = state.trialAssisted
      ? 'assisted'
      : state.trialScore >= 94
        ? 'resonant'
        : 'stable'
    const collectedFragments = [...state.collectedFragments, fragment]
    const allCollected = collectedFragments.length === fragmentIds.length
    set({
      phase: allCollected ? 'ready-for-reconstruction' : 'chamber',
      collectedFragments,
      collectionOrder: nextOrder,
      activeFragment: null,
      inputLocked: allCollected,
      fragmentTextVisible: false,
      chamberCameraRestored: true,
      memorySetComplete: allCollected,
      trialResults: {
        ...state.trialResults,
        [fragment]: {
          score: state.trialScore,
          grade,
          assisted: state.trialAssisted,
        },
      },
      interactionNotice: allCollected
        ? 'MEMORY SET COMPLETE'
        : `${fragment.toUpperCase()} RECORDED AS ${memoryRole}`,
      interactionFeedbackId: state.interactionFeedbackId + 1,
    })
    return true
  },
  beginSynchronization: () => {
    const state = get()
    if (
      state.phase !== 'ready-for-reconstruction' ||
      state.collectionOrder.length !== fragmentIds.length
    ) {
      return false
    }
    set({
      phase: 'reconstruction-synchronizing',
      inputLocked: false,
      reconstructionInitiated: true,
      reconstructionSync: 0,
      reconstructionHolding: false,
      endingProfileId: state.collectionOrder[0],
      reconstructionMemoryIndex: 0,
      interactionNotice: 'HOLD TO SYNCHRONIZE',
      interactionFeedbackId: state.interactionFeedbackId + 1,
    })
    return true
  },
  setReconstructionHolding: (reconstructionHolding) =>
    set((state) =>
      state.phase === 'reconstruction-synchronizing'
        ? { reconstructionHolding }
        : { reconstructionHolding: false },
    ),
  setReconstructionSync: (progress) =>
    set((state) => {
      if (state.phase !== 'reconstruction-synchronizing') return state
      const reconstructionSync = Math.min(1, Math.max(state.reconstructionSync, progress))
      return {
        reconstructionSync,
        reconstructionMemoryIndex:
          reconstructionSync < 0.34 ? 0 : reconstructionSync < 0.68 ? 1 : 2,
      }
    }),
  beginReconstruction: () => {
    const state = get()
    const canBegin =
      state.phase === 'reconstruction-synchronizing' &&
      state.collectedFragments.length === fragmentIds.length &&
      new Set(state.collectionOrder).size === fragmentIds.length &&
      state.reconstructionSync >= 1 &&
      state.collectionOrder[0] !== undefined

    if (!canBegin) return false

    set({
      phase: 'reconstruction-initiating',
      inputLocked: true,
      reconstructionInitiated: true,
      reconstructionHolding: false,
      endingProfileId: state.collectionOrder[0],
      reconstructionMemoryIndex: 0,
      finalTextStep: 0,
      replayAvailable: false,
      finalCameraSettled: false,
      interactionNotice: 'Reconstruction accepted.',
      interactionFeedbackId: state.interactionFeedbackId + 1,
    })
    return true
  },
  completeRecognition: () => {
    if (get().phase !== 'reconstruction-initiating') return false
    set({ phase: 'reconstruction-collapse' })
    return true
  },
  completeCollapse: () => {
    if (get().phase !== 'reconstruction-collapse') return false
    set({ phase: 'reconstruction-void' })
    return true
  },
  completeVoid: () => {
    if (get().phase !== 'reconstruction-void') return false
    set({ phase: 'reconstruction-recall' })
    return true
  },
  setReconstructionMemory: (reconstructionMemoryIndex) => {
    if (get().phase !== 'reconstruction-recall') return false
    set({ reconstructionMemoryIndex })
    return true
  },
  completeRecall: () => {
    if (get().phase !== 'reconstruction-recall') return false
    set({ phase: 'reconstruction-rebuilding' })
    return true
  },
  completeRebuild: () => {
    if (get().phase !== 'reconstruction-rebuilding') return false
    set({ phase: 'reconstruction-reveal' })
    return true
  },
  completeReveal: () => {
    if (get().phase !== 'reconstruction-reveal') return false
    set({
      phase: 'ending',
      finalCameraSettled: true,
      finalTextStep: 0,
      inputLocked: false,
      endingExplorationReady: false,
    })
    return true
  },
  revealFinalText: (step) => {
    const state = get()
    if (state.phase !== 'ending' || step <= state.finalTextStep) return false
    if (step === 2 && state.finalTextStep !== 1) return false
    set({
      finalTextStep: step,
      replayAvailable: false,
      inputLocked: false,
    })
    return true
  },
  makeEndingExplorable: () => {
    const state = get()
    if (state.phase !== 'ending' || state.endingExplorationReady) return false
    set({ endingExplorationReady: true, inputLocked: false })
    return true
  },
  makeReplayAvailable: () => {
    const state = get()
    if (state.phase !== 'ending' || state.finalTextStep !== 2) return false
    set({ replayAvailable: true, inputLocked: false })
    return true
  },
  requestReplay: () => {
    const state = get()
    if (state.phase !== 'ending' || !state.replayAvailable || state.inputLocked) {
      return false
    }
    set({
      phase: 'resetting',
      inputLocked: true,
      replayAvailable: false,
      finalTextStep: 0,
    })
    return true
  },
  completeReplayReset: () => {
    if (get().phase !== 'resetting') return false
    set((state) => ({
      ...initialExperienceState,
      phase: 'chamber',
      reducedMotion: state.reducedMotion,
      quality: state.quality,
      audioEnabled: state.audioEnabled,
      audioVolume: state.audioVolume,
      hasUserInteracted: state.hasUserInteracted,
      audioContextStatus: state.audioContextStatus,
      ambientStartCount: state.ambientStartCount,
      lastAudioEvent: state.lastAudioEvent,
      loadingProgress: 100,
      entranceComplete: true,
      interactionNotice: 'Memory chamber restored.',
      interactionFeedbackId: state.interactionFeedbackId + 1,
    }))
    return true
  },
  setLoadingProgress: (loadingProgress) =>
    set({ loadingProgress: Math.min(100, Math.max(0, loadingProgress)) }),
  setAudioEnabled: (audioEnabled) => set({ audioEnabled }),
  setAudioVolume: (audioVolume) =>
    set({ audioVolume: Math.min(1, Math.max(0, audioVolume)) }),
  registerUserInteraction: () => set({ hasUserInteracted: true }),
  setAudioDiagnostics: ({
    status,
    ambientStartCount,
    lastEvent,
    masterGain,
    ambientGain,
    cueGain,
  }) =>
    set({
      audioContextStatus: status,
      ambientStartCount,
      lastAudioEvent: lastEvent,
      masterGain,
      ambientGain,
      cueGain,
    }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setQuality: (quality) => set({ quality }),
  resetExperience: () =>
    set((state) => ({
      ...initialExperienceState,
      reducedMotion: state.reducedMotion,
      quality: state.quality,
      audioEnabled: state.audioEnabled,
      audioVolume: state.audioVolume,
    })),
}))
