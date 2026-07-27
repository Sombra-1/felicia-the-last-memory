export const PALETTE = {
  void: '#07070a',
  graphite: '#15151b',
  metal: '#2a2931',
  silver: '#c9c5d2',
  white: '#eeeaf2',
  violet: '#71627f',
  violetDark: '#3e324a',
  hope: '#c9a875',
  hopeSoft: '#ead8b4',
} as const

export const SCENE_CHARACTERISTICS = {
  activeLights: 2,
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
  ambientIntensity: 0.5,
  fogNear: 8,
  fogFar: 22,
  bloomIntensity: 0.38,
  bloomThreshold: 0.78,
  bloomSmoothing: 0.26,
  vignetteOffset: 0.24,
  vignetteDarkness: 0.54,
  particleOpacity: 0.4,
  criticalLineOpacity: 0.26,
} as const
