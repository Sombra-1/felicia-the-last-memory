# Shared UI components

Framework: React 19 with React Three Fiber. The experience intentionally has a very
small DOM component surface; most reusable visual primitives are Three.js scene
components.

## LoadingScreen

- Path: `src/ui/LoadingScreen.tsx`
- Purpose: Full-screen archive boot state and renderer hand-off.
- Props: `label?: string`, `progress?: number`

```tsx
interface LoadingScreenProps {
  label?: string
  progress?: number
}

export function LoadingScreen({
  label = 'Recovering signal',
  progress,
}: LoadingScreenProps) {
  const safeProgress =
    progress === undefined ? null : Math.min(100, Math.max(0, Math.round(progress)))

  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <span className="loading-screen__title">FELICIA</span>
      <small>The Last Memory</small>
      <p>{label}</p>
      <div
        className={`loading-track${safeProgress === null ? ' is-indeterminate' : ''}`}
        aria-hidden="true"
      >
        <span
          style={
            safeProgress === null
              ? undefined
              : { transform: `scaleX(${safeProgress / 100})` }
          }
        />
      </div>
      <span>
        {safeProgress === null
          ? 'Locating final signal'
          : `${safeProgress.toString().padStart(2, '0')}%`}
      </span>
    </div>
  )
}
```

## WebGLFallback

- Path: `src/ui/WebGLFallback.tsx`
- Purpose: Accessible renderer failure and retry state.
- Props: `canRetry: boolean`, `onRetry: () => void`

```tsx
interface WebGLFallbackProps {
  canRetry: boolean
  onRetry: () => void
}

export function WebGLFallback({ canRetry, onRetry }: WebGLFallbackProps) {
  return (
    <section
      className="webgl-fallback"
      role="alert"
      aria-labelledby="webgl-fallback-title"
    >
      <p className="eyebrow">Archive signal interrupted</p>
      <h2 id="webgl-fallback-title">The memory chamber could not open.</h2>
      <p>
        The visual renderer did not initialize. Your browser may recover if the archive is
        attempted again.
      </p>
      <button
        className="enter-button"
        type="button"
        onClick={onRetry}
        disabled={!canRetry}
      >
        <span>{canRetry ? 'Retry memory' : 'Retry unavailable'}</span>
        <span aria-hidden="true">↻</span>
      </button>
    </section>
  )
}
```

## Three.js visual primitives

- `src/scene/FeliciaCore.tsx`: hero anatomy, layered shell, ribs, internal memory
  system, core shards, neural filaments.
- `src/trials/TrialWorlds.tsx`: current shared `MemorySurface` shader plus Identity,
  Fear, and Hope world compositions.
- `src/environment/CollectedConsequences.tsx`: persistent consequences and return
  transfer geometry.
- `src/reconstruction/ReconstructionSpectacle.tsx`: collapse crown, memory streams,
  cathedral machine, and signature transformation.

These are the reusable scene primitives that matter for this visual pass; basic DOM
buttons and labels remain inline in `MemoryInterface`.
