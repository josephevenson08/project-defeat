import { expect, test, type Page } from '@playwright/test'
import {
  afflictionWarlockPhase2Bis,
  arcaneMagePhase2Bis,
  armsWarriorPhase2Bis,
  assassinationRoguePhase2Bis,
  balanceDruidPhase2Bis,
  beastMasteryHunterPhase2Bis,
  combatRoguePhase2Bis,
  demonologyWarlockPhase2Bis,
  disciplinePriestPhase2Bis,
  destructionWarlockPhase2Bis,
  elementalShamanPhase2Bis,
  enhancementShamanPhase2Bis,
  feralDruidPhase2Bis,
  fireMagePhase2Bis,
  frostMagePhase2Bis,
  bisLists,
  furyWarriorPhase2Bis,
  getBisListForSpec,
  holyPaladinPhase2Bis,
  holyPriestPhase2Bis,
  marksmanshipHunterPhase2Bis,
  protectionPaladinPhase2Bis,
  protectionWarriorPhase2Bis,
  restorationDruidPhase2Bis,
  restorationShamanPhase2Bis,
  retributionPaladinPhase2Bis,
  shadowPriestPhase2Bis,
  subtletyRoguePhase2Bis,
  survivalHunterPhase2Bis,
} from '../src/domain/bis'
import { factions } from '../src/domain/character/races'
import { racesByClass, getClassesForRace, getRacesForClassAndFaction } from '../src/domain/character/races'
import type { BisList } from '../src/domain/bis'
import { getRoleForSpec, tbcClasses } from '../src/domain/character/tbcClasses'
import type { CharacterProfile, Faction, TbcClass, TbcRace, TbcSpec } from '../src/domain/character/characterTypes'
import { calculateStats } from '../src/features/stats/calculateStats'
import { calculateSimulation } from '../src/features/simulator/calculateSimulation'
import { calculateStatWeights } from '../src/features/simulator/calculateStatWeights'
import { getEnchantById } from '../src/domain/enchants/sampleEnchants'
import { deriveItemArmor } from '../src/domain/gear/armorValues'
import { getItemsForSlotAndCharacter } from '../src/domain/gear/characterItemRules'
import { gearSlots } from '../src/domain/gear/gearSlots'
import { getVisibleGearSlotsForSpec } from '../src/domain/gear/slotVisibility'
import { getSignatureAbility } from '../src/domain/abilities'
import { RATING_PER_PERCENT, effectUptime } from '../src/domain/simulation/combatConstants'
import { getBuffById, modelledBuffs, sampleBuffs, unmodelledBuffs } from '../src/domain/buffs/sampleBuffs'
import {
  buildDefenderAvoidanceBaseline,
  buildIncomingAttackTable,
  buildSpecialAttackTable,
  buildWhiteAttackTable,
  computeAttackerBaseCritChance,
} from '../src/domain/simulation/attackTable'
import {
  OFF_HAND_DAMAGE_PENALTY,
  averageSwingDamage,
  computeSpecialDamagePerUse,
} from '../src/domain/simulation/specialAttacks'
import { allItems, getItemById, getItemsForSlot } from '../src/domain/gear/itemCatalogue'
import { sampleItemSets } from '../src/domain/gear/itemSets'
import { getPairedGearSlots, isItemCompatibleWithGearSlot } from '../src/domain/gear/slotCompatibility'
import { normalizeGearForCharacter } from '../src/domain/gear/characterItemRules'
import { defaultGear } from '../src/domain/gear/defaultGear'

/*
 * Gear editing moved into a popup, so a slot's controls only exist while its overlay is open. These
 * helpers open the slot, act, and close again, which keeps the call sites in the tests one line long
 * and stops a stray open overlay from blocking the next click behind its backdrop.
 */

/**
 * Simulation lives on its own tab, so anything asserting on the simulator, the encounter settings,
 * stat weights or the upgrade finder has to go there first.
 */
/**
 * The app now opens on a section picker rather than landing inside a tab, so every test has to make
 * the same choice a user does before it can assert anything.
 *
 * Tests enter through Character Planner because that is where most of them work. The ones that want
 * Raids or Professions click the tab afterwards, which is also what a user would do — the picker is
 * a way in, not the only way to move between sections.
 */
async function openApp(page: Page, section: 'planner' | 'raids' | 'professions' = 'planner') {
  await page.goto('/')
  await page.getByTestId(`section-${section}`).click()

  // The planner runs character creation first, and every test starts with empty storage so it always
  // appears. The four steps open on the defaults — Alliance, Human, Warrior, Fury — which is the
  // character the suite has always assumed, so this walks through without choosing anything. Tests
  // that want a different character change it afterwards through the rail, exactly as before.
  if (section === 'planner') {
    for (let step = 0; step < 3; step++) await page.getByTestId('creator-next').click()
    await page.getByTestId('creator-confirm').click()
  }
}

async function openSimulationTab(page: Page) {
  // The tab is hidden from the app by default while the estimates are known to be wrong (see
  // src/featureFlags.ts). The math behind it is still worth testing, so these tests opt back in with
  // the URL override. The reload is safe because the build autosaves — gear and buffs set before
  // this point come back with it, which is what lets `readSimulationScore` be called mid-test.
  if ((await page.getByRole('button', { name: 'Simulation', exact: true }).count()) === 0) {
    const url = new URL(page.url())
    url.searchParams.set('simulation', '1')
    await page.goto(url.toString())
    // The reload drops back to the section picker, so re-enter before looking for the tab.
    await page.getByTestId('section-planner').click()
  }

  await page.getByRole('button', { name: 'Simulation', exact: true }).click()
  await expect(page.getByRole('heading', { name: /simulation/i }).first()).toBeVisible()
}

/**
 * Back to the planner. Several tests interleave the two — change a stat, read the result, change
 * another — so the switch has to work in both directions rather than once per test.
 */
async function openPlannerTab(page: Page) {
  await page.getByRole('button', { name: 'Character Planner', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Gear', exact: true })).toBeVisible()
}

/*
 * `readSimulationScore` lived here — run the simulation, read the score, return to the planner. Its
 * only caller was the buff-toggle test, which now works against `calculateStats` directly because
 * the Buffs & Consumables panel it used to click is no longer rendered. Reading a DPS number through
 * two tab switches was always the indirect way to assert that buffs reach the stat totals.
 */

/** Switches to the simulation tab and produces a fresh result there. */
async function runSimulation(page: Page) {
  await openSimulationTab(page)
  await page.getByRole('button', { name: /run simulation/i }).click()
}

/** The slot's row in the gear grid. Slot *presence* is now this button, not a select. */
function slotCell(page: Page, slot: string) {
  return page.getByRole('button', { name: `${slot} slot`, exact: true })
}

async function openSlot(page: Page, slot: string) {
  await slotCell(page, slot).click()
  await expect(page.getByRole('dialog')).toBeVisible()
}

async function closeSlot(page: Page) {
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
}

async function selectSlotItem(page: Page, slot: string, value: string) {
  await openSlot(page, slot)
  await page.getByLabel(slot, { exact: true }).selectOption(value)
  await closeSlot(page)
}

async function selectSlotEnchant(page: Page, slot: string, value: string) {
  await openSlot(page, slot)
  await page.getByLabel(`${slot} enchant`).selectOption(value)
  await closeSlot(page)
}

async function selectSlotGem(page: Page, slot: string, colour: string, value: string) {
  await openSlot(page, slot)
  await page.getByLabel(`${slot} ${colour} socket`).selectOption(value)
  await closeSlot(page)
}

/**
 * Runs the simulation for a spec straight through the domain, with no browser involved.
 *
 * The simulator is hidden from the UI (`isSimulationEnabled` in src/featureFlags.ts), but the findings asserted
 * with this are about the engine rather than the panels — cat form swinging its own weapon, specials
 * layering onto white damage — so they are worth keeping and belong against the functions directly.
 */
function simulateSpec(className: TbcClass, spec: TbcSpec, race: TbcRace, faction: Faction) {
  const character: CharacterProfile = { faction, race, className, spec }
  const gear = normalizeGearForCharacter(defaultGear, className, spec)
  const role = getRoleForSpec(className, spec)
  const stats = calculateStats(character, gear)
  return { character, gear, role, stats, result: calculateSimulation(character, gear, stats, role) }
}

/** Pulls one labelled row out of a simulation breakdown. */
function breakdownValue(result: { breakdown: readonly { label: string; value: number }[] }, label: RegExp) {
  return result.breakdown.find((entry) => label.test(entry.label))?.value
}

/**
 * Slots a spec legitimately has no ranking for, now that rankings come from the Wowhead guides rather
 * than from hand-written lists that filled every slot by construction.
 *
 * Feral druids and Retribution paladins swing two-handers, so an off-hand ranking would be
 * meaningless rather than missing. The Holy Paladin guide publishes no Libram section at all — that
 * one is a real gap in the source, recorded here rather than papered over with an invented pick.
 */
const RANKING_GAPS = new Set(['Druid|Feral|Off Hand', 'Paladin|Retribution|Off Hand', 'Paladin|Holy|Relic'])

/** Asserts a BiS list covers every slot its spec actually shows, bar the documented gaps above. */
function expectRankedSlotCoverage(list: BisList) {
  const ranked = new Set(list.entries.map((entry) => entry.slot))
  for (const slot of getVisibleGearSlotsForSpec(list.className, list.spec)) {
    if (RANKING_GAPS.has(`${list.className}|${list.spec}|${slot}`)) continue
    // A paired slot counts as ranked when its partner is: one "Trinkets" list serves both trinket
    // sockets, and the panel offers an equip button for each rather than repeating the list.
    const covered = getPairedGearSlots(slot).some((paired) => ranked.has(paired))
    expect(covered, `missing ${list.spec} ${list.className} ranking for ${slot}`).toBe(true)
  }
}

/** Runs assertions against a slot's open popup, then closes it. */
async function withSlotOpen(page: Page, slot: string, assertions: () => Promise<void>) {
  await openSlot(page, slot)
  await assertions()
  await closeSlot(page)
}
import { getGemById } from '../src/domain/gems/sampleGems'
import { sampleRaidBosses } from '../src/domain/raids/sampleRaidBosses'
import { sampleRaids } from '../src/domain/raids/sampleRaids'


function readStatValue(text: string) {
  const match = text.match(/-?\d+/)
  return match ? Number(match[0]) : 0
}

test('user can run a basic local physical DPS simulation', async ({ page }) => {
  await openApp(page)

  await expect(page.getByRole('heading', { name: /project defeat/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /character/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Gear', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: /stats/i })).toBeVisible()
  // Simulation is deliberately NOT offered: the tab is hidden while its estimates are known to be
  // wrong (src/featureFlags.ts). Asserted as absent rather than simply dropped, so that un-hiding it
  // is a decision someone makes on purpose rather than something that drifts back in.
  await expect(page.getByRole('button', { name: 'Simulation', exact: true })).toHaveCount(0)

  await expect(page.getByLabel('Class')).toHaveValue('Warrior')
  await expect(page.getByLabel('Specialization')).toHaveValue('Fury')
  // Deliberately not pinned to a specific item. The default is whichever legal item the catalogue
  // offers first, which legitimately moves whenever the catalogue is re-ingested; what this test
  // actually cares about is that a legal weapon is equipped at all.
  await withSlotOpen(page, 'Main Hand', async () => {
    await expect(page.getByLabel('Main Hand', { exact: true })).not.toHaveValue('')
  })

  // Regression check: Warriors have no Relic slot, and the default gear should not silently
  // inherit phantom spell/healing power from an illegally-equipped Totem/Libram/Idol.
  await expect(slotCell(page, 'Relic')).toHaveCount(0)
  // This used to assert zero spell power on the page. That stopped isolating the bug it was written
  // for once the catalogue grew to ~4,500 items: the first legal item for a slot can now be a caster
  // piece a warrior may legitimately wear, so a non-zero reading is no longer evidence of anything.
  // The real invariant — no relic ever reaches a warrior's gear — is asserted against the domain.
  // Warriors do legitimately hold the zero-stat "No Relic Recommended" placeholder, so the invariant
  // is not "no relic" but "no stats from a relic" — a real totem/libram/idol must never survive here.
  const warriorDefaults = normalizeGearForCharacter(defaultGear, 'Warrior', 'Fury')
  const relicStats = Object.values(warriorDefaults)
    .filter((slot) => slot.item.armorType === 'Relic')
    .flatMap((slot) => Object.values(slot.item.stats ?? {}))
    .filter((value) => value !== 0)
  expect(relicStats, 'a warrior must not inherit stats from a totem/libram/idol').toEqual([])

  // And the simulation itself still runs for the default character.
  await openSimulationTab(page)
  await page.getByRole('button', { name: /run simulation/i }).click()
  await expect(page.getByText(/estimated dps/i)).toBeVisible()
  await expect(page.getByTestId('simulation-score')).toContainText(/\d/)
})

test('class, faction, race, gems, and caster simulation flow work', async ({ page }) => {
  await openApp(page)

  await page.getByLabel('Faction').selectOption('Horde')
  await expect(page.getByRole('combobox', { name: 'Race' })).toHaveValue('Orc')
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Blood Elf')
  await page.getByLabel('Class').selectOption('Mage')
  await expect(page.getByLabel('Specialization')).toHaveValue('Arcane')
  await page.getByLabel('Specialization').selectOption('Fire')

  // The panel used to restate the character as "Blood Elf Fire Mage" under the selects. That summary
  // has been removed, so the selects themselves are the record of what was chosen — and they are the
  // thing the rest of this test depends on being right.
  await expect(page.getByRole('combobox', { name: 'Race' })).toHaveValue('Blood Elf')
  await expect(page.getByLabel('Class')).toHaveValue('Mage')
  await expect(page.getByLabel('Specialization')).toHaveValue('Fire')

  await selectSlotItem(page, 'Chest', 'spellfire-training-robe')
  await selectSlotItem(page, 'Main Hand', 'apprentice-focus-staff')
  // Equip a head piece known to have a red socket rather than assuming the default one does — the
  // default moved when the catalogue was re-ingested, and socketing is the point of this test.
  await selectSlotItem(page, 'Head', 'flamebane-helm')
  await selectSlotGem(page, 'Head', 'Red', 'Runed Living Ruby')
  await selectSlotEnchant(page, 'Head', 'Glyph of Power')

  // The rail is always on screen; the simulation result is a tab away.
  await expect(page.getByTestId('stat-spell-power')).toBeVisible()
  await runSimulation(page)
  await expect(page.getByText(/Estimated DPS/i)).toBeVisible()
  await expect(page.getByText(/Spell hit\/crit table/i)).toBeVisible()
  await expect(page.getByText('Spell power scaling', { exact: true })).toBeVisible()
})

test('healer and tank roles produce role-specific results', async ({ page }) => {
  await openApp(page)

  await page.getByLabel('Class').selectOption('Priest')
  await expect(page.getByLabel('Specialization')).toHaveValue('Discipline')
  await page.getByLabel('Specialization').selectOption('Holy')
  await selectSlotItem(page, 'Hands', 'healers-grace-gloves')
  await selectSlotEnchant(page, 'Hands', 'Gloves - Major Healing')

  // Gear on the planner, results on the simulation tab, and back again for the tank half.
  await runSimulation(page)
  await expect(page.getByText(/Estimated Healing/i)).toBeVisible()
  await expect(page.getByText(/Heal crit\/haste estimate/i)).toBeVisible()

  await openPlannerTab(page)
  await page.getByLabel('Class').selectOption('Paladin')
  await page.getByLabel('Specialization').selectOption('Protection')
  await selectSlotItem(page, 'Chest', 'bulwark-chestguard')
    // Aldori Legacy Defender rather than Shield of Rehearsal: the latter cannot be located in
  // Wowhead's TBC database at all, so a test asserting real block mechanics should not rest on it.
  await selectSlotItem(page, 'Off Hand', 'aldori-legacy-defender')

  await runSimulation(page)

  // The tank path has to use the *defender-side* base chances. It previously reused the
  // attacker-side formulas symmetrically, which handed the player the boss's own 14% parry and made
  // a bigger level gap *raise* the player's avoidance.
  await expect(page.getByText(/defender-side base chances/i)).toBeVisible()

  // Avoidance is broken out per outcome rather than lumped into one number, so a wrong term can be
  // seen rather than hiding inside a total.
  const tankBreakdown = page.locator('.breakdown-list')
  await expect(tankBreakdown).toContainText(/Dodge/i)
  await expect(tankBreakdown).toContainText(/Boss miss chance/i)

  // A Paladin with the shield equipped above must have both parry and block credited — those are
  // gated on class and on actually holding a shield.
  await expect(tankBreakdown).not.toContainText(/cannot parry/i)
  await expect(tankBreakdown).not.toContainText(/no shield equipped/i)

  // Range sanity. The tank model has now been rewritten twice, and the failure mode of a bad
  // avoidance term is not a missing row — it is a plausible-looking row with an impossible number in
  // it. These are invariants of the mechanic, not of any particular model, so they should hold
  // through future changes too.
  const percentRow = async (label: RegExp) => {
    const text = await tankBreakdown.locator('div', { hasText: label }).first().innerText()
    return Number(text.match(/(-?[\d.]+)\s*%?\s*$/)?.[1] ?? 'NaN')
  }

  const totalAvoidance = await percentRow(/Total avoidance/i)
  expect(totalAvoidance).toBeGreaterThan(0)
  // One swing produces one outcome, so avoidance cannot exceed the whole roll.
  expect(totalAvoidance).toBeLessThanOrEqual(100)

  // Crushing blows are a flat 15% at most, and only what survives the rest of the ordered table.
  const crushing = await percentRow(/Crushing blows/i)
  expect(crushing).toBeGreaterThanOrEqual(0)
  expect(crushing).toBeLessThanOrEqual(15)

  // A swing that lands can crit for 2x, so this can exceed 100% — but not by an order of magnitude,
  // and it can never be negative.
  const perSwing = await percentRow(/Damage taken per swing/i)
  expect(perSwing).toBeGreaterThan(0)
  expect(perSwing).toBeLessThan(200)

  // Effective Health is health divided by the fraction of a swing that actually lands, so it must
  // come out at least as large as the health itself — mitigation and avoidance can only stretch a
  // health pool, never shrink it. If this ever inverts, the multiplier has been applied upside down.
  const healthFromStamina = await percentRow(/Health from Stamina/i)
  const effectiveHealth = Number(await page.getByTestId('simulation-score').innerText())
  expect(healthFromStamina).toBeGreaterThan(0)
  expect(effectiveHealth).toBeGreaterThanOrEqual(healthFromStamina)
})

test('expanded gear foundation has multiple options for every slot', async ({ page }) => {
  await openApp(page)

  // Default character is Warrior/Fury, which has no Relic slot in TBC (only Shaman/Paladin/Druid do),
  // so ask the domain which slots are actually rendered rather than hardcoding the exception.
  const visibleSlotsForDefaultCharacter = getVisibleGearSlotsForSpec('Warrior', 'Fury')

  for (const slot of gearSlots) {
    const itemOptions = getItemsForSlot(slot)
    expect(itemOptions.length, `${slot} should have multiple data options`).toBeGreaterThan(1)
  }

  // Every visible slot must render a cell, and opening one must offer real options. The exhaustive
  // per-slot check is the domain loop above; repeating it through 16 popup open/close cycles would
  // cost about five seconds to re-prove the same thing.
  for (const slot of visibleSlotsForDefaultCharacter) {
    await expect(slotCell(page, slot), `${slot} should render a gear cell`).toHaveCount(1)
  }

  await withSlotOpen(page, 'Chest', async () => {
    await expect(page.getByLabel('Chest', { exact: true }).locator('option')).not.toHaveCount(0)
  })
})

test('Enhancement Shaman Phase 2 starter ranking resolves to catalog items', async () => {
  expectRankedSlotCoverage(enhancementShamanPhase2Bis)

  for (const entry of enhancementShamanPhase2Bis.entries) {
    const item = getItemById(entry.itemId)
    expect(item, `${entry.itemId} should exist in the item catalogue`).toBeTruthy()
    expect(item && isItemCompatibleWithGearSlot(item, entry.slot), `${entry.itemId} should fit ${entry.slot}`).toBe(true)
    if (entry.wowItemId) expect(item?.wowItemId).toBe(entry.wowItemId)
  }

  expect(getItemById('cataclysm-helm')?.notes).toMatch(/set-bonus/i)
  expect(getItemById('true-aim-stalker-bands')?.slot).toBe('Wrists')
  expect(getItemById('dragonstrike')?.craftedBy).toBe('Blacksmithing')
  expect(getItemById('totem-of-the-astral-winds')?.allowedClasses).toContain('Shaman')
})

test('Enhancement Shaman can pick expanded Phase 2 options and still simulate', async ({ page }) => {
  await openApp(page)

  await page.getByLabel('Faction').selectOption('Horde')
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Troll')
  await page.getByLabel('Class').selectOption('Shaman')
  await page.getByLabel('Specialization').selectOption('Enhancement')

  const before = readStatValue(await page.getByTestId('stat-attack-power').innerText())

  await selectSlotItem(page, 'Head', 'cataclysm-helm')
  await selectSlotItem(page, 'Wrists', 'true-aim-stalker-bands')
  await selectSlotItem(page, 'Main Hand', 'talon-of-the-phoenix')
  await selectSlotItem(page, 'Off Hand', 'rod-of-the-sun-king')
  await selectSlotItem(page, 'Totem', 'totem-of-the-astral-winds')

  await withSlotOpen(page, 'Main Hand', async () => {
    await expect(page.getByLabel('Main Hand', { exact: true })).toHaveValue('talon-of-the-phoenix')
  })
  await withSlotOpen(page, 'Main Hand', async () => {
    await expect(page.getByLabel('Main Hand', { exact: true }).locator('option', { hasText: 'Dragonstrike' })).toHaveCount(1)
  })

  // Not "greater than": the starting gear is now the highest item level the catalogue offers for each
  // slot, so deliberately equipping a specific Tier 5 set piece can legitimately lower a stat. What
  // has to hold is that the picks reach the stat pipeline at all.
  const after = readStatValue(await page.getByTestId('stat-attack-power').innerText())
  expect(after).toBeGreaterThan(0)
  expect(after, 'equipping five different items must move attack power').not.toBe(before)
})

test('Enhancement Shaman filters gear, relics, enchants, and source details by spec', async ({ page }) => {
  await openApp(page)

  await page.getByLabel('Faction').selectOption('Horde')
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Troll')
  await page.getByLabel('Class').selectOption('Shaman')
  await page.getByLabel('Specialization').selectOption('Enhancement')

  await withSlotOpen(page, 'Off Hand', async () => {
    await expect(page.getByLabel('Off Hand', { exact: true }).locator('option', { hasText: 'Rod of the Sun King' })).toHaveCount(1)
  })
  await withSlotOpen(page, 'Off Hand', async () => {
    await expect(page.getByLabel('Off Hand', { exact: true }).locator('option', { hasText: 'Shield of Rehearsal' })).toHaveCount(0)
  })

  await withSlotOpen(page, 'Main Hand', async () => {
    await expect(page.getByLabel('Main Hand enchant')).toContainText('Weapon - Mongoose')
  })
  await withSlotOpen(page, 'Off Hand', async () => {
    await expect(page.getByLabel('Off Hand enchant')).toContainText('Weapon - Mongoose')
  })
  await withSlotOpen(page, 'Off Hand', async () => {
    await expect(page.getByLabel('Off Hand enchant')).not.toContainText('Shield - Major Stamina')
  })

  await expect(slotCell(page, 'Ranged')).toHaveCount(0)
  await expect(page.getByText('No Ranged Weapon Recommended')).toHaveCount(0)

  await withSlotOpen(page, 'Totem', async () => {
    await expect(page.getByLabel('Totem', { exact: true }).locator('option', { hasText: 'Totem of the Astral Winds' })).toHaveCount(1)
  })
  await withSlotOpen(page, 'Totem', async () => {
    await expect(page.getByLabel('Totem', { exact: true }).locator('option', { hasText: 'Idol of Testing' })).toHaveCount(0)
  })
  await withSlotOpen(page, 'Totem', async () => {
    await expect(page.getByLabel('Totem', { exact: true }).locator('option', { hasText: 'Libram of Testing' })).toHaveCount(0)
  })
  await expect(page.getByRole('heading', { name: 'Totem', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Ranged', exact: true })).toHaveCount(0)

  await expect(page.getByText('Serpentshrine Cavern · Leotheras the Blind · Phase 2')).toBeVisible()
  await expect(page.getByText(/Needs source\/rank verification/i).first()).toBeVisible()
})

test('BiS panel shows Enhancement Shaman rankings and equips a listed item', async ({ page }) => {
  await openApp(page)

  await expect(page.getByRole('heading', { name: /BiS \/ Ranked Gear/i })).toBeVisible()

  await page.getByLabel('Faction').selectOption('Horde')
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Troll')
  await page.getByLabel('Class').selectOption('Shaman')
  await page.getByLabel('Specialization').selectOption('Enhancement')

  await expect(page.getByTestId('bis-panel')).toBeVisible()
  await expect(page.getByText('Enhancement Shaman Phase 2 Ranked List')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Head', exact: true })).toBeVisible()
  await expect(page.getByTestId('bis-panel').getByRole('heading', { name: 'Cataclysm Helm' })).toBeVisible()
  await expect(page.getByText(/Item ID 30190/i)).toBeVisible()

  const before = readStatValue(await page.getByTestId('stat-attack-power').innerText())
  await page.getByRole('button', { name: /Equip Cataclysm Helm/i }).click()

  await withSlotOpen(page, 'Head', async () => {
    await expect(page.getByLabel('Head', { exact: true })).toHaveValue('cataclysm-helm')
  })
  await expect(page.getByRole('button', { name: /Equipped/i }).first()).toBeDisabled()

  const after = readStatValue(await page.getByTestId('stat-attack-power').innerText())
  expect(after).toBeGreaterThan(before)
})

test('BiS panel can equip paired trinket targets without duplicating unique items', async ({ page }) => {
  await openApp(page)

  await page.getByLabel('Faction').selectOption('Horde')
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Troll')
  await page.getByLabel('Class').selectOption('Shaman')
  await page.getByLabel('Specialization').selectOption('Enhancement')

  // One row per trinket: the ranking is not duplicated across Trinket 1 and Trinket 2, because each
  // row already carries an equip button for both sockets.
  const dragonspineRow = page.locator('.bis-entry', { hasText: 'Dragonspine Trophy' })
  const bloodlustRow = page.locator('.bis-entry', { hasText: 'Bloodlust Brooch' })

  await dragonspineRow.getByRole('button', { name: 'Equip Trinket 1' }).click()
  await withSlotOpen(page, 'Trinket 1', async () => {
    await expect(page.getByLabel('Trinket 1', { exact: true })).toHaveValue('dragonspine-trophy')
  })
  await expect(dragonspineRow.getByRole('button', { name: 'Unique equipped' })).toBeDisabled()

  await bloodlustRow.getByRole('button', { name: 'Equip Trinket 2' }).click()
  await withSlotOpen(page, 'Trinket 2', async () => {
    await expect(page.getByLabel('Trinket 2', { exact: true })).toHaveValue('bloodlust-brooch')
  })
})

test('paired ring and trinket slots share compatible options and block duplicate unique items', async ({ page }) => {
  await openApp(page)

  await withSlotOpen(page, 'Trinket 1', async () => {
    await expect(page.getByLabel('Trinket 1', { exact: true }).locator('option', { hasText: 'Dragonspine Trophy' })).toHaveCount(1)
  })
  await withSlotOpen(page, 'Trinket 2', async () => {
    await expect(page.getByLabel('Trinket 2', { exact: true }).locator('option', { hasText: 'Dragonspine Trophy' })).toHaveCount(1)
  })
  await withSlotOpen(page, 'Trinket 1', async () => {
    await expect(page.getByLabel('Trinket 1', { exact: true }).locator('option', { hasText: 'Bloodlust Brooch' })).toHaveCount(1)
  })
  await withSlotOpen(page, 'Trinket 2', async () => {
    await expect(page.getByLabel('Trinket 2', { exact: true }).locator('option', { hasText: 'Bloodlust Brooch' })).toHaveCount(1)
  })

  await selectSlotItem(page, 'Trinket 1', 'dragonspine-trophy')
  await withSlotOpen(page, 'Trinket 2', async () => {
    await expect(page.getByLabel('Trinket 2', { exact: true }).locator('option[value="dragonspine-trophy"]')).toHaveAttribute('disabled', '')
  })
  await selectSlotItem(page, 'Trinket 2', 'bloodlust-brooch')

  await withSlotOpen(page, 'Trinket 1', async () => {
    await expect(page.getByLabel('Trinket 1', { exact: true })).toHaveValue('dragonspine-trophy')
  })
  await withSlotOpen(page, 'Trinket 2', async () => {
    await expect(page.getByLabel('Trinket 2', { exact: true })).toHaveValue('bloodlust-brooch')
  })

  await withSlotOpen(page, 'Finger 1', async () => {
    await expect(page.getByLabel('Finger 1', { exact: true }).locator('option', { hasText: 'Ring of a Thousand Marks' })).toHaveCount(1)
  })
  await withSlotOpen(page, 'Finger 2', async () => {
    await expect(page.getByLabel('Finger 2', { exact: true }).locator('option', { hasText: 'Ring of a Thousand Marks' })).toHaveCount(1)
  })

  await selectSlotItem(page, 'Finger 1', 'ring-of-a-thousand-marks')
  await withSlotOpen(page, 'Finger 2', async () => {
    await expect(page.getByLabel('Finger 2', { exact: true }).locator('option[value="ring-of-a-thousand-marks"]')).toHaveAttribute('disabled', '')
  })
  await selectSlotItem(page, 'Finger 2', 'garonas-signet-ring')

  await withSlotOpen(page, 'Finger 1', async () => {
    await expect(page.getByLabel('Finger 1', { exact: true })).toHaveValue('ring-of-a-thousand-marks')
  })
  await withSlotOpen(page, 'Finger 2', async () => {
    await expect(page.getByLabel('Finger 2', { exact: true })).toHaveValue('garonas-signet-ring')
  })
})

test('Elemental and Restoration Shaman Phase 2 starter rankings resolve to catalog items', async () => {
  for (const bisList of [elementalShamanPhase2Bis, restorationShamanPhase2Bis]) {
    expectRankedSlotCoverage(bisList)

    for (const entry of bisList.entries) {
      const item = getItemById(entry.itemId)
      expect(item, `${entry.itemId} should exist in the item catalogue`).toBeTruthy()
      expect(item && isItemCompatibleWithGearSlot(item, entry.slot), `${entry.itemId} should fit ${entry.slot}`).toBe(true)
      if (entry.wowItemId) expect(item?.wowItemId).toBe(entry.wowItemId)
    }
  }
})

test('every class has a legal race in both factions, and every race maps back to its classes', async () => {
  for (const { className } of tbcClasses) {
    for (const faction of factions) {
      expect(getRacesForClassAndFaction(className, faction).length, `${className} should have a legal race in ${faction}`).toBeGreaterThan(0)
    }
  }

  for (const [className, races] of Object.entries(racesByClass)) {
    for (const race of races) {
      expect(getClassesForRace(race), `${race} should list ${className} as playable`).toContain(className)
    }
  }
})

test('Arms, Fury, and Protection Warrior Phase 2 starter rankings resolve to catalog items', async () => {
  for (const bisList of [armsWarriorPhase2Bis, furyWarriorPhase2Bis, protectionWarriorPhase2Bis]) {
    // Warriors have no Relic slot in TBC, so only the other 17 slots are expected to be ranked.
    expectRankedSlotCoverage(bisList)

    for (const entry of bisList.entries) {
      const item = getItemById(entry.itemId)
      expect(item, `${entry.itemId} should exist in the item catalogue`).toBeTruthy()
      expect(item && isItemCompatibleWithGearSlot(item, entry.slot), `${entry.itemId} should fit ${entry.slot}`).toBe(true)
      if (entry.wowItemId) expect(item?.wowItemId).toBe(entry.wowItemId)
    }
  }
})

test('race/class selection enforces real TBC legality in the UI', async ({ page }) => {
  await openApp(page)

  // Default is Alliance/Human; Human cannot be a Shaman, so Shaman should not be a selectable class yet.
  await expect(page.getByLabel('Class').locator('option', { hasText: 'Shaman' })).toHaveCount(0)

  await page.getByRole('combobox', { name: 'Race' }).selectOption('Draenei')
  await expect(page.getByLabel('Class').locator('option', { hasText: 'Shaman' })).toHaveCount(1)

  await page.getByLabel('Class').selectOption('Shaman')
  await expect(page.getByLabel('Specialization')).toHaveValue('Elemental')

  // Switching faction should keep the class legal by picking a valid race for it (Draenei -> Horde has no Draenei,
  // so it should land on a Horde race that can still be a Shaman: Orc, Tauren, or Troll).
  await page.getByLabel('Faction').selectOption('Horde')
  await expect(page.getByRole('combobox', { name: 'Race' })).toHaveValue(/Orc|Tauren|Troll/)
  await expect(page.getByLabel('Class')).toHaveValue('Shaman')
})

test('crafted items show recipe source, required skill, and material farm locations', async ({ page }) => {
  await openApp(page)

  await page.getByLabel('Class').selectOption('Mage')
  await selectSlotItem(page, 'Chest', 'spellfire-training-robe')

  await openSlot(page, 'Chest')
  const craftingDetails = page.getByLabel('Chest crafting details')
  await expect(craftingDetails).toContainText('Tailoring')
  await expect(craftingDetails).toContainText('350 skill')
  await expect(craftingDetails).toContainText('Spellfire Tailoring')
  await expect(craftingDetails).toContainText('Gidge Spellweave')
  await expect(craftingDetails).toContainText('4x Spellcloth')
  await expect(craftingDetails).toContainText('Primal Mana')
})

test('item quality renders with the standard WoW rarity color', async ({ page }) => {
  await openApp(page)

  await page.getByLabel('Faction').selectOption('Horde')
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Troll')
  await page.getByLabel('Class').selectOption('Shaman')
  await page.getByLabel('Specialization').selectOption('Enhancement')
  await selectSlotItem(page, 'Head', 'cataclysm-helm')

  // Quality is carried by colour on the item name itself now, rather than spelled out in a caption.
  // That is the whole reason quality is the one chromatic signal left in the interface, so the colour
  // is the assertion that matters.
  const itemName = page.getByRole('button', { name: 'Head slot', exact: true }).locator('.gear-item-name')
  await expect(itemName).toHaveText('Cataclysm Helm')
  await expect(itemName).toHaveCSS('color', 'rgb(163, 53, 238)')
})

test('character role sets a distinct accent color across Character, Stats, and Simulator panels', async ({ page }) => {
  await openApp(page)

  // The accents are the muted set now. They were amber-500/violet-500/teal-400/blue-400, which
  // competed with epic purple and rare blue for attention; role is real information, but item quality
  // has to stay the loudest colour on screen. Values come from roleAccentColors.
  const physicalDps = 'rgb(156, 115, 70)'
  const healer = 'rgb(77, 138, 128)'

  await expect(page.getByRole('region', { name: 'Character' })).toHaveCSS('border-top-color', physicalDps)

  await page.getByLabel('Class').selectOption('Priest')
  await page.getByLabel('Specialization').selectOption('Holy')

  // Holy Priest is a Healer, and the accent carries to the rail and the simulator too.
  await expect(page.getByRole('region', { name: 'Character' })).toHaveCSS('border-top-color', healer)
  // The rail is deliberately not accented — it is chrome, not a panel, and an accent bar down the
  // side of the whole app would be the loudest thing on screen.

  await openSimulationTab(page)
  await expect(page.getByRole('region', { name: 'Simulation' })).toHaveCSS('border-top-color', healer)
})

test('Elemental and Restoration Shaman get Totem/Ranged spec-aware slot treatment and their own BiS list', async ({ page }) => {
  await openApp(page)

  await page.getByLabel('Faction').selectOption('Horde')
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Troll')
  await page.getByLabel('Class').selectOption('Shaman')
  await page.getByLabel('Specialization').selectOption('Elemental')

  await expect(slotCell(page, 'Ranged')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Totem', exact: true })).toBeVisible()
  await expect(page.getByText('Elemental Shaman Phase 2 Ranked List')).toBeVisible()
  await withSlotOpen(page, 'Main Hand', async () => {
    await expect(page.getByLabel('Main Hand', { exact: true }).locator('option', { hasText: 'The Nexus Key' })).toHaveCount(1)
  })

  await page.getByLabel('Specialization').selectOption('Restoration')

  await expect(slotCell(page, 'Ranged')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Totem', exact: true })).toBeVisible()
  await expect(page.getByText('Restoration Shaman Phase 2 Ranked List')).toBeVisible()
  await withSlotOpen(page, 'Off Hand', async () => {
    await expect(page.getByLabel('Off Hand', { exact: true }).locator('option', { hasText: 'Aegis of the Vindicator' })).toHaveCount(1)
  })
  await withSlotOpen(page, 'Off Hand', async () => {
    await expect(page.getByLabel('Off Hand', { exact: true }).locator('option', { hasText: 'Rod of the Sun King' })).toHaveCount(0)
  })
})

test('Warrior specs hide the Relic slot and each get their own BiS list', async ({ page }) => {
  await openApp(page)

  await page.getByLabel('Class').selectOption('Warrior')
  await page.getByLabel('Specialization').selectOption('Arms')

  await expect(slotCell(page, 'Relic')).toHaveCount(0)
  await expect(page.getByText('Arms Warrior Phase 2 Ranked List')).toBeVisible()
  await withSlotOpen(page, 'Main Hand', async () => {
    await expect(page.getByLabel('Main Hand', { exact: true }).locator('option', { hasText: 'Twinblade of the Phoenix' })).toHaveCount(1)
  })

  await page.getByLabel('Specialization').selectOption('Protection')

  await expect(slotCell(page, 'Relic')).toHaveCount(0)
  await expect(page.getByText('Protection Warrior Phase 2 Ranked List')).toBeVisible()
  await withSlotOpen(page, 'Off Hand', async () => {
    await expect(page.getByLabel('Off Hand', { exact: true }).locator('option', { hasText: 'Aldori Legacy Defender' })).toHaveCount(1)
  })

  await selectSlotItem(page, 'Chest', 'destroyer-chestguard-tank')
})

test('Holy, Protection, and Retribution Paladin Phase 2 starter rankings resolve to catalog items', async () => {
  for (const bisList of [holyPaladinPhase2Bis, protectionPaladinPhase2Bis, retributionPaladinPhase2Bis]) {
    // Paladin has a Relic (Libram) slot but no Ranged slot (they share the same physical slot in TBC).
    expectRankedSlotCoverage(bisList)

    for (const entry of bisList.entries) {
      const item = getItemById(entry.itemId)
      expect(item, `${entry.itemId} should exist in the item catalogue`).toBeTruthy()
      expect(item && isItemCompatibleWithGearSlot(item, entry.slot), `${entry.itemId} should fit ${entry.slot}`).toBe(true)
      if (entry.wowItemId) expect(item?.wowItemId).toBe(entry.wowItemId)
    }
  }
})

test('Paladin specs hide the Ranged slot, label Relic as Libram, and each get their own BiS list', async ({ page }) => {
  await openApp(page)

  await page.getByLabel('Class').selectOption('Paladin')
  await page.getByLabel('Specialization').selectOption('Holy')

  await expect(slotCell(page, 'Ranged')).toHaveCount(0)
  // Asserted on the gear slot rather than a BiS heading: the Holy Paladin guide publishes no Libram
  // section, so there is no ranking to head — but the slot itself must still be labelled Libram.
  await expect(slotCell(page, 'Libram')).toHaveCount(1)
  await expect(page.getByText('Holy Paladin Phase 2 Ranked List')).toBeVisible()
  await withSlotOpen(page, 'Off Hand', async () => {
    await expect(page.getByLabel('Off Hand', { exact: true }).locator('option', { hasText: 'Aegis of the Vindicator' })).toHaveCount(1)
  })

  await page.getByLabel('Specialization').selectOption('Protection')

  await expect(slotCell(page, 'Ranged')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Libram', exact: true })).toBeVisible()
  await expect(page.getByText('Protection Paladin Phase 2 Ranked List')).toBeVisible()

  await page.getByLabel('Specialization').selectOption('Retribution')

  await expect(slotCell(page, 'Ranged')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Libram', exact: true })).toBeVisible()
  await expect(page.getByText('Retribution Paladin Phase 2 Ranked List')).toBeVisible()
})

test('Discipline, Holy, and Shadow Priest Phase 2 starter rankings resolve to catalog items', async () => {
  for (const bisList of [disciplinePriestPhase2Bis, holyPriestPhase2Bis, shadowPriestPhase2Bis]) {
    // Priests have no Relic slot in TBC (only Shaman/Paladin/Druid do); they use a real Ranged wand instead.
    expectRankedSlotCoverage(bisList)

    for (const entry of bisList.entries) {
      const item = getItemById(entry.itemId)
      expect(item, `${entry.itemId} should exist in the item catalogue`).toBeTruthy()
      expect(item && isItemCompatibleWithGearSlot(item, entry.slot), `${entry.itemId} should fit ${entry.slot}`).toBe(true)
      if (entry.wowItemId) expect(item?.wowItemId).toBe(entry.wowItemId)
    }
  }
})

test('Priest specs hide the Relic slot, use a real Ranged wand, and each get their own BiS list', async ({ page }) => {
  await openApp(page)

  await page.getByLabel('Class').selectOption('Priest')
  await page.getByLabel('Specialization').selectOption('Holy')

  await expect(slotCell(page, 'Relic')).toHaveCount(0)
  await expect(page.getByText('Holy Priest Phase 2 Ranked List')).toBeVisible()
  await withSlotOpen(page, 'Ranged', async () => {
    await expect(page.getByLabel('Ranged', { exact: true }).locator('option', { hasText: 'Luminescent Rod of the Naaru' })).toHaveCount(1)
  })

  await page.getByLabel('Specialization').selectOption('Discipline')
  await expect(page.getByText('Discipline Priest Phase 2 Ranked List')).toBeVisible()

  await page.getByLabel('Specialization').selectOption('Shadow')

  await expect(slotCell(page, 'Relic')).toHaveCount(0)
  await expect(page.getByText('Shadow Priest Phase 2 Ranked List')).toBeVisible()
  await withSlotOpen(page, 'Ranged', async () => {
    await expect(page.getByLabel('Ranged', { exact: true }).locator('option', { hasText: 'Wand of the Forgotten Star' })).toHaveCount(1)
  })
})

test('Balance, Feral, and Restoration Druid Phase 2 starter rankings resolve to catalog items', async () => {
  for (const bisList of [balanceDruidPhase2Bis, feralDruidPhase2Bis, restorationDruidPhase2Bis]) {
    // Druid has a Relic (Idol) slot but no Ranged slot (they share the same physical slot in TBC).
    expectRankedSlotCoverage(bisList)

    for (const entry of bisList.entries) {
      const item = getItemById(entry.itemId)
      expect(item, `${entry.itemId} should exist in the item catalogue`).toBeTruthy()
      expect(item && isItemCompatibleWithGearSlot(item, entry.slot), `${entry.itemId} should fit ${entry.slot}`).toBe(true)
      if (entry.wowItemId) expect(item?.wowItemId).toBe(entry.wowItemId)
    }
  }
})

test('Druid specs hide the Ranged slot, label Relic as Idol, and each get their own BiS list', async ({ page }) => {
  await openApp(page)

  // Druid is only legal for Night Elf (Alliance) and Tauren (Horde); pick Night Elf before Class so it's offered.
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Night Elf')
  await page.getByLabel('Class').selectOption('Druid')
  await page.getByLabel('Specialization').selectOption('Balance')

  await expect(slotCell(page, 'Ranged')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Idol', exact: true })).toBeVisible()
  await expect(page.getByText('Balance Druid Phase 2 Ranked List')).toBeVisible()

  await page.getByLabel('Specialization').selectOption('Feral')

  await expect(slotCell(page, 'Ranged')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Idol', exact: true })).toBeVisible()
  await expect(page.getByText('Feral Druid Phase 2 Ranked List')).toBeVisible()

  await page.getByLabel('Specialization').selectOption('Restoration')

  await expect(slotCell(page, 'Ranged')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Idol', exact: true })).toBeVisible()
  await expect(page.getByText('Restoration Druid Phase 2 Ranked List')).toBeVisible()
})

test('Beast Mastery, Marksmanship, and Survival Hunter Phase 2 starter rankings resolve to catalog items', async () => {
  for (const bisList of [beastMasteryHunterPhase2Bis, marksmanshipHunterPhase2Bis, survivalHunterPhase2Bis]) {
    // Hunter has no Relic slot (only Shaman/Paladin/Druid do); Ranged is the primary damage slot.
    expectRankedSlotCoverage(bisList)

    for (const entry of bisList.entries) {
      const item = getItemById(entry.itemId)
      expect(item, `${entry.itemId} should exist in the item catalogue`).toBeTruthy()
      expect(item && isItemCompatibleWithGearSlot(item, entry.slot), `${entry.itemId} should fit ${entry.slot}`).toBe(true)
      if (entry.wowItemId) expect(item?.wowItemId).toBe(entry.wowItemId)
    }
  }
})

test('Hunter specs hide the Relic slot, keep Ranged as the primary weapon, and each get their own BiS list', async ({ page }) => {
  await openApp(page)

  // Hunter is not legal for the default Human race; pick Dwarf first so Hunter is offered.
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Dwarf')
  await page.getByLabel('Class').selectOption('Hunter')
  await page.getByLabel('Specialization').selectOption('Beast Mastery')

  await expect(slotCell(page, 'Relic')).toHaveCount(0)
  await expect(page.getByText('Beast Mastery Hunter Phase 2 Ranked List')).toBeVisible()
  await withSlotOpen(page, 'Ranged', async () => {
    await expect(page.getByLabel('Ranged', { exact: true }).locator('option', { hasText: 'Sunfury Bow of the Phoenix' })).toHaveCount(1)
  })

  await page.getByLabel('Specialization').selectOption('Marksmanship')
  await expect(page.getByText('Marksmanship Hunter Phase 2 Ranked List')).toBeVisible()

  await page.getByLabel('Specialization').selectOption('Survival')

  await expect(slotCell(page, 'Relic')).toHaveCount(0)
  await expect(page.getByText('Survival Hunter Phase 2 Ranked List')).toBeVisible()
  await withSlotOpen(page, 'Hands', async () => {
    await expect(page.getByLabel('Hands', { exact: true }).locator('option', { hasText: 'Gloves of Dexterous Manipulation' })).toHaveCount(1)
  })
})

test('Arcane, Fire, and Frost Mage Phase 2 starter rankings resolve to catalog items', async () => {
  for (const bisList of [arcaneMagePhase2Bis, fireMagePhase2Bis, frostMagePhase2Bis]) {
    // Mage has no Relic slot in TBC (only Shaman/Paladin/Druid do); Ranged holds a wand.
    expectRankedSlotCoverage(bisList)

    for (const entry of bisList.entries) {
      const item = getItemById(entry.itemId)
      expect(item, `${entry.itemId} should exist in the item catalogue`).toBeTruthy()
      expect(item && isItemCompatibleWithGearSlot(item, entry.slot), `${entry.itemId} should fit ${entry.slot}`).toBe(true)
      if (entry.wowItemId) expect(item?.wowItemId).toBe(entry.wowItemId)
    }
  }
})

test('Mage specs hide the Relic slot, use a real Ranged wand, and each get their own BiS list', async ({ page }) => {
  await openApp(page)

  await page.getByLabel('Class').selectOption('Mage')
  await page.getByLabel('Specialization').selectOption('Arcane')

  await expect(slotCell(page, 'Relic')).toHaveCount(0)
  await expect(page.getByText('Arcane Mage Phase 2 Ranked List')).toBeVisible()
  await withSlotOpen(page, 'Ranged', async () => {
    await expect(page.getByLabel('Ranged', { exact: true }).locator('option', { hasText: 'Eredar Wand of Obliteration' })).toHaveCount(1)
  })

  await page.getByLabel('Specialization').selectOption('Fire')
  await expect(page.getByText('Fire Mage Phase 2 Ranked List')).toBeVisible()

  await page.getByLabel('Specialization').selectOption('Frost')

  await expect(slotCell(page, 'Relic')).toHaveCount(0)
  await expect(page.getByText('Frost Mage Phase 2 Ranked List')).toBeVisible()
  await withSlotOpen(page, 'Ranged', async () => {
    await expect(page.getByLabel('Ranged', { exact: true }).locator('option', { hasText: 'Wand of the Forgotten Star' })).toHaveCount(1)
  })
})

test('every class and spec now resolves to a Phase 2 BiS list', async () => {
  for (const { className, specs } of tbcClasses) {
    for (const spec of specs) {
      const bisList = getBisListForSpec(className, spec)
      expect(bisList, `missing a Phase 2 BiS list for ${spec} ${className}`).toBeTruthy()
    }
  }
})

test('every recommended gem and enchant across all BiS lists resolves to a real catalog entry', async () => {
  for (const bisList of bisLists) {
    for (const entry of bisList.entries) {
      for (const gemId of entry.recommendedGemIds ?? []) {
        expect(getGemById(gemId), `${gemId} recommended by ${bisList.id}/${entry.slot} should exist in sampleGems`).toBeTruthy()
      }
      if (entry.recommendedEnchantId) {
        expect(getEnchantById(entry.recommendedEnchantId), `${entry.recommendedEnchantId} recommended by ${bisList.id}/${entry.slot} should exist in sampleEnchants`).toBeTruthy()
      }
    }
  }
})

// The recommendations now come from the separate enchants-and-gems guides, so this runs again.
test('Tank BiS lists recommend a Meta-colored gem for their Head Meta socket', async () => {
  for (const bisList of [protectionPaladinPhase2Bis, protectionWarriorPhase2Bis]) {
    const headEntry = bisList.entries.find((entry) => entry.slot === 'Head' && entry.rank === 1)
    const item = headEntry ? getItemById(headEntry.itemId) : undefined
    const sockets = item?.sockets ?? []

    // Gems are recommended per socket, in the item's own socket order, so the meta gem sits wherever
    // the meta socket is — not necessarily first. Asserting index 0 only worked by luck.
    const metaIndex = sockets.indexOf('Meta')
    expect(metaIndex, `${bisList.id} head piece should have a Meta socket`).toBeGreaterThanOrEqual(0)

    const metaGem = getGemById(headEntry?.recommendedGemIds?.[metaIndex])
    expect(metaGem?.color, `${bisList.id} Meta socket should get a Meta gem`).toBe('Meta')

    // And the other sockets must not be given a meta gem, which fits nothing else.
    sockets.forEach((socket, index) => {
      if (socket === 'Meta') return
      const gem = getGemById(headEntry?.recommendedGemIds?.[index])
      if (gem) expect(gem.color, `${bisList.id} ${socket} socket should not get a Meta gem`).not.toBe('Meta')
    })
  }
})

test('Assassination, Combat, and Subtlety Rogue Phase 2 starter rankings resolve to catalog items', async () => {
  for (const bisList of [assassinationRoguePhase2Bis, combatRoguePhase2Bis, subtletyRoguePhase2Bis]) {
    // Rogue has no Relic slot (only Shaman/Paladin/Druid do); every spec dual-wields into Off Hand.
    expectRankedSlotCoverage(bisList)

    for (const entry of bisList.entries) {
      const item = getItemById(entry.itemId)
      expect(item, `${entry.itemId} should exist in the item catalogue`).toBeTruthy()
      expect(item && isItemCompatibleWithGearSlot(item, entry.slot), `${entry.itemId} should fit ${entry.slot}`).toBe(true)
      if (entry.wowItemId) expect(item?.wowItemId).toBe(entry.wowItemId)
    }
  }
})

test('Rogue specs hide the Relic slot, support full dual-wield, and each get their own BiS list', async ({ page }) => {
  await openApp(page)

  await page.getByLabel('Class').selectOption('Rogue')
  await page.getByLabel('Specialization').selectOption('Assassination')

  await expect(slotCell(page, 'Relic')).toHaveCount(0)
  await expect(page.getByText('Assassination Rogue Phase 2 Ranked List')).toBeVisible()
  await withSlotOpen(page, 'Main Hand', async () => {
    await expect(page.getByLabel('Main Hand', { exact: true }).locator('option', { hasText: 'Fang of Vashj' })).toHaveCount(1)
  })
  await withSlotOpen(page, 'Off Hand', async () => {
    await expect(page.getByLabel('Off Hand', { exact: true }).locator('option', { hasText: 'Heartrazor' })).toHaveCount(1)
  })
  await withSlotOpen(page, 'Ranged', async () => {
    await expect(page.getByLabel('Ranged', { exact: true }).locator('option', { hasText: 'Arcanite Steam-Pistol' })).toHaveCount(1)
  })

  await page.getByLabel('Specialization').selectOption('Combat')
  await expect(page.getByText('Combat Rogue Phase 2 Ranked List')).toBeVisible()
  await withSlotOpen(page, 'Main Hand', async () => {
    await expect(page.getByLabel('Main Hand', { exact: true }).locator('option', { hasText: 'Warp Slicer' })).toHaveCount(1)
  })
  await withSlotOpen(page, 'Off Hand', async () => {
    await expect(page.getByLabel('Off Hand', { exact: true }).locator('option', { hasText: "Latro's Shifting Sword" })).toHaveCount(1)
  })

  await page.getByLabel('Specialization').selectOption('Subtlety')

  await expect(slotCell(page, 'Relic')).toHaveCount(0)
  await expect(page.getByText('Subtlety Rogue Phase 2 Ranked List')).toBeVisible()
  await withSlotOpen(page, 'Off Hand', async () => {
    await expect(page.getByLabel('Off Hand', { exact: true }).locator('option', { hasText: "Latro's Shifting Sword" })).toHaveCount(1)
  })
})

test('Affliction, Demonology, and Destruction Warlock Phase 2 starter rankings resolve to catalog items', async () => {
  for (const bisList of [afflictionWarlockPhase2Bis, demonologyWarlockPhase2Bis, destructionWarlockPhase2Bis]) {
    // Warlock has no Relic slot (only Shaman/Paladin/Druid do); Ranged holds a wand.
    expectRankedSlotCoverage(bisList)

    for (const entry of bisList.entries) {
      const item = getItemById(entry.itemId)
      expect(item, `${entry.itemId} should exist in the item catalogue`).toBeTruthy()
      expect(item && isItemCompatibleWithGearSlot(item, entry.slot), `${entry.itemId} should fit ${entry.slot}`).toBe(true)
      if (entry.wowItemId) expect(item?.wowItemId).toBe(entry.wowItemId)
    }
  }
})

test('Warlock specs hide the Relic slot, use a real Ranged wand, and each get their own BiS list', async ({ page }) => {
  await openApp(page)

  await page.getByLabel('Class').selectOption('Warlock')
  await page.getByLabel('Specialization').selectOption('Affliction')

  await expect(slotCell(page, 'Relic')).toHaveCount(0)
  await expect(page.getByText('Affliction Warlock Phase 2 Ranked List')).toBeVisible()
  await withSlotOpen(page, 'Main Hand', async () => {
    await expect(page.getByLabel('Main Hand', { exact: true }).locator('option', { hasText: 'Fang of the Leviathan' })).toHaveCount(1)
  })
  await withSlotOpen(page, 'Off Hand', async () => {
    await expect(page.getByLabel('Off Hand', { exact: true }).locator('option', { hasText: 'Fathomstone' })).toHaveCount(1)
  })
  await withSlotOpen(page, 'Ranged', async () => {
    await expect(page.getByLabel('Ranged', { exact: true }).locator('option', { hasText: 'Wand of the Forgotten Star' })).toHaveCount(1)
  })

  await page.getByLabel('Specialization').selectOption('Demonology')
  await expect(page.getByText('Demonology Warlock Phase 2 Ranked List')).toBeVisible()

  await page.getByLabel('Specialization').selectOption('Destruction')

  await expect(slotCell(page, 'Relic')).toHaveCount(0)
  await expect(page.getByText('Destruction Warlock Phase 2 Ranked List')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Head', exact: true })).toBeVisible()
  // "Voidheart Cover", which this used to assert, does not exist — it was one of the invented names
  // in the old hand-written lists. The real set piece is Voidheart Crown, and the guide's top head
  // pick for Destruction is the engineering helm.
  await expect(page.getByTestId('bis-panel').getByRole('heading', { name: 'Destruction Holo-gogs' })).toBeVisible()
})

test('Professions tab shows skill tiers and material farming, and switches between professions', async ({ page }) => {
  await openApp(page)

  await expect(page.getByRole('heading', { name: 'Character', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Professions', exact: true }).click()

  await expect(page.getByRole('heading', { name: 'Professions', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Character', exact: true })).toHaveCount(0)

  const detail = page.getByTestId('profession-detail')
  await expect(detail.getByRole('heading', { name: 'Mining', exact: true })).toBeVisible()
  await expect(detail.getByText('Master', { exact: true })).toBeVisible()
  await expect(detail.getByText('Copper Ore')).toBeVisible()

  await page.getByRole('button', { name: 'Alchemy', exact: true }).click()
  await expect(detail.getByRole('heading', { name: 'Alchemy', exact: true })).toBeVisible()
  await expect(detail.getByText('Copper Ore')).toHaveCount(0)

  await page.getByRole('button', { name: 'Character Planner', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Character', exact: true })).toBeVisible()
})

test('stat weights rank stats correctly and separate unmodeled stats from capped ones', async ({ page }) => {
  await openApp(page)

  // Default character is a Fury Warrior (melee physical DPS).
  await openSimulationTab(page)
  const weights = page.getByTestId('stat-weights')
  await expect(weights).toBeVisible()

  // Strength grants exactly 2 attack power per point in calculateStats, so its weight relative to
  // attack power must come out at exactly 2.00. This is the load-bearing assertion: it proves the
  // probe is applied *before* the primary-stat derivations rather than after them, which is the
  // whole reason `bonusStats` exists.
  await expect(page.getByTestId('stat-weight-strength')).toContainText('2.00')
  await expect(page.getByTestId('stat-weight-attackPower')).toContainText('1.00')

  // Melee never reads ranged attack power, so it should not be probed at all for a Warrior.
  await expect(page.getByTestId('stat-weight-rangedAttackPower')).toHaveCount(0)

  // Haste and armor penetration aren't read by the engine yet; they must be called out as
  // unmodeled rather than silently listed as worth zero.
  const unmodeled = page.locator('.stat-weights-unmodeled')
  await expect(unmodeled).toContainText('Haste Rating')
  await expect(unmodeled).toContainText('Armor Pen')
  await expect(page.getByTestId('stat-weight-hasteRating')).toHaveCount(0)
})

test('stat weights follow the character role and class', async ({ page }) => {
  await openApp(page)

  // Hunters run the ranged attack table, so ranged attack power replaces melee AP as the reference.
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Dwarf')
  await page.getByLabel('Class').selectOption('Hunter')
  await openSimulationTab(page)
  await expect(page.getByTestId('stat-weight-rangedAttackPower')).toContainText('1.00')
  await expect(page.getByTestId('stat-weight-strength')).toHaveCount(0)
  await expect(page.getByTestId('stat-weight-agility')).toBeVisible()

  // Casters switch to the spell stat set entirely.
  await openPlannerTab(page)
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Gnome')
  await page.getByLabel('Class').selectOption('Mage')
  await openSimulationTab(page)
  await expect(page.getByTestId('stat-weight-spellPower')).toContainText('1.00')
  await expect(page.getByTestId('stat-weight-spellCritRating')).toBeVisible()
  await expect(page.getByTestId('stat-weight-attackPower')).toHaveCount(0)

  // Healers normalize against healing power and surface MP5 as not-yet-modeled. Gnomes can't be
  // Priests in TBC, so the race has to move first — the Class dropdown genuinely won't offer it.
  await openPlannerTab(page)
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Human')
  await page.getByLabel('Class').selectOption('Priest')
  await page.getByLabel('Specialization').selectOption('Holy')
  await openSimulationTab(page)
  await expect(page.getByTestId('stat-weight-healingPower')).toContainText('1.00')
  await expect(page.locator('.stat-weights-unmodeled')).toContainText('MP5')

  // Tanks normalize against stamina and get the avoidance stat set.
  await openPlannerTab(page)
  await page.getByLabel('Class').selectOption('Warrior')
  await page.getByLabel('Specialization').selectOption('Protection')
  await openSimulationTab(page)
  await expect(page.getByTestId('stat-weight-stamina')).toContainText('1.00')
  await expect(page.getByTestId('stat-weight-defenseRating')).toBeVisible()
})

test('encounter settings change armor mitigation and feed back into the simulation', async ({ page }) => {
  await openApp(page)
  await openSimulationTab(page)
  const mitigation = page.getByTestId('encounter-armor-mitigation')

  // Default target is the heavily-armored 10643-armor boss. DR = armor / (armor + K) where
  // K = 467.5 * 70 - 22167.5 = 10557.5, so 10643 / 21200.5 = 50.2%.
  await expect(mitigation).toHaveText('50.2%')

  // Dropping to the cloth-target preset must visibly reduce mitigation.
  await page.getByRole('button', { name: /Cloth \/ caster target/ }).click()
  await expect(mitigation).toHaveText('24.9%')

  // ...and that has to actually reach the simulation, not just the encounter panel.
  await page.getByRole('button', { name: /run simulation/i }).click()
  const lowArmorScore = Number(await page.getByTestId('simulation-score').innerText())

  await page.getByRole('button', { name: /Heavily armored boss/ }).click()
  await expect(mitigation).toHaveText('50.2%')
  await page.getByRole('button', { name: /run simulation/i }).click()
  const highArmorScore = Number(await page.getByTestId('simulation-score').innerText())

  expect(lowArmorScore).toBeGreaterThan(highArmorScore)

  // Target level drives the attack table, so it must move the result too.
  await page.getByLabel('Target level').selectOption('70')
  await page.getByRole('button', { name: /run simulation/i }).click()
  const evenLevelScore = Number(await page.getByTestId('simulation-score').innerText())
  expect(evenLevelScore).toBeGreaterThan(highArmorScore)
})

test('upgrade finder ranks real swaps, spans slots, and equipping delivers the promised gain', async ({ page }) => {
  await openApp(page)
  await openSimulationTab(page)
  const list = page.getByTestId('upgrade-list')
  await expect(list).toBeVisible()

  const rows = list.locator('.upgrade-row')
  await expect(rows.first()).toBeVisible()

  // A single weak slot must not monopolise the list — the per-slot cap should surface several slots.
  const slotLabels = await list.locator('.upgrade-slot').allInnerTexts()
  expect(new Set(slotLabels).size).toBeGreaterThan(1)

  // Deltas are strictly positive (only genuine upgrades are listed) and sorted descending.
  const deltas = (await list.locator('.upgrade-delta strong').allInnerTexts()).map((text) => Number(text.replace('+', '')))
  expect(deltas[0]).toBeGreaterThan(0)
  expect([...deltas]).toEqual([...deltas].sort((a, b) => b - a))

  // Socketed candidates are scored gemmed, and the row has to say which gems it assumed — otherwise
  // the delta silently depends on a decision the player never sees.
  const gemNotes = list.locator('.upgrade-socket-note')
  if ((await gemNotes.count()) > 0) {
    await expect(gemNotes.first()).toContainText(/Assumes .+/)
  }

  // Most of this catalog is still stat-budget estimates, and the few sourced items are markedly
  // stronger than the estimates around them — so a ranking built on those comparisons has to say
  // which rows rest on estimated data rather than presenting every delta as equally solid.
  const dataNotes = list.locator('.upgrade-data-note')
  expect(await dataNotes.count(), 'a catalog this unverified should flag at least one row').toBeGreaterThan(0)
  for (const text of await dataNotes.allInnerTexts()) {
    expect(text).toMatch(/likely overstated|approximate/)
  }

  // The headline claim has to hold: equipping the top pick should move the simulation by
  // approximately the advertised amount. Because equipping applies the same gems the score assumed,
  // this also catches a candidate being scored gemmed but equipped bare.
  await page.getByRole('button', { name: /run simulation/i }).click()
  const before = Number(await page.getByTestId('simulation-score').innerText())

  const topDelta = deltas[0]
  await rows.first().getByRole('button', { name: /equip/i }).click()
  await page.getByRole('button', { name: /run simulation/i }).click()
  const after = Number(await page.getByTestId('simulation-score').innerText())

  expect(after - before).toBeGreaterThan(0)
  expect(Math.abs(after - before - topDelta)).toBeLessThan(0.5)
})

test('a build autosaves and is restored after a reload', async ({ page }) => {
  await openApp(page)
  await expect(page.getByLabel('Class')).toHaveValue('Warrior')

  await page.getByLabel('Class').selectOption('Mage')
  await page.getByLabel('Specialization').selectOption('Fire')

  // The autosave runs in an effect, so wait for it to actually reach storage before reloading.
  await expect
    .poll(async () => {
      const raw = await page.evaluate(() => localStorage.getItem('project-defeat:build:v1'))
      return raw ? JSON.parse(raw).character.spec : null
    })
    .toBe('Fire')

  // The encounter target used to be set through the UI here, to prove the non-character half of the
  // build persists too. That panel is hidden with the simulator, but the target is still part of the
  // saved payload, so assert it survives in storage rather than dropping the coverage.
  const savedTarget = await page.evaluate(() => {
    const raw = localStorage.getItem('project-defeat:build:v1')
    return raw ? JSON.parse(raw).target : null
  })
  expect(savedTarget, 'the saved build must carry the encounter target, not just the character').toBeTruthy()

  // A reload starts over at the section picker — the chosen section is deliberately session state,
  // not something persisted. The *build* is what has to survive, which is what this asserts next.
  await page.reload()
  await page.getByTestId('section-planner').click()

  await expect(page.getByLabel('Class')).toHaveValue('Mage')
  await expect(page.getByLabel('Specialization')).toHaveValue('Fire')
})

test('a build can be exported and imported back', async ({ page }) => {
  await openApp(page)

  // Capture the default Warrior build, then change the character away from it.
  const exported = await page.getByTestId('build-export-output').inputValue()
  expect(JSON.parse(exported).version).toBe(1)
  expect(JSON.parse(exported).character.className).toBe('Warrior')

  await page.getByLabel('Class').selectOption('Mage')
  await expect(page.getByLabel('Class')).toHaveValue('Mage')

  // Pasting the captured build back must restore the original character.
  await page.getByTestId('build-import-input').fill(exported)
  await page.getByTestId('build-import-button').click()

  await expect(page.getByLabel('Class')).toHaveValue('Warrior')
  await expect(page.getByTestId('build-status')).toContainText(/Build loaded/i)
})

test('an invalid build is rejected without changing the current character', async ({ page }) => {
  await openApp(page)

  await page.getByLabel('Class').selectOption('Mage')
  await expect(page.getByLabel('Class')).toHaveValue('Mage')

  await page.getByTestId('build-import-input').fill('this is not a build')
  await page.getByTestId('build-import-button').click()

  await expect(page.getByTestId('build-status')).toContainText(/Nothing was changed/i)
  await expect(page.getByLabel('Class')).toHaveValue('Mage')

  // A structurally valid build from an unknown format version is refused too, rather than
  // half-applied.
  await page.getByTestId('build-import-input').fill(JSON.stringify({ version: 999, character: {} }))
  await page.getByTestId('build-import-button').click()
  await expect(page.getByTestId('build-status')).toContainText(/Unsupported build version/i)
  await expect(page.getByLabel('Class')).toHaveValue('Mage')
})

test('a build referencing a missing item still loads, reporting the dropped slot', async ({ page }) => {
  await openApp(page)

  const exported = JSON.parse(await page.getByTestId('build-export-output').inputValue())
  exported.gear.Head = { itemId: 'an-item-that-was-removed-from-the-catalog', gemIds: [] }

  await page.getByTestId('build-import-input').fill(JSON.stringify(exported))
  await page.getByTestId('build-import-button').click()

  const status = page.getByTestId('build-status')
  await expect(status).toContainText(/Build loaded/i)
  await expect(status).toContainText(/no longer in the catalog/i)
  // The rest of the build must survive rather than the whole import failing.
  await expect(page.getByLabel('Class')).toHaveValue('Warrior')
})

test('melee specials are layered onto white damage, and unmodelled ones say so', async () => {
  // Asserted against the engine rather than the simulator panel, which is currently hidden. The
  // finding is about how specials are layered, and that does not depend on anything being rendered.

  // Fury Warrior: Bloodthirst is cooldown-bound, so its rate is defensible and it is modelled.
  const fury = simulateSpec('Warrior', 'Fury', 'Human', 'Alliance')
  const bloodthirstDps = breakdownValue(fury.result, /Bloodthirst DPS/i)
  expect(bloodthirstDps, 'Bloodthirst must appear in the breakdown').toBeGreaterThan(0)
  expect(fury.result.summary).toMatch(/used on its 6s cooldown/i)

  // Fury presses more than one computable button. Whirlwind has its own 10s cooldown and must be
  // layered on alongside Bloodthirst — modelling only the signature ability understates the spec,
  // which is the gap the rotation work exists to close.
  const whirlwindDps = breakdownValue(fury.result, /Whirlwind DPS/i)
  expect(whirlwindDps, 'Whirlwind must be layered on alongside Bloodthirst').toBeGreaterThan(0)
  expect(fury.result.summary).toMatch(/used on its 10s cooldown/i)

  // Both are real contributions on top of white damage, and neither may swallow the whole estimate.
  expect(fury.result.scoreExact).toBeGreaterThan((bloodthirstDps ?? 0) + (whirlwindDps ?? 0))

  // Combat Rogue: no cooldown, but a fixed energy cost against a fixed regen rate is computable.
  const combat = simulateSpec('Rogue', 'Combat', 'Human', 'Alliance')
  expect(breakdownValue(combat.result, /Sinister Strike DPS/i)).toBeGreaterThan(0)
  expect(combat.result.summary).toMatch(/energy against 10\/sec regen/i)

  // Hunter: Steady Shot is mana-costed with no cooldown, so its sustained rate depends on auto-shot
  // weaving that isn't modelled. It must be named as excluded rather than silently omitted.
  const hunter = simulateSpec('Hunter', 'Beast Mastery', 'Dwarf', 'Alliance')
  expect(breakdownValue(hunter.result, /Steady Shot DPS/i)).toBeUndefined()
  expect(hunter.result.summary).toMatch(/Steady Shot is not included/i)
})

test('the Raids tab renders a raid, its bosses and an attunement chain', async ({ page }) => {
  // The raids panel is one of three things this repo has historically shipped that nothing rendered,
  // and it was the only part of the app with that history and no test confirming it still renders.
  await openApp(page)
  await page.getByRole('button', { name: 'Raids', exact: true }).click()

  const detail = page.getByTestId('raid-detail')
  await expect(detail).toBeVisible()

  // A raid with no bosses would still render a panel, so assert the content and not just the shell.
  await expect(detail.getByRole('heading').first()).toBeVisible()
  await expect(detail).toContainText(/Serpentshrine Cavern|Tempest Keep|Karazhan|Gruul|Magtheridon/)

  // Attunement chains only exist for Serpentshrine Cavern and Tempest Keep, and only render under the
  // Attunement view — so the toggle has to be reachable and the chain has to survive the switch.
  // This is the part most likely to disappear silently, since nothing else links to it.
  await page.getByRole('button', { name: 'Serpentshrine Cavern', exact: true }).click()
  await page.getByRole('button', { name: 'Attunement', exact: true }).click()
  const attunement = page.getByTestId('raid-attunement')
  await expect(attunement).toBeVisible()
  await expect(attunement.locator('li').first()).toBeVisible()
})

test('the app opens on a section picker, and the rail follows the character', async ({ page }) => {
  // The app used to land inside a tab. It now asks which of the three things you came to do, because
  // gearing a character, reading a loot table and levelling a profession have nothing to do with
  // each other.
  await page.goto('/')
  await expect(page.getByTestId('section-planner')).toBeVisible()
  await expect(page.getByTestId('section-raids')).toBeVisible()
  await expect(page.getByTestId('section-professions')).toBeVisible()
  // The tab bar is a way *between* sections, not the way in, so it is not on this screen.
  await expect(page.locator('.tab-nav')).toHaveCount(0)

  // Entering through Raids must land on Raids, not on whichever tab happens to be first.
  await page.getByTestId('section-raids').click()
  await expect(page.locator('.tab-nav')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Character summary' }), 'no character is in play on Raids, so no stat rail').toHaveCount(0)

  // The rail is stats, and stats belong to a character — so it appears on the planner and only there.
  // Reaching the planner means creating a character first, which is the point of the creator: the
  // tab is about a character, so there is nothing to show until there is one.
  await page.getByRole('button', { name: 'Character Planner', exact: true }).click()
  await expect(page.getByTestId('character-creator')).toBeVisible()
  for (let step = 0; step < 3; step++) await page.getByTestId('creator-next').click()
  await page.getByTestId('creator-confirm').click()

  await expect(page.locator('.rail')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Gear', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Professions', exact: true }).click()
  await expect(page.locator('.rail')).toHaveCount(0)
})

test('buffs and consumables still reach the stat totals with the panel hidden', async () => {
  // This used to click the Buffs & Consumables panel. The panel is no longer rendered, but the three
  // id lists behind it are still carried in the saved build and still read by calculateStats,
  // calculateSimulation, the stat weights and the upgrade finder. With the panel gone that wiring is
  // exactly what could quietly become a no-op, so the test moves down to it rather than being dropped
  // along with the UI it happened to be driving.
  const character: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Warrior', spec: 'Fury' }
  const gear = normalizeGearForCharacter(defaultGear, 'Warrior', 'Fury')

  const base = calculateStats(character, gear, [], [])
  const withShout = calculateStats(character, gear, ['battle-shout'], [])
  expect(withShout.attackPower - base.attackPower, 'Battle Shout is a flat +306 attack power').toBe(306)

  const withFlask = calculateStats(character, gear, ['battle-shout'], ['flask-of-relentless-assault'])
  expect(withFlask.attackPower, 'a flask stacks on top of the buff rather than replacing it').toBeGreaterThan(withShout.attackPower)

  // Clearing the ids must return the original totals exactly — a buff that applies but never clears
  // would look right on the way up and be wrong for the rest of the session.
  expect(calculateStats(character, gear, [], [])).toEqual(base)

  // An unmodelled buff carries no stats at all, so it must change nothing rather than contributing
  // some incidental value. Bloodlust is a raid cooldown this engine cannot express.
  expect(calculateStats(character, gear, ['bloodlust'], [])).toEqual(base)
})

test('every raid buff is sourced to a spell rank and is either applied or explicitly not modelled', async () => {
  // All 33 buffs were rebuilt by hand off Wowhead tooltips, replacing 14 entries that carried
  // `needsVerification` and invented numbers. This is the check that stops the file drifting back:
  // a buff must cite the spell rank its numbers came from, and must either contribute stats or say
  // in words why it cannot. An entry that does neither is the failure mode this repo keeps hitting —
  // it looks like data and applies nothing.
  const problems: string[] = []
  const seen = new Set<string>()

  for (const buff of sampleBuffs) {
    if (seen.has(buff.id)) problems.push(`${buff.id}: duplicate id`)
    seen.add(buff.id)

    if (!buff.spellId) problems.push(`${buff.id}: no spellId, so its numbers cannot be traced to a rank`)
    if (buff.needsVerification) problems.push(`${buff.id}: still flagged needsVerification`)

    const applies = Boolean(buff.stats || buff.statMultipliers)
    if (applies && buff.notModelled) problems.push(`${buff.id}: both applies stats and claims to be unmodelled`)
    if (!applies && !buff.notModelled) problems.push(`${buff.id}: contributes nothing and does not say why`)
  }

  expect(problems, problems.join(' | ')).toEqual([])
  expect(modelledBuffs.length + unmodelledBuffs.length).toBe(sampleBuffs.length)
  expect(sampleBuffs.length, 'TBC Phase 2 has 33 raid buffs').toBe(33)
})

test('the percentage auras are stored as the rating that actually buys that percentage', async () => {
  // Moonkin Aura, Leader of the Pack and Totem of Wrath are written in the tooltip as flat
  // percentages, but everything downstream reads rating — so they are stored converted. Reversing
  // the conversion has to land back on the tooltip number, or the aura is quietly worth something
  // else. The old values (34 crit rating for a 5% aura) were neither one thing nor the other.
  const backToPercent = (rating: number, perPercent: number) => rating / perPercent

  expect(backToPercent(getBuffById('moonkin-aura')?.stats?.spellCritRating ?? 0, RATING_PER_PERCENT.spellCrit)).toBeCloseTo(5, 10)
  expect(backToPercent(getBuffById('leader-of-the-pack')?.stats?.critRating ?? 0, RATING_PER_PERCENT.meleeCrit)).toBeCloseTo(5, 10)

  const totemOfWrath = getBuffById('totem-of-wrath')
  expect(backToPercent(totemOfWrath?.stats?.spellCritRating ?? 0, RATING_PER_PERCENT.spellCrit)).toBeCloseTo(3, 10)
  expect(backToPercent(totemOfWrath?.stats?.spellHitRating ?? 0, RATING_PER_PERCENT.spellHit)).toBeCloseTo(3, 10)

  // Totem of Wrath grants no spell power in TBC. It used to carry 141, which is the shape of the
  // Wrath of the Lich King version of the totem, not this one.
  expect(totemOfWrath?.stats?.spellPower ?? 0).toBe(0)
})

test('the buff corrections that had real wrong values stay corrected', async () => {
  // Each assertion here is a value that was wrong in the shipped data and was fixed against a named
  // Wowhead spell. They are pinned individually because each was wrong in a different way, and a
  // careless re-ingest could reintroduce any one of them alone.

  // Spell 26991: flat +14 to all attributes and +340 armor. Was modelled as +5% to every primary
  // stat, which is not a TBC effect at any rank of this spell.
  const giftOfTheWild = getBuffById('mark-of-the-wild')
  expect(giftOfTheWild?.statMultipliers, 'Gift of the Wild is flat, not a percentage').toBeUndefined()
  expect(giftOfTheWild?.stats?.strength).toBe(14)
  expect(giftOfTheWild?.stats?.spirit).toBe(14)
  expect(giftOfTheWild?.stats?.armor).toBe(340)

  // Spell 3738: "spell damage and healing increased by up to 101" — spell power. The haste version
  // of this totem is a Wrath of the Lich King change.
  const wrathOfAir = getBuffById('wrath-of-air-totem')
  expect(wrathOfAir?.stats?.spellPower).toBe(101)
  expect(wrathOfAir?.stats?.spellHasteRating ?? 0).toBe(0)

  // Spell 25392: 79 stamina, not 66.
  expect(getBuffById('prayer-of-fortitude')?.stats?.stamina).toBe(79)

  // Spells 27142 and 27143 both read 41 mana every 5 seconds. wowsims models 42; the tooltip wins.
  expect(getBuffById('blessing-of-wisdom')?.stats?.mp5).toBe(41)

  // Both of these read "attack power" unqualified and so apply to ranged as well. The missing ranged
  // half understated every Hunter.
  expect(getBuffById('trueshot-aura')?.stats?.rangedAttackPower).toBe(125)
  expect(getBuffById('blessing-of-might')?.stats?.rangedAttackPower).toBe(220)

  // Battle Shout is the counter-example and is deliberately melee-only: "increasing the melee attack
  // power of all party members". A ranged half here would be an invention.
  expect(getBuffById('battle-shout')?.stats?.attackPower).toBe(306)
  expect(getBuffById('battle-shout')?.stats?.rangedAttackPower ?? 0).toBe(0)
})

test('every unmodelled buff carries text a panel could render', async () => {
  // This asserted that unmodelled buffs reach the screen without a checkbox. The Buffs & Consumables
  // panel is no longer rendered, so that premise is gone — but the data contract it was really
  // protecting is not: an unmodelled buff has to explain itself in words, or restoring the panel
  // would put 15 rows on screen with a name and nothing else.
  expect(unmodelledBuffs.length, '15 of the 33 cannot be expressed as stats').toBe(15)

  for (const buff of unmodelledBuffs) {
    expect(buff.stats, `${buff.id} must contribute no stats`).toBeUndefined()
    expect(buff.statMultipliers, `${buff.id} must contribute no multipliers`).toBeUndefined()
    expect(buff.notModelled!.length, `${buff.id} needs a real explanation, not a placeholder`).toBeGreaterThan(40)
  }

  // Bloodlust is the example worth pinning: it is the buff a reader would most expect to find, and
  // its explanation has to carry the actual effect rather than just saying it is unsupported.
  expect(getBuffById('bloodlust')?.notModelled).toContain('30%')
})

test('every spec can fill every gear slot the UI shows it', async () => {
  // A slot the interface offers but has nothing to put in is a dead end the user hits, not a
  // limitation they can read about. This walks all 27 specs against their own visible slot list —
  // slot visibility is spec-aware (Rogues hide Relic, Warlocks hide it, Hunters keep Ranged), so a
  // hole only counts where the app actually asks the player to choose something.
  const empty: string[] = []
  const single: string[] = []

  for (const entry of tbcClasses) {
    for (const spec of entry.specs) {
      for (const slot of getVisibleGearSlotsForSpec(entry.className, spec)) {
        const count = getItemsForSlotAndCharacter(slot, entry.className, spec).length
        if (count === 0) empty.push(`${entry.className} ${spec} ${slot}`)
        else if (count === 1) single.push(`${entry.className} ${spec} ${slot}`)
      }
    }
  }

  expect(empty, `gear slots offered with nothing to equip: ${empty.join(' | ')}`).toEqual([])

  // Slots with exactly one option are not a failure — the catalog is still small — but a planner
  // whose "choice" is forced everywhere is not planning anything. Recorded rather than asserted so
  // this test reports the shape of the gap instead of blocking on it.
  console.log(`slots with only one option (${single.length}): ${single.join(", ")}`)
})

test('armor comes from the catalogue, and the derivation only fills genuine gaps', async () => {
  // History: the old catalogue recorded armor on 5 of ~143 armour pieces, so it was derived from item
  // level, armour class, slot and quality instead. The ingested catalogue carries real armor on all
  // 2,899 armour pieces, which retires that gap — and independently vindicates the formula, because
  // the values it predicted for these two anchors (181 and 759) are exactly what the real data says.
  const clothHelm = getItemById('cowl-of-tirisfal')
  expect(clothHelm?.itemLevel).toBe(133)
  expect(clothHelm?.stats.armor).toBe(181)

  const mailHelm = getItemById('rift-stalker-helm')
  expect(mailHelm?.itemLevel).toBe(133)
  expect(mailHelm?.stats.armor).toBe(759)

  // An item stating its own armor must never be overridden — a sourced value has to beat the
  // formula, or verifying an item would stop being an improvement. Now that every ingested armour
  // piece states its armor, this is the path that actually runs in production.
  expect(deriveItemArmor(clothHelm!)).toBeUndefined()
  expect(deriveItemArmor(mailHelm!)).toBeUndefined()

  const shield = getItemById('aldori-legacy-defender')
  expect(shield?.stats.armor).toBe(5279)
  expect(deriveItemArmor(shield!)).toBeUndefined()

  // The formula still has to work for anything that reaches the UI without an armor value, such as
  // the curated entries that never matched an ingested item.
  const noArmor = { ...clothHelm!, stats: {} }
  expect(deriveItemArmor(noArmor)).toBe(181)

  // Feral druid tank leather sits on a separate, inflated armor track that was never fitted.
  // Deriving it from the ordinary leather line would understate it badly, so it declines to guess.
  const feralTank = { ...clothHelm!, armorType: 'Leather' as const, roles: ['Tank' as const], stats: {} }
  expect(deriveItemArmor(feralTank)).toBeUndefined()
})

test('equipped tier pieces surface their set bonuses, and say they are not scored', async ({ page }) => {
  await openApp(page)
  await page.getByLabel('Class').selectOption('Warrior')
  await page.getByLabel('Specialization').selectOption('Fury')

  await selectSlotItem(page, 'Head', 'destroyer-battle-helm')
  await selectSlotItem(page, 'Chest', 'destroyer-breastplate')

  const sets = page.getByTestId('set-bonuses')
  await expect(sets).toBeVisible()
  // Deliberately not pinned to an exact count: every verification batch that links another piece to
  // its set raises it, and this test should track the feature rather than the catalog's current size.
  const setLine = await sets.locator('.set-bonus-name').first().innerText()
  const [, equipped, total] = setLine.match(/Destroyer Battlegear \((\d+)\/(\d+)\)/) ?? []
  expect(Number(equipped), 'the two pieces selected above must at least be counted').toBeGreaterThanOrEqual(2)
  expect(Number(total)).toBe(5)

  // The 2-piece is met and must be shown as active; the 4-piece is not yet and must not claim to be.
  await expect(sets.locator('.set-bonus-active')).toContainText(/Overpower/)
  await expect(sets.locator('.set-bonus-inactive')).toContainText(/5 less rage/)

  // Four pieces was unreachable while only Head and Chest of each set were catalogued. All five
  // slots of all seventeen Tier 5 sets now carry a setId, so the 4-piece threshold is real and the
  // bonus has to cross from inactive to active when it is met.
  await selectSlotItem(page, 'Hands', 'destroyer-gauntlets')
  await selectSlotItem(page, 'Legs', 'destroyer-greaves')
  // Filtered rather than asserted against the whole locator, which now matches both bonuses at once.
  await expect(sets.locator('.set-bonus-active').filter({ hasText: '5 less rage' })).toHaveCount(1)
  await expect(sets.locator('.set-bonus-inactive').filter({ hasText: '5 less rage' })).toHaveCount(0)

  // The whole point of showing these is that the score does NOT include them. If that caveat ever
  // disappears, the panel starts implying tier pieces are being valued when they are not.
  await expect(sets).toContainText(/None of these bonuses are included in the stat totals/i)
  await expect(sets).toContainText(/undervalues tier pieces/i)
})

test('a melee attacker behind the target cannot be parried or blocked', async () => {
  // Parry and block both require the defender to be facing the attacker. A melee DPS is behind the
  // boss for the whole fight, so both rows are zero — not reduced, impossible. The simulator applied
  // them anyway, which against a level 73 target removed 14% parry plus 5% block from every swing:
  // nearly a fifth of a melee spec's damage deleted for a positional reason that never happens.
  const shared = { skillDiff: 15, expertiseSkillPoints: 0, missReduction: 0, rawCritChance: 0.25 }

  const behind = buildWhiteAttackTable({ ...shared, dualWield: true, attacksFromBehind: true })
  const inFront = buildWhiteAttackTable({ ...shared, dualWield: true, attacksFromBehind: false })

  expect(behind.parry).toBe(0)
  expect(behind.block).toBe(0)
  expect(inFront.parry, 'a level 73 target parries 14% of front attacks').toBeCloseTo(0.14, 10)
  expect(inFront.block).toBeCloseTo(0.05, 10)

  // The freed probability has to reappear in the landing rows, not vanish: an ordered table always
  // sums to 1, so the only question is which outcomes it lands in.
  const total = (t: { miss: number; dodge: number; parry: number; glance: number; block: number; crit: number; hit: number }) =>
    t.miss + t.dodge + t.parry + t.glance + t.block + t.crit + t.hit
  expect(total(behind)).toBeCloseTo(1, 10)
  expect(total(inFront)).toBeCloseTo(1, 10)
  expect(behind.hit + behind.crit).toBeCloseTo(inFront.hit + inFront.crit + 0.19, 10)

  // Dodge survives from behind, which is what keeps Expertise worth anything to a melee DPS.
  expect(behind.dodge).toBeGreaterThan(0)
  expect(behind.dodge).toBeCloseTo(inFront.dodge, 10)

  // The special table is a separate function and had the same bug.
  const specialBehind = buildSpecialAttackTable({ ...shared, attacksFromBehind: true })
  const specialFront = buildSpecialAttackTable({ ...shared, attacksFromBehind: false })
  expect(specialBehind.parry).toBe(0)
  expect(specialBehind.block).toBe(0)
  expect(specialFront.parry).toBeGreaterThan(0)
  expect(specialBehind.hit + specialBehind.crit).toBeGreaterThan(specialFront.hit + specialFront.crit)
})

test('a set with two bonuses at the same threshold renders both', async ({ page }) => {
  // Voidheart Raiment splits its 2-piece across shadow and fire. That made `bonus.pieces` stop being
  // a unique React key, and duplicate keys let React drop a child — so the second bonus could vanish
  // silently while every other assertion still passed. React only warns in the console, which no
  // test reads, hence checking the rendered count directly.
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })

  await openApp(page)
  await page.getByLabel('Class').selectOption('Warlock')
  await selectSlotItem(page, 'Head', 'voidheart-crown')
  await selectSlotItem(page, 'Chest', 'voidheart-robe')

  const sets = page.getByTestId('set-bonuses')
  await expect(sets.locator('.set-bonus-name')).toContainText('Voidheart Raiment (2/5)')
  await expect(sets.locator('.set-bonus-active'), 'both 2-piece bonuses are met, so both must show').toHaveCount(2)
  await expect(sets.locator('.set-bonus-active').filter({ hasText: 'shadow damage' })).toHaveCount(1)
  await expect(sets.locator('.set-bonus-active').filter({ hasText: 'fire damage' })).toHaveCount(1)
  await expect(sets.locator('.set-bonus-inactive')).toHaveCount(1)

  expect(consoleErrors.filter((text) => text.includes('same key')), 'duplicate React keys').toEqual([])
})

test('every tier set bonus is sourced, reachable, and honest about not being scored', async () => {
  // The set list went from 9 sets to all 17 of Tier 5, each bonus read verbatim off the Wowhead item
  // page in `sourcedFrom`. Three things have to stay true together, and each has failed somewhere in
  // this repo's history: the text must be traceable, the set must actually exist in the catalogue
  // (a bonus for a set nothing can equip is a dead entry), and nothing may claim to be scored when
  // the simulator applies none of them.
  const problems: string[] = []
  const setIdsInCatalogue = new Set(allItems.filter((item) => item.setId).map((item) => item.setId))

  for (const set of sampleItemSets) {
    if (!set.sourcedFrom && !set.needsVerification) {
      problems.push(`${set.id}: no sourcedFrom and not flagged needsVerification`)
    }
    if (!setIdsInCatalogue.has(set.id)) {
      problems.push(`${set.id}: no catalogued item carries this setId, so the set is unreachable`)
    }

    // Most sets are one 2-piece and one 4-piece, but not all, so this checks the thresholds rather
    // than the shape: Voidheart Raiment splits its 2-piece across shadow and fire, and Malorne
    // Harness splits both tiers across Bear and Cat form. An earlier version of this test asserted
    // an exact [2, 4] and would have quietly forced those extra bonuses to be dropped.
    const pieceCounts = set.bonuses.map((bonus) => bonus.pieces)
    expect(new Set(pieceCounts), `${set.id} defines bonuses at thresholds other than 2 and 4`).toEqual(new Set([2, 4]))
    expect(pieceCounts, `${set.id} bonuses must be listed in ascending piece order`).toEqual([...pieceCounts].sort((a, b) => a - b))

    for (const bonus of set.bonuses) {
      if (bonus.modelled) problems.push(`${set.id} ${bonus.pieces}pc: claims to be modelled, but nothing applies set bonuses`)
      if (!bonus.modelled && !bonus.whyNotModelled) problems.push(`${set.id} ${bonus.pieces}pc: unmodelled without saying why`)
      if (!bonus.description.trim()) problems.push(`${set.id} ${bonus.pieces}pc: empty description`)
    }
  }

  expect(problems, problems.join(' | ')).toEqual([])

  // 17 sets per tier, one per class per role. Tier 4 sits at almost exactly the same item level as
  // the 17 Gladiator PvP sets, so a batch selected by item level alone picks up both — this pins the
  // count that says only the tier sets were taken.
  expect(sampleItemSets.filter((set) => set.tier === 4).length, 'TBC Tier 4 is 17 sets').toBe(17)
  expect(sampleItemSets.filter((set) => set.tier === 5).length, 'TBC Tier 5 is 17 sets').toBe(17)

  // A full set must be assemblable, or the 4-piece bonus can never fire. Five distinct slots.
  for (const set of sampleItemSets) {
    const pieces = allItems.filter((item) => item.setId === set.id)
    const slots = new Set(pieces.map((item) => item.slot))
    expect(slots.size, `${set.id} has ${slots.size} distinct slots, so ${set.totalPieces} pieces cannot be worn at once`).toBe(set.totalPieces)
  }
})

test('item procs and on-use effects contribute at their average uptime', async () => {
  // An on-use is pressed the moment it is available, so uptime is duration over cooldown. Icon of
  // the Silver Crescent is 20s on a 2 minute cooldown — a sixth of the fight.
  expect(effectUptime(20, 120)).toBeCloseTo(1 / 6, 10)

  // A proc's internal cooldown starts when it FIRES and runs concurrently with the buff, so the
  // denominator is the cooldown alone, not cooldown plus duration. Sextant of Unstable Currents is
  // 15s against a 45s internal cooldown — a third of the fight, not a quarter.
  expect(effectUptime(15, 45)).toBeCloseTo(1 / 3, 10)

  // An effect that outlasts its own cooldown is simply always up, and can never exceed that. This
  // case is the one that caught the original formula: it had procs asymptotically approaching full
  // uptime but never reaching it, which is wrong once the cooldown runs concurrently with the buff.
  expect(effectUptime(30, 20)).toBe(1)
  expect(effectUptime(60, 10)).toBe(1)

  // No duration means nothing to average — this is how effects that cannot be expressed as a stat
  // bonus at all are recorded without silently contributing.
  expect(effectUptime(0, 45)).toBe(0)

  // The catalog's trinkets must actually carry these, or the model is wired to nothing. Every
  // trinket audited turned out to be effect-driven, so this is the item class that depends on it.
  const sextant = getItemById('sextant-of-unstable-currents')
  expect(sextant?.effect?.kind).toBe('proc')
  expect(sextant?.effect?.statBonus.spellPower).toBe(190)

  // And an effect with no stat bonus must say why, rather than looking like an oversight.
  const capacitor = getItemById('the-lightning-capacitor')
  expect(capacitor?.effect?.notModelled, 'a non-stat effect must explain itself').toBeTruthy()
  expect(Object.keys(capacitor?.effect?.statBonus ?? {})).toHaveLength(0)
})

test('a feral druid swings cat form\'s own weapon, not the equipped one', async () => {
  // Asserted against the engine rather than the simulator panel, which is currently hidden.
  const feral = simulateSpec('Druid', 'Feral', 'Night Elf', 'Alliance')

  // TBC substitutes a fixed internal weapon in cat form — 43.5-66.5 damage on a 1.0s swing, so 55
  // weapon DPS — and every cat ability reads that rather than the equipped item. Reading the equipped
  // weapon's dice meant a Feral druid's damage scaled off a staff the form never actually swings.
  expect(breakdownValue(feral.result, /Weapon damage/i)).toBeCloseTo(55, 1)

  // What the equipped weapon *does* give a Feral druid is Feral Attack Power, an explicit stat TBC
  // prints on druid weapons. It adds 1:1 into attack power, so its weight must land exactly on the
  // reference stat's 1.00 — anything else means the conversion picked up a stray multiplier.
  const feralWeights = calculateStatWeights(feral.character, feral.gear, feral.role)
  const feralApWeight = feralWeights.entries.find((entry) => entry.stat === 'feralAttackPower')
  expect(feralApWeight?.relative).toBeCloseTo(1, 2)

  // And it must not be offered to classes that can't shapeshift. For them it isn't an unmodeled
  // stat the sim might learn later, it's genuinely worthless, so it should not be probed at all.
  const fury = simulateSpec('Warrior', 'Fury', 'Human', 'Alliance')
  const furyWeights = calculateStatWeights(fury.character, fury.gear, fury.role)
  expect(furyWeights.entries.some((entry) => entry.stat === 'feralAttackPower')).toBe(false)
})

test('a both-weapons special halves its off-hand swing but not its flat bonus', async () => {
  // Mutilate and Stormstrike strike with each hand, and the engine used to treat the off-hand as a
  // straight mirror of the main hand. TBC halves the off-hand's weapon damage — including the attack
  // power folded into the swing window — while leaving the ability's flat bonus intact.
  const mutilate = getSignatureAbility('Rogue', 'Assassination')
  expect(mutilate?.scaling.hitsBothWeapons, 'Mutilate must still be flagged as striking both weapons').toBe(true)

  const dagger = getItemById('nathrezim-mindblade')
  expect(dagger?.weaponDamageMin, 'test needs a catalogued dagger with real weapon damage').toBeTruthy()
  if (!mutilate || !dagger) return

  const attackPower = 1200
  const mainHandOnly = computeSpecialDamagePerUse(mutilate, dagger, undefined, attackPower)
  const bothHands = computeSpecialDamagePerUse(mutilate, dagger, dagger, attackPower)
  const offHandContribution = bothHands - mainHandOnly

  // Identical weapons in both hands, so an unpenalised off-hand would contribute exactly as much as
  // the main hand. It must contribute strictly less.
  expect(offHandContribution).toBeLessThan(mainHandOnly)

  // Specifically: half the swing, plus the whole flat bonus.
  const flatBonus = mutilate.scaling.flatWeaponDamageBonus ?? 0
  const swing = averageSwingDamage(dagger, attackPower, mutilate.scaling.normalizedWeaponDamage === true)
  expect(offHandContribution).toBeCloseTo(swing * OFF_HAND_DAMAGE_PENALTY + flatBonus, 6)
  expect(mainHandOnly).toBeCloseTo(swing + flatBonus, 6)
})

test('the incoming attack table is ordered, and avoidance is what pushes crushing blows off it', async () => {
  // The engine spent a while summing these chances instead of resolving them in order, which let the
  // parts total more than a single swing can produce. These assertions are why that can't come back.
  const total = (table: { miss: number; dodge: number; parry: number; block: number; crit: number; crush: number; hit: number }) =>
    table.miss + table.dodge + table.parry + table.block + table.crit + table.crush + table.hit

  // An under-geared tank reaches the bottom of the table, so a crush lands on its full flat 15%.
  // Defense Rating cannot reduce that number directly — nothing can.
  const undergeared = buildIncomingAttackTable({
    missChance: 0.044,
    dodgeChance: 0.05,
    parryChance: 0.044,
    blockChance: 0.044,
    critChance: 0.056,
    crushChance: 0.15,
  })
  expect(undergeared.crush).toBeCloseTo(0.15, 10)
  expect(total(undergeared)).toBeCloseTo(1, 10)

  // Stack enough avoidance and the roll is exhausted before crushing blows are reached. This is the
  // only route to uncrushable in TBC, and it's why a Warrior could get there via Shield Block while
  // a Paladin or Druid could not.
  const uncrushable = buildIncomingAttackTable({
    missChance: 0.1,
    dodgeChance: 0.35,
    parryChance: 0.3,
    blockChance: 0.3,
    critChance: 0.056,
    crushChance: 0.15,
  })
  expect(uncrushable.crush).toBe(0)
  expect(uncrushable.crit).toBe(0)
  expect(uncrushable.hit).toBe(0)
  expect(total(uncrushable)).toBeCloseTo(1, 10)

  // The defender-side baseline must fall as the attacker out-levels the player. Reusing the
  // attacker-side formulas made it rise, handing the player the boss's own 14% parry.
  const equalLevel = buildDefenderAvoidanceBaseline(70)
  const raidBoss = buildDefenderAvoidanceBaseline(73)
  expect(equalLevel.parry).toBeCloseTo(0.05, 10)
  expect(raidBoss.parry).toBeCloseTo(0.044, 10)
  expect(raidBoss.parry).toBeLessThan(equalLevel.parry)
  expect(raidBoss.dodgeLevelPenalty).toBeCloseTo(-0.006, 10)

  // 5.6% raw boss crit is what makes 490 the uncrittable number: 0.056 / 0.0004 = 140 over the 350
  // a level 70 already has.
  expect(computeAttackerBaseCritChance(73)).toBeCloseTo(0.056, 10)
  expect(computeAttackerBaseCritChance(70)).toBeCloseTo(0.05, 10)
})

test('the item catalog and the raid data agree on where every drop comes from', async () => {
  // These two datasets were researched separately and drifted: six items named a boss or instance
  // that the raid data contradicted, which made BiS lists double as *wrong* acquisition plans. This
  // check is the reason that can't silently happen again.
  const raidById = new Map(sampleRaids.map((raid) => [raid.id, raid]))
  const disagreements: string[] = []

  for (const boss of sampleRaidBosses) {
    for (const loot of boss.loot) {
      if (!loot.itemId) continue

      const item = allItems.find((entry) => entry.id === loot.itemId)
      expect(item, `raid loot references unknown item "${loot.itemId}"`).toBeTruthy()
      if (!item) continue

      const raid = raidById.get(boss.raidId)
      expect(raid, `boss ${boss.name} references unknown raid "${boss.raidId}"`).toBeTruthy()
      if (!raid) continue

      // The catalog and the raid browser use different spellings of the same instance
      // ("Tempest Keep" vs "The Eye"), which is why the raid carries every alias it goes by.
      if (item.instance && !raid.instanceNames.includes(item.instance)) {
        disagreements.push(`${item.id}: catalog instance "${item.instance}" is not one of ${raid.name}'s names`)
      }

      // Only boss drops pin a boss. A tier token or trash drop legitimately doesn't.
      if (loot.dropType === 'Boss' && item.boss && item.boss !== boss.name) {
        disagreements.push(`${item.id}: catalog boss "${item.boss}" but raid data says "${boss.name}"`)
      }
    }
  }

  expect(disagreements, `item catalog disagrees with raid data: ${disagreements.join(' | ')}`).toEqual([])
})

test('racial traits apply to stats, and weapon-conditional ones follow the equipped weapon', async ({ page }) => {
  await openApp(page)

  // Default is a Human Fury Warrior. Human Sword Specialization is conditional on a sword, so equip
  // one explicitly — this used to lean on the default main hand happening to be a sword, which
  // stopped being true when the catalogue was re-ingested.
  // The traits list has been removed from the Character panel, so this now reads the racial where it
  // actually matters — the stat totals on the rail. That is the stronger assertion of the two
  // anyway: the old version could pass on a correct label while the stats went unchanged.
  await selectSlotItem(page, 'Main Hand', 'iblis-blade-of-the-fallen-seraph')

  const expertiseWithSword = readStatValue(await page.getByTestId('stat-expertise').innerText())
  expect(expertiseWithSword, 'Sword Specialization is +5 Expertise while a sword is equipped').toBeGreaterThan(0)

  // Swap to a non-sword main hand: the racial must switch off and the expertise must actually drop.
  // It has to be an axe, not the mace this once used — Humans get Mace Specialization too, so a mace
  // keeps expertise up and hides the very regression this assertion exists to catch.
  await selectSlotItem(page, 'Main Hand', 'crulshorukh-edge-of-chaos')
  expect(readStatValue(await page.getByTestId('stat-expertise').innerText())).toBeLessThan(expertiseWithSword)
})

test('changing race changes the racial list and the resulting stats', async ({ page }) => {
  await openApp(page)

  // Gnome's Expansive Mind is a flat +5% Intellect, so it should move Intellect for any class.
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Gnome')
  await page.getByLabel('Class').selectOption('Mage')
  const gnomeIntellect = readStatValue(await page.getByTestId('stat-intellect').innerText())

  // Undead has no passive stat racial at all, so the same Mage should end up with less Intellect.
  // Asserted through the rail rather than a traits list, which no longer exists on this panel.
  await page.getByLabel('Faction').selectOption('Horde')
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Undead')
  await page.getByLabel('Class').selectOption('Mage')

  expect(readStatValue(await page.getByTestId('stat-intellect').innerText())).toBeLessThan(gnomeIntellect)
})

test('named build slots survive a character switch that would overwrite the autosave', async ({ page }) => {
  await openApp(page)
  await expect(page.getByTestId('build-slots-empty')).toBeVisible()

  // Set up a Fury Warrior and save it under a name.
  await expect(page.getByLabel('Class')).toHaveValue('Warrior')
  await page.getByTestId('build-slot-name').fill('Fury main')
  await page.getByTestId('build-slot-save').click()
  await expect(page.getByTestId('build-status')).toContainText(/Saved as/i)
  await expect(page.getByTestId('build-slot-list')).toContainText('Fury main')

  // Switch to a completely different character. This is exactly what used to destroy the build,
  // because the autosave holds only one and overwrites it on every change.
  await page.getByLabel('Class').selectOption('Mage')
  await expect(page.getByLabel('Class')).toHaveValue('Mage')

  // The named slot is untouched, and loading it restores the original character.
  await expect(page.getByTestId('build-slot-list')).toContainText('Fury main')
  await page.getByTestId('build-slot-load-Fury main').click()
  await expect(page.getByLabel('Class')).toHaveValue('Warrior')
  await expect(page.getByLabel('Specialization')).toHaveValue('Fury')

  // Slots persist across a reload, since they live in storage rather than component state. The
  // section choice does not, so re-enter the planner before looking for them.
  await page.reload()
  await page.getByTestId('section-planner').click()
  await expect(page.getByTestId('build-slot-list')).toContainText('Fury main')

  await page.getByTestId('build-slot-delete-Fury main').click()
  await expect(page.getByTestId('build-slots-empty')).toBeVisible()
})

test('Draenei get the hit racial matching their class, not both', async ({ page }) => {
  await openApp(page)
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Draenei')

  // Warriors get Heroic Presence (melee/ranged hit) and must NOT also get the caster version, so a
  // Draenei Warrior's spell hit stays where a non-Draenei's would be. Read off the rail: the traits
  // list this used to check is gone from the Character panel, and the stat totals were always the
  // real subject — granting both racials would show up here and nowhere else.
  await page.getByLabel('Class').selectOption('Warrior')
  const warriorSpellHit = readStatValue(await page.getByTestId('stat-spell-hit').innerText())

  // Shamans get Inspiring Presence (spell hit) instead — the two are separate racials in TBC, and
  // granting both would hand every Draenei twice the hit they actually have.
  await page.getByLabel('Class').selectOption('Shaman')
  expect(readStatValue(await page.getByTestId('stat-spell-hit').innerText())).toBeGreaterThan(warriorSpellHit)
})
