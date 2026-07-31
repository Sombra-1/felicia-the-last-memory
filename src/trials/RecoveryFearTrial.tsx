import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { DoubleSide, Group, MathUtils, Shape } from 'three'
import {
  ArchitecturalMaterial,
  MemoryShellMaterial,
  ScarMaterial,
} from '../materials/MemoryMaterials'
import { useExperienceStore } from '../state/experienceStore'
import type { FearDirection } from './trialConfig'
import { trialRuntime } from './trialRuntime'

const SHELTER_EXTRUSION = {
  depth: 0.46,
  bevelEnabled: true,
  bevelSegments: 4,
  steps: 1,
  bevelSize: 0.095,
  bevelThickness: 0.08,
  curveSegments: 22,
} as const

const PRESSURE_EXTRUSION = {
  depth: 0.32,
  bevelEnabled: true,
  bevelSegments: 3,
  steps: 1,
  bevelSize: 0.065,
  bevelThickness: 0.05,
  curveSegments: 18,
} as const

function useShelterShape() {
  return useMemo(() => {
    const shape = new Shape()
    shape.moveTo(-1.3, -0.52)
    shape.bezierCurveTo(-0.68, -1.1, 0.42, -0.94, 1.28, -0.28)
    shape.lineTo(0.82, 0.12)
    shape.bezierCurveTo(0.2, -0.16, -0.36, 0.08, -0.7, 0.66)
    shape.lineTo(-1.46, 0.36)
    shape.closePath()
    return shape
  }, [])
}

function ShelterFold({
  direction,
  selected,
}: {
  direction: FearDirection
  selected: boolean
}) {
  const shape = useShelterShape()
  return (
    <group>
      <mesh>
        <extrudeGeometry args={[shape, SHELTER_EXTRUSION]} />
        <ArchitecturalMaterial
          body={selected ? '#302535' : '#141a1c'}
          edge={selected ? '#9e6aa3' : '#586269'}
          variation={0.11}
          brush={0.12}
          relief={0.035}
          side={DoubleSide}
        />
      </mesh>
      <mesh
        position={[0, direction === 'up' ? 0.08 : -0.04, 0.54]}
        scale={[0.74, 0.46, 1]}
      >
        <extrudeGeometry args={[shape, { ...SHELTER_EXTRUSION, depth: 0.055 }]} />
        <ScarMaterial
          color="#4d3153"
          hot="#b77abc"
          opacity={selected ? 0.84 : 0.24}
          growth={() =>
            selected ? MathUtils.smootherstep(trialRuntime.fearPulse, 0.5, 1) : 0.12
          }
          energy={() => (selected ? trialRuntime.beatEnergy : 0)}
        />
      </mesh>
    </group>
  )
}

function usePressureShape() {
  return useMemo(() => {
    const shape = new Shape()
    shape.moveTo(-2.1, -0.72)
    shape.bezierCurveTo(-1.12, -1.34, 0.52, -1.06, 2.16, -0.34)
    shape.lineTo(1.62, 0.02)
    shape.bezierCurveTo(0.42, -0.3, -0.82, -0.12, -1.64, 0.74)
    shape.lineTo(-2.38, 0.28)
    shape.closePath()
    return shape
  }, [])
}

function PressureRidge() {
  const shape = usePressureShape()
  return (
    <mesh>
      <extrudeGeometry args={[shape, PRESSURE_EXTRUSION]} />
      <MemoryShellMaterial
        body="#211923"
        depth="#030405"
        accent="#7f5685"
        opacity={0.64}
        distortion={0.026}
        thickness={0.98}
        side={DoubleSide}
        energy={() => trialRuntime.fearPulse}
      />
    </mesh>
  )
}

const shelterPositions: Record<
  FearDirection,
  { position: [number, number, number]; rotation: number }
> = {
  left: { position: [-2.04, -0.12, -0.34], rotation: -0.18 },
  up: { position: [0.18, 2.02, -0.58], rotation: Math.PI / 2 + 0.06 },
  right: { position: [2.08, 0.22, -0.78], rotation: Math.PI + 0.16 },
}

export function RecoveryFearTrial() {
  const root = useRef<Group>(null)
  const pressure = useRef<Group>(null)
  const left = useRef<Group>(null)
  const up = useRef<Group>(null)
  const right = useRef<Group>(null)
  const phase = useExperienceStore((state) => state.phase)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)

  useFrame((_, delta) => {
    if (
      !root.current ||
      !pressure.current ||
      !left.current ||
      !up.current ||
      !right.current
    )
      return
    const active = activeFragment === 'fear' && phase.startsWith('trial-')
    const presence = active
      ? phase === 'trial-departure'
        ? MathUtils.smootherstep(trialRuntime.passage, 0.04, 1)
        : phase === 'trial-returning'
          ? 1 - MathUtils.smootherstep(trialRuntime.returnProgress, 0.04, 0.98)
          : 1
      : 0
    root.current.visible = presence > 0.002
    if (!root.current.visible) return

    const damping = reducedMotion ? 14 : 6
    root.current.position.z = MathUtils.damp(
      root.current.position.z,
      MathUtils.lerp(-1.1, -4.25, presence),
      damping,
      delta,
    )
    root.current.scale.set(
      MathUtils.lerp(0.74, 1, presence),
      MathUtils.lerp(0.74, 1, presence),
      1,
    )

    const ridgeStart =
      trialRuntime.fearDirection === 'left'
        ? [-6.4, 0.1, 0.3]
        : trialRuntime.fearDirection === 'right'
          ? [6.4, 0.2, -0.2]
          : [0.4, 5.6, -0.5]
    pressure.current.position.set(
      MathUtils.lerp(ridgeStart[0], 0.1, trialRuntime.fearPulse),
      MathUtils.lerp(ridgeStart[1], 0.26, trialRuntime.fearPulse),
      MathUtils.lerp(ridgeStart[2], 0.35, trialRuntime.fearPulse),
    )
    pressure.current.rotation.z =
      trialRuntime.fearDirection === 'left'
        ? 0.12
        : trialRuntime.fearDirection === 'right'
          ? Math.PI + 0.08
          : -Math.PI / 2
    pressure.current.scale.set(
      MathUtils.lerp(1.32, 0.58, trialRuntime.fearPulse),
      MathUtils.lerp(1.18, 0.82, trialRuntime.fearPulse),
      1,
    )

    const folds = { left: left.current, up: up.current, right: right.current }
    for (const direction of Object.keys(folds) as FearDirection[]) {
      const fold = folds[direction]
      const selected = trialRuntime.fearShield === direction
      const threatened = trialRuntime.fearDirection === direction
      const compression = threatened ? trialRuntime.fearPulse : 0
      const targetScale =
        1 +
        (selected ? 0.16 + trialRuntime.beatEnergy * 0.1 : 0) -
        (threatened && !selected ? compression * 0.12 : 0)
      fold.scale.set(
        MathUtils.damp(fold.scale.x, targetScale, damping, delta),
        MathUtils.damp(fold.scale.y, 1 + (selected ? 0.12 : 0), damping, delta),
        MathUtils.damp(fold.scale.z, 1 + (selected ? 0.52 : 0), damping, delta),
      )
      fold.position.z = MathUtils.damp(
        fold.position.z,
        shelterPositions[direction].position[2] + (selected ? 0.28 : 0),
        damping,
        delta,
      )
    }
  })

  const fold = (direction: FearDirection, ref: React.RefObject<Group | null>) => {
    const transform = shelterPositions[direction]
    return (
      <group
        ref={ref}
        position={transform.position}
        rotation={[0.04, direction === 'up' ? 0.08 : -0.12, transform.rotation]}
      >
        <ShelterFold
          direction={direction}
          selected={trialRuntime.fearShield === direction}
        />
      </group>
    )
  }

  return (
    <group ref={root} position={[0, 0, -1.1]} name="phase9-fear-compression-fault">
      <group ref={pressure}>
        <PressureRidge />
      </group>
      {fold('left', left)}
      {fold('up', up)}
      {fold('right', right)}
    </group>
  )
}
