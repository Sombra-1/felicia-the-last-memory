import { useEffect, useRef } from 'react'
import { useExperienceStore } from '../state/experienceStore'

function focusElement(selector: string) {
  window.requestAnimationFrame(() => {
    const target = document.querySelector<HTMLElement>(selector)
    target?.focus({ preventScroll: true })
  })
}

export function FocusCoordinator() {
  const phase = useExperienceStore((state) => state.phase)
  const inputLocked = useExperienceStore((state) => state.inputLocked)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const collected = useExperienceStore((state) => state.collectedFragments)
  const replayAvailable = useExperienceStore((state) => state.replayAvailable)
  const previousPhase = useRef(phase)
  const activeCollected = activeFragment !== null && collected.includes(activeFragment)

  useEffect(() => {
    const phaseChanged = previousPhase.current !== phase
    previousPhase.current = phase

    if (!inputLocked && phase === 'chamber' && phaseChanged) {
      focusElement('.fragment-control:not(:disabled)')
    } else if (!inputLocked && phase === 'revealing-fragment' && activeCollected) {
      focusElement('.return-control')
    } else if (!inputLocked && phase === 'ready-for-reconstruction') {
      focusElement('.reconstruction-trigger button')
    } else if (phase === 'ending' && replayAvailable) {
      focusElement('.ending-actions button')
    }
  }, [activeCollected, inputLocked, phase, replayAvailable])

  return null
}
