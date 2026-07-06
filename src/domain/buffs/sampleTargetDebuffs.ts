import type { TargetDebuff } from './buffTypes'

export const sampleTargetDebuffs: readonly TargetDebuff[] = [
  {
    id: 'sunder-armor',
    name: 'Sunder Armor',
    providedBy: 'Warrior',
    armorReductionPercent: 0.2,
    needsVerification: true,
    notes: 'Approximates the 5-stack armor reduction as a flat percentage rather than modeling per-stack flat armor values.',
  },
  {
    id: 'curse-of-recklessness',
    name: 'Curse of Recklessness',
    providedBy: 'Warlock',
    armorReductionPercent: 0.08,
    needsVerification: true,
    notes: 'Single-application armor reduction; approximate pending final Wowhead audit. Not stacked with Sunder Armor in this model.',
  },
  {
    id: 'faerie-fire',
    name: 'Faerie Fire',
    providedBy: 'Druid',
    armorReductionPercent: 0.05,
    needsVerification: true,
    notes: 'Approximate pending final Wowhead audit; real TBC Faerie Fire stacks additively with Sunder Armor rather than multiplicatively.',
  },
  {
    id: 'improved-seal-of-the-crusader',
    name: 'Improved Seal of the Crusader',
    providedBy: 'Paladin',
    physicalCritTakenBonus: 0.03,
    needsVerification: true,
    notes: 'Approximate pending final Wowhead audit.',
  },
  {
    id: 'curse-of-elements',
    name: 'Curse of the Elements',
    providedBy: 'Warlock',
    spellDamageTakenMultiplier: 0.1,
    needsVerification: true,
    notes: 'Approximate pending final Wowhead audit.',
  },
]

export function getTargetDebuffById(id: string) {
  return sampleTargetDebuffs.find((debuff) => debuff.id === id)
}
