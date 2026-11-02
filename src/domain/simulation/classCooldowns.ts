import type { TbcClass, TbcSpec } from '../character/characterTypes'
import { effectUptime } from './combatConstants'

/**
 * The timed damage cooldowns the DPS specs press, priced the way on-use trinkets already are: pressed
 * on cooldown, worth `duration ÷ cooldown` of their effect (`effectUptime`). The owner's call, 2026-11-02.
 *
 * **Why this rule and not a timeline.** The model has no fight clock, so a cooldown is either averaged
 * or left out, and leaving it out understates by the whole of it. Averaging is the same trade Bloodlust
 * and every on-use trinket already make. It is a **steady state**: a real fight of three to five minutes
 * presses each cooldown at the pull (wowsims does, `tryActivateHelper`), so a long cooldown is worth a
 * little more in a short fight than this gives it. Recklessness's 30 minutes is the extreme: once a
 * fight in practice, 0.8% here.
 *
 * Each figure is the tooltip's (nether.wowhead.com, the host the talent ingest reads), cross-checked
 * against wowsims/tbc @3301fca, sourced by the tbc-researcher on 2026-11-02. They agree on every value.
 *
 * **Timed buffs only.** The one-charge cooldowns (Combustion, Cold Blood, Elemental Mastery, Presence of
 * Mind, Inner Focus, Amplify Curse, Shadowstep) are worth one better cast per use, not an uptime, and
 * stay refused until they are priced that way. Pets whose damage is unread (Water Elemental, Fire
 * Elemental Totem, Force of Nature, Shadowfiend), Tiger's Fury (bound by energy, not its 1-second
 * cooldown) and Shamanistic Rage (no damage) are out.
 */
export type CooldownEffect = {
  /** All damage the player deals, as a fraction: Avenging Wrath's 0.3, The Beast Within's 0.1. Not a pet's. */
  damageMultiplier?: number
  /** Spell damage only: Arcane Power's 0.3. */
  spellDamageMultiplier?: number
  /** Physical damage only: Death Wish's 0.2. */
  physicalDamageMultiplier?: number
  /** Spell casting speed, as a fraction: Icy Veins' 0.2. */
  castSpeed?: number
  /** Ranged attack speed: Rapid Fire's 0.4. */
  rangedAttackSpeed?: number
  /** Melee attack speed: Blade Flurry's 0.2, its single-target half. */
  meleeAttackSpeed?: number
  /** Energy regeneration, as a fraction: Adrenaline Rush's 1.0 (double). */
  energyRegen?: number
  /** The pet's damage: Bestial Wrath's 0.5. */
  petDamageMultiplier?: number
  /** Melee and ranged crit chance: Recklessness's 1.0. */
  meleeCritChance?: number
}

export type ClassCooldown = {
  id: string
  name: string
  /** The spell id the values were read from. */
  spellId: number
  className: TbcClass
  /** Baseline cooldowns a spec presses, where the class's other specs do not. */
  specs?: readonly TbcSpec[]
  /** A talent cooldown applies only when the build has a point in it (Wowhead talent id). */
  talentId?: number
  durationSeconds: number
  cooldownSeconds: number
  /** A talent that shortens the cooldown, per rank: Rapid Killing's 60 seconds off Rapid Fire. */
  cooldownReduction?: { talentId: number; secondsPerRank: number }
  effect: CooldownEffect
  notes: string
}

export const classCooldowns: readonly ClassCooldown[] = [
  {
    id: 'arcane-power',
    name: 'Arcane Power',
    spellId: 12042,
    className: 'Mage',
    talentId: 87,
    durationSeconds: 15,
    cooldownSeconds: 180,
    effect: { spellDamageMultiplier: 0.3 },
    notes:
      'Tooltip: "your spells deal 30% more damage while costing 30% more mana". wowsims: `registerArcanePowerCD`, `DamageDealtMultiplier` and `CostMultiplier` ×1.3 for 15 s. The mana half is not priced: the caster estimates track no mana pool.',
  },
  {
    id: 'icy-veins',
    name: 'Icy Veins',
    spellId: 12472,
    className: 'Mage',
    talentId: 69,
    durationSeconds: 20,
    cooldownSeconds: 180,
    effect: { castSpeed: 0.2 },
    notes:
      'Tooltip: "increasing spell casting speed by 20%". wowsims: `registerIcyVeinsCD`, `MultiplyCastSpeed(1.2)` for 20 s. Cold Snap resets it for a Frost Mage; that extra use is not priced.',
  },
  {
    id: 'rapid-fire',
    name: 'Rapid Fire',
    spellId: 3045,
    className: 'Hunter',
    durationSeconds: 15,
    cooldownSeconds: 300,
    cooldownReduction: { talentId: 1819, secondsPerRank: 60 },
    effect: { rangedAttackSpeed: 0.4 },
    notes:
      'Tooltip: "Increases ranged attack speed by 40% for 15 sec." Baseline for every Hunter. Rapid Killing takes 1 minute off a rank ("Reduces the cooldown of your Rapid Fire ability by 1 min"), so 3 minutes at 2/2. wowsims: `registerRapidFireCD`, `RangedSpeedMultiplier *= 1.4`, cooldown `5 min - 1 min × RapidKilling`. Readiness resetting it for Survival is not priced.',
  },
  {
    id: 'bestial-wrath',
    name: 'Bestial Wrath',
    spellId: 19574,
    className: 'Hunter',
    talentId: 1386,
    durationSeconds: 18,
    cooldownSeconds: 120,
    effect: { petDamageMultiplier: 0.5 },
    notes:
      'Tooltip: "Send your pet into a rage causing 50% additional damage for 18 sec." The pet\'s damage only. wowsims: `registerBestialWrathCD`, the pet\'s `DamageDealtMultiplier` ×1.5 for 18 s.',
  },
  {
    id: 'the-beast-within',
    name: 'The Beast Within',
    spellId: 34692,
    className: 'Hunter',
    talentId: 1803,
    // No cooldown of its own: it fires with Bestial Wrath, so it shares that one's timing.
    durationSeconds: 18,
    cooldownSeconds: 120,
    effect: { damageMultiplier: 0.1 },
    notes:
      'Tooltip: "causing 10% additional damage and reducing mana costs of all spells by 20%", for the Hunter while Bestial Wrath is up. wowsims applies it with Bestial Wrath when `TheBeastWithin` is set: damage ×1.1, cost ×0.8. The mana half is not priced.',
  },
  {
    id: 'death-wish',
    name: 'Death Wish',
    spellId: 12292,
    className: 'Warrior',
    talentId: 133,
    durationSeconds: 30,
    cooldownSeconds: 180,
    effect: { physicalDamageMultiplier: 0.2 },
    notes:
      'Tooltip: "increases your physical damage by 20%". An Arms talent, row 5; the Fury preset does not reach it. wowsims: `registerDeathWishCD`, `PhysicalDamageDealtMultiplier` ×1.2 for 30 s (and 5% more damage taken, which a damage estimate does not read).',
  },
  {
    id: 'recklessness',
    name: 'Recklessness',
    spellId: 1719,
    className: 'Warrior',
    specs: ['Arms', 'Fury'],
    durationSeconds: 15,
    cooldownSeconds: 1800,
    effect: { meleeCritChance: 1 },
    notes:
      'Tooltip: "The warrior will cause critical hits with most attacks". +100% melee and ranged crit for 15 s on a 30-minute cooldown, in Berserker Stance; both wowsims DPS presets use it. Averaged it is 0.8% of a fight; a real fight presses it once, at the pull, so it is worth more than this gives it.',
  },
  {
    id: 'avenging-wrath',
    name: 'Avenging Wrath',
    spellId: 31884,
    className: 'Paladin',
    specs: ['Retribution'],
    durationSeconds: 20,
    cooldownSeconds: 180,
    effect: { damageMultiplier: 0.3 },
    notes:
      'Tooltip: "Increases all damage caused by 30% for 20 sec." Baseline. wowsims: `sim/paladin/avenging_wrath.go`, `DamageDealtMultiplier` ×1.3, used on cooldown. Its Forbearance only blocks defensives.',
  },
  {
    id: 'adrenaline-rush',
    name: 'Adrenaline Rush',
    spellId: 13750,
    className: 'Rogue',
    talentId: 205,
    durationSeconds: 15,
    cooldownSeconds: 300,
    effect: { energyRegen: 1 },
    notes:
      'Tooltip: "Increases your Energy regeneration rate by 100% for 15 sec." wowsims: `registerAdrenalineRushCD`, `EnergyTickMultiplier = 2`, pressed nearly on cooldown (it waits while energy is near full).',
  },
  {
    id: 'blade-flurry',
    name: 'Blade Flurry',
    spellId: 13877,
    className: 'Rogue',
    talentId: 223,
    durationSeconds: 15,
    cooldownSeconds: 120,
    effect: { meleeAttackSpeed: 0.2 },
    notes:
      'Tooltip: "Increases your attack speed by 20%." Its second-target half does nothing against one boss, and wowsims skips it with fewer than two targets. wowsims: `registerBladeFlurryCD`.',
  },
]

/** A cooldown's uptime for a build: its duration over its cooldown, shortened by any talent that does. */
export function cooldownUptime(cooldown: ClassCooldown, points: Readonly<Record<number, number>>): number {
  const reduction = cooldown.cooldownReduction ? (points[cooldown.cooldownReduction.talentId] ?? 0) * cooldown.cooldownReduction.secondsPerRank : 0
  return effectUptime(cooldown.durationSeconds, cooldown.cooldownSeconds - reduction)
}

/** The cooldowns a character presses: its class's, gated on the talent or the spec. */
export function cooldownsFor(className: TbcClass, spec: TbcSpec, points: Readonly<Record<number, number>>): readonly ClassCooldown[] {
  return classCooldowns.filter(
    (cooldown) =>
      cooldown.className === className &&
      (!cooldown.specs || cooldown.specs.includes(spec)) &&
      (cooldown.talentId === undefined || (points[cooldown.talentId] ?? 0) > 0),
  )
}

/** Every effect a character's cooldowns add, each weighted by its uptime. Fractions, summed. */
export function averagedCooldownEffect(className: TbcClass, spec: TbcSpec, points: Readonly<Record<number, number>>): Required<CooldownEffect> {
  const total: Required<CooldownEffect> = {
    damageMultiplier: 0,
    spellDamageMultiplier: 0,
    physicalDamageMultiplier: 0,
    castSpeed: 0,
    rangedAttackSpeed: 0,
    meleeAttackSpeed: 0,
    energyRegen: 0,
    petDamageMultiplier: 0,
    meleeCritChance: 0,
  }
  for (const cooldown of cooldownsFor(className, spec, points)) {
    const uptime = cooldownUptime(cooldown, points)
    for (const key of Object.keys(total) as (keyof CooldownEffect)[]) total[key] += (cooldown.effect[key] ?? 0) * uptime
  }
  return total
}
