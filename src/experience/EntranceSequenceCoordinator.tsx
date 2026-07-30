import { gsap } from 'gsap'
import { useEffect, useRef } from 'react'
import { updateRuntimeDiagnostics } from '../dev/runtimeDiagnostics'
import { useExperienceStore } from '../state/experienceStore'
import {
  completeEntranceRuntime,
  entranceRuntime,
  resetEntranceRuntime,
} from './entranceRuntime'
import { armSequenceWatchdog } from './sequenceWatchdog'

export function EntranceSequenceCoordinator() {
  const phase = useExperienceStore((state) => state.phase)
  const entranceComplete = useExperienceStore((state) => state.entranceComplete)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const timeline = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    timeline.current?.kill()

    if (phase === 'loading' || phase === 'intro') {
      resetEntranceRuntime()
      return
    }

    if (phase !== 'chamber' || entranceComplete) {
      completeEntranceRuntime()
      return
    }

    updateRuntimeDiagnostics({ activeSequence: 'entrance:archive-awakening' })
    const duration = reducedMotion ? 1.8 : 9.4
    const nextTimeline = gsap.timeline({
      defaults: { overwrite: 'auto' },
    })

    if (reducedMotion) {
      nextTimeline.to(entranceRuntime, {
        progress: 1,
        pulse: 1,
        sweep: 1,
        core: 1,
        identity: 1,
        fear: 1,
        hope: 1,
        architecture: 1,
        atmosphere: 1,
        duration,
        ease: 'power1.out',
      })
    } else {
      nextTimeline
        .to(entranceRuntime, { progress: 1, duration: 9.4, ease: 'power2.inOut' }, 0)
        .to(entranceRuntime, { pulse: 1, duration: 2.05, ease: 'power2.inOut' }, 0.08)
        .to(entranceRuntime, { core: 1.18, duration: 0.72, ease: 'power3.out' }, 0.16)
        .to(entranceRuntime, { core: 1, duration: 0.72, ease: 'sine.inOut' }, 0.88)
        .to(entranceRuntime, { identity: 1, duration: 1.1, ease: 'power3.out' }, 1.4)
        .to(entranceRuntime, { fear: 1, duration: 1.15, ease: 'power3.out' }, 3.1)
        .to(entranceRuntime, { hope: 1, duration: 1.2, ease: 'power3.out' }, 4.8)
        .to(
          entranceRuntime,
          { architecture: 1, duration: 5.6, ease: 'power3.inOut' },
          0.62,
        )
        .to(entranceRuntime, { sweep: 1, duration: 5.4, ease: 'power2.inOut' }, 0.72)
        .to(entranceRuntime, { atmosphere: 1, duration: 3.2, ease: 'sine.out' }, 4.7)
    }

    const settle = () => {
      completeEntranceRuntime()
      useExperienceStore.getState().completeEntrance()
      updateRuntimeDiagnostics({ activeSequence: 'none' })
    }
    const disarm = armSequenceWatchdog(duration, () => nextTimeline.progress(1))
    nextTimeline.eventCallback('onComplete', () => {
      disarm()
      settle()
    })
    timeline.current = nextTimeline

    return () => {
      disarm()
      nextTimeline.kill()
      if (useExperienceStore.getState().entranceComplete) completeEntranceRuntime()
    }
  }, [entranceComplete, phase, reducedMotion])

  return null
}
