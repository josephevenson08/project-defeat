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
      'Mortal Strike is the 31-point Arms talent and the button the spec is named for, fired on its 6s cooldown alongside Whirlwind, Slam, Execute in the sub-20% phase, and Heroic Strike as a rage dump. Arms was primarily brought to Phase 1/2 raids for the Mortal Strike healing debuff and Blood Frenzy rather than for raw DPS, where Fury outperforms it. Because the simulator now layers computable specials on top of white damage, these numbers are in use.',
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
      'Fury is the Phase 1/2 warrior DPS spec and Bloodthirst is its highest-priority button, used on cooldown with Whirlwind, and Heroic Strike/Cleave dumping surplus rage between them. Because Bloodthirst ignores weapon damage entirely, dual-wielding fast weapons costs it nothing while maximising white swings and Flurry/Rampage uptime — which is why Fury gears the way it does. Note the simulator now layers computable specials on top of white damage; Bloodthirst is the easiest special to layer on first, since it needs no weapon data.',
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

  // Whirlwind is shared by both DPS specs, so it appears once per spec. These sit after the
  // signature entries above because `getSignatureAbility` returns the FIRST match for a class/spec —
  // moving them earlier would silently change which ability the headline estimate is built around.
  {
    className: 'Warrior',
    spec: 'Fury',
    name: 'Whirlwind',
    spellId: 1680,
    effectType: 'Melee Special',
    castTimeSeconds: 0,
    gcdSeconds: 1.5,
    cooldownSeconds: 10,
    resource: { type: 'Rage', cost: 25 },
    scaling: {
      basis: 'weapon damage',
      weaponDamageMultiplier: 1,
      normalizedWeaponDamage: true,
      hitsBothWeapons: true,
      coefficientNotes:
        '100% of normalized weapon damage with no flat bonus and no attack power coefficient of its own. Strikes with both weapons when dual-wielding, and the off-hand strike carries the standard off-hand penalty rather than mirroring the main hand. Whirlwind also hits up to 4 targets, but this project models a single target, so the AoE component contributes nothing here.',
    },
    needsVerification: true,
    notes:
      'Second button in the Fury priority behind Bloodthirst, pressed on its 10s cooldown. `rank` and `requiredLevel` are deliberately omitted rather than guessed: Wowhead\'s tooltip pages returned JavaScript shells with no rank data, and wowsims does not track ranks at all, only level-70 spell IDs. Flagged needsVerification for that reason — the cooldown, rage cost and scaling are cross-checked between Wowhead and wowsims, but the rank metadata is unsourced.',
  },
  {
    className: 'Warrior',
    spec: 'Arms',
    name: 'Whirlwind',
    spellId: 1680,
    effectType: 'Melee Special',
    castTimeSeconds: 0,
    gcdSeconds: 1.5,
    cooldownSeconds: 10,
    resource: { type: 'Rage', cost: 25 },
    scaling: {
      basis: 'weapon damage',
      weaponDamageMultiplier: 1,
      normalizedWeaponDamage: true,
      hitsBothWeapons: true,
      coefficientNotes:
        'Identical to the Fury entry — the ability does not differ by spec. An Arms warrior wields a two-hander, so `hitsBothWeapons` has no effect there: there is no off-hand weapon to strike with, and the flag is simply inert rather than wrong.',
    },
    needsVerification: true,
    notes:
      'Pressed on its 10s cooldown alongside Mortal Strike. Same unsourced `rank`/`requiredLevel` caveat as the Fury entry.',
  },

  /*
   * Heroic Strike, last in both DPS priorities because it is a rage *dump*: it is what surplus rage
   * is spent on once the cooldowns are covered, not something pressed for its own sake.
   *
   * Everything below is read off wowsims/tbc `sim/warrior/heroic_strike_cleave.go` at 3301fca5:
   * `cost := 15.0 - ImprovedHeroicStrike - FocusedRage`, and
   * `BaseDamageConfigMeleeWeapon(core.MainHand, false, 176, 1, true)` — main hand, **not**
   * normalized, +176 flat, 1x multiplier. Its ProcMask carries `ProcMaskMeleeMHSpecial`, which is
   * what the rage aura checks to decide a swing generates nothing.
   *
   * The two flags matter more than the numbers. Heroic Strike triggers no GCD, so it does not
   * compete with Bloodthirst and Whirlwind for buttons; and it replaces the main-hand swing rather
   * than landing beside it, so counting its full damage as additional damage roughly doubles what it
   * is actually worth.
   */
  {
    className: 'Warrior',
    spec: 'Fury',
    name: 'Heroic Strike',
    spellId: 29707,
    effectType: 'Melee Special',
    castTimeSeconds: 0,
    gcdSeconds: 1.5,
    offGlobalCooldown: true,
    replacesMainHandSwing: true,
    resource: { type: 'Rage', cost: 15, note: 'reduced by 1 per point of Improved Heroic Strike and of Focused Rage' },
    scaling: {
      basis: 'weapon damage',
      weaponDamageMultiplier: 1,
      normalizedWeaponDamage: false,
      flatWeaponDamageBonus: 176,
      coefficientNotes:
        'Full main-hand swing damage plus a flat 176, and deliberately NOT normalized — wowsims passes `false` for the normalize argument, so unlike Whirlwind a slow weapon does keep its advantage here. Single-hand only: the off-hand does not strike, so `hitsBothWeapons` is absent rather than false-y by accident.',
    },
    needsVerification: true,
    notes:
      'The rage dump both DPS specs press between cooldowns, and the reason a rage model was worth building — before one existed this ability contributed nothing at all. Because it replaces the main-hand auto attack, its real value is the gap between a Heroic Strike and the swing it displaced, which also means it trades away that swing\'s rage. `rank` and `requiredLevel` are omitted rather than guessed, the same caveat the Whirlwind entries carry: wowsims tracks only level-70 spell IDs and does not record ranks.',
  },
  {
    className: 'Warrior',
    spec: 'Arms',
    name: 'Heroic Strike',
    spellId: 29707,
    effectType: 'Melee Special',
    castTimeSeconds: 0,
    gcdSeconds: 1.5,
    offGlobalCooldown: true,
    replacesMainHandSwing: true,
    resource: { type: 'Rage', cost: 15, note: 'reduced by 1 per point of Improved Heroic Strike and of Focused Rage' },
    scaling: {
      basis: 'weapon damage',
      weaponDamageMultiplier: 1,
      normalizedWeaponDamage: false,
      flatWeaponDamageBonus: 176,
      coefficientNotes:
        'Identical to the Fury entry — the ability does not differ by spec. It is worth more to Arms in practice, because a two-hander\'s slower, larger swing is what the unnormalized weapon-damage portion multiplies.',
    },
    needsVerification: true,
    notes:
      'Same ability and same caveats as the Fury entry. Protection also presses Heroic Strike as a threat dump, but the tank path scores survivability rather than damage and never reads the rotation, so an entry there would be data nothing consumes.',
  },
]
