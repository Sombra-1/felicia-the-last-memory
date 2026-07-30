# Phase 6.7.1 — Spectacle Refinement and Pacing Compression

Phase 6.7.1 remains local on `rescue/spectacle-refinement`. It has not been
merged, deployed, or submitted.

## Timeline comparison

| Milestone                          | Phase 6.7 | Phase 6.7.1 |           Change |
| ---------------------------------- | --------: | ----------: | ---------------: |
| Reconstruction initiation → ending |   18.69 s |     13.80 s | −4.89 s / −26.2% |
| Reconstruction initiation → replay |   24.89 s |     18.45 s | −6.44 s / −25.9% |
| Living-tableau hold before replay  |    3.20 s |      2.40 s | −0.80 s / −25.0% |

The six stages remain intact. Their standard durations are recognition 1.60 s,
collapse 2.25 s, void 1.10 s, ordered recall 3 × 1.05 s, rebuild 4.00 s, and
reveal 1.70 s. Final text enters after 0.90 s and 1.35 s, followed by the
2.40-second living tableau.

## Composition and material refinement

- Temporary cathedral architecture changed from seven similar arcs to one
  dominant halo plus three supporting arcs (43% fewer), and from eighteen ribs
  to eight (56% fewer).
- Supporting cathedral arcs and ribs leave the final tableau; the dominant halo
  remains while each ending's profile-specific architecture takes over.
- Identity now uses two concentric ending rings and eight aligned ribs; Fear
  uses three broken arcs with its shield plates; Hope uses two lifted arcs and
  keeps the vertical filaments as its primary language.
- Rebuild lighting, shell opacity, core emissive response, bloom intensity, and
  bloom threshold were recalibrated so the core remains luminous without losing
  its facets, filaments, boundary, or shell separation.
- Ending copy has a localized transparent gradient, stronger text contrast, and
  restrained text shadow. Reconstruction status was moved below the focal core.

## Ordered recall and camera

- The first memory is the largest and most persistent foundation.
- The second arrives with its own smaller motion language and modifies the
  established form.
- The third enters last as the smallest finishing accent.
- Rebuild streams enter sequentially at 8%, 34%, and 60% rather than appearing
  together.
- Camera movement is authored as two beats: a controlled scale-revealing
  pullback, then a profile-specific settlement. Identity centers precisely,
  Fear resolves obliquely, and Hope rises into upper negative space.

## Evidence

- `screenshots/ordered-recall-first-memory.png`
- `screenshots/ordered-recall-second-memory.png`
- `screenshots/ordered-recall-completed.png`
- `screenshots/refined-signature-shot.png`
- `screenshots/identity-ending.png`
- `screenshots/fear-ending.png`
- `screenshots/hope-ending.png`
- `screenshots/mobile-hope-ending.png`

`video/felicia-phase671-walkthrough.webm` is a 1440 × 900, 75.161-second VP8
walkthrough with a 48 kHz stereo Opus browser-audio track. It measures −24.75
LUFS integrated, −7.08 dBTP true peak, and 9.10 LU loudness range. No
post-capture loudness normalization was applied. Diagnostics report no browser
console application issues, truthful running audio at every checkpoint, and one
ambient start before and after replay.

## Performance and verification

- Reconstruction peak: 63 drawables / 31,644 triangles.
- Ending snapshots: Identity 63 / 31,644, Fear 66 / 28,632, Hope 66 / 34,248.
- Three active lights, zero shadow maps, no textures, and no new full-screen
  effects.
- Unit/integration: 52/52 passed.
- Chromium: 47/47 passed across split core, reconstruction, and reliability
  runs. The initial monolithic invocation was terminated by the execution
  harness with signal 143; the same specs all passed when split by file.
- Firefox production journey: 1/1 passed.
- Production build, ESLint, Prettier, console checks, three replay cycles,
  reduced motion, low quality, 390 × 844 mobile framing, and visibility
  restoration passed.

## Human review still required

- Confirm FELICIA remains the focal point in motion, not only in the stills.
- Confirm the signature frame reads clearly at the intended judge-thumbnail
  size.
- Confirm the three ordered-recall contributions are understandable without
  labels.
- Confirm the compressed climax has no perceived passive wait.
- Inspect the core-detail balance on a physical laptop and phone.
- Listen through physical laptop speakers and headphones.
