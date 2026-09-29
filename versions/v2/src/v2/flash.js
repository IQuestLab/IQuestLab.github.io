// Scrolls an element into view below the top bar and briefly outlines it.
export function jumpTo(id, { offset = 72, flash = true } = {}) {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: reduce ? 'instant' : 'smooth' })
  if (!flash) return
  el.classList.remove('v2-flash')
  void el.offsetWidth
  el.classList.add('v2-flash')
  setTimeout(() => el.classList.remove('v2-flash'), 1200)
}
