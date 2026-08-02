# Project Defeat — session handoff

**Point-in-time snapshot.** Written 2026-08-01. If `git log` disagrees with anything below, trust git.

Verify you're where this describes:

```bash
# A handoff cannot name its own hash, and naming the tip goes stale on the next commit. So check
# the shape instead: the tip should be one of the commits in the table below, everything should be
# pushed, and the suite should be green.
git log --oneline -5
git status                       # clean except an untracked Untitled.canvas (user's own file, leave it)
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
npx playwright test --reporter=line   # 54 passing. Use --reporter=line, not the default.
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

Three findings, all outside that layer, and **all three are now fixed**:

- **Fixed** (`5e49673`) — Tank returned `scoreExact: score`, the *rounded* value, alone among the four
  role calculators. Both consumers difference that field, so tank stat weights and upgrade deltas were
  computed from display-rounded input. This was the original precision bug still live on one path.
- **Fixed** (`b14b4b3`) — `pickBestGemPerColor` left a socket empty when no gem of its colour helped
  the role. An empty socket forfeits the socket bonus *and* the stats, so it was strictly the worst
  option available.
- **Fixed** (`3ac33a7`) — the tank avoidance baseline. `calculateTankSurvivability` reused the
  attacker-side helpers for the player's own dodge and parry, so it handed the player the *boss's*
  14% parry and made a wider level gap look like better tanking. TBC has two different tables and the
  level gap enters them with opposite sign. Sourced from wowsims/tbc `sim/core/target.go` and written
  up in `brain/Domain/Concepts/Tank Avoidance.md`.

  Four things fell out of that research and are also fixed: `RATING_PER_PERCENT.parry` was **31.5**,
  taken from a blue post dated *before TBC shipped*, when patch 2.1.0 cut parry rating cost 25% —
  it's now 23.65, matching wowsims. Defense Skill is applied per-outcome instead of as one bonus
  multiplied by 3. Parry is gated to classes that can parry and block to actually holding a shield.
  Boss miss chance now counts as avoidance. Dodge from Agility is modelled for Warrior/Paladin/Druid,
  the only three wowsims sources a ratio for.

  **The Survivability Score is not comparable across that commit** in either direction — the baseline
  correction lowers it, the two new terms raise it more.

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
| `0f5ccd5` | Fury and Arms Warrior get a real two-ability rotation (Whirlwind) |
| `ace8c52` | Off-hand swing halved on both-weapons specials — a live bug, found by research not the audit |
| `fbd3389` | Recorded where the cost of multi-ability rotations actually sits |
| `a27d8c8` | Druid dodge ratio marked unreachable until the Feral split |
| `59708c6` | Tank incoming attacks resolved as one ordered table; crushing blows modelled |
| `3ac33a7` | Defender-side attack table for tanks; parry rating corrected to the post-2.1 value |
| `a77bf3c` | Handoff updated with the audit results and the agent-registration gotcha |
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

### 0. Decide what the tank Survivability Score should actually measure
The mechanics underneath it are now right — one ordered incoming table (miss, dodge, parry, block,
crit, crushing blow, hit), crushing blows modelled, avoidance no longer summed. What's left is a
judgement call rather than a defect, which is why it wasn't made unilaterally.

The headline score is still `avoidance*2 + armor*1.5 + stamina*0.1`. Those weights are invented, and
the score treats a crit and a plain hit as equally bad once they land. The breakdown already carries
a `Damage taken per swing vs. unmitigated` figure that does price crit and crush multipliers, and it
is a better metric — it means something physical. Promoting it to the headline would make tank scores
non-comparable with saved ones again, so it needs a deliberate call.

One known softness in that figure: a blocked swing counts as a full hit, because block subtracts a
flat block value rather than a fraction and the swing damage isn't in scope at that point. It reads
slightly pessimistic for a shield tank.

### 1. Multi-ability rotations — started, 2 specs of 27 done
**Fury and Arms Warrior** now press Whirlwind on its 10s cooldown alongside Bloodthirst / Mortal
Strike. **Every other spec still models exactly one ability.** All specs still drop any special whose
sustained rate isn't computable, so melee remains understated by differing amounts.

The machinery is done and is not the constraint: `getRotationAbilities(class, spec)` returns a spec's
ability list, `resolveRotation` sums the computable ones against a shared GCD budget so a spec can't
press more buttons per second than the global cooldown allows, and excluded abilities are named in the
UI rather than dropped. Adding a spec is now purely a matter of sourcing its abilities and appending
them to that class's file — **after** the signature entry, since `getSignatureAbility` returns the
first match for a class/spec.

The GCD cap doesn't bind at present (Bloodthirst + Whirlwind is ~0.27 casts/sec against a 0.67
budget). It's there because the first modellable rage or energy filler would hit it immediately.

**Two specs were researched and deliberately not added. Read this before picking the next one —
"source the abilities and append them" is not always the whole job.**

- **Retribution Paladin.** Its only computable addition is Judgement of Blood (10s cooldown, and it
  doesn't even trigger the GCD). But it's Holy-school damage scaling off spell power *while rolling
  crit off the melee crit table* — neither a clean `Melee Special` nor a clean `Direct Damage`.
  `resolveRotation` filters to `Melee Special`, so adding it today is data nothing consumes. **The
  engine gap: a physical spec with a computable non-physical rotational ability has nowhere to go.**
  Everything else Ret presses is genuinely out of scope — the Seals are passive auras that proc on
  auto-attacks rather than buttons, and Exorcism only works on Undead and Demons.
- **Feral Druid — was a live bug, now fixed.** Cat form doesn't use the equipped weapon's damage at
  all; TBC substitutes a fixed internal weapon (43.5-66.5 at 1.0s) that every cat ability reads.
  `averageSwingDamage` was reading the equipped item's dice, so Feral damage scaled off a staff the
  form never swings — in both the white and the special paths. Now modelled via `CAT_FORM_WEAPON`.

  The thing that made this look like a hard decision turned out to be a false premise: Feral Attack
  Power is **an explicit item stat** added 1:1 into attack power, not a derived DPS conversion, so
  there was no unverifiable constant to agonise over. **The remaining gap is item data, not the
  model** — no item in the catalog records Feral Attack Power, so Feral weapon comparisons
  under-differentiate. Adding that stat is the single highest-value thing for Feral accuracy.

  Mangle (Cat) (45 energy, 160% weapon damage + 264) and Rake (spell 27003, 40 energy, 78 + 0.01xAP
  plus a 9s bleed) are both sourced and computable. **They are still not added, and the reason has
  changed** — see the energy note below.

**Energy contention — read before adding a second energy ability to any spec.**
`computeUsageRate` derives an energy ability's rate as `10 / cost`, which by construction spends the
*entire* 10/sec regen. So one energy ability already consumes the whole budget, and adding a second
naively double-counts it: Shred at 60 energy plus Mangle at 45 would claim 20 energy/sec against the
10 that exists, and nothing in the output would look wrong. `resolveRotation` now tracks an energy
budget alongside the GCD budget to stop that.

The guard is correct but it is **not the answer for Feral**. Priority-order allocation gives Shred
the whole pool and leaves Mangle at zero, which is not how a cat rotation works — Mangle is pressed
to maintain a debuff, not for its own damage, so it doesn't fit priority-by-position at all.
Allocating a fixed energy pool between competing abilities is an optimisation problem. Adding Mangle
today would produce a technically-guarded but still wrong answer, so it is held back.

Note the guard does not bind with any current spec (every energy spec has exactly one energy
ability), so it is preventive rather than exercised. The first spec that gets two will exercise it.

Rip, Ferocious Bite, Heroic Strike, Slam and Execute are all correctly excluded and should stay that
way until rage/combo-point income is simulated. Rampage and Tiger's Fury are pure self-buffs with no
damage component. Savage Roar does not exist in TBC.

This needs per-spec ability *lists* (`src/domain/abilities/` currently holds one signature ability each). It's a multi-hour feature done honestly — **don't half-do it**, that's this repo's recurring failure mode.

**Where the cost actually is — worth knowing before you plan this.** The engine is *already*
ability-agnostic. `estimateSpecialAttack`, `computeUsageRate` and `computeSpecialDamagePerUse` in
`specialAttacks.ts` all take a `SignatureAbility` and work for any ability you hand them; the only
thing that is single-ability is `getSignatureAbility(class, spec)` returning exactly one, and the DPS
path calling it once. So the engine work is small — an ability list plus a GCD-contention model, since
summing `usesPerSecond` across abilities would otherwise let a spec press more buttons per second than
the GCD allows.

The real cost is **data**. Every additional ability needs sourced base damage, coefficients, cooldowns
and rage costs, and the `needsVerification` rule means none of it can come from recall. Build it one
spec at a time — source that spec's abilities, wire it, ship it, and state plainly which specs are
still single-ability. An engine merged ahead of its data is a module nothing renders.

Gotchas already discovered and recorded in the ability data's notes:
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
