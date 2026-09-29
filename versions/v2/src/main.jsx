import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// This site publishes only the v2 layout; the old IQuest Coder site lives at /iquest-coder-v1/.
document.documentElement.dataset.blogVersion = 'v2'
const RELOAD_KEY = 'iquest.chunkReload'
import('./v2/App.jsx').then(({ default: App }) => {
  try { sessionStorage.removeItem(RELOAD_KEY) } catch { /* optional */ }
  createRoot(document.getElementById('root')).render(
    <StrictMode><App /></StrictMode>,
  )
}).catch(error => {
  // A cached index.html can point at chunks removed by a redeploy: reload once, then explain.
  console.error(error)
  let retried = false
  try { retried = sessionStorage.getItem(RELOAD_KEY) === '1'; sessionStorage.setItem(RELOAD_KEY, '1') } catch { /* optional */ }
  if (!retried) { window.location.reload(); return }
  document.getElementById('root').innerHTML = '<p style="font:16px/1.6 sans-serif;margin:40px auto;max-width:560px;padding:0 16px">The page could not be loaded. <a href="">Reload</a> · 页面加载失败，请<a href="">刷新</a>。</p>'
})
