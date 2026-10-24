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
/*
 * The stat-routed half, which was refused by name until 2026-08-20 for one reason: it lands on
 * `StatBlock`, so it could not apply until talents reached `calculateStats` rather than the hidden
 * simulator alone. Vitality and Toughness are the two this file's own skip list named.
 */
const WARRIOR_STAT_EXTRACTORS = [
  {
    talent: 'Vitality',
    kind: 'statFactor',
    stat: 'stamina',
    unit: 'fraction per rank',
    re: /stamBonus := 1 \+ ([\d.]+)\*float64\(warrior\.Talents\.Vitality\)/,
    value: (m) => Number(m[1]),
  },
  {
    talent: 'Vitality',
    kind: 'statFactor',
    stat: 'strength',
    unit: 'fraction per rank',
    re: /strBonus := 1 \+ ([\d.]+)\*float64\(warrior\.Talents\.Vitality\)/,
    value: (m) => Number(m[1]),
  },
  {
    talent: 'Toughness',
    kind: 'itemArmorMultiplier',
    unit: 'fraction per rank',
    // Reads `Equip.Stats()`, so it raises armour from gear and nothing else — not the armour a
    // character gets from Agility, buffs or consumables.
    re: /AddStat\(stats\.Armor,\s*warrior\.Equip\.Stats\(\)\[stats\.Armor\]\*([\d.]+)\*float64\(warrior\.Talents\.Toughness\)\)/,
    value: (m) => Number(m[1]),
  },
]

/*
 * Each class's refusals: the talents an entry covers, by their real names, and why.
 *
 * Real names because they are resolved to talent ids against the class's own tree below, and an
 * entry that names no talent fails the run like an extractor that matches nothing. They used to be
 * labels ("Mace/Sword/Poleaxe Specialization", "Winters Chill") that the app split back into names,
 * and the split missed Sword Specialization, Winter's Chill and Empowered Frostbolt, so the estimate's
 * caveat never named them. `part` marks a talent whose effect is only partly refused, so the caveat
 * names the part rather than calling the whole talent unmodelled.
 */
const WARRIOR_SKIPPED = [
  [['Deep Wounds'], 'A bleed proc on crit — a damage-over-time source, not a stat, and the simulator has no DoT layer for physical specials.'],
  [['Death Wish'], 'An activated cooldown. Uptime depends on fight length and usage policy, neither of which this model has.'],
  [['Rampage'], 'Stacking on-hit attack power. Needs a timeline to build stacks.'],
  [['Enrage'], 'Triggers on being crit by the target — the model has no incoming-damage stream for a DPS.'],
  [['Sweeping Strikes'], 'Extra targets. Single-target model.'],
  [['Blood Frenzy'], 'A debuff on the target rather than a change to the player.'],
  [['Mace Specialization', 'Sword Specialization', 'Poleaxe Specialization'], 'Weapon-type gated, and the mace one is a stun proc. Would need per-weapon-type dispatch that nothing else needs yet.'],
  [['Impale'], 'Raises the crit damage bonus of abilities only. Real, but it belongs with the special-attack table rather than the white-swing modifiers this pass covers.'],
  [['Defiance'], 'Grants expertise, which is a threat and hit-table term on the attacking side. The tank path scores survivability and never rolls the player\'s own attack table.'],
  [['Shield Mastery'], 'Raises block VALUE. The incoming-attack table models block as a chance and does not track how much a block absorbs, so there is nothing for this to change.'],
  [['Improved Heroic Strike', 'Improved Mortal Strike', 'Improved Whirlwind', 'Focused Rage', 'Improved Bloodrage'], "Change abilities the Arms and Fury estimates use: Heroic Strike's rage cost (and every offensive ability's, for Focused Rage), Mortal Strike's and Whirlwind's cooldowns, Mortal Strike's damage and Bloodrage's rage. The estimate prices each at its base cost, cooldown, damage and rage; TalentModifiers has no per-ability field for them."],
  [['Improved Rend', 'Improved Thunder Clap', 'Improved Overpower', 'Improved Cleave', 'Improved Slam'], 'Strengthen abilities neither Warrior DPS estimate casts: Rend, Thunder Clap, Overpower, Cleave and Slam.'],
  [['Commanding Presence', 'Improved Demoralizing Shout'], 'Strengthen shouts. The Buffs tab carries Battle Shout at its untalented value and has no Demoralizing Shout on the boss.'],
  [['Second Wind', 'Blood Craze'], 'Heal or grant rage when you are stunned or crit. A damage dealer has no incoming-damage stream here for either to trigger on.'],
  [['Last Stand', 'Improved Shield Block', 'Improved Shield Wall', 'Improved Defensive Stance'], "Tank survival the tank estimate does not read: Last Stand and Shield Wall are cooldowns needing a usage policy, Shield Block's extra block needs a timeline, and the incoming-attack table has no spell damage for Improved Defensive Stance to reduce."],
  [['Shield Slam', 'Devastate', 'One-Handed Weapon Specialization'], "A tank's damage and threat. The tank estimate scores survival, and neither DPS estimate casts Shield Slam or Devastate or checks for a one-handed weapon."],
]

/*
 * Each class's talents that the estimate has no reason to read, so that every talent in a tree is
 * accounted for: extracted above, refused in the skip list, or here. The run refuses to write when a
 * talent is in none of them, which is what keeps a talent from going silent — before 2026-10-24 a
 * Frost Mage's Elemental Precision, Ice Shards and Piercing Ice reached no caveat, because nothing
 * here mentioned them and the tooltip assumed anything unmentioned was utility.
 *
 * - `ability`: it teaches an ability a spec's estimate already includes (the rotation's Bloodthirst,
 *   Retribution's Seal of Command, Demonology's Felguard), so the point itself is not read.
 * - `buff`: its effect is an entry on the Buffs tab, by that entry's id (`buff`, or `debuff` for one
 *   on the target), so the player ticks it there.
 * - `utility`: it changes nothing an estimate computes — crowd control, movement, range, threat,
 *   resisting crowd control, the cost or cooldown of an ability no estimate casts, or mana for a
 *   caster's damage estimate, which tracks no mana (only the healer and Hunter estimates do).
 *
 * Anything that changes damage, healing, hit, crit, haste or survival belongs in the skip list instead.
 */
const WARRIOR_NOT_READ = {
  ability: [{ talent: 'Mortal Strike', spec: 'Arms' }, { talent: 'Bloodthirst', spec: 'Fury' }],
  buff: [],
  utility: ['Improved Charge', 'Iron Will', 'Improved Intercept', 'Improved Hamstring', 'Improved Disciplines', 'Booming Voice', 'Piercing Howl', 'Improved Execute', 'Tactical Mastery', 'Improved Revenge', 'Improved Sunder Armor', 'Improved Disarm', 'Improved Taunt', 'Concussion Blow', 'Improved Shield Bash'],
}

const ROGUE_SOURCES = [
  { path: 'sim/rogue/talents.go', cache: 'sim_rogue_talents.go' },
  // Improved Slice and Dice is applied where the buff is registered, not with the other talents.
  { path: 'sim/rogue/slice_and_dice.go', cache: 'sim_rogue_slice_and_dice.go' },
  // The poison talents live with the poisons, not in talents.go.
  { path: 'sim/rogue/poisons.go', cache: 'sim_rogue_poisons.go' },
]

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

const ROGUE_STAT_EXTRACTORS = [
  {
    talent: 'Vitality',
    kind: 'statFactor',
    stat: 'agility',
    unit: 'fraction per rank',
    re: /agiBonus := 1 \+ ([\d.]+)\*float64\(rogue\.Talents\.Vitality\)/,
    value: (m) => Number(m[1]),
  },
  {
    talent: 'Vitality',
    kind: 'statFactor',
    stat: 'stamina',
    unit: 'fraction per rank',
    re: /stamBonus := 1 \+ ([\d.]+)\*float64\(rogue\.Talents\.Vitality\)/,
    value: (m) => Number(m[1]),
  },
  {
    talent: 'Sinister Calling',
    kind: 'statFactor',
    stat: 'agility',
    unit: 'fraction per rank',
    re: /agiBonus := 1 \+ ([\d.]+)\*float64\(rogue\.Talents\.SinisterCalling\)/,
    value: (m) => Number(m[1]),
  },
]

const ROGUE_ENERGY_EXTRACTORS = [
  {
    /*
     * The proc mask is what makes this worth a field of its own: upstream checks `ProcMaskMeleeOH`,
     * citing the spell's own mask of 8838608, so main-hand swings and specials return nothing. The
     * talent is therefore worth exactly what the off-hand swing rate is worth — which Slice and Dice
     * raises by 30%, and which is the whole reason these three are ingested together.
     */
    talent: 'Combat Potency',
    kind: 'offHandEnergyPerProc',
    unit: 'energy per proc per rank',
    re: /energyBonus := ([\d.]+) \* float64\(rogue\.Talents\.CombatPotency\)/,
    value: (m) => Number(m[1]),
    caveat: 'A 20% chance on LANDED off-hand hits only. A miss or a dodge returns nothing, which matters before hit cap.',
  },
  {
    /*
     * A boolean talent, so the value is flat rather than per rank. Anchored on the metrics variable
     * name, which is the only thing tying this AddEnergy call to the talent that owns it.
     */
    talent: 'Relentless Strikes',
    kind: 'finisherEnergyRefund',
    unit: 'energy per finisher (flat, not per rank)',
    re: /rogue\.AddEnergy\(sim, (\d+), relentlessStrikesMetrics\)/,
    value: (m) => Number(m[1]),
    flat: true,
    caveat: 'Guaranteed at five combo points (upstream short-circuits on numPoints == 5), random below that. Modelled at five, which is the only refresh a raiding rogue uses.',
  },
  {
    talent: 'Improved Slice and Dice',
    kind: 'sliceAndDiceDurationMultiplier',
    unit: 'fraction per rank',
    re: /durationMultiplier := 1\.0 \+ ([\d.]+)\*float64\(rogue\.Talents\.ImprovedSliceAndDice\)/,
    value: (m) => Number(m[1]),
  },
]

const ROGUE_POISON_EXTRACTORS = [
  {
    /*
     * One coefficient, two poisons. Upstream writes the same `0.3 + 0.02*rank` / `0.2 + 0.02*rank`
     * shape twice, so this anchors on the Deadly line and the value is asserted to match Instant's.
     */
    talent: 'Improved Poisons',
    kind: 'poisonProcChance',
    unit: 'fraction per rank',
    re: /procChance := 0\.3 \+ ([\d.]+)\*float64\(rogue\.Talents\.ImprovedPoisons\)/,
    value: (m) => Number(m[1]),
    caveat: 'Applies to both poisons at the same rate: Deadly is 0.30 base and Instant 0.20, each plus this.',
  },
  {
    talent: 'Vile Poisons',
    kind: 'poisonDamageMultiplier',
    unit: 'fraction per rank',
    re: /DamageMultiplier:\s*1 \+ ([\d.]+)\*float64\(rogue\.Talents\.VilePoisons\)/,
    value: (m) => Number(m[1]),
  },
  {
    talent: 'Master Poisoner',
    kind: 'poisonSpellHitChance',
    unit: 'fraction per rank',
    re: /BonusSpellHitRating:\s*([\d.]+) \* core\.SpellHitRatingPerHitChance \* float64\(rogue\.Talents\.MasterPoisoner\)/,
    value: (m) => Number(m[1]) / 100,
    caveat: 'Scoped to the two poison spells rather than to the rogue, which is why it is its own field.',
  },
]

const ROGUE_SKIPPED = [
  [['Murder'], 'Gated on the target being a humanoid, beast, giant or dragonkin. Nothing here models a mob type.'],
  [['Serrated Blades'], 'Grants armor penetration, which the engine genuinely does not read — it is the one stat still legitimately on the "not modelled" list.'],
  [['Seal Fate', 'Ruthlessness'], 'Combo-point economy. Slice and Dice models a generation RATE now, but there is still no combo-point resource to add a point to, which is what both of these do.'],
  [['Adrenaline Rush', 'Blade Flurry', 'Cold Blood'], 'Activated cooldowns; uptime needs a usage policy this model has none of.'],
  [['Improved Eviscerate', 'Puncturing Wounds', 'Lethality', 'Aggression', 'Surprise Attacks', 'Opportunity'], "Raise named abilities' damage, crit or crit damage. TalentModifiers has no per-ability field for them, so none applies, even where an estimate casts the ability: Combat's Sinister Strike, Assassination's Mutilate, Subtlety's Hemorrhage."],
  [['Riposte', 'Ghostly Strike', 'Improved Ambush'], 'Teach or strengthen attacks no Rogue estimate makes: Riposte, Ghostly Strike and Ambush.'],
  [['Dagger Specialization', 'Mace Specialization', 'Sword Specialization', 'Fist Weapon Specialization'], 'Weapon-type gated, and the mace one adds a stun. Would need per-weapon-type dispatch, the same reason the Warrior specializations are refused.'],
  [['Improved Kidney Shot', 'Find Weakness', 'Dirty Deeds', 'Master of Subtlety', 'Shadowstep'], 'Windowed bonuses: while Kidney Shot holds, for 10 seconds after a finisher, below 35% health, from stealth, or after Shadowstep. Each needs a fight timeline.'],
  [['Improved Sinister Strike', 'Vigor'], "Energy. Improved Sinister Strike lowers the cost of the Combat estimate's builder, which it prices at base cost; Vigor raises the energy cap, which a sustained energy rate never meets, so energy lost to capping is not modelled either."],
  [['Dual Wield Specialization'], "Raises off-hand damage. Upstream writes it in talents.go in the same shape as the Warrior talent of the same name, which reaches offHandDamageMultiplier, so it is expressible; not yet ingested, because it moves every dual-wielding Rogue's estimate and wants its own check."],
  [['Quick Recovery', 'Deadened Nerves', 'Lightning Reflexes', 'Deflection', 'Sleight of Hand', 'Heightened Senses', 'Enveloping Shadows', 'Cheat Death'], "Survival: healing taken, damage taken, dodge, parry, and the chance to be hit or crit. A damage dealer has no incoming-damage stream here. Quick Recovery's other half refunds energy on a missed finisher, which the sustained rate does not price."],
  [['Improved Expose Armor'], "Strengthens Expose Armor, which the Buffs tab's target debuffs do not carry."],
]

const ROGUE_NOT_READ = {
  ability: [{ talent: 'Mutilate', spec: 'Assassination' }, { talent: 'Hemorrhage', spec: 'Subtlety' }],
  buff: [],
  utility: ['Remorseless Attacks', 'Fleet Footed', 'Improved Gouge', 'Endurance', 'Improved Sprint', 'Improved Kick', 'Blade Twisting', 'Nerves of Steel', 'Master of Deception', 'Dirty Tricks', 'Camouflage', 'Initiative', 'Setup', 'Elusiveness', 'Preparation', 'Premeditation'],
}

const HUNTER_SOURCES = [
  { path: 'sim/hunter/talents.go', cache: 'sim_hunter_talents.go' },
  // Bestial Discipline is applied at pet construction rather than in ApplyTalents, so its
  // coefficient lives here and nowhere in talents.go.
  { path: 'sim/hunter/pet.go', cache: 'sim_hunter_pet.go' },
]

/*
 * Hunter. The only class whose specs all run the RANGED branch, so its effects land on ranged fields
 * rather than the melee ones — Serpent's Swiftness is the big one at +4% ranged attack speed a rank.
 *
 * **The pet talents are ingested now**, and the note that used to sit here — "there is no pet in
 * this model at all" — was true when written and false from the moment `hunterPet.ts` shipped. Four
 * of them reach the pet's own attack table and damage, on their own `pet*` fields rather than the
 * melee ones: a pet inherits attack power, spell power, stamina and armour from its owner and no
 * crit, hit or haste, so sharing a field with the hunter would move the wrong actor.
 *
 * Serpent's Swiftness is deliberately extracted **twice**. Upstream writes two separate lines, one
 * for the hunter's `RangedSpeedMultiplier` and one for the pet's `MeleeSpeedMultiplier`, and both
 * are real. Two extractors keyed to the same talent name produce two effects with the same talent
 * id and different kinds, which `deriveTalentModifiers` already handles by iterating effects rather
 * than talents.
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
    caveat: 'The hunter half. The pet half is a second extractor on the same talent id, because upstream writes it as a separate line against the pet.',
  },
  {
    talent: "Serpent's Swiftness",
    kind: 'petMeleeSpeedMultiplier',
    unit: 'fraction per rank',
    re: /pet\.PseudoStats\.MeleeSpeedMultiplier \*= 1 \+ ([\d.]+)\*float64\(hunter\.Talents\.SerpentsSwiftness\)/,
    value: (m) => Number(m[1]),
    caveat: 'The pet half, at the same coefficient as the hunter half but on the pet’s melee swing rather than the owner’s ranged one.',
  },
  {
    talent: 'Unleashed Fury',
    kind: 'petDamageMultiplier',
    unit: 'fraction per rank',
    re: /pet\.PseudoStats\.DamageDealtMultiplier \*= 1 \+ ([\d.]+)\*float64\(hunter\.Talents\.UnleashedFury\)/,
    value: (m) => Number(m[1]),
  },
  {
    talent: 'Ferocity',
    kind: 'petCritChance',
    unit: 'fraction per rank',
    re: /pet\.AddStat\(stats\.MeleeCrit,\s*core\.MeleeCritRatingPerCritChance\*([\d.]+)\*float64\(hunter\.Talents\.Ferocity\)\)/,
    value: (m) => Number(m[1]) / 100,
    caveat: 'Upstream grants the same figure to the pet’s SpellCrit on the next line. Only the melee half is read, because the pet’s spell abilities are not modelled — see HUNTER_PET_UNMODELLED.',
  },
  {
    talent: 'Animal Handler',
    kind: 'petHitChance',
    unit: 'fraction per rank',
    re: /pet\.AddStat\(stats\.MeleeHit,\s*core\.MeleeHitRatingPerHitChance\*([\d.]+)\*float64\(hunter\.Talents\.AnimalHandler\)\)/,
    value: (m) => Number(m[1]) / 100,
    caveat: 'Melee half only, for the same reason as Ferocity: the pet’s SpellHit line feeds abilities this model does not have.',
  },
  {
    /*
     * The proc CHANCE, not the haste. Upstream's 1.3 speed multiplier lives inside an aura callback
     * that no pattern here should try to read, and the uptime it produces is derived analytically in
     * `hunterPet.ts` — the same split `flurryHaste` already makes, and for the same reason: the value
     * transfers and the mechanism does not.
     */
    talent: 'Frenzy',
    kind: 'petFrenzyProcChance',
    unit: 'fraction per rank',
    re: /procChance := ([\d.]+) \* float64\(hunter\.Talents\.Frenzy\)/,
    value: (m) => Number(m[1]),
    caveat: 'A pet crit procs a 30% melee speed aura for 8s. The aura refreshes rather than stacking, so its uptime is 1 - exp(-lambda*8) rather than a Markov chain; see frenzySpeedMultiplier.',
  },
  {
    /*
     * The hunter half only. Upstream also gives the pet's Kill Command +10% crit a rank, in
     * `kill_command.go` as a `BonusCritRating` on that one spell — a per-spell crit bonus, which this
     * record has no field for and which would need one shaped like the spell rather than the actor.
     */
    talent: 'Focused Fire',
    kind: 'rangedDamageMultiplier',
    unit: 'fraction per rank',
    re: /PseudoStats\.DamageDealtMultiplier \*= 1\.0 \+ ([\d.]+)\*float64\(hunter\.Talents\.FocusedFire\)/,
    value: (m) => Number(m[1]),
    caveat: 'Upstream writes a blanket DamageDealtMultiplier gated on owning a pet. Taken as ranged damage because every hunter here has a pet and every point of hunter damage this model computes is ranged; it would need splitting if hunter melee were ever modelled. The pet half is a per-spell crit bonus with no field.',
  },
  {
    /*
     * Read out of `pet.go` rather than `talents.go`, because this is the one pet talent upstream
     * applies at construction rather than in `ApplyTalents` — it is an argument to `EnableFocusBar`,
     * not a stat. The pattern anchors on that call so it cannot drift onto anything else.
     */
    talent: 'Bestial Discipline',
    kind: 'petFocusRegenMultiplier',
    unit: 'fraction per rank',
    re: /EnableFocusBar\(1\.0\+([\d.]+)\*float64\(hunter\.Talents\.BestialDiscipline\)/,
    value: (m) => Number(m[1]),
    caveat: 'Multiplies focus income, not damage. Upstream scales BaseFocusPerTick (25 per 5s) by this, so it buys ability rate rather than ability size.',
  },
]

const HUNTER_SKIPPED = [
  [[{ talent: 'Focused Fire', part: 'Kill Command half' }], 'The hunter damage half is ingested. The other half is a per-spell crit bonus — 10% a rank on the pet Kill Command specifically, written as BonusCritRating on that one spell — and TalentModifiers has no field shaped like a spell, only fields shaped like an actor.'],
  [['The Beast Within', 'Bestial Wrath'], 'Activated cooldowns; uptime needs a usage policy this model has none of.'],
  [['Survivalist'], 'Multiplies Health, which StatBlock has no field for — health is derived from Stamina here.'],
  [['Combat Experience'], 'Multiplies Agility and Intellect. Expressible now that talents reach the stat pipeline; not yet ingested.'],
  [['Mortal Shots'], 'Raises the crit damage bonus of ranged attacks. Real, but it belongs with the crit-damage term rather than the white-damage multipliers this pass covers.'],
  [['Expose Weakness'], 'Grants attack power to the raid, not to the hunter. It is a raid buff wearing a talent costume.'],
  [['Master Tactician', 'Thrill of the Hunt', 'Readiness'], 'Procs and cooldowns needing a timeline.'],
  [['Improved Stings', 'Barrage', 'Improved Barrage', 'Savage Strikes', 'Clever Traps', 'Aimed Shot', 'Silencing Shot', 'Counterattack'], 'Teach or strengthen shots, strikes and traps no Hunter estimate makes. Every Hunter spec is modelled as Auto Shot and Steady Shot.'],
  [['Monster Slaying', 'Humanoid Slaying'], 'Gated on the target being a beast, giant, dragonkin or humanoid. Nothing here models a mob type.'],
  [['Careful Aim', 'Master Marksman', 'Survival Instincts', 'Lightning Reflexes'], 'Ranged attack power from Intellect, a ranged attack power multiplier, +4% attack power, and +15% Agility. Upstream writes Careful Aim and Master Marksman in talents.go; Lightning Reflexes would be a stat factor, which that file does not write. None is ingested yet. Survival Instincts also cuts damage taken, which has no stream here.'],
  [['Endurance Training', 'Improved Aspect of the Monkey', 'Thick Hide', 'Spirit Bond', 'Catlike Reflexes', 'Deflection', 'Deterrence'], 'Survival for you and your pet: health, dodge, parry, armour and regeneration, and Deterrence is a cooldown. A damage dealer has no incoming-damage stream here.'],
  [['Improved Aspect of the Hawk', 'Go for the Throat'], 'Procs on ranged attacks: a haste aura, and Focus for the pet on a crit. The pet\'s Focus income is modelled from its regeneration alone.'],
  [["Improved Hunter's Mark"], "Makes Hunter's Mark raise melee attack power too, and the Buffs tab's target debuffs do not carry Hunter's Mark."],
  [['Efficiency'], "Lowers the mana cost of shots. The Hunter estimate's mana figures price Steady Shot at its base cost."],
]

const HUNTER_NOT_READ = {
  ability: [],
  buff: [{ talent: 'Trueshot Aura', buff: 'trueshot-aura' }, { talent: 'Ferocious Inspiration', buff: 'ferocious-inspiration' }],
  utility: ['Improved Revive Pet', 'Pathfinding', 'Bestial Swiftness', 'Improved Mend Pet', 'Intimidation', 'Improved Concussive Shot', 'Improved Arcane Shot', 'Rapid Killing', 'Concussive Barrage', 'Scatter Shot', 'Hawk Eye', 'Entrapment', 'Improved Wing Clip', 'Trap Mastery', 'Improved Feign Death', 'Resourcefulness', 'Wyvern Sting'],
}

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
  {
    talent: 'Flurry',
    kind: 'flurryHaste',
    unit: 'fraction per rank',
    // Upstream: `bonus := 1.05 + 0.05*float64(shaman.Talents.Flurry)`. The regex captures both
    // numbers because the leading one is the whole reason this talent used to be refused — Warrior's
    // is `1 + 0.05*rank`, so reusing that shape would understate every Shaman rank by a flat 5%.
    re: /bonus := ([\d.]+) \+ ([\d.]+)\*float64\(shaman\.Talents\.Flurry\)/,
    value: (m) => Number(m[2]),
    // Rounded because `1.05 - 1` is 0.050000000000000044 in IEEE 754, and an ingest that writes
    // that into checked-in JSON makes every future diff of this file unreadable.
    baseBonus: (m) => Number((Number(m[1]) - 1).toFixed(6)),
    caveat:
      'Same 3-stack aura as the Warrior version — any melee crit sets 3 stacks, a white hit removes one — and solved by the same analytic chain in talentModifiers.ts. What differs is the constant: Shaman ranks are 10/15/20/25/30% where Warrior is 5/10/15/20/25%, carried as baseBonus.',
  },
]

const SHAMAN_SKIPPED = [
  [['Toughness', 'Anticipation', 'Shield Specialization'], 'Tank-facing armour, dodge and block. Expressible, but talents reach the damage path only.'],
  [['Elemental Fury', 'Concussion', 'Call of Thunder'], 'Spell-side talents with nowhere to attach: Elemental Fury raises spell *crit damage*, which has no field, and Concussion and Call of Thunder are scoped to named Nature spells, which TalentModifiers has no per-spell field for. (This used to say no spell school was recorded; abilities record one now, and Demonic Sacrifice, the one school-scoped talent ingested, reads it. The reason before that, that calculateCasterDps took no talents, stopped being true on 2026-08-19.)'],
  [['Shamanistic Rage', { talent: 'Stormstrike', part: 'Nature debuff' }], 'Shamanistic Rage is an activated cooldown needing a usage policy. Stormstrike\'s strike is in Enhancement\'s rotation as a special attack; what is not modelled is the debuff it leaves, the next two Nature hits on the target taking 20% more.'],
  [['Call of Flame', 'Improved Lightning Shield', 'Lightning Mastery', 'Lightning Overload', 'Improved Healing Wave', 'Healing Way', 'Improved Chain Heal', 'Earth Shield'], "Change particular spells (Fire totems, Lightning Shield, Lightning Bolt's cast time and its second bolt, Healing Wave, Chain Heal) or teach Earth Shield. TalentModifiers has no per-spell field for them, so none applies, even to Lightning Bolt and Chain Heal, which the Elemental and Restoration estimates cast."],
  [['Unrelenting Storm', 'Ancestral Knowledge', 'Tidal Focus'], "Mana the healer estimate tracks: regeneration from Intellect, maximum mana, and cheaper heals. Its mana figures price Chain Heal at base cost and read regeneration from MP5 and Spirit alone, and StatBlock has no Mana field. Upstream writes Unrelenting Storm and Ancestral Knowledge in talents.go."],
  [['Elemental Devastation', 'Elemental Mastery', "Nature's Swiftness"], 'Procs and cooldowns: melee crit after a spell crit, a guaranteed crit, an instant cast. Each needs a timeline.'],
  [['Elemental Warding', 'Elemental Shields', 'Spirit Weapons', "Nature's Guardian"], 'Survival: damage taken, the chance to be crit, parry, and a heal at low health. A damage dealer or healer has no incoming-damage stream here.'],
  [['Guardian Totems', 'Enhancing Totems', 'Improved Weapon Totems', 'Restorative Totems'], 'Strengthen totems. The Buffs tab carries Strength of Earth, Grace of Air, Windfury and Mana Spring Totem at their untalented values, and has no Stoneskin or Windwall Totem.'],
  [['Elemental Weapons'], 'Strengthens weapon imbues. Windfury Weapon is in the Enhancement estimate at its untalented value.'],
  [['Mental Quickness', "Nature's Blessing"], 'Spell power from attack power and from Intellect. Upstream writes both in talents.go, so they are expressible as stat conversions; not yet ingested.'],
  [['Purification', 'Tidal Mastery', 'Elemental Precision'], 'Scoped to kinds of spell rather than to the character: +10% healing (there is no healing multiplier field), crit for healing and Lightning spells, and hit for Fire, Frost and Nature spells. Upstream does not write them in talents.go.'],
]

const SHAMAN_NOT_READ = {
  ability: [{ talent: 'Stormstrike', spec: 'Enhancement' }, { talent: 'Dual Wield', spec: 'Enhancement', note: 'The Enhancement estimate swings both hands.' }],
  buff: [{ talent: 'Totem of Wrath', buff: 'totem-of-wrath' }, { talent: 'Mana Tide Totem', buff: 'mana-tide-totem' }, { talent: 'Unleashed Rage', buff: 'unleashed-rage' }],
  utility: ['Convection', 'Elemental Focus', "Earth's Grasp", 'Reverberation', 'Improved Fire Totems', 'Eye of the Storm', 'Storm Reach', 'Improved Ghost Wolf', 'Shamanistic Focus', 'Improved Reincarnation', 'Ancestral Healing', 'Totemic Focus', 'Healing Focus', 'Totemic Mastery', 'Healing Grace', 'Focused Mind'],
}

const DRUID_SOURCES = [{ path: 'sim/druid/talents.go', cache: 'sim_druid_talents.go' },
  // Ferocity is applied where Rake's cost is computed, not in talents.go.
  { path: 'sim/druid/rake.go', cache: 'sim_druid_rake.go' }]

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

const DRUID_STAT_EXTRACTORS = [
  {
    talent: 'Lunar Guidance',
    kind: 'statConversion',
    from: 'intellect',
    to: 'spellPower',
    unit: 'spell power per point of Intellect, per rank',
    re: /bonus := \(([\d.]+) \/ ([\d.]+)\) \* float64\(druid\.Talents\.LunarGuidance\)/,
    value: (m) => Number(m[1]) / Number(m[2]),
    caveat: 'Upstream models the spell-damage half only, because wowsims has no healer implemented for this class at the pinned commit. The talent raises healing by the same amount in game, so a healer estimate here reads low by it; sourcing that half needs the tooltip itself, which is not this file.',
  },
  {
    talent: 'Thick Hide',
    kind: 'itemArmorMultiplier',
    unit: 'fraction per rank',
    /*
     * Upstream branches: `InForm(Bear)` gets 0.5/3 a rank, everything else 0.1/3. The pattern anchors
     * on the `else` deliberately, because this app models Feral as **cat** form — the same call that
     * gates `feralAttackPower` and the cat-form attribute conversions. Matching the Bear branch would
     * hand every druid, Balance and Restoration included, a bear's armour.
     */
    re: /\} else \{\s*druid\.AddStat\(stats\.Armor, druid\.Equip\.Stats\(\)\[stats\.Armor\]\*\(([\d.]+)\/([\d.]+)\)\*float64\(druid\.Talents\.ThickHide\)\)/,
    value: (m) => Number(m[1]) / Number(m[2]),
    caveat: 'Cat/caster form rate. Bear form is 5x this upstream, and this app does not model bear.',
  },
]

const DRUID_BLEED_EXTRACTORS = [
  {
    /*
     * The **Druid's** Ferocity, which discounts Rake, against the **Hunter's**, which grants the pet
     * crit. Same name, different classes, entirely different effects — the fourth such pair here, and
     * the reason every extractor is cross-checked against its own class's tree before an id is taken.
     */
    talent: 'Ferocity',
    kind: 'rakeEnergyCostReduction',
    unit: 'energy per rank',
    re: /cost := 40\.0 - float64\(druid\.Talents\.Ferocity\)/,
    value: () => 1,
    caveat: 'Upstream writes a bare subtraction with no coefficient, which means one energy a rank. Also discounts Claw, which this model does not have.',
  },
]

const DRUID_SKIPPED = [
  [['Subtlety'], 'Reduces threat, which nothing here scores.'],
  [['Survival of the Fittest'], 'Reduces the chance to be crit, which the damage path does not model.'],
  [['Heart of the Wild', 'Furor'], 'Heart of the Wild multiplies Intellect outright but its Stamina and attack power halves are gated on the shapeshift form, and this app models Feral as cat only. Furor is a form-entry resource effect. The Intellect half is expressible now; the rest needs a form model.'],
  [['Moonkin Form', 'Tree of Life'], 'Shapeshifts with party-wide effects; neither the form nor the party is modelled.'],
  [['Omen of Clarity', 'Primal Fury'], 'Proc-driven energy and combo points, needing a timeline.'],
  [['Starlight Wrath', 'Focused Starlight', 'Improved Moonfire', 'Vengeance', 'Moonfury', 'Wrath of Cenarius', 'Insect Swarm', 'Brambles'], "Change particular Balance spells (Starfire's and Wrath's cast time, crit, crit damage, damage and coefficient, Moonfire, Thorns, Entangling Roots) or teach Insect Swarm. TalentModifiers has no per-spell field for them, so none applies, even to Starfire, which the Balance estimate casts."],
  [['Feral Aggression', 'Shredding Attacks', 'Savage Fury', 'Predatory Instincts', 'Mangle'], "Change particular cat abilities (Ferocious Bite's damage, Shred's energy cost, Claw, Rake and Mangle's damage, crit damage in forms) or teach Mangle. The Feral estimate prices Shred and Rake at their base figures, takes no crit damage from talents, and casts neither Mangle nor Ferocious Bite."],
  [['Improved Rejuvenation', 'Empowered Touch', 'Improved Regrowth', 'Swiftmend', 'Empowered Rejuvenation', 'Gift of Nature'], 'Strengthen particular heals (Rejuvenation, Healing Touch, Regrowth, heals over time) or teach Swiftmend; Gift of Nature raises all healing. None has a field: Empowered Rejuvenation reaches Lifebloom, which the Restoration estimate casts, and is still not applied, and there is no healing multiplier.'],
  [['Dreamstate'], "Mana regeneration from Intellect, which the healer estimate's mana figures do not read: they read MP5 and Spirit. Upstream writes it in talents.go; not yet ingested."],
  [["Nature's Grace", "Nature's Swiftness", 'Force of Nature'], 'A faster cast after a spell crit, an instant cast, and treants on a cooldown. Each needs a timeline, and nothing here models the treants.'],
  [['Feral Swiftness', 'Nurturing Instinct', 'Improved Leader of the Pack'], "Survival: dodge in forms, healing taken, and a heal on crit. A damage dealer has no incoming-damage stream here, and Nurturing Instinct's healing from Agility is for heals no Feral estimate casts."],
  [['Improved Mark of the Wild'], 'Strengthens Gift of the Wild, which the Buffs tab carries at its untalented value.'],
  [['Living Spirit'], 'Multiplies Spirit. Upstream writes it in talents.go, so it is expressible as a stat factor; not yet ingested.'],
]

const DRUID_NOT_READ = {
  ability: [],
  buff: [{ talent: 'Leader of the Pack', buff: 'leader-of-the-pack' }, { talent: 'Faerie Fire (Feral)', debuff: 'faerie-fire' }, { talent: 'Improved Faerie Fire', debuff: 'improved-faerie-fire' }],
  utility: ['Moonglow', "Nature's Grasp", "Improved Nature's Grasp", 'Control of Nature', "Nature's Reach", 'Celestial Focus', 'Feral Instinct', 'Brutal Impact', 'Feral Charge', 'Primal Tenacity', "Nature's Focus", 'Natural Shapeshifter', 'Tranquil Spirit', 'Improved Tranquility'],
}

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

const PALADIN_STAT_EXTRACTORS = [
  {
    talent: 'Divine Strength',
    kind: 'statFactor',
    stat: 'strength',
    unit: 'fraction per rank',
    re: /bonus := 1 \+ ([\d.]+)\*float64\(paladin\.Talents\.DivineStrength\)/,
    value: (m) => Number(m[1]),
  },
  {
    talent: 'Toughness',
    kind: 'itemArmorMultiplier',
    unit: 'fraction per rank',
    re: /AddStat\(stats\.Armor,\s*paladin\.Equip\.Stats\(\)\[stats\.Armor\]\*([\d.]+)\*float64\(paladin\.Talents\.Toughness\)\)/,
    value: (m) => Number(m[1]),
  },
]

const PALADIN_SKIPPED = [
  [['Spell Warding', 'Improved Righteous Fury'], 'Damage-taken reduction; no incoming-damage stream on the damage path.'],
  [['Vengeance', 'Sanctity Aura'], 'Proc-driven and aura damage multipliers that need a timeline or a party.'],
  [['Crusade'], 'Gated on the target being a humanoid, demon, undead or elemental. No mob type here.'],
  [['Shield Specialization'], 'Paladin\'s raises block VALUE, unlike the Warrior talent of the same name which raises block CHANCE. The incoming-attack table tracks the chance only, so there is nothing here to change.'],
  [['Improved Seal of Righteousness', 'Healing Light', 'Sanctified Light', 'Purifying Power', 'Holy Power', 'Holy Shock'], "Strengthen particular spells (Seal of Righteousness, Holy Light and Flash of Light, Exorcism and Holy Wrath, Holy spells' crit) or teach Holy Shock. TalentModifiers has no per-spell field for them, so none applies, even to Holy Light, which the Holy estimate casts."],
  [['Illumination', 'Divine Favor', "Light's Grace", 'Divine Illumination'], 'Procs and cooldowns: mana back on a heal crit, a guaranteed crit, a faster Holy Light, half-price spells. Each needs a timeline.'],
  [['Divine Intellect', 'Holy Guidance', 'Sacred Duty', 'Combat Expertise'], "Intellect, spell power from Intellect, Stamina, and expertise with Stamina. Upstream writes Divine Intellect, Sacred Duty and Combat Expertise in talents.go, so their stat factors are expressible; not yet ingested. Holy Guidance is not in that file. Combat Expertise's expertise is a tank's, which the tank estimate does not roll, as with Defiance."],
  [['Improved Blessing of Wisdom', 'Improved Devotion Aura', 'Improved Blessing of Might', 'Improved Retribution Aura', 'Improved Sanctity Aura'], 'Strengthen blessings and auras. The Buffs tab carries them at their untalented values.'],
  [['Redoubt', 'Reckoning', 'One-Handed Weapon Specialization', 'Improved Holy Shield', 'Holy Shield', 'Ardent Defender', "Avenger's Shield"], "Tank procs, damage and threat. The tank estimate rolls a steady incoming-attack table with no timeline, so Redoubt's and Reckoning's procs, Holy Shield's charges and Ardent Defender's low-health window have nothing to run on, and it does not score a tank's damage."],
  [['Improved Judgement', 'Fanaticism', 'Two-Handed Weapon Specialization'], "Change Retribution's damage: Judgement's cooldown and crit, and +6% physical damage with a two-handed weapon. The estimate judges on the base 10-second cooldown. Upstream writes Two-Handed Weapon Specialization in talents.go as the same two-handed physical multiplier the Warrior talent of that name reaches, so it is expressible; not yet ingested, because it moves every Retribution estimate and wants its own check."],
  [['Blessed Life', 'Pursuit of Justice', 'Eye for an Eye', 'Divine Purpose'], 'Survival, or damage returned when you are hit: half damage, spell hit taken, crits taken. A damage dealer or healer has no incoming-damage stream here.'],
]

const PALADIN_NOT_READ = {
  ability: [{ talent: 'Crusader Strike', spec: 'Retribution' }, { talent: 'Seal of Command', spec: 'Retribution', note: 'Alliance only: a Horde estimate uses Seal of Blood.' }],
  buff: [{ talent: 'Blessing of Kings', buff: 'blessing-of-kings' }, { talent: 'Blessing of Sanctuary', buff: 'blessing-of-sanctuary' }, { talent: 'Improved Seal of the Crusader', debuff: 'improved-seal-of-the-crusader' }],
  utility: ['Spiritual Focus', 'Aura Mastery', 'Improved Lay on Hands', 'Unyielding Faith', 'Pure of Heart', "Guardian's Favor", 'Stoicism', 'Improved Hammer of Justice', 'Improved Concentration Aura', 'Benediction', 'Vindication', 'Sanctified Judgement', 'Repentance'],
}

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

const MAGE_STAT_EXTRACTORS = [
  {
    talent: 'Arcane Mind',
    kind: 'statFactor',
    stat: 'intellect',
    unit: 'fraction per rank',
    re: /return intellect \* \(1\.0 \+ ([\d.]+)\*float64\(mage\.Talents\.ArcaneMind\)\)/,
    value: (m) => Number(m[1]),
  },
  {
    talent: 'Mind Mastery',
    kind: 'statConversion',
    from: 'intellect',
    to: 'spellPower',
    unit: 'spell power per point of Intellect, per rank',
    re: /return spellPower \+ intellect\*([\d.]+)\*float64\(mage\.Talents\.MindMastery\)/,
    value: (m) => Number(m[1]),
  },
]

const MAGE_SKIPPED = [
  [['Ignite', 'Combustion', "Winter's Chill"], 'Per-spell and school-scoped: Ignite is a burn left by Fire crits, Combustion a cooldown, and Winter\'s Chill a stacking debuff Frost spells keep up (the Buffs tab carries the debuff itself). Each needs a timeline or a per-spell field TalentModifiers does not have.'],
  [['Arcane Power', 'Presence of Mind', 'Icy Veins'], 'Timed cooldowns. A closed-form model has no timeline to place them on.'],
  [['Empowered Fireball', 'Empowered Frostbolt'], 'Raise one spell\'s coefficient; the generic cast profile has no per-spell coefficient to raise.'],
  [['Arcane Subtlety', 'Arcane Focus', 'Elemental Precision'], "Hit and resistance scoped to schools: Arcane Focus is Arcane hit, Elemental Precision Fire and Frost hit (and cheaper Fire and Frost spells), Arcane Subtlety lowers the target's resistances. The spell hit field is character-wide, so an Arcane Mage would collect Elemental Precision's hit, and target resistances are not modelled. Upstream does not write them in talents.go."],
  [['Critical Mass', 'Pyromaniac', 'Fire Power', 'Piercing Ice', 'Arctic Winds'], "Fire and Frost crit and damage. A school damage multiplier exists (Demonic Sacrifice uses it), but upstream does not write these in talents.go, which is all this ingest reads, and school-scoped crit has no field. Arctic Winds also lowers the chance to be hit."],
  [['Spell Power', 'Ice Shards'], 'Raise spell crit damage, for all spells and for Frost spells. There is no crit-damage field for talents, the same gap as Elemental Fury.'],
  [['Arcane Impact', 'Empowered Arcane Missiles', 'Improved Fireball', 'Incineration', 'Improved Flamestrike', 'Improved Frostbolt', 'Improved Cone of Cold', 'Wand Specialization', 'Pyroblast', 'Blast Wave', "Dragon's Breath", 'Summon Water Elemental'], "Change particular spells (Arcane Blast's crit, Arcane Missiles, Fireball's and Frostbolt's cast time, Fire Blast, Scorch, Flamestrike, Cone of Cold, wands) or teach a spell or the Water Elemental. TalentModifiers has no per-spell field for them, so none applies, even to Arcane Blast, Fireball and Frostbolt, which the estimates cast; nothing here models the Water Elemental."],
  [['Arcane Potency', 'Improved Scorch', 'Molten Fury'], 'Windowed bonuses: crit while Clearcasting, a stacking Fire vulnerability Scorch keeps up (no estimate casts Scorch, and the Buffs tab does not carry it), and damage below 20% health. Each needs a fight timeline.'],
  [['Magic Absorption', 'Arcane Fortitude', 'Improved Mana Shield', 'Improved Blink', 'Prismatic Cloak', 'Frost Warding', 'Frozen Core', 'Ice Barrier'], 'Survival: resistances, armour, damage taken, absorbs and the chance to be hit. A damage dealer has no incoming-damage stream here.'],
]

const MAGE_NOT_READ = {
  ability: [],
  buff: [],
  utility: ['Arcane Concentration', 'Master of Elements', 'Frost Channeling', 'Improved Arcane Missiles', 'Magic Attunement', 'Improved Counterspell', 'Slow', 'Impact', 'Flame Throwing', 'Improved Fire Blast', 'Burning Soul', 'Molten Shields', 'Blazing Speed', 'Frostbite', 'Improved Frost Nova', 'Permafrost', 'Improved Blizzard', 'Arctic Reach', 'Shatter', 'Cold Snap', 'Ice Floes'],
}

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

const PRIEST_STAT_EXTRACTORS = [
  {
    talent: 'Spiritual Guidance',
    kind: 'statConversion',
    from: 'spirit',
    to: 'spellPower',
    unit: 'spell power per point of Spirit, per rank',
    // Written as a total over max rank, so the per-rank share is the division itself.
    re: /bonus := \(([\d.]+) \/ ([\d.]+)\) \* float64\(priest\.Talents\.SpiritualGuidance\)/,
    value: (m) => Number(m[1]) / Number(m[2]),
    caveat: 'Upstream models the spell-damage half only, because wowsims has no healer implemented for this class at the pinned commit. The talent raises healing by the same amount in game, so a healer estimate here reads low by it; sourcing that half needs the tooltip itself, which is not this file.',
  },
]

const PRIEST_SKIPPED = [
  [['Shadow Weaving', 'Misery'], 'Stacking target debuffs applied by casting; they need a timeline and a debuff slot on the target.'],
  [['Inner Focus', 'Power Infusion'], 'Timed cooldowns, which a closed-form model has no timeline to place.'],
  [['Improved Renew', 'Empowered Healing'], 'Per-spell coefficients; the healer path models one generic cast.'],
  [['Improved Power Word: Shield', 'Focused Power', 'Divine Fury', 'Searing Light', 'Surge of Light', 'Improved Shadow Word: Pain', 'Improved Mind Blast', 'Shadow Power', 'Reflective Shield', 'Wand Specialization', 'Holy Nova', 'Lightwell'], "Change particular spells (Power Word: Shield, Smite and Mind Blast's hit, Smite, Holy Fire and the big heals' cast time, a free instant Smite after a crit, Shadow Word: Pain's duration, Mind Blast's cooldown and crit, wands) or teach Holy Nova or Lightwell. TalentModifiers has no per-spell field for them, so none applies, even to Shadow Word: Pain and Mind Blast, which the Shadow estimate casts."],
  [['Holy Specialization', 'Shadow Focus', 'Darkness', 'Shadowform'], "Scoped to a school: Holy crit, Shadow hit, Shadow damage. A school damage multiplier exists (Demonic Sacrifice uses it), but upstream does not write these in talents.go, which is all this ingest reads, and school-scoped hit and crit have no field. Shadowform also cuts physical damage taken."],
  [['Mental Agility', 'Mental Strength', 'Holy Concentration'], "Mana the healer estimates track: cheaper instant spells (Holy's Circle of Healing), maximum mana, and free heals after a proc (Discipline's Flash Heal). Their mana figures price each heal at base cost, StatBlock has no Mana field, and the proc needs a timeline. Upstream writes Mental Strength in talents.go."],
  [['Enlightenment', 'Spirit of Redemption', 'Spiritual Healing'], 'Multiply Stamina, Intellect and Spirit, or Spirit alone, or raise all healing. Upstream writes Enlightenment and Spirit of Redemption in talents.go, so their stat factors are expressible; not yet ingested. There is no healing multiplier field.'],
  [['Improved Inner Fire', 'Focused Will', 'Spell Warding', 'Blessed Recovery', 'Blessed Resilience', 'Shadow Resilience', 'Pain Suppression'], "Survival: armour, damage taken, heals after a crit, the chance to be crit, and Pain Suppression's cooldown. A damage dealer or healer has no incoming-damage stream here."],
  [['Improved Power Word: Fortitude', 'Improved Divine Spirit'], 'Strengthen Prayer of Fortitude and Prayer of Spirit, which the Buffs tab carries at their untalented values.'],
]

const PRIEST_NOT_READ = {
  ability: [{ talent: 'Mind Flay', spec: 'Shadow' }, { talent: 'Vampiric Touch', spec: 'Shadow' }, { talent: 'Circle of Healing', spec: 'Holy' }],
  buff: [{ talent: 'Divine Spirit', buff: 'prayer-of-spirit' }],
  utility: ['Focused Mind', 'Unbreakable Will', 'Silent Resolve', 'Martyrdom', 'Absolution', 'Improved Mana Burn', 'Healing Focus', 'Inspiration', 'Holy Reach', 'Improved Healing', 'Healing Prayers', 'Spirit Tap', 'Blackout', 'Shadow Affinity', 'Improved Psychic Scream', 'Improved Fade', 'Shadow Reach', 'Silence', 'Vampiric Embrace', 'Improved Vampiric Embrace'],
}

const WARLOCK_SOURCES = [
  { path: 'sim/warlock/talents.go', cache: 'sim_warlock_talents.go' },
  // Every demon-scaling talent is applied where the demon is built, not in ApplyTalents.
  { path: 'sim/warlock/pet.go', cache: 'sim_warlock_pet.go' },
  // Demonic Sacrifice is applied where the warlock is built, not in ApplyTalents.
  { path: 'sim/warlock/warlock.go', cache: 'sim_warlock_warlock.go' },
]

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

const WARLOCK_DEMON_EXTRACTORS = [
  {
    /*
     * Demonic Sacrifice, and **which school it lands on is a build choice this app cannot read**.
     * Upstream switches on the demon being sacrificed — Succubus grants Shadow, Imp grants Fire, both
     * at 1.15 — and the demon is a picker no surface here has, the same gap the pet family and the
     * poison imbue already name.
     *
     * So the school is assigned to match the spec's own damage, which is what a warlock actually
     * does: Affliction casts nothing but Shadow and Destruction nothing but Fire in this model, so
     * each sacrifices the demon whose bonus it can use. Note this diverges from upstream's single
     * preset, which gives Destruction a Succubus — their Destruction rotation includes Shadow Bolt
     * and this one does not.
     */
    talent: 'Demonic Sacrifice',
    kind: 'schoolDamageMultiplier',
    school: 'Shadow',
    unit: 'multiplier (flat, not per rank)',
    re: /Warlock_Options_Succubus:\s*warlock\.PseudoStats\.ShadowDamageDealtMultiplier \*= ([\d.]+)/,
    value: (m) => Number(m[1]),
    flat: true,
    caveat: 'The Succubus branch. Assigned to Shadow because Affliction, the spec that takes this, casts nothing else here.',
  },

  {
    /*
     * Read out of `pet.go`, because every demon-scaling talent is applied where the demon is built
     * rather than in `ApplyTalents` — the same shape Bestial Discipline took for the hunter.
     */
    talent: 'Unholy Power',
    kind: 'demonDamageMultiplier',
    unit: 'fraction per rank',
    re: /wp\.PseudoStats\.DamageDealtMultiplier \*= 1\.0 \+ \(([\d.]+) \* float64\(warlock\.Talents\.UnholyPower\)\)/,
    value: (m) => Number(m[1]),
  },
  {
    talent: 'Demonic Tactics',
    kind: 'demonCritChance',
    unit: 'fraction per rank',
    re: /stats\.MeleeCrit:\s*float64\(warlock\.Talents\.DemonicTactics\) \* ([\d.]+) \* core\.MeleeCritRatingPerCritChance/,
    value: (m) => Number(m[1]) / 100,
    caveat: 'Upstream grants the same figure to the demon SpellCrit on the next line; only the melee half is read, because only the demon melee swing is modelled. Separately grants the warlock spell crit, which is a different extractor on the same talent.',
  },
]

const WARLOCK_SKIPPED = [
  [['Master Demonologist'], 'Gated on which demon is summoned. Only the Felguard is modelled, and it does not read this bonus yet.'],
  [['Fel Intellect', 'Fel Stamina'], 'Both land on Mana and Health, which StatBlock has no field for. Fel Stamina also multiplies Stamina, which is expressible now that talents reach the stat pipeline; not yet ingested.'],
  [['Improved Shadow Bolt', 'Ruin', 'Emberstorm'], 'Per-spell and school-scoped: Improved Shadow Bolt is a Shadow vulnerability its crits leave, Ruin raises Destruction crit damage, Emberstorm Fire damage. None is in upstream talents.go, which is all this ingest reads. (This used to say no spell school was recorded anywhere; abilities record one now, and Demonic Sacrifice reads it.)'],
  [['Soul Leech', 'Nightfall'], 'Proc-driven, needing a timeline.'],
  [['Improved Corruption', 'Empowered Corruption', 'Improved Curse of Agony', 'Contagion', 'Soul Siphon', 'Bane', 'Improved Immolate', 'Shadow and Flame', 'Improved Searing Pain', 'Shadowburn', 'Conflagrate', 'Shadowfury'], "Change particular spells (Corruption's cast time and coefficient, Curse of Agony and Corruption damage, Drain Life, Shadow Bolt's and Immolate's cast time, Immolate's opening hit, Shadow Bolt's and Incinerate's coefficient, Searing Pain) or teach Shadowburn, Conflagrate or Shadowfury. TalentModifiers has no per-spell field for them, so none applies, even to the Corruption, Curse of Agony, Shadow Bolt, Incinerate and Immolate the estimates cast."],
  [['Suppression', 'Shadow Mastery', 'Devastation'], "Affliction hit, Shadow damage and Destruction crit. A school damage multiplier exists (Demonic Sacrifice uses it), but upstream does not write Shadow Mastery in talents.go, which is all this ingest reads, and hit and crit scoped to a tree have no field."],
  [['Amplify Curse'], 'An activated cooldown for the next curse. Uptime needs a usage policy this model has none of.'],
  [['Improved Imp', 'Improved Sayaad', 'Improved Firebolt', 'Improved Lash of Pain', 'Demonic Knowledge'], "Strengthen demons other than the Felguard, the only demon modelled, or grant spell power from the active demon's Stamina and Intellect, which nothing here tracks. Improved Imp also raises Blood Pact, which the Buffs tab carries at its untalented value."],
  [['Demonic Embrace', 'Demonic Aegis', 'Master Conjuror'], 'Stamina and Spirit factors, a stronger Fel Armor, and stronger Firestone and Spellstone. Upstream writes Demonic Embrace in talents.go, so it is expressible as a stat factor; not yet ingested. Fel Armor and the stones are not modelled.'],
  [['Malediction'], 'Raises Curse of the Elements to 13%, and the Buffs tab carries the untalented 10%.'],
  [['Demonic Resilience', 'Soul Link', 'Nether Protection'], 'Survival: the chance to be crit, damage shared with the demon, immunity after a spell hit. A damage dealer has no incoming-damage stream here.'],
]

const WARLOCK_NOT_READ = {
  ability: [{ talent: 'Siphon Life', spec: 'Affliction' }, { talent: 'Unstable Affliction', spec: 'Affliction' }, { talent: 'Summon Felguard', spec: 'Demonology' }],
  buff: [],
  utility: ['Improved Life Tap', 'Dark Pact', 'Cataclysm', 'Improved Curse of Weakness', 'Improved Drain Soul', 'Fel Concentration', 'Grim Reach', 'Shadow Embrace', 'Curse of Exhaustion', 'Improved Howl of Terror', 'Improved Healthstone', 'Improved Health Funnel', 'Improved Voidwalker', 'Fel Domination', 'Master Summoner', 'Improved Subjugate Demon', 'Mana Feed', 'Aftermath', 'Intensity', 'Destructive Reach', 'Pyroclasm'],
}

const CLASSES = [
  { className: 'Warrior', talentJson: 'warriorTalents.json', sources: WARRIOR_SOURCES, extractors: [...WARRIOR_EXTRACTORS, ...WARRIOR_STAT_EXTRACTORS], skipped: WARRIOR_SKIPPED, notRead: WARRIOR_NOT_READ },
  { className: 'Rogue', talentJson: 'rogueTalents.json', sources: ROGUE_SOURCES, extractors: [...ROGUE_EXTRACTORS, ...ROGUE_STAT_EXTRACTORS, ...ROGUE_ENERGY_EXTRACTORS, ...ROGUE_POISON_EXTRACTORS], skipped: ROGUE_SKIPPED, notRead: ROGUE_NOT_READ },
  { className: 'Hunter', talentJson: 'hunterTalents.json', sources: HUNTER_SOURCES, extractors: HUNTER_EXTRACTORS, skipped: HUNTER_SKIPPED, notRead: HUNTER_NOT_READ },
  { className: 'Shaman', talentJson: 'shamanTalents.json', sources: SHAMAN_SOURCES, extractors: SHAMAN_EXTRACTORS, skipped: SHAMAN_SKIPPED, notRead: SHAMAN_NOT_READ },
  { className: 'Druid', talentJson: 'druidTalents.json', sources: DRUID_SOURCES, extractors: [...DRUID_EXTRACTORS, ...DRUID_STAT_EXTRACTORS, ...DRUID_BLEED_EXTRACTORS], skipped: DRUID_SKIPPED, notRead: DRUID_NOT_READ },
  { className: 'Paladin', talentJson: 'paladinTalents.json', sources: PALADIN_SOURCES, extractors: [...PALADIN_EXTRACTORS, ...PALADIN_STAT_EXTRACTORS], skipped: PALADIN_SKIPPED, notRead: PALADIN_NOT_READ },
  { className: 'Mage', talentJson: 'mageTalents.json', sources: MAGE_SOURCES, extractors: [...MAGE_EXTRACTORS, ...MAGE_STAT_EXTRACTORS], skipped: MAGE_SKIPPED, notRead: MAGE_NOT_READ },
  { className: 'Priest', talentJson: 'priestTalents.json', sources: PRIEST_SOURCES, extractors: [...PRIEST_EXTRACTORS, ...PRIEST_STAT_EXTRACTORS], skipped: PRIEST_SKIPPED, notRead: PRIEST_NOT_READ },
  { className: 'Warlock', talentJson: 'warlockTalents.json', sources: WARLOCK_SOURCES, extractors: [...WARLOCK_EXTRACTORS, ...WARLOCK_DEMON_EXTRACTORS], skipped: WARLOCK_SKIPPED, notRead: WARLOCK_NOT_READ },
]

const effects = []
const skippedAll = []
const notReadAll = []
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
      // A constant the multiplier carries on top of the per-rank slope, for having the talent at
      // all. Only Shaman's Flurry needs it; every other extractor leaves it undefined.
      baseBonus: extractor.baseBonus ? extractor.baseBonus(hit.m, second) : undefined,
      // Only the three stat-routed kinds carry these; every other kind names its destination by
      // `kind` alone.
      school: extractor.school,
      stat: extractor.stat,
      from: extractor.from,
      to: extractor.to,
      caveat: extractor.caveat,
      source: hit.path,
    })
  }

  for (const [covers, reason] of entry.skipped) {
    const named = covers.map((cover) => (typeof cover === 'string' ? { talent: cover } : cover))
    const talents = []
    for (const { talent: name, part } of named) {
      const talent = talentsByName.get(name)
      if (!talent) {
        failures.push(`${entry.className} skipped ${name}: no talent by that name in ${entry.talentJson}`)
        continue
      }
      // Refused whole and extracted at once would make the caveat contradict the estimate.
      if (!part && effects.some((effect) => effect.talentId === talent.id)) {
        failures.push(`${entry.className} skipped ${name}: it has an extracted effect, so name the part that is refused`)
        continue
      }
      if (skippedAll.some((skip) => skip.talents.some((t) => t.talentId === talent.id))) {
        failures.push(`${entry.className} skipped ${name}: refused twice`)
        continue
      }
      talents.push({ talentId: talent.id, talent: name, part })
    }
    const label = named.map(({ talent, part }) => (part ? `${talent} (${part})` : talent)).join(' / ')
    skippedAll.push({ className: entry.className, talent: label, talents, reason })
  }

  for (const kind of ['ability', 'buff', 'utility']) {
    for (const listed of entry.notRead[kind]) {
      const { talent: name, ...rest } = typeof listed === 'string' ? { talent: listed } : listed
      const talent = talentsByName.get(name)
      if (!talent) {
        failures.push(`${entry.className} not read ${name}: no talent by that name in ${entry.talentJson}`)
        continue
      }
      const extracted = effects.some((effect) => effect.talentId === talent.id)
      const refusal = skippedAll.flatMap((skip) => skip.talents).find((t) => t.talentId === talent.id)
      // Only an ability can share a talent with a refusal, and only a partial one: Stormstrike's strike
      // is in Enhancement's rotation while its Nature debuff is refused.
      if (extracted || (refusal && (kind !== 'ability' || !refusal.part))) {
        failures.push(`${entry.className} not read ${name}: it is ${extracted ? 'extracted' : 'refused'}, so it is read or refused, not "${kind}"`)
        continue
      }
      if (notReadAll.some((each) => each.talentId === talent.id)) {
        failures.push(`${entry.className} not read ${name}: listed twice`)
        continue
      }
      notReadAll.push({ className: entry.className, kind, talentId: talent.id, talent: name, ...rest })
    }
  }

  // Every talent is accounted for, or the run stops: an unmentioned talent is how a damage talent
  // used to reach no caveat while the tooltip called it utility.
  for (const talent of tree.trees.flatMap((t) => t.talents)) {
    const accounted =
      effects.some((effect) => effect.talentId === talent.id) ||
      skippedAll.some((skip) => skip.talents.some((t) => t.talentId === talent.id)) ||
      notReadAll.some((each) => each.talentId === talent.id)
    if (!accounted) failures.push(`${entry.className} ${talent.name}: neither extracted, refused nor listed as not read`)
  }
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
  notRead: notReadAll,
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
console.log(`not read: ${notReadAll.length} talents (${['ability', 'buff', 'utility'].map((kind) => `${notReadAll.filter((each) => each.kind === kind).length} ${kind}`).join(', ')}).`)
