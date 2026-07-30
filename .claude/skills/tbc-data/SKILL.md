---
name: tbc-data
description: Add or correct TBC game data in this repo — items, BiS rankings, gems, enchants, buffs, debuffs, consumables, raid bosses, raid loot, attunement steps, signature abilities, profession tiers, or material farm spots. Use when the user asks to add a spec's BiS, catalog an item, add a boss or raid, clear needsVerification flags, reconcile data against Wowhead, or expand any sample*.ts data file under src/domain.
---

# Adding TBC data

Data in `src/domain/**` is typed TBC knowledge. Everything here is about keeping it honest, because
the project's whole credibility rests on the difference between "sourced" and "we made it up".

## The rule that matters most

**Every value you did not read off a real source gets `needsVerification: true`.**

No exceptions, and no quiet upgrades. If you approximated a stat block from a stat budget, flagged.
If you inferred a drop from a guide summary, flagged. If you remembered it confidently, flagged —
confident memory is exactly what the flag exists to catch. The UI surfaces the flag; hiding it turns
a useful planner into a misleading one.

Clearing a flag is a real change with a real justification: you checked an actual item tooltip. Say
which one in the `notes` field if it is at all ambiguous.

## Where things live

| Data | File |
| --- | --- |
| Item catalog | `src/domain/gear/sampleItems.ts` |
| Per-spec BiS | `src/domain/bis/<spec><Class>Phase<N>.ts`, registered in `bisLists.ts` |
| Gems / enchants | `src/domain/gems/sampleGems.ts`, `src/domain/enchants/sampleEnchants.ts` |
| Buffs / target debuffs | `src/domain/buffs/sampleBuffs.ts`, `sampleTargetDebuffs.ts` |
| Consumables | `src/domain/consumables/sampleConsumables.ts` |
| Raids / bosses / attunements | `src/domain/raids/` — one file per raid's bosses |
| Signature abilities | `src/domain/abilities/signatureAbilities<Class>.ts` |
| Professions | `src/domain/professions/` |

Adding a file under a barrel (`bis/`, `raids/`, `abilities/`, `professions/`) means registering it in
that folder's aggregator too. Forgetting is silent: the data exists and nothing reads it.

## Item data

- `id` is a kebab-case slug, unique across the catalog. `wowItemId` is the real numeric ID and only
  goes in when you are sure — a wrong one is worse than a missing one. There is a known bad example
  in the catalog (`training-sword` → 28034 resolves to an unrelated item); do not add more.
- Source metadata is not optional decoration. `instance` / `boss` / `vendor` / `reputation` /
  `craftedBy` are what make BiS lists double as acquisition plans.
- `instance` strings must match one of a raid's `instanceNames` in `sampleRaids.ts`, or the raid
  cross-links break. Note that some instances legitimately have two spellings.
- Weapons need `weaponSpeed`, `weaponDamageMin`, `weaponDamageMax` or the simulator sees attack power
  only and understates them.
- Crafted items should carry full `crafting` detail — required skill, specialization, recipe source,
  and each material's own farm source. Half-filled crafting info is worse than none: it reads as
  complete.

## BiS entries

A `RankedGearEntry` is `{ className, spec, phase, slot, rank, itemId, sourceName, source? }`. `rank`
is 1-based within a slot, so a slot with three options has ranks 1–3.

`itemId` must resolve in the catalog. If the real BiS item is not catalogued yet, either catalogue it
first or leave it out — never invent an id to make a list look complete.

## Raid data

- A boss's `mechanics` field is 2–4 sentences covering **only what changes how someone plays the
  fight**. Not lore, not a full ability list. Compare against the existing entries before writing.
- `roleNotes` is one sentence per role, and only for roles the fight actually asks something of.
- `loot` lists notable drops, not full loot tables. A drop with no `itemId` is fine and normal — set
  `needsVerification: true` and say in `notes` that it is a real drop not yet in the catalog.
- A raid's `phase` is the phase it was *current content* for, not the phase it is still worth running.

## Researching

Wowhead and WoWSims are the sources. Wowhead's guide pages are JavaScript-rendered, so a fetch often
returns a shell rather than the stat block — when that happens, say so and flag the value, rather than
filling the gap from memory and presenting it as sourced. Static summary pages and item tooltip pages
are more reliable than guide pages.

## Verifying

```bash
npx tsc -b          # types, and the catch-all for a barrel you forgot to update
npm run test        # Playwright — includes a full-coverage check that every class/spec resolves to a BiS list
npm run brain       # domain notes and counts pick up new data automatically
```

Then update `README.md` and `ROADMAP.md` if coverage changed, and re-read what you wrote there: those
two files are the project's own honesty statement and they go stale fastest.
