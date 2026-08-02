import type { SignatureAbility } from './abilityTypes'

export const druidSignatureAbilities: readonly SignatureAbility[] = [
  {
    className: 'Druid',
    spec: 'Balance',
    name: 'Starfire',
    spellId: 26986,
    rank: 8,
    requiredLevel: 67,
    effectType: 'Direct Damage',
    castTimeSeconds: 3.5,
    gcdSeconds: 1.5,
    resource: { type: 'Mana', cost: 370 },
    baseAmount: { min: 550, max: 647 },
    scaling: {
      basis: 'castTime/3.5',
      spellPowerCoefficient: 1.0,
      coefficientNotes:
        '3.5s cast / 3.5 = 1.0, the maximum a direct nuke can reach in TBC. No exception applies.',
    },
    notes:
      'Balance is a Starfire-spam spec with Moonfire and Insect Swarm maintained alongside it, and Wrath (rank 10, spell 26985, 255 mana, 2.0s cast, 383-432, 0.5714 coefficient) used as a faster filler when Nature\'s Grace is up or mana is tight. Talents shorten the cast (Starlight Wrath, -0.1s per point, up to -0.5s) without reducing the coefficient, so the 3.5s figure here is the untalented base and a real Balance druid casts it at 3.0s.',
  },
  {
    className: 'Druid',
    spec: 'Feral',
    name: 'Shred',
    spellId: 27002,
    rank: 7,
    requiredLevel: 70,
    effectType: 'Melee Special',
    castTimeSeconds: 0,
    gcdSeconds: 1.0,
    resource: { type: 'Energy', cost: 60 },
    scaling: {
      basis: 'weapon damage',
      weaponDamageMultiplier: 2.25,
      normalizedWeaponDamage: false,
      flatWeaponDamageBonus: 405,
      coefficientNotes:
        'Deals 225% of un-normalized cat-form weapon damage plus a flat 405. Spell power is irrelevant. Cat form derives its weapon damage from the equipped weapon\'s DPS, not its damage range, so main-hand DPS is what matters for gearing.',
    },
    needsVerification: true,
    notes:
      'The app models Feral as a single physical-DPS spec with no bear/cat split, so this is the cat (DPS) side: Shred is the combo-point builder the cat rotation is built around, behind the target, with Mangle (Cat) (rank 3, spell 33983, 45 energy, 160% weapon damage + 264) maintained for its +30% Shred/bleed debuff and Rip/Ferocious Bite as finishers. Bear (tank) Feral is instead built on Mangle (Bear) (rank 3, spell 33987, 20 rage, 6s cooldown, 115% weapon damage + 155) — that variant is not represented anywhere in this data set. Cat form does NOT use the equipped weapon\'s damage: TBC substitutes a fixed internal weapon (43.5-66.5 at 1.0s speed) and every cat ability reads that instead. The simulator models this via `CAT_FORM_WEAPON`, so Shred no longer scales off damage dice the real ability never touches. The equipped weapon still matters, but only as a stat stick — Agility, Strength, and above all **Feral Attack Power**, which TBC puts on druid weapons as an explicit item stat added 1:1 into attack power. This catalog does not record Feral Attack Power on any item yet, so Feral weapon comparisons currently under-differentiate; that is a gap in the item data rather than in the damage model. Mangle (Cat) (45 energy, 160% weapon damage + 264) and Rake (spell 27003, 40 energy, 78 + 0.01xAP plus a 9s bleed) are both sourced and both computable from their fixed energy costs, and are the obvious next additions now that the weapon model underneath them is right. Rip and Ferocious Bite stay excluded for a different reason — both are combo-point finishers, and Ferocious Bite additionally spends all remaining energy, so neither has a rate derivable from a fixed cost. Tiger\'s Fury is a pure self-buff with no damage component, and Savage Roar does not exist in TBC at all. The needsVerification flag covers the bear/cat ambiguity, which is a modeling choice this project has not made.',
  },
  {
    className: 'Druid',
    spec: 'Restoration',
    name: 'Lifebloom',
    spellId: 33763,
    requiredLevel: 64,
    effectType: 'HoT',
    castTimeSeconds: 0,
    gcdSeconds: 1.5,
    resource: { type: 'Mana', cost: 220 },
    baseAmount: { min: 600, max: 600 },
    periodic: {
      durationSeconds: 7,
      tickIntervalSeconds: 1,
      ticks: 7,
      totalBaseAmount: 273,
      perTickBaseAmount: 39,
    },
    scaling: {
      basis: 'hardcoded exception',
      spellPowerCoefficient: 0.5194,
      spellPowerCoefficientPerTick: 0.0742,
      coefficientNotes:
        'Hardcoded exception with a split coefficient: the HoT portion carries 0.0742 per tick (0.5194 across the full 7s) and the 600 bloom carries a separate 0.3428. The generic duration/15 rule would have given 7/15 = 0.4667, so both halves are overrides.',
    },
    notes:
      'Restoration Druid healing is built on rolling Lifebloom stacks (up to 3 on a target, refreshed before the bloom fires) plus Rejuvenation (rank 13, spell 26982, 415 mana, 1060 over 12s, 0.8 total coefficient) and Regrowth (rank 10, spell 26980, 675 mana, 2.0s cast, 1253-1394 direct + 1274 over 21s). Lifebloom has only one rank in TBC. The `baseAmount` field holds the 600 bloom that fires when the stack expires or is dispelled; `periodic` holds the 273-over-7s HoT. The rolling-stack refresh mechanic means a single-cast model understates Lifebloom\'s real throughput considerably. Healing Touch (rank 13, spell 26979, 935 mana, 3.5s, 2715-3206, coefficient 1.0) is the better anchor if the simulator needs a plain cast-time heal instead.',
  },
]
