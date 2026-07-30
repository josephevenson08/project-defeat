import type { CharacterRole } from '../character/characterTypes'
import type { BuildRole } from '../gear/itemTypes'

/** Armour tier a raid rewards. Phase 2 only spans T4 (Karazhan/Gruul/Magtheridon) and T5 (SSC/TK). */
export type RaidTier = 'T4' | 'T5'

export type RaidPlayerSize = 10 | 25

/** How a drop is actually obtained, since not every notable raid item comes off a boss corpse. */
export type RaidDropType = 'Boss' | 'Tier Token' | 'Trash' | 'Quest Reward'

/**
 * One notable drop. `itemId` is populated only when the item already exists in
 * `src/domain/gear/sampleItems.ts`, so the UI can link through to real catalog data; items that are
 * genuine drops but not yet catalogued are listed by name with `needsVerification` instead.
 */
export type RaidLootEntry = {
  /** Matches an `id` in src/domain/gear/sampleItems.ts. Absent when the item is not in the catalog yet. */
  itemId?: string
  name: string
  wowItemId?: number
  dropType: RaidDropType
  /** Who the drop is actually for; omitted where the item is broadly useful or the audience is unclear. */
  roles?: readonly BuildRole[]
  needsVerification?: boolean
  notes?: string
}

/** A per-role callout for an encounter — the thing that role has to get right, in one sentence. */
export type RaidBossRoleNote = {
  role: CharacterRole
  note: string
}

export type RaidBoss = {
  id: string
  name: string
  /** Id of the owning raid in sampleRaids.ts. */
  raidId: string
  /** 1-based position in the usual clear order. Absent for optional/summoned encounters. */
  encounterOrder?: number
  /** Skippable, summoned, or otherwise off the critical path (Nightbane, Netherspite, Illhoof). */
  optional?: boolean
  /** 2-4 sentences covering only the mechanics that change how a raider plays the fight. */
  mechanics: string
  roleNotes?: readonly RaidBossRoleNote[]
  loot: readonly RaidLootEntry[]
  needsVerification?: boolean
  notes?: string
}

export type Raid = {
  id: string
  name: string
  /**
   * Every spelling this instance goes by elsewhere in the app. The item catalog and the BiS lists
   * use `instance` strings inconsistently (e.g. both 'Tempest Keep' and 'The Eye'), so the browser
   * matches against this list rather than against `name`.
   */
  instanceNames: readonly string[]
  tier: RaidTier
  playerSize: RaidPlayerSize
  /** Phase the raid was current content for, not the phase it is still worth running in. */
  phase: number
  zone: string
  /** Where the entrance physically is, for someone who has never walked there. */
  location: string
  /** One-line answer to "can I get in?". */
  attunement: string
  /** Id of the full ordered chain in sampleAttunements.ts, where one is modelled. */
  attunementChainId?: string
  /** Lockout length in days. */
  resetDays: number
  /** Strategy-oriented overview: what this raid is for and how a Phase 2 group should approach it. */
  description: string
  /** Trash drops worth naming, which are otherwise invisible in a boss-by-boss browser. */
  notableTrashLoot?: readonly RaidLootEntry[]
  needsVerification?: boolean
  notes?: string
}

export type AttunementDifficulty = 'Normal' | 'Heroic' | 'Raid' | 'Outdoor'

export type AttunementStep = {
  order: number
  /** Quest name, where the step is a quest rather than a plain "go kill/loot X". */
  questName?: string
  /** Short label for the step. */
  title: string
  /** What actually has to be done, killed, or looted. */
  requirement: string
  /** Dungeon, raid, or zone the step happens in. */
  location: string
  difficulty?: AttunementDifficulty
  needsVerification?: boolean
  notes?: string
}

export type AttunementChain = {
  id: string
  /** Id of the raid this chain unlocks. */
  raidId: string
  name: string
  summary: string
  /** Things that must already be done before step 1 is even possible. */
  prerequisites: readonly string[]
  steps: readonly AttunementStep[]
  /** What completing the chain grants. */
  reward: string
  needsVerification?: boolean
  notes?: string
}
