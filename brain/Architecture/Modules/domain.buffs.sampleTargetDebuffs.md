---
type: module
layer: domain
source: src/domain/buffs/sampleTargetDebuffs.ts
lines: 293
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.buffs.sampleTargetDebuffs

`src/domain/buffs/sampleTargetDebuffs.ts` · **domain** layer · 293 lines

From the top of the file:

> The raid debuffs applied to the simulated target.
> 
> Same treatment the thirty-three raid buffs got, and it found the same thing. Every number below
> was read by hand off the Wowhead tooltip of the spell rank named in `spellId`, then cross-checked
> against wowsims/tbc `sim/core/debuffs.go` @3301fca5. All six previously carried
> `needsVerification` with a note calling them "approximate pending final Wowhead audit"; five of
> the six were not approximate, they were wrong:
> 
> - **The three armor debuffs were in the wrong unit entirely.** They were fractions — 20%, 8%, 5%
>   — and TBC has no percentage armor debuff. Sunder Armor is 520 flat per stack, Faerie Fire 610,
>   Curse of Recklessness 800. Against this app's own level 73 target the old model removed 33% of
>   10,643 armor (3,512) where the real three remove 4,010, and against any other target it was
>   wrong by a different amount, because a fraction scales with the target and a flat value does
>   not.
> - **Winter's Chill was applied to every school.** It is Frost only, so it was handing +10% crit
>   to Shadow Priests and Balance Druids, for whom it does nothing.
> - **Improved Seal of the Crusader was physical only.** Its tooltip says "all attacks", and
>   wowsims puts the one bonus into both `PhysicalCritChance` and `SpellCritChance`. Casters were
>   getting nothing from a debuff that helps them exactly as much as it helps a Warrior.
> 
> Curse of the Elements' 10% is the one value that survived intact.
> 
> **Two entries have been added since that audit**, both to the same standard and both because a
> talent-provided effect was being credited to a whole class: Expose Weakness (Survival) on
> 2026-08-21, and Improved Faerie Fire (Balance) on 2026-08-23.
> 
> **Where the two sources conflict, the tooltip wins** — the rule the buff pass set. Here nothing
> conflicted: all six agreed to the digit, including the numbers that overturned what shipped.
> 
> **Eleven more on 2026-11-01, the caster-side and mana gap.** A Shadow Priest's seat credited
> nothing a raid brings one for, because Misery, Shadow Weaving and Vampiric Touch were in neither
> file. Sourced by the tbc-researcher from Wowhead's effect rows, the ingested talent text and
> wowsims' `debuffs.go`: Misery, Shadow Weaving and Improved Scorch are applied; Improved Shadow
> Bolt, Judgement of Wisdom and Stormstrike's Nature debuff are listed; and Blood Frenzy, Hunter's
> Mark, Improved Hunter's Mark, Expose Armor and Mangle were listed and held out by the owner's choice,
> then applied on 2026-11-02, once the reference turned out to be the logs' 95th percentile all along
> (`dpsReference.ts`) and Marksmanship's thin reference was marked as such.
> 
> **Spell school is what made it possible.** Every damaging ability records its own school now
> (`SignatureAbility.spellSchool`), so a school-scoped debuff reaches the spells of its school and
> no others: Curse of the Elements no longer reaches an Elemental Shaman's Nature, and Winter's
> Chill, listed and unapplied until then because it could only go to every spell or to none, is
> applied to Frost. School damage taken multiplies, as wowsims applies it.
> 
> **What `notModelled` means for a debuff now.** Listed with its real effect and credited to whoever
> brings it, but not applied, and each entry says why: another player's stat (Expose Weakness),
> charges or an uptime nothing here plays out (Improved Shadow Bolt, Stormstrike), or mana (Judgement
> of Wisdom).

## Exports

**function** — `getTargetDebuffById`

**const** — `modelledTargetDebuffs`, `sampleTargetDebuffs`, `unmodelledTargetDebuffs`

## Imports

- [[domain.buffs.buffTypes]] — `src/domain/buffs/buffTypes.ts`

## Imported by

- [[domain.buffs.raidBuffs]] — `src/domain/buffs/raidBuffs.ts`
- [[domain.raidcomp.buffCoverage]] — `src/domain/raidcomp/buffCoverage.ts`
- [[domain.raidcomp.raidAdvice]] — `src/domain/raidcomp/raidAdvice.ts`
- [[domain.simulation.hitCap]] — `src/domain/simulation/hitCap.ts`
- [[features.raidcomp.RaidAdvice]] — `src/features/raidcomp/RaidAdvice.tsx`
- [[features.simulator.bestCase]] — `src/features/simulator/bestCase.ts`
- [[features.simulator.calculateSimulation]] — `src/features/simulator/calculateSimulation.ts`
- [[features.talents.talentWords]] — `src/features/talents/talentWords.ts`

## Concepts & phases

- [[Buffs Debuffs and Consumables]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
