import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { CatmullRomCurve3, Group, MathUtils, Vector3 } from 'three'
import {
  ArchitecturalMaterial,
  EnergyFilamentMaterial,
  MemoryShellBackMaterial,
  MemoryShellMaterial,
  ScarMaterial,
} from '../materials/MemoryMaterials'
import type { FragmentId } from '../state/experienceStore'
import { useExperienceStore } from '../state/experienceStore'
import { trialRuntime } from '../trials/trialRuntime'

function IdentityMemoryOrgan() {
  return (
    <group rotation={[0.08, -0.22, 0.06]}>
      {[-0.42, 0, 0.42].map((y, index) => (
        <mesh
          key={y}
          position={[index === 1 ? 0.15 : 0, y, 0]}
          rotation={[0, Math.PI / 4, index === 1 ? -0.22 : 0]}
          scale={[0.3, 0.2, 0.22]}
        >
          <octahedronGeometry args={[1, 0]} />
          <ArchitecturalMaterial
            body="#59636a"
            edge="#eaf1f4"
            opacity={0.98}
            variation={0.025}
            brush={0.015}
          />
        </mesh>
      ))}
      <mesh position={[0, 0, -0.06]} scale={[0.02, 0.86, 0.02]}>
        <capsuleGeometry args={[1, 0.4, 4, 8]} />
        <EnergyFilamentMaterial
          color="#8e9ca3"
          hot="#ffffff"
          opacity={0.84}
          rhythm={1.52}
          energy={() => Math.max(0.4, trialRuntime.anticipation)}
        />
      </mesh>
    </group>
  )
}

function FearMemoryOrgan() {
  const scar = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(-0.42, -0.62, 0.32),
        new Vector3(-0.08, -0.18, 0.52),
        new Vector3(0.12, 0.28, 0.48),
        new Vector3(0.38, 0.68, 0.18),
      ]),
    [],
  )
  return (
    <group rotation={[0.08, -0.28, -0.18]}>
      <mesh scale={[0.46, 0.74, 0.3]}>
        <dodecahedronGeometry args={[1, 1]} />
        <MemoryShellMaterial
          body="#2d2235"
          depth="#08060b"
          accent="#9d75ae"
          opacity={0.88}
          distortion={0.014}
          thickness={0.78}
          energy={() => Math.max(0.42, trialRuntime.anticipation)}
        />
      </mesh>
      <mesh scale={[0.38, 0.64, 0.22]}>
        <dodecahedronGeometry args={[1, 1]} />
        <MemoryShellBackMaterial
          body="#151019"
          depth="#040305"
          accent="#60486c"
          opacity={0.38}
          distortion={0.008}
          thickness={0.92}
        />
      </mesh>
      <mesh>
        <tubeGeometry args={[scar, 30, 0.034, 6, false]} />
        <ScarMaterial
          color="#664275"
          hot="#d49ae1"
          growth={() => 1}
          energy={() => trialRuntime.anticipation}
        />
      </mesh>
    </group>
  )
}

function HopeMemoryOrgan() {
  const stem = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(0, -0.72, 0.08),
        new Vector3(0.18, -0.12, 0.42),
        new Vector3(-0.08, 0.48, 0.48),
        new Vector3(0.28, 1.08, 0.16),
      ]),
    [],
  )
  return (
    <group rotation={[0.04, 0.18, 0.12]}>
      <mesh position={[0, -0.5, 0]} scale={[0.34, 0.46, 0.26]}>
        <dodecahedronGeometry args={[1, 1]} />
        <MemoryShellMaterial
          body="#45331e"
          depth="#0b0804"
          accent="#d8aa66"
          opacity={0.82}
          distortion={0.02}
          thickness={0.72}
          energy={() => Math.max(0.38, trialRuntime.anticipation)}
        />
      </mesh>
      <mesh>
        <tubeGeometry args={[stem, 36, 0.04, 7, false]} />
        <EnergyFilamentMaterial
          color="#9e6f35"
          hot="#f2c780"
          opacity={0.94}
          rhythm={1.08}
          energy={() => Math.max(0.42, trialRuntime.anticipation)}
        />
      </mesh>
    </group>
  )
}

export function Phase8MemoryOrgan({
  fragment,
  hovered,
  active,
}: {
  fragment: FragmentId
  hovered: boolean
  active: boolean
}) {
  const root = useRef<Group>(null)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)

  useFrame(({ clock }, delta) => {
    if (!root.current) return
    const activeEnergy = active
      ? Math.max(trialRuntime.anticipation, trialRuntime.departure)
      : hovered
        ? 0.45
        : 0
    const breath =
      reducedMotion || active
        ? 0
        : Math.sin(clock.elapsedTime * (fragment === 'identity' ? 1.4 : 0.82)) * 0.035
    root.current.scale.setScalar(
      MathUtils.damp(
        root.current.scale.x,
        0.8 + activeEnergy * 0.28 + breath,
        reducedMotion ? 12 : 3,
        delta,
      ),
    )
    root.current.rotation.y = MathUtils.damp(
      root.current.rotation.y,
      active
        ? fragment === 'identity'
          ? 0
          : fragment === 'fear'
            ? -0.18
            : 0.14
        : reducedMotion
          ? 0
          : Math.sin(clock.elapsedTime * 0.18) * 0.08,
      reducedMotion ? 12 : 2,
      delta,
    )
  })

  return (
    <group ref={root} scale={0.8} name={`${fragment}-living-memory-organ`}>
      {fragment === 'identity' && <IdentityMemoryOrgan />}
      {fragment === 'fear' && <FearMemoryOrgan />}
      {fragment === 'hope' && <HopeMemoryOrgan />}
    </group>
  )
}
