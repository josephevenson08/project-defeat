/**
 * Builds the best case measures a spec at instead of wowsims' preset, where that preset is not what
 * the players behind the spec's reference run.
 *
 * **Why this exists.** `dpsReference.ts` is archon.gg's average for each spec, and a log's spec is the
 * talent tree holding the most points. wowsims' `HemoTalents`, stored as Subtlety in
 * `talentBuilds.json`, is a 0/40/21 build with its filler left out: 34 of its 38 listed points are in
 * Combat (Precision, Dual Wield Specialization, Sword Specialization, Combat Potency and the rest), so
 * a log files it as Combat. Measuring it against the Subtlety average compared a Combat build with
 * Subtlety players, and once Dual Wield Specialization was modelled (2026-10-31) it read 1,295 against
 * their 1,292, which the calibration test reads as something counted twice. Nothing was: the talent
 * adds exactly half the off hand and moves nothing else. The build was the mismatch.
 *
 * Only the best case reads this. The Talents tab's "Load the preset" keeps wowsims' build as stored,
 * which is the owner's call (2026-10-31).
 */
export type CalibrationBuild = {
  className: string
  spec: string
  /** Points by Wowhead talent id, as `talentBuilds.json` keys them. */
  points: Readonly<Record<number, number>>
  /** Per-tree totals in the game's order, as a guide writes them. */
  split: string
  source: string
  sourceUrl: string
  readOn: string
  /** How the ranks were got, since the guide gives them only as a calculator link. */
  provenance: string
}

export const calibrationBuilds: readonly CalibrationBuild[] = [
  {
    className: 'Rogue',
    spec: 'Subtlety',
    split: '20/0/41',
    points: {
      // Assassination 20
      270: 5, // Malice
      273: 3, // Ruthlessness
      274: 2, // Murder
      281: 1, // Relentless Strikes
      269: 5, // Lethality
      682: 4, // Vile Poisons
      // Subtlety 41
      261: 5, // Opportunity
      262: 2, // Dirty Tricks
      244: 4, // Camouflage
      245: 3, // Initiative
      303: 1, // Ghostly Strike
      247: 2, // Elusiveness
      1123: 3, // Serrated Blades
      1701: 2, // Heightened Senses
      284: 1, // Preparation
      265: 2, // Dirty Deeds
      681: 1, // Hemorrhage
      1713: 3, // Master of Subtlety
      1702: 5, // Deadliness
      381: 1, // Premeditation
      1712: 5, // Sinister Calling
      1714: 1, // Shadowstep
    },
    source: 'Warcraft Tavern, "Full Subtlety Rogue Build (20/0/41)", PvE Subtlety Rogue Talents & Builds',
    sourceUrl: 'https://warcrafttavern.com/tbc/guides/pve-subtlety-rogue-talents-builds',
    readOn: '2026-10-31',
    provenance:
      'The page gives the build as a talent-calculator link (#?t=C222225566669888ddeeejiihggmmmmmpkkktttttxA22222444558aaaaadddd), ' +
      'one character a point, each a base-36 row×4+column on the tree. Decoded against rogueTalents.json by the tbc-researcher and ' +
      'again here: 20 Assassination and 41 Subtlety, 61 points, no rank above its maximum, and it agrees with what the page says in ' +
      'words (Deadliness 5/5 and Sinister Calling, Ruthlessness and Relentless Strikes kept, no Precision, no Dual Wield or Sword ' +
      'Specialization). Not yet read off the rendered calculator.',
  },
]

export function calibrationBuildFor(className: string, spec: string): CalibrationBuild | undefined {
  return calibrationBuilds.find((build) => build.className === className && build.spec === spec)
}
