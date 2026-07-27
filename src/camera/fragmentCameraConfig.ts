import type { FragmentId } from '../state/experienceStore'

export interface FragmentCameraChoreography {
  desktopOffset: [number, number, number]
  mobileOffset: [number, number, number]
  targetOffset: [number, number, number]
  desktopFov: number
  mobileFov: number
  approachDuration: number
  holdDuration: number
  returnDuration: number
  reducedApproachDuration: number
  reducedHoldDuration: number
  reducedReturnDuration: number
  curve: 'centered' | 'uneasy' | 'rising'
}

export const FRAGMENT_CAMERA_CHOREOGRAPHY: Record<
  FragmentId,
  FragmentCameraChoreography
> = {
  identity: {
    desktopOffset: [0, 0.12, 4],
    mobileOffset: [0, 0.32, 4.8],
    targetOffset: [0, 0.02, 0],
    desktopFov: 38,
    mobileFov: 42,
    approachDuration: 1.8,
    holdDuration: 1.2,
    returnDuration: 1.55,
    reducedApproachDuration: 0.28,
    reducedHoldDuration: 0.25,
    reducedReturnDuration: 0.28,
    curve: 'centered',
  },
  fear: {
    desktopOffset: [0.58, 0.28, 4.2],
    mobileOffset: [-0.32, 0.42, 4.9],
    targetOffset: [0.08, -0.02, 0],
    desktopFov: 40,
    mobileFov: 44,
    approachDuration: 1.55,
    holdDuration: 1.4,
    returnDuration: 1.45,
    reducedApproachDuration: 0.25,
    reducedHoldDuration: 0.3,
    reducedReturnDuration: 0.25,
    curve: 'uneasy',
  },
  hope: {
    desktopOffset: [0.42, 1.12, 4.3],
    mobileOffset: [0.18, 1.18, 5],
    targetOffset: [0, 0.18, 0],
    desktopFov: 40,
    mobileFov: 43,
    approachDuration: 1.9,
    holdDuration: 1.3,
    returnDuration: 1.65,
    reducedApproachDuration: 0.3,
    reducedHoldDuration: 0.25,
    reducedReturnDuration: 0.3,
    curve: 'rising',
  },
}

export function getFragmentTransitionDurations(
  fragment: FragmentId,
  reducedMotion: boolean,
) {
  const config = FRAGMENT_CAMERA_CHOREOGRAPHY[fragment]
  return reducedMotion
    ? {
        approach: config.reducedApproachDuration,
        hold: config.reducedHoldDuration,
        return: config.reducedReturnDuration,
      }
    : {
        approach: config.approachDuration,
        hold: config.holdDuration,
        return: config.returnDuration,
      }
}
