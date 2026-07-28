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
    const duration = reducedMotion ? 0.9 : 3.6
    const nextTimeline = gsap.timeline({
      defaults: { overwrite: 'auto' },
    })

    if (reducedMotion) {
      nextTimeline.to(entranceRuntime, {
        progress: 1,
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
        .to(entranceRuntime, { core: 1, duration: 0.75, ease: 'power2.out' })
        .to(entranceRuntime, { identity: 1, duration: 0.62, ease: 'power3.out' }, 0.42)
        .to(entranceRuntime, { fear: 1, duration: 0.62, ease: 'power3.out' }, 0.88)
        .to(entranceRuntime, { hope: 1, duration: 0.68, ease: 'power3.out' }, 1.34)
        .to(
          entranceRuntime,
          { architecture: 1, duration: 1.2, ease: 'power2.inOut' },
          1.15,
        )
        .to(entranceRuntime, { atmosphere: 1, duration: 1.25, ease: 'sine.out' }, 1.72)
        .to(entranceRuntime, { progress: 1, duration: 0.7, ease: 'power1.out' }, 2.9)
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
