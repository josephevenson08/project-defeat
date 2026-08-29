import type { SignatureAbility } from './abilityTypes'

export const mageSignatureAbilities: readonly SignatureAbility[] = [
  {
    className: 'Mage',
    spec: 'Arcane',
    name: 'Arcane Blast',
    spellSchool: 'Arcane',
    spellId: 30451,
    rank: 3,
    requiredLevel: 64,
    effectType: 'Direct Damage',
    castTimeSeconds: 2.5,
    gcdSeconds: 1.5,
    resource: { type: 'Mana', cost: 195, note: 'base cost; each Arcane Blast stack adds 75% of the base cost' },
    baseAmount: { min: 668, max: 772 },
    scaling: {
      basis: 'castTime/3.5',
      spellPowerCoefficient: 0.7143,
      coefficientNotes:
        '2.5s cast / 3.5 = 0.7143. The Arcane Blast stacking buff shortens the cast without reducing the coefficient, so the debuffed 1.5s cast still scales at 0.7143.',
    },
    notes:
      'Arcane Blast is new in TBC and defines the spec. Each cast applies a stacking buff (max 3, 8s duration) that cuts 0.33s off the cast time and adds 75% of the base mana cost per stack, so a 3-stack Arcane Blast costs 4x base mana and casts in 1.5s. The real Phase 1/2 rotation is therefore a mana-limited ramp — stack to 3, then either keep blasting or dump into Arcane Missiles / Frostbolt while the stacks decay — which a single-ability model cannot express. The mana cost recorded here is the unstacked base; a sustained rotation pays substantially more per cast.',
  },
  {
    className: 'Mage',
    spec: 'Fire',
    name: 'Fireball',
    spellSchool: 'Fire',
    spellId: 27070,
    rank: 13,
    requiredLevel: 66,
    effectType: 'Direct Damage',
    castTimeSeconds: 3.5,
    gcdSeconds: 1.5,
    resource: { type: 'Mana', cost: 425 },
    baseAmount: { min: 649, max: 821 },
    periodic: {
      durationSeconds: 8,
      tickIntervalSeconds: 2,
      ticks: 4,
      totalBaseAmount: 84,
      perTickBaseAmount: 21,
    },
    scaling: {
      basis: 'hardcoded exception',
      spellPowerCoefficient: 1.0,
      coefficientNotes:
        'Hardcoded to 1.0 on the direct component. Fireball would ordinarily be treated as a hybrid direct+DoT spell and have its coefficient split between the two, but TBC overrides it so the direct hit keeps the full 1.0 and the 84-damage DoT tail scales with nothing at all.',
    },
    notes:
      'Fireball is the Fire mage filler. The real rotation also keeps a Scorch stack up for Improved Scorch and weaves Fire Blast, and Fire\'s damage profile leans heavily on Ignite rolling off crits — none of which a single-ability model captures, so Fire will be understated relative to Frost/Arcane in a crit-heavy setup. Improved Fireball shortens the cast by up to 0.5s; as of patch 2.3 this does not reduce the coefficient, which is why the 3.5s value is safe to keep at 1.0.',
  },
  {
    className: 'Mage',
    spec: 'Frost',
    name: 'Frostbolt',
    spellSchool: 'Frost',
    spellId: 27072,
    rank: 13,
    requiredLevel: 69,
    effectType: 'Direct Damage',
    castTimeSeconds: 3.0,
    gcdSeconds: 1.5,
    resource: { type: 'Mana', cost: 330 },
    baseAmount: { min: 600, max: 647 },
    scaling: {
      basis: 'castTime/3.5',
      spellPowerCoefficient: 0.8143,
      coefficientNotes:
        'The best-known TBC coefficient oddity, but not actually an exception: (3.0 / 3.5) * 0.95 = 0.8143, where the 5% penalty is the standard "additional effect" tax charged because Frostbolt also applies a movement slow. The formula reproduces it exactly, even though the game also stores it as an explicit override. Confirmed identically by wowsims and by TBC server-side spell data.',
    },
    notes:
      'Frost is a Frostbolt-spam spec and is the cleanest fit of any caster for a single-ability model. Frost was not a competitive raid DPS spec in Phase 1/2 (it is generally an Arcane or Fire mage that is brought), so accuracy here matters mostly for completeness. Frostbolt is a binary spell for resistance purposes, which is why Elemental Precision gives it double hit value.',
  },
]
