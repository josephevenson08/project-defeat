import type { GearSlot } from './gearSlots'
import type { ArmorType, GearItem } from './itemTypes'

/**
 * Base armor on a TBC armour piece is **deterministic**, not a per-item designer choice. Two Plate
 * helms of the same item level with completely different stat budgets carry identical armor to the
 * integer, which is what makes deriving it legitimate rather than inventing precision.
 *
 * It is linear in item level, per armour class and slot: `slope * itemLevel + intercept`. The fits
 * below come from regressing real Wowhead listing data, and every one that had an independent
 * reference point reproduces it exactly — Cloth Head 181 at item level 133, Leather Head 341, Mail
 * Head 759, a shield 5279 at 125. Maximum residuals are under 1 armor point.
 *
 * This exists because the catalog records armor on only 5 of ~143 armour pieces, which left the
 * tank's Effective Health systematically understated. Deriving it fixes 138 items at once, where
 * sourcing them one at a time would have taken many research passes.
 */
type ArmorLine = { slope: number; intercept: number }

/** Epic-quality fits. Rare is a fixed fraction of these — see `QUALITY_MULTIPLIER`. */
const MAIL: Partial<Record<GearSlot, ArmorLine>> = {
  Head: { slope: 5.505, intercept: 26.43 },
  Shoulders: { slope: 5.078, intercept: 24.66 },
  Chest: { slope: 6.774, intercept: 32.78 },
  Wrists: { slope: 2.978, intercept: 12.52 },
  Hands: { slope: 4.241, intercept: 19.38 },
  Waist: { slope: 3.802, intercept: 19.71 },
  Legs: { slope: 5.929, intercept: 28.39 },
  Feet: { slope: 4.658, intercept: 22.33 },
}

const CLOTH: Partial<Record<GearSlot, ArmorLine>> = {
  Head: { slope: 1.313, intercept: 6.72 },
  Shoulders: { slope: 1.217, intercept: 5.5 },
  Chest: { slope: 1.622, intercept: 7.43 },
  Wrists: { slope: 0.7044, intercept: 4.11 },
  Hands: { slope: 1.009, intercept: 5.53 },
  Waist: { slope: 0.9, intercept: 5.88 },
  Legs: { slope: 1.412, intercept: 7.58 },
  Feet: { slope: 1.101, intercept: 7.09 },
}

const LEATHER: Partial<Record<GearSlot, ArmorLine>> = {
  Head: { slope: 2.484, intercept: 10.25 },
  Shoulders: { slope: 2.293, intercept: 9.43 },
  Chest: { slope: 3.07, intercept: 10.76 },
  Wrists: { slope: 1.327, intercept: 6.74 },
  Hands: { slope: 1.915, intercept: 7.32 },
  Waist: { slope: 1.717, intercept: 7.29 },
  Legs: { slope: 2.673, intercept: 11.15 },
  Feet: { slope: 2.097, intercept: 9.3 },
}

/**
 * Plate was only regressed directly at four slots. The remaining four are derived as Mail scaled by
 * this ratio, which the four direct fits agree on to within 0.2% (1.7885 / 1.7866 / 1.7904 / 1.7868).
 *
 * That derivation was checked before being trusted: against five independently sourced Plate values
 * at item level 133 it lands within 1.8 armor, under 0.15% error.
 */
const PLATE_TO_MAIL_RATIO = 1.7881

const PLATE_DIRECT: Partial<Record<GearSlot, ArmorLine>> = {
  Chest: { slope: 12.115, intercept: 56.7 },
  Legs: { slope: 10.593, intercept: 50.7 },
  Waist: { slope: 6.807, intercept: 33.1 },
  Wrists: { slope: 5.321, intercept: 22.0 },
}

/** Cloaks are one category rather than per-armour-class, and are slope-driven rather than flat. */
const BACK: ArmorLine = { slope: 0.81, intercept: 3.95 }

/** Shields are their own category and carry far more armor than any worn slot. */
const SHIELD: ArmorLine = { slope: 40.686, intercept: 192.89 }

/**
 * At the same item level, an Epic carries ~1.245x the armor of a Rare. Confirmed on four independent
 * slot comparisons. The fits above are Epic, so a Rare divides by this — without it every Rare piece
 * would read ~20% too high.
 */
const QUALITY_MULTIPLIER = 1.245

/**
 * Item levels below 100 follow a different curve, and every fit above was restricted to >= 100.
 * Extrapolating below that would be reading the line outside the data it came from.
 */
const MIN_DERIVABLE_ITEM_LEVEL = 100

function lineFor(armorType: ArmorType, slot: GearSlot): ArmorLine | undefined {
  if (slot === 'Back') return BACK
  if (armorType === 'Shield') return SHIELD
  if (armorType === 'Cloth') return CLOTH[slot]
  if (armorType === 'Leather') return LEATHER[slot]
  if (armorType === 'Mail') return MAIL[slot]

  if (armorType === 'Plate') {
    const direct = PLATE_DIRECT[slot]
    if (direct) return direct
    const mail = MAIL[slot]
    if (!mail) return undefined
    return { slope: mail.slope * PLATE_TO_MAIL_RATIO, intercept: mail.intercept * PLATE_TO_MAIL_RATIO }
  }

  return undefined
}

/**
 * Feral druid tank gear sits on a **second, inflated leather track** carrying roughly 1.4-2x the
 * armor of ordinary leather at the same item level — the Malorne, Nordrassil and Thunderheart feral
 * pieces, among others. That track was not fitted, so deriving it from the ordinary leather line
 * would understate those items badly.
 *
 * Rather than maintain a list of item ids that would silently go stale, this catches the shape of
 * the thing: leather worn by a tank. It errs toward deriving nothing, which leaves the item where it
 * already was rather than giving it a confidently wrong number.
 */
function isInflatedLeatherTrack(item: GearItem) {
  return item.armorType === 'Leather' && (item.roles?.includes('Tank') ?? false)
}

/**
 * Armor for an item that does not record its own, or `undefined` when it should not be guessed at.
 *
 * An item's explicitly recorded armor always wins — this only fills gaps, so sourcing an item later
 * silently replaces the derived value rather than conflicting with it.
 */
export function deriveItemArmor(item: GearItem): number | undefined {
  if (item.stats.armor !== undefined) return undefined
  if (!item.armorType || !item.itemLevel) return undefined
  if (item.itemLevel < MIN_DERIVABLE_ITEM_LEVEL) return undefined
  if (isInflatedLeatherTrack(item)) return undefined

  const line = lineFor(item.armorType, item.slot)
  if (!line) return undefined

  const epicArmor = line.slope * item.itemLevel + line.intercept
  const armor = item.quality === 'Epic' ? epicArmor : epicArmor / QUALITY_MULTIPLIER

  return Math.round(armor)
}
