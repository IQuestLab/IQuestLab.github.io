import { useState } from 'react'
import { agentSnippets, downloads, links, serveSnippets } from '../../shared'
import { useTr } from '../../lib/i18n'
import { quickstart as Q, ui } from '../copy'
import CopyButton from './CopyButton'
import ExtLink from './ExtLink'
import Section from './Section'

// Tabbed code block; `name` keeps the tab and panel ids of several blocks apart.
function CodeTabs({ name, label, snippets }) {
  const tr = useTr()
  const [tab, setTab] = useState(snippets[0].id)
  const current = snippets.find(s => s.id === tab)
  const onTabKey = event => {
    const delta = { ArrowRight: 1, ArrowLeft: -1 }[event.key]
    if (!delta) return
    event.preventDefault()
    const index = snippets.findIndex(s => s.id === tab)
    const next = snippets[(index + delta + snippets.length) % snippets.length]
    setTab(next.id)
    document.getElementById(`${name}-tab-${next.id}`)?.focus()
  }
  return (
    <>
      <div className="v2-code">
        <div className="v2-code-head">
          <div className="v2-switch" role="tablist" aria-label={tr(label)} onKeyDown={onTabKey}>
            {snippets.map(s => (
              <button key={s.id} id={`${name}-tab-${s.id}`} type="button" role="tab" aria-selected={s.id === tab} aria-controls={`${name}-panel`}
                tabIndex={s.id === tab ? 0 : -1} onClick={() => setTab(s.id)}>{tr(s.label)}</button>
            ))}
          </div>
          <CopyButton getText={() => current.code} />
        </div>
        <pre id={`${name}-panel`} role="tabpanel" aria-labelledby={`${name}-tab-${tab}`} tabIndex={0}><code>{current.code.split('\n').map((line, i) => (
          <span key={i} className={line.includes(ui.todo) ? 'is-todo' : undefined}>{line}{'\n'}</span>
        ))}</code></pre>
      </div>
      {current.note && <p className="v2-fine">{tr(current.note)}</p>}
    </>
  )
}

// One group of commands in a card that starts collapsed: title and tab names in the summary.
function CommandCard({ name, title, lede, snippets }) {
  const tr = useTr()
  return (
    <details className="v2-howto">
      <summary>
        <span className="v2-howto-icon" aria-hidden="true">{'>_'}</span>
        <span className="v2-howto-text">
          <h3 className="v2-howto-title">{tr(title)}</h3>
          <span className="v2-howto-sub">{snippets.map(s => tr(s.label)).join(' · ')}</span>
        </span>
        <span className="v2-howto-chev" aria-hidden="true" />
      </summary>
      {lede && <p className="v2-howto-lede">{tr(lede)}</p>}
      <CodeTabs name={name} label={title} snippets={snippets} />
    </details>
  )
}

export default function Quickstart() {
  const tr = useTr()
  return (
    <Section id="quickstart" title={Q.title} intro={Q.intro}>
      <ul className="v2-downloads">
        {downloads.map(d => (
          <li key={d.id}>
            <span className="v2-downloads-name">
              <ExtLink href={links[d.id]}>{tr(d.name)}</ExtLink>
            </span>
            <span className="v2-downloads-body">{tr(d.body)}</span>
            <span className="v2-downloads-arrow" aria-hidden="true">↗</span>
          </li>
        ))}
      </ul>

      <CommandCard name="serve" title={Q.serveTitle} snippets={serveSnippets} />
      <CommandCard name="agent" title={Q.agentsTitle} lede={Q.agents} snippets={agentSnippets} />
    </Section>
  )
}
