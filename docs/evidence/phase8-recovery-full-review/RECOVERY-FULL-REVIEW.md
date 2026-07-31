# Phase 8 Recovery — Full Human Visual Review

Captured 2026-07-30. This package is the final review gate before any merge,
deployment, or submission.

## Recovery result

The implementation now uses one consistent abstract-living-machine subject
through the chamber, all three trials, reconstruction, and the three endings.
FELICIA is built from one asymmetric glass mantle, an articulated memory rail,
embedded scar tissue, and directed neural flow. There is no humanoid face,
paired butterfly anatomy, smooth central egg, or hanging diamond body.

The Optical Cathedral remains the spatial framework. Its three monumental
vault masses stretch, compress, or open in response to the selected memory,
while FELICIA remains the active subject.

## What changed after the approved recovery slice

### Fear

- Replaced the previous Phase 8 trial with `RecoveryFearTrial`.
- Incoming shutdown pressure now travels from the active direction toward
  FELICIA as an extruded pressure front with directional filaments.
- Three asymmetric defensive plates grow from FELICIA's actual rail and remain
  connected by neural tendons.
- The selected plate thickens and deforms before impact.
- Impact propagates a translucent embedded wound rather than lighting a
  separate target object.
- The same cathedral vaults compress around FELICIA as the defensive anatomy
  closes.
- On return, the full defensive organ contracts continuously into its
  order-weighted permanent anatomical scale.

### Hope

- Replaced the previous Phase 8 trial with `RecoveryHopeTrial`.
- The guided signal is a deforming shard with an internal filament and a
  preserved trail, not a sphere.
- Three alternating growth gates open through narrow asymmetric glass sheaths.
- Completed paths remain as permanent neural growth in the world.
- A single asymmetric growth organ opens upward from FELICIA; there is no
  paired-wing construction.
- The cathedral physically separates and rises as the living signal exceeds
  its prescribed route.
- On return, the trial-scale growth contracts into a persistent gold neural
  filament threaded through FELICIA.

### Material continuity

- `RecoveryCathedral` uses the same three custom vault masses in every state.
  Their position, scale, relief, and grazing response transform; scenes are not
  replaced behind an opacity fade.
- `RecoveryFelicia` is one persistent object. The same mantle, rail, knot,
  armor, and growth systems move through the chamber and trials.
- Trial-return anatomy now interpolates directly from full trial scale to the
  permanent first/second/third-memory scale before the collected-memory state
  is committed, removing the former disappearance seam.
- The existing `TransitionDirector` remains authoritative for departure,
  passage, arrival, completion, and return timing.

### Anatomy-first reconstruction

- The camera begins close to FELICIA's opened mantle and exposed rail.
- Three recognizable anatomical ports detach while remaining joined to fixed
  insertion points by memory tendons.
- The synchronization node drives pulse stability, tendon flow, and internal
  illumination.
- Memory influence is visibly weighted at 60% / 25% / 15% through tendon
  width, light strength, and insertion hierarchy.
- Foundation formation deforms the actual body before the cathedral settles
  around it.

### Final profile silhouettes

- **Identity:** narrow, vertical, sealed chassis with a formal central blade
  and exact rail posture.
- **Fear:** broad, lowered, asymmetrically armored body with an unmistakable
  guarded outline.
- **Hope:** tall open anatomy with a large upper aperture and neural growth
  extending beyond the mantle.

Secondary memories remain visible as integrated anatomy, but only the
foundation memory receives the profile-scale deformation.

## Primary review artifacts

- `recovery-full-contact-sheet.png` — 16 authored gameplay and ending frames.
- `transition-contact-sheet.png` — departure and return midpoint comparison for
  all three memories.
- `final-profile-silhouettes.png` — color and grayscale silhouette comparison.
- `before-after-comparison.png` — Phase 7.1, rejected Phase 8, and recovery.
- `mobile-contact-sheet.png` — Fear, Hope, and Hope-ending mobile evidence.
- `video/full-reconstruction-review-with-browser-audio.webm` — 21.7-second
  anatomy-first reconstruction review with real browser audio.
- `video/*-review-slow.webm` — six slowed departure/return review clips.
- `walkthrough/felicia-recovery-first-time-walkthrough-with-browser-audio.webm`
  — complete 194.9-second first-time journey with browser audio.

Raw, unretimed transition and reconstruction captures are retained beside the
review cuts.

## Human visual review

### Is first-glance impact stronger?

Yes. The opening now presents one large asymmetric silhouette against three
monumental framing masses. The fragment organs remain subordinate. Fear
arrives as one compressed defensive gesture; Hope arrives as one vertical
rupture.

### Are transitions smoother and materially transformative?

Yes. Departure changes existing cathedral mass, FELICIA posture, material
propagation, and camera position along one gesture. Returns reverse that
gesture while contracting the completed trial organ directly into FELICIA.
There is no primary panel-slide plus object-appearance transition.

### Is reconstruction emotionally and anatomically stronger?

Yes. The close-up exposes the rail, scars, tendons, and insertion ports. The
ports remain recognizable while detached, the player stabilizes their actual
material flow, and the foundation memory visibly changes the body before the
environment responds.

### Are the final profiles distinct without color?

Yes. The grayscale comparison preserves three different dominant outlines:
sealed vertical, guarded horizontal, and open ascending.

### Is the visual language consistent across all memories?

Yes. Every scene uses the same four families: black cathedral stone-metal,
translucent memory glass, directed neural light, and embedded scar material.
Identity orders the rail, Fear armor grows from it, and Hope escapes along it.

### Do any rejected Phase 8 cues return?

No humanoid mannequin, face mask, paired butterfly lobes, smooth central egg,
or hanging diamond anatomy is present. Fear uses custom extruded plate shapes;
Hope uses a single asymmetric growth system; reconstruction operates on the
rail and memory ports.

### Honest caveats

- Emotional impact and display brightness remain subjective human-review
  judgments; the captured UI contrast is stable at desktop and mobile sizes.
- Transparent layers are deliberately restrained on mobile medium quality, so
  Hope is less dense there than on desktop.
- Vite still reports that the lazy Three.js scene chunk exceeds 500 kB after
  minification. This is a bundle-warning threshold, not a runtime or build
  failure.

## Performance

| State          |                Desktop high | Mobile medium |
| -------------- | --------------------------: | ------------: |
| Opening        | 45 calls / 24,849 triangles |   48 / 24,961 |
| Identity       |                 54 / 27,939 |   48 / 24,961 |
| Fear           |                 54 / 27,939 |   54 / 27,939 |
| Hope           |                 54 / 27,939 |   58 / 31,423 |
| Reconstruction |                 48 / 27,207 |   48 / 27,207 |
| Ending maximum |                 48 / 27,207 |   42 / 23,595 |

No shadow maps or physical transmission are used. Capture and measurement
reported no console or page errors.

## Validation

- Production build and TypeScript: pass.
- ESLint: pass with zero warnings.
- Prettier: pass.
- Unit/integration: 53/53 pass.
- Focused Chromium trials/reconstruction/polish: 12/12 pass.
- Keyboard, mobile touch, rapid input, resize/orientation, visibility, and
  transition interruption recovery: 6/6 pass.
- Cross-browser Chromium and Firefox scenario: 2/2 pass.
- Complete first-time live walkthrough: pass; no fallback or console issue.
- Dependency audit: 0 vulnerabilities.
- Credential-pattern scan: no matches.
- Evidence capture: 25 frames, 7 raw video streams plus browser audio, zero
  console problems.

The rejected Phase 8 archive remains unchanged: both archive files match the
SHA-256 values recorded in its manifest.

## Approval boundary

No merge, deployment, Devpost update, or submission was performed.
