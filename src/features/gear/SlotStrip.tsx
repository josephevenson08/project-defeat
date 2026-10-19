import type { CSSProperties, Ref } from 'react'
import { wornItem } from '../../domain/bis'
import { getQualityColor } from '../../domain/gear/qualityColors'
import type { CharacterProfile } from '../character/characterTypes'
import { getGearSlotDisplayName } from './gearData'
import type { EquippedGear, GearSlot } from './gearTypes'
import { ItemIcon } from './ItemIcon'
import { slotGlyph } from './slotGlyphs'

type SlotStripProps = {
  character: CharacterProfile
  gear: EquippedGear
  slots: readonly GearSlot[]
  selected: GearSlot
  onSelect: (slot: GearSlot) => void
  /** Names the group for assistive tech: "Slot", "Slot to compare". */
  label: string
  /** Each button's test id is this and the slot: `ranked-slot-Head`. */
  testIdPrefix: string
  ref?: Ref<HTMLDivElement>
}

/**
 * The planner's slot picker, shared by Ranked Gear and Compare as the prototypes shared it: one
 * button per slot showing what you wear there, in its quality frame, or the slot's glyph when it is
 * empty. Each button carries `data-slot`, so a tab can hand focus back to it after Equip.
 */
export function SlotStrip({ character, gear, slots, selected, onSelect, label, testIdPrefix, ref }: SlotStripProps) {
  return (
    <div className="slot-strip" role="group" aria-label={label} ref={ref}>
      {slots.map((slot) => {
        const item = wornItem(gear, slot)
        const name = getGearSlotDisplayName(slot, character.className, character.spec)
        return (
          <button
            key={slot}
            type="button"
            className="slot-strip-button"
            aria-pressed={slot === selected}
            aria-label={item ? `${name}: ${item.name}` : `${name}, empty`}
            title={item ? `${name}: ${item.name}` : name}
            data-slot={slot}
            data-testid={`${testIdPrefix}-${slot}`}
            onClick={() => onSelect(slot)}
          >
            <span
              className={`slot-strip-icon${item ? '' : ' is-empty'}`}
              style={item ? ({ '--q': getQualityColor(item.quality) } as CSSProperties) : undefined}
              aria-hidden="true"
            >
              <ItemIcon wowItemId={item?.wowItemId} fallback={slotGlyph(slot)} />
            </span>
            <small aria-hidden="true">{slotGlyph(slot)}</small>
          </button>
        )
      })}
    </div>
  )
}
