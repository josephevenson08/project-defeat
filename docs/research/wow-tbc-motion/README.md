# TBC motion research

How to make Project Defeat's animation feel like World of Warcraft: The Burning Crusade Classic
Anniversary, done 2026-10-04 by two research agents working in parallel. The citation rules are those of
the [gaming UI study](../gaming-ui/README.md): every claim carries a source ID, every source is tiered
and dated, and weak sources never stand alone behind a recommendation.

**Start with [`recommendations.md`](recommendations.md):** the proposed "TBC motion kit" and where each
piece goes, tab by tab.

| File | What it covers |
| --- | --- |
| [`identity.md`](identity.md) | Track A. What TBC looks and moves like: Dark Portal, Outland skies, fel, naaru, Blood Elf arcane, interface. Also the Phase 2 raids, and what Blizzard has published for TBC Anniversary. |
| [`usage-rules.md`](usage-rules.md) | Track B1. What a free fan tool may use directly, what only as inspiration, and what to avoid. |
| [`techniques.md`](techniques.md) | Track B2. How to build each effect with Three.js r128 and GSAP, with performance and accessibility rules. |
| [`prior-art.md`](prior-art.md) | Track B3. How Raider.IO, Icy Veins, Warcraft Wiki, WoWSims and Blizzard's site use motion. |
| [`sources-a.md`](sources-a.md), [`sources-b.md`](sources-b.md) | Every source, with tier, publisher, date, URL and the claims it supports. |
| [`log-a.md`](log-a.md), [`log-b.md`](log-b.md) | Every search, every source accepted or rejected and why, and each researcher's recheck. |

## Verified by the session lead

- **Phase 3 is live.** Black Temple and Mount Hyjal opened on 27 Aug 2026. Blizzard's news page loaded with the title "BCC Anniversary Edition: Black Temple Now Live". The app stays on Phase 2 on purpose, by the owner's choice.
- **DrawSVG needs GSAP 3.13.0.** `DrawSVGPlugin.min.js` returns 404 on cdnjs at GSAP 3.12.5, and 200 at 3.13.0. So do SplitText, MorphSVG, Flip, ScrollTrigger and TextPlugin.
- **The "Game Content Usage Rules" are Microsoft's.** The page at xbox.com loaded with no mention of Blizzard. The app's zone-map credit cites that policy, so it was raised as a separate fix for the owner to decide.

## Limits

- Most lore detail about zones and raids comes from Warcraft Wiki, which is tiered Weak. It is used only as design inspiration and is labelled that way.
- Some material could not be described because it was unavailable: Anniversary key art, the TBC logo typeface, and Blizzard's default tooltip colours.
- Wowhead and Icy Veins blocked automated reading (HTTP 403).
- Blizzard's legal pages are undated and were not archived.
- Prior art was judged from each site's shipped code, not by watching the pages.
- The code sketches in `techniques.md` are untested.
