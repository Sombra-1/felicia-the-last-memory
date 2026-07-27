export const AUDIO_PREFERENCE_KEY = 'felicia-audio-enabled'

export function readAudioPreference(storage?: Pick<Storage, 'getItem'> | null) {
  const value = storage?.getItem(AUDIO_PREFERENCE_KEY)
  return value === 'true' || value === 'false' ? value === 'true' : null
}

export function writeAudioPreference(
  enabled: boolean,
  storage?: Pick<Storage, 'setItem'> | null,
) {
  storage?.setItem(AUDIO_PREFERENCE_KEY, String(enabled))
}
