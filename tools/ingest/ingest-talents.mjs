// Ingests a class's talent trees from Wowhead's TBC talent-calculator data.
//
// The calculator page itself is an empty shell — the trees arrive from a separate endpoint,
// `nether.wowhead.com/tbc/data/talents-classic`, as two `WH.setPageData` payloads: one with the grid
// (tree id -> talent id -> row, column, icon, the spell id of each rank, and prerequisites) and one
// with the spell rows those rank ids point at, carrying the name and description.
//
// Neither payload names a talent. A talent's name is the name of its rank-1 spell, and its
// description is that spell's description, which is why the two have to be joined rather than read
// separately.
//
// Run: node tools/ingest/ingest-talents.mjs [--class Warrior]
// Writes: src/domain/talents/<class>Talents.json

import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const CACHE = resolve(HERE, '.cache/talents')
const SOURCE = 'https://nether.wowhead.com/tbc/data/talents-classic?dv=17&db=1785232218'

/**
 * Tree ids per class, read off the payload's own `trees` map, where each tree's `description` is an
 * unspaced "WarriorArms". Listed in the order the game shows them left to right.
 */
const TREES_BY_CLASS = {
  Druid: [
    // "FeralCombat" in the payload.
    { id: 283, spec: 'Balance' },
    { id: 281, spec: 'Feral' },
    { id: 282, spec: 'Restoration' },
  ],
  Hunter: [
    // "BeastMastery", unspaced.
    { id: 361, spec: 'Beast Mastery' },
    { id: 363, spec: 'Marksmanship' },
    { id: 362, spec: 'Survival' },
  ],
  Mage: [
    { id: 81, spec: 'Arcane' },
    { id: 41, spec: 'Fire' },
    { id: 61, spec: 'Frost' },
  ],
  Paladin: [
    { id: 382, spec: 'Holy' },
    { id: 383, spec: 'Protection' },
    // The payload calls this tree "Combat". Confirmed as Retribution by its contents — it is the
    // tree holding Seal of Command and Crusader Strike, not by assuming the label.
    { id: 381, spec: 'Retribution' },
  ],
  Priest: [
    { id: 201, spec: 'Discipline' },
    { id: 202, spec: 'Holy' },
    { id: 203, spec: 'Shadow' },
  ],
  Rogue: [
    { id: 182, spec: 'Assassination' },
    { id: 181, spec: 'Combat' },
    { id: 183, spec: 'Subtlety' },
  ],
  Shaman: [
    // "ElementalCombat" in the payload.
    { id: 261, spec: 'Elemental' },
    { id: 263, spec: 'Enhancement' },
    { id: 262, spec: 'Restoration' },
  ],
  Warlock: [
    // Two legacy names here, both confirmed by contents rather than by the label: "Curses" is the
    // tree with Unstable Affliction and Siphon Life, and "Summoning" is the one with Soul Link and
    // Fel Domination.
    { id: 302, spec: 'Affliction' },
    { id: 303, spec: 'Demonology' },
    { id: 301, spec: 'Destruction' },
  ],
  Warrior: [
    { id: 161, spec: 'Arms' },
    { id: 164, spec: 'Fury' },
    { id: 163, spec: 'Protection' },
  ],
}

async function loadPayload() {
  mkdirSync(CACHE, { recursive: true })
  const file = resolve(CACHE, 'talents-classic.js')
  if (!existsSync(file)) {
    const res = await fetch(SOURCE, { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } })
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} fetching talent data`)
    writeFileSync(file, await res.text())
  }
  return readFileSync(file, 'utf8')
}

/** Brace-matches the first `{...}` object at or after `from`. */
function objectAt(source, from, label) {
  const open = source.indexOf('{', from)
  if (open === -1) throw new Error(`no object found for ${label}`)
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = open; i < source.length; i++) {
    const ch = source[i]
    if (escaped) { escaped = false; continue }
    if (ch === '\\') { escaped = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '{') depth++
    else if (ch === '}') { depth--; if (depth === 0) return JSON.parse(source.slice(open, i + 1)) }
  }
  throw new Error(`unterminated payload for ${label}`)
}

/**
 * The grid: `WH.setPageData("wow.talentCalcClassic.tbc.data", {glyphs, talents, trees, abilities})`.
 */
function readGrid(source) {
  const at = source.indexOf('WH.setPageData("wow.talentCalcClassic.tbc.data"')
  if (at === -1) throw new Error('talent grid payload not found')
  return objectAt(source, at, 'talent grid')
}

/**
 * The spell rows: `WH.Gatherer.addData(6, 5, {"<spellId>": {name_enus, description_enus, ...}})`.
 *
 * Type 6 is Wowhead's spell entity. This is a separate call further down the same file rather than a
 * key on the grid payload, which is why a talent's name cannot be read from the grid alone.
 */
function readSpells(source) {
  const at = source.indexOf('WH.Gatherer.addData(6,')
  if (at === -1) throw new Error('spell payload not found')
  return objectAt(source, at, 'spell rows')
}

const className = process.argv.includes('--class') ? process.argv[process.argv.indexOf('--class') + 1] : 'Warrior'
const trees = TREES_BY_CLASS[className]
if (!trees) throw new Error(`no tree ids recorded for ${className}; add them to TREES_BY_CLASS`)

const source = await loadPayload()
const data = readGrid(source)
const spells = readSpells(source)

const problems = []

const out = trees.map(({ id, spec }) => {
  const grid = data.talents[id]
  if (!grid) throw new Error(`tree ${id} (${spec}) missing from payload`)

  const talents = Object.values(grid)
    .map((talent) => {
      const rankSpells = talent.ranks.map((spellId) => spells[String(spellId)])
      const first = rankSpells[0]
      if (!first) {
        problems.push(`${spec}: talent ${talent.id} has no spell row for rank 1 (${talent.ranks[0]})`)
        return undefined
      }

      return {
        id: talent.id,
        name: first.name_enus,
        icon: talent.icon,
        // Wowhead is 0-indexed for both; the game presents them as rows 1-9 and columns 1-4.
        row: talent.row,
        column: talent.col,
        maxRank: talent.ranks.length,
        spellIds: talent.ranks,
        /** Description per rank — the numbers change with rank, so one string would be wrong for all but one. */
        rankDescriptions: rankSpells.map((spell) => spell?.description_enus ?? ''),
        /**
         * Prerequisites: the talent that must be filled first and how many points it needs.
         * Wowhead calls the rank `qty`; it is renamed here because nothing else in this repo does.
         */
        requires: (talent.requires ?? []).map((entry) => ({ id: entry.id, rank: entry.qty })),
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.row - b.row || a.column - b.column)

  return { id, spec, talents }
})

const total = out.reduce((sum, tree) => sum + tree.talents.length, 0)
const outPath = resolve(REPO, `src/domain/talents/${className.toLowerCase()}Talents.json`)
mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(
  outPath,
  `${JSON.stringify(
    {
      $schema: 'wowhead tbc talent-calculator ingestion',
      upstream: { source: SOURCE, note: 'WH.setPageData payloads from the TBC talent calculator' },
      className,
      trees: out,
    },
    null,
    2,
  )}\n`,
)

console.log(`${className}: ${out.map((tree) => `${tree.spec} ${tree.talents.length}`).join(', ')} — ${total} talents`)
console.log(`wrote ${outPath.replace(REPO, '.')}`)
if (problems.length) console.log(`PROBLEMS:\n  ${problems.join('\n  ')}`)
