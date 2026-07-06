import type { MaterialFarmSpot, Profession } from './professionTypes'

/**
 * Raw material farm spots for the four gathering professions, by skill range.
 * Outland zone recommendations follow the standard TBC leveling curve:
 * Hellfire Peninsula (58-61) -> Zangarmarsh (60-63) -> Terokkar Forest (62-65) ->
 * Nagrand / Blade's Edge Mountains (64-68) -> Netherstorm / Shadowmoon Valley (67-70).
 */

const miningFarmSpots: readonly MaterialFarmSpot[] = [
  {
    material: 'Copper Ore',
    skillRange: [1, 100],
    zones: ['Elwynn Forest', 'Dun Morogh', 'Durotar', 'Mulgore', 'any level 1-10 starting zone'],
    recommendedCharacterLevel: '1-15',
  },
  {
    material: 'Tin Ore',
    skillRange: [65, 125],
    zones: ['Westfall', 'Loch Modan', 'The Barrens', 'Silverpine Forest'],
    recommendedCharacterLevel: '10-20',
  },
  {
    material: 'Silver Ore',
    skillRange: [75, 125],
    zones: ['Found alongside Tin in the same low-to-mid zones (Westfall, Loch Modan, The Barrens)'],
    recommendedCharacterLevel: '10-20',
  },
  {
    material: 'Iron Ore',
    skillRange: [125, 225],
    zones: ['Redridge Mountains', 'Duskwood', 'Stonetalon Mountains', 'Arathi Highlands', 'Hillsbrad Foothills'],
    recommendedCharacterLevel: '20-35',
  },
  {
    material: 'Gold Ore',
    skillRange: [155, 255],
    zones: ['Found alongside Iron/Mithril in mid-level zones (Arathi Highlands, Hillsbrad Foothills, Thousand Needles)'],
    recommendedCharacterLevel: '20-40',
    needsVerification: true,
    notes: 'Gold Ore is a comparatively rare secondary drop from Iron/Mithril-tier deposits rather than its own dedicated node type; exact skill window is approximate.',
  },
  {
    material: 'Mithril Ore',
    skillRange: [175, 275],
    zones: ['Thousand Needles', 'Tanaris', 'Badlands', 'Swamp of Sorrows', 'Feralas'],
    recommendedCharacterLevel: '35-50',
  },
  {
    material: 'Truesilver Ore',
    skillRange: [230, 330],
    zones: ['Found alongside Mithril/Thorium in mid-to-high zones (Tanaris, Un\'Goro Crater, Felwood)'],
    recommendedCharacterLevel: '45-55',
  },
  {
    material: 'Thorium Ore (incl. Rich Thorium Vein at 275+)',
    skillRange: [245, 375],
    zones: ["Un'Goro Crater", 'Silithus', 'Felwood', 'Blasted Lands', 'Winterspring', 'Eastern Plaguelands'],
    recommendedCharacterLevel: '48-60',
  },
  {
    material: 'Fel Iron Ore',
    skillRange: [300, 375],
    zones: ['All Outland zones, most densely in Hellfire Peninsula and Zangarmarsh'],
    recommendedCharacterLevel: '58-63',
  },
  {
    material: 'Adamantite Ore (incl. Rich Adamantite Vein at 350+)',
    skillRange: [325, 375],
    zones: ['All Outland zones except Hellfire Peninsula; especially Zangarmarsh, Terokkar Forest, Nagrand'],
    recommendedCharacterLevel: '60-67',
  },
  {
    material: 'Khorium Ore',
    skillRange: [375, 375],
    zones: ['Rare secondary spawn from Adamantite deposits in all Outland zones; most reliably farmed in Nagrand, Blade\'s Edge Mountains, and Netherstorm'],
    recommendedCharacterLevel: '64-70',
    needsVerification: true,
    notes: 'Khorium is a low-probability alternate spawn on Adamantite nodes rather than a guaranteed find; farming time-to-node is much higher than other ores.',
  },
]

const herbalismFarmSpots: readonly MaterialFarmSpot[] = [
  {
    material: 'Peacebloom / Silverleaf / Earthroot',
    skillRange: [1, 100],
    zones: ['Elwynn Forest', 'Durotar', 'Mulgore', 'any level 1-10 starting zone'],
    recommendedCharacterLevel: '1-15',
  },
  {
    material: 'Mageroyal / Briarthorn / Stranglekelp',
    skillRange: [50, 125],
    zones: ['Westfall', 'Loch Modan', 'The Barrens', 'Stranglethorn Vale (coastal)'],
    recommendedCharacterLevel: '10-25',
  },
  {
    material: 'Bruiseweed / Wild Steelbloom / Kingsblood',
    skillRange: [100, 175],
    zones: ['Redridge Mountains', 'Duskwood', 'Ashenvale', 'Hillsbrad Foothills'],
    recommendedCharacterLevel: '20-35',
  },
  {
    material: "Liferoot / Fadeleaf / Goldthorn",
    skillRange: [150, 210],
    zones: ['Stonetalon Mountains', 'Arathi Highlands', 'Thousand Needles', 'Desolace'],
    recommendedCharacterLevel: '25-40',
  },
  {
    material: 'Khadgar\'s Whisker / Wintersbite / Sungrass',
    skillRange: [185, 250],
    zones: ['Tanaris', 'Feralas', 'Swamp of Sorrows', 'Dustwallow Marsh'],
    recommendedCharacterLevel: '38-48',
  },
  {
    material: "Blindweed / Ghost Mushroom / Gromsblood",
    skillRange: [230, 300],
    zones: ["Un'Goro Crater", 'Felwood', 'Swamp of Sorrows'],
    recommendedCharacterLevel: '48-55',
  },
  {
    material: 'Golden Sansam / Dreamfoil / Mountain Silversage',
    skillRange: [230, 300],
    zones: ["Un'Goro Crater", 'Winterspring', 'Silithus', 'Eastern Plaguelands'],
    recommendedCharacterLevel: '50-60',
  },
  {
    material: 'Sorrowmoss / Icecap / Black Lotus (rare)',
    skillRange: [260, 300],
    zones: ['Eastern Plaguelands', 'Winterspring', 'various high-level zones (Black Lotus is a rare spawn anywhere high-level herbs grow)'],
    recommendedCharacterLevel: '55-60',
  },
  {
    material: 'Felweed',
    skillRange: [300, 375],
    zones: ['All Outland zones, most densely in Hellfire Peninsula'],
    recommendedCharacterLevel: '58-63',
  },
  {
    material: 'Dreaming Glory',
    skillRange: [315, 375],
    zones: ['Nagrand', "Blade's Edge Mountains", 'rocky outcroppings across Outland'],
    recommendedCharacterLevel: '64-68',
  },
  {
    material: 'Terocone',
    skillRange: [325, 375],
    zones: ['Terokkar Forest (very dense)'],
    recommendedCharacterLevel: '62-65',
  },
  {
    material: 'Ragveil',
    skillRange: [325, 375],
    zones: ['Zangarmarsh (swampy ground)'],
    recommendedCharacterLevel: '60-63',
  },
  {
    material: 'Nightmare Vine',
    skillRange: [325, 375],
    zones: ['Shadowmoon Valley', 'pockets of Hellfire Peninsula'],
    recommendedCharacterLevel: '67-70',
  },
  {
    material: 'Ancient Lichen',
    skillRange: [325, 375],
    zones: ['Inside Coilfang Reservoir and Auchindoun dungeon instances only'],
    recommendedCharacterLevel: '62-70',
    needsVerification: true,
    notes: 'Instance-only node; not farmable in open world.',
  },
  {
    material: 'Netherbloom',
    skillRange: [350, 375],
    zones: ['Netherstorm (only spawns here)'],
    recommendedCharacterLevel: '67-70',
  },
  {
    material: 'Mana Thistle',
    skillRange: [350, 375],
    zones: ['Netherstorm', 'Terokkar Forest (rare spawn)'],
    recommendedCharacterLevel: '67-70',
    needsVerification: true,
    notes: 'Rare/low-density spawn; exact zone split between Netherstorm and Terokkar not fully confirmed.',
  },
  {
    material: 'Bloodthistle',
    skillRange: [375, 375],
    zones: ['Rare spawn found throughout Outland wherever other herbs grow'],
    recommendedCharacterLevel: '60-70',
  },
  {
    material: 'Netherdust Bush',
    skillRange: [375, 375],
    zones: ['Netherstorm'],
    recommendedCharacterLevel: '67-70',
  },
  {
    material: 'Fel Lotus',
    skillRange: [375, 375],
    zones: ['Rare spawn found throughout Outland wherever other herbs grow'],
    recommendedCharacterLevel: '60-70',
  },
]

const skinningFarmSpots: readonly MaterialFarmSpot[] = [
  {
    material: 'Ruined Leather Scraps / Light Leather',
    skillRange: [1, 65],
    zones: ['Skinnable beasts in any level 1-15 starting zone'],
    recommendedCharacterLevel: '1-15',
  },
  {
    material: 'Medium Leather',
    skillRange: [65, 150],
    zones: ['Skinnable beasts (levels ~13-30) in Westfall, Loch Modan, The Barrens, Stonetalon Mountains'],
    recommendedCharacterLevel: '15-30',
  },
  {
    material: 'Heavy Leather',
    skillRange: [150, 225],
    zones: ['Skinnable beasts (levels ~30-45) in Arathi Highlands, Desolace, Stranglethorn Vale, Thousand Needles'],
    recommendedCharacterLevel: '30-45',
  },
  {
    material: 'Thick Leather',
    skillRange: [175, 250],
    zones: ['Skinnable beasts in Feralas, Tanaris, Swamp of Sorrows, Dustwallow Marsh'],
    recommendedCharacterLevel: '40-50',
  },
  {
    material: 'Rugged Leather',
    skillRange: [225, 300],
    zones: ["Un'Goro Crater", 'Winterspring', 'Silithus', 'Eastern Plaguelands', 'Felwood'],
    recommendedCharacterLevel: '48-60',
  },
  {
    material: 'Knothide Leather',
    skillRange: [300, 375],
    zones: ['All Outland zones; boars and ravagers are especially dense in Hellfire Peninsula and Zangarmarsh'],
    recommendedCharacterLevel: '58-64',
  },
  {
    material: 'Fel Hide',
    skillRange: [300, 375],
    zones: ['Skinned from demon-type beasts across Outland (Shadowmoon Valley, Hellfire Peninsula)'],
    recommendedCharacterLevel: '58-70',
  },
  {
    material: 'Cobra Scales',
    skillRange: [300, 375],
    zones: ['Skinned from serpents in Zangarmarsh and Terokkar Forest'],
    recommendedCharacterLevel: '60-65',
  },
  {
    material: 'Nether Dragonscales',
    skillRange: [350, 375],
    zones: ['Skinned from nether dragonkin in Netherstorm and Shadowmoon Valley'],
    recommendedCharacterLevel: '67-70',
  },
  {
    material: 'Thick Clefthoof Leather',
    skillRange: [350, 375],
    zones: ['Skinned from Clefthoof beasts in Nagrand (northern half)'],
    recommendedCharacterLevel: '64-68',
    notes: 'High-value, slow-to-farm endgame leather; a major material sink for max-level Leatherworking recipes.',
  },
]

const fishingFarmSpots: readonly MaterialFarmSpot[] = [
  {
    material: 'Raw Brilliant Smallfish / Raw Bristlefish (low-level pools)',
    skillRange: [1, 75],
    zones: ['Any coastal or lake pool near a level 1-15 starting zone'],
    recommendedCharacterLevel: '1-15',
  },
  {
    material: 'Raw Loch Frenzy / Longjaw Mud Snapper',
    skillRange: [75, 150],
    zones: ['Loch Modan', 'Westfall', 'The Barrens'],
    recommendedCharacterLevel: '10-25',
  },
  {
    material: 'Raw Bristle Whisker Catfish / Raw Brilliant Smallfish (mid pools)',
    skillRange: [150, 225],
    zones: ['Any Azeroth zone after buying the Expert Fishing manual (Old Man Heming, Booty Bay)'],
    recommendedCharacterLevel: '20-40',
  },
  {
    material: 'Raw Nightfin Snapper / Oily Blackmouth / Firefin Snapper (pre-Outland)',
    skillRange: [225, 300],
    zones: ['Dustwallow Marsh (unlocked via Nat Pagle questline for Artisan Fishing)', 'Winterspring'],
    recommendedCharacterLevel: '40-55',
  },
  {
    material: 'Spotted Feltail / Zangarmarsh Sporefish',
    skillRange: [300, 350],
    zones: ['Zangarmarsh (Sporefish Schools around the central lakes near Cenarion Refuge)'],
    recommendedCharacterLevel: '60-63',
  },
  {
    material: 'Golden Darter / Furious Crawdad / Enormous Barbed Gill Trout (Highland Mixed School)',
    skillRange: [325, 375],
    zones: ['Terokkar Forest (Highland Mixed Schools, considered the best pools in Outland)'],
    recommendedCharacterLevel: '62-65',
  },
  {
    material: "Figluster's Mudfish / Icefin Bluefish",
    skillRange: [325, 375],
    zones: ['Nagrand (Bluefish Schools and Pure Water pools across the zone)'],
    recommendedCharacterLevel: '64-67',
  },
  {
    material: 'Barbed Gill Trout (open water, no pool required)',
    skillRange: [300, 375],
    zones: ['Any Outland outdoor zone; also found in Deadwind Pass and inside Serpentshrine Cavern/The Underbog'],
    recommendedCharacterLevel: '58-70',
    needsVerification: true,
  },
]

export const gatheringMaterialFarming: Readonly<
  Partial<Record<Profession, readonly MaterialFarmSpot[]>>
> = {
  Mining: miningFarmSpots,
  Herbalism: herbalismFarmSpots,
  Skinning: skinningFarmSpots,
  Fishing: fishingFarmSpots,
}

export function getMaterialFarmSpots(profession: Profession): readonly MaterialFarmSpot[] {
  return gatheringMaterialFarming[profession] ?? []
}
