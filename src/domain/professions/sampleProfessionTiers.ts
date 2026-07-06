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
 * Fishing and First Aid have quirky pre-Master unlocks in vanilla-derived systems (Fishing's
 * Expert/Artisan tiers are gated by a purchase and a quest rather than a plain trainer visit;
 * First Aid's Artisan tier is gated by the "Triage" quest). We keep the shared skill/level
 * breakpoints but override `trainedFrom` and flag the quirk on those specific tiers.
 */
function withTierOverride(
  tiers: readonly ProfessionTier[],
  tierName: ProfessionTier['tier'],
  overrides: Partial<ProfessionTier>,
): ProfessionTier[] {
  return tiers.map((tier) => (tier.tier === tierName ? { ...tier, ...overrides } : tier))
}

function buildTiers(profession: Profession): ProfessionTier[] {
  let tiers = [...standardLeveling, masterTierByProfession[profession]]

  if (profession === 'Fishing') {
    tiers = withTierOverride(tiers, 'Expert', {
      trainedFrom: 'Purchase "Expert Fishing - The Bass and You" from Old Man Heming in Booty Bay (Horde and Alliance can both use this vendor).',
    })
    tiers = withTierOverride(tiers, 'Artisan', {
      trainedFrom: "Complete Nat Pagle's fishing quest line in Dustwallow Marsh to unlock Artisan Fishing.",
    })
  }

  if (profession === 'First Aid') {
    tiers = withTierOverride(tiers, 'Expert', {
      trainedFrom: 'Purchase the Expert First Aid manual from Balai Lok\'Wein (Horde, Dustwallow Marsh) or Deneb Walker (Alliance, Arathi Highlands), then learn it from your bag.',
    })
    tiers = withTierOverride(tiers, 'Artisan', {
      trainedFrom: 'Complete the "Triage" quest (Doctor Gustaf VanHowzen for Alliance, Doctor Gregory Victor for Horde) to unlock Artisan First Aid; requires level 35 and skill 225.',
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
