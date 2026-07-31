import {
  useExperienceStore,
  type ExperiencePhase,
  type FragmentId,
} from '../state/experienceStore'
import {
  reconstructionRuntime,
  resetReconstructionRuntime,
} from './reconstructionRuntime'
import { resetTrialBeat, resetTrialRuntime, trialRuntime } from '../trials/trialRuntime'
import { feliciaAudioEngine } from '../audio/FeliciaAudioEngine'

let audioRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []

type EvidenceStage = Extract<
  ExperiencePhase,
  | 'reconstruction-collapse'
  | 'reconstruction-void'
  | 'reconstruction-recall'
  | 'reconstruction-rebuilding'
>

declare global {
  interface Window {
    __FELICIA_EVIDENCE__?: {
      holdStage: (stage: EvidenceStage) => void
      holdRecall: (
        order: [FragmentId, FragmentId, FragmentId],
        index: 0 | 1 | 2,
        progress?: number,
      ) => void
      holdSignature: (
        order: [FragmentId, FragmentId, FragmentId],
        progress?: number,
      ) => void
      holdCompletion: (order: [FragmentId, FragmentId, FragmentId]) => void
      holdChamber: (order: FragmentId[]) => void
      holdTrial: (
        fragment: FragmentId,
        stage:
          | 'arrival'
          | 'interaction'
          | 'incoming'
          | 'impact'
          | 'gate-opening'
          | 'completion'
          | 'return',
        beat?: 0 | 1 | 2,
        order?: FragmentId[],
      ) => void
      holdSynchronization: (
        order: [FragmentId, FragmentId, FragmentId],
        progress?: number,
      ) => void
      holdEnding: (order: [FragmentId, FragmentId, FragmentId]) => void
      playTrialTransition: (fragment: FragmentId, order?: FragmentId[]) => void
      playTrialReturn: (fragment: FragmentId, order?: FragmentId[]) => void
      playReconstruction: (order: [FragmentId, FragmentId, FragmentId]) => void
      releaseToReady: () => void
      inspectRuntime: () => {
        trial: typeof trialRuntime
        state: ReturnType<typeof useExperienceStore.getState>
      }
      startAudioCapture: () => boolean
      stopAudioCapture: () => Promise<string>
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
      } else if (stage === 'reconstruction-recall') {
        reconstructionRuntime.recognition = 1
        reconstructionRuntime.collapse = 1
        reconstructionRuntime.void = 1
        reconstructionRuntime.activeRecall = 'fear'
        reconstructionRuntime.recallIndex = 1
        reconstructionRuntime.recall = 0.52
      } else {
        reconstructionRuntime.recognition = 1
        reconstructionRuntime.collapse = 1
        reconstructionRuntime.void = 1
        reconstructionRuntime.recallIndex = 2
        reconstructionRuntime.rebuild = 0.74
      }
      useExperienceStore.setState({ phase: stage, inputLocked: true })
    },
    holdRecall: (order, index, progress = 0.72) => {
      resetReconstructionRuntime()
      reconstructionRuntime.evidenceHold = true
      reconstructionRuntime.recognition = 1
      reconstructionRuntime.collapse = 1
      reconstructionRuntime.void = 1
      reconstructionRuntime.activeRecall = order[index]
      reconstructionRuntime.recallIndex = index
      reconstructionRuntime.recall = progress
      useExperienceStore.setState({
        phase: 'reconstruction-recall',
        collectedFragments: [...order],
        collectionOrder: [...order],
        reconstructionInitiated: true,
        memorySetComplete: true,
        endingProfileId: order[0],
        reconstructionMemoryIndex: index,
        inputLocked: true,
      })
    },
    holdSignature: (order, progress = 0.76) => {
      resetReconstructionRuntime()
      reconstructionRuntime.evidenceHold = true
      reconstructionRuntime.recognition = 1
      reconstructionRuntime.collapse = 1
      reconstructionRuntime.void = 1
      reconstructionRuntime.recallIndex = 2
      reconstructionRuntime.recall = 1
      reconstructionRuntime.rebuild = progress
      useExperienceStore.setState({
        phase: 'reconstruction-rebuilding',
        collectedFragments: [...order],
        collectionOrder: [...order],
        reconstructionInitiated: true,
        memorySetComplete: true,
        endingProfileId: order[0],
        reconstructionMemoryIndex: 2,
        inputLocked: true,
      })
    },
    holdCompletion: (order) => {
      resetReconstructionRuntime()
      reconstructionRuntime.evidenceHold = true
      useExperienceStore.setState({
        phase: 'ready-for-reconstruction',
        collectedFragments: [...order],
        collectionOrder: [...order],
        activeFragment: null,
        chamberCameraRestored: true,
        reconstructionInitiated: false,
        memorySetComplete: true,
        endingProfileId: null,
        reconstructionMemoryIndex: -1,
        interactionNotice: 'MEMORY SET COMPLETE',
        inputLocked: true,
      })
    },
    holdChamber: (order) => {
      resetTrialRuntime()
      resetReconstructionRuntime()
      reconstructionRuntime.evidenceHold = true
      trialRuntime.evidenceHold = true
      useExperienceStore.setState({
        phase: 'chamber',
        collectedFragments: [...order],
        collectionOrder: [...order],
        activeFragment: null,
        chamberCameraRestored: true,
        entranceComplete: true,
        memorySetComplete: order.length === 3,
        inputLocked: false,
      })
    },
    holdTrial: (fragment, stage, beat = 1, order = []) => {
      resetReconstructionRuntime()
      resetTrialRuntime(fragment)
      resetTrialBeat(fragment, beat)
      reconstructionRuntime.evidenceHold = true
      trialRuntime.evidenceHold = true
      trialRuntime.anticipation = 1
      trialRuntime.departure = 1
      trialRuntime.passage = 1
      trialRuntime.arrival = 1
      trialRuntime.chamberSuppression = 1
      trialRuntime.beatElapsed = 5.4
      trialRuntime.beatProgress = 0.72
      trialRuntime.beatEnergy = 0.82
      if (fragment === 'identity') {
        trialRuntime.alignmentAngle = trialRuntime.alignmentTarget + 0.04
        trialRuntime.alignmentHold = 0.78
      } else if (fragment === 'fear') {
        trialRuntime.fearShield = trialRuntime.fearDirection
        trialRuntime.fearPulse = 0.76
      } else {
        trialRuntime.hopeSignalX = trialRuntime.hopeGateX + 0.06
        trialRuntime.hopeSignalY = 1.1 + beat * 1.4
      }
      if (stage === 'incoming') {
        trialRuntime.fearShield = null
        trialRuntime.fearPulse = 0.48
        trialRuntime.beatEnergy = 0.56
      }
      if (stage === 'impact') {
        trialRuntime.fearShield = trialRuntime.fearDirection
        trialRuntime.fearPulse = 0.92
        trialRuntime.beatEnergy = 1
      }
      if (stage === 'gate-opening') {
        trialRuntime.hopeSignalX = trialRuntime.hopeGateX + 0.02
        trialRuntime.hopeSignalY = beat === 0 ? -0.82 : beat === 1 ? 1.12 : 3.18
        trialRuntime.beatEnergy = 0.94
      }
      if (stage === 'completion') trialRuntime.completion = 0.82
      if (stage === 'return') {
        trialRuntime.completion = 1
        trialRuntime.returnProgress = 0.64
        trialRuntime.chamberSuppression = 0.48
      }
      useExperienceStore.setState({
        phase:
          stage === 'arrival'
            ? 'trial-arrival'
            : stage === 'interaction' ||
                stage === 'incoming' ||
                stage === 'impact' ||
                stage === 'gate-opening'
              ? 'trial-active'
              : stage === 'completion'
                ? 'trial-completing'
                : 'trial-returning',
        collectedFragments: [...order],
        collectionOrder: [...order],
        activeFragment: fragment,
        entranceComplete: true,
        trialBeat: stage === 'completion' || stage === 'return' ? 3 : beat,
        inputLocked:
          stage !== 'interaction' &&
          stage !== 'incoming' &&
          stage !== 'impact' &&
          stage !== 'gate-opening',
        fragmentTextVisible:
          stage === 'interaction' ||
          stage === 'incoming' ||
          stage === 'impact' ||
          stage === 'gate-opening',
      })
    },
    holdSynchronization: (order, progress = 0.62) => {
      resetReconstructionRuntime()
      resetTrialRuntime()
      reconstructionRuntime.evidenceHold = true
      trialRuntime.evidenceHold = true
      trialRuntime.syncVisual = progress
      trialRuntime.syncInstability = 0.18
      useExperienceStore.setState({
        phase: 'reconstruction-synchronizing',
        collectedFragments: [...order],
        collectionOrder: [...order],
        activeFragment: null,
        reconstructionInitiated: true,
        memorySetComplete: true,
        reconstructionSync: progress,
        reconstructionHolding: false,
        endingProfileId: order[0],
        reconstructionMemoryIndex: progress < 0.34 ? 0 : progress < 0.68 ? 1 : 2,
        inputLocked: false,
      })
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
        memorySetComplete: true,
        endingProfileId: order[0],
        reconstructionMemoryIndex: 2,
        finalTextStep: 2,
        replayAvailable: true,
        finalCameraSettled: true,
        endingExplorationReady: true,
        inputLocked: false,
      })
    },
    playTrialTransition: (fragment, order = []) => {
      resetReconstructionRuntime()
      resetTrialRuntime()
      reconstructionRuntime.evidenceHold = false
      trialRuntime.evidenceHold = false
      useExperienceStore.setState({
        phase: 'chamber',
        collectedFragments: [...order],
        collectionOrder: [...order],
        activeFragment: null,
        chamberCameraRestored: true,
        entranceComplete: true,
        memorySetComplete: order.length === 3,
        inputLocked: false,
      })
      useExperienceStore.getState().requestFragment(fragment)
    },
    playTrialReturn: (fragment, order = []) => {
      resetReconstructionRuntime()
      resetTrialRuntime(fragment)
      reconstructionRuntime.evidenceHold = false
      trialRuntime.evidenceHold = false
      trialRuntime.anticipation = 1
      trialRuntime.departure = 1
      trialRuntime.passage = 1
      trialRuntime.arrival = 1
      trialRuntime.completion = 1
      trialRuntime.chamberSuppression = 1
      useExperienceStore.setState({
        phase: 'trial-returning',
        collectedFragments: [...order],
        collectionOrder: [...order],
        activeFragment: fragment,
        entranceComplete: true,
        trialBeat: 3,
        inputLocked: true,
        chamberCameraRestored: false,
        fragmentTextVisible: false,
      })
    },
    playReconstruction: (order) => {
      resetReconstructionRuntime()
      resetTrialRuntime()
      reconstructionRuntime.evidenceHold = false
      trialRuntime.evidenceHold = false
      trialRuntime.syncVisual = 0.84
      trialRuntime.syncInstability = 0.2
      useExperienceStore.setState({
        phase: 'reconstruction-synchronizing',
        collectedFragments: [...order],
        collectionOrder: [...order],
        activeFragment: null,
        reconstructionInitiated: true,
        memorySetComplete: true,
        reconstructionSync: 0.84,
        reconstructionHolding: false,
        endingProfileId: order[0],
        reconstructionMemoryIndex: 2,
        finalTextStep: 0,
        replayAvailable: false,
        finalCameraSettled: false,
        endingExplorationReady: false,
        inputLocked: false,
      })
    },
    releaseToReady: () => {
      resetReconstructionRuntime()
      useExperienceStore.setState({
        phase: 'ready-for-reconstruction',
        inputLocked: true,
        reconstructionInitiated: false,
        memorySetComplete: true,
        endingProfileId: null,
        reconstructionMemoryIndex: -1,
      })
    },
    inspectRuntime: () => ({
      trial: trialRuntime,
      state: useExperienceStore.getState(),
    }),
    startAudioCapture: () => {
      const stream = feliciaAudioEngine.getCaptureStream()
      if (!stream || audioRecorder?.state === 'recording') return false
      audioChunks = []
      audioRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })
      audioRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) audioChunks.push(event.data)
      })
      audioRecorder.start(1000)
      return true
    },
    stopAudioCapture: () =>
      new Promise((resolve) => {
        if (!audioRecorder || audioRecorder.state === 'inactive') {
          resolve('')
          return
        }
        audioRecorder.addEventListener(
          'stop',
          async () => {
            const buffer = await new Blob(audioChunks, {
              type: 'audio/webm;codecs=opus',
            }).arrayBuffer()
            const bytes = new Uint8Array(buffer)
            let binary = ''
            for (let index = 0; index < bytes.length; index += 0x8000) {
              binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
            }
            resolve(btoa(binary))
            audioRecorder = null
            audioChunks = []
          },
          { once: true },
        )
        audioRecorder.stop()
      }),
  }
}
