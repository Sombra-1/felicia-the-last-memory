# Audio Design

## Intent

Sound represents a dormant machine consciousness rather than a score. It stays beneath the
visual hierarchy: low electrical resonance, distant archive movement, fragile tonal memory
signatures, and a faint signal in the void. There is no music loop, impact sample, sub-bass
effect, or narration.

## Architecture

`AudioCoordinator` is the only React lifecycle owner. `FeliciaAudioEngine` owns one lazy Web
Audio graph:

```text
ambient oscillators + filtered deterministic noise ─┐
                                                    ├─ master gain ─ compressor ─ output
scheduled fragment/reconstruction cue bus ──────────┘
```

The graph is created only from the Enter button's pointer or keyboard gesture. A second
idempotent unlock in the coordinator safely handles browser timing differences. Ambient
sources start at most once per page journey and remain one graph across replay.

The master gain is `0.20 × 0.72` by default. Cue gain is capped at `0.075`; a compressor with
a -20 dB threshold prevents peaks. Frequencies remain between approximately 52 Hz and 700 Hz
for memory signatures, avoiding inaudible sub-bass and painful upper frequencies.

## Ambient foundation

- 52 Hz sine: low machine resonance;
- 78 Hz triangle: quiet mechanical overtone;
- deterministic 1.5-second noise buffer through a 620 Hz band-pass: sparse archive texture;
- shared low-pass and long gain ramps: no abrupt loop boundary.

Phase gain changes create the arc. Chamber ambience is full but quiet; collapse contracts to
28%; the void retains 4.5%; rebuilding expands gradually; reset fades near silence.

## Memory signatures

- **Identity:** 330 / 495 / 660 Hz sine intervals, symmetrical left-right placement, short
  synchronized entries.
- **Fear:** 82.4 / 103.8 / 155.6 Hz triangle tones, uneven entry spacing, restrained stereo
  imbalance.
- **Hope:** 196 / 246.9 / 293.7 Hz sine tones with a slight upward frequency ramp and longer
  breath-like tail.

Recall schedules the three foundation tones in exact `collectionOrder`. Reduced intensity
uses shorter non-zero spacing while preserving order.

## Reconstruction and endings

Recognition clarifies a centered pulse. Collapse adds a low narrowing interval rather than
an impact. Void retains one quiet 146.8 Hz signal. Rebuilding introduces a restrained open
triad.

- Identity-first ends on stable centered 220 / 330 / 440 Hz intervals.
- Fear-first uses a quieter triangle relationship at 92.5 / 138.6 / 207.7 Hz.
- Hope-first uses 174.6 / 261.6 / 329.6 Hz with a slight unresolved rise.

## Lifecycle and failure

Mute is persisted in local storage and never bypassed by replay. Hidden pages suspend the
context; visible pages resume only after prior interaction and only when sound is enabled.
Audio initialization failure marks sound unavailable, disables the audio control, and never
blocks the visual experience.

Automated browser tests verify context state, mute, fragment routing, recall order, ending
profile, visibility suspension, replay deduplication, and failure isolation. Subjective
headphone and laptop-speaker balance remains a human review item because this environment
cannot audition physical output.
