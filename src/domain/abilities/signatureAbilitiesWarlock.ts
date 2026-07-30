import type { SignatureAbility } from './abilityTypes'

export const warlockSignatureAbilities: readonly SignatureAbility[] = [
  {
    className: 'Warlock',
    spec: 'Affliction',
    name: 'Unstable Affliction',
    spellId: 30405,
    rank: 3,
    requiredLevel: 70,
    effectType: 'DoT',
    castTimeSeconds: 1.5,
    gcdSeconds: 1.5,
    resource: { type: 'Mana', cost: 400 },
    periodic: {
      durationSeconds: 18,
      tickIntervalSeconds: 3,
      ticks: 6,
      totalBaseAmount: 1050,
      perTickBaseAmount: 175,
    },
    scaling: {
      basis: 'duration/15',
      spellPowerCoefficient: 1.2,
      spellPowerCoefficientPerTick: 0.2,
      coefficientNotes:
        'The plain periodic rule: 18s duration / 15 = 1.2 across the full DoT, split evenly into 0.2 per tick over 6 ticks. No exception — Unstable Affliction is a clean worked example of how DoTs longer than 15s exceed a 1.0 coefficient.',
    },
    notes:
      'Unstable Affliction is the 41-point Affliction talent and the spell that defines the spec, but Affliction is a multi-DoT spec rather than a single-ability one: the real Phase 1/2 rotation maintains Unstable Affliction, Corruption, Curse of Agony (or Curse of Doom), Siphon Life and Immolate, and fills the gaps with Shadow Bolt (rank 11, spell 27209, 420 mana, 3.0s cast, 544-607, coefficient 0.8571). If the simulator needs a plain cast-time nuke anchor rather than a DoT, Shadow Bolt is the correct substitute — a DoT-only model will understate Affliction, and a Shadow-Bolt-only model will understate it differently.',
  },
  {
    className: 'Warlock',
    spec: 'Demonology',
    name: 'Shadow Bolt',
    spellId: 27209,
    rank: 11,
    requiredLevel: 69,
    effectType: 'Direct Damage',
    castTimeSeconds: 3.0,
    gcdSeconds: 1.5,
    resource: { type: 'Mana', cost: 420 },
    baseAmount: { min: 544, max: 607 },
    scaling: {
      basis: 'castTime/3.5',
      spellPowerCoefficient: 0.8571,
      coefficientNotes:
        '3.0s cast / 3.5 = 0.8571. Stored as an explicit override in TBC spell data but the value matches the formula exactly. Shadow and Flame adds up to +0.20 on top, taking a talented Shadow Bolt to 1.057 — one of the few talents in TBC that raises a coefficient rather than just a damage multiplier.',
    },
    notes:
      'Demonology has no signature nuke of its own — the Phase 1/2 build is roughly 43 points in Demonology for Felguard plus 18 in Destruction for Ruin, and the playstyle is Shadow Bolt spam while keeping the Felguard alive and on target. What distinguishes the spec is that a large share of its damage comes from the pet, which keeps attacking during phases where the warlock cannot cast (Gruul, Magtheridon); none of that pet damage is represented by this ability. Affliction and Demonology therefore share Shadow Bolt as their filler, and it is recorded here as the Demonology signature precisely because Demonology has nothing more specific to point at.',
  },
  {
    className: 'Warlock',
    spec: 'Destruction',
    name: 'Incinerate',
    spellId: 32231,
    rank: 2,
    requiredLevel: 70,
    effectType: 'Direct Damage',
    castTimeSeconds: 2.5,
    gcdSeconds: 1.5,
    resource: { type: 'Mana', cost: 355 },
    baseAmount: { min: 444, max: 514 },
    scaling: {
      basis: 'castTime/3.5',
      spellPowerCoefficient: 0.7143,
      coefficientNotes:
        '2.5s cast / 3.5 = 0.7143, with no exception. Shadow and Flame adds up to +0.20 as it does for Shadow Bolt. The bonus damage against an Immolate target is a flat 111-128 and carries no additional coefficient.',
    },
    needsVerification: true,
    notes:
      'Incinerate is new in TBC and is the fire-themed Destruction filler, dealing an extra 111-128 when the target has Immolate on it — so the real rotation is Immolate maintained, Incinerate as filler, Conflagrate optional. The choice between Incinerate and Shadow Bolt as the Destruction signature is genuinely contested: many Phase 1/2 Destruction warlocks ran a shadow-damage build and spammed Shadow Bolt instead, because gear itemization and raid debuffs (Improved Shadow Bolt, Curse of Shadow) favoured shadow over fire in early TBC. Flagged for that reason — the numbers are solid, the choice of spell is the uncertain part. Shadow Bolt (rank 11, spell 27209, 3.0s, 544-607, coefficient 0.8571) is the alternative if a shadow-build Destruction model is wanted.',
  },
]
