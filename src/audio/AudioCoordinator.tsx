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
  const trialBeat = useExperienceStore((state) => state.trialBeat)
  const previousPhase = useRef(phase)
  const previousFragment = useRef(activeFragment)
  const previousTrialBeat = useRef(trialBeat)
  const previousOrderLength = useRef(collectionOrder.length)
  const trialBeatTimer = useRef<number | null>(null)

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

    if (trialBeatTimer.current !== null) {
      window.clearTimeout(trialBeatTimer.current)
      trialBeatTimer.current = null
    }
    feliciaAudioEngine.setPhase(phase)
    if (
      phase === 'trial-departure' &&
      activeFragment &&
      (previousPhase.current !== phase || previousFragment.current !== activeFragment)
    ) {
      feliciaAudioEngine.playFragment(activeFragment)
    }
    if (
      phase === 'trial-active' &&
      activeFragment &&
      (previousPhase.current !== phase || previousTrialBeat.current !== trialBeat)
    ) {
      const fragment = activeFragment
      const beat = trialBeat
      trialBeatTimer.current = window.setTimeout(() => {
        const state = useExperienceStore.getState()
        if (
          state.phase === 'trial-active' &&
          state.activeFragment === fragment &&
          state.trialBeat === beat
        ) {
          feliciaAudioEngine.playTrialBeat(fragment, beat)
        }
        trialBeatTimer.current = null
      }, 240)
    }
    if (phase === 'reconstruction-recall' && previousPhase.current !== phase) {
      feliciaAudioEngine.playRecallOrder(collectionOrder, reducedMotion)
    }
    if (phase === 'ending' && previousPhase.current !== phase && endingProfile) {
      feliciaAudioEngine.playEndingProfile(endingProfile)
    }
    if (
      (phase === 'chamber' || phase === 'ready-for-reconstruction') &&
      collectionOrder.length > previousOrderLength.current
    ) {
      feliciaAudioEngine.playChamberMotifs(collectionOrder)
    }

    previousPhase.current = phase
    previousFragment.current = activeFragment
    previousTrialBeat.current = trialBeat
    previousOrderLength.current = collectionOrder.length

    return () => {
      if (trialBeatTimer.current !== null) {
        window.clearTimeout(trialBeatTimer.current)
        trialBeatTimer.current = null
      }
    }
  }, [
    activeFragment,
    collectionOrder,
    endingProfile,
    hasUserInteracted,
    phase,
    reducedMotion,
    trialBeat,
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
