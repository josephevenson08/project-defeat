import { Panel } from '../../components/layout/Panel'
import type { CharacterRole } from '../../domain/character/characterTypes'
import type { Buff } from '../../domain/buffs/buffTypes'
import { sampleBuffs } from '../../domain/buffs/sampleBuffs'
import type { BuildRole } from '../../domain/gear/itemTypes'
import type { Consumable, ConsumableCategory } from '../../domain/consumables/consumableTypes'
import { sampleConsumables } from '../../domain/consumables/sampleConsumables'
import type { CharacterProfile } from '../character/characterTypes'
import { getRoleForSpec } from '../character/characterData'

type BuffsPanelProps = {
  character: CharacterProfile
  activeBuffIds: readonly string[]
  activeConsumableIds: readonly string[]
  onToggleBuff: (id: string) => void
  onToggleConsumable: (id: string) => void
}

const flaskExclusiveCategories: readonly ConsumableCategory[] = ['Battle Elixir', 'Guardian Elixir']

function fitsRole(entry: { roles?: BuildRole[] }, role: CharacterRole) {
  return !entry.roles || entry.roles.includes(role)
}

function statSummary(stats: Buff['stats'] | Consumable['stats']) {
  if (!stats) return ''
  return Object.entries(stats)
    .map(([key, value]) => `+${value} ${key}`)
    .join(', ')
}

function multiplierSummary(multipliers: Buff['statMultipliers']) {
  if (!multipliers) return ''
  return Object.entries(multipliers)
    .map(([key, value]) => `+${Math.round((value ?? 0) * 100)}% ${key}`)
    .join(', ')
}

export function BuffsPanel({ character, activeBuffIds, activeConsumableIds, onToggleBuff, onToggleConsumable }: BuffsPanelProps) {
  const role = getRoleForSpec(character.className, character.spec)
  const buffs = sampleBuffs.filter((buff) => fitsRole(buff, role))
  const consumables = sampleConsumables.filter((consumable) => fitsRole(consumable, role))
  const consumablesByCategory = new Map<ConsumableCategory, Consumable[]>()
  consumables.forEach((consumable) => {
    const list = consumablesByCategory.get(consumable.category) ?? []
    list.push(consumable)
    consumablesByCategory.set(consumable.category, list)
  })

  const hasFlaskActive = consumables.some((consumable) => consumable.category === 'Flask' && activeConsumableIds.includes(consumable.id))

  function handleConsumableToggle(consumable: Consumable) {
    onToggleConsumable(consumable.id)
  }

  function isConsumableDisabled(consumable: Consumable) {
    if (activeConsumableIds.includes(consumable.id)) return false
    if (consumable.category === 'Flask') {
      return consumables.some(
        (other) => flaskExclusiveCategories.includes(other.category) && activeConsumableIds.includes(other.id),
      )
    }
    if (flaskExclusiveCategories.includes(consumable.category)) return hasFlaskActive
    return false
  }

  return (
    <Panel title="Buffs & Consumables" eyebrow="Raid setup" className="buffs-panel-shell">
      <div className="buffs-panel" data-testid="buffs-panel">
        <section className="buffs-group" aria-label="Raid buffs">
          <h3>Raid Buffs</h3>
          <div className="buffs-checkbox-list">
            {buffs.map((buff) => (
              <label className="buffs-checkbox-row" key={buff.id}>
                <input
                  type="checkbox"
                  checked={activeBuffIds.includes(buff.id)}
                  onChange={() => onToggleBuff(buff.id)}
                  data-testid={`buff-toggle-${buff.id}`}
                />
                <span>
                  <strong>{buff.name}</strong>
                  <small>
                    {buff.providedBy} · {[statSummary(buff.stats), multiplierSummary(buff.statMultipliers)].filter(Boolean).join(', ')}
                  </small>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="buffs-group" aria-label="Consumables">
          <h3>Consumables</h3>
          <p className="buffs-hint">A Flask occupies both elixir slots, so it can&apos;t be combined with a Battle or Guardian Elixir.</p>
          {(['Flask', 'Battle Elixir', 'Guardian Elixir', 'Food'] as const).map((category) => {
            const items = consumablesByCategory.get(category)
            if (!items || items.length === 0) return null

            return (
              <div className="buffs-consumable-category" key={category}>
                <h4>{category}</h4>
                <div className="buffs-checkbox-list">
                  {items.map((consumable) => (
                    <label className={`buffs-checkbox-row ${isConsumableDisabled(consumable) ? 'buffs-checkbox-row-disabled' : ''}`.trim()} key={consumable.id}>
                      <input
                        type="checkbox"
                        checked={activeConsumableIds.includes(consumable.id)}
                        disabled={isConsumableDisabled(consumable)}
                        onChange={() => handleConsumableToggle(consumable)}
                        data-testid={`consumable-toggle-${consumable.id}`}
                      />
                      <span>
                        <strong>{consumable.name}</strong>
                        <small>{statSummary(consumable.stats)}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </section>
      </div>
    </Panel>
  )
}
