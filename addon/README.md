# Project Defeat Export — the addon, and how to build, test and publish it

**Written 2026-09-28.** The addon that carries a character out of the game in one string. The format
it produces, and the research behind every API call in it, are in
[`IN-GAME-IMPORT-SCOPE.md`](../IN-GAME-IMPORT-SCOPE.md); this file is the practical half — how to
work on it, how to check it without the game, and what CurseForge asks for.

> **Status: written and machine-verified, not yet run in the game.** Stage 2 of the five-stage plan.
> Two things are still outstanding, and neither is optional:
> 1. **One in-game session** (stage 3) to confirm the handful of API behaviours nobody can check from
>    outside the client. The checklist is at the bottom of this file.
> 2. **The site cannot read the string yet** (stage 1). Until the planner has an importer, the export
>    is a string with nowhere to go.

## What it is

Two files. No build step, no libraries, no dependencies.

```
addon/ProjectDefeatExport/
  ProjectDefeatExport.toc    9 lines of metadata
  ProjectDefeatExport.lua    ~300 lines including its comments
```

`/pdexport` (or `/projectdefeat`) opens a window with the export string already selected. The player
presses Ctrl+C. **An addon cannot write the clipboard** — `CopyToClipboard` is protected — so making
Ctrl+C the only remaining action is the whole design.

**What the string carries:** race, class, faction, level, professions, every talent with a point in
it, and every equipped item with its enchant and gems. **What it does not carry:** name, realm, GUID,
guild, or any free text. The addon makes no network calls of any kind; the string goes wherever the
player pastes it and nowhere else.

## Installing it to test

Copy the folder — not its contents, the folder — into the client's AddOns directory:

```
World of Warcraft\_anniversary_\Interface\AddOns\ProjectDefeatExport\
```

The folder name, the `.toc` name and the `.lua` name must all match, or the client ignores it. Then
either restart the client or `/reload`, and check the addon appears in the character-select AddOns
list with no "out of date" mark. `## Interface: 20506` matches client 2.5.6.69795; if the client has
patched since, `/dump (select(4, GetBuildInfo()))` prints the number the TOC should say.

## Checking it without the game

The addon runs in a real Lua 5.1 VM with the WoW API stubbed, which is how it was verified before
anyone logged in:

```bash
npm install fengari          # not a project dependency; install it where you run this
node addon/verify/run-addon.cjs
```

It loads the actual `.lua` file, stubs the API around it, invokes the slash handler the way the
client does, and checks what the addon tried to put in the edit box.

**Deliberately not a project dependency.** The app ships nothing from this, and adding a Lua VM to
`package.json` would put it in every install of a web planner. Install it in the moment you need it.

What the harness proves today, on a Phase 2 Fury Warrior:

| Check | Result |
|---|---|
| The file parses as Lua 5.1 | yes |
| The hand-built JSON is valid JSON | yes, 1,204 characters |
| Gear pieces read from `\|cnIQ4\|Hitem:` links | 17 |
| Talents exported, rank-0 excluded | 19 talents, 61 points |
| **Professions behind a collapsed header** | found — and the header is put back collapsed |
| Identifying fields present | none |
| A slot with no enchant or gems | omits both keys rather than sending zeros |

That last-but-one row is the one worth keeping: the skill list only reports what is expanded, so a
player who collapsed "Professions" would otherwise export none — and the planner would strip an
Enchanter's ring enchants as illegal. The harness models a collapsed header for exactly that reason.

**What the harness cannot tell you** is whether the real client returns what the stubs return. That
is what the in-game session is for.

## Publishing

### GitHub Releases first

Free, already where the code lives, and enough for WowUp to install from — WowUp needs a **tagged
release containing a packaged zip**.

```bash
cd addon && zip -r ProjectDefeatExport-1.0.0.zip ProjectDefeatExport/
gh release create addon-v1.0.0 addon/ProjectDefeatExport-1.0.0.zip \
  --title "Project Defeat Export 1.0.0" --notes "First release. /pdexport …"
```

The zip must contain the **folder**, so it extracts straight into `Interface\AddOns\`.

### Then CurseForge

What it asks for, from its own Moderation Policies and Project Submission Guide:

| Requirement | Where this project stands |
|---|---|
| A licence | **MIT**, added 2026-09-28 at the repo root, and declared as `## X-License: MIT` in the TOC |
| A distinct name, in English, with no game or version words | "Project Defeat Export" — no "WoW", no "TBC", no "2.5.6" |
| An avatar, 400×400, not a solid colour | **still needed** |
| Distinct summary and description | still to write |
| A changelog with every uploaded file | write one per release |
| No external download links in the description | the file goes to CurseForge itself |
| Donation or personal links only at the bottom | n/a |
| Compliance with Blizzard's EULA and add-on policy | the addon is free, has no ads, collects nothing, and makes no network calls |

The flow: create the project → it waits for **moderator approval** → upload the zip → the file goes
"Under Review" and can be sent back for changes. Pick the "Classic TBC" flavour, which is what the
WoWSims exporter uses for the same client.

**Automation, later.** BigWigsMods/packager publishes one git tag to CurseForge, WoWInterface, Wago
and GitHub together, reading `## X-Curse-Project-ID` from the TOC. Worth wiring once the project id
exists; a manual zip is fine for a two-file addon until then.

### Wago

An alternative, not a replacement: needs an account tied to a verified Blizzard or GitHub account,
and the developer agreement forbids collecting personally identifiable information — which this
addon does not do, by design.

## The in-game session (stage 3)

The checks nobody can run from outside the client. Each one is a `/dump` in chat; the point is to
confirm the addon's assumptions rather than to admire the output.

1. `/dump C_SpecializationInfo.GetTalentInfo({ specializationIndex = 1, talentIndex = 1 })`
   → does the result carry `talentID`, `tier`, `column`, `rank`? **Is `talentID` the same id the
   planner's talent trees use?** This is the largest unverified assumption in the design; the export
   carries tier and column precisely so a mismatch is survivable.
2. `/dump (select(4, GetBuildInfo()))` → does it equal the TOC's `20506`?
3. `/dump GetInventoryItemLink("player", 16)` → does the link start `|cnIQ` and contain `|Hitem:`?
4. Collapse the "Professions" header in the skill window, run `/pdexport`, and confirm both
   professions still appear **and the header is collapsed again afterwards**.
5. `/pdexport` on a character with an empty off hand, and on one with a two-hander.
6. Paste the result into a JSON validator.

Then commit the real export as a test fixture next to `addon/verify/fixture-export.json`, replacing
the machine-generated one. A real string from a real character is the thing the site-side importer
should be built against.

## What happens next

Stage 1 of the plan: the site-side importer that reads this string and applies it to the planner.
Two things are worth fixing first, both recorded in the plan as stage 0 — four enchants exist twice
in the catalogue with the BiS recommendations pointing at the duplicate, and fifteen enchants carry
no id the game's item links use. An import compared against that data would report a correctly
enchanted character as missing enchants.
