# Project Defeat — handoff

**Written 2026-08-09.** Self-contained brief for picking this up in a fresh chat. If `git log`
disagrees with this file, trust git.

Repo: `C:\Users\josep\OneDrive - Saint Louis University\Project Defeat`, on GitHub as
`josephevenson08/project-defeat`, currently at **`41f3789`**, everything pushed.

---

## Live site

**https://josephevenson08.github.io/project-defeat/** — deployed by `.github/workflows/deploy.yml`
on every push to `main`, gated on `tsc`/`lint`/`build`. Playwright is deliberately not run in CI (it
needs browser downloads and a dev server); it runs locally before a push, which is what the commit
gate rule below is about.

`vite.config.ts` sets `base` **for builds only**. Pages serves this as a project site under
`/project-defeat/`, but the dev server and the whole Playwright suite address the app at `/`, so
setting `base` globally sends every test to a path nothing serves.

## Rules

- **Push to `origin/main` after each completed feature.** No branches or PRs unless asked.
- **Gate commits on the real test exit code**, never a piped `tail` — the pipe reports the tail's
  status, and a red commit was pushed that way once.
- **If a test run dies partway with `ERR_CONNECTION_REFUSED`, it is the dev server, not the tests.**
  Seen twice in a row from a worktree: tests 1-40 pass, then every remaining test fails to reach
  127.0.0.1:5173 because the Playwright-managed Vite server has exited. Cause unknown. The fix is to
  start the server yourself on 5173 first — `reuseExistingServer: true` means Playwright adopts it
  instead of managing its own — after which the full suite passes. Read the exit code, but read the
  *failure mode* too: a dead server and a broken assertion both come back as exit 1.
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
npx playwright test --reporter=line   # 80 passed, 0 skipped, 0 failed
npm run brain                         # "all wikilinks resolve"
npm run brain                         # "0 written" — idempotent
```

---

## What the app is

A local-first React + TypeScript + Vite planner for WoW TBC Classic, targeting Phase 2 (SSC/TK,
Tier 5). No backend, no runtime network calls — typed data and generated JSON in the repo.

**Layout:** intro → a **section picker** (Character Planner / Raids / Professions) → the chosen
section, with a tab bar for moving between them afterwards. Discord skeleton underneath: a left rail,
one main pane, popups layered over rather than modes you travel between. Tesla's restraint in the
palette, Nothing's detailing: flat surfaces, hairline rules, tracked uppercase mono labels, tabular
figures, no gradients.

**The rail is section-specific.** Planner: the character selects plus the stat readout. Raids: the
raid switcher. Professions: none. A rail of numbers beside a loot table would describe something not
on screen.

**Entering the planner runs character creation** — four steps, faction → race → class → spec, each
committing immediately so an earlier change re-narrows everything after it. A restored build skips
it; the rail's "Start over" reopens it.

**Colour policy:** item quality colour is information, not decoration, so it stays and everything
else is near-monochrome *specifically so quality reads first*. Socket colours likewise. Role accents
keep a muted hue. Audited: the only saturated colours anywhere are item quality and the warn amber.

## The data

Six datasets, all real, all from pinned sources. Regenerate any of them:

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
node tools/ingest/ingest-talents.mjs --class Warrior  # 66 Warrior talents
node tools/ingest/wowhead-lookup.mjs --spell-name "Battle Shout"  # read-only lookup aid
node tools/ingest/ingest-tier-lists.mjs         # 3 spec tier lists, 28 placements
node tools/ingest/ingest-icons.mjs              # icon *names* for 4,741 items and gems
node tools/ingest/fetch-icons.mjs               # the artwork itself -> public/icons/ (1,238 files)
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
| Target debuffs | 6, all unverified | **6**, each cited to a spell rank |
| Tier set bonuses | 9 sets, partly paraphrased | **34 sets** (T4 + T5), 71 bonuses, verbatim |
| Talents | none | **66**, Warrior only |
| Spec tier lists | none | **3 lists**, 28 placements, all 27 specs |
| Item/gem icons | none, two-letter glyphs | **4,741 mapped**, 1,238 files vendored, 2.1 MB |

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
- **Individual spell pages carry the tooltip in `g_spells[<id>].tooltip_enus`**, and item pages in
  `g_items[<id>].tooltip_enus` — an item tooltip embeds its whole set listing and every "(2) Set:"
  line, so one piece sources a set's bonuses. Both are far more reliable than the prose the old
  parser was fighting. `tools/ingest/wowhead-lookup.mjs` does the fetching, decoding and
  rank-disambiguation; it prints and writes nothing, because the reading is the part that has to
  stay human.
- **"Improved <totem>" spell names in the 37xxx range are Tier 4 set bonuses, not talents.** 37223
  "Improved Strength of Earth", 37210 "Improved Mana Spring Totem" and 37212 "Improved Wrath of Air
  Totem" are the Cyclone 2-piece bonuses. This is easy to get backwards because the real talents
  reach similar numbers by a different route — Enhancing Totems (2 ranks, +15%) takes Strength of
  Earth to the same 98 the set bonus reaches by adding a flat 12. The talent that raises Mana Spring
  is called **Restorative Totems**, not "Improved Mana Spring Totem"; there is no Improved Wrath of
  Air Totem talent at all.
- **Icon names come from the upstream the catalogue already uses, not from scraping Wowhead.**
  `assets/item_data/all_item_tooltips.csv` in wowsims/tbc, at the same pinned commit, carries an
  `"icon"` field for ~30,000 items — one request for the whole mapping. Two dead ends first: wowsims'
  `all_items.go` has no icon field at all, and Wowhead's item *listviews* carry `displayid` rather
  than an icon name, cap out around 1,720 rows, and apply their URL category filters client-side —
  `/tbc/items/head/quality:4` and `/tbc/items/quality:4` return byte-identical HTML.
- **`allItems` is 4,560 while `itemCatalogue.json` is 4,505.** `itemCatalogue.ts` merges the ingested
  catalogue, the Wowhead-only supplement and the curated provenance layer. Any script deriving a
  per-item dataset must read `allItems`, not the JSON — reading the JSON silently missed "Blessed
  Book of Nagrand", which reached the paperdoll with no icon.
- **124 of the 272 raid loot entries name an item the catalogue does not carry**, so they render the
  `??` fallback rather than art. This predates icons entirely and is not caused by them — those rows
  always showed `??`. What changed is that it is now *visible*: uniform placeholders made a resolved
  and an unresolved row look alike. Worst is Karazhan at 19 of 45. `supplement-items.mjs` is the
  mechanism for closing it.
- **Wowhead's tier lists are markup, not prose, which makes them the easiest ingest in the repo.**
  `[tier-list=rows]` wraps `[tier]` blocks carrying `[tier-label bg=qN]S[/tier-label]` and a
  `[tier-content]` of `[spec-badge=arcane-mage]` slugs. Read the spec from the **badge**, never from
  the `[url guide= hash=]` wrapped around it: on the healer page the Discipline Priest badge sits
  inside a link whose hash says `holy-priest`, because Wowhead publishes one shared Priest healing
  guide. Trusting the hash files Discipline under Holy and silently loses a spec.
- **The same spec can hold two different tier placements, and that is not a conflict.** Feral Druid is
  C-tier on the DPS list and S-tier on the tank list. Tier data is keyed by (role, spec) for this
  reason; the app's own `CharacterRole` is a *different* axis that classifies Feral once, as
  `Physical DPS`, so the two cannot be merged.
- **Wowhead draws tier letters in item-quality colours and this app deliberately does not.** S is
  `q5`, A is `q4`, B is `q3` on their pages. Reusing quality colour to mean "this spec is strong"
  would make the one chromatic signal in this interface ambiguous, so rank reads through the text
  ramp instead. Five tiers against four text tokens is why the rule beside each row steps down half a
  beat after the ink does — without that, B and C rendered identically, which only a measurement of
  the running page caught.
- **wowsims is not infallible where it disagrees with a tooltip.** It models Blessing of Wisdom at
  42 mp5; spells 27142 and 27143 both say 41. That was the only outright conflict across all 33 —
  everything else agreed to the digit — but it is the reason the tooltip is the tie-breaker.
- **The six target debuffs went the same way, and five of the six were wrong.** The three armor
  debuffs were stored as *fractions* of the target's armor (20%, 8%, 5%) and TBC has no percentage
  armor debuff: Sunder Armor is 520 flat per stack (2600 at 5), Faerie Fire 610, Curse of
  Recklessness 800, and they all stack. `armorReductionPercent` was therefore the wrong *shape*, not
  just the wrong number, and is now `armorReduction` in flat points. Winter's Chill was giving +10%
  crit to every caster when it is Frost-only, and Improved Seal of the Crusader was physical-only
  when its tooltip says "all attacks". Curse of the Elements' 10% was the one value that survived.
- **The tooltip-vs-wowsims tie-breaker went unused on the debuffs** — all six agreed to the digit,
  including every number that overturned what had shipped. Two sources agreeing is what makes a
  correction safe to make against data that already looked plausible.
- **Spell school is the thing the simulation cannot express.** Nothing in `SignatureAbility` or the
  simulator records whether a cast is Frost or Shadow, which is the whole reason Winter's Chill is
  `notModelled` rather than applied. Curse of the Elements is school-scoped too but stays modelled
  because it covers every modelled caster except Elemental Shaman. Adding schools would let both be
  exact.
- **Fifteen of the 33 buffs cannot be expressed as stats at all** (threat, maximum health,
  resistances, damage multipliers, weapon procs, timed cooldowns). They carry `notModelled` and
  render without a checkbox rather than being omitted. Adding any of them to the model properly
  means new `StatBlock` fields or simulation plumbing, not a data edit.

---

## What's left

### 1. The simulation's own known gaps

Now visible on the Simulation tab, so its limitations are visible too. Still open: healer HPS has
**no mana constraint**, meta gem activation requirements are **never checked**, weapon and armour
procs are unpopulated (schema exists, data does not), and rotations cover 2 specs of 27.

**On the low melee DPS — the diagnosis has changed.** This was recorded as "rotation modelling is
the acknowledged gap", but investigating it found the larger cause was an attack-table bug, now
fixed: the player's white and special tables applied **parry and block** to a melee DPS. Both
require the defender to be *facing* the attacker, and a melee DPS is behind the boss all fight, so
against a level 73 target that deleted 14% parry plus 5% block from every swing. Fixing it moved a
Fury Warrior from 125 to 148 DPS and took hit chance from 21.7% to 39.2%. `attacksFromBehind` is now
a required input on both builders, so a future front-facing caller has to state its position.

A multi-ability rotation resolver already exists (`resolveRotation`), with GCD and energy budgeting,
and Fury already layers Bloodthirst and Whirlwind onto white damage. What it cannot do is **rage**:
`computeUsageRate` returns `unmodelled` for any rage-costed ability without a cooldown, so Heroic
Strike — a large slice of real Fury damage — contributes nothing. A rage model is the next real step
for melee, not a priority-list engine, which is mostly already there.

### 2. UI — the requested rework is done

Everything below shipped this session, each as its own commit. What is left is listed at the end.

- **Section picker** in front of the tab bar; **stat rail scoped to the planner**.
- **Character creation journey**; the Character panel is gone from the tab and its four selects live
  in the rail. The role card and racial traits list were removed by request — the role still drives
  every accent and `applyRacialTraits` still feeds the totals, they are just not restated.
- **Gear paperdoll** — armour left, everything else right, weapons across the bottom, right column
  mirrored so glyphs sit on the outer edge. Spec filtering is unchanged.
- **Gem sockets** show the gem, its stats, and whether the socket bonus is *earned right now*.
- **Ranked-gear rows** rebuilt: frame, one identity line, filled Equip. Farm and Notes removed,
  crafting kept.
- **Gear popup split in two** — picker left, the choice's stats, rank, enchant, sockets and source
  right. It previously never showed item stats at all.
- **Warrior talents**, ingested. See below.
- **Raids rebuilt** — a picker first, loot only, other raids in the rail. Boss mechanics and role
  notes deliberately removed; attunement chains kept, since access is not a fight guide.
- **Colour**: section, raid and talent-tree accents; real gem colours; item quality as a hairline on
  each paperdoll slot; enchants in the game's green.

**Buffs & Consumables and the Simulation tab are both hidden, not deleted.** Panels and data are
untouched on disk; `src/featureFlags.ts` explains the simulation one, and `?simulation=1` brings it
back for the tests. The buff/consumable/debuff id lists stay in `App` because `calculateStats`,
`findUpgrades` and the saved-build format all still read them.

### 2a. Earlier UI audit — three fixes applied, two findings retracted

A measured audit of the running app (not a stylesheet read) found and fixed:

- **`--text-faint` failed WCAG AA.** `#6e6e6e` measured **3.88:1** on `--surface-0`, and it carries
  every uppercase eyebrow plus the rail's group headers — all 11-12px, none large text. Now
  `#858585`, 5.37:1 on `--surface-0` and 5.08:1 on the rail.
- **14 hardcoded `color: #ffffff`** bypassed the token system — an undocumented fourth text level.
  Named as `--text-strong` rather than flattened, because the emphasis was doing real work.
- **`small` was the browser default** 0.8333em → 13.3333px, a size nobody chose. Pinned to 13px.
- **Panel section headings** were 14px in two places and 15px in a third. Unified to 15px.

**Two findings did not survive verification, and are recorded so they are not "re-found":**

- The buff checkboxes look like 31 sub-minimum tap targets at 13x13, but the `<label>` wraps the
  input and *is* the target, at 405x58 with a pointer cursor. WCAG 2.2 SC 2.5.8 already passed.
- Apparent 158-character line lengths were short labels in wide containers. Only one element
  (`.panel-copy`) genuinely ran long, at ~117 chars/line; it is now capped at `72ch`.

Still open, and deliberately left for a design decision rather than guessed at:

- **The planner tab is a single ~25,000px scroll column** — about 35 screen-heights — stacking
  Character, Gear, BiS, Buffs and Build. Reaching Buffs means scrolling past 19 gear slots. The rail
  solved "don't lose your numbers when you move between tabs"; nothing solves moving *within* the
  planner. Sub-tabs, a jump nav, or collapsible panels are all plausible; it is not a styling fix.
- **The rail shows stats the spec cannot use.** On a Fury Warrior: Feral AP, Ranged AP, the entire
  six-row Spell group, and six rows reading 0 — roughly 12 of 27 rows carrying no information, on
  the one surface that is always visible.
- **`h3` is styled at five sizes** (11, 13, 15, 20px and a mono label variant). The 11px mono
  uppercase one is a deliberate label pattern, not a smaller heading, so this is not purely a bug —
  but the tag is doing two different jobs and that is worth resolving deliberately.
- Base surface is `#0a0a0a`, near-pure black. Material and Smashing both recommend ~`#121212`;
  pure black maximises halation and spends the darkest value available. Left alone — it is a
  deliberate part of the stated aesthetic and the contrast measurements all pass.

### 3. The requested rework — all three remaining items are now done

Nothing is outstanding here. Kept as a record of what each one turned out to involve, since two of
the three were mis-scoped going in.

- ~~Professions levelling guides~~ — **done, all 9.** Every crafting profession has a sourced
  300-375 path with real craft counts and material quantities. Remaining `needsVerification` flags in
  `sampleCraftingGuides.ts` are all on pre-300 vanilla ranges, which are deliberately out of scope.

- ~~Spec tier-list view~~ — **done.** Its own section and tab, 28 placements across the three Wowhead
  Phase 2 lists, covering all 27 specs. `tools/ingest/ingest-tier-lists.mjs` regenerates it. As
  suspected, these rank *specs*, not items, and nothing wires them into the per-slot BiS lists.

- ~~Item and gem icons~~ — **done, vendored.** The size estimate that made this look like a hard
  call was wrong by an order of magnitude: 4,741 catalogued entries share only **1,238 distinct
  icons**, and at Wowhead's 56×56 "large" that is **2.1 MB**, not 15-25. Vendoring therefore costs
  little and keeps the no-runtime-network-calls invariant intact, so the hotlinking option was never
  actually worth its downside.

### 4. Talents — Warrior only, by design

66 talents across Arms, Fury and Protection, ingested by `tools/ingest/ingest-talents.mjs`. Adding a
class is one line in `TREES_BY_CLASS` plus a re-run; classes without data say so rather than
rendering an empty tree.

The calculator page is an empty shell. The trees come from
`nether.wowhead.com/tbc/data/talents-classic` as **two payloads that must be joined**: a
`WH.setPageData` grid with rows, columns, ranks and prerequisites, and a `WH.Gatherer.addData(6, …)`
call further down the same file with the spell rows. The grid never names a talent — a talent is
named after its rank-1 spell.

`canRemovePoint` keeps a row-requirement guard that **provably cannot fire**: a row needs `row * 5`
points counting the deep point itself, so placing one always leaves the total a point clear of the
gate. Documented in place, and a test pins the reasoning so it is not mistaken for reachable code.

### 5. Polish

- Tier set bonuses now cover **all 34 sets of Tier 4 and Tier 5** — 17 each, 71 bonuses — read
  verbatim off the Wowhead item page in `sourcedFrom`. The other 188 ingested set names (Tier 6,
  dungeon, PvP) are deliberately undefined and show nothing rather than inventing bonuses. Tier 6 is
  the next batch if wanted, though it is past this app's stated Phase 2 target.
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
