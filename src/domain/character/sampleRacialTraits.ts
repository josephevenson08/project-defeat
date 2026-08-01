import { EXPERTISE_RATING_PER_SKILL_POINT, RATING_PER_PERCENT } from '../simulation/combatConstants'
import type { TbcRace } from './characterTypes'
import type { RacialTrait } from './racialTypes'

/**
 * Racials are written in the units the game states them in (percent hit, Expertise *skill*) and
 * converted here into the rating units the stat model uses, via the same constants the simulator
 * uses. Writing "+15.8 hit rating" directly would hide what the racial actually says.
 *
 * Values are read from Wowhead's TBC-scoped spell tooltips. Where a spell ID is given in a note it
 * is the TBC spell, not a later-expansion version of the same name — several racials were reworked
 * afterwards and the retail values are materially different.
 */
const oneHitPercentMelee = RATING_PER_PERCENT.meleeHit
const oneHitPercentSpell = RATING_PER_PERCENT.spellHit
const oneCritPercent = RATING_PER_PERCENT.meleeCrit
const oneDodgePercent = RATING_PER_PERCENT.dodge
const fiveExpertiseSkill = 5 * EXPERTISE_RATING_PER_SKILL_POINT

/** The weapon-specialization racials all read `Mod Expertise Value: 5` and cover the two-handed variant too. */
const expertiseNote =
  'Wowhead TBC tooltip reads "Mod Expertise Value: 5", and covers the two-handed variant of the weapon as well as the one-handed. Stored as the rating equivalent of 5 Expertise skill. Note the tooltip shows no secondary effect — some summaries claim an added crit or spell hit component, which is a confusion with the ranged weapon specializations that changed to +1% crit in patch 2.3.0.'

export const sampleRacialTraits: readonly RacialTrait[] = [
  // ---------------------------------------------------------------------------------------------
  // Alliance
  // ---------------------------------------------------------------------------------------------
  {
    id: 'human-sword-specialization',
    name: 'Sword Specialization',
    race: 'Human',
    kind: 'conditional',
    description: '+5 Expertise while wielding a sword (one- or two-handed).',
    stats: { expertiseRating: fiveExpertiseSkill },
    requiresWeaponTypes: ['Sword'],
    notes: `Wowhead TBC spell 20597. ${expertiseNote}`,
  },
  {
    id: 'human-mace-specialization',
    name: 'Mace Specialization',
    race: 'Human',
    kind: 'conditional',
    description: '+5 Expertise while wielding a mace (one- or two-handed).',
    stats: { expertiseRating: fiveExpertiseSkill },
    requiresWeaponTypes: ['Mace'],
    notes: `Wowhead TBC spell 20864. ${expertiseNote}`,
  },
  {
    id: 'human-the-human-spirit',
    name: 'The Human Spirit',
    race: 'Human',
    kind: 'passive',
    description: '+10% Spirit.',
    statMultipliers: { spirit: 0.1 },
    notes: 'Wowhead TBC spell 20598 ("Mod Stat -% Value: 10%").',
  },
  {
    id: 'human-perception',
    name: 'Perception',
    race: 'Human',
    kind: 'utility',
    description: 'On-use stealth detection, roughly a 3 minute cooldown. No throughput effect.',
  },
  {
    id: 'dwarf-gun-specialization',
    name: 'Gun Specialization',
    race: 'Dwarf',
    kind: 'conditional',
    description: '+1% critical strike chance while using a gun.',
    stats: { critRating: oneCritPercent },
    requiresWeaponTypes: ['Gun'],
    notes:
      'Wowhead TBC spell 20595 ("Mod Melee & Ranged Crit % Value: 1%"). This was a weapon-skill bonus in vanilla and became +1% crit in patch 2.3.0; the crit version is the one in effect for TBC Classic. Applies to the Ranged slot, so it only reaches the simulation for Hunters.',
  },
  {
    id: 'dwarf-stoneform',
    name: 'Stoneform',
    race: 'Dwarf',
    kind: 'on-use',
    description: 'Removes bleed/poison/disease and raises armour for 8s, on a 3 minute cooldown.',
    needsVerification: true,
    notes:
      'Cooldown and duration are confirmed, but the exact effect list is not: the tooltip fetch returned only a physical-resistance modifier and poison immunity, while independent summaries describe armour plus bleed/poison/disease immunity. Defensive either way, so it is not modelled.',
  },
  {
    id: 'night-elf-quickness',
    name: 'Quickness',
    race: 'Night Elf',
    kind: 'passive',
    description: '+1% chance to dodge.',
    stats: { dodgeRating: oneDodgePercent },
    notes:
      'Wowhead TBC spell 20582 ("Mod Dodge % Value: 1%") — it is specifically dodge, not a general miss chance. Reaches the simulation through the tank avoidance model.',
  },
  {
    id: 'night-elf-shadowmeld',
    name: 'Shadowmeld',
    race: 'Night Elf',
    kind: 'utility',
    description: 'Stealth-like effect while stationary. No throughput effect.',
  },
  {
    id: 'gnome-expansive-mind',
    name: 'Expansive Mind',
    race: 'Gnome',
    kind: 'passive',
    description: '+5% Intellect.',
    statMultipliers: { intellect: 0.05 },
    notes:
      'Wowhead TBC spell 20591. It modifies the Intellect stat itself rather than mana separately, so mana benefits only as a downstream consequence — which is exactly how it behaves here, since this is applied before the Intellect-driven derivations.',
  },
  {
    id: 'gnome-escape-artist',
    name: 'Escape Artist',
    race: 'Gnome',
    kind: 'utility',
    description: 'Breaks roots and snares on a 1 minute cooldown. No throughput effect.',
  },
  {
    id: 'draenei-heroic-presence',
    name: 'Heroic Presence',
    race: 'Draenei',
    kind: 'conditional',
    description: '+1% melee and ranged hit, as a 30-yard party aura.',
    stats: { hitRating: oneHitPercentMelee },
    requiresClasses: ['Warrior', 'Paladin', 'Hunter'],
    notes:
      'Wowhead TBC spell 6562 ("Area Aura: Mod Melee & Ranged Hit Chance % Value: 1%", 30 yard radius). Melee and ranged only — the spell-hit version is a separately-named racial (Inspiring Presence) granted to different classes. Modelled as benefiting the character themselves; the party-wide half is real, but this simulator models one character, so a raid\'s total gain is understated.',
  },
  {
    id: 'draenei-inspiring-presence',
    name: 'Inspiring Presence',
    race: 'Draenei',
    kind: 'conditional',
    description: '+1% spell hit, as a 30-yard party aura.',
    stats: { spellHitRating: oneHitPercentSpell },
    requiresClasses: ['Priest', 'Shaman'],
    notes:
      'Wowhead TBC spell 28878 ("Apply Area Aura: Mod Spell Hit Chance % Value: 1%", 30 yard radius). Draenei casters get this instead of Heroic Presence, not in addition to it.',
  },
  {
    id: 'draenei-gift-of-the-naaru',
    name: 'Gift of the Naaru',
    race: 'Draenei',
    kind: 'on-use',
    description: 'A heal over 15s on a 3 minute cooldown.',
    needsVerification: true,
    notes:
      'Cooldown and cast time are sourced (TBC spell 28880), but the level-70 healed amount is not: the raw spell data carries an unscaled per-level coefficient, and the ~1,085 total figure comes from a single source. Survival rather than throughput, so it is not modelled.',
  },

  // ---------------------------------------------------------------------------------------------
  // Horde
  // ---------------------------------------------------------------------------------------------
  {
    id: 'orc-axe-specialization',
    name: 'Axe Specialization',
    race: 'Orc',
    kind: 'conditional',
    description: '+5 Expertise while wielding an axe (one- or two-handed).',
    stats: { expertiseRating: fiveExpertiseSkill },
    requiresWeaponTypes: ['Axe'],
    notes: `Wowhead TBC spell 20574. ${expertiseNote}`,
  },
  {
    id: 'orc-blood-fury',
    name: 'Blood Fury',
    race: 'Orc',
    kind: 'on-use',
    description: '+282 melee and ranged attack power for 15s, on a 2 minute cooldown. Also halves healing received for the duration.',
    notes:
      'Wowhead TBC spell 20572. Attack power only in TBC — the spell-power version came later, so caster Orcs get nothing from this. Real throughput that this simulator cannot price, because its value depends on cooldown alignment: Orcs are understated here, not equal to a race with no combat racial.',
  },
  {
    id: 'orc-command',
    name: 'Command',
    race: 'Orc',
    kind: 'passive',
    description: '+5% pet damage.',
    notes:
      'Wowhead TBC spell 20575. Not modelled: pets are not simulated at all, so this is missing for Hunters and Warlocks. (It drops to 1% in a much later expansion; 5% is the TBC value.)',
  },
  {
    id: 'orc-hardiness',
    name: 'Hardiness',
    race: 'Orc',
    kind: 'passive',
    description: '+15% chance to resist stun effects.',
    notes:
      'Wowhead TBC spell 20573 — in TBC this is a resist *chance*, not the stun-duration reduction it became in a later expansion. Not modelled: the encounter model has no crowd control.',
  },
  {
    id: 'undead-will-of-the-forsaken',
    name: 'Will of the Forsaken',
    race: 'Undead',
    kind: 'on-use',
    description: 'Immunity to charm, fear and sleep for 5s, on a 2 minute cooldown. Usable while already affected.',
    notes: 'Wowhead TBC spell 7744 — the tooltip carries the three immunities and no stat component. Undead have no passive stat racial in TBC at all.',
  },
  {
    id: 'undead-cannibalize',
    name: 'Cannibalize',
    race: 'Undead',
    kind: 'utility',
    description: 'Channels to heal 7% of health every 2s from a nearby corpse. Out of combat only.',
  },
  {
    id: 'tauren-endurance',
    name: 'Endurance',
    race: 'Tauren',
    kind: 'passive',
    description: '+5% maximum health.',
    notes:
      'Wowhead TBC spell 20550 ("Mod Increase Maximum Health -% Value: 5%") — a multiplier on total health, not on base health. Not modelled: the stat model tracks Stamina rather than a health pool, so there is nothing for a percentage of maximum health to apply to.',
  },
  {
    id: 'tauren-war-stomp',
    name: 'War Stomp',
    race: 'Tauren',
    kind: 'on-use',
    description: 'Stuns up to 5 enemies within 8 yards for 2s.',
    needsVerification: true,
    notes: 'Range, duration and target cap are cross-checked; the exact cooldown was not confirmed. Utility rather than throughput.',
  },
  {
    id: 'troll-bow-specialization',
    name: 'Bow Specialization',
    race: 'Troll',
    kind: 'conditional',
    description: '+1% critical strike chance while using a bow.',
    stats: { critRating: oneCritPercent },
    requiresWeaponTypes: ['Bow'],
    notes: 'Wowhead TBC spell 26290. Bows only — it does not cover guns or thrown. Applies to the Ranged slot, so it only reaches the simulation for Hunters.',
  },
  {
    id: 'troll-throwing-specialization',
    name: 'Throwing Specialization',
    race: 'Troll',
    kind: 'conditional',
    description: '+1% critical strike chance while using a thrown weapon.',
    stats: { critRating: oneCritPercent },
    requiresWeaponTypes: ['Thrown'],
    notes: 'Wowhead TBC spell 20558. Thrown weapons only, and the catalog has few of them, so this rarely activates in practice.',
  },
  {
    id: 'troll-berserking',
    name: 'Berserking',
    race: 'Troll',
    kind: 'on-use',
    description: 'Melee, ranged and casting speed increased for 10s on a 3 minute cooldown, scaling from +10% at full health to +30% at low health.',
    notes:
      'Wowhead TBC spell 26297; the health-scaling formula is 10 + (100 − health%)/3, capping at 30%. Real throughput this simulator cannot price, for the same reason as Blood Fury — Trolls are understated here rather than neutral.',
  },
  {
    id: 'troll-regeneration',
    name: 'Regeneration',
    race: 'Troll',
    kind: 'passive',
    description: '+10% health regeneration, and 10% of it continues during combat.',
    notes: 'Wowhead TBC spell 20555. Not modelled: there is no health pool or regeneration in the stat model.',
  },
  {
    id: 'troll-beast-slaying',
    name: 'Beast Slaying',
    race: 'Troll',
    kind: 'passive',
    description: '+5% damage dealt to Beasts.',
    notes: 'Wowhead TBC spell 20557. Not modelled: the encounter model has no creature type, so a beast-only bonus has nothing to key off.',
  },
  {
    id: 'blood-elf-arcane-torrent',
    name: 'Arcane Torrent',
    race: 'Blood Elf',
    kind: 'on-use',
    description: 'Silences enemies within 8 yards for 2s, on a 2 minute cooldown.',
    notes:
      'Wowhead TBC spell 28730 — in TBC this is silence only, with no resource return. The mana/energy/rage restore commonly associated with Arcane Torrent is a later-expansion change; in TBC the mana return came from a separate ability, Mana Tap, which had to be stacked first.',
  },
  {
    id: 'blood-elf-magic-resistance',
    name: 'Magic Resistance',
    race: 'Blood Elf',
    kind: 'passive',
    description: '+5 to all resistances.',
    notes: 'Not modelled: resistances are not part of the stat model.',
  },
]

export function getRacialTraitsForRace(race: TbcRace): readonly RacialTrait[] {
  return sampleRacialTraits.filter((trait) => trait.race === race)
}

export function getRacialTraitById(id: string) {
  return sampleRacialTraits.find((trait) => trait.id === id)
}
