import { useMemo, useState } from 'react'
import { getEnchantById } from '../../domain/enchants/sampleEnchants'
import { getActiveSets } from '../../domain/gear/itemSets'
import { getQualityColor } from '../../domain/gear/qualityColors'
import type { CharacterProfile } from '../character/characterTypes'
import { SetBonuses } from './SetBonuses'
import { getGearSlotDisplayName, getItemsForSlotAndCharacter, getVisibleGearSlotsForSpec, isItemBlockedByUniqueInGear } from './gearData'
import type { EquippedGear, EquippedSlot, GearItem, GearSlot } from './gearTypes'
import { ItemPopup } from './ItemPopup'
import { slotGlyph } from './slotGlyphs'

type GearPanelProps = {
  character: CharacterProfile
  gear: EquippedGear
  onChange: (slot: GearSlot, equippedSlot: EquippedSlot) => void
}

/**
 * The paperdoll arrangement, following the in-game character sheet: armour down the left, the rest
 * down the right, weapons across the bottom.
 *
 * This is spatial memory doing work a list cannot. A player who has spent any time in WoW already
 * knows Head is top-left and trinkets are bottom-right, so the layout itself becomes the label — a
 * flat 4-by-5 grid made you read every slot name to find the one you wanted.
 *
 * Every slot the app knows appears here exactly once; `getVisibleGearSlotsForSpec` then filters it
 * per spec, so a Rogue's Relic and a Druid's Ranged simply do not render.
 */
const PAPERDOLL: Record<'left' | 'right' | 'weapons', readonly GearSlot[]> = {
  left: ['Head', 'Neck', 'Shoulders', 'Back', 'Chest', 'Wrists'],
  right: ['Hands', 'Waist', 'Legs', 'Feet', 'Finger 1', 'Finger 2', 'Trinket 1', 'Trinket 2'],
  weapons: ['Main Hand', 'Off Hand', 'Ranged', 'Relic'],
}

/**
 * The equipped-gear list, laid out like the WoWSims gear panel the user pointed at: two columns of
 * slots, each a glyph carrying its item level, the item name in quality colour, and the enchant named
 * underneath in smaller text. Gems read as coloured dots on the glyph.
 *
 * Nothing here edits in place. Clicking a slot opens `ItemPopup`, so the list keeps its height and
 * stays scannable no matter what is being changed.
 */
export function GearPanel({ character, gear, onChange }: GearPanelProps) {
  const [openSlot, setOpenSlot] = useState<GearSlot>()

  function updateItem(slot: GearSlot, item: GearItem) {
    if (isItemBlockedByUniqueInGear(item, slot, gear)) return
    onChange(slot, { item, gemIds: item.sockets?.map(() => '') ?? [] })
  }

  const slots = getVisibleGearSlotsForSpec(character.className, character.spec)
  const activeSets = useMemo(() => getActiveSets(Object.values(gear).map((slot) => slot.item)), [gear])

  /** Slots this spec actually wears — Rogues have no Relic, Druids no Ranged, and so on. */
  const visible = (slot: GearSlot) => slots.includes(slot)

  function renderSlot(slot: GearSlot) {
    const equipped = gear[slot]
    const displayName = getGearSlotDisplayName(slot, character.className, character.spec)
    const options = getItemsForSlotAndCharacter(slot, character.className, character.spec)
    const isValid = options.some((option) => option.id === equipped.item.id)
    const enchant = equipped.enchantId ? getEnchantById(equipped.enchantId) : undefined

    return (
      <button type="button" className="gear-cell" key={slot} aria-label={`${displayName} slot`} onClick={() => setOpenSlot(slot)}>
        <span className="gear-glyph" aria-hidden="true">
          <span className="gear-glyph-text">{slotGlyph(slot)}</span>
          {equipped.item.itemLevel ? <span className="gear-ilvl">{equipped.item.itemLevel}</span> : null}
          {equipped.item.sockets?.length ? (
            <span className="gear-gems">
              {equipped.item.sockets.map((socket, index) => (
                <i
                  key={`${slot}-${socket}-${index}`}
                  className={`socket-dot socket-${socket.toLowerCase()} ${equipped.gemIds[index] ? 'socket-filled' : ''}`.trim()}
                />
              ))}
            </span>
          ) : null}
        </span>

        <span className="gear-cell-text">
          <span className="gear-slot-name">{displayName}</span>
          <span className="gear-item-name" style={{ color: getQualityColor(equipped.item.quality) }}>
            {equipped.item.name}
          </span>
          {enchant ? <span className="gear-enchant">{enchant.name}</span> : <span className="gear-enchant gear-enchant-empty">No enchant</span>}
          {!isValid && <span className="stale-slot-warning">Not valid for this spec</span>}
        </span>
      </button>
    )
  }

  return (
    <section className="panel gear-panel" aria-label="Gear">
      <header className="panel-head">
        <p className="eyebrow">Equipped</p>
        <h2>Gear</h2>
      </header>

      <div className="gear-paperdoll">
        <div className="gear-column gear-column-left">{PAPERDOLL.left.filter(visible).map(renderSlot)}</div>
        <div className="gear-column gear-column-right">{PAPERDOLL.right.filter(visible).map(renderSlot)}</div>
        <div className="gear-weapons">{PAPERDOLL.weapons.filter(visible).map(renderSlot)}</div>
      </div>

      <SetBonuses activeSets={activeSets} />

      {openSlot && (
        <ItemPopup
          slot={openSlot}
          character={character}
          gear={gear}
          onChangeItem={(item) => updateItem(openSlot, item)}
          onChangeEnchant={(enchantId) => onChange(openSlot, { ...gear[openSlot], enchantId: enchantId || undefined })}
          onChangeGem={(index, gemId) => {
            const gemIds = [...gear[openSlot].gemIds]
            gemIds[index] = gemId
            onChange(openSlot, { ...gear[openSlot], gemIds })
          }}
          onClose={() => setOpenSlot(undefined)}
        />
      )}
    </section>
  )
}
