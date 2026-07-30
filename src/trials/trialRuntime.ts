import type { FragmentId } from '../state/experienceStore'
import type { FearDirection } from './trialConfig'

export interface TrialRuntime {
  fragment: FragmentId | null
  anticipation: number
  departure: number
  passage: number
  arrival: number
  completion: number
  returnProgress: number
  chamberSuppression: number
  beatElapsed: number
  beatProgress: number
  beatEnergy: number
  inputEnergy: number
  pointerX: number
  pointerY: number
  alignmentAngle: number
  alignmentTarget: number
  alignmentHold: number
  fearDirection: FearDirection
  fearShield: FearDirection | null
  fearPulse: number
  hopeSignalX: number
  hopeSignalY: number
  hopeGateX: number
  syncVisual: number
  syncInstability: number
  endingPointerX: number
  endingPointerY: number
  evidenceHold: boolean
}

const initialRuntime: TrialRuntime = {
  fragment: null,
  anticipation: 0,
  departure: 0,
  passage: 0,
  arrival: 0,
  completion: 0,
  returnProgress: 0,
  chamberSuppression: 0,
  beatElapsed: 0,
  beatProgress: 0,
  beatEnergy: 0,
  inputEnergy: 0,
  pointerX: 0,
  pointerY: 0,
  alignmentAngle: -0.72,
  alignmentTarget: 0,
  alignmentHold: 0,
  fearDirection: 'left',
  fearShield: null,
  fearPulse: 0,
  hopeSignalX: -0.42,
  hopeSignalY: -2.8,
  hopeGateX: 0,
  syncVisual: 0,
  syncInstability: 1,
  endingPointerX: 0,
  endingPointerY: 0,
  evidenceHold: false,
}

export const trialRuntime: TrialRuntime = { ...initialRuntime }

export function resetTrialRuntime(fragment: FragmentId | null = null) {
  Object.assign(trialRuntime, initialRuntime, { fragment })
}

export function resetTrialBeat(fragment: FragmentId, beat: number) {
  trialRuntime.fragment = fragment
  trialRuntime.beatElapsed = 0
  trialRuntime.beatProgress = 0
  trialRuntime.beatEnergy = 0
  trialRuntime.inputEnergy = 0
  trialRuntime.alignmentHold = 0
  trialRuntime.fearShield = null
  trialRuntime.fearPulse = 0
  trialRuntime.alignmentTarget = [-0.34, 0.22, 0][beat] ?? 0
  trialRuntime.alignmentAngle = [-0.78, 0.7, -0.48][beat] ?? -0.6
  trialRuntime.fearDirection = (['left', 'up', 'right'] as const)[beat] ?? 'left'
  trialRuntime.hopeGateX = [-0.72, 0.64, 0][beat] ?? 0
  trialRuntime.hopeSignalY = -2.8 + beat * 1.8
}
