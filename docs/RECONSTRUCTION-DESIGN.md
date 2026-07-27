# Reconstruction Design

## Narrative model

Reconstruction is an authored, guarded climax rather than a separate scene. It transforms
the accepted chamber and its collected consequences. The exact collection order is the
input:

- first memory: foundation, architecture, dominant light, FELICIA form, and hero camera;
- second memory: aligned, guarded, or ascending environmental motion;
- third memory: the final silver, violet, or warm detail accent.

All six orders therefore resolve deterministically without six duplicated worlds.

## Phases and timing

| Phase                       | Standard |  Reduced | Purpose                                     |
| --------------------------- | -------: | -------: | ------------------------------------------- |
| `reconstruction-initiating` |    1.35s |    0.32s | Recognition and consequence intensification |
| `reconstruction-collapse`   |    2.35s |    0.48s | Authored chamber contraction                |
| `reconstruction-void`       |    1.15s |    0.50s | Near-dark contrast and faint signal         |
| `reconstruction-recall`     | 0.72s ea | 0.38s ea | Ordered abstract signatures                 |
| `reconstruction-rebuilding` |    3.40s |    0.72s | Profile geometry and FELICIA reform         |
| `reconstruction-reveal`     |    1.80s |    0.55s | Final light and hero frame settlement       |
| final second-line delay     |    1.45s |    0.80s | Separates the two required statements       |
| `resetting`                 |    0.65s |    0.32s | Dark in-place reset                         |

Reduced motion keeps every narrative beat and non-zero duration. It shortens travel, removes
instability, and favors fades and limited transforms.

## Foundation profiles

### Identity

Mirrored axes, aligned arcs, cold silver light, coherent FELICIA shells, and centered formal
framing communicate imposed structure. Fear and Hope remain as a fracture/motion modifier
and final accent rather than disappearing.

### Fear

Offset protective arcs, authored breaks, violet light, a contracted protected core, and
slightly oblique framing communicate alert survival. The world is intentionally complete,
not accidentally broken.

### Hope

Opening arcs, branching lines, restrained amber, an expanded core, and elevated framing
communicate an imagined future while retaining the archive's darkness and scars.

## Coordinator and reset

`ReconstructionCoordinator` is the only timing owner. It animates normalized values in
`reconstructionRuntime`; architecture, lighting, atmosphere, fragments, consequences,
FELICIA, camera, recall traces, and final structures only read those values. Every store
completion checks its exact current phase. Repeated activation and callbacks from an old
phase are rejected.

Replay enters `resetting`, fades the interface, kills the current timeline, clears the
runtime, and atomically restores chamber state. Collection, consequences, fragments,
profile, final copy, camera status, and reconstruction flags reset without a page reload.
Sound, quality, and reduced-motion preferences persist. Repeated replay and a second full
journey are covered in browser and state tests.

## Camera choreography

One `CinematicCamera` remains authoritative:

1. recognition centers attention on FELICIA;
2. collapse pushes toward the core;
3. void retains a close silhouette signal;
4. rebuilding interpolates to the selected profile camera;
5. reveal and ending settle into the hero composition.

Desktop, tablet, mobile, and profile-specific positions are typed. Parallax and drift pause
during reconstruction. Mobile uses farther, higher framing rather than a scaled desktop
camera.

## Accessibility and recovery

The reconstruction trigger and replay are native buttons. Pointer, touch, Enter, and Space
share the same store action. Live regions announce start, stage status, and completion.
Escape cannot interrupt the climax. When a suspended page becomes visible, the current
timeline resolves to its next guarded boundary so the experience cannot remain stuck in the
void.

## Performance

The ending adds only small procedural line/torus groups for the selected profile and two
draws for the active recall trace. It adds no lights, shadows, textures, imported models,
physics, or persistent full-screen distortion. Invisible recall groups stop rendering.
Low quality retains its one-DPR cap, 24 particles, and disabled postprocessing.

Headless Chromium diagnostics on the Phase 4 evidence run:

| State                  | Draw calls | Triangles |
| ---------------------- | ---------: | --------: |
| Initial chamber        |         32 |    16,844 |
| All memories recovered |         35 |    16,844 |
| Recall transient peak  |         37 |    17,108 |
| Identity-first ending  |         39 |    18,468 |
| Fear-first ending      |         40 |    20,044 |
| Hope-first ending      |         39 |    19,004 |

Every state uses two active lights, zero shadow-casting lights, zero shadow maps, and the
existing 88 / 52 / 24 high / medium / low particle tiers.

## Known visual risks

- Near-black values and the void signal need physical OLED/LCD review.
- Thin procedural lines may vary slightly across GPU/driver implementations.
- Final hero framing has automated evidence at desktop and mobile sizes, but browser chrome
  and unusual safe-area insets still require a physical-device pass.
- System-font metrics vary slightly across operating systems.
- Physical speaker/headphone calibration remains a human review item.

## Phase 5 sonic arc

Reconstruction phases now drive one procedural audio timeline through `AudioCoordinator`.
Recognition clarifies a pulse, collapse contracts the ambient field without an impact, void
retains a faint signal, recall schedules fragment signatures in exact collection order,
rebuilding expands restrained harmonic layers, and the ending selects a foundation-specific
chord. Reduced intensity shortens recall spacing but never removes order or the void signal.
Replay stops transient cues while preserving exactly one ambient graph.
