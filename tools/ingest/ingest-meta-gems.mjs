// Ingests the colour conditions a TBC meta gem needs before it does anything.
//
// Every meta gem in TBC is gated on the rest of your gems — "Requires at least 2 Red gems", "Requires
// more Blue gems than Yellow gems". Nothing in this project checked that, so a meta's stats applied
// the moment it was socketed regardless of whether the condition was met. That is the one gem rule
// a player can actually get wrong, and the app was silently telling them they had not.
//
// Source: the item's own Wowhead tooltip, read out of `g_items[<id>].tooltip_enus` in the served
// HTML — an **assignment**, not a JSON key, which is what defeats the obvious `"tooltip_enus":`
// regex. wowsims is not usable here: `sim/common/metagems.go` models what a meta gem *does* and
// leaves the activation condition to the user.
//
// **Do not read requirements out of the page text at large.** These pages carry user comments, and
// at least one (item 25890) contains a comment restating the requirements — so a loose search finds
// player-written text and treats it as authoritative. Only the tooltip assignment is the item.
//
// Two shapes, both taken verbatim:
//   "Requires at least 2 Red gems"                  -> a minimum count per colour
//   "Requires more Blue gems than Yellow gems"      -> a comparison between two colours
//
// Run: node tools/ingest/ingest-meta-gems.mjs
// Writes: src/domain/gems/metaGemRequirements.json

import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const CACHE = resolve(HERE, '.cache/metagems')
const OUT = resolve(REPO, 'src/domain/gems/metaGemRequirements.json')

const gems = JSON.parse(readFileSync(resolve(REPO, 'src/domain/gems/gemCatalogue.json'), 'utf8')).gems.filter(
  (gem) => gem.color === 'Meta',
)

async function fetchCached(id) {
  mkdirSync(CACHE, { recursive: true })
  const file = resolve(CACHE, `${id}.html`)
  if (existsSync(file)) return readFileSync(file, 'utf8')

  const res = await fetch(`https://www.wowhead.com/tbc/item=${id}`, { headers: { 'User-Agent': 'project-defeat-metagem-ingest' } })
  if (!res.ok) throw new Error(`item ${id}: HTTP ${res.status}`)
  const html = await res.text()
  writeFileSync(file, html)
  await new Promise((r) => setTimeout(r, 700))
  return html
}

/**
 * The item's own tooltip, and nothing else on the page.
 *
 * Scanned character by character rather than with a regex because the value is a JS string literal
 * full of escaped quotes; a non-greedy `"..."` match stops at the first `\"` and truncates.
 */
function tooltipFor(id, html) {
  const marker = `g_items[${id}].tooltip_enus = "`
  const start = html.indexOf(marker)
  if (start === -1) return undefined

  let i = start + marker.length
  let raw = ''
  while (i < html.length) {
    if (html[i] === '\\') {
      raw += html[i] + html[i + 1]
      i += 2
      continue
    }
    if (html[i] === '"') break
    raw += html[i]
    i++
  }

  return raw
    .replace(/\\"/g, '"')
    .replace(/\\\//g, '/')
    .replace(/<br\s*\/?>/gi, ' | ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const COLORS = new Set(['Red', 'Yellow', 'Blue'])

function parseRequirement(tooltip, context, problems) {
  const minimums = [...tooltip.matchAll(/Requires at least (\d+) (\w+) gems?/gi)].map((m) => ({
    color: m[2][0].toUpperCase() + m[2].slice(1).toLowerCase(),
    count: Number(m[1]),
  }))
  const comparison = tooltip.match(/Requires more (\w+) gems? than (\w+) gems?/i)

  for (const entry of minimums) {
    if (!COLORS.has(entry.color)) problems.push(`${context}: unknown gem colour "${entry.color}" in a minimum`)
  }

  if (comparison) {
    const more = comparison[1][0].toUpperCase() + comparison[1].slice(1).toLowerCase()
    const than = comparison[2][0].toUpperCase() + comparison[2].slice(1).toLowerCase()
    if (!COLORS.has(more) || !COLORS.has(than)) problems.push(`${context}: unknown gem colour in "${comparison[0]}"`)
    return { kind: 'moreThan', moreColor: more, thanColor: than, text: comparison[0] }
  }

  if (minimums.length > 0) {
    return {
      kind: 'minimums',
      minimums,
      text: minimums.map((entry) => `Requires at least ${entry.count} ${entry.color} gems`).join('; '),
    }
  }

  return undefined
}

const problems = []
const requirements = []
const unconditional = []

for (const gem of gems) {
  const html = await fetchCached(gem.wowItemId)
  const tooltip = tooltipFor(gem.wowItemId, html)
  if (!tooltip) {
    problems.push(`${gem.name} (${gem.wowItemId}): no tooltip found on the page`)
    continue
  }

  const requirement = parseRequirement(tooltip, `${gem.name} (${gem.wowItemId})`, problems)
  if (!requirement) {
    // Recorded rather than assumed: a meta with no condition is unusual enough to be worth seeing.
    unconditional.push(`${gem.name} (${gem.wowItemId})`)
    continue
  }

  requirements.push({ wowItemId: gem.wowItemId, gemId: gem.id, name: gem.name, ...requirement })
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`PROBLEM: ${problem}`)
  throw new Error(`${problems.length} unreadable meta gems — refusing to write a partial mapping`)
}

const payload = {
  $schema: 'wowhead tbc meta gem activation requirements',
  upstream: {
    site: 'wowhead.com',
    note: 'Read from g_items[<id>].tooltip_enus on each item page. Deliberately not from the page text at large — these pages carry user comments restating the requirements, which are not authoritative.',
  },
  generatedBy: 'tools/ingest/ingest-meta-gems.mjs',
  metaGemCount: gems.length,
  requirementCount: requirements.length,
  unconditionalCount: unconditional.length,
  requirements: requirements.sort((a, b) => a.wowItemId - b.wowItemId),
}

mkdirSync(dirname(OUT), { recursive: true })
const next = `${JSON.stringify(payload, null, 2)}\n`
const changed = !existsSync(OUT) || readFileSync(OUT, 'utf8') !== next
if (changed) writeFileSync(OUT, next)

console.log(`${gems.length} meta gems: ${requirements.length} with a colour condition, ${unconditional.length} without`)
for (const name of unconditional) console.log(`  no condition: ${name}`)
console.log(changed ? `  wrote ${OUT}` : '  0 written (unchanged)')
