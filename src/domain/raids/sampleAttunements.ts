import type { AttunementChain } from './raidTypes'

/**
 * The two attunement chains a Phase 2 player actually has to grind. Both are gated behind other
 * attunements (Karazhan for SSC, the Arcatraz key for TK), which is why the prerequisites are listed
 * separately from the steps — the steps alone badly understate how long this takes.
 *
 * Blizzard removed these attunements in patch 2.4 on previous Classic runs. They are required during
 * Phase 2, but the exact patch where they are dropped on Anniversary realms is flagged as unverified.
 */
export const sampleAttunements: readonly AttunementChain[] = [
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
