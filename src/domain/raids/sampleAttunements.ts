import type { AttunementChain } from './raidTypes'

/**
 * The attunement chains a Phase 2 player actually has to grind. Each is gated behind other
 * attunements — Karazhan for SSC, the Arcatraz key for TK, and Karazhan's own chain behind three
 * dungeon keys — which is why the prerequisites are listed separately from the steps. The steps
 * alone badly understate how long any of this takes.
 *
 * **Karazhan's chain was missing until 2026-08-23**, which was the conspicuous gap: it is the first
 * attunement every TBC character grinds, and Serpentshrine's own prerequisites already referred to
 * having done it. Its eight steps are each cited to the Wowhead quest id the wording was read from,
 * so a reader can check any line without trusting this file.
 *
 * Gruul's Lair and Magtheridon's Lair have no chains here because they have none in the game — both
 * open to any level 70 raid, which is why they are where a fresh 25-player group starts.
 *
 * Blizzard removed these attunements in patch 2.4 on previous Classic runs. They are required during
 * Phase 2, but the exact patch where they are dropped on Anniversary realms is flagged as unverified.
 */
export const sampleAttunements: readonly AttunementChain[] = [
  {
    id: 'karazhan-attunement',
    raidId: 'karazhan',
    name: "The Master's Key",
    summary:
      "Eight quests that cross two continents and four dungeons, and the longest attunement in Phase 2 by some distance. The quest chain itself is not the expensive part — three of its steps need dungeon keys or attunements you must already hold, and the last one is a full Black Morass clear where an escort NPC has to survive eighteen waves.",
    prerequisites: [
      'Level 70. Karazhan itself opens at 68, but the chain sends you through level-70 dungeons.',
      'The Shadow Labyrinth Key, from Talon King Ikiss in Sethekk Halls — needed for the first fragment.',
      'The Key to the Arcatraz, itself a quest chain, for the third fragment.',
      'Attunement to the Black Morass (the Caverns of Time chain through Old Hillsbrad), for the final step.',
      'A group for four level-70 dungeons: Shadow Labyrinth, The Steamvault, The Arcatraz and The Black Morass.',
    ],
    steps: [
      {
        order: 1,
        questName: 'Arcane Disturbances',
        title: 'Take two crystal readings under Karazhan',
        requirement:
          "Accept from Archmage Alturus at the foot of Karazhan's steps, then use the Violet Scrying Crystal at the Underground Well and the Underground Pond in the Master's Cellar and return to him.",
        location: 'Deadwind Pass',
        difficulty: 'Outdoor',
        notes: 'Wowhead quest 9824. Given alongside Restless Activity, and the cellar is the same trip, so they are done together rather than in sequence.',
      },
      {
        order: 2,
        questName: 'Restless Activity',
        title: 'Collect 10 Ghostly Essence',
        requirement:
          'Kill the ghosts in the same cellar until you have 10 Ghostly Essence, and hand them to Archmage Alturus.',
        location: 'Deadwind Pass',
        difficulty: 'Outdoor',
        notes: 'Wowhead quest 9825.',
      },
      {
        order: 3,
        questName: 'Contact from Dalaran',
        title: "Carry Alturus's Report to Dalaran",
        requirement: "Take Alturus's Report to Archmage Cedric, outside the Dalaran dome in the Alterac Mountains.",
        location: 'Alterac Mountains',
        difficulty: 'Outdoor',
        notes: 'Wowhead quest 9826. A long ride north through the Eastern Kingdoms, and the reason people run this chain with a mage or a hearthstone plan.',
      },
      {
        order: 4,
        questName: 'Khadgar',
        title: 'Report to Khadgar in Shattrath',
        requirement: "Take Cedric's reply through the Dark Portal to Khadgar, in the centre of Shattrath City.",
        location: 'Shattrath City (Terokkar Forest)',
        difficulty: 'Outdoor',
        notes: 'Wowhead quest 9829.',
      },
      {
        order: 5,
        questName: 'Entry Into Karazhan',
        title: 'Loot the First Key Fragment',
        requirement:
          'Clear Shadow Labyrinth to Murmur and take the First Key Fragment from the arcane container in his chamber, then return to Khadgar.',
        location: 'Shadow Labyrinth (Auchindoun, Terokkar Forest)',
        difficulty: 'Normal',
        notes: 'Wowhead quest 9831. Normal difficulty is enough for all three fragments — none of this chain needs Heroic.',
      },
      {
        order: 6,
        questName: 'The Second and Third Fragments',
        title: 'Loot the remaining two fragments',
        requirement:
          'Take the Second Key Fragment from an arcane container in Coilfang Reservoir — The Steamvault, in the water by Hydromancer Thespia — and the Third from an arcane container in Tempest Keep, on the upper floor of The Arcatraz. Return both to Khadgar.',
        location: 'The Steamvault (Zangarmarsh) and The Arcatraz (Netherstorm)',
        difficulty: 'Normal',
        notes:
          "Wowhead quest 9832, which words them as Khadgar's own hiding places: the second at the bottom of Serpent Lake before Coilfang drained it, the third in a Tempest Keep chamber that \"has become a prison\". The Arcatraz needs its key, which is why that is listed as a prerequisite rather than as part of this step.",
      },
      {
        order: 7,
        questName: "The Master's Touch",
        title: 'Have Medivh charge the key',
        requirement:
          "Take the Restored Apprentice's Key into the Black Morass and defend Medivh through all eighteen waves. He enables the key when the portal closes.",
        location: 'The Black Morass (Caverns of Time, Tanaris)',
        difficulty: 'Normal',
        notes:
          'Wowhead quest 9836. The step that fails groups: Medivh has to survive, so a wipe on the last waves costs the whole run rather than a corpse walk.',
      },
      {
        order: 8,
        questName: 'Return to Khadgar',
        title: "Turn in for The Master's Key",
        requirement:
          "Show the charged key to Khadgar in Shattrath City. He hands back The Master's Key, which is the permanent attunement.",
        location: 'Shattrath City (Terokkar Forest)',
        difficulty: 'Outdoor',
        notes: 'Wowhead quest 9837, rewarding item 24490.',
      },
    ],
    reward: "The Master's Key — permanent access to Karazhan, and the gate every later Phase 2 attunement is built on.",
    needsVerification: true,
    notes:
      'Quest names, ids, givers and objectives read from Wowhead\'s TBC Classic quest pages (9824, 9825, 9826, 9829, 9831, 9832, 9836, 9837) and cross-checked against the Icy Veins attunement guide, which agrees on the order and the fragment locations. Flagged because two things are not settled by those sources: the exact level the chain requires (Karazhan opens at 68, and the quests are listed as level 70), and whether Anniversary realms drop this attunement in 2.4 as previous Classic runs did.',
  },
  {
    id: 'serpentshrine-cavern-attunement',
    raidId: 'serpentshrine-cavern',
    name: "The Cudgel of Kar'desh",
    summary:
      'A short chain by TBC standards — two raid items and a walk back to a heroic dungeon — but it is expensive because both items come from Phase 1 raid bosses, one of which (Nightbane) needs its own quest chain and Violet Eye reputation before it can even be summoned.',
    prerequisites: [
      'Level 70.',
      'Revered with Cenarion Expedition, or a guild member who is, to obtain the Reservoir Key for Heroic Coilfang dungeons.',
      'A raid group able to kill Gruul the Dragonkiller (25-player).',
      'A Karazhan group with someone who holds the Blackened Urn, which requires Honored with The Violet Eye and the Medivh\'s Journal quest chain.',
    ],
    steps: [
      {
        order: 1,
        questName: "The Cudgel of Kar'desh",
        title: 'Pick up the quest from Skar\'this the Heretic',
        requirement:
          "Clear Heroic The Slave Pens as far as Mennu the Betrayer, then talk to the caged naga Skar'this the Heretic just past him and accept the quest.",
        location: 'The Slave Pens, Coilfang Reservoir (Zangarmarsh)',
        difficulty: 'Heroic',
        notes: 'Heroic difficulty specifically — Skar\'this is not present on normal.',
      },
      {
        order: 2,
        title: 'Loot the Earthen Signet',
        requirement: "Kill Gruul the Dragonkiller and loot the Earthen Signet from his corpse. It is a guaranteed drop, and every eligible raider gets one.",
        location: "Gruul's Lair (Blade's Edge Mountains)",
        difficulty: 'Raid',
      },
      {
        order: 3,
        title: 'Loot the Blazing Signet',
        requirement:
          "Summon Nightbane on Medivh's Terrace with the Blackened Urn and kill him, then loot the Blazing Signet. Nightbane is optional content, so most groups schedule this deliberately rather than stumbling into it.",
        location: 'Karazhan (Deadwind Pass)',
        difficulty: 'Raid',
        notes: 'The Blackened Urn itself comes from the Medivh\'s Journal chain, which needs Honored with The Violet Eye plus runs through Sethekk Halls and The Shattered Halls.',
      },
      {
        order: 4,
        questName: "The Cudgel of Kar'desh",
        title: "Turn in to Skar'this",
        requirement:
          "Return to Skar'this the Heretic in Heroic The Slave Pens with both signets and hand in the quest. He casts The Mark of Vashj on you, which is the permanent attunement.",
        location: 'The Slave Pens, Coilfang Reservoir (Zangarmarsh)',
        difficulty: 'Heroic',
      },
    ],
    reward: 'The Mark of Vashj — permanent access to Serpentshrine Cavern.',
    needsVerification: true,
    notes:
      'Step order and requirements are cross-checked against two guide sources. The one point not verified for Anniversary realms specifically is whether Blizzard has changed the Reservoir Key reputation requirement from its original Revered gate.',
  },
  {
    id: 'tempest-keep-attunement',
    raidId: 'tempest-keep',
    name: 'The Trial of the Naaru',
    summary:
      'The long one. Four heroic dungeon trials plus a Magtheridon kill, all gated behind the Cipher of Damnation questline in Shadowmoon Valley and the Arcatraz key. Budget several evenings, and note that three of the four trials are heroic-only, so the whole raid needs keys and gear before this can start.',
    prerequisites: [
      'Level 70.',
      'The Cipher of Damnation questline in Shadowmoon Valley completed — A\'dal will not offer the trials until it is done.',
      'Key to the Arcatraz, which itself requires the Shattered Halls, Steamvault, and Botanica/Mechanar key chains.',
      'Heroic keys for Hellfire Citadel, Coilfang Reservoir, Auchindoun, and Tempest Keep (Honored or better with the relevant factions).',
      'A raid group able to kill Magtheridon (25-player).',
    ],
    steps: [
      {
        order: 1,
        questName: 'The Tempest Key',
        title: "Speak to Khadgar and A'dal",
        requirement: "Take 'The Tempest Key' from Khadgar in Shattrath City, which sends you to A'dal to begin the trials.",
        location: 'Shattrath City (Terokkar Forest)',
        difficulty: 'Outdoor',
      },
      {
        order: 2,
        questName: 'Trial of the Naaru: Mercy',
        title: 'Save the prisoners in Shattered Halls',
        requirement:
          'Clear Heroic The Shattered Halls and kill Warchief Kargath Bladefist before the Shattered Hand Executioner kills any of the three caged prisoners. The timer starts on entry, so this is a speed run, not a careful clear.',
        location: 'The Shattered Halls, Hellfire Citadel',
        difficulty: 'Heroic',
      },
      {
        order: 3,
        questName: 'Trial of the Naaru: Strength',
        title: 'Two heroic final bosses',
        requirement: 'Kill Warlord Kalithresh in Heroic The Steamvault and Murmur in Heroic Shadow Labyrinth.',
        location: 'The Steamvault (Coilfang Reservoir) and Shadow Labyrinth (Auchindoun)',
        difficulty: 'Heroic',
      },
      {
        order: 4,
        questName: 'Trial of the Naaru: Tenacity',
        title: 'Keep Millhouse Manastorm alive',
        requirement:
          'Kill Harbinger Skyriss in Heroic The Arcatraz with Millhouse Manastorm still alive. He pulls aggro constantly and stands in everything, which is what makes this the trial groups fail most.',
        location: 'The Arcatraz, Tempest Keep',
        difficulty: 'Heroic',
      },
      {
        order: 5,
        questName: 'Trial of the Naaru: Magtheridon',
        title: 'Kill Magtheridon',
        requirement: "Kill Magtheridon in Magtheridon's Lair and return to A'dal.",
        location: "Magtheridon's Lair, Hellfire Citadel",
        difficulty: 'Raid',
        notes: 'Completing this step also grants the "Hand of A\'dal" title.',
      },
    ],
    reward: "The Tempest Key (access to The Eye), the Phoenix-fire Band, and the \"Hand of A'dal\" title.",
    needsVerification: true,
    notes:
      "Step order and objectives are cross-checked against two guide sources. Unverified for Anniversary realms: whether the Cipher of Damnation prerequisite is still enforced before A'dal offers the trials, and whether the Hand of A'dal title is still awarded on this patch.",
  },
]

export function getAttunementChainById(id: string): AttunementChain | undefined {
  return sampleAttunements.find((chain) => chain.id === id)
}

export function getAttunementChainForRaid(raidId: string): AttunementChain | undefined {
  return sampleAttunements.find((chain) => chain.raidId === raidId)
}
