# Round 3: immersive 3D, motion, and neumorphism, pushed hard

**Made 2026-10-03. Concept prototypes only; nothing here is the live app.**

> **Owner review, 2026-10-03:** the **Hybrid** designs were dropped (their files are kept here for
> reference but removed from the gallery). The favourites were **3D · Portal** (its layout and its
> scene) and the **motion of Motion · Portal**. Round 4 puts Motion · Portal's motion onto 3D · Portal's
> layout, aimed more squarely at the planner's WoW Phase 2 job: [`../round4/`](../round4/).

Three styles, each pushed as far as it would go, built three ways: on the **Launcher** (05), on the
**Portal** (08), and as a **Hybrid** that puts the Portal's home content inside the Launcher's shell.
Sections were moved and merged freely where it helped the style. The brief every designer worked to
is [`ROUND3-BRIEF.md`](ROUND3-BRIEF.md).

| Style | Launcher | Portal | Hybrid |
| --- | --- | --- | --- |
| **Immersive 3D** | [3d-launcher](3d-launcher.html) · 49 KB | [3d-portal](3d-portal.html) · 37 KB | [3d-hybrid](3d-hybrid.html) · 41 KB |
| **Motion & animation** | [motion-launcher](motion-launcher.html) · 46 KB | [motion-portal](motion-portal.html) · 46 KB | [motion-hybrid](motion-hybrid.html) · 43 KB |
| **Neumorphism** | [neu-launcher](neu-launcher.html) · 37 KB | [neu-portal](neu-portal.html) · 32 KB | [neu-hybrid](neu-hybrid.html) · 45 KB |

## Libraries

Nothing is installed. Each page loads its libraries at runtime from a public CDN, with pinned versions.
That is the only way a published static page can use them. Every URL was checked to respond before use.

| Library | Version | Source | Used by | For |
| --- | --- | --- | --- | --- |
| Three.js | r128 (UMD) | `cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js` | All three 3D designs | WebGL scenes, custom shaders, particles, lights, fog |
| GSAP | 3.12.5 | `cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js` | All motion designs; all neumorphism designs (optional) | Timelines, staggers, count-ups, springy presses, knob rotation |
| ScrollTrigger | 3.12.5 | same folder | All motion designs | Scroll-scrubbed parallax, pinning, the raid route, self-drawing lines |
| Flip | 3.12.5 | same folder | All motion designs | Card-to-header morph, re-sorting rows and tier lists, bento re-layout |
| TextPlugin | 3.12.5 | same folder | Motion Launcher, Motion Portal | Typed eyebrow, dates, phase title and chip |
| MotionPathPlugin | 3.12.5 | same folder | Motion Hybrid | A glowing token travelling the raid route |
| Observer | 3.12.5 | same folder | Motion Hybrid | Drag and swipe on the data-change carousel |
| Lenis | 1.1.13 | `cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js` | Motion Launcher, Motion Portal | Smooth scrolling synced to ScrollTrigger |

No images, models, textures or data files are loaded. Every scene, shape, glow texture and icon is
generated in code: shaders, canvas-drawn sprites, inline SVG and CSS.

---

## Immersive 3D

All three share the same safeguards:
- **No WebGL:** a styled static fallback. With WebGL disabled, all three loaded with no script errors.
- **Context loss:** falls back the same way.
- **Pausing:** rendering stops when the tab is hidden or the canvas is off-screen.
- **Device pixel ratio:** capped at 2, with a low-power renderer.
- **Reduced motion:** one still frame instead of animation.
- **Text:** all real HTML, never painted into the canvas.

**3D · Launcher.** Fonts: Cinzel, Barlow, JetBrains Mono. Palette: void black, naaru gold, arcane cyan, void violet.
- **Hero:** a live WebGL crystal prism, faceted and flat-shaded with gold edges and a spinning core. Three colored point lights and fog light it. 14 shards orbit it with additive glow, inside two pulsing halos and three counter-rotating rings.
- **Particles:** 1,400 motes (600 on phones) that part around the pointer and swirl on scroll. The camera follows the pointer for parallax.
- **Planner:** an armored figure built from primitives stands ringed by 17 bevelled, epic-edged slot plates. Choosing a slot in the HTML list, or with the arrow keys, flies the camera to that plate. Clicking a plate selects the slot.
- **Moved:** the gear table became 17 slot buttons beside the scene, because they drive the camera.
- **Elsewhere:** CSS 3D tilt cards, and a 3D flip between sections.

**3D · Portal.** Fonts: Marcellus, Figtree, JetBrains Mono. Single dark theme.
- **Background:** the whole page floats over a live Serpentshrine Cavern pool. A custom vertex shader makes the waves; a fragment shader adds animated caustics, a glow pool under a hovering prism, and distance fog.
- **Scene:** about 520 GPU-animated glowing particles, and eight pillars receding into the fog.
- **Camera:** it sways, follows the pointer, and sinks as you scroll.
- **Depth:** the portal boxes float as glass cards on separate depth layers, each with different parallax.
- **Tier list:** rotatable 3D S/A/B tier shelves built from the real list. They can be dragged, and have ◀ ▶ buttons and a List view toggle.
- **Phase lighting:** switching phase re-lights the whole scene and the page accents, warm for Phase 1 and teal for Phase 2. A "3D scene on/off" toggle is added.

**3D · Hybrid.** Fonts: Cinzel, Source Sans 3, IBM Plex Mono.
- **War table:** the home page is a 3D wooden table on legs. Its shader map surface has contour lines, a grid, and warm Phase 1 and pulsing teal Phase 2 regions.
- **Raid markers:** five spinning crystals on metal bases, each with a ring, a light beam and its own light. Hovering raises a marker. Clicking it (or the matching HTML raid button) flies the camera there and opens that raid's loot panel.
- **Panels:** the character, tier list, feed, professions and glance panels dock around the table.
- **Planner:** an arc of 17 glowing slot plates around a turning crystal, which rotates the chosen slot to the front.
- **Camera:** pointer orbit is limited to small angles.
- **Moved:** the Portal's raid-loot table became the table's loot panel.

## Motion & animation

All three share the same safeguards:
- **Without JavaScript:** all content is visible in the HTML.
- **Animation:** only ever plays from visible content, never waits hidden for a scroll.
- **Stall safety:** after 1.5 seconds, any stalled timeline jumps to its end.
- **Motion toggle:** a visible on/off button (`aria-pressed`) that reverts everything cleanly.
- **Reduced motion:** motion never starts.
- **Missing libraries:** each plugin is checked on its own, so a missing one only skips its effect.

**Motion · Launcher.** Fonts: Chakra Petch, Source Sans 3, JetBrains Mono.
- **Intro:** a 2.5-second cinematic sequence. The rail unrolls and the logo spins in, then the headline's characters flip up in 3D and a light sweeps the banner.
- **Raid emblem:** an SVG emblem draws itself stroke by stroke.
- **Wipes:** a full-screen wipe between sections shows the destination's name.
- **Planner morph:** a Flip morph turns the Continue card into the planner header.
- **Sorting:** a sort control (slot or source raid) reorders the 17 gear rows with Flip, and the moved rows glow gold.
- **Desktop extras:** magnetic buttons, a lagging custom cursor, and scroll-scrubbed parallax.

**Motion · Portal.** Fonts: Syne, Instrument Sans, JetBrains Mono.
- **Pinned glance:** on desktop, "Phase 2 at a glance" pins and its four facts scrub in one by one, with a counter and a progress bar. On phones the facts are simply stacked.
- **Feed:** the data-change feed is a timeline whose SVG line draws itself as you scroll, and entries snap onto it.
- **Tier filters:** class filter chips and a sort toggle re-flow the tier list with Flip.
- **Phase change:** switching phase rearranges the whole home page.
- **Into the planner:** an amber curtain wipes in, then the 17 gear rows deal in like cards.
- **Intro:** a masked word-by-word headline and a self-drawing emblem.

**Motion · Hybrid**, a "living dashboard". Fonts: Rajdhani, Source Sans 3, IBM Plex Mono.
- **Bento grid:** five focus buttons rearrange it with Flip, enlarging the chosen module.
- **Raid route:** a glowing token travels an SVG path through all five raids as you scroll, lighting each one as it passes.
- **Version chip:** it springs and recolors as the token crosses from Phase 1 into Phase 2.
- **Rail indicator:** a fluid blob that stretches between icons and settles.
- **Carousel:** a drag and swipe carousel of data changes.
- **Into the planner:** the character card expands to fill the screen before the planner draws in.

## Neumorphism

All three share the same approach:
- **One surface:** every element is raised from it or pressed into it.
- **Themes:** light and dark neumorphic themes, following the system setting, with a tactile toggle.
- **Contrast:** neumorphism's usual weakness was fixed on purpose. Text meets AA, and every state and focus has a cue besides shadow depth (an accent ring, dot, icon or color).
- **No GSAP needed:** the pages work fully without it.

**Neumorphism · Launcher.** Fonts: Nunito, Atkinson Hyperlegible, JetBrains Mono.
- **Rail:** round extruded buttons.
- **Home banner:** a raised plate holding an inset "screen" with a floating prism.
- **Gauges:** a 270° circular hit gauge reading 140/142 with a cap tick, and soft dials for Attack Power and crit.
- **Planner:** 17 inset wells holding raised item chips that press in when selected.
- **Controls:** a soft segmented phase control, and a sun/moon theme knob.

**Neumorphism · Portal.** Fonts: Nunito, Figtree, JetBrains Mono.
- **Phase filter:** a raised control panel with a pressed-in Phase 1/2 switch that really swaps the content.
- **Feed:** a soft timeline with pressed-in date pills.
- **Gauges:** circular gauges for the hit cap and for Fel Iron skill (300 of 375).
- **Tier list:** raised round S/A/B badges.
- **Planner:** 17 inset wells holding raised chips.
- **Moved:** the raid-loot table became chips in wells.

**Neumorphism · Hybrid**, designed as a control console. Fonts: Outfit, Nunito Sans, JetBrains Mono.
- **Console shell:** status lights, and a rocker switch for the theme.
- **Character module:** comes first and largest, with a big bezelled hit gauge and five stat dials.
- **Phase knob:** a rotary knob that really changes the glance module.
- **Feed:** an inset LCD-style "screen" for the data feed.
- **Planner:** a paper doll of 17 wells around a centre detail screen.
- **Contrast:** verified by script against every surface in both themes.

---

## How these were made and checked

1. **Building.** One designer agent per design, working from the brief. The first wave of five was lost to a usage limit and stalls before saving anything. All nine were then rebuilt in waves of three, with each file written in small pieces and no browser use.
2. **Reports.** Each designer reported its libraries, palette, the moves that make it heavy, section changes, fallbacks and accessibility. Those reports are the source of this document.
3. **Automated checks** (Playwright with Edge, software WebGL). Every design was loaded at 400px, at 1280px, and at 1280px with reduced motion on. The checks covered:
   - sideways page scroll
   - script errors and failed loads
   - requests to hosts outside the allowlist
   - on-screen text still invisible after 3.5 seconds
   - whether each 3D canvas actually rendered
4. **WebGL test.** The three 3D designs were loaded again with WebGL disabled to confirm their fallbacks. All three loaded with no errors.
5. **Visual review** of screenshots at both widths.

**Fixed after review:**
- Motion · Portal threw a script error, because a GSAP callback read its index argument as the element. It also scrolled 2px sideways on desktop, because the pinned facts start 90px to the right; the facts list now clips them.
- 3D · Hybrid cited research IDs that didn't fit (T16). They are now T1, T2, T5 and R4.

**Known rough edges:**
- On phones, the 3D Launcher's headline sits over the bright crystal, which weakens contrast.
- A decorative dot on Neumorphism · Launcher's banner overlaps a label.
- Counters can briefly read an in-between number to screen readers while they tick up.
- Contrast was estimated, except on Neumorphism · Hybrid, which checked it by script. Nobody clicked through every control by hand.
- These are heavy pages built to show what each style can do. They are not tuned for low-end phones the way the real app would need to be.
