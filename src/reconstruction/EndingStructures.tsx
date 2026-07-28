import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  CatmullRomCurve3,
  Group,
  InstancedMesh,
  MathUtils,
  Object3D,
  Vector3,
} from 'three'
import { useExperienceStore } from '../state/experienceStore'
import { deriveEndingConfiguration } from './endingProfiles'
import { reconstructionRuntime } from './reconstructionRuntime'

function IdentityAlignedRibs() {
  const ribs = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!ribs.current) return
    const transform = new Object3D()
    let instance = 0

    for (const side of [-1, 1]) {
      ;[1.45, 1.92, 2.38].forEach((x, index) => {
        transform.position.set(side * x, 0.18, -0.92 - index * 0.08)
        transform.rotation.set(0, 0, 0)
        transform.scale.set(0.055, 2.45 - index * 0.22, 0.32)
        transform.updateMatrix()
        ribs.current?.setMatrixAt(instance, transform.matrix)
        instance += 1
      })

      for (const y of [0.52, -0.52]) {
        transform.position.set(side * 1.72, y, -0.82)
        transform.rotation.set(0, 0, 0)
        transform.scale.set(1.05, 0.022, 0.08)
        transform.updateMatrix()
        ribs.current?.setMatrixAt(instance, transform.matrix)
        instance += 1
      }
    }

    ribs.current.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <instancedMesh ref={ribs} args={[undefined, undefined, 10]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#aeb6be"
        emissive="#707982"
        emissiveIntensity={0.28}
        metalness={0.94}
        roughness={0.24}
      />
    </instancedMesh>
  )
}

function IdentityWorld({ detailColor }: { detailColor: string }) {
  return (
    <>
      <IdentityAlignedRibs />
      {[-1, 1].map((side) => (
        <group key={side} scale={[side, 1, 1]}>
          <mesh position={[1.72, 0.18, -0.72]} rotation={[0, 0, Math.PI * 0.47]}>
            <torusGeometry args={[2.22, 0.052, 7, 64, Math.PI * 0.72]} />
            <meshStandardMaterial
              color="#aeb6be"
              emissive="#bfc8cf"
              emissiveIntensity={0.22}
              metalness={0.92}
              roughness={0.2}
            />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.22, -1.04]} scale={[0.018, 2.85, 0.08]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#f0f3f5" transparent opacity={0.62} />
      </mesh>
      {[1.24, 1.78, 2.38].map((radius, index) => (
        <mesh key={radius} position={[0, 0.22, -1.08 - index * 0.04]}>
          <torusGeometry args={[radius, index === 0 ? 0.044 : 0.026, 6, 80]} />
          <meshBasicMaterial
            color={index === 0 ? '#f2f4f5' : index === 1 ? '#bfc6cc' : detailColor}
            transparent
            opacity={0.54 - index * 0.11}
            toneMapped={false}
          />
        </mesh>
      ))}
    </>
  )
}

function FearWorld({ detailColor }: { detailColor: string }) {
  const shields = [
    {
      position: [-2.04, 0.92, -0.54],
      rotation: [0.08, 0.2, -0.2],
      scale: [0.7, 1.12, 0.2],
    },
    {
      position: [-2.28, -0.62, -0.68],
      rotation: [-0.12, 0.12, 0.24],
      scale: [0.58, 0.92, 0.18],
    },
    {
      position: [2.1, 0.48, -0.62],
      rotation: [-0.08, -0.18, 0.3],
      scale: [0.76, 1.28, 0.22],
    },
    {
      position: [1.72, -1.12, -0.48],
      rotation: [0.16, -0.12, -0.24],
      scale: [0.54, 0.82, 0.18],
    },
  ] as const
  const arcs = [
    { radius: 2.22, rotation: 0.2, arc: Math.PI * 0.56, color: '#775989' },
    { radius: 2.52, rotation: 1.86, arc: Math.PI * 0.48, color: detailColor },
    { radius: 2.78, rotation: 3.62, arc: Math.PI * 0.42, color: '#513d61' },
    { radius: 3.02, rotation: 5.18, arc: Math.PI * 0.34, color: '#816496' },
  ] as const

  return (
    <>
      {arcs.map((arc, index) => (
        <mesh
          key={arc.radius}
          position={[index % 2 ? 0.18 : -0.12, 0.1, -0.72 - index * 0.07]}
          rotation={[0, 0, arc.rotation]}
        >
          <torusGeometry args={[arc.radius, 0.065 - index * 0.006, 7, 64, arc.arc]} />
          <meshStandardMaterial
            color={arc.color}
            emissive={index === 1 ? detailColor : '#34233f'}
            emissiveIntensity={0.7}
            metalness={0.76}
            roughness={0.4}
          />
        </mesh>
      ))}
      {shields.map((shield, index) => (
        <group
          key={index}
          position={shield.position}
          rotation={shield.rotation}
          scale={shield.scale}
        >
          <mesh>
            <cylinderGeometry args={[0.62, 0.78, 1.35, 5, 1, false]} />
            <meshStandardMaterial
              color={index % 2 ? '#3f3448' : '#50405b'}
              emissive="#2d2036"
              emissiveIntensity={0.46}
              metalness={0.84}
              roughness={0.48}
            />
          </mesh>
          <mesh
            position={[0, 0, 0.72]}
            scale={[0.04, 0.72, 0.03]}
            rotation={[0, 0, index % 2 ? 0.38 : -0.28]}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="#a97bc1" toneMapped={false} />
          </mesh>
        </group>
      ))}
      <mesh position={[0.08, 0.12, -1.28]} scale={[2.25, 2.7, 0.16]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#3e2a4c" transparent opacity={0.1} wireframe />
      </mesh>
    </>
  )
}

function HopeWorld({ detailColor }: { detailColor: string }) {
  const branchCurves = useMemo(
    () =>
      [-1, 1].flatMap((side) => [
        new CatmullRomCurve3([
          new Vector3(side * 0.2, -2.3, -0.5),
          new Vector3(side * 0.52, -0.7, -0.42),
          new Vector3(side * 1.12, 1.2, -0.56),
          new Vector3(side * 1.8, 3.55, -0.82),
        ]),
        new CatmullRomCurve3([
          new Vector3(side * 0.32, -1.95, -0.32),
          new Vector3(side * 0.82, -0.1, -0.36),
          new Vector3(side * 1.72, 1.42, -0.62),
          new Vector3(side * 2.72, 2.58, -0.98),
        ]),
        new CatmullRomCurve3([
          new Vector3(side * 0.12, -1.72, -0.18),
          new Vector3(side * 0.36, 0.18, -0.22),
          new Vector3(side * 0.62, 2.1, -0.44),
          new Vector3(side * 0.88, 4.15, -0.74),
        ]),
      ]),
    [],
  )

  return (
    <>
      {branchCurves.map((curve, index) => (
        <mesh key={index}>
          <tubeGeometry args={[curve, 52, index % 3 === 2 ? 0.022 : 0.04, 7, false]} />
          <meshStandardMaterial
            color={index % 3 === 1 ? detailColor : '#d8b678'}
            emissive="#9d7845"
            emissiveIntensity={0.96}
            metalness={0.42}
            roughness={0.36}
          />
        </mesh>
      ))}
      {[-1, 1].flatMap((side) =>
        [0, 1].map((index) => (
          <mesh
            key={`${side}-${index}`}
            position={[side * (1.02 + index * 0.7), 0.72 + index * 0.5, -0.72]}
            rotation={[
              0,
              0,
              side < 0 ? Math.PI * (0.54 + index * 0.05) : -0.15 - index * 0.15,
            ]}
          >
            <torusGeometry
              args={[1.62 + index * 0.42, 0.038 - index * 0.006, 6, 64, Math.PI * 0.58]}
            />
            <meshBasicMaterial
              color={index === 1 ? detailColor : '#e4c792'}
              transparent
              opacity={0.38 - index * 0.08}
              toneMapped={false}
            />
          </mesh>
        )),
      )}
      <mesh position={[0, 2.15, -1.55]} scale={[1.4, 4.8, 1.2]}>
        <sphereGeometry args={[0.32, 20, 14]} />
        <meshBasicMaterial
          color="#d5ad72"
          transparent
          opacity={0.055}
          toneMapped={false}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
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
