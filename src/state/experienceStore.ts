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
  | 'approaching-fragment'
  | 'revealing-fragment'
  | 'returning-to-chamber'
  | 'ready-for-reconstruction'
  | 'reconstruction-initiating'
  | 'reconstruction-collapse'
  | 'reconstruction-void'
  | 'reconstruction-recall'
  | 'reconstruction-rebuilding'
  | 'reconstruction-reveal'
  | 'ending'
  | 'resetting'
export type QualityLevel = 'low' | 'medium' | 'high'

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
  reducedMotion: boolean
  quality: QualityLevel
  loadingProgress: number
  reconstructionInitiated: boolean
  endingProfileId: FragmentId | null
  finalTextStep: 0 | 1 | 2
  replayAvailable: boolean
  finalCameraSettled: boolean
  enterChamber: () => boolean
  requestFragment: (fragment: FragmentId) => boolean
  beginFragmentReveal: (fragment: FragmentId) => boolean
  completeFragmentReveal: (fragment: FragmentId) => boolean
  requestReturn: () => boolean
  completeReturn: (fragment: FragmentId) => boolean
  beginReconstruction: () => boolean
  completeRecognition: () => boolean
  completeCollapse: () => boolean
  completeVoid: () => boolean
  completeRecall: () => boolean
  completeRebuild: () => boolean
  completeReveal: () => boolean
  revealFinalText: (step: 1 | 2) => boolean
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
  reducedMotion: false,
  quality: 'high' as QualityLevel,
  loadingProgress: 0,
  reconstructionInitiated: false,
  endingProfileId: null as FragmentId | null,
  finalTextStep: 0 as 0 | 1 | 2,
  replayAvailable: false,
  finalCameraSettled: false,
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
    })
    return true
  },
  requestFragment: (fragment) => {
    const state = get()
    const canBegin =
      state.phase === 'chamber' &&
      !state.inputLocked &&
      !state.collectedFragments.includes(fragment)

    if (!canBegin) return false

    set({
      phase: 'approaching-fragment',
      activeFragment: fragment,
      inputLocked: true,
      fragmentTextVisible: false,
      chamberCameraRestored: false,
      instructionDismissed: true,
    })
    return true
  },
  beginFragmentReveal: (fragment) => {
    const state = get()
    if (state.phase !== 'approaching-fragment' || state.activeFragment !== fragment) {
      return false
    }

    set({
      phase: 'revealing-fragment',
      fragmentTextVisible: true,
      inputLocked: true,
    })
    return true
  },
  completeFragmentReveal: (fragment) => {
    const state = get()
    if (
      state.phase !== 'revealing-fragment' ||
      state.activeFragment !== fragment ||
      state.collectedFragments.includes(fragment)
    ) {
      return false
    }

    set({
      collectedFragments: [...state.collectedFragments, fragment],
      collectionOrder: [...state.collectionOrder, fragment],
      inputLocked: false,
    })
    return true
  },
  requestReturn: () => {
    const state = get()
    const canReturn =
      state.phase === 'revealing-fragment' &&
      state.activeFragment !== null &&
      state.collectedFragments.includes(state.activeFragment) &&
      !state.inputLocked

    if (!canReturn) return false

    set({
      phase: 'returning-to-chamber',
      inputLocked: true,
      fragmentTextVisible: false,
    })
    return true
  },
  completeReturn: (fragment) => {
    const state = get()
    if (state.phase !== 'returning-to-chamber' || state.activeFragment !== fragment) {
      return false
    }

    const allCollected = state.collectedFragments.length === fragmentIds.length
    set({
      phase: allCollected ? 'ready-for-reconstruction' : 'chamber',
      activeFragment: null,
      inputLocked: false,
      fragmentTextVisible: false,
      chamberCameraRestored: true,
    })
    return true
  },
  beginReconstruction: () => {
    const state = get()
    const canBegin =
      state.phase === 'ready-for-reconstruction' &&
      state.collectedFragments.length === fragmentIds.length &&
      new Set(state.collectionOrder).size === fragmentIds.length &&
      state.chamberCameraRestored &&
      !state.inputLocked &&
      !state.reconstructionInitiated &&
      state.collectionOrder[0] !== undefined

    if (!canBegin) return false

    set({
      phase: 'reconstruction-initiating',
      inputLocked: true,
      reconstructionInitiated: true,
      endingProfileId: state.collectionOrder[0],
      finalTextStep: 0,
      replayAvailable: false,
      finalCameraSettled: false,
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
    set({ phase: 'ending', finalCameraSettled: true, finalTextStep: 1 })
    return true
  },
  revealFinalText: (step) => {
    const state = get()
    if (state.phase !== 'ending' || step <= state.finalTextStep) return false
    if (step === 2 && state.finalTextStep !== 1) return false
    set({
      finalTextStep: step,
      replayAvailable: step === 2,
      inputLocked: step !== 2,
    })
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
    }))
    return true
  },
  setLoadingProgress: (loadingProgress) =>
    set({ loadingProgress: Math.min(100, Math.max(0, loadingProgress)) }),
  setAudioEnabled: (audioEnabled) => set({ audioEnabled }),
  setAudioVolume: (audioVolume) =>
    set({ audioVolume: Math.min(1, Math.max(0, audioVolume)) }),
  registerUserInteraction: () => set({ hasUserInteracted: true }),
  setAudioDiagnostics: ({ status, ambientStartCount, lastEvent }) =>
    set({
      audioContextStatus: status,
      ambientStartCount,
      lastAudioEvent: lastEvent,
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
