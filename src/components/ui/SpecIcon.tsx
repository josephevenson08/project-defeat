import type { CSSProperties } from 'react'
import { getClassColor } from '../../domain/character/classColors'
import type { TbcClass, TbcSpec } from '../../domain/character/characterTypes'
import { getSpecIcon } from '../../domain/raidcomp'

type SpecIconProps = {
  className: TbcClass
  spec: TbcSpec
  /** Rendered width and height in pixels, ring excluded. */
  size?: number
  /** A raid build's own icon (the bear paw for a Feral tank), in place of the spec's. */
  icon?: string
}

/**
 * A spec's icon in a ring of its class colour, the prototypes' spec chip.
 *
 * TBC gives a spec no icon of its own, so this is the tree's deepest talent (see `raidcompIcons.ts`).
 * The ring is Blizzard's class colour, which is what a player scans a list of specs for. Decorative:
 * the spec's name is always written beside it, so the image carries no text alternative.
 */
export function SpecIcon({ className, spec, size = 28, icon: buildIcon }: SpecIconProps) {
  const icon = buildIcon ?? getSpecIcon(className, spec)
  // Sized through a custom property rather than an inline width, so a layout can still resize it
  // (a phone's smaller tiles) without `!important`.
  const style = { '--spec-class': getClassColor(className), '--spec-icon-size': `${size}px` } as CSSProperties

  if (!icon) return <span className="spec-icon" style={style} aria-hidden="true" />
  return (
    <img
      className="spec-icon"
      src={`${import.meta.env.BASE_URL}icons/${icon}.jpg`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      style={style}
    />
  )
}
