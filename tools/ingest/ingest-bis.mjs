// Ingests Phase 2 BiS rankings from the Wowhead class guides.
//
// Why this exists: the hand-written BiS lists were one item deep. Nearly every slot offered a single
// option while the panel labelled it "1 ranked", presenting one guess as a considered ranking. The
// guides carry four or five ranked options per slot, which is the depth the feature was missing.
//
// How it reads the pages: Wowhead renders these guides client-side, so the DOM is only populated in a
// browser — but the source markup is already in the served HTML, as escaped BBCode inside the page's
// JSON payload. Parsing that is both cheaper and reproducible, which a browser session is not.
//
// The section -> slot map below is built from a discovery pass over all 25 guides
// (`node tools/ingest/discover-bis-sections.mjs`), not from guesswork. That pass is what turned up
// `Wrist` alongside `Wrists`, `Hand` alongside `Hands`, and two sections whose names carry a trailing
// space — none of which a sensible-looking hand-written map would have included.
//
// Run: node tools/ingest/ingest-bis.mjs
// Writes: src/domain/bis/bisRankings.json

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BIS_GUIDES } from './bis-guides.mjs'
import { fetchGuide, unescapePage } from './bis-fetch.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const OUT_PATH = resolve(REPO, 'src/domain/bis/bisRankings.json')

/**
 * Wowhead section name -> this repo's GearSlot. Paired slots map to their first member; the gear
 * panel's slot-compatibility rules already offer such an item in both.
 */
const SLOT_BY_SECTION = {
  Head: 'Head',
  Neck: 'Neck',
  Shoulders: 'Shoulders',
  Shoulder: 'Shoulders',
  Back: 'Back',
  Chest: 'Chest',
  Wrists: 'Wrists',
  Wrist: 'Wrists',
  Hands: 'Hands',
  Hand: 'Hands',
  Waist: 'Waist',
  Legs: 'Legs',
  Feet: 'Feet',
  Rings: 'Finger 1',
  Trinkets: 'Trinket 1',

  Weapons: 'Main Hand',
  'Melee Weapons': 'Main Hand',
  'Main Hand Weapons': 'Main Hand',
  '1H Weapons': 'Main Hand',
  '2H Weapons': 'Main Hand',
  'Two-Handed Weapons': 'Main Hand',

  'Off Hand Weapons': 'Off Hand',
  Offhands: 'Off Hand',
  Shields: 'Off Hand',
  'Shields & Offhands': 'Off Hand',

  Wands: 'Ranged',
  'Ranged Weapons': 'Ranged',
  Ranged: 'Ranged',

  Idols: 'Relic',
  Totems: 'Relic',
  Librams: 'Relic',
}

/** Strips BBCode markup, leaving readable text. */
function stripBb(text) {
  return text
    .replace(/\[item=(\d+)[^\]]*\]/g, '')
    .replace(/\[npc=(\d+)[^\]]*\]/g, '')
    .replace(/\[\/?[a-z][^\]]*\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Pulls the rows out of one `[table]...[/table]` block. */
function parseTable(tableBody) {
  const rows = []
  for (const rowMatch of tableBody.split('[tr]').slice(1)) {
    const cells = [...rowMatch.matchAll(/\[td[^\]]*\]([\s\S]*?)\[\/td\]/g)].map((m) => m[1])
    if (cells.length < 2) continue

    // The header row labels the columns; it carries no item link, so it falls out naturally below.
    // The *source* column also contains [item=...] tags (tier tokens), so the item must be taken
    // from the second cell specifically rather than from anywhere in the row.
    const itemId = cells[1].match(/\[item=(\d+)/)?.[1]
    if (!itemId) continue

    rows.push({
      wowItemId: Number(itemId),
      note: stripBb(cells[0]),
      source: cells[2] ? stripBb(cells[2]).slice(0, 120) : undefined,
    })
  }
  return rows
}

const guides = []
const unmappedSections = new Map()
const problems = []

for (const guide of BIS_GUIDES) {
  const page = unescapePage(await fetchGuide(guide.path))

  const title = (page.match(/<title>([^<]*)<\/title>/)?.[1] ?? '').split(' - ')[0].trim()
  if (!title.toLowerCase().includes(guide.expectSpec.toLowerCase())) {
    problems.push(`${guide.path}: title "${title}" does not mention "${guide.expectSpec}"`)
    continue
  }

  const sections = []
  // Each ranked list is an [h3] naming the slot, followed by the next [table] block.
  const headingRe = /\[h3 toc="([^"]+)"\]([^[]*)\[\/h3\]/g
  for (const heading of page.matchAll(headingRe)) {
    const [, rawToc, headingText] = heading
    if (!/Best in Slot/i.test(headingText)) continue

    const toc = rawToc.trim()
    const slot = SLOT_BY_SECTION[toc]
    if (!slot) {
      unmappedSections.set(toc, (unmappedSections.get(toc) ?? 0) + 1)
      continue
    }

    const after = page.slice(heading.index + heading[0].length)
    const table = after.match(/\[table[^\]]*\]([\s\S]*?)\[\/table\]/)
    if (!table) continue
    // A table further down the page than the next heading belongs to that heading, not this one.
    const nextHeading = after.search(/\[h3 toc="/)
    if (nextHeading !== -1 && table.index > nextHeading) continue

    const entries = parseTable(table[1])
    if (entries.length) sections.push({ slot, section: toc, entries })
  }

  guides.push({ path: guide.path, title, className: guide.className, specs: guide.specs, sections })
}

// Rankings are keyed by spec. Guides that serve several specs contribute the same list to each.
const bySpec = {}
for (const guide of guides) {
  for (const spec of guide.specs) {
    const key = `${guide.className}|${spec}`
    const slots = {}
    for (const section of guide.sections) {
      // A spec can have several sections feeding one slot (e.g. 1H and 2H weapons both main-hand).
      // Concatenate in page order so the guide's own ordering survives.
      slots[section.slot] = (slots[section.slot] ?? []).concat(
        section.entries.map((entry) => ({ ...entry, section: section.section })),
      )
    }
    bySpec[key] = {
      className: guide.className,
      spec,
      phase: 2,
      sourceName: guide.title,
      sourceUrl: `https://www.wowhead.com/tbc/guide/classes/${guide.path}`,
      slots: Object.fromEntries(
        Object.entries(slots).map(([slot, entries]) => [slot, entries.map((entry, index) => ({ rank: index + 1, ...entry }))]),
      ),
    }
  }
}

const payload = {
  $schema: 'wowhead tbc phase 2 bis rankings',
  generatedBy: 'tools/ingest/ingest-bis.mjs',
  guideCount: guides.length,
  specCount: Object.keys(bySpec).length,
  specs: Object.fromEntries(Object.entries(bySpec).sort(([a], [b]) => a.localeCompare(b))),
}

const json = `${JSON.stringify(payload, null, 2)}\n`
const previous = existsSync(OUT_PATH) ? readFileSync(OUT_PATH, 'utf8') : ''
const changed = previous !== json
if (changed) writeFileSync(OUT_PATH, json)

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

let totalEntries = 0
let slotCount = 0
const depth = {}
for (const entry of Object.values(bySpec)) {
  for (const rows of Object.values(entry.slots)) {
    slotCount += 1
    totalEntries += rows.length
    depth[rows.length] = (depth[rows.length] ?? 0) + 1
  }
}

process.stdout.write(
  [
    `guides     ${guides.length}`,
    `specs      ${Object.keys(bySpec).length}`,
    `slots      ${slotCount} ranked slots, ${totalEntries} entries`,
    `depth      ${Object.entries(depth).sort(([a], [b]) => Number(a) - Number(b)).map(([n, c]) => `${n}:${c}`).join('  ')}`,
    `output     ${changed ? 'written' : 'unchanged (idempotent)'} -> src/domain/bis/bisRankings.json`,
    '',
  ].join('\n'),
)

if (unmappedSections.size) {
  process.stdout.write(`UNMAPPED SECTIONS (add to SLOT_BY_SECTION):\n`)
  for (const [name, count] of unmappedSections) process.stdout.write(`  ${name.padEnd(24)} ${count}\n`)
}
if (problems.length) {
  process.stdout.write(`PROBLEMS:\n`)
  for (const p of problems) process.stdout.write(`  ${p}\n`)
}
