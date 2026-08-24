import type { TbcClass, TbcSpec } from '../character/characterTypes'

/**
 * What each DPS spec actually parses at in Phase 2, from logs rather than from theory.
 *
 * **This exists because the simulator had no way to be wrong.** Every number it produced was
 * internally consistent and nothing compared it to reality, so a spec reading 522 where players do
 * 1,693 looked exactly like a spec reading correctly. `featureFlags.ts` said "roughly 4x low" on the
 * strength of one person's judgement; this table is what turns that into a measurement.
 *
 * **Source:** archon.gg's Classic Fresh DPS tier list for raid content, SSC/Tempest Keep — the same
 * phase this app is scoped to — read on 2026-08-23 from
 * `/classic-fresh/tier-list/dps-rankings/raid/normal/all-bosses`. Archon aggregates uploaded Warcraft
 * Logs parses; the build pages behind the same figures quote 133,329 parses across the top 50% of the
 * last 14 days.
 *
 * **These are observed averages, not theoretical ceilings, and that is the right target for this
 * app.** A planner should predict what a competent raider does, not what a flawless one could do.
 *
 * Cross-checked where it could be: the repo owner's own Hydross parse came in at **1,709.3** against
 * this table's **1,693** for Enhancement, a 1% difference, which is the only independent confirmation
 * available and is a reassuring one.
 *
 * **Two limits worth stating.** These are a single point in time on a moving meta, so they will drift
 * as gear does — the date above is part of the datum. And an average across all bosses flattens
 * fights with heavy movement or add phases, which is why the app should aim to land *near* these
 * rather than on them.
 */
export type DpsReference = {
  className: TbcClass
  spec: TbcSpec
  /** Observed average DPS in raid content. */
  dps: number
  /** Tier letter archon assigns, kept because it is the shape a reader recognises. */
  tier: 'S' | 'A' | 'B' | 'C'
}

export const DPS_REFERENCE_SOURCE =
  'archon.gg Classic Fresh DPS tier list, raid / normal / all bosses, read 2026-08-23'

export const dpsReference: readonly DpsReference[] = [
  { className: 'Mage', spec: 'Arcane', dps: 2084, tier: 'S' },
  { className: 'Hunter', spec: 'Beast Mastery', dps: 2068, tier: 'S' },
  { className: 'Warrior', spec: 'Fury', dps: 2053, tier: 'A' },
  { className: 'Warlock', spec: 'Destruction', dps: 1838, tier: 'S' },
  { className: 'Paladin', spec: 'Retribution', dps: 1785, tier: 'B' },
  { className: 'Rogue', spec: 'Combat', dps: 1731, tier: 'A' },
  { className: 'Warrior', spec: 'Arms', dps: 1706, tier: 'B' },
  { className: 'Hunter', spec: 'Survival', dps: 1696, tier: 'B' },
  { className: 'Shaman', spec: 'Enhancement', dps: 1693, tier: 'A' },
  { className: 'Druid', spec: 'Feral', dps: 1655, tier: 'B' },
  { className: 'Warlock', spec: 'Affliction', dps: 1629, tier: 'B' },
  { className: 'Warlock', spec: 'Demonology', dps: 1619, tier: 'C' },
  { className: 'Shaman', spec: 'Elemental', dps: 1422, tier: 'A' },
  { className: 'Mage', spec: 'Fire', dps: 1413, tier: 'C' },
  { className: 'Druid', spec: 'Balance', dps: 1401, tier: 'B' },
  { className: 'Rogue', spec: 'Assassination', dps: 1362, tier: 'C' },
  { className: 'Hunter', spec: 'Marksmanship', dps: 1341, tier: 'C' },
  { className: 'Priest', spec: 'Shadow', dps: 1330, tier: 'B' },
  { className: 'Rogue', spec: 'Subtlety', dps: 1292, tier: 'C' },
  { className: 'Mage', spec: 'Frost', dps: 1120, tier: 'C' },
]

export function getDpsReference(className: TbcClass, spec: TbcSpec): DpsReference | undefined {
  return dpsReference.find((entry) => entry.className === className && entry.spec === spec)
}
