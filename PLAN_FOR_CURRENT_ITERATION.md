# Plan for the current iteration of the game

**Purpose.** Project Defeat targets TBC Classic Anniversary **Phase 2** on purpose. The live game has moved on. This file is the
running plan for bringing the app up to the game's current iteration. **It is planning only. No implementation starts until the
owner says go.** The goal is to be completely sure of the data, the scope and the order of work first.

- Started: 2026-11-03 (Day 1)
- Owner's rule: nothing in `src/` changes for this until the owner approves the plan.
- Updated every morning by a scheduled run. See "How the daily run works".

---

## How the daily run works

Each morning (7:00 AM Central) a scheduled run does this, in order:

1. Clone or pull the repo and read this whole file, especially "Status", "Open questions" and the "Daily log".
2. Find today's row in "The daily schedule". If earlier days were skipped or came out thin, finish those first.
3. Research that topic: web search and fetch for the game, and read-only looks at the repo's code and data for the app.
   Wowhead refuses scripted requests, so do not try to run the `tools/ingest` scripts against it.
4. Update the sections the research changes (gap table, decisions, risks, estimates). Correct anything that turns out wrong and
   leave a note in the Daily log saying what changed and why.
5. Append a dated entry to the "Daily log": what was done, what was learned, what is still unsure, what comes next.
6. Commit only this file, with `[skip ci]` in the message so the site is not redeployed, and push to `main`.

Rules for the run: change only this file; never edit `src/`, `tests/`, `tools/` or the owner's other docs; put claims that come from
fan sites or a single source under "Unverified" until a second source agrees; and say when two sources disagree.

---

## Status (as of Day 1, 2026-11-03)

| Question | Answer today |
| --- | --- |
| What the app targets | TBC Classic Anniversary **Phase 2** (Karazhan, Gruul, Magtheridon, SSC, Tempest Keep). `src/domain/phase.ts` sets `CURRENT_PHASE = 2`. |
| What the game is on | **Phase 3** (Black Temple and Mount Hyjal) went live 2026-08-27. The **Zul'Aman / catch-up update went live 2026-10-22**. Fan sites call it Phase 3.5 or Phase 4. The owner calls it Phase 4. |
| Next in the game | **Phase 5, Fury of the Sunwell.** No firm date found yet ("autumn 2026" on one site). |
| How far behind the app is | Two content updates. |
| Ready to implement? | **No.** Day 1 only sets the baseline. See "Open questions". |

### Naming caution (needs settling on Day 2)

Sources disagree on what to call the October update. Warcraft Tavern's phase table lists "3.5" and "Phase 4: The Gods of
Zul'Aman" on the same date, 2026-10-22. Blizzard Watch (2026-10-09) calls it "more of a mini-phase" called Phase 3.5. Until a
Blizzard source settles it, this file says **"Phase 4 (the 2026-10-22 Zul'Aman update)"** and means everything that shipped on that
date.

---

## Where the app is (from the repo)

Facts read from the repo on 2026-11-03:

- **Phase is a single constant.** `CURRENT_PHASE = 2` in `src/domain/phase.ts`, whose comment already says a phase switcher is
  what a later phase would set.
- **Phase 2 shows up in about 50 source files**, including BiS (`src/domain/bis/*`), raids (`src/domain/raids/*`), the item
  catalogue, buffs, consumables, professions, tier lists, simulation reference data, builds and share links, and the UI
  (`PhaseChip`, `Provenance`, `BossJournal`, `ForMyRaid`, `WhichTwo`). The `phase:` field in domain data is `2` about 143 times and
  `1` about 63 times, with a handful of `3` and `5`.
- **Rankings.** `bisRankings.json` holds 1,427 entries from 24 Wowhead Phase 2 guides covering 27 specs, fetched 2026-08-07.
  `tierLists.json` is also Phase 2.
- **Raids.** Five raids, each in its own file (Karazhan, Gruul's Lair, Magtheridon's Lair, Serpentshrine Cavern, Tempest Keep).
  `RaidTier` is typed as `'T4' | 'T5'`, so Tier 6 does not fit the type yet.
- **Catalogue.** `itemCatalogue.json` has 4,505 items. Raid loot comes from `tools/ingest/data/raid-loot.*.json`, one file per raid.
- **Attunements.** `sampleAttunements.ts` models attunement steps, which the October update removes for every TBC raid.
- **Tests.** 340 Playwright tests passed at the last handoff (2026-10-15).
- **The redesign port is mid-flight.** Port steps 0 to 3 are done (look, Spec Tier Lists, Raids, Professions). Steps 4 to 7
  (Simulation, Raid Composition, Character Planner, 3D scene) are planned. This work has to be sequenced against them. See "Open
  questions".
- **Ingest tooling exists** in `tools/ingest/` (`ingest-bis.mjs`, `ingest-raid-loot.mjs`, `ingest-items.mjs`, `ingest-tier-lists.mjs`
  and others), but Wowhead currently refuses scripted requests (the node ingest has been blocked since 2026-10-13).

---

## Where the game is (research)

### Phase timeline

| Phase | Name | Content | Anniversary date | Source status |
| --- | --- | --- | --- | --- |
| 1 | The Burning Crusade | Karazhan, Gruul's Lair, Magtheridon's Lair, Arena Season 1 | 2026-02-05 | In the app |
| 2 | Overlords of Outland | Serpentshrine Cavern, Tempest Keep: The Eye, Arena Season 2 | 2026-05-14 | **In the app** |
| 3 | Black Temple (patch 2.5.6) | Battle for Mount Hyjal (5 bosses), Black Temple (9 bosses), Arena Season 3 | 2026-08-27 | **Not in the app** |
| 3.5 / 4 | The Gods of Zul'Aman | Zul'Aman, Badges of Justice, attunement removal, dungeon changes | 2026-10-22, 3:00 PM Pacific | **Not in the app** |
| 5 | Fury of the Sunwell | Sunwell Plateau, Magisters' Terrace, Isle of Quel'Danas, Arena Season 4 | "Autumn 2026", unconfirmed | Watch only |

### What Phase 3 adds (affects the app)

- **Two 25-player raids:** Mount Hyjal and Black Temple, dropping **Tier 6** gear.
- **Epic gems** from Jewelcrafting designs learned in the Caverns of Time, and as drops from the Tier 6 raids.
- **Reputations and dailies:** Scale of the Sands, Ashtongue Deathsworn, Netherwing dailies. Items such as Band of Eternity need
  Scale of the Sands. The Phase 2 roadmap noted these as unreachable.
- **Extra tier tokens** drop from earlier raids in Phase 3 (Warcraft Tavern headline, details not yet read).
- **Arena Season 3**, with earlier seasons' gear moving to vendors at a discount.
- Legendary: Warglaives of Azzinoth (Black Temple).

### What the 2026-10-22 update adds (affects the app)

- **Zul'Aman:** 10-player, Ghostlands, six bosses (Nalorakk, Akil'zon, Jan'alai, Halazzi, Hex Lord Malacrass, Zul'jin), no
  attunement, 3-day lockout, a timed hostage mechanic for extra loot and the Amani War Bear.
- **Badges of Justice** drop from all Karazhan, Gruul, Magtheridon, SSC, Tempest Keep and Zul'Aman bosses, plus Doom Lord Kazzak
  and Doomwalker. **G'eras in Shattrath sells new, stronger gear** for badges. This probably changes many specs' BiS lists.
- **Attunements are removed** for every TBC raid. The Hand of A'dal title goes to players who already completed them.
- **Heroic dungeons are nerfed** to the original 2.4.3 state, and Heroic keys need Honored instead of Revered.
- **Epic gems** can now come from Magtheridon's Black Sack of Gems and Jewelcrafter's Brilliant Glass.
- **Primal Nether and Nether Vortex** are no longer soulbound. The two Outland world bosses drop Bind on Equip loot.
- Leatherworkers can learn upgraded rare drum recipes. Hunter pet buffs apply to all pets at once (listed as Phase 4 in one source).

### Unverified (do not build on these yet)

- The patch notes page read on Day 1 (Warcraft Tavern, "2.5.4") is the **original 2022 TBC Classic 2.5.4** notes, which the
  Anniversary update mirrors. It lists no class, spell or balance changes. Whether the Anniversary update changes balance is
  unconfirmed. Find Blizzard's own notes for the Anniversary patch.
- "Buff and debuff limit removed", "dual talent specialization", and "Heroism resets on encounter end" are listed as Anniversary
  changes by a fan summary. They affect the simulator and talents and need a primary source.
- Tier 6 set and token details were not on the pages read. The dates for Phase 5 are not firm.

---

## Gap analysis: what the app would need

Initial sizing only. To be refined by the daily runs. "Size" is a rough guess: S is under a day, M is a few days, L is about a week
or more.

| # | Area | What changes | Size |
| --- | --- | --- | --- |
| 1 | **Phase model** | Replace the constant with a phase concept that data can be tagged by, keep Phase 2 viewable, and decide how share links and saved builds record a phase. | M |
| 2 | **Raids** | Add Mount Hyjal, Black Temple, Zul'Aman: bosses, loot, art. Widen `RaidTier` for T6. Remove or retire attunement content. Update the "five raids" assumptions and tests. | L |
| 3 | **Item catalogue** | Add Tier 6, Hyjal/BT/ZA drops, badge-vendor gear, Season 3 gear. Run the "needs verification" checks on all of it. | L |
| 4 | **BiS rankings** | Re-ingest 27 specs for the new phase (Wowhead has Phase 3 and 4 pages; Icy Veins and Warcraft Tavern have Phase 3/4 and Phase 4 lists). Decide on one rankings source per phase. | L |
| 5 | **Gems and enchants** | Epic gems and any new enchants. Update per-spec gem recommendations. | M |
| 6 | **Tier lists** | Re-ingest Wowhead's tier lists and the logs-based view for the new phase. | S to M |
| 7 | **Acquisition and costs** | Badges of Justice, G'eras vendor, Nether Vortex as currency. `acquisitionCosts.json` needs new currencies. | M |
| 8 | **Reputations, professions, consumables** | Scale of the Sands, Ashtongue, Netherwing; new Jewelcrafting designs; drums; any new consumables or buffs. | M |
| 9 | **Simulation** | Only if balance or class changes exist. `dpsReference.ts` and the rotation work depend on the answer to the unverified items above. | unknown |
| 10 | **UI and copy** | Phase chip, provenance lines, phase switcher, README and docs text that says "Phase 2". | S to M |
| 11 | **Tests** | The 340-test suite is full of Phase 2 numbers. Expect a large update pass. | M to L |
| 12 | **Brain and docs** | `npm run brain`, handoff, features list, roadmap. | S |

---

## Open questions for the owner

These need an answer before the plan can be called final. The daily runs add to this list but never decide for you.

1. **One phase or a switcher?** Move the whole app to the current phase, or keep Phase 2 viewable alongside it? The comment in
   `phase.ts` suggests a switcher. A switcher is the larger job and roughly doubles the data to carry.
2. **Which phase is "current"?** Target the 2026-10-22 update (Phase 4) directly, or build Phase 3 first and Phase 4 on top?
   Because attunements, badges and gear all changed in October, building only Phase 3 would be out of date on arrival.
3. **How does this fit the redesign port?** Steps 4 to 7 are still planned. Do this work before them, after step 4, or in
   parallel on a branch?
4. **Phase 5.** Wait for Sunwell news, or plan the data model so it slots in later?
5. **Ranking source.** Keep Wowhead as the single source (consistent with the current data), or accept a second source where
   Wowhead's phase guides lag?
6. **Deploy rule.** Today the plan commits with `[skip ci]`. Implementation pushes redeploy the live site. Confirm you still want
   to approve each implementation push.

---

## The daily schedule

Each day has one topic. Finish the topic, log it, and move to the next row on the following morning. Rows can be re-opened if a
later day finds a mistake. After Day 14, keep the daily run going: re-verify, track Phase 5 news and reduce "Unverified" items.

| Day | Date | Topic | Output into this file |
| --- | --- | --- | --- |
| 1 | Nov 3 | Baseline: where the app is, where the game is, first gap table | Done. See Daily log. |
| 2 | Nov 4 | Settle the timeline and naming from Blizzard primary sources: patch notes and news posts for Phase 3 and the Oct 22 update; confirm Phase 5 status | Corrected timeline, unverified list shrunk |
| 3 | Nov 5 | Code audit: every Phase 2 coupling in `src/`, `tests/`, `tools/`, docs; how `phase` flows through data, types, share links and saved builds | Coupling inventory, a proposed phase data model |
| 4 | Nov 6 | Mount Hyjal and Black Temple: bosses, loot tables, trash drops, tokens. Check what the `ingest-raid-loot` pipeline can reuse | Raid data inventory, item counts |
| 5 | Nov 7 | Tier 6 sets and tokens, epic gems, Jewelcrafting designs, extra tier tokens in earlier raids | Item and gem scope with counts |
| 6 | Nov 8 | Zul'Aman: bosses, loot, timed-hostage loot, mount. Badges of Justice and G'eras vendor inventory | ZA and badge-gear inventory |
| 7 | Nov 9 | BiS: which published lists exist for Phase 3 and Phase 4 per spec (Wowhead, Icy Veins, Warcraft Tavern); how they differ; fit with `ingest-bis.mjs` | Rankings source decision memo |
| 8 | Nov 10 | Anniversary-specific mechanics: balance, talents, buff limit, Heroism reset, dual spec, pet buffs. Find primary sources | Sim impact list, shrinks "Unverified" |
| 9 | Nov 11 | Reputations, attunement removal, professions, consumables and buffs added or changed | Scope for items 8 and the attunement code |
| 10 | Nov 12 | Tier lists and logs data for the current phase; what the Spec Tier Lists tab needs | Tier list scope |
| 11 | Nov 13 | Tests and docs impact: which of the 340 tests break and why; what the redesign port changes about it | Test impact table |
| 12 | Nov 14 | Sequencing against port steps 4 to 7; risks (Wowhead blocking, data accuracy, phase switcher); effort ranges | Ordered work packages with estimates |
| 13 | Nov 15 | Draft implementation plan v1: work packages, order, acceptance checks per package | Implementation plan v1 |
| 14 | Nov 16 | Go/no-go review: walk the "Sureness checklist", list anything unresolved, summarise for the owner | Go/no-go summary at the top of this file |

---

## Sureness checklist (what "completely sure" means)

Tick these as the daily runs satisfy them. Implementation should not start until the owner has seen every box ticked or has
explicitly accepted the open ones.

- [ ] The phase timeline and the name of the October update confirmed from Blizzard's own posts
- [ ] Every Phase 3 and October-update change that touches stats, items, raids or rules is listed with a source
- [ ] Anniversary-specific mechanics (balance, buffs, talents) confirmed or ruled out from a primary source
- [ ] A phase data model chosen, with the owner's answers to open questions 1 to 3
- [ ] Item and raid counts for each new raid, with a way to get the data that works while Wowhead blocks scripts
- [ ] A rankings source chosen for each of the 27 specs
- [ ] The test impact estimated, with a plan to keep the suite green during the change
- [ ] Work packages ordered, each with a done-test, and sequenced against the redesign port
- [ ] The owner has read the go/no-go summary and said go

---

## Daily log

Newest entry last. Each run appends; never rewrite earlier entries (correct them in the body and note the correction here).

### Day 1: 2026-11-03

**Done**
- Read the repo's handoff, roadmap, port plan, README and phase constant, and surveyed where Phase 2 appears in `src/`.
- Researched the game's phase schedule and what Phase 3 and the 2026-10-22 update add.
- Created this file and set up the daily morning run.

**Learned**
- The app is two content updates behind: Phase 3 (2026-08-27) and the Zul'Aman update (2026-10-22).
- The October update is the larger change for a gear planner: badges and G'eras gear, attunements removed, epic gem sources,
  Zul'Aman.
- Sources disagree on whether the October update is "Phase 3.5" or "Phase 4".
- The patch notes found were the 2022 originals, so class and balance changes are unconfirmed.

**Still unsure**
- Everything under "Unverified". Tier 6 details. Sunwell's date.

**Next (Day 2)**
- Settle the timeline and naming from Blizzard sources, then shrink the Unverified list.

---

## Sources (Day 1)

- Warcraft Tavern, content phases, schedule and roadmap: https://www.warcrafttavern.com/tbc/guides/phases/
- Warcraft Tavern, Phase 3 overview: https://www.warcrafttavern.com/tbc/guides/phase-3/
- Warcraft Tavern, Phase 4 overview: https://www.warcrafttavern.com/tbc/guides/phase-4/
- Warcraft Tavern, TBC Classic 2.5.4 patch notes (original 2022): https://warcrafttavern.com/tbc/news/official-2-5-4-patch-notes-tbc-classic-phase-4
- Warcraft Tavern, changes from the original Burning Crusade: https://www.warcrafttavern.com/tbc/guides/changes-from-the-original-burning-crusade/
- Blizzard Watch, Phase 3.5 announcement (2026-10-09): https://blizzardwatch.com/2026/10/09/burning-crusade-classic-anniversary-phase-3-5/
- Icy Veins, Phase 3/4 gear lists (found, not yet read): https://icy-veins.com/tbc-classic/fury-warrior-dps-pve-phase-3-4-gear-best-in-slot
- Repo files: `src/domain/phase.ts`, `src/domain/bis/bisRankings.json`, `src/domain/raids/raidTypes.ts`, `docs/design/PORT-PLAN.md`,
  `docs/dev-log/HANDOFF.md`, `docs/ROADMAP.md`
