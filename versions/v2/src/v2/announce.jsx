import { createContext, useCallback, useContext, useState } from 'react'

// One polite live region for the whole page ("Copied", "Link copied", …).
const AnnounceContext = createContext(() => {})

export function AnnounceProvider({ children }) {
  const [message, setMessage] = useState('')
  const announce = useCallback(text => {
    setMessage('')
    requestAnimationFrame(() => setMessage(text))
  }, [])
  return (
    <AnnounceContext.Provider value={announce}>
      {children}
      <div className="v2-sr" aria-live="polite" role="status">{message}</div>
    </AnnounceContext.Provider>
  )
}

export const useAnnounce = () => useContext(AnnounceContext)
