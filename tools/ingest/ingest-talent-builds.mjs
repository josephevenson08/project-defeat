// Extracts real raiding talent builds from wowsims/tbc presets at the pinned commit.
//
// **Why this exists.** The calibration harness filled a spec's PRIMARY TREE to 61 points, which is
// not a build any TBC raider plays — and it is not a ceiling either, because a real 41/20 split can
// be worth more than 61 points down one tree. On 2026-08-27 that stopped being cosmetic twice in one
// hour: it handed a Demonology warlock a talent the spec does not use, and it made a correct feature
// (Demonic Sacrifice for Affliction and Destruction) read as exactly zero, because those two specs
// take it out of a tree the harness never touches.
//
// **wowsims writes its presets as named fields with ranks**, not as opaque talent strings, which is
// what makes this an ingest rather than a decoding project:
//
//     var defaultDestroTalents = &proto.WarlockTalents{
//         ImprovedShadowBolt: 5,
//         Shadowburn:         true,
//         ...
//     }
//
// **17 of 20 DPS specs have one.** Hunter Marksmanship, Warlock Affliction and Warlock Demonology do
// not, and the harness keeps its old rule for exactly those three rather than inventing a build —
// the repo owner's call on 2026-08-27. The generated file records which specs are sourced so the
// calibration table can say so rather than mixing two methodologies silently.
//
// Run: node tools/ingest/ingest-talent-builds.mjs [--refetch]
// Writes: src/domain/talents/talentBuilds.json

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const CACHE = resolve(HERE, '.cache/talent-builds')
const UPSTREAM_SHA = '3301fca59306a747e521274c36e073e69acc7b77'
const refetch = process.argv.includes('--refetch')

/** Which upstream variable is which spec. The one piece of mapping a machine cannot infer. */
const BUILDS = [
  { className: 'Hunter', spec: 'Beast Mastery', path: 'sim/hunter/presets.go', variable: 'BMTalents' },
  { className: 'Hunter', spec: 'Survival', path: 'sim/hunter/presets.go', variable: 'SVTalents' },
  { className: 'Warrior', spec: 'Arms', path: 'sim/warrior/dps/presets.go', variable: 'ArmsSlamTalents' },
  { className: 'Warrior', spec: 'Fury', path: 'sim/warrior/dps/presets.go', variable: 'FuryTalents' },
  { className: 'Warlock', spec: 'Destruction', path: 'sim/warlock/presets.go', variable: 'defaultDestroTalents' },
  { className: 'Rogue', spec: 'Combat', path: 'sim/rogue/presets.go', variable: 'CombatTalents' },
  { className: 'Rogue', spec: 'Assassination', path: 'sim/rogue/presets.go', variable: 'MutilateTalents' },
  { className: 'Rogue', spec: 'Subtlety', path: 'sim/rogue/presets.go', variable: 'HemoTalents' },
  { className: 'Mage', spec: 'Fire', path: 'sim/mage/presets.go', variable: 'FireTalents' },
  { className: 'Mage', spec: 'Frost', path: 'sim/mage/presets.go', variable: 'FrostTalents' },
  { className: 'Mage', spec: 'Arcane', path: 'sim/mage/presets.go', variable: 'ArcaneTalents' },
  { className: 'Druid', spec: 'Balance', path: 'sim/druid/balance/presets.go', variable: 'StandardTalents' },
  { className: 'Druid', spec: 'Feral', path: 'sim/druid/feral/presets.go', variable: 'StandardTalents' },
  { className: 'Paladin', spec: 'Retribution', path: 'sim/paladin/retribution/presets.go', variable: 'defaultRetTalents' },
  { className: 'Priest', spec: 'Shadow', path: 'sim/priest/shadow/presets.go', variable: 'StandardTalents' },
  { className: 'Shaman', spec: 'Elemental', path: 'sim/shaman/elemental/presets.go', variable: 'StandardTalents' },
  { className: 'Shaman', spec: 'Enhancement', path: 'sim/shaman/enhancement/presets.go', variable: 'StandardTalents' },
]

/** Specs with no upstream preset, recorded so the harness can say which rule it used. */
const UNSOURCED = [
  { className: 'Hunter', spec: 'Marksmanship' },
  { className: 'Warlock', spec: 'Affliction' },
  { className: 'Warlock', spec: 'Demonology' },
]

const TALENT_JSON = {
  Warrior: 'warriorTalents.json',
  Rogue: 'rogueTalents.json',
  Hunter: 'hunterTalents.json',
  Shaman: 'shamanTalents.json',
  Druid: 'druidTalents.json',
  Paladin: 'paladinTalents.json',
  Mage: 'mageTalents.json',
  Priest: 'priestTalents.json',
  Warlock: 'warlockTalents.json',
}

async function readSource(path) {
  const cached = resolve(CACHE, path.replace(/[/.]/g, '_'))
  if (!refetch && existsSync(cached)) return readFileSync(cached, 'utf8')
  const res = await fetch(`https://raw.githubusercontent.com/wowsims/tbc/${UPSTREAM_SHA}/${path}`)
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`)
  const text = await res.text()
  mkdirSync(CACHE, { recursive: true })
  writeFileSync(cached, text)
  return text
}

/**
 * Names wowsims writes differently from the talent trees this repo ingested from Wowhead.
 *
 * Kept as an explicit list rather than fuzzy-matched, because a near-match is exactly how an effect
 * ends up keyed to the wrong talent. Only one so far: upstream's `FaerieFire` is the Feral version,
 * which Wowhead names "Faerie Fire (Feral)" to distinguish it from the Balance talent that improves
 * the base spell — a distinction this repo already had to get right once, in the opposite direction.
 */
const ALIASES = { faeriefire: 'Faerie Fire (Feral)' }

/**
 * Normalises both sides of the name match to letters and digits only.
 *
 * wowsims writes Go field names — `NaturesGuidance`, `TwoHandedWeaponSpecialization` — against
 * Wowhead's display names, which carry apostrophes, spaces and hyphens. Stripping everything else
 * makes one rule handle all three rather than a special case per punctuation mark.
 */
const normalise = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '')

/** Pulls one `var X = &proto.YTalents{ ... }` block out of a file. */
function extractBlock(source, variable) {
  const start = source.indexOf(`var ${variable} = &proto.`)
  if (start < 0) return undefined
  const open = source.indexOf('{', start)
  const close = source.indexOf('\n}', open)
  return close > open ? source.slice(open + 1, close) : undefined
}

const builds = []
const failures = []
const clamped = []

for (const entry of BUILDS) {
  const source = await readSource(entry.path)
  const block = extractBlock(source, entry.variable)
  if (!block) {
    failures.push(`${entry.className} ${entry.spec}: no block named ${entry.variable} in ${entry.path}`)
    continue
  }

  const tree = JSON.parse(readFileSync(resolve(REPO, `src/domain/talents/${TALENT_JSON[entry.className]}`), 'utf8'))
  const byName = new Map()
  for (const t of tree.trees) for (const talent of t.talents) byName.set(normalise(talent.name), talent)

  const points = {}
  let spent = 0
  for (const line of block.split('\n')) {
    // Comment-only and commented-out lines are skipped: upstream leaves several disabled by hand.
    const stripped = line.replace(/\/\/.*$/, '').trim()
    const match = stripped.match(/^([A-Za-z]+):\s*(\d+|true|false),?$/)
    if (!match) continue
    const [, field, raw] = match
    if (raw === 'false') continue
    const rank = raw === 'true' ? 1 : Number(raw)

    const aliased = ALIASES[normalise(field)]
    const talent = byName.get(normalise(aliased ?? field))
    if (!talent) {
      failures.push(`${entry.className} ${entry.spec}: no talent matching "${field}" in ${TALENT_JSON[entry.className]}`)
      continue
    }
    /*
     * **Upstream over-allocates in two presets and the ingested tree is the authority.** wowsims
     * writes `PiercingIce: 5` where the talent has three ranks, which is an allocation the game
     * would not accept — so it is clamped to the real cap and reported rather than either trusted or
     * silently dropped. The Wowhead trees are the game's own data on what a talent can hold.
     */
    const capped = Math.min(rank, talent.maxRank)
    if (capped !== rank) {
      clamped.push(`${entry.className} ${entry.spec}: ${talent.name} ${rank} -> ${capped} (max ${talent.maxRank})`)
    }
    points[talent.id] = capped
    spent += capped
  }

  // A level-70 character has 61 points. More than that means the block was parsed wrong.
  if (spent > 61) failures.push(`${entry.className} ${entry.spec}: ${spent} points spent, over the 61 cap`)
  builds.push({ ...entry, pointsSpent: spent, points })
}

if (failures.length > 0) {
  console.error('REFUSING TO WRITE — some builds did not resolve:')
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}

const out = {
  $schema: 'wowsims talent-build extraction',
  upstream: { repo: 'wowsims/tbc', sha: UPSTREAM_SHA },
  generatedBy: 'tools/ingest/ingest-talent-builds.mjs',
  buildCount: builds.length,
  builds: builds.map(({ className, spec, path, variable, pointsSpent, points }) => ({
    className,
    spec,
    source: `${path}:${variable}`,
    pointsSpent,
    points,
  })),
  unsourced: UNSOURCED,
}

const target = resolve(REPO, 'src/domain/talents/talentBuilds.json')
const next = `${JSON.stringify(out, null, 2)}\n`
const previous = existsSync(target) ? readFileSync(target, 'utf8') : ''
if (previous === next) {
  console.log(`talent builds: ${builds.length} extracted, 0 written (unchanged)`)
} else {
  writeFileSync(target, next)
  console.log(`talent builds: ${builds.length} extracted, written to src/domain/talents/talentBuilds.json`)
}

for (const b of builds) {
  console.log(`  ${b.className.padEnd(8)} ${b.spec.padEnd(14)} ${String(b.pointsSpent).padStart(2)} points`)
}
if (clamped.length > 0) {
  console.log(`
${clamped.length} rank(s) clamped to the ingested tree's cap, which upstream exceeds:`)
  for (const c of clamped) console.log(`  - ${c}`)
}
console.log(`\n${UNSOURCED.length} DPS specs have no upstream preset and keep the harness's own rule: ${UNSOURCED.map((u) => `${u.className} ${u.spec}`).join(', ')}.`)
