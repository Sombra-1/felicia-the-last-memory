import { Trail } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
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
import {
  ArchitecturalMaterial,
  EnergyFilamentMaterial,
  MemoryFieldMaterial,
  MemoryGlassMaterial,
  MemoryShellMaterial,
} from '../materials/MemoryMaterials'
import { useExperienceStore } from '../state/experienceStore'
import { trialRuntime } from './trialRuntime'

const HOPE_GATES = [
  { x: -0.72, y: -0.85 },
  { x: 0.64, y: 1.15 },
  { x: 0, y: 3.2 },
] as const

const GROWTH_EXTRUSION = {
  depth: 0.28,
  bevelEnabled: true,
  bevelSegments: 3,
  steps: 1,
  bevelSize: 0.055,
  bevelThickness: 0.055,
} as const

function useGrowthShape() {
  return useMemo(() => {
    const shape = new Shape()
    shape.moveTo(-0.12, -1.34)
    shape.bezierCurveTo(-0.54, -0.68, -0.62, 0.22, -0.28, 1.18)
    shape.bezierCurveTo(-0.08, 1.58, 0.18, 1.48, 0.28, 1.02)
    shape.bezierCurveTo(0.5, 0.12, 0.36, -0.78, -0.12, -1.34)
    shape.closePath()
    return shape
  }, [])
}

function GrowthLeaf({ active, completed }: { active: boolean; completed: boolean }) {
  const shape = useGrowthShape()
  return (
    <mesh>
      <extrudeGeometry args={[shape, GROWTH_EXTRUSION]} />
      <MemoryGlassMaterial
        body="#2d2317"
        accent={active ? '#dfb66d' : completed ? '#9d7744' : '#725630'}
        opacity={active ? 0.74 : completed ? 0.16 : 0.22}
        roughness={0.2}
        transmission={0}
        thickness={0.82}
        side={DoubleSide}
      />
    </mesh>
  )
}

function HopeSpire({ depth }: { depth: number }) {
  const shape = useMemo(() => {
    const spire = new Shape()
    spire.moveTo(-0.62, -3.7)
    spire.lineTo(0.5, -3.28)
    spire.bezierCurveTo(0.3, -1.1, 0.78, 1.18, 0.2, 3.56)
    spire.lineTo(-0.22, 4.36)
    spire.lineTo(-0.58, 3.2)
    spire.bezierCurveTo(-0.3, 1.12, -0.78, -1.3, -0.62, -3.7)
    spire.closePath()
    return spire
  }, [])

  return (
    <mesh>
      <extrudeGeometry
        args={[
          shape,
          {
            depth: 0.52,
            bevelEnabled: true,
            bevelSegments: 3,
            steps: 1,
            bevelSize: 0.075,
            bevelThickness: 0.075,
          },
        ]}
      />
      <ArchitecturalMaterial
        body="#0a0908"
        edge={depth === 0 ? '#675033' : '#3d3122'}
        opacity={depth === 0 ? 0.98 : 0.86}
        variation={0.1}
        brush={0.038}
        relief={0.026}
        side={DoubleSide}
      />
    </mesh>
  )
}

function OrganicGate({
  index,
  left,
  right,
  growth,
  active,
  completed,
}: {
  index: number
  left: React.RefObject<Group | null>
  right: React.RefObject<Group | null>
  growth: React.RefObject<Group | null>
  active: boolean
  completed: boolean
}) {
  const gate = HOPE_GATES[index]
  const stem = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(0, -1.42, -0.04),
        new Vector3(-0.12, -0.46, 0.16),
        new Vector3(0.08, 0.46, 0.18),
        new Vector3(0, 1.42, -0.02),
      ]),
    [],
  )

  return (
    <group position={[gate.x, gate.y, -3.92]}>
      <group ref={left} position={[-0.74, 0, 0]} rotation={[0, -0.08, -0.12]}>
        <GrowthLeaf active={active} completed={completed} />
      </group>
      <group
        ref={right}
        position={[0.74, 0, 0]}
        rotation={[0, 0.08, 0.12]}
        scale={[-1, 1, 1]}
      >
        <GrowthLeaf active={active} completed={completed} />
      </group>
      <mesh position={[0, 0, 0.22]}>
        <tubeGeometry args={[stem, 34, active ? 0.028 : 0.018, 7, false]} />
        <EnergyFilamentMaterial
          color="#9e7137"
          hot="#ffe0a2"
          opacity={active ? 0.9 : 0.44}
          rhythm={1.04 + index * 0.12}
          energy={() => Math.max(trialRuntime.beatEnergy, trialRuntime.inputEnergy)}
        />
      </mesh>
      <group ref={growth} position={[0, -1.42, -0.12]} scale={0.001}>
        {[-1, 1].map((side) => (
          <mesh key={side} rotation={[0, 0, side * -0.34]}>
            <tubeGeometry
              args={[
                new CatmullRomCurve3([
                  new Vector3(0, 0, 0),
                  new Vector3(side * 0.28, 0.44, 0.08),
                  new Vector3(side * 0.62, 0.82, 0),
                  new Vector3(side * 0.9, 1.22, -0.12),
                ]),
                30,
                0.025,
                7,
                false,
              ]}
            />
            <EnergyFilamentMaterial
              color="#8c6535"
              hot="#eec47e"
              opacity={0.68}
              rhythm={0.94 + index * 0.11}
              energy={() => trialRuntime.beatEnergy}
            />
          </mesh>
        ))}
      </group>
      <pointLight
        color="#d5a960"
        intensity={active ? 1.8 + trialRuntime.beatEnergy * 2.2 : 0.35}
        distance={4.8}
        decay={2}
      />
    </group>
  )
}

function RisingMemoryRain() {
  const particles = useRef<InstancedMesh>(null)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const seeds = useMemo(
    () =>
      Array.from({ length: 24 }, (_, index) => ({
        x: ((index * 1.73) % 5.4) - 2.7,
        y: ((index * 2.17) % 7.2) - 3.4,
        z: -5.2 - (index % 5) * 0.36,
        speed: 0.18 + (index % 7) * 0.035,
        scale: 0.015 + (index % 3) * 0.006,
      })),
    [],
  )

  useLayoutEffect(() => {
    if (!particles.current) return
    particles.current.instanceMatrix.setUsage(35048)
  }, [])

  useFrame(({ clock }) => {
    if (!particles.current) return
    const transform = new Object3D()
    seeds.forEach((seed, index) => {
      const travel = reducedMotion
        ? 0
        : (clock.elapsedTime * seed.speed + index * 0.11) % 1
      transform.position.set(seed.x, seed.y + travel * 5.8, seed.z)
      transform.scale.set(seed.scale, seed.scale * 5.5, seed.scale)
      transform.updateMatrix()
      particles.current?.setMatrixAt(index, transform.matrix)
    })
    particles.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={particles} args={[undefined, undefined, seeds.length]}>
      <capsuleGeometry args={[1, 0.7, 3, 5]} />
      <meshBasicMaterial
        color="#c49350"
        transparent
        opacity={0.34}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  )
}

function LivingSignal({ signalRef }: { signalRef: React.RefObject<Group | null> }) {
  return (
    <Trail
      width={0.34}
      length={5.4}
      decay={1.45}
      color="#e7ba68"
      stride={0.012}
      interval={1}
      attenuation={(width) => width * width}
    >
      <group ref={signalRef} position={[-0.42, -2.8, -3.62]}>
        <mesh scale={[0.28, 0.46, 0.22]} rotation={[0.16, 0.28, 0]}>
          <dodecahedronGeometry args={[1, 2]} />
          <MemoryGlassMaterial
            body="#4a351d"
            accent="#efc77f"
            opacity={0.86}
            roughness={0.17}
            transmission={0}
            thickness={0.84}
          />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[side * 0.2, 0.1, 0]}
            rotation={[0, side * -0.16, side * -0.42]}
            scale={[0.14, 0.32, 0.1]}
          >
            <sphereGeometry args={[1, 22, 12]} />
            <MemoryShellMaterial
              body="#49331b"
              depth="#0c0804"
              accent="#f2ca83"
              opacity={0.62}
              distortion={0.026}
              thickness={0.74}
              energy={() => Math.max(trialRuntime.inputEnergy, trialRuntime.beatEnergy)}
            />
          </mesh>
        ))}
        <mesh position={[0, 0.48, 0]}>
          <tubeGeometry
            args={[
              new CatmullRomCurve3([
                new Vector3(0, -0.12, 0),
                new Vector3(0.08, 0.12, 0.12),
                new Vector3(-0.05, 0.38, 0.08),
              ]),
              20,
              0.026,
              7,
              false,
            ]}
          />
          <EnergyFilamentMaterial
            color="#b6813e"
            hot="#ffe1a0"
            opacity={0.96}
            rhythm={1.18}
            energy={() => Math.max(trialRuntime.inputEnergy, trialRuntime.beatEnergy)}
          />
        </mesh>
        <pointLight
          color="#e7b865"
          intensity={2.4 + trialRuntime.inputEnergy * 2.2}
          distance={5.4}
          decay={2}
        />
      </group>
    </Trail>
  )
}

export function Phase8HopeTrial() {
  const root = useRef<Group>(null)
  const architecture = useRef<Group>(null)
  const signal = useRef<Group>(null)
  const gateLeft = [useRef<Group>(null), useRef<Group>(null), useRef<Group>(null)]
  const gateRight = [useRef<Group>(null), useRef<Group>(null), useRef<Group>(null)]
  const gateGrowth = [useRef<Group>(null), useRef<Group>(null), useRef<Group>(null)]
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const phase = useExperienceStore((state) => state.phase)
  const beat = useExperienceStore((state) => state.trialBeat)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)

  useFrame(({ clock }, delta) => {
    if (!root.current || !architecture.current || !signal.current) return
    const active = activeFragment === 'hope' && phase.startsWith('trial-')
    const presence = active
      ? phase === 'trial-departure'
        ? MathUtils.smootherstep(trialRuntime.passage, 0.02, 1)
        : phase === 'trial-returning'
          ? 1 - MathUtils.smootherstep(trialRuntime.returnProgress, 0.05, 0.98)
          : 1
      : 0
    root.current.visible = presence > 0.002
    if (!root.current.visible) return

    signal.current.position.set(trialRuntime.hopeSignalX, trialRuntime.hopeSignalY, -3.62)
    signal.current.rotation.z = MathUtils.damp(
      signal.current.rotation.z,
      trialRuntime.pointerX * -0.18,
      reducedMotion ? 14 : 5,
      delta,
    )
    const signalPulse = reducedMotion ? 1 : 1 + Math.sin(clock.elapsedTime * 2.1) * 0.055
    signal.current.scale.setScalar(signalPulse * (0.86 + trialRuntime.inputEnergy * 0.14))

    HOPE_GATES.forEach((gate, index) => {
      const proximity =
        1 -
        MathUtils.clamp(
          Math.abs(trialRuntime.hopeSignalY - gate.y) * 0.38 +
            Math.abs(trialRuntime.hopeSignalX - gate.x) * 0.34,
          0,
          1,
        )
      const opened = index < beat ? 1 : index === beat ? proximity : 0
      const left = gateLeft[index].current
      const right = gateRight[index].current
      const growth = gateGrowth[index].current
      if (left && right) {
        const dormantScale = index > beat ? 0.78 : 1
        left.position.x = MathUtils.damp(
          left.position.x,
          -0.74 - opened * 0.56,
          reducedMotion ? 14 : 3.4,
          delta,
        )
        right.position.x = MathUtils.damp(
          right.position.x,
          0.74 + opened * 0.56,
          reducedMotion ? 14 : 3.4,
          delta,
        )
        left.rotation.z = -0.12 - opened * 0.48
        right.rotation.z = 0.12 + opened * 0.48
        left.scale.setScalar(dormantScale)
        right.scale.set(-dormantScale, dormantScale, dormantScale)
      }
      if (growth) {
        const permanent = index < beat ? 1 : opened * 0.72
        growth.scale.setScalar(Math.max(0.001, permanent))
      }
    })

    architecture.current.children.forEach((child, index) => {
      const side = index % 2 === 0 ? -1 : 1
      const depth = Math.floor(index / 2)
      const opening = presence * (0.24 + beat * 0.18 + trialRuntime.beatEnergy * 0.12)
      child.position.set(
        side * (3.05 + depth * 0.28 + opening * (0.5 + depth * 0.1)),
        0.45 + depth * 0.62 + opening * 0.3,
        -4.6 - depth * 1.64,
      )
      child.rotation.set(0, side * -0.08, side * (-0.02 - opening * 0.035))
      child.scale.set(side * (0.54 - depth * 0.05), 1 + depth * 0.08, 0.68)
    })

    root.current.scale.setScalar(Math.max(0.001, presence))
    root.current.position.y = MathUtils.damp(
      root.current.position.y,
      MathUtils.lerp(-0.6, 0, presence),
      reducedMotion ? 14 : 2.6,
      delta,
    )
  })

  return (
    <group ref={root} visible={false} name="phase8-hope-cathedral-rupture">
      <group ref={architecture}>
        {[0, 1].flatMap((depth) =>
          [-1, 1].map((side) => (
            <group key={`${depth}-${side}`}>
              <HopeSpire depth={depth} />
            </group>
          )),
        )}
      </group>
      {HOPE_GATES.map((_, index) => (
        <OrganicGate
          key={index}
          index={index}
          left={gateLeft[index]}
          right={gateRight[index]}
          growth={gateGrowth[index]}
          active={index === beat}
          completed={index < beat}
        />
      ))}
      <LivingSignal signalRef={signal} />
      <RisingMemoryRain />
      <mesh position={[0, 0.65, -9.2]} scale={[6.2, 6.8, 1]}>
        <planeGeometry />
        <MemoryFieldMaterial
          color="#0f0c07"
          accent="#c99750"
          opacity={0.13}
          distortion={0.055}
          progress={() =>
            phase === 'trial-departure'
              ? trialRuntime.passage
              : phase === 'trial-returning'
                ? 1 - trialRuntime.returnProgress
                : Math.min(1, beat * 0.28 + trialRuntime.beatEnergy * 0.3)
          }
        />
      </mesh>
    </group>
  )
}
