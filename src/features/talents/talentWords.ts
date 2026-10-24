import type { ProvenanceSource } from '../../components/ui/Provenance'
import { getSignatureAbilitiesForClass } from '../../domain/abilities'
import type { TbcClass } from '../../domain/character/characterTypes'
import { getRoleForSpec } from '../../domain/character/tbcClasses'
import { statLabels } from '../../domain/stats/statTypes'
import rawTalentEffects from '../../domain/talents/talentEffects.json' with { type: 'json' }
import type { Talent } from '../../domain/talents/talentTypes'
import { talentPresetUpstream } from '../../domain/talents/talentWindow'

/**
 * What the simulator reads from a talent, in plain words, for the talent window's tooltip: "In the
 * simulation: +20% attack speed for 3 swings after a crit", or why it is not simulated. The numbers
 * are the ingested wowsims effects (`talentEffects.json`), the same ones `deriveTalentModifiers` sums.
 */

type Effect = (typeof rawTalentEffects.effects)[number] & { school?: string }

const statLabelsByKey = new Map<string, string>(statLabels)
const pct = (value: number) => `${Math.round(value * 1000) / 10}%`
const count = (value: number) => `${Math.round(value * 10) / 10}`
const everySeconds = (perSecond: number) => {
  const seconds = 1 / perSecond
  return Math.abs(seconds - Math.round(seconds)) < 0.05 ? `every ${Math.round(seconds)} seconds` : `every ${seconds.toFixed(1)} seconds`
}

/** One phrase per effect kind, given its value at a rank: a fraction, an amount or a multiplier's bonus. */
const PHRASES: Record<string, (value: number, effect: Effect) => string> = {
  meleeCritChance: (v) => `+${pct(v)} crit chance with attacks`,
  meleeHitChance: (v) => `+${pct(v)} hit chance with attacks`,
  targetDodgeReduction: (v) => `−${pct(v)} chance to be dodged`,
  attackPowerMultiplier: (v) => `+${pct(v)} attack power`,
  offHandDamageMultiplier: (v) => `+${pct(v)} off-hand damage`,
  twoHandedDamageMultiplier: (v) => `+${pct(v)} damage with a two-handed weapon`,
  flurryHaste: (v) => `+${pct(v)} attack speed for 3 swings after a crit`,
  rageProcsPerMinute: (v) => `${count(v)} extra rage a minute from weapon hits`,
  ragePerSecondFlat: (v) => `+1 rage ${everySeconds(v)}`,
  rageGeneratedMultiplier: (v) => `+${pct(v)} rage from damage dealt`,
  parryChance: (v) => `+${pct(v)} parry chance`,
  defenseSkill: (v) => `+${count(v)} defense skill`,
  blockChance: (v) => `+${pct(v)} block chance`,
  statFactor: (v, e) => `+${pct(v)} ${statLabelsByKey.get(e.stat ?? '') ?? e.stat ?? 'stats'}`,
  itemArmorMultiplier: (v) => `+${pct(v)} armor from items`,
  expertiseSkill: (v) => `+${count(v)} expertise`,
  offHandEnergyPerProc: (v) => `${count(v)} energy from 20% of off-hand hits`,
  finisherEnergyRefund: (v) => `up to ${count(v)} energy back from a finisher`,
  sliceAndDiceDurationMultiplier: (v) => `+${pct(v)} Slice and Dice duration`,
  poisonProcChance: (v) => `+${pct(v)} chance to apply poisons`,
  poisonDamageMultiplier: (v) => `+${pct(v)} poison damage`,
  poisonSpellHitChance: (v) => `+${pct(v)} hit chance for poisons`,
  rangedCritChance: (v) => `+${pct(v)} ranged crit chance`,
  rangedDamageMultiplier: (v) => `+${pct(v)} ranged damage`,
  rangedAttackSpeedMultiplier: (v) => `+${pct(v)} ranged attack speed`,
  petMeleeSpeedMultiplier: (v) => `+${pct(v)} pet attack speed`,
  petDamageMultiplier: (v) => `+${pct(v)} pet damage`,
  petCritChance: (v) => `+${pct(v)} pet crit chance`,
  petHitChance: (v) => `+${pct(v)} pet hit chance`,
  petFrenzyProcChance: (v) => `${pct(v)} chance on a pet crit for +30% pet attack speed for 8 seconds`,
  petFocusRegenMultiplier: (v) => `+${pct(v)} pet focus regeneration`,
  physicalDamageMultiplier: (v) => `+${pct(v)} physical damage`,
  spellHitChance: (v) => `+${pct(v)} spell hit chance`,
  flatAttackPower: (v) => `+${count(v)} attack power`,
  spellCritChance: (v) => `+${pct(v)} spell crit chance`,
  spiritRegenWhileCasting: (v) => `${pct(v)} of Spirit's mana regeneration kept while casting`,
  statConversion: (v, e) => `spell power from ${pct(v)} of your ${statLabelsByKey.get(e.from ?? '') ?? e.from}`,
  rakeEnergyCostReduction: (v) => `Rake costs ${count(v)} less energy`,
  spellDamageMultiplier: (v) => `+${pct(v)} spell damage`,
  schoolDamageMultiplier: (v, e) => `+${pct(v)} ${e.school ?? 'spell'} damage`,
  demonDamageMultiplier: (v) => `+${pct(v)} demon damage`,
  demonCritChance: (v) => `+${pct(v)} demon crit chance`,
}

/*
 * Kinds whose value is a multiplier: a flat one is the multiplier itself (Endless Rage's 1.25), so
 * its bonus is what lies above 1. Everything else is an amount, flat or per rank.
 */
const MULTIPLIERS = new Set([
  'attackPowerMultiplier',
  'offHandDamageMultiplier',
  'twoHandedDamageMultiplier',
  'flurryHaste',
  'rageGeneratedMultiplier',
  'statFactor',
  'itemArmorMultiplier',
  'sliceAndDiceDurationMultiplier',
  'poisonDamageMultiplier',
  'rangedDamageMultiplier',
  'rangedAttackSpeedMultiplier',
  'petMeleeSpeedMultiplier',
  'petDamageMultiplier',
  'petFocusRegenMultiplier',
  'physicalDamageMultiplier',
  'spellDamageMultiplier',
  'schoolDamageMultiplier',
  'demonDamageMultiplier',
])

function valueAt(effect: Effect, rank: number): number {
  if (effect.flatValue !== undefined) return MULTIPLIERS.has(effect.kind) ? effect.flatValue - 1 : effect.flatValue
  return (effect.baseBonus ?? 0) + (effect.perRank ?? 0) * rank
}

const effectsById = new Map<number, Effect[]>()
for (const effect of rawTalentEffects.effects as readonly Effect[]) {
  effectsById.set(effect.talentId, [...(effectsById.get(effect.talentId) ?? []), effect])
}

/** What the simulator reads from a talent at a rank, one phrase per effect; empty when it reads nothing. */
export function talentEffectLines(talentId: number, rank: number): string[] {
  return (effectsById.get(talentId) ?? []).map((effect) => PHRASES[effect.kind]?.(valueAt(effect, rank), effect)).filter((line): line is string => !!line)
}

/*
 * Why a talent is not simulated, in plain words. The ingest records its reasons for developers
 * (`talentEffects.json` `skipped`); these say the same for a player, keyed by the ingest's own label,
 * which can name several talents ("Seal Fate / Ruthlessness"). A test holds every key to a label.
 */
const PLAIN_SKIP: Record<string, string> = {
  'Warrior|Deep Wounds': "It is a bleed, and the simulator doesn't model bleeds from special attacks.",
  'Warrior|Death Wish': "It is a cooldown you press; how often it's up depends on the fight, which the simulator doesn't play out.",
  'Warrior|Rampage': "Its attack power builds up hit by hit, and the simulator doesn't play the fight out hit by hit.",
  'Warrior|Enrage': "It triggers when you take a crit, and the simulator doesn't model damage taken by a damage dealer.",
  'Warrior|Sweeping Strikes': 'It hits extra targets, and the simulator models one target.',
  'Warrior|Blood Frenzy': 'It is a debuff on the boss rather than a change to you.',
  'Warrior|Mace Specialization / Sword Specialization / Poleaxe Specialization': "It depends on the weapon type, which the simulator doesn't check yet.",
  'Warrior|Impale': "It raises the crit damage of abilities, which the simulator doesn't take from talents yet.",
  'Warrior|Defiance': "Its expertise only matters to the tank model, which scores survival and doesn't roll your own attacks.",
  'Warrior|Shield Mastery': 'It raises how much a block absorbs, and the simulator only counts whether you block.',
  'Rogue|Murder': "It only works on some kinds of creature, and the simulator doesn't know what the boss is.",
  'Rogue|Serrated Blades': "It gives armor penetration, which the simulator doesn't read yet.",
  'Rogue|Seal Fate / Ruthlessness': "It adds combo points, and the simulator doesn't count combo points one by one.",
  'Rogue|Adrenaline Rush / Blade Flurry / Cold Blood': "It is a cooldown you press; how often it's up depends on the fight, which the simulator doesn't play out.",
  'Hunter|Focused Fire (Kill Command half)': "Its pet's Kill Command crit isn't simulated; its damage bonus is.",
  'Hunter|The Beast Within / Bestial Wrath': "It is a cooldown you press; how often it's up depends on the fight, which the simulator doesn't play out.",
  'Hunter|Survivalist': "It raises health, which the simulator doesn't use for a damage dealer.",
  'Hunter|Combat Experience': "Its Agility and Intellect aren't read from talents yet.",
  'Hunter|Mortal Shots': "It raises the crit damage of shots, which the simulator doesn't take from talents yet.",
  'Hunter|Expose Weakness': 'It gives attack power to the raid, not to you.',
  'Hunter|Master Tactician / Thrill of the Hunt / Readiness': "It procs or is a cooldown, and the simulator doesn't play the fight out moment by moment.",
  'Shaman|Toughness / Anticipation / Shield Specialization': "It helps you take hits, and the simulator scores a Shaman's damage only.",
  'Shaman|Elemental Fury / Concussion / Call of Thunder': "It changes particular spells, and the simulator casts one generic spell for the spec.",
  'Shaman|Shamanistic Rage / Stormstrike (Nature debuff)': "It is an ability you press, and the simulator doesn't plan when you'd press it.",
  'Druid|Subtlety': "It lowers threat, which the simulator doesn't score.",
  'Druid|Survival of the Fittest': "It lowers the chance you're crit, which the simulator doesn't model for damage.",
  'Druid|Heart of the Wild / Furor': "It depends on your form, and the simulator doesn't model forms yet.",
  'Druid|Moonkin Form / Tree of Life': "It is a form with a party-wide effect, and the simulator models neither forms nor your party.",
  'Druid|Omen of Clarity / Primal Fury': "It procs, and the simulator doesn't play the fight out moment by moment.",
  'Paladin|Spell Warding / Improved Righteous Fury': "It lowers damage you take, which the simulator doesn't model for damage.",
  'Paladin|Vengeance / Sanctity Aura': "It procs or needs your party, and the simulator models neither.",
  'Paladin|Crusade': "It only works on some kinds of creature, and the simulator doesn't know what the boss is.",
  'Paladin|Shield Specialization': 'It raises how much a block absorbs, and the simulator only counts whether you block.',
  "Mage|Ignite / Combustion / Winter's Chill": "It changes particular spells or schools, and the simulator casts one generic spell for the spec.",
  'Mage|Arcane Power / Presence of Mind / Icy Veins': "It is a cooldown you press; how often it's up depends on the fight, which the simulator doesn't play out.",
  'Mage|Empowered Fireball / Empowered Frostbolt': "It strengthens one spell, and the simulator casts one generic spell for the spec.",
  'Priest|Shadow Weaving / Misery': "It stacks on the boss as you cast, and the simulator doesn't play the fight out moment by moment.",
  'Priest|Inner Focus / Power Infusion': "It is a cooldown you press; how often it's up depends on the fight, which the simulator doesn't play out.",
  'Priest|Improved Renew / Empowered Healing': 'It strengthens particular heals, and the simulator casts one generic heal.',
  'Warlock|Master Demonologist': "It depends on which demon you have out, and the simulator doesn't read it yet.",
  'Warlock|Fel Intellect / Fel Stamina': "It raises mana and health, which the simulator doesn't use for a damage dealer.",
  'Warlock|Improved Shadow Bolt / Ruin / Emberstorm': "It changes particular spells or schools, and the simulator casts one generic spell for the spec.",
  'Warlock|Soul Leech / Nightfall': "It procs, and the simulator doesn't play the fight out moment by moment.",
}

/** Each skipped talent's plain reason, by the talent ids the ingest resolved each refusal to. */
const skippedById = new Map<number, string>()
for (const entry of rawTalentEffects.skipped) {
  const reason = PLAIN_SKIP[`${entry.className}|${entry.talent}`] ?? entry.reason
  for (const { talentId } of entry.talents) skippedById.set(talentId, reason)
}

export type TalentSimStatus = { kind: 'sim' | 'skip' | 'ability' | 'none'; text: string }

/**
 * Whether the simulator reads a talent: its effects, why it is skipped, or, for a talent that teaches
 * an ability a damage spec's simulated rotation casts (Bloodthirst, Mortal Strike, Stormstrike), that
 * the ability is there although the point itself is not read.
 */
export function talentSimStatus(className: TbcClass, talent: Talent, rank: number): TalentSimStatus {
  const lines = talentEffectLines(talent.id, Math.max(1, rank))
  if (lines.length) return { kind: 'sim', text: `${rank ? 'In the simulation' : 'In the simulation at rank 1'}: ${lines.join('; ')}` }
  // Before the skips: Stormstrike's cooldown is skipped, but its strike is in Enhancement's rotation.
  const ability = getSignatureAbilitiesForClass(className).find((entry) => {
    const role = getRoleForSpec(className, entry.spec)
    return entry.name === talent.name && role !== 'Healer' && role !== 'Tank'
  })
  if (ability) return { kind: 'ability', text: `Its ability is in the simulated ${ability.spec} rotation; the talent point itself isn't read.` }
  const skipped = skippedById.get(talent.id)
  if (skipped) return { kind: 'skip', text: `Not simulated: ${skipped}` }
  return { kind: 'none', text: "Not read by the simulator: it changes something the estimate doesn't track, such as a cost, a cooldown or utility." }
}

export const talentsSources: readonly ProvenanceSource[] = [
  { name: "the trees from Wowhead's TBC talent calculator", href: 'https://www.wowhead.com/tbc/talent-calc' },
  {
    name: 'the presets and what the simulator reads from wowsims/tbc',
    href: `https://github.com/${talentPresetUpstream.repo}/tree/${talentPresetUpstream.sha}`,
  },
  { name: "the hit cap from this app's simulator" },
]
