// Fills enchant-catalogue gaps from Wowhead for enchants the wowsims database does not model.
//
// wowsims carries 79 enchants — the ones its sim cares about. The Wowhead enchants-and-gems guides
// recommend 15 more, mostly healer ones. A recommendation the gear popup cannot apply is worse than
// no recommendation, so these are read off Wowhead rather than dropped.
//
// The stats are prose, not a table, and the two id spaces need different sources: an enchant cited by
// spell has its effect in the page's meta description, while one cited by item has it in the item
// tooltip ("Use: Permanently embroiders spellthread into pants, increasing healing by up to 66...").
// Every phrase below was read off the real text with --discover; nothing here is recalled, and
// anything that fails to parse is reported rather than guessed at.
//
// Run: node tools/ingest/supplement-enchants.mjs [--discover]
// Writes: src/domain/enchants/enchantSupplement.json

import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const CACHE = resolve(HERE, '.cache/enchant-supplement')
const OUT_PATH = resolve(REPO, 'src/domain/enchants/enchantSupplement.json')

/**
 * Ids the enchants-and-gems guides reference that wowsims has no row for. Regenerate by running
 * tools/ingest/ingest-bis-recommendations.mjs and reading its PROBLEMS output.
 *
 * Mixed id spaces on purpose: the guides cite some enchants by the item that applies them and others
 * by the spell, and this mirrors whichever the guide used.
 */
const MISSING = [
  { kind: 'item', id: 24276 },
  { kind: 'item', id: 28887 },
  { kind: 'item', id: 29190 },
  { kind: 'spell', id: 25080 },
  { kind: 'spell', id: 27917 },
  { kind: 'spell', id: 27982 },
  { kind: 'spell', id: 27924 },
  { kind: 'spell', id: 27926 },
  { kind: 'spell', id: 27962 },
  { kind: 'spell', id: 33994 },
  { kind: 'spell', id: 33999 },
  { kind: 'spell', id: 34003 },
  { kind: 'spell', id: 46498 },
  { kind: 'spell', id: 46500 },
  { kind: 'spell', id: 46513 },
  { kind: 'spell', id: 46517 },
  { kind: 'spell', id: 46518 },
  { kind: 'spell', id: 46531 },
  { kind: 'spell', id: 46540 },
]

/** Slot from the enchant's own name or its effect text, both of which state what they enchant. */
const SLOT_BY_KEYWORD = [
  [/bracer|wrist/i, 'Wrists'],
  [/glove|hands/i, 'Hands'],
  [/boots|feet/i, 'Feet'],
  [/cloak|back/i, 'Back'],
  [/chest/i, 'Chest'],
  [/shoulder|inscription/i, 'Shoulders'],
  [/helm|head|arcanum|glyph/i, 'Head'],
  [/\bleg|pants|spellthread|armor kit/i, 'Legs'],
  [/shield/i, 'Off Hand'],
  [/weapon|blade/i, 'Main Hand'],
  [/ring/i, 'Finger 1'],
]

/**
 * Combined phrases, tried first. "spell damage and healing by up to 12" is a single number covering
 * both stats; matching the individual patterns against it would read the 12 twice and still be right,
 * but "healing spells by up to 20 and damage spells by up to 7" carries two different numbers in one
 * sentence and has to be taken as a pair.
 */
const COMBINED = [
  [/healing spells by up to (\d+) and damage spells by up to (\d+)/i, (a, b) => ({ healingPower: a, spellPower: b })],
  [/effect of your healing spells by up to (\d+) and your damage spells by up to (\d+)/i, (a, b) => ({ healingPower: a, spellPower: b })],
  [/(?:spell )?damage and healing (?:done )?by up to (\d+)/i, (a) => ({ spellPower: a, healingPower: a })],
  [/healing by up to (\d+),? (?:and )?spell damage by up to (\d+)/i, (a, b) => ({ healingPower: a, spellPower: b })],
  [/up to (\d+) healing and (\d+) spell damage/i, (a, b) => ({ healingPower: a, spellPower: b })],
  [/up to (\d+) healing, \+?(\d+) Spell Damage/i, (a, b) => ({ healingPower: a, spellPower: b })],
  [/\+(\d+) Healing and \+?(\d+) Spell Damage/i, (a, b) => ({ healingPower: a, spellPower: b })],
  [/Healing by (\d+) and Spell Damage by (\d+)/i, (a, b) => ({ healingPower: a, spellPower: b })],
]

/**
 * Single-stat phrases, accumulated on top of whatever a combined phrase already supplied.
 *
 * Note the two verbs. Most enchants "increase X by N", but the rating ones "grant N X rating" — Spell
 * Strike reads "grant 15 spell hit rating", and matching only the first form left it stat-less.
 */
const SINGLE = [
  [/grants? (\d+) spell hit rating/i, 'spellHitRating'],
  [/grants? (\d+) spell critical strike rating/i, 'spellCritRating'],
  [/grants? (\d+) hit rating/i, 'hitRating'],
  [/grants? (\d+) critical strike rating/i, 'critRating'],
  [/Stamina by (\d+)/i, 'stamina'],
  [/agility by (\d+)/i, 'agility'],
  [/strength by (\d+)/i, 'strength'],
  [/intellect by (\d+)/i, 'intellect'],
  [/spirit by (\d+)/i, 'spirit'],
  [/(\d+) mana per 5 sec/i, 'mp5'],
  [/attack power by (\d+)/i, 'attackPower'],
  [/defense rating by (\d+)/i, 'defenseRating'],
  [/dodge rating by (\d+)/i, 'dodgeRating'],
  [/resilience rating by (\d+)/i, 'resilienceRating'],
]

/** Stats with no StatBlock field, kept so an entry is never shipped looking empty. */
const EXTRA = [
  [/all Resistances by (\d+)/i, 'AllResistances'],
  [/(\d+) damage to fire and arcane spells/i, 'FireArcaneSpellPower'],
  [/(\d+) damage to frost and shadow spells/i, 'FrostShadowSpellPower'],
  [/Spell Penetration by (\d+)/i, 'SpellPenetration'],
]

async function fetchCached(key, url) {
  mkdirSync(CACHE, { recursive: true })
  const file = resolve(CACHE, `${key}.txt`)
  if (existsSync(file)) return readFileSync(file, 'utf8')
  const res = await fetch(url, { headers: { 'User-Agent': 'project-defeat-enchant-supplement' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  writeFileSync(file, text)
  await new Promise((r) => setTimeout(r, 350))
  return text
}

function decode(text) {
  return text
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&')
    .replaceAll('&nbsp;', ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function slugify(name) {
  return name.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/** Fetches name plus effect text, from whichever source carries it for that id kind. */
async function loadEnchant({ kind, id }) {
  if (kind === 'spell') {
    const html = await fetchCached(`spell-${id}`, `https://www.wowhead.com/tbc/spell=${id}`)
    // Strip only the trailing " - Spell - TBC Classic"; splitting on the first dash would turn
    // "Enchant Bracer - Spellpower" into "Enchant Bracer" and lose which bracer enchant it is.
    const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '')
    return {
      name: title.replace(/\s*-\s*Spell\s*-\s*TBC Classic\s*$/i, '').trim(),
      text: decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? ''),
    }
  }

  const xml = await fetchCached(`item-${id}`, `https://www.wowhead.com/tbc/item=${id}&xml`)
  const name = decode(xml.match(/<name><!\[CDATA\[([\s\S]*?)\]\]>/)?.[1] ?? '')
  const tooltip = xml.match(/<htmlTooltip><!\[CDATA\[([\s\S]*?)\]\]>/)?.[1] ?? ''
  return { name, text: decode(tooltip.replace(/<[^>]+>/g, ' ')) }
}

const discover = process.argv.includes('--discover')
const results = []
const problems = []

for (const entry of MISSING) {
  let loaded
  try {
    loaded = await loadEnchant(entry)
  } catch (err) {
    problems.push(`${entry.kind} ${entry.id}: ${err.message}`)
    continue
  }

  const { name, text } = loaded

  if (discover) {
    process.stdout.write(`${entry.kind} ${entry.id}  ${name}\n    ${text.slice(0, 165)}\n`)
    continue
  }

  const stats = {}
  for (const [pattern, build] of COMBINED) {
    const m = text.match(pattern)
    if (!m) continue
    Object.assign(stats, build(Number(m[1]), Number(m[2])))
    break
  }
  for (const [pattern, key] of SINGLE) {
    const m = text.match(pattern)
    if (m && stats[key] === undefined) stats[key] = Number(m[1])
  }

  const extraStats = {}
  for (const [pattern, key] of EXTRA) {
    const m = text.match(pattern)
    if (m) extraStats[key] = Number(m[1])
  }

  const slot = SLOT_BY_KEYWORD.find(([re]) => re.test(name) || re.test(text))?.[1]
  if (!slot) {
    problems.push(`${entry.kind} ${entry.id} "${name}": slot not inferable`)
    continue
  }
  if (Object.keys(stats).length === 0 && Object.keys(extraStats).length === 0) {
    problems.push(`${entry.kind} ${entry.id} "${name}": no stat phrase matched -- "${text.slice(0, 100)}"`)
    continue
  }

  const enchant = {
    id: slugify(name.replace(/^Enchant\s+/i, '')),
    name: name.replace(/^Enchant\s+/i, ''),
    slot,
    stats,
    needsVerification: true,
    notes: 'Read from a Wowhead description rather than a structured table.',
  }
  if (entry.kind === 'item') enchant.wowEnchantId = entry.id
  else enchant.effectIds = [entry.id]
  if (Object.keys(extraStats).length) enchant.extraStats = extraStats
  if (slot === 'Main Hand') enchant.allowedSlots = ['Main Hand', 'Off Hand']

  // TBC re-issued several enchants under fresh spell ids in 2.4, so the same enchant arrives twice —
  // "Ring - Spellpower" is both 27924 and 46518. One entry, both ids, so a guide citing either
  // resolves to it.
  const existing = results.find((r) => r.id === enchant.id)
  if (existing) {
    existing.effectIds = [...new Set([...(existing.effectIds ?? []), ...(enchant.effectIds ?? [])])].sort((a, b) => a - b)
    if (!existing.wowEnchantId && enchant.wowEnchantId) existing.wowEnchantId = enchant.wowEnchantId
    continue
  }

  results.push(enchant)
}

if (discover) process.exit(0)

results.sort((a, b) => a.name.localeCompare(b.name))

const payload = {
  $schema: 'wowhead enchant supplement',
  note: 'Enchants the Wowhead guides recommend that the wowsims database does not model.',
  generatedBy: 'tools/ingest/supplement-enchants.mjs',
  enchantCount: results.length,
  enchants: results,
}

const json = `${JSON.stringify(payload, null, 2)}\n`
const previous = existsSync(OUT_PATH) ? readFileSync(OUT_PATH, 'utf8') : ''
const changed = previous !== json
if (changed) writeFileSync(OUT_PATH, json)

process.stdout.write(
  [`requested ${MISSING.length}`, `ingested  ${results.length}`, `output    ${changed ? 'written' : 'unchanged'}`, ''].join('\n'),
)
if (problems.length) {
  process.stdout.write('PROBLEMS:\n')
  for (const p of problems) process.stdout.write(`  ${p}\n`)
}
