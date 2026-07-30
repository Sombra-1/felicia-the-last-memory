import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { Group, MathUtils } from 'three'
import { trialRuntime } from '../trials/trialRuntime'
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
  const trails = useRef<Group>(null)
  const axes = useRef<Group>(null)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)

  useFrame(({ clock }, delta) => {
    if (!structure.current || !mirrors.current || !trails.current || !axes.current) return
    const reveal = active
      ? Math.max(trialRuntime.anticipation, trialRuntime.departure)
      : 0
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
    trails.current.rotation.x = -clock.elapsedTime * (reducedMotion ? 0 : 0.08)
    trails.current.rotation.y = reveal * Math.PI * 0.5
    trails.current.scale.setScalar(0.86 + reveal * 0.42)
    const alignment = MathUtils.smootherstep(reveal, 0.24, 0.94)
    axes.current.visible = active && reveal > 0.08
    axes.current.scale.set(Math.max(0.001, alignment), Math.max(0.001, alignment), 1)
    axes.current.rotation.z = MathUtils.lerp(-0.42, 0, alignment)
  })

  return (
    <group ref={structure}>
      {[0.72, 0.5, 0.31].map((scale, index) => (
        <mesh key={scale} scale={scale} rotation={[0, index * 0.7, Math.PI / 4]}>
          {index === 2 ? (
            <icosahedronGeometry args={[1, 1]} />
          ) : (
            <octahedronGeometry args={[1, 0]} />
          )}
          <meshStandardMaterial
            color={index === 2 ? PALETTE.white : PALETTE.silver}
            emissive={PALETTE.white}
            emissiveIntensity={index === 2 ? 1.2 : 0.26}
            metalness={0.86}
            roughness={index === 2 ? 0.2 : 0.32}
            transparent={index !== 2}
            opacity={index === 2 ? 1 : index === 0 ? 0.28 : 0.42}
            wireframe={false}
            toneMapped={index !== 2}
          />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.86, 0.012, 4, 48]} />
        <meshBasicMaterial color={PALETTE.white} transparent opacity={0.34} />
      </mesh>
      <group ref={trails}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.08, 0.014, 5, 72, Math.PI * 1.68]} />
          <meshBasicMaterial color="#edf2f4" transparent opacity={0.46} />
        </mesh>
        <mesh rotation={[0.45, Math.PI / 2, 0.2]}>
          <torusGeometry args={[0.94, 0.009, 5, 72, Math.PI * 1.42]} />
          <meshBasicMaterial color="#aeb8c0" transparent opacity={0.32} />
        </mesh>
      </group>
      <mesh position={[-0.88, 0, -0.16]} scale={[0.02, 0.72, 0.5]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#c5ccd2"
          emissive="#dce4e9"
          emissiveIntensity={0.32}
          metalness={0.92}
          roughness={0.12}
          transparent
          opacity={0.34}
        />
      </mesh>
      <mesh position={[0.88, 0, -0.16]} scale={[0.02, 0.72, 0.5]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#c5ccd2"
          emissive="#dce4e9"
          emissiveIntensity={0.32}
          metalness={0.92}
          roughness={0.12}
          transparent
          opacity={0.34}
        />
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
      <group ref={axes} visible={false} position={[0, 0, -0.34]}>
        <mesh scale={[1.6, 0.018, 0.035]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#f1f4f6" transparent opacity={0.68} />
        </mesh>
        <mesh scale={[0.018, 1.6, 0.035]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#f1f4f6" transparent opacity={0.68} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.28, 0.018, 5, 64]} />
          <meshBasicMaterial color="#b9c2c9" transparent opacity={0.46} />
        </mesh>
      </group>
    </group>
  )
}
