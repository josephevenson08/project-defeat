import { getActiveRacialTraits } from '../character/applyRacialTraits'
import type { CharacterProfile, CharacterRole } from '../character/characterTypes'
import { getBuffById } from '../buffs/sampleBuffs'
import { getTargetDebuffById } from '../buffs/sampleTargetDebuffs'
import type { EquippedGear } from '../gear/itemTypes'
import { talentSourcesOf } from '../talents/talentModifiers'
import type { TalentPoints } from '../talents/talentTypes'
import { computeBaseMissChance, computeSkillDiff } from './attackTable'
import { RATING_PER_PERCENT } from './combatConstants'
import type { SimulationTarget } from './encounterTypes'
import { computeBaseSpellMissChance } from './spellTable'

/**
 * The hit cap, for every spec: how much hit rating the gear has to bring before nothing the spec
 * relies on misses the boss. Read from the simulator's own tables, so the Gear tab's "Hit 140 / 95"
 * and the estimate agree on where hit stops paying.
 *
 * - **Special attacks** (melee DPS and tanks): the table's miss chance for a yellow attack, which has
 *   no dual-wield penalty. Talent hit (Precision), Heroic Presence and Improved Faerie Fire on the
 *   boss each take some of it, exactly as they join `missReduction` in `calculatePhysicalDps`. White
 *   swings from two weapons miss far more, so for a dual-wielder hit past this still pays.
 * - **Ranged attacks** (Hunters): the ranged table's miss chance, the same base, with Surefooted.
 * - **Spells** (casters): the spell table's miss chance down to its 1% floor, less talent hit, Inspiring
 *   Presence and spell-hit buffs such as Totem of Wrath.
 * - **Healers** have no cap: a heal cannot miss.
 */
export type HitCapKind = 'special' | 'ranged' | 'spell'

/** Something that removes part of the miss chance without hit rating from gear. */
export type HitCapSource = { kind: 'talent' | 'race' | 'buff' | 'boss'; name: string; percent: number }

export type HitCap = {
  kind: HitCapKind
  /** The gear stat that counts: hit rating for attacks, spell hit rating for spells. */
  stat: 'hitRating' | 'spellHitRating'
  /** The miss chance hit can take away, in percent: 9 for special attacks at level 73, 16 for spells. */
  missPercent: number
  sources: readonly HitCapSource[]
  /** What is left for the gear, in percent. */
  leftPercent: number
  /** Hit rating the gear needs: what is left, as rating, to the nearest point. */
  cap: number
  ratingPerPercent: number
  targetLevel: number
}

const PLAYER_LEVEL = 70

/** Percent from a fraction, rounded off the floating-point dust (0.08 − 0.03 is 0.04999…). */
const percent = (fraction: number) => Math.round(fraction * 1e6) / 1e4

export type HitCapInput = {
  character: CharacterProfile
  role: CharacterRole
  gear: EquippedGear
  talentPoints: TalentPoints
  activeBuffIds: readonly string[]
  activeTargetDebuffIds: readonly string[]
  target: SimulationTarget
}

export function hitCapFor({ character, role, gear, talentPoints, activeBuffIds, activeTargetDebuffIds, target }: HitCapInput): HitCap | undefined {
  if (role === 'Healer') return undefined
  const kind: HitCapKind = role === 'Caster DPS' ? 'spell' : character.className === 'Hunter' ? 'ranged' : 'special'
  const stat = kind === 'spell' ? 'spellHitRating' : 'hitRating'
  const ratingPerPercent = kind === 'spell' ? RATING_PER_PERCENT.spellHit : RATING_PER_PERCENT.meleeHit

  // Spells can never pass 99% to hit, so 1% of the table is out of reach whatever the gear.
  const miss =
    kind === 'spell'
      ? Math.max(0, computeBaseSpellMissChance(target.level - PLAYER_LEVEL) - 0.01)
      : computeBaseMissChance(computeSkillDiff(target.level))

  const sources: HitCapSource[] = []
  for (const { talent, value } of talentSourcesOf(talentPoints, kind === 'spell' ? 'spellHitChance' : 'meleeHitChance')) {
    sources.push({ kind: 'talent', name: talent, percent: percent(value) })
  }
  // Racials and buffs grant rating, which comes off the cap at the rate it is converted at.
  for (const trait of getActiveRacialTraits(character.race, character.className, gear)) {
    const rating = trait.stats?.[stat] ?? 0
    if (rating > 0) sources.push({ kind: 'race', name: trait.name, percent: percent(rating / ratingPerPercent / 100) })
  }
  for (const id of activeBuffIds) {
    const buff = getBuffById(id)
    const rating = buff?.stats?.[stat] ?? 0
    if (buff && rating > 0) sources.push({ kind: 'buff', name: buff.name, percent: percent(rating / ratingPerPercent / 100) })
  }
  // Improved Faerie Fire makes the boss easier to hit with melee and ranged attacks, not spells.
  if (kind !== 'spell') {
    for (const id of activeTargetDebuffIds) {
      const debuff = getTargetDebuffById(id)
      if (debuff?.physicalHitTakenBonus) sources.push({ kind: 'boss', name: debuff.name, percent: percent(debuff.physicalHitTakenBonus) })
    }
  }

  const missPercent = percent(miss)
  const leftPercent = Math.max(0, Math.round((missPercent - sources.reduce((sum, source) => sum + source.percent, 0)) * 1e4) / 1e4)
  return {
    kind,
    stat,
    missPercent,
    sources,
    leftPercent,
    /*
     * To the nearest point, not up: 15.8 is the blue post's rounding of 15.77 rating a percent, so
     * 9% is 142.2 here and 141.9 in the game. Rounding up would print 143 for the cap every TBC guide
     * calls 142; the 0.2 of a point between them is the constant's own rounding, not a miss.
     */
    cap: Math.round(leftPercent * ratingPerPercent),
    ratingPerPercent,
    targetLevel: target.level,
  }
}

/** Where the gear's hit stands against the cap: "45 over the cap", "12 under the cap", "at the cap". */
export function hitStanding(hit: number, cap: HitCap): { state: 'over' | 'under' | 'at'; text: string } {
  const rating = Math.round(hit)
  if (rating === cap.cap) return { state: 'at', text: 'at the cap' }
  if (rating > cap.cap) return { state: 'over', text: `${rating - cap.cap} over the cap` }
  const short = (cap.cap - rating) / cap.ratingPerPercent
  return { state: 'under', text: `${cap.cap - rating} under the cap (${short.toFixed(1)}% more misses)` }
}

const WHAT: Record<HitCapKind, string> = { special: 'special attacks', ranged: 'ranged attacks', spell: 'spells' }

const percentText = (value: number) => `${Number(value.toFixed(2))}%`

/**
 * The cap in plain words: "The hit cap for special attacks against a level 73 boss is 9%: 3% comes
 * from Precision, so the gear needs 6%, 95 rating."
 */
export function hitCapWords(cap: HitCap): string {
  const head = `The hit cap for ${WHAT[cap.kind]} against a level ${cap.targetLevel} boss is ${percentText(cap.missPercent)}`
  if (!cap.sources.length) return `${head}, ${cap.cap} rating from gear.`
  const from = cap.sources.map((source) => `${percentText(source.percent)} from ${source.name}`)
  const list = from.length > 1 ? `${from.slice(0, -1).join(', ')} and ${from[from.length - 1]}` : from[0]
  return `${head}: ${list}, so the gear needs ${percentText(cap.leftPercent)}, ${cap.cap} rating.`
}
