import { useEffect, useRef } from 'react'
import { useTr } from '../../lib/i18n'

// One player; the reader picks the recording (tabs) or the cut of one recording (cuts).
// The frame keeps the narrowest aspect ratio in the set, so switching never changes its height.
export function Player({ item, autoPlay, label }) {
  const ref = useRef(null)
  useEffect(() => {
    const video = ref.current
    if (video && autoPlay) video.play().catch(() => {})
  }, [item.video, autoPlay])
  return (
    <video ref={ref} key={item.video} src={item.video} poster={item.poster} controls muted playsInline
      preload={item.preload ?? 'metadata'} aria-label={label} />
  )
}

export const frameRatio = items => Math.min(...items.map(i => i.size[0] / i.size[1]))

export function RecordingTabs({ items, selected, onSelect, autoPlay, label }) {
  const tr = useTr()
  const listRef = useRef(null)
  const item = items.find(i => i.id === selected) ?? items[0]
  const onKeyDown = event => {
    const index = items.findIndex(i => i.id === item.id)
    const delta = { ArrowRight: 1, ArrowLeft: -1 }[event.key]
    if (!delta) return
    event.preventDefault()
    const next = items[(index + delta + items.length) % items.length]
    onSelect(next.id, false)
    listRef.current?.querySelector(`[data-id="${next.id}"]`)?.focus()
  }
  return (
    <>
      <div className="v2-tabs" role="tablist" aria-label={tr(label)} ref={listRef} onKeyDown={onKeyDown}>
        {items.map(it => (
          <button key={it.id} type="button" role="tab" data-id={it.id} aria-selected={it.id === item.id} tabIndex={it.id === item.id ? 0 : -1}
            className="v2-tab" onClick={() => onSelect(it.id, true)}>
            <span className="v2-tab-header">
              <span className="v2-tab-tag">{tr(it.tabLabel ?? it.tag)}</span>
              <svg className="v2-tab-play" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                <circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" />
                <path d="m8 6.5 5 3.5-5 3.5Z" fill="currentColor" />
              </svg>
            </span>
            <span className="v2-tab-title">{tr(it.title)}</span>
          </button>
        ))}
      </div>
      <div className="v2-player" style={{ aspectRatio: String(frameRatio(items)) }} role="tabpanel">
        <Player item={item} autoPlay={autoPlay} label={tr(item.title)} />
      </div>
    </>
  )
}

// A single recording.
export function Recording({ item }) {
  const tr = useTr()
  return (
    <div className="v2-player" style={{ aspectRatio: String(frameRatio([item])) }}>
      <Player item={item} label={tr(item.title)} />
    </div>
  )
}

export function RecordingCuts({ title, cuts, selected, onSelect, autoPlay, label, aspectRatio }) {
  const tr = useTr()
  const cut = cuts.find(c => c.id === selected) ?? cuts[0]
  return (
    <div className="v2-cuts">
      {cuts.length > 1 && (
        <div className="v2-switch v2-cuts-switch" role="group" aria-label={tr(label)}>
          {cuts.map(c => (
            <button key={c.id} type="button" aria-pressed={c.id === cut.id} onClick={() => onSelect(c.id)}>{tr(c.label)}</button>
          ))}
        </div>
      )}
      <div className="v2-player" style={{ aspectRatio: String(aspectRatio ?? frameRatio(cuts)) }}>
        <Player item={{ ...cut, preload: cut.minutes > 10 ? 'none' : 'metadata' }} autoPlay={autoPlay} label={tr(title)} />
      </div>
    </div>
  )
}
