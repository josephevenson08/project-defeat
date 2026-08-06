import { useState } from 'react'
import { getEnchantById } from '../../domain/enchants/sampleEnchants'
import { getQualityColor } from '../../domain/gear/qualityColors'
import type { CharacterProfile } from '../character/characterTypes'
import { getGearSlotDisplayName, getItemsForSlotAndCharacter, getVisibleGearSlotsForSpec, isItemBlockedByUniqueInGear } from './gearData'
import type { EquippedGear, EquippedSlot, GearItem, GearSlot } from './gearTypes'
import { ItemPopup } from './ItemPopup'

type GearPanelProps = {
  character: CharacterProfile
  gear: EquippedGear
  onChange: (slot: GearSlot, equippedSlot: EquippedSlot) => void
}

/** Short glyph standing in for an item icon. No art assets, and no network calls at runtime. */
const SLOT_GLYPH: Record<string, string> = {
  Head: 'HD',
  Neck: 'NK',
  Shoulders: 'SH',
  Back: 'BK',
  Chest: 'CH',
  Wrists: 'WR',
  Hands: 'HN',
  Waist: 'WT',
  Legs: 'LG',
  Feet: 'FT',
  'Finger 1': 'R1',
  'Finger 2': 'R2',
  'Trinket 1': 'T1',
  'Trinket 2': 'T2',
  'Main Hand': 'MH',
  'Off Hand': 'OH',
  Ranged: 'RG',
  Relic: 'RL',
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

  return (
    <section className="panel gear-panel" aria-label="Gear">
      <header className="panel-head">
        <p className="eyebrow">Equipped</p>
        <h2>Gear</h2>
      </header>

      <div className="gear-grid">
        {slots.map((slot) => {
          const equipped = gear[slot]
          const displayName = getGearSlotDisplayName(slot, character.className, character.spec)
          const options = getItemsForSlotAndCharacter(slot, character.className, character.spec)
          const isValid = options.some((option) => option.id === equipped.item.id)
          const enchant = equipped.enchantId ? getEnchantById(equipped.enchantId) : undefined

          return (
            <button
              type="button"
              className="gear-cell"
              key={slot}
              aria-label={`${displayName} slot`}
              onClick={() => setOpenSlot(slot)}
            >
              <span className="gear-glyph" aria-hidden="true">
                <span className="gear-glyph-text">{SLOT_GLYPH[slot] ?? '--'}</span>
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
                {enchant ? (
                  <span className="gear-enchant">{enchant.name}</span>
                ) : (
                  <span className="gear-enchant gear-enchant-empty">No enchant</span>
                )}
                {!isValid && <span className="stale-slot-warning">Not valid for this spec</span>}
              </span>
            </button>
          )
        })}
      </div>

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
