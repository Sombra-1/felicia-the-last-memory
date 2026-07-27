import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { BufferGeometry, Float32BufferAttribute, Group, MathUtils } from 'three'
import { useExperienceStore } from '../state/experienceStore'
import { deriveEndingConfiguration } from './endingProfiles'
import { reconstructionRuntime } from './reconstructionRuntime'

function lineGeometry(points: number[]) {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(points, 3))
  return geometry
}

function IdentityWorld({ detailColor }: { detailColor: string }) {
  return (
    <>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 1.55, 0.1, -0.55]} scale={[side, 1, 1]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[2.25, 0.032, 5, 80, Math.PI * 1.35]} />
            <meshBasicMaterial color="#dfe1e6" transparent opacity={0.38} />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[0.025, 5.1, 0.025]} />
            <meshBasicMaterial color={detailColor} transparent opacity={0.3} />
          </mesh>
        </group>
      ))}
    </>
  )
}

function FearWorld({ detailColor }: { detailColor: string }) {
  return (
    <>
      {[-1.25, -0.62, 0.12, 0.78, 1.38].map((rotation, index) => (
        <mesh
          key={rotation}
          position={[0, 0.1, -0.3 - index * 0.04]}
          rotation={[0, 0, rotation]}
        >
          <torusGeometry
            args={[2.05 + index * 0.18, 0.042, 5, 64, Math.PI * (0.78 + index * 0.04)]}
          />
          <meshBasicMaterial
            color={index === 2 ? detailColor : '#816991'}
            transparent
            opacity={0.25 + (index % 2) * 0.08}
          />
        </mesh>
      ))}
    </>
  )
}

function HopeWorld({ detailColor }: { detailColor: string }) {
  const branches = useMemo(() => {
    const points: number[] = []
    for (const side of [-1, 1]) {
      for (let index = 0; index < 18; index += 1) {
        const start = index / 18
        const end = (index + 1) / 18
        points.push(
          side * (0.35 + Math.sin(start * Math.PI * 0.8) * 2.1),
          -2.1 + start * 5.5,
          -0.45 - start * 0.5,
          side * (0.35 + Math.sin(end * Math.PI * 0.8) * 2.1),
          -2.1 + end * 5.5,
          -0.45 - end * 0.5,
        )
      }
    }
    return lineGeometry(points)
  }, [])

  return (
    <>
      <lineSegments geometry={branches}>
        <lineBasicMaterial color={detailColor} transparent opacity={0.52} />
      </lineSegments>
      {[2.35, 2.85, 3.35].map((radius, index) => (
        <mesh key={radius} position={[0, 0.55 + index * 0.3, -0.7]}>
          <torusGeometry args={[radius, 0.032, 5, 72, Math.PI * 0.82]} />
          <meshBasicMaterial color="#cfac75" transparent opacity={0.2} />
        </mesh>
      ))}
    </>
  )
}

export function EndingStructures() {
  const group = useRef<Group>(null)
  const phase = useExperienceStore((state) => state.phase)
  const order = useExperienceStore((state) => state.collectionOrder)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const ending = useMemo(() => deriveEndingConfiguration(order), [order])

  useFrame(({ clock }) => {
    if (!group.current || !ending) return
    const progress =
      phase === 'reconstruction-rebuilding'
        ? reconstructionRuntime.rebuild
        : phase === 'reconstruction-reveal' || phase === 'ending'
          ? 1
          : 0
    group.current.visible = progress > 0.01
    const scale = MathUtils.smoothstep(progress, 0, 1)
    group.current.scale.setScalar(scale)
    group.current.position.y =
      MathUtils.lerp(-1.25, ending.profile.architecture.verticalLift, progress) +
      (!reducedMotion && phase === 'ending' && ending.motionDirection === 'ascending'
        ? Math.sin(clock.elapsedTime * 0.22) * 0.045
        : 0)
    group.current.rotation.z =
      ending.motionDirection === 'guarded' && !reducedMotion
        ? Math.sin(clock.elapsedTime * 0.46) * 0.018
        : 0
  })

  if (!ending) return null

  return (
    <group ref={group} visible={false} name={`${ending.profile.id}-ending-world`}>
      {ending.profile.id === 'identity' && (
        <IdentityWorld detailColor={ending.detailColor} />
      )}
      {ending.profile.id === 'fear' && <FearWorld detailColor={ending.detailColor} />}
      {ending.profile.id === 'hope' && <HopeWorld detailColor={ending.detailColor} />}
    </group>
  )
}
