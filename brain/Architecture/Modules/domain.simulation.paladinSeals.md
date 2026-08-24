---
type: module
layer: domain
source: src/domain/simulation/paladinSeals.ts
lines: 142
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.simulation.paladinSeals

`src/domain/simulation/paladinSeals.ts` · **domain** layer · 142 lines

From the top of the file:

> Retribution's Holy damage — the seal riding on every swing, and the judgement on its cooldown.
> 
> **This is where a Retribution paladin's damage actually is**, and the spec's own ability notes have
> said so for as long as they have existed: "Retribution's actual damage is dominated by auto attacks
> with Seal of Blood (Horde) or Seal of Command (Alliance) proccing on them, plus Judgement on
> cooldown". The model counted none of it, and called Ret "the physical spec where the special-attack
> share of damage is smallest" without noticing that the missing share was not special-attack damage
> at all.
> 
> **None of it fits `SignatureAbility`, and that is not a schema gap.** A seal is a 30-second
> self-buff whose damage rides passively on white hits; a judgement is unleashed *from* the seal. The
> repo's notes concluded these "do not fit this schema at all" and stopped there. True — and the
> simulator is not the schema, so they live here instead, in the same shape `weaponImbues.ts` uses.
> 
> **All of it is Holy, so armor does not touch it.** That is the first unmitigated damage in the
> physical path, and the reason this module reports its own total rather than folding into `rawDps`.
> 
> **It is faction-split, and the split is enormous.** Seal of Blood is a Blood Elf spell — Horde
> only, in Phase 2, before 2.4 gave Alliance the identical Seal of the Martyr. Judgement of Blood
> deals **295-325**; Judgement of Command deals **68-73**. That is not a rounding difference, it is
> the reason Horde Retribution was ahead for the whole of early TBC, and modelling one for both
> factions would have been wrong by a factor of four on that component alone.
> 
> Sources: tooltips for spells 20271 (the Judgement button), 31892/31898 (Seal and Judgement of
> Blood) and 20375 (Seal of Command, whose tooltip carries its own judgement numbers), read the same
> way `ingest-buff-scope.mjs` reads them; cross-checked against wowsims/tbc `sim/paladin/seals.go`
> and `sim/paladin/judgement.go` at 3301fca5 where upstream implements them.

## Exports

**function** — `estimatePaladinHolyDamage`

**const** — `JUDGEMENT_COOLDOWN_SECONDS`, `JUDGEMENT_OF_BLOOD_DAMAGE`, `JUDGEMENT_OF_BLOOD_SPELL_POWER_COEFFICIENT`, `JUDGEMENT_OF_COMMAND_DAMAGE`, `SEAL_OF_BLOOD_WEAPON_FRACTION`, `SEAL_OF_COMMAND_INTERNAL_COOLDOWN_SECONDS`, `SEAL_OF_COMMAND_PROCS_PER_MINUTE`, `SEAL_OF_COMMAND_WEAPON_FRACTION`

**type** — `PaladinHolyEstimate`, `PaladinHolyInput`

## Imports

- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`

## Imported by

- [[features.simulator.calculateSimulation]] — `src/features/simulator/calculateSimulation.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
