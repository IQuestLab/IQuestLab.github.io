import { useTr } from '../../lib/i18n'

export default function Section({ id, title, intro, children }) {
  const tr = useTr()
  return (
    <section id={id} className="v2-section" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{tr(title)}</h2>
      {intro && <p className="v2-lede">{tr(intro)}</p>}
      {children}
    </section>
  )
}
