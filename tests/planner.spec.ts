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
import { computeCoverage, describeSuggestion } from '../src/domain/raidcomp'
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
  getTargetDebuffById,
  modelledTargetDebuffs,
  sampleTargetDebuffs,
  unmodelledTargetDebuffs,
} from '../src/domain/buffs/sampleTargetDebuffs'
import { computeArmorMitigation } from '../src/domain/simulation/damageFormulas'
import { defaultSimulationTarget } from '../src/domain/simulation/sampleEncounters'
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
import {
  allItems,
  defaultMaxPhase,
  getItemById,
  getItemByWowItemId,
  getItemsForSlot,
  isWithinDefaultPhase,
} from '../src/domain/gear/itemCatalogue'
import { excludedByPhase } from '../src/domain/bis'
import { validateBuild } from '../src/domain/builds/buildSerialization'
import { BUILD_FORMAT_VERSION } from '../src/domain/builds/buildTypes'
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
async function openApp(page: Page, section: 'planner' | 'raidcomp' | 'tierlists' | 'raids' | 'professions' = 'planner') {
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
  // Which sub-tab you were last on is session state that survives a trip to Simulation, so coming
  // back does not necessarily land on Gear. Ask for it rather than assuming it.
  await openPlannerView(page, 'Gear')
  await expect(page.getByRole('heading', { name: 'Gear', exact: true })).toBeVisible()
}

/**
 * The planner's four panels are sub-tabs now rather than one 15-screen column, so a test that wants
 * Talents, Ranked Gear or Build has to ask for it the way a user does. Gear is the default view, so
 * the many gear-only tests need no call at all.
 *
 * Idempotent by design — the helpers below call it freely, and clicking the tab you are already on
 * is a no-op rather than something a test has to track.
 */
async function openPlannerView(page: Page, view: 'Gear' | 'Talents' | 'Buffs' | 'Ranked Gear' | 'Build') {
  await page.getByRole('navigation', { name: 'Planner sections' }).getByRole('button', { name: view, exact: true }).click()
}

/**
 * Asserts a spec is not offered a slot at all.
 *
 * This exists rather than a bare `expect(slotCell(...)).toHaveCount(0)` because that assertion is
 * **vacuously true on any view where the gear grid is not rendered**. With the panels behind
 * sub-tabs, a test that drifted onto Ranked Gear would keep passing while asserting nothing, which
 * is the worst possible failure for a test whose whole subject is slot visibility.
 */
async function expectSlotHidden(page: Page, slot: string) {
  await openPlannerView(page, 'Gear')
  await expect(slotCell(page, slot)).toHaveCount(0)
}

/** Asserts the ranked-gear panel is showing a given spec's list, switching to that view first. */
async function expectRankedList(page: Page, title: string) {
  await openPlannerView(page, 'Ranked Gear')
  await expect(page.getByText(title)).toBeVisible()
}

/**
 * Asserts the ranking has a section for a slot, under the label that spec uses for it.
 *
 * The slot display name is a *heading* only in the ranking — the gear grid renders it as a span — so
 * these assertions belong to that view and nowhere else.
 */
async function expectRankingHeading(page: Page, label: string) {
  await openPlannerView(page, 'Ranked Gear')
  await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible()
}

/** The absence form, which needs the view switch even more: elsewhere it passes vacuously. */
async function expectNoRankingHeading(page: Page, label: string) {
  await openPlannerView(page, 'Ranked Gear')
  await expect(page.getByRole('heading', { name: label, exact: true })).toHaveCount(0)
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
  // Every gear interaction routes through here, so putting the view switch in one place is what
  // keeps the tests that interleave gear and rankings from having to track which tab they are on.
  await openPlannerView(page, 'Gear')
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
import { getGemById, sampleGems, socketBonusIsActive } from '../src/domain/gems/sampleGems'
import { countGemColors, metaGemIsActive } from '../src/domain/gems/gemTypes'
import type { SocketColor } from '../src/domain/gear/itemTypes'
import { classesWithTalents, getTalentData, talentIconNames } from '../src/domain/talents/sampleTalents'
import { POINTS_PER_ROW, TALENT_POINTS_AT_70, canRemovePoint, pointsInTree, pointsSpent, whyBlocked } from '../src/domain/talents/talentTypes'
import {
  classHasTalentEffects,
  deriveTalentModifiers,
  flurrySpeedMultiplier,
  noTalentModifiers,
  unmodelledTalents,
} from '../src/domain/talents/talentModifiers'
import { sampleRaidBosses } from '../src/domain/raids/sampleRaidBosses'
import { sampleRaids } from '../src/domain/raids/sampleRaids'
import { getPlacementsForSpec, specTierLists } from '../src/domain/tierlists'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { distinctIconCount, getIconName, mappedIconCount } from '../src/domain/icons/icons'
import { isObtainable, unobtainableItems, unobtainableWowItemIds } from '../src/domain/gear/obtainability'
import { findUpgrades } from '../src/features/simulator/findUpgrades'
import { relevantStats } from '../src/domain/stats/statRelevance'
import { statLabels } from '../src/domain/stats/statTypes'
import {
  MAIN_HAND_HIT_FACTOR,
  OFF_HAND_HIT_FACTOR,
  RAGE_CONVERSION_FACTOR,
  RAGE_PER_POINT_OF_DAMAGE,
  bloodrageRagePerSecond,
  rageDumpUsesPerSecond,
  rageFromDamageTaken,
  rageFromOneSwing,
  ragePerSecondFromWeapon,
} from '../src/domain/simulation/rageModel'
import { getRotationAbilities } from '../src/domain/abilities'
import { computeManaBudget, manaFromIntellect, mp5RegenPerSecond, spiritRegenPerSecond } from '../src/domain/simulation/manaModel'
import { EMPTY_OFF_HAND, isEmptySlotItem } from '../src/domain/gear/slotCompatibility'
import { applyWeaponSlotRules } from '../src/domain/gear/characterItemRules'


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
  await expect(page.getByRole('combobox', { name: 'Specialization' })).toHaveValue('Fury')
  // Deliberately not pinned to a specific item. The default is whichever legal item the catalogue
  // offers first, which legitimately moves whenever the catalogue is re-ingested; what this test
  // actually cares about is that a legal weapon is equipped at all.
  await withSlotOpen(page, 'Main Hand', async () => {
    await expect(page.getByLabel('Main Hand', { exact: true })).not.toHaveValue('')
  })

  // Regression check: Warriors have no Relic slot, and the default gear should not silently
  // inherit phantom spell/healing power from an illegally-equipped Totem/Libram/Idol.
  await expectSlotHidden(page, 'Relic')
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
  await expect(page.getByRole('combobox', { name: 'Specialization' })).toHaveValue('Arcane')
  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Fire')

  // The panel used to restate the character as "Blood Elf Fire Mage" under the selects. That summary
  // has been removed, so the selects themselves are the record of what was chosen — and they are the
  // thing the rest of this test depends on being right.
  await expect(page.getByRole('combobox', { name: 'Race' })).toHaveValue('Blood Elf')
  await expect(page.getByLabel('Class')).toHaveValue('Mage')
  await expect(page.getByRole('combobox', { name: 'Specialization' })).toHaveValue('Fire')

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
  await expect(page.getByRole('combobox', { name: 'Specialization' })).toHaveValue('Discipline')
  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Holy')
  await selectSlotItem(page, 'Hands', 'healers-grace-gloves')
  await selectSlotEnchant(page, 'Hands', 'Gloves - Major Healing')

  // Gear on the planner, results on the simulation tab, and back again for the tank half.
  await runSimulation(page)
  await expect(page.getByText(/Estimated Healing/i)).toBeVisible()
  await expect(page.getByText(/Heal crit\/haste estimate/i)).toBeVisible()

  await openPlannerTab(page)
  await page.getByLabel('Class').selectOption('Paladin')
  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Protection')
  await selectSlotItem(page, 'Chest', 'bulwark-chestguard')
  // Aldori Legacy Defender rather than the old Shield of Rehearsal fixture, which could not be found
  // in Wowhead's TBC database at all and has since been deleted from the catalogue as fictional.
  // A test asserting real block mechanics must rest on an item that exists.
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
  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Enhancement')

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
  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Enhancement')

  await withSlotOpen(page, 'Off Hand', async () => {
    await expect(page.getByLabel('Off Hand', { exact: true }).locator('option', { hasText: 'Rod of the Sun King' })).toHaveCount(1)
  })
  await withSlotOpen(page, 'Off Hand', async () => {
    // Aldori Legacy Defender rather than the old Shield of Rehearsal fixture. That item has since
    // been deleted as fictional, which would have made this assertion pass for the worst possible
    // reason — an absence test against something that does not exist proves nothing about filtering.
    // This one is a real Tank shield a Protection Warrior *is* offered (247 off-hand options against
    // an Enhancement Shaman's 126), so its absence here is the filter actually working.
    await expect(page.getByLabel('Off Hand', { exact: true }).locator('option', { hasText: 'Aldori Legacy Defender' })).toHaveCount(0)
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

  await expectSlotHidden(page, 'Ranged')
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
  await expectRankingHeading(page, 'Totem')
  await expectNoRankingHeading(page, 'Ranged')

  // Instance and boss used to be a separate "Farm" row restating the source in more words. They now
  // sit on the single identity line with the item id and slot, so this asserts the content rather
  // than the old row's exact punctuation.
  const leotherasRow = page.locator('.bis-entry', { hasText: 'Leotheras the Blind' }).first()
  await expect(leotherasRow).toContainText('Serpentshrine Cavern')
  await expect(leotherasRow).toContainText('Leotheras the Blind')
  await expect(page.getByText(/Needs source\/rank verification/i).first()).toBeVisible()
})

test('BiS panel shows Enhancement Shaman rankings and equips a listed item', async ({ page }) => {
  await openApp(page)
  await openPlannerView(page, 'Ranked Gear')

  await expect(page.getByRole('heading', { name: /BiS \/ Ranked Gear/i })).toBeVisible()

  await page.getByLabel('Faction').selectOption('Horde')
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Troll')
  await page.getByLabel('Class').selectOption('Shaman')
  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Enhancement')

  await expect(page.getByTestId('bis-panel')).toBeVisible()
  await expectRankedList(page, 'Enhancement Shaman Phase 2 Ranked List')
  await expectRankingHeading(page, 'Head')
  await expect(page.getByTestId('bis-panel').getByRole('heading', { name: 'Cataclysm Helm' })).toBeVisible()
  // The id is now prefixed with # on the compact identity line rather than spelled "Item ID".
  await expect(page.getByTestId('bis-panel').getByText(/#30190/)).toBeVisible()

  const before = readStatValue(await page.getByTestId('stat-attack-power').innerText())
  await page.getByRole('button', { name: /Equip Cataclysm Helm/i }).click()

  await withSlotOpen(page, 'Head', async () => {
    await expect(page.getByLabel('Head', { exact: true })).toHaveValue('cataclysm-helm')
  })
  // Checking the gear grid moved us back to the Gear view; the Equipped button lives on the ranking.
  await openPlannerView(page, 'Ranked Gear')
  await expect(page.getByRole('button', { name: /Equipped/i }).first()).toBeDisabled()

  const after = readStatValue(await page.getByTestId('stat-attack-power').innerText())
  expect(after).toBeGreaterThan(before)
})

test('BiS panel can equip paired trinket targets without duplicating unique items', async ({ page }) => {
  await openApp(page)

  await page.getByLabel('Faction').selectOption('Horde')
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Troll')
  await page.getByLabel('Class').selectOption('Shaman')
  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Enhancement')

  // One row per trinket: the ranking is not duplicated across Trinket 1 and Trinket 2, because each
  // row already carries an equip button for both sockets.
  const dragonspineRow = page.locator('.bis-entry', { hasText: 'Dragonspine Trophy' })
  const bloodlustRow = page.locator('.bis-entry', { hasText: 'Bloodlust Brooch' })

  // This test alternates between the ranking and the gear grid, which are separate sub-tabs now.
  // `withSlotOpen` moves to Gear on its own, so each return to a row has to ask for Ranked Gear.
  await openPlannerView(page, 'Ranked Gear')
  await dragonspineRow.getByRole('button', { name: 'Equip Trinket 1' }).click()
  await withSlotOpen(page, 'Trinket 1', async () => {
    await expect(page.getByLabel('Trinket 1', { exact: true })).toHaveValue('dragonspine-trophy')
  })

  await openPlannerView(page, 'Ranked Gear')
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
  await expect(page.getByRole('combobox', { name: 'Specialization' })).toHaveValue('Elemental')

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
  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Enhancement')
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
  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Holy')

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
  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Elemental')

  await expectSlotHidden(page, 'Ranged')
  await expectRankingHeading(page, 'Totem')
  await expectRankedList(page, 'Elemental Shaman Phase 2 Ranked List')
  await withSlotOpen(page, 'Main Hand', async () => {
    await expect(page.getByLabel('Main Hand', { exact: true }).locator('option', { hasText: 'The Nexus Key' })).toHaveCount(1)
  })

  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Restoration')

  await expectSlotHidden(page, 'Ranged')
  await expectRankingHeading(page, 'Totem')
  await expectRankedList(page, 'Restoration Shaman Phase 2 Ranked List')
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
  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Arms')

  await expectSlotHidden(page, 'Relic')
  await expectRankedList(page, 'Arms Warrior Phase 2 Ranked List')
  await withSlotOpen(page, 'Main Hand', async () => {
    await expect(page.getByLabel('Main Hand', { exact: true }).locator('option', { hasText: 'Twinblade of the Phoenix' })).toHaveCount(1)
  })

  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Protection')

  await expectSlotHidden(page, 'Relic')
  await expectRankedList(page, 'Protection Warrior Phase 2 Ranked List')
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
  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Holy')

  await expectSlotHidden(page, 'Ranged')
  // Asserted on the gear slot rather than a BiS heading: the Holy Paladin guide publishes no Libram
  // section, so there is no ranking to head — but the slot itself must still be labelled Libram.
  await expect(slotCell(page, 'Libram')).toHaveCount(1)
  await expectRankedList(page, 'Holy Paladin Phase 2 Ranked List')
  await withSlotOpen(page, 'Off Hand', async () => {
    await expect(page.getByLabel('Off Hand', { exact: true }).locator('option', { hasText: 'Aegis of the Vindicator' })).toHaveCount(1)
  })

  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Protection')

  await expectSlotHidden(page, 'Ranged')
  await expectRankingHeading(page, 'Libram')
  await expectRankedList(page, 'Protection Paladin Phase 2 Ranked List')

  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Retribution')

  await expectSlotHidden(page, 'Ranged')
  await expectRankingHeading(page, 'Libram')
  await expectRankedList(page, 'Retribution Paladin Phase 2 Ranked List')
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
  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Holy')

  await expectSlotHidden(page, 'Relic')
  await expectRankedList(page, 'Holy Priest Phase 2 Ranked List')
  await withSlotOpen(page, 'Ranged', async () => {
    await expect(page.getByLabel('Ranged', { exact: true }).locator('option', { hasText: 'Luminescent Rod of the Naaru' })).toHaveCount(1)
  })

  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Discipline')
  await expectRankedList(page, 'Discipline Priest Phase 2 Ranked List')

  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Shadow')

  await expectSlotHidden(page, 'Relic')
  await expectRankedList(page, 'Shadow Priest Phase 2 Ranked List')
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
  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Balance')

  await expectSlotHidden(page, 'Ranged')
  await expectRankingHeading(page, 'Idol')
  await expectRankedList(page, 'Balance Druid Phase 2 Ranked List')

  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Feral')

  await expectSlotHidden(page, 'Ranged')
  await expectRankingHeading(page, 'Idol')
  await expectRankedList(page, 'Feral Druid Phase 2 Ranked List')

  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Restoration')

  await expectSlotHidden(page, 'Ranged')
  await expectRankingHeading(page, 'Idol')
  await expectRankedList(page, 'Restoration Druid Phase 2 Ranked List')
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
  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Beast Mastery')

  await expectSlotHidden(page, 'Relic')
  await expectRankedList(page, 'Beast Mastery Hunter Phase 2 Ranked List')
  await withSlotOpen(page, 'Ranged', async () => {
    await expect(page.getByLabel('Ranged', { exact: true }).locator('option', { hasText: 'Sunfury Bow of the Phoenix' })).toHaveCount(1)
  })

  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Marksmanship')
  await expectRankedList(page, 'Marksmanship Hunter Phase 2 Ranked List')

  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Survival')

  await expectSlotHidden(page, 'Relic')
  await expectRankedList(page, 'Survival Hunter Phase 2 Ranked List')
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
  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Arcane')

  await expectSlotHidden(page, 'Relic')
  await expectRankedList(page, 'Arcane Mage Phase 2 Ranked List')
  await withSlotOpen(page, 'Ranged', async () => {
    await expect(page.getByLabel('Ranged', { exact: true }).locator('option', { hasText: 'Eredar Wand of Obliteration' })).toHaveCount(1)
  })

  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Fire')
  await expectRankedList(page, 'Fire Mage Phase 2 Ranked List')

  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Frost')

  await expectSlotHidden(page, 'Relic')
  await expectRankedList(page, 'Frost Mage Phase 2 Ranked List')
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
  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Assassination')

  await expectSlotHidden(page, 'Relic')
  await expectRankedList(page, 'Assassination Rogue Phase 2 Ranked List')
  await withSlotOpen(page, 'Main Hand', async () => {
    await expect(page.getByLabel('Main Hand', { exact: true }).locator('option', { hasText: 'Fang of Vashj' })).toHaveCount(1)
  })
  await withSlotOpen(page, 'Off Hand', async () => {
    await expect(page.getByLabel('Off Hand', { exact: true }).locator('option', { hasText: 'Heartrazor' })).toHaveCount(1)
  })
  await withSlotOpen(page, 'Ranged', async () => {
    await expect(page.getByLabel('Ranged', { exact: true }).locator('option', { hasText: 'Arcanite Steam-Pistol' })).toHaveCount(1)
  })

  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Combat')
  await expectRankedList(page, 'Combat Rogue Phase 2 Ranked List')
  await withSlotOpen(page, 'Main Hand', async () => {
    // Was 'Warp Slicer', which is one of Kael'thas's encounter weapons and is no longer offered to
    // anyone — see domain/gear/obtainability.ts. Rod of the Sun King is a real ilvl 141 Tempest Keep
    // drop and an actual Combat Rogue main-hand, so it tests the same thing without asserting a bug.
    await expect(page.getByLabel('Main Hand', { exact: true }).locator('option', { hasText: 'Rod of the Sun King' })).toHaveCount(1)
  })
  await withSlotOpen(page, 'Off Hand', async () => {
    await expect(page.getByLabel('Off Hand', { exact: true }).locator('option', { hasText: "Latro's Shifting Sword" })).toHaveCount(1)
  })

  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Subtlety')

  await expectSlotHidden(page, 'Relic')
  await expectRankedList(page, 'Subtlety Rogue Phase 2 Ranked List')
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
  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Affliction')

  await expectSlotHidden(page, 'Relic')
  await expectRankedList(page, 'Affliction Warlock Phase 2 Ranked List')
  await withSlotOpen(page, 'Main Hand', async () => {
    await expect(page.getByLabel('Main Hand', { exact: true }).locator('option', { hasText: 'Fang of the Leviathan' })).toHaveCount(1)
  })
  // A Warlock's default main hand is a staff, which occupies both hands — so the off hand offers
  // nothing until a one-hander is equipped. Equip one first, then check the off-hand options; that
  // is the capability the assertion is actually about.
  await selectSlotItem(page, 'Main Hand', 'fang-of-the-leviathan')
  await withSlotOpen(page, 'Off Hand', async () => {
    await expect(page.getByLabel('Off Hand', { exact: true }).locator('option', { hasText: 'Fathomstone' })).toHaveCount(1)
  })
  await withSlotOpen(page, 'Ranged', async () => {
    await expect(page.getByLabel('Ranged', { exact: true }).locator('option', { hasText: 'Wand of the Forgotten Star' })).toHaveCount(1)
  })

  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Demonology')
  await expectRankedList(page, 'Demonology Warlock Phase 2 Ranked List')

  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Destruction')

  await expectSlotHidden(page, 'Relic')
  await expectRankedList(page, 'Destruction Warlock Phase 2 Ranked List')
  await expectRankingHeading(page, 'Head')
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

  /*
   * Armor penetration genuinely is not read by the engine, so it must be called out as unmodeled
   * rather than silently listed as worth zero.
   *
   * **Haste used to be on that list and no longer belongs there.** White damage has scaled by
   * `(1 + haste)` since melee haste was modelled; `CONSUMED_STATS` was simply never updated, so the
   * panel went on telling players the engine did not read a stat it did read. This assertion used to
   * pin the stale claim — worth flagging, because it is the reverse of the two tests in this file
   * that codify real bugs and must NOT be "fixed".
   *
   * It matters beyond the label: probed, haste comes out above Agility and near Expertise, so the
   * panel was hiding a strong stat. Separately and still true, Phase 2 gear carries almost none to
   * find — what a point is worth and how many points exist are different questions.
   */
  const unmodeled = page.locator('.stat-weights-unmodeled')
  await expect(unmodeled).toContainText('Armor Pen')
  await expect(unmodeled, 'haste is modelled and must not be listed as unmodelled').not.toContainText('Haste Rating')
  await expect(page.getByTestId('stat-weight-hasteRating')).toHaveCount(1)
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
  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Holy')
  await openSimulationTab(page)
  await expect(page.getByTestId('stat-weight-healingPower')).toContainText('1.00')
  await expect(page.locator('.stat-weights-unmodeled')).toContainText('MP5')

  // Tanks normalize against stamina and get the avoidance stat set.
  await openPlannerTab(page)
  await page.getByLabel('Class').selectOption('Warrior')
  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Protection')
  await openSimulationTab(page)
  await expect(page.getByTestId('stat-weight-stamina')).toContainText('1.00')
  await expect(page.getByTestId('stat-weight-defenseRating')).toBeVisible()
})

test('the encounter is stated, not configured, and the fixed target is the one the model uses', async ({ page }) => {
  /*
   * The panel used to offer a target-level select, an armor field and three armor presets. All of it
   * was removed by request — the tab exists to gear a character and press Run, and the reference TBC
   * simulators fix a standard raid target rather than asking first.
   *
   * The target is still *named*, which is a different thing from being configurable: a DPS figure
   * means nothing without knowing what it was measured against.
   */
  await openApp(page)
  await openSimulationTab(page)

  // DR = armor / (armor + K), K = 467.5 * 70 - 22167.5 = 10557.5, so 7700 / 18257.5 = 42.2%.
  await expect(page.getByTestId('encounter-armor-mitigation')).toHaveText('42.2%')
  await expect(page.getByText(/level 73/i).first()).toBeVisible()

  // No controls survive. Asserted against the panel rather than the page, so this cannot pass by the
  // panel having failed to render at all.
  const encounter = page.getByRole('region', { name: 'Encounter', exact: true })
  await expect(encounter).toBeVisible()
  await expect(encounter.locator('select')).toHaveCount(0)
  await expect(encounter.locator('input')).toHaveCount(0)
  await expect(encounter.locator('.encounter-preset')).toHaveCount(0)
})

test('armor and target level still reach the simulation, now that nothing sets them by hand', () => {
  /*
   * The coverage the removed encounter test used to provide, kept against the domain instead of the
   * controls. Armor and level are load-bearing inputs — armor decides how much damage survives, the
   * level gap drives the whole attack table — so a wiring break would be invisible from the UI now
   * that nothing adjusts them.
   */
  const character: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Warrior', spec: 'Fury' }
  const gear = normalizeGearForCharacter(defaultGear, 'Warrior', 'Fury')
  const stats = calculateStats(character, gear)
  const run = (target: typeof defaultSimulationTarget) =>
    calculateSimulation(character, gear, stats, 'Physical DPS', [], target).scoreExact

  const standard = run(defaultSimulationTarget)
  const lightlyArmored = run({ ...defaultSimulationTarget, armor: 3500 })
  const evenLevel = run({ ...defaultSimulationTarget, level: 70 })

  expect(lightlyArmored, 'less armor must let more damage through').toBeGreaterThan(standard)
  expect(evenLevel, 'an even-level target cannot glance or dodge as much').toBeGreaterThan(standard)

  // And the fixed target really is the level 73 boss the panel names.
  expect(defaultSimulationTarget.level).toBe(73)
  expect(defaultSimulationTarget.armor).toBe(7700)
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

  // A ranking built on estimated stats has to say so rather than presenting every delta as equally
  // solid. This used to require at least one flagged row here, which stopped being true for the
  // right reason: excluding the unobtainable items moved Fury Warrior's starting weapons from
  // Kael'thas's ilvl 175 props to real sourced Phase 2 epics, so its upgrades now compare sourced
  // against sourced and correctly have nothing to warn about. Fury is the only one of the 27 specs
  // in that position — `dataQuality` reachability is pinned separately below, so the disclosure
  // cannot quietly die while this test still passes.
  for (const text of await list.locator('.upgrade-data-note').allInnerTexts()) {
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
  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Fire')

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
  await expect(page.getByRole('combobox', { name: 'Specialization' })).toHaveValue('Fire')
})

test('a build can be exported and imported back', async ({ page }) => {
  await openApp(page)
  await openPlannerView(page, 'Build')

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
  await openPlannerView(page, 'Build')

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
  await openPlannerView(page, 'Build')

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

test('Raids opens on a picker, then shows one raid’s loot with the rest in the rail', async ({ page }) => {
  // The raids panel is one of three things this repo has historically shipped that nothing rendered,
  // so this covers that it still renders — and now that it renders the right thing. The tab used to
  // stack five raids' loot behind a boss-by-boss accordion; it now asks which raid first.
  await openApp(page)
  await page.getByRole('button', { name: 'Raids', exact: true }).click()

  // Picker first, and no rail yet — there is nothing to switch between until something is chosen.
  await expect(page.getByTestId('raid-pick-serpentshrine-cavern')).toBeVisible()
  await expect(page.locator('.rail')).toHaveCount(0)

  await page.getByTestId('raid-pick-serpentshrine-cavern').click()

  const detail = page.getByTestId('raid-detail')
  await expect(detail).toBeVisible()
  await expect(detail).toContainText('Lady Vashj')

  // Loot is expanded on arrival. The accordion this replaced hid the one thing the page is for
  // behind a click per boss.
  const firstDrop = detail.locator('.raid-loot-row').first()
  await expect(firstDrop).toBeVisible()
  await expect(firstDrop.locator('.raid-loot-frame')).toBeVisible()
  // A loot table of names alone says what drops but not whether you want it.
  await expect(detail.locator('.raid-loot-stats').first()).toBeVisible()

  // Explicitly not a fight guide any more.
  await expect(detail.locator('.raid-boss-mechanics')).toHaveCount(0)
  await expect(detail.locator('.raid-boss-role-notes')).toHaveCount(0)

  // The other raids move to the rail, so switching never leaves the page.
  await expect(page.getByTestId('rail-raid-tempest-keep')).toBeVisible()
  await page.getByTestId('rail-raid-tempest-keep').click()
  await expect(page.getByTestId('raid-detail')).toContainText(/Al'ar|Void Reaver|Kael/)

  // Attunement chains exist only for Serpentshrine Cavern and Tempest Keep, and are access
  // information rather than a fight guide, so they survive the loot-only rework.
  await page.getByRole('button', { name: 'Attunement', exact: true }).click()
  const attunement = page.getByTestId('raid-attunement')
  await expect(attunement).toBeVisible()
  await expect(attunement.locator('li').first()).toBeVisible()

  // And the picker is reachable again.
  await page.getByTestId('raids-back-to-picker').click()
  await expect(page.getByTestId('raid-pick-karazhan')).toBeVisible()
})

test('the Warrior talent trees are complete and their spending rules hold', async () => {
  // Ingested from Wowhead's TBC talent calculator, joining the grid payload (row, column, ranks,
  // prerequisites) to the spell payload that carries each rank's name and description.
  const data = getTalentData('Warrior')
  expect(data, 'Warrior talents must be ingested').toBeTruthy()
  expect(data!.trees.map((tree) => tree.spec)).toEqual(['Arms', 'Fury', 'Protection'])

  for (const tree of data!.trees) {
    // Nine rows, 0-indexed. The deepest is the 41-point tier, and it is the talent a build is
    // usually named after — the panel rendered eight rows at first and dropped it from all three.
    const deepest = tree.talents.filter((talent) => talent.row === 8)
    expect(deepest.length, `${tree.spec} must have a 41-point talent`).toBe(1)

    for (const talent of tree.talents) {
      expect(talent.name, `${tree.spec} talent ${talent.id} needs a name`).toBeTruthy()
      expect(talent.rankDescriptions.length, `${talent.name} needs one description per rank`).toBe(talent.maxRank)
      expect(talent.spellIds.length).toBe(talent.maxRank)
      expect(talent.column).toBeGreaterThanOrEqual(0)
      expect(talent.column).toBeLessThanOrEqual(3)
    }
  }

  const arms = data!.trees[0]
  const fury = data!.trees[1]
  expect(fury.talents.find((talent) => talent.row === 8)!.name).toBe('Rampage')

  // A row is gated on points already in that tree, and the gate is stated rather than just disabling.
  const deepArms = arms.talents.find((talent) => talent.row === 8)!
  expect(whyBlocked(data!.trees, arms, deepArms, {})).toMatch(/Needs 40 points in Arms/)

  // Filling row 0 opens row 1 but nothing deeper.
  const firstRow = arms.talents.find((talent) => talent.row === 0)!
  const secondRow = arms.talents.find((talent) => talent.row === 1)!
  const fiveInRowOne = { [firstRow.id]: firstRow.maxRank, [arms.talents.filter((t) => t.row === 0)[1]?.id ?? -1]: 5 - firstRow.maxRank }
  expect(whyBlocked(data!.trees, arms, secondRow, fiveInRowOne)).toBeUndefined()

  // The 41-point budget is global, not per tree. Spending it all in Arms must close Fury.
  const allSpent: Record<number, number> = {}
  let left = TALENT_POINTS_AT_70
  for (const talent of [...arms.talents].sort((a, b) => a.row - b.row)) {
    if (left <= 0) break
    const take = Math.min(talent.maxRank, left)
    allSpent[talent.id] = take
    left -= take
  }
  expect(pointsSpent(data!.trees, allSpent)).toBe(TALENT_POINTS_AT_70)
  expect(whyBlocked(data!.trees, fury, fury.talents[0], allSpent)).toBe('No points left.')

  // Removal is refused where the game would refuse it. `allSpent` is a legitimately reachable state
  // — it was filled from row 0 downward — which matters, because a hand-built state that already
  // violates the row rules makes every removal illegal and proves nothing.
  const deepestFilled = [...arms.talents].filter((talent) => (allSpent[talent.id] ?? 0) > 0).sort((a, b) => b.row - a.row)[0]
  expect(canRemovePoint(arms, deepestFilled, allSpent), 'the deepest spent talent is always removable').toBe(true)

  // Removing a single point can never strand a deeper talent below its row requirement, because the
  // requirement counts points in the whole tree — including the deep point itself. Placing one
  // therefore always leaves the total at least one above the gate, so taking one back leaves exactly
  // enough. Asserted rather than assumed: `canRemovePoint` guards against it anyway, and this pins
  // the reasoning so the guard is not mistaken for something that fires.
  const rowZero = arms.talents.filter((talent) => talent.row === 0)
  const tight: Record<number, number> = {}
  let toPlace = POINTS_PER_ROW
  for (const talent of rowZero) {
    const take = Math.min(talent.maxRank, toPlace)
    if (take > 0) tight[talent.id] = take
    toPlace -= take
  }
  tight[secondRow.id] = 1
  expect(pointsInTree(arms, tight)).toBe(POINTS_PER_ROW + 1)
  expect(canRemovePoint(arms, rowZero[0], tight), 'five points remain, which is what row 1 needs').toBe(true)

  // And a prerequisite cannot be emptied while the talent it gates is still spent into.
  const gated = arms.talents.find((talent) => talent.requires.length > 0)
  if (gated) {
    const prerequisite = arms.talents.find((talent) => talent.id === gated.requires[0].id)!
    const holding = { ...allSpent, [prerequisite.id]: prerequisite.maxRank, [gated.id]: 1 }
    expect(canRemovePoint(arms, prerequisite, holding), `${prerequisite.name} still holds up ${gated.name}`).toBe(false)
  }
})

test('a hybrid gem earns the socket bonus it satisfies', async () => {
  // The gem dropdown offers hybrids for a socket — an Orange gem is legal in a red socket and, per
  // TBC's rules, satisfies a red socket bonus. calculateStats disagreed: it kept a private copy of
  // this check that compared `gem.color === socket` outright, so every hybrid was offered, accepted,
  // and then silently denied the bonus. Hybrids are 118 of the 212 gems, so this was the common case.
  const red: SocketColor[] = ['Red']

  const orange = sampleGems.find((gem) => gem.color === 'Orange')
  const yellow = sampleGems.find((gem) => gem.color === 'Yellow')
  const pureRed = sampleGems.find((gem) => gem.color === 'Red')
  expect(orange && yellow && pureRed, 'catalogue must carry all three colours to test this').toBeTruthy()

  expect(socketBonusIsActive(red, [pureRed!.id]), 'a red gem in a red socket').toBe(true)
  expect(socketBonusIsActive(red, [orange!.id]), 'an Orange gem counts as red — this was the bug').toBe(true)
  expect(socketBonusIsActive(red, [yellow!.id]), 'a yellow gem does not satisfy a red socket').toBe(false)
  expect(socketBonusIsActive(red, ['']), 'an empty socket earns nothing').toBe(false)
  expect(socketBonusIsActive([], []), 'an item with no sockets has no bonus to earn').toBe(false)

  // Meta is exclusive in both directions, and is the one case the old exact-match check got right.
  const meta = sampleGems.find((gem) => gem.color === 'Meta')
  expect(socketBonusIsActive(['Meta'], [meta!.id])).toBe(true)
  expect(socketBonusIsActive(['Meta'], [pureRed!.id])).toBe(false)
  expect(socketBonusIsActive(red, [meta!.id])).toBe(false)

  // Every socket must be satisfied, not just the first.
  expect(socketBonusIsActive(['Red', 'Yellow'], [orange!.id, yellow!.id])).toBe(true)
  expect(socketBonusIsActive(['Red', 'Yellow'], [orange!.id, pureRed!.id])).toBe(false)
})

test('the app opens on a section picker, and the rail follows the character', async ({ page }) => {
  // The app used to land inside a tab. It now asks which of the four things you came to do, because
  // gearing a character, reading a tier list, reading a loot table and levelling a profession have
  // nothing to do with each other.
  await page.goto('/')
  await expect(page.getByTestId('section-planner')).toBeVisible()
  await expect(page.getByTestId('section-tierlists')).toBeVisible()
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

test('the target-debuff corrections that had real wrong values stay corrected', async () => {
  // Same shape as the buff assertions above, same reason: all six debuffs were flagged
  // "approximate pending final Wowhead audit" and five were wrong rather than approximate. Each is
  // pinned individually against the spell rank its number came from.

  // The three armor debuffs were stored as fractions of the target's armor. TBC has no percentage
  // armor debuff — all three are flat, and a fraction silently scaled them with the target.
  const sunder = getTargetDebuffById('sunder-armor')
  const faerieFire = getTargetDebuffById('faerie-fire')
  const recklessness = getTargetDebuffById('curse-of-recklessness')

  // Spell 25225: "reducing it by 520 per Sunder Armor ... up to 5 times" — 2600 at a full stack.
  expect(sunder?.armorReduction).toBe(2600)
  // Spell 26993: "Decrease the armor of the target by 610".
  expect(faerieFire?.armorReduction).toBe(610)
  // Spell 27226: "reducing armor by 800".
  expect(recklessness?.armorReduction).toBe(800)

  // A value below 1 here means someone has put a fraction back into a flat-armor field, which is
  // exactly how the original numbers (0.2, 0.05, 0.08) read.
  for (const debuff of sampleTargetDebuffs) {
    if (debuff.armorReduction === undefined) continue
    expect(debuff.armorReduction, `${debuff.name} must be flat armor points, not a fraction`).toBeGreaterThan(1)
  }

  // Spell 20337: "the critical strike chance of all attacks made against that target". "All
  // attacks" is literal — this was modelled as physical-only, so casters got nothing from it.
  const crusader = getTargetDebuffById('improved-seal-of-the-crusader')
  expect(crusader?.physicalCritTakenBonus).toBe(0.03)
  expect(crusader?.spellCritTakenBonus, 'Improved SotC is not physical-only').toBe(0.03)

  // Spell 28595 is Frost-only, and was being applied to every spell school. It is now listed rather
  // than applied, so it must contribute no crit at all.
  const wintersChill = getTargetDebuffById('winters-chill')
  expect(wintersChill?.spellCritTakenBonus ?? 0, "Winter's Chill is Frost-only and must not apply to every spell").toBe(0)
  expect(wintersChill?.notModelled).toBeTruthy()

  // Spell 27228: the one value that survived the audit unchanged.
  expect(getTargetDebuffById('curse-of-elements')?.spellDamageTakenMultiplier).toBe(0.1)

  // Every entry now cites the rank it was read from, and nothing is left unverified.
  for (const debuff of sampleTargetDebuffs) {
    expect(debuff.spellId, `${debuff.name} must cite the spell rank its numbers came from`).toBeGreaterThan(0)
    expect(debuff.needsVerification ?? false, `${debuff.name} is sourced and should not be flagged`).toBe(false)
  }
})

test('the armor debuffs subtract flat armor and stack with each other', async () => {
  // The shape change has to reach the math, not just the data file. Under the old percentage model
  // these three removed 33% of whatever the target had; they remove a fixed 4010 regardless.
  const character: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Warrior', spec: 'Fury' }
  const gear = normalizeGearForCharacter(defaultGear, 'Warrior', 'Fury')
  const stats = calculateStats(character, gear)
  const armorDebuffs = ['sunder-armor', 'curse-of-recklessness', 'faerie-fire']

  const withDebuffs = calculateSimulation(character, gear, stats, 'Physical DPS', armorDebuffs)
  const target = defaultSimulationTarget

  const expectedArmor = target.armor - (2600 + 800 + 610)
  const expectedMitigation = Math.round(computeArmorMitigation(expectedArmor, 70) * 100 * 10) / 10
  expect(breakdownValue(withDebuffs, /Armor mitigation/)).toBe(expectedMitigation)

  // And pin it against what the old model produced, so a revert to a fraction fails here rather
  // than quietly changing every physical DPS number.
  const percentageModelMitigation = Math.round(computeArmorMitigation(target.armor * (1 - 0.33), 70) * 100 * 10) / 10
  expect(expectedMitigation).not.toBe(percentageModelMitigation)

  // Three separate debuffs, three separate subtractions: no exclusivity between them. Only Sunder
  // and Expose Armor are exclusive in TBC, and Expose Armor is not in this dataset.
  const sunderOnly = calculateSimulation(character, gear, stats, 'Physical DPS', ['sunder-armor'])
  const sunderMitigation = Math.round(computeArmorMitigation(target.armor - 2600, 70) * 100 * 10) / 10
  expect(breakdownValue(sunderOnly, /Armor mitigation/)).toBe(sunderMitigation)
  expect(breakdownValue(withDebuffs, /Armor mitigation/)!).toBeLessThan(breakdownValue(sunderOnly, /Armor mitigation/)!)
})

test('a debuff that cannot be modelled is separated from the ones that can be', () => {
  // Same treatment the fifteen unmodelled raid buffs get, for the same reason: Winter's Chill is a
  // real raid debuff, and dropping it would read as an oversight rather than a stated limit.
  //
  // This arrived as a UI test that drove the Buffs & Consumables panel. That panel is no longer
  // rendered — it is hidden, not deleted, alongside the simulation tab — so the assertion moves down
  // to the split it was really about, exactly as the buff/consumable test above did when the same
  // thing happened to it. BuffsPanel still reads these two lists and still renders the unmodelled
  // ones without a checkbox; what no longer exists is a page to click.
  expect(unmodelledTargetDebuffs.map((debuff) => debuff.id)).toEqual(['winters-chill'])

  // The reason it cannot be modelled is narrow and worth keeping visible: no spell school is recorded
  // anywhere in the simulation, so a Frost-only debuff can be applied to every spell or to none.
  const wintersChill = unmodelledTargetDebuffs[0]
  expect(wintersChill.notes, "the Frost-only scope is why it is not modelled").toMatch(/Frost/)
  expect(wintersChill.spellCritTakenBonus, 'an unmodelled debuff must not also apply its effect').toBeUndefined()

  // The modelled ones carry flat armor, not a fraction. TBC has no percentage armor debuff, and
  // reading these as percentages is the bug this dataset was rebuilt to fix.
  const sunder = modelledTargetDebuffs.find((debuff) => debuff.id === 'sunder-armor')
  expect(sunder?.armorReduction, 'Sunder Armor is 520 per stack at 5 stacks').toBe(2600)
  for (const debuff of modelledTargetDebuffs) {
    expect(debuff, `${debuff.id} must not carry a percentage armor reduction`).not.toHaveProperty('armorReductionPercent')
  }
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
  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Fury')

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
  await openPlannerView(page, 'Build')
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
  await expect(page.getByRole('combobox', { name: 'Specialization' })).toHaveValue('Fury')

  // Slots persist across a reload, since they live in storage rather than component state. Neither
  // the section choice nor the planner sub-tab does — both are session state — so re-enter both
  // before looking for them.
  await page.reload()
  await page.getByTestId('section-planner').click()
  await openPlannerView(page, 'Build')
  await expect(page.getByTestId('build-slot-list')).toContainText('Fury main')

  await page.getByTestId('build-slot-delete-Fury main').click()
  await expect(page.getByTestId('build-slots-empty')).toBeVisible()
})

test('Draenei get the hit racial matching their class, not both', async ({ page }) => {
  await openApp(page)
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Draenei')

  // Spell Hit is one of the rows the rail now hides for a physical spec, which is correct and is
  // exactly why this test has to open the full readout: the subject here is a Warrior's *spell* hit,
  // a number a Warrior has no normal reason to look at. The toggle is how you see it.
  await page.getByTestId('rail-show-all-stats').click()

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

test('every spec appears on a tier list, and a spec can hold two placements at once', () => {
  // The union across the three lists must be every spec the app knows. A spec missing from all three
  // would render as a silent gap in the view with no explanation, and the ingest asserts the same
  // thing at generation time — this pins it against the committed data.
  const known = tbcClasses.flatMap((entry) => entry.specs.map((spec) => `${entry.className}|${spec}`))
  const placed = new Set(
    specTierLists.flatMap((list) => list.tiers.flatMap((tier) => tier.placements.map((p) => `${p.className}|${p.spec}`))),
  )
  expect([...known].filter((key) => !placed.has(key)), 'every spec should be ranked somewhere').toEqual([])

  // Every placement has to name a spec the app actually has. A Wowhead rename would otherwise write
  // a spec nothing can select into the domain.
  for (const list of specTierLists) {
    for (const tier of list.tiers) {
      for (const placement of tier.placements) {
        const definition = tbcClasses.find((entry) => entry.className === placement.className)
        expect(definition, `${placement.slug} names an unknown class`).toBeTruthy()
        expect(definition?.specs, `${placement.slug} names a spec ${placement.className} does not have`).toContain(placement.spec)
      }
    }
  }

  // The reason placements are keyed by (role, spec) rather than by spec. Feral Druid is a mediocre
  // damage spec and the best tank in the phase; collapsing the two axes would force one of those two
  // true statements to be discarded.
  const feral = getPlacementsForSpec('Druid', 'Feral')
  expect(feral.map((p) => `${p.role} ${p.label}`).sort()).toEqual(['DPS C', 'Tank S'])

  // Discipline Priest is the parser's trap: its badge sits inside a link whose hash reads
  // "holy-priest", because Wowhead publishes one shared Priest healing guide. Reading the hash rather
  // than the badge would file it under Holy and lose the spec entirely.
  expect(getPlacementsForSpec('Priest', 'Discipline').map((p) => `${p.role} ${p.label}`)).toEqual(['Healer B'])
  expect(getPlacementsForSpec('Priest', 'Holy').map((p) => `${p.role} ${p.label}`)).toEqual(['Healer S'])

  // All three lists are Phase 2, which is what the rest of the app targets. The ingest refuses to
  // write a page whose title says otherwise, so this catches data swapped in by other means.
  for (const list of specTierLists) {
    expect(list.phase, `${list.role} list should be Phase 2`).toBe(2)
    expect(list.sourceUrl, `${list.role} list should cite its source page`).toMatch(/^https:\/\/www\.wowhead\.com\/tbc\/guide\//)
  }
})

test('the tier list view shows all three lists and marks the current spec on every list it appears on', async ({ page }) => {
  await openApp(page)

  // Feral Druid is the spec worth driving this with: it is the only one on two lists. Race first —
  // the class list is filtered by race and the default Human cannot be a Druid, which is the app
  // enforcing real TBC legality rather than anything going wrong.
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Night Elf')
  await page.getByLabel('Class').selectOption('Druid')
  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Feral')
  await page.getByRole('button', { name: 'Spec Tier Lists', exact: true }).click()

  await expect(page.getByRole('region', { name: 'DPS tier list' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Healer tier list' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Tank tier list' })).toBeVisible()

  // Marked twice, at two different tiers, which is the whole point of the (role, spec) keying.
  const marked = page.locator('.tier-spec[data-current]')
  await expect(marked).toHaveCount(2)
  await expect(page.getByRole('region', { name: 'DPS tier list' }).locator('.tier-row[data-depth="3"] .tier-spec[data-current]')).toHaveCount(1)
  await expect(page.getByRole('region', { name: 'Tank tier list' }).locator('.tier-row[data-depth="0"] .tier-spec[data-current]')).toHaveCount(1)

  // Named in words, not signalled by the accent alone — the role hues are muted enough that an 11px
  // label set in one would miss AA, and a colour-only mark would fail SC 1.4.1 regardless.
  await expect(marked.first().locator('.tier-spec-you')).toHaveText('Your spec')

})

test('no spec is marked on the tier lists until a character has been chosen', async ({ page }) => {
  // Highlighting the default Fury Warrior for someone who never picked it would answer "where do I
  // stand" with a spec they never named — the same class of invention this project keeps undoing.
  //
  // This is its own test rather than a reload at the end of the previous one, because a reload does
  // not reproduce the condition: the planner autosaves, and App treats a *restored* build as a
  // deliberate choice on purpose, so coming back to a saved character marks it and should. The state
  // being asserted here is genuinely "storage is empty", which is only true at the start of a test.
  await page.goto('/')
  await page.getByTestId('section-tierlists').click()

  await expect(page.getByRole('region', { name: 'DPS tier list' })).toBeVisible()
  await expect(page.locator('.tier-spec[data-current]')).toHaveCount(0)
  await expect(page.locator('.tier-spec-you')).toHaveCount(0)
})

test('tier letters stay out of the item quality palette', async ({ page }) => {
  await openApp(page, 'tierlists')

  // Wowhead draws S in q5 orange, A in q4 purple and B in q3 blue. This app spends quality colour on
  // exactly one thing — "this item is epic" — and borrowing it to mean "this spec is strong" would
  // make the loudest colour on the page ambiguous. Rank reads through ink weight instead, so every
  // tier letter must be a neutral grey: r, g and b equal.
  const letters = page.getByRole('region', { name: 'DPS tier list' }).locator('.tier-letter')
  await expect(letters).toHaveCount(5)

  for (const color of await letters.evaluateAll((nodes) => nodes.map((n) => getComputedStyle(n).color))) {
    const [r, g, b] = color.match(/\d+/g)!.slice(0, 3).map(Number)
    expect(r === g && g === b, `tier letter drawn in ${color}, which carries a hue`).toBe(true)
  }

  // And the ramp has to actually distinguish all five tiers. Five tiers against four text tokens is
  // why the rule beside each row steps down half a beat after the ink does; without that, B and C
  // rendered identically, which a measurement of the running page is what caught.
  const steps = await page
    .getByRole('region', { name: 'DPS tier list' })
    .locator('.tier-row')
    .evaluateAll((rows) =>
      rows.map((row) => {
        const ink = getComputedStyle(row.querySelector('.tier-letter')!).color
        const rule = getComputedStyle(row.querySelector('.tier-row-label')!).borderLeftColor
        return `${ink}|${rule}`
      }),
    )
  expect(new Set(steps).size, 'each tier should be visually distinct from the others').toBe(5)
})

test('every catalogued item with a real item id resolves to a vendored icon file', () => {
  // Two halves, and both matter. The mapping is generated from MIT-licensed upstream data, but the
  // artwork is vendored by a separate script — so a name that maps to no file on disk is the exact
  // failure mode of vendoring, and it would render as an empty frame rather than an error.
  const missingName: string[] = []
  const missingFile: string[] = []
  const seen = new Set<string>()

  for (const item of allItems) {
    if (!item.wowItemId) continue
    const icon = getIconName(item.wowItemId)
    if (!icon) {
      missingName.push(`${item.id} (${item.wowItemId})`)
      continue
    }
    if (seen.has(icon)) continue
    seen.add(icon)
    if (!existsSync(resolve(process.cwd(), 'public/icons', `${icon}.jpg`))) missingFile.push(icon)
  }

  expect(missingName, 'every catalogued item with a wowItemId should have an icon name').toEqual([])
  expect(missingFile, 'every icon name in use should have a vendored file behind it').toEqual([])

  // Items share artwork heavily, which is the whole reason vendoring is ~2 MB rather than tens of
  // megabytes. If this ever inverts, the vendoring decision deserves revisiting.
  expect(seen.size).toBeLessThan(allItems.length / 2)
  expect(distinctIconCount).toBe(1238)
  expect(mappedIconCount).toBe(4741)
})

test('the paperdoll renders real item icons rather than the placeholder glyphs', async ({ page }) => {
  await openApp(page)

  // The frames were always sized to the icon that would replace the two-letter glyph, so this is the
  // assertion that the swap actually happened rather than the glyph still being there.
  const icons = page.locator('.gear-glyph img.item-icon')
  expect(await icons.count(), 'every visible slot should carry an icon').toBeGreaterThan(10)

  // One fallback is expected and correct: the default Fury Warrior wields a two-hander, so the off
  // hand holds EMPTY_OFF_HAND, which has no item id and therefore no icon. Asserting zero would be
  // asserting that an empty slot draws artwork.
  const fallbacks = page.locator('.gear-glyph .item-icon-fallback')
  const emptySlots = await page
    .locator('.gear-cell')
    .filter({ hasText: 'Empty' })
    .count()
  expect(await fallbacks.count(), 'only genuinely empty slots may fall back to a glyph').toBe(emptySlots)

  // Present in the DOM is not the same as loaded. A wrong path 404s and still renders an <img>.
  const broken = await icons.evaluateAll((nodes) =>
    nodes.filter((n) => !(n as HTMLImageElement).complete || (n as HTMLImageElement).naturalWidth === 0).length,
  )
  expect(broken, 'no icon should fail to load').toBe(0)

  // Wowhead's "large" is 56x56, and the frames are 40-44px. Downscaling is deliberate; if this ever
  // reports 36 the fetch script has quietly switched to "medium" and the paperdoll is upscaling.
  const naturalWidths = await icons.evaluateAll((nodes) => [...new Set(nodes.map((n) => (n as HTMLImageElement).naturalWidth))])
  expect(naturalWidths).toEqual([56])

  // The slot an icon lands in has to match the item in it — a mapping keyed on the wrong id would
  // still load 19 perfectly valid images.
  const headSrc = await page
    .getByRole('button', { name: 'Head slot', exact: true })
    .locator('img.item-icon')
    .getAttribute('src')
  const headItem = getItemById(defaultGear.Head.item.id)
  expect(headSrc).toContain(getIconName(headItem?.wowItemId))
})

test('a raid loot row with no catalogued item still renders a frame', async ({ page }) => {
  await openApp(page, 'raids')
  await page.getByTestId('raid-pick-karazhan').click()

  // 124 of the 272 raid loot entries across all five raids name an item the catalogue does not carry,
  // which predates icons entirely — those rows have always shown "??". Real icons make the gap
  // visible rather than causing it, and the fallback is what keeps an unresolved row from collapsing
  // to an empty box. Not pinned to an exact count: supplementing the catalogue should lower it, and
  // this test should track the fallback working, not the size of the backlog.
  const rows = page.locator('.raid-loot-row')
  expect(await rows.count()).toBeGreaterThan(0)

  const icons = await page.locator('.raid-loot-frame img.item-icon').count()
  const fallbacks = await page.locator('.raid-loot-frame .item-icon-fallback').count()
  expect(icons + fallbacks, 'every loot row gets exactly one of the two').toBe(await rows.count())
  expect(icons, 'the catalogued ones should show real art').toBeGreaterThan(0)
})

test('no spec can equip, default to, or be upgraded into an unobtainable item', () => {
  // The bug this pins: getDefaultItemForSlot picks by highest item level, and Kael'thas's encounter
  // weapons sit at ilvl 175 — the only items at that level in a 4,505-item catalogue, eleven above
  // Sunwell, which is the highest obtainable gear in all of TBC. Before they were excluded, all 27
  // specs opened holding one, so every stat total and every simulation in the app started from a
  // weapon that cannot be held.
  for (const entry of unobtainableItems) {
    const item = allItems.find((candidate) => candidate.wowItemId === entry.wowItemId)
    // Still present as data on purpose — raid loot and provenance may name these. Only equipping is
    // barred, which is why this asserts the item exists AND that no character is offered it.
    expect(item, `${entry.name} should still be in the catalogue as data`).toBeTruthy()
    if (item) expect(isObtainable(item), `${entry.name}: ${entry.why}`).toBe(false)
  }

  for (const definition of tbcClasses) {
    for (const spec of definition.specs) {
      for (const slot of gearSlots) {
        for (const option of getItemsForSlotAndCharacter(slot, definition.className, spec)) {
          expect(
            option.wowItemId === undefined || !unobtainableWowItemIds.has(option.wowItemId),
            `${definition.className} ${spec} is offered "${option.name}" in ${slot}, which nobody can acquire`,
          ).toBe(true)
        }
      }
    }
  }

  // And the starting set, which is built before any character exists and so never passes through
  // isItemAllowedForCharacter — the exact hole that put encounter weapons in every default loadout.
  for (const [slot, equipped] of Object.entries(defaultGear)) {
    expect(isObtainable(equipped.item), `default ${slot} is "${equipped.item.name}"`).toBe(true)
  }
})

test('the upgrade finder still discloses when a gain rests on estimated stats', () => {
  // Guards the assertion loosened in the upgrade-finder UI test above. That test stopped being able
  // to require a flagged row once Fury Warrior's defaults became fully sourced; this checks the
  // classification is still reachable rather than quietly dead, across every spec at once.
  let skewed = 0
  const specsWithNotes: string[] = []

  for (const definition of tbcClasses) {
    for (const spec of definition.specs) {
      const character: CharacterProfile = { faction: 'Alliance', race: 'Human', className: definition.className, spec }
      const gear = normalizeGearForCharacter(defaultGear, definition.className, spec)
      const report = findUpgrades(character, gear, getRoleForSpec(definition.className, spec), [], [], [], defaultSimulationTarget)

      const flagged = report.candidates.filter((candidate) => candidate.dataQuality !== 'sourced')
      skewed += flagged.length
      if (flagged.length > 0) specsWithNotes.push(`${definition.className} ${spec}`)
    }
  }

  expect(skewed, 'the estimated-data disclosure should still fire somewhere').toBeGreaterThan(0)
  // Deliberately a floor rather than an exact count: verifying more of the catalogue lowers this,
  // and the test should track the mechanism being alive rather than the size of the backlog.
  expect(specsWithNotes.length).toBeGreaterThan(10)
})

test('every raid loot entry that names a catalogued item is linked to it', () => {
  // The raid data was written when the catalogue held 230 hand-written items. It now holds 4,560
  // ingested ones, so 85 entries named an item that was present while still carrying no itemId and a
  // note reading "not yet in the item catalog" — false, and visible as a "??" frame where an icon
  // should be. tools/ingest/link-raid-loot.mjs closed that gap; this stops it reopening as the
  // catalogue keeps growing.
  const catalogueIdsByName = new Map<string, string[]>()
  for (const item of allItems) {
    const key = item.name.toLowerCase()
    catalogueIdsByName.set(key, [...(catalogueIdsByName.get(key) ?? []), item.id])
  }

  const unlinked: string[] = []
  const staleNotes: string[] = []

  for (const raid of sampleRaids) {
    const bosses = sampleRaidBosses.filter((boss) => boss.raidId === raid.id)
    for (const entry of [...bosses.flatMap((boss) => boss.loot), ...(raid.notableTrashLoot ?? [])]) {
      const matches = catalogueIdsByName.get(entry.name.toLowerCase())

      // An entry whose name resolves to exactly one catalogue item must say so. More than one is
      // left alone on purpose — choosing between them would be a guess.
      if (!entry.itemId && matches?.length === 1) unlinked.push(`${raid.name}: "${entry.name}" -> ${matches[0]}`)

      // And nothing that IS linked may still claim to be missing from the catalogue.
      if (entry.itemId && /not (?:yet )?in the item catalog/i.test(entry.notes ?? '')) {
        staleNotes.push(`${raid.name}: "${entry.name}"`)
      }
    }
  }

  expect(unlinked, 'these loot entries name a catalogued item but carry no itemId').toEqual([])
  expect(staleNotes, 'these are linked but still say they are not in the catalogue').toEqual([])

  // The entries that remain unresolved should be the ones that genuinely are not gear — mounts,
  // enchanting formulas and tier tokens. A floor rather than an exact count, because supplementing
  // the catalogue should lower it.
  const stillUnresolved = sampleRaids.flatMap((raid) => {
    const bosses = sampleRaidBosses.filter((boss) => boss.raidId === raid.id)
    return [...bosses.flatMap((boss) => boss.loot), ...(raid.notableTrashLoot ?? [])].filter((entry) => !entry.itemId)
  })
  expect(stillUnresolved.length).toBeLessThan(60)
  for (const entry of stillUnresolved) {
    expect(entry.notes, `"${entry.name}" is unresolved and should say why`).toBeTruthy()
  }
})

test('all nine classes have three ingested talent trees, and every icon is vendored', () => {
  // Warrior was built end to end first to prove the parser; the other eight then came from the same
  // payload with no parser change, only tree ids. This asserts the set is complete and well-formed
  // rather than trusting that a nine-way re-run did what it looked like it did.
  expect([...classesWithTalents].sort()).toEqual([...tbcClasses.map((entry) => entry.className)].sort())

  let total = 0
  for (const definition of tbcClasses) {
    const data = getTalentData(definition.className)
    expect(data, `${definition.className} should have talent data`).toBeTruthy()
    if (!data) continue

    // Three trees, and their specs must be the app's spec names — not the payload's internal ones.
    // Six of the 27 trees are labelled differently at source (Paladin "Combat" is Retribution,
    // Warlock "Curses" is Affliction, "Summoning" is Demonology, Shaman "ElementalCombat",
    // Druid "FeralCombat", Hunter "BeastMastery"), so this is the check that the mapping held.
    expect(data.trees).toHaveLength(3)
    expect([...data.trees.map((tree) => tree.spec)].sort()).toEqual([...definition.specs].sort())

    for (const tree of data.trees) {
      expect(tree.talents.length, `${definition.className} ${tree.spec} should have talents`).toBeGreaterThan(15)
      for (const talent of tree.talents) {
        expect(talent.name, `a ${definition.className} talent has no name`).toBeTruthy()
        expect(talent.rankDescriptions.length, `${talent.name} should describe each rank`).toBe(talent.maxRank)
        // The whole point of the icon pass: a slug with no file behind it renders an empty box.
        expect(
          existsSync(resolve(process.cwd(), 'public/icons', `${talent.icon}.jpg`)),
          `${definition.className} "${talent.name}" wants icon ${talent.icon}, which is not vendored`,
        ).toBe(true)
        total += 1
      }
    }
  }

  expect(total, 'talents across all nine classes').toBe(579)

  // Talents share a lot of art with items, which is why adding 426 talent icons only cost 171 files.
  expect(talentIconNames.length).toBeLessThan(total)
})

test('the talent tree renders real icons for a class other than the one built first', async ({ page }) => {
  await openApp(page)
  await openPlannerView(page, 'Talents')

  // Night Elf Druid: a class that did not exist in this panel until the nine-way ingest, and whose
  // trees are the ones the payload labels "FeralCombat".
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Night Elf')
  await page.getByLabel('Class').selectOption('Druid')

  await expect(page.getByRole('region', { name: 'Balance talents' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Feral talents' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Restoration talents' })).toBeVisible()
  await expect(page.getByTestId('talents-unavailable')).toHaveCount(0)

  const icons = page.locator('.talent-icon')
  expect(await icons.count(), 'every talent cell should carry an icon').toBeGreaterThan(50)

  // Lazy by design — three trees of ~62 talents run well past the fold. That means "not loaded yet"
  // is the correct state for most of them, so asking whether they are all loaded races the viewport
  // rather than testing anything. Pin the laziness, then force the whole set to load and require
  // every URL to resolve; that is the invariant worth having, and it covers icons no scroll reaches.
  expect(await icons.first().getAttribute('loading')).toBe('lazy')

  const broken = await icons.evaluateAll(async (nodes) => {
    await Promise.all(
      nodes.map((node) => {
        const image = node as HTMLImageElement
        image.loading = 'eager'
        const source = image.src
        image.src = ''
        image.src = source
        return image.decode().catch(() => undefined)
      }),
    )
    return nodes
      .filter((n) => !(n as HTMLImageElement).complete || (n as HTMLImageElement).naturalWidth === 0)
      .map((n) => (n as HTMLImageElement).getAttribute('src'))
  })
  expect(broken, 'no talent icon should fail to load').toEqual([])

  // Decorative: the button already names the talent and its rank, so an alt here would make a screen
  // reader say the name twice.
  expect(await icons.first().getAttribute('alt')).toBe('')
})

test('the planner shows one panel at a time instead of a single long column', async ({ page }) => {
  await openApp(page)

  // Stacked, these four came to about 15 screen-heights, and two of them were 85% of it: the ranked
  // list at 59% and the talent trees at 26%. Reaching Build meant scrolling past 19 gear slots and
  // three talent trees.
  const nav = page.getByRole('navigation', { name: 'Planner sections' })
  await expect(nav).toBeVisible()
  await expect(nav.getByRole('button')).toHaveText(['Gear', 'Talents', 'Buffs', 'Ranked Gear', 'Build'])

  // Gear is where you land, so the many gear-only tests need no navigation at all.
  await expect(page.getByRole('region', { name: 'Gear', exact: true })).toBeVisible()
  await expect(page.getByTestId('bis-panel')).toHaveCount(0)
  await expect(page.getByRole('region', { name: 'Talents', exact: true })).toHaveCount(0)

  // Each view renders its own panel and *only* its own — the point is the other three are not in the
  // document, not merely scrolled past.
  const views = [
    { view: 'Talents' as const, present: page.getByRole('region', { name: 'Talents', exact: true }), absent: page.getByRole('region', { name: 'Gear', exact: true }) },
    { view: 'Buffs' as const, present: page.getByTestId('buffs-panel'), absent: page.getByRole('region', { name: 'Talents', exact: true }) },
    { view: 'Ranked Gear' as const, present: page.getByTestId('bis-panel'), absent: page.getByTestId('buffs-panel') },
    // The Build panel's region, not its export textarea — that lives inside a collapsed <details>,
    // so it is legitimately hidden until you open it. `exact` because "Saved builds" is a region
    // too, and Playwright's name option matches substrings by default.
    { view: 'Build' as const, present: page.getByRole('region', { name: 'Build', exact: true }), absent: page.getByTestId('bis-panel') },
    { view: 'Gear' as const, present: page.getByRole('region', { name: 'Gear', exact: true }), absent: page.getByRole('region', { name: 'Build', exact: true }) },
  ]
  for (const { view, present, absent } of views) {
    await openPlannerView(page, view)
    await expect(present, `${view} should render its own panel`).toBeVisible()
    await expect(absent, `${view} should not render the previous panel`).toHaveCount(0)
  }

  // The rail is what makes splitting these affordable: the stat totals stay on screen throughout, so
  // moving between the four does not cost you the numbers you were reading.
  for (const view of ['Gear', 'Talents', 'Buffs', 'Ranked Gear', 'Build'] as const) {
    await openPlannerView(page, view)
    await expect(page.getByRole('region', { name: 'Stats' }), `the stat rail should survive ${view}`).toBeVisible()
  }
})

test('the stat rail hides rows the spec cannot use, and the toggle brings them back', async ({ page }) => {
  await openApp(page)

  // A Fury Warrior was shown all 26 rows, of which roughly half carried nothing: the entire Spell
  // group, Feral attack power, and six defensive rows reading 0. Healing Power 411 on a Warrior is
  // the worst of them — it reads as a bug rather than as an irrelevant row.
  const rows = page.locator('.rail-stat')
  const before = await rows.count()
  expect(before).toBeLessThan(15)

  await expect(page.getByTestId('stat-healing-power')).toHaveCount(0)
  await expect(page.getByTestId('stat-feral-ap')).toHaveCount(0)
  await expect(page.getByTestId('stat-ranged-ap')).toHaveCount(0)
  await expect(page.getByTestId('stat-spell-power')).toHaveCount(0)
  // Attributes and Armor are never hidden — the in-game character sheet shows them to every class.
  await expect(page.getByTestId('stat-strength')).toBeVisible()
  await expect(page.getByTestId('stat-armor')).toBeVisible()
  // And what a Fury Warrior does read stays.
  await expect(page.getByTestId('stat-attack-power')).toBeVisible()
  await expect(page.getByTestId('stat-expertise')).toBeVisible()

  // Nothing is deleted, only defaulted away. This is the escape hatch for any spec where the
  // relevance call is arguable — Enhancement Shaman does get something from spell power.
  const toggle = page.getByTestId('rail-show-all-stats')
  await expect(toggle).toContainText(`Show ${26 - before} more`)
  await toggle.click()
  await expect(rows).toHaveCount(26)
  await expect(page.getByTestId('stat-healing-power')).toBeVisible()

  await toggle.click()
  await expect(rows).toHaveCount(before)
})

test('stat relevance follows the role, with the carve-outs it claims', () => {
  // Pinned against the domain rather than the DOM so all 27 specs are covered rather than the few a
  // browser test can afford to click through.
  const rowsFor = (className: TbcClass, spec: TbcSpec) =>
    relevantStats(
      statLabels.map(([key]) => key),
      getRoleForSpec(className, spec),
      className,
      spec,
    )

  // Every spec keeps the five attributes and armor, and every spec loses something.
  for (const definition of tbcClasses) {
    for (const spec of definition.specs) {
      const rows = rowsFor(definition.className, spec)
      for (const always of ['strength', 'agility', 'stamina', 'intellect', 'spirit', 'armor'] as const) {
        expect(rows, `${definition.className} ${spec} should always show ${always}`).toContain(always)
      }
      expect(rows.length, `${definition.className} ${spec} should hide something`).toBeLessThan(statLabels.length)
    }
  }

  // Physical DPS drops the spell group; casters and healers drop the physical one.
  expect(rowsFor('Warrior', 'Fury')).not.toContain('spellPower')
  expect(rowsFor('Mage', 'Arcane')).not.toContain('attackPower')
  expect(rowsFor('Priest', 'Holy')).not.toContain('attackPower')

  // Healing power is a healer's row. On a Shadow Priest it is the same noise it is on a Warrior.
  expect(rowsFor('Priest', 'Holy')).toContain('healingPower')
  expect(rowsFor('Priest', 'Shadow')).not.toContain('healingPower')
  expect(rowsFor('Warrior', 'Fury')).not.toContain('healingPower')

  // Feral AP only exists in Druid forms; ranged AP only drives damage for a Hunter.
  expect(rowsFor('Druid', 'Feral')).toContain('feralAttackPower')
  expect(rowsFor('Druid', 'Balance')).not.toContain('feralAttackPower')
  expect(rowsFor('Hunter', 'Survival')).toContain('rangedAttackPower')
  expect(rowsFor('Rogue', 'Combat')).not.toContain('rangedAttackPower')

  // A tank is the one role that both swings and is hit, so it is the only one keeping two groups.
  expect(rowsFor('Warrior', 'Protection')).toContain('defenseRating')
  expect(rowsFor('Warrior', 'Protection')).toContain('attackPower')
  expect(rowsFor('Warrior', 'Fury')).not.toContain('defenseRating')
  expect(rowsFor('Paladin', 'Protection')).toContain('blockValue')
})

test('rage income follows the sourced formula, including the parts that are easy to get wrong', () => {
  // Constants read off wowsims/tbc sim/core/rage.go at the pinned commit, not from memory.
  expect(RAGE_CONVERSION_FACTOR).toBe(274.7)
  expect(RAGE_PER_POINT_OF_DAMAGE).toBeCloseTo(3.75 / 274.7, 10)
  expect(MAIN_HAND_HIT_FACTOR).toBe(3.5 / 2)
  expect(OFF_HAND_HIT_FACTOR).toBe(1.75 / 2)

  const base = {
    damagePerLandedSwing: 400,
    swingsPerSecond: 1 / 2.6,
    baseSwingSpeed: 2.6,
    isOffHand: false,
    glanceMultiplier: 0.75,
  }
  const allHits = { miss: 0, dodge: 0, parry: 0, glance: 0, block: 0, crit: 0, hit: 1 }

  // A clean hit: damage*3.75/274.7 + 1.75*2.6.
  expect(rageFromOneSwing({ ...base, outcomes: allHits })).toBeCloseTo(400 * (3.75 / 274.7) + 1.75 * 2.6, 6)

  // A miss generates nothing whatsoever — not even the swing-speed term.
  expect(rageFromOneSwing({ ...base, outcomes: { ...allHits, hit: 0, miss: 1 } })).toBe(0)

  // A dodge still pays out, on the damage the swing WOULD have done. This is the detail a
  // from-memory implementation drops, and it is worth real rage over a fight.
  const dodged = rageFromOneSwing({ ...base, outcomes: { ...allHits, hit: 0, dodge: 1 } })
  expect(dodged).toBeCloseTo(rageFromOneSwing({ ...base, outcomes: allHits }), 6)

  // A crit doubles the hit-factor term but is otherwise the 2x damage it already is.
  const crit = rageFromOneSwing({ ...base, outcomes: { ...allHits, hit: 0, crit: 1 } })
  expect(crit).toBeCloseTo(400 * 2 * (3.75 / 274.7) + 1.75 * 2.6 * 2, 6)

  // The off-hand factor is half the main hand's, and nothing else differs.
  const offHand = rageFromOneSwing({ ...base, isOffHand: true, outcomes: allHits })
  expect(offHand).toBeCloseTo(400 * (3.75 / 274.7) + 0.875 * 2.6, 6)

  // Haste is not part of the swing-speed term: it raises income by swinging more often, and the
  // per-swing value uses the weapon's BASE speed.
  const perSwing = rageFromOneSwing({ ...base, outcomes: allHits })
  expect(ragePerSecondFromWeapon({ ...base, outcomes: allHits })).toBeCloseTo(perSwing / 2.6, 6)
})

test('a swing-replacing rage dump pays for the rage it suppresses, not just its own cost', () => {
  // Heroic Strike replaces the main-hand swing, and a main-hand special generates no rage. So each
  // use costs its rage AND the rage that swing would have made. Ignoring the second term is the
  // easiest way to overstate a rage dump, so this pins the solved form.
  const surplus = 10
  const cost = 15
  const suppressed = 5

  const uses = rageDumpUsesPerSecond({
    surplusRagePerSecond: surplus,
    cost,
    ragePerSuppressedSwing: suppressed,
    mainHandSwingsPerSecond: 10,
  })
  expect(uses).toBeCloseTo(surplus / (cost + suppressed), 10)
  // Strictly fewer uses than the naive cost-only answer, which is the whole point.
  expect(uses).toBeLessThan(surplus / cost)

  // It is an on-next-swing ability, so it can never be used more often than the weapon swings.
  const swingCapped = rageDumpUsesPerSecond({
    surplusRagePerSecond: 1000,
    cost,
    ragePerSuppressedSwing: suppressed,
    mainHandSwingsPerSecond: 0.4,
  })
  expect(swingCapped).toBe(0.4)

  // No surplus, no dump — and no negative uses.
  expect(rageDumpUsesPerSecond({ surplusRagePerSecond: 0, cost, ragePerSuppressedSwing: suppressed, mainHandSwingsPerSecond: 1 })).toBe(0)
  expect(rageDumpUsesPerSecond({ surplusRagePerSecond: -5, cost, ragePerSuppressedSwing: suppressed, mainHandSwingsPerSecond: 1 })).toBe(0)
})

test('Heroic Strike is in the rotation, and says in numbers why it still contributes nothing', () => {
  // The ability data exists now, sourced from wowsims heroic_strike_cleave.go: 15 rage, main-hand
  // weapon damage +176 flat, unnormalized, off the global cooldown, replacing the swing.
  const heroicStrike = getRotationAbilities('Warrior', 'Fury').find((ability) => ability.name === 'Heroic Strike')
  expect(heroicStrike, 'Heroic Strike should be in the Fury rotation').toBeTruthy()
  expect(heroicStrike?.resource).toEqual({
    type: 'Rage',
    cost: 15,
    note: 'reduced by 1 per point of Improved Heroic Strike and of Focused Rage',
  })
  expect(heroicStrike?.offGlobalCooldown).toBe(true)
  expect(heroicStrike?.replacesMainHandSwing).toBe(true)
  expect(heroicStrike?.scaling.flatWeaponDamageBonus).toBe(176)
  // Unnormalized, unlike Whirlwind — a slow weapon keeps its advantage on Heroic Strike.
  expect(heroicStrike?.scaling.normalizedWeaponDamage).toBe(false)

  // It must stay LAST in the priority: it is a dump for surplus, so anything ahead of it claims
  // rage first. If it ever sorts ahead of Bloodthirst the whole budget argument inverts.
  const names = getRotationAbilities('Warrior', 'Fury').map((ability) => ability.name)
  expect(names[0]).toBe('Bloodthirst')
  expect(names[names.length - 1]).toBe('Heroic Strike')

  /*
   * And the honest part. This used to read "with only auto-attack rage modelled"; that is no longer
   * why the dump is unfunded. Swings, Bloodrage, Anger Management, Unbridled Wrath, Endless Rage and
   * Flurry-driven haste are all counted now. What is left out is rage from damage taken, and that is
   * a *declared zero* — an encounter setting — rather than a missing model.
   *
   * The summary has to say which, because "unmodelled" and "you left the input at 0" call for
   * completely different responses from a reader.
   */
  const character: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Warrior', spec: 'Fury' }
  const gear = normalizeGearForCharacter(defaultGear, 'Warrior', 'Fury')
  const stats = calculateStats(character, gear)
  const result = calculateSimulation(character, gear, stats, 'Physical DPS')

  expect(result.breakdown.some((row) => row.label === 'Rage per second' && row.value > 0), 'rage income should be shown').toBe(true)
  expect(result.summary).toContain('Heroic Strike')
  expect(result.summary, 'the actual income figure belongs in the message').toMatch(/rage income is [\d.]+\/sec/)
  expect(result.summary, 'the sources that ARE counted should be named').toMatch(/Bloodrage/)
  expect(result.summary, 'and the one that is not, with why').toMatch(/damage taken/)
  expect(result.summary, 'naming it as an encounter default rather than a gap').toMatch(/defaults to 0/)

  // The cooldown priority must NOT be throttled by this partial income — doing so would report a
  // DPS loss as an accuracy gain. Bloodthirst and Whirlwind both still land.
  const specialLabels = result.breakdown.map((row) => row.label)
  expect(specialLabels).toContain('Bloodthirst DPS')
  expect(specialLabels).toContain('Whirlwind DPS')
})

test('a two-handed weapon leaves the off hand empty, for every spec', () => {
  // defaultGear fills each slot independently by item level, which paired a two-hander with a
  // one-hander in 18 of the 27 specs: a Fury Warrior holding a two-handed sword AND a one-handed
  // mace, every caster holding a staff AND a sword. Not cosmetic — the off-hand's stats were counted
  // and isDualWield added a whole phantom off-hand's white damage on top.
  const illegal: string[] = []

  for (const definition of tbcClasses) {
    for (const spec of definition.specs) {
      const gear = normalizeGearForCharacter(defaultGear, definition.className, spec)
      const mainHand = gear['Main Hand'].item
      const offHand = gear['Off Hand'].item

      if (mainHand.handType === 'Two Hand' && !isEmptySlotItem(offHand)) {
        illegal.push(`${definition.className} ${spec}: ${mainHand.name} (2H) with ${offHand.name}`)
      }

      // And the reverse, which is what the first version of this fix broke: an empty off hand is
      // legal ONLY beside a two-hander. The placeholder passes isItemAllowedForCharacter -- it has
      // no restrictions to fail -- so without a refill a Protection Warrior lost its shield slot
      // permanently, and with it every block term in Effective Health.
      if (mainHand.handType !== 'Two Hand' && isEmptySlotItem(offHand)) {
        illegal.push(`${definition.className} ${spec}: one-handed ${mainHand.name} but the off hand was left empty`)
      }
    }
  }

  expect(illegal).toEqual([])

  // The placeholder has to be inert wherever it is read, or it trades one wrong number for another.
  expect(EMPTY_OFF_HAND.stats).toEqual({})
  expect(EMPTY_OFF_HAND.weaponType).toBeUndefined()
  expect(EMPTY_OFF_HAND.armorType).toBeUndefined()
  expect(EMPTY_OFF_HAND.itemLevel).toBeUndefined()

  // Equipping a two-hander by hand must clear the off hand too, not only a spec switch.
  const dualWielded = normalizeGearForCharacter(defaultGear, 'Shaman', 'Enhancement')
  expect(isEmptySlotItem(dualWielded['Off Hand'].item), 'Enhancement dual-wields, so this starts filled').toBe(false)

  const twoHander = allItems.find((item) => item.handType === 'Two Hand' && item.slot === 'Main Hand')
  expect(twoHander).toBeTruthy()
  const afterSwap = applyWeaponSlotRules({ ...dualWielded, 'Main Hand': { item: twoHander!, gemIds: [] } })
  expect(isEmptySlotItem(afterSwap['Off Hand'].item), 'equipping a two-hander should empty the off hand').toBe(true)

  // Idempotent, since it runs on every gear change.
  expect(applyWeaponSlotRules(afterSwap)).toEqual(afterSwap)
})

test('the empty off hand contributes no stats and no phantom off-hand damage', () => {
  // The bug cost real numbers: +52 attack power to melee and a whole extra weapon's white damage.
  const character: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Warrior', spec: 'Fury' }
  const gear = normalizeGearForCharacter(defaultGear, 'Warrior', 'Fury')
  expect(gear['Main Hand'].item.handType).toBe('Two Hand')
  expect(isEmptySlotItem(gear['Off Hand'].item)).toBe(true)

  // Swapping the placeholder for a real one-hander is exactly the state the app used to open in;
  // the stat totals must differ, which is what proves the placeholder is contributing nothing.
  const oneHander = allItems.find((item) => item.handType === 'One Hand' && (item.stats.attackPower ?? 0) > 0)
  expect(oneHander).toBeTruthy()
  const withPhantom = { ...gear, 'Off Hand': { item: oneHander!, gemIds: [] } }

  const clean = calculateStats(character, gear)
  const inflated = calculateStats(character, withPhantom)
  expect(inflated.attackPower).toBeGreaterThan(clean.attackPower)

  // And the simulator must not treat the placeholder as a dual-wielded weapon.
  const result = calculateSimulation(character, gear, clean, 'Physical DPS')
  const inflatedResult = calculateSimulation(character, withPhantom, inflated, 'Physical DPS')
  expect(inflatedResult.scoreExact).toBeGreaterThan(result.scoreExact)
})

test('melee haste raises white damage and rage income, in proportion', () => {
  // Haste rating used to reach no output whatsoever: white damage is weaponDice/speed plus AP/14 and
  // neither formula read it, so the rail displayed a stat that did nothing and the stat-weight engine
  // priced it at exactly zero. No catalogued Phase 2 item carries melee haste -- only 78 of 4,560
  // items do, none of them raid gear -- so this has to be tested by injecting it rather than by
  // equipping something.
  const character: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Warrior', spec: 'Fury' }
  const gear = normalizeGearForCharacter(defaultGear, 'Warrior', 'Fury')

  const base = calculateStats(character, gear)
  expect(base.hasteRating, 'Phase 2 gear carries no melee haste, which is faithful to TBC').toBe(0)

  // 15.8 rating per 1%, so 158 rating is exactly +10% attack speed.
  const hasted = { ...base, hasteRating: 158 }
  const expected = 1 + 158 / RATING_PER_PERCENT.meleeHaste / 100
  expect(expected).toBeCloseTo(1.1, 6)

  const without = calculateSimulation(character, gear, base, 'Physical DPS')
  const withHaste = calculateSimulation(character, gear, hasted, 'Physical DPS')
  expect(withHaste.scoreExact).toBeGreaterThan(without.scoreExact)

  // Haste does not make a swing hit harder, it makes swings more frequent — so white damage scales
  // by exactly (1 + haste). The specials do not: they sit on cooldowns and the GCD, and melee haste
  // reduces neither. That is why the totals move by less than 10% even though white damage moves by
  // exactly 10%.
  const whiteOnly = (result: typeof without) => {
    const ap = result.breakdown.find((row) => row.label === 'Attack power')?.value ?? 0
    const weapon = result.breakdown.find((row) => row.label === 'Weapon damage')?.value ?? 0
    return ap + weapon
  }
  // The breakdown rows are the unscaled inputs, so they should NOT move; the score should.
  expect(whiteOnly(withHaste)).toBeCloseTo(whiteOnly(without), 6)
  expect(withHaste.scoreExact / without.scoreExact).toBeGreaterThan(1)
  expect(withHaste.scoreExact / without.scoreExact).toBeLessThan(expected)

  // Rage income scales with swing frequency too, which is the whole reason rageModel keeps
  // swingsPerSecond and baseSwingSpeed as separate inputs.
  const rageOf = (result: typeof without) => result.breakdown.find((row) => row.label === 'Rage per second')?.value ?? 0
  expect(rageOf(withHaste)).toBeGreaterThan(rageOf(without))

  // And it is surfaced rather than silently folded in.
  expect(withHaste.breakdown.some((row) => row.label === 'Attack speed increase' && row.value === 10)).toBe(true)
  expect(without.breakdown.some((row) => row.label === 'Attack speed increase'), 'no permanent 0 row').toBe(false)
})

test('trinket procs and on-use effects are ingested, and reach the stat totals', () => {
  // The ingested catalogue carried an effect on NONE of its 4,505 items; only 14 hand-curated
  // entries had one. Since not one TBC trinket is a pure stat stick, that priced the whole item
  // class near zero everywhere calculateStats folds an effect in at its uptime -- including the
  // always-visible stat rail, not just the hidden simulator.
  const withEffect = allItems.filter((item) => item.effect)
  expect(withEffect.length).toBeGreaterThan(40)

  const trinkets = allItems.filter((item) => String(item.slot).startsWith('Trinket'))
  expect(trinkets.filter((item) => item.effect).length, 'most catalogued trinkets should carry one').toBeGreaterThan(30)

  // Every ingested effect must be usable by effectUptime: a real duration and a real rate.
  for (const item of withEffect) {
    const effect = item.effect!
    if (effect.notModelled) continue
    expect(['proc', 'onUse']).toContain(effect.kind)
    expect(effect.durationSeconds, `${item.name} has no duration`).toBeGreaterThan(0)
    expect(effect.cooldownSeconds, `${item.name} has no cooldown`).toBeGreaterThan(0)
    expect(Object.keys(effect.statBonus).length, `${item.name} grants nothing`).toBeGreaterThan(0)
  }

  // Read off wowsims melee_trinkets.go rather than recalled: +278 AP for 20s on a 2 minute cooldown.
  const brooch = getItemByWowItemId(29383)
  expect(brooch?.name).toBe('Bloodlust Brooch')
  expect(brooch?.effect).toEqual({
    kind: 'onUse',
    statBonus: { attackPower: 278, rangedAttackPower: 278 },
    durationSeconds: 20,
    cooldownSeconds: 120,
  })

  // And it actually lands in the totals, averaged by uptime rather than at face value.
  const character: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Warrior', spec: 'Fury' }
  const gear = normalizeGearForCharacter(defaultGear, 'Warrior', 'Fury')
  const before = calculateStats(character, gear)
  const after = calculateStats(character, { ...gear, 'Trinket 1': { item: brooch!, gemIds: [] } })

  // 72 flat, plus 278 at a 20/120 uptime.
  const expectedGain = 72 + 278 * (20 / 120)
  expect(after.attackPower - before.attackPower).toBeCloseTo(expectedGain, 4)
})

test('effects that cannot be expressed as a stat bonus are left absent, not approximated', () => {
  // 48 of the wowsims effects are damage procs, mana returns, mob-type conditionals or health-only
  // buffs. StatBlock has no field for any of them, and the ingest reports and skips rather than
  // inventing a stat bonus -- which is the failure mode this project keeps undoing.

  // Hand of Justice is an extra-attack proc, not a stat buff.
  expect(getItemByWowItemId(11815)?.effect, 'Hand of Justice grants an extra attack, not stats').toBeUndefined()
  // Shadowmoon Insignia grants only Health, which StatBlock derives from Stamina and cannot hold.
  expect(getItemByWowItemId(32501)?.effect).toBeUndefined()

  // A curated effect still wins over an ingested one: those were read off real tooltips and several
  // carry a notModelled explanation the ingest cannot produce.
  const capacitor = allItems.find((item) => item.id === 'the-lightning-capacitor')
  expect(capacitor?.effect?.notModelled, 'the curated explanation must survive the merge').toBeTruthy()
  expect(capacitor?.effect?.statBonus).toEqual({})
})

test('mana regen follows the sourced formulas, and Spirit is worth nothing mid-cast', () => {
  // Read off wowsims sim/core/mana.go at the pinned commit rather than recalled.
  expect(mp5RegenPerSecond(100)).toBeCloseTo(20, 10)
  expect(spiritRegenPerSecond(300, 400)).toBeCloseTo(0.001 + 300 * Math.sqrt(400) * 0.009327, 10)
  // Above the first 20 points each Intellect is 15 mana: intellect*15 + (20 - 15*20).
  expect(manaFromIntellect(400)).toBe(400 * 15 - 280)

  // The load-bearing detail: wowsims adds Spirit regen while casting only when
  // SpiritRegenRateCasting is non-zero, and that comes from talents this project does not model. So
  // an untalented healer mid-cast regenerates from MP5 alone, and Spirit prices near zero.
  const budget = computeManaBudget({ manaCostPerCast: 840, castsPerSecond: 0.4, healPerCast: 3600, mp5: 100 })
  expect(budget.regenPerSecond, 'MP5 only — no Spirit term while casting').toBeCloseTo(20, 10)
  expect(budget.spentPerSecond).toBeCloseTo(336, 10)
  expect(budget.deficitPerSecond).toBeCloseTo(316, 10)
  expect(budget.sustainableFraction).toBeCloseTo(20 / 336, 10)
  expect(budget.healingPerMana).toBeCloseTo(3600 / 840, 10)

  // A rate regen can cover reports no deficit and never exceeds 100% sustainable.
  const cheap = computeManaBudget({ manaCostPerCast: 10, castsPerSecond: 0.4, healPerCast: 100, mp5: 100 })
  expect(cheap.deficitPerSecond).toBe(0)
  expect(cheap.sustainableFraction).toBe(1)
})

test('the healing estimate states its mana cost instead of assuming mana is free', () => {
  // "Healer HPS has no mana constraint" is one of the three reasons the Simulation tab is hidden.
  // The deficit is reported rather than used to throttle the headline: a healer who casts flat out
  // until empty and one who paces to the sustainable rate are both real, so replacing one wrong
  // number with a differently wrong one would not be progress.
  const character: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Paladin', spec: 'Holy' }
  const gear = normalizeGearForCharacter(defaultGear, 'Paladin', 'Holy')
  const stats = calculateStats(character, gear)
  const result = calculateSimulation(character, gear, stats, 'Healer')

  const row = (label: string) => result.breakdown.find((entry) => entry.label === label)?.value
  // Holy Light is 840 mana on a 2.5s cast, so 0.4 casts/sec spends 336.
  expect(row('Mana per second spent')).toBeCloseTo(840 * (1 / 2.5), 1)
  expect(row('Mana per second regained')).toBeCloseTo(stats.mp5 / 5, 1)
  expect(row('Healing per point of mana')).toBeGreaterThan(0)
  expect(row('Share of this rate regen can fund')).toBeGreaterThan(0)

  expect(result.summary).toContain('not sustainable')
  // The two caveats that stop the number being read as more than it is.
  expect(result.summary, 'Spirit being talent-gated is why it prices at zero').toMatch(/Spirit/)
  expect(result.summary, 'no time-to-empty, because class base mana is not in the pinned source').toMatch(/mana pool/)

  // The headline is untouched — still the unconstrained rate, now stated as such.
  expect(result.scoreExact).toBeGreaterThan(0)
})

test('a meta gem grants nothing until its colour condition is met', () => {
  // Nothing checked this before: a meta's stats applied the moment it was socketed, whether or not
  // the player had the gems it demands. It is the one gem rule a player can actually get wrong.
  const metas = sampleGems.filter((gem) => gem.color === 'Meta')
  expect(metas).toHaveLength(18)
  expect(metas.every((gem) => gem.metaRequirement), 'every TBC meta gem has a colour condition').toBe(true)

  const red = sampleGems.find((gem) => gem.color === 'Red')!
  const yellow = sampleGems.find((gem) => gem.color === 'Yellow')!
  const blue = sampleGems.find((gem) => gem.color === 'Blue')!
  const orange = sampleGems.find((gem) => gem.color === 'Orange')!

  // A hybrid counts toward BOTH its colours at once, which is the whole reason to socket one.
  expect(countGemColors([orange, orange])).toEqual({ Red: 2, Yellow: 2, Blue: 0, Meta: 0 })
  // Meta gems never count toward a colour requirement, including their own.
  expect(countGemColors(metas)).toEqual({ Red: 0, Yellow: 0, Blue: 0, Meta: 0 })

  // Read off the gem's own Wowhead tooltip: 2 of each colour.
  const relentless = metas.find((gem) => gem.name === 'Relentless Earthstorm Diamond')!
  expect(relentless.metaRequirement?.kind).toBe('minimums')
  expect(metaGemIsActive(relentless, [])).toBe(false)
  expect(metaGemIsActive(relentless, [red, red, yellow, yellow, blue])).toBe(false)
  expect(metaGemIsActive(relentless, [red, red, yellow, yellow, blue, blue])).toBe(true)
  // Three Orange gems satisfy the red and yellow halves but not the blue one.
  expect(metaGemIsActive(relentless, [orange, orange, orange])).toBe(false)

  // The comparison shape, which is the other thing tooltips say.
  const comparison = metas.find((gem) => gem.metaRequirement?.kind === 'moreThan')!
  expect(comparison.metaRequirement?.text).toMatch(/more .* than/i)
})

test('an unmet meta gem reaches no stat total, and the panel says why', async ({ page }) => {
  // Domain first: the stats must actually be withheld.
  const character: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Warrior', spec: 'Fury' }
  const gear = normalizeGearForCharacter(defaultGear, 'Warrior', 'Fury')

  const meta = sampleGems.find((gem) => gem.color === 'Meta' && (gem.stats.critRating ?? 0) > 0)!

  // The default set has no Meta socket, so one has to be equipped first — Destroyer Battle-Helm is
  // a real Fury Warrior head with Meta + Blue.
  const helm = getItemById('destroyer-battle-helm')!
  expect(helm.sockets).toContain('Meta')
  const withHelm = { ...gear, Head: { item: helm, gemIds: helm.sockets!.map(() => '') } }

  // Socket the meta on its own — nothing else gemmed, so no condition can be satisfied.
  const withLoneMeta = {
    ...withHelm,
    Head: { item: helm, gemIds: helm.sockets!.map((socket) => (socket === 'Meta' ? meta.id : '')) },
  }

  const bare = calculateStats(character, withHelm)
  const withMeta = calculateStats(character, withLoneMeta)
  expect(withMeta.critRating, 'an unmet meta must contribute nothing at all').toBe(bare.critRating)
  expect(metaGemIsActive(meta, [])).toBe(false)

  // And the panel has to say so. A meta failing because of gems in OTHER items is close to
  // impossible to work out from a stat total that simply reads lower than expected -- this project
  // has already been bitten once by a gem check that failed silently.
  await openApp(page)
  await selectSlotItem(page, 'Head', 'destroyer-battle-helm')
  await selectSlotGem(page, 'Head', 'Meta', meta.id)
  await withSlotOpen(page, 'Head', async () => {
    await expect(page.getByText(/Inactive —/)).toBeVisible()
    await expect(page.getByText(/grants nothing until it is/)).toBeVisible()
  })
})

test('the two pure-proc meta gems reach the stat total, at their uptime', async ({ page }) => {
  /*
   * `ingest-item-effects.mjs` reads wowsims' `metagems.go`, so it always extracted these two — but
   * `Gem` had no `effect` field, so nothing consumed them. Both carry `stats: {}`, which means that
   * until this wiring existed, socketing either contributed exactly nothing and the panel said so in
   * as many words. Their whole value is the proc.
   */
  const mystical = getGemById('mystical-skyfire-diamond')!
  const thundering = getGemById('thundering-skyfire-diamond')!

  for (const gem of [mystical, thundering]) {
    expect(Object.keys(gem.stats), `${gem.name} is a pure proc, with no flat stats`).toHaveLength(0)
    expect(gem.effect, `${gem.name} must carry its proc`).toBeDefined()
  }

  // Read off the ingest rather than assumed: 320 spell haste for 4s on a 35s internal cooldown.
  expect(mystical.effect).toMatchObject({ kind: 'proc', durationSeconds: 4, cooldownSeconds: 35 })
  expect(mystical.effect?.statBonus.spellHasteRating).toBe(320)

  /*
   * A Warrior wears the test helm, which is the odd-looking part: Mystical Skyfire is a caster gem.
   * It does not matter — spell haste rating is class-neutral arithmetic here, and reusing the proven
   * Destroyer Battle-Helm setup keeps this test about the gem rather than about gear legality.
   */
  const character: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Warrior', spec: 'Fury' }
  const gear = normalizeGearForCharacter(defaultGear, 'Warrior', 'Fury')
  const helm = getItemById('destroyer-battle-helm')!
  expect(helm.sockets).toEqual(['Meta', 'Blue'])

  // Pure Blue, so it counts toward Blue only. Mystical Skyfire wants more Blue gems than Yellow.
  const blue = sampleGems.find((gem) => gem.color === 'Blue')!
  const head = (gemIds: string[]) => ({ ...gear, Head: { item: helm, gemIds } })

  const bare = calculateStats(character, head(['', '']))
  const blueOnly = calculateStats(character, head(['', blue.id]))
  const metaAlone = calculateStats(character, head([mystical.id, '']))
  const metaAndBlue = calculateStats(character, head([mystical.id, blue.id]))

  // Condition met: 1 Blue against 0 Yellow. The blue gem is held constant across both sides, so the
  // difference is the meta's proc and nothing else -- the helm's socket bonus is Strength, which
  // cannot reach spell haste either way.
  expect(metaGemIsActive(mystical, [blue])).toBe(true)
  expect(metaAndBlue.spellHasteRating - blueOnly.spellHasteRating).toBeCloseTo(320 * effectUptime(4, 35), 6)

  // Condition unmet: 0 Blue is not "more than" 0 Yellow. A proc is part of the nothing an inactive
  // meta grants, so it must not leak through on its own.
  expect(metaGemIsActive(mystical, [])).toBe(false)
  expect(metaAlone.spellHasteRating).toBe(bare.spellHasteRating)

  // And the panel has to show it, or the gem still reads as worthless to anyone choosing one.
  await openApp(page)
  await selectSlotItem(page, 'Head', 'destroyer-battle-helm')
  await selectSlotGem(page, 'Head', 'Meta', mystical.id)
  await withSlotOpen(page, 'Head', async () => {
    const effect = page.getByTestId('gem-effect-Head-0')
    await expect(effect).toBeVisible()
    await expect(effect).toContainText('11% uptime')
    // Scoped to the chip rather than the page: an absence assertion against the whole document
    // would pass just as happily if the chip had not rendered at all.
    await expect(page.getByTestId('gem-chip-Head-0')).not.toContainText('No stats this app models')
  })
})

test('the ranked list opens collapsed per slot, and only offers the control where it earns it', async ({ page }) => {
  /*
   * Measured before the cap was chosen, not after: the panel was 6,458px — 9.0 screens at 1280x720 —
   * from 64 entries across 15 slot groups, with a median entry height of only 61px. The length came
   * from how many entries there were, not from how tall they are, which is why the fix is to show
   * fewer by default rather than to shrink them.
   *
   * Capping at 3, the obvious "a few", would have hidden just 22.9% of entries across all 27 specs,
   * because 288 of the 398 slot groups hold exactly 4. Two lands at ~6.1 screens and still reads as
   * a ranking, since a #1 and a #2 are both on screen.
   */
  await openApp(page)
  await openPlannerView(page, 'Ranked Gear')

  const panel = page.getByTestId('bis-panel')

  // Fury Warrior ranks 3 or 4 items in every one of its 15 slots, so nothing is fully shown and the
  // collapsed total is exactly 15 x 2.
  await expect(panel.locator('.bis-entry')).toHaveCount(30)
  await expect(panel.locator('.bis-slot-toggle')).toHaveCount(15)

  // Head ranks 3, so opening it reveals exactly the one it was holding back.
  const headToggle = page.getByTestId('bis-show-all-Head')
  await expect(headToggle).toHaveText('Show all 3')
  await expect(headToggle).toHaveAttribute('aria-expanded', 'false')

  await headToggle.click()
  await expect(panel.locator('.bis-entry')).toHaveCount(31)
  await expect(headToggle).toHaveText('Show top 2')
  await expect(headToggle).toHaveAttribute('aria-expanded', 'true')

  // Opening one slot must not open the rest. The point is to compare within a slot, not to restore
  // the nine-screen wall in one click.
  await expect(panel.locator('.bis-slot-toggle')).toHaveCount(15)

  await headToggle.click()
  await expect(panel.locator('.bis-entry')).toHaveCount(30)
  await expect(headToggle).toHaveText('Show all 3')

  /*
   * A Combat Rogue ranks at most 2 in every slot, so nothing is ever hidden. No slot should offer a
   * control that would reveal nothing — a dead "Show all 2" next to two visible rows is worse than
   * no control, because it implies there is more.
   */
  await page.getByLabel('Class').selectOption('Rogue')
  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Combat')
  await expectRankedList(page, 'Combat Rogue Phase 2 Ranked List')
  await expect(panel.locator('.bis-slot-toggle')).toHaveCount(0)
})

test('Buffs & Consumables is reachable again, and a toggle moves the totals', async ({ page }) => {
  /*
   * The panel was hidden alongside the Simulation tab, but for a different reason and with a worse
   * consequence. Its data is real and sourced — 33 raid buffs each cited to the spell rank its
   * numbers were read from — and `calculateStats` was applying it the whole time. With nothing
   * rendering the toggles the three id lists defaulted to empty and could never be changed, so that
   * whole dataset reached no number in the app.
   */
  await openApp(page)
  await openPlannerView(page, 'Buffs')
  await expect(page.getByTestId('buffs-panel')).toBeVisible()

  // Battle Shout is +306 attack power at rank 8, melee only. Asserting the exact delta rather than
  // "went up" is the point: it proves the sourced value reaches the total intact, and would catch a
  // buff being applied twice or scaled by something it should not be.
  const readAp = async () => readStatValue(await page.getByTestId('stat-attack-power').innerText())

  const before = await readAp()
  await page.getByTestId('buff-toggle-battle-shout').click()
  const after = await readAp()
  expect(after - before, 'Battle Shout is a flat +306 melee attack power').toBe(306)

  // And it has to come back off — a toggle that only adds is a filter, not a toggle.
  await page.getByTestId('buff-toggle-battle-shout').click()
  expect(await readAp(), 'unticking must restore the unbuffed total exactly').toBe(before)

  // The rail survives the new view, like the other four.
  await expect(page.getByRole('region', { name: 'Stats' })).toBeVisible()
})

test('an empty talent tree reproduces the untalented numbers exactly', () => {
  /*
   * The hard invariant of this whole pass. `talentPoints` defaults to `{}` everywhere, so if the
   * modifiers were not exactly identity at zero points, every existing expectation in this file
   * would move at once and the cause would be almost impossible to isolate.
   */
  expect(deriveTalentModifiers({})).toEqual(noTalentModifiers)

  const character: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Warrior', spec: 'Fury' }
  const gear = normalizeGearForCharacter(defaultGear, 'Warrior', 'Fury')
  const stats = calculateStats(character, gear)

  const omitted = calculateSimulation(character, gear, stats, 'Physical DPS')
  const empty = calculateSimulation(character, gear, stats, 'Physical DPS', [], undefined, {})
  expect(empty.scoreExact, 'passing an empty tree must equal passing nothing').toBe(omitted.scoreExact)

  // And it must still be the figure the handoff records, so a drift here is visible immediately.
  expect(empty.score).toBe(192.3)
})

test('main-hand and off-hand picks are separate rankings, not one collided list', () => {
  /*
   * The guides publish a "Main Hand" and an "Off Hand" section, and the section says which hand the
   * pick is *for*. That was being thrown away: a **one-hander is catalogued `Main Hand`** but is
   * legal in either hand, so every one-hander ranked under "Off Hand" was filed as a main hand.
   *
   * The visible symptom was two rankings stacked in one slot. A Fury warrior's Main Hand read
   * `#1 #1 #2 #2 #3 #3 #4 #4` — all four off-hand picks landed on top of all four main-hand picks —
   * and the off hand showed a fallback list synthesised from main-hand one-handers instead of the
   * four weapons the guide actually names for it.
   *
   * The rule is now: honour the section when the item fits it, fall back to the catalogue when it
   * cannot. The fallback direction still matters and is asserted below — "Claw of the Phoenix" is
   * ranked in Hunter's *Main Hand* section and is off-hand only, so it must move.
   */
  const listFor = (className: string, spec: string) =>
    bisLists.find((entry) => entry.className === className && entry.spec === spec)!
  const inSlot = (className: string, spec: string, slot: string) =>
    listFor(className, spec)
      .entries.filter((entry) => entry.slot === slot)
      .sort((a, b) => a.rank - b.rank)
      .map((entry) => getItemById(entry.itemId)!.name)

  // Fury is the case that collided completely: four against four, no overlap between the lists.
  const furyMain = inSlot('Warrior', 'Fury', 'Main Hand')
  const furyOff = inSlot('Warrior', 'Fury', 'Off Hand')
  expect(furyMain).toEqual(['Dragonstrike', 'Dragonmaw', 'Rod of the Sun King', 'Talon of the Phoenix'])
  expect(furyOff[0], "the guide's top off-hand pick must be the one it names").toBe('Talon of Azshara')
  expect(furyOff).toHaveLength(4)

  // Arms keeps its two-handers ahead of its one-handers — that ordering is Wowhead's, not ours.
  const armsMain = inSlot('Warrior', 'Arms', 'Main Hand')
  expect(armsMain.slice(0, 3)).toEqual([
    'Twinblade of the Phoenix',
    'Lionheart Executioner',
    "Merciless Gladiator's Greatsword",
  ])
  for (const name of armsMain.slice(0, 3)) {
    expect(allItems.find((item) => item.name === name)!.handType, `${name} should be two-handed`).toBe('Two Hand')
  }
  expect(inSlot('Warrior', 'Arms', 'Off Hand')[0]).toBe("Merciless Gladiator's Quickblade")

  /*
   * The other direction: an off-hand-only item ranked in a Main Hand section must still move, or the
   * panel offers a main hand it can never occupy. This is the case the original rule existed for, and
   * keeping it is why the rule is "section unless impossible" rather than "section always".
   */
  expect(inSlot('Hunter', 'Beast Mastery', 'Off Hand')).toContain('Claw of the Phoenix')
  expect(inSlot('Hunter', 'Beast Mastery', 'Main Hand')).not.toContain('Claw of the Phoenix')

  // No slot may rank the same item twice, which is what a collided list produced.
  for (const list of bisLists) {
    const seen = new Set<string>()
    for (const entry of list.entries) {
      const key = `${entry.slot}|${entry.itemId}`
      expect(seen.has(key), `${list.className} ${list.spec} ranks ${entry.itemId} twice in ${entry.slot}`).toBe(false)
      seen.add(key)
    }
  }
})

test('nothing reachable offers gear from a later phase than this planner covers', () => {
  /*
   * The app targets Phase 2 and `getItemsForSlot` enforces that — so the picker, the default set and
   * the upgrade finder were always correct. The leak was everything that resolves an item by **id**
   * and therefore never passes through a slot query: the Ranked Gear panel's Equip button, restoring
   * a saved build, and importing someone else's. All three could seat Phase 3+ gear that the Gear
   * panel would then refuse to list, counted in every stat total.
   *
   * Verified against real sources rather than trusting the phase number, because getting this
   * backwards would have deleted legitimate rankings: Band of Eternity rewards *Champion's Pledge*,
   * which requires Scale of the Sands — Mount Hyjal, Phase 3 — and Hailstone Pendant comes from the
   * Ice Chest Ahune drops in the Slave Pens during Midsummer, added in 2.4.
   *
   * Note item level is NOT the test. Two genuinely Phase 1-2 crafted epics sit at ilvl 146, above the
   * Tier 5 ceiling of 141, and an ilvl rule would wrongly strip both.
   */
  const outOfPhase = allItems.filter((item) => !isWithinDefaultPhase(item))
  expect(outOfPhase.length, 'the catalogue still carries later-phase gear, deliberately').toBeGreaterThan(1000)

  // 1. No ranked list may name one.
  const ranked = bisLists.flatMap((list) =>
    list.entries
      .map((entry) => ({ list, entry, item: getItemById(entry.itemId) }))
      .filter(({ item }) => item && !isWithinDefaultPhase(item))
      .map(({ list, entry, item }) => `${list.className} ${list.spec} ${entry.slot}: ${item!.name} (phase ${item!.phase})`),
  )
  expect(ranked, 'no ranked entry may name gear from a later phase').toEqual([])
  expect(excludedByPhase, 'and the ones dropped are counted rather than silently lost').toBe(5)

  // 2. Every slot group is a dense 1..N ranking. See the dedicated test below for why this holds.
  for (const list of bisLists) {
    const bySlot = new Map<string, number[]>()
    for (const entry of list.entries) {
      if (!bySlot.has(entry.slot)) bySlot.set(entry.slot, [])
      bySlot.get(entry.slot)!.push(entry.rank)
    }
    for (const [slot, ranks] of bySlot) {
      const sorted = [...ranks].sort((a, b) => a - b)
      expect(sorted, `${list.className} ${list.spec} ${slot} ranks must be dense`).toEqual(
        sorted.map((_, index) => index + 1),
      )
    }
  }

  // 3. Normalisation strips one that somehow got equipped — the saved-build and Equip-button path.
  const bandOfEternity = getItemByWowItemId(29298)!
  expect(bandOfEternity.phase, 'the fixture must still be out of phase, or this proves nothing').toBe(3)

  // Dwarf, not Human — Humans cannot be Hunters in TBC, and `validateBuild` rejects the whole build
  // on an illegal race/class pair, which would make the per-slot assertion below unreachable.
  const character = { faction: 'Alliance', race: 'Dwarf', className: 'Hunter', spec: 'Beast Mastery' } as const
  const smuggled = {
    ...normalizeGearForCharacter(defaultGear, 'Hunter', 'Beast Mastery'),
    'Finger 1': { item: bandOfEternity, gemIds: [] },
  }
  const cleaned = normalizeGearForCharacter(smuggled, 'Hunter', 'Beast Mastery')
  expect(cleaned['Finger 1'].item.id, 'normalisation must replace out-of-phase gear').not.toBe(bandOfEternity.id)
  expect(isWithinDefaultPhase(cleaned['Finger 1'].item), 'and what replaces it must be in phase').toBe(true)

  // 4. Importing one is rejected, and for the *right* stated reason.
  const imported = validateBuild({
    version: BUILD_FORMAT_VERSION,
    character,
    gear: { 'Finger 1': { itemId: bandOfEternity.id, gemIds: [] } },
  })
  expect(imported.ok, 'the build itself must be valid, or the slot issue below is unreachable').toBe(true)
  const phaseIssue = imported.ok ? imported.issues.find((issue) => issue.slot === 'Finger 1') : undefined
  expect(phaseIssue, 'importing later-phase gear must be reported').toBeDefined()
  expect(phaseIssue!.message, 'and named as a phase problem, not a class-legality one').toMatch(
    new RegExp(`Phase 3 gear.*Phase ${defaultMaxPhase}`),
  )
  expect(phaseIssue!.message).not.toMatch(/isn't legal for/)
})

test('talents reach all 27 specs, and each role path reads only its own fields', () => {
  /*
   * This test used to assert the exact opposite, and that is the point of it.
   *
   * It was written to pin `featureFlags.ts`'s claim that only 11 specs receive talents, with a note
   * saying "when someone threads talents into either path, this test fails — and the failure is the
   * reminder to rewrite the flag's text". That happened, deliberately, so the assertion is inverted
   * and the flag rewritten with it.
   *
   * Shaman and Paladin remain the sharp fixtures for a different reason now: both classes have
   * *melee* effects that a caster or healer spec must **not** pick up. Weapon Mastery is physical
   * damage — an Elemental Shaman taking it must move by exactly nothing, while Nature's Guidance
   * moves the same spec's spell hit. That is what proves the fields are routed rather than merely
   * summed.
   */
  const idOf = (className: string, name: string) =>
    getTalentData(className)!.trees.flatMap((tree) => tree.talents).find((talent) => talent.name === name)!.id

  const scoreFor = (className: TbcClass, spec: TbcSpec, role: CharacterRole, points: Record<number, number>) => {
    const character: CharacterProfile = { faction: 'Alliance', race: 'Human', className, spec }
    const gear = normalizeGearForCharacter(defaultGear, className, spec)
    const stats = calculateStats(character, gear)
    return calculateSimulation(character, gear, stats, role, [], undefined, points).scoreExact
  }

  // Every caster and healer class must now move on its own spell talents.
  const movers: ReadonlyArray<readonly [TbcClass, TbcSpec, CharacterRole, Record<number, number>]> = [
    ['Mage', 'Fire', 'Caster DPS', { [idOf('Mage', 'Arcane Instability')]: 3, [idOf('Mage', 'Playing with Fire')]: 3 }],
    ['Warlock', 'Destruction', 'Caster DPS', { [idOf('Warlock', 'Backlash')]: 3 }],
    ['Priest', 'Shadow', 'Caster DPS', { [idOf('Priest', 'Force of Will')]: 5 }],
    ['Priest', 'Holy', 'Healer', { [idOf('Priest', 'Force of Will')]: 5 }],
    ['Druid', 'Balance', 'Caster DPS', { [idOf('Druid', 'Natural Perfection')]: 3 }],
    ['Shaman', 'Elemental', 'Caster DPS', { [idOf('Shaman', "Nature's Guidance")]: 3 }],
    ['Paladin', 'Holy', 'Healer', { [idOf('Paladin', 'Sanctified Seals')]: 3 }],
  ]
  for (const [className, spec, role, points] of movers) {
    expect(
      scoreFor(className, spec, role, points),
      `${className} ${spec} must benefit from its own spell talents`,
    ).toBeGreaterThan(scoreFor(className, spec, role, {}))
  }

  /*
   * Routing, not summing. A melee talent must reach a caster spec's score by exactly zero — the same
   * class, the same call, a different field.
   */
  const weaponMastery = { [idOf('Shaman', 'Weapon Mastery')]: 5 }
  expect(deriveTalentModifiers(weaponMastery)).not.toEqual(noTalentModifiers)
  expect(
    scoreFor('Shaman', 'Elemental', 'Caster DPS', weaponMastery),
    "a physical-damage talent must not touch a caster's score",
  ).toBe(scoreFor('Shaman', 'Elemental', 'Caster DPS', {}))

  /*
   * Both tanks now respond too, which closes the last of the four paths. Anticipation is the fixture
   * because it is the one that moves everything: a Defense skill point shifts miss, dodge, parry,
   * block and the boss's crit chance at once.
   */
  for (const className of ['Warrior', 'Paladin'] as const) {
    const points = { [idOf(className, 'Anticipation')]: 5, [idOf(className, 'Deflection')]: 5 }
    expect(
      scoreFor(className, 'Protection', 'Tank', points),
      `${className} Protection must benefit from its avoidance talents`,
    ).toBeGreaterThan(scoreFor(className, 'Protection', 'Tank', {}))
  }

  /*
   * And the routing check on the tank side: a pure DPS talent must move a tank score by exactly
   * nothing. Cruelty is melee crit, which the survivability table never rolls.
   */
  const cruelty = { [idOf('Warrior', 'Cruelty')]: 5 }
  expect(deriveTalentModifiers(cruelty)).not.toEqual(noTalentModifiers)
  expect(
    scoreFor('Warrior', 'Protection', 'Tank', cruelty),
    'a melee crit talent must not move Effective Health',
  ).toBe(scoreFor('Warrior', 'Protection', 'Tank', {}))

  /*
   * The figure `featureFlags.ts` quotes, computed rather than trusted. Every class is ingested and
   * every one of the four role paths now takes `TalentModifiers`, so the count is all 27.
   */
  let specs = 0
  for (const entry of tbcClasses) {
    for (const _spec of entry.specs) {
      specs++
      expect(classHasTalentEffects(entry.className), `${entry.className} must have ingested effects`).toBe(true)
    }
  }
  expect(specs, 'the "27 specs of 27" figure featureFlags.ts quotes').toBe(27)
})

test('Meditation is what makes Spirit worth anything to a healer, and the estimate says which case it is in', () => {
  /*
   * The load-bearing detail of the whole mana model, and the one place a talent changes what a *stat*
   * is worth rather than how big a number is. wowsims applies Spirit regen during casting only when
   * `SpiritRegenRateCasting` is non-zero, and that comes solely from talents. Untalented, MP5 is the
   * entire mid-cast regen and Spirit prices at exactly zero — real TBC, not a modelling shortcut.
   *
   * The estimate used to state that as a property of *the app* ("which are not modelled"). It is now
   * a property of the *build*, computed, so it cannot rot: the sentence is chosen by the number.
   */
  const idOf = (className: string, name: string) =>
    getTalentData(className)!.trees.flatMap((tree) => tree.talents).find((talent) => talent.name === name)!.id

  const character: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Priest', spec: 'Holy' }
  const gear = normalizeGearForCharacter(defaultGear, 'Priest', 'Holy')
  const stats = calculateStats(character, gear)
  const resultFor = (points: Record<number, number>) =>
    calculateSimulation(character, gear, stats, 'Healer', [], undefined, points)

  const regenOf = (result: ReturnType<typeof resultFor>) =>
    result.breakdown.find((entry) => entry.label === 'Mana per second regained')!.value

  const bare = resultFor({})
  const meditated = resultFor({ [idOf('Priest', 'Meditation')]: 3 })

  /*
   * The exact arithmetic is asserted on `computeManaBudget` rather than on the breakdown row, because
   * the row is rounded for display and rounding would hide the difference between applying the share
   * once, twice, or at the wrong rank. "Went up" would pass in all three cases.
   */
  const spirit = spiritRegenPerSecond(stats.spirit, stats.intellect)
  const budget = (share: number) =>
    computeManaBudget({
      manaCostPerCast: 100,
      castsPerSecond: 1,
      healPerCast: 1,
      mp5: stats.mp5,
      spirit: stats.spirit,
      intellect: stats.intellect,
      spiritRegenWhileCasting: share,
    })

  expect(budget(0).spiritRegenPerSecond, 'untalented, Spirit contributes exactly nothing').toBe(0)
  expect(budget(0).regenPerSecond).toBeCloseTo(stats.mp5 / 5, 10)
  expect(budget(0.3).spiritRegenPerSecond).toBeCloseTo(spirit * 0.3, 10)
  expect(budget(0.3).regenPerSecond).toBeCloseTo(stats.mp5 / 5 + spirit * 0.3, 10)

  // And the rendered estimate reflects it.
  expect(regenOf(bare)).toBeCloseTo(stats.mp5 / 5, 1)
  expect(bare.summary, 'the estimate must state it as a fact about the build').toMatch(/no points in Meditation/i)
  expect(regenOf(meditated)).toBeGreaterThan(regenOf(bare))
  expect(meditated.summary).toMatch(/Meditation and its equivalents keep 30% of Spirit regen/i)
  expect(meditated.summary, 'the old "not modelled" wording must be gone').not.toMatch(/are not modelled/i)
})

test('Flurry is solved analytically, and its value is gated hard by crit chance', () => {
  /*
   * wowsims models Flurry as a 3-stack aura on an event timeline: any melee crit sets 3 stacks, only
   * a white hit removes one. This simulator has no timeline, so the aura becomes the stationary
   * distribution of a Markov chain over the stack count — see `flurrySpeedMultiplier`.
   *
   * The boundaries are what make the derivation checkable without re-deriving it.
   */
  expect(flurrySpeedMultiplier(1, 0.3), 'untalented must be exact identity').toBe(1)
  // At 100% crit the stacks refresh every swing and can never run out, so the aura is permanent and
  // the multiplier is the full bonus. Any formula that misses this boundary is wrong.
  expect(flurrySpeedMultiplier(1.25, 1)).toBeCloseTo(1.25, 10)
  expect(flurrySpeedMultiplier(1.25, 0), 'it never procs without crits').toBe(1)

  // Monotonic in crit, which is the qualitative claim the talent is about.
  const curve = [0.05, 0.1, 0.2, 0.3, 0.5].map((crit) => flurrySpeedMultiplier(1.25, crit))
  for (let i = 1; i < curve.length; i++) expect(curve[i]).toBeGreaterThan(curve[i - 1])

  /*
   * The finding worth pinning: at the crit a Phase 2 Fury warrior actually has, a "+25% attack
   * speed" talent is worth about +7%. The handoff treated Flurry as the unlock that would close the
   * rage gap. It is not, and this is the number that says why.
   */
  expect(flurrySpeedMultiplier(1.25, 0.131)).toBeCloseTo(1.0738, 3)
})

/** The modelled Fury allocation, by talent name, resolved against the ingested tree. */
function furyTalentPoints(entries: readonly (readonly [string, number])[]) {
  const data = getTalentData('Warrior')!
  const byName = new Map<string, number>()
  for (const tree of data.trees) for (const talent of tree.talents) byName.set(talent.name, talent.id)

  const points: Record<number, number> = {}
  for (const [name, rank] of entries) {
    const id = byName.get(name)
    expect(id, `${name} must exist in the ingested Warrior tree`).toBeDefined()
    points[id!] = rank
  }
  return points
}

test('talent modifiers come from the ingest, and reach the melee estimate', () => {
  const points = furyTalentPoints([
    ['Cruelty', 5],
    ['Precision', 3],
    ['Flurry', 5],
    ['Improved Berserker Stance', 5],
    ['Dual Wield Specialization', 5],
    ['Unbridled Wrath', 5],
    ['Weapon Mastery', 2],
    ['Endless Rage', 1],
    ['Anger Management', 1],
  ])

  // Every value below is `sim/warrior/talents.go` at the pinned commit, not a tooltip reading.
  const modifiers = deriveTalentModifiers(points)
  expect(modifiers.meleeCritChance).toBeCloseTo(0.05, 10)
  expect(modifiers.meleeHitChance).toBeCloseTo(0.03, 10)
  expect(modifiers.attackPowerMultiplier).toBeCloseTo(1.1, 10)
  expect(modifiers.offHandDamageMultiplier).toBeCloseTo(1.25, 10)
  expect(modifiers.targetDodgeReduction).toBeCloseTo(0.02, 10)
  expect(modifiers.flurryBonus).toBeCloseTo(1.25, 10)
  expect(modifiers.rageGeneratedMultiplier).toBeCloseTo(1.25, 10)
  expect(modifiers.flatRagePerSecond, 'Anger Management is 1 rage every 3 seconds').toBeCloseTo(1 / 3, 10)
  expect(modifiers.rageProcsPerMinute, 'Unbridled Wrath is 3 procs per minute per rank').toBeCloseTo(15, 10)

  const character: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Warrior', spec: 'Fury' }
  const gear = normalizeGearForCharacter(defaultGear, 'Warrior', 'Fury')
  const stats = calculateStats(character, gear)

  const before = calculateSimulation(character, gear, stats, 'Physical DPS', [], undefined, {})
  const after = calculateSimulation(character, gear, stats, 'Physical DPS', [], undefined, points)

  // Cruelty is a flat +5% crit chance, so the crit row moves by exactly five points.
  const critOf = (result: typeof before) => result.breakdown.find((entry) => entry.label === 'Crit chance')!.value
  expect(critOf(after) - critOf(before)).toBeCloseTo(5, 6)

  expect(after.scoreExact, 'talents must raise melee DPS').toBeGreaterThan(before.scoreExact)
  expect(after.score).toBe(224.3)
})

test('talents do NOT close the rage gap, which is what this pass set out to test', () => {
  /*
   * Recorded as a result rather than a defect. The scope committed in advance to a falsification
   * test: a talented Fury build should move DPS substantially AND close the rage shortfall. The
   * first held — 192.3 to 224.3, +16.6%. The second did not.
   *
   * Swings plus Bloodrage fund 3.4 rage/sec untalented. **Every talent-side source takes that to
   * 5.4** — Endless Rage scales the swing-speed term, Flurry raises the swing rate that income is
   * built on, Anger Management adds a flat 1/3, Unbridled Wrath's 15 procs a minute add 0.25, and
   * Improved Berserker Rage another 1/3. Against the 7.5 Bloodthirst and Whirlwind want, the dump
   * stays unaffordable.
   *
   * **The remainder is not another talent.** What is left is rage from damage taken, which a
   * closed-form model of a DPS cannot derive — it has no incoming-damage stream. That is now an
   * encounter input defaulting to 0, so this assertion is about the default: with no incoming damage
   * declared, the rotation does not fund its dump.
   *
   * What is still missing is therefore NOT talent scaling. It is Bloodrage, damage taken, and rage
   * from sources this model does not carry. Flurry was expected to be the unlock and is not, because
   * it is gated on crit and Phase 2 crit is 13%.
   */
  const character: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Warrior', spec: 'Fury' }
  const gear = normalizeGearForCharacter(defaultGear, 'Warrior', 'Fury')
  const stats = calculateStats(character, gear)

  const points = furyTalentPoints([
    ['Flurry', 5],
    ['Endless Rage', 1],
    ['Anger Management', 1],
    ['Unbridled Wrath', 5],
    ['Cruelty', 5],
  ])

  const result = calculateSimulation(character, gear, stats, 'Physical DPS', [], undefined, points)
  const rage = result.breakdown.find((entry) => entry.label === 'Rage per second')!.value

  expect(rage, 'talent rage income is real').toBeGreaterThan(3.4)
  expect(rage, 'but it does not reach the 7.5 the rotation wants').toBeLessThan(7.5)
  expect(result.summary, 'and the estimate must still say the dump is unfunded').toMatch(/no surplus to dump/i)
})

test('Bloodrage is baseline warrior income, and is not multiplied by Endless Rage', () => {
  /*
   * An ability rather than a talent — every warrior has it from level 10 — so it raises the
   * *untalented* baseline too, which is why the figure this file used to quote as 3.1 is now 3.4.
   *
   * `sim/warrior/bloodrage.go`: 10 rage instantly plus ten 1-rage ticks, on a 60s cooldown. Reduced
   * to a sustained rate on the assumption it is pressed on cooldown, which is what upstream does
   * whenever rage is under 70.
   */
  expect(bloodrageRagePerSecond()).toBeCloseTo(20 / 60, 10)
  // Improved Bloodrage is a Protection talent, so a Fury build never sees this branch — but the
  // ability itself scales, and the constant is sourced rather than assumed.
  expect(bloodrageRagePerSecond(2)).toBeCloseTo(26 / 60, 10)

  const character: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Warrior', spec: 'Fury' }
  const gear = normalizeGearForCharacter(defaultGear, 'Warrior', 'Fury')
  const stats = calculateStats(character, gear)
  const untalented = calculateSimulation(character, gear, stats, 'Physical DPS', [], undefined, {})
  const rage = untalented.breakdown.find((entry) => entry.label === 'Rage per second')!.value

  /*
   * Bloodrage is granted outright, so Endless Rage must not touch it — and Endless Rage does not
   * scale a whole swing either, only the swing-speed half of one. Both mistakes show up the same
   * way: the total rising by a full 25% of swing income. It must rise by strictly less than that,
   * and by strictly more than nothing.
   */
  const points = furyTalentPoints([['Endless Rage', 1]])
  const withEndlessRage = calculateSimulation(character, gear, stats, 'Physical DPS', [], undefined, points)
  const talentedRage = withEndlessRage.breakdown.find((entry) => entry.label === 'Rage per second')!.value
  const swingIncome = rage - bloodrageRagePerSecond()

  expect(talentedRage, 'Endless Rage is worth something').toBeGreaterThan(rage)
  expect(
    talentedRage,
    'but not a full 25% of swing income — that would mean it scaled Bloodrage, or the damage half of a swing',
  ).toBeLessThan(swingIncome * 1.25 + bloodrageRagePerSecond())
})

test('the talents this model cannot express are reported rather than dropped', () => {
  // The ingest refuses what the closed-form model has nowhere to put, and says so per talent. That
  // list is the honest statement of what a Fury number is still missing.
  expect(unmodelledTalents.length).toBeGreaterThan(0)
  const named = unmodelledTalents.map((entry) => entry.talent).join(' ')
  expect(named).toMatch(/Deep Wounds/)
  expect(named).toMatch(/Death Wish/)
  for (const entry of unmodelledTalents) {
    expect(entry.reason.length, `${entry.talent} needs a real reason, not a placeholder`).toBeGreaterThan(20)
  }
})

test('damage taken is an encounter input, and it is what funds the rage dump', async () => {
  /*
   * The last rage source in TBC, and the only one a closed-form model of a DPS cannot derive: rage
   * is granted for damage **taken** as well as dealt. wowsims computes it per incoming hit, from a
   * damage stream this simulator does not have.
   *
   * So it is declared rather than guessed. The default is 0, which understates rage income and says
   * so, because how much a melee DPS takes is entirely fight-specific — any other default would be
   * an invented number wearing a measurement's clothes.
   */
  expect(rageFromDamageTaken(0)).toBe(0)
  // `damage * 2.5 / 274.7`, straight from sim/core/rage.go.
  expect(rageFromDamageTaken(274.7)).toBeCloseTo(2.5, 10)
  expect(rageFromDamageTaken(-100), 'negative incoming damage is not a thing').toBe(0)

  const character: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Warrior', spec: 'Fury' }
  const gear = normalizeGearForCharacter(defaultGear, 'Warrior', 'Fury')
  const stats = calculateStats(character, gear)
  const points = furyTalentPoints([
    ['Cruelty', 5],
    ['Precision', 3],
    ['Flurry', 5],
    ['Improved Berserker Stance', 5],
    ['Dual Wield Specialization', 5],
    ['Unbridled Wrath', 5],
    ['Weapon Mastery', 2],
    ['Endless Rage', 1],
    ['Anger Management', 1],
    ['Improved Berserker Rage', 2],
  ])

  const at = (damageTakenPerSecond: number) =>
    calculateSimulation(character, gear, stats, 'Physical DPS', [], { ...defaultSimulationTarget, damageTakenPerSecond }, points)
  const rageOf = (result: ReturnType<typeof at>) => result.breakdown.find((entry) => entry.label === 'Rage per second')!.value
  const heroicStrikeOf = (result: ReturnType<typeof at>) => result.breakdown.find((entry) => /Heroic Strike/i.test(entry.label))?.value

  // Omitting the field must behave exactly as declaring zero, or the default is a hidden assumption.
  const omitted = calculateSimulation(character, gear, stats, 'Physical DPS', [], defaultSimulationTarget, points)
  expect(rageOf(omitted)).toBe(rageOf(at(0)))

  // At the default the rotation still cannot fund its dump — the finding this whole pass produced.
  expect(heroicStrikeOf(at(0)), 'no incoming damage means no surplus').toBeUndefined()
  expect(rageOf(at(0))).toBeLessThan(7.5)

  // Enough incoming damage and it does. The crossover sits around 250-300/sec, which is the number
  // worth knowing: it says how much of a real fight the zero default is leaving out.
  expect(heroicStrikeOf(at(500)), 'heavy incoming damage funds the dump').toBeGreaterThan(0)
  expect(rageOf(at(500))).toBeGreaterThan(7.5)

  /*
   * Linear in the coefficient rather than merely "goes up". Compared across a wide span and at low
   * precision on purpose: breakdown values are rounded to one decimal for display, so differencing
   * two of them carries up to 0.1 of rounding error — tight enough tolerance on a narrow span would
   * be testing the rounding rather than the model.
   */
  expect(rageOf(at(500)) - rageOf(at(100))).toBeCloseTo(rageFromDamageTaken(400), 0)
})

test('Endless Rage scales only the swing-speed term, not the whole swing', () => {
  /*
   * Easy to get wrong, and this code did get it wrong first: the tooltip reads "you generate 25% more
   * rage from damage dealt", but upstream writes
   *
   *     damage*(3.75/RageFactor) + HitFactor*BaseSwingSpeed*rageMultiplier
   *
   * so the damage-proportional half is untouched. Applying the multiplier to the whole swing
   * overstated the talent by enough to matter — it put talented rage income at 5.8 when it is 5.4.
   */
  const outcomes = { miss: 0.08, dodge: 0.065, parry: 0, glance: 0.24, block: 0, crit: 0.13, hit: 0.485 }
  const base = {
    damagePerLandedSwing: 400,
    swingsPerSecond: 0.5,
    baseSwingSpeed: 2.6,
    isOffHand: false,
    outcomes,
    glanceMultiplier: 0.75,
  }

  const untalented = rageFromOneSwing(base)
  const talented = rageFromOneSwing({ ...base, rageMultiplier: 1.25 })

  expect(talented).toBeGreaterThan(untalented)
  // If it multiplied the whole swing, this would be exactly 1.25.
  expect(talented / untalented, 'the damage half must not scale').toBeLessThan(1.25)

  // The difference must be exactly 25% of the swing-speed term alone.
  const swingSpeedTerm = MAIN_HAND_HIT_FACTOR * base.baseSwingSpeed * (1 - outcomes.miss + outcomes.crit)
  expect(talented - untalented).toBeCloseTo(0.25 * swingSpeedTerm, 10)
})

/*
 * ---------------------------------------------------------------------------------------------
 * Disclosure invariants.
 *
 * The Simulation tab's whole case for being worth showing is that it describes its own limits
 * honestly. Four of those descriptions turned out to be false in one sitting — the feature flag's
 * three reasons, the rotation summary's list of "unmodelled" rage sources, the stat-weights panel's
 * claim that haste is unread, and the upgrade finder's claim that most of the catalogue is
 * estimated. Every one had been true when written.
 *
 * That is the pattern worth fixing rather than the four instances: closing a gap never forces the
 * text describing it to change, so the text rots silently and a *wrong* caveat is worse than none.
 * These tests give each claim something that fails when it stops being true.
 * ---------------------------------------------------------------------------------------------
 */

test('a stat called unmodelled must actually score zero', () => {
  /*
   * The invariant that would have caught the haste bug on the day it appeared. `notModeledYet` says
   * "the engine does not read this", and a stat the engine does not read cannot move the result. So
   * a flagged stat scoring anything at all is a self-contradiction — which is exactly what haste was
   * doing, at 0.059 per point, while the panel told players it was unread.
   *
   * Only asserted in that direction. The reverse is not a defect: an unflagged stat can legitimately
   * score zero by being capped, which is the distinction the panel exists to draw.
   */
  const character: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Warrior', spec: 'Fury' }
  const gear = normalizeGearForCharacter(defaultGear, 'Warrior', 'Fury')

  for (const [className, spec, race, faction] of [
    ['Warrior', 'Fury', 'Human', 'Alliance'],
    ['Hunter', 'Beast Mastery', 'Human', 'Alliance'],
    ['Mage', 'Fire', 'Human', 'Alliance'],
    ['Priest', 'Holy', 'Human', 'Alliance'],
  ] as const) {
    const profile: CharacterProfile = { faction, race, className, spec }
    const specGear = normalizeGearForCharacter(defaultGear, className, spec)
    const role = getRoleForSpec(className, spec)
    const weights = calculateStatWeights(profile, specGear, role)

    for (const entry of weights.entries) {
      if (!entry.notModeledYet) continue
      expect(
        entry.perPoint,
        `${className} ${spec}: ${entry.label} is flagged "not modelled" but moves the result by ${entry.perPoint}`,
      ).toBe(0)
    }
  }

  // And the default character must still surface at least one genuinely unread stat, or the panel's
  // explanation is being rendered for an empty list.
  const furyWeights = calculateStatWeights(character, gear, 'Physical DPS')
  expect(furyWeights.entries.some((entry) => entry.notModeledYet)).toBe(true)
})

test('the rotation-coverage claim on the Simulation panel matches the ability data', () => {
  /*
   * The panel says two specs layer real special attacks and the rest run from a single signature
   * ability. That is a number in prose, which is the shape of claim this project keeps letting rot —
   * so it gets an assertion.
   */
  const multiAbility: string[] = []
  let singleAbility = 0

  for (const entry of tbcClasses) {
    for (const spec of entry.specs) {
      const count = getRotationAbilities(entry.className, spec).length
      expect(count, `${entry.className} ${spec} should have at least one rotational ability`).toBeGreaterThan(0)
      if (count > 1) multiAbility.push(`${entry.className} ${spec}`)
      else singleAbility += 1
    }
  }

  expect(multiAbility, 'exactly two specs have a real multi-ability rotation').toEqual(['Warrior Arms', 'Warrior Fury'])
  expect(singleAbility, 'and the other 25 are single-ability approximations').toBe(25)
})

test('the upgrade finder no longer claims most of the catalogue is estimated', () => {
  /*
   * It used to, and that was written when the catalogue held 230 hand-written items. It now holds
   * 4,554, overwhelmingly ingested — the claim had inverted without anyone touching it.
   *
   * `dataQuality` on every upgrade row is driven by `needsVerification`, so this is the same figure
   * the panel's prose quotes.
   */
  const flagged = allItems.filter((item) => item.needsVerification === true)
  const sourcedShare = (allItems.length - flagged.length) / allItems.length

  expect(allItems.length).toBeGreaterThan(4000)
  expect(sourcedShare, 'the catalogue is overwhelmingly sourced, and the panel says so').toBeGreaterThan(0.9)
  // Kept as a band rather than an exact number: it should move as data is verified, but a jump back
  // past 10% would mean the prose is wrong again.
  expect(flagged.length / allItems.length).toBeLessThan(0.1)
})

test('a saved build cannot bring back a different encounter target', async ({ page }) => {
  /*
   * The failure this pins was introduced by fixing the encounter and not following it through.
   * `target` was restored from the saved build, which outlived the controls that set it: a build
   * saved while the armor presets existed would come back carrying 3,500 armor, and the panel would
   * announce "one fixed target — level 73 with 3,500 armor" while telling the reader there was
   * nothing to configure. Two players would get different numbers for a reason neither could see.
   *
   * `buildSerialization` accepts any `{ level, armor }`, so this is reachable by importing a build
   * as well as by having saved one earlier — it is not only a migration concern.
   */
  await openApp(page)

  // Plant a build carrying a deliberately wrong target, exactly as an older save would look.
  await page.evaluate(() => {
    const raw = localStorage.getItem('project-defeat:build:v1')
    if (!raw) throw new Error('expected an autosaved build')
    const build = JSON.parse(raw)
    build.target = { id: 'stale', name: 'Stale caster target', level: 70, armor: 3500 }
    localStorage.setItem('project-defeat:build:v1', JSON.stringify(build))
  })

  await page.reload()
  await page.getByTestId('section-planner').click()
  await openSimulationTab(page)

  // The fixed target wins. 7,700 / 18,257.5 = 42.2%; the planted 3,500 would read 24.9%.
  await expect(page.getByTestId('encounter-armor-mitigation')).toHaveText('42.2%')
  await expect(page.getByText(/level 73/i).first()).toBeVisible()
  await expect(page.getByText(/3,500/)).toHaveCount(0)

  // And the estimate itself must run against the fixed boss, not the planted one.
  await page.getByRole('button', { name: /run simulation/i }).click()
  await expect(page.getByText(/vs\. a level 73 target/i)).toBeVisible()
})

test('every spec says what its own estimate misses, and none of them say the same thing', () => {
  /*
   * All 31 signature abilities carry researched prose about how far a single-ability approximation
   * sits from that spec's real rotation — that a Beast Mastery hunter's damage largely bypasses
   * Steady Shot, that Survival is brought for Expose Weakness rather than personal DPS. Every word of
   * it was written and **none of it reached the interface**, which is the same failure as the buffs
   * panel: real, sourced content wired to nothing.
   *
   * It matters most precisely where the estimate is weakest. 25 of 27 specs are single-ability
   * approximations, so for almost every spec this note *is* the honest part of the readout.
   */
  const races: Record<string, TbcRace> = {
    Warrior: 'Human',
    Paladin: 'Human',
    Hunter: 'Human',
    Rogue: 'Human',
    Priest: 'Human',
    Shaman: 'Draenei',
    Mage: 'Human',
    Warlock: 'Human',
    Druid: 'Night Elf',
  }

  const notes = new Set<string>()
  let specs = 0

  for (const entry of tbcClasses) {
    for (const spec of entry.specs) {
      specs += 1
      const character: CharacterProfile = { faction: 'Alliance', race: races[entry.className], className: entry.className, spec }
      const gear = normalizeGearForCharacter(defaultGear, entry.className, spec)
      const stats = calculateStats(character, gear)
      const result = calculateSimulation(character, gear, stats, getRoleForSpec(entry.className, spec))

      expect(result.specNote, `${entry.className} ${spec} must say what its estimate misses`).toBeTruthy()
      expect(result.specNote!.length, `${entry.className} ${spec}'s note must be a real explanation`).toBeGreaterThan(60)
      notes.add(result.specNote!)
    }
  }

  expect(specs).toBe(27)
  // Distinct per spec. A shared note would mean the caveat had become boilerplate, which is the
  // failure mode this whole area keeps falling into — a caveat nobody reads is a caveat nobody acts
  // on, and an identical one across 27 specs earns that.
  expect(notes.size, 'each spec needs its own caveat, not a shared one').toBe(27)
})

test('the spec caveat is rendered with the result, not just computed', async ({ page }) => {
  await openApp(page)
  await openSimulationTab(page)
  await page.getByRole('button', { name: /run simulation/i }).click()

  const note = page.getByTestId('simulation-spec-note')
  await expect(note).toBeVisible()
  await expect(note).toContainText('What this estimate misses for your spec')
  // The default character is a Fury Warrior, so the note has to be Fury's rather than a generic one.
  await expect(note).toContainText(/Bloodthirst/i)
})

test('the estimate names unmodelled talents you actually took, and stays quiet otherwise', () => {
  /*
   * `unmodelledTalents` existed for an hour with a test as its only consumer — the same failure this
   * session kept finding elsewhere: real, written content reaching no user. The ingest refuses nine
   * talent groups it cannot express and records a reason for each; this is the player-facing half of
   * that decision.
   *
   * The silence matters as much as the message. Warning someone about talents they do not have is
   * noise, and noise is how a caveat stops being read — which is exactly how the four stale
   * disclosures earlier today managed to sit there being false.
   */
  const character: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Warrior', spec: 'Fury' }
  const gear = normalizeGearForCharacter(defaultGear, 'Warrior', 'Fury')
  const stats = calculateStats(character, gear)
  const noteFor = (points: Record<number, number>) =>
    calculateSimulation(character, gear, stats, 'Physical DPS', [], undefined, points).unmodelledTalentNote

  expect(noteFor({}), 'nothing spent, nothing to warn about').toBeUndefined()

  // Talents the model DOES express must not produce a warning either.
  expect(noteFor(furyTalentPoints([['Cruelty', 5], ['Flurry', 5]])), 'modelled talents are not a gap').toBeUndefined()

  /*
   * And when an unmodelled one is taken it is named specifically. "Impale" rather than the grouped
   * label the ingest files it under ("Mace/Sword/Poleaxe Specialization"), because the player picked
   * a talent, not a category.
   */
  const note = noteFor(furyTalentPoints([['Cruelty', 5], ['Deep Wounds', 3], ['Impale', 2]]))
  expect(note).toBeTruthy()
  expect(note).toContain('Deep Wounds')
  expect(note).toContain('Impale')
  expect(note, 'talents that ARE modelled must not be listed as gaps').not.toContain('Cruelty')
  expect(note, 'and it should say which way the estimate is wrong').toMatch(/low by/i)
})

test('talent scaling covers both Warrior DPS specs, and the tank reads its own', () => {
  /*
   * The scope described stage 1 as "Fury Warrior". Arms gets it free, and that is worth pinning
   * rather than leaving as a happy accident: `deriveTalentModifiers` is keyed by **talent id**, and
   * `warriorTalents.json` carries all three trees, so any spec that shares the class shares the
   * effects. Nothing about the mechanism is Fury-specific.
   *
   * Protection used to be the honest gap, and this test asserted it received nothing at all. Since
   * 2026-08-19 `calculateTankSurvivability` takes talents too, so the assertion below flipped: a
   * *DPS* talent must still not move a tank score, which is the sharper claim. Toughness and Vitality
   * remain uncounted, but for a stated reason — they multiply armour and stamina, which
   * `calculateStats` owns — rather than because the path is blind.
   */
  const talents = getTalentData('Warrior')!
  const byName = new Map<string, number>()
  for (const tree of talents.trees) for (const talent of tree.talents) byName.set(talent.name, talent.id)

  const points: Record<number, number> = {}
  for (const [name, rank] of [
    ['Cruelty', 5],
    ['Precision', 3],
    ['Two-Handed Weapon Specialization', 5],
    ['Improved Berserker Stance', 5],
  ] as const) {
    const id = byName.get(name)
    if (id !== undefined) points[id] = rank
  }

  const scoreFor = (spec: TbcSpec, role: CharacterRole, talentPoints: Record<number, number>) => {
    const character: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Warrior', spec }
    const gear = normalizeGearForCharacter(defaultGear, 'Warrior', spec)
    const stats = calculateStats(character, gear)
    return calculateSimulation(character, gear, stats, role, [], undefined, talentPoints).scoreExact
  }

  for (const spec of ['Arms', 'Fury'] as const) {
    const bare = scoreFor(spec, 'Physical DPS', {})
    const talented = scoreFor(spec, 'Physical DPS', points)
    expect(talented, `${spec} must benefit from talents`).toBeGreaterThan(bare)
  }

  /*
   * The DPS points above are Cruelty, Flurry and the rage talents — none of which the survivability
   * table rolls. A tank scored with them must not move at all, which is what proves the fields are
   * routed by destination rather than summed into one number.
   */
  expect(
    scoreFor('Protection', 'Tank', points),
    'DPS talents must not move Effective Health — the tank reads its own fields',
  ).toBe(scoreFor('Protection', 'Tank', {}))

  // And the talents it *does* read must move it, or the line above passes for the wrong reason.
  const anticipation = talents.trees.flatMap((tree) => tree.talents).find((talent) => talent.name === 'Anticipation')!
  expect(
    scoreFor('Protection', 'Tank', { [anticipation.id]: 5 }),
    'Anticipation is Defense skill, which the tank table does roll',
  ).toBeGreaterThan(scoreFor('Protection', 'Tank', {}))
})

test('Rogue talents are ingested per class, and two classes can share a talent name safely', () => {
  /*
   * Stage 2. The ingest was Warrior-hardcoded; it is now class-parameterised, and Rogue is the first
   * class through it. Every Rogue value lands on a field Warrior already established, which was the
   * point — adding a class is adding extractors, not machinery.
   *
   * **Precision exists in both classes.** Different tree, different id, different max rank (Warrior 3,
   * Rogue 5). The ingest cross-checks each extracted name against that class's own tree, which is
   * what stops a name-based lookup resolving to the wrong talent — the classic trap this repo already
   * has a section about.
   */
  const warriorPrecision = getTalentData('Warrior')!.trees.flatMap((tree) => tree.talents).find((t) => t.name === 'Precision')!
  const roguePrecision = getTalentData('Rogue')!.trees.flatMap((tree) => tree.talents).find((t) => t.name === 'Precision')!
  expect(warriorPrecision.id).not.toBe(roguePrecision.id)
  expect(warriorPrecision.maxRank).toBe(3)
  expect(roguePrecision.maxRank).toBe(5)

  // Each resolves to its own effect, at its own max rank, rather than one shadowing the other.
  expect(deriveTalentModifiers({ [warriorPrecision.id]: 3 }).meleeHitChance).toBeCloseTo(0.03, 10)
  expect(deriveTalentModifiers({ [roguePrecision.id]: 5 }).meleeHitChance).toBeCloseTo(0.05, 10)

  const byName = new Map<string, number>()
  for (const tree of getTalentData('Rogue')!.trees) for (const talent of tree.talents) byName.set(talent.name, talent.id)
  const points: Record<number, number> = {}
  for (const [name, rank] of [['Malice', 5], ['Precision', 5], ['Deadliness', 5], ['Weapon Expertise', 2]] as const) {
    const id = byName.get(name)
    expect(id, `${name} must exist in the ingested Rogue tree`).toBeDefined()
    points[id!] = rank
  }

  const modifiers = deriveTalentModifiers(points)
  expect(modifiers.meleeCritChance, 'Malice is 1% crit per rank').toBeCloseTo(0.05, 10)
  expect(modifiers.attackPowerMultiplier, 'Deadliness is 2% attack power per rank').toBeCloseTo(1.1, 10)
  expect(modifiers.expertiseSkillPoints, 'Weapon Expertise is 5 expertise SKILL per rank').toBeCloseTo(10, 10)

  // All three Rogue specs benefit, because effects are keyed by talent id and the whole class tree is
  // ingested. That is the economics of stage 2: a class buys its specs.
  for (const spec of ['Assassination', 'Combat', 'Subtlety'] as const) {
    const character: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Rogue', spec }
    const gear = normalizeGearForCharacter(defaultGear, 'Rogue', spec)
    const stats = calculateStats(character, gear)
    const bare = calculateSimulation(character, gear, stats, 'Physical DPS', [], undefined, {})
    const talented = calculateSimulation(character, gear, stats, 'Physical DPS', [], undefined, points)

    expect(talented.scoreExact, `${spec} must benefit`).toBeGreaterThan(bare.scoreExact)

    // Expertise reaches the attack table as skill points: 10 points at 0.25% each is 2.5%, which more
    // than covers the 1.8% dodge a level 73 target has. Asserting the dodge row went to zero proves
    // it landed on the table rather than being counted as damage somewhere.
    const dodgeOf = (r: typeof bare) => r.breakdown.find((entry) => entry.label === 'Dodge chance')!.value
    expect(dodgeOf(bare)).toBeGreaterThan(0)
    expect(dodgeOf(talented), 'talent expertise must reach the attack table').toBe(0)
  }
})

test('every role says what talents do for it, and the tank message is not the DPS one', () => {
  /*
   * A Mage spending 45 points watched the estimate go 462.5 -> 462.5 with nothing to explain it.
   * All nine classes are ingested now, and the caster and healer paths receive them as of 2026-08-19
   * — so the remaining silence is the **tank** path, plus the per-spell caster talents no closed-form
   * model can express. Each gets its own sentence, and the point of this test is that they stay
   * different: the tank message must never be the DPS one, because listing only the skipped talents
   * would imply the rest are counted.
   *
   * The tank case is the one worth pinning hardest, because the first version of this got it wrong in
   * the confident direction: it gave Protection the DPS message, which names only the *skipped*
   * talents and so implies Toughness, Vitality and the rest are counted. They are not — the tank path
   * receives none. A caveat that is wrong is worse than no caveat, which is the lesson this file has
   * now recorded six times.
   */
  const spendFirstTree = (className: string) => {
    const data = getTalentData(className)!
    const points: Record<number, number> = {}
    let spent = 0
    for (const talent of data.trees[0].talents) {
      if (spent >= TALENT_POINTS_AT_70) break
      points[talent.id] = talent.maxRank
      spent += talent.maxRank
    }
    return points
  }

  const noteFor = (className: TbcClass, spec: TbcSpec, role: CharacterRole, points: Record<number, number>) => {
    const character: CharacterProfile = { faction: 'Alliance', race: 'Human', className, spec }
    const gear = normalizeGearForCharacter(defaultGear, className, spec)
    const stats = calculateStats(character, gear)
    return calculateSimulation(character, gear, stats, role, [], undefined, points).unmodelledTalentNote
  }

  /*
   * A Mage used to get the "no ingested effects for this class" message. That branch is now
   * unreachable — all nine classes are ingested — so the Mage falls through to the per-build note,
   * which names the talents it *took* that still reach nothing. That is a strictly better message and
   * a strictly harder one to keep true, which is why it is asserted by content rather than by shape.
   */
  const mage = noteFor('Mage', 'Fire', 'Caster DPS', spendFirstTree('Mage'))
  expect(mage, 'a Mage spending points must still be told what does not reach the estimate').toBeTruthy()
  expect(mage, 'the dead "no effects for this class" branch must not fire').not.toMatch(/only ingested for/i)
  expect(mage).toMatch(/spent but not modelled/i)

  // The tank gets its own message, naming the real reason.
  /*
   * The tank message now names what it *does* read and what it does not, rather than claiming it
   * reads nothing. The "must not be the DPS message" half is unchanged and is the point of the test:
   * the generic note says the listed talents are "spent but not modelled", which implies everything
   * unlisted is counted — and for a tank the unlisted set includes Toughness and Vitality, the two
   * biggest survivability talents in the tree.
   */
  const tank = noteFor('Warrior', 'Protection', 'Tank', spendFirstTree('Warrior'))
  expect(tank).toBeTruthy()
  expect(tank, 'the tank message must name the avoidance talents it reads').toMatch(/Anticipation/i)
  expect(tank, 'and name the two it does not, with the reason').toMatch(/Toughness and Vitality are not counted/i)
  expect(tank, 'and must NOT imply the unlisted ones are counted').not.toMatch(/spent but not modelled/i)

  // Paladin's Shield Specialization raises block value, which is unmodelled — so it must not be named.
  const paladinTank = noteFor('Paladin', 'Protection', 'Tank', spendFirstTree('Paladin'))
  expect(paladinTank, "a Paladin must not be told Shield Specialization is read").not.toMatch(/Shield Specialization/i)

  // Silence when there is nothing to say, which is what keeps the others readable.
  expect(noteFor('Mage', 'Fire', 'Caster DPS', {}), 'no points, no note').toBeUndefined()
  expect(noteFor('Warrior', 'Protection', 'Tank', {}), 'no points, no note').toBeUndefined()
})

test('Hunter and Shaman talents land, and a shared talent name does not cross classes', () => {
  /*
   * Two classes now share a talent NAME with Warrior while doing something completely different:
   * Shaman's Weapon Mastery is physical damage where Warrior's reduces the target's dodge, and its
   * Dual Wield Specialization is hit where Warrior's raises off-hand damage.
   *
   * Keying effects by class-checked talent id rather than by name is what stops one silently becoming
   * the other. A stronger test of that than Rogue's Precision was — there the effect at least
   * matched, so a mix-up would have been invisible.
   */
  const idOf = (className: string, name: string) =>
    getTalentData(className)!.trees.flatMap((tree) => tree.talents).find((talent) => talent.name === name)!.id

  const warriorWeaponMastery = idOf('Warrior', 'Weapon Mastery')
  const shamanWeaponMastery = idOf('Shaman', 'Weapon Mastery')
  expect(warriorWeaponMastery).not.toBe(shamanWeaponMastery)

  // Warrior's reduces dodge and leaves damage alone; Shaman's does the exact opposite.
  const warriorSide = deriveTalentModifiers({ [warriorWeaponMastery]: 2 })
  expect(warriorSide.targetDodgeReduction).toBeCloseTo(0.02, 10)
  expect(warriorSide.physicalDamageMultiplier, "Warrior's must not grant damage").toBe(1)

  const shamanSide = deriveTalentModifiers({ [shamanWeaponMastery]: 5 })
  expect(shamanSide.physicalDamageMultiplier).toBeCloseTo(1.1, 10)
  expect(shamanSide.targetDodgeReduction, "Shaman's must not reduce dodge").toBe(0)

  // Same again for Dual Wield Specialization, which differs just as sharply.
  const warriorDw = deriveTalentModifiers({ [idOf('Warrior', 'Dual Wield Specialization')]: 5 })
  const shamanDw = deriveTalentModifiers({ [idOf('Shaman', 'Dual Wield Specialization')]: 3 })
  expect(warriorDw.offHandDamageMultiplier).toBeCloseTo(1.25, 10)
  expect(warriorDw.meleeHitChance).toBe(0)
  expect(shamanDw.meleeHitChance).toBeCloseTo(0.06, 10)
  expect(shamanDw.offHandDamageMultiplier).toBe(1)

  /*
   * Hunter is the only class whose specs all run the ranged branch, so its effects land on ranged
   * fields. Serpent's Swiftness is the largest single talent in the model at +4% ranged attack speed
   * per rank.
   */
  const hunterPoints = {
    [idOf('Hunter', 'Lethal Shots')]: 5,
    [idOf('Hunter', "Serpent's Swiftness")]: 5,
    [idOf('Hunter', 'Ranged Weapon Specialization')]: 5,
  }
  const hunter = deriveTalentModifiers(hunterPoints)
  expect(hunter.rangedCritChance).toBeCloseTo(0.05, 10)
  expect(hunter.rangedAttackSpeedMultiplier).toBeCloseTo(1.2, 10)
  expect(hunter.rangedDamageMultiplier).toBeCloseTo(1.05, 10)
  // Ranged crit must NOT leak into the melee figure, or a melee spec would inherit a hunter talent.
  expect(hunter.meleeCritChance).toBe(0)

  const shamanPoints = { [shamanWeaponMastery]: 5, [idOf('Shaman', 'Thundering Strikes')]: 5 }
  const cases: readonly (readonly [TbcClass, TbcSpec, TbcRace, Record<number, number>])[] = [
    ['Hunter', 'Beast Mastery', 'Human', hunterPoints],
    ['Hunter', 'Marksmanship', 'Human', hunterPoints],
    ['Shaman', 'Enhancement', 'Draenei', shamanPoints],
  ]
  for (const [className, spec, race, points] of cases) {
    const character: CharacterProfile = { faction: 'Alliance', race, className, spec }
    const gear = normalizeGearForCharacter(defaultGear, className, spec)
    const stats = calculateStats(character, gear)
    const bare = calculateSimulation(character, gear, stats, 'Physical DPS', [], undefined, {})
    const talented = calculateSimulation(character, gear, stats, 'Physical DPS', [], undefined, points)
    expect(talented.scoreExact, `${className} ${spec} must benefit from talents`).toBeGreaterThan(bare.scoreExact)
  }
})

test('every Physical DPS spec has talent effects, and three classes share a talent name', () => {
  /*
   * The milestone this pass was aiming at: talent scaling reaches every spec that *can* receive it.
   * All 11 Physical DPS specs are covered — Warrior Arms and Fury, all three Rogue, all three Hunter,
   * Shaman Enhancement, Druid Feral, Paladin Retribution.
   *
   * The other 16 specs are uncovered, and that is a *different* gap: those paths take no talent
   * argument at all, so ingesting their effects would produce data reaching nothing — the failure
   * this session kept finding. The estimate tells those players so directly.
   *
   * That figure is asserted rather than written down because it was wrong in prose for a while: this
   * comment, HANDOFF.md and featureFlags.ts all said "7 caster and 2 healer", which is 9 specs
   * against the real 16. Counting from `getRoleForSpec` is the only method that cannot drift.
   */
  const physical: string[] = []
  const uncoveredPhysical: string[] = []
  const byRole = new Map<string, number>()

  for (const entry of tbcClasses) {
    for (const spec of entry.specs) {
      const role = getRoleForSpec(entry.className, spec)
      byRole.set(role, (byRole.get(role) ?? 0) + 1)
      if (role !== 'Physical DPS') continue
      physical.push(`${entry.className} ${spec}`)
      if (!classHasTalentEffects(entry.className)) uncoveredPhysical.push(`${entry.className} ${spec}`)
    }
  }

  expect(physical).toHaveLength(11)
  expect(uncoveredPhysical, 'every Physical DPS spec must have ingested talent effects').toEqual([])

  // The split featureFlags.ts quotes: 11 covered, and 16 that cannot be until their paths take talents.
  expect(Object.fromEntries([...byRole].sort()), 'the role split featureFlags.ts quotes').toEqual({
    'Caster DPS': 9,
    Healer: 5,
    'Physical DPS': 11,
    Tank: 2,
  })

  /*
   * Three classes now have a talent called Precision — Warrior, Rogue and Paladin. Same effect in all
   * three, but different ids and different rank caps, so a name-keyed lookup would silently give a
   * Paladin the Rogue's five ranks. Effects are keyed by id, and each extractor is cross-checked
   * against its own class's tree.
   */
  const precisionIds = (['Warrior', 'Rogue', 'Paladin'] as const).map((className) => {
    const talent = getTalentData(className)!.trees.flatMap((tree) => tree.talents).find((t) => t.name === 'Precision')!
    return { className, id: talent.id, maxRank: talent.maxRank }
  })
  expect(new Set(precisionIds.map((entry) => entry.id)).size, 'three distinct talents').toBe(3)
  expect(precisionIds.find((e) => e.className === 'Rogue')!.maxRank).toBe(5)
  expect(precisionIds.find((e) => e.className === 'Paladin')!.maxRank).toBe(3)

  // Each resolves to hit at its own cap, rather than one shadowing the others.
  for (const { id, maxRank } of precisionIds) {
    expect(deriveTalentModifiers({ [id]: maxRank }).meleeHitChance).toBeCloseTo(0.01 * maxRank, 10)
  }

  // Druid's Predatory Strikes is flat attack power, folded to level 70 from upstream's level scaling.
  const predatory = getTalentData('Druid')!.trees.flatMap((t) => t.talents).find((t) => t.name === 'Predatory Strikes')!
  expect(deriveTalentModifiers({ [predatory.id]: 3 }).flatAttackPower).toBeCloseTo(105, 10)
})

test('every buff names a provider that actually exists, class and spec alike', () => {
  /*
   * The invariant the raid-composition planner rests on. `providedByClass` and `providedBySpec`
   * replaced a display string precisely so a roster can be matched against them exactly — and the
   * failure mode of getting one wrong is silent: the buff is simply never credited, the planner
   * under-reports coverage, and a raid leader goes recruiting for a slot they already filled.
   *
   * A spec that is not one of *that class's* specs is the sharp case. "Restoration" is a real spec
   * name and a real Shaman spec, but a Warlock entry naming it would match nothing for ever.
   */
  const entries = [...sampleBuffs, ...sampleTargetDebuffs]
  expect(entries).toHaveLength(39)

  for (const entry of entries) {
    const definition = tbcClasses.find((candidate) => candidate.className === entry.providedByClass)
    expect(definition, `${entry.name} names class "${entry.providedByClass}", which does not exist`).toBeDefined()
    if (entry.providedBySpec) {
      expect(
        definition!.specs as readonly string[],
        `${entry.name} names ${entry.providedBySpec}, which is not a ${entry.providedByClass} spec`,
      ).toContain(entry.providedBySpec)
    }
  }

  // Seven are spec-specific and the rest are class-wide; a drift either way changes who covers what.
  expect(entries.filter((entry) => entry.providedBySpec !== undefined)).toHaveLength(7)
})

test('raid coverage is exact, and an empty roster covers nothing', () => {
  /*
   * The two ends of the range, because the middle is where an off-by-one hides. An empty roster
   * covering anything would mean a provider matched a seat that does not exist; a full-coverage
   * roster missing something would mean a buff no spec in the game can bring.
   */
  const empty = computeCoverage({ size: 25, slots: [] })
  expect(empty.buffs.covered, 'nobody in the raid, nothing covered').toEqual([])
  expect(empty.buffs.missing).toHaveLength(sampleBuffs.length)
  expect(empty.debuffs.missing).toHaveLength(sampleTargetDebuffs.length)
  expect(empty.remaining).toBe(25)

  /*
   * One of every spec covers everything. If this ever fails, a buff has been given a provider no
   * player can be — which is exactly what a typo in `providedBySpec` produces.
   */
  const oneOfEach = tbcClasses.flatMap((definition) =>
    definition.specs.map((spec) => ({ className: definition.className, spec })),
  )
  const total = computeCoverage({ size: 25, slots: oneOfEach })
  expect(total.buffs.missing, 'every buff must be reachable by some spec').toEqual([])
  expect(total.debuffs.missing, 'and every debuff too').toEqual([])
  expect(total.suggestions, 'nothing left to suggest once everything is covered').toEqual([])
  // 27 specs against 25 seats is deliberately over-filled, and the report says so rather than clamping.
  expect(total.remaining).toBe(-2)
})

test('a missing buff names who would bring it, at the right specificity', () => {
  /*
   * The difference that decides a recruitment message. Any Shaman brings Strength of Earth; only an
   * Elemental one brings Totem of Wrath. Collapsing those to "a Shaman" would send a raid leader
   * looking for the wrong player.
   */
  const noShamans = tbcClasses
    .filter((definition) => definition.className !== 'Shaman')
    .flatMap((definition) => definition.specs.map((spec) => ({ className: definition.className, spec })))

  const report = computeCoverage({ size: 25, slots: noShamans })
  const needFor = (name: string) => report.buffs.missing.find((entry) => entry.entry.name === name)?.needs

  expect(needFor('Strength of Earth Totem'), 'class-wide reads "any"').toBe('any Shaman')
  expect(needFor('Totem of Wrath'), 'spec-specific names the spec').toBe('an Elemental Shaman')
  expect(needFor('Mana Tide Totem')).toBe('a Restoration Shaman')

  /*
   * And the suggestions distinguish the three Shaman specs by what only they bring. They each add
   * the same seven class totems, so a raw list truncates to an identical prefix — the spec-specific
   * entry is sorted first precisely so the rows read as three different choices.
   */
  const shamanSuggestions = report.suggestions.filter((entry) => entry.className === 'Shaman')
  expect(shamanSuggestions).toHaveLength(3)
  expect(shamanSuggestions.map((entry) => entry.wouldAdd[0]).sort()).toEqual([
    'Mana Tide Totem',
    'Totem of Wrath',
    'Unleashed Rage',
  ])
  for (const suggestion of shamanSuggestions) expect(suggestion.anySpec, 'these are not interchangeable').toBe(false)
})

test('interchangeable specs collapse into one suggestion', () => {
  /*
   * All nine Paladin buffs are class-wide, so Holy, Protection and Retribution add exactly the same
   * set. Listed separately that is three consecutive rows saying one thing — noise dressed as
   * choice. Collapsed, it says what a raid leader needs: find a Paladin.
   */
  const report = computeCoverage({ size: 25, slots: [] })
  const paladin = report.suggestions.filter((entry) => entry.className === 'Paladin')

  expect(paladin, 'one row, not three').toHaveLength(1)
  expect(paladin[0].anySpec).toBe(true)
  expect(paladin[0].specs).toHaveLength(3)
  expect(describeSuggestion(paladin[0])).toBe('Any Paladin')

  // Shaman must NOT collapse, or the distinction the test above relies on has been flattened away.
  expect(report.suggestions.filter((entry) => entry.className === 'Shaman').length).toBeGreaterThan(1)
})

test('the raid composition planner is reachable and recomputes as seats are added', async ({ page }) => {
  // Straight into the section: this one needs no character, which is the point of it being its own
  // section rather than a planner panel.
  await openApp(page, 'raidcomp')

  await expect(page.getByTestId('raidcomp-panel')).toBeVisible()
  await expect(page.getByTestId('raidcomp-buffs-count')).toHaveText('0 / 33')
  await expect(page.getByTestId('raidcomp-debuffs-count')).toHaveText('0 / 6')
  await expect(page.getByTestId('raidcomp-filled')).toContainText('0 of 25')

  /*
   * One Paladin covers eight buffs and one debuff — the arithmetic, not merely "went up". The split
   * is worth asserting separately: the suggestion list totals buffs and debuffs together, so a single
   * Paladin shows as "+9" there, and reading that as nine *buffs* is a mistake this test exists to
   * stop anyone repeating.
   */
  await page.getByTestId('raidcomp-add-paladin-holy').click()
  await expect(page.getByTestId('raidcomp-buffs-count')).toHaveText('8 / 33')
  await expect(page.getByTestId('raidcomp-debuffs-count')).toHaveText('1 / 6')
  await expect(page.getByTestId('raidcomp-filled')).toContainText('1 of 25')

  // Size is a real control: the same roster against 10 seats leaves nine open, not twenty-four.
  await page.getByTestId('raidcomp-size-10').click()
  await expect(page.getByTestId('raidcomp-filled')).toContainText('1 of 10')

  // And removing it returns the panel to empty rather than to some other state.
  await page.getByRole('button', { name: 'Remove Holy Paladin' }).click()
  await expect(page.getByTestId('raidcomp-buffs-count')).toHaveText('0 / 33')
})
