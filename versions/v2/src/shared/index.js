// Public content shared by page components and the local consistency check.
import { benchmarks } from './benchmarks.js'
import { caseFacts, larkScenarios, rdRecordings } from './cases.js'
import { citationMeta } from './citation.js'
import { demoCategories, frontendDemos } from './demos.js'
import { downloads, links } from './links.js'
import { model } from './model.js'
import { agentSnippets, serveSnippets } from './quickstart.js'

export * from './benchmarks.js'
export * from './cases.js'
export * from './citation.js'
export * from './demos.js'
export * from './format.js'
export * from './i18n.js'
export * from './links.js'
export * from './media.js'
export * from './model.js'
export * from './quickstart.js'

// Input for the local consistency check; not published as a separate file.
export const sharedData = () => ({
  model, benchmarks, caseFacts, rdRecordings, larkScenarios,
  demoCategories, frontendDemos, links, downloads, serveSnippets, agentSnippets,
  citation: citationMeta,
})
