// Ingests raid consumables — flasks, battle and guardian elixirs, and food.
//
// Two sources, each doing what it is good at:
//
//   * **Stats** come from wowsims `sim/core/consumes.go`, the same pinned commit as the items, gems
//     and enchants. These are the numbers the sim itself runs on.
//   * **Names and item ids** come from Wowhead's search suggestions endpoint, because wowsims only
//     carries protobuf enum names. Transforming `FoodFishermansFeast` into a display name loses the
//     apostrophe, and this project has already been bitten twice by names that looked right and were
//     not ("Cataclysm Headguard", "The Nexus-Key"). The enum name is used only as a search key; the
//     name that ships is whatever Wowhead calls it.
//
// Roles are derived from the stats rather than assigned by hand: a flask granting attack power serves
// physical damage, spell power serves casters, healing power serves healers, and defensive stats serve
// tanks. That is the same "derive it" move the armor formula made, and it avoids inventing a per-spec
// opinion the source does not contain.
//
// Run: node tools/ingest/ingest-consumables.mjs [--discover]
// Writes: src/domain/consumables/consumableCatalogue.json

import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const CACHE = resolve(HERE, '.cache')
const OUT_PATH = resolve(REPO, 'src/domain/consumables/consumableCatalogue.json')

const UPSTREAM_SHA = '3301fca59306a747e521274c36e073e69acc7b77'
const CONSUMES_URL = `https://raw.githubusercontent.com/wowsims/tbc/${UPSTREAM_SHA}/sim/core/consumes.go`

/** wowsims enum prefix -> this repo's ConsumableCategory. */
const CATEGORY_BY_PREFIX = {
  Flask: 'Flask',
  BattleElixir: 'Battle Elixir',
  GuardianElixir: 'Guardian Elixir',
  Food: 'Food',
}

const STAT_MAP = {
  Strength: 'strength',
  Agility: 'agility',
  Stamina: 'stamina',
  Intellect: 'intellect',
  Spirit: 'spirit',
  AttackPower: 'attackPower',
  RangedAttackPower: 'rangedAttackPower',
  FeralAttackPower: 'feralAttackPower',
  SpellPower: 'spellPower',
  HealingPower: 'healingPower',
  MeleeHit: 'hitRating',
  SpellHit: 'spellHitRating',
  MeleeCrit: 'critRating',
  SpellCrit: 'spellCritRating',
  MeleeHaste: 'hasteRating',
  SpellHaste: 'spellHasteRating',
  Expertise: 'expertiseRating',
  ArmorPenetration: 'armorPenetration',
  Defense: 'defenseRating',
  Dodge: 'dodgeRating',
  Parry: 'parryRating',
  Block: 'blockRating',
  BlockValue: 'blockValue',
  Resilience: 'resilienceRating',
  Armor: 'armor',
  MP5: 'mp5',
}

/**
 * Which roles a consumable is a reasonable pick for, decided by the stats it actually grants.
 *
 * Deliberately generous: a stat that serves two roles marks both. The alternative is a hand-written
 * per-spec opinion, which is the kind of plausible-looking invention that made the old catalogue
 * untrustworthy.
 */
const ROLE_BY_STAT = {
  strength: ['Physical DPS', 'Tank'],
  agility: ['Physical DPS', 'Tank'],
  attackPower: ['Physical DPS', 'Tank'],
  rangedAttackPower: ['Physical DPS'],
  feralAttackPower: ['Physical DPS', 'Tank'],
  critRating: ['Physical DPS', 'Tank'],
  hitRating: ['Physical DPS', 'Tank'],
  hasteRating: ['Physical DPS'],
  expertiseRating: ['Physical DPS', 'Tank'],
  armorPenetration: ['Physical DPS'],

  spellPower: ['Caster DPS'],
  spellCritRating: ['Caster DPS', 'Healer'],
  spellHitRating: ['Caster DPS'],
  spellHasteRating: ['Caster DPS', 'Healer'],
  healingPower: ['Healer'],
  mp5: ['Healer'],
  intellect: ['Caster DPS', 'Healer'],
  spirit: ['Caster DPS', 'Healer'],

  armor: ['Tank'],
  defenseRating: ['Tank'],
  dodgeRating: ['Tank'],
  parryRating: ['Tank'],
  blockRating: ['Tank'],
  blockValue: ['Tank'],
  resilienceRating: ['Tank'],
}

/**
 * `FlaskOfRelentlessAssault` -> `Flask of Relentless Assault`. Only ever used as a search key; the
 * name that ships comes back from Wowhead.
 *
 * The enum names already carry their own descriptive word — `FlaskOf…`, `ElixirOf…` — so nothing is
 * stripped except the `Food` tag, which is a category marker rather than part of the dish's name.
 */
function enumToSearchName(enumName, prefix) {
  const bare = prefix === 'Food' ? enumName.replace(/^Food/, '') : enumName
  return bare
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\b(Of|The|And|To|In)\b/g, (word) => word.toLowerCase())
    .trim()
}

/**
 * Enum names whose camel-case split does not match what the item is really called.
 *
 * `ElixirOfMajorFirePower` splits to "Fire Power", but the item is "Elixir of Major Firepower" — one
 * word. Exactly the sort of near-miss the Wowhead lookup exists to catch, so it is recorded here
 * rather than papered over by loosening the search.
 */
const SEARCH_OVERRIDES = {
  ElixirOfMajorFirePower: 'Elixir of Major Firepower',
}

function slugify(name) {
  return name.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

async function fetchConsumes() {
  mkdirSync(CACHE, { recursive: true })
  const file = resolve(CACHE, `consumes.${UPSTREAM_SHA.slice(0, 8)}.go`)
  if (existsSync(file)) return readFileSync(file, 'utf8')
  const res = await fetch(CONSUMES_URL)
  if (!res.ok) throw new Error(`consumes.go: HTTP ${res.status}`)
  const text = await res.text()
  writeFileSync(file, text)
  return text
}

/** Resolves a display name to Wowhead's canonical item, so apostrophes and wording come from them. */
async function resolveOnWowhead(searchName) {
  mkdirSync(resolve(CACHE, 'consumables'), { recursive: true })
  const file = resolve(CACHE, 'consumables', `${slugify(searchName)}.json`)
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'))

  const url = `https://www.wowhead.com/tbc/search/suggestions-template?q=${encodeURIComponent(searchName)}`
  const res = await fetch(url, { headers: { 'User-Agent': 'project-defeat-consumable-ingest' } })
  if (!res.ok) throw new Error(`${searchName}: HTTP ${res.status}`)
  const body = await res.json()
  writeFileSync(file, JSON.stringify(body))
  await new Promise((r) => setTimeout(r, 350))
  return body
}

const source = await fetchConsumes()

// Each entry is a `case proto.<Prefix>_<Name>:` followed by one or more AddStats blocks. Capturing to
// the next `case` keeps a consumable's stats from bleeding into its neighbour's.
const caseRe = /case proto\.(Flask|BattleElixir|GuardianElixir|Food)_(\w+):([\s\S]*?)(?=\n\s*case proto\.|\n\s*\}\n)/g

const parsed = new Map()
for (const match of source.matchAll(caseRe)) {
  const [, prefix, enumName, body] = match
  if (enumName.endsWith('Unknown')) continue

  const stats = {}
  const extra = {}
  for (const block of body.matchAll(/AddStats\(stats\.Stats\{([\s\S]*?)\}\)/g)) {
    for (const stat of block[1].matchAll(/stats\.(\w+):\s*(-?[\d.]+)/g)) {
      const value = Number(stat[2])
      if (value === 0) continue
      const mapped = STAT_MAP[stat[1]]
      // School-specific spell power and resistances have no StatBlock field, exactly as in the item
      // and gem ingestions. Several elixirs are *entirely* school-specific — Elixir of Major Fire
      // Power grants nothing else — so dropping these would leave them looking like empty entries.
      if (mapped) stats[mapped] = (stats[mapped] ?? 0) + value
      else extra[stat[1]] = (extra[stat[1]] ?? 0) + value
    }
  }

  // Later phases re-declare a few consumables; keep the first, which is the base definition.
  const key = `${prefix}_${enumName}`
  if (!parsed.has(key)) parsed.set(key, { prefix, enumName, stats, extra })
}

const discover = process.argv.includes('--discover')
if (discover) {
  process.stdout.write(`parsed ${parsed.size} consumables\n`)
  for (const { prefix, enumName, stats, extra } of parsed.values()) {
    const extraText = Object.keys(extra).length ? ` + ${JSON.stringify(extra)}` : ''
    process.stdout.write(
      `  ${CATEGORY_BY_PREFIX[prefix].padEnd(16)} ${enumToSearchName(enumName, prefix).padEnd(34)} ${JSON.stringify(stats)}${extraText}\n`,
    )
  }
  process.exit(0)
}

const consumables = []
const problems = []
const corrections = []

for (const { prefix, enumName, stats, extra } of parsed.values()) {
  const searchName = SEARCH_OVERRIDES[enumName] ?? enumToSearchName(enumName, prefix)

  let resolved
  try {
    resolved = await resolveOnWowhead(searchName)
  } catch (err) {
    problems.push(`${searchName}: ${err.message}`)
    continue
  }

  // An exact name match wins over the first item result. Searching for a consumable also turns up its
  // crafting recipe ("Recipe: Elixir of Major Firepower"), which is a different item entirely and
  // sorts first for some queries.
  const items = (resolved.results ?? []).filter((r) => r.typeName === 'Item')
  const hit = items.find((r) => r.name.toLowerCase() === searchName.toLowerCase()) ?? items[0]
  if (!hit) {
    problems.push(`${searchName}: no Wowhead item match`)
    continue
  }
  // Not a failure: this is the lookup doing its job. The enum-derived name cannot carry an
  // apostrophe, so "Adepts Elixir" resolving to "Adept's Elixir" is the correction being applied.
  if (hit.name.toLowerCase() !== searchName.toLowerCase()) {
    corrections.push(`${searchName} -> "${hit.name}" (${hit.id})`)
  }

  /**
   * Stamina and health belong to no role, because they belong to all of them. Deriving "tank" from
   * stamina hid Fisherman's Feast — a plain stamina food every spec in the game eats — from every
   * damage dealer. A consumable whose *biggest* gain is stamina or health is offered to everyone,
   * which is what an empty `roles` means downstream.
   *
   * Two guards, both from entries that got this wrong:
   *
   *   * Only a positive gain counts. Fel Strength Elixir trades 10 stamina for 90 attack power, and
   *     reading the penalty as universality made it everyone's elixir instead of a melee one.
   *   * A stat only tanks want — defence, dodge, parry, block, resilience, armor — settles the
   *     question outright. Flask of Fortification is 500 health and 10 defence; the health is bigger,
   *     but the defence is what makes it the tank flask.
   */
  const TANK_ONLY = ['defenseRating', 'dodgeRating', 'parryRating', 'blockRating', 'blockValue', 'resilienceRating', 'armor']
  const hasTankOnlyStat = TANK_ONLY.some((stat) => (stats[stat] ?? 0) > 0)

  const positives = Object.entries({ ...stats, ...(extra.Health ? { stamina: extra.Health } : {}) }).filter(([, v]) => v > 0)
  const biggest = positives.reduce((best, entry) => (entry[1] > best[1] ? entry : best), ['', 0])
  const isUniversal = !hasTankOnlyStat && biggest[0] === 'stamina'

  /**
   * Spirit only decides a role when it is the biggest thing on offer.
   *
   * Every TBC raid food carries a flat +20 spirit rider on top of its real stat, so counting spirit
   * unconditionally put Ravager Dog — a 40 attack power melee food — in the caster and healer lists
   * alongside the melee one. Where spirit *is* the headline, as on a mana-regen elixir, it still counts.
   */
  const biggestNonSpirit = Object.entries(stats)
    .filter(([stat, value]) => stat !== 'spirit' && value > 0)
    .reduce((best, [, value]) => Math.max(best, value), 0)
  // Strictly greater, so a tie goes to the other stat: Grilled Mudfish is 20 agility and 20 spirit,
  // and it is an agility food. A consumable whose only stat is spirit still qualifies, since there
  // is nothing for it to lose the tie to.
  const spiritIsHeadline = (stats.spirit ?? 0) > biggestNonSpirit

  const roles = new Set()
  if (!isUniversal) {
    for (const stat of Object.keys(stats)) {
      if ((stats[stat] ?? 0) <= 0) continue
      if (stat === 'spirit' && !spiritIsHeadline) continue
      for (const role of ROLE_BY_STAT[stat] ?? []) roles.add(role)
    }
    if (hasTankOnlyStat) roles.add('Tank')
  }

  // Stats with no StatBlock field still say who a consumable is for. Elixir of Major Firepower grants
  // *only* fire spell power, so reading roles from the mapped stats alone left it belonging to nobody.
  if (!isUniversal) {
    for (const stat of Object.keys(extra)) {
      if (/SpellPower$/.test(stat) || stat === 'SpellPenetration') roles.add('Caster DPS')
      if (stat === 'HolySpellPower') roles.add('Healer')
      if (/Resistance$/.test(stat)) roles.add('Tank')
    }
  }

  const consumable = {
    id: slugify(hit.name),
    wowItemId: hit.id,
    name: hit.name,
    category: CATEGORY_BY_PREFIX[prefix],
    stats,
    source: 'Other',
  }
  if (roles.size) consumable.roles = [...roles].sort()
  if (Object.keys(extra).length) consumable.extraStats = extra
  // Nothing here carries a drop location or vendor; the tooltip search does not return one and
  // wowsims has no such field, so `source` stays generic rather than guessed.
  if (Object.keys(stats).length === 0 && Object.keys(extra).length === 0) {
    consumable.notes = 'No flat stats; its value is an effect the stat model does not represent.'
  } else if (Object.keys(stats).length === 0) {
    consumable.notes = 'Grants only school-specific spell power, which the stat totals do not yet carry.'
  }

  consumables.push(consumable)
}

consumables.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))

const payload = {
  $schema: 'tbc consumable ingestion',
  upstream: { repo: 'wowsims/tbc', sha: UPSTREAM_SHA, path: 'sim/core/consumes.go', license: 'MIT' },
  namesFrom: 'wowhead.com search suggestions',
  generatedBy: 'tools/ingest/ingest-consumables.mjs',
  consumableCount: consumables.length,
  consumables,
}

const json = `${JSON.stringify(payload, null, 2)}\n`
const previous = existsSync(OUT_PATH) ? readFileSync(OUT_PATH, 'utf8') : ''
const changed = previous !== json
if (changed) writeFileSync(OUT_PATH, json)

const byCategory = {}
for (const c of consumables) byCategory[c.category] = (byCategory[c.category] ?? 0) + 1
const byRole = {}
for (const c of consumables) for (const r of c.roles ?? []) byRole[r] = (byRole[r] ?? 0) + 1

process.stdout.write(
  [
    `consumables ${consumables.length}  (${changed ? 'written' : 'unchanged'})`,
    `  category  ${Object.entries(byCategory).map(([k, v]) => `${k}:${v}`).join('  ')}`,
    `  roles     ${Object.entries(byRole).sort(([, a], [, b]) => b - a).map(([k, v]) => `${k}:${v}`).join('  ')}`,
    `  no stats  ${consumables.filter((c) => Object.keys(c.stats).length === 0).length}`,
    '',
  ].join('\n'),
)
if (corrections.length) {
  process.stdout.write('names corrected by Wowhead:\n')
  for (const c of corrections) process.stdout.write(`  ${c}\n`)
}
if (problems.length) {
  process.stdout.write('PROBLEMS:\n')
  for (const p of problems) process.stdout.write(`  ${p}\n`)
}
