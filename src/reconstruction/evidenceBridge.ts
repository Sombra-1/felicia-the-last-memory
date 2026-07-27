import {
  useExperienceStore,
  type ExperiencePhase,
  type FragmentId,
} from '../state/experienceStore'
import {
  reconstructionRuntime,
  resetReconstructionRuntime,
} from './reconstructionRuntime'

type EvidenceStage = Extract<
  ExperiencePhase,
  'reconstruction-collapse' | 'reconstruction-void' | 'reconstruction-recall'
>

declare global {
  interface Window {
    __FELICIA_EVIDENCE__?: {
      holdStage: (stage: EvidenceStage) => void
      holdEnding: (order: [FragmentId, FragmentId, FragmentId]) => void
      releaseToReady: () => void
    }
  }
}

export function installEvidenceBridge() {
  if (!import.meta.env.DEV) return

  window.__FELICIA_EVIDENCE__ = {
    holdStage: (stage) => {
      resetReconstructionRuntime()
      reconstructionRuntime.evidenceHold = true
      if (stage === 'reconstruction-collapse') {
        reconstructionRuntime.recognition = 1
        reconstructionRuntime.collapse = 0.62
      } else if (stage === 'reconstruction-void') {
        reconstructionRuntime.recognition = 1
        reconstructionRuntime.collapse = 1
        reconstructionRuntime.void = 1
      } else {
        reconstructionRuntime.recognition = 1
        reconstructionRuntime.collapse = 1
        reconstructionRuntime.void = 1
        reconstructionRuntime.activeRecall = 'fear'
        reconstructionRuntime.recallIndex = 1
        reconstructionRuntime.recall = 0.52
      }
      useExperienceStore.setState({ phase: stage, inputLocked: true })
    },
    holdEnding: (order) => {
      resetReconstructionRuntime()
      reconstructionRuntime.evidenceHold = true
      reconstructionRuntime.recognition = 1
      reconstructionRuntime.collapse = 1
      reconstructionRuntime.void = 1
      reconstructionRuntime.rebuild = 1
      reconstructionRuntime.reveal = 1
      useExperienceStore.setState({
        phase: 'ending',
        collectedFragments: [...order],
        collectionOrder: [...order],
        reconstructionInitiated: true,
        endingProfileId: order[0],
        finalTextStep: 2,
        replayAvailable: true,
        finalCameraSettled: true,
        inputLocked: false,
      })
    },
    releaseToReady: () => {
      resetReconstructionRuntime()
      useExperienceStore.setState({
        phase: 'ready-for-reconstruction',
        inputLocked: false,
        reconstructionInitiated: false,
        endingProfileId: null,
      })
    },
  }
}
