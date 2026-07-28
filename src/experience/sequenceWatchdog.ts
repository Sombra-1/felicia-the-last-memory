import { gsap } from 'gsap'

const WATCHDOG_GRACE_SECONDS = 0.9

export function armSequenceWatchdog(
  expectedDuration: number,
  settle: () => void,
): () => void {
  const watchdog = gsap.delayedCall(
    Math.max(0.4, expectedDuration + WATCHDOG_GRACE_SECONDS),
    settle,
  )
  return () => watchdog.kill()
}
