export type Phase2GuideStatus = 'audited' | 'shared' | 'needs-audit'

export type Phase2SpecGuide = {
  className: string
  spec: string
  roleLabel: string
  guideUrl: string
  status: Phase2GuideStatus
  rankingNotes: string[]
}

const guide = (
  className: string,
  spec: string,
  roleLabel: string,
  path: string,
  status: Phase2GuideStatus,
  rankingNotes: string[],
): Phase2SpecGuide => ({
  className,
  spec,
  roleLabel,
  guideUrl: `https://www.wowhead.com/tbc/guide/classes/${path}`,
  status,
  rankingNotes,
})

export const phase2SpecGuides: Phase2SpecGuide[] = [
  guide('Druid', 'Balance', 'Ranged DPS', 'druid/balance/dps-bis-gear-pve-phase-2', 'audited', [
    'Spell hit caps and raid support change several offset rankings.',
    'Tier and crafted caster pieces must be evaluated as complete sets.',
  ]),
  guide('Druid', 'Feral Bear', 'Tank', 'druid/feral/tank-bis-gear-pve-phase-2', 'audited', [
    'Threat, mitigation, and raid-DPS idol sets are separate valid loadouts.',
    'Armor and proc effects cannot be compared with one generic tank score.',
  ]),
  guide('Druid', 'Feral Cat', 'Melee DPS', 'druid/feral/dps-bis-gear-pve-phase-2', 'audited', [
    'Weapon damage is irrelevant in form; weapon stats and on-use effects drive ranking.',
    'Hit, expertise, powershifting, and set bonuses change offset choices.',
  ]),
  guide('Druid', 'Restoration', 'Healer', 'druid/healer-bis-gear-pve-phase-2', 'audited', [
    'Throughput and regeneration alternatives should remain separate.',
    'Idol and tier choices depend on the healing assignment.',
  ]),

  guide('Hunter', 'Beast Mastery', 'Ranged DPS', 'hunter/beast-mastery/dps-bis-gear-pve-phase-2', 'audited', [
    'Keep Beast Lord until the Rift Stalker four-piece transition is ready.',
    'Ranged weapon, ammo, quiver, pet scaling, and hit profile are linked.',
  ]),
  guide('Hunter', 'Marksmanship', 'Ranged DPS', 'hunter/marksmanship/dps-bis-gear-pve-phase-2', 'shared', [
    'Uses much of the Hunter Phase 2 catalog but needs its own hit and raid-utility ranking.',
    'Do not blindly copy Beast Mastery set-transition priorities.',
  ]),
  guide('Hunter', 'Survival', 'Ranged DPS / Utility', 'hunter/survival/dps-bis-gear-pve-phase-2', 'audited', [
    'Agility has raid-wide Expose Weakness value beyond personal DPS.',
    'Hit profiles and melee-weaving assumptions change weapon rankings.',
  ]),

  guide('Mage', 'Arcane', 'Ranged DPS', 'mage/arcane/dps-bis-gear-pve-phase-2', 'audited', [
    'Mana support and fight duration materially change the correct list.',
    'Tier 5 and tailoring set transitions must be modeled together.',
  ]),
  guide('Mage', 'Fire', 'Ranged DPS', 'mage/fire/dps-bis-gear-pve-phase-2', 'audited', [
    'Spell hit, crit, and fire-specific crafted bonuses drive rankings.',
    'Tailoring sets remain relevant even when individual raid pieces look larger.',
  ]),
  guide('Mage', 'Frost', 'Ranged DPS', 'mage/frost/dps-bis-gear-pve-phase-2', 'shared', [
    'Frost needs its own hit and spell-school priorities despite sharing caster drops.',
    'The guide list should be labeled lower-confidence until every slot is cross-checked.',
  ]),

  guide('Paladin', 'Holy', 'Healer', 'paladin/holy/healer-bis-gear-pve-phase-2', 'audited', [
    'Healing crit, throughput, and mana longevity produce multiple valid lists.',
    'The ranged slot must always remain a Libram.',
  ]),
  guide('Paladin', 'Protection', 'Tank', 'paladin/tank-bis-gear-pve-phase-2', 'audited', [
    'Threat and survivability sets are encounter-specific rather than one universal BiS.',
    'Defense, avoidance, spell power, block, and tier bonuses need conditional ranking.',
  ]),
  guide('Paladin', 'Retribution', 'Melee DPS / Utility', 'paladin/retribution/dps-bis-gear-pve-phase-2', 'audited', [
    'Weapon speed and seal behavior outweigh generic melee stat totals.',
    'The ranged slot must use a Retribution Libram.',
  ]),

  guide('Priest', 'Discipline', 'Healer / Utility', 'priest/healer-bis-gear-pve-phase-2', 'shared', [
    'Discipline shares the Priest healing catalog but values utility and mana differently.',
    'Throughput and regeneration alternatives should not be flattened.',
  ]),
  guide('Priest', 'Holy', 'Healer / Throughput', 'priest/healer-bis-gear-pve-phase-2', 'audited', [
    'Healing assignment determines throughput versus regeneration priorities.',
    'Spirit, MP5, and set bonuses need guide labels rather than one score.',
  ]),
  guide('Priest', 'Shadow', 'Ranged DPS / Mana Battery', 'priest/shadow/dps-bis-gear-pve-phase-2', 'audited', [
    'Spell hit and raid mana contribution alter personal-DPS rankings.',
    'Tailoring sets and tier bonuses require full-set comparison.',
  ]),

  guide('Rogue', 'Assassination', 'Melee DPS', 'rogue/dps-bis-gear-pve-phase-2', 'shared', [
    'Weapon type, poison assumptions, and hit profile differ from Combat.',
    'Shared Rogue armor must not imply shared weapon rankings.',
  ]),
  guide('Rogue', 'Combat', 'Melee DPS', 'rogue/dps-bis-gear-pve-phase-2', 'audited', [
    'Deathmantle four-piece drives chest, shoulder, and leg pairings.',
    'Weapon speed, expertise, hit, and proc uptime beat raw item totals.',
  ]),
  guide('Rogue', 'Subtlety', 'Melee DPS / PvP Focus', 'rogue/dps-bis-gear-pve-phase-2', 'needs-audit', [
    'Phase 2 PvE coverage is limited and must not inherit Combat rankings silently.',
    'PvP-oriented alternatives need an explicit context label.',
  ]),

  guide('Shaman', 'Elemental', 'Ranged DPS', 'shaman/elemental/dps-bis-gear-pve-phase-2', 'audited', [
    'Spell hit support, crit, totem choice, and tier bonuses alter rankings.',
    'The ranged slot must remain a Totem.',
  ]),
  guide('Shaman', 'Enhancement', 'Melee DPS / Utility', 'shaman/enhancement/dps-bis-gear-pve-phase-2', 'audited', [
    'Cataclysm four-piece, weapon synchronization, and racial weapon skill matter.',
    'The ranged slot must remain an Enhancement Totem.',
  ]),
  guide('Shaman', 'Restoration', 'Healer', 'shaman/healer-bis-gear-pve-phase-2', 'audited', [
    'Chain Heal throughput and mana regeneration produce different alternatives.',
    'The ranged slot must remain a healing Totem.',
  ]),

  guide('Warlock', 'Affliction', 'Ranged DPS', 'warlock/affliction/dps-bis-gear-pve-phase-2', 'audited', [
    'Spell hit, raid debuffs, and Voidheart/Corruptor set transitions matter.',
    'Generic caster scoring cannot represent DoT and pet contributions.',
  ]),
  guide('Warlock', 'Demonology', 'Ranged DPS', 'warlock/demonology/dps-bis-gear-pve-phase-2', 'shared', [
    'Pet scaling changes the value of stats and tier bonuses.',
    'Shared Warlock drops require Demonology-specific ranking reasons.',
  ]),
  guide('Warlock', 'Destruction', 'Ranged DPS', 'warlock/destruction/dps-bis-gear-pve-phase-2', 'audited', [
    'Shadow versus fire builds and spell hit profiles change multiple slots.',
    'Tier, tailoring, and proc trinkets require build-context ranking.',
  ]),

  guide('Warrior', 'Arms', 'Melee DPS', 'warrior/arms/dps-bis-gear-pve-phase-2', 'audited', [
    'Two-handed weapon damage, weapon specialization, and raid utility drive ranking.',
    'Blacksmithing weapon upgrades remain visible even without the profession selected.',
  ]),
  guide('Warrior', 'Fury', 'Melee DPS', 'warrior/fury/dps-bis-gear-pve-phase-2', 'audited', [
    'Dual-wield hit, expertise, weapon pairing, and haste procs are build-level concerns.',
    'Dragonstrike and racial weapon skill can change the correct pair.',
  ]),
  guide('Warrior', 'Protection', 'Tank', 'warrior/protection/tank-bis-gear-pve-phase-2', 'audited', [
    'Threat, mitigation, resistance, and block sets must remain distinct.',
    'Defense caps and encounter mechanics outrank a generic tank score.',
  ]),
]

export function getPhase2SpecGuide(className: string, spec: string) {
  return phase2SpecGuides.find((entry) => entry.className === className && entry.spec === spec)
}
