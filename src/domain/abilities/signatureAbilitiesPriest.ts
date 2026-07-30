import type { SignatureAbility } from './abilityTypes'

export const priestSignatureAbilities: readonly SignatureAbility[] = [
  {
    className: 'Priest',
    spec: 'Discipline',
    name: 'Flash Heal',
    spellId: 25235,
    rank: 9,
    requiredLevel: 67,
    effectType: 'Direct Heal',
    castTimeSeconds: 1.5,
    gcdSeconds: 1.5,
    resource: { type: 'Mana', cost: 470 },
    baseAmount: { min: 1116, max: 1295 },
    scaling: {
      basis: 'instant 1.5/3.5',
      spellPowerCoefficient: 0.4286,
      coefficientNotes:
        '1.5s cast / 3.5 = 0.4286. This is also the floor of the TBC coefficient formula, since cast times are clamped to a 1.5s minimum before the division — Flash Heal sits exactly on it.',
    },
    notes:
      'Discipline in TBC is a tank-healing spec, not a damage spec, and its throughput comes from fast reactive heals rather than a fixed rotation: Flash Heal for speed, Greater Heal (rank 7, spell 25213, 825 mana, 3.0s cast, 2414-2803, coefficient 0.8571) when a big heal is needed, Power Word: Shield pre-applied, and Power Infusion / Pain Suppression as cooldowns. Flash Heal is chosen as the signature because it is the spec\'s highest-frequency cast, but Discipline\'s real value is partly in buffs it gives other players, which this model does not represent at all.',
  },
  {
    className: 'Priest',
    spec: 'Holy',
    name: 'Circle of Healing',
    spellId: 34866,
    rank: 5,
    requiredLevel: 70,
    effectType: 'Direct Heal',
    castTimeSeconds: 0,
    gcdSeconds: 1.5,
    resource: { type: 'Mana', cost: 450 },
    baseAmount: { min: 409, max: 451 },
    scaling: {
      basis: 'hardcoded exception',
      spellPowerCoefficient: 0.2143,
      coefficientNotes:
        'Instant, so the cast time clamps to the 1.5s floor giving 1.5/3.5 = 0.4286 — then halved to 0.2143 because Circle of Healing is an area-effect spell, and TBC gives area effects only half the computed coefficient. The 0.2143 applies per target healed, so a full 5-target hit is worth ~1.07 total.',
    },
    needsVerification: true,
    notes:
      'Circle of Healing is the 31-point Holy talent and the defining Phase 1/2 Holy Priest button. Critically, it has NO cooldown in TBC (the 6s cooldown is a later Wrath-era change), which is exactly why "CoH spam" was the raid-healing meta — so unlike most instants in this data set it genuinely is cast every GCD. Greater Heal and Flash Heal fill the single-target role, and Prayer of Mending (spell 33076, 390 mana, instant, 10s cooldown, 800 per bounce, 5 bounces) is kept rolling. Flagged because the 0.2143 is derived from the TBC area-effect halving rule rather than read off a source that states Circle of Healing\'s coefficient directly; the underlying rule is well established but the specific number was not independently confirmed.',
  },
  {
    className: 'Priest',
    spec: 'Shadow',
    name: 'Mind Flay',
    spellId: 25387,
    rank: 7,
    requiredLevel: 68,
    effectType: 'DoT',
    castTimeSeconds: 3.0,
    channeled: true,
    gcdSeconds: 1.5,
    resource: { type: 'Mana', cost: 230 },
    periodic: {
      durationSeconds: 3,
      tickIntervalSeconds: 1,
      ticks: 3,
      totalBaseAmount: 528,
      perTickBaseAmount: 176,
    },
    scaling: {
      basis: 'hardcoded exception',
      spellPowerCoefficient: 0.57,
      spellPowerCoefficientPerTick: 0.19,
      coefficientNotes:
        'Hardcoded exception at 0.19 per tick (0.57 across the full 3s channel). The generic channel rule would use the 3s channel duration in place of a cast time and, after the 5% slow-effect penalty, land near 0.81 — so the real value is a substantial nerf relative to the formula. 0.19/tick is confirmed identically by wowsims and TBC server-side spell data.',
    },
    notes:
      'Shadow Priest DPS is Mind Blast / Shadow Word: Death weaving around Mind Flay, not a pure Mind Flay channel: the real rotation keeps Shadow Word: Pain and Vampiric Touch up, fires Mind Blast (rank 11, spell 25375, 450 mana, 1.5s cast, 8s cooldown, 711-752, coefficient 0.4286) on every cooldown, and channels Mind Flay only in the gaps — often clipping the channel early to catch Mind Blast coming off cooldown. Mind Flay is the honest "filler" answer but it is the lowest-value cast in the rotation, so a Mind-Flay-only model understates Shadow. Note also that Shadow Priests are brought for Vampiric Touch mana return to the caster group, which no single-ability model captures.',
  },
]
