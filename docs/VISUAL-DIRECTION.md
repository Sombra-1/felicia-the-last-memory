# Visual Direction

## Intent

The memory chamber is an abandoned sacred archive inside a failing machine mind. It
combines the vertical scale and ritual symmetry of a ruined cathedral with incomplete,
procedural machine anatomy. The scene should feel excavated rather than manufactured:
old, precise, and partially unreadable.

Phase 2 established the chamber image and three visual languages. Phase 3 added cinematic
focus and permanent consequences. Phase 4 transforms those same elements through collapse,
near-darkness, ordered recall, and one of three final visual foundations.

## Composition hierarchy

1. **FELICIA core:** A distant, suspended dark figure constructed from incomplete shells,
   metallic ribs, severed filaments, shards, and one small inner light.
2. **Memory fragments:** Three brighter, deliberately separated forms surrounding the
   dormant figure.
3. **Architecture:** Broken rings, a radial fractured floor, structural ribs, partial
   arches, sparse debris, and large negative spaces imply a much larger vault.
4. **Atmosphere:** Fog, two restrained shafts, and sparse deterministic dust separate the
   depth planes without hiding the focal forms.

Desktop framing offsets the chamber to the right so the title remains readable. Portrait
framing recenters and raises a scaled chamber into the upper portion of the screen, leaving
the lower region for interface copy.

## Palette

| Role         | Color     | Purpose                                  |
| ------------ | --------- | ---------------------------------------- |
| Void         | `#07070a` | Dominant background and fog              |
| Graphite     | `#15151b` | Floor and silhouette masses              |
| Dark metal   | `#2a2931` | Architectural structure                  |
| Cold silver  | `#c9c5d2` | Identity and controlled highlights       |
| Soft white   | `#eeeaf2` | FELICIA inner point and rare peak values |
| Muted violet | `#71627f` | Fear, failing-machine atmosphere         |
| Warm ivory   | `#c9a875` | Hope and the sole warm accent            |

Color remains local to focal objects. The chamber is not divided into colored zones.

## Fragment visual languages

- **Identity:** Three nested, symmetrical octahedral shells, silver-white light, clean
  rotation, and a fine circular register.
- **Fear:** Seven irregular tetrahedral shards around a violet core, with restrained
  positional instability and counter-rotation.
- **Hope:** Six soft metallic petals around a warm point, a small rising mote structure,
  and a subtle opening response on hover.

Hover feedback only confirms visual legibility. Phase 2 fragments do not collect, focus the
camera, or modify state.

In Phase 3, each language expands rather than changing style:

- Identity resolves mirrored silhouettes and strict synchronized alignment.
- Fear separates its existing shards, deepens violet atmosphere, and contracts FELICIA.
- Hope opens its existing petals, lifts its motes, and strengthens a warm inner point.

Collected fragments shrink into dormant archive objects. A silver register, violet floor
scar, or ascending warm filament remains in the chamber so the environment visibly remembers
the visitor.

## Reconstruction hierarchy

The climax uses darkness as an editing tool rather than an effect layer:

1. permanent consequences intensify in recognition;
2. chamber geometry contracts and loses alignment;
3. only FELICIA's faint point, dust, and one status signal remain;
4. concise line signatures recall the three memories in order;
5. existing architecture returns under the first memory's rule;
6. the final frame settles before typography appears.

Identity-first adds mirrored axes and formal silver geometry. Fear-first creates authored
violet protective arcs and deliberate gaps. Hope-first opens warm arcs and branching lines
upward. The second memory controls aligned, guarded, or ascending motion; the third controls
the final accent, leaving visible tension inside every foundation.

## Lighting

The scene uses exactly two active lights:

- One low-intensity ambient fill for graphite readability.
- One narrow, highly feathered spot source from above-left.

Fragment emphasis is primarily emissive. No light casts a shadow. This avoids multiple
competing color pools and keeps the procedural geometry inexpensive.

## Effects

Medium and high quality use:

- thresholded restrained bloom for only the brightest focal values;
- a subtle vignette for edge control;
- scene fog for depth separation.

Low quality removes the postprocessing composer entirely. High quality enables bloom
mipmaps and four-sample composer multisampling; medium quality disables bloom mipmaps and
composer multisampling.

## Performance rules

- DPR is capped at `1.75` on high, `1.35` on medium, and `1` on low.
- Dust counts are fixed at 88 / 52 / 24 for high / medium / low.
- Repeated ribs, debris, FELICIA ribs, Fear shards, and Hope petals are instanced.
- Geometry and all visual noise are procedural and deterministic.
- No texture maps, external 3D models, environment maps, transmission materials, or shadow
  maps are used.
- Mobile defaults to medium quality; severely constrained devices select low quality.
- Reduced motion freezes camera drift, pointer parallax, dust drift, instability, and
  environmental breathing while preserving the composed frame.
- Reconstruction reuses the two-light rig. Darkness and reveal come from existing light
  intensity, emissive values, fog, group transforms, and sparse procedural lines.

## Effects intentionally excluded

- Chromatic aberration
- Film grain postprocessing
- Lens flare
- Depth of field
- Screen-space reflections
- Refraction and transmission
- Volumetric ray marching
- Neon grids and holographic UI fields
- Real-time shadows

These can obscure silhouette design, introduce visual clichés, or consume frame time
without strengthening the central image.

## Phase 5 calibration

Visual tuning now lives in `VISUAL_CALIBRATION` and the three quality profiles instead of
new local magic numbers. High quality retains the darkest, most controlled exposure. Medium
and low progressively lift ambient readability; low also strengthens line opacity to
survive DPR 1 without antialiasing. Bloom was reduced and thresholded more tightly, while
vignette darkness was softened so near-black architecture remains separated from the void.

Critical final arcs use larger procedural radii, core filaments receive a restrained opacity
lift, and FELICIA's shell uses lower clearcoat with higher roughness. The result keeps metal
surfaces coherent and avoids default glossy-plastic material character.

Typography now uses a zero-request system stack. Large narrative lines use balanced
wrapping, restrained tracking, and scene-independent contrast. Safe-area values and dynamic
viewport units protect the layout on notched and browser-chrome-constrained devices.
