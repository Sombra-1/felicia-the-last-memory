import type { ExperiencePhase, FragmentId } from '../state/experienceStore'

export type AudioContextStatus = 'idle' | 'running' | 'suspended' | 'unavailable'
export type AudioEvent =
  | 'none'
  | 'ambient-start'
  | `fragment-${FragmentId}`
  | `reconstruction-${string}`
  | `ending-${FragmentId}`
  | 'muted'
  | 'unmuted'

export interface AudioDiagnostics {
  status: AudioContextStatus
  ambientStartCount: number
  lastEvent: AudioEvent
}

export const AUDIO_CALIBRATION = {
  masterGain: 0.2,
  ambientGain: 0.42,
  cueGain: 0.075,
  fadeSeconds: 0.7,
  safetyCompressor: {
    threshold: -20,
    knee: 16,
    ratio: 4,
    attack: 0.012,
    release: 0.32,
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
    frequencies: [82.4, 103.8, 155.6],
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
