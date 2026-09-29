// Link to one recording or demo on this page: keeps the page version (?v=) and language.
export function shareUrl(id, language) {
  const url = new URL(window.location.href)
  const version = url.searchParams.get('v')
  url.search = ''
  url.hash = ''
  if (version) url.searchParams.set('v', version)
  url.searchParams.set('demo', id)
  if (language === 'zh') url.searchParams.set('lang', 'zh')
  return url.toString()
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    window.prompt('', text)
    return false
  }
}
