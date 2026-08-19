# Project Defeat — handoff

**Started 2026-08-09, substantially rewritten 2026-08-15.** Self-contained brief for picking this up
in a fresh chat. If `git log` disagrees with this file, trust git.

**The first 2026-08-15 session** shipped: the spec tier-list view; a merge of the target-debuff
rebuild; item and gem icons; planner sub-tabs and a spec-scoped stat rail; talents for all nine
classes; a rage model; the two-hander/off-hand fix and the weapon-proficiency and upgrade-finder
bugs it exposed; melee haste; trinket and weapon effects; the healer mana constraint; and meta gem
activation.

**The second 2026-08-15 session** (`773a8eb..054e035`, 34 commits) did, in order:

1. **Scoped talent scaling before building it** — `TALENT-SCALING-SCOPE.md`, kept precisely because
   the prediction it made turned out half wrong.
2. **Chores**: 19 stale branches deleted locally and on `origin`, both stale worktrees removed, CI
   moved off the deprecated Node 20 actions.
3. **Meta gem procs wired** — two gems that contributed literally zero.
4. **Ranked Gear collapsed per slot**, 9.0 → 6.1 screens, after measuring that this file’s own
   proposed fix would not have worked.
5. **`h3` roles named as tokens**, 62 lines of dead CSS removed.
6. **Curated item audit**: four *fictional* items deleted that were selectable in gear dropdowns,
   two real ones linked to the ingest.
7. **Buffs & Consumables restored** as the fifth planner sub-tab — its 33 sourced raid buffs had
   been reaching no number at all.
8. **Talent scaling built**: 1 spec → **all 11 Physical DPS specs**, six classes, 30 effects.
9. **Rage sources completed** — Bloodrage, Improved Berserker Rage, damage taken as an input.
10. **Encounter fixed to one boss**, zero controls, 7,700 armor.
11. **Six false disclosures found and fixed**, each now behind an assertion. This is the finding
    that outlasts the code — see the caveat rule in Rules, and §1.

**The 2026-08-18 session** was short and did two things, both of them corrections:

1. **A seventh false disclosure, in the file the entry above claims was fixed.** `featureFlags.ts`
   said talent scaling "reaches the simulation nowhere at all" — true on 2026-08-16, false from
   2026-08-17, and still there. Every bullet in that file is now pinned by an assertion, the sharpest
   being that the caster and healer paths must score *identically* with real talent points. Verified
   by falsification. See the caveat rule in Rules, and §1.
2. **The rotations gap scoped — `ROTATION-SCOPE.md` — and this file's hypothesis about it was wrong.**
   Rotations are **not** an ingest. Talents were cheap because upstream had already reduced each one
   to a number; a rotation upstream is an imperative state machine over a timeline this simulator does
   not have. Recommendation is a per-spec closed-form extension on a short list, Hunter first — its
   three specs are excluded by an effect-type filter rather than by missing data, though the
   derivation of Steady Shot's rate against auto-shot weaving is still real work.

Also corrected: **"7 caster and 2 healer specs" was wrong in four places** and was never right — the
split is 9 Caster DPS, 5 Healer, 11 Physical DPS, 2 Tank. It is asserted now, not written.

**The 2026-08-19 session** audited the app against its own "Phase 2 and only Phase 2" target, and the
headline is that the gate was **already right where it mattered** — `getItemsForSlot` applies
`defaultMaxPhase = 2`, so the picker, the default set and the upgrade finder never offered later
content, and 1,196 of the 4,554 catalogued items are hidden by it. Raids are the correct five. Tier
sets stop at T5. There is no phase selector to get wrong.

What leaked was narrower and worse: **three paths resolve items by id and so skip the gate entirely**
— the Ranked Gear panel's Equip button, restoring a saved build, and importing one. All three could
seat Phase 3+ gear that the Gear panel would then refuse to list, counted in every stat total. Closed
with `isWithinDefaultPhase`, kept deliberately distinct from `isItemAllowedForCharacter` so an import
says "is Phase 3 gear" rather than blaming the class.

And **Wowhead's Phase 2 BiS guides genuinely rank five items Phase 2 cannot reach.** Both were traced
to their real source before touching them — Band of Eternity needs Scale of the Sands (Mount Hyjal,
Phase 3) and Hailstone Pendant drops from Ahune's Ice Chest (2.4) — so this was Wowhead being
forward-looking, not a bad ingest. Dropped, and the count exported as `excludedByPhase` so the filter
is asserted rather than silent. See §"Findings" for both, and for why an item-level rule would have
been wrong.

**Talents then reached the caster and healer paths**, closing the item this file had listed as the
top of the queue. `calculateCasterDps` and `calculateHealing` now take `TalentModifiers`, all nine
classes are ingested (**30 → 44 effects**), and coverage goes **11 → 25 of 27 specs**. The plumbing
went first on purpose: ingesting Mage effects with no caster talent argument to reach would have been
this repo's signature failure, data wired to nothing.

The gains are deliberately modest — **+1.5% to +7.6%** — because only the character-global half is
expressible. Per-spell talents (Ignite, Shadow Weaving, Ruin) need a spell school and a per-spell
coefficient, neither of which exists here, so **45 groups are refused by name**. The exception is
**Meditation**, which changes what a *stat* is worth: it takes a Holy Priest's mid-cast regen from
**11.6 to 24.6 mana/sec**, and Spirit stops pricing at zero.

Then, on the owner's call, **main-hand and off-hand picks were separated into their own rankings.**
A one-hander is catalogued `Main Hand` but is legal in either hand, so every one-hander the guide
ranked under "Off Hand" was being filed as a main hand — a Fury warrior's Main Hand read
`#1 #1 #2 #2 #3 #3 #4 #4`. The section now decides the slot unless the item cannot go there, six
entries move, and ranks are made dense per slot. **Rank density is now asserted across every list**,
which was not possible before.

The Simulation tab is **still hidden**; that decision was deliberately left to the repo owner, and
was re-confirmed on 2026-08-18.

Repo: `C:\Users\josep\OneDrive - Saint Louis University\Project Defeat`, on GitHub as
`josephevenson08/project-defeat`. Working tree is clean apart from `Untitled.canvas`, which is the
owner’s own file — leave it alone. **Read `git log -1` for the current commit rather than trusting a
SHA written here**; this line has named a stale one twice.

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
- **Do not edit `src/` while the suite is running, and do not read its progress with `tail`.** Two
  separate traps, both hit on 2026-08-18. Editing during a run triggers Vite HMR on every open page
  and took the suite from **8.9m to 19.6m** — comment-only edits, so the result stayed valid, but a
  behavioural edit mid-run would have produced a result describing no version of the code. Do
  doc-only work while it runs, or wait.

  The second trap looks exactly like a hang: the line reporter overwrites one line with cursor-up
  codes (`\x1b[1A\x1b[2K`), so `tail` on the redirected file shows whatever chunk it lands on and can
  sit at the same test number for minutes while the run advances normally. `grep -o "\[[0-9]\+/[0-9]\+\]"
  | sort -n | tail -1` reads the real position; `stat -c %y` on the file distinguishes a stall from a
  slow test in one command.
- **If a test run dies partway with `ERR_CONNECTION_REFUSED`, it is the dev server, not the tests.**
  Seen twice in a row from a worktree: tests 1-40 pass, then every remaining test fails to reach
  127.0.0.1:5173 because the Playwright-managed Vite server has exited. The fix is to start the
  server yourself on 5173 first — `reuseExistingServer: true` means Playwright adopts it instead of
  managing its own — after which the full suite passes. Read the exit code, but read the *failure
  mode* too: a dead server and a broken assertion both come back as exit 1.

  **One cause is now known: never run two suites at once.** `reuseExistingServer: true` means the
  second run adopts the first run's server, and when the first finishes it takes that server down
  mid-flight, so the second collapses into `ERR_CONNECTION_REFUSED` from wherever it had got to.
  Start one server by hand and run one suite against it.
- **Line endings: check, never assume — and `git ls-files --eol` is the only answer worth trusting.**
  `core.autocrlf` is **true** here, so *every* file is stored LF in the index and the working-tree
  copy is whatever last wrote it. That means the working-tree endings drift: this file and
  `tests/planner.spec.ts` are currently `w/crlf`, `README.md` and `src/App.tsx` are `w/lf`, and a
  fresh clone would hand you CRLF for all of them. An earlier version of this rule asserted
  "planner.spec.ts is LF" as a fact about the repo; it was only ever a fact about one working tree at
  one moment, and it stopped being true without anything going wrong.

  What still bites is the same thing in either direction: a pattern containing `\n` matched against a
  CRLF file finds nothing and "succeeds". So run `git ls-files --eol <path>` before any scripted
  edit, and prefer patterns that cannot care — single-line matches, `\r?\n`, or appending with the
  endings the file already has. **Committed bytes are unaffected either way**, so a working-tree flip
  is not itself a defect to chase.

- **A scripted edit must count what changed, not what it meant to change.** This cost a full test
  run: a script that inserted a line after `await openApp(page)\n` incremented its counter on the
  *marker test* and then called `.replace()`, which matched nothing against the CRLF working tree. It
  cheerfully reported "4 tests patched" having written the file unmodified, and the failure only
  surfaced two ten-minute suites later. Compare the string before and after, report from that, and
  verify the result with an independent `grep` rather than trusting the script's own tally.
- **`npm run brain` must stay idempotent** (a second run reports `0 written`). The repo lives in
  OneDrive, so churn matters.
- **Wowhead rate-limits (HTTP 403)** once a run checks several candidate pages per lookup. Every
  ingest script caches to `tools/ingest/.cache/` — reuse it rather than re-fetching.
- **Leave `Untitled.canvas` alone**, it's the user's own file.
- **Never invent data.** Anything not read off a real source gets `needsVerification: true`. This
  project's whole history is recovering from plausible-looking invented values.
- **A caveat needs something that fails when it stops being true.** Six user-facing statements were
  found *wrong* in one session — `featureFlags.ts`, the rotation summary's list of unmodelled rage
  sources, the stat-weights "haste is not modelled" flag, the upgrade finder's "most of this catalog
  is estimated", a restored encounter target the player could not change, and a tank note that
  implied talents were counted. **Every one was true when written.** Closing a gap never forces the
  text describing it to change, so the text rots silently — and a confident wrong caveat is worse
  than no caveat. Write the assertion with the sentence: a flagged-unmodelled stat must score zero,
  the "two specs" figure must match the ability data, and so on.

  **`featureFlags.ts` then rotted a second time, one day after being fixed** (found 2026-08-18,
  §1) — so the rule's real lesson is that *fixing* an instance buys nothing on its own. Only the
  assertion does. Prose corrected without one has a demonstrated half-life here of about a day.

  **A count in prose is the same defect wearing different clothes.** "7 caster and 2 healer specs"
  appeared in this file twice, in `featureFlags.ts` and in a test comment; the real split is 9 and 5,
  with 2 tanks, and nothing had to change for it to become wrong — it was miscounted at writing and
  then copied. Counts belong in assertions computed from the data, which is the same rule the repo
  already states as "counts are computed, never written into prose".

## Verify you're where this describes

```bash
npx tsc -b                            # exit 0
npm run lint                          # exit 0
npm run build                         # exit 0
npx playwright test --reporter=line   # 128 passed, 0 skipped, 0 failed
npm run brain                         # "all wikilinks resolve"
npm run brain                         # "0 written" — idempotent
```

---

## What the app is

A local-first React + TypeScript + Vite planner for WoW TBC Classic, targeting Phase 2 (SSC/TK,
Tier 5). No backend, no runtime network calls — typed data and generated JSON in the repo.

**Layout:** intro → a **section picker** (Character Planner / Spec Tier Lists / Raids / Professions)
→ the chosen section, with a tab bar for moving between them afterwards. Discord skeleton underneath:
a left rail, one main pane, popups layered over rather than modes you travel between. Tesla's
restraint in the palette, Nothing's detailing: flat surfaces, hairline rules, tracked uppercase mono
labels, tabular figures, no gradients.

**The planner is a second level of tabs** — Gear / Talents / Ranked Gear / Build — each rendering
only its own panel. See §2b for why, and for the measurements behind it.

**The rail is section-specific.** Planner: the character selects plus the stat readout. Raids: the
raid switcher. Tier lists and Professions: none. A rail of numbers beside a loot table would describe
something not on screen. The stat rail is also **scoped to the spec** — 12 rows on a Fury Warrior
rather than 26 — with a "show all" toggle; again §2b.

**Entering the planner runs character creation** — four steps, faction → race → class → spec, each
committing immediately so an earlier change re-narrows everything after it. A restored build skips
it; the rail's "Start over" reopens it.

**Colour policy:** item quality colour is information, not decoration, so it stays and everything
else is near-monochrome *specifically so quality reads first*. Socket colours likewise. Role accents
keep a muted hue. Audited: the only saturated colours anywhere are item quality and the warn amber.

## The data

Every dataset is real and from a pinned source. Regenerate any of them:

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
node tools/ingest/ingest-talents.mjs --class Warrior  # one class; 9 classes = 579 talents
node tools/ingest/link-raid-loot.mjs            # links raid loot to the catalogue by exact name
node tools/ingest/wowhead-lookup.mjs --spell-name "Battle Shout"  # read-only lookup aid
node tools/ingest/ingest-tier-lists.mjs         # 3 spec tier lists, 28 placements
node tools/ingest/ingest-item-effects.mjs       # 49 trinket/weapon procs and on-use effects
node tools/ingest/ingest-meta-gems.mjs          # colour conditions for all 18 meta gems
node tools/ingest/ingest-icons.mjs              # icon *names* for 4,741 items and gems
node tools/ingest/fetch-icons.mjs               # the artwork itself -> public/icons/ (1,238 files)
```

| | Was | Now |
|---|---|---|
| Items | 230, inferred | **4,554** merged, validated |
| BiS entries | 463, only 2 deeper than rank 1 | **1,428** across 27 specs |
| Gems | 11 | **212** |
| Enchants | 22 | **91** |
| Consumables | 14 | **31** |
| Gem/enchant recommendations | none | **107 + 274** |
| Raid buffs | 14, all unverified | **33**, each cited to a spell rank |
| Target debuffs | 6, all unverified | **6**, each cited to a spell rank |
| Tier set bonuses | 9 sets, partly paraphrased | **34 sets** (T4 + T5), 71 bonuses, verbatim |
| Talents | none | **579** across all 9 classes, 27 trees |
| Talent *effects* | none | **44** across all 9 classes, reaching 25 of 27 specs |
| Spec tier lists | none | **3 lists**, 28 placements, all 27 specs |
| Icons | none, two-letter glyphs | **1,609 files** vendored, 2.8 MB — items, gems and talents |
| Item effects | 14 curated, 0 ingested | **55 items**, 46 of 175 trinkets |
| Meta gem conditions | never checked | **18 of 18**, enforced and explained in the panel |

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
- **The upstream item database is the game's item table, not a list of wearable gear — and that put
  encounter props in every default loadout.** `getDefaultItemForSlot` picks by highest item level, so
  before `domain/gear/obtainability.ts` existed **all 27 specs opened holding one of Kael'thas's
  Tempest Keep encounter weapons**. Every stat total, simulation and stat weight in the app started
  from a weapon that cannot be held, and the upgrade finder never proposed a weapon because nothing
  beats ilvl 175. The evidence is in the data, not recall: those seven are the **only** items at ilvl
  175 in a 4,505-item catalogue, eleven levels above ilvl 164, which is Sunwell and the highest
  obtainable gear in all of TBC. Trashbringer is likewise alone at 155 with no Wowhead source tab.
  Excluded at `isItemAllowedForCharacter` **and** in `defaultGear.ts`, because the starting set is
  built before any character exists and never passes through that gate.
- **Two tests were codifying that bug** and are worth not "fixing" back: one asserted Warp Slicer was
  a Combat Rogue main-hand option, and one required the upgrade finder to flag at least one row as
  resting on estimated stats. The second stopped holding for the *right* reason — Fury Warrior's
  defaults became real sourced epics, so its upgrades compare sourced against sourced. Fury is the
  only one of 27 specs in that position, and a domain test now pins that the disclosure still fires
  for the other 26.
- **The default gear set used to equip a two-hander and an off-hand at once — in 18 of the 27
  specs.** `defaultGear` fills each slot independently by highest item level, so a Fury Warrior
  opened holding a two-handed sword *and* a one-handed mace, and every caster a staff *and* a sword.
  Not cosmetic: the off-hand's stats were counted (+52 attack power for melee, +28 stamina for
  casters) and `isDualWield` added a whole phantom off-hand's white damage on top. Fixed —
  `twoHanderOccupiesOffHand` plus an `EMPTY_OFF_HAND` placeholder, applied in `defaultGear`, in
  `normalizeGearForCharacter` and in `applyWeaponSlotRules` on every manual gear change. Melee DPS
  fell to its honest value: **Fury 196.5 → 165.6, Arms 233.7 → 203.2, Combat Rogue 205.6 → 185.6**,
  and Combat Rogue then fell again to **157.4** when the proficiency fix below took its two-hander
  away and gave it two one-handers. Feral is unchanged, correctly, because cat form swings its own
  weapon.

  **Those were the current figures against the 10,643-armor target.** They are now 192.3 / 236 /
  185.6-ish against 7,700 — the fix they describe is still real, but read the numbers as a record of
  what that fix did rather than as today's readouts.

  **The reverse rule is what the first attempt got wrong, and it is the subtle half.** An empty off
  hand is legal *only* beside a two-hander, but the placeholder passes `isItemAllowedForCharacter` —
  it has no restrictions to fail — so nothing ever replaced it. Switching to a one-handed spec left
  the slot empty forever, which cost a **Protection Warrior its shield** and with it every block term
  in Effective Health. `normalizeGearForCharacter` now refills an empty off hand whenever the main
  hand is not two-handed, and a test asserts both directions.

  `EquippedGear` is a `Record<GearSlot, EquippedSlot>`, so "empty" is not otherwise representable —
  hence a placeholder rather than an optional slot, which would have rippled through every consumer.

  **The fix surfaced two more real bugs**, both of which had been hiding behind the illegal pairing:

  - **Rogues were being handed two-handed weapons.** TBC gives one- and two-handed swords, axes and
    maces the *same* `weaponType`, so "Rogues may use swords" silently admitted two-handers, and the
    default Rogue opened holding Twinblade of the Phoenix. The same hole would offer a Mage or
    Warlock a two-handed sword, since neither class's illegal list mentions swords at all.
    `TWO_HANDED_PROFICIENCIES` now states, per class, which types are legal in two-handed form —
    Rogue is an empty set, deliberately, because "none at all" is the rule.
  - **The upgrade finder recommended upgrades that cannot be equipped.** With the off hand held shut
    by a two-hander it holds `EMPTY_OFF_HAND`, so every one-hander in the catalogue scored as an
    enormous gain against nothing and topped the list at **+31 DPS** — an upgrade the player cannot
    take, and one `applyWeaponSlotRules` undoes the moment they try.
- **Melee haste used to reach no output at all** — `weaponDiceToWhiteDps` is `avg/speed` and
  `attackPowerToWhiteDps` is `AP/14`, and neither read `hasteRating`, so the rail displayed a stat
  that did nothing and the stat-weight engine priced it at exactly zero. Fixed: white damage scales
  by `(1 + haste)` and rage income with it. **It changes no current number**, because only 78 of
  4,554 items carry melee haste and none is Phase 2 raid gear — so the test injects 158 rating
  (exactly +10%) rather than equipping something. Worth knowing before "fixing" it again: the
  absence is real TBC, not missing data.
- **Icon names come from the upstream the catalogue already uses, not from scraping Wowhead.**
  `assets/item_data/all_item_tooltips.csv` in wowsims/tbc, at the same pinned commit, carries an
  `"icon"` field for ~30,000 items — one request for the whole mapping. Two dead ends first: wowsims'
  `all_items.go` has no icon field at all, and Wowhead's item *listviews* carry `displayid` rather
  than an icon name, cap out around 1,720 rows, and apply their URL category filters client-side —
  `/tbc/items/head/quality:4` and `/tbc/items/quality:4` return byte-identical HTML.
- **`allItems` is 4,554 while `itemCatalogue.json` is 4,505.** This figure read **4,560** until
  2026-08-19, and the six-item drift is fully accounted for rather than merely corrected: **four**
  fictional curated items were deleted (curated 230 → 226) and **two** real ones — Choker of Vile
  Intent and The Sun King's Talisman — were given their `wowItemId`, so they now *match* an ingested
  row instead of merging as separate entries. Read the count off `catalogueMeta.mergedCount`, which
  is computed, rather than from prose. `itemCatalogue.ts` merges the ingested
  catalogue, the Wowhead-only supplement and the curated provenance layer. Any script deriving a
  per-item dataset must read `allItems`, not the JSON — reading the JSON silently missed "Blessed
  Book of Nagrand", which reached the paperdoll with no icon.
- **Raid loot notes reading "not yet in the item catalog" went stale without anything editing them.**
  That data was written when the catalogue held 230 hand-written items; it now holds 4,554, and 85 of
  the 124 unlinked entries named an item that was already present. They carried no `itemId`, so they
  drew the `??` frame and the note was simply false. `tools/ingest/link-raid-loot.mjs` links by exact
  unique name — never guessing where a name matches two items — and trims only that one stale
  sentence, so notes carrying something else real ("Wizard of Oz variant only") keep it. Resolution
  went 148 → **233 of 272**; Karazhan 19 → 35 of 45. The remaining 39 are correctly unresolved:
  mounts, enchanting formulas and tier tokens are not gear and should not draw a gear icon.
- **The ten files in `src/domain/raids/` were marked read-only on disk**, alone in the whole repo —
  an artifact of the worktree agent that created them on 2026-07-30. Any scripted edit there fails
  with `EPERM` until the attribute is cleared. Nothing else under `src/` has it.
- **The Phase 2 gate was real but partial, and the hole was every path that resolves an item by id**
  (2026-08-19). `defaultMaxPhase = 2` is applied inside `getItemsForSlot`, so the picker, the default
  set and the upgrade finder were always correct — the catalogue carries **1,196 later-phase items**
  (540 P3, 137 P4, 519 P5) and hides all of them. But `getItemById` / `getItemByWowItemId` are bare
  map lookups, and three surfaces used them: the Ranked Gear panel's **working Equip button**,
  restoring a saved build, and importing someone else's. Gear the Gear panel refuses to list could
  sit equipped and be counted in every stat total.

  **Item level is not the test, and an ilvl rule would have been wrong.** Tier 5 tops out at 141, but
  **Embrace of the Twisting Nether** and **Bulwark of the Ancient Kings** are genuinely Phase 1-2
  crafted epics at **ilvl 146**. The `phase` field is the authority; ilvl is a red herring. (The only
  other things above 141 are the eight already excluded as unobtainable.)

  Fixed with `isWithinDefaultPhase` applied at the three id-resolving paths, kept deliberately
  separate from `isItemAllowedForCharacter` — build import reports "is Phase 3 gear" rather than
  "isn't legal for a Beast Mastery Hunter", because the item *is* legal and the reason is the phase.
- **Wowhead's Phase 2 BiS guides rank five items Phase 2 cannot reach**, labelled in their own notes
  as "Optional", "Alternative" and "Seasonal". Both were verified to their real source rather than
  trusted from the phase number, because getting it backwards deletes legitimate rankings:

  - **Band of Eternity** (29294/29298) rewards the quest *Champion's Pledge*, which requires **Scale
    of the Sands** — the Mount Hyjal faction, and Hyjal is **Phase 3**. The quest text gives it away:
    the ring "will grow in power as you prove yourself to the Scale of the Sands", which is the
    29294 → 29295 → 29296 upgrade chain.
  - **Hailstone Pendant** (35511) comes from the **Ice Chest** that **Ahune** drops in the Slave Pens
    during the Midsummer event, added in **2.4** — Phase 5.

  wowsims' phase values are right in both cases. The entries are dropped in `bisLists.ts` rather than
  greyed out in the panel, because those rows carry an Equip button and the Gear panel will not list
  the items — so keeping them offers gear the rest of the app then refuses to acknowledge.
  `excludedByPhase` exports the count (**5**) so the filter is asserted rather than silent.
- **A one-hander is catalogued `Main Hand`, and taking that as the whole answer collided two
  rankings into one slot** (fixed 2026-08-19). The guides publish a "Main Hand" and an "Off Hand"
  section, and **the section says which hand the pick is for** — real information the build was
  discarding, because it let the catalogue's slot win unconditionally.

  The symptom: a Fury warrior's Main Hand read **`#1 #1 #2 #2 #3 #3 #4 #4`**, all four off-hand picks
  stacked on all four main-hand picks, while the off hand showed a *synthesised* fallback list rather
  than the four weapons the guide names for it. Arms read `[1, 2, 3, 3, 4, 4, 5, 6, 7]` the same way.

  **An intermediate diagnosis in this file was wrong and is worth not repeating:** it said the
  duplicates came from "two guide sections, one per weapon style". They do not — every section is
  named after a *slot*. The two-hander/one-hander split inside Arms' Main Hand list (ranks 1-3 versus
  4-7) is Wowhead's own ordering within a single section, and is left exactly as published.

  The rule is now **honour the section unless the item cannot physically go there**, which keeps the
  case the old rule existed for: "Claw of the Phoenix" is ranked in Hunter's *Main Hand* section and
  is off-hand only, so it still moves. `isItemCompatibleWithGearSlot` already encodes the asymmetry.
  **Exactly six entries move**, all one-handers returning to the off hand.
- **Ranks are made dense per final slot, as the last step of the build.** Two things open gaps: a
  phase drop removes a rank, and an item can change slots (Hunter's Main Hand read `#1 #3 #4` with
  nothing to explain the missing #2). Relative order is untouched. Done *after* the off-hand fan-out,
  because that can add entries too. A test now asserts density across every slot of every list —
  which only became assertable once the collision above was fixed.
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

Now visible on the Simulation tab, so its limitations are visible too. Still open: rotations cover
2 specs of 27, and there is no multi-iteration variance or result charting.

**The encounter is fixed and has no controls** (2026-08-15, by request). It was a target-level
select, an armor field, three armor presets and a damage-taken input; the tab exists to gear a
character and press Run, which is what the reference TBC simulators do. One target: **level 73,
7,700 armor**. The panel still *names* it, which is not the same as configuring it — a DPS figure
means nothing without knowing what it was measured against.

Two consequences worth knowing before touching this:

- **The armor was 10,643 and is now 7,700**, settled by the repo owner. While three presets existed,
  10,643 was the one labelled "Heavily armored boss" against 7,700 for "Typical raid boss" — so
  keeping it as the *only* target meant every physical DPS number was quoted against the heavy end.
  **Every DPS figure in the app moved up when this changed**: armor mitigation 50.2% → 42.2%, Fury
  165.6 → 192.3, Arms 203.2 → 236. Both values are community approximations rather than
  tooltip-exact, which is why the encounter still carries `needsVerification`.
- **Damage-taken rage is unreachable from the UI.** `SimulationTarget.damageTakenPerSecond` survives
  with its tests, but nothing sets it, so it is pinned at 0 and Fury's rotation still cannot fund
  Heroic Strike. That is the honest cost of zero configuration.

**Removing a control twice left the state behind it live.** Worth watching for, because both were
invisible until something exercised the second path:

- `App.tsx` went on restoring `target` from the saved build, so a build saved while the presets
  existed came back with 3,500 armor and the panel confidently announced a target the player never
  chose and could not change. `buildSerialization` accepts any `{ level, armor }`, so an *imported*
  build reached it too. `target` is now a constant; it stays in the payload for compatibility and is
  never read back.
- The same shape as §1's stale disclosures below: a change closes one path and leaves a second open.

### The disclosures rot, and that is the pattern rather than the instances

**Four of the simulator's self-descriptions were false in one sitting, all true when written.** The
cause is structural and will recur: *closing a gap never forces the text describing that gap to
change*, so the text rots silently — and on a surface whose case for being shown rests on describing
itself honestly, a **wrong** caveat is worse than no caveat.

**"Will recur" was not a figure of speech — three more were found on 2026-08-18**, the first of them
in `featureFlags.ts` for the second time, one day after that file was corrected. The last three rows
below are that session; the first four are the original sitting.

| Claim | Reality when found |
|---|---|
| `featureFlags.ts`: rage unmodelled, no healer mana, procs unpopulated | all three fixed long before |
| Rotation summary: "Bloodrage, Unbridled Wrath, damage taken, Flurry-driven haste are unmodelled" | all four modelled |
| Stat weights: "Haste Rating — not modeled yet" | modelled, and worth **0.059/pt**, above Agility |
| Upgrade finder: "most of this catalog is still stat-budget estimates" | **96.9% sourced** |
| *(2026-08-18)* `featureFlags.ts` again: talent scaling "reaches the simulation nowhere at all" | wired in one day after the sentence was written; **11 specs** covered |
| *(2026-08-18)* `calculateSimulation.ts`: "Warrior-only for now … covers one class" | **six classes**, 30 effects |
| *(2026-08-18)* Test comment: "ingested for Warrior and Rogue only" | **six classes** |

So each now has an assertion that fails when it stops being true:

- **A stat flagged `notModeledYet` must score exactly zero.** A stat the engine does not read cannot
  move the result, so a flagged stat scoring anything is a self-contradiction. Verified by
  reintroducing the haste bug — it fails naming the stat and the value. Runs across four roles. Only
  the forward direction is asserted: an unflagged stat may legitimately score zero by being capped,
  which is the distinction the panel exists to draw.
- **Exactly 2 specs have multi-ability rotations and 25 are single-ability**, the figure the panel
  prose quotes.
- **The catalogue's sourced share stays above 90%**, as a band so verification work does not break it.

If you add a caveat to any of these surfaces, give it something that fails when it stops being true.

**All three of the reasons `featureFlags.ts` gives for hiding the tab have now been addressed** —
rage, item procs and the healer mana constraint. **The flag's reasoning has been rewritten to match**
(2026-08-15) — it used to claim "rage is not modelled at all", which would have sent the next reader
off to re-fix something already done. The flag's *value* is untouched: whether the numbers are now
defensible enough to show is a judgement, not a blocker, and it has still not been taken.
(Re-confirmed 2026-08-18: still hidden, by the repo owner's decision.)

**Then it rotted again, in the same file, within a day — this is the seventh instance and the
strongest evidence the pattern is structural rather than a run of carelessness.** The 2026-08-15
rewrite closed with "talent scaling … reaches the simulation nowhere at all". True when written.
`37e2cf2` wired talents into `calculateSimulation` on 2026-08-17 and `fba60c8` took them to all 11
Physical DPS specs on 2026-08-18, and the sentence sat there through both. It was the load-bearing
one, too: it is the file the owner reads to take decision #1, and it argued for staying hidden on
the strength of a defect that had been fixed.

**Fixed 2026-08-18, and this time every bullet in that file is pinned by an assertion.** The sharpest
is `tests/planner.spec.ts` → "the caster and healer paths are talent-blind": it scores a Shaman
Elemental and a Paladin Holy with real talent points and requires the result **not** to move.
Shaman and Paladin are chosen because both *have* ingested effects, so an unchanged score proves the
**path** ignores them rather than that the data is missing — a Mage would have passed the test
forever, including after the plumbing landed. Verified by falsification: threading talents into
`calculateCasterDps` makes it fail, naming the caster path.

**The healer mana term** is `domain/simulation/manaModel.ts`, from wowsims `sim/core/mana.go`:
`MP5/5` per second, Spirit regen as `0.001 + Spirit*sqrt(Intellect)*0.009327`, and `Intellect*15-280`
of maximum mana. The load-bearing detail is that wowsims adds Spirit regen **while casting** only
when `SpiritRegenRateCasting` is non-zero, and that comes from talents — so untalented, **MP5 is the
entire regen mid-cast and Spirit prices at zero**. Real TBC, not a shortcut.

The deficit is *reported*, not used to throttle the headline: a healer who casts flat out until empty
and one who paces to the sustainable rate are both real, so picking one silently would swap an
overstated number for a differently wrong one. A Holy Paladin reads 336 mana/sec spent against 6.8
regained. **No time-to-empty is offered** — that needs a mana pool, and class base mana is not in the
wowsims tree at this commit (only `racials.go` is), so `manaFromIntellect` exists and is tested but
nothing divides by it.

**Meta gem activation** is checked now. All 18 TBC meta gems carry a colour condition, read from each
gem's own Wowhead tooltip by `tools/ingest/ingest-meta-gems.mjs`; wowsims models what a meta *does*
and leaves the condition to the player, so it is no use here. Two shapes: minimum counts per colour,
and "more X than Y". Hybrids count toward **both** their colours, meta gems count toward none, and an
unmet meta grants **nothing** rather than a reduced amount. The panel says so in `--warn` amber —
this project has already been bitten once by a gem check failing silently, and a meta failing because
of gems in *other items* is worse again.

**One trap in that ingest:** these Wowhead pages carry user comments, and item 25890's comments
restate the requirements. A loose search of the page text finds player-written text and treats it as
authoritative — only the `g_items[<id>].tooltip_enus` assignment is the item itself. Note it is an
*assignment*, not a JSON key, which is what defeats the obvious `"tooltip_enus":` regex.

**Item effects are no longer one of them.** `tools/ingest/ingest-item-effects.mjs` reads
`sim/common/*.go` from the pinned wowsims commit: **49 effects, 31 on-use and 18 procs**, taking the
catalogue from **0 of 4,505 items** carrying one to 55 overall and **46 of 175 trinkets**. It matters
outside the hidden simulator — `calculateStats` folds an effect in at `duration / cooldown`, so this
moves the always-visible stat rail. Bloodlust Brooch went from 72 attack power to 118: 72 flat plus
278 at a 20/120 uptime.

Two things about that ingest worth keeping:

- **It refuses what it cannot express.** 48 further effects are damage procs, mana returns, mob-type
  conditionals, or grant only Health — which `StatBlock` derives from Stamina and has no field for.
  Those are reported and skipped rather than given an invented stat bonus. Hand of Justice grants an
  extra attack, not stats, and correctly has no effect at all.
- **Procs without an internal cooldown use a procs-per-minute rate.** wowsims expresses some as
  `NewPPMManager(1.0, …)`, meaning one proc a minute on average, so the mean gap is `60 / ppm`
  seconds — which drops straight into `effectUptime`. That recovered Madness of the Betrayer and one
  other that would otherwise have been dropped for having no ICD.
- Curated effects still win over ingested ones. Those were read off real tooltips and several carry a
  `notModelled` explanation this ingest cannot produce — The Lightning Capacitor's charge mechanic is
  the clearest.

**On the low melee DPS — the diagnosis has changed.** This was recorded as "rotation modelling is
the acknowledged gap", but investigating it found the larger cause was an attack-table bug, now
fixed: the player's white and special tables applied **parry and block** to a melee DPS. Both
require the defender to be *facing* the attacker, and a melee DPS is behind the boss all fight, so
against a level 73 target that deleted 14% parry plus 5% block from every swing. Fixing it moved a
Fury Warrior from 125 to 148 DPS at the time and took hit chance from 21.7% to 39.2%. (That 148 is
history, and so is the 165.6 it became after the unobtainable-item and two-hander fixes changed
which weapons it holds. The same character now reads **192.3**, after the boss armor moved to
7,700.) `attacksFromBehind` is now
a required input on both builders, so a future front-facing caller has to state its position.

**Rage is now modelled, and the result was not the one expected.** `domain/simulation/rageModel.ts`
implements wowsims/tbc `sim/core/rage.go` at the pinned commit — `damage*(3.75/274.7) +
HitFactor*BaseSwingSpeed`, main-hand factor `3.5/2` and off-hand `1.75/2`, doubled on a crit, nothing
at all on a miss but full value on a dodge or parry. Heroic Strike is in the ability data too, from
`heroic_strike_cleave.go`: 15 rage, main-hand damage +176 flat, **unnormalized**, off the GCD, and
`replacesMainHandSwing`.

**It still contributes nothing, and now the simulator says why in numbers.** Auto attacks fund about
**3.1 rage/sec** on the default set — it was 3.7 before the two-hander fix below removed a phantom
off-hand that was generating rage it had no right to — while Bloodthirst and Whirlwind need **7.5**. There
is no surplus for a dump. What is missing is not the dump — it is rage *income*: **Bloodrage,
Unbridled Wrath, damage taken, and Flurry**.

**Haste is now modelled and it is not the unlock it looked like.** White damage scales by
`(1 + haste)` and rage income with it, so the mechanism is in place — but only **78 of 4,554**
catalogued items carry melee haste and **none at Phase 2 raid item level**, which is faithful to TBC
rather than a data gap: the expansion put almost no haste rating on early gear. So modelling it moved
no current number.

**The rage shortfall was blamed on talent scaling. That has now been built and tested, and the blame
was only half right.** Talents reach the simulation as of 2026-08-15. A talented Fury build takes
rage income from **3.4 to 5.4 rage/sec** against the 7.5 Bloodthirst and Whirlwind want — real, and
still short, with Heroic Strike still excluded.

**Endless Rage is easy to implement wrong, and this code did.** The tooltip reads "you generate 25%
more rage from damage dealt", but `sim/core/rage.go` writes
`damage*(3.75/RageFactor) + HitFactor*BaseSwingSpeed*rageMultiplier` — the multiplier belongs to the
**swing-speed term only**, and the damage-proportional half is untouched. Applying it to the whole
swing put talented rage at 5.8 when it is 5.4. `WhiteSwingRageInput.rageMultiplier` now carries it to
the right term, and a test asserts the delta equals exactly 25% of the swing-speed term rather than
merely "went up".

**Every expressible rage source is now in, and the gap still does not close.** Bloodrage
(`bloodrage.go`: 10 rage plus ten 1-rage ticks on a 60s cooldown) and Improved Berserker Rage
(`berserker_rage.go`: 5 rage per rank on a 30s cooldown) were the two that remained, worth a third of
a rage per second each. Bloodrage is an **ability, not a talent**, so it raises the untalented
baseline too — the figure this file used to quote as 3.1 rage/sec is really **3.4**.

**What is left is now an input rather than a gap.** The only remaining rage in TBC is from *damage
taken* — `damage * 2.5 / 274.7`, and note upstream applies **no** rage multiplier to it, so Endless
Rage does not touch it. A closed-form model of a DPS has no incoming-damage stream, so
`SimulationTarget.damageTakenPerSecond` declares it instead, with a field on the Encounter panel.

**It defaults to 0 on purpose.** How much a melee DPS takes is entirely fight-specific, so any other
default would be an invented number wearing a measurement's clothes. Zero understates rage income and
the panel says so rather than leaving the reader to infer it. Measured, on the default Fury set:

| damage taken/sec | rage/sec | Heroic Strike |
|---|---|---|
| 0 (default) | 5.4 | excluded |
| 200 | 7.3 | excluded |
| **300** | 8.2 | **fires** |
| 500 | 10.0 | 8.1 DPS |

**The rotation becomes self-funding at roughly 250-300 damage/sec taken.** That number is the honest
statement of how much of a real fight the zero default leaves out.

Flurry's
nominal 25% attack speed turns out to be worth **+7.4%** at the crit a Phase 2 Fury warrior actually
has, because it is gated on crit and Phase 2 crit is 13%. It was never going to be the unlock.

Two design decisions in there worth not re-litigating:

- **Rage-costed *cooldowns* are deliberately not throttled by this income.** Modelled income covers
  one source of several, and treating a partial constraint as a complete one would throttle abilities
  a real warrior presses on cooldown and report a DPS *loss* as an accuracy gain. Verified by
  stashing the change and re-measuring: the rage model moved **no DPS number at all**. The figures
  did move afterwards — Fury 196.5 → 165.6 — but from the two-hander fix below, not from this.
- **A swing-replacing ability is worth only the difference it makes**, and it also gives back the rage
  of the swing it displaced, since main-hand specials generate none. `rageDumpUsesPerSecond` solves
  `uses = surplus / (cost + suppressedRage)` in closed form rather than iterating. Counting Heroic
  Strike's full damage as additional damage roughly doubles it.

The remaining gap for melee is therefore **not** talents and **not** a priority-list engine. It is
the rage sources this model still has none of — **Bloodrage, damage taken**, and rage from abilities
the rotation does not carry.

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

**Buffs & Consumables is back; only the Simulation tab is still hidden.** `src/featureFlags.ts`
explains the simulation one, and `?simulation=1` brings it back for the tests.

**Hiding the buffs panel was worse than it looked, and this is the reason to be wary of hiding a
surface whose data something else consumes.** The two tabs were hidden together, but for different
reasons: the simulation numbers were known to be wrong, whereas the buff data is real and sourced —
33 raid buffs each cited to the spell rank its numbers were read from, 31 consumables, 6 target
debuffs — and `calculateStats` was applying it the whole time. With nothing rendering the toggles,
the three id lists defaulted to empty and could never be changed, so **that entire dataset reached no
number in the app**. Not wrong, just unreachable, and nothing about the interface said so.

It is now the fifth planner sub-tab, between Talents and Ranked Gear — both are "what you bring",
ahead of the rankings you check against. `App` holds one shared `toggleId` helper rather than three
near-identical callbacks, since only the target state differs.

A test pins the exact arithmetic rather than the direction: Battle Shout is a flat **+306** melee
attack power at rank 8, so the assertion is `after - before === 306` and that unticking restores the
original total exactly. "Went up" would pass just as happily with the buff applied twice.

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

Both design decisions that were parked here have since been taken, and are recorded in §2b below.
Still open:

- ~~**`h3` is styled at five sizes**~~ — **resolved by naming the roles, not by flattening them.**
  The four heading sizes were each doing a real and different job: 20px detail-page title
  (professions, raids), 15px panel section heading, 13px amber callout title
  (`.stat-weights-unmodeled`), and the 11px tracked mono label (`.bis-slot-heading`). The problem was
  never that there were four, it was that `h3` alone told you nothing about which you would get —
  every rule was a *descendant* selector keyed on the container. So they are now
  `--heading-detail` / `--heading-section` / `--heading-callout` tokens, with the label pattern
  staying on `--label-size` and deliberately not counted as a heading size: marking a group label up
  as a heading is correct semantics, and visual weight is a separate decision.

  **The real defect was the missing bare rule, and it was latent rather than live.** There was no
  `h3 { }` at all, so an `h3` in any new container would have inherited the browser's `1.17em`
  (~18.7px) — a size nobody chose, sitting between the 15px and 20px steps, close enough to both to
  read as sloppiness rather than as a bug. Exactly the `small` finding one level up. Measured before
  and after across every view: **20 `h3` elements, all landing on a chosen size, identical both
  times** — nothing rendered differently, which is the point.

- **62 lines of dead CSS removed with it.** `.racials` / `.racial-*` was referenced by **zero**
  components — left behind when the racial traits list was removed by request (§2). Worth noting it
  contained `#4ade80`, a saturated green, so the colour audit's claim that "the only saturated
  colours anywhere are item quality and the warn amber" was true of the *rendered* app but not of the
  stylesheet.
- Base surface is `#0a0a0a`, near-pure black. Material and Smashing both recommend ~`#121212`;
  pure black maximises halation and spends the darkest value available. Left alone — it is a
  deliberate part of the stated aesthetic and the contrast measurements all pass.

### 2b. The two parked design decisions, now taken

**The planner is four sub-tabs, not one column.** Measure first: it was **11,206px / 15.6 screens** at
1280×720, not the ~25,000px recorded above — the hidden Buffs panel and the gear rebuild had already
shrunk it. But the useful finding was the shape rather than the total: **Ranked Gear was 59% of the
scroll and Talents 26%**, so two panels were 85% of it. `PLANNER_VIEWS` in `App.tsx` now splits Gear
/ Talents / Ranked Gear / Build, each rendering *only* its own panel. The rail is what makes this
affordable — the stat totals stay on screen across all four, so nothing the single column provided is
lost.

Sub-tabs rather than collapsible panels because these are four different activities, not four views
of one thing. Collapsing would have kept the scroll and added a second thing to manage.

**Ranked Gear's own length is now dealt with — and the fix proposed here was the wrong one.** This
used to say "capping each slot's ranking at a few entries with a show-all is the remaining move".
Measuring first said otherwise, twice over:

- **The length is entry *count*, not entry height.** The panel measured **6,458px, 9.0 screens** at
  1280x720, from **64 entries across 15 slot groups** — but the median entry is only **61px**, which
  is already tight. There is nothing to shrink; there are just a lot of rows.
- **"A few" would not have worked.** Entries per slot across all 27 specs run min 1, **median 4**,
  max 8, and **288 of the 398 slot groups hold exactly 4**. So capping at 3 hides only **22.9%** of
  entries and lands at ~7.4 screens. Measured: 3 → ~7.4 screens, 2 → ~6.1, 1 → ~4.8.

`DEFAULT_VISIBLE_PER_SLOT` in `BisPanel.tsx` is **2**, giving a measured **4,367px / 6.1 screens**, a
32% cut, with a per-slot "Show all N". Two rather than one because the panel is called *Ranked* Gear:
a #1 with a #2 under it still reads as a ranking, where a single row reads as a pick. The constant is
the only thing to change to move along that curve.

Two things worth not rediscovering. Expanding one slot deliberately does **not** expand the others —
the reason to open a slot is to compare inside it, not to restore the wall. And **all three Rogue
specs rank ≤2 in every slot**, so they show no toggles at all and always did fit; any test asserting
toggle counts has to pick its spec deliberately.

**The rail is spec-aware, with an escape hatch.** A Fury Warrior went from 26 rows to **12**; a
Protection Warrior gets 18, a Mage 11, a Holy Priest 12, a Feral Druid 13. `domain/stats/statRelevance.ts`
holds the rules, and two of them are worth restating: **attributes and armor are never hidden**,
because the in-game character sheet shows them to every class and hiding them would surprise more
than the noise it saves; and **nothing is deleted, only defaulted away** — a "Show N more" toggle
restores all 26. That toggle is the answer to every arguable case, such as Enhancement Shaman getting
real value from spell power.

The worst row was never the zeroes. It was **Healing Power 411 on a Fury Warrior**, which reads as a
bug rather than as an irrelevant row.

**This interacts with one test in a way worth not rediscovering:** the Draenei racial test reads
*spell* hit off the rail for a **Warrior** — a number a Warrior has no normal reason to look at, and
now hidden. It opens the toggle first. Hiding a stat can break a legitimate read, which is exactly
why the toggle exists.

**Three things about testing sub-tabs, each of which cost a full suite run:**

- **`expect(locator).toHaveCount(0)` is vacuously true wherever the panel is not rendered.** With one
  column that could not happen; with sub-tabs a test that drifted onto the wrong view would keep
  passing while asserting nothing. `expectSlotHidden` and `expectNoRankingHeading` exist to force the
  right view first, and any new absence assertion should go through something similar.
- **Playwright's `name` option matches substrings.** `getByRole('region', { name: 'Gear' })` also
  matches "BiS / Ranked Gear"; `{ name: 'Talents' }` matches all three "<Spec> talents" trees;
  `{ name: 'Build' }` matches "Saved builds". Use `exact: true` on every region lookup here.
- **`build-export-output` is inside a collapsed `<details>`**, so it is legitimately hidden and is
  the wrong thing to assert visibility on. The other build tests only ever read it with
  `.inputValue()`, which does not check visibility, which is why this never surfaced before.

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

### 4. Talents — all nine classes, with icons

**579 talents across 27 trees**, ingested by `tools/ingest/ingest-talents.mjs`. Warrior was built end
to end first to prove the parser; the other eight then came from the same payload with **no parser
change at all**, only tree ids. Every talent renders its real icon. The "class has no talents yet"
path in `TalentsPanel` is now unreachable and kept only as a guard.

**Six of the 27 trees are named something else in the payload**, in Vanilla-era internal terms, and
every one was confirmed by *reading the tree's contents* rather than trusting the label:

| Payload | Actually | Confirmed by |
|---|---|---|
| Paladin `Combat` | Retribution | holds Benediction, Improved Seal of the Crusader |
| Warlock `Curses` | Affliction | holds Suppression, Improved Corruption |
| Warlock `Summoning` | Demonology | holds Demonic Embrace, Improved Imp |
| Shaman `ElementalCombat` | Elemental | holds Convection, Concussion |
| Druid `FeralCombat` | Feral | holds Ferocity, Feral Aggression |
| Hunter `BeastMastery` | Beast Mastery | unspaced only |

The tree ids themselves are **not** hand-written either — they are read off the payload's own `trees`
map, where each entry's `description` is an unspaced "WarriorArms". A test asserts each class's three
tree specs match the app's spec names, so a mis-mapping fails loudly rather than mislabelling a tree.

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
- ~~The BiS and Buffs panels still use the older layout shapes~~ — **this note predates the work it
  asks for, and half of it is unbuildable.** The BiS panel already got the treatment: §2 lists
  "Ranked-gear rows rebuilt — frame, one identity line, filled Equip" as shipped, and that is what
  the code has (`.bis-item-frame` with icon and item-level badge, a single `.bis-entry-meta` identity
  line, a filled Equip button), plus the per-slot collapse added later. There is no dated markup left
  in it — zero `<dl>`, `<dt>`, `<dd>` or `<table>` across BisPanel, BuffsPanel and GearPanel alike.

  The Buffs panel was a different problem: nothing rendered it, so restyling it would have been work
  on a module nothing renders — which this file's own conventions forbid. That question has since
  been answered by bringing the panel back as the fifth planner sub-tab (§2), which is the
  prerequisite any layout work on it needed.

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
  URL scheme. Copy that pattern — **and include the `/index.ts` fallback**, or any script reaching a
  barrel import like `../../domain/abilities` dies with `ERR_MODULE_NOT_FOUND` on a path that looks
  perfectly correct:

  ```js
  registerHooks({
    resolve(spec, ctx, next) {
      try { return next(spec, ctx) } catch (err) {
        if (!spec.startsWith('.')) throw err
        try { return next(`${spec}.ts`, ctx) } catch { return next(`${spec}/index.ts`, ctx) }
      }
    },
  })
  ```
- `.claude/agents/` is not registered as agent types in every environment. Dispatch a
  `general-purpose` agent and paste the agent file's contents into the prompt instead.
- **Verify in the browser, not just in the diff.** A grep using a non-capturing group silently
  under-reported and left a legacy surface behind; the browser audit is what caught it.
- **The Browser pane does not composite when it is hidden.** `requestAnimationFrame` never fires
  there, so anime.js entrance animations sit at `opacity: 0` forever and `loading="lazy"` images
  never load. Both look exactly like real bugs. Screenshots also fail outright. Read the DOM instead,
  and force `loading="eager"` before asserting an image loaded.

---

## If you are picking this up now

Everything below is open. Nothing is half-finished — every commit was green before it was pushed,
and each item here is a decision or a fresh piece of work.

### The three decisions only the repo owner can take

1. **Unhide the Simulation tab?** `src/featureFlags.ts` states what is actually true now and says
   outright that the decision has not been revisited. The argument has changed: the tab discloses
   its own limits honestly *per spec*, and talents reach 11 specs. The remaining argument against is
   that **25 of 27 specs are single-ability approximations**. Nothing blocks a flip either way.
2. **Should talents reach `calculateStats`?** Today they reach `calculateSimulation` only, which
   keeps the blast radius inside a hidden tab. Widening it moves the always-visible stat rail, gear
   rankings and the upgrade finder — more correct, much more visible, and it makes "an empty tree
   reproduces today’s numbers exactly" a hard invariant.
3. **Is 7,700 the right boss armor?** Set this session, replacing 10,643. Both are community
   approximations rather than tooltip-exact, which is why the encounter still carries
   `needsVerification`.

### The work, in the order it is worth doing

~~**Caster and healer talents are blocked on plumbing, not data.**~~ **Done 2026-08-19.**
`calculateCasterDps` and `calculateHealing` now take `TalentModifiers`, and all nine classes are
ingested — **44 effects**, up from 30. Talents reach **25 of 27 specs**; the 2 Tank specs are the
remaining gap, because `calculateTankSurvivability` still takes no talent argument.

The plumbing came first deliberately, and the ingest second, because this repo's recurring failure is
shipping data nothing reads — a Mage effect with no caster talent argument to reach would have been
exactly that.

**What the caster half carries is narrow, and saying so is the honest part.** Four kinds only: spell
crit, spell hit, spell damage multiplier, and the Spirit regen that keeps running mid-cast. Measured
gains are modest and should be: Mage Fire **+7.6%**, Druid Balance **+6.3%**, Warlock Destruction
**+3.8%**, Shaman Elemental **+3.6%**, Priest Holy **+2.5%**, Priest Shadow **+2.4%**, Paladin Holy
**+1.5%**. The larger half — Ignite, Shadow Weaving, Ruin, every "Improved &lt;nuke&gt;" line — is
**per-spell**, and this simulator models one generic cast per spec and records no spell school, so
**45 talent groups are refused by name** with a reason each rather than approximated.

**The one that changes a stat's whole worth is Meditation.** wowsims gates Spirit regen during
casting entirely behind `SpiritRegenRateCasting`, which comes only from talents — Meditation, Arcane
Meditation, Intensity. Untalented it is exactly zero, which is why this project correctly priced
Spirit at nothing for healers. With rank 3, a Holy Priest's mid-cast regen goes **11.6 → 24.6
mana/sec**. The estimate's sentence about it is now *computed from the build* rather than written
about the app: it used to say those talents "are not modelled", which was true when written and
false the moment they were.

**Two branches went unreachable and are kept as guards**, matching how `TalentsPanel` handles the
same situation: `unmodelledTalentNoteFor`'s "this class has no ingested effects" path can no longer
fire, and a test asserts it does not.

**The "7 caster and 2 healer" figure was wrong wherever it appeared** (2026-08-18), which was this
file twice, `featureFlags.ts` and a test comment. Counted from `getRoleForSpec` — the same source
`App.tsx:175` feeds the simulator — the 27 specs are **11 Physical DPS, 9 Caster DPS, 5 Healer, 2
Tank**. So talents reach 11 and the uncovered remainder is 16. The split is now asserted in
`tests/planner.spec.ts` rather than written in prose, because prose is exactly how it drifted.

**Rotations are the biggest remaining gap and the reason the tab reads as indicative.** 25 of 27
specs are modelled from a single signature ability. ~~wowsims has full ability implementations for
all nine classes at the pinned commit, so this may be an ingest rather than a research project.~~
**Scoped 2026-08-18, and that hypothesis is wrong — `ROTATION-SCOPE.md`.** Talents were cheap because
a talent is a *number* upstream had already reduced; a rotation is an imperative state machine
reading live simulation state — current energy, combo points, aura remaining duration, stack counts,
time left in the fight — and **the mechanism is the entire content**. This simulator has no timeline
at all. The recommendation is a per-spec closed-form extension on a short list, starting with Hunter
(three specs, blocked only by an effect-type filter), not an ingest and not a general engine.

**The tank path is now the only one that reads no talents** — and with the caster and healer halves
closed, it is the whole of the remaining gap rather than one of three. Talents are applied in `calculatePhysicalDps`,
and a tank is scored by `calculateTankSurvivability`. A test pins this so it reads as a decision. The
seven formulas are already surveyed in §1.

**The rage dump still never fires.** Income reaches 5.4/sec against the 7.5 Bloodthirst and
Whirlwind want. Every expressible source is in; the remainder is rage from damage taken, which is an
encounter input defaulting to 0 and no longer reachable from the UI since the encounter was fixed.

**Known-wrong data still standing:** 123 of 226 curated items carry `needsVerification` — but read
the §"curated flags" note first, because 119 of those cannot affect the app at all.

**The gem procs are wired now, and they were not a tidy-up.** `ingest-item-effects.mjs` reads
`metagems.go`, so it always extracted **Mystical Skyfire Diamond (25893)** and **Thundering Skyfire
Diamond (32410)**
— but those are gems, and `Gem` had no `effect` field, so nothing consumed them.

**The severity was understated here as "wiring it is small".** Both gems carry `stats: {}` in the
catalogue, because wowsims models them purely as procs — so socketing either contributed **exactly
zero** and the panel told the player "No stats this app models". Mystical Skyfire Diamond was a
caster staple in TBC. `Gem.effect` now reuses the item `ItemEffect` shape, `sampleGems` layers it on
by `wowItemId` from the same `itemEffects.json`, `calculateStats` folds it in at `effectUptime`
**behind the meta-condition early return** — an inactive meta's proc is part of the nothing it grants
— and the panel states the proc with its uptime rather than at face value, which would overstate
Mystical Skyfire roughly sevenfold (320 spell haste for 4s on a 35s internal cooldown is 11% uptime).

Separately, 48 upstream effects are skipped as inexpressible
(damage procs, mana returns, health-only buffs) and the ingest reports each one — worth reading
before assuming an item has no effect.

**Talent scaling is built, and it did not do what this file predicted.** Stage 1 shipped 2026-08-15:
Warrior talents reach `calculateSimulation` and **deliberately nothing else**, so the always-visible
stat rail, gear rankings and upgrade finder are untouched. Widening that is a separate decision.

- **Source.** `tools/ingest/ingest-talent-effects.mjs` reads `sim/warrior/talents.go` at the pinned
  `3301fca5` — the framing below, that this needed prose extraction, was wrong: wowsims implements
  talents as *code*. 10 effects extracted, 9 talent groups refused by name with a reason each.
- **Result.** Fury DPS **192.3 → 224.3 (+16.6%)**, crit 8.1% → 13.1%, rage **3.4 → 5.4/sec**.
  (Post-7,700-armor figures. Against the old 10,643 target they read 165.6 → 193.2.)
- **Stage 2 is complete for every spec that can receive talents.** All **11 Physical DPS specs** are
  covered — Warrior Arms and Fury, all three Rogue, all three Hunter, Shaman Enhancement, Druid Feral,
  Paladin Retribution. **30 effects** across six classes (Warrior 11, Rogue 4, Hunter 5, Shaman 4,
  Druid 3, Paladin 3), with 33 talent groups refused by name and a reason each.
  Cheap because **talent ids are globally unique**, so one effects list serves every class and
  `deriveTalentModifiers` never changed. Largest gain is Hunter Beast Mastery **106.1 → 148.1
  (+39.6%)**, because **Serpent's Swiftness is +4% ranged attack speed a rank**.

  **Stage 3 closed the caster and healer half on 2026-08-19**, taking the ingest to **44 effects
  across all nine classes** and coverage to **25 of 27 specs**. The paragraph that used to sit here
  said those paths "take no talent argument at all" — true when written, and the reason the plumbing
  went first. Only the **2 Tank specs** remain, because `calculateTankSurvivability` still takes none.
  (This paragraph also said "7 caster and 2 healer" until 2026-08-18; the real split is 9 Caster DPS,
  5 Healer, 2 Tank, and it is asserted now rather than written.)

  **Shared talent names across classes are real, and not always the same effect.** Three classes have
  a **Precision** (Warrior max 3, Rogue max 5, Paladin max 3 — same effect, different caps). Warrior
  and Shaman both have **Weapon Mastery** — dodge reduction for one, physical damage for the other —
  and **Dual Wield Specialization** — off-hand damage for one, hit for the other. Effects are keyed by
  talent id and every extractor is cross-checked against its own class's tree; that is the only
  reason these do not cross-contaminate, and tests assert both directions.

  Two upstream shapes worth knowing before adding a class. **Paladin writes no coefficient at all**
  (`MeleeCritRatingPerCritChance*float64(Talents.X)`), which means 1 — the patterns anchor on the
  talent *and* the rating constant with nothing between, so a coefficient appearing later breaks the
  match rather than being ignored. **Druid scales by character level** (`rank * 0.5 * CharacterLevel`),
  folded in at 70 since that is the only level modelled.
- **It covers Arms too, free.** `deriveTalentModifiers` is keyed by **talent id** and
  `warriorTalents.json` carries all three trees, so any spec sharing the class shares the effects —
  nothing about the mechanism is Fury-specific. Arms measured **236 → 271.6**. Adding a class means
  adding its extractors, not its specs.
- **Protection gets nothing, and that is the honest gap.** Talents are applied in
  `calculatePhysicalDps`; a Protection Warrior is scored by `calculateTankSurvivability`, which never
  receives them. So Toughness, Vitality, Anticipation, Defiance and the shield talents reach nothing.
  The ingest already refuses them by name with that reason, so the *data* side is consistent — it is
  the application side that stops at the DPS path. A test pins this so it reads as a decision rather
  than an oversight. Their formulas are already surveyed in `sim/warrior/talents.go` if it is picked
  up: Anticipation +4 Defense/rank, Toughness armour ×(1+0.02·rank) on items only, Vitality stamina
  ×(1+0.01·rank) and strength ×(1+0.02·rank), Defiance +2 expertise/rank, Deflection +1% parry/rank,
  Shield Specialization +1% block/rank, Shield Mastery block value ×(1+0.1·rank).
- **The falsification test half failed, which is the point of having written it first.** The scope
  required DPS to move *and* the rage gap to close. It did not close: 5.2 against 7.5, and Heroic
  Strike is still excluded. **Talents are a major missing piece but they are not the rage fix.**
- **Why:** Flurry is gated on crit. The stack chain solves to a closed form (Markov chain over the
  3-stack aura; `π₀ = (1-c)³`), and at 13% crit a "+25% attack speed" talent is worth **+7.4%**.
- **A bug worth the retelling.** `rageGeneratedMultiplier` was in neither dispatch map, so Endless
  Rage contributed nothing and the first measured rage figure was 4.2 rather than 5.2. It surfaced
  only because a test asserted the modifier's *value*; asserting "DPS went up" would have passed with
  the talent doing nothing. `talentModifiers.ts` now throws at import if any ingested effect kind has
  no destination.

Superseded framing kept for contrast — it gates rage income (Flurry's 25% attack
speed after a crit is where a Fury warrior's swing rate really comes from), and it is what keeps
melee DPS low. The talent *data* is already ingested for all nine classes — but as **prose**
(`rankDescriptions`), not machine-readable effects, so this needs an extraction or authoring step
first. **Now scoped — `TALENT-SCALING-SCOPE.md`**, which corrects the framing in this paragraph:
talent *effects* are machine-readable in wowsims at the already-pinned `3301fca5` (all nine classes;
four warrior files are already in the ingest cache), so this is an ingest like item effects, not a
prose-extraction job. The recommendation is one spec — Fury Warrior, character-global talents only —
with a falsification test stated up front. One product decision is open and gates the size: whether
talents reach `calculateStats` and therefore the always-visible stat rail, or only the hidden
simulator.

**Both chores are done.** The 19 stale local branches are **deleted** (2026-08-15): 18 via
`git branch -d --merged main`, and `worktree-agent-afb0a902111f3a642` via `-D` after checking that
every file it added is already present in `main` — the raids rebuild superseded it.

**The ten that also existed on `origin` are deleted too**, on the repo owner's say-so, since this is
a public repo and removing a published branch is a decision rather than a cleanup. All ten were
ancestors of `origin/main`, so nothing was lost; their tips are recorded here in case GitHub's
restore window ever lapses:

```
agent/integration-tbc-foundation 96ec2ab   feature/shaman-elemental-restoration-bis af50465
data/expand-tbc-items-bis-foundation b686e9d  feature/spec-aware-bis-sources-enhancement 657774c
feature/animejs-loading-polish 00c68cf     feature/spec-aware-slot-visibility cc0d3dc
feature/bis-panel-equip-from-list b36bce3  feature/warrior-arms-fury-protection-bis 1e099b5
feature/race-class-legality-and-crafting-data 0527e72   local-mvp-simulator fcade15
```

**Both stale worktrees are gone as well.** `.claude/worktrees/lucid-cartwright-9d8b8c` was detached
at `68aae34`, reachable from `main`, so its work was merged and the checkout was only costing
OneDrive sync; `agent-afb0a902111f3a642` was already an empty husk git no longer tracked. `git
branch -a` is now `main` and `origin/main`, and `git worktree list` is the one checkout.

**CI is off the deprecated Node 20** (2026-08-15). `deploy.yml` went `checkout` v4→v7,
`setup-node` v4→v7, `configure-pages` v5→v6, `upload-pages-artifact` v3→v5 and `deploy-pages` v4→v5,
all now on Node 24. **Verified end to end**, not just green: the run succeeded and the live site
serves the same asset hashes the local build produced.

Two hazards were checked rather than assumed, because this workflow publishes the live site.
`upload-pages-artifact` **v4 stopped including dotfiles** in the artifact — this `dist` has none, so
nothing is dropped; and `deploy-pages` v4+ **only accepts artifacts from `upload-pages-artifact` v3
or newer**, which v5 satisfies. `actions: read` was also added: `deploy-pages` has required it since
v4, because build and deploy are separate jobs here and the deploy fetches the artifact by id
through the Actions API. Deploys were succeeding without it, so that closed a documented gap rather
than a live break.

`node-version` stays at **22** deliberately — the Node an *action* runs on is a different thing from
the Node the app is built with, and changing the latter is its own decision.

An earlier version of this note named `upload-artifact@v4`, which this
workflow does not use, and omitted `deploy-pages@v4` entirely — so check the file, not the note.

**The curated `needsVerification` flags were audited, and the count was never the point.** It looked
like 124 Wowhead lookups. Measuring what the flag still *governs* said otherwise, and that is the
finding worth keeping:

- **119 of the 120 remaining flags cannot affect the app.** Those entries match an ingested row, so
  `itemCatalogue.ts` builds the item from the ingest and overlays only `PROVENANCE_FIELDS` — their
  stat blocks are dead weight. **118 of their notes still say "stats are approximate pending final
  Wowhead audit"**, which was true when this file *was* the catalogue and now describes unused data.
  Read those as "drop location, vendor and roles unverified". The semantics are documented in
  `sampleItems.ts`'s own header rather than by rewriting 118 notes.
- **The risk was always the *unmatched* entries**, which ship whole with their invented numbers.
  `catalogueMeta.unmatchedCuratedCount` is the number to watch; it went **33 → 28**, and
  load-bearing flags went **7 → 1**.

**Four fictional items were selectable in gear dropdowns** and are now deleted: Training Sword,
Practice Longbow, Shield of Rehearsal ("COULD NOT BE LOCATED"), and **Voidheart Cover — which this
very file already recorded as invented**. None was referenced by any BiS ranking, so the stated
reason for keeping unmatched entries ("so BiS and raid-loot references keep resolving") applied to
none of them. Curated count 230 → **226**.

**Voidheart Cover was a chain, not a single bad row.** It was also SSC raid loot labelled a Warlock
T5 helm. Voidheart is the Warlock **T4** set (ilvl 120); T5 is **Corruptor Raiment**. The real piece
is **Hood of the Corruptor** (30212, ilvl 133), which is what its four sibling T5 helms in that same
loot table look like — every one of them a real item with a `wowItemId` at ilvl 133. The fictional
entry was the only one without one, which is the tell worth reusing.

**Two more were real items that had simply never been given a `wowItemId`**, which is exactly why
they never matched and shipped invented stats:

| | Curated claimed | Real |
|---|---|---|
| Choker of Vile Intent | ilvl 115, 18 crit rating | **29381**, ilvl 110, no crit — plus **42 attack power and 42 ranged attack power** the entry missed entirely |
| The Sun King's Talisman | ilvl 128, 54 spell power | **30015**, ilvl 138, 41 spell power, plus 22 stamina and 41 healing power missed |

**One flag is deliberately kept.** Blessed Book of Nagrand ships whole and is flagged for a *schema
gap*, not a doubt: its value is confirmed (no stats; it adds 79 healing to Flash of Light
specifically) and nothing in `StatBlock` can express a spell-specific effect.

Still standing: 39 raid loot entries name items the catalogue does not hold — mounts, enchant
formulas and tier tokens, correctly absent rather than missing.

**Deleting an item can make a test pass for the worst reason.** Removing Shield of Rehearsal left an
assertion that it was *absent* from an Enhancement Shaman's off-hand list — which would then have
held however broken the filtering became. It now names Aldori Legacy Defender, a real Tank shield a
Protection Warrior **is** offered (247 off-hand options against an Enhancement Shaman's 126), so the
absence proves the filter rather than the deletion.

**Do not count that one with grep — load the module.** An earlier pass through this file "corrected"
124 to 123 on the strength of a grep, and the grep was what was wrong. Three ways to count it
disagreed:

- A bare `needsVerification: true` returns **163**, because `crafting` blocks and individual
  `crafting.materials[]` entries carry their own flags.
- Anchoring to the item indent (`^    needsVerification`) returned **123**, because
  `arcanite-steam-pistol` had its flag and `boss` written at **zero** indentation. Functionally fine,
  invisible to the eye, and silently one short. That formatting is now fixed, so the anchored grep and
  the real figure agree at 124 — but only by luck of nobody writing the next one crookedly.
- Importing `sampleItems` and filtering `needsVerification === true` returns **124**, and is the only
  method that cannot be defeated by whitespace.

The wider point is the one the repo already makes about scripted edits: a pattern that matches
nothing, or matches nearly everything, reports success either way. Count structured data by parsing
it.
