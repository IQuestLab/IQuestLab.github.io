import { useEffect, useRef, useState } from 'react'
import { copyText } from '../../lib/share'
import { useTr } from '../../lib/i18n'
import { useAnnounce } from '../announce'
import { ui } from '../copy'

// Copies `getText()` and swaps its label for 1.6s when the copy succeeded.
export default function CopyButton({ getText, label = ui.copy, done = ui.copied, className = '' }) {
  const tr = useTr()
  const announce = useAnnounce()
  const [copied, setCopied] = useState(false)
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])
  const onClick = async () => {
    if (!(await copyText(getText()))) return
    setCopied(true)
    announce(tr(done))
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1600)
  }
  return <button type="button" className={`v2-textbtn ${className}`} onClick={onClick}>{tr(copied ? done : label)}</button>
}
