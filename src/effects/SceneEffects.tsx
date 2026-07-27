import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { QUALITY_PROFILES } from '../scene/config/quality'
import { useExperienceStore } from '../state/experienceStore'
import { VISUAL_CALIBRATION } from '../scene/config/visual'

export function SceneEffects() {
  const quality = useExperienceStore((state) => state.quality)
  const profile = QUALITY_PROFILES[quality]

  if (!profile.postprocessing) return null

  return (
    <EffectComposer multisampling={quality === 'high' ? 4 : 0}>
      <Bloom
        intensity={VISUAL_CALIBRATION.bloomIntensity}
        luminanceThreshold={VISUAL_CALIBRATION.bloomThreshold}
        luminanceSmoothing={VISUAL_CALIBRATION.bloomSmoothing}
        mipmapBlur={profile.bloomMipmaps}
      />
      <Vignette
        offset={VISUAL_CALIBRATION.vignetteOffset}
        darkness={VISUAL_CALIBRATION.vignetteDarkness}
        eskil={false}
      />
    </EffectComposer>
  )
}
