export type StatBlock = {
  strength: number
  agility: number
  stamina: number
  intellect: number
  spirit: number
  attackPower: number
  rangedAttackPower: number
  spellPower: number
  healingPower: number
  hitRating: number
  spellHitRating: number
  critRating: number
  spellCritRating: number
  hasteRating: number
  spellHasteRating: number
  expertiseRating: number
  armorPenetration: number
  defenseRating: number
  dodgeRating: number
  parryRating: number
  blockRating: number
  blockValue: number
  resilienceRating: number
  armor: number
  mp5: number
}

export const emptyStats: StatBlock = {
  strength: 0,
  agility: 0,
  stamina: 0,
  intellect: 0,
  spirit: 0,
  attackPower: 0,
  rangedAttackPower: 0,
  spellPower: 0,
  healingPower: 0,
  hitRating: 0,
  spellHitRating: 0,
  critRating: 0,
  spellCritRating: 0,
  hasteRating: 0,
  spellHasteRating: 0,
  expertiseRating: 0,
  armorPenetration: 0,
  defenseRating: 0,
  dodgeRating: 0,
  parryRating: 0,
  blockRating: 0,
  blockValue: 0,
  resilienceRating: 0,
  armor: 0,
  mp5: 0,
}

export const statLabels: Array<[keyof StatBlock, string]> = [
  ['strength', 'Strength'],
  ['agility', 'Agility'],
  ['stamina', 'Stamina'],
  ['intellect', 'Intellect'],
  ['spirit', 'Spirit'],
  ['attackPower', 'Attack Power'],
  ['rangedAttackPower', 'Ranged AP'],
  ['spellPower', 'Spell Power'],
  ['healingPower', 'Healing Power'],
  ['hitRating', 'Hit Rating'],
  ['spellHitRating', 'Spell Hit'],
  ['critRating', 'Crit Rating'],
  ['spellCritRating', 'Spell Crit'],
  ['hasteRating', 'Haste Rating'],
  ['spellHasteRating', 'Spell Haste'],
  ['expertiseRating', 'Expertise'],
  ['armorPenetration', 'Armor Pen'],
  ['defenseRating', 'Defense'],
  ['dodgeRating', 'Dodge'],
  ['parryRating', 'Parry'],
  ['blockRating', 'Block'],
  ['blockValue', 'Block Value'],
  ['resilienceRating', 'Resilience'],
  ['armor', 'Armor'],
  ['mp5', 'MP5'],
]
