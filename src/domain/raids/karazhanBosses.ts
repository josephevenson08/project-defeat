import type { RaidBoss } from './raidTypes'

/**
 * Karazhan is Phase 1 content, so only the drops that still matter to a Phase 2 raider are listed
 * here rather than the full loot table. Encounter order is the standard clear route; the tower is
 * only partly linear, and Illhoof, Aran, Netherspite, and Nightbane sit off the critical path.
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
      {
        itemId: 'gloves-of-dexterous-manipulation',
        name: 'Gloves of Dexterous Manipulation',
        dropType: 'Boss',
        roles: ['Physical DPS'],
      },
      { itemId: 'steelhawk-crossbow', name: 'Steelhawk Crossbow', dropType: 'Boss', roles: ['Physical DPS'] },
      { name: "Fiery Warhorse's Reins", dropType: 'Boss', needsVerification: true, notes: 'Mount, very low drop rate. Not in the item catalog.' },
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
      { itemId: 'edgewalker-longboots', name: 'Edgewalker Longboots', wowItemId: 28545, dropType: 'Boss', roles: ['Physical DPS'] },
      { name: 'Formula: Enchant Weapon - Mongoose', dropType: 'Boss', needsVerification: true, notes: 'Enchanting formula, still one of the top Phase 2 weapon enchants. Not in the item catalog.' },
      { itemId: 'moroes-lucky-pocket-watch', name: "Moroes' Lucky Pocket Watch", dropType: 'Boss', roles: ['Tank'] },
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
      { itemId: 'mitts-of-the-treemender', name: 'Mitts of the Treemender', dropType: 'Boss', roles: ['Healer'] },
      { itemId: 'totem-of-healing-rains', name: 'Totem of Healing Rains', dropType: 'Boss', roles: ['Healer'] },
      { itemId: 'shard-of-the-virtuous', name: 'Shard of the Virtuous', dropType: 'Boss', roles: ['Healer'] },
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
      { itemId: 'earthsoul-leggings', name: 'Earthsoul Leggings', dropType: 'Boss', roles: ['Healer'] },
      { itemId: 'ribbon-of-sacrifice', name: 'Ribbon of Sacrifice', dropType: 'Boss', roles: ['Healer'] },
      { itemId: 'wicked-witchs-hat', name: 'Wicked Witch\'s Hat', dropType: 'Boss', roles: ['Caster DPS'], needsVerification: true, notes: 'Wizard of Oz variant only.' },
      { itemId: 'masquerade-gown', name: 'Masquerade Gown', dropType: 'Boss', roles: ['Caster DPS', 'Healer'], needsVerification: true, notes: 'Romulo and Julianne variant only.' },
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
      { itemId: 'garonas-signet-ring', name: "Garona's Signet Ring", wowItemId: 28649, dropType: 'Boss', roles: ['Physical DPS'] },
      { name: 'Gloves of the Fallen Champion', dropType: 'Tier Token', notes: 'T4 gloves token — Paladin, Priest, Warlock.' },
      { name: 'Gloves of the Fallen Defender', dropType: 'Tier Token', notes: 'T4 gloves token — Warrior, Priest, Druid.' },
      { name: 'Gloves of the Fallen Hero', dropType: 'Tier Token', notes: 'T4 gloves token — Hunter, Mage, Rogue, Shaman.' },
      { itemId: 'voidheart-gloves', name: 'Voidheart Gloves', dropType: 'Tier Token', roles: ['Caster DPS'], notes: 'Warlock T4 gloves, redeemed from Gloves of the Fallen Champion.' },
      { itemId: 'staff-of-infinite-mysteries', name: 'Staff of Infinite Mysteries', dropType: 'Boss', roles: ['Tank'], needsVerification: true, notes: 'Feral druid tanking staff.' },
    ],
  },
  {
    id: 'terestian-illhoof',
    name: 'Terestian Illhoof',
    raidId: 'karazhan',
    optional: true,
    mechanics:
      'Kil\'rek, the imp pet, applies a stacking armour debuff to the tank and must be killed on each respawn. Illhoof chains a random player to a Demon Chain that drains their life; the chains have to be broken fast or the target dies. Continuous imp adds spawn from a portal and are handled with AoE. This is an off-the-critical-path boss most groups still kill for The Lightning Capacitor.',
    roleNotes: [
      { role: 'Physical DPS', note: 'Swap instantly to the Demon Chains when a player is sacrificed; that player dies otherwise.' },
    ],
    loot: [
      { itemId: 'the-lightning-capacitor', name: 'The Lightning Capacitor', wowItemId: 28785, dropType: 'Boss', roles: ['Caster DPS'], notes: 'Still a Phase 2 best-in-slot caster trinket for several specs, which is why Phase 2 groups keep killing this optional boss.' },
      { itemId: 'terestians-stranglestaff', name: "Terestian's Stranglestaff", dropType: 'Boss', roles: ['Tank'] },
      { name: 'Formula: Enchant Weapon - Soulfrost', dropType: 'Boss', needsVerification: true, notes: 'Enchanting formula. Not in the item catalog.' },
    ],
  },
  {
    id: 'shade-of-aran',
    name: 'Shade of Aran',
    raidId: 'karazhan',
    encounterOrder: 6,
    mechanics:
      'No threat table — Aran attacks whoever he likes, so there is no tank. Flame Wreath burns a ring on the floor and anyone who moves at all detonates it and likely wipes the raid; stop moving the instant it is cast. Blizzard sweeps the room and has to be walked away from, and Arcane Explosion is countered by running to the wall. At 40% he drains all raid mana and casts Elementals; at 20% he Pyroblasts everyone unless interrupted.',
    roleNotes: [
      { role: 'Caster DPS', note: 'Do not move during Flame Wreath, not even to dodge Blizzard — take the Blizzard damage instead.' },
      { role: 'Healer', note: 'Keep a mana potion or Innervate for the 40% Drain Mana; healing after it is otherwise impossible.' },
    ],
    loot: [
      { itemId: 'drape-of-the-dark-reavers', name: 'Drape of the Dark Reavers', wowItemId: 28672, dropType: 'Boss', roles: ['Caster DPS'], notes: 'Holds Phase 2 best-in-slot status for several caster specs.' },
      { itemId: 'pendant-of-the-violet-eye', name: 'Pendant of the Violet Eye', dropType: 'Boss', roles: ['Healer'] },
      { itemId: 'mantle-of-the-mind-flayer', name: 'Mantle of the Mind Flayer', dropType: 'Boss', roles: ['Caster DPS'] },
    ],
  },
  {
    id: 'netherspite',
    name: 'Netherspite',
    raidId: 'karazhan',
    optional: true,
    mechanics:
      'Three coloured beams shine from portals and each must be intercepted by a specific person: red for the tank (damage taken up, health drain), green for a healer (healing done up, mana drain), blue for a caster (damage done up, mana drain). Beam holders swap out before their stacking debuff becomes lethal. Every 60 seconds Netherspite banishes himself for 30 seconds and chases the raid with a Void Zone phase. Nobody who is not assigned to a beam should ever touch one.',
    roleNotes: [
      { role: 'Tank', note: 'Hold the red beam and rotate out before the stacking debuff outpaces your healers.' },
      { role: 'Healer', note: 'The green beam holder rotates on a timer; going too long converts a mana boost into a mana problem.' },
    ],
    loot: [
      { itemId: 'cowl-of-defiance', name: 'Cowl of Defiance', wowItemId: 28732, dropType: 'Boss', roles: ['Physical DPS'] },
      { itemId: 'jewel-of-infinite-possibilities', name: 'Jewel of Infinite Possibilities', dropType: 'Boss', roles: ['Physical DPS'] },
    ],
  },
  {
    id: 'chess-event',
    name: 'Chess Event',
    raidId: 'karazhan',
    encounterOrder: 7,
    mechanics:
      'A scripted game of chess where each raider controls a piece by standing on it. There is no gear check and no wipe risk worth planning around — the loot is guaranteed. Kill the enemy king; healers should take the healer pieces and keep the friendly king topped up. It sits on the critical path to Prince Malchezaar, so it is never skipped.',
    loot: [
      { itemId: 'ring-of-recurrence', name: 'Ring of Recurrence', dropType: 'Boss', roles: ['Caster DPS'] },
      { itemId: 'kings-defender', name: "King's Defender", dropType: 'Boss', roles: ['Tank'] },
      { itemId: 'triptych-shield-of-the-ancients', name: 'Triptych Shield of the Ancients', dropType: 'Boss', roles: ['Tank'] },
    ],
  },
  {
    id: 'prince-malchezaar',
    name: 'Prince Malchezaar',
    raidId: 'karazhan',
    encounterOrder: 8,
    mechanics:
      'Three phases. Phase 1 is a tank-and-spank with Enfeeble, which drops five random players to 1 health for eight seconds — those players must not be hit by anything, so the raid spreads and healers stop panicking and just wait it out. At 60% he dual-wields and adds Shadow Word: Pain; at 30% he starts an Amplify Damage tank debuff and Enfeeble stops. Infernals rain down all fight and permanently deny floor space, which is the real enrage timer — the room runs out of safe ground.',
    roleNotes: [
      { role: 'Tank', note: 'Move the boss out of Infernal fire early; the room shrinks all fight and there is no space left at the end.' },
      { role: 'Healer', note: 'Do not heal Enfeebled players — heal the tank, and let the eight seconds run out.' },
    ],
    loot: [
      { itemId: 'nathrezim-mindblade', name: 'Nathrezim Mindblade', wowItemId: 28770, dropType: 'Boss', roles: ['Caster DPS'], notes: 'Remains a Phase 2 best-in-slot caster main hand for several specs.' },
      { itemId: 'ring-of-a-thousand-marks', name: 'Ring of a Thousand Marks', wowItemId: 28757, dropType: 'Boss', roles: ['Physical DPS'] },
      { itemId: 'jade-ring-of-the-everliving', name: 'Jade Ring of the Everliving', dropType: 'Boss', roles: ['Healer'] },
      {
        itemId: 'sunfury-bow-of-the-phoenix',
        name: 'Sunfury Bow of the Phoenix',
        dropType: 'Boss',
        roles: ['Physical DPS'],
        needsVerification: true,
        notes: 'Sources place this on Prince Malchezaar in Karazhan, but the item catalog currently records it as Tempest Keep / Kael\'thas Sunstrider. The catalog entry needs correcting.',
      },
      { name: 'Helm of the Fallen Champion', dropType: 'Tier Token', notes: 'T4 helm token — Paladin, Priest, Warlock.' },
      { name: 'Helm of the Fallen Defender', dropType: 'Tier Token', notes: 'T4 helm token — Warrior, Priest, Druid.' },
      { name: 'Helm of the Fallen Hero', dropType: 'Tier Token', notes: 'T4 helm token — Hunter, Mage, Rogue, Shaman.' },
      { itemId: 'gorehowl', name: 'Gorehowl', dropType: 'Boss', roles: ['Physical DPS'] },
      { itemId: 'the-decapitator', name: 'The Decapitator', dropType: 'Boss', roles: ['Physical DPS'] },
    ],
  },
  {
    id: 'nightbane',
    name: 'Nightbane',
    raidId: 'karazhan',
    optional: true,
    mechanics:
      'Summoned on Medivh\'s Terrace with the Blackened Urn, which requires its own quest chain and Honored with The Violet Eye. He alternates a ground phase (Bellowing Roar fear, Charred Earth on the floor, a tank cleave) with an air phase where he rains Rain of Bones and spawns skeletons that must be AoE\'d down. Fear Ward or a Tremor Totem on the tank is close to mandatory. Phase 2 raiders come here specifically for the Blazing Signet, half of the Serpentshrine Cavern attunement.',
    roleNotes: [
      { role: 'Tank', note: 'Bellowing Roar fear will pull you off the platform — keep Fear Ward or a Tremor Totem up.' },
    ],
    loot: [
      { name: 'Blazing Signet', dropType: 'Quest Reward', notes: "Quest item for 'The Cudgel of Kar'desh'. This is the reason Phase 2 groups still summon Nightbane." },
      { itemId: 'talisman-of-nightbane', name: 'Talisman of Nightbane', dropType: 'Boss', roles: ['Tank'] },
      { itemId: 'dragonheart-flameshield', name: 'Dragonheart Flameshield', dropType: 'Boss', roles: ['Healer'] },
      { itemId: 'shield-of-impenetrable-darkness', name: 'Shield of Impenetrable Darkness', dropType: 'Boss', roles: ['Tank'] },
    ],
  },
]
