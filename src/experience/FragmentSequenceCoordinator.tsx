import { gsap } from 'gsap'
import { useEffect, useRef } from 'react'
import { getFragmentTransitionDurations } from '../camera/fragmentCameraConfig'
import { updateRuntimeDiagnostics } from '../dev/runtimeDiagnostics'
import { useExperienceStore } from '../state/experienceStore'
import { resetSequenceRuntime, sequenceRuntime } from './sequenceRuntime'
import { armSequenceWatchdog } from './sequenceWatchdog'

export function FragmentSequenceCoordinator() {
  const phase = useExperienceStore((state) => state.phase)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const activeCollected = useExperienceStore(
    (state) =>
      state.activeFragment !== null &&
      state.collectedFragments.includes(state.activeFragment),
  )
  const timeline = useRef<gsap.core.Timeline | null>(null)
  const disarmWatchdog = useRef<(() => void) | null>(null)

  useEffect(() => {
    disarmWatchdog.current?.()
    disarmWatchdog.current = null
    timeline.current?.kill()
    timeline.current = null
    updateRuntimeDiagnostics({
      activeSequence: activeFragment ? `fragment:${activeFragment}:${phase}` : 'none',
    })

    if (!activeFragment) {
      if (
        phase === 'loading' ||
        phase === 'intro' ||
        phase === 'chamber' ||
        phase === 'ready-for-reconstruction'
      ) {
        resetSequenceRuntime()
      }
      return
    }

    sequenceRuntime.fragment = activeFragment
    const durations = getFragmentTransitionDurations(activeFragment, reducedMotion)

    if (phase === 'approaching-fragment') {
      const nextTimeline = gsap.timeline({
        defaults: { overwrite: 'auto' },
        onComplete: () => {
          useExperienceStore.getState().beginFragmentReveal(activeFragment)
        },
      })
      nextTimeline.to(sequenceRuntime, {
        cameraProgress: 1,
        visualProgress: 0.32,
        suppression: 1,
        duration: durations.approach,
        ease: activeFragment === 'fear' ? 'power2.inOut' : 'power3.inOut',
      })
      timeline.current = nextTimeline
      const disarm = armSequenceWatchdog(durations.approach, () => {
        if (useExperienceStore.getState().phase === 'approaching-fragment') {
          nextTimeline.progress(1)
        }
      })
      disarmWatchdog.current = disarm
      nextTimeline.eventCallback('onComplete', () => {
        disarm()
        useExperienceStore.getState().beginFragmentReveal(activeFragment)
      })
    }

    if (phase === 'revealing-fragment' && !activeCollected) {
      const nextTimeline = gsap.timeline({
        defaults: { overwrite: 'auto' },
        onComplete: () => {
          useExperienceStore.getState().completeFragmentReveal(activeFragment)
        },
      })
      nextTimeline.to(sequenceRuntime, {
        visualProgress: 1,
        duration: durations.hold,
        ease:
          activeFragment === 'identity'
            ? 'power2.out'
            : activeFragment === 'fear'
              ? 'power1.inOut'
              : 'sine.inOut',
      })
      timeline.current = nextTimeline
      const disarm = armSequenceWatchdog(durations.hold, () => {
        if (useExperienceStore.getState().phase === 'revealing-fragment') {
          nextTimeline.progress(1)
        }
      })
      disarmWatchdog.current = disarm
      nextTimeline.eventCallback('onComplete', () => {
        disarm()
        useExperienceStore.getState().completeFragmentReveal(activeFragment)
      })
    }

    if (phase === 'returning-to-chamber') {
      const nextTimeline = gsap.timeline({
        defaults: { overwrite: 'auto' },
        onComplete: () => {
          useExperienceStore.getState().completeReturn(activeFragment)
        },
      })
      nextTimeline.to(sequenceRuntime, {
        cameraProgress: 0,
        visualProgress: 0,
        suppression: 0,
        duration: durations.return,
        ease: 'power3.inOut',
      })
      timeline.current = nextTimeline
      const disarm = armSequenceWatchdog(durations.return, () => {
        if (useExperienceStore.getState().phase === 'returning-to-chamber') {
          nextTimeline.progress(1)
        }
      })
      disarmWatchdog.current = disarm
      nextTimeline.eventCallback('onComplete', () => {
        disarm()
        useExperienceStore.getState().completeReturn(activeFragment)
      })
    }

    return () => {
      disarmWatchdog.current?.()
      disarmWatchdog.current = null
      timeline.current?.kill()
      timeline.current = null
      updateRuntimeDiagnostics({ activeSequence: 'none' })
    }
  }, [activeCollected, activeFragment, phase, reducedMotion])

  useEffect(() => {
    const settleSuspendedSequence = () => {
      if (
        document.visibilityState === 'visible' &&
        (phase === 'approaching-fragment' ||
          phase === 'revealing-fragment' ||
          phase === 'returning-to-chamber')
      ) {
        timeline.current?.progress(1)
      }
    }

    const returnWithEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && phase === 'revealing-fragment' && activeCollected) {
        useExperienceStore.getState().requestReturn()
      }
    }

    document.addEventListener('visibilitychange', settleSuspendedSequence)
    window.addEventListener('keydown', returnWithEscape)
    return () => {
      document.removeEventListener('visibilitychange', settleSuspendedSequence)
      window.removeEventListener('keydown', returnWithEscape)
    }
  }, [activeCollected, phase])

  useEffect(
    () => () => {
      timeline.current?.kill()
      disarmWatchdog.current?.()
      resetSequenceRuntime()
      updateRuntimeDiagnostics({ activeSequence: 'none' })
    },
    [],
  )

  return null
}
