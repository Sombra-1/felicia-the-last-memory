import type { AudioContextStatus } from './audioConfig'

export interface SoundControlState {
  label:
    | 'Sound on'
    | 'Sound off'
    | 'Enable sound'
    | 'Sound blocked — tap to enable'
    | 'Sound unavailable'
  ariaLabel: string
  disabled: boolean
  active: boolean
}

export function getSoundControlState(
  enabled: boolean,
  status: AudioContextStatus,
): SoundControlState {
  if (status === 'unavailable') {
    return {
      label: 'Sound unavailable',
      ariaLabel: 'Sound unavailable',
      disabled: true,
      active: false,
    }
  }

  if (!enabled) {
    return {
      label: 'Sound off',
      ariaLabel: 'Enable ambient sound',
      disabled: false,
      active: false,
    }
  }

  if (status === 'running') {
    return {
      label: 'Sound on',
      ariaLabel: 'Mute ambient sound',
      disabled: false,
      active: true,
    }
  }

  if (status === 'suspended') {
    return {
      label: 'Sound blocked — tap to enable',
      ariaLabel: 'Sound is blocked. Tap to enable sound',
      disabled: false,
      active: false,
    }
  }

  return {
    label: 'Enable sound',
    ariaLabel: 'Enable ambient sound',
    disabled: false,
    active: false,
  }
}
