import type { TbcClass } from './characterTypes'

/**
 * Blizzard's own class colours, as used in the game's UI and by every community tool.
 *
 * **This is a deliberate exception to the app's colour policy**, which is otherwise near-monochrome so
 * that item quality reads first. That rule binds where item quality is on screen; the raid planner
 * shows no items at all, and a raid leader scanning twenty-five names for "how many Shamans" is
 * exactly the job colour does better than text. The same argument the section picker already makes
 * for its per-section hues.
 *
 * Values are the canonical RGB Blizzard publishes, unchanged. Druid orange is deliberately close to
 * the app's `--warn` amber, which is why nothing in this panel uses warn styling any more.
 */
export const classColors: Record<TbcClass, string> = {
  Warrior: '#C79C6E',
  Paladin: '#F58CBA',
  Hunter: '#ABD473',
  Rogue: '#FFF569',
  Priest: '#FFFFFF',
  Shaman: '#0070DE',
  Mage: '#69CCF0',
  Warlock: '#9482C9',
  Druid: '#FF7D0A',
}

export function getClassColor(className: TbcClass): string {
  return classColors[className]
}
