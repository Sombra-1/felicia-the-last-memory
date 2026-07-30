/* eslint-disable react-hooks/immutability -- Shader uniforms are animated imperatively. */
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import {
  AdditiveBlending,
  BackSide,
  Color,
  DoubleSide,
  FrontSide,
  NormalBlending,
  ShaderMaterial,
  type Side,
} from 'three'

type EnergySource = number | (() => number)

function resolveEnergy(source: EnergySource | undefined) {
  return typeof source === 'function' ? source() : (source ?? 0)
}

const shellVertex = `
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vLocal;
varying vec2 vUv;
uniform float uTime;
uniform float uEnergy;
uniform float uDistortion;

void main() {
  vUv = uv;
  vLocal = position;
  float tissue = sin(position.y * 5.4 + uTime * 0.42)
    * cos(position.x * 4.1 - uTime * 0.25);
  vec3 displaced = position + normal * tissue * uDistortion * (0.35 + uEnergy * 0.65);
  vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`

const shellFragment = `
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vLocal;
varying vec2 vUv;
uniform vec3 uBody;
uniform vec3 uAccent;
uniform vec3 uDepth;
uniform float uTime;
uniform float uEnergy;
uniform float uOpacity;
uniform float uLayer;

void main() {
  vec3 normal = normalize(vNormal);
  float facing = clamp(dot(normal, normalize(vView)), 0.0, 1.0);
  float fresnel = pow(1.0 - facing, 2.45);
  float inner = 0.5 + 0.5 * sin(vLocal.y * 6.2 - uTime * 0.6 + vLocal.x * 2.3);
  float capillary = pow(max(0.0, sin(vUv.y * 25.0 + vUv.x * 8.0 - uTime)), 12.0);
  float front = gl_FrontFacing ? 1.0 : 0.0;
  vec3 tissue = mix(uDepth, uBody, 0.42 + inner * 0.28);
  tissue = mix(tissue, uAccent, fresnel * 0.82 + capillary * (0.08 + uEnergy * 0.2));
  tissue += uAccent * uEnergy * inner * 0.08;
  tissue *= mix(0.66, 1.05, front);
  float alpha = uOpacity * (
    0.15
    + fresnel * (0.56 + uLayer * 0.14)
    + inner * 0.08
    + capillary * 0.12
    + uEnergy * 0.08
  );
  gl_FragColor = vec4(tissue, clamp(alpha, 0.0, 0.94));
}
`

interface MemoryShellMaterialProps {
  body?: string
  accent?: string
  depth?: string
  opacity?: number
  distortion?: number
  layer?: number
  energy?: EnergySource
  side?: Side
}

export function MemoryShellMaterial({
  body = '#36303b',
  accent = '#b7a7c1',
  depth = '#111016',
  opacity = 0.72,
  distortion = 0.018,
  layer = 0,
  energy,
  side = DoubleSide,
}: MemoryShellMaterialProps) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: shellVertex,
        fragmentShader: shellFragment,
        uniforms: {
          uBody: { value: new Color(body) },
          uAccent: { value: new Color(accent) },
          uDepth: { value: new Color(depth) },
          uTime: { value: 0 },
          uEnergy: { value: 0 },
          uOpacity: { value: opacity },
          uDistortion: { value: distortion },
          uLayer: { value: layer },
        },
        transparent: true,
        depthWrite: false,
        side,
        blending: NormalBlending,
      }),
    [accent, body, depth, distortion, layer, opacity, side],
  )

  useEffect(() => () => material.dispose(), [material])
  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime
    material.uniforms.uEnergy.value = resolveEnergy(energy)
    material.uniforms.uOpacity.value = opacity
  })

  return <primitive object={material} attach="material" />
}

export function MemoryShellBackMaterial(
  props: Omit<MemoryShellMaterialProps, 'side' | 'layer'>,
) {
  return <MemoryShellMaterial {...props} layer={1} side={BackSide} />
}

const filamentVertex = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`

const filamentFragment = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vView;
uniform vec3 uColor;
uniform vec3 uHot;
uniform float uTime;
uniform float uEnergy;
uniform float uOpacity;
uniform float uRhythm;

void main() {
  float taper = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.76, vUv.x);
  float packet = pow(max(0.0, sin(vUv.x * 34.0 - uTime * uRhythm)), 9.0);
  float edge = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 1.6);
  vec3 color = mix(uColor, uHot, packet * 0.72 + edge * 0.34 + uEnergy * 0.14);
  float alpha = uOpacity * taper * (0.34 + packet * 0.56 + edge * 0.25);
  gl_FragColor = vec4(color, alpha);
}
`

interface EnergyFilamentMaterialProps {
  color: string
  hot?: string
  opacity?: number
  rhythm?: number
  energy?: EnergySource
}

export function EnergyFilamentMaterial({
  color,
  hot = '#ffffff',
  opacity = 0.84,
  rhythm = 2.2,
  energy,
}: EnergyFilamentMaterialProps) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: filamentVertex,
        fragmentShader: filamentFragment,
        uniforms: {
          uColor: { value: new Color(color) },
          uHot: { value: new Color(hot) },
          uTime: { value: 0 },
          uEnergy: { value: 0 },
          uOpacity: { value: opacity },
          uRhythm: { value: rhythm },
        },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
        toneMapped: false,
      }),
    [color, hot, opacity, rhythm],
  )

  useEffect(() => () => material.dispose(), [material])
  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime
    material.uniforms.uEnergy.value = resolveEnergy(energy)
    material.uniforms.uOpacity.value = opacity
  })

  return <primitive object={material} attach="material" />
}

const architectureVertex = `
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vWorld;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 transformed = position;
  vec3 transformedNormal = normal;
  #ifdef USE_INSTANCING
    transformed = (instanceMatrix * vec4(transformed, 1.0)).xyz;
    transformedNormal = mat3(instanceMatrix) * transformedNormal;
  #endif
  vec4 world = modelMatrix * vec4(transformed, 1.0);
  vWorld = world.xyz;
  vec4 mv = viewMatrix * world;
  vNormal = normalize(normalMatrix * transformedNormal);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`

const architectureFragment = `
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vWorld;
varying vec2 vUv;
uniform vec3 uBody;
uniform vec3 uEdge;
uniform float uTime;
uniform float uOpacity;
uniform float uVariation;

void main() {
  vec3 normal = normalize(vNormal);
  float rim = pow(1.0 - max(dot(normal, normalize(vView)), 0.0), 2.2);
  float key = max(0.0, dot(normal, normalize(vec3(-0.42, 0.78, 0.46))));
  float grain = 0.5 + 0.5 * sin(vWorld.y * 3.1 + vWorld.z * 1.7 + uTime * 0.035);
  float seam = pow(max(0.0, sin(vUv.y * 16.0)), 18.0);
  vec3 color = uBody * (0.36 + key * 0.5 + grain * uVariation);
  color = mix(color, uEdge, rim * 0.68 + seam * 0.08);
  gl_FragColor = vec4(color, uOpacity);
}
`

interface ArchitecturalMaterialProps {
  body?: string
  edge?: string
  opacity?: number
  variation?: number
  side?: Side
}

export function ArchitecturalMaterial({
  body = '#15151b',
  edge = '#76717e',
  opacity = 1,
  variation = 0.08,
  side = FrontSide,
}: ArchitecturalMaterialProps) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: architectureVertex,
        fragmentShader: architectureFragment,
        uniforms: {
          uBody: { value: new Color(body) },
          uEdge: { value: new Color(edge) },
          uTime: { value: 0 },
          uOpacity: { value: opacity },
          uVariation: { value: variation },
        },
        transparent: opacity < 1,
        depthWrite: opacity > 0.68,
        side,
      }),
    [body, edge, opacity, side, variation],
  )

  useEffect(() => () => material.dispose(), [material])
  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime
  })

  return <primitive object={material} attach="material" />
}

const fieldVertex = `
varying vec2 vUv;
varying vec3 vNormal;
uniform float uTime;
uniform float uProgress;
uniform float uDistortion;
void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  float fold = sin(position.y * 4.0 + uTime * 1.2)
    * cos(position.x * 3.0 - uTime * 0.7);
  vec3 displaced = position + normal * fold * uDistortion * uProgress;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`

const fieldFragment = `
varying vec2 vUv;
varying vec3 vNormal;
uniform vec3 uColor;
uniform vec3 uAccent;
uniform float uTime;
uniform float uProgress;
uniform float uOpacity;
void main() {
  float passage = pow(max(0.0, sin(vUv.y * 18.0 - uTime * 2.4)), 7.0);
  float aperture = smoothstep(0.48, 0.04, abs(vUv.x - 0.5));
  float edge = pow(1.0 - abs(vNormal.z), 1.8);
  vec3 color = mix(uColor, uAccent, passage * 0.7 + edge * 0.3);
  float alpha = uOpacity * uProgress * aperture * (0.22 + passage * 0.56 + edge * 0.18);
  gl_FragColor = vec4(color, alpha);
}
`

interface MemoryFieldMaterialProps {
  color: string
  accent: string
  opacity?: number
  distortion?: number
  progress?: EnergySource
}

export function MemoryFieldMaterial({
  color,
  accent,
  opacity = 0.58,
  distortion = 0.12,
  progress,
}: MemoryFieldMaterialProps) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: fieldVertex,
        fragmentShader: fieldFragment,
        uniforms: {
          uColor: { value: new Color(color) },
          uAccent: { value: new Color(accent) },
          uTime: { value: 0 },
          uProgress: { value: 0 },
          uOpacity: { value: opacity },
          uDistortion: { value: distortion },
        },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
        toneMapped: false,
      }),
    [accent, color, distortion, opacity],
  )

  useEffect(() => () => material.dispose(), [material])
  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime
    material.uniforms.uProgress.value = resolveEnergy(progress)
  })

  return <primitive object={material} attach="material" />
}
