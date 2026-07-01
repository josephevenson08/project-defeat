import { Panel } from '../../components/layout/Panel'
import { getEnchantsForSlot } from '../../domain/enchants/sampleEnchants'
import { sampleGems } from '../../domain/gems/sampleGems'
import { gearSlots, getItemsForSlot } from './gearData'
import type { EquippedGear, EquippedSlot, GearItem, GearSlot } from './gearTypes'

type GearPanelProps = {
  gear: EquippedGear
  onChange: (slot: GearSlot, equippedSlot: EquippedSlot) => void
}

export function GearPanel({ gear, onChange }: GearPanelProps) {
  function updateItem(slot: GearSlot, item: GearItem) {
    onChange(slot, { item, gemIds: item.sockets?.map(() => '') ?? [] })
  }

  function updateEnchant(slot: GearSlot, enchantId: string) {
    onChange(slot, { ...gear[slot], enchantId: enchantId || undefined })
  }

  function updateGem(slot: GearSlot, index: number, gemId: string) {
    const gemIds = [...gear[slot].gemIds]
    gemIds[index] = gemId
    onChange(slot, { ...gear[slot], gemIds })
  }

  return (
    <Panel title="Gear" eyebrow="TBC slot foundation">
      <div className="gear-list">
        {gearSlots.map((slot) => {
          const equipped = gear[slot]
          const enchants = getEnchantsForSlot(slot)

          return (
            <div className="gear-row" key={slot}>
              <label>
                <span>{slot}</span>
                <select
                  aria-label={slot}
                  value={equipped.item.id}
                  onChange={(event) => {
                    const nextItem = getItemsForSlot(slot).find((item) => item.id === event.target.value)
                    if (nextItem) updateItem(slot, nextItem)
                  }}
                >
                  {getItemsForSlot(slot).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <small>
                {equipped.item.quality} {equipped.item.source} item
                {equipped.item.phase ? ` · Phase ${equipped.item.phase}` : ''}
              </small>
              {enchants.length > 0 && (
                <label>
                  <span>Enchant</span>
                  <select aria-label={`${slot} enchant`} value={equipped.enchantId ?? ''} onChange={(event) => updateEnchant(slot, event.target.value)}>
                    <option value="">No enchant</option>
                    {enchants.map((enchant) => (
                      <option key={enchant.id} value={enchant.id}>
                        {enchant.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {equipped.item.sockets && (
                <div className="socket-list" aria-label={`${slot} sockets`}>
                  {equipped.item.sockets.map((socket, index) => (
                    <label key={`${slot}-${socket}-${index}`}>
                      <span>{socket} Socket</span>
                      <select
                        aria-label={`${slot} ${socket} socket`}
                        value={equipped.gemIds[index] ?? ''}
                        onChange={(event) => updateGem(slot, index, event.target.value)}
                      >
                        <option value="">No gem</option>
                        {sampleGems.map((gem) => (
                          <option key={gem.id} value={gem.id}>
                            {gem.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                  {equipped.item.socketBonus && <small>Socket bonus applies when gem colors match.</small>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
