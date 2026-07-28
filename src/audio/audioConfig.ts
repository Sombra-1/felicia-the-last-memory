import type { ExperiencePhase, FragmentId } from '../state/experienceStore'

export type AudioContextStatus = 'idle' | 'running' | 'suspended' | 'unavailable'
export type AudioEvent =
  | 'none'
  | 'ambient-start'
  | 'entry-activation'
  | 'sound-confirmed'
  | 'calibration-sequence'
  | `fragment-${FragmentId}`
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
    ambientGain: 0.9,
    cueGain: 0.58,
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
    threshold: -16,
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
    frequencies: [330, 495, 660],
    oscillator: 'sine',
    duration: 1.25,
    pan: [-0.34, 0.34],
  },
  fear: {
    frequencies: [123.5, 164.8, 247],
    oscillator: 'triangle',
    duration: 1.1,
    pan: [-0.16, 0.24],
  },
  hope: {
    frequencies: [196, 246.9, 293.7],
    oscillator: 'sine',
    duration: 1.5,
    pan: [-0.18, 0.28],
  },
}

export const PHASE_AMBIENT_LEVEL: Partial<Record<ExperiencePhase, number>> = {
  chamber: 1,
  'approaching-fragment': 0.62,
  'revealing-fragment': 0.52,
  'returning-to-chamber': 0.76,
  'ready-for-reconstruction': 0.88,
  'reconstruction-initiating': 0.64,
  'reconstruction-collapse': 0.28,
  'reconstruction-void': 0.045,
  'reconstruction-recall': 0.12,
  'reconstruction-rebuilding': 0.55,
  'reconstruction-reveal': 0.76,
  ending: 0.68,
  resetting: 0.04,
}

export function getRecallSpacing(reducedIntensity: boolean) {
  return reducedIntensity ? 0.38 : 0.72
}
