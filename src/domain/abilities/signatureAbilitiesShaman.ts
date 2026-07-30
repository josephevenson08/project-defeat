import type { SignatureAbility } from './abilityTypes'

export const shamanSignatureAbilities: readonly SignatureAbility[] = [
  {
    className: 'Shaman',
    spec: 'Elemental',
    name: 'Lightning Bolt',
    spellId: 25449,
    rank: 12,
    requiredLevel: 67,
    effectType: 'Direct Damage',
    castTimeSeconds: 2.5,
    gcdSeconds: 1.5,
    resource: { type: 'Mana', cost: 300 },
    baseAmount: { min: 571, max: 652 },
    scaling: {
      basis: 'hardcoded exception',
      spellPowerCoefficient: 0.794,
      coefficientNotes:
        'Hardcoded exception. The formula would give 2.5 / 3.5 = 0.7143; TBC adds a flat +0.08 bonus to both shaman electric spells, landing Lightning Bolt at 0.794. Chain Lightning gets the same +0.08 treatment. Confirmed identically by wowsims and TBC server-side spell data.',
    },
    notes:
      'Elemental is a Lightning Bolt filler spec, with Chain Lightning (rank 6, spell 25442, 2.0s cast, 6s cooldown, 734-838, coefficient ~0.641-0.651) fired on cooldown and Earth Shock/Flame Shock woven in, plus a totem set to maintain. Lightning Overload procs free half-damage copies of Lightning Bolt, which meaningfully raises effective throughput above what a single-cast model predicts. Minor source conflict on Chain Lightning: wowsims uses 0.651, TBC server data uses 0.641 — this does not affect the Lightning Bolt value used here, where both sources agree on 0.794.',
  },
  {
    className: 'Shaman',
    spec: 'Enhancement',
    name: 'Stormstrike',
    spellId: 17364,
    effectType: 'Melee Special',
    castTimeSeconds: 0,
    gcdSeconds: 1.5,
    cooldownSeconds: 10,
    resource: { type: 'Mana', cost: 237, note: '8% of base mana' },
    scaling: {
      basis: 'weapon damage',
      weaponDamageMultiplier: 1,
      normalizedWeaponDamage: false,
      coefficientNotes:
        'Attacks with BOTH weapons for 100% of un-normalized weapon damage each, so the multiplier applies once per hand. No flat bonus and no attack power coefficient of its own.',
    },
    notes:
      'Stormstrike has no intrinsic level requirement — it is gated purely by talent points spent in Enhancement, so `requiredLevel` is omitted. It is the Enhancement signature button, but on a 10s cooldown it is a small share of the spec\'s output — Enhancement damage is dominated by Windfury Weapon procs on white swings, with Flametongue on the off-hand and Shamanistic Rage for sustain. It also applies a debuff increasing the target\'s Nature damage taken by 20% for the next 2 Nature hits, which is worth real DPS to Elemental shamans in the group. Because the simulator currently models white damage only for physical specs, these numbers are staged for later use; note that Enhancement is the spec where white damage alone comes closest to being the right answer, provided Windfury is modeled.',
  },
  {
    className: 'Shaman',
    spec: 'Restoration',
    name: 'Chain Heal',
    spellId: 25423,
    rank: 5,
    requiredLevel: 68,
    effectType: 'Direct Heal',
    castTimeSeconds: 2.5,
    gcdSeconds: 1.5,
    resource: { type: 'Mana', cost: 540 },
    baseAmount: { min: 833, max: 950 },
    scaling: {
      basis: 'castTime/3.5',
      spellPowerCoefficient: 0.7143,
      coefficientNotes:
        '2.5s cast / 3.5 = 0.7143 on the primary target, with no exception. Chain Heal uses chain targeting rather than area targeting, so it is NOT subject to the area-effect halving that Circle of Healing takes. Each of the two jumps carries half the previous target\'s healing, bonus healing included, so the full 3-target cast is worth roughly 1.75x the primary value.',
    },
    notes:
      'Restoration Shaman is the archetypal Chain Heal spec in TBC — raid-wide smart healing plus totems is the entire reason the spec is brought, and Chain Heal is cast almost to the exclusion of everything else. Lesser Healing Wave and Healing Wave (coefficient 0.8571, which is stored as an explicit override but happens to equal the 3.0s / 3.5 formula value anyway) cover single-target emergencies. A single-target model of Chain Heal will understate Restoration Shaman throughput by roughly 75%, since the jumps are the whole point.',
  },
]
