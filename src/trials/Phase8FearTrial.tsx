import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { CatmullRomCurve3, DoubleSide, Group, MathUtils, Shape, Vector3 } from 'three'
import {
  ArchitecturalMaterial,
  EnergyFilamentMaterial,
  MemoryFieldMaterial,
  MemoryGlassMaterial,
  MemoryShellMaterial,
  ScarMaterial,
} from '../materials/MemoryMaterials'
import { useExperienceStore } from '../state/experienceStore'
import { trialRuntime } from './trialRuntime'

const SHUTTER_EXTRUSION = {
  depth: 0.48,
  bevelEnabled: true,
  bevelSegments: 3,
  steps: 1,
  bevelSize: 0.07,
  bevelThickness: 0.07,
} as const

function useShutterShape() {
  return useMemo(() => {
    const shape = new Shape()
    shape.moveTo(-0.62, -3.5)
    shape.bezierCurveTo(-0.82, -2.3, -0.48, -0.72, -0.7, 0.48)
    shape.lineTo(-0.2, 3.62)
    shape.bezierCurveTo(0.48, 3.1, 0.74, 1.54, 0.5, 0.18)
    shape.lineTo(0.72, -2.9)
    shape.closePath()
    return shape
  }, [])
}

function ShutdownShutter() {
  const shape = useShutterShape()
  return (
    <mesh>
      <extrudeGeometry args={[shape, SHUTTER_EXTRUSION]} />
      <ArchitecturalMaterial
        body="#0b090e"
        edge="#594460"
        opacity={0.98}
        variation={0.11}
        brush={0.042}
        relief={0.026}
        side={DoubleSide}
      />
    </mesh>
  )
}

function VulnerableSternum() {
  const node = useRef<Group>(null)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)

  useFrame(({ clock }) => {
    if (!node.current) return
    const impact = MathUtils.smootherstep(trialRuntime.fearPulse, 0.68, 1)
    const guarded = trialRuntime.fearShield === trialRuntime.fearDirection
    const pulse = reducedMotion ? 0 : Math.sin(clock.elapsedTime * 2.2) * 0.025
    node.current.scale.set(
      1 - impact * (guarded ? 0.08 : 0.16) + pulse,
      1 - impact * (guarded ? 0.12 : 0.24) + pulse,
      1 + impact * 0.08,
    )
  })

  const scar = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(-0.2, -0.42, 0.22),
        new Vector3(-0.06, -0.08, 0.34),
        new Vector3(0.1, 0.18, 0.32),
        new Vector3(0.18, 0.44, 0.16),
      ]),
    [],
  )

  return (
    <group ref={node} position={[0, 0.54, -4.12]}>
      <mesh scale={[0.38, 0.62, 0.23]}>
        <dodecahedronGeometry args={[1, 2]} />
        <MemoryGlassMaterial
          body="#221a27"
          accent="#a377b2"
          opacity={0.76}
          roughness={0.2}
          transmission={0}
          thickness={0.88}
        />
      </mesh>
      <mesh scale={[0.16, 0.38, 0.11]} rotation={[0, Math.PI / 4, 0]}>
        <octahedronGeometry args={[1, 0]} />
        <ArchitecturalMaterial
          body="#46354f"
          edge="#d4a1df"
          opacity={0.96}
          variation={0.025}
          brush={0.016}
          relief={0.006}
        />
      </mesh>
      <mesh position={[0, 0, 0.25]}>
        <tubeGeometry args={[scar, 30, 0.026, 6, false]} />
        <ScarMaterial
          color="#563361"
          hot="#e3a3eb"
          growth={() => trialRuntime.fearPulse}
          energy={() => trialRuntime.fearPulse}
        />
      </mesh>
      <pointLight
        color="#a578b6"
        intensity={1.4 + trialRuntime.fearPulse * 2.8}
        distance={5.2}
        decay={2}
      />
    </group>
  )
}

function ShutdownWave({
  waveRef,
  rippleRef,
}: {
  waveRef: React.RefObject<Group | null>
  rippleRef: React.RefObject<Group | null>
}) {
  const filaments = useMemo(
    () =>
      [-0.58, 0, 0.58].map(
        (offset) =>
          new CatmullRomCurve3([
            new Vector3(-1.1, offset, 0.1),
            new Vector3(-0.42, offset * 1.08, 0.28),
            new Vector3(0.42, offset * 0.92, 0.28),
            new Vector3(1.1, offset, 0.1),
          ]),
      ),
    [],
  )

  return (
    <>
      <group ref={waveRef} position={[-5.2, 0.54, -4.2]}>
        <mesh scale={[1.45, 0.11, 1.85]}>
          <sphereGeometry args={[1, 36, 18, 0, Math.PI * 2, 0, Math.PI * 0.24]} />
          <MemoryFieldMaterial
            color="#24162b"
            accent="#c08dcf"
            opacity={0.7}
            distortion={0.065}
            progress={() => trialRuntime.fearPulse}
          />
        </mesh>
        {filaments.map((curve, index) => (
          <mesh key={index} rotation={[Math.PI / 2, 0, 0]}>
            <tubeGeometry args={[curve, 32, index === 1 ? 0.026 : 0.018, 6, false]} />
            <EnergyFilamentMaterial
              color="#684677"
              hot="#d9a0e5"
              opacity={index === 1 ? 0.72 : 0.4}
              rhythm={0.82 + index * 0.08}
              energy={() => trialRuntime.fearPulse}
            />
          </mesh>
        ))}
        <pointLight color="#a570b6" intensity={3.4} distance={6.2} decay={2} />
      </group>
      <group ref={rippleRef} position={[0, 0.54, -3.98]} visible={false}>
        <mesh scale={[0.74, 1.08, 0.24]}>
          <sphereGeometry args={[1, 30, 18]} />
          <MemoryShellMaterial
            body="#26172d"
            depth="#070509"
            accent="#d8a1e4"
            opacity={0.4}
            distortion={0.035}
            thickness={0.82}
            energy={() => trialRuntime.fearPulse}
          />
        </mesh>
      </group>
    </>
  )
}

export function Phase8FearTrial() {
  const root = useRef<Group>(null)
  const architecture = useRef<Group>(null)
  const wave = useRef<Group>(null)
  const ripple = useRef<Group>(null)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const phase = useExperienceStore((state) => state.phase)
  const beat = useExperienceStore((state) => state.trialBeat)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)

  useFrame(({ clock }, delta) => {
    if (!root.current || !architecture.current || !wave.current || !ripple.current) return
    const active = activeFragment === 'fear' && phase.startsWith('trial-')
    const presence = active
      ? phase === 'trial-departure'
        ? MathUtils.smootherstep(trialRuntime.passage, 0.03, 1)
        : phase === 'trial-returning'
          ? 1 - MathUtils.smootherstep(trialRuntime.returnProgress, 0.06, 0.98)
          : 1
      : 0
    root.current.visible = presence > 0.002
    if (!root.current.visible) return

    const impact = MathUtils.smootherstep(trialRuntime.fearPulse, 0.68, 1)
    const enclosure = beat * 0.12 + trialRuntime.fearPulse * 0.22
    architecture.current.children.forEach((child, index) => {
      const side = index % 2 === 0 ? -1 : 1
      const depth = Math.floor(index / 2)
      child.position.set(
        side * (3.22 + depth * 0.2 - enclosure * (0.72 + depth * 0.06)),
        0.02,
        -3.7 - depth * 1.62,
      )
      child.rotation.set(
        0,
        side * (-0.12 - enclosure * 0.055),
        side * (0.025 + enclosure * 0.045),
      )
      child.scale.set(side * (0.68 - depth * 0.07), 0.92 + depth * 0.05, 0.76)
    })

    const direction =
      trialRuntime.fearDirection === 'left'
        ? new Vector3(-1, 0, 0)
        : trialRuntime.fearDirection === 'right'
          ? new Vector3(1, 0, 0)
          : new Vector3(0, 1, 0)
    wave.current.position
      .copy(direction)
      .multiplyScalar(MathUtils.lerp(5.3, 1.02, trialRuntime.fearPulse))
    wave.current.position.y += 0.54
    wave.current.position.z = -4.2
    wave.current.rotation.z =
      trialRuntime.fearDirection === 'left'
        ? -Math.PI / 2
        : trialRuntime.fearDirection === 'right'
          ? Math.PI / 2
          : Math.PI
    wave.current.scale.setScalar(0.66 + trialRuntime.fearPulse * 0.38)
    ripple.current.visible = impact > 0.01
    ripple.current.scale.set(
      0.76 + impact * 0.42,
      0.92 + impact * 0.54,
      0.52 + impact * 0.08,
    )
    ripple.current.rotation.z = reducedMotion
      ? 0
      : clock.elapsedTime * 0.018 + direction.x * 0.12

    root.current.scale.setScalar(Math.max(0.001, presence))
    root.current.position.z = MathUtils.damp(
      root.current.position.z,
      MathUtils.lerp(-0.9, 0, presence),
      reducedMotion ? 14 : 3,
      delta,
    )
  })

  return (
    <group ref={root} visible={false} name="phase8-fear-defensive-organ">
      <group ref={architecture}>
        {[0, 1, 2].flatMap((depth) =>
          [-1, 1].map((side) => (
            <group key={`${depth}-${side}`}>
              <ShutdownShutter />
            </group>
          )),
        )}
      </group>
      <VulnerableSternum />
      <ShutdownWave waveRef={wave} rippleRef={ripple} />
      <mesh position={[0, -2.74, -6.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6.4, 11.5]} />
        <ArchitecturalMaterial
          body="#070609"
          edge="#49384f"
          opacity={0.98}
          variation={0.08}
          brush={0.025}
          relief={0.016}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.25, -9.4]} scale={[5.5, 4.4, 1]}>
        <planeGeometry />
        <MemoryFieldMaterial
          color="#0c080f"
          accent="#9e6faf"
          opacity={0.13}
          distortion={0.052}
          progress={() =>
            phase === 'trial-departure'
              ? trialRuntime.passage
              : phase === 'trial-returning'
                ? 1 - trialRuntime.returnProgress
                : trialRuntime.fearPulse * 0.34
          }
        />
      </mesh>
    </group>
  )
}
