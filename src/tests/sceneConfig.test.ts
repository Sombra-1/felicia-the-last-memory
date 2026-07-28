import { describe, expect, it } from 'vitest'
import { getCameraLayout } from '../camera/cameraConfig'
import {
  FRAGMENT_CAMERA_CHOREOGRAPHY,
  getFragmentTransitionDurations,
} from '../camera/fragmentCameraConfig'
import { FRAGMENT_PROTOTYPES } from '../content/fragments'
import { inferQualityLevel, QUALITY_PROFILES } from '../scene/config/quality'
import { SCENE_CHARACTERISTICS } from '../scene/config/visual'

describe('quality configuration', () => {
  it('reduces expensive features and particle density at low quality', () => {
    expect(QUALITY_PROFILES.low.postprocessing).toBe(false)
    expect(QUALITY_PROFILES.low.antialias).toBe(false)
    expect(QUALITY_PROFILES.low.dpr[1]).toBe(1)
    expect(QUALITY_PROFILES.low.particleCount).toBeLessThan(
      QUALITY_PROFILES.medium.particleCount,
    )
    expect(QUALITY_PROFILES.medium.particleCount).toBeLessThan(
      QUALITY_PROFILES.high.particleCount,
    )
    expect(QUALITY_PROFILES.low.readabilityBoost).toBeGreaterThan(
      QUALITY_PROFILES.high.readabilityBoost,
    )
    expect(QUALITY_PROFILES.low.toneMappingExposure).toBeGreaterThan(
      QUALITY_PROFILES.high.toneMappingExposure,
    )
    expect(QUALITY_PROFILES.low.lineOpacity).toBeGreaterThan(
      QUALITY_PROFILES.high.lineOpacity,
    )
  })

  it('selects a conservative mobile tier and a low tier for constrained devices', () => {
    expect(
      inferQualityLevel({
        hardwareConcurrency: 8,
        viewportWidth: 390,
        deviceMemory: 8,
      }),
    ).toBe('medium')
    expect(
      inferQualityLevel({
        hardwareConcurrency: 2,
        viewportWidth: 1440,
        deviceMemory: 2,
      }),
    ).toBe('low')
    expect(
      inferQualityLevel({
        hardwareConcurrency: 12,
        viewportWidth: 1440,
        deviceMemory: 16,
      }),
    ).toBe('high')
  })
})

describe('responsive camera composition', () => {
  it('uses a distinct portrait composition rather than shrinking desktop framing', () => {
    const desktop = getCameraLayout(1440, 900)
    const mobile = getCameraLayout(390, 844)

    expect(desktop.sceneOffset[0]).toBeGreaterThan(1)
    expect(mobile.sceneOffset[1]).toBeGreaterThan(1)
    expect(mobile.position[2]).toBeGreaterThan(desktop.position[2])
    expect(mobile.fov).toBeGreaterThan(desktop.fov)
    expect(mobile.sceneScale).toBeLessThan(desktop.sceneScale)
  })

  it('defines desktop and mobile choreography for every fragment', () => {
    for (const fragment of FRAGMENT_PROTOTYPES) {
      const choreography = FRAGMENT_CAMERA_CHOREOGRAPHY[fragment.id]
      expect(choreography.desktopOffset).toHaveLength(3)
      expect(choreography.mobileOffset).toHaveLength(3)
      expect(choreography.desktopFov).toBeGreaterThan(20)
      expect(choreography.mobileFov).toBeGreaterThan(20)
    }
  })

  it('uses valid shorter transition durations for reduced motion', () => {
    for (const fragment of FRAGMENT_PROTOTYPES) {
      const standard = getFragmentTransitionDurations(fragment.id, false)
      const reduced = getFragmentTransitionDurations(fragment.id, true)

      expect(reduced.approach).toBeGreaterThan(0)
      expect(reduced.hold).toBeGreaterThan(0)
      expect(reduced.return).toBeGreaterThan(0)
      expect(reduced.approach).toBeLessThan(standard.approach)
      expect(reduced.hold).toBeLessThan(standard.hold)
      expect(reduced.return).toBeLessThan(standard.return)
    }
  })

  it('uses an intermediate composition for tablet viewports', () => {
    const tablet = getCameraLayout(1024, 768)

    expect(tablet.sceneScale).toBe(1)
    expect(tablet.position).toEqual([0.8, 0.55, 10])
  })
})

describe('scene invariants', () => {
  it('defines one unique prototype for every memory fragment', () => {
    expect(FRAGMENT_PROTOTYPES.map((fragment) => fragment.id)).toEqual([
      'identity',
      'fear',
      'hope',
    ])
    expect(
      new Set(FRAGMENT_PROTOTYPES.map((fragment) => fragment.position.join(','))).size,
    ).toBe(3)
  })

  it('keeps the lighting and shadow budget restrained', () => {
    expect(SCENE_CHARACTERISTICS.activeLights).toBe(3)
    expect(SCENE_CHARACTERISTICS.shadowCastingLights).toBe(0)
    expect(SCENE_CHARACTERISTICS.shadowsEnabled).toBe(false)
  })
})
