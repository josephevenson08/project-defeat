# Project Defeat — session handoff

**Point-in-time snapshot.** Written 2026-08-01. If `git log` disagrees with anything below, trust git.

Verify you're where this describes:

```bash
git log --oneline -1     # expect 976c272 "Record the audit's tank finding in the brain, and unstick the roadmap"
git status               # expect clean except an untracked Untitled.canvas (user's own file, leave it)
git rev-parse main origin/main   # expect identical — everything is pushed
```

Repo: `C:\Users\josep\OneDrive - Saint Louis University\Project Defeat` (also on GitHub as
`josephevenson08/project-defeat`). It's a local-first React + TypeScript + Vite planner/simulator for
**WoW TBC Classic Anniversary**, aiming to be one place that does what Wowhead, WoWSims and
WarcraftLogs each do. The game is in **Phase 2** (Serpentshrine Cavern + Tempest Keep, Tier 5) and the
user wants Phase 2 content only.

---

## Read these first

The repo carries its own conventions, and they encode mistakes this project has already made twice:

- `.claude/skills/roadmap-feature/SKILL.md` — layer rules, how to wire a panel, the "never ship a module nothing renders" rule
- `.claude/skills/tbc-data/SKILL.md` — the `needsVerification` discipline
- `.claude/skills/brain-sync/SKILL.md` — the generated Obsidian vault
- `brain/Project/Roadmap Board.md` — generated, so never stale. The authoritative "what's next".

**The hard rules:**
- `domain/` never imports from `features/` or `components/`. Only architectural invariant.
- Never ship a panel or module nothing renders. This repo has done it three times now (raids panel, `buildSerialization`, a half-wired import).
- Any value not read off a real source gets `needsVerification: true`. Confident recall is *not* a source — this session proved that twice (see below).
- `src/styles/global.css` is CRLF. Append with CRLF or the diff shows the whole file changed.
- When `npx tsc -b` flags an unused import, find out what it was for before deleting. That's how half-finished work gets discovered here.

---

## Verify everything

```bash
npx tsc -b                        # clean
npm run lint                      # exit 0
npm run build
npx playwright test --reporter=line   # 51 passing. Use --reporter=line, not the default.
npm run brain                     # "all wikilinks resolve"
npm run brain                     # "0 written" — idempotent; this repo is in OneDrive, churn matters
```

---

## ✅ The simulator audit has now been run

The re-run completed and covered everything the previous handoff listed. **The yellow-damage layer
came back clean** — specials correctly cannot glance and correctly skip the dual-wield miss penalty;
`averageSwingDamage` folds AP as `(AP/14)*speed` with normalization touching only that term and never
the weapon's own dice average; all 22 catalogued weapons classify correctly under the
`weaponSpeed >= 3` heuristic (fragile at the boundary for future entries, but currently inert); flat
10/sec energy regen has **0.00%** mean-rate error against real quantized 20-per-2s ticks, because the
long-run average is exactly right; and counting blocked specials at full damage is capped at ~4.7% of
that ability's DPS in the worst case, realistically 0.1–1%. `applyRacialTraits` ordering is correct
and deliberate.

Three findings, outside that layer. Two are fixed:

- **Fixed** (`5e49673`) — Tank returned `scoreExact: score`, the *rounded* value, alone among the four
  role calculators. Both consumers difference that field, so tank stat weights and upgrade deltas were
  computed from display-rounded input. This was the original precision bug still live on one path.
- **Fixed** (`b14b4b3`) — `pickBestGemPerColor` left a socket empty when no gem of its colour helped
  the role. An empty socket forfeits the socket bonus *and* the stats, so it was strictly the worst
  option available.

### ⚠️ Still outstanding — the tank avoidance baseline is confirmed wrong

`calculateTankSurvivability` (`calculateSimulation.ts:351-352`) computes the player's own dodge and
parry with formulas character-for-character identical to `computeDodgeChance` / `computeParryChance`
in `attackTable.ts` — which are the **boss's** avoidance against the player. Against a level 73 target
this hands the player 14% baseline parry and 6.5% dodge, with the level gap *raising* avoidance. Real
TBC moves the other way off a ~5% base. Parry is roughly 3× too high before any gear, and because
stat weights difference the score, tank stat weights inherit it.

The old code comment called this a symmetric approximation pending sourcing. Symmetry is precisely
what does not hold, so the comment understated it. Written up in `brain/Domain/Concepts/Tank
Avoidance.md`.

**Not fixed, because fixing it needs real sourcing and this repo's rule is that confident recall is
not a source.** A `tbc-researcher` pass for real level-70 player avoidance was dispatched.

### Gotcha that probably explains the previous failure

**`.claude/agents/` is not registered as agent types in every environment.** In this session
`sim-verifier`, `tbc-researcher` and `worktree-reconciler` were all unavailable — only the built-in
agents (`general-purpose`, `Explore`, `Plan`, ...) existed, and dispatching `sim-verifier` failed
immediately with "agent type not found". That is a very plausible reason the earlier audit produced
no output at all.

The workaround, which works fine: dispatch a `general-purpose` agent and paste the contents of
`.claude/agents/<name>.md` into the prompt verbatim as its brief. Also instruct it to append findings
to a scratchpad file **as it goes** rather than only reporting at the end, so a cut-off run still
leaves something behind.

The racial sourcing pass **did** land and has been applied. Three racials keep `needsVerification`
where the research itself was inconclusive (Dwarf Stoneform's exact effect list, Draenei Gift of the
Naaru's level-70 heal, Tauren War Stomp's cooldown) — all three are non-modelled, so no number
depends on them.

## What the work so far did (all pushed)

Newest first. Every one is verified green and pushed.

| Commit | What |
|---|---|
| `976c272` | Tank avoidance finding recorded in the brain; stale roadmap prose corrected |
| `b14b4b3` | Upgrade finder no longer reports sockets it left empty |
| `5e49673` | Tank's `scoreExact` made actually exact |
| `f4e4247` | Corrected the handoff: the simulator audit failed rather than lagged |
| `a4fbfee` | Racial values corrected against Wowhead TBC tooltips; Draenei split into two class-gated racials |
| `86b7ed9` | This handoff file |
| `a5d4a12` | Named build slots — switching character no longer destroys your build |
| `d3c73f9` | Racial traits made mechanically real |
| `12c1902` | Replaced an invented item with sourced tooltip data for 3 items |
| `ccae74d` | Upgrade candidates scored **gemmed** instead of bare |
| `b7e0958` | Reconciled item catalog against researched raid data + permanent cross-check test |
| `020863a` | Melee special attacks layered onto physical DPS (yellow attack table) |
| `0cdb5a4` | Obsidian vault usable out of the box |
| `7ecf0db` | Build save/load wired into the UI |
| earlier | Stat weights/EP panel, encounter settings, upgrade finder, raids tab, signature abilities, brain vault |

### Two corrections worth knowing about

**The repo invented an item.** `justicars-warblade` never existed in TBC. An earlier pass *in this same session* concluded the real Fang of the Leviathan was a Mage dagger and invented a tank sword to dodge the collision. The premise was false — item 30095 is a one-handed **sword**, and it's simultaneously BiS for casters *and* Protection Paladins because TBC prot threat scales off spell power. Deleted, and Prot Paladin's BiS now points at the real item.

**A precision bug in stat weights.** Strength reported 2.02× attack power when the derivation makes it exactly 2.00. Stat weights and upgrade deltas were differencing a value already rounded to one decimal *for display*. `SimulationResult` now carries `scoreExact`; anything that computes uses it, display keeps `score`.

---

## What's next, in priority order

### 0. Correct the tank avoidance baseline — confirmed defect, needs sourcing first
See the outstanding section above. This is the only *known-wrong* number in the engine, as opposed to
the merely unverified ones, so it outranks everything below. It is small once the real values are in
hand: the formulas live at `calculateSimulation.ts:351-353`, and the fix is a defender-side
calculation rather than a reuse of the attacker-side helpers. Do not write the numbers from memory.

### 1. Multi-ability rotations — biggest remaining accuracy gap
Every path models exactly **one** ability per spec. Melee additionally drops any special whose sustained rate isn't computable. So melee specs are understated, by different amounts per spec.

This needs per-spec ability *lists* (`src/domain/abilities/` currently holds one signature ability each). It's a multi-hour feature done honestly — **don't half-do it**, that's this repo's recurring failure mode. Gotchas already discovered and recorded in the ability data's notes:
- Tank/cooldown abilities (Consecration, Shield Slam, Crusader Strike, Mortal Strike, Bloodthirst) are 6–10s cooldowns, not fillers. Modelling them per-GCD overstates output several-fold.
- Mutilate and Stormstrike strike with **both** weapons (`hitsBothWeapons` flag exists for this).

### 2. Item catalog audit — now has a visible reference point
214 `needsVerification` flags remain in `sampleItems.ts`. Three items now carry real Wowhead values and are **markedly stronger** than the estimated ones around them (Fang of the Leviathan: 221 spell power vs ~46 on placeholder caster weapons). Any sourced-vs-estimated comparison is skewed, and the upgrade finder ranks exactly those comparisons. Documented in README limitations. The `tbc-researcher` agent is the right tool.

### 3. Smaller, well-scoped
- **Profession bonuses** (Phase 3) — Blacksmithing sockets, Enchanting ring enchants, JC gems, LW drums/fur lining, Tailoring sets, Engineering goggles. Needs sourcing. The professions *reference* data already exists and is separate from this.
- **Feral bear/cat split** (Phase 3) — currently one physical-DPS spec.
- **Gear comparison** (Phase 5), source/cost planning, mobile layout.
- **Talent trees** (Phase 3) — large; nothing anywhere models talent scaling.

---

## Working notes

**Token efficiency** (the user hits 5-hour limits and asked about this directly):
- Playwright: always `--reporter=line`. For one failure: `-g "<name>"` piped through `grep -A12 "Error:"`.
- Chain `npx tsc -b && npm run lint` in one call. Piping through `head`/`tail` masks the exit code — use `${PIPESTATUS[0]}`.
- Browser checks: extract just the DOM slice with `javascript_tool`, not `get_page_text` (the planner page is 3000+ chars of dropdown options). Screenshots are the most expensive option.
- Never read a subagent's output file — it's the full transcript.

**Subagents:** 2–3 concurrent max, instruct them to commit incrementally, use `isolation: "worktree"` if they touch shared files, and restate any repo rules explicitly (they don't inherit them). Seven parallel agents once got cut off simultaneously with zero saved work. `.claude/worktrees` is eslint-ignored — don't undo that; it caused 287 spurious parse errors.

**Git:** the user authorised pushing this session and asked for it to be verified each time. Don't assume standing permission for a future session — ask.
