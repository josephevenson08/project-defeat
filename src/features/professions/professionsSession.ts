import type { Profession } from '../../domain/professions'

/** The two views behind the tab's switch: the profession window, and the comparison. */
export type ProfessionsView = 'level' | 'which'

/**
 * Where the Professions tab is, kept by the app so leaving the tab and coming back finds it as it was
 * (as Raids and Spec Tier Lists do). Not in the address: the hash carries share links.
 */
export type ProfessionsSession = {
  view: ProfessionsView
  /** The profession the window shows; absent until one is picked, when it opens on yours. */
  profession?: Profession
  /** Your skill in each profession, as set on the window's bar. */
  skills: Partial<Record<Profession, number>>
  /** The recipe or range picked in the window's list, per profession; absent means the one you are on. */
  picks: Partial<Record<Profession, number>>
  /** The Wowhead list "Which two" reads, as `Class|Spec`; absent means your character's. */
  spec?: string
  /** Your two, held here only when there is no character to hold them. */
  pair: readonly Profession[]
}

export const initialProfessionsSession: ProfessionsSession = { view: 'level', skills: {}, picks: {}, pair: [] }

/** The profession the window opens on when none is picked: your first, or Blacksmithing, as the design did. */
export const DEFAULT_PROFESSION: Profession = 'Blacksmithing'

export const professionSlug = (profession: string) => profession.toLowerCase().replaceAll(' ', '-')
