import type { Raid } from './raidTypes'

/**
 * The five raids a Phase 2 player actually runs. Karazhan, Gruul's Lair, and Magtheridon's Lair are
 * Phase 1 content but stay in the weekly rotation because they gate the SSC attunement, hand out T4
 * for fresh raiders, and still hold a handful of Phase 2 best-in-slot items.
 */
export const sampleRaids: readonly Raid[] = [
  {
    id: 'karazhan',
    name: 'Karazhan',
    instanceNames: ['Karazhan'],
    tier: 'T4',
    playerSize: 10,
    phase: 1,
    zone: 'Deadwind Pass',
    location: "The tower at the south end of Deadwind Pass, between Duskwood and the Swamp of Sorrows. Fly to Darkshire or use a warlock summon; there is no flight point at the tower itself.",
    attunement: "Requires 'The Master's Key' — a long chain ending in a Black Morass run. Nightbane additionally needs Honored with The Violet Eye and the Blackened Urn.",
    resetDays: 7,
    description:
      "The 10-player T4 raid and still the backbone of a Phase 2 roster: it gears alts and recruits fast, it is the only source of several Phase 2 BiS items (Nathrezim Mindblade, Drape of the Dark Reavers, The Lightning Capacitor), and Nightbane drops the Blazing Signet needed for the Serpentshrine Cavern attunement. A geared group clears the whole tower in two to three hours; the critical path is Moroes → Opera → The Curator → Chess → Prince Malchezaar, with Attumen, Maiden, Illhoof, Aran, Netherspite, and Nightbane hanging off it.",
    notableTrashLoot: [
      {
        itemId: 'ring-of-unrelenting-storms',
        name: 'Ring of Unrelenting Storms',
        wowItemId: 30667,
        dropType: 'Trash',
        roles: ['Caster DPS'],
        notes: 'Drops from Spectral Charger trash rather than a boss; still a common Phase 2 caster ring for people short on raid rings.',
      },
      {
        itemId: 'ritssyns-lost-pendant',
        name: "Ritssyn's Lost Pendant",
        wowItemId: 30666,
        dropType: 'Trash',
        roles: ['Caster DPS'],
        notes: 'Spectral Charger trash drop. Rare, and the mob itself is a rare spawn, so it cannot be farmed reliably.',
      },
    ],
  },
  {
    id: 'gruuls-lair',
    name: "Gruul's Lair",
    instanceNames: ["Gruul's Lair"],
    tier: 'T4',
    playerSize: 25,
    phase: 1,
    zone: "Blade's Edge Mountains",
    location: "Gruul's Lair sits inside the Blade's Edge Mountains cliffs north-west of Evergrove, sharing the approach with the ogre stronghold of Bladespire Hold.",
    attunement: 'None. Any level 70 can walk in.',
    resetDays: 7,
    description:
      'A two-boss 25-player T4 raid that most Phase 2 groups clear in under an hour, and the entry point for 25-player raiding. It hands out T4 shoulder and leg tokens, the still-excellent Dragonspine Trophy, and — critically for Phase 2 — the Earthen Signet, one of the two items required for the Serpentshrine Cavern attunement. High King Maulgar is a five-target crowd-control check that punishes bad assignments; Gruul is a pure gear and positioning check.',
  },
  {
    id: 'magtheridons-lair',
    name: "Magtheridon's Lair",
    instanceNames: ["Magtheridon's Lair"],
    tier: 'T4',
    playerSize: 25,
    phase: 1,
    zone: 'Hellfire Peninsula',
    location: 'The lowest wing of Hellfire Citadel in Hellfire Peninsula, sharing an entrance courtyard with Hellfire Ramparts, The Blood Furnace, and The Shattered Halls.',
    attunement: 'None for entry. Killing Magtheridon completes the final step of the Tempest Keep attunement chain.',
    resetDays: 7,
    description:
      'A single-encounter 25-player T4 raid, and the last gate on the road to Tempest Keep. It is short, but it is the most coordination-dependent T4 fight: it needs five separate groups of five assigned to the Manticron Cubes, plus interrupt and banish rotations on the Hellfire Channelers. Phase 2 raiders keep it on the schedule for the T4 chest token, the Eye of Magtheridon trinket, and the attunement credit.',
  },
  {
    id: 'serpentshrine-cavern',
    name: 'Serpentshrine Cavern',
    instanceNames: ['Serpentshrine Cavern'],
    tier: 'T5',
    playerSize: 25,
    phase: 2,
    zone: 'Zangarmarsh',
    location: 'Inside Coilfang Reservoir in central Zangarmarsh — swim to the drainage pipe in the middle of the reservoir; the raid portal is separate from the Slave Pens / Underbog / Steamvault entrances.',
    attunement: "Requires 'The Cudgel of Kar'desh' (the Mark of Vashj). Also needs a Coilfang Reservoir key for the Heroic Slave Pens step.",
    attunementChainId: 'serpentshrine-cavern-attunement',
    resetDays: 7,
    description:
      'One of the two headline Phase 2 raids, and the T5 helm, glove, and leg token source. The first five bosses can be killed in any order and all five must die before the ramp to Lady Vashj opens. It is a resistance-gear raid: Hydross needs a frost-resistance and a nature-resistance tank set, Leotheras wants a fire-resistance demon tank, and Lady Vashj is a three-phase execution fight that separates progressed guilds from everyone else. The usual order — Hydross, Lurker, Leotheras, Karathress, Morogrim — front-loads the easy loot.',
    notableTrashLoot: [
      {
        itemId: 'pendant-of-the-perilous',
        name: 'Pendant of the Perilous',
        wowItemId: 30022,
        dropType: 'Trash',
        roles: ['Physical DPS'],
        notes: "Drops from Vashj'ir Honor Guard trash, not a boss.",
      },
      {
        itemId: 'boots-of-courage-unending',
        name: 'Boots of Courage Unending',
        dropType: 'Trash',
        roles: ['Healer'],
        needsVerification: true,
        notes: 'Sources agree this is a Serpentshrine Cavern trash drop but disagree on which trash mob; treat the exact source as unconfirmed.',
      },
    ],
  },
  {
    id: 'tempest-keep',
    name: 'Tempest Keep: The Eye',
    instanceNames: ['Tempest Keep', 'The Eye'],
    tier: 'T5',
    playerSize: 25,
    phase: 2,
    zone: 'Netherstorm',
    location: 'The central satellite of the Tempest Keep structure in western Netherstorm. The Eye is the middle wing; The Arcatraz, The Botanica, and The Mechanar are the three outer wings.',
    attunement: "Requires 'The Tempest Key' from the Trial of the Naaru chain, which ends on a Magtheridon kill.",
    attunementChainId: 'tempest-keep-attunement',
    resetDays: 7,
    description:
      'The other headline Phase 2 raid and the T5 shoulder and chest token source. Only four bosses, but the difficulty curve is brutal at the end: Void Reaver is a famously free loot piñata that gears a raid quickly, Al\'ar and Solarian are moderate, and Kael\'thas Sunstrider is a 20-plus-minute five-phase encounter that was the hardest fight in the game at this point in the expansion. Kael also drops the only item level 141 weapons in the phase and the Ashes of Al\'ar mount.',
    notableTrashLoot: [
      {
        itemId: 'girdle-of-fallen-stars',
        name: 'Girdle of Fallen Stars',
        wowItemId: 30030,
        dropType: 'Trash',
        roles: ['Caster DPS', 'Healer'],
        notes: 'Bloodwarder Legionnaire trash drop inside The Eye, so it can be farmed without killing a boss.',
      },
    ],
  },
]

export function getRaidById(id: string): Raid | undefined {
  return sampleRaids.find((raid) => raid.id === id)
}

/** Resolves the raid an item catalog / BiS `instance` string refers to, tolerating the app's mixed spellings. */
export function getRaidByInstanceName(instanceName: string): Raid | undefined {
  return sampleRaids.find((raid) => raid.instanceNames.includes(instanceName))
}
