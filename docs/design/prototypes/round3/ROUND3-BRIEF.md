# Round 3 brief: 3D, motion, and neumorphism, pushed hard

Three styles, three designs each, nine in total. **Go heavy.** These are concept pieces meant to show
how far each style can go, so lean all the way in, while keeping them usable and accessible.

| Style | A · Launcher base | B · Portal base | C · Hybrid |
| --- | --- | --- | --- |
| **Immersive 3D** | `3d-launcher.html` | `3d-portal.html` | `3d-hybrid.html` |
| **Motion & animation** | `motion-launcher.html` | `motion-portal.html` | `motion-hybrid.html` |
| **Neumorphism** | `neu-launcher.html` | `neu-portal.html` | `neu-hybrid.html` |

All files go in `docs/design/prototypes/round3/`.

- **A · Launcher base** starts from `docs/design/prototypes/05-launcher.html` (left rail, home banner,
  continue card, dated updates, planner in the main pane).
- **B · Portal base** starts from `docs/design/prototypes/08-portal.html` (version filter, Phase 2 at a
  glance, dated "What changed in the data" feed, tier list, raid loot, professions, Your character →
  planner).
- **C · Hybrid** combines them: the Launcher's shell (rail + top bar + version chip) with the Portal's
  dense home content, and the planner one click away. **You may move, merge and reorder sections
  freely** to make the style sing; keep every piece of real content somewhere.

Data, quality colors, provenance and the technical rules come from `docs/design/prototypes/BRIEF.md`.
The earlier round-2 motion variants (`variants/05-launcher-motion.html`, `variants/08-portal-motion.html`)
are the baseline to beat for the motion designs: go well beyond them.

## The three styles

### Immersive 3D
Real-time 3D as the centrepiece, not decoration. Use **Three.js** (WebGL). Ideas to choose from or go
beyond:
- a hero scene: a slowly turning, lit, faceted crystal (a Tempest Keep / naaru-like prism) or a
  floating Serpentshrine pool with caustic light, built from primitives and shaders — no external models
  or textures;
- the 17 gear slots arranged in 3D around the character (a ring or orbit) that the camera moves through
  when a slot is chosen;
- a particle field or volumetric fog that reacts to the pointer and scroll;
- depth everywhere else: CSS `perspective` and `transform-style: preserve-3d` on cards, pointer-driven
  tilt and parallax layers, 3D flips between views.
Must have: a non-WebGL fallback (a styled static hero) if WebGL fails; pause rendering when the tab is
hidden or the canvas is off-screen; cap the device pixel ratio at 2; keep text in real HTML over or
beside the canvas, never painted into it.

### Motion & animation
Motion is the design. Use **GSAP** (core + ScrollTrigger, and other free GSAP plugins on cdnjs if
useful, e.g. Flip, TextPlugin, MotionPathPlugin, Observer), and optionally **Lenis** for smooth
scrolling. Ideas:
- a cinematic intro sequence, split-text headline reveals, scroll-driven storytelling (pinned sections,
  scrubbed timelines);
- Flip-animated layout changes (e.g. filtering the tier list, switching phase, moving into the planner);
- animated SVG (line drawing of raid emblems, morphing shapes), number tickers, magnetic buttons, a
  custom cursor on desktop, page-transition wipes between sections.
Must have: content visible without JS and before any trigger fires (never leave things at opacity 0
waiting for scroll); a safety that completes stalled timelines after ~1.5s; a visible Motion on/off
toggle (`aria-pressed`); everything stops under `prefers-reduced-motion`.

### Neumorphism
Soft UI, fully committed: elements extruded from and pressed into a single continuous surface with paired
light and dark shadows; pill and rounded forms; tactile toggles, knobs, sliders and switches; inset
fields and wells; minimal color, with item quality and status as the only strong hues.
- Build the whole planner from it: inset gear slots, extruded stat dials (e.g. a circular gauge for
  the hit cap at 140/142), soft segmented tabs, a neumorphic version filter.
- Offer **both a light and a dark neumorphic theme** (tokens + `prefers-color-scheme`, plus a toggle).
- Neumorphism's known weakness is contrast: fix it deliberately. Text must meet WCAG AA, and
  interactive elements need a clear non-shadow cue (an outline, icon or color) for state and focus,
  not shadow depth alone.
- Libraries are optional here (GSAP for tactile press/spring feedback is welcome).

## Libraries (load from these hosts only, pinned versions)

Scripts may load only from `cdnjs.cloudflare.com`, `cdn.jsdelivr.net/npm/`, or `unpkg.com`. Fonts only
from Google Fonts. Nothing needs installing: the pages load them at runtime. Suggested:
- Three.js r128 UMD: `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js` (defines
  `THREE`). Newer Three.js is ES-module only; if you need it, use an import map pointing at
  `https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js` and addons from the same version.
- GSAP 3.12.5: `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js`, plus plugins in the
  same folder (`ScrollTrigger.min.js`, `Flip.min.js`, `TextPlugin.min.js`, `MotionPathPlugin.min.js`,
  `Observer.min.js`).
- Lenis: `https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js` (defines `Lenis`).
- vanilla-tilt 1.8.1: `https://cdnjs.cloudflare.com/ajax/libs/vanilla-tilt/1.8.1/vanilla-tilt.min.js`.
No other hosts, no external images, models, textures or JSON. Generate everything in code.

## Shared must-haves

- Real data and real content from `BRIEF.md`; the planner with all 17 slots must be reachable.
- 400px and 1280px layouts, no horizontal page scroll, 16px gutters.
- Visible focus, semantic controls, `prefers-reduced-motion` honoured (3D scenes go static, motion
  stops), and the page fully readable if a library fails to load.
- Each file starts with `<!doctype html>` and its own `<head>`. Title like "3D · Launcher",
  "Motion · Hybrid", "Neumorphism · Portal". A direction line: "Round 3 · Immersive 3D · Hybrid.
  Prototype only, not the live app."
- Target 30–60 KB per file.

## Report back (for the documentation)

1. File path and size.
2. Libraries (name, exact version, URL, what for).
3. Fonts and palette tokens.
4. The four to six moves that make it "heavy" in this style.
5. Sections moved or merged, and why.
6. Performance and fallback measures (WebGL fallback, pausing, DPR cap, reduced motion, library failure).
7. Accessibility notes.
