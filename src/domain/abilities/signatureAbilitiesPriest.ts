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
      basis: 'instant 1.5/3.5',
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
    spellSchool: 'Shadow',
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
  },  {
    className: 'Priest',
    spec: 'Shadow',
    name: 'Shadow Word: Pain',
    spellSchool: 'Shadow',
    spellId: 25368,
    rank: 10,
    requiredLevel: 70,
    effectType: 'DoT',
    castTimeSeconds: 0,
    gcdSeconds: 1.5,
    resource: { type: 'Mana', cost: 575 },
    periodic: {
      durationSeconds: 18,
      tickIntervalSeconds: 3,
      ticks: 6,
      totalBaseAmount: 1236,
      perTickBaseAmount: 206,
    },
    scaling: {
      basis: 'hardcoded exception',
      spellPowerCoefficient: 1.098,
      spellPowerCoefficientPerTick: 0.183,
      coefficientNotes:
        'Upstream: `core.BaseDamageConfigMagicNoRoll(1236/6, 0.183)`. 0.183 per tick over 6 ticks is 1.098 total, short of the 1.2 an 18s duration earns under duration/15 — another of the periodic coefficients TBC overrides rather than derives.',
    },
    notes:
      'The cheapest global in the Shadow rotation by damage per cast time, since it is instant. Improved Shadow Word: Pain adds a tick per rank upstream and the Absolution 2-piece adds another; neither is modelled, so this is the 6-tick baseline.',
  },
  {
    className: 'Priest',
    spec: 'Shadow',
    name: 'Vampiric Touch',
    spellSchool: 'Shadow',
    spellId: 34917,
    rank: 3,
    requiredLevel: 70,
    effectType: 'DoT',
    castTimeSeconds: 1.5,
    gcdSeconds: 1.5,
    resource: { type: 'Mana', cost: 425 },
    periodic: {
      durationSeconds: 15,
      tickIntervalSeconds: 3,
      ticks: 5,
      totalBaseAmount: 650,
      perTickBaseAmount: 130,
    },
    scaling: {
      basis: 'duration/15',
      spellPowerCoefficient: 1.0,
      spellPowerCoefficientPerTick: 0.2,
      coefficientNotes:
        '**Derived, not sourced, and that is why this entry is flagged.** wowsims does not implement Vampiric Touch at the pinned commit — there is no `vampiric_touch.go` — so unlike every other DoT here there is no second source to check against, and the plain duration/15 rule is what fills the gap: 15s / 15 = 1.0, split 0.2 across five ticks. Three of the four Affliction DoTs turned out to be overrides rather than the formula, so this one has a real chance of being wrong in the same way.',
    },
    needsVerification: true,
    notes:
      "The mana-return half — party members gain mana equal to 5% of the Priest's Shadow damage — is the reason a raid brings this spec and is not modelled: it raises other players' output, not this one's. Base damage and duration are read from the rank 3 tooltip; only the coefficient is derived.",
  },  {
    className: 'Priest',
    spec: 'Shadow',
    name: 'Mind Blast',
    spellSchool: 'Shadow',
    spellId: 25375,
    rank: 11,
    requiredLevel: 69,
    effectType: 'Direct Damage',
    castTimeSeconds: 1.5,
    gcdSeconds: 1.5,
    cooldownSeconds: 8,
    resource: { type: 'Mana', cost: 450 },
    baseAmount: { min: 711, max: 752 },
    scaling: {
      basis: 'instant 1.5/3.5',
      spellPowerCoefficient: 0.4286,
      coefficientNotes:
        '1.5s cast clamped to the 1.5/3.5 floor, which is 0.4286 — the plain rule with no exception. These numbers were already recorded in the Mind Flay note as what the real rotation presses; this entry is that note becoming data.',
    },
    notes:
      "The rotation's damage spike and, until this existed, the reason spell crit was worth **nothing** to a modelled Shadow priest: DoTs and channels are both periodic and neither crits in TBC, so with only Shadow Word: Pain, Vampiric Touch and Mind Flay the spec had no critable spell at all. Mind Blast is what crit rating actually buys. Shadow Word: Death is the other direct cast and is not modelled — it costs health on a resist and needs a usage policy this app has none of.",
  },


]
