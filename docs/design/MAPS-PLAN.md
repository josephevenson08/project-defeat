# Reworking the gathering maps and routes: plan

**Status: written 2026-10-12, waiting for the owner's decisions (below). Nothing is built.** The owner asked for it on
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

**3. The route algorithm draws one node at a time, in straight lines, without knowing a route's purpose.**
- It routes **one node type per map**, but a player at Herbalism 320 picks everything their skill allows. The
  ranges in `gatheringGuides.ts` already know which nodes belong together; the routes do not use that.
- **Straight lines** go over mountains and across water. In Outland at 70 with a flying mount that is how you travel,
  but in Azeroth, and in Outland before flying, it is not.
- The **35% cut** keeps only the busiest cells of one node, so a loop can skip a stretch that is thin for that node but
  rich for the next one in the same skill window.
- The caption says "a heuristic", which is honest, but nothing says how good a loop is (nodes per lap, lap length).

## The plan

### Step A. Correct maps (small, and it fixes a visible error today)
- Point `ingest-zone-maps.mjs` at the TBC path, refetch all 41 maps and add Alterac Mountains (42), and record the
  source path in `zoneMaps.json`. The images are the same size, so `FarmingRouteMap.tsx` needs no change.
- **A test** that a known spawn lands where the TBC map draws it, for a zone that changed in Cataclysm. For example:
  Stranglethorn's Gold Veins must fall inside the zone's land, not on water, measured against a small hand-made land
  mask for that one zone. Plus a check that every map in `zoneMaps.json` comes from the TBC path.
- The credit line stays as it is.

### Step B. Complete and verify the nodes
- Add the missing node types (Gromsblood, Ghost Mushroom, Plaguebloom, Bloodthistle, and the mining variants the
  researcher confirms), and find Ragveil's real object ids.
- Replace "three busiest zones" with "every zone that matters to a range": keep a zone when it holds a meaningful share
  of the node's spawns (for example 10%) or when a range in `gatheringGuides.ts` names it.
- Record `fetchedAt` in `nodeSpawns.json` and `zoneMaps.json`, for the source line under the top bar.
- Spot-check the coordinates against a second source for a handful of nodes (the tbc-researcher picks one, such as
  the in-game map or a gathering addon's published data), and write down how close they agree.

### Step C. A new route algorithm
Proposed design, to be prototyped on the plain grid first (the prototypes' rule) and then drawn on the TBC maps:
1. **Route a skill window, not a node.** The input is every node a range lists, at the player's skill, so a 320 route
   in Nagrand picks up Felweed and Dreaming Glory together.
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

## The owner's decisions (open)

1. **When to fix the maps (Step A):** now, as its own small commit before the port continues (recommended: today's
   maps put nodes in the wrong place), or with Professions in step 3?
2. **Routes by skill window or by node:** a window (recommended, matches how a player gathers) or keep one node per map?
3. **Ground travel:** (a) straight lines with a note (recommended to start), or (b) a walkability mask per zone
   (more accurate, much more work)?
4. **The data fixes in Step B:** have the tbc-researcher confirm the missing nodes and zones first (recommended), as
   the Raids and Professions steps did?

## How it ships

Same as the port: Step A, B and C are separate commits, each with tests, the full suite, `tsc -b`, lint and build,
checked in the browser at desktop and phone width with screenshots before and after, and pushed after the owner says so.
