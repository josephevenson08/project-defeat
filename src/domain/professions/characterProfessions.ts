import type { Profession } from './professionTypes'
import { sampleProfessions } from './sampleProfessions'

/**
 * How many primary professions a character may carry. Two, in every version of the game.
 *
 * Named rather than written as a literal at the call sites, because the picker, the validator and
 * the saved-build reader all have to agree about it and a saved build is a compatibility surface.
 */
export const PRIMARY_PROFESSION_LIMIT = 2

/**
 * The professions a character actually chooses between.
 *
 * Secondary professions — Cooking, First Aid, Fishing — are excluded. Everyone can take all three,
 * so they are not a choice, and none of them touches a stat. Listing them would make the picker a
 * third longer in exchange for nothing the rest of the app can read.
 *
 * Derived from the same `sampleProfessions` data the Professions tab renders rather than written out
 * again, so a profession cannot exist in one place and not the other.
 */
export const primaryProfessions: readonly Profession[] = sampleProfessions
  .filter((entry) => entry.category !== 'Secondary')
  .map((entry) => entry.profession)

/**
 * Adds or removes a profession, keeping the result within the two-profession limit.
 *
 * **Selecting a third replaces the oldest rather than being refused**, which is the behaviour a
 * picker of ten options wants: refusing the click leaves the player to work out which of their two
 * existing choices is in the way, on a control where changing your mind is the whole point. Dropping
 * a profession in the game is destructive and this is a planner, so nothing here is precious.
 */
export function toggleProfession(
  current: readonly Profession[] | undefined,
  profession: Profession,
): readonly Profession[] {
  const held = current ?? []
  if (held.includes(profession)) return held.filter((entry) => entry !== profession)
  return [...held, profession].slice(-PRIMARY_PROFESSION_LIMIT)
}
