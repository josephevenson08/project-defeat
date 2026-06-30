import { Panel } from '../../components/layout/Panel'
import { gearBySlot, gearSlots } from './gearData'
import type { EquippedGear, GearItem, GearSlot } from './gearTypes'

type GearPanelProps = {
  gear: EquippedGear
  onChange: (slot: GearSlot, item: GearItem) => void
}

export function GearPanel({ gear, onChange }: GearPanelProps) {
  return (
    <Panel title="Gear" eyebrow="Placeholder loadout">
      <div className="gear-list">
        {gearSlots.map((slot) => (
          <label className="gear-row" key={slot}>
            <span>{slot}</span>
            <select
              value={gear[slot].id}
              onChange={(event) => {
                const nextItem = gearBySlot[slot].find((item) => item.id === event.target.value)
                if (nextItem) onChange(slot, nextItem)
              }}
            >
              {gearBySlot[slot].map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <small>{gear[slot].source}</small>
          </label>
        ))}
      </div>
    </Panel>
  )
}
