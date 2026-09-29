import { isPlaceholder } from '../../shared'
import { useTr } from '../../lib/i18n'
import { ui } from '../copy'

// External link; unpublished ('#') links render as inert text with a hint.
export default function ExtLink({ href, children, className = '' }) {
  const tr = useTr()
  if (isPlaceholder(href)) {
    return <span className={`v2-link is-placeholder ${className}`} aria-disabled="true" title={tr(ui.comingSoon)}>{children}</span>
  }
  return <a className={`v2-link ${className}`} href={href} target="_blank" rel="noopener noreferrer">{children}</a>
}
