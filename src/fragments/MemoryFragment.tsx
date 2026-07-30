import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { Group, MathUtils } from 'three'
import type { FragmentPrototype } from '../content/fragments'
import { trialRuntime } from '../trials/trialRuntime'
import { entranceRuntime } from '../experience/entranceRuntime'
import { reconstructionRuntime } from '../reconstruction/reconstructionRuntime'
import { useExperienceStore } from '../state/experienceStore'
import { FearFragment } from './FearFragment'
import { HopeFragment } from './HopeFragment'
import { IdentityFragment } from './IdentityFragment'

const collectedColors = {
  identity: '#dce2e7',
  fear: '#826792',
  hope: '#d3ad74',
} as const

function CollectedMemorySeal({ id }: { id: FragmentPrototype['id'] }) {
  return (
    <group scale={0.72}>
      <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
        <octahedronGeometry args={[0.42, 0]} />
        <meshBasicMaterial
          color={collectedColors[id]}
          transparent
          opacity={0.46}
          wireframe
        />
      </mesh>
    </group>
  )
}

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
      collected && !active ? -0.28 : 0,
      3,
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
      {collected && !active ? (
        <CollectedMemorySeal id={fragment.id} />
      ) : (
        <>
          {fragment.id === 'identity' && (
            <IdentityFragment hovered={hovered} active={active} collected={collected} />
          )}
          {fragment.id === 'fear' && (
            <FearFragment hovered={hovered} active={active} collected={collected} />
          )}
          {fragment.id === 'hope' && (
            <HopeFragment hovered={hovered} active={active} collected={collected} />
          )}
        </>
      )}
      <Html
        position={[0, fragment.id === 'hope' ? -1.16 : -1.1, 0.72]}
        center
        distanceFactor={8}
        style={{
          pointerEvents: 'none',
          opacity:
            active || phase.startsWith('reconstruction-') || phase === 'ending' ? 0 : 1,
        }}
      >
        <div
          className={[
            'fragment-label',
            `fragment-label--${fragment.id}`,
            active && 'fragment-label--active',
            collected && 'fragment-label--collected',
            suppressed && 'fragment-label--suppressed',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <span>{fragment.index}</span>
          <strong>{collected ? `${fragment.label} · recovered` : fragment.label}</strong>
        </div>
      </Html>
    </group>
  )
}
