// Gives raid loot entries a `wowItemId` when the item is real but not in this app's catalogue, so
// the loot table can draw its icon.
//
// `link-raid-loot.mjs` already links entries to the **catalogue** by name. This is the other half:
// 39 loot rows name something the catalogue will never hold — tier tokens, enchant formulas, mounts,
// attunement quest items — because the catalogue is equippable gear and these are not. They rendered
// a "??" glyph, which reads as a missing icon rather than as a thing with no gear stats.
//
// The names resolve against the **tooltip dump**, which covers 29,047 items rather than the
// catalogue's 4,505. That is the whole reason this can work at all: `Gloves of the Fallen Champion`
// is not equippable and so is not in `all_items.go`, but it is certainly an item with an icon.
//
// Same discipline as its sibling: link only where the name matches **exactly one** item, never touch
// an entry that already carries an id, and report the ambiguities rather than choosing. Magtheridon's
// Head is the one that matters — it is two items, 32385 and 32386, one per faction — and picking
// either would be inventing a fact about which raid the reader is in.
//
// Idempotent: a second run reports 0 linked.
//
// Run: node tools/ingest/link-raid-loot-ids.mjs [--dry]
// Rewrites: src/domain/raids/*Bosses.ts, src/domain/raids/sampleRaids.ts

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const dry = process.argv.includes('--dry')

const UPSTREAM_SHA = '3301fca59306a747e521274c36e073e69acc7b77'
const TOOLTIP_URL = `https://raw.githubusercontent.com/wowsims/tbc/${UPSTREAM_SHA}/assets/item_data/all_item_tooltips.csv`
const TOOLTIP_CACHE = resolve(HERE, `.cache/all_item_tooltips.${UPSTREAM_SHA.slice(0, 8)}.csv`)

const FILES = [
  'src/domain/raids/karazhanBosses.ts',
  'src/domain/raids/gruulsLairBosses.ts',
  'src/domain/raids/magtheridonsLairBosses.ts',
  'src/domain/raids/serpentshrineCavernBosses.ts',
  'src/domain/raids/tempestKeepBosses.ts',
  'src/domain/raids/sampleRaids.ts',
]

async function loadTooltips() {
  if (existsSync(TOOLTIP_CACHE)) return readFileSync(TOOLTIP_CACHE, 'utf8')

  const res = await fetch(TOOLTIP_URL)
  if (!res.ok) throw new Error(`${TOOLTIP_URL} -> HTTP ${res.status}`)
  const text = await res.text()
  mkdirSync(dirname(TOOLTIP_CACHE), { recursive: true })
  writeFileSync(TOOLTIP_CACHE, text)
  return text
}

const csv = await loadTooltips()

/*
 * Name -> ids. Read with a narrow regex rather than `JSON.parse` on 29,000 tooltip blobs, the same
 * way `ingest-icons.mjs` reads this file. Names can contain escaped quotes ("Vashj's" is fine, but
 * the column is JSON) so the pattern allows escapes and unescapes afterwards.
 */
const idsByName = new Map()
for (const line of csv.split('\n')) {
  const comma = line.indexOf(',')
  if (comma <= 0) continue
  const id = Number(line.slice(0, comma))
  if (!Number.isInteger(id)) continue
  const match = line.match(/"name":"((?:[^"\\]|\\.)*)"/)
  if (!match) continue
  const name = match[1].replace(/\\"/g, '"').toLowerCase()
  if (!idsByName.has(name)) idsByName.set(name, [])
  idsByName.get(name).push(id)
}
if (idsByName.size === 0) throw new Error('no item names parsed — the tooltip format may have moved')

const linked = []
const ambiguous = []
const notFound = []

for (const relative of FILES) {
  const path = resolve(REPO, relative)
  const before = readFileSync(path, 'utf8')

  // Innermost braced objects only, and only those carrying `dropType` — the same shape test the
  // sibling script uses, for the same reason: loot entries hold no nested braces.
  const after = before.replace(/\{[^{}]*\}/g, (block) => {
    if (!block.includes('dropType:')) return block
    // An entry with either id already resolves an icon; re-running must change nothing.
    if (/\bitemId:/.test(block) || /\bwowItemId:/.test(block)) return block

    const name = block.match(/\bname:\s*(['"])((?:\\.|(?!\1).)*)\1/)?.[2]
    if (!name) return block
    const unescaped = name.replace(/\\'/g, "'").replace(/\\"/g, '"')

    const ids = idsByName.get(unescaped.toLowerCase())
    if (!ids) {
      notFound.push(`${relative}: ${unescaped}`)
      return block
    }
    if (ids.length > 1) {
      ambiguous.push(`${relative}: "${unescaped}" matches ${ids.join(', ')}`)
      return block
    }

    linked.push(`${unescaped} -> ${ids[0]}`)
    return block.replace(/(\bname:)/, `wowItemId: ${ids[0]}, $1`)
  })

  if (after !== before && !dry) writeFileSync(path, after)
}

console.log(`${linked.length} loot entries given a wowItemId${dry ? ' (dry run, nothing written)' : ''}`)
for (const line of linked) console.log(`  ${line}`)

if (ambiguous.length > 0) {
  console.log(`\n${ambiguous.length} left alone — the name matches more than one item, and choosing would be a guess:`)
  for (const line of ambiguous) console.log(`  ${line}`)
}

if (notFound.length > 0) {
  console.log(`\n${notFound.length} left alone — no item of that name exists, so the row is not one item:`)
  for (const line of notFound) console.log(`  ${line}`)
}
