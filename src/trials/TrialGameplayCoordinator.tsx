import { useEffect, useRef } from 'react'
import { MathUtils } from 'three'
import { useExperienceStore } from '../state/experienceStore'
import { FOUNDATION_INFLUENCE, TRIAL_DEFINITIONS } from './trialConfig'
import { selectFearShield, setReconstructionHold, setTrialPointer } from './trialControls'
import { resetTrialBeat, trialRuntime } from './trialRuntime'

export function TrialGameplayCoordinator() {
  const phase = useExperienceStore((state) => state.phase)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const trialBeat = useExperienceStore((state) => state.trialBeat)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const reconstructionHolding = useExperienceStore((state) => state.reconstructionHolding)
  const reconstructionSync = useExperienceStore((state) => state.reconstructionSync)
  const frame = useRef<number | null>(null)
  const lastTime = useRef(0)
  const committedBeat = useRef(-1)
  const syncElapsed = useRef(0)

  useEffect(() => {
    if (phase === 'trial-active' && activeFragment) {
      resetTrialBeat(activeFragment, trialBeat)
      committedBeat.current = -1
    }
  }, [activeFragment, phase, trialBeat])

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      const x = (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1
      const y = -((event.clientY / Math.max(window.innerHeight, 1)) * 2 - 1)
      setTrialPointer(x, y)
      trialRuntime.endingPointerX = x
      trialRuntime.endingPointerY = y
    }
    const onKey = (event: KeyboardEvent) => {
      const state = useExperienceStore.getState()
      if (state.phase === 'reconstruction-synchronizing') {
        if (event.code === 'Space' || event.code === 'Enter') {
          event.preventDefault()
          setReconstructionHold(true)
        }
        return
      }
      if (state.phase !== 'trial-active' || !state.activeFragment) return
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
        trialRuntime.pointerX = MathUtils.clamp(trialRuntime.pointerX - 0.22, -1, 1)
        selectFearShield('left')
      } else if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        trialRuntime.pointerX = MathUtils.clamp(trialRuntime.pointerX + 0.22, -1, 1)
        selectFearShield('right')
      } else if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') {
        selectFearShield('up')
      }
      trialRuntime.inputEnergy = 1
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'Enter') {
        setReconstructionHold(false)
      }
    }
    const releaseHold = () => setReconstructionHold(false)
    window.addEventListener('pointerdown', onPointer)
    window.addEventListener('pointermove', onPointer)
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('pointerup', releaseHold)
    window.addEventListener('pointercancel', releaseHold)
    return () => {
      window.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('pointerup', releaseHold)
      window.removeEventListener('pointercancel', releaseHold)
    }
  }, [])

  useEffect(() => {
    lastTime.current = performance.now()
    if (phase !== 'reconstruction-synchronizing') syncElapsed.current = 0

    const tick = (now: number) => {
      const delta = Math.min((now - lastTime.current) / 1000, 0.75)
      lastTime.current = now
      const state = useExperienceStore.getState()

      if (trialRuntime.evidenceHold) {
        frame.current = requestAnimationFrame(tick)
        return
      }

      if (
        state.phase === 'trial-active' &&
        state.activeFragment &&
        committedBeat.current !== state.trialBeat
      ) {
        const definition = TRIAL_DEFINITIONS[state.activeFragment]
        const foundation = state.collectionOrder[0]
        const foundationTiming =
          foundation && foundation !== state.activeFragment
            ? FOUNDATION_INFLUENCE[foundation].timing
            : 1
        trialRuntime.beatElapsed += delta
        trialRuntime.inputEnergy = Math.max(0, trialRuntime.inputEnergy - delta * 0.8)
        const minimum =
          (reducedMotion
            ? Math.min(3.4, definition.beatMinimumSeconds)
            : definition.beatMinimumSeconds) * foundationTiming
        const elapsedRatio = MathUtils.clamp(trialRuntime.beatElapsed / minimum, 0, 1)
        let interactionRatio: number

        if (state.activeFragment === 'identity') {
          const target = trialRuntime.alignmentTarget
          const desired = target + trialRuntime.pointerX * 0.56
          trialRuntime.alignmentAngle = MathUtils.lerp(
            trialRuntime.alignmentAngle,
            desired,
            1 - Math.exp(-delta * 4.2),
          )
          const distance = Math.abs(trialRuntime.alignmentAngle - target)
          const aligned = distance < 0.12 && trialRuntime.inputEnergy > 0.04
          trialRuntime.alignmentHold = MathUtils.clamp(
            trialRuntime.alignmentHold + delta * (aligned ? 0.74 : -0.22),
            0,
            1,
          )
          interactionRatio = trialRuntime.alignmentHold
        } else if (state.activeFragment === 'fear') {
          trialRuntime.fearPulse = MathUtils.clamp(
            trialRuntime.beatElapsed / minimum,
            0,
            1,
          )
          interactionRatio =
            trialRuntime.fearShield === trialRuntime.fearDirection
              ? MathUtils.clamp((trialRuntime.beatElapsed - 0.7) / 1.1, 0, 1)
              : 0
        } else {
          const targetX = trialRuntime.hopeGateX
          trialRuntime.hopeSignalX = MathUtils.lerp(
            trialRuntime.hopeSignalX,
            trialRuntime.pointerX * 1.85,
            1 - Math.exp(-delta * 3.4),
          )
          trialRuntime.hopeSignalY = MathUtils.lerp(
            -2.8 + state.trialBeat * 1.8,
            -0.3 + state.trialBeat * 1.8,
            elapsedRatio,
          )
          const proximity =
            1 - MathUtils.clamp(Math.abs(trialRuntime.hopeSignalX - targetX) * 0.5, 0, 1)
          interactionRatio =
            proximity * elapsedRatio * (0.34 + trialRuntime.inputEnergy * 0.66)
        }

        trialRuntime.beatProgress = Math.min(elapsedRatio, interactionRatio)
        trialRuntime.beatEnergy = MathUtils.lerp(
          trialRuntime.beatEnergy,
          Math.max(elapsedRatio * 0.45, interactionRatio),
          1 - Math.exp(-delta * 4),
        )

        const completed = trialRuntime.beatElapsed >= minimum && interactionRatio >= 0.78
        const fallback = trialRuntime.beatElapsed >= definition.fallbackSeconds
        if (completed || fallback) {
          committedBeat.current = state.trialBeat
          state.completeTrialBeat(fallback && !completed)
        }
      } else if (state.phase === 'reconstruction-synchronizing') {
        syncElapsed.current += delta
        const holdRate = reducedMotion ? 0.115 : 0.072
        const assistRate = syncElapsed.current > 26 ? 0.075 : 0.009
        const next =
          state.reconstructionSync +
          delta * (state.reconstructionHolding ? holdRate : assistRate)
        trialRuntime.syncVisual = MathUtils.lerp(
          trialRuntime.syncVisual,
          next,
          1 - Math.exp(-delta * 3),
        )
        trialRuntime.syncInstability = MathUtils.lerp(
          trialRuntime.syncInstability,
          state.reconstructionHolding ? 0.12 : 0.72,
          1 - Math.exp(-delta * 2.4),
        )
        state.setReconstructionSync(next)
        if (next >= 1) state.beginReconstruction()
      }

      frame.current = requestAnimationFrame(tick)
    }

    frame.current = requestAnimationFrame(tick)
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
      frame.current = null
    }
  }, [phase, reconstructionHolding, reconstructionSync, reducedMotion])

  return null
}
