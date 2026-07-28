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
import { entranceRuntime } from '../experience/entranceRuntime'
import { reconstructionRuntime } from '../reconstruction/reconstructionRuntime'
import { useExperienceStore } from '../state/experienceStore'

const ringArcs = [
  { radius: 3.25, arc: Math.PI * 0.78, rotation: 0.58, opacity: 0.24 },
  { radius: 3.78, arc: Math.PI * 0.58, rotation: 2.18, opacity: 0.17 },
  { radius: 4.3, arc: Math.PI * 0.46, rotation: 4.22, opacity: 0.11 },
] as const

function StructuralRibs() {
  const ribs = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!ribs.current) return
    const transform = new Object3D()

    for (let index = 0; index < 14; index += 1) {
      const angle = ((index + 0.5) / 14) * Math.PI * 2
      const radius = 5.15
      transform.position.set(
        Math.sin(angle) * radius,
        0.15,
        -Math.abs(Math.cos(angle)) * radius - 0.8,
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
      <meshStandardMaterial
        color="#393741"
        emissive="#18161d"
        emissiveIntensity={0.24}
        roughness={0.66}
        metalness={0.78}
      />
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
  const phase = useExperienceStore((state) => state.phase)

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
    if (!debris.current) return
    debris.current.visible = phase !== 'ending'
    if (reducedMotion) return
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

function DepthSilhouettes() {
  const monuments = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!monuments.current) return
    const transform = new Object3D()
    const placements = [
      [-5.2, 0.1, 1.5, -0.18],
      [5.15, 0.1, 1.2, 0.2],
      [-4.55, 0.3, -2.4, -0.1],
      [4.7, 0.35, -2.8, 0.14],
      [-3.5, 1.4, -5.1, -0.06],
      [3.7, 1.2, -5.3, 0.08],
    ] as const

    placements.forEach(([x, y, z, rotation], index) => {
      transform.position.set(x, y, z)
      transform.rotation.set(0, rotation, index % 2 ? 0.035 : -0.035)
      transform.scale.set(index < 2 ? 1.25 : 0.85, 4.6 - index * 0.16, 0.8)
      transform.updateMatrix()
      monuments.current?.setMatrixAt(index, transform.matrix)
    })
    monuments.current.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <>
      <instancedMesh ref={monuments} args={[undefined, undefined, 6]}>
        <boxGeometry args={[0.6, 1.8, 0.65]} />
        <meshStandardMaterial
          color="#141319"
          emissive="#251f2b"
          emissiveIntensity={0.22}
          roughness={0.68}
          metalness={0.62}
        />
      </instancedMesh>
      <mesh position={[0, 0.8, -5.6]}>
        <circleGeometry args={[3.35, 72]} />
        <meshBasicMaterial color="#050508" />
      </mesh>
      <mesh position={[0, 0.8, -5.5]}>
        <ringGeometry args={[2.82, 2.87, 96]} />
        <meshBasicMaterial color="#665b72" transparent opacity={0.26} />
      </mesh>
      <mesh position={[0, -2.61, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.2, 64]} />
        <meshStandardMaterial
          color="#0b0a0f"
          emissive="#17121c"
          emissiveIntensity={0.16}
          metalness={0.82}
          roughness={0.26}
          transparent
          opacity={0.62}
        />
      </mesh>
    </>
  )
}

function ForegroundOcclusion() {
  return (
    <>
      <group position={[-5.05, -0.45, 3.2]} rotation={[0.08, -0.22, -0.08]}>
        <mesh scale={[0.72, 3.8, 0.82]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#09090d"
            emissive="#17131c"
            emissiveIntensity={0.18}
            metalness={0.72}
            roughness={0.62}
          />
        </mesh>
        <mesh position={[0.44, 0.7, -0.24]} scale={[0.08, 2.5, 0.3]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#4d4558" transparent opacity={0.18} />
        </mesh>
      </group>
      <group position={[5.25, -0.65, 2.75]} rotation={[-0.05, 0.28, 0.06]}>
        <mesh scale={[0.78, 3.5, 0.9]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#09090d"
            emissive="#17131c"
            emissiveIntensity={0.18}
            metalness={0.72}
            roughness={0.62}
          />
        </mesh>
        <mesh position={[-0.48, 0.42, -0.28]} scale={[0.08, 2.2, 0.3]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#4d4558" transparent opacity={0.16} />
        </mesh>
      </group>
    </>
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
    chamber.current.scale.setScalar(
      (isVoid ? 0.025 : targetScale) *
        MathUtils.lerp(0.84, 1, entranceRuntime.architecture),
    )
    chamber.current.rotation.y =
      collapse * (reducedMotion ? 0.08 : 0.5) +
      rebuilt * (ending?.profile.architecture.ringRotation ?? 0)
    chamber.current.position.y =
      -collapse * (reducedMotion ? 0.15 : 1.15) +
      rebuilt * (ending?.profile.architecture.verticalLift ?? 0) -
      (1 - entranceRuntime.architecture) * 0.28

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
      <ForegroundOcclusion />
      <DepthSilhouettes />
      <StructuralRibs />
      <group ref={rings} position={[0, 0.2, -1.2]}>
        {ringArcs.map((ring) => (
          <mesh key={ring.radius} rotation={[0, 0, ring.rotation]}>
            <torusGeometry args={[ring.radius, 0.035, 5, 96, ring.arc]} />
            <meshStandardMaterial
              color="#44414b"
              emissive={PALETTE.violetDark}
              emissiveIntensity={0.22}
              metalness={0.84}
              roughness={0.42}
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
