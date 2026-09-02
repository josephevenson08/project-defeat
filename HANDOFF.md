# Project Defeat — handoff

**Started 2026-08-09, substantially rewritten 2026-08-15, current to 2026-09-02.** Self-contained
brief for picking this up in a fresh chat. If `git log` disagrees with this file, trust git.

---

## Start here (2026-09-02, the Professions tab is a book rather than a wall)

**Pick a profession, get its own page.** The tab was a thirteen-card picker with the whole selected
profession printed underneath it — a tier table, nineteen farm rows and up to thirty maps, all
competing with the choice of profession. It is now an entry grid of icon-and-name cards that opens
one page per profession, laid out the way a levelling guide actually reads: a skill range, what you
gather or craft in it, and the trainer visit that gates the next one.

### The bug this found, which is the fourth instance of a rule this repo wrote down itself

**28 of 43 ingested node materials never reached the screen**, and the data had been right the whole
time. `ProfessionsPanel` joined a route to a row with `node.material === spot.material` — exact string
equality against a *display label*:

```
"Liferoot / Fadeleaf / Goldthorn"          -> matched nothing (all three had full coordinates)
"Thorium Ore (incl. Rich Thorium Vein…)"   -> matched nothing (Thorium Ore had full coordinates)
```

Eight of Herbalism's nineteen rows and two of Mining's eleven silently drew nothing, so **the entire
1-300 herb progression was mapless on screen** in the same session that shipped 14,091 coordinates.

| | Before | After |
|---|---|---|
| Farm rows drawing a map | 15 | **25** |
| Zone maps reachable | 29 | **90** |
| Node materials reached | 15 / 43 | **38 / 43** |

**Every profession test passed throughout, and that is the part worth keeping.** They asserted the
*data* — 45 nodes, no crates, sampling preserves zone width — and not one asserted that a node
reaches a surface. That is precisely "data wired to nothing", which the Decision Log names as this
project's signature failure and lists three prior instances of. This is the fourth, and it landed in
the same commit that wrote the rule down. There is now a reachability test, and the declared-gap list
in it is named rather than counted so adding a gap fails rather than losing a map.

The fix is `MaterialFarmSpot.materials` — the individual names, listed explicitly rather than parsed
out of the label at render time. A split on "/" would have worked until a label contained one for
another reason.

### What each page carries now

- **A skill range is the unit**, because it is what a player matches against their own skill bar.
- **Zones are tabs, not stacked maps.** A 1-100 range spans six starting zones; six near-identical
  squares in a column is the same information at six times the height.
- **One map per range, merging every material in it.** At 1-100 you are picking Peacebloom,
  Silverleaf *and* Earthroot on the same lap of Durotar, so that is one loop over three merged clouds
  rather than three pictures of the same ride. The caption names which herbs the zone actually
  carries and how many of each — 352 spawns, 31 stops, Silverleaf (150) · Peacebloom (117) ·
  Earthroot (85).
- **The tier table is gone and its content is not.** `trainingMilestones` turns it into markers
  placed in the progression at the skill where the bar stops moving — "Train Expert at skill 125".
  The field it reads is `minSkillToTrainNext`, whose name reads backwards from what it holds: on
  Expert it is 125, the skill Expert becomes *trainable* at, not where Expert ends. Reading
  `skillRange[0]` would have told a player to train at 150, fifty points after they got stuck.
- **Crafting steps keep their shape** — `300-325 · 496x Bolt of Netherweave · 2,976 Netherweave
  Cloth` — which the 300-375 data already had.

### Routes are 11.5% shorter, and that is 2-opt rather than a better heuristic

Nearest-neighbour leaves crossings, and a crossing is the one route error a player sees immediately:
it reads as "why am I riding back past where I just was". 2-opt reverses segments while that shortens
the loop. Measured across every real node cloud: **25,925 → 22,942**. Still a heuristic, still says so
on screen — the caption now reads "visits the busiest clusters nearest-first, then uncrosses itself —
a strong starting line rather than a proven optimum".

### Material icons, from a source already vendored

`materialIcons.json` joins material *name* to icon, because trade goods are not in the item catalogue
and never will be — nobody equips Peacebloom. It reads the same MIT-licensed wowsims CSV at the same
pinned commit as the item icons, so the two cannot describe different item sets. **69 of 73 resolve**;
the four that do not are recorded under `missing` rather than discovered later, and are cases where
the node and the item it yields are named differently (Netherdust Bush yields Netherdust Pollen).

### Three things this deliberately did not do

- **Crafting 1-300 is still nine placeholder rows** saying "see a dedicated vanilla guide". They now
  render dimmed and distinct from real steps rather than identically to them, so the page stops
  implying a detail it does not have. This is the next piece of work and it is a data job.
- **Five ingested herbs are named by no farm row at all** — Arthas' Tears, Firebloom, Flame Cap,
  Grave Moss, Purple Lotus. Their coordinates are in the bundle and nothing points at them. That is a
  content gap in the rows rather than a join bug, so it was left rather than papered over.
- **Crafting materials get no icons yet**, because `keyMaterials` is still prose in places — "15
  Golden Sansam, Dreamfoil or Mountain Silversage, whichever matches the craft you picked". Splitting
  a quantity off the front of a sentence to hang an icon on it is the same "a label is not a key"
  mistake this session just spent its morning undoing. They get icons when they get structure.

### Two things that cost this session time, both worth not rediscovering

**A suite run goes silent for 2.8 minutes and it is not hung.** `tests/planner.spec.ts:3039` — "no
spec can equip, default to, or be upgraded into an unobtainable item" — takes **2.8 minutes on its
own**, verified by running it alone. With the `line` reporter that is three minutes with no output
around test 86 of 223, which looks exactly like a stall, and this session killed a healthy run
because of it. The tell that it was alive: the node process was burning CPU steadily. Check that
before killing a run, and expect the whole suite to take **~9 minutes**.

**Only Tirisfal Glades carries all three starter herbs.** Durotar has Peacebloom and neither of the
others. A new test asserted three herbs in Durotar, and the suite failed it — 222 passed, that one
did not, and the data was right. The merge is correctly selective per zone, which is a feature: a
zone tab shows what is actually there rather than what the range names. The assertion now covers both
directions, because the original could not have failed in the direction that mattered — a merge
wrongly claiming every herb in every zone would have passed it.

### And the owner's steer on sourcing, recorded

The two wow-professions.com guides are the **reference for shape, not the source for content**. The
repo's standing rule — routes linked, never copied — is unchanged, and the same move that made the
maps possible applies to the crafting half when it is filled in: take recipe materials and skill-up
colours as facts and *compute* the craft counts, rather than transcribing a published "102x Bolt of
Linen Cloth". The existing 300-375 rows describe themselves as transcribed, which is closer to that
line than the rest of the repo sits, and is worth revisiting when they are next touched.

---

## Start here (2026-09-02, the owner set the priority and it is not the simulator)

**The README was edited by the repo owner on 2026-09-01, and it is a scope decision this file was
contradicting.** `6c618fc` is the only commit since the Professions work, it touches the README and
nothing else, and it says the simulation rule model is **"not my top priority with this project"**
right now — that it gets implemented "later on into this planner", and that the target is **phase 2
of The Burning Crusade**, usable for phase 2 and beyond once the model works.

No code changed. What changed is which open item is next, and two sentences in this file said the
wrong thing about that:

- **"25 of 27 specs are still single-ability approximations, which is now the top of the queue"** —
  written 2026-08-21, true then, and since overruled by the owner. The count is still right; the
  queue position is not.
- **"Rotations are the biggest remaining gap"** — still true as a *modelling* gap and left standing
  as one. A modelling gap and the next piece of work are different claims, and this file had been
  using the first to assert the second.

Both are corrected in place below rather than deleted, because the reasoning that put rotations at
the top of the modelling queue is still the right reasoning *about rotations*. What it is not is a
statement about what to build next.

### "Phase 2" means the game's phase, not this roadmap's

Worth pinning before it gets misread, because the two numbers collide on the same word:

| Where | "Phase 2" means |
|---|---|
| `ROADMAP.md` | This project's second milestone — Gear, Gems, Enchants |
| `README.md`, the owner | **TBC content phase 2** — Serpentshrine Cavern and Tempest Keep |

They are unrelated numbering schemes. The BiS data has always targeted the *content* phase, so the
README is confirming the existing data target rather than moving it.

### Today's focus is the Professions tab and its logic

Stated by the owner at the top of this session, ahead of a walkthrough that has not happened yet —
two attempts to start the dev server were interrupted, and a third session died on a full context
window before the handoff edit landed. That edit is this section.

The tab is at its largest and has never been looked at by its owner in a browser: **45 nodes, 14,091
spawn coordinates, 29 route maps** (11 Herbalism, 18 Mining) across all 13 professions. Expect the
next work to come out of that walkthrough rather than out of this file's queue.

---

## Start here (2026-08-30, the Professions tab has farming routes)

**Every gathering node in the game, and a route drawn from where they actually spawn.** 45 nodes,
**14,091 real spawn coordinates**, covering the whole 1-375 climb rather than Outland alone.

### It is an ingest because the alternative was taking someone's work

`professionTypes.ts` has recorded since it was written that wow-professions.com's routes are
**"linked, never copied"** — they are that site's craft. That decision still stands, and this does not
touch it. Wowhead publishes the **spawn coordinates** of every gathering node as plain data, and a
loop computed from those points is our own work rather than theirs.

**And Blizzard's zone art cannot be vendored**, which turned out to be a design rather than a
limitation: coordinates are percentages of a zone's own extent, so plotting them on a bare square
reproduces the shape of the farmable region without reproducing the map. The node cloud *is* the
picture. A player who knows the zone recognises it instantly.

### How a route is computed

Spawns bucket into a **16x16 density grid**; cells at 35% or more of the busiest earn a stop;
nearest-neighbour orders them into a circuit. Felweed in Hellfire Peninsula: 245 spawns, 81 cells,
26 stops. Copper in the Barrens: 13 stops.

It is a heuristic and **the caption says so on screen**, not only in the source — "a starting line
rather than an optimal one". The optimum is a travelling-salesman problem nobody needs solved here.

Density is **opacity on one neutral**, and the route takes the profession accent the card already
carries. A red-to-green heat ramp would break the one rule this design is built on: item quality owns
saturated colour and nothing competes with it.

### Only two professions have maps, and that is the game rather than a gap

**Herbalism (11 maps) and Mining (18)** are the professions with world nodes. Skinning comes off mobs,
Fishing off pools, and the eight crafting professions consume materials rather than gathering them.

**All thirteen still carry information**, which was the requirement: tiers and trainer levels for every
one, zones plus skill range plus character level for the four gathering ones, and recipe paths for the
eight crafting ones.

### Three things the ingest caught, and one it got wrong

- **Crates.** The first pass swept a range of object ids and kept whatever came back, which pulled in
  a Crumpled Map, a Dalaran Crate and an Excavation Supply Crate — objects sitting between the herb
  ids. Every node is declared with the name Wowhead must return now, so a wrong id fails.
- **The sampling stride.** Wowhead returns coordinates sorted by x, so thinning 2.3 MB down for the
  bundle by slicing the first N would have cut the eastern half off every zone and the map would have
  confidently shown nodes in the wrong place. Sampled by stride, asserted against synthetic data.
- **Two nodes have no spawn data at all** — Ragveil and Ancient Lichen both return an empty
  `g_mapperData`, checked live rather than from cache. Recorded so the absence reads as known.
- **And one assertion I had to walk back**: I claimed every zone spans more than 20% of its width, and
  a real one spans 1.7%. That is a legitimately tight cluster, not truncation. The real-data check is
  scoped to sampled zones now.

### Three suite runs died before one gave a verdict, all my fault

Worth recording because each failed differently and the second masked the first:

1. **Edited `src` during a running suite** — that run described no single version of the code.
2. **Started a second suite while the first was still going** — `reuseExistingServer: true` meant it
   adopted the first run's dev server, and the first took that server down on exit. Result: 21
   failures across planner panels, raid composition and layout, every one
   `net::ERR_CONNECTION_REFUSED`. It looked exactly like a broad regression.
3. **The session ended mid-run**, killing it at 221/221 before the summary printed.

The compromised run also reported **"exit code 0"** through the task notification while
`SUITE_EXIT=1` sat inside the file — the wrapper's exit, not the suite's. That is precisely the case
the repo's "never gate on a piped tail" rule exists for, arriving through a channel the rule does not
name. **Read the exit code the suite itself wrote.**

---

## Start here (2026-08-27, the harness measures a build a raider plays)

**The calibration harness used a build nobody plays.** It filled a spec's primary tree in listed
order to 61 points — not realistic, and **not a ceiling either**, because a real 41/20 split can be
worth more than 61 points down one tree. It cost a measurable number twice in one hour before this:
it handed a Demonology warlock a talent that spec does not use, and it made Demonic Sacrifice read
as exactly zero for the two specs that take it, because they take it out of a second tree.

`tools/ingest/ingest-talent-builds.mjs` reads **wowsims' own presets for 17 of the 20 DPS specs**.

### It is an ingest because upstream writes builds as named fields

Not opaque talent strings, which is what made this tractable:

```go
var defaultDestroTalents = &proto.WarlockTalents{
    ImprovedShadowBolt: 5,
    Shadowburn:         true,
}
```

Field names are matched to the Wowhead-ingested trees by stripping everything but letters and digits,
so one rule handles apostrophes, spaces and hyphens alike. Anything unmatched **fails the run** rather
than being dropped — the same discipline the effects ingest already uses.

### Two conflicts the ingest caught, and how each was settled

- **`PiercingIce: 5` against a 3-rank talent.** An allocation the game would not accept. Clamped to
  the ingested tree's cap and **reported**, because the Wowhead trees are the game's own data on what
  a talent can hold. Two presets do it.
- **`FaerieFire` against "Faerie Fire (Feral)".** A genuine naming difference, handled by an explicit
  alias rather than fuzzy matching — a near-match is exactly how an effect ends up keyed to the wrong
  talent, and this repo has already had to get that particular distinction right once before.

### What moved, and it was not small

    Warrior Arms          1166 -> 1325   (1.5x -> 1.3x)
    Hunter Survival       1201 -> 1263   (1.4x -> 1.3x)
    Mage Arcane            995 -> 1045   (2.1x -> 2.0x)
    Rogue Combat          1098 -> 1151
    Druid Feral            879 ->  927
    Paladin Retribution    966 ->  999
    Rogue Subtlety        1220 -> 1167   (down)

### The three specs with no preset keep the old rule

Hunter Marksmanship, Warlock Affliction and Warlock Demonology, on the repo owner's call — a stated
fallback rather than an invented build. The calibration test **prints which specs use which**, because
a sourced spec and a synthetic one are not the same measurement and mixing them silently would make
the column look more uniform than it is.

### Two honest consequences, asserted rather than smoothed over

- **Upstream's Subtlety preset spends 38 of 61 points.** So that spec is measured at a genuinely
  incomplete build and reads *lower* than it would at a full one — a talent gap the ratio will
  attribute to the model. It went 1220 → 1167 for that reason and no other.
- **Upstream's Destruction build takes Demonic Sacrifice for +15% Shadow, which reaches none of this
  repo's Destruction rotation** — Immolate and Incinerate are both Fire. Upstream's Destruction casts
  Shadow Bolt and ours does not. The talent is in the build, correctly applied, and worth zero.

Neither is a model defect, and both are reasons a ratio can move for a reason that is not the model.
That is worth knowing before reading the next table.

---

## Start here (2026-08-27, spell school, and a measurement that caught an either/or)

**`SignatureAbility` records a spell school now**, for all 18 caster abilities that have one, each read
off its own `SpellSchool` upstream rather than inferred from the class. That matters for the ones
that surprise: a Druid's **Starfire is Arcane**, not Nature, and a Shaman's **Lightning Bolt is
Nature** rather than the Frost its icon suggests.

`TalentModifiers.schoolDamageMultipliers` is the field it unlocks — structured like `statFactors`,
keyed by school, `{}` as the identity — and **Demonic Sacrifice is its first user**.

### The measurement caught a bug no test would have

Wiring it up, Demonology jumped 855 → **968**. That looked like a win and was not: the best-case
harness fills a spec's primary tree, so a Demonology warlock owns Demonic Sacrifice — and was
collecting the +15% **while also keeping the Felguard**, which upstream's `else` makes impossible.

**Owning the talent is not using it.** Upstream gates the bonus on `DemonicSacrifice &&
SacrificeSummon` — the talent *and* the choice — and a Demonology warlock spent those 41 points on
Summon Felguard. `sacrificesDemon(spec)` is now the one place that either/or is decided, used by both
the pet and the multiplier, and Demonology is back to a correct 855.

Worth recording how it surfaced: **a number moving in the right direction for the wrong reason**. No
assertion existed to catch it, because the bug was a spec holding two mutually exclusive things and
every individual value was right. Measuring after every change is what found it.

### The feature is correct and currently invisible, and that is worth saying plainly

At best case it moves **nothing**, because the harness fills one tree: only Demonology reaches Demonic
Sacrifice, and Demonology is the one spec that does not use it. A real Affliction or Destruction
warlock dips into Demonology for exactly this talent — a build the one-tree harness cannot express.

So the mechanism is asserted directly instead: an Affliction warlock handed the talent gains exactly
**1.15x** (every spell it casts is Shadow), a Destruction warlock gains **nothing** from a Shadow
bonus (every spell it casts is Fire), and a Demonology warlock gains nothing at all. That second
assertion is the one with teeth — folding the multiplier into the shared term would pass the first
and fail it.

### What is left

1. **The rest of what spell school unblocks.** Shadow Weaving, Improved Shadow Bolt, Ignite — the
   per-spell talent groups that make up most of the 43 still refused by name. The field they were
   waiting on exists now.
2. **A best-case harness that can express a real build.** It fills one tree to 61, which no TBC
   warlock actually plays. This is the first time that has cost a measurable number, and it will cost
   more as per-spell talents land.
3. **Cleave and Intercept**, the Felguard's own abilities, and Demonic Frenzy as a real stacking aura.
4. **Weapon-enchant and damage procs**, **Mangle**, and the assorted buff items.

---

## Start here (2026-08-27, the demon, and half of it is blocked)

**Demonology gets its Felguard.** 752 → 855, a 2.2x → **1.9x** ratio. The caster path had no pet
concept at all before this — exactly as `calculatePhysicalDps` did not before 2026-08-23 — so the
plumbing was most of the work, which is the order this repo insists on for the same reason every
time: shipping data nothing reads is its recurring failure.

### A demon is either a pet or a damage multiplier, never both

`sim/warlock/warlock.go` makes it one branch:

```go
if warlock.Talents.DemonicSacrifice && warlock.Options.SacrificeSummon {
    Succubus -> ShadowDamageDealtMultiplier *= 1.15
    Imp      -> FireDamageDealtMultiplier   *= 1.15
    Felguard -> ShadowDamageDealtMultiplier *= 1.10
} else {
    warlock.Pet = warlock.NewWarlockPet()
}
```

**So only Demonology gets a pet here, and that is sourced rather than chosen.** Affliction and
Destruction sacrifice — upstream's *only* preset is a Destruction warlock sacrificing a Succubus —
and what the sacrifice buys is a **school-scoped** multiplier this simulator cannot express. That is
one more item on the list spell school already blocks, and the most valuable one on it: it is worth
15% of a caster's damage.

Summon Felguard is the 41-point Demonology talent, so for that spec the demon *is* the spec.

### The structural difference from the hunter's pet

**Attack power comes from the owner's spell power**: `(SpellPower + ShadowSpellPower) * 0.57`. A demon
scales off the stat its owner already stacks, which is why it could not simply reuse `hunterPet.ts`.

Then a flat **1.65x on the finished attack power** — `ap * 1.5 * 1.1`, which upstream comments as
"demonic frenzy + hidden 10% boost". The 1.5 is a Demonic Frenzy upstream says it is *simulating* as
pre-stacked rather than modelling; the 1.1 is labelled only as hidden. Both carried across as read,
on the same principle as the hunter pet's unexplained `0.85`.

**Its conversions are its own.** Strength at `(strength - 10) * 2` — the offset is not a typo — and
Agility at 0.04 crit percent a point, against the hunter pet's one percent per 33. Two pets, two
conversions; a test asserts they differ, because assuming they shared one was the easy mistake.

**There is no family damage multiplier.** Both `PetConfig.DamageMultiplier` and the line applying it
are **commented out** upstream, so a demon needs none of the assumed-family treatment the hunter pet
carries. Pinned, so nobody copies that across on the assumption every pet has one.

### What is left

1. **Spell school**, which is now the single highest-value item on the list. It blocks Demonic
   Sacrifice (+15% to a school, for two of the three warlock specs), the per-spell talent groups
   Ignite and Shadow Weaving sit in, and partial resists.
2. **Cleave and Intercept**, the Felguard's own abilities, and Demonic Frenzy as a real stacking aura
   rather than a pre-stacked constant.
3. **Weapon-enchant and damage procs** — 0 of 91 enchants carry one.
4. **Mangle**, whose prerequisite the bleeds just met.
5. **Windfury Totem, Expose Weakness, Deep Wounds, Elemental Weapons.**

---

## Start here (2026-08-27, Feral bleeds and a new worst spec)

**Rake and Rip land, and Feral stops being the outlier.** 728 → 879, a 2.3x → **1.9x** ratio.

### Bleeds ignore armor, and upstream says so in a comment

`sim/core/spell_resistances.go`:

```go
if spell.SpellSchool.Matches(SpellSchoolPhysical) {
    // All physical dots (Bleeds) ignore armor.
    if spellEffect.IsPeriodic { return }
    spellEffect.Damage *= attackTable.ArmorDamageReduction
}
```

Worth about **26% of every tick** against this app's 7,700-armour target, and getting it wrong would
have been silent. It took four fetches to find — armour is applied in `applyResistances`, not in the
outcome applier or the damage calculator where you would look first — and it was worth every one,
because the alternative was recalling it.

**Rake's opening hit is not periodic, so it takes armour while its own ticks do not.** A split inside
one ability, which is why `estimateFeralBleeds` returns the halves separately and the test asserts
the loss from armour is *exactly* the opener.

**Rip's opening cast deals nothing at all** — `OutcomeFuncMeleeSpecialHit()` with no base damage. The
cast exists only to apply the dot and spend the points, so all of Rip is six ticks that ignore armour.

### A bleed is not priced like a special

A special's rate is how often you can afford it; **a bleed's is how often it falls off**, because
refreshing early throws the remainder away. So each is modelled at one cast per its own duration, and
the ceilings decide whether even that is affordable — which for Rip means combo points as well as
energy, since it is a finisher.

They compete with Shred for the same energy, which is the trade `ROTATION-SCOPE.md` already warns
about. **What makes these worth it where Mangle was not is the armour split**: Shred loses a quarter
to armour and a bleed tick loses none, so a bleed's effective return per energy beats its raw one.

### Two things this pass got wrong first

- **The bleed block was nested inside the rogue branch.** I anchored the insertion to a comment that
  happened to sit inside `if (className === 'Rogue')`, so it never ran for a druid — and the symptom
  was Feral reading *exactly* unchanged, which is a much better failure than reading slightly wrong.
- **Shred had no combo-point value**, so Rip was unaffordable and silently sat at zero uptime. One
  point a cast, read from `AddComboPoints` in `shred.go` rather than assumed.

### Ferocity is a fourth shared talent name, and the sharpest yet

**Hunter's Ferocity grants the pet crit; Druid's discounts Rake by one energy a rank.** Same name,
different classes, unrelated effects. They cannot collide because effects are keyed by talent id and
every extractor is cross-checked against its own class's tree — the same protection Precision, Weapon
Mastery and Dual Wield Specialization already rely on. A test asserts both directions.

### The worst spec is Warlock Demonology now, at 2.15x

Feral improving pushed the calibration's upper bracket, so `featureFlags.ts` was rewritten for the
**fourth** time the bracket has forced. The range is now **1.05x to 2.15x**.

And what Demonology is missing is the same thing the hunter was: **a pet**. Its demon is unmodelled,
which is why Master Demonologist is still refused with "No pet model here" — now the one place that
phrase is still true. The hunter pet work is a fairly direct template for it.

### What is left in stage 3

1. **Mangle**, whose prerequisite is now met — its `PeriodicPhysicalDamageTakenMultiplier *= 1.3` has
   two bleeds to multiply at last. The existing test's measurement still holds (Shred returns more per
   energy than Mangle *directly*); whether the 30% on two bleeds pays that back is the open question,
   and the test comment says so rather than being deleted.
2. **Weapon-enchant and damage procs** — 0 of 91 enchants carry one; Mongoose is the recommended
   main-hand for three specs.
3. **Warlock's demon**, now the largest single gap in the table — and **already sourced**, so the next
   session can start building rather than fetching. `sim/warlock/pet.go` and `pet_abilities.go` are
   cached. What it says:

   - **The inheritance is from spell power, not attack power**, which is the one structural difference
     from the hunter: `AttackPower = (SpellPower + ShadowSpellPower) * 0.57` and
     `SpellPower = same * 0.15`, plus Stamina 0.3, Intellect 0.3, Armor 0.35. So a demon scales off
     the caster stat its owner already has, and the existing `hunterPet.ts` shape transfers almost
     directly.
   - **Three demons, and the spec decides which.** Felguard (Demonology) is melee — an 83.4-123.4
     weapon on a 2.0s swing, base AP 20 / Str 153 / Agi 108, Cleave and Intercept. Succubus is melee
     with Lash of Pain. Imp is a caster with Firebolt. Each carries its own base `stats.Stats` block.
   - **There is no family damage multiplier.** Both `PetConfig.DamageMultiplier` and the line that
     would apply it are **commented out** upstream — so unlike the hunter pet, nothing here needs the
     assumed-family treatment. Worth knowing before someone copies that part across.
   - The blocker is the same one the hunter had before 2026-08-23: `calculateCasterDps` has no pet
     concept at all, exactly as `calculatePhysicalDps` did not.
4. **Windfury Totem, Expose Weakness, Deep Wounds, Elemental Weapons**, and **spell school**.

---

## Start here (2026-08-27, poisons close the rogue)

**The three that make a rogue a rogue are all in.** Poisons are the second unmitigated damage source
this model has, after Retribution's seals, and the first that is not physical *and* not a swing.

    Rogue Combat          1033 -> 1098   (1.7x -> 1.6x)
    Rogue Assassination   1050 -> 1161   (1.3x -> 1.2x)
    Rogue Subtlety        1160 -> 1220   (1.1x)

Assassination gains most, and that is the model working rather than a coincidence: **all three poison
talents live in its tree** — Improved Poisons, Vile Poisons and Master Poisoner.

### Nature damage, on the spell table, and both halves matter

**They do not take armour.** Upstream gives them `SpellSchoolNature`, so they join `unmitigatedDps`
beside the Paladin seals rather than the physical path. Against this app's 7,700-armour target that
is about a quarter of them, and a test moves the target's armour and asserts the physical rows move
while the two poison rows do not.

**They roll on the spell table**, `OutcomeFuncMagicHitAndCrit` rather than the melee one — so they use
**spell hit**, which a rogue has essentially none of. That is exactly why Master Poisoner exists, and
why its +5% a rank is its own `poisonSpellHitChance` field rather than the shared one: it is scoped to
two spells rather than to the actor.

**The dot cannot crit and Instant Poison can.** The ticks get `OutcomeFuncTick()`, a plain hit. Handing
the dot a crit multiplier would be exactly the quiet overstatement the damage table exists to expose,
so a test pins the asymmetry.

### The imbue-slot gap, named rather than guessed

Upstream reads which poison sits on which hand from `Consumes.MainHandImbue` — a player choice, and
this app has no weapon-imbue slot, the same gap Windfury Weapon already names. Rather than reason
about which pairing is better, this takes the one `presets.go` ships as `FullConsumes`: **Instant
Poison main hand, Deadly Poison off hand**.

The hand is not cosmetic. `GetMeleeProcMaskForHands` builds each poison's proc mask from the hands
carrying it, and the two weapons swing at different speeds, so swapping them changes both rates.

### Deadly Poison's steady state is sustained, not assumed

Five stacks is the cap, and the model returns **the stacks the proc rate can sustain** capped there
rather than asserting the cap. A slow off-hand or a heavily missing rogue genuinely holds fewer, and
asserting five would hide that. What is not modelled is the ramp — roughly the first seventeen seconds
of a several-minute fight, in the understating direction.

### What is left in stage 3

1. **Weapon-enchant and damage procs** — 0 of 91 enchants carry a proc effect, and Mongoose is the
   recommended main-hand for three specs at 53.48% measured uptime.
2. **Windfury Totem, Expose Weakness, Deep Wounds, Elemental Weapons.**
3. **Spell school**, which blocks four separate things.
4. **Feral is now the clear outlier at 2.3x** and still needs bleeds — Rake and Rip, with the measured
   warning that adding Mangle before them is a DPS loss.

---

## Start here (2026-08-27, stage 3 begins with the rogue)

**Slice and Dice and Combat Potency, and every rogue spec gained about a fifth.** This is the top of
the architecture report's leverage order, and it is the first work in this project on a spec other
than the hunter in a while.

    Rogue Combat          846 -> 1033   (2.0x -> 1.7x)
    Rogue Assassination   867 -> 1050   (1.6x -> 1.3x)
    Rogue Subtlety        960 -> 1160   (1.3x -> 1.1x)

### Slice and Dice is a finisher that deals no damage

Which is why it fits nowhere in `SignatureAbility`: it spends 25 energy and five combo points to make
the rogue swing **30% faster**. The ability schema describes things that hit; this changes how often
everything else does. It lives in `domain/simulation/sliceAndDice.ts` for the same reason
`weaponImbues.ts` exists — a buff folded into white damage rather than layered on top.

**Three ceilings, and the combo-point one is the interesting one.** A refresh needs energy, a global
cooldown (**1 second, not 1.5**, and `IgnoreHaste`), and five combo points. The points are what can
actually bind, because five points is five fillers and the filler's own rate is energy-bound.

**Relentless Strikes makes it exactly free**, and that is two constants cancelling rather than an
approximation: it hands back 25 energy against a 25 energy cost. A talented rogue pays only the
global cooldown and the points, which is why the buff sits at 100% without visibly costing anything.

### The fixed point the architecture report predicted is real

Slice and Dice speeds both hands → faster off-hand swings → more Combat Potency procs → more energy →
a higher filler rate → the combo points to refresh Slice and Dice. Iterated in three passes, the same
treatment Frenzy got.

**Combat Potency reads landed off-hand hits and nothing else** — upstream checks `Landed()` and then
`ProcMaskMeleeOH`, citing the spell's own mask of 8838608. Main-hand swings and specials return zero,
which is exactly why the talent is worth what the off-hand swing rate is worth, and why it and
Improved Slice and Dice sit in the same tree.

### One field was worth 30 percentage points of uptime

Assuming one combo point per filler read an Assassination rogue at **70%** Slice and Dice uptime
against a real 100%, because **Mutilate grants two**. `SignatureAbility` gained `comboPointsPerUse`,
read from `AddComboPoints` in each ability's own upstream file — Mutilate 2, Sinister Strike 1,
Hemorrhage 1. Assassination went 987 → 1050 on that one field.

**And my recollection of which tree holds what was wrong**, which is worth recording because the repo
already has a rule about it. I expected Improved Slice and Dice in Assassination; the ingested
Wowhead data puts it in **Combat**, row 1. The ingest won, as it has every previous time this project
has tested curated memory against sourced data.

### The line-ending trap fired again

`abilityTypes.ts` is `w/crlf` while `signatureAbilitiesRogue.ts` is `w/lf`, in the same directory. A
scripted edit matching `...Cost\n` found nothing in the first and reported success. `git ls-files
--eol` before the edit is the rule, and it is the rule because this keeps happening.

### What is left in stage 3

1. **Poisons** — Instant (26891, 146-194, 20%+2%/rank proc) and Deadly (27186, 30%+2%/rank, a 4-tick
   12s DoT stacking to 5 at 180/4 a tick). Both **Nature damage**, so they are unmitigated by armour
   and take the same care Retribution's Holy damage needed. Both are sourced in
   `sim_rogue_poisons.go`, already cached. The open question is which poison sits on which hand:
   upstream reads `Consumes.MainHandImbue`, and this app has no weapon-imbue slot — the same gap
   Windfury Weapon already names.
2. **Weapon-enchant and damage procs** — 0 of 91 enchants carry a proc effect, and Mongoose is the
   recommended main-hand for three specs.
3. **Windfury Totem, Expose Weakness, Deep Wounds, Elemental Weapons.**
4. **Spell school**, which blocks four separate things and would also settle where poisons belong.

---

## Start here (2026-08-27, and the pet is finished)

**Frenzy and Focused Fire land, and that closes the hunter pet.** Beast Mastery **1500 → 1565**, a
1.4x → **1.3x** ratio; the pet is **18.4%** of a best-case BM hunter, up from ~6% when this queue item
opened. Marksmanship and Survival are unchanged, because both talents are Beast Mastery.

### Frenzy is not Flurry, and that is the whole modelling content

Flurry is three stacks a white hit *consumes*, so its uptime is a Markov chain over the stack count.
Frenzy is a fixed 8-second duration any proc *refreshes* and nothing consumes — so the question is
"was there a proc in the last 8 seconds", which for a Poisson process is `1 - exp(-8λ)`, and the
multiplier is simply `1 + 0.3 · uptime`. A duration aura needs no swing-weighting, because the clock
runs the same either way.

**It has a fixed point, and it is iterated rather than solved.** λ counts the pet's crits, and those
come partly from auto attacks whose rate Frenzy itself raises — faster swings, more crits, more
uptime, faster swings. Substituting gives a transcendental equation, so three passes are taken; the
third moves the answer by under 1e-4 at every rate this model produces. Ability crits enter λ as a
constant, since none of their rates depend on melee speed.

**It reaches the auto attack alone** — worth +25.5% on pet melee. The aura is `MeleeSpeedMultiplier`,
every pet ability is `IgnoreHaste: true`, and Kill Command has no cast at all, so a frenzied pet
swings more and presses its buttons exactly as often. A test asserts Bite, Claw and Kill Command are
byte-identical across it.

### Three gates, pointing at three different things

This is the sentence to keep: **Bite and Claw are gated on the pet's focus, Kill Command on the
owner's crits, Frenzy on the pet's crits.** Kill Command and Frenzy sit five lines apart in
`sim/hunter/talents.go` and point at different actors.

That forces one evaluation order with no cycle — rotation, then Kill Command, then the pet's auto
attack — because Frenzy counts Kill Command's crits and Kill Command counts Steady Shot's. The hunter
branch now carries a `petContext` forward rather than deriving the tables twice.

### Focused Fire is half expressible, and the half that is not is named

The hunter half — `DamageDealtMultiplier *= 1 + 0.01·rank`, gated on owning a pet — is taken as
`rangedDamageMultiplier`. **That is a judgement rather than a reading**, and it is written down as
one: every hunter here has a pet and every point of *hunter* damage this model computes is ranged, so
a blanket multiplier and a ranged one coincide today. It would need splitting if hunter melee were
ever modelled.

The other half is `BonusCritRating` on the pet's Kill Command **specifically** — a per-spell crit
bonus, where every field in `TalentModifiers` is shaped like an *actor*. It stays refused with that
reason, and a test checks the reason rather than just the absence.

### What is left on the pet

**Bestial Wrath / The Beast Within only**, and it needs a cooldown usage policy this model has none
of — the same reason Rapid Fire and Readiness are refused. Everything else the pet does is in.

### Still true, and still the thing to read first

Marksmanship sits at **1.05x** and neither talent here touched it. The warning in the section below
stands: the next pet improvement may push it above its reference, and the answer is to find the
double-count rather than loosen the bound.

---

## Start here (2026-08-27, latest)

**Kill Command lands, and the one pet ability that scales beats the two that do not.** 54.1 DPS
against Bite and Claw's 34.9 combined, on a best-case Beast Mastery hunter, despite firing 7.7 times
a minute against their 21.6. The section below predicted that from one line of upstream and the
prediction held.

    Hunter Marksmanship   1239 -> 1277   (1.1x -> 1.0x)
    Hunter Beast Mastery  1440 -> 1494   (1.4x)
    Hunter Survival       1164 -> 1201   (1.4x)

The pet is **16.5%** of a best-case BM hunter now, up from 13.3%, against an attributed share nearer
a third.

### The parts worth knowing

- **Two spells, one attack, competing with nothing.** `kill_command.go` registers 34026 on the owner
  (75 mana, 5s cooldown) whose only effect is to fire the pet's 34027. It costs the pet no focus and
  takes none of its 1.5s global cooldown, so it does not contend with Bite and Claw. Its mana joins
  the reported drain rather than capping anything, on Steady Shot's grounds.
- **The gate is the owner's crit rate, not the cooldown.** Upstream opens a 5-second window on any
  owner crit and fires inside it, so the rate is `1 / (5 + 1/λ)` — about **half** what the cooldown
  alone allows. It degrades correctly at both ends, and the weak point is named: real crits are not
  Poisson, so the wait is less variable than assumed and this **understates**.
- **`ResolvedSpecial` gained `usesPerSecond`**, because the owner's crits come from the auto shot
  *and* Steady Shot, and the shot's rate had to leave `resolveRotation`. Dividing DPS by
  damage-per-use to recover it would reconstruct a number that function already knows.
- **The multiplier asymmetry is now proven rather than argued.** Kill Command sets
  `DamageMultiplier: hp.config.DamageMultiplier` explicitly where every focus ability sets `1`. That
  is the source line showing the family multiplier is not inherited. It does not take the `0.85`.
- **Focused Fire is a real understatement**, not an absence: upstream gives this spell 10% crit a
  rank and the talent has no ingested effect here.

### Two assertions broke and both were right to

- **"The pet inherits no crit"** compared the aggregate `Pet DPS` row. Kill Command's *rate* is gated
  on the **owner** critting, so that row now moves with owner crit while the pet's own attacks do
  not. Two opposite truths one aggregate row cannot express — it is asserted per source now, which is
  the argument for itemising the pet at all.
- **The Bestial Discipline ratio** counted every non-melee pet row as a focus ability; Kill Command
  spends no focus.

### Marksmanship crossed the calibration bracket — read this before touching the pet again

**1.05x low**, from 1.1x, so `featureFlags.ts` was rewritten for the third time the bracket has
forced. **No spec reads above its reference** (1277 against 1341), so this is an improvement, not a
double-count.

But Marksmanship has the least left to model — auto shot, Steady Shot and a pet, all three in — so
**the next pet improvement may push it above 1341 and trip the one assertion with real teeth.** If
that happens, find the double-count rather than loosening the bound: every previous crossing was
something genuinely counted twice.

### What is left on the pet

1. **Frenzy** — 20% a rank on a pet crit, +30% melee speed for 8s. Wants `1 - exp(-λ·8)` rather than
   a Markov chain over stacks, since it is a fixed-duration refreshing aura rather than a consumed
   one. λ is the pet's own crit rate across melee, Bite, Claw and Kill Command, all of which exist
   now.
2. **Focused Fire** — 10% crit a rank on Kill Command specifically, plus 1% a rank to the hunter's
   own damage. Both halves are expressible now that Kill Command is modelled; it is the last Beast
   Mastery talent refused for a reason that is about to stop being true.
3. **Bestial Wrath / The Beast Within** — still needs a cooldown usage policy this model has none of.

---

## Start here (2026-08-27, later)

**The pet presses its buttons now, and they are worth much less than this file predicted.** Bite and
Claw are modelled, along with Bestial Discipline. The section below said "the abilities are most of
what is still missing"; that was wrong, and the reason is one fact.

    Hunter Marksmanship   1225 -> 1239   (1.1x)
    Hunter Beast Mastery  1405 -> 1440   (1.5x -> 1.4x)
    Hunter Survival       1150 -> 1164   (1.5x)

**`BaseDamageConfigRoll(108, 132)`. The pet's abilities are flat rolls with no attack power scaling
at all** — unlike Kill Command, which uses `BaseDamageConfigMeleeWeapon`. So gear moves one half of
the pet and leaves the other where it was: they add **2.4%** to a Beast Mastery hunter and about 1.1%
to the other two. The pet is **13.3%** of a best-case BM hunter now, against the ~28% the
architecture report attributed to it.

**What moves the abilities is Bestial Discipline, not gear, and a test caught me getting that
backwards.** The first share assertion compared a naked untalented hunter against a best-case one and
expected the ability share of the pet to *fall*; it rose, 17.45% to 18.14%. Held apart: gear alone
takes it **17.5% → 15.1%**, Bestial Discipline alone **17.5% → 27.8%**. The talent dominates, and the
flat-roll claim is now asserted where it can be exact — ability DPS not moving at all when the owner
gains 2,000 attack power.

So the remaining pet gap is **Frenzy, Kill Command and Bestial Wrath** — or the ~28% attribution is
high, which that report already flagged about its own number. Either way the abilities were never
going to close it, and the damage table now shows that per source rather than inside one total.

### The parts worth knowing

- **Three ceilings; focus binds by a wide margin.** Own cooldown, the pet's 1.5s GCD (`IgnoreHaste:
  true` — the Steady Shot finding, one actor over), and focus. At 5 focus/sec against costs of 35 and
  25, the two abilities come to ~0.16 uses/sec where the GCD would allow 0.67. **The GCD ceiling is
  applied anyway and a test proves it** by handing the model an absurd focus income — an unbounded
  version would agree everywhere it is used today and stop agreeing the moment a cheaper family
  existed.
- **The budget is spent greedily in `PetConfigs` order**, matching upstream's `OnGCDReady`. Bite
  takes what its 10s cooldown allows, Claw divides the rest. Bite returns 3.4 damage per focus
  against Claw's 2.6, which is why upstream lists it first.
- **Bestial Discipline moves Claw and not Bite**, and that asymmetry is the mechanism: Bite is
  already cooldown-capped at base focus, so every extra point goes to the ability with no cooldown.
  Claw goes 3.6 → 15.6 uses a minute and overtakes Bite. A model that scaled the whole budget would
  raise both and look just as plausible, so the test asserts the asymmetry rather than the total.
  It is also the one pet talent read out of `pet.go` rather than `talents.go`, because upstream
  applies it at construction rather than in `ApplyTalents`.
- **A multiplier trap, caught by reading rather than by a failure.** Happiness is
  `PseudoStats.DamageDealtMultiplier` (unit-wide) but the family multiplier and the `0.85` are
  `AutoAttacks.MHEffect.DamageMultiplier` — **the auto attack alone**. Every ability carries
  `DamageMultiplier: 1`, and Kill Command re-applies the family multiplier *explicitly*, which is the
  proof. Handing the abilities the white chain would have overstated them ~6%.
- **What is not modelled is the starvation.** On a real timeline Claw can spend the pet below 35
  focus just as Bite comes off cooldown; the closed form lets Bite take its cooldown rate first. A
  small overstatement, named rather than discovered.

### What is left on the pet

1. **Frenzy** — 20% a rank on a pet crit, +30% melee speed for 8s. The ability rate exists now, so
   the block is gone. It wants `1 - exp(-λ·8)` rather than a Markov chain over stacks, because it is
   a fixed-duration refreshing aura rather than a consumed one.
2. **Kill Command** — `BaseDamageConfigMeleeWeapon(MainHand, false, 127, 1, true)`, so it **does**
   scale, which makes it the more promising of the two. 5s cooldown, 75 mana, gated on the owner
   critting within the last 5 seconds. At raid crit rates that window is essentially always open, so
   the honest closed form is "on cooldown", which is stateable.
3. **Bestial Wrath / The Beast Within** — needs a cooldown usage policy this model has none of.

Everything under **What is left** in the section below still stands, minus the pet items.

---

## Start here (2026-08-27)

**The pet is finished as far as white damage goes, and the two sourcing jobs were three.** The queue
item said "finish the pet, which is two sourcing jobs rather than modelling" — the focus economy and
the pet-scaling talents. Both were done and both were smaller than billed. The third job was not on
the list at all, and it was the biggest: **the pet's white damage was missing three multipliers**,
worth about +21%, none of them a talent.

    Hunter Marksmanship   1209 -> 1225   (1.1x)
    Hunter Beast Mastery  1325 -> 1405   (1.6x -> 1.5x)
    Hunter Survival       1133 -> 1150   (1.5x)

The pet's share of a best-case hunter went from about **6% to 11.2%** for Beast Mastery (7.7% for
Marksmanship, 8.2% for Survival), against archon's rotation data putting a real one nearer a third.
So the abilities are most of what is still missing, which the previous pass guessed and this one can
measure.

### 1. The focus economy was never unreadable — it was in the wrong package

The handoff said the base regeneration "is passed to `EnableFocusBar` as a *multiplier* rather than a
rate", and told the next person to find where `EnableFocusBar` is defined before modelling anything.
That instruction was exactly right and the conclusion drawn from it was not.

`EnableFocusBar` is defined in **`sim/hunter/focus.go`**, not in `sim/core`, and that file carries
every constant: `MaxFocus = 100`, `tickDuration = 5s`, `BaseFocusPerTick = 25`. So the base is **5
focus per second**, and `1.0 + 0.5*BestialDiscipline` scales it.

**The reason it went unsourced is the part worth keeping.** The previous pass looked in
`sim/core/energy.go`, found the rogue and druid energy constants and no focus ones, and read that as
the constants not existing anywhere. A search of the wrong package returns the same empty result as a
search for something that is not there.

Every pet ability is sourced now too, from `sim/hunter/pet_abilities.go` — Bite 35 focus / 10s
cooldown / 108-132, Claw 25 / 54-76, Gore 25 / 37-61 with a 50% chance to double, Screech 20 / 33-61,
all on a GCD locked at 1.5s by `IgnoreHaste: true`. **None is modelled**, and that gap is now a rate
model rather than a missing number.

### 2. Three multipliers were missing, and this is the finding

`pet.go` applies four multipliers within ten lines of each other. This model had one.

| | Upstream | Was modelled |
|---|---|---|
| Happiness | `PseudoStats.DamageDealtMultiplier *= 1.25` | yes |
| "Cobra reflexes" | `PseudoStats.MeleeSpeedMultiplier *= 1.3` | **no** |
| Family damage | `MHEffect.DamageMultiplier *= petConfig.DamageMultiplier` | **no** |
| Uncommented | `MHEffect.DamageMultiplier *= 0.85` | **no** |

All three are unconditional — not gated on a talent, a family or anything. The one worth naming is
the **`0.85`, which upstream applies with no comment at all**. It is carried across as read: a
constant nobody can explain is still a constant the reference implementation uses, and dropping it
for lacking a justification would have overstated every pet by 18%.

**The family multiplier needed a decision rather than a lookup.** `PetConfigs` spans 0.91 (Bear) to
1.1 (Cat, Raptor, Ravager) and this app has no pet picker, so the **Cat is assumed and the estimate
says so out loud**. A test pins that the family named in the prose and the multiplier it is priced at
cannot drift apart — the same shape as every other caveat assertion here.

### 3. The talents were the easy half, and one of them is two talents

Four reach the pet now, on their own `pet*` fields: Ferocity (+2% pet crit a rank), Animal Handler
(+2% pet hit), Unleashed Fury (+4% pet damage), Serpent's Swiftness (+4% pet melee speed). Effects
went **63 → 67**.

**Separate fields are the mechanism, not tidiness.** A pet inherits attack power, spell power,
stamina and armour and *nothing else* — no crit, hit or haste. Folding Ferocity into the shared
`meleeCritChance` would have handed the hunter crit they have not earned, and it would have raised
the total, which reads as progress. The test asserts Auto Shot is **byte-identical** across each pet
talent; that is the half that catches it.

**Serpent's Swiftness is one talent id with two extractors.** Upstream writes two separate lines —
`RangedSpeedMultiplier` on the hunter, `pet.PseudoStats.MeleeSpeedMultiplier` on the pet — at the
same coefficient. One extractor would have silently dropped whichever half it did not match, and the
ingest reports success either way.

### 4. Two of this repo's own claims were wrong

- **Kill Command is implemented upstream.** `sim/hunter/kill_command.go`, spell 34026 on the hunter
  and 34027 on the pet. This repo said it was not — in `hunterPet.ts`'s module doc, in the
  user-facing estimate, and in `ROTATION-SCOPE.md`. It is still not modelled here, because it fires
  off the owner's crits and needs a timeline, but the reason is now the true one.
- **The ingest refused six Hunter talents as "there is no pet in this model".** True when written,
  false from the moment `hunterPet.ts` shipped on 2026-08-23 — the same rot `featureFlags.ts` has
  demonstrated twice. Four are ingested now; Frenzy and Bestial Discipline stay refused and **both
  new reasons are about the ability rate**, not about the pet. A test fails if any Hunter refusal
  claims it again, scoped to Hunter because Warlock's "No pet model here" is still true.

### 5. Doc rot found in the sweep, none of it caused by this work

**The worst one was on screen, and only driving the app found it.** The Simulation panel's own intro
told every player "**two specs** layer their real special attacks on top of auto attacks, and the
rest are modeled from a single signature ability". The real figure is **5 and 22**.

What makes it worth retelling is that the number was already known to be wrong. `planner.spec.ts`
asserts the list of five specs, and **its own comment said "the panel says two specs"** — so the
stale figure was written down, twice, next to the assertion that contradicted it, and nothing
connected them. That is this repo's recurring failure in its purest form.

`SimulatorPanel` now **derives both figures from `getRotationAbilities`** at module scope rather than
carrying them in the JSX, so adding a rotation moves the sentence on screen in the same commit. The
test keeps its assertion because it names *which* specs, which a count cannot.

The lesson is the one already in the rules and it earned another instance: **a caveat needs something
that fails when it stops being true**, and "we wrote an assertion nearby" is not that.

- **README carried two contradictory bullets about talents, side by side.** One said talents have
  reached the always-visible stat rail since 2026-08-21; the next said "**Talents do not reach the
  always-visible stat rail**". The second is a leftover the 2026-08-21 pass did not delete, and it
  also named Toughness and Vitality as refused when both have been ingested since. Corrected.
- **ROADMAP said "Rotations cover 2 specs of 27"** where the real figure is 5 and is asserted in a
  test. Three specs gained rotations underneath that sentence without it moving.
- **ROADMAP said "62 machine-readable effects"** where the file held 63, and now 67. Both counts are
  replaced by pointers to the assertions, which is the rule this repo already states and these two
  sentences were quietly breaking.

### What is left

**1. The pet's abilities, which is now a rate model rather than sourcing.** Every constant is in
hand. The shape of the problem: the pet acts on a 1.5s GCD it cannot haste, spending from 5 focus/sec
against costs of 20-35, so focus rather than the GCD is the binding constraint at a base rate — which
is what makes Bestial Discipline worth having and why it is refused until the abilities exist. Bite's
10s cooldown is a second ceiling on the only ability with one. Note the same trap the resolver
already taught: **a second ability spending the same focus moves damage rather than adding it**
unless it returns more per point.

**2. Frenzy, once the ability rate exists.** 20% a rank on a pet crit, +30% melee speed for 8s. It is
`flurrySpeedMultiplier`-shaped but not the same shape — a fixed-duration refreshing aura rather than
a consumed stack, so it wants `1 - exp(-λ·8)` rather than a Markov chain over stacks. Pricing it off
white swings alone would understate it once most of a pet's attacks are abilities.

**3. The rest of the stage 3 list is untouched** and still in the architecture report's leverage
order: Slice and Dice / poisons / Combat Potency, weapon-enchant and damage procs, Windfury Totem,
Expose Weakness, Deep Wounds, Elemental Weapons, Flurry with specials, and **spell school**.

**4. Feral is still the worst spec at 2.3x and still needs bleeds first.**

**5. Not simulator work, still open:** the website walkthrough the owner asked for and has not had.

### One trap this session hit

**The repo's documented heredoc trap is real and it fires on `<<'EOF'` too.** Writing a TypeScript
file through a quoted bash heredoc died with `unexpected EOF while looking for matching '` before
writing a byte. The file was untouched, which is the good outcome, but the failure looks like a
syntax error in the command rather than in the content. The rule already in this file — write the
patch to a file and run it, or use an editor tool — is the answer, and quoting the delimiter does not
buy an exemption.

---

## Start here (2026-08-23)

**The simulator stopped being unfalsifiable.** `39758d9..HEAD`, thirty commits, 208 tests passing,
`tsc`/`lint`/`build` clean on real exit codes, ingests and the brain idempotent, all on `origin/main`.

The headline: this project used to claim it was "roughly 4x low" on one person's judgement, with
nothing able to check it. It now measures itself against **observed parses for all 20 DPS specs** and
reads **1.1x to 2.3x low**, with a regression guard that has already caught three real defects.

### The calibration table, which is the thing to look at first

`src/domain/simulation/dpsReference.ts` holds archon.gg's observed averages for the SSC/TK phase. A
test dresses each spec in rank-1 BiS with its recommended gems and enchants, every buff and
consumable, its primary tree to the 61-point cap and every modelled target debuff, then prints:

| Spec | Model | Target | Ratio | Spec | Model | Target | Ratio |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Hunter Marksmanship | 1209 | 1341 | **1.1x** | Warrior Fury | 1305 | 2053 | 1.6x |
| Shaman Enhancement | 1305 | 1693 | **1.3x** | Hunter Beast Mastery | 1325 | 2068 | 1.6x |
| Rogue Subtlety | 960 | 1292 | 1.3x | Rogue Assassination | 867 | 1362 | 1.6x |
| Mage Frost | 831 | 1120 | 1.3x | Priest Shadow | 742 | 1330 | 1.8x |
| Warrior Arms | 1166 | 1706 | 1.5x | Paladin Retribution | 966 | 1785 | 1.8x |
| Hunter Survival | 1133 | 1696 | 1.5x | Rogue Combat | 846 | 1731 | 2.0x |
| Warlock Affliction | 1086 | 1629 | 1.5x | Mage Arcane | 995 | 2084 | 2.1x |
| Shaman Elemental | 866 | 1422 | 1.6x | Warlock Destruction | 864 | 1838 | 2.1x |
| Druid Balance | 870 | 1401 | 1.6x | Warlock Demonology | 752 | 1619 | 2.2x |
| Mage Fire | 897 | 1413 | 1.6x | **Druid Feral** | 728 | 1655 | **2.3x** |

**The one assertion with teeth is one-directional: no spec may read *above* its reference.** The
model understates everywhere, so a spec reading high is a double-count — and that has now happened
twice, catching Affliction delivering an 18-second DoT every 1.5 seconds, and upstream's Windfury
proc constant predicting nearly double the procs a real log shows.

### Read `SIMULATION-ARCHITECTURE.md` before doing more simulator work

A research agent audited the engine against wowsims and wrote it. The recommendation is a **two-tier
engine**: keep `calculateSimulation` as the fast analytic scorer that ranks gear and derives stat
weights, add an event loop behind the Run button as the accurate headline, and calibrate the first
against the second.

The load-bearing argument: an event loop is cheap for **one** number (3,000 iterations in 275 ms) and
impossible for **2,700** — `findUpgrades` scores ~2,500 candidates live in a `useMemo` on every gear
change. wowsims never faces this because its UI has no upgrade finder. Its six-stage migration path
puts the loop at **stage 4**, and argues the work before it is the same work either way.

### What actually closed the gap, and it was mostly not rotations

Ranked by what each was worth, because the order is not what anyone predicted:

- **The calibration harness was wrong twice, both times flattering the model.** First it fought a boss
  with **no armour debuffs** (42.2% mitigation against the 25.9% every real raid has). Then it dressed
  every spec in raid gear with **empty sockets, bare weapons and no second ring**. Between them, about
  half the apparent gap. A rig that understates makes every later change look like progress.
- **Shared buff machinery**: Flurry for Shaman (refused for a rank-scale reason that turned out to be
  a single `+5%` constant), Unleashed Rage, Bloodlust, Ferocious Inspiration.
- **Whole damage sources nobody had modelled**: Windfury on both hands, Retribution's seals and
  judgement (more than half that spec's output, faction-split by a factor of four), hunter pets.
- **Multi-spell rotations** for Affliction, Shadow and Destruction — which `ROTATION-SCOPE.md` had
  scoped as needing an event timeline and which turned out to be arithmetic: DoTs compete for
  **globals**, not for a resource.

### Two pieces of infrastructure worth knowing about

- **`SimulationResult.damageSources`** — every source, its DPS, its share, **summing to `scoreExact`**,
  asserted for all 20 specs and rendered in the panel like a log's damage table. This is what makes
  every later change falsifiable *per source* rather than per total.
- **The bracketed range assertion.** `featureFlags.ts` quotes the calibration range, and the test
  brackets it on **both** sides so improving the model *fails* and forces the prose to be rewritten.
  That sentence has gone stale three times; the bracket caught the third before a human did.

### 1. Faerie Fire — the decision was taken, and the requested restriction was inverted

The walkthrough asked to restrict Faerie Fire to **Balance/Dreamstate Druids**. That is not what
shipped, because this repo's own ingested talent trees say it is backwards: **Improved Faerie Fire is
Balance** (row 6, 3 ranks), **Faerie Fire (Feral) is Feral Combat** (row 4, 1 rank), and
**Restoration — the tree Dreamstate lives in — has neither**. Restricting the base spell would have
credited the one Druid tree with no Faerie Fire talent while excluding the one with a dedicated one.

Base Faerie Fire is trainer-taught to every Druid, so it **stays class-wide**. The Balance-only half
the request was really about is now its own entry — **Improved Faerie Fire, spell 33602** — on the
same principle as Trueshot Aura and Power Infusion.

**The +3% is modelled, not just named.** `physicalHitTakenBonus` is a new `TargetDebuff` field; the
old note said the app "has no field for" it, which was true when written. It is attacker hit rather
than target avoidance, so it joins the same `missReduction` term as hit rating and talent hit — one
term reaching white swings, specials and the ranged table, each flooring miss at zero. Measured on
the reference Fury Warrior: miss **6.9% → 3.9%**, DPS **215.3 → 221.6 (+3.0%)**. A test pins that a
Fire Mage's spell hit and score are byte-identical with it active, because the tooltip says melee and
ranged.

### 2. The assignment picker is general now, and the blocker was the seat shape

The domain had assigned any exclusive buff since totems got a group. The **interface** was gated on
`className === 'Paladin'`, so three of the four groups were decided by the priority order with no way
to say otherwise.

**Ungating it was not enough, and this is the part worth knowing.** `RosterSlot.blessingId` held one
answer and a Paladin has two — they bring a Blessing *and* an aura — so assigning the aura would have
silently cleared the Blessing. Assignments are now keyed by `ExclusiveGroup.id`, `assignBlessing`
became `assignBuff(roster, ref, groupId, buffId)`, and coverage reads every group's assignment while
still checking the seat can actually provide the buff. **A group key is never trusted on its own.**

Saved rosters migrate on read: `blessingId` is looked up through `exclusiveGroupFor` rather than
assumed to be a Blessing, so no branch can file it under the wrong group. Option labels are derived
by `trimSharedWords` — the version it replaced was a literal `.replace(/^Greater Blessing of /, '')`,
correct for the one group the picker could reach and silently wrong for the three it could not.

### 3. The attunement tab already existed; Karazhan's chain did not

Worth knowing before trusting a queue item's framing: the tab, component, styles and a test had
shipped with the raids rework. The gap was **data** — only SSC and Tempest Keep had chains, while
SSC's own prerequisites already assumed you had done Karazhan's.

Karazhan now has **eight steps, each cited to the Wowhead quest id its wording came from** (9824,
9825, 9826, 9829, 9831, 9832, 9836, 9837 → The Master's Key, item 24490), cross-checked against Icy
Veins. Still `needsVerification`, and the note says precisely what is unsettled — the level the chain
requires, and whether Anniversary realms drop it in 2.4 — rather than flagging it vaguely.

**README and ROADMAP were both claiming per-role callouts the Raids tab has not rendered since the
loot-only rework.** Corrected rather than edited around; the mechanics data is still there and
deliberately unsurfaced, and ROADMAP now says so.

### 4. Rotation stage 1 — a hunter now fires the button they press all fight

**Steady Shot reached the simulation nowhere**, and the cause was one word: `resolveRotation`
filtered on the literal `'Melee Special'`. The ability was catalogued, sourced and correct the whole
time. `featureFlags.ts` was calling the other 25 specs "a single-ability approximation" when for the
three hunter specs the count was **zero** — that correction is in the file rather than quietly fixed.

**The rate is two ceilings, both read off wowsims rather than judged.** The obvious model — cast time
bounds the rate — is wrong in the overstating direction. The **hunter GCD is locked at 1.5s and
ranged haste does not reduce it** (`IgnoreHaste: true` upstream), while the cast time *is* hasted and
so stops being the constraint. The other is **one shot per auto-shot cycle**: casting delays the next
auto rather than clipping it, upstream prices that delay and avoids paying it.

**Mana is deliberately not a third ceiling** — `StatBlock` has no mana field, so a cap would mean
inventing the income too. The drain is reported in the breakdown instead.

Measured: Marksmanship **102.8 → 277.2 DPS**, one shot per 3.0s, 36.7 mana/sec. A ranged special
rolls on the **ranged** table (no dodge, parry, block or glance) and scales off ranged attack power.

Also sourced: **Ranged Weapon Specialization reaches Steady Shot** — a blanket
`RangedDamageDealtMultiplier` with no proc mask. This repo's `rangedDamageMultiplier` field
documented itself as white-only and was wrong about its own scope.

**One existing test failed, and that was it doing its job** — it pinned "Steady Shot is not
included". `ROTATION-SCOPE.md` predicted that in advance.

### 5. Rotation stage 2 — re-scoped, and the premise was the error

Stage 2 read "Feral, Retribution, Enhancement and Protection get their second and third buttons; the
resolver already handles the budgets". **The resolver does not share a budget — it spends it greedily
in priority order.** The first ability takes what its own rate allows and later ones divide what is
left, so a second ability costing the *same* resource **moves** damage rather than adding it, and
only pays off if the new use returns more per point of resource. That reframes the stage from "add
entries" to "prove the swap is a gain", and it lands on stage 4's Rogue plan too.

All four specs then failed for four different reasons:

- **Protection is out of scope.** The doc was written 2026-08-18; the DPS-only rule was taken
  2026-08-21. Nothing to do.
- **Feral loses about 4% if Mangle is added before bleeds exist**, measured: Shred returns 11.8 damage
  per energy against 10.6 for Mangle. The repo's own note said Mangle applies a "+30% Shred/bleed
  debuff" — **in TBC it is bleeds only** (`PeriodicPhysicalDamageTakenMultiplier *= 1.3`), and the
  "Shred and Ravage" wording is a later expansion's. With no bleed modelled the debuff multiplies
  nothing. **Rake is the prerequisite, not the sibling.** A test pins the per-energy comparison.
- **Retribution needs a new effect type**, not an entry — Judgement of Blood is Holy damage off spell
  power rolling crit on the melee table. Its own notes already said so.
- **Enhancement's gap is Windfury Weapon**, a white-swing proc, not a rotational button.

### 6. Windfury Weapon — the one real mechanism inside stage 2, now built

The Shaman ability notes had said it for as long as they existed: Stormstrike is a 10s cooldown and a
small share of the output, while "Enhancement damage is dominated by Windfury Weapon procs on white
swings". The model counted none of them. **Worth 25.8 DPS on the default set** — 149.9 → 175.7,
against 36 for Stormstrike.

**A weapon imbue is not a rotational ability**, so there is no `SignatureAbility` entry. It lives in
`domain/simulation/weaponImbues.ts` and is folded into white damage. **Two ceilings, neither on the
tooltip**, both from `sim/shaman/weapon_imbues.go`: 20% per **landed** main-hand swing (so miss,
dodge and parry cannot roll it, while glance and block can), and a **3s internal cooldown**. The
cooldown does not bind at Phase 2 speeds and is tested directly anyway, because a bare percentage
would overstate any future fast-weapon build.

The closed form holds because **the extra attacks cannot re-proc** (`ProcMaskEmpty` upstream), so the
rate is linear in the swing rate. Each proc is two extra main-hand attacks at **+475 attack power**.

**Two things are stated rather than modelled:** the main hand is *assumed* to carry the imbue, since
there is no weapon-imbue slot to read, and **Elemental Weapons is not applied** — it multiplies
Windfury by 13.33% per point upstream but has no ingested talent effect here.

**A wording bug came out of driving the app rather than reading the code.** The mana-drain row
appears for an Enhancement shaman too, because Stormstrike is mana-costed — correct behaviour, but
three docs described the disclosure as a hunter thing. Corrected, and pinned by a test on both paths.

### 7. Retribution's Holy damage — stage 2 closed, and the prediction was wrong again

**The seal is where Ret's damage is, not the judgement.** Seal of Blood adds 35% of weapon damage to
**every** landed white hit; Seal of Command adds 70% at 7 PPM. With the judgement that is **112.5 DPS
Horde / 70.6 Alliance**, on a spec that was reading about 197.

**It needed neither a type change nor an entry**, which is what the scope doc predicted. A seal is a
30s self-buff riding on white hits — the repo's notes said these "do not fit this schema at all" and
stopped there, which is true of `SignatureAbility` and not of the simulator. It lives in
`domain/simulation/paladinSeals.ts` and `resolveRotation` was untouched.

**Faction-split, and the gap is a factor of four.** Seal of Blood is Horde-only in Phase 2. Judgement
of Blood deals 295-325; Judgement of Command deals 68-73. The model reads `character.faction`.

**Holy damage is not reduced by armor** — the first unmitigated damage on the physical path, added
after mitigation rather than inside it. Anything non-physical added later must make the same
distinction or it loses ~42% silently. A test moves target armor and asserts the physical rows move
while the Holy rows do not.

Two of the repo's own claims corrected: the judgement **does** trigger the GCD, and Judgement of
Command is not implemented upstream at all, so it has one source and no invented coefficient.

### 8. Two defects found by driving the app rather than reading it

- **The hidden hover card scrolled the page sideways at phone width.** `visibility: hidden` suppresses
  painting, not scrollable overflow, so an absolutely positioned card at `left: 100%` extended the
  document to 534px against a 375px viewport. `display: none` now, with `allow-discrete` keeping the
  fade. The reflow test missed it because it never filled a seat. **And a cascade trap:** the phone
  override first went in ~90 lines *before* the rules it overrides, so at equal specificity it
  silently did nothing.
- **`**bold**` in the researched notes rendered as literal asterisks** on the one surface whose job is
  being read. Twenty-one markers across four ability files; the oldest predates this session by
  months.

### 9. The DPS gap was measured, and it is talents plus imbues rather than rotations alone

Prompted by the repo owner: a Phase 2 BiS Enhancement shaman should read far higher than the app
says. Measured, with rank-1 BiS in every slot the list names:

- **BiS gear only: 245 DPS**, 1,214 attack power
- **+ all 33 buffs and all 31 consumables: 437**, 2,543 attack power, 33.8% crit
- **+ every Enhancement talent maxed: 522**, 38.8% crit, 11.8% miss

**The inputs are fine** — 2,543 AP and 38.8% crit are realistic Phase 2 numbers — so this is the
damage model, at about the 4x `featureFlags.ts` already advertises.

**Calibrated against a real parse the same day.** The repo owner supplied their own Hydross (SSC) log:
116s, boss-only, **1,709.3 DPS**. Per-source, the model is 3.2x low on white damage, **5.7x low on
Windfury**, 1.6x on Stormstrike, and models Earth Shock / Flame Shock / Fire Nova / Flamecap at zero
(150.3 DPS, 8.8%, between them). Two mechanical facts came straight out of it: **Windfury is on both
weapons** (two log rows at a 2:1 damage ratio, and no Flametongue at all), so the 36% two-imbue rate
applies and off-hand Windfury is uncounted; and **Flurry runs at 94.16% uptime**, which is why real
swing rate is 1.17/sec against the 1.10x multiplier the model produces. `ROTATION-SCOPE.md` carries
the full table and the resulting order of work. `ROTATION-SCOPE.md` now carries
the full breakdown; the headline is that **talents reach three fields out of twenty-one**, and
**Shaman's Flurry is refused by name** for a rank-scale reason rather than a mechanism one, which
makes it the biggest single item and a tractable one — the melee path already calls
`flurrySpeedMultiplier`.

Also unmodelled: Flametongue Weapon, Windfury on the off hand (upstream uses **36%** when both hands
are imbued, against the 20% modelled), Earth Shock and Lightning Shield.

**And one actual bug:** two Shaman talent refusals still say `calculateCasterDps` "takes no talents
yet", which stopped being true on 2026-08-19. The test named *"no talent is refused for a reason the
code no longer has"* does not catch it, which is the more interesting half.

### What is left

**1. Finish the pet, which is two sourcing jobs rather than modelling.** The pet is in and adds about
**6%** of a hunter's total where archon's rotation data puts a real one nearer a third. Both gaps are
named in the estimate itself:

- **The focus economy.** Bite, Claw, Gore and Screech are focus-costed, and upstream passes the base
  regeneration to `EnableFocusBar` as a *multiplier* rather than a rate. `sim/core/energy.go` has the
  energy constants (20.2 per 2.02s, confirming this repo's 10/sec) but no focus ones. Find where
  `EnableFocusBar` is defined before modelling any pet ability.
- **Pet-scaling talents, none of which are ingested.** All four are already sourced in
  `sim/hunter/talents.go`: Unleashed Fury `+0.04` damage/rank, Serpent's Swiftness `+0.04` attack
  speed/rank, Ferocity `+0.02` crit/rank, Animal Handler `+0.02` hit/rank. This needs **pet fields on
  `TalentModifiers`** and matching ingest extractors — the same shape `baseBonus` took for Flurry.
  Note `HUNTER_SKIPPED` still says "There is no pet in this model", which is now false.

**2. The rest of the stage 3 list**, in the architecture report's leverage order: Slice and Dice /
poisons / Combat Potency (the three that make a Rogue a Rogue — Combat is 2.0x, and all of it is rate
arithmetic); weapon-enchant and damage procs (**0 of 91 enchants carry a proc effect**, and Mongoose
is the recommended main-hand for three specs at 53.48% measured uptime); Windfury Totem, Expose
Weakness, Deep Wounds, Elemental Weapons; Flurry with specials in the Markov chain; and **spell
school**, which now blocks four separate things.

**3. Feral is the worst spec at 2.3x and needs bleeds first.** Rake and Rip, and note the measured
finding that **adding Mangle before bleeds exist is a DPS loss** — Shred returns more per energy, and
Mangle's debuff multiplies periodic physical damage the spec currently has none of. A test pins that.

**4. Stage 4 onward is the event loop**, and `SIMULATION-ARCHITECTURE.md` has the port list, the
skip list, and the Web Worker requirement. Do not start it before stage 3: the report's case is that
the loop needs every one of those mechanics implemented anyway, just as callbacks instead of terms.

**5. Not simulator work, still open:** the website walkthrough the owner asked for and has not had
yet, and a stray empty `Untitled.canvas` in the repo root that nobody has claimed.

### One trap this session hit

**Python eats `\'` inside a triple-quoted string**, so a patch script writing TypeScript emitted
`'Cedric's reply'` and produced sixty parse errors. The repo already records the backtick version of
this; this is the same failure through a different quote. Write the TS string double-quoted instead
of escaping the apostrophe — and note that escaping it through a *bash heredoc* does not work either,
because the backslash is eaten a layer earlier. The reliable fix is to **write the patch script to a
file and run it**, or to avoid the apostrophe in the prose altogether.

**`cat > file` with no stdin hangs forever.** A stray `cat > /tmp/probe.ts 2>/dev/null;` at the front
of a command chain blocked on stdin, which read as a slow test run rather than as a hang, and the
rest of the chain never executed.

---

## Start here (2026-08-22)

**Thirteen commits, and the through-line is that the app was confidently wrong about numbers a player
reads on every screen.** `0ee9148..f0cfcef`. 180 tests passing, `tsc`/`lint`/`build` clean, every
ingest and the brain idempotent, everything on `origin/main`.

**This project is for DPS.** Owner's call, 2026-08-21: healers and tanks are out of scope. Their math
still exists, still runs and is still tested — nothing was deleted — but neither is somewhere to spend
effort, and neither is put on screen as a headline. The Simulation tab is gated on role because of it.

---

### The stat pipeline was inventing numbers, and that came first

`calculateStats` ended with **six hand-written lines that were the app's only attribute conversions**,
uncited, predating the ingest era. Three of the five were not TBC mechanics:

- **Intellect and Spirit never grant spell power in TBC.** Every such conversion is talent-gated
  upstream (Lunar Guidance, Mind Mastery, Spiritual Guidance); there is no baseline. `intellect * 0.8`
  was inventing **46% of a Fire Mage's spell power and 52% of a Holy Priest's**.
- **The rates are class-specific.** Strength is 2 attack power to a Warrior, **1** to a Rogue. Agility
  is melee AP for Rogues and cat-form Druids, *ranged* AP for Hunters, nothing for anyone else — the
  flat `agility * 0.35` matched no class.
- **Agility-to-crit is a per-class divisor**, so `agility * 0.1` understated melee crit **five to seven
  times**: a geared Fury Warrior was missing ~5.5% crit.

Three conversions were missing outright, including the **universal Agility-to-Armor** (2 a point — a
geared Rogue was short 500+ armor on a row the rail never hides). Base stats were invented too, and
are **race+class** rather than class alone: all 52 blocks now come from the pinned commit, with an
import-time guard covering the 51 combinations creation can reach.

**The finding most likely to be re-broken is upstream's.** wowsims applies Human's +10% Spirit and
Gnome's +5% Intellect as runtime dependencies, so its base tables are meant to be racial-free — and it
says so, in a comment dividing Gnome Mage Intellect by 1.05. But it leaves **The Human Spirit baked
into five of its six Human rows** while applying the multiplier again. Those five are divided back out
at ingest, each decision printed.

**Gnome Intellect is deliberately NOT corrected**, and the measurement is why: its rows measure 1.02x
(Mage), 1.08x (Warlock), 1.18x (Rogue), 1.21x (Warrior) against their peers — a real racial bonus on
small integers, not one multiplier applied inconsistently. A "divide when it moves closer to the peers"
rule was written first and **would have wrongly corrected three of the four**. Correcting a source
needs evidence for the specific row.

### Talents then reached `calculateStats` — the decision this file had listed as the owner's

Spending points now moves the stat rail, gear rankings, stat weights and upgrade finder. Verified:
Protection Warrior armour **+9.6%**, strength **+10%**; Holy Priest spell power **+17.7%**; Fire Mage
**+23.4%**; Combat Rogue agility **+20.8%**. The empty-tree identity is asserted across **all 27 specs**
— that is what made widening it safe.

**Toughness raises armour from items only**, which is the subtlest thing here. Upstream reads
`Equip.Stats()[stats.Armor]`, so the Agility-derived armour is *not* multiplied — that is why the
Warrior's total moves 9.6% rather than 10%. The test gives the character 500 extra Agility and asserts
the bonus is unchanged.

Ingest went **49 → 62 effects**, refusals **49 → 44**. The Fury Warrior reference figures moved to
**215.3 untalented / 254.7 talented (+18.3%)**.

### Then a walkthrough, and thirteen pieces of feedback

Nine are done. Each commit message carries the reasoning; the ones worth knowing:

- **A character starts bare.** Creation runs on every load, the paperdoll is empty, no talents spent.
  The autosave was **removed** rather than left writing something nothing reads — named builds and
  export/import are the persistence now. **An accidental refresh loses an unsaved build**, which is the
  tradeoff and was accepted deliberately.
- **Two Dragonstrikes** was reported as unique-equipped. It is not — the tooltip says so. It is **Main
  Hand only**, and wowsims types it `OneHand`. 706 weapons cross-checked against their own cached
  tooltips, 698 agree, **8 corrected** (the two Outland crafted chains plus Fool's Bane and The
  Decapitator). A first attempt ingesting Unique-Equipped was **reverted**: all 155 such items already
  carried wowsims' `Unique: true`, so it was 155 redundant flags changing nothing.
- **Every raid loot row has an icon** (39 → 0). One line passed the catalogue item's id where the entry
  had its own; 37 rows name items the gear catalogue will never hold. A row named "Cosmic Infuser /
  Devastation / Infinity Blade / …" could not resolve because six items is not one item — splitting it
  revealed **all six were in the catalogue the whole time**.
- **Karazhan is in clear order.** Illhoof, Netherspite and Nightbane carried `optional: true` and no
  position, and the sort sends anything positionless to the end — so all three rendered after Prince.
  Optional and out-of-order are different claims. Prince is 10th (last **required**); Nightbane is 11th.
- **One Shaman was credited with all four air totems.** They share one slot and there was no exclusivity
  group — the same over-credit the Blessings had. Note the reported "Enhancement drops Grace of Air and
  Windfury" is **not possible**: both are Air.
- **Four buffs came from a talent and were attributed to the whole class** — Trueshot Aura
  (Marksmanship), Power Infusion (Discipline), Improved Seal of the Crusader (Retribution), and
  **Expose Weakness was missing entirely** (Survival). Checked against this repo's own talent trees.

### What is left, in order

1. ~~**Faerie Fire on Balance/Dreamstate only.**~~ **Done 2026-08-23 — asked, and the answer was to
   split.** The base debuff stays class-wide; Improved Faerie Fire is a separate Balance entry whose
   +3% melee and ranged hit is modelled. The requested restriction was inverted — see the top of this
   file.
2. ~~**Generalise the assignment picker.**~~ **Done 2026-08-23.** Larger than "small" looked: the
   domain was ready, but a seat held one `blessingId` and a Paladin needs two.
3. ~~**The attunement tab.**~~ **Done 2026-08-23 — and it already existed.** The gap was Karazhan's
   chain, which was missing from the data entirely.
4. **The simulation rebuild.** Still the big one, still `ROTATION-SCOPE.md`: 25 of 27 specs are a single
   ability on repeat, and the app has **no timeline at all**. Matching WoWSims means building that
   engine, then a rotation per spec. Multiple sessions, and the honest reason DPS reads ~4x low.

### Three traps this session hit that are not yet elsewhere in this file

- **`grep -c` exits 1 when the count is zero**, so `grep -c foo file && next-command` silently skips
  `next-command`. Cost one round of tests that were never appended and a confusing "0 tests in 0 files".
- **Backticks inside a JS template literal** break a patch script written to stdout. Hit four times.
  Escape them, or avoid code formatting in strings a script generates.
- **A `.replace()` on a marker two types share takes the first.** `icon` and `guideUrl` landed on
  `ProfessionTier` instead of `ProfessionProfile` because both end with the same two optional lines.
  Anchor on something only the target has.

---

## Start here (2026-08-21, later)

**This project is for DPS.** The repo owner's call: healers and tanks are out of scope. The math for
both still exists, still runs and is still tested — nothing was deleted — but neither is somewhere to
spend effort, and neither is put on screen as a headline number.

**Decision 1 is therefore taken too, and taken per role rather than globally.** The Simulation tab is
**shown for the 20 DPS specs and hidden for the 5 Healer and 2 Tank specs**. The old argument for
hiding it outright — a caveat under a confident-looking number is not enough, because people read the
number and skip the caveat — is unchanged; what changed is that a DPS spec is the audience the
estimate was built for. `?simulation=1` still forces it on for any role, and is now explicitly an
escape hatch for development and for the browser tests that exercise the healer and tank math, not a
second product decision.

The tab is **derived, not corrected**: `currentTab` falls back to the planner when the active tab is
one the bar no longer offers, instead of an effect writing state back. That path is a guard rather
than one a player can walk — the character selects live on the planner's rail and the Simulation tab
has no rail, so the spec cannot change while that tab is on screen — and the comment says so rather
than implying otherwise.

**Two follow-ups from the talent pass are dropped by this rule**, and are recorded as dropped rather
than pending: the healing half of Spiritual Guidance and Lunar Guidance, and any tank mitigation work.
What is still worth doing on the talent side is DPS-only — Hunter's Combat Experience, Warlock's Fel
Stamina, and Heart of the Wild's Intellect half for Balance.

**A bug this introduced and the linter caught:** the stat-weights `useMemo` read `talentPoints`
without depending on it, so spending points would have left the stat priority showing the untalented
ordering until something else moved. Worth noting because `react-hooks/exhaustive-deps` is a warning
rather than an error here — it was only visible because the same run flagged a `setState` in an
effect as an error and made someone read the output.

---

## Start here (2026-08-21)

**Decision 2 is taken: talents reach `calculateStats`.** Spending points now moves the always-visible
stat rail, the gear rankings, the stat weights and the upgrade finder, not the hidden estimate alone.
The two surfaces used to disagree *by design*, and this file listed that as the single named reason a
talented tank read low. It is closed.

**It was done in this order deliberately: the base first, the talents second.** Layering talents onto
the stat pipeline while that pipeline still invented half of every caster's spell power would have
produced a number that moved for the right reason and landed in the wrong place.

**The mechanism is three shapes, not fifteen fields.** `TalentModifiers` was shaped after the debuff
record precisely because almost nothing a talent does fits `StatBlock` — but the stat-routed half
genuinely does, so it gains `statFactors` (multiply a stat), `statConversions` (so much of one stat
per point of another) and `itemArmorMultiplier`. The first two are **the same two shapes the sourced
base rates already use**, which is why `applyAttributeConversions` needed one extra argument rather
than a second mechanism.

**13 effects across six classes**, taking the ingest from 49 to **62**, and the refusal list from 49
groups to **43**:

| | | |
|---|---|---|
| Warrior | Vitality, Toughness | stamina x1.05, strength x1.10, item armour x1.10 at 5 points |
| Paladin | Divine Strength, Toughness | strength x1.10, item armour x1.10 |
| Rogue | Vitality, Sinister Calling | agility x1.05 and x1.15, **compounding to x1.2075** |
| Mage | Arcane Mind, Mind Mastery | intellect x1.15, then 0.25 spell power per Intellect |
| Priest | Spiritual Guidance | 0.25 spell power per point of Spirit |
| Druid | Lunar Guidance, Thick Hide | 0.25 spell power per Intellect, item armour x1.167 |

Measured against the app's own default sets: Protection Warrior **armour +9.6%, strength +10%,
stamina +5%**; Holy Priest **spell power +17.7%**; Fire Mage **spell power +23.4%, intellect +15%**;
Combat Rogue **agility +20.8%, crit +12.7%**.

**Toughness raises armour from items and nothing else**, which is the subtlest thing here and the
easiest to get invisibly wrong. Upstream reads `Equip.Stats()[stats.Armor]`, so the Agility-derived
armour this app added in the previous pass is *not* multiplied — that is why the Warrior's total moves
9.6% rather than 10%. The test gives a character 500 extra Agility and asserts the Toughness bonus is
**unchanged**; falsified by moving the multiplier after the conversions, which inflated it by exactly
the 100 armour that Agility's 1000 should not have earned.

**The empty-tree identity is asserted across all 27 specs**, not just Fury Warrior. It is what made
widening this safe: `talentPoints` defaults to `{}` everywhere, so if the modifiers were not exactly
the identity at zero points, every stat expectation in the suite would move at once.

**Three disclosures had already gone false, and one was a count in prose.** `featureFlags.ts` said
"**49 talent groups are refused by name**" — a number that went stale the instant the ingest changed,
with nothing failing, which is the repo's own rule about counts in prose proving itself again. The
count is now asserted from the data instead. `calculateSimulation`'s header said `talentPoints`
"reaches the simulation and **deliberately nothing else**". And **three refusal reasons still named
`calculateStats` as the blocker** — a test now asserts that none may, since it is not one any more.

**A talent that is both ingested and refused is the failure this pass could most easily have shipped**,
and it very nearly did: Paladin's Toughness was extracted while its "this is a product decision, not
an ingest" refusal stayed in place. The test that compares the two lists caught it. Nothing else would
have — the JSON would simply have contained a working effect and prose swearing it did not exist.

**Two talents carry a caveat rather than a second number.** Spiritual Guidance and Lunar Guidance
raise spell damage *and healing* in game, but wowsims has **no healer implemented for either class**
at the pinned commit — only Shadow Priest — so upstream models the damage half alone. The sourced half
is ingested; the healing half is recorded as a caveat rather than guessed, so a healer's estimate
still reads low by it. Sourcing that needs the tooltip, which is a different ingest.

**Thick Hide is read from the `else` branch on purpose.** Upstream gives 0.5/3 a rank in Bear form
and 0.1/3 otherwise; this app models Feral as **cat**, the same call that gates `feralAttackPower` and
the cat-form attribute conversions. Matching the Bear branch would have handed every druid, Balance
and Restoration included, a bear's armour.

**Still open:** the Health and Mana talents (Survivalist, Fel Intellect, Mental Strength) have no
`StatBlock` field to land in and stay refused. Combat Experience, Fel Stamina and Heart of the Wild's
Intellect half are **expressible now and simply not ingested yet** — the refusals say so in those
words rather than claiming they are blocked.

---

## Start here (2026-08-20)

**The stat rail was wrong about gear, and it had nothing to do with talents.** The session opened on
the `calculateStats` decision — should talents reach the always-visible rail — and the audit that
preceded it found the rail was misreporting *gear* first, for reasons that decision does not touch.
The decision is still open and is now worth taking against numbers that are true.

`calculateStats` ended with six hand-written lines that were the app's **only** attribute
conversions. They were the one uncited block in a file where every other decision carries a sourced
paragraph, and they predate the ingest era. Three of the five were not TBC mechanics:

1. **Intellect and Spirit never grant spell power or healing power in TBC.** Every Int-to-spell-power
   conversion upstream is talent-gated (Lunar Guidance, Mind Mastery) and every Spirit one is
   Spiritual Guidance; there is no baseline. `intellect * 0.8 + spirit * 0.15` was **inventing 46%
   of a Fire Mage's spell power and 52% of a Holy Priest's**, on the surface that is always on screen.
2. **The rates are class-specific.** Strength is 2 attack power to a Warrior and **1** to a Rogue or
   Hunter. Agility is melee attack power for Rogues and cat-form Druids, *ranged* attack power for
   Hunters, and nothing for anyone else — the flat `agility * 0.35` matched no class in the game.
3. **Agility-to-crit is a per-class divisor** (Warrior 33, Druid/Paladin/Shaman 25, Rogue/Hunter 40),
   so `agility * 0.1` understated melee crit **five to seven times over**: a geared Fury Warrior was
   missing about 5.5% crit, a Combat Rogue the same.

Three conversions were **missing outright**: the *universal* Agility-to-Armor at 2 a point (a geared
Rogue was short over 500 armor on a row the rail never hides), Agility-to-Dodge, and Warrior
Strength-to-Block-Value.

**Base stats were invented too, and are race+class rather than class alone.** The app carried one
hand-written block per class — its Druid had 52 Strength against a real Night Elf Druid's 73, and
granted 72 spell power and 86 healing power that no druid has ever had. All **52 race+class blocks**
are now read from the pinned commit, and an import-time guard fails if any of the 51 combinations the
character creator can reach lacks one.

**What moved, measured against the app's own default sets:**

| | Spell Power was | now | of which was invented |
|---|---|---|---|
| Fire Mage | 1110 | **602** | 508 |
| Holy Priest | 819 | **393** | 426 |
| Resto Shaman | 674 | **305** | 369 |

Crit went the other way: a Fury Warrior's Agility-derived crit rating **21 → 143**, a Combat Rogue's
**27 → 150**, a Fire Mage's Intellect-derived spell crit **35 → 119**. The Fury Warrior reference
figures this file quotes moved with them — **192.3 → 215.3** untalented and **224.3 → 254.7**
talented, so the talent gain reads **+18.3%** where it read +16.6%.

**The finding most likely to be got wrong is upstream's, not this repo's.** wowsims applies Human's
+10% Spirit and Gnome's +5% Intellect as runtime stat dependencies, so its base tables are meant to
be racial-free — and it says so, in a comment dividing Gnome Mage Intellect by 1.05. But it leaves
**The Human Spirit baked into five of its six Human rows** while applying the multiplier again. Taken
at face value this app would have multiplied a third time: a Human Priest's Spirit reading 21% high.
Those five rows are divided back out at ingest, each decision printed with its evidence.

**Gnome Intellect is deliberately *not* corrected, and the measurement is the reason.** The same
double-count looked just as likely, but the Gnome rows measure 1.02x (Mage), 1.08x (Warlock), 1.18x
(Rogue) and 1.21x (Warrior) against their peers — a scatter that is a real racial base bonus on small
integers, not one multiplier applied inconsistently. A "divide when it moves closer to the peers"
rule was written first and **would have wrongly divided three of those four**; the Mage row, the one
upstream states it already divided, is the lowest of the four. Correcting a source needs evidence for
the specific row, not a plausible rule.

**wowsims' silences are not game facts, and the gaps are left as gaps.** It implements what it needs
to simulate, so a Priest has no Strength-to-attack-power entry and a Rogue no Intellect-to-spell-crit
entry. Every one of those falls in a row `statRelevance.ts` already hides for that spec, so none is
visible by default — but they are recorded as absent rather than guessed at.

**Four assertions now pin all of this**, and each was falsified before being trusted: re-adding
`intellect * 0.8` fails the spell-power test on the exact line, and disabling the racial
normalisation fails naming all five inflated rows. The tests also caught that several fixtures built
**Human Druids and Human Hunters** — combinations TBC does not allow, harmless while base stats were
one invented block per class and a hard error once they are read per race.

**Still open, and now worth taking:** whether talents should reach `calculateStats`. Nothing about
that decision changed except that the base it would layer onto is now correct.

---

## Start here (2026-08-19)

**The app is a working TBC Phase 2 planner, deployed and green.** Five sections: Character Planner,
**Raid Composition**, Spec Tier Lists, Raids, Professions. `156 tests passing`, `tsc`/`lint`/`build`
clean, brain idempotent, everything pushed to `origin/main`.

**The last three sessions were dominated by one theme: the app confidently reporting things that were
not true.** Seven false disclosures, a talent-point total that was wrong by 20, buff scopes that
over-credited by 5×, and exclusivity that over-credited a single Paladin by 8 buffs. Every one was
plausible, every one shipped, and most were caught by a person *using* the tool rather than by a
test. That is the pattern to expect, and the reason so much of this file is about verification.

**What most needs doing next**, in order:

1. **Rotations.** 25 of 27 specs are a single-ability approximation — the largest accuracy gap and
   the main reason the Simulation tab stays hidden. Scoped in `ROTATION-SCOPE.md`. **Not an ingest**;
   read that document before estimating it. Hunter first.
2. **The `calculateStats` decision** (owner's call, see §"three decisions"). Talents reach the
   simulation only, so spending points moves the estimate but *not* the stat rail, gear rankings or
   upgrade finder. The two surfaces disagree by design, and this is the single named reason a
   talented tank estimate reads low.
3. **Nothing else is blocking.** The raid planner, phase gating, talents, icons and layout are done.

**Three traps that will cost you an hour each if you do not know them**, all documented in full
below: `tests/planner.spec.ts` is **not type-checked**; the Browser pane does not composite while
hidden (screenshots fail, lazy images never load); and a scripted edit against a CRLF working tree
can match nothing and report success.

---

**The first 2026-08-15 session** shipped: the spec tier-list view; a merge of the target-debuff
rebuild; item and gem icons; planner sub-tabs and a spec-scoped stat rail; talents for all nine
classes; a rage model; the two-hander/off-hand fix and the weapon-proficiency and upgrade-finder
bugs it exposed; melee haste; trinket and weapon effects; the healer mana constraint; and meta gem
activation.

**The second 2026-08-15 session** (`773a8eb..054e035`, 34 commits) did, in order:

1. **Scoped talent scaling before building it** — `TALENT-SCALING-SCOPE.md`, kept precisely because
   the prediction it made turned out half wrong.
2. **Chores**: 19 stale branches deleted locally and on `origin`, both stale worktrees removed, CI
   moved off the deprecated Node 20 actions.
3. **Meta gem procs wired** — two gems that contributed literally zero.
4. **Ranked Gear collapsed per slot**, 9.0 → 6.1 screens, after measuring that this file’s own
   proposed fix would not have worked.
5. **`h3` roles named as tokens**, 62 lines of dead CSS removed.
6. **Curated item audit**: four *fictional* items deleted that were selectable in gear dropdowns,
   two real ones linked to the ingest.
7. **Buffs & Consumables restored** as the fifth planner sub-tab — its 33 sourced raid buffs had
   been reaching no number at all.
8. **Talent scaling built**: 1 spec → **all 11 Physical DPS specs**, six classes, 30 effects.
9. **Rage sources completed** — Bloodrage, Improved Berserker Rage, damage taken as an input.
10. **Encounter fixed to one boss**, zero controls, 7,700 armor.
11. **Six false disclosures found and fixed**, each now behind an assertion. This is the finding
    that outlasts the code — see the caveat rule in Rules, and §1.

**The 2026-08-18 session** was short and did two things, both of them corrections:

1. **A seventh false disclosure, in the file the entry above claims was fixed.** `featureFlags.ts`
   said talent scaling "reaches the simulation nowhere at all" — true on 2026-08-16, false from
   2026-08-17, and still there. Every bullet in that file is now pinned by an assertion, the sharpest
   being that the caster and healer paths must score *identically* with real talent points. Verified
   by falsification. See the caveat rule in Rules, and §1.
2. **The rotations gap scoped — `ROTATION-SCOPE.md` — and this file's hypothesis about it was wrong.**
   Rotations are **not** an ingest. Talents were cheap because upstream had already reduced each one
   to a number; a rotation upstream is an imperative state machine over a timeline this simulator does
   not have. Recommendation is a per-spec closed-form extension on a short list, Hunter first — its
   three specs are excluded by an effect-type filter rather than by missing data, though the
   derivation of Steady Shot's rate against auto-shot weaving is still real work.

Also corrected: **"7 caster and 2 healer specs" was wrong in four places** and was never right — the
split is 9 Caster DPS, 5 Healer, 11 Physical DPS, 2 Tank. It is asserted now, not written.

**The 2026-08-19 session** audited the app against its own "Phase 2 and only Phase 2" target, and the
headline is that the gate was **already right where it mattered** — `getItemsForSlot` applies
`defaultMaxPhase = 2`, so the picker, the default set and the upgrade finder never offered later
content, and 1,196 of the 4,554 catalogued items are hidden by it. Raids are the correct five. Tier
sets stop at T5. There is no phase selector to get wrong.

What leaked was narrower and worse: **three paths resolve items by id and so skip the gate entirely**
— the Ranked Gear panel's Equip button, restoring a saved build, and importing one. All three could
seat Phase 3+ gear that the Gear panel would then refuse to list, counted in every stat total. Closed
with `isWithinDefaultPhase`, kept deliberately distinct from `isItemAllowedForCharacter` so an import
says "is Phase 3 gear" rather than blaming the class.

And **Wowhead's Phase 2 BiS guides genuinely rank five items Phase 2 cannot reach.** Both were traced
to their real source before touching them — Band of Eternity needs Scale of the Sands (Mount Hyjal,
Phase 3) and Hailstone Pendant drops from Ahune's Ice Chest (2.4) — so this was Wowhead being
forward-looking, not a bad ingest. Dropped, and the count exported as `excludedByPhase` so the filter
is asserted rather than silent. See §"Findings" for both, and for why an item-level rule would have
been wrong.

**Talents then reached the caster and healer paths**, closing the item this file had listed as the
top of the queue. `calculateCasterDps` and `calculateHealing` now take `TalentModifiers`, all nine
classes are ingested (**30 → 49 effects**), and coverage goes **11 → all 27 specs** once the tank
path followed. The plumbing went first on purpose: ingesting Mage effects with no caster talent
argument to reach would have been this repo's signature failure, data wired to nothing.

**Coverage is not the same as completeness, and the second number is the honest one: a named list of
talent groups is still refused.** (That sentence said "49" until 2026-08-21, when six of them started
applying and the number quietly became wrong — it is computed from the data now, in four places that
used to write it down.) Two kinds dominated — per-spell talents needing a spell school this
simulator does not record, and stat-pipeline talents (Toughness, Vitality) whose route runs through
`calculateStats`, which is the owner's open decision. A talented estimate still reads low.

The gains are deliberately modest — **+1.5% to +7.6%** — because only the character-global half is
expressible. Per-spell talents (Ignite, Shadow Weaving, Ruin) need a spell school and a per-spell
coefficient, neither of which exists here, so **45 groups are refused by name**. The exception is
**Meditation**, which changes what a *stat* is worth: it takes a Holy Priest's mid-cast regen from
**11.6 to 24.6 mana/sec**, and Spirit stops pricing at zero.

**The documentation was then audited end to end**, which found more rot than the code did. `ROADMAP.md`
was 13 days stale and still described the *pre-ingest* era — "item stat blocks are best-effort
approximations", "no talent scaling anywhere", a `training-sword` bug fixed by deleting the fictional
item, and `src/data`, which no longer exists. `README.md` still said "No talent trees". The generated
Known Limitations still called the catalogue "largely representative sample gear".

**Six process patterns were recorded in `ROADMAP.md` under "How decisions get made here"**, and
eight new entries in the Decision Log. They are written as process rather than outcome because the
outcomes keep changing and these have not: measure before designing, plumbing before data, verify
before correcting, coverage is not completeness, a caveat needs something that fails, and falsify an
invariant before trusting it.

**Buff exclusivity was the last correctness gap, and the biggest** (2026-08-19, spotted by the repo
owner using the tool). One Paladin credited a raid with **all five Greater Blessings and all three
auras**; one Warrior with both shouts. `domain/buffs/buffExclusivity.ts` now caps each group at the
number of providers, in a stated priority order, and records whether the constraint is a **game
rule** (Paladin blessings and auras — both quoted from tooltips) or a **raid convention** (Warrior
shouts — neither tooltip states exclusivity, so this is what rosters actually run rather than what
the client enforces).

The planner also gained a **fillable header** — title, date, start time, description — drawn onto the
exported PNG at a deliberate type scale: title largest, when it is next, description smallest. That
work also fixed a real export bug the owner had hit: the filename was constant, so every export
after the first landed as `…(1).png` and opening the plain name returned the *first chart ever made*.

**`TALENT_POINTS_AT_70` was 61 all along and the code said 41** (fixed 2026-08-19, spotted by the repo
owner). 41 is the points needed to reach the bottom of *one* tree; the total available at 70 is 61.
The old comment gave the right derivation and the wrong answer — "one per level from 10 to 70" is 61
levels. Anchored rather than recalled: Wowhead's **level-60** Classic guides publish builds as 17/34/0
and 20/31/0, all summing to **51**, and 60 − 9 = 51. Same formula gives 61 at 70.

**That page was reached through a `/tbc/` URL and served Classic** — title "WoW Classic", 71
`/classic/` links, zero `/tbc/` ones. The same wrong-expansion redirect this file already records for
the enchant guides. Its 51 is right *for level 60*; taking it as TBC's figure would have swapped one
wrong number for another.

**Raid builds are a raidcomp-local concept, deliberately not new `TbcSpec` members** (2026-08-19). A
roster asks *what are you bringing tonight*, which distinguishes a bear from a cat where a gear
planner does not. Widening `TbcSpec` would have meant inventing a BiS list and a talent tree for
something Blizzard never shipped as a spec, so `RaidBuild` maps back to a real `(class, spec)` pair
and **buff coverage matches on that pair, never on the build** — a bear and a cat are one talent tree
in two forms and bring the same Leader of the Pack. **Role is the one axis that does differ**, and
reading it from the spec is what made a seated bear report "0 Tank".

29 builds: 27 specs, with Feral *replaced* by Bear and Cat, and Dreamstate *added* alongside
Restoration. The difference matters — an earlier version had Dreamstate replacing Restoration, which
silently removed Restoration Druid from the picker.

**Dreamstate does not bring Moonkin Aura, and that is the fact most likely to be got wrong.** It is a
**Balance** talent at row 6 (*"Regenerate mana equal to 10% of your Intellect every 5 sec, even while
casting"*), so the build spends ~25 points in Balance and the rest in Restoration — which makes it
tempting to model as Balance. But the aura only radiates in Moonkin Form, and a druid in Moonkin Form
cannot cast healing spells in TBC, so a Dreamstate healer is never in the form that grants it.
Modelled as Restoration, asserted both ways.

**Spec icons are curated, not derived.** The deepest-talent rule was deterministic and
unrecognisable — `inv_sword_11` for Protection Warrior, `inv_misc_head_dragon_01` for Fire Mage. They
are now the conventional TBC spec icons, and `fetch-icons.mjs` downloads every name so a typo cannot
ship as a broken image. **Build icons live in their own map** and were initially left out of that
fetch, which named the bear paw without ever downloading it.

**The planner then gained icons, drag-and-drop and player names** (2026-08-19, by request). Specs and
buffs both render real artwork; granted buffs sit under each group as an icon row, the way Wowhead
shows them, because 24 buff names under one group is a wall of text nobody reads.

**A spec has no icon of its own in TBC.** The convention is the tree's deepest talent — Mangle for
Feral, Shadowstep for Subtlety, Avenger's Shield for Protection Paladin — so spec icons are *derived
from talent data already in the repo*, with the source talent recorded so the choice stays auditable.
Buff icons come from each spell's id-keyed Wowhead payload, cross-checked on `name_enus`.

**One icon looks like a bug and is not.** Greater Blessing of Might's file is literally
`spell_holy_greaterblessingofkings` — Blizzard reused a misleadingly named asset. An earlier pass
assumed the parser had grabbed a neighbour and nearly "corrected" accurate data. A test now pins it,
including that Kings itself uses the *different* `spell_magic_` file.

**Two real bugs surfaced only by driving the UI**, neither visible to `tsc`. The name field was
uncontrolled, so any roster re-render discarded what had been typed; it is controlled now. And
`loadRoster` validated each seat by rebuilding it from class and spec alone, **silently dropping every
player name on reload** — the roster came back looking correct, just anonymous.

**Then the raid planner was rebuilt around groups, because the first version was wrong about TBC.**
24 of the 33 raid buffs are **party-scoped** — every totem, every aura, both Warrior shouts, Arcane
Brilliance, Gift of the Wild — and reach only the caster's group of five. Treating them as raid-wide
told a raid leader Battle Shout was covered when **five of twenty-five** players had it. In TBC,
composition *is* group assignment, which is exactly why Wowhead's tool has groups.

The scopes are **sourced, not recalled**: `tools/ingest/ingest-buff-scope.mjs` reads each spell's own
tooltip. Battle Shout says "all party members within 20 yards"; Greater Blessing of Might says "all
members of the raid or group". 38 of 39 resolved from the tooltip alone; Unleashed Rage is a cited
override because spell 30806's page carries no description at all. Final split: **Party 24, Raid 5
(exactly the Greater Blessings), Single 4, Target 6.**

The planner is now a seating chart — five groups of five, party buffs listed under each group — plus
**roster persistence** and a **PNG export**. The image deliberately carries the seating only: on
screen the buff lists are the decision surface, but what a raid wants pasted into Discord is "am I in
group 3", and forty lines of buff annotation would bury it.

**A raid-composition planner was added** (2026-08-19, by request, modelled on Wowhead's TBC tool). A
fifth section: pick 10 or 25, add specs, see which of the 33 raid buffs and 8 target debuffs the
roster actually brings, plus role balance and what one more seat would buy you.

**It was cheap for one reason worth repeating: the data was already sourced and already correct.**
The feature invents nothing — it is the same 33 buffs and 6 debuffs the Buffs panel shows, each cited
to a spell rank. And it is the surface where **`notModelled` stops mattering**: 15 of the 33 cannot be
expressed as a stat change, so `calculateStats` can only apply 18 — but a raid leader planning around
Bloodlust does not care whether the simulator can price it. This is the first place that dataset is
worth all of itself.

**The one real change underneath was typing `providedBy`.** It was a display string — "Warrior",
"Feral Druid" — which is fine for printing and wrong for matching. Coverage now compares
`providedByClass` and `providedBySpec` exactly, because the failure mode of a near-miss is silent:
the buff is never credited, coverage under-reports, and a raid leader recruits for a seat they had.
The display string is now *derived* by `describeProvider`, so the two cannot drift. All 39 entries
round-tripped back to their original strings before the old field was removed.

Then, on the owner's call, **main-hand and off-hand picks were separated into their own rankings.**
A one-hander is catalogued `Main Hand` but is legal in either hand, so every one-hander the guide
ranked under "Off Hand" was being filed as a main hand — a Fury warrior's Main Hand read
`#1 #1 #2 #2 #3 #3 #4 #4`. The section now decides the slot unless the item cannot go there, six
entries move, and ranks are made dense per slot. **Rank density is now asserted across every list**,
which was not possible before.

The Simulation tab is **still hidden**; that decision was deliberately left to the repo owner, and
was re-confirmed on 2026-08-18.

Repo: `C:\Users\josep\OneDrive - Saint Louis University\Project Defeat`, on GitHub as
`josephevenson08/project-defeat`. Working tree is clean apart from `Untitled.canvas`, which is the
owner’s own file — leave it alone. **Read `git log -1` for the current commit rather than trusting a
SHA written here**; this line has named a stale one twice.

---

## Live site

**https://josephevenson08.github.io/project-defeat/** — deployed by `.github/workflows/deploy.yml`
on every push to `main`, gated on `tsc`/`lint`/`build`. Playwright is deliberately not run in CI (it
needs browser downloads and a dev server); it runs locally before a push, which is what the commit
gate rule below is about.

`vite.config.ts` sets `base` **for builds only**. Pages serves this as a project site under
`/project-defeat/`, but the dev server and the whole Playwright suite address the app at `/`, so
setting `base` globally sends every test to a path nothing serves.

## Rules

- **Push to `origin/main` after each completed feature.** No branches or PRs unless asked.
- **Gate commits on the real test exit code**, never a piped `tail` — the pipe reports the tail's
  status, and a red commit was pushed that way once.
- **Do not edit `src/` while the suite is running, and do not read its progress with `tail`.** Two
  separate traps, both hit on 2026-08-18. Editing during a run triggers Vite HMR on every open page
  and took the suite from **8.9m to 19.6m** — comment-only edits, so the result stayed valid, but a
  behavioural edit mid-run would have produced a result describing no version of the code. Do
  doc-only work while it runs, or wait.

  The second trap looks exactly like a hang: the line reporter overwrites one line with cursor-up
  codes (`\x1b[1A\x1b[2K`), so `tail` on the redirected file shows whatever chunk it lands on and can
  sit at the same test number for minutes while the run advances normally. `grep -o "\[[0-9]\+/[0-9]\+\]"
  | sort -n | tail -1` reads the real position; `stat -c %y` on the file distinguishes a stall from a
  slow test in one command.
- **If a test run dies partway with `ERR_CONNECTION_REFUSED`, it is the dev server, not the tests.**
  Seen twice in a row from a worktree: tests 1-40 pass, then every remaining test fails to reach
  127.0.0.1:5173 because the Playwright-managed Vite server has exited. The fix is to start the
  server yourself on 5173 first — `reuseExistingServer: true` means Playwright adopts it instead of
  managing its own — after which the full suite passes. Read the exit code, but read the *failure
  mode* too: a dead server and a broken assertion both come back as exit 1.

  **One cause is now known: never run two suites at once.** `reuseExistingServer: true` means the
  second run adopts the first run's server, and when the first finishes it takes that server down
  mid-flight, so the second collapses into `ERR_CONNECTION_REFUSED` from wherever it had got to.
  Start one server by hand and run one suite against it.
- **Line endings: check, never assume — and `git ls-files --eol` is the only answer worth trusting.**
  `core.autocrlf` is **true** here, so *every* file is stored LF in the index and the working-tree
  copy is whatever last wrote it. That means the working-tree endings drift: this file and
  `tests/planner.spec.ts` are currently `w/crlf`, `README.md` and `src/App.tsx` are `w/lf`, and a
  fresh clone would hand you CRLF for all of them. An earlier version of this rule asserted
  "planner.spec.ts is LF" as a fact about the repo; it was only ever a fact about one working tree at
  one moment, and it stopped being true without anything going wrong.

  What still bites is the same thing in either direction: a pattern containing `\n` matched against a
  CRLF file finds nothing and "succeeds". So run `git ls-files --eol <path>` before any scripted
  edit, and prefer patterns that cannot care — single-line matches, `\r?\n`, or appending with the
  endings the file already has. **Committed bytes are unaffected either way**, so a working-tree flip
  is not itself a defect to chase.

- **A scripted edit must count what changed, not what it meant to change.** This cost a full test
  run: a script that inserted a line after `await openApp(page)\n` incremented its counter on the
  *marker test* and then called `.replace()`, which matched nothing against the CRLF working tree. It
  cheerfully reported "4 tests patched" having written the file unmodified, and the failure only
  surfaced two ten-minute suites later. Compare the string before and after, report from that, and
  verify the result with an independent `grep` rather than trusting the script's own tally.
- **`npm run brain` must stay idempotent** (a second run reports `0 written`). The repo lives in
  OneDrive, so churn matters.
- **Wowhead rate-limits (HTTP 403)** once a run checks several candidate pages per lookup. Every
  ingest script caches to `tools/ingest/.cache/` — reuse it rather than re-fetching.
- **Leave `Untitled.canvas` alone**, it's the user's own file.
- **Never invent data.** Anything not read off a real source gets `needsVerification: true`. This
  project's whole history is recovering from plausible-looking invented values.
- **A caveat needs something that fails when it stops being true.** Six user-facing statements were
  found *wrong* in one session — `featureFlags.ts`, the rotation summary's list of unmodelled rage
  sources, the stat-weights "haste is not modelled" flag, the upgrade finder's "most of this catalog
  is estimated", a restored encounter target the player could not change, and a tank note that
  implied talents were counted. **Every one was true when written.** Closing a gap never forces the
  text describing it to change, so the text rots silently — and a confident wrong caveat is worse
  than no caveat. Write the assertion with the sentence: a flagged-unmodelled stat must score zero,
  the "two specs" figure must match the ability data, and so on.

  **`featureFlags.ts` then rotted a second time, one day after being fixed** (found 2026-08-18,
  §1) — so the rule's real lesson is that *fixing* an instance buys nothing on its own. Only the
  assertion does. Prose corrected without one has a demonstrated half-life here of about a day.

  **A count in prose is the same defect wearing different clothes.** "7 caster and 2 healer specs"
  appeared in this file twice, in `featureFlags.ts` and in a test comment; the real split is 9 and 5,
  with 2 tanks, and nothing had to change for it to become wrong — it was miscounted at writing and
  then copied. Counts belong in assertions computed from the data, which is the same rule the repo
  already states as "counts are computed, never written into prose".

## Verify you're where this describes

```bash
npx tsc -b                            # exit 0
npm run lint                          # exit 0
npm run build                         # exit 0
npx playwright test --reporter=line   # 221 passed, 0 skipped, 0 failed
npm run brain                         # "all wikilinks resolve"
npm run brain                         # "0 written" — idempotent
```

---

## What the app is

A local-first React + TypeScript + Vite planner for WoW TBC Classic, targeting Phase 2 (SSC/TK,
Tier 5). No backend, no runtime network calls — typed data and generated JSON in the repo.

**Layout:** intro → a **section picker** (Character Planner / Raid Composition / Spec Tier Lists / Raids / Professions)
→ the chosen section, with a tab bar for moving between them afterwards. Discord skeleton underneath:
a left rail, one main pane, popups layered over rather than modes you travel between. Tesla's
restraint in the palette, Nothing's detailing: flat surfaces, hairline rules, tracked uppercase mono
labels, tabular figures, no gradients.

**The planner is a second level of tabs** — Gear / Talents / Ranked Gear / Build — each rendering
only its own panel. See §2b for why, and for the measurements behind it.

**The rail is section-specific.** Planner: the character selects plus the stat readout. Raids: the
raid switcher. Raid Composition, Tier lists and Professions: none. A rail of numbers beside a loot table would describe
something not on screen. The stat rail is also **scoped to the spec** — 12 rows on a Fury Warrior
rather than 26 — with a "show all" toggle; again §2b.

**Entering the planner runs character creation** — four steps, faction → race → class → spec, each
committing immediately so an earlier change re-narrows everything after it. A restored build skips
it; the rail's "Start over" reopens it.

**Colour policy:** item quality colour is information, not decoration, so it stays and everything
else is near-monochrome *specifically so quality reads first*. Socket colours likewise. Role accents
keep a muted hue. Audited: the only saturated colours anywhere are item quality and the warn amber.

## The data

Every dataset is real and from a pinned source. Regenerate any of them:

```bash
node tools/ingest/ingest-items.mjs              # 4,505 items from wowsims/tbc @3301fca5
node tools/ingest/supplement-items.mjs          # +23 Wowhead-only items
node tools/ingest/ingest-gems-enchants.mjs      # 212 gems, 79 enchants
node tools/ingest/supplement-enchants.mjs       # +15 Wowhead-only enchants
node tools/ingest/ingest-consumables.mjs        # 31 flasks/elixirs/foods
node tools/ingest/ingest-bis.mjs                # BiS rankings, 27 specs
node tools/ingest/ingest-bis-recommendations.mjs # gem + enchant picks per spec
node tools/ingest/validate-sample.mjs --sample 32 --max-phase 2 --quality Epic
node tools/ingest/reconcile-curated.mjs --check-wowhead
node tools/ingest/ingest-talents.mjs --class Warrior  # one class; 9 classes = 579 talents
node tools/ingest/ingest-talent-builds.mjs      # wowsims raiding builds for 17 of 20 DPS specs
node tools/ingest/ingest-node-spawns.mjs        # 45 gathering nodes, 14,091 spawn coordinates
node tools/ingest/link-raid-loot.mjs            # links raid loot to the catalogue by exact name
node tools/ingest/wowhead-lookup.mjs --spell-name "Battle Shout"  # read-only lookup aid
node tools/ingest/ingest-buff-scope.mjs         # party vs raid scope for all 39 buffs/debuffs
node tools/ingest/ingest-raidcomp-icons.mjs     # 39 buff icons + 27 spec icons (deepest talent)
node tools/ingest/ingest-tier-lists.mjs         # 3 spec tier lists, 28 placements
node tools/ingest/ingest-item-effects.mjs       # 49 trinket/weapon procs and on-use effects
node tools/ingest/ingest-meta-gems.mjs          # colour conditions for all 18 meta gems
node tools/ingest/ingest-icons.mjs              # icon *names* for 4,741 items and gems
node tools/ingest/fetch-icons.mjs               # the artwork itself -> public/icons/ (1,238 files)
```

| | Was | Now |
|---|---|---|
| Items | 230, inferred | **4,554** merged, validated |
| BiS entries | 463, only 2 deeper than rank 1 | **1,428** across 27 specs |
| Gems | 11 | **212** |
| Enchants | 22 | **91** |
| Consumables | 14 | **31** |
| Gem/enchant recommendations | none | **107 + 274** |
| Raid buffs | 14, all unverified | **33**, each cited to a spell rank |
| Target debuffs | 6, all unverified | **6**, each cited to a spell rank |
| Tier set bonuses | 9 sets, partly paraphrased | **34 sets** (T4 + T5), 71 bonuses, verbatim |
| Talents | none | **579** across all 9 classes, 27 trees |
| Talent *effects* | none | **49** across all 9 classes, reaching all 27 specs |
| Spec tier lists | none | **3 lists**, 28 placements, all 27 specs |
| Icons | none, two-letter glyphs | **1,609 files** vendored, 2.8 MB — items, gems and talents |
| Item effects | 14 curated, 0 ingested | **55 items**, 46 of 175 trinkets |
| Meta gem conditions | never checked | **18 of 18**, enforced and explained in the panel |

---

## Findings worth not rediscovering

- **The old catalogue was inferred, not sourced.** Of 98 hand-written entries matching an ingested
  item, 87 disagreed; all 119 verifiable conflicts went to live Wowhead tooltips and scored
  **curated 0, ingested 119**. `sampleItems.ts` is now a *provenance* layer only — drop location,
  roles, crafting, trinket effects. Never add mechanical data there.
- **TBC gem colours are not socket colours.** Sockets are Red/Yellow/Blue/Meta; gems add three
  hybrids and they are the majority (118 of 212). `gemFitsSocket` encodes it: a hybrid counts as
  *both* its component colours.
- **Wowhead guides are client-rendered but their source is in the served HTML** as escaped BBCode
  inside the page's JSON. Parsing that beats driving a browser and is reproducible.
- **Wowhead redirects can serve the wrong expansion.** Several spec-specific enchant-guide URLs 301
  to the *Cataclysm* version. `ingest-bis-recommendations.mjs` checks each page's title; TBC pages
  say either "TBC Classic" or "Burning Crusade Classic 2.5.1".
- **Names are the classic trap.** Ingestion corrected "Cataclysm Headguard" → *Cataclysm Helm*,
  "The Nexus-Key" → *The Nexus Key*, "Voidheart Cover" (fictional) → *Voidheart Crown*, and
  "Elixir of Major Fire Power" → *Elixir of Major Firepower*.
- **Three BiS slots have no ranking, correctly** — Feral and Retribution swing two-handers, and the
  Holy Paladin guide publishes no Libram section. Recorded in `RANKING_GAPS` in the test file.
- **The raid buffs were the last invented dataset, and five of the fourteen were wrong** — not
  approximate, wrong. Gift of the Wild was modelled as +5% to all stats when it is a flat +14; Wrath
  of Air Totem as spell haste when it is spell power (haste is the WotLK version of that totem);
  Totem of Wrath as 141 spell power when it grants none at all. Now 33 entries, each with the
  `spellId` of the rank its numbers were read from.
- **Wowhead's *listing* page is what makes spell selection unambiguous.** The earlier attempt failed
  partly on picking the right spell. `/tbc/spells/name:X` carries rank, level and required class per
  row, which is enough to take the max rank a raid uses and reject the NPC copies. The rows live in
  a `var listviewspells = [...]` assignment in the served HTML — the `new Listview({...})` call
  further down only references the variable, so reading that call gets you an identifier, not data.
  The rows are JS object literals, not JSON (`quality:-1` is unquoted), and spell names contain
  colons, so bare keys have to be quoted with a scanner rather than a regex.
- **Individual spell pages carry the tooltip in `g_spells[<id>].tooltip_enus`**, and item pages in
  `g_items[<id>].tooltip_enus` — an item tooltip embeds its whole set listing and every "(2) Set:"
  line, so one piece sources a set's bonuses. Both are far more reliable than the prose the old
  parser was fighting. `tools/ingest/wowhead-lookup.mjs` does the fetching, decoding and
  rank-disambiguation; it prints and writes nothing, because the reading is the part that has to
  stay human.
- **"Improved <totem>" spell names in the 37xxx range are Tier 4 set bonuses, not talents.** 37223
  "Improved Strength of Earth", 37210 "Improved Mana Spring Totem" and 37212 "Improved Wrath of Air
  Totem" are the Cyclone 2-piece bonuses. This is easy to get backwards because the real talents
  reach similar numbers by a different route — Enhancing Totems (2 ranks, +15%) takes Strength of
  Earth to the same 98 the set bonus reaches by adding a flat 12. The talent that raises Mana Spring
  is called **Restorative Totems**, not "Improved Mana Spring Totem"; there is no Improved Wrath of
  Air Totem talent at all.
- **The upstream item database is the game's item table, not a list of wearable gear — and that put
  encounter props in every default loadout.** `getDefaultItemForSlot` picks by highest item level, so
  before `domain/gear/obtainability.ts` existed **all 27 specs opened holding one of Kael'thas's
  Tempest Keep encounter weapons**. Every stat total, simulation and stat weight in the app started
  from a weapon that cannot be held, and the upgrade finder never proposed a weapon because nothing
  beats ilvl 175. The evidence is in the data, not recall: those seven are the **only** items at ilvl
  175 in a 4,505-item catalogue, eleven levels above ilvl 164, which is Sunwell and the highest
  obtainable gear in all of TBC. Trashbringer is likewise alone at 155 with no Wowhead source tab.
  Excluded at `isItemAllowedForCharacter` **and** in `defaultGear.ts`, because the starting set is
  built before any character exists and never passes through that gate.
- **Two tests were codifying that bug** and are worth not "fixing" back: one asserted Warp Slicer was
  a Combat Rogue main-hand option, and one required the upgrade finder to flag at least one row as
  resting on estimated stats. The second stopped holding for the *right* reason — Fury Warrior's
  defaults became real sourced epics, so its upgrades compare sourced against sourced. Fury is the
  only one of 27 specs in that position, and a domain test now pins that the disclosure still fires
  for the other 26.
- **The default gear set used to equip a two-hander and an off-hand at once — in 18 of the 27
  specs.** `defaultGear` fills each slot independently by highest item level, so a Fury Warrior
  opened holding a two-handed sword *and* a one-handed mace, and every caster a staff *and* a sword.
  Not cosmetic: the off-hand's stats were counted (+52 attack power for melee, +28 stamina for
  casters) and `isDualWield` added a whole phantom off-hand's white damage on top. Fixed —
  `twoHanderOccupiesOffHand` plus an `EMPTY_OFF_HAND` placeholder, applied in `defaultGear`, in
  `normalizeGearForCharacter` and in `applyWeaponSlotRules` on every manual gear change. Melee DPS
  fell to its honest value: **Fury 196.5 → 165.6, Arms 233.7 → 203.2, Combat Rogue 205.6 → 185.6**,
  and Combat Rogue then fell again to **157.4** when the proficiency fix below took its two-hander
  away and gave it two one-handers. Feral is unchanged, correctly, because cat form swings its own
  weapon.

  **Those were the current figures against the 10,643-armor target.** They were then 192.3 / 236 /
  185.6-ish against 7,700, and moved again on 2026-08-20 with the sourced base stats (Fury 215.3) — the fix they describe is still real, but read the numbers as a record of
  what that fix did rather than as today's readouts.

  **The reverse rule is what the first attempt got wrong, and it is the subtle half.** An empty off
  hand is legal *only* beside a two-hander, but the placeholder passes `isItemAllowedForCharacter` —
  it has no restrictions to fail — so nothing ever replaced it. Switching to a one-handed spec left
  the slot empty forever, which cost a **Protection Warrior its shield** and with it every block term
  in Effective Health. `normalizeGearForCharacter` now refills an empty off hand whenever the main
  hand is not two-handed, and a test asserts both directions.

  `EquippedGear` is a `Record<GearSlot, EquippedSlot>`, so "empty" is not otherwise representable —
  hence a placeholder rather than an optional slot, which would have rippled through every consumer.

  **The fix surfaced two more real bugs**, both of which had been hiding behind the illegal pairing:

  - **Rogues were being handed two-handed weapons.** TBC gives one- and two-handed swords, axes and
    maces the *same* `weaponType`, so "Rogues may use swords" silently admitted two-handers, and the
    default Rogue opened holding Twinblade of the Phoenix. The same hole would offer a Mage or
    Warlock a two-handed sword, since neither class's illegal list mentions swords at all.
    `TWO_HANDED_PROFICIENCIES` now states, per class, which types are legal in two-handed form —
    Rogue is an empty set, deliberately, because "none at all" is the rule.
  - **The upgrade finder recommended upgrades that cannot be equipped.** With the off hand held shut
    by a two-hander it holds `EMPTY_OFF_HAND`, so every one-hander in the catalogue scored as an
    enormous gain against nothing and topped the list at **+31 DPS** — an upgrade the player cannot
    take, and one `applyWeaponSlotRules` undoes the moment they try.
- **Melee haste used to reach no output at all** — `weaponDiceToWhiteDps` is `avg/speed` and
  `attackPowerToWhiteDps` is `AP/14`, and neither read `hasteRating`, so the rail displayed a stat
  that did nothing and the stat-weight engine priced it at exactly zero. Fixed: white damage scales
  by `(1 + haste)` and rage income with it. **It changes no current number**, because only 78 of
  4,554 items carry melee haste and none is Phase 2 raid gear — so the test injects 158 rating
  (exactly +10%) rather than equipping something. Worth knowing before "fixing" it again: the
  absence is real TBC, not missing data.
- **Icon names come from the upstream the catalogue already uses, not from scraping Wowhead.**
  `assets/item_data/all_item_tooltips.csv` in wowsims/tbc, at the same pinned commit, carries an
  `"icon"` field for ~30,000 items — one request for the whole mapping. Two dead ends first: wowsims'
  `all_items.go` has no icon field at all, and Wowhead's item *listviews* carry `displayid` rather
  than an icon name, cap out around 1,720 rows, and apply their URL category filters client-side —
  `/tbc/items/head/quality:4` and `/tbc/items/quality:4` return byte-identical HTML.
- **`allItems` is 4,554 while `itemCatalogue.json` is 4,505.** This figure read **4,560** until
  2026-08-19, and the six-item drift is fully accounted for rather than merely corrected: **four**
  fictional curated items were deleted (curated 230 → 226) and **two** real ones — Choker of Vile
  Intent and The Sun King's Talisman — were given their `wowItemId`, so they now *match* an ingested
  row instead of merging as separate entries. Read the count off `catalogueMeta.mergedCount`, which
  is computed, rather than from prose. `itemCatalogue.ts` merges the ingested
  catalogue, the Wowhead-only supplement and the curated provenance layer. Any script deriving a
  per-item dataset must read `allItems`, not the JSON — reading the JSON silently missed "Blessed
  Book of Nagrand", which reached the paperdoll with no icon.
- **Raid loot notes reading "not yet in the item catalog" went stale without anything editing them.**
  That data was written when the catalogue held 230 hand-written items; it now holds 4,554, and 85 of
  the 124 unlinked entries named an item that was already present. They carried no `itemId`, so they
  drew the `??` frame and the note was simply false. `tools/ingest/link-raid-loot.mjs` links by exact
  unique name — never guessing where a name matches two items — and trims only that one stale
  sentence, so notes carrying something else real ("Wizard of Oz variant only") keep it. Resolution
  went 148 → **233 of 272**; Karazhan 19 → 35 of 45. The remaining 39 are correctly unresolved:
  mounts, enchanting formulas and tier tokens are not gear and should not draw a gear icon.
- **One provider supplies ONE buff from an exclusive group, and ignoring that was the largest
  over-credit this tool ever had.** A single Paladin used to credit a raid with **all five Greater
  Blessings and all three auras** — the difference between bringing one Paladin and bringing four,
  reported as "you are fine". Both are game rules with tooltip evidence: spell 27141 says *"Players
  may only have one Blessing on them per Paladin at any one time"*, and rank 8 Devotion Aura says
  *"Only one Paladin aura can be active per Paladin"*. `domain/buffs/buffExclusivity.ts` caps each
  group at the provider count, in a stated priority order.
- **`basis` on an exclusive group is load-bearing, not decoration.** Paladin blessings and auras are
  **game rules**; Warrior shouts are a **raid convention** — neither shout tooltip states exclusivity
  and wowsims applies both independently, so one warrior *could* maintain both. Raids do not, so the
  planner models one shout per warrior and says outright that this is a default rather than a
  mechanic. Keeping the two labels distinct is what stops an opinion hardening into a fact.
- **Exclusivity is per group, not per raid.** Two warriors in one party cover both shouts; the same
  two split across two parties give each party one. That is the seating decision the tool exists to
  make visible, and it is why `coverageForGroup` applies the constraint separately from `sectionFor`
  — it originally had its own loop and missed it, so a lone Fury warrior showed both shouts in the
  group row and one in the checklist.
- **The exported PNG wrote the same filename every time.** `25-player-raid.png` for every roster ever
  made, so each new export landed as `…(1).png` and opening the plain name gave you the **first**
  chart you had ever exported — indistinguishable from a stale export. The filename now carries the
  title and date. Separately, `revokeObjectURL` ran synchronously after `click()`, a race that can
  cancel the download outright; it is deferred now.
- **`tests/planner.spec.ts` is NOT type-checked.** `tsconfig.app.json` includes only `src`, so a
  missing import in a test surfaces as a runtime `is not defined` **mid-suite**, minutes in, rather
  than at `tsc`. That has now happened three times. Run the targeted test before trusting a green
  `tsc` on test-only changes.
- **The per-group buff row is party-scoped only, and that reads as a missing buff.** A Druid's Faerie
  Fire lands on the boss, so it is correctly absent from "what group 1 receives" — and correctly
  puzzling if you seated that Druid to get it. The coverage was always right (it shows under Debuffs);
  the problem was purely where a raid leader was looking. Answered with a **per-seat hover card**
  listing everything that player brings, split Party / Raid-wide / Debuffs so the distinction the
  planner is built on survives being answered. Revealed by CSS on `:hover` and `:focus-within`, so it
  needs no JS state and stays keyboard-reachable.
- **A new `.app-shell` rule placed after `.app-shell-no-rail` silently wins the cascade.** Both are
  one class, so source order decides, and the later rule reinstated the 288px rail track on every
  section that has no rail — Raid Composition, tier lists, professions rendered as a ~208px strip
  with the rest of the page empty. Scoped with `:not(.app-shell-no-rail)` now, and falsifying it
  reproduces the 208px exactly.
- **`.content` is a two-track grid and every view is now a single panel**, so a lone panel took one
  track and left the other blank. The talents page showed its three trees in a 557px box, wrapping
  the third underneath. Fixed by spanning a lone panel across both tracks; asserted on rendered
  geometry (all three trees share a `top`) rather than on CSS, because every rule involved was
  individually valid and only the outcome was wrong.
- **Verify a layout change at the width people actually use.** Both regressions above shipped because
  the checks were done at 375px and in a narrow preview pane — never at desktop width, which is where
  the app is used and where both were glaring.
- **`loadRoster` rebuilds each seat field by field, so any new field is silently dropped.** This has
  now bitten twice: `playerName` (restored rosters came back anonymous) and `buildId` (every Feral
  tank came back a cat, and the tank count read zero). Both validated cleanly and looked right.
  Rebuilding is still the correct shape — copying unvalidated storage into the model is worse — but
  **anything added to `RosterSlot` must be added there too.**
- **The app is fluid now, and the floor was the tab bar.** Fixed 940px containers and a hard
  two-column `.content` grid set a ~806px minimum; the last 95px after fixing those was five
  top-level tabs refusing to wrap. Measured at 375px: zero overflow.
- **Greater Blessing of Might's icon file is called `spell_holy_greaterblessingofkings`.** Not a
  mis-read: Blizzard reused a misleadingly named asset, and Wowhead's payload for spell 27141 says so
  with `name_enus` confirming the spell. Kings itself uses `spell_magic_greaterblessingofkings` — a
  different prefix — which is the only thing that makes the two distinguishable. A pass here assumed
  the parser had grabbed a neighbouring entry and nearly "corrected" accurate data; a test pins it now.
- **Raid-planner buffs render as icons, so assert their accessible name, not visible text.** A test
  written against `getByText` passed while the buffs were text rows and broke the moment they became
  icons. `getByAltText` is the stronger assertion regardless: an icon with no alt text fails it, and
  fails a screen reader for the same reason.
- **A "+9" in the raid planner's suggestions is buffs *and* debuffs together.** A Holy Paladin covers
  **8 buffs and 1 debuff**, and reading that as nine buffs is a mistake the first version of its own
  test made. The two counters are separate on screen; only the suggestion list totals them.
- **Suggestions collapse only where specs are genuinely interchangeable.** All nine Paladin entries
  are class-wide, so Holy, Protection and Retribution add an identical set and render as one "Any
  Paladin" row. The three Shaman specs do *not* collapse — each adds the same seven class totems plus
  one thing only it brings — and their spec-specific entry is sorted **first** so the truncated list
  shows the difference. Before that, three rows led with the same four totems and looked like a
  duplication bug while actually describing three different recruitment problems.
- **The app has a fixed minimum width of about 806px and is not mobile-responsive.** Measured at a
  375px viewport, every section overflows to the same figure, so this is a property of the shell
  rather than of any one panel. Worth knowing before "fixing" a panel that is merely matching it.
- **The ten files in `src/domain/raids/` were marked read-only on disk**, alone in the whole repo —
  an artifact of the worktree agent that created them on 2026-07-30. Any scripted edit there fails
  with `EPERM` until the attribute is cleared. Nothing else under `src/` has it.
- **The Phase 2 gate was real but partial, and the hole was every path that resolves an item by id**
  (2026-08-19). `defaultMaxPhase = 2` is applied inside `getItemsForSlot`, so the picker, the default
  set and the upgrade finder were always correct — the catalogue carries **1,196 later-phase items**
  (540 P3, 137 P4, 519 P5) and hides all of them. But `getItemById` / `getItemByWowItemId` are bare
  map lookups, and three surfaces used them: the Ranked Gear panel's **working Equip button**,
  restoring a saved build, and importing someone else's. Gear the Gear panel refuses to list could
  sit equipped and be counted in every stat total.

  **Item level is not the test, and an ilvl rule would have been wrong.** Tier 5 tops out at 141, but
  **Embrace of the Twisting Nether** and **Bulwark of the Ancient Kings** are genuinely Phase 1-2
  crafted epics at **ilvl 146**. The `phase` field is the authority; ilvl is a red herring. (The only
  other things above 141 are the eight already excluded as unobtainable.)

  Fixed with `isWithinDefaultPhase` applied at the three id-resolving paths, kept deliberately
  separate from `isItemAllowedForCharacter` — build import reports "is Phase 3 gear" rather than
  "isn't legal for a Beast Mastery Hunter", because the item *is* legal and the reason is the phase.
- **Wowhead's Phase 2 BiS guides rank five items Phase 2 cannot reach**, labelled in their own notes
  as "Optional", "Alternative" and "Seasonal". Both were verified to their real source rather than
  trusted from the phase number, because getting it backwards deletes legitimate rankings:

  - **Band of Eternity** (29294/29298) rewards the quest *Champion's Pledge*, which requires **Scale
    of the Sands** — the Mount Hyjal faction, and Hyjal is **Phase 3**. The quest text gives it away:
    the ring "will grow in power as you prove yourself to the Scale of the Sands", which is the
    29294 → 29295 → 29296 upgrade chain.
  - **Hailstone Pendant** (35511) comes from the **Ice Chest** that **Ahune** drops in the Slave Pens
    during the Midsummer event, added in **2.4** — Phase 5.

  wowsims' phase values are right in both cases. The entries are dropped in `bisLists.ts` rather than
  greyed out in the panel, because those rows carry an Equip button and the Gear panel will not list
  the items — so keeping them offers gear the rest of the app then refuses to acknowledge.
  `excludedByPhase` exports the count (**5**) so the filter is asserted rather than silent.
- **A one-hander is catalogued `Main Hand`, and taking that as the whole answer collided two
  rankings into one slot** (fixed 2026-08-19). The guides publish a "Main Hand" and an "Off Hand"
  section, and **the section says which hand the pick is for** — real information the build was
  discarding, because it let the catalogue's slot win unconditionally.

  The symptom: a Fury warrior's Main Hand read **`#1 #1 #2 #2 #3 #3 #4 #4`**, all four off-hand picks
  stacked on all four main-hand picks, while the off hand showed a *synthesised* fallback list rather
  than the four weapons the guide names for it. Arms read `[1, 2, 3, 3, 4, 4, 5, 6, 7]` the same way.

  **An intermediate diagnosis in this file was wrong and is worth not repeating:** it said the
  duplicates came from "two guide sections, one per weapon style". They do not — every section is
  named after a *slot*. The two-hander/one-hander split inside Arms' Main Hand list (ranks 1-3 versus
  4-7) is Wowhead's own ordering within a single section, and is left exactly as published.

  The rule is now **honour the section unless the item cannot physically go there**, which keeps the
  case the old rule existed for: "Claw of the Phoenix" is ranked in Hunter's *Main Hand* section and
  is off-hand only, so it still moves. `isItemCompatibleWithGearSlot` already encodes the asymmetry.
  **Exactly six entries move**, all one-handers returning to the off hand.
- **Ranks are made dense per final slot, as the last step of the build.** Two things open gaps: a
  phase drop removes a rank, and an item can change slots (Hunter's Main Hand read `#1 #3 #4` with
  nothing to explain the missing #2). Relative order is untouched. Done *after* the off-hand fan-out,
  because that can add entries too. A test now asserts density across every slot of every list —
  which only became assertable once the collision above was fixed.
- **Wowhead's tier lists are markup, not prose, which makes them the easiest ingest in the repo.**
  `[tier-list=rows]` wraps `[tier]` blocks carrying `[tier-label bg=qN]S[/tier-label]` and a
  `[tier-content]` of `[spec-badge=arcane-mage]` slugs. Read the spec from the **badge**, never from
  the `[url guide= hash=]` wrapped around it: on the healer page the Discipline Priest badge sits
  inside a link whose hash says `holy-priest`, because Wowhead publishes one shared Priest healing
  guide. Trusting the hash files Discipline under Holy and silently loses a spec.
- **The same spec can hold two different tier placements, and that is not a conflict.** Feral Druid is
  C-tier on the DPS list and S-tier on the tank list. Tier data is keyed by (role, spec) for this
  reason; the app's own `CharacterRole` is a *different* axis that classifies Feral once, as
  `Physical DPS`, so the two cannot be merged.
- **Wowhead draws tier letters in item-quality colours and this app deliberately does not.** S is
  `q5`, A is `q4`, B is `q3` on their pages. Reusing quality colour to mean "this spec is strong"
  would make the one chromatic signal in this interface ambiguous, so rank reads through the text
  ramp instead. Five tiers against four text tokens is why the rule beside each row steps down half a
  beat after the ink does — without that, B and C rendered identically, which only a measurement of
  the running page caught.
- **wowsims is not infallible where it disagrees with a tooltip.** It models Blessing of Wisdom at
  42 mp5; spells 27142 and 27143 both say 41. That was the only outright conflict across all 33 —
  everything else agreed to the digit — but it is the reason the tooltip is the tie-breaker.
- **The six target debuffs went the same way, and five of the six were wrong.** The three armor
  debuffs were stored as *fractions* of the target's armor (20%, 8%, 5%) and TBC has no percentage
  armor debuff: Sunder Armor is 520 flat per stack (2600 at 5), Faerie Fire 610, Curse of
  Recklessness 800, and they all stack. `armorReductionPercent` was therefore the wrong *shape*, not
  just the wrong number, and is now `armorReduction` in flat points. Winter's Chill was giving +10%
  crit to every caster when it is Frost-only, and Improved Seal of the Crusader was physical-only
  when its tooltip says "all attacks". Curse of the Elements' 10% was the one value that survived.
- **The tooltip-vs-wowsims tie-breaker went unused on the debuffs** — all six agreed to the digit,
  including every number that overturned what had shipped. Two sources agreeing is what makes a
  correction safe to make against data that already looked plausible.
- **Spell school is the thing the simulation cannot express.** Nothing in `SignatureAbility` or the
  simulator records whether a cast is Frost or Shadow, which is the whole reason Winter's Chill is
  `notModelled` rather than applied. Curse of the Elements is school-scoped too but stays modelled
  because it covers every modelled caster except Elemental Shaman. Adding schools would let both be
  exact.
- **Fifteen of the 33 buffs cannot be expressed as stats at all** (threat, maximum health,
  resistances, damage multipliers, weapon procs, timed cooldowns). They carry `notModelled` and
  render without a checkbox rather than being omitted. Adding any of them to the model properly
  means new `StatBlock` fields or simulation plumbing, not a data edit.

---

## What's left

### 1. The simulation's own known gaps

Now visible on the Simulation tab, so its limitations are visible too. Still open: rotations cover
2 specs of 27, and there is no multi-iteration variance or result charting.

**The encounter is fixed and has no controls** (2026-08-15, by request). It was a target-level
select, an armor field, three armor presets and a damage-taken input; the tab exists to gear a
character and press Run, which is what the reference TBC simulators do. One target: **level 73,
7,700 armor**. The panel still *names* it, which is not the same as configuring it — a DPS figure
means nothing without knowing what it was measured against.

Two consequences worth knowing before touching this:

- **The armor was 10,643 and is now 7,700**, settled by the repo owner. While three presets existed,
  10,643 was the one labelled "Heavily armored boss" against 7,700 for "Typical raid boss" — so
  keeping it as the *only* target meant every physical DPS number was quoted against the heavy end.
  **Every DPS figure in the app moved up when this changed**: armor mitigation 50.2% → 42.2%, Fury
  165.6 → 192.3, Arms 203.2 → 236. Both values are community approximations rather than
  tooltip-exact, which is why the encounter still carries `needsVerification`.
- **Damage-taken rage is unreachable from the UI.** `SimulationTarget.damageTakenPerSecond` survives
  with its tests, but nothing sets it, so it is pinned at 0 and Fury's rotation still cannot fund
  Heroic Strike. That is the honest cost of zero configuration.

**Removing a control twice left the state behind it live.** Worth watching for, because both were
invisible until something exercised the second path:

- `App.tsx` went on restoring `target` from the saved build, so a build saved while the presets
  existed came back with 3,500 armor and the panel confidently announced a target the player never
  chose and could not change. `buildSerialization` accepts any `{ level, armor }`, so an *imported*
  build reached it too. `target` is now a constant; it stays in the payload for compatibility and is
  never read back.
- The same shape as §1's stale disclosures below: a change closes one path and leaves a second open.

### The disclosures rot, and that is the pattern rather than the instances

**Four of the simulator's self-descriptions were false in one sitting, all true when written.** The
cause is structural and will recur: *closing a gap never forces the text describing that gap to
change*, so the text rots silently — and on a surface whose case for being shown rests on describing
itself honestly, a **wrong** caveat is worse than no caveat.

**"Will recur" was not a figure of speech — three more were found on 2026-08-18**, the first of them
in `featureFlags.ts` for the second time, one day after that file was corrected. The last three rows
below are that session; the first four are the original sitting.

| Claim | Reality when found |
|---|---|
| `featureFlags.ts`: rage unmodelled, no healer mana, procs unpopulated | all three fixed long before |
| Rotation summary: "Bloodrage, Unbridled Wrath, damage taken, Flurry-driven haste are unmodelled" | all four modelled |
| Stat weights: "Haste Rating — not modeled yet" | modelled, and worth **0.059/pt**, above Agility |
| Upgrade finder: "most of this catalog is still stat-budget estimates" | **96.9% sourced** |
| *(2026-08-18)* `featureFlags.ts` again: talent scaling "reaches the simulation nowhere at all" | wired in one day after the sentence was written; **11 specs** covered |
| *(2026-08-18)* `calculateSimulation.ts`: "Warrior-only for now … covers one class" | **six classes**, 30 effects |
| *(2026-08-18)* Test comment: "ingested for Warrior and Rogue only" | **six classes** |

So each now has an assertion that fails when it stops being true:

- **A stat flagged `notModeledYet` must score exactly zero.** A stat the engine does not read cannot
  move the result, so a flagged stat scoring anything is a self-contradiction. Verified by
  reintroducing the haste bug — it fails naming the stat and the value. Runs across four roles. Only
  the forward direction is asserted: an unflagged stat may legitimately score zero by being capped,
  which is the distinction the panel exists to draw.
- **Exactly 2 specs have multi-ability rotations and 25 are single-ability**, the figure the panel
  prose quotes.
- **The catalogue's sourced share stays above 90%**, as a band so verification work does not break it.

If you add a caveat to any of these surfaces, give it something that fails when it stops being true.

**All three of the reasons `featureFlags.ts` gives for hiding the tab have now been addressed** —
rage, item procs and the healer mana constraint. **The flag's reasoning has been rewritten to match**
(2026-08-15) — it used to claim "rage is not modelled at all", which would have sent the next reader
off to re-fix something already done. The flag's *value* is untouched: whether the numbers are now
defensible enough to show is a judgement, not a blocker, and it has still not been taken.
(Re-confirmed 2026-08-18: still hidden, by the repo owner's decision.)

**Then it rotted again, in the same file, within a day — this is the seventh instance and the
strongest evidence the pattern is structural rather than a run of carelessness.** The 2026-08-15
rewrite closed with "talent scaling … reaches the simulation nowhere at all". True when written.
`37e2cf2` wired talents into `calculateSimulation` on 2026-08-17 and `fba60c8` took them to all 11
Physical DPS specs on 2026-08-18, and the sentence sat there through both. It was the load-bearing
one, too: it is the file the owner reads to take decision #1, and it argued for staying hidden on
the strength of a defect that had been fixed.

**Fixed 2026-08-18, and this time every bullet in that file is pinned by an assertion.** The sharpest
is `tests/planner.spec.ts` → "the caster and healer paths are talent-blind": it scores a Shaman
Elemental and a Paladin Holy with real talent points and requires the result **not** to move.
Shaman and Paladin are chosen because both *have* ingested effects, so an unchanged score proves the
**path** ignores them rather than that the data is missing — a Mage would have passed the test
forever, including after the plumbing landed. Verified by falsification: threading talents into
`calculateCasterDps` makes it fail, naming the caster path.

**The healer mana term** is `domain/simulation/manaModel.ts`, from wowsims `sim/core/mana.go`:
`MP5/5` per second, Spirit regen as `0.001 + Spirit*sqrt(Intellect)*0.009327`, and `Intellect*15-280`
of maximum mana. The load-bearing detail is that wowsims adds Spirit regen **while casting** only
when `SpiritRegenRateCasting` is non-zero, and that comes from talents — so untalented, **MP5 is the
entire regen mid-cast and Spirit prices at zero**. Real TBC, not a shortcut.

The deficit is *reported*, not used to throttle the headline: a healer who casts flat out until empty
and one who paces to the sustainable rate are both real, so picking one silently would swap an
overstated number for a differently wrong one. A Holy Paladin reads 336 mana/sec spent against 6.8
regained. **No time-to-empty is offered** — that needs a mana pool, and class base mana is not in the
wowsims tree at this commit (only `racials.go` is), so `manaFromIntellect` exists and is tested but
nothing divides by it.

**Meta gem activation** is checked now. All 18 TBC meta gems carry a colour condition, read from each
gem's own Wowhead tooltip by `tools/ingest/ingest-meta-gems.mjs`; wowsims models what a meta *does*
and leaves the condition to the player, so it is no use here. Two shapes: minimum counts per colour,
and "more X than Y". Hybrids count toward **both** their colours, meta gems count toward none, and an
unmet meta grants **nothing** rather than a reduced amount. The panel says so in `--warn` amber —
this project has already been bitten once by a gem check failing silently, and a meta failing because
of gems in *other items* is worse again.

**One trap in that ingest:** these Wowhead pages carry user comments, and item 25890's comments
restate the requirements. A loose search of the page text finds player-written text and treats it as
authoritative — only the `g_items[<id>].tooltip_enus` assignment is the item itself. Note it is an
*assignment*, not a JSON key, which is what defeats the obvious `"tooltip_enus":` regex.

**Item effects are no longer one of them.** `tools/ingest/ingest-item-effects.mjs` reads
`sim/common/*.go` from the pinned wowsims commit: **49 effects, 31 on-use and 18 procs**, taking the
catalogue from **0 of 4,505 items** carrying one to 55 overall and **46 of 175 trinkets**. It matters
outside the hidden simulator — `calculateStats` folds an effect in at `duration / cooldown`, so this
moves the always-visible stat rail. Bloodlust Brooch went from 72 attack power to 118: 72 flat plus
278 at a 20/120 uptime.

Two things about that ingest worth keeping:

- **It refuses what it cannot express.** 48 further effects are damage procs, mana returns, mob-type
  conditionals, or grant only Health — which `StatBlock` derives from Stamina and has no field for.
  Those are reported and skipped rather than given an invented stat bonus. Hand of Justice grants an
  extra attack, not stats, and correctly has no effect at all.
- **Procs without an internal cooldown use a procs-per-minute rate.** wowsims expresses some as
  `NewPPMManager(1.0, …)`, meaning one proc a minute on average, so the mean gap is `60 / ppm`
  seconds — which drops straight into `effectUptime`. That recovered Madness of the Betrayer and one
  other that would otherwise have been dropped for having no ICD.
- Curated effects still win over ingested ones. Those were read off real tooltips and several carry a
  `notModelled` explanation this ingest cannot produce — The Lightning Capacitor's charge mechanic is
  the clearest.

**On the low melee DPS — the diagnosis has changed.** This was recorded as "rotation modelling is
the acknowledged gap", but investigating it found the larger cause was an attack-table bug, now
fixed: the player's white and special tables applied **parry and block** to a melee DPS. Both
require the defender to be *facing* the attacker, and a melee DPS is behind the boss all fight, so
against a level 73 target that deleted 14% parry plus 5% block from every swing. Fixing it moved a
Fury Warrior from 125 to 148 DPS at the time and took hit chance from 21.7% to 39.2%. (That 148 is
history, and so is the 165.6 it became after the unobtainable-item and two-hander fixes changed
which weapons it holds. That character read **192.3** after the boss armor moved to 7,700, and
**215.3** since base stats and the attribute conversions were sourced on 2026-08-20.) `attacksFromBehind` is now
a required input on both builders, so a future front-facing caller has to state its position.

**Rage is now modelled, and the result was not the one expected.** `domain/simulation/rageModel.ts`
implements wowsims/tbc `sim/core/rage.go` at the pinned commit — `damage*(3.75/274.7) +
HitFactor*BaseSwingSpeed`, main-hand factor `3.5/2` and off-hand `1.75/2`, doubled on a crit, nothing
at all on a miss but full value on a dodge or parry. Heroic Strike is in the ability data too, from
`heroic_strike_cleave.go`: 15 rage, main-hand damage +176 flat, **unnormalized**, off the GCD, and
`replacesMainHandSwing`.

**It still contributes nothing, and now the simulator says why in numbers.** Auto attacks fund about
**3.1 rage/sec** on the default set — it was 3.7 before the two-hander fix below removed a phantom
off-hand that was generating rage it had no right to — while Bloodthirst and Whirlwind need **7.5**. There
is no surplus for a dump. What is missing is not the dump — it is rage *income*: **Bloodrage,
Unbridled Wrath, damage taken, and Flurry**.

**Haste is now modelled and it is not the unlock it looked like.** White damage scales by
`(1 + haste)` and rage income with it, so the mechanism is in place — but only **78 of 4,554**
catalogued items carry melee haste and **none at Phase 2 raid item level**, which is faithful to TBC
rather than a data gap: the expansion put almost no haste rating on early gear. So modelling it moved
no current number.

**The rage shortfall was blamed on talent scaling. That has now been built and tested, and the blame
was only half right.** Talents reach the simulation as of 2026-08-15. A talented Fury build takes
rage income from **3.4 to 5.4 rage/sec** against the 7.5 Bloodthirst and Whirlwind want — real, and
still short, with Heroic Strike still excluded.

**Endless Rage is easy to implement wrong, and this code did.** The tooltip reads "you generate 25%
more rage from damage dealt", but `sim/core/rage.go` writes
`damage*(3.75/RageFactor) + HitFactor*BaseSwingSpeed*rageMultiplier` — the multiplier belongs to the
**swing-speed term only**, and the damage-proportional half is untouched. Applying it to the whole
swing put talented rage at 5.8 when it is 5.4. `WhiteSwingRageInput.rageMultiplier` now carries it to
the right term, and a test asserts the delta equals exactly 25% of the swing-speed term rather than
merely "went up".

**Every expressible rage source is now in, and the gap still does not close.** Bloodrage
(`bloodrage.go`: 10 rage plus ten 1-rage ticks on a 60s cooldown) and Improved Berserker Rage
(`berserker_rage.go`: 5 rage per rank on a 30s cooldown) were the two that remained, worth a third of
a rage per second each. Bloodrage is an **ability, not a talent**, so it raises the untalented
baseline too — the figure this file used to quote as 3.1 rage/sec is really **3.4**.

**What is left is now an input rather than a gap.** The only remaining rage in TBC is from *damage
taken* — `damage * 2.5 / 274.7`, and note upstream applies **no** rage multiplier to it, so Endless
Rage does not touch it. A closed-form model of a DPS has no incoming-damage stream, so
`SimulationTarget.damageTakenPerSecond` declares it instead, with a field on the Encounter panel.

**It defaults to 0 on purpose.** How much a melee DPS takes is entirely fight-specific, so any other
default would be an invented number wearing a measurement's clothes. Zero understates rage income and
the panel says so rather than leaving the reader to infer it. Measured, on the default Fury set:

| damage taken/sec | rage/sec | Heroic Strike |
|---|---|---|
| 0 (default) | 5.4 | excluded |
| 200 | 7.3 | excluded |
| **300** | 8.2 | **fires** |
| 500 | 10.0 | 8.1 DPS |

**The rotation becomes self-funding at roughly 250-300 damage/sec taken.** That number is the honest
statement of how much of a real fight the zero default leaves out.

Flurry's
nominal 25% attack speed turns out to be worth **+7.4%** at the crit a Phase 2 Fury warrior actually
has, because it is gated on crit and Phase 2 crit is 13%. It was never going to be the unlock.

Two design decisions in there worth not re-litigating:

- **Rage-costed *cooldowns* are deliberately not throttled by this income.** Modelled income covers
  one source of several, and treating a partial constraint as a complete one would throttle abilities
  a real warrior presses on cooldown and report a DPS *loss* as an accuracy gain. Verified by
  stashing the change and re-measuring: the rage model moved **no DPS number at all**. The figures
  did move afterwards — Fury 196.5 → 165.6 — but from the two-hander fix below, not from this.
- **A swing-replacing ability is worth only the difference it makes**, and it also gives back the rage
  of the swing it displaced, since main-hand specials generate none. `rageDumpUsesPerSecond` solves
  `uses = surplus / (cost + suppressedRage)` in closed form rather than iterating. Counting Heroic
  Strike's full damage as additional damage roughly doubles it.

The remaining gap for melee is therefore **not** talents and **not** a priority-list engine. It is
the rage sources this model still has none of — **Bloodrage, damage taken**, and rage from abilities
the rotation does not carry.

### 2. UI — the requested rework is done

Everything below shipped this session, each as its own commit. What is left is listed at the end.

- **Section picker** in front of the tab bar; **stat rail scoped to the planner**.
- **Character creation journey**; the Character panel is gone from the tab and its four selects live
  in the rail. The role card and racial traits list were removed by request — the role still drives
  every accent and `applyRacialTraits` still feeds the totals, they are just not restated.
- **Gear paperdoll** — armour left, everything else right, weapons across the bottom, right column
  mirrored so glyphs sit on the outer edge. Spec filtering is unchanged.
- **Gem sockets** show the gem, its stats, and whether the socket bonus is *earned right now*.
- **Ranked-gear rows** rebuilt: frame, one identity line, filled Equip. Farm and Notes removed,
  crafting kept.
- **Gear popup split in two** — picker left, the choice's stats, rank, enchant, sockets and source
  right. It previously never showed item stats at all.
- **Warrior talents**, ingested. See below.
- **Raids rebuilt** — a picker first, loot only, other raids in the rail. Boss mechanics and role
  notes deliberately removed; attunement chains kept, since access is not a fight guide.
- **Colour**: section, raid and talent-tree accents; real gem colours; item quality as a hairline on
  each paperdoll slot; enchants in the game's green.

**Buffs & Consumables is back; only the Simulation tab is still hidden.** `src/featureFlags.ts`
explains the simulation one, and `?simulation=1` brings it back for the tests.

**Hiding the buffs panel was worse than it looked, and this is the reason to be wary of hiding a
surface whose data something else consumes.** The two tabs were hidden together, but for different
reasons: the simulation numbers were known to be wrong, whereas the buff data is real and sourced —
33 raid buffs each cited to the spell rank its numbers were read from, 31 consumables, 6 target
debuffs — and `calculateStats` was applying it the whole time. With nothing rendering the toggles,
the three id lists defaulted to empty and could never be changed, so **that entire dataset reached no
number in the app**. Not wrong, just unreachable, and nothing about the interface said so.

It is now the fifth planner sub-tab, between Talents and Ranked Gear — both are "what you bring",
ahead of the rankings you check against. `App` holds one shared `toggleId` helper rather than three
near-identical callbacks, since only the target state differs.

A test pins the exact arithmetic rather than the direction: Battle Shout is a flat **+306** melee
attack power at rank 8, so the assertion is `after - before === 306` and that unticking restores the
original total exactly. "Went up" would pass just as happily with the buff applied twice.

### 2a. Earlier UI audit — three fixes applied, two findings retracted

A measured audit of the running app (not a stylesheet read) found and fixed:

- **`--text-faint` failed WCAG AA.** `#6e6e6e` measured **3.88:1** on `--surface-0`, and it carries
  every uppercase eyebrow plus the rail's group headers — all 11-12px, none large text. Now
  `#858585`, 5.37:1 on `--surface-0` and 5.08:1 on the rail.
- **14 hardcoded `color: #ffffff`** bypassed the token system — an undocumented fourth text level.
  Named as `--text-strong` rather than flattened, because the emphasis was doing real work.
- **`small` was the browser default** 0.8333em → 13.3333px, a size nobody chose. Pinned to 13px.
- **Panel section headings** were 14px in two places and 15px in a third. Unified to 15px.

**Two findings did not survive verification, and are recorded so they are not "re-found":**

- The buff checkboxes look like 31 sub-minimum tap targets at 13x13, but the `<label>` wraps the
  input and *is* the target, at 405x58 with a pointer cursor. WCAG 2.2 SC 2.5.8 already passed.
- Apparent 158-character line lengths were short labels in wide containers. Only one element
  (`.panel-copy`) genuinely ran long, at ~117 chars/line; it is now capped at `72ch`.

Both design decisions that were parked here have since been taken, and are recorded in §2b below.
Still open:

- ~~**`h3` is styled at five sizes**~~ — **resolved by naming the roles, not by flattening them.**
  The four heading sizes were each doing a real and different job: 20px detail-page title
  (professions, raids), 15px panel section heading, 13px amber callout title
  (`.stat-weights-unmodeled`), and the 11px tracked mono label (`.bis-slot-heading`). The problem was
  never that there were four, it was that `h3` alone told you nothing about which you would get —
  every rule was a *descendant* selector keyed on the container. So they are now
  `--heading-detail` / `--heading-section` / `--heading-callout` tokens, with the label pattern
  staying on `--label-size` and deliberately not counted as a heading size: marking a group label up
  as a heading is correct semantics, and visual weight is a separate decision.

  **The real defect was the missing bare rule, and it was latent rather than live.** There was no
  `h3 { }` at all, so an `h3` in any new container would have inherited the browser's `1.17em`
  (~18.7px) — a size nobody chose, sitting between the 15px and 20px steps, close enough to both to
  read as sloppiness rather than as a bug. Exactly the `small` finding one level up. Measured before
  and after across every view: **20 `h3` elements, all landing on a chosen size, identical both
  times** — nothing rendered differently, which is the point.

- **62 lines of dead CSS removed with it.** `.racials` / `.racial-*` was referenced by **zero**
  components — left behind when the racial traits list was removed by request (§2). Worth noting it
  contained `#4ade80`, a saturated green, so the colour audit's claim that "the only saturated
  colours anywhere are item quality and the warn amber" was true of the *rendered* app but not of the
  stylesheet.
- Base surface is `#0a0a0a`, near-pure black. Material and Smashing both recommend ~`#121212`;
  pure black maximises halation and spends the darkest value available. Left alone — it is a
  deliberate part of the stated aesthetic and the contrast measurements all pass.

### 2b. The two parked design decisions, now taken

**The planner is four sub-tabs, not one column.** Measure first: it was **11,206px / 15.6 screens** at
1280×720, not the ~25,000px recorded above — the hidden Buffs panel and the gear rebuild had already
shrunk it. But the useful finding was the shape rather than the total: **Ranked Gear was 59% of the
scroll and Talents 26%**, so two panels were 85% of it. `PLANNER_VIEWS` in `App.tsx` now splits Gear
/ Talents / Ranked Gear / Build, each rendering *only* its own panel. (**It is five now** — Buffs &
Consumables was restored between Talents and Ranked Gear later the same session, as §2 records.) The
rail is what makes this
affordable — the stat totals stay on screen across all four, so nothing the single column provided is
lost.

Sub-tabs rather than collapsible panels because these are four different activities, not four views
of one thing. Collapsing would have kept the scroll and added a second thing to manage.

**Ranked Gear's own length is now dealt with — and the fix proposed here was the wrong one.** This
used to say "capping each slot's ranking at a few entries with a show-all is the remaining move".
Measuring first said otherwise, twice over:

- **The length is entry *count*, not entry height.** The panel measured **6,458px, 9.0 screens** at
  1280x720, from **64 entries across 15 slot groups** — but the median entry is only **61px**, which
  is already tight. There is nothing to shrink; there are just a lot of rows.
- **"A few" would not have worked.** Entries per slot across all 27 specs run min 1, **median 4**,
  max 8, and **288 of the 398 slot groups hold exactly 4**. So capping at 3 hides only **22.9%** of
  entries and lands at ~7.4 screens. Measured: 3 → ~7.4 screens, 2 → ~6.1, 1 → ~4.8.

`DEFAULT_VISIBLE_PER_SLOT` in `BisPanel.tsx` is **2**, giving a measured **4,367px / 6.1 screens**, a
32% cut, with a per-slot "Show all N". Two rather than one because the panel is called *Ranked* Gear:
a #1 with a #2 under it still reads as a ranking, where a single row reads as a pick. The constant is
the only thing to change to move along that curve.

Two things worth not rediscovering. Expanding one slot deliberately does **not** expand the others —
the reason to open a slot is to compare inside it, not to restore the wall. And **all three Rogue
specs rank ≤2 in every slot**, so they show no toggles at all and always did fit; any test asserting
toggle counts has to pick its spec deliberately.

**The rail is spec-aware, with an escape hatch.** A Fury Warrior went from 26 rows to **12**; a
Protection Warrior gets 18, a Mage 11, a Holy Priest 12, a Feral Druid 13. `domain/stats/statRelevance.ts`
holds the rules, and two of them are worth restating: **attributes and armor are never hidden**,
because the in-game character sheet shows them to every class and hiding them would surprise more
than the noise it saves; and **nothing is deleted, only defaulted away** — a "Show N more" toggle
restores all 26. That toggle is the answer to every arguable case, such as Enhancement Shaman getting
real value from spell power.

The worst row was never the zeroes. It was **Healing Power 411 on a Fury Warrior**, which reads as a
bug rather than as an irrelevant row.

**This interacts with one test in a way worth not rediscovering:** the Draenei racial test reads
*spell* hit off the rail for a **Warrior** — a number a Warrior has no normal reason to look at, and
now hidden. It opens the toggle first. Hiding a stat can break a legitimate read, which is exactly
why the toggle exists.

**Three things about testing sub-tabs, each of which cost a full suite run:**

- **`expect(locator).toHaveCount(0)` is vacuously true wherever the panel is not rendered.** With one
  column that could not happen; with sub-tabs a test that drifted onto the wrong view would keep
  passing while asserting nothing. `expectSlotHidden` and `expectNoRankingHeading` exist to force the
  right view first, and any new absence assertion should go through something similar.
- **Playwright's `name` option matches substrings.** `getByRole('region', { name: 'Gear' })` also
  matches "BiS / Ranked Gear"; `{ name: 'Talents' }` matches all three "<Spec> talents" trees;
  `{ name: 'Build' }` matches "Saved builds". Use `exact: true` on every region lookup here.
- **`build-export-output` is inside a collapsed `<details>`**, so it is legitimately hidden and is
  the wrong thing to assert visibility on. The other build tests only ever read it with
  `.inputValue()`, which does not check visibility, which is why this never surfaced before.

### 3. The requested rework — all three remaining items are now done

Nothing is outstanding here. Kept as a record of what each one turned out to involve, since two of
the three were mis-scoped going in.

- ~~Professions levelling guides~~ — **done, all 9.** Every crafting profession has a sourced
  300-375 path with real craft counts and material quantities. Remaining `needsVerification` flags in
  `sampleCraftingGuides.ts` are all on pre-300 vanilla ranges, which are deliberately out of scope.

- ~~Spec tier-list view~~ — **done.** Its own section and tab, 28 placements across the three Wowhead
  Phase 2 lists, covering all 27 specs. `tools/ingest/ingest-tier-lists.mjs` regenerates it. As
  suspected, these rank *specs*, not items, and nothing wires them into the per-slot BiS lists.

- ~~Item and gem icons~~ — **done, vendored.** The size estimate that made this look like a hard
  call was wrong by an order of magnitude: 4,741 catalogued entries share only **1,238 distinct
  icons**, and at Wowhead's 56×56 "large" that is **2.1 MB**, not 15-25. Vendoring therefore costs
  little and keeps the no-runtime-network-calls invariant intact, so the hotlinking option was never
  actually worth its downside.

### 4. Talents — all nine classes, with icons

**579 talents across 27 trees**, ingested by `tools/ingest/ingest-talents.mjs`. Warrior was built end
to end first to prove the parser; the other eight then came from the same payload with **no parser
change at all**, only tree ids. Every talent renders its real icon. The "class has no talents yet"
path in `TalentsPanel` is now unreachable and kept only as a guard.

**Six of the 27 trees are named something else in the payload**, in Vanilla-era internal terms, and
every one was confirmed by *reading the tree's contents* rather than trusting the label:

| Payload | Actually | Confirmed by |
|---|---|---|
| Paladin `Combat` | Retribution | holds Benediction, Improved Seal of the Crusader |
| Warlock `Curses` | Affliction | holds Suppression, Improved Corruption |
| Warlock `Summoning` | Demonology | holds Demonic Embrace, Improved Imp |
| Shaman `ElementalCombat` | Elemental | holds Convection, Concussion |
| Druid `FeralCombat` | Feral | holds Ferocity, Feral Aggression |
| Hunter `BeastMastery` | Beast Mastery | unspaced only |

The tree ids themselves are **not** hand-written either — they are read off the payload's own `trees`
map, where each entry's `description` is an unspaced "WarriorArms". A test asserts each class's three
tree specs match the app's spec names, so a mis-mapping fails loudly rather than mislabelling a tree.

The calculator page is an empty shell. The trees come from
`nether.wowhead.com/tbc/data/talents-classic` as **two payloads that must be joined**: a
`WH.setPageData` grid with rows, columns, ranks and prerequisites, and a `WH.Gatherer.addData(6, …)`
call further down the same file with the spell rows. The grid never names a talent — a talent is
named after its rank-1 spell.

`canRemovePoint` keeps a row-requirement guard that **provably cannot fire**: a row needs `row * 5`
points counting the deep point itself, so placing one always leaves the total a point clear of the
gate. Documented in place, and a test pins the reasoning so it is not mistaken for reachable code.

### 5. Polish

- Tier set bonuses now cover **all 34 sets of Tier 4 and Tier 5** — 17 each, 71 bonuses — read
  verbatim off the Wowhead item page in `sourcedFrom`. The other 188 ingested set names (Tier 6,
  dungeon, PvP) are deliberately undefined and show nothing rather than inventing bonuses. Tier 6 is
  the next batch if wanted, though it is past this app's stated Phase 2 target.
- ~~The BiS and Buffs panels still use the older layout shapes~~ — **this note predates the work it
  asks for, and half of it is unbuildable.** The BiS panel already got the treatment: §2 lists
  "Ranked-gear rows rebuilt — frame, one identity line, filled Equip" as shipped, and that is what
  the code has (`.bis-item-frame` with icon and item-level badge, a single `.bis-entry-meta` identity
  line, a filled Equip button), plus the per-slot collapse added later. There is no dated markup left
  in it — zero `<dl>`, `<dt>`, `<dd>` or `<table>` across BisPanel, BuffsPanel and GearPanel alike.

  The Buffs panel was a different problem: nothing rendered it, so restyling it would have been work
  on a module nothing renders — which this file's own conventions forbid. That question has since
  been answered by bringing the panel back as the fifth planner sub-tab (§2), which is the
  prerequisite any layout work on it needed.

---

## Repo conventions that encode real, repeated mistakes

- `domain/` never imports from `features/` or `components/`. The only architectural invariant.
- **Never ship a module nothing renders.** This repo has done it three times.
- When `npx tsc -b` flags an unused import, find out what it was for before deleting it — that is how
  half-finished work gets discovered here.
- Counts are computed, never written into prose. `brain/Project/Roadmap Board.md` computes them.
- **`npm run brain` does not prune orphaned notes.** Delete a source file and its
  `brain/Architecture/Modules/*.md` stays on disk describing a file that no longer exists — the run
  still reports "all wikilinks resolve", because nothing links to it any more. Delete the note by
  hand. A blanket prune would be wrong: the generator manages 240 of the 269 notes in the vault and
  the rest are hand-written.
- Node ESM cannot resolve this repo's extensionless imports. Scripts that import app code use
  `registerHooks` to retry with `.ts`, and `pathToFileURL` because Windows drive letters parse as a
  URL scheme. Copy that pattern — **and include the `/index.ts` fallback**, or any script reaching a
  barrel import like `../../domain/abilities` dies with `ERR_MODULE_NOT_FOUND` on a path that looks
  perfectly correct:

  ```js
  registerHooks({
    resolve(spec, ctx, next) {
      try { return next(spec, ctx) } catch (err) {
        if (!spec.startsWith('.')) throw err
        try { return next(`${spec}.ts`, ctx) } catch { return next(`${spec}/index.ts`, ctx) }
      }
    },
  })
  ```
- `.claude/agents/` is not registered as agent types in every environment. Dispatch a
  `general-purpose` agent and paste the agent file's contents into the prompt instead.
- **Verify in the browser, not just in the diff.** A grep using a non-capturing group silently
  under-reported and left a legacy surface behind; the browser audit is what caught it.
- **The Browser pane does not composite when it is hidden.** `requestAnimationFrame` never fires
  there, so anime.js entrance animations sit at `opacity: 0` forever and `loading="lazy"` images
  never load. Both look exactly like real bugs. Screenshots also fail outright. Read the DOM instead,
  and force `loading="eager"` before asserting an image loaded.

---

## If you are picking this up now

Everything below is open. Nothing is half-finished — every commit was green before it was pushed,
and each item here is a decision or a fresh piece of work.

### Decisions only the repo owner can take

**Two of the three below were taken on 2026-08-21 and are struck through.** What is open now is the
boss armor figure, and one new one:

0. ~~**Should Faerie Fire be restricted to Balance and Dreamstate Druids?**~~ **Taken 2026-08-23 —
   split base from improved.** Of the three options offered, the owner chose the one that keeps the
   base debuff class-wide (which is what the game does) and gives Balance its own entry carrying the
   +3% melee and ranged hit, modelled rather than named. The restriction as requested would have been
   inverted: Dreamstate is a Restoration talent, and Restoration is the one Druid tree with no Faerie
   Fire talent at all.

**Decision 2 was taken on 2026-08-21 and is no longer open.** Toughness, Vitality and Divine
Strength were the named list it gated; all three now apply, and a talented tank no longer reads low
for that reason. What remains refused for a stat reason is narrower and honest: Health and Mana have
no `StatBlock` field.

1. ~~**Unhide the Simulation tab?**~~ **Taken 2026-08-21, per role.** Shown for the 20 DPS specs,
   hidden for the 5 Healer and 2 Tank ones, because this project is for DPS. `?simulation=1` remains
   an escape hatch for development and tests. **25 of 27 specs are still single-ability
   approximations**, which was a reason to keep working rather than a reason to hide the tab. It was
   written here as "the top of the queue"; **the owner overruled that on 2026-09-01** — see the
   2026-09-02 entry at the top of this file.
2. ~~**Should talents reach `calculateStats`?**~~ **Taken 2026-08-21 — yes.** They now move the
   always-visible stat rail, gear rankings, stat weights and the upgrade finder. "An empty tree
   reproduces today's numbers exactly" is a hard invariant, asserted across all 27 specs.
3. **Is 7,700 the right boss armor?** Set this session, replacing 10,643. Both are community
   approximations rather than tooltip-exact, which is why the encounter still carries
   `needsVerification`.

### The work, in the order it is worth doing

~~**Caster and healer talents are blocked on plumbing, not data.**~~ **Done 2026-08-19.**
`calculateCasterDps` and `calculateHealing` now take `TalentModifiers`, and all nine classes are
ingested — **49 effects** at the time, up from 30, and more since; the live figure is asserted from
`talentEffects.json` rather than written here. Talents reach **all 27 specs**: the tank path followed the
caster and healer ones the same day, so every one of the four role paths now takes `TalentModifiers`.

The plumbing came first deliberately, and the ingest second, because this repo's recurring failure is
shipping data nothing reads — a Mage effect with no caster talent argument to reach would have been
exactly that.

**What the caster half carries is narrow, and saying so is the honest part.** Four kinds only: spell
crit, spell hit, spell damage multiplier, and the Spirit regen that keeps running mid-cast. Measured
gains are modest and should be: Mage Fire **+7.6%**, Druid Balance **+6.3%**, Warlock Destruction
**+3.8%**, Shaman Elemental **+3.6%**, Priest Holy **+2.5%**, Priest Shadow **+2.4%**, Paladin Holy
**+1.5%**. The larger half — Ignite, Shadow Weaving, Ruin, every "Improved &lt;nuke&gt;" line — is
**per-spell**, and this simulator models one generic cast per spec and records no spell school, so
**45 talent groups are refused by name** with a reason each rather than approximated.

**The one that changes a stat's whole worth is Meditation.** wowsims gates Spirit regen during
casting entirely behind `SpiritRegenRateCasting`, which comes only from talents — Meditation, Arcane
Meditation, Intensity. Untalented it is exactly zero, which is why this project correctly priced
Spirit at nothing for healers. With rank 3, a Holy Priest's mid-cast regen goes **11.6 → 24.6
mana/sec**. The estimate's sentence about it is now *computed from the build* rather than written
about the app: it used to say those talents "are not modelled", which was true when written and
false the moment they were.

**Two branches went unreachable and are kept as guards**, matching how `TalentsPanel` handles the
same situation: `unmodelledTalentNoteFor`'s "this class has no ingested effects" path can no longer
fire, and a test asserts it does not.

**The "7 caster and 2 healer" figure was wrong wherever it appeared** (2026-08-18), which was this
file twice, `featureFlags.ts` and a test comment. Counted from `getRoleForSpec` — the same source
`App.tsx:175` feeds the simulator — the 27 specs are **11 Physical DPS, 9 Caster DPS, 5 Healer, 2
Tank**. So talents reach 11 and the uncovered remainder is 16. The split is now asserted in
`tests/planner.spec.ts` rather than written in prose, because prose is exactly how it drifted.

**Rotations are the biggest remaining gap and the reason the tab reads as indicative** — the
biggest *modelling* gap, which since 2026-09-01 is no longer the same thing as the next work. 25 of 27
specs are modelled from a single signature ability. ~~wowsims has full ability implementations for
all nine classes at the pinned commit, so this may be an ingest rather than a research project.~~
**Scoped 2026-08-18, and that hypothesis is wrong — `ROTATION-SCOPE.md`.** Talents were cheap because
a talent is a *number* upstream had already reduced; a rotation is an imperative state machine
reading live simulation state — current energy, combo points, aura remaining duration, stack counts,
time left in the fight — and **the mechanism is the entire content**. This simulator has no timeline
at all. The recommendation is a per-spec closed-form extension on a short list, starting with Hunter
(three specs, blocked only by an effect-type filter), not an ingest and not a general engine.

~~**Protection Warrior's tank path reads no talents.**~~ **Done 2026-08-19 — all four role paths now
take them, so talent coverage is 27 of 27.** `calculateTankSurvivability` reads **Anticipation**
(+4 Defense skill/rank), **Deflection** (+1% parry/rank) and, for Warrior only, **Shield
Specialization** (+1% block/rank). Measured: Warrior Protection **12,790.9 → 14,118.5 (+10.4%)**,
Paladin Protection **11,607.6 → 12,791.8 (+10.2%)**, avoidance 22.1% → 29.5%.

Anticipation carries most of that on its own, because one Defense skill point moves miss, dodge,
parry, block **and** the boss's crit chance together — so it is added before `fromDefense` is derived
rather than to any single term.

**Two tank talents are still refused, and the reason is a decision rather than a gap.** Toughness and
Vitality multiply armour, stamina and strength, which `calculateStats` owns — reaching them means
talents reaching the always-visible stat rail, gear rankings and upgrade finder, which is the product
decision this file lists as the owner's. The estimate now names them specifically rather than
claiming the path reads nothing.

**Paladin's Shield Specialization is deliberately not modelled and must not be named.** It raises
block **value**, where Warrior's raises block **chance**; the incoming-attack table rolls the chance
and does not track how much a block absorbs. The first version of the tank note listed it for both
classes — a wrong caveat in the confident direction, caught before it shipped, and a test now asserts
a Paladin is never told it is read.

The superseded framing follows. Talents are applied in `calculatePhysicalDps`,
and a tank is scored by `calculateTankSurvivability`. A test pins this so it reads as a decision. The
seven formulas are already surveyed in §1.

**The rage dump still never fires.** Income reaches 5.4/sec against the 7.5 Bloodthirst and
Whirlwind want. Every expressible source is in; the remainder is rage from damage taken, which is an
encounter input defaulting to 0 and no longer reachable from the UI since the encounter was fixed.

**Known-wrong data still standing:** 123 of 226 curated items carry `needsVerification` — but read
the §"curated flags" note first, because 119 of those cannot affect the app at all.

**The gem procs are wired now, and they were not a tidy-up.** `ingest-item-effects.mjs` reads
`metagems.go`, so it always extracted **Mystical Skyfire Diamond (25893)** and **Thundering Skyfire
Diamond (32410)**
— but those are gems, and `Gem` had no `effect` field, so nothing consumed them.

**The severity was understated here as "wiring it is small".** Both gems carry `stats: {}` in the
catalogue, because wowsims models them purely as procs — so socketing either contributed **exactly
zero** and the panel told the player "No stats this app models". Mystical Skyfire Diamond was a
caster staple in TBC. `Gem.effect` now reuses the item `ItemEffect` shape, `sampleGems` layers it on
by `wowItemId` from the same `itemEffects.json`, `calculateStats` folds it in at `effectUptime`
**behind the meta-condition early return** — an inactive meta's proc is part of the nothing it grants
— and the panel states the proc with its uptime rather than at face value, which would overstate
Mystical Skyfire roughly sevenfold (320 spell haste for 4s on a 35s internal cooldown is 11% uptime).

Separately, 48 upstream effects are skipped as inexpressible
(damage procs, mana returns, health-only buffs) and the ingest reports each one — worth reading
before assuming an item has no effect.

**Talent scaling is built, and it did not do what this file predicted.** Stage 1 shipped 2026-08-15:
Warrior talents reach `calculateSimulation` and **deliberately nothing else**, so the always-visible
stat rail, gear rankings and upgrade finder are untouched. Widening that is a separate decision.

- **Source.** `tools/ingest/ingest-talent-effects.mjs` reads `sim/warrior/talents.go` at the pinned
  `3301fca5` — the framing below, that this needed prose extraction, was wrong: wowsims implements
  talents as *code*. 10 effects extracted, 9 talent groups refused by name with a reason each.
- **Result.** Fury DPS **192.3 → 224.3 (+16.6%)**, crit 8.1% → 13.1%, rage **3.4 → 5.4/sec**.
  (Both figures moved to **215.3 → 254.7, +18.3%** on 2026-08-20 when base stats and the attribute
  conversions stopped being hand-written. The talent effect is unchanged; the base it applies to was
  wrong.)
  (Post-7,700-armor figures. Against the old 10,643 target they read 165.6 → 193.2.)
- **Stage 2 is complete for every spec that can receive talents.** All **11 Physical DPS specs** are
  covered — Warrior Arms and Fury, all three Rogue, all three Hunter, Shaman Enhancement, Druid Feral,
  Paladin Retribution. **30 effects** across six classes (Warrior 11, Rogue 4, Hunter 5, Shaman 4,
  Druid 3, Paladin 3), with 33 talent groups refused by name and a reason each.
  Cheap because **talent ids are globally unique**, so one effects list serves every class and
  `deriveTalentModifiers` never changed. Largest gain is Hunter Beast Mastery **106.1 → 148.1
  (+39.6%)**, because **Serpent's Swiftness is +4% ranged attack speed a rank**.

  **Stage 3 closed the caster, healer and tank halves on 2026-08-19**, taking the ingest to **49
  effects across all nine classes** and coverage to **all 27 specs**. The paragraph that used to sit
  here said those paths "take no talent argument at all" — true when written, and the reason the
  plumbing went first each time. What remains is not coverage but **expressiveness**: a named list of
  talent groups is refused, dominated by per-spell effects. The ones routing through
  `calculateStats` left that list on 2026-08-21, when talents reached the stat pipeline.
  (This paragraph also said "7 caster and 2 healer" until 2026-08-18; the real split is 9 Caster DPS,
  5 Healer, 2 Tank, and it is asserted now rather than written.)

  **Shared talent names across classes are real, and not always the same effect.** Three classes have
  a **Precision** (Warrior max 3, Rogue max 5, Paladin max 3 — same effect, different caps). Warrior
  and Shaman both have **Weapon Mastery** — dodge reduction for one, physical damage for the other —
  and **Dual Wield Specialization** — off-hand damage for one, hit for the other. Effects are keyed by
  talent id and every extractor is cross-checked against its own class's tree; that is the only
  reason these do not cross-contaminate, and tests assert both directions.

  Two upstream shapes worth knowing before adding a class. **Paladin writes no coefficient at all**
  (`MeleeCritRatingPerCritChance*float64(Talents.X)`), which means 1 — the patterns anchor on the
  talent *and* the rating constant with nothing between, so a coefficient appearing later breaks the
  match rather than being ignored. **Druid scales by character level** (`rank * 0.5 * CharacterLevel`),
  folded in at 70 since that is the only level modelled.
- **It covers Arms too, free.** `deriveTalentModifiers` is keyed by **talent id** and
  `warriorTalents.json` carries all three trees, so any spec sharing the class shares the effects —
  nothing about the mechanism is Fury-specific. Arms measured **236 → 271.6**. Adding a class means
  adding its extractors, not its specs.
- **Protection gets nothing, and that is the honest gap.** Talents are applied in
  `calculatePhysicalDps`; a Protection Warrior is scored by `calculateTankSurvivability`, which never
  receives them. So Toughness, Vitality, Anticipation, Defiance and the shield talents reach nothing.
  The ingest already refuses them by name with that reason, so the *data* side is consistent — it is
  the application side that stops at the DPS path. A test pins this so it reads as a decision rather
  than an oversight. Their formulas are already surveyed in `sim/warrior/talents.go` if it is picked
  up: Anticipation +4 Defense/rank, Toughness armour ×(1+0.02·rank) on items only, Vitality stamina
  ×(1+0.01·rank) and strength ×(1+0.02·rank), Defiance +2 expertise/rank, Deflection +1% parry/rank,
  Shield Specialization +1% block/rank, Shield Mastery block value ×(1+0.1·rank).
- **The falsification test half failed, which is the point of having written it first.** The scope
  required DPS to move *and* the rage gap to close. It did not close: 5.2 against 7.5, and Heroic
  Strike is still excluded. **Talents are a major missing piece but they are not the rage fix.**
- **Why:** Flurry is gated on crit. The stack chain solves to a closed form (Markov chain over the
  3-stack aura; `π₀ = (1-c)³`), and at 13% crit a "+25% attack speed" talent is worth **+7.4%**.
- **A bug worth the retelling.** `rageGeneratedMultiplier` was in neither dispatch map, so Endless
  Rage contributed nothing and the first measured rage figure was 4.2 rather than 5.2. It surfaced
  only because a test asserted the modifier's *value*; asserting "DPS went up" would have passed with
  the talent doing nothing. `talentModifiers.ts` now throws at import if any ingested effect kind has
  no destination.

Superseded framing kept for contrast — it gates rage income (Flurry's 25% attack
speed after a crit is where a Fury warrior's swing rate really comes from), and it is what keeps
melee DPS low. The talent *data* is already ingested for all nine classes — but as **prose**
(`rankDescriptions`), not machine-readable effects, so this needs an extraction or authoring step
first. **Now scoped — `TALENT-SCALING-SCOPE.md`**, which corrects the framing in this paragraph:
talent *effects* are machine-readable in wowsims at the already-pinned `3301fca5` (all nine classes;
four warrior files are already in the ingest cache), so this is an ingest like item effects, not a
prose-extraction job. The recommendation is one spec — Fury Warrior, character-global talents only —
with a falsification test stated up front. One product decision is open and gates the size: whether
talents reach `calculateStats` and therefore the always-visible stat rail, or only the hidden
simulator.

**Both chores are done.** The 19 stale local branches are **deleted** (2026-08-15): 18 via
`git branch -d --merged main`, and `worktree-agent-afb0a902111f3a642` via `-D` after checking that
every file it added is already present in `main` — the raids rebuild superseded it.

**The ten that also existed on `origin` are deleted too**, on the repo owner's say-so, since this is
a public repo and removing a published branch is a decision rather than a cleanup. All ten were
ancestors of `origin/main`, so nothing was lost; their tips are recorded here in case GitHub's
restore window ever lapses:

```
agent/integration-tbc-foundation 96ec2ab   feature/shaman-elemental-restoration-bis af50465
data/expand-tbc-items-bis-foundation b686e9d  feature/spec-aware-bis-sources-enhancement 657774c
feature/animejs-loading-polish 00c68cf     feature/spec-aware-slot-visibility cc0d3dc
feature/bis-panel-equip-from-list b36bce3  feature/warrior-arms-fury-protection-bis 1e099b5
feature/race-class-legality-and-crafting-data 0527e72   local-mvp-simulator fcade15
```

**Both stale worktrees are gone as well.** `.claude/worktrees/lucid-cartwright-9d8b8c` was detached
at `68aae34`, reachable from `main`, so its work was merged and the checkout was only costing
OneDrive sync; `agent-afb0a902111f3a642` was already an empty husk git no longer tracked. `git
branch -a` is now `main` and `origin/main`, and `git worktree list` is the one checkout.

**CI is off the deprecated Node 20** (2026-08-15). `deploy.yml` went `checkout` v4→v7,
`setup-node` v4→v7, `configure-pages` v5→v6, `upload-pages-artifact` v3→v5 and `deploy-pages` v4→v5,
all now on Node 24. **Verified end to end**, not just green: the run succeeded and the live site
serves the same asset hashes the local build produced.

Two hazards were checked rather than assumed, because this workflow publishes the live site.
`upload-pages-artifact` **v4 stopped including dotfiles** in the artifact — this `dist` has none, so
nothing is dropped; and `deploy-pages` v4+ **only accepts artifacts from `upload-pages-artifact` v3
or newer**, which v5 satisfies. `actions: read` was also added: `deploy-pages` has required it since
v4, because build and deploy are separate jobs here and the deploy fetches the artifact by id
through the Actions API. Deploys were succeeding without it, so that closed a documented gap rather
than a live break.

`node-version` stays at **22** deliberately — the Node an *action* runs on is a different thing from
the Node the app is built with, and changing the latter is its own decision.

An earlier version of this note named `upload-artifact@v4`, which this
workflow does not use, and omitted `deploy-pages@v4` entirely — so check the file, not the note.

**The curated `needsVerification` flags were audited, and the count was never the point.** It looked
like 124 Wowhead lookups. Measuring what the flag still *governs* said otherwise, and that is the
finding worth keeping:

- **119 of the 120 remaining flags cannot affect the app.** Those entries match an ingested row, so
  `itemCatalogue.ts` builds the item from the ingest and overlays only `PROVENANCE_FIELDS` — their
  stat blocks are dead weight. **118 of their notes still say "stats are approximate pending final
  Wowhead audit"**, which was true when this file *was* the catalogue and now describes unused data.
  Read those as "drop location, vendor and roles unverified". The semantics are documented in
  `sampleItems.ts`'s own header rather than by rewriting 118 notes.
- **The risk was always the *unmatched* entries**, which ship whole with their invented numbers.
  `catalogueMeta.unmatchedCuratedCount` is the number to watch; it went **33 → 28**, and
  load-bearing flags went **7 → 1**.

**Four fictional items were selectable in gear dropdowns** and are now deleted: Training Sword,
Practice Longbow, Shield of Rehearsal ("COULD NOT BE LOCATED"), and **Voidheart Cover — which this
very file already recorded as invented**. None was referenced by any BiS ranking, so the stated
reason for keeping unmatched entries ("so BiS and raid-loot references keep resolving") applied to
none of them. Curated count 230 → **226**.

**Voidheart Cover was a chain, not a single bad row.** It was also SSC raid loot labelled a Warlock
T5 helm. Voidheart is the Warlock **T4** set (ilvl 120); T5 is **Corruptor Raiment**. The real piece
is **Hood of the Corruptor** (30212, ilvl 133), which is what its four sibling T5 helms in that same
loot table look like — every one of them a real item with a `wowItemId` at ilvl 133. The fictional
entry was the only one without one, which is the tell worth reusing.

**Two more were real items that had simply never been given a `wowItemId`**, which is exactly why
they never matched and shipped invented stats:

| | Curated claimed | Real |
|---|---|---|
| Choker of Vile Intent | ilvl 115, 18 crit rating | **29381**, ilvl 110, no crit — plus **42 attack power and 42 ranged attack power** the entry missed entirely |
| The Sun King's Talisman | ilvl 128, 54 spell power | **30015**, ilvl 138, 41 spell power, plus 22 stamina and 41 healing power missed |

**One flag is deliberately kept.** Blessed Book of Nagrand ships whole and is flagged for a *schema
gap*, not a doubt: its value is confirmed (no stats; it adds 79 healing to Flash of Light
specifically) and nothing in `StatBlock` can express a spell-specific effect.

Still standing: 39 raid loot entries name items the catalogue does not hold — mounts, enchant
formulas and tier tokens, correctly absent rather than missing.

**Deleting an item can make a test pass for the worst reason.** Removing Shield of Rehearsal left an
assertion that it was *absent* from an Enhancement Shaman's off-hand list — which would then have
held however broken the filtering became. It now names Aldori Legacy Defender, a real Tank shield a
Protection Warrior **is** offered (247 off-hand options against an Enhancement Shaman's 126), so the
absence proves the filter rather than the deletion.

**Do not count that one with grep — load the module.** An earlier pass through this file "corrected"
124 to 123 on the strength of a grep, and the grep was what was wrong. Three ways to count it
disagreed:

- A bare `needsVerification: true` returns **163**, because `crafting` blocks and individual
  `crafting.materials[]` entries carry their own flags.
- Anchoring to the item indent (`^    needsVerification`) returned **123**, because
  `arcanite-steam-pistol` had its flag and `boss` written at **zero** indentation. Functionally fine,
  invisible to the eye, and silently one short. That formatting is now fixed, so the anchored grep and
  the real figure agree at 124 — but only by luck of nobody writing the next one crookedly.
- Importing `sampleItems` and filtering `needsVerification === true` returns **124**, and is the only
  method that cannot be defeated by whitespace.

The wider point is the one the repo already makes about scripted edits: a pattern that matches
nothing, or matches nearly everything, reports success either way. Count structured data by parsing
it.
