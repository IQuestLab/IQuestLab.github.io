import { forwardRef } from 'react'
import { useTr } from '../../lib/i18n'
import { ui } from '../copy'

// A figure that breaks out to the wide track, with a caption aligned to the text column.
const Figure = forwardRef(function Figure({ id, wide = true, rule = false, title, actions, caption, className = '', children, ...rest }, ref) {
  const tr = useTr()
  return (
    <figure ref={ref} id={id} className={`v2-fig${wide ? ' v2-wide' : ''}${rule ? ' has-rule' : ''} ${className}`} {...rest}>
      {(title || actions) && (
        <div className="v2-fig-head">
          {title && <p className="v2-fig-title">{tr(title)}</p>}
          {actions && <div className="v2-fig-actions">{actions}</div>}
        </div>
      )}
      {children}
      {caption && (
        <figcaption className="v2-cap">
          {caption.lead && <b>{tr(caption.lead)}</b>}{caption.lead && caption.text && tr(ui.gap)}{caption.text && tr(caption.text)}
        </figcaption>
      )}
    </figure>
  )
})

export default Figure
