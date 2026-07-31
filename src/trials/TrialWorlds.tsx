import { Trail } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  CatmullRomCurve3,
  Group,
  InstancedMesh,
  MathUtils,
  Object3D,
  Vector3,
} from 'three'
import {
  ArchitecturalMaterial,
  EnergyFilamentMaterial,
  MemoryFieldMaterial,
  MemoryShellBackMaterial,
  MemoryShellMaterial,
} from '../materials/MemoryMaterials'
import type { FragmentId } from '../state/experienceStore'
import { useExperienceStore } from '../state/experienceStore'
import { FOUNDATION_INFLUENCE, TRIAL_DEFINITIONS } from './trialConfig'
import { trialRuntime } from './trialRuntime'

function useWorldPresence(fragment: FragmentId) {
  const phase = useExperienceStore((state) => state.phase)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  return () => {
    if (activeFragment !== fragment) return 0
    if (phase === 'trial-departure') {
      return MathUtils.smootherstep(trialRuntime.passage, 0.06, 1)
    }
    if (phase === 'trial-returning') return 1 - trialRuntime.returnProgress
    if (
      phase === 'trial-arrival' ||
      phase === 'trial-active' ||
      phase === 'trial-completing'
    ) {
      return 1
    }
    return 0
  }
}

function FoundationTrace({ current }: { current: FragmentId }) {
  const foundation = useExperienceStore((state) => state.collectionOrder[0])
  if (!foundation || foundation === current) return null
  const influence = FOUNDATION_INFLUENCE[foundation]
  const definition = TRIAL_DEFINITIONS[foundation]

  if (foundation === 'identity') {
    return (
      <group position={[0, influence.openness * 0.8, -2.8]}>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 2.45, 0, 0]} scale={[0.025, 3.1, 0.42]}>
            <boxGeometry />
            <ArchitecturalMaterial
              body="#15171a"
              edge={definition.color}
              opacity={0.34}
            />
          </mesh>
        ))}
      </group>
    )
  }

  if (foundation === 'fear') {
    return (
      <group position={[0, -0.1, -2.35]} rotation={[0, 0, -0.12]}>
        {[-1, 0, 1].map((index) => (
          <mesh
            key={index}
            position={[index * 0.68, -0.45 + Math.abs(index) * 0.2, 0]}
            rotation={[0, 0, index * -0.18]}
            scale={[0.48, 1.3, 0.24]}
          >
            <dodecahedronGeometry args={[1, 0]} />
            <MemoryShellMaterial
              body="#251c2c"
              depth="#0e0b12"
              accent={definition.color}
              opacity={0.22}
              distortion={0.008}
            />
          </mesh>
        ))}
      </group>
    )
  }

  return (
    <group position={[0, influence.openness, -2.5]}>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.5, 0.4, 0]} rotation={[0, 0, side * -0.28]}>
          <tubeGeometry
            args={[
              new CatmullRomCurve3([
                new Vector3(0, -2, 0),
                new Vector3(side * 0.18, -0.4, 0.05),
                new Vector3(side * 0.54, 1.4, -0.12),
                new Vector3(side * 1.1, 2.7, -0.25),
              ]),
              36,
              0.025,
              6,
              false,
            ]}
          />
          <EnergyFilamentMaterial
            color="#8e6b3d"
            hot={definition.color}
            opacity={0.24}
            rhythm={1.25}
          />
        </mesh>
      ))}
    </group>
  )
}

function IdentityCorridor() {
  const panels = useRef<InstancedMesh>(null)
  const slices = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!panels.current || !slices.current) return
    const transform = new Object3D()
    let instance = 0
    for (let depth = 0; depth < 6; depth += 1) {
      for (const side of [-1, 1]) {
        const z = -depth * 1.45 - 0.4
        const spread = 3.15 + depth * 0.12
        transform.position.set(side * spread, 0.18, z)
        transform.rotation.set(0, side * -0.13, side * 0.018)
        transform.scale.set(0.13, 3.8, 1.15)
        transform.updateMatrix()
        panels.current.setMatrixAt(instance, transform.matrix)

        transform.position.set(side * (spread - 0.66), 0.28, z + 0.2)
        transform.rotation.set(0, side * -0.08, 0)
        transform.scale.set(0.018, 3.65, 0.58)
        transform.updateMatrix()
        slices.current.setMatrixAt(instance, transform.matrix)
        instance += 1
      }
    }
    panels.current.instanceMatrix.needsUpdate = true
    slices.current.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <>
      <instancedMesh ref={panels} args={[undefined, undefined, 12]}>
        <boxGeometry />
        <ArchitecturalMaterial
          body="#0d0f12"
          edge="#9ba5ad"
          opacity={0.88}
          variation={0.11}
        />
      </instancedMesh>
      <instancedMesh ref={slices} args={[undefined, undefined, 12]}>
        <boxGeometry />
        <meshBasicMaterial
          color="#dce5ea"
          transparent
          opacity={0.13}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>
      <mesh position={[0, -3.15, -3.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6.4, 10.5]} />
        <ArchitecturalMaterial body="#080a0d" edge="#68727a" opacity={0.94} />
      </mesh>
    </>
  )
}

function IdentityWorld() {
  const root = useRef<Group>(null)
  const axes = useRef<Group>(null)
  const nucleus = useRef<Group>(null)
  const echoA = useRef<Group>(null)
  const echoB = useRef<Group>(null)
  const getPresence = useWorldPresence('identity')
  const beat = useExperienceStore((state) => state.trialBeat)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const phase = useExperienceStore((state) => state.phase)

  useFrame(({ clock }) => {
    if (
      !root.current ||
      !axes.current ||
      !nucleus.current ||
      !echoA.current ||
      !echoB.current
    )
      return
    const presence = getPresence()
    root.current.visible = presence > 0.001
    if (!root.current.visible) return
    const returnCompression = 1 - trialRuntime.returnProgress
    const scale = Math.max(0.001, presence * (0.88 + trialRuntime.arrival * 0.12))
    root.current.scale.set(
      scale * MathUtils.lerp(0.06, 1, returnCompression),
      scale,
      scale,
    )
    root.current.position.set(
      trialRuntime.returnProgress * -0.35,
      0.18 + trialRuntime.returnProgress * 0.55,
      MathUtils.lerp(-5.6, 0.12, trialRuntime.returnProgress),
    )
    axes.current.rotation.z = trialRuntime.alignmentAngle
    const error = Math.abs(trialRuntime.alignmentAngle - trialRuntime.alignmentTarget)
    const convergence = 1 - MathUtils.clamp(error / 0.9, 0, 1)
    const fracture = (1 - convergence) * (1 - trialRuntime.alignmentHold * 0.72)
    echoA.current.position.x = -0.46 * fracture
    echoB.current.position.x = 0.46 * fracture
    echoA.current.rotation.y = fracture * -0.18
    echoB.current.rotation.y = fracture * 0.18
    const snap = trialRuntime.alignmentHold
    nucleus.current.rotation.y =
      (reducedMotion ? 0 : clock.elapsedTime * 0.2) * (1 - snap) + snap * Math.PI * 0.25
    nucleus.current.scale.setScalar(0.88 + snap * 0.28 + trialRuntime.beatEnergy * 0.08)
  })

  return (
    <group
      ref={root}
      position={[0, 0.18, -5.6]}
      scale={0.001}
      visible={false}
      name="identity-trial"
    >
      <FoundationTrace current="identity" />
      <IdentityCorridor />
      <mesh position={[0, 0.1, -4.7]} scale={[5.9, 4.4, 1]}>
        <planeGeometry />
        <MemoryFieldMaterial
          color="#11171b"
          accent="#dce5ea"
          opacity={0.2}
          distortion={0.04}
          progress={() =>
            phase === 'trial-departure'
              ? trialRuntime.passage
              : phase === 'trial-arrival'
                ? 1 - trialRuntime.arrival
                : phase === 'trial-returning'
                  ? 1 - trialRuntime.returnProgress
                  : 0
          }
        />
      </mesh>
      <group ref={echoA} position={[0, 0.25, -2.4]}>
        <mesh scale={[0.48, 1.42, 0.34]}>
          <capsuleGeometry args={[0.52, 1.2, 7, 18]} />
          <MemoryShellMaterial
            body="#20262a"
            depth="#080a0c"
            accent="#dce5ea"
            opacity={0.22}
            distortion={0.006}
            energy={() => trialRuntime.alignmentHold}
          />
        </mesh>
      </group>
      <group ref={echoB} position={[0, 0.25, -2.9]}>
        <mesh scale={[0.48, 1.42, 0.34]}>
          <capsuleGeometry args={[0.52, 1.2, 7, 18]} />
          <MemoryShellMaterial
            body="#20262a"
            depth="#080a0c"
            accent="#dce5ea"
            opacity={0.18}
            distortion={0.006}
            energy={() => trialRuntime.alignmentHold}
          />
        </mesh>
      </group>
      <group ref={axes} position={[0, 0.15, 0.65]}>
        {[0, Math.PI / 3, -Math.PI / 3].map((rotation, index) => (
          <group
            key={rotation}
            rotation={[0, 0, rotation]}
            visible={index <= Math.min(beat, 2)}
          >
            <mesh scale={[2.75, 0.022, 0.03]}>
              <boxGeometry />
              <EnergyFilamentMaterial
                color="#8e9aa2"
                hot="#f2f6f8"
                opacity={0.72}
                rhythm={1.2 + index * 0.18}
                energy={() => trialRuntime.alignmentHold}
              />
            </mesh>
            <mesh position={[2.75, 0, 0]} scale={[0.18, 0.12, 0.12]}>
              <octahedronGeometry args={[1, 0]} />
              <MemoryShellMaterial
                body="#525d64"
                depth="#12171a"
                accent="#edf3f6"
                opacity={0.78}
                distortion={0.005}
                energy={() => trialRuntime.alignmentHold}
              />
            </mesh>
          </group>
        ))}
        <group ref={nucleus}>
          <mesh scale={[0.48, 0.68, 0.42]} rotation={[0.2, 0.4, 0]}>
            <dodecahedronGeometry args={[1, 1]} />
            <MemoryShellMaterial
              body="#343d42"
              depth="#0b0f12"
              accent="#eaf0f3"
              opacity={0.82}
              distortion={0.014}
              energy={() => trialRuntime.alignmentHold}
            />
          </mesh>
          <mesh scale={[0.25, 0.44, 0.22]}>
            <octahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color="#dce5ea" toneMapped={false} />
          </mesh>
          <pointLight
            color="#dce5ea"
            intensity={1.4 + trialRuntime.alignmentHold * 2.2}
            distance={5}
          />
        </group>
      </group>
    </group>
  )
}

function FearArchitecture() {
  const shutters = useRef<InstancedMesh>(null)
  const beat = useExperienceStore((state) => state.trialBeat)

  useLayoutEffect(() => {
    if (!shutters.current) return
    const transform = new Object3D()
    for (let index = 0; index < 10; index += 1) {
      const side = index % 2 ? 1 : -1
      const tier = Math.floor(index / 2)
      transform.position.set(side * (3.65 - tier * 0.18), 0.1, -tier * 1.25 - 0.8)
      transform.rotation.set(0, side * -0.14, side * (0.025 + beat * 0.006))
      transform.scale.set(0.18 + beat * 0.025, 3.75 - tier * 0.1, 0.86)
      transform.updateMatrix()
      shutters.current.setMatrixAt(index, transform.matrix)
    }
    shutters.current.instanceMatrix.needsUpdate = true
  }, [beat])

  return (
    <instancedMesh ref={shutters} args={[undefined, undefined, 10]}>
      <boxGeometry />
      <ArchitecturalMaterial
        body="#100d14"
        edge="#604a6a"
        opacity={0.94}
        variation={0.12}
      />
    </instancedMesh>
  )
}

function FearWorld() {
  const root = useRef<Group>(null)
  const organism = useRef<Group>(null)
  const core = useRef<Group>(null)
  const wave = useRef<Group>(null)
  const left = useRef<Group>(null)
  const up = useRef<Group>(null)
  const right = useRef<Group>(null)
  const ripple = useRef<Group>(null)
  const getPresence = useWorldPresence('fear')
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const assisted = useExperienceStore((state) => state.trialAssisted)
  const beat = useExperienceStore((state) => state.trialBeat)
  const phase = useExperienceStore((state) => state.phase)

  useFrame(({ clock }) => {
    if (
      !root.current ||
      !organism.current ||
      !core.current ||
      !wave.current ||
      !left.current ||
      !up.current ||
      !right.current ||
      !ripple.current
    )
      return
    const presence = getPresence()
    root.current.visible = presence > 0.001
    if (!root.current.visible) return
    root.current.scale.setScalar(Math.max(0.001, presence))
    root.current.position.set(
      0,
      0.08 + trialRuntime.returnProgress * 0.35,
      MathUtils.lerp(-5.45, 0.28, trialRuntime.returnProgress),
    )
    const pulse = trialRuntime.fearPulse
    const impact = MathUtils.smootherstep(pulse, 0.72, 1)
    const direction =
      trialRuntime.fearDirection === 'left'
        ? new Vector3(-1, 0, 0)
        : trialRuntime.fearDirection === 'right'
          ? new Vector3(1, 0, 0)
          : new Vector3(0, 1, 0)
    wave.current.position.copy(direction).multiplyScalar(MathUtils.lerp(5.4, 1.05, pulse))
    wave.current.rotation.z =
      trialRuntime.fearDirection === 'left'
        ? -Math.PI / 2
        : trialRuntime.fearDirection === 'right'
          ? Math.PI / 2
          : Math.PI
    wave.current.scale.setScalar(0.75 + pulse * 1.2)
    const activePetal =
      trialRuntime.fearShield === 'left'
        ? left.current
        : trialRuntime.fearShield === 'right'
          ? right.current
          : trialRuntime.fearShield === 'up'
            ? up.current
            : null
    for (const petal of [left.current, up.current, right.current]) {
      const active = petal === activePetal
      const response = active ? 1 + pulse * 0.24 + impact * 0.18 : 1 - beat * 0.025
      petal.scale.setScalar(response)
      petal.position.z = active ? 0.15 + pulse * 0.22 : 0
    }
    organism.current.scale.setScalar(1 - beat * 0.045 + impact * 0.04)
    organism.current.rotation.z =
      (reducedMotion ? 0 : Math.sin(clock.elapsedTime * 0.28) * 0.015) +
      (assisted ? -0.025 : 0)
    ripple.current.visible = impact > 0.01
    ripple.current.position.copy(direction).multiplyScalar(1.02)
    ripple.current.scale.set(
      0.72 + impact * 0.32,
      0.9 + impact * 0.54,
      0.42 + impact * 0.08,
    )
    ripple.current.rotation.z =
      (trialRuntime.fearDirection === 'left'
        ? -Math.PI / 2
        : trialRuntime.fearDirection === 'right'
          ? Math.PI / 2
          : 0) +
      clock.elapsedTime * (reducedMotion ? 0.005 : 0.025)
    core.current.scale.set(1 - impact * 0.16, 1 - impact * 0.23, 1 + impact * 0.08)
  })

  const petal = (
    ref: React.RefObject<Group | null>,
    direction: 'left' | 'up' | 'right',
    position: [number, number, number],
    rotation: [number, number, number],
  ) => (
    <group ref={ref} position={position} rotation={rotation}>
      <mesh scale={[0.82, 1.28, 0.36]}>
        <sphereGeometry args={[1, 28, 16, 0, Math.PI * 0.68, 0.18, Math.PI * 0.66]} />
        <MemoryShellMaterial
          body="#2a1f31"
          depth="#0b0810"
          accent={direction === trialRuntime.fearDirection ? '#b88ccb' : '#735481'}
          opacity={0.74}
          distortion={0.018}
          energy={() =>
            trialRuntime.fearShield === direction ? trialRuntime.fearPulse : 0.08
          }
        />
      </mesh>
      <mesh position={[0, 0.04, 0.1]} scale={[0.6, 1.02, 0.3]}>
        <sphereGeometry args={[1, 20, 12, 0, Math.PI * 0.68, 0.18, Math.PI * 0.66]} />
        <MemoryShellBackMaterial
          body="#18101e"
          depth="#070609"
          accent="#a574bb"
          opacity={0.3}
          distortion={0.01}
          energy={() => trialRuntime.fearPulse}
        />
      </mesh>
    </group>
  )

  return (
    <group
      ref={root}
      position={[0, 0.08, -5.45]}
      scale={0.001}
      visible={false}
      name="fear-trial"
    >
      <FoundationTrace current="fear" />
      <FearArchitecture />
      <mesh position={[0, 0, -4.8]} scale={[5.5, 4.3, 1]}>
        <planeGeometry />
        <MemoryFieldMaterial
          color="#130d18"
          accent="#9f71b4"
          opacity={0.2}
          distortion={0.08}
          progress={() =>
            phase === 'trial-departure'
              ? trialRuntime.passage
              : phase === 'trial-arrival'
                ? 1 - trialRuntime.arrival
                : phase === 'trial-returning'
                  ? 1 - trialRuntime.returnProgress
                  : 0
          }
        />
      </mesh>
      <group ref={wave}>
        <mesh scale={[2.1, 0.12, 2.6]}>
          <sphereGeometry args={[1, 32, 12, 0, Math.PI * 2, 0, Math.PI * 0.22]} />
          <MemoryFieldMaterial
            color="#3b2847"
            accent="#c095d2"
            opacity={0.7}
            distortion={0.05}
            progress={() => trialRuntime.fearPulse}
          />
        </mesh>
      </group>
      <group ref={organism} position={[0, 0.1, 0.45]}>
        <group ref={core}>
          <mesh scale={[0.66, 0.9, 0.58]}>
            <dodecahedronGeometry args={[1, 1]} />
            <MemoryShellMaterial
              body="#33243b"
              depth="#0d0911"
              accent="#b186c4"
              opacity={0.88}
              distortion={0.024}
              energy={() => trialRuntime.fearPulse}
            />
          </mesh>
          <mesh scale={[0.25, 0.44, 0.2]}>
            <octahedronGeometry args={[1, 1]} />
            <meshBasicMaterial color="#d1acd9" toneMapped={false} />
          </mesh>
          <pointLight color="#a979bd" intensity={2.8} distance={5.5} />
        </group>
        {petal(left, 'left', [-1.25, 0, 0], [0, 0, -Math.PI / 2])}
        {petal(up, 'up', [0, 1.42, 0], [0, 0, 0])}
        {petal(right, 'right', [1.25, 0, 0], [0, 0, Math.PI / 2])}
        <group ref={ripple}>
          <mesh scale={[0.92, 1.36, 0.34]}>
            <sphereGeometry
              args={[1, 32, 14, 0.34, Math.PI * 0.72, 0.22, Math.PI * 0.62]}
            />
            <MemoryShellMaterial
              body="#2a1c32"
              depth="#08060b"
              accent="#c291d4"
              opacity={0.34}
              distortion={0.03}
              energy={() => trialRuntime.fearPulse}
            />
          </mesh>
          <mesh position={[0.08, 0.06, 0.08]} scale={[0.58, 1.02, 0.2]}>
            <sphereGeometry
              args={[1, 24, 12, 0.42, Math.PI * 0.58, 0.28, Math.PI * 0.5]}
            />
            <MemoryShellBackMaterial
              body="#160f1b"
              depth="#070509"
              accent="#e0a7e8"
              opacity={0.24}
              distortion={0.018}
              energy={() => trialRuntime.fearPulse}
            />
          </mesh>
        </group>
        <mesh
          position={[0.32, 0.1, 0.68]}
          rotation={[0, 0, -0.44]}
          scale={[0.018, 0.82 + beat * 0.1 + (assisted ? 0.3 : 0), 0.018]}
        >
          <boxGeometry />
          <meshBasicMaterial color="#c07bca" toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

const HOPE_GATES = [
  { x: -0.72, y: -0.85 },
  { x: 0.64, y: 1.15 },
  { x: 0, y: 3.2 },
] as const

function HopeGate({
  index,
  left,
  right,
}: {
  index: number
  left: React.RefObject<Group | null>
  right: React.RefObject<Group | null>
}) {
  const gate = HOPE_GATES[index]
  return (
    <group position={[gate.x, gate.y, 0]}>
      <group ref={left} position={[-0.82, 0, 0]}>
        <mesh scale={[0.42, 1.25, 0.4]}>
          <sphereGeometry args={[1, 28, 16, 0, Math.PI, 0.16, Math.PI * 0.7]} />
          <MemoryShellMaterial
            body="#3a2c1b"
            depth="#0f0b07"
            accent="#e2b96f"
            opacity={0.72}
            distortion={0.026}
            energy={() => trialRuntime.beatEnergy}
          />
        </mesh>
      </group>
      <group ref={right} position={[0.82, 0, 0]} scale={[-1, 1, 1]}>
        <mesh scale={[0.42, 1.25, 0.4]}>
          <sphereGeometry args={[1, 28, 16, 0, Math.PI, 0.16, Math.PI * 0.7]} />
          <MemoryShellMaterial
            body="#3a2c1b"
            depth="#0f0b07"
            accent="#e2b96f"
            opacity={0.72}
            distortion={0.026}
            energy={() => trialRuntime.beatEnergy}
          />
        </mesh>
      </group>
      <mesh position={[0, 0, -0.12]} scale={[1.1, 0.025, 0.025]}>
        <boxGeometry />
        <EnergyFilamentMaterial
          color="#9e7139"
          hot="#ffe0a0"
          opacity={0.52}
          rhythm={1.1 + index * 0.14}
          energy={() => trialRuntime.beatEnergy}
        />
      </mesh>
    </group>
  )
}

function HopeWorld() {
  const root = useRef<Group>(null)
  const signal = useRef<Group>(null)
  const canopy = useRef<Group>(null)
  const gateLeft = [useRef<Group>(null), useRef<Group>(null), useRef<Group>(null)]
  const gateRight = [useRef<Group>(null), useRef<Group>(null), useRef<Group>(null)]
  const getPresence = useWorldPresence('hope')
  const beat = useExperienceStore((state) => state.trialBeat)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const phase = useExperienceStore((state) => state.phase)

  const branches = useMemo(
    () =>
      [-1, 1].flatMap((side) =>
        [0, 1, 2].map(
          (lane) =>
            new CatmullRomCurve3([
              new Vector3(side * (0.12 + lane * 0.1), -3.1, -0.45 - lane * 0.1),
              new Vector3(side * (0.35 + lane * 0.22), -1.2 + lane * 0.15, -0.55),
              new Vector3(side * (0.82 + lane * 0.36), 1.1 + lane * 0.42, -0.72),
              new Vector3(side * (1.45 + lane * 0.52), 4.5 - lane * 0.18, -1.05),
            ]),
        ),
      ),
    [],
  )

  useFrame(({ clock }) => {
    if (!root.current || !signal.current || !canopy.current) return
    const presence = getPresence()
    root.current.visible = presence > 0.001
    if (!root.current.visible) return
    root.current.scale.setScalar(Math.max(0.001, presence))
    root.current.position.set(
      0,
      MathUtils.lerp(-0.48, 0.72, trialRuntime.returnProgress),
      MathUtils.lerp(-5.7, 0.32, trialRuntime.returnProgress),
    )
    signal.current.position.set(trialRuntime.hopeSignalX, trialRuntime.hopeSignalY, 0.8)
    const breath = reducedMotion ? 1 : 1 + Math.sin(clock.elapsedTime * 2.05) * 0.07
    signal.current.scale.setScalar((0.2 + beat * 0.045) * breath)
    HOPE_GATES.forEach((gate, index) => {
      const proximity =
        1 -
        MathUtils.clamp(
          Math.abs(trialRuntime.hopeSignalY - gate.y) * 0.42 +
            Math.abs(trialRuntime.hopeSignalX - gate.x) * 0.32,
          0,
          1,
        )
      const opened = index < beat ? 1 : index === beat ? proximity : 0
      const left = gateLeft[index].current
      const right = gateRight[index].current
      if (left && right) {
        left.position.x = -0.82 - opened * 0.38
        right.position.x = 0.82 + opened * 0.38
        left.rotation.z = opened * 0.36
        right.rotation.z = -opened * 0.36
        left.scale.setScalar(1 + opened * 0.08)
        right.scale.set(-1 - opened * 0.08, 1 + opened * 0.08, 1 + opened * 0.08)
      }
    })
    canopy.current.position.y = beat * 0.22
    canopy.current.scale.set(1 + beat * 0.08, 1 + beat * 0.16, 1 + beat * 0.08)
  })

  return (
    <group
      ref={root}
      position={[0, -0.48, -5.7]}
      scale={0.001}
      visible={false}
      name="hope-trial"
    >
      <FoundationTrace current="hope" />
      <mesh position={[0, 0.8, -5.2]} scale={[6.3, 6.8, 1]}>
        <planeGeometry />
        <MemoryFieldMaterial
          color="#151006"
          accent="#d7a95b"
          opacity={0.18}
          distortion={0.1}
          progress={() =>
            phase === 'trial-departure'
              ? trialRuntime.passage
              : phase === 'trial-arrival'
                ? 1 - trialRuntime.arrival
                : phase === 'trial-returning'
                  ? 1 - trialRuntime.returnProgress
                  : 0
          }
        />
      </mesh>
      <group ref={canopy} position={[0, 0, -1.15]}>
        {branches.map((curve, index) => (
          <mesh key={index}>
            <tubeGeometry args={[curve, 52, index % 3 === 0 ? 0.035 : 0.022, 6, false]} />
            <EnergyFilamentMaterial
              color={index % 3 === 2 ? '#86602f' : '#b48343'}
              hot="#f5ca78"
              opacity={index < (beat + 1) * 2 ? 0.72 : 0.22}
              rhythm={1.1 + (index % 3) * 0.32}
              energy={() => trialRuntime.beatEnergy}
            />
          </mesh>
        ))}
      </group>
      {HOPE_GATES.map((_, index) => (
        <HopeGate
          key={index}
          index={index}
          left={gateLeft[index]}
          right={gateRight[index]}
        />
      ))}
      {[-2.8, -2.05, 2.05, 2.8].map((x, index) => (
        <mesh
          key={x}
          position={[x, 1 + index * 0.28, -1.6]}
          rotation={[0, 0, x * 0.055]}
          scale={[0.1, 4.7, 0.35]}
        >
          <boxGeometry />
          <ArchitecturalMaterial
            body="#15130f"
            edge="#735c38"
            opacity={0.82}
            variation={0.1}
          />
        </mesh>
      ))}
      <Trail
        width={0.28}
        length={3.8}
        decay={1.35}
        color="#e6b963"
        stride={0.018}
        interval={1}
        attenuation={(width) => width * width}
      >
        <group ref={signal}>
          <mesh scale={[0.88, 1.2, 0.78]}>
            <dodecahedronGeometry args={[1, 1]} />
            <MemoryShellMaterial
              body="#5a3e1d"
              depth="#120c05"
              accent="#ffdaa0"
              opacity={0.88}
              distortion={0.06}
              energy={() => trialRuntime.beatEnergy}
            />
          </mesh>
          <mesh scale={[0.33, 0.52, 0.28]} rotation={[0.2, 0.3, 0]}>
            <octahedronGeometry args={[1, 1]} />
            <meshBasicMaterial color="#ffe0a0" toneMapped={false} />
          </mesh>
          <pointLight color="#e5b468" intensity={3.2} distance={5.5} />
        </group>
      </Trail>
    </group>
  )
}

export function TrialWorlds({ includeIdentity = true }: { includeIdentity?: boolean }) {
  return (
    <group name="memory-trial-worlds">
      {includeIdentity && <IdentityWorld />}
      <FearWorld />
      <HopeWorld />
    </group>
  )
}
