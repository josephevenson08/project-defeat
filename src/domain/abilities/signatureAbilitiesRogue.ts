import type { SignatureAbility } from './abilityTypes'

export const rogueSignatureAbilities: readonly SignatureAbility[] = [
  {
    className: 'Rogue',
    spec: 'Assassination',
    name: 'Mutilate',
    spellId: 34413,
    requiredLevel: 70,
    effectType: 'Melee Special',
    castTimeSeconds: 0,
    gcdSeconds: 1.0,
    resource: { type: 'Energy', cost: 60 },
    scaling: {
      basis: 'weapon damage',
      weaponDamageMultiplier: 1,
      normalizedWeaponDamage: true,
      flatWeaponDamageBonus: 101,
      hitsBothWeapons: true,
      coefficientNotes:
        'Strikes with BOTH weapons: each hand deals its own normalized weapon damage plus 101, so the listed multiplier and flat bonus apply twice per cast. Damage is increased by 50% against a poisoned target, which in practice is always true with Deadly Poison up. Requires daggers.',
    },
    notes:
      'Mutilate is the 41-point Assassination talent and the spec\'s combo-point builder, awarding 2 points per cast and requiring the rogue to be behind the target. Assassination was not the Phase 1/2 raiding meta — Combat with swords was — so this spec matters more for completeness than for representative raid DPS. The two-weapon structure is the main modeling trap: naively applying `weaponDamageMultiplier` once will halve Mutilate\'s damage. Because the simulator currently models white damage only for physical specs, none of this is consumed yet.',
  },
  {
    className: 'Rogue',
    spec: 'Combat',
    name: 'Sinister Strike',
    spellId: 26862,
    rank: 10,
    requiredLevel: 70,
    effectType: 'Melee Special',
    castTimeSeconds: 0,
    gcdSeconds: 1.0,
    resource: { type: 'Energy', cost: 45, note: 'reduced to 42/40 by Improved Sinister Strike' },
    scaling: {
      basis: 'weapon damage',
      weaponDamageMultiplier: 1,
      normalizedWeaponDamage: true,
      flatWeaponDamageBonus: 98,
      coefficientNotes:
        '100% of NORMALIZED main-hand weapon damage plus a flat 98. Normalization values the swing at 2.4s for a one-hander regardless of the weapon\'s real speed, which is why Combat rogues do not gain from slow main-hands on their specials the way they do on white damage.',
    },
    notes:
      'Combat is the Phase 1/2 rogue raiding spec and Sinister Strike is its filler: spam it to build combo points, keep Slice and Dice up, and spend the rest on Rupture/Eviscerate. This is the cleanest single-ability fit of the three rogue specs. Note that a large share of Combat\'s damage comes from off-hand white swings and Blade Flurry/Adrenaline Rush windows rather than from Sinister Strike itself, and that the simulator currently models white damage only for physical specs, so these numbers are staged for later use.',
  },
  {
    className: 'Rogue',
    spec: 'Subtlety',
    name: 'Hemorrhage',
    spellId: 26864,
    rank: 4,
    requiredLevel: 70,
    effectType: 'Melee Special',
    castTimeSeconds: 0,
    gcdSeconds: 1.0,
    resource: { type: 'Energy', cost: 35 },
    scaling: {
      basis: 'weapon damage',
      weaponDamageMultiplier: 1.1,
      normalizedWeaponDamage: true,
      coefficientNotes:
        '110% of normalized main-hand weapon damage, rising by 1% per point of Sinister Calling. No flat damage bonus of its own.',
    },
    notes:
      'Hemorrhage is Subtlety\'s combo-point builder and the reason the spec is ever brought to a raid: it applies a debuff giving the target +42 physical damage taken for 10 charges or 15s, which any melee in the group consumes. Subtlety is the weakest rogue tree for personal DPS in TBC and the Hemorrhage build only holds up in earlier tiers, so a personal-DPS-only model will make Subtlety look worse than its raid value. Because the simulator currently models white damage only for physical specs, these numbers are staged for later use.',
  },
]
