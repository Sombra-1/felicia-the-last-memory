export const PALETTE = {
  void: '#08080c',
  graphite: '#191920',
  metal: '#32313a',
  silver: '#c9c5d2',
  white: '#eeeaf2',
  violet: '#71627f',
  violetDark: '#3e324a',
  hope: '#c9a875',
  hopeSoft: '#ead8b4',
} as const

export const SCENE_CHARACTERISTICS = {
  activeLights: 3,
  shadowCastingLights: 0,
  shadowsEnabled: false,
  fragmentCount: 3,
  particleCounts: {
    low: 24,
    medium: 52,
    high: 88,
  },
} as const

export const VISUAL_CALIBRATION = {
  keyLightIntensity: 40,
  ambientIntensity: 0.66,
  fogNear: 9,
  fogFar: 24,
  bloomIntensity: 0.24,
  bloomThreshold: 0.9,
  bloomSmoothing: 0.18,
  vignetteOffset: 0.24,
  vignetteDarkness: 0.44,
  particleOpacity: 0.46,
  criticalLineOpacity: 0.32,
} as const
