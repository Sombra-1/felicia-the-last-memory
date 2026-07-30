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
    desktopOffset: [0, 0.12, 5.15],
    mobileOffset: [0, 0.32, 5.85],
    targetOffset: [0, 0.02, 0],
    desktopFov: 40,
    mobileFov: 44,
    approachDuration: 1.42,
    holdDuration: 1.42,
    returnDuration: 1.18,
    reducedApproachDuration: 0.28,
    reducedHoldDuration: 0.25,
    reducedReturnDuration: 0.28,
    curve: 'centered',
  },
  fear: {
    desktopOffset: [0.58, 0.28, 5.82],
    mobileOffset: [-0.32, 0.42, 5.95],
    targetOffset: [0.08, -0.02, 0],
    desktopFov: 44,
    mobileFov: 46,
    approachDuration: 1.34,
    holdDuration: 1.5,
    returnDuration: 1.16,
    reducedApproachDuration: 0.25,
    reducedHoldDuration: 0.3,
    reducedReturnDuration: 0.25,
    curve: 'uneasy',
  },
  hope: {
    desktopOffset: [0.34, 0.92, 6.5],
    mobileOffset: [0.18, 1.18, 6.2],
    targetOffset: [-0.62, 0.55, 0],
    desktopFov: 46,
    mobileFov: 46,
    approachDuration: 1.48,
    holdDuration: 1.58,
    returnDuration: 1.22,
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
