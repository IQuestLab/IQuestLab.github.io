// Guards the v2 page against hand-typed numbers, so every figure keeps coming from src/shared:
//   1. No value from sharedData() may appear literally in v2 text (copy strings, JSX text).
//   2. copy.jsx string literals may only contain digits inside ${…} (plus a short allowlist).
//   3. Consistency checks on the shared data itself.
// Run directly (`node scripts/check-v2-numbers.mjs`) or through the build (vite.config.js).
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parse } from '@babel/parser'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const V2 = join(ROOT, 'src/v2')

// Digits that are words, not data.
const ALLOW = [
  'IQuest-Q1', // the model name
  'LiveCodeBench v6', 'release_v6', 'pass@1', // benchmark and metric names
  '1970', '1980', 'of 0 (', '为 0（', // the zipfile timestamp story in case 3
  'v1', 'v2', // API and page-version names
]

function files(dir) {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : /\.(jsx?|mjs)$/.test(name) ? [path] : []
  })
}

// Collects string literals / template quasis and JSX text with their line numbers.
function texts(source, path) {
  const ast = parse(source, { sourceType: 'module', plugins: ['jsx'], errorRecovery: true })
  const out = []
  const visit = (node, parent) => {
    if (!node || typeof node.type !== 'string') return
    // Strings written directly as JSX children render as text, like JSXText.
    const rendered = parent && parent.type === 'JSXExpressionContainer' && parent.__jsxChild
    if (node.type === 'StringLiteral' && !(parent && (parent.type === 'ImportDeclaration' || parent.type === 'ExportNamedDeclaration' || parent.type === 'ExportAllDeclaration' || parent.type === 'JSXAttribute'))) {
      out.push({ kind: rendered ? 'jsx' : 'string', value: node.value, line: node.loc.start.line })
    } else if (node.type === 'TemplateLiteral' && rendered) {
      node.quasis.forEach(q => out.push({ kind: 'jsx', value: q.value.cooked ?? q.value.raw, line: q.loc.start.line }))
      return
    } else if (node.type === 'TemplateElement') {
      out.push({ kind: 'string', value: node.value.cooked ?? node.value.raw, line: node.loc.start.line })
    } else if (node.type === 'JSXText') {
      if (node.value.trim()) out.push({ kind: 'jsx', value: node.value, line: node.loc.start.line })
    }
    if (node.type === 'JSXElement' || node.type === 'JSXFragment') {
      node.children.forEach(child => { if (child.type === 'JSXExpressionContainer') child.__jsxChild = true })
    }
    for (const key of Object.keys(node)) {
      if (key === 'loc' || key === 'start' || key === 'end' || key === '__jsxChild') continue
      const child = node[key]
      if (Array.isArray(child)) child.forEach(c => visit(c, node))
      else if (child && typeof child.type === 'string') visit(child, node)
    }
  }
  visit(ast.program, null)
  return out.map(t => ({ ...t, path }))
}

export async function checkV2Numbers() {
  const shared = await import(pathToFileURL(join(ROOT, 'src/shared/index.js')).href)
  const data = shared.sharedData()
  const errors = []

  // Names and ids that happen to contain digits (NL2Repo, GPT-5.6 Sol, case-1) are identifiers,
  // not figures: they may be written by hand and are not guarded as values.
  const { benchmarks: bm, model: md } = shared
  const names = [
    ...bm.models, ...bm.rows.map(r => r.name),
    ...[...shared.rdRecordings, ...shared.larkScenarios, ...shared.frontendDemos].map(i => i.id),
    md.name,
  ].filter(n => /\d/.test(n))
  const allow = [...ALLOW, ...names].sort((a, b) => b.length - a.length)

  // Shared values worth guarding: numbers with two or more digits, and short strings with digits.
  const values = new Set()
  const collect = v => {
    if (typeof v === 'number' && Number.isFinite(v) && String(v).replace(/\D/g, '').length >= 2) values.add(String(v))
    else if (typeof v === 'string' && v.length >= 2 && v.length <= 24 && /\d/.test(v) && !allow.includes(v)) values.add(v)
    else if (Array.isArray(v)) v.forEach(collect)
    else if (v && typeof v === 'object') Object.values(v).forEach(collect)
  }
  collect(data)
  const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = [...values].map(v => ({ v, re: new RegExp(`(?<![\\d.])${escape(v)}(?![\\d.])`) }))

  for (const path of files(V2)) {
    const rel = relative(ROOT, path)
    const isCopy = path.endsWith('copy.jsx')
    for (const t of texts(readFileSync(path, 'utf8'), rel)) {
      if (t.kind === 'string' && !isCopy) continue // component strings are class names, keys, geometry
      let text = t.value
      for (const a of allow) text = text.split(a).join(' ')
      for (const { v, re } of patterns) {
        if (re.test(text)) errors.push(`${rel}:${t.line} contains the shared value "${v}" typed by hand; interpolate it from src/shared`)
      }
      if (isCopy && /\d/.test(text)) errors.push(`${rel}:${t.line} has a digit outside \${…}: "${t.value.trim().slice(0, 60)}"`)
    }
  }

  // Data consistency.
  const { benchmarks, rdRecordings, larkScenarios, frontendDemos } = shared
  benchmarks.rows.forEach(r => { if (r.scores.length !== benchmarks.models.length) errors.push(`benchmarks: ${r.name} has ${r.scores.length} scores for ${benchmarks.models.length} models`) })
  const ids = [...rdRecordings, ...larkScenarios, ...frontendDemos].map(i => i.id)
  ids.filter((id, i) => ids.indexOf(id) !== i).forEach(id => errors.push(`ids: "${id}" is used twice`))
  frontendDemos.forEach(d => { if (!d.demo) errors.push(`frontendDemos: ${d.id} needs a demo`) })
  ;[...rdRecordings, ...larkScenarios.flatMap(s => s.recordings || []), ...frontendDemos].forEach(i => { if (i.video && !i.size) errors.push(`${i.id}: video without size`) })

  return errors
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const errors = await checkV2Numbers()
  if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
  console.log('v2 number guard: ok')
}
