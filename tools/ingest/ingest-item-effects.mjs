// Ingests trinket, weapon and meta-gem effects — the procs and on-use buttons — from wowsims/tbc.
//
// Why this exists: the ingested catalogue carries `stats` and nothing else, so **0 of its 4,505
// items had an effect**. Only 14 hand-curated entries did. An audit of those 14 found that *not one*
// trinket is a pure stat stick — every one carries a proc or an on-use, and two have no flat stats at
// all — so a model reading only `stats` prices that entire item class at close to zero. It leaks into
// the stat rail, which is always on screen, not just the hidden simulator.
//
// Source: wowsims/tbc `sim/common/*.go` at the same commit the item catalogue is pinned to. Two
// shapes are read, and everything else is deliberately refused rather than guessed:
//
//   NewSimpleStatOffensiveTrinketEffect(29383, stats.Stats{stats.AttackPower: 278}, time.Second*20, time.Minute*2)
//     -> an on-use: item id, stat bonus, duration, cooldown. Unambiguous.
//
//   core.NewItemEffect(27683, func(agent core.Agent) {
//       ... NewTemporaryStatsAura("Fungal Frenzy", ..., stats.Stats{stats.SpellHaste: 320}, time.Second*6)
//       icd := core.Cooldown{ Timer: ..., Duration: time.Second * 45 }
//     -> a proc: the aura gives the bonus and duration, the internal cooldown gives the rate.
//
// A block with no temporary-stats aura, or with more than one, is **not** an effect this schema can
// express — a damage proc, a mana return, a conditional against a mob type. Those are reported and
// skipped, because inventing a stat bonus for them is exactly the failure this project keeps undoing.
//
// Commented-out Go is stripped first: `melee_trinkets.go` opens with a disabled Battlemaster block
// whose item ids would otherwise parse as real effects.
//
// Run: node tools/ingest/ingest-item-effects.mjs
// Writes: src/domain/gear/itemEffects.json

import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const CACHE = resolve(HERE, '.cache/wowsims')
const OUT = resolve(REPO, 'src/domain/gear/itemEffects.json')

/** Same commit the item catalogue is pinned to, so effects and base stats describe the same items. */
const UPSTREAM_SHA = '3301fca59306a747e521274c36e073e69acc7b77'
const FILES = [
  'sim/common/melee_trinkets.go',
  'sim/common/caster_trinkets.go',
  'sim/common/melee_items.go',
  'sim/common/caster_items.go',
  'sim/common/metagems.go',
]

/** Copied from ingest-items.mjs deliberately: effects must speak the same stat language as `stats`. */
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

/** `StatBlock` has no health field — health is derived from Stamina — so this cannot be expressed. */
const UNMAPPABLE_STATS = new Set(['Health'])

async function fetchCached(path) {
  mkdirSync(CACHE, { recursive: true })
  const file = resolve(CACHE, path.replaceAll('/', '_'))
  if (existsSync(file)) return readFileSync(file, 'utf8')

  const res = await fetch(`https://raw.githubusercontent.com/wowsims/tbc/${UPSTREAM_SHA}/${path}`)
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`)
  const text = await res.text()
  writeFileSync(file, text)
  return text
}

/** Go durations are written `time.Second*20` / `time.Minute * 2`. Returns seconds. */
function parseDuration(expression) {
  const match = expression.match(/time\.(Second|Minute|Millisecond)\s*\*\s*(\d+(?:\.\d+)?)/)
  if (!match) return undefined
  const amount = Number(match[2])
  if (match[1] === 'Minute') return amount * 60
  if (match[1] === 'Millisecond') return amount / 1000
  return amount
}

/** `stats.Stats{stats.AttackPower: 278, stats.RangedAttackPower: 278}` -> {attackPower: 278, ...} */
function parseStats(expression, context, problems) {
  const bonus = {}
  let sawUnmappable = false

  for (const [, name, value] of expression.matchAll(/stats\.([A-Za-z0-9]+)\s*:\s*(-?\d+(?:\.\d+)?)/g)) {
    if (UNMAPPABLE_STATS.has(name)) {
      sawUnmappable = true
      continue
    }
    const key = STAT_MAP[name]
    if (!key) {
      problems.push(`${context}: unmapped stat "${name}" — add it to STAT_MAP rather than dropping it`)
      return undefined
    }
    bonus[key] = (bonus[key] ?? 0) + Number(value)
  }

  if (Object.keys(bonus).length === 0) return sawUnmappable ? undefined : {}
  return bonus
}

/** Strips whole-line Go comments so disabled effects never parse as real ones. */
function stripComments(text) {
  return text
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
}

/** The `// Item Name` trailing comment wowsims keeps beside each registration. */
function trailingName(line) {
  return line.match(/\/\/\s*(.+?)\s*$/)?.[1]
}

/** Reads the balanced `core.NewItemEffect(id, func(...){ ... })` body starting at `from`. */
function blockAt(text, from) {
  const open = text.indexOf('{', from)
  if (open === -1) return undefined
  let depth = 0
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++
    else if (text[i] === '}') {
      depth--
      if (depth === 0) return text.slice(open, i + 1)
    }
  }
  return undefined
}

const effects = new Map()
const skipped = []
const problems = []

for (const path of FILES) {
  const text = stripComments(await fetchCached(path))

  // 1. On-use trinkets and items. One line each, entirely unambiguous.
  for (const match of text.matchAll(
    /NewSimpleStat(?:Offensive|Defensive)?(?:Trinket)?ItemEffect\(|NewSimpleStat(?:Offensive|Defensive)TrinketEffect\(/g,
  )) {
    const line = text.slice(match.index, text.indexOf('\n', match.index))
    const id = Number(line.match(/\(\s*(\d+)/)?.[1])
    if (!Number.isInteger(id)) continue

    const statBonus = parseStats(line, `${path} item ${id}`, problems)
    const durations = [...line.matchAll(/time\.(?:Second|Minute|Millisecond)\s*\*\s*\d+/g)].map((d) => parseDuration(d[0]))
    if (!statBonus || Object.keys(statBonus).length === 0 || durations.length < 2) {
      // Distinguished, because "grants only Health" is a schema limit rather than a parse failure —
      // StatBlock derives health from Stamina and has no field of its own to put 1,750 into.
      // `parseStats` returns undefined when everything it saw was unmappable, which is exactly this
      // case — the earlier version checked for an empty object and so never fired.
      const onlyHealth = statBonus === undefined && /stats\.Health\s*:/.test(line)
      skipped.push(
        `${path} ${id} (${trailingName(line) ?? 'on-use'}): ${onlyHealth ? 'grants only Health, which StatBlock cannot express' : 'could not read stats or timings'}`,
      )
      continue
    }

    effects.set(id, {
      wowItemId: id,
      name: trailingName(line),
      kind: 'onUse',
      statBonus,
      durationSeconds: durations[0],
      cooldownSeconds: durations[1],
      source: path,
    })
  }

  // 2. Proc effects. Only the shape this schema can actually express: exactly one temporary-stats
  //    aura plus an internal cooldown. Anything else is a damage proc, a mana return or a
  //    conditional, and gets reported instead of a made-up stat bonus.
  for (const match of text.matchAll(/core\.NewItemEffect\(\s*(\d+)/g)) {
    const id = Number(match[1])
    if (effects.has(id)) continue

    const body = blockAt(text, match.index)
    if (!body) continue

    const auras = [...body.matchAll(/NewTemporaryStatsAura\(\s*"([^"]*)"[\s\S]*?(stats\.Stats\{[^}]*\})\s*,\s*(time\.[A-Za-z]+\s*\*\s*\d+)/g)]
    if (auras.length !== 1) {
      skipped.push(`${path} ${id}: ${auras.length === 0 ? 'no temporary-stats aura — not a stat proc' : `${auras.length} auras — too complex for this schema`}`)
      continue
    }

    const [, label, statsExpression, durationExpression] = auras[0]
    const statBonus = parseStats(statsExpression, `${path} item ${id}`, problems)
    const durationSeconds = parseDuration(durationExpression)
    /*
     * The rate. Two sources, and both are real numbers rather than approximations.
     *
     * An internal cooldown is the direct one. Where there is none, wowsims uses a procs-per-minute
     * manager instead — `NewPPMManager(1.0, ...)` means one proc a minute on average, so the mean
     * gap between procs is `60 / ppm` seconds. That slots straight into `effectUptime`, which is
     * already `duration / cooldown`, and it recovers effects like Madness of the Betrayer that would
     * otherwise be dropped for having no ICD at all.
     */
    const icd = body.match(/Cooldown\{[\s\S]*?Duration:\s*(time\.[A-Za-z]+\s*\*\s*\d+)/)
    const ppm = Number(body.match(/NewPPMManager\(\s*(\d+(?:\.\d+)?)/)?.[1])
    const cooldownSeconds = icd ? parseDuration(icd[1]) : ppm > 0 ? 60 / ppm : undefined

    if (!statBonus || Object.keys(statBonus).length === 0 || durationSeconds === undefined || cooldownSeconds === undefined) {
      skipped.push(`${path} ${id} (${label}): stat proc with no readable ${cooldownSeconds === undefined ? 'internal cooldown' : 'stat bonus'}`)
      continue
    }

    effects.set(id, {
      wowItemId: id,
      name: label,
      kind: 'proc',
      statBonus,
      durationSeconds,
      cooldownSeconds,
      trigger: label,
      // Recorded so a reader can tell a hard internal cooldown from a procs-per-minute average,
      // which is the difference between an exact rate and a mean one.
      rateBasis: icd ? 'internal cooldown' : `${ppm} procs per minute`,
      source: path,
    })
  }
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`PROBLEM: ${problem}`)
  throw new Error(`${problems.length} unmapped stats — refusing to write a partial mapping`)
}

const list = [...effects.values()].sort((a, b) => a.wowItemId - b.wowItemId)

const payload = {
  $schema: 'wowsims-tbc item effect ingestion',
  upstream: {
    repo: 'wowsims/tbc',
    sha: UPSTREAM_SHA,
    paths: FILES,
    license: 'MIT',
    note: 'Only effects expressible as "these stats, for this long, on this cooldown". Damage procs, mana returns and mob-type conditionals are skipped rather than approximated; see skippedCount.',
  },
  generatedBy: 'tools/ingest/ingest-item-effects.mjs',
  effectCount: list.length,
  skippedCount: skipped.length,
  effects: list,
}

mkdirSync(dirname(OUT), { recursive: true })
const next = `${JSON.stringify(payload, null, 2)}\n`
const changed = !existsSync(OUT) || readFileSync(OUT, 'utf8') !== next
if (changed) writeFileSync(OUT, next)

const onUse = list.filter((e) => e.kind === 'onUse').length
console.log(`${list.length} effects (${onUse} on-use, ${list.length - onUse} proc), ${skipped.length} skipped`)
for (const line of skipped.slice(0, 12)) console.log(`  skipped: ${line}`)
if (skipped.length > 12) console.log(`  ...and ${skipped.length - 12} more`)
console.log(changed ? `  wrote ${OUT}` : '  0 written (unchanged)')
