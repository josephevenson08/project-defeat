import type { CSSProperties } from 'react'
import { lootItem, lootWowItemId, type RaidLootEntry } from '../../domain/raids'
import { getIconName } from '../../domain/icons/icons'

/**
 * A drop's icon in a frame of its quality colour, the way the game frames loot. An item the
 * catalogue does not have gets a plain frame and no picture rather than a broken image.
 */
export function LootIcon({ entry, size = 36 }: { entry: RaidLootEntry; size?: number }) {
  const quality = lootItem(entry)?.quality
  const icon = getIconName(lootWowItemId(entry))
  return (
    <span className={`loot-icon loot-icon-${quality?.toLowerCase() ?? 'none'}`} style={{ '--loot-icon-size': `${size}px` } as CSSProperties}>
      {icon && <img src={`${import.meta.env.BASE_URL}icons/${icon}.jpg`} alt="" width={size} height={size} loading="lazy" decoding="async" />}
    </span>
  )
}
