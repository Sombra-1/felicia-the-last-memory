# Theme

## Compact token summary

- Canvas background / void: `#08080b` with deeper `#050507` grounding.
- Primary text / silver: `#f0edf4`, `#d7d4df`.
- Muted interface: `#8f8a9c`, `#625d69`.
- Identity accent: cold black-silver / `#e3e7ea`.
- Fear accent: restrained violet / `#ae81c2`, dark body `#281d2e`.
- Hope accent: tempered gold / `#e0b875`, pale energy `#ffdfa0`.
- Body font: Avenir Next → Segoe UI Variable → Helvetica/system.
- Technical font: SFMono/Cascadia Code/Roboto Mono/Consolas.
- Type: quiet uppercase mono metadata with editorial light-weight display statements.
- Corners: nearly square; materials and light, not rounded cards, carry hierarchy.
- Lines: 1px, 10–24% white/fragment accent.
- Motion: 900–1600ms cubic-bezier(0.22, 1, 0.36, 1) for cinematic arrival;
  short 180–350ms tactile input feedback; all motion has reduced-motion alternatives.
- Breakpoints: main mobile composition at 700–720px; compact landscape below 520px
  height.
- Safe-area variables are applied to all edge UI.
- WebGL: ACES filmic tone mapping, sRGB output, profile-specific DPR and exposure,
  no shadow maps.

## Raw source excerpts

`src/styles/global.css`

```css
:root {
  color: #f0edf4;
  background: #08080b;
  font-family:
    'Avenir Next', Avenir, 'Segoe UI Variable', 'Helvetica Neue', Helvetica, system-ui,
    sans-serif;
  --silver: #d7d4df;
  --muted: #8f8a9c;
  --violet: #827790;
  --line: rgb(223 218 235 / 18%);
  --mono:
    ui-monospace, 'SFMono-Regular', 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
}

.experience-shell {
  position: relative;
  isolation: isolate;
  min-height: 100svh;
  height: 100dvh;
  overflow: hidden;
  background:
    radial-gradient(circle at 68% 42%, rgb(112 98 130 / 10%), transparent 34%), #08080b;
}

.trial-interface {
  --trial-color: #e9edf0;
  position: absolute;
  inset: 0;
  color: #f3edf5;
  pointer-events: none;
}

.trial-interface--fear {
  --trial-color: #ae81c2;
}

.trial-interface--hope {
  --trial-color: #e0b875;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

No Tailwind, CSS modules, or component library is used. The complete authoritative
stylesheet is `src/styles/global.css`; the Phase 7 gameplay overlay begins at line 1590.
