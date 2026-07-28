# Deployment

## Production target

FELICIA is a static Vite application deployed through OpenAI Sites. The hosting project uses
Cloudflare-backed source and deployment infrastructure and requires no server runtime,
environment variables, database, authentication, or API keys.

Production URL: <https://felicia-the-last-memory.ayx1.chatgpt.site>

The exact production commit and verification record are maintained in
[SUBMISSION-READINESS.md](SUBMISSION-READINESS.md).

## Build contract

- Install: `npm ci`
- Build: `npm run build`
- Browser assets: `dist/client/`
- Static asset worker: `dist/server/index.js`
- Node.js: 20.19 or newer
- SPA fallback: `/* → /index.html`
- Hashed assets: stable content-versioned filenames; the current Sites edge revalidates them
  despite the worker's requested immutable cache policy
- HTML: revalidate on every request
- Production source maps: disabled

The release build adds a minimal Cloudflare-compatible worker around the static Vite output.
It delegates files to the host's `ASSETS` binding, provides an SPA fallback for extensionless
routes, and applies the security headers directly. The repository also includes
`public/_headers` and `public/_redirects` as portable static-host defaults.

## Release process

1. Run the complete validation documented in [TESTING.md](TESTING.md).
2. Build from a clean committed source state.
3. Push that exact commit to the public GitHub repository and the Sites source repository.
4. Save a Sites version using the same commit SHA.
5. Deploy only the saved version.
6. Verify HTTPS, headers, metadata, assets, interactions, replay, and console output against
   the returned public URL.

The opaque Sites project identifier is stored in `.openai/hosting.json`. It is not a secret.
Repository credentials are short-lived and must never be stored in the project.

## Local production preview

```bash
npm ci
npm run build
npm run preview -- --host 127.0.0.1
```

Then open the printed local URL. Direct-refresh behavior should return `index.html`, and
`/assets/*` should resolve to hashed production files.

## Rollback

Sites versions are immutable records linked to Git commits. Roll back by selecting a prior
validated version and deploying it; do not rebuild an old working tree under a new SHA.

## Host portability

The built `dist/client/` directory can also be deployed directly to Cloudflare Pages,
Netlify, or Vercel as a static site. Preserve the cache policy, SPA fallback, and security
headers when changing hosts.
