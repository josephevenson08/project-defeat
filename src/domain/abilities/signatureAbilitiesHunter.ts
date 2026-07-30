import type { SignatureAbility } from './abilityTypes'

/**
 * All three hunter specs share Steady Shot as their rotational button in TBC — the rotation is
 * "weave a Steady Shot between Auto Shots" regardless of tree, and the specs differ in what they
 * layer on top (pet damage, Multi-Shot usage, raid debuffs) rather than in which shot they spam.
 * Each entry's `notes` records the spec-specific difference instead of inventing distinct
 * signature abilities that TBC hunters did not actually build rotations around.
 */
const steadyShotBase = {
  name: 'Steady Shot',
  spellId: 34120,
  requiredLevel: 62,
  effectType: 'Ranged Special',
  castTimeSeconds: 1.5,
  gcdSeconds: 1.5,
  resource: { type: 'Mana', cost: 110 },
  baseAmount: { min: 150, max: 150 },
  scaling: {
    basis: 'attack power',
    attackPowerCoefficient: 0.2,
    weaponDamageMultiplier: 1,
    normalizedWeaponDamage: true,
    flatWeaponDamageBonus: 150,
    coefficientNotes:
      'Ranged attack power coefficient of 0.2, confirmed as an explicit override in TBC server data. The weapon portion is normalized to the 2.8s ranged-weapon speed, so a slow bow gains nothing on the shot itself. Spell power is irrelevant.',
  },
  needsVerification: true,
} as const

export const hunterSignatureAbilities: readonly SignatureAbility[] = [
  {
    ...steadyShotBase,
    className: 'Hunter',
    spec: 'Beast Mastery',
    notes:
      'Beast Mastery is the Phase 1/2 hunter meta spec, but its edge comes from the pet (The Beast Within, Bestial Wrath, Kill Command) rather than from a different shot — the player still weaves Steady Shot between Auto Shots. A large fraction of BM damage never passes through this ability at all, so treating Steady Shot as the whole rotation understates BM more than it does the other two trees. Cast-time caveat: sources disagree, with wowsims and every TBC class guide giving a 1.5s base cast while Wowhead\'s TBC database displays 1 sec; 1.5s is used here. The effective cast is further divided by ranged haste, and hunters famously gear so that it lines up 1:1 with the Auto Shot timer.',
  },
  {
    ...steadyShotBase,
    className: 'Hunter',
    spec: 'Marksmanship',
    notes:
      'Marksmanship also runs a Steady Shot rotation. Aimed Shot (rank 9, spell 27065, 370 mana, 2.5s cast, 6s cooldown, +870 ranged damage and a 50% healing debuff) is the hardest-hitting shot but its cast time makes it a DPS loss in sustained single-target, so it is used as an opener/pre-cast rather than a filler — wowsims models it as an instant pre-pull cast only. Multi-Shot replaces one Steady Shot whenever its 6s cooldown is up. Same 1.5s vs Wowhead-1s cast-time conflict as the other hunter specs.',
  },
  {
    ...steadyShotBase,
    className: 'Hunter',
    spec: 'Survival',
    notes:
      'Survival in Phase 1/2 is brought for raid utility — Expose Weakness feeding attack power to the whole melee group, plus trap and Wyvern Sting utility — rather than for personal DPS, and its own rotation is the same Steady Shot weave as the other two trees, supplemented by Multi-Shot and Explosive Trap. Modeling Survival on Steady Shot alone therefore captures its personal damage but none of the raid contribution that is the actual reason to bring the spec. Same 1.5s vs Wowhead-1s cast-time conflict as the other hunter specs.',
  },
]
