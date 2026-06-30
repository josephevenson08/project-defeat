import type { CharacterRole } from '../character/characterTypes'
import type { StatBlock } from '../stats/statsTypes'
import type { SimulationBreakdownEntry, SimulationResult } from './simulationTypes'

function round(value: number) {
  return Math.round(value * 10) / 10
}

function totalBreakdown(entries: SimulationBreakdownEntry[]) {
  return round(entries.reduce((total, entry) => total + entry.value, 0))
}

export function calculateSimulation(stats: StatBlock, role: CharacterRole): SimulationResult {
  if (role === 'Caster DPS') {
    const breakdown = [
      { label: 'Spell power', value: stats.spellPower * 0.35 },
      { label: 'Spell crit', value: stats.spellCritRating * 1.3 },
      { label: 'Spell hit', value: stats.spellHitRating * 1.4 },
      { label: 'Spell haste', value: stats.spellHasteRating * 1.2 },
      { label: 'Intellect', value: stats.intellect * 0.1 },
    ]
    return {
      role,
      metricLabel: 'Estimated DPS',
      score: totalBreakdown(breakdown),
      summary: 'Prototype caster formula using spell power, spell hit, spell crit, spell haste, and intellect.',
      breakdown,
    }
  }

  if (role === 'Healer') {
    const breakdown = [
      { label: 'Healing power', value: stats.healingPower * 0.4 },
      { label: 'MP5', value: stats.mp5 * 2 },
      { label: 'Spirit', value: stats.spirit * 0.3 },
      { label: 'Spell crit', value: stats.spellCritRating * 0.8 },
      { label: 'Intellect', value: stats.intellect * 0.2 },
    ]
    return {
      role,
      metricLabel: 'Estimated Healing',
      score: totalBreakdown(breakdown),
      summary: 'Prototype healer formula using healing power, MP5, spirit, spell crit, and intellect.',
      breakdown,
    }
  }

  if (role === 'Tank') {
    const breakdown = [
      { label: 'Stamina', value: stats.stamina * 1.5 },
      { label: 'Armor', value: stats.armor * 0.04 },
      { label: 'Defense', value: stats.defenseRating * 1.2 },
      { label: 'Dodge', value: stats.dodgeRating * 1.1 },
      { label: 'Parry', value: stats.parryRating * 1.1 },
      { label: 'Block', value: stats.blockRating * 0.8 },
      { label: 'Block value', value: stats.blockValue * 0.5 },
    ]
    return {
      role,
      metricLabel: 'Survivability Score',
      score: totalBreakdown(breakdown),
      summary: 'Prototype tank formula using stamina, armor, defense, avoidance, and block value.',
      breakdown,
    }
  }

  const breakdown = [
    { label: 'Attack power', value: stats.attackPower * 0.35 },
    { label: 'Agility', value: stats.agility * 0.25 },
    { label: 'Crit', value: stats.critRating * 1.4 },
    { label: 'Hit', value: stats.hitRating * 1.2 },
    { label: 'Expertise', value: stats.expertiseRating * 1.1 },
  ]

  return {
    role,
    metricLabel: 'Estimated DPS',
    score: totalBreakdown(breakdown),
    summary: 'Prototype physical formula using attack power, agility, crit, hit, and expertise.',
    breakdown,
  }
}
