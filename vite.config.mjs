import { fileURLToPath } from 'node:url'
import { readdir, rename } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { checkV2Numbers } from './versions/v2/scripts/check-v2-numbers.mjs'

// Share-card crawlers need an absolute og:image URL. Set SITE_URL (with a trailing slash)
// when building for a public host; without it the image path stays relative.
const allowedHosts = (process.env.DEV_ALLOWED_HOSTS || '').split(',').map(host => host.trim()).filter(Boolean)

const siteUrl = () => ({
  name: 'site-url',
  transformIndexHtml: html => html.replaceAll('__SITE_URL__', process.env.SITE_URL || 'https://iquestlab.github.io/'),
})

// Fails the build when a shared number is typed by hand in v2 (see scripts/check-v2-numbers.mjs).
const v2Guard = () => ({
  name: 'v2-number-guard',
  apply: 'build',
  async buildStart() {
    const errors = await checkV2Numbers()
    if (errors.length) this.error(`v2 number guard:\n${errors.join('\n')}`)
  },
})

// Keep directory URLs consistent with GitHub Pages so archived relative assets resolve.
const archiveDirectory = () => {
  const redirect = (req, res, next) => {
    const url = new URL(req.url, 'http://localhost')
    if (url.pathname === '/v1' || url.pathname === '/iquest-coder-v1') {
      res.writeHead(302, { Location: `/iquest-coder-v1/${url.search}` })
      res.end()
      return
    }
    next()
  }
  return {
    name: 'archive-directory',
    configureServer(server) {
      server.middlewares.use(redirect)
      // Keep archive resources in public/v1 while serving the published URL.
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url, 'http://localhost')
        const prefix = '/iquest-coder-v1/'
        if (url.pathname.startsWith(prefix)) {
          const resource = url.pathname.slice(prefix.length)
          if (resource && resource !== 'index.html') req.url = `/v1/${resource}${url.search}`
        }
        next()
      })
    },
    configurePreviewServer(server) { server.middlewares.use(redirect) },
    async writeBundle(options) {
      // Only the generated site uses the public URL as its resource directory.
      const archive = resolve(options.dir, 'v1')
      const published = resolve(options.dir, 'iquest-coder-v1')
      for (const entry of await readdir(archive)) {
        if (entry !== 'index.html') await rename(resolve(archive, entry), resolve(published, entry))
      }
    },
  }
}

export default defineConfig({
  base: './',
  publicDir: 'versions/v2/public',
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        v1: fileURLToPath(new URL('./iquest-coder-v1/index.html', import.meta.url)),
        legacy: fileURLToPath(new URL('./v1/index.html', import.meta.url)),
      },
    },
  },
  plugins: [archiveDirectory(), react(), siteUrl(), v2Guard()],
  // Workspace filesystem changes can miss native watch events; poll to keep dev modules current.
  server: { host: '0.0.0.0', port: 4000, strictPort: true, allowedHosts, watch: { usePolling: true, interval: 500 } },
  // Additional local preview hosts can be supplied through DEV_ALLOWED_HOSTS.
  preview: { host: '0.0.0.0', port: 4000, strictPort: true, allowedHosts },
})
