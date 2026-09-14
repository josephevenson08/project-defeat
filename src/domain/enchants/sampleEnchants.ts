import rawEnchants from './enchantCatalogue.json' with { type: 'json' }
import rawEnchantSupplement from './enchantSupplement.json' with { type: 'json' }
import type { CharacterProfile } from '../character/characterTypes'
import type { GearSlot } from '../gear/gearSlots'
import type { EquippedGear, GearItem } from '../gear/itemTypes'
import type { Profession } from '../professions/professionTypes'
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

const mergedEnchants: readonly Enchant[] = [
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

/**
 * What the upstream data cannot tell us about TBC's ring enchants, applied as an overlay.
 *
 * **An overlay rather than an edit to the JSON, because both files are generated.**
 * `ingest-gems-enchants.mjs` and `supplement-enchants.mjs` rewrite them, so a hand-edited field
 * would survive exactly until the next ingest and then vanish without anything failing.
 *
 * Two facts, and the app had both wrong in opposite directions:
 *
 * **They are Enchanter-only.** Wowhead's spell 27927 carries "target must be own item" — nobody can
 * apply these for you. Carrying no restriction, they were offered to every character, so a Fury
 * Warrior who has never touched a profession could take +4 to five stats they could not have in
 * game. That overstated every non-Enchanter.
 *
 * **They go on both rings.** Every one is filed `slot: 'Finger 1'` with no `allowedSlots`, and
 * `enchantFitsSlot` falls back to `[enchant.slot]` — so Finger 2 was offered **nothing at all**, on
 * every character, forever. `professionPayoffs.ts` says it plainly in its own copy: "+4 all stats
 * per ring, so +8 across both". The app was reading its own sourced data and delivering half of it.
 *
 * Those two errors pointed opposite ways, which is why neither showed up as an obviously wrong
 * total, and why fixing only the slot half would have made the first one worse.
 */
const RING_ENCHANT_IDS = ['ring-striking', 'ring-spellpower', 'ring-stats', 'ring-healing-power'] as const

const enchantOverlay: ReadonlyMap<string, Partial<Enchant>> = new Map(
  RING_ENCHANT_IDS.map((id) => [
    id,
    { profession: 'Enchanting' as const, allowedSlots: ['Finger 1', 'Finger 2'] as GearSlot[] },
  ]),
)

/*
 * Applied by id, and a miss is loud. If an ingest ever renames one of these, the restriction would
 * silently stop applying and the app would go back to handing every character a free ring enchant —
 * the exact bug this overlay exists to fix, reintroduced by a rename nobody connected to it.
 */
const mergedIds = new Set(mergedEnchants.map((enchant) => enchant.id))
const unmatchedOverlayIds = [...enchantOverlay.keys()].filter((id) => !mergedIds.has(id))
if (unmatchedOverlayIds.length > 0) {
  throw new Error(
    `Enchant overlay targets ids that are not in the catalogue: ${unmatchedOverlayIds.join(', ')}. ` +
      'An ingest probably renamed them; re-point the overlay rather than deleting it.',
  )
}

export const sampleEnchants: readonly Enchant[] = mergedEnchants.map((enchant) => {
  const overlay = enchantOverlay.get(enchant.id)
  return overlay ? { ...enchant, ...overlay } : enchant
})

const byId = new Map(sampleEnchants.map((enchant) => [enchant.id, enchant]))

function enchantFitsSlot(enchant: Enchant, slot: GearSlot) {
  return (enchant.allowedSlots ?? [enchant.slot]).includes(slot)
}

function enchantFitsCharacter(enchant: Enchant, character: CharacterProfile | undefined) {
  if (!character) return true
  if (enchant.allowedClasses && !enchant.allowedClasses.includes(character.className)) return false
  if (enchant.allowedSpecs && !enchant.allowedSpecs.includes(character.spec)) return false
  /*
   * A character with no professions is not a character who gets everything — it is one who gets
   * nothing profession-locked, which is what the game does. `professions` is optional so that every
   * build saved before this existed still loads, and those builds correctly lose a ring enchant they
   * were never entitled to.
   */
  if (enchant.profession && character.professions?.includes(enchant.profession) !== true) return false
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

/**
 * The professions that would unlock more enchants for this slot than the character can currently take.
 *
 * **A restriction nobody can see reads as a missing feature.** With no professions the ring slots
 * simply have no enchant control at all, which is indistinguishable from the app not modelling ring
 * enchants — and it is the same silence that let them be handed to everyone for so long. The popup
 * uses this to say which profession the missing options need.
 *
 * Returns professions rather than a boolean so the sentence can name one. It is a list because
 * nothing stops a future slot being gated by two, not because any slot is today.
 */
export function professionsGatingEnchantsForSlot(
  slot: GearSlot,
  character: CharacterProfile,
  item?: GearItem,
): readonly Profession[] {
  const gated = sampleEnchants.filter(
    (enchant) =>
      enchant.profession !== undefined &&
      enchantFitsSlot(enchant, slot) &&
      enchantFitsItem(enchant, item) &&
      character.professions?.includes(enchant.profession) !== true,
  )

  return [...new Set(gated.map((enchant) => enchant.profession as Profession))]
}

/**
 * Clears any equipped enchant the character is no longer entitled to.
 *
 * **A restriction that only filters the picker is not a restriction.** Take Enchanting, put Ring -
 * Stats on both hands, drop Enchanting: the picker stops offering it and the equipped enchant sits
 * there contributing +8 to five stats, because nothing re-examined the gear. The same is true of a
 * saved build, whose `enchantId` is carried across on a `typeof === 'string'` check and no legality
 * test at all.
 *
 * So this runs wherever the character changes, next to `normalizeGearForCharacter` — which solves
 * exactly this problem for *items* and has never looked at enchants.
 *
 * It closes one pre-existing hole as a side effect: a single enchant in the catalogue is
 * class-restricted, and it survived a class switch the same way.
 */
export function dropIllegalEnchants(gear: EquippedGear, character: CharacterProfile): EquippedGear {
  let changed = false

  const next = Object.fromEntries(
    Object.entries(gear).map(([slot, equipped]) => {
      const gearSlot = slot as GearSlot
      if (!equipped?.enchantId) return [gearSlot, equipped]

      const stillLegal = getEnchantsForSlot(gearSlot, character, equipped.item).some(
        (enchant) => enchant.id === equipped.enchantId,
      )
      if (stillLegal) return [gearSlot, equipped]

      changed = true
      const { enchantId: _dropped, ...rest } = equipped
      return [gearSlot, rest]
    }),
  ) as EquippedGear

  // Returning the same reference when nothing moved keeps this free to call on every character
  // change, and stops it invalidating the memos downstream that key on gear identity.
  return changed ? next : gear
}
