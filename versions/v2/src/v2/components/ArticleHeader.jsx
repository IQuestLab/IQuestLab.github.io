import { links, model } from '../../shared'
import { useTr } from '../../lib/i18n'
import { jumpTo } from '../flash'
import { header } from '../copy'
import ExtLink from './ExtLink'

export default function ArticleHeader() {
  const tr = useTr()
  return (
    <header id="top" className="v2-head">
      <p className="v2-kicker">{tr(header.kicker)}</p>
      <h1><span className="v2-latin">{model.name}</span>{tr(header.separator)}{tr(header.tagline)}</h1>
      <p className="v2-dek">{tr(header.dek)}</p>
      <p className="v2-actions">
        <ExtLink href={links.report}>{tr(header.report)}</ExtLink>
        <ExtLink href={links.github}>GitHub ↗</ExtLink>
        <ExtLink href={links.huggingface}>Hugging Face ↗</ExtLink>
        <a className="v2-link" href="#frontend" onClick={event => { event.preventDefault(); jumpTo('frontend', { flash: false }) }}>{tr(header.watchDemos)}</a>
      </p>
    </header>
  )
}
