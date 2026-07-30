---
name: brain-sync
description: Regenerate and extend the Obsidian brain vault under brain/. Use when the user asks to update the brain, refresh the vault, sync the graph, add a concept note, document a new module or domain area, or after any change that adds/removes source files or domain data (new raid, new spec, new panel, new domain folder). Also use when a wikilink is broken or the graph looks wrong.
---

# Brain sync

The vault under `brain/` is generated from the real source tree and the real domain data by
`tools/brain/generate-brain.mjs`. It is not hand-maintained, and it must not be hand-maintained
above the manual marker.

## The one command

```bash
npm run brain
```

It prints how many notes were written vs. unchanged, how many modules were mapped, and fails with a
non-zero exit code listing every broken wikilink. **A run that reports broken links is a failure —
fix it, do not commit it.**

The generator is idempotent: a second run immediately after the first must report `0 written`. If it
does not, something in the generated output is non-deterministic (a timestamp, a count of its own
notes) and that is a bug in the generator, not expected churn — this repo lives in OneDrive, so
gratuitous mtime changes cause real sync noise.

## What is safe to edit

| Thing | Edit it? |
| --- | --- |
| Anything in a note **above** `<!-- brain:manual -->` | No — regenerating overwrites it |
| Anything **below** `<!-- brain:manual -->` | Yes — preserved verbatim forever |
| `CONCEPTS` in the generator | Yes — this is where curated prose lives |
| `PHASES` in the generator | Yes — status text is authored, module links are generated |
| `.obsidian/graph.json` colour groups | Generated. Edit the generator's `updateGraphConfig` |

So: **project knowledge that cannot be derived from code goes in the generator, not in a note.**
A fact typed directly into a note body above the marker is a fact that will silently disappear.

## Adding a concept note

Append to the `CONCEPTS` array in the generator:

```js
{
  title: 'Threat',
  summary: 'One line that shows up in the knowledge map.',
  body: `Multi-paragraph markdown. Explain the mechanic and, more usefully, explain the thing
about it that is counter-intuitive or that this project gets wrong.`,
  modules: ['domain/simulation/attackTable.ts'],   // repo-relative under src/
  related: ['Attack Table', 'Tank'],               // note titles — the link checker verifies these
}
```

Every `modules` entry must be a real path under `src/` and every `related` entry must be a real note
title or an alias, or `npm run brain` fails. That is the point.

## When source structure changes

Adding a source file, a domain folder, or a whole feature needs no generator change — module notes,
import edges, and the architecture map all come from the tree. Two cases *do* need a change:

1. **New domain data worth its own notes** (a new raid tier, talents, a rotation model). Add the
   export to `DOMAIN_ENTRY` in the generator, then write the note-emitting block. Look at how
   `writeDomainNotes` handles raids for the pattern: iterate the real data, link to the modules that
   own it, and never restate a number the data already carries.
2. **A new layer** under `src/`. Add it to `LAYER_BY_PREFIX`, `layerOrder`, and `layerBlurb`, and give
   it a colour group in `updateGraphConfig`.

## How the data actually loads

The domain modules use extensionless bundler-style imports, which Node's ESM loader will not resolve.
The generator writes a temp entry into `node_modules/.brain/`, bundles it with the `rolldown` that
Vite already depends on, and imports the bundle. **Do not add a bundler or a TS runner for this** —
the whole point is zero new dependencies. If a new export fails with `MISSING_EXPORT`, the name in
`DOMAIN_ENTRY` is wrong; check the actual `export` line in the source file rather than guessing from
the type name.

## Verifying

1. `npm run brain` → all wikilinks resolve.
2. `npm run brain` again → `0 written`.
3. Spot-read one generated note per category you touched. Counts and prose should match the data —
   if a count looks wrong, suspect the data before the generator.
