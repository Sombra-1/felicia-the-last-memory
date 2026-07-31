export const PALETTE = {
  void: '#030506',
  graphite: '#11181b',
  metal: '#273036',
  silver: '#aebbc0',
  white: '#d8d6cd',
  violet: '#68466f',
  violetDark: '#211823',
  hope: '#b9823f',
  hopeSoft: '#ead9b9',
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
  keyLightIntensity: 34,
  ambientIntensity: 0.42,
  fogNear: 10,
  fogFar: 28,
  bloomIntensity: 0.18,
  bloomThreshold: 1.02,
  bloomSmoothing: 0.14,
  vignetteOffset: 0.2,
  vignetteDarkness: 0.38,
  particleOpacity: 0,
  criticalLineOpacity: 0.32,
} as const
