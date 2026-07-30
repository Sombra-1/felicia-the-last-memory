import { describe, expect, it, vi } from 'vitest'
import { FeliciaAudioEngine } from '../audio/FeliciaAudioEngine'
import {
  AUDIO_CALIBRATION,
  FRAGMENT_AUDIO_SIGNATURES,
  getRecallSpacing,
  PHASE_AMBIENT_LEVEL,
} from '../audio/audioConfig'
import { readAudioPreference, writeAudioPreference } from '../audio/audioPreferences'
import { getSoundControlState } from '../audio/soundControlState'
import { fragmentIds } from '../state/experienceStore'

describe('audio safety and configuration', () => {
  it('cannot create ambience or cues before an explicit unlock', () => {
    const engine = new FeliciaAudioEngine()

    engine.setPhase('chamber')
    engine.playFragment('identity')
    engine.playRecallOrder(['identity', 'fear', 'hope'], false)
    engine.playEndingProfile('identity')

    expect(engine.getDiagnostics()).toEqual({
      status: 'idle',
      ambientStartCount: 0,
      lastEvent: 'none',
      masterGain: 0,
      ambientGain: 0,
      cueGain: 0,
    })
  })

  it('defines a restrained unique signature for every fragment', () => {
    expect(Object.keys(FRAGMENT_AUDIO_SIGNATURES)).toEqual(fragmentIds)
    expect(
      new Set(fragmentIds.map((id) => FRAGMENT_AUDIO_SIGNATURES[id].frequencies[0])).size,
    ).toBe(3)

    fragmentIds.forEach((fragment) => {
      const signature = FRAGMENT_AUDIO_SIGNATURES[fragment]
      expect(signature.frequencies.every((frequency) => frequency >= 52)).toBe(true)
      expect(signature.frequencies.every((frequency) => frequency <= 700)).toBe(true)
      expect(signature.duration).toBeGreaterThan(0.8)
      expect(signature.duration).toBeLessThan(2.5)
    })
  })

  it('keeps the normal mix audible on small speakers and limiter protected', () => {
    expect(AUDIO_CALIBRATION.masterGain).toBeGreaterThanOrEqual(0.8)
    expect(AUDIO_CALIBRATION.masterGain).toBeLessThanOrEqual(0.95)
    expect(AUDIO_CALIBRATION.cueGain).toBeGreaterThanOrEqual(0.5)
    expect(AUDIO_CALIBRATION.ambientGain).toBeGreaterThanOrEqual(0.8)
    expect(AUDIO_CALIBRATION.safetyCompressor.threshold).toBeLessThanOrEqual(-14)
    expect(AUDIO_CALIBRATION.safetyCompressor.ratio).toBeGreaterThanOrEqual(6)
    expect(PHASE_AMBIENT_LEVEL['reconstruction-void']).toBeGreaterThan(0)
    expect(PHASE_AMBIENT_LEVEL['reconstruction-void']).toBeLessThan(
      PHASE_AMBIENT_LEVEL.chamber!,
    )
  })

  it('uses shorter but non-zero recall spacing for reduced intensity', () => {
    expect(getRecallSpacing(true)).toBeGreaterThan(0)
    expect(getRecallSpacing(true)).toBeLessThan(getRecallSpacing(false))
  })
})

describe('audio preference persistence', () => {
  it('reads only explicit stored boolean values', () => {
    expect(readAudioPreference({ getItem: () => 'false' })).toBe(false)
    expect(readAudioPreference({ getItem: () => 'true' })).toBe(true)
    expect(readAudioPreference({ getItem: () => 'unexpected' })).toBeNull()
    expect(readAudioPreference()).toBeNull()
  })

  it('writes a stable value without requiring storage support', () => {
    const setItem = vi.fn()
    writeAudioPreference(false, { setItem })
    writeAudioPreference(true)

    expect(setItem).toHaveBeenCalledWith('felicia-audio-enabled', 'false')
  })
})

describe('truthful sound control state', () => {
  it('never labels suspended or idle audio as on', () => {
    expect(getSoundControlState(true, 'idle').label).toBe('Enable sound')
    expect(getSoundControlState(true, 'suspended').label).toBe(
      'Sound blocked — tap to enable',
    )
    expect(getSoundControlState(true, 'running').label).toBe('Sound on')
  })

  it('keeps explicit mute and unavailable states distinct', () => {
    expect(getSoundControlState(false, 'running')).toMatchObject({
      label: 'Sound off',
      active: false,
      disabled: false,
    })
    expect(getSoundControlState(true, 'unavailable')).toMatchObject({
      label: 'Sound unavailable',
      active: false,
      disabled: true,
    })
  })
})
