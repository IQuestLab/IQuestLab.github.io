import { useEffect } from 'react'

// Only one recording plays at a time: starting a video pauses every other one on the page.
export function useExclusiveVideo() {
  useEffect(() => {
    const onPlay = event => {
      document.querySelectorAll('video').forEach(video => { if (video !== event.target && !video.paused) video.pause() })
    }
    document.addEventListener('play', onPlay, true)
    return () => document.removeEventListener('play', onPlay, true)
  }, [])
}

// ?demo=<id>: select that item and scroll its section into view. The jump is repeated once
// fonts and media have settled, since late layout shifts would leave the section off-screen.
export function useDemoDeepLink(sectionOf, select, offset = 64) {
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('demo')
    const section = id && sectionOf(id)
    if (!section) return
    select(id)
    const jump = () => {
      const el = document.getElementById(section)
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'instant' })
    }
    const timers = [setTimeout(jump, 50), setTimeout(jump, 900)]
    document.fonts?.ready.then(jump)
    return () => timers.forEach(clearTimeout)
  }, [sectionOf, select, offset])
}
