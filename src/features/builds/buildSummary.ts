import { parseAddonExport, ADDON_EXPORT_FORMAT } from '../../domain/builds/addonImport'
import { parseBuild } from '../../domain/builds/buildSerialization'
import type { BuildImportIssue, SavedBuild } from '../../domain/builds/buildTypes'
import { decodeBuildFromLink, readShareValue } from '../../domain/builds/shareLink'
import type { TbcSpec } from '../../domain/character/characterTypes'
import { getItemById } from '../../domain/gear/itemCatalogue'
import type { GearItem } from '../../domain/gear/itemTypes'
import { getActiveSets } from '../../domain/gear/itemSets'
import { getSpecIcon } from '../../domain/raidcomp'
import { getTalentData } from '../../domain/talents/sampleTalents'
import { pointsInTree } from '../../domain/talents/talentTypes'
import { getVisibleGearSlotsForSpec, isEmptySlotItem } from '../gear/gearData'
import type { GearSlot } from '../gear/gearTypes'

/**
 * A build in one line of facts (port step 6, the decided Build tab's share card): who it is, how many
 * of their slots are filled, the average item level, the talent split, buffs and consumables, and the
 * set pieces. Read from the saved-build format, so the card, a saved build's row and a pasted build's
 * report all describe a build the same way.
 */
export type BuildSummary = {
  title: string
  specIcon?: string
  slots: readonly GearSlot[]
  /** Each visible slot's item, or undefined when the slot is empty or its item is not in the catalogue. */
  items: Partial<Record<GearSlot, GearItem>>
  filled: number
  /** The average item level of the items that carry one, rounded; undefined with nothing worn. */
  itemLevel?: number
  /** Points in each of the class's three trees, in the game's order; undefined for a class with no trees. */
  talentSplit?: readonly number[]
  buffs: number
  consumables: number
  debuffs: number
  sets: readonly { name: string; pieces: number; of: number }[]
}

export function summarizeBuild(build: SavedBuild): BuildSummary {
  const { className, spec, race } = build.character
  const slots = getVisibleGearSlotsForSpec(className, spec)
  const items: Partial<Record<GearSlot, GearItem>> = {}
  for (const slot of slots) {
    const item = build.gear[slot] ? getItemById(build.gear[slot]!.itemId) : undefined
    if (item && !isEmptySlotItem(item)) items[slot] = item
  }
  const worn = Object.values(items)
  const levels = worn.map((item) => item.itemLevel).filter((level): level is number => typeof level === 'number')
  const trees = getTalentData(className)?.trees

  return {
    title: `${race} ${spec} ${className}`,
    specIcon: getSpecIcon(className, spec),
    slots,
    items,
    filled: worn.length,
    itemLevel: levels.length ? Math.round(levels.reduce((sum, level) => sum + level, 0) / levels.length) : undefined,
    talentSplit: trees?.map((tree) => pointsInTree(tree, build.talentPoints ?? {})),
    buffs: build.activeBuffIds.length,
    consumables: build.activeConsumableIds.length,
    debuffs: build.activeTargetDebuffIds.length,
    sets: getActiveSets(worn).map((active) => ({ name: active.set.name, pieces: active.equippedPieces, of: active.set.totalPieces })),
  }
}

/** What a paste turned out to be, read but not applied: design C's "read first" report. */
export type PasteRead =
  | { ok: false; error: string }
  | {
      ok: true
      kind: 'link' | 'text' | 'addon'
      build: SavedBuild
      issues: BuildImportIssue[]
      /** An in-game export whose talents do not name a spec: the report asks before anything loads. */
      specChoice?: { reason: 'tie' | 'no-points'; candidates: readonly TbcSpec[] }
    }

/** The link value in a pasted share link (the whole address, or just its `#build=` fragment). */
function shareValueIn(text: string): string | undefined {
  const hash = text.includes('#') ? text.slice(text.indexOf('#')) : undefined
  return hash ? readShareValue(hash) : undefined
}

/**
 * One box, three formats: a share link, the build text this app exports, or the string the in-game
 * addon writes. The addon's format field and the link's fragment are the tells; anything else is read
 * as build text and gets that parser's errors. Nothing is applied here.
 */
export async function readPaste(raw: string): Promise<PasteRead> {
  const text = raw.trim()
  if (!text) return { ok: false, error: 'There is nothing to read: paste a link, the build text or the addon’s export.' }

  if (text.includes(ADDON_EXPORT_FORMAT)) {
    const result = parseAddonExport(text)
    return result.ok ? { ...result, kind: 'addon' } : result
  }

  const linkValue = !text.startsWith('{') ? shareValueIn(text) : undefined
  if (linkValue !== undefined) {
    const result = await decodeBuildFromLink(linkValue)
    return result.ok ? { ...result, kind: 'link' } : result
  }

  const result = parseBuild(text)
  return result.ok ? { ...result, kind: 'text' } : result
}
