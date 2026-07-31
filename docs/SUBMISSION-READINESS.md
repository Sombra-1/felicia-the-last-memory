# Submission Readiness

## Final production release

- Public website: <https://felicia-the-last-memory.ayx1.chatgpt.site>
- Public repository: <https://github.com/Sombra-1/felicia-the-last-memory>
- Phase 8 recovery source: `33ec43ea3f04d95f48cd2fc01375cac077a38125`
- Phase 9 release commit: `2e22030191d8efa7da67d7f3709cb3641b02e6e5`
- Phase 9 main merge: `9cbd76498c0f2ee1d24ba8c281929ea5ae6b0273`
- Sites production-source commit: `c91a090620411851a10462db1e2dbe388095a644`
- Sites version: 8
- Deployment ID: `appgdep_6a6bec3c052c8191a004d9705ba6cf0c`
- Deployment completed: 2026-07-31 00:28:54 UTC
- Deployment status: succeeded
- Rollback version: Sites version 7 at
  `b8dff2c3a47ff3de057b3a363b13ed9792882747`

## Validation results

### Local release source

- Unit and integration: 53/53 passed.
- Complete Chromium suite: 32/32 passed in 421.674 seconds.
- Complete Firefox journey: 1/1 passed in 5.074 seconds.
- Dedicated mobile touch journey: 1/1 passed in 23.724 seconds.
- All six memory orders: passed.
- Keyboard-only, touch, reduced motion, low quality, inactivity assistance, interrupted
  transitions, rapid input, visibility restoration, resize/orientation recovery, three
  replay cycles, audio lifecycle, duplicate-loop, and renderer-failure checks: passed.
- TypeScript: clean.
- ESLint: clean with zero warnings.
- Prettier: clean.
- Production build: passed.
- Dependency audit: zero vulnerabilities.
- Secret scan: no findings.
- Production source maps: absent.
- Evidence bridge, scene diagnostics, and diagnostic markers: absent from production bundles.

### Public production

The production-safe validator completed four real-input journeys without development state
mutation:

| Browser  | Order                  | Viewport | Mode                    | Result |
| -------- | ---------------------- | -------- | ----------------------- | ------ |
| Chromium | Identity → Fear → Hope | 1440×900 | desktop, direct refresh | passed |
| Chromium | Fear → Hope → Identity | 1366×768 | desktop                 | passed |
| Chromium | Hope → Identity → Fear | 390×844  | touch, mobile, low      | passed |
| Firefox  | Hope → Fear → Identity | 1024×768 | desktop                 | passed |

Every journey completed all three trials, active reconstruction, its ending, audio startup,
and replay. Each retained one ambient loop, excluded production diagnostics, and produced
zero application console problems. The root-page direct refresh passed. Canonical, Open
Graph, Twitter, favicon, manifest, social-preview, and hashed-asset requests returned
successfully.

The general local Playwright suite is intentionally not a production harness: eighteen of
its inspection cases call the development-only evidence bridge. Those cases correctly find
that bridge absent on the live release. Fifteen environment-safe cases passed in that broad
public run; the separate production-safe journeys above cover the complete public behavior.

## Performance

### Scene

| State          | Desktop calls | Mobile calls | Desktop triangles | Mobile triangles |
| -------------- | ------------: | -----------: | ----------------: | ---------------: |
| Opening        |            23 |           23 |            60,454 |           60,454 |
| Identity       |            23 |           30 |            60,454 |           69,594 |
| Fear           |            30 |           27 |            69,594 |           66,798 |
| Hope           |            30 |           29 |            69,594 |           70,604 |
| Reconstruction |            24 |           24 |            67,338 |           67,338 |
| Endings        |            24 |           24 |            67,338 |           67,338 |

All measured states use three active lights, zero shadow maps, no decorative particle field,
and no imported model, texture, font, or audio payload.

### Production payload

| Asset      |       Raw |      Gzip |
| ---------- | --------: | --------: |
| HTML       |   2.24 kB |   0.77 kB |
| CSS        |  41.38 kB |   8.73 kB |
| Main JS    | 290.27 kB |  95.89 kB |
| Loading JS | 396.00 kB | 109.11 kB |
| Lazy 3D JS | 626.27 kB | 167.48 kB |

### Public Lighthouse

| Category       | Score |
| -------------- | ----: |
| Performance    |    62 |
| Accessibility  |   100 |
| Best Practices |    81 |
| SEO            |   100 |

- First Contentful Paint: 1.9 seconds.
- Largest Contentful Paint: 2.0 seconds.
- Cumulative Layout Shift: 0.001.
- Speed Index: 6.3 seconds.

The throttled Total Blocking Time is dominated by the deliberately continuous WebGL canvas.
The performance score is within one point of the previous public release while geometry and
material depth increased substantially.

## Final media

- Complete walkthrough: 202.8 seconds, browser audio, Fear → Hope → Identity.
- Trailer: 84.92 seconds.
- Audio: stereo 48 kHz; −26.4 LUFS integrated; 9.3 LU range; −7.0 dBFS true peak; no
  clipping.
- Final desktop and mobile frame grids:
  `docs/evidence/phase9/final/screenshots/`.
- Public deployment frame grid:
  `docs/evidence/phase9/public/public-contact-sheet.png`.

## Devpost

- Project: <https://devpost.com/software/felicia-the-last-memory>
- State: public project page; not entered into a hackathon submission.
- Hackathon registration: already registered for `3d-websites-hackathon`.
- Title, tagline, full description, technology list, live site, source, trailer, and
  walkthrough links: filled.
- Thumbnail: uploaded from the Phase 9 opening hero.
- Screenshot requirement: three production images are embedded in the project description.
- Demo video: optional; the 84.92-second trailer is linked directly.
- No eligibility, ownership, rules, or terms attestation was accepted by this release work.
- The project was not submitted to the hackathon.

## Remaining personal legal action

Ayhm must personally review and affirm any eligibility, ownership, official-rules, and
Devpost-terms attestations shown by the final submission form, then click the final submit
control.
