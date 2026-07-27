import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { BufferGeometry, Float32BufferAttribute, Group, MathUtils } from 'three'
import type { FragmentId } from '../state/experienceStore'
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

function RecallTrace({ fragment }: { fragment: FragmentId }) {
  const group = useRef<Group>(null)
  const geometry = useMemo(() => {
    const value = new BufferGeometry()
    value.setAttribute('position', new Float32BufferAttribute(tracePoints[fragment], 3))
    return value
  }, [fragment])

  useFrame(() => {
    if (!group.current) return
    const active = reconstructionRuntime.activeRecall === fragment
    group.current.visible = active
    if (!active) return
    const pulse = Math.sin(reconstructionRuntime.recall * Math.PI)
    group.current.scale.setScalar(MathUtils.lerp(0.35, 1.35, pulse))
    group.current.rotation.z =
      fragment === 'fear' ? reconstructionRuntime.recall * 0.16 : 0
    group.current.position.y =
      fragment === 'hope' ? reconstructionRuntime.recall * 0.5 : 0
  })

  return (
    <group ref={group} visible={false}>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial color={RECALL_COLORS[fragment]} transparent opacity={0.78} />
      </lineSegments>
      <mesh scale={0.08}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color={RECALL_COLORS[fragment]} toneMapped={false} />
      </mesh>
    </group>
  )
}

export function MemoryRecallTraces() {
  return (
    <group position={[0, 0.35, 0.15]}>
      <RecallTrace fragment="identity" />
      <RecallTrace fragment="fear" />
      <RecallTrace fragment="hope" />
    </group>
  )
}
