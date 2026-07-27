import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, Group, MathUtils, Points } from 'three'
import { deriveEndingConfiguration } from '../reconstruction/endingProfiles'
import { reconstructionRuntime } from '../reconstruction/reconstructionRuntime'
import { QUALITY_PROFILES } from '../scene/config/quality'
import { PALETTE, VISUAL_CALIBRATION } from '../scene/config/visual'
import { useExperienceStore } from '../state/experienceStore'

function seeded(index: number, salt: number) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453
  return value - Math.floor(value)
}

export function Atmosphere() {
  const atmosphere = useRef<Group>(null)
  const particles = useRef<Points>(null)
  const quality = useExperienceStore((state) => state.quality)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const phase = useExperienceStore((state) => state.phase)
  const order = useExperienceStore((state) => state.collectionOrder)
  const ending = deriveEndingConfiguration(order)
  const count = QUALITY_PROFILES[quality].particleCount

  const positions = useMemo(() => {
    const values = new Float32Array(count * 3)

    for (let index = 0; index < count; index += 1) {
      const radius = 1.8 + seeded(index, 1) * 4.5
      const angle = seeded(index, 2) * Math.PI * 2
      values[index * 3] = Math.cos(angle) * radius
      values[index * 3 + 1] = -2.4 + seeded(index, 3) * 6.2
      values[index * 3 + 2] = Math.sin(angle) * radius - seeded(index, 4) * 2.5
    }

    return values
  }, [count])

  useFrame(({ clock }) => {
    if (!particles.current || !atmosphere.current) return
    const darkness = Math.max(
      reconstructionRuntime.collapse,
      phase === 'reconstruction-void' ? 0.92 : 0,
    )
    const rebuilt =
      phase === 'reconstruction-rebuilding'
        ? reconstructionRuntime.rebuild
        : phase === 'reconstruction-reveal' || phase === 'ending'
          ? 1
          : 0
    atmosphere.current.scale.setScalar(MathUtils.lerp(1, 0.15, darkness) + rebuilt * 0.85)
    if (!reducedMotion) {
      particles.current.rotation.y =
        clock.elapsedTime *
        (ending?.motionDirection === 'guarded' && rebuilt ? 0.018 : 0.006)
      particles.current.position.y =
        Math.sin(clock.elapsedTime * 0.13) * 0.06 +
        rebuilt * (ending?.motionDirection === 'ascending' ? 0.7 : 0)
    }
  })

  return (
    <group ref={atmosphere}>
      <points ref={particles}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#b6afc2"
          size={quality === 'high' ? 0.025 : 0.032}
          sizeAttenuation
          transparent
          opacity={
            VISUAL_CALIBRATION.particleOpacity * QUALITY_PROFILES[quality].lineOpacity
          }
          depthWrite={false}
        />
      </points>
      <mesh position={[0, 3.5, -2.3]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[1.62, 8.5, 64, 1, true]} />
        <meshBasicMaterial
          color={PALETTE.violet}
          transparent
          opacity={quality === 'low' ? 0.01 : 0.017}
          depthWrite={false}
          blending={AdditiveBlending}
          side={2}
        />
      </mesh>
      <mesh position={[0, 3.35, -1.2]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.46, 7, 48, 1, true]} />
        <meshBasicMaterial
          color={PALETTE.white}
          transparent
          opacity={0.012}
          depthWrite={false}
          blending={AdditiveBlending}
          side={2}
        />
      </mesh>
    </group>
  )
}
