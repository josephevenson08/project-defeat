import type { CharacterRole, TbcClass, TbcSpec } from '../character/characterTypes'
import type { StatBlock } from '../stats/statTypes'
import type { GearSlot } from './gearSlots'

export type ItemQuality = 'Poor' | 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary'

export type ItemSource =
  | 'Dungeon'
  | 'Heroic Dungeon'
  | 'Raid'
  | 'Quest'
  | 'Crafted'
  | 'PvP'
  | 'Reputation'
  | 'World Drop'
  | 'Vendor'
  | 'Other'

export type SocketColor = 'Red' | 'Yellow' | 'Blue' | 'Meta'

export type ArmorType = 'Cloth' | 'Leather' | 'Mail' | 'Plate' | 'Shield' | 'Relic' | 'Other'

export type WeaponType =
  | 'Axe'
  | 'Dagger'
  | 'Fist Weapon'
  | 'Mace'
  | 'Sword'
  | 'Staff'
  | 'Polearm'
  | 'Bow'
  | 'Gun'
  | 'Crossbow'
  | 'Thrown'
  | 'Wand'
  | 'Shield'
  | 'Held In Off-hand'
  | 'Totem'
  | 'Libram'
  | 'Idol'
  | 'Other'

/**
 * Which hand a weapon can occupy. Recorded because it decides slot legality: a one-hander is legal in
 * either hand for a dual-wielding spec, while a main-hand-only weapon is not, and the item's slot
 * alone cannot express that.
 */
export type WeaponHandType = 'One Hand' | 'Two Hand' | 'Main Hand' | 'Off Hand'

export type BuildRole = CharacterRole | 'Hybrid'

export type CraftingMaterial = {
  name: string
  quantity: number
  wowItemId?: number
  /** Where/how to obtain this material: farmed mob(s) + zone, vendor, auction house, sub-recipe, etc. */
  farmSource: string
  needsVerification?: boolean
}

export type CraftingInfo = {
  /** Profession skill level required to learn/craft the recipe. */
  requiredSkill?: number
  /** Profession specialization required, if any (e.g. "Spellfire Tailoring", "Hammersmith"). */
  specialization?: string
  /** Where the recipe/pattern/plans/schematic itself is obtained. */
  recipeSource: string
  materials: readonly CraftingMaterial[]
  needsVerification?: boolean
  notes?: string
}

/**
 * A trinket or weapon effect granting stats temporarily rather than permanently.
 *
 * Recording these matters more than it looks: an audit of all 14 catalogued trinkets found that
 * **not one is a pure stat stick** — every one carries a proc or an on-use, and two have no flat
 * stats at all. A model reading only `stats` prices that entire item class at close to zero.
 *
 * `kind` decides how uptime is derived, and the two are not equally trustworthy:
 *
 * - `onUse` — pressed on cooldown, so uptime is exactly `duration / cooldown`. This is the same
 *   assumption the ability model already makes for cooldown abilities, and is as solid as that one.
 * - `proc` — fires from combat, so true uptime depends on how often the trigger happens. An internal
 *   cooldown starts when the proc FIRES and runs concurrently with the buff, so uptime is the same
 *   `duration / cooldown`. That is an **optimistic bound**: it assumes the trigger is ready the
 *   instant the cooldown expires, which a raid fight of near-continuous casts and swings approaches
 *   but never reaches, and a proc gated on spell crits has to wait for a crit this does not model.
 */
export type ItemEffect = {
  kind: 'proc' | 'onUse'
  /** Stats granted while active, at full value. Averaged by uptime before being applied. */
  statBonus: Partial<StatBlock>
  durationSeconds: number
  /** Use cooldown for `onUse`; internal cooldown for `proc`. */
  cooldownSeconds: number
  /** Proc chance where the tooltip gives one. Recorded for provenance — the uptime approximation does not read it. */
  chancePercent?: number
  /** What sets it off ("on spell crit", "on special attack"). Procs vary a lot here, and it is the main reason the approximation can be wrong. */
  trigger?: string
  /** For effects whose value is not a stat bonus at all — a damage proc, a mana return, a heal. Set this and leave `statBonus` empty. */
  notModelled?: string
}

export type GearItem = {
  id: string
  wowItemId?: number
  name: string
  slot: GearSlot
  quality: ItemQuality
  /** A temporary-stat proc or on-use effect. See `ItemEffect` — trinkets are effect-driven almost without exception. */
  effect?: ItemEffect
  /**
   * Where the item comes from. Optional because the bulk-ingested catalogue carries no source data,
   * and stamping thousands of items with a guessed `'Other'` would be exactly the invented-value
   * problem that made the previous catalogue untrustworthy. Absent means unknown, not "Other".
   */
  source?: ItemSource
  phase?: number
  requiredLevel?: number
  itemLevel?: number
  unique?: boolean
  uniqueEquipped?: boolean
  stats: Partial<StatBlock>
  armorType?: ArmorType
  weaponType?: WeaponType
  /** Which hand(s) the weapon may occupy. Drives off-hand legality; see `WeaponHandType`. */
  handType?: WeaponHandType
  /** Weapon swing speed in seconds (e.g. 2.60). Only meaningful for weapons with swing damage. */
  weaponSpeed?: number
  /** Minimum weapon damage roll for a single swing. Only meaningful for weapons with swing damage. */
  weaponDamageMin?: number
  /** Maximum weapon damage roll for a single swing. Only meaningful for weapons with swing damage. */
  weaponDamageMax?: number
  sockets?: SocketColor[]
  socketBonus?: Partial<StatBlock>
  /** Tier set this piece belongs to, keyed to `sampleItemSets`. Set bonuses are recorded and surfaced but not yet applied — see `ItemSet`. */
  setId?: string
  allowedClasses?: TbcClass[]
  allowedSpecs?: TbcSpec[]
  roles?: BuildRole[]
  zone?: string
  instance?: string
  boss?: string
  vendor?: string
  reputation?: string
  craftedBy?: string
  crafting?: CraftingInfo
  /**
   * The **provenance** is unconfirmed — where it drops, which roles want it, what crafts it.
   *
   * **It says nothing about the stats**, and reading it as if it did is a mistake this repo has
   * already made. `itemCatalogue.ts` carries this field over from the curated entry through
   * `PROVENANCE_FIELDS`, while everything mechanical comes from the ingest, so 141 of the 142 items
   * carrying this flag have stats that are fully sourced. Use `statsEstimated` for that question.
   */
  needsVerification?: boolean
  /**
   * The **stats themselves** are unverified, because this item reached the catalogue with no
   * ingested counterpart at all.
   *
   * These are the 26 `unmatchedCurated` entries — the least trustworthy rows in the project, where an
   * audit found invented stats, fabricated sockets and at least one item that does not exist. They
   * are kept only so existing BiS and raid-loot references resolve.
   *
   * **Separate from `needsVerification` because the two were conflated and it ran the wrong way.**
   * The upgrade finder read `needsVerification` as "the stats are estimated", which over-warned on
   * 141 items whose stats are sourced and, far worse, stayed silent on 25 whose stats are invented —
   * those carry no provenance flag, so the app vouched for numbers it had made up.
   */
  statsEstimated?: boolean
  notes?: string
}

export type EquippedSlot = {
  item: GearItem
  gemIds: string[]
  enchantId?: string
}

export type EquippedGear = Record<GearSlot, EquippedSlot>
