import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BackSide,
  CatmullRomCurve3,
  Group,
  InstancedMesh,
  MathUtils,
  Object3D,
  Vector3,
} from 'three'
import { PALETTE } from './config/visual'
import { entranceRuntime } from '../experience/entranceRuntime'
import { sequenceRuntime } from '../experience/sequenceRuntime'
import { deriveEndingConfiguration } from '../reconstruction/endingProfiles'
import { reconstructionRuntime } from '../reconstruction/reconstructionRuntime'
import { useExperienceStore } from '../state/experienceStore'

function CoreRibs() {
  const ribs = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!ribs.current) return
    const transform = new Object3D()

    for (let index = 0; index < 8; index += 1) {
      const t = index / 7
      transform.position.set(0, 1.47 - t * 2.56, -0.08)
      transform.rotation.set(Math.PI / 2, 0, Math.PI * 0.055 * (index % 2 ? 1 : -1))
      const scale = 0.42 + Math.sin(t * Math.PI) * 0.62
      transform.scale.set(scale, scale, 0.78)
      transform.updateMatrix()
      ribs.current.setMatrixAt(index, transform.matrix)
    }

    ribs.current.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <instancedMesh ref={ribs} args={[undefined, undefined, 8]}>
      <torusGeometry args={[0.9, 0.034, 6, 48, Math.PI * 1.18]} />
      <meshStandardMaterial
        color="#817b86"
        emissive="#2d2734"
        emissiveIntensity={0.42}
        metalness={0.9}
        roughness={0.31}
      />
    </instancedMesh>
  )
}

function NeuralFilaments() {
  const curves = useMemo(
    () => [
      new CatmullRomCurve3([
        new Vector3(-0.38, -0.92, 0.02),
        new Vector3(0.18, -0.4, 0.28),
        new Vector3(-0.26, 0.18, 0.34),
        new Vector3(0.22, 0.92, 0.05),
      ]),
      new CatmullRomCurve3([
        new Vector3(0.34, -0.82, -0.02),
        new Vector3(-0.2, -0.24, 0.18),
        new Vector3(0.3, 0.36, 0.3),
        new Vector3(-0.12, 0.98, 0.04),
      ]),
      new CatmullRomCurve3([
        new Vector3(-0.48, -0.54, -0.08),
        new Vector3(-0.08, -0.12, 0.36),
        new Vector3(0.44, 0.2, 0.08),
        new Vector3(0.3, 0.78, -0.06),
      ]),
      new CatmullRomCurve3([
        new Vector3(0.48, -0.46, -0.04),
        new Vector3(0.08, -0.02, 0.4),
        new Vector3(-0.4, 0.42, 0.12),
        new Vector3(-0.28, 0.82, -0.08),
      ]),
    ],
    [],
  )

  return (
    <>
      {curves.map((curve, index) => (
        <mesh key={index}>
          <tubeGeometry args={[curve, 36, index % 2 ? 0.018 : 0.026, 6, false]} />
          <meshStandardMaterial
            color={index % 2 ? '#b8a9c3' : '#e1d8e7'}
            emissive={index % 2 ? '#665373' : '#9b8aa7'}
            emissiveIntensity={0.9}
            metalness={0.18}
            roughness={0.42}
          />
        </mesh>
      ))}
    </>
  )
}

function CoreShards() {
  const shards = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!shards.current) return
    const transform = new Object3D()

    for (let index = 0; index < 9; index += 1) {
      const angle = index * 2.31
      const radius = 0.92 + (index % 3) * 0.24
      transform.position.set(
        Math.sin(angle) * radius,
        -0.85 + (index % 6) * 0.34,
        Math.cos(angle) * radius * 0.55,
      )
      transform.rotation.set(index * 0.57, index * 0.34, index * 0.73)
      transform.scale.setScalar(0.1 + (index % 3) * 0.04)
      transform.updateMatrix()
      shards.current.setMatrixAt(index, transform.matrix)
    }

    shards.current.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <instancedMesh ref={shards} args={[undefined, undefined, 9]}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#77717f"
        metalness={0.82}
        roughness={0.34}
        transparent
        opacity={0.54}
      />
    </instancedMesh>
  )
}

function InternalMemorySystem() {
  const system = useRef<Group>(null)
  const orbiters = useRef<InstancedMesh>(null)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const phase = useExperienceStore((state) => state.phase)

  useFrame(({ clock }) => {
    if (!system.current || !orbiters.current) return
    const time = clock.elapsedTime
    const reveal = activeFragment ? sequenceRuntime.visualProgress : 0
    const motion = reducedMotion ? 0.08 : 1
    const direction = activeFragment === 'fear' ? -1 : 1
    system.current.rotation.y =
      time * 0.11 * motion * direction +
      (activeFragment === 'identity' ? reveal * Math.PI * 0.25 : 0)
    system.current.rotation.z =
      (reducedMotion ? 0.08 : Math.sin(time * 0.23) * 0.12) +
      (activeFragment === 'hope' ? reveal * 0.22 : 0)

    const transform = new Object3D()
    for (let index = 0; index < 14; index += 1) {
      const lane = index % 3
      const angle = time * (0.24 + lane * 0.06) * motion + index * 2.399
      const radius = 0.48 + lane * 0.19 + reveal * (activeFragment === 'hope' ? 0.12 : 0)
      transform.position.set(
        Math.cos(angle) * radius,
        0.12 + Math.sin(angle * 1.7 + index) * (0.72 + lane * 0.08),
        Math.sin(angle) * radius * 0.62,
      )
      transform.scale.setScalar(0.018 + (index % 4) * 0.005)
      transform.updateMatrix()
      orbiters.current.setMatrixAt(index, transform.matrix)
    }
    orbiters.current.instanceMatrix.needsUpdate = true

    const awakening =
      phase === 'ready-for-reconstruction' ||
      phase.startsWith('reconstruction-') ||
      phase === 'ending'
        ? 1.12
        : 1
    system.current.scale.setScalar(MathUtils.lerp(0.45, awakening, entranceRuntime.core))
  })

  return (
    <group ref={system} position={[0, 0.28, 0.16]}>
      <mesh rotation={[Math.PI / 2.6, 0.2, 0]}>
        <torusGeometry args={[0.62, 0.026, 6, 72, Math.PI * 1.55]} />
        <meshBasicMaterial
          color="#d8d2df"
          transparent
          opacity={0.56}
          toneMapped={false}
        />
      </mesh>
      <mesh rotation={[0.25, Math.PI / 2.2, 0.58]}>
        <torusGeometry args={[0.76, 0.018, 6, 72, Math.PI * 1.35]} />
        <meshBasicMaterial
          color="#8f7fa2"
          transparent
          opacity={0.42}
          toneMapped={false}
        />
      </mesh>
      <mesh scale={[0.46, 0.72, 0.42]}>
        <icosahedronGeometry args={[1, 2]} />
        <meshPhysicalMaterial
          color="#33283b"
          emissive="#887394"
          emissiveIntensity={1.15}
          metalness={0.24}
          roughness={0.34}
          transparent
          opacity={0.76}
          clearcoat={0.18}
        />
      </mesh>
      <mesh scale={[0.23, 0.42, 0.21]}>
        <octahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#fff8ff" transparent opacity={0.7} />
      </mesh>
      <instancedMesh ref={orbiters} args={[undefined, undefined, 14]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial color="#d9cfe2" toneMapped={false} />
      </instancedMesh>
    </group>
  )
}

export function FeliciaCore() {
  const core = useRef<Group>(null)
  const light = useRef<Group>(null)
  const leftShell = useRef<Group>(null)
  const rightShell = useRef<Group>(null)
  const rearShell = useRef<Group>(null)
  const neuralSystem = useRef<Group>(null)
  const innerCore = useRef<Group>(null)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const phase = useExperienceStore((state) => state.phase)
  const collectionOrder = useExperienceStore((state) => state.collectionOrder)
  const ending = useMemo(
    () => deriveEndingConfiguration(collectionOrder),
    [collectionOrder],
  )

  useFrame(({ clock }, delta) => {
    if (
      !core.current ||
      !light.current ||
      !leftShell.current ||
      !rightShell.current ||
      !rearShell.current ||
      !neuralSystem.current ||
      !innerCore.current
    )
      return
    const time = clock.elapsedTime
    const reveal = activeFragment ? sequenceRuntime.visualProgress : 0
    const fearContraction = activeFragment === 'fear' ? reveal * 0.12 : 0
    const hopeAwakening =
      activeFragment === 'hope'
        ? reveal * 0.055
        : phase === 'ready-for-reconstruction'
          ? 0.08
          : 0
    const collapse = reconstructionRuntime.collapse
    const voided = phase === 'reconstruction-void' || phase === 'reconstruction-recall'
    const rebuilt =
      phase === 'reconstruction-rebuilding'
        ? reconstructionRuntime.rebuild
        : phase === 'reconstruction-reveal' || phase === 'ending'
          ? 1
          : 0
    const profile = ending?.profile
    const baseScale = voided
      ? 0.12
      : rebuilt > 0
        ? MathUtils.lerp(0.12, 0.92 + (profile?.felicia.expansion ?? 0) * 0.18, rebuilt)
        : MathUtils.lerp(1, 0.12, collapse)
    const entranceScale = MathUtils.lerp(0.58, 1, entranceRuntime.core)
    const drift =
      reducedMotion || phase.startsWith('reconstruction-')
        ? 0
        : Math.sin(time * 0.38) * 0.055
    core.current.position.y = MathUtils.damp(
      core.current.position.y,
      drift + rebuilt * (profile?.felicia.expansion ?? 0) * 0.32,
      reducedMotion ? 20 : 1,
      delta,
    )
    core.current.rotation.y = MathUtils.damp(
      core.current.rotation.y,
      rebuilt > 0
        ? (1 - (profile?.felicia.coherence ?? 1)) * 0.28
        : activeFragment === 'identity' || reducedMotion
          ? 0
          : Math.sin(time * 0.17) * 0.06,
      reducedMotion ? 20 : 0.7,
      delta,
    )
    core.current.scale.x = MathUtils.damp(
      core.current.scale.x,
      baseScale *
        entranceScale *
        (1 - fearContraction * 0.5 + hopeAwakening) *
        (1 - (profile?.felicia.protection ?? 0) * rebuilt * 0.12),
      reducedMotion ? 20 : 2,
      delta,
    )
    core.current.scale.y = MathUtils.damp(
      core.current.scale.y,
      baseScale * entranceScale * (1 - fearContraction + hopeAwakening + rebuilt * 0.12),
      reducedMotion ? 20 : 2,
      delta,
    )
    core.current.scale.z = MathUtils.damp(
      core.current.scale.z,
      baseScale * entranceScale * (1 - fearContraction * 0.42 + hopeAwakening * 0.7),
      reducedMotion ? 20 : 2,
      delta,
    )

    const hopeOpening =
      (activeFragment === 'hope' ? reveal * 0.12 : 0) +
      (profile?.id === 'hope' ? rebuilt * 0.48 : 0)
    const fearGuard = profile?.id === 'fear' ? rebuilt : 0
    const identityAlignment = profile?.id === 'identity' ? rebuilt : 0
    const leftX = -0.3 - hopeOpening - identityAlignment * 0.08 + fearGuard * 0.1
    const rightX = 0.3 + hopeOpening + identityAlignment * 0.08 + fearGuard * 0.02
    leftShell.current.position.x = MathUtils.damp(
      leftShell.current.position.x,
      leftX,
      reducedMotion ? 20 : 2,
      delta,
    )
    rightShell.current.position.x = MathUtils.damp(
      rightShell.current.position.x,
      rightX,
      reducedMotion ? 20 : 2,
      delta,
    )
    leftShell.current.position.y = MathUtils.damp(
      leftShell.current.position.y,
      0.76 + hopeOpening * 0.32 - fearGuard * 0.08,
      reducedMotion ? 20 : 2,
      delta,
    )
    rightShell.current.position.y = MathUtils.damp(
      rightShell.current.position.y,
      0.76 + hopeOpening * 0.7 + fearGuard * 0.12,
      reducedMotion ? 20 : 2,
      delta,
    )
    leftShell.current.rotation.z = MathUtils.damp(
      leftShell.current.rotation.z,
      hopeOpening * 0.62 - fearGuard * 0.12,
      reducedMotion ? 20 : 2,
      delta,
    )
    rightShell.current.rotation.z = MathUtils.damp(
      rightShell.current.rotation.z,
      -hopeOpening * 0.62 + fearGuard * 0.2,
      reducedMotion ? 20 : 2,
      delta,
    )
    rearShell.current.position.z = MathUtils.damp(
      rearShell.current.position.z,
      -0.38 - hopeOpening * 0.5 + fearGuard * 0.12,
      reducedMotion ? 20 : 1.6,
      delta,
    )
    neuralSystem.current.position.y = MathUtils.damp(
      neuralSystem.current.position.y,
      0.72 + hopeOpening * 1.05,
      reducedMotion ? 20 : 1.8,
      delta,
    )
    neuralSystem.current.scale.y = MathUtils.damp(
      neuralSystem.current.scale.y,
      1 + hopeOpening * 0.9 - fearGuard * 0.12,
      reducedMotion ? 20 : 1.8,
      delta,
    )
    neuralSystem.current.rotation.y =
      (reducedMotion ? 0.08 : time * 0.07) + fearGuard * -0.18
    const coreExpansion =
      1 + hopeOpening * 0.95 + identityAlignment * 0.08 - fearGuard * 0.16
    innerCore.current.scale.set(
      MathUtils.damp(innerCore.current.scale.x, coreExpansion, 2.2, delta),
      MathUtils.damp(
        innerCore.current.scale.y,
        coreExpansion + hopeOpening * 0.35,
        2.2,
        delta,
      ),
      MathUtils.damp(innerCore.current.scale.z, coreExpansion, 2.2, delta),
    )
    const pulse =
      0.86 +
      (reducedMotion
        ? 0
        : Math.sin(time * (phase === 'ready-for-reconstruction' ? 2.1 : 1.15)) *
          (phase === 'ready-for-reconstruction' ? 0.14 : 0.07)) +
      hopeAwakening
    light.current.scale.setScalar(
      pulse * (voided ? 0.28 : 1 + rebuilt * (profile?.felicia.coherence ?? 0) * 0.3),
    )
  })

  return (
    <group ref={core} position={[0, 0.05, 0]} scale={1.08}>
      <group ref={rearShell} position={[0, 0.76, -0.38]}>
        <mesh scale={[0.76, 1.08, 0.66]}>
          <sphereGeometry args={[1, 28, 20]} />
          <meshPhysicalMaterial
            color="#292630"
            emissive="#41364a"
            emissiveIntensity={0.46}
            metalness={0.68}
            roughness={0.38}
            transparent
            opacity={0.96}
            clearcoat={0.16}
          />
        </mesh>
        <mesh scale={[0.81, 1.14, 0.72]}>
          <sphereGeometry args={[1, 24, 18]} />
          <meshBasicMaterial
            color="#8f7ca0"
            transparent
            opacity={0.13}
            blending={AdditiveBlending}
            depthWrite={false}
            side={BackSide}
            toneMapped={false}
          />
        </mesh>
      </group>
      <group ref={leftShell} position={[-0.3, 0.76, 0]}>
        <mesh scale={[0.44, 1.08, 0.7]}>
          <sphereGeometry args={[1, 32, 22]} />
          <meshPhysicalMaterial
            color="#5a5260"
            emissive="#493d51"
            emissiveIntensity={0.38}
            metalness={0.68}
            roughness={0.36}
            transparent
            opacity={0.72}
            clearcoat={0.14}
          />
        </mesh>
        <mesh scale={[0.48, 1.13, 0.75]}>
          <sphereGeometry args={[1, 24, 18]} />
          <meshBasicMaterial
            color="#b2a5bc"
            transparent
            opacity={0.22}
            blending={AdditiveBlending}
            depthWrite={false}
            side={BackSide}
            toneMapped={false}
          />
        </mesh>
      </group>
      <group ref={rightShell} position={[0.3, 0.76, 0.02]}>
        <mesh scale={[0.44, 1.08, 0.7]}>
          <sphereGeometry args={[1, 32, 22]} />
          <meshPhysicalMaterial
            color="#514957"
            emissive="#504058"
            emissiveIntensity={0.42}
            metalness={0.66}
            roughness={0.35}
            transparent
            opacity={0.7}
            clearcoat={0.14}
          />
        </mesh>
        <mesh scale={[0.48, 1.13, 0.75]}>
          <sphereGeometry args={[1, 24, 18]} />
          <meshBasicMaterial
            color="#ae9bb8"
            transparent
            opacity={0.22}
            blending={AdditiveBlending}
            depthWrite={false}
            side={BackSide}
            toneMapped={false}
          />
        </mesh>
      </group>
      <mesh position={[0, 0.78, 0.03]} scale={[0.86, 1.2, 0.82]}>
        <sphereGeometry args={[1, 24, 18]} />
        <meshBasicMaterial
          color="#a99bb2"
          transparent
          opacity={0.008}
          side={2}
          wireframe
        />
      </mesh>
      <mesh position={[0, -0.45, 0]} scale={[0.7, 1.15, 0.42]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color="#111116"
          emissive="#211a27"
          emissiveIntensity={0.14}
          metalness={0.78}
          roughness={0.54}
        />
      </mesh>
      <mesh position={[0, 0.18, -0.48]} scale={[0.9, 1.75, 1]}>
        <torusGeometry args={[0.9, 0.012, 5, 64]} />
        <meshBasicMaterial color="#8d8498" transparent opacity={0.16} />
      </mesh>
      <CoreRibs />
      <CoreShards />
      <group ref={neuralSystem} position={[0, 0.72, 0.2]}>
        <NeuralFilaments />
      </group>
      <InternalMemorySystem />
      <group ref={innerCore} position={[0, 0.6, 0.5]}>
        <group ref={light}>
          <mesh scale={[0.34, 0.58, 0.3]}>
            <icosahedronGeometry args={[1, 3]} />
            <meshStandardMaterial
              color="#f5eef7"
              emissive="#d7c9de"
              emissiveIntensity={1.45}
              metalness={0.18}
              roughness={0.24}
            />
          </mesh>
        </group>
        <mesh scale={[0.58, 0.9, 0.54]}>
          <sphereGeometry args={[1, 18, 14]} />
          <meshBasicMaterial
            color={PALETTE.violet}
            transparent
            opacity={0.12}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  )
}
