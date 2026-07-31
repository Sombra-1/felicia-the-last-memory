import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { DoubleSide, Group, MathUtils, Shape } from 'three'
import {
  ArchitecturalMaterial,
  MemoryShellMaterial,
  ScarMaterial,
} from '../materials/MemoryMaterials'
import type { FragmentId } from '../state/experienceStore'
import { trialRuntime } from '../trials/trialRuntime'

const SITE_EXTRUSION = {
  depth: 0.18,
  bevelEnabled: true,
  bevelSegments: 3,
  steps: 1,
  bevelSize: 0.04,
  bevelThickness: 0.036,
  curveSegments: 16,
} as const

function useStressShape(fragment: FragmentId) {
  return useMemo(() => {
    const shape = new Shape()
    if (fragment === 'identity') {
      shape.moveTo(-0.72, -0.42)
      shape.lineTo(-0.3, -0.64)
      shape.lineTo(0.18, -0.46)
      shape.lineTo(0.68, -0.56)
      shape.lineTo(0.82, -0.12)
      shape.lineTo(0.42, 0.18)
      shape.lineTo(-0.06, 0.1)
      shape.lineTo(-0.5, 0.46)
      shape.lineTo(-0.86, 0.18)
    } else if (fragment === 'fear') {
      shape.moveTo(-0.8, -0.18)
      shape.bezierCurveTo(-0.58, -0.72, 0.14, -0.86, 0.72, -0.34)
      shape.lineTo(0.44, -0.02)
      shape.lineTo(0.76, 0.3)
      shape.bezierCurveTo(0.08, 0.72, -0.66, 0.54, -0.8, -0.18)
    } else {
      shape.moveTo(-0.68, -0.48)
      shape.bezierCurveTo(-0.04, -0.74, 0.66, -0.42, 0.78, 0.14)
      shape.bezierCurveTo(0.3, 0.02, -0.02, 0.24, -0.2, 0.68)
      shape.bezierCurveTo(-0.72, 0.36, -0.92, -0.08, -0.68, -0.48)
    }
    shape.closePath()
    return shape
  }, [fragment])
}

function useInsetShape(fragment: FragmentId) {
  return useMemo(() => {
    const shape = new Shape()
    if (fragment === 'fear') {
      shape.moveTo(-0.52, -0.04)
      shape.lineTo(-0.14, -0.3)
      shape.lineTo(0.12, -0.04)
      shape.lineTo(0.5, -0.22)
      shape.lineTo(0.26, 0.18)
      shape.lineTo(-0.08, 0)
      shape.lineTo(-0.38, 0.3)
    } else {
      shape.moveTo(-0.12, -0.58)
      shape.bezierCurveTo(0.18, -0.18, -0.18, 0.18, 0.18, 0.58)
      shape.lineTo(-0.04, 0.7)
      shape.bezierCurveTo(-0.44, 0.2, -0.1, -0.22, -0.4, -0.52)
    }
    shape.closePath()
    return shape
  }, [fragment])
}

function StressSite({ fragment }: { fragment: FragmentId }) {
  const shape = useStressShape(fragment)
  const inset = useInsetShape(fragment)
  const colors =
    fragment === 'identity'
      ? ['#1a2428', '#aebbc0']
      : fragment === 'fear'
        ? ['#211923', '#86578b']
        : ['#272218', '#c4934d']

  return (
    <group>
      <mesh scale={[1, 0.58, 1]}>
        <extrudeGeometry args={[shape, SITE_EXTRUSION]} />
        {fragment === 'fear' ? (
          <MemoryShellMaterial
            body={colors[0]}
            depth="#030506"
            accent={colors[1]}
            opacity={0.58}
            distortion={0.012}
            thickness={0.96}
            side={DoubleSide}
            energy={() => Math.max(0.16, trialRuntime.inputEnergy)}
          />
        ) : (
          <ArchitecturalMaterial
            body={colors[0]}
            edge={colors[1]}
            variation={0.08}
            brush={0.12}
            relief={0.024}
            side={DoubleSide}
          />
        )}
      </mesh>
      <mesh
        position={[0, 0, 0.28]}
        scale={fragment === 'hope' ? [0.48, 0.62, 1] : [0.5, 0.44, 1]}
      >
        <extrudeGeometry args={[inset, { ...SITE_EXTRUSION, depth: 0.05 }]} />
        <ScarMaterial
          color={colors[1]}
          hot={fragment === 'hope' ? '#edc178' : '#edf2ef'}
          opacity={0.66}
          growth={() => 1}
          energy={() => Math.max(0.16, trialRuntime.inputEnergy)}
        />
      </mesh>
    </group>
  )
}

export function RecoveryMemoryOrgan({
  fragment,
  hovered,
  active,
}: {
  fragment: FragmentId
  hovered: boolean
  active: boolean
}) {
  const root = useRef<Group>(null)

  useFrame((_, delta) => {
    if (!root.current) return
    const emphasis = active ? 1 : hovered ? 0.55 : 0
    root.current.position.z = MathUtils.damp(
      root.current.position.z,
      emphasis * 0.18,
      6,
      delta,
    )
    root.current.scale.setScalar(
      MathUtils.damp(root.current.scale.x, 0.32 + emphasis * 0.06, 6, delta),
    )
    root.current.rotation.z = MathUtils.damp(
      root.current.rotation.z,
      active ? -0.06 : 0,
      5,
      delta,
    )
  })

  return (
    <group ref={root} scale={0.32} name={`phase9-${fragment}-embedded-stress-site`}>
      <StressSite fragment={fragment} />
    </group>
  )
}
