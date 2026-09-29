import { useTr } from '../../lib/i18n'

// Prose with margin figures (≥1280px); below that the figures follow as a stat row.
export default function AsideRow({ children, aside, asideTitle, note, margin, className = '', ...rest }) {
  const tr = useTr()
  return (
    <div className={`v2-aside-row ${className}`} {...rest}>
      <div className="v2-aside-main">{children}</div>
      <aside className="v2-aside">
        {asideTitle && <p className="v2-pulls-title">{tr(asideTitle)}</p>}
        {aside && (
          <dl className="v2-pulls">
            {aside.map((item, i) => (
              <div key={i} className="v2-pull">
                <dt>{(Array.isArray(item.value) ? item.value : [item.value]).map((v, k) => <span key={k} className="v2-pull-line">{v}</span>)}</dt>
                <dd>{tr(item.label)}</dd>
              </div>
            ))}
          </dl>
        )}
        {note && <p className="v2-pull-note">{tr(note)}</p>}
        {margin}
      </aside>
    </div>
  )
}
