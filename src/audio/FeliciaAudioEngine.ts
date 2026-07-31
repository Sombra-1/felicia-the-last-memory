import type { ExperiencePhase, FragmentId } from '../state/experienceStore'
import {
  AUDIO_CALIBRATION,
  FRAGMENT_AUDIO_SIGNATURES,
  getRecallSpacing,
  PHASE_AMBIENT_LEVEL,
  type AudioDiagnostics,
  type AudioEvent,
} from './audioConfig'

type DiagnosticsListener = (diagnostics: AudioDiagnostics) => void

function safeStop(source: AudioScheduledSourceNode) {
  try {
    source.stop()
  } catch {
    // A source that has already ended is safe to ignore.
  }
}

export class FeliciaAudioEngine {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private ambient: GainNode | null = null
  private cueBus: GainNode | null = null
  private captureDestination: MediaStreamAudioDestinationNode | null = null
  private ambientSources: AudioScheduledSourceNode[] = []
  private transientSources = new Set<AudioScheduledSourceNode>()
  private listener: DiagnosticsListener | null = null
  private diagnostics: AudioDiagnostics = {
    status: 'idle',
    ambientStartCount: 0,
    lastEvent: 'none',
    masterGain: 0,
    ambientGain: 0,
    cueGain: 0,
  }
  private enabled = true
  private volume = 0.96
  private phase: ExperiencePhase = 'loading'

  setDiagnosticsListener(listener: DiagnosticsListener | null) {
    this.listener = listener
    listener?.(this.getDiagnostics())
  }

  getDiagnostics() {
    return { ...this.diagnostics }
  }

  isRunning() {
    return this.context?.state === 'running'
  }

  getCaptureStream() {
    return this.captureDestination?.stream ?? null
  }

  async unlock() {
    if (this.diagnostics.status === 'unavailable') return false

    try {
      if (!this.context) this.createGraph()
      await this.context?.resume()
      if (!this.context || this.context.state !== 'running') {
        this.updateDiagnostics({ status: 'suspended' })
        return false
      }
      this.ensureAmbient()
      this.applyMasterGain(0.08)
      this.applyAmbientLevel(this.phase, 0.15)
      this.updateDiagnostics({ status: 'running' })
      return true
    } catch {
      this.updateDiagnostics({ status: 'unavailable' })
      return false
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    this.applyMasterGain(0.12)
    if (this.context) {
      this.updateDiagnostics({ lastEvent: enabled ? 'unmuted' : 'muted' })
    }
  }

  setVolume(volume: number) {
    this.volume = Math.min(1, Math.max(0, volume))
    this.applyMasterGain(0.12)
  }

  setPhase(phase: ExperiencePhase) {
    this.phase = phase
    this.applyAmbientLevel(phase)
    if (!this.context || this.context.state !== 'running' || !this.enabled) return

    if (phase === 'reconstruction-synchronizing') {
      this.playTone([147, 220, 294], 2.2, 'triangle', 0, 0.44, 1.02)
      this.recordEvent('reconstruction-synchronizing')
    } else if (phase === 'reconstruction-initiating') {
      this.playTone([147, 220, 294, 441], 1.45, 'triangle', 0, 0.68, 1.06)
      this.recordEvent('reconstruction-recognition')
    } else if (phase === 'reconstruction-collapse') {
      this.playTone([110, 147, 185, 277], 2.1, 'triangle', -0.08, 0.72, 0.82)
      this.recordEvent('reconstruction-collapse')
    } else if (phase === 'reconstruction-void') {
      this.playTone([147, 220, 294], 1.02, 'sine', 0, 0.28, 1.01)
      this.recordEvent('reconstruction-void')
    } else if (phase === 'reconstruction-rebuilding') {
      this.playTone([110, 220, 294, 441], 3.75, 'triangle', 0, 0.7, 1.22)
      this.recordEvent('reconstruction-rebuilding')
    } else if (phase === 'reconstruction-reveal') {
      this.playTone([220, 294, 441, 588], 1.58, 'sine', 0, 0.6, 1.05)
      this.recordEvent('reconstruction-reveal')
    } else if (phase === 'resetting') {
      this.stopTransients()
    }
  }

  playActivationSignature() {
    if (!this.canPlay()) return false
    const now = this.context!.currentTime
    ;[
      { frequency: 130.8, delay: 0, duration: 1.05, pan: -0.18, rise: 1.2 },
      { frequency: 196, delay: 0.14, duration: 1.2, pan: 0.18, rise: 1.14 },
      { frequency: 293.7, delay: 0.34, duration: 1.45, pan: -0.08, rise: 1.09 },
      { frequency: 440, delay: 0.62, duration: 1.72, pan: 0.1, rise: 1.04 },
    ].forEach(({ frequency, delay, duration, pan, rise }) => {
      this.scheduleOscillator({
        frequency,
        type: 'sine',
        start: now + delay,
        duration,
        pan,
        intensity: 0.46,
        rise,
      })
    })
    this.recordEvent('entry-activation')
    return true
  }

  playSoundConfirmation() {
    if (!this.canPlay()) return false
    this.playTone([220, 330, 440], 0.62, 'sine', 0, 0.58, 1.04)
    this.recordEvent('sound-confirmed')
    return true
  }

  playCalibrationSequence() {
    if (!import.meta.env.DEV || !this.canPlay()) return false
    const now = this.context!.currentTime
    const references: Array<{
      frequency: number
      type: OscillatorType
      offset: number
      duration: number
      pan: number
      intensity: number
      rise: number
    }> = [
      {
        frequency: 196,
        type: 'sine',
        offset: 0,
        duration: 0.75,
        pan: 0,
        intensity: 0.2,
        rise: 1,
      },
      {
        frequency: 440,
        type: 'sine',
        offset: 1,
        duration: 0.75,
        pan: -0.18,
        intensity: 0.28,
        rise: 1,
      },
      {
        frequency: 146.8,
        type: 'triangle',
        offset: 2,
        duration: 0.75,
        pan: 0.18,
        intensity: 0.3,
        rise: 0.92,
      },
      {
        frequency: 261.6,
        type: 'sine',
        offset: 3,
        duration: 0.9,
        pan: 0,
        intensity: 0.3,
        rise: 1.12,
      },
      {
        frequency: 185,
        type: 'triangle',
        offset: 4.15,
        duration: 1.1,
        pan: 0,
        intensity: 0.34,
        rise: 0.84,
      },
      {
        frequency: 329.6,
        type: 'sine',
        offset: 5.5,
        duration: 1.25,
        pan: 0,
        intensity: 0.32,
        rise: 1.05,
      },
    ]
    references.forEach((reference) => {
      this.scheduleOscillator({
        frequency: reference.frequency,
        type: reference.type,
        start: now + reference.offset,
        duration: reference.duration,
        pan: reference.pan,
        intensity: reference.intensity,
        rise: reference.rise,
      })
    })
    this.recordEvent('calibration-sequence')
    return true
  }

  playFragment(fragment: FragmentId) {
    if (!this.canPlay()) return
    const signature = FRAGMENT_AUDIO_SIGNATURES[fragment]
    const now = this.context!.currentTime

    signature.frequencies.forEach((frequency, index) => {
      const delay =
        fragment === 'identity'
          ? index * 0.11
          : fragment === 'fear'
            ? index * 0.17 + (index === 1 ? 0.08 : 0)
            : index * 0.2
      const pan = signature.pan[index % signature.pan.length]
      this.scheduleOscillator({
        frequency,
        type: signature.oscillator,
        start: now + delay,
        duration: signature.duration - index * 0.12,
        pan,
        intensity: fragment === 'fear' ? 0.62 : 0.72,
        rise: fragment === 'hope' ? 1.06 : 1,
      })
    })
    this.recordEvent(`fragment-${fragment}`)
  }

  playTrialBeat(fragment: FragmentId, beat: number) {
    if (!this.canPlay()) return
    const signature = FRAGMENT_AUDIO_SIGNATURES[fragment]
    const root = signature.frequencies[Math.min(beat, 2)]
    const intervals =
      fragment === 'identity'
        ? [root, root * 1.5]
        : fragment === 'fear'
          ? [root, root * 1.335]
          : [root, root * 1.26, root * 1.5]
    this.playTone(
      intervals,
      0.72 + beat * 0.16,
      signature.oscillator,
      beat === 0 ? -0.18 : beat === 2 ? 0.18 : 0,
      fragment === 'fear' ? 0.46 : 0.52,
      fragment === 'hope' ? 1.08 : fragment === 'fear' ? 0.94 : 1,
    )
    this.recordEvent(`trial-${fragment}-${beat + 1}`)
  }

  playChamberMotifs(order: readonly FragmentId[]) {
    if (!this.canPlay() || order.length === 0) return
    const now = this.context!.currentTime
    order.forEach((fragment, index) => {
      const signature = FRAGMENT_AUDIO_SIGNATURES[fragment]
      const weight = [0.6, 0.25, 0.15][index] ?? 0.15
      this.scheduleOscillator({
        frequency: signature.frequencies[index % signature.frequencies.length],
        type: signature.oscillator,
        start: now + index * 0.18,
        duration: 1.35 + index * 0.16,
        pan: index === 0 ? -0.16 : index === 2 ? 0.16 : 0,
        intensity: 0.16 + weight * 0.34,
        rise: fragment === 'hope' ? 1.05 : fragment === 'fear' ? 0.96 : 1,
      })
    })
    this.recordEvent(`motifs-${order.join('-')}`)
  }

  playRecallOrder(order: readonly FragmentId[], reducedIntensity: boolean) {
    if (!this.canPlay()) return
    const spacing = getRecallSpacing(reducedIntensity)
    order.forEach((fragment, index) => {
      const signature = FRAGMENT_AUDIO_SIGNATURES[fragment]
      this.scheduleOscillator({
        frequency: signature.frequencies[0],
        type: signature.oscillator,
        start: this.context!.currentTime + index * spacing,
        duration: Math.min(0.92, spacing * 0.86),
        pan: index === 0 ? -0.18 : index === 2 ? 0.18 : 0,
        intensity: [0.72, 0.42, 0.28][index] ?? 0.28,
        rise: fragment === 'hope' ? 1.08 : 1,
      })
    })
    this.recordEvent(`reconstruction-recall-${order.join('-')}`)
  }

  playEndingProfile(profile: FragmentId) {
    if (!this.canPlay()) return
    const frequencies: Record<FragmentId, number[]> = {
      identity: [220, 294, 441],
      fear: [110, 147, 220],
      hope: [220, 330, 441],
    }
    this.playTone(
      frequencies[profile],
      profile === 'hope' ? 5.2 : profile === 'identity' ? 4.6 : 4.2,
      profile === 'fear' ? 'triangle' : 'sine',
      0,
      profile === 'fear' ? 0.62 : 0.68,
      profile === 'hope' ? 1.08 : profile === 'fear' ? 0.94 : 1,
    )
    this.recordEvent(`ending-${profile}`)
  }

  async suspend() {
    if (!this.context || this.context.state !== 'running') return
    try {
      await this.context.suspend()
      this.updateDiagnostics({ status: 'suspended' })
    } catch {
      // Visibility changes must never block the visual experience.
    }
  }

  async resume() {
    if (!this.context || !this.enabled) return false
    try {
      await this.context.resume()
      const running = this.context.state === 'running'
      this.updateDiagnostics({ status: running ? 'running' : 'suspended' })
      this.applyMasterGain(0.12)
      return running
    } catch {
      this.updateDiagnostics({ status: 'unavailable' })
      return false
    }
  }

  dispose() {
    this.stopTransients()
    this.ambientSources.forEach(safeStop)
    this.ambientSources = []
    void this.context?.close()
    this.context = null
    this.master = null
    this.ambient = null
    this.cueBus = null
    this.captureDestination = null
    this.diagnostics = {
      status: 'idle',
      ambientStartCount: 0,
      lastEvent: 'none',
      masterGain: 0,
      ambientGain: 0,
      cueGain: 0,
    }
  }

  private createGraph() {
    const AudioContextConstructor =
      window.AudioContext ??
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext
        }
      ).webkitAudioContext
    if (!AudioContextConstructor) {
      this.updateDiagnostics({ status: 'unavailable' })
      throw new Error('Web Audio unavailable')
    }

    const context = new AudioContextConstructor({ latencyHint: 'playback' })
    const master = context.createGain()
    const compressor = context.createDynamicsCompressor()
    const ambient = context.createGain()
    const cueBus = context.createGain()
    const captureDestination = context.createMediaStreamDestination()

    compressor.threshold.value = AUDIO_CALIBRATION.safetyCompressor.threshold
    compressor.knee.value = AUDIO_CALIBRATION.safetyCompressor.knee
    compressor.ratio.value = AUDIO_CALIBRATION.safetyCompressor.ratio
    compressor.attack.value = AUDIO_CALIBRATION.safetyCompressor.attack
    compressor.release.value = AUDIO_CALIBRATION.safetyCompressor.release
    master.gain.value = 0
    ambient.gain.value = 0
    cueBus.gain.value = AUDIO_CALIBRATION.cueGain

    ambient.connect(master)
    cueBus.connect(master)
    master.connect(compressor)
    compressor.connect(context.destination)
    compressor.connect(captureDestination)

    this.context = context
    this.master = master
    this.ambient = ambient
    this.cueBus = cueBus
    this.captureDestination = captureDestination
    context.addEventListener('statechange', () => {
      if (context !== this.context) return
      this.updateDiagnostics({
        status:
          context.state === 'running'
            ? 'running'
            : context.state === 'suspended'
              ? 'suspended'
              : this.diagnostics.status,
      })
    })
    this.updateDiagnostics({ cueGain: AUDIO_CALIBRATION.cueGain })
  }

  private ensureAmbient() {
    if (!this.context || !this.ambient || this.ambientSources.length > 0) return
    const filter = this.context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 1600
    filter.Q.value = 0.52
    filter.connect(this.ambient)

    ;[
      { frequency: 110, type: 'sine' as const, gain: 0.018 },
      { frequency: 165, type: 'triangle' as const, gain: 0.022 },
      { frequency: 220, type: 'sine' as const, gain: 0.034 },
      { frequency: 330, type: 'sine' as const, gain: 0.014 },
      { frequency: 495, type: 'sine' as const, gain: 0.007 },
    ].forEach(({ frequency, type, gain }) => {
      const oscillator = this.context!.createOscillator()
      const oscillatorGain = this.context!.createGain()
      oscillator.type = type
      oscillator.frequency.value = frequency
      oscillatorGain.gain.value = gain
      oscillator.connect(oscillatorGain)
      oscillatorGain.connect(filter)
      oscillator.start()
      this.ambientSources.push(oscillator)
    })

    const noise = this.context.createBufferSource()
    const noiseGain = this.context.createGain()
    const noiseFilter = this.context.createBiquadFilter()
    const sampleCount = Math.floor(this.context.sampleRate * 1.5)
    const buffer = this.context.createBuffer(1, sampleCount, this.context.sampleRate)
    const samples = buffer.getChannelData(0)
    let seed = 9147
    for (let index = 0; index < samples.length; index += 1) {
      seed = (seed * 16807) % 2147483647
      samples[index] = (seed / 2147483647) * 2 - 1
    }
    noise.buffer = buffer
    noise.loop = true
    noiseGain.gain.value = 0.014
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.value = 920
    noiseFilter.Q.value = 0.82
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(this.ambient)
    noise.start()
    this.ambientSources.push(noise)

    this.updateDiagnostics({
      ambientStartCount: this.diagnostics.ambientStartCount + 1,
      lastEvent: 'ambient-start',
    })
  }

  private canPlay() {
    return Boolean(
      this.context && this.cueBus && this.context.state === 'running' && this.enabled,
    )
  }

  private playTone(
    frequencies: number[],
    duration: number,
    type: OscillatorType,
    pan: number,
    intensity: number,
    rise = 1,
  ) {
    if (!this.canPlay()) return
    frequencies.forEach((frequency, index) => {
      this.scheduleOscillator({
        frequency,
        type,
        start: this.context!.currentTime + index * 0.16,
        duration: duration - index * 0.12,
        pan: pan + (index - 1) * 0.08,
        intensity: intensity / Math.max(1, frequencies.length * 0.62),
        rise,
      })
    })
  }

  private scheduleOscillator({
    frequency,
    type,
    start,
    duration,
    pan,
    intensity,
    rise,
  }: {
    frequency: number
    type: OscillatorType
    start: number
    duration: number
    pan: number
    intensity: number
    rise: number
  }) {
    if (!this.context || !this.cueBus) return
    const oscillator = this.context.createOscillator()
    const envelope = this.context.createGain()
    const panner = this.context.createStereoPanner()
    const peak = Math.min(0.3, intensity)
    const end = start + Math.max(0.12, duration)

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, start)
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(28, frequency * rise), end)
    panner.pan.value = Math.min(0.55, Math.max(-0.55, pan))
    envelope.gain.setValueAtTime(0.0001, start)
    envelope.gain.exponentialRampToValueAtTime(peak, start + 0.045)
    envelope.gain.exponentialRampToValueAtTime(0.0001, end)

    oscillator.connect(envelope)
    envelope.connect(panner)
    panner.connect(this.cueBus)
    oscillator.start(start)
    oscillator.stop(end + 0.04)
    this.transientSources.add(oscillator)
    oscillator.addEventListener('ended', () => {
      this.transientSources.delete(oscillator)
      oscillator.disconnect()
      envelope.disconnect()
      panner.disconnect()
    })
  }

  private applyMasterGain(fade: number = AUDIO_CALIBRATION.fadeSeconds) {
    if (!this.context || !this.master) return
    const target = this.enabled ? AUDIO_CALIBRATION.masterGain * this.volume : 0.0001
    this.master.gain.cancelScheduledValues(this.context.currentTime)
    this.master.gain.setTargetAtTime(
      Math.max(0.0001, target),
      this.context.currentTime,
      Math.max(0.015, fade / 4),
    )
    this.updateDiagnostics({ masterGain: target })
  }

  private applyAmbientLevel(
    phase: ExperiencePhase,
    fade: number = AUDIO_CALIBRATION.fadeSeconds,
  ) {
    if (!this.context || !this.ambient) return
    const phaseLevel = PHASE_AMBIENT_LEVEL[phase] ?? 0
    const target = Math.max(0.0001, AUDIO_CALIBRATION.ambientGain * phaseLevel)
    this.ambient.gain.cancelScheduledValues(this.context.currentTime)
    this.ambient.gain.setTargetAtTime(
      target,
      this.context.currentTime,
      Math.max(0.025, fade / 3),
    )
    this.updateDiagnostics({ ambientGain: target })
  }

  private stopTransients() {
    this.transientSources.forEach(safeStop)
    this.transientSources.clear()
  }

  private recordEvent(lastEvent: AudioEvent) {
    this.updateDiagnostics({ lastEvent })
  }

  private updateDiagnostics(update: Partial<AudioDiagnostics>) {
    this.diagnostics = { ...this.diagnostics, ...update }
    this.listener?.(this.getDiagnostics())
  }
}

export const feliciaAudioEngine = new FeliciaAudioEngine()
