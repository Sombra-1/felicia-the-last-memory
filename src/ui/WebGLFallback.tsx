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
