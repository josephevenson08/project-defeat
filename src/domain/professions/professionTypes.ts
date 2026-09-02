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
  /**
   * The row's display label, which is frequently several materials — "Peacebloom / Silverleaf /
   * Earthroot", "Thorium Ore (incl. Rich Thorium Vein at 275+)". It is written for a reader.
   */
  material: string
  /**
   * The individual material names in this row, which is what joins it to `gatheringNodes`.
   *
   * **Separate from `material` because a display label is not a key**, and treating it as one cost
   * this project 28 of its 43 ingested nodes: `routesForMaterial` matched `node.material === material`
   * exactly, so every combined row — eight of Herbalism's nineteen and two of Mining's eleven —
   * silently found nothing and rendered no map, while the coordinates for all nine classic herbs sat
   * in `nodeSpawns.json` unreachable. The whole 1-300 herb progression was mapless on screen.
   *
   * Listed rather than parsed out of the label at render time: a split on "/" would have worked until
   * a label contained one for another reason, and a name that stops matching should fail a test
   * rather than quietly drop a map again. `tests/planner.spec.ts` asserts every name here resolves.
   */
  materials: readonly string[]
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
  /** Wowhead icon name, vendored into public/icons by `fetch-icons.mjs`. */
  icon: string
  /**
   * The leveling guide on wow-professions.com.
   *
   * **Linked, never copied.** Their routes, vendor lists and recipe orders are the work of that site;
   * reproducing them here would be taking it, and it would go stale the moment they corrected
   * something. A link stays current for free and sends the credit where it belongs.
   *
   * Recorded per profession rather than built from the name, because the site's own URLs are not
   * consistent — some end `-tbc-classic` and others `-burning-crusade-classic`, and Herbalism,
   * Mining, Skinning and Cooking do not follow the same rule as the crafting professions.
   */
  guideUrl: string
  /** The specialization guide, for the five professions that have specializations in TBC. */
  specializationUrl?: string
  /** For crafting/secondary professions: a concise recommended leveling path. */
  levelingPath?: readonly RecipeLeveling[]
  needsVerification?: boolean
  notes?: string
}
