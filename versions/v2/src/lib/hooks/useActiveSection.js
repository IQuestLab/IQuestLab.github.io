import { useEffect, useState } from 'react'

// Tracks which section is currently being read: the last one whose top has
// passed a line a little below the sticky header. With `lastAtBottom`, the last
// section also counts as read once the page is scrolled to the end, even if it
// is too short to reach that line.
export function useActiveSection(ids, offset = 120, lastAtBottom = false) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      let current = ids[0]
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top - offset <= 0) current = id
      }
      const end = document.documentElement.scrollHeight - window.innerHeight
      if (lastAtBottom && end > 0 && window.scrollY >= end - 2) current = ids[ids.length - 1]
      setActive(current)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [ids, offset, lastAtBottom])
  return active
}
