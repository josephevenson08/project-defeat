import rawGems from './gemCatalogue.json' with { type: 'json' }
import type { SocketColor } from '../gear/itemTypes'
import type { Gem } from './gemTypes'
import { gemFitsSocket } from './gemTypes'

/**
 * The gem catalogue, ingested from wowsims/tbc by `tools/ingest/ingest-gems-enchants.mjs`.
 *
 * This was 11 hand-written gems against 4,528 items, which made every socket dropdown in the app
 * offer the same dozen options regardless of colour. It is now the full 212.
 */
export const sampleGems: readonly Gem[] = rawGems.gems as Gem[]

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
