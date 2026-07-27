import { useEffect } from 'react'
import { readAudioPreference, writeAudioPreference } from '../audio/audioPreferences'
import { inferQualityLevel } from '../scene/config/quality'
import { useExperienceStore } from '../state/experienceStore'

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number
}

export function useExperiencePreferences() {
  const setQuality = useExperienceStore((state) => state.setQuality)
  const setReducedMotion = useExperienceStore((state) => state.setReducedMotion)

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncMotion = () => setReducedMotion(motionQuery.matches)

    syncMotion()
    const storage = window.localStorage
    const storedAudioPreference = readAudioPreference(storage)
    if (storedAudioPreference !== null) {
      useExperienceStore.getState().setAudioEnabled(storedAudioPreference)
    }
    setQuality(
      inferQualityLevel({
        hardwareConcurrency: navigator.hardwareConcurrency ?? 4,
        viewportWidth: window.innerWidth,
        deviceMemory: (navigator as NavigatorWithMemory).deviceMemory,
      }),
    )
    motionQuery.addEventListener('change', syncMotion)
    const unsubscribeAudio = useExperienceStore.subscribe((state, previous) => {
      if (state.audioEnabled !== previous.audioEnabled) {
        writeAudioPreference(state.audioEnabled, storage)
      }
    })

    return () => {
      motionQuery.removeEventListener('change', syncMotion)
      unsubscribeAudio()
    }
  }, [setQuality, setReducedMotion])
}
