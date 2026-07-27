import type { FragmentId } from '../state/experienceStore'

export interface SequenceRuntime {
  fragment: FragmentId | null
  cameraProgress: number
  visualProgress: number
  suppression: number
}

export const sequenceRuntime: SequenceRuntime = {
  fragment: null,
  cameraProgress: 0,
  visualProgress: 0,
  suppression: 0,
}

export function resetSequenceRuntime() {
  sequenceRuntime.fragment = null
  sequenceRuntime.cameraProgress = 0
  sequenceRuntime.visualProgress = 0
  sequenceRuntime.suppression = 0
}
