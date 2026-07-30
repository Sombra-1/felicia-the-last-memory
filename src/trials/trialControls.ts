import { MathUtils } from 'three'
import { useExperienceStore } from '../state/experienceStore'
import { trialRuntime } from './trialRuntime'

export function setTrialPointer(clientX: number, clientY: number) {
  trialRuntime.pointerX = MathUtils.clamp(clientX, -1, 1)
  trialRuntime.pointerY = MathUtils.clamp(clientY, -1, 1)
  trialRuntime.inputEnergy = 1
}

export function selectFearShield(direction: 'left' | 'up' | 'right') {
  trialRuntime.fearShield = direction
  trialRuntime.inputEnergy = 1
}

export function setReconstructionHold(holding: boolean) {
  trialRuntime.evidenceHold = false
  useExperienceStore.getState().setReconstructionHolding(holding)
}
