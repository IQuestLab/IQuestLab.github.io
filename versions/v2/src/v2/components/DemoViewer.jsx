import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { DEMO_VIEWPORT, demoCategories, demoUrl, frontendDemos } from '../../shared'
import { useMediaQuery } from '../../lib/hooks/useMediaQuery'
import { rich } from '../../lib/rich'
import { useLanguageCode, useTr } from '../../lib/i18n'
import { frontend as FE } from '../copy'
import CopyLink from './CopyLink'

const categories = demoCategories.filter(c => c.id !== 'all')
const ordered = categories.flatMap(c => frontendDemos.filter(d => d.cat === c.id))

function Thumb({ item }) {
  const src = item.poster ?? item.cover
  if (src) return <img src={src} alt="" loading="lazy" />
  return <span className="v2-thumb-hue" style={{ background: `linear-gradient(135deg, ${item.hue[0]}, ${item.hue[1]})` }} />
}

// The live demo. It is released (src = about:blank) before unmounting so WebGL, audio,
// and the camera stop at once.
// The demo never takes keyboard focus by itself: page scrolling keys keep working until the
// reader clicks into it.
function DemoFrame({ src, title }) {
  const ref = useRef(null)
  useEffect(() => {
    const frame = ref.current
    if (frame.getAttribute('src') !== src) frame.src = src // StrictMode re-runs effects in development
    return () => { frame.src = 'about:blank' }
  }, [src])
  return (
    <div className="v2-stage-frame">
      <iframe ref={ref} src={src} title={title} allow="autoplay; fullscreen; camera; microphone; gamepad"
        style={{ width: DEMO_VIEWPORT[0], height: DEMO_VIEWPORT[1] }} />
    </div>
  )
}

const DemoViewer = forwardRef(function DemoViewer(props, ref) {
  const tr = useTr()
  const language = useLanguageCode()
  const phone = useMediaQuery('(max-width: 719.98px)')
  const [selectedId, setSelectedId] = useState(frontendDemos[0].id)
  const [category, setCategory] = useState('all')
  const visibleItems = category === 'all' ? ordered : ordered.filter(d => d.cat === category)
  const [mode, setMode] = useState(null) // null = default for the item
  const [onScreen, setOnScreen] = useState(false)
  const [phoneLoaded, setPhoneLoaded] = useState(false)
  const [playRecording, setPlayRecording] = useState(false)
  const stageRef = useRef(null)
  const sheetRef = useRef(null)
  const item = frontendDemos.find(d => d.id === selectedId)
  const url = demoUrl(item, language)
  const view = mode ?? (url ? 'demo' : 'video')

  // Deep links select an item without loading it.
  useImperativeHandle(ref, () => ({ select: id => { setCategory('all'); setSelectedId(id); setMode(null); setPhoneLoaded(false); setPlayRecording(false) } }), [])

  useEffect(() => {
    const stage = stageRef.current
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.intersectionRatio >= 0.2), { threshold: [0, 0.2, 0.5] })
    observer.observe(stage)
    const resize = new ResizeObserver(() => stage.style.setProperty('--demo-scale', String(stage.clientWidth / DEMO_VIEWPORT[0])))
    resize.observe(stage)
    return () => { observer.disconnect(); resize.disconnect() }
  }, [])

  const select = id => {
    setSelectedId(id)
    setMode(null)
    setPhoneLoaded(false)
    setPlayRecording(false)
  }

  const selectCategory = id => {
    setCategory(id)
    if (id !== 'all' && item.cat !== id) select(ordered.find(d => d.cat === id).id)
  }

  const onSheetKey = event => {
    const columns = getComputedStyle(sheetRef.current).gridTemplateColumns.split(' ').length
    const delta = { ArrowRight: 1, ArrowDown: columns, ArrowLeft: -1, ArrowUp: -columns }[event.key]
    if (!delta) return
    event.preventDefault()
    const index = visibleItems.findIndex(d => d.id === selectedId)
    const nextIndex = ((index + delta) % visibleItems.length + visibleItems.length) % visibleItems.length
    const next = visibleItems[nextIndex]
    select(next.id)
    sheetRef.current?.querySelector(`[data-id="${next.id}"]`)?.focus()
  }

  // Interactive first: on desktop the demo loads as soon as the stage is on screen; phones wait
  // for a tap to save battery and data.
  const loaded = phone ? phoneLoaded : true
  const mountDemo = view === 'demo' && loaded && onScreen
  let stage
  if (view === 'video') {
    stage = <video key={item.video} src={item.video} poster={item.poster} controls muted playsInline preload="metadata" autoPlay={playRecording} aria-label={tr(item.title)} />
  } else if (mountDemo) {
    stage = <DemoFrame key={`${item.id}-${language}`} src={url} title={tr(item.title)} />
  } else {
    stage = (
      <div className="v2-stage-poster">
        <Thumb item={item} />
        {phone ? (
          <div className="v2-stage-phone">
            <button type="button" className="v2-btn" onClick={() => setPhoneLoaded(true)}>{tr(FE.loadHere)}</button>
            {item.video && <button type="button" className="v2-btn" onClick={() => { setMode('video'); setPlayRecording(true) }}>{tr(FE.playRecording)}</button>}
          </div>
        ) : (
          <span className="v2-stage-load" aria-hidden="true">▶ {tr(FE.load)}</span>
        )}
      </div>
    )
  }

  return (
    <div className="v2-demos v2-wide">
      <div className="v2-demo-filters" role="group" aria-label={tr(FE.categoriesLabel)}>
        {demoCategories.map(cat => (
          <button key={cat.id} type="button" aria-pressed={category === cat.id} aria-controls="frontend-examples" onClick={() => selectCategory(cat.id)}>
            {tr(cat.label)}
            <span className="v2-demo-count v2-num">{cat.id === 'all' ? ordered.length : ordered.filter(d => d.cat === cat.id).length}</span>
          </button>
        ))}
      </div>
      <div id="frontend-examples" className="v2-sheet" role="group" aria-label={tr(FE.examplesLabel)} ref={sheetRef} onKeyDown={onSheetKey}>
        {visibleItems.map(d => (
          <button key={d.id} type="button" data-id={d.id} className="v2-sheet-item" aria-label={tr(d.title)} title={tr(d.title)} aria-pressed={d.id === selectedId}
            tabIndex={d.id === selectedId ? 0 : -1} onClick={() => select(d.id)}>
            <span className="v2-thumb">
              <Thumb item={d} />
              {d.video && <span className="v2-thumb-play" aria-hidden="true">▶</span>}
            </span>
            <span className="v2-sheet-title">{tr(d.shortTitle ?? d.title)}</span>
          </button>
        ))}
      </div>

      <div className="v2-demo-card">
        <div id="demo-figure" className="v2-stage" ref={stageRef}>
          {stage}
          {/* Open in a new tab and copy link sit inside the stage, top right. */}
          <div className="v2-stage-overlay">
            {url && <a className="v2-stage-open" href={url} target="_blank" rel="noopener noreferrer">{tr(FE.openShort)}</a>}
            <CopyLink id={item.id} />
          </div>
        </div>

        <div className="v2-stage-info">
          <div className="v2-stage-heading">
            <h3>{tr(item.title)}</h3>
            {item.demo && item.video && (
              <div className="v2-stage-actions" role="group" aria-label={tr(FE.showAs)}>
                <button type="button" aria-pressed={view === 'demo'} onClick={() => setMode('demo')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                    <path d="m4 3 7.5 18 2.5-7 7-2.5L4 3Z" />
                  </svg>
                  <span>{tr(FE.interactive)}</span>
                </button>
                <button type="button" aria-pressed={view === 'video'} onClick={() => { setMode('video'); setPlayRecording(true) }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                    <rect x="3" y="5" width="18" height="14" rx="3" />
                    <path d="m10 9 5 3-5 3Z" fill="currentColor" stroke="none" />
                  </svg>
                  <span>{tr(FE.recording)}</span>
                </button>
              </div>
            )}
          </div>
          <p className="v2-stage-body">{rich(tr(item.body))}</p>
        </div>
      </div>
    </div>
  )
})

export default DemoViewer
