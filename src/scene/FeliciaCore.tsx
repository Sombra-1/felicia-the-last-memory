import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  MathUtils,
  Mesh,
  Object3D,
} from 'three'
import { PALETTE } from './config/visual'
import { sequenceRuntime } from '../experience/sequenceRuntime'
import { deriveEndingConfiguration } from '../reconstruction/endingProfiles'
import { reconstructionRuntime } from '../reconstruction/reconstructionRuntime'
import { useExperienceStore } from '../state/experienceStore'

function CoreRibs() {
  const ribs = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!ribs.current) return
    const transform = new Object3D()

    for (let index = 0; index < 7; index += 1) {
      const t = index / 6
      transform.position.set(0, 0.45 - t * 1.62, 0)
      transform.rotation.set(Math.PI / 2, 0, Math.PI * 0.12 * (index % 2 ? 1 : -1))
      const scale = 0.5 + Math.sin(t * Math.PI) * 0.56
      transform.scale.set(scale, scale, 0.72)
      transform.updateMatrix()
      ribs.current.setMatrixAt(index, transform.matrix)
    }

    ribs.current.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <instancedMesh ref={ribs} args={[undefined, undefined, 7]}>
      <torusGeometry args={[0.9, 0.025, 5, 48, Math.PI * 1.28]} />
      <meshStandardMaterial
        color="#44414b"
        emissive="#26212e"
        emissiveIntensity={0.24}
        metalness={0.86}
        roughness={0.38}
      />
    </instancedMesh>
  )
}

function CoreFilaments() {
  const geometry = useMemo(() => {
    const points = [
      -0.34, 1.03, 0, -1.38, 3.4, -0.72, 0.32, 1.02, 0.05, 1.24, 3.75, -0.86, -0.12,
      -1.24, 0, -1.85, -3.2, -0.9, 0.18, -1.25, 0.03, 1.55, -3.5, -0.74, 0, 0.1, -0.36,
      0.35, 3.9, -1.2,
    ]
    const cableGeometry = new BufferGeometry()
    cableGeometry.setAttribute('position', new Float32BufferAttribute(points, 3))
    return cableGeometry
  }, [])

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#9a92a7" transparent opacity={0.28} />
    </lineSegments>
  )
}

function CoreShards() {
  const shards = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!shards.current) return
    const transform = new Object3D()

    for (let index = 0; index < 9; index += 1) {
      const angle = index * 2.31
      const radius = 0.92 + (index % 3) * 0.24
      transform.position.set(
        Math.sin(angle) * radius,
        -0.85 + (index % 6) * 0.34,
        Math.cos(angle) * radius * 0.55,
      )
      transform.rotation.set(index * 0.57, index * 0.34, index * 0.73)
      transform.scale.setScalar(0.1 + (index % 3) * 0.04)
      transform.updateMatrix()
      shards.current.setMatrixAt(index, transform.matrix)
    }

    shards.current.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <instancedMesh ref={shards} args={[undefined, undefined, 9]}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#77717f"
        metalness={0.82}
        roughness={0.34}
        transparent
        opacity={0.54}
      />
    </instancedMesh>
  )
}

export function FeliciaCore() {
  const core = useRef<Group>(null)
  const light = useRef<Mesh>(null)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const phase = useExperienceStore((state) => state.phase)
  const collectionOrder = useExperienceStore((state) => state.collectionOrder)
  const ending = useMemo(
    () => deriveEndingConfiguration(collectionOrder),
    [collectionOrder],
  )

  useFrame(({ clock }, delta) => {
    if (!core.current || !light.current) return
    const time = clock.elapsedTime
    const reveal = activeFragment ? sequenceRuntime.visualProgress : 0
    const fearContraction = activeFragment === 'fear' ? reveal * 0.12 : 0
    const hopeAwakening =
      activeFragment === 'hope'
        ? reveal * 0.055
        : phase === 'ready-for-reconstruction'
          ? 0.08
          : 0
    const collapse = reconstructionRuntime.collapse
    const voided = phase === 'reconstruction-void' || phase === 'reconstruction-recall'
    const rebuilt =
      phase === 'reconstruction-rebuilding'
        ? reconstructionRuntime.rebuild
        : phase === 'reconstruction-reveal' || phase === 'ending'
          ? 1
          : 0
    const profile = ending?.profile
    const baseScale = voided
      ? 0.12
      : rebuilt > 0
        ? MathUtils.lerp(0.12, 0.92 + (profile?.felicia.expansion ?? 0) * 0.18, rebuilt)
        : MathUtils.lerp(1, 0.12, collapse)
    const drift =
      reducedMotion || phase.startsWith('reconstruction-')
        ? 0
        : Math.sin(time * 0.38) * 0.055
    core.current.position.y = MathUtils.damp(
      core.current.position.y,
      drift + rebuilt * (profile?.felicia.expansion ?? 0) * 0.32,
      reducedMotion ? 20 : 1,
      delta,
    )
    core.current.rotation.y = MathUtils.damp(
      core.current.rotation.y,
      rebuilt > 0
        ? (1 - (profile?.felicia.coherence ?? 1)) * 0.28
        : activeFragment === 'identity' || reducedMotion
          ? 0
          : Math.sin(time * 0.17) * 0.06,
      reducedMotion ? 20 : 0.7,
      delta,
    )
    core.current.scale.x = MathUtils.damp(
      core.current.scale.x,
      baseScale *
        (1 - fearContraction * 0.5 + hopeAwakening) *
        (1 - (profile?.felicia.protection ?? 0) * rebuilt * 0.12),
      reducedMotion ? 20 : 2,
      delta,
    )
    core.current.scale.y = MathUtils.damp(
      core.current.scale.y,
      baseScale * (1 - fearContraction + hopeAwakening + rebuilt * 0.12),
      reducedMotion ? 20 : 2,
      delta,
    )
    const pulse =
      0.86 +
      (reducedMotion
        ? 0
        : Math.sin(time * (phase === 'ready-for-reconstruction' ? 2.1 : 1.15)) *
          (phase === 'ready-for-reconstruction' ? 0.14 : 0.07)) +
      hopeAwakening
    light.current.scale.setScalar(
      pulse * (voided ? 0.28 : 1 + rebuilt * (profile?.felicia.coherence ?? 0) * 0.55),
    )
  })

  return (
    <group ref={core} position={[0, 0.05, 0]}>
      <mesh position={[0, 0.76, 0]} scale={[0.72, 1.05, 0.68]}>
        <sphereGeometry args={[1, 32, 24]} />
        <meshPhysicalMaterial
          color="#28242d"
          emissive="#211c27"
          emissiveIntensity={0.18}
          metalness={0.72}
          roughness={0.46}
          transparent
          opacity={0.88}
          clearcoat={0.18}
        />
      </mesh>
      <mesh position={[0, 0.78, 0.03]} scale={[0.86, 1.2, 0.82]}>
        <sphereGeometry args={[1, 24, 18]} />
        <meshBasicMaterial
          color="#766d7f"
          transparent
          opacity={0.075}
          side={2}
          wireframe
        />
      </mesh>
      <mesh position={[0, -0.45, 0]} scale={[0.7, 1.15, 0.42]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color="#111116"
          emissive="#211a27"
          emissiveIntensity={0.14}
          metalness={0.78}
          roughness={0.54}
        />
      </mesh>
      <mesh position={[0, 0.18, -0.48]} scale={[0.9, 1.75, 1]}>
        <torusGeometry args={[0.9, 0.012, 5, 64]} />
        <meshBasicMaterial color="#8d8498" transparent opacity={0.16} />
      </mesh>
      <CoreRibs />
      <CoreFilaments />
      <CoreShards />
      <mesh ref={light} position={[0, 0.55, 0.58]}>
        <sphereGeometry args={[0.085, 12, 12]} />
        <meshBasicMaterial color={PALETTE.white} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.55, 0.5]} scale={4.2}>
        <sphereGeometry args={[0.085, 12, 12]} />
        <meshBasicMaterial
          color={PALETTE.violet}
          transparent
          opacity={0.075}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
