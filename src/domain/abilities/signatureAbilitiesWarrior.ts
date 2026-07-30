import type { SignatureAbility } from './abilityTypes'

export const warriorSignatureAbilities: readonly SignatureAbility[] = [
  {
    className: 'Warrior',
    spec: 'Arms',
    name: 'Mortal Strike',
    spellId: 30330,
    rank: 6,
    requiredLevel: 70,
    effectType: 'Melee Special',
    castTimeSeconds: 0,
    gcdSeconds: 1.5,
    cooldownSeconds: 6,
    resource: { type: 'Rage', cost: 30 },
    scaling: {
      basis: 'weapon damage',
      weaponDamageMultiplier: 1,
      normalizedWeaponDamage: true,
      flatWeaponDamageBonus: 210,
      coefficientNotes:
        '100% of NORMALIZED two-handed weapon damage plus a flat 210. Normalization values the swing at 3.3s for a two-hander regardless of the weapon\'s real speed, so an Arms warrior gains nothing on Mortal Strike from a slower weapon even though white damage still favours one.',
    },
    notes:
      'Mortal Strike is the 31-point Arms talent and the button the spec is named for, fired on its 6s cooldown alongside Whirlwind, Slam, Execute in the sub-20% phase, and Heroic Strike as a rage dump. Arms was primarily brought to Phase 1/2 raids for the Mortal Strike healing debuff and Blood Frenzy rather than for raw DPS, where Fury outperforms it. Because the simulator currently models white damage only for physical specs, these numbers are staged for later use.',
  },
  {
    className: 'Warrior',
    spec: 'Fury',
    name: 'Bloodthirst',
    spellId: 30335,
    rank: 6,
    requiredLevel: 70,
    effectType: 'Melee Special',
    castTimeSeconds: 0,
    gcdSeconds: 1.5,
    cooldownSeconds: 6,
    resource: { type: 'Rage', cost: 30 },
    scaling: {
      basis: 'attack power',
      attackPowerCoefficient: 0.45,
      coefficientNotes:
        'Pure attack power scaling: damage is exactly 45% of melee attack power, with NO weapon damage component and no flat base at all. This makes Bloodthirst unusual among melee specials and means it is the one ability here whose damage can be computed from a stat block alone, without knowing the equipped weapon.',
    },
    notes:
      'Fury is the Phase 1/2 warrior DPS spec and Bloodthirst is its highest-priority button, used on cooldown with Whirlwind, and Heroic Strike/Cleave dumping surplus rage between them. Because Bloodthirst ignores weapon damage entirely, dual-wielding fast weapons costs it nothing while maximising white swings and Flurry/Rampage uptime — which is why Fury gears the way it does. Note the simulator currently models white damage only for physical specs; Bloodthirst is the easiest special to layer on first, since it needs no weapon data.',
  },
  {
    className: 'Warrior',
    spec: 'Protection',
    name: 'Shield Slam',
    spellId: 30356,
    rank: 6,
    requiredLevel: 70,
    effectType: 'Melee Special',
    castTimeSeconds: 0,
    gcdSeconds: 1.5,
    cooldownSeconds: 6,
    resource: { type: 'Rage', cost: 20, note: 'reduced by 1 per point of Focused Rage' },
    baseAmount: { min: 420, max: 440 },
    scaling: {
      basis: 'none',
      coefficientNotes:
        'Neither weapon damage nor attack power: Shield Slam deals a flat 420-440 plus the warrior\'s shield block value, which is why Protection warriors stack block value for threat. It also carries a large flat threat bonus (+305) on top of the damage-derived threat.',
    },
    notes:
      'Shield Slam is the 31-point Protection talent and the top of the tanking threat priority, cast on its 6s cooldown ahead of Revenge and Devastate, with Heroic Strike as a rage dump and Sunder Armor/Thunder Clap for debuffs. As with the Protection Paladin entry, this is a cooldown rather than a filler — a model that casts it every GCD will overstate Protection warrior threat several-fold. The block-value dependency is the important modeling note: Shield Slam is the main reason a tank\'s shield choice affects threat output at all.',
  },
]
