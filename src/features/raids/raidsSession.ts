import { getBossesForRaid, type Raid, type SpecRef } from '../../domain/raids'

export type RaidsView = 'me' | 'raid'

/** What the journal shows for a raid: `about`, a boss's id, or `trash`. */
export type JournalPage = string

/**
 * The Raids tab's place, kept by `App` for the session so a visit to another tab returns to it: the
 * raid, the view ("For me" or "For my raid"), the page open in each raid's journal, and the spec the
 * loot is ranked for.
 */
export type RaidsSession = {
  raidId: string
  view: RaidsView
  pages: Readonly<Record<string, JournalPage>>
  /** A spec's list, `all` for every drop unranked, or unset: your spec when you have one, every drop when not. */
  lootFor?: SpecRef | 'all'
}

/** Serpentshrine Cavern, the Phase 2 raid most players are in, as the prototype opened. */
export const initialRaidsSession: RaidsSession = { raidId: 'serpentshrine-cavern', view: 'me', pages: {} }

/**
 * Which colour the tab takes for a raid. Raids follows the raid, as the prototype's scene did:
 * Serpentshrine teal, Tempest Keep gold over violet, and the Phase 1 raids warm torchlight.
 */
export function raidLook(raidId: string, phase: number): 'ssc' | 'tk' | 'p1' {
  if (phase === 1) return 'p1'
  return raidId === 'tempest-keep' ? 'tk' : 'ssc'
}

/** The journal's pages in order: about the raid, each boss, then the notable trash when there is some. */
export function journalPages(raid: Raid): JournalPage[] {
  return ['about', ...getBossesForRaid(raid.id).map((boss) => boss.id), ...(raid.notableTrashLoot?.length ? ['trash'] : [])]
}

/** A raid opens on its first boss, as the game's journal does. */
export const defaultJournalPage = (raid: Raid): JournalPage => getBossesForRaid(raid.id)[0]?.id ?? 'about'
