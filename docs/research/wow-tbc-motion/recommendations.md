# Making the animation feel like The Burning Crusade: the plan

**Status: approved by the owner and built, 2026-10-04.** Live in all seven [tab prototypes](../../design/prototypes/tabs/) through `tabs/tbc-kit.js`.

This turns the two research tracks into one plan for the chosen Motion + 3D style
([`../../design/prototypes/round4/`](../../design/prototypes/round4/)) and the seven
[tab prototypes](../../design/prototypes/tabs/). The app stays framed on **Phase 2** (Serpentshrine
Cavern and Tempest Keep) on purpose, even though Phase 3 is live (TA5–TA7).

**How to read the sources.** IDs starting TA are in [`sources-a.md`](sources-a.md) and TB in
[`sources-b.md`](sources-b.md). The core framing rests on Blizzard's own pages:
- Outland is "shattered" (TA1, TA4).
- SSC is a "watery lair" and TK a "crystalline fortress" (TA3).
- Approaching the naaru, light intensifies and chimes ring (TA35).

Finer lore detail comes from Warcraft Wiki, a weak source: SSC's pumps, Al'ar's rebirth, Gravity Lapse,
Solarian's portals and the Dark Portal's blue-to-green ignition. Here it is used only as design
inspiration, never as a fact the app shows.

## The rules first

1. **Evoke, don't copy.** Every effect is our own shader, geometry or SVG. No Blizzard, WoW, TBC or
   Classic logos, no key art or wallpapers, no game music or sound effects, and nothing extracted from
   the game client. (TB, `usage-rules.md` §2–§6)
2. **Restraint, because this is a data tool.** A slow background scene, one soft "swell" on meaningful
   events, and panels that move only to show a change. No autoplay audio or video. Respected tools do
   the same: Raider.IO saves its rich motion for a recap feature, and Icy Veins and WoWSims ship almost
   none. (`prior-art.md`)
3. **Accessibility is not optional:**
   - **Pause:** the Motion and 3D scene toggles stay visible. WCAG 2.2.2 requires a way to pause motion that runs longer than 5 seconds.
   - **No flashing:** nothing flashes more than three times a second, so pulses swell slowly.
   - **Reduced motion:** gives a still frame.
   - **Contrast:** text is checked against the brightest frame of the scene.
   
   (`techniques.md` §12)
4. **Performance tiers:**
   - DPR is capped at 1.5, or 1 with bloom.
   - The low-power GPU setting is kept.
   - A low, medium or high tier is picked from the first two seconds of frame times.
   - Rendering stops when the canvas is off screen or the tab is hidden.
   
   (`techniques.md` §11)

## A shared "TBC motion kit" (build once, used by every tab)

| # | Effect | Read as | Built how | Used for |
| --- | --- | --- | --- | --- |
| K1 | **Portal ignition** | The Dark Portal reopening: cool blue crossfading to fel green (TA21–22, weak) | A disc shader with a twisting polar fBm vortex, additive blend, opened by GSAP scaling it and changing a shader value (`techniques.md` §2–3) | A one-time intro the first time Home loads, then it settles into the scene. Skipped on return visits and under reduced motion. |
| K2 | **Shattered sky** | Blizzard's own "shattered skies and torn lands" (TA1, TA4) | Low-poly floating rock fragments in one instanced mesh, bobbing slowly, plus a slow nether aurora band (warped noise, rendered at half size every few frames) (§5, §8) | The background on every tab, dimmed behind dense content. |
| K3 | **Naaru swell** | Light intensifies and chimes ring near A'dal (TA35, primary); a crystal of rotating segments (TA36) | The existing crystal, with shards that rotate steadily, plus one soft brightness swell (about 1.2s, no flash) on events. Sound only if the user opts in; recommended to leave sound out entirely. | Equipping the recommended set, a saved build, switching phase, finishing a simulation. |
| K4 | **Fel embers** | Green felfire and Hellfire's red sky (TA37–38, weak) | The prototype's GPU motes made to rise and wrap, with a colour ramp from yellow-green to fel to violet, additive blend and capped counts (§4) | Phase 1 raids from Hellfire (Magtheridon), Mining's Fel Iron, the Simulation "charge". |
| K5 | **Coilfang water** | SSC's "watery lair" (TA3); pumps and capacitors (TA28, weak) | The existing water and caustics, caustics projected onto pillars, cheap light-shaft cones, and a slow pump-like pulse in the water (§7) | The Serpentshrine theme: Home, Raids → SSC, Tier Lists, Raid Composition. |
| K6 | **Crystalline fortress** | TK's "crystalline fortress" (TA3); the Sun King's gold and violet | The gold-over-violet palette, the nether aurora brighter, crystal pillars instead of stone | The Tempest Keep theme: Simulation, Raids → TK. |
| K7 | **Rune ring** | Arcane circles, our own design (no source describes runes, *unverified*) | Our own SVG rings drawn with GSAP DrawSVG (needs GSAP 3.13; see below), also usable as a texture on the water (§9) | Section entry transitions, loading states, the tier list shelves' base. |
| K8 | **Light-portal entry** | Solarian's adds arriving through circular light portals (TA33, weak) | A small expanding ring of light where a panel appears | Opening a sub-tab, a raid or a profession. |
| K9 | **Rebirth burst** | Al'ar reborn from its ashes (TA32, weak) | Gold-orange sparks that scatter and re-form, once | "Start over", resetting a roster or a build. |
| K10 | **State shift (purity / taint)** | Hydross's pure and poison forms (TA30, weak) | A slow teal to sickly-green tint on one element | A warning state, e.g. the hit cap under 142. Text and icon remain the main cue. |

Two moments are deliberately rare:
- **The "lift":** a gentle Gravity Lapse-style rise of the cards, with particles slowing (TA34, weak). It happens once, when a character's gear matches the recommended set in all 17 slots.
- **Portal ignition (K1):** plays only on the first visit.

## Per tab

| Tab | Scene theme | Motion |
| --- | --- | --- |
| **Home** | Shattered sky over Coilfang water | K1 on the first visit; K3 when "Equip the recommended set" is pressed; K8 as the tab cards appear |
| **Character Planner** | Calm water, dimmed | K8 between sub-tabs; K3 on equip or save; K10 on the hit-cap warning; K9 on reset; the one-time "lift" at 17/17 |
| **Simulation** | Crystalline fortress (K6) | K4 embers rise as the run "charges", then K3 swells when the result lands; K7 ring while computing |
| **Raid Composition** | Coilfang water | K8 when a seat moves; K3 when a group gains a buff it was missing |
| **Spec Tier Lists** | Coilfang water | The 3D shelves sit on a K7 rune base; K8 when class filters change |
| **Raids** | Changes per raid: **SSC** K5; **TK** K6; **Magtheridon's Lair** K4 embers and a red sky (Hellfire Citadel); **Gruul's Lair** K2 rock and a dusk palette (Blade's Edge); **Karazhan** arcane violet (a Phase 1 raid, theme kept simple) | Switching raids crossfades the scene. K8 as boss cards appear. |
| **Professions** | Calm water | K4 embers behind Mining's Fel Iron route; K7 ring as the route draws |

## Technical changes this needs

- **Upgrade GSAP from 3.12.5 to 3.13.0** (cdnjs). Since 3.13 (29 Apr 2025), every former Club plugin is
  free, commercial use included (TB). The session lead checked that 3.13.0 serves gsap, ScrollTrigger,
  Flip, DrawSVGPlugin, SplitText, MorphSVGPlugin and TextPlugin. DrawSVG is **not** available at 3.12.5.
  SplitText would replace the hand-rolled word splitting.
- **Three.js stays at r128.** Optional `UnrealBloomPass` (its selective variant) runs on the high
  tier only. The default glow uses camera-facing quads (`techniques.md` §6).
- **Item quality colours stay softened** (epic about `#c08cff`), not the in-game `#a335ee` (TA44). The
  game's exact purple falls short of AA text contrast on the dark glass.

## How it would be rolled out

1. Build the kit (K1–K10) once into the shared code of the seven tab pages and the round-4 page, behind
   the existing Motion and 3D toggles.
2. Check every page as before: 400px, 1280px, reduced motion, WebGL off, and screenshots. Add a check
   for frame rate on the low tier, and confirm no flash goes over three per second.
3. Then continue Step 2 (three designs per tab), with the kit as the shared motion language.

## Owner's decisions (2026-10-04)

1. **The kit is approved as written** (K1–K10, plus the one-time "lift").
2. **No sound at all.**
3. **The portal ignition (K1) plays once per new visit**, meaning once per browser session (`sessionStorage`). It does not play again when moving between tabs, and never plays under reduced motion.
