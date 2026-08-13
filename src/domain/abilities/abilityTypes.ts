import type { TbcClass, TbcSpec } from '../character/characterTypes'

/**
 * What the ability actually does, from the simulator's point of view.
 *
 * `Direct Damage` / `Direct Heal` land in one lump when the cast finishes; `DoT` / `HoT` deliver
 * their amount over a duration in discrete ticks. `Melee Special` / `Ranged Special` are "yellow"
 * physical attacks — they scale off weapon damage and attack power rather than spell power, and
 * they cost rage/energy/mana rather than having a meaningful cast time.
 *
 * A few abilities are hybrids (Fireball is Direct Damage plus a small DoT; Regrowth is a Direct
 * Heal plus a HoT). Those record their dominant component here and describe the secondary one via
 * `periodic` and `notes`.
 */
export type AbilityEffectType =
  | 'Direct Damage'
  | 'DoT'
  | 'Direct Heal'
  | 'HoT'
  | 'Melee Special'
  | 'Ranged Special'

export type AbilityResourceType = 'Mana' | 'Rage' | 'Energy'

/**
 * Where the ability's scaling coefficient comes from. TBC derives most coefficients from a single
 * formula rather than storing them per spell:
 *
 * - `castTime/3.5` — direct damage/healing. The cast time is first clamped to [1.5s, 7s], so every
 *   instant and every sub-1.5s cast shares the 1.5/3.5 = 0.4286 floor and a 3.5s cast reaches 1.0.
 * - `instant 1.5/3.5` — the clamped-floor case called out separately because it applies to so many
 *   abilities (0.4286).
 * - `duration/15` — periodic effects. The full-duration coefficient is `duration / 15s`, then split
 *   evenly across ticks. An 18s DoT therefore carries 1.2 total.
 * - `channeled` — channels use their channel duration in place of a cast time.
 * - `hardcoded exception` — the ability's real coefficient deviates from the formulas above and is
 *   stored as an explicit override by the game (and by every emulator/sim that reproduces TBC).
 * - `attack power` / `weapon damage` — physical specials, which ignore spell power entirely.
 * - `none` — no scaling coefficient applies to the modeled component.
 *
 * Two further modifiers apply on top of the formula and explain several values that otherwise look
 * wrong: area-effect abilities receive only **half** the computed coefficient, and each additional
 * non-damage effect (a slow, a stun) costs a further **5%** multiplicatively. Frostbolt's famous
 * 0.8143 is exactly `(3.0 / 3.5) * 0.95` because of its slow.
 */
export type CoefficientBasis =
  | 'castTime/3.5'
  | 'instant 1.5/3.5'
  | 'duration/15'
  | 'channeled'
  | 'hardcoded exception'
  | 'attack power'
  | 'weapon damage'
  | 'none'

/** Base damage/healing before any scaling. `min === max` when the game defines a single fixed value. */
export type AmountRange = {
  min: number
  max: number
}

/** The periodic component of a DoT, a HoT, or a direct ability that also leaves one behind. */
export type PeriodicEffect = {
  durationSeconds: number
  /** Seconds between ticks. */
  tickIntervalSeconds: number
  ticks: number
  /** Base amount summed over the full duration, before scaling. */
  totalBaseAmount: number
  /** Base amount delivered by a single tick, before scaling. */
  perTickBaseAmount: number
}

/**
 * How the ability converts the character's stats into extra damage/healing.
 *
 * TBC keeps +damage and +healing as separate stats, but they share one coefficient formula, so
 * `spellPowerCoefficient` covers both — read it as "+healing" for a heal and "+spell damage" for a
 * nuke. The value is always the coefficient for the ability's **whole** effect; for periodic
 * effects, `spellPowerCoefficientPerTick` gives the per-tick share the game actually applies.
 */
export type AbilityScaling = {
  basis: CoefficientBasis
  /** Fraction of spell power (or +healing) added across the ability's full effect. */
  spellPowerCoefficient?: number
  /** Per-tick share of `spellPowerCoefficient`, for periodic effects. */
  spellPowerCoefficientPerTick?: number
  /** Fraction of melee or ranged attack power added (e.g. Bloodthirst 0.45, Steady Shot 0.2). */
  attackPowerCoefficient?: number
  /** Multiple of weapon damage the special attack deals; 1 means 100% weapon damage. */
  weaponDamageMultiplier?: number
  /**
   * True when the weapon-damage portion is normalized — the swing is valued at a fixed speed for
   * its weapon class (2.4s one-hand, 3.3s two-hand, 1.7s dagger, 2.8s ranged) instead of the
   * weapon's real speed, so slow weapons gain no advantage on the special.
   */
  normalizedWeaponDamage?: boolean
  /** Flat damage added on top of the weapon-damage portion (e.g. Sinister Strike's +98). */
  flatWeaponDamageBonus?: number
  /**
   * True for specials that strike once with EACH weapon (Mutilate, Stormstrike). The weapon-damage
   * multiplier and flat bonus then apply per hand, so a consumer that applies them once halves the
   * ability. Recorded as a flag rather than left in prose so the simulator can act on it.
   */
  hitsBothWeapons?: boolean
  /** Why the coefficient has the value it does, including any exception or cross-source conflict. */
  coefficientNotes?: string
}

export type AbilityResourceCost = {
  type: AbilityResourceType
  cost: number
  /** e.g. "8% of base mana" for abilities the tooltip expresses as a percentage. */
  note?: string
}

/**
 * The single ability a spec's Phase 1/2 raid rotation is built around — a filler nuke, a maintained
 * DoT/HoT, a spam heal, or a tank's primary threat button. This is deliberately *not* a full
 * rotation model.
 *
 * It exists to replace the generic 3s-nuke / 2.5s-heal placeholders in `calculateSimulation.ts`
 * with real per-spec cast times, base amounts, and coefficients. Multi-ability rotations,
 * cooldown usage, proc modeling, and talent scaling are all future work — every entry's `notes`
 * says how far the single-ability approximation is from that spec's real rotation.
 *
 * All numbers are **untalented** values for the highest rank trainable at level 70.
 */
export type SignatureAbility = {
  className: TbcClass
  spec: TbcSpec
  name: string
  /** In-game/Wowhead spell ID of the max rank at level 70. */
  spellId: number
  /** Max rank trainable at 70. Omitted for single-rank talent abilities (Stormstrike, Mutilate...). */
  rank?: number
  /**
   * Character level at which the listed rank becomes available. Omitted for abilities with no
   * intrinsic level requirement, which are gated only by having enough talent points to reach them
   * (Crusader Strike, Stormstrike) — those record the real gate in `notes`.
   */
  requiredLevel?: number
  effectType: AbilityEffectType
  /** Base cast time in seconds; 0 for an instant-cast spell or a physical special attack. */
  castTimeSeconds: number
  /** True when `castTimeSeconds` is a channel duration rather than a cast time (Mind Flay). */
  channeled?: boolean
  /** GCD the ability triggers: 1.5s for most, 1.0s for energy-based rogue and cat-form druid attacks. */
  gcdSeconds: number
  /**
   * True for abilities that trigger no global cooldown at all, so they can be used alongside the
   * rotation rather than competing with it for GCDs. Heroic Strike and Cleave are the TBC examples.
   *
   * Recorded as its own flag rather than `gcdSeconds: 0`, because consumers read that field as
   * `gcdSeconds || 1.5` and a zero would silently become a full global cooldown.
   */
  offGlobalCooldown?: boolean
  /**
   * True for "on next swing" abilities, which do not land alongside the main-hand auto attack but
   * **replace** it. Two consequences a consumer must handle or it will overstate the ability badly:
   * its real contribution is only the *difference* from the swing it displaced, and the displaced
   * swing generates no rage, because the rage aura excludes main-hand specials.
   */
  replacesMainHandSwing?: boolean
  cooldownSeconds?: number
  resource?: AbilityResourceCost
  /** Base damage/healing at max rank before scaling. Omitted when the ability has no flat base. */
  baseAmount?: AmountRange
  /** Present for DoT/HoT effects, and for direct abilities that leave a periodic component behind. */
  periodic?: PeriodicEffect
  scaling: AbilityScaling
  needsVerification?: boolean
  notes?: string
}
