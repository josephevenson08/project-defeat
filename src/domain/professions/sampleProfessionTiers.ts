import type { Profession, ProfessionTier } from './professionTypes'

const AZEROTH_TRAINER = 'Any profession trainer for this skill in a major Azeroth city (Stormwind, Ironforge, Darnassus, Exodar / Orgrimmar, Undercity, Thunder Bluff, Silvermoon).'

/**
 * The four pre-Outland tiers (Apprentice through Artisan) are identical in structure for every
 * standard trainer-taught profession: same skill breakpoints, same character level gates, same
 * "any Azeroth trainer" location. Master (300-375) is added in TBC and is where professions diverge:
 * most crafting professions train Master from a dedicated Outland trainer at level 50, gathering
 * professions unlock Master at level 40, and a few secondary professions (Cooking, Fishing, First Aid)
 * use a purchased manual/book instead of a live trainer.
 */
const standardLeveling: readonly ProfessionTier[] = [
  {
    tier: 'Apprentice',
    skillRange: [1, 75],
    requiredCharacterLevel: 5,
    trainedFrom: AZEROTH_TRAINER,
  },
  {
    tier: 'Journeyman',
    skillRange: [75, 150],
    requiredCharacterLevel: 10,
    minSkillToTrainNext: 50,
    trainedFrom: AZEROTH_TRAINER,
  },
  {
    tier: 'Expert',
    skillRange: [150, 225],
    requiredCharacterLevel: 20,
    minSkillToTrainNext: 125,
    trainedFrom: AZEROTH_TRAINER,
  },
  {
    tier: 'Artisan',
    skillRange: [225, 300],
    requiredCharacterLevel: 35,
    minSkillToTrainNext: 200,
    trainedFrom: AZEROTH_TRAINER,
  },
]

function masterTier(requiredCharacterLevel: number, trainedFrom: string, notes?: string, needsVerification?: boolean): ProfessionTier {
  return {
    tier: 'Master',
    skillRange: [300, 375],
    requiredCharacterLevel,
    minSkillToTrainNext: 275,
    trainedFrom,
    ...(notes ? { notes } : {}),
    ...(needsVerification ? { needsVerification } : {}),
  }
}

const OUTLAND_GATHERING_MASTER_NOTE =
  'Gathering professions unlock Master training earlier than crafting professions: character level 40 (with skill 275+), from a Master trainer in Hellfire Peninsula (Honor Hold/Thrallmar).'

/**
 * Per-profession Master-tier trainer info. Pre-Outland tiers (`standardLeveling`) are shared;
 * only the Master (300-375) tier differs by profession, so it's defined once here and merged in.
 */
const masterTierByProfession: Record<Profession, ProfessionTier> = {
  Alchemy: masterTier(
    50,
    "Master Alchemy trainer in Outland: Alchemist Gribble (Alliance) / Apothecary Antonivich (Horde), both in Hellfire Peninsula, or Lorokeem (neutral) in Shattrath City.",
  ),
  Blacksmithing: masterTier(
    50,
    'Master Blacksmithing trainer in Outland: Humphry (Alliance, Honor Hold) / Rohok (Horde, Thrallmar), Hellfire Peninsula.',
  ),
  Enchanting: masterTier(
    50,
    "Master Enchanting trainer in Outland: Johan Barnes (Alliance, Honor Hold) / Felannia (Horde, Thrallmar); neutral options Asarnan (Consortium, Stormspire, Netherstorm) or High Enchanter Bardolan (Scryers, Shattrath, requires Scryers reputation).",
  ),
  Engineering: masterTier(
    50,
    "Master Engineering trainer in Outland: Lebowski (Alliance, Honor Hold) / Zebig (Horde, Thrallmar) in Hellfire Peninsula, K. Lee Smallfry (Alliance) / Mack Diver (Horde) in Zangarmarsh, or neutral Xyrol at Area 52, Netherstorm.",
  ),
  Herbalism: masterTier(
    40,
    "Master Herbalism trainer in Outland, Hellfire Peninsula (Honor Hold/Thrallmar).",
    undefined,
    true,
  ),
  Jewelcrafting: masterTier(
    50,
    'Master Jewelcrafting trainer in Outland: Tatiana (Alliance, Honor Hold) / Kalaen (Horde, Thrallmar), Hellfire Peninsula, or neutral Xyrol at Area 52, Netherstorm.',
    'Jewelcrafting is new in TBC; it can still be picked up from level 5 onward at trainers in Exodar (Alliance) / Silvermoon City (Horde) and follows the same tier breakpoints as other crafting professions once learned.',
  ),
  Leatherworking: masterTier(
    50,
    'Master Leatherworking trainer in Outland: Brumman (Alliance, Honor Hold) / Barim Spilthoof (Horde, Thrallmar), Hellfire Peninsula, or neutral Darmari in Shattrath.',
  ),
  Mining: masterTier(
    40,
    'Master Mining trainer in Outland: Hurnak Grimmord (Alliance, Honor Hold) / Krugosh (Horde, Thrallmar), Hellfire Peninsula.',
  ),
  Skinning: masterTier(
    40,
    'Master Skinning trainer in Outland: Jelena Nightsky (Alliance) / Moorutu (Horde), both at Honor Hold/Thrallmar, Hellfire Peninsula.',
  ),
  Tailoring: masterTier(
    50,
    'Master Tailoring trainer in Outland: Hama (Alliance, Honor Hold) / Dalinna (Horde, Thrallmar), Hellfire Peninsula.',
  ),
  Cooking: masterTier(
    55,
    "Not a live trainer: purchase the Master Cookbook from Gaston (Alliance, Honor Hold), Baxter (Horde, Thrallmar), or Naka (neutral, Cenarion Refuge, Zangarmarsh), then learn it from your bag.",
  ),
  'First Aid': masterTier(
    50,
    'Not a live trainer: purchase "Master First Aid - Doctor in the House" from Burko (Alliance, Temple of Telhamat) or Aresella (Horde, Falcon Watch), Hellfire Peninsula, then learn it from your bag.',
    'Community guides consistently name the vendors and the skill-300 requirement, but are inconsistent/silent on the exact character-level gate for this manual; 50 is the general secondary-profession pattern but has not been independently confirmed.',
    true,
  ),
  Fishing: masterTier(
    55,
    'Not a live trainer: purchase "Master Fishing - The Art of Angling" from Juno Dufrain at Cenarion Refuge, Zangarmarsh, then learn it from your bag.',
  ),
}

const categoryNoteByProfession: Partial<Record<Profession, string>> = {
  Herbalism: OUTLAND_GATHERING_MASTER_NOTE,
  Mining: OUTLAND_GATHERING_MASTER_NOTE,
  Skinning: OUTLAND_GATHERING_MASTER_NOTE,
}

/**
 * The three secondary professions do not use the shared breakpoints, and pretending they do is a
 * defect rather than a simplification.
 *
 * **Cooking, First Aid and Fishing gate Expert on a book, Artisan on a quest, and Master on a second
 * book.** None of those is a trainer visit, and the skills differ too: Artisan is 225 and character
 * level 35 rather than the 200 the trainer professions use, and Master is 300 rather than 275. Until
 * 2026-09-11 this file kept the shared numbers and overrode only the wording for two of the three —
 * so Cooking told a player to visit a city trainer for a tier no trainer teaches, and First Aid's own
 * override text read "requires level 35 and skill 225" directly beside a `minSkillToTrainNext` of
 * 200. The prose contradicted the number next to it.
 *
 * It stayed invisible while the tier table was five identical-looking rows at the top of a page.
 * The gathering revamp prints the gate as a sentence in the summary table — "At 200, train Artisan"
 * — which is where a wrong number stops being cosmetic and starts sending somebody to Stormwind for
 * a quest in Tanaris.
 *
 * **One number is still not settled and is flagged rather than guessed.** Sources split on Expert's
 * skill gate: warcrafttavern.com's rank table says 150, while icy-veins.com and the wow.gg guide put
 * it at 125, matching Expert Cooking and Expert First Aid. 125 is kept because it agrees with the
 * other two books, and the disagreement is recorded on the tier instead of being resolved by
 * picking.
 */
function withTierOverride(
  tiers: readonly ProfessionTier[],
  tierName: ProfessionTier['tier'],
  overrides: Partial<ProfessionTier>,
): ProfessionTier[] {
  return tiers.map((tier) => (tier.tier === tierName ? { ...tier, ...overrides } : tier))
}

/** Expert is a book for all three, and the skill gate is the one figure sources disagree on. */
const EXPERT_BOOK_NOTE =
  'Expert is a book rather than a trainer, and sources split on its skill gate: most put it at 125, matching the other two secondary professions, while warcrafttavern.com lists 150. 125 is used here.'

/** Artisan is a quest for all three, at skill 225 and character level 35 — not the trainer 200. */
const ARTISAN_QUEST_SKILL = 225

/** Master is a book for all three, and the books require 300 rather than the trainer tiers' 275. */
const MASTER_BOOK_SKILL = 300

function buildTiers(profession: Profession): ProfessionTier[] {
  let tiers = [...standardLeveling, masterTierByProfession[profession]]

  const secondary = profession === 'Cooking' || profession === 'First Aid' || profession === 'Fishing'
  if (secondary) {
    tiers = withTierOverride(tiers, 'Expert', {
      minSkillToTrainNext: 125,
      needsVerification: true,
      notes: EXPERT_BOOK_NOTE,
    })
    tiers = withTierOverride(tiers, 'Artisan', {
      minSkillToTrainNext: ARTISAN_QUEST_SKILL,
      requiredCharacterLevel: 35,
    })
    tiers = withTierOverride(tiers, 'Master', { minSkillToTrainNext: MASTER_BOOK_SKILL })
  }

  if (profession === 'Fishing') {
    tiers = withTierOverride(tiers, 'Expert', {
      trainedFrom: 'Not a live trainer: purchase "Expert Fishing - The Bass and You" from Old Man Heming in Booty Bay for 1 gold, then learn it from your bag. Both factions can use this vendor.',
    })
    tiers = withTierOverride(tiers, 'Artisan', {
      trainedFrom: 'Not a live trainer: complete "Nat Pagle, Angler Extreme" from Nat Pagle in Dustwallow Marsh. The quest wants four rare fish from four separate zones and needs Fishing 225 and character level 35.',
    })
  }

  if (profession === 'Cooking') {
    tiers = withTierOverride(tiers, 'Expert', {
      trainedFrom: 'Not a live trainer: purchase the Expert Cookbook from a cooking supplies vendor, then learn it from your bag.',
    })
    tiers = withTierOverride(tiers, 'Artisan', {
      trainedFrom: 'Not a live trainer: complete the "Clamlette Surprise" quest from Dirge Quikcleave in Gadgetzan, Tanaris. Needs Cooking 225 and character level 35.',
    })
  }

  if (profession === 'First Aid') {
    tiers = withTierOverride(tiers, 'Expert', {
      trainedFrom: 'Not a live trainer: purchase the Expert First Aid manual from Balai Lok\'Wein (Horde, Dustwallow Marsh) or Deneb Walker (Alliance, Arathi Highlands), then learn it from your bag.',
    })
    tiers = withTierOverride(tiers, 'Artisan', {
      trainedFrom: 'Not a live trainer: complete the "Triage" quest (Doctor Gustaf VanHowzen for Alliance, Doctor Gregory Victor for Horde). Needs First Aid 225 and character level 35.',
    })
  }

  const categoryNote = categoryNoteByProfession[profession]
  if (categoryNote) {
    tiers = withTierOverride(tiers, 'Master', { notes: categoryNote })
  }

  return tiers
}

/** Skill tier brackets for every TBC profession, keyed by profession name. */
export const professionTiers: Readonly<Record<Profession, readonly ProfessionTier[]>> = {
  Alchemy: buildTiers('Alchemy'),
  Blacksmithing: buildTiers('Blacksmithing'),
  Enchanting: buildTiers('Enchanting'),
  Engineering: buildTiers('Engineering'),
  Herbalism: buildTiers('Herbalism'),
  Jewelcrafting: buildTiers('Jewelcrafting'),
  Leatherworking: buildTiers('Leatherworking'),
  Mining: buildTiers('Mining'),
  Skinning: buildTiers('Skinning'),
  Tailoring: buildTiers('Tailoring'),
  Cooking: buildTiers('Cooking'),
  'First Aid': buildTiers('First Aid'),
  Fishing: buildTiers('Fishing'),
}

export function getProfessionTiers(profession: Profession): readonly ProfessionTier[] {
  return professionTiers[profession]
}

/**
 * The moment you have to stop and go train, as a point on the skill line.
 *
 * **This replaces the tier table rather than summarising it.** A five-row Apprentice-to-Master table
 * is the same five rows on all thirteen professions and answers a question nobody asks in that form;
 * what a player actually needs is "you are at 125, go train Expert before you can gain another
 * point", delivered *between* the range they just finished and the one they are starting.
 *
 * **The skill that matters is `minSkillToTrainNext`, not the tier's own range start**, and the field
 * name reads backwards from what it holds: on Expert it is 125, which is the skill at which Expert
 * becomes trainable — not the skill at which Expert stops. Reading `skillRange[0]` here would tell a
 * player to train at 150, fifty points after they stopped gaining skill and stood there confused.
 *
 * Apprentice is dropped: it is where everyone already is when the page opens.
 */
export type TrainingMilestone = {
  tier: ProfessionTier['tier']
  /** The skill at which this tier becomes trainable, which is where the marker belongs. */
  atSkill: number
  requiredCharacterLevel: number
  trainedFrom: string
  needsVerification?: boolean
  notes?: string
}

/**
 * The trainer stops that fall inside one step's skill window.
 *
 * **Shared by both progressions so the two surfaces cannot place a stop differently.** Gathering and
 * crafting each print training twice — once in the summary table, once as a marker in the step it
 * interrupts — and four placements computed four ways is four chances to disagree about where a
 * player has to stop.
 *
 * The window is half-open at the top, because step boundaries are shared: a milestone at 175 belongs
 * to the range that *starts* at 175, not the one that ends there. `isLast` reopens it, or the tier
 * trainable at the 375 cap would fall off the end of the profession.
 */
export function milestonesWithin(
  profession: Profession,
  skillRange: readonly [number, number],
  isLast: boolean,
): TrainingMilestone[] {
  const [low, high] = skillRange
  return trainingMilestones(profession).filter(
    (milestone) =>
      milestone.atSkill >= low && (isLast ? milestone.atSkill <= high : milestone.atSkill < high),
  )
}

export function trainingMilestones(profession: Profession): TrainingMilestone[] {
  return professionTiers[profession]
    .filter((tier) => tier.tier !== 'Apprentice')
    .map((tier) => ({
      tier: tier.tier,
      atSkill: tier.minSkillToTrainNext ?? tier.skillRange[0],
      requiredCharacterLevel: tier.requiredCharacterLevel,
      trainedFrom: tier.trainedFrom,
      ...(tier.needsVerification ? { needsVerification: true } : {}),
      ...(tier.notes ? { notes: tier.notes } : {}),
    }))
    .sort((a, b) => a.atSkill - b.atSkill)
}
