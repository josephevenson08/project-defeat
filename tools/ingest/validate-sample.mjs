// Spot-checks ingested items against live Wowhead tooltips.
//
// The point is not to prove the source is perfect — it is to find out the failure rate before the
// whole catalogue is built on it. The previous catalogue looked entirely plausible and was wrong in
// all 48 items ever checked, so "it looks right" is not an acceptable answer here.
//
// Wowhead's <jsonEquip> CDATA block is machine-readable (nsockets, socket1..N, armor, str, sta, ...),
// which makes this a structural comparison rather than tooltip-scraping.
//
// Run: node tools/ingest/validate-sample.mjs [--sample N] [--seed N]

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')

const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag)
  return i === -1 ? fallback : Number(process.argv[i + 1])
}
const SAMPLE = arg('--sample', 20)
const SEED = arg('--seed', 20260806)
const DELAY_MS = 350

/**
 * Wowhead socket codes. Sequential, not a bitmask — an earlier bitmask guess here (8=Yellow) produced
 * three false mismatches before item 23507's own markup settled it: socket-red=2, socket-blue=4, and
 * yellow-socketed items report 3.
 */
const SOCKET_BY_CODE = { 1: 'Meta', 2: 'Red', 3: 'Yellow', 4: 'Blue' }

/** jsonEquip key -> StatBlock key. Only unambiguous primaries; enough to catch systematic invention. */
const JSON_STAT_MAP = {
  str: 'strength',
  agi: 'agility',
  sta: 'stamina',
  int: 'intellect',
  spi: 'spirit',
  armor: 'armor',
}

// Deterministic PRNG so a failing sample can be reproduced exactly with the same --seed.
function mulberry32(a) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const catalogue = JSON.parse(readFileSync(resolve(REPO, 'src/domain/gear/itemCatalogue.json'), 'utf8'))
const rand = mulberry32(SEED)

// Optional filters, so the sample can target the subset that actually matters for the current phase
// rather than averaging in vanilla leftovers nobody will equip.
const maxPhase = arg('--max-phase', Infinity)
const qualityFilter = process.argv.includes('--quality')
  ? process.argv[process.argv.indexOf('--quality') + 1]
  : undefined

const pool = catalogue.items.filter(
  (i) => (i.phase ?? 0) <= maxPhase && (!qualityFilter || i.quality === qualityFilter),
)

// Stratify by slot so the sample cannot accidentally be twenty rings.
const bySlot = new Map()
for (const item of pool) {
  if (!bySlot.has(item.slot)) bySlot.set(item.slot, [])
  bySlot.get(item.slot).push(item)
}

const sample = []
const slots = [...bySlot.keys()].sort()
while (sample.length < SAMPLE) {
  const before = sample.length
  for (const slot of slots) {
    if (sample.length >= SAMPLE) break
    const pool = bySlot.get(slot)
    const pick = pool[Math.floor(rand() * pool.length)]
    if (pick && !sample.includes(pick)) sample.push(pick)
  }
  if (sample.length === before) break
}

function parseJsonEquip(xml) {
  const m = xml.match(/<jsonEquip><!\[CDATA\[(.*?)\]\]><\/jsonEquip>/s)
  if (!m) return undefined
  try {
    return JSON.parse(`{${m[1]}}`)
  } catch {
    return undefined
  }
}

const results = []
for (const item of sample) {
  const url = `https://www.wowhead.com/tbc/item=${item.wowItemId}&xml`
  let xml
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'project-defeat-ingest-validator' } })
    if (!res.ok) {
      results.push({ item, status: 'fetch-failed', detail: `HTTP ${res.status}` })
      continue
    }
    xml = await res.text()
  } catch (err) {
    results.push({ item, status: 'fetch-failed', detail: String(err.message) })
    continue
  }

  const name = xml.match(/<name><!\[CDATA\[(.*?)\]\]><\/name>/s)?.[1]
  const level = Number(xml.match(/<level>(\d+)<\/level>/)?.[1])
  const qualityName = xml.match(/<quality id="\d+"><!\[CDATA\[(.*?)\]\]><\/quality>/s)?.[1]
  const equip = parseJsonEquip(xml)

  if (!name || !equip) {
    results.push({ item, status: 'unparseable', detail: 'no name or jsonEquip block' })
    continue
  }

  const diffs = []

  if (name.trim() !== item.name.trim()) diffs.push(`name: wowhead "${name}" vs ours "${item.name}"`)
  if (level && item.itemLevel && level !== item.itemLevel) diffs.push(`ilvl: wowhead ${level} vs ours ${item.itemLevel}`)
  if (qualityName && item.quality && qualityName !== item.quality) {
    diffs.push(`quality: wowhead ${qualityName} vs ours ${item.quality}`)
  }

  // Sockets — the field the old catalogue got wrong in both directions, so checked colour by colour.
  const theirSockets = []
  for (let i = 1; i <= (equip.nsockets ?? 0); i += 1) {
    const code = equip[`socket${i}`]
    theirSockets.push(SOCKET_BY_CODE[code] ?? `unknown(${code})`)
  }
  const ourSockets = item.sockets ?? []
  if (theirSockets.join(',') !== ourSockets.join(',')) {
    diffs.push(`sockets: wowhead [${theirSockets.join(', ')}] vs ours [${ourSockets.join(', ')}]`)
  }

  for (const [jsonKey, statKey] of Object.entries(JSON_STAT_MAP)) {
    const theirs = equip[jsonKey] ?? 0
    const ours = item.stats?.[statKey] ?? 0
    if (theirs !== ours) diffs.push(`${statKey}: wowhead ${theirs} vs ours ${ours}`)
  }

  results.push({ item, status: diffs.length ? 'mismatch' : 'match', diffs })
  await new Promise((r) => setTimeout(r, DELAY_MS))
}

const matched = results.filter((r) => r.status === 'match')
const mismatched = results.filter((r) => r.status === 'mismatch')
const errored = results.filter((r) => r.status !== 'match' && r.status !== 'mismatch')

for (const r of results) {
  const tag = r.status === 'match' ? 'OK  ' : r.status === 'mismatch' ? 'DIFF' : 'ERR '
  process.stdout.write(`${tag} ${String(r.item.wowItemId).padEnd(6)} ${r.item.slot.padEnd(11)} ${r.item.name}\n`)
  for (const d of r.diffs ?? []) process.stdout.write(`       - ${d}\n`)
  if (r.detail) process.stdout.write(`       - ${r.detail}\n`)
}

process.stdout.write(
  `\nseed ${SEED} | ${results.length} checked | ${matched.length} match | ${mismatched.length} mismatch | ${errored.length} error\n`,
)
process.exitCode = mismatched.length > 0 ? 1 : 0
