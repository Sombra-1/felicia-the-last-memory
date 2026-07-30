# Phase 7.1 — Hybrid Art Direction Validation

## Outcome

Phase 7.1 implements the approved Hybrid direction:

- Optical Cathedral architecture defines FELICIA's cognitive space and cinematic stage.
- Living Instrument anatomy defines FELICIA, her memory organs, and her reconstruction.
- The existing three trials, interaction rules, duration target, and authoritative
  `TransitionDirector` remain intact.
- No deployment, merge, submission, or Devpost update was performed.

The visual system now uses a shared procedural material library for layered memory
shells, flowing energy filaments, responsive architectural surfaces, and temporary
memory fields. The library supplies profile-specific color, motion, Fresnel response,
front/back shell separation, authored surface variation, and restrained emissive
energy without scene-wide transmission or bloom.

## Implemented scenes

### Chamber and FELICIA

The chamber is a deep, central-axis Optical Cathedral with instanced architectural
layers, deliberate negative space, grounding, local light planes, and fragment
placement that preserves FELICIA as the hero. FELICIA now has layered tissue-like
shells, a synthetic sternum, internal neural filaments, articulated organs,
asymmetric breathing, and profile-aware posture.

Collected memories are integrated into her anatomy:

- Identity forms a mirrored vertebral axis and stabilizes shell posture.
- Fear forms articulated protective plates and a permanent violet scar.
- Hope opens the upper shell and grows a gold neural filament through the body.
- The first collected memory receives the largest anatomical scale; the second
  modifies it and the third completes it.

### Identity

Identity is a formal mirrored signal corridor with deep repeating reflective planes,
converging FELICIA echoes, precise light axes, and a structured crystalline signal
nucleus. Movement continuously changes the duplicate separation and corridor
alignment. Completion snaps the world into a clarified, symmetric state.

### Fear

Fear uses a rigid shutdown chamber under biological pressure. An incoming wave front
travels from its signaled direction, while segmented shell petals unfold and thicken
around the readable core. Correct impact produces a localized layered material
deformation instead of an enclosing bubble. Violet scarring remains embedded in the
organism and the chamber becomes progressively more defensive.

### Hope

Hope is a vertically opening field of branching gold filaments, persistent trails,
unfolding shell gates, rising light, and cold architecture separating around living
growth. The guided signal has a continuous trail and the environment anticipates its
movement. Each gate opens through an organic shell transformation and leaves growth
behind.

### Reconstruction and endings

Reconstruction places ceremony in the cathedral and transformation in FELICIA. Her
memory organs detach, internal systems become exposed, three order-aware streams pass
through the shell, filaments ignite sequentially, and the body reforms before the
cathedral responds. Architecture remains behind the essential silhouette.

The three ending profiles are anatomically distinct before labels or color:

- Identity-first is formal, centered, mirrored, and precisely closed.
- Fear-first is guarded, scarred, contracted, and asymmetrically shielded.
- Hope-first is open, expanded, upward-growing, and asymmetrically alive.

## Production evidence

The 20-frame review set is in [`frames/`](./frames/), with a compact overview at
[`contact-sheet.png`](./contact-sheet.png).

1. [`01-awakening-hero.png`](./frames/01-awakening-hero.png)
2. [`02-identity-arrival.png`](./frames/02-identity-arrival.png)
3. [`03-identity-active-alignment.png`](./frames/03-identity-active-alignment.png)
4. [`04-identity-completion.png`](./frames/04-identity-completion.png)
5. [`05-fear-arrival.png`](./frames/05-fear-arrival.png)
6. [`06-incoming-shutdown-pulse.png`](./frames/06-incoming-shutdown-pulse.png)
7. [`07-shield-impact.png`](./frames/07-shield-impact.png)
8. [`08-fear-completion.png`](./frames/08-fear-completion.png)
9. [`09-hope-arrival.png`](./frames/09-hope-arrival.png)
10. [`10-guided-signal-trail.png`](./frames/10-guided-signal-trail.png)
11. [`11-organic-gate-opening.png`](./frames/11-organic-gate-opening.png)
12. [`12-hope-completion.png`](./frames/12-hope-completion.png)
13. [`13-chamber-integrated-consequences.png`](./frames/13-chamber-integrated-consequences.png)
14. [`14-active-synchronization.png`](./frames/14-active-synchronization.png)
15. [`15-signature-transformation.png`](./frames/15-signature-transformation.png)
16. [`16-identity-consciousness.png`](./frames/16-identity-consciousness.png)
17. [`17-fear-consciousness.png`](./frames/17-fear-consciousness.png)
18. [`18-hope-consciousness.png`](./frames/18-hope-consciousness.png)
19. [`19-mobile-trial.png`](./frames/19-mobile-trial.png)
20. [`20-mobile-ending.png`](./frames/20-mobile-ending.png)

The uninterrupted first-time Fear → Hope → Identity walkthrough is
[`felicia-phase7.1-first-time-walkthrough-with-browser-audio.webm`](./video/felicia-phase7.1-first-time-walkthrough-with-browser-audio.webm).
It runs for approximately 3 minutes 14 seconds, includes 115 seconds of active input,
captures live browser audio after the sound unlock, records 32 milestones, and reports
no console issues.

Seven 0.5× transition review clips are in
[`transitions-slow-motion/`](./transitions-slow-motion/):

- chamber to Identity
- Identity return
- chamber to Fear
- Fear return
- chamber to Hope
- Hope return
- reconstruction to final world

## Performance

Across the 20 production frames:

- Draw calls: 48 minimum, 72 maximum.
- Triangles: 17,754 minimum, 26,356 maximum.
- Console warnings/errors: 0.
- The low-quality browser case remained below 100 draw calls.
- Responsive baseline at seven desktop, tablet, and mobile sizes: 48 draw calls and
  22,050 triangles.

The production build completed successfully. Its largest generated chunks are the
lazy-loaded Three.js experience chunks; Vite reports advisory chunk-size warnings,
not build errors.

## Validation

| Area                             | Result                                            |
| -------------------------------- | ------------------------------------------------- |
| Unit/integration                 | 53/53 passed                                      |
| Full Playwright matrix           | 33/33 passed                                      |
| Chromium                         | Passed                                            |
| Firefox                          | Passed                                            |
| All six collection orders        | Passed                                            |
| Keyboard-only journey            | Passed                                            |
| Touch/mobile journey             | Passed                                            |
| Reduced motion                   | Passed                                            |
| Low quality                      | Passed                                            |
| Three replay cycles              | Passed                                            |
| Inactivity fallback              | Passed                                            |
| Transition interruption recovery | Passed                                            |
| Visibility recovery              | Passed                                            |
| Resize/orientation recovery      | Passed                                            |
| Production console review        | Passed                                            |
| TypeScript                       | Passed                                            |
| ESLint                           | Passed                                            |
| Prettier                         | Passed after formatting the final Fear refinement |
| Production build                 | Passed                                            |
| Dependency audit                 | 0 vulnerabilities                                 |
| Secret scan                      | 0 findings in source/configuration files          |

The secret scan used `detect-secrets` over all repository files except dependencies,
generated build output, test artifacts, Git metadata, and binary evidence.

## Human quality questions

### Do the trials still look like basic primitives?

No. Procedural geometry remains the efficient construction substrate, but authored
silhouettes, layered shaders, instanced spatial systems, responsive deformation, and
continuous transformation prevent default-primitive presentation.

### Does each trial have a unique material language?

Yes. Identity uses cold reflective silver and exact optical duplication; Fear uses
violet metallic tissue, translucent armor, scars, and pressure waves; Hope uses warm
flowing filaments, opening shell tissue, and persistent living trails.

### Does player movement continuously affect the world?

Yes. Identity changes reflected echo separation and axis convergence; Fear movement
selects and articulates defensive anatomy before impact; Hope movement deforms the
guided signal trail, gate anticipation, and environmental growth.

### Do completed memories physically become part of FELICIA?

Yes. Each memory becomes an internal axis, protective plate/scar system, or opened
neural growth. Their scale and dominance follow collection order.

### Do transitions transform rather than swap scenes?

Yes. Cathedral axes, defensive shutters, and gold paths reorganize into their trial
systems, while completed trial material contracts into persistent anatomy. The
`TransitionDirector` remains authoritative and control unlocks only after arrival.

### Is the reconstruction signature frame iconic and unobstructed?

Yes. FELICIA has a clear central silhouette, all three memory streams are readable,
the dominant first memory controls the composition, and architectural response stays
behind the transformation.

### Is the UI subordinate to the artwork?

Yes. Trial controls are compact and edge-aligned on desktop, touch-safe on mobile,
and no permanent full-width bordered instruction panel covers the trial worlds.

### Is the experience readable on ordinary laptop brightness?

Yes in the captured and tested compositions. The grade remains intentionally dark,
but hero edges, active targets, prompts, and response lighting have independent
luminance hierarchy rather than relying on uniformly raised exposure.

### Does every trial contain at least one memorable visual moment?

Yes: Identity's converging echo snap, Fear's traveling wave meeting an articulated
shield deformation, and Hope's signal opening a living shell gate while leaving a
gold growth path.
