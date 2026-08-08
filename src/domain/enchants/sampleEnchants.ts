import rawEnchants from './enchantCatalogue.json' with { type: 'json' }
import rawEnchantSupplement from './enchantSupplement.json' with { type: 'json' }
import type { CharacterProfile } from '../character/characterTypes'
import type { GearSlot } from '../gear/gearSlots'
import type { GearItem } from '../gear/itemTypes'
import type { Enchant } from './enchantTypes'

/**
 * The enchant catalogue, ingested from wowsims/tbc by `tools/ingest/ingest-gems-enchants.mjs`.
 *
 * This was 22 hand-written entries covering a handful of slots — glove and boot enchants existed for
 * one role each — and is now the full 79.
 *
 * What the ingested data does *not* carry is the old hand-written role and spec tagging, which used
 * to hide, say, spell-power enchants from a warrior. That filtering is gone deliberately: the game
 * does not restrict enchants by role, and with 3-14 options per slot the list is short enough to
 * read. What survives is the filtering the game really does impose — class restrictions, and shield
 * or two-hand only weapon enchants.
 *
 * A further 15 come from `tools/ingest/supplement-enchants.mjs`: enchants the Wowhead guides
 * recommend that wowsims does not model, mostly healer ones. A BiS recommendation the gear popup
 * cannot apply is worse than no recommendation at all.
 */
const supplementEnchants = rawEnchantSupplement.enchants as Enchant[]

export const sampleEnchants: readonly Enchant[] = [
  // Where an enchant is in both, merge the ids rather than letting one entry win: "Bracer -
  // Spellpower" is 22534 to wowsims and 46498 to the guides, and either alone leaves a BiS
  // recommendation citing an id nothing answers to.
  ...(rawEnchants.enchants as Enchant[]).map((base) => {
    const extra = supplementEnchants.find((e) => e.id === base.id)
    if (!extra) return base
    const ids = [base.effectId, ...(base.effectIds ?? []), extra.effectId, ...(extra.effectIds ?? [])]
    return { ...base, effectIds: [...new Set(ids.filter((id): id is number => id !== undefined))].sort((a, b) => a - b) }
  }),
  ...supplementEnchants.filter((extra) => !rawEnchants.enchants.some((base) => base.id === extra.id)),
]

const byId = new Map(sampleEnchants.map((enchant) => [enchant.id, enchant]))

function enchantFitsSlot(enchant: Enchant, slot: GearSlot) {
  return (enchant.allowedSlots ?? [enchant.slot]).includes(slot)
}

function enchantFitsCharacter(enchant: Enchant, character: CharacterProfile | undefined) {
  if (!character) return true
  if (enchant.allowedClasses && !enchant.allowedClasses.includes(character.className)) return false
  if (enchant.allowedSpecs && !enchant.allowedSpecs.includes(character.spec)) return false
  return true
}

/**
 * Weapon enchants that only go on a shield, or only on a two-hander, must not be offered elsewhere —
 * a dual-wielding shaman should never see "Shield - Intellect" against a fist weapon.
 */
function enchantFitsItem(enchant: Enchant, item: GearItem | undefined) {
  if (!item) return true
  if (enchant.requiresShield && item.weaponType !== 'Shield') return false
  if (enchant.requiresTwoHand && item.handType !== 'Two Hand') return false
  // A plain weapon enchant is legal on any weapon but not on a shield or a held-in-off-hand frill.
  if (enchant.allowedSlots?.includes('Off Hand') && (item.weaponType === 'Shield' || item.weaponType === 'Held In Off-hand')) {
    return false
  }
  if (enchant.allowedWeaponTypes) {
    return item.weaponType ? enchant.allowedWeaponTypes.includes(item.weaponType) : true
  }
  return true
}

export function getEnchantsForSlot(slot: GearSlot, character?: CharacterProfile, item?: GearItem) {
  return sampleEnchants.filter(
    (enchant) => enchantFitsSlot(enchant, slot) && enchantFitsCharacter(enchant, character) && enchantFitsItem(enchant, item),
  )
}

export function getEnchantById(id: string | undefined) {
  return id ? byId.get(id) : undefined
}
