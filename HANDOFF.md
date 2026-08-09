# Project Defeat — handoff

**Written 2026-08-09.** Self-contained brief for picking this up in a fresh chat. If `git log`
disagrees with this file, trust git.

Repo: `C:\Users\josep\OneDrive - Saint Louis University\Project Defeat`, on GitHub as
`josephevenson08/project-defeat`, currently at **`0cfefb6`**, everything pushed.

---

## Rules

- **Push to `origin/main` after each completed feature.** No branches or PRs unless asked.
- **Gate commits on the real test exit code**, never a piped `tail` — the pipe reports the tail's
  status, and a red commit was pushed that way once.
- **Line endings differ by file.** `src/styles/global.css` is CRLF; `tests/planner.spec.ts` and most
  of `tools/ingest/*.mjs` are LF. Check with `file` before any scripted edit — a `\r\n` split against
  an LF file silently matches nothing and "succeeds".
- **`npm run brain` must stay idempotent** (a second run reports `0 written`). The repo lives in
  OneDrive, so churn matters.
- **Wowhead rate-limits (HTTP 403)** once a run checks several candidate pages per lookup. Every
  ingest script caches to `tools/ingest/.cache/` — reuse it rather than re-fetching.
- **Leave `Untitled.canvas` alone**, it's the user's own file.
- **Never invent data.** Anything not read off a real source gets `needsVerification: true`. This
  project's whole history is recovering from plausible-looking invented values.

## Verify you're where this describes

```bash
npx tsc -b                            # exit 0
npm run lint                          # exit 0
npm run build                         # exit 0
npx playwright test --reporter=line   # 64 passed, 0 skipped, 0 failed
npm run brain                         # "all wikilinks resolve"
npm run brain                         # "0 written" — idempotent
```

---

## What the app is

A local-first React + TypeScript + Vite planner for WoW TBC Classic, targeting Phase 2 (SSC/TK,
Tier 5). No backend, no runtime network calls — typed data and generated JSON in the repo.

**Layout:** Discord skeleton — a persistent left rail holding the stat readout, one main pane, four
tabs (Character Planner, Simulation, Raids, Professions), popups layered over rather than modes you
travel between. Tesla's restraint in the palette, Nothing's detailing: flat surfaces, hairline rules,
tracked uppercase mono labels, tabular figures, no gradients.

**Colour policy:** item quality colour is information, not decoration, so it stays and everything
else is near-monochrome *specifically so quality reads first*. Socket colours likewise. Role accents
keep a muted hue. Audited: the only saturated colours anywhere are item quality and the warn amber.

## The data

Five datasets, all real, all from pinned sources. Regenerate any of them:

```bash
node tools/ingest/ingest-items.mjs              # 4,505 items from wowsims/tbc @3301fca5
node tools/ingest/supplement-items.mjs          # +23 Wowhead-only items
node tools/ingest/ingest-gems-enchants.mjs      # 212 gems, 79 enchants
node tools/ingest/supplement-enchants.mjs       # +15 Wowhead-only enchants
node tools/ingest/ingest-consumables.mjs        # 31 flasks/elixirs/foods
node tools/ingest/ingest-bis.mjs                # BiS rankings, 27 specs
node tools/ingest/ingest-bis-recommendations.mjs # gem + enchant picks per spec
node tools/ingest/validate-sample.mjs --sample 32 --max-phase 2 --quality Epic
node tools/ingest/reconcile-curated.mjs --check-wowhead
```

| | Was | Now |
|---|---|---|
| Items | 230, inferred | **4,560** merged, validated |
| BiS entries | 463, only 2 deeper than rank 1 | **1,440** across 27 specs |
| Gems | 11 | **212** |
| Enchants | 22 | **91** |
| Consumables | 14 | **31** |
| Gem/enchant recommendations | none | **107 + 274** |
| Raid buffs | 14, all unverified | **33**, each cited to a spell rank |

---

## Findings worth not rediscovering

- **The old catalogue was inferred, not sourced.** Of 98 hand-written entries matching an ingested
  item, 87 disagreed; all 119 verifiable conflicts went to live Wowhead tooltips and scored
  **curated 0, ingested 119**. `sampleItems.ts` is now a *provenance* layer only — drop location,
  roles, crafting, trinket effects. Never add mechanical data there.
- **TBC gem colours are not socket colours.** Sockets are Red/Yellow/Blue/Meta; gems add three
  hybrids and they are the majority (118 of 212). `gemFitsSocket` encodes it: a hybrid counts as
  *both* its component colours.
- **Wowhead guides are client-rendered but their source is in the served HTML** as escaped BBCode
  inside the page's JSON. Parsing that beats driving a browser and is reproducible.
- **Wowhead redirects can serve the wrong expansion.** Several spec-specific enchant-guide URLs 301
  to the *Cataclysm* version. `ingest-bis-recommendations.mjs` checks each page's title; TBC pages
  say either "TBC Classic" or "Burning Crusade Classic 2.5.1".
- **Names are the classic trap.** Ingestion corrected "Cataclysm Headguard" → *Cataclysm Helm*,
  "The Nexus-Key" → *The Nexus Key*, "Voidheart Cover" (fictional) → *Voidheart Crown*, and
  "Elixir of Major Fire Power" → *Elixir of Major Firepower*.
- **Three BiS slots have no ranking, correctly** — Feral and Retribution swing two-handers, and the
  Holy Paladin guide publishes no Libram section. Recorded in `RANKING_GAPS` in the test file.
- **The raid buffs were the last invented dataset, and five of the fourteen were wrong** — not
  approximate, wrong. Gift of the Wild was modelled as +5% to all stats when it is a flat +14; Wrath
  of Air Totem as spell haste when it is spell power (haste is the WotLK version of that totem);
  Totem of Wrath as 141 spell power when it grants none at all. Now 33 entries, each with the
  `spellId` of the rank its numbers were read from.
- **Wowhead's *listing* page is what makes spell selection unambiguous.** The earlier attempt failed
  partly on picking the right spell. `/tbc/spells/name:X` carries rank, level and required class per
  row, which is enough to take the max rank a raid uses and reject the NPC copies. The rows live in
  a `var listviewspells = [...]` assignment in the served HTML — the `new Listview({...})` call
  further down only references the variable, so reading that call gets you an identifier, not data.
  The rows are JS object literals, not JSON (`quality:-1` is unquoted), and spell names contain
  colons, so bare keys have to be quoted with a scanner rather than a regex.
- **Individual spell pages carry the tooltip in `g_spells[<id>].tooltip_enus`**, which is far more
  reliable than the prose the old parser was fighting.
- **wowsims is not infallible where it disagrees with a tooltip.** It models Blessing of Wisdom at
  42 mp5; spells 27142 and 27143 both say 41. That was the only outright conflict across all 33 —
  everything else agreed to the digit — but it is the reason the tooltip is the tie-breaker.
- **Fifteen of the 33 buffs cannot be expressed as stats at all** (threat, maximum health,
  resistances, damage multipliers, weapon procs, timed cooldowns). They carry `notModelled` and
  render without a checkbox rather than being omitted. Adding any of them to the model properly
  means new `StatBlock` fields or simulation plumbing, not a data edit.

---

## What's left

### 1. The simulation's own known gaps

Now visible on the Simulation tab, so its limitations are visible too. A geared Fury warrior reads
~158 DPS, which is low — rotation modelling is the acknowledged gap and the panel says so. Also:
healer HPS has **no mana constraint**, meta gem activation requirements are **never checked**, weapon
and armour procs are unpopulated (schema exists, data does not), and rotations cover 2 specs of 27.

### 2. Polish

- Tier set bonuses are defined for only **9 sets against 222** ingested set names, so most sets
  correctly show nothing rather than inventing bonuses.
- The BiS and Buffs panels are on the design tokens but still use the older layout shapes; they'd
  benefit from the treatment the gear panel got.

---

## Repo conventions that encode real, repeated mistakes

- `domain/` never imports from `features/` or `components/`. The only architectural invariant.
- **Never ship a module nothing renders.** This repo has done it three times.
- When `npx tsc -b` flags an unused import, find out what it was for before deleting it — that is how
  half-finished work gets discovered here.
- Counts are computed, never written into prose. `brain/Project/Roadmap Board.md` computes them.
- **`npm run brain` does not prune orphaned notes.** Delete a source file and its
  `brain/Architecture/Modules/*.md` stays on disk describing a file that no longer exists — the run
  still reports "all wikilinks resolve", because nothing links to it any more. Delete the note by
  hand. A blanket prune would be wrong: the generator manages 240 of the 269 notes in the vault and
  the rest are hand-written.
- Node ESM cannot resolve this repo's extensionless imports. Scripts that import app code use
  `registerHooks` to retry with `.ts`, and `pathToFileURL` because Windows drive letters parse as a
  URL scheme. Copy that pattern.
- `.claude/agents/` is not registered as agent types in every environment. Dispatch a
  `general-purpose` agent and paste the agent file's contents into the prompt instead.
- **Verify in the browser, not just in the diff.** A grep using a non-capturing group silently
  under-reported and left a legacy surface behind; the browser audit is what caught it.
