import rawRankings from './bisRankings.json' with { type: 'json' }
import rawRecommendations from './bisRecommendations.json' with { type: 'json' }
import type { TbcClass, TbcSpec } from '../character/characterTypes'
import type { GearSlot } from '../gear/gearSlots'
import { getItemByWowItemId, isWithinDefaultPhase } from '../gear/itemCatalogue'
import { getVisibleGearSlotsForSpec } from '../gear/slotVisibility'
import type { BisList, RankedGearEntry } from './bisTypes'

/**
 * Phase 2 BiS rankings, generated from the Wowhead class guides by `tools/ingest/ingest-bis.mjs`.
 *
 * These replace 27 hand-written files that were one item deep — nearly every slot offered a single
 * option while the panel labelled it "1 ranked", presenting one guess as a considered ranking. The
 * guides carry four or five real options per slot, which is what the feature was missing.
 *
 * Entries are keyed by `wowItemId` in the generated data and resolved to catalogue ids here, so a
 * ranking survives the catalogue being re-ingested under different slugs. An entry whose item is not
 * in the catalogue is dropped rather than rendered as a dead id — `tools/ingest/supplement-items.mjs`
 * exists to keep that count at zero, and the test suite asserts it.
 */

type RawEntry = {
  rank: number
  wowItemId: number
  note?: string
  source?: string
  section: string
}

type RawSpec = {
  className: string
  spec: string
  phase: number
  sourceName: string
  sourceUrl: string
  slots: Record<string, RawEntry[]>
}

type RawRecommendation = { gems: Record<string, string>; enchants: Record<string, string> }

/**
 * Gem and enchant picks per spec, from the Wowhead enchants-and-gems guides.
 *
 * These are published separately from the BiS gear guides — a discovery pass over all 24 of those
 * found no gem or enchant section at all — so they arrive as their own dataset and are attached here.
 */
const recommendationsBySpec = rawRecommendations.specs as Record<string, RawRecommendation>

function recommendationFor(spec: RawSpec): RawRecommendation | undefined {
  return recommendationsBySpec[`${spec.className}|${spec.spec}`]
}

function toEntry(raw: RawEntry, slot: GearSlot, spec: RawSpec): RankedGearEntry | undefined {
  const item = getItemByWowItemId(raw.wowItemId)
  if (!item) return undefined

  const recommended = recommendationFor(spec)

  // Only the top pick carries the gem and enchant advice. The guides recommend one enchant per slot
  // and one gem per socket colour for the spec as a whole, not per ranked alternative, so hanging
  // them off every row would imply a precision the source does not have.
  const enchantId = raw.rank === 1 ? recommended?.enchants[slot] : undefined
  const gemIds =
    raw.rank === 1 && item.sockets?.length
      ? item.sockets.map((socket) => recommended?.gems[socket] ?? '')
      : undefined

  // The guide's own label ("Best Overall", "Threat Alternative") is kept verbatim: it carries the
  // reason a pick sits where it does, which a bare rank number throws away.
  const notes = [raw.note, raw.source].filter(Boolean).join(' — ') || undefined

  return {
    className: spec.className as TbcClass,
    spec: spec.spec as TbcSpec,
    phase: spec.phase,
    slot,
    rank: raw.rank,
    itemId: item.id,
    wowItemId: raw.wowItemId,
    sourceName: spec.sourceName,
    sourceUrl: spec.sourceUrl,
    notes,
    ...(enchantId ? { recommendedEnchantId: enchantId } : {}),
    ...(gemIds?.some(Boolean) ? { recommendedGemIds: gemIds } : {}),
  }
}

/**
 * Ranked entries dropped for naming gear later than `defaultMaxPhase` in `itemCatalogue`.
 *
 * Exported so it is asserted rather than described. A silent filter is exactly the kind of thing that
 * would quietly grow — if raising the phase ceiling ever opens these up, this reaching 0 is the
 * signal, and a test pins the current figure so a change has to be deliberate.
 */
export let excludedByPhase = 0

function buildLists(): BisList[] {
  const lists: BisList[] = []
  excludedByPhase = 0

  for (const spec of Object.values(rawRankings.specs) as RawSpec[]) {
    const entries: RankedGearEntry[] = []
    for (const rows of Object.values(spec.slots)) {
      /*
       * Wowhead's Phase 2 guides rank a few items Phase 2 cannot reach, labelled in their own notes
       * as "Optional", "Alternative" or "Seasonal". Both were verified against the item's real source
       * rather than trusted from the phase number: Band of Eternity is the reward from *Champion's
       * Pledge*, which requires Scale of the Sands — the Mount Hyjal faction, Phase 3 — and Hailstone
       * Pendant comes from the Ice Chest that Ahune drops in the Slave Pens during the Midsummer
       * event, added in 2.4. wowsims' phase values are right in both cases.
       *
       * They are dropped rather than shown greyed out, because this panel's rows carry a working
       * Equip button and the Gear panel will not list these items at all — so leaving them in offers
       * a player gear the rest of the app then refuses to acknowledge. Dropped *here* rather than in
       * the panel so every consumer sees one consistent Phase 2 list.
       */
      const inPhase = rows.filter((row) => {
        const item = getItemByWowItemId(row.wowItemId)
        return item ? isWithinDefaultPhase(item) : true
      })
      excludedByPhase += rows.length - inPhase.length

      /*
       * Renumbered densely so the panel does not render "#1 #2 #3 #5". The guide's ordering is
       * preserved — this only closes the gaps a removal leaves. Note this can move rank 1, and with
       * it the gem and enchant advice `toEntry` hangs off rank 1: that is correct, because the advice
       * is published per spec rather than per item, so it belongs on whatever is actually best here.
       */
      const renumbered = inPhase
        .slice()
        .sort((a, b) => a.rank - b.rank)
        .map((row, index) => ({ ...row, rank: index + 1 }))

      for (const row of renumbered) {
        const item = getItemByWowItemId(row.wowItemId)
        if (!item) continue

        // The item's own slot wins over the guide's section, because the sections are editorial and
        // the catalogue's slot is not. Wowhead files "Claw of the Phoenix" under a Hunter melee
        // weapons heading, but the item is off-hand only — trusting the heading would have offered it
        // as a main hand it can never occupy.
        //
        // Paired slots are deliberately *not* duplicated. The guides publish one "Ring Jewelry" or
        // "Trinkets" list because a player picks two from it, and the BiS panel already renders an
        // equip button per paired slot on each row. Listing the entry under both Trinket 1 and
        // Trinket 2 showed every trinket twice for no added information.
        const entry = toEntry(row, item.slot, spec)
        if (entry) entries.push(entry)
      }
    }

    // The guides publish a single "Weapons" section for dual-wielding specs, covering both hands. If
    // the spec shows an off-hand slot and the guide gave it no list of its own, the one-handers it
    // ranked for the main hand are legitimate off-hand picks — a two-hander or a main-hand-only
    // weapon is not, so those are left out rather than fanned across.
    const hasOffHand = entries.some((entry) => entry.slot === 'Off Hand')
    if (!hasOffHand && getVisibleGearSlotsForSpec(spec.className as TbcClass, spec.spec as TbcSpec).includes('Off Hand')) {
      const oneHanders = entries.filter(
        (entry) => entry.slot === 'Main Hand' && getItemByWowItemId(entry.wowItemId ?? 0)?.handType === 'One Hand',
      )
      entries.push(...oneHanders.map((entry, index) => ({ ...entry, slot: 'Off Hand' as GearSlot, rank: index + 1 })))
    }

    lists.push({
      id: `${spec.className}-${spec.spec}-phase-${spec.phase}`.toLowerCase().replaceAll(' ', '-'),
      className: spec.className as TbcClass,
      spec: spec.spec as TbcSpec,
      phase: spec.phase,
      title: `${spec.spec} ${spec.className} Phase ${spec.phase} Ranked List`,
      sourceName: spec.sourceName,
      sourceUrl: spec.sourceUrl,
      entries,
    })
  }

  return lists.sort((a, b) => a.className.localeCompare(b.className) || a.spec.localeCompare(b.spec))
}

export const bisLists: readonly BisList[] = buildLists()

export function getBisListForSpec(className: TbcClass, spec: TbcSpec) {
  return bisLists.find((list) => list.className === className && list.spec === spec)
}

/** Throws rather than returning undefined, so a missing spec fails at import instead of rendering empty. */
export function requireBisList(className: TbcClass, spec: TbcSpec): BisList {
  const list = getBisListForSpec(className, spec)
  if (!list) throw new Error(`No Phase 2 BiS list for ${className} ${spec}`)
  return list
}
