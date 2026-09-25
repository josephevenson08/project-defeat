# Heuristic evaluation: the owner's own walk-through

**Recorded 2026-09-25.** The owner ran a Nielsen-style heuristic evaluation of the live site
(<https://josephevenson08.github.io/project-defeat/>) for a class assignment. Unlike
[`USABILITY-STUDY.md`](USABILITY-STUDY.md), whose twelve participants were simulated, this was done
by a real person. Each finding was checked against the code on the day it was recorded, and all of
them still hold.

**The task:** make a character, fill the gear list with the items, gems and enchants you want, then
find where that gear drops, or for crafted gear, where its materials come from. The third part raised
no findings.

## Findings

Severity uses Nielsen's 0–4 scale: 2 is minor, 3 is major.

| # | What happened | Heuristic | Severity | Checked against the code |
|---|---|---|---|---|
| 1 | The Race step says "Your race decides which classes you can take", but picking a race shows nothing about which classes it allows. To compare races you have to go forward to Class and back again. | Match between system and real world | 2 | **Holds.** Race options are bare labels (`CharacterCreator.tsx:112`). Only the Class step filters by race. |
| 2 | The Specialization step gives no description of the specs. | Match between system and real world | 2 | **Holds.** This is the study's finding 6, which is still open. It needs sourced text for all 27 specs. |
| 3 | The planner you land on after creation is overwhelming: 17 gear slots, the creation choices, professions, a long Stats list, and Key Totals that look like a second Stats list. | Aesthetic and minimalist design | **3** | **Holds.** It is a judgement about layout, not a bug. |
| 4 | Opening a gear slot gives a lot of information and nothing that says what to do next. | Visibility of system status | 2 | **Partly.** The popup does say where the equipped item ranks (`ItemPopup.tsx:207`), but it doesn't tell a newcomer what to do, or offer "take the top-ranked item". |
| 5 | Choosing an item has no confirmation, so you can't tell it was taken until you close the popup. | Visibility of system status | 2 | **Holds.** Changes apply on click. There is a close `×` (`ItemPopup.tsx:119`) but no confirmation step or message. |

**What worked:** the front page. Five large cards with short, plain titles let a first-time visitor
pick a direction without reading the smaller text. The owner credits it with minimalist design,
consistency and a clear title.

## The owner's read of the pattern

- Two findings are "match between system and real world" (1, 2), and two are "visibility of system
  status" (4, 5). The owner's diagnosis: the site was written from a developer's view of the data,
  not a first-time player's. Study findings 4 and 6 reached the same conclusion.
- The planner (finding 3) breaks both minimalism and visibility at once. It is the most work, and the
  owner would **fix it first**, because it sets the direction for everything after creation. Findings
  4 and 5 are cheap once that is settled: a prompt in the popup, and a visible confirmation.

## Suggested changes, and what needs the owner

| # | Suggested change | Notes |
|---|---|---|
| 1 | Show which classes a race can play on the Race step, as a line or chips under each race. | Small, and `getClassesForRace` already exists. |
| 2 | One line per spec on playstyle and gear. | Same blocker as study finding 6: needs sourced text for 27 specs. |
| 3 | Rework the planner: creation choices at the top, gear below, and Stats and Key Totals merged into one table. The owner also suggested **removing the professions selector** from this screen. | **The owner decides.** Removing professions from here changes a feature, and the redesign is large. Ask first. |
| 4 | A one-line prompt in the gear popup, plus a "use the top-ranked item" shortcut. | The shortcut overlaps the study's "equip this whole list" request. |
| 5 | Visible confirmation on selection, for example an "Equipped" state on the chosen item, or a "Done" button. | Changes apply live, so this would acknowledge the choice rather than gate it. |
