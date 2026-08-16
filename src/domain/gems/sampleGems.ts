import rawGems from './gemCatalogue.json' with { type: 'json' }
import rawMetaRequirements from './metaGemRequirements.json' with { type: 'json' }
import rawItemEffects from '../gear/itemEffects.json' with { type: 'json' }
import type { SocketColor } from '../gear/itemTypes'
import type { Gem } from './gemTypes'
import { gemFitsSocket } from './gemTypes'

/**
 * The gem catalogue, ingested from wowsims/tbc by `tools/ingest/ingest-gems-enchants.mjs`.
 *
 * This was 11 hand-written gems against 4,528 items, which made every socket dropdown in the app
 * offer the same dozen options regardless of colour. It is now the full 212.
 */
/**
 * Meta activation conditions, layered on by wowItemId.
 *
 * Kept as a separate ingest rather than folded into the gem catalogue because they come from a
 * different source: wowsims models what a meta gem *does* and leaves the condition to the player, so
 * these are read off each gem's own Wowhead tooltip instead.
 */
const metaRequirementByWowItemId = new Map(
  rawMetaRequirements.requirements.map((entry) => [
    entry.wowItemId,
    (entry.kind === 'moreThan'
      ? { kind: 'moreThan', moreColor: entry.moreColor, thanColor: entry.thanColor, text: entry.text }
      : { kind: 'minimums', minimums: entry.minimums, text: entry.text }) as NonNullable<Gem['metaRequirement']>,
  ]),
)

/**
 * Gem procs, from the same `ingest-item-effects.mjs` run that fills the item effects.
 *
 * That ingest reads wowsims' `sim/common/metagems.go`, so it has always extracted these two — they
 * simply had nowhere to go until `Gem.effect` existed, and the ingest reported them while nothing
 * consumed them. Only Mystical Skyfire Diamond (25893) and Thundering Skyfire Diamond (32410) match
 * a gem; the rest of the file is trinkets and weapons, and the id lookup is what keeps them apart.
 */
const effectByWowItemId = new Map(
  rawItemEffects.effects.map((entry) => [
    entry.wowItemId,
    {
      // Cast at the boundary as `itemCatalogue.ts` does — reading the JSON widens the literal to
      // `string`, and the ingest only ever writes these two kinds.
      kind: entry.kind as 'proc' | 'onUse',
      statBonus: entry.statBonus as Gem['stats'],
      durationSeconds: entry.durationSeconds,
      cooldownSeconds: entry.cooldownSeconds,
    } satisfies NonNullable<Gem['effect']>,
  ]),
)

export const sampleGems: readonly Gem[] = (rawGems.gems as Gem[]).map((gem) => {
  if (gem.wowItemId === undefined) return gem

  const metaRequirement = metaRequirementByWowItemId.get(gem.wowItemId)
  const effect = effectByWowItemId.get(gem.wowItemId)
  if (!metaRequirement && !effect) return gem

  return { ...gem, ...(metaRequirement ? { metaRequirement } : {}), ...(effect ? { effect } : {}) }
})

const byId = new Map(sampleGems.map((gem) => [gem.id, gem]))

export function getGemById(id: string | undefined) {
  return id ? byId.get(id) : undefined
}

/**
 * Gems that may go in a socket of this colour.
 *
 * Includes the hybrids: an Orange gem is offered for both red and yellow sockets, because it is legal
 * in both and satisfies either socket bonus. Filtering to exact colour matches would hide the
 * majority of the catalogue — 118 of 212 gems are hybrid-coloured.
 */
export function getGemsForSocket(socket: SocketColor): readonly Gem[] {
  return sampleGems.filter((gem) => gemFitsSocket(gem, socket))
}

/**
 * Whether an item's socket bonus is earned: every socket filled, and every gem satisfying the colour
 * of the socket it sits in.
 *
 * Lives here, next to `gemFitsSocket`, because it was previously a private copy inside
 * `calculateStats` that compared `gem.color === socket` directly — an exact-colour test. That quietly
 * denied the bonus to every hybrid: an Orange gem in a red socket was offered by the gem dropdown,
 * accepted, and then failed the check, so the socket bonus vanished with no explanation. Hybrids are
 * 118 of the 212 gems, so this was the common case rather than an edge one.
 *
 * An empty socket fails for the same reason a mismatched one does, which is what the upgrade finder
 * already assumed.
 */
export function socketBonusIsActive(sockets: readonly SocketColor[] = [], gemIds: readonly string[] = []) {
  if (sockets.length === 0) return false

  return sockets.every((socket, index) => {
    const gem = getGemById(gemIds[index])
    return gem ? gemFitsSocket(gem, socket) : false
  })
}
