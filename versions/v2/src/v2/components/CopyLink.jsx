import { shareUrl } from '../../lib/share'
import { useLanguageCode } from '../../lib/i18n'
import { ui } from '../copy'
import CopyButton from './CopyButton'

export default function CopyLink({ id }) {
  const language = useLanguageCode()
  return <CopyButton getText={() => shareUrl(id, language)} label={ui.copyLink} done={ui.linkCopied} className="v2-copylink" />
}
