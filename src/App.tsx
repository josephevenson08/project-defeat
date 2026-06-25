import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Clipboard,
  ExternalLink,
  Filter,
  Gem,
  Hammer,
  Info,
  LayoutDashboard,
  Search,
  ShieldCheck,
  Sparkles,
  Sword,
  Trophy,
  X,
  WandSparkles,
} from 'lucide-react'
import './App.css'
import { getMaterialSource, getPhase2EnhancementPlan, type Enhancement } from './data/phase2Enhancements'
import { getPhase2SpecGuide, phase2SpecGuides } from './data/phase2SpecGuides'

type Faction = 'Alliance' | 'Horde'
type Phase = 1 | 2 | 3 | 4 | 5
type Role = 'melee' | 'caster' | 'healer' | 'tank' | 'hunter'
type Slot =
  | 'Head'
  | 'Neck'
  | 'Shoulder'
  | 'Back'
  | 'Chest'
  | 'Wrist'
  | 'Hands'
  | 'Waist'
  | 'Legs'
  | 'Feet'
  | 'Ring 1'
  | 'Ring 2'
  | 'Trinket 1'
  | 'Trinket 2'
  | 'Main Hand'
  | 'Off Hand'
  | 'Ranged'

type PlayerClass =
  | 'Warrior'
  | 'Paladin'
  | 'Hunter'
  | 'Rogue'
  | 'Priest'
  | 'Shaman'
  | 'Mage'
  | 'Warlock'
  | 'Druid'

type Race =
  | 'Human'
  | 'Dwarf'
  | 'Night Elf'
  | 'Gnome'
  | 'Draenei'
  | 'Orc'
  | 'Undead'
  | 'Tauren'
  | 'Troll'
  | 'Blood Elf'

type CraftMaterial = {
  id?: number
  name: string
  quantity?: number
}

type GuideProvider = 'Wowhead' | 'Icy Veins' | 'Both' | 'Starter' | 'Wowhead + wowtbc.gg'
type SourceAgreement = 'Wowhead-only' | 'Icy-Veins-only' | 'both' | 'wowtbc-cross-check' | 'starter'
type Confidence = 'starter' | 'guide' | 'sim' | 'unverified'
type GuideMention = {
  provider: 'Wowhead' | 'Icy Veins' | 'wowtbc.gg'
  spec: string
  phase: Phase | 'PreRaid'
  rank?: number
  label?: 'BiS' | 'Great' | 'Alternative' | 'Near-BiS' | 'Profession Option'
  url: string
}
type ItemSynergy = {
  class: PlayerClass
  spec: string
  phase: Phase
  bonus: number
  label: string
  races?: Race[]
  excludedRaces?: Race[]
}
type SpecRestriction = {
  class: PlayerClass
  specs: string[]
}

type RankingLabel = NonNullable<GuideMention['label']>

type ItemDefinition = {
  id: number
  name: string
  slot: Slot | 'Ring' | 'Trinket' | 'One Hand'
  phase: Phase
  roles: Role[]
  source: string
  type: 'Raid' | 'Dungeon' | 'Crafted' | 'Reputation' | 'Badge' | 'Quest' | 'PvP'
  stats: Partial<Record<string, number>>
  profession?: string
  requiresProfession?: string
  requiresProfessionSpecialization?: string
  craftedByProfession?: string
  bindType?: 'BoP' | 'BoE'
  equippableWithoutProfession?: boolean
  guideMentions?: GuideMention[]
  synergies?: ItemSynergy[]
  materials?: CraftMaterial[]
  craftNote?: string
  confidence?: Confidence
  guideProvider?: GuideProvider
  sourceAgreement?: SourceAgreement
  sourceUrl?: string
  isAlternative?: boolean
  guideOnly?: boolean
  allowedClasses?: PlayerClass[]
  allowedSpecs?: SpecRestriction[]
  faction?: Faction
  unique?: boolean
  twoHanded?: boolean
  planningNote?: string
  note?: string
}

type Item = ItemDefinition

type SpecSlotRanking = {
  itemId: number
  class: PlayerClass
  spec: string
  phase: Phase
  slot: Item['slot']
  rank: number
  label: RankingLabel
  sourceUrl: string
  guideProvider: GuideProvider
  mentionProvider?: GuideMention['provider']
  sourceAgreement: SourceAgreement
  confidence: Confidence
  professionRequired?: string
  craftedByProfession?: string
  setBonusContext?: string
  raceNotes?: string
  notes: string
}

type Equipped = Record<Slot, Item | undefined>
type InitialState = {
  faction: Faction
  race: Race
  playerClass: PlayerClass
  spec: string
  phase: Phase
  selectedProfessions: string[]
  gear: Equipped
  ownedItemIds: number[]
}

type ImportStageEntry = {
  id: number
  item?: Item
  status: 'equippable' | 'blocked' | 'unknown' | 'duplicate'
  reason: string
  slot?: Slot
}

const CURRENT_PHASE: Phase = 2
const MAX_PRIMARY_PROFESSIONS = 2

const phases: { id: Phase; label: string; detail: string }[] = [
  { id: 1, label: 'Phase 1', detail: 'Karazhan, Gruul, Magtheridon, heroics' },
  { id: 2, label: 'Phase 2', detail: 'Current: SSC, The Eye, Arena S2' },
  { id: 3, label: 'Phase 3', detail: 'Hyjal and Black Temple planning' },
  { id: 4, label: 'Phase 4', detail: 'Zul Aman planning' },
  { id: 5, label: 'Phase 5', detail: 'Sunwell and Isle planning' },
]

const slots: Slot[] = [
  'Head',
  'Neck',
  'Shoulder',
  'Back',
  'Chest',
  'Wrist',
  'Hands',
  'Waist',
  'Legs',
  'Feet',
  'Ring 1',
  'Ring 2',
  'Trinket 1',
  'Trinket 2',
  'Main Hand',
  'Off Hand',
  'Ranged',
]

const characterPaneSlots = {
  left: ['Head', 'Neck', 'Shoulder', 'Back', 'Chest', 'Wrist', 'Hands', 'Waist'] as Slot[],
  right: ['Legs', 'Feet', 'Ring 1', 'Ring 2', 'Trinket 1', 'Trinket 2', 'Ranged'] as Slot[],
  weapons: ['Main Hand', 'Off Hand'] as Slot[],
}

const classSpecs: Record<PlayerClass, { name: string; role: Role; note: string }[]> = {
  Warrior: [
    { name: 'Protection', role: 'tank', note: 'Threat and mitigation priorities.' },
    { name: 'Fury', role: 'melee', note: 'Hit, expertise, weapon quality, and armor penetration matter.' },
    { name: 'Arms', role: 'melee', note: 'Raid debuff value can outweigh personal output.' },
  ],
  Paladin: [
    { name: 'Holy', role: 'healer', note: 'Healing power, crit, and sustain.' },
    { name: 'Protection', role: 'tank', note: 'Spell damage threat plus defense and avoidance.' },
    { name: 'Retribution', role: 'melee', note: 'Weapon damage, hit, crit, and seal assumptions.' },
  ],
  Hunter: [
    { name: 'Beast Mastery', role: 'hunter', note: 'Ranged weapon, hit, agility, and pet scaling.' },
    { name: 'Marksmanship', role: 'hunter', note: 'Ranged DPS and raid utility.' },
    { name: 'Survival', role: 'hunter', note: 'Agility and expose weakness value.' },
  ],
  Rogue: [
    { name: 'Combat', role: 'melee', note: 'Weapon speed, hit, expertise, and haste.' },
    { name: 'Assassination', role: 'melee', note: 'Poison assumptions and hit value shift.' },
    { name: 'Subtlety', role: 'melee', note: 'Mostly niche PvE; recommendations are conservative.' },
  ],
  Priest: [
    { name: 'Holy', role: 'healer', note: 'Healing power, spirit, and regen.' },
    { name: 'Discipline', role: 'healer', note: 'Healing support with mana stability.' },
    { name: 'Shadow', role: 'caster', note: 'Spell hit cap and shadow damage synergy.' },
  ],
  Shaman: [
    { name: 'Restoration', role: 'healer', note: 'Chain Heal throughput and MP5.' },
    { name: 'Elemental', role: 'caster', note: 'Spell hit, spell damage, and crit.' },
    { name: 'Enhancement', role: 'melee', note: 'Dual wield hit, expertise, and weapon speed.' },
  ],
  Mage: [
    { name: 'Arcane', role: 'caster', note: 'Mana model changes rankings heavily.' },
    { name: 'Fire', role: 'caster', note: 'Spell hit and crit scaling.' },
    { name: 'Frost', role: 'caster', note: 'Mostly utility or early gearing.' },
  ],
  Warlock: [
    { name: 'Affliction', role: 'caster', note: 'Spell hit and shadow damage assumptions.' },
    { name: 'Demonology', role: 'caster', note: 'Pet and raid-buff dependent.' },
    { name: 'Destruction', role: 'caster', note: 'Shadow/fire variant changes rankings.' },
  ],
  Druid: [
    { name: 'Restoration', role: 'healer', note: 'Healing power, spirit, and tree uptime.' },
    { name: 'Balance', role: 'caster', note: 'Spell hit and crit with moonkin aura.' },
    { name: 'Feral Bear', role: 'tank', note: 'Armor, stamina, agility, and threat.' },
    { name: 'Feral Cat', role: 'melee', note: 'Hit, expertise, agility, and armor penetration.' },
  ],
}

const racesByFaction: Record<Faction, Race[]> = {
  Alliance: ['Human', 'Dwarf', 'Night Elf', 'Gnome', 'Draenei'],
  Horde: ['Orc', 'Undead', 'Tauren', 'Troll', 'Blood Elf'],
}

const legalRaceClasses: Record<Race, PlayerClass[]> = {
  Human: ['Warrior', 'Paladin', 'Rogue', 'Priest', 'Mage', 'Warlock'],
  Dwarf: ['Warrior', 'Paladin', 'Hunter', 'Rogue', 'Priest'],
  'Night Elf': ['Warrior', 'Hunter', 'Rogue', 'Priest', 'Druid'],
  Gnome: ['Warrior', 'Rogue', 'Mage', 'Warlock'],
  Draenei: ['Warrior', 'Paladin', 'Hunter', 'Priest', 'Mage', 'Shaman'],
  Orc: ['Warrior', 'Hunter', 'Rogue', 'Shaman', 'Warlock'],
  Undead: ['Warrior', 'Rogue', 'Priest', 'Mage', 'Warlock'],
  Tauren: ['Warrior', 'Hunter', 'Shaman', 'Druid'],
  Troll: ['Warrior', 'Hunter', 'Rogue', 'Priest', 'Shaman', 'Mage'],
  'Blood Elf': ['Paladin', 'Hunter', 'Rogue', 'Priest', 'Mage', 'Warlock'],
}

const professions = [
  'Blacksmithing',
  'Leatherworking',
  'Tailoring',
  'Jewelcrafting',
  'Engineering',
  'Enchanting',
  'Alchemy',
]

const roleWeights: Record<Role, Partial<Record<string, number>>> = {
  melee: { attackPower: 1, agility: 1.2, strength: 1.1, hit: 2.2, expertise: 2.1, crit: 1.4, haste: 1.5 },
  hunter: { attackPower: 1, agility: 1.45, hit: 2.2, crit: 1.5, haste: 1.4 },
  caster: { spellPower: 1, spellHit: 2.4, spellCrit: 1.35, spellHaste: 1.55, intellect: 0.35 },
  healer: { healing: 1, mp5: 1.5, spirit: 0.8, spellCrit: 0.75, intellect: 0.45 },
  tank: { stamina: 1.25, defense: 2, dodge: 1.7, parry: 1.6, block: 0.9, armor: 0.08, spellPower: 0.35 },
}

const ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL = 'https://www.wowhead.com/tbc/guide/classes/shaman/enhancement/dps-bis-gear-pve-phase-2'
const WOWTBC_ENHANCEMENT_SHAMAN_T5_URL = 'https://wowtbc.gg/bis-list/enhancement-shaman/'
const ROGUE_PHASE_2_GUIDE_URL = 'https://www.wowhead.com/tbc/guide/classes/rogue/dps-bis-gear-pve-phase-2'
const BM_HUNTER_PHASE_2_GUIDE_URL = 'https://www.wowhead.com/tbc/guide/classes/hunter/beast-mastery/dps-bis-gear-pve-phase-2'
const RET_PALADIN_PHASE_2_GUIDE_URL = 'https://www.wowhead.com/tbc/guide/classes/paladin/retribution/dps-bis-gear-pve-phase-2'

const guideSynergyRules: Record<number, ItemSynergy[]> = {
  30146: [
    { class: 'Rogue', spec: 'Combat', phase: 2, bonus: 100, label: 'Deathmantle 4-piece chase: Wowhead ranks tier helm ahead because the Rogue set bonus beats isolated stat upgrades.' },
  ],
  30149: [
    { class: 'Rogue', spec: 'Combat', phase: 2, bonus: 80, label: 'Deathmantle shoulder/chest pairing: choose this with Bloodsea Brigand\'s Vest to preserve the 4-piece set bonus.' },
  ],
  30144: [
    { class: 'Rogue', spec: 'Combat', phase: 2, bonus: 80, label: 'Deathmantle chest/shoulder pairing: choose this with Shoulderpads of the Stranger to preserve the 4-piece set bonus.' },
  ],
  30145: [
    { class: 'Rogue', spec: 'Combat', phase: 2, bonus: 100, label: 'Deathmantle 4-piece chase: guide notes gloves are both individually strong and set-bonus enabling.' },
  ],
  30148: [
    { class: 'Rogue', spec: 'Combat', phase: 2, bonus: 110, label: 'Deathmantle 4-piece chase: guide keeps tier legs over slightly stronger standalone legs for set bonus value.' },
  ],
  30141: [
    { class: 'Hunter', spec: 'Beast Mastery', phase: 2, bonus: 95, label: 'Rift Stalker 4-piece transition: do not break Beast Lord until enough Tier 5 pieces are ready.' },
    { class: 'Hunter', spec: 'Marksmanship', phase: 2, bonus: 80, label: 'Rift Stalker tier planning: hunter set bonuses and ranged rotation synergy beat raw stat sorting.' },
    { class: 'Hunter', spec: 'Survival', phase: 2, bonus: 85, label: 'Rift Stalker tier planning: Survival values agility and set context, not one-slot stat totals.' },
  ],
  30143: [
    { class: 'Hunter', spec: 'Beast Mastery', phase: 2, bonus: 85, label: 'Rift Stalker 4-piece transition slot: keep tier visible for set completion planning.' },
    { class: 'Hunter', spec: 'Marksmanship', phase: 2, bonus: 75, label: 'Hunter shoulder ranking depends on Rift Stalker set completion and hit profile.' },
    { class: 'Hunter', spec: 'Survival', phase: 2, bonus: 80, label: 'Survival shoulder ranking depends on set completion and agility scaling.' },
  ],
  30139: [
    { class: 'Hunter', spec: 'Beast Mastery', phase: 2, bonus: 95, label: 'Rift Stalker 4-piece transition: chest is part of the Phase 2 set completion plan.' },
    { class: 'Hunter', spec: 'Marksmanship', phase: 2, bonus: 80, label: 'Hunter chest ranking depends on tier count, hit profile, and guide set assumptions.' },
    { class: 'Hunter', spec: 'Survival', phase: 2, bonus: 85, label: 'Survival chest ranking depends on tier count and agility scaling.' },
  ],
  30140: [
    { class: 'Hunter', spec: 'Beast Mastery', phase: 2, bonus: 95, label: 'Rift Stalker 4-piece transition: gloves help reach the guide-backed Tier 5 breakpoint.' },
    { class: 'Hunter', spec: 'Marksmanship', phase: 2, bonus: 80, label: 'Hunter glove ranking depends on Rift Stalker set context.' },
    { class: 'Hunter', spec: 'Survival', phase: 2, bonus: 85, label: 'Survival glove ranking depends on set context and agility scaling.' },
  ],
  30142: [
    { class: 'Hunter', spec: 'Beast Mastery', phase: 2, bonus: 95, label: 'Rift Stalker 4-piece transition: legs remain a set-completion priority instead of raw stat bait.' },
    { class: 'Hunter', spec: 'Marksmanship', phase: 2, bonus: 80, label: 'Hunter leg ranking depends on Rift Stalker set context.' },
    { class: 'Hunter', spec: 'Survival', phase: 2, bonus: 85, label: 'Survival leg ranking depends on set context and agility scaling.' },
  ],
  27484: [
    { class: 'Paladin', spec: 'Retribution', phase: 2, bonus: 90, label: 'Retribution libram priority: Wowhead notes Libram of Avengement remains the Ret libram for essentially the whole expansion.' },
  ],
  24266: [
    { class: 'Mage', spec: 'Arcane', phase: 2, bonus: 70, label: 'Spellstrike remains a guide-priority caster set piece until Tier 5 set bonuses and hit caps are solved.' },
    { class: 'Mage', spec: 'Fire', phase: 2, bonus: 55, label: 'Spellstrike remains a strong caster planning piece because spell hit and crit beat raw spell power alone.' },
    { class: 'Mage', spec: 'Frost', phase: 2, bonus: 45, label: 'Spellstrike is retained as a guide-backed caster fallback when Phase 2 tier coverage is incomplete.' },
    { class: 'Warlock', spec: 'Destruction', phase: 2, bonus: 55, label: 'Spellstrike keeps value for Warlock hit planning; raw spell power alone should not decide the slot.' },
    { class: 'Warlock', spec: 'Affliction', phase: 2, bonus: 45, label: 'Spellstrike supports spell-hit planning for Warlock alternatives before full Tier 5 coverage.' },
    { class: 'Priest', spec: 'Shadow', phase: 2, bonus: 45, label: 'Shadow Priest gearing values spell hit enough that Spellstrike remains a guide-relevant fallback.' },
  ],
  24262: [
    { class: 'Mage', spec: 'Arcane', phase: 2, bonus: 70, label: 'Spellstrike two-piece planning: keep the set visible because set and hit value can beat isolated leg stats.' },
    { class: 'Mage', spec: 'Fire', phase: 2, bonus: 55, label: 'Spellstrike two-piece planning keeps these legs relevant in guide-style caster rankings.' },
    { class: 'Warlock', spec: 'Destruction', phase: 2, bonus: 55, label: 'Spellstrike two-piece planning remains important for Warlock hit and crit gearing.' },
    { class: 'Priest', spec: 'Shadow', phase: 2, bonus: 45, label: 'Spellstrike two-piece planning is a Shadow Priest fallback until guide-imported Tier 5 alternatives are complete.' },
  ],
  21848: [
    { class: 'Mage', spec: 'Fire', phase: 2, bonus: 65, label: 'Spellfire set synergy: fire-focused spell damage can beat higher generic raw stats in guide lists.' },
    { class: 'Warlock', spec: 'Destruction', phase: 2, bonus: 45, label: 'Spellfire is a spec-dependent crafted set; keep it ranked as a profession planning option, not just raw stats.' },
  ],
  30038: [
    { class: 'Mage', spec: 'Arcane', phase: 2, bonus: 45, label: 'Tailoring crafted caster belt is guide-relevant even when Tailoring is not selected; show as a profession plan.' },
    { class: 'Mage', spec: 'Fire', phase: 2, bonus: 35, label: 'Tailoring crafted caster belt remains a Phase 2 alternative because hit/crit balance matters.' },
    { class: 'Warlock', spec: 'Destruction', phase: 2, bonus: 35, label: 'Tailoring crafted caster belt is a guide-style profession alternative for spell-hit planning.' },
    { class: 'Priest', spec: 'Shadow', phase: 2, bonus: 35, label: 'Tailoring crafted caster belt is kept visible for Shadow Priest hit planning.' },
  ],
  30095: [
    { class: 'Mage', spec: 'Arcane', phase: 2, bonus: 55, label: 'Phase 2 caster weapon priority: high spell power plus hit/crit is a guide-ranked upgrade path.' },
    { class: 'Mage', spec: 'Fire', phase: 2, bonus: 45, label: 'Phase 2 caster weapon priority should outrank lower-tier weapons even if secondary stats vary.' },
    { class: 'Warlock', spec: 'Destruction', phase: 2, bonus: 50, label: 'Warlock caster weapon priority values the full spell package, not one stat column.' },
    { class: 'Priest', spec: 'Shadow', phase: 2, bonus: 45, label: 'Shadow Priest caster weapon priority values spell hit alongside spell power.' },
    { class: 'Shaman', spec: 'Elemental', phase: 2, bonus: 45, label: 'Elemental Shaman caster weapon priority values hit and crit synergy.' },
    { class: 'Druid', spec: 'Balance', phase: 2, bonus: 40, label: 'Balance Druid caster weapon priority values the full spell package over raw spell power only.' },
  ],
  30055: [
    { class: 'Rogue', spec: 'Combat', phase: 2, bonus: 55, label: 'Rogue Phase 2 shoulder/chest offset planning: shoulders are tied to maintaining Deathmantle four-piece.' },
    { class: 'Warrior', spec: 'Fury', phase: 2, bonus: 35, label: 'Melee offset shoulders remain guide-relevant when hit balance beats a single larger stat line.' },
    { class: 'Druid', spec: 'Feral Cat', phase: 2, bonus: 30, label: 'Feral Cat offset shoulders remain a guide-style melee alternative with hit planning value.' },
    { class: 'Shaman', spec: 'Enhancement', phase: 2, bonus: 120, label: 'Enhancement Phase 2 offset shoulder: use this while keeping Cataclysm helm/chest/gloves/legs for the 4-piece package.' },
    { class: 'Paladin', spec: 'Retribution', phase: 2, bonus: 95, label: 'Retribution Phase 2 expertise shoulder: Wowhead emphasizes this as a major Ret priority.' },
  ],
  30101: [
    { class: 'Rogue', spec: 'Combat', phase: 2, bonus: 55, label: 'Rogue Phase 2 chest/shoulder offset planning: this vest is ranked around Deathmantle four-piece setups.' },
    { class: 'Warrior', spec: 'Fury', phase: 2, bonus: 35, label: 'High-value melee chest remains guide-relevant, but must be compared with set-bonus slots.' },
    { class: 'Druid', spec: 'Feral Cat', phase: 2, bonus: 30, label: 'Feral Cat chest planning values agility, hit, and crit together rather than one raw stat.' },
  ],
  29966: [
    { class: 'Rogue', spec: 'Combat', phase: 2, bonus: 50, label: 'Rogue guide priority bracer: Phase 2 ranking accounts for hit-starved gearing and alternatives.' },
    { class: 'Hunter', spec: 'Beast Mastery', phase: 2, bonus: 40, label: 'Hunter bracer priority: compare against Bands of the Celestial Archer rather than raw AP alone.' },
    { class: 'Hunter', spec: 'Marksmanship', phase: 2, bonus: 40, label: 'Hunter bracer priority: agility and hit balance can change the correct ranking.' },
    { class: 'Hunter', spec: 'Survival', phase: 2, bonus: 40, label: 'Hunter bracer priority: agility scaling and hit balance matter more than isolated AP.' },
    { class: 'Druid', spec: 'Feral Cat', phase: 2, bonus: 45, label: 'Feral Cat wrist correction: Vambraces of Ending should beat Bracers of Eradication in the guide-backed list.' },
  ],
  30026: [
    { class: 'Hunter', spec: 'Beast Mastery', phase: 2, bonus: 55, label: 'Hunter Phase 2 bracer case: Bands of the Celestial Archer stay near-BiS because hit and agility synergy matter.' },
    { class: 'Hunter', spec: 'Marksmanship', phase: 2, bonus: 55, label: 'Hunter Phase 2 bracer case: hit and agility synergy can beat flashier isolated stat totals.' },
    { class: 'Hunter', spec: 'Survival', phase: 2, bonus: 65, label: 'Survival Hunter agility scaling makes these bracers especially important in guide-style rankings.' },
  ],
  30040: [
    { class: 'Rogue', spec: 'Combat', phase: 2, bonus: 35, label: 'Belt of Deep Shadow is a crafted profession alternative; it should stay visible even without Leatherworking selected.' },
    { class: 'Hunter', spec: 'Beast Mastery', phase: 2, bonus: 35, label: 'Belt of Deep Shadow remains a profession planning option, but guide ranking depends on hit and set context.' },
    { class: 'Druid', spec: 'Feral Cat', phase: 2, bonus: 35, label: 'Feral Cat crafted belt planning keeps profession items visible without hiding raid alternatives.' },
  ],
  30106: [
    { class: 'Rogue', spec: 'Combat', phase: 2, bonus: 55, label: 'Guide-priority melee belt: expertise and agility synergy beat a simple raw AP sort.' },
    { class: 'Shaman', spec: 'Enhancement', phase: 2, bonus: 35, label: 'Enhancement belt priority values expertise-like weapon reliability and total package over AP alone.' },
    { class: 'Warrior', spec: 'Fury', phase: 2, bonus: 45, label: 'Fury belt priority values expertise and hit package, not just attack power.' },
    { class: 'Druid', spec: 'Feral Cat', phase: 2, bonus: 40, label: 'Feral Cat belt priority values agility plus expertise-style reliability.' },
  ],
  28830: [
    { class: 'Rogue', spec: 'Combat', phase: 2, bonus: 90, label: 'Dragonspine Trophy is a long-lived guide-priority trinket because haste proc synergy is not captured by static stats.' },
    { class: 'Warrior', spec: 'Fury', phase: 2, bonus: 80, label: 'Dragonspine Trophy proc synergy makes it a guide-priority melee trinket beyond static score.' },
    { class: 'Hunter', spec: 'Beast Mastery', phase: 2, bonus: 70, label: 'Dragonspine Trophy proc value is class/speed dependent and should not be treated as plain haste rating only.' },
    { class: 'Shaman', spec: 'Enhancement', phase: 2, bonus: 70, label: 'Enhancement trinket value depends on proc uptime and weapon swings; static stats understate this item.' },
  ],
  29383: [
    { class: 'Shaman', spec: 'Enhancement', phase: 2, bonus: 70, label: 'Enhancement trinket correction: Bloodlust Brooch is a guide-priority partner to Dragonspine Trophy.' },
  ],
  28785: [
    { class: 'Mage', spec: 'Arcane', phase: 2, bonus: 45, label: 'Lightning Capacitor is proc-driven; caster trinket ranking must include crit/proc synergy.' },
    { class: 'Mage', spec: 'Fire', phase: 2, bonus: 55, label: 'Fire Mage crit/proc synergy keeps Lightning Capacitor relevant beyond static spell power.' },
    { class: 'Shaman', spec: 'Elemental', phase: 2, bonus: 60, label: 'Elemental Shaman crit/proc synergy makes Lightning Capacitor stronger than static stats imply.' },
  ],
  28439: [
    { class: 'Warrior', spec: 'Fury', phase: 2, bonus: 65, label: 'Dragonstrike remains a Blacksmithing weapon plan because haste proc and weapon specialization change rankings.' },
    { class: 'Rogue', spec: 'Combat', phase: 2, bonus: 35, label: 'Dragonstrike should appear as a profession weapon alternative even when Blacksmithing is not selected.' },
    { class: 'Shaman', spec: 'Enhancement', phase: 2, bonus: 35, label: 'Enhancement weapon lists should keep crafted Blacksmithing options visible for planning, then validate class/profession legality.' },
  ],
  32944: [
    { class: 'Warrior', spec: 'Fury', phase: 2, bonus: 95, label: 'Fury main-hand correction: use a one-hand weapon path, not Twinblade of the Phoenix.' },
  ],
  31965: [
    { class: 'Shaman', spec: 'Enhancement', phase: 2, bonus: 105, races: ['Orc'], label: 'Orc Enhancement axe path: Merciless Gladiator cleavers benefit from Axe Specialization and should appear as an Orc-specific plan.' },
  ],
  30082: [
    { class: 'Rogue', spec: 'Combat', phase: 2, bonus: 120, label: 'Combat Rogue weapon correction: Talon of Azshara is the Phase 2 main-hand priority over Netherbane.' },
    { class: 'Warrior', spec: 'Fury', phase: 2, bonus: 95, label: 'Fury off-hand correction: Talon of Azshara is the guide-priority off-hand.' },
  ],
  29993: [
    { class: 'Warrior', spec: 'Fury', phase: 2, bonus: 45, label: 'Two-handed/raw weapon stats do not automatically fit every melee spec; legality and spec build matter.' },
    { class: 'Paladin', spec: 'Retribution', phase: 2, bonus: 70, label: 'Retribution weapon ranking is swing-timer and seal dependent; high weapon damage matters more than raw secondary stats.' },
    { class: 'Warrior', spec: 'Arms', phase: 2, bonus: 65, label: 'Arms weapon ranking is weapon-damage and build dependent, not a generic melee stat sort.' },
  ],
  29924: [
    { class: 'Hunter', spec: 'Beast Mastery', phase: 2, bonus: 55, label: 'Hunter melee weapon stat-stick path: Netherbane is a guide-relevant Phase 2 main-hand option, not Enhancement-only.' },
    { class: 'Hunter', spec: 'Marksmanship', phase: 2, bonus: 55, label: 'Hunter melee weapon stat-stick path: Phase 2 weapon ranking values agility/hit package and melee-weaving context.' },
    { class: 'Hunter', spec: 'Survival', phase: 2, bonus: 65, label: 'Survival Hunter melee weapon ranking values agility scaling and stat-stick context.' },
  ],
  29948: [
    { class: 'Hunter', spec: 'Beast Mastery', phase: 2, bonus: 70, label: 'Hunter off-hand stat-stick path: Claw of the Phoenix fills the Phase 2 paired weapon plan.' },
    { class: 'Hunter', spec: 'Marksmanship', phase: 2, bonus: 70, label: 'Hunter off-hand stat-stick path: Claw of the Phoenix is a guide-relevant Phase 2 off-hand.' },
    { class: 'Hunter', spec: 'Survival', phase: 2, bonus: 80, label: 'Survival Hunter off-hand ranking values agility scaling and paired weapon context.' },
  ],
  29949: [
    { class: 'Warrior', spec: 'Fury', phase: 2, bonus: 35, label: 'Physical ranged slot is a stat stick for Warriors/Rogues only; hybrids must stay on relics.' },
    { class: 'Rogue', spec: 'Combat', phase: 2, bonus: 35, label: 'Rogue ranged slot is a stat-stick ranking, but class legality still blocks hybrids.' },
  ],
  29947: [
    { class: 'Paladin', spec: 'Retribution', phase: 2, bonus: 70, label: 'Retribution glove correction: Searing Grip beats the generic Dexterous Manipulation fallback in the Phase 2 guide path.' },
    { class: 'Warrior', spec: 'Protection', phase: 2, bonus: 55, label: 'Protection Warrior threat gloves: Searing Grip should remain visible beside mitigation gloves.' },
  ],
  28592: [
    { class: 'Paladin', spec: 'Holy', phase: 2, bonus: 45, label: 'Paladin ranged slot must be a Libram; never replace it with a physical ranged stat stick.' },
    { class: 'Paladin', spec: 'Protection', phase: 2, bonus: 45, label: 'Protection Paladin ranged slot must be a Libram; spell/tank context matters more than generic ranged stats.' },
    { class: 'Paladin', spec: 'Retribution', phase: 2, bonus: 35, label: 'Retribution Paladin ranged slot must remain a Libram even when melee ranged weapons have attractive stats.' },
  ],
  27886: [
    { class: 'Druid', spec: 'Feral Bear', phase: 2, bonus: 45, label: 'Druid ranged slot must be an Idol; tank value is spec-specific and not a generic ranged stat sort.' },
    { class: 'Druid', spec: 'Feral Cat', phase: 2, bonus: 35, label: 'Feral Druid ranged slot must be an Idol; melee stat sticks are illegal.' },
    { class: 'Druid', spec: 'Balance', phase: 2, bonus: 35, label: 'Balance Druid ranged slot must be an Idol; caster wands are illegal.' },
    { class: 'Druid', spec: 'Restoration', phase: 2, bonus: 35, label: 'Restoration Druid ranged slot must be an Idol; healing relic value is class-specific.' },
  ],
  28248: [
    { class: 'Shaman', spec: 'Elemental', phase: 2, bonus: 45, label: 'Elemental Shaman ranged slot must be a Totem; caster wands are illegal even with better raw stats.' },
    { class: 'Shaman', spec: 'Restoration', phase: 2, bonus: 45, label: 'Restoration Shaman ranged slot must be a Totem; healing relic value is class-specific.' },
  ],
}

const baseItems: Item[] = [
  { id: 32461, name: 'Furious Gizmatic Goggles', slot: 'Head', phase: 2, roles: ['melee', 'hunter'], source: 'Engineering goggles, Phase 2 recipes', type: 'Crafted', profession: 'Engineering', stats: { attackPower: 92, hit: 32, crit: 28 }, materials: [{ name: 'Engineering goggle recipe materials' }, { name: 'Primal Nether' }, { name: 'Khorium Power Core' }], craftNote: 'Engineering material list is a starter summary; audit exact recipe quantities.', note: 'New Phase 2 profession recipe.' },
  { id: 32478, name: 'Deathblow X11 Goggles', slot: 'Head', phase: 2, roles: ['melee'], source: 'Engineering goggles, Phase 2 recipes', type: 'Crafted', profession: 'Engineering', stats: { attackPower: 96, hit: 24, crit: 31 }, materials: [{ name: 'Engineering goggle recipe materials' }, { name: 'Primal Nether' }, { name: 'Khorium Power Core' }], craftNote: 'Engineering material list is a starter summary; audit exact recipe quantities.' },
  { id: 32476, name: 'Gadgetstorm Goggles', slot: 'Head', phase: 2, roles: ['caster'], source: 'Engineering goggles, Phase 2 recipes', type: 'Crafted', profession: 'Engineering', stats: { spellPower: 59, spellHit: 24, spellCrit: 28 }, materials: [{ name: 'Engineering goggle recipe materials' }, { name: 'Primal Nether' }, { name: 'Khorium Power Core' }], craftNote: 'Engineering material list is a starter summary; audit exact recipe quantities.' },
  { id: 24266, name: 'Spellstrike Hood', slot: 'Head', phase: 1, roles: ['caster'], source: 'Tailoring: Spellstrike set', type: 'Crafted', craftedByProfession: 'Tailoring', bindType: 'BoE', equippableWithoutProfession: true, stats: { spellPower: 46, spellHit: 16, spellCrit: 24 }, materials: [{ name: 'Spellcloth' }, { name: 'Primal Might' }, { name: 'Primal Nether' }], craftNote: 'Purchasable crafted piece; Tailoring is relevant to set-bonus planning, not basic equip legality.', confidence: 'guide', guideProvider: 'Both', sourceAgreement: 'both', sourceUrl: 'https://www.wowhead.com/tbc/item=24266/spellstrike-hood' },
  { id: 30146, name: 'Deathmantle Helm', slot: 'Head', phase: 2, roles: ['melee'], source: 'Tier 5: Helm of the Vanquished Champion from Lady Vashj, SSC', type: 'Raid', stats: { attackPower: 76, agility: 36, hit: 18, crit: 24, stamina: 39 }, allowedClasses: ['Rogue'], confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=30146/deathmantle-helm', guideMentions: [{ provider: 'Wowhead', spec: 'Rogue Combat', phase: 2, label: 'BiS', url: ROGUE_PHASE_2_GUIDE_URL }], planningNote: 'Rogue Phase 2 tier helm. Wowhead prioritizes Deathmantle four-piece instead of raw one-slot stats.' },
  { id: 30141, name: 'Rift Stalker Helm', slot: 'Head', phase: 2, roles: ['hunter'], source: 'Tier 5: Helm of the Vanquished Hero from Lady Vashj, SSC', type: 'Raid', stats: { attackPower: 92, agility: 38, hit: 18, crit: 24, stamina: 40 }, allowedClasses: ['Hunter'], confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=30141/rift-stalker-helm', guideMentions: [{ provider: 'Wowhead', spec: 'Beast Mastery Hunter', phase: 2, label: 'BiS', url: BM_HUNTER_PHASE_2_GUIDE_URL }], planningNote: 'Hunter Phase 2 tier helm. Guide logic preserves Beast Lord until Rift Stalker four-piece is ready.' },
  { id: 28275, name: 'Beast Lord Helm', slot: 'Head', phase: 1, roles: ['hunter'], source: 'Pathaleon the Calculator, Mechanar; Beast Lord transition set', type: 'Dungeon', stats: { attackPower: 50, agility: 25, intellect: 22, stamina: 21, mp5: 2 }, allowedClasses: ['Hunter'], confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=28275/beast-lord-helm', guideMentions: [{ provider: 'Wowhead', spec: 'Beast Mastery Hunter', phase: 2, label: 'Alternative', url: BM_HUNTER_PHASE_2_GUIDE_URL }], planningNote: 'Beast Lord 4-piece transition head. Keep visible until Rift Stalker 4-piece is complete.' },
  { id: 30190, name: 'Cataclysm Helm', slot: 'Head', phase: 2, roles: ['melee'], source: 'Tier 5: Helm of the Vanquished Champion from Lady Vashj, SSC', type: 'Raid', stats: { strength: 41, agility: 32, intellect: 23, hit: 21, stamina: 46 }, allowedClasses: ['Shaman'], confidence: 'guide', guideProvider: 'Wowhead + wowtbc.gg', sourceAgreement: 'wowtbc-cross-check', sourceUrl: 'https://www.wowhead.com/tbc/item=30190/cataclysm-helm', guideMentions: [{ provider: 'Wowhead', spec: 'Enhancement Shaman', phase: 2, label: 'BiS', url: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL }, { provider: 'wowtbc.gg', spec: 'Enhancement Shaman', phase: 2, label: 'BiS', url: WOWTBC_ENHANCEMENT_SHAMAN_T5_URL }], synergies: [{ class: 'Shaman', spec: 'Enhancement', phase: 2, bonus: 110, label: 'Cataclysm 4-piece chase: Improved Flurry set bonus outweighs higher raw-stat helmets.' }], planningNote: 'Tier 5 Cataclysm Harness piece. Wowhead and wowtbc.gg mark it as part of the Phase 2 4-piece chase.' },
  { id: 32474, name: 'Surestrike Goggles v2.0', slot: 'Head', phase: 2, roles: ['melee'], source: 'Engineering goggles, Phase 2 Enhancement alternative', type: 'Crafted', profession: 'Engineering', requiresProfession: 'Engineering', bindType: 'BoP', stats: { attackPower: 96, hit: 24, crit: 31, stamina: 37 }, allowedClasses: ['Shaman', 'Rogue', 'Warrior'], materials: [{ name: 'Engineering goggle recipe materials' }, { name: 'Primal Nether' }, { name: 'Khorium Power Core' }], confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=32474/surestrike-goggles-v2-0', guideMentions: [{ provider: 'Wowhead', spec: 'Enhancement Shaman', phase: 2, label: 'Alternative', url: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL }] },
  { id: 28183, name: 'Mana-Etched Crown', slot: 'Head', phase: 1, roles: ['caster'], source: 'Heroic dungeon caster fallback', type: 'Dungeon', stats: { spellPower: 39, spellHit: 14, spellCrit: 21, intellect: 27 }, confidence: 'starter', note: 'Starter fallback so caster head does not depend on professions.' },
  { id: 28732, name: 'Cowl of Defiance', slot: 'Head', phase: 1, roles: ['melee'], source: 'Karazhan melee fallback', type: 'Raid', stats: { attackPower: 64, agility: 31, hit: 18, crit: 22 }, confidence: 'starter', note: 'Starter fallback so melee head does not depend on Engineering.' },
  { id: 28224, name: 'Wastewalker Helm', slot: 'Head', phase: 1, roles: ['melee', 'hunter'], source: 'Dungeon leather/mail fallback', type: 'Dungeon', stats: { attackPower: 58, agility: 28, hit: 15, crit: 18 }, confidence: 'starter' },
  { id: 28414, name: 'Helm of Assassination', slot: 'Head', phase: 1, roles: ['melee'], source: 'Dungeon set melee fallback', type: 'Dungeon', stats: { attackPower: 54, agility: 25, hit: 13, crit: 17 }, confidence: 'starter' },
  { id: 29076, name: 'Collar of the Aldor', slot: 'Head', phase: 1, roles: ['healer'], source: 'Karazhan token helm', type: 'Raid', stats: { healing: 92, mp5: 8, intellect: 29 } },
  { id: 29011, name: 'Warbringer Greathelm', slot: 'Head', phase: 1, roles: ['tank'], source: 'Karazhan token helm', type: 'Raid', stats: { stamina: 45, defense: 32, dodge: 24, armor: 946 } },
  { id: 29044, name: 'Cyclone Faceguard', slot: 'Head', phase: 1, roles: ['hunter'], source: 'Karazhan token helm', type: 'Raid', stats: { agility: 34, attackPower: 70, hit: 16, crit: 22 } },
  { id: 30059, name: 'Choker of Animalistic Fury', slot: 'Neck', phase: 2, roles: ['melee', 'hunter'], source: 'Serpentshrine Cavern', type: 'Raid', stats: { attackPower: 64, agility: 30, hit: 18 } },
  { id: 30017, name: 'Telonicus\'s Pendant of Mayhem', slot: 'Neck', phase: 2, roles: ['melee', 'hunter'], source: 'Kael\'thas Sunstrider, Tempest Keep', type: 'Raid', stats: { attackPower: 70, agility: 33, crit: 21 }, confidence: 'guide', guideProvider: 'Both', sourceAgreement: 'both', sourceUrl: 'https://www.wowhead.com/tbc/item=30017/telonicuss-pendant-of-mayhem', guideMentions: [{ provider: 'Wowhead', spec: 'Enhancement Shaman', phase: 2, label: 'BiS', url: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL }] },
  { id: 30022, name: 'Pendant of the Perilous', slot: 'Neck', phase: 2, roles: ['melee', 'hunter'], source: 'Serpentshrine Cavern trash', type: 'Raid', stats: { attackPower: 64, agility: 29, hit: 19 }, confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=30022/pendant-of-the-perilous', guideMentions: [{ provider: 'Wowhead', spec: 'Enhancement Shaman', phase: 2, label: 'BiS', url: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL }] },
  { id: 28762, name: 'Adornment of Stolen Souls', slot: 'Neck', phase: 1, roles: ['caster'], source: 'Prince Malchezaar, Karazhan', type: 'Raid', stats: { spellPower: 30, spellHit: 18, spellCrit: 23 } },
  { id: 30018, name: 'Lord Sanguinar\'s Claim', slot: 'Neck', phase: 2, roles: ['healer'], source: 'The Eye', type: 'Raid', stats: { healing: 70, mp5: 8, intellect: 24 } },
  { id: 30099, name: 'Frayed Tether of the Drowned', slot: 'Neck', phase: 2, roles: ['tank'], source: 'Serpentshrine Cavern', type: 'Raid', stats: { stamina: 45, defense: 24, dodge: 20 } },
  { id: 30055, name: 'Shoulderpads of the Stranger', slot: 'Shoulder', phase: 2, roles: ['melee'], source: 'Hydross, Serpentshrine Cavern', type: 'Raid', stats: { attackPower: 86, agility: 33, hit: 22 } },
  { id: 30149, name: 'Deathmantle Shoulderpads', slot: 'Shoulder', phase: 2, roles: ['melee'], source: 'Tier 5: Pauldrons of the Vanquished Champion from Void Reaver, TK', type: 'Raid', stats: { attackPower: 64, agility: 31, hit: 12, crit: 22, stamina: 34 }, allowedClasses: ['Rogue'], confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=30149/deathmantle-shoulderpads', guideMentions: [{ provider: 'Wowhead', spec: 'Rogue Combat', phase: 2, label: 'BiS', url: ROGUE_PHASE_2_GUIDE_URL }], planningNote: 'Rogue Phase 2 shoulder choice depends on which chest preserves Deathmantle four-piece.' },
  { id: 30143, name: 'Rift Stalker Mantle', slot: 'Shoulder', phase: 2, roles: ['hunter'], source: 'Tier 5: Pauldrons of the Vanquished Hero from Void Reaver, TK', type: 'Raid', stats: { attackPower: 78, agility: 32, hit: 16, stamina: 35 }, allowedClasses: ['Hunter'], confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=30143/rift-stalker-mantle', guideMentions: [{ provider: 'Wowhead', spec: 'Beast Mastery Hunter', phase: 2, label: 'BiS', url: BM_HUNTER_PHASE_2_GUIDE_URL }], planningNote: 'Hunter Phase 2 shoulder planning must respect Rift Stalker four-piece timing.' },
  { id: 27801, name: 'Beast Lord Mantle', slot: 'Shoulder', phase: 1, roles: ['hunter'], source: 'Warlord Kalithresh, The Steamvault; Beast Lord transition set', type: 'Dungeon', stats: { attackPower: 34, agility: 25, intellect: 12, mp5: 5 }, allowedClasses: ['Hunter'], confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=27801/beast-lord-mantle', guideMentions: [{ provider: 'Wowhead', spec: 'Beast Mastery Hunter', phase: 2, label: 'Alternative', url: BM_HUNTER_PHASE_2_GUIDE_URL }], planningNote: 'Beast Lord 4-piece transition piece. Do not break this package until Rift Stalker swap is ready.' },
  { id: 30194, name: 'Cataclysm Shoulderplates', slot: 'Shoulder', phase: 2, roles: ['melee'], source: 'Tier 5: Pauldrons of the Vanquished Champion', type: 'Raid', stats: { strength: 30, intellect: 21, crit: 22, mp5: 6, stamina: 37 }, allowedClasses: ['Shaman'], confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=30194/cataclysm-shoulderplates', guideMentions: [{ provider: 'Wowhead', spec: 'Enhancement Shaman', phase: 2, label: 'Alternative', url: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL }], synergies: [{ class: 'Shaman', spec: 'Enhancement', phase: 2, bonus: 30, label: 'Tier set-completion option; lower priority than the four preferred Cataclysm pieces.' }], planningNote: 'Tier visibility item. Wowhead ranks off-set shoulders higher but Tier 5 shoulders can complete Cataclysm 4-piece planning.' },
  { id: 30079, name: 'Illidari Shoulderpads', slot: 'Shoulder', phase: 2, roles: ['caster'], source: 'The Eye', type: 'Raid', stats: { spellPower: 46, spellCrit: 26, spellHit: 18 } },
  { id: 21874, name: 'Primal Mooncloth Shoulders', slot: 'Shoulder', phase: 1, roles: ['healer'], source: 'Tailoring: Primal Mooncloth', type: 'Crafted', profession: 'Tailoring', stats: { healing: 92, spirit: 20, mp5: 8 }, materials: [{ name: 'Primal Mooncloth' }, { name: 'Primal Nether' }, { name: 'Netherweb Spider Silk' }], craftNote: 'Tailoring material list is a starter summary; audit exact recipe quantities.' },
  { id: 29016, name: 'Warbringer Shoulderguards', slot: 'Shoulder', phase: 1, roles: ['tank'], source: 'Karazhan token shoulders', type: 'Raid', stats: { stamina: 37, defense: 27, dodge: 21, armor: 873 } },
  { id: 30098, name: 'Razor-Scale Battlecloak', slot: 'Back', phase: 2, roles: ['melee', 'hunter'], source: 'Serpentshrine Cavern', type: 'Raid', stats: { attackPower: 72, agility: 28, crit: 23 } },
  { id: 29994, name: 'Thalassian Wildercloak', slot: 'Back', phase: 2, roles: ['melee', 'hunter'], source: 'Kael\'thas Sunstrider, Tempest Keep', type: 'Raid', stats: { attackPower: 78, agility: 30, crit: 24 }, confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=29994/thalassian-wildercloak', guideMentions: [{ provider: 'Wowhead', spec: 'Enhancement Shaman', phase: 2, label: 'BiS', url: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL }] },
  { id: 28766, name: 'Ruby Drape of the Mysticant', slot: 'Back', phase: 1, roles: ['caster'], source: 'Prince Malchezaar, Karazhan', type: 'Raid', stats: { spellPower: 30, spellHit: 18, intellect: 22 } },
  { id: 28765, name: 'Stainless Cloak of the Pure Hearted', slot: 'Back', phase: 1, roles: ['healer'], source: 'Prince Malchezaar, Karazhan', type: 'Raid', stats: { healing: 59, mp5: 7, spirit: 20 } },
  { id: 28529, name: 'Royal Cloak of Arathi Kings', slot: 'Back', phase: 1, roles: ['tank'], source: 'Moroes, Karazhan', type: 'Raid', stats: { stamina: 33, defense: 26, dodge: 23, armor: 352 } },
  { id: 24259, name: 'Vengeance Wrap', slot: 'Back', phase: 1, roles: ['melee', 'hunter'], source: 'Tailoring craft, BoE pre-raid option', type: 'Crafted', craftedByProfession: 'Tailoring', bindType: 'BoE', equippableWithoutProfession: true, stats: { attackPower: 52, crit: 23, hit: 18 }, confidence: 'guide', guideProvider: 'Icy Veins', sourceAgreement: 'Icy-Veins-only', sourceUrl: 'https://www.wowhead.com/tbc/item=24259/vengeance-wrap', guideMentions: [{ provider: 'Icy Veins', spec: 'Rogue Combat', phase: 'PreRaid', label: 'Alternative', url: 'https://www.icy-veins.com/tbc-classic/rogue-dps-pve-pre-raid-gear' }], planningNote: 'Crafted by Tailoring but BoE; plan gold/materials, not a Tailoring slot.' },
  { id: 27878, name: 'Auchenai Death Shroud', slot: 'Back', phase: 1, roles: ['melee'], source: 'Auchenai Crypts pre-raid cloak option', type: 'Dungeon', stats: { attackPower: 48, agility: 22, hit: 16 }, confidence: 'guide', guideProvider: 'Icy Veins', sourceAgreement: 'Icy-Veins-only', sourceUrl: 'https://www.wowhead.com/tbc/item=27878/auchenai-death-shroud', guideMentions: [{ provider: 'Icy Veins', spec: 'Rogue Combat', phase: 'PreRaid', label: 'Alternative', url: 'https://www.icy-veins.com/tbc-classic/rogue-dps-pve-pre-raid-gear' }] },
  { id: 30101, name: 'Bloodsea Brigand\'s Vest', slot: 'Chest', phase: 2, roles: ['melee'], source: 'Serpentshrine Cavern', type: 'Raid', stats: { attackPower: 100, agility: 44, hit: 24, crit: 30 } },
  { id: 30144, name: 'Deathmantle Chestguard', slot: 'Chest', phase: 2, roles: ['melee'], source: 'Tier 5: Chestguard of the Vanquished Champion from Kael\'thas, TK', type: 'Raid', stats: { attackPower: 92, agility: 40, hit: 20, crit: 26, stamina: 42 }, allowedClasses: ['Rogue'], confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=30144/deathmantle-chestguard', guideMentions: [{ provider: 'Wowhead', spec: 'Rogue Combat', phase: 2, label: 'BiS', url: ROGUE_PHASE_2_GUIDE_URL }], planningNote: 'Rogue Phase 2 chest choice is paired with shoulders to keep Deathmantle four-piece online.' },
  { id: 30139, name: 'Rift Stalker Hauberk', slot: 'Chest', phase: 2, roles: ['hunter'], source: 'Tier 5: Chestguard of the Vanquished Hero from Kael\'thas, TK', type: 'Raid', stats: { attackPower: 100, agility: 42, hit: 20, crit: 25, stamina: 44 }, allowedClasses: ['Hunter'], confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=30139/rift-stalker-hauberk', guideMentions: [{ provider: 'Wowhead', spec: 'Beast Mastery Hunter', phase: 2, label: 'BiS', url: BM_HUNTER_PHASE_2_GUIDE_URL }], planningNote: 'Hunter Phase 2 chest is part of the Rift Stalker transition; do not rank it as a plain stat chest.' },
  { id: 28228, name: 'Beast Lord Cuirass', slot: 'Chest', phase: 1, roles: ['hunter'], source: 'Warp Splinter, Botanica; Beast Lord transition set', type: 'Dungeon', stats: { attackPower: 40, agility: 20, intellect: 24, stamina: 30, mp5: 4 }, allowedClasses: ['Hunter'], confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=28228/beast-lord-cuirass', guideMentions: [{ provider: 'Wowhead', spec: 'Beast Mastery Hunter', phase: 2, label: 'Alternative', url: BM_HUNTER_PHASE_2_GUIDE_URL }], planningNote: 'Beast Lord 4-piece transition piece. Preserve as a selectable staged set.' },
  { id: 30185, name: 'Cataclysm Chestplate', slot: 'Chest', phase: 2, roles: ['melee'], source: 'Tier 5: Chestguard of the Vanquished Champion from Kael\'thas, TK', type: 'Raid', stats: { strength: 41, agility: 32, intellect: 28, hit: 19, stamina: 46 }, allowedClasses: ['Shaman'], confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=30185/cataclysm-chestplate', guideMentions: [{ provider: 'Wowhead', spec: 'Enhancement Shaman', phase: 2, label: 'BiS', url: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL }], synergies: [{ class: 'Shaman', spec: 'Enhancement', phase: 2, bonus: 110, label: 'Cataclysm 4-piece chase: Improved Flurry set bonus keeps this ahead of raw-stat chests.' }], planningNote: 'Tier 5 Cataclysm Harness piece for the 4-piece Flurry haste chase.' },
  { id: 29525, name: 'Primalstrike Vest', slot: 'Chest', phase: 1, roles: ['melee'], source: 'Leatherworking: Primalstrike set, BoP Rogue pre-raid path', type: 'Crafted', profession: 'Leatherworking', requiresProfession: 'Leatherworking', bindType: 'BoP', stats: { attackPower: 86, agility: 38, hit: 20, crit: 26 }, confidence: 'guide', guideProvider: 'Icy Veins', sourceAgreement: 'Icy-Veins-only', sourceUrl: 'https://www.wowhead.com/tbc/item=29525/primalstrike-vest', guideMentions: [{ provider: 'Icy Veins', spec: 'Rogue Combat', phase: 'PreRaid', label: 'Profession Option', url: 'https://www.icy-veins.com/tbc-classic/rogue-dps-pve-pre-raid-gear' }], materials: [{ name: 'Primalstrike craft materials' }, { name: 'Primal Nether' }, { name: 'Heavy Knothide Leather' }], craftNote: 'Starter material summary; audit exact recipe quantities before production.' },
  { id: 21848, name: 'Spellfire Robe', slot: 'Chest', phase: 1, roles: ['caster'], source: 'Tailoring: Spellfire set', type: 'Crafted', profession: 'Tailoring', stats: { spellPower: 72, spellCrit: 28 }, materials: [{ name: 'Spellcloth' }, { name: 'Primal Fire' }, { name: 'Primal Nether' }], craftNote: 'Tailoring material list is a starter summary; audit exact recipe quantities.' },
  { id: 21875, name: 'Primal Mooncloth Robe', slot: 'Chest', phase: 1, roles: ['healer'], source: 'Tailoring: Primal Mooncloth', type: 'Crafted', profession: 'Tailoring', stats: { healing: 118, spirit: 20, mp5: 9 }, materials: [{ name: 'Primal Mooncloth' }, { name: 'Primal Nether' }, { name: 'Netherweb Spider Silk' }], craftNote: 'Tailoring material list is a starter summary; audit exact recipe quantities.' },
  { id: 29012, name: 'Warbringer Chestguard', slot: 'Chest', phase: 1, roles: ['tank'], source: 'Karazhan token chest', type: 'Raid', stats: { stamina: 48, defense: 30, dodge: 26, armor: 1164 } },
  { id: 30026, name: 'Bands of the Celestial Archer', slot: 'Wrist', phase: 2, roles: ['hunter'], source: 'The Eye', type: 'Raid', stats: { agility: 28, attackPower: 58, hit: 17 } },
  { id: 30091, name: 'True-Aim Stalker Bands', slot: 'Wrist', phase: 2, roles: ['melee', 'hunter'], source: 'Leotheras the Blind, Serpentshrine Cavern', type: 'Raid', stats: { attackPower: 50, crit: 24, stamina: 18, intellect: 12 }, confidence: 'guide', guideProvider: 'Wowhead + wowtbc.gg', sourceAgreement: 'wowtbc-cross-check', sourceUrl: 'https://www.wowhead.com/tbc/item=30091/true-aim-stalker-bands', guideMentions: [{ provider: 'Wowhead', spec: 'Enhancement Shaman', phase: 2, label: 'BiS', url: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL }, { provider: 'wowtbc.gg', spec: 'Enhancement Shaman', phase: 2, label: 'BiS', url: WOWTBC_ENHANCEMENT_SHAMAN_T5_URL }], synergies: [{ class: 'Shaman', spec: 'Enhancement', phase: 2, bonus: 55, label: 'Favored Enhancement bracer from Phase 2 guide lists despite alternatives with flashier isolated stats.' }], planningNote: 'PM-blocker item: Wowhead explicitly calls these favored Phase 2 Enhancement bracers.' },
  { id: 29966, name: 'Vambraces of Ending', slot: 'Wrist', phase: 2, roles: ['melee', 'hunter'], source: 'High Astromancer Solarian, Tempest Keep', type: 'Raid', stats: { attackPower: 52, agility: 24, stamina: 24 }, confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=29966/vambraces-of-ending', guideMentions: [{ provider: 'Wowhead', spec: 'Enhancement Shaman', phase: 2, label: 'Great', url: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL }] },
  { id: 30057, name: 'Bracers of Eradication', slot: 'Wrist', phase: 2, roles: ['melee'], source: 'Serpentshrine Cavern', type: 'Raid', stats: { attackPower: 64, agility: 24, hit: 17 } },
  { id: 28514, name: 'Bracers of Maliciousness', slot: 'Wrist', phase: 1, roles: ['melee'], source: 'Maiden of Virtue, Karazhan; Wowhead Enhancement Shaman Phase 2 wrist alternative', type: 'Raid', stats: { attackPower: 50, crit: 22, stamina: 25 }, confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=28514/bracers-of-maliciousness', guideMentions: [{ provider: 'Wowhead', spec: 'Enhancement Shaman', phase: 2, label: 'Alternative', url: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL }], isAlternative: true },
  { id: 29527, name: 'Primalstrike Bracers', slot: 'Wrist', phase: 1, roles: ['melee'], source: 'Leatherworking: Primalstrike set, BoP Rogue pre-raid path', type: 'Crafted', profession: 'Leatherworking', requiresProfession: 'Leatherworking', bindType: 'BoP', stats: { attackPower: 58, agility: 24, hit: 18, crit: 19 }, confidence: 'guide', guideProvider: 'Icy Veins', sourceAgreement: 'Icy-Veins-only', sourceUrl: 'https://www.wowhead.com/tbc/item=29527/primalstrike-bracers', guideMentions: [{ provider: 'Icy Veins', spec: 'Rogue Combat', phase: 'PreRaid', label: 'Profession Option', url: 'https://www.icy-veins.com/tbc-classic/rogue-dps-pve-pre-raid-gear' }], materials: [{ name: 'Primalstrike craft materials' }, { name: 'Primal Nether' }, { name: 'Heavy Knothide Leather' }], craftNote: 'Starter material summary; audit exact recipe quantities before production.' },
  { id: 24250, name: 'Bracers of Havok', slot: 'Wrist', phase: 1, roles: ['caster'], source: 'Tailoring craft', type: 'Crafted', profession: 'Tailoring', stats: { spellPower: 30, spellHit: 12, spellCrit: 20 }, materials: [{ name: 'Spellcloth' }, { name: 'Primal Fire' }, { name: 'Primal Nether' }], craftNote: 'Tailoring material list is a starter summary; audit exact recipe quantities.' },
  { id: 28512, name: 'Bracers of Justice', slot: 'Wrist', phase: 1, roles: ['healer'], source: 'Attumen, Karazhan', type: 'Raid', stats: { healing: 57, mp5: 6, intellect: 21 } },
  { id: 28502, name: 'Vambraces of Courage', slot: 'Wrist', phase: 1, roles: ['tank'], source: 'Attumen, Karazhan', type: 'Raid', stats: { stamina: 33, defense: 21, dodge: 18, armor: 509 } },
  { id: 30003, name: 'Gloves of the Searing Grip', slot: 'Hands', phase: 2, roles: ['melee'], source: 'The Eye', type: 'Raid', stats: { attackPower: 78, agility: 32, expertise: 18 } },
  { id: 30145, name: 'Deathmantle Handguards', slot: 'Hands', phase: 2, roles: ['melee'], source: 'Tier 5: Gloves of the Vanquished Champion from Leotheras, SSC', type: 'Raid', stats: { attackPower: 72, agility: 34, hit: 18, crit: 22, stamina: 32 }, allowedClasses: ['Rogue'], confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=30145/deathmantle-handguards', guideMentions: [{ provider: 'Wowhead', spec: 'Rogue Combat', phase: 2, label: 'BiS', url: ROGUE_PHASE_2_GUIDE_URL }], planningNote: 'Rogue Phase 2 gloves are guide-priority because they are strong and help complete Deathmantle four-piece.' },
  { id: 30140, name: 'Rift Stalker Gauntlets', slot: 'Hands', phase: 2, roles: ['hunter'], source: 'Tier 5: Gloves of the Vanquished Hero from Leotheras, SSC', type: 'Raid', stats: { attackPower: 82, agility: 34, hit: 17, crit: 20, stamina: 34 }, allowedClasses: ['Hunter'], confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=30140/rift-stalker-gauntlets', guideMentions: [{ provider: 'Wowhead', spec: 'Beast Mastery Hunter', phase: 2, label: 'BiS', url: BM_HUNTER_PHASE_2_GUIDE_URL }], planningNote: 'Hunter Phase 2 gloves help complete Rift Stalker four-piece and prevent raw-stat misranking.' },
  { id: 27474, name: 'Beast Lord Handguards', slot: 'Hands', phase: 1, roles: ['hunter'], source: 'Warchief Kargath Bladefist, Shattered Halls; Beast Lord transition set', type: 'Dungeon', stats: { attackPower: 34, agility: 25, intellect: 17, stamina: 12, hit: 3 }, allowedClasses: ['Hunter'], confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=27474/beast-lord-handguards', guideMentions: [{ provider: 'Wowhead', spec: 'Beast Mastery Hunter', phase: 2, label: 'Alternative', url: BM_HUNTER_PHASE_2_GUIDE_URL }], planningNote: 'Beast Lord 4-piece transition piece. Keep visible for staged swaps.' },
  { id: 30189, name: 'Cataclysm Gauntlets', slot: 'Hands', phase: 2, roles: ['melee'], source: 'Tier 5: Gloves of the Vanquished Champion from Leotheras, SSC', type: 'Raid', stats: { strength: 35, agility: 24, intellect: 23, hit: 24, stamina: 34 }, allowedClasses: ['Shaman'], confidence: 'guide', guideProvider: 'Wowhead + wowtbc.gg', sourceAgreement: 'wowtbc-cross-check', sourceUrl: 'https://www.wowhead.com/tbc/item=30189/cataclysm-gauntlets', guideMentions: [{ provider: 'Wowhead', spec: 'Enhancement Shaman', phase: 2, label: 'BiS', url: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL }, { provider: 'wowtbc.gg', spec: 'Enhancement Shaman', phase: 2, label: 'BiS', url: WOWTBC_ENHANCEMENT_SHAMAN_T5_URL }], synergies: [{ class: 'Shaman', spec: 'Enhancement', phase: 2, bonus: 110, label: 'Cataclysm 4-piece chase: easy tier piece and a core Improved Flurry set-bonus slot.' }], planningNote: 'Tier 5 Cataclysm Harness piece and one of the easiest 4-piece pieces to acquire.' },
  { id: 28506, name: 'Gloves of Dexterous Manipulation', slot: 'Hands', phase: 1, roles: ['melee'], source: 'Attumen, Karazhan', type: 'Raid', stats: { attackPower: 60, agility: 30, hit: 17, crit: 18 }, confidence: 'starter', sourceUrl: 'https://www.wowhead.com/tbc/item=28506/gloves-of-dexterous-manipulation' },
  { id: 30725, name: 'Anger-Spark Gloves', slot: 'Hands', phase: 1, roles: ['caster'], source: 'Doom Lord Kazzak', type: 'Raid', stats: { spellPower: 46, spellHit: 20, spellCrit: 21 } },
  { id: 28505, name: 'Gauntlets of Renewed Hope', slot: 'Hands', phase: 1, roles: ['healer'], source: 'Attumen, Karazhan', type: 'Raid', stats: { healing: 75, mp5: 7, intellect: 22 } },
  { id: 29017, name: 'Warbringer Handguards', slot: 'Hands', phase: 1, roles: ['tank'], source: 'Karazhan token gloves', type: 'Raid', stats: { stamina: 36, defense: 25, block: 24, armor: 728 } },
  { id: 30040, name: 'Belt of Deep Shadow', slot: 'Waist', phase: 2, roles: ['melee', 'hunter'], source: 'Leatherworking craft', type: 'Crafted', craftedByProfession: 'Leatherworking', bindType: 'BoE', equippableWithoutProfession: true, stats: { agility: 32, attackPower: 76, hit: 22, crit: 28 }, materials: [{ name: 'Heavy Knothide Leather' }, { name: 'Primal Shadow' }, { name: 'Nether Vortex' }], craftNote: 'BoE Leatherworking craft; track materials and crafter access, not wearer profession.' },
  { id: 30106, name: 'Belt of One-Hundred Deaths', slot: 'Waist', phase: 2, roles: ['melee'], source: 'Lady Vashj, Serpentshrine Cavern', type: 'Raid', stats: { attackPower: 74, agility: 29, expertise: 25, stamina: 25 }, confidence: 'guide', guideProvider: 'Wowhead + wowtbc.gg', sourceAgreement: 'wowtbc-cross-check', sourceUrl: 'https://www.wowhead.com/tbc/item=30106/belt-of-one-hundred-deaths', guideMentions: [{ provider: 'Wowhead', spec: 'Enhancement Shaman', phase: 2, label: 'BiS', url: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL }, { provider: 'wowtbc.gg', spec: 'Enhancement Shaman', phase: 2, label: 'BiS', url: WOWTBC_ENHANCEMENT_SHAMAN_T5_URL }] },
  { id: 29526, name: 'Primalstrike Belt', slot: 'Waist', phase: 1, roles: ['melee'], source: 'Leatherworking: Primalstrike set, BoP Rogue pre-raid path', type: 'Crafted', profession: 'Leatherworking', requiresProfession: 'Leatherworking', bindType: 'BoP', stats: { attackPower: 72, agility: 30, hit: 20, crit: 24 }, confidence: 'guide', guideProvider: 'Icy Veins', sourceAgreement: 'Icy-Veins-only', sourceUrl: 'https://www.wowhead.com/tbc/item=29526/primalstrike-belt', guideMentions: [{ provider: 'Icy Veins', spec: 'Rogue Combat', phase: 'PreRaid', label: 'Profession Option', url: 'https://www.icy-veins.com/tbc-classic/rogue-dps-pve-pre-raid-gear' }], materials: [{ name: 'Primalstrike craft materials' }, { name: 'Primal Nether' }, { name: 'Heavy Knothide Leather' }], craftNote: 'Starter material summary; audit exact recipe quantities before production.' },
  { id: 30038, name: 'Belt of Blasting', slot: 'Waist', phase: 2, roles: ['caster'], source: 'Tailoring crafted BoE Phase 2 belt', type: 'Crafted', craftedByProfession: 'Tailoring', bindType: 'BoE', equippableWithoutProfession: true, stats: { spellPower: 50, spellHit: 23, spellCrit: 30 }, materials: [{ name: 'Spellcloth' }, { name: 'Primal Fire' }, { name: 'Nether Vortex' }], craftNote: 'Purchasable crafted belt; selecting Tailoring is not required to equip it.', confidence: 'guide', guideProvider: 'Both', sourceAgreement: 'both', sourceUrl: 'https://www.wowhead.com/tbc/item=30038/belt-of-blasting', guideMentions: [{ provider: 'Icy Veins', spec: 'Arcane Mage', phase: 2, label: 'Near-BiS', url: 'https://www.icy-veins.com/tbc-classic/arcane-mage-dps-pve-gear-best-in-slot' }] },
  { id: 30036, name: 'Belt of the Long Road', slot: 'Waist', phase: 2, roles: ['healer'], source: 'Tailoring craft', type: 'Crafted', profession: 'Tailoring', stats: { healing: 118, mp5: 8, spirit: 23 }, materials: [{ name: 'Primal Mooncloth' }, { name: 'Primal Life' }, { name: 'Nether Vortex' }], craftNote: 'Tailoring material list is a starter summary; audit exact recipe quantities.' },
  { id: 30034, name: 'Belt of the Guardian', slot: 'Waist', phase: 2, roles: ['tank'], source: 'Blacksmithing craft', type: 'Crafted', profession: 'Blacksmithing', stats: { stamina: 48, defense: 27, dodge: 23, armor: 904 }, materials: [{ name: 'Khorium Bar' }, { name: 'Primal Earth' }, { name: 'Nether Vortex' }], craftNote: 'Blacksmithing material list is a starter summary; audit exact recipe quantities.' },
  { id: 30060, name: 'Boots of Effortless Striking', slot: 'Feet', phase: 2, roles: ['melee'], source: 'Serpentshrine Cavern', type: 'Raid', stats: { attackPower: 86, agility: 34, hit: 19 } },
  { id: 30039, name: 'Boots of Utter Darkness', slot: 'Feet', phase: 2, roles: ['melee'], source: 'Leatherworking craft, Enhancement Phase 2 BiS', type: 'Crafted', profession: 'Leatherworking', requiresProfession: 'Leatherworking', bindType: 'BoP', stats: { attackPower: 82, hit: 24, crit: 26, stamina: 33 }, materials: [{ name: 'Heavy Knothide Leather' }, { name: 'Primal Shadow' }, { name: 'Nether Vortex' }], confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=30039/boots-of-utter-darkness', guideMentions: [{ provider: 'Wowhead', spec: 'Enhancement Shaman', phase: 2, label: 'BiS', url: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL }] },
  { id: 30104, name: 'Cobra-Lash Boots', slot: 'Feet', phase: 2, roles: ['melee', 'hunter'], source: 'Lady Vashj, Serpentshrine Cavern', type: 'Raid', stats: { attackPower: 76, agility: 31, crit: 24 }, confidence: 'guide', guideProvider: 'Both', sourceAgreement: 'both', sourceUrl: 'https://www.wowhead.com/tbc/item=30104/cobra-lash-boots', guideMentions: [{ provider: 'Wowhead', spec: 'Enhancement Shaman', phase: 2, label: 'Alternative', url: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL }] },
  { id: 25686, name: 'Fel Leather Boots', slot: 'Feet', phase: 1, roles: ['melee'], source: 'Leatherworking craft, BoE Rogue pre-raid option', type: 'Crafted', craftedByProfession: 'Leatherworking', bindType: 'BoE', equippableWithoutProfession: true, stats: { attackPower: 56, agility: 26, hit: 18, crit: 18 }, confidence: 'guide', guideProvider: 'Icy Veins', sourceAgreement: 'Icy-Veins-only', sourceUrl: 'https://www.wowhead.com/tbc/item=25686/fel-leather-boots', guideMentions: [{ provider: 'Icy Veins', spec: 'Rogue Combat', phase: 'PreRaid', label: 'Alternative', url: 'https://www.icy-veins.com/tbc-classic/rogue-dps-pve-pre-raid-gear' }], planningNote: 'Icy Veins notes Fel Leather pieces are BoE, so they are crafted-by planning items rather than Leatherworking equip requirements.' },
  { id: 30067, name: 'Velvet Boots of the Guardian', slot: 'Feet', phase: 2, roles: ['caster'], source: 'Serpentshrine Cavern', type: 'Raid', stats: { spellPower: 47, spellHit: 20, spellCrit: 24 } },
  { id: 28517, name: 'Boots of Foretelling', slot: 'Feet', phase: 1, roles: ['healer'], source: 'Maiden, Karazhan', type: 'Raid', stats: { healing: 86, spirit: 22, intellect: 23 } },
  { id: 28569, name: 'Boots of Valiance', slot: 'Feet', phase: 1, roles: ['tank'], source: 'Karazhan', type: 'Raid', stats: { stamina: 39, defense: 24, dodge: 20, armor: 800 } },
  { id: 28741, name: 'Skulker\'s Greaves', slot: 'Legs', phase: 1, roles: ['melee', 'hunter'], source: 'Netherspite, Karazhan', type: 'Raid', stats: { attackPower: 92, agility: 42, hit: 22 } },
  { id: 30192, name: 'Cataclysm Legplates', slot: 'Legs', phase: 2, roles: ['melee'], source: 'Tier 5: Leggings of the Vanquished Champion from Fathom-Lord Karathress, SSC', type: 'Raid', stats: { strength: 41, agility: 32, intellect: 31, hit: 21, stamina: 58 }, allowedClasses: ['Shaman'], confidence: 'guide', guideProvider: 'Wowhead + wowtbc.gg', sourceAgreement: 'wowtbc-cross-check', sourceUrl: 'https://www.wowhead.com/tbc/item=30192/cataclysm-legplates', guideMentions: [{ provider: 'Wowhead', spec: 'Enhancement Shaman', phase: 2, label: 'BiS', url: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL }, { provider: 'wowtbc.gg', spec: 'Enhancement Shaman', phase: 2, label: 'BiS', url: WOWTBC_ENHANCEMENT_SHAMAN_T5_URL }], synergies: [{ class: 'Shaman', spec: 'Enhancement', phase: 2, bonus: 110, label: 'Cataclysm 4-piece chase: guide lists this even when raw-stat legs look tempting before set completion.' }], planningNote: 'Tier 5 Cataclysm Harness piece for the 4-piece Flurry haste chase.' },
  { id: 30148, name: 'Deathmantle Legguards', slot: 'Legs', phase: 2, roles: ['melee'], source: 'Tier 5: Leggings of the Vanquished Champion from Fathom-Lord Karathress, SSC', type: 'Raid', stats: { attackPower: 76, agility: 36, hit: 16, crit: 24, stamina: 38 }, allowedClasses: ['Rogue'], confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=30148/deathmantle-legguards', guideMentions: [{ provider: 'Wowhead', spec: 'Rogue Combat', phase: 2, label: 'BiS', url: ROGUE_PHASE_2_GUIDE_URL }], planningNote: 'Rogue Phase 2 legs are a known raw-stat trap: guide keeps tier legs to preserve Deathmantle four-piece.' },
  { id: 30142, name: 'Rift Stalker Leggings', slot: 'Legs', phase: 2, roles: ['hunter'], source: 'Tier 5: Leggings of the Vanquished Hero from Fathom-Lord Karathress, SSC', type: 'Raid', stats: { attackPower: 90, agility: 38, hit: 18, crit: 22, stamina: 42 }, allowedClasses: ['Hunter'], confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=30142/rift-stalker-leggings', guideMentions: [{ provider: 'Wowhead', spec: 'Beast Mastery Hunter', phase: 2, label: 'BiS', url: BM_HUNTER_PHASE_2_GUIDE_URL }], planningNote: 'Hunter Phase 2 legs are part of Rift Stalker four-piece transition planning.' },
  { id: 27874, name: 'Beast Lord Leggings', slot: 'Legs', phase: 1, roles: ['hunter'], source: 'Warlord Kalithresh, The Steamvault; Beast Lord transition set', type: 'Dungeon', stats: { attackPower: 52, agility: 30, intellect: 19, stamina: 25, mp5: 7 }, allowedClasses: ['Hunter'], confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=27874/beast-lord-leggings', guideMentions: [{ provider: 'Wowhead', spec: 'Beast Mastery Hunter', phase: 2, label: 'Alternative', url: BM_HUNTER_PHASE_2_GUIDE_URL }], planningNote: 'Beast Lord transition leg. BM often uses offset legs after Rift Stalker 4-piece is ready.' },
  { id: 30257, name: 'Shattrath Leggings', slot: 'Legs', phase: 1, roles: ['melee'], source: 'Special Delivery to Shattrath City quest', type: 'Quest', stats: { attackPower: 70, agility: 30, hit: 18, crit: 17 }, confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=30257/shattrath-leggings', guideMentions: [{ provider: 'Wowhead', spec: 'Enhancement Shaman', phase: 2, label: 'Alternative', url: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL }] },
  { id: 24262, name: 'Spellstrike Pants', slot: 'Legs', phase: 1, roles: ['caster'], source: 'Tailoring: Spellstrike set', type: 'Crafted', craftedByProfession: 'Tailoring', bindType: 'BoE', equippableWithoutProfession: true, stats: { spellPower: 46, spellHit: 16, spellCrit: 24 }, materials: [{ name: 'Spellcloth' }, { name: 'Primal Might' }, { name: 'Primal Nether' }], craftNote: 'Purchasable crafted piece; Tailoring is only required for profession-specific set effects.', confidence: 'guide', guideProvider: 'Both', sourceAgreement: 'both', sourceUrl: 'https://www.wowhead.com/tbc/item=24262/spellstrike-pants' },
  { id: 28751, name: 'Heart-Flame Leggings', slot: 'Legs', phase: 1, roles: ['healer'], source: 'Nightbane, Karazhan', type: 'Raid', stats: { healing: 101, mp5: 8, spirit: 27 } },
  { id: 30116, name: 'Destroyer Legguards', slot: 'Legs', phase: 2, roles: ['tank'], source: 'Tier 5 token legs', type: 'Raid', stats: { stamina: 54, defense: 34, dodge: 29, armor: 1297 } },
  { id: 29301, name: 'Band of the Eternal Champion', slot: 'Ring', phase: 1, roles: ['melee', 'hunter'], source: 'Scale of the Sands reputation', type: 'Reputation', unique: true, stats: { attackPower: 60, hit: 20, crit: 20 } },
  { id: 29997, name: 'Band of the Ranger-General', slot: 'Ring', phase: 2, roles: ['melee', 'hunter'], source: 'Kael\'thas Sunstrider, Tempest Keep', type: 'Raid', unique: true, stats: { attackPower: 60, agility: 28, hit: 19, crit: 18 }, confidence: 'guide', guideProvider: 'Both', sourceAgreement: 'both', sourceUrl: 'https://www.wowhead.com/tbc/item=29997/band-of-the-ranger-general', guideMentions: [{ provider: 'Wowhead', spec: 'Enhancement Shaman', phase: 2, label: 'BiS', url: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL }] },
  { id: 30052, name: 'Ring of Lethality', slot: 'Ring', phase: 2, roles: ['melee', 'hunter'], source: 'Hydross the Unstable, Serpentshrine Cavern', type: 'Raid', unique: true, stats: { attackPower: 58, agility: 27, hit: 18, crit: 18 }, confidence: 'guide', guideProvider: 'Both', sourceAgreement: 'both', sourceUrl: 'https://www.wowhead.com/tbc/item=30052/ring-of-lethality', guideMentions: [{ provider: 'Wowhead', spec: 'Enhancement Shaman', phase: 2, label: 'BiS', url: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL }] },
  { id: 28757, name: 'Ring of a Thousand Marks', slot: 'Ring', phase: 1, roles: ['melee', 'hunter'], source: 'Prince Malchezaar, Karazhan', type: 'Raid', unique: true, stats: { attackPower: 52, agility: 21, hit: 19 } },
  { id: 29305, name: 'Band of the Eternal Sage', slot: 'Ring', phase: 1, roles: ['caster'], source: 'Scale of the Sands reputation', type: 'Reputation', unique: true, stats: { spellPower: 34, spellHit: 18, spellCrit: 20 } },
  { id: 28753, name: 'Ring of Recurrence', slot: 'Ring', phase: 1, roles: ['caster'], source: 'Chess Event, Karazhan', type: 'Raid', unique: true, stats: { spellPower: 29, spellCrit: 21, intellect: 20 } },
  { id: 29309, name: 'Band of the Eternal Restorer', slot: 'Ring', phase: 1, roles: ['healer'], source: 'Scale of the Sands reputation', type: 'Reputation', unique: true, stats: { healing: 70, mp5: 8, intellect: 20 } },
  { id: 28763, name: 'Jade Ring of the Everliving', slot: 'Ring', phase: 1, roles: ['healer'], source: 'Prince Malchezaar, Karazhan', type: 'Raid', unique: true, stats: { healing: 59, mp5: 6, spirit: 18 } },
  { id: 29279, name: 'Violet Signet of the Great Protector', slot: 'Ring', phase: 1, roles: ['tank'], source: 'Violet Eye reputation', type: 'Reputation', unique: true, stats: { stamina: 37, defense: 19, dodge: 18 } },
  { id: 30083, name: 'Ring of Sundered Souls', slot: 'Ring', phase: 2, roles: ['tank'], source: 'Serpentshrine Cavern', type: 'Raid', unique: true, stats: { stamina: 44, defense: 22, dodge: 21 } },
  { id: 28830, name: 'Dragonspine Trophy', slot: 'Trinket', phase: 1, roles: ['melee', 'hunter'], source: 'Gruul the Dragonkiller', type: 'Raid', unique: true, stats: { attackPower: 40, haste: 80 }, note: 'Proc value varies by uptime and class.' },
  { id: 29383, name: 'Bloodlust Brooch', slot: 'Trinket', phase: 1, roles: ['melee', 'hunter'], source: 'Badge of Justice vendor', type: 'Badge', unique: true, stats: { attackPower: 72 } },
  { id: 30627, name: 'Tsunami Talisman', slot: 'Trinket', phase: 2, roles: ['melee', 'hunter'], source: 'Leotheras the Blind, Serpentshrine Cavern', type: 'Raid', unique: true, stats: { crit: 38, attackPower: 80 }, confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=30627/tsunami-talisman', guideMentions: [{ provider: 'Wowhead', spec: 'Enhancement Shaman', phase: 2, label: 'Alternative', url: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL }] },
  { id: 28288, name: 'Abacus of Violent Odds', slot: 'Trinket', phase: 1, roles: ['melee', 'hunter'], source: 'Pathaleon the Calculator, The Mechanar', type: 'Dungeon', unique: true, stats: { attackPower: 64, haste: 42 }, confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=28288/abacus-of-violent-odds', guideMentions: [{ provider: 'Wowhead', spec: 'Enhancement Shaman', phase: 2, label: 'Alternative', url: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL }] },
  { id: 28785, name: 'The Lightning Capacitor', slot: 'Trinket', phase: 1, roles: ['caster'], source: 'Shade of Aran, Karazhan', type: 'Raid', unique: true, stats: { spellCrit: 32, spellPower: 45 } },
  { id: 29370, name: 'Icon of the Silver Crescent', slot: 'Trinket', phase: 1, roles: ['caster'], source: 'Badge of Justice vendor', type: 'Badge', unique: true, stats: { spellPower: 74 } },
  { id: 28727, name: 'Pendant of the Violet Eye', slot: 'Trinket', phase: 1, roles: ['healer'], source: 'Karazhan quest reward', type: 'Quest', unique: true, stats: { healing: 84, mp5: 8 } },
  { id: 29376, name: 'Essence of the Martyr', slot: 'Trinket', phase: 1, roles: ['healer'], source: 'Badge of Justice vendor', type: 'Badge', unique: true, stats: { healing: 84 } },
  { id: 28528, name: 'Moroes\' Lucky Pocket Watch', slot: 'Trinket', phase: 1, roles: ['tank'], source: 'Moroes, Karazhan', type: 'Raid', unique: true, stats: { dodge: 38, stamina: 30 } },
  { id: 29387, name: 'Gnomeregan Auto-Blocker 600', slot: 'Trinket', phase: 1, roles: ['tank'], source: 'Badge of Justice vendor', type: 'Badge', unique: true, stats: { block: 59, stamina: 20 }, allowedClasses: ['Warrior', 'Paladin'], note: 'Block trinket; deliberately excluded from Bear tank recommendations.' },
  { id: 28429, name: 'Lionheart Champion', slot: 'Main Hand', phase: 1, roles: ['melee'], source: 'Blacksmithing: Swordsmith', type: 'Crafted', profession: 'Blacksmithing', stats: { attackPower: 90, strength: 38, crit: 30 }, materials: [{ name: 'Lionheart Blade / upgraded sword chain' }, { name: 'Primal Nether' }, { name: 'Primal Might' }, { name: 'Khorium Bar' }], craftNote: 'Materials are starter-summary placeholders; recipe audit required against Wowhead before production.', confidence: 'starter', guideProvider: 'Starter', sourceAgreement: 'starter', sourceUrl: 'https://www.wowhead.com/tbc/item=28429/lionheart-champion' },
  { id: 28437, name: 'Drakefist Hammer', slot: 'Main Hand', phase: 1, roles: ['melee'], source: 'Blacksmithing: Hammersmith', type: 'Crafted', profession: 'Blacksmithing', stats: { attackPower: 76, strength: 33, haste: 42 }, materials: [{ name: 'Primal Nether' }, { name: 'Primal Might' }, { name: 'Khorium Bar' }, { name: 'Primal Earth' }], craftNote: 'First Hammersmith weapon in the Dragonstrike upgrade path; material quantities need audit.', confidence: 'starter', guideProvider: 'Starter', sourceAgreement: 'starter', sourceUrl: 'https://www.wowhead.com/tbc/item=28437/drakefist-hammer' },
  { id: 28438, name: 'Dragonmaw', slot: 'Main Hand', phase: 1, roles: ['melee'], source: 'Blacksmithing: Hammersmith upgrade, Wowhead Fury Phase 1 BiS', type: 'Crafted', profession: 'Blacksmithing', requiresProfession: 'Blacksmithing', requiresProfessionSpecialization: 'Master Hammersmith', bindType: 'BoP', stats: { attackPower: 92, strength: 36, haste: 54 }, materials: [{ name: 'Drakefist Hammer', quantity: 1 }, { name: 'Nether Vortex' }, { name: 'Primal Nether' }], craftNote: 'Upgrade-chain weapon leading toward Dragonstrike; phase/material details need source audit.', confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=28438/dragonmaw', guideMentions: [{ provider: 'Wowhead', spec: 'Fury Warrior', phase: 1, label: 'BiS', url: 'https://www.wowhead.com/tbc/guide/fury-warrior-dps-karazhan-best-in-slot-gear-burning-crusade-classic-wow' }] },
  { id: 28439, name: 'Dragonstrike', slot: 'Main Hand', phase: 1, roles: ['melee'], source: 'Blacksmithing: Hammersmith final upgrade', type: 'Crafted', profession: 'Blacksmithing', requiresProfession: 'Blacksmithing', requiresProfessionSpecialization: 'Master Hammersmith', bindType: 'BoP', stats: { attackPower: 106, strength: 42, haste: 68 }, materials: [{ name: 'Dragonmaw', quantity: 1 }, { name: 'Nether Vortex', quantity: 5 }], craftNote: 'Wowhead identifies this as item 28439 in the Hammersmith upgrade path; material quantities still need full audit.', confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=28439/dragonstrike', guideMentions: [{ provider: 'Wowhead', spec: 'Fury Warrior', phase: 2, label: 'Profession Option', url: 'https://www.wowhead.com/tbc/guide/fury-warrior-dps-karazhan-best-in-slot-gear-burning-crusade-classic-wow' }] },
  { id: 28440, name: 'Thunder', slot: 'Main Hand', phase: 1, roles: ['melee'], source: 'Blacksmithing: Hammersmith two-handed chain', type: 'Crafted', profession: 'Blacksmithing', stats: { attackPower: 86, strength: 40, crit: 24 }, materials: [{ name: 'Primal Nether' }, { name: 'Primal Might' }, { name: 'Khorium Bar' }], craftNote: 'Starter representation of the Stormherald-style chain; exact ID/material audit required.', confidence: 'starter' },
  { id: 30095, name: 'Fang of the Leviathan', slot: 'Main Hand', phase: 2, roles: ['caster'], source: 'Serpentshrine Cavern', type: 'Raid', stats: { spellPower: 203, spellHit: 20, spellCrit: 21 } },
  { id: 32451, name: 'Gladiator\'s Salvation', slot: 'Main Hand', phase: 1, roles: ['healer'], source: 'Arena weapon', type: 'PvP', stats: { healing: 423, intellect: 31, mp5: 8 } },
  { id: 28749, name: 'King\'s Defender', slot: 'Main Hand', phase: 1, roles: ['tank'], source: 'Chess Event, Karazhan', type: 'Raid', stats: { stamina: 33, defense: 24, dodge: 18 } },
  { id: 31965, name: "Merciless Gladiator's Cleaver", slot: 'One Hand', phase: 2, roles: ['melee'], source: 'Arena Season 2 weapon vendor; Orc Enhancement axe path', type: 'PvP', stats: { attackPower: 42, hit: 18, crit: 18, stamina: 24 }, allowedClasses: ['Shaman', 'Warrior', 'Rogue'], confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=31965/merciless-gladiators-cleaver', guideMentions: [{ provider: 'Wowhead', spec: 'Enhancement Shaman', phase: 2, label: 'BiS', url: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL }], synergies: [{ class: 'Shaman', spec: 'Enhancement', phase: 2, bonus: 105, races: ['Orc'], label: 'Orc axe-racial path; pair cleavers when the PvP weapon route is realistic.' }], planningNote: 'Orc Enhancement-specific weapon path added from Phase 2 audit. Requires PvP acquisition and weapon-sync review.' },
  { id: 32944, name: 'Talon of the Phoenix', slot: 'Main Hand', phase: 2, roles: ['melee'], source: 'Al\'ar, Tempest Keep', type: 'Raid', stats: { attackPower: 96, agility: 34, crit: 26 }, allowedClasses: ['Shaman', 'Warrior'], confidence: 'guide', guideProvider: 'Wowhead + wowtbc.gg', sourceAgreement: 'wowtbc-cross-check', sourceUrl: 'https://www.wowhead.com/tbc/item=32944/talon-of-the-phoenix', guideMentions: [{ provider: 'Wowhead', spec: 'Enhancement Shaman', phase: 2, label: 'BiS', url: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL }, { provider: 'wowtbc.gg', spec: 'Enhancement Shaman', phase: 2, label: 'BiS', url: WOWTBC_ENHANCEMENT_SHAMAN_T5_URL }, { provider: 'Wowhead', spec: 'Fury Warrior', phase: 2, label: 'BiS', url: 'https://www.wowhead.com/tbc/guide/classes/warrior/fury/dps-bis-gear-pve-phase-2' }], synergies: [{ class: 'Shaman', spec: 'Enhancement', phase: 2, bonus: 40, excludedRaces: ['Orc'], label: 'Troll/non-Orc weapon-sync pairing with Rod of the Sun King; guide rank is not raw stats only.' }], planningNote: 'Troll/non-Orc Enhancement weapon path and non-Blacksmithing Fury main-hand path. Orc weapon racial paths need a separate axe-focused ranking import.' },
  { id: 29996, name: 'Rod of the Sun King', slot: 'Off Hand', phase: 2, roles: ['melee'], source: 'Kael\'thas Sunstrider, Tempest Keep', type: 'Raid', unique: true, stats: { attackPower: 52, haste: 46, crit: 18 }, allowedClasses: ['Shaman', 'Rogue'], confidence: 'guide', guideProvider: 'Wowhead + wowtbc.gg', sourceAgreement: 'wowtbc-cross-check', sourceUrl: 'https://www.wowhead.com/tbc/item=29996/rod-of-the-sun-king', guideMentions: [{ provider: 'Wowhead', spec: 'Enhancement Shaman', phase: 2, label: 'BiS', url: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL }, { provider: 'wowtbc.gg', spec: 'Enhancement Shaman', phase: 2, label: 'BiS', url: WOWTBC_ENHANCEMENT_SHAMAN_T5_URL }], synergies: [{ class: 'Shaman', spec: 'Enhancement', phase: 2, bonus: 30, excludedRaces: ['Orc'], label: 'Preferred off-hand partner for Talon of the Phoenix in non-Orc Phase 2 guide setups.' }], planningNote: 'Troll/non-Orc Enhancement off-hand pairing with Talon of the Phoenix; Orc axe-racial paths need a separate import.' },
  { id: 29993, name: 'Twinblade of the Phoenix', slot: 'Main Hand', phase: 2, roles: ['melee'], source: 'Kael\'thas Sunstrider, The Eye', type: 'Raid', stats: { attackPower: 110, agility: 40, crit: 32 }, allowedClasses: ['Warrior', 'Paladin'], allowedSpecs: [{ class: 'Warrior', specs: ['Arms'] }, { class: 'Paladin', specs: ['Retribution'] }], twoHanded: true, planningNote: 'Two-handed weapon: valid for Arms/Ret planning, not Fury dual-wield defaults.' },
  { id: 29924, name: 'Netherbane', slot: 'Main Hand', phase: 2, roles: ['melee', 'hunter'], source: 'Al\'ar, Tempest Keep', type: 'Raid', stats: { attackPower: 88, agility: 30, hit: 18, crit: 20 }, allowedClasses: ['Shaman', 'Warrior', 'Rogue', 'Hunter'], confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=29924/netherbane', guideMentions: [{ provider: 'Wowhead', spec: 'Enhancement Shaman', phase: 2, label: 'Alternative', url: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL }, { provider: 'Wowhead', spec: 'Beast Mastery Hunter', phase: 2, label: 'Alternative', url: BM_HUNTER_PHASE_2_GUIDE_URL }], planningNote: 'Enhancement/Hunter alternative. Combat Rogue should prefer Talon of Azshara in Phase 2.' },
  { id: 29948, name: 'Claw of the Phoenix', slot: 'Off Hand', phase: 2, roles: ['hunter'], source: 'Al\'ar, Tempest Keep', type: 'Raid', stats: { attackPower: 58, agility: 28, hit: 16, crit: 18 }, allowedClasses: ['Hunter'], confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=29948/claw-of-the-phoenix', guideMentions: [{ provider: 'Wowhead', spec: 'Beast Mastery Hunter', phase: 2, label: 'Alternative', url: BM_HUNTER_PHASE_2_GUIDE_URL }], planningNote: 'Hunter Phase 2 off-hand stat-stick option; keeps Hunter weapon slots covered without borrowing invalid melee assumptions.' },
  { id: 30082, name: 'Talon of Azshara', slot: 'One Hand', phase: 2, roles: ['melee'], source: 'Morogrim Tidewalker, SSC', type: 'Raid', unique: true, stats: { attackPower: 68, agility: 26, hit: 15 }, allowedClasses: ['Rogue', 'Warrior', 'Shaman'], confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=30082/talon-of-azshara', guideMentions: [{ provider: 'Wowhead', spec: 'Combat Rogue', phase: 2, label: 'BiS', url: ROGUE_PHASE_2_GUIDE_URL }, { provider: 'Wowhead', spec: 'Fury Warrior', phase: 2, label: 'BiS', url: 'https://www.wowhead.com/tbc/guide/classes/warrior/fury/dps-bis-gear-pve-phase-2' }], planningNote: 'One-hand weapon that can be staged into main-hand or off-hand; Combat Rogue and Fury Warrior ranking is build-sensitive.' },
  { id: 28754, name: 'Triptych Shield of the Ancients', slot: 'Off Hand', phase: 1, roles: ['healer', 'tank'], source: 'Opera Event, Karazhan', type: 'Raid', stats: { healing: 84, stamina: 27, defense: 17 } },
  { id: 29273, name: 'Khadgar\'s Knapsack', slot: 'Off Hand', phase: 1, roles: ['caster'], source: 'Badge of Justice vendor', type: 'Badge', stats: { spellPower: 33, spellCrit: 18, intellect: 18 } },
  { id: 28772, name: 'Sunfury Bow of the Phoenix', slot: 'Ranged', phase: 1, roles: ['hunter'], source: 'Prince Malchezaar, Karazhan', type: 'Raid', stats: { attackPower: 62, agility: 25, crit: 18 }, allowedClasses: ['Hunter'] },
  { id: 29949, name: 'Arcanite Steam-Pistol', slot: 'Ranged', phase: 2, roles: ['melee', 'tank'], source: 'Al\'ar, The Eye', type: 'Raid', stats: { attackPower: 32, hit: 15, crit: 14 }, allowedClasses: ['Warrior', 'Rogue'] },
  { id: 28673, name: 'Tirisfal Wand of Ascendancy', slot: 'Ranged', phase: 1, roles: ['caster', 'healer'], source: 'Terestian Illhoof, Karazhan', type: 'Raid', stats: { spellPower: 21, healing: 33, intellect: 15 }, allowedClasses: ['Mage', 'Priest', 'Warlock'] },
  { id: 28592, name: 'Libram of Souls Redeemed', slot: 'Ranged', phase: 1, roles: ['healer', 'tank'], source: 'Opera Event, Karazhan', type: 'Raid', stats: { healing: 64, defense: 10 }, allowedClasses: ['Paladin'], confidence: 'starter', note: 'Relic fallback so Paladin ranged slot uses Librams, not physical ranged weapons.' },
  { id: 27484, name: 'Libram of Avengement', slot: 'Ranged', phase: 1, roles: ['melee'], source: 'The Maker, Heroic Blood Furnace; Ret Paladin libram', type: 'Dungeon', stats: { crit: 34, attackPower: 20 }, allowedClasses: ['Paladin'], confidence: 'guide', guideProvider: 'Wowhead', sourceAgreement: 'Wowhead-only', sourceUrl: 'https://www.wowhead.com/tbc/item=27484/libram-of-avengement', guideMentions: [{ provider: 'Wowhead', spec: 'Retribution Paladin', phase: 2, label: 'BiS', url: RET_PALADIN_PHASE_2_GUIDE_URL }], planningNote: 'Retribution Paladin ranged slot must be a Libram. Wowhead lists Libram of Avengement as the long-lived Ret choice.' },
  { id: 27886, name: 'Idol of the Emerald Queen', slot: 'Ranged', phase: 1, roles: ['tank', 'healer', 'melee', 'caster'], source: 'The Botanica relic fallback', type: 'Dungeon', stats: { healing: 42, agility: 12, armor: 120 }, allowedClasses: ['Druid'], confidence: 'starter', note: 'Relic fallback so Druid ranged slot uses Idols.' },
  { id: 27815, name: 'Totem of the Astral Winds', slot: 'Ranged', phase: 1, roles: ['melee'], source: 'Pandemonius, Heroic Mana-Tombs; Enhancement Shaman totem', type: 'Dungeon', unique: true, stats: { attackPower: 80 }, allowedClasses: ['Shaman'], confidence: 'guide', guideProvider: 'Wowhead + wowtbc.gg', sourceAgreement: 'wowtbc-cross-check', sourceUrl: 'https://www.wowhead.com/tbc/item=27815/totem-of-the-astral-winds', guideMentions: [{ provider: 'Wowhead', spec: 'Enhancement Shaman', phase: 2, label: 'BiS', url: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL }, { provider: 'wowtbc.gg', spec: 'Enhancement Shaman', phase: 2, label: 'BiS', url: WOWTBC_ENHANCEMENT_SHAMAN_T5_URL }], synergies: [{ class: 'Shaman', spec: 'Enhancement', phase: 2, bonus: 25, label: 'Class relic slot synergy: Windfury Weapon value is specific to Enhancement Shaman.' }], note: 'Models the Windfury Weapon attack power bonus for Enhancement ranking.' },
  { id: 28248, name: 'Totem of the Void', slot: 'Ranged', phase: 1, roles: ['caster', 'healer', 'melee'], source: 'The Arcatraz relic fallback', type: 'Dungeon', stats: { spellPower: 24, healing: 44, attackPower: 24 }, allowedClasses: ['Shaman'], confidence: 'starter', note: 'Relic fallback so Shaman ranged slot uses Totems.' },
  { id: 32365, name: 'Heartshatter Breastplate', slot: 'Chest', phase: 3, roles: ['melee'], source: 'Black Temple planning item', type: 'Raid', stats: { attackPower: 120, agility: 48, hit: 28 }, note: 'Future-phase placeholder for planning.' },
  { id: 32374, name: 'Zhar\'doom, Greatstaff of the Devourer', slot: 'Main Hand', phase: 3, roles: ['caster'], source: 'Illidan Stormrage, Black Temple', type: 'Raid', stats: { spellPower: 259, spellHit: 26, spellCrit: 36 }, note: 'Future-phase planning item.' },
  { id: 33489, name: 'Mantle of Ill Intent', slot: 'Shoulder', phase: 4, roles: ['caster'], source: 'Zul Aman planning item', type: 'Raid', stats: { spellPower: 53, spellHaste: 28, spellCrit: 24 } },
  { id: 34369, name: 'Carapace of Sunfire', slot: 'Chest', phase: 5, roles: ['caster'], source: 'Sunwell Plateau planning item', type: 'Crafted', profession: 'Tailoring', stats: { spellPower: 71, spellHaste: 40, spellCrit: 34 }, note: 'Future-phase crafted planning item.' },
]

function importedGuideItem(
  id: number,
  name: string,
  slot: Item['slot'],
  role: Role,
  playerClass: PlayerClass,
  spec: string,
  guideUrl: string,
  rank: number,
  planningNote: string,
  overrides: Partial<Item> = {},
): Item {
  return {
    id,
    name,
    slot,
    phase: 2,
    roles: [role],
    source: 'Wowhead Phase 2 BiS guide import',
    type: 'Raid',
    stats: {},
    allowedClasses: [playerClass],
    allowedSpecs: [{ class: playerClass, specs: [spec] }],
    confidence: 'guide',
    guideProvider: 'Wowhead',
    sourceAgreement: 'Wowhead-only',
    sourceUrl: `https://www.wowhead.com/tbc/item=${id}`,
    guideMentions: [{ provider: 'Wowhead', spec: `${spec} ${playerClass}`, phase: 2, rank, label: rank === 1 ? 'BiS' : 'Alternative', url: guideUrl }],
    isAlternative: rank > 1,
    guideOnly: Object.keys(overrides.stats ?? {}).length === 0,
    planningNote,
    ...overrides,
  }
}

const importedPhase2Items: Item[] = [
  importedGuideItem(8345, 'Wolfshead Helm', 'Head', 'melee', 'Druid', 'Feral Cat', 'https://www.wowhead.com/tbc/guide/classes/druid/feral/dps-bis-gear-pve-phase-2', 1, 'Mandatory powershifting helm despite its low item level; raw-stat sorting must not replace it.'),
  importedGuideItem(29100, 'Mantle of Malorne', 'Shoulder', 'melee', 'Druid', 'Feral Cat', 'https://www.wowhead.com/tbc/guide/classes/druid/feral/dps-bis-gear-pve-phase-2', 1, 'Part of the rotation-dependent two-piece Tier 4 Feral Cat setup.'),
  importedGuideItem(29096, 'Breastplate of Malorne', 'Chest', 'melee', 'Druid', 'Feral Cat', 'https://www.wowhead.com/tbc/guide/classes/druid/feral/dps-bis-gear-pve-phase-2', 1, 'Pairs with Mantle of Malorne for the guide-backed two-piece Tier 4 setup.'),
  importedGuideItem(29947, 'Gloves of the Searing Grip', 'Hands', 'melee', 'Druid', 'Feral Cat', 'https://www.wowhead.com/tbc/guide/classes/druid/feral/dps-bis-gear-pve-phase-2', 1, 'Feral Cat offset gloves; do not substitute similarly named placeholder data.'),
  importedGuideItem(29995, 'Leggings of Murderous Intent', 'Legs', 'melee', 'Druid', 'Feral Cat', 'https://www.wowhead.com/tbc/guide/classes/druid/feral/dps-bis-gear-pve-phase-2', 1, 'Feral Cat leg priority depends on the chosen Tier 4/Tier 5 set configuration.'),
  importedGuideItem(29966, 'Vambraces of Ending', 'Wrist', 'melee', 'Druid', 'Feral Cat', 'https://www.wowhead.com/tbc/guide/classes/druid/feral/dps-bis-gear-pve-phase-2', 1, 'Feral Cat wrist correction from audit; stronger Phase 2 priority than Bracers of Eradication.'),
  importedGuideItem(28545, 'Edgewalker Longboots', 'Feet', 'melee', 'Druid', 'Feral Cat', 'https://www.wowhead.com/tbc/guide/classes/druid/feral/dps-bis-gear-pve-phase-2', 1, 'Guide-backed Feral Cat Phase 2 boots.'),
  importedGuideItem(32014, "Merciless Gladiator's Maul", 'Main Hand', 'melee', 'Druid', 'Feral Cat', 'https://www.wowhead.com/tbc/guide/classes/druid/feral/dps-bis-gear-pve-phase-2', 1, 'Feral forms rank weapon stats and feral attack power, not displayed weapon DPS.', { twoHanded: true }),
  importedGuideItem(29390, 'Everbloom Idol', 'Ranged', 'melee', 'Druid', 'Feral Cat', 'https://www.wowhead.com/tbc/guide/classes/druid/feral/dps-bis-gear-pve-phase-2', 1, 'Personal-damage Feral Cat idol; Raven Goddess is a party-utility alternative.'),
  importedGuideItem(32387, 'Idol of the Raven Goddess', 'Ranged', 'melee', 'Druid', 'Feral Cat', 'https://www.wowhead.com/tbc/guide/classes/druid/feral/dps-bis-gear-pve-phase-2', 2, 'Trades personal damage for party crit and must remain labeled as a utility alternative.'),

  importedGuideItem(30105, 'Serpent Spine Longbow', 'Ranged', 'hunter', 'Hunter', 'Beast Mastery', 'https://www.wowhead.com/tbc/guide/classes/hunter/beast-mastery/dps-bis-gear-pve-phase-2', 1, 'Hunter Phase 2 ranged weapon priority; ammo and quiver assumptions remain future data work.'),
  importedGuideItem(30105, 'Serpent Spine Longbow', 'Ranged', 'hunter', 'Hunter', 'Marksmanship', 'https://www.wowhead.com/tbc/guide/classes/hunter/marksmanship/dps-bis-gear-pve-phase-2', 1, 'Marksmanship Phase 2 ranged weapon priority.'),
  importedGuideItem(30105, 'Serpent Spine Longbow', 'Ranged', 'hunter', 'Hunter', 'Survival', 'https://www.wowhead.com/tbc/guide/classes/hunter/survival/dps-bis-gear-pve-phase-2', 1, 'Survival Phase 2 ranged weapon priority.'),
  importedGuideItem(32944, 'Talon of the Phoenix', 'Main Hand', 'hunter', 'Hunter', 'Beast Mastery', 'https://www.wowhead.com/tbc/guide/classes/hunter/beast-mastery/dps-bis-gear-pve-phase-2', 1, 'Beast Mastery main-hand stat stick paired with Claw of the Phoenix.'),
  importedGuideItem(32944, 'Talon of the Phoenix', 'Main Hand', 'hunter', 'Hunter', 'Marksmanship', 'https://www.wowhead.com/tbc/guide/classes/hunter/marksmanship/dps-bis-gear-pve-phase-2', 1, 'Marksmanship main-hand stat stick paired with Claw of the Phoenix.'),
  importedGuideItem(30040, 'Belt of Deep Shadow', 'Waist', 'hunter', 'Hunter', 'Beast Mastery', 'https://www.wowhead.com/tbc/guide/classes/hunter/beast-mastery/dps-bis-gear-pve-phase-2', 1, 'Beast Mastery waist correction: crafted BoE belt remains visible without Leatherworking selected.', { craftedByProfession: 'Leatherworking', bindType: 'BoE', equippableWithoutProfession: true }),
  importedGuideItem(29995, 'Leggings of Murderous Intent', 'Legs', 'hunter', 'Hunter', 'Beast Mastery', 'https://www.wowhead.com/tbc/guide/classes/hunter/beast-mastery/dps-bis-gear-pve-phase-2', 1, 'Beast Mastery uses offset legs after assembling four-piece Rift Stalker.'),
  importedGuideItem(29951, 'Star-Strider Boots', 'Feet', 'hunter', 'Hunter', 'Beast Mastery', 'https://www.wowhead.com/tbc/guide/classes/hunter/beast-mastery/dps-bis-gear-pve-phase-2', 2, 'Close Hunter alternative to Cobra-Lash Boots.'),
  importedGuideItem(28506, 'Gloves of Dexterous Manipulation', 'Hands', 'hunter', 'Hunter', 'Survival', 'https://www.wowhead.com/tbc/guide/classes/hunter/survival/dps-bis-gear-pve-phase-2', 1, 'Survival uses gloves as its Tier 5 offset while retaining four Rift Stalker pieces elsewhere.'),
  ...(['Marksmanship', 'Survival'] as const).flatMap((hunterSpec) => {
    const guideUrl = `https://www.wowhead.com/tbc/guide/classes/hunter/${hunterSpec.toLowerCase()}/dps-bis-gear-pve-phase-2`
    return [
      importedGuideItem(30141, 'Rift Stalker Helm', 'Head', 'hunter', 'Hunter', hunterSpec, guideUrl, 1, 'Hunter Tier 5 set transition.'),
      importedGuideItem(30143, 'Rift Stalker Mantle', 'Shoulder', 'hunter', 'Hunter', hunterSpec, guideUrl, 1, 'Hunter Tier 5 set transition.'),
      importedGuideItem(30139, 'Rift Stalker Hauberk', 'Chest', 'hunter', 'Hunter', hunterSpec, guideUrl, 1, 'Hunter Tier 5 set transition.'),
      importedGuideItem(29966, 'Vambraces of Ending', 'Wrist', 'hunter', 'Hunter', hunterSpec, guideUrl, 1, 'Hunter Phase 2 wrist priority.'),
      importedGuideItem(30040, 'Belt of Deep Shadow', 'Waist', 'hunter', 'Hunter', hunterSpec, guideUrl, 1, 'Crafted Hunter waist planning option.', { craftedByProfession: 'Leatherworking', bindType: 'BoE', equippableWithoutProfession: true }),
      importedGuideItem(hunterSpec === 'Survival' ? 30142 : 29995, hunterSpec === 'Survival' ? 'Rift Stalker Leggings' : 'Leggings of Murderous Intent', 'Legs', 'hunter', 'Hunter', hunterSpec, guideUrl, 1, 'Spec-specific Hunter Tier 5 offset selection.'),
      importedGuideItem(30104, 'Cobra-Lash Boots', 'Feet', 'hunter', 'Hunter', hunterSpec, guideUrl, 1, 'Hunter Phase 2 boot priority.'),
    ]
  }),

  importedGuideItem(30135, 'Crystalforge War-Helm', 'Head', 'melee', 'Paladin', 'Retribution', 'https://www.wowhead.com/tbc/guide/classes/paladin/retribution/dps-bis-gear-pve-phase-2', 1, 'No-profession Ret head correction; Engineering goggles stay as a profession option.'),
  importedGuideItem(32461, 'Furious Gizmatic Goggles', 'Head', 'melee', 'Paladin', 'Retribution', 'https://www.wowhead.com/tbc/guide/classes/paladin/retribution/dps-bis-gear-pve-phase-2', 2, 'Engineering Phase 2 Ret option; profession ownership must be explicit.', { profession: 'Engineering', requiresProfession: 'Engineering', bindType: 'BoP' }),
  importedGuideItem(30055, 'Shoulderpads of the Stranger', 'Shoulder', 'melee', 'Paladin', 'Retribution', 'https://www.wowhead.com/tbc/guide/classes/paladin/retribution/dps-bis-gear-pve-phase-2', 1, 'Ret Phase 2 expertise shoulder priority; fixes missing shoulder row from the guide audit.'),
  importedGuideItem(28485, 'Bulwark of the Ancient Kings', 'Chest', 'melee', 'Paladin', 'Retribution', 'https://www.wowhead.com/tbc/guide/classes/paladin/retribution/dps-bis-gear-pve-phase-2', 1, 'Armorsmithing chest enabled by choosing Twinblade instead of the Swordsmith weapon path.', { profession: 'Blacksmithing', requiresProfession: 'Blacksmithing', requiresProfessionSpecialization: 'Armorsmith', bindType: 'BoP' }),
  importedGuideItem(28795, 'Bladespire Warbands', 'Wrist', 'melee', 'Paladin', 'Retribution', 'https://www.wowhead.com/tbc/guide/classes/paladin/retribution/dps-bis-gear-pve-phase-2', 1, 'Ret expertise planning can make these preferable to higher-looking raw-stat bracers.'),
  importedGuideItem(29947, 'Gloves of the Searing Grip', 'Hands', 'melee', 'Paladin', 'Retribution', 'https://www.wowhead.com/tbc/guide/classes/paladin/retribution/dps-bis-gear-pve-phase-2', 1, 'Ret glove correction; guide audit rejects the generic Dexterous Manipulation fallback.'),
  importedGuideItem(30257, 'Shattrath Leggings', 'Legs', 'melee', 'Paladin', 'Retribution', 'https://www.wowhead.com/tbc/guide/classes/paladin/retribution/dps-bis-gear-pve-phase-2', 1, 'No-profession Ret leg correction for non-Human planning before racials/hit are modeled.'),
  importedGuideItem(30081, 'Warboots of Obliteration', 'Feet', 'melee', 'Paladin', 'Retribution', 'https://www.wowhead.com/tbc/guide/classes/paladin/retribution/dps-bis-gear-pve-phase-2', 2, 'Ret Phase 2 alternative selected by expertise and loot availability.'),
  importedGuideItem(28430, 'Lionheart Executioner', 'Main Hand', 'melee', 'Paladin', 'Retribution', 'https://www.wowhead.com/tbc/guide/classes/paladin/retribution/dps-bis-gear-pve-phase-2', 2, 'Swordsmith alternative; selecting it changes profession and chest planning.', { twoHanded: true, profession: 'Blacksmithing', requiresProfession: 'Blacksmithing', requiresProfessionSpecialization: 'Master Swordsmith', bindType: 'BoP' }),

  importedGuideItem(30103, 'Fang of Vashj', 'Main Hand', 'melee', 'Rogue', 'Assassination', 'https://www.wowhead.com/tbc/guide/classes/rogue/dps-bis-gear-pve-phase-2', 1, 'Assassination requires dagger-constrained rankings rather than Combat sword defaults.'),
  importedGuideItem(29962, 'Heartrazor', 'Off Hand', 'melee', 'Rogue', 'Assassination', 'https://www.wowhead.com/tbc/guide/classes/rogue/dps-bis-gear-pve-phase-2', 1, 'Slow dagger partner for Mutilate; do not inherit Combat Potency fast-off-hand logic.'),
  importedGuideItem(32027, "Merciless Gladiator's Quickblade", 'Off Hand', 'melee', 'Rogue', 'Combat', 'https://www.wowhead.com/tbc/guide/classes/rogue/dps-bis-gear-pve-phase-2', 1, 'Fast Combat off-hand for Combat Potency and Sword Specialization.'),
  importedGuideItem(30082, 'Talon of Azshara', 'One Hand', 'melee', 'Rogue', 'Combat', 'https://www.wowhead.com/tbc/guide/classes/rogue/dps-bis-gear-pve-phase-2', 1, 'Combat main-hand correction: Phase 2 guide priority over Netherbane.', { unique: true }),
  ...(['Assassination', 'Subtlety'] as const).flatMap((rogueSpec) => {
    const guideUrl = 'https://www.wowhead.com/tbc/guide/classes/rogue/dps-bis-gear-pve-phase-2'
    return [
      importedGuideItem(30146, 'Deathmantle Helm', 'Head', 'melee', 'Rogue', rogueSpec, guideUrl, 1, 'Shared Rogue Phase 2 armor map; weapon ranking remains spec-specific.'),
      importedGuideItem(30149, 'Deathmantle Shoulderpads', 'Shoulder', 'melee', 'Rogue', rogueSpec, guideUrl, 1, 'Preserve Deathmantle four-piece.'),
      importedGuideItem(30101, "Bloodsea Brigand's Vest", 'Chest', 'melee', 'Rogue', rogueSpec, guideUrl, 1, 'Paired with tier shoulders to preserve Deathmantle four-piece.'),
      importedGuideItem(29966, 'Vambraces of Ending', 'Wrist', 'melee', 'Rogue', rogueSpec, guideUrl, 1, 'Shared Rogue wrist priority.'),
      importedGuideItem(30145, 'Deathmantle Handguards', 'Hands', 'melee', 'Rogue', rogueSpec, guideUrl, 1, 'Preserve Deathmantle four-piece.'),
      importedGuideItem(30106, 'Belt of One-Hundred Deaths', 'Waist', 'melee', 'Rogue', rogueSpec, guideUrl, 1, 'Shared Rogue waist priority.'),
      importedGuideItem(30148, 'Deathmantle Legguards', 'Legs', 'melee', 'Rogue', rogueSpec, guideUrl, 1, 'Tier legs outrank stronger standalone legs when required for four-piece.'),
      importedGuideItem(28545, 'Edgewalker Longboots', 'Feet', 'melee', 'Rogue', rogueSpec, guideUrl, 1, 'Shared Rogue boot priority.'),
      importedGuideItem(29949, 'Arcanite Steam-Pistol', 'Ranged', 'melee', 'Rogue', rogueSpec, guideUrl, 1, 'Rogue ranged stat-stick priority.'),
    ]
  }),

  importedGuideItem(30120, 'Destroyer Battle-Helm', 'Head', 'melee', 'Warrior', 'Fury', 'https://www.wowhead.com/tbc/guide/classes/warrior/fury/dps-bis-gear-pve-phase-2', 1, 'Part of the recommended Fury four-piece Destroyer package.'),
  importedGuideItem(30122, 'Destroyer Shoulderblades', 'Shoulder', 'melee', 'Warrior', 'Fury', 'https://www.wowhead.com/tbc/guide/classes/warrior/fury/dps-bis-gear-pve-phase-2', 1, 'Part of the recommended Fury four-piece Destroyer package.'),
  importedGuideItem(30118, 'Destroyer Breastplate', 'Chest', 'melee', 'Warrior', 'Fury', 'https://www.wowhead.com/tbc/guide/classes/warrior/fury/dps-bis-gear-pve-phase-2', 1, 'Part of the recommended Fury four-piece Destroyer package.'),
  importedGuideItem(30119, 'Destroyer Gauntlets', 'Hands', 'melee', 'Warrior', 'Fury', 'https://www.wowhead.com/tbc/guide/classes/warrior/fury/dps-bis-gear-pve-phase-2', 1, 'Part of the recommended Fury four-piece Destroyer package.'),
  importedGuideItem(29995, 'Leggings of Murderous Intent', 'Legs', 'melee', 'Warrior', 'Fury', 'https://www.wowhead.com/tbc/guide/classes/warrior/fury/dps-bis-gear-pve-phase-2', 1, 'Fury leg correction from audit; use Murderous Intent over Skulker fallback.'),
  importedGuideItem(30081, 'Warboots of Obliteration', 'Feet', 'melee', 'Warrior', 'Fury', 'https://www.wowhead.com/tbc/guide/classes/warrior/fury/dps-bis-gear-pve-phase-2', 1, 'Fury boot correction from audit; Phase 2 best over Effortless Striking fallback.'),
  importedGuideItem(32944, 'Talon of the Phoenix', 'Main Hand', 'melee', 'Warrior', 'Fury', 'https://www.wowhead.com/tbc/guide/classes/warrior/fury/dps-bis-gear-pve-phase-2', 1, 'No-Blacksmithing Fury main-hand path; avoids invalid two-handed Fury default.'),
  importedGuideItem(30082, 'Talon of Azshara', 'One Hand', 'melee', 'Warrior', 'Fury', 'https://www.wowhead.com/tbc/guide/classes/warrior/fury/dps-bis-gear-pve-phase-2', 1, 'Fury off-hand correction; guide-priority one-hand option.', { unique: true }),
  importedGuideItem(30279, "Mama's Insurance", 'Ranged', 'melee', 'Warrior', 'Fury', 'https://www.wowhead.com/tbc/guide/classes/warrior/fury/dps-bis-gear-pve-phase-2', 1, 'Practical Fury ranged stat stick without taking Serpent Spine from Hunters.'),
  importedGuideItem(30120, 'Destroyer Battle-Helm', 'Head', 'melee', 'Warrior', 'Arms', 'https://www.wowhead.com/tbc/guide/classes/warrior/arms/dps-bis-gear-pve-phase-2', 1, 'Practical Arms tier head; Engineering is an alternative.'),
  importedGuideItem(30055, 'Shoulderpads of the Stranger', 'Shoulder', 'melee', 'Warrior', 'Arms', 'https://www.wowhead.com/tbc/guide/classes/warrior/arms/dps-bis-gear-pve-phase-2', 1, 'Arms offset shoulder priority.'),
  importedGuideItem(30118, 'Destroyer Breastplate', 'Chest', 'melee', 'Warrior', 'Arms', 'https://www.wowhead.com/tbc/guide/classes/warrior/arms/dps-bis-gear-pve-phase-2', 1, 'Practical Arms tier chest.'),
  importedGuideItem(30057, 'Bracers of Eradication', 'Wrist', 'melee', 'Warrior', 'Arms', 'https://www.wowhead.com/tbc/guide/classes/warrior/arms/dps-bis-gear-pve-phase-2', 1, 'Arms wrist priority.'),
  importedGuideItem(29947, 'Gloves of the Searing Grip', 'Hands', 'melee', 'Warrior', 'Arms', 'https://www.wowhead.com/tbc/guide/classes/warrior/arms/dps-bis-gear-pve-phase-2', 1, 'Arms glove priority.'),
  importedGuideItem(30106, 'Belt of One-Hundred Deaths', 'Waist', 'melee', 'Warrior', 'Arms', 'https://www.wowhead.com/tbc/guide/classes/warrior/arms/dps-bis-gear-pve-phase-2', 1, 'Arms waist priority.'),
  importedGuideItem(29995, 'Leggings of Murderous Intent', 'Legs', 'melee', 'Warrior', 'Arms', 'https://www.wowhead.com/tbc/guide/classes/warrior/arms/dps-bis-gear-pve-phase-2', 1, 'Arms leg priority.'),
  importedGuideItem(30081, 'Warboots of Obliteration', 'Feet', 'melee', 'Warrior', 'Arms', 'https://www.wowhead.com/tbc/guide/classes/warrior/arms/dps-bis-gear-pve-phase-2', 1, 'Arms boot priority.'),
  importedGuideItem(29993, 'Twinblade of the Phoenix', 'Main Hand', 'melee', 'Warrior', 'Arms', 'https://www.wowhead.com/tbc/guide/classes/warrior/arms/dps-bis-gear-pve-phase-2', 1, 'Arms two-handed weapon priority.', { twoHanded: true }),
  importedGuideItem(30279, "Mama's Insurance", 'Ranged', 'melee', 'Warrior', 'Arms', 'https://www.wowhead.com/tbc/guide/classes/warrior/arms/dps-bis-gear-pve-phase-2', 1, 'Practical ranged stat stick without taking Hunter loot.'),

  importedGuideItem(30233, 'Nordrassil Headpiece', 'Head', 'caster', 'Druid', 'Balance', 'https://www.wowhead.com/tbc/guide/classes/druid/balance/dps-bis-gear-pve-phase-2', 1, 'Balance four-piece Tier 5 priority.'),
  importedGuideItem(30235, 'Nordrassil Wrath-Mantle', 'Shoulder', 'caster', 'Druid', 'Balance', 'https://www.wowhead.com/tbc/guide/classes/druid/balance/dps-bis-gear-pve-phase-2', 1, 'Balance four-piece Tier 5 priority.'),
  importedGuideItem(30231, 'Nordrassil Chestpiece', 'Chest', 'caster', 'Druid', 'Balance', 'https://www.wowhead.com/tbc/guide/classes/druid/balance/dps-bis-gear-pve-phase-2', 1, 'Balance four-piece Tier 5 priority.'),
  importedGuideItem(29918, 'Mindstorm Wristbands', 'Wrist', 'caster', 'Druid', 'Balance', 'https://www.wowhead.com/tbc/guide/classes/druid/balance/dps-bis-gear-pve-phase-2', 1, 'Guide-backed caster wrist priority.'),
  importedGuideItem(30232, 'Nordrassil Gauntlets', 'Hands', 'caster', 'Druid', 'Balance', 'https://www.wowhead.com/tbc/guide/classes/druid/balance/dps-bis-gear-pve-phase-2', 1, 'Balance four-piece Tier 5 priority.'),
  importedGuideItem(30038, 'Belt of Blasting', 'Waist', 'caster', 'Druid', 'Balance', 'https://www.wowhead.com/tbc/guide/classes/druid/balance/dps-bis-gear-pve-phase-2', 1, 'Crafted BoE caster belt; owning Tailoring is not required.', { craftedByProfession: 'Tailoring', bindType: 'BoE', equippableWithoutProfession: true, requiresProfession: undefined, profession: undefined }),
  importedGuideItem(24262, 'Spellstrike Pants', 'Legs', 'caster', 'Druid', 'Balance', 'https://www.wowhead.com/tbc/guide/classes/druid/balance/dps-bis-gear-pve-phase-2', 1, 'Purchasable crafted legs; Tailoring matters only for the set bonus context.', { craftedByProfession: 'Tailoring', bindType: 'BoE', equippableWithoutProfession: true, requiresProfession: undefined, profession: undefined }),
  importedGuideItem(30734, 'Leggings of the Seventh Circle', 'Legs', 'caster', 'Druid', 'Balance', 'https://www.wowhead.com/tbc/guide/classes/druid/balance/dps-bis-gear-pve-phase-2', 1, 'Co-BiS world-boss leg option beside Spellstrike Pants for non-Tailoring or socket-bonus planning.'),
  importedGuideItem(30037, 'Boots of Blasting', 'Feet', 'caster', 'Druid', 'Balance', 'https://www.wowhead.com/tbc/guide/classes/druid/balance/dps-bis-gear-pve-phase-2', 1, 'Tailoring-locked hit option.', { profession: 'Tailoring', requiresProfession: 'Tailoring', bindType: 'BoP' }),
  importedGuideItem(30067, 'Velvet Boots of the Guardian', 'Feet', 'caster', 'Druid', 'Balance', 'https://www.wowhead.com/tbc/guide/classes/druid/balance/dps-bis-gear-pve-phase-2', 1, 'Co-BiS non-Tailoring Balance boot option when Boots of Blasting are unavailable or hit planning changes.'),
  importedGuideItem(32963, "Merciless Gladiator's Gavel", 'Main Hand', 'caster', 'Druid', 'Balance', 'https://www.wowhead.com/tbc/guide/classes/druid/balance/dps-bis-gear-pve-phase-2', 1, 'Guide-backed Balance one-hand option.', { type: 'PvP', source: 'Arena Season 2' }),
  importedGuideItem(30049, 'Fathomstone', 'Off Hand', 'caster', 'Druid', 'Balance', 'https://www.wowhead.com/tbc/guide/classes/druid/balance/dps-bis-gear-pve-phase-2', 1, 'Balance off-hand priority.'),
  importedGuideItem(27518, 'Ivory Idol of the Moongoddess', 'Ranged', 'caster', 'Druid', 'Balance', 'https://www.wowhead.com/tbc/guide/classes/druid/balance/dps-bis-gear-pve-phase-2', 1, 'Balance ranged slot must remain an Idol.'),
  importedGuideItem(32387, 'Idol of the Raven Goddess', 'Ranged', 'caster', 'Druid', 'Balance', 'https://www.wowhead.com/tbc/guide/classes/druid/balance/dps-bis-gear-pve-phase-2', 1, 'Raid-utility co-BiS Idol when group crit value outweighs personal-damage idol ranking.'),

  importedGuideItem(30206, 'Cowl of Tirisfal', 'Head', 'caster', 'Mage', 'Arcane', 'https://www.wowhead.com/tbc/guide/classes/mage/arcane/dps-bis-gear-pve-phase-2', 1, 'Arcane Tier 5 four-piece priority.'),
  importedGuideItem(30210, 'Mantle of Tirisfal', 'Shoulder', 'caster', 'Mage', 'Arcane', 'https://www.wowhead.com/tbc/guide/classes/mage/arcane/dps-bis-gear-pve-phase-2', 1, 'Arcane Tier 5 four-piece priority.'),
  importedGuideItem(30196, 'Robes of Tirisfal', 'Chest', 'caster', 'Mage', 'Arcane', 'https://www.wowhead.com/tbc/guide/classes/mage/arcane/dps-bis-gear-pve-phase-2', 1, 'Arcane Tier 5 four-piece priority.'),
  importedGuideItem(29918, 'Mindstorm Wristbands', 'Wrist', 'caster', 'Mage', 'Arcane', 'https://www.wowhead.com/tbc/guide/classes/mage/arcane/dps-bis-gear-pve-phase-2', 1, 'Arcane wrist priority.'),
  importedGuideItem(29987, 'Gauntlets of the Sun King', 'Hands', 'caster', 'Mage', 'Arcane', 'https://www.wowhead.com/tbc/guide/classes/mage/arcane/dps-bis-gear-pve-phase-2', 1, 'Arcane offset gloves preserve four-piece Tier 5 elsewhere.'),
  importedGuideItem(30064, 'Cord of Screaming Terrors', 'Waist', 'caster', 'Mage', 'Arcane', 'https://www.wowhead.com/tbc/guide/classes/mage/arcane/dps-bis-gear-pve-phase-2', 1, 'Arcane avoids unnecessary hit overcap.'),
  importedGuideItem(30207, 'Leggings of Tirisfal', 'Legs', 'caster', 'Mage', 'Arcane', 'https://www.wowhead.com/tbc/guide/classes/mage/arcane/dps-bis-gear-pve-phase-2', 1, 'Arcane Tier 5 four-piece priority.'),
  importedGuideItem(30067, 'Velvet Boots of the Guardian', 'Feet', 'caster', 'Mage', 'Arcane', 'https://www.wowhead.com/tbc/guide/classes/mage/arcane/dps-bis-gear-pve-phase-2', 1, 'Arcane boots avoid excess spell hit.'),
  importedGuideItem(29988, 'The Nexus Key', 'Main Hand', 'caster', 'Mage', 'Arcane', 'https://www.wowhead.com/tbc/guide/classes/mage/arcane/dps-bis-gear-pve-phase-2', 1, 'Two-handed Arcane weapon; off-hand must remain empty.', { twoHanded: true }),
  importedGuideItem(29271, 'Talisman of Kalecgos', 'Off Hand', 'caster', 'Mage', 'Arcane', 'https://www.wowhead.com/tbc/guide/classes/mage/arcane/dps-bis-gear-pve-phase-2', 2, 'One-hand alternative off-hand only.'),
  importedGuideItem(28783, 'Eredar Wand of Obliteration', 'Ranged', 'caster', 'Mage', 'Arcane', 'https://www.wowhead.com/tbc/guide/classes/mage/arcane/dps-bis-gear-pve-phase-2', 1, 'Arcane wand priority.'),

  importedGuideItem(32494, 'Destruction Holo-Gogs', 'Head', 'caster', 'Mage', 'Fire', 'https://www.wowhead.com/tbc/guide/classes/mage/fire/dps-bis-gear-pve-phase-2', 1, 'Engineering Fire helm.', { profession: 'Engineering', requiresProfession: 'Engineering', bindType: 'BoP' }),
  importedGuideItem(30024, 'Mantle of the Elven Kings', 'Shoulder', 'caster', 'Mage', 'Fire', 'https://www.wowhead.com/tbc/guide/classes/mage/fire/dps-bis-gear-pve-phase-2', 1, 'Fire hit-balanced shoulder priority.'),
  importedGuideItem(30107, 'Vestments of the Sea-Witch', 'Chest', 'caster', 'Mage', 'Fire', 'https://www.wowhead.com/tbc/guide/classes/mage/fire/dps-bis-gear-pve-phase-2', 1, 'Fire Phase 2 chest priority.'),
  importedGuideItem(29918, 'Mindstorm Wristbands', 'Wrist', 'caster', 'Mage', 'Fire', 'https://www.wowhead.com/tbc/guide/classes/mage/fire/dps-bis-gear-pve-phase-2', 1, 'Fire wrist priority.'),
  importedGuideItem(29987, 'Gauntlets of the Sun King', 'Hands', 'caster', 'Mage', 'Fire', 'https://www.wowhead.com/tbc/guide/classes/mage/fire/dps-bis-gear-pve-phase-2', 1, 'Fire glove priority.'),
  importedGuideItem(30038, 'Belt of Blasting', 'Waist', 'caster', 'Mage', 'Fire', 'https://www.wowhead.com/tbc/guide/classes/mage/fire/dps-bis-gear-pve-phase-2', 1, 'Crafted BoE belt; no Tailoring equip requirement.', { craftedByProfession: 'Tailoring', bindType: 'BoE', equippableWithoutProfession: true, requiresProfession: undefined, profession: undefined }),
  importedGuideItem(30207, 'Leggings of Tirisfal', 'Legs', 'caster', 'Mage', 'Fire', 'https://www.wowhead.com/tbc/guide/classes/mage/fire/dps-bis-gear-pve-phase-2', 1, 'Fire hit-balanced leg priority.'),
  importedGuideItem(30067, 'Velvet Boots of the Guardian', 'Feet', 'caster', 'Mage', 'Fire', 'https://www.wowhead.com/tbc/guide/classes/mage/fire/dps-bis-gear-pve-phase-2', 1, 'Fire boot priority when hit is solved.'),
  importedGuideItem(30095, 'Fang of the Leviathan', 'Main Hand', 'caster', 'Mage', 'Fire', 'https://www.wowhead.com/tbc/guide/classes/mage/fire/dps-bis-gear-pve-phase-2', 1, 'Fire one-hand weapon priority.'),
  importedGuideItem(29270, 'Flametongue Seal', 'Off Hand', 'caster', 'Mage', 'Fire', 'https://www.wowhead.com/tbc/guide/classes/mage/fire/dps-bis-gear-pve-phase-2', 1, 'Fire-specific off-hand.'),
  importedGuideItem(29982, 'Wand of the Forgotten Star', 'Ranged', 'caster', 'Mage', 'Fire', 'https://www.wowhead.com/tbc/guide/classes/mage/fire/dps-bis-gear-pve-phase-2', 1, 'Fire wand priority.'),

  importedGuideItem(30206, 'Cowl of Tirisfal', 'Head', 'caster', 'Mage', 'Frost', 'https://www.wowhead.com/tbc/guide/classes/mage/frost/dps-bis-gear-pve-phase-2', 1, 'Frost Tier 5 four-piece priority.'),
  importedGuideItem(30210, 'Mantle of Tirisfal', 'Shoulder', 'caster', 'Mage', 'Frost', 'https://www.wowhead.com/tbc/guide/classes/mage/frost/dps-bis-gear-pve-phase-2', 1, 'Frost Tier 5 four-piece priority.'),
  importedGuideItem(30107, 'Vestments of the Sea-Witch', 'Chest', 'caster', 'Mage', 'Frost', 'https://www.wowhead.com/tbc/guide/classes/mage/frost/dps-bis-gear-pve-phase-2', 1, 'Frost chest off-piece while preserving Tier 5 four-piece.'),
  importedGuideItem(29918, 'Mindstorm Wristbands', 'Wrist', 'caster', 'Mage', 'Frost', 'https://www.wowhead.com/tbc/guide/classes/mage/frost/dps-bis-gear-pve-phase-2', 1, 'Frost wrist priority from Phase 2 guide import.'),
  importedGuideItem(30205, 'Gloves of Tirisfal', 'Hands', 'caster', 'Mage', 'Frost', 'https://www.wowhead.com/tbc/guide/classes/mage/frost/dps-bis-gear-pve-phase-2', 1, 'Frost Tier 5 four-piece priority.'),
  importedGuideItem(30038, 'Belt of Blasting', 'Waist', 'caster', 'Mage', 'Frost', 'https://www.wowhead.com/tbc/guide/classes/mage/frost/dps-bis-gear-pve-phase-2', 1, 'Frost waist priority; crafted BoE so Tailoring is not required to equip.', { craftedByProfession: 'Tailoring', bindType: 'BoE', equippableWithoutProfession: true, requiresProfession: undefined, profession: undefined }),
  importedGuideItem(30207, 'Leggings of Tirisfal', 'Legs', 'caster', 'Mage', 'Frost', 'https://www.wowhead.com/tbc/guide/classes/mage/frost/dps-bis-gear-pve-phase-2', 1, 'Frost Tier 5 four-piece priority.'),
  importedGuideItem(30067, 'Velvet Boots of the Guardian', 'Feet', 'caster', 'Mage', 'Frost', 'https://www.wowhead.com/tbc/guide/classes/mage/frost/dps-bis-gear-pve-phase-2', 1, 'Frost boot priority from the Phase 2 guide.'),
  importedGuideItem(30095, 'Fang of the Leviathan', 'Main Hand', 'caster', 'Mage', 'Frost', 'https://www.wowhead.com/tbc/guide/classes/mage/frost/dps-bis-gear-pve-phase-2', 1, 'Frost one-hand priority.'),
  importedGuideItem(30049, 'Fathomstone', 'Off Hand', 'caster', 'Mage', 'Frost', 'https://www.wowhead.com/tbc/guide/classes/mage/frost/dps-bis-gear-pve-phase-2', 1, 'Frost off-hand priority.'),
  importedGuideItem(29982, 'Wand of the Forgotten Star', 'Ranged', 'caster', 'Mage', 'Frost', 'https://www.wowhead.com/tbc/guide/classes/mage/frost/dps-bis-gear-pve-phase-2', 1, 'Frost wand priority.'),

  importedGuideItem(32494, 'Destruction Holo-Gogs', 'Head', 'caster', 'Priest', 'Shadow', 'https://www.wowhead.com/tbc/guide/classes/priest/shadow/dps-bis-gear-pve-phase-2', 1, 'Engineering Shadow helm.', { profession: 'Engineering', requiresProfession: 'Engineering', bindType: 'BoP' }),
  importedGuideItem(30163, 'Wings of the Avatar', 'Shoulder', 'caster', 'Priest', 'Shadow', 'https://www.wowhead.com/tbc/guide/classes/priest/shadow/dps-bis-gear-pve-phase-2', 1, 'Shadow two-piece Tier 5 planning.'),
  importedGuideItem(21869, 'Frozen Shadoweave Shoulders', 'Shoulder', 'caster', 'Priest', 'Shadow', 'https://www.wowhead.com/tbc/guide/classes/priest/shadow/dps-bis-gear-pve-phase-2', 1, 'Tailoring Shadow-specific co-BiS shoulder path; set synergy can beat generic caster shoulders.', { profession: 'Tailoring', requiresProfession: 'Tailoring', requiresProfessionSpecialization: 'Shadoweave Tailoring', bindType: 'BoP' }),
  importedGuideItem(30107, 'Vestments of the Sea-Witch', 'Chest', 'caster', 'Priest', 'Shadow', 'https://www.wowhead.com/tbc/guide/classes/priest/shadow/dps-bis-gear-pve-phase-2', 1, 'Shadow chest priority.'),
  importedGuideItem(30684, "Ravager's Cuffs of Shadow Wrath", 'Wrist', 'caster', 'Priest', 'Shadow', 'https://www.wowhead.com/tbc/guide/classes/priest/shadow/dps-bis-gear-pve-phase-2', 1, 'Rare random-suffix Shadow Wrath wrist BiS; source and suffix matter more than item level.'),
  importedGuideItem(31225, 'Illidari Bindings of Shadow Wrath', 'Wrist', 'caster', 'Priest', 'Shadow', 'https://www.wowhead.com/tbc/guide/classes/priest/shadow/dps-bis-gear-pve-phase-2', 1, 'BoE random-suffix Shadow Wrath wrist co-BiS/realistic alternative.'),
  importedGuideItem(29918, 'Mindstorm Wristbands', 'Wrist', 'caster', 'Priest', 'Shadow', 'https://www.wowhead.com/tbc/guide/classes/priest/shadow/dps-bis-gear-pve-phase-2', 4, 'Explicitly demoted: Wowhead warns Shadow should not prioritize Mindstorm over Shadow Wrath suffix wrists.'),
  importedGuideItem(31166, 'Nethersteel-Lined Handwraps of Shadow Wrath', 'Hands', 'caster', 'Priest', 'Shadow', 'https://www.wowhead.com/tbc/guide/classes/priest/shadow/dps-bis-gear-pve-phase-2', 1, 'Shadow Wrath random-suffix glove BiS; suffix must be audited in real imports.'),
  importedGuideItem(28507, 'Handwraps of Flowing Thought', 'Hands', 'caster', 'Priest', 'Shadow', 'https://www.wowhead.com/tbc/guide/classes/priest/shadow/dps-bis-gear-pve-phase-2', 2, 'Shadow hit-fixing glove option, not universal stat BiS.'),
  importedGuideItem(30038, 'Belt of Blasting', 'Waist', 'caster', 'Priest', 'Shadow', 'https://www.wowhead.com/tbc/guide/classes/priest/shadow/dps-bis-gear-pve-phase-2', 1, 'Purchasable crafted belt.', { craftedByProfession: 'Tailoring', bindType: 'BoE', equippableWithoutProfession: true, requiresProfession: undefined, profession: undefined }),
  importedGuideItem(29972, 'Trousers of the Astromancer', 'Legs', 'caster', 'Priest', 'Shadow', 'https://www.wowhead.com/tbc/guide/classes/priest/shadow/dps-bis-gear-pve-phase-2', 1, 'Shadow leg priority; do not force weak four-piece Tier 5.'),
  importedGuideItem(21870, 'Frozen Shadoweave Boots', 'Feet', 'caster', 'Priest', 'Shadow', 'https://www.wowhead.com/tbc/guide/classes/priest/shadow/dps-bis-gear-pve-phase-2', 1, 'Shadoweave Tailoring option.', { profession: 'Tailoring', requiresProfession: 'Tailoring', requiresProfessionSpecialization: 'Shadoweave Tailoring', bindType: 'BoP' }),
  importedGuideItem(30050, 'Boots of the Shifting Nightmare', 'Feet', 'caster', 'Priest', 'Shadow', 'https://www.wowhead.com/tbc/guide/classes/priest/shadow/dps-bis-gear-pve-phase-2', 1, 'Co-BiS Shadow feet option when Tailoring or socket context changes.'),
  importedGuideItem(30680, "Glider's Foot-Wraps of Shadow Wrath", 'Feet', 'caster', 'Priest', 'Shadow', 'https://www.wowhead.com/tbc/guide/classes/priest/shadow/dps-bis-gear-pve-phase-2', 1, 'Random-suffix Shadow Wrath feet alternative; suffix must be preserved on import.'),
  importedGuideItem(32963, "Merciless Gladiator's Gavel", 'Main Hand', 'caster', 'Priest', 'Shadow', 'https://www.wowhead.com/tbc/guide/classes/priest/shadow/dps-bis-gear-pve-phase-2', 1, 'Shadow weapon priority.', { type: 'PvP', source: 'Arena Season 2' }),
  importedGuideItem(29272, 'Orb of the Soul-Eater', 'Off Hand', 'caster', 'Priest', 'Shadow', 'https://www.wowhead.com/tbc/guide/classes/priest/shadow/dps-bis-gear-pve-phase-2', 1, 'Shadow-specific off-hand.'),
  importedGuideItem(29982, 'Wand of the Forgotten Star', 'Ranged', 'caster', 'Priest', 'Shadow', 'https://www.wowhead.com/tbc/guide/classes/priest/shadow/dps-bis-gear-pve-phase-2', 1, 'Shadow wand priority.'),

  importedGuideItem(29035, 'Cyclone Faceguard', 'Head', 'caster', 'Shaman', 'Elemental', 'https://www.wowhead.com/tbc/guide/classes/shaman/elemental/dps-bis-gear-pve-phase-2', 1, 'Retain Tier 4 two-piece for group throughput.'),
  importedGuideItem(30171, 'Cataclysm Headpiece', 'Head', 'caster', 'Shaman', 'Elemental', 'https://www.wowhead.com/tbc/guide/classes/shaman/elemental/dps-bis-gear-pve-phase-2', 1, 'Personal DPS co-BiS head option; do not hide Tier 5 when T4 two-piece context changes.'),
  importedGuideItem(29037, 'Cyclone Shoulderguards', 'Shoulder', 'caster', 'Shaman', 'Elemental', 'https://www.wowhead.com/tbc/guide/classes/shaman/elemental/dps-bis-gear-pve-phase-2', 1, 'Retain Tier 4 two-piece for group throughput.'),
  importedGuideItem(30173, 'Cataclysm Shoulderpads', 'Shoulder', 'caster', 'Shaman', 'Elemental', 'https://www.wowhead.com/tbc/guide/classes/shaman/elemental/dps-bis-gear-pve-phase-2', 1, 'Personal DPS co-BiS shoulder option; listed for tier-context planning.'),
  importedGuideItem(30169, 'Cataclysm Chestpiece', 'Chest', 'caster', 'Shaman', 'Elemental', 'https://www.wowhead.com/tbc/guide/classes/shaman/elemental/dps-bis-gear-pve-phase-2', 1, 'Elemental chest priority; Tier 5 set bonuses are weak.'),
  importedGuideItem(30107, 'Vestments of the Sea-Witch', 'Chest', 'caster', 'Shaman', 'Elemental', 'https://www.wowhead.com/tbc/guide/classes/shaman/elemental/dps-bis-gear-pve-phase-2', 1, 'Elemental chest co-BiS/offset option when set context changes.'),
  importedGuideItem(29918, 'Mindstorm Wristbands', 'Wrist', 'caster', 'Shaman', 'Elemental', 'https://www.wowhead.com/tbc/guide/classes/shaman/elemental/dps-bis-gear-pve-phase-2', 1, 'Elemental wrist priority.'),
  importedGuideItem(28780, "Soul-Eater's Handwraps", 'Hands', 'caster', 'Shaman', 'Elemental', 'https://www.wowhead.com/tbc/guide/classes/shaman/elemental/dps-bis-gear-pve-phase-2', 1, 'Elemental offset gloves.'),
  importedGuideItem(30038, 'Belt of Blasting', 'Waist', 'caster', 'Shaman', 'Elemental', 'https://www.wowhead.com/tbc/guide/classes/shaman/elemental/dps-bis-gear-pve-phase-2', 1, 'Purchasable crafted belt.', { craftedByProfession: 'Tailoring', bindType: 'BoE', equippableWithoutProfession: true, requiresProfession: undefined, profession: undefined }),
  importedGuideItem(30172, 'Cataclysm Leggings', 'Legs', 'caster', 'Shaman', 'Elemental', 'https://www.wowhead.com/tbc/guide/classes/shaman/elemental/dps-bis-gear-pve-phase-2', 1, 'Elemental leg priority.'),
  importedGuideItem(24262, 'Spellstrike Pants', 'Legs', 'caster', 'Shaman', 'Elemental', 'https://www.wowhead.com/tbc/guide/classes/shaman/elemental/dps-bis-gear-pve-phase-2', 1, 'Spellstrike remains a guide-relevant leg option for hit and set planning.', { craftedByProfession: 'Tailoring', bindType: 'BoE', equippableWithoutProfession: true, requiresProfession: undefined, profession: undefined }),
  importedGuideItem(30067, 'Velvet Boots of the Guardian', 'Feet', 'caster', 'Shaman', 'Elemental', 'https://www.wowhead.com/tbc/guide/classes/shaman/elemental/dps-bis-gear-pve-phase-2', 1, 'Elemental boot priority.'),
  importedGuideItem(29988, 'The Nexus Key', 'Main Hand', 'caster', 'Shaman', 'Elemental', 'https://www.wowhead.com/tbc/guide/classes/shaman/elemental/dps-bis-gear-pve-phase-2', 1, 'Two-handed Elemental option; off-hand must be empty.', { twoHanded: true }),
  importedGuideItem(30049, 'Fathomstone', 'Off Hand', 'caster', 'Shaman', 'Elemental', 'https://www.wowhead.com/tbc/guide/classes/shaman/elemental/dps-bis-gear-pve-phase-2', 2, 'One-hand Elemental alternative off-hand.'),
  importedGuideItem(28248, 'Totem of the Void', 'Ranged', 'caster', 'Shaman', 'Elemental', 'https://www.wowhead.com/tbc/guide/classes/shaman/elemental/dps-bis-gear-pve-phase-2', 1, 'Elemental ranged slot must remain a Totem.'),

  ...(['Affliction', 'Demonology', 'Destruction'] as const).flatMap((warlockSpec) => {
    const guideUrl = `https://www.wowhead.com/tbc/guide/classes/warlock/${warlockSpec.toLowerCase()}/dps-bis-gear-pve-phase-2`
    return [
      importedGuideItem(32494, 'Destruction Holo-Gogs', 'Head', 'caster', 'Warlock', warlockSpec, guideUrl, 1, 'Engineering Warlock helm.', { profession: 'Engineering', requiresProfession: 'Engineering', bindType: 'BoP' }),
      importedGuideItem(30212, 'Hood of the Corruptor', 'Head', 'caster', 'Warlock', warlockSpec, guideUrl, 1, 'Tier head co-BiS/2-piece set enabler beside Engineering goggles.'),
      importedGuideItem(28967, 'Voidheart Mantle', 'Shoulder', 'caster', 'Warlock', warlockSpec, guideUrl, 1, 'Retain Voidheart two-piece instead of forcing weak four-piece Tier 5.'),
      importedGuideItem(30107, 'Vestments of the Sea-Witch', 'Chest', 'caster', 'Warlock', warlockSpec, guideUrl, 1, 'Warlock chest priority.'),
      importedGuideItem(29918, 'Mindstorm Wristbands', 'Wrist', 'caster', 'Warlock', warlockSpec, guideUrl, 1, 'Reliable Warlock wrist priority.'),
      importedGuideItem(28968, 'Voidheart Gloves', 'Hands', 'caster', 'Warlock', warlockSpec, guideUrl, 1, 'Retain Voidheart two-piece.'),
      importedGuideItem(30725, 'Anger-Spark Gloves', 'Hands', 'caster', 'Warlock', warlockSpec, guideUrl, 1, 'Raw-stat glove co-BiS; Voidheart remains listed for 2-piece set planning.'),
      ...(warlockSpec === 'Destruction'
        ? [importedGuideItem(21847, 'Spellfire Gloves', 'Hands', 'caster', 'Warlock', warlockSpec, guideUrl, 1, 'Fire Destruction tailoring path; spec-dependent crafted set value.', { profession: 'Tailoring', requiresProfession: 'Tailoring', requiresProfessionSpecialization: 'Spellfire Tailoring', bindType: 'BoP' })]
        : []),
      importedGuideItem(30038, 'Belt of Blasting', 'Waist', 'caster', 'Warlock', warlockSpec, guideUrl, 1, 'Purchasable crafted belt.', { craftedByProfession: 'Tailoring', bindType: 'BoE', equippableWithoutProfession: true, requiresProfession: undefined, profession: undefined }),
      importedGuideItem(30213, 'Leggings of the Corruptor', 'Legs', 'caster', 'Warlock', warlockSpec, guideUrl, 1, 'Tier 5 legs are used without forcing the weak four-piece bonus.'),
      importedGuideItem(30734, 'Leggings of the Seventh Circle', 'Legs', 'caster', 'Warlock', warlockSpec, guideUrl, 1, 'World-boss caster leg co-BiS beside Corruptor and Spellstrike options.'),
      importedGuideItem(24262, 'Spellstrike Pants', 'Legs', 'caster', 'Warlock', warlockSpec, guideUrl, 1, 'Spellstrike leg co-BiS when hit/set context supports it.', { craftedByProfession: 'Tailoring', bindType: 'BoE', equippableWithoutProfession: true, requiresProfession: undefined, profession: undefined }),
      importedGuideItem(warlockSpec === 'Demonology' ? 30050 : 30037, warlockSpec === 'Demonology' ? 'Boots of the Shifting Nightmare' : 'Boots of Blasting', 'Feet', 'caster', 'Warlock', warlockSpec, guideUrl, 1, warlockSpec === 'Demonology' ? 'Demonology has strong non-Tailoring boot options.' : 'Tailoring-locked exact BiS boots.', warlockSpec === 'Demonology' ? {} : { profession: 'Tailoring', requiresProfession: 'Tailoring', bindType: 'BoP' }),
      importedGuideItem(30095, 'Fang of the Leviathan', 'Main Hand', 'caster', 'Warlock', warlockSpec, guideUrl, 1, 'SSC caster weapon co-BiS; keep beside PvP spellblade instead of flattening source disagreement.'),
      importedGuideItem(32053, "Merciless Gladiator's Spellblade", 'Main Hand', 'caster', 'Warlock', warlockSpec, guideUrl, 1, 'Warlock one-hand priority.', { type: 'PvP', source: 'Arena Season 2' }),
      ...(warlockSpec === 'Demonology'
        ? [
            importedGuideItem(29272, 'Orb of the Soul-Eater', 'Off Hand', 'caster', 'Warlock', warlockSpec, guideUrl, 1, 'Demonology off-hand co-BiS; Shadow-focused option.'),
            importedGuideItem(30049, 'Fathomstone', 'Off Hand', 'caster', 'Warlock', warlockSpec, guideUrl, 1, 'Demonology off-hand co-BiS; raid drop option.'),
          ]
        : [
            importedGuideItem(30049, 'Fathomstone', 'Off Hand', 'caster', 'Warlock', warlockSpec, guideUrl, 1, 'Spec-specific Warlock off-hand priority.'),
          ]),
      ...(warlockSpec === 'Destruction'
        ? [importedGuideItem(29270, 'Flametongue Seal', 'Off Hand', 'caster', 'Warlock', warlockSpec, guideUrl, 1, 'Fire Destruction off-hand alternative; source disagreement should remain visible.')]
        : []),
      importedGuideItem(29982, 'Wand of the Forgotten Star', 'Ranged', 'caster', 'Warlock', warlockSpec, guideUrl, 1, 'Warlock wand priority.'),
    ]
  }),

  importedGuideItem(30228, 'Nordrassil Headdress', 'Head', 'tank', 'Druid', 'Feral Bear', 'https://www.wowhead.com/tbc/guide/classes/druid/feral/tank-bis-gear-pve-phase-2', 1, 'Default mitigation-oriented Bear head.'),
  importedGuideItem(30230, 'Nordrassil Feral-Mantle', 'Shoulder', 'tank', 'Druid', 'Feral Bear', 'https://www.wowhead.com/tbc/guide/classes/druid/feral/tank-bis-gear-pve-phase-2', 1, 'Bear Tier 5 set configuration.'),
  importedGuideItem(30222, 'Nordrassil Chestplate', 'Chest', 'tank', 'Druid', 'Feral Bear', 'https://www.wowhead.com/tbc/guide/classes/druid/feral/tank-bis-gear-pve-phase-2', 1, 'Mitigation chest; Bloodsea Brigand is a threat alternative.'),
  importedGuideItem(32810, "Veteran's Dragonhide Bracers", 'Wrist', 'tank', 'Druid', 'Feral Bear', 'https://www.wowhead.com/tbc/guide/classes/druid/feral/tank-bis-gear-pve-phase-2', 1, 'Bear Phase 2 wrist priority.'),
  importedGuideItem(30223, 'Nordrassil Handgrips', 'Hands', 'tank', 'Druid', 'Feral Bear', 'https://www.wowhead.com/tbc/guide/classes/druid/feral/tank-bis-gear-pve-phase-2', 1, 'Mitigation gloves; Searing Grip is a threat alternative.'),
  importedGuideItem(30106, 'Belt of One-Hundred Deaths', 'Waist', 'tank', 'Druid', 'Feral Bear', 'https://www.wowhead.com/tbc/guide/classes/druid/feral/tank-bis-gear-pve-phase-2', 1, 'Default non-profession Bear waist with strong threat value.'),
  importedGuideItem(30042, 'Belt of Natural Power', 'Waist', 'tank', 'Druid', 'Feral Bear', 'https://www.wowhead.com/tbc/guide/classes/druid/feral/tank-bis-gear-pve-phase-2', 2, 'Leatherworking alternative.', { profession: 'Leatherworking', requiresProfession: 'Leatherworking', bindType: 'BoP' }),
  importedGuideItem(30229, 'Nordrassil Feral-Kilt', 'Legs', 'tank', 'Druid', 'Feral Bear', 'https://www.wowhead.com/tbc/guide/classes/druid/feral/tank-bis-gear-pve-phase-2', 1, 'Bear mitigation legs.'),
  importedGuideItem(30041, 'Boots of Natural Grace', 'Feet', 'tank', 'Druid', 'Feral Bear', 'https://www.wowhead.com/tbc/guide/classes/druid/feral/tank-bis-gear-pve-phase-2', 1, 'Leatherworking-locked Bear boots.', { profession: 'Leatherworking', requiresProfession: 'Leatherworking', bindType: 'BoP' }),
  importedGuideItem(30021, 'Wildfury Greatstaff', 'Main Hand', 'tank', 'Druid', 'Feral Bear', 'https://www.wowhead.com/tbc/guide/classes/druid/feral/tank-bis-gear-pve-phase-2', 1, 'Mitigation weapon; weapon DPS is irrelevant in Bear Form.', { twoHanded: true }),
  importedGuideItem(32658, 'Badge of Tenacity', 'Trinket', 'tank', 'Druid', 'Feral Bear', 'https://www.wowhead.com/tbc/guide/classes/druid/feral/tank-bis-gear-pve-phase-2', 1, 'Bear trinket correction: armor/agility active value, unlike block-value trinkets.'),
  importedGuideItem(28579, "Romulo's Poison Vial", 'Trinket', 'tank', 'Druid', 'Feral Bear', 'https://www.wowhead.com/tbc/guide/classes/druid/feral/tank-bis-gear-pve-phase-2', 1, 'Bear threat trinket option; keep beside Badge of Tenacity and Dragonspine Trophy.'),
  importedGuideItem(23198, 'Idol of Brutality', 'Ranged', 'tank', 'Druid', 'Feral Bear', 'https://www.wowhead.com/tbc/guide/classes/druid/feral/tank-bis-gear-pve-phase-2', 1, 'Personal threat idol; Raven Goddess is a raid-DPS alternative.'),

  importedGuideItem(32479, 'Wonderheal XT40 Shades', 'Head', 'healer', 'Druid', 'Restoration', 'https://www.wowhead.com/tbc/guide/classes/druid/healer-bis-gear-pve-phase-2', 1, 'Engineering healer goggles co-BiS; profession ownership must be explicit.', { profession: 'Engineering', requiresProfession: 'Engineering', bindType: 'BoP' }),
  importedGuideItem(30219, 'Nordrassil Headguard', 'Head', 'healer', 'Druid', 'Restoration', 'https://www.wowhead.com/tbc/guide/classes/druid/healer-bis-gear-pve-phase-2', 1, 'Restoration head priority.'),
  importedGuideItem(30221, 'Nordrassil Life-Mantle', 'Shoulder', 'healer', 'Druid', 'Restoration', 'https://www.wowhead.com/tbc/guide/classes/druid/healer-bis-gear-pve-phase-2', 1, 'Restoration shoulder priority.'),
  importedGuideItem(30216, 'Nordrassil Chestguard', 'Chest', 'healer', 'Druid', 'Restoration', 'https://www.wowhead.com/tbc/guide/classes/druid/healer-bis-gear-pve-phase-2', 1, 'Restoration chest priority without blindly forcing four-piece.'),
  importedGuideItem(30062, 'Grove-Bands of Remulos', 'Wrist', 'healer', 'Druid', 'Restoration', 'https://www.wowhead.com/tbc/guide/classes/druid/healer-bis-gear-pve-phase-2', 1, 'Restoration wrist priority.'),
  importedGuideItem(28521, 'Mitts of the Treemender', 'Hands', 'healer', 'Druid', 'Restoration', 'https://www.wowhead.com/tbc/guide/classes/druid/healer-bis-gear-pve-phase-2', 1, 'Restoration throughput gloves.'),
  importedGuideItem(30036, 'Belt of the Long Road', 'Waist', 'healer', 'Druid', 'Restoration', 'https://www.wowhead.com/tbc/guide/classes/druid/healer-bis-gear-pve-phase-2', 1, 'Crafted BoE healer belt; Tailoring is not required.', { craftedByProfession: 'Tailoring', bindType: 'BoE', equippableWithoutProfession: true }),
  importedGuideItem(21873, 'Primal Mooncloth Belt', 'Waist', 'healer', 'Druid', 'Restoration', 'https://www.wowhead.com/tbc/guide/classes/druid/healer-bis-gear-pve-phase-2', 1, 'Tailoring healer belt path; maintain as profession-dependent alternative.', { profession: 'Tailoring', requiresProfession: 'Tailoring', requiresProfessionSpecialization: 'Mooncloth Tailoring', bindType: 'BoP' }),
  importedGuideItem(30727, 'Gilded Trousers of Benediction', 'Legs', 'healer', 'Druid', 'Restoration', 'https://www.wowhead.com/tbc/guide/classes/druid/healer-bis-gear-pve-phase-2', 1, 'Restoration throughput legs.'),
  importedGuideItem(30092, 'Orca-Hide Boots', 'Feet', 'healer', 'Druid', 'Restoration', 'https://www.wowhead.com/tbc/guide/classes/druid/healer-bis-gear-pve-phase-2', 1, 'Resto Druid boot co-BiS/alternative from Leotheras; keep visible for spirit/socket planning.'),
  importedGuideItem(30737, 'Gold-Leaf Wildboots', 'Feet', 'healer', 'Druid', 'Restoration', 'https://www.wowhead.com/tbc/guide/classes/druid/healer-bis-gear-pve-phase-2', 1, 'Restoration boot priority.'),
  importedGuideItem(30108, 'Lightfathom Scepter', 'Main Hand', 'healer', 'Druid', 'Restoration', 'https://www.wowhead.com/tbc/guide/classes/druid/healer-bis-gear-pve-phase-2', 1, 'Restoration main-hand priority.'),
  importedGuideItem(29274, 'Tears of Heaven', 'Off Hand', 'healer', 'Druid', 'Restoration', 'https://www.wowhead.com/tbc/guide/classes/druid/healer-bis-gear-pve-phase-2', 1, 'Raw-throughput off-hand; Windcaller is balanced regen.'),
  importedGuideItem(27886, 'Idol of the Emerald Queen', 'Ranged', 'healer', 'Druid', 'Restoration', 'https://www.wowhead.com/tbc/guide/classes/druid/healer-bis-gear-pve-phase-2', 1, 'Restoration ranged slot must remain an Idol.'),

  importedGuideItem(30136, 'Crystalforge Greathelm', 'Head', 'healer', 'Paladin', 'Holy', 'https://www.wowhead.com/tbc/guide/classes/paladin/holy/healer-bis-gear-pve-phase-2', 1, 'Holy Paladin Tier 5 head.'),
  importedGuideItem(30138, 'Crystalforge Pauldrons', 'Shoulder', 'healer', 'Paladin', 'Holy', 'https://www.wowhead.com/tbc/guide/classes/paladin/holy/healer-bis-gear-pve-phase-2', 1, 'Holy Paladin Tier 5 shoulder.'),
  importedGuideItem(30134, 'Crystalforge Chestpiece', 'Chest', 'healer', 'Paladin', 'Holy', 'https://www.wowhead.com/tbc/guide/classes/paladin/holy/healer-bis-gear-pve-phase-2', 1, 'Holy Paladin uses selected Tier 5 pieces without forcing four-piece.'),
  importedGuideItem(30047, 'Blackfathom Warbands', 'Wrist', 'healer', 'Paladin', 'Holy', 'https://www.wowhead.com/tbc/guide/classes/paladin/holy/healer-bis-gear-pve-phase-2', 1, 'Holy Paladin wrist priority.'),
  importedGuideItem(30112, 'Glorious Gauntlets of Crestfall', 'Hands', 'healer', 'Paladin', 'Holy', 'https://www.wowhead.com/tbc/guide/classes/paladin/holy/healer-bis-gear-pve-phase-2', 1, 'Holy Paladin glove priority.'),
  importedGuideItem(30030, 'Girdle of Fallen Stars', 'Waist', 'healer', 'Paladin', 'Holy', 'https://www.wowhead.com/tbc/guide/classes/paladin/holy/healer-bis-gear-pve-phase-2', 1, 'Holy Paladin waist priority.'),
  importedGuideItem(29991, 'Sunhawk Leggings', 'Legs', 'healer', 'Paladin', 'Holy', 'https://www.wowhead.com/tbc/guide/classes/paladin/holy/healer-bis-gear-pve-phase-2', 1, 'Holy Paladin leg priority.'),
  importedGuideItem(30027, 'Boots of Courage Unending', 'Feet', 'healer', 'Paladin', 'Holy', 'https://www.wowhead.com/tbc/guide/classes/paladin/holy/healer-bis-gear-pve-phase-2', 1, 'Holy Paladin boot priority.'),
  importedGuideItem(30108, 'Lightfathom Scepter', 'Main Hand', 'healer', 'Paladin', 'Holy', 'https://www.wowhead.com/tbc/guide/classes/paladin/holy/healer-bis-gear-pve-phase-2', 1, 'Holy Paladin main-hand priority.'),
  importedGuideItem(29923, 'Talisman of the Sun King', 'Off Hand', 'healer', 'Paladin', 'Holy', 'https://www.wowhead.com/tbc/guide/classes/paladin/holy/healer-bis-gear-pve-phase-2', 1, 'Throughput off-hand preferred over shield when survivability is adequate.'),
  importedGuideItem(29458, 'Aegis of the Vindicator', 'Off Hand', 'healer', 'Paladin', 'Holy', 'https://www.wowhead.com/tbc/guide/classes/paladin/holy/healer-bis-gear-pve-phase-2', 1, 'Holy Paladin healing shield alternative; keep survivability/source disagreement visible.'),
  importedGuideItem(28592, 'Libram of Souls Redeemed', 'Ranged', 'healer', 'Paladin', 'Holy', 'https://www.wowhead.com/tbc/guide/classes/paladin/holy/healer-bis-gear-pve-phase-2', 1, 'Holy Paladin ranged slot must remain a Libram.'),

  importedGuideItem(30125, 'Crystalforge Faceguard', 'Head', 'tank', 'Paladin', 'Protection', 'https://www.wowhead.com/tbc/guide/classes/paladin/tank-bis-gear-pve-phase-2', 1, 'Protection Paladin balanced head.'),
  importedGuideItem(29070, 'Justicar Shoulderguards', 'Shoulder', 'tank', 'Paladin', 'Protection', 'https://www.wowhead.com/tbc/guide/classes/paladin/tank-bis-gear-pve-phase-2', 1, 'Retain Tier 4 two-piece for Seal threat.'),
  importedGuideItem(29066, 'Justicar Chestguard', 'Chest', 'tank', 'Paladin', 'Protection', 'https://www.wowhead.com/tbc/guide/classes/paladin/tank-bis-gear-pve-phase-2', 1, 'Retain Tier 4 two-piece for Seal threat.'),
  importedGuideItem(32515, 'Wristguards of Determination', 'Wrist', 'tank', 'Paladin', 'Protection', 'https://www.wowhead.com/tbc/guide/classes/paladin/tank-bis-gear-pve-phase-2', 1, 'Survivability wrist; Bracers of Dignity are a threat alternative.'),
  importedGuideItem(29998, 'Royal Gauntlets of Silvermoon', 'Hands', 'tank', 'Paladin', 'Protection', 'https://www.wowhead.com/tbc/guide/classes/paladin/tank-bis-gear-pve-phase-2', 1, 'Protection survivability gloves.'),
  importedGuideItem(30124, 'Crystalforge Handguards', 'Hands', 'tank', 'Paladin', 'Protection', 'https://www.wowhead.com/tbc/guide/classes/paladin/tank-bis-gear-pve-phase-2', 1, 'Protection Paladin tier/set-context glove option.'),
  importedGuideItem(30034, 'Belt of the Guardian', 'Waist', 'tank', 'Paladin', 'Protection', 'https://www.wowhead.com/tbc/guide/classes/paladin/tank-bis-gear-pve-phase-2', 1, 'Crafted BoE tank belt; Blacksmithing is not required.', { craftedByProfession: 'Blacksmithing', bindType: 'BoE', equippableWithoutProfession: true }),
  importedGuideItem(30096, 'Girdle of the Invulnerable', 'Waist', 'tank', 'Paladin', 'Protection', 'https://www.wowhead.com/tbc/guide/classes/paladin/tank-bis-gear-pve-phase-2', 1, 'Protection Paladin mitigation waist alternative.'),
  importedGuideItem(30126, 'Crystalforge Legguards', 'Legs', 'tank', 'Paladin', 'Protection', 'https://www.wowhead.com/tbc/guide/classes/paladin/tank-bis-gear-pve-phase-2', 1, 'Balanced threat and survival legs.'),
  importedGuideItem(30033, 'Boots of the Protector', 'Feet', 'tank', 'Paladin', 'Protection', 'https://www.wowhead.com/tbc/guide/classes/paladin/tank-bis-gear-pve-phase-2', 1, 'Blacksmithing-locked spell-power tank boots.', { profession: 'Blacksmithing', requiresProfession: 'Blacksmithing', bindType: 'BoP' }),
  importedGuideItem(32963, "Merciless Gladiator's Gavel", 'Main Hand', 'tank', 'Paladin', 'Protection', 'https://www.wowhead.com/tbc/guide/classes/paladin/tank-bis-gear-pve-phase-2', 1, 'Protection spell-power weapon.', { type: 'PvP', source: 'Arena Season 2' }),
  importedGuideItem(28825, 'Aldori Legacy Defender', 'Off Hand', 'tank', 'Paladin', 'Protection', 'https://www.wowhead.com/tbc/guide/classes/paladin/tank-bis-gear-pve-phase-2', 1, 'Protection survival shield.'),
  importedGuideItem(29388, 'Libram of Repentance', 'Ranged', 'tank', 'Paladin', 'Protection', 'https://www.wowhead.com/tbc/guide/classes/paladin/tank-bis-gear-pve-phase-2', 1, 'Protection ranged slot must remain a Libram.'),

  ...(['Discipline', 'Holy'] as const).flatMap((priestSpec) => {
    const guideUrl = 'https://www.wowhead.com/tbc/guide/classes/priest/healer-bis-gear-pve-phase-2'
    return [
      importedGuideItem(30152, 'Cowl of the Avatar', 'Head', 'healer', 'Priest', priestSpec, guideUrl, 1, 'Shared Priest healing guide head.'),
      importedGuideItem(30154, 'Mantle of the Avatar', 'Shoulder', 'healer', 'Priest', priestSpec, guideUrl, 1, 'Do not break Primal Mooncloth until the Avatar transition is ready.'),
      importedGuideItem(30150, 'Vestments of the Avatar', 'Chest', 'healer', 'Priest', priestSpec, guideUrl, 1, 'Shared Priest healing guide chest.'),
      importedGuideItem(32980, "Veteran's Mooncloth Cuffs", 'Wrist', 'healer', 'Priest', priestSpec, guideUrl, 1, 'Throughput wrist; Wraps of Purification are regen-oriented.'),
      importedGuideItem(30151, 'Gloves of the Avatar', 'Hands', 'healer', 'Priest', priestSpec, guideUrl, 1, 'Avatar transition gloves.'),
      importedGuideItem(30036, 'Belt of the Long Road', 'Waist', 'healer', 'Priest', priestSpec, guideUrl, 1, 'Crafted BoE belt.', { craftedByProfession: 'Tailoring', bindType: 'BoE', equippableWithoutProfession: true }),
      importedGuideItem(30153, 'Breeches of the Avatar', 'Legs', 'healer', 'Priest', priestSpec, guideUrl, 1, 'Avatar transition legs.'),
      importedGuideItem(30100, 'Soul-Strider Boots', 'Feet', 'healer', 'Priest', priestSpec, guideUrl, 1, 'Priest healing boot priority.'),
      importedGuideItem(30108, 'Lightfathom Scepter', 'Main Hand', 'healer', 'Priest', priestSpec, guideUrl, 1, 'Priest healing main-hand priority.'),
      importedGuideItem(29923, 'Talisman of the Sun King', 'Off Hand', 'healer', 'Priest', priestSpec, guideUrl, 1, 'Throughput off-hand.'),
      importedGuideItem(30080, 'Luminescent Rod of the Naaru', 'Ranged', 'healer', 'Priest', priestSpec, guideUrl, 1, 'Priest healing wand priority.'),
    ]
  }),

  importedGuideItem(30166, 'Cataclysm Headguard', 'Head', 'healer', 'Shaman', 'Restoration', 'https://www.wowhead.com/tbc/guide/classes/shaman/healer-bis-gear-pve-phase-2', 1, 'Restoration Shaman head priority.'),
  importedGuideItem(30168, 'Cataclysm Shoulderguards', 'Shoulder', 'healer', 'Shaman', 'Restoration', 'https://www.wowhead.com/tbc/guide/classes/shaman/healer-bis-gear-pve-phase-2', 1, 'Restoration Shaman shoulder priority; full Tier 5 is not forced.'),
  importedGuideItem(30164, 'Cataclysm Chestguard', 'Chest', 'healer', 'Shaman', 'Restoration', 'https://www.wowhead.com/tbc/guide/classes/shaman/healer-bis-gear-pve-phase-2', 1, 'Restoration chest priority.'),
  importedGuideItem(30047, 'Blackfathom Warbands', 'Wrist', 'healer', 'Shaman', 'Restoration', 'https://www.wowhead.com/tbc/guide/classes/shaman/healer-bis-gear-pve-phase-2', 1, 'Restoration wrist priority.'),
  importedGuideItem(29976, 'Worldstorm Gauntlets', 'Hands', 'healer', 'Shaman', 'Restoration', 'https://www.wowhead.com/tbc/guide/classes/shaman/healer-bis-gear-pve-phase-2', 1, 'Restoration glove priority.'),
  importedGuideItem(30030, 'Girdle of Fallen Stars', 'Waist', 'healer', 'Shaman', 'Restoration', 'https://www.wowhead.com/tbc/guide/classes/shaman/healer-bis-gear-pve-phase-2', 1, 'Restoration waist priority.'),
  importedGuideItem(29991, 'Sunhawk Leggings', 'Legs', 'healer', 'Shaman', 'Restoration', 'https://www.wowhead.com/tbc/guide/classes/shaman/healer-bis-gear-pve-phase-2', 1, 'Restoration leg priority.'),
  importedGuideItem(30737, 'Gold-Leaf Wildboots', 'Feet', 'healer', 'Shaman', 'Restoration', 'https://www.wowhead.com/tbc/guide/classes/shaman/healer-bis-gear-pve-phase-2', 1, 'Restoration boot priority.'),
  importedGuideItem(30108, 'Lightfathom Scepter', 'Main Hand', 'healer', 'Shaman', 'Restoration', 'https://www.wowhead.com/tbc/guide/classes/shaman/healer-bis-gear-pve-phase-2', 1, 'Restoration main-hand priority.'),
  importedGuideItem(29274, 'Tears of Heaven', 'Off Hand', 'healer', 'Shaman', 'Restoration', 'https://www.wowhead.com/tbc/guide/classes/shaman/healer-bis-gear-pve-phase-2', 1, 'Throughput off-hand; shield alternatives provide armor.'),
  importedGuideItem(28523, 'Totem of Healing Rains', 'Ranged', 'healer', 'Shaman', 'Restoration', 'https://www.wowhead.com/tbc/guide/classes/shaman/healer-bis-gear-pve-phase-2', 1, 'Restoration ranged slot must remain a Totem.'),

  importedGuideItem(30115, 'Destroyer Greathelm', 'Head', 'tank', 'Warrior', 'Protection', 'https://www.wowhead.com/tbc/guide/classes/warrior/protection/tank-bis-gear-pve-phase-2', 1, 'Protection Warrior balanced helm.'),
  importedGuideItem(30117, 'Destroyer Shoulderguards', 'Shoulder', 'tank', 'Warrior', 'Protection', 'https://www.wowhead.com/tbc/guide/classes/warrior/protection/tank-bis-gear-pve-phase-2', 1, 'Protection Warrior tier shoulder.'),
  importedGuideItem(30113, 'Destroyer Chestguard', 'Chest', 'tank', 'Warrior', 'Protection', 'https://www.wowhead.com/tbc/guide/classes/warrior/protection/tank-bis-gear-pve-phase-2', 1, 'Protection Warrior tier chest.'),
  importedGuideItem(32818, "Veteran's Plate Bracers", 'Wrist', 'tank', 'Warrior', 'Protection', 'https://www.wowhead.com/tbc/guide/classes/warrior/protection/tank-bis-gear-pve-phase-2', 1, 'Protection Warrior wrist priority.'),
  importedGuideItem(29998, 'Royal Gauntlets of Silvermoon', 'Hands', 'tank', 'Warrior', 'Protection', 'https://www.wowhead.com/tbc/guide/classes/warrior/protection/tank-bis-gear-pve-phase-2', 1, 'Mitigation gloves; Searing Grip is a threat alternative.'),
  importedGuideItem(29947, 'Gloves of the Searing Grip', 'Hands', 'tank', 'Warrior', 'Protection', 'https://www.wowhead.com/tbc/guide/classes/warrior/protection/tank-bis-gear-pve-phase-2', 1, 'Protection Warrior threat glove option; do not hide behind mitigation-only rankings.'),
  importedGuideItem(30096, 'Girdle of the Invulnerable', 'Waist', 'tank', 'Warrior', 'Protection', 'https://www.wowhead.com/tbc/guide/classes/warrior/protection/tank-bis-gear-pve-phase-2', 1, 'Mitigation waist; One-Hundred Deaths is threat-oriented.'),
  importedGuideItem(30106, 'Belt of One-Hundred Deaths', 'Waist', 'tank', 'Warrior', 'Protection', 'https://www.wowhead.com/tbc/guide/classes/warrior/protection/tank-bis-gear-pve-phase-2', 1, 'Protection Warrior threat waist option beside Girdle of the Invulnerable.'),
  importedGuideItem(30116, 'Destroyer Legguards', 'Legs', 'tank', 'Warrior', 'Protection', 'https://www.wowhead.com/tbc/guide/classes/warrior/protection/tank-bis-gear-pve-phase-2', 1, 'Protection Warrior balanced legs.'),
  importedGuideItem(32793, "Veteran's Plate Greaves", 'Feet', 'tank', 'Warrior', 'Protection', 'https://www.wowhead.com/tbc/guide/classes/warrior/protection/tank-bis-gear-pve-phase-2', 1, 'Protection Warrior boot priority.'),
  importedGuideItem(28439, 'Dragonstrike', 'Main Hand', 'tank', 'Warrior', 'Protection', 'https://www.wowhead.com/tbc/guide/classes/warrior/protection/tank-bis-gear-pve-phase-2', 1, 'Threat weapon requiring Master Hammersmithing.', { profession: 'Blacksmithing', requiresProfession: 'Blacksmithing', requiresProfessionSpecialization: 'Master Hammersmith', bindType: 'BoP' }),
  importedGuideItem(30058, 'Mallet of the Tides', 'Main Hand', 'tank', 'Warrior', 'Protection', 'https://www.wowhead.com/tbc/guide/classes/warrior/protection/tank-bis-gear-pve-phase-2', 1, 'Fast non-profession Protection Warrior weapon option; preserve beside Dragonstrike threat path.'),
  importedGuideItem(28825, 'Aldori Legacy Defender', 'Off Hand', 'tank', 'Warrior', 'Protection', 'https://www.wowhead.com/tbc/guide/classes/warrior/protection/tank-bis-gear-pve-phase-2', 1, 'Protection Warrior shield priority.'),
  importedGuideItem(32756, 'Gyro-Balanced Khorium Destroyer', 'Ranged', 'tank', 'Warrior', 'Protection', 'https://www.wowhead.com/tbc/guide/classes/warrior/protection/tank-bis-gear-pve-phase-2', 1, 'Crafted BoE mitigation gun; Engineering is not required.', { craftedByProfession: 'Engineering', bindType: 'BoE', equippableWithoutProfession: true }),
]

const sourceItems: ItemDefinition[] = [...baseItems, ...importedPhase2Items]

type ExplicitSpecSlotRankingInput =
  Omit<SpecSlotRanking, 'guideProvider' | 'mentionProvider' | 'sourceAgreement' | 'confidence' | 'notes'> &
  Partial<Pick<SpecSlotRanking, 'guideProvider' | 'mentionProvider' | 'sourceAgreement' | 'confidence' | 'notes'>>

function explicitRanking(ranking: ExplicitSpecSlotRankingInput): SpecSlotRanking {
  return {
    guideProvider: 'Wowhead',
    mentionProvider: 'Wowhead',
    sourceAgreement: 'Wowhead-only',
    confidence: 'guide',
    ...ranking,
    notes: ranking.notes ?? ranking.setBonusContext ?? ranking.raceNotes ?? 'Explicit guide-sourced ranking row.',
  }
}

const explicitSpecSlotRankings: SpecSlotRanking[] = [
  explicitRanking({
    itemId: 30190,
    class: 'Shaman',
    spec: 'Enhancement',
    phase: 2,
    slot: 'Head',
    rank: 1,
    label: 'BiS',
    sourceUrl: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL,
    guideProvider: 'Wowhead + wowtbc.gg',
    sourceAgreement: 'wowtbc-cross-check',
    setBonusContext: 'Tier 5 package context: Improved Flurry set value keeps this helm ahead of higher isolated-stat options.',
  }),
  explicitRanking({
    itemId: 30190,
    class: 'Shaman',
    spec: 'Enhancement',
    phase: 2,
    slot: 'Head',
    rank: 1,
    label: 'BiS',
    sourceUrl: WOWTBC_ENHANCEMENT_SHAMAN_T5_URL,
    guideProvider: 'Wowhead + wowtbc.gg',
    mentionProvider: 'wowtbc.gg',
    sourceAgreement: 'wowtbc-cross-check',
    setBonusContext: 'Cross-check context: this helm is retained as a Tier 5 package item.',
  }),
  explicitRanking({
    itemId: 30091,
    class: 'Shaman',
    spec: 'Enhancement',
    phase: 2,
    slot: 'Wrist',
    rank: 1,
    label: 'BiS',
    sourceUrl: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL,
    guideProvider: 'Wowhead + wowtbc.gg',
    sourceAgreement: 'wowtbc-cross-check',
    notes: 'Explicit wrist ranking so True-Aim Stalker Bands is not dependent on raw AP or shared hunter/melee logic.',
  }),
  explicitRanking({
    itemId: 30091,
    class: 'Shaman',
    spec: 'Enhancement',
    phase: 2,
    slot: 'Wrist',
    rank: 1,
    label: 'BiS',
    sourceUrl: WOWTBC_ENHANCEMENT_SHAMAN_T5_URL,
    guideProvider: 'Wowhead + wowtbc.gg',
    mentionProvider: 'wowtbc.gg',
    sourceAgreement: 'wowtbc-cross-check',
    notes: 'Cross-check row preserving the wowtbc.gg agreement separately from the Wowhead guide row.',
  }),
  explicitRanking({
    itemId: 30185,
    class: 'Shaman',
    spec: 'Enhancement',
    phase: 2,
    slot: 'Chest',
    rank: 1,
    label: 'BiS',
    sourceUrl: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL,
    setBonusContext: 'Cataclysm 4-piece chase: chest is one of the preferred Tier 5 set-bonus slots.',
  }),
  explicitRanking({
    itemId: 30189,
    class: 'Shaman',
    spec: 'Enhancement',
    phase: 2,
    slot: 'Hands',
    rank: 1,
    label: 'BiS',
    sourceUrl: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL,
    setBonusContext: 'Cataclysm 4-piece chase: gloves are part of the preferred Improved Flurry package.',
  }),
  explicitRanking({
    itemId: 30192,
    class: 'Shaman',
    spec: 'Enhancement',
    phase: 2,
    slot: 'Legs',
    rank: 1,
    label: 'BiS',
    sourceUrl: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL,
    setBonusContext: 'Cataclysm 4-piece chase: legs remain ranked for set-bonus value, not isolated stats.',
  }),
  explicitRanking({
    itemId: 27815,
    class: 'Shaman',
    spec: 'Enhancement',
    phase: 2,
    slot: 'Ranged',
    rank: 1,
    label: 'BiS',
    sourceUrl: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL,
    guideProvider: 'Wowhead + wowtbc.gg',
    sourceAgreement: 'wowtbc-cross-check',
    notes: 'Explicit Shaman relic row; ranged slot must remain a Totem and not borrow physical ranged weapons.',
  }),
  explicitRanking({
    itemId: 28439,
    class: 'Warrior',
    spec: 'Fury',
    phase: 2,
    slot: 'Main Hand',
    rank: 4,
    label: 'Profession Option',
    sourceUrl: 'https://www.wowhead.com/tbc/guide/fury-warrior-dps-karazhan-best-in-slot-gear-burning-crusade-classic-wow',
    professionRequired: 'Blacksmithing',
    setBonusContext: 'Dragonstrike remains a Blacksmithing weapon plan because the haste proc changes real ranking value.',
  }),
  explicitRanking({
    itemId: 28439,
    class: 'Shaman',
    spec: 'Enhancement',
    phase: 2,
    slot: 'Main Hand',
    rank: 4,
    label: 'Profession Option',
    sourceUrl: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL,
    professionRequired: 'Blacksmithing',
    notes: 'Profession weapon option stays visible for Enhancement planning, then equip legality enforces Blacksmithing.',
  }),
  explicitRanking({
    itemId: 30141,
    class: 'Hunter',
    spec: 'Beast Mastery',
    phase: 2,
    slot: 'Head',
    rank: 1,
    label: 'BiS',
    sourceUrl: BM_HUNTER_PHASE_2_GUIDE_URL,
    setBonusContext: 'Tier 5 transition context: do not break Beast Lord until enough hunter set pieces are ready.',
  }),
  explicitRanking({
    itemId: 30139,
    class: 'Hunter',
    spec: 'Beast Mastery',
    phase: 2,
    slot: 'Chest',
    rank: 1,
    label: 'BiS',
    sourceUrl: BM_HUNTER_PHASE_2_GUIDE_URL,
    setBonusContext: 'Rift Stalker 4-piece transition: chest is part of the Phase 2 set-completion plan.',
  }),
  explicitRanking({
    itemId: 30140,
    class: 'Hunter',
    spec: 'Beast Mastery',
    phase: 2,
    slot: 'Hands',
    rank: 1,
    label: 'BiS',
    sourceUrl: BM_HUNTER_PHASE_2_GUIDE_URL,
    setBonusContext: 'Rift Stalker 4-piece transition: gloves help reach the Tier 5 breakpoint.',
  }),
  explicitRanking({
    itemId: 28275,
    class: 'Hunter',
    spec: 'Beast Mastery',
    phase: 2,
    slot: 'Head',
    rank: 5,
    label: 'Alternative',
    sourceUrl: BM_HUNTER_PHASE_2_GUIDE_URL,
    setBonusContext: 'Beast Lord transition: keep the old package visible until the Rift Stalker swap is ready.',
  }),
  explicitRanking({
    itemId: 28228,
    class: 'Hunter',
    spec: 'Beast Mastery',
    phase: 2,
    slot: 'Chest',
    rank: 5,
    label: 'Alternative',
    sourceUrl: BM_HUNTER_PHASE_2_GUIDE_URL,
    setBonusContext: 'Beast Lord transition: preserve as a staged set piece, not a generic low-stat chest.',
  }),
  explicitRanking({
    itemId: 27474,
    class: 'Hunter',
    spec: 'Beast Mastery',
    phase: 2,
    slot: 'Hands',
    rank: 5,
    label: 'Alternative',
    sourceUrl: BM_HUNTER_PHASE_2_GUIDE_URL,
    setBonusContext: 'Beast Lord transition: preserve as a staged set piece until the Tier 5 package is ready.',
  }),
  explicitRanking({
    itemId: 30146,
    class: 'Rogue',
    spec: 'Combat',
    phase: 2,
    slot: 'Head',
    rank: 1,
    label: 'BiS',
    sourceUrl: ROGUE_PHASE_2_GUIDE_URL,
    setBonusContext: 'Deathmantle 4-piece chase: tier helm is ranked for set-bonus value, not isolated stats.',
  }),
  explicitRanking({
    itemId: 30149,
    class: 'Rogue',
    spec: 'Combat',
    phase: 2,
    slot: 'Shoulder',
    rank: 1,
    label: 'BiS',
    sourceUrl: ROGUE_PHASE_2_GUIDE_URL,
    setBonusContext: 'Deathmantle shoulder/chest pairing: preserve the four-piece package.',
  }),
  explicitRanking({
    itemId: 30145,
    class: 'Rogue',
    spec: 'Combat',
    phase: 2,
    slot: 'Hands',
    rank: 1,
    label: 'BiS',
    sourceUrl: ROGUE_PHASE_2_GUIDE_URL,
    setBonusContext: 'Deathmantle 4-piece chase: gloves are individually strong and set-bonus enabling.',
  }),
  explicitRanking({
    itemId: 30148,
    class: 'Rogue',
    spec: 'Combat',
    phase: 2,
    slot: 'Legs',
    rank: 1,
    label: 'BiS',
    sourceUrl: ROGUE_PHASE_2_GUIDE_URL,
    setBonusContext: 'Deathmantle 4-piece chase: tier legs stay ranked for package value.',
  }),
  explicitRanking({
    itemId: 27484,
    class: 'Paladin',
    spec: 'Retribution',
    phase: 2,
    slot: 'Ranged',
    rank: 1,
    label: 'BiS',
    sourceUrl: RET_PALADIN_PHASE_2_GUIDE_URL,
    notes: 'Explicit Paladin relic row; Retribution ranged slot must stay on a Libram.',
  }),
  explicitRanking({
    itemId: 23198,
    class: 'Druid',
    spec: 'Feral Bear',
    phase: 2,
    slot: 'Ranged',
    rank: 1,
    label: 'BiS',
    sourceUrl: 'https://www.wowhead.com/tbc/guide/classes/druid/feral/tank-bis-gear-pve-phase-2',
    notes: 'Explicit Druid relic row; Feral Bear ranged slot must stay on an Idol.',
  }),
]

function classSpecForGuideMention(mention: GuideMention) {
  const mentionText = mention.spec.toLowerCase()
  return phase2SpecGuides.find((guide) =>
    mentionText.includes(guide.className.toLowerCase()) &&
    mentionText.includes(guide.spec.toLowerCase()),
  )
}

function defaultRankForLabel(label: RankingLabel) {
  return {
    BiS: 1,
    Great: 2,
    'Near-BiS': 3,
    'Profession Option': 4,
    Alternative: 5,
  }[label]
}

const legacyExplicitSpecSlotRankings: SpecSlotRanking[] = [
  {
    itemId: 30190,
    class: 'Shaman',
    spec: 'Enhancement',
    phase: 2,
    slot: 'Head',
    rank: 1,
    label: 'BiS',
    sourceUrl: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL,
    guideProvider: 'Wowhead + wowtbc.gg',
    mentionProvider: 'Wowhead',
    sourceAgreement: 'wowtbc-cross-check',
    confidence: 'guide',
    setBonusContext: 'Tier package note: the Tier 5 helm outranks higher isolated-stat helmets when it completes the Enhancement set package.',
    notes: 'Explicit golden-case ranking so Cataclysm Helm beats raw-stat fallback helms for Phase 2 Enhancement.',
  },
  {
    itemId: 28732,
    class: 'Shaman',
    spec: 'Enhancement',
    phase: 2,
    slot: 'Head',
    rank: 5,
    label: 'Alternative',
    sourceUrl: 'https://www.wowhead.com/tbc/item=28732/cowl-of-defiance',
    guideProvider: 'Starter',
    mentionProvider: 'Wowhead',
    sourceAgreement: 'starter',
    confidence: 'starter',
    setBonusContext: 'Raw stat fallback only; it should not outrank Cataclysm tier when the set bonus is part of the plan.',
    notes: 'Keeps the Cowl of Defiance scenario visible as a caution against pure stat sorting.',
  },
  {
    itemId: 30091,
    class: 'Shaman',
    spec: 'Enhancement',
    phase: 2,
    slot: 'Wrist',
    rank: 1,
    label: 'BiS',
    sourceUrl: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL,
    guideProvider: 'Wowhead + wowtbc.gg',
    mentionProvider: 'Wowhead',
    sourceAgreement: 'wowtbc-cross-check',
    confidence: 'guide',
    notes: 'True-Aim Stalker Bands are the explicit Phase 2 Enhancement bracer golden case.',
  },
  {
    itemId: 28439,
    class: 'Warrior',
    spec: 'Fury',
    phase: 2,
    slot: 'Main Hand',
    rank: 4,
    label: 'Profession Option',
    sourceUrl: 'https://www.wowhead.com/tbc/item=28439/dragonstrike',
    guideProvider: 'Wowhead',
    mentionProvider: 'Wowhead',
    sourceAgreement: 'Wowhead-only',
    confidence: 'guide',
    professionRequired: 'Blacksmithing',
    notes: 'Dragonstrike remains visible as a Blacksmithing weapon plan even when Blacksmithing is not selected.',
  },
  {
    itemId: 28439,
    class: 'Shaman',
    spec: 'Enhancement',
    phase: 2,
    slot: 'Main Hand',
    rank: 4,
    label: 'Profession Option',
    sourceUrl: 'https://www.wowhead.com/tbc/item=28439/dragonstrike',
    guideProvider: 'Wowhead',
    mentionProvider: 'Wowhead',
    sourceAgreement: 'Wowhead-only',
    confidence: 'guide',
    professionRequired: 'Blacksmithing',
    notes: 'Profession weapon visibility case: Enhancement should see Dragonstrike in planning, then fail equip without Blacksmithing.',
  },
  {
    itemId: 30141,
    class: 'Hunter',
    spec: 'Beast Mastery',
    phase: 2,
    slot: 'Head',
    rank: 1,
    label: 'BiS',
    sourceUrl: BM_HUNTER_PHASE_2_GUIDE_URL,
    guideProvider: 'Wowhead',
    mentionProvider: 'Wowhead',
    sourceAgreement: 'Wowhead-only',
    confidence: 'guide',
    setBonusContext: 'Hunter tier package note: do not break Beast Lord until the Rift Stalker swap is ready.',
    notes: 'Explicit BM Hunter tier-transition ranking.',
  },
  {
    itemId: 28275,
    class: 'Hunter',
    spec: 'Beast Mastery',
    phase: 2,
    slot: 'Head',
    rank: 5,
    label: 'Alternative',
    sourceUrl: BM_HUNTER_PHASE_2_GUIDE_URL,
    guideProvider: 'Wowhead',
    mentionProvider: 'Wowhead',
    sourceAgreement: 'Wowhead-only',
    confidence: 'guide',
    setBonusContext: 'Beast Lord transition package remains valid until Rift Stalker 4-piece is practical.',
    notes: 'Explicit Beast Lord fallback ranking for BM Hunter planning.',
  },
  {
    itemId: 30146,
    class: 'Rogue',
    spec: 'Combat',
    phase: 2,
    slot: 'Head',
    rank: 1,
    label: 'BiS',
    sourceUrl: ROGUE_PHASE_2_GUIDE_URL,
    guideProvider: 'Wowhead',
    mentionProvider: 'Wowhead',
    sourceAgreement: 'Wowhead-only',
    confidence: 'guide',
    setBonusContext: 'Deathmantle 4-piece drives several Combat Rogue choices; this is not a pure one-slot stat decision.',
    notes: 'Explicit Combat Rogue Deathmantle set-bonus ranking.',
  },
  {
    itemId: 27484,
    class: 'Paladin',
    spec: 'Retribution',
    phase: 2,
    slot: 'Ranged',
    rank: 1,
    label: 'BiS',
    sourceUrl: RET_PALADIN_PHASE_2_GUIDE_URL,
    guideProvider: 'Wowhead',
    mentionProvider: 'Wowhead',
    sourceAgreement: 'Wowhead-only',
    confidence: 'guide',
    notes: 'Retribution ranged slot legality anchor: use a Libram, not a physical ranged weapon.',
  },
  {
    itemId: 27886,
    class: 'Druid',
    spec: 'Feral Bear',
    phase: 2,
    slot: 'Ranged',
    rank: 1,
    label: 'BiS',
    sourceUrl: 'https://www.wowhead.com/tbc/item=27886/idol-of-the-emerald-queen',
    guideProvider: 'Starter',
    mentionProvider: 'Wowhead',
    sourceAgreement: 'starter',
    confidence: 'starter',
    notes: 'Druid ranged slot legality anchor: use an Idol, not a physical ranged weapon.',
  },
  {
    itemId: 27815,
    class: 'Shaman',
    spec: 'Enhancement',
    phase: 2,
    slot: 'Ranged',
    rank: 1,
    label: 'BiS',
    sourceUrl: ENHANCEMENT_SHAMAN_PHASE_2_GUIDE_URL,
    guideProvider: 'Wowhead + wowtbc.gg',
    mentionProvider: 'Wowhead',
    sourceAgreement: 'wowtbc-cross-check',
    confidence: 'guide',
    notes: 'Enhancement ranged slot legality anchor: use a Totem, not a physical ranged weapon.',
  },
]

function buildSpecSlotRankings(sourceCatalog: ItemDefinition[]): SpecSlotRanking[] {
  const generatedRankings = sourceCatalog.flatMap((item) => {
    const mentionRankings = (item.guideMentions ?? []).flatMap((mention) => {
      const guide = classSpecForGuideMention(mention)
      if (!guide) return []
      const label = mention.label ?? (mention.rank === 1 ? 'BiS' : 'Alternative')
      const setBonusContext = item.planningNote?.match(/(?:set|tier|piece|package|transition|Cataclysm|Deathmantle|Rift Stalker|Beast Lord).*/i)?.[0]
      const raceNotes = item.synergies
        ?.filter((synergy) => synergy.class === guide.className && synergy.spec === guide.spec)
        .map((synergy) => synergy.label)
        .join(' ')

      return [{
        itemId: item.id,
        class: guide.className as PlayerClass,
        spec: guide.spec,
        phase: mention.phase === 'PreRaid' ? 1 : mention.phase,
        slot: item.slot,
        rank: mention.rank ?? defaultRankForLabel(label),
        label,
        sourceUrl: mention.url,
        guideProvider: item.guideProvider ?? (mention.provider === 'Icy Veins' ? 'Icy Veins' : 'Wowhead'),
        mentionProvider: mention.provider,
        sourceAgreement: item.sourceAgreement ?? (mention.provider === 'Icy Veins' ? 'Icy-Veins-only' : 'Wowhead-only'),
        confidence: item.confidence ?? 'guide',
        professionRequired: requiredProfession(item),
        craftedByProfession: item.craftedByProfession,
        setBonusContext,
        raceNotes,
        notes: item.planningNote ?? item.note ?? item.source,
      }]
    })

    const synergyRankings = [...(item.synergies ?? []), ...(guideSynergyRules[item.id] ?? [])].map((synergy) => {
      const professionRequirement = requiredProfession(item)
      const setBonusContext = /set|tier|piece|package|transition|Cataclysm|Deathmantle|Rift Stalker|Beast Lord/i.test(synergy.label)
        ? synergy.label
        : undefined
      const raceNotes = [
        synergy.races?.length ? `Race-specific: ${synergy.races.join(', ')}.` : '',
        synergy.excludedRaces?.length ? `Excluded races: ${synergy.excludedRaces.join(', ')}.` : '',
      ].filter(Boolean).join(' ')

      return {
        itemId: item.id,
        class: synergy.class,
        spec: synergy.spec,
        phase: synergy.phase,
        slot: item.slot,
        rank: defaultRankForLabel(professionRequirement ? 'Profession Option' : 'Alternative'),
        label: professionRequirement ? 'Profession Option' : 'Alternative',
        sourceUrl: item.sourceUrl ?? `https://www.wowhead.com/tbc/item=${item.id}`,
        guideProvider: item.guideProvider ?? 'Wowhead',
        mentionProvider: item.guideProvider === 'Icy Veins' ? 'Icy Veins' : 'Wowhead',
        sourceAgreement: item.sourceAgreement ?? (item.confidence === 'guide' ? 'Wowhead-only' : 'starter'),
        confidence: item.confidence ?? 'guide',
        professionRequired: professionRequirement,
        craftedByProfession: item.craftedByProfession,
        setBonusContext,
        raceNotes,
        notes: synergy.label,
      } satisfies SpecSlotRanking
    })

    return [...mentionRankings, ...synergyRankings]
  })

  const rankings = [...generatedRankings, ...legacyExplicitSpecSlotRankings, ...explicitSpecSlotRankings]

  return Array.from(new Map(rankings.map((ranking) => [
    `${ranking.itemId}-${ranking.class}-${ranking.spec}-${ranking.phase}-${ranking.slot}-${ranking.label}-${ranking.mentionProvider}-${ranking.sourceUrl}`,
    ranking,
  ])).values())
}

const specSlotRankings = buildSpecSlotRankings(sourceItems)

const deduplicatedItems = new Map<number, Item>()
for (const item of sourceItems) {
  const existing = deduplicatedItems.get(item.id)
  if (!existing) {
    deduplicatedItems.set(item.id, item)
    continue
  }

  const mergedAllowedClasses = existing.allowedClasses && item.allowedClasses
    ? Array.from(new Set([...existing.allowedClasses, ...item.allowedClasses]))
    : undefined
  const mergedAllowedSpecs = existing.allowedSpecs && item.allowedSpecs
    ? [...(existing.allowedSpecs ?? []), ...(item.allowedSpecs ?? [])].reduce<SpecRestriction[]>((result, restriction) => {
        const current = result.find((entry) => entry.class === restriction.class)
        if (current) {
          current.specs = Array.from(new Set([...current.specs, ...restriction.specs]))
        } else {
          result.push({ class: restriction.class, specs: [...restriction.specs] })
        }
        return result
      }, [])
    : undefined

  deduplicatedItems.set(item.id, {
    ...existing,
    roles: Array.from(new Set([...existing.roles, ...item.roles])),
    allowedClasses: mergedAllowedClasses,
    allowedSpecs: mergedAllowedSpecs,
    guideMentions: [...(existing.guideMentions ?? []), ...(item.guideMentions ?? [])],
    synergies: [...(existing.synergies ?? []), ...(item.synergies ?? [])],
    planningNote: [existing.planningNote, item.planningNote].filter(Boolean).join(' '),
  })
}
const items = Array.from(deduplicatedItems.values())

const professionAdvice: Record<Role, string[]> = {
  melee: ['Blacksmithing for weapons can be huge early.', 'Leatherworking drums are raid-impactful.', 'Engineering goggles are very strong in Phase 2.'],
  hunter: ['Leatherworking drums and crafted pieces are practical.', 'Engineering goggles are a strong Phase 2 chase.', 'Jewelcrafting supports socket optimization.'],
  caster: ['Tailoring sets are early-phase anchors.', 'Engineering goggles become relevant in Phase 2.', 'Enchanting ring enchants add steady value.'],
  healer: ['Tailoring Primal Mooncloth is a strong early route.', 'Alchemy trinket and consumable value can matter.', 'Enchanting ring enchants are reliable.'],
  tank: ['Blacksmithing crafted mitigation pieces are useful.', 'Engineering has utility and Phase 2 goggles.', 'Jewelcrafting helps tune sockets and stamina.'],
}

const sourceLinks = [
  { label: 'Wowhead: TBC Anniversary Phase 2 BiS hub', url: 'https://www.wowhead.com/tbc/news/best-in-slot-guides-for-every-class-and-specialization-updated-for-phase-2-tbc-381617' },
  { label: 'Wowhead: Classic TBC BiS archive', url: 'https://www.wowhead.com/tbc/guides/classes/best-in-slot-guides-burning-crusade-classic' },
  { label: 'Blizzard: TBC Anniversary launch', url: 'https://worldofwarcraft.blizzard.com/en-us/news/24242436' },
  { label: 'Blizzard: Phase 2 now live', url: 'https://worldofwarcraft.blizzard.com/news/24276751/bcc-anniversary-edition-overlords-of-outland-arrives-may-14' },
  { label: 'Wowhead TBC database', url: 'https://www.wowhead.com/tbc/database' },
  { label: 'Icy Veins TBC guides', url: 'https://www.icy-veins.com/tbc-classic/' },
]

function guideProviderLabel(item: Item, ranking?: SpecSlotRanking) {
  return ranking?.guideProvider ?? item.guideProvider ?? (item.confidence === 'guide' ? 'Wowhead' : 'Starter')
}

function sourceAgreementLabel(item: Item, ranking?: SpecSlotRanking) {
  const agreement = ranking?.sourceAgreement ?? item.sourceAgreement ?? (item.confidence === 'guide' ? 'Wowhead-only' : 'starter')
  if (agreement === 'both') return 'Wowhead + Icy'
  if (agreement === 'wowtbc-cross-check') return 'Wowhead + wowtbc.gg'
  if (agreement === 'Icy-Veins-only') return 'Icy only'
  if (agreement === 'Wowhead-only') return 'Wowhead only'
  return 'Starter data'
}

function confidenceLabel(item: Item, ranking?: SpecSlotRanking) {
  const confidence = ranking?.confidence ?? item.confidence ?? 'starter'
  if (confidence === 'guide') return 'Guide-backed'
  if (confidence === 'sim') return 'Sim-backed'
  if (confidence === 'unverified') return 'Needs audit'
  return 'Starter estimate'
}

function scoreItemForRole(item: Item, role: Role) {
  const weights = roleWeights[role]
  return Object.entries(item.stats).reduce((total, [stat, value]) => total + (value ?? 0) * (weights[stat] ?? 0.2), 0)
}

function isRankingSlotMatch(rankingSlot: SpecSlotRanking['slot'], slot?: Slot) {
  if (!slot) return true
  return (
    rankingSlot === slot ||
    (rankingSlot === 'One Hand' && (slot === 'Main Hand' || slot === 'Off Hand')) ||
    (slot.startsWith('Ring') && rankingSlot === 'Ring') ||
    (slot.startsWith('Trinket') && rankingSlot === 'Trinket')
  )
}

function rankingsForContext(item: Item, playerClass: PlayerClass, spec: string, phase: Phase, slot?: Slot) {
  return specSlotRankings
    .filter((ranking) =>
      ranking.itemId === item.id &&
      ranking.class === playerClass &&
      ranking.spec === spec &&
      ranking.phase <= phase &&
      isRankingSlotMatch(ranking.slot, slot),
    )
    .sort((a, b) => a.rank - b.rank)
}

function bestRankingForContext(item: Item, playerClass: PlayerClass, spec: string, phase: Phase, slot?: Slot) {
  return rankingsForContext(item, playerClass, spec, phase, slot)[0]
}

function guideMentionsForContext(item: Item, playerClass: PlayerClass, spec: string, phase: Phase) {
  const rankingMentions = rankingsForContext(item, playerClass, spec, phase).map<GuideMention>((ranking) => ({
    provider: ranking.sourceUrl.includes('wowtbc.gg')
      ? 'wowtbc.gg'
      : ranking.sourceUrl.includes('icy-veins.com')
        ? 'Icy Veins'
        : ranking.mentionProvider === 'Icy Veins'
          ? 'Icy Veins'
          : 'Wowhead',
    spec: `${ranking.spec} ${ranking.class}`,
    phase: ranking.phase,
    rank: ranking.rank,
    label: ranking.label,
    url: ranking.sourceUrl,
  }))
  const legacyMentions = item.guideMentions?.filter((mention) => {
    const classMatch = mention.spec.toLowerCase().includes(playerClass.toLowerCase())
    const specMatch = mention.spec.toLowerCase().includes(spec.toLowerCase())
    const phaseMatch = mention.phase === 'PreRaid' || mention.phase <= phase
    return classMatch && specMatch && phaseMatch
  }) ?? []
  const seen = new Set<string>()
  return [...rankingMentions, ...legacyMentions].filter((mention) => {
    const key = `${mention.provider}:${mention.spec}:${mention.phase}:${mention.label}:${mention.url}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function guidePriorityForContext(item: Item, playerClass: PlayerClass, spec: string, phase: Phase, race: Race, slot?: Slot) {
  const raceExcluded = item.synergies?.some((synergy) =>
    synergy.class === playerClass &&
    synergy.spec === spec &&
    synergy.phase <= phase &&
    synergy.excludedRaces?.includes(race),
  )
  if (raceExcluded) return 0

  const rankings = rankingsForContext(item, playerClass, spec, phase, slot)
  if (rankings.length > 0) {
    return rankings.reduce((highest, ranking) => {
      const labelBonus = {
        BiS: 1200,
        Great: 950,
        'Near-BiS': 850,
        'Profession Option': 750,
        Alternative: 600,
      }[ranking.label]
      const rankBonus = Math.max(0, 100 - ranking.rank * 10)
      return Math.max(highest, labelBonus + rankBonus)
    }, 0)
  }

  return guideMentionsForContext(item, playerClass, spec, phase).reduce((highest, mention) => {
    const labelBonus = {
      BiS: 1200,
      Great: 950,
      'Near-BiS': 850,
      'Profession Option': 750,
      Alternative: 600,
    }[mention.label ?? 'Alternative']
    const rankBonus = mention.rank ? Math.max(0, 100 - mention.rank * 10) : 0
    return Math.max(highest, labelBonus + rankBonus)
  }, 0)
}

function synergyForContext(item: Item, playerClass: PlayerClass, spec: string, phase: Phase, race: Race) {
  const itemRules = item.synergies ?? []
  const guideRules = guideSynergyRules[item.id] ?? []
  return [...itemRules, ...guideRules].filter((synergy) => {
    const raceAllowed = !synergy.races || synergy.races.includes(race)
    const raceExcluded = synergy.excludedRaces?.includes(race) ?? false
    return synergy.class === playerClass && synergy.spec === spec && synergy.phase <= phase && raceAllowed && !raceExcluded
  })
}

function scoreItemForContext(item: Item, role: Role, selectedProfessions: string[], playerClass: PlayerClass, spec: string, phase: Phase, race: Race, slot?: Slot) {
  const baseScore = scoreItemForRole(item, role)
  const professionRequirement = requiredProfession(item)
  const professionBonus = professionRequirement && selectedProfessions.includes(professionRequirement) ? 2 : 0
  const synergyBonus = synergyForContext(item, playerClass, spec, phase, race).reduce((total, synergy) => total + synergy.bonus, 0)
  const guidePriority = guidePriorityForContext(item, playerClass, spec, phase, race, slot)
  return baseScore + professionBonus + synergyBonus + guidePriority
}

function isSlotMatch(item: Item, slot: Slot) {
  return (
    item.slot === slot ||
    (item.slot === 'One Hand' && (slot === 'Main Hand' || slot === 'Off Hand')) ||
    (slot.startsWith('Ring') && item.slot === 'Ring') ||
    (slot.startsWith('Trinket') && item.slot === 'Trinket')
  )
}

function requiredProfession(item: Item) {
  if (item.equippableWithoutProfession) return undefined
  return item.requiresProfession ?? item.profession
}

function isSpecAllowed(item: Item, playerClass: PlayerClass, spec: string) {
  if (!item.allowedSpecs) return true
  const restriction = item.allowedSpecs.find((entry) => entry.class === playerClass)
  return !restriction || restriction.specs.includes(spec)
}

function isEligibleItem(item: Item, slot: Slot, role: Role, phase: Phase, selectedProfessions: string[], faction: Faction, playerClass: PlayerClass, spec: string, showFuture = false) {
  const phaseMatch = showFuture ? item.phase <= 5 : item.phase <= phase
  const professionRequirement = requiredProfession(item)
  const rankingMatch = rankingsForContext(item, playerClass, spec, phase, slot).length > 0
  return (
    isSlotMatch(item, slot) &&
    (item.roles.includes(role) || rankingMatch) &&
    phaseMatch &&
    (!professionRequirement || selectedProfessions.includes(professionRequirement)) &&
    (!item.allowedClasses || item.allowedClasses.includes(playerClass) || rankingMatch) &&
    (isSpecAllowed(item, playerClass, spec) || rankingMatch) &&
    (!item.faction || item.faction === faction)
  )
}

function isVisibleInRankings(item: Item, slot: Slot, role: Role, phase: Phase, faction: Faction, playerClass: PlayerClass, spec: string, showFuture = false) {
  const phaseMatch = showFuture ? item.phase <= 5 : item.phase <= phase
  const rankingMatch = rankingsForContext(item, playerClass, spec, phase, slot).length > 0
  return (
    isSlotMatch(item, slot) &&
    (item.roles.includes(role) || rankingMatch) &&
    phaseMatch &&
    (!item.allowedClasses || item.allowedClasses.includes(playerClass) || rankingMatch) &&
    (isSpecAllowed(item, playerClass, spec) || rankingMatch) &&
    (!item.faction || item.faction === faction)
  )
}

function professionStateLabel(item: Item, selectedProfessions: string[]) {
  const professionRequirement = requiredProfession(item)
  if (professionRequirement) {
    return selectedProfessions.includes(professionRequirement) ? `${professionRequirement} active` : `Requires ${professionRequirement}`
  }
  if (item.craftedByProfession) return `Crafted by ${item.craftedByProfession}`
  return undefined
}

function professionBadgeClass(item: Item, selectedProfessions: string[]) {
  const professionRequirement = requiredProfession(item)
  if (professionRequirement && !selectedProfessions.includes(professionRequirement)) return 'profession-required-badge'
  if (professionRequirement || item.craftedByProfession) return 'profession-active-badge'
  return undefined
}

function bestEligibleItemForSlot(slot: Slot, role: Role, phase: Phase, selectedProfessions: string[], faction: Faction, playerClass: PlayerClass, spec: string, race: Race, usedUniqueIds: Set<number>) {
  const bestItem = [...items]
    .filter((item) => {
      const uniqueMatch = !item.unique || !usedUniqueIds.has(item.id)
      return uniqueMatch && isEligibleItem(item, slot, role, phase, selectedProfessions, faction, playerClass, spec)
    })
    .sort((a, b) => scoreItemForContext(b, role, selectedProfessions, playerClass, spec, phase, race, slot) - scoreItemForContext(a, role, selectedProfessions, playerClass, spec, phase, race, slot))[0]

  if (bestItem?.unique) usedUniqueIds.add(bestItem.id)
  return bestItem
}

function getRecommendedGear(role: Role, phase: Phase, selectedProfessions: string[], faction: Faction, playerClass: PlayerClass, spec: string, race: Race) {
  const usedUniqueIds = new Set<number>()
  return normalizeWeaponHands(
    Object.fromEntries(slots.map((slot) => [slot, bestEligibleItemForSlot(slot, role, phase, selectedProfessions, faction, playerClass, spec, race, usedUniqueIds)])) as Equipped,
  )
}

function normalizeWeaponHands(gear: Equipped) {
  if (gear['Main Hand']?.twoHanded) return { ...gear, 'Off Hand': undefined }
  return gear
}

function gearFromIds(ids: string | undefined) {
  if (!ids) return undefined
  const parsed = ids.split('.')
  return Object.fromEntries(
    slots.map((slot, index) => [slot, items.find((item) => item.id === Number(parsed[index]))]),
  ) as Equipped
}

function sanitizeGear(gear: Equipped | undefined, role: Role, phase: Phase, selectedProfessions: string[], faction: Faction, playerClass: PlayerClass, spec: string, race: Race) {
  if (!gear) return undefined

  const usedUniqueIds = new Set<number>()
  return normalizeWeaponHands(Object.fromEntries(
    slots.map((slot) => {
      const item = gear[slot]
      if (item && isEligibleItem(item, slot, role, phase, selectedProfessions, faction, playerClass, spec) && (!item.unique || !usedUniqueIds.has(item.id))) {
        if (item.unique) usedUniqueIds.add(item.id)
        return [slot, item]
      }

      return [slot, bestEligibleItemForSlot(slot, role, phase, selectedProfessions, faction, playerClass, spec, race, usedUniqueIds)]
    }),
  ) as Equipped)
}

function normalizeProfessions(value: string | null) {
  if (value === null || value.trim() === '') return []
  const requested = value.split(',').filter((profession) => professions.includes(profession))
  return Array.from(new Set(requested)).sort().slice(0, MAX_PRIMARY_PROFESSIONS)
}

function getInitialState(): InitialState {
  const params = new URLSearchParams(window.location.search)
  const requestedClass = params.get('class') as PlayerClass | null
  const playerClass = requestedClass && requestedClass in classSpecs ? requestedClass : 'Shaman'
  const requestedSpec = params.get('spec')
  const spec = classSpecs[playerClass].some((entry) => entry.name === requestedSpec) ? requestedSpec as string : classSpecs[playerClass][0].name
  const requestedFaction = params.get('faction') as Faction | null
  const faction = requestedFaction === 'Horde' || requestedFaction === 'Alliance' ? requestedFaction : 'Alliance'
  const legalRaces = racesByFaction[faction].filter((candidate) => legalRaceClasses[candidate].includes(playerClass))
  const requestedRace = params.get('race') as Race | null
  const race = requestedRace && legalRaces.includes(requestedRace) ? requestedRace : legalRaces[0]
  const requestedPhase = Number(params.get('phase'))
  const phase = requestedPhase >= 1 && requestedPhase <= 5 ? requestedPhase as Phase : CURRENT_PHASE
  const selectedProfessions = normalizeProfessions(params.get('professions'))
  const role = classSpecs[playerClass].find((entry) => entry.name === spec)?.role ?? classSpecs[playerClass][0].role
  const urlGear = sanitizeGear(gearFromIds(params.get('gear') ?? undefined), role, phase, selectedProfessions, faction, playerClass, spec, race)
  const savedGear = sanitizeGear(
    gearFromIds(window.localStorage.getItem(buildStorageKey(faction, race, playerClass, spec, phase, selectedProfessions)) ?? undefined),
    role,
    phase,
    selectedProfessions,
    faction,
    playerClass,
    spec,
    race,
  )

  return {
    faction,
    race,
    playerClass,
    spec,
    phase,
    selectedProfessions,
    gear: urlGear ?? savedGear ?? getRecommendedGear(role, phase, selectedProfessions, faction, playerClass, spec, race),
    ownedItemIds: getSavedOwnedItems(),
  }
}

function getSavedOwnedItems() {
  try {
    const saved = window.localStorage.getItem('project-defeat-owned-items')
    if (!saved) return []
    const parsed = JSON.parse(saved) as number[]
    return parsed.filter((id) => items.some((item) => item.id === id))
  } catch {
    window.localStorage.removeItem('project-defeat-owned-items')
    return []
  }
}

function buildStorageKey(faction: Faction, race: Race, playerClass: PlayerClass, spec: string, phase: Phase, selectedProfessions: string[]) {
  return `project-defeat-gear:${faction}:${race}:${playerClass}:${spec}:p${phase}:${[...selectedProfessions].sort().join('-')}`
}

function countLegalRaceClassCombos() {
  return Object.values(legalRaceClasses).reduce((total, classes) => total + classes.length, 0)
}

function countProfessionPairs() {
  return (professions.length * (professions.length - 1)) / 2
}

function countGearAffectingProfessions() {
  return professions.filter((profession) =>
    items.some((item) => item.profession === profession || item.requiresProfession === profession || item.craftedByProfession === profession),
  ).length
}

function App() {
  const initialState = useMemo(() => getInitialState(), [])
  const [faction, setFaction] = useState<Faction>(initialState.faction)
  const [race, setRace] = useState<Race>(initialState.race)
  const [playerClass, setPlayerClass] = useState<PlayerClass>(initialState.playerClass)
  const [spec, setSpec] = useState(initialState.spec)
  const [phase, setPhase] = useState<Phase>(initialState.phase)
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>(initialState.selectedProfessions)
  const [selectedSlot, setSelectedSlot] = useState<Slot>('Head')
  const [query, setQuery] = useState('')
  const [showFuture, setShowFuture] = useState(false)
  const [gear, setGear] = useState<Equipped>(initialState.gear)
  const [ownedItemIds, setOwnedItemIds] = useState<number[]>(initialState.ownedItemIds)
  const [ownedOnly, setOwnedOnly] = useState(false)
  const [copied, setCopied] = useState(false)
  const [professionNotice, setProfessionNotice] = useState('')
  const [focusedItem, setFocusedItem] = useState<Item | undefined>(undefined)
  const [enhancementView, setEnhancementView] = useState<'enchants' | 'gems'>('enchants')
  const [importText, setImportText] = useState('')
  const [importNotice, setImportNotice] = useState('Paste a WowSims/export text, addon output, or item IDs to stage owned gear.')
  const [importStage, setImportStage] = useState<ImportStageEntry[]>([])
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const specMeta = classSpecs[playerClass].find((entry) => entry.name === spec) ?? classSpecs[playerClass][0]
  const role = specMeta.role
  const phase2Guide = getPhase2SpecGuide(playerClass, spec)
  const legalClasses = legalRaceClasses[race]
  const isLegalRaceClass = legalClasses.includes(playerClass)

  const compatibleItems = useMemo(() => {
    return items.filter((item) => {
      const text = `${item.name} ${item.source} ${item.type} ${item.id}`.toLowerCase()
      const ownedMatch = !ownedOnly || ownedItemIds.includes(item.id)
      return ownedMatch && isVisibleInRankings(item, selectedSlot, role, phase, faction, playerClass, spec, showFuture) && text.includes(query.toLowerCase())
    })
  }, [faction, ownedItemIds, ownedOnly, phase, playerClass, query, role, selectedSlot, showFuture, spec])

  const rankedItems = useMemo(() => {
    return compatibleItems.map((item) => ({ item, score: scoreItemForContext(item, role, selectedProfessions, playerClass, spec, phase, race, selectedSlot) })).sort((a, b) => b.score - a.score)
  }, [compatibleItems, phase, playerClass, race, role, selectedProfessions, selectedSlot, spec])

  const warnings = useMemo(() => {
    const result: string[] = []
    if (!isLegalRaceClass) result.push(`${race} cannot be a ${playerClass} in TBC.`)

    const equippedItems = Object.values(gear).filter(Boolean) as Item[]
    equippedItems.forEach((item) => {
      if (item.phase > phase) result.push(`${item.name} is from Phase ${item.phase}, after your selected Phase ${phase}.`)
      const professionRequirement = requiredProfession(item)
      if (professionRequirement && !selectedProfessions.includes(professionRequirement)) result.push(`${item.name} requires ${professionRequirement}.`)
      if (item.faction && item.faction !== faction) result.push(`${item.name} is ${item.faction}-only.`)
    })

    const uniqueIds = equippedItems.filter((item) => item.unique).map((item) => item.id)
    uniqueIds.forEach((id) => {
      if (uniqueIds.filter((other) => other === id).length > 1) {
        result.push('A unique-equipped item is selected more than once.')
      }
    })

    return Array.from(new Set(result))
  }, [faction, gear, isLegalRaceClass, phase, playerClass, race, selectedProfessions])

  const score = useMemo(() => {
    const weights = roleWeights[role]
    return Math.round(
      Object.values(gear).reduce((total, item) => {
        if (!item) return total
        return (
          total +
          Object.entries(item.stats).reduce((itemTotal, [stat, value]) => {
            return itemTotal + (value ?? 0) * (weights[stat] ?? 0.2)
          }, 0)
        )
      }, 0),
    )
  }, [gear, role])

  const filledSlots = slots.filter((slot) => gear[slot]).length
  const supportedSpecCount = phase2SpecGuides.length
  const storageKey = buildStorageKey(faction, race, playerClass, spec, phase, selectedProfessions)
  const selectedEquipped = gear[selectedSlot]
  const selectedEquippedRank = selectedEquipped ? rankedItems.findIndex(({ item }) => item.id === selectedEquipped.id) + 1 : 0
  const focusedRanking = focusedItem ? bestRankingForContext(focusedItem, playerClass, spec, phase, selectedSlot) : undefined
  const guideBackedEquipped = Object.values(gear).filter((item) => item?.confidence === 'guide').length
  const guideOnlyEquipped = Object.values(gear).filter((item) => item?.guideOnly).length
  const professionLockedEquipped = Object.values(gear).filter((item) => {
    const requirement = item ? requiredProfession(item) : undefined
    return requirement && !selectedProfessions.includes(requirement)
  }).length
  const sourceBackedEquipped = Object.values(gear).filter((item) => item?.sourceUrl || item?.guideMentions?.length).length
  const equippedAudit = [
    { label: 'Guide-backed', value: `${guideBackedEquipped}/${filledSlots || slots.length}` },
    { label: 'Source-linked', value: `${sourceBackedEquipped}/${filledSlots || slots.length}` },
    { label: 'Guide-only', value: String(guideOnlyEquipped) },
    { label: 'Locked', value: String(professionLockedEquipped) },
  ]
  const stageWarnings = useMemo(() => {
    const notes: string[] = []
    const equippedNames = Object.values(gear).filter(Boolean).map((item) => item?.name ?? '')
    const hasRiftPieces = equippedNames.filter((name) => name.includes('Rift Stalker')).length
    const hasBeastLordPieces = equippedNames.filter((name) => name.includes('Beast Lord')).length
    const hasCataclysmPieces = equippedNames.filter((name) => name.includes('Cataclysm')).length
    const hasDeathmantlePieces = equippedNames.filter((name) => name.includes('Deathmantle')).length

    if (playerClass === 'Hunter' && hasRiftPieces > 0 && hasRiftPieces < 4 && hasBeastLordPieces > 0) {
      notes.push('Hunter set staging: do not break Beast Lord 4-piece until the Rift Stalker swap is ready.')
    }
    if (playerClass === 'Shaman' && spec === 'Enhancement' && hasCataclysmPieces > 0) {
      notes.push('Enhancement package: Cataclysm pieces gain real value as a 4-piece package; slot stats alone can mislead.')
    }
    if (playerClass === 'Rogue' && hasDeathmantlePieces > 0 && hasDeathmantlePieces < 4) {
      notes.push('Rogue staging: Deathmantle is a package decision with offset slots, not a pure item-by-item swap.')
    }
    if (playerClass === 'Paladin' && spec === 'Protection') {
      notes.push('Protection Paladin needs mode toggles next: threat, balanced, avoidance, and add-tank sets rank differently.')
    }
    if (playerClass === 'Druid' && spec === 'Feral Cat') {
      notes.push('Feral Cat idol choice is context-sensitive: personal DPS and raid-DPS utility can disagree.')
    }
    if (playerClass === 'Shaman' && spec === 'Enhancement' && race === 'Orc') {
      notes.push('Orc Enhancement weapon path still needs a dedicated axe-racial audit before final sign-off.')
    }
    return notes
  }, [gear, playerClass, race, spec])
  const enhancementPlan = useMemo(() => getPhase2EnhancementPlan(playerClass, spec, role), [playerClass, role, spec])
  const visibleEnhancements = enhancementView === 'enchants' ? enhancementPlan.enchants : enhancementPlan.gems
  const visibleEnhancementGroups = useMemo(() => {
    const groups = visibleEnhancements.reduce<Record<string, Enhancement[]>>((result, enhancement) => {
      result[enhancement.slot] = [...(result[enhancement.slot] ?? []), enhancement]
      return result
    }, {})

    return Object.entries(groups).sort(([slotA], [slotB]) => slotA.localeCompare(slotB))
  }, [visibleEnhancements])

  useEffect(() => {
    const ids = Object.fromEntries(slots.map((slot) => [slot, gear[slot]?.id]))
    window.localStorage.setItem(storageKey, slots.map((slot) => ids[slot] ?? '').join('.'))
  }, [gear, storageKey])

  useEffect(() => {
    window.localStorage.setItem('project-defeat-owned-items', JSON.stringify(ownedItemIds))
  }, [ownedItemIds])

  useEffect(() => {
    if (!focusedItem) return

    closeButtonRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeFocusedItem()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [focusedItem])

  function itemScore(item: Item) {
    return scoreItemForContext(item, role, selectedProfessions, playerClass, spec, phase, race, selectedSlot)
  }

  function itemRank(item: Item) {
    const rank = rankedItems.findIndex((entry) => entry.item.id === item.id)
    return rank >= 0 ? rank + 1 : undefined
  }

  function materialLabel(material: CraftMaterial) {
    return `${material.quantity ? `${material.quantity}x ` : ''}${material.name}`
  }

  function enhancementMaterialLabel(material: Enhancement['materials'][number]) {
    return `${material.quantity ? `${material.quantity}x ` : ''}${material.name}`
  }

  function enhancementRequirementLabel(enhancement: Enhancement) {
    if (!enhancement.professionRequired) return ''
    return selectedProfessions.includes(enhancement.professionRequired)
      ? `${enhancement.professionRequired} active`
      : `Requires ${enhancement.professionRequired}`
  }

  function enhancementRequirementClass(enhancement: Enhancement) {
    if (!enhancement.professionRequired) return ''
    return selectedProfessions.includes(enhancement.professionRequired) ? 'profession-active-badge' : 'profession-required-badge'
  }

  function enhancementTooltip(enhancement: Enhancement) {
    const materials = enhancement.materials
      .map((material) => {
        const source = getMaterialSource(material.name)
        return `${enhancementMaterialLabel(material)}${source ? ` (${source.source})` : ''}`
      })
      .join(', ')
    const requirement = enhancementRequirementLabel(enhancement)
    const activation = enhancement.activation ? ` Activation: ${enhancement.activation}` : ''
    const note = enhancement.note ? ` ${enhancement.note}` : ''
    return `${enhancement.name}. ${enhancement.effect}. Tier ${enhancement.tier} for ${playerClass} ${spec}. Learned from: ${enhancement.learnedFrom}. Materials: ${materials}.${requirement ? ` ${requirement}.` : ''}${activation}${note}`
  }

  function itemTooltip(item: Item, slot = selectedSlot) {
    const ranking = bestRankingForContext(item, playerClass, spec, phase, slot)
    const materialText = item.materials ? ` Materials: ${item.materials.map(materialLabel).join(', ')}.` : ''
    const professionText = professionStateLabel(item, selectedProfessions) ? ` ${professionStateLabel(item, selectedProfessions)}.` : ''
    const synergyText = synergyForContext(item, playerClass, spec, phase, race).length
      ? ` Synergy: ${synergyForContext(item, playerClass, spec, phase, race).map((synergy) => synergy.label).join('; ')}.`
      : ''
    const guidePriorityText = ranking || guideMentionsForContext(item, playerClass, spec, phase).length
      ? ` Guide priority applies for ${playerClass} ${spec}${ranking ? ` as ${ranking.label} rank ${ranking.rank}` : ''}.`
      : ''
    const contextMentions = guideMentionsForContext(item, playerClass, spec, phase)
    const guideText = contextMentions.length
      ? ` Guides: ${contextMentions.map((mention) => `${mention.provider} ${mention.label ?? 'listed'} for ${mention.spec} ${mention.phase}`).join('; ')}.`
      : ''
    const guideOnlyText = item.guideOnly ? ' Guide-only placeholder: stats, sockets, and procs still need sim-data enrichment.' : ''
    const planningText = item.planningNote ? ` ${item.planningNote}` : ''
    return `${item.name}. ${item.source}. ${confidenceLabel(item, ranking)}. ${sourceAgreementLabel(item, ranking)}.${professionText}${materialText}${guidePriorityText}${synergyText}${guideText}${guideOnlyText}${planningText}`
  }

  function canEquipItem(item: Item) {
    const professionRequirement = requiredProfession(item)
    return !professionRequirement || selectedProfessions.includes(professionRequirement)
  }

  function equipButtonLabel(item: Item) {
    const professionRequirement = requiredProfession(item)
    if (professionRequirement && !selectedProfessions.includes(professionRequirement)) return `Needs ${professionRequirement}`
    return 'Equip'
  }

  function openFocusedItem(item: Item | undefined) {
    if (item) previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setFocusedItem(item)
  }

  function closeFocusedItem() {
    setFocusedItem(undefined)
    window.setTimeout(() => previousFocusRef.current?.focus(), 0)
  }

  function loadRecommended() {
    const allowedIds = ownedOnly ? new Set(ownedItemIds) : undefined
    const usedUniqueIds = new Set<number>()
    const next = Object.fromEntries(
      slots.map((slot) => {
        const bestItem = [...items]
          .filter((item) => {
            const ownedMatch = !allowedIds || allowedIds.has(item.id)
            const uniqueMatch = !item.unique || !usedUniqueIds.has(item.id)
            return ownedMatch && uniqueMatch && isEligibleItem(item, slot, role, phase, selectedProfessions, faction, playerClass, spec)
          })
          .sort((a, b) => scoreItemForContext(b, role, selectedProfessions, playerClass, spec, phase, race, slot) - scoreItemForContext(a, role, selectedProfessions, playerClass, spec, phase, race, slot))[0]
        if (bestItem?.unique) usedUniqueIds.add(bestItem.id)
        return [slot, bestItem]
      }),
    ) as Equipped
    setGear(normalizeWeaponHands(next))
  }

  function equipItem(slot: Slot, item: Item) {
    setGear((current) => {
      if (slot === 'Off Hand' && current['Main Hand']?.twoHanded) return current
      const next = { ...current, [slot]: item }
      return normalizeWeaponHands(next)
    })
    openFocusedItem(item)
  }

  function toggleOwnedItem(item: Item) {
    setOwnedItemIds((current) =>
      current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id],
    )
  }

  function handleDrop(slot: Slot, itemId: number) {
    const item = items.find((candidate) => candidate.id === itemId)
    if (!item) return
    if (!isSlotMatch(item, slot)) {
      setProfessionNotice(`${item.name} cannot go in ${slot}.`)
      return
    }
    if (!isEligibleItem(item, slot, role, phase, selectedProfessions, faction, playerClass, spec)) {
      setProfessionNotice(`${item.name} is blocked by phase, profession, faction, class, spec, or slot rules.`)
      return
    }
    if (item.unique && Object.entries(gear).some(([currentSlot, equipped]) => currentSlot !== slot && equipped?.id === item.id)) {
      setProfessionNotice(`${item.name} is unique and is already equipped.`)
      return
    }
    setProfessionNotice('')
    equipItem(slot, item)
  }

  function emptySlotReason(slot: Slot) {
    const slotItems = items.filter((item) => isSlotMatch(item, slot) && item.roles.includes(role) && (!item.allowedClasses || item.allowedClasses.includes(playerClass)))
    if (slotItems.length === 0) return 'Starter catalog needs class/spec data.'
    if (slotItems.some((item) => item.phase > phase)) return 'Only future-phase options are in the starter catalog.'
    if (slotItems.some((item) => {
      const professionRequirement = requiredProfession(item)
      return professionRequirement && !selectedProfessions.includes(professionRequirement)
    })) return 'Available options need an unselected profession.'
    return 'No legal option found for current filters.'
  }

  function toggleProfession(profession: string) {
    let next = selectedProfessions.includes(profession)
      ? selectedProfessions.filter((entry) => entry !== profession)
      : [...selectedProfessions, profession]
    if (next.length > MAX_PRIMARY_PROFESSIONS) {
      const removed = next[0]
      next = next.slice(1)
      setProfessionNotice(`TBC characters can plan two primary professions here. ${removed} was swapped out.`)
    } else {
      setProfessionNotice('')
    }
    setSelectedProfessions(next)
    closeFocusedItem()
  }

  function handleFactionChange(value: string) {
    const nextFaction = value as Faction
    const legalRaces = racesByFaction[nextFaction].filter((candidate) => legalRaceClasses[candidate].includes(playerClass))
    const nextRace = legalRaces.includes(race) ? race : legalRaces[0]
    setFaction(nextFaction)
    setRace(nextRace)
    setGear(getRecommendedGear(role, phase, selectedProfessions, nextFaction, playerClass, spec, nextRace))
    closeFocusedItem()
  }

  function handleRaceChange(value: string) {
    const nextRace = value as Race
    setRace(nextRace)
    setGear(getRecommendedGear(role, phase, selectedProfessions, faction, playerClass, spec, nextRace))
    closeFocusedItem()
  }

  function handleClassChange(value: string) {
    const nextClass = value as PlayerClass
    const nextSpec = classSpecs[nextClass][0]
    const legalRaces = racesByFaction[faction].filter((candidate) => legalRaceClasses[candidate].includes(nextClass))
    const nextRace = legalRaces.includes(race) ? race : legalRaces[0]
    setPlayerClass(nextClass)
    setSpec(nextSpec.name)
    setRace(nextRace)
    setGear(getRecommendedGear(nextSpec.role, phase, selectedProfessions, faction, nextClass, nextSpec.name, nextRace))
    closeFocusedItem()
  }

  function handleSpecChange(value: string) {
    const nextRole = classSpecs[playerClass].find((entry) => entry.name === value)?.role ?? role
    setSpec(value)
    setGear(getRecommendedGear(nextRole, phase, selectedProfessions, faction, playerClass, value, race))
    closeFocusedItem()
  }

  function handlePhaseChange(value: string) {
    const nextPhase = Number(value.replace('Phase ', '')) as Phase
    setPhase(nextPhase)
    setGear(getRecommendedGear(role, nextPhase, selectedProfessions, faction, playerClass, spec, race))
    closeFocusedItem()
  }

  function copyShareLink() {
    const params = new URLSearchParams({
      faction,
      race,
      class: playerClass,
      spec,
      phase: String(phase),
      professions: [...selectedProfessions].sort().join(','),
      gear: slots.map((slot) => gear[slot]?.id ?? '').join('.'),
    })
    navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?${params.toString()}`)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  function parseImportedItemIds() {
    return (importText.match(/\d{4,6}/g) ?? []).map(Number)
  }

  function stageImportedGear() {
    const importedIds = parseImportedItemIds()
    if (importedIds.length === 0) {
      setImportNotice('No item IDs found. Paste a WowSims export, addon export, Wowhead gear planner text, or plain item IDs.')
      setImportStage([])
      return
    }

    const seen = new Set<number>()
    const equippedUniqueIds = new Set(Object.values(gear).filter(Boolean).filter((item) => item?.unique).map((item) => item?.id as number))
    const staged = importedIds.map<ImportStageEntry>((id) => {
      if (seen.has(id)) return { id, status: 'duplicate', reason: 'Duplicate ID in import text.' }
      seen.add(id)

      const item = items.find((candidate) => candidate.id === id)
      if (!item) return { id, status: 'unknown', reason: 'Unknown to the current starter catalog.' }
      if (!item.roles.includes(role)) return { id, item, status: 'blocked', reason: `Role mismatch for ${role}.` }
      if (item.allowedClasses && !item.allowedClasses.includes(playerClass)) return { id, item, status: 'blocked', reason: `Not legal for ${playerClass}.` }
      if (!isSpecAllowed(item, playerClass, spec)) return { id, item, status: 'blocked', reason: `Not listed for ${spec}.` }
      if (item.unique && equippedUniqueIds.has(item.id)) return { id, item, status: 'duplicate', reason: 'Unique item is already equipped.' }

      const slot = slots.find((candidateSlot) => isEligibleItem(item, candidateSlot, role, phase, selectedProfessions, faction, playerClass, spec))
      if (!slot) return { id, item, status: 'blocked', reason: 'Phase, profession, faction, or slot rules block this item.' }
      return { id, item, status: 'equippable', reason: `Can stage into ${slot}.`, slot }
    })

    setImportStage(staged)
    const knownCount = staged.filter((entry) => entry.item).length
    const equippableCount = staged.filter((entry) => entry.status === 'equippable').length
    setImportNotice(`Staged ${equippableCount} equippable items from ${knownCount} known matches. Review before applying.`)
  }

  function applyStagedImport() {
    const stagedItems = importStage.filter((entry) => entry.status === 'equippable' && entry.item && entry.slot)
    if (stagedItems.length === 0) {
      setImportNotice('No staged items are currently equippable for this build.')
      return
    }

    setGear((current) => {
      const next = { ...current }
      stagedItems.forEach((entry) => {
        next[entry.slot as Slot] = entry.item
      })
      return normalizeWeaponHands(next)
    })
    setOwnedItemIds((current) => Array.from(new Set([...current, ...stagedItems.map((entry) => entry.id)])))
    setImportNotice(`Applied ${stagedItems.length} staged items to the character pane.`)
  }

  function renderGearSlot(slot: Slot) {
    const equipped = gear[slot]
    return (
      <button
        className={selectedSlot === slot ? 'gear-slot active' : 'gear-slot'}
        key={slot}
        title={equipped ? itemTooltip(equipped, slot) : emptySlotReason(slot)}
        type="button"
        onClick={() => {
          setSelectedSlot(slot)
          openFocusedItem(equipped)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => handleDrop(slot, Number(event.dataTransfer.getData('item-id')))}
      >
        <span className="slot-label">{slot}</span>
        {equipped ? (
          <>
            <strong>{equipped.name}</strong>
            <small>Phase {equipped.phase} • {equipped.type}</small>
          </>
        ) : (
          <>
            <strong>Empty</strong>
            <small>{emptySlotReason(slot)}</small>
          </>
        )}
      </button>
    )
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Project Defeat · TBC Anniversary Phase 2</p>
          <h1>TBC Anniversary BiS Planner</h1>
          <p className="lede">
            A guide-sourced gear planner built around character state, slot rankings, and staged imports. Start with no
            professions selected, then plan profession gear, owned items, and source-backed alternatives.
          </p>
        </div>
        <div className="status-panel">
          <span className="phase-pill">Current Phase {CURRENT_PHASE}</span>
          <strong>{score}</strong>
          <span>estimated weighted value</span>
        </div>
      </header>

      <section className="controls" aria-label="Character and filter controls">
        <Select label="Faction" value={faction} values={['Alliance', 'Horde']} onChange={handleFactionChange} />
        <Select label="Race" value={race} values={racesByFaction[faction]} onChange={handleRaceChange} />
        <Select label="Class" value={playerClass} values={Object.keys(classSpecs)} onChange={handleClassChange} />
        <Select label="Spec" value={spec} values={classSpecs[playerClass].map((entry) => entry.name)} onChange={handleSpecChange} />
        <Select label="Phase" value={`Phase ${phase}`} values={phases.map((entry) => `Phase ${entry.id}`)} onChange={handlePhaseChange} />
      </section>

      <section className="layout">
        <aside className="left-rail">
          <section className="panel">
            <div className="panel-heading">
              <ShieldCheck size={18} />
              <h2>Build Assumptions</h2>
            </div>
            <p>{specMeta.note}</p>
            {phase2Guide && (
              <div className={`guide-profile ${phase2Guide.status}`}>
                <div>
                  <strong>Phase 2 guide profile</strong>
                  <span>{phase2Guide.status === 'audited' ? 'Wowhead primary' : phase2Guide.status === 'shared' ? 'Shared class list' : 'Needs dedicated audit'}</span>
                </div>
                <a href={phase2Guide.guideUrl} target="_blank">
                  <ExternalLink size={14} />
                  Open guide
                </a>
                <ul>
                  {phase2Guide.rankingNotes.map((note) => <li key={note}>{note}</li>)}
                </ul>
              </div>
            )}
            <div className="phase-list">
              {phases.map((entry) => (
                <button
                  className={entry.id === phase ? 'phase-row active' : 'phase-row'}
                  key={entry.id}
                  type="button"
                  onClick={() => handlePhaseChange(`Phase ${entry.id}`)}
                >
                  <span>{entry.label}</span>
                  <small>{entry.detail}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <Hammer size={18} />
              <h2>Professions</h2>
            </div>
            <p className="microcopy">
              Default is none. Choose up to two primary professions to highlight profession-required gear and planning notes.
              The matrix supports all {countProfessionPairs()} two-profession pairings structurally.
            </p>
            <div className="profession-grid">
              {professions.map((profession) => (
                <button
                  className={selectedProfessions.includes(profession) ? 'chip active' : 'chip'}
                  key={profession}
                  type="button"
                  onClick={() => toggleProfession(profession)}
                >
                  {selectedProfessions.includes(profession) && <Check size={14} />}
                  {profession}
                </button>
              ))}
            </div>
            {professionNotice && <p className="notice">{professionNotice}</p>}
            <p className="notice">
              Gear-affecting starter data exists for {countGearAffectingProfessions()}/{professions.length} professions.
              Jewelcrafting, Enchanting, and Alchemy are advice-only until their item bonuses are added.
              Crafted-by and profession-required gear are now split for the guide-backed starter slice.
            </p>
            <ul className="advice-list">
              {professionAdvice[role].map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <WandSparkles size={18} />
              <h2>Sim Path</h2>
            </div>
            <ul className="advice-list">
              <li>Import gear first, review slot conflicts, then apply staged items.</li>
              <li>Next simulator layer: talents, buffs, consumes, rotation, fight length, and target count.</li>
              <li>Guide-only items remain labeled until stats, sockets, procs, and set bonuses are fully modeled.</li>
            </ul>
          </section>

          <section className="panel compact-panel">
            <div className="panel-heading">
              <Sparkles size={18} />
              <h2>Sources</h2>
            </div>
            <p>
              Wowhead Phase 2 Anniversary is primary. Secondary sources are comparison labels, not silent overrides.
            </p>
            <div className="source-links">
              {sourceLinks.map((link) => (
                <a href={link.url} key={link.url} target="_blank">
                  {link.label}
                </a>
              ))}
            </div>
          </section>

          <section className="panel compact-panel">
            <div className="panel-heading">
              <LayoutDashboard size={18} />
              <h2>Coverage</h2>
            </div>
            <div className="audit-grid">
              <div>
                <strong>{supportedSpecCount}</strong>
                <span>spec profiles</span>
              </div>
              <div>
                <strong>{countLegalRaceClassCombos()}</strong>
                <span>race/class combos</span>
              </div>
              <div>
                <strong>{countProfessionPairs()}</strong>
                <span>profession pairs</span>
              </div>
              <div>
                <strong>{filledSlots}/{slots.length}</strong>
                <span>slots filled</span>
              </div>
            </div>
            <p className="notice harsh">All 28 profiles load, but remaining shared-guide rows stay labeled until independently cross-checked.</p>
          </section>
        </aside>

        <section className="workspace">
          <div className="toolbar">
            <div>
              <p className="eyebrow">Gear Sheet</p>
              <h2>{race} {spec} {playerClass}</h2>
            </div>
            <div className="toolbar-actions">
              <button type="button" className="secondary" onClick={loadRecommended}>
                <Sword size={16} />
                {ownedOnly ? 'Recommend Owned' : 'Load Recommended'}
              </button>
              <button type="button" className="secondary" onClick={copyShareLink}>
                <Clipboard size={16} />
                {copied ? 'Copied' : 'Share'}
              </button>
            </div>
          </div>

          {warnings.length > 0 && (
            <div className="warnings">
              <AlertTriangle size={18} />
              <div>
                {warnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            </div>
          )}

          <div className="character-planner">
            <div className="paperdoll-column">
              {characterPaneSlots.left.map(renderGearSlot)}
            </div>

            <section className="paperdoll-stage" aria-label={`${race} ${spec} ${playerClass} character pane`}>
              <div className="character-orbit">
                <div className="character-portrait">
                  <div className="portrait-glow" />
                  <div className="race-token">{race.slice(0, 2).toUpperCase()}</div>
                  <div className="character-silhouette">
                    <span className="silhouette-head" />
                    <span className="silhouette-shoulders" />
                    <span className="silhouette-body" />
                    <span className="silhouette-legs" />
                  </div>
                </div>
              </div>
              <div className="character-readout">
                <span>Phase {phase} BiS view</span>
                <strong>{race} {spec} {playerClass}</strong>
                <small>{filledSlots}/{slots.length} slots filled • {guideBackedEquipped} guide-backed pieces equipped</small>
              </div>
              <details className="audit-strip" aria-label="Equipped source audit">
                <summary>Evidence & data quality</summary>
                <div className="audit-strip-grid">
                  {equippedAudit.map((entry) => (
                    <div key={entry.label}>
                      <span>{entry.label}</span>
                      <strong>{entry.value}</strong>
                    </div>
                  ))}
                </div>
              </details>
              {stageWarnings.length > 0 && (
                <div className="stage-warning-list" aria-label="Staged gear warnings">
                  {stageWarnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              )}
              <div className="weapon-row">
                {characterPaneSlots.weapons.map(renderGearSlot)}
              </div>
            </section>

            <div className="paperdoll-column">
              {characterPaneSlots.right.map(renderGearSlot)}
            </div>
          </div>

          <section className="import-sim-panel" aria-label="Gear import and simulation staging">
            <div className="import-box">
              <div>
                <p className="eyebrow">Import Gear</p>
                <h2>Paste Export or Item IDs</h2>
              </div>
              <textarea
                aria-label="Import gear from addon, WowSims, Wowhead, or item IDs"
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
                placeholder="Paste a gear export, WowSims text, Wowhead item list, or item IDs like 30189 30091 29996..."
              />
              <div className="toolbar-actions">
                <button type="button" className="secondary" onClick={stageImportedGear}>
                  <Clipboard size={16} />
                  Import Known Items
                </button>
                <button type="button" className="secondary" onClick={applyStagedImport} disabled={!importStage.some((entry) => entry.status === 'equippable')}>
                  <Check size={16} />
                  Apply Staged
                </button>
                <button type="button" className="secondary" onClick={() => {
                  setImportText('')
                  setImportStage([])
                  setImportNotice('Paste a WowSims/export text, addon output, or item IDs to stage owned gear.')
                }}>
                  <X size={16} />
                  Clear
                </button>
              </div>
              <p className="microcopy">{importNotice}</p>
              {importStage.length > 0 && (
                <div className="import-stage" aria-label="Staged import review">
                  {importStage.map((entry, index) => (
                    <div className={`import-stage-row ${entry.status}`} key={`${entry.id}-${index}`}>
                      <strong>{entry.item?.name ?? `Unknown item ${entry.id}`}</strong>
                      <span>{entry.slot ? `${entry.slot} • ` : ''}{entry.reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="sim-readiness">
              <div>
                <span>Gear</span>
                <strong>{filledSlots}/{slots.length}</strong>
                <small>slot coverage</small>
              </div>
              <div>
                <span>Sources</span>
                <strong>{guideBackedEquipped}</strong>
                <small>guide-backed equipped</small>
              </div>
              <div>
                <span>Sim</span>
                <strong>Queued</strong>
                <small>DPS/HPS/TPS engine later</small>
              </div>
            </div>
          </section>
        </section>

        <aside className="right-rail">
          <section className="panel item-picker">
            <div className="panel-heading">
              <Search size={18} />
              <h2>{selectedSlot} Picker</h2>
            </div>
            <label className="search-box">
              <Search size={16} />
              <input aria-label={`Search compatible ${selectedSlot} items`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search item, source, ID..." />
            </label>
            <button className={showFuture ? 'toggle active' : 'toggle'} type="button" onClick={() => setShowFuture((value) => !value)}>
              <Filter size={16} />
              Include future phases
            </button>
            <button className={ownedOnly ? 'toggle active' : 'toggle'} type="button" onClick={() => setOwnedOnly((value) => !value)}>
              <Filter size={16} />
              Owned gear only ({ownedItemIds.length})
            </button>
            <div className="rank-summary">
              <div>
                <span>Equipped rank</span>
                <strong>{selectedEquippedRank || 'None'}</strong>
              </div>
              <p>
                {selectedEquipped
                  ? `${selectedEquipped.name} is ranked #${selectedEquippedRank || 'outside'} for ${selectedSlot} with current filters.`
                  : `Choose an item to see where it ranks for ${selectedSlot}.`}
              </p>
            </div>
            <div className="item-list">
              {rankedItems.length === 0 ? (
                <p className="empty">No compatible items found for this slot and filter set.</p>
              ) : (
                rankedItems
                  .map(({ item }, index) => {
                    const ranking = bestRankingForContext(item, playerClass, spec, phase, selectedSlot)
                    return (
                    <article
                      className={gear[selectedSlot]?.id === item.id ? 'item-card equipped' : 'item-card'}
                      draggable
                      role="button"
                      tabIndex={0}
                      aria-label={`Preview ${item.name}, rank ${index + 1} for ${selectedSlot}`}
                      key={`${selectedSlot}-${item.id}`}
                      title={itemTooltip(item)}
                      onClick={() => openFocusedItem(item)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          openFocusedItem(item)
                        }
                      }}
                      onDragStart={(event) => event.dataTransfer.setData('item-id', String(item.id))}
                    >
                      <div>
                        <strong><span className="rank-token">#{index + 1}</span>{item.name}</strong>
                        <span>Item #{item.id} • Phase {item.phase} • {item.type}</span>
                      </div>
                      <div className="item-badges">
                        <span>Score {Math.round(itemScore(item))}</span>
                        <span className="source-badge">{guideProviderLabel(item, ranking)}</span>
                        <span className="confidence-badge">{confidenceLabel(item, ranking)}</span>
                        <span className="agreement-badge">{sourceAgreementLabel(item, ranking)}</span>
                        {ranking && <span className="guide-priority-badge">Spec-slot {ranking.label} #{ranking.rank}</span>}
                        {professionStateLabel(item, selectedProfessions) && (
                          <span className={professionBadgeClass(item, selectedProfessions)}>
                            {professionStateLabel(item, selectedProfessions)}
                          </span>
                        )}
                        {item.unique && <span>Unique</span>}
                        {ownedItemIds.includes(item.id) && <span>Owned</span>}
                        {gear[selectedSlot]?.id === item.id && <span>Equipped</span>}
                      </div>
                      <p>{item.source}</p>
                      <div className="stats">
                        {Object.entries(item.stats).map(([stat, value]) => (
                          <span key={stat}>{stat}: {value}</span>
                        ))}
                      </div>
                      {item.note && <small className="note">{item.note}</small>}
                      <div className="item-actions">
                        <button type="button" disabled={!canEquipItem(item)} onClick={() => equipItem(selectedSlot, item)}>
                          {equipButtonLabel(item)}
                        </button>
                        <button type="button" className="ghost-action" onClick={(event) => {
                          event.stopPropagation()
                          toggleOwnedItem(item)
                        }}>
                          {ownedItemIds.includes(item.id) ? 'Unmark owned' : 'Mark owned'}
                        </button>
                      </div>
                    </article>
                    )
                  })
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <Gem size={18} />
              <h2>Enhancement Plan</h2>
            </div>
            <div className="enhancement-priority">
              <span>Stat priority</span>
              <strong>{enhancementPlan.statPriority}</strong>
            </div>
            <div className="segmented" role="tablist" aria-label="Enhancement recommendations">
              <button
                className={enhancementView === 'enchants' ? 'active' : ''}
                type="button"
                role="tab"
                aria-selected={enhancementView === 'enchants'}
                onClick={() => setEnhancementView('enchants')}
              >
                <WandSparkles size={15} />
                Enchants
              </button>
              <button
                className={enhancementView === 'gems' ? 'active' : ''}
                type="button"
                role="tab"
                aria-selected={enhancementView === 'gems'}
                onClick={() => setEnhancementView('gems')}
              >
                <Gem size={15} />
                Gems
              </button>
            </div>
            <div className="enhancement-list" aria-label={`Phase 2 ${enhancementView} for ${spec} ${playerClass}`}>
              {visibleEnhancementGroups.map(([slotName, enhancements]) => (
                <section className="enhancement-group" key={slotName}>
                  <div className="enhancement-group-title">
                    <span>{slotName}</span>
                    <strong>{enhancements.length} option{enhancements.length === 1 ? '' : 's'}</strong>
                  </div>
                  {enhancements.map((enhancement) => (
                    <article className="enhancement-card" key={enhancement.id} title={enhancementTooltip(enhancement)}>
                      <div className="enhancement-card-head">
                        <span className={`tier-badge tier-${enhancement.tier.toLowerCase()}`}>{enhancement.tier}</span>
                        <div>
                          <strong>{enhancement.name}</strong>
                          <small>{enhancement.kind} • {enhancement.sourceType}</small>
                        </div>
                <a href={enhancement.sourceUrl} target="_blank" rel="noreferrer" aria-label={`Open source for ${enhancement.name}`}>
                          <ExternalLink size={15} />
                        </a>
                      </div>
                      <p>{enhancement.effect}</p>
                      <div className="item-badges">
                        <span>Tier {enhancement.tier}</span>
                        <span>{enhancement.learnedFrom}</span>
                        {enhancementRequirementLabel(enhancement) && (
                          <span className={enhancementRequirementClass(enhancement)}>
                            {enhancementRequirementLabel(enhancement)}
                          </span>
                        )}
                      </div>
                      {enhancement.activation && <p className="enhancement-detail">{enhancement.activation}</p>}
                      <div className="materials">
                        <strong>{enhancement.kind === 'Gem' ? 'Cut material' : 'Materials'}</strong>
                        <div className="material-source-list">
                          {enhancement.materials.map((material) => {
                            const source = getMaterialSource(material.name)
                            return (
                              <div className="material-source-row" key={`${enhancement.id}-${material.name}`}>
                                <span>{enhancementMaterialLabel(material)}</span>
                                {source ? (
                                  <>
                                    <small>{source.source}</small>
                                    {source.sourceUrl && (
                                      <a href={source.sourceUrl} target="_blank" rel="noreferrer" aria-label={`Open source for ${material.name}`}>
                                        <ExternalLink size={13} />
                                        Source
                                      </a>
                                    )}
                                  </>
                                ) : (
                                  <small>Source audit pending for this material.</small>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      {enhancement.note && <p className="note">{enhancement.note}</p>}
                    </article>
                  ))}
                </section>
              ))}
            </div>
            <div className="enhancement-notes">
              {enhancementPlan.notes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          </section>
        </aside>
      </section>

      {focusedItem && (
        <section className="item-popover" role="dialog" aria-modal="false" aria-label={`${focusedItem.name} ranking details`}>
          <div className="item-popover-header">
            <div>
              <p className="eyebrow">Item Ranking</p>
              <h2>{focusedItem.name}</h2>
            </div>
            <button className="icon-button" type="button" aria-label="Close item details" ref={closeButtonRef} onClick={closeFocusedItem}>
              <X size={18} />
            </button>
          </div>
          <div className="item-popover-score">
            <div>
              <Trophy size={18} />
              <span>Rank #{itemRank(focusedItem) ?? 'N/A'} for {selectedSlot}</span>
            </div>
            <strong>{Math.round(itemScore(focusedItem))}</strong>
          </div>
          <p>{focusedItem.source}</p>
          <div className="item-badges">
            <span className="source-badge">{guideProviderLabel(focusedItem, focusedRanking)}</span>
            <span className="confidence-badge">{confidenceLabel(focusedItem, focusedRanking)}</span>
            <span className="agreement-badge">{sourceAgreementLabel(focusedItem, focusedRanking)}</span>
            {guideMentionsForContext(focusedItem, playerClass, spec, phase).length > 0 && <span className="guide-priority-badge">Guide priority</span>}
            {focusedRanking && <span className="guide-priority-badge">Spec-slot {focusedRanking.label} #{focusedRanking.rank}</span>}
            {synergyForContext(focusedItem, playerClass, spec, phase, race).length > 0 && <span className="synergy-badge">Synergy-ranked</span>}
            {focusedItem.isAlternative && <span>Alternative</span>}
            {professionStateLabel(focusedItem, selectedProfessions) && (
              <span className={professionBadgeClass(focusedItem, selectedProfessions)}>
                {professionStateLabel(focusedItem, selectedProfessions)}
              </span>
            )}
          </div>
          {focusedItem.sourceUrl && (
            <a className="source-reference" href={focusedItem.sourceUrl} target="_blank">
              <ExternalLink size={14} />
              Open source record
            </a>
          )}
          {guideMentionsForContext(focusedItem, playerClass, spec, phase).length > 0 && (
            <div className="guide-mentions" aria-label={`${focusedItem.name} guide mentions`}>
              <strong>Guide mentions</strong>
              {guideMentionsForContext(focusedItem, playerClass, spec, phase).map((mention, index) => (
                <a href={mention.url} key={`${mention.provider}-${mention.spec}-${mention.phase}-${index}`} target="_blank">
                  <span>{mention.provider}</span>
                  <small>{mention.label ?? 'Listed'} · {mention.spec} · {mention.phase}</small>
                </a>
              ))}
            </div>
          )}
          {focusedRanking && (
            <div className="guide-mentions spec-ranking-record" aria-label={`${focusedItem.name} spec slot ranking`}>
              <strong>Spec ranking record</strong>
              <div>
                <span>{focusedRanking.class} {focusedRanking.spec} · {focusedRanking.slot}</span>
                <small>
                  {focusedRanking.label} rank {focusedRanking.rank} · {focusedRanking.guideProvider} · {focusedRanking.sourceAgreement}
                </small>
              </div>
              {focusedRanking.setBonusContext && synergyForContext(focusedItem, playerClass, spec, phase, race).length === 0 && (
                <div>
                  <span>Set context</span>
                  <small>{focusedRanking.setBonusContext}</small>
                </div>
              )}
            </div>
          )}
          {synergyForContext(focusedItem, playerClass, spec, phase, race).length > 0 && (
            <div className="guide-mentions synergy-mentions" aria-label={`${focusedItem.name} synergy notes`}>
              <strong>Synergy notes</strong>
              {synergyForContext(focusedItem, playerClass, spec, phase, race).map((synergy) => (
                <div key={`${synergy.class}-${synergy.spec}-${synergy.phase}-${synergy.label}`}>
                  <span>{synergy.spec}</span>
                  <small>{synergy.label}</small>
                </div>
              ))}
            </div>
          )}
          <div className="stats">
            {Object.entries(focusedItem.stats).map(([stat, value]) => (
              <span key={stat}>{stat}: {value}</span>
            ))}
          </div>
          {focusedItem.materials && (
            <div className="materials" aria-label={`${focusedItem.name} crafting materials`}>
              <strong>Crafting materials</strong>
              <span>{focusedItem.materials.map(materialLabel).join(', ')}</span>
            </div>
          )}
          {focusedItem.craftNote && <p className="notice">{focusedItem.craftNote}</p>}
          {focusedItem.planningNote && <p className="notice">{focusedItem.planningNote}</p>}
          <div className="ranking-list">
            {rankedItems.slice(0, 10).map(({ item, score }, index) => (
              <button
                className={item.id === focusedItem.id ? 'ranking-row active' : 'ranking-row'}
                key={item.id}
                type="button"
                onClick={() => openFocusedItem(item)}
              >
                <span>#{index + 1}</span>
                <strong>{item.name}</strong>
                <small>{Math.round(score)}</small>
              </button>
            ))}
          </div>
          <div className="popover-actions">
            <a href={`https://www.wowhead.com/tbc/item=${focusedItem.id}`} target="_blank">
              <ExternalLink size={16} />
              Wowhead
            </a>
            <button type="button" disabled={!canEquipItem(focusedItem)} onClick={() => equipItem(selectedSlot, focusedItem)}>
              <Check size={16} />
              {canEquipItem(focusedItem) ? `Equip to ${selectedSlot}` : equipButtonLabel(focusedItem)}
            </button>
            <button type="button" onClick={() => toggleOwnedItem(focusedItem)}>
              <Check size={16} />
              {ownedItemIds.includes(focusedItem.id) ? 'Unmark owned' : 'Mark owned'}
            </button>
          </div>
          <p className="popover-note">
            <Info size={14} />
            Guide priority and documented synergy rank first where available; role-weighted stats fill gaps. This is not yet a full simulation.
          </p>
        </section>
      )}
    </main>
  )
}

function Select({
  label,
  value,
  values,
  onChange,
}: {
  label: string
  value: string
  values: string[]
  onChange: (value: string) => void
}) {
  return (
    <label className="select-control">
      <span>{label}</span>
      <div>
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {values.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>
        <ChevronDown size={16} />
      </div>
    </label>
  )
}

export default App
