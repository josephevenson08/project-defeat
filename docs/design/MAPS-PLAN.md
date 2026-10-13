# Reworking the gathering maps and routes: plan

**Status: written 2026-10-12; the owner decided all four questions on 2026-10-13 (below). Step A is done
(2026-10-13): the app's maps are the TBC zones. The node research for Step B is running.** The owner asked for it on
2026-10-12: the Professions tab's zone maps should show current TBC maps and node locations, and the route algorithm
should be redone. [`PORT-PLAN.md`](PORT-PLAN.md) (Decision 2) asked for it before the port reaches Professions (step 3).

## What the app has now

| Part | Where | What it is |
| --- | --- | --- |
| Map art | `public/maps/<areaId>.jpg` (41 files), `src/domain/professions/zoneMaps.json` | Fetched by `tools/ingest/ingest-zone-maps.mjs` from `wow.zamimg.com/images/wow/maps/enus/zoom/<areaId>.jpg`, at 772 × 515. Alterac Mountains has none. Credited on every map. |
| Nodes | `src/domain/professions/nodeSpawns.json` | Fetched by `tools/ingest/ingest-node-spawns.mjs` from `wowhead.com/tbc/object=<id>` (the `g_mapperData` block): 45 node types, 14,104 spawns, each node kept to its three busiest zones, coordinates as 0–100 percentages of the zone. Ragveil and Ancient Lichen have no spawn data. |
| Routes | `src/domain/professions/farmingRoutes.ts` | Per node and zone: spawns bucketed into a 16 × 16 grid; cells at 35% of the busiest or more; nearest-neighbour from the densest cell; each stop snapped to a real spawn; 2-opt to remove crossings. |
| Drawing | `src/features/professions/FarmingRouteMap.tsx` | The map image with the density cells and the loop drawn over it in the same 0–100 space. |

## What I found (2026-10-12)

**1. The map art is retail art, drawn under TBC coordinates, and for most zones they do not line up.** The ingest
fetches Wowhead's *retail* map path. For the old world that is the post-Cataclysm map: Azshara is the goblin version,
Thousand Needles is flooded, area 33 is only Northern Stranglethorn and area 17 only Northern Barrens. The spawn
coordinates come from Wowhead's *TBC* pages, as percentages of the TBC zone's extent. So a Gold Vein at a TBC
coordinate in Stranglethorn is drawn on a map of the northern half only, and lands in the wrong place. Outland's zones
did not change shape, but the retail images are cropped differently (a dark band along the bottom of Zangarmarsh), so
those are off too, by less.

**Wowhead serves the TBC art at its own path, under the same area ids:** `wow.zamimg.com/images/wow/tbc/maps/enus/zoom/<areaId>.jpg`,
772 × 515 (Silithus is 772 × 516; the ingest already reads each image's real size). All 41 zones resolve there, and so does Alterac Mountains (area 36), which has no retail art at all.
Side by side, the TBC images show the zones as they are on the Anniversary realms (whole Stranglethorn, whole Barrens,
dry Thousand Needles, the old Azshara).

**2. The nodes are TBC data, but not all of it.** A first pass against the node list:
- **Missing herbs:** Gromsblood, Ghost Mushroom and Plaguebloom are not in the ingest's list, so Felwood, the main
  old-world herbing zone from about 250 to 300, never appears. Bloodthistle (Eversong Woods, Blood Elves only) is
  missing too.
- **No spawn data:** Ragveil (Zangarmarsh), on object id 181275. It may have other object ids; Ancient Lichen is
  dungeon-only, which is expected.
- **Missing zones:** the Blood Elf and Draenei starting zones (Eversong Woods, Ghostlands, Bloodmyst Isle) never make a
  node's top three, so low-level routes there are absent, though Azuremyst Isle is present.
- **Missing mining variants:** Ooze Covered veins, Incendicite, Lesser Bloodstone, Indurium, Dark Iron and Nethercite
  (Netherwing Ledge). Most are minor; Nethercite matters for its quests.
- **The three-zone cap** keeps each node to its three busiest zones. That is fine for the busiest material, but it
  drops zones a route might reasonably use. Which ones is for the researcher to list.

These need confirming by the tbc-researcher before any data changes, as every data fix in this repo has been.

**3. The route algorithm draws straight lines and does not say how good a loop is.** (Corrected 2026-10-13: the first
version of this plan said the maps route one node type at a time. The Professions tab's range maps already merge every
node in a skill range into one loop per zone, through `routesForNodes`; only the older `routesForNode` is per node.)
- **Straight lines** go over mountains and across water. In Outland at 70 with a flying mount that is how you travel,
  but in Azeroth, and in Outland before flying, it is not.
- The **35% cut** keeps only the busiest grid cells of the range's merged cloud, and the loop is nearest-neighbour from
  the densest cell, then 2-opt. Nothing weighs a detour against what it picks up.
- The caption says "a heuristic", which is honest, but nothing says how good a loop is (nodes per lap, lap length).

## The plan

### Step A. Correct maps (done 2026-10-13)

**As built:** `ingest-zone-maps.mjs` fetches from the TBC path, refetches whenever the recorded source differs, and
takes area ids from the previous `zoneMaps.json` (plus Alterac Mountains, 36) when the spawn cache is not on disk. All 42
zones have art (3.0 MB, down from 3.3 MB); `zoneMaps.json` records the source and `fetchedAt`. The test reads the map
pixel under each spawn in the two zones Cataclysm reshaped most: on the retail art 20 of Stranglethorn's 163 Gold
Veins and 60 of Thousand Needles' 189 Silver Veins sat on water, and on the TBC art none do (checked by swapping the old
Stranglethorn map back in: the test fails at 20). The land-mask idea below was replaced by this colour reading.

The original plan:
- Point `ingest-zone-maps.mjs` at the TBC path, refetch all 41 maps and add Alterac Mountains (42), and record the
  source path in `zoneMaps.json`. The images are the same size, so `FarmingRouteMap.tsx` needs no change.
- **A test** that a known spawn lands where the TBC map draws it, for a zone that changed in Cataclysm. For example:
  Stranglethorn's Gold Veins must fall inside the zone's land, not on water, measured against a small hand-made land
  mask for that one zone. Plus a check that every map in `zoneMaps.json` comes from the TBC path.
- The credit line stays as it is.

### Step B. Complete and verify the nodes

**Where it stands (2026-10-13): researched, the ingest is ready, the data refresh is blocked.**

- **The research is done** (tbc-researcher, every id, name, skill and zone count read off Wowhead's TBC pages):
  - Wowhead gives Felwood and Blasted Lands their own object ids for ordinary herbs and ores (Felwood's Dreamfoil is
    176639, everyone else's 176584). Read as one id per node, those two zones were simply missing.
  - Missing herbs: Bloodthistle 181166 (Eversong Woods only; any race picks it, only Blood Elves use it), Ghost
    Mushroom 142144 (245; its zones are disputed between sources), Gromsblood 142145 and 176637 (250), Plaguebloom
    176587 and 176641 (285).
  - Mining variants worth having: Ooze Covered Truesilver 123309 (Silithus 99) and Ooze Covered Rich Thorium 177388,
    plus Dark Iron 165658 (230, Burning Steppes and Searing Gorge). warcraft.wiki.gg has 123309 and 123310 swapped;
    Wowhead's assignment is the one used.
  - Ragveil 181275: Wowhead's TBC page lists only the three Coilfang dungeons, with no coordinates. Only the retail page
    has Zangarmarsh points.
  - Zones the three-zone cap drops: about 33 (zone, node) pairs reach 10% of a node's spawns, and no Blood Elf or Draenei
    starting zone does (4–8% each), so those need the "a range names it" rule.
  - **Second-source check:** pfQuest-tbc's CMaNGOS data agrees with Wowhead to rounding for Felweed in Hellfire (all 152
    of its points have a Wowhead point within 0.3) and to about 3 points for Stranglethorn's Gold Veins. Wowhead's counts
    include near-duplicate points (Felweed's 245 in Hellfire are about 155 sites), which Step C has to merge before it
    counts spawns per lap.
- **The owner's three calls:** Ragveil gets no map and the page says why; Dark Iron is included, marked optional;
  Nethercite (Netherwing reputation, quest-gated) is left out.
- **The ingest is rewritten and tested offline** (`tools/ingest/ingest-node-spawns.mjs`): a node can carry extra ids
  (`also`), merged zone by zone after checking each returns the same name and skill; the seven new nodes are declared;
  a zone stays when it is in the node's busiest three, holds 10% of its spawns, or is named by a range whose window
  takes the node; the skill falls back to Wowhead's tooltip endpoint; `fetchedAt` is written. It refuses to write
  unless every declared node resolves, and it no longer caches an empty reply. A run against stand-in pages built from
  the committed data wrote 52 nodes with the expected merges (Dreamfoil gains Felwood 43, Mithril Felwood 51), refused
  when one node failed, and dropped an extra id whose skill disagreed.
- **Blocked:** since this month Wowhead answers scripted requests for object pages with a 202 and an empty body (or a
  403); only a request pretending to be a desktop browser gets through. That is a bot check, and the ingest does not
  get around it. `nodeSpawns.json` is unchanged and still matches the live pages as of the research above.
- **Shipped without new data:** the guide text that was wrong whatever the data says. Winterspring has no Dreamfoil
  in Wowhead's TBC data (the guide said it carried all three herbs); every starting zone grows all three first herbs
  (the guide said only Tirisfal did, which was true of our map only); Mana Thistle is under a hundred spawns over five
  Outland zones and Quel'Danas (it said three); Ragveil's reason is spelled out; Dark Iron, Ghost Mushroom, Gromsblood,
  Plaguebloom and Bloodthistle are named in their ranges, marked as not in our node data.

**Ways to get the data.** **The owner chose the first (2026-10-13): wait and retry**, keeping today's data, and carry on
with other work in the meantime. The other two stay here in case retrying keeps failing.
1. **Wait and retry** the ingest now and then (`node tools/ingest/ingest-node-spawns.mjs`; it writes nothing unless
   every node resolves); nothing else changes until it works.
2. **Use pfQuest-tbc's CMaNGOS data** (`shagu/pfQuest`, `db/objects-tbc.lua`, on raw.githubusercontent.com). The
   addon is MIT, but its TBC data comes from CMaNGOS's `tbc-db`, which is GPL-3.0, and this repo is MIT, so the licence
   question has to be settled first. It has fewer points (no near-duplicates) and no Ragveil, Flame Cap or Ancient Lichen
   coordinates.
3. **The owner saves the pages** from their own browser into `tools/ingest/.cache/node-spawns/object-<id>.html` (about 70
   pages: the 52 nodes and their extra ids); the ingest reads the cache first.

**When the data arrives, in this order:** add the zones the ranges should name (Mining 1–65: Eversong Woods and Azuremyst
Isle; Herbalism 1–70: Eversong Woods; 70–115: Ghostlands and Bloodmyst Isle; 230–270: Felwood; Mining 275–300:
Silithus), because the ingest reads them to decide what to keep; run the ingest; run `ingest-zone-maps.mjs` for the new
zones (Felwood, Blasted Lands, Eversong Woods, Ghostlands, Bloodmyst Isle and others; area ids come from the spawn cache);
let a range show every zone it recommends even past the eight-tab cap, and decide what the tab test allows; rewrite the
"not in our node data" sentences; update the node-count test (45) and the docs that quote counts.

The original plan:
- Add the missing node types (Gromsblood, Ghost Mushroom, Plaguebloom, Bloodthistle, and the mining variants the
  researcher confirms), and find Ragveil's real object ids.
- Replace "three busiest zones" with "every zone that matters to a range": keep a zone when it holds a meaningful share
  of the node's spawns (for example 10%) or when a range in `gatheringGuides.ts` names it.
- Record `fetchedAt` in `nodeSpawns.json` and `zoneMaps.json`, for the source line under the top bar.
- Spot-check the coordinates against a second source for a handful of nodes (the tbc-researcher picks one, such as
  the in-game map or a gathering addon's published data), and write down how close they agree.

### Step C. A new route algorithm
Proposed design, to be prototyped on the plain grid first (the prototypes' rule) and then drawn on the TBC maps:
1. **Route a skill window, as the range maps already do.** The input stays every node a range lists, so a 320 route
   in Nagrand picks up Felweed and Dreaming Glory together; Step B's added nodes and zones feed straight into it.
2. **Cluster the spawns** (density-based clustering with a radius about the distance you can see a node from), weighting
   each cluster by how many spawns it holds, summed over the window's nodes.
3. **Choose the loop for yield, not just to visit clusters.** Pick the clusters that give the most spawns per distance
   travelled (a prize-collecting loop), order them, and tighten the order with 2-opt and Or-opt.
4. **Say how good it is:** spawns passed per lap and the lap's length, in yards where the zone's size is known.
5. **Travel:** straight lines when flying is available (Outland, level 70, a flying mount). For ground travel, either
   (a) keep straight lines and say so on the map, or (b) avoid crossing water and mountains, using a coarse walkability
   mask per zone. That would be made once from the TBC map art and checked by hand, which is real work for 42 zones.

**Tests:** fixed inputs with known best loops (a ring of clusters must come out as a ring, with no crossings), a
property test that the loop never gets longer when a cluster is removed, and the real-data numbers the prototype
check pins (for example, the Mining 325–350 route through Nagrand and Blade's Edge).

## The owner's decisions (2026-10-13)

1. **When to fix the maps:** now, as Step A, its own small commit before the port continues.
2. **What a route covers:** a skill window, everything the player's skill can gather in that zone. The range maps
   already work this way; the new algorithm keeps it.
3. **Ground travel:** straight lines, with a note on the routes that are ridden on the ground (all of Azeroth, and
   Outland before flying). No walkability masks.
4. **The node data:** the tbc-researcher confirms the missing nodes, object ids and zones before anything is ingested.

## How it ships

Same as the port: Step A, B and C are separate commits, each with tests, the full suite, `tsc -b`, lint and build,
checked in the browser at desktop and phone width with screenshots before and after, and pushed after the owner says so.
