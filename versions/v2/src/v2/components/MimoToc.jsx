import { useEffect, useState } from 'react'
import { useLanguageCode, useTr } from '../../lib/i18n'
import { ui } from '../copy'

// Only article headings belong in the contents, not headings inside demos or tabs.
// Generated anchors stay stable when the reader switches languages.
export default function Toc() {
  const language = useLanguageCode()
  const tr = useTr()
  const [items, setItems] = useState([])
  const [active, setActive] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const headings = [...document.querySelectorAll('.v2-section > h2, .v2-section > h3')]
    const groups = []
    const entries = headings.map((heading, index) => {
      if (!heading.id) heading.id = `${heading.parentElement.id}-heading-${index}`
      const item = { id: heading.id, label: heading.textContent, children: [] }
      if (heading.tagName === 'H2' || !groups.length) groups.push(item)
      else groups[groups.length - 1].children.push(item)
      return { heading, id: item.id, parent: groups[groups.length - 1].id }
    })
    setItems(groups)

    let frame = 0
    const update = () => {
      frame = 0
      const hero = document.getElementById('top')
      // Our fixed header covers the top of the viewport, unlike the reference's
      // article flow. Reveal once the hero has left the unobscured reading area.
      const headerBottom = document.querySelector('.site-nav, .v2-bar')?.getBoundingClientRect().bottom || 0
      setVisible(!hero || hero.getBoundingClientRect().bottom < headerBottom)
      const line = Math.min(160, window.innerHeight * 0.25)
      let current = null
      for (const entry of entries) {
        if (entry.heading.getBoundingClientRect().top <= line) current = entry
        else break
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = entries.at(-1)
      setActive(previous => previous?.id === current?.id ? previous : current)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    const observer = new ResizeObserver(schedule)
    observer.observe(document.querySelector('.v2-article'))
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    update()
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      cancelAnimationFrame(frame)
    }
  }, [language])

  const renderLink = item => (
    <a href={`#${item.id}`} className={active?.id === item.id || active?.parent === item.id ? 'is-active' : undefined}
      aria-current={active?.id === item.id ? 'location' : undefined}>{item.label}</a>
  )

  return (
    <nav className={`site-toc${visible ? ' is-visible' : ''}`} aria-label={tr(ui.contents)} aria-hidden={!visible} inert={visible ? undefined : ''}>
      <ol>{items.map(item => (
        <li key={item.id}>
          {renderLink(item)}
          {item.children.length > 0 && <ol>{item.children.map(child => <li key={child.id}>{renderLink(child)}</li>)}</ol>}
        </li>
      ))}</ol>
    </nav>
  )
}
