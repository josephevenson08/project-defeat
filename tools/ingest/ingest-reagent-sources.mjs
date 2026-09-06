// Records how each crafting reagent is obtained, so a levelling path can tell buying from farming.
//
// **The cost metric counts items, and not all items cost the same to get.** `compute-leveling-paths`
// ranks recipes by reagent count, which treats one Coarse Thread — infinite at a vendor for ten
// copper — as equal to one Primal Might. That is the known limitation printed on the page, and this
// is the sourced half of fixing it.
//
// **What this deliberately does not do is price anything by auction.** Wowhead's XML carries
// `avgbuyout`, which is realm-specific, moves weekly, and would be exactly the kind of plausible
// unverifiable number this repo has spent its history removing. It is ignored.
//
// The discriminator, and why the obvious ones are wrong
// ----------------------------------------------------
// Three signals were tried against known items before this one was kept:
//
//   "sold by NPCs" in the page description — fires for Linen Cloth and Peacebloom, which are farmed.
//   buyprice > 0                          — same, plus Mote of Air at 16 silver.
//   source contains 5                     — same again.
//
// All three are true of any item *some* vendor stocks, including three-at-a-time limited stock. What
// separates a reagent-vendor staple from a farmed good is that a vendor is the **only** way to get
// it, and that reads as `"source":[5]` with nothing else in the list:
//
//   Coarse Thread  [5]           Netherweave Cloth [2,16]      Bolt of Linen Cloth [1,2,5]
//   Rune Thread    [5]           Golden Draenite   [2,19]      Felweed             [2,5,17]
//
// Verified across ten known items in both directions. 1 is crafted, 2 is dropped, 5 is vendor; every
// farmed or crafted reagent carries a 1 or a 2, so an exact [5] is unambiguous.
//
// For those, `buyprice` is a fixed game constant rather than a market price — Coarse Thread is ten
// copper on every realm, forever — so it is a real number this repo is allowed to keep.
//
// Run: node tools/ingest/ingest-reagent-sources.mjs [--refetch]
// Writes: tools/ingest/data/reagentSources.json

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const CACHE = resolve(HERE, '.cache/reagent-sources')
const IN_PATH = resolve(HERE, 'data/professionRecipes.json')
const OUT_PATH = resolve(HERE, 'data/reagentSources.json')
const refetch = process.argv.includes('--refetch')

/** Wowhead 403s once a run makes several rapid requests, so every fetch is cached and paced. */
const REQUEST_SPACING_MS = 1400
let lastFetchAt = 0

/** Wowhead's item source codes, confirmed against known items in both directions. */
const SOURCE_VENDOR = 5

async function readItemXml(itemId) {
  mkdirSync(CACHE, { recursive: true })
  const cached = resolve(CACHE, `${itemId}.xml`)
  if (!refetch && existsSync(cached)) return readFileSync(cached, 'utf8')

  const wait = REQUEST_SPACING_MS - (Date.now() - lastFetchAt)
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastFetchAt = Date.now()

  const res = await fetch(`https://www.wowhead.com/tbc/item=${itemId}&xml`, {
    headers: { 'User-Agent': 'project-defeat-reagent-ingest' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  if (!text.includes('<wowhead>')) throw new Error('response was not the XML endpoint')
  writeFileSync(cached, text)
  return text
}

function parseItem(xml) {
  const json = /<json><!\[CDATA\[([\s\S]*?)\]\]><\/json>/.exec(xml)?.[1] ?? ''
  const jsonEquip = /<jsonEquip><!\[CDATA\[([\s\S]*?)\]\]><\/jsonEquip>/.exec(xml)?.[1] ?? ''
  const rawSources = /"source":\[([0-9,]*)\]/.exec(json)?.[1]
  if (rawSources === undefined) return null

  const sources = rawSources === '' ? [] : rawSources.split(',').map(Number)
  return {
    sources,
    // Vendor-only, which is the claim that matters. See the header for why "has a vendor" is not it.
    vendorOnly: sources.length === 1 && sources[0] === SOURCE_VENDOR,
    buyPriceCopper: Number(/"buyprice":(\d+)/.exec(jsonEquip)?.[1] ?? 0),
  }
}

const { professions } = JSON.parse(readFileSync(IN_PATH, 'utf8'))

/** Every reagent any recipe consumes — not only the ones today's paths surface, since the weighting decides which path is chosen. */
const reagents = new Map()
for (const recipes of Object.values(professions)) {
  for (const recipe of recipes) {
    for (const reagent of recipe.reagents) reagents.set(reagent.itemId, reagent.name)
  }
}

console.log(`${reagents.size} distinct reagents to resolve`)

const items = {}
const failed = []
let done = 0

for (const [itemId, name] of [...reagents.entries()].sort((a, b) => a[0] - b[0])) {
  try {
    const parsed = parseItem(await readItemXml(itemId))
    if (!parsed) throw new Error('no source list in the XML')
    items[itemId] = { name, ...parsed }
  } catch (err) {
    failed.push(`${itemId} (${name}): ${err.message}`)
  }
  done += 1
  if (done % 100 === 0) console.log(`  ${done}/${reagents.size}`)
}

if (Object.keys(items).length === 0) {
  console.error('REFUSING TO WRITE — nothing resolved. Wowhead may be rate-limiting (403).')
  process.exit(1)
}

const vendorOnly = Object.values(items).filter((item) => item.vendorOnly)

writeFileSync(
  OUT_PATH,
  `${JSON.stringify(
    {
      note: 'Generated by tools/ingest/ingest-reagent-sources.mjs. Do not edit by hand.',
      source: 'https://www.wowhead.com/tbc/item=<id>&xml',
      rule: 'vendorOnly is source === [5] exactly. An item some vendor merely stocks (Linen Cloth, Peacebloom) also lists a drop or gather source and is not vendor-only. buyPriceCopper is a fixed game constant, never an auction price.',
      resolved: Object.keys(items).length,
      vendorOnlyCount: vendorOnly.length,
      /** Reagents the endpoint had no source list for, named so a gap is visible rather than counted. */
      unresolved: failed.map((line) => line.split(' (')[0]),
      items,
    },
    null,
    2,
  )}\n`,
)

console.log(`resolved ${Object.keys(items).length}, ${failed.length} failed`)
console.log(`vendor-only reagents: ${vendorOnly.length}`)
console.log(`  e.g. ${vendorOnly.slice(0, 6).map((item) => `${item.name} (${item.buyPriceCopper}c)`).join(', ')}`)
if (failed.length > 0) console.log(`failures:\n  ${failed.slice(0, 10).join('\n  ')}`)
console.log(`wrote ${OUT_PATH.replace(REPO, '.')}`)
