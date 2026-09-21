# In-game import (Phase 6): scope and plan

**Written 2026-09-21, for the owner to walk through before anything is built.** The plan comes first.
The research it rests on follows in full, with every claim labelled by how it was checked.

## What the owner asked for

A **very basic** in-game addon, plus one export string that carries the whole character — gear, gems,
enchants, race and class, and talents — pasted into the site in one go. That is the way WoWSims'
exporter works.

## The plan, in five stages

0. **Fix the data the import will be compared against.** No game is needed for this.
   - Four enchants exist twice in the catalogue, and the BiS recommendations point at the duplicate each
     time. An imported character wearing exactly the recommended enchant would be told it is missing.
   - One field mixes two kinds of ID.
   - Fifteen enchants carry no ID the game's item links use.

   All of it is fixed through the ingest tools (research §B.3).
1. **A site-side converter and paste box that also accepts WoWSims exporter JSON.**
   - Anyone who already has that addon can use it on day one, before a line of Lua exists.
   - Every rule becomes a fixture test in the existing suite.
   - The WoWSims addon becomes an independent second implementation to check ours against (§C.5).
2. **The Project Defeat addon.**
   - One `.toc` and one `.lua` file of roughly 120 to 150 lines, with **no libraries**.
   - `/pdexport` shows the export string already selected, ready for Ctrl+C. Addons cannot write the
     clipboard.
   - The export is one line of plain JSON, about 1.2 KB. It carries **no name, realm or character
     GUID**; the WoWSims export carries all three.
3. **One in-game session by the owner.** A short list of `/dump` checks settles the few points nobody can
   confirm from outside the client (§C.5). The real export is then committed as a test fixture.
4. **Distribution.** GitHub Releases first. CurseForge and Wago need a licence the repo does not have yet,
   and a moderation pass.

## Decisions to make in the walkthrough

Grouped by when each has to be settled. The numbers are the research's Open questions.

| Before stage | Decisions |
|---|---|
| 1 | **Q1** order: WoWSims interop first, or the addon first? **Q4** spec inference: take the tree with the most points? What happens on a tie or zero points, or when the result is a healer or tank spec? **Q5** keep worn items that fail curated role tags, or drop them? **Q6** stop the off-hand refill for imports? **Q7** the Phase 3+ gate on imports. **Q8** the enchant clean-up in Stage 0. **Q9** professions: infer Enchanting from ring enchants? |
| 2 | **Q10** a slash command only, or a character-sheet button too, and the addon's public name. **Q11** a SavedVariables "upload a file" path, or copy and paste only. **Q12** talents as IDs plus position (robust) or IDs only (about 115 characters shorter). |
| 4 | **Q2** a licence for the site and the addon. **Q3** where to publish, and whether the addon lives in this repo or its own. |

## How this was checked

- **Research:** a background research agent read primary sources throughout, and labelled each claim
  *sourced*, *cross-checked* or *unverified*. The sources were:
  - Blizzard's shipped UI code for the live 2.5.6 client
  - the client's own database tables
  - WoWSims' addon and both of its web importers, pinned to exact commits
  - WeakAuras
  - Blizzard's add-on policy
- **Independent re-check:** the main session then re-checked the three claims the design leans on hardest.
  All three held:
  - the live client is **2.5.6.69795**, interface **20506**
  - the WoWSims exporter is **MIT**, "Copyright (c) 2022 General Wrex", and still declares **20505**, one
    patch behind
  - the global `GetTalentInfo` is a **deprecation fallback** on 2.5.6, gated by the
    `loadDeprecationFallbacks` setting, so the addon should call `C_SpecializationInfo.GetTalentInfo`
- **Still unverified** (listed at the end of the research, and mostly settled by Stage 3): whether the
  client's `talentID` is the same ID the repo uses (strongly indicated), the absolute EditBox length cap,
  and profession names on non-English clients.

## Worth knowing whether or not the import is built

- **The upstream moved.** The repo's catalogue is pinned to `wowsims/tbc`. Since 2026-07-24 that repo
  shows an "outdated" bar pointing to `wowsims/tbc-new`, the current TBC Anniversary sim. Fixes made
  there never reach this catalogue.
- **Two behaviours already misreport a pasted build**, not only an imported one:
  - `validateBuild` drops items that fail curated role or spec tags, even when they are real items the
    player could wear.
  - `normalizeGearForCharacter` refills an empty off hand whenever the main hand is not a two-hander.
- **The duplicate enchants in Stage 0 are a live bug today.** They affect any "missing versus BiS"
  comparison, not only imports.

---

# Research report

Status: COMPLETE (2026-09-21). Research only: nothing in the repo was modified while it was written.

Labels: **sourced** = read directly from code or an official doc; **cross-checked** = two independent
sources agree; **unverified** = could not fetch/confirm.

Pinned revisions read for this report:

| Source | Revision |
|---|---|
| wowsims/exporter (the WoWSims in-game addon) | `ad9e903e3997b99f66a2122a4a91b555d40c4ece` (tag v3.2.4, 2026-08-05) |
| wowsims/tbc (old TBC sim, the repo's ingest upstream) | `3301fca59306a747e521274c36e073e69acc7b77` (2026-08-06, HEAD) |
| wowsims/tbc-new (current TBC Anniversary sim, wowsims.com/tbc) | `a4768c9d7ed51f4e49b8e90425f68ab47bde0cbc` (2026-09-21, HEAD) |
| Gethe/wow-ui-source (mirror of Blizzard's shipped UI code) | branch `classic_anniversary` @ `1463c68627`, `version.txt` = `2.5.6.69795` |
| wago.tools DB2 exports | build `2.5.6.69795` (branch `wow_anniversary`) |

## 1. Summary

1. **Site first:** one paste box accepts a saved build, a Project Defeat addon string, *and* WoWSims exporter
   JSON; each converts to a `SavedBuild` and then runs through the existing `validateBuild`.
2. **Format:** one line of plain JSON (~1.2 KB for a full P2 raider), `format` + `formatVersion`, numeric ids
   only, **no name/realm/GUID** (WoWSims exports all three). No compression: LibDeflate is ~20× the addon.
3. **Addon:** a `.toc` (`## Interface: 20506`, live client 2.5.6; `## AllowLoadGameType: tbc`) + one
   ~120–150-line Lua file, no libraries; `/pdexport` shows the string pre-selected for Ctrl+C (the clipboard
   API is restricted). Use `C_SpecializationInfo.GetTalentInfo`; the global `GetTalentInfo` is now a
   deprecation fallback on 2.5.6.
4. **IDs line up:** items by `wowItemId`; enchants by SpellItemEnchantment id (= repo `effectId`) *plus slot*;
   gems by gem item id; talents by Talent.db2 id (579/579 repo talents match live 2.5.6 data).
5. **Fix before trusting imports:** 4 duplicate enchant slugs the BiS lists point at; supplement enchants with
   no SpellItemEnchantment id; role/spec tags that drop worn gear; the off-hand refill; spec inference.
6. **Distribute** via GitHub Releases first; CurseForge/Wago need a licence (the repo has none) + moderation.

## Repo baseline (what the site already has)

All **sourced** from the local checkout.

- `src/domain/builds/buildTypes.ts`: `BUILD_FORMAT_VERSION = 1`. `SavedBuild` = `{ version, savedAt, character,
  gear: Partial<Record<GearSlot, { itemId: string; gemIds: string[]; enchantId?: string }>>, activeBuffIds,
  activeConsumableIds, activeTargetDebuffIds, talentPoints?: Record<number, number>, target }`. Gear is stored
  as **catalogue slug ids** (`"dragonspine-trophy"`), not numeric WoW ids.
- `src/domain/builds/buildSerialization.ts`: `parseBuild(raw)` = `JSON.parse` + `validateBuild`. `validateBuild`
  **rejects** the whole build on wrong `version` or an illegal/missing character (faction/race/class/spec);
  otherwise **drops individual slots with an issue** for: unknown slot key, malformed entry, item not in
  catalogue, item not legal for class/spec (`isItemAllowedForCharacter`), item above Phase 2
  (`isWithinDefaultPhase`). Gem ids and enchant id are carried through on a type check only (string array /
  string) — **not validated against the gem/enchant catalogues or the item's sockets**. Professions are
  dropped-when-wrong, truncated to 2. `talentPoints` is accepted if it is an id→non-negative-number map.
- `src/domain/builds/shareLink.ts`: value is `<encoding>.<payload>`, `1` = deflate via `CompressionStream`,
  `0` = plain; base64url; `MAX_PAYLOAD_CHARS = 16_000`, `MAX_DECODED_BYTES = 256_000`; decode goes through the
  same `validateBuild`. Measured in-file: fullest build = 3,171 bytes JSON → 4,228 chars base64url → 1,424
  chars deflated.
- `src/features/builds/BuildPanel.tsx`: the Build panel already has a paste box → `parseBuild(draft)` →
  `onImport(result.build)` and shows `result.issues`. The addon import can reuse this surface.
- Items (`src/domain/gear/itemCatalogue.ts`, `itemCatalogue.json`): 4,505 items ingested from
  `wowsims/tbc@3301fca…/sim/core/items/all_items.go`, every one with a unique numeric `wowItemId`, plus 24
  Wowhead-supplement items and the unmatched curated entries. **`getItemByWowItemId(wowItemId)` already
  exists** (line ~271) — the numeric-id → slug lookup the importer needs.
- Enchants (`src/domain/enchants/*`): 79 ingested from `all_enchants.go`, each with `wowEnchantId` (wowsims
  `ID`: formula/scroll **item** id, or a spell id when wowsims sets `IsSpellID`) and `effectId` (wowsims
  `EffectID`). 15 more from a Wowhead supplement carrying `effectIds` = **spell ids** (e.g. 27917, 46498).
  `sampleEnchants.ts` merges the two by slug and puts `base.effectId` and the supplement's spell ids into
  **one `effectIds` array** — two id namespaces in one field (see B.3).
- Gems (`src/domain/gems/*`): 212 ingested from `all_gems.go`, every one with `wowItemId` (the gem's **item** id).
- Talents (`src/domain/talents/*.json`): 9 classes, 27 trees, 579 talents, ingested from Wowhead's TBC
  calculator. Each talent: `id` (talent id), `row`/`column` **0-based**, `maxRank`, `spellIds` per rank.
  Within every tree the file order is sorted by (row, column), no duplicate positions (checked by script).
- Characters: `CharacterProfile = { faction, race, className, spec, professions? }`; `spec` is **required**
  and must be one of the class's three specs (`tbcClasses.ts`). `professions` accepts primary professions only
  (Cooking/First Aid/Fishing excluded).
- Relic handling: `slotVisibility.ts` says Ranged and Relic are the same physical slot in TBC; Druid/Paladin/
  Shaman see `Relic`, everyone else sees `Ranged`.

## A. What WoWSims does

### A.1 The exporter addon — source, output, and how it reads the character

**Where it lives.** `github.com/wowsims/exporter` ("WoWSims Exporter addon repo"), MIT per GitHub's license
detection and per the LICENSE file (A.4). One code base for Era/SoD, TBC, Titan Reforged (Wrath), Cata and
Mists (TOC interface list 11508, 20505, 38001, 40402, 50503, 50504); TBC support
was added in commit `c54aa2aaa8` ("tbc support", 2026-02-23, PR #57 "poly/tbc", release v3.2.0). **sourced**
(GitHub commit/tag list).

**Load structure** (`WowSimsExporter.toc` @ad9e903): Ace3 (AceAddon, AceEvent, AceDB, AceGUI, AceConfig,
AceConsole, AceHook, AceComm) + **LibParse** for JSON, all pulled in by the BigWigs packager (`.pkgmeta`
externals). Per-flavour files are gated with TOC directives, e.g. `Conditional_TBC.lua [AllowLoadGameType tbc]`
and `extras.lua [AllowLoadGameType vanilla, tbc, wrath, cata]`. SavedVariables: `WSEDB`. **sourced**

**What it exports** — the JSON object is the Lua table built in `ExportStructures/Character.lua`, encoded
with `LibParse:JSONEncode` (`WowSimsExporter.lua` line 170). Fields, in the order the metatable declares
them (JSON key order itself is `pairs()` order, i.e. not stable — LibParse iterates with `pairs`):

| Field | Value | How it is read (file:line @ad9e903) |
|---|---|---|
| `version` | addon version string (`@project-version@` → tag) | `C_AddOns.GetAddOnMetadata(addon, "Version")` (Shared.lua:11) |
| `unit` | `"player"` (or inspect unit) | Character.lua:48 |
| `id` | **the character's GUID** (`UnitGUID(unit)`, `Player-<realmID>-<hex>`) | Character.lua:44 |
| `name` | **character name** | `UnitFullName(unit)` (Character.lua:43,49) |
| `realm` | **realm name** | same call (Character.lua:43,50) |
| `race` | English race token, `"Scourge"` rewritten to `"Undead"` | `GetPlayerInfoByGUID(guid)` 4th return (Character.lua:45,51,28) |
| `class` | lower-case English class token, e.g. `"warrior"` | `GetPlayerInfoByGUID` 2nd return, `:lower()` (Character.lua:52) |
| `level` | number | `UnitLevel(unit)` (Character.lua:53) |
| `spec` | e.g. `"fury"`; `""` if not recognised | tree with most points, `Conditional_TBC.lua` table (Character.lua:54) |
| `talents` | `"ddd…-ddd…-ddd…"`: one digit (current rank) per talent per tree, trees joined by `-`, **no trimming** | `Env.CreateTalentString()` (Misc.lua:69-82) |
| `professions` | `[{ "name": "Enchanting", "level": 375 }, …]` (English names) | `GetNumSkillLines`/`GetSkillLineInfo` (Misc.lua:46-65) |
| `gear` | `{ "items": [ItemSpec \| null, … ×17] }` | `EquipmentSpec.lua` + `ItemSpec.lua` |
| `glyphs` | not set on TBC (`FillForExport` skips glyphs for Era and TBC — Character.lua:76). Lives only in the metatable, so `pairs()` should not emit it (inference from LibParse's `pairs` loop — **unverified in-game**). | — |

TBC `ItemSpec` (`ItemSpec.lua:16-28`) = `{ id, enchant, random_suffix, gems }`, all numbers:
- parsed from `GetInventoryItemLink(unit, slotId)` with `strsplit(":", itemLink)` →
  `_, itemId, enchantId, gemId1, gemId2, gemId3, gemId4, suffixId, …` (ItemSpec.lua:61). The link's gem
  fields are copied through **as-is** — no `GetItemGem` call — and `enchant` is the link's enchant field. Empty
  fields become `nil` (key omitted). Gem holes before a filled gem are back-filled with `0` (lines 68-73).
- `items` is positional over 17 slots in this order (EquipmentSpec.lua:15-34): Head, Neck, Shoulder, Back,
  Chest, Wrist, Hands, Waist, Legs, Feet, Finger1, Finger2, Trinket1, Trinket2, MainHand, OffHand, Ranged —
  ammo, shirt and tabard excluded. An empty slot leaves a hole; LibParse writes holes as `null`
  (`JsonWriter:IsArray` uses the max integer key, `Write(nil)` → `"null"` — LibParse.lua:106-159, read from the
  copy vendored in `generalwrex/wowsimsexporter`, **sourced**; that the packaged WowAce build is identical is
  **unverified**). An empty Lua table encodes as `[]`.
- **There is no relic slot**: TBC relics sit in `INVSLOT_RANGED`, so they arrive as the 17th item.

**Talents** (`extras.lua:3-50`, **sourced**): a comment says *"As of Classic Patch 3.4.0, GetTalentInfo
indices no longer correlate to their positions in the tree"* (credited to RatingBuster). The addon builds a
cache on `SPELLS_CHANGED`: for each tab, key = `(tier-1)*4 + column`, sort ascending, i.e. **tier-major,
column-minor**, then reads `rank` as the 5th return of `GetTalentInfo(tab, index)`. Tabs are concatenated in
`GetNumTalentTabs()` order. Spec detection counts points per tab and picks the max (`TableMaxValIndex`); TBC
maps tab 1/2/3 to e.g. warrior arms/fury/protection, paladin 2 = protection, 3 = retribution, priest 3 =
shadow (Conditional_TBC.lua:20-49).

**Professions** (Shared.lua:23-47 + Misc.lua:46-65, **sourced**): builds a localized-name → English map
from hard-coded SkillLine ids (Blacksmithing 164, Leatherworking 165, Alchemy 171, Herbalism 182, Mining 186,
Tailoring 197, Engineering 202, Enchanting 333, Skinning 393, Jewelcrafting 755, Inscription 773) via
`C_TradeSkillUI.GetTradeSkillDisplayName(skillLineID)`, then walks `GetSkillLineInfo(i)` for
`i = 1..GetNumSkillLines()` and keeps matches with their `skillRank`. It does **not** expand collapsed skill
headers (see C.2 risk).

**Getting the string out** (UI.lua, **sourced**): an AceGUI `MultiLineEditBox`; after generating,
`SetText(json)`, `HighlightText()`, `SetFocus()` (UI.lua:292-298) so the user presses Ctrl+C. Label: *"Copy
and paste into the websites importer!"*. Slash commands `/wse`, `/wse export` (README + WowSimsExporter.lua:76-78,
157-166). A "WowSims" button is anchored to the character frame (TBC: next to `CharacterFrameTab5`,
UI.lua:265-266). It also **auto-saves the JSON into SavedVariables** — on by default (`autoSaveEnabled = true`)
— on `PLAYER_EQUIPMENT_CHANGED` / `CHARACTER_POINTS_CHANGED` / `PLAYER_TALENT_UPDATE` / `ENCHANT_SPELL_COMPLETED`
at max level, throttled to 1 s, keyed `UnitName("player") .. "-" .. GetRealmName()`, keeping up to 20
characters (WowSimsExporter.lua:81-96, SavedDataManager.lua:17-83 and 165-200).

### A.2 How the WoWSims web UI parses it

Two web importers exist, and the exporter's TBC build targets the **new** one:
`Conditional_TBC.lua:4` sets `Env.prelink = "https://www.wowsims.com/tbc/"`, which is `wowsims/tbc-new`'s
homepage (GitHub metadata). The old `wowsims/tbc` now shows an "outdated" bar linking to that URL
(`ui/core/outdated_sim.ts`, commit `31d4a80` "Add outdated-warnings and links to new sim", 2026-07-24; a
follow-up commit `7a2613f` the same day is titled "Remove auto-redirect"). **sourced**.

**wowsims/tbc-new** — `ui/features/import-export/importers/addon.ts` @a4768c9 (**sourced**):
1. `JSON.parse`; failure → "Please use a valid Addon export."
2. Fetches `https://api.github.com/repos/wowsims/exporter/releases/latest` at module load and warns if
   `version` differs (a network call Project Defeat must not copy).
3. Warns if `level` < max level.
4. `class`/`race` via `nameToClass`/`nameToRace` (throws on unknown); `professions[].name` via
   `nameToProfession` (throws on unknown).
5. `gear.items` → drop `null`s, delete `gear.version`, map `null` gems to `0`, `EquipmentSpec.fromJson`.
6. `finishIndividualImport` (`finish_individual_import.ts`): rejects a class mismatch ("Wrong Class!"),
   sets race, gear, talents (unless `''`/`'--'`), professions, then reports "Import successful, but the
   following IDs were not found in the sim database: Items: … Enchants: …".

Item/enchant/gem resolution (`ui/sim/proto/database.ts` @a4768c9, `lookupItemSpec` lines ~299-329):
items by numeric item id; **enchants searched per eligible item slot**, matching the incoming number
against **any of** `[enchant.effectId, enchant.itemId, enchant.spellId]`; gems by **gem item id**
(`lookupGem(itemID)`); random suffix by id. Slots are assigned by item eligibility, **not by array
position** ("EquipmentSpec is supposed to be indexed by slot, but here we assume it isn't just in case").

Talent string (`ui/features/talents/model/talents_string.ts`): *"digit i of tree t is config[t].talents[i],
in the order the config lists them, NOT a row index"*; trailing zeroes and dashes may be trimmed.

**Old wowsims/tbc** — `ui/core/components/importers.ts` @3301fca (**sourced**): `IndividualAddonImporter`
reads `class`, `race`, `talents`, `gear` (nulls filtered, `ignoreUnknownFields: true`). Enchants go through
`getEnchantFlexible(id)` = first enchant whose `id == n || effectId == n` (`ui/core/sim.ts:365-367`) — **not
slot-aware**, so the shared effect id 2564 (+15 Agility, both weapon and gloves) resolves to whichever comes
first. Gems by gem item id (`this.gems[gemId]`, sim.ts:508). Old proto `Enchant` documents the two ids:
`int32 id = 1; // ID of the enchant "item".` / `int32 effect_id = 2; // ID of the effect (for the item tooltip UI)`
/ `bool is_spell_id = 10; // If true, then id is the ID of the enchant spell instead of the formula item.`
(`proto/common.proto:600-607`).

**Cross-check — talent order matches the repo exactly.** Script comparison of tbc-new's
`ui/sim/talents/trees/*.json` (the config the talent string indexes into) against the repo's
`src/domain/talents/*Talents.json`: all 9 classes × 3 trees have the same tree order, the same talent count,
the same rank-1 spell id at every index, the same (row, col), and both are sorted by (row, col).
**cross-checked** (two independently ingested sources: wowsims and Wowhead). So a WoWSims talent string maps
onto the repo's per-tree file order with no lookup table.

### A.3 Does a WoWSims exporter work on TBC Anniversary today?

- **Maintained.** Latest release v3.2.4, 2026-08-05 ("fix TBC button location, tied to pvp char tab"); TBC
  support since v3.2.0 (2026-02-23). GitHub reports 8 open issues/PRs. **sourced** (GitHub API).
- **TOC**: `## Interface: 50504, 50503, 40402, 38001, 20505, 11508` — TBC entry **20505**. **sourced**.
- **But the live TBC Anniversary client is now 2.5.6 = interface 20506**: warcraft.wiki.gg
  `Template:LatestPatchInfo` lists `tbc | wow_anniversary | Burning Crusade Classic Anniversary Edition | 2.5.6 |
  20506 | 69795 | 2026-09-09`; Gethe/wow-ui-source `classic_anniversary` `version.txt` = `2.5.6.69795`;
  wago.tools lists `wow_anniversary` builds `2.5.6.69795` (2026-09-12), `2.5.6.69546`, `2.5.6.69110`.
  **cross-checked** (three sources). So the released exporter declares one interface behind the live client;
  the client classes an addon with an older interface as out of date (TOC_format: *"If an addon has an older
  interface version than the user's current WoW client version, the addon is classified as out of date."*).
  Blizzard's 2.5.6 `Blizzard_AddOnList/AddonList.lua` shows what that means (**sourced**): while
  `C_AddOns.IsAddonVersionCheckEnabled()` is true, an enabled addon whose reason is `"INTERFACE_VERSION"` is
  *not loadable*, the character-select screen raises an "ADDONS_OUT_OF_DATE" dialog offering to load them
  (`C_AddOns.SetAddonVersionCheck(false)`) or disable them, and the AddOn list's "ForceLoad" checkbox mirrors
  the same setting (lines 40-66, 145-155, 239-245, 273-282, 774-790). Whether the version check is **on by
  default** is **unverified**.
- **Latent fragility found while reading**: the exporter calls the global `GetTalentInfo(tab, i)`. On 2.5.6
  that global is a **deprecation fallback** defined in
  `Blizzard_DeprecatedSpecialization/Deprecated_Specialization_TBC.lua`, loaded only
  `if GetCVarBool("loadDeprecationFallbacks")` (Gethe classic_anniversary, **sourced**). The wiki's CVar page
  says that CVar is on by default in release builds but *"can default to disabled in test builds"* and is
  not persisted (**sourced**, warcraft.wiki.gg CVar_loadDeprecationFallbacks). Also, the wrapper's return
  order on 2.5.6 is `name, icon, tier, column, rank, maxRank, meetsPrereq, previewRank, meetsPreviewPrereq,
  isExceptional, hasGoldBorder, talentID` — the exporter's `avail` (8th value) is actually `previewRank`,
  which is truthy for every existing talent (a number, and 0 is truthy in Lua), so it works by accident.
  **sourced** (wrapper code) + reasoning.

### A.4 Licenses (quoted from the LICENSE files)

- **wowsims/exporter** @ad9e903 `LICENSE`: "MIT License / Copyright (c) 2022 General Wrex / Permission is hereby
  granted, free of charge, to any person obtaining a copy of this software … to deal in the Software without
  restriction … subject to the following conditions: The above copyright notice and this permission notice
  shall be included in all copies or substantial portions of the Software." **sourced**
- **wowsims/tbc** @3301fca `LICENSE`: "MIT License / Copyright (c) 2022 wowsims team" + the same standard MIT
  text. **sourced**
- **wowsims/tbc-new** @a4768c9 `LICENSE`: "MIT License / Copyright (c) 2022 wowsims team" (same text). **sourced**
- The exporter's JSON library LibParse carries its own permissive notice (header of LibParse.lua: "Permission
  is hereby granted, free of charge … The above copyright notice and this permission notice shall be included
  in all copies or substantial portions of the Software."), derived from chipmunkav.com Json.lua. **sourced**
  (vendored copy in generalwrex/wowsimsexporter).

## B. The export format (website side)

### B.1 Plain JSON, not compressed

**Recommendation: one line of compact, plain JSON.** Measured with a script on a realistic character (the
Phase 2 Fury Warrior preset shipped in `wowsims/tbc-new` `ui/specs/warrior/dps/gear_sets/p2_fury.gear.json` +
its `FuryTalents` string, converted to the format in "Proposed export format"): **1,204 characters** compact,
2,201 pretty-printed; the same text deflated + base64url would be **~632–640 characters**. **sourced**
(measurement script output).

Why not compress:
- The destination is a paste box, not a URL. The 16,000-char `MAX_PAYLOAD_CHARS` guard in `shareLink.ts` is
  for links; `parseBuild` has no length limit, and 1.2 KB is far below any EditBox or textarea concern (C.3).
- In-game compression needs a Lua library. The standard one, LibDeflate (SafeteeWoW/LibDeflate, Zlib
  license, **3,605 lines / ~130 KB** in one file, last pushed 2021-05-05 — **sourced**, GitHub API), would be
  ~20× the size of the whole addon, and produces raw DEFLATE (`CompressDeflate`) or zlib
  (`CompressZlib`) that the site would then have to match to the right `DecompressionStream` format (the share
  link uses `'deflate'`; which LibDeflate mode that pairs with was not tested here).
  Two encoders on two sides is exactly the kind of mismatch that fails silently.
- Plain JSON is self-evidently debuggable: a player can paste it in a bug report, the owner can read it, and
  a test fixture is just the string.
- The format carries **no free text** (no names — see B.5), only numbers and a handful of fixed ASCII tokens,
  so the Lua side can build it by concatenation with **no string escaping and no JSON library**.

### B.2 Version field and migration story

- `"format": "project-defeat-character"` — a discriminator, so the one paste box can tell three inputs apart:
  a SavedBuild (`version` + `character` object), a Project Defeat addon export (`format`), and a WoWSims
  exporter JSON (`gear.items` + `class` string + `talents` string).
- `"formatVersion": 1` — **independent of `BUILD_FORMAT_VERSION`.** The addon export is converted *into* a
  `SavedBuild` (version 1) and then goes through `validateBuild`; the two versions evolve separately.
- Rules: adding optional fields does **not** bump the version (the parser ignores unknown fields); changing
  the meaning or encoding of an existing field **does**. The site keeps one small parser per
  `formatVersion` forever (the site is always the latest code; old addon installs keep emitting old
  versions for months). An unknown *higher* version is refused with a sentence ("made by a newer addon than
  this site understands"), mirroring `validateBuild`'s "Unsupported build version" refusal.
- `"addon"` (addon version) and `"client"` (`GetBuildInfo()` version+build, e.g. `2.5.6.69795`) are carried
  for bug reports only; the parser must not branch on them.

### B.3 Mapping onto the existing pipeline — and the ID gaps

The converter is a pure function `addonExport → SavedBuild` placed in front of the existing
`validateBuild`, so a pasted addon export is exactly as trusted as a pasted build. What it has to resolve:

**Items — no gap in mechanism.** The link's item id is the numeric WoW item id; the catalogue already has
`getItemByWowItemId` (`itemCatalogue.ts` ~line 271). End-to-end check: every item, gem and enchant id in
wowsims tbc-new's P2 Fury preset resolved against the repo's JSON catalogues (script output: 17/17 items,
11/11 gem ids, 10/10 enchant ids — 9 distinct). **sourced**. Items outside the catalogue (levelling gear, anything wowsims
never modelled) must be reported by numeric id and slot and left empty — the same drop-with-issue pattern
`validateBuild` already uses.

**Enchants — the link carries the SpellItemEnchantment id, which *is* the repo's `effectId`; key by (id, slot).**
- The ItemLink format puts `enchantID` second; warcraft.wiki.gg says *"See list of EnchantIds and
  SpellItemEnchantment.db2"*. **sourced**.
- The repo's 79 ingested enchants carry wowsims `EffectID` as `effectId`. Script check against the live
  2.5.6.69795 `SpellItemEnchantment` table (wago.tools): **all 79 exist, and each row's in-game text is the
  enchant's effect** (e.g. 2673 "Mongoose", 3225 "Executioner", 2564 "+15 Agility", 3012 "+50 Attack Power and
  +12 Critical Strike Rating" for Nethercobra Leg Armor); and spell 27984 (Enchant Weapon – Mongoose) has effect 53 (enchant item) with misc value 2673.
  **cross-checked** (wowsims data + live DB2).
- **The same id legitimately appears on different slots**: 2564 (+15 Agility) = "Weapon - Agility" *and*
  "Gloves - Major Agility"; 2649 (+12 Stamina) = bracer *and* boots; 2648 (+12 Defense) = bracer *and*
  cloak. **sourced** (catalogue + wowsims `all_enchants.go` lines 38/50/51/63/78/93). So the lookup must be
  `(effectId, GearSlot)` using `allowedSlots ?? [slot]` — the way tbc-new does it (per eligible slot) and not
  the way the old wowsims/tbc `getEnchantFlexible` did (first match anywhere).
- **Gap 1 — the 15 Wowhead-supplement enchants have no SpellItemEnchantment id.** Their `effectIds` are
  *spell* ids. Resolved through the live DB2 (SpellEffect effect 53 → misc value; for item-applied ones,
  ItemEffect → spell → misc value), **sourced** from wago.tools 2.5.6.69795:

  | Supplement slug | ids in repo | SpellItemEnchantment id |
  |---|---|---|
  | bracer-spellpower | spells 27917, 46498 | 2650 (same slug as ingested entry — merges) |
  | bracer-superior-healing | spell 46500 | 2617 |
  | cloak-major-resistance | spell 27962 | 2664 |
  | cloak-spell-penetration | spell 34003 | **2938 — duplicate of ingested `enchant-cloak-spell-penetration`** |
  | gloves-major-healing | spells 33999, 46513 | 2322 |
  | gloves-spell-strike | spell 33994 | 2935 (same slug as ingested — merges) |
  | gloves-superior-agility | spell 25080 | **2564 — duplicate of ingested `gloves-major-agility`** (wowsims' id 33152 is the formula item that teaches spell 25080) |
  | glyph-of-renewal | item 29190 | 3001 |
  | golden-spellthread | item 24276 | 2746 |
  | greater-inscription-of-faith | item 28887 | 2980 |
  | ring-healing-power | spells 27926, 46517 | 2930 |
  | ring-spellpower | spells 27924, 46518 | 2928 (same slug as ingested — merges) |
  | weapon-major-healing | spell 46531 | 2343 |
  | weapon-soulfrost | spell 27982 | **2672 — duplicate of ingested `soulfrost`** |
  | weapon-sunfire | spell 46540 | **2671 — duplicate of ingested `sunfire`** |

- **Gap 2 (the one that would produce a wrong answer) — BiS enchant recommendations point at the duplicate
  supplement slugs.** `bisRecommendations.json` recommends `gloves-superior-agility` for 7 specs (Feral,
  all 3 Hunter, all 3 Rogue), `weapon-sunfire` for 7 (Balance, all 3 Mage, all 3 Warlock),
  `weapon-soulfrost` for Shadow and `cloak-spell-penetration` for Elemental; the ingested twins are
  recommended nowhere. **sourced** (script over the JSON). An imported character wearing exactly the
  recommended enchant resolves by SpellItemEnchantment id to the *ingested* slug, so a "what's missing vs
  BiS" view that compares slugs would call it missing. Fix in the data (one slug per enchant, or compare by
  SpellItemEnchantment id) before the "missing vs BiS" feature reads imports.
- **Gap 3 — `effectIds` mixes two namespaces.** `sampleEnchants.ts` lines 31-36 merge `base.effectId`
  (SpellItemEnchantment id) with the supplement's spell ids into one `effectIds` array (e.g. bracer-spellpower
  becomes `[2650, 27917, 46498]`), and `enchantTypes.ts` documents `effectIds` as "Every spell id that applies
  this enchant". The importer must read `effectId` only; the field should be split or renamed (e.g.
  `itemEnchantmentId` vs `spellIds`) by the ingest tools rather than by hand.
- Enchants the catalogue does not model at all (armor kits, and anything else wowsims never listed) →
  report and drop; the item stays. Temporary enchants (oils, stones, poisons) never appear in links
  (ItemLink page: *"Temporary enchants like Windfury Weapon and Rough Sharpening Stone do not appear in the
  ItemLink"*, **sourced**), so they stay a manual consumable choice.

**Gems — link fields are gem *item* ids on this client; the repo keys gems by item id.**
- ItemLink page: *"Gems are listed by itemID for each socket. gemID4 is unused."* **sourced**. The page's
  commented-out historical example (`item:28484:1503::2946:2945…`) shows the *old* scheme where those fields
  were gem **enchant** ids — the reason this needed checking.
- The WoWSims TBC exporter copies the link's gem fields straight through (ItemSpec.lua:61-66) and tbc-new
  looks them up as gem item ids (`lookupGem(itemID)`, database.ts ~295). A wrong assumption here would lose
  every gem of every WoWSims TBC import. **cross-checked** (wiki + two independent code paths that must
  agree for WoWSims imports to work). Still worth one in-game `/dump` by the owner (C.5).
- All 212 repo gem `wowItemId`s are real gem items on 2.5.6 (each is the `GemItemID` of a
  SpellItemEnchantment row), and **no gem item id collides with any SpellItemEnchantment id** in that table
  (0 overlaps) — so if a future client ever emitted enchant ids, an ingest-generated table could translate
  them unambiguously. **sourced** (script over wago.tools 2.5.6.69795).
- Coverage gap: the live table has **259** gem items; **47 are not in the repo** — some are plainly not
  player gems (27864 "gem test enchantment"), the rest are **unverified** as to obtainability. Unknown gem →
  keep the item, leave that socket empty, report it.
- Socket positions matter (`socketBonusIsActive` indexes `gemIds[i]` against `sockets[i]`), so empty sockets
  must be written as `''`, **not** `null` — `validateBuild`'s `isStringArray` rejects a `null` and would throw
  away the whole slot's gems.

**Talents — the repo's talent id is the client's Talent.db2 id; no sorting needed if the addon exports ids.**
- Script comparison of all 579 repo talents against the live 2.5.6.69795 `Talent` table: **579/579 match** on
  id, tab id, tier (0-based), column (0-based) and the full rank-spell list; no player-tab talent in the
  client is missing from the repo; each class's `TalentTab.OrderIndex` 0/1/2 equals the repo's tree order.
  **cross-checked** (Wowhead-derived repo data vs Blizzard DB2).
- In-game index order is **not** positional: warcraft.wiki.gg API:GetTalentInfo/Classic — *"The talent index
  supplied to this function should not be expected to map to the placement of a talent within its tree.
  Callers must use the tier and column return values"*; WoWSims `extras.lua` says the same and sorts by
  `(tier-1)*4+column`; Blizzard's own 2.5.6 talent frame positions each button from `talentInfo.tier` /
  `talentInfo.column` (Blizzard_FrameXML/Vanilla/TalentFrameBase.lua ~line 91-103). **cross-checked**.
- A third, independent data point shows what the index order actually is. WeakAuras added a per-class TBC
  talent table in its "TBC Anniversary support" commit (`9f40140342`, 2026-01-07; `WeakAuras/Types_TBC.lua`
  `Private.talentInfo`, entries of icon, tier, column, max-rank spell, written with the `-- [n]` comments the
  client uses when it saves Lua tables — so it looks captured in-game, though its provenance isn't
  documented). Script comparison: for all 9 classes / 579 talents, that table's order equals the repo's talents
  **sorted by talent id within each tab**, with matching tier, column and max-rank spell — and does **not**
  equal row/column order. So on this client the index order appears to be ascending Talent.db2 id per tab,
  which also supports `talentID` being the Talent.db2 id. **cross-checked** as to order; the "captured in-game"
  reading is an inference.
- On 2.5.6, `C_SpecializationInfo.GetTalentInfo(query)` returns a table with **`talentID`**, `tier`,
  `column` (both 1-based `luaIndex`), `rank`, `maxRank` … (Blizzard_APIDocumentationGenerated/
  SpecializationInfoDocumentation.lua, **sourced**). Blizzard passes that `talentID` to
  `GameTooltip:SetTalent(talentInfo.talentID, …)`, which is consistent with it being the Talent.db2 row id —
  that it equals the repo id is **strongly indicated but unverified in-game**; hence the export also carries
  tab/tier/column so the site can fall back to position (repo `row = tier-1`, `column = column-1`).
- WoWSims talent strings (interop) map with no table at all: digit *i* of tree *t* = the *i*-th talent in the
  repo's tree file order (A.2 cross-check).
- Validate the result the way the talent panel would: rank ≤ `maxRank`, ids belong to the character's class,
  total ≤ level − 9, row gating/prerequisites (`whyBlocked` logic). A real character always passes; a failure
  means data drift and should be reported, not silently accepted.

**Character.**
- Race token (`UnitRace` 2nd return / ChrRaces.ClientFileString): `Human, Orc, Dwarf, NightElf, Scourge,
  Tauren, Gnome, Troll, BloodElf, Draenei` → repo `TbcRace` needs `NightElf→Night Elf`, `BloodElf→Blood Elf`,
  `Scourge→Undead`. **cross-checked** (wiki RaceID + 2.5.6 ChrRaces DB2). WoWSims already rewrites
  `Scourge→Undead` but leaves `NightElf`/`BloodElf`.
- Class token (`UnitClass` 2nd return / ChrClasses.Filename): `WARRIOR, PALADIN, HUNTER, ROGUE, PRIEST,
  SHAMAN, MAGE, WARLOCK, DRUID` → title case. **cross-checked** (wiki ClassID + 2.5.6 DB2).
- Faction (`UnitFactionGroup` tag `Alliance`/`Horde`) — carried, and checked against `racesByFaction`.
- **Spec is required by `validateCharacter` and the game has no spec.** Infer it as the tree with the most
  points (what WoWSims does: `TableMaxValIndex`), then look up `trees[i].spec` — the repo's tree `spec` values
  are already `TbcSpec` names. Ties / no points / a healer or tank result are an owner decision (Open
  questions).
- Professions: `skillLine` ids 164/165/171/182/186/197/202/333/393/755 → Blacksmithing, Leatherworking,
  Alchemy, Herbalism, Mining, Tailoring, Engineering, Enchanting, Skinning, Jewelcrafting. **cross-checked**
  (WoWSims Shared.lua:23-36 + 2.5.6 SkillLine DB2, category 11). Secondary skills (129 First Aid, 185
  Cooking, 356 Fishing — category 9) are dropped, matching `primaryProfessions`.

**Slots.** Inventory slot ids (warcraft.wiki.gg InventorySlotID, **sourced**; ranged = 18 also appears in
Blizzard's 2.5.6 PaperDollFrame `GetInventoryItemTexture("player", 18)`): 1 Head, 2 Neck, 3 Shoulders, 5
Chest, 6 Waist, 7 Legs, 8 Feet, 9 Wrists, 10 Hands, 11/12 Finger 1/2, 13/14 Trinket 1/2, 15 Back, 16 Main
Hand, 17 Off Hand, **18 → `Relic` for Druid/Paladin/Shaman, else `Ranged`** (`slotVisibility.ts`; Blizzard's
TBC paperdoll checks `UnitHasRelicSlot`). Skip 0 (ammo), 4 (shirt), 19 (tabard).

**Three pipeline behaviours that would misreport an imported character** (all **sourced** from the repo):
1. `validateBuild` drops items that fail `isItemAllowedForCharacter`, which includes curated **role/spec
   tags** (`item.roles`, `item.allowedSpecs`; 201 curated entries carry `roles:`, 44 carry `allowedSpecs:` in
   `sampleItems.ts`). Right for a planner's picker, wrong for gear the player is physically wearing — the
   message would say "isn't legal for a Fury Warrior" about an item they have on.
2. `validateBuild` does **not** check slot compatibility (a trinket filed under Head passes). The converter
   must place items by the inventory slot they came from and check `isItemCompatibleWithGearSlot`.
3. `gearFromBuild` → `normalizeGearForCharacter` **refills an empty Off Hand** whenever the Main Hand is not a
   two-hander (characterItemRules.ts ~222-228). A character who really has nothing in the off hand — or whose
   off-hand item was dropped as unknown — would be shown wearing the highest-item-level off-hand the
   catalogue offers. The import path needs to opt out of that refill.

### B.4 Items / enchants / gems not in the catalogue

Keep `validateBuild`'s philosophy — *structural problems reject the whole import; catalogue gaps drop the
smallest possible unit and say so*:
- Unknown **item** → slot left empty (explicit empty placeholder, so nothing refills it), issue names the slot
  and numeric id (optionally a Wowhead URL for the id — a link the player clicks, not a fetch the site makes).
- Unknown **enchant** → item kept, enchant cleared, issue.
- Unknown **gem** → item kept, that socket `''`, issue.
- Item **above Phase 2** → reuse `validateBuild`'s existing phase sentence.
- Random-suffix item (`suffix` ≠ 0) → keep the base item, issue "random-suffix stats are not modelled".
- Talent inconsistency → import talents only if they validate; otherwise import none and say why.
- Show the issues in the existing Build-panel issue list; never silently substitute.

### B.5 Privacy

- **What WoWSims exports** (**sourced**, Character.lua): `name`, `realm`, and `id` = the character **GUID**
  (`UnitGUID`), plus `unit`, `version`, `race`, `class`, `level`, `spec`, `talents`, `professions`, `gear`.
  No guild. It also **persists** each export in SavedVariables keyed `Name-Realm`
  (SavedDataManager.lua:36-46).
- **Project Defeat's export should omit**: name, realm, GUID, guild, account/battletag, anything free-text,
  and anything timestamped. Keep only mechanics: race, class, faction, level, profession skill-line ids +
  rank, talents, gear ids. No SavedVariables by default (nothing at rest on disk).
- The WoWSims interop parser must read and **discard** `name`/`realm`/`id` — never copy them into a
  `SavedBuild`, a share link or `localStorage`.
- This also lines up with distribution rules: Wago's Developer Agreement requires that an application "shall
  not have the effect or purpose of collecting personally identifiable information of End Users" (D.2).


## C. The addon

### C.1 TOC interface number

**`20506`** for the live TBC Anniversary client (2.5.6, build 69795). **cross-checked**: warcraft.wiki.gg
`Template:LatestPatchInfo` (`tbc | wow_anniversary | … | 2.5.6 | 20506 | 69795 | 2026-09-09`), Gethe
`classic_anniversary/version.txt` = `2.5.6.69795`, wago.tools build list (`wow_anniversary` 2.5.6.69795,
2026-09-12). The interface number is the version with two-digit minor/patch (TOC_format: *"If the game version
is 10.2.7, then the interface version is 100207"*), and `/dump (select(4, GetBuildInfo()))` prints it in game
(same page). Note the WoWSims exporter still declares 20505 (A.3), i.e. the previous client.

A maintained major addon agrees: WeakAuras' `WeakAuras/WeakAuras_TBC.toc` declares `## Interface: 20506`
(GitHub WeakAuras/WeakAuras2 default branch, **sourced**).

TOC layout facts (warcraft.wiki.gg TOC_format, **sourced**): file and folder names must match; comma-delimited
`## Interface:` values are supported; `## AllowLoadGameType: tbc` restricts loading to "Burning Crusade Classic
and Classic Anniversary Edition"; flavour-specific files use `_TBC.toc`, and for Classic Anniversary 2.5.5
*"The legacy TOC suffix -BCC is no longer supported"*; WoW reads only the first 1024 characters of a TOC line.
The same table's `tbc` row aliases `_anniversary_`, which matches the client's install-folder naming
(`_retail_`, `_ptr_` …) — so the addon goes in `World of Warcraft\_anniversary_\Interface\AddOns\` (**sourced
from the template's aliases; confirm on the owner's install**).

### C.2 The exact API calls (2.5.6)

Everything below was checked against Blizzard's own shipped code or generated API docs in Gethe/wow-ui-source
`classic_anniversary` (2.5.6.69795) unless marked otherwise.

| Need | Call | Evidence |
|---|---|---|
| Race | `local _, raceToken = UnitRace("player")` → `Human, Orc, Dwarf, NightElf, Scourge, Tauren, Gnome, Troll, BloodElf, Draenei` | wiki API:UnitRace (`localizedRaceName, englishRaceName, raceID`) + wiki RaceID + 2.5.6 ChrRaces DB2 — **cross-checked** |
| Class | `local _, classToken = UnitClass("player")` → `WARRIOR` … | 2.5.6 UnitDocumentation (`className, classFilename, classID`) + ChrClasses DB2 — **cross-checked** |
| Faction | `local factionTag = UnitFactionGroup("player")` → `Alliance`/`Horde` | 2.5.6 UnitDocumentation (`factionGroupTag, localized`) — **sourced** |
| Level | `UnitLevel("player")` | 2.5.6 UnitDocumentation — **sourced** |
| Client build | `GetBuildInfo()` (version, build, date, interface) | TOC_format page uses `select(4, GetBuildInfo())` — **sourced** |
| Equipped item link | `GetInventoryItemLink("player", slotId)` for slots 1,2,3,5,6,7,8,9,10,11,12,13,14,15,16,17,18 | Blizzard TBC PaperDollFrame.lua:1380 calls it; wiki API page; WoWSims uses it on TBC — **cross-checked** |
| Item string fields | `itemID : enchantID : gemID1 : gemID2 : gemID3 : gemID4 : suffixID : uniqueID : linkLevel : specializationID : modifiersMask : itemContext : …` | warcraft.wiki.gg ItemLink — **sourced**; WoWSims parses the same order (ItemSpec.lua:61) — **cross-checked** |
| Link colour prefix | links now start `\|cnIQx\|Hitem:` (not `\|cffRRGGBB`) | ItemLink "Patch 11.1.5: Color sequence … replaced with `\|cnIQx`" and its Burning Crusade Classic example — **sourced**; parse by the `\|Hitem:` marker, never by fixed offsets |
| Enchant | link field 2 = SpellItemEnchantment id | ItemLink + DB2 check in B.3 — **cross-checked** |
| Gems | link fields 3–5 = gem item ids (field 6 unused) | ItemLink + WoWSims/tbc-new — **cross-checked**. Fallbacks exist: `C_Item.GetItemGem(link, i)` → `gemName, gemLink` and `C_Item.GetItemGemID(itemInfo, i)` → `gemID` (2.5.6 ItemDocumentation, **sourced**). Do **not** use the global `GetItemGem`: on 2.5.6 it is only a deprecation alias (`GetItemGem = C_Item.GetItemGem` in Blizzard_DeprecatedItemScript, loaded only when `loadDeprecationFallbacks` is on) |
| Random suffix | link field 7 (`suffixID`; negative ids are post-2.0 `ItemRandomSuffix`) | ItemLink — **sourced** |
| Talent tabs | `GetNumTalentTabs()` | Blizzard_TalentUI Classic line 515 — **sourced** |
| Talents per tab | `GetNumTalents(tab)` | Blizzard_FrameXML/Vanilla/TalentFrameBase.lua:62 (loaded by the TBC FrameXML TOC) — **sourced** |
| Talent data | `C_SpecializationInfo.GetTalentInfo({ specializationIndex = tab, talentIndex = i })` → `.talentID`, `.tier`, `.column` (1-based), `.rank`, `.maxRank` (nil for empty indices) | 2.5.6 SpecializationInfoDocumentation.lua (TalentInfoQuery/TalentInfoResult) + TalentFrameBase.lua:85-103 — **sourced**. Avoid the global `GetTalentInfo`: on 2.5.6 it is a deprecation fallback (Deprecated_Specialization_TBC.lua) whose returns no longer match the wiki's Classic page |
| Points per tab / tab name | `C_SpecializationInfo.GetSpecializationInfo(tab)` → 2nd `name`, 7th `pointsSpent` | 2.5.6 docs + TalentFrameBase.lua:41 — **sourced** (or just sum `rank`s) |
| Professions | `for i = 1, GetNumSkillLines() do local name, isHeader, _, rank = GetSkillLineInfo(i) … end` | Blizzard Classic SkillFrame.lua:26,183,290 on 2.5.6 — **sourced**; wiki API:GetSkillLineInfo — **cross-checked** |
| Localised profession names | `C_TradeSkillUI.GetTradeSkillDisplayName(skillLineID)` for 164,165,171,182,186,197,202,333,393,755 → build name→id map | 2.5.6 TradeSkillUIDocumentation — **sourced**; this is exactly what WoWSims does on TBC (Shared.lua:38-47). That its output equals `GetSkillLineInfo`'s name in non-English locales is **unverified** |
| Collapsed skill headers | `ExpandSkillHeader(0)` first ("Index 0 ("All") will expand all headers") | wiki API:ExpandSkillHeader; Blizzard's 2.5.6 SkillFrame.xml:72-78 calls Expand/CollapseSkillHeader; wiki API:GetSkillLineInfo: *"Indices can change depending on collapsed/expanded headers."* — **sourced**. WoWSims does **not** do this, so a player who collapsed "Professions" exports none |

Neither Blizzard's own TBC skill UI nor WoWSims uses `GetProfessions` — both walk skill lines (**cross-checked**:
Blizzard SkillFrame + WoWSims Misc.lua). Whether a `GetProfessions` global exists at all on 2.5.6 was **not
checked**; the addon shouldn't need it.

**Deprecation trap (worth knowing even for a tiny addon).** 2.5.6 ships `Blizzard_Deprecated*` addons that
re-create old globals only `if GetCVarBool("loadDeprecationFallbacks")` (**sourced**); the CVar defaults on
in release builds but *"can default to disabled in test builds"* and resets on restart (warcraft.wiki.gg
CVar_loadDeprecationFallbacks, **sourced**). Using the `C_` APIs above avoids depending on it — which is
exactly what WeakAuras does: its `Compatibility.lua` re-implements `GetTalentInfo` over
`C_SpecializationInfo.GetTalentInfo` for Classic/TBC/Wrath/Cata, commented "copy pasta from
Interface/AddOns/Blizzard_DeprecatedSpecialization/ … Deprecated_Specialization_TBC.lua" (**cross-checked**).

### C.3 Getting the string out of the game

- **Addons cannot write the clipboard.** `CopyToClipboard` is `HasRestrictions = true` in the 2.5.6 generated
  docs (OsDocumentation.lua) and marked *protected* on warcraft.wiki.gg. **cross-checked**.
- **Pattern: EditBox, text pre-selected, player presses Ctrl+C.** `EditBox:SetText(s)`,
  `EditBox:HighlightText()` (no args = whole content), `EditBox:SetFocus()` (2.5.6 SimpleEditBoxAPI docs +
  wiki HighlightText page, **sourced**). WoWSims does precisely this (UI.lua:292-298, **sourced**).
- **Length limits**: the UI XML schema gives the EditBox `letters` attribute `default="0"`, and Blizzard's own
  `InputScrollFrameTemplate` sets `maxLetters = 0` and calls `self.EditBox:SetMaxLetters(self.maxLetters)`
  (2.5.6 UI.xsd + SecureUIPanelTemplates.xml:108 / .lua:126, **sourced**) — 0 is the "no letter cap"
  convention; an absolute engine cap is **unverified**, but a WoWSims TBC export is the same order of size
  (~0.8 KB measured for the example gear, before its name/realm/GUID) and ours is ~1.2 KB.
- **Templates confirmed present on 2.5.6**: `BasicFrameTemplateWithInset`, `InputScrollFrameTemplate`,
  `UIPanelScrollFrameTemplate`, `InputBoxTemplate`, `UIPanelButtonTemplate`, `UIPanelCloseButton`
  (**sourced**, 2.5.6 XML).
- **SavedVariables alternative**: the client writes listed variables *"when you log out, disconnect, quit the
  game, or reload your user interface (/reload)"* to `WTF\Account\ACCOUNTNAME\SavedVariables\AddOnName.lua`
  (per-character variant adds `RealmName\CharacterName\`) — warcraft.wiki.gg "Saving variables between game
  sessions", **sourced**. Trade-offs: needs a `/reload` or logout before the file exists; the player must find
  a file under an account-named folder; the file is Lua, so the site would need to extract a string from it
  (store the JSON as one Lua string to keep that trivial); and it leaves data at rest. **Recommendation: copy/
  paste only**; mention SavedVariables in Open questions as a possible later "upload file" path.

### C.4 Minimal layout, commands, size

```
ProjectDefeatExport/
  ProjectDefeatExport.toc
  ProjectDefeatExport.lua
  LICENSE            (licence still to be chosen — the site repo has none; see D.2 and Open question 2)
```

TOC (≈6 lines): `## Interface: 20506`, `## Title: Project Defeat Export`, `## Notes: …`, `## Version: …`,
`## AllowLoadGameType: tbc`, then `ProjectDefeatExport.lua`. No `SavedVariables`, no libraries, no
`embeds.xml`, no `.pkgmeta` externals.

Lua structure (prose/pseudocode — not an implementation):

```
local SLOTS = {1,2,3,15,5,9,10,6,7,8,11,12,13,14,16,17,18}   -- inventory slot ids
local PROFESSION_IDS = {164,165,171,182,186,197,202,333,393,755}

local function itemFields(link)            -- "|cnIQ4|Hitem:28830::::::::70:…|h[…]|h|r"
  local s = link and link:match("|Hitem:([^|]+)|h")
  return s and { strsplit(":", s) }         -- [1]=item [2]=enchant [3..5]=gems [7]=suffix
end

local function collect()                    -- returns plain Lua tables of numbers/tokens
  character: UnitRace/UnitClass/UnitFactionGroup/UnitLevel/GetBuildInfo
  gear:      for slot in SLOTS -> GetInventoryItemLink("player", slot) -> itemFields -> tonumber()
  talents:   for tab = 1, GetNumTalentTabs() do for i = 1, GetNumTalents(tab) do
               local t = C_SpecializationInfo.GetTalentInfo({specializationIndex = tab, talentIndex = i})
               if t and t.rank > 0 then add {t.talentID, tab, t.tier, t.column, t.rank} end
  professions: ExpandSkillHeader(0); map GetTradeSkillDisplayName(id) -> id; walk GetSkillLineInfo
end

local function toJSON(data)                 -- ~20 lines: numbers, fixed ASCII tokens, arrays, objects
end                                         -- (no user text, so no escaping)

local function show(text)                   -- one frame, reused
  BasicFrameTemplateWithInset + InputScrollFrameTemplate; SetText; HighlightText; SetFocus
  tinsert(UISpecialFrames, frameName)       -- Esc closes it (as WoWSims does)
end

SLASH_PDEXPORT1 = "/pdexport"               -- slash-command pattern: warcraft.wiki.gg "Creating a slash command"
SlashCmdList.PDEXPORT = function() show(toJSON(collect())) end
```

**Size estimate: ~120–150 lines of Lua + a 6-line TOC**, no dependencies (WoWSims needs Ace3 + LibParse for
the same job). A character-sheet button is optional polish; a slash command is enough for v1.

### C.5 Testing when only the owner can run the client

1. **Site side first (no game needed)** — the converter is pure TypeScript, so every rule gets a fixture test in
   the existing suite: the realistic example below; empty slots; two-hander + empty off hand; one-hander + empty
   off hand (must stay empty); relic class (slot 18 → Relic); random suffix; unknown item/gem/enchant; the
   2564-on-gloves vs 2564-on-weapon case; `NightElf`/`BloodElf`/`Scourge`; 0 talent points; illegal talent set;
   `formatVersion: 2`; a WoWSims export with `null` holes and `name`/`realm`/`id` that must not survive.
2. **Addon logic outside the game** — keep `collect()` reading through a small injected API table so the Lua can
   run under a stock Lua 5.1 interpreter with recorded fake responses (WoW implements "a subset of version 5.1
   of the official Lua specification" — warcraft.wiki.gg Lua, **sourced**; WoW-only globals like `strsplit`
   need a shim).
3. **One in-game session by the owner**, a checklist of `/dump`s that settle the remaining unverified points:
   `select(4, GetBuildInfo())` (expect 20506); `GetInventoryItemLink("player", 1)` on a socketed helm (gem
   fields should equal the gems' Wowhead *item* ids); `C_SpecializationInfo.GetTalentInfo({specializationIndex=1,
   talentIndex=1})` (compare `talentID`/`tier`/`column` with the repo); `UnitRace("player")`; then `/pdexport` →
   paste → the site's paperdoll should match the character sheet with an empty issue list.
4. **Second opinion for free**: export the same character with the WoWSims exporter and paste both into the site;
   the two resulting builds must be identical. That cross-checks the addon against an independent implementation.
5. Record the owner's real export (with name-free format) as a committed fixture so regressions are caught
   without the game.


## D. Compliance and distribution

### D.1 Blizzard's UI Add-On Development Policy

Source: "UI Add-On Development Policy", official World of Warcraft forums, posted by Blizzard's Kaivax on
2018-11-19 (the policy text itself dates from 2009) — https://us.forums.blizzard.com/en/wow/t/ui-add-on-development-policy/24534
(raw text at `/en/wow/raw/24534`). **sourced**. No newer formal version turned up in a search (**unverified**
that none exists). The eight rules, quoted:

1. *"Add-ons must be free of charge."* — "Developers may not create "premium" versions of add-ons with
   additional for-pay features, charge money to download an add-on, charge for services related to the
   add-on, or otherwise require some form of monetary compensation to download or access an add-on."
2. *"Add-on code must be completely visible."* — "The programming code of an add-on must in no way be hidden
   or obfuscated, and must be freely accessible to and viewable by the general public."
3. *"Add-ons must not negatively impact World of Warcraft realms or other players."* — "…this includes but is
   not limited to excessive use of the chat system, unnecessary loading from the hard disk, and slow frame
   rates."
4. *"Add-ons may not include advertisements."* — "Add-ons may not be used to advertise any goods or services."
5. *"Add-ons may not solicit donations."* — "…such requests should be limited to the add-on website or
   distribution site and should not appear in the game."
6. *"Add-ons must not contain offensive or objectionable material."*
7. *"Add-ons must abide by World of Warcraft ToU and EULA."*
8. *"Blizzard Entertainment has the right to disable add-on functionality as it sees fit."*

What that means here: free, source public (the repo is public; no minified/obfuscated Lua), no chat or
addon-channel traffic (the design sends nothing), no donation or promotional text in the game UI. Printing
the site's name as an *instruction* ("paste into Project Defeat → Build") is how WoWSims does it (UI.lua shows
its sim URL); keeping that text functional rather than promotional is an **interpretation**, not something
the policy spells out.

### D.2 Where to publish

**CurseForge** (support.curseforge.com, **sourced** from the article text):
- *Moderation Policies*: "CurseForge follows game developers EULA and ToS, and so should your projects";
  distinct name/avatar/summary/description; forks must credit and link the original and be allowed by its
  license; names in English and without game/version words; avatar 400×400 and not a solid colour; "External
  download links for files are not allowed"; "Files must include a change log describing the changes from the
  previous version"; donation/personal links only at the bottom of the description.
- *Project Submission Guide*: License — "Choose from a list of available licenses or write your own with
  'Custom'"; if forking/porting, "make sure the license of the original project allows it"; on conflicts
  "our moderation refers to the license as it appears in the CurseForge project page".
- *Creating and Submitting a Project*: the project awaits moderator approval; an uploaded file is "Under
  Review" and may be sent back for changes or rejected.
- The WoWSims exporter's CurseForge page shows MIT, v3.2.4 (2026-08-05), a "Classic TBC" flavour and ~2.37M
  downloads (**sourced** via a page fetch whose tool summarises — treat the numbers as approximate).

**Wago Addons** (Developer Agreement at addons.wago.io/agreements/developer-agreement, rendered in a browser,
**sourced**): account "connected to a verified Blizzard Entertainment account or GitHub account"; upload is a
zip "without any .exe file type or other malicious software"; an application "shall not have the effect or
purpose of collecting personally identifiable information of End Users"; no advertising "in its name, its
content, its functionality"; the developer warrants compliance with "all rules, requirements, policies, and
terms set forth by … Blizzard Entertainment"; the developer grants Wago a licence to host/distribute; an ad
revenue share is opt-in.

**GitHub Releases** — free and already where the code lives. WowUp's guide: *"In order for WowUp to be able to
install an addon from GitHub the author must have created a tagged release"* that contains *"a packaged zip
file"* (wowup.io/guide/get-addons/overview, **sourced**).

**Automation**: BigWigsMods/packager (what WoWSims uses in `.github/workflows/release.yml`) publishes one tag to
"CurseForge, WoWInterface, Wago, and GitHub (as a release)", reads `## X-Curse-Project-ID`, `## X-Wago-ID`,
`## X-WoWI-ID` from the TOC, and uploads every TOC interface value as a supported version (README, **sourced**).
For a single-file addon a manual zip is also fine.

**Licence prerequisite**: the Project Defeat repo currently has **no licence** (`gh api repos/josephevenson08/project-defeat`
→ `license: null`, **sourced**). CurseForge asks for one at submission, so the licence has to be chosen
before the addon is published (Open question 2).

### D.3 Reusing WoWSims code, and accepting the WoWSims format

**If any WoWSims code is copied or adapted** (exporter Lua, LibParse, or tbc-new's TypeScript importer): MIT
permits it, on the single condition quoted in A.4 — keep "the above copyright notice and this permission
notice" in the copy (e.g. a `THIRD-PARTY-NOTICES.md` plus a header comment in the adapted file), and on
CurseForge credit/link the original (Moderation Policies). **The recommended design copies nothing**: no Ace3,
no LibParse, a different export shape, and the site-side WoWSims parser is ~one mapping function written from
the format. Crediting WoWSims in the README is still good manners. (Not legal advice.)

**Accept the WoWSims exporter JSON as an additional import source? Recommendation: yes.**
- *Legally*: the exporter and both sims are MIT; the string is the player's own data produced by a tool they
  run; reading a JSON layout is interoperability and involves no copying of code. Low risk.
- *Practically*: a player who already has the exporter needs nothing new; it gives the owner an **independent
  second implementation** to cross-check the Project Defeat addon against (C.5 step 4); and it can ship
  **before any Lua exists** — the site-side converter is the same plumbing either way ("plumbing before data",
  HANDOFF item 3).
- *Caveats to design for*: the format is defined only by code and does change (TBC `random_suffix`, old vs new
  importers differ); `gear.items` is positional with `null` holes; `spec` strings don't map 1:1 (derive spec
  from talents instead); race needs `NightElf`/`BloodElf` mapping; professions can be silently empty (collapsed
  header) — which would make `dropIllegalEnchants` strip real ring enchants; it carries `name`/`realm`/GUID,
  which must be discarded; and its TOC currently says 20505 on a 20506 client (A.3).


## Proposed export format

**Shape (formatVersion 1):**

| Key | Type | Meaning |
|---|---|---|
| `format` | `"project-defeat-character"` | discriminator for the paste box |
| `formatVersion` | integer | 1; see B.2 |
| `addon` | string | addon version, for bug reports only |
| `client` | string | `GetBuildInfo()` version.build, for bug reports only |
| `level` | integer | `UnitLevel` |
| `race` | token | `UnitRace` 2nd return (`NightElf`, `Scourge`, …) |
| `class` | token | `UnitClass` 2nd return (`WARRIOR`, …) |
| `faction` | token | `UnitFactionGroup` (`Alliance`/`Horde`) |
| `professions` | `[{skillLine, rank}]` | primary professions only, SkillLine ids |
| `talents` | `[[talentID, tab, tier, column, rank], …]` | only ranks > 0; tab/tier/column are the API's 1-based values |
| `gear` | `[{slot, item, enchant?, gems?, suffix?}, …]` | `slot` = inventory slot id; `gems` positional, `0` = empty socket; keys omitted when empty |

No name, realm, GUID, guild, timestamps or free text.

**Complete example** — a Phase 2 Fury Warrior. Every item, enchant, gem and talent id is real: the gear is
`wowsims/tbc-new` `ui/specs/warrior/dps/gear_sets/p2_fury.gear.json` and the talents are its `FuryTalents`
string `3400502130201-05050005505012050115` (presets.ts:212-215), decoded against the repo's warrior trees
to 61 points / 19 talents; all ids resolve in the repo's catalogues (B.3). **Race and professions are
illustrative**, not taken from any source. 1,204 characters:

```
{"format":"project-defeat-character","formatVersion":1,"addon":"1.0.0","client":"2.5.6.69795","level":70,"race":"Orc","class":"WARRIOR","faction":"Horde","professions":[{"skillLine":164,"rank":375},{"skillLine":186,"rank":375}],"talents":[[124,1,1,1,3],[130,1,1,2,4],[641,1,2,2,5],[131,1,3,1,2],[137,1,3,2,1],[121,1,3,3,3],[662,1,4,3,2],[133,1,5,2,1],[157,2,1,3,5],[159,2,2,3,5],[154,2,3,4,5],[1581,2,4,1,5],[155,2,4,3,5],[165,2,5,2,1],[1543,2,5,4,2],[156,2,6,3,5],[167,2,7,2,1],[1655,2,7,3,1],[1658,2,8,3,5]],"gear":[{"slot":1,"item":30120,"enchant":3003,"gems":[32409,30546]},{"slot":2,"item":30022},{"slot":3,"item":30122,"enchant":2986,"gems":[30582,24027]},{"slot":15,"item":24259,"enchant":368,"gems":[24027]},{"slot":5,"item":30118,"enchant":2661,"gems":[30584,30602,28362]},{"slot":9,"item":30057,"enchant":2647,"gems":[24027]},{"slot":10,"item":30119,"enchant":684},{"slot":6,"item":30106,"gems":[28119,28363]},{"slot":7,"item":29995,"enchant":3012},{"slot":8,"item":30081,"enchant":2939},{"slot":11,"item":29997},{"slot":12,"item":28757},{"slot":13,"item":21670},{"slot":14,"item":28830},{"slot":16,"item":28439,"enchant":2673},{"slot":17,"item":30082,"enchant":2673},{"slot":18,"item":30105}]}
```

What the site should make of it (script-checked against the repo JSON): Head = Destroyer Battle-Helm +
Glyph of Ferocity (3003) + Relentless Earthstorm Diamond / Sovereign Tanzanite; … Off Hand = Talon of Azshara
(a `One Hand` sword, so legal in the off hand) + Mongoose (2673, whose `allowedSlots` include Off Hand);
slot 18 → `Ranged` (Warrior) = Serpent Spine Longbow. Spec inferred: Fury (tab 2 has 40 points vs 21 in Arms — a 21/40/0 build; script-computed).
Professions → `['Blacksmithing', 'Mining']`.

For comparison, the WoWSims exporter's JSON for the same gear is ~820 characters (its talents are one digit
string) **plus** `name`, `realm` and the character GUID.

## Field mapping table

WoW API → export field → `SavedBuild`/`BuildState` field, with the gap or risk for each. "Converter" = the new
`addonExport → SavedBuild` function that runs before `validateBuild`.

| WoW API (2.5.6) | Export field | SavedBuild / BuildState | Gap / risk |
|---|---|---|---|
| addon constant | `format`, `formatVersion` | (selects parser) | Unknown higher version → refuse with a sentence. |
| `GetBuildInfo()` | `client` | — (not stored) | Debug only. |
| `UnitLevel("player")` | `level` | — (no level in BuildState) | Warn below 70; talent budget = level − 9. |
| `UnitRace` 2nd return | `race` | `character.race` | Map `NightElf`/`BloodElf`/`Scourge` to repo names. |
| `UnitClass` 2nd return | `class` | `character.className` | Title-case token. |
| `UnitFactionGroup` | `faction` | `character.faction` | Check against `racesByFaction`; derivable from race anyway. |
| derived from talents | — | `character.spec` (**required**) | Game has no spec: tree with most points → `trees[i].spec`. Ties / 0 points / healer or tank result need a rule (Open questions). |
| `GetSkillLineInfo` + `GetTradeSkillDisplayName` | `professions[].skillLine/rank` | `character.professions` (names, ≤ 2, primary only) | Collapsed headers (use `ExpandSkillHeader(0)`); non-English name mapping **unverified**; rank not stored. Missing Enchanting silently strips ring enchants via `dropIllegalEnchants`. |
| `C_SpecializationInfo.GetTalentInfo(...)` `.talentID/.rank` | `talents[i][0]`, `talents[i][4]` | `talentPoints[talentID] = rank` | repo id = Talent.db2 id (579/579 cross-checked); API `talentID` = that id **unverified in-game** → fall back to tab/tier/column. |
| same, `.tier/.column` + tab index | `talents[i][1..3]` | (fallback key: repo `row = tier-1`, `column = column-1`, tree = tab-1) | Tab order = TalentTab.OrderIndex = repo tree order (27/27). |
| `GetInventoryItemLink(slot)` | `gear[].slot` | `gear[GearSlot]` | 18 → `Relic` (Druid/Paladin/Shaman) else `Ranged`; skip 0/4/19; converter must check `isItemCompatibleWithGearSlot` (validateBuild doesn't); write an explicit empty placeholder for empty slots. |
| item link field 1 | `gear[].item` | `gear[slot].itemId` = `getItemByWowItemId(id).id` | Not in catalogue → empty + issue. Curated role/spec tags make `validateBuild` drop worn items (e.g. `destroyer-legguards-tank`, 30116, `allowedSpecs: ['Protection']`). Phase > 2 → dropped with the existing message. Empty off hand gets **refilled** by `normalizeGearForCharacter` unless import opts out. |
| item link field 2 | `gear[].enchant` | `gear[slot].enchantId` = enchant with `effectId == id` and `(allowedSlots ?? [slot])` ∋ slot | Same id on several slots (2564/2649/2648); 15 supplement enchants have no SpellItemEnchantment id; 4 of them duplicate ingested ones and are the BiS-recommended slugs; `effectIds` mixes spell ids. |
| item link fields 3–5 | `gear[].gems` | `gear[slot].gemIds` = gem with `wowItemId == id`, positional, `''` for empty | 47 client gem items not in the catalogue; `null` would void the array (`isStringArray`); more gems than catalogue sockets → issue. |
| item link field 7 | `gear[].suffix` | — (not representable) | Keep base item + issue "random-suffix stats not modelled". |
| — | — | `activeBuffIds`, `activeConsumableIds`, `activeTargetDebuffIds` = `[]` | Not character state; temporary weapon enchants never appear in links. |
| — | — | `target` = `defaultSimulationTarget` | — |
| — | — | `savedAt` = import time; `version` = `BUILD_FORMAT_VERSION` | — |

WoWSims interop column-for-column: `class` (lower-case token) → `className`; `race` (with `Undead`,
`NightElf`, `BloodElf`) → `race`; faction from race; `talents` digit string → repo tree file order →
`talentPoints`; `professions[].name` (English) → `professions`; `gear.items[i]` (17 positions, `null` = empty;
index 16 = ranged/relic) → slot by index, then `id`/`enchant`/`gems`/`random_suffix` exactly as above;
`name`/`realm`/`id`/`unit`/`version`/`level`/`spec` → ignored (level only for a warning).

## Open questions for the owner

1. **Sequencing.** Ship the site-side importer for the WoWSims exporter JSON first (no Lua, usable today by
   anyone who has that addon, and a real-data test bed), then the Project Defeat addon? Or addon first?
2. **Licence** for the site repo and the addon (the repo has none; CurseForge asks at submission). MIT would
   match wowsims and keep the wowsims-derived parts simple.
3. **Where to publish**: CurseForge (account + moderation), Wago (Blizzard- or GitHub-linked account), or
   GitHub Releases only for v1? And does the addon live in the site repo or its own repo (affects packaging)?
4. **Spec inference**: take the tree with the most points automatically? What on a tie or 0 points? What if the
   result is a healer or tank spec, given the sim is DPS-only — import for Gear/Talents anyway, or refuse?
5. **Worn items that fail curated role/spec tags** (e.g. a Protection-tagged item on a Fury warrior): keep with
   a warning (recommended for imports), or drop as `validateBuild` does for pasted builds today?
6. **Empty off hand**: should the import opt out of `normalizeGearForCharacter`'s off-hand refill (recommended),
   so an imported character never shows an item it isn't wearing?
7. **Phase gate**: keep dropping Phase 3+ items on import (current rule), or import them flagged once real
   realms move past Phase 2?
8. **Enchant data cleanup before import compares against BiS**: merge the four duplicate supplement enchants
   into their ingested twins (or compare by SpellItemEnchantment id), add SpellItemEnchantment ids to the other
   supplement entries, and split `effectIds` (spell ids) from `effectId` — all via the ingest tools?
9. **Professions**: when an import shows ring enchants but no Enchanting (possible with WoWSims exports whose
   Skills header was collapsed), infer Enchanting (WoWSims does this for inspected players) or drop the ring
   enchants as the app does now? Store profession levels at all (the repo stores names only)?
10. **Addon UX**: slash command only (`/pdexport`), or also a character-sheet button? Name for CurseForge (English,
    no game or version words)?
11. **SavedVariables "upload a file" path** — wanted later, or copy/paste only?
12. **Talent encoding in the export**: ids + tab/tier/column (proposed, robust and debuggable) or ids only
    (≈115 characters shorter)?

## Risks

| Risk | How it would show up | Mitigation |
|---|---|---|
| API `talentID` ≠ Talent.db2 id (the one unverified link in the talent chain) | Talent import fails validation or lands on wrong talents | Export tab/tier/column too; converter cross-checks id against position; owner's one-time `/dump` (C.5) |
| A client patch changes APIs (on 2.5.6 `GetTalentInfo`, `GetItemGem`, `GetItemInfo` etc. already exist only as deprecation fallbacks; when that happened is not established here) | Lua error on `/pdexport`, or empty talents/gems | Use the `C_` APIs; feature-detect; `client` field in every export pinpoints the build in bug reports |
| TOC interface falls behind a patch (WoWSims is already one behind) | Addon marked out of date and not loaded while the client's version check is on; an "addons out of date" dialog at character select | Bump `## Interface` per patch; list previous + current values |
| Gem link fields not item ids after all | Every gem reported unknown (loud, not silent) | Owner `/dump` check; ingest a SpellItemEnchantment→gem table so either id form resolves (no numeric collisions in 2.5.6 data) |
| Duplicate enchant slugs vs BiS recommendations | "Missing vs BiS" says Superior Agility / Sunfire / Soulfrost / Spell Penetration is missing when it is equipped | Fix data first (Open question 8) |
| `validateBuild` role/spec gating | Real worn items dropped with "isn't legal for a …" | Import-specific legality (class proficiency + slot), warnings instead of drops |
| Off-hand refill in `normalizeGearForCharacter` | Imported character shown with an off-hand item it doesn't own | Opt-out for imports |
| Catalogue coverage (47 client gems, armor kits, levelling items, anything wowsims never listed) | Issue list entries; stats lower than the character sheet | Accept and report; the issue list is the product here |
| Catalogue is pinned to `wowsims/tbc@3301fca`, which wowsims now marks outdated (warning bar linking to tbc-new since 2026-07-24) | New ids fixed upstream in tbc-new never reach the catalogue | Consider re-pointing ingest to tbc-new later (out of scope here) |
| Professions read wrong (collapsed header, non-English client) | No professions → ring enchants stripped by `dropIllegalEnchants` | `ExpandSkillHeader(0)`; localized-name map via `GetTradeSkillDisplayName`; report "no professions found" |
| WoWSims format drift | Interop import breaks for WoWSims users | Fixture tests from a real export; tolerant parser (ignore unknown keys, treat `null` as empty) |
| Privacy regression (someone later adds `name` "for convenience") | Names in share links / localStorage | Test that asserts the exact key set of the export and that WoWSims `name/realm/id` never reach a `SavedBuild` |
| Link colour-code change (`\|cnIQx` since 11.1.5 lineage) | Naive offset-based parsing yields garbage ids | Parse from the `\|Hitem:` marker |
| EditBox size | Truncated paste | Export is ~1.2 KB; Blizzard's own scroll input uses `maxLetters = 0`; absolute cap unverified but far away |
| Distribution friction | CurseForge moderation asks for changes (name, avatar, licence, changelog) | Prepare 400×400 logo, English name, licence, changelog before submitting |
| Blizzard policy #8 (may disable functionality) | An API stops returning data | Read-only, out-of-combat character-sheet data; low exposure |

## Sources

Repo (local checkout, read-only): `src/domain/builds/{buildTypes,buildSerialization,shareLink}.ts`;
`src/domain/gear/{itemTypes,itemCatalogue,gearSlots,slotCompatibility,slotVisibility,characterItemRules,obtainability}.ts`,
`itemCatalogue.json`, `itemSupplement.json`, `sampleItems.ts`; `src/domain/enchants/{enchantTypes,sampleEnchants}.ts`,
`enchantCatalogue.json`, `enchantSupplement.json`; `src/domain/gems/{gemTypes,sampleGems}.ts`, `gemCatalogue.json`;
`src/domain/talents/{talentTypes,sampleTalents}.ts`, `*Talents.json`, `talentBuilds.json`;
`src/domain/character/{characterTypes,tbcClasses,races}.ts`; `src/domain/professions/{characterProfessions,professionTypes}.ts`;
`src/domain/bis/{bisRankings,bisRecommendations}.json`; `src/features/builds/BuildPanel.tsx`; `src/App.tsx`;
`ROADMAP.md` (Phase 6), `HANDOFF.md` (open item 3).

| URL | What was verified there |
|---|---|
| https://github.com/wowsims/exporter (@ad9e903, tag v3.2.4) — `WowSimsExporter.toc`, `WowSimsExporter.lua`, `Shared.lua`, `Conditional_TBC.lua`, `extras.lua`, `ExportStructures/{Character,EquipmentSpec,ItemSpec,Misc}.lua`, `UI.lua`, `SavedDataManager.lua`, `.pkgmeta`, `embeds.xml`, `.github/workflows/release.yml`, `LICENSE`, `README.md` | Export fields, API calls, talent ordering, gem/enchant handling, EditBox copy pattern, SavedVariables auto-save, TOC 20505, MIT licence, packager use |
| GitHub API: wowsims org repo list; exporter commits/tags/releases | TBC support since v3.2.0 (2026-02-23); v3.2.4 2026-08-05; tbc-new homepage wowsims.com/tbc |
| https://github.com/wowsims/tbc (@3301fca) — `ui/core/components/importers.ts`, `ui/core/sim.ts`, `ui/core/outdated_sim.ts`, `proto/common.proto`, `sim/core/items/all_enchants.go`, `sim/warrior/dps/presets.go`, `LICENSE` | Old addon importer, `getEnchantFlexible`, Enchant `id`/`effect_id`/`is_spell_id` semantics, outdated redirect, MIT |
| https://github.com/wowsims/tbc-new (@a4768c9) — `ui/features/import-export/importers/{addon,addon.test,finish_individual_import}.ts`, `ui/sim/proto/database.ts`, `ui/features/talents/model/talents_string.ts`, `ui/sim/talents/trees/*.json`, `ui/specs/warrior/dps/{presets.ts,gear_sets/p2_fury.gear.json}`, `proto/common.proto`, `LICENSE` | Current addon importer, slot-aware enchant lookup, gem lookup by item id, talent-string rule, talent-tree order (matched repo 27/27), example gear/talents, MIT |
| https://github.com/generalwrex/wowsimsexporter — `Libs/LibParse/LibParse.lua` | LibParse array/null/`[]` encoding (vendored copy) |
| https://github.com/WeakAuras/WeakAuras2 — `WeakAuras/WeakAuras_TBC.toc`, `WeakAuras/Types_TBC.lua` (commit `9f40140342`), `WeakAuras/Compatibility.lua`, `WeakAuras/Prototypes.lua` | TBC interface 20506; in-game talent index order = ascending talent id per tab (579/579); WeakAuras re-implements `GetTalentInfo` over `C_SpecializationInfo.GetTalentInfo` on Classic/TBC rather than rely on the deprecation fallback |
| https://github.com/Gethe/wow-ui-source/tree/classic_anniversary (@1463c68627, `version.txt` 2.5.6.69795) — `Blizzard_APIDocumentationGenerated/{SpecializationInfo,SpecializationShared,Item,TradeSkillUI,Unit,SimpleEditBoxAPI,Os}Documentation.lua`; `Blizzard_DeprecatedSpecialization/Deprecated_Specialization_TBC.lua` + `.toc`; `Blizzard_DeprecatedItemScript/Deprecated_ItemScript.lua` + `.toc`; `Blizzard_TalentUI/Classic/Blizzard_TalentUI.lua`; `Blizzard_FrameXML/Vanilla/TalentFrameBase.lua`, `Classic/TalentFrameBase_Shared.lua`, `Blizzard_FrameXML_TBC.toc`; `Blizzard_CharacterFrame/TBC/PaperDollFrame.lua`; `Blizzard_UIPanels_Game/Classic/SkillFrame.{lua,xml}`; `Blizzard_AddOnList/AddonList.lua`; `Blizzard_SharedXML/{UI.xsd,SecureUIPanelTemplates.xml/.lua,SecureScrollTemplates.xml,Backdrop.xml,Shared/Scroll/ScrollTemplates.xml}`, `Blizzard_UIPanelTemplates/Classic/UIPanelTemplates.xml` | Every 2.5.6 API signature in C.2; deprecation fallbacks and the CVar gate; talent enumeration by tier/column; relic in slot 18; skill-line APIs; clipboard restriction; EditBox defaults; template availability |
| https://wago.tools/api/builds and `https://wago.tools/db2/{Talent,TalentTab,SpellItemEnchantment,SpellEffect,ItemEffect,ChrRaces,ChrClasses,SkillLine}/csv?build=2.5.6.69795` | Current build list; 579/579 talent match; enchant ids and names; spell/item → enchant resolution; gem item ↔ enchant table; race/class tokens; profession SkillLine ids |
| https://warcraft.wiki.gg/wiki/TOC_format (raw) and `Template:LatestPatchInfo` (raw) | Interface 20506 / 2.5.6 / build 69795; `_TBC.toc`, `-BCC` dropped in 2.5.5; `AllowLoadGameType`; 1024-char lines; out-of-date rule; `_anniversary_` alias |
| https://warcraft.wiki.gg/wiki/ItemLink (raw) | Link payload field order; enchant = SpellItemEnchantment; gems by item id; suffix ids; `\|cnIQx` change; temporary enchants absent |
| warcraft.wiki.gg `API:GetTalentInfo/Classic`, `API:GetTalentInfo`, `API:C_SpecializationInfo.GetTalentInfo`, `API:GetSkillLineInfo`, `API:GetNumSkillLines`, `API:ExpandSkillHeader`, `API:GetInventoryItemLink`, `InventorySlotID`, `API:UnitRace`, `RaceID`, `ClassID`, `API:GetItemGem`, `API:CopyToClipboard`, `API:EditBox_HighlightText`, `API:EditBox_SetMaxLetters`, `UIOBJECT_EditBox`, `CVar_loadDeprecationFallbacks`, `Saving_variables_between_game_sessions`, `Creating_a_slash_command`, `Lua` (all via `?action=raw`) | Index≠position note; skill-line semantics; slot ids; race/class tokens; GetItemGem deprecation; CopyToClipboard protected; CVar default; SavedVariables write timing and paths; slash-command pattern; Lua 5.1 subset |
| https://us.forums.blizzard.com/en/wow/t/ui-add-on-development-policy/24534 (raw `/en/wow/raw/24534`) | Full policy text (8 rules) |
| https://support.curseforge.com/en/support/solutions/articles/9000197279-moderation-policies | Moderation rules quoted in D.2 |
| https://support.curseforge.com/support/solutions/articles/9000199552-project-submission-guide-and-tips | Licence field and fork rule |
| https://support.curseforge.com/support/solutions/articles/9000197241-creating-and-submitting-a-project | Licence dropdown; review/"Under Review" flow |
| https://www.curseforge.com/wow/addons/wowsimsexporter | MIT, v3.2.4, Classic TBC flavour, ~2.37M downloads (tool-summarised) |
| https://addons.wago.io/agreements/developer-agreement (rendered in browser) | Developer obligations quoted in D.2 |
| https://wowup.io/guide/get-addons/overview | GitHub install needs a tagged release with a packaged zip |
| https://github.com/BigWigsMods/packager (README) | Targets CurseForge/WoWInterface/Wago/GitHub; TOC ids; interface values uploaded as versions |
| https://github.com/SafeteeWoW/LibDeflate (`LibDeflate.lua`, repo metadata) | Zlib licence, 3,605 lines, raw/zlib APIs |
| GitHub API `repos/josephevenson08/project-defeat` | Repo licence is null |

Could not verify: the absolute EditBox length cap; whether the addon version check (which blocks out-of-date
addons until the player opts in) is on by default on 2.5.6;
that `GetTradeSkillDisplayName` output matches `GetSkillLineInfo` names in non-English locales; that the API's
`talentID` equals the Talent.db2 id (strongly indicated); that the WowAce-packaged LibParse equals the vendored
copy; which of the 47 uncatalogued client gems are obtainable; whether a newer formal version of Blizzard's addon
policy exists.
