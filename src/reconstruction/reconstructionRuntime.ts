import type { FragmentId } from '../state/experienceStore'

export interface ReconstructionRuntime {
  recognition: number
  collapse: number
  void: number
  recall: number
  rebuild: number
  reveal: number
  reset: number
  activeRecall: FragmentId | null
  recallIndex: number
  evidenceHold: boolean
}

const initialRuntime: ReconstructionRuntime = {
  recognition: 0,
  collapse: 0,
  void: 0,
  recall: 0,
  rebuild: 0,
  reveal: 0,
  reset: 0,
  activeRecall: null,
  recallIndex: -1,
  evidenceHold: false,
}

export const reconstructionRuntime: ReconstructionRuntime = { ...initialRuntime }

export function resetReconstructionRuntime() {
  Object.assign(reconstructionRuntime, initialRuntime)
}
