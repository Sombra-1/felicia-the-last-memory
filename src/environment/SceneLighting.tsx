import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { AmbientLight, Color, Fog, MathUtils, PointLight, SpotLight } from 'three'
import { trialRuntime } from '../trials/trialRuntime'
import { entranceRuntime } from '../experience/entranceRuntime'
import { deriveEndingConfiguration } from '../reconstruction/endingProfiles'
import { reconstructionRuntime } from '../reconstruction/reconstructionRuntime'
import { QUALITY_PROFILES } from '../scene/config/quality'
import { PALETTE, VISUAL_CALIBRATION } from '../scene/config/visual'
import { useExperienceStore } from '../state/experienceStore'

const baseLightColor = new Color('#d8d6cd')
const identityLightColor = new Color('#dfe8e9')
const fearLightColor = new Color('#68466f')
const hopeLightColor = new Color('#d3a45e')
const baseFogColor = new Color(PALETTE.void)
const fearFogColor = new Color('#09070b')
const hopeFogColor = new Color('#0a0907')

export function SceneLighting() {
  const keyLight = useRef<SpotLight>(null)
  const rimLight = useRef<PointLight>(null)
  const ambient = useRef<AmbientLight>(null)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const quality = useExperienceStore((state) => state.quality)
  const phase = useExperienceStore((state) => state.phase)
  const collectionOrder = useExperienceStore((state) => state.collectionOrder)
  const ending = deriveEndingConfiguration(collectionOrder)

  useFrame(({ scene }, delta) => {
    if (!keyLight.current || !rimLight.current || !ambient.current) return
    const reveal = activeFragment
      ? Math.max(
          trialRuntime.anticipation,
          trialRuntime.beatEnergy,
          trialRuntime.completion,
        )
      : 0
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
    const awakeningPulse = Math.sin(entranceRuntime.pulse * Math.PI)
    const lightSweep = MathUtils.smootherstep(entranceRuntime.sweep, 0, 1)
    const threatX =
      activeFragment === 'fear'
        ? trialRuntime.fearDirection === 'left'
          ? -6.4
          : trialRuntime.fearDirection === 'right'
            ? 6.4
            : 0.2
        : activeFragment === 'identity'
          ? -6.2
          : activeFragment === 'hope'
            ? 0.4
            : -4.8
    const threatY =
      activeFragment === 'fear' && trialRuntime.fearDirection === 'up'
        ? 7.4
        : activeFragment === 'hope'
          ? -0.8
          : 4.8
    keyLight.current.position.x = MathUtils.lerp(-7.2, threatX, lightSweep + reveal * 0.2)
    keyLight.current.position.y = MathUtils.lerp(2.4, threatY, lightSweep + reveal * 0.2)
    keyLight.current.position.z =
      activeFragment === 'hope' ? 2.2 : activeFragment === 'fear' ? 3.1 : 4.6
    keyLight.current.intensity =
      (VISUAL_CALIBRATION.keyLightIntensity +
        reveal * (activeFragment === 'identity' ? 9 : activeFragment === 'hope' ? 7 : 4) +
        awakeningPulse * (reducedMotion ? 8 : 19)) *
        MathUtils.lerp(1, 0.018, darkness) +
      rebuilt * 18
    keyLight.current.intensity *= 0.055 + entranceRuntime.architecture * 0.945
    ambient.current.intensity =
      MathUtils.lerp(
        VISUAL_CALIBRATION.ambientIntensity * QUALITY_PROFILES[quality].readabilityBoost,
        0.025,
        darkness,
      ) +
      rebuilt * 0.28
    ambient.current.intensity *= 0.1 + entranceRuntime.progress * 0.9
    rimLight.current.position.x = MathUtils.lerp(
      5.8,
      activeFragment === 'hope' ? -1.2 : 3.4,
      lightSweep + reveal * 0.18,
    )
    rimLight.current.position.y = MathUtils.lerp(
      -0.8,
      activeFragment === 'hope' ? 1.2 : 1.8,
      lightSweep + reveal * 0.18,
    )
    rimLight.current.intensity =
      (1.4 + lightSweep * 4 + awakeningPulse * (reducedMotion ? 5 : 12)) *
        MathUtils.lerp(1, 0.04, darkness) +
      rebuilt * 2.8

    if (scene.fog instanceof Fog) {
      scene.fog.color.lerp(targetFog, colorEase * Math.max(0.12, reveal))
    }
  })

  return (
    <>
      <ambientLight
        ref={ambient}
        color="#596064"
        intensity={
          VISUAL_CALIBRATION.ambientIntensity * QUALITY_PROFILES[quality].readabilityBoost
        }
      />
      <spotLight
        ref={keyLight}
        position={[-3.8, 7.2, 5.4]}
        color={PALETTE.white}
        intensity={VISUAL_CALIBRATION.keyLightIntensity}
        angle={0.46}
        penumbra={0.88}
        distance={18}
        decay={2}
        castShadow={false}
      />
      <pointLight
        ref={rimLight}
        position={[3.4, 1.8, -3.6]}
        color="#6d7474"
        intensity={4.6}
        distance={12}
        decay={2}
      />
    </>
  )
}
