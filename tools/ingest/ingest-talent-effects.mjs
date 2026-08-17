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

const SOURCES = [
  { path: 'sim/warrior/talents.go', cache: 'sim_warrior_talents.go' },
  // Endless Rage is applied at the rage bar rather than with the other talents.
  { path: 'sim/warrior/dps/dps_warrior.go', cache: 'sim_warrior_dps_dps_warrior.go' },
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
const EXTRACTORS = [
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
]

/*
 * Deliberately not extracted, and why. Listed rather than omitted so a reader can tell the
 * difference between "wowsims has no such talent" and "this project has nowhere to put it".
 */
const SKIPPED = [
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

const sources = await Promise.all(SOURCES.map(readSource))
const combined = sources.map((text, i) => ({ text, path: SOURCES[i].path }))

// Cross-check every extracted name against the already-ingested talent tree, so a typo or a drifted
// pattern fails loudly instead of producing an effect keyed to a talent that does not exist.
const tree = JSON.parse(readFileSync(resolve(REPO, 'src/domain/talents/warriorTalents.json'), 'utf8'))
const talentsByName = new Map()
for (const t of tree.trees) for (const talent of t.talents) talentsByName.set(talent.name, { ...talent, tree: t.spec })

const effects = []
const failures = []

for (const extractor of EXTRACTORS) {
  const hit = combined.map(({ text, path }) => ({ m: text.match(extractor.re), path })).find((r) => r.m)
  if (!hit) {
    failures.push(`${extractor.talent}: pattern did not match any source file`)
    continue
  }

  const talent = talentsByName.get(extractor.talent)
  if (!talent) {
    failures.push(`${extractor.talent}: no talent by that name in warriorTalents.json`)
    continue
  }

  effects.push({
    talentId: talent.id,
    talent: extractor.talent,
    tree: talent.tree,
    maxRank: talent.maxRank,
    kind: extractor.kind,
    unit: extractor.unit,
    perRank: extractor.flat ? undefined : extractor.value(hit.m),
    flatValue: extractor.flat ? extractor.value(hit.m) : undefined,
    caveat: extractor.caveat,
    source: hit.path,
  })
}

if (failures.length > 0) {
  console.error('REFUSING TO WRITE — some extractors did not match:')
  for (const f of failures) console.error(`  - ${f}`)
  console.error('\nThe upstream may have moved. Re-read the source before loosening a pattern.')
  process.exit(1)
}

const out = {
  $schema: 'wowsims talent-effect extraction',
  upstream: { repo: 'wowsims/tbc', sha: UPSTREAM_SHA, files: SOURCES.map((s) => s.path) },
  className: 'Warrior',
  generatedBy: 'tools/ingest/ingest-talent-effects.mjs',
  effectCount: effects.length,
  effects,
  skipped: SKIPPED.map(([talent, reason]) => ({ talent, reason })),
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
  console.log(`  ${e.talent.padEnd(34)} ${e.kind.padEnd(26)} ${value}`)
}
console.log(`\nskipped ${SKIPPED.length} talent groups the closed-form model has nowhere to put; see "skipped" in the JSON.`)
