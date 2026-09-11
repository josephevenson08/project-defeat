/**
 * The unit a gathering profession is actually levelled in.
 *
 * **This replaces one section per material with one section per decision.** The old model had a row
 * per ore and per herb — eleven for Mining, nineteen for Herbalism — and they overlapped, because
 * materials do: Tin runs 65-125 while Silver runs 75-125, so the page showed two sections covering
 * nearly the same skill window and a player standing at 80 had to work out which one they were in.
 * Gold got its own block entirely, which is the clearest symptom: Gold Veins sit in the same zones as
 * Iron and you pick them up on the Iron lap, so a section of its own describes a trip nobody takes.
 *
 * A range answers "what am I doing right now" instead. It owns a skill window, the zones worth
 * riding in that window, and every node the window unlocks — Gold included, on the range where you
 * actually hit it.
 */

import type { Profession } from './professionTypes'

/**
 * One node a range gathers, named by material *and* by the skill that unlocks it.
 *
 * **`atSkill` is a join key, not a caption.** Two of the ingested nodes share a material name and
 * differ only by requirement — Small Thorium Vein at 245 against Rich Thorium Vein at 275, and
 * Adamantite Deposit at 325 against Rich Adamantite Deposit at 350. Matching on the name alone
 * finds whichever the array happens to hold first and silently drops the other's coordinates, which
 * is the same failure that cost this project 28 of its 43 maps once already (see
 * `professionTypes.ts`, `MaterialFarmSpot.materials`).
 */
export type GatheringNodeRef = {
  material: string
  atSkill: number
}

/**
 * A per-zone aside, shown under the map for the zone it names.
 *
 * Kept separate from the range's own guidance because it is a different claim with a different
 * lifetime: "Arathi Highlands carries both Iron and Gold" is about this zone's node cloud, while
 * the range's prose is about the climb.
 */
export type ZoneNote = {
  zone: string
  note: string
}

export type GatheringRange = {
  /**
   * The skill window, **half-open at the top**: `[125, 175]` is 125 up to but not including 175.
   *
   * Half-open because the boundaries are shared — Mithril's 175 both ends one range and begins the
   * next — and a node must land in exactly one. Inclusive-on-both-ends put Tin's 65 in two sections
   * at once. The last range of each profession is the exception and includes 375, since there is no
   * range after it for the cap to fall into.
   */
  skillRange: [number, number]
  /**
   * Zones to ride this range in, **best first**, which is an editorial call and not a measurement.
   *
   * The density order would be wrong here and wrong in a way that matters. Silver's busiest recorded
   * zones are Arathi Highlands, Thousand Needles and Desolace — all level 30-40 zones — while a
   * player mining Silver at skill 75 is around level 20. Sorting the tabs by spawn count would put
   * the zone that kills them first. This list decides the tab order; the counts still decide which
   * zones have enough nodes to earn a tab at all.
   *
   * A zone with no published coordinates may still appear here: it prints in the prose line and
   * simply gets no tab. Darkshore is the case that matters — it is where a night elf starts mining,
   * and the ingest kept only Copper's three busiest zones.
   */
  zones: readonly string[]
  /** Character level the zones above are survivable at, as a range. */
  recommendedCharacterLevel: string
  /**
   * The written guidance — what this range is, what to expect, and what will catch you out.
   *
   * **Authored, and the only part of a range that is.** Everything else is derived from the ingest
   * or is a zone ordering. Each claim here was checked against at least two published guides plus
   * this repo's own spawn data before it was written; `sources` records against what.
   */
  guidance: string
  zoneNotes?: readonly ZoneNote[]
  /**
   * Materials named by hand, for the professions the game gives no world nodes.
   *
   * Skinning comes off mobs and Fishing off pools, so neither has coordinates to derive from and
   * both must say what they gather. Mining and Herbalism leave this unset: their materials come from
   * `nodeSpawns.json` by skill requirement, so a range cannot name an ore you cannot mine yet, and
   * a re-ingest that moves a requirement moves the ore to the right section on its own.
   */
  materials?: readonly string[]
  /** Where the guidance was checked. Bare hostnames — the citation is the check, not a footnote. */
  sources: readonly string[]
  needsVerification?: boolean
  notes?: string
}

/** A profession's whole climb, plus the standing advice that is not tied to one range. */
export type GatheringGuide = {
  profession: Profession
  /** The opening paragraphs, above the table. */
  intro: readonly string[]
  ranges: readonly GatheringRange[]
}
