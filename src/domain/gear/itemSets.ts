import type { GearItem } from './itemTypes'

/**
 * A single set bonus, and — importantly — whether this simulator can act on it.
 *
 * Across all seventy-one bonuses of Tier 4 and Tier 5 — every one of them, now that both set lists
 * are complete — **not one is an unconditional flat stat addition.** They are ability-specific
 * ("your Overpower grants 100 attack power", "Starfire damage increased by 10%"), resource-specific
 * ("Bloodthirst and Mortal Strike cost 5 less rage"), pet, talent or form scaling, cooldown
 * reductions, or they benefit the party rather than the wearer. Recording them as stats would
 * therefore be inventing numbers, not approximating them — the same category error that had four
 * healer relics carrying flat healing power.
 *
 * Three come close, and each fails for a different reason worth keeping in view:
 * - Cataclysm Harness 4-piece grants haste, which the engine reads, but through Flurry — a talent
 *   proc, so a flat 5% would be an invented uptime rather than an approximated one.
 * - Malorne Harness 4-piece grants 1400 armor, but only in Bear Form.
 * - Malorne Harness 4-piece also grants 30 Strength, but only in Cat Form. This is the single
 *   nearest miss in either tier: the app already treats Feral as a cat-form physical DPS, so this
 *   one would be applicable if form were a first-class concept rather than an implicit assumption.
 *
 * So `modelled` is false everywhere for now, and `whyNotModelled` says what would need to exist
 * first. That is deliberately visible rather than silent: a BiS ranking built from itemised stats
 * undervalues tier pieces, and a reader deserves to see by how much and why.
 */
export type SetBonus = {
  /** Number of set pieces required — 2 or 4 for TBC tier sets. */
  pieces: number
  /** The tooltip text, verbatim where it was sourced. */
  description: string
  /** True only when the simulator actually applies it. */
  modelled: boolean
  /** What the engine would need before this could be applied. */
  whyNotModelled?: string
}

export type ItemSet = {
  id: string
  name: string
  /** Which raid tier the set belongs to. 4 is Karazhan/Gruul/Magtheridon, 5 is SSC/Tempest Keep. */
  tier: 4 | 5
  /** Total pieces in the set. TBC tier sets are five. */
  totalPieces: number
  bonuses: readonly SetBonus[]
  /**
   * Wowhead item id whose tooltip the bonus text was read from. An item page embeds the whole set
   * listing and its "(2) Set:" / "(4) Set:" lines, so one piece is enough to source both bonuses —
   * and recording which one makes the description checkable rather than merely plausible.
   */
  sourcedFrom?: number
  needsVerification?: boolean
  notes?: string
}

const ABILITY_SPECIFIC = 'Applies to a named ability rather than to stats. The engine models one signature ability per spec and has no per-ability damage or cost modifiers, so there is nothing for this to attach to.'
const RESOURCE = 'Changes a resource cost, or grants resource back. Rage and mana are not modelled as constraints, so neither a discount nor a refund has an effect to express.'
const PARTY = 'Benefits the party rather than the wearer, and this simulator models a single character.'
const TRIGGER = 'A proc whose trigger rate the engine does not model — being hit, or landing a spell crit — so its uptime cannot be derived the way an item proc with a stated internal cooldown can.'
const PET = 'Pets are not modelled at all.'
const TALENT = 'Scales a talent. There are no talent trees in this app, so the ability it modifies does not exist to be modified.'
const COOLDOWN = 'Shortens the cooldown of an ability the engine neither models nor schedules, so there is no cooldown for it to shorten.'
const TOTEM_BUFF = 'Raises the value of a raid buff listed separately on the Buffs panel. Set bonuses are not applied, and the buff entry already records the improved figure in its own notes — applying it here as well would double-count it.'
const FORM = 'Conditional on a shapeshift form. Forms are an implicit assumption in this app rather than a modelled state, so there is no form to test before applying it.'

/**
 * All thirty-four tier sets of Tier 4 and Tier 5 — seventeen each, one per class per role. Every
 * bonus below is the verbatim tooltip text, read off the Wowhead item page named in `sourcedFrom`
 * with `tools/ingest/wowhead-lookup.mjs`; an item tooltip embeds its whole set listing, so one piece
 * sources every bonus the set has.
 *
 * Tier 5 began as nine sets whose four-piece bonuses were unreachable, because only Head and Chest
 * were catalogued. All five slots of all thirty-four sets now carry a `setId`, so every bonus is
 * reachable in the app.
 *
 * Tier 4 is here as well as Tier 5 because a Phase 2 raider is still wearing pieces of it — the
 * two-piece bonuses in particular survive well into SSC and Tempest Keep. Most sets carry exactly
 * one 2-piece and one 4-piece, but not all: Voidheart Raiment splits its 2-piece across shadow and
 * fire, and Malorne Harness splits both tiers across Bear and Cat form, so `bonuses` is a list and
 * not a pair.
 *
 * The catalogue knows 222 set names in total. The remaining 188 — Tier 6, dungeon and PvP sets,
 * including 17 Gladiator sets that sit at almost exactly Tier 4's item level — are deliberately
 * undefined and show nothing rather than inventing bonuses.
 */
export const sampleItemSets: readonly ItemSet[] = [
  {
    id: 'destroyer-battlegear',
    name: 'Destroyer Battlegear',
    tier: 5,
    totalPieces: 5,
    sourcedFrom: 30118,
    bonuses: [
      { pieces: 2, description: 'Your Overpower ability now grants you 100 attack power for 5 sec.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
      { pieces: 4, description: 'Your Bloodthirst and Mortal Strike abilities cost 5 less rage.', modelled: false, whyNotModelled: RESOURCE },
    ],
  },
  {
    id: 'destroyer-armor',
    name: 'Destroyer Armor',
    tier: 5,
    totalPieces: 5,
    sourcedFrom: 30113,
    bonuses: [
      { pieces: 2, description: 'Each time you use your Shield Block ability, you gain 100 block value against a single attack in the next 6 sec.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
      { pieces: 4, description: 'You have a chance each time you are hit to gain 200 haste rating for 10 sec. (Proc chance: 7%)', modelled: false, whyNotModelled: TRIGGER },
    ],
  },
  {
    id: 'crystalforge-raiment',
    name: 'Crystalforge Raiment',
    tier: 5,
    totalPieces: 5,
    sourcedFrom: 30134,
    bonuses: [
      { pieces: 2, description: 'Each time you cast a Judgement, your party members gain 50 mana.', modelled: false, whyNotModelled: PARTY },
      { pieces: 4, description: 'Your critical heals from Flash of Light and Holy Light reduce the cast time of your next Holy Light spell by 0.50 sec for 10 sec. This effect cannot occur more than once per minute. (1m cooldown)', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
    ],
  },
  {
    id: 'crystalforge-armor',
    name: 'Crystalforge Armor',
    tier: 5,
    totalPieces: 5,
    sourcedFrom: 30123,
    bonuses: [
      { pieces: 2, description: 'Increases the damage from your Retribution Aura by 15.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
      { pieces: 4, description: 'Each time you use your Holy Shield ability, you gain 100 block value against a single attack in the next 6 sec.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
    ],
  },
  {
    id: 'crystalforge-battlegear',
    name: 'Crystalforge Battlegear',
    tier: 5,
    totalPieces: 5,
    sourcedFrom: 30129,
    bonuses: [
      { pieces: 2, description: 'Reduces the cost of your Judgements by 35.', modelled: false, whyNotModelled: RESOURCE },
      { pieces: 4, description: 'Each time you cast a Judgement, there is a chance it will heal all nearby party members for 244 to 256. (Proc chance: 6%)', modelled: false, whyNotModelled: PARTY },
    ],
    notes: 'This set was the one entry flagged as paraphrased rather than verbatim, and the paraphrase was wrong as well as vague: it described the 4-piece as triggering on "a Judgement-related critical strike", when the real bonus is a flat 6% chance on any Judgement cast, crit or not.',
  },
  {
    id: 'nordrassil-regalia',
    name: 'Nordrassil Regalia',
    tier: 5,
    totalPieces: 5,
    sourcedFrom: 30231,
    bonuses: [
      { pieces: 2, description: 'When you shift out of Moonkin Form, your next Regrowth spell costs 450 less mana.', modelled: false, whyNotModelled: RESOURCE },
      { pieces: 4, description: 'Increases your Starfire damage against targets afflicted with Moonfire or Insect Swarm by 10%.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
    ],
    notes: 'The 4-piece bonus is one of the few that would be expressible if the engine had per-ability damage modifiers — Starfire is exactly the ability the Balance path already models.',
  },
  {
    id: 'nordrassil-raiment',
    name: 'Nordrassil Raiment',
    tier: 5,
    totalPieces: 5,
    sourcedFrom: 30216,
    bonuses: [
      { pieces: 2, description: 'Increases the duration of your Regrowth spell by 6 sec.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
      { pieces: 4, description: 'Increases the final amount healed by your Lifebloom spell by 150.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
    ],
    notes: 'The 4-piece bonus attaches to Lifebloom, which is the ability the Restoration path already models — another candidate if per-ability modifiers are ever added.',
  },
  {
    id: 'nordrassil-harness',
    name: 'Nordrassil Harness',
    tier: 5,
    totalPieces: 5,
    sourcedFrom: 30222,
    bonuses: [
      { pieces: 2, description: 'When you shift out of Bear Form, Dire Bear Form, or Cat Form, your next Regrowth spell takes 2.0 fewer sec. to cast.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
      { pieces: 4, description: 'Your Shred ability deals an additional 75 damage, and your Lacerate ability does an additional 15 per application.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
    ],
  },
  {
    id: 'rift-stalker-armor',
    name: 'Rift Stalker Armor',
    tier: 5,
    totalPieces: 5,
    sourcedFrom: 30139,
    bonuses: [
      { pieces: 2, description: 'Causes your pet to be healed for 15% of the damage you deal.', modelled: false, whyNotModelled: PET },
      { pieces: 4, description: 'Your Steady Shot ability has 5% increased critical strike chance.', modelled: false, whyNotModelled: 'Steady Shot is explicitly excluded from the rotation model, because its sustained rate depends on auto-shot weaving the engine does not track.' },
    ],
  },
  {
    id: 'tirisfal-regalia',
    name: 'Tirisfal Regalia',
    tier: 5,
    totalPieces: 5,
    sourcedFrom: 30196,
    bonuses: [
      { pieces: 2, description: 'Increases the damage and mana cost of Arcane Blast by 20%.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
      { pieces: 4, description: 'Your spell critical strikes grant you up to 70 spell damage for 6 sec.', modelled: false, whyNotModelled: TRIGGER },
    ],
    notes: 'The 2-piece bonus attaches to Arcane Blast, which the Arcane path already models — but it raises mana cost as well as damage, and mana is not a modelled constraint, so applying only the damage half would flatter it.',
  },
  {
    id: 'avatar-regalia',
    name: 'Avatar Regalia',
    tier: 5,
    totalPieces: 5,
    sourcedFrom: 30159,
    bonuses: [
      { pieces: 2, description: 'Each time you cast an offensive spell, there is a chance your next spell will cost 150 less mana. (Proc chance: 6%)', modelled: false, whyNotModelled: RESOURCE },
      { pieces: 4, description: 'Each time your Shadow Word: Pain deals damage, it has a chance to grant your next spell cast within 15 sec up to 100 damage and healing. (Proc chance: 40%)', modelled: false, whyNotModelled: TRIGGER },
    ],
    notes: 'The 4-piece bonus states its proc chance, but it triggers off Shadow Word: Pain ticking — the engine models one signature ability per spec and no damage-over-time schedule, so there is no tick rate to multiply the 40% against.',
  },
  {
    id: 'avatar-raiment',
    name: 'Avatar Raiment',
    tier: 5,
    totalPieces: 5,
    sourcedFrom: 30150,
    bonuses: [
      { pieces: 2, description: 'If your Greater Heal brings the target to full health, you gain 100 mana.', modelled: false, whyNotModelled: RESOURCE },
      { pieces: 4, description: 'Increases the duration of your Renew spell by 3 sec.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
    ],
  },
  {
    id: 'deathmantle',
    name: 'Deathmantle',
    tier: 5,
    totalPieces: 5,
    sourcedFrom: 30144,
    bonuses: [
      { pieces: 2, description: 'Your Eviscerate and Envenom abilities cause 40 extra damage per combo point.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
      { pieces: 4, description: 'Your attacks have a chance to make your next finishing move cost no energy.', modelled: false, whyNotModelled: TRIGGER },
    ],
    notes: 'Alone among the Tier 5 bonuses catalogued here, the 4-piece states no proc chance at all — so even the energy saving, which is the one resource this engine does reason about when deriving a special\'s rate, has no rate to apply it at.',
  },
  {
    id: 'cataclysm-regalia',
    name: 'Cataclysm Regalia',
    tier: 5,
    totalPieces: 5,
    sourcedFrom: 30169,
    bonuses: [
      { pieces: 2, description: 'Each time you cast an offensive spell, there is a chance your next Lesser Healing Wave will cost 380 less mana. (Proc chance: 7%)', modelled: false, whyNotModelled: RESOURCE },
      { pieces: 4, description: 'Your Lightning Bolt critical strikes have a chance to grant you 120 mana. (Proc chance: 25%)', modelled: false, whyNotModelled: RESOURCE },
    ],
  },
  {
    id: 'cataclysm-raiment',
    name: 'Cataclysm Raiment',
    tier: 5,
    totalPieces: 5,
    sourcedFrom: 30164,
    bonuses: [
      { pieces: 2, description: 'Reduces the cost of your Lesser Healing Wave spell by 5%.', modelled: false, whyNotModelled: RESOURCE },
      { pieces: 4, description: 'Your critical heals from Healing Wave, Lesser Healing Wave, and Chain Heal reduce the cast time of your next Healing Wave spell by 0.50 sec for 10 sec. This effect cannot occur more than once per minute. (1m cooldown)', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
    ],
  },
  {
    id: 'cataclysm-harness',
    name: 'Cataclysm Harness',
    tier: 5,
    totalPieces: 5,
    sourcedFrom: 30185,
    bonuses: [
      { pieces: 2, description: 'Your melee attacks have a chance to reduce the cast time of your next Lesser Healing Wave by 1.5 sec. (Proc chance: 2%)', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
      { pieces: 4, description: 'You gain 5% additional haste from your Flurry ability.', modelled: false, whyNotModelled: TALENT },
    ],
    notes: 'The 4-piece is the closest any Tier 5 bonus comes to a flat stat — it is haste, which the engine does read. But it is haste *from Flurry*, a talent proc, so applying 5% haste unconditionally would be inventing an uptime rather than approximating one.',
  },
  {
    id: 'corruptor-raiment',
    name: 'Corruptor Raiment',
    tier: 5,
    totalPieces: 5,
    sourcedFrom: 30211,
    bonuses: [
      { pieces: 2, description: 'Causes your pet to be healed for 15% of the damage you deal.', modelled: false, whyNotModelled: PET },
      { pieces: 4, description: 'Your Shadowbolt spell hits increase the damage of Corruption by 10% and your Incinerate spell hits increase the damage of Immolate by 10%.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
    ],
  },

  // ---- Tier 4 (Karazhan, Gruul's Lair, Magtheridon's Lair) ----
  {
    id: 'warbringer-battlegear',
    name: 'Warbringer Battlegear',
    tier: 4,
    totalPieces: 5,
    sourcedFrom: 29019,
    bonuses: [
      { pieces: 2, description: 'Your Whirlwind ability costs 5 less rage.', modelled: false, whyNotModelled: RESOURCE },
      { pieces: 4, description: 'You gain an additional 2 rage each time one of your attacks is parried or dodged.', modelled: false, whyNotModelled: RESOURCE },
    ],
  },
  {
    id: 'warbringer-armor',
    name: 'Warbringer Armor',
    tier: 4,
    totalPieces: 5,
    sourcedFrom: 29011,
    bonuses: [
      { pieces: 2, description: 'You have a chance each time you parry to gain Blade Turning, absorbing 200 damage for 15 sec. (Proc chance: 25%)', modelled: false, whyNotModelled: TRIGGER },
      { pieces: 4, description: 'Your Revenge ability causes your next damaging ability to do 10% more damage.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
    ],
  },
  {
    id: 'justicar-armor',
    name: 'Justicar Armor',
    tier: 4,
    totalPieces: 5,
    sourcedFrom: 29066,
    bonuses: [
      { pieces: 2, description: 'Increases the damage dealt by your Seal of Righteousness, Seal of Vengeance, or Seal of [Blood][the Martyr] by 10%.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
      { pieces: 4, description: 'Increases the damage dealt by your Holy Shield by 15.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
    ],
    notes: 'The bracketed "[Blood][the Martyr]" in the 2-piece is the tooltip\'s own faction switch, not a transcription artefact — Horde Paladins get Seal of Blood, Alliance get Seal of the Martyr. Left verbatim rather than resolved to one faction.',
  },
  {
    id: 'justicar-battlegear',
    name: 'Justicar Battlegear',
    tier: 4,
    totalPieces: 5,
    sourcedFrom: 29071,
    bonuses: [
      { pieces: 2, description: 'Increases the damage bonus of your Judgement of the Crusader by 15%.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
      { pieces: 4, description: 'Increases the damage dealt by your Judgement of Command by 10%.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
    ],
  },
  {
    id: 'justicar-raiment',
    name: 'Justicar Raiment',
    tier: 4,
    totalPieces: 5,
    sourcedFrom: 29061,
    bonuses: [
      { pieces: 2, description: 'Increases the amount healed by your Judgement of Light by 20.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
      { pieces: 4, description: 'Reduces the cooldown on your Divine Favor ability by 15 sec.', modelled: false, whyNotModelled: COOLDOWN },
    ],
  },
  {
    id: 'aldor-regalia',
    name: 'Aldor Regalia',
    tier: 4,
    totalPieces: 5,
    sourcedFrom: 29076,
    bonuses: [
      { pieces: 2, description: 'Gives you a 100% chance to avoid interruption caused by damage while casting Fireball or Frostbolt.', modelled: false, whyNotModelled: 'Prevents spell pushback. The engine already assumes uninterrupted casting, so this bonus is silently baked into every result — modelling it would mean first modelling the incoming damage it protects against.' },
      { pieces: 4, description: 'Reduces the cooldown on Presence of Mind by 24 sec, on Blast Wave by 4 sec, and on Ice Block by 40 sec.', modelled: false, whyNotModelled: COOLDOWN },
    ],
  },
  {
    id: 'demon-stalker-armor',
    name: 'Demon Stalker Armor',
    tier: 4,
    totalPieces: 5,
    sourcedFrom: 29081,
    bonuses: [
      { pieces: 2, description: 'Reduces the chance your Feign Death ability will be resisted by 5%.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
      { pieces: 4, description: 'Reduces the mana cost of your Multi-Shot ability by 10%.', modelled: false, whyNotModelled: RESOURCE },
    ],
  },
  {
    id: 'netherblade',
    name: 'Netherblade',
    tier: 4,
    totalPieces: 5,
    sourcedFrom: 29044,
    bonuses: [
      { pieces: 2, description: 'Increases the duration of your Slice and Dice ability by 3 sec.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
      { pieces: 4, description: 'Your finishing moves have a 15% chance to grant you a combo point. (Proc chance: 15%)', modelled: false, whyNotModelled: 'Grants combo points, which the engine does not track — it derives a special attack\'s rate from a cooldown or an energy cost, never from a combo-point budget.' },
    ],
  },
  {
    id: 'incarnate-raiment',
    name: 'Incarnate Raiment',
    tier: 4,
    totalPieces: 5,
    sourcedFrom: 29049,
    bonuses: [
      { pieces: 2, description: 'Your Prayer of Healing spell now also causes an additional 150 healing over 9 sec.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
      { pieces: 4, description: 'Each time you cast Flash Heal, your next Greater Heal cast within 15 sec has its casting time reduced by 0.1, stacking up to 5 times.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
    ],
  },
  {
    id: 'incarnate-regalia',
    name: 'Incarnate Regalia',
    tier: 4,
    totalPieces: 5,
    sourcedFrom: 29056,
    bonuses: [
      { pieces: 2, description: 'Your Shadowfiend now has 75 more stamina and lasts 3 sec. longer.', modelled: false, whyNotModelled: PET },
      { pieces: 4, description: 'Your Mind Flay and Smite spells deal 5% more damage.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
    ],
  },
  {
    id: 'malorne-harness',
    name: 'Malorne Harness',
    tier: 4,
    totalPieces: 5,
    sourcedFrom: 29096,
    bonuses: [
      { pieces: 2, description: 'Your melee attacks in Bear Form and Dire Bear Form have a chance to generate 10 additional rage. (Proc chance: 4%)', modelled: false, whyNotModelled: RESOURCE },
      { pieces: 2, description: 'Your melee attacks in Cat Form have a chance to generate 20 additional energy. (Proc chance: 4%)', modelled: false, whyNotModelled: RESOURCE },
      { pieces: 4, description: 'Increases your armor by 1400 in Bear Form and Dire Bear Form.', modelled: false, whyNotModelled: FORM },
      { pieces: 4, description: 'Increases your strength by 30 in Cat Form.', modelled: false, whyNotModelled: FORM },
    ],
    notes: 'Four bonuses, not two — each tier splits across Bear and Cat. The Cat Form 4-piece is the closest either tier comes to being applicable: 30 Strength is exactly the kind of flat stat the engine reads, and the app already treats Feral as cat-form physical DPS. It stays unapplied because form is an implicit assumption here rather than modelled state, so nothing distinguishes a cat from a bear to gate it on.',
  },
  {
    id: 'malorne-raiment',
    name: 'Malorne Raiment',
    tier: 4,
    totalPieces: 5,
    sourcedFrom: 29086,
    bonuses: [
      { pieces: 2, description: 'Your helpful spells have a chance to restore up to 120 mana. (Proc chance: 5%)', modelled: false, whyNotModelled: RESOURCE },
      { pieces: 4, description: 'Reduces the cooldown on your Nature\'s Swiftness ability by 24 sec.', modelled: false, whyNotModelled: COOLDOWN },
    ],
  },
  {
    id: 'malorne-regalia',
    name: 'Malorne Regalia',
    tier: 4,
    totalPieces: 5,
    sourcedFrom: 29091,
    bonuses: [
      { pieces: 2, description: 'Your harmful spells have a chance to restore up to 120 mana. (Proc chance: 5%)', modelled: false, whyNotModelled: RESOURCE },
      { pieces: 4, description: 'Reduces the cooldown on your Innervate ability by 48 sec.', modelled: false, whyNotModelled: COOLDOWN },
    ],
  },
  {
    id: 'cyclone-harness',
    name: 'Cyclone Harness',
    tier: 4,
    totalPieces: 5,
    sourcedFrom: 29038,
    bonuses: [
      { pieces: 2, description: 'Your Strength of Earth Totem ability grants an additional 12 strength.', modelled: false, whyNotModelled: TOTEM_BUFF },
      { pieces: 4, description: 'Your Stormstrike ability does an additional 30 damage per weapon.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
    ],
    notes: 'The 2-piece is spell 37223, "Improved Strength of Earth" — a set bonus despite the name, and the source of the 98 Strength that Strength of Earth Totem reaches. It is easy to mistake for the Enhancing Totems talent, which reaches the same 98 by a different route (+15% of 86).',
  },
  {
    id: 'cyclone-raiment',
    name: 'Cyclone Raiment',
    tier: 4,
    totalPieces: 5,
    sourcedFrom: 29028,
    bonuses: [
      { pieces: 2, description: 'Your Mana Spring Totem ability grants an additional 3 mana every 2 sec.', modelled: false, whyNotModelled: TOTEM_BUFF },
      { pieces: 4, description: 'Reduces the cooldown on your Nature\'s Swiftness ability by 24 sec.', modelled: false, whyNotModelled: COOLDOWN },
    ],
    notes: 'The 2-piece is spell 37210, "Improved Mana Spring Totem" — again a set bonus, not the Restorative Totems talent that raises the same totem by 25%.',
  },
  {
    id: 'cyclone-regalia',
    name: 'Cyclone Regalia',
    tier: 4,
    totalPieces: 5,
    sourcedFrom: 29033,
    bonuses: [
      { pieces: 2, description: 'Your Wrath of Air Totem ability grants an additional 20 spell damage.', modelled: false, whyNotModelled: TOTEM_BUFF },
      { pieces: 4, description: 'Your offensive spell critical strikes have a chance to reduce the base mana cost of your next spell by 270. (Proc chance: 11%)', modelled: false, whyNotModelled: RESOURCE },
    ],
    notes: 'The 2-piece is spell 37212, "Improved Wrath of Air Totem". This is the 121 spell power wowsims models as that totem\'s "improved" value — a set bonus, not a talent. TBC has no Improved Wrath of Air Totem talent at all.',
  },
  {
    id: 'voidheart-raiment',
    name: 'Voidheart Raiment',
    tier: 4,
    totalPieces: 5,
    sourcedFrom: 28963,
    bonuses: [
      { pieces: 2, description: 'Your shadow damage spells have a chance to grant you 135 bonus shadow damage for 15 sec. (Proc chance: 5%)', modelled: false, whyNotModelled: TRIGGER },
      { pieces: 2, description: 'Your fire damage spells have a chance to grant you 135 bonus fire damage for 15 sec. (Proc chance: 5%)', modelled: false, whyNotModelled: TRIGGER },
      { pieces: 4, description: 'Increases the duration of your Corruption and Immolate abilities by 3 sec.', modelled: false, whyNotModelled: ABILITY_SPECIFIC },
    ],
    notes: 'Two separate 2-piece bonuses, one per school, and both are school-specific spell power — a quantity StatBlock has no field for even before the proc rate is considered.',
  },
]

export function getItemSetById(id: string | undefined): ItemSet | undefined {
  if (!id) return undefined
  return sampleItemSets.find((set) => set.id === id)
}

export type ActiveSet = {
  set: ItemSet
  equippedPieces: number
  /** Bonuses whose piece requirement is met. All currently unmodelled — see `SetBonus`. */
  activeBonuses: readonly SetBonus[]
}

/**
 * Which sets the equipped gear has pieces of, and which of their bonuses are live.
 *
 * Counts distinct items rather than filled slots, so the same piece cannot be counted twice, and
 * returns sets with a single piece too — seeing "1 of 5" is how a player learns a set is in reach.
 */
export function getActiveSets(equippedItems: readonly GearItem[]): readonly ActiveSet[] {
  const counts = new Map<string, number>()
  const seen = new Set<string>()

  equippedItems.forEach((item) => {
    if (!item.setId || seen.has(item.id)) return
    seen.add(item.id)
    counts.set(item.setId, (counts.get(item.setId) ?? 0) + 1)
  })

  const active: ActiveSet[] = []

  counts.forEach((equippedPieces, setId) => {
    const set = getItemSetById(setId)
    if (!set) return
    active.push({
      set,
      equippedPieces,
      activeBonuses: set.bonuses.filter((bonus) => equippedPieces >= bonus.pieces),
    })
  })

  return active.sort((a, b) => b.equippedPieces - a.equippedPieces)
}
