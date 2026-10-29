import type { ProvenanceSource } from '../../components/ui/Provenance'
import { getBuffById } from '../../domain/buffs/sampleBuffs'
import { getTargetDebuffById } from '../../domain/buffs/sampleTargetDebuffs'
import type { TbcClass } from '../../domain/character/characterTypes'
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
  // Signed: Demonic Embrace's Spirit half goes down a percent a rank.
  statFactor: (v, e) => `${v < 0 ? '−' : '+'}${pct(Math.abs(v))} ${statLabelsByKey.get(e.stat ?? '') ?? e.stat ?? 'stats'}`,
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
const COOLDOWN = "It is a cooldown you press; how often it's up depends on the fight, which the simulator doesn't play out."
const MOMENT_BY_MOMENT = "It procs or is a cooldown, and the simulator doesn't play the fight out moment by moment."
const PARTICULAR_SPELLS = 'It changes or teaches particular spells, and the simulator only reads talents that change you as a whole, even for a spell it casts.'
const PARTICULAR_ABILITIES = 'It changes or teaches particular abilities, and the simulator only reads talents that change you as a whole, even for an ability it uses.'
const NOT_USED = "It strengthens an ability the simulator doesn't use."
const SURVIVAL = "It helps you survive, and the simulator doesn't model damage taken by a damage dealer or healer."
const TANK_NOT_READ = "It helps a tank in a way the tank estimate doesn't read: a cooldown, a proc, an extra block or spell damage taken."
const UNTALENTED_BUFF = 'It strengthens a buff, and the Buffs tab uses the untalented one.'
const HEALER_MANA = "It changes mana a healer spends or regains, and the simulator's mana figures use base costs and read only MP5 and Spirit."

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
  'Warrior|Improved Heroic Strike / Improved Mortal Strike / Improved Whirlwind / Focused Rage / Improved Bloodrage':
    'It changes the rage cost, cooldown or damage of an ability the simulator uses, which it still prices at the base figures.',
  'Warrior|Improved Rend / Improved Thunder Clap / Improved Overpower / Improved Cleave / Improved Slam': NOT_USED,
  'Warrior|Commanding Presence / Improved Demoralizing Shout': 'It strengthens a shout, and the Buffs tab uses the untalented Battle Shout and has no Demoralizing Shout.',
  'Warrior|Second Wind / Blood Craze': "It triggers when you're stunned or crit, and the simulator doesn't model damage taken by a damage dealer.",
  'Warrior|Last Stand / Improved Shield Block / Improved Shield Wall / Improved Defensive Stance': TANK_NOT_READ,
  'Warrior|Shield Slam / Devastate / One-Handed Weapon Specialization': "It adds a tank's damage or threat, and the tank estimate scores survival only.",
  'Rogue|Murder': "It only works on some kinds of creature, and the simulator doesn't know what the boss is.",
  'Rogue|Serrated Blades': "It gives armor penetration, which the simulator doesn't read yet.",
  'Rogue|Seal Fate / Ruthlessness': "It adds combo points, and the simulator doesn't count combo points one by one.",
  'Rogue|Adrenaline Rush / Blade Flurry / Cold Blood': "It is a cooldown you press; how often it's up depends on the fight, which the simulator doesn't play out.",
  'Rogue|Improved Eviscerate / Puncturing Wounds / Lethality / Aggression / Surprise Attacks / Opportunity': PARTICULAR_ABILITIES,
  'Rogue|Riposte / Ghostly Strike / Improved Ambush': "It strengthens or teaches an attack the simulator doesn't use.",
  'Rogue|Dagger Specialization / Mace Specialization / Sword Specialization / Fist Weapon Specialization': "It depends on the weapon type, which the simulator doesn't check yet.",
  'Rogue|Improved Kidney Shot / Find Weakness / Dirty Deeds / Master of Subtlety / Shadowstep':
    "It works only for a while (after a finisher, from stealth, below 35% health), and the simulator doesn't play the fight out moment by moment.",
  'Rogue|Improved Sinister Strike / Vigor': 'It changes energy, and the simulator prices Sinister Strike at its base cost and never lets energy cap.',
  'Rogue|Dual Wield Specialization': "Its off-hand damage isn't read from talents yet.",
  'Rogue|Quick Recovery / Deadened Nerves / Lightning Reflexes / Deflection / Sleight of Hand / Heightened Senses / Enveloping Shadows / Cheat Death': SURVIVAL,
  'Rogue|Improved Expose Armor': "It strengthens Expose Armor, which isn't on the Buffs tab.",
  'Hunter|Focused Fire (Kill Command half)': "Its pet's Kill Command crit isn't simulated; its damage bonus is.",
  'Hunter|The Beast Within / Bestial Wrath': "It is a cooldown you press; how often it's up depends on the fight, which the simulator doesn't play out.",
  'Hunter|Survivalist': "It raises health, which the simulator doesn't use for a damage dealer.",
  'Hunter|Mortal Shots': "It raises the crit damage of shots, which the simulator doesn't take from talents yet.",
  'Hunter|Expose Weakness': 'It gives attack power to the raid, not to you.',
  'Hunter|Master Tactician / Thrill of the Hunt / Readiness': "It procs or is a cooldown, and the simulator doesn't play the fight out moment by moment.",
  'Hunter|Improved Stings / Barrage / Improved Barrage / Savage Strikes / Clever Traps / Aimed Shot / Silencing Shot / Counterattack':
    "It strengthens or teaches a shot, strike or trap the simulator doesn't use: it fires Auto Shot and Steady Shot.",
  'Hunter|Monster Slaying / Humanoid Slaying': "It only works on some kinds of creature, and the simulator doesn't know what the boss is.",
  'Hunter|Careful Aim / Master Marksman / Survival Instincts / Lightning Reflexes': "Its attack power or Agility bonus isn't read from talents yet.",
  'Hunter|Endurance Training / Improved Aspect of the Monkey / Thick Hide / Spirit Bond / Catlike Reflexes / Deflection / Deterrence':
    "It helps you or your pet survive, and the simulator doesn't model damage taken by a damage dealer.",
  'Hunter|Improved Aspect of the Hawk / Go for the Throat': MOMENT_BY_MOMENT,
  "Hunter|Improved Hunter's Mark": "It strengthens Hunter's Mark, which isn't on the Buffs tab.",
  'Hunter|Efficiency': "It makes shots cheaper, and the simulator's mana figure uses Steady Shot's base cost.",
  'Shaman|Toughness / Anticipation / Shield Specialization': "It helps you take hits, and the simulator scores a Shaman's damage only.",
  'Shaman|Elemental Fury / Concussion / Call of Thunder': "It changes particular spells, and the simulator casts one generic spell for the spec.",
  'Shaman|Shamanistic Rage / Stormstrike (Nature debuff)': "It is an ability you press, and the simulator doesn't plan when you'd press it.",
  'Shaman|Call of Flame / Improved Lightning Shield / Lightning Mastery / Lightning Overload / Improved Healing Wave / Healing Way / Improved Chain Heal / Earth Shield':
    PARTICULAR_SPELLS,
  'Shaman|Unrelenting Storm / Ancestral Knowledge / Tidal Focus': HEALER_MANA,
  "Shaman|Elemental Devastation / Elemental Mastery / Nature's Swiftness": MOMENT_BY_MOMENT,
  "Shaman|Elemental Warding / Elemental Shields / Spirit Weapons / Nature's Guardian": SURVIVAL,
  'Shaman|Guardian Totems / Enhancing Totems / Improved Weapon Totems / Restorative Totems': 'It strengthens totems, and the Buffs tab uses the untalented ones.',
  'Shaman|Elemental Weapons': 'It strengthens weapon imbues, and the simulator uses the untalented Windfury Weapon.',
  "Shaman|Mental Quickness / Nature's Blessing": "Its spell power isn't read from talents yet.",
  'Shaman|Purification / Tidal Mastery / Elemental Precision':
    'It changes only some kinds of spell (heals, Lightning, or Fire, Frost and Nature), and the simulator only reads talents that change all your spells.',
  'Druid|Subtlety': "It lowers threat, which the simulator doesn't score.",
  'Druid|Survival of the Fittest': "It lowers the chance you're crit, which the simulator doesn't model for damage.",
  'Druid|Heart of the Wild (Stamina and attack power halves) / Furor': "It depends on your form, and the simulator doesn't model forms yet.",
  'Druid|Moonkin Form / Tree of Life': "It is a form with a party-wide effect, and the simulator models neither forms nor your party.",
  'Druid|Omen of Clarity / Primal Fury': "It procs, and the simulator doesn't play the fight out moment by moment.",
  'Druid|Starlight Wrath / Focused Starlight / Improved Moonfire / Vengeance / Moonfury / Wrath of Cenarius / Insect Swarm / Brambles': PARTICULAR_SPELLS,
  'Druid|Feral Aggression / Shredding Attacks / Savage Fury / Predatory Instincts / Mangle': PARTICULAR_ABILITIES,
  'Druid|Improved Rejuvenation / Empowered Touch / Improved Regrowth / Swiftmend / Empowered Rejuvenation / Gift of Nature':
    'It strengthens particular heals, or all healing, and the simulator has nowhere to apply either, even to Lifebloom, which it casts.',
  'Druid|Dreamstate': "Its mana regeneration isn't read: the simulator's mana figures read only MP5 and Spirit.",
  "Druid|Nature's Grace / Nature's Swiftness / Force of Nature": MOMENT_BY_MOMENT,
  'Druid|Feral Swiftness / Nurturing Instinct / Improved Leader of the Pack': SURVIVAL,
  'Druid|Improved Mark of the Wild': UNTALENTED_BUFF,
  'Paladin|Spell Warding / Improved Righteous Fury': "It lowers damage you take, which the simulator doesn't model for damage.",
  'Paladin|Vengeance / Sanctity Aura': "It procs or needs your party, and the simulator models neither.",
  'Paladin|Crusade': "It only works on some kinds of creature, and the simulator doesn't know what the boss is.",
  'Paladin|Shield Specialization': 'It raises how much a block absorbs, and the simulator only counts whether you block.',
  'Paladin|Improved Seal of Righteousness / Healing Light / Sanctified Light / Purifying Power / Holy Power / Holy Shock': PARTICULAR_SPELLS,
  "Paladin|Illumination / Divine Favor / Light's Grace / Divine Illumination": MOMENT_BY_MOMENT,
  'Paladin|Holy Guidance / Combat Expertise (expertise)':
    "Holy Guidance's spell power from Intellect isn't read, and Combat Expertise's expertise is a tank's, which nothing here rolls.",
  'Paladin|Improved Blessing of Wisdom / Improved Devotion Aura / Improved Blessing of Might / Improved Retribution Aura / Improved Sanctity Aura': UNTALENTED_BUFF,
  "Paladin|Redoubt / Reckoning / One-Handed Weapon Specialization / Improved Holy Shield / Holy Shield / Ardent Defender / Avenger's Shield": TANK_NOT_READ,
  'Paladin|Improved Judgement / Fanaticism': "It changes Judgement, and the simulator uses the base Judgement.",
  'Paladin|Blessed Life / Pursuit of Justice / Eye for an Eye / Divine Purpose': SURVIVAL,
  "Mage|Ignite / Combustion / Winter's Chill": "It changes particular spells or schools, and the simulator casts one generic spell for the spec.",
  'Mage|Arcane Power / Presence of Mind / Icy Veins': "It is a cooldown you press; how often it's up depends on the fight, which the simulator doesn't play out.",
  'Mage|Empowered Fireball / Empowered Frostbolt': "It strengthens one spell, and the simulator casts one generic spell for the spec.",
  'Mage|Arcane Subtlety / Arcane Focus / Elemental Precision':
    'It changes hit or resistances for some schools of magic, and the simulator only reads hit that applies to all your spells.',
  'Mage|Critical Mass / Pyromaniac / Fire Power / Piercing Ice / Arctic Winds': "It changes one school of magic, and the simulator doesn't read school bonuses from Mage talents yet.",
  'Mage|Spell Power / Ice Shards': "It raises crit damage, which the simulator doesn't take from talents yet.",
  "Mage|Arcane Impact / Empowered Arcane Missiles / Improved Fireball / Incineration / Improved Flamestrike / Improved Frostbolt / Improved Cone of Cold / Wand Specialization / Pyroblast / Blast Wave / Dragon's Breath / Summon Water Elemental":
    PARTICULAR_SPELLS,
  'Mage|Arcane Potency / Improved Scorch / Molten Fury':
    "It works only for a while (while Clearcasting, while Scorch is kept up, below 20% health), and the simulator doesn't play the fight out moment by moment.",
  'Mage|Magic Absorption / Arcane Fortitude / Improved Mana Shield / Improved Blink / Prismatic Cloak / Frost Warding / Frozen Core / Ice Barrier': SURVIVAL,
  'Priest|Shadow Weaving / Misery': "It stacks on the boss as you cast, and the simulator doesn't play the fight out moment by moment.",
  'Priest|Inner Focus / Power Infusion': "It is a cooldown you press; how often it's up depends on the fight, which the simulator doesn't play out.",
  'Priest|Improved Renew / Empowered Healing': 'It strengthens particular heals, and the simulator casts one generic heal.',
  'Priest|Improved Power Word: Shield / Focused Power / Divine Fury / Searing Light / Surge of Light / Improved Shadow Word: Pain / Improved Mind Blast / Shadow Power / Reflective Shield / Wand Specialization / Holy Nova / Lightwell':
    PARTICULAR_SPELLS,
  'Priest|Holy Specialization / Shadow Focus / Darkness / Shadowform': "It changes one school of magic, and the simulator doesn't read school bonuses from Priest talents yet.",
  'Priest|Mental Agility / Mental Strength / Holy Concentration': HEALER_MANA,
  'Priest|Spiritual Healing': "Its healing bonus isn't read from talents yet.",
  'Priest|Improved Inner Fire / Focused Will / Spell Warding / Blessed Recovery / Blessed Resilience / Shadow Resilience / Pain Suppression': SURVIVAL,
  'Priest|Improved Power Word: Fortitude / Improved Divine Spirit': UNTALENTED_BUFF,
  'Warlock|Master Demonologist': "It depends on which demon you have out, and the simulator doesn't read it yet.",
  'Warlock|Fel Intellect / Fel Stamina': "It raises mana and health, which the simulator doesn't use for a damage dealer.",
  'Warlock|Improved Shadow Bolt / Ruin / Emberstorm': "It changes particular spells or schools, and the simulator doesn't read those bonuses from Warlock talents yet.",
  'Warlock|Soul Leech / Nightfall': "It procs, and the simulator doesn't play the fight out moment by moment.",
  'Warlock|Improved Corruption / Empowered Corruption / Improved Curse of Agony / Contagion / Soul Siphon / Bane / Improved Immolate / Shadow and Flame / Improved Searing Pain / Shadowburn / Conflagrate / Shadowfury':
    PARTICULAR_SPELLS,
  'Warlock|Suppression / Shadow Mastery / Devastation': "It changes one school or tree of spells, and the simulator doesn't read those bonuses from Warlock talents yet.",
  'Warlock|Amplify Curse': COOLDOWN,
  'Warlock|Improved Imp / Improved Sayaad / Improved Firebolt / Improved Lash of Pain / Demonic Knowledge':
    "It strengthens a demon other than the Felguard, or reads your demon's stats, and the simulator models only the Felguard's damage.",
  'Warlock|Demonic Aegis / Master Conjuror': "Its armor or stone bonus isn't read from talents yet.",
  'Warlock|Malediction': 'It strengthens Curse of the Elements, and the Buffs tab uses the untalented curse.',
  'Warlock|Demonic Resilience / Soul Link / Nether Protection': SURVIVAL,
}

/** Each skipped talent's plain reason, by the talent ids the ingest resolved each refusal to. */
const skippedById = new Map<number, string>()
for (const entry of rawTalentEffects.skipped) {
  const reason = PLAIN_SKIP[`${entry.className}|${entry.talent}`] ?? entry.reason
  for (const { talentId } of entry.talents) skippedById.set(talentId, reason)
}

/** The talents the ingest lists as not read (`talentEffects.json` `notRead`), by class and talent id. */
const notReadByKey = new Map(rawTalentEffects.notRead.map((entry) => [`${entry.className}|${entry.talentId}`, entry]))

export type TalentSimStatus = { kind: 'sim' | 'skip' | 'ability' | 'none'; text: string }

/**
 * Whether the simulator reads a talent: its effects, why it is skipped, or why it needs no reading. A
 * talent that teaches an ability a spec's estimate includes (Bloodthirst, Seal of Command) says the
 * ability is there although the point is not read; one whose effect is a buff or debuff the Buffs tab
 * carries (Trueshot Aura, Improved Faerie Fire) points there. Both read as counted, which they are.
 * The ingest accounts for every talent, so what is left is utility.
 */
export function talentSimStatus(className: TbcClass, talent: Talent, rank: number): TalentSimStatus {
  const lines = talentEffectLines(talent.id, Math.max(1, rank))
  if (lines.length) return { kind: 'sim', text: `${rank ? 'In the simulation' : 'In the simulation at rank 1'}: ${lines.join('; ')}` }
  const notRead = notReadByKey.get(`${className}|${talent.id}`)
  // Before the skips: Stormstrike's Nature debuff is skipped, but its strike is in Enhancement's rotation.
  if (notRead?.kind === 'ability') {
    const note = notRead.note ? ` ${notRead.note}` : ''
    return { kind: 'ability', text: `Its ability is in the simulated ${notRead.spec} rotation; the talent point itself isn't read.${note}` }
  }
  const skipped = skippedById.get(talent.id)
  if (skipped) return { kind: 'skip', text: `Not simulated: ${skipped}` }
  if (notRead?.kind === 'buff') {
    const name = notRead.buff ? getBuffById(notRead.buff)?.name : getTargetDebuffById(notRead.debuff ?? '')?.name
    return { kind: 'ability', text: `It is on the Buffs tab as ${name}: tick it there. The talent point itself isn't read.` }
  }
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
