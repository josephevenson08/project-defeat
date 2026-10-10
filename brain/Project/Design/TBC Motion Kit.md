---
type: design
generated: true
tags: [brain/project, project/design]
---

# TBC Motion Kit

_tbc-kit.js: the shared crystal-and-water scene and every animation, all procedural, shared by all seven tab pages._

Built once and exposed as `window.TBCKit`; each page hands it its Three.js scene through the `window.SCENE` contract written at the top of the file. Its motion is tuned to TBC by the motion research.

- **Themes:** the five raid scenes (Serpentshrine, Tempest Keep, Hellfire, Blade's Edge, Karazhan) and the four tab themes, each with its detail: bubbles, one light per raid group, rank rings and ore glints. Themes crossfade over 1.2s.
- **Effects:** a crystal swell, embers, a rune ring, entry rings, a rebirth burst, a taint tint and a lift, each tied to a real action (equip, import, simulate).
- **Fallbacks:** a Motion switch and a 3D switch, a still frame for reduced motion, a CSS gradient in each tab's colour when WebGL is off, and performance tiers that settle after about two seconds of real frames.
- **No Blizzard art and no sound.** Everything is drawn in code.

## Documents

- [[docs/research/wow-tbc-motion/README|TBC motion research]] — `docs/research/wow-tbc-motion/README.md`
- [[docs/research/wow-tbc-motion/recommendations|What the kit was built from]] — `docs/research/wow-tbc-motion/recommendations.md`

## Related

- [[UI Refresh]]
- [[Tab Prototypes]]

Up: [[UI Refresh]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
