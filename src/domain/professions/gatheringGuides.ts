/**
 * The gathering climbs, one range at a time.
 *
 * **Written here, not taken from anywhere.** `professionTypes.ts` records the standing rule that
 * wow-professions.com's routes and orderings are linked and never copied; the same applies to every
 * other guide this file cites. What is borrowed is the *shape* — prose, then a table, then maps —
 * because that shape answers the questions in the order a player asks them. The claims inside it
 * were each checked against at least two published guides and against this repo's own Wowhead
 * ingest, and every range records which.
 *
 * **The skill requirements were not taken on trust and did not need correcting.** All thirteen ore
 * requirements and all thirty-two herb requirements published by icy-veins.com and
 * warcrafttavern.com agree with each other exactly, and agree with the `requiredSkill` this repo
 * read off Wowhead's own object pages during the node ingest — 45 of 45. One web search summary
 * disagreed, putting Fel Iron at 275; three detailed sources say 300 and so does the ingest, so the
 * summary is simply wrong. It is recorded here because "I checked and nothing moved" is a result,
 * and the next person to wonder whether it is worth re-checking should be able to see that it was.
 */

import type { GatheringGuide } from './gatheringRangeTypes'

/** The three that carry the skill tables and the range-by-range zone recommendations. */
const TABLES = ['icy-veins.com', 'warcrafttavern.com', 'wowhead.com (object pages, via our own ingest)']

const miningGuide: GatheringGuide = {
  profession: 'Mining',
  intro: [
    'Mining levels off nodes in the world, so the only real question at any point is which zone to ride. Every range below names the ore it opens, the zones worth riding it in, and a loop computed from where the nodes actually are.',
    'Nodes follow the same colour rule as everything else: orange up to 25 points above the requirement, yellow to 50, green to 100, and grey after that. An ore stops giving skill 100 points past its requirement, which is why the ranges below are roughly that wide and why it is almost never worth staying anywhere longer.',
    'Mining is trained in five tiers and the bar simply stops moving when you hit one. The table marks where each falls. Master Mining is the one that surprises people: character level 40 and skill 275, from a trainer in Hellfire Peninsula rather than in Azeroth.',
  ],
  ranges: [
    {
      skillRange: [1, 65],
      zones: ['Dun Morogh', 'Elwynn Forest', 'The Barrens', 'Durotar', 'Mulgore', 'Tirisfal Glades', 'Darkshore'],
      recommendedCharacterLevel: '1-12',
      guidance:
        'Copper is the only ore you can touch until 65, and every starting zone has it, so the answer is usually "the zone you are already in". The exception is Teldrassil, which has no mineral nodes at all — night elves have to reach Darkshore before mining starts for them. Copper stays orange to 25 and yellow to 50, so the first fifty points come close to one per node.',
      zoneNotes: [
        {
          zone: 'Dun Morogh',
          note: 'The densest starting zone in our data, and the mine at Gol\'Bolar Quarry east of Kharanos is worth walking into rather than past.',
        },
        {
          zone: 'The Barrens',
          note: 'Much larger than the other starting zones, so the loop is longer — but it runs straight into the 65-125 range without changing zones.',
        },
      ],
      sources: [...TABLES, 'noobtoboss.com', 'warcraft.wiki.gg'],
    },
    {
      skillRange: [65, 125],
      zones: ['Loch Modan', 'Redridge Mountains', 'Ashenvale', 'Hillsbrad Foothills', 'The Barrens'],
      recommendedCharacterLevel: '15-30',
      guidance:
        'Tin opens at 65 and Silver at 75, and they share zones rather than having any of their own — Silver Veins are simply much rarer, so treat them as a bonus on a Tin loop rather than something to hunt. Copper keeps giving skill until 100 and is still worth taking on the way past.',
      zoneNotes: [
        {
          zone: 'Arathi Highlands',
          note: 'Carries the most Silver of any zone we have coordinates for, but it is a level 30-40 zone and you will be closer to 20 here. It is on this map because Silver is; come back for it during the 125-175 range.',
        },
        {
          zone: 'Loch Modan',
          note: 'The tightest loop in the range, and the one that does not need a mount.',
        },
      ],
      sources: [...TABLES, 'noobtoboss.com'],
    },
    {
      skillRange: [125, 175],
      zones: ['Arathi Highlands', 'Desolace', 'Thousand Needles', 'Stranglethorn Vale', 'Badlands'],
      recommendedCharacterLevel: '30-40',
      guidance:
        'Iron opens at 125 and Gold at 155, and this is the range that explains why Gold has no section of its own: Gold Veins sit in the same zones as Iron, on the same lap, so you pick them up without going looking. Silver is still here too and still worth mining. Thousand Needles and Badlands are the gentler alternatives if you arrived here under level 35 — both are widely recommended for this range and neither made the top three zones our ingest keeps per ore, so they have no map below.',
      zoneNotes: [
        {
          zone: 'Arathi Highlands',
          note: 'The standout — it carries Iron, Gold and Silver together, on a loop that fits inside one zone.',
        },
      ],
      sources: [...TABLES, 'noobtoboss.com'],
    },
    {
      skillRange: [175, 245],
      zones: ['The Hinterlands', 'Tanaris', 'Azshara', 'Un\'Goro Crater', 'Feralas'],
      recommendedCharacterLevel: '43-52',
      guidance:
        'Mithril at 175 is the long one — seventy points on essentially a single ore. Truesilver joins at 230 near the end and is rare enough to be a bonus rather than a plan. This is the range where a mount stops being optional.',
      zoneNotes: [
        {
          zone: 'The Hinterlands',
          note: 'The most recorded Mithril of any zone here, on a compact loop along the ridgelines.',
        },
        {
          zone: 'Tanaris',
          note: 'Flatter and faster to ride than the Hinterlands but thinner. The caves are worth entering — nodes sit deep enough inside not to be visible from the mouth.',
        },
      ],
      sources: [...TABLES, 'noobtoboss.com'],
    },
    {
      skillRange: [245, 275],
      zones: ['Un\'Goro Crater', 'Burning Steppes', 'Silithus'],
      recommendedCharacterLevel: '50-58',
      guidance:
        'Small Thorium Veins open at 245. These are genuinely sparse next to everything below them — the three zones here hold about sixty recorded spawns each, against several hundred for Iron or Fel Iron — so expect a real lap rather than a dense patch. It is thirty points and it is the slowest stretch of the climb.',
      zoneNotes: [
        {
          zone: 'Un\'Goro Crater',
          note: 'The perimeter loop takes in Small and Rich Thorium together, so it carries straight on into the next range without moving.',
        },
      ],
      sources: [...TABLES, 'noobtoboss.com'],
    },
    {
      skillRange: [275, 300],
      zones: ['Winterspring', 'Eastern Plaguelands', 'Azshara', 'Un\'Goro Crater'],
      recommendedCharacterLevel: '53-60',
      guidance:
        'Rich Thorium Veins open at 275 and drop several ore each, so the last twenty-five points before Outland go faster than the thirty before them. This is also where to stop and train Master Mining if you are level 40 or above — it needs skill 275 exactly, and the bar will not move past 300 without it.',
      sources: [...TABLES],
    },
    {
      skillRange: [300, 325],
      zones: ['Hellfire Peninsula', 'Zangarmarsh', 'Shadowmoon Valley'],
      recommendedCharacterLevel: '58-63',
      guidance:
        'Fel Iron at 300 is the first Outland ore, and Hellfire Peninsula is not a close call: it holds roughly three times the recorded Fel Iron of anywhere else, because it is the one Outland zone where Adamantite does not compete for the spawn slots. Every mining node in Hellfire is Fel Iron.',
      zoneNotes: [
        {
          zone: 'Hellfire Peninsula',
          note: 'Ride the ridgelines and the outer edge of the zone rather than the middle — that is where the deposits sit.',
        },
      ],
      sources: [...TABLES, 'noobtoboss.com', 'bytetavern.com'],
    },
    {
      skillRange: [325, 350],
      zones: ['Nagrand', 'Blade\'s Edge Mountains', 'Netherstorm', 'Terokkar Forest', 'Zangarmarsh'],
      recommendedCharacterLevel: '64-68',
      guidance:
        'Adamantite opens at 325 and does not spawn in Hellfire Peninsula at all, so this is the range where you have to move on. Fel Iron is still green and still worth taking on the way past. Go all the way to the back of any cave you enter — Outland nodes sit deep enough inside that they are invisible from the entrance.',
      sources: [...TABLES, 'noobtoboss.com'],
    },
    {
      skillRange: [350, 375],
      zones: ['Netherstorm', 'Shadowmoon Valley', 'Blade\'s Edge Mountains', 'Nagrand'],
      recommendedCharacterLevel: '67-70',
      guidance:
        'Rich Adamantite at 350 finishes the climb. Khorium needs 375, so you cannot mine a single vein of it while levelling — which is the point of capping rather than a footnote. Khorium Veins are a rare replacement spawn that lands mostly on Adamantite nodes, so the route you rode to 375 is the route you keep riding afterwards. Nagrand is the usual pick for that because it has the Adamantite density and does not need a flying mount.',
      sources: [...TABLES, 'noobtoboss.com', 'wowhead.com (object=181557)'],
    },
  ],
}

const herbalismGuide: GatheringGuide = {
  profession: 'Herbalism',
  intro: [
    'Herbalism levels off nodes in the world, so every range below is a zone choice. Herbs cluster much more tightly than ore does — a good herb zone is a handful of dense pockets rather than an even scatter — which is why the loops here are shorter and tighter than the mining ones.',
    'Herbs follow the same colour rule as ore: orange up to 25 points above the requirement, yellow to 50, green to 100, grey after. Most ranges below open two or three herbs at once, so the climb is smoother than Mining and there is rarely a stretch riding for a single plant.',
    'Training is the same five tiers, and Master Herbalism unlocks at character level 40 with skill 275 from a trainer in Hellfire Peninsula. The table marks every stop.',
  ],
  ranges: [
    {
      skillRange: [1, 70],
      zones: ['Tirisfal Glades', 'Teldrassil', 'Elwynn Forest', 'Durotar', 'Azuremyst Isle', 'Dun Morogh', 'Mulgore'],
      recommendedCharacterLevel: '1-12',
      guidance:
        'Peacebloom and Silverleaf are gatherable from skill 1, Earthroot joins at 15 and Mageroyal at 50. Every starting zone carries the first three, so this range is done wherever you happen to be — unlike Mining, Teldrassil is fine here. Tirisfal Glades is the densest zone in our data and the only starting zone carrying all three of the first herbs.',
      zoneNotes: [
        {
          zone: 'Tirisfal Glades',
          note: 'The one starting zone with Peacebloom, Silverleaf and Earthroot together, and the densest of any of them.',
        },
        {
          zone: 'Durotar',
          note: 'Peacebloom only in our data — plenty of it, but you will want a second zone for Silverleaf and Earthroot.',
        },
      ],
      sources: [...TABLES],
    },
    {
      skillRange: [70, 115],
      zones: ['Redridge Mountains', 'Duskwood', 'Silverpine Forest', 'Westfall', 'Wetlands', 'Stonetalon Mountains'],
      recommendedCharacterLevel: '15-25',
      guidance:
        'Briarthorn at 70, Stranglekelp at 85 and Bruiseweed at 100. Stranglekelp is the odd one: it grows underwater, along coastlines, so it rewards a zone with a shore and is worth skipping entirely if you would rather not swim. Redridge and Duskwood are the densest land routes here.',
      zoneNotes: [
        {
          zone: 'Westfall',
          note: 'The Stranglekelp zone of the three — it is along the coast rather than inland, so plan a shoreline lap rather than the usual loop.',
        },
      ],
      sources: [...TABLES],
    },
    {
      skillRange: [115, 150],
      zones: ['Stranglethorn Vale', 'Wetlands', 'Hillsbrad Foothills', 'Stonetalon Mountains', 'Arathi Highlands'],
      recommendedCharacterLevel: '25-35',
      guidance:
        'Wild Steelbloom at 115, Grave Moss at 120 and Kingsblood at 125. Grave Moss is worth knowing about rather than planning around — it grows near graveyards and crypts, so it turns up in odd pockets rather than across a zone. Stranglethorn carries the most of this range by a wide margin.',
      zoneNotes: [
        {
          zone: 'Stranglethorn Vale',
          note: 'Roughly twice the recorded spawns of anywhere else in this range, but it is contested ground on a PvP realm.',
        },
      ],
      sources: [...TABLES],
    },
    {
      skillRange: [150, 185],
      zones: ['Dustwallow Marsh', 'Stranglethorn Vale', 'Feralas', 'Swamp of Sorrows', 'Arathi Highlands'],
      recommendedCharacterLevel: '35-45',
      guidance:
        'Liferoot at 150, Fadeleaf at 160 and Goldthorn at 170. Liferoot grows beside water, which is why the marshes lead this range rather than the forests. Dustwallow Marsh and Stranglethorn are close in density and very different to ride — the marsh is flat and slow, Stranglethorn is dense and dangerous.',
      sources: [...TABLES],
    },
    {
      skillRange: [185, 230],
      zones: ['Feralas', 'Tanaris', 'Searing Gorge', 'Azshara', 'Alterac Mountains', 'The Hinterlands', 'Stranglethorn Vale', 'Eastern Plaguelands'],
      recommendedCharacterLevel: '45-55',
      guidance:
        'The widest range on the page, because five herbs open inside it: Khadgar\'s Whisker at 185, Wintersbite at 195, Firebloom at 205, Purple Lotus at 210 and Arthas\' Tears at 220. They do not share zones the way earlier groups do — Firebloom is a desert plant and Wintersbite a cold-weather one — so pick the zone that suits where your character already is rather than trying to cover all five.',
      zoneNotes: [
        {
          zone: 'Searing Gorge',
          note: 'Firebloom almost exclusively, and the densest Firebloom anywhere. A single-herb zone, but a very good one.',
        },
        {
          zone: 'Alterac Mountains',
          note: 'The only Wintersbite zone in our data, and the one zone in this app with no map art on the CDN — the route still computes, it just draws on a bare grid.',
        },
      ],
      sources: [...TABLES],
    },
    {
      skillRange: [230, 270],
      zones: ['Swamp of Sorrows', 'Azshara', 'Feralas', 'Un\'Goro Crater', 'The Hinterlands'],
      recommendedCharacterLevel: '50-58',
      guidance:
        'Sungrass at 230, Blindweed at 235 and Golden Sansam at 260. Blindweed is a water plant and Swamp of Sorrows holds far more of it than anywhere else. Sungrass is the workhorse of the range and is spread widely, so the zone choice here is mostly about which of the two you would rather ride for.',
      sources: [...TABLES],
    },
    {
      skillRange: [270, 300],
      zones: ['Winterspring', 'Eastern Plaguelands', 'Azshara', 'Silithus', 'Felwood'],
      recommendedCharacterLevel: '55-60',
      guidance:
        'Dreamfoil at 270, Mountain Silversage at 280 and Icecap at 290 close out Azeroth. Winterspring carries all three and is the standard answer. Black Lotus also becomes gatherable at 300, but it is a rare spawn with a handful of fixed points per zone and is not something to level on — it is worth knowing where it grows, not worth planning a lap around.',
      zoneNotes: [
        {
          zone: 'Winterspring',
          note: 'The densest zone of the range and the only one carrying Dreamfoil, Mountain Silversage and Icecap together.',
        },
      ],
      sources: [...TABLES],
    },
    {
      skillRange: [300, 325],
      zones: ['Hellfire Peninsula', 'Nagrand', 'Terokkar Forest', 'Zangarmarsh', 'Blade\'s Edge Mountains'],
      recommendedCharacterLevel: '58-64',
      guidance:
        'Felweed at 300 is the first Outland herb and it is everywhere — this is the easiest twenty-five points in the profession. Dreaming Glory joins at 315 and grows on rocky ground, so Nagrand and Blade\'s Edge start pulling ahead near the end of the range. You need Master Herbalism before any of this counts: level 40, skill 275, trainer in Hellfire Peninsula.',
      sources: [...TABLES],
    },
    {
      skillRange: [325, 350],
      zones: ['Terokkar Forest', 'Zangarmarsh', 'Shadowmoon Valley'],
      recommendedCharacterLevel: '62-67',
      guidance:
        'Terocone at 325 and Flame Cap at 335. Terokkar Forest is thick with Terocone and Zangarmarsh is thick with Flame Cap, so this range is genuinely a choice between two zones rather than a ranking. Ragveil also opens at 325 in Zangarmarsh — Wowhead publishes no spawn coordinates for it, so it has no map here, but it is on the ground alongside the Flame Caps.',
      zoneNotes: [
        {
          zone: 'Zangarmarsh',
          note: 'Flame Cap grows on and around the giant mushrooms rather than on open ground, which is why the cloud looks clustered rather than scattered.',
        },
      ],
      sources: [...TABLES],
    },
    {
      skillRange: [350, 375],
      zones: ['Netherstorm', 'Shadowmoon Valley', 'Terokkar Forest', 'Nagrand'],
      recommendedCharacterLevel: '67-70',
      guidance:
        'Netherbloom at 350 finishes the climb, with Nightmare Vine at 365 in Shadowmoon Valley if you would rather be there. Mana Thistle needs 375 and cannot be picked while levelling at all — like Khorium for miners, it is what the route is worth riding for once you have capped. It is also the thinnest node in Outland: three zones and well under a hundred recorded spawns between them.',
      sources: [...TABLES],
    },
  ],
}

export const gatheringGuides: readonly GatheringGuide[] = [miningGuide, herbalismGuide]
