import { useMemo, useState } from 'react'
import { getEnchantById } from '../../domain/enchants/sampleEnchants'
import { getActiveSets } from '../../domain/gear/itemSets'
import { getQualityColor } from '../../domain/gear/qualityColors'
import type { CharacterProfile } from '../character/characterTypes'
import { SetBonuses } from './SetBonuses'
import { getGearSlotDisplayName, getItemsForSlotAndCharacter, getVisibleGearSlotsForSpec, isEmptySlotItem, isItemBlockedByUniqueInGear } from './gearData'
import type { EquippedGear, EquippedSlot, GearItem, GearSlot } from './gearTypes'
import { ItemIcon } from './ItemIcon'
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
/**
 * The order the slots are listed in: down the body, then the weapons.
 *
 * **This replaced a paperdoll, and the trade is worth stating.** The slots used to be arranged on a
 * grid shaped like a body — head at the top centre, feet at the bottom centre, armour down either
 * side — so you found the boots by looking where boots go, and the arrangement did the work of a
 * label. That is genuinely better at *finding a slot*.
 *
 * It is worse at everything else this screen does. Seventeen cards three lines tall, each reading
 * "Empty / No enchant" on a character that has just been created, is what the owner's heuristic
 * evaluation rated a major density problem: fifty-one lines of nothing arranged as a person. A list
 * is one line per slot, so the same screen is readable when it is empty and scannable when it is
 * full, and the item names — which is what you actually read once there are any — line up in a
 * column instead of being scattered around a silhouette.
 *
 * The order still follows the body, so the spatial habit is not thrown away entirely.
 */
const SLOT_ORDER: readonly GearSlot[] = [
  'Head',
  'Neck',
  'Shoulders',
  'Back',
  'Chest',
  'Wrists',
  'Hands',
  'Waist',
  'Legs',
  'Feet',
  'Finger 1',
  'Finger 2',
  'Trinket 1',
  'Trinket 2',
  'Main Hand',
  'Off Hand',
  'Ranged',
  'Relic',
]

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
  const shown = SLOT_ORDER.filter((slot) => slots.includes(slot))

  function renderSlot(slot: GearSlot) {
    const equipped = gear[slot]
    const displayName = getGearSlotDisplayName(slot, character.className, character.spec)
    const options = getItemsForSlotAndCharacter(slot, character.className, character.spec)
    // An empty slot is neither valid nor invalid — it is empty, and saying "Not valid for this spec"
    // about a slot nobody has filled reads as a fault in a character that was just created.
    const isValid = isEmptySlotItem(equipped.item) || options.some((option) => option.id === equipped.item.id)
    const enchant = equipped.enchantId ? getEnchantById(equipped.enchantId) : undefined

    const empty = isEmptySlotItem(equipped.item)

    return (
      <button type="button" className="gear-row" key={slot} aria-label={`${displayName} slot`} onClick={() => setOpenSlot(slot)}>
        <span className="gear-row-icon" aria-hidden="true">
          <ItemIcon wowItemId={equipped.item.wowItemId} fallback={slotGlyph(slot)} />
        </span>

        <span className="gear-row-slot">{displayName}</span>

        {/*
          Quality is the one colour this interface lets carry meaning, so it goes on the name and
          nowhere else. The cell used to repeat it as a hairline down the card's outer edge; a list
          has no outer edge to spare, and one signal for one fact is the rule this layout follows.
        */}
        <span
          className={`gear-row-item${empty ? ' gear-row-empty' : ''}`}
          style={empty ? undefined : { color: getQualityColor(equipped.item.quality) }}
        >
          {empty ? 'empty' : equipped.item.name}
        </span>

        <span className="gear-row-trail">
          {/* "No enchant" is not printed. An empty slot said it seventeen times over on a new
              character, which is the noise this list was made to remove; what is *there* is worth a
              line, what is missing is not. */}
          {enchant ? <span className="gear-row-enchant">{enchant.name}</span> : null}
          {equipped.item.sockets?.length ? (
            <span className="gear-gems" aria-hidden="true">
              {equipped.item.sockets.map((socket, index) => (
                <i
                  key={`${slot}-${socket}-${index}`}
                  className={`socket-dot socket-${socket.toLowerCase()} ${equipped.gemIds[index] ? 'socket-filled' : ''}`.trim()}
                />
              ))}
            </span>
          ) : null}
          {!isValid && <span className="stale-slot-warning">Not valid for this spec</span>}
        </span>
      </button>
    )
  }

  return (
    /*
      No heading of its own. The section tab above already says Gear, and the character strip names
      whose gear it is — a third "Gear" in the same column is a heading spent on something nobody was
      going to ask.
    */
    <section className="panel gear-panel" aria-label="Gear">
      {/* The row count is the panel's to know: a spec wears 16, 17 or 18 slots, and the two-column
          layout needs half of *this* character's list, not a constant that is wrong for two of them. */}
      <div className="gear-list" style={{ '--gear-rows': Math.ceil(shown.length / 2) } as React.CSSProperties}>
        {shown.map(renderSlot)}
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
