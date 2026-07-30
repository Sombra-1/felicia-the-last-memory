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
  const replayAvailable = useExperienceStore((state) => state.replayAvailable)
  const previousPhase = useRef(phase)

  useEffect(() => {
    const phaseChanged = previousPhase.current !== phase
    previousPhase.current = phase

    if (!inputLocked && phase === 'chamber' && phaseChanged) {
      focusElement('.fragment-control:not(:disabled)')
    } else if (!inputLocked && phase === 'trial-active' && phaseChanged) {
      focusElement('.trial-control-surface button, .trial-control-surface')
    } else if (!inputLocked && phase === 'reconstruction-synchronizing') {
      focusElement('.synchronization-interface button')
    } else if (phase === 'ending' && replayAvailable) {
      focusElement('.ending-actions button')
    }
  }, [inputLocked, phase, replayAvailable])

  return null
}
