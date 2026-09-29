import '@fontsource-variable/source-serif-4/opsz.css'
import '@fontsource-variable/source-serif-4/opsz-italic.css'
import '@fontsource-variable/source-sans-3/wght.css'
import { useLanguage } from '../lib/hooks/useLanguage'
import { LanguageContext } from '../lib/i18n'
import Page from './Page'
import './styles.css'
import './components/MimoToc.css'

export default function App() {
  const [language, toggleLanguage] = useLanguage()
  return (
    <LanguageContext.Provider value={language}>
      <Page language={language} onToggleLanguage={toggleLanguage} />
    </LanguageContext.Provider>
  )
}
