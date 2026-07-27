# Interaction Design

## Phase 3 scope

Phase 3 implements discovery, selection, cinematic focus, memory reaction, text reveal,
collection confirmation, chamber return, and persistent progress for Identity, Fear, and
Hope. Phase 4 activates the formerly controlled handoff and adds the guarded reconstruction,
ending, and in-place replay loop.

## Experience phases

```text
loading
  → chamber
  → approaching-fragment
  → revealing-fragment
  → returning-to-chamber
  → chamber
  → ready-for-reconstruction
  → reconstruction-initiating
  → reconstruction-collapse
  → reconstruction-void
  → reconstruction-recall
  → reconstruction-rebuilding
  → reconstruction-reveal
  → ending
  → resetting
  → chamber
```

All transitions are guarded:

- A fragment request is accepted only from `chamber`.
- A collected fragment cannot be requested.
- Approach and return phases always lock input.
- Reveal unlocks only after the memory animation and reading hold complete.
- Return is accepted only after the active fragment is recorded.
- The third successful return enters `ready-for-reconstruction`.
- Reconstruction requires three unique memories, a restored chamber camera, and unlocked
  input; activation is accepted exactly once.
- Every reconstruction completion action requires its exact preceding phase.
- Final text and replay are unavailable until the visual reveal settles.
- Replay is accepted only from the complete ending and returns to a clean chamber.

These rules prevent double clicks, rapid cross-selection, and repeated keyboard input from
creating invalid state combinations.

## Centralized sequence

`FragmentSequenceCoordinator` owns one GSAP timeline at a time. It animates a shared,
non-React runtime containing:

- camera approach progress;
- fragment visual progress;
- suppression of inactive fragments;
- the fragment currently driving the sequence.

Every timeline is killed before replacement and on unmount. No fragment sequence uses
`setTimeout`. If reduced motion changes during a transition, the current timeline is killed
and rebuilt from its current values with the shorter configuration. When a suspended tab
becomes visible, any transitional timeline resolves to a valid stage boundary.

Escape requests the same guarded return action as the visible Continue control.

## Camera choreography

The camera has one authority: `CinematicCamera`.

At chamber rest it uses the Phase 2 responsive composition, pointer parallax, and restrained
idle drift. During a fragment sequence, parallax and drift pause and the camera interpolates
from chamber framing to a fragment target.

| Fragment | Approach | Desktop character                          | Portrait character                   |
| -------- | -------- | ------------------------------------------ | ------------------------------------ |
| Identity | 1.8s     | Centered, measured, 38° FOV                | Centered with more distance, 42° FOV |
| Fear     | 1.55s    | Slightly off-axis with minimal instability | Reversed lateral offset, 44° FOV     |
| Hope     | 1.9s     | Gentle rising arc, 40° FOV                 | Higher and farther arc, 43° FOV      |

Returns take 1.45–1.65 seconds. Reduced-motion approaches and returns take 0.25–0.30
seconds, remove curves and instability, and preserve the final framing.

Camera targets are recomputed from the current responsive scene transform every frame.
Resizing during a transition therefore does not leave the camera aimed at stale coordinates.

## Fragment behaviors

### Identity

- Nested geometry aligns to one precise rotation.
- Two mirrored silhouettes resolve beside the central form.
- Silver-white lighting becomes more dominant.
- Typography and camera framing remain centered and measured.
- Collection leaves a permanent symmetrical silver register around FELICIA.

### Fear

- Instanced shards separate and rotate out of alignment.
- Motion uses irregular positional pulses without flashing or large screen shake.
- The camera becomes slightly off-axis.
- Violet lighting and fog deepen.
- FELICIA contracts subtly.
- Collection leaves a restrained violet fracture across the chamber floor.

### Hope

- Petals open, rise, and increase their radius.
- Internal motes move upward.
- The camera follows a gentle rising curve.
- Light warms toward ivory without recoloring the chamber.
- FELICIA expands and its inner point strengthens.
- Collection leaves a thin ascending warm filament.

Collected fragments remain visible at a dormant scale with a `Recovered` label. Their
continuous idle motion is simplified or stopped.

## Collection-order model

The store keeps both the set-like collected list and the immutable append order. A fragment
is appended only by `completeFragmentReveal`, after the reveal timeline finishes.

Selectors expose:

- first selected fragment;
- most recently selected fragment;
- remaining fragments;
- all-collected state;
- numeric collection progress.

All six possible collection orders are covered by state tests. Phase 4 can read
`collectionOrder[0]` without reconstructing intent from UI state.

## Accessibility and input

- Three native HTML buttons mirror the selectable fragments.
- Buttons follow DOM order: Identity, Fear, Hope.
- Enter and Space use the same guarded action as pointer and touch.
- Visible focus receives a high-contrast outline, background, and inset marker.
- Controls have mobile touch heights of at least 48px.
- Canvas geometry also supports pointer selection, but no essential action requires direct
  canvas interaction.
- Progress uses a labeled `progressbar`.
- Reveal status uses `aria-live="polite"`.
- Continue is a native button; Escape invokes the same return transition.
- Collected fragment buttons remain visible but disabled and labeled `Recovered`.

## Input locking and recovery

Atomic store guards reject:

- two fragment requests in one chamber frame;
- selection outside `chamber`;
- reactivation of a collected fragment;
- return before reveal completion;
- completion callbacks for a fragment that is no longer active.

The camera-restored flag becomes true only after the return sequence completes. Reset clears
all sequence state and order while preserving sound, reduced-motion, and quality
preferences.

During reconstruction, all ordinary controls recede and input remains locked. Escape is
intentionally ignored so it cannot corrupt the climax. A native reconstruction button and
native replay button support pointer, touch, Enter, and Space. An assertive live region
announces reconstruction start and ending completion. Visibility restoration advances the
current timeline to its guarded boundary so background-tab throttling cannot strand the
visitor in darkness.

## Performance

- No interaction adds real-time lights, models, textures, or full-screen distortion.
- Fear shards, Hope petals, architecture, debris, and FELICIA ribs remain instanced.
- Fragment reactions mutate transforms and existing emissive materials.
- Each collected consequence adds one line draw call, for a maximum of three.
- Inactive fragments are suppressed through group transforms rather than new effects.
- Low quality still removes the postprocessing composer and reduces DPR, antialiasing, and
  particles.

## Phase 4 coordinator

`ReconstructionCoordinator` owns one GSAP timeline and one shared runtime. Recognition,
collapse, void, order recall, rebuild, reveal, final text, and reset are never scheduled by
scene components. Timeline replacement and unmount kill active work. Scene components only
read normalized runtime values.

The camera continues to have one authority. Parallax and idle drift pause from recognition
through reveal. The final camera is profile-specific and responsive; reduced motion retains
the result while replacing travel with short, restrained transitions.

## Known limitations

- The camera choreography has been inspected in headless Chromium; physical OLED/LCD
  contrast and mobile browser chrome still require human-device review.
- Hover emphasis is visual only; keyboard and touch rely on the persistent HTML controls.
- Haptic feedback is intentionally excluded; fragment-specific procedural audio is active.
- Text and sound share phase boundaries but are not narrated or sample-synchronized.

## Phase 5 focus and sound integration

`FocusCoordinator` observes stable state rather than animation timers. It focuses the first
available fragment after entry/return, Continue after reveal completion, reconstruction
after the third return, replay after the second final line, and the first fragment after
reset. Every move uses `preventScroll`, and screenshot tooling explicitly clears focus
without changing runtime behavior.

`AudioCoordinator` follows the same explicit phases. The Enter pointer/keyboard gesture
unlocks one procedural Web Audio graph. Fragment selection, ordered recall, and ending
profile cues are routed by store state; replay cannot create a second ambient graph.
Visibility suspension and audio failure resolve independently from visual state.
