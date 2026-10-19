import { catalogueTip, type ItemTipModel } from '../../components/ui/itemTipModel'
import { getEnchantById } from '../../domain/enchants/sampleEnchants'
import { getItemSetById } from '../../domain/gear/itemSets'
import type { EquippedSlot, GearItem } from '../../domain/gear/itemTypes'
import { getGemById, socketBonusIsActive } from '../../domain/gems/sampleGems'
import { getIconName } from '../../domain/icons/icons'

/** "Chest - Exceptional Stats" and "Enchant Boots - Cat's Swiftness" read as the game prints them on the item. */
const enchantLine = (name: string) => name.replace(/^(Enchant \w+|Weapon|Bracer|Gloves|Chest|Ring|Cloak|Boots|Shield) - /, '')

/**
 * An item as the game's tooltip, fitted out the way it would be worn: the enchant, the gem in each
 * socket (with the socket bonus green when they match), and its tier set. `where` is where it comes
 * from, and `note` its place on a list. Ranked Gear fits items the guide's way; Compare fits them the
 * way its score assumes.
 */
export function fittedItemTip(item: GearItem, fitted: EquippedSlot, where: string, note?: string): ItemTipModel {
  const enchant = getEnchantById(fitted.enchantId)
  const gems = item.sockets?.map((_, index) => {
    const gem = getGemById(fitted.gemIds[index])
    return gem ? { name: gem.name, icon: getIconName(gem.wowItemId) } : undefined
  })
  const set = getItemSetById(item.setId)
  return {
    ...catalogueTip(item),
    unique: item.unique || item.uniqueEquipped,
    ...(enchant ? { enchant: enchantLine(enchant.name) } : {}),
    ...(gems ? { gems, socketBonusOn: socketBonusIsActive(item.sockets, fitted.gemIds) } : {}),
    ...(set ? { set: { name: set.name, bonuses: set.bonuses.map((bonus) => `(${bonus.pieces}) Set: ${bonus.description}`) } } : {}),
    where,
    ...(note ? { note } : {}),
  }
}
