// Renders the light markup used in shared text: *emphasis*. Plain strings pass through.
export function rich(text) {
  if (typeof text !== 'string' || !text.includes('*')) return text
  return text.split(/(\*[^*]+\*)/).map((part, i) =>
    part.startsWith('*') && part.endsWith('*') && part.length > 2 ? <em key={i}>{part.slice(1, -1)}</em> : part,
  )
}

// Maps a shared { en, zh } pair through rich().
export const richPair = pair => ({ en: rich(pair.en), zh: rich(pair.zh) })
