# Deployment

## Production target

FELICIA is a static Vite application deployed through OpenAI Sites. The hosting project uses
Cloudflare-backed source and deployment infrastructure and requires no server runtime,
environment variables, database, authentication, or API keys.

The exact production URL and commit are recorded in
[SUBMISSION-READINESS.md](SUBMISSION-READINESS.md).

## Build contract

- Install: `npm ci`
- Build: `npm run build`
- Static output: `dist/`
- Node.js: 20.19 or newer
- SPA fallback: `/* → /index.html`
- Hashed assets: one-year immutable cache
- HTML: revalidate on every request
- Production source maps: disabled

The repository includes `public/_headers` and `public/_redirects` as portable static-host
defaults. The host is also expected to provide HTTPS, compression, correct MIME types, and
directory-listing protection.

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

The built `dist/` directory can also be deployed to Cloudflare Pages, Netlify, or Vercel as a
static site. Preserve the cache policy, SPA fallback, and security headers when changing
hosts.
