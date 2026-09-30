# Discord bot: plan

**Status: planned, not started.** Written 2026-09-30. Nothing in this folder runs yet.

A Discord bot that answers TBC Phase 2 questions in chat, using the same data as the Project Defeat
website. It runs on the owner's Raspberry Pi. Players type a slash command and get a short text
answer, plus a link that opens the result in the live app.

---

## Goals

- **One source of truth.** The bot reads the data in `src/domain/` directly. It never keeps its own
  copy. When a BiS list or loot table is fixed in the repo, the bot picks it up on its next update.
- **Short, readable replies.** Plain text in Discord's monospace blocks, not walls of prose.
- **Honest.** If the data is flagged as unverified, or a slot has no recommendation, the reply
  says so rather than guessing. Same rule as the website.
- **No backend or accounts.** The bot answers questions and stores nothing about users.

## Out of scope (for now)

- **Gems.** Choosing gems means checking which gem gives the most damage for each spec while keeping
  the meta gem's colour requirements satisfied. Not worth doing well in a chat reply yet.
- **Ring enchants.** Only Enchanters can use them, so they are left out of `/bis` replies.
- Raid sign-ups, reminders, or anything else that needs to store data.

---

## Commands

### 1. `/bis <spec>`

The best-in-slot set for a spec, one line per slot, with the enchant where there is one.

```
/bis fury warrior
```

```
\---Fury Warrior BIS---/
Helm: Destroyer Battle-Helm + Glyph of Ferocity
Neck: Pendant of the Perilous
Shoulders: Destroyer Shoulderblades + Might of the Scourge
Back: Black-Iron Battlecloak + Greater Agility
Chest: Destroyer Breastplate + Exceptional Stats
Wrists: Bracers of Eradication + Brawn
Hands: Destroyer Gauntlets + Major Strength
Waist: Belt of One-Hundred Deaths
Legs: Leggings of Murderous Intent + Nethercobra Leg Armor
Feet: Warboots of Obliteration + Cat's Swiftness
Ring 1: Band of the Ranger-General
Ring 2: Ring of Reciprocity
Trinket 1: Dragonspine Trophy
Trinket 2: Badge of the Swarmguard
Main Hand: Dragonstrike + Mongoose
Off Hand: Talon of Azshara + Mongoose
Ranged: Serpent Spine Longbow
Open in Project Defeat: <link>
```

- All 27 specs. Discord autocompletes the spec name as you type.
- **Weapon enchants are included, ring enchants are not, and gems are not.**
- Built on `buildRecommendedSet()` in `src/features/gear/equipRecommendedSet.ts`, the same function
  behind the planner's "Equip the recommended set" button.
- The link at the bottom is a build link, which the app already supports. It opens the planner
  wearing this set.

**Data to fix first: weapon enchants.** Checked 2026-09-30 against every spec's list:

| Gap | Specs |
| --- | --- |
| No main-hand or off-hand enchant | Arms Warrior, Fury Warrior |
| No off-hand enchant | Assassination, Combat and Subtlety Rogue |
| No ranged scope | All three Hunter specs (decide whether scopes count) |

The other 25 specs already have a recommended main-hand enchant. Caster off-hands (orbs, books,
shields) correctly have none. Fix this in `src/domain/bis/` with sources, so the website gets it
too.

### 2. `/whodrops <item>`

Where an item comes from.

```
/whodrops Dragonspine Trophy
```

```
Dragonspine Trophy
Drops from: Gruul the Dragonkiller (Gruul's Lair)
```

```
/whodrops Necklace of Eternal Hope
```

```
Necklace of Eternal Hope
Vendor: 25x Badge of Justice
```

- Autocompletes item names from the gear catalogue.
- Covers raid drops, vendors (with cost, e.g. "41x Badge of Justice"), crafted items (profession
  and reagents), and dungeon drops.
- Built on `resolveAcquisition()` in `src/domain/bis/acquisition.ts` and the raid loot tables.
- If the source is unknown, say "source not recorded yet" rather than leaving it blank.

### 3. `/attune <raid>`

The attunement steps for Karazhan, Serpentshrine Cavern or Tempest Keep.

```
/attune karazhan
```

```
\---Karazhan Attunement---/
1. <quest name>: <giver, where>
2. ...
Last checked: <date>
```

- Data: `src/domain/raids/sampleAttunements.ts`.
- **Keeping it up to date matters here.** All three chains are currently flagged
  `needsVerification`, because it isn't confirmed whether Anniversary realms changed them (for
  example, dropping attunements in a later patch the way earlier Classic runs did). Before this
  command ships:
  - Re-check each chain against Wowhead and one other guide, and clear or keep each flag.
  - Show a "Last checked" date on every reply.
  - While a flag is still set, add a line: *"Not yet confirmed for Anniversary realms."*

### 4. `/loot <raid or boss>`

A raid's loot, laid out as a table: boss on the left, drops on the right.

```
/loot karazhan
```

```
\---Karazhan Loot---/
Boss                     Loot
Attumen the Huntsman     Steelhawk Crossbow, Worgen Claw Necklace, Gloves of Saintly Blessings, +12 more
Moroes                   Emerald Ripper, Brooch of Unquenchable Fury, Royal Cloak of Arathi Kings, +N more
Maiden of Virtue         ...
...
```

- `/loot prince` (one boss) gives that boss's full list.
- Data: the boss files in `src/domain/raids/`, which hold complete loot tables for all five
  Phase 1 and 2 raids.
- **Discord's 2,000-character message limit.** A whole raid's loot will not fit in one message.
  Options, to decide when building:
  - Show the first few items per boss with "+N more", and let `/loot <boss>` show the rest.
  - Split across several messages, or use page buttons.
- Put the table in a code block so the columns line up.

### 5. `/farm <skill level or material>`

Where to farm, for Mining and Herbalism. Two ways to ask:

```
/farm mining 150
```

```
\---Mining 150---/
Range: <the skill range 150 falls in, and its ores>
Best zones: <zones, in the order the Professions page recommends>
Map: <link to the Professions page>
```

```
/farm fel iron
```

```
\---Fel Iron Ore---/
Skill needed: 300
Zones: Hellfire Peninsula, Zangarmarsh, Shadowmoon Valley, ...
```

- **By skill:** uses the levelling ranges in `src/domain/professions/gatheringGuides.ts` and
  `gatheringPlan.ts`, the same ranges the Professions page shows.
- **By material:** uses `src/domain/professions/nodeSpawns.json`, which has 45 gathering nodes, each
  with its required skill and the zones it spawns in, ordered by spawn count.
- Accept common names: "thorium", "fel iron", "adamantite", "felweed".
- Link to the matching route map on the website, since a chat reply cannot show the map.

### 6. `/import <string>`

Paste the string from the in-game addon (`/pdexport`). The bot reads your equipped gear and lists
upgrades.

```
/import <string from /pdexport>
```

```
\---Upgrades for Human Fury Warrior---/
Head: you wear <item>. Upgrade: Destroyer Battle-Helm (Prince Malchezaar, Karazhan)
Trinket 2: you wear <item>. Upgrade: Badge of the Swarmguard (<source>)
...
Already best-in-slot: Neck, Back, Main Hand
Open your character in Project Defeat: <link>
```

- Parsing: `src/domain/builds/addonImport.ts`, the same code the website's import uses.
- For each slot, compare what you wear with the ranked list for your spec. Anything ranked above
  your item is an upgrade. Show where it drops, using the same lookup as `/whodrops`.
- **Rankings from more than one source.** The rankings today come from Wowhead's guides. The goal is
  to also compare against other sources and show agreement, e.g. *"ranked higher by 3 of 3
  sources"*. Candidates to research first: Icy Veins guides, the wowsims presets, and BiS addons
  that players already use. For each one, check that its data is allowed to be reused, and that it
  covers TBC Phase 2 for Anniversary realms.
- The import string carries no name, realm or character ID, and the bot does not store it.

---

## How it's built

- **Language:** TypeScript on Node.js, using the discord.js library. That way the bot can import the
  project's `src/domain` code directly.
- **Where the code lives:** this `discord-bot/` folder, inside the Project Defeat repo, so the bot
  and the website always share the same data.
- **Replies are pure functions.** Each command is a function that takes the arguments and returns
  text, tested without Discord. The Discord part is a thin layer on top.
- **Tests:** a test per command checking the reply against real data, e.g. `/bis fury warrior` has
  17 lines, no ring enchant, and a weapon enchant on both hands.

## Running it on the Raspberry Pi

- **Keep it running:** a systemd service (or pm2) that starts on boot and restarts if it crashes.
- **Stay up to date:** a scheduled job pulls `main` from GitHub, and restarts the bot only when
  something changed. Push a data fix and the bot has it within the hour.
- **The bot token** lives in a `.env` file on the Pi only. It is never committed (`.env` is
  already in `.gitignore`). The owner creates the bot and its token in the Discord Developer Portal.
- **TunezBot vs a new bot:** undecided. Separate is simpler to reason about. Adding commands to
  TunezBot means one fewer process on the Pi.

## Build order

1. **Data fixes:** weapon enchants for the specs listed above, and re-check the attunements.
2. **Set up the bot:** project skeleton, Discord app, running on the Pi, updating itself.
3. **`/bis`**
4. **`/whodrops`** and **`/loot`**
5. **`/attune`**, once the attunement data is re-checked.
6. **`/farm`**
7. **`/import`** with Wowhead rankings first, then add more ranking sources.

## Open decisions

- A separate bot, or new commands in TunezBot?
- Do hunter scopes count as weapon enchants in `/bis`?
- How `/loot` handles the 2,000-character limit: "+N more", several messages, or page buttons?
- Which extra ranking sources `/import` should use, once their terms are checked.
- Should replies be visible to everyone in the channel, or only to the person who asked?
