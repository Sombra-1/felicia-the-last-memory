import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { CatmullRomCurve3, Group, MathUtils, Vector3 } from 'three'
import {
  ArchitecturalMaterial,
  EnergyFilamentMaterial,
  MemoryGlassMaterial,
  MemoryShellMaterial,
} from '../materials/MemoryMaterials'
import type { FragmentId } from '../state/experienceStore'
import { useExperienceStore } from '../state/experienceStore'
import { trialRuntime } from '../trials/trialRuntime'
import { reconstructionRuntime } from './reconstructionRuntime'

const MEMORY_COLOR: Record<FragmentId, { body: string; hot: string }> = {
  identity: { body: '#9ba8ae', hot: '#f7fbfc' },
  fear: { body: '#704e7e', hot: '#d49be1' },
  hope: { body: '#9d6f36', hot: '#f1c57d' },
}

const PORT_POSITION: Record<FragmentId, Vector3> = {
  identity: new Vector3(-0.5, 0.58, 0.78),
  fear: new Vector3(0.56, 0.22, 0.78),
  hope: new Vector3(0.16, 1.36, 0.68),
}

const ORGAN_POSITION: Record<FragmentId, Vector3> = {
  identity: new Vector3(-1.72, 0.4, 1.04),
  fear: new Vector3(2.26, 0.24, 1.04),
  hope: new Vector3(0.63, 2.84, 0.9),
}

function SynchronizationNode() {
  const node = useRef<Group>(null)
  const phase = useExperienceStore((state) => state.phase)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)

  useFrame(({ clock }) => {
    if (!node.current) return
    const active =
      phase.startsWith('reconstruction-') &&
      phase !== 'reconstruction-reveal' &&
      phase !== 'reconstruction-rebuilding'
    const sync =
      phase === 'reconstruction-synchronizing'
        ? trialRuntime.syncVisual
        : phase.startsWith('reconstruction-')
          ? 1
          : 0
    node.current.visible = active || phase === 'reconstruction-rebuilding'
    if (!node.current.visible) return
    const pulse = reducedMotion ? 0 : Math.sin(clock.elapsedTime * 1.8) * 0.035
    node.current.scale.setScalar(0.84 + sync * 0.22 + pulse)
    node.current.rotation.y = reducedMotion ? 0 : clock.elapsedTime * 0.08
  })

  return (
    <group ref={node} visible={false} position={[0, 0.64, 1.16]}>
      <mesh scale={[0.5, 0.58, 0.42]} rotation={[0.08, 0.34, 0]}>
        <dodecahedronGeometry args={[1, 1]} />
        <MemoryGlassMaterial
          body="#5c595f"
          accent="#fffaf2"
          opacity={0.9}
          roughness={0.16}
          transmission={0}
          thickness={0.9}
        />
      </mesh>
      <mesh scale={[0.15, 0.23, 0.13]} rotation={[0, Math.PI / 4, 0]}>
        <octahedronGeometry args={[1, 0]} />
        <ArchitecturalMaterial
          body="#c5c1bc"
          edge="#ffffff"
          opacity={0.98}
          variation={0.015}
          brush={0.01}
        />
      </mesh>
      <pointLight
        color="#fff5e8"
        intensity={2.2 + trialRuntime.syncVisual * 4.8}
        distance={5.4}
        decay={2}
      />
    </group>
  )
}

function DockingPort({
  fragment,
  orderIndex,
}: {
  fragment: FragmentId
  orderIndex: number
}) {
  const port = useRef<Group>(null)
  const phase = useExperienceStore((state) => state.phase)

  useFrame(() => {
    if (!port.current) return
    const progress =
      phase === 'reconstruction-synchronizing'
        ? trialRuntime.syncVisual
        : phase.startsWith('reconstruction-')
          ? 1
          : 0
    const stage = MathUtils.smootherstep(
      progress,
      orderIndex * 0.16,
      0.46 + orderIndex * 0.16,
    )
    port.current.visible = stage > 0.01
    port.current.scale.setScalar(
      Math.max(0.001, stage * (orderIndex === 0 ? 1.08 : orderIndex === 1 ? 0.88 : 0.72)),
    )
    port.current.rotation.z =
      fragment === 'identity' ? Math.PI / 2 : fragment === 'fear' ? -0.72 : 0.16
  })

  const color = MEMORY_COLOR[fragment]
  return (
    <group ref={port} position={PORT_POSITION[fragment]} visible={false}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.28, 0.24, 8, 1, false]} />
        <ArchitecturalMaterial
          body="#28272c"
          edge={color.hot}
          opacity={0.96}
          variation={0.025}
          brush={0.02}
        />
      </mesh>
      <mesh position={[0, 0, 0.14]} scale={[0.11, 0.11, 0.08]}>
        <octahedronGeometry args={[1, 0]} />
        <MemoryShellMaterial
          body={color.body}
          depth="#08070a"
          accent={color.hot}
          opacity={0.84}
          distortion={0.004}
          thickness={0.8}
          energy={() => trialRuntime.syncVisual}
        />
      </mesh>
    </group>
  )
}

function InsertionConduit({
  fragment,
  orderIndex,
}: {
  fragment: FragmentId
  orderIndex: number
}) {
  const conduit = useRef<Group>(null)
  const phase = useExperienceStore((state) => state.phase)
  const curve = useMemo(() => {
    const start = ORGAN_POSITION[fragment]
    const end = PORT_POSITION[fragment]
    return new CatmullRomCurve3([
      start,
      start
        .clone()
        .lerp(end, 0.34)
        .add(new Vector3(0, fragment === 'hope' ? -0.18 : 0.24, 0.12)),
      start
        .clone()
        .lerp(end, 0.74)
        .add(
          new Vector3(
            fragment === 'identity' ? 0.18 : fragment === 'fear' ? -0.2 : 0.08,
            0,
            0.16,
          ),
        ),
      end,
    ])
  }, [fragment])

  useFrame(() => {
    if (!conduit.current) return
    const sync =
      phase === 'reconstruction-synchronizing'
        ? trialRuntime.syncVisual
        : phase === 'reconstruction-rebuilding'
          ? 1 - reconstructionRuntime.rebuild
          : phase.startsWith('reconstruction-')
            ? 1
            : 0
    const stage = MathUtils.smootherstep(
      sync,
      orderIndex * 0.12,
      0.48 + orderIndex * 0.14,
    )
    conduit.current.visible = stage > 0.01
    conduit.current.scale.setScalar(Math.max(0.001, stage))
  })

  const color = MEMORY_COLOR[fragment]
  const radius = orderIndex === 0 ? 0.078 : orderIndex === 1 ? 0.046 : 0.028
  return (
    <group ref={conduit} visible={false}>
      <mesh>
        <tubeGeometry args={[curve, 48, radius, 7, false]} />
        <ArchitecturalMaterial
          body={orderIndex === 0 ? '#34383a' : '#242329'}
          edge={color.body}
          opacity={orderIndex === 0 ? 0.96 : 0.82}
          variation={0.025}
          brush={0.018}
        />
      </mesh>
      <mesh>
        <tubeGeometry args={[curve, 48, radius * 0.26, 6, false]} />
        <EnergyFilamentMaterial
          color={color.body}
          hot={color.hot}
          opacity={orderIndex === 0 ? 0.96 : orderIndex === 1 ? 0.72 : 0.58}
          rhythm={fragment === 'identity' ? 1.55 : fragment === 'fear' ? 0.88 : 1.08}
          energy={() => Math.max(trialRuntime.syncVisual, reconstructionRuntime.rebuild)}
        />
      </mesh>
    </group>
  )
}

export function Phase8Reconstruction() {
  const root = useRef<Group>(null)
  const phase = useExperienceStore((state) => state.phase)
  const order = useExperienceStore((state) => state.collectionOrder)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)

  useFrame(({ clock }) => {
    if (!root.current) return
    const visible = phase.startsWith('reconstruction-') && order.length === 3
    root.current.visible = visible
    if (!visible) return
    const rebuildFade =
      phase === 'reconstruction-rebuilding'
        ? 1 - MathUtils.smootherstep(reconstructionRuntime.rebuild, 0.78, 0.99)
        : phase === 'reconstruction-reveal'
          ? 0
          : 1
    root.current.scale.setScalar(Math.max(0.001, rebuildFade))
    root.current.rotation.y =
      reducedMotion || phase === 'reconstruction-rebuilding'
        ? 0
        : Math.sin(clock.elapsedTime * 0.12) * trialRuntime.syncInstability * 0.025
  })

  return (
    <group ref={root} visible={false} name="phase8-anatomy-first-reconstruction">
      <SynchronizationNode />
      {order.map((fragment, orderIndex) => (
        <group key={fragment}>
          <DockingPort fragment={fragment} orderIndex={orderIndex} />
          <InsertionConduit fragment={fragment} orderIndex={orderIndex} />
        </group>
      ))}
    </group>
  )
}
