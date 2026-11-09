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

## Status (as of Day 7, 2026-11-09)

| Question | Answer today |
| --- | --- |
| What the app targets | TBC Classic Anniversary **Phase 2** (Karazhan, Gruul, Magtheridon, SSC, Tempest Keep). `src/domain/phase.ts` sets `CURRENT_PHASE = 2`. |
| What the game is on | **Phase 3** (Black Temple and Mount Hyjal) went live 2026-08-27. The **Zul'Aman / catch-up update went live 2026-10-22**. Fan sites call it Phase 3.5 or Phase 4. The owner calls it Phase 4. |
| Next in the game | **Phase 5, Fury of the Sunwell.** No firm date. Warcraft Tavern says "Autumn 2026", patch TBA (Day 2, summary-based read). No Blizzard post mentions it. |
| How far behind the app is | Two content updates. The item catalogue already holds wowsims-tagged Phase 3, 4 and 5 items (see "Coupling inventory"), but rankings, raids, loot tables and tier lists do not. |
| Ready to implement? | **No.** Day 4 found that Hyjal and Black Temple loot cannot be linked to bosses from data already in the repo. Day 5 got a token-to-boss mapping, but only from a 2019 wiki page about the original game, and Blizzard's own Phase 3 post is still unread. Day 6: Zul'Aman loot and the G'eras badge-gear list could not be read at all (fetches refused again), so the badge-gear and Zul'Aman item scope is still unknown. See "Raid data inventory (Day 4)", "Tier 6, tokens and gems (Day 5)" and "Zul'Aman and badge gear (Day 6)". Day 7: BiS lists for Phase 3 and 4 do exist on three sites, but the one Icy Veins page read is a 2022 original-game page, Wowhead's were refused, and the ingest's Wowhead URL scheme does not match the Phase 3/4 pages (see "BiS sources (Day 7)"). |

### Naming (Day 2 finding: Blizzard uses no phase number)

Blizzard's own post for the update is titled **"BCCA: The Gods of Zul'Aman Now Live"** (byline "October 22nd", no year or time in the text
read) and never says "Phase 3.5" or "Phase 4". "Phase 3.5" and "Phase 4: The Gods of Zul'Aman" are fan-site labels. The plan keeps the
working label below and uses **"the Zul'Aman update"** in prose.

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
- **The catalogue already carries later-phase items** (Day 3): see the coupling inventory below.
- **Ingest tooling exists** in `tools/ingest/` (`ingest-bis.mjs`, `ingest-raid-loot.mjs`, `ingest-items.mjs`, `ingest-tier-lists.mjs`
  and others), but Wowhead currently refuses scripted requests (the node ingest has been blocked since 2026-10-13).

---

## Coupling inventory and proposed phase model (Day 3)

Read-only audit of the repo on 2026-11-05 using grep and file reads. Counts are from that grep and may move by a few.

### Where "Phase 2" is hard-coded

| Where | What it does | Change needed |
| --- | --- | --- |
| `src/domain/phase.ts` | `CURRENT_PHASE = 2` builds `PHASE_LABEL`. Only `PhaseChip.tsx` and `SectionPicker.tsx` read the label. Nothing else imports `CURRENT_PHASE`. | One line plus the label wording. This is the smallest piece. |
| `src/domain/gear/itemCatalogue.ts` | `defaultMaxPhase = 2`. Slot pickers, the BiS ranking filter and `isWithinDefaultPhase` use it. | Must move together with the label, or the UI says Phase 4 while hiding Phase 3 and 4 gear. |
| `src/domain/builds/addonImport.ts` | A second, separate constant: `RANKED_THROUGH_PHASE = 2`, used for the "from a later phase" import warning. | A third copy of the same number. Should come from one place. |
| `src/domain/builds/buildSerialization.ts` | Reuses `defaultMaxPhase` in its "is Phase N gear" message. `BUILD_FORMAT_VERSION = 1`. The grep found no phase field written into a saved build. | Decide whether a build records its phase (open question 9). Gear above the ceiling is already worn and noted, not dropped. |
| `src/domain/bis/bisLists.ts` | Each ranked list carries `phase`; its id and title are built from it ("... Phase 2 Ranked List"). Entries above the ceiling are dropped. | Titles and ids change with the data. Test text depends on them. |
| `src/domain/bis/bisRankings.json`, `tierLists.json` | All Phase 2 data. | Re-ingest (see rows 4 and 6 of the gap table). |
| `src/domain/raids/raidTypes.ts` | `RaidTier = 'T4' \| 'T5'`. | Add T6 (and decide how Zul'Aman, a 10-player raid with its own gear level, is typed). |
| `src/domain/raids/sampleAttunements.ts` (250 lines), `RaidAbout.tsx`, `App.tsx`, `index.ts` | Attunement chains for the five raids. | Retire or mark as "no longer required" per raid. Depends on Day 9 findings. |
| `tools/ingest/bis-guides.mjs` | 26 Wowhead guide paths all ending `-pve-phase-2`. `ingest-bis.mjs` and `ingest-tier-lists.mjs` write `phase: 2`. `ingest-bis-recommendations.mjs` derives its gem/enchant path from the phase-2 name. | Parameterise by phase. Wowhead's Phase 3/4 URL names are not yet checked. |
| `tools/ingest/ingest-raid-loot.mjs` and `data/raid-loot.*.json` | Five raid files only. | Add Hyjal, Black Temple, Zul'Aman (Days 4 and 6). |
| `tests/` | Phase wording appears in all of: planner (138 lines of 13,439), look (7), ranked (4), raids (2), simulation (2), tierlists (2), compare, gear, professions (1 each). | Day 11 will sort these into "text only" and "number changes". |
| Docs | `docs/features.md`, `docs/known-limitations.md`, the brain generator and README say Phase 2. Many files under `docs/research` and `docs/design/prototypes` also mention it but are history, not copy. | Do not edit history files. Update the live ones with the work. |

About 63 source files under `src/` contain the words "Phase 2" (code or comments). Most are comments and provenance strings, not logic.

### What is already in the catalogue

`itemCatalogue.json` (4,505 items) is generated from the open-source wowsims/tbc item database, pinned to commit `3301fca5`. Its phase tags are wowsims's: phase 1: 2,691; phase 2: 437; **phase 3: 540**; **phase 4: 137**; **phase 5: 519**; untagged: 181. The phase 3 items include the Band of Eternity ranks, phase 4 includes Jungle Stompers (a Zul'Aman-era item), phase 5 includes Sunwell items (item levels 154 to 159).

Two things follow, both still to be checked:

- wowsims numbers Hyjal and Black Temple as Phase 3, Zul'Aman as Phase 4 and Sunwell as Phase 5. That matches the owner's "Phase 4" and is a third naming source (a community tool, not Blizzard).
- Raising the ceiling would show these items without a new ingest. But the item stats come from one snapshot of an upstream repo whose date is not recorded here, and it may predate Anniversary-specific changes. Which items the snapshot tags as Phase 4 (Zul'Aman drops, badge gear, or both) is not yet checked. Nothing here says the data is wrong; it says it has not been compared with a current source.

### Proposed phase model (a proposal for the owner to accept or change, not a decision)

1. **One source of truth.** A single module exports the list of phases (id, label, ceiling, release date, display name) and the "current" phase. `phase.ts`, `defaultMaxPhase` and `RANKED_THROUGH_PHASE` all read it. This is a small refactor that is safe on its own because behaviour does not change while the value stays 2.
2. **Content is tagged, not copied.** Items already carry `phase`. Raids, boss loot, rankings and tier lists would carry a phase too, so Phase 2 content stays in the repo and is hidden or shown by the ceiling. This is what a switcher would use, and it also lets a single-phase release exist first.
3. **Rankings keyed by phase.** `bisRankings.json` would hold one block per phase instead of one file replaced. This is the part that doubles data if the owner wants the switcher (open question 1).
4. **Builds.** Because saved builds hold item ids and no phase today, they keep working. Whether to add a `phase` field (and bump `BUILD_FORMAT_VERSION`) is open question 9.
5. **Order of risk.** Steps 1 and 2 are refactors with no visible change. Raising the ceiling and shipping new data is the visible change.

---

## Raid data inventory: Mount Hyjal and Black Temple (Day 4)

**Reading limits today.** Every page fetch this run (Blizzard post 24291476, three Warcraft Tavern pages) failed with a "permission request not answered in time" error, because nobody was present to approve it. Web search returned page titles only. So **nothing below about the game itself is newly sourced**; the boss lists are from the original game (the sources already cited say 5 and 9 bosses) and the repo facts are read directly from files.

### What the repo already holds (read directly, 2026-11-06)

| Item | Finding |
| --- | --- |
| Catalogue phase 3 items | 540. Item levels: 246 at 146, 207 at 141, 27 at 151, then small groups. Quality: 534 Epic, 4 Rare, 2 Legendary. Item levels 141 and 146 fit Hyjal and Black Temple tiers in the original game (our recollection, not sourced for this version). |
| Catalogue phase 4 items | 137, all Epic, mostly item level 128 (85), plus 133, 132, 141. Consistent with Badge gear and Zul'Aman, not yet compared with a source. |
| Named items found | Warglaive of Azzinoth (ids 32837, 32838, phase 3, item level 156); Band of Eternity (29294 to 29296, phase 3, levels 128, 136, 144); Ashtongue Talisman variants (phase 3, level 141); Jungle Stompers (33191, phase 4, level 128). |
| Tier sets | The catalogue has 222 sets and carries items with a `setId` (1,158 items). Set names such as Absolution Regalia, Onslaught Armor, Skyshatter, Thunderheart are present, so Tier 6 items look catalogued. Which set pieces are phase 3 was not checked. |
| **What the catalogue lacks** | Item records have **no source field** (no boss, raid or vendor). Keys are id, wowItemId, name, slot, quality, itemLevel, phase, stats, plus armour, class, socket, set and weapon fields. Nothing in the catalogue says which boss drops an item. |
| Raid classes in code | No Hyjal or Black Temple boss files exist. The only mention of Hyjal in `src/domain/raids` is a quest-item note in `serpentshrineCavernBosses.ts` (Vashj's Vial Remnant, id 29906). `RaidTier` has no T6. |

### What `ingest-raid-loot.mjs` can reuse

- The script is data-driven: a `RAIDS` map of boss id to Wowhead `npc=` or `object=` ids, and a `RAID_ZONES` map that rejects an NPC standing in the wrong zone. Adding Hyjal and Black Temple means adding two map entries and zone ids, plus finding the right NPC ids. It writes `tools/ingest/data/raid-loot.<raid>.json`, then `link-raid-loot.mjs` joins by exact item name and `apply-raid-loot.mts` writes the typed boss files.
- **It fetches Wowhead with plain `fetch`, which Wowhead has been refusing since 2026-10-13.** So the pipeline works in design and cannot run today. Loot-to-boss data would have to come from another source (owner-run from a browser, a saved page, or a different site) before any raid file can be built.
- The script filters out quality below Rare, common drops and Badge of Justice rows. That Badge filter was right in Phase 2 and needs a decision now: badges now drop everywhere and some Phase 4 gear is bought with them (open question 11).
- Trap noted in the script itself: names such as Kael'thas have two NPC entries, one in Sunwell. Archimonde, Illidan and others may have similar duplicates (timewalking versions exist on Wowhead). The zone check must be set with real Hyjal and Black Temple zone ids, which are **not yet known**.

### Boss counts to plan around

| Raid | Bosses | Source |
| --- | --- | --- |
| Mount Hyjal | 5 (Rage Winterchill, Anetheron, Kaz'rogal, Azgalor, Archimonde) | Count of 5 from earlier days' sources; names from the original game |
| Black Temple | 9 (Naj'entus, Supremus, Shade of Akama, Teron Gorefiend, Gurtogg Bloodboil, Reliquary of Souls, Mother Shahraz, Illidari Council, Illidan) | Count of 9 from earlier days' sources; names from the original game |

Existing raid files run from 2 bosses (Gruul) to about 11 (Karazhan); Black Temple's Illidari Council is four NPCs in one encounter, like the Opera event, so it needs a multi-NPC entry.

### Search leads for the loot and token mapping (found, not read)

Wowhead's Black Temple overview, Warcraft Tavern's extra-tier-token post, and several boosting and guide sites (timesaver.gg loot priority, kingboost Hyjal and Black Temple guides, wowclassic.com.ua Phase 3 guide, mythic-store Tier 6 token sources). Boosting and store sites are low-trust and must not be the final source.

---

## Tier 6, tokens and gems (Day 5)

**Reading limits today.** Blizzard's Phase 3 post (24291476) was refused again (the fetch helper reported the permission request went unanswered). Warcraft Tavern's extra-token article was read only through a summarizer. Two pages were read fully enough to use: warcraft.wiki.gg "Tier 6 armor tokens" (a 2019 page about the **original** game) and Icy Veins' Phase 3 overview (a **2022** page about the original Phase 3). Neither describes this Anniversary version, so everything below is "original game, to be confirmed for the Anniversary".

### Tier 6 token sources (original game, wiki, summarized)

| Slot token | Boss | Raid |
| --- | --- | --- |
| Helm | Archimonde | Mount Hyjal |
| Gloves | Azgalor | Mount Hyjal |
| Shoulders | Mother Shahraz | Black Temple |
| Legs | Illidari Council | Black Temple |
| Chest | Illidan Stormrage | Black Temple |
| Bracers, Belt, Boots | Sunwell Plateau bosses (Kalecgos, Brutallus, Felmyst and the Eredar Twins) | Phase 5 |

- Token names are the "Forgotten" tokens, grouped by class: **Conqueror** (Paladin, Priest, Warlock), **Protector** (Warrior, Hunter, Shaman), **Vanquisher** (Rogue, Mage, Druid).
- The wiki says all of Tier 6 comes from Hyjal, Black Temple and Sunwell. The three non-token slots (bracers, belt, boots) are Sunwell-only, so **in Phase 3 and 4 Tier 6 is a five-piece set at most**. This matters for set-bonus logic: the 2-piece and 4-piece bonuses are reachable, the 5th slot items (bracers, belt, boots) are not. Not yet checked against Anniversary.
- Warcraft Tavern (2026-08-24, summary-based) says extra tier tokens drop from the bosses of **both Phase 3 raids** "making it easier for players to get their Tier 6 sets", added at launch, not on the PTR. It names no bosses, rates or earlier raids. **Correction to the Day 2 and Day 4 wording:** earlier text said "extra tokens in earlier raids". The only reading we have says Hyjal and Black Temple. Nothing read says Karazhan, Gruul, Magtheridon, SSC or Tempest Keep get extra tokens. Treat "earlier raids" as unsupported.
- The app impact is small: tokens are not gear, so the planner needs to know **which boss gives the item that the token turns into**, not the token drop rate. Extra token drops change farming speed, which the app does not model.

### Epic gems and Jewelcrafting

- Icy Veins (2022 page, verbatim) names only one epic gem example, "Delicate Crimson Spinel". No full list.
- Same page (summarized): the Scale of the Sands and Ashtongue Deathsworn reputations give access to Jewelcrafting designs and class trinkets; Netherwing dailies lead to mounts, not gear.
- Blizzard's Zul'Aman post (Day 2) says epic gems also come from Magtheridon's Black Sack of Gems and Jewelcrafter's Brilliant Glass, not retroactive.
- Day 3 sources: epic gems are mined in Hyjal and drop in Black Temple.
- **Not found:** the list of epic gems and which designs come from which rep rank. Search leads only (not read): timesaver.gg and expcarry.com epic gem guides (low-trust), Wowhead and Warcraft Tavern's Phase 3 overview (not read).
- Repo side not yet audited: how `sampleGems`/gem data represent cut gems and whether an "epic" quality tier or a design-source field exists. That is the first thing for Day 6 or Day 9 to check.

### Scope estimate for items and gems (provisional)

- Tier 6 pieces are already in the catalogue by set name (Day 4). Work is to confirm each piece's phase tag and add **source = boss** links via the loot pipeline.
- Epic gems: likely a small list (around a dozen cuts in the original game, our recollection, unsourced). Needs a source before sizing is firm.

---

## Zul'Aman and badge gear (Day 6)

**Reading limits today.** Both Blizzard pages (the Zul'Aman post 24310652 and its mirror, plus the Phase 3 post 24291476) and Warcraft Tavern's Phase 4 guide were refused again with the same "permission request not answered in time" error. Warcraft Tavern's Zul'Aman news article returned only a model-made summary, not page text. Web search returned titles only. So **no Zul'Aman item list and no G'eras item list was read today.** What follows is what is confirmed from earlier reads plus new search leads.

### What is confirmed (Blizzard post read on Day 2, Tavern summary agrees)

| Item | Finding |
| --- | --- |
| Raid | Zul'Aman, Ghostlands, 10 players (level 70), no attunement, 3-day lockout, six bosses: Nalorakk, Akil'zon, Jan'alai, Halazzi, Hex Lord Malacrass, Zul'jin. |
| Timed run | The timer starts when the raid breaches the gates. Defeating one of Zul'jin's lieutenants and rescuing a hostage gives extra loot and extends the timer (Tavern summary). Timer length, which bosses give the extra chests, and the chest contents are **not stated** in anything read. |
| Mount | Amani War Bear, rare battle mount, for rescuing all hostages in time (Tavern summary). No drop details. |
| Badges of Justice | Drop from all bosses in Karazhan, Gruul, Magtheridon, SSC, Tempest Keep and Zul'Aman, plus Doom Lord Kazzak and Doomwalker. No per-boss amounts read. |
| G'eras (Shattrath) | Sells "more powerful wares" for badges, including Nether Vortex. No item names, slots or costs read. |

### New leads (search titles only, not read)

- Wowhead news "Upcoming Changes in Burning Crusade Classic Phase 4: New Badge Gear" (id 326391) and Wowhead's Zul'Aman raid overview and loot tool. **Caution:** the Wowhead posts titled "Patch Notes Version 2.5.4: The Gods of Zul'Aman" and the Blizzard post "Zul'Aman is Now Open" (23783585) are from the **original 2022 TBC Classic** Phase 4. The Anniversary update reuses that content, so these are useful for item lists but must be checked for Anniversary differences.
- Warcraft Tavern "Badge of Justice Guide: Farming, Vendors, Rewards" and Icy Veins "Zul'Aman Raid Guides". Low-trust: timesaver.gg ZA loot and badge-gear rankings, accountshark.net, kami-labs.fr, bittsguides.com.
- Naming note: in the original game this content was TBC Classic **Phase 4** (patch 2.5.4). That is a fourth source for "Phase 4" and fits the wowsims tag (137 catalogue items tagged phase 4). It does not prove the Anniversary content matches item for item.

### Repo-side reading for the app (from Day 3 and Day 4 facts, nothing new read today)

- Phase 4 items in the catalogue are 137, nearly all item level 128. That is a plausible size for Zul'Aman drops plus badge vendor gear, but the catalogue has no source field, so it cannot be split into "ZA boss" and "G'eras" without a source.
- Zul'Aman is a 10-player raid with six bosses, close in shape to Gruul's Lair (2 bosses) and Karazhan (about 11). `RaidTier` has no value for it.
- Badge vendor gear is a different kind of source (a vendor with a currency cost), so `acquisitionCosts.json` needs a Badge of Justice currency and a vendor source type. That is gap row 7.
- Timed-run loot is a rules question the app has no model for: the app would list the loot tables, and could note that some drops need the timer. Decision for the owner (open question 12).

## BiS sources for Phase 3 and Phase 4 (Day 7)

**Reading limits today.** Fetches worked for Icy Veins and Warcraft Tavern (through a fetch helper) and Method. Wowhead's page was refused again (permission request unanswered). Web search returned titles only. Wowhead lists below are therefore known from URLs and titles, not content.

### Which lists exist (from search titles and URLs)

| Site | Phase 3 | Phase 4 (Zul'Aman and badge gear) | Notes |
| --- | --- | --- | --- |
| Wowhead | Flat slugs such as `.../tbc/guide/shaman-healer-bt-hyjal-phase-3-best-in-slot-gear-burning-crusade` ("BT / Hyjal") | Slugs such as `.../tbc/guide/arcane-mage-dps-za-phase-4-best-in-slot-gear-burning-crusade` ("ZA") | Seen for several specs only; a full 27-spec check was not done. Content not read. Slugs say "burning-crusade", not "anniversary", so they may be the original 2022 guides. |
| Icy Veins | One combined page per spec, slug `...-phase-3-4-gear-best-in-slot` | Same page | Fury Warrior page read in full: title "Phase 3 / 4", **last updated 02 May 2022**, single table per slot covering Phase 3 and 4 in prose, includes Tier 6 helm and chest, Zul'Aman timed-chest items and G'eras items with badge costs (e.g. 60 badges). The word "Phase 5" is absent. |
| Warcraft Tavern | Pages titled "... Best in Slot (BiS) Gear" (undated) | "Shadow Priest PvE Phase 4 Best in Slot (BiS)" and similar for Ret Paladin, BM Hunter, Assassination Rogue | Shadow Priest page covers Black Temple, Hyjal and Zul'Aman, includes badge gear and Tier 6 Absolution; no date on page; read partly verbatim (first ~40k of 116k characters), rest summarised. Has "Previous Guide" and "Next Guide" links, so Phase 3, 4 and 5 are separate pages. |
| Method | Not applicable | Not applicable | Its "Phase 4" pages are for vanilla WoW Classic Anniversary (Zul'Gurub). Ignore for TBC. |

### What this means for the app

- **The Wowhead ingest cannot be reused by changing a number.** `tools/ingest/bis-guides.mjs` builds paths like `mage/arcane/dps-bis-gear-pve-phase-2` under `.../tbc/guide/classes/`. Wowhead's Phase 3 and 4 guides use flat slugs with `bt-hyjal-phase-3` and `za-phase-4` in the name. The path table (25 guides) has to be rewritten per phase, and the spec-name sanity check in the ingest still helps. Also, Phase 3 and Phase 4 are **separate** Wowhead guides, so a "Phase 4" ranking needs both only if the owner wants Phase 3 and 4 shown separately (open question 14).
- **Icy Veins merges Phase 3 and 4** into one list per spec. That does not fit the app's one-ranking-per-phase shape without a choice.
- **Staleness risk.** The Icy Veins page is dated May 2022 and refers to the original Phase 4 patch. Whether the Anniversary version was reviewed is unknown. Icy Veins also reuses URL slugs: search results show pages with a `phase-3-4` slug titled "Phase 5 / Tier 6" (Protection Warrior, Demonology Warlock) and a `gear-best-in-slot` slug titled "Phase 5 / Tier 6". Page titles change under the same URL, so the ingest must check the title, not the slug (as it already does for Wowhead).
- **Tavern is the only site with clearly separate, Anniversary-era Phase 4 pages**, but its content is undated and the page read was partly summarised.
- Specs counted in search results so far: Wowhead and Icy Veins have pages for Warrior (Arms, Fury, Prot), Hunter (BM, MM, SV), Mage, Priest, Paladin, Shaman, Warlock, Rogue, Druid. Coverage of all 27 specs is not confirmed on any site.

### Differences already visible between the sources (one spec each)

- Fury Warrior (Icy Veins, 2022): Warglaive of Azzinoth in both hands, Onslaught set, Ancient Amani Longbow (Zul'Aman), G'eras items such as Dory's Embrace (cloak) and Chain of Unleashed Rage.
- Shadow Priest (Tavern): Absolution set, Zhar'doom, Icon of the Silver Crescent (badge) and Hex Shrunken Head (Zul'Aman).
- No cross-site comparison for the same spec was possible today; that needs Wowhead content.

### Fit with `ingest-bis.mjs`

- It writes `phase: 2` in entries and `$schema: 'wowhead tbc phase 2 bis rankings'`. It stores 1,427 entries from 24 guides. For a new phase it needs the phase as a parameter, a new path table and a check of the page layout (Wowhead may have changed). It also hits Wowhead with plain `fetch`, which is blocked, so rankings would have to come from pages the owner saves or from another source (open question 10 covers loot; the same question applies to rankings).
- A second-source parser (Tavern or Icy Veins) would be new code. Their tables name item and source but item ids are not known without matching by name against the catalogue (the same join the loot pipeline already does).

## Where the game is (research)

### Phase timeline

| Phase | Name | Content | Anniversary date | Source status |
| --- | --- | --- | --- | --- |
| 1 | The Burning Crusade | Karazhan, Gruul's Lair, Magtheridon's Lair, Arena Season 1 | 2026-02-05 | In the app |
| 2 | Overlords of Outland | Serpentshrine Cavern, Tempest Keep: The Eye, Arena Season 2 | 2026-05-14 | **In the app** |
| 3 | Black Temple (patch number unknown) | Battle for Mount Hyjal (5 bosses), Black Temple (9 bosses). Arena Season 3 began Sept 1 | 2026-08-27, 3:00 PM Pacific (Blizzard Watch, MMOs.com, Warcraft Tavern agree) | **Not in the app** |
| 3.5 / 4 | The Gods of Zul'Aman | Zul'Aman, Badges of Justice, attunement removal, dungeon changes | 2026-10-22, 3:00 PM Pacific | **Not in the app** |
| 5 | Fury of the Sunwell | Sunwell Plateau, Magisters' Terrace, Isle of Quel'Danas, Arena Season 4 | "Autumn 2026", unconfirmed | Watch only |

### What Phase 3 adds (affects the app)

- **Two 25-player raids:** Mount Hyjal and Black Temple, dropping **Tier 6** gear.
- **Epic gems** from Jewelcrafting designs learned in the Caverns of Time, and as drops from the Tier 6 raids.
- **Reputations and dailies:** Scale of the Sands, Ashtongue Deathsworn, Netherwing dailies. Items such as Band of Eternity need
  Scale of the Sands. The Phase 2 roadmap noted these as unreachable.
- **Extra tier tokens** drop from earlier raids in Phase 3 (Warcraft Tavern headline, details not yet read).
- **Arena Season 3**, which begins **September 1**, not on 08-27 (Day 3 correction; Season 2 ended Aug 18, Arena points convert to Honor at 1 to 10). Season 2 gear is discounted at Area 52 and Season 1 gear moves to Honor vendors (three fan-site reads agree).
- Day 3: Black Temple was still attuned at launch ("The Tablets of Baa'ri") and Hyjal opened through "The Vials of Eternity"; this fits the 10-22 removal for both. Epic gems are mined in Hyjal and drop in Black Temple. Tier 6 gear is **not** mentioned by the three articles read; it is known from the original game, not yet sourced for this version.
- Day 3: Blizzard's own Phase 3 post probably is https://news.blizzard.com/en-us/article/24291476/bcc-anniversary-edition-black-temple-arrives-august-27 (linked by Blizzard Watch; not read).
- Legendary: Warglaives of Azzinoth (Black Temple).

### What the 2026-10-22 update adds (affects the app)

- **Zul'Aman:** 10-player, Ghostlands, six bosses (Nalorakk, Akil'zon, Jan'alai, Halazzi, Hex Lord Malacrass, Zul'jin), no
  attunement, 3-day lockout, a timed hostage mechanic for extra loot and the Amani War Bear.
- **Badges of Justice** drop from all Karazhan, Gruul, Magtheridon, SSC, Tempest Keep and Zul'Aman bosses, plus Doom Lord Kazzak
  and Doomwalker. **G'eras in Shattrath sells new, stronger gear** for badges. This probably changes many specs' BiS lists.
- **Attunements:** Blizzard's post (read directly, Day 2) says Mount Hyjal and Black Temple no longer need attunement. Warcraft Tavern's
  Aug 24 and Aug 27 posts say attunements for Serpentshrine Cavern and Tempest Keep were removed at the **start of Phase 3**, with skips to
  Lady Vashj and Kael'thas (summary-based, see Unverified). Whether Karazhan, Gruul and Magtheridon ever needed one in this version, and
  what happens to the Hand of A'dal title, is not yet sourced. Correction: Day 1 said "every TBC raid" on 10-22; that was too broad.
- **Heroic dungeons are nerfed** to the original 2.4.3 state, and Heroic keys need Honored instead of Revered.
- **Epic gems** can now come from Magtheridon's Black Sack of Gems and Jewelcrafter's Brilliant Glass.
- **Primal Nether and Nether Vortex** are no longer soulbound. The two Outland world bosses drop Bind on Equip loot.
- Outland faction vendors sell Leatherworking recipes for **Greater Drums, Knothide Quiver and Knothide Ammo Pouch** (Blizzard post).
  Correction: Day 1 said "upgraded rare drum recipes"; Blizzard only lists the recipes and says nothing about changed drum effects.
- Doomlord Kazzak and Doomwalker loot is now Bind on Equip (Blizzard post).
- "Hunter pet buffs apply to all pets at once" is **not** in Blizzard's post. Moved to Unverified.
- Zul'Aman is a 10-player raid ("nine of your staunchest allies"), 3-day lockout, six bosses (confirmed by Blizzard's post).

### Unverified (do not build on these yet)

- **Day 2:** hunter pet buffs applying to all pets: not in Blizzard's Zul'Aman post. Single fan source only.
- **Day 2:** Phase 3 = patch 2.5.6 comes from Warcraft Tavern's table only. warcraft.wiki.gg says 2.5.6 released 2026-07-07 as a
  "routine update" with only service-system changes and no gameplay impact, so it probably is not the Black Temple patch. The patch
  number of the Phase 3 and Zul'Aman content is unknown. The app does not need it unless the owner wants patch labels.
- **Day 2:** the Warcraft Tavern phase and Phase 5 pages were read through a summarizer after the first ~39k characters, so their table
  is summary-based. Their table spells the raid "Zul'Amon" (typo) and lists the Oct 22 date under Phase 4 while the intro says "Phase 3.5".
- **Day 2:** tier-token sources: no readable page names which earlier raids drop which extra tier tokens. Still open.
- **Day 3:** wowsims-tagged phases in the catalogue (3, 4, 5) are not checked against a current Anniversary source. Which items the snapshot calls Phase 4 is unknown.
- **Day 3:** whether saved builds hold a phase: grep found none in `buildSerialization.ts`; a full read of that file is still to do on Day 11.
- **Day 3:** Phase 3 patch number still unknown. Three articles checked, none gives one.
- **Day 4:** all fetches blocked (permission prompt unanswered in an unattended run): Blizzard post 24291476 and three Warcraft Tavern pages are still unread. Boss names for Hyjal and Black Temple are from the original game, not from a source for this version.
- **Day 4:** Tier 6 sets look present in the catalogue by set name, but which pieces are phase 3 and which tokens drop from which boss is unsourced.
- **Day 4:** the item level reading (141 as Hyjal, 146 as Black Temple) is our recollection of the original game, not a source.
- **Day 5:** the token-to-boss table (Archimonde helm, Azgalor gloves, Shahraz shoulders, Council legs, Illidan chest) is from a 2019 wiki page about the original game. Not checked against this version.
- **Day 5:** whether extra tokens also drop in earlier raids: no source says so; only Hyjal and Black Temple are named, and that from a summary.
- **Day 5:** the epic gem list, Jewelcrafting design sources and rep ranks are not sourced for this version.
- **Day 5:** the claim that Tier 6 is a 5-piece set before Sunwell comes from the same old wiki page.
- **Day 6:** no Zul'Aman loot table, no G'eras item list or badge costs, no timer length, no extra-chest bosses: none read. Every Blizzard page and the Tavern Phase 4 guide were refused again.
- **Day 6:** the Tavern Zul'Aman article was a summary, not page text. The timed-hostage rules above are summary-based.
- **Day 6:** that the Anniversary Zul'Aman and badge gear match the original 2022 Phase 4 is an assumption, not checked.
- **Day 7:** Wowhead's Phase 3 and 4 BiS guides exist only as URLs and titles seen in search; content, dates and whether they were updated for the Anniversary are unread.
- **Day 7:** Icy Veins' Fury Warrior page is dated 2022; nothing says whether Anniversary reviewed it. One spec read only.
- **Day 7:** Warcraft Tavern's Shadow Priest Phase 4 page is undated and was partly summarised. One spec read only.
- **Day 7:** that all 27 specs have Phase 3/4 lists on any site is not checked.
- **Day 2:** unreachable: Icy Veins Zul'Aman news post and the Massively OP article (client errors). Blizzard's main Phase 3 post was not found.

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
| 1 | **Phase model** | Replace the three separate Phase 2 constants (label, catalogue ceiling, addon-import ceiling) with one phase module and decide how saved builds record a phase. Day 3 proposal above. Refactor part: S. | S for the one-source refactor, M with a switcher |
| 2 | **Raids** | Add Mount Hyjal (5 bosses), Black Temple (9), Zul'Aman (6): bosses, loot, art. Widen `RaidTier` for T6. Remove or retire attunement content. Update the "five raids" assumptions and tests. Day 4: the pipeline exists but cannot fetch while Wowhead blocks scripts, and the catalogue has no drop-source field, so loot linking needs a new data source. | L (the data source is the risk) |
| 3 | **Item catalogue** | Day 3: 540 phase-3 and 137 phase-4 items are already present from the wowsims snapshot, so the work shifts from "add" to "verify, and fill gaps" (loot-table links, vendor sources, Season 3 gear). Re-pinning the snapshot is a separate choice. | M to L |
| 4 | **BiS rankings** | Re-ingest 27 specs for the new phase. Day 7: Wowhead has separate Phase 3 and Phase 4 guides on a different URL scheme (so the path table is rewritten); Icy Veins has one merged Phase 3/4 page per spec (2022 date); Warcraft Tavern has Phase 4 pages. Decide on one rankings source per phase, and how to get the pages while scripts are blocked. | L (data access is the risk) |
| 5 | **Gems and enchants** | Epic gems and any new enchants. Update per-spec gem recommendations. Day 5: gem list and design sources still unsourced; repo gem representation not yet audited. | M |
| 6 | **Tier lists** | Re-ingest Wowhead's tier lists and the logs-based view for the new phase. | S to M |
| 7 | **Acquisition and costs** | Badges of Justice, G'eras vendor, Nether Vortex as currency. `acquisitionCosts.json` needs new currencies. Day 6: the G'eras item list and costs are still unread, so this size is a guess; it also needs a vendor source type, since the catalogue has no source field. | M (could rise to L) |
| 8 | **Reputations, professions, consumables** | Scale of the Sands, Ashtongue, Netherwing; new Jewelcrafting designs; drums; any new consumables or buffs. | M |
| 9 | **Simulation** | Only if balance or class changes exist. `dpsReference.ts` and the rotation work depend on the answer to the unverified items above. | unknown |
| 10 | **UI and copy** | Phase chip, provenance lines, phase switcher, README and docs text that says "Phase 2". | S to M |
| 11 | **Tests** | The 340-test suite is full of Phase 2 numbers. Day 3: phase wording is in 9 spec files, mostly `planner.spec.ts` (138 lines). Day 11 sorts text-only from number changes. | M to L |
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
   Wowhead's phase guides lag? (Day 7: Wowhead has Phase 3 and 4 guides but is the source we cannot fetch; see 14 and 15.)
6. **Naming.** (Added Day 2) Blizzard calls the October update "The Gods of Zul'Aman" with no phase number. In the app, label it
   "Phase 4", "Phase 3.5" or "Zul'Aman update"? This affects the phase data model and the phase chip text.
7. **Deploy rule.** Today the plan commits with `[skip ci]`. Implementation pushes redeploy the live site. Confirm you still want
   to approve each implementation push.
8. **Item source.** (Added Day 3) The catalogue comes from a pinned snapshot of wowsims/tbc. Keep that source and re-pin it to a newer commit for Phase 3 and 4, or accept Wowhead as a second source for fixes? A re-pin changes stats for items already in the app.
10. **Loot data source.** (Added Day 4) Wowhead blocks scripts, and the catalogue holds no drop source. For boss loot tables, would you rather (a) save Wowhead pages by hand from your browser for the ingest to read, (b) accept another site's tables for those raids, or (c) wait and see whether Wowhead's block lifts?
11. **Badges.** (Added Day 4) The loot ingest currently hides Badge of Justice rows. Keep hiding them, or show badges as a currency on boss cards now that they drop from most raid bosses?
12. **Timed Zul'Aman loot.** (Added Day 6) Some Zul'Aman loot and the Amani War Bear depend on a timer. Show all loot with a note, or only the loot that needs no timer?
13. **Fetch access.** (Added Day 6) Four daily runs have had Blizzard and Tavern pages refused because nobody can approve the fetch permission. Can fetch access be pre-approved for the scheduled run (Blizzard, Wowhead news, Warcraft Tavern, Icy Veins)? Without it the plan stays stuck on the same unread pages.
14. **Phase 3 vs Phase 4 rankings.** (Added Day 7) Wowhead publishes separate Phase 3 (Black Temple / Hyjal) and Phase 4 (Zul'Aman) guides; Icy Veins merges them. Should the app show one ranking for "current" (the Phase 4 list), or keep Phase 3 and Phase 4 as two switchable lists?
15. **Rankings from a 2022 page.** (Added Day 7) Icy Veins' Phase 3/4 pages are dated 2022 and written for the original game. Is a rankings source acceptable if it predates the Anniversary re-release, or should the app wait for a source dated after 2026-10-22?
9. **Builds and phases.** (Added Day 3) Add a phase field to saved builds (and bump the build format version), or keep builds phase-free as they are now?

---

## The daily schedule

Each day has one topic. Finish the topic, log it, and move to the next row on the following morning. Rows can be re-opened if a
later day finds a mistake. After Day 14, keep the daily run going: re-verify, track Phase 5 news and reduce "Unverified" items.

| Day | Date | Topic | Output into this file |
| --- | --- | --- | --- |
| 1 | Nov 3 | Baseline: where the app is, where the game is, first gap table | Done. See Daily log. |
| 2 | Nov 4 | Settle the timeline and naming from Blizzard primary sources: patch notes and news posts for Phase 3 and the Oct 22 update; confirm Phase 5 status | Done in part. See Daily log. Phase 3 Blizzard post still to find (Day 3 or 8). |
| 3 | Nov 5 | Code audit: every Phase 2 coupling in `src/`, `tests/`, `tools/`, docs; how `phase` flows through data, types, share links and saved builds | Done. See "Coupling inventory". |
| 4 | Nov 6 | Mount Hyjal and Black Temple: bosses, loot tables, trash drops, tokens. Check what the `ingest-raid-loot` pipeline can reuse | Done in part (pipeline and catalogue audit done; game sources blocked). See "Raid data inventory (Day 4)"; re-read sources on Day 5. |
| 5 | Nov 7 | Tier 6 sets and tokens, epic gems, Jewelcrafting designs, extra tier tokens in earlier raids | Done in part (token map from old sources; gem list not found). See "Tier 6, tokens and gems (Day 5)". Re-open on Day 9. |
| 6 | Nov 8 | Zul'Aman: bosses, loot, timed-hostage loot, mount. Badges of Justice and G'eras vendor inventory | Done in part (bosses, rules, sources confirmed; no item lists read, fetches refused). See "Zul'Aman and badge gear (Day 6)". Re-open on Day 9 or 12. |
| 7 | Nov 9 | BiS: which published lists exist for Phase 3 and Phase 4 per spec (Wowhead, Icy Veins, Warcraft Tavern); how they differ; fit with `ingest-bis.mjs` | Done in part (list landscape and ingest fit; Wowhead content unread, one spec read on two sites). See "BiS sources (Day 7)". Re-open on Day 10 or 12. |
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

- [~] The phase timeline and the name of the October update confirmed from Blizzard's own posts (Day 2: October update name and contents confirmed from Blizzard; Day 3: Phase 3 date and launch contents now agree across Blizzard Watch, MMOs.com and Warcraft Tavern, Blizzard's own post not read; Phase 5 date unconfirmed)
- [ ] Every Phase 3 and October-update change that touches stats, items, raids or rules is listed with a source (Day 5: Tier 6 token map only from an original-game wiki; epic gem list missing)
- [ ] Anniversary-specific mechanics (balance, buffs, talents) confirmed or ruled out from a primary source
- [ ] A phase data model chosen, with the owner's answers to open questions 1 to 3
- [ ] Item and raid counts for each new raid, with a way to get the data that works while Wowhead blocks scripts (Day 6: Zul'Aman has 6 bosses confirmed, no loot read; Day 4: pipeline reuse understood, no working data source yet; see open question 10)
- [ ] A rankings source chosen for each of the 27 specs (Day 7: three candidate sites, none fully read; see open questions 14 and 15)
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

### Day 2: 2026-11-04

**Done**
- Read Blizzard's own Zul'Aman post (worldofwarcraft.blizzard.com/news/24310652) through a fetch helper. Read Warcraft Tavern's phases
  table, Phase 5 page, Aug 24 and Aug 27 posts, and warcraft.wiki.gg Patch 2.5.6. Searched for Sunwell news.

**Learned**
- Blizzard's title is "BCCA: The Gods of Zul'Aman Now Live". No phase number appears. Fan sites made up 3.5 and 4.
- Blizzard confirms: Zul'Aman details, Badges of Justice sources, G'eras wares including Nether Vortex, Hyjal and Black Temple
  attunement removal, Heroic key rep lowered to Honored, Heroic dungeons at "final, reduced difficulty", epic gems in Black Sack and
  Brilliant Glass (not retroactive), Kazzak and Doomwalker loot BoE, Primal Nether and Nether Vortex unsoulbound, three LW recipes.
- Blizzard's post lists no class, balance, buff-limit, dual spec, Heroism or pet-buff changes.
- SSC and TK attunements went away at Phase 3 start (Tavern, summary-based). Extra T6 tokens drop in Hyjal and Black Temple.
- Patch 2.5.6 was a July service patch, so "Phase 3 = 2.5.6" is doubtful.
- Phase 5 has no date beyond "Autumn 2026". Sunwell: 25-player, 8 bosses, no attunement, Magisters' Terrace, Quel'Danas, Arena Season 4.

**Corrections to Day 1**
- "Attunements removed for every TBC raid on 10-22" narrowed (see body). Drum wording fixed. Pet buffs moved to Unverified.

**Still unsure**
- Blizzard's Phase 3 post and patch notes; tier-token sources; class/balance changes; the exact patch number; Phase 5 date. Two helper
  fetches (Icy Veins, Massively OP) failed.

**Next (Day 3)**
- Code audit of Phase 2 coupling in the repo and a proposed phase data model. Also try again for the Blizzard Phase 3 post.

### Day 3: 2026-11-05

**Done**
- Audited the repo (read-only) for Phase 2 hard-coding: constants, catalogue, build code, ingest tools, tests, docs. Wrote the coupling inventory and a proposed phase model near the top.
- Read three articles on the Phase 3 launch (via a fetch helper) to firm up the date and contents.

**Learned**
- Phase 2 is hard-coded as three separate constants (`CURRENT_PHASE`, `defaultMaxPhase`, `RANKED_THROUGH_PHASE`), and the label constant is read by only two components.
- The catalogue already holds 540 phase-3, 137 phase-4 and 519 phase-5 items from a pinned wowsims snapshot. Rankings, raids, loot and tier lists are Phase 2 only.
- Saved builds appear to hold no phase (grep only).
- Phase 3 went live 2026-08-27 at 3:00 PM Pacific (three sources agree). Arena Season 3 began Sept 1.

**Corrections**
- Day 1/Phase 3 list implied Arena Season 3 started on 08-27; it started Sept 1. Phase 3 patch label "2.5.6" removed from the timeline table (already doubted on Day 2).

**Still unsure**
- Whether the wowsims snapshot is current for Anniversary; which items it calls Phase 4; Tier 6 sourcing for this version; Phase 3 patch number; Blizzard post 24291476 not read.

**Next (Day 4)**
- Mount Hyjal and Black Temple: bosses, loot, tokens, and what `ingest-raid-loot` can reuse. Read Blizzard post 24291476.

### Day 4: 2026-11-06

**Done**
- Tried to read Blizzard's Phase 3 post and Warcraft Tavern's Phase 3, Hyjal and Black Temple pages. All fetches failed (permission prompt unanswered in an unattended run), so they stay unread. Ran two web searches for loot and Tier 6 token sources and noted the leads.
- Read `ingest-raid-loot.mjs`, the five raid-loot data files' shape, `raidTypes.ts`, and profiled the item catalogue by phase, item level, sets and fields.
- Added "Raid data inventory (Day 4)", open questions 10 and 11, new Unverified items, and updated gap row 2.

**Learned**
- The catalogue holds no drop-source field, so boss loot cannot be derived from it. The loot ingest is the only route, and it depends on Wowhead.
- Phase 3 catalogue items cluster at item levels 141 and 146; phase 4 at 128. Tier 6 set names are in the catalogue.
- Adding a raid to the ingest is a small config change; finding NPC and zone ids and getting around the Wowhead block is the real work.
- The Badge of Justice filter in the ingest was a Phase 2 choice that no longer fits.

**Corrections**
- None to earlier days.

**Still unsure**
- Everything about Hyjal and Black Temple loot, token-to-boss mapping, trash drops and zone ids. Blizzard's Phase 3 post. Whether the catalogue's Tier 6 pieces are tagged phase 3.

**Next (Day 5)**
- Tier 6 sets and tokens, epic gems, Jewelcrafting designs, extra earlier-raid tokens. Retry the blocked pages first; if still blocked, work from search results and the repo and say so.

### Day 5: 2026-11-07

**Done**
- Searched for extra-token, Tier 6 token and epic gem sources. Read (through a fetch helper) Warcraft Tavern's extra-token article (summary-based), warcraft.wiki.gg Tier 6 armor tokens and Icy Veins' Phase 3 overview. Blizzard's Phase 3 post was refused again.
- Added "Tier 6, tokens and gems (Day 5)", new Unverified items, and updated the schedule, gap row 5 and the checklist.

**Learned**
- In the original game five Tier 6 slots drop in Hyjal and Black Temple (Archimonde, Azgalor, Shahraz, Illidari Council, Illidan) and the other three are Sunwell-only. Token groups are Conqueror, Protector and Vanquisher by class.
- The only reading of the "extra tokens" change names Hyjal and Black Temple, not earlier raids.
- No fetched page gives a usable epic gem list for this version.

**Corrections**
- Earlier wording that extra tokens drop "in earlier raids" is not supported by anything read; narrowed to Hyjal and Black Temple.

**Still unsure**
- Everything in "Tier 6, tokens and gems" for the Anniversary version; epic gems and designs; Blizzard's Phase 3 post; whether Phase 3 catalogue items include the Tier 6 pieces.

**Next (Day 6)**
- Zul'Aman: bosses, loot, timed-hostage loot, mount; Badges of Justice and G'eras vendor inventory. Retry Blizzard's posts first.

### Day 6: 2026-11-08

**Done**
- Tried again to read Blizzard's Zul'Aman post, its mirror, Blizzard's Phase 3 post and Warcraft Tavern's Phase 4 guide: all refused. The Tavern Zul'Aman article came back as a summary. Ran two searches for Zul'Aman loot and G'eras badge gear.
- Added "Zul'Aman and badge gear (Day 6)", open questions 12 and 13, Unverified items, and updated gap row 7, the schedule and the checklist.

**Learned**
- Zul'Aman basics and the timed-hostage rule are consistent across Blizzard (Day 2) and Tavern, but no timer length or chest detail is public in anything read.
- In the original game this content was TBC Classic Phase 4 (patch 2.5.4), which supports the "Phase 4" label. Several search hits are original 2022 pages.
- Wowhead has a "New Badge Gear" news post and a Zul'Aman loot tool, both worth reading when access allows.

**Corrections**
- None to earlier days.

**Still unsure**
- All Zul'Aman loot, the G'eras item list and costs, timer length, whether Anniversary matches the 2022 content.

**Next (Day 7)**
- BiS: which Phase 3 and Phase 4 lists exist per spec (Wowhead, Icy Veins, Warcraft Tavern), how they differ, fit with `ingest-bis.mjs`. Retry Blizzard posts and the Wowhead badge-gear news first.

### Day 7: 2026-11-09

**Done**
- Searched for Phase 3 and Phase 4 BiS guides on Wowhead, Icy Veins and Warcraft Tavern. Read Icy Veins' Fury Warrior Phase 3/4 page in full, Warcraft Tavern's Shadow Priest Phase 4 page (partly summarised) and Method's Mage Phase 4 page. Wowhead's Arcane Mage Phase 4 page was refused. Read `tools/ingest/bis-guides.mjs` and `ingest-bis.mjs` for fit.
- Added "BiS sources for Phase 3 and Phase 4 (Day 7)", open questions 14 and 15, Unverified items, and updated gap row 4, the schedule and the checklist.

**Learned**
- Wowhead's Phase 3 and 4 guides are separate and use flat slugs (`...-bt-hyjal-phase-3-...`, `...-za-phase-4-...`), unlike the nested `-pve-phase-2` paths the ingest uses. The path table must be rebuilt.
- Icy Veins merges Phase 3 and 4 and its Fury page is dated May 2022. Its slugs get reused for later-phase titles.
- Tavern has distinct Phase 4 pages with Zul'Aman and badge gear in them.
- Method's Phase 4 pages are vanilla Classic and not relevant.

**Corrections**
- None to earlier days. (Day 3's note that `ingest-bis` writes `phase: 2` is confirmed.)

**Still unsure**
- What Wowhead's lists say, whether any list was reviewed for the Anniversary, full 27-spec coverage, and how rankings would be fetched while Wowhead blocks scripts.

**Next (Day 8)**
- Anniversary-specific mechanics: balance, talents, buff limit, Heroism reset, dual spec, pet buffs. Find primary sources.

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

## Sources (Day 2)

- Blizzard, "BCCA: The Gods of Zul'Aman Now Live" (primary): https://worldofwarcraft.blizzard.com/news/24310652 (mirror https://news.blizzard.com/en-us/article/24310652/)
- Warcraft Tavern, Zul'Aman arrives October 22nd: https://www.warcrafttavern.com/tbc/news/zulaman-arrives-october-22nd-for-tbc-anniversary/
- Warcraft Tavern, Phase 3 is now live: https://www.warcrafttavern.com/tbc/news/phase-3-is-now-live-for-tbc-anniversary/
- Warcraft Tavern, extra tier tokens in Phase 3 raids: https://www.warcrafttavern.com/tbc/news/extra-tier-tokens-will-drop-in-phase-3-raids-for-tbc-anniversary/
- Warcraft Tavern, Phase 5 overview: https://www.warcrafttavern.com/tbc/guides/phase-5/
- Warcraft Wiki, Patch 2.5.6: https://warcraft.wiki.gg/wiki/Patch_2.5.6
- Unreachable on Day 2: Icy Veins Zul'Aman news post, Massively OP 2026-10-12 article.

## Sources (Day 3)

- Blizzard Watch, Phase 3 on August 27 (published July 23, updated Aug 27, 2026): https://blizzardwatch.com/2026/08/27/burning-crusade-classic-anniversary-realms-moves-phase-3-august-27/
- MMOs.com, Black Temple opens August 27: https://mmos.com/news/mmorpg-news/tbc-classic-phase-3-black-temple-august-2026
- Warcraft Tavern, Phase 3 launches August 27th (part read verbatim, rest summarised): https://www.warcrafttavern.com/tbc/news/phase-3-launches-august-27th-for-tbc-anniversary/
- Blizzard Phase 3 post, found not read: https://news.blizzard.com/en-us/article/24291476/bcc-anniversary-edition-black-temple-arrives-august-27
- Repo files read: `src/domain/gear/itemCatalogue.ts` and `.json`, `src/domain/builds/buildSerialization.ts`, `addonImport.ts`, `src/domain/bis/bisLists.ts`, `tools/ingest/*.mjs`

## Sources (Day 4)

- Blizzard Phase 3 post, still unread (fetch blocked): https://news.blizzard.com/en-us/article/24291476/bcc-anniversary-edition-black-temple-arrives-august-27
- Wowhead, Black Temple overview (search lead, not read): https://www.wowhead.com/tbc/tw/guide/black-temple-bt-raid-overview-burning-crusade-classic
- Warcraft Tavern, extra tier tokens (search lead, not read this run): https://www.warcrafttavern.com/tbc/news/extra-tier-tokens-will-drop-in-phase-3-raids-for-tbc-anniversary/
- Low-trust leads (boost and store sites): https://timesaver.gg/blog/tbc-anniversary-phase-3-loot-priority , https://kingboost.net/blogs/wow-classic-anniversary-edition/tbc-mount-hyjal-guide/ , https://kingboost.net/blogs/wow-classic-anniversary-edition/tbc-anniversary-complete-black-temple-guide/ , https://wowclassic.com.ua/en/tbc/phase-3/ , https://mythic-store.com/blog/tier-6-sets-in-tbc-classic-token-sources-set-bonuses-and-how-to-plan-your-pieces
- Repo files read: `tools/ingest/ingest-raid-loot.mjs`, `tools/ingest/data/raid-loot.*.json`, `src/domain/raids/raidTypes.ts`, `src/domain/gear/itemCatalogue.json`

## Sources (Day 5)

- Warcraft Wiki, Tier 6 armor tokens (2019 page, original game): https://warcraft.wiki.gg/wiki/Tier_6_armor_tokens
- Icy Veins, TBC Classic Phase 3 overview (2022 page, original game): https://icy-veins.com/tbc-classic/tbc-classic-phase-3
- Warcraft Tavern, extra tier tokens (summary-based read): https://www.warcrafttavern.com/tbc/news/extra-tier-tokens-will-drop-in-phase-3-raids-for-tbc-anniversary/
- Blizzard Phase 3 post, refused again: https://worldofwarcraft.blizzard.com/news/24291476
- Search leads, not read (low-trust): https://timesaver.gg/blog/tbc-anniversary-phase-3-epic-gems , https://expcarry.com/tbc-anniversary-epic-gems-sources-cuts-priorities , https://expcarry.com/tier-6-token-bosses-classes-set-pieces , https://www.tentonhammer.com/guides/tier-6-armor-set-information

## Sources (Day 6)

- Blizzard Zul'Aman post and mirror, refused again: https://worldofwarcraft.blizzard.com/news/24310652
- Warcraft Tavern, Zul'Aman arrives October 22nd (summary-based): https://www.warcrafttavern.com/tbc/news/zulaman-arrives-october-22nd-for-tbc-anniversary/
- Warcraft Tavern, Phase 4 guide, refused: https://www.warcrafttavern.com/tbc/guides/phase-4/
- Search leads, not read: https://www.wowhead.com/news/burning-crusade-classic-patch-notes-version-2-5-4-the-gods-of-zulaman-326438 (original 2022), https://es.tbc.wowhead.com/news/upcoming-changes-in-burning-crusade-classic-phase-4-new-badge-gear-326391 , https://www.wowhead.com/tbc/tw/guide/zulaman-za-raid-overview-burning-crusade-classic , https://warcrafttavern.com/tbc/guides/badge-of-justice-guide-farming-vendors-rewards , https://icy-veins.com/tbc-classic/zul-aman-raid-guides , https://worldofwarcraft.blizzard.com/news/23783585/ (original 2022)
- Low-trust leads: https://timesaver.gg/blog/tbc-anniversary-zulaman-loot-ranked , https://timesaver.gg/blog/tbc-anniversary-badge-of-justice-geras-new-items-ranked , https://accountshark.net/blog/tbc-anniversary-phase-3-5-zulaman-raid-guide-amani-war-bear-timer-badges-october-22

## Sources (Day 7)

- Icy Veins, Fury Warrior Phase 3 / 4 gear (read, dated 2022-05-02): https://www.icy-veins.com/tbc-classic/fury-warrior-dps-pve-phase-3-4-gear-best-in-slot
- Warcraft Tavern, Shadow Priest PvE Phase 4 BiS (partly summarised): https://www.warcrafttavern.com/tbc/guides/pve-shadow-priest-phase-4-bis/
- Method, Mage BiS Phase 4 (vanilla Classic Anniversary, not TBC): https://www.method.gg/wow-classic/mage-best-in-slot-wow-classic-anniversary
- Wowhead, Arcane Mage ZA Phase 4 BiS (refused, URL seen in search): https://www.wowhead.com/tbc/cn/guide/arcane-mage-dps-za-phase-4-best-in-slot-gear-burning-crusade
- Wowhead, Phase 3 BT / Hyjal BiS slugs (search titles only): https://www.wowhead.com/tbc/tw/guide/shaman-healer-bt-hyjal-phase-3-best-in-slot-gear-burning-crusade , https://www.wowhead.com/tbc/tw/guide/destruction-warlock-dps-bt-hyjal-phase-3-best-in-slot-gear-burning-crusade
- Warcraft Tavern, other Phase 4 BiS pages (search titles only): https://www.warcrafttavern.com/tbc/guides/pve-retribution-paladin-phase-4-bis/ , https://www.warcrafttavern.com/tbc/guides/pve-beast-mastery-hunter-phase-4-bis/ , https://www.warcrafttavern.com/tbc/guides/assassination-rogue-pve-phase-4-best-in-slot-bis/
- Repo files read: `tools/ingest/bis-guides.mjs`, `tools/ingest/ingest-bis.mjs`, `src/domain/bis/bisRankings.json` (header)
