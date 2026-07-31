# Performance

## Runtime budgets

| State                  | Desktop calls | Mobile calls | Desktop triangles | Mobile triangles |
| ---------------------- | ------------: | -----------: | ----------------: | ---------------: |
| Opening fold           |            23 |           23 |            60,454 |           60,454 |
| Identity               |            23 |           30 |            60,454 |           69,594 |
| Fear                   |            30 |           27 |            69,594 |           66,798 |
| Hope                   |            30 |           29 |            69,594 |           70,604 |
| Reconstruction         |            24 |           24 |            67,338 |           67,338 |
| Identity/Fear/Hope end |            24 |           24 |            67,338 |           67,338 |

All measured Phase 9 states use three active lights, zero shadow maps, no decorative
particles, and no imported models or textures. Measurements and console results are captured
in `docs/evidence/phase9/final/performance.json`.

## Quality tiers

| Tier   | DPR cap | Antialias | Postprocessing | Exposure | Readability |
| ------ | ------: | --------- | -------------- | -------: | ----------: |
| Low    |    1.00 | Off       | Off            |     1.08 |       1.18× |
| Medium |    1.35 | On        | Reduced        |     1.02 |       1.08× |
| High   |    1.75 | On        | Full           |     0.98 |       1.00× |

Low quality deliberately lifts ambient readability and line opacity to compensate for DPR
1 and disabled antialiasing. It does not add lights or replace darkness with uniform
brightness.

## Production payload

Latest Vite build:

| Asset           |       Raw |      Gzip |
| --------------- | --------: | --------: |
| HTML            |   2.24 kB |   0.77 kB |
| CSS             |  41.38 kB |   8.73 kB |
| Main JS         | 290.27 kB |  95.89 kB |
| Loading JS      | 396.00 kB | 109.11 kB |
| Lazy 3D JS      | 626.27 kB | 167.48 kB |
| Audio assets    |      0 kB |      0 kB |
| Font assets     |      0 kB |      0 kB |
| Metadata images | 102.00 kB | On demand |

The largest WebGL chunk is loaded lazily after the HTML interface. Assets are content
hashed. Production source maps are disabled; the social preview and project thumbnail are
fetched only by metadata consumers or direct requests.

The evidence directory is documentation and is not part of Vite's production output.

## Production Lighthouse diagnostic

Lighthouse 13.4.1 ran against the final public Sites release in headless Chromium 151 using
its simulated Moto G Power mobile profile:

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

The continuously rendered WebGL canvas produces a high throttled Total Blocking Time in the
synthetic trace. Best Practices deductions also include deprecated APIs in Cloudflare's
injected challenge script and intentionally missing production source maps. Canonical
metadata, HTTPS, console, contrast, button names, and the visible-label audit all pass.

## Runtime diagnostics

Direct browser diagnostics are more representative for this WebGL artwork than a single
score. Chromium viewport, console, quality, rendering, and payload checks remain automated.
Lighthouse was invoked through `npx` for the release audit and was not added to the project
dependency graph.
