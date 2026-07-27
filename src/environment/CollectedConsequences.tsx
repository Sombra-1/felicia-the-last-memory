import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { BufferGeometry, Float32BufferAttribute, Group, MathUtils } from 'three'
import type { FragmentId } from '../state/experienceStore'
import { useExperienceStore } from '../state/experienceStore'
import { reconstructionRuntime } from '../reconstruction/reconstructionRuntime'

function createLineGeometry(points: number[]) {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(points, 3))
  return geometry
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

  useFrame((_, delta) => {
    if (!group.current) return
    const target =
      (1 + reconstructionRuntime.recognition * 0.35) *
      MathUtils.lerp(1, 0.04, reconstructionRuntime.collapse) *
      (reconstructionRuntime.rebuild > 0
        ? MathUtils.lerp(0.04, 1.22, reconstructionRuntime.rebuild)
        : 1)
    const scale = reducedMotion
      ? target
      : MathUtils.damp(group.current.scale.x, target, 2.4, delta)
    group.current.scale.setScalar(scale)
  })

  return (
    <group ref={group} scale={reducedMotion ? 1 : 0.01} name={`${fragment}-consequence`}>
      {children}
    </group>
  )
}

function IdentityConsequence() {
  const geometry = useMemo(
    () =>
      createLineGeometry([
        -1.12, -2.2, -0.35, -1.12, 2.85, -0.35, 1.12, -2.2, -0.35, 1.12, 2.85, -0.35,
        -1.12, 2.1, -0.35, 1.12, 2.1, -0.35,
      ]),
    [],
  )

  return (
    <Consequence fragment="identity">
      <lineSegments geometry={geometry}>
        <lineBasicMaterial color="#cfcbd5" transparent opacity={0.22} />
      </lineSegments>
    </Consequence>
  )
}

function FearConsequence() {
  const geometry = useMemo(
    () =>
      createLineGeometry([
        -0.45, -2.61, 0.2, 0.05, -2.54, 0.02, 0.05, -2.54, 0.02, 0.42, -2.63, -0.22, 0.42,
        -2.63, -0.22, 0.78, -2.52, -0.5, 0.78, -2.52, -0.5, 1.25, -2.61, -0.66,
      ]),
    [],
  )

  return (
    <Consequence fragment="fear">
      <lineSegments geometry={geometry}>
        <lineBasicMaterial color="#7c668d" transparent opacity={0.48} />
      </lineSegments>
    </Consequence>
  )
}

function HopeConsequence() {
  const geometry = useMemo(() => {
    const points: number[] = []
    for (let index = 0; index < 14; index += 1) {
      const t0 = index / 14
      const t1 = (index + 1) / 14
      points.push(
        0.42 + Math.sin(t0 * Math.PI * 1.4) * 0.32,
        -2.45 + t0 * 4.5,
        -0.48 + Math.cos(t0 * Math.PI) * 0.12,
        0.42 + Math.sin(t1 * Math.PI * 1.4) * 0.32,
        -2.45 + t1 * 4.5,
        -0.48 + Math.cos(t1 * Math.PI) * 0.12,
      )
    }
    return createLineGeometry(points)
  }, [])

  return (
    <Consequence fragment="hope">
      <lineSegments geometry={geometry}>
        <lineBasicMaterial color="#d2ae77" transparent opacity={0.38} />
      </lineSegments>
    </Consequence>
  )
}

export function CollectedConsequences() {
  const collected = useExperienceStore((state) => state.collectedFragments)

  return (
    <>
      {collected.includes('identity') && <IdentityConsequence />}
      {collected.includes('fear') && <FearConsequence />}
      {collected.includes('hope') && <HopeConsequence />}
    </>
  )
}
