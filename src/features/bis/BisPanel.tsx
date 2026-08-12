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

            return (
              <section className="bis-slot-group" key={slot} aria-label={`${displayName} ranked items`}>
                <div className="bis-slot-heading">
                  <h3>{displayName}</h3>
                  <span>{entries.length} ranked</span>
                </div>

                <div className="bis-entry-list">
                  {entries.map((entry) => {
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
              </section>
            )
          })}
        </div>
      </div>
    </Panel>
  )
}
