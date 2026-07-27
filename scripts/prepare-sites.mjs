import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = process.cwd()
const serverDirectory = resolve(root, 'dist/server')
const metadataDirectory = resolve(root, 'dist/.openai')

const worker = `const SECURITY_HEADERS = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
}

function secure(response, pathname) {
  const secured = new Response(response.body, response)
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    secured.headers.set(name, value)
  }

  if (pathname.startsWith('/assets/')) {
    secured.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  } else if (
    pathname === '/' ||
    pathname === '/index.html' ||
    pathname === '/social-preview.jpg' ||
    pathname === '/project-thumbnail.jpg'
  ) {
    secured.headers.set(
      'Cache-Control',
      pathname.endsWith('.jpg')
        ? 'public, max-age=86400'
        : 'public, max-age=0, must-revalidate',
    )
  }

  return secured
}

export default {
  async fetch(request, environment) {
    const response = await environment.ASSETS.fetch(request)
    const url = new URL(request.url)

    if (
      response.status !== 404 ||
      request.method !== 'GET' ||
      url.pathname.includes('.')
    ) {
      return secure(response, url.pathname)
    }

    const fallback = new Request(new URL('/index.html', url), request)
    return secure(await environment.ASSETS.fetch(fallback), '/index.html')
  },
}
`

await mkdir(serverDirectory, { recursive: true })
await mkdir(metadataDirectory, { recursive: true })
await writeFile(resolve(serverDirectory, 'index.js'), worker)
await copyFile(
  resolve(root, '.openai/hosting.json'),
  resolve(metadataDirectory, 'hosting.json'),
)
