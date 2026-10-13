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
import { registerHooks } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const CACHE = resolve(HERE, '.cache/node-spawns')
const refetch = process.argv.includes('--refetch')

/**
 * Which zones a node keeps, and how many coordinates per zone. See the trimming note below.
 *
 * **Kept by share and by recommendation, not by rank** (since 2026-10-13, docs/design/MAPS-PLAN.md
 * Step B). The ingest used to keep each node's three busiest zones, which dropped zones a levelling
 * range recommends (every Blood Elf and Draenei starting zone, Felwood's herbs) and zones holding a
 * real share of a node (Felweed's Blade's Edge and Shadowmoon, 15% each). A zone now stays when it
 * is among the three busiest, holds at least `ZONE_SHARE` of the node's spawns, or is named by a
 * range whose skill window takes the node.
 */
const TOP_ZONES = 3
const ZONE_SHARE = 0.1
const MAX_COORDS = 320

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
const { gatheringGuides } = await import(pathToFileURL(resolve(REPO, 'src/domain/professions/gatheringGuides.ts')).href)

/** The zones a profession's ranges recommend for a node of this skill: the range windows `nodesForRange` uses. */
function recommendedZones(profession, requiredSkill) {
  const guide = gatheringGuides.find((candidate) => candidate.profession === profession)
  const zones = new Set()
  for (const range of guide?.ranges ?? []) {
    const [low, high] = range.skillRange
    const inWindow = requiredSkill >= low && (high >= 375 ? requiredSkill <= high : requiredSkill < high)
    if (inWindow) for (const zone of range.zones ?? []) zones.add(zone)
  }
  return zones
}

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
  { id: 142141, also: [176642], expect: "Arthas' Tears", profession: 'Herbalism', material: "Arthas' Tears" },
  { id: 142142, also: [176636], expect: 'Sungrass', profession: 'Herbalism', material: 'Sungrass' },
  { id: 142143, expect: 'Blindweed', profession: 'Herbalism', material: 'Blindweed' },
  { id: 176583, also: [176638], expect: 'Golden Sansam', profession: 'Herbalism', material: 'Golden Sansam' },
  { id: 176584, also: [176639], expect: 'Dreamfoil', profession: 'Herbalism', material: 'Dreamfoil' },
  { id: 176586, also: [176640], expect: 'Mountain Silversage', profession: 'Herbalism', material: 'Mountain Silversage' },
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
  // Added 2026-10-13 after the tbc-researcher confirmed each id, name, skill and zone (MAPS-PLAN.md Step B).
  // Bloodthistle grows only in Eversong Woods; any race can pick it, only Blood Elves can use it.
  { id: 181166, expect: 'Bloodthistle', profession: 'Herbalism', material: 'Bloodthistle' },
  { id: 142144, expect: 'Ghost Mushroom', profession: 'Herbalism', material: 'Ghost Mushroom' },
  { id: 142145, also: [176637], expect: 'Gromsblood', profession: 'Herbalism', material: 'Gromsblood' },
  { id: 176587, also: [176641], expect: 'Plaguebloom', profession: 'Herbalism', material: 'Plaguebloom' },
  // Mining, 1-300
  { id: 1731, expect: 'Copper Vein', profession: 'Mining', material: 'Copper Ore' },
  { id: 1732, expect: 'Tin Vein', profession: 'Mining', material: 'Tin Ore' },
  { id: 1733, expect: 'Silver Vein', profession: 'Mining', material: 'Silver Ore' },
  { id: 1734, also: [181109, 150080], expect: 'Gold Vein', profession: 'Mining', material: 'Gold Ore' },
  { id: 1735, expect: 'Iron Deposit', profession: 'Mining', material: 'Iron Ore' },
  { id: 2040, also: [176645, 150079], expect: 'Mithril Deposit', profession: 'Mining', material: 'Mithril Ore' },
  { id: 2047, also: [181108, 150081], expect: 'Truesilver Deposit', profession: 'Mining', material: 'Truesilver Ore' },
  { id: 324, also: [176643, 150082], expect: 'Small Thorium Vein', profession: 'Mining', material: 'Thorium Ore' },
  { id: 175404, expect: 'Rich Thorium Vein', profession: 'Mining', material: 'Thorium Ore' },
  // Added 2026-10-13 (MAPS-PLAN.md Step B). The two ooze-covered veins that matter, both mostly Silithus:
  // they share their ore and skill with Truesilver (230) and Rich Thorium (275), so a range's route takes
  // them in with those. Dark Iron is open-world in Burning Steppes and Searing Gorge; the levelling guides
  // route elsewhere, and the range says it is optional. The rest (ooze Silver, Gold, Mithril and Thorium,
  // Incendicite, Lesser Bloodstone, Indurium, Hakkari Thorium, Nethercite) are trivial, instance-only or
  // quest-gated, and left out on purpose.
  { id: 123309, expect: 'Ooze Covered Truesilver Deposit', profession: 'Mining', material: 'Truesilver Ore' },
  { id: 177388, expect: 'Ooze Covered Rich Thorium Vein', profession: 'Mining', material: 'Thorium Ore' },
  { id: 165658, expect: 'Dark Iron Deposit', profession: 'Mining', material: 'Dark Iron Ore' },
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
// Ragveil checked again on 2026-10-13 (MAPS-PLAN.md Step B): Wowhead's TBC page lists only the Slave
// Pens, the Steamvault and the Underbog, with no coordinates. Only the retail page has Zangarmarsh points,
// and the owner chose not to draw retail data on a TBC map.

/**
 * One object page, from the cache when there is one.
 *
 * **Only a 200 with a body counts as a page.** Since October 2026 Wowhead answers scripted requests
 * for object pages with a 202 and an empty body, which `res.ok` accepts; cached, that empty reply
 * read as a page with no spawn data on every later run. Wowhead's bot check is not worked around
 * here: when it refuses, the run fails and the committed data stays as it is (MAPS-PLAN.md Step B).
 */
async function readPage(id) {
  const cached = resolve(CACHE, `object-${id}.html`)
  if (!refetch && existsSync(cached)) {
    const text = readFileSync(cached, 'utf8')
    if (text.trim()) return text
  }
  const res = await fetch(`https://www.wowhead.com/tbc/object=${id}`, {
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; project-defeat ingest)' },
  })
  if (res.status !== 200) return undefined
  const text = await res.text()
  if (!text.trim()) return undefined
  mkdirSync(CACHE, { recursive: true })
  writeFileSync(cached, text)
  return text
}

/**
 * The gathering skill a node requires, which the page carries as "Requires Herbalism (205)". Wowhead's
 * tooltip endpoint carries the same line when a page is rendered without it, so it is read from there
 * as a fallback rather than guessed.
 */
async function readSkill(id, page) {
  const fromPage = /Requires (Herbalism|Mining) \((\d+)\)/.exec(page)
  if (fromPage) return fromPage
  const res = await fetch(`https://nether.wowhead.com/tbc/tooltip/object/${id}`, {
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; project-defeat ingest)' },
  })
  if (!res.ok) return undefined
  return /Requires (Herbalism|Mining) \((\d+)\)/.exec(await res.text())
}

/** One Wowhead object: its name, its skill and its zones, or the reason it was dropped. */
async function readObject(id, expect, profession) {
  const page = await readPage(id)
  if (!page) return { error: `${id}: page did not load` }

  // The name is read off the page rather than assumed, so a wrong candidate id names itself.
  const title = /<title>([^<]*)<\/title>/.exec(page)?.[1]?.split(' - ')[0]?.trim()
  const mapper = /g_mapperData = (\{.*?\});/s.exec(page)?.[1]
  if (!title || !mapper) return { error: `${id} (${expect}): no ${!title ? 'title' : 'spawn data'}` }

  // The declaration is the assertion: a wrong id names something else and fails here.
  if (title !== expect) return { error: `${id}: expected "${expect}" but Wowhead returned "${title}"` }

  /*
   * **The gathering skill the node requires.** Worth having for a reason beyond display: it is the
   * only sourced check on whether a range's written skill window is right, and it is what places a
   * node in a range at all. The profession in the pattern is the declared one, so a Herbalism node
   * that somehow returns a Mining requirement fails rather than recording a number from the wrong skill.
   */
  const skillMatch = await readSkill(id, page)
  if (!skillMatch || skillMatch[1] !== profession) {
    return { error: `${id} (${title}): expected a ${profession} requirement, found ${skillMatch?.[1] ?? 'nothing'}` }
  }

  let parsed
  try {
    parsed = JSON.parse(mapper)
  } catch {
    return { error: `${id} (${title}): mapper data did not parse` }
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
  if (zones.length === 0) return { error: `${id} (${title}): spawn data held no zones` }
  return { title, requiredSkill: Number(skillMatch[2]), zones }
}

const nodes = []
const skipped = []

for (const declared of NODES) {
  const { id, also = [], expect, profession, material } = declared
  const primary = await readObject(id, expect, profession)
  if (primary.error) {
    skipped.push(primary.error)
    continue
  }

  /*
   * **One node, several Wowhead objects.** Wowhead gives Felwood's and Blasted Lands' herbs and ores
   * object ids of their own (Felwood's Gromsblood is 176637, the rest of the world's 142145), with the
   * same name and skill. Read as one id, those zones were simply missing. Each extra id must return the
   * same name and the same skill as the main one, and its zones are merged in by name.
   */
  const byZone = new Map(primary.zones.map((zone) => [zone.zone, { ...zone, coords: [...zone.coords] }]))
  for (const extraId of also) {
    const extra = await readObject(extraId, expect, profession)
    if (extra.error) {
      skipped.push(`${extra.error} (an extra id for ${expect})`)
      continue
    }
    if (extra.requiredSkill !== primary.requiredSkill) {
      skipped.push(`${extraId} (${expect}): skill ${extra.requiredSkill} differs from ${id}'s ${primary.requiredSkill}`)
      continue
    }
    for (const zone of extra.zones) {
      const merged = byZone.get(zone.zone)
      if (merged) {
        merged.count += zone.count
        merged.coords.push(...zone.coords)
      } else {
        byZone.set(zone.zone, { ...zone, coords: [...zone.coords] })
      }
    }
  }

  // Biggest zone first: the one a farmer would actually pick.
  const zones = [...byZone.values()].sort((a, b) => b.count - a.count)
  const total = zones.reduce((sum, zone) => sum + zone.count, 0)
  const recommended = recommendedZones(profession, primary.requiredSkill)

  /*
   * **Trimmed for the bundle, and sampled rather than truncated.** Every zone of every node at full
   * precision is tens of thousands of coordinates for a picture, so only the zones worth riding are
   * kept (see `ZONE_SHARE`), and each is thinned to at most `MAX_COORDS`.
   *
   * The sampling stride matters: Wowhead returns coordinates sorted by x, so slicing the first N
   * would cut the eastern half off every zone and the density map would lie about where the nodes
   * are. Taking every k-th point preserves the shape.
   */
  const kept = zones
    .filter((zone, index) => index < TOP_ZONES || zone.count / total >= ZONE_SHARE || recommended.has(zone.zone))
    .map((zone) => {
      if (zone.coords.length <= MAX_COORDS) return zone
      const stride = zone.coords.length / MAX_COORDS
      const sampled = []
      for (let i = 0; i < MAX_COORDS; i += 1) sampled.push(zone.coords[Math.floor(i * stride)])
      return { ...zone, sampled: true, coords: sampled }
    })

  nodes.push({
    objectId: id,
    ...(also.length ? { alsoObjectIds: also } : {}),
    name: primary.title,
    profession,
    material,
    requiredSkill: primary.requiredSkill,
    totalSpawns: kept.reduce((sum, zone) => sum + zone.count, 0),
    zones: kept,
  })
}

if (nodes.length === 0) {
  console.error('REFUSING TO WRITE — no nodes resolved at all. Wowhead may be rate-limiting (403).')
  process.exit(1)
}

/*
 * **A partial run does not get written either.** A node whose page failed would simply vanish from
 * the data, and with it every range that derives from it, so the committed file stays as it is
 * unless every declared node resolved. An extra id that fails is reported but does not block: the
 * node still has its main zones.
 */
const failedNodes = NODES.length - nodes.length
if (failedNodes > 0) {
  console.error(`REFUSING TO WRITE — ${failedNodes} of ${NODES.length} declared nodes did not resolve:`)
  for (const s of skipped) console.error(`  - ${s}`)
  process.exit(1)
}

const out = {
  $schema: 'wowhead gathering-node spawn extraction',
  source: 'https://www.wowhead.com/tbc/object=<id> — g_mapperData',
  generatedBy: 'tools/ingest/ingest-node-spawns.mjs',
  fetchedAt: new Date().toISOString().slice(0, 10),
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
  console.log(`  ${n.name.padEnd(26)} skill ${String(n.requiredSkill).padStart(3)}  ${String(n.totalSpawns).padStart(5)} spawns  ${n.zones.length} zones  top: ${n.zones[0].zone}`)
}
if (skipped.length > 0) {
  console.log(`\n${skipped.length} candidate(s) dropped:`)
  for (const s of skipped) console.log(`  - ${s}`)
}
