import type { ExperiencePhase, FragmentId } from '../state/experienceStore'

export type AudioContextStatus = 'idle' | 'running' | 'suspended' | 'unavailable'
export type AudioEvent =
  | 'none'
  | 'ambient-start'
  | 'entry-activation'
  | 'sound-confirmed'
  | 'calibration-sequence'
  | `fragment-${FragmentId}`
  | `trial-${FragmentId}-${number}`
  | `motifs-${string}`
  | `reconstruction-${string}`
  | `ending-${FragmentId}`
  | 'muted'
  | 'unmuted'

export interface AudioDiagnostics {
  status: AudioContextStatus
  ambientStartCount: number
  lastEvent: AudioEvent
  masterGain: number
  ambientGain: number
  cueGain: number
}

export type AudioCalibrationPreset = 'quiet' | 'normal' | 'headphones'

export const AUDIO_CALIBRATION_PRESETS = {
  quiet: {
    masterGain: 0.56,
    ambientGain: 0.72,
    cueGain: 0.42,
  },
  normal: {
    masterGain: 0.92,
    ambientGain: 0.8,
    cueGain: 0.64,
  },
  headphones: {
    masterGain: 0.52,
    ambientGain: 0.68,
    cueGain: 0.4,
  },
} as const satisfies Record<
  AudioCalibrationPreset,
  { masterGain: number; ambientGain: number; cueGain: number }
>

export const AUDIO_CALIBRATION = {
  ...AUDIO_CALIBRATION_PRESETS.normal,
  preset: 'normal' as AudioCalibrationPreset,
  fadeSeconds: 0.55,
  safetyCompressor: {
    threshold: -18,
    knee: 8,
    ratio: 8,
    attack: 0.006,
    release: 0.22,
  },
} as const

export const FRAGMENT_AUDIO_SIGNATURES: Record<
  FragmentId,
  {
    frequencies: readonly [number, number, number]
    oscillator: OscillatorType
    duration: number
    pan: readonly [number, number]
  }
> = {
  identity: {
    frequencies: [294, 441, 588],
    oscillator: 'sine',
    duration: 1.9,
    pan: [-0.34, 0.34],
  },
  fear: {
    frequencies: [147, 185, 277],
    oscillator: 'triangle',
    duration: 2.05,
    pan: [-0.16, 0.24],
  },
  hope: {
    frequencies: [220, 277, 349],
    oscillator: 'sine',
    duration: 2.3,
    pan: [-0.18, 0.28],
  },
}

export const PHASE_AMBIENT_LEVEL: Partial<Record<ExperiencePhase, number>> = {
  chamber: 1,
  'trial-departure': 0.66,
  'trial-arrival': 0.56,
  'trial-active': 0.54,
  'trial-completing': 0.72,
  'trial-returning': 0.8,
  'ready-for-reconstruction': 0.88,
  'reconstruction-synchronizing': 0.72,
  'reconstruction-initiating': 0.7,
  'reconstruction-collapse': 0.4,
  'reconstruction-void': 0.09,
  'reconstruction-recall': 0.2,
  'reconstruction-rebuilding': 0.68,
  'reconstruction-reveal': 0.82,
  ending: 0.74,
  resetting: 0.04,
}

export function getRecallSpacing(reducedIntensity: boolean) {
  return reducedIntensity ? 0.38 : 1.05
}
