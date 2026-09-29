import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { frontendDemos, larkScenarios } from '../shared'
import { useDemoDeepLink, useExclusiveVideo } from '../lib/hooks/usePageBehaviour'
import { useTr } from '../lib/i18n'
import { AnnounceProvider } from './announce'
import ArticleHeader from './components/ArticleHeader'
import Footer from './components/Footer'
import Quickstart from './components/Quickstart'
import TopBar from './components/TopBar'
import Toc from './components/MimoToc'
import { rdCases, SECTION_ORDER, ui } from './copy'
import { Contact, Frontend, Limitations, Office, Overview, RdCases, Results, Training } from './Sections'

const BAR = 72 // sticky top bar plus a little air
const SECTIONS = { overview: Overview, training: Training, results: Results, 'rd-cases': RdCases, office: Office, frontend: Frontend, quickstart: Quickstart, limitations: Limitations, contact: Contact }
const recordedLark = larkScenarios.find(s => s.recordings)
// Blocks the language switch keeps in place. Both languages render the same element tree,
// so a block's index identifies it across the switch.
const BLOCKS = '.v2-article > :not(.v2-section), .v2-section > *'

// Where ?demo=<id> should land: the element that shows that item.
const targetOf = id =>
  rdCases.items.some(r => r.id === id) ? 'rd-figure'
    : id === recordedLark.id ? 'lark-figure'
      : frontendDemos.some(d => d.id === id) ? 'demo-figure' : null

// #section links: the section only exists once React has rendered, so the browser's own jump
// misses it. Jump again after fonts settle unless the reader has scrolled in the meantime.
function useHashJump() {
  useEffect(() => {
    let id = ''
    try { id = decodeURIComponent(window.location.hash.slice(1)) } catch { return }
    if (!id || new URLSearchParams(window.location.search).has('demo')) return
    let landed = null
    const jump = () => {
      const el = document.getElementById(id)
      if (!el || (landed != null && Math.abs(window.scrollY - landed) > 4)) return
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - BAR, behavior: 'instant' })
      landed = window.scrollY
    }
    const timers = [setTimeout(jump, 50), setTimeout(jump, 900)]
    document.fonts?.ready.then(jump)
    return () => timers.forEach(clearTimeout)
  }, [])
}

export default function Page({ language, onToggleLanguage }) {
  const tr = useTr()
  const [rdSelected, setRdSelected] = useState(rdCases.items[0].id)
  const [rdAutoPlay, setRdAutoPlay] = useState(false)
  const [cut, setCut] = useState(recordedLark.recordings[0].id)
  const [cutAutoPlay, setCutAutoPlay] = useState(false)
  const demoRef = useRef(null)

  useExclusiveVideo()
  useHashJump()

  useEffect(() => { document.title = tr(ui.docTitle) }, [language]) // eslint-disable-line react-hooks/exhaustive-deps

  const select = useCallback(id => {
    if (rdCases.items.some(r => r.id === id)) { setRdSelected(id); setRdAutoPlay(false) }
    else if (frontendDemos.some(d => d.id === id)) demoRef.current?.select(id)
    const target = targetOf(id)
    setTimeout(() => {
      const el = target && document.getElementById(target)
      if (!el) return
      el.classList.add('v2-flash')
      setTimeout(() => el.classList.remove('v2-flash'), 1200)
    }, 950)
  }, [])
  useDemoDeepLink(targetOf, select, BAR)

  // Keep the reader on the same paragraph when the language (and so the text length) changes.
  const anchor = useRef(null)
  const onLanguage = () => {
    anchor.current = null
    if (window.scrollY > 8) {
      const blocks = [...document.querySelectorAll(BLOCKS)]
      const index = blocks.findIndex(el => el.getBoundingClientRect().bottom > BAR)
      if (index >= 0) anchor.current = { index, top: blocks[index].getBoundingClientRect().top }
    }
    onToggleLanguage()
  }
  useLayoutEffect(() => {
    // Set before measuring: the :lang() rules change fonts and line heights.
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
    const saved = anchor.current
    anchor.current = null
    const el = saved && document.querySelectorAll(BLOCKS)[saved.index]
    if (el) window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - saved.top, behavior: 'instant' })
  }, [language])

  const onCut = id => {
    const video = document.querySelector('#lark-figure video')
    setCutAutoPlay(Boolean(video && !video.paused))
    setCut(id)
  }

  const props = {
    'rd-cases': { selected: rdSelected, onSelect: (id, play) => { setRdSelected(id); setRdAutoPlay(play) }, autoPlay: rdAutoPlay },
    office: { cut, onCut, autoPlay: cutAutoPlay },
    frontend: { demoRef },
  }

  return (
    <AnnounceProvider>
      <div className="v2-page">
        <TopBar language={language} onLanguage={onLanguage} />
        <Toc />
        <main className="v2-article">
          <ArticleHeader />
          {SECTION_ORDER.map(id => {
            const Component = SECTIONS[id]
            return <Component key={id} {...(props[id] || {})} />
          })}
        </main>
        <Footer />
      </div>
    </AnnounceProvider>
  )
}
