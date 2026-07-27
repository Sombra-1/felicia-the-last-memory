import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { Group, MathUtils } from 'three'
import { sequenceRuntime } from '../experience/sequenceRuntime'
import { PALETTE } from '../scene/config/visual'
import { useExperienceStore } from '../state/experienceStore'

interface IdentityFragmentProps {
  hovered: boolean
  active: boolean
  collected: boolean
}

export function IdentityFragment({ hovered, active, collected }: IdentityFragmentProps) {
  const structure = useRef<Group>(null)
  const mirrors = useRef<Group>(null)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)

  useFrame(({ clock }, delta) => {
    if (!structure.current || !mirrors.current) return
    const reveal = active ? sequenceRuntime.visualProgress : 0
    const targetRotation =
      active || collected
        ? Math.PI * 0.25
        : reducedMotion
          ? 0.18
          : clock.elapsedTime * 0.12
    structure.current.rotation.y = MathUtils.damp(
      structure.current.rotation.y,
      targetRotation,
      active ? 3.4 : 1.4,
      delta,
    )
    structure.current.rotation.z = MathUtils.damp(
      structure.current.rotation.z,
      active ? Math.PI * 0.25 : hovered ? Math.PI / 4 : 0,
      2.8,
      delta,
    )
    const mirrorScale = reducedMotion ? reveal : MathUtils.smootherstep(reveal, 0.15, 0.9)
    mirrors.current.visible = active && reveal > 0.04
    mirrors.current.scale.setScalar(Math.max(0.001, mirrorScale))
    mirrors.current.position.x = MathUtils.lerp(0.18, 0.7, reveal)
  })

  return (
    <group ref={structure}>
      {[0.72, 0.5, 0.31].map((scale, index) => (
        <mesh key={scale} scale={scale} rotation={[0, index * 0.7, Math.PI / 4]}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={index === 2 ? PALETTE.white : PALETTE.silver}
            emissive={PALETTE.white}
            emissiveIntensity={index === 2 ? 1.1 : 0.18}
            metalness={0.86}
            roughness={0.22}
            wireframe={index !== 2}
            toneMapped={index !== 2}
          />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.86, 0.012, 4, 48]} />
        <meshBasicMaterial color={PALETTE.white} transparent opacity={0.34} />
      </mesh>
      <group ref={mirrors} scale={0.001}>
        <mesh position={[-1, 0, 0]} scale={0.42} rotation={[0, 0, Math.PI / 4]}>
          <octahedronGeometry args={[1, 0]} />
          <meshBasicMaterial
            color={PALETTE.silver}
            transparent
            opacity={0.28}
            wireframe
          />
        </mesh>
        <mesh position={[0.65, 0, 0]} scale={0.42} rotation={[0, 0, Math.PI / 4]}>
          <octahedronGeometry args={[1, 0]} />
          <meshBasicMaterial
            color={PALETTE.silver}
            transparent
            opacity={0.28}
            wireframe
          />
        </mesh>
      </group>
    </group>
  )
}
