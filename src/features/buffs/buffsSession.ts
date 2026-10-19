import type { SeatRef } from '../../domain/raidcomp'

/** Where your buffs come from: the raid on Raid Composition, an example raid, just you, or no raid at all. */
export type BuffSource = 'mine' | 'ex25' | 'ex10' | 'solo' | 'hand'

export const BUFF_SOURCES: readonly { id: BuffSource; label: string }[] = [
  { id: 'mine', label: 'Your raid' },
  { id: 'ex25', label: 'Example 25-man' },
  { id: 'ex10', label: 'Example 10-man' },
  { id: 'solo', label: 'Just you' },
  { id: 'hand', label: 'By hand' },
]

/**
 * Where the Buffs tab is, kept by `App` for the session: the raid your buffs come from, your seat in
 * it, and the Blessing each of its Paladins gives (by seat). The buffs themselves stay in the build's
 * own lists, which the stat bar, the simulator and a saved build read.
 *
 * **It opens By hand, with nothing on.** The prototype filled the example raid on a first visit; the
 * app starts every character clean, so a raid is something you choose rather than something that
 * changes your numbers because you opened a tab.
 */
export type BuffsSession = {
  source: BuffSource
  seat?: SeatRef
  blessings: Readonly<Record<string, string | null>>
}

export const initialBuffsSession: BuffsSession = { source: 'hand', blessings: {} }
