# Phase 6.7 — Spectacle, Pacing, and Judge-Wow Evidence

Phase 6.7 remains local on `rescue/spectacle-pacing`. It has not been merged or
deployed.

## Authored pacing

- Opening awakening: 4.8 seconds standard, 1.35 seconds reduced motion.
- Fragment choreography: 4.02 seconds Identity, 4.00 seconds Fear, and 4.28
  seconds Hope, excluding the participant's reading time.
- Reconstruction to ending state: 18.69 seconds standard.
- Reconstruction initiation to replay availability: 24.89 seconds standard.
- Final text pacing: 1.15 seconds to line one, 1.85 seconds to line two, then a
  3.2-second living-tableau hold before replay.
- Captured complete journey: 78.048 seconds.

The Phase 6.6 reconstruction reached its ending state in approximately 11.03
seconds and exposed replay in approximately 12.28 seconds. Phase 6.7 therefore
roughly doubles the climax without adding a new narrative branch.

## Visual evidence

- `screenshots/opening-hero.png`
- `screenshots/identity-reveal.png`
- `screenshots/fear-reveal.png`
- `screenshots/hope-reveal.png`
- `screenshots/collapse.png`
- `screenshots/ordered-recall.png`
- `screenshots/signature-wow.png`
- `screenshots/identity-ending.png`
- `screenshots/fear-ending.png`
- `screenshots/hope-ending.png`

The signature shot combines three procedural memory streams with a staged
cathedral machine: seven rising arcs, eighteen aligned ribs, and the reforming
FELICIA core. The ending profiles retain distinct architecture and silhouettes:
Identity is centered and mirrored, Fear is fractured and enclosed, and Hope is
open and ascending.

## Audio and walkthrough

`video/felicia-phase67-walkthrough.webm` is a 1440 × 900, 78.048-second VP8
walkthrough with a 48 kHz stereo Opus browser-audio track. Its measured output is
-24.38 LUFS integrated, -6.81 dBTP true peak, and 9.50 LU loudness range. No
post-capture loudness normalization was applied.

## Performance

See `scene-metrics.json`. The diagnostics-enabled renderer measured a 63 draw
call / 34,812 triangle reconstruction peak. The full Chromium six-order journey
briefly observed 68 draw calls, still below the Phase 6.7 target of approximately 75. There are three active lights, zero shadow maps, and no new textures or
full-screen shaders.

## Verification

- Unit/integration: 52 passed.
- Chromium: 45 cases passed in the full run; two stale Phase 6.6 timing/cost
  assertions were updated and their targeted rerun passed 2/2.
- Firefox production journey: passed.
- Three replay cycles: passed.
- Reduced motion, low quality, 390 × 844 mobile framing, visibility restoration,
  and console checks: passed.
- Production build, ESLint, and Prettier: passed.
- Production evidence capture and walkthrough diagnostics: zero console issues.

## Human review still required

- Approve the opening's 4.8-second pacing and awakening sweep.
- Approve each fragment reveal's screenshot composition.
- Approve the ordered-recall pause and signature cathedral shot.
- Approve the 3.2-second final tableau hold.
- Listen through physical laptop speakers and headphones.
- Confirm perceived A/V alignment on the final walkthrough.
