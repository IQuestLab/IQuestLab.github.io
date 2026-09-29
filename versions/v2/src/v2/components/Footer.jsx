import { useTr } from '../../lib/i18n'
import { ui } from '../copy'

export default function Footer() {
  const tr = useTr()
  return (
    <footer className="v2-footer">
      <p>{tr(ui.footer)}</p>
    </footer>
  )
}
