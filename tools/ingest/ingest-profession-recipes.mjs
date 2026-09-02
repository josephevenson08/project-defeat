// Extracts every crafting recipe for the nine crafting/secondary professions, from Wowhead.
//
// **Why this exists: the 1-300 climb is nine placeholder rows.** `sampleCraftingGuides.ts` carries
// real detail from 300-375 and, below that, one summary row per profession saying "see a dedicated
// vanilla guide". Filling it by hand would mean transcribing someone's guide, and
// `professionTypes.ts` records the standing decision that wow-professions.com's recipe orders are
// linked and never copied because they are that site's craft.
//
// **So this takes the same road the farming routes took: facts in, our own derivation out.** Wowhead
// publishes each recipe as plain data — what it makes, what it consumes, and the four skill points
// where it turns orange, yellow, green and grey:
//
//     {"id":2963,"name":"Bolt of Linen Cloth","learnedat":1,"colors":[1,25,37,50],
//      "reagents":[[2589,2]],"creates":[2996,1,1],"nskillup":1,"skill":[197]}
//
// A reagent list is a fact. A colour breakpoint is a fact. **The craft count is not published
// anywhere — it is computed from those**, which is what makes a levelling path derived rather than
// taken. `compute-leveling-paths.mjs` does that part; this script only fetches and records.
//
// Verified against a known guide before being trusted: Bolt of Linen Cloth lists two Linen Cloth per
// craft, and published guides quote 102 bolts for 204 cloth. The ratio matches exactly, which is the
// check that the reagent data means what it appears to mean.
//
// Run: node tools/ingest/ingest-profession-recipes.mjs [--refetch]
// Writes: tools/ingest/data/professionRecipes.json

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const CACHE = resolve(HERE, '.cache/profession-recipes')
/*
 * **Written outside `src/` deliberately.** This is 1.9 MB of raw recipe data — 2,079 recipes, most of
 * which no levelling path will ever name — and the app needs only the computed path. Putting it in
 * `src/domain` invites an import that would put the whole thing in the bundle, which is the mistake
 * `nodeSpawns.json` gets away with only because every one of its coordinates is drawn.
 *
 * Committed rather than cached, so the path computation is reproducible without re-fetching Wowhead.
 */
const OUT_PATH = resolve(HERE, 'data/professionRecipes.json')
const refetch = process.argv.includes('--refetch')

/**
 * The nine professions that craft, with the skill id Wowhead tags their recipes with.
 *
 * **The id is the assertion, and it earned its keep immediately.** Cooking and First Aid are not
 * under `professions/` — they are secondary skills and live under `secondary-skills/`. Requesting
 * the wrong path does not 404: Wowhead serves a generic "TBC Profession Spells" listing capped at
 * 1,000 rows, identical for both, full of Tailoring and Leatherworking. Without the skill id every
 * one of those would have been filed under Cooking. With it, all 1,000 were rejected and the run
 * said so.
 *
 * The path is recorded per profession rather than built from the name for that reason — the same
 * discipline `professionTypes.ts` applies to the wow-professions.com guide URLs, whose slugs are
 * inconsistent in exactly the same way.
 *
 * The four gathering professions are deliberately absent: they have nodes rather than recipes, which
 * is what `nodeSpawns.json` covers.
 */
const PROFESSIONS = [
  { name: 'Alchemy', path: 'professions/alchemy', skillId: 171 },
  { name: 'Blacksmithing', path: 'professions/blacksmithing', skillId: 164 },
  { name: 'Enchanting', path: 'professions/enchanting', skillId: 333 },
  { name: 'Engineering', path: 'professions/engineering', skillId: 202 },
  { name: 'Jewelcrafting', path: 'professions/jewelcrafting', skillId: 755 },
  { name: 'Leatherworking', path: 'professions/leatherworking', skillId: 165 },
  { name: 'Tailoring', path: 'professions/tailoring', skillId: 197 },
  { name: 'Cooking', path: 'secondary-skills/cooking', skillId: 185 },
  { name: 'First Aid', path: 'secondary-skills/first-aid', skillId: 129 },
]

/** Wowhead 403s once a run makes several rapid requests, so every fetch is cached and paced. */
const REQUEST_SPACING_MS = 1500
let lastFetchAt = 0

async function readListing(path) {
  mkdirSync(CACHE, { recursive: true })
  const cached = resolve(CACHE, `${path.replace('/', '-')}.html`)
  if (!refetch && existsSync(cached)) return readFileSync(cached, 'utf8')

  const wait = REQUEST_SPACING_MS - (Date.now() - lastFetchAt)
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastFetchAt = Date.now()

  const res = await fetch(`https://www.wowhead.com/tbc/spells/${path}`, {
    headers: { 'User-Agent': 'project-defeat-recipe-ingest' },
  })
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`)
  const text = await res.text()
  writeFileSync(cached, text)
  return text
}

/**
 * Pulls the `listviewspells` array out of the page.
 *
 * **Bracket matching rather than a regex**, because the array is 300 KB of nested JSON and a
 * non-greedy `\[.*?\]` stops at the first inner array — the first `reagents` entry, three recipes in.
 *
 * Wowhead emits it as JavaScript rather than JSON, so a few keys arrive unquoted (`quality:1`,
 * `popularity:6`). Those are requoted before parsing rather than tolerated, so a genuinely malformed
 * payload still fails.
 */
function parseListing(html, path) {
  const marker = html.indexOf('var listviewspells = ')
  if (marker < 0) throw new Error(`${path}: no listviewspells on the page`)

  const start = html.indexOf('[', marker)
  let depth = 0
  let end = -1
  for (let i = start; i < html.length; i += 1) {
    if (html[i] === '[') depth += 1
    else if (html[i] === ']') {
      depth -= 1
      if (depth === 0) {
        end = i
        break
      }
    }
  }
  if (end < 0) throw new Error(`${path}: listviewspells array never closed`)

  const raw = html.slice(start, end + 1).replace(/([,{])(\w+):/g, '$1"$2":')
  return JSON.parse(raw)
}

/** Item id -> name, from the same pinned wowsims CSV the icons come from. */
const UPSTREAM_SHA = '3301fca59306a747e521274c36e073e69acc7b77'
const CSV_PATH = resolve(HERE, `.cache/all_item_tooltips.${UPSTREAM_SHA.slice(0, 8)}.csv`)
const itemNames = new Map()
const itemIcons = new Map()
if (existsSync(CSV_PATH)) {
  for (const line of readFileSync(CSV_PATH, 'utf8').split('\n')) {
    const comma = line.indexOf(',')
    if (comma <= 0) continue
    const id = Number(line.slice(0, comma))
    if (!Number.isInteger(id)) continue
    const name = line.match(/"name":"([^"]+)"/)?.[1]
    const icon = line.match(/"icon":"([^"]+)"/)?.[1]
    if (name) itemNames.set(id, name)
    if (icon) itemIcons.set(id, icon)
  }
}
console.log(`item names available: ${itemNames.size}`)

const professions = {}
const unnamedReagents = new Set()

for (const { name, path, skillId } of PROFESSIONS) {
  const rows = parseListing(await readListing(path), path)

  /*
   * **A recipe is kept only if it can carry its own weight in a computed path**: it must belong to
   * this profession, know where it turns grey, and say what it consumes. The handful that fail are
   * counted rather than dropped silently — they are mostly enchanting's "apply to a vellum" entries
   * and a few unobtainable relics.
   */
  const usable = []
  let rejected = 0
  for (const row of rows) {
    const belongs = Array.isArray(row.skill) && row.skill.includes(skillId)
    const colors = Array.isArray(row.colors) && row.colors.length === 4 ? row.colors : null
    const reagents = Array.isArray(row.reagents) && row.reagents.length > 0 ? row.reagents : null
    if (!belongs || !colors || !reagents) {
      rejected += 1
      continue
    }

    for (const [itemId] of reagents) if (!itemNames.has(itemId)) unnamedReagents.add(itemId)

    usable.push({
      spellId: row.id,
      name: row.name,
      learnedAt: row.learnedat ?? colors[0],
      // [orange, yellow, green, grey] — the skill points where the craft changes colour.
      colors,
      skillUpsPerCraft: row.nskillup ?? 1,
      reagents: reagents.map(([itemId, quantity]) => ({
        itemId,
        quantity,
        name: itemNames.get(itemId) ?? `item ${itemId}`,
        ...(itemIcons.has(itemId) ? { icon: itemIcons.get(itemId) } : {}),
      })),
      ...(Array.isArray(row.creates)
        ? {
            creates: {
              itemId: row.creates[0],
              min: row.creates[1] ?? 1,
              max: row.creates[2] ?? row.creates[1] ?? 1,
              name: itemNames.get(row.creates[0]) ?? row.name,
              ...(itemIcons.has(row.creates[0]) ? { icon: itemIcons.get(row.creates[0]) } : {}),
            },
          }
        : {}),
      // Wowhead's source codes: 2 = trainer-taught, 5 = drop, 16 = vendor, 21 = quest.
      ...(Array.isArray(row.source) ? { source: row.source } : {}),
      ...(row.trainingcost ? { trainingCost: row.trainingcost } : {}),
    })
  }

  usable.sort((a, b) => a.learnedAt - b.learnedAt || a.name.localeCompare(b.name))
  professions[name] = usable
  console.log(`  ${name.padEnd(15)} ${String(usable.length).padStart(3)} usable, ${rejected} rejected`)

  /*
   * **Nothing usable means the wrong page, not an empty profession.** Every one of these nine has
   * recipes, so a zero here is the Cooking/First Aid failure recurring under a different name.
   */
  if (usable.length === 0) {
    console.error(`REFUSING TO WRITE — ${name} resolved no recipes from /tbc/spells/${path}.`)
    process.exit(1)
  }
}

if (unnamedReagents.size > 0) {
  console.log(`reagents with no name in the pinned CSV: ${unnamedReagents.size} (${[...unnamedReagents].slice(0, 8).join(', ')}…)`)
}

const total = Object.values(professions).reduce((sum, list) => sum + list.length, 0)
if (total === 0) {
  console.error('REFUSING TO WRITE — no recipes resolved at all. Wowhead may be rate-limiting (403).')
  process.exit(1)
}

mkdirSync(dirname(OUT_PATH), { recursive: true })
writeFileSync(
  OUT_PATH,
  `${JSON.stringify(
    {
      note: 'Generated by tools/ingest/ingest-profession-recipes.mjs. Do not edit by hand.',
      source: 'https://www.wowhead.com/tbc/spells/professions/<profession>',
      recipeCount: total,
      professions,
    },
    null,
    2,
  )}\n`,
)

console.log(`profession recipes: ${total} across ${Object.keys(professions).length} professions -> ${OUT_PATH.replace(REPO, '.')}`)
