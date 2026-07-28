# Performance

## Runtime budgets

| State                  | Draw calls | Triangles |
| ---------------------- | ---------: | --------: |
| Initial chamber        |         61 |    31,472 |
| All memories recovered |         48 |    23,104 |
| Reconstruction peak    |         55 |    27,908 |
| Identity ending        |         55 |    27,908 |
| Fear ending            |         54 |    27,836 |
| Hope ending            |         58 |    30,992 |

All states use three active lights, zero shadow maps, and no imported models or textures.
Phase 6.6 spends a controlled amount of geometry on FELICIA's split translucent shells,
solid ribs, tubular neural filaments, and profile-specific ending silhouettes. Repeated
Identity ribs are instanced, and dormant fragments still collapse to one-draw seals.
Measurements are captured in `docs/submission/scene-metrics.json`.

## Quality tiers

| Tier   | DPR cap | Particles | Antialias | Postprocessing | Exposure | Readability |
| ------ | ------: | --------: | --------- | -------------- | -------: | ----------: |
| Low    |    1.00 |        24 | Off       | Off            |     1.08 |       1.18× |
| Medium |    1.35 |        52 | On        | Reduced        |     1.02 |       1.08× |
| High   |    1.75 |        88 | On        | Full           |     0.98 |       1.00× |

Low quality deliberately lifts ambient readability and line opacity to compensate for DPR
1 and disabled antialiasing. It does not add lights or replace darkness with uniform
brightness.

## Production payload

Latest Vite build:

| Asset        |       Raw |      Gzip |
| ------------ | --------: | --------: |
| HTML         |   2.16 kB |   0.74 kB |
| CSS          |  19.75 kB |   4.98 kB |
| Main JS      | 300.73 kB |  99.18 kB |
| Lazy 3D JS   | 990.70 kB | 262.66 kB |
| Audio assets |      0 kB |      0 kB |
| Font assets  |      0 kB |      0 kB |
| Metadata art | 122.03 kB | On demand |

Approximate first-view compressed application payload is 367.56 kB. A repeat view with
hashed assets cached primarily revalidates the 0.74 kB compressed HTML. The complete `dist`
directory is approximately 1.4 MB. Production source maps are disabled; the social preview
and project thumbnail are fetched only by metadata consumers or direct requests.

The evidence directory is documentation and is not part of Vite's production output.

## Production Lighthouse diagnostic

Lighthouse 13.4.1 ran against the final public Sites release in headless Chromium 151 using
its simulated Moto G Power mobile profile:

| Category       | Score |
| -------------- | ----: |
| Performance    |    69 |
| Accessibility  |   100 |
| Best Practices |    81 |
| SEO            |   100 |

- First Contentful Paint: 1.4 seconds
- Largest Contentful Paint: 1.4 seconds
- Cumulative Layout Shift: 0.001
- Speed Index: 3.0 seconds

The continuously rendered WebGL canvas produces a high throttled Total Blocking Time in the
synthetic trace. Best Practices deductions also include deprecated APIs in Cloudflare's
injected challenge script and intentionally missing production source maps. Canonical
metadata, HTTPS, console, contrast, button names, and the visible-label audit all pass.

## Runtime diagnostics

Direct browser diagnostics are more representative for this WebGL artwork than a single
score. Chromium viewport, console, quality, rendering, and payload checks remain automated.
Lighthouse was invoked through `npx` for the release audit and was not added to the project
dependency graph.
