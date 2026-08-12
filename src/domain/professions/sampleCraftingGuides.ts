import type { Profession, RecipeLeveling } from './professionTypes'

/**
 * Concise leveling-path guides for the 9 crafting/secondary professions.
 *
 * **Alchemy's 300-375 tail is sourced** against wow-professions.com's TBC guide
 * (`/tbc/alchemy-leveling-guide-burning-crusade-classic`): skill ranges, craft counts and material
 * quantities are transcribed as facts, the wording here is this repo's own. The other eight
 * professions still carry the older estimated steps and their `needsVerification` flags. Alchemy was
 * done end to end first to establish the shape, the same way Warrior was for talents; **Jewelcrafting
 * followed**, sourced the same way from `/tbc/jewelcrafting-leveling-guide-burning-crusade-classic`. These are not
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
    recipeOrItem: '7x Fel Weightstone',
    recipeSource: 'Master Blacksmithing trainer (Outland).',
    keyMaterials: ['7 Fel Iron Bar', '7 Netherweave Cloth'],
    notes: 'Does not skill up on every craft, so expect to make a few more than seven.',
  },
  {
    skillRange: [305, 316],
    recipeOrItem: '11x Fel Iron Plate Belt',
    recipeSource: 'Master Blacksmithing trainer (Outland).',
    keyMaterials: ['44 Fel Iron Bar'],
    notes: '11x Imperial Plate Boots covers the same range if 198 Thorium Bar is cheaper than 44 Fel Iron Bar.',
  },
  {
    skillRange: [316, 321],
    recipeOrItem: '5x Fel Iron Chain Gloves',
    recipeSource: 'Master Blacksmithing trainer (Outland).',
    keyMaterials: ['25 Fel Iron Bar'],
  },
  {
    skillRange: [321, 325],
    recipeOrItem: '4x Fel Iron Plate Boots',
    recipeSource: 'Master Blacksmithing trainer (Outland).',
    keyMaterials: ['24 Fel Iron Bar'],
  },
  {
    skillRange: [325, 335],
    recipeOrItem: '45x Lesser Rune of Warding',
    recipeSource: 'Master Blacksmithing trainer (Outland).',
    keyMaterials: ['45 Adamantite Bar'],
    notes: 'Green for the last five points, so 45 is an estimate rather than a count.',
  },
  {
    skillRange: [335, 340],
    recipeOrItem: '7x Fel Iron Chain Tunic',
    recipeSource: 'Master Blacksmithing trainer (Outland).',
    keyMaterials: ['63 Fel Iron Bar'],
  },
  {
    skillRange: [340, 350],
    recipeOrItem: '45x Lesser Ward of Shielding',
    recipeSource: 'Recipe sold by Rohok (Horde, Hellfire Peninsula) or Mari Stonehand (Alliance, Shadowmoon Valley).',
    keyMaterials: ['45 Adamantite Bar'],
    notes: 'Limited-supply vendor item on a 15-60 minute respawn, so it may not be there when you arrive.',
  },
  {
    skillRange: [350, 360],
    recipeOrItem: '45x Adamantite Weightstone',
    recipeSource: 'Recipe sold by Fedryen Swiftspear (Zangarmarsh); needs Honored with Cenarion Expedition.',
    keyMaterials: ['45 Adamantite Bar', '90 Netherweave Cloth'],
    notes: 'Cenarion Expedition reputation comes from Steamvault, Underbog and Slave Pens.',
  },
  {
    skillRange: [360, 375],
    recipeOrItem: '17x Enchanted Adamantite Belt, or Felsteel Gloves',
    recipeSource:
      'Enchanted Adamantite Belt from Quartermaster Enuril at Friendly with The Scryers; Plans: Felsteel Gloves drops from Auchenai Monks in Auchenai Crypts, and only with a Blacksmith in the group.',
    keyMaterials: ['34 Hardened Adamantite Bar (~680 Adamantite Ore)', '136 Arcane Dust', '34 Large Prismatic Shard'],
    notes:
      'Which one depends on the faction you picked at the City of Light quest. The belt itself is poor and will not sell, so the Felsteel Gloves route is worth the farm if you went Aldor.',
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
    skillRange: [300, 310],
    recipeOrItem: '1x Runed Fel Iron Rod, then 9x Bracer - Assault',
    recipeSource: 'Master Enchanting trainer (Outland).',
    keyMaterials: ['1 Fel Iron Rod, 4 Greater Eternal Essence, 6 Large Brilliant Shard for the rod', '54 Arcane Dust'],
    notes: 'The rod is a tool, not a skill-up path — it gates everything after this, so make it first.',
  },
  {
    skillRange: [310, 316],
    recipeOrItem: '6x Bracer - Brawn',
    recipeSource: 'Master Enchanting trainer (Outland).',
    keyMaterials: ['36 Arcane Dust'],
  },
  {
    skillRange: [316, 330],
    recipeOrItem: '16x Gloves - Assault',
    recipeSource: 'Master Enchanting trainer (Outland).',
    keyMaterials: ['128 Arcane Dust'],
    notes: '10x Chest - Major Spirit (20 Greater Planar Essence) covers 320-330 if Arcane Dust is dear.',
  },
  {
    skillRange: [330, 335],
    recipeOrItem: '5x Shield - Major Stamina',
    recipeSource: 'Recipe sold by Madame Ruby in Shattrath City.',
    keyMaterials: ['75 Arcane Dust'],
    notes: 'Limited supply on a 5-10 minute respawn. Buy Formula: Superior Wizard Oil on the same visit — it is the 340 step.',
  },
  {
    skillRange: [335, 340],
    recipeOrItem: '5x Shield - Resilience',
    recipeSource: 'Master Enchanting trainer (Outland).',
    keyMaterials: ['5 Large Prismatic Shard', '20 Lesser Planar Essence'],
    notes:
      'Blood Elves can skip this range: Arcane Affinity gives ten free points converting a Large Prismatic Shard to three Small ones and back, though only the downward conversion skills up.',
  },
  {
    skillRange: [340, 350],
    recipeOrItem: '15x Superior Wizard Oil',
    recipeSource: 'Recipe sold by Madame Ruby in Shattrath City.',
    keyMaterials: ['45 Arcane Dust', '15 Nightmare Vine', '15 Imbued Vial'],
    notes: 'Already yellow when learned, so budget for a few extra.',
  },
  {
    skillRange: [350, 360],
    recipeOrItem: '15x Enchant Gloves - Major Strength',
    recipeSource: 'Master Enchanting trainer (Outland).',
    keyMaterials: ['180 Arcane Dust', '15 Greater Planar Essence'],
  },
  {
    skillRange: [360, 361],
    recipeOrItem: '1x Runed Adamantite Rod',
    recipeSource: 'Formula sold by Rungor (Stonebreaker Hold, Terokkar Forest) or Vodesiin (Temple of Telhamat, Hellfire Peninsula).',
    keyMaterials: ['1 Adamantite Rod', '1 Primal Might', '8 Greater Planar Essence', '8 Large Prismatic Shard'],
    notes: 'The second tool upgrade, and the gate on the last fifteen points.',
  },
  {
    skillRange: [361, 365],
    recipeOrItem: '10x Enchant Gloves - Major Strength',
    recipeSource: 'Master Enchanting trainer (Outland).',
    keyMaterials: ['120 Arcane Dust', '10 Greater Planar Essence'],
  },
  {
    skillRange: [365, 375],
    recipeOrItem: '12x Enchant Ring - Spellpower',
    recipeSource: 'Formula sold by Alurmi (Tanaris); needs Honored with Keepers of Time.',
    keyMaterials: ['24 Large Prismatic Shard', '24 Greater Planar Essence'],
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
    skillRange: [300, 320],
    recipeOrItem: '114x Handful of Fel Iron Bolts and 20x Elemental Blasting Powder',
    recipeSource: 'Master Engineering trainer (Outland).',
    keyMaterials: ['114 Fel Iron Bar', '20 Mote of Fire, 40 Mote of Earth'],
    notes: 'Both are components for later steps, so none of this is wasted — make the full amount now.',
  },
  {
    skillRange: [320, 325],
    recipeOrItem: '7x Fel Iron Bomb',
    recipeSource: 'Master Engineering trainer (Outland).',
    keyMaterials: ['7 Fel Iron Casing', '14 Handful of Fel Iron Bolts', '7 Elemental Blasting Powder'],
  },
  {
    skillRange: [325, 335],
    recipeOrItem: '30x Adamantite Frame',
    recipeSource: 'Master Engineering trainer (Outland).',
    keyMaterials: ['120 Adamantite Bar', '30 Primal Earth'],
    notes: 'Keep all thirty — they are the material for the rifles at 360.',
  },
  {
    skillRange: [335, 355],
    recipeOrItem: '70x White Smoke Flare',
    recipeSource: 'Schematic sold by a vendor; green for most of the range.',
    keyMaterials: ['70 Elemental Blasting Powder', '70 Netherweave Cloth'],
    notes: 'Green for most of this, so 70 is an estimate rather than a count.',
  },
  {
    skillRange: [355, 360],
    recipeOrItem: '5x Khorium Power Core',
    recipeSource: 'Master Engineering trainer (Outland).',
    keyMaterials: ['15 Khorium Bar', '5 Primal Fire'],
    notes: 'Cheaper alternatives exist, but these five are needed at 370 regardless — reaching exactly 360 matters less than having them.',
  },
  {
    skillRange: [360, 370],
    recipeOrItem: '15x Adamantite Rifle',
    recipeSource: 'Master Engineering trainer (Outland).',
    keyMaterials: ['45 Fel Iron Casing', '30 Adamantite Frame', '60 Handful of Fel Iron Bolts'],
  },
  {
    skillRange: [370, 375],
    recipeOrItem: '5x Field Repair Bot 110G',
    recipeSource: 'Master Engineering trainer (Outland).',
    keyMaterials: ['40 Adamantite Bar', '40 Handful of Fel Iron Bolts', '5 Khorium Power Core'],
    notes: 'Yellow, so expect more than five.',
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
    skillRange: [300, 320],
    recipeOrItem: '~30 uncommon gem cuts, mixed across Brilliant Golden Draenite, Glowing Shadow Draenite, Inscribed Flame Spessarite, Radiant Deep Peridot, Solid Azure Moonstone and Teardrop Blood Garnet',
    recipeSource: 'Designs sold by Kalaen / Tatiana in Hellfire Peninsula.',
    keyMaterials: ['One raw gem per cut — prospect Fel Iron Ore for the lot'],
  },
  {
    skillRange: [320, 325],
    recipeOrItem: '5-7x of any one of Glinting Flame Spessarite, Bright Blood Garnet, Jagged Deep Peridot or Sparkling Azure Moonstone',
    recipeSource: 'Designs sold by Kalaen / Tatiana in Hellfire Peninsula.',
  },
  {
    skillRange: [325, 335],
    recipeOrItem: '12x Mercurial Adamantite',
    recipeSource: 'Master Jewelcrafting trainer (Outland).',
    keyMaterials: ['48 Adamantite Powder — roughly 240 Adamantite Ore prospected', '12 Primal Earth'],
    notes:
      'Needs a Mercurial Stone as a tool, which Jewelcrafters cannot make: buy one or ask an Alchemist. Keep all twelve bars — they are the material for the 340 step.',
  },
  {
    skillRange: [335, 340],
    recipeOrItem: '5-10x of any one of Potent Flame Spessarite, Sovereign Shadow Draenite or Smooth Golden Draenite',
    recipeSource: 'Sovereign and Smooth from Kalaen / Tatiana; Potent Flame Spessarite from Nakodu, which needs Friendly with Lower City.',
  },
  {
    skillRange: [340, 350],
    recipeOrItem: '12x Heavy Adamantite Ring',
    recipeSource: 'Master Jewelcrafting trainer (Outland).',
    keyMaterials: ['12 Adamantite Bar', '12 Mercurial Adamantite — the ones saved at 325'],
  },
  {
    skillRange: [350, 360],
    recipeOrItem: '15x Purified Shadow Pearl',
    recipeSource: 'Master Jewelcrafting trainer (Outland).',
    keyMaterials: ['15 Shadow Pearl', '15 Purified Draenic Water — any Outland innkeeper'],
    notes:
      'Shadow Pearl only comes from Jaggal Clams at a poor rate, so buy rather than farm. Twelve Mystic Dawnstone or Steady Talasite cover the same range if the market is dry.',
  },
  {
    skillRange: [360, 365],
    recipeOrItem:
      "5x of a Jewelcrafting-only epic gem — Crimson Sun, Don Julio's Heart, Falling Star, Blood of Amber, Stone of Blades, Facet of Eternity or Kailee's Rose",
    recipeSource:
      "All reputation-gated: Consortium Revered (Crimson Sun, Don Julio's Heart), Lower City Revered (Falling Star), Sha'tar Honored/Revered (Kailee's Rose, Blood of Amber), Keepers of Time Honored/Revered (Facet of Eternity, Stone of Blades).",
    notes: 'The cheapest useful thing to make at this level. Without the reputation, another 7-8 of the previous cuts covers it.',
  },
  {
    skillRange: [365, 375],
    recipeOrItem: '10x meta gem cuts',
    recipeSource: "Designs are reputation-gated — Insightful Earthstorm Diamond from Almaador at Sha'tar reputation, among others.",
    keyMaterials: ['10 Earthstorm Diamond or 10 Skyfire Diamond'],
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
