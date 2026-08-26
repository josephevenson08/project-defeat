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
  },  {
    className: 'Warlock',
    spec: 'Affliction',
    name: 'Corruption',
    spellId: 27216,
    rank: 8,
    requiredLevel: 65,
    effectType: 'DoT',
    /*
     * Instant, not the 2s the tooltip shows. Improved Corruption 5/5 removes the whole cast time
     * (400ms per rank upstream) and no Affliction build skips it, so 2s would model a warlock nobody
     * plays. Stated here rather than left to look like an error.
     */
    castTimeSeconds: 0,
    gcdSeconds: 1.5,
    resource: { type: 'Mana', cost: 370 },
    periodic: {
      durationSeconds: 18,
      tickIntervalSeconds: 3,
      ticks: 6,
      totalBaseAmount: 900,
      perTickBaseAmount: 150,
    },
    scaling: {
      basis: 'hardcoded exception',
      spellPowerCoefficient: 0.936,
      spellPowerCoefficientPerTick: 0.156,
      coefficientNotes:
        'Upstream: `core.BaseDamageConfigMagicNoRoll(900/6, 0.156)`. 0.156 per tick over 6 ticks is 0.936 total, which is short of the 1.2 the plain duration/15 rule would give an 18s DoT — Corruption is one of the coefficients TBC overrides rather than derives, which is why the basis is the exception rather than the formula.',
    },
    notes:
      'The second DoT of the Affliction rotation and the one with the highest damage per global. Empowered Corruption adds a further (0.12 x rank)/6 per tick upstream; that talent is not ingested, so this is the untalented coefficient.',
  },
  {
    className: 'Warlock',
    spec: 'Affliction',
    name: 'Curse of Agony',
    spellId: 27218,
    rank: 7,
    requiredLevel: 67,
    effectType: 'DoT',
    castTimeSeconds: 0,
    gcdSeconds: 1.5,
    resource: { type: 'Mana', cost: 265 },
    periodic: {
      durationSeconds: 24,
      tickIntervalSeconds: 2,
      ticks: 12,
      totalBaseAmount: 1356,
      perTickBaseAmount: 113,
    },
    scaling: {
      basis: 'hardcoded exception',
      spellPowerCoefficient: 1.2,
      spellPowerCoefficientPerTick: 0.1,
      coefficientNotes:
        'Upstream: `core.BaseDamageConfigMagicNoRoll(baseDmg, 0.1)`. 0.1 per tick over 12 ticks is 1.2 total, well short of the 1.6 a 24s duration would earn under duration/15 — the long-DoT penalty TBC applies to Curse of Agony specifically.',
    },
    notes:
      "The tooltip's \"dealt slowly at first, and builds up\" ramp is real but not modelled: the total over the full duration is what matters to a sustained estimate, and this app has no timeline to spend the ramp on. Only one Curse per Warlock can be active, so this competes with Curse of the Elements — a raid running that debuff gives it to a different Warlock.",
  },
  {
    className: 'Warlock',
    spec: 'Affliction',
    name: 'Siphon Life',
    spellId: 30911,
    rank: 6,
    requiredLevel: 70,
    effectType: 'DoT',
    castTimeSeconds: 0,
    gcdSeconds: 1.5,
    resource: { type: 'Mana', cost: 410 },
    periodic: {
      durationSeconds: 30,
      tickIntervalSeconds: 3,
      ticks: 10,
      totalBaseAmount: 630,
      perTickBaseAmount: 63,
    },
    scaling: {
      basis: 'hardcoded exception',
      spellPowerCoefficient: 1.0,
      spellPowerCoefficientPerTick: 0.1,
      coefficientNotes:
        'Upstream: `core.BaseDamageConfigMagicNoRoll(63, 0.1)`. 0.1 per tick over 10 ticks is 1.0, against the 2.0 duration/15 would give a 30s DoT — the steepest of the three penalties here, and the reason Siphon Life is the weakest global of the rotation.',
    },
    notes:
      'The healing half is not modelled and is not a DPS matter: the tooltip transfers the damage as health to the Warlock, which keeps them alive rather than raising output. Cheapest DoT per global by damage, and the first one dropped on a short fight.',
  },
  {
    className: 'Warlock',
    spec: 'Affliction',
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
        '3.0s cast / 3.5 = 0.8571, the plain direct-damage rule with no exception. These numbers were already recorded in the Unstable Affliction note as the correct filler; this entry is that note becoming data.',
    },
    notes:
      'The filler, and the only ability here that is not a DoT. It fills whatever globals the DoTs leave, which is what makes an Affliction estimate a rotation rather than a sum — without it the spec idles between refreshes and reads far too low.',
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
  },  {
    className: 'Warlock',
    spec: 'Destruction',
    name: 'Immolate',
    spellId: 27215,
    rank: 9,
    requiredLevel: 69,
    effectType: 'DoT',
    castTimeSeconds: 2.0,
    gcdSeconds: 1.5,
    resource: { type: 'Mana', cost: 445 },
    /*
     * A hybrid, and the only one modelled: 332 Fire on impact and 615 more over 15 seconds. The
     * `baseAmount` is the direct half and `periodic` the rest, which is the split the type documents
     * for Fireball and Regrowth — this is the first entry that actually uses it on both sides.
     */
    baseAmount: { min: 332, max: 332 },
    periodic: {
      durationSeconds: 15,
      tickIntervalSeconds: 3,
      ticks: 5,
      totalBaseAmount: 615,
      perTickBaseAmount: 123,
    },
    scaling: {
      basis: 'hardcoded exception',
      spellPowerCoefficient: 0.85,
      spellPowerCoefficientPerTick: 0.13,
      coefficientNotes:
        'Two coefficients summed, because the spell has two halves: upstream is `BaseDamageConfigMagic(332, 332, 0.2)` for the impact and `BaseDamageConfigMagicNoRoll(615/5, 0.13)` for the DoT. 0.13 across five ticks is 0.65, plus 0.2 direct, so 0.85 for the whole cast. Shadow and Flame adds up to a further 0.04 per rank to the direct half only; it is not ingested, so this is the untalented figure.',
    },
    notes:
      'The DoT Destruction maintains, and the reason Incinerate is the filler rather than Shadow Bolt: Incinerate deals an extra 111-128 against a target that has Immolate on it. **That bonus is not modelled**, which understates Incinerate by roughly a tenth of a cast — worth stating because in this rotation the condition is always true, so it is a known one-directional gap rather than a conditional the model correctly skips. Voidheart 4-piece adds a sixth tick and is not modelled either.',
  },

]
