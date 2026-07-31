import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import {
  CatmullRomCurve3,
  DoubleSide,
  Group,
  InstancedMesh,
  MathUtils,
  Object3D,
  Shape,
  Vector3,
} from 'three'
import { entranceRuntime } from '../experience/entranceRuntime'
import {
  ArchitecturalMaterial,
  EnergyFilamentMaterial,
  MemoryGlassMaterial,
  MemoryShellBackMaterial,
  MemoryShellMaterial,
  ScarMaterial,
} from '../materials/MemoryMaterials'
import { deriveEndingConfiguration } from '../reconstruction/endingProfiles'
import { reconstructionRuntime } from '../reconstruction/reconstructionRuntime'
import type { FragmentId } from '../state/experienceStore'
import { useExperienceStore } from '../state/experienceStore'
import { trialRuntime } from '../trials/trialRuntime'

const DETACHMENT: Record<FragmentId, Vector3> = {
  identity: new Vector3(-1.72, 0.28, 0.52),
  fear: new Vector3(1.58, -0.12, 0.7),
  hope: new Vector3(0.55, 1.76, 0.42),
}

const INTEGRATED_POSITION: Record<FragmentId, Vector3> = {
  identity: new Vector3(0, 0.12, 0.52),
  fear: new Vector3(0.68, 0.36, 0.34),
  hope: new Vector3(0.08, 1.08, 0.48),
}

function SyntheticFace() {
  const facialTendons = useMemo(
    () =>
      [-1, 1].map(
        (side) =>
          new CatmullRomCurve3([
            new Vector3(side * 0.16, -0.28, 0.34),
            new Vector3(side * 0.24, -0.58, 0.28),
            new Vector3(side * 0.36, -0.96, 0.14),
            new Vector3(side * 0.72, -1.46, -0.02),
          ]),
      ),
    [],
  )
  const jaw = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(-0.35, -0.16, 0.31),
        new Vector3(-0.27, -0.46, 0.37),
        new Vector3(0, -0.62, 0.4),
        new Vector3(0.27, -0.46, 0.37),
        new Vector3(0.35, -0.16, 0.31),
      ]),
    [],
  )

  return (
    <group position={[0, 2.62, 0.02]}>
      <mesh scale={[0.48, 0.66, 0.43]} rotation={[0.035, 0, 0]}>
        <sphereGeometry args={[1, 36, 24]} />
        <MemoryGlassMaterial
          body="#151419"
          accent="#a39aa7"
          opacity={0.6}
          roughness={0.18}
          transmission={0}
          thickness={0.86}
        />
      </mesh>
      <mesh position={[0, -0.03, 0.075]} scale={[0.405, 0.57, 0.37]}>
        <sphereGeometry args={[1, 32, 22]} />
        <ArchitecturalMaterial
          body="#242229"
          edge="#8f8994"
          opacity={0.92}
          variation={0.045}
          brush={0.024}
          relief={0.006}
        />
      </mesh>
      <mesh position={[0, 0.27, 0.405]} scale={[0.235, 0.19, 0.055]}>
        <sphereGeometry args={[1, 24, 14]} />
        <MemoryShellMaterial
          body="#343039"
          depth="#0d0c10"
          accent="#aaa3af"
          opacity={0.58}
          distortion={0.004}
          thickness={0.74}
          energy={() => entranceRuntime.core}
        />
      </mesh>
      {[-1, 1].map((side) => (
        <group
          key={side}
          position={[side * 0.19, 0.09, 0.39]}
          rotation={[0.1, side * 0.08, side * -0.08]}
        >
          <mesh scale={[0.16, 0.075, 0.04]}>
            <sphereGeometry args={[1, 18, 10]} />
            <ArchitecturalMaterial
              body="#09090b"
              edge="#615d66"
              opacity={0.98}
              variation={0.025}
              brush={0.014}
              relief={0.004}
            />
          </mesh>
          <mesh scale={[0.14, 0.018, 0.022]}>
            <capsuleGeometry args={[1, 0.3, 4, 8]} />
            <EnergyFilamentMaterial
              color="#817987"
              hot="#f3eef4"
              opacity={0.34}
              rhythm={1.32}
              energy={() => entranceRuntime.core}
            />
          </mesh>
          <mesh position={[side * 0.025, 0, 0.046]} scale={[0.022, 0.012, 0.01]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshBasicMaterial
              color="#eee7ef"
              transparent
              opacity={0.54}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((side) => (
        <mesh
          key={`cheek-${side}`}
          position={[side * 0.225, -0.17, 0.38]}
          rotation={[0.02, side * -0.1, side * 0.16]}
          scale={[0.17, 0.25, 0.052]}
        >
          <sphereGeometry args={[1, 24, 14]} />
          <MemoryShellMaterial
            body="#302d35"
            depth="#0b0a0e"
            accent="#8e8793"
            opacity={0.5}
            distortion={0.005}
            thickness={0.76}
            energy={() => entranceRuntime.core}
          />
        </mesh>
      ))}
      <mesh>
        <tubeGeometry args={[jaw, 38, 0.022, 7, false]} />
        <ArchitecturalMaterial
          body="#29272d"
          edge="#9a929e"
          opacity={0.84}
          variation={0.025}
          brush={0.018}
          relief={0.004}
        />
      </mesh>
      <mesh position={[0, -0.39, 0.39]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.085, 0.012, 6, 20, Math.PI]} />
        <EnergyFilamentMaterial
          color="#766e7b"
          hot="#e9e1ec"
          opacity={0.38}
          rhythm={0.84}
          energy={() => entranceRuntime.core}
        />
      </mesh>
      <mesh position={[0, -0.34, 0.375]} scale={[0.18, 0.15, 0.035]}>
        <sphereGeometry args={[1, 22, 12]} />
        <MemoryShellMaterial
          body="#302c34"
          depth="#0b0a0d"
          accent="#8a818e"
          opacity={0.36}
          distortion={0.003}
          thickness={0.7}
          energy={() => entranceRuntime.core}
        />
      </mesh>
      <group position={[0, -0.72, -0.01]}>
        {[0, 1, 2, 3].map((index) => (
          <mesh
            key={index}
            position={[Math.sin(index * 1.7) * 0.018, -index * 0.2, 0]}
            scale={[0.14 - index * 0.01, 0.09, 0.12]}
            rotation={[0, index * 0.18, 0]}
          >
            <dodecahedronGeometry args={[1, 1]} />
            <ArchitecturalMaterial
              body="#242329"
              edge="#817b85"
              opacity={0.96}
              variation={0.045}
              brush={0.02}
              relief={0.006}
            />
          </mesh>
        ))}
      </group>
      {facialTendons.map((curve, index) => (
        <mesh key={index}>
          <tubeGeometry args={[curve, 34, 0.025, 7, false]} />
          <MemoryShellMaterial
            body="#2a2630"
            depth="#08070a"
            accent="#8f8298"
            opacity={0.56}
            distortion={0.004}
            thickness={0.66}
            energy={() => entranceRuntime.core}
          />
        </mesh>
      ))}
    </group>
  )
}

function VertebralColumn() {
  const vertebrae = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!vertebrae.current) return
    const transform = new Object3D()
    for (let index = 0; index < 10; index += 1) {
      const t = index / 9
      transform.position.set(
        Math.sin(t * Math.PI) * (index % 2 ? 0.018 : -0.018),
        1.65 - index * 0.43,
        -0.02 - Math.abs(t - 0.45) * 0.08,
      )
      transform.rotation.set(0, Math.PI / 4 + (index % 2 ? 0.06 : -0.06), 0)
      transform.scale.set(0.16 + Math.sin(t * Math.PI) * 0.07, 0.14, 0.13)
      transform.updateMatrix()
      vertebrae.current.setMatrixAt(index, transform.matrix)
    }
    vertebrae.current.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <instancedMesh ref={vertebrae} args={[undefined, undefined, 10]}>
      <octahedronGeometry args={[1, 0]} />
      <ArchitecturalMaterial
        body="#3a383f"
        edge="#8e8992"
        opacity={0.98}
        variation={0.055}
        brush={0.02}
      />
    </instancedMesh>
  )
}

function AnatomicalRibs() {
  const curves = useMemo(() => {
    const result: CatmullRomCurve3[] = []
    for (let tier = 0; tier < 4; tier += 1) {
      const y = 1.42 - tier * 0.48
      const span = 0.62 + tier * 0.13
      for (const side of [-1, 1]) {
        result.push(
          new CatmullRomCurve3([
            new Vector3(side * 0.08, y, 0.02),
            new Vector3(side * span * 0.52, y + 0.04, 0.18),
            new Vector3(side * span, y - 0.13, 0.02),
            new Vector3(side * span * 0.76, y - 0.38, -0.2),
          ]),
        )
      }
    }
    return result
  }, [])

  return (
    <group>
      {curves.map((curve, index) => (
        <mesh key={index}>
          <tubeGeometry args={[curve, 24, index < 4 ? 0.042 : 0.035, 6, false]} />
          <ArchitecturalMaterial
            body="#29282e"
            edge="#746f79"
            opacity={0.72}
            variation={0.035}
            brush={0.02}
            side={DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

function GlassOrganLobe({
  side,
  lobeRef,
}: {
  side: -1 | 1
  lobeRef: RefObject<Group | null>
}) {
  return (
    <group
      ref={lobeRef}
      position={[side * 0.62, 0.94, -0.08]}
      rotation={[0.03, side * -0.08, side * -0.12]}
    >
      <mesh scale={[0.66, 1.24, 0.38]}>
        <sphereGeometry args={[1, 40, 26]} />
        <MemoryGlassMaterial
          body={side < 0 ? '#18161b' : '#151419'}
          accent={side < 0 ? '#968c9a' : '#7c7282'}
          opacity={0.54}
          roughness={side < 0 ? 0.2 : 0.25}
          transmission={0}
          thickness={0.76}
        />
      </mesh>
      <mesh scale={[0.58, 1.12, 0.3]}>
        <sphereGeometry args={[1, 32, 20]} />
        <MemoryShellBackMaterial
          body="#0c0a0e"
          depth="#020203"
          accent="#62586a"
          opacity={0.3}
          distortion={0.008}
          thickness={0.9}
          energy={() => reconstructionRuntime.rebuild}
        />
      </mesh>
      <mesh
        position={[side * -0.13, 0.02, 0.41]}
        rotation={[0, 0, side * -0.16]}
        scale={[0.035, 0.92, 0.028]}
      >
        <capsuleGeometry args={[1, 0.48, 5, 9]} />
        <ArchitecturalMaterial
          body="#35323a"
          edge="#77717b"
          opacity={0.68}
          variation={0.025}
          brush={0.02}
        />
      </mesh>
    </group>
  )
}

function LivingHeart() {
  const heart = useRef<Group>(null)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)

  useFrame(({ clock }) => {
    if (!heart.current) return
    const precise = trialRuntime.alignmentHold
    const rate = precise > 0.5 ? 2.4 : 1.55
    const pulse = reducedMotion ? 1 : 1 + Math.sin(clock.elapsedTime * rate) * 0.045
    heart.current.scale.setScalar(pulse)
  })

  return (
    <group ref={heart} position={[0, 0.74, 0.38]}>
      <mesh scale={[0.25, 0.35, 0.21]} rotation={[0.08, 0.24, 0]}>
        <dodecahedronGeometry args={[1, 1]} />
        <MemoryGlassMaterial
          body="#4a454c"
          accent="#fff7ec"
          opacity={0.88}
          roughness={0.16}
          transmission={0}
          thickness={0.82}
        />
      </mesh>
      <pointLight
        color="#f0e6da"
        intensity={0.8 + entranceRuntime.core * 1.8 + trialRuntime.beatEnergy * 1.4}
        distance={5.2}
        decay={2}
      />
    </group>
  )
}

function CoreNeuralPath() {
  const curve = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(0, -1.9, 0.12),
        new Vector3(-0.12, -0.62, 0.34),
        new Vector3(0.14, 0.5, 0.48),
        new Vector3(-0.08, 1.64, 0.3),
        new Vector3(0, 2.18, 0.08),
      ]),
    [],
  )
  return (
    <mesh>
      <tubeGeometry args={[curve, 56, 0.028, 7, false]} />
      <EnergyFilamentMaterial
        color="#827789"
        hot="#fff7ef"
        opacity={0.9}
        rhythm={1.3}
        energy={() =>
          Math.max(
            entranceRuntime.core,
            trialRuntime.alignmentHold,
            reconstructionRuntime.rebuild,
          )
        }
      />
    </mesh>
  )
}

function IdentityOrgan({ organRef }: { organRef: RefObject<Group | null> }) {
  return (
    <group ref={organRef} position={[0, 0.12, 0.52]}>
      <mesh scale={[0.48, 1.08, 0.28]}>
        <sphereGeometry args={[1, 28, 18]} />
        <MemoryGlassMaterial
          body="#20262a"
          accent="#c9d3d8"
          opacity={0.24}
          roughness={0.18}
          transmission={0}
          thickness={0.82}
        />
      </mesh>
      {[-0.7, 0, 0.7].map((y, index) => (
        <mesh
          key={y}
          position={[0, y, 0]}
          scale={[0.34, index === 1 ? 0.34 : 0.3, 0.24]}
          rotation={[0, Math.PI / 4, 0]}
        >
          <octahedronGeometry args={[1, 0]} />
          <ArchitecturalMaterial
            body="#69747a"
            edge="#eef4f6"
            opacity={0.98}
            variation={0.025}
            brush={0.015}
          />
        </mesh>
      ))}
      <mesh scale={[0.032, 1.28, 0.032]}>
        <capsuleGeometry args={[1, 0.45, 5, 9]} />
        <EnergyFilamentMaterial
          color="#a9b5bb"
          hot="#ffffff"
          opacity={0.94}
          rhythm={1.55}
          energy={() =>
            Math.max(
              trialRuntime.alignmentHold,
              trialRuntime.syncVisual,
              reconstructionRuntime.rebuild,
            )
          }
        />
      </mesh>
    </group>
  )
}

function FearOrgan({ organRef }: { organRef: RefObject<Group | null> }) {
  const scarCurve = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(-0.36, -0.58, 0.34),
        new Vector3(-0.08, -0.2, 0.52),
        new Vector3(0.14, 0.24, 0.5),
        new Vector3(0.3, 0.68, 0.22),
      ]),
    [],
  )
  return (
    <group ref={organRef} position={[0.68, 0.36, 0.34]} rotation={[0.08, -0.18, -0.22]}>
      <mesh scale={[0.44, 0.72, 0.26]}>
        <dodecahedronGeometry args={[1, 1]} />
        <MemoryGlassMaterial
          body="#302438"
          accent="#9f76b0"
          opacity={0.72}
          roughness={0.22}
          transmission={0}
          thickness={0.74}
        />
      </mesh>
      <mesh>
        <tubeGeometry args={[scarCurve, 34, 0.032, 6, false]} />
        <ScarMaterial
          color="#633f73"
          hot="#d79be4"
          growth={() => 1}
          energy={() => Math.max(trialRuntime.beatEnergy, reconstructionRuntime.rebuild)}
        />
      </mesh>
    </group>
  )
}

function HopeOrgan({ organRef }: { organRef: RefObject<Group | null> }) {
  const curves = useMemo(
    () => [
      new CatmullRomCurve3([
        new Vector3(0, -0.62, 0.2),
        new Vector3(0.14, -0.04, 0.48),
        new Vector3(-0.08, 0.62, 0.48),
        new Vector3(0.18, 1.2, 0.18),
      ]),
      new CatmullRomCurve3([
        new Vector3(0.02, 0.22, 0.28),
        new Vector3(-0.22, 0.5, 0.42),
        new Vector3(-0.42, 0.86, 0.22),
      ]),
    ],
    [],
  )
  return (
    <group ref={organRef} position={[0.08, 1.08, 0.48]}>
      {curves.map((curve, index) => (
        <mesh key={index}>
          <tubeGeometry args={[curve, 36, index === 0 ? 0.042 : 0.028, 7, false]} />
          <EnergyFilamentMaterial
            color="#a5763b"
            hot="#f5ca82"
            opacity={index === 0 ? 0.92 : 0.72}
            rhythm={1.06 + index * 0.2}
            energy={() =>
              Math.max(
                trialRuntime.beatEnergy,
                trialRuntime.syncVisual,
                reconstructionRuntime.rebuild,
              )
            }
          />
        </mesh>
      ))}
    </group>
  )
}

function FearAdaptiveAnatomy() {
  const root = useRef<Group>(null)
  const left = useRef<Group>(null)
  const up = useRef<Group>(null)
  const right = useRef<Group>(null)
  const phase = useExperienceStore((state) => state.phase)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const collectionOrder = useExperienceStore((state) => state.collectionOrder)
  const ending = useMemo(
    () => deriveEndingConfiguration(collectionOrder),
    [collectionOrder],
  )
  const scar = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(-0.34, -0.56, 0.2),
        new Vector3(-0.16, -0.12, 0.38),
        new Vector3(0.08, 0.26, 0.4),
        new Vector3(0.28, 0.58, 0.16),
      ]),
    [],
  )
  const defensivePlate = useMemo(() => {
    const shape = new Shape()
    shape.moveTo(-0.08, -0.94)
    shape.bezierCurveTo(-0.54, -0.58, -0.58, 0.34, -0.18, 0.92)
    shape.bezierCurveTo(0.12, 1.18, 0.42, 0.58, 0.38, -0.12)
    shape.bezierCurveTo(0.34, -0.62, 0.1, -0.92, -0.08, -0.94)
    shape.closePath()
    return shape
  }, [])

  useFrame(({ clock }, delta) => {
    if (!root.current || !left.current || !up.current || !right.current) return
    const active = activeFragment === 'fear' && phase.startsWith('trial-')
    const persistent =
      ending?.profile.id === 'fear' &&
      (phase === 'reconstruction-rebuilding' ||
        phase === 'reconstruction-reveal' ||
        phase === 'ending')
    const trialPresence = active
      ? phase === 'trial-departure'
        ? MathUtils.smootherstep(trialRuntime.passage, 0.06, 0.86)
        : phase === 'trial-returning'
          ? 1 - trialRuntime.returnProgress
          : 1
      : 0
    const persistentPresence = persistent
      ? phase === 'reconstruction-rebuilding'
        ? MathUtils.smootherstep(reconstructionRuntime.rebuild, 0.18, 0.72)
        : 1
      : 0
    const presence = Math.max(trialPresence, persistentPresence)
    root.current.visible = presence > 0.002
    if (!root.current.visible) return
    const impact = MathUtils.smootherstep(trialRuntime.fearPulse, 0.68, 1)
    const petals = { left: left.current, up: up.current, right: right.current }
    for (const [direction, petal] of Object.entries(petals)) {
      const selected = trialRuntime.fearShield === direction
      const persistentScale =
        direction === 'right' ? 1.18 : direction === 'up' ? 0.82 : 0.58
      const targetScale =
        presence * (persistent ? persistentScale : selected ? 1.05 + impact * 0.24 : 0.42)
      const settled = trialRuntime.completion * 0.18
      petal.scale.setScalar(
        MathUtils.damp(
          petal.scale.x,
          Math.max(0.001, targetScale + settled),
          reducedMotion ? 14 : selected ? 7 : 3.4,
          delta,
        ),
      )
      petal.position.z = MathUtils.damp(
        petal.position.z,
        persistent
          ? direction === 'right'
            ? 0.42
            : 0.12
          : selected
            ? 0.34 + impact * 0.24
            : 0.06,
        reducedMotion ? 14 : 6,
        delta,
      )
    }
    root.current.scale.setScalar(0.88 + presence * 0.12)
    root.current.rotation.z = persistent
      ? -0.1
      : reducedMotion
        ? 0
        : Math.sin(clock.elapsedTime * 0.32) * 0.014 * (1 - impact)
  })

  const petal = (
    ref: RefObject<Group | null>,
    direction: 'left' | 'up' | 'right',
    position: [number, number, number],
    rotation: [number, number, number],
  ) => (
    <group ref={ref} position={position} rotation={rotation} scale={0.001}>
      <mesh scale={[0.74, 0.94, 1]}>
        <extrudeGeometry
          args={[
            defensivePlate,
            {
              depth: 0.18,
              bevelEnabled: true,
              bevelSegments: 3,
              steps: 1,
              bevelSize: 0.055,
              bevelThickness: 0.055,
            },
          ]}
        />
        <ArchitecturalMaterial
          body="#17121b"
          edge="#9d76ac"
          opacity={0.96}
          variation={0.075}
          brush={0.025}
          relief={0.012}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[-0.03, 0.02, 0.21]} scale={[0.3, 0.68, 0.1]}>
        <sphereGeometry args={[1, 28, 16]} />
        <MemoryShellMaterial
          body="#302038"
          depth="#09070c"
          accent={direction === trialRuntime.fearDirection ? '#d2a0df' : '#72527f'}
          opacity={0.54}
          distortion={0.012}
          thickness={0.82}
          energy={() =>
            trialRuntime.fearShield === direction ? trialRuntime.fearPulse : 0.08
          }
        />
      </mesh>
      <mesh position={[0, 0, 0.34]}>
        <tubeGeometry args={[scar, 28, 0.022, 6, false]} />
        <ScarMaterial
          color="#5a3968"
          hot="#d899e4"
          growth={() => trialRuntime.fearPulse}
          energy={() =>
            trialRuntime.fearShield === direction ? trialRuntime.fearPulse : 0.12
          }
        />
      </mesh>
    </group>
  )

  return (
    <group ref={root} visible={false} name="fear-adaptive-anatomy">
      {petal(left, 'left', [-1.14, 0.72, 0.06], [0, 0, -Math.PI / 2])}
      {petal(up, 'up', [0, 1.82, 0.04], [0, 0, 0])}
      {petal(right, 'right', [1.14, 0.72, 0.06], [0, 0, Math.PI / 2])}
    </group>
  )
}

function HopeAdaptiveAnatomy() {
  const root = useRef<Group>(null)
  const phase = useExperienceStore((state) => state.phase)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const collectionOrder = useExperienceStore((state) => state.collectionOrder)
  const ending = useMemo(
    () => deriveEndingConfiguration(collectionOrder),
    [collectionOrder],
  )
  const growth = useMemo(
    () =>
      [-1, 1].flatMap((side) => [
        new CatmullRomCurve3([
          new Vector3(0, 0.55, 0.42),
          new Vector3(side * 0.18, 1.12, 0.48),
          new Vector3(side * 0.46, 1.84, 0.3),
          new Vector3(side * 0.82, 2.55, 0.02),
        ]),
        new CatmullRomCurve3([
          new Vector3(side * 0.2, 1.18, 0.38),
          new Vector3(side * 0.58, 1.52, 0.3),
          new Vector3(side * 1.02, 1.86, 0.04),
        ]),
      ]),
    [],
  )

  useFrame(({ clock }, delta) => {
    if (!root.current) return
    const active = activeFragment === 'hope' && phase.startsWith('trial-')
    const persistent =
      ending?.profile.id === 'hope' &&
      (phase === 'reconstruction-rebuilding' ||
        phase === 'reconstruction-reveal' ||
        phase === 'ending')
    const trialPresence = active
      ? phase === 'trial-departure'
        ? MathUtils.smootherstep(trialRuntime.passage, 0.04, 0.86)
        : phase === 'trial-returning'
          ? 1 - trialRuntime.returnProgress
          : 1
      : 0
    const persistentPresence = persistent
      ? phase === 'reconstruction-rebuilding'
        ? MathUtils.smootherstep(reconstructionRuntime.rebuild, 0.16, 0.66)
        : 1
      : 0
    const presence = Math.max(trialPresence, persistentPresence)
    root.current.visible = presence > 0.002
    if (!root.current.visible) return
    const rise = MathUtils.clamp(
      (trialRuntime.hopeSignalY + 2.8) / 6 + trialRuntime.beatEnergy * 0.18,
      0.08,
      1,
    )
    root.current.scale.set(
      MathUtils.damp(root.current.scale.x, presence, reducedMotion ? 14 : 3.2, delta),
      MathUtils.damp(
        root.current.scale.y,
        presence * (0.38 + rise * 0.78 + (persistent ? 0.34 : 0)),
        reducedMotion ? 14 : 2.6,
        delta,
      ),
      presence,
    )
    root.current.rotation.z = reducedMotion
      ? 0
      : Math.sin(clock.elapsedTime * (persistent ? 0.3 : 0.42)) *
        (persistent ? 0.032 : 0.018) *
        presence
  })

  return (
    <group ref={root} visible={false} scale={0.001} name="hope-adaptive-anatomy">
      {growth.map((curve, index) => (
        <mesh key={index}>
          <tubeGeometry args={[curve, 42, index % 2 === 0 ? 0.035 : 0.024, 7, false]} />
          <EnergyFilamentMaterial
            color={index % 2 === 0 ? '#a97839' : '#7c5930'}
            hot="#f4ca82"
            opacity={index % 2 === 0 ? 0.88 : 0.62}
            rhythm={1.02 + index * 0.08}
            energy={() => Math.max(trialRuntime.beatEnergy, trialRuntime.inputEnergy)}
          />
        </mesh>
      ))}
    </group>
  )
}

export function Phase8Felicia() {
  const root = useRef<Group>(null)
  const body = useRef<Group>(null)
  const leftLobe = useRef<Group>(null)
  const rightLobe = useRef<Group>(null)
  const identityOrgan = useRef<Group>(null)
  const fearOrgan = useRef<Group>(null)
  const hopeOrgan = useRef<Group>(null)
  const phase = useExperienceStore((state) => state.phase)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const collectionOrder = useExperienceStore((state) => state.collectionOrder)
  const collected = useExperienceStore((state) => state.collectedFragments)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const ending = useMemo(
    () => deriveEndingConfiguration(collectionOrder),
    [collectionOrder],
  )

  useFrame(({ clock }, delta) => {
    if (!root.current || !body.current || !leftLobe.current || !rightLobe.current) return

    const trialPresence =
      activeFragment && phase.startsWith('trial-')
        ? phase === 'trial-returning'
          ? 1 - trialRuntime.returnProgress
          : MathUtils.smootherstep(
              trialRuntime.departure * 0.5 + trialRuntime.passage * 0.5,
              0,
              1,
            )
        : 0
    const reconstructionActive = phase.startsWith('reconstruction-') || phase === 'ending'
    const exposure =
      phase === 'reconstruction-synchronizing'
        ? trialRuntime.syncVisual * 0.78
        : phase === 'reconstruction-initiating'
          ? 0.78 + reconstructionRuntime.recognition * 0.22
          : phase === 'reconstruction-collapse' ||
              phase === 'reconstruction-void' ||
              phase === 'reconstruction-recall'
            ? 1
            : phase === 'reconstruction-rebuilding'
              ? 1 - MathUtils.smootherstep(reconstructionRuntime.rebuild, 0.46, 0.98)
              : 0
    const rebuild =
      phase === 'reconstruction-rebuilding'
        ? reconstructionRuntime.rebuild
        : phase === 'reconstruction-reveal' || phase === 'ending'
          ? 1
          : 0
    const profile = ending?.profile.id
    const identityPressure =
      activeFragment === 'identity'
        ? trialPresence * (0.18 + (1 - trialRuntime.alignmentHold) * 0.18)
        : 0
    const fearPressure = activeFragment === 'fear' ? trialPresence : 0
    const hopePressure = activeFragment === 'hope' ? trialPresence : 0
    const fearImpact =
      fearPressure * MathUtils.smootherstep(trialRuntime.fearPulse, 0.68, 1)
    const fearGuard = rebuild * (profile === 'fear' ? 1 : 0)
    const hopeOpening = rebuild * (profile === 'hope' ? 1 : 0)
    const identityClosure = rebuild * (profile === 'identity' ? 1 : 0)
    const breathRate = profile === 'identity' ? 1.9 : profile === 'fear' ? 0.82 : 1.14
    const breathAmount = reducedMotion
      ? 0
      : profile === 'hope'
        ? 0.075
        : profile === 'fear'
          ? 0.025
          : 0.04
    const breath = Math.sin(clock.elapsedTime * breathRate) * breathAmount

    root.current.position.x = MathUtils.damp(
      root.current.position.x,
      activeFragment === 'fear' ? trialPresence * -0.22 : 0,
      reducedMotion ? 14 : 2,
      delta,
    )
    root.current.position.y = MathUtils.damp(
      root.current.position.y,
      trialPresence * (activeFragment === 'hope' ? 0.5 : 0.08) +
        rebuild * (profile === 'hope' ? 0.3 : 0),
      reducedMotion ? 14 : 2,
      delta,
    )
    root.current.position.z = MathUtils.damp(
      root.current.position.z,
      trialPresence * (activeFragment === 'hope' ? -4.1 : -4.66),
      reducedMotion ? 14 : 2.4,
      delta,
    )
    root.current.rotation.z = MathUtils.damp(
      root.current.rotation.z,
      fearGuard * -0.08 + hopeOpening * 0.025,
      reducedMotion ? 14 : 1.8,
      delta,
    )
    root.current.scale.setScalar(
      MathUtils.lerp(0.72, 1, entranceRuntime.core) *
        (1 + breath * 0.2) *
        (reconstructionActive ? 1.04 : 1),
    )

    body.current.rotation.y = MathUtils.damp(
      body.current.rotation.y,
      activeFragment === 'identity' || profile === 'identity'
        ? 0
        : (fearGuard + fearPressure) * -0.08 + (hopeOpening + hopePressure) * 0.035,
      reducedMotion ? 14 : 1.5,
      delta,
    )
    body.current.scale.set(
      1 - fearImpact * 0.07,
      1 - fearImpact * 0.12 + hopePressure * 0.025,
      1 + fearImpact * 0.05,
    )

    const shellOpen = exposure * 0.92 + hopeOpening * 0.58 + hopePressure * 0.28
    const leftTargetX =
      -0.62 - shellOpen + identityPressure + identityClosure * 0.45 + fearGuard * 0.28
    const rightTargetX =
      0.62 + shellOpen - identityPressure - identityClosure * 0.45 - fearGuard * 0.02
    leftLobe.current.position.x = MathUtils.damp(
      leftLobe.current.position.x,
      leftTargetX,
      reducedMotion ? 14 : 2.2,
      delta,
    )
    rightLobe.current.position.x = MathUtils.damp(
      rightLobe.current.position.x,
      rightTargetX,
      reducedMotion ? 14 : 2.2,
      delta,
    )
    leftLobe.current.position.y = 0.94 + shellOpen * 0.16 - fearGuard * 0.08 + breath
    rightLobe.current.position.y =
      0.94 + shellOpen * 0.42 + fearGuard * 0.12 - breath * 0.45
    leftLobe.current.rotation.z = 0.12 + shellOpen * 0.44 - fearGuard * 0.14
    rightLobe.current.rotation.z = -0.12 - shellOpen * 0.44 + fearGuard * 0.08
    leftLobe.current.scale.set(
      1 - identityPressure * 0.2 - identityClosure * 0.2,
      1 + hopeOpening * 0.12,
      1,
    )
    rightLobe.current.scale.set(
      1 - identityPressure * 0.2 - identityClosure * 0.2,
      1 + hopeOpening * 0.2,
      1,
    )

    const detached =
      phase === 'reconstruction-synchronizing'
        ? trialRuntime.syncVisual
        : phase === 'reconstruction-initiating' ||
            phase === 'reconstruction-collapse' ||
            phase === 'reconstruction-void' ||
            phase === 'reconstruction-recall'
          ? 1
          : phase === 'reconstruction-rebuilding'
            ? 1 - reconstructionRuntime.rebuild
            : 0

    const organRefs: Record<FragmentId, RefObject<Group | null>> = {
      identity: identityOrgan,
      fear: fearOrgan,
      hope: hopeOrgan,
    }
    collectionOrder.forEach((fragment, index) => {
      const organ = organRefs[fragment].current
      if (!organ) return
      const insertion =
        phase === 'reconstruction-rebuilding'
          ? MathUtils.smootherstep(
              reconstructionRuntime.rebuild,
              [0.08, 0.52, 0.76][index],
              [0.58, 0.82, 0.96][index],
            )
          : phase === 'reconstruction-reveal' || phase === 'ending'
            ? 1
            : 0
      const distance = phase === 'reconstruction-rebuilding' ? 1 - insertion : detached
      organ.position
        .copy(INTEGRATED_POSITION[fragment])
        .addScaledVector(DETACHMENT[fragment], distance)
      const visualWeight = index === 0 ? 1.12 : index === 1 ? 0.78 : 0.58
      organ.scale.setScalar(
        MathUtils.lerp(
          1,
          visualWeight,
          Math.max(detached, reconstructionRuntime.rebuild),
        ),
      )
      organ.rotation.z =
        distance * (fragment === 'identity' ? -0.08 : fragment === 'fear' ? 0.28 : -0.2)
    })
  })

  return (
    <group
      ref={root}
      position={[0, 0, 0]}
      scale={0.72}
      name="phase8-felicia-living-instrument"
    >
      <group ref={body}>
        <SyntheticFace />
        <GlassOrganLobe side={-1} lobeRef={leftLobe} />
        <GlassOrganLobe side={1} lobeRef={rightLobe} />
        <AnatomicalRibs />
        <VertebralColumn />
        <CoreNeuralPath />
        <LivingHeart />
        <FearAdaptiveAnatomy />
        <HopeAdaptiveAnatomy />
        <mesh position={[0, -1.95, -0.08]} scale={[0.34, 0.78, 0.24]}>
          <dodecahedronGeometry args={[1, 1]} />
          <MemoryShellMaterial
            body="#0c0b0e"
            depth="#040405"
            accent="#665d6c"
            opacity={0.28}
            distortion={0.008}
            thickness={0.66}
            energy={() => reconstructionRuntime.rebuild}
          />
        </mesh>
        {collected.includes('identity') && <IdentityOrgan organRef={identityOrgan} />}
        {collected.includes('fear') && <FearOrgan organRef={fearOrgan} />}
        {collected.includes('hope') && <HopeOrgan organRef={hopeOrgan} />}
      </group>
    </group>
  )
}
