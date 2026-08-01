import { EXPERTISE_RATING_PER_SKILL_POINT, RATING_PER_PERCENT } from '../simulation/combatConstants'
import type { TbcRace } from './characterTypes'
import type { RacialTrait } from './racialTypes'

/**
 * Racials are written in the units the game states them in (percent hit, expertise *skill*) and
 * converted here into the rating units the stat model uses, via the same constants the simulator
 * uses. Writing "+15.8 hit rating" directly would hide what the racial actually says.
 */
const oneHitPercentMelee = RATING_PER_PERCENT.meleeHit
const oneHitPercentSpell = RATING_PER_PERCENT.spellHit
const oneCritPercent = RATING_PER_PERCENT.meleeCrit
const oneDodgePercent = RATING_PER_PERCENT.dodge
const fiveExpertiseSkill = 5 * EXPERTISE_RATING_PER_SKILL_POINT

const verify = 'Value recalled rather than read off a TBC-era source; treat as approximate until reconciled against Wowhead.'

export const sampleRacialTraits: readonly RacialTrait[] = [
  // ---------------------------------------------------------------------------------------------
  // Alliance
  // ---------------------------------------------------------------------------------------------
  {
    id: 'human-sword-specialization',
    name: 'Sword Specialization',
    race: 'Human',
    kind: 'conditional',
    description: '+5 Expertise while wielding a sword.',
    stats: { expertiseRating: fiveExpertiseSkill },
    requiresWeaponTypes: ['Sword'],
    needsVerification: true,
    notes: `Expressed as the rating equivalent of 5 Expertise skill. ${verify}`,
  },
  {
    id: 'human-mace-specialization',
    name: 'Mace Specialization',
    race: 'Human',
    kind: 'conditional',
    description: '+5 Expertise while wielding a mace.',
    stats: { expertiseRating: fiveExpertiseSkill },
    requiresWeaponTypes: ['Mace'],
    needsVerification: true,
    notes: `Expressed as the rating equivalent of 5 Expertise skill. ${verify}`,
  },
  {
    id: 'human-the-human-spirit',
    name: 'The Human Spirit',
    race: 'Human',
    kind: 'passive',
    description: '+10% Spirit.',
    statMultipliers: { spirit: 0.1 },
    needsVerification: true,
    notes: verify,
  },
  {
    id: 'human-perception',
    name: 'Perception',
    race: 'Human',
    kind: 'utility',
    description: 'Temporarily increases stealth detection. No throughput effect.',
  },
  {
    id: 'dwarf-gun-specialization',
    name: 'Gun Specialization',
    race: 'Dwarf',
    kind: 'conditional',
    description: '+1% critical strike chance while using a gun.',
    stats: { critRating: oneCritPercent },
    requiresWeaponTypes: ['Gun'],
    needsVerification: true,
    notes: `Applies to the Ranged slot, so it only reaches the simulation for Hunters. ${verify}`,
  },
  {
    id: 'dwarf-stoneform',
    name: 'Stoneform',
    race: 'Dwarf',
    kind: 'on-use',
    description: 'Removes bleed/poison/disease and briefly raises armour. Situational survival, not throughput.',
  },
  {
    id: 'night-elf-quickness',
    name: 'Quickness',
    race: 'Night Elf',
    kind: 'passive',
    description: '+1% chance to dodge.',
    stats: { dodgeRating: oneDodgePercent },
    needsVerification: true,
    notes: `Reaches the simulation through the tank avoidance model. ${verify}`,
  },
  {
    id: 'night-elf-shadowmeld',
    name: 'Shadowmeld',
    race: 'Night Elf',
    kind: 'utility',
    description: 'Stealth while stationary. No throughput effect.',
  },
  {
    id: 'gnome-expansive-mind',
    name: 'Expansive Mind',
    race: 'Gnome',
    kind: 'passive',
    description: '+5% Intellect.',
    statMultipliers: { intellect: 0.05 },
    needsVerification: true,
    notes: `Applied before the Intellect-to-spell-power derivation, so it cascades. ${verify}`,
  },
  {
    id: 'gnome-escape-artist',
    name: 'Escape Artist',
    race: 'Gnome',
    kind: 'utility',
    description: 'Escapes movement-impairing effects. No throughput effect.',
  },
  {
    id: 'draenei-heroic-presence',
    name: 'Heroic Presence',
    race: 'Draenei',
    kind: 'passive',
    description: '+1% chance to hit, for the Draenei and their party.',
    stats: { hitRating: oneHitPercentMelee, spellHitRating: oneHitPercentSpell },
    needsVerification: true,
    notes: `Modelled as benefiting the character themselves. The party-wide half is real but this simulator models one character, so a raid's total gain is understated. ${verify}`,
  },
  {
    id: 'draenei-gift-of-the-naaru',
    name: 'Gift of the Naaru',
    race: 'Draenei',
    kind: 'on-use',
    description: 'A heal over time on a cooldown. Survival, not throughput.',
  },

  // ---------------------------------------------------------------------------------------------
  // Horde
  // ---------------------------------------------------------------------------------------------
  {
    id: 'orc-axe-specialization',
    name: 'Axe Specialization',
    race: 'Orc',
    kind: 'conditional',
    description: '+5 Expertise while wielding an axe.',
    stats: { expertiseRating: fiveExpertiseSkill },
    requiresWeaponTypes: ['Axe'],
    needsVerification: true,
    notes: `Expressed as the rating equivalent of 5 Expertise skill. Whether TBC covered two-handed axes as well as one-handed needs confirming. ${verify}`,
  },
  {
    id: 'orc-blood-fury',
    name: 'Blood Fury',
    race: 'Orc',
    kind: 'on-use',
    description: 'A large attack power (or spell power) burst on a long cooldown.',
    needsVerification: true,
    notes:
      'Genuinely significant throughput that this simulator cannot price, because its value depends on cooldown alignment. Orcs are therefore understated here, not equal to a race with no combat racial.',
  },
  {
    id: 'orc-command',
    name: 'Command',
    race: 'Orc',
    kind: 'passive',
    description: '+5% pet damage.',
    needsVerification: true,
    notes: 'Not modelled: pets are not simulated at all, so this is missing for Hunters, Warlocks and Unholy-style pet play.',
  },
  {
    id: 'undead-will-of-the-forsaken',
    name: 'Will of the Forsaken',
    race: 'Undead',
    kind: 'on-use',
    description: 'Breaks fear/charm/sleep on a cooldown. Situational, not throughput.',
  },
  {
    id: 'undead-cannibalize',
    name: 'Cannibalize',
    race: 'Undead',
    kind: 'on-use',
    description: 'Out-of-combat health regeneration from a corpse. No throughput effect.',
  },
  {
    id: 'tauren-endurance',
    name: 'Endurance',
    race: 'Tauren',
    kind: 'passive',
    description: '+5% base health.',
    needsVerification: true,
    notes:
      'Not modelled: the stat model tracks Stamina rather than a health pool, and this is a percentage of base health rather than of Stamina, so it cannot be expressed as a Stamina bonus without misstating it.',
  },
  {
    id: 'tauren-war-stomp',
    name: 'War Stomp',
    race: 'Tauren',
    kind: 'on-use',
    description: 'Short AoE stun on a cooldown. Utility, not throughput.',
  },
  {
    id: 'troll-bow-specialization',
    name: 'Bow Specialization',
    race: 'Troll',
    kind: 'conditional',
    description: '+1% critical strike chance while using a bow.',
    stats: { critRating: oneCritPercent },
    requiresWeaponTypes: ['Bow'],
    needsVerification: true,
    notes: `Applies to the Ranged slot, so it only reaches the simulation for Hunters. ${verify}`,
  },
  {
    id: 'troll-berserking',
    name: 'Berserking',
    race: 'Troll',
    kind: 'on-use',
    description: 'A haste burst on a cooldown, scaling with missing health.',
    needsVerification: true,
    notes:
      'Real throughput this simulator cannot price, for the same reason as Blood Fury. Trolls are understated here rather than neutral.',
  },
  {
    id: 'troll-beast-slaying',
    name: 'Beast Slaying',
    race: 'Troll',
    kind: 'passive',
    description: '+5% damage to Beasts.',
    needsVerification: true,
    notes: 'Not modelled: the encounter model has no creature type, so a beast-only damage bonus has nothing to key off.',
  },
  {
    id: 'blood-elf-arcane-torrent',
    name: 'Arcane Torrent',
    race: 'Blood Elf',
    kind: 'on-use',
    description: 'Restores mana and silences nearby enemies, on a cooldown.',
    notes: 'The mana return matters for sustained caster/healer play, which this simulator does not model — it has no fight length or mana pool.',
  },
  {
    id: 'blood-elf-magic-resistance',
    name: 'Magic Resistance',
    race: 'Blood Elf',
    kind: 'passive',
    description: '+5 to all resistances.',
    needsVerification: true,
    notes: 'Not modelled: resistances are not part of the stat model.',
  },
]

export function getRacialTraitsForRace(race: TbcRace): readonly RacialTrait[] {
  return sampleRacialTraits.filter((trait) => trait.race === race)
}

export function getRacialTraitById(id: string) {
  return sampleRacialTraits.find((trait) => trait.id === id)
}
