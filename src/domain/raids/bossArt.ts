import manifest from './bossArt.json' with { type: 'json' }

/**
 * Which bosses have a panel in `public/raids/bosses`, and which do not.
 *
 * **The app used to assume all of them did.** `RaidsPanel` built every card's background from
 * `raids/bosses/<id>.jpg` without checking, so the eleven encounters still waiting on art — Nightbane
 * and the whole of Serpentshrine and Tempest Keep — each rendered as a 400px black panel with a
 * gradient over nothing and a 404 behind it. A participant in the 2026-09-21 usability study read
 * that as a failed image, which is exactly what it was.
 *
 * Generated rather than hand-listed, by the same script that writes the files: art is dropped in and
 * ingested, so a list maintained by hand would be wrong the first time the owner adds a picture and
 * right again only when someone remembered this file existed.
 */
const withArt = new Set<string>(manifest.bossIds)

export function hasBossArt(bossId: string) {
  return withArt.has(bossId)
}

/** For tests and for the ingest script's own reporting. */
export const bossArtCount = manifest.bossIds.length
