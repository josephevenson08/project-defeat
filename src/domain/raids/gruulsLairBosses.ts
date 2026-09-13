import type { RaidBoss } from './raidTypes'

/**
 * Two encounters, both still on the Phase 2 schedule: Gruul gates the Serpentshrine Cavern
 * attunement via the Earthen Signet, and both bosses hand out T4 tokens for fresh 25-player raiders.
 */
export const gruulsLairBosses: readonly RaidBoss[] = [
  {
    id: 'high-king-maulgar',
    name: 'High King Maulgar',
    raidId: 'gruuls-lair',
    encounterOrder: 1,
    mechanics:
      'A five-target pull: Maulgar plus four ogre lieutenants, each of which needs its own tank or controller assigned before the pull. Blindeye the Seer heals the group and dies first under an interrupt rotation; Olm the Summoner spawns Wild Felhunters that must be banished or enslaved; Krosh Firehand needs a high-stamina mage to spell-steal his Blast Shield and tank him at range; Kiggler the Crazed is kited by ranged only. Maulgar himself Whirlwinds and, below 50%, Charges and Fears — so he is tanked with his back to a wall.',
    roleNotes: [
      { role: 'Tank', note: 'Maulgar goes back-to-wall so his 50% Charge cannot fling him into the raid.' },
      { role: 'Caster DPS', note: 'A mage tanks Krosh Firehand and spell-steals his Blast Shield; a warlock banishes the Olm felhunters.' },
      { role: 'Healer', note: 'Five separate tanks means five separate healing assignments — do not float.' },
    ],
    loot: [
      { itemId: 'belt-of-divine-inspiration', name: 'Belt of Divine Inspiration', wowItemId: 28799, dropType: 'Boss', roles: ['Healer'] },
      { itemId: 'bladespire-warbands', name: 'Bladespire Warbands', wowItemId: 28795, dropType: 'Boss', roles: ['Physical DPS'] },
      { itemId: 'brute-cloak-of-the-ogre-magi', name: 'Brute Cloak of the Ogre-Magi', wowItemId: 28797, dropType: 'Boss', roles: ['Caster DPS'] },
      { itemId: 'hammer-of-the-naaru', name: 'Hammer of the Naaru', wowItemId: 28800, dropType: 'Boss', roles: ['Healer'] },
      { itemId: 'malefic-mask-of-the-shadows', name: 'Malefic Mask of the Shadows', wowItemId: 28796, dropType: 'Boss', roles: ['Physical DPS'] },
      { itemId: 'maulgars-warhelm', name: 'Maulgar\'s Warhelm', wowItemId: 28801, dropType: 'Boss', roles: ['Physical DPS'] },
      { name: 'Pauldrons of the Fallen Champion', wowItemId: 29763, dropType: 'Tier Token', needsVerification: true, notes: 'T4 shoulder token — Paladin, Priest, Warlock.' },
      { name: 'Pauldrons of the Fallen Defender', wowItemId: 29764, dropType: 'Tier Token', needsVerification: true, notes: 'T4 shoulder token — Warrior, Priest, Druid.' },
      { name: 'Pauldrons of the Fallen Hero', wowItemId: 29762, dropType: 'Tier Token', needsVerification: true, notes: 'T4 shoulder token — Hunter, Mage, Rogue, Shaman.' },
      { itemId: 'cyclone-shoulderguards', name: 'Cyclone Shoulderguards', dropType: 'Tier Token', roles: ['Physical DPS'], notes: 'Shaman T4 shoulders, redeemed from Pauldrons of the Fallen Hero.' },
      { itemId: 'justicar-shoulderguards', name: 'Justicar Shoulderguards', dropType: 'Tier Token', roles: ['Tank'], notes: 'Paladin T4 shoulders, redeemed from Pauldrons of the Fallen Champion.' },
      { itemId: 'mantle-of-malorne', name: 'Mantle of Malorne', dropType: 'Tier Token', roles: ['Tank', 'Physical DPS'], notes: 'Druid T4 shoulders, redeemed from Pauldrons of the Fallen Defender.' },
      { itemId: 'voidheart-mantle', name: 'Voidheart Mantle', dropType: 'Tier Token', roles: ['Caster DPS'], notes: 'Warlock T4 shoulders, redeemed from Pauldrons of the Fallen Champion.' },
    ],
  },
  {
    id: 'gruul-the-dragonkiller',
    name: 'Gruul the Dragonkiller',
    raidId: 'gruuls-lair',
    encounterOrder: 2,
    mechanics:
      'Growth stacks every 30 seconds and permanently raises his damage and size, which makes this a hard damage race with no soft landing. Ground Slam knocks the raid into the air and applies stacking Grow; at five stacks players are Stoned in place and Shatter goes off, dealing damage split by how close players are to each other — so the raid spreads wide on every Ground Slam. Cave In drops rubble on random spots that must be walked out of, and Hurtful Strike hits the second-highest-threat player in melee, so an off-tank stands beside the main tank.',
    roleNotes: [
      { role: 'Tank', note: 'Keep an off-tank second on threat in melee range to eat Hurtful Strike.' },
      { role: 'Physical DPS', note: 'Spread out permanently. Shatter damage scales with how many people are near you.' },
      { role: 'Healer', note: 'Growth makes every tank hit bigger than the last; the fight has no plateau, it only gets worse.' },
    ],
    loot: [
      { itemId: 'aldori-legacy-defender', name: 'Aldori Legacy Defender', wowItemId: 28825, dropType: 'Boss', roles: ['Tank'] },
      { itemId: 'axe-of-the-gronn-lords', name: 'Axe of the Gronn Lords', wowItemId: 28794, dropType: 'Boss', roles: ['Physical DPS'] },
      { itemId: 'bloodmaw-magus-blade', name: 'Bloodmaw Magus-Blade', wowItemId: 28802, dropType: 'Boss', roles: ['Caster DPS'] },
      { itemId: 'collar-of-chogall', name: 'Collar of Cho\'gall', wowItemId: 28804, dropType: 'Boss', roles: ['Caster DPS'] },
      { itemId: 'cowl-of-natures-breath', name: 'Cowl of Nature\'s Breath', wowItemId: 28803, dropType: 'Boss', roles: ['Caster DPS'] },
      { itemId: 'dragonspine-trophy', name: 'Dragonspine Trophy', wowItemId: 28830, dropType: 'Boss', roles: ['Physical DPS'], notes: 'Holds Phase 2 best-in-slot status for most physical DPS specs — this T4 trinket outlives most of T5.' },
      { itemId: 'eye-of-gruul', name: 'Eye of Gruul', wowItemId: 28823, dropType: 'Boss', roles: ['Healer'] },
      { itemId: 'gauntlets-of-martial-perfection', name: 'Gauntlets of Martial Perfection', wowItemId: 28824, dropType: 'Boss', roles: ['Physical DPS'] },
      { itemId: 'gauntlets-of-the-dragonslayer', name: 'Gauntlets of the Dragonslayer', wowItemId: 28827, dropType: 'Boss', roles: ['Tank'] },
      { itemId: 'gronn-stitched-girdle', name: 'Gronn-Stitched Girdle', wowItemId: 28828, dropType: 'Boss', roles: ['Physical DPS'] },
      { name: 'Leggings of the Fallen Champion', wowItemId: 29766, dropType: 'Tier Token', needsVerification: true, notes: 'T4 leg token — Paladin, Priest, Warlock.' },
      { name: 'Leggings of the Fallen Defender', wowItemId: 29767, dropType: 'Tier Token', needsVerification: true, notes: 'T4 leg token — Warrior, Priest, Druid.' },
      { name: 'Leggings of the Fallen Hero', wowItemId: 29765, dropType: 'Tier Token', needsVerification: true, notes: 'T4 leg token — Hunter, Mage, Rogue, Shaman.' },
      { itemId: 'shuriken-of-negation', name: 'Shuriken of Negation', wowItemId: 28826, dropType: 'Boss' },
      { itemId: 'teeth-of-gruul', name: 'Teeth of Gruul', wowItemId: 28822, dropType: 'Boss', roles: ['Physical DPS'] },
      { itemId: 'windshear-boots', name: 'Windshear Boots', wowItemId: 28810, dropType: 'Boss', roles: ['Physical DPS'] },
      { name: 'Earthen Signet', wowItemId: 31750, dropType: 'Quest Reward', notes: 'Quest item for \'The Cudgel of Kar\'desh\'. Half of the Serpentshrine Cavern attunement, and the main reason Phase 2 raids still clear Gruul\'s Lair.' },
    ],
  },
]
