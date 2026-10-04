# Prototype brief (shared by all 10 directions)

Each prototype is a **static, clickable HTML mock** of what Project Defeat could look like. It is not
wired to the real app. Ten designers work in parallel, one direction each.

## The product

Project Defeat is a planner for **World of Warcraft: The Burning Crusade Classic (Anniversary),
Phase 2** (Serpentshrine Cavern, Tempest Keep, Tier 5, with all Phase 1 raids still available). It
is built for DPS players. Six sections:

1. **Character Planner**, with sub-tabs Gear, Compare, Talents, Buffs, Ranked Gear and Build
2. **Simulation** (estimated DPS against a fixed boss: level 73, 7,700 armor)
3. **Raid Composition** (seat 10 or 25 players, see which buffs each group gets)
4. **Spec Tier Lists** (Wowhead's Phase 2 rankings)
5. **Raids** (loot per boss, attunements)
6. **Professions** (levelling guides 1–375, farming maps)

The live app is at https://josephevenson08.github.io/project-defeat/. The current look is dark, with
Cinzel headings, bevelled metal panels, square corners, and faction theming (Alliance blue/gold,
Horde iron/red). Your direction may keep or depart from that.

## What every prototype must show

- **The planner screen for a Human Fury Warrior (Alliance, Phase 2) wearing the set below**: the
  character, the stats, all 17 gear slots with item, enchant and source, and the planner sub-tabs.
- **Enough navigation to show the six sections.** Other sections can be a light sketch, or clickable
  tabs swapping simple panels.
- **Item names in quality colors**: epic `#a335ee`, rare `#0070dd`, uncommon `#1eff00`, legendary
  `#ff8000`. All items below are epic. Lighten slightly on light backgrounds for contrast.
- **Provenance**: the research's strongest finding is that 16 of 25 platforms print source, phase
  and data age next to the numbers, e.g. "Wowhead · Phase 2 · updated 12 Sep". Show it somewhere,
  in your direction's style.
- **One subject-only detail**: real units and terms, such as rating vs. percent, the hit cap, "T5",
  "Badge of Justice", boss names.

## Real data (use this, do not invent other items)

**Stats (Human Fury Warrior, Phase 2 set):** Attack Power 1,788 · Hit Rating 140 · Crit Rating 536 ·
Haste Rating 163 · Expertise 64 · Armor Pen 0. Melee hit cap for a dual-wielder's special attacks is
142 rating (9%) in TBC, so 140 is 2 rating under. (You may show that; don't invent other percentages.)

**Gear (slot: item + enchant, source):**
- Head: Destroyer Battle-Helm + Glyph of Ferocity (T5 token, Lady Vashj, Serpentshrine Cavern)
- Neck: Pendant of the Perilous (Serpentshrine Cavern trash)
- Shoulders: Destroyer Shoulderblades + Might of the Scourge (T5 token, Void Reaver, Tempest Keep)
- Back: Black-Iron Battlecloak + Greater Agility
- Chest: Destroyer Breastplate + Exceptional Stats (T5 token, Kael'thas Sunstrider, Tempest Keep)
- Wrists: Bracers of Eradication + Brawn
- Hands: Destroyer Gauntlets + Major Strength (T5 token, Leotheras the Blind, Serpentshrine Cavern)
- Waist: Belt of One-Hundred Deaths
- Legs: Leggings of Murderous Intent + Nethercobra Leg Armor
- Feet: Warboots of Obliteration + Cat's Swiftness
- Finger 1: Band of the Ranger-General (Kael'thas Sunstrider, Tempest Keep)
- Finger 2: Ring of Reciprocity
- Trinket 1: Dragonspine Trophy (Gruul the Dragonkiller, Gruul's Lair)
- Trinket 2: Badge of the Swarmguard
- Main Hand: Dragonstrike + Mongoose
- Off Hand: Talon of Azshara + Mongoose
- Ranged: Serpent Spine Longbow + Khorium Scope

Where a source isn't listed, don't make one up: leave it off or write "source in guide".
"Destroyer Battlegear (4/5)" is the tier set count (4 Destroyer pieces equipped). The five T5 token bosses are Lady Vashj (helm), Void Reaver (shoulders), Kael'thas Sunstrider (chest), Leotheras the Blind (gloves) and Fathom-Lord Karathress (legs); the legs token is not in this set.

**Spec Tier List (Wowhead, Phase 2, DPS):** S: Arcane Mage, Destruction Warlock, Beast Mastery
Hunter, Fury Warrior · A: Arms Warrior, Enhancement Shaman, Affliction Warlock, Survival Hunter · B:
Retribution Paladin, Combat Rogue, Shadow Priest, Elemental Shaman, Balance Druid, Fire Mage.

**Raids:** Karazhan, Gruul's Lair, Magtheridon's Lair (Phase 1); Serpentshrine Cavern, Tempest Keep
(Phase 2). Karazhan loot examples: Attumen the Huntsman: Steelhawk Crossbow, Worgen Claw Necklace,
Gloves of Saintly Blessings. Moroes: Emerald Ripper, Brooch of Unquenchable Fury, Royal Cloak of
Arathi Kings. Vendor example: Necklace of Eternal Hope, 25x Badge of Justice.

**Mining example:** Fel Iron Deposit, skill 300, Hellfire Peninsula, Zangarmarsh, Shadowmoon Valley.

**Icons:** none are available to you. Use small square glyphs: the slot's initials, or a simple
CSS/SVG shape, bordered in the item's quality color. No external images. No Blizzard logos or art.

## Technical rules (each prototype is served as its own page)

- One self-contained file: `docs/design/prototypes/NN-slug.html`. **Start it with `<!doctype html>`,
  `<html lang="en">`, a `<head>` with `<meta charset="utf-8">`,
  `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, a
  `<title>`, and your `<style>`, then `<body>`.** It is served without any wrapper, so set your own
  base styles (box-sizing, margin 0, font, background).
- **External resources:** fonts only from Google Fonts (`fonts.googleapis.com`), always with a real
  fallback stack. Scripts only from cdnjs.cloudflare.com if you truly need one (you probably don't;
  vanilla JS is fine). No other hosts, no images from the web, no iframes. Inline everything else.
- **A single committed look is fine** (most directions will be dark). Set `color-scheme` and every
  color explicitly through CSS custom properties on `:root`, and give `body` an explicit background.
  If your direction has a light and dark theme, define both through tokens.
- **Must work at 400px wide** with no horizontal page scroll and at least a 16px side gutter. Wide
  tables go in their own `overflow-x: auto` container. Also design for 1280px desktop.
- **Accessibility:** visible focus states, semantic buttons and links, `prefers-reduced-motion`
  respected, readable contrast (WCAG AA for text).
- **Interactivity:** tabs and nav should click and swap content with a little vanilla JS. Use
  `el.hidden` for show/hide. No `alert()` or `confirm()`.
- **Craft:** a deliberate type pairing (avoid Inter and Space Grotesk as the default safe choice),
  a named color token set, a clear type scale, tabular numbers for stats. Avoid generic AI looks:
  purple-to-blue gradient heroes, emoji as icons, everything centred, `rounded-lg` on every block.
- At the top of `<body>` (or in the footer), a small line naming the direction and what it borrows
  from the research, e.g. "Direction 02 · Sim Console — after WoWSims and Raider.IO (research T5,
  T16, T18)". Prototype content only; no claim that it is the live app.

## Research to draw on

Read `docs/research/gaming-ui/trends.md` and `recommendations.md` (and the platform notes your
direction names) before designing. Cite trend IDs (T1–T19) or recommendations (R1–R12) in your
direction line.
