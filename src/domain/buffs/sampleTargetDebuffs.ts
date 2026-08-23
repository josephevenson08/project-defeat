import type { TargetDebuff } from './buffTypes'

/**
 * The raid debuffs applied to the simulated target.
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
 * **Two entries have been added since that audit**, both to the same standard and both because a
 * talent-provided effect was being credited to a whole class: Expose Weakness (Survival) on
 * 2026-08-21, and Improved Faerie Fire (Balance) on 2026-08-23.
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
    /*
     * Class-wide, and that is a game fact rather than a raid convention. Faerie Fire is trainer-taught
     * to every Druid; this repo's own ingested talent trees put **Improved** Faerie Fire in Balance
     * (row 6, 3 ranks) and **Faerie Fire (Feral)** in Feral Combat (row 4, 1 rank), and leave
     * Restoration with neither.
     *
     * A walkthrough asked for this to be restricted to "Balance/Dreamstate". It is not, because that
     * restriction is inverted: Dreamstate is a Restoration talent, so it would credit the one tree
     * with no Faerie Fire talent at all while excluding the one with a dedicated one. What the
     * request was really after is the Balance-only half, which is now its own entry below.
     */
    providedByClass: 'Druid',
    spellId: 26993,
    armorReduction: 610,
    notes:
      'Rank 5: "Decrease the armor of the target by 610 for 40 sec". wowsims hardcodes the same 610. Faerie Fire (Feral) (spell 27011) is the identical value in forms, so a Feral druid covers this without a caster. The armor is all the base spell does — the +3% melee and ranged hit belongs to Improved Faerie Fire, which is a Balance talent and is listed separately.',
  },
  {
    id: 'improved-faerie-fire',
    name: 'Improved Faerie Fire',
    /*
     * Split out on 2026-08-23, on the same principle as Trueshot Aura and Power Infusion: a buff that
     * comes from a talent belongs to the spec that can spend the points, not to the class.
     *
     * The split is what makes both halves honest. Restricting the base debuff would have encoded a
     * raid convention as a game rule, which `ExclusiveGroup.basis` exists to keep apart; folding the
     * hit bonus into the class-wide entry would have handed every Feral and Restoration Druid a
     * talent they did not take.
     *
     * **This presupposes the base debuff.** Improved Faerie Fire modifies Faerie Fire rather than
     * replacing it, so ticking this one alone is not a state a raid can be in. `TargetDebuff` has no
     * dependency field and inventing one for a single pair is not worth the machinery — the two are
     * adjacent, named so the relationship reads, and the cost of the unreal state is an estimate
     * missing 610 armor, never one claiming too much.
     */
    providedByClass: 'Druid',
    providedBySpec: 'Balance',
    spellId: 33602,
    physicalHitTakenBonus: 0.03,
    notes:
      'Talent rank 3/3, spell 33602: "Your Faerie Fire spell also increases the chance the target will be hit by melee and ranged attacks by 3%". Ranks 1 and 2 give 1% and 2%. Target-side attacker hit, so it joins the same `missReduction` term as hit rating and talent hit and is worth nothing to a raid already at the hit cap. Melee and ranged only — the spell hit table is separate and does not read it. The armor reduction is on the base Faerie Fire entry, which this one does not repeat.',
  },
  {
    id: 'improved-seal-of-the-crusader',
    name: 'Improved Seal of the Crusader',
    providedByClass: 'Paladin',
    // A Retribution talent — the name says "Improved", and the improvement is what the raid wants.
    providedBySpec: 'Retribution',
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
  {
    id: 'expose-weakness',
    name: 'Expose Weakness',
    providedByClass: 'Hunter',
    providedBySpec: 'Survival',
    spellId: 34503,
    /*
     * Missing from this file entirely until 2026-08-21, which mattered: Expose Weakness is the reason
     * a raid brings a Survival Hunter at all, and the spec's own estimate note already said its
     * personal damage is not the point.
     *
     * Not modelled, and the reason is structural rather than a gap to fill in later: the value is
     * **25% of the Hunter's Agility**, which is another player's stat. This app models one character
     * and has no way to reach a second one's gear.
     */
    notModelled:
      "Applies a debuff worth 25% of the Hunter's Agility as attack power to everyone attacking the target. wowsims procs it on a ranged crit, at rank/3 chance — 100% at 3/3. The value depends on another player's Agility, which this app has no way to read.",
    notes:
      'Survival talent, and the spec\'s raid slot. wowsims applies it as core.ExposeWeaknessAura with hunter.GetStat(stats.Agility) * 0.25, refreshed only when the new value beats the one already on the target — so two Survival Hunters do not stack, the higher Agility simply wins.',
  },
]

export function getTargetDebuffById(id: string) {
  return sampleTargetDebuffs.find((debuff) => debuff.id === id)
}

/** Debuffs this app actually applies to the simulated target. */
export const modelledTargetDebuffs = sampleTargetDebuffs.filter((debuff) => !debuff.notModelled)

/** Debuffs listed for completeness whose real scope the simulation cannot express. */
export const unmodelledTargetDebuffs = sampleTargetDebuffs.filter((debuff) => debuff.notModelled)
