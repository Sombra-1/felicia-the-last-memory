import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { DoubleSide, Group, MathUtils, Shape } from 'three'
import {
  ArchitecturalMaterial,
  MemoryShellMaterial,
  ScarMaterial,
} from '../materials/MemoryMaterials'
import { useExperienceStore } from '../state/experienceStore'
import { trialRuntime } from './trialRuntime'

const SEAM_EXTRUSION = {
  depth: 0.32,
  bevelEnabled: true,
  bevelSegments: 4,
  steps: 1,
  bevelSize: 0.075,
  bevelThickness: 0.06,
  curveSegments: 22,
} as const

const SIGNAL_EXTRUSION = {
  depth: 0.2,
  bevelEnabled: true,
  bevelSegments: 3,
  steps: 1,
  bevelSize: 0.045,
  bevelThickness: 0.04,
  curveSegments: 14,
} as const

function useOpeningShape(index: number) {
  return useMemo(() => {
    const direction = index % 2 === 0 ? 1 : -1
    const shape = new Shape()
    shape.moveTo(-1.62, -0.5)
    shape.bezierCurveTo(-0.86, -1.02, 0.24, -0.88, 1.54, -0.22)
    shape.bezierCurveTo(0.96, -0.02, 0.54, 0.34, 0.18 * direction, 0.82)
    shape.bezierCurveTo(-0.54, 0.42, -1.18, 0.34, -1.72, 0.04)
    shape.closePath()
    return shape
  }, [index])
}

function LiftedSeam({ index, active }: { index: number; active: boolean }) {
  const shape = useOpeningShape(index)
  return (
    <group>
      <mesh>
        <extrudeGeometry args={[shape, SEAM_EXTRUSION]} />
        <ArchitecturalMaterial
          body={active ? '#262218' : '#101719'}
          edge={active ? '#c6974f' : '#4a565b'}
          variation={0.12}
          brush={0.1}
          relief={0.034}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[0.08, 0.05, 0.4]} scale={[0.74, 0.45, 1]}>
        <extrudeGeometry args={[shape, { ...SEAM_EXTRUSION, depth: 0.055 }]} />
        <ScarMaterial
          color="#8c622e"
          hot="#edc278"
          opacity={active ? 0.86 : 0.34}
          growth={() => (active ? Math.max(0.3, trialRuntime.beatProgress) : 0.18)}
          energy={() => (active ? trialRuntime.beatEnergy : 0)}
        />
      </mesh>
    </group>
  )
}

function useSignalShape() {
  return useMemo(() => {
    const shape = new Shape()
    shape.moveTo(-0.58, -0.34)
    shape.lineTo(-0.08, -0.56)
    shape.lineTo(0.54, -0.12)
    shape.lineTo(0.18, 0.18)
    shape.lineTo(0.42, 0.5)
    shape.lineTo(-0.26, 0.34)
    shape.lineTo(-0.62, 0.04)
    shape.closePath()
    return shape
  }, [])
}

function WarmCrease() {
  const shape = useSignalShape()
  return (
    <mesh>
      <extrudeGeometry args={[shape, SIGNAL_EXTRUSION]} />
      <MemoryShellMaterial
        body="#3a2d1a"
        depth="#080705"
        accent="#e3ad5a"
        opacity={0.78}
        distortion={0.012}
        thickness={0.98}
        energy={() => trialRuntime.beatEnergy}
        side={DoubleSide}
      />
    </mesh>
  )
}

function usePathShape(index: number) {
  return useMemo(() => {
    const sign = index === 1 ? -1 : 1
    const shape = new Shape()
    shape.moveTo(-0.18, -1.18)
    shape.bezierCurveTo(0.34 * sign, -0.58, -0.24 * sign, 0.12, 0.28 * sign, 1.1)
    shape.lineTo(0.08 * sign, 1.24)
    shape.bezierCurveTo(-0.46 * sign, 0.18, 0.12 * sign, -0.56, -0.36, -1.08)
    shape.closePath()
    return shape
  }, [index])
}

function WarmPath({ index, complete }: { index: number; complete: boolean }) {
  const shape = usePathShape(index)
  return (
    <mesh>
      <extrudeGeometry args={[shape, { ...SIGNAL_EXTRUSION, depth: 0.07 }]} />
      <ScarMaterial
        color="#805929"
        hot="#e7b665"
        opacity={complete ? 0.72 : 0.2}
        growth={() => (complete ? 1 : trialRuntime.beatProgress)}
        energy={() => trialRuntime.beatEnergy}
      />
    </mesh>
  )
}

function useDistanceShape() {
  return useMemo(() => {
    const shape = new Shape()
    shape.moveTo(-1.34, -4.6)
    shape.bezierCurveTo(-0.46, -2.94, -1.02, -1.24, -0.12, 0.28)
    shape.bezierCurveTo(0.76, 1.78, 0.18, 3.2, 1.2, 4.78)
    shape.lineTo(1.82, 4.42)
    shape.bezierCurveTo(0.82, 2.92, 1.34, 1.36, 0.52, -0.12)
    shape.bezierCurveTo(-0.26, -1.54, 0.3, -3.14, -0.56, -4.82)
    shape.closePath()
    return shape
  }, [])
}

function ExposedDistance() {
  const shape = useDistanceShape()
  return (
    <mesh>
      <extrudeGeometry args={[shape, { ...SEAM_EXTRUSION, depth: 0.5 }]} />
      <ArchitecturalMaterial
        body="#11120f"
        edge="#6d624e"
        variation={0.14}
        brush={0.08}
        relief={0.038}
        side={DoubleSide}
      />
    </mesh>
  )
}

export function RecoveryHopeTrial() {
  const root = useRef<Group>(null)
  const signal = useRef<Group>(null)
  const seams = useRef<Array<Group | null>>([])
  const paths = useRef<Array<Group | null>>([])
  const distance = useRef<Group>(null)
  const phase = useExperienceStore((state) => state.phase)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const trialBeat = useExperienceStore((state) => state.trialBeat)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)

  useFrame((_, delta) => {
    if (!root.current || !signal.current || !distance.current) return
    const active = activeFragment === 'hope' && phase.startsWith('trial-')
    const presence = active
      ? phase === 'trial-departure'
        ? MathUtils.smootherstep(trialRuntime.passage, 0.04, 1)
        : phase === 'trial-returning'
          ? 1 - MathUtils.smootherstep(trialRuntime.returnProgress, 0.04, 0.98)
          : 1
      : 0
    root.current.visible = presence > 0.002
    if (!root.current.visible) return

    const damping = reducedMotion ? 14 : 5
    root.current.position.z = MathUtils.damp(
      root.current.position.z,
      MathUtils.lerp(-1.2, -4.15, presence),
      damping,
      delta,
    )
    root.current.position.y = MathUtils.damp(
      root.current.position.y,
      MathUtils.lerp(-0.8, 0.15, presence),
      damping,
      delta,
    )
    root.current.scale.set(
      MathUtils.lerp(0.76, 1, presence),
      MathUtils.lerp(0.7, 1, presence),
      1,
    )

    signal.current.position.set(
      trialRuntime.hopeSignalX,
      trialRuntime.hopeSignalY,
      -0.1 + trialRuntime.beatEnergy * 0.28,
    )
    signal.current.rotation.z = MathUtils.damp(
      signal.current.rotation.z,
      (trialRuntime.hopeGateX - trialRuntime.hopeSignalX) * 0.18,
      damping,
      delta,
    )
    signal.current.scale.setScalar(0.76 + trialRuntime.beatEnergy * 0.16)

    seams.current.forEach((seam, index) => {
      if (!seam) return
      const activeSeam = index === trialBeat
      const opened = index < trialBeat ? 1 : activeSeam ? trialRuntime.beatProgress : 0
      seam.position.x = [-0.92, 0.84, 0.06][index] ?? 0
      seam.position.y = [-1.52, 0.14, 1.86][index] ?? 0
      seam.position.z = -0.72 - index * 0.82
      seam.rotation.z =
        (index === 1 ? Math.PI : 0) +
        (activeSeam ? (trialRuntime.hopeSignalX - trialRuntime.hopeGateX) * 0.06 : 0)
      seam.scale.set(0.92 + opened * 0.12, 0.88 + opened * 0.36, 1 + opened * 0.34)
    })

    paths.current.forEach((path, index) => {
      if (!path) return
      const completed = index < trialBeat
      const growth = completed ? 1 : index === trialBeat ? trialRuntime.beatProgress : 0
      path.scale.y = MathUtils.damp(path.scale.y, Math.max(0.02, growth), damping, delta)
    })

    const release = MathUtils.clamp((trialBeat + trialRuntime.beatProgress) / 3, 0, 1)
    distance.current.position.set(1.18 + release * 1.5, 0.34 + release * 1.7, -8.8)
    distance.current.rotation.z = -0.18 + release * 0.3
    distance.current.scale.set(1.28 + release * 0.72, 0.74 + release * 0.88, 1)
  })

  return (
    <group ref={root} position={[0, -0.8, -1.2]} name="phase9-hope-opening-seam">
      <group ref={distance} position={[1.18, 0.34, -8.8]}>
        <ExposedDistance />
      </group>
      {[0, 1, 2].map((index) => (
        <group
          key={index}
          ref={(node) => {
            seams.current[index] = node
          }}
        >
          <LiftedSeam index={index} active={index === trialBeat} />
        </group>
      ))}
      {[0, 1, 2].map((index) => (
        <group
          key={index}
          ref={(node) => {
            paths.current[index] = node
          }}
          position={[
            index === 0 ? -0.44 : index === 1 ? 0.48 : 0.1,
            -0.54 + index * 1.72,
            -0.42 - index * 0.76,
          ]}
          scale={[1, 0.02, 1]}
        >
          <WarmPath index={index} complete={index < trialBeat} />
        </group>
      ))}
      <group ref={signal}>
        <WarmCrease />
      </group>
    </group>
  )
}
