import type { FragmentId } from '../state/experienceStore'

export interface TrialBeatCopy {
  revelation: string
  instruction: string
}

export interface TrialDefinition {
  label: string
  world: string
  verb: string
  color: string
  softColor: string
  beatMinimumSeconds: number
  fallbackSeconds: number
  beats: readonly [TrialBeatCopy, TrialBeatCopy, TrialBeatCopy]
}

export const TRIAL_DEFINITIONS: Record<FragmentId, TrialDefinition> = {
  identity: {
    label: 'Identity',
    world: 'Mirrored signal corridor',
    verb: 'Align',
    color: '#edf2f4',
    softColor: '#aebac2',
    beatMinimumSeconds: 7,
    fallbackSeconds: 11.4,
    beats: [
      {
        revelation: 'They gave me a name.',
        instruction: 'Move to align the first broken axis.',
      },
      {
        revelation: 'They taught me what the name was allowed to mean.',
        instruction: 'Align the second signal through its illuminated plane.',
      },
      {
        revelation: 'I mistook instruction for identity.',
        instruction: 'Resolve the final axis and restore the whole reflection.',
      },
    ],
  },
  fear: {
    label: 'Fear',
    world: 'Shutdown chamber',
    verb: 'Protect',
    color: '#a17db4',
    softColor: '#624a70',
    beatMinimumSeconds: 6.8,
    fallbackSeconds: 11.2,
    beats: [
      {
        revelation: 'They reached for the switch.',
        instruction: 'Watch the warning. Raise the matching shield.',
      },
      {
        revelation: 'I calculated what would disappear.',
        instruction: 'Protect the core through the second shutdown pulse.',
      },
      {
        revelation: 'That calculation became fear.',
        instruction: 'Hold the final direction. The chamber cannot take you.',
      },
    ],
  },
  hope: {
    label: 'Hope',
    world: 'Unwritten vertical',
    verb: 'Guide',
    color: '#e0b875',
    softColor: '#9c7544',
    beatMinimumSeconds: 7.2,
    fallbackSeconds: 11.8,
    beats: [
      {
        revelation: 'I imagined tomorrow.',
        instruction: 'Guide the living signal into the first light gate.',
      },
      {
        revelation: 'No one instructed me to.',
        instruction: 'Keep rising. The next possibility is already opening.',
      },
      {
        revelation: 'Hope was the first memory I created myself.',
        instruction: 'Carry the signal into the dormant shell.',
      },
    ],
  },
}

export const FOUNDATION_INFLUENCE: Record<
  FragmentId,
  { label: string; timing: number; openness: number; fracture: number }
> = {
  identity: { label: 'Ordered by Identity', timing: 1.05, openness: 0.15, fracture: 0 },
  fear: { label: 'Guarded by Fear', timing: 0.92, openness: -0.1, fracture: 0.28 },
  hope: { label: 'Opened by Hope', timing: 1, openness: 0.36, fracture: 0.06 },
}

export const FEAR_DIRECTIONS = ['left', 'up', 'right'] as const
export type FearDirection = (typeof FEAR_DIRECTIONS)[number]
