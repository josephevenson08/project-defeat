import type { RaidPlayerSize } from './raidTypes'
import { getRaidBuild, type Roster, type RosterSlot } from '../raidcomp'

/**
 * The example raids "For my raid" shows until you have planned your own on Raid Composition: real
 * builds in an invented seating, the ones the Raids and Tier Lists prototypes used. They are always
 * labelled as the example wherever they are shown; a raid you saved replaces them.
 */
const EXAMPLE_SEATS: Record<RaidPlayerSize, readonly (readonly string[])[]> = {
  25: [
    ['warrior-protection', 'paladin-protection', 'druid-feral-tank', 'paladin-holy', 'shaman-restoration'],
    ['warrior-fury', 'warrior-fury', 'rogue-combat', 'shaman-enhancement', 'druid-feral-cat'],
    ['mage-fire', 'warlock-destruction', 'shaman-elemental', 'priest-shadow', 'druid-balance'],
    ['hunter-beast-mastery', 'hunter-marksmanship', 'hunter-survival', 'paladin-retribution', 'rogue-combat'],
    ['priest-holy', 'priest-discipline', 'druid-restoration', 'paladin-holy', 'mage-arcane'],
  ],
  10: [
    ['warrior-protection', 'paladin-holy', 'shaman-enhancement', 'warrior-fury', 'rogue-combat'],
    ['druid-feral-tank', 'shaman-restoration', 'priest-shadow', 'mage-fire', 'warlock-destruction'],
  ],
}

export function exampleRaid(size: RaidPlayerSize): Roster {
  return {
    size,
    groups: EXAMPLE_SEATS[size].map((group) =>
      group.map((buildId): RosterSlot => {
        const build = getRaidBuild(buildId)
        if (!build) throw new Error(`exampleRaids: unknown build ${buildId}`)
        return { className: build.className, spec: build.spec, buildId }
      }),
    ),
  }
}
