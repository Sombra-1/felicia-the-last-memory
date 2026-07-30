import { gsap } from 'gsap'
import { useEffect, useRef } from 'react'
import { updateRuntimeDiagnostics } from '../dev/runtimeDiagnostics'
import {
  reconstructionRuntime,
  resetReconstructionRuntime,
} from '../reconstruction/reconstructionRuntime'
import { getReconstructionDurations } from '../reconstruction/reconstructionConfig'
import { useExperienceStore } from '../state/experienceStore'
import { resetTrialRuntime, trialRuntime } from '../trials/trialRuntime'
import { armSequenceWatchdog } from './sequenceWatchdog'

const authoredTransitionPhases = new Set([
  'trial-departure',
  'trial-arrival',
  'trial-completing',
  'trial-returning',
  'ready-for-reconstruction',
  'reconstruction-initiating',
  'reconstruction-collapse',
  'reconstruction-void',
  'reconstruction-recall',
  'reconstruction-rebuilding',
  'reconstruction-reveal',
  'ending',
  'resetting',
])

function trialDurations(reducedMotion: boolean) {
  return reducedMotion
    ? { departure: 0.52, arrival: 0.34, completion: 0.48, return: 0.52 }
    : { departure: 2.05, arrival: 0.72, completion: 1.85, return: 2.15 }
}

export function TransitionDirector() {
  const phase = useExperienceStore((state) => state.phase)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const collectionOrder = useExperienceStore((state) => state.collectionOrder)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const finalTextStep = useExperienceStore((state) => state.finalTextStep)
  const endingExplorationReady = useExperienceStore(
    (state) => state.endingExplorationReady,
  )
  const timeline = useRef<gsap.core.Timeline | null>(null)
  const disarmWatchdog = useRef<(() => void) | null>(null)

  useEffect(() => {
    timeline.current?.kill()
    disarmWatchdog.current?.()
    timeline.current = null
    disarmWatchdog.current = null

    const trial = trialDurations(reducedMotion)
    const reconstruction = getReconstructionDurations(reducedMotion)
    let expectedDuration = 0

    updateRuntimeDiagnostics({
      activeSequence: authoredTransitionPhases.has(phase)
        ? `director:${phase}${activeFragment ? `:${activeFragment}` : ''}`
        : 'none',
    })

    if (phase === 'resetting') {
      trialRuntime.evidenceHold = false
      reconstructionRuntime.evidenceHold = false
    } else if (trialRuntime.evidenceHold || reconstructionRuntime.evidenceHold) {
      return
    }

    if (phase === 'trial-departure' && activeFragment) {
      resetTrialRuntime(activeFragment)
      expectedDuration = trial.departure
      const next = gsap.timeline({
        defaults: { overwrite: 'auto' },
        onComplete: () => useExperienceStore.getState().beginTrialArrival(activeFragment),
      })
      next
        .to(trialRuntime, {
          anticipation: 1,
          duration: trial.departure * 0.22,
          ease: activeFragment === 'fear' ? 'power2.inOut' : 'power2.out',
        })
        .to(
          trialRuntime,
          {
            departure: 1,
            chamberSuppression: reducedMotion ? 0.75 : 1,
            duration: trial.departure * 0.43,
            ease:
              activeFragment === 'identity'
                ? 'power3.inOut'
                : activeFragment === 'fear'
                  ? 'power2.in'
                  : 'sine.inOut',
          },
          '>-0.02',
        )
        .to(trialRuntime, {
          passage: 1,
          duration: trial.departure * 0.35,
          ease: activeFragment === 'hope' ? 'sine.out' : 'power3.out',
        })
      timeline.current = next
    } else if (phase === 'trial-arrival' && activeFragment) {
      expectedDuration = trial.arrival
      timeline.current = gsap
        .timeline({
          onComplete: () => useExperienceStore.getState().beginTrial(activeFragment),
        })
        .to(trialRuntime, {
          arrival: 1,
          duration: trial.arrival,
          ease: activeFragment === 'identity' ? 'power3.out' : 'sine.out',
        })
    } else if (phase === 'trial-completing' && activeFragment) {
      expectedDuration = trial.completion
      timeline.current = gsap
        .timeline({
          onComplete: () =>
            useExperienceStore.getState().beginTrialReturn(activeFragment),
        })
        .to(trialRuntime, {
          completion: 1,
          beatEnergy: 1,
          duration: trial.completion,
          ease: activeFragment === 'fear' ? 'power3.out' : 'power2.inOut',
        })
    } else if (phase === 'trial-returning' && activeFragment) {
      expectedDuration = trial.return
      timeline.current = gsap
        .timeline({
          onComplete: () => {
            useExperienceStore.getState().completeTrialReturn(activeFragment)
            resetTrialRuntime()
          },
        })
        .to(trialRuntime, {
          returnProgress: 1,
          duration: trial.return * 0.72,
          ease: activeFragment === 'hope' ? 'sine.inOut' : 'power3.inOut',
        })
        .to(
          trialRuntime,
          {
            chamberSuppression: 0,
            duration: trial.return * 0.56,
            ease: 'power2.out',
          },
          trial.return * 0.44,
        )
    } else if (phase === 'ready-for-reconstruction') {
      expectedDuration = reconstruction.completionHold
      timeline.current = gsap
        .timeline({
          onComplete: () => useExperienceStore.getState().beginSynchronization(),
        })
        .to({}, { duration: reconstruction.completionHold })
    } else if (phase === 'reconstruction-initiating') {
      expectedDuration = reconstruction.recognition
      timeline.current = gsap
        .timeline({
          onComplete: () => useExperienceStore.getState().completeRecognition(),
        })
        .to(reconstructionRuntime, {
          recognition: 1,
          duration: reconstruction.recognition,
          ease: 'power2.inOut',
        })
    } else if (phase === 'reconstruction-collapse') {
      expectedDuration = reconstruction.collapse
      timeline.current = gsap
        .timeline({
          onComplete: () => useExperienceStore.getState().completeCollapse(),
        })
        .to(reconstructionRuntime, {
          collapse: 1,
          duration: reconstruction.collapse,
          ease: reducedMotion ? 'power1.inOut' : 'power3.in',
        })
    } else if (phase === 'reconstruction-void') {
      expectedDuration = reconstruction.void
      timeline.current = gsap
        .timeline({
          onComplete: () => useExperienceStore.getState().completeVoid(),
        })
        .to(reconstructionRuntime, {
          void: 1,
          duration: reconstruction.void,
          ease: 'sine.inOut',
        })
    } else if (phase === 'reconstruction-recall') {
      expectedDuration = reconstruction.recallPerMemory * collectionOrder.length
      const next = gsap.timeline({
        onComplete: () => {
          reconstructionRuntime.activeRecall = null
          reconstructionRuntime.recall = 0
          useExperienceStore.getState().completeRecall()
        },
      })
      collectionOrder.forEach((fragment, index) => {
        next
          .call(() => {
            reconstructionRuntime.activeRecall = fragment
            reconstructionRuntime.recallIndex = index
            reconstructionRuntime.recall = 0
            useExperienceStore.getState().setReconstructionMemory(index as 0 | 1 | 2)
          })
          .to(reconstructionRuntime, {
            recall: 1,
            duration: reconstruction.recallPerMemory,
            ease: 'power2.inOut',
          })
      })
      timeline.current = next
    } else if (phase === 'reconstruction-rebuilding') {
      expectedDuration = reconstruction.rebuild
      timeline.current = gsap
        .timeline({
          onComplete: () => useExperienceStore.getState().completeRebuild(),
        })
        .to(reconstructionRuntime, {
          rebuild: 1,
          duration: reconstruction.rebuild,
          ease: 'power3.inOut',
        })
    } else if (phase === 'reconstruction-reveal') {
      expectedDuration = reconstruction.reveal
      timeline.current = gsap
        .timeline({
          onComplete: () => useExperienceStore.getState().completeReveal(),
        })
        .to(reconstructionRuntime, {
          reveal: 1,
          duration: reconstruction.reveal,
          ease: 'power2.out',
        })
    } else if (phase === 'ending' && !endingExplorationReady) {
      expectedDuration = reducedMotion ? 0.3 : 1.1
      timeline.current = gsap
        .timeline({
          onComplete: () => useExperienceStore.getState().makeEndingExplorable(),
        })
        .to({}, { duration: expectedDuration })
    } else if (phase === 'ending' && finalTextStep === 0) {
      expectedDuration = reconstruction.firstLineDelay
      timeline.current = gsap
        .timeline({
          onComplete: () => useExperienceStore.getState().revealFinalText(1),
        })
        .to({}, { duration: expectedDuration })
    } else if (phase === 'ending' && finalTextStep === 1) {
      expectedDuration = reconstruction.secondLineDelay
      timeline.current = gsap
        .timeline({
          onComplete: () => useExperienceStore.getState().revealFinalText(2),
        })
        .to({}, { duration: expectedDuration })
    } else if (phase === 'ending' && finalTextStep === 2) {
      expectedDuration = reconstruction.tableauHold
      timeline.current = gsap
        .timeline({
          onComplete: () => useExperienceStore.getState().makeReplayAvailable(),
        })
        .to({}, { duration: expectedDuration })
    } else if (phase === 'resetting') {
      expectedDuration = reconstruction.reset
      timeline.current = gsap
        .timeline({
          onComplete: () => {
            resetReconstructionRuntime()
            resetTrialRuntime()
            useExperienceStore.getState().completeReplayReset()
          },
        })
        .to(reconstructionRuntime, {
          reset: 1,
          duration: reconstruction.reset,
          ease: 'power2.inOut',
        })
    }

    if (timeline.current && expectedDuration > 0) {
      const current = timeline.current
      disarmWatchdog.current = armSequenceWatchdog(expectedDuration, () => {
        current.progress(1)
      })
    }

    return () => {
      timeline.current?.kill()
      disarmWatchdog.current?.()
      timeline.current = null
      disarmWatchdog.current = null
    }
  }, [
    activeFragment,
    collectionOrder,
    endingExplorationReady,
    finalTextStep,
    phase,
    reducedMotion,
  ])

  useEffect(() => {
    const settleInterruptedTransition = () => {
      if (
        document.visibilityState === 'visible' &&
        authoredTransitionPhases.has(useExperienceStore.getState().phase)
      ) {
        timeline.current?.progress(1)
      }
    }
    document.addEventListener('visibilitychange', settleInterruptedTransition)
    return () =>
      document.removeEventListener('visibilitychange', settleInterruptedTransition)
  }, [])

  useEffect(
    () => () => {
      timeline.current?.kill()
      disarmWatchdog.current?.()
      resetTrialRuntime()
      resetReconstructionRuntime()
      updateRuntimeDiagnostics({ activeSequence: 'none' })
    },
    [],
  )

  return null
}
