import type { TbcClass, TbcSpec } from '../character/characterTypes'

/**
 * What each DPS spec's best players parse in Phase 2, from logs rather than from theory.
 *
 * **This exists because the simulator had no way to be wrong.** Every number it produced was
 * internally consistent and nothing compared it to reality, so a spec reading 522 where players do
 * 1,693 looked exactly like a spec reading correctly. `featureFlags.ts` said "roughly 4x low" on the
 * strength of one person's judgement; this table is what turns that into a measurement.
 *
 * **Source:** Warcraft Logs Fresh, SSC / TK, Statistics: Damage, All Bosses, DPS, **95th
 * percentile**, over a range of 2 weeks, current standings, aggregated per second, Phase 2. Read on
 * 2026-11-02, after Phase 3 opened, so the figure covers the whole of Phase 2; the parse count beside
 * each is what that percentile is taken from.
 *
 * **A 95th percentile, and it always was.** Until 2026-11-02 this table held archon.gg's tier-list
 * figures for the same raids, read on 2026-08-23 and called "observed averages" here. archon's page
 * says its figures are each spec's 95th percentile, and Warcraft Logs' Phase 2 95th percentile matches
 * those August figures within about 1% for every widely played spec, in the same order. So the
 * calibration test was already comparing a best case (rank-1 BiS, every buff) with a near-ceiling,
 * not with an average, and every sentence that said "average" was wrong. The thinly played specs
 * moved most with the fuller phase: Subtlety 1,292 to 1,391, Assassination 1,362 to 1,434,
 * Demonology 1,619 to 1,687, Marksmanship 1,341 to 1,386.
 *
 * **Why Warcraft Logs and not archon now:** archon builds its list from the last 14 days, and with
 * Phase 3 live it shows only Black Temple and Hyjal. Warcraft Logs keeps Phase 2 as a partition.
 *
 * Cross-checked where it could be: the repo owner's own Hydross parse came in at **1,709.3**, against
 * Enhancement's 95th percentile here of **1,702**.
 *
 * **Two limits worth stating.** A spec with few parses (Subtlety's 1,276, Assassination's 2,013) has a
 * percentile that moves more than one with 400,000. And an aggregate over every boss flattens fights
 * with heavy movement or add phases, so the app should land *near* these rather than on them.
 */
export type DpsReference = {
  className: TbcClass
  spec: TbcSpec
  /** Warcraft Logs' 95th-percentile DPS for the spec across Phase 2's raids, rounded. */
  dps: number
  /** How many parses that percentile is taken from. */
  parses: number
  /**
   * archon.gg's tier letter, read on 2026-08-23 for the same raids. Kept because it is the shape a
   * reader recognises; Warcraft Logs has no letters, and archon now lists only Phase 3.
   */
  tier: 'S' | 'A' | 'B' | 'C'
  /**
   * Set where the reference is too thin to hold the model to, with why: the calibration check exempts
   * the spec, the trust range leaves it out, and the trust panel and the estimate say so. Marksmanship
   * only (the owner's call, 2026-11-02): at a sourced raid build with the raid's physical debuffs it
   * reads above its 95th percentile, which comes from a spec the guides tell raiders not to play.
   */
  thin?: string
}

/** When the table below was read, as an ISO date: part of the datum. */
export const DPS_REFERENCE_READ_ON = '2026-11-02'

export const DPS_REFERENCE_URL = 'https://fresh.warcraftlogs.com'

export const DPS_REFERENCE_SOURCE = `Warcraft Logs Fresh, SSC / TK statistics, Phase 2, all bosses, 95th percentile, read ${DPS_REFERENCE_READ_ON}`

/** Where the tier letters come from, which is not where the DPS comes from. */
export const DPS_TIER_READ_ON = '2026-08-23'

export const DPS_TIER_URL = 'https://www.archon.gg/classic-fresh/tier-list/dps-rankings/raid/normal/all-bosses'

export const dpsReference: readonly DpsReference[] = [
  { className: 'Mage', spec: 'Arcane', dps: 2092, parses: 400815, tier: 'S' },
  { className: 'Hunter', spec: 'Beast Mastery', dps: 2083, parses: 317425, tier: 'S' },
  { className: 'Warrior', spec: 'Fury', dps: 2069, parses: 226828, tier: 'A' },
  { className: 'Warlock', spec: 'Destruction', dps: 1845, parses: 358745, tier: 'S' },
  { className: 'Paladin', spec: 'Retribution', dps: 1799, parses: 146969, tier: 'B' },
  { className: 'Rogue', spec: 'Combat', dps: 1742, parses: 196129, tier: 'A' },
  { className: 'Warrior', spec: 'Arms', dps: 1720, parses: 102771, tier: 'B' },
  { className: 'Hunter', spec: 'Survival', dps: 1713, parses: 99937, tier: 'B' },
  { className: 'Shaman', spec: 'Enhancement', dps: 1702, parses: 264992, tier: 'A' },
  { className: 'Warlock', spec: 'Demonology', dps: 1687, parses: 6764, tier: 'C' },
  { className: 'Druid', spec: 'Feral', dps: 1669, parses: 132243, tier: 'B' },
  { className: 'Warlock', spec: 'Affliction', dps: 1643, parses: 75969, tier: 'B' },
  { className: 'Mage', spec: 'Fire', dps: 1436, parses: 13745, tier: 'C' },
  { className: 'Rogue', spec: 'Assassination', dps: 1434, parses: 2013, tier: 'C' },
  { className: 'Shaman', spec: 'Elemental', dps: 1429, parses: 203624, tier: 'A' },
  { className: 'Druid', spec: 'Balance', dps: 1408, parses: 133090, tier: 'B' },
  { className: 'Rogue', spec: 'Subtlety', dps: 1391, parses: 1276, tier: 'C' },
  {
    className: 'Hunter',
    spec: 'Marksmanship',
    dps: 1386,
    parses: 5495,
    tier: 'C',
    thin: "5,495 parses of a spec guides rate F-tier in PvE (Warcraft Tavern: no reason to play it), against Beast Mastery's 317,425",
  },
  { className: 'Priest', spec: 'Shadow', dps: 1337, parses: 166434, tier: 'B' },
  { className: 'Mage', spec: 'Frost', dps: 1152, parses: 10515, tier: 'C' },
]

export function getDpsReference(className: TbcClass, spec: TbcSpec): DpsReference | undefined {
  return dpsReference.find((entry) => entry.className === className && entry.spec === spec)
}
