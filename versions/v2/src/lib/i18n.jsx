import { createContext, useContext } from 'react'

export const LanguageContext = createContext('en')

// `tr({ en, zh })` picks the active language; plain strings pass through.
export function useTr() {
  const language = useContext(LanguageContext)
  return value => (value && typeof value === 'object' && 'en' in value ? value[language] : value)
}

export const useLanguageCode = () => useContext(LanguageContext)
