# Phase 9 Production Release

## Provenance

- Phase 8 recovery source:
  `33ec43ea3f04d95f48cd2fc01375cac077a38125`
- Published Phase 9 commit:
  `2e22030191d8efa7da67d7f3709cb3641b02e6e5`
- Main merge:
  `9cbd76498c0f2ee1d24ba8c281929ea5ae6b0273`
- Sites production source:
  `c91a090620411851a10462db1e2dbe388095a644`
- Rollback:
  `b8dff2c3a47ff3de057b3a363b13ed9792882747`

GitHub's 100 MB object limit required the preserved 110,536,361-byte rejected Phase 8
archive to be stored as two parts. Reassembly reproduces its original SHA-256 exactly. The
full local recovery ancestry remains at `archive/phase9-full-history`.

## Deployment

- Sites project:
  `appgprj_6a67c1653f5881919909255c5858e39d`
- Saved version: 8
- Version ID:
  `appgprj_6a67c1653f5881919909255c5858e39d~appgver_ba4290bdea748191b1c421c942ebc673`
- Deployment ID:
  `appgdep_6a6bec3c052c8191a004d9705ba6cf0c`
- Status: succeeded
- Completed: 2026-07-31 00:28:54 UTC
- URL: <https://felicia-the-last-memory.ayx1.chatgpt.site>

The Sites source repository has a smaller push-body limit than GitHub. Its `main` contains
the exact Phase 9 runtime, assets, build configuration, and deployment worker without the
review-media archive. The deployed asset hashes match the locally prepared build; the only
HTML difference is Cloudflare's injected challenge script.

## Public verification

Four production-safe, real-input journeys passed:

1. Chromium, Identity → Fear → Hope, 1440×900, audio, replay, direct refresh.
2. Chromium, Fear → Hope → Identity, 1366×768, audio, replay.
3. Chromium, Hope → Identity → Fear, 390×844, touch, low quality, audio, replay.
4. Firefox, Hope → Fear → Identity, 1024×768, audio, replay.

Every run completed all three gameplay trials, active synchronization, reconstruction,
ending, and replay. Every run reported one ambient start, no application console problems,
and no production diagnostics.

Cloudflare's Firefox-only invalid-domain `__cf_bm` cookie messages and Firefox's own
`mozPressure`/`mozInputSource` deprecation messages were classified as provider/browser
noise. They do not originate from application source.

## Evidence

- Public verification:
  `docs/evidence/phase9/public/public-verification.json`
- Public contact sheet:
  `docs/evidence/phase9/public/public-contact-sheet.png`
- Public Lighthouse:
  `docs/evidence/phase9/public/lighthouse.json`
- Final performance:
  `docs/evidence/phase9/final/performance.json`
- Final audio:
  `docs/evidence/phase9/final/audio-measurement.json`
- Complete walkthrough:
  `docs/evidence/phase9/final/walkthrough/felicia-phase9-complete-walkthrough.mp4`
- Trailer:
  `docs/evidence/phase9/final/felicia-phase9-trailer-85s.mp4`
