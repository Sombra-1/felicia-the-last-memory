import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  CatmullRomCurve3,
  Group,
  InstancedMesh,
  MathUtils,
  Object3D,
  Vector3,
} from 'three'
import { entranceRuntime } from '../experience/entranceRuntime'
import {
  ArchitecturalMaterial,
  EnergyFilamentMaterial,
  MemoryShellBackMaterial,
  MemoryShellMaterial,
} from '../materials/MemoryMaterials'
import { deriveEndingConfiguration } from '../reconstruction/endingProfiles'
import { reconstructionRuntime } from '../reconstruction/reconstructionRuntime'
import { useExperienceStore } from '../state/experienceStore'
import { trialRuntime } from '../trials/trialRuntime'

function AwakeningMembrane() {
  const membrane = useRef<Group>(null)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)

  useFrame(() => {
    if (!membrane.current) return
    const progress = entranceRuntime.pulse
    membrane.current.visible = progress > 0.01 && progress < 0.995
    membrane.current.scale.setScalar(
      MathUtils.lerp(0.25, reducedMotion ? 2.4 : 3.8, progress),
    )
    membrane.current.rotation.y = progress * (reducedMotion ? 0.05 : 0.32)
    membrane.current.rotation.z = progress * (reducedMotion ? 0.03 : -0.18)
  })

  return (
    <group ref={membrane} position={[0, 0.66, -0.2]} visible={false}>
      <mesh scale={[0.78, 1.1, 0.62]}>
        <sphereGeometry args={[1, 32, 18]} />
        <MemoryShellMaterial
          body="#28212e"
          depth="#09070c"
          accent="#eee8f3"
          opacity={0.34}
          distortion={0.035}
          energy={() => Math.sin(entranceRuntime.pulse * Math.PI)}
        />
      </mesh>
    </group>
  )
}

function SyntheticSternum() {
  const bones = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!bones.current) return
    const transform = new Object3D()
    let instance = 0
    for (let index = 0; index < 7; index += 1) {
      const t = index / 6
      const y = 1.42 - t * 2.28
      const span = 0.38 + Math.sin(t * Math.PI) * 0.55
      for (const side of [-1, 1]) {
        transform.position.set(side * span * 0.48, y, -0.04 - Math.abs(t - 0.5) * 0.12)
        transform.rotation.set(
          Math.PI / 2,
          side * (0.12 + Math.abs(t - 0.5) * 0.1),
          side * (Math.PI / 2 - 0.18 - t * 0.08),
        )
        transform.scale.set(1, span, 0.82)
        transform.updateMatrix()
        bones.current.setMatrixAt(instance, transform.matrix)
        instance += 1
      }
    }
    bones.current.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <instancedMesh ref={bones} args={[undefined, undefined, 14]}>
      <capsuleGeometry args={[0.045, 0.72, 5, 10]} />
      <ArchitecturalMaterial
        body="#35333b"
        edge="#b4acba"
        opacity={0.96}
        variation={0.1}
      />
    </instancedMesh>
  )
}

function NeuralFilaments() {
  const curves = useMemo(
    () => [
      new CatmullRomCurve3([
        new Vector3(-0.32, -1.08, 0.08),
        new Vector3(0.16, -0.5, 0.3),
        new Vector3(-0.2, 0.16, 0.38),
        new Vector3(0.2, 1.18, 0.08),
      ]),
      new CatmullRomCurve3([
        new Vector3(0.38, -0.98, -0.02),
        new Vector3(-0.26, -0.24, 0.24),
        new Vector3(0.34, 0.44, 0.34),
        new Vector3(-0.1, 1.3, 0.04),
      ]),
      new CatmullRomCurve3([
        new Vector3(-0.5, -0.58, -0.08),
        new Vector3(-0.12, -0.08, 0.42),
        new Vector3(0.48, 0.26, 0.18),
        new Vector3(0.28, 0.9, -0.04),
      ]),
      new CatmullRomCurve3([
        new Vector3(0.48, -0.48, -0.06),
        new Vector3(0.04, 0.02, 0.46),
        new Vector3(-0.42, 0.46, 0.16),
        new Vector3(-0.32, 0.96, -0.08),
      ]),
    ],
    [],
  )

  return (
    <>
      {curves.map((curve, index) => (
        <mesh key={index}>
          <tubeGeometry args={[curve, 40, index < 2 ? 0.024 : 0.016, 6, false]} />
          <EnergyFilamentMaterial
            color={index % 2 ? '#75637f' : '#998aa2'}
            hot={index % 2 ? '#c8b9cf' : '#eee6f1'}
            opacity={index < 2 ? 0.76 : 0.54}
            rhythm={1.1 + index * 0.22}
            energy={() =>
              Math.max(
                entranceRuntime.core,
                trialRuntime.beatEnergy,
                reconstructionRuntime.rebuild,
              )
            }
          />
        </mesh>
      ))}
    </>
  )
}

function ArticulatedOrgan() {
  const organ = useRef<Group>(null)
  const orbiters = useRef<InstancedMesh>(null)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const phase = useExperienceStore((state) => state.phase)

  useFrame(({ clock }) => {
    if (!organ.current || !orbiters.current) return
    const time = clock.elapsedTime
    const motion = reducedMotion ? 0.08 : 1
    const reveal = Math.max(
      trialRuntime.anticipation,
      trialRuntime.beatEnergy,
      reconstructionRuntime.recognition,
      reconstructionRuntime.rebuild,
    )
    organ.current.rotation.y =
      time * 0.08 * motion * (activeFragment === 'fear' ? -1 : 1) +
      (activeFragment === 'identity' ? reveal * Math.PI * 0.22 : 0)
    organ.current.rotation.z =
      (reducedMotion ? 0.04 : Math.sin(time * 0.24) * 0.08) +
      (activeFragment === 'hope' ? reveal * 0.14 : 0)

    const transform = new Object3D()
    for (let index = 0; index < 12; index += 1) {
      const lane = index % 3
      const angle = time * (0.2 + lane * 0.05) * motion + index * 2.399
      const radius = 0.42 + lane * 0.16
      transform.position.set(
        Math.cos(angle) * radius,
        0.05 + Math.sin(angle * 1.7 + index) * (0.54 + lane * 0.07),
        Math.sin(angle) * radius * 0.52,
      )
      transform.rotation.set(angle, angle * 0.5, 0)
      transform.scale.set(0.018, 0.04 + (index % 3) * 0.01, 0.018)
      transform.updateMatrix()
      orbiters.current.setMatrixAt(index, transform.matrix)
    }
    orbiters.current.instanceMatrix.needsUpdate = true

    const awake =
      phase === 'ready-for-reconstruction' ||
      phase.startsWith('reconstruction-') ||
      phase === 'ending'
        ? 1.12
        : 1
    organ.current.scale.setScalar(MathUtils.lerp(0.45, awake, entranceRuntime.core))
  })

  return (
    <group ref={organ} position={[0, 0.52, 0.2]}>
      <mesh scale={[0.48, 0.72, 0.42]}>
        <dodecahedronGeometry args={[1, 2]} />
        <MemoryShellMaterial
          body="#302638"
          depth="#0b0810"
          accent="#b8a4c2"
          opacity={0.86}
          distortion={0.028}
          energy={() =>
            Math.max(
              entranceRuntime.core,
              trialRuntime.beatEnergy,
              reconstructionRuntime.rebuild,
            )
          }
        />
      </mesh>
      <mesh scale={[0.5, 0.75, 0.45]}>
        <dodecahedronGeometry args={[1, 1]} />
        <MemoryShellBackMaterial
          body="#1a141f"
          depth="#070509"
          accent="#7f688c"
          opacity={0.36}
          distortion={0.02}
          energy={() => trialRuntime.beatEnergy}
        />
      </mesh>
      <mesh scale={[0.22, 0.39, 0.18]}>
        <octahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#e1d6e5" toneMapped={false} />
      </mesh>
      <instancedMesh ref={orbiters} args={[undefined, undefined, 12]}>
        <tetrahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#d4c7da" toneMapped={false} />
      </instancedMesh>
      <pointLight color="#967ba5" intensity={2.15} distance={5} />
    </group>
  )
}

function ShellLobe({
  side,
  outerRef,
}: {
  side: -1 | 1
  outerRef: React.RefObject<Group | null>
}) {
  return (
    <group ref={outerRef} position={[side * 0.34, 0.72, side * 0.015]}>
      <mesh scale={[0.5, 1.22, 0.72]} rotation={[0, side * -0.08, side * -0.05]}>
        <sphereGeometry args={[1, 34, 22, 0, Math.PI * 1.22]} />
        <MemoryShellMaterial
          body={side < 0 ? '#4b414f' : '#443b49'}
          depth="#100d13"
          accent={side < 0 ? '#b8a9c0' : '#a996b3'}
          opacity={0.68}
          distortion={0.024}
          energy={() =>
            Math.max(
              entranceRuntime.core,
              trialRuntime.beatEnergy,
              reconstructionRuntime.rebuild,
            )
          }
        />
      </mesh>
      <mesh scale={[0.55, 1.28, 0.78]} rotation={[0, side * -0.08, side * -0.05]}>
        <sphereGeometry args={[1, 28, 18, 0, Math.PI * 1.22]} />
        <MemoryShellBackMaterial
          body="#29212e"
          depth="#08060a"
          accent="#947da0"
          opacity={0.34}
          distortion={0.018}
          energy={() => reconstructionRuntime.rebuild}
        />
      </mesh>
      <mesh
        position={[side * 0.16, 0.02, 0.3]}
        rotation={[0, 0, side * -0.24]}
        scale={[0.045, 0.92, 0.04]}
      >
        <capsuleGeometry args={[1, 0.45, 5, 10]} />
        <ArchitecturalMaterial body="#3a343f" edge="#b6a9bc" opacity={0.78} />
      </mesh>
    </group>
  )
}

export function FeliciaCore() {
  const core = useRef<Group>(null)
  const leftShell = useRef<Group>(null)
  const rightShell = useRef<Group>(null)
  const rearShell = useRef<Group>(null)
  const neuralSystem = useRef<Group>(null)
  const organ = useRef<Group>(null)
  const sternum = useRef<Group>(null)
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
      !leftShell.current ||
      !rightShell.current ||
      !rearShell.current ||
      !neuralSystem.current ||
      !organ.current ||
      !sternum.current
    )
      return
    const time = clock.elapsedTime
    const reveal = activeFragment
      ? Math.max(
          trialRuntime.anticipation,
          trialRuntime.beatEnergy,
          trialRuntime.completion,
          trialRuntime.returnProgress,
        )
      : 0
    const collapse = reconstructionRuntime.collapse
    const voided = phase === 'reconstruction-void' || phase === 'reconstruction-recall'
    const rebuilt =
      phase === 'reconstruction-rebuilding'
        ? reconstructionRuntime.rebuild
        : phase === 'reconstruction-reveal' || phase === 'ending'
          ? 1
          : 0
    const formation = MathUtils.smootherstep(rebuilt, 0.06, 0.8)
    const profile = ending?.profile
    const first = collectionOrder[0]
    const firstStrength = first ? 1 : 0
    const exposure =
      trialRuntime.syncVisual * 0.24 +
      reconstructionRuntime.recognition * 0.4 +
      Math.sin(MathUtils.smootherstep(collapse, 0.02, 0.62) * Math.PI) * 0.5
    const surge =
      phase === 'reconstruction-rebuilding'
        ? Math.sin(MathUtils.smootherstep(rebuilt, 0.5, 0.94) * Math.PI)
        : 0
    const baseScale = voided
      ? 0.1
      : rebuilt > 0
        ? MathUtils.lerp(
            0.1,
            0.94 + (profile?.felicia.expansion ?? 0) * 0.16,
            formation,
          ) *
          (1 + surge * 0.16)
        : MathUtils.lerp(1, 0.1, collapse)
    const entranceScale = MathUtils.lerp(0.54, 1, entranceRuntime.core)
    const trialContinuity = MathUtils.lerp(1, 0.075, trialRuntime.chamberSuppression)
    const fearContraction =
      (activeFragment === 'fear' ? reveal * 0.12 : 0) +
      (first === 'fear' ? firstStrength * 0.045 : 0)
    const hopeOpening =
      (activeFragment === 'hope' ? reveal * 0.2 : 0) +
      (first === 'hope' ? firstStrength * 0.13 : 0) +
      (profile?.id === 'hope' ? formation * 0.45 : 0)
    const identityOrder =
      (activeFragment === 'identity' ? trialRuntime.alignmentHold * 0.1 : 0) +
      (first === 'identity' ? firstStrength * 0.06 : 0) +
      (profile?.id === 'identity' ? formation * 0.09 : 0)
    const fearGuard = profile?.id === 'fear' ? formation : 0
    const breathRate = first === 'identity' ? 1.45 : first === 'fear' ? 0.82 : 1.05
    const breathWidth =
      first === 'hope'
        ? 0.075
        : first === 'fear'
          ? 0.025
          : first === 'identity'
            ? 0.035
            : 0.05
    const breath = reducedMotion ? 0 : Math.sin(time * breathRate) * breathWidth
    const drift =
      reducedMotion || phase.startsWith('reconstruction-')
        ? 0
        : Math.sin(time * 0.34) * 0.045

    core.current.position.y = MathUtils.damp(
      core.current.position.y,
      drift + formation * (profile?.felicia.expansion ?? 0) * 0.28,
      reducedMotion ? 20 : 1.2,
      delta,
    )
    core.current.rotation.y = MathUtils.damp(
      core.current.rotation.y,
      rebuilt > 0
        ? formation * (1 - (profile?.felicia.coherence ?? 1)) * 0.22
        : activeFragment === 'identity' || reducedMotion
          ? 0
          : Math.sin(time * 0.16) * 0.05,
      reducedMotion ? 20 : 0.9,
      delta,
    )
    core.current.rotation.z = MathUtils.damp(
      core.current.rotation.z,
      fearGuard * -0.07 + (profile?.id === 'hope' ? formation * 0.035 : 0),
      reducedMotion ? 20 : 1.2,
      delta,
    )
    core.current.scale.set(
      MathUtils.damp(
        core.current.scale.x,
        baseScale *
          entranceScale *
          trialContinuity *
          (1 + breath - fearContraction * 0.46 + hopeOpening * 0.12),
        reducedMotion ? 20 : 2.2,
        delta,
      ),
      MathUtils.damp(
        core.current.scale.y,
        baseScale *
          entranceScale *
          trialContinuity *
          (1 - fearContraction + hopeOpening * 0.18 + identityOrder * 0.05),
        reducedMotion ? 20 : 2.2,
        delta,
      ),
      MathUtils.damp(
        core.current.scale.z,
        baseScale *
          entranceScale *
          trialContinuity *
          (1 - fearContraction * 0.35 + hopeOpening * 0.08),
        reducedMotion ? 20 : 2.2,
        delta,
      ),
    )

    const opening = hopeOpening + exposure * 0.32
    leftShell.current.position.set(
      MathUtils.damp(
        leftShell.current.position.x,
        -0.34 - opening - identityOrder * 0.03 + fearGuard * 0.12,
        2,
        delta,
      ),
      MathUtils.damp(
        leftShell.current.position.y,
        0.72 + opening * 0.22 - fearGuard * 0.08 + breath * 0.35,
        2,
        delta,
      ),
      0,
    )
    rightShell.current.position.set(
      MathUtils.damp(
        rightShell.current.position.x,
        0.34 + opening + identityOrder * 0.03 - fearGuard * 0.02,
        2,
        delta,
      ),
      MathUtils.damp(
        rightShell.current.position.y,
        0.72 + opening * 0.62 + fearGuard * 0.08 - breath * 0.2,
        2,
        delta,
      ),
      0.02,
    )
    leftShell.current.rotation.z = MathUtils.damp(
      leftShell.current.rotation.z,
      opening * 0.55 - fearGuard * 0.16,
      2,
      delta,
    )
    rightShell.current.rotation.z = MathUtils.damp(
      rightShell.current.rotation.z,
      -opening * 0.55 + fearGuard * 0.12,
      2,
      delta,
    )
    rearShell.current.position.z = MathUtils.damp(
      rearShell.current.position.z,
      -0.42 - exposure * 0.7 + fearGuard * 0.12,
      1.8,
      delta,
    )
    rearShell.current.scale.set(
      1 + hopeOpening * 0.1,
      1 + hopeOpening * 0.28 - fearGuard * 0.12,
      1,
    )
    neuralSystem.current.position.y = MathUtils.damp(
      neuralSystem.current.position.y,
      0.64 + opening * 0.88,
      2,
      delta,
    )
    neuralSystem.current.scale.set(
      1 + hopeOpening * 0.22,
      1 + opening * 0.76 - fearGuard * 0.12,
      1,
    )
    organ.current.scale.setScalar(
      1 + exposure * 0.38 + hopeOpening * 0.18 - fearGuard * 0.1,
    )
    sternum.current.position.z = exposure * 0.32
    sternum.current.scale.set(1 + identityOrder * 0.22, 1 + identityOrder * 0.12, 1)
  })

  return (
    <group ref={core} position={[0, 0.04, 0]} scale={1.08} name="felicia-living-anatomy">
      <AwakeningMembrane />
      <group ref={rearShell} position={[0, 0.7, -0.42]}>
        <mesh scale={[0.78, 1.18, 0.68]}>
          <sphereGeometry args={[1, 32, 22]} />
          <MemoryShellMaterial
            body="#2b2730"
            depth="#0c0a0e"
            accent="#887495"
            opacity={0.8}
            distortion={0.02}
            energy={() =>
              Math.max(entranceRuntime.core, reconstructionRuntime.recognition)
            }
          />
        </mesh>
        <mesh scale={[0.84, 1.25, 0.74]}>
          <sphereGeometry args={[1, 26, 18]} />
          <MemoryShellBackMaterial
            body="#1a161d"
            depth="#070609"
            accent="#6f5b7a"
            opacity={0.3}
            distortion={0.015}
            energy={() => reconstructionRuntime.rebuild}
          />
        </mesh>
      </group>
      <ShellLobe side={-1} outerRef={leftShell} />
      <ShellLobe side={1} outerRef={rightShell} />
      <mesh position={[0, -0.5, -0.05]} scale={[0.72, 1.12, 0.46]}>
        <dodecahedronGeometry args={[1, 1]} />
        <ArchitecturalMaterial
          body="#111116"
          edge="#4e4655"
          opacity={0.98}
          variation={0.09}
        />
      </mesh>
      <group ref={sternum}>
        <SyntheticSternum />
      </group>
      <group ref={neuralSystem} position={[0, 0.64, 0.28]}>
        <NeuralFilaments />
      </group>
      <group ref={organ}>
        <ArticulatedOrgan />
      </group>
    </group>
  )
}
