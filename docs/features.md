# Features

The full, detailed feature list for Project Defeat. The [README](../README.md) has the short version.

Figures quoted here (item counts, icon counts, spawn coordinates) are checked against the live data by
a test in `tests/planner.spec.ts`, so if one drifts the suite fails.

## Current Status

Working planner, targeting **TBC Phase 2** (SSC/Tempest Keep, Tier 5, with all of P1 raids/gear available) and only Phase 2. The gear
catalogue, BiS rankings, talents, enchants, gems, buffs, raids and professions are all real and sourced. The profession maps show the zones as they were in TBC (since 2026-10-13); the route algorithm is new since 2026-10-14 and the gathering nodes are being reworked ([`MAPS-PLAN.md`](design/MAPS-PLAN.md)). The node refresh is researched and its ingest ready, but waits on a data source since Wowhead began refusing scripted requests; the guides' text was corrected meanwhile (Winterspring has no Dreamfoil, every starting zone grows the first three herbs, why Ragveil has no map).

**This project is for DPS.** Healer and tank maths still exist, still run and are still tested, but
neither is somewhere effort is spent and neither is put on screen as a headline. The Simulation tab
is shown for the **20 DPS specs** and hidden for the 5 Healer and 2 Tank ones — see
`src/featureFlags.ts`, which states exactly what is and is not modelled, and carries an assertion
behind every claim of its that quotes a number.

## Current Features

- TBC class/spec selection for all nine TBC classes
- Faction-aware race selection with real TBC race/class legality (e.g. Human can't be a Shaman, Blood Elf can't be a Warrior), every row checked against sources and pinned in a test. That check found the app refusing **Draenei Mage**, which TBC allowed from launch
- 28 racial traits applied to your stats, including the weapon-conditional ones and the Draenei hit aura, which is melee hit for Warriors, Paladins and Hunters and spell hit for Mages, Priests and Shamans
- Full TBC-style gear slot model
- **The look is the Step 2 prototypes'** (brought in from 2026-10-12, `docs/design/PORT-PLAN.md`):
  dark glass panels over a still backdrop, Marcellus headings and Figtree text, and a colour per
  tab: Home and Raids teal, Character Planner sky blue, Simulation gold over violet, Raid Composition
  warm gold, Spec Tier Lists emerald, Professions amber. The front door's cards wear the colour of
  the tab behind them. Every screen's top bar says which game and phase its numbers are for. Item
  quality is still the only colour the app assigns to data it did not choose, and every ink clears
  WCAG AA on the glass it lands on. The three typefaces are vendored latin-subset in `public/fonts`
  with their licences (64 KB, no third-party request). Faction no longer recolours the page
- **Phase 2 and only Phase 2.** 
- Source/farming metadata fields for gear, including instance, boss, vendor, reputation, crafting profession, and notes
- Crafted items can show full recipe detail: required profession skill level, specialization, where the recipe/pattern is obtained, and each material's own farm/source location
- Spec-aware starter filtering for gear, relics, and enchants across every class (legal weapon types per class, dual-wield vs. single-weapon rules, class-appropriate relic type)
- Spec-aware gear slot visibility for every class, including the Totem/Libram/Idol relic display for Shaman/Paladin/Druid and the hidden Ranged-vs-Relic slot swap
- 212 gems and 91 enchants, ingested and validated, with per-spec gem and enchant recommendations from Wowhead
- Calculated stat totals from base stats, gear, gems, socket bonuses, and enchants
- **Simulation tab** (the decided design, ported 2026-10-17): **"What to do next"** for the
  character you made, always current, with no Run button. First **your stat priority** ("Gem and
  enchant for Strength, then Crit Rating, then Attack Power"), from re-running the model with each
  stat nudged, with stats the engine does not read yet named as unknown rather than zero. Then **your
  best upgrades**: every legal item in the catalogue simulated as a straight swap with the best
  colour-matched gems, best first, two at most per slot, each with Equip, which applies exactly the
  gems and enchant the score assumed. Then **the estimate, and how far to trust it**: the number
  against what players of your spec average on archon.gg ("5.66× below what Fury warriors average"),
  what it misses for your spec and your talents, where the damage comes from (a log-style table that
  sums to the estimate), how it was computed, and every DPS spec's best case by this model against
  the logs, yours marked (1.05× to 2.13× low, computed). A missing weapon is said first, before
  anything else. The page names its fixed encounter and what the model does and does not cover, with
  every figure in that list computed. DPS specs only; Healer and Tank results (estimated healing,
  effective health) are still computed and reachable with `?simulation=1`
- **Raids tab** (the decided design, ported 2026-10-13): all five Phase 1/2 raids, picked from the
  tab's own header, which takes each raid's colour (Serpentshrine teal, Tempest Keep gold over violet,
  the Phase 1 raids torchlight). **The boss journal** shows one boss at a time, like the game's
  Adventure Guide: the raid's bosses down the side with their art where it exists (Karazhan bar
  Nightbane, Gruul's Lair, Magtheridon; the rest show their number and the raid's own art), the boss's
  loot as icons in quality frames with game-style tooltips, and **"Loot for" any of the 27 specs**,
  which puts that spec's picks first with their rank on its Wowhead Phase 2 list (your spec by
  default once you have made a character). "The fight" holds the mechanics and per-role callouts;
  "About the raid" holds the facts, the way in and the step-by-step attunement chains for Karazhan,
  Serpentshrine Cavern and Tempest Keep. **"For my raid"** shows who in the raid you saved on Raid
  Composition (or a clearly labelled example raid until you have one) wants each drop, most wanted
  first, a drop three or more raiders rank first marked contested, and a tier token counted through
  the set pieces it buys; press a raider for their wishlist. **A search** finds any drop across all
  five raids and opens it where it drops. **All five raids' tables are complete**: 467 drops across
  twenty-four encounters plus notable trash, read from
  Wowhead's own drop data by `tools/ingest/ingest-raid-loot.mjs` rather than curated by hand, so every
  row carries a real item id and the ingest re-runs. 344 resolve to a catalogued item; the other 123
  are 80 recipes, 30 tier tokens, and a handful of quest items and mounts — real drops that are not
  equippable gear, each flagged and saying so rather than rendering as an item with nothing on it.
  The merge is a **union**, because a boss's drop table cannot see the tier set pieces a token is
  traded for, the quest rewards an encounter hands out, or Kael'thas's seven encounter weapons — 32
  curated Tempest Keep rows a replace would have deleted
- **The Ranked Gear tab** (the decided design, ported 2026-10-18): Wowhead's Phase 2 order for your
  own spec, **slot by slot**. Pick a slot from your gear (each shows what you wear) and its ranked items
  stand in order as game-style tooltips with the guide's note ("Best", "P1 BiS"), fitted out with the
  guide's enchant for the slot and its gem for each socket colour, with where each drops, what it costs
  to make or buy, and Equip, which puts on exactly what the card shows. What you wear is marked, and
  shown first when the list does not rank it. Rings and trinkets share one list, and a unique one cannot
  go in both. **"Where it drops"**, behind a switch whose count is the upgrades left, lists every item
  once (a one-hander ranked for both hands is one row naming both), grouped by raid with the bosses in
  kill order and this tier's raids first, then world bosses, crafting and everything else, each said in
  the guide's words. Tier pieces sit under the boss whose token buys them, even where the loot tables
  list only the token. What you wear is ticked, anything ranked above it is an upgrade, "Only upgrades"
  hides the rest, and each row's tooltip shows the item fitted out. All 27 specs; the three slots a
  guide leaves empty (a Feral Druid's and a Retribution Paladin's off hand, a Holy Paladin's Libram)
  say so
- **The Gear tab** (the decided design, ported 2026-10-19): your gear as **the game's character
  sheet**, armour down the left, jewellery down the right, weapons along the bottom, each slot the
  game's icon frame with its item level, its gems as coloured dots and its enchant (or "no enchant"
  where the guide puts one), and a game-style tooltip on hover or focus with its rank on your spec's
  list and where it drops. The middle holds the character and its tier set pieces, **what the gear
  alone adds** (the same sum the stat bar uses), **the hit cap in plain words** ("Hit 140 / 95, 45
  over the cap" for a Fury Warrior with Precision, with what talents, race, buffs and Improved Faerie Fire on the boss already give,
  from the simulator's own tables, for every spec: special attacks, ranged attacks or spells by role,
  none for a healer), and four counts (slots best on Wowhead's list, enchants, sockets, socket
  bonuses) that open **"What's left"**: a summary, then every slot marked done or with what it still
  needs, each with a one-press fix (equip the best, add the guide's enchant, fill the gems the guide's
  way), "Only what's left", and the same targets **grouped by raid and boss in kill order** to plan a
  raid night. A guide that gems against a socket bonus on purpose (a Protection Warrior's) is not
  flagged. Pressing a slot opens the slot pane beside the sheet, with every legal item, the
  profession-gated enchants and the gem pickers. Equip the recommended set, Empty every slot, and
  Import your character sit above it. Every spec, with its own 16 to 18 slots and its own list
- Where every ranked pick comes from: instance, the actual boss where a loot table names one, the
  profession that crafts it, or the vendor and currency. **503 of the 557 recommended items (90.3%)**
  can say, and 720 of the 1,427 rows name an encounter. This is a join across the guides' own Source
  column, the raid loot tables and the item catalogue rather than a new dataset — and it stops at
  *where*. **The cost half landed 2026-09-13**: 117 of the 119 crafted and bought picks now carry a
  price — reagents from Wowhead's `created-by-spell` data, vendor prices from `sold-by`, so a robe
  reads "15x Primal Fire" and a trinket reads "41x Badge of Justice" on the row that recommends it.
  The two that do not are the Violet Signet rings, which no vendor sells
- **Spec Tier Lists section** (the decided design, ported 2026-10-12): Wowhead's Phase 2 DPS, healer and
  tank rankings as a board of spec icons in class colours, 28 placements covering all 27 specs, with
  your spec marked on every list it appears on. Press any spec for its card: its place on every list,
  archon.gg's observed DPS and tier, what it brings to a raid (the same counting Raid Composition uses),
  its signature ability, and how many of it are in your saved raid. A switch shows Wowhead's tiers
  against the logs for the 20 damage specs (they agree on 9), sortable either way. Tier letters and
  membership only — Wowhead's analysis prose is not reproduced, and each list links back to its page.
  These rank *specs*, not items, so they deliberately do not feed the per-slot BiS rankings
- **Raid Composition section** (the decided design, ported 2026-10-17): a planning table for a 10 or
  25-player raid, five groups of five. **Most raid buffs reach only the caster's group in TBC**
  (totems, auras and shouts); every scope is read from the spell's own Wowhead tooltip. Gift of the
  Wild, Fortitude, Arcane Brilliance and Prayer of Spirit reach any group, one cast each, and Heroism
  is raid-wide on Anniversary realms; the page's opening counts and names these from the data. Shaman
  totems come from the spec that runs them (Enhancement: Strength of Earth, Grace of Air, Windfury).
  **A click-to-fill palette** of all 29 builds with their spec icons seats each in the next open seat,
  group 1 first, or in a group you aim at by pressing its name. Each group shows a ring of how many of
  the 18 party buffs it receives and the buffs themselves as icons with hover cards. **Two ways to move
  a player** (press Move and then the seat you want, or drag), with taken seats swapping; a pencil for
  each player's name; Remove, 10-player and Clear each offer **Undo**; and **the example roster**
  (real builds, invented seating), labelled as the example and as edited once a seat moves. Under the
  table: role balance, **what one more seat would add** to each group with a one-press seat, **what is
  missing and who fixes it** ("any Shaman", "an Elemental Shaman"), and the raid-wide, single-target
  and boss coverage with each buff's reach tagged. The roster is kept in the browser, a hover card on
  each seat lists everything that player brings, and a **PNG export** of the seating chart, with an
  optional title, date, start time, zone and description, is for pasting into Discord. **Counts follow
  Wowhead's raid-composition tool**: they say who *could* cast a buff rather than what will be up at
  once, so one Paladin lights up every Greater Blessing where in the game they hold one. That is stated
  on the screen; the exclusivity rule itself (one Blessing and one aura per Paladin, one totem per
  element, one shout per Warrior) is still sourced and tested in `buffExclusivity.ts`
- **The Buffs tab** (the decided design, ported 2026-10-19): your buffs **filled in from who is in your
  raid**. Pick the raid (the roster on Raid Composition, an example 25-man or 10-man, or just you) and
  press a seat to sit there; every buff and boss debuff then sits under how far it reaches (from your
  group, from the raid, on the boss) or under **Missing**, which says what each needs ("needs an
  Enhancement Shaman in your group") or who is busy ("whoever could give it is already giving Windfury
  Totem"): one aura per Paladin, one air totem per Shaman and one shout per Warrior, from
  `buffExclusivity.ts`. **The raid's Paladins each give the Blessing you assign**, Kings first and then
  your role's (Might for melee and tanks, Wisdom for casters and healers); a Blessing another Paladin
  gives swaps. The buffs are design A's icon tiles with game-style tooltips, and any can still be
  switched by hand, marked "by hand" until you choose the raid again. "By hand" drops the raid
  altogether, and the tab opens there with nothing on, as the app starts clean. Consumables take one
  slot each (flask, battle elixir, guardian elixir, food); a flask takes both elixir slots. Buffs the
  simulator does not count are shown crossed out and say why. For every spec: the buffs and
  consumables listed are your role's
- Planner split into six sub-tabs (Gear / Compare / Talents / Buffs & Consumables / Ranked Gear /
  Build) rather than one ~15-screen scroll column, under a character line and a sticky stat bar that
  stay put across all six
- **The stat bar is the only place a number appears twice — which is to say, nowhere.** Six totals
  for the role sit on one line; the full table opens under it and the six are not repeated above it.
  Scoped to the spec, so a Fury Warrior sees 12 rows rather than 26, with a "show all" toggle that
  restores every stat — attributes and armor are never hidden
- **The Talents tab** (the decided design, ported 2026-10-22): **the game's talent window** for all
  nine classes (579 talents across 27 trees, ingested from Wowhead's TBC talent calculator). Three
  trees side by side, each on a dark ground with its spec's icon behind it (one at a time on a phone,
  with tree tabs); each talent its real icon with its rank, gold when full, green when it holds or can
  take a point, grey when locked, with an arrow from each prerequisite. Click learns a point and
  right-click unlearns one; where the game would refuse, the tab says why ("Needs 10 points in
  Protection", "Bloodthirst needs Sweeping Strikes at 1/1"). A game-style tooltip on hover or focus,
  and the chosen talent's tooltip under the frame with − and +, each saying what the simulator reads
  from it ("In the simulation: +20% attack speed for 3 swings after a crit") or why it does not. Each
  tree is one tab stop, moved around with the arrow keys, Home and End; Enter or + learns, − or Delete
  unlearns. Points left and the split ("9 / 39 / 0") at the top, with **the hit cap as Precision and
  its kin move it** ("Hit 140 / 95, 45 over the cap"). It opens untalented; **"Load the <spec>
  preset"** puts in wowsims' preset where it has one (17 builds), as stored, and **"What's off"** lists
  every rule a build breaks with a one-press fix ("Add Enrage to 5/5") or "Show where", which lights
  the talents that can take a point toward a short row, then the points left unspent
- Real item icons on the character sheet, the ranked-gear rows and the raid loot tables. Icon names are
  ingested from the same pinned wowsims commit as the item catalogue; the artwork is vendored into
  `public/icons/` (1,972 files, 3.4 MB) so the app keeps working offline and makes no runtime network
  calls. Entries with no catalogued item fall back to the two-letter slot glyph
- **A page per profession, laid out the way a levelling guide reads** — pick from a grid of thirteen,
  and each one opens on its own progression: a skill range, what you gather or craft in it, and the
  trainer visit that gates the next one. There is no skill-tier table; training requirements are
  markers placed at the skill where the bar stops moving
- **Crafting paths that are computed rather than copied** — 2,079 TBC recipes ingested for their
  reagents and their orange/yellow/green/grey breakpoints, from which all nine crafting professions
  get a path from their first recipe to 375: what to make, how many, and the shopping list. The craft
  counts are derived from the skill-up curve, not taken from anyone's guide, and the page prints the
  model it used. Reagents a vendor is the only source for — thread, dye, vials, flux — are counted as
  bought rather than farmed and priced at their fixed vendor cost, so a step separates its shopping
  list from its farming list
- **Every profession page opens with a table of the whole climb**, with each trainer stop written into
  the row it falls in — the moment a player needs "Expert is trainable at 125" is the moment their bar
  stops at 125, which a five-row tier table at the top of the page is three screens away from. The
  gathering and crafting tables read the same placement function, so they cannot disagree about where
  you stop
- **A levelling guide for each of the four gathering professions** — guidance, then that
  table, then the ranges themselves with a map each. The unit is a skill range rather than a material, which is the change that makes Gold
  read correctly: Gold Veins sit in Iron's zones and you pick them up on the Iron lap, so Gold is one
  of the ores the 125-175 range draws rather than a section describing a trip nobody takes. Which
  nodes a range covers is derived from each node's skill requirement, so no range can offer an ore you
  cannot mine yet and a re-ingest moves a node to the right section on its own. Every claim in the
  prose was checked against at least two published guides plus our own ingest, and each range prints
  what it was checked against
- **Farming route maps for Herbalism and Mining** — 45 gathering nodes and 14,091 real spawn
  coordinates from Wowhead, covering the whole 1-375 climb. A skill range gets one map per zone,
  merging every material farmed in that range, because that is how a range is farmed — at 1-70 you
  are picking Peacebloom, Silverleaf and Earthroot on the same lap. Zones are tabs rather than stacked
  maps, ordered by the range's recommendation rather than by spawn count — Silver's busiest zones are
  level 30-40 and a player mining Silver is around level 20. Every recorded spawn is plotted over the
  zone's own map art, which registers with no transform because coordinates are percentages of the
  zone's extent and that is exactly the space the art covers. The art is Wowhead's TBC-era maps (since
  2026-10-13): the retail maps it replaced were the post-Cataclysm zones, on which TBC spawns landed in
  the sea or on a flooded Thousand Needles, and a test now checks the spawns land on land. The loop is computed here rather than
  copied from anyone's guide (since 2026-10-14, Step C of the maps plan): Wowhead's records merged into
  spawn points where the same spawn was recorded twice (Felweed's 245 Hellfire records are 154 points,
  against 152 in CMaNGOS's spawn table), grouped into clusters, and a loop through the clusters worth
  their detour, shortened with 2-opt and Or-opt and with no crossings, measured in the zone's real 3:2
  shape. The caption says how good it is (how many spawn points the loop passes and how long a lap is
  against the zone's width), that it is a strong line rather than a proven optimum, and, in Azeroth,
  that the straight line is ridden on the ground and longer than drawn; in Outland it is flown at 70. Zone maps are
  Blizzard artwork used in a free, non-commercial fan project, credited on every map; all 42 zones have
  art (Alterac Mountains too, which the retail maps lacked), and a zone without would fall back to a bare
  density grid. Recommended zones the ingest has no coordinates
  for are named under the tabs rather than dropped. Skinning and Fishing get the same page without
  maps, because the game gives them no nodes — Skinning comes off mobs and Fishing off pools
- **Laid out for a phone.** The character line, the stat bar and the character sheet stack without a
  sidebar to collapse — the rail they replaced was one full screen tall at 375px on its own. Both tab
  bars are a three-column grid, so every tab stays visible without swiping, and every control on the
  planner, folded away or not, is a 44px tap target. Measured at 375x812: an empty planner's one
  action is pressable without scrolling, a filled character sheet starts on the first screen, and no section
  scrolls sideways. Raid Composition and the
  profession guides were reviewed the same way and every control there is a 44px target too; desktop
  keeps its density, since all of it sits inside the phone breakpoint. **Moving a player between raid
  groups no longer needs a drag**, which a finger cannot start and a keyboard never could: press Move
  on their seat, then the seat you want them in
- **Import your character out of the game.** A two-file addon (`addon/`) adds `/pdexport`, which
  hands you one string carrying race, class, faction, professions, talents and every equipped item
  with its enchants and gems — and no name, realm or GUID. Paste it on the front page and you land in
  the planner as that character, without building one first. Gear from a later phase than the
  rankings cover is worn rather than stripped, and the import says which half of the app stops at
  Phase 2
- **The planner opens with one thing to do.** A character with nothing equipped gets an offer rather
  than seventeen empty rows: one press fills every slot from the ranked list for the spec, with the
  enchants and gems that list recommends, and the offer disappears once taken. Rings and trinkets
  take successive entries, so both hands get filled rather than only the first
- **Choosing gear happens beside the sheet, not over it.** Picking a slot opens a pane next to the
  character sheet: the slot you are editing stays visible and updates as you click, so there is no
  confirmation step and nothing to close before you can see what you did. It says what to do when
  you arrive, and hands focus back to the row you came from when you leave
- **Usable from the keyboard.** A "Skip to the main content" link opens the shell, so the section tabs
  are two presses away rather than on the far side of the whole page, and when the app
  swaps one whole screen for another — the front page for the shell, the shell for character creation —
  focus goes with it instead of falling to the page body, which is what a screen reader reads from.
  Every control shows a focus ring, including the character selects. Both behaviours are guarded by
  tests driven with real key presses
- **Share a build as a link** — the whole build (character, professions, gear, gems, enchants,
  talents, buffs and consumables) packed into the address, so a build made on the desktop opens on a
  phone, or goes to a raid leader in one Discord message. Nothing is uploaded: the build rides in the
  part of the URL browsers never send to a server. Opening one lands straight in the planner wearing
  the build. Named saves stay in the browser, and nothing is saved automatically — a reload starts clean.
  **The Build tab** (the decided design, ported 2026-10-18) leads with a share card for the build on
  screen (spec icon, slots filled, item level, talents, buffs, set pieces and the gear's icons), the
  link to it, always current, and named saves that say what each holds. One box takes a link, build
  text or the addon's export, and **reading it changes nothing**: a report shows what came in slot by
  slot (or why a slot is empty), asks the spec when the talents cannot say, and only "Load into the
  planner" wears it. An addon export keeps the buffs already set, since the addon cannot read them, and
  a labelled example export shows the format
- **Professions on the character** — your two, picked in the Professions tab's "Which two" (since 2026-10-17), gating the one always-on stat
  bonus any profession gives a level 70 character in TBC: Enchanting's ring enchants. They are
  Enchanter-only (Wowhead's spell 27927 is flagged "target must be own item") and go on **both**
  rings, for +8 to every attribute. The app previously had this wrong in both directions at once —
  offering them to every character, and only ever on Finger 1. Dropping the profession removes the
  enchant rather than leaving it applied. Everything else a profession gives in TBC is access, not
  stats, and the picker says so rather than implying a bonus that is really Wrath's
- **The Compare tab** (the decided design, ported 2026-10-19): what you wear against another item for
  the same slot, as **side-by-side game tooltips** the way the game draws a Shift-compare, with **the
  trade in one sentence** above them ("You gain +6 Crit and lose −8 Hit… Estimated DPS 363.7 → 362.8").
  Pick the slot from your gear (the same slot picker as Ranked Gear) and the other item from your
  spec's Wowhead list for it, rank in the corner and yours marked, or any item the slot takes, best
  item level first; it opens on the guide's best item you do not wear. Under the other tooltip, the
  stats that change; Equip puts it on with the gems its score assumed. Each side is swapped into the
  set you are actually wearing, so set bonuses and socket bonuses count where a tooltip-against-tooltip
  comparison cannot see them, and your totals with each are one press away. It answers what the
  upgrade finder cannot: that list ranks what beats your current kit, so it cannot show a pair where
  one side is a downgrade. **Both sides are scored with the best colour-matched gems**, deliberately unlike the upgrade
  finder, which scores your baseline as-is — the question here is which *item* is better, not whether
  you have gemmed yet, and the panel states which question it is answering. The simulated score is
  shown for damage specs only, the same call the Simulation tab makes and for the same reason; the
  stat comparison is shown to every spec
- A fixed encounter — one target, level 73, 7,700 armor — with no controls, matching what the reference TBC simulators do. The panel names it, since a DPS figure means nothing without knowing what it was measured against
- Anime.js-powered loading intro, panel entrance, equip feedback and stat update animations
- Reduced-motion aware animation helpers
- Playwright tests for physical, caster, healer, and tank flows
- Playwright regression coverage for expanded slot options and every class/spec's Phase 2 sample gear selection, plus a full-coverage check that every class/spec resolves to a BiS list

