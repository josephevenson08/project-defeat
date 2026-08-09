import type { GearItem } from './itemTypes'

/**
 * A single set bonus, and — importantly — whether this simulator can act on it.
 *
 * Across all thirty-four Tier 5 bonuses — every one of them, now that the set list is complete —
 * **not one is a flat stat addition.** They are ability-specific ("your Overpower grants 100 attack
 * power", "Starfire damage increased by 10%"), resource-specific ("Bloodthirst and Mortal Strike
 * cost 5 less rage"), pet or talent scaling, or they benefit the party rather than the wearer.
 * Recording them as stats would therefore be inventing numbers, not approximating them — the same
 * category error that had four healer relics carrying flat healing power.
 *
 * The nearest miss is Cataclysm Harness 4-piece, "You gain 5% additional haste from your Flurry
 * ability": haste is a stat this engine reads, but it arrives through a talent proc, so a flat 5%
 * would be an invented uptime rather than an approximated one.
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
  /**
   * Wowhead item id whose tooltip the bonus text was read from. An item page embeds the whole set
   * listing and its "(2) Set:" / "(4) Set:" lines, so one piece is enough to source both bonuses —
   * and recording which one makes the description checkable rather than merely plausible.
   */
  sourcedFrom?: number
  needsVerification?: boolean
  notes?: string
}

const ABILITY_SPECIFIC = 'Applies to a named ability rather than to stats. The engine models one signature ability per spec and has no per-ability damage or cost modifiers, so there is nothing for this to attach to.'
const RESOURCE = 'Changes a resource cost, or grants resource back. Rage and mana are not modelled as constraints, so neither a discount nor a refund has an effect to express.'
const PARTY = 'Benefits the party rather than the wearer, and this simulator models a single character.'
const TRIGGER = 'A proc whose trigger rate the engine does not model — being hit, or landing a spell crit — so its uptime cannot be derived the way an item proc with a stated internal cooldown can.'
const PET = 'Pets are not modelled at all.'
const TALENT = 'Scales a talent. There are no talent trees in this app, so the ability it modifies does not exist to be modified.'

/**
 * All seventeen Tier 5 sets, one per class per role. Every bonus below is the verbatim tooltip text,
 * read off the Wowhead item page named in `sourcedFrom` — an item tooltip embeds its whole set
 * listing, so one piece sources both bonuses.
 *
 * This used to be nine sets, and the four-piece bonuses were unreachable because only Head and Chest
 * were catalogued. All five slots of all seventeen sets now carry a `setId`, so both tiers of bonus
 * are reachable in the app.
 *
 * Only Tier 5 is here, which is the phase this app targets. The catalogue knows 222 set names in
 * total — Tier 4, Tier 6, dungeon and PvP sets — and those deliberately show nothing rather than
 * inventing bonuses.
 */
export const sampleItemSets: readonly ItemSet[] = [
  {
    id: 'destroyer-battlegear',
    name: 'Destroyer Battlegear',
    totalPieces: 5,
    sourcedFrom: 30118,
    bonuses: [
      { pieces: 2, description: 'Your Overpower ability now grants you 100 attack power for 5 sec.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
      { pieces: 4, description: 'Your Bloodthirst and Mortal Strike abilities cost 5 less rage.', modelled: false, whyNotModelled: RESOURCE },
    ],
  },
  {
    id: 'destroyer-armor',
    name: 'Destroyer Armor',
    totalPieces: 5,
    sourcedFrom: 30113,
    bonuses: [
      { pieces: 2, description: 'Each time you use your Shield Block ability, you gain 100 block value against a single attack in the next 6 sec.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
      { pieces: 4, description: 'You have a chance each time you are hit to gain 200 haste rating for 10 sec. (Proc chance: 7%)', modelled: false, whyNotModelled: TRIGGER },
    ],
  },
  {
    id: 'crystalforge-raiment',
    name: 'Crystalforge Raiment',
    totalPieces: 5,
    sourcedFrom: 30134,
    bonuses: [
      { pieces: 2, description: 'Each time you cast a Judgement, your party members gain 50 mana.', modelled: false, whyNotModelled: PARTY },
      { pieces: 4, description: 'Your critical heals from Flash of Light and Holy Light reduce the cast time of your next Holy Light spell by 0.50 sec for 10 sec. This effect cannot occur more than once per minute. (1m cooldown)', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
    ],
  },
  {
    id: 'crystalforge-armor',
    name: 'Crystalforge Armor',
    totalPieces: 5,
    sourcedFrom: 30123,
    bonuses: [
      { pieces: 2, description: 'Increases the damage from your Retribution Aura by 15.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
      { pieces: 4, description: 'Each time you use your Holy Shield ability, you gain 100 block value against a single attack in the next 6 sec.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
    ],
  },
  {
    id: 'crystalforge-battlegear',
    name: 'Crystalforge Battlegear',
    totalPieces: 5,
    sourcedFrom: 30129,
    bonuses: [
      { pieces: 2, description: 'Reduces the cost of your Judgements by 35.', modelled: false, whyNotModelled: RESOURCE },
      { pieces: 4, description: 'Each time you cast a Judgement, there is a chance it will heal all nearby party members for 244 to 256. (Proc chance: 6%)', modelled: false, whyNotModelled: PARTY },
    ],
    notes: 'This set was the one entry flagged as paraphrased rather than verbatim, and the paraphrase was wrong as well as vague: it described the 4-piece as triggering on "a Judgement-related critical strike", when the real bonus is a flat 6% chance on any Judgement cast, crit or not.',
  },
  {
    id: 'nordrassil-regalia',
    name: 'Nordrassil Regalia',
    totalPieces: 5,
    sourcedFrom: 30231,
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
    sourcedFrom: 30216,
    bonuses: [
      { pieces: 2, description: 'Increases the duration of your Regrowth spell by 6 sec.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
      { pieces: 4, description: 'Increases the final amount healed by your Lifebloom spell by 150.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
    ],
    notes: 'The 4-piece bonus attaches to Lifebloom, which is the ability the Restoration path already models — another candidate if per-ability modifiers are ever added.',
  },
  {
    id: 'nordrassil-harness',
    name: 'Nordrassil Harness',
    totalPieces: 5,
    sourcedFrom: 30222,
    bonuses: [
      { pieces: 2, description: 'When you shift out of Bear Form, Dire Bear Form, or Cat Form, your next Regrowth spell takes 2.0 fewer sec. to cast.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
      { pieces: 4, description: 'Your Shred ability deals an additional 75 damage, and your Lacerate ability does an additional 15 per application.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
    ],
  },
  {
    id: 'rift-stalker-armor',
    name: 'Rift Stalker Armor',
    totalPieces: 5,
    sourcedFrom: 30139,
    bonuses: [
      { pieces: 2, description: 'Causes your pet to be healed for 15% of the damage you deal.', modelled: false, whyNotModelled: PET },
      { pieces: 4, description: 'Your Steady Shot ability has 5% increased critical strike chance.', modelled: false, whyNotModelled: 'Steady Shot is explicitly excluded from the rotation model, because its sustained rate depends on auto-shot weaving the engine does not track.' },
    ],
  },
  {
    id: 'tirisfal-regalia',
    name: 'Tirisfal Regalia',
    totalPieces: 5,
    sourcedFrom: 30196,
    bonuses: [
      { pieces: 2, description: 'Increases the damage and mana cost of Arcane Blast by 20%.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
      { pieces: 4, description: 'Your spell critical strikes grant you up to 70 spell damage for 6 sec.', modelled: false, whyNotModelled: TRIGGER },
    ],
    notes: 'The 2-piece bonus attaches to Arcane Blast, which the Arcane path already models — but it raises mana cost as well as damage, and mana is not a modelled constraint, so applying only the damage half would flatter it.',
  },
  {
    id: 'avatar-regalia',
    name: 'Avatar Regalia',
    totalPieces: 5,
    sourcedFrom: 30159,
    bonuses: [
      { pieces: 2, description: 'Each time you cast an offensive spell, there is a chance your next spell will cost 150 less mana. (Proc chance: 6%)', modelled: false, whyNotModelled: RESOURCE },
      { pieces: 4, description: 'Each time your Shadow Word: Pain deals damage, it has a chance to grant your next spell cast within 15 sec up to 100 damage and healing. (Proc chance: 40%)', modelled: false, whyNotModelled: TRIGGER },
    ],
    notes: 'The 4-piece bonus states its proc chance, but it triggers off Shadow Word: Pain ticking — the engine models one signature ability per spec and no damage-over-time schedule, so there is no tick rate to multiply the 40% against.',
  },
  {
    id: 'avatar-raiment',
    name: 'Avatar Raiment',
    totalPieces: 5,
    sourcedFrom: 30150,
    bonuses: [
      { pieces: 2, description: 'If your Greater Heal brings the target to full health, you gain 100 mana.', modelled: false, whyNotModelled: RESOURCE },
      { pieces: 4, description: 'Increases the duration of your Renew spell by 3 sec.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
    ],
  },
  {
    id: 'deathmantle',
    name: 'Deathmantle',
    totalPieces: 5,
    sourcedFrom: 30144,
    bonuses: [
      { pieces: 2, description: 'Your Eviscerate and Envenom abilities cause 40 extra damage per combo point.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
      { pieces: 4, description: 'Your attacks have a chance to make your next finishing move cost no energy.', modelled: false, whyNotModelled: TRIGGER },
    ],
    notes: 'Alone among the Tier 5 bonuses catalogued here, the 4-piece states no proc chance at all — so even the energy saving, which is the one resource this engine does reason about when deriving a special\'s rate, has no rate to apply it at.',
  },
  {
    id: 'cataclysm-regalia',
    name: 'Cataclysm Regalia',
    totalPieces: 5,
    sourcedFrom: 30169,
    bonuses: [
      { pieces: 2, description: 'Each time you cast an offensive spell, there is a chance your next Lesser Healing Wave will cost 380 less mana. (Proc chance: 7%)', modelled: false, whyNotModelled: RESOURCE },
      { pieces: 4, description: 'Your Lightning Bolt critical strikes have a chance to grant you 120 mana. (Proc chance: 25%)', modelled: false, whyNotModelled: RESOURCE },
    ],
  },
  {
    id: 'cataclysm-raiment',
    name: 'Cataclysm Raiment',
    totalPieces: 5,
    sourcedFrom: 30164,
    bonuses: [
      { pieces: 2, description: 'Reduces the cost of your Lesser Healing Wave spell by 5%.', modelled: false, whyNotModelled: RESOURCE },
      { pieces: 4, description: 'Your critical heals from Healing Wave, Lesser Healing Wave, and Chain Heal reduce the cast time of your next Healing Wave spell by 0.50 sec for 10 sec. This effect cannot occur more than once per minute. (1m cooldown)', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
    ],
  },
  {
    id: 'cataclysm-harness',
    name: 'Cataclysm Harness',
    totalPieces: 5,
    sourcedFrom: 30185,
    bonuses: [
      { pieces: 2, description: 'Your melee attacks have a chance to reduce the cast time of your next Lesser Healing Wave by 1.5 sec. (Proc chance: 2%)', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
      { pieces: 4, description: 'You gain 5% additional haste from your Flurry ability.', modelled: false, whyNotModelled: TALENT },
    ],
    notes: 'The 4-piece is the closest any Tier 5 bonus comes to a flat stat — it is haste, which the engine does read. But it is haste *from Flurry*, a talent proc, so applying 5% haste unconditionally would be inventing an uptime rather than approximating one.',
  },
  {
    id: 'corruptor-raiment',
    name: 'Corruptor Raiment',
    totalPieces: 5,
    sourcedFrom: 30211,
    bonuses: [
      { pieces: 2, description: 'Causes your pet to be healed for 15% of the damage you deal.', modelled: false, whyNotModelled: PET },
      { pieces: 4, description: 'Your Shadowbolt spell hits increase the damage of Corruption by 10% and your Incinerate spell hits increase the damage of Immolate by 10%.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
    ],
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
