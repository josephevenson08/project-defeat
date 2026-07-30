---
type: concept
generated: true
tags: [brain/domain, domain/concept]
---

# Build Serialization

_Turning a planned character into something shareable._

A build is character profile + equipped gear + gems + enchants + active buffs, consumables, and target debuffs. Serialization exists so a build can be saved, exported, and re-imported without a backend — the whole point of staying local-first.

This is the foundation the planned CurseForge addon import lands on: the addon exports live in-game state, the site parses it into the same build shape, and every existing panel then works against the player's actual character instead of a hand-picked one.

## Where this lives in the code

- [[domain.builds.buildTypes]] — `src/domain/builds/buildTypes.ts`
- [[domain.builds.buildSerialization]] — `src/domain/builds/buildSerialization.ts`

## Related

- [[Phase 5 - Planner Workflows]]
- [[Phase 6 - In-Game Import]]

Up: [[TBC Knowledge Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
