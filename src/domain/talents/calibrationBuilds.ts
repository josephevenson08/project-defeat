/**
 * Builds the best case measures a spec at instead of wowsims' preset, where that preset is not what
 * the players behind the spec's reference run.
 *
 * **Why this exists.** `dpsReference.ts` is each spec's 95th percentile in the logs, and a log's spec is the
 * talent tree holding the most points. wowsims' `HemoTalents`, stored as Subtlety in
 * `talentBuilds.json`, is a 0/40/21 build with its filler left out: 34 of its 38 listed points are in
 * Combat (Precision, Dual Wield Specialization, Sword Specialization, Combat Potency and the rest), so
 * a log files it as Combat. Measuring it against the Subtlety reference compared a Combat build with
 * Subtlety players, and once Dual Wield Specialization was modelled (2026-10-31) it read 1,295 against
 * their 1,292, which the calibration test reads as something counted twice. Nothing was: the talent
 * adds exactly half the off hand and moves nothing else. The build was the mismatch.
 *
 * **And where there is no preset at all.** Marksmanship had none in the file the build ingest reads,
 * so it was measured at the one-tree fill: every Marksmanship talent in listed order, which no raider
 * plays. With the physical debuffs applied that read 1,392 to 1,526 against its 95th percentile of
 * 1,386, and the model put Marksmanship above Survival where the logs put it 327 DPS below. The same
 * mismatch as Subtlety's, from the other side, so it gets a guide's build too (2026-11-02).
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
  {
    className: 'Hunter',
    spec: 'Marksmanship',
    split: '14/44/3',
    points: {
      // Beast Mastery 14
      1382: 5, // Improved Aspect of the Hawk
      1624: 2, // Focused Fire
      1395: 1, // Thick Hide
      1625: 2, // Improved Revive Pet
      1396: 4, // Unleashed Fury
      // Marksmanship 44
      1344: 5, // Lethal Shots
      1343: 5, // Improved Hunter's Mark
      1342: 1, // Efficiency
      1818: 2, // Go for the Throat
      1345: 1, // Aimed Shot
      1819: 2, // Rapid Killing
      1349: 5, // Mortal Shots
      1347: 3, // Barrage
      1353: 1, // Scatter Shot
      1804: 2, // Combat Experience
      1362: 5, // Ranged Weapon Specialization
      1806: 3, // Careful Aim
      1361: 1, // Trueshot Aura
      1821: 3, // Improved Barrage
      1807: 5, // Master Marksman
      // Survival 3
      1623: 3, // Monster Slaying
    },
    source: 'Warcraft Tavern, "Standard Marksmanship Hunter Talent Build (14/44/03/)", PvE Marksmanship Hunter Talents & Builds',
    sourceUrl: 'https://warcrafttavern.com/tbc/guides/pve-marksmanship-hunter-talents-builds',
    readOn: '2026-11-02',
    provenance:
      'The page gives the build as a talent-calculator link (#?t=A1111144767aaaaB22222555556abb88eeeeeiiihkknnnnnqqqpoootttttC000), ' +
      "decoded as Subtlety's was, by the tbc-researcher and again here: 14 Beast Mastery, 44 Marksmanship and 3 Survival, 61 points, no " +
      "rank above its maximum. The 44 Marksmanship points are cross-checked twice: wow.gg's TBC guide gives the same build in Wowhead's " +
      "digit code, and wowsims' own UI preset (`MarksmanTalents` in ui/hunter/presets.ts, which the build ingest does not read) has the " +
      'same Marksmanship tree with a 17/44/0 split. Not tied to Phase 2 by its page, and not read off the rendered calculator.',
  },
]

export function calibrationBuildFor(className: string, spec: string): CalibrationBuild | undefined {
  return calibrationBuilds.find((build) => build.className === className && build.spec === spec)
}
