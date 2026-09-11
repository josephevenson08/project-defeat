/**
 * What a profession is actually worth once you are 70.
 *
 * **This exists because the app promised it and did not deliver it.** The landing page has said
 * "how to take a profession to 375 without wasting materials, and what each one is actually worth at
 * 70" since the Professions tab was built; the first half is the levelling guides, and nothing
 * anywhere answered the second half. A claim in your own copy that no code path satisfies is the
 * same class of defect as a wrong number.
 *
 * **Almost none of it is a stat bonus, and getting that wrong is the easy mistake.** The roadmap
 * item this closes was written as "profession *bonuses to stats* (e.g. extra sockets from
 * Blacksmithing)" — which is Wrath. So are Herbalism's Lifeblood, Mining's Toughness and Skinning's
 * Master of Anatomy, and so is Leatherworking's Fur Lining. In The Burning Crusade exactly one
 * profession gives a level 70 character an always-on stat bonus, and it is Enchanting. Everything
 * else is *access*: bind-on-pickup gear only you can wear, or a consumable only you can make.
 *
 * That distinction is carried in `kind` rather than flattened, because it changes what a player does
 * with the information. A stat bonus is a number you can add up; gear access is a slot you now have a
 * different option for; a gathering profession's payoff is entirely in what it feeds.
 */

import type { Profession } from './professionTypes'

/**
 * What sort of payoff this is.
 *
 * - `stat` — an always-on bonus to your character sheet. One profession in the whole expansion.
 * - `gear` — bind-on-pickup equipment only this profession can wear.
 * - `utility` — something you can do that others cannot, which is not a stat on you.
 * - `feeds` — no direct payoff; the value is in what it supplies. The gathering professions.
 */
export type PayoffKind = 'stat' | 'gear' | 'utility' | 'feeds'

export type ProfessionPerk = {
  name: string
  kind: PayoffKind
  detail: string
  /** Profession skill needed, where the perk states one. */
  requiresSkill?: number
  /**
   * The content phase this first becomes available.
   *
   * **Recorded because this app plans Phase 2**, and "Jewelcrafting gets exclusive trinkets" is
   * materially different advice when those trinkets are three phases away. Omitted rather than
   * guessed where the phase was not confirmed.
   */
  phase?: number
  needsVerification?: boolean
  notes?: string
}

export type ProfessionPayoff = {
  profession: Profession
  /** One sentence a player can decide on: is this worth carrying to 70, and what for. */
  verdict: string
  perks: readonly ProfessionPerk[]
  sources: readonly string[]
}

const VEINS = 'icy-veins.com'
const WOWHEAD = 'wowhead.com'

/**
 * The three gathering professions, which in TBC give a level 70 character nothing at all.
 *
 * **This is the entry most worth writing down, because the opposite is so widely assumed.** Lifeblood,
 * Toughness and Master of Anatomy are the reason people expect Herbalism, Mining and Skinning to
 * carry stats, and all three arrived in Wrath. Saying "no combat bonus in TBC" plainly is more useful
 * than an empty section, which reads as data we have not got round to.
 */
function gatheringPayoff(profession: Profession, feeds: string, verdict: string): ProfessionPayoff {
  return {
    profession,
    verdict,
    perks: [
      {
        name: 'No combat bonus in TBC',
        kind: 'feeds',
        detail: `Gathering professions gained their stat perks in Wrath, not here — Lifeblood, Toughness and Master of Anatomy are all later additions. In The Burning Crusade the whole payoff is ${feeds}`,
      },
    ],
    sources: [VEINS, 'warcrafttavern.com'],
  }
}

export const professionPayoffs: readonly ProfessionPayoff[] = [
  {
    profession: 'Enchanting',
    verdict:
      'The only profession in the expansion that puts a permanent stat bonus on your character sheet, and it applies to both rings.',
    perks: [
      {
        name: 'Enchant Ring - Stats',
        kind: 'stat',
        detail: '+4 all stats per ring, so +8 across both. Honored with Lower City buys the formula.',
        notes: 'Wowhead spell 27927 carries the flag "target must be own item" — no one can do this for you.',
      },
      {
        name: 'Enchant Ring - Striking',
        kind: 'stat',
        detail: '+2 weapon damage per ring, so +4 across both. Revered with The Consortium.',
      },
      {
        name: 'Enchant Ring - Spellpower',
        kind: 'stat',
        detail: '+12 damage and healing per ring, so +24 across both. Honored with Keepers of Time.',
      },
      {
        name: 'Enchant Ring - Healing Power',
        kind: 'stat',
        detail: '+20 healing per ring, so +40 across both. Revered with The Sha\'tar.',
      },
    ],
    sources: [VEINS, `${WOWHEAD} (spell=27927)`],
  },
  {
    profession: 'Jewelcrafting',
    verdict:
      'Cut your own gems for every socket you own, and — from Sunwell — trinkets and necklaces nobody else can wear.',
    perks: [
      {
        name: 'Figurine trinkets',
        kind: 'gear',
        detail:
          'Five bind-on-pickup trinkets that require Jewelcrafting to equip — Crimson Serpent, Khorium Boar, Empyrean Tortoise, Seaspray Albatross and Shadowsong Panther, one per role.',
        requiresSkill: 375,
        phase: 5,
        needsVerification: true,
        notes: 'The set and the Jewelcrafting requirement are confirmed; the individual stat blocks were not read off tooltips.',
      },
      {
        name: 'Jewelcrafter-only necklaces',
        kind: 'gear',
        detail: 'Hard Khorium Choker, Pendant of Sunfire and Amulet of Flowing Life, all bind-on-pickup.',
        phase: 5,
        needsVerification: true,
      },
      {
        name: 'Cutting your own gems',
        kind: 'utility',
        detail:
          'The everyday payoff, and the one available from the day you hit 375. Gems themselves are tradeable — TBC Jewelcrafting has no bind-on-pickup gems, which is a Wrath idea.',
      },
    ],
    sources: [VEINS, WOWHEAD],
  },
  {
    profession: 'Alchemy',
    verdict:
      'Flasks that survive death, transmutes half the other professions depend on, and a specialisation that pays you roughly a sixth more output for free.',
    perks: [
      {
        name: 'Alchemist Stone trinkets',
        kind: 'gear',
        detail:
          'Assassin\'s, Redeemer\'s, Guardian\'s and Sorcerer\'s Alchemist Stone — epic trinkets crafted at Alchemy 375, one per role.',
        requiresSkill: 375,
        phase: 5,
        needsVerification: true,
        notes: 'Item ids 35750/35751 place these in the Sunwell tier; the earlier Alchemist\'s Stone is a classic-era item. Individual stat blocks not read off tooltips.',
      },
      {
        name: 'Elixir, Potion or Transmute Master',
        kind: 'utility',
        detail:
          'Pick one and that category has a chance to produce extra on every craft — measured at roughly 17% more output on average.',
      },
      {
        name: 'Flasks and transmutes',
        kind: 'utility',
        detail:
          'Flasks persist through death, which is what makes them a raid consumable rather than a pull consumable. Primal Might and the Skyfire Diamonds other professions need come from transmutes.',
      },
    ],
    sources: [VEINS, WOWHEAD],
  },
  {
    profession: 'Engineering',
    verdict:
      'Eleven epic goggles, one for every armour type and role, plus a pile of gadgets no other profession has.',
    perks: [
      {
        name: 'Epic goggles',
        kind: 'gear',
        detail:
          'All eleven require Engineering 350 to equip and are taught by Outland trainers at 350 — a head slot you craft rather than compete for.',
        requiresSkill: 350,
      },
      {
        name: 'Gadgets',
        kind: 'utility',
        detail:
          'Rocket boots, bombs, repair bots and the rest. None of it is a stat, all of it is something nobody else in the raid can do.',
      },
    ],
    sources: [VEINS, 'warcrafttavern.com'],
  },
  {
    profession: 'Leatherworking',
    verdict:
      'Drums, which the raid needs someone to bring — and which are the clearest case of a profession whose payoff lands on other people.',
    perks: [
      {
        name: 'Drums',
        kind: 'utility',
        detail:
          'Drums of Battle and its siblings buff the whole party, not you alone, and several leatherworkers rotating them keeps the buff up. Greater versions later gain 40-yard range and an instant cast.',
      },
      {
        name: 'Specialisation gear',
        kind: 'gear',
        detail: 'Dragonscale, Elemental and Tribal each unlock bind-on-pickup pieces the others cannot make.',
        needsVerification: true,
      },
      {
        name: 'No Fur Lining in TBC',
        kind: 'feeds',
        detail:
          'The self-only bracer enchants people remember are a Wrath addition. Leatherworking gives you nothing here that you wear and nobody else could.',
      },
    ],
    sources: [VEINS, 'noobtoboss.com'],
  },
  {
    profession: 'Blacksmithing',
    verdict:
      'Plate and weapons that soulbind to you the moment you make them — and, contrary to what nearly everyone remembers, no extra sockets.',
    perks: [
      {
        name: 'Armorsmith or Weaponsmith',
        kind: 'gear',
        detail:
          'Armorsmithing makes Breastplate of Kings, Bulwark of Kings and the Nether Chain Shirt line; the three weapon specialisations make Lionheart Blade, Thunder, Drakefist Hammer, Lunar Crescent and The Planar Edge. All bind on pickup.',
      },
      {
        name: 'No socket bracer or gloves in TBC',
        kind: 'feeds',
        detail:
          'Adding two gem slots to your own bracers and gloves is a Wrath perk that needs Blacksmithing 400. It does not exist here, and it is the single most common thing people expect Blacksmithing to do.',
      },
    ],
    sources: [VEINS, WOWHEAD],
  },
  {
    profession: 'Tailoring',
    verdict:
      'Three bind-on-pickup sets, one of which is the strongest caster gear available outside a raid.',
    perks: [
      {
        name: 'Spellfire, Shadoweave and Primal Mooncloth',
        kind: 'gear',
        detail:
          'Pick a specialisation and you can make that set. Spellfire is the caster damage set, Shadoweave the shadow one, Primal Mooncloth the healing one.',
        needsVerification: true,
        notes: 'The three sets and their roles are confirmed; the set bonuses were not read off tooltips.',
      },
      {
        name: 'Bags',
        kind: 'utility',
        detail: 'Not a stat, and the thing a tailor is thanked for most often.',
      },
    ],
    sources: [VEINS, 'noobtoboss.com'],
  },
  gatheringPayoff(
    'Herbalism',
    'what it supplies: every flask, elixir and potion an alchemist makes starts here.',
    'No bonus to your character at all — it is the supply line for Alchemy, and it pays in gold rather than stats.',
  ),
  gatheringPayoff(
    'Mining',
    'what it supplies: Blacksmithing, Engineering and Jewelcrafting all run on ore.',
    'No bonus to your character at all — it feeds three crafting professions and is the most reliably sellable gathering skill in the expansion.',
  ),
  gatheringPayoff(
    'Skinning',
    'what it supplies: Leatherworking, and the drums the raid wants, run on leather.',
    'No bonus to your character at all — but it is the only gathering profession that costs you no extra time, since the skill comes off mobs you were killing anyway.',
  ),
  {
    profession: 'Cooking',
    verdict: 'A well-fed buff every raid night, which is a real stat bonus that simply is not permanent.',
    perks: [
      {
        name: 'Well Fed',
        kind: 'utility',
        detail:
          'Outland food gives a sizeable stat buff for 30 minutes and survives anything but death. Anyone can eat it; a cook does not have to buy it.',
      },
    ],
    sources: [VEINS],
  },
  {
    profession: 'First Aid',
    verdict: 'A free heal on a cooldown that does not share with your class, which matters most to those who have none.',
    perks: [
      {
        name: 'Heavy Netherweave Bandage',
        kind: 'utility',
        detail:
          'Self-healing out of combat for classes that cannot heal themselves, and a genuine cooldown-free option between pulls.',
      },
    ],
    sources: [VEINS],
  },
  {
    profession: 'Fishing',
    verdict: 'The supply line for Cooking, and the only way to get a few of the best food buffs in the expansion.',
    perks: [
      {
        name: 'Furious Crawdad and the Outland pools',
        kind: 'feeds',
        detail:
          'Terokkar\'s Highland Mixed Schools hold the fish behind the strongest melee food in TBC. Nothing about fishing itself is a stat.',
      },
    ],
    sources: [VEINS],
  },
]

export function payoffFor(profession: Profession): ProfessionPayoff | undefined {
  return professionPayoffs.find((payoff) => payoff.profession === profession)
}

/**
 * The one profession whose payoff is a number on your character sheet.
 *
 * Exported so a test can assert the count rather than a reader having to trust the prose above — if
 * a future edit adds a second `stat` profession to TBC, that is either a real discovery or a Wrath
 * perk leaking in, and both deserve to stop the suite.
 */
export const professionsWithStatPayoff: readonly Profession[] = professionPayoffs
  .filter((payoff) => payoff.perks.some((perk) => perk.kind === 'stat'))
  .map((payoff) => payoff.profession)
