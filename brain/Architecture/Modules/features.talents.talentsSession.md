---
type: module
layer: features
source: src/features/talents/talentsSession.ts
lines: 15
generated: true
tags: [brain/architecture, layer/features]
---

# features.talents.talentsSession

`src/features/talents/talentsSession.ts` · **features** layer · 15 lines

From the top of the file:

> Where the Talents tab is, kept by `App` for the session: the tree shown on a phone (one at a time
> there, with tree tabs) and the talent whose tooltip sits under the frame with − and +. The points
> themselves are the build's `talentPoints`, which the stat bar, the simulator and a saved build read.
> 
> Both are names a class's trees may not have once the class changes, so the tab checks them against
> the trees it draws and falls back to the character's own tree.

## Exports

**const** — `initialTalentsSession`

**type** — `TalentsSession`

## Imports

_None._

## Imported by

- [[App]] — `src/App.tsx`
- [[features.talents.TalentsPanel]] — `src/features/talents/TalentsPanel.tsx`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
