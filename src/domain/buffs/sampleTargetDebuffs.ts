import type { TargetDebuff } from './buffTypes'

/**
 * The six raid debuffs applied to the simulated target.
 *
 * Same treatment the thirty-three raid buffs got, and it found the same thing. Every number below
 * was read by hand off the Wowhead tooltip of the spell rank named in `spellId`, then cross-checked
 * against wowsims/tbc `sim/core/debuffs.go` @3301fca5. All six previously carried
 * `needsVerification` with a note calling them "approximate pending final Wowhead audit"; five of
 * the six were not approximate, they were wrong:
 *
 * - **The three armor debuffs were in the wrong unit entirely.** They were fractions — 20%, 8%, 5%
 *   — and TBC has no percentage armor debuff. Sunder Armor is 520 flat per stack, Faerie Fire 610,
 *   Curse of Recklessness 800. Against this app's own level 73 target the old model removed 33% of
 *   10,643 armor (3,512) where the real three remove 4,010, and against any other target it was
 *   wrong by a different amount, because a fraction scales with the target and a flat value does
 *   not.
 * - **Winter's Chill was applied to every school.** It is Frost only, so it was handing +10% crit
 *   to Shadow Priests and Balance Druids, for whom it does nothing.
 * - **Improved Seal of the Crusader was physical only.** Its tooltip says "all attacks", and
 *   wowsims puts the one bonus into both `PhysicalCritChance` and `SpellCritChance`. Casters were
 *   getting nothing from a debuff that helps them exactly as much as it helps a Warrior.
 *
 * Curse of the Elements' 10% is the one value that survived intact.
 *
 * **Where the two sources conflict, the tooltip wins** — the rule the buff pass set. Here nothing
 * conflicted: all six agreed to the digit, including the numbers that overturned what shipped.
 *
 * **What `notModelled` means for a debuff.** Only Winter's Chill carries it, and the reason is
 * narrow and fixable: no spell school is recorded anywhere in `SignatureAbility` or the simulation,
 * so a Frost-only debuff can be applied to every spell or to none. Applying it is the error being
 * corrected here, so it is applied to none and listed with its real effect instead. Curse of the
 * Elements is school-scoped too but stays modelled, because the schools it covers (Arcane, Fire,
 * Frost, Shadow) are every modelled caster except Elemental Shaman, whose Nature damage it misses —
 * named in its notes rather than hidden. That is the line: applied when it is right for most specs
 * and the exception is written down, `notModelled` when applying it would be wrong for most.
 */
export const sampleTargetDebuffs: readonly TargetDebuff[] = [
  {
    id: 'sunder-armor',
    name: 'Sunder Armor',
    providedByClass: 'Warrior',
    spellId: 25225,
    armorReduction: 2600,
    notes:
      'Rank 6: "reducing it by 520 per Sunder Armor ... Can be applied up to 5 times". 520 × 5 = 2600, the full-stack value a raid tank maintains; the app has no notion of the stack ramping up over the first few seconds. wowsims agrees to the digit (`armorReductionPerStack := 520.0`, `MaxStacks: 5`). Exclusive with a Rogue\'s Expose Armor rather than additive with it — the two share wowsims\' `SunderExpose` tag and the higher one wins, which at Improved Expose Armor 2/2 is Expose at 3075.',
  },
  {
    id: 'curse-of-recklessness',
    name: 'Curse of Recklessness',
    providedByClass: 'Warlock',
    spellId: 27226,
    armorReduction: 800,
    notes:
      'Rank 5: "reducing armor by 800 for 2 min". Stacks with Sunder Armor and Faerie Fire — the previous note claimed otherwise, and it was wrong on both counts, in unit and in stacking. Two real costs are not modelled: the same tooltip gives the target +135 melee attack power, which is a genuine drawback for the tank, and "Only one Curse per Warlock can be active on any one target" means running this alongside Curse of the Elements costs a second Warlock.',
  },
  {
    id: 'faerie-fire',
    name: 'Faerie Fire',
    providedByClass: 'Druid',
    spellId: 26993,
    armorReduction: 610,
    notes:
      'Rank 5: "Decrease the armor of the target by 610 for 40 sec". wowsims hardcodes the same 610. Faerie Fire (Feral) (spell 27011) is the identical value in forms, so a Feral druid covers this without a caster. Improved Faerie Fire 3/3 (spell 33602) adds "increases the chance the target will be hit by melee and ranged attacks by 3%" — a target-side hit bonus this app has no field for, so it is named here rather than folded into the armor number.',
  },
  {
    id: 'improved-seal-of-the-crusader',
    name: 'Improved Seal of the Crusader',
    providedByClass: 'Paladin',
    spellId: 20337,
    physicalCritTakenBonus: 0.03,
    spellCritTakenBonus: 0.03,
    notes:
      'Talent rank 3/3: "your Judgement of the Crusader spell will also increase the critical strike chance of all attacks made against that target by an additional 3%". "All attacks" is literal — wowsims stores it as `Target.PseudoStats.BonusCritRating` and reads that same field in both `PhysicalCritChance` and `SpellCritChance`, which is why it is on both fields here. Ranks 1 and 2 give 1% and 2%. Delivered by Judgement of the Crusader (spell 27159), whose own effect is "Increases Holy damage taken by up to 219" — Holy-only spell power the app cannot express.',
  },
  {
    id: 'curse-of-elements',
    name: 'Curse of the Elements',
    providedByClass: 'Warlock',
    spellId: 27228,
    spellDamageTakenMultiplier: 0.1,
    notes:
      'Rank 4: "increasing Arcane, Fire, Frost, and Shadow damage taken by 10%". The one value that came through this audit unchanged. Two limits: Nature and Holy are excluded, so an Elemental Shaman gains nothing from it and this app applies it anyway for want of a spell school; and the same tooltip lowers those four resistances by 88, which the app does not model. Malediction 3/3 raises it to 13% (wowsims: `1.1 + 0.01*points`).',
  },
  {
    id: 'winters-chill',
    name: "Winter's Chill",
    providedByClass: 'Mage',

    providedBySpec: 'Frost',
    spellId: 28595,
    notModelled:
      'Increases the chance a Frost spell will critically hit the target by 2% per application, stacking to 5 — +10% Frost spell crit at a full stack. Frost spells only, and this app does not record which school a spell belongs to, so the choice is to apply it to every caster or to none. Applying it to every caster is what the previous version did, and it handed +10% crit to Shadow Priests and Balance Druids, for whom it does nothing.',
    notes:
      'Talent rank 5/5, spell 28595 — the id wowsims cites too, where it lands in `BonusFrostCritRating` and is read only under `spell.SpellSchool.Matches(SpellSchoolFrost)`. The effect that lands on the target is spell 12579, whose tooltip carries no values. Ranks 1-4 apply the same 2% per stack at a lower chance to apply it; rank 5 is 100%.',
  },
]

export function getTargetDebuffById(id: string) {
  return sampleTargetDebuffs.find((debuff) => debuff.id === id)
}

/** Debuffs this app actually applies to the simulated target. */
export const modelledTargetDebuffs = sampleTargetDebuffs.filter((debuff) => !debuff.notModelled)

/** Debuffs listed for completeness whose real scope the simulation cannot express. */
export const unmodelledTargetDebuffs = sampleTargetDebuffs.filter((debuff) => debuff.notModelled)
