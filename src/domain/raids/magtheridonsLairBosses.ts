import type { RaidBoss } from './raidTypes'

/** A single-encounter raid. Phase 2 relevance is the T4 chest token and the Tempest Keep attunement credit. */
export const magtheridonsLairBosses: readonly RaidBoss[] = [
  {
    id: 'magtheridon',
    name: 'Magtheridon',
    raidId: 'magtheridons-lair',
    encounterOrder: 1,
    mechanics:
      'The fight opens against five Hellfire Channelers keeping Magtheridon banished; they all aggro at once, heal each other with Dark Mending, and summon Burning Abyssals that have to be banished or feared off the healers. Magtheridon frees himself after two minutes regardless, so the Channelers are a soft timer rather than a hard gate. Once he is up, Blast Nova is a raid-wiping cast that must be interrupted by five players clicking the Manticron Cubes simultaneously — each clicker gets a three-minute Mind Exhaustion debuff, so four separate groups of five have to be assigned in advance. At 30% the ceiling collapses and Debris stuns and damages the raid on a repeating timer.',
    roleNotes: [
      { role: 'Tank', note: 'Quake knocks the raid back and Cleave hits everything in front — keep him pointed away and re-establish position after each Quake.' },
      { role: 'Caster DPS', note: 'Warlocks banish the Burning Abyssals during the Channeler phase; interrupt Dark Mending on the Channelers.' },
      { role: 'Healer', note: 'Cube clickers take heavy damage while channelling and are the most likely deaths in the fight.' },
    ],
    loot: [
      { itemId: 'aegis-of-the-vindicator', name: 'Aegis of the Vindicator', wowItemId: 29458, dropType: 'Boss', roles: ['Tank'] },
      { name: 'Chestguard of the Fallen Champion', wowItemId: 29754, dropType: 'Tier Token', needsVerification: true, notes: 'T4 chest token — Paladin, Priest, Warlock.' },
      { name: 'Chestguard of the Fallen Defender', wowItemId: 29753, dropType: 'Tier Token', needsVerification: true, notes: 'T4 chest token — Warrior, Priest, Druid.' },
      { name: 'Chestguard of the Fallen Hero', wowItemId: 29755, dropType: 'Tier Token', needsVerification: true, notes: 'T4 chest token — Hunter, Mage, Rogue, Shaman.' },
      { itemId: 'cloak-of-the-pit-stalker', name: 'Cloak of the Pit Stalker', wowItemId: 28777, dropType: 'Boss', roles: ['Physical DPS'] },
      { itemId: 'crystalheart-pulse-staff', name: 'Crystalheart Pulse-Staff', wowItemId: 28782, dropType: 'Boss', roles: ['Healer'] },
      { itemId: 'eredar-wand-of-obliteration', name: 'Eredar Wand of Obliteration', wowItemId: 28783, dropType: 'Boss', roles: ['Caster DPS'] },
      { itemId: 'eye-of-magtheridon', name: 'Eye of Magtheridon', wowItemId: 28789, dropType: 'Boss', roles: ['Caster DPS'] },
      { itemId: 'girdle-of-the-endless-pit', name: 'Girdle of the Endless Pit', wowItemId: 28779, dropType: 'Boss', roles: ['Tank'] },
      { itemId: 'glaive-of-the-pit', name: 'Glaive of the Pit', wowItemId: 28774, dropType: 'Boss', roles: ['Physical DPS'] },
      { itemId: 'karaborian-talisman', name: 'Karaborian Talisman', wowItemId: 28781, dropType: 'Boss', roles: ['Physical DPS'] },
      { itemId: 'liars-tongue-gloves', name: 'Liar\'s Tongue Gloves', wowItemId: 28776, dropType: 'Boss', roles: ['Physical DPS'] },
      { name: 'Magtheridon\'s Head', wowItemId: 32385, dropType: 'Quest Reward', needsVerification: true, notes: 'Raid-wide quest item turned in for a reputation reward and a necklace choice. Alliance turn-in is 32385, Horde 32386.' },
      { name: 'Magtheridon\'s Head', wowItemId: 32386, dropType: 'Quest Reward', needsVerification: true, notes: 'Raid-wide quest item turned in for a reputation reward and a necklace choice. Alliance turn-in is 32385, Horde 32386.' },
      { name: 'Pit Lord\'s Satchel', wowItemId: 34845, dropType: 'Boss', needsVerification: true, notes: 'Real drop; not in the item catalogue, so it is listed by name only.' },
      { itemId: 'soul-eaters-handwraps', name: 'Soul-Eater\'s Handwraps', wowItemId: 28780, dropType: 'Boss', roles: ['Caster DPS'] },
      { itemId: 'terror-pit-girdle', name: 'Terror Pit Girdle', wowItemId: 28778, dropType: 'Boss', roles: ['Physical DPS'] },
      { itemId: 'thundering-greathelm', name: 'Thundering Greathelm', wowItemId: 28775, dropType: 'Boss', roles: ['Tank'] },
      { itemId: 'breastplate-of-malorne', name: 'Breastplate of Malorne', dropType: 'Tier Token', roles: ['Tank', 'Physical DPS'], notes: 'Druid T4 chest, redeemed from Chestguard of the Fallen Defender.' },
      { itemId: 'justicar-chestguard', name: 'Justicar Chestguard', dropType: 'Tier Token', roles: ['Tank'], notes: 'Paladin T4 chest, redeemed from Chestguard of the Fallen Champion.' },
    ],
  },
]
