// Extracts real gathering-node spawn coordinates from Wowhead, for the farming-route maps.
//
// **Why this is an ingest and not a copy.** `professionTypes.ts` records a standing decision that
// wow-professions.com's routes are "linked, never copied" — they are that site's work. This takes a
// different road to the same question: Wowhead publishes the **spawn coordinates** of every gathering
// node as plain data, and a route computed from those points is our own work rather than theirs.
// Blizzard's zone art cannot be vendored either, so nothing here draws a map — the node cloud *is*
// the picture, and the farmable shape of a zone emerges from where its nodes actually are.
//
// Wowhead embeds them as `g_mapperData`:
//
//     g_mapperData = {"3483":[{"count":245,"coords":[[10.9,54.4],...],"uiMapName":"Hellfire Peninsula"}]}
//
// Coordinates are percentages of the zone's own extent, which is what makes them drawable without a
// map underneath: 0-100 on each axis is the whole zone whatever its real size.
//
// **Every node is declared with the name Wowhead must return**, and a mismatch fails rather than
// passing quietly. A first pass swept a range of ids and kept whatever came back, which pulled in a
// Crumpled Map and two supply crates sitting between the herb ids. Declaring the expected name is
// the same discipline the talent-effect ingest uses for its extractors.
//
// Run: node tools/ingest/ingest-node-spawns.mjs [--refetch]
// Writes: src/domain/professions/nodeSpawns.json

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const CACHE = resolve(HERE, '.cache/node-spawns')
const refetch = process.argv.includes('--refetch')

/** Zones kept per node, and coordinates kept per zone. See the trimming note below. */
const MAX_ZONES = 3
const MAX_COORDS = 320

/**
 * The gathering nodes, **declared rather than guessed**, each with the name Wowhead must return.
 *
 * An earlier pass swept a range of candidate ids and kept whatever came back, which pulled in a
 * Crumpled Map, a Dalaran Crate and an Excavation Supply Crate — objects that sit between the herb
 * ids and are not gathering nodes at all. Declaring the expected name turns that from a silent pass
 * into a failure, the same discipline the talent-effect ingest uses for its extractors.
 *
 * `profession` and `material` are what join this to `sampleGatheringMaterials.ts`, which already
 * carries the skill range and character level for each material — so the map gets its "what level do
 * I stay here for" from data that was already sourced rather than from a second guess.
 */
const NODES = [
  // Herbalism, 1-300
  { id: 1617, expect: 'Silverleaf', profession: 'Herbalism', material: 'Silverleaf' },
  { id: 1618, expect: 'Peacebloom', profession: 'Herbalism', material: 'Peacebloom' },
  { id: 1619, expect: 'Earthroot', profession: 'Herbalism', material: 'Earthroot' },
  { id: 1620, expect: 'Mageroyal', profession: 'Herbalism', material: 'Mageroyal' },
  { id: 1621, expect: 'Briarthorn', profession: 'Herbalism', material: 'Briarthorn' },
  { id: 1622, expect: 'Bruiseweed', profession: 'Herbalism', material: 'Bruiseweed' },
  { id: 1623, expect: 'Wild Steelbloom', profession: 'Herbalism', material: 'Wild Steelbloom' },
  { id: 1624, expect: 'Kingsblood', profession: 'Herbalism', material: 'Kingsblood' },
  { id: 1628, expect: 'Grave Moss', profession: 'Herbalism', material: 'Grave Moss' },
  { id: 2041, expect: 'Liferoot', profession: 'Herbalism', material: 'Liferoot' },
  { id: 2042, expect: 'Fadeleaf', profession: 'Herbalism', material: 'Fadeleaf' },
  { id: 2043, expect: "Khadgar's Whisker", profession: 'Herbalism', material: "Khadgar's Whisker" },
  { id: 2044, expect: 'Wintersbite', profession: 'Herbalism', material: 'Wintersbite' },
  { id: 2045, expect: 'Stranglekelp', profession: 'Herbalism', material: 'Stranglekelp' },
  { id: 2046, expect: 'Goldthorn', profession: 'Herbalism', material: 'Goldthorn' },
  { id: 2866, expect: 'Firebloom', profession: 'Herbalism', material: 'Firebloom' },
  { id: 142140, expect: 'Purple Lotus', profession: 'Herbalism', material: 'Purple Lotus' },
  { id: 142141, expect: "Arthas' Tears", profession: 'Herbalism', material: "Arthas' Tears" },
  { id: 142142, expect: 'Sungrass', profession: 'Herbalism', material: 'Sungrass' },
  { id: 142143, expect: 'Blindweed', profession: 'Herbalism', material: 'Blindweed' },
  { id: 176583, expect: 'Golden Sansam', profession: 'Herbalism', material: 'Golden Sansam' },
  { id: 176584, expect: 'Dreamfoil', profession: 'Herbalism', material: 'Dreamfoil' },
  { id: 176586, expect: 'Mountain Silversage', profession: 'Herbalism', material: 'Mountain Silversage' },
  { id: 176588, expect: 'Icecap', profession: 'Herbalism', material: 'Icecap' },
  { id: 176589, expect: 'Black Lotus', profession: 'Herbalism', material: 'Black Lotus' },
  // Herbalism, 300-375
  { id: 181270, expect: 'Felweed', profession: 'Herbalism', material: 'Felweed' },
  { id: 181271, expect: 'Dreaming Glory', profession: 'Herbalism', material: 'Dreaming Glory' },
  { id: 181276, expect: 'Flame Cap', profession: 'Herbalism', material: 'Flame Cap' },
  { id: 181277, expect: 'Terocone', profession: 'Herbalism', material: 'Terocone' },
  { id: 181279, expect: 'Netherbloom', profession: 'Herbalism', material: 'Netherbloom' },
  { id: 181280, expect: 'Nightmare Vine', profession: 'Herbalism', material: 'Nightmare Vine' },
  { id: 181281, expect: 'Mana Thistle', profession: 'Herbalism', material: 'Mana Thistle' },
  // Mining, 1-300
  { id: 1731, expect: 'Copper Vein', profession: 'Mining', material: 'Copper Ore' },
  { id: 1732, expect: 'Tin Vein', profession: 'Mining', material: 'Tin Ore' },
  { id: 1733, expect: 'Silver Vein', profession: 'Mining', material: 'Silver Ore' },
  { id: 1734, expect: 'Gold Vein', profession: 'Mining', material: 'Gold Ore' },
  { id: 1735, expect: 'Iron Deposit', profession: 'Mining', material: 'Iron Ore' },
  { id: 2040, expect: 'Mithril Deposit', profession: 'Mining', material: 'Mithril Ore' },
  { id: 2047, expect: 'Truesilver Deposit', profession: 'Mining', material: 'Truesilver Ore' },
  { id: 324, expect: 'Small Thorium Vein', profession: 'Mining', material: 'Thorium Ore' },
  { id: 175404, expect: 'Rich Thorium Vein', profession: 'Mining', material: 'Thorium Ore' },
  // Mining, 300-375
  { id: 181555, expect: 'Fel Iron Deposit', profession: 'Mining', material: 'Fel Iron Ore' },
  { id: 181556, expect: 'Adamantite Deposit', profession: 'Mining', material: 'Adamantite Ore' },
  { id: 181569, expect: 'Rich Adamantite Deposit', profession: 'Mining', material: 'Adamantite Ore' },
  { id: 181557, expect: 'Khorium Vein', profession: 'Mining', material: 'Khorium Ore' },
]

/**
 * Two nodes Wowhead publishes **no** spawn data for, recorded so their absence reads as a known
 * fact rather than an oversight. Both return a literally empty `g_mapperData = []`, checked against
 * a live fetch rather than the cache: **Ragveil** (181275) and **Ancient Lichen** (181278). Both are
 * cave and instance spawns, which is the likeliest reason Wowhead's zone mapper holds nothing.
 */
const NO_SPAWN_DATA = [
  { id: 181275, name: 'Ragveil' },
  { id: 181278, name: 'Ancient Lichen' },
]

async function readPage(id) {
  const cached = resolve(CACHE, `object-${id}.html`)
  if (!refetch && existsSync(cached)) return readFileSync(cached, 'utf8')
  const res = await fetch(`https://www.wowhead.com/tbc/object=${id}`, {
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; project-defeat ingest)' },
  })
  if (!res.ok) return undefined
  const text = await res.text()
  mkdirSync(CACHE, { recursive: true })
  writeFileSync(cached, text)
  return text
}

const nodes = []
const skipped = []

for (const declared of NODES) {
  const { id, expect, profession, material } = declared
  const page = await readPage(id)
  if (!page) {
    skipped.push(`${id}: page did not load`)
    continue
  }

  // The name is read off the page rather than assumed, so a wrong candidate id names itself.
  const title = /<title>([^<]*)<\/title>/.exec(page)?.[1]?.split(' - ')[0]?.trim()
  const mapper = /g_mapperData = (\{.*?\});/s.exec(page)?.[1]
  if (!title || !mapper) {
    skipped.push(`${id} (${expect}): no ${!title ? 'title' : 'spawn data'}`)
    continue
  }

  // The declaration is the assertion: a wrong id names something else and fails here.
  if (title !== expect) {
    skipped.push(`${id}: expected "${expect}" but Wowhead returned "${title}"`)
    continue
  }

  let parsed
  try {
    parsed = JSON.parse(mapper)
  } catch {
    skipped.push(`${id} (${title}): mapper data did not parse`)
    continue
  }

  const zones = []
  for (const entries of Object.values(parsed)) {
    for (const entry of entries) {
      if (!entry?.uiMapName || !Array.isArray(entry.coords) || entry.coords.length === 0) continue
      zones.push({
        zone: entry.uiMapName,
        count: entry.coords.length,
        // Rounded to one decimal, which is the precision Wowhead itself publishes.
        coords: entry.coords.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]),
      })
    }
  }

  if (zones.length === 0) {
    skipped.push(`${id} (${title}): spawn data held no zones`)
    continue
  }

  // Biggest zone first: the one a farmer would actually pick.
  zones.sort((a, b) => b.count - a.count)

  /*
   * **Trimmed for the bundle, and sampled rather than truncated.** All 45 nodes at full precision is
   * 33,601 coordinates and 2.3 MB, which is a lot to parse on load for a picture. Only the zones a
   * farmer would actually choose are kept, and each is thinned to at most `MAX_COORDS`.
   *
   * The sampling stride matters: Wowhead returns coordinates sorted by x, so slicing the first N
   * would cut the eastern half off every zone and the density map would lie about where the nodes
   * are. Taking every k-th point preserves the shape.
   */
  const trimmed = zones.slice(0, MAX_ZONES).map((zone) => {
    if (zone.coords.length <= MAX_COORDS) return zone
    const stride = zone.coords.length / MAX_COORDS
    const sampled = []
    for (let i = 0; i < MAX_COORDS; i += 1) sampled.push(zone.coords[Math.floor(i * stride)])
    return { ...zone, sampled: true, coords: sampled }
  })
  zones.length = 0
  zones.push(...trimmed)
  nodes.push({ objectId: id, name: title, profession, material, totalSpawns: zones.reduce((s, z) => s + z.count, 0), zones })
}

if (nodes.length === 0) {
  console.error('REFUSING TO WRITE — no nodes resolved at all. Wowhead may be rate-limiting (403).')
  process.exit(1)
}

const out = {
  $schema: 'wowhead gathering-node spawn extraction',
  source: 'https://www.wowhead.com/tbc/object=<id> — g_mapperData',
  generatedBy: 'tools/ingest/ingest-node-spawns.mjs',
  note: 'Coordinates are percentages of each zone extent, 0-100 on both axes, as Wowhead publishes them.',
  nodeCount: nodes.length,
  nodes: nodes.sort((a, b) => a.name.localeCompare(b.name)),
  /** Declared nodes Wowhead publishes no zone spawns for, so the absence reads as known. */
  noSpawnData: NO_SPAWN_DATA,
}

const target = resolve(REPO, 'src/domain/professions/nodeSpawns.json')
const next = `${JSON.stringify(out, null, 2)}\n`
const previous = existsSync(target) ? readFileSync(target, 'utf8') : ''
if (previous === next) {
  console.log(`node spawns: ${nodes.length} nodes, 0 written (unchanged)`)
} else {
  writeFileSync(target, next)
  console.log(`node spawns: ${nodes.length} nodes written to src/domain/professions/nodeSpawns.json`)
}

for (const n of nodes) {
  console.log(`  ${n.name.padEnd(26)} ${String(n.totalSpawns).padStart(5)} spawns  ${n.zones.length} zones  top: ${n.zones[0].zone}`)
}
if (skipped.length > 0) {
  console.log(`\n${skipped.length} candidate(s) dropped:`)
  for (const s of skipped) console.log(`  - ${s}`)
}
