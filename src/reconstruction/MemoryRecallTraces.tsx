import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  MathUtils,
  MeshBasicMaterial,
  Vector3,
} from 'three'
import type { FragmentId } from '../state/experienceStore'
import { useExperienceStore } from '../state/experienceStore'
import { RECALL_COLORS } from './reconstructionConfig'
import { reconstructionRuntime } from './reconstructionRuntime'

const tracePoints: Record<FragmentId, number[]> = {
  identity: [-1.5, 0, 0, 1.5, 0, 0, 0, -1.5, 0, 0, 1.5, 0],
  fear: [
    -1.4, -0.7, 0, -0.25, 0.35, 0, -0.25, 0.35, 0, 0.5, -0.15, 0, 0.5, -0.15, 0, 1.3,
    0.85, 0,
  ],
  hope: [
    -1.15, -1.1, 0, -0.4, -0.25, 0, -0.4, -0.25, 0, 0, 1.15, 0, 0, 1.15, 0, 0.45, -0.2, 0,
    0.45, -0.2, 0, 1.15, -1.05, 0,
  ],
}

const recallOrigins: Record<FragmentId, Vector3> = {
  identity: new Vector3(-2.55, 0.95, -0.4),
  fear: new Vector3(2.55, -0.42, -0.2),
  hope: new Vector3(0.2, 3.05, -0.55),
}

function RecallTrace({ fragment, index }: { fragment: FragmentId; index: number }) {
  const group = useRef<Group>(null)
  const lineMaterial = useRef<LineBasicMaterial>(null)
  const haloMaterial = useRef<MeshBasicMaterial>(null)
  const target = useMemo(() => new Vector3(), [])
  const geometry = useMemo(() => {
    const value = new BufferGeometry()
    value.setAttribute('position', new Float32BufferAttribute(tracePoints[fragment], 3))
    return value
  }, [fragment])

  useFrame(() => {
    if (!group.current || !lineMaterial.current || !haloMaterial.current) return
    const active =
      reconstructionRuntime.activeRecall === fragment &&
      reconstructionRuntime.recallIndex === index
    const completed = reconstructionRuntime.recallIndex > index
    group.current.visible = active || completed
    if (!group.current.visible) return
    const progress = completed ? 1 : reconstructionRuntime.recall
    const arrival = MathUtils.smootherstep(progress, 0.04, 0.82)
    const emphasis = index === 0 ? 1 : index === 1 ? 0.72 : 0.52
    group.current.position.lerpVectors(recallOrigins[fragment], target, progress)
    group.current.position.y += completed && fragment === 'hope' ? 0.26 : 0
    group.current.scale.setScalar(
      completed
        ? index === 0
          ? 0.78
          : index === 1
            ? 0.56
            : 0.42
        : MathUtils.lerp(0.28, 1.16 * emphasis, arrival),
    )
    group.current.rotation.z =
      fragment === 'fear'
        ? progress * 0.22
        : fragment === 'identity'
          ? MathUtils.lerp(-0.3, 0, progress)
          : MathUtils.lerp(0.25, -0.08, progress)
    lineMaterial.current.opacity = active
      ? MathUtils.lerp(0.28, 0.96 * emphasis, arrival)
      : 0.68 * emphasis
    haloMaterial.current.opacity = active
      ? MathUtils.lerp(0.08, 0.46 * emphasis, arrival)
      : 0.3 * emphasis
  })

  return (
    <group ref={group} visible={false}>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial
          ref={lineMaterial}
          color={RECALL_COLORS[fragment]}
          transparent
          opacity={0}
        />
      </lineSegments>
      <mesh scale={0.08}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color={RECALL_COLORS[fragment]} toneMapped={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.08, 0.022, 5, 56, Math.PI * 1.6]} />
        <meshBasicMaterial
          ref={haloMaterial}
          color={RECALL_COLORS[fragment]}
          transparent
          opacity={0}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

export function MemoryRecallTraces() {
  const order = useExperienceStore((state) => state.collectionOrder)

  return (
    <group position={[0, 0.28, 0.15]} scale={0.86}>
      {order.map((fragment, index) => (
        <RecallTrace key={fragment} fragment={fragment} index={index} />
      ))}
    </group>
  )
}
