import rawDruid from './druidTalents.json' with { type: 'json' }
import rawHunter from './hunterTalents.json' with { type: 'json' }
import rawMage from './mageTalents.json' with { type: 'json' }
import rawPaladin from './paladinTalents.json' with { type: 'json' }
import rawPriest from './priestTalents.json' with { type: 'json' }
import rawRogue from './rogueTalents.json' with { type: 'json' }
import rawShaman from './shamanTalents.json' with { type: 'json' }
import rawWarlock from './warlockTalents.json' with { type: 'json' }
import rawWarrior from './warriorTalents.json' with { type: 'json' }
import type { TalentData } from './talentTypes'

/**
 * Talent trees, ingested from Wowhead's TBC talent calculator by `tools/ingest/ingest-talents.mjs`.
 *
 * All nine classes, 579 talents across 27 trees. Warrior was built end to end first — grid, ranks,
 * prerequisites, per-rank descriptions — to prove the shape; the other eight then came from the same
 * payload with no change to the parser, only tree ids.
 *
 * Nothing here is hand-written. A talent's name is the name of its rank-1 spell and its description
 * is that spell's description, joined from two separate payloads on the calculator page.
 *
 * **Six of the 27 trees are named something else in the payload**, in Vanilla-era internal terms, and
 * every one was confirmed by reading the tree's contents rather than trusting the label:
 * Paladin `Combat` is Retribution (it holds Benediction and Improved Seal of the Crusader), Warlock
 * `Curses` is Affliction and `Summoning` is Demonology, Shaman `ElementalCombat` is Elemental, Druid
 * `FeralCombat` is Feral, and Hunter `BeastMastery` is Beast Mastery.
 */
const DATA_BY_CLASS: Readonly<Record<string, TalentData>> = {
  Druid: rawDruid as TalentData,
  Hunter: rawHunter as TalentData,
  Mage: rawMage as TalentData,
  Paladin: rawPaladin as TalentData,
  Priest: rawPriest as TalentData,
  Rogue: rawRogue as TalentData,
  Shaman: rawShaman as TalentData,
  Warlock: rawWarlock as TalentData,
  Warrior: rawWarrior as TalentData,
}

export function getTalentData(className: string): TalentData | undefined {
  return DATA_BY_CLASS[className]
}

/** Classes whose talents have been ingested — now all nine, so the "not yet" path is unreachable. */
export const classesWithTalents = Object.keys(DATA_BY_CLASS)

/** Every distinct talent icon name in use, for the vendoring script and the test that pins it. */
export const talentIconNames: readonly string[] = [
  ...new Set(
    Object.values(DATA_BY_CLASS).flatMap((data) => data.trees.flatMap((tree) => tree.talents.map((talent) => talent.icon))),
  ),
].sort()
