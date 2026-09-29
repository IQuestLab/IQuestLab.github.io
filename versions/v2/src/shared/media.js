// Media paths are relative so the build works under any sub-path. Set VITE_MEDIA_BASE at build
// time (e.g. VITE_MEDIA_BASE=https://cdn.example.com/iquest/) to serve the recordings from a CDN.
const MEDIA_BASE = (import.meta.env && import.meta.env.VITE_MEDIA_BASE) || './'

export const video = name => `${MEDIA_BASE}videos/${name}.mp4`
export const poster = name => `./images/${name}.jpg`
export const demoUrl = (item, language) =>
  item.demo ? `./demos/${item.demo}/${language !== 'zh' && item.demoEn ? 'index_en.html' : 'index.html'}` : null

// Live demos are designed for a desktop window: render them at this size and scale to fit.
export const DEMO_VIEWPORT = [1280, 800]
