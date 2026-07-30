import type { FragmentId } from '../state/experienceStore'

export interface ReconstructionDurations {
  completionHold: number
  recognition: number
  collapse: number
  void: number
  recallPerMemory: number
  rebuild: number
  reveal: number
  firstLineDelay: number
  secondLineDelay: number
  tableauHold: number
  reset: number
}

const STANDARD_DURATIONS: ReconstructionDurations = {
  completionHold: 2,
  recognition: 1.6,
  collapse: 2.25,
  void: 1.1,
  recallPerMemory: 1.05,
  rebuild: 4,
  reveal: 1.7,
  firstLineDelay: 0.9,
  secondLineDelay: 1.35,
  tableauHold: 2.4,
  reset: 0.65,
}

const REDUCED_DURATIONS: ReconstructionDurations = {
  completionHold: 1.1,
  recognition: 0.42,
  collapse: 0.58,
  void: 0.46,
  recallPerMemory: 0.38,
  rebuild: 0.8,
  reveal: 0.5,
  firstLineDelay: 0.4,
  secondLineDelay: 0.65,
  tableauHold: 0.9,
  reset: 0.32,
}

export function getReconstructionDurations(reducedMotion: boolean) {
  return reducedMotion ? REDUCED_DURATIONS : STANDARD_DURATIONS
}

export interface ReconstructionCameraStage {
  desktopPosition: readonly [number, number, number]
  mobilePosition: readonly [number, number, number]
  target: readonly [number, number, number]
  desktopFov: number
  mobileFov: number
}

export const RECONSTRUCTION_CAMERA_STAGES: Record<
  'recognition' | 'collapse' | 'void',
  ReconstructionCameraStage
> = {
  recognition: {
    desktopPosition: [1.3, 0.6, 9.4],
    mobilePosition: [0, 1.9, 13.15],
    target: [0, 0.15, -0.3],
    desktopFov: 40,
    mobileFov: 47,
  },
  collapse: {
    desktopPosition: [0.4, 0.25, 7.25],
    mobilePosition: [0, 1.2, 11.6],
    target: [0, 0.2, -0.4],
    desktopFov: 36,
    mobileFov: 43,
  },
  void: {
    desktopPosition: [0.2, 0.25, 5.55],
    mobilePosition: [0, 1.05, 10.8],
    target: [0, 0.45, -0.25],
    desktopFov: 32,
    mobileFov: 41,
  },
}

export const RECALL_COLORS: Record<FragmentId, string> = {
  identity: '#e6e8eb',
  fear: '#846696',
  hope: '#d4a96d',
}
