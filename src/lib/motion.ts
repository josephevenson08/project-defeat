/**
 * The way a tab asks the optional motion layer for a moment of motion (port step 7).
 *
 * **Every call is a no-op until the layer has loaded**, and the layer never loads with reduced motion,
 * so a tab calls this unconditionally and never has to ask whether motion is on. The layer itself (the
 * DOM effects in `features/scene/motionLayer.ts`, the 3D scene in `features/scene/waterScene.ts`) is
 * split out of the main bundle; this file is the only part of it every visitor downloads, which is why
 * it is a few lines and nothing else.
 *
 * A cue names its element directly (a ref the tab holds) or by selector, read a frame later so React
 * has drawn what the cue is about.
 */
type Target = Element | string | null | undefined

export type MotionCue =
  /** The scene's crystal brightens once and settles (the prototypes' "swell"); the backdrop does without the scene. */
  | { kind: 'swell' }
  /** Embers rise from the water for a moment. */
  | { kind: 'embers' }
  /**
   * Tiles land row by row; panels rise into place; route lines draw; a ring of light opens a pane; a
   * point pulses; bars fill from the left the first time they scroll into view.
   */
  | { kind: 'land' | 'rise' | 'draw' | 'enter' | 'pulse' | 'fill'; target: Target }
  /** A slow tint on a row that is short of something (the hit cap), and off again. */
  | { kind: 'taint'; target: Target; on: boolean }
  /** Raid Composition: how covered each group is (0 to 1), and how many groups the raid has. */
  | { kind: 'groups'; f: readonly number[]; n: number }

let sink: ((cue: MotionCue) => void) | undefined
// The groups' light and the tint are states, not moments: kept, so a layer that loads later still shows them.
const states = new Map<string, MotionCue>()

export function cue(next: MotionCue) {
  if (next.kind === 'groups' || next.kind === 'taint') states.set(next.kind, next)
  sink?.(next)
}

/** The layer's side. Returns the way to detach it again (reduced motion switched on). */
export function attachMotion(next: (cue: MotionCue) => void) {
  sink = next
  states.forEach(next)
  return () => {
    if (sink === next) sink = undefined
  }
}
