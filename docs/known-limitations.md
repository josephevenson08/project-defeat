# Known limitations

- The physical DPS path models white damage plus **one** signature special per spec, and only when
  that special's sustained rate is defensible: a cooldown, an energy cost against energy's fixed
  10/sec regen, or — since 2026-08-23 — a hunter's shot weave, bounded by the 1.5s hunter global
  cooldown and by one shot per auto-shot cycle. **Rage-costed abilities with no cooldown are still
  excluded**, because rage income depends on damage taken, and the simulation names what it left out
  rather than guessing a rate — Heroic Strike is carried in the ability data and contributes nothing,
  which is that exclusion doing its job. **Multi-ability rotations cover 5 specs of 27**: Warrior Arms
  and Fury press three buttons each, Affliction maintains four damage-over-time effects under a Shadow
  Bolt filler, Shadow keeps two dots up with Mind Blast on cooldown and Mind Flay in the gaps, and
  Destruction maintains Immolate and fills with Incinerate. **The other 22 are a single-ability
  approximation**, which understates any spec whose damage is spread across several buttons.

  Several specs nonetheless show more than one damage source — a hunter's pet, a rogue's poison, a
  paladin's seal, Enhancement's Windfury — but those are attackers and procs rather than buttons a
  rotation presses, and counting them here would inflate the figure by redefining it.

  *(This bullet read "only Fury and Arms Warrior" until 2026-09-10 — stale, since Affliction, Shadow
  and Destruction had joined. The first correction said "15 of 20" by counting damage sources instead
  of rotational abilities, which measured a different thing and overstated it; `featureFlags.ts` had
  the right figure all along.)*
- **Retribution's Holy damage is modelled and is faction-split.** Seal of Blood adds 35% of weapon
  damage to every landed swing, Seal of Command 70% at 7 procs per minute, and the judgement lands on
  a 10s cooldown. Seal of Blood is Horde-only in Phase 2, and the difference is large — Judgement of
  Blood deals 295-325 against Judgement of Command's 68-73 — so the estimate reads the character's
  faction. **Holy damage is not reduced by armor**, which makes it the only unmitigated damage on the
  physical path.
- **Windfury Weapon is modelled for Enhancement**, as a proc against the main-hand swing rate rather
  than as an ability — 20% per landed swing, capped by a 3-second internal cooldown, two extra
  attacks at +475 attack power. The main hand is *assumed* to carry the imbue, since the app has no
  weapon-imbue slot to read; Flametongue on the off-hand and the Elemental Weapons talent are not
  modelled.
- **No mana-costed ability is capped by mana** — `StatBlock` has no mana field, so the breakdown
  reports the mana per second the modelled rate spends rather than enforcing a pool it would have to
  invent. This applies to every mana-costed physical ability, not just the hunter shot that prompted
  it: an Enhancement shaman sees it for Stormstrike. Aspect of the Viper, Judgement of Wisdom,
  Shamanistic Rage and potions are all unmodelled.
- Feral Druid is modelled in cat form, which in TBC swings a fixed internal weapon rather than the
  equipped one — so weapon damage and speed genuinely don't matter for Feral. What matters is Feral
  Attack Power, an explicit stat TBC prints on druid weapons, which is now modelled and adds 1:1 into
  attack power. **26 catalogued weapons now carry a real value**, from 285 on the Wild Wood Staff to
  1,459 on Staff of Disintegration, and the spread reaches the stat rail — swapping the lowest for the
  highest moves a Feral druid's attack power by 1,079. Feral weapon comparisons differentiate properly
  now; what remains is that a weapon *without* the stat is indistinguishable from one that has none.

  *(This bullet said only Terestian's Stranglestaff carried the stat until 2026-09-10. That was true
  when written and became false when the catalogue was re-ingested.)*
- Caster and healer estimates model one real signature ability per spec rather than a rotation — no
  cooldowns, procs, downranking, or multi-spell priority.
- No multi-iteration variance and no result charts, so every number is a point estimate.
- **Talents reach all 27 specs, but coverage is not completeness.** 579 talents are ingested across
  all nine classes, and since 2026-08-21 their machine-readable effects reach the always-visible stat
  rail, the gear rankings and the upgrade finder as well as the estimate. **A named list of talent
  groups is still refused**, each with a reason — the count is asserted from the data rather than
  written here, because the figure that used to sit in this sentence went stale the moment the ingest
  changed. **One kind dominates now**: per-spell effects (Ignite, Shadow Weaving, Ruin, every
  "Improved &lt;nuke&gt;") need a spell school this simulator does not record. The stat-pipeline
  effects this sentence used to name alongside them — Toughness, Vitality, Divine Strength — stopped
  being refused on 2026-08-21 when talents reached `calculateStats`, and a test now fails if any
  refusal still claims otherwise. **Expect a talented estimate to read low**, especially for casters.
- **Spells record a damage school**, sourced per ability rather than guessed from the class. That is
  what lets a school-scoped bonus like Demonic Sacrifice apply to the right spells and no others.
- **A Demonology warlock's Felguard is modelled**, scaling off 57% of the owner's spell power rather
  than any attack power. Only Demonology gets one: Affliction and Destruction sacrifice their demon
  for a school-scoped damage multiplier (Demonic Sacrifice), which reaches their spells' school.
- **The target's school debuffs reach the spells of their school and multiply** (since 2026-11-01):
  Curse of the Elements (Arcane, Fire, Frost, Shadow, so not an Elemental Shaman's Nature), Misery
  (every magic school, a Rogue's poisons and a Paladin's Holy seal included), Shadow Weaving, Improved
  Scorch and Winter's Chill, each at the full stack a raid keeps up. **Listed but not applied:**
  Vampiric Touch and Judgement of Wisdom (mana, which nothing here tracks for that use), Improved
  Shadow Bolt and Stormstrike's Nature debuff (charges and an uptime nothing plays out). **Applied
  since 2026-11-02:** Blood Frenzy (+4% on every physical source), Hunter's Mark (+440 ranged attack
  power to the Hunter's shots, not the pet) and Improved Hunter's Mark (+110 melee), Expose Armor
  (3,075, overwriting Sunder rather than adding) and Mangle (+30% on bleed ticks and Shred).
- **Marksmanship is exempt from the calibration check** (the owner's call, 2026-11-02): at a sourced
  raid build with the physical debuffs it reads 1,578 against a 95th percentile of 1,386, drawn from
  5,495 parses of a spec guides rate F-tier in PvE. The trust range leaves it out and says why.
  Subtlety and Assassination, with thinner references still, pass by under 1%.
- **Class cooldowns are averaged, not timed** (since 2026-11-02): Arcane Power, Icy Veins, Rapid Fire,
  Bestial Wrath and The Beast Within, Death Wish, Recklessness, Avenging Wrath, Adrenaline Rush and
  Blade Flurry are each worth their effect for duration ÷ cooldown of the fight, the rule on-use
  trinkets use. That is a steady state: a real fight presses each at the pull, so long cooldowns
  (Recklessness's 30 minutes most) are worth a little more than this gives them. The one-charge
  cooldowns (Combustion, Cold Blood, Elemental Mastery, Presence of Mind, Inner Focus, Amplify Curse,
  Shadowstep) are still refused, and pets whose damage is unread (Water Elemental, Fire Elemental
  Totem, Force of Nature, Shadowfiend) are out.
- **The DPS references are each spec's 95th percentile** (Warcraft Logs, Phase 2, read 2026-11-02),
  not an average. archon.gg's figures used until then were the same measure, labelled "average"
  here by mistake; a best case is therefore compared with what the top 5% of a spec's parses reach.
- **Feral's bleeds are modelled, and bleeds ignore armor.** Rake and Rip are maintained rather than
  spammed — a bleed's rate is how often it falls off, not how often you can afford it — and their
  ticks take no armor mitigation at all, though Rake's opening hit does. Mangle is still missing.
- **Slice and Dice is modelled for every rogue.** It deals no damage — it spends energy and combo
  points to buy 30% melee speed, which lands in the white-damage swing rate. Combat Potency feeds the
  energy that pays for it, off landed off-hand hits only. **Poisons are modelled too** — Instant on
  the main hand and Deadly on the off hand, taken from wowsims' own preset since this app has no
  weapon-imbue slot. Both are Nature damage on the spell table, so armor does not reduce them and they
  use spell hit rather than melee hit.
- **A hunter's pet swings, and presses three buttons.** Its auto attack is modelled — its own weapon
  and attack table, 22% of the owner's ranged attack power, no inherited crit — along with every Beast
  Mastery talent this model can express, a focus bar spent on Bite and Claw, and Kill Command. Whether
  an ability scales decides its worth: Bite and Claw are flat rolls that gear cannot move, while Kill
  Command is a real weapon swing and is worth more than both together. Three gates point three
  different ways: Bite and Claw at the pet's focus, Kill Command at the owner's crits, Frenzy at the
  pet's own. Only Bestial Wrath is still missing. The estimate
  names the pet family it assumes, because the eight families span 0.91 to 1.1 and there is no picker.
- The layout is fluid and reflows to phone width. It previously had a ~806px floor from fixed
  containers, a hard two-column content grid and a non-wrapping tab bar; all three are responsive now.
- Feral Druid is treated as physical DPS until bear/cat mode support is split.
- Eleven of the twenty-four raid encounters have no boss artwork yet — Nightbane, and all of
  Serpentshrine Cavern and Tempest Keep — so their cards are bare. A first-time visitor in the
  2026-09-21 usability study read the empty cards as a broken page rather than as art that has not
  arrived, which is a fair reading and worth fixing before the art does.
- Saved builds live in this browser's local storage only. Clearing site data loses them, and they do
  not follow you to another browser or machine — use export/import for that.
- Recipe/material crafting detail exists on a handful of items as a proof of concept; most crafted items still need it filled in as each class's gear gets audited.
- Tank/healer/caster meta gems and Shoulder/Back/Leg enchants are now covered for every role that had real Phase 1/2 TBC options (casters/healers historically had no cloak or leg armor enchant this early, so those are intentionally absent rather than missing); exact values are still `needsVerification` pending final tooltip audits.
