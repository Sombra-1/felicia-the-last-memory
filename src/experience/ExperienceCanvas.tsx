import { Canvas } from '@react-three/fiber'
import { useCallback, useEffect, useState } from 'react'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'
import { FoundationScene } from '../scene/FoundationScene'
import { QUALITY_PROFILES } from '../scene/config/quality'
import { useExperienceStore } from '../state/experienceStore'
import { LoadingScreen } from '../ui/LoadingScreen'
import { WebGLFallback } from '../ui/WebGLFallback'
import { canInitializeWebGL } from '../utils/webgl'
import { RendererBoundary } from './RendererBoundary'

export function ExperienceCanvas() {
  const quality = useExperienceStore((state) => state.quality)
  const [ready, setReady] = useState(false)
  const [rendererFailed, setRendererFailed] = useState(() => !canInitializeWebGL())
  const [rendererElement, setRendererElement] = useState<HTMLCanvasElement | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const profile = QUALITY_PROFILES[quality]
  const canRetry = retryCount < 2
  const retry = useCallback(() => {
    if (!canRetry) return
    setReady(false)
    setRendererFailed(!canInitializeWebGL())
    setRendererElement(null)
    setRetryCount((count) => count + 1)
  }, [canRetry])

  useEffect(() => {
    if (!rendererElement) return
    const handleContextLost = (event: Event) => {
      event.preventDefault()
      setReady(false)
      setRendererFailed(true)
    }
    rendererElement.addEventListener('webglcontextlost', handleContextLost)
    return () =>
      rendererElement.removeEventListener('webglcontextlost', handleContextLost)
  }, [rendererElement])

  return (
    <div className="experience-canvas">
      <RendererBoundary key={retryCount} canRetry={canRetry} onRetry={retry}>
        {rendererFailed ? (
          <WebGLFallback canRetry={canRetry} onRetry={retry} />
        ) : (
          <Canvas
            key={retryCount}
            camera={{
              position: [0.8, 0.55, 10],
              fov: 42,
              near: 0.1,
              far: 42,
            }}
            dpr={profile.dpr}
            fallback={<WebGLFallback canRetry={canRetry} onRetry={retry} />}
            flat={false}
            gl={{
              alpha: false,
              antialias: profile.antialias,
              powerPreference: 'high-performance',
            }}
            onCreated={({ gl }) => {
              gl.outputColorSpace = SRGBColorSpace
              gl.toneMapping = ACESFilmicToneMapping
              gl.toneMappingExposure = profile.toneMappingExposure
              setRendererElement(gl.domElement)
              useExperienceStore.getState().setLoadingProgress(100)
              setReady(true)
            }}
            performance={{ min: 0.5 }}
            shadows={false}
          >
            <FoundationScene />
          </Canvas>
        )}
      </RendererBoundary>
      {!rendererFailed && (
        <div
          className={`canvas-loading${ready ? ' canvas-loading--hidden' : ''}`}
          aria-hidden={ready}
        >
          <LoadingScreen
            label="Unfolding the last memory"
            progress={ready ? 100 : undefined}
          />
        </div>
      )}
    </div>
  )
}
