import { getIconName } from '../../domain/icons/icons'

type ItemIconProps = {
  wowItemId: number | undefined
  /**
   * What to draw when there is no icon — the two-letter slot glyph the frames used before art
   * landed. Kept rather than removed: a handful of curated entries carry no `wowItemId`, and a slot
   * with nothing in it at all reads as a rendering bug rather than an empty slot.
   */
  fallback: string
}

/**
 * The item icon inside a paperdoll slot, a ranked row, or a raid loot row.
 *
 * `alt=""` because every frame that renders this is already `aria-hidden`, and the item's name sits
 * next to it as real text — an alt here would make a screen reader say the item's name twice.
 *
 * Lazy by default. A raid loot table runs to a hundred-odd rows, and eagerly fetching a hundred
 * icons to show the eight that are on screen is the kind of thing that makes a local-first app feel
 * slower than a hosted one.
 *
 * The URL is built from `BASE_URL` rather than hardcoded, because GitHub Pages serves this under
 * `/project-defeat/` while the dev server and the whole Playwright suite address it at `/`.
 */
export function ItemIcon({ wowItemId, fallback }: ItemIconProps) {
  const icon = getIconName(wowItemId)
  if (!icon) return <span className="item-icon-fallback">{fallback}</span>

  return <img className="item-icon" src={`${import.meta.env.BASE_URL}icons/${icon}.jpg`} alt="" loading="lazy" decoding="async" />
}
