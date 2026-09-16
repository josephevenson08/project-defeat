import rawBaseStats from './baseStats.json' with { type: 'json' }
import { emptyStats, type StatBlock } from '../stats/statTypes'
import type { TbcClass, TbcRace } from './characterTypes'
import { racesByClass } from './races'

/**
 * What a level-70 character has before a single item is equipped.
 *
 * **Base stats are race *and* class in TBC, not class alone.** This app used to carry one block per
 * class, hand-written, and the numbers were invented: its Druid had 52 Strength and 82 Intellect
 * against a real Night Elf Druid's 73 and 120, and it granted 72 spell power and 86 healing power
 * that no druid has ever had. `tools/ingest/ingest-base-stats.mjs` reads all 52 blocks from
 * wowsims/tbc at the pinned commit instead.
 *
 * Two upstream fields are deliberately absent: **Health and Mana**, because `StatBlock` has no field
 * for either. Health is already derived from Stamina by `HEALTH_PER_STAMINA`, and base mana is
 * approximated in `manaModel.ts`. The ingest reports both as skipped rather than dropping them
 * quietly.
 */
const BASE_STATS = rawBaseStats.baseStats as Partial<Record<TbcClass, Partial<Record<TbcRace, Partial<StatBlock>>>>>

/**
 * Fails at import rather than at render, matching how `talentModifiers.ts` guards its own dispatch.
 *
 * The failure this prevents is the quiet one: a race the ingest stopped emitting would otherwise
 * hand that character an all-zero base and simply read low, on the one surface that is always on
 * screen.
 *
 * **This comment used to say upstream carried "one combination TBC does not have — Draenei Mage,
 * added in Cataclysm".** That was wrong, and it was the whole reason `racesByClass` refused Draenei
 * Mage: a launch combination, confirmed by warcraft.wiki.gg's patch history and Warcraft Tavern's TBC
 * race guide. Upstream was right and this file explained it away. Upstream and `racesByClass` now
 * agree exactly — every combination one carries, the other offers — so this checks coverage in the
 * direction that can fail silently, and the reverse direction has nothing left in it to excuse.
 */
const missing = Object.entries(racesByClass).flatMap(([className, races]) =>
  races.filter((race) => BASE_STATS[className as TbcClass]?.[race] === undefined).map((race) => `${className}/${race}`),
)
if (missing.length > 0) {
  throw new Error(`baseStats.json is missing ${missing.length} legal race/class combination(s): ${missing.join(', ')}`)
}

/*
 * The reverse direction, which used to be excused rather than checked. A combination the pinned TBC
 * simulator models but this app refuses is a question for a person, not a comment: the last one was
 * Draenei Mage, and the comment that excused it was the bug. Throwing here means the next such
 * disagreement gets looked at against a source the day it appears.
 */
const refused = Object.entries(BASE_STATS).flatMap(([className, byRace]) =>
  Object.keys(byRace ?? {})
    .filter((race) => !racesByClass[className as TbcClass]?.includes(race as TbcRace))
    .map((race) => `${className}/${race}`),
)
if (refused.length > 0) {
  throw new Error(
    `baseStats.json models ${refused.length} race/class combination(s) that racesByClass refuses: ${refused.join(', ')}. ` +
      'Check each against a TBC source before deciding which side is wrong.',
  )
}

/** The source these numbers were read from, for the panel that discloses it. */
export const baseStatsSource = rawBaseStats.source

export function getBaseStats(className: TbcClass, race: TbcRace): StatBlock {
  const block = BASE_STATS[className]?.[race]
  if (!block) throw new Error(`No base stats for ${race} ${className} — see tools/ingest/ingest-base-stats.mjs`)
  return { ...emptyStats, ...block }
}
