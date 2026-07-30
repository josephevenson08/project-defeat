import type { RaidBoss } from './raidTypes'
import { karazhanBosses } from './karazhanBosses'
import { gruulsLairBosses } from './gruulsLairBosses'
import { magtheridonsLairBosses } from './magtheridonsLairBosses'
import { serpentshrineCavernBosses } from './serpentshrineCavernBosses'
import { tempestKeepBosses } from './tempestKeepBosses'

export const sampleRaidBosses: readonly RaidBoss[] = [
  ...karazhanBosses,
  ...gruulsLairBosses,
  ...magtheridonsLairBosses,
  ...serpentshrineCavernBosses,
  ...tempestKeepBosses,
]

/** Bosses for one raid, in clear order. Optional/summoned encounters sort to the end. */
export function getBossesForRaid(raidId: string): readonly RaidBoss[] {
  return sampleRaidBosses
    .filter((boss) => boss.raidId === raidId)
    .slice()
    .sort((a, b) => (a.encounterOrder ?? Number.MAX_SAFE_INTEGER) - (b.encounterOrder ?? Number.MAX_SAFE_INTEGER))
}

export function getRaidBossById(id: string): RaidBoss | undefined {
  return sampleRaidBosses.find((boss) => boss.id === id)
}

/** Every boss that drops the given catalog item id, so the gear panels can answer "where is this from?". */
export function getBossesDroppingItem(itemId: string): readonly RaidBoss[] {
  return sampleRaidBosses.filter((boss) => boss.loot.some((entry) => entry.itemId === itemId))
}
