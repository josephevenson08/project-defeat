// Extracts machine-readable talent effects from wowsims/tbc at the pinned commit.
//
// The handoff framed talent scaling as needing "an extraction or authoring step" against the 579
// ingested `rankDescriptions`, which are prose. That framing was wrong: wowsims implements talents as
// *code* at the same commit this repo already pins for items, gems, enchants, buffs and item
// effects. So this is a sibling of `ingest-item-effects.mjs` — read the upstream, take what is
// expressible, and report what is not rather than inventing a value for it.
//
// Deliberately narrow. It reads the Warrior module only, and only the talents whose effect this
// project's closed-form simulator has somewhere to put. wowsims is event-driven — auras, stacks,
// callbacks on a real timeline — so the VALUES transfer and the MECHANISMS do not. Anything needing
// a timeline is skipped by name here and, where it matters, derived analytically in the domain
// instead (Flurry is the one that earns that treatment; see `talentModifiers.ts`).
//
// Run: node tools/ingest/ingest-talent-effects.mjs [--refetch]

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const CACHE = resolve(HERE, '.cache/wowsims')

// Same pin as every other wowsims-derived dataset here. Changing it means re-running all of them.
const UPSTREAM_SHA = '3301fca59306a747e521274c36e073e69acc7b77'

const WARRIOR_SOURCES = [
  { path: 'sim/warrior/talents.go', cache: 'sim_warrior_talents.go' },
  // Endless Rage is applied at the rage bar rather than with the other talents.
  { path: 'sim/warrior/dps/dps_warrior.go', cache: 'sim_warrior_dps_dps_warrior.go' },
  // Improved Berserker Rage lives with the ability it modifies, not in talents.go.
  { path: 'sim/warrior/berserker_rage.go', cache: 'sim_warrior_berserker_rage.go' },
]

const refetch = process.argv.includes('--refetch')

async function readSource({ path, cache }) {
  const cached = resolve(CACHE, cache)
  if (!refetch && existsSync(cached)) return readFileSync(cached, 'utf8')

  const res = await fetch(`https://raw.githubusercontent.com/wowsims/tbc/${UPSTREAM_SHA}/${path}`)
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`)
  const text = await res.text()
  mkdirSync(CACHE, { recursive: true })
  writeFileSync(cached, text)
  return text
}

/*
 * One extractor per talent, each anchored to the exact line wowsims writes.
 *
 * Regex over Go source is only defensible because each pattern names a talent AND its coefficient
 * together — a pattern that drifts stops matching rather than matching something else, and an
 * unmatched extractor is reported as a failure below rather than silently contributing nothing.
 * That is the same discipline the repo's own rule about scripted edits asks for: count what changed,
 * not what you meant to change.
 */
const WARRIOR_EXTRACTORS = [
  {
    talent: 'Cruelty',
    kind: 'meleeCritChance',
    unit: 'fraction per rank',
    re: /AddStat\(stats\.MeleeCrit,\s*core\.MeleeCritRatingPerCritChance\*([\d.]+)\*float64\(warrior\.Talents\.Cruelty\)\)/,
    // The upstream multiplies a "rating per 1% chance" constant, so the captured number is percent.
    value: (m) => Number(m[1]) / 100,
  },
  {
    talent: 'Precision',
    kind: 'meleeHitChance',
    unit: 'fraction per rank',
    re: /AddStat\(stats\.MeleeHit,\s*core\.MeleeHitRatingPerHitChance\*([\d.]+)\*float64\(warrior\.Talents\.Precision\)\)/,
    value: (m) => Number(m[1]) / 100,
  },
  {
    talent: 'Weapon Mastery',
    kind: 'targetDodgeReduction',
    unit: 'fraction per rank',
    re: /PseudoStats\.DodgeReduction \+= ([\d.]+) \* float64\(warrior\.Talents\.WeaponMastery\)/,
    value: (m) => Number(m[1]),
  },
  {
    talent: 'Improved Berserker Stance',
    kind: 'attackPowerMultiplier',
    unit: 'fraction per rank',
    re: /bonus := 1 \+ ([\d.]+)\*float64\(warrior\.Talents\.ImprovedBerserkerStance\)/,
    value: (m) => Number(m[1]),
    // wowsims carries a TODO that this should only apply in Berserker Stance. Inherited knowingly.
    caveat: 'wowsims applies this unconditionally; upstream notes it should be Berserker Stance only.',
  },
  {
    talent: 'Dual Wield Specialization',
    kind: 'offHandDamageMultiplier',
    unit: 'fraction per rank',
    re: /BaseDamageFuncMeleeWeapon\(core\.OffHand, false, 0, 1\+([\d.]+)\*float64\(warrior\.Talents\.DualWieldSpecialization\), true\)/,
    value: (m) => Number(m[1]),
  },
  {
    talent: 'Two-Handed Weapon Specialization',
    kind: 'physicalDamageMultiplier',
    unit: 'fraction per rank',
    re: /PhysicalDamageDealtMultiplier \*= 1 \+ ([\d.]+)\*float64\(warrior\.Talents\.TwoHandedWeaponSpecialization\)/,
    value: (m) => Number(m[1]),
    caveat: 'Applies only while a two-handed weapon is in the main hand; upstream gates on HandType.',
  },
  {
    talent: 'Flurry',
    kind: 'flurryHaste',
    unit: 'fraction per rank',
    re: /bonus := 1 \+ ([\d.]+)\*float64\(warrior\.Talents\.Flurry\)/,
    value: (m) => Number(m[1]),
    caveat:
      'Upstream is a 3-stack aura: any melee crit sets 3 stacks, only a white hit removes one. The stack chain is solved analytically in talentModifiers.ts rather than simulated.',
  },
  {
    talent: 'Unbridled Wrath',
    kind: 'rageProcsPerMinute',
    unit: 'procs per minute per rank',
    re: /NewPPMManager\(([\d.]+)\*float64\(warrior\.Talents\.UnbridledWrath\), core\.ProcMaskMelee\)/,
    value: (m) => Number(m[1]),
    caveat: 'Each proc grants 1 rage.',
  },
  {
    talent: 'Anger Management',
    kind: 'ragePerSecondFlat',
    unit: 'rage per second (flat, not per rank)',
    // A periodic action rather than a coefficient: 1 rage every 3 seconds while in combat.
    re: /Period: time\.Second \* (\d+),\s*OnAction: func\(sim \*core\.Simulation\) \{\s*warrior\.AddRage\(sim, (\d+), rageMetrics\)/,
    value: (m) => Number(m[2]) / Number(m[1]),
    flat: true,
  },
  {
    talent: 'Endless Rage',
    kind: 'rageGeneratedMultiplier',
    unit: 'multiplier (flat, not per rank)',
    re: /EnableRageBar\([^)]*core\.TernaryFloat64\(war\.Talents\.EndlessRage, ([\d.]+), 1\)/,
    value: (m) => Number(m[1]),
    flat: true,
  },
  {
    talent: 'Improved Berserker Rage',
    kind: 'ragePerSecondFlat',
    unit: 'rage per second per rank',
    // Two anchors in one file: the per-rank rage and the cooldown it is gated behind. Both are
    // captured so the sustained rate below is derived rather than assumed — a cooldown change
    // upstream stops this matching instead of silently keeping the old rate.
    re: /rageBonus := (\d+) \* float64\(warrior\.Talents\.ImprovedBerserkerRage\)/,
    re2: /Duration: time\.Second \* (\d+),/,
    value: (m, m2) => Number(m[1]) / Number(m2[1]),
    caveat:
      'Assumes Berserker Rage is pressed on cooldown, which is what upstream does whenever rage is under 80. 5 rage per rank on a 30s cooldown.',
  },
]

/*
 * Deliberately not extracted, and why. Listed rather than omitted so a reader can tell the
 * difference between "wowsims has no such talent" and "this project has nowhere to put it".
 */
const WARRIOR_SKIPPED = [
  ['Deep Wounds', 'A bleed proc on crit — a damage-over-time source, not a stat, and the simulator has no DoT layer for physical specials.'],
  ['Death Wish', 'An activated cooldown. Uptime depends on fight length and usage policy, neither of which this model has.'],
  ['Rampage', 'Stacking on-hit attack power. Needs a timeline to build stacks.'],
  ['Enrage', 'Triggers on being crit by the target — the model has no incoming-damage stream for a DPS.'],
  ['Sweeping Strikes', 'Extra targets. Single-target model.'],
  ['Blood Frenzy', 'A debuff on the target rather than a change to the player.'],
  ['Mace/Sword/Poleaxe Specialization', 'Weapon-type gated, and the mace one is a stun proc. Would need per-weapon-type dispatch that nothing else needs yet.'],
  ['Impale', 'Raises the crit damage bonus of abilities only. Real, but it belongs with the special-attack table rather than the white-swing modifiers this pass covers.'],
  ['Toughness / Vitality / Anticipation / Deflection / Defiance / Shield Mastery / Shield Specialization', 'Tank talents. Expressible, but out of scope for a pass whose falsification test is a Fury DPS number.'],
]

const ROGUE_SOURCES = [{ path: 'sim/rogue/talents.go', cache: 'sim_rogue_talents.go' }]

/*
 * Rogue. Every value here lands on a field Warrior already established, which is the point: adding a
 * class is adding extractors, not machinery. Talent ids are globally unique Wowhead ids, so effects
 * from every class share one list and `deriveTalentModifiers` needed no change at all.
 */
const ROGUE_EXTRACTORS = [
  {
    talent: 'Malice',
    kind: 'meleeCritChance',
    unit: 'fraction per rank',
    re: /AddStat\(stats\.MeleeCrit,\s*core\.MeleeCritRatingPerCritChance\*([\d.]+)\*float64\(rogue\.Talents\.Malice\)\)/,
    value: (m) => Number(m[1]) / 100,
  },
  {
    talent: 'Precision',
    kind: 'meleeHitChance',
    unit: 'fraction per rank',
    // Same talent name as the Warrior's, different tree and different id. Matched against the Rogue
    // tree below, so the two cannot be confused.
    re: /AddStat\(stats\.MeleeHit,\s*core\.MeleeHitRatingPerHitChance\*([\d.]+)\*float64\(rogue\.Talents\.Precision\)\)/,
    value: (m) => Number(m[1]) / 100,
  },
  {
    talent: 'Deadliness',
    kind: 'attackPowerMultiplier',
    unit: 'fraction per rank',
    re: /apBonus := 1 \+ ([\d.]+)\*float64\(rogue\.Talents\.Deadliness\)/,
    value: (m) => Number(m[1]),
  },
  {
    talent: 'Weapon Expertise',
    kind: 'expertiseSkill',
    unit: 'expertise skill points per rank',
    re: /AddStat\(stats\.Expertise,\s*core\.ExpertisePerQuarterPercentReduction\*([\d.]+)\*float64\(rogue\.Talents\.WeaponExpertise\)\)/,
    value: (m) => Number(m[1]),
    caveat: 'Expertise skill points, not rating — the attack table takes skill points directly.',
  },
]

const ROGUE_SKIPPED = [
  ['Vitality / Sinister Calling', 'Both multiply Agility, which cascades into attack power and crit inside calculateStats. Talents deliberately reach only the simulation, so applying these would mean re-deriving what calculateStats already derives.'],
  ['Murder', 'Gated on the target being a humanoid, beast, giant or dragonkin. Nothing here models a mob type.'],
  ['Serrated Blades', 'Grants armor penetration, which the engine genuinely does not read — it is the one stat still legitimately on the "not modelled" list.'],
  ['Combat Potency', 'Energy returned on off-hand hits. The energy budget is a flat 10/sec, with no income model to feed.'],
  ['Seal Fate / Ruthlessness / Relentless Strikes', 'Combo-point economy. There is no combo-point resource here at all.'],
  ['Adrenaline Rush / Blade Flurry / Cold Blood', 'Activated cooldowns; uptime needs a usage policy this model has none of.'],
]

const CLASSES = [
  { className: 'Warrior', talentJson: 'warriorTalents.json', sources: WARRIOR_SOURCES, extractors: WARRIOR_EXTRACTORS, skipped: WARRIOR_SKIPPED },
  { className: 'Rogue', talentJson: 'rogueTalents.json', sources: ROGUE_SOURCES, extractors: ROGUE_EXTRACTORS, skipped: ROGUE_SKIPPED },
]

const effects = []
const skippedAll = []
const failures = []

for (const entry of CLASSES) {
  const texts = await Promise.all(entry.sources.map(readSource))
  const combined = texts.map((text, i) => ({ text, path: entry.sources[i].path }))

  // Cross-check every extracted name against that class's own ingested tree, so a typo or a drifted
  // pattern fails loudly instead of producing an effect keyed to a talent that does not exist -- and
  // so a name shared between classes (Precision) cannot resolve to the wrong one.
  const tree = JSON.parse(readFileSync(resolve(REPO, `src/domain/talents/${entry.talentJson}`), 'utf8'))
  const talentsByName = new Map()
  for (const t of tree.trees) for (const talent of t.talents) talentsByName.set(talent.name, { ...talent, tree: t.spec })

  for (const extractor of entry.extractors) {
    const hit = combined.map(({ text, path }) => ({ m: text.match(extractor.re), path, text })).find((r) => r.m)
    if (!hit) {
      failures.push(`${entry.className} ${extractor.talent}: pattern did not match any source file`)
      continue
    }

    let second
    if (extractor.re2) {
      second = hit.text.match(extractor.re2)
      if (!second) {
        failures.push(`${entry.className} ${extractor.talent}: second pattern did not match in ${hit.path}`)
        continue
      }
    }

    const talent = talentsByName.get(extractor.talent)
    if (!talent) {
      failures.push(`${entry.className} ${extractor.talent}: no talent by that name in ${entry.talentJson}`)
      continue
    }

    effects.push({
      className: entry.className,
      talentId: talent.id,
      talent: extractor.talent,
      tree: talent.tree,
      maxRank: talent.maxRank,
      kind: extractor.kind,
      unit: extractor.unit,
      perRank: extractor.flat ? undefined : extractor.value(hit.m, second),
      flatValue: extractor.flat ? extractor.value(hit.m, second) : undefined,
      caveat: extractor.caveat,
      source: hit.path,
    })
  }

  for (const [talent, reason] of entry.skipped) skippedAll.push({ className: entry.className, talent, reason })
}

if (failures.length > 0) {
  console.error('REFUSING TO WRITE — some extractors did not match:')
  for (const f of failures) console.error(`  - ${f}`)
  console.error('\nThe upstream may have moved. Re-read the source before loosening a pattern.')
  process.exit(1)
}

const out = {
  $schema: 'wowsims talent-effect extraction',
  upstream: { repo: 'wowsims/tbc', sha: UPSTREAM_SHA, files: CLASSES.flatMap((c) => c.sources.map((s) => s.path)) },
  classes: CLASSES.map((c) => c.className),
  generatedBy: 'tools/ingest/ingest-talent-effects.mjs',
  effectCount: effects.length,
  effects,
  skipped: skippedAll,
}

const target = resolve(REPO, 'src/domain/talents/talentEffects.json')
const next = `${JSON.stringify(out, null, 2)}\n`
const previous = existsSync(target) ? readFileSync(target, 'utf8') : ''
if (previous === next) {
  console.log(`talent effects: ${effects.length} extracted, 0 written (unchanged)`)
} else {
  writeFileSync(target, next)
  console.log(`talent effects: ${effects.length} extracted, written to src/domain/talents/talentEffects.json`)
}

for (const e of effects) {
  const value = e.perRank !== undefined ? `${e.perRank} per rank (max ${e.maxRank})` : `${e.flatValue} flat`
  console.log(`  ${e.className.padEnd(8)} ${e.talent.padEnd(34)} ${e.kind.padEnd(26)} ${value}`)
}
console.log(`\nskipped ${skippedAll.length} talent groups across ${CLASSES.length} classes; see "skipped" in the JSON for why each one.`)
