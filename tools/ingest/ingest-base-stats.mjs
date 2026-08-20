// Reads level-70 base stats and attribute->stat conversion rates from wowsims/tbc at the pinned
// commit, replacing six uncited lines that had been the app's only attribute conversions.
//
// Why this exists: `calculateStats` used to end with a hand-written block —
//   attackPower     += strength*2 + agility*0.35
//   spellPower      += intellect*0.8 + spirit*0.15
//   healingPower    += intellect*0.9 + spirit*0.35
//   critRating      += agility*0.1
//   spellCritRating += intellect*0.08
// None of it was sourced, and three of the five are not TBC mechanics at all:
//
//   * **Intellect and Spirit never grant spell power in TBC.** Every Int->SpellPower conversion in
//     wowsims sits behind a talent check (Lunar Guidance, Mind Mastery) and every Spirit->SpellPower
//     one behind Spiritual Guidance. There is no baseline. Those two lines were inventing 46% of a
//     Fire Mage's spell power and 52% of a Holy Priest's.
//   * **The rates are class-specific.** Strength gives 2 attack power to a Warrior and 1 to a Rogue;
//     Agility gives melee attack power only to Rogues and cat-form Druids, and *ranged* attack power
//     to Hunters. A flat `agility*0.35` matches no class.
//   * **Agility->crit is a divisor per class** (Warrior 33, Druid/Paladin/Shaman 25, Rogue/Hunter 40),
//     which makes `agility*0.1` understate melee crit by 5-7x.
//
// Three conversions were missing outright and are ingested here too: the **universal** Agility->Armor
// (2 armor a point, which nothing in the app modelled), Agility->Dodge, and Warrior Strength->Block
// Value.
//
// **What this source is and is not.** wowsims implements what it needs to simulate, so its silences
// are not game facts: it gives a Priest no Strength->AttackPower and a Rogue no Intellect->SpellCrit
// because neither matters to a Priest's healing or a Rogue's damage. Gaps are therefore left absent
// rather than filled in by guesswork — and every one of them falls in a row `statRelevance.ts`
// already hides for that spec.
//
// Base stats are **race and class** together upstream, where this app had one block per class with
// invented values (its Druid carried 72 spell power and 86 healing power; the real one carries
// none). Health and Mana are extracted upstream but skipped here and reported, because `StatBlock`
// has no field for either.
//
// Run: node tools/ingest/ingest-base-stats.mjs [--refetch]
// Writes: src/domain/character/baseStats.json

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const CACHE = resolve(HERE, '.cache/wowsims')
const OUT = resolve(REPO, 'src/domain/character/baseStats.json')
const UPSTREAM_SHA = '3301fca59306a747e521274c36e073e69acc7b77'
const refetch = process.argv.includes('--refetch')

const CLASS_FILES = {
  Druid: 'druid/druid',
  Hunter: 'hunter/hunter',
  Mage: 'mage/mage',
  Paladin: 'paladin/paladin',
  Priest: 'priest/priest',
  Rogue: 'rogue/rogue',
  Shaman: 'shaman/shaman',
  Warlock: 'warlock/warlock',
  Warrior: 'warrior/warrior',
}
/** Read for its universal dependencies (Stamina->Health, Agility->Armor), not for base stats. */
const CORE_FILE = 'core/character'
/** Cat form's Agility->AttackPower and FeralAttackPower->AttackPower are form-gated, not baseline. */
const FERAL_FILE = 'druid/feral/feral'
const CONSTANTS_FILE = 'core/constants'

/**
 * Upstream race key -> this app's `TbcRace`.
 *
 * **Troll is two keys upstream and one race here.** wowsims splits `Troll10` and `Troll30` to model
 * the two Berserking haste brackets, and assigns both the same shared `trollStats` block — so they
 * collapse to one race without losing anything. That is asserted rather than assumed: if the two
 * ever stop being identical the ingest reports it instead of letting the second silently win.
 */
const RACE_NAMES = {
  BloodElf: 'Blood Elf',
  Draenei: 'Draenei',
  Dwarf: 'Dwarf',
  Gnome: 'Gnome',
  Human: 'Human',
  NightElf: 'Night Elf',
  Orc: 'Orc',
  Tauren: 'Tauren',
  Troll: 'Troll',
  Troll10: 'Troll',
  Troll30: 'Troll',
  Undead: 'Undead',
}

/** wowsims stat name -> this app's `StatBlock` key. Anything absent here is reported, not guessed. */
const STAT_NAMES = {
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
 * Racial multipliers this app applies for itself, in `applyRacialTraits`.
 *
 * **Upstream is inconsistent about whether its base table already includes these**, and taking it at
 * face value would double-count. It divides Gnome's +5% Intellect out and says so in a comment —
 * "Gnomes start with 162 int, we assume this include racial so / 1.05" — but leaves Human's +10%
 * Spirit baked into five of the six Human rows, while applying the multiplier again in
 * `sim/core/racials.go`. A Human Priest's Spirit would read 21% high here.
 *
 * The evidence is per-row and unambiguous: across Mage, Priest, Warlock, Warrior and Paladin, every
 * Human attribute *except* Spirit sits within about 1% of the class's other races, while Spirit sits
 * 7-9% above — and the Human Rogue row, the one upstream did normalise, sits at -1.7%. Race base-stat
 * differences in WoW are small integers, not eight percent of a single stat.
 *
 * So each row is decided on its own evidence rather than by a blanket rule: divide only where the
 * row already sits at the multiplier against its peers, and report every decision either way, so a
 * correction to a source can never happen quietly.
 */
const SELF_APPLIED_RACIALS = [{ race: 'Human', stat: 'spirit', multiplier: 1.1, racial: 'The Human Spirit' }]

/**
 * How close a row's ratio to its peers must sit to the racial multiplier before it is treated as
 * baked in. Human Spirit measures 1.089, 1.102, 1.096, 1.087 and 1.067 across the five affected
 * classes, and exactly 1.000 for Rogue — so this window catches every inflated row and excludes the
 * one upstream already normalised, with a wide margin either side.
 */
const BAKED_IN_TOLERANCE = 0.04

/**
 * **Gnome's +5% Intellect is deliberately not in that list, and the measurement is why.** Upstream
 * applies it in `racials.go` exactly as it applies Human's, so the same double-count looked likely —
 * but the Gnome rows measure 1.022 (Mage), 1.083 (Warlock), 1.184 (Rogue) and 1.206 (Warrior) against
 * their peers. That scatter is not one multiplier applied inconsistently; it is what a genuine racial
 * base bonus looks like on small integers, where a flat +7 Intellect on a Warrior's 31 reads as +21%.
 * The Mage row, the one upstream states it divided by 1.05, is the *lowest* of the four.
 *
 * A "divide when it moves closer to the peer median" rule was tried first and would have wrongly
 * divided three of those four. Correcting a source needs evidence for the specific row, not a
 * plausible rule.
 */

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

function normaliseSelfAppliedRacials(baseStats, report) {
  for (const { race, stat, multiplier, racial } of SELF_APPLIED_RACIALS) {
    for (const [className, byRace] of Object.entries(baseStats)) {
      const block = byRace[race]
      if (!block || block[stat] === undefined) continue

      const peers = Object.entries(byRace)
        .filter(([peerRace]) => peerRace !== race)
        .map(([, peerBlock]) => peerBlock[stat] ?? 0)
      if (peers.length === 0) {
        report.racialNormalisation.push(`${className}/${race} ${stat}: no peer race to compare against, left at ${block[stat]}`)
        continue
      }

      const peerMedian = median(peers)
      const ratio = peerMedian === 0 ? 0 : block[stat] / peerMedian

      if (Math.abs(ratio - multiplier) <= BAKED_IN_TOLERANCE) {
        const before = block[stat]
        block[stat] = Number((before / multiplier).toFixed(4))
        report.racialNormalisation.push(
          `${className}/${race} ${stat} ${before} -> ${block[stat]} — upstream baked ${racial} (x${multiplier}) in; peers median ${peerMedian}, ratio ${ratio.toFixed(3)}`,
        )
      } else {
        report.racialNormalisation.push(
          `${className}/${race} ${stat} ${block[stat]} left as-is, already free of ${racial}; peers median ${peerMedian}, ratio ${ratio.toFixed(3)}`,
        )
      }
    }
  }
}

async function readSource(path) {
  const cached = resolve(CACHE, `sim_${path.replaceAll('/', '_')}.go`)
  if (!refetch && existsSync(cached)) return readFileSync(cached, 'utf8')

  const res = await fetch(`https://raw.githubusercontent.com/wowsims/tbc/${UPSTREAM_SHA}/sim/${path}.go`)
  if (!res.ok) throw new Error(`sim/${path}.go -> HTTP ${res.status}`)
  const text = await res.text()
  mkdirSync(CACHE, { recursive: true })
  writeFileSync(cached, text)
  return text
}

/** The rating-per-1% constants the base-stat and dependency expressions multiply through. */
function parseRatingConstants(source) {
  const constants = {}
  for (const match of source.matchAll(/const\s+(\w+RatingPer\w+)\s*=\s*([\d.]+)/g)) {
    constants[match[1]] = Number(match[2])
  }
  if (Object.keys(constants).length === 0) throw new Error('no rating constants found in sim/core/constants.go')
  return constants
}

/**
 * Upstream writes a rating either as a bare number already in rating (`stats.SpellCrit: 40.66`) or
 * as a percentage times its constant (`0.96 * core.MeleeCritRatingPerCritChance`). Both mean rating,
 * so both are resolved to it. Anything else is refused rather than approximated.
 */
function evaluateValue(expression, constants) {
  const text = expression.trim()

  if (/^-?[\d.]+$/.test(text)) return Number(text)

  // Both operand orders appear upstream — the Warrior file writes `1.14 * core.Melee…`, the Priest
  // file writes `core.SpellCrit… * 1.24`. Reading only the first shape silently dropped every
  // Priest's and Mage's base spell crit.
  const numberFirst = text.match(/^(-?[\d.]+)\s*\*\s*core\.(\w+)$/)
  if (numberFirst && constants[numberFirst[2]] !== undefined) return Number(numberFirst[1]) * constants[numberFirst[2]]

  const constantFirst = text.match(/^core\.(\w+)\s*\*\s*(-?[\d.]+)$/)
  if (constantFirst && constants[constantFirst[1]] !== undefined) return Number(constantFirst[2]) * constants[constantFirst[1]]

  return undefined
}

function parseStatBody(body, label, constants, report) {
  const stats = {}
  for (const line of body.matchAll(/stats\.(\w+):\s*([^,\n]+),/g)) {
    const key = STAT_NAMES[line[1]]
    if (!key) {
      report.skippedStats.add(line[1])
      continue
    }
    const value = evaluateValue(line[2].replace(/\/\/.*$/, ''), constants)
    if (value === undefined) {
      report.unparsedValues.push(`${label} ${line[1]} = ${line[2].trim()}`)
      continue
    }
    if (value !== 0) stats[key] = Number(value.toFixed(4))
  }
  return stats
}

function parseBaseStats(source, className, constants, report) {
  /*
   * A block is assigned either inline as `= stats.Stats{…}` or by naming a local that was declared
   * earlier in the same function — `trollStats := stats.Stats{…}`, the only such local upstream.
   * Reading inline blocks alone lost exactly the six classes a Troll can be.
   */
  const locals = {}
  for (const declaration of source.matchAll(/(\w+)\s*:=\s*stats\.Stats\{([\s\S]*?)\n\t\}/g)) {
    locals[declaration[1]] = parseStatBody(declaration[2], `${className}/${declaration[1]}`, constants, report)
  }

  const blocks = source.matchAll(
    /core\.BaseStats\[core\.BaseStatsKey\{Race:\s*proto\.Race_Race(\w+),\s*Class:\s*proto\.Class_Class(\w+)\}\]\s*=\s*(stats\.Stats\{[\s\S]*?\n\t\}|\w+)/g,
  )

  const byRace = {}
  for (const [, rawRace, rawClass, assigned] of blocks) {
    if (rawClass !== className) {
      report.mismatchedClass.push(`${className} file declares ${rawClass}`)
      continue
    }
    const race = RACE_NAMES[rawRace]
    if (!race) {
      report.unknownRaces.push(`${className}/${rawRace}`)
      continue
    }

    let stats
    if (assigned.startsWith('stats.Stats{')) {
      stats = parseStatBody(assigned, `${className}/${race}`, constants, report)
    } else if (locals[assigned]) {
      stats = locals[assigned]
    } else {
      report.unresolvedAssignments.push(`${className}/${rawRace} = ${assigned}`)
      continue
    }

    // Two upstream race keys collapsing to one here (Troll10/Troll30) must agree, or the second
    // would silently overwrite the first with different numbers and nothing would say so.
    const existing = byRace[race]
    if (existing && JSON.stringify(existing) !== JSON.stringify(stats)) {
      report.conflictingRaces.push(`${className}/${race} (${rawRace}) disagrees with the block already read`)
      continue
    }
    byRace[race] = stats
  }
  return byRace
}

/**
 * Reads `AddStatDependency` blocks. Three expression shapes appear upstream and all three are
 * exact; a fourth is refused by name rather than approximated:
 *   `attackPower + strength*2`                                   -> 2 per point
 *   `blockValue + strength/20`                                   -> 1/20 per point
 *   `meleecrit + (agility/33)*core.MeleeCritRatingPerCritChance`  -> constant/33 per point
 */
function parseDependencies(source, constants, report, label) {
  const found = []
  const blocks = source.matchAll(
    /AddStatDependency\(stats\.StatDependency\{\s*SourceStat:\s*stats\.(\w+),\s*ModifiedStat:\s*stats\.(\w+),[\s\S]*?return\s+([^\n]+)\n/g,
  )

  for (const [, rawSource, rawModified, rawReturn] of blocks) {
    const from = STAT_NAMES[rawSource]
    const to = STAT_NAMES[rawModified]
    const upstream = rawReturn.trim()
    if (!from || !to) {
      report.skippedDependencies.push(`${label}: ${rawSource} -> ${rawModified} (${upstream})`)
      continue
    }

    const lower = rawSource.charAt(0).toLowerCase() + rawSource.slice(1)
    let perPoint

    const multiplied = upstream.match(new RegExp(`^\\w+ \\+ ${lower}\\*(-?[\\d.]+)$`, 'i'))
    if (multiplied) perPoint = Number(multiplied[1])

    const divided = upstream.match(new RegExp(`^\\w+ \\+ ${lower}/(-?[\\d.]+)$`, 'i'))
    if (perPoint === undefined && divided) perPoint = 1 / Number(divided[1])

    const rated = upstream.match(new RegExp(`^\\w+ \\+ \\(${lower}/(-?[\\d.]+)\\)\\*core\\.(\\w+)$`, 'i'))
    if (perPoint === undefined && rated && constants[rated[2]] !== undefined) {
      perPoint = constants[rated[2]] / Number(rated[1])
    }

    if (perPoint === undefined) {
      report.unparsedDependencies.push(`${label}: ${from} -> ${to} = ${upstream}`)
      continue
    }
    found.push({ from, to, perPoint: Number(perPoint.toFixed(6)), upstream })
  }
  return found
}

const report = {
  skippedStats: new Set(),
  skippedDependencies: [],
  unparsedValues: [],
  unparsedDependencies: [],
  unknownRaces: [],
  mismatchedClass: [],
  unresolvedAssignments: [],
  conflictingRaces: [],
  racialNormalisation: [],
}

const constants = parseRatingConstants(await readSource(CONSTANTS_FILE))

const baseStats = {}
const conversions = {}
for (const [className, path] of Object.entries(CLASS_FILES)) {
  const source = await readSource(path)
  baseStats[className] = parseBaseStats(source, className, constants, report)
  conversions[className] = parseDependencies(source, constants, report, className)
}

normaliseSelfAppliedRacials(baseStats, report)

const universal = parseDependencies(await readSource(CORE_FILE), constants, report, 'universal')

/*
 * Cat form is read whole rather than in part. Upstream writes it as three lines under one comment —
 * "Cat Form adds (2 x Level) AP + 1 AP per Agi" — a flat `AddStat(stats.AttackPower, 140)` plus the
 * two dependencies. Taking the per-point rates and dropping the flat 140 would be cherry-picking one
 * source, and would understate every Feral druid by exactly that much.
 */
const feralSource = await readSource(FERAL_FILE)
const feral = parseDependencies(feralSource, constants, report, 'druid cat form')
const feralFlat = {}
for (const call of feralSource.matchAll(/\bcat\.AddStat\(stats\.(\w+),\s*(-?[\d.]+)\)/g)) {
  const key = STAT_NAMES[call[1]]
  if (!key) {
    report.skippedStats.add(call[1])
    continue
  }
  feralFlat[key] = (feralFlat[key] ?? 0) + Number(call[2])
}

const output = {
  $comment: 'GENERATED by tools/ingest/ingest-base-stats.mjs — do not edit by hand.',
  source: `wowsims/tbc @${UPSTREAM_SHA}`,
  ratingConstants: constants,
  /** Base stats at level 70, keyed class -> race. Zero-valued stats are omitted. */
  baseStats,
  /** Baseline attribute conversions, per class. A class missing one simply does not have it upstream. */
  conversions,
  /** Applies to every class. */
  universalConversions: universal,
  /**
   * Cat form only. Kept separate from `conversions.Druid` because it is gated on a shapeshift, the
   * same way `feralAttackPower` already is in `calculateStats`.
   */
  druidCatFormConversions: feral,
  /** Cat form's flat additions — `(2 x Level)` attack power at 70, from the same three-line block. */
  druidCatFormFlatStats: feralFlat,
}

mkdirSync(dirname(OUT), { recursive: true })
const serialized = `${JSON.stringify(output, null, 2)}\n`
const unchanged = existsSync(OUT) && readFileSync(OUT, 'utf8') === serialized
writeFileSync(OUT, serialized)

const raceCount = Object.values(baseStats).reduce((total, byRace) => total + Object.keys(byRace).length, 0)
const conversionCount = Object.values(conversions).reduce((total, list) => total + list.length, 0)
console.log(`${unchanged ? '0 written (unchanged)' : 'written'}: ${OUT.replace(REPO, '.')}`)
console.log(`  ${raceCount} race+class base stat blocks across ${Object.keys(baseStats).length} classes`)
console.log(`  ${conversionCount} class conversions, ${universal.length} universal, ${feral.length} druid cat form`)
console.log(`  druid cat form flat: ${Object.entries(feralFlat).map(([key, value]) => `${key} +${value}`).join(', ') || 'none'}`)
if (report.skippedStats.size > 0) console.log(`  skipped (no StatBlock field): ${[...report.skippedStats].join(', ')}`)
for (const [label, list] of Object.entries(report)) {
  if (label === 'skippedStats' || list.length === 0) continue
  console.log(`  ${label}:`)
  for (const entry of list) console.log(`    ${entry}`)
}
