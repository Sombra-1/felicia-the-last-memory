# Performance

## Runtime budgets

| State                  | Draw calls | Triangles |
| ---------------------- | ---------: | --------: |
| Initial chamber        |         32 |    16,844 |
| All memories recovered |         35 |    16,844 |
| Recall transient       |         37 |    17,108 |
| Identity ending        |         39 |    18,468 |
| Fear ending            |         40 |    20,044 |
| Hope ending            |         39 |    19,004 |

All states use two active lights, zero shadow maps, and no imported models or textures.
Phase 5 thickens existing ending geometry without increasing draw calls or segment counts.

## Quality tiers

| Tier   | DPR cap | Particles | Antialias | Postprocessing | Exposure | Readability |
| ------ | ------: | --------: | --------- | -------------- | -------: | ----------: |
| Low    |    1.00 |        24 | Off       | Off            |     1.02 |       1.18× |
| Medium |    1.35 |        52 | On        | Reduced        |     0.95 |       1.08× |
| High   |    1.75 |        88 | On        | Full           |     0.90 |       1.00× |

Low quality deliberately lifts ambient readability and line opacity to compensate for DPR
1 and disabled antialiasing. It does not add lights or replace darkness with uniform
brightness.

## Production payload

Latest Vite build:

| Asset        |       Raw |      Gzip |
| ------------ | --------: | --------: |
| HTML         |   2.16 kB |   0.74 kB |
| CSS          |  18.56 kB |   4.71 kB |
| Main JS      | 294.22 kB |  97.53 kB |
| Lazy 3D JS   | 976.54 kB | 259.62 kB |
| Audio assets |      0 kB |      0 kB |
| Font assets  |      0 kB |      0 kB |
| Metadata art | 122.03 kB | On demand |

Approximate first-view compressed application payload is 362.60 kB. A repeat view with
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
