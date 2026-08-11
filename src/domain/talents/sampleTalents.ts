import rawWarrior from './warriorTalents.json' with { type: 'json' }
import type { TalentData } from './talentTypes'

/**
 * Talent trees, ingested from Wowhead's TBC talent calculator by `tools/ingest/ingest-talents.mjs`.
 *
 * **Warrior only so far**, deliberately. Nine classes of talents is comparable in size to the item
 * catalogue, so one class is built end to end first — grid, ranks, prerequisites, per-rank
 * descriptions — to prove the shape before the other eight are ingested against it. Adding a class
 * is a one-line change to `TREES_BY_CLASS` in the ingester plus a re-run.
 *
 * Nothing here is hand-written. A talent's name is the name of its rank-1 spell and its description
 * is that spell's description, joined from two separate payloads on the calculator page.
 */
const DATA_BY_CLASS: Readonly<Record<string, TalentData>> = {
  Warrior: rawWarrior as TalentData,
}

export function getTalentData(className: string): TalentData | undefined {
  return DATA_BY_CLASS[className]
}

/** Classes whose talents have been ingested. Everything else shows an honest "not yet" rather than an empty tree. */
export const classesWithTalents = Object.keys(DATA_BY_CLASS)
