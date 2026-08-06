// Compares the hand-curated catalogue against the ingested wowsims data, item by item.
//
// The rebuild decision was "keep the sourced items as an override layer that wins on conflict". That
// is only correct if the sourced items are actually right. This script exists to check that premise
// rather than assume it — every conflict it prints is a place where one of the two sources is wrong,
// and the tie is broken by Wowhead with --check-wowhead.
//
// Run: node tools/ingest/reconcile-curated.mjs [--check-wowhead]

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { registerHooks } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')

// The app's imports are extensionless because Vite resolves them; Node ESM will not. Retry with .ts
// rather than rewriting hundreds of import statements to suit a diagnostic script.
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

// pathToFileURL, not a bare path: Windows drive letters parse as a URL scheme otherwise.
// Relies on Node 24 stripping the types out of sampleItems.ts natively.
const { sampleItems } = await import(pathToFileURL(resolve(REPO, 'src/domain/gear/sampleItems.ts')).href)
const catalogue = JSON.parse(readFileSync(resolve(REPO, 'src/domain/gear/itemCatalogue.json'), 'utf8'))

const ingestedById = new Map(catalogue.items.map((i) => [i.wowItemId, i]))

const STAT_KEYS = [
  'strength', 'agility', 'stamina', 'intellect', 'spirit', 'attackPower', 'rangedAttackPower',
  'feralAttackPower', 'spellPower', 'healingPower', 'hitRating', 'spellHitRating', 'critRating',
  'spellCritRating', 'hasteRating', 'spellHasteRating', 'expertiseRating', 'armorPenetration',
  'defenseRating', 'dodgeRating', 'parryRating', 'blockRating', 'blockValue', 'resilienceRating',
  'armor', 'mp5',
]

const matched = []
const unmatched = []

for (const curated of sampleItems) {
  if (!curated.wowItemId) {
    unmatched.push({ curated, reason: 'no wowItemId' })
    continue
  }
  const ingested = ingestedById.get(curated.wowItemId)
  if (!ingested) {
    unmatched.push({ curated, reason: `wowItemId ${curated.wowItemId} not in ingested data` })
    continue
  }

  const diffs = []
  if (curated.itemLevel && curated.itemLevel !== ingested.itemLevel) {
    diffs.push({ field: 'itemLevel', curated: curated.itemLevel, ingested: ingested.itemLevel })
  }
  if (curated.quality !== ingested.quality) {
    diffs.push({ field: 'quality', curated: curated.quality, ingested: ingested.quality })
  }
  if (curated.armorType && ingested.armorType && curated.armorType !== ingested.armorType) {
    diffs.push({ field: 'armorType', curated: curated.armorType, ingested: ingested.armorType })
  }
  const cs = (curated.sockets ?? []).join(',')
  const is = (ingested.sockets ?? []).join(',')
  if (cs !== is) diffs.push({ field: 'sockets', curated: `[${cs}]`, ingested: `[${is}]` })

  for (const key of STAT_KEYS) {
    const c = curated.stats?.[key] ?? 0
    const i = ingested.stats?.[key] ?? 0
    if (c !== i) diffs.push({ field: key, curated: c, ingested: i })
  }

  matched.push({ curated, ingested, diffs, flagged: curated.needsVerification === true })
}

const clean = matched.filter((m) => m.diffs.length === 0)
const conflicted = matched.filter((m) => m.diffs.length > 0)
const conflictedUnflagged = conflicted.filter((m) => !m.flagged)

process.stdout.write(
  [
    `curated entries       ${sampleItems.length}`,
    `  matched to ingested ${matched.length}`,
    `  unmatched           ${unmatched.length}`,
    '',
    `matched & identical   ${clean.length}`,
    `matched & conflicting ${conflicted.length}  (${conflictedUnflagged.length} of them NOT flagged needsVerification)`,
    '',
  ].join('\n'),
)

// Tie-break the unflagged conflicts against Wowhead — those are the ones claiming to be sourced.
if (process.argv.includes('--check-wowhead')) {
  const SOCKET_BY_CODE = { 1: 'Meta', 2: 'Red', 3: 'Yellow', 4: 'Blue' }
  const JSON_STAT_MAP = { str: 'strength', agi: 'agility', sta: 'stamina', int: 'intellect', spi: 'spirit', armor: 'armor' }
  let curatedWins = 0
  let ingestedWins = 0
  let undecided = 0

  for (const m of conflictedUnflagged) {
    const res = await fetch(`https://www.wowhead.com/tbc/item=${m.curated.wowItemId}&xml`, {
      headers: { 'User-Agent': 'project-defeat-reconciler' },
    })
    if (!res.ok) { undecided += 1; continue }
    const xml = await res.text()
    const raw = xml.match(/<jsonEquip><!\[CDATA\[(.*?)\]\]><\/jsonEquip>/s)?.[1]
    const level = Number(xml.match(/<level>(\d+)<\/level>/)?.[1])
    if (!raw) { undecided += 1; continue }
    let equip
    try { equip = JSON.parse(`{${raw}}`) } catch { undecided += 1; continue }

    const truth = {}
    for (const [k, v] of Object.entries(JSON_STAT_MAP)) truth[v] = equip[k] ?? 0
    const truthSockets = []
    for (let i = 1; i <= (equip.nsockets ?? 0); i += 1) truthSockets.push(SOCKET_BY_CODE[equip[`socket${i}`]] ?? '?')

    const lines = []
    for (const d of m.diffs) {
      let actual
      if (d.field === 'sockets') actual = `[${truthSockets.join(',')}]`
      else if (d.field === 'itemLevel') actual = level
      else if (d.field in truth) actual = truth[d.field]
      else continue
      const cWin = String(actual) === String(d.curated)
      const iWin = String(actual) === String(d.ingested)
      if (cWin) curatedWins += 1
      else if (iWin) ingestedWins += 1
      lines.push(`     ${d.field.padEnd(14)} wowhead ${String(actual).padEnd(12)} curated ${String(d.curated).padEnd(12)} ingested ${d.ingested}   ${cWin ? '<- curated right' : iWin ? '<- ingested right' : '<- neither'}`)
    }
    if (lines.length) {
      process.stdout.write(`  ${m.curated.wowItemId} ${m.curated.name}\n${lines.join('\n')}\n`)
    }
    await new Promise((r) => setTimeout(r, 350))
  }
  process.stdout.write(`\nverifiable field conflicts: curated right ${curatedWins} | ingested right ${ingestedWins} | neither ${undecided}\n`)
} else {
  for (const m of conflicted.slice(0, 8)) {
    process.stdout.write(`  ${m.curated.wowItemId} ${m.curated.name}${m.flagged ? ' [flagged]' : ''}\n`)
    for (const d of m.diffs.slice(0, 6)) {
      process.stdout.write(`     ${d.field.padEnd(14)} curated ${String(d.curated).padEnd(14)} ingested ${d.ingested}\n`)
    }
  }
  process.stdout.write('\nre-run with --check-wowhead to break the ties on the unflagged conflicts\n')
}
