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
