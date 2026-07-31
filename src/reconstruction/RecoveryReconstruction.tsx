import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { DoubleSide, Group, MathUtils, Shape } from 'three'
import {
  ArchitecturalMaterial,
  MemoryShellMaterial,
  ScarMaterial,
} from '../materials/MemoryMaterials'
import { type FragmentId, useExperienceStore } from '../state/experienceStore'
import { trialRuntime } from '../trials/trialRuntime'
import { reconstructionRuntime } from './reconstructionRuntime'

const FRONT_EXTRUSION = {
  depth: 0.42,
  bevelEnabled: true,
  bevelSegments: 4,
  steps: 1,
  bevelSize: 0.09,
  bevelThickness: 0.075,
  curveSegments: 28,
} as const

const LAW_EXTRUSION = {
  depth: 0.26,
  bevelEnabled: true,
  bevelSegments: 3,
  steps: 1,
  bevelSize: 0.06,
  bevelThickness: 0.05,
  curveSegments: 22,
} as const

function useInversionShape() {
  return useMemo(() => {
    const shape = new Shape()
    shape.moveTo(-1.08, -5.4)
    shape.bezierCurveTo(-0.1, -3.74, -1.04, -1.82, 0.06, -0.26)
    shape.bezierCurveTo(1.16, 1.32, 0.16, 3.34, 1.34, 5.28)
    shape.lineTo(1.94, 4.88)
    shape.bezierCurveTo(0.84, 3.18, 1.72, 1.14, 0.64, -0.4)
    shape.bezierCurveTo(-0.42, -1.92, 0.46, -3.84, -0.5, -5.62)
    shape.closePath()
    return shape
  }, [])
}

function InversionFront({ foundation }: { foundation: FragmentId }) {
  const shape = useInversionShape()
  const palette =
    foundation === 'fear'
      ? ['#241a26', '#9a66a0']
      : foundation === 'hope'
        ? ['#2b2418', '#d5a45a']
        : ['#182226', '#c4d1d2']
  return (
    <mesh>
      <extrudeGeometry args={[shape, FRONT_EXTRUSION]} />
      <MemoryShellMaterial
        body={palette[0]}
        depth="#020405"
        accent={palette[1]}
        opacity={0.78}
        distortion={0.016}
        thickness={1}
        energy={() =>
          Math.max(
            trialRuntime.syncVisual,
            reconstructionRuntime.rebuild,
            reconstructionRuntime.reveal,
          )
        }
        side={DoubleSide}
      />
    </mesh>
  )
}

function useLawShape(fragment: FragmentId) {
  return useMemo(() => {
    const shape = new Shape()
    if (fragment === 'identity') {
      shape.moveTo(-0.64, -4.92)
      shape.bezierCurveTo(-0.08, -3.2, -0.58, -1.36, 0.04, 0.18)
      shape.bezierCurveTo(0.62, 1.7, 0.14, 3.36, 0.76, 4.92)
      shape.lineTo(1.08, 4.7)
      shape.bezierCurveTo(0.46, 3.14, 0.92, 1.5, 0.34, 0.02)
      shape.bezierCurveTo(-0.24, -1.46, 0.28, -3.3, -0.28, -5.08)
    } else if (fragment === 'fear') {
      shape.moveTo(-2.62, -0.76)
      shape.bezierCurveTo(-1.32, -1.48, 0.42, -1.24, 2.66, -0.32)
      shape.lineTo(2.1, 0.18)
      shape.bezierCurveTo(0.62, -0.18, -0.86, 0.12, -1.94, 0.92)
      shape.lineTo(-2.82, 0.36)
    } else {
      shape.moveTo(-0.92, -4.68)
      shape.bezierCurveTo(-0.14, -3.22, -0.62, -1.48, 0.26, -0.08)
      shape.bezierCurveTo(1.16, 1.34, 0.72, 3.1, 1.72, 4.72)
      shape.lineTo(1.34, 4.98)
      shape.bezierCurveTo(0.26, 3.28, 0.74, 1.54, -0.12, 0.14)
      shape.bezierCurveTo(-0.98, -1.26, -0.46, -3.04, -1.28, -4.5)
    }
    shape.closePath()
    return shape
  }, [fragment])
}

function MemoryLaw({ fragment }: { fragment: FragmentId }) {
  const shape = useLawShape(fragment)
  const palette =
    fragment === 'identity'
      ? ['#121a1e', '#a7b5ba']
      : fragment === 'fear'
        ? ['#211923', '#87588d']
        : ['#272218', '#c39149']

  return (
    <group>
      <mesh>
        <extrudeGeometry args={[shape, LAW_EXTRUSION]} />
        <ArchitecturalMaterial
          body={palette[0]}
          edge={palette[1]}
          variation={0.12}
          brush={0.11}
          relief={0.035}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0, 0.32]} scale={[0.72, 0.94, 1]}>
        <extrudeGeometry args={[shape, { ...LAW_EXTRUSION, depth: 0.045 }]} />
        <ScarMaterial
          color={palette[1]}
          hot={fragment === 'hope' ? '#e8bb70' : '#e6ece9'}
          opacity={0.56}
          growth={() =>
            reconstructionRuntime.activeRecall === fragment
              ? reconstructionRuntime.recall
              : reconstructionRuntime.rebuild
          }
          energy={() => Math.max(trialRuntime.syncVisual, reconstructionRuntime.rebuild)}
        />
      </mesh>
    </group>
  )
}

export function RecoveryReconstruction() {
  const root = useRef<Group>(null)
  const front = useRef<Group>(null)
  const laws = useRef<Array<Group | null>>([])
  const phase = useExperienceStore((state) => state.phase)
  const collectionOrder = useExperienceStore((state) => state.collectionOrder)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)

  useFrame((_, delta) => {
    if (!root.current || !front.current) return
    const active = phase.startsWith('reconstruction-') || phase === 'ending'
    root.current.visible = active
    if (!active) return

    const sync = phase === 'reconstruction-synchronizing' ? trialRuntime.syncVisual : 1
    const collapse = reconstructionRuntime.collapse
    const rebuild = reconstructionRuntime.rebuild
    const reveal = phase === 'ending' ? 1 : reconstructionRuntime.reveal
    const damping = reducedMotion ? 14 : 5

    front.current.position.set(
      MathUtils.lerp(-4.6, -1.4, sync) + MathUtils.lerp(0, 4.2, rebuild),
      MathUtils.lerp(-0.5, 0.18, sync) + Math.sin(rebuild * Math.PI) * 0.72,
      MathUtils.lerp(1.4, -1.1, sync) - collapse * 1.4 - rebuild * 1.8,
    )
    front.current.rotation.set(
      0.04 + collapse * 0.36,
      -0.32 + collapse * 0.72 + rebuild * 1.1,
      -0.2 + trialRuntime.syncInstability * 0.12 * (1 - sync) + rebuild * 0.38,
    )
    front.current.scale.set(
      MathUtils.damp(
        front.current.scale.x,
        Math.max(0.08, 0.42 + sync * 0.76 + rebuild * 1.12 - reveal * 0.42),
        damping,
        delta,
      ),
      MathUtils.damp(
        front.current.scale.y,
        0.82 + sync * 0.34 + rebuild * 0.72 - reveal * 0.3,
        damping,
        delta,
      ),
      1,
    )

    laws.current.forEach((law, rank) => {
      if (!law) return
      const fragment = collectionOrder[rank]
      const weight = [0.6, 0.25, 0.15][rank] ?? 0.15
      const recalled =
        reconstructionRuntime.recallIndex > rank
          ? 1
          : reconstructionRuntime.recallIndex === rank
            ? reconstructionRuntime.recall
            : 0
      const presence = Math.max(recalled * 0.82, rebuild, reveal)
      const orientation =
        fragment === 'identity'
          ? [0.08, -0.16, -0.06]
          : fragment === 'fear'
            ? [-0.1, 0.22, -0.24]
            : [0.04, -0.2, 0.22]
      law.position.set(
        (fragment === 'fear' ? -0.7 : fragment === 'hope' ? 1.1 : 0.18) *
          (0.7 + rank * 0.24),
        (rank - 1) * 0.42 + (fragment === 'hope' ? presence * 0.74 : 0),
        -4.6 - rank * 1.6 - rebuild * (2.2 + rank * 0.4),
      )
      law.rotation.set(...(orientation as [number, number, number]))
      law.scale.set(
        Math.max(0.001, presence * (0.48 + weight * 1.1)),
        Math.max(0.001, presence * (0.58 + weight * 1.3)),
        1,
      )
    })
  })

  return (
    <group
      ref={root}
      visible={false}
      position={[0, -0.06, 0.08]}
      name="phase9-world-inversion-reconstruction"
    >
      <group ref={front}>
        <InversionFront foundation={collectionOrder[0] ?? 'identity'} />
      </group>
      {collectionOrder.map((fragment, rank) => (
        <group
          key={`${fragment}-${rank}`}
          ref={(node) => {
            laws.current[rank] = node
          }}
          scale={0.001}
        >
          <MemoryLaw fragment={fragment} />
        </group>
      ))}
    </group>
  )
}
