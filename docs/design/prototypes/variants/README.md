# Round 2: Launcher and Portal in six styles

**Made 2026-10-03. Prototypes only; nothing here is the live app.**

From the [ten round-1 directions](../README.md), the owner picked **05 · Launcher** and **08 · Portal**.
Each was redone in six visual styles. Every variant keeps its base prototype's structure, sections,
navigation, real data (the Human Fury Warrior Phase 2 set) and interactions; only the visual language
changes. The rules every designer worked to are in [`VARIANT-BRIEF.md`](VARIANT-BRIEF.md).

| Style | Launcher (05) | Portal (08) |
| --- | --- | --- |
| Minimalism | [05-A](05-launcher-minimalism.html) | [08-A](08-portal-minimalism.html) |
| Skeuomorphism | [05-B](05-launcher-skeuomorphism.html) | [08-B](08-portal-skeuomorphism.html) |
| Glassmorphism | [05-C](05-launcher-glassmorphism.html) | [08-C](08-portal-glassmorphism.html) |
| Neo-Brutalism | [05-D](05-launcher-brutalism.html) | [08-D](08-portal-brutalism.html) |
| Bauhaus | [05-E](05-launcher-bauhaus.html) | [08-E](08-portal-bauhaus.html) |
| Motion | [05-F](05-launcher-motion.html) | [08-F](08-portal-motion.html) |

The request named six styles, so there are six variants per direction (12 in all).

## Libraries

Only the two motion variants load a library. Every other style is plain CSS and vanilla JavaScript,
because their effects (blur, texture, geometry, hard shadows) are all native CSS.

| Library | Version | Source | Used by | For |
| --- | --- | --- | --- | --- |
| GSAP | 3.12.5 | `cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js` | 05-F, 08-F | Timelines, staggers, count-ups, view transitions, drifting backgrounds, `quickTo` parallax |
| GSAP ScrollTrigger | 3.12.5 | `cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js` | 08-F only | Revealing feed entries that start below the fold, `once: true` |

05-F deliberately skipped ScrollTrigger: a scroll-triggered entrance leaves content invisible until the
trigger fires, which can fail inside a scaled thumbnail. 08-F uses it only for content below the fold,
creates each tween at the moment of entry, and adds a 1.2-second safety that jumps any stalled timeline
to its end state.

Textures in the skeuomorphic and glass variants are inline SVG `feTurbulence` noise as CSS data URIs.
There are no image files. All fonts come from Google Fonts, each with a fallback stack.

## The six styles at a glance

| Style | Theme | Fonts (05 / 08) | The idea in one line |
| --- | --- | --- | --- |
| Minimalism | Light (08 also dark) | IBM Plex Sans + Plex Mono, both | Color only where it means something; hierarchy from size, weight and space; lines instead of boxes |
| Skeuomorphism | Dark | Cinzel + Alegreya Sans + Plex Mono / Courier Prime | Real materials (leather, brass, steel, stone, wood, cork) and buttons that physically press |
| Glassmorphism | Dark | Sora + Nunito Sans / Marcellus + Figtree, JetBrains Mono | One frosted-glass recipe over drifting, blurred color shapes, with a solid fallback |
| Neo-Brutalism | Light / Dark | Archivo Black + Archivo + JetBrains Mono, both | Thick borders, hard offset shadows, flat loud blocks, a visible grid |
| Bauhaus | Light | Jost + Red Hat Mono / DM Mono | Circles, squares and triangles in primary colors that carry meaning, on a strict asymmetric grid |
| Motion | Base theme kept | Base fonts kept | The same page with an orchestrated load, view transitions, count-ups and a living background |

---

## Each variant

### Minimalism

**05-A · Launcher.** 23 KB, no libraries. IBM Plex Sans with Plex Mono for numbers only. Light paper
(`#f7f6f2`) and ink (`#16161a`). Epic is darkened to `#7a32c4` for contrast, amber `#9a5600` marks the
hit-cap shortfall, and a green dot marks the live phase. Everything else is ink on paper.
- Lines instead of boxes: an underlined search field and tabs, row rules in the gear table, and a 2px hit meter with a tick at the 142 cap.
- Text-only navigation with an ink dash for the current section. One filled button; secondary actions are text links.
- Dropped from the base: rail icons and tooltips, banner art, the PD mark, avatar and class crest, green enchants, the gold T5 box and colored tier blocks. Cards became lists.

**08-A · Portal.** 24 KB, no libraries. Plex Sans (including Light 300 for big headings) and Plex Mono.
Light and dark themes through tokens, with no brand accent at all.
- No boxes: each section is a 1px ink rule with a small uppercase label, with hairlines between rows.
- A new editorial headline ("Serpentshrine and Tempest Keep are open.") and big light mono stats.
- The version filter reads as a sentence ("Showing TBC Classic at Phase 2"), and its dot turns grey for an earlier phase.
- Tier letters are plain ink. Amber appears only for the hit-cap shortfall.

### Skeuomorphism

**05-B · Launcher.** 37 KB, no libraries, three inline SVG textures (leather grain, hide grain, stone).
Cinzel for carved and stamped headings, Alegreya Sans for body, Plex Mono for readouts.
- Three materials with one job each: brushed steel with rivets for the rail, top bar, tabs and stat panels; tooled leather with a stitch line for cards and the table; a carved stone tablet in a bronze frame for the banner, with a faceted gem.
- Physical keys that sink when pressed. The current one stays pressed in with an amber lamp.
- Instruments for numbers: amber readout wells, a glass-tube hit meter with a tick at 142, and an engraved brass provenance plate with screws.
- Physical tokens: wax seals on update cards, struck coins for S/A/B tiers, gem sockets for item icons.

**08-B · Portal.** 32 KB, no libraries, inline SVG wood, leather, cork and metal textures. Cinzel for
brass plates, Alegreya Sans for body, Courier Prime for a typed-ledger feel. A guild-hall notice board:
- A dark wood wall, stitched leather boards and polished brass heading plates.
- The version filter sits on an iron rail. Phase is a two-position brass switch (real radio inputs) beside a lit lamp that announces changes.
- The data-change feed is a cork board of pinned, slightly tilted index cards on sage paper, avoiding the cream-parchment cliché.
- Enamel coins for tier letters, glowing gems for the 4/5 set count, and a wax-seal strip for the hit-cap warning.

### Glassmorphism

**05-C · Launcher.** 32 KB, no libraries. Sora, Nunito Sans and JetBrains Mono. A dark sky with five
blurred, drifting color shapes (teal, amber, rose, cobalt and jade, deliberately not a purple-to-blue
hero).
- One shared frosted-glass treatment (`blur(20px) saturate(150%)`) with a brighter top edge where light catches it.
- A floating layout with gaps between panels, and a glass dock at the bottom on phones.
- Active states are "lit glass" with a teal glow, sub-tabs are a pill segmented control, and the banner has a faceted glass diamond.

**08-C · Portal.** 25 KB, no libraries. Marcellus (an inscription-like serif with a Tempest Keep
temple feel), Figtree and JetBrains Mono. A Serpentshrine palette: a deep-water "abyss" base with
shapes in sea teal, deep water, kelp, arcane gold and a little coral.
- One glass recipe for every panel, with a lighter glass layer inside each for depth.
- Gold marks active states and teal marks links, so the two accents never compete.
- Single dark theme, since glass needs a dark, colorful backdrop.

### Neo-Brutalism

**05-D · Launcher.** 28 KB, no libraries. Archivo Black, Archivo and JetBrains Mono. Light cream with a
visible 32px grid; flat yellow, blue, pink, green, orange and cyan blocks; 3–4px ink borders; hard
zero-blur shadows.
- A black rail slab. The active section is a yellow block with a pink shadow, and buttons press on click.
- Color blocks carry meaning: dated update bars, S/A/B tier blocks, and hit 140/142 singled out in orange to match the cap meter.
- Big blunt uppercase titles, a black table header, and provenance printed as a yellow-on-black "stamp".

**08-D · Portal.** 25 KB, no libraries. Same fonts. A **dark** brutalist take instead of
cream-and-yellow: a black ground with a construction grid, raw-concrete panels, and two signal colors
with fixed jobs.
- Hazard orange `#ff4d00` marks the active item, the main action and S tier. Caution yellow `#ffd400` marks provenance, links, A tier, the hit-cap warning and focus.
- Numbered black heading bars (01–06), and "PROJECT / DEFEAT" with DEFEAT on an orange block.
- Buttons press like switches, and the selected sub-tab stays pushed in.

### Bauhaus

**05-E · Launcher.** 34 KB, no libraries. Jost (the closest Google face to Futura) and Red Hat Mono.
Paper, ink, and primary red, blue and yellow.
- The banner is a 7/5 grid with an inline-SVG composition: a red circle over a blue square, a yellow triangle, black bars and construction lines.
- Shape carries meaning: a glyph per section, slot icons by family (square for armor, circle for jewelry, triangle for weapons), and tiers as S circle, A square, B triangle.
- Data as geometry: the hit meter is a blue bar with a red tick at 142.

**08-E · Portal.** 30 KB, no libraries; every shape is CSS (`border-radius`, `clip-path`, border
triangles). Jost and DM Mono.
- A poster header with a huge uppercase DEFEAT and a geometric composition. The current section in the black nav band becomes a yellow block.
- A strict 12-column grid with off-balance modules numbered 01–06. "Your character" is a solid blue block, and professions get a full-width band with a large red "300".
- Shapes carry meaning, with a printed key under each module: phase, feed entry type and tier letter.

### Motion

**05-F · Launcher.** 40 KB. GSAP 3.12.5. Base fonts and palette kept.
- An orchestrated load: the rail slides in, the PD diamond spins into place, then the banner and cards follow, and the stats count up.
- A living banner whose glows drift on 14–21 second loops, with a slowly turning rune, a scrolling floor grid and mouse parallax.
- View switches with their own choreography: 17 gear rows stagger in, the hit meter fills to 140/142, and tier badges pop. A sliding accent bar follows the current section.

**08-F · Portal.** 33 KB. GSAP and ScrollTrigger 3.12.5. Base fonts and both themes kept.
- A load sequence through the header, glance cells, feed entries one by one, count-ups and tier letters that pop with a spin.
- Changing the phase sweeps an accent bar and refreshes the content. Phase 1 now shows real Phase 1 content, announced to screen readers.
- A staggered transition into the planner, and three drifting blurred shapes behind the page.
- The first-screen sequence runs about 2.5–3 seconds before the last box (raid loot) settles. It is the longest load sequence of the set.

---

## Accessibility across the set

- **Contrast.** Item quality colors were adjusted per palette: epic is darkened on light grounds (about `#7a1fc7`–`#7d2ccb`) and lightened on dark ones (about `#c590ff`–`#cf9bff`), and always reads as purple. Each designer estimated AA by calculation. Nobody measured it with a contrast checker in a browser.
- **Yellow** is only ever a fill under black text in the Bauhaus and Brutalism variants.
- **Focus.** Every variant has a visible focus outline, switched per background where needed (e.g. an inset yellow outline on black rails).
- **Glass.** Both glass variants keep a dark tint and limit the opacity of the shapes behind text. An `@supports` fallback swaps glass for solid panels.
- **Motion.** The motion variants are fully visible and usable without JavaScript, if GSAP fails to load, and with reduced motion on. Both add a visible Motion on/off toggle (`aria-pressed`). Every other variant has no motion beyond short button-press transitions, and those turn off under reduced motion.
- **Keyboard.** Several variants added arrow-key navigation (roving tabindex) to the planner sub-tabs, which the base Portal lacked.

## How these were made and checked

1. **One designer agent per variant, run in waves of four to six.** Each read the base prototype, the
   shared brief and the variant brief. To avoid the stalls of round 1, they wrote each file in pieces
   and did not use a browser.
2. **Each designer reported back** libraries, fonts, palette, key decisions, accessibility notes and
   changes from the base. Those reports are the source of the sections above.
3. **Automated checks** (Playwright with Edge) loaded every variant at 400px and 1280px, and at
   1280px with reduced motion on. They checked for:
   - horizontal page scroll
   - script errors and failed loads
   - requests to hosts outside the allowlist
   - on-screen text still invisible 2.5 seconds after load
4. **A visual review** of contact sheets at both widths.

**Fixes made after review:**
- 08-D scrolled 20px sideways at 400px because a single-column grid wouldn't shrink. Fixed with `minmax(0, 1fr)`.
- 08-D's nav squeezed beside the logo on phones. It now takes its own row.
- 08-F's slow first-screen sequence was reviewed and kept, because everything is visible by about 3 seconds and the safety timer covers thumbnails.

**Not done:** nobody clicked through every tab and control by hand, and contrast was never measured
with a tool.
