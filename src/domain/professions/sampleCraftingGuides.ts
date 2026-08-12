import type { Profession, RecipeLeveling } from './professionTypes'

/**
 * Concise leveling-path guides for the 9 crafting/secondary professions.
 *
 * **Alchemy's 300-375 tail is sourced** against wow-professions.com's TBC guide
 * (`/tbc/alchemy-leveling-guide-burning-crusade-classic`): skill ranges, craft counts and material
 * quantities are transcribed as facts, the wording here is this repo's own. The other eight
 * professions still carry the older estimated steps and their `needsVerification` flags — Alchemy
 * was done end to end first to establish the shape, the same way Warrior was for talents. These are not
 * exhaustive per-recipe lists - just enough waypoints (with recipe source callouts for
 * BoE/vendor/quest recipes that are commonly used to skip skill-up gaps) that a player
 * reading this knows generally how to level without getting stuck. All ranges below 300
 * are pre-Outland (vanilla) content; 300-375 is the TBC-added tail.
 */

const alchemyLeveling: readonly RecipeLeveling[] = [
  {
    skillRange: [1, 300],
    recipeOrItem: 'Standard vanilla potion/elixir progression (Minor Healing Potion through Major Troll\'s Blood Potion/Elixir of the Mongoose, etc.)',
    recipeSource: 'Trainer-taught for the most part, with a handful of BoE recipes from vendors/AH used to smooth over gaps.',
    needsVerification: true,
    notes: 'Not itemized in detail here; see a dedicated 1-300 vanilla Alchemy guide if needed.',
  },
  {
    skillRange: [300, 315],
    recipeOrItem: "15x of any one of Volatile Healing Potion, Adept's Elixir or Onslaught Elixir",
    recipeSource: 'Master Alchemy trainer (Outland).',
    keyMaterials: ['15 Felweed', '15 Golden Sansam, Dreamfoil or Mountain Silversage — whichever matches the craft you picked'],
  },
  {
    skillRange: [315, 330],
    recipeOrItem: '25x Elixir of Healing Power',
    recipeSource: 'Master Alchemy trainer (Outland).',
    keyMaterials: ['25 Golden Sansam', '25 Dreaming Glory'],
  },
  {
    skillRange: [330, 335],
    recipeOrItem: '5x Elixir of Draenic Wisdom',
    recipeSource: 'Master Alchemy trainer (Outland).',
    keyMaterials: ['5 Terocone', '5 Felweed'],
  },
  {
    skillRange: [335, 340],
    recipeOrItem: '5x Super Healing Potion',
    recipeSource: 'Master Alchemy trainer (Outland).',
    keyMaterials: ['10 Netherbloom', '5 Felweed'],
    notes: 'Short on Netherbloom? Five more Elixir of Draenic Wisdom covers the same five points.',
  },
  {
    skillRange: [340, 355],
    recipeOrItem: '15x Super Mana Potion',
    recipeSource: 'Recipe sold by Daga Ramba (Nagrand) or Haalrun (Zangarmarsh).',
    keyMaterials: ['30 Dreaming Glory', '15 Felweed'],
    notes: 'Buy the Major Dreamless Sleep Potion recipe on the same trip — it is what carries the last twenty points.',
  },
  {
    skillRange: [355, 375],
    recipeOrItem: '40x Major Dreamless Sleep Potion',
    recipeSource: 'Recipe sold by Daga Ramba (Nagrand) or Leeli Longhaggle.',
    keyMaterials: ['40 Dreaming Glory', '40 Nightmare Vine'],
    notes:
      'Goes green for the final three points, so expect to craft a few extra. Elixir of Major Shadow Power covers the same range off the same Nightmare Vine and actually sells — its recipe needs Revered with Lower City.',
  },
  {
    skillRange: [325, 375],
    recipeOrItem: 'Specialization questline (Potion / Elixir / Transmutation Mastery)',
    recipeSource: 'Quest, available once Alchemy skill 325 and character level 68 are reached; unlocks specialization-only recipes with a chance at bonus items.',
  },
]

const blacksmithingLeveling: readonly RecipeLeveling[] = [
  {
    skillRange: [1, 300],
    recipeOrItem: 'Standard vanilla weapon/armor progression through Thorium-tier gear',
    recipeSource: 'Trainer-taught, with a few BoE plans from vendors/AH.',
    needsVerification: true,
    notes: 'Not itemized in detail here; see a dedicated 1-300 vanilla Blacksmithing guide if needed.',
  },
  {
    skillRange: [300, 305],
    recipeOrItem: 'Fel Weightstone',
    recipeSource: 'Master Blacksmithing trainer (Outland).',
    keyMaterials: ['Fel Iron Bar', 'Netherweave Cloth'],
  },
  {
    skillRange: [305, 335],
    recipeOrItem: 'Fel Iron armor pieces (belts, gloves, boots, tunic)',
    recipeSource: 'Master Blacksmithing trainer (Outland).',
    keyMaterials: ['Fel Iron Bar'],
  },
  {
    skillRange: [335, 360],
    recipeOrItem: 'Adamantite-tier weightstones and armor pieces',
    recipeSource: 'Master Blacksmithing trainer (Outland).',
    keyMaterials: ['Adamantite Bar'],
  },
  {
    skillRange: [360, 375],
    recipeOrItem: 'Felsteel Gloves and similar Felsteel-tier pieces',
    recipeSource: 'Master Blacksmithing trainer (Outland).',
    keyMaterials: ['Felsteel Bar'],
  },
  {
    skillRange: [200, 200],
    recipeOrItem: 'Specialization choice: Armorsmith or Weaponsmith (Swordsmith / Hammersmith / Axesmith)',
    recipeSource: 'Quest-unlocked specialization trainers; each grants access to exclusive high-end plate/weapon plans with phase-gated upgrades.',
    needsVerification: true,
    notes: 'Specialization unlock level/skill requirement carried over from vanilla; not independently re-verified for this pass.',
  },
]

const enchantingLeveling: readonly RecipeLeveling[] = [
  {
    skillRange: [1, 300],
    recipeOrItem: 'Standard vanilla enchant progression (weapon/armor enchants using Strange/Soul/Vision Dust etc.)',
    recipeSource: 'Trainer-taught, supplemented by disenchanting drops for materials.',
    needsVerification: true,
    notes: 'Not itemized in detail here; see a dedicated 1-300 vanilla Enchanting guide if needed.',
  },
  {
    skillRange: [300, 305],
    recipeOrItem: 'Enchant Cloak - Superior Defense',
    recipeSource: 'Master Enchanting trainer (Outland).',
    keyMaterials: ['Illusion Dust'],
  },
  {
    skillRange: [305, 320],
    recipeOrItem: 'Enchant Bracer - Superior Stamina',
    recipeSource: 'BoE formula, commonly bought off the auction house.',
    keyMaterials: ['Illusion Dust', 'Arcane Dust'],
  },
  {
    skillRange: [320, 335],
    recipeOrItem: 'Runed Arcanite Rod (crafting rank-up item, not a gear enchant)',
    recipeSource: 'Formula sold by a vendor in Moonglade.',
    needsVerification: true,
  },
  {
    skillRange: [335, 340],
    recipeOrItem: 'Enchant Shield - Resilience',
    recipeSource: 'Master Enchanting trainer (Outland).',
    keyMaterials: ['Prismatic Shard', 'Lesser Planar Essence'],
  },
  {
    skillRange: [340, 360],
    recipeOrItem: 'Continued dust/essence-based enchants (weapon and armor lines)',
    recipeSource: 'Master Enchanting trainer (Outland).',
    needsVerification: true,
  },
  {
    skillRange: [360, 375],
    recipeOrItem: 'High-end ring enchants (e.g. Enchant Ring - Spellpower / Stats)',
    recipeSource: 'Reputation vendors (Keepers of Time, The Sha\'tar); requires meeting the relevant reputation threshold.',
  },
]

const engineeringLeveling: readonly RecipeLeveling[] = [
  {
    skillRange: [1, 300],
    recipeOrItem: 'Standard vanilla Engineering progression (guns, explosives, gadgets)',
    recipeSource: 'Trainer-taught, with several quest/BoE schematics along the way.',
    needsVerification: true,
    notes: 'Not itemized in detail here; see a dedicated 1-300 vanilla Engineering guide if needed. Also involves an early Gnomish vs Goblin specialization choice.',
  },
  {
    skillRange: [300, 310],
    recipeOrItem: 'Fel Iron Casing, Handful of Fel Iron Bolts, Elemental Blasting Powder (component crafting)',
    recipeSource: 'Master Engineering trainer (Outland).',
    keyMaterials: ['Fel Iron Bar'],
  },
  {
    skillRange: [310, 320],
    recipeOrItem: 'Fel Iron Bomb',
    recipeSource: 'Master Engineering trainer (Outland).',
  },
  {
    skillRange: [320, 335],
    recipeOrItem: 'Fel Iron Musket (or equivalent Fel Iron ranged weapon)',
    recipeSource: 'Master Engineering trainer (Outland).',
  },
  {
    skillRange: [335, 350],
    recipeOrItem: 'White Smoke Flare',
    recipeSource: 'Schematic purchased from a vendor such as Wind Trader Lathrai in Shattrath, or from a reputation quartermaster.',
  },
  {
    skillRange: [350, 360],
    recipeOrItem: 'Khorium Power Core',
    recipeSource: 'Master Engineering trainer (Outland).',
    keyMaterials: ['Khorium Bar', 'Primal Fire'],
  },
  {
    skillRange: [360, 375],
    recipeOrItem: 'Field Repair Bot 110G',
    recipeSource: 'Schematic drops from the Gan\'arg Analyzer in Blade\'s Edge Mountains.',
    needsVerification: true,
  },
]

const jewelcraftingLeveling: readonly RecipeLeveling[] = [
  {
    skillRange: [1, 20],
    recipeOrItem: 'Delicate Copper Wire (component crafting)',
    recipeSource: 'Trainer-taught starting recipe.',
  },
  {
    skillRange: [20, 30],
    recipeOrItem: 'Rough Stone Statue',
    recipeSource: 'Trainer-taught.',
  },
  {
    skillRange: [30, 50],
    recipeOrItem: 'Tigerseye Band',
    recipeSource: 'Trainer-taught.',
  },
  {
    skillRange: [130, 200],
    recipeOrItem: 'Pendant of the Agate Shield and similar bronze-setting designs',
    recipeSource: 'Design purchased from vendors in Thousand Needles or Wetlands.',
    keyMaterials: ['Bronze Setting', 'Moss Agate'],
  },
  {
    skillRange: [200, 300],
    recipeOrItem: 'Mithril/Truesilver/Thorium-set rings, culminating in Emerald Lion Ring',
    recipeSource: 'Mostly trainer-taught, with a few vendor-bought designs.',
    needsVerification: true,
  },
  {
    skillRange: [300, 310],
    recipeOrItem: 'Beginner gem-cutting designs (uncommon-quality cut gems)',
    recipeSource: 'Master Jewelcrafting trainer (Outland).',
  },
  {
    skillRange: [310, 350],
    recipeOrItem: 'Rare-quality colored gem cuts (using draenite/garnet-tier gems)',
    recipeSource: 'Master Jewelcrafting trainer (Outland), plus some designs from Outland faction vendors.',
    keyMaterials: ['Various draenite and garnet gems'],
  },
  {
    skillRange: [350, 365],
    recipeOrItem: 'Rare gem patterns (Dawnstone, Nightseye, Talasite, Living Ruby, Noble Topaz, Star of Elune)',
    recipeSource: 'Master Jewelcrafting trainer (Outland) and reputation vendors.',
  },
  {
    skillRange: [365, 375],
    recipeOrItem: 'Meta gem cuts and the Braided Eternium Chain',
    recipeSource: 'Master Jewelcrafting trainer (Outland); meta gem patterns are often reputation-gated.',
    needsVerification: true,
  },
]

const leatherworkingLeveling: readonly RecipeLeveling[] = [
  {
    skillRange: [1, 300],
    recipeOrItem: 'Standard vanilla leather/mail armor progression',
    recipeSource: 'Trainer-taught, with a specialization choice (Dragonscale / Elemental / Tribal) unlocked via questline partway through.',
    needsVerification: true,
    notes: 'Not itemized in detail here; see a dedicated 1-300 vanilla Leatherworking guide if needed.',
  },
  {
    skillRange: [300, 310],
    recipeOrItem: 'Knothide Leather (from Knothide Leather Scraps)',
    recipeSource: 'Master Leatherworking trainer (Outland).',
    keyMaterials: ['Knothide Leather Scraps'],
  },
  {
    skillRange: [310, 325],
    recipeOrItem: 'Armor kits crafted from Knothide Leather',
    recipeSource: 'Master Leatherworking trainer (Outland).',
  },
  {
    skillRange: [325, 335],
    recipeOrItem: 'Heavy Knothide Leather',
    recipeSource: 'Pattern purchased from Cro Threadstrong in Shattrath.',
  },
  {
    skillRange: [335, 350],
    recipeOrItem: 'Knothide Leather vests (with thread)',
    recipeSource: 'Master Leatherworking trainer (Outland).',
  },
  {
    skillRange: [350, 365],
    recipeOrItem: 'Heavy armor kits from thicker leather variants',
    recipeSource: 'Master Leatherworking trainer (Outland).',
    keyMaterials: ['Thick Clefthoof Leather'],
  },
  {
    skillRange: [365, 375],
    recipeOrItem: 'Drums of Battle',
    recipeSource: "Pattern from Almaador in Shattrath; requires Honored reputation with The Sha'tar.",
  },
]

const tailoringLeveling: readonly RecipeLeveling[] = [
  {
    skillRange: [1, 300],
    recipeOrItem: 'Standard vanilla cloth armor progression',
    recipeSource: 'Trainer-taught, with a specialization choice (Spellfire / Shadoweave / Mooncloth) unlocked via questline partway through.',
    needsVerification: true,
    notes: 'Not itemized in detail here; see a dedicated 1-300 vanilla Tailoring guide if needed.',
  },
  {
    skillRange: [300, 325],
    recipeOrItem: 'Bolt of Netherweave',
    recipeSource: 'Master Tailoring trainer (Outland).',
    keyMaterials: ['Netherweave Cloth'],
  },
  {
    skillRange: [325, 340],
    recipeOrItem: 'Bolt of Imbued Netherweave',
    recipeSource: 'Master Tailoring trainer (Outland).',
    keyMaterials: ['Netherweave Cloth', 'Arcane Dust'],
  },
  {
    skillRange: [340, 350],
    recipeOrItem: 'Netherweave Robe',
    recipeSource: 'Master Tailoring trainer (Outland).',
  },
  {
    skillRange: [350, 360],
    recipeOrItem: 'Netherweave Tunic',
    recipeSource: 'Master Tailoring trainer (Outland).',
    notes: 'Skill 350 is also when Spellfire/Shadoweave/Mooncloth specialization recipes become available, doubling cloth output per craft for specialized bolts.',
  },
  {
    skillRange: [360, 375],
    recipeOrItem: 'Imbued Netherweave Tunic',
    recipeSource: 'Master Tailoring trainer (Outland).',
  },
]

const cookingLeveling: readonly RecipeLeveling[] = [
  {
    skillRange: [1, 100],
    recipeOrItem: 'Spice Bread, Smoked Bear Meat, Dry Pork Ribs',
    recipeSource: 'Trainer-taught.',
  },
  {
    skillRange: [100, 285],
    recipeOrItem: 'Fish-based recipes: Bristle Whisker Catfish, Rockscale Cod, Spotted Yellowtail',
    recipeSource: 'Trainer-taught and cooking supplier vendors; requires the corresponding fish to be caught via Fishing.',
  },
  {
    skillRange: [225, 300],
    recipeOrItem: '"Clamlette Surprise" and related quest chain',
    recipeSource: 'Quest chain in your faction capital, needed to unlock Artisan Cooking.',
    needsVerification: true,
  },
  {
    skillRange: [275, 375],
    recipeOrItem: 'Master Cookbook purchase',
    recipeSource: 'Gaston (Alliance, Honor Hold) / Baxter (Horde, Thrallmar) / Naka (neutral, Cenarion Refuge); learn from bag once purchased.',
  },
  {
    skillRange: [285, 375],
    recipeOrItem: 'Outland recipes: Ravager Dog, Golden Fish Sticks, Spicy Crawdad Surprise',
    recipeSource: 'Cooking dailies vendors in Outland (e.g. Zangarmarsh) and Master Cookbook trainer-equivalent recipes.',
    needsVerification: true,
    notes: 'Some late recipes are notably gold-expensive due to rare fish/meat requirements (e.g. Spicy Crawdad Surprise).',
  },
]

const firstAidLeveling: readonly RecipeLeveling[] = [
  {
    skillRange: [1, 40],
    recipeOrItem: 'Linen Bandage',
    recipeSource: 'Trainer-taught.',
    keyMaterials: ['Linen Cloth'],
  },
  {
    skillRange: [40, 150],
    recipeOrItem: 'Heavy Linen Bandage, Wool Bandage, Heavy Wool Bandage',
    recipeSource: 'Trainer-taught.',
    keyMaterials: ['Linen Cloth', 'Wool Cloth'],
  },
  {
    skillRange: [150, 225],
    recipeOrItem: 'Silk Bandage, Heavy Silk Bandage, Mageweave Bandage',
    recipeSource: 'Expert manual purchased from Deneb Walker (Alliance, Arathi Highlands) or Balai Lok\'Wein (Horde, Dustwallow Marsh); learn from bag.',
    keyMaterials: ['Silk Cloth', 'Mageweave Cloth'],
  },
  {
    skillRange: [225, 260],
    recipeOrItem: 'Heavy Mageweave Bandage',
    recipeSource: 'Unlocked via the "Triage" quest (Doctor Gustaf VanHowzen for Alliance, Doctor Gregory Victor for Horde; requires level 35, skill 225).',
  },
  {
    skillRange: [260, 330],
    recipeOrItem: 'Runecloth Bandage, Heavy Runecloth Bandage',
    recipeSource: 'Trainer-taught (Artisan tier).',
    keyMaterials: ['Runecloth'],
  },
  {
    skillRange: [330, 375],
    recipeOrItem: 'Netherweave Bandage, Heavy Netherweave Bandage',
    recipeSource: 'Manuals purchased from Burko (Alliance, Temple of Telhamat) or Aresella (Horde, Falcon Watch), Hellfire Peninsula, alongside the "Doctor in the House" Master First Aid manual; learn from bag.',
    keyMaterials: ['Netherweave Cloth'],
  },
]

export const craftingLevelingPaths: Readonly<Partial<Record<Profession, readonly RecipeLeveling[]>>> = {
  Alchemy: alchemyLeveling,
  Blacksmithing: blacksmithingLeveling,
  Enchanting: enchantingLeveling,
  Engineering: engineeringLeveling,
  Jewelcrafting: jewelcraftingLeveling,
  Leatherworking: leatherworkingLeveling,
  Tailoring: tailoringLeveling,
  Cooking: cookingLeveling,
  'First Aid': firstAidLeveling,
}

export function getCraftingLevelingPath(profession: Profession): readonly RecipeLeveling[] {
  return craftingLevelingPaths[profession] ?? []
}
