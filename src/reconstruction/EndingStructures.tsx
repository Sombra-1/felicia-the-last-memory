import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  CatmullRomCurve3,
  Group,
  InstancedMesh,
  MathUtils,
  Object3D,
  Vector3,
} from 'three'
import {
  ArchitecturalMaterial,
  EnergyFilamentMaterial,
  MemoryFieldMaterial,
} from '../materials/MemoryMaterials'
import { useExperienceStore } from '../state/experienceStore'
import { deriveEndingConfiguration } from './endingProfiles'
import { reconstructionRuntime } from './reconstructionRuntime'

function IdentityCathedral() {
  const blades = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!blades.current) return
    const transform = new Object3D()
    let instance = 0
    for (let depth = 0; depth < 4; depth += 1) {
      for (const side of [-1, 1]) {
        transform.position.set(side * (2.45 + depth * 0.6), 0.35, -1.3 - depth * 0.55)
        transform.rotation.set(0, side * -0.06, 0)
        transform.scale.set(0.12, 3.2 + depth * 0.34, 0.42)
        transform.updateMatrix()
        blades.current.setMatrixAt(instance, transform.matrix)
        instance += 1
      }
    }
    blades.current.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <>
      <instancedMesh ref={blades} args={[undefined, undefined, 8]}>
        <boxGeometry />
        <ArchitecturalMaterial
          body="#11151a"
          edge="#a9b3ba"
          opacity={0.94}
          variation={0.06}
        />
      </instancedMesh>
      <mesh position={[0, 0.34, -1.6]} scale={[0.028, 3.35, 0.04]}>
        <boxGeometry />
        <meshBasicMaterial
          color="#e9eef1"
          transparent
          opacity={0.52}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.34, -4.4]} scale={[4.5, 3.9, 1]}>
        <planeGeometry />
        <MemoryFieldMaterial
          color="#0b0e11"
          accent="#b9c2c7"
          opacity={0.1}
          distortion={0.01}
          progress={() => 1}
        />
      </mesh>
    </>
  )
}

function FearCathedral({ detailColor }: { detailColor: string }) {
  const shutters = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!shutters.current) return
    const transform = new Object3D()
    const placements = [
      [-3.3, 0.9, -1.2, -0.22, 0.22, 3.3],
      [-3.75, -1.0, -1.6, 0.18, 0.18, 2.4],
      [-2.85, 2.55, -2.0, -0.32, 0.2, 2.1],
      [3.5, 0.45, -1.55, 0.18, 0.24, 3.1],
      [4.0, -1.4, -2.1, -0.15, 0.2, 2.2],
      [3.05, 2.45, -2.5, 0.28, 0.18, 2.3],
    ] as const
    placements.forEach(([x, y, z, rotation, width, height], index) => {
      transform.position.set(x, y, z)
      transform.rotation.set(0, index < 3 ? 0.08 : -0.08, rotation)
      transform.scale.set(width, height, 0.58)
      transform.updateMatrix()
      shutters.current?.setMatrixAt(index, transform.matrix)
    })
    shutters.current.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <>
      <instancedMesh ref={shutters} args={[undefined, undefined, 6]}>
        <boxGeometry />
        <ArchitecturalMaterial
          body="#161119"
          edge={detailColor}
          opacity={0.96}
          variation={0.12}
        />
      </instancedMesh>
      <mesh position={[-0.35, 0.2, -4.2]} scale={[4.4, 3.7, 1]}>
        <planeGeometry />
        <MemoryFieldMaterial
          color="#0e0912"
          accent="#765484"
          opacity={0.12}
          distortion={0.045}
          progress={() => 1}
        />
      </mesh>
    </>
  )
}

function HopeCathedral({ detailColor }: { detailColor: string }) {
  const towers = useRef<InstancedMesh>(null)
  const curves = useMemo(
    () =>
      [-1, 1].flatMap((side) => [
        new CatmullRomCurve3([
          new Vector3(side * 1.1, -2.5, -1.15),
          new Vector3(side * 1.45, -0.5, -1.25),
          new Vector3(side * 2.1, 1.8, -1.55),
          new Vector3(side * 3.2, 4.7, -2.1),
        ]),
        new CatmullRomCurve3([
          new Vector3(side * 0.65, -2.1, -0.95),
          new Vector3(side * 0.9, 0.3, -1.15),
          new Vector3(side * 1.5, 2.7, -1.65),
          new Vector3(side * 2.0, 5.2, -2.3),
        ]),
      ]),
    [],
  )

  useLayoutEffect(() => {
    if (!towers.current) return
    const transform = new Object3D()
    let instance = 0
    for (let tier = 0; tier < 3; tier += 1) {
      for (const side of [-1, 1]) {
        transform.position.set(
          side * (3.2 + tier * 0.72),
          0.55 + tier * 0.4,
          -1.4 - tier * 0.65,
        )
        transform.rotation.set(0, side * -0.06, side * (0.08 + tier * 0.025))
        transform.scale.set(0.13, 3.4 + tier * 0.62, 0.46)
        transform.updateMatrix()
        towers.current.setMatrixAt(instance, transform.matrix)
        instance += 1
      }
    }
    towers.current.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <>
      <instancedMesh ref={towers} args={[undefined, undefined, 6]}>
        <boxGeometry />
        <ArchitecturalMaterial
          body="#15130e"
          edge="#816743"
          opacity={0.9}
          variation={0.1}
        />
      </instancedMesh>
      {curves.map((curve, index) => (
        <mesh key={index}>
          <tubeGeometry args={[curve, 48, index % 2 ? 0.02 : 0.032, 6, false]} />
          <EnergyFilamentMaterial
            color="#8d6532"
            hot={detailColor}
            opacity={0.58}
            rhythm={1.08 + index * 0.12}
            energy={() => 1}
          />
        </mesh>
      ))}
      <mesh position={[0, 1.15, -4.5]} scale={[5, 4.6, 1]}>
        <planeGeometry />
        <MemoryFieldMaterial
          color="#100d08"
          accent="#b88d4e"
          opacity={0.1}
          distortion={0.055}
          progress={() => 1}
        />
      </mesh>
    </>
  )
}

export function EndingStructures() {
  const group = useRef<Group>(null)
  const phase = useExperienceStore((state) => state.phase)
  const order = useExperienceStore((state) => state.collectionOrder)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const ending = useMemo(() => deriveEndingConfiguration(order), [order])

  useFrame(({ clock }) => {
    if (!group.current || !ending) return
    const progress =
      phase === 'reconstruction-rebuilding'
        ? reconstructionRuntime.rebuild
        : phase === 'reconstruction-reveal' || phase === 'ending'
          ? 1
          : 0
    const formation = MathUtils.smootherstep(progress, 0.72, 0.99)
    group.current.visible = formation > 0.01
    const scale = MathUtils.smootherstep(formation, 0, 1)
    group.current.scale.setScalar(scale)
    group.current.position.y =
      MathUtils.lerp(-2.7, ending.profile.architecture.verticalLift, formation) +
      (!reducedMotion && phase === 'ending' && ending.motionDirection === 'ascending'
        ? Math.sin(clock.elapsedTime * 0.2) * 0.04
        : 0)
    group.current.rotation.z =
      ending.motionDirection === 'guarded'
        ? -0.045 * formation
        : ending.motionDirection === 'ascending'
          ? 0.018 * formation
          : 0
  })

  if (!ending) return null
  return (
    <group ref={group} visible={false} name={`${ending.profile.id}-ending-cathedral`}>
      {ending.profile.id === 'identity' && <IdentityCathedral />}
      {ending.profile.id === 'fear' && <FearCathedral detailColor={ending.detailColor} />}
      {ending.profile.id === 'hope' && <HopeCathedral detailColor={ending.detailColor} />}
    </group>
  )
}
