# Submission Readiness

## Final production release

- Public website: <https://felicia-the-last-memory.ayx1.chatgpt.site>
- Public repository: <https://github.com/Sombra-1/felicia-the-last-memory>
- Deployment platform: OpenAI Sites, Cloudflare-backed
- Integration merge commit: `3a35048`
- Production source commit: `160cd47b1951eef19f64ca7aa601d56e4a00f535`
- Sites version: 6
- Deployment completed: 2026-07-28 14:41:40 UTC
- Deployment status: succeeded
- Browser coverage: Chromium and Firefox passed; WebKit/Safari unverified
- Devpost status: draft copy only; no project was created or submitted

## Validation results

### Local approved source

- Unit and integration: 52/52 passed
- Chromium core visual and interaction suite: 20/20 passed
- Reconstruction matrix: 5/5 passed, including all six orders
- Reliability and stress: 22/22 passed, including twenty independent journeys, competing
  input/resize, and three same-page replay cycles
- Local Chromium and Firefox complete journeys: 2/2 passed
- Merged-main Chromium and Firefox critical journeys: 2/2 passed
- ESLint: zero warnings
- Prettier: passed
- Production build: passed
- Dependency audit: zero vulnerabilities
- Secret scan: no findings
- Production diagnostics-string scan: clean
- Production source maps: absent

### Public production

- Chromium complete journey, audio lifecycle, focus, reconstruction, and replay: passed
- Firefox complete journey, audio lifecycle, focus, reconstruction, and replay: passed
- Seven public desktop, tablet, and mobile viewport checks: passed
- Public reduced-motion and low-quality rendering: passed
- Public keyboard fragment activation and focus behavior: passed
- Public visibility suspension/restoration during reconstruction: passed
- Live Identity, Fear, and Hope reveal/ending capture journeys: passed
- Enter audio activation, truthful sound state, fragment cues, reconstruction, replay, and
  one ambience start after replay: passed
- Direct refresh and extensionless SPA fallback: passed
- HTTPS, canonical metadata, Open Graph image, favicon, manifest, and hashed assets: passed
- Mixed content: none observed
- Application console errors: none
- Development diagnostics: absent

WebKit could not launch on the release Linux host because `libicu74`, `libxml2`, and
`libflite1` are unavailable. Safari/WebKit is therefore not claimed as tested.

## Lighthouse

Lighthouse 13.4.1 tested the deployed URL with its simulated mobile profile:

| Category       | Score |
| -------------- | ----: |
| Performance    |    63 |
| Accessibility  |   100 |
| Best Practices |    81 |
| SEO            |   100 |

- First Contentful Paint: 1.4 seconds
- Largest Contentful Paint: 1.5 seconds
- Cumulative Layout Shift: 0.001
- Speed Index: 6.6 seconds

The previous Performance reference was 69. The six-point decline is accepted for the
approved material and silhouette depth; accessibility, best-practices, SEO, and layout
stability did not regress. Synthetic Total Blocking Time remains dominated by the
continuously rendered WebGL canvas.

## Production payload

| Asset      |       Raw |      Gzip |
| ---------- | --------: | --------: |
| HTML       |   2.16 kB |   0.74 kB |
| CSS        |  19.75 kB |   4.98 kB |
| Main JS    | 300.73 kB |  99.18 kB |
| Lazy 3D JS | 990.70 kB | 262.66 kB |

The deployed asset names are content-hashed. The current Sites edge response revalidates
these assets with `max-age=0, must-revalidate` rather than exposing the worker's requested
immutable cache header.

## Scene metrics

| State                  | Draw calls | Triangles |
| ---------------------- | ---------: | --------: |
| Initial chamber        |         61 |    31,472 |
| All memories recovered |         48 |    23,104 |
| Reconstruction peak    |         55 |    27,908 |
| Identity ending        |         55 |    27,908 |
| Fear ending            |         54 |    27,836 |
| Hope ending            |         58 |    30,992 |

All measured states use three lights and zero shadow maps.

## Audio evidence

- Final walkthrough: 53.16 seconds, 1440 × 900
- Audio: stereo Opus, 48 kHz
- Integrated loudness: −25.19 LUFS
- True peak: −9.11 dBTP
- Console issues: none
- Ambience starts after replay: one

Walkthrough:
`docs/submission/video/felicia-final-walkthrough-with-browser-audio.webm`

## Selected screenshots

Primary submission set:

1. `docs/submission/screenshots/initial-chamber.png`
2. `docs/submission/screenshots/fear-ending.png`
3. `docs/submission/screenshots/hope-ending.png`

Supporting production frames:

- `identity-reveal.png`
- `fear-reveal.png`
- `hope-reveal.png`
- `identity-ending.png`
- `mobile-hope-ending.png`

All eight frames were recaptured from the deployed production site without browser chrome or
development diagnostics.

## Remaining participant actions

- Listen through real laptop speakers.
- Listen through headphones.
- Listen through a phone speaker.
- Inspect near-black separation and brightness on a physical laptop.
- Inspect framing, brightness, notch, and browser chrome on a physical phone.
- Optionally test Safari on macOS and Safari/iOS.
- Optionally test VoiceOver and TalkBack on physical devices.
- Review the Devpost draft personally.
- Confirm hackathon eligibility personally.
- Accept any required legal terms personally.
- Create and make the final Devpost submission personally.

No eligibility claim or legal acceptance has been made by this release process.
