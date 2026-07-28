import { useSyncExternalStore } from 'react'

export interface RuntimeDiagnostics {
  activeSequence: string
  cameraOwner: string
}

let snapshot: RuntimeDiagnostics = {
  activeSequence: 'none',
  cameraOwner: 'idle',
}
const listeners = new Set<() => void>()

export function updateRuntimeDiagnostics(update: Partial<RuntimeDiagnostics>) {
  if (!import.meta.env.DEV) return
  snapshot = { ...snapshot, ...update }
  listeners.forEach((listener) => listener())
}

export function useRuntimeDiagnostics() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => snapshot,
    () => snapshot,
  )
}
