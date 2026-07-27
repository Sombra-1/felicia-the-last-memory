# Accessibility

## Interaction model

Every essential action has a native HTML button. Canvas picking is supplemental. The normal
focus sequence is:

```text
Enter memory
  → first available fragment
  → Continue
  → next available fragment
  → Complete reconstruction
  → Reenter memory
  → first available fragment
```

Focus moves only after a stable phase boundary and uses `preventScroll`. Enter and Space use
native activation. Escape returns only from a completed fragment reveal and cannot corrupt
the reconstruction climax.

## Semantics and announcements

- Fragment progress is a labeled progressbar.
- Fragment controls announce availability or recovered state.
- Reveal and reconstruction stages use live regions.
- Reconstruction start and ending completion receive assertive status announcements.
- The sound control exposes the action—mute or enable—in its accessible name and uses
  `aria-pressed`.
- The WebGL fallback is an alert with a labeled, guarded retry.

## Motion

System reduced-motion preference is detected live. Reduced motion preserves every narrative
phase with short fades, lighting changes, limited transforms, non-zero timing, and the full
order-dependent result. It removes parallax, idle drift, Fear instability, large camera
curves, and strong debris travel.

## Responsive access

Controls use practical 44–48px touch targets. Layout offsets include all four
`safe-area-inset-*` values, `100svh`, and `100dvh`. Portrait and landscape mobile receive
different arrangements. Ending and memory text use balanced wrapping and retain system
fallbacks when any preferred font is absent.

## Known limitations

The 3D environment itself has no spatial screen-reader description beyond the narrative,
labels, and controls. This is intentional: no essential operation depends on interpreting
unlabeled canvas geometry. Physical screen-reader passes on VoiceOver and TalkBack remain
for Phase 6 readiness review.
