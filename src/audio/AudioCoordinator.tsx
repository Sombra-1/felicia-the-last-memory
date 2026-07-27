import { useEffect, useRef } from 'react'
import { useExperienceStore } from '../state/experienceStore'
import { feliciaAudioEngine } from './FeliciaAudioEngine'

export function AudioCoordinator() {
  const phase = useExperienceStore((state) => state.phase)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const collectionOrder = useExperienceStore((state) => state.collectionOrder)
  const endingProfile = useExperienceStore((state) => state.endingProfileId)
  const enabled = useExperienceStore((state) => state.audioEnabled)
  const volume = useExperienceStore((state) => state.audioVolume)
  const hasUserInteracted = useExperienceStore((state) => state.hasUserInteracted)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const previousPhase = useRef(phase)
  const previousFragment = useRef(activeFragment)

  useEffect(() => {
    feliciaAudioEngine.setDiagnosticsListener((diagnostics) => {
      useExperienceStore.getState().setAudioDiagnostics(diagnostics)
    })
    return () => feliciaAudioEngine.setDiagnosticsListener(null)
  }, [])

  useEffect(() => {
    feliciaAudioEngine.setEnabled(enabled)
    feliciaAudioEngine.setVolume(volume)
  }, [enabled, volume])

  useEffect(() => {
    if (!hasUserInteracted) return
    void feliciaAudioEngine.unlock()
  }, [hasUserInteracted])

  useEffect(() => {
    if (!hasUserInteracted) return

    feliciaAudioEngine.setPhase(phase)
    if (
      phase === 'approaching-fragment' &&
      activeFragment &&
      (previousPhase.current !== phase || previousFragment.current !== activeFragment)
    ) {
      feliciaAudioEngine.playFragment(activeFragment)
    }
    if (phase === 'reconstruction-recall' && previousPhase.current !== phase) {
      feliciaAudioEngine.playRecallOrder(collectionOrder, reducedMotion)
    }
    if (phase === 'ending' && previousPhase.current !== phase && endingProfile) {
      feliciaAudioEngine.playEndingProfile(endingProfile)
    }

    previousPhase.current = phase
    previousFragment.current = activeFragment
  }, [
    activeFragment,
    collectionOrder,
    endingProfile,
    hasUserInteracted,
    phase,
    reducedMotion,
  ])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        void feliciaAudioEngine.suspend()
      } else if (hasUserInteracted && enabled) {
        void feliciaAudioEngine.resume()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [enabled, hasUserInteracted])

  return null
}
