---
type: module
layer: domain
source: src/domain/professions/professionPayoffs.ts
lines: 335
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.professions.professionPayoffs

`src/domain/professions/professionPayoffs.ts` · **domain** layer · 335 lines

From the top of the file:

> What a profession is actually worth once you are 70.
> 
> **This exists because the app promised it and did not deliver it.** The landing page has said
> "how to take a profession to 375 without wasting materials, and what each one is actually worth at
> 70" since the Professions tab was built; the first half is the levelling guides, and nothing
> anywhere answered the second half. A claim in your own copy that no code path satisfies is the
> same class of defect as a wrong number.
> 
> **Almost none of it is a stat bonus, and getting that wrong is the easy mistake.** The roadmap
> item this closes was written as "profession *bonuses to stats* (e.g. extra sockets from
> Blacksmithing)" — which is Wrath. So are Herbalism's Lifeblood, Mining's Toughness and Skinning's
> Master of Anatomy, and so is Leatherworking's Fur Lining. In The Burning Crusade exactly one
> profession gives a level 70 character an always-on stat bonus, and it is Enchanting. Everything
> else is *access*: bind-on-pickup gear only you can wear, or a consumable only you can make.
> 
> That distinction is carried in `kind` rather than flattened, because it changes what a player does
> with the information. A stat bonus is a number you can add up; gear access is a slot you now have a
> different option for; a gathering profession's payoff is entirely in what it feeds.

## Exports

**function** — `payoffFor`

**const** — `professionPayoffs`, `professionsWithStatPayoff`

**type** — `PayoffKind`, `ProfessionPayoff`, `ProfessionPerk`

## Imports

- [[domain.professions.professionTypes]] — `src/domain/professions/professionTypes.ts`

## Imported by

- [[domain.professions.index]] — `src/domain/professions/index.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
