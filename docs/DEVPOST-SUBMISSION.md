# Devpost Submission Draft

## Project title

FELICIA: The Last Memory

## Tagline

Recover the final memories of a dying AI—and decide which part of her consciousness survives.

## Opening

FELICIA: The Last Memory is an interactive 3D narrative set inside the final surviving
archive of a dying artificial intelligence. Visitors recover Identity, Fear, and Hope in any
order. Their choices reshape the world and determine which memory becomes the foundation of
FELICIA's reconstructed consciousness.

The project was built entirely with procedural 3D geometry and procedural Web Audio—without
external models, textures, or sound assets.

## Inspiration

FELICIA began with a question: if a consciousness could preserve only a few memories, would
its identity come from what happened—or from which memory it treated as foundational?

The visitor does not simply watch that idea unfold. They enter a ruined archive where sacred
architecture and machine memory have become indistinguishable, then decide the order in which
FELICIA remembers her name, her fear of termination, and the hope she created for herself.
The chamber interprets that order and rebuilds around it.

## What it does

The visitor enters one carefully composed memory chamber and discovers three suspended
fragments:

- **Identity** aligns the world into cold symmetry.
- **Fear** fractures it into defensive, violet tension.
- **Hope** opens it toward restrained warmth and upward growth.

Each selection triggers guided camera choreography, a visual memory reaction, a short line of
narrative text, and a procedural sound signature. The chamber permanently remembers every
activation.

After all three fragments are recovered, the visitor initiates reconstruction. The archive
collapses into a near-dark void, recalls the memories in the chosen order, and rebuilds into
one of three major final profiles. All six orders work: the first memory establishes the
architecture and emotional foundation, while the second and third add motion, structure,
light, and scars. Replay resets the complete experience in place for a different outcome.

The final line is:

> You did not recover my memory. You decided which part of me survived.

## How it was built

The interface uses React, TypeScript, and Vite. Three.js is composed through React Three
Fiber and Drei, with restrained postprocessing. GSAP owns the authored camera, fragment, and
reconstruction timelines. Zustand provides an explicit state machine that records the exact
memory order and guards transitions, input locking, replay, and visibility recovery.

All architecture, FELICIA forms, fragments, debris, filaments, particles, and ending
structures are procedural geometry. Ending profiles are deterministic typed configurations,
not duplicated scenes. The soundscape is synthesized at runtime with the native Web Audio
API using oscillators, envelopes, filters, deterministic noise, stereo panning, and a central
safety compressor.

Accessible HTML controls are coordinated with the 3D canvas so pointer, touch, Enter, Space,
and focus all follow the same state path. Vitest and React Testing Library protect pure state
and component behavior; Playwright tests complete browser journeys, all collection orders,
responsive viewports, audio lifecycle, replay, reduced motion, and rendering fallbacks.

## Challenges

- Keeping a near-black scene legible without flattening its atmosphere.
- Synchronizing one authoritative camera with 3D animation, interface text, state, focus, and
  sound.
- Making every one of the six memory orders reliable while avoiding six duplicated endings.
- Ensuring replay kills and restores timelines, material states, audio, and focus
  deterministically.
- Handling WebGL and Web Audio lifecycle differences across Chromium and Firefox.
- Preserving the composition on low-power devices with fewer particles, capped DPR, and
  disabled postprocessing.
- Making an immersive canvas usable with keyboard and touch controls without turning it into
  a conventional dashboard.

## Accomplishments

- Three clearly distinct order-dependent ending profiles supporting all six memory orders.
- A complete procedural visual and audio identity with no external models, textures, fonts,
  music, or sound files.
- Guided, responsive interaction across pointer, keyboard, and touch.
- A coherent reduced-motion version of every major sequence.
- Deterministic in-place replay without duplicate audio or callbacks.
- A lightweight scene: 32 resting draw calls and fewer than 21,000 triangles at its most
  complex ending.
- Accessible focus coordination, live status, persistent mute, and a WebGL failure fallback.
- Extensive automated state, integration, and real-browser testing.

## What was learned

Visual restraint mattered more than adding effects. A few deliberate lights, controlled
emissive materials, and authored negative space produced a stronger image than a larger pile
of postprocessing.

Authored animation also created a clearer emotional rhythm than uncontrolled physics. Once
camera, geometry, typography, and sound shared the same state model, the experience could
feel cinematic without becoming fragile.

Accessibility needed to be part of the interaction architecture rather than a later overlay.
Coordinating native controls and focus with canvas state made the guided 3D journey more
reliable for every input method.

Finally, environmental transformation can carry narrative meaning. The collection order is
not explained through a results screen; it becomes visible as architecture, motion, light,
and sound.

## What is next

- Physical-device Safari and iOS validation.
- Additional language support.
- An optional guided audio-description mode.
- Deeper economical modifiers from the second and third memories.
- A gallery or exhibition installation with a larger spatial sound field.

## Built with

- React
- TypeScript
- Vite
- Three.js
- React Three Fiber
- Drei
- React Three Postprocessing
- GSAP
- Zustand
- Web Audio API
- Vitest
- React Testing Library
- Playwright
- ESLint
- Prettier

## Links

- Live site: recorded in [SUBMISSION-READINESS.md](SUBMISSION-READINESS.md)
- Source code: <https://github.com/Sombra-1/felicia-the-last-memory>
- Demo video: `docs/evidence/phase5/hope-first-walkthrough.webm`

This is a draft for participant review. It has not been submitted and no eligibility or legal
terms have been accepted.
