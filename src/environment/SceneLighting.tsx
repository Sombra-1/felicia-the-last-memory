import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { AmbientLight, Color, Fog, MathUtils, SpotLight } from 'three'
import { sequenceRuntime } from '../experience/sequenceRuntime'
import { deriveEndingConfiguration } from '../reconstruction/endingProfiles'
import { reconstructionRuntime } from '../reconstruction/reconstructionRuntime'
import { QUALITY_PROFILES } from '../scene/config/quality'
import { PALETTE, VISUAL_CALIBRATION } from '../scene/config/visual'
import { useExperienceStore } from '../state/experienceStore'

const baseLightColor = new Color(PALETTE.white)
const identityLightColor = new Color('#eef2f6')
const fearLightColor = new Color('#89729b')
const hopeLightColor = new Color('#e0be89')
const baseFogColor = new Color(PALETTE.void)
const fearFogColor = new Color('#110d16')
const hopeFogColor = new Color('#100e0b')

export function SceneLighting() {
  const keyLight = useRef<SpotLight>(null)
  const ambient = useRef<AmbientLight>(null)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const quality = useExperienceStore((state) => state.quality)
  const phase = useExperienceStore((state) => state.phase)
  const collectionOrder = useExperienceStore((state) => state.collectionOrder)
  const ending = deriveEndingConfiguration(collectionOrder)

  useFrame(({ clock, scene }, delta) => {
    if (!keyLight.current || !ambient.current) return
    const reveal = activeFragment ? sequenceRuntime.visualProgress : 0
    const rebuilt =
      phase === 'reconstruction-rebuilding'
        ? reconstructionRuntime.rebuild
        : phase === 'reconstruction-reveal' || phase === 'ending'
          ? 1
          : 0
    const targetColor =
      rebuilt > 0 && ending
        ? new Color(ending.profile.dominantColor)
        : activeFragment === 'identity'
          ? identityLightColor
          : activeFragment === 'fear'
            ? fearLightColor
            : activeFragment === 'hope'
              ? hopeLightColor
              : baseLightColor
    const targetFog =
      activeFragment === 'fear'
        ? fearFogColor
        : activeFragment === 'hope'
          ? hopeFogColor
          : baseFogColor
    const colorEase = reducedMotion ? 1 : 1 - Math.exp(-delta * 2.4)

    keyLight.current.color.lerp(targetColor, colorEase * Math.max(0.15, reveal))
    ambient.current.color.lerp(targetColor, colorEase * Math.max(0.12, reveal * 0.28))
    const darkness = Math.max(
      reconstructionRuntime.collapse,
      phase === 'reconstruction-void' || phase === 'reconstruction-recall' ? 1 : 0,
    )
    keyLight.current.intensity =
      (VISUAL_CALIBRATION.keyLightIntensity +
        reveal * (activeFragment === 'identity' ? 8 : activeFragment === 'hope' ? 5 : 3) +
        (reducedMotion ? 0 : Math.sin(clock.elapsedTime * 0.31) * 1.3)) *
        MathUtils.lerp(1, 0.018, darkness) +
      rebuilt * 28
    ambient.current.intensity =
      MathUtils.lerp(
        VISUAL_CALIBRATION.ambientIntensity * QUALITY_PROFILES[quality].readabilityBoost,
        0.025,
        darkness,
      ) +
      rebuilt * 0.38

    if (scene.fog instanceof Fog) {
      scene.fog.color.lerp(targetFog, colorEase * Math.max(0.12, reveal))
    }
  })

  return (
    <>
      <ambientLight
        ref={ambient}
        color="#777181"
        intensity={
          VISUAL_CALIBRATION.ambientIntensity * QUALITY_PROFILES[quality].readabilityBoost
        }
      />
      <spotLight
        ref={keyLight}
        position={[-3.6, 7.5, 5.2]}
        color={PALETTE.white}
        intensity={VISUAL_CALIBRATION.keyLightIntensity}
        angle={0.38}
        penumbra={0.92}
        distance={18}
        decay={2}
        castShadow={false}
      />
    </>
  )
}
