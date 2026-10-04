# Tab prototypes brief

**Step 1** builds one baseline prototype per tab in the chosen Round 4 style, so the whole site can be
clicked through. **Step 2** then goes tab by tab, three parallel designs per step, and the owner picks
one per step.

## The chosen style

Everything follows `docs/design/prototypes/round4/motion-3d-portal.html`: its tokens, fonts, glass
depth cards, Serpentshrine / Tempest Keep WebGL scene (Three.js r128), GSAP motion vocabulary,
Motion on/off toggle, phase re-lighting, fallbacks and accessibility. **Reuse its code** (copy its
`<style>` tokens, scene script and motion helpers) rather than reinventing them, so every tab feels
like the same site. Each tab page links to the others through the same top navigation, so the set
works as one clickable prototype.

The product goal: a **World of Warcraft TBC Classic Anniversary, Phase 2 planner for DPS players**.
Every tab should make that job clear and use real data. Rules for data, quality colors, provenance,
library hosts, accessibility, and 400px / 1280px layouts are in `docs/design/prototypes/BRIEF.md` and
`docs/design/prototypes/round3/ROUND3-BRIEF.md`.

## Tabs and where their real data lives

Read the real app code for each tab before designing. Use real values; never invent items, numbers
or rankings. If a value is computed by the app and you can't compute it, label it "example".

| # | Page file | Tab | What it is for | Real data and code |
| --- | --- | --- | --- | --- |
| 1 | `home.html` | Home | Front door: what the app is, Phase 2 at a glance, what changed in the data, entry into each tab, import your character | `round4/motion-3d-portal.html` home content; `src/components/layout/SectionPicker.tsx` |
| 2 | `planner.html` | Character Planner | Build and gear a character. Sub-tabs: **Gear, Compare, Talents, Buffs, Ranked Gear, Build** | `src/features/gear`, `src/features/character`, `src/features/talents`, `src/features/buffs`, `src/features/bis`, `src/features/builds`; `src/domain/talents/warriorTalents.json`, `talentBuilds.json`; `src/domain/buffs`, `src/domain/consumables` |
| 3 | `simulation.html` | Simulation | Estimated DPS for DPS specs against a fixed boss (level 73, 7,700 armor), stat weights, upgrade finder, what is and isn't modelled | `src/features/simulator`, `src/domain/simulation/sampleEncounters.ts`, `src/featureFlags.ts`, `docs/known-limitations.md` |
| 4 | `raid-composition.html` | Raid Composition | Seat a 10 or 25-player raid in groups of five; see which buffs each group gets; what one more seat would add; export the chart | `src/features/raidcomp`, `src/domain/raidcomp`, `src/domain/buffs/buffScope.json` |
| 5 | `tier-lists.html` | Spec Tier Lists | Wowhead's Phase 2 DPS, healer and tank rankings, your spec marked | `src/domain/tierlists/tierLists.json` |
| 6 | `raids.html` | Raids | Per raid: a card per boss, its loot by quality, attunement steps | `src/domain/raids/*Bosses.ts`, `sampleRaids.ts`, `sampleAttunements.ts` |
| 7 | `professions.html` | Professions | Pick from 13 professions; levelling guide 1–375 by skill range; trainer stops; crafting paths and shopping lists; farming route maps for Mining and Herbalism | `src/features/professions`, `src/domain/professions` (`gatheringGuides.ts`, `nodeSpawns.json`, `craftingPaths.json`) |

All files go in `docs/design/prototypes/tabs/`.

## Every tab page must

- Use the shared top navigation (Home, Character Planner, Simulation, Raid Composition, Spec Tier
  Lists, Raids, Professions) with the current tab marked, plus the "TBC Classic · Phase 2" chip and
  the Motion toggle.
- Show provenance (source, phase, "updated" date) next to the numbers it shows.
- Run the shared scene behind the content, but tuned to the tab (e.g. calmer and dimmer behind dense
  tables; Tempest Keep's arcane light on Simulation; the scene can react to a selected raid on Raids).
- Have a working WebGL fallback, reduced motion, content visible without JS, no horizontal scroll at
  400px, and visible focus.
- Start with `<!doctype html>`, title "Project Defeat · <Tab>", and a direction line
  "Tab prototype · <Tab> · Step 1 baseline. Prototype only, not the live app."

## Report back

File and size; what real data was used and from where; how the tab uses the shared scene and motion;
anything left as "example"; known gaps.
