import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  MathUtils,
  Object3D,
} from 'three'
import { PALETTE } from '../scene/config/visual'
import { trialRuntime } from '../trials/trialRuntime'
import { useExperienceStore } from '../state/experienceStore'

function HopeMotes({ active, collected }: { active: boolean; collected: boolean }) {
  const motes = useRef<Group>(null)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const geometry = useMemo(() => {
    const positions = Array.from({ length: 18 }, (_, index) => {
      const angle = index * 2.399
      const radius = 0.18 + (index % 4) * 0.11
      return [Math.cos(angle) * radius, index * 0.12 - 0.5, Math.sin(angle) * radius]
    }).flat()
    const moteGeometry = new BufferGeometry()
    moteGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    return moteGeometry
  }, [])

  useFrame(({ clock }) => {
    if (!motes.current) return
    const reveal = active
      ? Math.max(trialRuntime.anticipation, trialRuntime.departure)
      : 0
    motes.current.position.y =
      reveal * 0.45 +
      (reducedMotion || collected ? 0 : Math.sin(clock.elapsedTime * 0.8) * 0.025)
    motes.current.scale.setScalar(0.75 + reveal * 0.65)
  })

  return (
    <group ref={motes}>
      <points geometry={geometry}>
        <pointsMaterial
          color={PALETTE.hopeSoft}
          size={0.045}
          transparent
          opacity={0.55}
          depthWrite={false}
          toneMapped={false}
        />
      </points>
    </group>
  )
}

interface HopeFragmentProps {
  hovered: boolean
  active: boolean
  collected: boolean
}

export function HopeFragment({ hovered, active, collected }: HopeFragmentProps) {
  const group = useRef<Group>(null)
  const petals = useRef<InstancedMesh>(null)
  const filaments = useRef<Group>(null)
  const ascension = useRef<Group>(null)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)

  useLayoutEffect(() => {
    if (!petals.current) return
    const transform = new Object3D()

    for (let index = 0; index < 6; index += 1) {
      const angle = (index / 6) * Math.PI * 2
      transform.position.set(Math.cos(angle) * 0.31, Math.sin(angle) * 0.31, 0)
      transform.rotation.set(0, 0, angle)
      transform.scale.set(0.09, 0.36, 0.055)
      transform.updateMatrix()
      petals.current.setMatrixAt(index, transform.matrix)
    }
    petals.current.instanceMatrix.needsUpdate = true
  }, [])

  useFrame(({ clock }, delta) => {
    if (!group.current || !petals.current || !filaments.current || !ascension.current)
      return
    const time = clock.elapsedTime
    const reveal = active
      ? Math.max(trialRuntime.anticipation, trialRuntime.departure)
      : 0
    group.current.rotation.y = MathUtils.damp(
      group.current.rotation.y,
      active
        ? MathUtils.lerp(0.18, 0.72, reveal)
        : reducedMotion || collected
          ? 0.2
          : Math.sin(time * 0.32) * 0.32,
      1,
      delta,
    )
    const opening = active ? 1 + reveal * 0.2 : hovered ? 1.07 : 1
    group.current.scale.x = MathUtils.damp(group.current.scale.x, opening, 3, delta)
    group.current.scale.y = MathUtils.damp(group.current.scale.y, opening, 3, delta)
    group.current.position.y = MathUtils.damp(
      group.current.position.y,
      active ? reveal * 0.32 : 0,
      2.5,
      delta,
    )
    filaments.current.rotation.y =
      (reducedMotion ? 0.1 : time * 0.08) + reveal * Math.PI * 0.28
    filaments.current.scale.setScalar(0.78 + reveal * 0.62)
    filaments.current.position.y = reveal * 0.18
    const emergence = MathUtils.smootherstep(reveal, 0.18, 0.96)
    ascension.current.visible = active && reveal > 0.08
    ascension.current.position.y = MathUtils.lerp(-0.72, 0.72, emergence)
    ascension.current.scale.set(
      0.72 + emergence * 0.42,
      Math.max(0.04, emergence),
      0.72 + emergence * 0.42,
    )
    ascension.current.rotation.z =
      (1 - emergence) * -0.28 + (reducedMotion ? 0 : Math.sin(time * 0.42) * 0.018)

    const transform = new Object3D()
    for (let index = 0; index < 6; index += 1) {
      const angle = (index / 6) * Math.PI * 2
      const radius = 0.31 + reveal * 0.13
      transform.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius + reveal * 0.08,
        0,
      )
      transform.rotation.set(0, reveal * 0.35, angle)
      transform.scale.set(0.09, 0.36 + reveal * 0.08, 0.055)
      transform.updateMatrix()
      petals.current.setMatrixAt(index, transform.matrix)
    }
    petals.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group ref={group}>
      <instancedMesh ref={petals} args={[undefined, undefined, 6]}>
        <sphereGeometry args={[1, 20, 12]} />
        <meshStandardMaterial
          color="#a88e6a"
          emissive={PALETTE.hope}
          emissiveIntensity={hovered ? 1.15 : 0.78}
          metalness={0.42}
          roughness={0.46}
          transparent
          opacity={0.42}
          depthWrite={false}
        />
      </instancedMesh>
      <mesh rotation={[Math.PI / 2, 0, 0.2]}>
        <torusKnotGeometry args={[0.28, 0.025, 64, 6, 2, 3]} />
        <meshBasicMaterial color={PALETTE.hopeSoft} transparent opacity={0.56} />
      </mesh>
      <mesh scale={0.13}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshBasicMaterial color={PALETTE.hopeSoft} toneMapped={false} />
      </mesh>
      <group ref={filaments}>
        <mesh rotation={[Math.PI / 2, 0.2, -0.2]}>
          <torusGeometry args={[0.92, 0.018, 5, 72, Math.PI * 1.24]} />
          <meshBasicMaterial color={PALETTE.hopeSoft} transparent opacity={0.46} />
        </mesh>
        <mesh rotation={[0.3, Math.PI / 2, 0.62]}>
          <torusGeometry args={[1.1, 0.011, 5, 72, Math.PI * 1.05]} />
          <meshBasicMaterial color={PALETTE.hope} transparent opacity={0.38} />
        </mesh>
      </group>
      <group ref={ascension} visible={false} position={[0, -0.72, -0.28]}>
        <mesh position={[-0.48, 0.42, 0]} rotation={[0, -0.7, -0.24]}>
          <torusGeometry args={[1.12, 0.022, 5, 64, Math.PI * 0.72]} />
          <meshBasicMaterial
            color="#e4c693"
            transparent
            opacity={0.54}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0.48, 0.42, 0]} rotation={[0, -0.7, Math.PI * 0.52]}>
          <torusGeometry args={[1.12, 0.022, 5, 64, Math.PI * 0.72]} />
          <meshBasicMaterial
            color="#d8ad6d"
            transparent
            opacity={0.48}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, 1.02, -0.3]} scale={[0.08, 0.46, 0.08]}>
          <octahedronGeometry args={[1, 0]} />
          <meshBasicMaterial
            color="#f0d4a3"
            transparent
            opacity={0.36}
            toneMapped={false}
          />
        </mesh>
      </group>
      <HopeMotes active={active} collected={collected} />
    </group>
  )
}
