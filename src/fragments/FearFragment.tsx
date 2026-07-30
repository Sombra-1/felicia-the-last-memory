import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import { Group, InstancedMesh, MathUtils, Object3D } from 'three'
import { trialRuntime } from '../trials/trialRuntime'
import { PALETTE } from '../scene/config/visual'
import { useExperienceStore } from '../state/experienceStore'

const shardTransforms = [
  [-0.4, 0.28, 0.1, 0.36],
  [0.34, 0.42, -0.08, 0.31],
  [-0.16, -0.1, 0.3, 0.42],
  [0.42, -0.32, 0.05, 0.3],
  [-0.42, -0.4, -0.14, 0.27],
  [0.02, 0.58, 0.12, 0.24],
  [0.12, -0.62, -0.04, 0.22],
] as const

const plateAngles = [-2.45, -1.52, -0.62, 0.38, 1.34, 2.28] as const

interface FearFragmentProps {
  hovered: boolean
  active: boolean
  collected: boolean
}

export function FearFragment({ hovered, active, collected }: FearFragmentProps) {
  const group = useRef<Group>(null)
  const shards = useRef<InstancedMesh>(null)
  const plates = useRef<InstancedMesh>(null)
  const cage = useRef<Group>(null)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)

  useLayoutEffect(() => {
    if (!shards.current || !plates.current) return
    const transform = new Object3D()

    shardTransforms.forEach(([x, y, z, scale], index) => {
      transform.position.set(x, y, z)
      transform.rotation.set(index * 0.7, index * 0.93, index * 0.41)
      transform.scale.set(scale * 0.68, scale * 1.5, scale * 0.72)
      transform.updateMatrix()
      shards.current?.setMatrixAt(index, transform.matrix)
    })
    shards.current.instanceMatrix.needsUpdate = true

    plateAngles.forEach((angle, index) => {
      transform.position.set(Math.cos(angle) * 1.18, Math.sin(angle) * 0.9, -0.18)
      transform.rotation.set(0.12 * (index % 2 ? 1 : -1), 0, angle - Math.PI / 2)
      transform.scale.set(0.28, 0.62, 0.12)
      transform.updateMatrix()
      plates.current?.setMatrixAt(index, transform.matrix)
    })
    plates.current.instanceMatrix.needsUpdate = true
  }, [])

  useFrame(({ clock }, delta) => {
    if (!group.current || !shards.current || !plates.current || !cage.current) return
    const time = clock.elapsedTime
    const reveal = active
      ? Math.max(trialRuntime.anticipation, trialRuntime.departure)
      : 0
    plates.current.visible = active && reveal > 0.04
    const instability =
      reducedMotion || collected
        ? 0
        : active
          ? 0.018 + reveal * 0.03
          : hovered
            ? 0.035
            : 0.012
    group.current.rotation.y = MathUtils.damp(
      group.current.rotation.y,
      active ? -0.3 - reveal * 0.24 : reducedMotion || collected ? 0.1 : time * -0.08,
      1,
      delta,
    )
    group.current.position.x = Math.sin(time * 2.7) * instability
    group.current.position.y = Math.sin(time * 3.9) * instability * 0.6
    cage.current.rotation.y =
      (reducedMotion ? 0.2 : -time * 0.11) - reveal * Math.PI * 0.32
    cage.current.rotation.z = reveal * 0.18
    cage.current.scale.setScalar(0.92 + reveal * 0.28)

    const transform = new Object3D()
    shardTransforms.forEach(([x, y, z, scale], index) => {
      const separation = MathUtils.lerp(
        1.22 + (index % 3) * 0.08,
        0.9 + (index % 2) * 0.08,
        reveal,
      )
      transform.position.set(x * separation, y * separation, z * separation)
      transform.rotation.set(
        index * 0.7 + reveal * (index % 2 ? 0.8 : -0.55),
        index * 0.93 + reveal * 0.4,
        index * 0.41 - reveal * 0.28,
      )
      transform.scale.set(scale * 0.68, scale * 1.5, scale * 0.72)
      transform.updateMatrix()
      shards.current?.setMatrixAt(index, transform.matrix)
    })
    shards.current.instanceMatrix.needsUpdate = true

    plateAngles.forEach((angle, index) => {
      const seal = MathUtils.smootherstep(reveal, 0.18 + index * 0.035, 0.9)
      const radius = MathUtils.lerp(1.48 + (index % 2) * 0.12, 0.82, seal)
      transform.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * 0.76,
        -0.22 + (index % 2) * 0.08,
      )
      transform.rotation.set(
        0.12 * (index % 2 ? 1 : -1),
        MathUtils.lerp(index % 2 ? -0.7 : 0.7, 0, seal),
        angle - Math.PI / 2 + (1 - seal) * (index % 2 ? 0.6 : -0.6),
      )
      transform.scale.set(0.2, 0.48, 0.1)
      transform.updateMatrix()
      plates.current?.setMatrixAt(index, transform.matrix)
    })
    plates.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group ref={group}>
      <instancedMesh ref={shards} args={[undefined, undefined, shardTransforms.length]}>
        <tetrahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color={PALETTE.violet}
          emissive={PALETTE.violetDark}
          emissiveIntensity={hovered ? 0.9 : 0.52}
          metalness={0.72}
          roughness={0.36}
        />
      </instancedMesh>
      <instancedMesh ref={plates} args={[undefined, undefined, plateAngles.length]}>
        <cylinderGeometry args={[0.58, 0.72, 1.25, 5, 1, false]} />
        <meshStandardMaterial
          color="#4f4058"
          emissive="#6f4f7e"
          emissiveIntensity={0.64}
          metalness={0.84}
          roughness={0.42}
        />
      </instancedMesh>
      <mesh scale={0.22}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#a894b7" toneMapped={false} />
      </mesh>
      <mesh scale={0.48}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial color="#100b15" transparent opacity={0.72} wireframe />
      </mesh>
      <group ref={cage}>
        <mesh rotation={[Math.PI / 2, 0, 0.2]}>
          <torusGeometry args={[0.92, 0.028, 5, 48, Math.PI * 1.22]} />
          <meshStandardMaterial
            color="#5e496d"
            emissive={PALETTE.violet}
            emissiveIntensity={0.58}
            metalness={0.72}
            roughness={0.34}
          />
        </mesh>
        <mesh rotation={[0.25, Math.PI / 2, -0.55]}>
          <torusGeometry args={[1.08, 0.018, 5, 48, Math.PI * 1.08]} />
          <meshBasicMaterial color="#9f82b4" transparent opacity={0.42} />
        </mesh>
      </group>
    </group>
  )
}
