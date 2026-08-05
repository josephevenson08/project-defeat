import type { GearItem } from './itemTypes'

/**
 * A single set bonus, and — importantly — whether this simulator can act on it.
 *
 * Of the sixteen Tier 5 bonuses researched so far, **not one is a flat stat addition.** They are
 * ability-specific ("your Overpower grants 100 attack power", "Starfire damage increased by 10%"),
 * resource-specific ("Bloodthirst and Mortal Strike cost 5 less rage"), or benefit the party rather
 * than the wearer. Recording them as stats would therefore be inventing numbers, not approximating
 * them — the same category error that had four healer relics carrying flat healing power.
 *
 * So `modelled` is false everywhere for now, and `whyNotModelled` says what would need to exist
 * first. That is deliberately visible rather than silent: a BiS ranking built from itemised stats
 * undervalues tier pieces, and a reader deserves to see by how much and why.
 */
export type SetBonus = {
  /** Number of set pieces required — 2 or 4 for TBC tier sets. */
  pieces: number
  /** The tooltip text, verbatim where it was sourced. */
  description: string
  /** True only when the simulator actually applies it. */
  modelled: boolean
  /** What the engine would need before this could be applied. */
  whyNotModelled?: string
}

export type ItemSet = {
  id: string
  name: string
  /** Total pieces in the set. TBC tier sets are five. */
  totalPieces: number
  bonuses: readonly SetBonus[]
  needsVerification?: boolean
  notes?: string
}

const ABILITY_SPECIFIC = 'Applies to a named ability rather than to stats. The engine models one signature ability per spec and has no per-ability damage or cost modifiers, so there is nothing for this to attach to.'
const RESOURCE = 'Changes a resource cost. Rage and mana are not modelled as constraints, so a discount has no effect to express.'
const PARTY = 'Benefits the party rather than the wearer, and this simulator models a single character.'
const TRIGGER = 'A proc whose trigger rate the engine does not model — being hit, or landing a spell crit — so its uptime cannot be derived the way an item proc with a stated internal cooldown can.'

/**
 * Tier 5 sets, as far as they have been researched. Only the sets whose Head and Chest pieces have
 * been verified against real tooltips are listed; the rest of each set's slots are not catalogued
 * yet, which is why a 4-piece bonus is currently unreachable in the app.
 */
export const sampleItemSets: readonly ItemSet[] = [
  {
    id: 'destroyer-battlegear',
    name: 'Destroyer Battlegear',
    totalPieces: 5,
    bonuses: [
      { pieces: 2, description: 'Your Overpower ability now grants you 100 attack power for 5 sec.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
      { pieces: 4, description: 'Your Bloodthirst and Mortal Strike abilities cost 5 less rage.', modelled: false, whyNotModelled: RESOURCE },
    ],
  },
  {
    id: 'destroyer-armor',
    name: 'Destroyer Armor',
    totalPieces: 5,
    bonuses: [
      { pieces: 2, description: 'Each time you use your Shield Block ability, you gain 100 block value against a single attack in the next 6 sec.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
      { pieces: 4, description: 'You have a 7% chance each time you are hit to gain 200 haste rating for 10 sec.', modelled: false, whyNotModelled: TRIGGER },
    ],
  },
  {
    id: 'crystalforge-raiment',
    name: 'Crystalforge Raiment',
    totalPieces: 5,
    bonuses: [
      { pieces: 2, description: 'Each time you cast a Judgement, your party members gain 50 mana.', modelled: false, whyNotModelled: PARTY },
      { pieces: 4, description: 'Your critical heals from Flash of Light and Holy Light reduce the cast time of your next Holy Light spell by 0.50 sec. Cannot occur more than once per minute.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
    ],
  },
  {
    id: 'crystalforge-armor',
    name: 'Crystalforge Armor',
    totalPieces: 5,
    bonuses: [
      { pieces: 2, description: 'Increases the damage of your Retribution Aura by 15.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
      { pieces: 4, description: 'Each time you use your Holy Shield ability, you gain 100 block value against a single attack in the next 6 sec.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
    ],
  },
  {
    id: 'crystalforge-battlegear',
    name: 'Crystalforge Battlegear',
    totalPieces: 5,
    bonuses: [
      { pieces: 2, description: 'Reduces the mana cost of your Judgement abilities.', modelled: false, whyNotModelled: RESOURCE },
      { pieces: 4, description: 'Gives a chance to heal party members on a Judgement-related critical strike.', modelled: false, whyNotModelled: PARTY },
    ],
    needsVerification: true,
    notes: 'Both bonuses are paraphrased rather than verbatim — the research pass could not retrieve the raw tooltip text for this set, only a summary. Flagged for that reason; the set membership itself is confirmed.',
  },
  {
    id: 'nordrassil-regalia',
    name: 'Nordrassil Regalia',
    totalPieces: 5,
    bonuses: [
      { pieces: 2, description: 'When you shift out of Moonkin Form, your next Regrowth spell costs 450 less mana.', modelled: false, whyNotModelled: RESOURCE },
      { pieces: 4, description: 'Increases your Starfire damage against targets afflicted with Moonfire or Insect Swarm by 10%.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
    ],
    notes: 'The 4-piece bonus is one of the few that would be expressible if the engine had per-ability damage modifiers — Starfire is exactly the ability the Balance path already models.',
  },
  {
    id: 'nordrassil-raiment',
    name: 'Nordrassil Raiment',
    totalPieces: 5,
    bonuses: [
      { pieces: 2, description: 'Increases the duration of your Regrowth spell by 6 sec.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
      { pieces: 4, description: 'Increases the final amount healed by your Lifebloom spell by 150.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
    ],
    notes: 'The 4-piece bonus attaches to Lifebloom, which is the ability the Restoration path already models — another candidate if per-ability modifiers are ever added.',
  },
  {
    id: 'rift-stalker-armor',
    name: 'Rift Stalker Armor',
    totalPieces: 5,
    bonuses: [
      { pieces: 2, description: 'Your pet is healed for 15% of the damage you deal.', modelled: false, whyNotModelled: 'Pets are not modelled at all.' },
      { pieces: 4, description: 'Increases the critical strike chance of your Steady Shot by 5%.', modelled: false, whyNotModelled: 'Steady Shot is explicitly excluded from the rotation model, because its sustained rate depends on auto-shot weaving the engine does not track.' },
    ],
  },
  {
    id: 'tirisfal-regalia',
    name: 'Tirisfal Regalia',
    totalPieces: 5,
    bonuses: [
      { pieces: 2, description: 'Increases the damage and mana cost of your Arcane Blast by 20%.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
      { pieces: 4, description: 'Your spell critical strikes grant up to 70 spell damage for 6 sec.', modelled: false, whyNotModelled: TRIGGER },
    ],
    notes: 'The 2-piece bonus attaches to Arcane Blast, which the Arcane path already models — but it raises mana cost as well as damage, and mana is not a modelled constraint, so applying only the damage half would flatter it.',
  },
]

export function getItemSetById(id: string | undefined): ItemSet | undefined {
  if (!id) return undefined
  return sampleItemSets.find((set) => set.id === id)
}

export type ActiveSet = {
  set: ItemSet
  equippedPieces: number
  /** Bonuses whose piece requirement is met. All currently unmodelled — see `SetBonus`. */
  activeBonuses: readonly SetBonus[]
}

/**
 * Which sets the equipped gear has pieces of, and which of their bonuses are live.
 *
 * Counts distinct items rather than filled slots, so the same piece cannot be counted twice, and
 * returns sets with a single piece too — seeing "1 of 5" is how a player learns a set is in reach.
 */
export function getActiveSets(equippedItems: readonly GearItem[]): readonly ActiveSet[] {
  const counts = new Map<string, number>()
  const seen = new Set<string>()

  equippedItems.forEach((item) => {
    if (!item.setId || seen.has(item.id)) return
    seen.add(item.id)
    counts.set(item.setId, (counts.get(item.setId) ?? 0) + 1)
  })

  const active: ActiveSet[] = []

  counts.forEach((equippedPieces, setId) => {
    const set = getItemSetById(setId)
    if (!set) return
    active.push({
      set,
      equippedPieces,
      activeBonuses: set.bonuses.filter((bonus) => equippedPieces >= bonus.pieces),
    })
  })

  return active.sort((a, b) => b.equippedPieces - a.equippedPieces)
}
