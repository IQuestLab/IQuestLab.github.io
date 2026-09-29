import { useEffect, useState } from 'react'

// A new key, so the language older visits saved automatically no longer applies.
const key = 'iquest.lang.choice'
const initialLanguage = () => {
  try {
    const query = new URLSearchParams(window.location.search).get('lang')
    if (query === 'zh' || query === 'en') return query
    const saved = localStorage.getItem(key)
    if (saved === 'zh' || saved === 'en') return saved
  } catch { /* browser storage is optional */ }
  // English unless the URL asks otherwise or the visitor has switched before.
  return 'en'
}

export function useLanguage() {
  const [language, setLanguage] = useState(initialLanguage)
  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
  }, [language])
  // Only a switch the visitor makes is remembered.
  const toggle = () => setLanguage(value => {
    const next = value === 'zh' ? 'en' : 'zh'
    try { localStorage.setItem(key, next) } catch { /* ignore */ }
    return next
  })
  return [language, toggle]
}
