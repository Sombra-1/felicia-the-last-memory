import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import { Group, InstancedMesh, MathUtils, Object3D } from 'three'
import { sequenceRuntime } from '../experience/sequenceRuntime'
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

interface FearFragmentProps {
  hovered: boolean
  active: boolean
  collected: boolean
}

export function FearFragment({ hovered, active, collected }: FearFragmentProps) {
  const group = useRef<Group>(null)
  const shards = useRef<InstancedMesh>(null)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)

  useLayoutEffect(() => {
    if (!shards.current) return
    const transform = new Object3D()

    shardTransforms.forEach(([x, y, z, scale], index) => {
      transform.position.set(x, y, z)
      transform.rotation.set(index * 0.7, index * 0.93, index * 0.41)
      transform.scale.set(scale * 0.68, scale * 1.5, scale * 0.72)
      transform.updateMatrix()
      shards.current?.setMatrixAt(index, transform.matrix)
    })
    shards.current.instanceMatrix.needsUpdate = true
  }, [])

  useFrame(({ clock }, delta) => {
    if (!group.current || !shards.current) return
    const time = clock.elapsedTime
    const reveal = active ? sequenceRuntime.visualProgress : 0
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

    const transform = new Object3D()
    shardTransforms.forEach(([x, y, z, scale], index) => {
      const separation = 1 + reveal * (0.72 + (index % 3) * 0.16)
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
      <mesh scale={0.22}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#a894b7" toneMapped={false} />
      </mesh>
    </group>
  )
}
