import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { DoubleSide, Group, MathUtils, Path, Shape } from 'three'
import { entranceRuntime } from '../experience/entranceRuntime'
import { ArchitecturalMaterial, MemoryShellMaterial } from '../materials/MemoryMaterials'
import { reconstructionRuntime } from '../reconstruction/reconstructionRuntime'
import { type FragmentId, useExperienceStore } from '../state/experienceStore'
import { trialRuntime } from '../trials/trialRuntime'

const LAMINA_EXTRUSION = {
  depth: 0.78,
  bevelEnabled: true,
  bevelSegments: 4,
  steps: 1,
  bevelSize: 0.14,
  bevelThickness: 0.12,
  curveSegments: 28,
} as const

const CREASE_EXTRUSION = {
  depth: 0.16,
  bevelEnabled: true,
  bevelSegments: 3,
  steps: 1,
  bevelSize: 0.045,
  bevelThickness: 0.04,
  curveSegments: 22,
} as const

type LaminaVariant = 'overhang' | 'fault' | 'distance' | 'ground'

function useLaminaShape(variant: LaminaVariant) {
  return useMemo(() => {
    const shape = new Shape()

    if (variant === 'ground') {
      shape.moveTo(-5.8, -5.2)
      shape.bezierCurveTo(-2.6, -5.72, 1.5, -5.42, 6.8, -4.1)
      shape.lineTo(5.4, 4.7)
      shape.bezierCurveTo(1.6, 4.15, -2.4, 4.72, -6.6, 3.2)
      shape.closePath()
      return shape
    }

    if (variant === 'overhang') {
      shape.moveTo(-1.52, -5.1)
      shape.bezierCurveTo(-0.86, -3.42, -1.28, -1.36, -0.38, 0.24)
      shape.bezierCurveTo(0.52, 1.86, 1.44, 3.7, 0.48, 5.26)
      shape.bezierCurveTo(-0.42, 5.74, -1.32, 4.34, -1.12, 2.92)
      shape.bezierCurveTo(-0.86, 1.3, -1.78, -0.08, -1.22, -1.82)
      shape.lineTo(-2.04, -4.62)
    } else if (variant === 'fault') {
      shape.moveTo(-1.86, -5.28)
      shape.lineTo(0.26, -4.78)
      shape.bezierCurveTo(1.12, -3.2, 0.24, -1.24, 1.02, 0.42)
      shape.bezierCurveTo(1.62, 1.74, 0.58, 3.1, 1.12, 4.7)
      shape.lineTo(0.12, 5.42)
      shape.bezierCurveTo(-0.84, 3.82, -0.24, 2.08, -1.16, 0.7)
      shape.bezierCurveTo(-2.02, -0.64, -1.12, -2.54, -2.28, -3.72)
    } else {
      shape.moveTo(-1.28, -5.44)
      shape.bezierCurveTo(-0.42, -3.62, -1.04, -1.62, -0.08, 0.04)
      shape.bezierCurveTo(0.92, 1.78, 0.48, 3.84, 1.38, 5.46)
      shape.lineTo(0.34, 5.82)
      shape.bezierCurveTo(-0.62, 4.12, -0.18, 2.16, -1.16, 0.56)
      shape.bezierCurveTo(-2.06, -0.96, -1.22, -2.86, -2.02, -4.62)
    }
    shape.closePath()

    const seam = new Path()
    seam.moveTo(-0.7, -4.1)
    seam.bezierCurveTo(-0.08, -2.42, -0.7, -0.54, -0.02, 1.02)
    seam.bezierCurveTo(0.52, 2.34, 0.04, 3.68, 0.48, 4.62)
    seam.lineTo(0.18, 4.8)
    seam.bezierCurveTo(-0.42, 3.48, 0.02, 2.12, -0.58, 0.78)
    seam.bezierCurveTo(-1.18, -0.58, -0.52, -2.46, -1.02, -3.92)
    seam.closePath()
    shape.holes.push(seam)
    return shape
  }, [variant])
}

function LaminaMass({
  variant,
  body = '#080c0e',
  edge = '#46535a',
}: {
  variant: LaminaVariant
  body?: string
  edge?: string
}) {
  const shape = useLaminaShape(variant)
  return (
    <mesh>
      <extrudeGeometry args={[shape, LAMINA_EXTRUSION]} />
      <ArchitecturalMaterial
        body={body}
        edge={edge}
        variation={0.15}
        brush={0.075}
        relief={0.042}
        side={DoubleSide}
      />
    </mesh>
  )
}

function useCreaseShape() {
  return useMemo(() => {
    const shape = new Shape()
    shape.moveTo(-0.42, -4.8)
    shape.bezierCurveTo(0.34, -3.02, -0.62, -1.34, 0.28, 0.16)
    shape.bezierCurveTo(1.02, 1.42, -0.12, 3.22, 0.62, 4.86)
    shape.lineTo(0.22, 5.12)
    shape.bezierCurveTo(-0.56, 3.32, 0.46, 1.64, -0.38, 0.12)
    shape.bezierCurveTo(-1.16, -1.3, -0.18, -3.06, -0.82, -4.72)
    shape.closePath()
    return shape
  }, [])
}

function PropagationCrease({ fragment }: { fragment: FragmentId | null }) {
  const shape = useCreaseShape()
  const palette =
    fragment === 'fear'
      ? ['#261b28', '#8a5a91']
      : fragment === 'hope'
        ? ['#2b251b', '#d4a65e']
        : ['#182126', '#aab8bd']

  return (
    <mesh>
      <extrudeGeometry args={[shape, CREASE_EXTRUSION]} />
      <MemoryShellMaterial
        body={palette[0]}
        depth="#030506"
        accent={palette[1]}
        opacity={0.58}
        distortion={fragment === 'fear' ? 0.02 : 0.012}
        thickness={0.92}
        energy={() => Math.max(trialRuntime.departure, trialRuntime.passage)}
        side={DoubleSide}
      />
    </mesh>
  )
}

function influence(order: FragmentId[], fragment: FragmentId) {
  const index = order.indexOf(fragment)
  return index < 0 ? 0 : [0.6, 0.25, 0.15][index]
}

export function RecoveryCathedral() {
  const root = useRef<Group>(null)
  const foreground = useRef<Group>(null)
  const right = useRef<Group>(null)
  const rear = useRef<Group>(null)
  const horizon = useRef<Group>(null)
  const ground = useRef<Group>(null)
  const crease = useRef<Group>(null)
  const phase = useExperienceStore((state) => state.phase)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const collectionOrder = useExperienceStore((state) => state.collectionOrder)

  useFrame((_, delta) => {
    if (
      !root.current ||
      !foreground.current ||
      !right.current ||
      !rear.current ||
      !horizon.current ||
      !ground.current ||
      !crease.current
    )
      return

    const trialProgress =
      activeFragment && phase.startsWith('trial-')
        ? phase === 'trial-returning'
          ? 1 - MathUtils.smootherstep(trialRuntime.returnProgress, 0.02, 1)
          : MathUtils.smootherstep(
              trialRuntime.departure * 0.38 + trialRuntime.passage * 0.62,
              0,
              1,
            )
        : 0
    const identity = activeFragment === 'identity' ? trialProgress : 0
    const fear = activeFragment === 'fear' ? trialProgress : 0
    const hope = activeFragment === 'hope' ? trialProgress : 0
    const reconstruction =
      phase === 'ending' || phase === 'reconstruction-reveal'
        ? 1
        : phase === 'reconstruction-rebuilding'
          ? reconstructionRuntime.rebuild
          : phase.startsWith('reconstruction-')
            ? trialRuntime.syncVisual * 0.22
            : 0
    const identityLaw = influence(collectionOrder, 'identity') * reconstruction
    const fearLaw = influence(collectionOrder, 'fear') * reconstruction
    const hopeLaw = influence(collectionOrder, 'hope') * reconstruction
    const foundation = collectionOrder[0]
    const inversion = MathUtils.smootherstep(reconstruction, 0.04, 0.95)
    const entrance = MathUtils.smootherstep(entranceRuntime.architecture, 0.02, 1)

    root.current.scale.y = MathUtils.damp(
      root.current.scale.y,
      MathUtils.lerp(0.74, 1, entrance),
      3.8,
      delta,
    )
    root.current.position.y = MathUtils.damp(
      root.current.position.y,
      MathUtils.lerp(-0.78, 0, entrance),
      3.8,
      delta,
    )

    foreground.current.position.set(
      -5.28 + identity * 1.82 + fear * 1.1 - hope * 0.72 + identityLaw * 0.46,
      -0.72 - fear * 0.34 + hope * 0.62 - fearLaw * 0.58 + hopeLaw * 0.82,
      1.2 - identity * 2.6 - fear * 1.38 - hope * 1.94 - reconstruction * 0.72,
    )
    foreground.current.rotation.y =
      0.58 - identity * 0.82 - fear * 0.36 + hope * 0.24 - identityLaw * 0.28
    foreground.current.rotation.z =
      -0.16 + identity * 0.08 - fear * 0.18 + hope * 0.22 - fearLaw * 0.24
    foreground.current.scale.set(
      1.08 - fear * 0.06 + hope * 0.12,
      1.32 - identity * 0.08 + fear * 0.14 + hope * 0.24,
      1 + identity * 2.8 + fear * 1.45 + hope * 2.05,
    )

    right.current.position.set(
      5.46 - identity * 2.08 - fear * 1.34 + hope * 1.26 - fearLaw * 0.92,
      0.38 - fear * 0.18 + hope * 0.86 - fearLaw * 0.42 + hopeLaw * 1.06,
      -1.18 - identity * 2.9 - fear * 1.9 - hope * 2.46 - reconstruction * 0.9,
    )
    right.current.rotation.y =
      -0.42 + identity * 0.88 + fear * 0.46 - hope * 0.3 + fearLaw * 0.34
    right.current.rotation.z =
      0.08 + fear * 0.2 - hope * 0.18 + fearLaw * 0.26 - hopeLaw * 0.16
    right.current.scale.set(
      1.18 + fear * 0.08 + hope * 0.12,
      1.24 - identity * 0.06 + fear * 0.1 + hope * 0.28,
      1 + identity * 3.1 + fear * 1.72 + hope * 2.42,
    )

    rear.current.position.set(
      0.86 + identity * 0.24 - fear * 0.34 + hope * 0.48,
      0.72 - fear * 0.62 + hope * 1.42 - fearLaw * 0.58 + hopeLaw * 1.62,
      -7.8 - identity * 3.2 - fear * 2.2 - hope * 4.1 - reconstruction * 2.4,
    )
    rear.current.rotation.z =
      -0.1 + identity * 0.1 - fear * 0.16 + hope * 0.24 + hopeLaw * 0.18
    rear.current.scale.set(
      2.72 - identity * 0.62 - fear * 0.74 + hope * 0.54,
      1.54 - fear * 0.18 + hope * 0.42 - fearLaw * 0.16 + hopeLaw * 0.34,
      1 + identity * 1.2 + fear * 0.72 + hope * 1.56,
    )

    horizon.current.position.y =
      -1.28 - fear * 0.5 + hope * 1.52 - fearLaw * 0.34 + hopeLaw * 1.48
    horizon.current.position.z = -12.4 - hope * 2.6 - reconstruction * 3.8
    horizon.current.rotation.z = 0.18 - identity * 0.12 + fear * 0.2 - hope * 0.32
    horizon.current.scale.set(
      3.8 - fear * 0.7 + hope * 1.2,
      1.12 - fear * 0.22 + hope * 0.52,
      1,
    )

    ground.current.scale.set(
      (1 - fear * 0.12 + hope * 0.2) *
        MathUtils.lerp(1, foundation === 'identity' ? 0.62 : 1.08, inversion),
      (1 + identity * 1.36 + fear * 0.92 + hope * 1.54) *
        MathUtils.lerp(
          1,
          foundation === 'hope' ? 1.32 : foundation === 'fear' ? 0.74 : 1.08,
          inversion,
        ),
      1,
    )
    ground.current.position.y = MathUtils.lerp(
      -3.02,
      foundation === 'hope' ? 0.84 : foundation === 'fear' ? -0.64 : 0.18,
      inversion,
    )
    ground.current.position.z = MathUtils.lerp(
      -0.8 - identity * 2.1 - fear * 1.5 - hope * 2.7,
      -8.2,
      inversion,
    )
    ground.current.rotation.x = MathUtils.lerp(
      -Math.PI / 2,
      foundation === 'fear' ? -0.36 : foundation === 'hope' ? 0.18 : -0.04,
      inversion,
    )
    ground.current.rotation.z =
      -0.04 -
      fear * 0.06 +
      hope * 0.08 +
      inversion * (foundation === 'fear' ? -0.34 : foundation === 'hope' ? 0.26 : 0)

    crease.current.visible = trialProgress > 0.002
    crease.current.position.set(
      MathUtils.lerp(
        activeFragment === 'identity' ? -1.35 : activeFragment === 'fear' ? 2.2 : 0.5,
        activeFragment === 'fear' ? -0.7 : activeFragment === 'hope' ? 0.8 : 0,
        trialProgress,
      ),
      MathUtils.lerp(
        activeFragment === 'hope' ? -1.8 : 0.2,
        activeFragment === 'hope' ? 1.3 : 0.1,
        trialProgress,
      ),
      MathUtils.lerp(0.6, -5.6, trialProgress),
    )
    crease.current.rotation.z = MathUtils.lerp(
      activeFragment === 'fear' ? 0.68 : activeFragment === 'hope' ? -0.58 : -0.28,
      activeFragment === 'hope' ? 0.18 : 0,
      trialProgress,
    )
    crease.current.scale.set(
      Math.max(0.001, trialProgress * (activeFragment === 'fear' ? 0.92 : 0.68)),
      MathUtils.lerp(0.08, activeFragment === 'hope' ? 1.46 : 1, trialProgress),
      1,
    )
  })

  return (
    <group ref={root} name="phase9-continuous-memory-field">
      <group ref={foreground} position={[-5.28, -0.72, 1.2]}>
        <LaminaMass variant="overhang" edge="#536169" />
      </group>
      <group ref={right} position={[5.46, 0.38, -1.18]} scale={[-1.18, 1.24, 1]}>
        <LaminaMass variant="fault" edge="#4c5960" />
      </group>
      <group ref={rear} position={[0.86, 0.72, -7.8]} scale={[2.72, 1.54, 1]}>
        <LaminaMass variant="distance" body="#06090b" edge="#303a40" />
      </group>
      <group ref={horizon} position={[-1.2, -1.28, -12.4]} scale={[3.8, 1.12, 1]}>
        <LaminaMass variant="fault" body="#050708" edge="#222b30" />
      </group>
      <group
        ref={ground}
        position={[0.2, -3.02, -0.8]}
        rotation={[-Math.PI / 2, 0, -0.04]}
      >
        <LaminaMass variant="ground" body="#070a0c" edge="#323c42" />
      </group>
      <group ref={crease} visible={false}>
        <PropagationCrease fragment={activeFragment} />
      </group>
    </group>
  )
}
