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
import { getFragmentPrototype } from '../content/fragments'
import {
  ArchitecturalMaterial,
  EnergyFilamentMaterial,
  MemoryShellBackMaterial,
  MemoryShellMaterial,
} from '../materials/MemoryMaterials'
import { reconstructionRuntime } from '../reconstruction/reconstructionRuntime'
import type { FragmentId } from '../state/experienceStore'
import { useExperienceStore } from '../state/experienceStore'
import { trialRuntime } from '../trials/trialRuntime'

const consequenceColors: Record<FragmentId, string> = {
  identity: '#dce4e9',
  fear: '#9a70ad',
  hope: '#dfb36c',
}

const detachVectors: Record<FragmentId, Vector3> = {
  identity: new Vector3(-2.2, 0.75, -0.25),
  fear: new Vector3(2.15, -0.45, -0.12),
  hope: new Vector3(0.35, 2.5, -0.35),
}

const organTargets: Record<FragmentId, Vector3> = {
  identity: new Vector3(0, 0.68, 0.44),
  fear: new Vector3(0.58, 0.22, 0.36),
  hope: new Vector3(0.08, 1.12, 0.32),
}

function Consequence({
  fragment,
  children,
}: {
  fragment: FragmentId
  children: React.ReactNode
}) {
  const group = useRef<Group>(null)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const order = useExperienceStore((state) => state.collectionOrder)
  const phase = useExperienceStore((state) => state.phase)

  useFrame(({ clock }, delta) => {
    if (!group.current) return
    const index = Math.max(0, order.indexOf(fragment))
    const dominance = index === 0 ? 1.08 : index === 1 ? 0.74 : 0.58
    const detach =
      reconstructionRuntime.recognition * (1 - reconstructionRuntime.collapse) +
      Math.sin(
        MathUtils.smootherstep(reconstructionRuntime.collapse, 0, 0.72) * Math.PI,
      ) *
        0.34
    const rebuild =
      phase === 'reconstruction-rebuilding' ? reconstructionRuntime.rebuild : 0
    const detached = MathUtils.clamp(detach * (1 - rebuild), 0, 1)
    const targetScale =
      dominance *
      MathUtils.lerp(1, 0.05, trialRuntime.chamberSuppression) *
      MathUtils.lerp(1, 1.12, trialRuntime.syncVisual) *
      MathUtils.lerp(1, 0.12, reconstructionRuntime.collapse) *
      (rebuild > 0
        ? MathUtils.lerp(0.12, 1, MathUtils.smootherstep(rebuild, 0.2, 0.9))
        : 1)
    const scale = reducedMotion
      ? targetScale
      : MathUtils.damp(group.current.scale.x, targetScale, 2.6, delta)
    group.current.scale.setScalar(scale)
    group.current.position.lerp(
      detachVectors[fragment].clone().multiplyScalar(detached),
      reducedMotion ? 1 : 1 - Math.exp(-delta * 2.2),
    )
    const rhythm = fragment === 'identity' ? 1.45 : fragment === 'fear' ? 0.82 : 1.08
    group.current.rotation.y =
      (fragment === 'identity' ? 0 : Math.sin(clock.elapsedTime * rhythm) * 0.025) +
      detached * (fragment === 'fear' ? -0.25 : fragment === 'hope' ? 0.18 : 0)
  })

  return (
    <group ref={group} scale={reducedMotion ? 1 : 0.01} name={`${fragment}-organ`}>
      {children}
    </group>
  )
}

function IdentityConsequence() {
  const vertebrae = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!vertebrae.current) return
    const transform = new Object3D()
    for (let index = 0; index < 7; index += 1) {
      const t = index / 6
      transform.position.set(0, -1.48 + t * 2.94, 0.44)
      transform.rotation.set(0, Math.PI / 4, 0)
      transform.scale.set(0.12 + Math.sin(t * Math.PI) * 0.05, 0.18, 0.1)
      transform.updateMatrix()
      vertebrae.current.setMatrixAt(index, transform.matrix)
    }
    vertebrae.current.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <Consequence fragment="identity">
      <instancedMesh ref={vertebrae} args={[undefined, undefined, 7]}>
        <octahedronGeometry args={[1, 0]} />
        <ArchitecturalMaterial
          body="#5e676d"
          edge="#e8eef1"
          opacity={0.96}
          variation={0.06}
        />
      </instancedMesh>
      <mesh position={[0, 0.08, 0.44]} scale={[0.026, 1.05, 0.026]}>
        <capsuleGeometry args={[1, 0.55, 5, 10]} />
        <EnergyFilamentMaterial
          color="#88939a"
          hot="#f2f6f8"
          opacity={0.84}
          rhythm={1.52}
          energy={() => Math.max(trialRuntime.syncVisual, reconstructionRuntime.rebuild)}
        />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 0.47, 0.34, 0.16]}
          rotation={[0, side * 0.12, side * -0.08]}
          scale={[0.038, 1.05, 0.12]}
        >
          <capsuleGeometry args={[1, 0.62, 5, 10]} />
          <ArchitecturalMaterial
            body="#31353a"
            edge="#bcc5ca"
            opacity={0.86}
            variation={0.07}
          />
        </mesh>
      ))}
    </Consequence>
  )
}

function FearConsequence() {
  return (
    <Consequence fragment="fear">
      <group position={[0.28, 0.26, 0.18]} rotation={[0.04, -0.16, -0.08]}>
        {[
          { position: [-0.7, 0.32, 0], rotation: -0.42, scale: [0.5, 0.82, 0.3] },
          { position: [0.64, 0.42, -0.08], rotation: 0.34, scale: [0.56, 0.94, 0.34] },
          { position: [0.78, -0.62, -0.12], rotation: 0.62, scale: [0.42, 0.68, 0.28] },
        ].map((plate, index) => (
          <group
            key={index}
            position={plate.position as [number, number, number]}
            rotation={[0, 0, plate.rotation]}
            scale={plate.scale as [number, number, number]}
          >
            <mesh>
              <dodecahedronGeometry args={[1, 0]} />
              <MemoryShellMaterial
                body="#32243b"
                depth="#0c0810"
                accent="#976cab"
                opacity={0.82}
                distortion={0.02}
                energy={() =>
                  Math.max(trialRuntime.syncVisual, reconstructionRuntime.rebuild)
                }
              />
            </mesh>
            <mesh scale={[1.05, 1.05, 1.05]}>
              <dodecahedronGeometry args={[1, 0]} />
              <MemoryShellBackMaterial
                body="#18101d"
                depth="#070509"
                accent="#684878"
                opacity={0.28}
                distortion={0.012}
                energy={() => reconstructionRuntime.rebuild}
              />
            </mesh>
          </group>
        ))}
        <mesh
          position={[0.28, 0.06, 0.64]}
          rotation={[0, 0, -0.56]}
          scale={[0.022, 1.32, 0.022]}
        >
          <capsuleGeometry args={[1, 0.38, 5, 10]} />
          <EnergyFilamentMaterial
            color="#6f447e"
            hot="#c285ce"
            opacity={0.9}
            rhythm={0.88}
            energy={() =>
              Math.max(trialRuntime.syncVisual, reconstructionRuntime.rebuild)
            }
          />
        </mesh>
      </group>
    </Consequence>
  )
}

function HopeConsequence() {
  const curves = useMemo(
    () => [
      new CatmullRomCurve3([
        new Vector3(0.08, -1.48, 0.38),
        new Vector3(0.42, -0.45, 0.58),
        new Vector3(-0.12, 0.54, 0.62),
        new Vector3(0.28, 1.92, 0.2),
      ]),
      new CatmullRomCurve3([
        new Vector3(0.12, -0.55, 0.3),
        new Vector3(-0.42, 0.1, 0.54),
        new Vector3(-0.74, 0.92, 0.32),
        new Vector3(-1.02, 1.72, 0.02),
      ]),
      new CatmullRomCurve3([
        new Vector3(0.22, 0.12, 0.42),
        new Vector3(0.62, 0.64, 0.46),
        new Vector3(0.94, 1.18, 0.26),
        new Vector3(1.2, 1.68, -0.04),
      ]),
    ],
    [],
  )

  return (
    <Consequence fragment="hope">
      {curves.map((curve, index) => (
        <mesh key={index}>
          <tubeGeometry args={[curve, 44, index === 0 ? 0.035 : 0.024, 6, false]} />
          <EnergyFilamentMaterial
            color={index === 0 ? '#ad7c3d' : '#86602f'}
            hot="#f5c978"
            opacity={index === 0 ? 0.88 : 0.68}
            rhythm={1.1 + index * 0.18}
            energy={() =>
              Math.max(trialRuntime.syncVisual, reconstructionRuntime.rebuild)
            }
          />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 0.54, 1.28, 0.02]}
          rotation={[0, side * -0.12, side * -0.38]}
          scale={[0.36, 0.72, 0.32]}
        >
          <sphereGeometry args={[1, 24, 14, 0, Math.PI * 0.72]} />
          <MemoryShellMaterial
            body="#3c2d1b"
            depth="#0e0a06"
            accent="#dfb36c"
            opacity={0.62}
            distortion={0.03}
            energy={() => reconstructionRuntime.rebuild}
          />
        </mesh>
      ))}
    </Consequence>
  )
}

function MemoryTransfer({ fragment }: { fragment: FragmentId }) {
  const group = useRef<Group>(null)
  const pulse = useRef<Group>(null)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const origin = useMemo(
    () => new Vector3(...getFragmentPrototype(fragment).position),
    [fragment],
  )
  const target = organTargets[fragment]
  const curve = useMemo(
    () =>
      new CatmullRomCurve3([
        origin,
        origin
          .clone()
          .lerp(target, 0.34)
          .add(new Vector3(0, 0.9, 0.25)),
        origin
          .clone()
          .lerp(target, 0.7)
          .add(new Vector3(0, -0.35, 0.4)),
        target,
      ]),
    [origin, target],
  )

  useFrame(({ clock }) => {
    if (!group.current || !pulse.current) return
    const progress = trialRuntime.returnProgress
    group.current.visible = progress > 0.015
    if (!group.current.visible) return
    const arrival = MathUtils.smootherstep(progress, 0.04, 0.96)
    pulse.current.position.copy(curve.getPoint(arrival))
    pulse.current.rotation.set(
      clock.elapsedTime * 0.2,
      clock.elapsedTime * (reducedMotion ? 0.05 : 0.42),
      arrival * Math.PI,
    )
    pulse.current.scale.setScalar(0.1 + Math.sin(progress * Math.PI) * 0.09)
  })

  return (
    <group ref={group} visible={false} name={`${fragment}-organ-transfer`}>
      <mesh>
        <tubeGeometry args={[curve, 52, 0.034, 6, false]} />
        <EnergyFilamentMaterial
          color={consequenceColors[fragment]}
          hot="#ffffff"
          opacity={0.82}
          rhythm={fragment === 'identity' ? 1.5 : fragment === 'fear' ? 0.9 : 1.18}
          energy={() => Math.sin(trialRuntime.returnProgress * Math.PI)}
        />
      </mesh>
      <group ref={pulse}>
        <mesh scale={[1, 1.35, 0.82]}>
          <dodecahedronGeometry args={[1, 0]} />
          <MemoryShellMaterial
            body={consequenceColors[fragment]}
            depth="#09070b"
            accent="#ffffff"
            opacity={0.84}
            distortion={0.05}
            energy={() => trialRuntime.returnProgress}
          />
        </mesh>
      </group>
    </group>
  )
}

function CompletionConnections() {
  const group = useRef<Group>(null)
  const phase = useExperienceStore((state) => state.phase)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const order = useExperienceStore((state) => state.collectionOrder)

  useFrame(({ clock }) => {
    if (!group.current) return
    group.current.visible = phase === 'ready-for-reconstruction'
    if (!group.current.visible) return
    const pulse = reducedMotion ? 1 : 1 + Math.sin(clock.elapsedTime * 2.4) * 0.04
    group.current.scale.setScalar(pulse)
  })

  return (
    <group ref={group} visible={false} name="memory-organ-synchrony">
      {order.map((fragment, index) => {
        const start = organTargets[fragment]
        const curve = new CatmullRomCurve3([
          start,
          start
            .clone()
            .lerp(new Vector3(0, 0.58, 0.5), 0.52)
            .add(new Vector3((index - 1) * 0.18, 0.25, 0.18)),
          new Vector3(0, 0.58, 0.5),
        ])
        return (
          <mesh key={fragment}>
            <tubeGeometry args={[curve, 28, index === 0 ? 0.026 : 0.018, 5, false]} />
            <EnergyFilamentMaterial
              color={consequenceColors[fragment]}
              hot="#ffffff"
              opacity={index === 0 ? 0.86 : 0.62}
              rhythm={1 + index * 0.22}
              energy={() => 0.8}
            />
          </mesh>
        )
      })}
    </group>
  )
}

export function CollectedConsequences() {
  const collected = useExperienceStore((state) => state.collectedFragments)
  const activeFragment = useExperienceStore((state) => state.activeFragment)

  return (
    <>
      {activeFragment && <MemoryTransfer fragment={activeFragment} />}
      {collected.includes('identity') && <IdentityConsequence />}
      {collected.includes('fear') && <FearConsequence />}
      {collected.includes('hope') && <HopeConsequence />}
      <CompletionConnections />
    </>
  )
}
