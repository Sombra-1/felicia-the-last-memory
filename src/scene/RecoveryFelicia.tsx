import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { DoubleSide, Group, MathUtils, Path, Shape } from 'three'
import { entranceRuntime } from '../experience/entranceRuntime'
import {
  ArchitecturalMaterial,
  MemoryShellBackMaterial,
  MemoryShellMaterial,
  ScarMaterial,
} from '../materials/MemoryMaterials'
import { reconstructionRuntime } from '../reconstruction/reconstructionRuntime'
import { type FragmentId, useExperienceStore } from '../state/experienceStore'
import { trialRuntime } from '../trials/trialRuntime'

const FOLD_EXTRUSION = {
  depth: 0.46,
  bevelEnabled: true,
  bevelSegments: 5,
  steps: 1,
  bevelSize: 0.095,
  bevelThickness: 0.085,
  curveSegments: 32,
} as const

const VANE_EXTRUSION = {
  depth: 0.24,
  bevelEnabled: true,
  bevelSegments: 3,
  steps: 1,
  bevelSize: 0.045,
  bevelThickness: 0.04,
  curveSegments: 14,
} as const

const SEAM_EXTRUSION = {
  depth: 0.06,
  bevelEnabled: true,
  bevelSegments: 2,
  steps: 1,
  bevelSize: 0.018,
  bevelThickness: 0.016,
  curveSegments: 18,
} as const

type FoldVariant = 'load' | 'counter' | 'span'

function useFoldShape(variant: FoldVariant) {
  return useMemo(() => {
    const shape = new Shape()

    if (variant === 'load') {
      shape.moveTo(-2.5, -2.72)
      shape.bezierCurveTo(-1.3, -3.28, 0.24, -2.96, 0.98, -1.78)
      shape.bezierCurveTo(1.64, -0.72, 1.24, -0.04, 0.14, 0.48)
      shape.bezierCurveTo(-0.94, 1, -1.14, 2.04, -0.42, 2.92)
      shape.bezierCurveTo(0.32, 3.82, 1.52, 3.34, 1.68, 2.26)
      shape.bezierCurveTo(0.86, 2.34, 0.24, 1.84, 0.48, 1.16)
      shape.bezierCurveTo(0.74, 0.4, 1.9, 0.04, 2.02, -1.12)
      shape.bezierCurveTo(2.14, -2.28, 0.9, -3.44, -0.44, -3.28)
      shape.bezierCurveTo(-1.26, -3.18, -1.98, -2.94, -2.5, -2.72)
    } else if (variant === 'counter') {
      shape.moveTo(-1.04, -2.36)
      shape.bezierCurveTo(-1.52, -1.06, -1.04, 0.04, -0.24, 0.68)
      shape.bezierCurveTo(0.5, 1.28, 0.34, 2.48, -0.18, 3.42)
      shape.bezierCurveTo(0.6, 3.66, 1.42, 2.98, 1.46, 1.98)
      shape.bezierCurveTo(1.5, 1.04, 0.74, 0.5, 0.52, -0.2)
      shape.bezierCurveTo(0.26, -1.04, 0.94, -1.78, 1.42, -2.42)
      shape.bezierCurveTo(0.54, -2.88, -0.28, -2.9, -1.04, -2.36)
    } else {
      shape.moveTo(-1.54, -0.38)
      shape.bezierCurveTo(-0.76, -0.76, -0.06, -0.52, 0.52, -0.02)
      shape.bezierCurveTo(1.08, 0.46, 1.56, 0.38, 1.94, -0.08)
      shape.lineTo(2.18, 0.3)
      shape.bezierCurveTo(1.46, 1.04, 0.56, 0.96, -0.08, 0.42)
      shape.bezierCurveTo(-0.72, -0.1, -1.16, 0.14, -1.72, 0.44)
      shape.closePath()
    }
    shape.closePath()

    if (variant === 'load') {
      const cleft = new Path()
      cleft.moveTo(-0.92, -2.08)
      cleft.bezierCurveTo(-0.04, -2.5, 0.94, -1.88, 1.08, -1.1)
      cleft.bezierCurveTo(1.18, -0.42, 0.28, -0.2, -0.22, 0.22)
      cleft.bezierCurveTo(-0.9, 0.8, -0.7, 1.54, -0.02, 2.12)
      cleft.bezierCurveTo(-0.78, 2.14, -1.42, 1.58, -1.42, 0.84)
      cleft.bezierCurveTo(-1.44, 0.04, -0.54, -0.44, -0.62, -1.08)
      cleft.bezierCurveTo(-0.68, -1.52, -1.18, -1.78, -0.92, -2.08)
      cleft.closePath()
      shape.holes.push(cleft)
    }

    return shape
  }, [variant])
}

function LivingFold({ variant, layer = 0 }: { variant: FoldVariant; layer?: number }) {
  const shape = useFoldShape(variant)
  const isSpan = variant === 'span'
  return (
    <>
      <mesh position={[0.03, -0.02, -0.035]}>
        <extrudeGeometry
          args={[
            shape,
            isSpan ? { ...FOLD_EXTRUSION, depth: 0.3, bevelSize: 0.06 } : FOLD_EXTRUSION,
          ]}
        />
        <MemoryShellBackMaterial
          body="#0a1011"
          depth="#020405"
          accent="#566267"
          opacity={isSpan ? 0.62 : 0.7}
          distortion={0.008}
          thickness={1}
          energy={() =>
            Math.max(
              entranceRuntime.core,
              trialRuntime.beatEnergy,
              trialRuntime.syncVisual,
            )
          }
        />
      </mesh>
      <mesh position={[0, 0, 0.02 + layer * 0.025]}>
        <extrudeGeometry
          args={[
            shape,
            isSpan ? { ...FOLD_EXTRUSION, depth: 0.3, bevelSize: 0.06 } : FOLD_EXTRUSION,
          ]}
        />
        <MemoryShellMaterial
          body={isSpan ? '#232c2e' : '#293130'}
          depth="#020506"
          accent={isSpan ? '#8f9b99' : '#a8aea7'}
          opacity={isSpan ? 0.68 : 0.78}
          distortion={isSpan ? 0.006 : 0.012}
          layer={layer}
          thickness={1}
          side={DoubleSide}
          energy={() =>
            Math.max(
              entranceRuntime.core,
              trialRuntime.inputEnergy,
              trialRuntime.syncVisual,
            )
          }
        />
      </mesh>
    </>
  )
}

function useVaneShape() {
  return useMemo(() => {
    const shape = new Shape()
    shape.moveTo(-1.08, -0.08)
    shape.lineTo(-0.56, -0.24)
    shape.lineTo(0.12, -0.14)
    shape.lineTo(0.88, -0.3)
    shape.lineTo(1.12, -0.04)
    shape.lineTo(0.72, 0.18)
    shape.lineTo(0.02, 0.12)
    shape.lineTo(-0.62, 0.26)
    shape.lineTo(-1.12, 0.08)
    shape.closePath()
    return shape
  }, [])
}

function TensionVanes() {
  const shape = useVaneShape()
  const transforms = [
    [0.72, -1.58, 0.5, 1, 0.62],
    [1.04, -0.22, 0.62, 0.86, 0.7],
    [0.34, 1.32, 0.52, 1.12, 0.6],
  ] as const

  return (
    <>
      {transforms.map(([x, y, z, rotation, scale], index) => (
        <mesh
          key={index}
          position={[x, y, z]}
          rotation={[0.06 * index, -0.14 + index * 0.05, rotation]}
          scale={[scale, 0.52 + index * 0.035, 1]}
        >
          <extrudeGeometry args={[shape, VANE_EXTRUSION]} />
          <ArchitecturalMaterial
            body="#1b2225"
            edge="#8e9ba1"
            variation={0.08}
            brush={0.13}
            relief={0.024}
            side={DoubleSide}
          />
        </mesh>
      ))}
    </>
  )
}

function useSeamShape(fragment: FragmentId) {
  return useMemo(() => {
    const shape = new Shape()
    if (fragment === 'identity') {
      shape.moveTo(-0.2, -2.46)
      shape.bezierCurveTo(0.12, -1.56, -0.16, -0.54, 0.2, 0.34)
      shape.bezierCurveTo(0.46, 1.08, 0.12, 1.88, 0.36, 2.48)
      shape.lineTo(0.12, 2.62)
      shape.bezierCurveTo(-0.18, 1.78, 0.12, 1.02, -0.18, 0.26)
      shape.bezierCurveTo(-0.46, -0.58, -0.12, -1.56, -0.42, -2.38)
    } else if (fragment === 'fear') {
      shape.moveTo(-1.46, -0.22)
      shape.lineTo(-0.72, -0.52)
      shape.lineTo(-0.08, -0.16)
      shape.lineTo(0.58, -0.46)
      shape.lineTo(1.44, -0.04)
      shape.lineTo(0.64, 0.42)
      shape.lineTo(-0.04, 0.12)
      shape.lineTo(-0.74, 0.48)
      shape.closePath()
      return shape
    } else {
      shape.moveTo(-0.44, -2.28)
      shape.bezierCurveTo(0.12, -1.54, -0.08, -0.62, 0.44, 0.02)
      shape.bezierCurveTo(0.92, 0.64, 0.68, 1.44, 1.18, 2.42)
      shape.lineTo(0.88, 2.58)
      shape.bezierCurveTo(0.32, 1.56, 0.56, 0.74, 0.08, 0.12)
      shape.bezierCurveTo(-0.42, -0.5, -0.16, -1.4, -0.7, -2.12)
    }
    shape.closePath()
    return shape
  }, [fragment])
}

function MemorySeam({
  fragment,
  growth,
}: {
  fragment: FragmentId
  growth: () => number
}) {
  const shape = useSeamShape(fragment)
  const colors =
    fragment === 'identity'
      ? ['#76858c', '#e4ecec']
      : fragment === 'fear'
        ? ['#432a49', '#a86dab']
        : ['#8f632f', '#e8b963']

  return (
    <mesh>
      <extrudeGeometry args={[shape, SEAM_EXTRUSION]} />
      <ScarMaterial
        color={colors[0]}
        hot={colors[1]}
        opacity={fragment === 'fear' ? 0.78 : 0.7}
        growth={growth}
        energy={() => Math.max(trialRuntime.beatEnergy, trialRuntime.syncVisual)}
      />
    </mesh>
  )
}

function orderWeight(order: FragmentId[], fragment: FragmentId) {
  const index = order.indexOf(fragment)
  return index < 0 ? 0 : [0.6, 0.25, 0.15][index]
}

export function RecoveryFelicia() {
  const root = useRef<Group>(null)
  const loadFold = useRef<Group>(null)
  const counterFold = useRef<Group>(null)
  const span = useRef<Group>(null)
  const vanes = useRef<Group>(null)
  const identitySeam = useRef<Group>(null)
  const fearSeam = useRef<Group>(null)
  const hopeSeam = useRef<Group>(null)
  const phase = useExperienceStore((state) => state.phase)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const collected = useExperienceStore((state) => state.collectedFragments)
  const collectionOrder = useExperienceStore((state) => state.collectionOrder)

  useFrame((_, delta) => {
    if (
      !root.current ||
      !loadFold.current ||
      !counterFold.current ||
      !span.current ||
      !vanes.current ||
      !identitySeam.current ||
      !fearSeam.current ||
      !hopeSeam.current
    )
      return

    const trialProgress =
      activeFragment && phase.startsWith('trial-')
        ? phase === 'trial-returning'
          ? 1 - MathUtils.smootherstep(trialRuntime.returnProgress, 0.03, 1)
          : MathUtils.smootherstep(
              trialRuntime.departure * 0.4 + trialRuntime.passage * 0.6,
              0,
              1,
            )
        : 0
    const identityTrial = activeFragment === 'identity' ? trialProgress : 0
    const fearTrial = activeFragment === 'fear' ? trialProgress : 0
    const hopeTrial = activeFragment === 'hope' ? trialProgress : 0
    const reconstructing = phase.startsWith('reconstruction-') || phase === 'ending'
    const rebuilt =
      phase === 'ending' || phase === 'reconstruction-reveal'
        ? 1
        : phase === 'reconstruction-rebuilding'
          ? reconstructionRuntime.rebuild
          : 0
    const collapse = reconstructing ? reconstructionRuntime.collapse : 0
    const sync = phase === 'reconstruction-synchronizing' ? trialRuntime.syncVisual : 0
    const instability =
      phase === 'reconstruction-synchronizing' ? trialRuntime.syncInstability : 0
    const identityLaw = orderWeight(collectionOrder, 'identity') * rebuilt
    const fearLaw = orderWeight(collectionOrder, 'fear') * rebuilt
    const hopeLaw = orderWeight(collectionOrder, 'hope') * rebuilt
    const foundation = collectionOrder[0]
    const identityProfile = foundation === 'identity' ? rebuilt : identityLaw
    const fearProfile = foundation === 'fear' ? rebuilt : fearLaw
    const hopeProfile = foundation === 'hope' ? rebuilt : hopeLaw
    const entrance = MathUtils.smootherstep(entranceRuntime.core, 0.02, 1)
    const trialScale = MathUtils.lerp(1, 0.68, trialProgress)
    const trialOffsetX =
      activeFragment === 'identity' ? -1.8 : activeFragment === 'fear' ? -1.4 : -1.95

    root.current.scale.set(
      MathUtils.lerp(0.78, 1, entrance) *
        (1 - identityProfile * 0.38 + fearProfile * 0.42 - hopeProfile * 0.08) *
        trialScale,
      MathUtils.lerp(0.82, 1, entrance) *
        (1 + identityProfile * 0.42 - fearProfile * 0.28 + hopeProfile * 0.35) *
        trialScale,
      MathUtils.lerp(0.84, 1, entrance) * trialScale,
    )
    root.current.position.set(
      MathUtils.lerp(
        -0.28 - identityLaw * 0.12 - fearLaw * 0.34 + hopeLaw * 0.24,
        trialOffsetX,
        trialProgress,
      ),
      -0.04 - fearLaw * 0.34 + hopeLaw * 0.4 + collapse * 0.2,
      MathUtils.lerp(-0.24 - sync * 0.42 + collapse * 0.6, -3.28, trialProgress),
    )
    root.current.rotation.set(
      -0.04 + hopeTrial * 0.08,
      -0.22 + identityTrial * 0.26 + collapse * 0.9 + rebuilt * -0.35,
      -0.42 -
        fearTrial * 0.18 +
        hopeTrial * 0.12 +
        identityProfile * 0.38 -
        fearProfile * 0.08 +
        hopeProfile * 0.18 +
        (foundation === 'fear' ? -0.24 * rebuilt : 0) +
        (foundation === 'hope' ? 0.08 * rebuilt : 0),
    )

    loadFold.current.position.set(
      -0.48 - identityTrial * 0.18 - fearTrial * 0.44 - hopeTrial * 0.22,
      -0.14 - fearTrial * 0.22 - hopeTrial * 0.18,
      0,
    )
    loadFold.current.rotation.set(
      0.02,
      -0.12 + identityTrial * 0.1 + fearTrial * 0.18,
      -0.18 +
        identityTrial * 0.32 -
        fearTrial * 0.24 -
        hopeTrial * 0.08 +
        identityLaw * 0.26 -
        fearLaw * 0.34 -
        hopeLaw * 0.14 +
        instability * 0.035,
    )
    loadFold.current.scale.set(
      1 - identityTrial * 0.14 + fearTrial * 0.18 - hopeTrial * 0.04,
      1 + identityTrial * 0.08 - fearTrial * 0.08 + hopeTrial * 0.14,
      1,
    )

    counterFold.current.position.set(
      0.68 + identityTrial * 0.08 + fearTrial * 0.46 + hopeTrial * 0.9,
      0.28 + identityTrial * 0.18 - fearTrial * 0.42 + hopeTrial * 0.82,
      -0.48 + identityTrial * 0.22 - fearTrial * 0.08 + hopeTrial * 0.18,
    )
    counterFold.current.rotation.set(
      -0.05,
      0.18 - identityTrial * 0.12 - fearTrial * 0.2 + hopeTrial * 0.16,
      0.28 -
        identityTrial * 0.36 -
        fearTrial * 0.3 +
        hopeTrial * 0.34 -
        identityLaw * 0.3 -
        fearLaw * 0.36 +
        hopeLaw * 0.46 -
        instability * 0.04,
    )
    counterFold.current.scale.set(
      0.88 - identityTrial * 0.12 + fearTrial * 0.16 + hopeTrial * 0.05,
      0.92 + identityTrial * 0.12 - fearTrial * 0.1 + hopeTrial * 0.34,
      1,
    )

    const recoveredSpan = collected.length / 3
    span.current.position.set(
      -0.02 + fearTrial * 0.18 + hopeTrial * 0.22,
      0.34 - fearTrial * 0.16 + hopeTrial * 0.2,
      0.42,
    )
    span.current.rotation.z =
      -0.12 + identityTrial * 0.12 - fearTrial * 0.34 + hopeTrial * 0.26
    span.current.scale.set(
      Math.max(
        0.08,
        recoveredSpan * 0.72 +
          trialRuntime.completion * 0.28 +
          sync * 0.18 +
          rebuilt * 0.42,
      ),
      0.68 + identityLaw * 0.42 + fearLaw * 0.2 + hopeLaw * 0.64 + sync * 0.12,
      1,
    )

    vanes.current.position.set(
      -0.08 + fearTrial * 0.12 + hopeTrial * 0.1,
      -0.16 - fearTrial * 0.1 + hopeTrial * 0.18,
      0.34,
    )
    vanes.current.rotation.z =
      -0.08 +
      identityTrial * 0.08 -
      fearTrial * 0.18 +
      hopeTrial * 0.12 +
      identityLaw * 0.08 -
      fearLaw * 0.18 +
      hopeLaw * 0.14 +
      instability * 0.065
    vanes.current.scale.set(
      0.92 - identityTrial * 0.08 + fearTrial * 0.12,
      0.94 + identityTrial * 0.14 - fearTrial * 0.08 + hopeTrial * 0.16,
      1,
    )

    const reconstructionExposure = collapse * 0.82 + sync * 0.32
    loadFold.current.position.x -= reconstructionExposure * 0.48
    counterFold.current.position.x += reconstructionExposure * 0.62
    loadFold.current.rotation.y -= reconstructionExposure * 0.24
    counterFold.current.rotation.y += reconstructionExposure * 0.3

    if (foundation === 'identity') {
      loadFold.current.position.x += identityProfile * 0.68
      counterFold.current.position.x -= identityProfile * 0.64
      loadFold.current.rotation.z += identityProfile * 0.34
      counterFold.current.rotation.z -= identityProfile * 0.42
    } else if (foundation === 'fear') {
      loadFold.current.position.x -= fearProfile * 1.1
      counterFold.current.position.x += fearProfile * 0.92
      counterFold.current.position.y -= fearProfile * 0.68
      counterFold.current.rotation.z -= fearProfile * 0.48
    } else if (foundation === 'hope') {
      loadFold.current.position.x -= hopeProfile * 0.72
      counterFold.current.position.x += hopeProfile * 2.16
      counterFold.current.position.y += hopeProfile * 2.34
      counterFold.current.rotation.z += hopeProfile * 0.54
    }

    const settle = 5.2
    identitySeam.current.scale.x = MathUtils.damp(
      identitySeam.current.scale.x,
      collected.includes('identity') || activeFragment === 'identity' ? 1 : 0.001,
      settle,
      delta,
    )
    fearSeam.current.scale.x = MathUtils.damp(
      fearSeam.current.scale.x,
      collected.includes('fear') || activeFragment === 'fear' ? 1 : 0.001,
      settle,
      delta,
    )
    hopeSeam.current.scale.x = MathUtils.damp(
      hopeSeam.current.scale.x,
      collected.includes('hope') || activeFragment === 'hope' ? 1 : 0.001,
      settle,
      delta,
    )
  })

  const memoryGrowth = (fragment: FragmentId) => () =>
    collected.includes(fragment)
      ? 1
      : activeFragment === fragment
        ? Math.max(trialRuntime.beatEnergy, trialRuntime.completion)
        : 0

  return (
    <group
      ref={root}
      name="phase9-felicia-unresolved-fold"
      position={[-0.28, -0.04, -0.24]}
      rotation={[-0.04, -0.22, -0.42]}
    >
      <group ref={loadFold} position={[-0.48, -0.14, 0]} rotation={[0.02, -0.12, -0.18]}>
        <LivingFold variant="load" />
      </group>
      <group
        ref={counterFold}
        position={[0.68, 0.28, -0.48]}
        rotation={[-0.05, 0.18, 0.28]}
        scale={[0.88, 0.92, 1]}
      >
        <LivingFold variant="counter" layer={0.5} />
      </group>
      <group ref={span} position={[-0.02, 0.34, 0.42]} rotation={[0, 0, -0.12]}>
        <LivingFold variant="span" layer={0.8} />
      </group>
      <group ref={vanes}>
        <TensionVanes />
      </group>
      <group ref={identitySeam} position={[-0.74, 0.06, 0.76]} rotation={[0, 0, -0.08]}>
        <MemorySeam fragment="identity" growth={memoryGrowth('identity')} />
      </group>
      <group ref={fearSeam} position={[-0.3, 0.1, 0.82]} rotation={[0, 0, -0.22]}>
        <MemorySeam fragment="fear" growth={memoryGrowth('fear')} />
      </group>
      <group ref={hopeSeam} position={[0.2, 0.22, 0.74]} rotation={[0, 0, 0.18]}>
        <MemorySeam fragment="hope" growth={memoryGrowth('hope')} />
      </group>
    </group>
  )
}
