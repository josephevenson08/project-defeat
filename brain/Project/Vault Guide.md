---
type: reference
generated: true
tags: [brain/project]
---

# Vault Guide

How this vault works, so future-you does not have to reverse-engineer it.

## Regenerating

```bash
npm run brain
```

The generator reads the real source tree and the real domain data — module edges come from actual import statements, and class/spec/raid/boss/profession notes come from the data files themselves. Nothing about the project is duplicated by hand, so the vault cannot drift from the code without the code changing.

## Hand-written notes survive

Every note ends with a `<!-- brain:manual -->` marker. Anything you write below it is preserved verbatim on regeneration. Anything above it will be overwritten.

## Reading the graph

- **Architecture/Modules** — the dependency graph. Hubs are visible as high-degree nodes; a `domain → features` edge here is a layering regression.
- **Domain** — the TBC knowledge wiki. Class → spec → role → raid → boss chains, plus concept notes for the mechanics.
- **Project** — roadmap phases, decisions, provenance, limitations.

Graph colour groups are configured in `.obsidian/graph.json` so each layer reads at a glance.

## Note naming

Module notes use dotted module paths (`domain.raids.raidTypes`) because basenames collide across folders — there are several `index.ts` and two `characterTypes.ts`. Spec notes are `<Spec> <Class>` because spec names are not unique either: Holy, Protection, and Restoration are each shared by two classes.

Up: [[Project Defeat Brain]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
