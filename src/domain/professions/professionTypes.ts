export type Profession =
  | 'Alchemy'
  | 'Blacksmithing'
  | 'Enchanting'
  | 'Engineering'
  | 'Herbalism'
  | 'Jewelcrafting'
  | 'Leatherworking'
  | 'Mining'
  | 'Skinning'
  | 'Tailoring'
  | 'Cooking'
  | 'First Aid'
  | 'Fishing'

export type ProfessionCategory = 'Gathering' | 'Crafting' | 'Secondary'

/** TBC's standard proficiency tier names, shared across (almost) every profession. */
export type ProfessionTierName = 'Apprentice' | 'Journeyman' | 'Expert' | 'Artisan' | 'Master'

/**
 * One skill bracket for a profession: the tier name, its skill point range, the character
 * level required to train it, and where/who to train it from.
 */
export type ProfessionTier = {
  tier: ProfessionTierName
  /** Inclusive skill point range for this tier, e.g. [1, 75]. */
  skillRange: [number, number]
  /** Character level required to train this tier. */
  requiredCharacterLevel: number
  /** Minimum skill points needed before the next tier can be trained (if different from skillRange start). */
  minSkillToTrainNext?: number
  /** Where/who to train this tier from. */
  trainedFrom: string
  needsVerification?: boolean
  notes?: string
}

/**
 * Where to farm a specific raw material (ore/herb/fish/skin) relevant to a profession,
 * at a given skill range.
 */
export type MaterialFarmSpot = {
  material: string
  /** Inclusive skill point range at which this material is the relevant one to farm. */
  skillRange: [number, number]
  /** Zones/subzones where this material is found. */
  zones: string[]
  /** Approximate character level appropriate to farm safely in those zones. */
  recommendedCharacterLevel: string
  wowItemId?: number
  needsVerification?: boolean
  notes?: string
}

/** One step in a crafting profession's recommended skill-up leveling path. */
export type RecipeLeveling = {
  /** Inclusive skill point range this step covers. */
  skillRange: [number, number]
  /** The recipe/item crafted repeatedly to earn skill-ups through this range. */
  recipeOrItem: string
  /** Where the recipe itself is obtained: trainer, BoE/AH, quest reward, vendor, reputation, etc. */
  recipeSource: string
  /** Notable materials consumed in this step, if worth calling out. */
  keyMaterials?: string[]
  needsVerification?: boolean
  notes?: string
}

/** Full profile for a single profession: category, tiers, and (if applicable) farming/leveling data. */
export type ProfessionProfile = {
  profession: Profession
  category: ProfessionCategory
  /** Skill point cap in TBC (375 for all professions after the Outland increase). */
  skillCap: number
  tiers: readonly ProfessionTier[]
  /** For gathering professions (and gathering-adjacent callouts): raw material farm spots by skill range. */
  materialFarming?: readonly MaterialFarmSpot[]
  /** For crafting/secondary professions: a concise recommended leveling path. */
  levelingPath?: readonly RecipeLeveling[]
  needsVerification?: boolean
  notes?: string
}
