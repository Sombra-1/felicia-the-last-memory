/* eslint-disable react-hooks/immutability -- Three.js groups are staged imperatively. */
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  CatmullRomCurve3,
  DoubleSide,
  Group,
  MathUtils,
  ShaderMaterial,
  Shape,
  Vector3,
} from 'three'
import { entranceRuntime } from '../experience/entranceRuntime'
import {
  ArchitecturalMaterial,
  EnergyFilamentMaterial,
  MemoryGlassMaterial,
  MemoryShellMaterial,
  ScarMaterial,
} from '../materials/MemoryMaterials'
import { deriveEndingConfiguration } from '../reconstruction/endingProfiles'
import { reconstructionRuntime } from '../reconstruction/reconstructionRuntime'
import { useExperienceStore } from '../state/experienceStore'
import { trialRuntime } from '../trials/trialRuntime'

const EXTRUSION = {
  depth: 0.72,
  bevelEnabled: true,
  bevelSegments: 2,
  steps: 1,
  bevelSize: 0.08,
  bevelThickness: 0.08,
} as const

function useMonolithShape(variant: 'nave' | 'buttress' | 'threshold') {
  return useMemo(() => {
    const shape = new Shape()
    if (variant === 'threshold') {
      shape.moveTo(-0.34, -3.6)
      shape.lineTo(0.42, -3.34)
      shape.lineTo(0.3, -0.48)
      shape.lineTo(0.9, 2.8)
      shape.lineTo(0.24, 3.75)
      shape.lineTo(-0.4, 3.18)
      shape.lineTo(-0.58, -2.65)
    } else if (variant === 'buttress') {
      shape.moveTo(-0.7, -3.45)
      shape.lineTo(0.66, -3.2)
      shape.lineTo(0.46, -0.4)
      shape.lineTo(1.08, 2.42)
      shape.lineTo(0.26, 3.62)
      shape.lineTo(-0.56, 2.82)
    } else {
      shape.moveTo(-0.86, -3.7)
      shape.lineTo(0.78, -3.46)
      shape.lineTo(0.48, -0.16)
      shape.lineTo(1.2, 3.5)
      shape.lineTo(0.18, 4.28)
      shape.lineTo(-0.72, 3.42)
    }
    shape.closePath()
    return shape
  }, [variant])
}

function CathedralMonolith({
  variant = 'nave',
  edge = '#5f5b63',
  opacity = 1,
}: {
  variant?: 'nave' | 'buttress' | 'threshold'
  edge?: string
  opacity?: number
}) {
  const shape = useMonolithShape(variant)
  return (
    <mesh>
      <extrudeGeometry args={[shape, EXTRUSION]} />
      <ArchitecturalMaterial
        body="#090a0d"
        edge={edge}
        opacity={opacity}
        variation={0.075}
        brush={0.045}
        side={DoubleSide}
      />
    </mesh>
  )
}

function CathedralFloor() {
  const shape = useMemo(() => {
    const floor = new Shape()
    floor.moveTo(-5.8, 3.4)
    floor.lineTo(5.8, 3.4)
    floor.lineTo(3.2, -4.8)
    floor.lineTo(-3.2, -4.8)
    floor.closePath()
    return floor
  }, [])

  return (
    <group position={[0, -2.72, -0.4]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <shapeGeometry args={[shape]} />
        <ArchitecturalMaterial
          body="#08090b"
          edge="#37353b"
          opacity={0.98}
          variation={0.055}
          brush={0.025}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.15, 0.02]} scale={[1.5, 2.45, 1]}>
        <circleGeometry args={[1, 48]} />
        <meshBasicMaterial
          color="#020204"
          transparent
          opacity={0.72}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

function MemoryAperture() {
  const shaft = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform float uOpacity;
          void main() {
            float horizontal = smoothstep(0.5, 0.08, abs(vUv.x - 0.5));
            float vertical = smoothstep(0.0, 0.18, vUv.y)
              * smoothstep(1.0, 0.62, vUv.y);
            float core = pow(horizontal, 2.2);
            gl_FragColor = vec4(
              vec3(0.9, 0.88, 0.92),
              uOpacity * core * vertical
            );
          }
        `,
        uniforms: { uOpacity: { value: 0.02 } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
      }),
    [],
  )

  useFrame(() => {
    const pulse = Math.sin(entranceRuntime.pulse * Math.PI)
    const rebuilding = MathUtils.smootherstep(reconstructionRuntime.rebuild, 0.68, 1)
    shaft.uniforms.uOpacity.value =
      0.015 + entranceRuntime.sweep * 0.045 + pulse * 0.1 + rebuilding * 0.065
  })

  return (
    <group position={[0, 0.9, -5.8]}>
      <mesh position={[0, 0, 0]} scale={[1.1, 5.8, 1]}>
        <planeGeometry />
        <primitive object={shaft} attach="material" />
      </mesh>
      <mesh position={[0, -0.2, 0.04]} scale={[0.028, 4.4, 0.05]}>
        <boxGeometry />
        <meshBasicMaterial
          color="#ded9e1"
          transparent
          opacity={0.3}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

function IdentityMaterialRupture() {
  const root = useRef<Group>(null)
  const left = useRef<Group>(null)
  const right = useRef<Group>(null)
  const axis = useRef<Group>(null)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const phase = useExperienceStore((state) => state.phase)

  useFrame(() => {
    if (!root.current || !left.current || !right.current || !axis.current) return
    const active = activeFragment === 'identity' && phase.startsWith('trial-')
    const outward = phase === 'trial-returning' ? 1 - trialRuntime.returnProgress : 1
    const progress = active
      ? MathUtils.smootherstep(
          trialRuntime.departure * 0.58 + trialRuntime.passage * 0.42,
          0,
          1,
        ) * outward
      : 0
    root.current.visible = progress > 0.002
    if (!root.current.visible) return
    root.current.position.set(
      MathUtils.lerp(-1.78, 0, progress),
      MathUtils.lerp(1.42, 0.15, progress),
      MathUtils.lerp(0.28, -4.7, progress),
    )
    root.current.scale.setScalar(MathUtils.lerp(0.04, 1, progress))
    const spread = MathUtils.lerp(0.18, 2.35, progress)
    left.current.position.x = -spread
    right.current.position.x = spread
    left.current.rotation.y = MathUtils.lerp(-0.8, -0.15, progress)
    right.current.rotation.y = MathUtils.lerp(0.8, 0.15, progress)
    left.current.rotation.z = MathUtils.lerp(0.58, 0.025, progress)
    right.current.rotation.z = MathUtils.lerp(-0.58, -0.025, progress)
    axis.current.scale.set(
      MathUtils.lerp(0.05, 1, progress),
      MathUtils.lerp(0.04, 1, progress),
      1,
    )
  })

  return (
    <group ref={root} visible={false} name="identity-material-rupture">
      <group ref={left} scale={[0.62, 0.88, 0.72]}>
        <CathedralMonolith variant="threshold" edge="#c5d0d6" opacity={0.86} />
      </group>
      <group ref={right} scale={[-0.62, 0.88, 0.72]}>
        <CathedralMonolith variant="threshold" edge="#c5d0d6" opacity={0.86} />
      </group>
      <group ref={axis}>
        <mesh scale={[0.018, 4.1, 0.03]}>
          <boxGeometry />
          <meshBasicMaterial
            color="#edf3f5"
            transparent
            opacity={0.64}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  )
}

function FearMaterialRupture() {
  const root = useRef<Group>(null)
  const left = useRef<Group>(null)
  const up = useRef<Group>(null)
  const right = useRef<Group>(null)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const phase = useExperienceStore((state) => state.phase)
  const scar = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(-0.26, -0.52, 0.24),
        new Vector3(-0.08, -0.12, 0.42),
        new Vector3(0.12, 0.2, 0.4),
        new Vector3(0.25, 0.52, 0.18),
      ]),
    [],
  )

  useFrame(() => {
    if (!root.current || !left.current || !up.current || !right.current) return
    const active = activeFragment === 'fear' && phase.startsWith('trial-')
    const outbound = MathUtils.smootherstep(trialRuntime.passage, 0, 1)
    const returning = phase === 'trial-returning'
    const progress = active ? (returning ? 1 - trialRuntime.returnProgress : outbound) : 0
    root.current.visible = progress > 0.002
    if (!root.current.visible) return

    if (returning) {
      root.current.position.set(
        MathUtils.lerp(0, 0.68, trialRuntime.returnProgress),
        MathUtils.lerp(0.58, 0.36, trialRuntime.returnProgress),
        MathUtils.lerp(-4.08, 0.34, trialRuntime.returnProgress),
      )
      root.current.scale.setScalar(MathUtils.lerp(1, 0.16, trialRuntime.returnProgress))
    } else {
      root.current.position.set(
        MathUtils.lerp(2.92, 0, progress),
        MathUtils.lerp(0.9, 0.58, progress),
        MathUtils.lerp(-0.08, -4.08, progress),
      )
      root.current.scale.setScalar(MathUtils.lerp(0.08, 1, progress))
    }

    const spread = MathUtils.smootherstep(progress, 0.24, 1)
    left.current.position.set(-0.92 * spread, 0, 0)
    up.current.position.set(0, 1.08 * spread, 0)
    right.current.position.set(0.92 * spread, 0, 0)
    left.current.rotation.z = MathUtils.lerp(-0.18, -Math.PI / 2, spread)
    up.current.rotation.z = MathUtils.lerp(-0.18, 0, spread)
    right.current.rotation.z = MathUtils.lerp(-0.18, Math.PI / 2, spread)
  })

  const plate = (ref: React.RefObject<Group | null>) => (
    <group ref={ref}>
      <mesh scale={[0.42, 0.74, 0.22]}>
        <sphereGeometry args={[1, 28, 16, 0.1, Math.PI * 0.84, 0.16, Math.PI * 0.72]} />
        <MemoryGlassMaterial
          body="#211825"
          accent="#966fa5"
          opacity={0.72}
          roughness={0.2}
          transmission={0}
          thickness={0.86}
        />
      </mesh>
      <mesh position={[0, 0, 0.2]}>
        <tubeGeometry args={[scar, 26, 0.022, 6, false]} />
        <ScarMaterial
          color="#593765"
          hot="#d89ae5"
          growth={() => trialRuntime.departure + trialRuntime.passage}
          energy={() => trialRuntime.fearPulse}
        />
      </mesh>
    </group>
  )

  return (
    <group ref={root} visible={false} name="fear-material-rupture">
      {plate(left)}
      {plate(up)}
      {plate(right)}
      <pointLight color="#9e71af" intensity={2.5} distance={5.5} decay={2} />
    </group>
  )
}

function HopeMaterialRupture() {
  const root = useRef<Group>(null)
  const aperture = useRef<Group>(null)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const phase = useExperienceStore((state) => state.phase)
  const filament = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(0, 0, 0),
        new Vector3(-0.42, 0.74, -1.15),
        new Vector3(-1.08, 1.82, -2.78),
        new Vector3(-1.82, 2.36, -4.42),
      ]),
    [],
  )

  useFrame(() => {
    if (!root.current || !aperture.current) return
    const active = activeFragment === 'hope' && phase.startsWith('trial-')
    const outbound = MathUtils.smootherstep(trialRuntime.passage, 0, 1)
    const returning = phase === 'trial-returning'
    const progress = active ? (returning ? 1 - trialRuntime.returnProgress : outbound) : 0
    root.current.visible = progress > 0.002
    if (!root.current.visible) return

    if (returning) {
      root.current.position.set(
        MathUtils.lerp(1.82, 0.08, trialRuntime.returnProgress),
        MathUtils.lerp(-1.82, 1.08, trialRuntime.returnProgress),
        MathUtils.lerp(0.42, 0.48, trialRuntime.returnProgress),
      )
      root.current.scale.setScalar(MathUtils.lerp(1, 0.12, trialRuntime.returnProgress))
    } else {
      root.current.position.set(1.82, -1.82, 0.42)
      root.current.scale.set(progress, MathUtils.lerp(0.06, 1, progress), progress)
    }
    aperture.current.position.copy(filament.getPointAt(Math.max(0.01, progress)))
    aperture.current.scale.set(
      MathUtils.lerp(0.12, 1, progress),
      MathUtils.lerp(0.05, 1, progress),
      MathUtils.lerp(0.12, 1, progress),
    )
    aperture.current.rotation.z = MathUtils.lerp(-0.72, 0, progress)
  })

  return (
    <group ref={root} visible={false} name="hope-material-rupture">
      <mesh>
        <tubeGeometry args={[filament, 56, 0.038, 7, false]} />
        <EnergyFilamentMaterial
          color="#9d7038"
          hot="#f5ca82"
          opacity={0.92}
          rhythm={1.06}
          energy={() =>
            Math.max(
              trialRuntime.departure,
              trialRuntime.passage,
              trialRuntime.inputEnergy,
            )
          }
        />
      </mesh>
      <group ref={aperture}>
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[side * 0.32, 0, 0]}
            rotation={[0, side * -0.16, side * -0.42]}
            scale={[0.28, 0.72, 0.2]}
          >
            <sphereGeometry args={[1, 26, 16]} />
            <MemoryShellMaterial
              body="#3d2d19"
              depth="#0b0804"
              accent="#e5b970"
              opacity={0.68}
              distortion={0.022}
              thickness={0.8}
              energy={() => trialRuntime.passage}
            />
          </mesh>
        ))}
        <pointLight color="#e0ad60" intensity={3.2} distance={5.8} decay={2} />
      </group>
    </group>
  )
}

export function Phase8Cathedral() {
  const root = useRef<Group>(null)
  const leftNave = useRef<Group>(null)
  const rightNave = useRef<Group>(null)
  const rear = useRef<Group>(null)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const phase = useExperienceStore((state) => state.phase)
  const order = useExperienceStore((state) => state.collectionOrder)
  const ending = useMemo(() => deriveEndingConfiguration(order), [order])

  useFrame(({ clock }, delta) => {
    if (!root.current || !leftNave.current || !rightNave.current || !rear.current) return
    const passage =
      activeFragment && phase.startsWith('trial-')
        ? phase === 'trial-returning'
          ? 1 - trialRuntime.returnProgress
          : MathUtils.smootherstep(
              trialRuntime.departure * 0.58 + trialRuntime.passage * 0.42,
              0,
              1,
            )
        : 0
    const identityPassage = activeFragment === 'identity' ? passage : 0
    const fearPassage = activeFragment === 'fear' ? passage : 0
    const hopePassage = activeFragment === 'hope' ? passage : 0
    const rebuild =
      phase === 'reconstruction-rebuilding'
        ? reconstructionRuntime.rebuild
        : phase === 'reconstruction-reveal' || phase === 'ending'
          ? 1
          : 0
    const cathedralResponse = MathUtils.smootherstep(rebuild, 0.72, 1)
    const profile = ending?.profile.id
    const profileSpread =
      profile === 'hope'
        ? cathedralResponse * 0.95
        : profile === 'fear'
          ? cathedralResponse * -0.42
          : 0
    const transitionDepth =
      identityPassage * -3.2 + fearPassage * -2.82 + hopePassage * -3.18

    root.current.position.z = MathUtils.damp(
      root.current.position.z,
      transitionDepth,
      reducedMotion ? 12 : 2.1,
      delta,
    )
    root.current.scale.set(
      1 - fearPassage * 0.04 + hopePassage * 0.08,
      MathUtils.lerp(0.82, 1, entranceRuntime.architecture) *
        (1 - fearPassage * 0.06 + hopePassage * 0.1),
      1,
    )
    const naveX =
      3.65 +
      profileSpread -
      identityPassage * 0.56 -
      fearPassage * 0.72 +
      hopePassage * 1.08
    leftNave.current.position.x = MathUtils.damp(
      leftNave.current.position.x,
      -naveX,
      reducedMotion ? 12 : 1.8,
      delta,
    )
    rightNave.current.position.x = MathUtils.damp(
      rightNave.current.position.x,
      naveX,
      reducedMotion ? 12 : 1.8,
      delta,
    )
    leftNave.current.rotation.z =
      0.045 +
      identityPassage * 0.1 +
      fearPassage * 0.12 -
      hopePassage * 0.08 +
      (profile === 'fear' ? cathedralResponse * 0.08 : 0)
    rightNave.current.rotation.z =
      -0.045 -
      identityPassage * 0.1 -
      fearPassage * 0.08 +
      hopePassage * 0.08 -
      (profile === 'fear' ? cathedralResponse * 0.02 : 0)
    rear.current.scale.set(
      1 + cathedralResponse * (profile === 'hope' ? 0.25 : 0),
      1 + cathedralResponse * (profile === 'identity' ? 0.08 : 0),
      1,
    )
    rear.current.position.y = cathedralResponse * (profile === 'hope' ? 0.56 : 0)
    if (!reducedMotion && !phase.startsWith('reconstruction-')) {
      rear.current.rotation.y = Math.sin(clock.elapsedTime * 0.1) * 0.004
    }
  })

  return (
    <group ref={root} name="phase8-optical-cathedral">
      <MemoryAperture />
      <group ref={rear}>
        <group
          position={[-2.65, 0.15, -5.1]}
          rotation={[0, -0.08, 0.02]}
          scale={[0.7, 1, 0.72]}
        >
          <CathedralMonolith variant="threshold" edge="#48454d" />
        </group>
        <group
          position={[2.65, 0.15, -5.1]}
          rotation={[0, 0.08, -0.02]}
          scale={[-0.7, 1, 0.72]}
        >
          <CathedralMonolith variant="threshold" edge="#48454d" />
        </group>
      </group>
      <group ref={leftNave} position={[-3.65, -0.05, -1.35]} rotation={[0, -0.1, 0.045]}>
        <group scale={[0.92, 1.08, 1]}>
          <CathedralMonolith variant="nave" edge="#5d5963" />
        </group>
        <group position={[0.82, 0.15, -1.6]} scale={[0.54, 0.82, 0.72]}>
          <CathedralMonolith variant="buttress" edge="#38363d" />
        </group>
      </group>
      <group ref={rightNave} position={[3.65, -0.05, -1.35]} rotation={[0, 0.1, -0.045]}>
        <group scale={[-0.92, 1.08, 1]}>
          <CathedralMonolith variant="nave" edge="#5d5963" />
        </group>
        <group position={[-0.82, 0.15, -1.6]} scale={[-0.54, 0.82, 0.72]}>
          <CathedralMonolith variant="buttress" edge="#38363d" />
        </group>
      </group>
      <group
        position={[-5.75, -0.25, 2.2]}
        rotation={[0, -0.12, 0.03]}
        scale={[0.88, 1.15, 1]}
      >
        <CathedralMonolith variant="buttress" edge="#26242a" />
      </group>
      <group
        position={[5.75, -0.25, 2.2]}
        rotation={[0, 0.12, -0.03]}
        scale={[-0.88, 1.15, 1]}
      >
        <CathedralMonolith variant="buttress" edge="#26242a" />
      </group>
      <CathedralFloor />
      <IdentityMaterialRupture />
      <FearMaterialRupture />
      <HopeMaterialRupture />
    </group>
  )
}
