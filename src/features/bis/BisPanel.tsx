import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Panel } from '../../components/layout/Panel'
import { Button } from '../../components/ui/Button'
import { getBisListForSpec, type RankedGearEntry } from '../../domain/bis'
import { getEnchantById } from '../../domain/enchants/sampleEnchants'
import type { GearSlot } from '../../domain/gear/gearSlots'
import { getQualityColor } from '../../domain/gear/qualityColors'
import { getPairedGearSlots, isItemBlockedByUniqueInGear, isPairedGearSlot } from '../../domain/gear/slotCompatibility'
import { getGemById } from '../../domain/gems/sampleGems'
import { animateEquipFeedback } from '../../lib/animations'
import type { CharacterProfile } from '../character/characterTypes'
import { getGearSlotDisplayName, getItemById, getVisibleGearSlotsForSpec } from '../gear/gearData'
import type { EquippedGear, EquippedSlot, GearItem } from '../gear/gearTypes'
import { ItemIcon } from '../gear/ItemIcon'
import { slotGlyph } from '../gear/slotGlyphs'

type BisPanelProps = {
  character: CharacterProfile
  gear: EquippedGear
  onEquip: (slot: GearSlot, equippedSlot: EquippedSlot) => void
}

/**
 * How many ranked entries a slot shows before it needs opening.
 *
 * Chosen from a measurement of the running panel rather than picked: it was **6,458px, 9.0 screens**
 * at 1280x720, from 64 entries across 15 slot groups. The entries are not the problem individually —
 * the median one is 61px, which is already tight — there are simply a lot of them.
 *
 * Entries per slot across all 27 specs run min 1, median 4, max 8, and 288 of the 398 slot groups
 * hold exactly 4. That is what makes the obvious cap ineffective: capping at 3 hides only 22.9% of
 * all entries and lands at ~7.4 screens, which is not a fix. Measured alternatives were 3 → ~7.4
 * screens, 2 → ~6.1, 1 → ~4.8.
 *
 * Two keeps the panel legibly *ranked* — you can see a #1 and a #2, so the list still reads as a
 * ranking rather than a single pick — while cutting about a third. Change this one number to move
 * along that curve; nothing else depends on the value.
 */
const DEFAULT_VISIBLE_PER_SLOT = 2

function entriesBySlot(entries: readonly RankedGearEntry[]) {
  const groups = new Map<GearSlot, RankedGearEntry[]>()

  entries.forEach((entry) => {
    const slotEntries = groups.get(entry.slot) ?? []
    slotEntries.push(entry)
    groups.set(entry.slot, slotEntries)
  })

  groups.forEach((slotEntries) => slotEntries.sort((a, b) => a.rank - b.rank))
  return groups
}

function itemLocation(item: GearItem) {
  return [item.source, item.zone, item.instance, item.boss, item.vendor, item.reputation, item.craftedBy]
    .filter(Boolean)
    .join(' / ')
}

function sourceDetails(entry: RankedGearEntry, item: GearItem | undefined) {
  const source = entry.source

  return {
    sourceType: source?.type ?? item?.source,
    instance: source?.instance ?? item?.instance ?? item?.zone,
    bossOrVendor: source?.boss ?? source?.vendor ?? source?.reputation ?? source?.craftedBy ?? item?.boss ?? item?.vendor ?? item?.reputation ?? item?.craftedBy,
    phase: source?.phase ?? item?.phase,
    notes: source?.notes,
    needsVerification: source?.needsVerification === true || entry.needsVerification === true || item?.needsVerification === true,
  }
}

function recommendationsFor(entry: RankedGearEntry) {
  const enchant = getEnchantById(entry.recommendedEnchantId)
  const gems = entry.recommendedGemIds?.map(getGemById).filter((gem) => gem !== undefined) ?? []

  return {
    enchantName: enchant?.name,
    gemNames: gems.map((gem) => gem.name),
  }
}

function equippedSlotFor(entry: RankedGearEntry, item: GearItem): EquippedSlot {
  return {
    item,
    enchantId: entry.recommendedEnchantId,
    gemIds: item.sockets?.map((_, index) => entry.recommendedGemIds?.[index] ?? '') ?? [],
  }
}

export function BisPanel({ character, gear, onEquip }: BisPanelProps) {
  // Which slots the reader has opened. Keyed by slot rather than a single "expand everything" flag,
  // because the reason to open one is to compare inside *that* slot, not to restore the 9-screen
  // wall. Held here rather than lifted: nothing outside this panel has any use for it, and a saved
  // build should not carry which accordions happened to be open when it was saved.
  const [expandedSlots, setExpandedSlots] = useState<ReadonlySet<GearSlot>>(new Set())

  const toggleSlot = (slot: GearSlot) =>
    setExpandedSlots((current) => {
      const next = new Set(current)
      if (!next.delete(slot)) next.add(slot)
      return next
    })

  const bisList = getBisListForSpec(character.className, character.spec)

  if (!bisList) {
    return (
      <Panel title="BiS / Ranked Gear" eyebrow="Guide list" className="bis-panel-shell">
        <div className="bis-empty" data-testid="bis-empty-state">
          <strong>No ranked list yet for {character.spec} {character.className}.</strong>
          <p>Every class and spec has a Phase 2 starter ranked list. Later phases plug into this same panel as they are audited.</p>
        </div>
      </Panel>
    )
  }

  const groupedEntries = entriesBySlot(bisList.entries)

  return (
    <Panel title="BiS / Ranked Gear" eyebrow={`Phase ${bisList.phase} guide list`} className="bis-panel-shell">
      <div className="bis-panel" data-testid="bis-panel">
        <div className="bis-summary">
          <strong>{bisList.title}</strong>
          <span>{bisList.sourceName}</span>
        </div>

        <div className="bis-slot-list">
          {getVisibleGearSlotsForSpec(character.className, character.spec).map((slot) => {
            const entries = groupedEntries.get(slot)
            if (!entries) return null
            const displayName = getGearSlotDisplayName(slot, character.className, character.spec)
            const isExpanded = expandedSlots.has(slot)
            const visibleEntries = isExpanded ? entries : entries.slice(0, DEFAULT_VISIBLE_PER_SLOT)
            const hiddenCount = entries.length - visibleEntries.length

            return (
              <section className="bis-slot-group" key={slot} aria-label={`${displayName} ranked items`}>
                <div className="bis-slot-heading">
                  <h3>{displayName}</h3>
                  <span>{entries.length} ranked</span>
                </div>

                <div className="bis-entry-list">
                  {visibleEntries.map((entry) => {
                    const item = getItemById(entry.itemId)
                    const { enchantName, gemNames } = recommendationsFor(entry)
                    const targetSlots = getPairedGearSlots(entry.slot)
                    const isPairedItem = isPairedGearSlot(entry.slot)
                    const wowItemId = entry.wowItemId ?? item?.wowItemId
                    const source = sourceDetails(entry, item)

                    return (
                      <article className="bis-entry" key={`${entry.slot}-${entry.rank}-${entry.itemId}`}>
                        <span className="bis-rank">#{entry.rank}</span>

                        {/* Frame first, so a row is anchored the same way the paperdoll is. Sized to
                            the icon it will become once art lands. */}
                        <span className="bis-item-frame" aria-hidden="true">
                          <ItemIcon wowItemId={item?.wowItemId} fallback={slotGlyph(entry.slot)} />
                          {item?.itemLevel ? <span className="bis-item-ilvl">{item.itemLevel}</span> : null}
                        </span>

                        <div className="bis-entry-body">
                          <h4 style={item ? { color: getQualityColor(item.quality) } : undefined}>{item?.name ?? entry.itemId}</h4>

                          {/*
                            Identity on one line rather than three stacked definition rows: id, slot,
                            and where it comes from. "Farm" was a second source line saying the same
                            thing in more words, so instance and boss fold in here instead.
                          */}
                          <p className="bis-entry-meta">
                            {wowItemId ? `#${wowItemId}` : 'ID pending'} · {displayName} ·{' '}
                            {[
                              source.sourceType ?? (item ? itemLocation(item) || item.source : entry.sourceName),
                              source.instance,
                              source.bossOrVendor,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>

                          {(enchantName || gemNames.length > 0) && (
                            <p className="bis-entry-recommended">
                              <span className="bis-entry-tag">Recommended</span>
                              {[enchantName, gemNames.length > 0 ? gemNames.join(', ') : undefined].filter(Boolean).join(' · ')}
                            </p>
                          )}

                          {/* Crafting stays: knowing an item is crafted is useless without knowing
                              what it costs, which is the one thing you cannot look up in-game while
                              standing at a vendor. */}
                          {item?.crafting && (
                            <div className="bis-crafting">
                              <p className="crafting-headline">
                                {item.craftedBy}
                                {item.crafting.requiredSkill ? ` (${item.crafting.requiredSkill} skill)` : ''}
                                {item.crafting.specialization ? ` · ${item.crafting.specialization}` : ''}
                                {item.crafting.recipeSource ? ` — recipe: ${item.crafting.recipeSource}` : ''}
                              </p>
                              <ul className="crafting-materials">
                                {item.crafting.materials.map((material) => (
                                  <li key={material.name}>
                                    <strong>
                                      {material.quantity}x {material.name}
                                    </strong>
                                    <span> — {material.farmSource}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {source.needsVerification && (
                            <p className="bis-verification-warning">
                              {source.notes ?? 'Needs source/rank verification before treating as final.'}
                            </p>
                          )}
                        </div>

                        {item ? (
                          <div className="bis-equip-actions">
                            {targetSlots.map((targetSlot) => {
                              const isEquipped = gear[targetSlot].item.id === entry.itemId
                              const blockedByUnique = isItemBlockedByUniqueInGear(item, targetSlot, gear)

                              return (
                                <Button
                                  className="bis-equip-button"
                                  disabled={isEquipped || blockedByUnique}
                                  key={targetSlot}
                                  onClick={(event) => {
                                    animateEquipFeedback(event.currentTarget)
                                    onEquip(targetSlot, equippedSlotFor(entry, item))
                                  }}
                                >
                                  <CheckCircle2 aria-hidden="true" size={16} />
                                  {isEquipped
                                    ? `Equipped ${targetSlot}`
                                    : blockedByUnique
                                      ? 'Unique equipped'
                                      : isPairedItem
                                        ? `Equip ${targetSlot}`
                                        : `Equip ${item.name}`}
                                </Button>
                              )
                            })}
                          </div>
                        ) : (
                          <span className="bis-missing-item">Missing registry item</span>
                        )}
                      </article>
                    )
                  })}
                </div>
                {/*
                  Only rendered when this slot actually has more, so a slot ranking one item shows
                  no control at all rather than a dead "Show all 1". The count is in the label
                  because "Show all" alone does not say whether it is worth the click.
                */}
                {hiddenCount > 0 || isExpanded ? (
                  <button
                    aria-expanded={isExpanded}
                    className="bis-slot-toggle"
                    data-testid={`bis-show-all-${slot}`}
                    onClick={() => toggleSlot(slot)}
                    type="button"
                  >
                    {isExpanded ? `Show top ${DEFAULT_VISIBLE_PER_SLOT}` : `Show all ${entries.length}`}
                  </button>
                ) : null}
              </section>
            )
          })}
        </div>
      </div>
    </Panel>
  )
}
