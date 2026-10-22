/**
 * Where the Talents tab is, kept by `App` for the session: the tree shown on a phone (one at a time
 * there, with tree tabs) and the talent whose tooltip sits under the frame with − and +. The points
 * themselves are the build's `talentPoints`, which the stat bar, the simulator and a saved build read.
 *
 * Both are names a class's trees may not have once the class changes, so the tab checks them against
 * the trees it draws and falls back to the character's own tree.
 */
export type TalentsSession = {
  tree?: string
  selected?: number
}

export const initialTalentsSession: TalentsSession = {}
