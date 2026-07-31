# FELICIA Phase 9 — The Last Fold

## Product

One full-viewport, real-time Three.js narrative. The player recovers Identity,
Fear, and Hope in any order; each memory permanently changes FELICIA and the same
continuous world. The first memory governs the final consciousness at 60%, the
second modifies it at 25%, and the third completes it at 15%.

## Visual thesis

FELICIA is the one impossible fold in a continent of dark memory strata: every
choice imposes a physical law on the same continuous matter until consciousness
turns the whole world inside out.

The 3D hero is an asymmetric, thick calligraphic torsion with a missing structural
span. The world is layered mineral-memory matter extending beyond the frame.
Identity pleats it, Fear compresses it, Hope delaminates it, and reconstruction
turns it inside out.

## UI

The WebGL world owns the viewport. Keep only:

- small FELICIA wordmark at the upper-left edge;
- sound and accessibility controls at a quiet upper-right edge;
- one current narrative or action line in available negative space;
- one obvious native interaction target;
- three-beat progress;
- chosen order only where causality matters;
- final replay action.

Remove footer telemetry, archive-status decoration, dashboard frames, panels,
repeated labels, tiny metadata, glow borders, and glass cards. Critical text appears
after the 3D scene settles and never covers FELICIA, an action target, a
transformation front, or a depth cue.

## Typography

- Body/display: `Avenir Next`, `Segoe UI Variable`, `Helvetica Neue`, system sans.
- Metadata: system monospace.
- Editorial statements use light weight, compact width, and 1.18–1.35 line-height.
- Action text uses 0.62–0.78rem uppercase with 0.12–0.18em tracking.
- Avoid decorative, serif, condensed sci-fi, and imported web fonts.

## Palette

- Void: `#030506`
- Structural black-blue: `#090c0f`
- Smoke ivory: `#d8d6cd`
- Muted type: `#898b88`
- Identity nickel: `#8f9aa1`
- Identity white: `#dfe8e9`
- Fear bruise: `#68466f`
- Fear depth: `#211823`
- Hope amber: `#b9823f`
- Hope ivory: `#ead9b9`
- Rebirth mineral daylight: `#c9c6b8`

Memory color is a narrow consequence, never a scene wash.

## Layout

- Full `100dvh` / `100svh` canvas.
- Safe-area-aware 20–64px outer gutters.
- Desktop narrative occupies at most 22rem and stays off the hero axis.
- Desktop action occupies at most 20rem near the lower-right or lower-left
  negative space selected per shot.
- Mobile uses full-width bottom actions with at least 52px targets and short top
  narrative; never cover the middle 55% hero band.
- No centered modal except the pre-entry title and the momentary memory-set pause.

## Components

- Text controls: transparent background, no card, 1px focus ring, quiet default,
  high-contrast focus/active state.
- Primary action: native button with a single structural rule and restrained
  surface fill; minimum 52px touch height.
- Progress: three thickening seam marks, not a dashboard bar.
- Chosen order: compact inline roman numerals and names; no cards.
- Final replay: one text action after the ending statement.

## Motion

- 180–280ms immediate input response.
- 900–1800ms physical material propagation.
- Authored camera/scene transitions use anticipation, acceleration,
  deceleration, settlement, and returned control.
- UI enters only after settlement with a 220–420ms opacity/position change.
- Reduced motion keeps state clarity using light propagation and short positional
  changes.
- No constant floating, random rotation, or infinite decorative motion.

## Accessibility

- Native buttons, logical DOM order, visible focus, live regions, and truthful
  disabled state.
- Touch targets at least 52px on mobile.
- Text contrast remains readable over every shot.
- Reduced-motion and low-quality modes preserve narrative and interaction.
- Sound is optional and never required for gameplay.

## Hard rejections

No cathedral UI, technical dashboard, glass-card stack, neon frame, telemetry,
multiple panels, decorative metadata, conventional sci-fi type, centered object
layout, purple/gold wash, or overlay covering the 3D hero.

Use ONLY the fonts, colors, spacing, and component styles defined here.
