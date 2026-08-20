/**
 * Buffs that compete for one provider's single slot.
 *
 * **The planner was over-crediting badly without this.** One Paladin credited a raid with all five
 * Greater Blessings *and* all three auras; one Warrior with both shouts. A raid leader reading that
 * would think a single Paladin covered Kings, Might, Wisdom, Salvation and Sanctuary at once, which
 * is not a small error — it is the difference between bringing one Paladin and bringing four.
 *
 * Each group caps how many of its buffs a given number of providers can supply: **n providers cover
 * at most n of the group**, chosen in the stated priority order.
 *
 * `basis` matters and is not decoration. A **game rule** is enforced by the client and stated in a
 * tooltip; a **raid convention** is how raids actually run and could be argued with. The two are kept
 * distinct so a future reader can tell which lines are facts and which are defaults, rather than
 * discovering the difference by being surprised.
 */
export type ExclusivityBasis = 'game rule' | 'raid convention'

export type ExclusiveGroup = {
  id: string
  label: string
  /** Buff ids in the order a raid fills them. First is what a single provider brings. */
  buffIds: readonly string[]
  basis: ExclusivityBasis
  /** Where the constraint comes from. A game rule quotes its tooltip verbatim. */
  evidence: string
}

export const exclusiveGroups: readonly ExclusiveGroup[] = [
  {
    id: 'paladin-blessings',
    label: 'Greater Blessings',
    /*
     * Priority is a convention layered on a game rule. Kings first because it is the near-universal
     * raid pick — a flat 10% to every attribute helps every spec — then Might for the melee half and
     * Wisdom for the casters, with Salvation and Sanctuary as the situational remainder.
     */
    buffIds: [
      'blessing-of-kings',
      'blessing-of-might',
      'blessing-of-wisdom',
      'blessing-of-salvation',
      'blessing-of-sanctuary',
    ],
    basis: 'game rule',
    evidence:
      'Spell 27141: "Players may only have one Blessing on them per Paladin at any one time." Four Paladins are what a raid needs to run four blessings.',
  },
  {
    id: 'paladin-auras',
    label: 'Paladin auras',
    buffIds: ['devotion-aura', 'sanctity-aura', 'retribution-aura'],
    basis: 'game rule',
    evidence:
      'Rank 8 Devotion Aura, already sourced in sampleBuffs: "Only one Paladin aura can be active per Paladin, so this and the two below compete for the same slot."',
  },
  {
    id: 'warrior-shouts',
    label: 'Warrior shouts',
    /*
     * Battle Shout first because it is what a DPS warrior runs; a raid only sees Commanding Shout
     * once there is a second warrior, and in practice that is the Protection one.
     */
    buffIds: ['battle-shout', 'commanding-shout'],
    basis: 'raid convention',
    evidence:
      'Neither tooltip states exclusivity and wowsims applies both independently, so one warrior CAN maintain both. Raids do not: each shout costs rage and a global, and Commanding Shout is the lower priority. Modelled as one shout per warrior because that is what rosters actually run.',
  },
]

/** Which exclusive group a buff belongs to, if any. */
const groupByBuffId = new Map<string, ExclusiveGroup>(
  exclusiveGroups.flatMap((group) => group.buffIds.map((id) => [id, group] as const)),
)

export function exclusiveGroupFor(buffId: string): ExclusiveGroup | undefined {
  return groupByBuffId.get(buffId)
}

/**
 * Trims a set of "could be provided" buff ids down to what the providers can actually maintain.
 *
 * `providerCount` is how many seats of the providing class are in scope — the group for a
 * party-scoped buff, the whole raid for a raid-wide one. Buffs outside any exclusive group pass
 * through untouched, which is all but ten of them.
 */
export function applyExclusivity(
  candidateIds: readonly string[],
  providerCountFor: (group: ExclusiveGroup) => number,
): Set<string> {
  const kept = new Set<string>()
  const usedPerGroup = new Map<string, number>()

  /*
   * Iterated in each group's own priority order rather than in the order the candidates arrived, so
   * the buff a single provider brings is the one the group's first entry names — not whichever
   * happened to be earlier in the catalogue.
   */
  const candidates = new Set(candidateIds)

  for (const group of exclusiveGroups) {
    const budget = providerCountFor(group)
    if (budget <= 0) continue

    for (const buffId of group.buffIds) {
      if (!candidates.has(buffId)) continue
      const used = usedPerGroup.get(group.id) ?? 0
      if (used >= budget) break
      kept.add(buffId)
      usedPerGroup.set(group.id, used + 1)
    }
  }

  // Everything not governed by a group is unaffected.
  for (const buffId of candidates) if (!groupByBuffId.has(buffId)) kept.add(buffId)

  return kept
}
