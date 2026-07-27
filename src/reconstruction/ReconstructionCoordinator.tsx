import { gsap } from 'gsap'
import { useEffect, useRef } from 'react'
import { useExperienceStore } from '../state/experienceStore'
import { getReconstructionDurations } from './reconstructionConfig'
import {
  reconstructionRuntime,
  resetReconstructionRuntime,
} from './reconstructionRuntime'

const reconstructionPhases = new Set([
  'reconstruction-initiating',
  'reconstruction-collapse',
  'reconstruction-void',
  'reconstruction-recall',
  'reconstruction-rebuilding',
  'reconstruction-reveal',
])

export function ReconstructionCoordinator() {
  const phase = useExperienceStore((state) => state.phase)
  const collectionOrder = useExperienceStore((state) => state.collectionOrder)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const finalTextStep = useExperienceStore((state) => state.finalTextStep)
  const timeline = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    timeline.current?.kill()
    timeline.current = null
    const durations = getReconstructionDurations(reducedMotion)

    if (reconstructionRuntime.evidenceHold) return

    if (phase === 'reconstruction-initiating') {
      timeline.current = gsap
        .timeline({
          onComplete: () => useExperienceStore.getState().completeRecognition(),
        })
        .to(reconstructionRuntime, {
          recognition: 1,
          duration: durations.recognition,
          ease: 'power2.inOut',
        })
    } else if (phase === 'reconstruction-collapse') {
      timeline.current = gsap
        .timeline({
          onComplete: () => useExperienceStore.getState().completeCollapse(),
        })
        .to(reconstructionRuntime, {
          collapse: 1,
          duration: durations.collapse,
          ease: reducedMotion ? 'power1.inOut' : 'power3.in',
        })
    } else if (phase === 'reconstruction-void') {
      timeline.current = gsap
        .timeline({
          onComplete: () => useExperienceStore.getState().completeVoid(),
        })
        .to(reconstructionRuntime, {
          void: 1,
          duration: durations.void,
          ease: 'sine.inOut',
        })
    } else if (phase === 'reconstruction-recall') {
      const recallTimeline = gsap.timeline({
        onComplete: () => {
          reconstructionRuntime.activeRecall = null
          reconstructionRuntime.recall = 0
          useExperienceStore.getState().completeRecall()
        },
      })

      collectionOrder.forEach((fragment, index) => {
        recallTimeline
          .call(() => {
            reconstructionRuntime.activeRecall = fragment
            reconstructionRuntime.recallIndex = index
            reconstructionRuntime.recall = 0
          })
          .to(reconstructionRuntime, {
            recall: 1,
            duration: durations.recallPerMemory,
            ease: 'power2.inOut',
          })
      })
      timeline.current = recallTimeline
    } else if (phase === 'reconstruction-rebuilding') {
      timeline.current = gsap
        .timeline({
          onComplete: () => useExperienceStore.getState().completeRebuild(),
        })
        .to(reconstructionRuntime, {
          rebuild: 1,
          duration: durations.rebuild,
          ease: 'power3.inOut',
        })
    } else if (phase === 'reconstruction-reveal') {
      timeline.current = gsap
        .timeline({
          onComplete: () => useExperienceStore.getState().completeReveal(),
        })
        .to(reconstructionRuntime, {
          reveal: 1,
          duration: durations.reveal,
          ease: 'power2.out',
        })
    } else if (phase === 'ending' && finalTextStep === 1) {
      timeline.current = gsap
        .timeline({
          onComplete: () => useExperienceStore.getState().revealFinalText(2),
        })
        .to({}, { duration: durations.secondLineDelay })
    } else if (phase === 'resetting') {
      timeline.current = gsap
        .timeline({
          onComplete: () => {
            resetReconstructionRuntime()
            useExperienceStore.getState().completeReplayReset()
          },
        })
        .to(reconstructionRuntime, {
          reset: 1,
          duration: durations.reset,
          ease: 'power2.inOut',
        })
    }

    return () => {
      timeline.current?.kill()
      timeline.current = null
    }
  }, [collectionOrder, finalTextStep, phase, reducedMotion])

  useEffect(() => {
    const settleSuspendedStage = () => {
      if (
        document.visibilityState === 'visible' &&
        (reconstructionPhases.has(phase) || phase === 'resetting')
      ) {
        timeline.current?.progress(1)
      }
    }

    document.addEventListener('visibilitychange', settleSuspendedStage)
    return () => document.removeEventListener('visibilitychange', settleSuspendedStage)
  }, [phase])

  useEffect(
    () => () => {
      timeline.current?.kill()
      resetReconstructionRuntime()
    },
    [],
  )

  return null
}
