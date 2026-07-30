---
type: phase
number: 6
status: not started
generated: true
tags: [brain/project, project/phase, status/not-started]
---

# Phase 6 - In-Game Import

**Status: not started**

A companion WoW addon that exports live character state for the planner to read.

## Done

_None._

## Remaining

- Build the CurseForge addon that reads equipped gear, gems, enchants, talents, professions, recipes
- Export to a copyable blob or SavedVariables file
- Parse the blob client-side and diff it against the spec BiS list
- Run the simulator against real gear instead of a hand-picked build

## Key modules

- [[domain.builds.buildSerialization]] — `src/domain/builds/buildSerialization.ts`

## Neighbours

- [[Phase 5 - Planner Workflows|Previous phase]]

Up: [[Roadmap Board]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
