# Project Defeat — handoff

**Written 2026-08-09.** Self-contained brief for picking this up in a fresh chat. If `git log`
disagrees with this file, trust git.

Repo: `C:\Users\josep\OneDrive - Saint Louis University\Project Defeat`, on GitHub as
`josephevenson08/project-defeat`, currently at **`a071bae`**, everything pushed.

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

## Verify you're where this describes

```bash
npx tsc -b                            # exit 0
npm run lint                          # exit 0
npm run build                         # exit 0
npx playwright test --reporter=line   # 100 passed, 0 skipped, 0 failed
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
| Items | 230, inferred | **4,560** merged, validated |
| BiS entries | 463, only 2 deeper than rank 1 | **1,440** across 27 specs |
| Gems | 11 | **212** |
| Enchants | 22 | **91** |
| Consumables | 14 | **31** |
| Gem/enchant recommendations | none | **107 + 274** |
| Raid buffs | 14, all unverified | **33**, each cited to a spell rank |
| Target debuffs | 6, all unverified | **6**, each cited to a spell rank |
| Tier set bonuses | 9 sets, partly paraphrased | **34 sets** (T4 + T5), 71 bonuses, verbatim |
| Talents | none | **579** across all 9 classes, 27 trees |
| Spec tier lists | none | **3 lists**, 28 placements, all 27 specs |
| Icons | none, two-letter glyphs | **1,609 files** vendored, 2.8 MB — items, gems and talents |
| Item effects | 14 curated, 0 ingested | **55 items**, 46 of 175 trinkets |

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
  fell to its honest value: **Fury 196.5 → 165.6, Arms 233.7 → 203.2, Combat Rogue 205.6 → 185.6**.
  Feral is unchanged, correctly, because cat form swings its own weapon.

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
  4,560 items carry melee haste and none is Phase 2 raid gear — so the test injects 158 rating
  (exactly +10%) rather than equipping something. Worth knowing before "fixing" it again: the
  absence is real TBC, not missing data.
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
- **Raid loot notes reading "not yet in the item catalog" went stale without anything editing them.**
  That data was written when the catalogue held 230 hand-written items; it now holds 4,560, and 85 of
  the 124 unlinked entries named an item that was already present. They carried no `itemId`, so they
  drew the `??` frame and the note was simply false. `tools/ingest/link-raid-loot.mjs` links by exact
  unique name — never guessing where a name matches two items — and trims only that one stale
  sentence, so notes carrying something else real ("Wizard of Oz variant only") keep it. Resolution
  went 148 → **233 of 272**; Karazhan 19 → 35 of 45. The remaining 39 are correctly unresolved:
  mounts, enchanting formulas and tier tokens are not gear and should not draw a gear icon.
- **The ten files in `src/domain/raids/` were marked read-only on disk**, alone in the whole repo —
  an artifact of the worktree agent that created them on 2026-07-30. Any scripted edit there fails
  with `EPERM` until the attribute is cleared. Nothing else under `src/` has it.
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

**All three of the reasons `featureFlags.ts` gives for hiding the tab have now been addressed** —
rage, item procs and the healer mana constraint. The flag's own wording is stale as a result; it
still says "rage is not modelled at all". Whether the numbers are now defensible enough to show is a
judgement, not a blocker, and it has not been taken.

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
Fury Warrior from 125 to 148 DPS and took hit chance from 21.7% to 39.2%. `attacksFromBehind` is now
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
`(1 + haste)` and rage income with it, so the mechanism is in place — but only **78 of 4,560**
catalogued items carry melee haste and **none at Phase 2 raid item level**, which is faithful to TBC
rather than a data gap: the expansion put almost no haste rating on early gear. So modelling it moved
no current number. The rage shortfall is therefore gated on **talent scaling**, not gear: Flurry's
30% attack speed after a crit is where a Fury warrior's real swing rate comes from, and talents reach
the simulation nowhere at all.

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

The remaining gap for melee is therefore **haste**, not a priority-list engine.

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

Both design decisions that were parked here have since been taken, and are recorded in §2b below.
Still open:

- **`h3` is styled at five sizes** (11, 13, 15, 20px and a mono label variant). The 11px mono
  uppercase one is a deliberate label pattern, not a smaller heading, so this is not purely a bug —
  but the tag is doing two different jobs and that is worth resolving deliberately.
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

**Still true afterwards, and worth knowing:** Ranked Gear on its own is *still* 9.4 screens. Sub-tabs
fixed navigation, not that panel's length. Capping each slot's ranking at a few entries with a "show
all" is the remaining move if it matters.

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
