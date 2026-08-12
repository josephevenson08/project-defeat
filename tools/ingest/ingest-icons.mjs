// Maps every catalogued item and gem to its Wowhead icon *name*.
//
// Why this is a separate dataset from the icon images
// ---------------------------------------------------
// An icon name ("inv_sword_04") is factual metadata and comes from the same MIT-licensed wowsims/tbc
// tree, at the same pinned commit, as the item catalogue itself — `assets/item_data/
// all_item_tooltips.csv`, which carries a `"icon"` field for ~30,000 items. That is one request for
// the whole mapping, and it needs no Wowhead scraping at all.
//
// The icon *artwork* is a different question: it is Blizzard's, served from Wowhead's CDN, and
// whether to vendor it into this repo is a call for the repo's owner rather than something an
// ingest script should decide by downloading 2,000 JPEGs. So this script stops at the names. With
// the names committed, either choice stays open and neither is blocked on re-deriving this mapping.
//
// The earlier assumption that Wowhead could supply this in bulk is wrong and worth recording: its
// item listviews carry `displayid`, not an icon name, they cap out around 1,720 rows, and the
// category filters in the URL are applied client-side — `/tbc/items/head/quality:4` and
// `/tbc/items/quality:4` return byte-identical HTML.
//
// Run: node tools/ingest/ingest-icons.mjs
// Writes: src/domain/icons/icons.json

import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { registerHooks } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')

// The app's imports are extensionless because Vite resolves them; Node ESM will not.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context)
    } catch (err) {
      if (specifier.startsWith('.')) return nextResolve(`${specifier}.ts`, context)
      throw err
    }
  },
})

/** Same commit the item catalogue is pinned to, so the two datasets describe the same item set. */
const UPSTREAM_SHA = '3301fca59306a747e521274c36e073e69acc7b77'
const UPSTREAM_PATH = 'assets/item_data/all_item_tooltips.csv'
const UPSTREAM_URL = `https://raw.githubusercontent.com/wowsims/tbc/${UPSTREAM_SHA}/${UPSTREAM_PATH}`

const CACHE_PATH = resolve(HERE, `.cache/all_item_tooltips.${UPSTREAM_SHA.slice(0, 8)}.csv`)
const OUT_PATH = resolve(REPO, 'src/domain/icons/icons.json')

async function loadUpstream() {
  mkdirSync(dirname(CACHE_PATH), { recursive: true })
  if (existsSync(CACHE_PATH)) return readFileSync(CACHE_PATH, 'utf8')

  const res = await fetch(UPSTREAM_URL)
  if (!res.ok) throw new Error(`${UPSTREAM_PATH}: HTTP ${res.status}`)
  const text = await res.text()
  writeFileSync(CACHE_PATH, text)
  return text
}

const csv = await loadUpstream()

/*
 * The JSON column holds commas and escaped quotes, so this does not split on commas — it takes the
 * id up to the first one and reads the icon straight out of the rest of the row. Icon names never
 * contain a quote, which is what makes the narrow regex safe where a full JSON.parse of 30,000
 * tooltip blobs would be pure waste.
 */
const iconByWowItemId = new Map()
for (const line of csv.split('\n')) {
  const comma = line.indexOf(',')
  if (comma <= 0) continue
  const id = Number(line.slice(0, comma))
  if (!Number.isInteger(id)) continue
  const icon = line.match(/"icon":"([^"]+)"/)?.[1]
  if (icon) iconByWowItemId.set(id, icon)
}

/*
 * `allItems` rather than the catalogue JSON, deliberately. The catalogue file is 4,505 items but the
 * app renders 4,560: itemCatalogue.ts merges the ingested catalogue, the Wowhead-only supplement and
 * the curated provenance layer. Reading the JSON directly missed the merged-in entries — "Blessed
 * Book of Nagrand" reached the paperdoll with no icon, which the test caught. Sourcing the wanted
 * list from the same place the UI does is what keeps the two in step.
 */
const { allItems } = await import(pathToFileURL(resolve(REPO, 'src/domain/gear/itemCatalogue.ts')).href)
const gems = JSON.parse(readFileSync(resolve(REPO, 'src/domain/gems/gemCatalogue.json'), 'utf8'))

/** Everything the UI can put an icon on, as {wowItemId, label} pairs. */
const wanted = [
  ...allItems.map((item) => ({ id: item.wowItemId, label: item.name, kind: 'item' })),
  ...gems.gems.map((gem) => ({ id: gem.wowItemId, label: gem.name, kind: 'gem' })),
]

const icons = {}
const missing = []
const seen = new Set()
for (const entry of wanted) {
  if (!Number.isInteger(entry.id) || seen.has(entry.id)) continue
  seen.add(entry.id)
  const icon = iconByWowItemId.get(entry.id)
  if (icon) icons[entry.id] = icon
  else missing.push(`${entry.kind} ${entry.id} ${entry.label}`)
}

const distinct = new Set(Object.values(icons))

const payload = {
  $schema: 'wowsims-tbc icon-name ingestion',
  upstream: {
    repo: 'wowsims/tbc',
    sha: UPSTREAM_SHA,
    path: UPSTREAM_PATH,
    license: 'MIT',
    note: 'Icon names only. The icon artwork is Blizzard\'s and is not vendored here; see the header of tools/ingest/ingest-icons.mjs.',
  },
  generatedBy: 'tools/ingest/ingest-icons.mjs',
  mappedCount: Object.keys(icons).length,
  distinctIconCount: distinct.size,
  icons,
}

mkdirSync(dirname(OUT_PATH), { recursive: true })
const next = `${JSON.stringify(payload, null, 2)}\n`
const changed = !existsSync(OUT_PATH) || readFileSync(OUT_PATH, 'utf8') !== next
if (changed) writeFileSync(OUT_PATH, next)

console.log(`${seen.size} catalogued entries -> ${Object.keys(icons).length} mapped, ${distinct.size} distinct icons`)
console.log(`  unmapped: ${missing.length}`)
for (const entry of missing.slice(0, 12)) console.log(`    ${entry}`)
if (missing.length > 12) console.log(`    ...and ${missing.length - 12} more`)
console.log(changed ? `  wrote ${OUT_PATH}` : '  0 written (unchanged)')
