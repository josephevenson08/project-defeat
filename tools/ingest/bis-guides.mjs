// The Wowhead BiS guide pages this project ingests rankings from, and which specs each one covers.
//
// 25 guides for 27 specs. Two lists are genuinely shared: the three Rogue specs gear identically, and
// Discipline and Holy share one healing list. Both were confirmed rather than assumed — the
// spec-specific URLs for those (`rogue/combat/...`, `priest/holy/...`) answer 301 and redirect to the
// shared guide, while Arms and Fury, which the pre-raid index implies share a guide, turned out to
// have separate Phase 2 pages.
//
// The URL shape differs between phases: several classes publish a spec-less `<class>/dps-...` guide
// for pre-raid but only spec-specific ones for phase 2, so the pre-raid index is not a reliable
// source of phase-2 paths. Each page's title is checked against `expectSpec` at ingest time, so a
// silent Wowhead reshuffle fails loudly instead of mislabelling a list.

/**
 * @typedef {object} GuideDefinition
 * @property {string} path        Wowhead path, phase-2 variant.
 * @property {string} className   TBC class.
 * @property {string[]} specs     App specs this guide's rankings apply to.
 * @property {string} expectSpec  Spec name the page title must contain, as a sanity check.
 */

/** @type {GuideDefinition[]} */
export const BIS_GUIDES = [
  { path: 'druid/balance/dps-bis-gear-pve-phase-2', className: 'Druid', specs: ['Balance'], expectSpec: 'Balance' },
  { path: 'druid/feral/dps-bis-gear-pve-phase-2', className: 'Druid', specs: ['Feral'], expectSpec: 'Feral' },
  { path: 'druid/healer-bis-gear-pve-phase-2', className: 'Druid', specs: ['Restoration'], expectSpec: 'Restoration' },

  { path: 'hunter/beast-mastery/dps-bis-gear-pve-phase-2', className: 'Hunter', specs: ['Beast Mastery'], expectSpec: 'Beast Mastery' },
  { path: 'hunter/marksmanship/dps-bis-gear-pve-phase-2', className: 'Hunter', specs: ['Marksmanship'], expectSpec: 'Marksmanship' },
  { path: 'hunter/survival/dps-bis-gear-pve-phase-2', className: 'Hunter', specs: ['Survival'], expectSpec: 'Survival' },

  { path: 'mage/arcane/dps-bis-gear-pve-phase-2', className: 'Mage', specs: ['Arcane'], expectSpec: 'Arcane' },
  { path: 'mage/fire/dps-bis-gear-pve-phase-2', className: 'Mage', specs: ['Fire'], expectSpec: 'Fire' },
  { path: 'mage/frost/dps-bis-gear-pve-phase-2', className: 'Mage', specs: ['Frost'], expectSpec: 'Frost' },

  { path: 'paladin/holy/healer-bis-gear-pve-phase-2', className: 'Paladin', specs: ['Holy'], expectSpec: 'Holy' },
  { path: 'paladin/retribution/dps-bis-gear-pve-phase-2', className: 'Paladin', specs: ['Retribution'], expectSpec: 'Retribution' },
  { path: 'paladin/tank-bis-gear-pve-phase-2', className: 'Paladin', specs: ['Protection'], expectSpec: 'Protection' },

  // One healer guide for both healing Priest specs.
  { path: 'priest/healer-bis-gear-pve-phase-2', className: 'Priest', specs: ['Discipline', 'Holy'], expectSpec: 'Priest' },
  { path: 'priest/shadow/dps-bis-gear-pve-phase-2', className: 'Priest', specs: ['Shadow'], expectSpec: 'Shadow' },

  // All three Rogue specs share a single BiS list.
  { path: 'rogue/dps-bis-gear-pve-phase-2', className: 'Rogue', specs: ['Assassination', 'Combat', 'Subtlety'], expectSpec: 'Rogue' },

  { path: 'shaman/elemental/dps-bis-gear-pve-phase-2', className: 'Shaman', specs: ['Elemental'], expectSpec: 'Elemental' },
  { path: 'shaman/enhancement/dps-bis-gear-pve-phase-2', className: 'Shaman', specs: ['Enhancement'], expectSpec: 'Enhancement' },
  { path: 'shaman/healer-bis-gear-pve-phase-2', className: 'Shaman', specs: ['Restoration'], expectSpec: 'Restoration' },

  { path: 'warlock/affliction/dps-bis-gear-pve-phase-2', className: 'Warlock', specs: ['Affliction'], expectSpec: 'Affliction' },
  { path: 'warlock/demonology/dps-bis-gear-pve-phase-2', className: 'Warlock', specs: ['Demonology'], expectSpec: 'Demonology' },
  { path: 'warlock/destruction/dps-bis-gear-pve-phase-2', className: 'Warlock', specs: ['Destruction'], expectSpec: 'Destruction' },

  { path: 'warrior/arms/dps-bis-gear-pve-phase-2', className: 'Warrior', specs: ['Arms'], expectSpec: 'Arms' },
  { path: 'warrior/fury/dps-bis-gear-pve-phase-2', className: 'Warrior', specs: ['Fury'], expectSpec: 'Fury' },
  { path: 'warrior/protection/tank-bis-gear-pve-phase-2', className: 'Warrior', specs: ['Protection'], expectSpec: 'Protection' },
]

export const GUIDE_BASE = 'https://www.wowhead.com/tbc/guide/classes/'
