# Testing

## Required environment

- Node.js 20.19 or newer
- npm
- Playwright Chromium
- Playwright Firefox
- Optional Playwright WebKit system dependencies

Install reproducibly with:

```bash
npm ci
```

## Unit and component tests

```bash
npm test
```

Coverage protects the experience state machine, all six collection orders, ending-profile
derivation, reconstruction guards, replay/reset, responsive camera and quality
configuration, procedural-audio lifecycle, mute behavior, and the accessible WebGL fallback.
The Phase 9 release gate contains 53 unit and integration tests.

## Browser journeys

```bash
npm run test:visual:chromium
npm run test:visual:cross-browser
```

The browser suite exercises fragment selection, keyboard and touch-sized controls, all
orders and ending profiles, repeated input, reduced motion, low quality, visibility recovery,
real Web Audio initialization, replay, renderer failure, seven viewport sizes, screenshots,
and console cleanliness.

Renderer-heavy browser journeys run with one worker so multiple headless WebGL contexts do
not starve one another on shared CI GPUs.

WebKit is isolated because its Linux runtime requires additional host libraries:

```bash
npm run test:visual:webkit
```

Do not infer Safari compatibility from Chromium. The actual engine coverage is maintained in
[CROSS-BROWSER-TESTING.md](CROSS-BROWSER-TESTING.md).

## Static checks

```bash
npm run lint
npm run format:check
npm run build
npm audit --audit-level=high
```

The build must contain no source maps, secret files, application server bundle, imported
models, textures, fonts, or audio assets.

The only server-side deployment file is the 3 kB-or-smaller static asset worker generated at
`dist/server/index.js`; it contains no application state, endpoint, or backend service.

Playwright trace ZIPs are intentionally ignored by Git. They remain useful local diagnostics
but embed absolute test-runner paths that do not belong in the public source repository.

## Production checks

Against the deployed URL, verify:

1. HTTPS and initial HTML.
2. Hashed assets, favicon, manifest, robots, and social preview.
3. Canonical, Open Graph, and Twitter metadata.
4. Audio begins only after interaction; mute persists.
5. One full fragment order, reconstruction, ending, and replay in Chromium and Firefox.
6. Keyboard focus and reduced-motion behavior.
7. Mobile viewport composition and safe-area spacing.
8. Page visibility suspension and recovery.
9. No application console warnings or network failures.
10. WebGL failure fallback through the dedicated automated route/mocking test.

All six orders are exhaustively covered locally; production smoke testing uses representative
orders to avoid redundant public traffic.

Run the committed production journey against both installed engines:

```bash
PLAYWRIGHT_BASE_URL=https://example.com \
  npx playwright test -c playwright.production.config.ts
```

Capture the five final submission frames from the actual deployment:

```bash
PLAYWRIGHT_BASE_URL=https://example.com node scripts/capture-production.mjs
```
