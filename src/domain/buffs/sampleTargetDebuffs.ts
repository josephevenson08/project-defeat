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
 * **Eleven more on 2026-11-01, the caster-side and mana gap.** A Shadow Priest's seat credited
 * nothing a raid brings one for, because Misery, Shadow Weaving and Vampiric Touch were in neither
 * file. Sourced by the tbc-researcher from Wowhead's effect rows, the ingested talent text and
 * wowsims' `debuffs.go`: Misery, Shadow Weaving and Improved Scorch are applied; Improved Shadow
 * Bolt, Judgement of Wisdom and Stormstrike's Nature debuff are listed; and Blood Frenzy, Hunter's
 * Mark, Improved Hunter's Mark, Expose Armor and Mangle are listed and held out by the owner's choice.
 *
 * **Spell school is what made it possible.** Every damaging ability records its own school now
 * (`SignatureAbility.spellSchool`), so a school-scoped debuff reaches the spells of its school and
 * no others: Curse of the Elements no longer reaches an Elemental Shaman's Nature, and Winter's
 * Chill, listed and unapplied until then because it could only go to every spell or to none, is
 * applied to Frost. School damage taken multiplies, as wowsims applies it.
 *
 * **What `notModelled` means for a debuff now.** Listed with its real effect and credited to whoever
 * brings it, but not applied, and each entry says why: another player's stat (Expose Weakness),
 * charges or an uptime nothing here plays out (Improved Shadow Bolt, Stormstrike), mana (Judgement of
 * Wisdom), or the owner's call to hold the physical ones out until the best-case bound is settled.
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
    schoolDamageTakenMultipliers: { Arcane: 0.1, Fire: 0.1, Frost: 0.1, Shadow: 0.1 },
    notes:
      'Rank 4: "increasing Arcane, Fire, Frost, and Shadow damage taken by 10%". The one value that came through this audit unchanged. Nature and Holy are excluded, and since 2026-11-01 that is honoured: an Elemental Shaman\'s Nature spells and a Rogue\'s Nature poisons take none of it (until then it was applied to every spell for want of a school). The same tooltip lowers those four resistances by 88, which the app does not model. Malediction 3/3 raises it to 13% (wowsims: `1.1 + 0.01*points`). TBC has no separate Curse of Shadow: patch 2.4.3 folded its Arcane and Shadow into this one.',
  },
  {
    id: 'winters-chill',
    name: "Winter's Chill",
    providedByClass: 'Mage',
    providedBySpec: 'Frost',
    spellId: 28595,
    schoolCritTakenBonus: { Frost: 0.1 },
    notes:
      'Talent rank 5/5, spell 28595 — the id wowsims cites too, where it lands in `BonusFrostCritRating` and is read only under `spell.SpellSchool.Matches(SpellSchoolFrost)`. +2% Frost crit a stack to 5, so +10% at the full stack a Frost Mage keeps up; applied at that stack, as Sunder is. The effect that lands on the target is spell 12579, whose tooltip carries no values. Ranks 1-4 apply the same 2% per stack at a lower chance to apply it; rank 5 is 100%. Listed and unapplied until 2026-11-01, because with no spell school recorded it could only go to every spell or to none, and the version before that handed +10% crit to Shadow Priests and Balance Druids.',
  },
  {
    id: 'misery',
    name: 'Misery',
    providedByClass: 'Priest',
    providedBySpec: 'Shadow',
    spellId: 33195,
    // Every magic school and not Physical: wowsims' MiseryAura multiplies the six school fields.
    schoolDamageTakenMultipliers: { Arcane: 0.05, Fire: 0.05, Frost: 0.05, Holy: 0.05, Nature: 0.05, Shadow: 0.05 },
    notes:
      'Talent rank 5/5, spell 33195: Shadow Word: Pain, Mind Flay and Vampiric Touch "also cause the target to take an additional 5% spell damage". The debuff on the target is spell 33200, 24 seconds, refreshed by each of those casts. Spell damage only: wowsims\' `MiseryAura` (`1.0 + 0.01*numPoints`) multiplies the Arcane, Fire, Frost, Holy, Nature and Shadow damage-taken fields and no physical one, so it reaches a Rogue\'s Nature poisons and a Paladin\'s Holy seal as well as every caster. Multiplies with Curse of the Elements rather than adding to it.',
  },
  {
    id: 'shadow-weaving',
    name: 'Shadow Weaving',
    providedByClass: 'Priest',
    providedBySpec: 'Shadow',
    spellId: 15334,
    schoolDamageTakenMultipliers: { Shadow: 0.1 },
    notes:
      'Talent rank 5/5, spell 15334: Shadow damage spells have a 100% chance to apply a debuff that "increases the Shadow damage dealt to your target by 2%", stacking to 5 (spell 15258, 15 seconds). +10% Shadow at the full stack a Shadow Priest keeps up, which is how it is applied here and how wowsims applies it (`MakePermanent(ShadowWeavingAura(target, 5))`). Shadow only: it reaches a Shadow Priest\'s own spells and every Warlock\'s Shadow ones.',
  },
  {
    id: 'improved-scorch',
    name: 'Improved Scorch',
    providedByClass: 'Mage',
    providedBySpec: 'Fire',
    spellId: 12873,
    schoolDamageTakenMultipliers: { Fire: 0.15 },
    notes:
      'Talent rank 3/3, spell 12873: Scorch has a 100% chance to apply Fire Vulnerability (spell 22959), which "increases the Fire damage dealt to your target by 3%", stacking to 5 for 30 seconds. +15% Fire at a full stack, applied at that stack as wowsims does (`MakePermanent(ImprovedScorchAura(target, 5))`). Holding it costs the Fire Mage a Scorch every 30 seconds, which no estimate here charges for.',
  },
  {
    id: 'improved-shadow-bolt',
    name: 'Improved Shadow Bolt',
    providedByClass: 'Warlock',
    providedBySpec: 'Destruction',
    spellId: 17803,
    notModelled:
      "+20% Shadow damage taken for 12 seconds or until 4 non-periodic hits land, applied by a Shadow Bolt crit (Shadow Vulnerability, spell 17800). How much of a fight it covers is the Warlocks' Shadow Bolt crit rate and how many of them there are: wowsims takes that uptime as an input (`IsbUptime`) rather than working it out, and this app has no other player's crit to read.",
    notes:
      'Talent rank 5/5, spell 17803. wowsims applies a given uptime as a permanent `1 + 0.2 × uptime`, or for a real Warlock the full 1.2 with a charge spent on each landed Shadow hit; the tooltip counts any non-periodic source, wowsims only Shadow ones, a difference that matters little since only Shadow hits gain from it.',
  },
  {
    id: 'judgement-of-wisdom',
    name: 'Judgement of Wisdom',
    providedByClass: 'Paladin',
    spellId: 27164,
    notModelled:
      "Each melee or ranged hit and each landed spell has a 50% chance to give the attacker 74 mana (spell 27165), for 20 seconds after the judgement. Mana: the damage estimates track no mana pool, and the healer estimates price each heal at base cost and read only MP5 and Spirit, so a mana return has nowhere to land.",
    notes:
      "Seal of Wisdom judged (debuff spell 27164, proc 27165 \"Give Power (Mana)\" 74). wowsims counts 37 mana per qualifying hit (`74 / 2 // 50% proc`), lets melee and ranged proc it even on a miss, and gives mana only to attackers with a mana bar. Any Paladin, no talent. One Judgement per Paladin is the later rule; for TBC it is unconfirmed, so this entry does not claim it.",
  },
  {
    id: 'stormstrike',
    name: 'Stormstrike',
    providedByClass: 'Shaman',
    providedBySpec: 'Enhancement',
    spellId: 17364,
    notModelled:
      'The next 2 Nature damage hits on the target take 20% more, for 12 seconds, refreshed by each Stormstrike on its 10-second cooldown. Two charges spent by whoever lands Nature damage first is a timeline this app does not play out, and an uptime figure would be invented.',
    notes:
      "Spell 17364, the 41-point Enhancement talent; its strike is in Enhancement's rotation as a special attack, and this is the debuff it leaves. wowsims (`sim/shaman/stormstrike.go`) multiplies Nature damage taken by a flat 1.2 while any charge is left (`MaxStacks: 2`).",
  },
  {
    id: 'blood-frenzy',
    name: 'Blood Frenzy',
    providedByClass: 'Warrior',
    providedBySpec: 'Arms',
    spellId: 29859,
    notModelled:
      "+4% physical damage taken (spell 30070) while the Warrior's Rend or Deep Wounds is on the target. Held out of the estimate for now, the owner's call (2026-11-01): applied at best case it alone takes Marksmanship (about 1,294) and Subtlety (about 1,270) past what players of them average (1,341 and 1,292), and what a best case is measured against is to be settled first.",
    notes:
      "Talent rank 2/2, spell 29859, which Rend and Deep Wounds trigger. wowsims: `BloodFrenzyAura`, `PhysicalDamageTakenMultiplier *= 1 + 0.02*points`, applied as permanent; its comment says it lasts as long as the bleed that activates it, so permanent assumes the Warrior keeps one up.",
  },
  {
    id: 'hunters-mark',
    name: "Hunter's Mark",
    providedByClass: 'Hunter',
    spellId: 14325,
    notModelled:
      "+110 ranged attack power for everyone attacking the target, rising by 11 with each ranged hit to 440 (rank 4). Held out with the other physical debuffs until the best-case bound is settled (the owner's call, 2026-11-01).",
    notes:
      "Rank 4, spell 14325: \"increasing the ranged attack power of all attackers against that target by 110 and by an additional 11 each time they are struck by a ranged attack, up to a maximum of 440\". wowsims agrees (`baseRangedBonus = 110.0`, `bonusPerStack = 11.0`, `maxStacks = 30`) and applies it fully stacked. Two Hunters' marks do not stack. The melee half is Improved Hunter's Mark, listed separately as Improved Faerie Fire is.",
  },
  {
    id: 'improved-hunters-mark',
    name: "Improved Hunter's Mark",
    providedByClass: 'Hunter',
    providedBySpec: 'Marksmanship',
    spellId: 19425,
    notModelled:
      "+110 melee attack power for everyone attacking the target: the mark's base value given to melee as well. Held out with the other physical debuffs until the best-case bound is settled (the owner's call, 2026-11-01).",
    notes:
      "Talent rank 5/5, spell 19425: \"100% of your Hunter's Mark ability's base attack power to apply to melee\". wowsims: `meleeBonus := baseRangedBonus * 0.2 * float64(points)`, 110 at 5/5; melee takes the base only, not the ranged ramp. Presupposes Hunter's Mark.",
  },
  {
    id: 'expose-armor',
    name: 'Expose Armor',
    providedByClass: 'Rogue',
    spellId: 26866,
    notModelled:
      "−3,075 armor at Improved Expose Armor 2/2 (2,050 untalented), exclusive with Sunder Armor: the higher one wins, so with both it replaces Sunder's 2,600 rather than adding to it. Held out with the other physical debuffs until the best-case bound is settled (the owner's call, 2026-11-01); applying it also needs the exclusivity with Sunder.",
    notes:
      "Rank 6, spell 26866, with Improved Expose Armor 2/2 (spell 14169, +50%), which any Rogue can reach. wowsims: `armorReduction := 2050.0 * (1.0 + 0.25*float64(talentPoints))` and the `SunderExposeAuraTag` it shares with Sunder Armor. At 1/2 it is 2,562.5, below a full Sunder, so only 2/2 is worth bringing over a Warrior. The tooltip gives \"5 points: 2050 armor\" (410 a point), and the talent's +50% makes 3,075.",
  },
  {
    id: 'mangle',
    name: 'Mangle',
    providedByClass: 'Druid',
    providedBySpec: 'Feral',
    spellId: 33876,
    notModelled:
      "+30% bleed damage and Shred damage taken for 12 seconds, from Mangle (Cat) or Mangle (Bear). Held out with the other physical debuffs until the best-case bound is settled (the owner's call, 2026-11-01); the Feral estimate's own Rake and Rip would take it.",
    notes:
      "Spell 33876, the id wowsims cites (rank 1; the 30% is the same at every rank, and which later id is the top rank was not confirmed). wowsims: `MangleAura` multiplies periodic physical damage taken by 1.3, and `sim/druid/shred.go` Shred's by 1.3 while it is up. Cat and Bear apply the one debuff and do not stack.",
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
