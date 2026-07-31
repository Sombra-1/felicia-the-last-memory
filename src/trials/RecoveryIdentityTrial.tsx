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

const PLEAT_EXTRUSION = {
  depth: 0.54,
  bevelEnabled: true,
  bevelSegments: 4,
  steps: 1,
  bevelSize: 0.1,
  bevelThickness: 0.08,
  curveSegments: 24,
} as const

const LOCK_EXTRUSION = {
  depth: 0.24,
  bevelEnabled: true,
  bevelSegments: 3,
  steps: 1,
  bevelSize: 0.04,
  bevelThickness: 0.035,
  curveSegments: 14,
} as const

function usePleatShape(index: number) {
  return useMemo(() => {
    const shift = index * 0.08
    const shape = new Shape()
    shape.moveTo(-0.72 - shift, -4.8)
    shape.bezierCurveTo(-0.18, -3.08, -0.78, -1.22, -0.08, 0.32)
    shape.bezierCurveTo(0.58, 1.78, 0.06, 3.34, 0.72 + shift, 4.92)
    shape.lineTo(1.18 + shift, 4.62)
    shape.bezierCurveTo(0.52, 3.04, 1.04, 1.46, 0.38, 0)
    shape.bezierCurveTo(-0.26, -1.42, 0.32, -3.18, -0.2, -4.92)
    shape.closePath()
    return shape
  }, [index])
}

function PleatMass({ index }: { index: number }) {
  const shape = usePleatShape(index)
  return (
    <mesh>
      <extrudeGeometry args={[shape, PLEAT_EXTRUSION]} />
      <ArchitecturalMaterial
        body={index === 1 ? '#11191d' : '#0b1114'}
        edge={index === 1 ? '#9baab0' : '#58676d'}
        variation={0.12}
        brush={0.12}
        relief={0.036}
        side={DoubleSide}
      />
    </mesh>
  )
}

function useLockShape() {
  return useMemo(() => {
    const shape = new Shape()
    shape.moveTo(-1.12, -0.2)
    shape.lineTo(-0.62, -0.52)
    shape.lineTo(-0.06, -0.28)
    shape.lineTo(0.54, -0.48)
    shape.lineTo(1.14, -0.08)
    shape.lineTo(0.68, 0.36)
    shape.lineTo(0.08, 0.22)
    shape.lineTo(-0.56, 0.48)
    shape.lineTo(-1.18, 0.1)
    shape.closePath()
    return shape
  }, [])
}

function AlignmentTarget() {
  const carrier = useRef<Group>(null)
  const middle = useRef<Group>(null)
  const shape = useLockShape()
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)

  useFrame((_, delta) => {
    if (!carrier.current || !middle.current) return
    const error = trialRuntime.alignmentAngle - trialRuntime.alignmentTarget
    const held = trialRuntime.alignmentHold
    middle.current.position.x = MathUtils.damp(
      middle.current.position.x,
      error * 1.46 * (1 - held),
      reducedMotion ? 14 : 6,
      delta,
    )
    middle.current.rotation.z = MathUtils.damp(
      middle.current.rotation.z,
      error * 0.82 * (1 - held),
      reducedMotion ? 14 : 6,
      delta,
    )
    carrier.current.scale.setScalar(1 + held * 0.08 + trialRuntime.completion * 0.12)
  })

  return (
    <group
      ref={carrier}
      position={[1.24, 0.24, -0.62]}
      name="phase9-identity-action-pleat"
    >
      {[-1, 0, 1].map((index) => (
        <group
          key={index}
          ref={index === 0 ? middle : undefined}
          position={[index === 0 ? 0 : index * 0.12, index * 1.22, index * -0.12]}
          rotation={[0.04, index * 0.04, index * -0.05]}
        >
          <mesh scale={[index === 0 ? 1 : 0.82, 0.86, 1]}>
            <extrudeGeometry args={[shape, LOCK_EXTRUSION]} />
            <ArchitecturalMaterial
              body="#222c31"
              edge="#dfe8e9"
              variation={0.05}
              brush={0.15}
              relief={0.02}
              side={DoubleSide}
            />
          </mesh>
        </group>
      ))}
      <mesh position={[0.05, 0, 0.34]} scale={[0.16, 3.25, 1]}>
        <extrudeGeometry args={[shape, { ...LOCK_EXTRUSION, depth: 0.05 }]} />
        <ScarMaterial
          color="#7f9096"
          hot="#ffffff"
          opacity={0.78}
          growth={() => 1}
          energy={() => trialRuntime.alignmentHold}
        />
      </mesh>
    </group>
  )
}

export function RecoveryIdentityTrial() {
  const root = useRef<Group>(null)
  const nearPleat = useRef<Group>(null)
  const targetPleat = useRef<Group>(null)
  const farPleat = useRef<Group>(null)
  const axisShape = usePleatShape(1)
  const phase = useExperienceStore((state) => state.phase)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)

  useFrame((_, delta) => {
    if (!root.current || !nearPleat.current || !targetPleat.current || !farPleat.current)
      return
    const active = activeFragment === 'identity' && phase.startsWith('trial-')
    const presence = active
      ? phase === 'trial-departure'
        ? MathUtils.smootherstep(trialRuntime.passage, 0.04, 1)
        : phase === 'trial-returning'
          ? 1 - MathUtils.smootherstep(trialRuntime.returnProgress, 0.04, 0.98)
          : 1
      : 0
    root.current.visible = presence > 0.002
    if (!root.current.visible) return

    const error = trialRuntime.alignmentAngle - trialRuntime.alignmentTarget
    const fracture = MathUtils.clamp(Math.abs(error) / 0.82, 0, 1)
    const damping = reducedMotion ? 14 : 5
    root.current.position.z = MathUtils.damp(
      root.current.position.z,
      MathUtils.lerp(-1.2, -4.2, presence),
      damping,
      delta,
    )
    root.current.scale.set(
      MathUtils.lerp(0.82, 1, presence),
      MathUtils.lerp(0.7, 1, presence),
      1,
    )

    nearPleat.current.position.x = MathUtils.damp(
      nearPleat.current.position.x,
      -3.4 + fracture * 0.44,
      damping,
      delta,
    )
    nearPleat.current.rotation.y = -0.52 - fracture * 0.14
    nearPleat.current.rotation.z = -0.08 + fracture * 0.045
    targetPleat.current.position.x = MathUtils.damp(
      targetPleat.current.position.x,
      0.32 + error * 0.62 * (1 - trialRuntime.alignmentHold),
      damping,
      delta,
    )
    targetPleat.current.rotation.z =
      0.04 + error * 0.28 * (1 - trialRuntime.alignmentHold)
    farPleat.current.position.x = MathUtils.damp(
      farPleat.current.position.x,
      3.34 - fracture * 0.36,
      damping,
      delta,
    )
    farPleat.current.rotation.y = 0.46 + fracture * 0.12
    farPleat.current.rotation.z = 0.1 - fracture * 0.04
  })

  return (
    <group ref={root} position={[0, 0, -1.2]} name="phase9-identity-imposed-pleating">
      <group ref={nearPleat} position={[-3.4, -0.2, 0.8]}>
        <PleatMass index={0} />
      </group>
      <group ref={targetPleat} position={[0.32, 0.1, -1.8]} scale={[0.86, 1.08, 1]}>
        <PleatMass index={1} />
      </group>
      <group ref={farPleat} position={[3.34, 0.36, -3.4]} scale={[-0.92, 1.16, 1]}>
        <PleatMass index={2} />
      </group>
      <AlignmentTarget />
      <mesh position={[0.12, 0.2, -3.05]} scale={[0.2, 4.7, 1]}>
        <extrudeGeometry
          args={[axisShape, { ...PLEAT_EXTRUSION, depth: 0.06, bevelSize: 0.025 }]}
        />
        <MemoryShellMaterial
          body="#182126"
          depth="#030506"
          accent="#dfe8e9"
          opacity={0.22}
          distortion={0.002}
          thickness={0.9}
          energy={() => trialRuntime.alignmentHold}
          side={DoubleSide}
        />
      </mesh>
    </group>
  )
}
