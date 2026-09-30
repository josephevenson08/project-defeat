import type { CharacterProfile, Faction, TbcClass, TbcRace, TbcSpec } from '../character/characterTypes'
import { racesByFaction } from '../character/races'
import { getClassDefinition } from '../character/tbcClasses'
import { getItemByWowItemId } from '../gear/itemCatalogue'
import { isItemCompatibleWithGearSlot } from '../gear/slotCompatibility'
import type { GearSlot } from '../gear/gearSlots'
import { sampleEnchants } from '../enchants/sampleEnchants'
import { sampleGems } from '../gems/sampleGems'
import type { Profession } from '../professions/professionTypes'
import { getTalentData } from '../talents/sampleTalents'
import { defaultSimulationTarget } from '../simulation/sampleEncounters'
import { BUILD_FORMAT_VERSION, type BuildImportIssue, type SavedBuild, type SavedGearSlot } from './buildTypes'

/**
 * Reads the string the in-game addon produces and turns it into a build the planner can wear.
 *
 * The format, and the research behind every field in it, are in `docs/design/IN-GAME-IMPORT-SCOPE.md`; the addon
 * that writes it is in `addon/`. A real export from a level 70 Troll Enhancement Shaman is committed
 * at `addon/verify/real-export.json` and is what the tests run against.
 *
 * **Deliberately not `validateBuild`.** That function drops anything past Phase 2, which is right for
 * a saved build and wrong for a character someone is standing in: the first real export was half
 * Phase 3, and running it through that gate would have handed its owner a half-naked copy of their
 * own shaman. This converter equips what the player is wearing and says, once, that the *rankings*
 * stop at Phase 2 — which is the honest version of the same limit.
 */

/** The envelope the addon writes. Everything is validated before use; none of it is trusted. */
type AddonExport = {
  format?: unknown
  formatVersion?: unknown
  addon?: unknown
  client?: unknown
  level?: unknown
  race?: unknown
  class?: unknown
  faction?: unknown
  professions?: unknown
  talents?: unknown
  gear?: unknown
}

export type AddonImportResult =
  | { ok: false; error: string }
  | {
      ok: true
      build: SavedBuild
      issues: BuildImportIssue[]
      /**
       * Present when the talents do not name a spec on their own — an even split, or a character
       * with no points spent. The caller asks; the build carries the first tree until it does.
       */
      specChoice?: { reason: 'tie' | 'no-points'; candidates: readonly TbcSpec[] }
    }

export const ADDON_EXPORT_FORMAT = 'project-defeat-character'
export const ADDON_EXPORT_VERSION = 1

/** The game's race tokens are one word; the planner's names are how a player writes them. */
const RACE_BY_TOKEN: Record<string, TbcRace> = {
  Human: 'Human',
  Dwarf: 'Dwarf',
  NightElf: 'Night Elf',
  Gnome: 'Gnome',
  Draenei: 'Draenei',
  Orc: 'Orc',
  Scourge: 'Undead', // the client still calls the Forsaken by their old faction name
  Tauren: 'Tauren',
  Troll: 'Troll',
  BloodElf: 'Blood Elf',
}

const CLASS_BY_TOKEN: Record<string, TbcClass> = {
  WARRIOR: 'Warrior',
  PALADIN: 'Paladin',
  HUNTER: 'Hunter',
  ROGUE: 'Rogue',
  PRIEST: 'Priest',
  SHAMAN: 'Shaman',
  MAGE: 'Mage',
  WARLOCK: 'Warlock',
  DRUID: 'Druid',
}

/**
 * Inventory slot ids, as `GetInventoryItemLink` numbers them.
 *
 * 18 is the exception and needs the class: it is the Relic slot for Druids, Paladins and Shamans and
 * the Ranged slot for everyone else, and the game gives both the same id.
 */
const SLOT_BY_ID: Record<number, GearSlot> = {
  1: 'Head',
  2: 'Neck',
  3: 'Shoulders',
  5: 'Chest',
  6: 'Waist',
  7: 'Legs',
  8: 'Feet',
  9: 'Wrists',
  10: 'Hands',
  11: 'Finger 1',
  12: 'Finger 2',
  13: 'Trinket 1',
  14: 'Trinket 2',
  15: 'Back',
  16: 'Main Hand',
  17: 'Off Hand',
}

const RELIC_CLASSES: readonly TbcClass[] = ['Druid', 'Paladin', 'Shaman']

/** SkillLine ids for the ten primary professions, as the addon reports them. */
const PROFESSION_BY_SKILL_LINE: Record<number, Profession> = {
  164: 'Blacksmithing',
  165: 'Leatherworking',
  171: 'Alchemy',
  182: 'Herbalism',
  186: 'Mining',
  197: 'Tailoring',
  202: 'Engineering',
  333: 'Enchanting',
  393: 'Skinning',
  755: 'Jewelcrafting',
}

/** The highest phase the planner ranks for. Items past it are worn but never ranked. */
const RANKED_THROUGH_PHASE = 2

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

function slotFor(slotId: number, className: TbcClass): GearSlot | undefined {
  if (slotId === 18) return RELIC_CLASSES.includes(className) ? 'Relic' : 'Ranged'
  return SLOT_BY_ID[slotId]
}

/**
 * The spec, from the tree holding the most points.
 *
 * The game has no concept of a spec in TBC — only three trees and where the points went — so this is
 * the same rule the planner already gives a player when it explains what a spec is. A tie or an
 * untalented character genuinely has no answer, and gets asked rather than guessed at.
 */
function inferSpec(className: TbcClass, pointsByTree: readonly number[]) {
  const trees = getTalentData(className)?.trees ?? []
  const specs = trees.map((tree) => tree.spec as TbcSpec)
  const fallback = getClassDefinition(className).specs[0]

  const total = pointsByTree.reduce((sum, points) => sum + points, 0)
  if (total === 0) return { spec: fallback, choice: { reason: 'no-points' as const, candidates: specs } }

  const best = Math.max(...pointsByTree)
  const winners = specs.filter((_, index) => pointsByTree[index] === best)
  if (winners.length > 1) return { spec: winners[0], choice: { reason: 'tie' as const, candidates: winners } }

  return { spec: specs[pointsByTree.indexOf(best)] ?? fallback }
}

export function parseAddonExport(raw: string): AddonImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, error: "That doesn't look like an export — it isn't valid JSON." }
  }

  if (typeof parsed !== 'object' || parsed === null) return { ok: false, error: 'An export must be a JSON object.' }
  const data = parsed as AddonExport

  if (data.format !== ADDON_EXPORT_FORMAT) {
    return { ok: false, error: 'That JSON is not a Project Defeat character export.' }
  }
  if (data.formatVersion !== ADDON_EXPORT_VERSION) {
    // Named rather than guessed at: a newer addon may carry fields this build cannot read, and
    // silently importing the parts it recognises is how a character arrives subtly wrong.
    return {
      ok: false,
      error: `That export is format version ${String(data.formatVersion)}; this planner reads version ${ADDON_EXPORT_VERSION}. Update the planner, or export from the matching addon.`,
    }
  }

  const race = RACE_BY_TOKEN[String(data.race)]
  const className = CLASS_BY_TOKEN[String(data.class)]
  if (!race) return { ok: false, error: `Unknown race "${String(data.race)}" in the export.` }
  if (!className) return { ok: false, error: `Unknown class "${String(data.class)}" in the export.` }

  const issues: BuildImportIssue[] = []

  // Faction comes from the race rather than from the export's own field: the two cannot disagree in
  // game, and the race is the one the rest of the planner keys off.
  const faction = (Object.keys(racesByFaction) as Faction[]).find((side) => racesByFaction[side].includes(race))
  if (!faction) return { ok: false, error: `${race} belongs to no faction this planner knows.` }

  if (isNumber(data.level) && data.level < 70) {
    issues.push({ message: `This character is level ${data.level}. Every ranking and recommendation here assumes level 70.` })
  }

  // ── Talents ──────────────────────────────────────────────────────────────
  const trees = getTalentData(className)?.trees ?? []
  const talentPoints: Record<number, number> = {}
  const pointsByTree = trees.map(() => 0)

  if (Array.isArray(data.talents)) {
    for (const entry of data.talents) {
      if (!Array.isArray(entry) || entry.length < 5) continue
      const [talentId, tab, tier, column, rank] = entry as number[]
      if (!isNumber(talentId) || !isNumber(rank) || rank <= 0) continue

      const treeIndex = tab - 1
      const tree = trees[treeIndex]
      // The id is the primary key and the position is the fallback, which is why the addon sends
      // both. If the client's talent ids ever drift from the planner's, tier and column still place
      // the point — and the mismatch is reported rather than silently dropped.
      const byId = tree?.talents.find((talent) => talent.id === talentId)
      const byPosition = tree?.talents.find((talent) => talent.row === tier - 1 && talent.column === column - 1)
      const talent = byId ?? byPosition

      if (!talent) {
        issues.push({ message: `A talent the planner does not know (id ${talentId}, tree ${tab}, tier ${tier}) was skipped.` })
        continue
      }
      if (!byId && byPosition) {
        issues.push({ message: `${talent.name}: the game calls this talent ${talentId}, the planner calls it ${talent.id}. Placed by its position in the tree.` })
      }

      talentPoints[talent.id] = Math.min(rank, talent.maxRank)
      if (treeIndex >= 0 && treeIndex < pointsByTree.length) pointsByTree[treeIndex] += talentPoints[talent.id]
    }
  }

  const { spec, choice } = inferSpec(className, pointsByTree)

  // ── Professions ──────────────────────────────────────────────────────────
  const professions: Profession[] = []
  if (Array.isArray(data.professions)) {
    for (const entry of data.professions) {
      const skillLine = (entry as { skillLine?: unknown })?.skillLine
      const name = isNumber(skillLine) ? PROFESSION_BY_SKILL_LINE[skillLine] : undefined
      if (name && !professions.includes(name)) professions.push(name)
    }
  }
  if (professions.length > 2) {
    issues.push({ message: `The export carried ${professions.length} primary professions; the first two were kept.` })
    professions.length = 2
  }

  const character: CharacterProfile = {
    faction,
    race,
    className,
    spec,
    ...(professions.length > 0 ? { professions } : {}),
  }

  // ── Gear ─────────────────────────────────────────────────────────────────
  const gear: Partial<Record<GearSlot, SavedGearSlot>> = {}
  let beyondRankedPhase = 0

  if (Array.isArray(data.gear)) {
    for (const entry of data.gear) {
      const piece = entry as { slot?: unknown; item?: unknown; enchant?: unknown; gems?: unknown }
      if (!isNumber(piece.slot) || !isNumber(piece.item)) continue

      const slot = slotFor(piece.slot, className)
      if (!slot) continue

      const item = getItemByWowItemId(piece.item)
      if (!item) {
        issues.push({ slot, message: `${slot}: item ${piece.item} is not in this planner's catalogue, so the slot was left empty.` })
        continue
      }
      if (!isItemCompatibleWithGearSlot(item, slot)) {
        issues.push({ slot, message: `${slot}: ${item.name} does not belong in this slot, so it was skipped.` })
        continue
      }

      // Worn, not dropped — and counted, so one sentence can cover all of them.
      if ((item.phase ?? 0) > RANKED_THROUGH_PHASE) beyondRankedPhase += 1

      const saved: SavedGearSlot = { itemId: item.id, gemIds: [] }

      if (isNumber(piece.enchant) && piece.enchant > 0) {
        /*
         * `effectId` is the SpellItemEnchantment id the item link carries, and it is singular on
         * most entries — `effectIds` exists only where the ingest merged two records for one
         * enchant. Reading only the plural form found none of the owner's eight enchants, which is
         * what the real-export fixture caught.
         *
         * The slot check matters because several enchants share one effect id across slots
         * (2564, 2648, 2649): `allowedSlots` when the catalogue lists them, the entry's own slot
         * otherwise.
         */
        const wanted = piece.enchant
        const enchant = sampleEnchants.find((candidate) => {
          const effectIds = candidate.effectIds ?? (candidate.effectId === undefined ? [] : [candidate.effectId])
          if (!effectIds.includes(wanted)) return false
          return (candidate.allowedSlots ?? [candidate.slot]).includes(slot)
        })
        if (enchant) saved.enchantId = enchant.id
        else issues.push({ slot, message: `${slot}: enchant ${piece.enchant} is not in this planner's catalogue.` })
      }

      if (Array.isArray(piece.gems)) {
        saved.gemIds = piece.gems.map((gemId) => {
          if (!isNumber(gemId) || gemId === 0) return ''
          const gem = sampleGems.find((candidate) => candidate.wowItemId === gemId)
          if (gem) return gem.id
          issues.push({ slot, message: `${slot}: gem ${gemId} is not in this planner's catalogue, so that socket was left empty.` })
          return ''
        })
      }

      gear[slot] = saved
    }
  }

  if (beyondRankedPhase > 0) {
    /*
     * One sentence for all of them, and it says what is actually true. The items are equipped and
     * their stats count; what stops at Phase 2 is the ranking half — BiS lists, the upgrade finder
     * and "missing vs BiS" — which would otherwise call a Black Temple weapon missing.
     */
    issues.push({
      message: `${beyondRankedPhase} ${beyondRankedPhase === 1 ? 'item is' : 'items are'} from a later phase than this planner ranks. They are equipped and their stats count, but rankings and the upgrade finder only cover Phase ${RANKED_THROUGH_PHASE}.`,
    })
  }

  const build: SavedBuild = {
    version: BUILD_FORMAT_VERSION,
    savedAt: new Date().toISOString(),
    character,
    gear,
    activeBuffIds: [],
    activeConsumableIds: [],
    activeTargetDebuffIds: [],
    talentPoints,
    target: defaultSimulationTarget,
  }

  return { ok: true, build, issues, ...(choice ? { specChoice: choice } : {}) }
}
