import type { Profession, ProfessionCategory, ProfessionProfile } from './professionTypes'
import { getProfessionTiers } from './sampleProfessionTiers'
import { getMaterialFarmSpots } from './sampleGatheringMaterials'
import { getCraftingLevelingPath } from './sampleCraftingGuides'

const categoryByProfession: Record<Profession, ProfessionCategory> = {
  Mining: 'Gathering',
  Herbalism: 'Gathering',
  Skinning: 'Gathering',
  Fishing: 'Secondary',
  Cooking: 'Secondary',
  'First Aid': 'Secondary',
  Alchemy: 'Crafting',
  Blacksmithing: 'Crafting',
  Enchanting: 'Crafting',
  Engineering: 'Crafting',
  Jewelcrafting: 'Crafting',
  Leatherworking: 'Crafting',
  Tailoring: 'Crafting',
}

const professionNotes: Partial<Record<Profession, string>> = {
  Fishing:
    'Fishing gates Expert/Artisan behind a vendor purchase and the Nat Pagle questline rather than plain trainer visits; treated here as a secondary profession alongside Cooking and First Aid.',
  Herbalism: 'Provides the raw materials consumed by Alchemy; see Alchemy for what it crafts them into.',
  Mining: 'Provides the raw materials consumed by Blacksmithing, Engineering, and Jewelcrafting.',
  Skinning: 'Provides the raw materials consumed by Leatherworking.',
}

/**
 * Icon and outbound guide for each profession.
 *
 * The URLs were read off wow-professions.com's own TBC index rather than constructed, because the
 * site's paths are inconsistent between professions. The icon names are the game's trade-skill
 * artwork; `fetch-icons.mjs` downloads every one of them, so a typo fails the fetch rather than
 * shipping as a broken image.
 */
const presentation: Record<Profession, { icon: string; guideUrl: string; specializationUrl?: string }> = {
  Alchemy: {
    icon: 'trade_alchemy',
    guideUrl: 'https://www.wow-professions.com/tbc/alchemy-leveling-guide-burning-crusade-classic',
    specializationUrl: 'https://www.wow-professions.com/tbc/alchemy-specializations-tbc-classic',
  },
  Blacksmithing: {
    icon: 'trade_blacksmithing',
    guideUrl: 'https://www.wow-professions.com/tbc/blacksmithing-leveling-guide-burning-crusade-classic',
    specializationUrl: 'https://www.wow-professions.com/tbc/blacksmithing-specializations-tbc-classic',
  },
  Enchanting: {
    icon: 'trade_engraving',
    guideUrl: 'https://www.wow-professions.com/tbc/enchanting-leveling-guide-burning-crusade-classic',
  },
  Engineering: {
    icon: 'trade_engineering',
    guideUrl: 'https://www.wow-professions.com/tbc/engineering-leveling-guide-burning-crusade-classic',
    specializationUrl: 'https://www.wow-professions.com/tbc/engineering-specializations-tbc-classic',
  },
  Herbalism: { icon: 'trade_herbalism', guideUrl: 'https://www.wow-professions.com/tbc/herbalism-leveling-guide-tbc-classic' },
  Jewelcrafting: {
    icon: 'inv_misc_gem_01',
    guideUrl: 'https://www.wow-professions.com/tbc/jewelcrafting-leveling-guide-burning-crusade-classic',
  },
  Leatherworking: {
    icon: 'trade_leatherworking',
    guideUrl: 'https://www.wow-professions.com/tbc/leatherworking-leveling-guide-burning-crusade-classic',
    specializationUrl: 'https://www.wow-professions.com/tbc/leatherworking-specializations-tbc-classic',
  },
  Mining: { icon: 'trade_mining', guideUrl: 'https://www.wow-professions.com/tbc/mining-leveling-guide-tbc-classic' },
  Skinning: { icon: 'inv_misc_pelt_wolf_01', guideUrl: 'https://www.wow-professions.com/tbc/skinning-leveling-guide-tbc-classic' },
  Tailoring: {
    icon: 'trade_tailoring',
    guideUrl: 'https://www.wow-professions.com/tbc/tailoring-leveling-guide-burning-crusade-classic',
    specializationUrl: 'https://www.wow-professions.com/tbc/tailoring-specializations-tbc-classic',
  },
  Cooking: { icon: 'inv_misc_food_15', guideUrl: 'https://www.wow-professions.com/tbc/cooking-leveling-guide-tbc-classic' },
  'First Aid': {
    icon: 'spell_holy_sealofsacrifice',
    guideUrl: 'https://www.wow-professions.com/tbc/first-aid-leveling-guide-burning-crusade-classic',
  },
  Fishing: { icon: 'trade_fishing', guideUrl: 'https://www.wow-professions.com/tbc/fishing-leveling-guide-burning-crusade-classic' },
}

/** Every profession icon, for `fetch-icons.mjs` to vendor. */
export const professionIconNames: readonly string[] = Object.values(presentation).map((entry) => entry.icon)

export const allProfessions: readonly Profession[] = [
  'Alchemy',
  'Blacksmithing',
  'Enchanting',
  'Engineering',
  'Herbalism',
  'Jewelcrafting',
  'Leatherworking',
  'Mining',
  'Skinning',
  'Tailoring',
  'Cooking',
  'First Aid',
  'Fishing',
]

export const sampleProfessions: readonly ProfessionProfile[] = allProfessions.map((profession) => {
  const materialFarming = getMaterialFarmSpots(profession)
  const levelingPath = getCraftingLevelingPath(profession)
  const notes = professionNotes[profession]

  return {
    profession,
    category: categoryByProfession[profession],
    skillCap: 375,
    icon: presentation[profession].icon,
    guideUrl: presentation[profession].guideUrl,
    ...(presentation[profession].specializationUrl ? { specializationUrl: presentation[profession].specializationUrl } : {}),
    tiers: getProfessionTiers(profession),
    ...(materialFarming.length > 0 ? { materialFarming } : {}),
    ...(levelingPath.length > 0 ? { levelingPath } : {}),
    ...(notes ? { notes } : {}),
  }
})

export function getProfessionProfile(profession: Profession): ProfessionProfile | undefined {
  return sampleProfessions.find((profile) => profile.profession === profession)
}
