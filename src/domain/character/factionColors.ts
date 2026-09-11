import type { Faction } from './characterTypes'

/**
 * The two faction colours, as the game and its whole community use them.
 *
 * **Alliance blue is the logo blue rather than a generic blue**, because that is the one people
 * recognise — it is the colour of the Alliance crest and of the Warcraft wordmark itself. Horde red
 * is the banner crimson, lightened from the deep `#8c1c13` of the tabard to clear WCAG AA on this
 * app's raised surfaces: the deeper red measured 4.28:1 on `--surface-2`, which is exactly where a
 * selected option's border sits.
 *
 * These are the only two colours in the app that mean "which side", so they are kept apart from the
 * theme tokens. `--accent` happens to equal one of them per faction, but that is the theme following
 * the faction, not these two values being theme colours — a Horde player still sees Alliance blue on
 * the Alliance button in the creator, and should.
 */
export const factionColors: Record<Faction, string> = {
  Alliance: '#5b9bd8',
  Horde: '#df5647',
}

export function getFactionColor(faction: Faction): string {
  return factionColors[faction]
}
