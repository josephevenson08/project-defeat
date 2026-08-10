import { Panel } from '../../components/layout/Panel'
import type { CharacterRole } from '../../domain/character/characterTypes'
import type { Buff, TargetDebuff } from '../../domain/buffs/buffTypes'
import { modelledBuffs, unmodelledBuffs } from '../../domain/buffs/sampleBuffs'
import { statLabels } from '../../domain/stats/statTypes'
import { describeStats } from '../../domain/stats/describeStats'
import { sampleTargetDebuffs } from '../../domain/buffs/sampleTargetDebuffs'
import type { BuildRole } from '../../domain/gear/itemTypes'
import type { Consumable, ConsumableCategory } from '../../domain/consumables/consumableTypes'
import { sampleConsumables } from '../../domain/consumables/sampleConsumables'
import type { CharacterProfile } from '../character/characterTypes'
import { getRoleForSpec } from '../character/characterData'

type BuffsPanelProps = {
  character: CharacterProfile
  activeBuffIds: readonly string[]
  activeConsumableIds: readonly string[]
  activeTargetDebuffIds: readonly string[]
  onToggleBuff: (id: string) => void
  onToggleConsumable: (id: string) => void
  onToggleTargetDebuff: (id: string) => void
}

const flaskExclusiveCategories: readonly ConsumableCategory[] = ['Battle Elixir', 'Guardian Elixir']

function fitsRole(entry: { roles?: BuildRole[] }, role: CharacterRole) {
  return !entry.roles || entry.roles.includes(role)
}

const statLabelsByKey = new Map<string, string>(statLabels)

/** Shared with the gear popup — see `describeStats`, which is where the rounding is explained. */
const statSummary = describeStats

/** A negative contribution is real, and must not read "+-10". */
function signed(value: number) {
  return value < 0 ? String(value) : `+${value}`
}

function multiplierSummary(multipliers: Buff['statMultipliers']) {
  if (!multipliers) return ''
  return Object.entries(multipliers)
    .map(([key, value]) => `${signed(Math.round((value ?? 0) * 100))}% ${statLabelsByKey.get(key) ?? key}`)
    .join(', ')
}

function targetDebuffSummary(debuff: TargetDebuff) {
  const parts: string[] = []
  if (debuff.armorReductionPercent) parts.push(`-${Math.round(debuff.armorReductionPercent * 100)}% target armor`)
  if (debuff.physicalCritTakenBonus) parts.push(`+${Math.round(debuff.physicalCritTakenBonus * 100)}% physical crit taken`)
  if (debuff.spellCritTakenBonus) parts.push(`+${Math.round(debuff.spellCritTakenBonus * 100)}% spell crit taken`)
  if (debuff.spellDamageTakenMultiplier) parts.push(`+${Math.round(debuff.spellDamageTakenMultiplier * 100)}% spell damage taken`)
  return parts.join(', ')
}

export function BuffsPanel({
  character,
  activeBuffIds,
  activeConsumableIds,
  activeTargetDebuffIds,
  onToggleBuff,
  onToggleConsumable,
  onToggleTargetDebuff,
}: BuffsPanelProps) {
  const role = getRoleForSpec(character.className, character.spec)
  const buffs = modelledBuffs.filter((buff) => fitsRole(buff, role))
  const unmodelled = unmodelledBuffs.filter((buff) => fitsRole(buff, role))
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

        {unmodelled.length > 0 && (
          <section className="buffs-group" aria-label="Raid buffs not modelled">
            <h3>Present in a Raid, Not Modelled</h3>
            <p className="buffs-hint">
              Real Phase 2 raid buffs whose effect has nowhere to go in this app&apos;s stat model — threat, maximum health,
              resistances, damage multipliers, weapon procs and timed cooldowns. They have no checkbox because ticking one
              would change nothing. Listed so the gap is visible rather than silent.
            </p>
            <div className="buffs-checkbox-list">
              {unmodelled.map((buff) => (
                <div className="buffs-checkbox-row buffs-checkbox-row-static" key={buff.id} data-testid={`buff-unmodelled-${buff.id}`}>
                  <span>
                    <strong>{buff.name}</strong>
                    <small>
                      {buff.providedBy} · {buff.notModelled}
                    </small>
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

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

        <section className="buffs-group" aria-label="Target debuffs">
          <h3>Target Debuffs</h3>
          <p className="buffs-hint">Raid debuffs applied to the simulated target, feeding the Simulation panel's armor/crit/spell-damage math.</p>
          <div className="buffs-checkbox-list">
            {sampleTargetDebuffs.map((debuff) => (
              <label className="buffs-checkbox-row" key={debuff.id}>
                <input
                  type="checkbox"
                  checked={activeTargetDebuffIds.includes(debuff.id)}
                  onChange={() => onToggleTargetDebuff(debuff.id)}
                  data-testid={`target-debuff-toggle-${debuff.id}`}
                />
                <span>
                  <strong>{debuff.name}</strong>
                  <small>
                    {debuff.providedBy} · {targetDebuffSummary(debuff)}
                  </small>
                </span>
              </label>
            ))}
          </div>
        </section>
      </div>
    </Panel>
  )
}
