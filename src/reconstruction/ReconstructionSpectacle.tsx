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
  MemoryShellMaterial,
} from '../materials/MemoryMaterials'
import type { FragmentId } from '../state/experienceStore'
import { useExperienceStore } from '../state/experienceStore'
import { trialRuntime } from '../trials/trialRuntime'
import { deriveEndingConfiguration } from './endingProfiles'
import { reconstructionRuntime } from './reconstructionRuntime'

const STREAM_COLORS: Record<FragmentId, { body: string; hot: string }> = {
  identity: { body: '#9ca8af', hot: '#f0f5f7' },
  fear: { body: '#704b82', hot: '#bd88ce' },
  hope: { body: '#a7783a', hot: '#f2c675' },
}

const STREAM_CURVES: Record<FragmentId, CatmullRomCurve3> = {
  identity: new CatmullRomCurve3([
    new Vector3(-3.55, 1.6, -1.25),
    new Vector3(-2.35, 2.2, -0.82),
    new Vector3(-1.18, 0.64, -0.22),
    new Vector3(0, 0.62, 0.26),
  ]),
  fear: new CatmullRomCurve3([
    new Vector3(3.4, 0.8, -1.3),
    new Vector3(2.5, -0.4, -0.7),
    new Vector3(1.22, -0.55, -0.16),
    new Vector3(0, 0.62, 0.26),
  ]),
  hope: new CatmullRomCurve3([
    new Vector3(0.32, 4.05, -1.5),
    new Vector3(-0.78, 3.1, -0.82),
    new Vector3(0.62, 1.8, -0.16),
    new Vector3(0, 0.62, 0.26),
  ]),
}

function DetachedAnatomy() {
  const fragments = useRef<InstancedMesh>(null)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const phase = useExperienceStore((state) => state.phase)

  useFrame(({ clock }) => {
    if (!fragments.current) return
    const progress = reconstructionRuntime.collapse
    fragments.current.visible =
      phase === 'reconstruction-collapse' && progress > 0.02 && progress < 0.99
    if (!fragments.current.visible) return
    const transform = new Object3D()
    for (let index = 0; index < 14; index += 1) {
      const side = index % 2 ? 1 : -1
      const tier = Math.floor(index / 2)
      const anatomyOrigin = new Vector3(
        side * (0.28 + tier * 0.06),
        1.55 - tier * 0.44,
        -0.02 - tier * 0.03,
      )
      const direction = new Vector3(
        side * (2.2 + tier * 0.22),
        (tier - 3) * 0.34,
        -0.8 - (tier % 3) * 0.28,
      )
      const detach = MathUtils.smootherstep(progress, 0.02 + tier * 0.025, 0.82)
      transform.position.copy(anatomyOrigin).lerp(direction, detach)
      transform.rotation.set(
        detach * side * 0.5,
        detach * (tier * 0.32 + clock.elapsedTime * (reducedMotion ? 0.01 : 0.08)),
        side * detach * 0.7,
      )
      transform.scale.set(
        0.08 + (tier % 3) * 0.02,
        MathUtils.lerp(0.34, 0.16, detach),
        0.08,
      )
      transform.updateMatrix()
      fragments.current.setMatrixAt(index, transform.matrix)
    }
    fragments.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={fragments} args={[undefined, undefined, 14]} visible={false}>
      <capsuleGeometry args={[1, 0.52, 5, 9]} />
      <ArchitecturalMaterial
        body="#403946"
        edge="#a28fac"
        opacity={0.92}
        variation={0.08}
      />
    </instancedMesh>
  )
}

function ExposedSignal() {
  const signal = useRef<Group>(null)
  const phase = useExperienceStore((state) => state.phase)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)

  useFrame(({ clock }) => {
    if (!signal.current) return
    const visible = phase === 'reconstruction-void' || phase === 'reconstruction-recall'
    signal.current.visible = visible
    if (!visible) return
    const recallLift =
      phase === 'reconstruction-recall'
        ? reconstructionRuntime.recallIndex * 0.12 + reconstructionRuntime.recall * 0.14
        : 0
    signal.current.position.y = 0.54 + recallLift
    signal.current.rotation.y = reducedMotion ? 0 : clock.elapsedTime * 0.11
    signal.current.scale.set(
      0.9,
      1 +
        recallLift * 0.12 +
        (reducedMotion ? 0 : Math.sin(clock.elapsedTime * 1.8) * 0.06),
      0.9,
    )
  })

  return (
    <group ref={signal} visible={false} position={[0, 0.54, -0.14]}>
      <mesh scale={[0.2, 0.94, 0.18]}>
        <octahedronGeometry args={[1, 1]} />
        <MemoryShellMaterial
          body="#5e5266"
          depth="#0a080d"
          accent="#eee7f2"
          opacity={0.82}
          distortion={0.035}
          energy={() => reconstructionRuntime.recall}
        />
      </mesh>
      <mesh scale={[0.045, 1.28, 0.045]}>
        <capsuleGeometry args={[1, 0.4, 5, 10]} />
        <EnergyFilamentMaterial
          color="#94859d"
          hot="#ffffff"
          opacity={0.94}
          rhythm={1.3}
          energy={() => reconstructionRuntime.recall}
        />
      </mesh>
    </group>
  )
}

function MemoryStream({
  fragment,
  orderIndex,
}: {
  fragment: FragmentId
  orderIndex: number
}) {
  const stream = useRef<Group>(null)
  const phase = useExperienceStore((state) => state.phase)
  const quality = useExperienceStore((state) => state.quality)

  useFrame(({ clock }) => {
    if (!stream.current) return
    const synchronizing = phase === 'reconstruction-synchronizing'
    const passage =
      phase === 'reconstruction-initiating' ||
      phase === 'reconstruction-collapse' ||
      phase === 'reconstruction-void' ||
      phase === 'reconstruction-recall'
    const progress = synchronizing
      ? trialRuntime.syncVisual
      : passage
        ? 1
        : reconstructionRuntime.rebuild
    const entrance = [0.06, 0.3, 0.56][orderIndex]
    const stage = synchronizing
      ? MathUtils.smootherstep(progress, orderIndex * 0.1, 0.4 + orderIndex * 0.16)
      : MathUtils.smootherstep(progress, entrance, entrance + 0.23)
    const visible =
      (synchronizing || passage || phase === 'reconstruction-rebuilding') &&
      stage > 0.01 &&
      (synchronizing || passage || progress < 0.94)
    stream.current.visible = visible
    if (!visible) return
    const foundationScale = orderIndex === 0 ? 1.28 : orderIndex === 1 ? 0.86 : 0.68
    const qualityScale = quality === 'low' ? 0.76 : 1
    const fade =
      phase === 'reconstruction-rebuilding'
        ? 1 - MathUtils.smootherstep(progress, 0.72, 0.94)
        : 1
    stream.current.scale.setScalar(
      foundationScale *
        qualityScale *
        stage *
        Math.max(0.08, fade) *
        (synchronizing ? MathUtils.lerp(1.2, 0.78, progress) : 1),
    )
    stream.current.rotation.z =
      Math.sin(clock.elapsedTime * (0.42 + orderIndex * 0.08)) *
      trialRuntime.syncInstability *
      0.13
  })

  const colors = STREAM_COLORS[fragment]
  return (
    <group ref={stream} visible={false}>
      <mesh>
        <tubeGeometry
          args={[
            STREAM_CURVES[fragment],
            56,
            orderIndex === 0 ? 0.06 : orderIndex === 1 ? 0.042 : 0.032,
            7,
            false,
          ]}
        />
        <EnergyFilamentMaterial
          color={colors.body}
          hot={colors.hot}
          opacity={orderIndex === 0 ? 0.94 : orderIndex === 1 ? 0.76 : 0.64}
          rhythm={fragment === 'identity' ? 1.5 : fragment === 'fear' ? 0.9 : 1.15}
          energy={() => Math.max(trialRuntime.syncVisual, reconstructionRuntime.recall)}
        />
      </mesh>
      <mesh>
        <tubeGeometry args={[STREAM_CURVES[fragment], 40, 0.012, 5, false]} />
        <EnergyFilamentMaterial
          color={colors.hot}
          hot="#ffffff"
          opacity={orderIndex === 0 ? 0.8 : 0.48}
          rhythm={1.8 + orderIndex * 0.18}
          energy={() => trialRuntime.syncVisual}
        />
      </mesh>
    </group>
  )
}

function ConvergingMemoryStreams() {
  const order = useExperienceStore((state) => state.collectionOrder)
  return (
    <group name="reconstruction-memory-streams">
      {order.map((fragment, orderIndex) => (
        <MemoryStream key={fragment} fragment={fragment} orderIndex={orderIndex} />
      ))}
    </group>
  )
}

function InternalIgnition() {
  const order = useExperienceStore((state) => state.collectionOrder)
  const phase = useExperienceStore((state) => state.phase)
  const groups = [useRef<Group>(null), useRef<Group>(null), useRef<Group>(null)]
  const curves = useMemo(
    () => [
      new CatmullRomCurve3([
        new Vector3(0, -1.3, 0.38),
        new Vector3(-0.2, -0.35, 0.58),
        new Vector3(0.18, 0.56, 0.56),
        new Vector3(0, 1.72, 0.2),
      ]),
      new CatmullRomCurve3([
        new Vector3(-0.58, -0.82, 0.28),
        new Vector3(0.38, -0.1, 0.64),
        new Vector3(-0.45, 0.66, 0.48),
        new Vector3(0.52, 1.38, 0.12),
      ]),
      new CatmullRomCurve3([
        new Vector3(0.62, -0.72, 0.22),
        new Vector3(-0.36, 0.08, 0.62),
        new Vector3(0.46, 0.78, 0.42),
        new Vector3(-0.38, 1.46, 0.08),
      ]),
    ],
    [],
  )

  useFrame(() => {
    const progress =
      phase === 'reconstruction-rebuilding' ? reconstructionRuntime.rebuild : 0
    groups.forEach((ref, index) => {
      if (!ref.current) return
      const start = [0.08, 0.36, 0.66][index]
      const end = [0.48, 0.74, 0.94][index]
      const ignition = MathUtils.smootherstep(progress, start, end)
      ref.current.visible = ignition > 0.01
      ref.current.scale.setScalar(Math.max(0.001, ignition))
    })
  })

  return (
    <group name="sequential-internal-ignition">
      {order.map((fragment, index) => {
        const colors = STREAM_COLORS[fragment]
        return (
          <group key={fragment} ref={groups[index]} visible={false}>
            <mesh>
              <tubeGeometry
                args={[curves[index], 42, index === 0 ? 0.044 : 0.027, 6, false]}
              />
              <EnergyFilamentMaterial
                color={colors.body}
                hot={colors.hot}
                opacity={index === 0 ? 0.96 : 0.72}
                rhythm={1.1 + index * 0.24}
                energy={() => reconstructionRuntime.rebuild}
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function CathedralResponse() {
  const group = useRef<Group>(null)
  const blades = useRef<InstancedMesh>(null)
  const phase = useExperienceStore((state) => state.phase)
  const order = useExperienceStore((state) => state.collectionOrder)
  const ending = useMemo(() => deriveEndingConfiguration(order), [order])

  useLayoutEffect(() => {
    if (!blades.current) return
    const transform = new Object3D()
    let instance = 0
    for (let depth = 0; depth < 5; depth += 1) {
      for (const side of [-1, 1]) {
        transform.position.set(
          side * (3.1 + depth * 0.36),
          0.45 + depth * 0.18,
          -1.4 - depth * 0.55,
        )
        transform.rotation.set(0, side * -0.08, side * 0.025)
        transform.scale.set(0.13, 3.25 + depth * 0.32, 0.45)
        transform.updateMatrix()
        blades.current.setMatrixAt(instance, transform.matrix)
        instance += 1
      }
    }
    blades.current.instanceMatrix.needsUpdate = true
  }, [])

  useFrame(() => {
    if (!group.current || !ending) return
    const raw =
      phase === 'reconstruction-rebuilding'
        ? reconstructionRuntime.rebuild
        : phase === 'reconstruction-reveal' || phase === 'ending'
          ? 1
          : 0
    const response = MathUtils.smootherstep(raw, 0.62, 0.98)
    group.current.visible = response > 0.01
    if (!group.current.visible) return
    const openness =
      ending.profile.id === 'hope'
        ? 1 + response * 0.22
        : ending.profile.id === 'fear'
          ? 1 - response * 0.07
          : 1
    group.current.scale.set(
      openness,
      MathUtils.lerp(0.1, 1, response),
      MathUtils.lerp(0.2, 1, response),
    )
    group.current.position.set(
      ending.profile.id === 'fear' ? -0.22 * response : 0,
      MathUtils.lerp(-3.2, ending.profile.architecture.verticalLift, response),
      -1.1,
    )
    group.current.rotation.z =
      ending.profile.id === 'fear'
        ? -0.06 * response
        : ending.profile.id === 'hope'
          ? 0.025 * response
          : 0
  })

  if (!ending) return null
  return (
    <group ref={group} visible={false} name="cathedral-response-behind-felicia">
      <instancedMesh ref={blades} args={[undefined, undefined, 10]}>
        <boxGeometry />
        <ArchitecturalMaterial
          body="#111117"
          edge={ending.profile.accentColor}
          opacity={0.92}
          variation={0.09}
        />
      </instancedMesh>
      <mesh position={[0, 0.6, -3.8]} scale={[4.5, 4.2, 1]}>
        <planeGeometry />
        <MemoryFieldMaterial
          color="#0b0910"
          accent={ending.profile.dominantColor}
          opacity={0.12}
          distortion={0.035}
          progress={() => reconstructionRuntime.rebuild}
        />
      </mesh>
    </group>
  )
}

export function ReconstructionSpectacle() {
  return (
    <>
      <DetachedAnatomy />
      <ExposedSignal />
      <ConvergingMemoryStreams />
      <InternalIgnition />
      <CathedralResponse />
    </>
  )
}
