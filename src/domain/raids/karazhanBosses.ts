import type { RaidBoss } from './raidTypes'

/**
 * Karazhan, complete — 147 drops across eleven encounters, plus the raid's notable trash.
 *
 * **This file used to say it listed "only the drops that still matter to a Phase 2 raider".** It held
 * 45 rows, which was a defensible trim while Karazhan was old content nobody opened in this app, and
 * stopped being one when the raid tab grew a card per encounter: clicking Attumen showed three rows
 * against a real table of fourteen, and the card's own "3 drops" label made the gap look like a fact.
 *
 * The tables now come from `tools/ingest/ingest-raid-loot.mjs`, which reads Wowhead's own embedded
 * drop data, so every row carries a real `wowItemId` and is re-runnable rather than remembered. 135
 * of the 147 resolve to a catalogue item; the other 12 are tier tokens, enchanting formulas, a
 * schematic, a quest reward and the mount — real drops with no stat block here, each flagged and
 * saying so rather than rendering as an item with nothing on it.
 *
 * Two encounters do not drop their own loot and would silently come back empty if that were ever
 * forgotten: the **Chess Event** rewards a chest object rather than Echo of Medivh, and the **Opera
 * Event** is three different fights, with the Wizard of Oz loot on The Crone rather than Dorothee.
 * The ingest script records where each one actually lives.
 *
 * Encounter order is the standard clear route; the tower is only partly linear, and Illhoof, Aran,
 * Netherspite and Nightbane sit off the critical path.
 */
export const karazhanBosses: readonly RaidBoss[] = [
  {
    id: 'attumen-the-huntsman',
    name: 'Attumen the Huntsman',
    raidId: 'karazhan',
    encounterOrder: 1,
    mechanics:
      'Starts as the horse Midnight; Attumen joins at 95% and the two merge into one mounted boss at 25%. Keep both halves near each other before the merge so the tank holds threat through it. The merged boss cleaves and casts a Mortal Strike-style healing debuff on the tank, so the tank healer needs to over-heal through it. Nothing here punishes the raid — it is purely a tank-and-healer check.',
    roleNotes: [
      { role: 'Tank', note: 'Face Attumen away from the raid; his cleave hits everything in front.' },
      { role: 'Healer', note: 'Expect a mortal-strike style healing reduction on the tank for most of the merged phase.' },
    ],
    loot: [
      { itemId: 'bracers-of-the-white-stag', name: 'Bracers of the White Stag', wowItemId: 28453, dropType: 'Boss' },
      { name: 'Fiery Warhorse\'s Reins', wowItemId: 30480, dropType: 'Boss', needsVerification: true, notes: 'Mount, very low drop rate. Not in the item catalog.' },
      { itemId: 'gauntlets-of-renewed-hope', name: 'Gauntlets of Renewed Hope', wowItemId: 28505, dropType: 'Boss' },
      { itemId: 'gloves-of-dexterous-manipulation', name: 'Gloves of Dexterous Manipulation', wowItemId: 28506, dropType: 'Boss', roles: ['Physical DPS'] },
      { itemId: 'gloves-of-saintly-blessings', name: 'Gloves of Saintly Blessings', wowItemId: 28508, dropType: 'Boss' },
      { itemId: 'handwraps-of-flowing-thought', name: 'Handwraps of Flowing Thought', wowItemId: 28507, dropType: 'Boss' },
      { itemId: 'harbinger-bands', name: 'Harbinger Bands', wowItemId: 28477, dropType: 'Boss' },
      { name: 'Schematic: Stabilized Eternium Scope', wowItemId: 23809, dropType: 'Boss', needsVerification: true, notes: 'Real drop; not in the item catalogue, so it is listed by name only.' },
      { itemId: 'spectral-band-of-innervation', name: 'Spectral Band of Innervation', wowItemId: 28510, dropType: 'Boss' },
      { itemId: 'stalkers-war-bands', name: 'Stalker\'s War Bands', wowItemId: 28454, dropType: 'Boss' },
      { itemId: 'steelhawk-crossbow', name: 'Steelhawk Crossbow', wowItemId: 28504, dropType: 'Boss', roles: ['Physical DPS'] },
      { itemId: 'vambraces-of-courage', name: 'Vambraces of Courage', wowItemId: 28502, dropType: 'Boss' },
      { itemId: 'whirlwind-bracers', name: 'Whirlwind Bracers', wowItemId: 28503, dropType: 'Boss' },
      { itemId: 'worgen-claw-necklace', name: 'Worgen Claw Necklace', wowItemId: 28509, dropType: 'Boss' },
    ],
  },
  {
    id: 'moroes',
    name: 'Moroes',
    raidId: 'karazhan',
    encounterOrder: 2,
    mechanics:
      'Moroes brings four of six possible dinner-guest adds, randomised per lockout, and the pull is decided entirely by the crowd-control assignments made before it. Baron Rafe Dreuger and Lady Keira Berrybuck heal, so they die first or stay controlled. Moroes himself vanishes and garrotes a random player for a heavy bleed that must be healed through, and he gains attack speed as his health drops. Assign every CC by name before pulling; improvising this fight is how 10-player groups wipe.',
    roleNotes: [
      { role: 'Tank', note: 'Pick up Moroes immediately and hold the uncontrolled adds off the healers.' },
      { role: 'Healer', note: 'The Garrote bleed lands on a random player and cannot be dispelled — heal it, do not wait it out.' },
    ],
    loot: [
      { itemId: 'belt-of-gale-force', name: 'Belt of Gale Force', wowItemId: 28567, dropType: 'Boss' },
      { itemId: 'boots-of-valiance', name: 'Boots of Valiance', wowItemId: 28569, dropType: 'Boss' },
      { itemId: 'brooch-of-unquenchable-fury', name: 'Brooch of Unquenchable Fury', wowItemId: 28530, dropType: 'Boss' },
      { itemId: 'crimson-girdle-of-the-indomitable', name: 'Crimson Girdle of the Indomitable', wowItemId: 28566, dropType: 'Boss' },
      { itemId: 'earthsoul-leggings', name: 'Earthsoul Leggings', wowItemId: 28591, dropType: 'Boss' },
      { itemId: 'edgewalker-longboots', name: 'Edgewalker Longboots', wowItemId: 28545, dropType: 'Boss', roles: ['Physical DPS'] },
      { itemId: 'emerald-ripper', name: 'Emerald Ripper', wowItemId: 28524, dropType: 'Boss' },
      { name: 'Formula: Enchant Weapon - Mongoose', wowItemId: 22559, dropType: 'Boss', needsVerification: true, notes: 'Enchanting formula, still one of the top Phase 2 weapon enchants. Not in the item catalog.' },
      { itemId: 'idol-of-the-avian-heart', name: 'Idol of the Avian Heart', wowItemId: 28568, dropType: 'Boss' },
      { itemId: 'moroes-lucky-pocket-watch', name: 'Moroes\' Lucky Pocket Watch', wowItemId: 28528, dropType: 'Boss', roles: ['Tank'] },
      { itemId: 'nethershard-girdle', name: 'Nethershard Girdle', wowItemId: 28565, dropType: 'Boss' },
      { itemId: 'royal-cloak-of-arathi-kings', name: 'Royal Cloak of Arathi Kings', wowItemId: 28529, dropType: 'Boss' },
      { itemId: 'shadow-cloak-of-dalaran', name: 'Shadow-Cloak of Dalaran', wowItemId: 28570, dropType: 'Boss' },
      { itemId: 'signet-of-unshakable-faith', name: 'Signet of Unshakable Faith', wowItemId: 28525, dropType: 'Boss' },
    ],
  },
  {
    id: 'maiden-of-virtue',
    name: 'Maiden of Virtue',
    raidId: 'karazhan',
    encounterOrder: 3,
    mechanics:
      'A spread-out fight. Holy Wrath chains between players standing near each other, so everyone except the tank stays at least ten yards apart. Repentance is a raid-wide incapacitate that breaks on damage — stop attacking through it or the tank loses threat with the raid still stunned. Holy Fire on the tank is a heavy damage-over-time that should be dispelled at once.',
    roleNotes: [
      { role: 'Healer', note: 'Dispel Holy Fire on the tank immediately; pre-heal before Repentance since you cannot cast during it.' },
    ],
    loot: [
      { itemId: 'bands-of-indwelling', name: 'Bands of Indwelling', wowItemId: 28511, dropType: 'Boss' },
      { itemId: 'bands-of-nefarious-deeds', name: 'Bands of Nefarious Deeds', wowItemId: 28515, dropType: 'Boss' },
      { itemId: 'barbed-choker-of-discipline', name: 'Barbed Choker of Discipline', wowItemId: 28516, dropType: 'Boss' },
      { itemId: 'boots-of-foretelling', name: 'Boots of Foretelling', wowItemId: 28517, dropType: 'Boss' },
      { itemId: 'bracers-of-justice', name: 'Bracers of Justice', wowItemId: 28512, dropType: 'Boss' },
      { itemId: 'bracers-of-maliciousness', name: 'Bracers of Maliciousness', wowItemId: 28514, dropType: 'Boss' },
      { itemId: 'gloves-of-centering', name: 'Gloves of Centering', wowItemId: 28520, dropType: 'Boss' },
      { itemId: 'gloves-of-quickening', name: 'Gloves of Quickening', wowItemId: 28519, dropType: 'Boss' },
      { itemId: 'iron-gauntlets-of-the-maiden', name: 'Iron Gauntlets of the Maiden', wowItemId: 28518, dropType: 'Boss' },
      { itemId: 'mitts-of-the-treemender', name: 'Mitts of the Treemender', wowItemId: 28521, dropType: 'Boss', roles: ['Healer'] },
      { itemId: 'shard-of-the-virtuous', name: 'Shard of the Virtuous', wowItemId: 28522, dropType: 'Boss', roles: ['Healer'] },
      { itemId: 'totem-of-healing-rains', name: 'Totem of Healing Rains', wowItemId: 28523, dropType: 'Boss', roles: ['Healer'] },
    ],
  },
  {
    id: 'opera-event',
    name: 'Opera Event',
    raidId: 'karazhan',
    encounterOrder: 4,
    mechanics:
      'One of three randomised encounters per lockout. The Wizard of Oz is a five-target AoE fight where Strawman must not be hit by fire and Tinhead must be tanked apart. Big Bad Wolf turns a random player into Red Riding Hood and chases them, so that player kites in a wide circle while everyone else keeps attacking. Romulo and Julianne must be brought below 25% within ten seconds of each other and then killed at the same time, or both fully resurrect.',
    roleNotes: [
      { role: 'Physical DPS', note: 'On Romulo and Julianne, hold damage to keep the pair within ten seconds of each other at the end.' },
    ],
    loot: [
      { itemId: 'beastmaw-pauldrons', name: 'Beastmaw Pauldrons', wowItemId: 28589, dropType: 'Boss' },
      { itemId: 'big-bad-wolfs-head', name: 'Big Bad Wolf\'s Head', wowItemId: 28583, dropType: 'Boss' },
      { itemId: 'big-bad-wolfs-paw', name: 'Big Bad Wolf\'s Paw', wowItemId: 28584, dropType: 'Boss' },
      { itemId: 'blade-of-the-unrequited', name: 'Blade of the Unrequited', wowItemId: 28572, dropType: 'Boss' },
      { itemId: 'blue-diamond-witchwand', name: 'Blue Diamond Witchwand', wowItemId: 28588, dropType: 'Boss' },
      { itemId: 'despair', name: 'Despair', wowItemId: 28573, dropType: 'Boss' },
      { itemId: 'earthsoul-leggings', name: 'Earthsoul Leggings', wowItemId: 28591, dropType: 'Boss', roles: ['Healer'] },
      { itemId: 'eternium-greathelm', name: 'Eternium Greathelm', wowItemId: 28593, dropType: 'Boss' },
      { itemId: 'legacy', name: 'Legacy', wowItemId: 28587, dropType: 'Boss' },
      { itemId: 'libram-of-souls-redeemed', name: 'Libram of Souls Redeemed', wowItemId: 28592, dropType: 'Boss' },
      { itemId: 'masquerade-gown', name: 'Masquerade Gown', wowItemId: 28578, dropType: 'Boss', roles: ['Caster DPS', 'Healer'], notes: 'Romulo and Julianne variant only.' },
      { itemId: 'red-riding-hoods-cloak', name: 'Red Riding Hood\'s Cloak', wowItemId: 28582, dropType: 'Boss' },
      { itemId: 'ribbon-of-sacrifice', name: 'Ribbon of Sacrifice', wowItemId: 28590, dropType: 'Boss', roles: ['Healer'] },
      { itemId: 'romulos-poison-vial', name: 'Romulo\'s Poison Vial', wowItemId: 28579, dropType: 'Boss' },
      { itemId: 'ruby-slippers', name: 'Ruby Slippers', wowItemId: 28585, dropType: 'Boss' },
      { itemId: 'trial-fire-trousers', name: 'Trial-Fire Trousers', wowItemId: 28594, dropType: 'Boss' },
      { itemId: 'wicked-witchs-hat', name: 'Wicked Witch\'s Hat', wowItemId: 28586, dropType: 'Boss', roles: ['Caster DPS'], notes: 'Wizard of Oz variant only.' },
      { itemId: 'wolfslayer-sniper-rifle', name: 'Wolfslayer Sniper Rifle', wowItemId: 28581, dropType: 'Boss' },
    ],
    notes: 'The variant is rerolled each lockout, so a specific drop cannot be farmed on demand.',
  },
  {
    id: 'the-curator',
    name: 'The Curator',
    raidId: 'karazhan',
    encounterOrder: 5,
    mechanics:
      'The Curator summons Astral Flares that must be killed on sight — they explode for heavy damage on whoever they reach. He drains his own mana summoning them, and at zero mana he goes Evocating for 20 seconds and takes 200% extra damage; that window is where the whole raid burns cooldowns. Hateful Bolt hits the second-highest-health player in melee range, not the tank, so an off-tank should stand in for it. Everything else is a threat-free damage race.',
    roleNotes: [
      { role: 'Tank', note: 'Bring an off-tank into melee range to soak Hateful Bolt off the healers and DPS.' },
      { role: 'Caster DPS', note: 'Save burst cooldowns for the Evocation window — he takes 200% damage during it.' },
    ],
    loot: [
      { itemId: 'dragon-quake-shoulderguards', name: 'Dragon-Quake Shoulderguards', wowItemId: 28631, dropType: 'Boss' },
      { itemId: 'forest-wind-shoulderpads', name: 'Forest Wind Shoulderpads', wowItemId: 28647, dropType: 'Boss' },
      { itemId: 'garonas-signet-ring', name: 'Garona\'s Signet Ring', wowItemId: 28649, dropType: 'Boss', roles: ['Physical DPS'] },
      { name: 'Gloves of the Fallen Champion', wowItemId: 29757, dropType: 'Tier Token', needsVerification: true, notes: 'T4 gloves token — Paladin, Priest, Warlock.' },
      { name: 'Gloves of the Fallen Defender', wowItemId: 29758, dropType: 'Tier Token', needsVerification: true, notes: 'T4 gloves token — Warrior, Priest, Druid.' },
      { name: 'Gloves of the Fallen Hero', wowItemId: 29756, dropType: 'Tier Token', needsVerification: true, notes: 'T4 gloves token — Hunter, Mage, Rogue, Shaman.' },
      { itemId: 'pauldrons-of-the-solace-giver', name: 'Pauldrons of the Solace-Giver', wowItemId: 28612, dropType: 'Boss' },
      { itemId: 'staff-of-infinite-mysteries', name: 'Staff of Infinite Mysteries', wowItemId: 28633, dropType: 'Boss', roles: ['Tank'], notes: 'Feral druid tanking staff.' },
      { itemId: 'wrynn-dynasty-greaves', name: 'Wrynn Dynasty Greaves', wowItemId: 28621, dropType: 'Boss' },
      { itemId: 'voidheart-gloves', name: 'Voidheart Gloves', dropType: 'Tier Token', roles: ['Caster DPS'], notes: 'Warlock T4 gloves, redeemed from Gloves of the Fallen Champion.' },
    ],
  },
  {
    id: 'terestian-illhoof',
    name: 'Terestian Illhoof',
    raidId: 'karazhan',
    encounterOrder: 6,
    optional: true,
    mechanics:
      'Kil\'rek, the imp pet, applies a stacking armour debuff to the tank and must be killed on each respawn. Illhoof chains a random player to a Demon Chain that drains their life; the chains have to be broken fast or the target dies. Continuous imp adds spawn from a portal and are handled with AoE. This is an off-the-critical-path boss most groups still kill for The Lightning Capacitor.',
    roleNotes: [
      { role: 'Physical DPS', note: 'Swap instantly to the Demon Chains when a player is sacrificed; that player dies otherwise.' },
    ],
    loot: [
      { itemId: 'breastplate-of-the-lightbinder', name: 'Breastplate of the Lightbinder', wowItemId: 28662, dropType: 'Boss' },
      { itemId: 'cincture-of-will', name: 'Cincture of Will', wowItemId: 28652, dropType: 'Boss' },
      { itemId: 'cord-of-natures-sustenance', name: 'Cord of Nature\'s Sustenance', wowItemId: 28655, dropType: 'Boss' },
      { itemId: 'fools-bane', name: 'Fool\'s Bane', wowItemId: 28657, dropType: 'Boss' },
      { name: 'Formula: Enchant Weapon - Soulfrost', wowItemId: 22561, dropType: 'Boss', needsVerification: true, notes: 'Enchanting formula. Not in the item catalog.' },
      { itemId: 'gilded-thorium-cloak', name: 'Gilded Thorium Cloak', wowItemId: 28660, dropType: 'Boss' },
      { itemId: 'girdle-of-the-prowler', name: 'Girdle of the Prowler', wowItemId: 28656, dropType: 'Boss' },
      { itemId: 'malefic-girdle', name: 'Malefic Girdle', wowItemId: 28654, dropType: 'Boss' },
      { itemId: 'menders-heart-ring', name: 'Mender\'s Heart-Ring', wowItemId: 28661, dropType: 'Boss' },
      { itemId: 'shadowvine-cloak-of-infusion', name: 'Shadowvine Cloak of Infusion', wowItemId: 28653, dropType: 'Boss' },
      { itemId: 'terestians-stranglestaff', name: 'Terestian\'s Stranglestaff', wowItemId: 28658, dropType: 'Boss', roles: ['Tank'] },
      { itemId: 'the-lightning-capacitor', name: 'The Lightning Capacitor', wowItemId: 28785, dropType: 'Boss', roles: ['Caster DPS'], notes: 'Still a Phase 2 best-in-slot caster trinket for several specs, which is why Phase 2 groups keep killing this optional boss.' },
      { itemId: 'xavian-stiletto', name: 'Xavian Stiletto', wowItemId: 28659, dropType: 'Boss' },
    ],
  },
  {
    id: 'shade-of-aran',
    name: 'Shade of Aran',
    raidId: 'karazhan',
    encounterOrder: 7,
    mechanics:
      'No threat table — Aran attacks whoever he likes, so there is no tank. Flame Wreath burns a ring on the floor and anyone who moves at all detonates it and likely wipes the raid; stop moving the instant it is cast. Blizzard sweeps the room and has to be walked away from, and Arcane Explosion is countered by running to the wall. At 40% he drains all raid mana and casts Elementals; at 20% he Pyroblasts everyone unless interrupted.',
    roleNotes: [
      { role: 'Caster DPS', note: 'Do not move during Flame Wreath, not even to dodge Blizzard — take the Blizzard damage instead.' },
      { role: 'Healer', note: 'Keep a mana potion or Innervate for the 40% Drain Mana; healing after it is otherwise impossible.' },
    ],
    loot: [
      { itemId: 'arans-soothing-sapphire', name: 'Aran\'s Soothing Sapphire', wowItemId: 28728, dropType: 'Boss' },
      { itemId: 'boots-of-the-incorrupt', name: 'Boots of the Incorrupt', wowItemId: 28663, dropType: 'Boss' },
      { itemId: 'boots-of-the-infernal-coven', name: 'Boots of the Infernal Coven', wowItemId: 28670, dropType: 'Boss' },
      { itemId: 'drape-of-the-dark-reavers', name: 'Drape of the Dark Reavers', wowItemId: 28672, dropType: 'Boss', roles: ['Caster DPS'], notes: 'Holds Phase 2 best-in-slot status for several caster specs.' },
      { name: 'Formula: Enchant Weapon - Sunfire', wowItemId: 22560, dropType: 'Boss', needsVerification: true, notes: 'Real drop; not in the item catalogue, so it is listed by name only.' },
      { itemId: 'mantle-of-the-mind-flayer', name: 'Mantle of the Mind Flayer', wowItemId: 28726, dropType: 'Boss', roles: ['Caster DPS'] },
      { itemId: 'pauldrons-of-the-justice-seeker', name: 'Pauldrons of the Justice-Seeker', wowItemId: 28666, dropType: 'Boss' },
      { itemId: 'pendant-of-the-violet-eye', name: 'Pendant of the Violet Eye', wowItemId: 28727, dropType: 'Boss', roles: ['Healer'] },
      { itemId: 'rapscallion-boots', name: 'Rapscallion Boots', wowItemId: 28669, dropType: 'Boss' },
      { itemId: 'saberclaw-talisman', name: 'Saberclaw Talisman', wowItemId: 28674, dropType: 'Boss' },
      { itemId: 'shermanar-great-ring', name: 'Shermanar Great-Ring', wowItemId: 28675, dropType: 'Boss' },
      { itemId: 'steelspine-faceguard', name: 'Steelspine Faceguard', wowItemId: 28671, dropType: 'Boss' },
      { itemId: 'tirisfal-wand-of-ascendancy', name: 'Tirisfal Wand of Ascendancy', wowItemId: 28673, dropType: 'Boss' },
    ],
  },
  {
    id: 'netherspite',
    name: 'Netherspite',
    raidId: 'karazhan',
    encounterOrder: 8,
    optional: true,
    mechanics:
      'Three coloured beams shine from portals and each must be intercepted by a specific person: red for the tank (damage taken up, health drain), green for a healer (healing done up, mana drain), blue for a caster (damage done up, mana drain). Beam holders swap out before their stacking debuff becomes lethal. Every 60 seconds Netherspite banishes himself for 30 seconds and chases the raid with a Void Zone phase. Nobody who is not assigned to a beam should ever touch one.',
    roleNotes: [
      { role: 'Tank', note: 'Hold the red beam and rotate out before the stacking debuff outpaces your healers.' },
      { role: 'Healer', note: 'The green beam holder rotates on a timer; going too long converts a mana boost into a mana problem.' },
    ],
    loot: [
      { itemId: 'cowl-of-defiance', name: 'Cowl of Defiance', wowItemId: 28732, dropType: 'Boss', roles: ['Physical DPS'] },
      { itemId: 'earthblood-chestguard', name: 'Earthblood Chestguard', wowItemId: 28735, dropType: 'Boss' },
      { itemId: 'girdle-of-truth', name: 'Girdle of Truth', wowItemId: 28733, dropType: 'Boss' },
      { itemId: 'jewel-of-infinite-possibilities', name: 'Jewel of Infinite Possibilities', wowItemId: 28734, dropType: 'Boss', roles: ['Physical DPS'] },
      { itemId: 'mantle-of-abrahmis', name: 'Mantle of Abrahmis', wowItemId: 28743, dropType: 'Boss' },
      { itemId: 'mithril-band-of-the-unscarred', name: 'Mithril Band of the Unscarred', wowItemId: 28730, dropType: 'Boss' },
      { itemId: 'pantaloons-of-repentance', name: 'Pantaloons of Repentance', wowItemId: 28742, dropType: 'Boss' },
      { itemId: 'rip-flayer-leggings', name: 'Rip-Flayer Leggings', wowItemId: 28740, dropType: 'Boss' },
      { itemId: 'shining-chain-of-the-afterworld', name: 'Shining Chain of the Afterworld', wowItemId: 28731, dropType: 'Boss' },
      { itemId: 'skulkers-greaves', name: 'Skulker\'s Greaves', wowItemId: 28741, dropType: 'Boss' },
      { itemId: 'spiteblade', name: 'Spiteblade', wowItemId: 28729, dropType: 'Boss' },
      { itemId: 'the-night-watchman', name: 'The Night Watchman', wowItemId: 31333, dropType: 'Boss' },
      { itemId: 'uni-mind-headdress', name: 'Uni-Mind Headdress', wowItemId: 28744, dropType: 'Boss' },
    ],
  },
  {
    id: 'chess-event',
    name: 'Chess Event',
    raidId: 'karazhan',
    encounterOrder: 9,
    mechanics:
      'A scripted game of chess where each raider controls a piece by standing on it. There is no gear check and no wipe risk worth planning around — the loot is guaranteed. Kill the enemy king; healers should take the healer pieces and keep the friendly king topped up. It sits on the critical path to Prince Malchezaar, so it is never skipped.',
    loot: [
      { itemId: 'battlescar-boots', name: 'Battlescar Boots', wowItemId: 28747, dropType: 'Boss' },
      { itemId: 'bladed-shoulderpads-of-the-merciless', name: 'Bladed Shoulderpads of the Merciless', wowItemId: 28755, dropType: 'Boss' },
      { itemId: 'fiend-slayer-boots', name: 'Fiend Slayer Boots', wowItemId: 28746, dropType: 'Boss' },
      { itemId: 'forestlord-striders', name: 'Forestlord Striders', wowItemId: 28752, dropType: 'Boss' },
      { itemId: 'girdle-of-treachery', name: 'Girdle of Treachery', wowItemId: 28750, dropType: 'Boss' },
      { itemId: 'headdress-of-the-high-potentate', name: 'Headdress of the High Potentate', wowItemId: 28756, dropType: 'Boss' },
      { itemId: 'heart-flame-leggings', name: 'Heart-Flame Leggings', wowItemId: 28751, dropType: 'Boss' },
      { itemId: 'kings-defender', name: 'King\'s Defender', wowItemId: 28749, dropType: 'Boss', roles: ['Tank'] },
      { itemId: 'legplates-of-the-innocent', name: 'Legplates of the Innocent', wowItemId: 28748, dropType: 'Boss' },
      { itemId: 'mithril-chain-of-heroism', name: 'Mithril Chain of Heroism', wowItemId: 28745, dropType: 'Boss' },
      { itemId: 'ring-of-recurrence', name: 'Ring of Recurrence', wowItemId: 28753, dropType: 'Boss', roles: ['Caster DPS'] },
      { itemId: 'triptych-shield-of-the-ancients', name: 'Triptych Shield of the Ancients', wowItemId: 28754, dropType: 'Boss', roles: ['Tank'] },
    ],
  },
  {
    id: 'prince-malchezaar',
    name: 'Prince Malchezaar',
    raidId: 'karazhan',
    encounterOrder: 10,
    mechanics:
      'Three phases. Phase 1 is a tank-and-spank with Enfeeble, which drops five random players to 1 health for eight seconds — those players must not be hit by anything, so the raid spreads and healers stop panicking and just wait it out. At 60% he dual-wields and adds Shadow Word: Pain; at 30% he starts an Amplify Damage tank debuff and Enfeeble stops. Infernals rain down all fight and permanently deny floor space, which is the real enrage timer — the room runs out of safe ground.',
    roleNotes: [
      { role: 'Tank', note: 'Move the boss out of Infernal fire early; the room shrinks all fight and there is no space left at the end.' },
      { role: 'Healer', note: 'Do not heal Enfeebled players — heal the tank, and let the eight seconds run out.' },
    ],
    loot: [
      { itemId: 'adornment-of-stolen-souls', name: 'Adornment of Stolen Souls', wowItemId: 28762, dropType: 'Boss' },
      { itemId: 'farstrider-wildercloak', name: 'Farstrider Wildercloak', wowItemId: 28764, dropType: 'Boss' },
      { itemId: 'gorehowl', name: 'Gorehowl', wowItemId: 28773, dropType: 'Boss', roles: ['Physical DPS'] },
      { name: 'Helm of the Fallen Champion', wowItemId: 29760, dropType: 'Tier Token', needsVerification: true, notes: 'T4 helm token — Paladin, Priest, Warlock.' },
      { name: 'Helm of the Fallen Defender', wowItemId: 29761, dropType: 'Tier Token', needsVerification: true, notes: 'T4 helm token — Warrior, Priest, Druid.' },
      { name: 'Helm of the Fallen Hero', wowItemId: 29759, dropType: 'Tier Token', needsVerification: true, notes: 'T4 helm token — Hunter, Mage, Rogue, Shaman.' },
      { itemId: 'jade-ring-of-the-everliving', name: 'Jade Ring of the Everliving', wowItemId: 28763, dropType: 'Boss', roles: ['Healer'] },
      { itemId: 'lights-justice', name: 'Light\'s Justice', wowItemId: 28771, dropType: 'Boss' },
      { itemId: 'malchazeen', name: 'Malchazeen', wowItemId: 28768, dropType: 'Boss' },
      { itemId: 'nathrezim-mindblade', name: 'Nathrezim Mindblade', wowItemId: 28770, dropType: 'Boss', roles: ['Caster DPS'], notes: 'Remains a Phase 2 best-in-slot caster main hand for several specs.' },
      { itemId: 'ring-of-a-thousand-marks', name: 'Ring of a Thousand Marks', wowItemId: 28757, dropType: 'Boss', roles: ['Physical DPS'] },
      { itemId: 'ruby-drape-of-the-mysticant', name: 'Ruby Drape of the Mysticant', wowItemId: 28766, dropType: 'Boss' },
      { itemId: 'stainless-cloak-of-the-pure-hearted', name: 'Stainless Cloak of the Pure Hearted', wowItemId: 28765, dropType: 'Boss' },
      { itemId: 'sunfury-bow-of-the-phoenix', name: 'Sunfury Bow of the Phoenix', wowItemId: 28772, dropType: 'Boss', roles: ['Physical DPS'], notes: 'Sources place this on Prince Malchezaar in Karazhan, but the item catalog currently records it as Tempest Keep / Kael\'thas Sunstrider. The catalog entry needs correcting.' },
      { itemId: 'the-decapitator', name: 'The Decapitator', wowItemId: 28767, dropType: 'Boss', roles: ['Physical DPS'] },
    ],
  },
  {
    id: 'nightbane',
    name: 'Nightbane',
    raidId: 'karazhan',
    /*
     * After Prince, and that is deliberate rather than an accident of being optional. Nightbane is
     * summoned with the Blackened Urn rather than standing in the way, so a group reaches it when it
     * chooses — but every published clear order lists it last, and Prince is the last *required*
     * boss. Ordering it 11 says both things at once.
     */
    encounterOrder: 11,
    optional: true,
    mechanics:
      'Summoned on Medivh\'s Terrace with the Blackened Urn, which requires its own quest chain and Honored with The Violet Eye. He alternates a ground phase (Bellowing Roar fear, Charred Earth on the floor, a tank cleave) with an air phase where he rains Rain of Bones and spawns skeletons that must be AoE\'d down. Fear Ward or a Tremor Totem on the tank is close to mandatory. Phase 2 raiders come here specifically for the Blazing Signet, half of the Serpentshrine Cavern attunement.',
    roleNotes: [
      { role: 'Tank', note: 'Bellowing Roar fear will pull you off the platform — keep Fear Ward or a Tremor Totem up.' },
    ],
    loot: [
      { itemId: 'chestguard-of-the-conniver', name: 'Chestguard of the Conniver', wowItemId: 28601, dropType: 'Boss' },
      { itemId: 'dragonheart-flameshield', name: 'Dragonheart Flameshield', wowItemId: 28611, dropType: 'Boss', roles: ['Healer'] },
      { itemId: 'emberspur-talisman', name: 'Emberspur Talisman', wowItemId: 28609, dropType: 'Boss' },
      { itemId: 'ferocious-swift-kickers', name: 'Ferocious Swift-Kickers', wowItemId: 28610, dropType: 'Boss' },
      { itemId: 'ironstriders-of-urgency', name: 'Ironstriders of Urgency', wowItemId: 28608, dropType: 'Boss' },
      { itemId: 'nightstaff-of-the-everliving', name: 'Nightstaff of the Everliving', wowItemId: 28604, dropType: 'Boss' },
      { itemId: 'panzarthar-breastplate', name: 'Panzar\'Thar Breastplate', wowItemId: 28597, dropType: 'Boss' },
      { itemId: 'robe-of-the-elder-scribes', name: 'Robe of the Elder Scribes', wowItemId: 28602, dropType: 'Boss' },
      { itemId: 'scaled-breastplate-of-carnage', name: 'Scaled Breastplate of Carnage', wowItemId: 28599, dropType: 'Boss' },
      { itemId: 'shield-of-impenetrable-darkness', name: 'Shield of Impenetrable Darkness', wowItemId: 28606, dropType: 'Boss', roles: ['Tank'] },
      { itemId: 'stonebough-jerkin', name: 'Stonebough Jerkin', wowItemId: 28600, dropType: 'Boss' },
      { itemId: 'talisman-of-nightbane', name: 'Talisman of Nightbane', wowItemId: 28603, dropType: 'Boss', roles: ['Tank'] },
      { name: 'Blazing Signet', wowItemId: 31751, dropType: 'Quest Reward', notes: 'Quest item for \'The Cudgel of Kar\'desh\'. This is the reason Phase 2 groups still summon Nightbane.' },
    ],
  },
]
