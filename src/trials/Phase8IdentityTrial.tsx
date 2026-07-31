import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { DoubleSide, Group, MathUtils, Shape } from 'three'
import {
  ArchitecturalMaterial,
  EnergyFilamentMaterial,
  MemoryFieldMaterial,
  MemoryShellMaterial,
} from '../materials/MemoryMaterials'
import { useExperienceStore } from '../state/experienceStore'
import { trialRuntime } from './trialRuntime'

const MIRROR_EXTRUSION = {
  depth: 0.34,
  bevelEnabled: true,
  bevelSegments: 2,
  steps: 1,
  bevelSize: 0.05,
  bevelThickness: 0.05,
} as const

function useMirrorShape() {
  return useMemo(() => {
    const shape = new Shape()
    shape.moveTo(-0.42, -3.65)
    shape.lineTo(0.44, -3.35)
    shape.lineTo(0.3, -0.7)
    shape.lineTo(0.86, 2.65)
    shape.lineTo(0.2, 3.76)
    shape.lineTo(-0.5, 3.08)
    shape.closePath()
    return shape
  }, [])
}

function MirrorSlab({ opacity, edge }: { opacity: number; edge: string }) {
  const shape = useMirrorShape()
  return (
    <mesh>
      <extrudeGeometry args={[shape, MIRROR_EXTRUSION]} />
      <ArchitecturalMaterial
        body="#0b0e11"
        edge={edge}
        opacity={opacity}
        variation={0.035}
        brush={0.055}
        side={DoubleSide}
      />
    </mesh>
  )
}

function ReflectionEcho({ side, depth }: { side: -1 | 1; depth: number }) {
  return (
    <group
      position={[side * (2.14 + depth * 0.18), 0.18, -4.7 - depth * 1.38]}
      scale={[side * 0.54, 0.68, 0.5]}
      rotation={[0, side * -0.14, 0]}
    >
      <mesh position={[0, 1.85, 0]} scale={[0.42, 0.56, 0.38]}>
        <icosahedronGeometry args={[1, 1]} />
        <MemoryShellMaterial
          body="#343b40"
          depth="#07090a"
          accent="#d8e2e6"
          opacity={depth === 0 ? 0.22 : 0.12}
          distortion={0.004}
          thickness={0.7}
          energy={() => trialRuntime.alignmentHold}
        />
      </mesh>
      {[-1, 1].map((lobeSide) => (
        <mesh
          key={lobeSide}
          position={[lobeSide * 0.58, 0.34, 0]}
          rotation={[0, 0, lobeSide * -0.12]}
          scale={[0.58, 1.18, 0.34]}
        >
          <sphereGeometry args={[1, 24, 14]} />
          <MemoryShellMaterial
            body="#293238"
            depth="#050708"
            accent="#c8d4da"
            opacity={depth === 0 ? 0.17 : 0.09}
            distortion={0.003}
            thickness={0.64}
            energy={() => trialRuntime.alignmentHold}
          />
        </mesh>
      ))}
    </group>
  )
}

function VertebralAlignmentTarget() {
  const group = useRef<Group>(null)
  const top = useRef<Group>(null)
  const middle = useRef<Group>(null)
  const bottom = useRef<Group>(null)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)

  useFrame(({ clock }, delta) => {
    if (!group.current || !top.current || !middle.current || !bottom.current) return
    const error = trialRuntime.alignmentAngle - trialRuntime.alignmentTarget
    const convergence = 1 - MathUtils.clamp(Math.abs(error) / 0.82, 0, 1)
    const lock = Math.max(convergence * 0.78, trialRuntime.alignmentHold)
    middle.current.position.x = MathUtils.damp(
      middle.current.position.x,
      error * 1.05 * (1 - trialRuntime.alignmentHold),
      reducedMotion ? 14 : 6,
      delta,
    )
    middle.current.rotation.z = MathUtils.damp(
      middle.current.rotation.z,
      error * 0.82 * (1 - trialRuntime.alignmentHold),
      reducedMotion ? 14 : 6,
      delta,
    )
    top.current.position.x = -error * 0.12
    bottom.current.position.x = error * 0.12
    top.current.rotation.z = -error * 0.08
    bottom.current.rotation.z = error * 0.08
    group.current.scale.setScalar(1 + lock * 0.08 + trialRuntime.completion * 0.12)
    group.current.rotation.y =
      trialRuntime.completion > 0.01
        ? 0
        : reducedMotion
          ? 0
          : Math.sin(clock.elapsedTime * 0.22) * (1 - lock) * 0.04
  })

  const segment = (ref: React.RefObject<Group | null>, y: number, size: number) => (
    <group ref={ref} position={[0, y, 0]}>
      <mesh scale={[0.42, size, 0.32]} rotation={[0, Math.PI / 4, 0]}>
        <octahedronGeometry args={[1, 0]} />
        <ArchitecturalMaterial
          body="#69747a"
          edge="#f2f7f8"
          opacity={0.98}
          variation={0.018}
          brush={0.015}
        />
      </mesh>
      <mesh
        position={[0, y > 0 ? -size * 0.54 : size * 0.54, 0.08]}
        scale={[0.22, 0.025, 0.12]}
      >
        <octahedronGeometry args={[1, 0]} />
        <MemoryShellMaterial
          body="#8d9ba1"
          depth="#11171a"
          accent="#ffffff"
          opacity={0.76}
          distortion={0.004}
          thickness={0.88}
          energy={() => trialRuntime.alignmentHold}
        />
      </mesh>
    </group>
  )

  return (
    <group ref={group} position={[0, 0.08, -3.58]} name="three-part-vertebral-target">
      {segment(top, 0.92, 0.32)}
      {segment(middle, 0.02, 0.38)}
      {segment(bottom, -0.92, 0.32)}
      <mesh position={[0, 0, -0.12]} scale={[0.018, 1.32, 0.02]}>
        <capsuleGeometry args={[1, 0.5, 5, 9]} />
        <EnergyFilamentMaterial
          color="#86949b"
          hot="#ffffff"
          opacity={0.9}
          rhythm={1.6}
          energy={() => trialRuntime.alignmentHold}
        />
      </mesh>
      <pointLight
        color="#e8f1f4"
        intensity={1.4 + trialRuntime.alignmentHold * 4.2}
        distance={6}
        decay={2}
      />
    </group>
  )
}

export function Phase8IdentityTrial() {
  const root = useRef<Group>(null)
  const leftWall = useRef<Group>(null)
  const rightWall = useRef<Group>(null)
  const rear = useRef<Group>(null)
  const phase = useExperienceStore((state) => state.phase)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)

  useFrame(({ clock }, delta) => {
    if (!root.current || !leftWall.current || !rightWall.current || !rear.current) return
    const isIdentity = activeFragment === 'identity' && phase.startsWith('trial-')
    const presence = isIdentity
      ? phase === 'trial-departure'
        ? MathUtils.smootherstep(trialRuntime.passage, 0.04, 1)
        : phase === 'trial-returning'
          ? 1 - MathUtils.smootherstep(trialRuntime.returnProgress, 0.08, 0.98)
          : 1
      : 0
    root.current.visible = presence > 0.002
    if (!root.current.visible) return
    const error = Math.abs(trialRuntime.alignmentAngle - trialRuntime.alignmentTarget)
    const fracture = MathUtils.clamp(error / 0.82, 0, 1)
    const completion = trialRuntime.completion
    const wallSpread =
      2.45 - fracture * 0.2 + trialRuntime.alignmentHold * 0.24 + completion * 0.2
    leftWall.current.position.x = MathUtils.damp(
      leftWall.current.position.x,
      -wallSpread,
      reducedMotion ? 14 : 2.8,
      delta,
    )
    rightWall.current.position.x = MathUtils.damp(
      rightWall.current.position.x,
      wallSpread,
      reducedMotion ? 14 : 2.8,
      delta,
    )
    leftWall.current.rotation.z = 0.035 + fracture * 0.07
    rightWall.current.rotation.z = -0.035 - fracture * 0.07
    leftWall.current.rotation.y = -0.13 - fracture * 0.035
    rightWall.current.rotation.y = 0.13 + fracture * 0.035
    rear.current.scale.set(
      1 + trialRuntime.alignmentHold * 0.05,
      1 + completion * 0.12,
      1,
    )
    root.current.scale.setScalar(Math.max(0.001, presence))
    root.current.position.z = MathUtils.lerp(-1.1, 0, presence)
    if (!reducedMotion) {
      rear.current.position.y = Math.sin(clock.elapsedTime * 0.18) * 0.018 * fracture
    }
  })

  return (
    <group ref={root} visible={false} name="phase8-identity-imposed-symmetry">
      <group ref={rear}>
        {[-1, 1].map((side) => (
          <group key={side} scale={[side, 1, 1]}>
            {[0, 1, 2].map((depth) => (
              <group
                key={depth}
                position={[3.15 + depth * 0.32, 0.12, -4.5 - depth * 1.7]}
                rotation={[0, side * -0.1, side * 0.02]}
                scale={[0.52 - depth * 0.06, 0.9 + depth * 0.04, 0.72]}
              >
                <MirrorSlab
                  opacity={0.72 - depth * 0.12}
                  edge={depth === 0 ? '#b9c6cc' : '#657179'}
                />
              </group>
            ))}
          </group>
        ))}
      </group>
      <group ref={leftWall} position={[-2.45, 0.08, -3.72]} scale={[0.78, 1, 0.82]}>
        <MirrorSlab opacity={0.96} edge="#d2dde1" />
      </group>
      <group ref={rightWall} position={[2.45, 0.08, -3.72]} scale={[-0.78, 1, 0.82]}>
        <MirrorSlab opacity={0.96} edge="#d2dde1" />
      </group>
      <ReflectionEcho side={-1} depth={0} />
      <ReflectionEcho side={1} depth={0} />
      <ReflectionEcho side={-1} depth={1} />
      <ReflectionEcho side={1} depth={1} />
      <VertebralAlignmentTarget />
      <mesh position={[0, -2.74, -6.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6.4, 11]} />
        <ArchitecturalMaterial
          body="#07090b"
          edge="#5d696f"
          opacity={0.98}
          variation={0.035}
          brush={0.025}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.25, -9.2]} scale={[5.4, 4.3, 1]}>
        <planeGeometry />
        <MemoryFieldMaterial
          color="#090d10"
          accent="#d9e4e8"
          opacity={0.1}
          distortion={0.018}
          progress={() =>
            phase === 'trial-departure'
              ? trialRuntime.passage
              : phase === 'trial-returning'
                ? 1 - trialRuntime.returnProgress
                : trialRuntime.alignmentHold * 0.34
          }
        />
      </mesh>
    </group>
  )
}
