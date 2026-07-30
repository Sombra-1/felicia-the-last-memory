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
import { entranceRuntime } from '../experience/entranceRuntime'
import { ArchitecturalMaterial, MemoryFieldMaterial } from '../materials/MemoryMaterials'
import { deriveEndingConfiguration } from '../reconstruction/endingProfiles'
import { reconstructionRuntime } from '../reconstruction/reconstructionRuntime'
import { PALETTE, VISUAL_CALIBRATION } from '../scene/config/visual'
import { useExperienceStore } from '../state/experienceStore'
import { trialRuntime } from '../trials/trialRuntime'

function CathedralLayers() {
  const pillars = useRef<InstancedMesh>(null)
  const ledges = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!pillars.current || !ledges.current) return
    const transform = new Object3D()
    let instance = 0
    for (let depth = 0; depth < 6; depth += 1) {
      for (const side of [-1, 1]) {
        const z = 0.85 - depth * 1.34
        const spread = 4.8 - depth * 0.12
        transform.position.set(side * spread, 0.12 + depth * 0.1, z)
        transform.rotation.set(0, side * (-0.08 - depth * 0.012), side * 0.012)
        transform.scale.set(0.42 - depth * 0.025, 4.25 + depth * 0.12, 0.72)
        transform.updateMatrix()
        pillars.current.setMatrixAt(instance, transform.matrix)

        transform.position.set(side * (spread - 0.82), 2.95 + depth * 0.12, z - 0.18)
        transform.rotation.set(0, side * -0.04, side * -0.16)
        transform.scale.set(1.5, 0.12, 0.42)
        transform.updateMatrix()
        ledges.current.setMatrixAt(instance, transform.matrix)
        instance += 1
      }
    }
    pillars.current.instanceMatrix.needsUpdate = true
    ledges.current.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <>
      <instancedMesh ref={pillars} args={[undefined, undefined, 12]}>
        <boxGeometry />
        <ArchitecturalMaterial
          body="#111117"
          edge="#5f5966"
          opacity={0.98}
          variation={0.12}
        />
      </instancedMesh>
      <instancedMesh ref={ledges} args={[undefined, undefined, 12]}>
        <boxGeometry />
        <ArchitecturalMaterial
          body="#17161d"
          edge="#77717e"
          opacity={0.9}
          variation={0.08}
        />
      </instancedMesh>
    </>
  )
}

function GroundingPlane() {
  const fractures = useMemo(() => {
    const points: number[] = []
    for (let ray = 0; ray < 18; ray += 1) {
      const angle = (ray / 18) * Math.PI * 2 + Math.sin(ray * 8.17) * 0.08
      const start = 0.72 + (ray % 3) * 0.1
      const end = 5.3 - (ray % 4) * 0.28
      points.push(
        Math.cos(angle) * start,
        0,
        Math.sin(angle) * start,
        Math.cos(angle) * end,
        0,
        Math.sin(angle) * end,
      )
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(points, 3))
    return geometry
  }, [])

  return (
    <group position={[0, -2.62, -0.2]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[5.45, 72]} />
        <ArchitecturalMaterial
          body={PALETTE.graphite}
          edge="#585360"
          opacity={0.94}
          variation={0.06}
        />
      </mesh>
      <mesh
        position={[0, -0.03, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[0.9, 0.9, 1]}
      >
        <circleGeometry args={[2.25, 64]} />
        <meshBasicMaterial color="#050507" transparent opacity={0.55} />
      </mesh>
      <lineSegments geometry={fractures} position={[0, 0.014, 0]}>
        <lineBasicMaterial
          color="#777181"
          transparent
          opacity={VISUAL_CALIBRATION.criticalLineOpacity * 0.65}
        />
      </lineSegments>
    </group>
  )
}

function CentralAxis() {
  return (
    <group position={[0, 0.4, -4.7]}>
      <mesh scale={[0.035, 3.7, 0.06]}>
        <boxGeometry />
        <meshBasicMaterial
          color="#b9b3c2"
          transparent
          opacity={0.22}
          toneMapped={false}
        />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 2.35, 0, 0.1]}
          rotation={[0, side * 0.08, 0]}
          scale={[0.012, 3.2, 0.8]}
        >
          <planeGeometry />
          <MemoryFieldMaterial
            color="#17131c"
            accent="#9a8da4"
            opacity={0.11}
            distortion={0.018}
            progress={() =>
              Math.max(
                entranceRuntime.architecture,
                trialRuntime.syncVisual,
                reconstructionRuntime.rebuild,
              )
            }
          />
        </mesh>
      ))}
    </group>
  )
}

function EdgeSilhouettes() {
  return (
    <>
      <mesh
        position={[-5.7, -0.55, 2.7]}
        rotation={[0.04, -0.16, -0.04]}
        scale={[0.58, 3.65, 0.74]}
      >
        <boxGeometry />
        <ArchitecturalMaterial body="#07070a" edge="#211c27" opacity={1} />
      </mesh>
      <mesh
        position={[5.7, -0.65, 2.5]}
        rotation={[-0.03, 0.18, 0.035]}
        scale={[0.62, 3.5, 0.78]}
      >
        <boxGeometry />
        <ArchitecturalMaterial body="#07070a" edge="#211c27" opacity={1} />
      </mesh>
    </>
  )
}

export function ChamberArchitecture() {
  const chamber = useRef<Group>(null)
  const layers = useRef<Group>(null)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const phase = useExperienceStore((state) => state.phase)
  const order = useExperienceStore((state) => state.collectionOrder)
  const ending = useMemo(() => deriveEndingConfiguration(order), [order])

  useFrame(({ clock }) => {
    if (!chamber.current || !layers.current) return
    const collapse = reconstructionRuntime.collapse
    const rebuilt =
      phase === 'reconstruction-rebuilding'
        ? reconstructionRuntime.rebuild
        : phase === 'reconstruction-reveal' || phase === 'ending'
          ? 1
          : 0
    const isVoid = phase === 'reconstruction-void' || phase === 'reconstruction-recall'
    const collapseExit = MathUtils.smootherstep(collapse, 0.44, 1)
    const shock = Math.sin(MathUtils.smootherstep(collapse, 0.06, 0.7) * Math.PI)
    // Architecture waits for FELICIA's body to reform before answering it.
    const response = MathUtils.smootherstep(rebuilt, 0.58, 0.98)
    const trialContinuity = MathUtils.lerp(1, 0.016, trialRuntime.chamberSuppression)
    const targetScale =
      rebuilt > 0 ? MathUtils.lerp(0.025, 1, response) : 1 - collapseExit
    chamber.current.scale.setScalar(
      (isVoid ? 0.025 : Math.max(0.025, targetScale)) *
        MathUtils.lerp(0.82, 1, entranceRuntime.architecture) *
        trialContinuity,
    )
    chamber.current.position.y =
      -collapseExit * (reducedMotion ? 0.1 : 1.7) +
      response * (ending?.profile.architecture.verticalLift ?? 0)
    chamber.current.rotation.y =
      collapse * (reducedMotion ? 0.04 : 0.34) +
      response * (ending?.profile.id === 'fear' ? 0.08 : 0)
    chamber.current.rotation.z =
      response *
      (ending?.profile.id === 'fear' ? -0.055 : ending?.profile.id === 'hope' ? 0.025 : 0)

    const syncAlignment = MathUtils.smootherstep(trialRuntime.syncVisual, 0.08, 0.9)
    const profile = ending?.profile.id
    const opening =
      profile === 'hope' ? response * 0.28 : profile === 'fear' ? response * -0.1 : 0
    layers.current.scale.set(
      1 + opening + syncAlignment * 0.035,
      1 + (profile === 'hope' ? response * 0.08 : 0),
      1,
    )
    layers.current.position.x = profile === 'fear' ? response * -0.24 : 0
    layers.current.rotation.y =
      (reducedMotion ? 0 : Math.sin(clock.elapsedTime * 0.11) * 0.008) + shock * 0.04
  })

  return (
    <group ref={chamber} name="optical-cathedral">
      <EdgeSilhouettes />
      <group ref={layers}>
        <CathedralLayers />
      </group>
      <CentralAxis />
      <GroundingPlane />
    </group>
  )
}
