import type { BisList } from './bisTypes'

const guideUrl = 'https://www.wowhead.com/tbc/guide/classes/shaman/enhancement/dps-bis-gear-pve-phase-2'

export const enhancementShamanPhase2Bis: BisList = {
  id: 'enhancement-shaman-phase-2-starter',
  className: 'Shaman',
  spec: 'Enhancement',
  phase: 2,
  title: 'Enhancement Shaman Phase 2 Starter Ranked List',
  sourceName: 'Starter guide-structured sample inspired by Wowhead/WoWSims workflows',
  sourceUrl: guideUrl,
  entries: [
    { className: 'Shaman', spec: 'Enhancement', phase: 2, slot: 'Head', rank: 1, itemId: 'cataclysm-helm', wowItemId: 30190, recommendedGemIds: ['relentless-earthstorm-diamond', 'delicate-living-ruby'], notes: 'Tier package starter row; set bonuses should outrank raw-stat sorting.', sourceName: 'Wowhead-style guide sample', sourceUrl: guideUrl },
    { className: 'Shaman', spec: 'Enhancement', phase: 2, slot: 'Neck', rank: 1, itemId: 'telonicus-pendant-of-mayhem', wowItemId: 30017, notes: 'Physical DPS neck sample for Phase 2 planning.', sourceName: 'Wowhead-style guide sample', sourceUrl: guideUrl },
    { className: 'Shaman', spec: 'Enhancement', phase: 2, slot: 'Shoulders', rank: 1, itemId: 'shoulderpads-of-the-stranger', wowItemId: 30055, notes: 'Offset shoulder sample; used with Cataclysm set package assumptions.', sourceName: 'Wowhead-style guide sample', sourceUrl: guideUrl },
    { className: 'Shaman', spec: 'Enhancement', phase: 2, slot: 'Back', rank: 1, itemId: 'drape-of-the-dark-reavers', wowItemId: 28672, notes: 'Starter cloak row; verify final rank against current guide import later.', sourceName: 'Starter sample', sourceUrl: guideUrl },
    { className: 'Shaman', spec: 'Enhancement', phase: 2, slot: 'Chest', rank: 1, itemId: 'cataclysm-chestplate', wowItemId: 30185, recommendedGemIds: ['delicate-living-ruby', 'rigid-dawnstone', 'solid-star-of-elune'], notes: 'Tier 5 package sample.', sourceName: 'Wowhead-style guide sample', sourceUrl: guideUrl },
    { className: 'Shaman', spec: 'Enhancement', phase: 2, slot: 'Wrists', rank: 1, itemId: 'true-aim-stalker-bands', wowItemId: 30091, notes: 'Known Enhancement bracer proof-of-concept row.', sourceName: 'Wowhead-style guide sample', sourceUrl: guideUrl },
    { className: 'Shaman', spec: 'Enhancement', phase: 2, slot: 'Hands', rank: 1, itemId: 'cataclysm-gauntlets', wowItemId: 30189, notes: 'Tier 5 set package sample.', sourceName: 'Wowhead-style guide sample', sourceUrl: guideUrl },
    { className: 'Shaman', spec: 'Enhancement', phase: 2, slot: 'Waist', rank: 1, itemId: 'belt-of-one-hundred-deaths', wowItemId: 30106, notes: 'Physical DPS belt sample.', sourceName: 'Wowhead-style guide sample', sourceUrl: guideUrl },
    { className: 'Shaman', spec: 'Enhancement', phase: 2, slot: 'Legs', rank: 1, itemId: 'cataclysm-legplates', wowItemId: 30192, notes: 'Tier 5 package sample.', sourceName: 'Wowhead-style guide sample', sourceUrl: guideUrl },
    { className: 'Shaman', spec: 'Enhancement', phase: 2, slot: 'Feet', rank: 1, itemId: 'boots-of-utter-darkness', wowItemId: 30039, notes: 'Leatherworking profession option sample; profession gating comes later.', sourceName: 'Wowhead-style guide sample', sourceUrl: guideUrl },
    { className: 'Shaman', spec: 'Enhancement', phase: 2, slot: 'Finger 1', rank: 1, itemId: 'ring-of-a-thousand-marks', wowItemId: 28757, notes: 'Starter ring row; rank requires later source audit.', sourceName: 'Starter sample', sourceUrl: guideUrl },
    { className: 'Shaman', spec: 'Enhancement', phase: 2, slot: 'Finger 2', rank: 1, itemId: 'garonas-signet-ring', wowItemId: 28649, notes: 'Starter ring row; rank requires later source audit.', sourceName: 'Starter sample', sourceUrl: guideUrl },
    { className: 'Shaman', spec: 'Enhancement', phase: 2, slot: 'Trinket 1', rank: 1, itemId: 'dragonspine-trophy', wowItemId: 28830, notes: 'Known high-value physical DPS trinket sample.', sourceName: 'Wowhead-style guide sample', sourceUrl: guideUrl },
    { className: 'Shaman', spec: 'Enhancement', phase: 2, slot: 'Trinket 2', rank: 2, itemId: 'tsunami-talisman', wowItemId: 30627, notes: 'Physical DPS trinket sample; final rank requires guide reconciliation.', sourceName: 'Starter sample', sourceUrl: guideUrl },
    { className: 'Shaman', spec: 'Enhancement', phase: 2, slot: 'Main Hand', rank: 1, itemId: 'talon-of-the-phoenix', wowItemId: 32944, recommendedEnchantId: 'mongoose-main-hand', notes: 'Non-Orc weapon sample; race-specific weapon logic comes later.', sourceName: 'Wowhead-style guide sample', sourceUrl: guideUrl },
    { className: 'Shaman', spec: 'Enhancement', phase: 2, slot: 'Off Hand', rank: 1, itemId: 'rod-of-the-sun-king', wowItemId: 29996, notes: 'Off-hand weapon sample for Enhancement planning.', sourceName: 'Wowhead-style guide sample', sourceUrl: guideUrl },
    { className: 'Shaman', spec: 'Enhancement', phase: 2, slot: 'Ranged', rank: 1, itemId: 'practice-longbow', notes: 'Placeholder only; Shaman should generally use relic/totem support rather than physical ranged gear.', sourceName: 'Placeholder bridge row' },
    { className: 'Shaman', spec: 'Enhancement', phase: 2, slot: 'Relic', rank: 1, itemId: 'totem-of-the-astral-winds', wowItemId: 27815, notes: 'Enhancement Totem proof-of-concept row.', sourceName: 'Wowhead-style guide sample', sourceUrl: guideUrl },
  ],
}
