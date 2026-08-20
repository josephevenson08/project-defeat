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
 * screen. Upstream carries one combination TBC does not have — Draenei Mage, added in Cataclysm —
 * which is harmless because `racesByClass` never offers it, so this checks coverage in the one
 * direction that matters.
 */
const missing = Object.entries(racesByClass).flatMap(([className, races]) =>
  races.filter((race) => BASE_STATS[className as TbcClass]?.[race] === undefined).map((race) => `${className}/${race}`),
)
if (missing.length > 0) {
  throw new Error(`baseStats.json is missing ${missing.length} legal race/class combination(s): ${missing.join(', ')}`)
}

/** The source these numbers were read from, for the panel that discloses it. */
export const baseStatsSource = rawBaseStats.source

export function getBaseStats(className: TbcClass, race: TbcRace): StatBlock {
  const block = BASE_STATS[className]?.[race]
  if (!block) throw new Error(`No base stats for ${race} ${className} — see tools/ingest/ingest-base-stats.mjs`)
  return { ...emptyStats, ...block }
}
