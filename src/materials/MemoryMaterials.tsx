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
uniform float uThickness;

void main() {
  vec3 normal = normalize(vNormal);
  float facing = clamp(dot(normal, normalize(vView)), 0.0, 1.0);
  float fresnel = min(pow(1.0 - facing, 3.15), 0.72);
  vec3 lightDirection = normalize(vec3(-0.42, 0.76, 0.5));
  float key = max(dot(normal, lightDirection), 0.0);
  float rear = max(dot(-normal, lightDirection), 0.0);
  vec3 reflected = reflect(-lightDirection, normal);
  float narrowHighlight = pow(max(dot(reflected, normalize(vView)), 0.0), 42.0);
  float inner = 0.5 + 0.5 * sin(
    vLocal.y * 5.4
    - uTime * 0.42
    + vLocal.x * 2.1
    + sin(vLocal.z * 3.7 + uTime * 0.18)
  );
  float lamina = 0.5 + 0.5 * sin(
    length(vLocal.xz) * 18.0
    - vLocal.y * 3.0
    + uTime * 0.34
  );
  float capillary = pow(
    max(0.0, sin(vUv.y * 22.0 + vUv.x * 7.0 - uTime * 0.72)),
    14.0
  );
  float caustic = pow(max(0.0, sin(
    vLocal.y * 9.0
    + vLocal.x * 5.0
    - vLocal.z * 7.0
    - uTime * 0.58
  )), 8.0);
  float front = gl_FrontFacing ? 1.0 : 0.0;
  vec3 tissue = mix(uDepth, uBody, 0.32 + inner * 0.32 + lamina * 0.08);
  tissue = mix(
    tissue,
    uAccent,
    fresnel * (0.48 + uThickness * 0.16)
      + capillary * (0.05 + uEnergy * 0.15)
      + caustic * 0.06
      + narrowHighlight * 0.42
  );
  tissue *= 0.38 + key * 0.58 + rear * 0.12;
  tissue += uAccent * narrowHighlight * (0.22 + uThickness * 0.18);
  tissue += uAccent * uEnergy * inner * 0.065;
  tissue *= mix(0.58, 1.08, front);
  float alpha = uOpacity * (
    0.46
    + fresnel * (0.38 + uLayer * 0.12 + uThickness * 0.1)
    + inner * 0.055
    + lamina * 0.035
    + capillary * 0.05
    + caustic * 0.03
    + narrowHighlight * 0.08
    + uEnergy * 0.065
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
  thickness?: number
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
  thickness = 0.46,
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
          uThickness: { value: thickness },
        },
        transparent: true,
        depthWrite: false,
        side,
        blending: NormalBlending,
      }),
    [accent, body, depth, distortion, layer, opacity, side, thickness],
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

interface MemoryGlassMaterialProps {
  body?: string
  accent?: string
  opacity?: number
  roughness?: number
  transmission?: number
  thickness?: number
  side?: Side
}

export function MemoryGlassMaterial({
  body = '#1a181d',
  accent = '#8d8392',
  opacity = 0.58,
  roughness = 0.24,
  transmission = 0,
  thickness = 1.1,
  side = DoubleSide,
}: MemoryGlassMaterialProps) {
  return (
    <meshPhysicalMaterial
      color={body}
      emissive={accent}
      emissiveIntensity={0.045}
      metalness={0.12}
      roughness={roughness}
      transmission={transmission}
      thickness={thickness}
      ior={1.27}
      attenuationColor={body}
      attenuationDistance={2.4}
      clearcoat={0.62}
      clearcoatRoughness={0.2}
      transparent
      opacity={opacity}
      depthWrite={false}
      side={side}
    />
  )
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
varying vec3 vLocal;
varying vec2 vUv;
uniform float uTime;
uniform float uRelief;
void main() {
  vUv = uv;
  vLocal = position;
  float broadRelief = sin(position.y * 1.72 + sin(position.x * 1.18) * 0.72)
    * cos(position.z * 1.34 - position.x * 0.44);
  float cutRelief = sin(position.y * 7.6 + position.x * 2.2 + position.z * 4.4);
  vec3 transformed = position
    + normal * (broadRelief * 0.72 + cutRelief * 0.12) * uRelief;
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
varying vec3 vLocal;
varying vec2 vUv;
uniform vec3 uBody;
uniform vec3 uEdge;
uniform float uTime;
uniform float uOpacity;
uniform float uVariation;
uniform float uBrush;
uniform float uRelief;

void main() {
  vec3 normal = normalize(vNormal);
  float rim = pow(1.0 - max(dot(normal, normalize(vView)), 0.0), 2.0);
  float key = max(0.0, dot(normal, normalize(vec3(-0.42, 0.78, 0.46))));
  float grazing = pow(
    max(0.0, dot(normal, normalize(vec3(0.72, 0.28, 0.62)))),
    6.0
  );
  float grain = 0.5 + 0.5 * sin(
    vWorld.y * 3.1
    + vWorld.z * 1.7
    + sin(vWorld.x * 1.9) * 0.8
    + uTime * 0.026
  );
  float brushing = 0.5 + 0.5 * sin(
    vLocal.y * 52.0 + vLocal.x * 5.0 + sin(vLocal.z * 19.0)
  );
  float strata = 0.5 + 0.5 * sin(
    vWorld.y * 1.82
    + sin(vWorld.x * 0.74) * 1.3
    + cos(vWorld.z * 0.91) * 0.84
  );
  float mineral = fract(sin(dot(
    floor(vWorld.xyz * vec3(2.4, 3.2, 2.1)),
    vec3(12.9898, 78.233, 37.719)
  )) * 43758.5453);
  float pore = smoothstep(0.9, 1.0, mineral);
  float seam = pow(max(0.0, sin(vUv.y * 14.0 + strata * 0.8)), 24.0);
  vec3 color = uBody * (
    0.21
    + key * 0.48
    + grazing * 0.34
    + grain * uVariation
    + strata * uVariation * 0.24
    + brushing * uBrush * 0.2
  );
  color += uEdge * (
    key * 0.018
    + strata * uVariation * 0.075
    + brushing * uBrush * 0.045
  );
  color *= 1.0 - pore * (0.055 + uRelief * 0.8);
  color = mix(
    color,
    uEdge,
    rim * 0.52 + grazing * 0.1 + seam * 0.014 + pore * 0.018
  );
  gl_FragColor = vec4(color, uOpacity);
}
`

interface ArchitecturalMaterialProps {
  body?: string
  edge?: string
  opacity?: number
  variation?: number
  brush?: number
  relief?: number
  side?: Side
}

export function ArchitecturalMaterial({
  body = '#15151b',
  edge = '#76717e',
  opacity = 1,
  variation = 0.08,
  brush = 0.035,
  relief = 0.018,
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
          uBrush: { value: brush },
          uRelief: { value: relief },
        },
        transparent: opacity < 1,
        depthWrite: opacity > 0.68,
        side,
      }),
    [body, brush, edge, opacity, relief, side, variation],
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

const scarVertex = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vView;
uniform float uEnergy;
void main() {
  vUv = uv;
  vec3 displaced = position + normal * uEnergy * 0.012;
  vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`

const scarFragment = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vView;
uniform vec3 uColor;
uniform vec3 uHot;
uniform float uTime;
uniform float uEnergy;
uniform float uOpacity;
uniform float uGrowth;

void main() {
  float center = 1.0 - abs(vUv.x * 2.0 - 1.0);
  float taper = smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.72, vUv.y);
  float propagation = smoothstep(vUv.y - 0.14, vUv.y + 0.06, uGrowth);
  float wound = pow(max(0.0, center), 4.5);
  float packet = pow(max(0.0, sin(vUv.y * 26.0 - uTime * 1.25)), 12.0);
  float rim = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 1.8);
  vec3 color = mix(uColor, uHot, packet * 0.48 + rim * 0.24 + uEnergy * 0.18);
  float alpha = uOpacity * taper * propagation * (0.28 + wound * 0.62 + packet * 0.18);
  gl_FragColor = vec4(color, alpha);
}
`

interface ScarMaterialProps {
  color: string
  hot?: string
  opacity?: number
  growth?: EnergySource
  energy?: EnergySource
}

export function ScarMaterial({
  color,
  hot = '#ffffff',
  opacity = 0.9,
  growth,
  energy,
}: ScarMaterialProps) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: scarVertex,
        fragmentShader: scarFragment,
        uniforms: {
          uColor: { value: new Color(color) },
          uHot: { value: new Color(hot) },
          uTime: { value: 0 },
          uEnergy: { value: 0 },
          uOpacity: { value: opacity },
          uGrowth: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
        toneMapped: false,
      }),
    [color, hot, opacity],
  )

  useEffect(() => () => material.dispose(), [material])
  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime
    material.uniforms.uEnergy.value = resolveEnergy(energy)
    material.uniforms.uGrowth.value = resolveEnergy(growth)
    material.uniforms.uOpacity.value = opacity
  })

  return <primitive object={material} attach="material" />
}
