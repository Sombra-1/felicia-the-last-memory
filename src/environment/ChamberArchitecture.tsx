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
import { PALETTE, VISUAL_CALIBRATION } from '../scene/config/visual'
import { deriveEndingConfiguration } from '../reconstruction/endingProfiles'
import { reconstructionRuntime } from '../reconstruction/reconstructionRuntime'
import { useExperienceStore } from '../state/experienceStore'

const ringArcs = [
  { radius: 3.2, arc: Math.PI * 1.34, rotation: 0.48, opacity: 0.28 },
  { radius: 3.65, arc: Math.PI * 0.82, rotation: -0.72, opacity: 0.2 },
  { radius: 4.12, arc: Math.PI * 1.12, rotation: 1.45, opacity: 0.13 },
  { radius: 4.62, arc: Math.PI * 0.62, rotation: 2.6, opacity: 0.09 },
] as const

function StructuralRibs() {
  const ribs = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!ribs.current) return
    const transform = new Object3D()

    for (let index = 0; index < 14; index += 1) {
      const angle = (index / 14) * Math.PI * 2
      const radius = 5.15
      transform.position.set(
        Math.sin(angle) * radius,
        0.15,
        Math.cos(angle) * radius - 0.8,
      )
      transform.rotation.set(0, angle, Math.sin(angle * 2) * 0.025)
      transform.scale.set(1, 1 + (index % 3) * 0.08, 1)
      transform.updateMatrix()
      ribs.current.setMatrixAt(index, transform.matrix)
    }

    ribs.current.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <instancedMesh ref={ribs} args={[undefined, undefined, 14]}>
      <boxGeometry args={[0.08, 7.4, 0.18]} />
      <meshStandardMaterial color={PALETTE.metal} roughness={0.78} metalness={0.7} />
    </instancedMesh>
  )
}

function FracturedFloor() {
  const geometry = useMemo(() => {
    const points: number[] = []

    for (let ray = 0; ray < 18; ray += 1) {
      const angle = (ray / 18) * Math.PI * 2 + Math.sin(ray * 8.17) * 0.09
      const start = 0.82 + (ray % 3) * 0.12
      const end = 5.1 - (ray % 4) * 0.28
      points.push(
        Math.cos(angle) * start,
        0,
        Math.sin(angle) * start,
        Math.cos(angle) * end,
        0,
        Math.sin(angle) * end,
      )
    }

    const floorGeometry = new BufferGeometry()
    floorGeometry.setAttribute('position', new Float32BufferAttribute(points, 3))
    return floorGeometry
  }, [])

  return (
    <group position={[0, -2.65, 0]} rotation={[0, 0.1, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.72, 5.35, 64, 1]} />
        <meshStandardMaterial
          color={PALETTE.graphite}
          emissive="#13111a"
          emissiveIntensity={0.2}
          metalness={0.62}
          roughness={0.82}
        />
      </mesh>
      <lineSegments geometry={geometry} position={[0, 0.012, 0]}>
        <lineBasicMaterial
          color="#7d7689"
          transparent
          opacity={VISUAL_CALIBRATION.criticalLineOpacity}
        />
      </lineSegments>
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.8, 2.83, 64]} />
        <meshBasicMaterial color="#a8a1b4" transparent opacity={0.16} />
      </mesh>
    </group>
  )
}

function FloatingDebris() {
  const debris = useRef<InstancedMesh>(null)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)

  const transforms = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => {
        const angle = index * 2.399
        const radius = 3.1 + (index % 5) * 0.36
        return {
          position: [
            Math.cos(angle) * radius,
            -1.9 + (index % 7) * 0.66,
            Math.sin(angle) * radius - 0.7,
          ] as const,
          rotation: [index * 0.37, index * 0.19, index * 0.53] as const,
          scale: 0.08 + (index % 4) * 0.035,
        }
      }),
    [],
  )

  useLayoutEffect(() => {
    if (!debris.current) return
    const transform = new Object3D()

    transforms.forEach(({ position, rotation, scale }, index) => {
      transform.position.set(...position)
      transform.rotation.set(...rotation)
      transform.scale.set(scale, scale * 1.8, scale * 0.45)
      transform.updateMatrix()
      debris.current?.setMatrixAt(index, transform.matrix)
    })
    debris.current.instanceMatrix.needsUpdate = true
  }, [transforms])

  useFrame(({ clock }) => {
    if (!debris.current || reducedMotion) return
    debris.current.rotation.y = Math.sin(clock.elapsedTime * 0.08) * 0.035
    debris.current.position.y = Math.sin(clock.elapsedTime * 0.18) * 0.035
  })

  return (
    <instancedMesh ref={debris} args={[undefined, undefined, transforms.length]}>
      <tetrahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#34323a" metalness={0.72} roughness={0.58} />
    </instancedMesh>
  )
}

export function ChamberArchitecture() {
  const chamber = useRef<Group>(null)
  const rings = useRef<Group>(null)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const phase = useExperienceStore((state) => state.phase)
  const collectionOrder = useExperienceStore((state) => state.collectionOrder)
  const ending = useMemo(
    () => deriveEndingConfiguration(collectionOrder),
    [collectionOrder],
  )

  useFrame(({ clock }, delta) => {
    if (!rings.current || !chamber.current) return
    const collapse = reconstructionRuntime.collapse
    const rebuilt =
      phase === 'reconstruction-rebuilding'
        ? reconstructionRuntime.rebuild
        : phase === 'reconstruction-reveal' || phase === 'ending'
          ? 1
          : 0
    const isVoid = phase === 'reconstruction-void' || phase === 'reconstruction-recall'
    const collapseScale = MathUtils.lerp(1, 0.025, collapse)
    const targetScale = rebuilt > 0 ? MathUtils.lerp(0.025, 1, rebuilt) : collapseScale
    chamber.current.scale.setScalar(isVoid ? 0.025 : targetScale)
    chamber.current.rotation.y =
      collapse * (reducedMotion ? 0.08 : 0.5) +
      rebuilt * (ending?.profile.architecture.ringRotation ?? 0)
    chamber.current.position.y =
      -collapse * (reducedMotion ? 0.15 : 1.15) +
      rebuilt * (ending?.profile.architecture.verticalLift ?? 0)

    const idle =
      reducedMotion || phase.startsWith('reconstruction-')
        ? 0
        : Math.sin(clock.elapsedTime * 0.12) * 0.018
    const profileRotation = rebuilt * (ending?.profile.architecture.ringRotation ?? 0)
    rings.current.rotation.z = MathUtils.damp(
      rings.current.rotation.z,
      idle + profileRotation,
      reducedMotion ? 12 : 0.9,
      delta,
    )
  })

  return (
    <group ref={chamber}>
      <StructuralRibs />
      <group ref={rings} position={[0, 0.2, -1.2]}>
        {ringArcs.map((ring) => (
          <mesh key={ring.radius} rotation={[0, 0, ring.rotation]}>
            <torusGeometry args={[ring.radius, 0.035, 5, 96, ring.arc]} />
            <meshStandardMaterial
              color={PALETTE.metal}
              emissive={PALETTE.violetDark}
              emissiveIntensity={0.12}
              metalness={0.8}
              roughness={0.48}
              transparent
              opacity={ring.opacity}
            />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 2.35, -2.7]}>
        <torusGeometry args={[2.15, 0.14, 8, 72, Math.PI * 1.5]} />
        <meshStandardMaterial color="#24222a" metalness={0.75} roughness={0.56} />
      </mesh>
      <FracturedFloor />
      <FloatingDebris />
    </group>
  )
}
