---
type: module
layer: domain
source: src/domain/raids/bossArt.ts
lines: 24
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.raids.bossArt

`src/domain/raids/bossArt.ts` · **domain** layer · 24 lines

From the top of the file:

> Which bosses have a panel in `public/raids/bosses`, and which do not.
> 
> **The app used to assume all of them did.** `RaidsPanel` built every card's background from
> `raids/bosses/<id>.jpg` without checking, so the eleven encounters still waiting on art — Nightbane
> and the whole of Serpentshrine and Tempest Keep — each rendered as a 400px black panel with a
> gradient over nothing and a 404 behind it. A participant in the 2026-09-21 usability study read
> that as a failed image, which is exactly what it was.
> 
> Generated rather than hand-listed, by the same script that writes the files: art is dropped in and
> ingested, so a list maintained by hand would be wrong the first time the owner adds a picture and
> right again only when someone remembered this file existed.

## Exports

**function** — `hasBossArt`

**const** — `bossArtCount`

## Imports

_None._

## Imported by

- [[features.raids.RaidsPanel]] — `src/features/raids/RaidsPanel.tsx`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
