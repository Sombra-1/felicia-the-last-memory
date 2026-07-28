import type { QualityLevel } from '../../state/experienceStore'

export interface QualityProfile {
  dpr: [number, number]
  antialias: boolean
  particleCount: number
  postprocessing: boolean
  bloomMipmaps: boolean
  toneMappingExposure: number
  readabilityBoost: number
  lineOpacity: number
}

export const QUALITY_PROFILES: Record<QualityLevel, QualityProfile> = {
  low: {
    dpr: [1, 1],
    antialias: false,
    particleCount: 24,
    postprocessing: false,
    bloomMipmaps: false,
    toneMappingExposure: 1.08,
    readabilityBoost: 1.18,
    lineOpacity: 1,
  },
  medium: {
    dpr: [1, 1.35],
    antialias: true,
    particleCount: 52,
    postprocessing: true,
    bloomMipmaps: false,
    toneMappingExposure: 1.02,
    readabilityBoost: 1.08,
    lineOpacity: 0.92,
  },
  high: {
    dpr: [1, 1.75],
    antialias: true,
    particleCount: 88,
    postprocessing: true,
    bloomMipmaps: true,
    toneMappingExposure: 0.98,
    readabilityBoost: 1,
    lineOpacity: 0.86,
  },
}

export function inferQualityLevel({
  hardwareConcurrency,
  viewportWidth,
  deviceMemory,
}: {
  hardwareConcurrency: number
  viewportWidth: number
  deviceMemory?: number
}): QualityLevel {
  if (hardwareConcurrency <= 2 || (deviceMemory !== undefined && deviceMemory <= 2)) {
    return 'low'
  }

  if (
    hardwareConcurrency <= 6 ||
    viewportWidth <= 700 ||
    (deviceMemory !== undefined && deviceMemory <= 4)
  ) {
    return 'medium'
  }

  return 'high'
}
