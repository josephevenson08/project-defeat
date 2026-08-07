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
