import type { FragmentId } from '../state/experienceStore'

export interface ReconstructionDurations {
  recognition: number
  collapse: number
  void: number
  recallPerMemory: number
  rebuild: number
  reveal: number
  firstLineDelay: number
  secondLineDelay: number
  reset: number
}

const STANDARD_DURATIONS: ReconstructionDurations = {
  recognition: 1.25,
  collapse: 2.15,
  void: 1,
  recallPerMemory: 0.66,
  rebuild: 3.1,
  reveal: 1.55,
  firstLineDelay: 0.62,
  secondLineDelay: 1.25,
  reset: 0.65,
}

const REDUCED_DURATIONS: ReconstructionDurations = {
  recognition: 0.32,
  collapse: 0.48,
  void: 0.5,
  recallPerMemory: 0.38,
  rebuild: 0.72,
  reveal: 0.55,
  firstLineDelay: 0.45,
  secondLineDelay: 0.8,
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
    desktopPosition: [0.05, 0.25, 6.35],
    mobilePosition: [0, 1.05, 10.8],
    target: [0, 0.45, -0.25],
    desktopFov: 34,
    mobileFov: 41,
  },
}

export const RECALL_COLORS: Record<FragmentId, string> = {
  identity: '#e6e8eb',
  fear: '#846696',
  hope: '#d4a96d',
}
