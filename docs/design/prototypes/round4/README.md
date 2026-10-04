# Round 4: Motion + 3D Portal (the chosen direction)

**Made 2026-10-03. Prototype only; not the live app.**

After round 3, the owner picked **3D · Portal's layout and Serpentshrine scene** plus the **motion of
Motion · Portal**, and asked for it to be aimed more squarely at the project's WoW goal. The Hybrid
designs were dropped. [`motion-3d-portal.html`](motion-3d-portal.html) is the result. It is the style
the [tab prototypes](../tabs/) are built in.

## What it is

- **Base:** a copy of `round3/3d-portal.html`, keeping its layout: a full-bleed WebGL Serpentshrine
  Cavern scene, glass cards floating on depth layers, rotatable 3D tier shelves, and a "3D scene on/off"
  toggle.
- **Motion ported from `round3/motion-portal.html`:**
  - an intro where the headline rises word by word and the cards rise onto their layers
  - a pinned "Phase 2 at a glance" card whose facts scrub in as the camera descends toward the water
  - a "What changed in the data" timeline that draws itself as you scroll
  - class filter chips that re-flow the tier list with Flip and rebuild the 3D shelves
  - a phase filter that re-lays out the cards with Flip and re-lights the scene
  - an amber curtain wipe into the planner while the camera dives below the water surface, then the 17 gear rows dealt in like cards, number tickers, and the hit gauge filling to 140/142
- **Aimed at the planner's job:**
  - The headline is "Gear your Fury Warrior for Serpentshrine Cavern and Tempest Keep".
  - The main actions are "Equip the recommended set" and "Import your character".
  - The hit cap (140/142, 2 under) and provenance sit next to the numbers.
  - Only real data from the brief is used.
- **The scene as WoW places:**
  - The prism reads as a naaru-like crystal with orbiting shards.
  - It has three palettes: Serpentshrine Cavern (teal water, naga blue, coral), Tempest Keep (arcane gold over violet) and Phase 1 (warm).
  - A hero toggle switches between the two Phase 2 raids, and the phase filter overrides it.
  - The page and the scene share a small `window.SCENE` interface: camera values, palette mix and motion on/off.

## Libraries

All four come from cdnjs:
- **Three.js r128:** runs the scene.
- **GSAP 3.12.5:** all the motion.
- **ScrollTrigger:** the pinned scroll story and the self-drawing line.
- **Flip:** the re-flowing filters and the phase re-layout.
- **TextPlugin:** text that types itself in.

## Checks

**Automated checks** (Playwright with Edge):
- Loaded at 400px, at 1280px, and at 1280px with reduced motion. No sideways scroll, script errors or invisible content.
- Loaded with WebGL disabled. The static gradient fallback shows, and the only console message is Three.js reporting the missing WebGL context.

**Visual review:** desktop screenshot.

**Fixed:** the page title still said "3D · Portal". It now says "Motion + 3D · Portal".

**Changes the designer made, and why:**
- The glance card moved out of the parallax columns, because pinning doesn't work inside transformed wrappers.
- The Sort A–Z chip and the SVG emblem were dropped: the shelves already sort by rank, and the crystal plays the emblem's role.
- The raid backdrop is switched by toggle, not by scroll, so two animations never fight over the palette.
