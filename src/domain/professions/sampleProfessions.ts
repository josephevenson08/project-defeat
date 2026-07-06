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
    tiers: getProfessionTiers(profession),
    ...(materialFarming.length > 0 ? { materialFarming } : {}),
    ...(levelingPath.length > 0 ? { levelingPath } : {}),
    ...(notes ? { notes } : {}),
  }
})

export function getProfessionProfile(profession: Profession): ProfessionProfile | undefined {
  return sampleProfessions.find((profile) => profile.profession === profession)
}
