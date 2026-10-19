import type { ProvenanceSource } from '../../components/ui/Provenance'
import type { Buff, TargetDebuff } from '../../domain/buffs/buffTypes'
import type { BuffEntry } from '../../domain/buffs/raidBuffs'
import type { Consumable } from '../../domain/consumables/consumableTypes'
import type { BuffReach } from '../../domain/raidcomp'
import { describeStats } from '../../domain/stats/describeStats'
import { statLabels } from '../../domain/stats/statTypes'

const statLabelsByKey = new Map<string, string>(statLabels)
const percent = (value: number) => `${Math.round(value * 1000) / 10}%`
const signedPercent = (value: number) => `${value < 0 ? '−' : '+'}${percent(Math.abs(value))}`

/** "+10% Strength, Agility, Stamina, Intellect and Spirit": a buff's multipliers, one phrase per value. */
function multipliers(values: Partial<Record<string, number>> | undefined) {
  const byValue = new Map<number, string[]>()
  for (const [key, value] of Object.entries(values ?? {})) {
    if (!value) continue
    byValue.set(value, [...(byValue.get(value) ?? []), statLabelsByKey.get(key) ?? key])
  }
  return [...byValue].map(([value, names]) => `${signedPercent(value)} ${names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0]}`)
}

/** What a buff does, as the stat model counts it: "+306 Attack Power", "+10% Attack Power", "+30% haste…". */
export function buffEffects(buff: Buff): string[] {
  return [
    describeStats(buff.stats),
    ...multipliers(buff.statMultipliers),
    ...multipliers(buff.statMultipliersAfterConversion),
    buff.hastePercent ? `${signedPercent(buff.hastePercent)} haste` : '',
    buff.damageMultiplier ? `${signedPercent(buff.damageMultiplier)} damage` : '',
  ].filter(Boolean)
}

/** What a boss debuff does: flat armor, never a percentage, as every TBC armor debuff is. */
export function debuffEffects(debuff: TargetDebuff): string[] {
  return [
    debuff.armorReduction ? `−${debuff.armorReduction.toLocaleString('en-US')} armor on the boss` : '',
    debuff.physicalCritTakenBonus ? `+${percent(debuff.physicalCritTakenBonus)} physical crit taken` : '',
    debuff.physicalHitTakenBonus ? `+${percent(debuff.physicalHitTakenBonus)} melee and ranged hit taken` : '',
    debuff.spellCritTakenBonus ? `+${percent(debuff.spellCritTakenBonus)} spell crit taken` : '',
    debuff.spellDamageTakenMultiplier ? `+${percent(debuff.spellDamageTakenMultiplier)} spell damage taken` : '',
  ].filter(Boolean)
}

export const entryEffects = (item: BuffEntry) => (item.kind === 'buff' ? buffEffects(item.entry) : debuffEffects(item.entry))

/** A consumable's stats, or that it has none the planner counts. */
export const consumableEffects = (consumable: Consumable) => describeStats(consumable.stats) || 'No stats the planner counts'

/** How far a buff reaches, as the tooltip's grey line says it. */
export const REACH_WORDS: Record<BuffReach, string> = {
  Party: 'Your group',
  'Any group': 'Any group (cast once per group)',
  Raid: 'The whole raid',
  Single: 'One player',
  Boss: 'On the boss',
}

/** Where the Buffs tab's numbers come from, for the line under the top bar. */
export const buffsSources: readonly ProvenanceSource[] = [
  { name: 'each buff and debuff from the spell rank its numbers were read from (Wowhead)' },
  { name: "who reaches whom from each spell's Wowhead tooltip" },
  { name: 'the example raids from Raid Composition' },
]
