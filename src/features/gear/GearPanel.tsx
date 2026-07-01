import { Panel } from '../../components/layout/Panel'
import { getEnchantsForSlot } from '../../domain/enchants/sampleEnchants'
import { sampleGems } from '../../domain/gems/sampleGems'
import type { CharacterProfile } from '../character/characterTypes'
import { getGearSlotDisplayName, getItemsForSlotAndCharacter, getVisibleGearSlotsForSpec, isItemBlockedByUniqueInGear } from './gearData'
import type { EquippedGear, EquippedSlot, GearItem, GearSlot } from './gearTypes'

type GearPanelProps = {
  character: CharacterProfile
  gear: EquippedGear
  onChange: (slot: GearSlot, equippedSlot: EquippedSlot) => void
}

export function GearPanel({ character, gear, onChange }: GearPanelProps) {
  function updateItem(slot: GearSlot, item: GearItem) {
    if (isItemBlockedByUniqueInGear(item, slot, gear)) return
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
        {getVisibleGearSlotsForSpec(character.className, character.spec).map((slot) => {
          const equipped = gear[slot]
          const enchants = getEnchantsForSlot(slot, character, equipped.item)
          const slotItems = getItemsForSlotAndCharacter(slot, character.className, character.spec)
          const displayName = getGearSlotDisplayName(slot, character.className, character.spec)

          return (
            <div className="gear-row" key={slot}>
              <label>
                <span>{displayName}</span>
                <select
                  aria-label={displayName}
                  value={equipped.item.id}
                  disabled={slotItems.length === 0}
                  onChange={(event) => {
                    const nextItem = slotItems.find((item) => item.id === event.target.value)
                    if (nextItem) updateItem(slot, nextItem)
                  }}
                >
                  {slotItems.length > 0 ? (
                    slotItems.map((item) => (
                      <option key={item.id} value={item.id} disabled={isItemBlockedByUniqueInGear(item, slot, gear)}>
                        {item.name}
                      </option>
                    ))
                  ) : (
                    <option>No relevant item options</option>
                  )}
                </select>
              </label>
              <small>
                {equipped.item.quality} {equipped.item.source} item
                {equipped.item.phase ? ` · Phase ${equipped.item.phase}` : ''}
              </small>
              {enchants.length > 0 && (
                <label>
                  <span>Enchant</span>
                  <select aria-label={`${displayName} enchant`} value={equipped.enchantId ?? ''} onChange={(event) => updateEnchant(slot, event.target.value)}>
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
                <div className="socket-list" aria-label={`${displayName} sockets`}>
                  {equipped.item.sockets.map((socket, index) => (
                    <label key={`${slot}-${socket}-${index}`}>
                      <span>{socket} Socket</span>
                      <select
                        aria-label={`${displayName} ${socket} socket`}
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
