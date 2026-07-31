import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { Group, MathUtils } from 'three'
import type { FragmentPrototype } from '../content/fragments'
import { trialRuntime } from '../trials/trialRuntime'
import { entranceRuntime } from '../experience/entranceRuntime'
import { reconstructionRuntime } from '../reconstruction/reconstructionRuntime'
import { useExperienceStore } from '../state/experienceStore'
import { RecoveryMemoryOrgan } from './RecoveryMemoryOrgan'

export function MemoryFragment({ fragment }: { fragment: FragmentPrototype }) {
  const container = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const collected = useExperienceStore((state) =>
    state.collectedFragments.includes(fragment.id),
  )
  const selectable = useExperienceStore(
    (state) =>
      state.phase === 'chamber' &&
      !state.inputLocked &&
      !state.collectedFragments.includes(fragment.id),
  )
  const active = activeFragment === fragment.id
  const suppressed = activeFragment !== null && !active
  const phase = useExperienceStore((state) => state.phase)

  useEffect(() => {
    if (!hovered || !selectable) return
    document.body.style.cursor = 'pointer'
    return () => {
      document.body.style.cursor = ''
    }
  }, [hovered, selectable])

  useFrame((_, delta) => {
    if (!container.current) return
    container.current.visible = !(active && trialRuntime.passage > 0.995) && !collected
    if (!container.current.visible) return
    const activeScale = active
      ? 1.08 + Math.max(trialRuntime.anticipation, trialRuntime.departure) * 0.2
      : 1
    const activeContinuity = active ? MathUtils.lerp(1, 0.018, trialRuntime.passage) : 1
    const suppressedScale = suppressed ? 1 - trialRuntime.chamberSuppression * 0.94 : 1
    const dormantScale = collected && !active ? 0.62 : 1
    const hoverScale = hovered && selectable ? 1.08 : 1
    const reconstructing =
      phase.startsWith('reconstruction-') || phase === 'ending' || phase === 'resetting'
    const reconstructionScale = reconstructing
      ? Math.max(
          0.06,
          1 -
            reconstructionRuntime.collapse * 0.94 -
            reconstructionRuntime.rebuild * 0.04,
        )
      : 1
    const recallEmphasis =
      reconstructionRuntime.activeRecall === fragment.id
        ? Math.sin(reconstructionRuntime.recall * Math.PI) * 0.55
        : 0
    const target =
      activeScale *
      activeContinuity *
      suppressedScale *
      dormantScale *
      hoverScale *
      (reconstructionScale + recallEmphasis) *
      MathUtils.lerp(0.08, 1, entranceRuntime[fragment.id])
    const scale = MathUtils.damp(container.current.scale.x, target, 4, delta)
    container.current.scale.setScalar(scale)
    container.current.rotation.y = MathUtils.damp(
      container.current.rotation.y,
      active ? -0.12 : 0,
      4,
      delta,
    )
  })

  const selectFragment = () => {
    if (selectable) useExperienceStore.getState().requestFragment(fragment.id)
  }

  return (
    <group
      ref={container}
      position={[...fragment.position]}
      onPointerOver={(event) => {
        event.stopPropagation()
        if (selectable) setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(event) => {
        event.stopPropagation()
        selectFragment()
      }}
    >
      <mesh visible={false}>
        <sphereGeometry args={[1.28, 12, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <RecoveryMemoryOrgan fragment={fragment.id} hovered={hovered} active={active} />
    </group>
  )
}
