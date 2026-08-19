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
    kind: 'twoHandedDamageMultiplier',
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
  /*
   * The tank three, added once `calculateTankSurvivability` could receive talents. All land inside
   * that function's own arithmetic, which is what makes them safe to take: Anticipation moves the
   * Defense skill figure the table already derives from rating, and the other two move a single
   * avoidance term each.
   *
   * Toughness and Vitality are deliberately NOT here. They multiply armour, stamina and strength,
   * which `calculateStats` owns — reaching them means talents reaching the always-visible stat rail,
   * gear rankings and the upgrade finder, which is a product decision this repo has explicitly
   * reserved for its owner. They are refused by name below with that reason.
   */
  {
    talent: 'Deflection',
    kind: 'parryChance',
    unit: 'fraction per rank',
    re: /AddStat\(stats\.Parry,\s*core\.ParryRatingPerParryChance\*([\d.]+)\*float64\(warrior\.Talents\.Deflection\)\)/,
    value: (m) => Number(m[1]) / 100,
  },
  {
    talent: 'Anticipation',
    kind: 'defenseSkill',
    unit: 'Defense skill points per rank',
    // The most valuable of the three by a distance: one Defense skill point moves miss, dodge, parry,
    // block AND the boss's crit chance, all at once.
    re: /AddStat\(stats\.Defense,\s*core\.DefenseRatingPerDefense\*([\d.]+)\*float64\(warrior\.Talents\.Anticipation\)\)/,
    value: (m) => Number(m[1]),
  },
  {
    talent: 'Shield Specialization',
    kind: 'blockChance',
    unit: 'fraction per rank',
    // Warrior's raises block CHANCE. Paladin's talent of the same name raises block VALUE, which this
    // model does not track at all, so it is refused there rather than mapped onto this field.
    re: /AddStat\(stats\.Block,\s*core\.BlockRatingPerBlockChance\*([\d.]+)\*float64\(warrior\.Talents\.ShieldSpecialization\)\)/,
    value: (m) => Number(m[1]) / 100,
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
  ['Toughness / Vitality', 'Multiply armour, stamina and strength, which calculateStats owns. Taking them means talents reaching the always-visible stat rail, gear rankings and the upgrade finder — a product decision reserved for the repo owner, not an ingest.'],
  ['Defiance', 'Grants expertise, which is a threat and hit-table term on the attacking side. The tank path scores survivability and never rolls the player\'s own attack table.'],
  ['Shield Mastery', 'Raises block VALUE. The incoming-attack table models block as a chance and does not track how much a block absorbs, so there is nothing for this to change.'],
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

const HUNTER_SOURCES = [{ path: 'sim/hunter/talents.go', cache: 'sim_hunter_talents.go' }]

/*
 * Hunter. The only class whose specs all run the RANGED branch, so its effects land on ranged fields
 * rather than the melee ones — Serpent's Swiftness is the big one at +4% ranged attack speed a rank.
 *
 * Every pet talent is refused: there is no pet in this model at all, and Beast Mastery's real edge
 * lives there, which the spec's own note already says.
 */
const HUNTER_EXTRACTORS = [
  {
    talent: 'Killer Instinct',
    kind: 'meleeCritChance',
    unit: 'fraction per rank',
    re: /AddStat\(stats\.MeleeCrit,\s*core\.MeleeCritRatingPerCritChance\*([\d.]+)\*float64\(hunter\.Talents\.KillerInstinct\)\)/,
    value: (m) => Number(m[1]) / 100,
    caveat: 'Upstream files this under MeleeCrit; the ranged attack table reads the same crit figure.',
  },
  {
    talent: 'Surefooted',
    kind: 'meleeHitChance',
    unit: 'fraction per rank',
    re: /AddStat\(stats\.MeleeHit,\s*core\.MeleeHitRatingPerHitChance\*([\d.]+)\*float64\(hunter\.Talents\.Surefooted\)\)/,
    value: (m) => Number(m[1]) / 100,
  },
  {
    talent: 'Lethal Shots',
    kind: 'rangedCritChance',
    unit: 'fraction per rank',
    re: /PseudoStats\.BonusRangedCritRating \+= ([\d.]+) \* float64\(hunter\.Talents\.LethalShots\) \* core\.MeleeCritRatingPerCritChance/,
    value: (m) => Number(m[1]) / 100,
    caveat: 'Ranged crit only, which is why it is a separate field from the melee crit above.',
  },
  {
    talent: 'Ranged Weapon Specialization',
    kind: 'rangedDamageMultiplier',
    unit: 'fraction per rank',
    re: /PseudoStats\.RangedDamageDealtMultiplier \*= 1 \+ ([\d.]+)\*float64\(hunter\.Talents\.RangedWeaponSpecialization\)/,
    value: (m) => Number(m[1]),
  },
  {
    talent: "Serpent's Swiftness",
    kind: 'rangedAttackSpeedMultiplier',
    unit: 'fraction per rank',
    re: /PseudoStats\.RangedSpeedMultiplier \*= 1 \+ ([\d.]+)\*float64\(hunter\.Talents\.SerpentsSwiftness\)/,
    value: (m) => Number(m[1]),
    caveat: 'Also speeds the pet in upstream; there is no pet here, so only the hunter half applies.',
  },
]

const HUNTER_SKIPPED = [
  ['Ferocity / Animal Handler / Unleashed Fury / Frenzy / Focused Fire / The Beast Within', 'Pet talents. There is no pet in this model, which is also why Beast Mastery is the spec its own note flags as most understated.'],
  ['Combat Experience / Survivalist', 'Multiply Agility and Health, which cascade inside calculateStats. Talents deliberately reach only the simulation.'],
  ['Mortal Shots', 'Raises the crit damage bonus of ranged attacks. Real, but it belongs with the crit-damage term rather than the white-damage multipliers this pass covers.'],
  ['Expose Weakness', 'Grants attack power to the raid, not to the hunter. It is a raid buff wearing a talent costume.'],
  ['Master Tactician / Thrill of the Hunt / Readiness', 'Procs and cooldowns needing a timeline.'],
]

const SHAMAN_SOURCES = [{ path: 'sim/shaman/talents.go', cache: 'sim_shaman_talents.go' }]

/*
 * Shaman. Two of these share a NAME with a Warrior talent and do something completely different --
 * Weapon Mastery is physical damage here and dodge reduction there, Dual Wield Specialization is hit
 * here and off-hand damage there. Keying effects by class-checked talent id rather than by name is
 * what stops one silently becoming the other.
 */
const SHAMAN_EXTRACTORS = [
  {
    talent: 'Thundering Strikes',
    kind: 'meleeCritChance',
    unit: 'fraction per rank',
    re: /AddStat\(stats\.MeleeCrit,\s*core\.MeleeCritRatingPerCritChance\*([\d.]+)\*float64\(shaman\.Talents\.ThunderingStrikes\)\)/,
    value: (m) => Number(m[1]) / 100,
  },
  {
    talent: "Nature's Guidance",
    kind: 'meleeHitChance',
    unit: 'fraction per rank',
    re: /AddStat\(stats\.MeleeHit,\s*float64\(shaman\.Talents\.NaturesGuidance\)\*([\d.]+)\*core\.MeleeHitRatingPerHitChance\)/,
    value: (m) => Number(m[1]) / 100,
  },
  {
    talent: 'Weapon Mastery',
    kind: 'physicalDamageMultiplier',
    unit: 'fraction per rank',
    // NOT the Warrior talent of the same name, which reduces the target's dodge instead.
    re: /PseudoStats\.PhysicalDamageDealtMultiplier \*= 1 \+ ([\d.]+)\*float64\(shaman\.Talents\.WeaponMastery\)/,
    value: (m) => Number(m[1]),
  },
  {
    talent: 'Dual Wield Specialization',
    kind: 'meleeHitChance',
    unit: 'fraction per rank',
    // NOT the Warrior talent of the same name, which raises off-hand damage instead.
    re: /AddStat\(stats\.MeleeHit,\s*core\.MeleeHitRatingPerHitChance\*([\d.]+)\*float64\(shaman\.Talents\.DualWieldSpecialization\)\)/,
    value: (m) => Number(m[1]) / 100,
  },
  {
    talent: "Nature's Guidance",
    kind: 'spellHitChance',
    unit: 'fraction per rank',
    // The same talent already extracted for melee hit, one line above it upstream. Enhancement reads
    // the melee half and Elemental and Restoration read this one.
    re: /AddStat\(stats\.SpellHit,\s*float64\(shaman\.Talents\.NaturesGuidance\)\*([\d.]+)\*core\.SpellHitRatingPerHitChance\)/,
    value: (m) => Number(m[1]) / 100,
  },
]

const SHAMAN_SKIPPED = [
  ['Toughness / Anticipation / Shield Specialization', 'Tank-facing armour, dodge and block. Expressible, but talents reach the damage path only.'],
  ['Elemental Fury / Concussion / Call of Thunder', 'Spell-side talents, and calculateCasterDps takes no talents yet.'],
  ['Flurry', 'Shaman has its own Flurry at a different rank scale; the analytic derivation is Warrior-shaped and would need re-checking against the Shaman ranks before being reused.'],
  ['Shamanistic Rage / Stormstrike cooldowns', 'Activated abilities needing a usage policy.'],
]

const DRUID_SOURCES = [{ path: 'sim/druid/talents.go', cache: 'sim_druid_talents.go' }]

const DRUID_EXTRACTORS = [
  {
    talent: 'Sharpened Claws',
    kind: 'meleeCritChance',
    unit: 'fraction per rank',
    re: /AddStat\(stats\.MeleeCrit,\s*float64\(druid\.Talents\.SharpenedClaws\)\*([\d.]+)\*core\.MeleeCritRatingPerCritChance\)/,
    value: (m) => Number(m[1]) / 100,
  },
  {
    talent: 'Naturalist',
    kind: 'physicalDamageMultiplier',
    unit: 'fraction per rank',
    re: /PseudoStats\.PhysicalDamageDealtMultiplier \*= 1 \+ ([\d.]+)\*float64\(druid\.Talents\.Naturalist\)/,
    value: (m) => Number(m[1]),
  },
  {
    talent: 'Predatory Strikes',
    kind: 'flatAttackPower',
    unit: 'attack power per rank',
    // Scaled by character level upstream: rank * 0.5 * CharacterLevel. This project is level-70 only
    // (PLAYER_LEVEL in calculateSimulation), so the level is folded in here rather than carried as a
    // second variable nothing else would use.
    re: /AddStat\(stats\.AttackPower,\s*float64\(druid\.Talents\.PredatoryStrikes\)\*([\d.]+)\*float64\(core\.CharacterLevel\)\)/,
    value: (m) => Number(m[1]) * 70,
    caveat: 'Upstream scales by character level; folded in at 70, which is the only level this app models.',
  },
  {
    talent: 'Balance of Power',
    kind: 'spellHitChance',
    unit: 'fraction per rank',
    // Two percent per rank, not one -- the only spell-hit talent in this ingest that is not 1%/rank.
    re: /AddStat\(stats\.SpellHit,\s*float64\(druid\.Talents\.BalanceOfPower\)\*([\d.]+)\*core\.SpellHitRatingPerHitChance\)/,
    value: (m) => Number(m[1]) / 100,
  },
  {
    talent: 'Natural Perfection',
    kind: 'spellCritChance',
    unit: 'fraction per rank',
    re: /AddStat\(stats\.SpellCrit,\s*float64\(druid\.Talents\.NaturalPerfection\)\*([\d.]+)\*core\.SpellCritRatingPerCritChance\)/,
    value: (m) => Number(m[1]) / 100,
  },
  {
    talent: 'Intensity',
    kind: 'spiritRegenWhileCasting',
    unit: 'fraction of Spirit regen retained while casting, per rank',
    re: /PseudoStats\.SpiritRegenRateCasting = float64\(druid\.Talents\.Intensity\) \* ([\d.]+)/,
    value: (m) => Number(m[1]),
  },
]

const DRUID_SKIPPED = [
  ['Subtlety', 'Reduces threat, which nothing here scores.'],
  ['Survival of the Fittest / Thick Hide', 'Tank-facing crit-taken and armour. Talents reach the damage path only.'],
  ['Heart of the Wild / Furor', 'Multiply Strength, Intellect or the form itself, cascading through calculateStats.'],
  ['Moonkin Form / Tree of Life', 'Shapeshifts with party-wide effects; neither the form nor the party is modelled.'],
  ['Omen of Clarity / Primal Fury', 'Proc-driven energy and combo points, needing a timeline.'],
]

const PALADIN_SOURCES = [{ path: 'sim/paladin/talents.go', cache: 'sim_paladin_talents.go' }]

/*
 * Paladin. Its lines carry no explicit coefficient -- upstream writes
 * `MeleeCritRatingPerCritChance*float64(Talents.X)` with the multiplier omitted, which means 1, i.e.
 * one percent per rank. The patterns therefore anchor on the talent AND the rating constant with
 * nothing between them, so a coefficient appearing later stops the match rather than being ignored.
 */
const PALADIN_EXTRACTORS = [
  {
    talent: 'Sanctified Seals',
    kind: 'meleeCritChance',
    unit: 'fraction per rank (implied coefficient of 1 upstream)',
    re: /AddStat\(stats\.MeleeCrit,\s*core\.MeleeCritRatingPerCritChance\*float64\(paladin\.Talents\.SanctifiedSeals\)\)/,
    value: () => 0.01,
    caveat: 'Upstream omits the coefficient, which means 1 -- one percent of crit chance per rank.',
  },
  {
    talent: 'Conviction',
    kind: 'meleeCritChance',
    unit: 'fraction per rank (implied coefficient of 1 upstream)',
    re: /AddStat\(stats\.MeleeCrit,\s*core\.MeleeCritRatingPerCritChance\*float64\(paladin\.Talents\.Conviction\)\)/,
    value: () => 0.01,
    caveat: 'Upstream omits the coefficient, which means 1.',
  },
  {
    talent: 'Precision',
    kind: 'meleeHitChance',
    unit: 'fraction per rank (implied coefficient of 1 upstream)',
    // The THIRD class with a talent called Precision. Same effect as the other two, different id.
    re: /AddStat\(stats\.MeleeHit,\s*core\.MeleeHitRatingPerHitChance\*float64\(paladin\.Talents\.Precision\)\)/,
    value: () => 0.01,
    caveat: 'Upstream omits the coefficient, which means 1.',
  },
  /*
   * Paladin's two hit/crit talents each grant the **spell** side as well, on the very next line
   * upstream. Retribution never sees these -- it is scored on the physical path -- but Holy is, and
   * a Holy Paladin taking Sanctified Seals is taking spell crit whether or not anything reads it.
   */
  {
    talent: 'Sanctified Seals',
    kind: 'spellCritChance',
    unit: 'fraction per rank (implied coefficient of 1 upstream)',
    re: /AddStat\(stats\.SpellCrit,\s*core\.SpellCritRatingPerCritChance\*float64\(paladin\.Talents\.SanctifiedSeals\)\)/,
    value: () => 0.01,
    caveat: 'Upstream omits the coefficient, which means 1.',
  },
  {
    talent: 'Deflection',
    kind: 'parryChance',
    unit: 'fraction per rank',
    re: /AddStat\(stats\.Parry,\s*core\.ParryRatingPerParryChance\*([\d.]+)\*float64\(paladin\.Talents\.Deflection\)\)/,
    value: (m) => Number(m[1]) / 100,
  },
  {
    talent: 'Anticipation',
    kind: 'defenseSkill',
    unit: 'Defense skill points per rank',
    re: /AddStat\(stats\.Defense,\s*core\.DefenseRatingPerDefense\*([\d.]+)\*float64\(paladin\.Talents\.Anticipation\)\)/,
    value: (m) => Number(m[1]),
  },
  {
    talent: 'Precision',
    kind: 'spellHitChance',
    unit: 'fraction per rank (implied coefficient of 1 upstream)',
    re: /AddStat\(stats\.SpellHit,\s*core\.SpellHitRatingPerHitChance\*float64\(paladin\.Talents\.Precision\)\)/,
    value: () => 0.01,
    caveat: 'Upstream omits the coefficient, which means 1.',
  },
]

const PALADIN_SKIPPED = [
  ['Divine Strength', 'Multiplies Strength, which cascades into attack power inside calculateStats.'],
  ['Spell Warding / Improved Righteous Fury', 'Damage-taken reduction; no incoming-damage stream on the damage path.'],
  ['Vengeance / Sanctity Aura', 'Proc-driven and aura damage multipliers that need a timeline or a party.'],
  ['Crusade', 'Gated on the target being a humanoid, demon, undead or elemental. No mob type here.'],
  ['Toughness', 'Multiplies item armour, which calculateStats owns — the same reason Warrior\'s is refused. Reaching it is a product decision about the stat rail, not an ingest.'],
  ['Shield Specialization', 'Paladin\'s raises block VALUE, unlike the Warrior talent of the same name which raises block CHANCE. The incoming-attack table tracks the chance only, so there is nothing here to change.'],
]

/*
 * The three pure caster classes, added once `calculateCasterDps` and `calculateHealing` could
 * actually receive talents. Before that they were deliberately absent: this repo's recurring failure
 * is shipping data nothing reads, and a Mage effect with no caster talent argument to reach would
 * have been exactly that.
 *
 * What upstream offers them is narrow and uniform -- spell crit, spell damage, and the Spirit regen
 * that keeps running mid-cast. Almost everything else a caster talent does is per-spell (Ignite,
 * Shadow Weaving, improved-<nuke> lines) and lands on abilities this simulator models as one generic
 * cast, so it is refused by name below rather than approximated.
 */
const MAGE_SOURCES = [{ path: 'sim/mage/talents.go', cache: 'sim_mage_talents.go' }]

const MAGE_EXTRACTORS = [
  {
    talent: 'Arcane Instability',
    kind: 'spellCritChance',
    unit: 'fraction per rank',
    re: /AddStat\(stats\.SpellCrit,\s*float64\(mage\.Talents\.ArcaneInstability\)\*([\d.]+)\*core\.SpellCritRatingPerCritChance\)/,
    value: (m) => Number(m[1]) / 100,
  },
  {
    talent: 'Arcane Instability',
    kind: 'spellDamageMultiplier',
    unit: 'fraction per rank',
    // The same talent grants crit and damage on consecutive lines. Two effects, one talent id.
    re: /spellDamageMultiplier \+= float64\(mage\.Talents\.ArcaneInstability\) \* ([\d.]+)/,
    value: (m) => Number(m[1]),
  },
  {
    talent: 'Playing with Fire',
    kind: 'spellDamageMultiplier',
    unit: 'fraction per rank',
    re: /spellDamageMultiplier \+= float64\(mage\.Talents\.PlayingWithFire\) \* ([\d.]+)/,
    value: (m) => Number(m[1]),
    caveat: 'Upstream applies this to all spell damage, not only Fire, and it is taken as written.',
  },
  {
    talent: 'Arcane Meditation',
    kind: 'spiritRegenWhileCasting',
    unit: 'fraction of Spirit regen retained while casting, per rank',
    re: /PseudoStats\.SpiritRegenRateCasting \+= float64\(mage\.Talents\.ArcaneMeditation\) \* ([\d.]+)/,
    value: (m) => Number(m[1]),
  },
]

const MAGE_SKIPPED = [
  ['Ignite / Combustion / Winters Chill', 'Per-spell and school-scoped; the simulator models one generic cast and records no spell school.'],
  ['Arcane Power / Presence of Mind / Icy Veins', 'Timed cooldowns. A closed-form model has no timeline to place them on.'],
  ['Arcane Mind / Mind Mastery', 'Intellect scaling and Intellect-to-spell-power, which cascade through calculateStats instead.'],
  ['Empowered Fireball / Frostbolt', 'Raise one spell\'s coefficient; the generic cast profile has no per-spell coefficient to raise.'],
]

const PRIEST_SOURCES = [{ path: 'sim/priest/talents.go', cache: 'sim_priest_talents.go' }]

const PRIEST_EXTRACTORS = [
  {
    talent: 'Force of Will',
    kind: 'spellCritChance',
    unit: 'fraction per rank',
    re: /AddStat\(stats\.SpellCrit,\s*float64\(priest\.Talents\.ForceOfWill\)\*([\d.]+)\*core\.SpellCritRatingPerCritChance\)/,
    value: (m) => Number(m[1]) / 100,
  },
  {
    talent: 'Meditation',
    kind: 'spiritRegenWhileCasting',
    unit: 'fraction of Spirit regen retained while casting, per rank',
    // Note `=` rather than `+=`: upstream assigns for Priest and Druid, accumulates for Mage. It makes
    // no difference at one source per class, and the pattern matches what is actually written.
    re: /PseudoStats\.SpiritRegenRateCasting = float64\(priest\.Talents\.Meditation\) \* ([\d.]+)/,
    value: (m) => Number(m[1]),
  },
]

const PRIEST_SKIPPED = [
  ['Shadow Weaving / Misery', 'Stacking target debuffs applied by casting; they need a timeline and a debuff slot on the target.'],
  ['Spiritual Guidance', 'Converts Spirit into spell power via a stat dependency, which belongs in calculateStats.'],
  ['Inner Focus / Power Infusion', 'Timed cooldowns, which a closed-form model has no timeline to place.'],
  ['Improved Renew / Empowered Healing', 'Per-spell coefficients; the healer path models one generic cast.'],
]

const WARLOCK_SOURCES = [{ path: 'sim/warlock/talents.go', cache: 'sim_warlock_talents.go' }]

const WARLOCK_EXTRACTORS = [
  {
    talent: 'Backlash',
    kind: 'spellCritChance',
    unit: 'fraction per rank',
    re: /AddStat\(stats\.SpellCrit,\s*float64\(warlock\.Talents\.Backlash\)\*([\d.]+)\*core\.SpellCritRatingPerCritChance\)/,
    value: (m) => Number(m[1]) / 100,
  },
  {
    talent: 'Demonic Tactics',
    kind: 'spellCritChance',
    unit: 'fraction per rank',
    // Upstream writes this to the generic `BonusCritRating`, which covers melee and spell alike. Only
    // the spell half can matter to a Warlock, so it is recorded as spell crit rather than inventing a
    // melee field no Warlock spec reads.
    re: /PseudoStats\.BonusCritRating \+= float64\(warlock\.Talents\.DemonicTactics\) \* ([\d.]+) \* core\.SpellCritRatingPerCritChance/,
    value: (m) => Number(m[1]) / 100,
    caveat: 'Upstream writes generic BonusCritRating; taken as spell crit, which is the only half a Warlock uses.',
  },
]

const WARLOCK_SKIPPED = [
  ['Master Demonologist', 'Gated on which demon is summoned. No pet model here.'],
  ['Fel Intellect / Fel Stamina', 'Stat dependencies into mana and health, which belong in calculateStats.'],
  ['Improved Shadow Bolt / Ruin / Emberstorm', 'Per-spell and school-scoped; no spell school is recorded anywhere in this simulator.'],
  ['Soul Leech / Nightfall', 'Proc-driven, needing a timeline.'],
]

const CLASSES = [
  { className: 'Warrior', talentJson: 'warriorTalents.json', sources: WARRIOR_SOURCES, extractors: WARRIOR_EXTRACTORS, skipped: WARRIOR_SKIPPED },
  { className: 'Rogue', talentJson: 'rogueTalents.json', sources: ROGUE_SOURCES, extractors: ROGUE_EXTRACTORS, skipped: ROGUE_SKIPPED },
  { className: 'Hunter', talentJson: 'hunterTalents.json', sources: HUNTER_SOURCES, extractors: HUNTER_EXTRACTORS, skipped: HUNTER_SKIPPED },
  { className: 'Shaman', talentJson: 'shamanTalents.json', sources: SHAMAN_SOURCES, extractors: SHAMAN_EXTRACTORS, skipped: SHAMAN_SKIPPED },
  { className: 'Druid', talentJson: 'druidTalents.json', sources: DRUID_SOURCES, extractors: DRUID_EXTRACTORS, skipped: DRUID_SKIPPED },
  { className: 'Paladin', talentJson: 'paladinTalents.json', sources: PALADIN_SOURCES, extractors: PALADIN_EXTRACTORS, skipped: PALADIN_SKIPPED },
  { className: 'Mage', talentJson: 'mageTalents.json', sources: MAGE_SOURCES, extractors: MAGE_EXTRACTORS, skipped: MAGE_SKIPPED },
  { className: 'Priest', talentJson: 'priestTalents.json', sources: PRIEST_SOURCES, extractors: PRIEST_EXTRACTORS, skipped: PRIEST_SKIPPED },
  { className: 'Warlock', talentJson: 'warlockTalents.json', sources: WARLOCK_SOURCES, extractors: WARLOCK_EXTRACTORS, skipped: WARLOCK_SKIPPED },
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
