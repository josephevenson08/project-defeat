// Shared fetch/unescape helpers for the BiS guide scripts.
//
// Kept separate so importing them does not drag in another script's top-level report as a side
// effect — which is exactly what happened when the ingester imported the discovery pass.

import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { GUIDE_BASE } from './bis-guides.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const CACHE = resolve(HERE, '.cache/bis')

/**
 * Wowhead renders these guides client-side, but the source markup is already in the served HTML as
 * escaped BBCode inside the page's JSON payload. Unescaping the document wholesale is enough to parse
 * it — the BBCode tags are distinctive and nothing else in the page looks like them.
 */
export function unescapePage(raw) {
  return raw.replaceAll('\\/', '/').replaceAll('\\"', '"').replaceAll('\\r\\n', '\n').replaceAll('\\n', '\n')
}

/** Fetches a guide, caching to disk so re-runs and re-parses do not re-hit the site. */
export async function fetchGuide(path) {
  mkdirSync(CACHE, { recursive: true })
  const file = resolve(CACHE, `${path.replaceAll('/', '_')}.html`)
  if (existsSync(file)) return readFileSync(file, 'utf8')

  const res = await fetch(GUIDE_BASE + path, { headers: { 'User-Agent': 'project-defeat-bis-ingest' } })
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`)
  const text = await res.text()
  writeFileSync(file, text)
  await new Promise((r) => setTimeout(r, 400))
  return text
}
