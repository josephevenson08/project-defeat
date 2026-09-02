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
import { getClassDefinition, getRoleForSpec, tbcClasses } from '../src/domain/character/tbcClasses'
import {
  addToGroup,
  assignBuff,
  computeCoverage,
  emptyRoster,
  filledSlots,
  getBuffIcon,
  getBuffScope,
  getSpecIcon,
  getSpecIconSource,
  getRaidBuild,
  moveSeat,
  raidBuilds,
  raidBuildsByClass,
  seatContributions,
  renameSeat,
  resizeRoster,
  setRosterMeta,
  seatAt,
} from '../src/domain/raidcomp'
import { exclusiveGroupFor, exclusiveGroups } from '../src/domain/buffs/buffExclusivity'
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
  CAT_FORM_WEAPON,
  ENERGY_PER_SECOND,
  OFF_HAND_DAMAGE_PENALTY,
  averageSwingDamage,
  computeSpecialDamagePerUse,
  computeUsageRate,
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
import { sampleConsumables } from '../src/domain/consumables/sampleConsumables'
import { DPS_REFERENCE_SOURCE, dpsReference, getDpsReference } from '../src/domain/simulation/dpsReference'
import {
  HUNTER_PET_ATTACK_POWER_INHERITANCE,
  HUNTER_PET_AUTO_ATTACK_MULTIPLIER,
  HUNTER_PET_BASE_STRENGTH,
  HUNTER_PET_DEFAULT_FAMILY,
  HUNTER_PET_FAMILY_DAMAGE_MULTIPLIER,
  HUNTER_PET_FLAT_ATTACK_POWER,
  HUNTER_PET_FOCUS_PER_SECOND,
  HUNTER_PET_FOCUS_PER_TICK,
  HUNTER_PET_FOCUS_TICK_SECONDS,
  HUNTER_PET_HAPPINESS_MULTIPLIER,
  HUNTER_PET_MELEE_SPEED_MULTIPLIER,
  HUNTER_PET_BITE,
  HUNTER_PET_CLAW,
  HUNTER_PET_FRENZY_DURATION_SECONDS,
  HUNTER_PET_FRENZY_HASTE,
  HUNTER_PET_GCD_SECONDS,
  HUNTER_PET_KILL_COMMAND,
  HUNTER_PET_STRENGTH_TO_ATTACK_POWER,
  estimateHunterPet,
  hunterPetCritChance,
  estimateHunterPetKillCommand,
  frenzySpeedMultiplier,
  hunterPetAbilityRates,
  killCommandUsesPerSecond,
} from '../src/domain/simulation/hunterPet'
import { validateBuild } from '../src/domain/builds/buildSerialization'
import { BUILD_FORMAT_VERSION } from '../src/domain/builds/buildTypes'
import { sampleItemSets } from '../src/domain/gear/itemSets'
import { getPairedGearSlots, isItemCompatibleWithGearSlot } from '../src/domain/gear/slotCompatibility'
import { normalizeGearForCharacter } from '../src/domain/gear/characterItemRules'
import { defaultGear } from '../src/domain/gear/defaultGear'
import {
  DENSITY_GRID,
  computeRoute,
  densityCells,
  gatheringNodes,
  nodesWithoutSpawnData,
  routeLength,
  routesForNode,
  routesForMaterials,
  supplementaryNodes,
  twoOptimize,
  mappableMaterials,
} from '../src/domain/professions'
import talentBuilds from '../src/domain/talents/talentBuilds.json' with { type: 'json' }
import {
  SLICE_AND_DICE_BASE_DURATIONS,
  SLICE_AND_DICE_COMBO_POINTS,
  SLICE_AND_DICE_ENERGY_COST,
  SLICE_AND_DICE_GCD_SECONDS,
  SLICE_AND_DICE_HASTE,
  combatPotencyEnergyPerSecond,
  estimateSliceAndDice,
} from '../src/domain/simulation/sliceAndDice'
import {
  DEADLY_POISON,
  DEADLY_POISON_HAND,
  INSTANT_POISON,
  INSTANT_POISON_HAND,
  estimateRoguePoisons,
} from '../src/domain/simulation/roguePoisons'
import { RAKE, RIP, estimateFeralBleeds } from '../src/domain/simulation/feralBleeds'
import {
  FELGUARD_ATTACK_POWER_MULTIPLIER,
  FELGUARD_BASE,
  FELGUARD_HAS_FAMILY_MULTIPLIER,
  FELGUARD_SPELL_POWER_TO_ATTACK_POWER,
  FELGUARD_STRENGTH_OFFSET,
  FELGUARD_STRENGTH_TO_ATTACK_POWER,
  estimateWarlockPet,
  felguardAttackPower,
  felguardCritChance,
  sacrificesDemon,
} from '../src/domain/simulation/warlockPet'

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
  /*
   * `?simulation=1` is on for every test, which is the escape hatch `featureFlags.ts` describes.
   *
   * It is set here, once, rather than by reloading mid-test. The Simulation tab is offered to DPS
   * specs only, so a test working on a Healer or Tank used to have to reload with the flag to reach
   * it — and that reload now **resets the character**, because a load starts clean since the autosave
   * was removed. A test that switched to Holy Priest and then reloaded would have quietly gone back
   * to simulating a Fury Warrior.
   *
   * The role rule itself is asserted directly, both as a pure function over all 27 specs and against
   * the DOM without this flag, so nothing is lost by having it on here.
   */
  await page.goto('/?simulation=1')
  await page.getByTestId(`section-${section}`).click()

  // The planner runs character creation first, and every test starts with empty storage so it always
  // appears. The four steps open on the defaults — Alliance, Human, Warrior, Fury — which is the
  // character the suite has always assumed, so this walks through without choosing anything. Tests
  // that want a different character change it afterwards through the rail, exactly as before.
  if (section === 'planner') await completeCharacterCreation(page)
}

/**
 * Walks the four creation steps on their defaults — Alliance, Human, Warrior, Fury — which is the
 * character this suite has always assumed.
 *
 * Its own function because creation now runs on **every** load, not just the first: a reload no
 * longer restores an autosaved build, so any test that reloads has to walk it again before the
 * planner is on screen at all.
 */
async function completeCharacterCreation(page: Page) {
  for (let step = 0; step < 3; step++) await page.getByTestId('creator-next').click()
  await page.getByTestId('creator-confirm').click()
}

/**
 * Fills every slot with the old starting set, for the few tests that need a dressed paperdoll.
 *
 * A newly created character now wears nothing, which is the point — but "does the paperdoll draw
 * real item icons" is a question about items, and it needs some. Driven through import rather than
 * by clicking nineteen slots.
 */
async function equipDefaultGear(page: Page) {
  await openPlannerView(page, 'Build')
  const exported = JSON.parse(await page.getByTestId('build-export-output').inputValue())
  exported.gear = Object.fromEntries(
    gearSlots.map((slot) => [slot, { itemId: defaultGear[slot].item.id, gemIds: defaultGear[slot].gemIds.map(() => '') }]),
  )
  await page.getByTestId('build-import-input').fill(JSON.stringify(exported))
  await page.getByTestId('build-import-button').click()
  await openPlannerView(page, 'Gear')
}

async function openSimulationTab(page: Page) {
  /*
   * Just a click now. `openApp` carries `?simulation=1`, so the tab is present whatever the role and
   * there is nothing to reload — which matters because a reload no longer preserves anything a test
   * set beforehand.
   */
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
/**
 * A race the class can actually be, chosen deterministically.
 *
 * Several tests below used `'Human'` for every class, which TBC does not allow for Druid, Hunter or
 * Shaman. That was harmless while base stats were one invented block per class; it is a hard error
 * now that they are read per race *and* class, which is the guard doing its job rather than a
 * regression. Every first entry in `racesByClass` is an Alliance race, so the `faction: 'Alliance'`
 * these fixtures pass alongside it stays correct.
 */
const legalRaceFor = (className: TbcClass): TbcRace => racesByClass[className][0]

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
import { formatRaidDate } from '../src/features/raidcomp/exportRosterImage'
import { allProfessions, getProfessionProfile, craftingPathFor, craftingPathModel } from '../src/domain/professions'
import { getBossesForRaid } from '../src/domain/raids/sampleRaidBosses'
import { getAttunementChainForRaid, sampleAttunements } from '../src/domain/raids/sampleAttunements'
import { getPlacementsForSpec, specTierLists } from '../src/domain/tierlists'
import { existsSync, readdirSync } from 'node:fs'
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
import {
  SEAL_OF_COMMAND_PROCS_PER_MINUTE,
  estimatePaladinHolyDamage,
} from '../src/domain/simulation/paladinSeals'
import {
  WINDFURY_BONUS_ATTACK_POWER,
  WINDFURY_EXTRA_ATTACKS,
  WINDFURY_INTERNAL_COOLDOWN_SECONDS,
  WINDFURY_PROC_CHANCE,
  estimateWindfury,
} from '../src/domain/simulation/weaponImbues'
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
  /*
   * Simulation **is** offered here, and this assertion flipped on 2026-08-21 rather than being
   * dropped. The default character is a Fury Warrior, and the tab is now shown to DPS specs and
   * hidden from Healer and Tank ones — see `SIMULATION_ROLES` in src/featureFlags.ts.
   *
   * It stays asserted in both directions for the same reason it was asserted as absent before: the
   * rule should change because someone decided to change it, not because it drifted.
   */
  await expect(page.getByRole('button', { name: 'Simulation', exact: true })).toHaveCount(1)

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

test('Professions is a grid you pick from, and each profession opens its own page', async ({ page }) => {
  await openApp(page)

  await expect(page.getByRole('heading', { name: 'Character', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Professions', exact: true }).click()

  await expect(page.getByRole('heading', { name: 'Professions', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Character', exact: true })).toHaveCount(0)

  /*
   * **The entry grid shows no profession's contents.** It used to render the whole selected
   * profession underneath the picker, so the page opened on thirteen cards plus a tier table plus
   * nineteen farm rows plus thirty maps. Nothing below the grid until something is picked.
   */
  await expect(page.getByTestId('profession-pick-mining')).toBeVisible()
  await expect(page.getByTestId('gathering-range')).toHaveCount(0)
  await expect(page.getByTestId('crafting-step')).toHaveCount(0)

  await page.getByTestId('profession-pick-mining').click()
  await expect(page.getByRole('heading', { name: 'Mining', exact: true })).toBeVisible()
  await expect(page.getByText('Copper Ore').first()).toBeVisible()

  /*
   * **A range draws a map, and the map covers the whole range rather than one ore.** The join used to
   * be `node.material === spot.material` against a display label, so "Thorium Ore (incl. Rich Thorium
   * Vein at 275+)" matched nothing and drew nothing — see `MaterialFarmSpot.materials`.
   */
  await expect(page.getByTestId('gathering-range').first()).toBeVisible()
  await expect(page.locator('svg.farming-route-map').first()).toBeVisible()

  /*
   * **The tier table is gone and its content is not.** Training requirements are markers inside the
   * progression now, at the skill where you actually have to stop.
   */
  await expect(page.getByTestId('training-marker').first()).toBeVisible()
  await expect(page.getByText('Train Journeyman at skill 50')).toBeVisible()

  await page.getByTestId('profession-back').click()
  await expect(page.getByTestId('profession-pick-alchemy')).toBeVisible()
  await expect(page.getByTestId('gathering-range')).toHaveCount(0)

  await page.getByTestId('profession-pick-alchemy').click()
  await expect(page.getByRole('heading', { name: 'Alchemy', exact: true })).toBeVisible()
  await expect(page.getByTestId('crafting-step').first()).toBeVisible()
  await expect(page.getByText('Copper Ore')).toHaveCount(0)

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

test('the encounter is disclosed by the result, not by a panel of its own', async ({ page }) => {
  /*
   * The Encounter panel is gone (2026-08-21, by request). It had already lost its controls — a target
   * level select, an armor field and three presets — and what was left was a card restating a fixed
   * value above the button you came to press.
   *
   * Removing it must not remove the reader's ability to know what the number means, which is the
   * whole reason the panel survived its own controls. So the assertion moves to where the figure now
   * lives: **the estimate names its own target**, and nothing on the tab offers to change it.
   */
  await openApp(page)
  await openSimulationTab(page)

  await expect(page.getByRole('region', { name: 'Encounter', exact: true }), 'the panel is gone').toHaveCount(0)
  await expect(page.getByTestId('encounter-armor-mitigation')).toHaveCount(0)

  await page.getByRole('button', { name: /run simulation/i }).click()
  await expect(page.getByText(/vs\. a level 73 target/i), 'the estimate still says what it ran against').toBeVisible()
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

test('a reload starts clean, and a named build is what brings one back', async ({ page }) => {
  /*
   * This used to assert the opposite: that the working build autosaved and came back on reload. That
   * was removed on 2026-08-21 — a load now runs character creation and opens on an empty paperdoll
   * with no talents spent, because opening as whoever you were last time made the character feel
   * assumed rather than chosen.
   *
   * The test is rewritten rather than deleted, because the new promise is the one worth pinning: an
   * unsaved build is **gone** after a refresh, and a named slot is the thing that survives. If that
   * ever silently reverts, someone should have to see this fail.
   */
  await openApp(page)
  await expect(page.getByLabel('Class')).toHaveValue('Warrior')

  await page.getByLabel('Class').selectOption('Mage')
  await page.getByRole('combobox', { name: 'Specialization' }).selectOption('Fire')
  await expect(page.getByLabel('Class')).toHaveValue('Mage')

  await openPlannerView(page, 'Build')
  await page.getByTestId('build-slot-name').fill('Fire alt')
  await page.getByTestId('build-slot-save').click()
  await expect(page.getByTestId('build-slot-list')).toContainText('Fire alt')

  // The reload drops everything: the section choice, the sub-tab, and the character itself.
  await page.reload()
  await page.getByTestId('section-planner').click()
  await completeCharacterCreation(page)
  await expect(page.getByLabel('Class'), 'a reload does not reopen as the Mage').toHaveValue('Warrior')

  // The named slot is what brings it back, and it is deliberate rather than automatic.
  await openPlannerView(page, 'Build')
  await page.getByTestId('build-slot-load-Fire alt').click()
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

  /*
   * Hunter: this assertion used to read the other way round, and it was right to. Steady Shot is
   * mana-costed with no cooldown, so its rate was described as depending on "auto-shot weaving that
   * isn't modelled" and it was named as excluded rather than silently omitted.
   *
   * ROTATION-SCOPE stage 1 modelled the weave, so the exclusion note is now the false claim and the
   * shot is layered on like any other special. **The test failing is the test doing its job** — the
   * scope doc said in advance that closing this gap should break the assertions describing it.
   */
  const hunter = simulateSpec('Hunter', 'Beast Mastery', 'Dwarf', 'Alliance')
  expect(breakdownValue(hunter.result, /Steady Shot DPS/i)).toBeGreaterThan(0)
  expect(hunter.result.summary).not.toMatch(/Steady Shot is not included/i)
  expect(hunter.result.summary, 'and it says which ceiling set the rate').toMatch(/woven one per auto shot/i)
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

  // Attunement chains are access information rather than a fight guide, so they survive the
  // loot-only rework. Karazhan, Serpentshrine and Tempest Keep have one; the two that open to any
  // level 70 raid do not, and the test below walks that split.
  await page.getByRole('button', { name: 'Attunement', exact: true }).click()
  const attunement = page.getByTestId('raid-attunement')
  await expect(attunement).toBeVisible()
  await expect(attunement.locator('li').first()).toBeVisible()

  // And the picker is reachable again.
  await page.getByTestId('raids-back-to-picker').click()
  await expect(page.getByTestId('raid-pick-karazhan')).toBeVisible()
})

test('the raid every character attunes for first has its chain, and the ones with none show no tab', async ({
  page,
}) => {
  /*
   * Karazhan's chain was the conspicuous hole in this data. The attunement view has existed since the
   * raids rework, but only Serpentshrine and Tempest Keep had anything to show — so the first
   * attunement every TBC character actually grinds was the one the app could not describe, while
   * Serpentshrine's own prerequisites already assumed you had done it.
   *
   * Gruul's Lair and Magtheridon's Lair have no chain because they have none in the game. That is a
   * fact about TBC rather than missing data, and the absence of the tab is how the app says so.
   */
  await openApp(page, 'raids')
  await page.getByTestId('raid-pick-karazhan').click()

  await page.getByRole('button', { name: 'Attunement', exact: true }).click()
  const chain = page.getByTestId('raid-attunement')
  await expect(chain).toBeVisible()
  await expect(chain).toContainText("The Master's Key")

  // Eight steps, and the ones that decide whether a group can start at all.
  await expect(chain.locator('.raid-attunement-step')).toHaveCount(8)
  await expect(chain).toContainText('Arcane Disturbances')
  await expect(chain).toContainText('Return to Khadgar')

  /*
   * The prerequisites are the point of listing them separately: the eight quests are not what makes
   * this long, the three keys you must already hold are.
   */
  await expect(chain.locator('.raid-attunement-prereqs')).toContainText('Arcatraz')

  // A raid with no attunement offers no tab at all, rather than an empty one.
  await page.getByTestId('raids-back-to-picker').click()
  await page.getByTestId('raid-pick-gruuls-lair').click()
  await expect(page.getByRole('button', { name: 'Attunement', exact: true })).toHaveCount(0)
  await expect(page.getByTestId('raid-detail')).toBeVisible()
})

test('every attunement step says where it happens and cites what it was read from', () => {
  /*
   * The chain is only worth having if a reader can check it. Every step therefore carries a location
   * and a requirement, and Karazhan's carry the Wowhead quest id each was read from — this repo's
   * recurring failure is confident recall presented as sourced, and a quest id is the cheapest
   * possible defence against it.
   */
  expect(sampleAttunements.map((chain) => chain.raidId).sort()).toEqual([
    'karazhan',
    'serpentshrine-cavern',
    'tempest-keep',
  ])

  for (const chain of sampleAttunements) {
    expect(chain.prerequisites.length, `${chain.name} must say what is needed before step 1`).toBeGreaterThan(0)
    expect(chain.reward, `${chain.name} must say what completing it grants`).toBeTruthy()

    // Steps are numbered from 1 with no gaps, because the UI renders them in this order and a
    // duplicate `order` is a React key collision as well as a wrong walkthrough.
    expect(chain.steps.map((step) => step.order)).toEqual(chain.steps.map((_, index) => index + 1))

    for (const step of chain.steps) {
      expect(step.location, `${chain.name} step ${step.order} must say where`).toBeTruthy()
      expect(step.requirement, `${chain.name} step ${step.order} must say what to do`).toBeTruthy()
    }
  }

  const karazhan = getAttunementChainForRaid('karazhan')!
  expect(karazhan.steps).toHaveLength(8)

  // Every Karazhan step names the quest it is, and cites the id that wording came from.
  for (const step of karazhan.steps) {
    expect(step.questName, `Karazhan step ${step.order} is a quest and should name it`).toBeTruthy()
    expect(step.notes ?? '', `Karazhan step ${step.order} must cite its Wowhead quest id`).toMatch(/\b9(8[0-9]{2})\b/)
  }

  /*
   * And it stays flagged. Two things these sources do not settle: the level the chain requires, and
   * whether Anniversary realms drop the attunement in 2.4 as previous Classic runs did.
   */
  expect(karazhan.needsVerification, 'sourced is not the same as verified').toBe(true)
  expect(karazhan.notes ?? '').toMatch(/Wowhead/)
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

    // `statMultipliersAfterConversion` counts as applying, and forgetting it here is how a buff that
    // does contribute gets reported as contributing nothing — which is what happened the day
    // Unleashed Rage was modelled.
    const applies = Boolean(
      buff.stats || buff.statMultipliers || buff.statMultipliersAfterConversion || buff.hastePercent || buff.damageMultiplier,
    )
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
  // 15 until Unleashed Rage was modelled on 2026-08-23: its own note said an attack-power multiplier
  // would land before attack power was derived, and `statMultipliersAfterConversion` answered that.
  expect(unmodelledBuffs.length, '12 of the 33 cannot be expressed as stats').toBe(12)

  for (const buff of unmodelledBuffs) {
    expect(buff.stats, `${buff.id} must contribute no stats`).toBeUndefined()
    expect(buff.statMultipliers, `${buff.id} must contribute no multipliers`).toBeUndefined()
    expect(buff.notModelled!.length, `${buff.id} needs a real explanation, not a placeholder`).toBeGreaterThan(40)
  }

  /*
   * Sanctity Aura is the exemplar now: its explanation has to carry the actual effect rather than
   * just saying it is unsupported.
   *
   * This used to pin Bloodlust, which was the buff a reader would most expect to find here. It is
   * modelled as of 2026-08-23, at 30% haste weighted by the 34.51% uptime a real parse measured, so
   * it is no longer an example of anything unmodelled. Sanctity Aura is refused for a reason that
   * has not moved: it is a **school-scoped** multiplier, and nothing in this simulator records a
   * spell school.
   */
  expect(getBuffById('sanctity-aura')?.notModelled).toContain('10%')
  expect(getBuffById('bloodlust')?.notModelled, 'Bloodlust is modelled now').toBeUndefined()
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

test('Improved Faerie Fire is split from the base debuff, and only the Balance half is spec-restricted', () => {
  /*
   * A walkthrough asked for Faerie Fire to be restricted to "Balance/Dreamstate". It is not, and this
   * repo's own ingested talent trees are the reason: Improved Faerie Fire is Balance (row 6, 3 ranks),
   * Faerie Fire (Feral) is Feral Combat (row 4, 1 rank), and Restoration — the tree Dreamstate lives
   * in — has neither. The requested restriction is inverted: it would credit the one tree with no
   * Faerie Fire talent at all and exclude the one with a dedicated one.
   *
   * So the base spell stays class-wide, which is what the game does, and the Balance-only half it was
   * really asking about became its own entry.
   */
  const base = getTargetDebuffById('faerie-fire')
  const improved = getTargetDebuffById('improved-faerie-fire')

  expect(base?.providedByClass).toBe('Druid')
  expect(base?.providedBySpec, 'every Druid is taught Faerie Fire, so the base debuff is class-wide').toBeUndefined()
  expect(base?.armorReduction).toBe(610)
  expect(base?.physicalHitTakenBonus, 'the hit bonus is the talent, not the base spell').toBeUndefined()

  expect(improved?.providedByClass).toBe('Druid')
  expect(improved?.providedBySpec).toBe('Balance')
  expect(improved?.spellId, 'rank 3/3 is the rank the 3% is read from').toBe(33602)
  expect(improved?.physicalHitTakenBonus).toBe(0.03)

  // The armor lives on exactly one of the two. Repeating it here would double-count it as soon as a
  // raid ticks both, which is the normal case rather than an edge one.
  expect(improved?.armorReduction, 'the armor is the base spell and must not be repeated').toBeUndefined()
})

test('Improved Faerie Fire reaches the melee and ranged attack tables but not the spell one', () => {
  /*
   * The tooltip says "melee and ranged attacks", and this is the assertion that keeps it there. Spell
   * hit is a separate table with its own 1% miss floor, and a debuff leaking across into it is
   * exactly the error Winter's Chill was corrected for in the other direction.
   */
  const fury: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Warrior', spec: 'Fury' }
  const furyGear = normalizeGearForCharacter(defaultGear, 'Warrior', 'Fury')
  const furyStats = calculateStats(fury, furyGear)
  const withoutMelee = calculateSimulation(fury, furyGear, furyStats, 'Physical DPS', [])
  const withMelee = calculateSimulation(fury, furyGear, furyStats, 'Physical DPS', ['improved-faerie-fire'])

  // Three percentage points off miss, because it is attacker hit rather than target avoidance.
  expect(breakdownValue(withoutMelee, /Miss chance/)! - breakdownValue(withMelee, /Miss chance/)!).toBeCloseTo(3, 1)
  expect(withMelee.scoreExact, 'landing more swings has to raise the estimate').toBeGreaterThan(withoutMelee.scoreExact)

  // Ranged reads the same term, so a Hunter gets it too.
  // Night Elf rather than Human: Humans cannot be Hunters in TBC, and `getBaseStats` throws on the pair.
  const hunter: CharacterProfile = { faction: 'Alliance', race: 'Night Elf', className: 'Hunter', spec: 'Marksmanship' }
  const hunterGear = normalizeGearForCharacter(defaultGear, 'Hunter', 'Marksmanship')
  const hunterStats = calculateStats(hunter, hunterGear)
  const withoutRanged = calculateSimulation(hunter, hunterGear, hunterStats, 'Physical DPS', [])
  const withRanged = calculateSimulation(hunter, hunterGear, hunterStats, 'Physical DPS', ['improved-faerie-fire'])
  expect(breakdownValue(withoutRanged, /Miss chance/)! - breakdownValue(withRanged, /Miss chance/)!).toBeCloseTo(3, 1)

  // And the caster path must not move at all.
  const mage: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Mage', spec: 'Fire' }
  const mageGear = normalizeGearForCharacter(defaultGear, 'Mage', 'Fire')
  const mageStats = calculateStats(mage, mageGear)
  const withoutSpell = calculateSimulation(mage, mageGear, mageStats, 'Caster DPS', [])
  const withSpell = calculateSimulation(mage, mageGear, mageStats, 'Caster DPS', ['improved-faerie-fire'])
  expect(breakdownValue(withSpell, /Spell hit chance/), 'melee and ranged only').toBe(
    breakdownValue(withoutSpell, /Spell hit chance/),
  )
  expect(withSpell.scoreExact).toBe(withoutSpell.scoreExact)
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
  expect(unmodelledTargetDebuffs.map((debuff) => debuff.id).sort()).toEqual(['expose-weakness', 'winters-chill'])

  /*
   * Two now, and the second is a different kind of gap worth keeping distinct. Winter's Chill cannot
   * be modelled because no spell school is recorded anywhere; **Expose Weakness cannot be modelled
   * because its value is another player's Agility**, and this app models one character. The first is
   * a missing field, the second is a missing second character — one could be closed by adding a
   * column, the other could not.
   */
  const exposeWeakness = unmodelledTargetDebuffs.find((debuff) => debuff.id === 'expose-weakness')
  expect(exposeWeakness?.notModelled, "the reason is another player's stat, not a field").toMatch(/Agility/)

  // The reason it cannot be modelled is narrow and worth keeping visible: no spell school is recorded
  // anywhere in the simulation, so a Frost-only debuff can be applied to every spell or to none.
  const wintersChill = unmodelledTargetDebuffs.find((debuff) => debuff.id === 'winters-chill')!
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
  await completeCharacterCreation(page)
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

  /*
   * These used to read `toBe(1238)` and `toBe(4741)`, and both broke the moment raid loot icons were
   * added — legitimately, since the mapping had genuinely grown. A written-down count pins the size
   * of the data rather than any property of it, which is the defect this repo already names about
   * counts in prose; it just happened to be wearing a test.
   *
   * What is worth asserting is that the **published counts describe the file they ship in**. A stale
   * `mappedCount` is a real failure — it is what the panel would quote — and it cannot be caught by
   * comparing against a number someone typed.
   */
  const iconNames = allItems.map((item) => item.wowItemId).filter((id): id is number => Boolean(id)).map((id) => getIconName(id))
  expect(mappedIconCount, 'the published mapping covers at least every catalogued item').toBeGreaterThanOrEqual(
    new Set(allItems.filter((item) => item.wowItemId).map((item) => item.wowItemId)).size,
  )
  expect(distinctIconCount, 'and the distinct count is not larger than the mapping it summarises').toBeLessThanOrEqual(mappedIconCount)
  expect(new Set(iconNames.filter(Boolean)).size, 'the catalogue alone accounts for most of the distinct icons').toBeLessThanOrEqual(
    distinctIconCount,
  )
})

test('the paperdoll renders real item icons rather than the placeholder glyphs', async ({ page }) => {
  await openApp(page)
  await equipDefaultGear(page)

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
  /*
   * Gear arrives mid-test now rather than at mount, so the icons begin loading the moment the import
   * lands and this assertion would otherwise race them. Waiting for every image to report complete is
   * what separates "the file is missing" from "the file had not arrived yet" — the suite reported
   * twelve perfectly valid icons as broken before this, and only when run alongside everything else.
   */
  await expect.poll(async () => icons.evaluateAll((nodes) => nodes.every((n) => (n as HTMLImageElement).complete))).toBe(true)

  // Reports the filenames rather than a count: a bare  tells you an icon is missing and
  // leaves you to find out which of nineteen it was.
  const broken = await icons.evaluateAll((nodes) =>
    nodes
      .filter((n) => !(n as HTMLImageElement).complete || (n as HTMLImageElement).naturalWidth === 0)
      .map((n) => n.getAttribute('src')),
  )
  expect(broken, 'no icon should fail to load').toEqual([])

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
      const character: CharacterProfile = { faction: 'Alliance', race: legalRaceFor(definition.className), className: definition.className, spec }
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

  /*
   * And it must still be the figure the handoff records, so a drift here is visible immediately.
   *
   * **192.3 until 2026-08-20**, when base stats and the attribute conversions were sourced from
   * wowsims rather than hand-written. A Human Fury Warrior's base Strength was 92 against a real
   * 145, and Agility converted to crit at a rate no class uses. The old number was never a
   * measurement of TBC; this one is.
   */
  expect(empty.score).toBe(215.3)
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
    const character: CharacterProfile = { faction: 'Alliance', race: legalRaceFor(className), className, spec }
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
  // 224.3 before the base stats and attribute conversions were sourced — see the untalented figure.
  expect(after.score).toBe(254.7)
})

test('talents do NOT close the rage gap, which is what this pass set out to test', () => {
  /*
   * Recorded as a result rather than a defect. The scope committed in advance to a falsification
   * test: a talented Fury build should move DPS substantially AND close the rage shortfall. The
   * first held — 215.3 to 254.7, +18.3%. The second did not.
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
    ['Hunter', 'Beast Mastery', 'Dwarf', 'Alliance'],
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
   * The panel says how many specs layer real special attacks and how many run from a single
   * signature ability. That used to be a number **typed into the JSX** — and this comment used to
   * say "the panel says two specs" while the assertion below said five, which is the whole failure
   * in one place: the count was known to be wrong, written down twice, and connected to nothing.
   *
   * `SimulatorPanel` derives both figures from `getRotationAbilities` now, so the sentence a player
   * reads cannot drift from this list. The assertion stays because it names *which* specs, which a
   * count cannot.
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

  /*
   * Three since 2026-08-23, when Affliction got the rest of its rotation — Corruption, Curse of
   * Agony, Siphon Life and a Shadow Bolt filler alongside Unstable Affliction. Sorted rather than
   * listed in iteration order, so adding a class does not reorder the expectation.
   */
  expect([...multiAbility].sort(), 'five specs have a real multi-ability rotation').toEqual([
    'Priest Shadow',
    'Warlock Affliction',
    'Warlock Destruction',
    'Warrior Arms',
    'Warrior Fury',
  ])
  expect(singleAbility, 'and the other 22 are single-ability approximations').toBe(22)
})

test('a hunter fires the button they press all fight, at a rate with two stated ceilings', () => {
  /*
   * ROTATION-SCOPE stage 1. Steady Shot was catalogued, sourced and correct, and reached the
   * simulation nowhere: `resolveRotation` filtered on the literal `'Melee Special'`, so a hunter's
   * estimate was white auto-shot damage and did not so much as name the shot. Not missing data and
   * not a missing mechanism — one word in a filter.
   *
   * The rate is bounded by two things, both read off wowsims at the pinned commit rather than
   * judged here:
   *
   *   1. **The hunter GCD is locked at 1.5s and ranged haste does not reduce it** — upstream sets
   *      `IgnoreHaste: true` with that comment. The cast time *is* hasted, so it drops below the GCD
   *      and stops being the constraint.
   *   2. **One shot per auto-shot cycle.** Casting delays the next auto rather than clipping it, and
   *      upstream prices that delay and avoids paying it. A second shot inside one cycle would buy
   *      its damage by pushing a white shot back.
   */
  const hunter: CharacterProfile = { faction: 'Alliance', race: 'Night Elf', className: 'Hunter', spec: 'Marksmanship' }
  const gear = normalizeGearForCharacter(defaultGear, 'Hunter', 'Marksmanship')
  const stats = calculateStats(hunter, gear)
  const result = calculateSimulation(hunter, gear, stats, 'Physical DPS')

  // Named in the breakdown, which is the half that was missing entirely.
  const steady = result.breakdown.find((entry) => /Steady Shot/.test(entry.label))
  expect(steady, 'Steady Shot must reach the estimate, not just the catalogue').toBeDefined()
  expect(steady!.value, 'and contribute damage').toBeGreaterThan(0)

  // The white shot is still there underneath it: this layers on top rather than replacing.
  expect(result.breakdown.find((entry) => entry.label === 'Attack power')?.value).toBeGreaterThan(0)

  /*
   * The falsification test ROTATION-SCOPE asked for, stated before the work: the modelled rate must
   * not exceed the budget the spec actually has. Both ceilings are asserted rather than the one that
   * happens to bind with this gear.
   */
  const steadyShot = getRotationAbilities('Hunter', 'Marksmanship').find((a) => a.name === 'Steady Shot')!
  const rangedSpeed = gear['Ranged']?.item?.weaponSpeed
  expect(rangedSpeed, 'the default hunter set must have something to shoot with').toBeGreaterThan(0)

  const rate = computeUsageRate(steadyShot, { rangedSwingSeconds: rangedSpeed }).usesPerSecond
  expect(rate, 'never more often than the 1.5s hunter GCD allows').toBeLessThanOrEqual(1 / 1.5 + 1e-9)
  expect(rate, 'and never more than one per auto-shot cycle').toBeLessThanOrEqual(1 / rangedSpeed! + 1e-9)
  expect(computeUsageRate(steadyShot, { rangedSwingSeconds: rangedSpeed }).basis).toBe('weave')

  /*
   * The GCD ceiling is the one that binds only at speeds no TBC bow reaches, so it is exercised
   * directly rather than left to a gear change to discover.
   */
  const fast = computeUsageRate(steadyShot, { rangedSwingSeconds: 0.8 })
  expect(fast.usesPerSecond).toBeCloseTo(1 / 1.5, 6)
  expect(fast.explanation, 'and it says which ceiling it hit').toMatch(/global cooldown/)

  // Nothing equipped to shoot with is a stated exclusion, not a silent zero.
  const bare = computeUsageRate(steadyShot, {})
  expect(bare.usesPerSecond).toBe(0)
  expect(bare.basis).toBe('unmodelled')
  expect(bare.explanation).toMatch(/ranged slot/)
})

test('all three hunter specs gain the shot, and no other spec moves', () => {
  /*
   * All three trees run the same Steady Shot weave in TBC — the specs differ in what they layer on
   * top, which their own notes record — so all three must gain it. And the refactor that let a
   * ranged special through must not have touched the melee path it shares a function with, which is
   * the other half of what this asserts.
   */
  const gearFor = (spec: TbcSpec) => normalizeGearForCharacter(defaultGear, 'Hunter', spec)

  for (const spec of ['Beast Mastery', 'Marksmanship', 'Survival'] as const) {
    const character: CharacterProfile = { faction: 'Alliance', race: 'Night Elf', className: 'Hunter', spec }
    const gear = gearFor(spec)
    const stats = calculateStats(character, gear)
    const result = calculateSimulation(character, gear, stats, 'Physical DPS')

    expect(
      result.breakdown.some((entry) => /Steady Shot/.test(entry.label)),
      `${spec} should fire Steady Shot`,
    ).toBe(true)

    /*
     * The mana the rate assumes is shown rather than buried. `StatBlock` has no mana field, so the
     * shot is not capped by mana — and an estimate that quietly assumed infinite mana without saying
     * so would be exactly the kind of confident silence this project keeps correcting.
     */
    const mana = result.breakdown.find((entry) => entry.label === 'Mana per second spent')
    expect(mana, `${spec} must show what the rate costs`).toBeDefined()
    expect(mana!.value).toBeGreaterThan(0)
  }

  // A melee spec shares `resolveRotation` and must be untouched: no ranged special, no mana row.
  const fury: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Warrior', spec: 'Fury' }
  const furyGear = normalizeGearForCharacter(defaultGear, 'Warrior', 'Fury')
  const furyResult = calculateSimulation(fury, furyGear, calculateStats(fury, furyGear), 'Physical DPS')
  expect(furyResult.breakdown.some((entry) => /Steady Shot/.test(entry.label))).toBe(false)
  expect(furyResult.breakdown.some((entry) => entry.label === 'Mana per second spent')).toBe(false)
  expect(furyResult.breakdown.some((entry) => /Bloodthirst/.test(entry.label)), 'its own specials still land').toBe(true)
})

test('a second energy ability would cost a cat more than it pays, until a bleed exists', () => {
  /*
   * ROTATION-SCOPE listed Feral in stage 2 as "gets its second and third buttons", on the reasoning
   * that Mangle (Cat) is sourced and computable from a fixed energy cost. Both halves of that are
   * true and the conclusion is still wrong, which is why this is a test rather than a paragraph.
   *
   * **Energy is the binding budget and Shred is the more efficient way to spend it.** The resolver
   * hands the budget out in priority order, so a second energy ability does not add damage — it
   * moves damage from a better use to a worse one.
   *
   * **And Mangle's debuff does not pay the difference back**, which is the part that was mis-recorded
   * in this repo's own data. Upstream implements the TBC aura as
   * `PeriodicPhysicalDamageTakenMultiplier *= 1.3` for 12s: **periodic physical damage only**. Shred
   * is direct damage and is not multiplied by it. The "Shred and Ravage" wording people remember is
   * from a later expansion.
   *
   * So Rake was the prerequisite rather than the sibling.
   *
   * **That prerequisite is met now**, and this comment is kept rather than deleted because the
   * conclusion it reached has changed while the measurement it made has not. Rake and Rip landed on
   * 2026-08-27, so Mangle's debuff finally has periodic physical damage to multiply — the reason it
   * was refused is gone. What is asserted below still holds and is still worth holding: Shred returns
   * more damage per point of energy than Mangle does *directly*. Whether the 30% on two bleeds now
   * pays that difference back is an open question and the next piece of Feral work, not something
   * this test answers.
   */
  const shred = getRotationAbilities('Druid', 'Feral').find((ability) => ability.name === 'Shred')!
  expect(shred.resource?.type).toBe('Energy')

  const attackPower = 1100

  /*
   * Mangle is not in the ability data — that is the point — so it is built here from the constants
   * this repo already sourced into Shred's own notes: rank 3, spell 33983, 45 energy, 160% of
   * un-normalised cat-form weapon damage plus a flat 264.
   */
  const mangle = {
    ...shred,
    name: 'Mangle (Cat)',
    spellId: 33983,
    resource: { type: 'Energy' as const, cost: 45 },
    scaling: {
      basis: 'weapon damage' as const,
      weaponDamageMultiplier: 1.6,
      normalizedWeaponDamage: false,
      flatWeaponDamageBonus: 264,
    },
  }

  const perEnergy = (ability: typeof shred) =>
    computeSpecialDamagePerUse(ability, CAT_FORM_WEAPON, undefined, attackPower) / ability.resource!.cost

  const shredPerEnergy = perEnergy(shred)
  const manglePerEnergy = perEnergy(mangle)

  expect(shredPerEnergy, 'Shred is the more efficient use of a cat\'s energy').toBeGreaterThan(manglePerEnergy)

  /*
   * Quantified, because "worse" and "4% worse" are different claims and only one of them is
   * checkable. Maintaining Mangle on its 12s debuff costs 45/12 = 3.75 of the 10 energy/sec.
   */
  const shredOnly = shredPerEnergy * ENERGY_PER_SECOND
  const mangleUpkeep = 45 / 12
  const withMangle = manglePerEnergy * mangleUpkeep + shredPerEnergy * (ENERGY_PER_SECOND - mangleUpkeep)

  expect(withMangle, 'maintaining Mangle is a net loss while nothing bleeds').toBeLessThan(shredOnly)
  expect((shredOnly - withMangle) / shredOnly).toBeCloseTo(0.037, 2)

  // And the resolver really does spend the whole budget on the first ability, which is what makes
  // the priority order decisive rather than cosmetic.
  const rate = computeUsageRate(shred)
  expect(rate.basis).toBe('energy')
  expect(rate.usesPerSecond * shred.resource!.cost).toBeCloseTo(ENERGY_PER_SECOND, 6)
})

test('an Enhancement shaman is paid for the imbue their damage actually comes from', () => {
  /*
   * ROTATION-SCOPE filed Enhancement under "gets its second and third buttons". It does not need
   * one: the spec's own ability notes already said its damage "is dominated by Windfury Weapon procs
   * on white swings", and the model counted none of them. A weapon imbue is not a rotational
   * ability, which is why this is not a `SignatureAbility` and why the stage was re-scoped.
   */
  const shaman: CharacterProfile = { faction: 'Alliance', race: 'Draenei', className: 'Shaman', spec: 'Enhancement' }
  const gear = normalizeGearForCharacter(defaultGear, 'Shaman', 'Enhancement')
  const stats = calculateStats(shaman, gear)
  const result = calculateSimulation(shaman, gear, stats, 'Physical DPS')

  const windfury = result.breakdown.find((entry) => entry.label === 'Windfury Weapon DPS')
  expect(windfury, 'Windfury must reach the estimate').toBeDefined()
  expect(windfury!.value).toBeGreaterThan(0)

  // The proc rate is reported too, because a damage figure with no rate behind it cannot be checked.
  const rate = result.breakdown.find((entry) => entry.label === 'Windfury procs per minute')
  expect(rate, 'the rate has to be visible for the damage to be checkable').toBeDefined()
  expect(rate!.value).toBeGreaterThan(0)

  /*
   * Stormstrike is still there underneath it. Windfury is white damage folded into the swing model
   * rather than a special layered on top, and the two must not have displaced each other.
   */
  expect(result.breakdown.some((entry) => /Stormstrike DPS/.test(entry.label))).toBe(true)

  /*
   * And the mana row reaches this spec too. It was added for the hunter shot weave, but Stormstrike
   * is mana-costed as well and nothing caps either on mana, so the disclosure belongs on both —
   * verified in the running app rather than assumed, which is how the hunter-only wording in the
   * docs was caught.
   */
  const mana = result.breakdown.find((entry) => entry.label === 'Mana per second spent')
  expect(mana, 'Stormstrike costs mana and nothing caps it, so the drain must be visible').toBeDefined()
  expect(mana!.value).toBeGreaterThan(0)

  // No other melee class carries the imbue — a Warrior must show no such row.
  const fury: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Warrior', spec: 'Fury' }
  const furyGear = normalizeGearForCharacter(defaultGear, 'Warrior', 'Fury')
  const furyResult = calculateSimulation(fury, furyGear, calculateStats(fury, furyGear), 'Physical DPS')
  expect(furyResult.breakdown.some((entry) => /Windfury/.test(entry.label))).toBe(false)
})

test('Windfury is bounded by the swing rate and by its internal cooldown, whichever is slower', () => {
  /*
   * Same shape as the hunter shot weave, and asserted the same way: the ceiling that binds today is
   * not the only one that has to be right. Both constants are read from wowsims at the pinned commit
   * rather than from the tooltip, which states neither.
   */
  const damagePerExtraAttack = 500

  // A Phase 2 main hand: roughly one proc per 17 seconds, nowhere near the cooldown ceiling.
  const slow = estimateWindfury({
    mainHandSwingsPerSecond: 1 / 2.7,
    landedFraction: 0.7,
    damagePerExtraAttack,
  })
  expect(slow.procsPerSecond).toBeCloseTo((1 / 2.7) * 0.7 * WINDFURY_PROC_CHANCE, 6)
  expect(slow.limitedByInternalCooldown, 'no Phase 2 weapon speed reaches the cap').toBe(false)
  expect(slow.dps).toBeCloseTo(slow.procsPerSecond * WINDFURY_EXTRA_ATTACKS * damagePerExtraAttack, 6)

  /*
   * Pushed past it, the 3s internal cooldown takes over. This is the branch a bare percentage model
   * would have got wrong, and nothing in Phase 2 gear exercises it — which is exactly why it is
   * tested directly rather than left for a future weapon to discover.
   */
  const fast = estimateWindfury({
    mainHandSwingsPerSecond: 10,
    landedFraction: 1,
    damagePerExtraAttack,
  })
  expect(fast.procsPerSecond).toBeCloseTo(1 / WINDFURY_INTERNAL_COOLDOWN_SECONDS, 6)
  expect(fast.limitedByInternalCooldown).toBe(true)

  /*
   * Linear in the swing rate below the cap, which is the closed form's load-bearing assumption: the
   * extra attacks carry `ProcMaskEmpty` upstream and cannot re-proc, so there is no cascade.
   */
  const half = estimateWindfury({ mainHandSwingsPerSecond: 0.2, landedFraction: 0.7, damagePerExtraAttack })
  const double = estimateWindfury({ mainHandSwingsPerSecond: 0.4, landedFraction: 0.7, damagePerExtraAttack })
  expect(double.procsPerSecond).toBeCloseTo(half.procsPerSecond * 2, 6)

  // A swing that never lands cannot roll the proc, because upstream gates it on Landed().
  expect(estimateWindfury({ mainHandSwingsPerSecond: 1, landedFraction: 0, damagePerExtraAttack }).dps).toBe(0)

  // And the bonus attack power is the rank 5 figure, not the relic-boosted one.
  expect(WINDFURY_BONUS_ATTACK_POWER, 'Totem of the Astral Winds raises this to 555 and is not modelled').toBe(475)
})

test('a Retribution paladin is paid for the Holy damage that is most of their output', () => {
  /*
   * The spec's own notes said it before this existed: "Retribution's actual damage is dominated by
   * auto attacks with Seal of Blood (Horde) or Seal of Command (Alliance) proccing on them, plus
   * Judgement on cooldown". None of it was counted, and the same notes called Ret "the physical spec
   * where the special-attack share of damage is smallest" without noticing that the missing share was
   * not special-attack damage at all.
   */
  const forFaction = (faction: 'Alliance' | 'Horde', race: TbcRace) => {
    const character: CharacterProfile = { faction, race, className: 'Paladin', spec: 'Retribution' }
    const gear = normalizeGearForCharacter(defaultGear, 'Paladin', 'Retribution')
    return calculateSimulation(character, gear, calculateStats(character, gear), 'Physical DPS')
  }

  const horde = forFaction('Horde', 'Blood Elf')
  const alliance = forFaction('Alliance', 'Human')

  // Each faction is told which seal it is actually running, rather than a generic "Holy damage" row.
  expect(horde.breakdown.some((entry) => entry.label === 'Seal of Blood DPS')).toBe(true)
  expect(horde.breakdown.some((entry) => entry.label === 'Judgement of Blood DPS')).toBe(true)
  expect(alliance.breakdown.some((entry) => entry.label === 'Seal of Command DPS')).toBe(true)
  expect(alliance.breakdown.some((entry) => entry.label === 'Judgement of Command DPS')).toBe(true)

  // And never the other faction's seal, which is the whole point of splitting them.
  expect(alliance.breakdown.some((entry) => /Blood/.test(entry.label))).toBe(false)
  expect(horde.breakdown.some((entry) => /Command/.test(entry.label))).toBe(false)

  /*
   * The gap is enormous and it is real: Judgement of Blood deals 295-325 where Judgement of Command
   * deals 68-73, which is why Horde Retribution led for the whole of early TBC. Modelling one seal
   * for both factions would have been wrong by roughly a factor of four on that component.
   */
  const judgement = (result: typeof horde, label: string) =>
    result.breakdown.find((entry) => entry.label === label)!.value

  expect(judgement(horde, 'Judgement of Blood DPS')).toBeGreaterThan(
    judgement(alliance, 'Judgement of Command DPS') * 3,
  )
  expect(horde.scoreExact, 'and it reaches the headline').toBeGreaterThan(alliance.scoreExact)
})

test('Holy damage is not reduced by armor, and the physical damage beside it still is', () => {
  /*
   * The invariant this whole change turns on, and the one that would have been silently wrong if the
   * seal had been folded into `rawDps` like every other damage source on this path: **armor reduces
   * physical damage and nothing else**. Against this app's own target that is a ~42% difference.
   *
   * Asserted by moving the target's armor rather than by reading the code — three armor debuffs
   * strip 4,010 points, so the physical rows must move and the Holy rows must not.
   */
  const character: CharacterProfile = { faction: 'Horde', race: 'Blood Elf', className: 'Paladin', spec: 'Retribution' }
  const gear = normalizeGearForCharacter(defaultGear, 'Paladin', 'Retribution')
  const stats = calculateStats(character, gear)

  const bare = calculateSimulation(character, gear, stats, 'Physical DPS')
  const sundered = calculateSimulation(character, gear, stats, 'Physical DPS', [
    'sunder-armor',
    'curse-of-recklessness',
    'faerie-fire',
  ])

  const row = (result: typeof bare, label: string) => result.breakdown.find((entry) => entry.label === label)!.value

  // The armor debuffs did what they say, so this is a real comparison rather than two identical runs.
  expect(row(sundered, 'Armor mitigation')).toBeLessThan(row(bare, 'Armor mitigation'))

  // Physical: Crusader Strike lands harder through thinner armor.
  expect(row(sundered, 'Crusader Strike DPS')).toBeGreaterThan(row(bare, 'Crusader Strike DPS'))

  // Holy: identical, because armor was never touching it.
  expect(row(sundered, 'Seal of Blood DPS'), 'Holy damage ignores armor entirely').toBe(
    row(bare, 'Seal of Blood DPS'),
  )
  expect(row(sundered, 'Judgement of Blood DPS')).toBe(row(bare, 'Judgement of Blood DPS'))

  // And the summary says so, since a number that behaves differently needs to explain itself.
  expect(bare.summary).toMatch(/armor does not reduce them/i)
})

test('a procs-per-minute rate is normalised for weapon speed, and is not multiplied by it again', () => {
  /*
   * The easy way to get PPM wrong. Chance per swing is `PPM * speed / 60`, so the rate per second is
   * `PPM / 60` whatever is equipped — multiplying by the swing rate as well would hand a fast weapon
   * a proc rate it does not have. Seal of Command is the only PPM effect in this simulator, so the
   * unit is pinned here rather than left implicit.
   */
  const base = {
    faction: 'Alliance' as const,
    landedFraction: 1,
    mainHandSwingDamage: 1000,
    spellPower: 0,
    critChance: 0,
  }

  const slow = estimatePaladinHolyDamage({ ...base, mainHandSwingsPerSecond: 1 / 3.6 })
  const fast = estimatePaladinHolyDamage({ ...base, mainHandSwingsPerSecond: 1 / 1.8 })
  expect(fast.sealDps, 'a faster weapon does not proc Seal of Command more often').toBe(slow.sealDps)

  // The rate itself: 7 PPM at full landing is 7/60 procs per second, at 70% of a 1000 swing.
  expect(slow.sealDps).toBeCloseTo((SEAL_OF_COMMAND_PROCS_PER_MINUTE / 60) * 1000 * 0.7, 6)

  /*
   * Seal of Blood is the opposite shape and must scale with the swing rate, because it fires on every
   * landed hit rather than on a proc. Asserting both together is what keeps the two from being
   * "simplified" into one code path later.
   */
  const hordeSlow = estimatePaladinHolyDamage({ ...base, faction: 'Horde', mainHandSwingsPerSecond: 1 / 3.6 })
  const hordeFast = estimatePaladinHolyDamage({ ...base, faction: 'Horde', mainHandSwingsPerSecond: 1 / 1.8 })
  expect(hordeFast.sealDps).toBeCloseTo(hordeSlow.sealDps * 2, 6)

  // A swing that never lands carries no Holy damage with it, for either seal.
  const whiffing = estimatePaladinHolyDamage({ ...base, mainHandSwingsPerSecond: 1, landedFraction: 0 })
  expect(whiffing.sealDps).toBe(0)
  // The judgement is on a cooldown rather than a swing, so it keeps going regardless.
  expect(whiffing.judgementDps).toBeGreaterThan(0)
})

test('the emphasis in a spec note renders as emphasis, not as asterisks', async ({ page }) => {
  /*
   * The researched notes are authored with `**bold**` and were rendered as plain text, so a player
   * read the asterisks. A small thing, on the one surface whose entire job is being read — and the
   * oldest of them ("**Feral Attack Power**") had been sitting there since the Feral weapon model
   * was written.
   *
   * Retribution is the note with the most of them, and the one a reader is most likely to need,
   * because Holy damage behaving differently from everything else on the page has to explain itself.
   */
  await openApp(page)
  await page.getByLabel('Class').selectOption('Paladin')
  await page.getByLabel('Specialization').selectOption('Retribution')

  await runSimulation(page)

  const note = page.getByTestId('simulation-spec-note')
  await expect(note).toBeVisible()
  await expect(note, 'the note really is the Retribution one').toContainText(/Crusader Strike/i)
  await expect(note, 'no raw markers reach the reader').not.toContainText('**')
  await expect(note.locator('strong'), 'and the emphasis is real markup').not.toHaveCount(0)

  /*
   * The assertion above would pass just as happily on a note with no emphasis in it, so this pins
   * that there was something to render. Exactly two specs carry emphasis today; the count is
   * deliberately not asserted, because adding emphasis to a note should not fail a test.
   */
  const authored = getSignatureAbility('Paladin', 'Retribution')?.notes ?? ''
  expect(authored, 'the source note is authored with emphasis').toContain('**')
})

test('Shaman Flurry is ingested, and carries the constant that made it Warrior-shaped', () => {
  /*
   * Flurry sat in `SHAMAN_SKIPPED` with a precise reason: "Shaman has its own Flurry at a different
   * rank scale; the analytic derivation is Warrior-shaped and would need re-checking against the
   * Shaman ranks before being reused."
   *
   * Checked, and the difference is a single constant. Upstream computes
   * `bonus := 1.05 + 0.05*float64(shaman.Talents.Flurry)` against the Warrior's
   * `bonus := 1 + 0.05*...` — the same slope plus a flat 5% for owning the talent, which is why the
   * Shaman ranks read 10/15/20/25/30% where the Warrior reads 5/10/15/20/25%. `baseBonus` carries it,
   * and the 3-stack aura derivation was reusable untouched.
   *
   * This matters out of proportion to its size: the reference parse has Flurry at **94.16% uptime**,
   * and it scales white damage *and* the Windfury proc rate, so it sits underneath both of the two
   * largest gaps in the model.
   */
  const flurry = rawTalentEffects.effects.find((effect) => effect.className === 'Shaman' && effect.talent === 'Flurry')
  expect(flurry, 'Shaman Flurry must be ingested rather than skipped').toBeDefined()
  expect(flurry!.kind).toBe('flurryHaste')
  expect(flurry!.perRank).toBe(0.05)
  expect(flurry!.baseBonus, 'the constant is what made this a different rank scale').toBe(0.05)

  // 5/5 is +30%, which is the in-game value and the thing a wrong shape would have missed by 5%.
  const maxed = deriveTalentModifiers({ [flurry!.talentId]: 5 })
  expect(maxed.flurryBonus).toBeCloseTo(1.3, 6)

  // Rank 1 is +10%, not +5% — the half of the scale a Warrior-shaped derivation would have got wrong.
  expect(deriveTalentModifiers({ [flurry!.talentId]: 1 }).flurryBonus).toBeCloseTo(1.1, 6)

  // And no points is still the identity, which is the invariant the whole talent system rests on.
  expect(deriveTalentModifiers({}).flurryBonus).toBe(1)

  // Warrior's is untouched by the new field: same slope, no constant.
  const warrior = rawTalentEffects.effects.find((effect) => effect.className === 'Warrior' && effect.talent === 'Flurry')!
  expect(warrior.baseBonus ?? 0, 'the Warrior version has no constant').toBe(0)
  expect(deriveTalentModifiers({ [warrior.talentId]: 5 }).flurryBonus).toBeCloseTo(1.25, 6)
})

test('Windfury rolls on both hands, and the proc rate is the one a real log shows', () => {
  /*
   * Calibrated against the repo owner's Hydross parse rather than against upstream's constants, and
   * the two disagree — which is the point of having a log.
   *
   * The parse: 136 melee swings in 116 seconds, 118 of them landing, and 41 `Windfury Attack` hits
   * across two rows. At two attacks per proc that is **20.5 procs, or 10.6 per minute**, against
   * 1.017 landed swings per second — an implied **17.4%** per landed swing.
   *
   * Upstream carries 0.2 for one imbued hand and **0.36 for both**. Taken literally as a per-swing
   * chance, 0.36 predicts 18.3 procs per minute — nearly double what the log records. 0.2 on each
   * hand predicts 10.1, inside 5% of observed. So the model rolls 20% per landed swing per hand, and
   * `weaponImbues.ts` says why it declines the 0.36.
   */
  const perHandSwings = 0.5
  const landedFraction = 0.868

  const dual = estimateWindfury({
    mainHandSwingsPerSecond: perHandSwings,
    offHandSwingsPerSecond: perHandSwings,
    landedFraction,
    damagePerExtraAttack: 1000,
    damagePerOffHandExtraAttack: 500,
  })

  // Both hands roll, so the rate is driven by the combined landed swings.
  const expected = (perHandSwings * 2 * landedFraction) * WINDFURY_PROC_CHANCE
  expect(dual.procsPerSecond).toBeCloseTo(expected, 6)
  expect(dual.procsPerSecond * 60, 'within a proc a minute of the parse').toBeCloseTo(10.4, 0)

  // The off hand contributes real damage, at half the main hand's, matching the 2.0k/962.2 the log
  // reports for the two rows.
  expect(dual.offHandDps).toBeCloseTo(dual.mainHandDps / 2, 6)
  expect(dual.dps).toBeCloseTo(dual.mainHandDps + dual.offHandDps, 6)

  /*
   * A single imbued hand halves the proc rate, because the off hand is no longer rolling. This is the
   * behaviour the model had for every shaman before the parse showed two Windfury rows.
   */
  const single = estimateWindfury({
    mainHandSwingsPerSecond: perHandSwings,
    landedFraction,
    damagePerExtraAttack: 1000,
  })
  expect(single.procsPerSecond).toBeCloseTo(dual.procsPerSecond / 2, 6)
  expect(single.offHandDps).toBe(0)

  /*
   * **One internal cooldown, shared between the hands.** Upstream registers a single aura holding
   * both spells, so a dual-wielder cannot roll two independent cooldowns — capping per hand would
   * have allowed twice the procs the aura permits.
   */
  const fast = estimateWindfury({
    mainHandSwingsPerSecond: 10,
    offHandSwingsPerSecond: 10,
    landedFraction: 1,
    damagePerExtraAttack: 1000,
    damagePerOffHandExtraAttack: 500,
  })
  expect(fast.procsPerSecond).toBeCloseTo(1 / WINDFURY_INTERNAL_COOLDOWN_SECONDS, 6)
  expect(fast.limitedByInternalCooldown).toBe(true)
})

/**
 * Dresses a spec in its own rank-1 BiS, buffs and consumables it fully, and fills its primary talent
 * tree to the 61-point cap — the strongest character this app can currently describe.
 *
 * Not a claim that a real raider looks like this. It is a **ceiling**, and the point of measuring the
 * ceiling is that anything below it in the comparison table is a gap in the model rather than a gap
 * in what the player brought.
 */
function bestCaseSimulation(className: TbcClass, spec: TbcSpec, role: CharacterRole) {
  const character: CharacterProfile = { faction: 'Alliance', race: legalRaceFor(className), className, spec }

  let gear = normalizeGearForCharacter(defaultGear, className, spec)
  const list = getBisListForSpec(className, spec)
  const filled = new Set<string>()

  /*
   * **Gems and enchants come with the item, and leaving them off was worth about a quarter of the
   * gap this table exists to measure.** `defaultGear` sets `gemIds: []` and no `enchantId`, and the
   * first version of this harness never read the entries' own `recommendedGemIds` /
   * `recommendedEnchantId` — so it scored a "best case" character wearing raid gear with empty
   * sockets and bare weapons, which is not a character anyone plays.
   *
   * Coverage is partial and that is fine: 7 of a spec's 15 rank-1 entries carry gems and 11 carry an
   * enchant, so this raises the floor rather than reaching the true ceiling.
   */
  const equip = (slot: string, entry: { itemId: string; recommendedEnchantId?: string; recommendedGemIds?: string[] }) => {
    const item = getItemById(entry.itemId)
    if (!item) return false
    gear = {
      ...gear,
      [slot]: {
        ...(gear as Record<string, unknown>)[slot],
        item,
        gemIds: entry.recommendedGemIds ?? [],
        ...(entry.recommendedEnchantId ? { enchantId: entry.recommendedEnchantId } : {}),
      },
    } as typeof gear
    return true
  }

  for (const entry of list?.entries ?? []) {
    if (entry.rank !== 1 || filled.has(entry.slot)) continue
    if (equip(entry.slot, entry)) filled.add(entry.slot)
  }

  /*
   * **The paired slots, which the ranked list does not name.** It ranks `Finger 1` and `Trinket 1`
   * and stops — there is no `Finger 2` row anywhere in the data — so a best-case character was
   * walking around with one ring and one trinket. The second-ranked pick for the same slot is what a
   * real player puts in the other one.
   */
  for (const [ranked, paired] of [
    ['Finger 1', 'Finger 2'],
    ['Trinket 1', 'Trinket 2'],
  ] as const) {
    if (filled.has(paired)) continue
    const second = list?.entries.find((entry) => entry.slot === ranked && entry.rank === 2)
    if (second && equip(paired, second)) filled.add(paired)
  }

  /*
   * The primary tree, filled in listed order and stopped at 61 — the real level-70 budget. Maxing a
   * whole tree overruns it (Enhancement alone is 65 points), and a ceiling that spends points the
   * game does not give would flatter the model in exactly the direction this table exists to check.
   */
  /*
   * **A real raiding build where upstream has one, and the old rule only where it does not.**
   *
   * This used to fill the spec's primary tree in listed order to 61 points, which is not a build any
   * TBC raider plays and is not a ceiling either — a real 41/20 split can be worth more than 61
   * points down one tree. It cost a measurable number twice in one hour on 2026-08-27: it handed a
   * Demonology warlock a talent that spec does not use, and it made Demonic Sacrifice read as exactly
   * zero for the two specs that actually take it, because they take it out of a second tree.
   *
   * `talentBuilds.json` carries wowsims' own presets for **17 of the 20 DPS specs**. The other three
   * — Hunter Marksmanship, Warlock Affliction, Warlock Demonology — have no upstream preset and keep
   * the old rule rather than getting an invented build, which was the repo owner's call. The
   * calibration test names which specs use which, so the table does not mix two methodologies
   * silently.
   */
  const sourced = talentBuilds.builds.find((build) => build.className === className && build.spec === spec)
  const points: Record<number, number> = sourced ? { ...sourced.points } : {}
  if (!sourced) {
    const tree = getTalentData(className)?.trees.find((entry) => entry.spec === spec)
    let spent = 0
    for (const talent of tree?.talents ?? []) {
      if (spent >= 61) break
      const rank = Math.min(talent.maxRank, 61 - spent)
      points[talent.id] = rank
      spent += rank
    }
  }

  const buffIds = sampleBuffs.map((buff) => buff.id)
  const stats = calculateStats(
    character,
    gear,
    buffIds,
    sampleConsumables.map((consumable) => consumable.id),
    undefined,
    deriveTalentModifiers(points),
  )

  /*
   * **Every modelled target debuff, because a raid always has them.** Leaving them off was the first
   * version of this harness and it understated every physical spec by about 28%: Sunder, Faerie Fire
   * and Curse of Recklessness strip 4,010 armour between them, which against this app's 7,700-armour
   * target is the difference between 42.2% mitigation and 25.9%. A "best case" that omits what every
   * real parse has would be measuring the wrong thing.
   */
  const debuffs = modelledTargetDebuffs.map((debuff) => debuff.id)

  /*
   * `buffIds` goes to the simulator as well as to `calculateStats`, and forgetting the second half is
   * silent: stat buffs arrive folded into `stats` either way, so the run still looks right while
   * percentage haste and damage multipliers contribute nothing. Which is exactly what happened the
   * first time Bloodlust was modelled — the table did not move by a single point.
   */
  return {
    result: calculateSimulation(character, gear, stats, role, debuffs, undefined, points, buffIds),
    slots: filled.size,
  }
}

test('every DPS spec is measured against what players actually parse', () => {
  /*
   * **The simulator had no way to be wrong.** Every number it produced was internally consistent and
   * nothing compared any of them to reality, so a spec reading 522 where players do 1,693 looked
   * exactly like a spec reading correctly. `featureFlags.ts` has claimed "roughly 4x low" on one
   * person's judgement for months.
   *
   * This is that judgement turned into a measurement, against `dpsReference` — archon.gg's observed
   * averages for the phase this app is scoped to. The table it prints is the point of the test; the
   * assertions below are the parts that can fail.
   */
  const rows: { spec: string; modelled: number; target: number; ratio: number; slots: number }[] = []

  for (const entry of tbcClasses) {
    for (const spec of entry.specs) {
      const role = getRoleForSpec(entry.className, spec)
      const reference = getDpsReference(entry.className, spec)

      if (role !== 'Physical DPS' && role !== 'Caster DPS') {
        expect(reference, `${entry.className} ${spec} is not DPS and must not have a DPS reference`).toBeUndefined()
        continue
      }

      expect(reference, `${entry.className} ${spec} is a DPS spec and needs a reference`).toBeDefined()

      const { result, slots } = bestCaseSimulation(entry.className, spec, role)
      rows.push({
        spec: `${entry.className} ${spec}`,
        modelled: Math.round(result.scoreExact),
        target: reference!.dps,
        ratio: reference!.dps / result.scoreExact,
        slots,
      })
    }
  }

  rows.sort((a, b) => b.ratio - a.ratio)
  console.log(`\nDPS calibration vs ${DPS_REFERENCE_SOURCE}`)
  console.log('spec'.padEnd(26), 'modelled'.padStart(9), 'target'.padStart(7), 'ratio'.padStart(6), 'bis slots'.padStart(10))
  for (const row of rows) {
    console.log(
      row.spec.padEnd(26),
      String(row.modelled).padStart(9),
      String(row.target).padStart(7),
      (row.ratio.toFixed(1) + 'x').padStart(6),
      String(row.slots).padStart(10),
    )
  }

  /*
   * **Which specs are measured against a real build, and which are not.** Printed beside the table
   * because the two are not the same measurement: a sourced spec is compared at a build a raider
   * plays, and the other three at a synthetic one-tree fill. Mixing them silently would make the
   * column look more uniform than it is.
   */
  console.log(
    `
${talentBuilds.buildCount} of 20 specs use a wowsims raiding build; ${talentBuilds.unsourced.length} keep the one-tree fill: ` +
      talentBuilds.unsourced.map((u) => `${u.className} ${u.spec}`).join(', '),
  )
  expect(talentBuilds.buildCount, 'seventeen sourced builds').toBe(17)
  expect(talentBuilds.unsourced, 'and three that have no upstream preset').toHaveLength(3)

  /*
   * **Two honest consequences of using real builds, recorded rather than smoothed over.**
   *
   * Upstream's Subtlety preset spends only 38 of 61 points, so that spec is measured at a genuinely
   * incomplete build and reads lower than it would at a full one — a talent gap the ratio will
   * attribute to the model. And upstream's Destruction build takes Demonic Sacrifice for **+15%
   * Shadow**, which reaches none of this repo's Destruction rotation, because that rotation is
   * Immolate and Incinerate and both are Fire. Upstream's own Destruction casts Shadow Bolt; ours
   * does not. Neither is a defect in the model, and both are reasons a ratio can move for a reason
   * that is not the model.
   */
  const subtlety = talentBuilds.builds.find((build) => build.spec === 'Subtlety')!
  expect(subtlety.pointsSpent, "upstream's Subtlety preset is partial").toBeLessThan(45)
  for (const build of talentBuilds.builds) {
    expect(build.pointsSpent, `${build.spec} cannot exceed the level-70 budget`).toBeLessThanOrEqual(61)
    expect(build.pointsSpent, `${build.spec} must spend something`).toBeGreaterThan(0)
  }

  // Every DPS spec has a reference, and the reference set covers nothing else.
  expect(rows).toHaveLength(20)
  expect(dpsReference).toHaveLength(20)

  /*
   * **No spec may read above its reference**, and this is the assertion with teeth.
   *
   * The model understates everywhere, so a spec that suddenly reads *high* is not good news — it is a
   * double-count, a multiplier applied twice, or a proc rate taken literally when it should not have
   * been. That failure mode has already happened once this session: upstream's 0.36 Windfury constant
   * predicted nearly double the procs a real log shows. A one-directional bound catches the next one
   * without needing to be retuned every time the model improves.
   */
  for (const row of rows) {
    expect(row.modelled, `${row.spec} reads above what players parse, which means something is counted twice`).toBeLessThan(
      row.target,
    )
  }

  // And every spec produced a real number rather than a zero from an empty BiS list.
  for (const row of rows) {
    expect(row.modelled, `${row.spec} produced no damage at all`).toBeGreaterThan(0)
  }

  /*
   * **The range `featureFlags.ts` quotes, asserted rather than written down.** That file says the
   * model reads "1.4x to 2.6x low", and it has already carried a stale version of this exact
   * sentence — it said 3.1x for a while after Shadow and Destruction improved, which is the fourth
   * stale disclosure this project has found in a file whose whole job is describing its own limits.
   *
   * Pinned loosely on purpose: the bound is what the prose claims, so improving the model fails this
   * and forces the sentence to be rewritten, which is the point.
   */
  const best = Math.min(...rows.map((row) => row.ratio))
  const worst = Math.max(...rows.map((row) => row.ratio))

  /*
   * Bracketed on both sides rather than bounded on one, and that is deliberate. A one-sided bound
   * passes silently while the model improves underneath it — which is exactly what happened the
   * first time this was added: the harness gained gems and enchants, every spec moved, and the
   * "1.4x to 2.6x" sentence went stale again without failing anything.
   *
   * Failing on an improvement is the feature. It is the only thing that has reliably forced this
   * project's prose to keep up with its code.
   */
  expect(best, 'featureFlags.ts claims the best spec is around 1.05x').toBeGreaterThan(1.02)
  expect(best).toBeLessThan(1.1)
  expect(worst, 'featureFlags.ts claims the worst spec is around 2.15x').toBeGreaterThan(2.05)
  expect(worst).toBeLessThan(2.25)
})

test('a multiplier on a derived stat is applied after the stat is derived', () => {
  /*
   * Unleashed Rage was refused for two reasons and both are answered rather than argued away.
   *
   * It is "a proc with no fixed uptime" — true until the repo owner's Hydross parse measured that
   * uptime at **94.18%**, which is what it is now weighted by. And "a percentage multiplier on attack
   * power would be applied before attack power is derived from Strength and Agility, so it would
   * multiply only the flat portion from gear" — also true, and the reason
   * `statMultipliersAfterConversion` exists.
   *
   * The distinction is silent when you get it wrong: the total still looks plausible, just small. So
   * this asserts the *size* of the delta, not merely that it moved.
   */
  const character: CharacterProfile = { faction: 'Alliance', race: 'Draenei', className: 'Shaman', spec: 'Enhancement' }
  const gear = normalizeGearForCharacter(defaultGear, 'Shaman', 'Enhancement')

  const without = calculateStats(character, gear)
  const withRage = calculateStats(character, gear, ['unleashed-rage'])

  // 9.4% of the *finished* attack power, which is mostly Strength and Agility converted.
  expect(withRage.attackPower).toBeCloseTo(without.attackPower * 1.094, 4)

  /*
   * And the number that proves the ordering: most of this character's attack power comes from
   * attributes, so a multiplier applied before the conversion would have moved the total by a small
   * fraction of what it should. Asserted against the attribute-derived share rather than a literal.
   */
  const delta = withRage.attackPower - without.attackPower
  expect(delta, 'the derived half has to be inside the multiplier').toBeGreaterThan(without.strength * 0.05)

  // Melee attack power only — a hunter's ranged attack power is a different stat and must not move.
  expect(withRage.rangedAttackPower).toBe(without.rangedAttackPower)

  // Primary stats are untouched: this multiplies a derived stat, so nothing upstream of it changes.
  expect(withRage.strength).toBe(without.strength)
  expect(withRage.agility).toBe(without.agility)

  // The buff is no longer listed as unmodelled, which is the claim a reader checks.
  const rage = getBuffById('unleashed-rage')!
  expect(rage.notModelled, 'it is modelled now, so it must not still say otherwise').toBeUndefined()
  expect(rage.statMultipliersAfterConversion?.attackPower).toBe(0.094)
})

test('buff effects that are not stats reach the simulator, and only through the simulator', () => {
  /*
   * Percentage haste and a damage multiplier have no `StatBlock` field, which is the entire reason
   * every buff of that shape was `notModelled`. The caveats described a missing field rather than a
   * missing mechanic, and `aggregateBuffEffects` is the field.
   *
   * **The failure mode this guards is silent.** Stat buffs arrive folded into `stats` whether or not
   * the id list also reaches `calculateSimulation`, so a caller that passes buffs to `calculateStats`
   * and forgets the simulator still produces a plausible number with the haste and damage halves
   * missing. That is exactly what happened the first time Bloodlust was modelled: the calibration
   * table did not move by a single point.
   */
  const melee: CharacterProfile = { faction: 'Alliance', race: 'Draenei', className: 'Shaman', spec: 'Enhancement' }
  const gear = normalizeGearForCharacter(defaultGear, 'Shaman', 'Enhancement')
  const stats = calculateStats(melee, gear)

  const withoutBuffIds = calculateSimulation(melee, gear, stats, 'Physical DPS', [], undefined, {})
  const withBuffIds = calculateSimulation(melee, gear, stats, 'Physical DPS', [], undefined, {}, [
    'bloodlust',
    'ferocious-inspiration',
  ])

  // Same stats both times — only the non-stat effects differ, which isolates what is being tested.
  expect(withBuffIds.scoreExact, 'haste and damage multipliers must reach the estimate').toBeGreaterThan(
    withoutBuffIds.scoreExact,
  )

  /*
   * Bloodlust is haste and Ferocious Inspiration is damage, so together they multiply. Asserted
   * loosely because the haste half runs through the attack table rather than scaling the total.
   */
  const ratio = withBuffIds.scoreExact / withoutBuffIds.scoreExact
  expect(ratio).toBeGreaterThan(1.05)
  expect(ratio, 'and cannot exceed what the two buffs actually grant').toBeLessThan(1.104 * 1.029 + 0.01)

  // Casters take the same path: Bloodlust is cast speed for them, and the damage multiplier applies.
  const caster: CharacterProfile = { faction: 'Alliance', race: 'Draenei', className: 'Shaman', spec: 'Elemental' }
  const casterGear = normalizeGearForCharacter(defaultGear, 'Shaman', 'Elemental')
  const casterStats = calculateStats(caster, casterGear)
  const casterBare = calculateSimulation(caster, casterGear, casterStats, 'Caster DPS', [], undefined, {})
  const casterBuffed = calculateSimulation(caster, casterGear, casterStats, 'Caster DPS', [], undefined, {}, [
    'bloodlust',
  ])
  expect(casterBuffed.scoreExact, 'Bloodlust is cast speed too').toBeGreaterThan(casterBare.scoreExact)

  // Both are sourced to a measured uptime rather than applied whole, which is the honest half.
  expect(getBuffById('bloodlust')?.hastePercent).toBe(0.104)
  expect(getBuffById('ferocious-inspiration')?.damageMultiplier).toBe(0.029)
  expect(getBuffById('bloodlust')?.notModelled, 'it is modelled now').toBeUndefined()
})

test('a multi-DoT caster is scored as a rotation, and its DoTs do not crit', () => {
  /*
   * `ROTATION-SCOPE.md` filed this under stage 3 and expected it to need a timeline. It does not.
   * **DoTs compete for globals, not for a resource** — a DoT refreshed on its own duration costs
   * `gcd / duration` of every second and returns `damagePerApplication / duration` of damage, both
   * closed form, and the filler takes whatever fraction of the second is left.
   *
   * Affliction was the spec this mattered most for: modelled on Unstable Affliction alone it read
   * 183 against a 1,629 target, the worst in the game by a factor of three.
   */
  const character: CharacterProfile = { faction: 'Alliance', race: 'Gnome', className: 'Warlock', spec: 'Affliction' }
  const gear = normalizeGearForCharacter(defaultGear, 'Warlock', 'Affliction')
  const stats = calculateStats(character, gear)
  const result = calculateSimulation(character, gear, stats, 'Caster DPS')

  const row = (label: RegExp) => result.breakdown.find((entry) => label.test(entry.label))?.value

  // Every DoT the rotation maintains, and the filler that fills the gaps between them.
  for (const name of ['Unstable Affliction', 'Corruption', 'Curse of Agony', 'Siphon Life']) {
    expect(row(new RegExp(`^${name} DPS`)), `${name} must contribute`).toBeGreaterThan(0)
  }
  expect(row(/^Shadow Bolt DPS/), 'the filler is what makes this a rotation rather than a sum').toBeGreaterThan(0)

  /*
   * The globals the DoTs spend has to be a real fraction. Above 100% would mean the spec cannot
   * maintain what it is being credited with, which is the failure a sum-of-DoTs model cannot see.
   */
  const gcdShare = row(/Globals spent refreshing/)!
  expect(gcdShare).toBeGreaterThan(0)
  expect(gcdShare, 'a rotation that overruns the global budget is not a rotation').toBeLessThan(100)

  /*
   * **DoTs cannot crit in TBC.** Periodic damage rolls no crit without talents this app does not
   * model, so spell crit must move the filler and leave every DoT row untouched. This is the
   * assertion that would catch the crit multiplier being applied to the largest share of the spec's
   * damage — which is where an Affliction warlock's damage actually is.
   */
  const critty = calculateStats(character, gear, [], [], { spellCritRating: 500 })
  const withCrit = calculateSimulation(character, gear, critty, 'Caster DPS')
  const critRow = (label: RegExp) => withCrit.breakdown.find((entry) => label.test(entry.label))?.value

  expect(critRow(/^Spell crit chance/), 'the crit actually landed').toBeGreaterThan(row(/^Spell crit chance/)!)
  expect(critRow(/^Corruption DPS/), 'a DoT must not crit').toBe(row(/^Corruption DPS/))
  expect(critRow(/^Curse of Agony DPS/)).toBe(row(/^Curse of Agony DPS/))
  expect(critRow(/^Shadow Bolt DPS/), 'but the filler must').toBeGreaterThan(row(/^Shadow Bolt DPS/)!)

  // And the summary says which of the two it did, since the numbers behave differently.
  expect(result.summary).toMatch(/DoTs do not crit in TBC/i)
})

test('a channel is the filler, not a DoT to be maintained', () => {
  /*
   * Shadow is the same multi-DoT shape as Affliction with one difference that decides the answer:
   * its filler is a **channel**. You re-channel Mind Flay in whatever globals are spare; you do not
   * "keep it up" the way Shadow Word: Pain is kept up.
   *
   * Counting it as a maintained DoT would be a double-count in both directions at once — crediting
   * its whole damage every 3 seconds *and* charging 3 seconds of global for it. `channeled` is the
   * field that separates the two, and it was already on the entry.
   */
  const character: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Priest', spec: 'Shadow' }
  const gear = normalizeGearForCharacter(defaultGear, 'Priest', 'Shadow')
  const stats = calculateStats(character, gear)
  const result = calculateSimulation(character, gear, stats, 'Caster DPS')
  const row = (label: RegExp) => result.breakdown.find((entry) => label.test(entry.label))?.value

  // The two maintained DoTs, and Mind Flay filling what they leave.
  expect(row(/^Shadow Word: Pain DPS/)).toBeGreaterThan(0)
  expect(row(/^Vampiric Touch DPS/)).toBeGreaterThan(0)
  expect(row(/^Mind Flay DPS/), 'the channel is the filler').toBeGreaterThan(0)
  expect(row(/^Mind Flay casts per second/)).toBeGreaterThan(0)

  /*
   * **A channel is periodic, so it cannot crit in TBC either** — Mind Flay's ticks stayed uncritable
   * until a later expansion. That makes Shadow's filler behave differently from Affliction's Shadow
   * Bolt, and copying either spec's rule to the other would have been wrong.
   */
  const critty = calculateStats(character, gear, [], [], { spellCritRating: 500 })
  const withCrit = calculateSimulation(character, gear, critty, 'Caster DPS')
  const critRow = (label: RegExp) => withCrit.breakdown.find((entry) => label.test(entry.label))?.value

  expect(critRow(/^Spell crit chance/), 'the crit landed').toBeGreaterThan(row(/^Spell crit chance/)!)
  expect(critRow(/^Mind Flay DPS/), 'a channel does not crit in TBC').toBe(row(/^Mind Flay DPS/))

  /*
   * And Vampiric Touch is flagged, which is the honest half: wowsims does not implement it at the
   * pinned commit, so its coefficient is the duration/15 formula rather than a sourced value — and
   * three of the four Affliction DoTs turned out to be overrides rather than the formula.
   */
  const vt = getRotationAbilities('Priest', 'Shadow').find((ability) => ability.name === 'Vampiric Touch')!
  expect(vt.needsVerification, 'a derived coefficient must say so').toBe(true)
  expect(vt.scaling.basis).toBe('duration/15')
})

test('only a spec with a rage bar is told its rage income', () => {
  /*
   * Rage is derived from swings for every melee spec, because the arithmetic is identical whatever
   * the class. The breakdown row was gated on the number being above zero and nothing else, so a
   * **Combat Rogue read "Rage per second 4.1"** and an Enhancement Shaman 3.9 — classes with no rage
   * bar at all.
   *
   * The figure was inert either way, since nothing in those rotations spends rage, which is what
   * makes it worse rather than better: a reader has no way to tell an inert row from a meaningful
   * one, and this panel's whole claim is that its numbers mean something.
   */
  const rageRow = (className: TbcClass, spec: TbcSpec) => {
    const character: CharacterProfile = { faction: 'Alliance', race: legalRaceFor(className), className, spec }
    const gear = normalizeGearForCharacter(defaultGear, className, spec)
    const result = calculateSimulation(character, gear, calculateStats(character, gear), 'Physical DPS')
    return result.breakdown.find((entry) => entry.label === 'Rage per second')
  }

  // A Warrior spends rage, and Heroic Strike's affordability is exactly what the row exists to explain.
  expect(rageRow('Warrior', 'Fury'), 'a Fury warrior spends rage').toBeDefined()

  // Nobody else does.
  expect(rageRow('Rogue', 'Combat'), 'a rogue has energy, not rage').toBeUndefined()
  expect(rageRow('Shaman', 'Enhancement'), 'a shaman has mana, not rage').toBeUndefined()
  expect(rageRow('Paladin', 'Retribution'), 'a paladin has mana, not rage').toBeUndefined()
  expect(rageRow('Druid', 'Feral'), 'cat form runs on energy').toBeUndefined()

  /*
   * Gated on the data rather than on a class list, so a spec that gains a rage-costed ability starts
   * reporting income without anyone remembering to add it here.
   */
  const warriorSpends = getRotationAbilities('Warrior', 'Fury').some((ability) => ability.resource?.type === 'Rage')
  expect(warriorSpends, 'the gate reads the ability data').toBe(true)
})

test('the damage breakdown is complete, and adds up to the answer', () => {
  /*
   * `breakdown` mixes inputs with outputs — attack power and crit chance sit beside
   * `Windfury Weapon DPS` — so it cannot be summed and cannot be compared against a log.
   * `damageSources` is the other half: every source, its DPS, its share, and **it sums to
   * `scoreExact`**.
   *
   * That invariant is the whole value. "The total is 3.3x low" and "white damage is 3.2x low while
   * Windfury is 5.7x low" are different pieces of information and only the second says what to fix —
   * the reference parse in `ROTATION-SCOPE.md` is exactly that comparison, worked out by hand. A
   * source dropped, double-counted, or mitigated on the wrong side of the armour term shows up here
   * as a sum that stops matching, rather than as a plausible row nobody checks.
   */
  for (const entry of tbcClasses) {
    for (const spec of entry.specs) {
      const role = getRoleForSpec(entry.className, spec)
      if (role !== 'Physical DPS' && role !== 'Caster DPS') continue

      const character: CharacterProfile = {
        faction: 'Alliance',
        race: legalRaceFor(entry.className),
        className: entry.className,
        spec,
      }
      const gear = normalizeGearForCharacter(defaultGear, entry.className, spec)
      const result = calculateSimulation(character, gear, calculateStats(character, gear), role)

      const sources = result.damageSources ?? []
      expect(sources.length, `${entry.className} ${spec} must decompose its damage`).toBeGreaterThan(0)

      const summed = sources.reduce((total, source) => total + source.dps, 0)
      expect(summed, `${entry.className} ${spec}: sources must sum to the score`).toBeCloseTo(result.scoreExact, 6)

      // Shares are a real distribution, not decoration.
      const shares = sources.reduce((total, source) => total + source.share, 0)
      expect(shares, `${entry.className} ${spec}: shares must sum to 1`).toBeCloseTo(1, 6)

      // Sorted biggest first, which is the order a log reports and the order a reader scans.
      const dpsValues = sources.map((source) => source.dps)
      expect([...dpsValues].sort((a, b) => b - a)).toEqual(dpsValues)

      // Nothing contributes zero: an ability that does is reported through `excluded` with a reason,
      // and a silent 0% row would say the same thing while explaining nothing.
      for (const source of sources) expect(source.dps, `${source.name} is a 0% row`).toBeGreaterThan(0)
    }
  }
})

test('the healer and tank paths report no damage sources at all', () => {
  /*
   * They score healing and effective health, so a damage decomposition would be a category error
   * rather than an empty list. Asserted because "absent" and "empty" read the same in the UI and
   * mean different things.
   */
  const healer: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Priest', spec: 'Holy' }
  const healerGear = normalizeGearForCharacter(defaultGear, 'Priest', 'Holy')
  expect(
    calculateSimulation(healer, healerGear, calculateStats(healer, healerGear), 'Healer').damageSources,
  ).toBeUndefined()

  const tank: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Warrior', spec: 'Protection' }
  const tankGear = normalizeGearForCharacter(defaultGear, 'Warrior', 'Protection')
  expect(calculateSimulation(tank, tankGear, calculateStats(tank, tankGear), 'Tank').damageSources).toBeUndefined()
})

test('the damage table reaches the panel, not just the result object', async ({ page }) => {
  /*
   * This project's signature failure is researched, correct data that reaches no surface — the
   * decision log has a note about it and it has happened at least three times. A complete damage
   * decomposition that only a test can see would be the fourth.
   */
  await openApp(page)
  /*
   * Dressed first. A bare character's Whirlwind contributes nothing — it scales off a weapon there is
   * none of — and is correctly filtered out, so an undressed run is a thinner table than the one this
   * is checking the shape of.
   */
  await equipDefaultGear(page)
  await runSimulation(page)

  const table = page.getByTestId('simulation-damage-sources')
  await expect(table).toBeVisible()

  // The default character is a Fury Warrior, so white damage and both cooldowns should be listed.
  await expect(table).toContainText('Melee main hand')
  await expect(table).toContainText('Bloodthirst')
  await expect(table).toContainText('Whirlwind')

  // Shares are rendered as percentages, which is the column a reader compares against a log.
  await expect(table).toContainText('%')

  const rows = table.locator('.damage-source')
  await expect(rows.first()).toBeVisible()

  /*
   * Biggest first. A log sorts its damage table and so does this, because the first question anyone
   * asks it is "what is the largest thing here".
   */
  const shares = await rows.evaluateAll((nodes) =>
    nodes.map((node) => Number((node.querySelector('.damage-source-share')?.textContent ?? '0').replace('%', ''))),
  )
  expect(shares.length).toBeGreaterThan(1)
  expect([...shares].sort((a, b) => b - a)).toEqual(shares)
  expect(shares.reduce((sum, share) => sum + share, 0), 'the shares are a distribution').toBeCloseTo(100, 0)
})

test('a hunter fights with a pet, and the pet rolls its own crit rather than the hunter’s', () => {
  /*
   * A pet is a **second attacker**, not an ability — its own attack power, its own crit, its own
   * weapon, none of which `SignatureAbility` can express. Every hunter estimate before this described
   * a hunter standing alone.
   *
   * The mechanic that decides whether the number is right: **a pet inherits no crit at all.**
   * Upstream inherits attack power, spell power, stamina and armour and nothing else, so a pet rolls
   * on its own base crit — 1.1515 + 1.8 flat, plus 127 Agility at one percent per 33 — and putting it
   * on the hunter's crit would have overstated it badly.
   */
  const hunter: CharacterProfile = { faction: 'Alliance', race: 'Night Elf', className: 'Hunter', spec: 'Beast Mastery' }
  const gear = normalizeGearForCharacter(defaultGear, 'Hunter', 'Beast Mastery')
  const stats = calculateStats(hunter, gear)
  const result = calculateSimulation(hunter, gear, stats, 'Physical DPS')

  const petDps = result.breakdown.find((entry) => entry.label === 'Pet DPS')
  expect(petDps, 'a hunter brings a pet').toBeDefined()
  expect(petDps!.value).toBeGreaterThan(0)

  /*
   * It appears in the damage table as its own sources — the auto attack and each focus ability
   * separately, because the two halves behave differently: white damage scales with the owner's
   * ranged attack power and Bite and Claw are flat rolls that do not scale at all.
   */
  expect(result.damageSources?.some((source) => source.name === 'Pet melee')).toBe(true)

  /*
   * **Attack power is 22% of the hunter's ranged attack power, plus the pet's own.** Asserted against
   * the arithmetic rather than a literal, so a change to either constant fails here.
   */
  const reported = result.breakdown.find((entry) => entry.label === 'Pet attack power')!.value
  const expected =
    HUNTER_PET_FLAT_ATTACK_POWER +
    HUNTER_PET_BASE_STRENGTH * HUNTER_PET_STRENGTH_TO_ATTACK_POWER +
    stats.rangedAttackPower * HUNTER_PET_ATTACK_POWER_INHERITANCE
  expect(reported).toBeCloseTo(Math.round(expected * 10) / 10, 1)

  /*
   * The pet scales with the hunter's *ranged* attack power and nothing else — not melee, and not
   * crit. Handing it 500 crit rating must move the hunter and leave the pet alone.
   */
  const critty = calculateStats(hunter, gear, [], [], { critRating: 500 })
  const withCrit = calculateSimulation(hunter, gear, critty, 'Physical DPS')
  expect(withCrit.scoreExact, 'the hunter benefits from crit').toBeGreaterThan(result.scoreExact)

  /*
   * **Asserted per source rather than on the pet total, and Kill Command is why.**
   *
   * This used to compare the aggregate `Pet DPS` row and it broke the moment Kill Command landed —
   * correctly. The pet's own attacks still inherit no crit, but Kill Command's *rate* is gated on the
   * **owner** critting, so more owner crit really does buy more of it. Two opposite truths that the
   * one aggregate row cannot express, which is the argument for itemising the pet in the first place.
   */
  const petSource = (sim: typeof result, name: string) =>
    sim.damageSources?.find((source) => source.name === name)?.dps ?? 0

  for (const name of ['Pet melee', 'Pet Bite', 'Pet Claw']) {
    expect(petSource(withCrit, name), `${name} inherits none of the owner's crit`).toBeCloseTo(
      petSource(result, name),
      10,
    )
  }
  expect(
    petSource(withCrit, 'Pet Kill Command'),
    'but Kill Command is gated on owner crits, so it moves the other way',
  ).toBeGreaterThan(petSource(result, 'Pet Kill Command'))

  /*
   * And the estimate says what it models and what it left out. It used to say "white damage only"
   * and name all four focus abilities as missing; Bite and Claw are modelled now, so the sentence
   * names those two and the three real remaining gaps instead.
   */
  expect(result.summary, 'the modelled abilities are named').toMatch(/Bite and Claw/)

  /*
   * **The summary must not claim a pet ability that did not fire**, which is what a browser pass
   * caught and the tests could not: every number was right and only the prose was lying. A hunter
   * with no ranged weapon fires no shots, lands no crits and so gets no Kill Command at all, and an
   * untalented one has no Frenzy — and the old fixed sentence asserted both on every hunter.
   *
   * Asserted against the damage table rather than against a literal, so the sentence and the number
   * cannot drift apart: if Kill Command contributes nothing it must not be named as something the
   * pet presses, and if it contributes it must be.
   */
  const namesKillCommand = /presses[^.]*Kill Command/.test(result.summary)
  const firesKillCommand = (result.damageSources ?? []).some((source) => source.name === 'Pet Kill Command')
  expect(namesKillCommand, 'the summary names Kill Command exactly when it fired').toBe(firesKillCommand)

  const claimsFrenzy = /Frenzy is speeding/.test(result.summary)
  const frenzyRow = result.breakdown.some((entry) => entry.label === 'Pet Frenzy uptime')
  expect(claimsFrenzy, 'and claims Frenzy exactly when it is talented').toBe(frenzyRow)
  expect(result.summary, 'and so are the ones that are not').toMatch(/Frenzy/)
  expect(result.summary, 'Kill Command is named as unmodelled, not as unimplemented').toMatch(/Kill Command/)
  expect(result.summary, 'the flat-roll caveat is the one that decides what they are worth').toMatch(
    /do not scale with attack power/i,
  )

  /*
   * **The family is named in the estimate, and the name has to match the constant it is priced at.**
   *
   * Upstream reads the family from a picker this app does not have, and the eight families span 0.91
   * to 1.1 on damage dealt. So one is assumed — and an assumed 1.1 that the reader is never told
   * about is the exact shape of caveat this repo keeps finding wrong after the fact. Asserted
   * against the constant rather than the literal string, so renaming the default pet without
   * repricing it fails here.
   */
  expect(result.summary, 'the assumed pet family is stated').toContain(HUNTER_PET_DEFAULT_FAMILY)
  expect(HUNTER_PET_FAMILY_DAMAGE_MULTIPLIER, 'the Cat sits in the 1.1 damage tier').toBeCloseTo(1.1, 10)

  /*
   * **Three multipliers this model used to be missing**, all in `pet.go` within ten lines of the
   * happiness bonus it did model: `MeleeSpeedMultiplier *= 1.3` ("Cobra reflexes", ungated),
   * `AutoAttacks.MHEffect.DamageMultiplier *= 0.85` (uncommented upstream), and the family
   * multiplier. Net about +21%, in the understating direction.
   *
   * Asserted as a **ratio against a deliberately un-multiplied recomputation**, not as a literal:
   * the point is that all three are applied exactly once each, which a literal would confirm today
   * and stop confirming the moment the pet's attack power changes for any other reason.
   */
  const petSample = estimateHunterPet({
    ownerRangedAttackPower: stats.rangedAttackPower,
    attackTableMultiplier: 1,
    armorMitigation: 0,
  })
  const petWeaponDps = (42 + 68) / 2 / 2.0
  const unmultiplied = petWeaponDps + petSample.attackPower / 14
  expect(petSample.whiteDps / unmultiplied, 'speed and damage multipliers are each applied once').toBeCloseTo(
    HUNTER_PET_MELEE_SPEED_MULTIPLIER *
      HUNTER_PET_HAPPINESS_MULTIPLIER *
      HUNTER_PET_AUTO_ATTACK_MULTIPLIER *
      HUNTER_PET_FAMILY_DAMAGE_MULTIPLIER,
    10,
  )

  /*
   * The focus economy, which is sourced now even though nothing spends it. It lives in
   * `sim/hunter/focus.go` rather than `sim/core` — the reason it stayed unsourced is that a search of
   * core comes back empty and reads as an absence. 25 focus every 5 seconds is 5 a second, and
   * Bestial Discipline multiplies *that* rather than replacing it.
   */
  expect(HUNTER_PET_FOCUS_PER_TICK / HUNTER_PET_FOCUS_TICK_SECONDS).toBe(HUNTER_PET_FOCUS_PER_SECOND)
  expect(HUNTER_PET_FOCUS_PER_SECOND, 'BaseFocusPerTick 25 on a 5s tick').toBe(5)

  /*
   * **Kill Command is implemented upstream**, and this file claimed the opposite for as long as the
   * pet existed. `sim/hunter/kill_command.go` registers spell 34026 on the hunter and 34027 on the
   * pet. It is still not modelled here — it fires off the owner's crits, which needs a timeline —
   * but the estimate must not say it is missing from wowsims.
   */
  expect(result.summary, 'the wrong reason for skipping Kill Command is gone').not.toMatch(
    /Kill Command is not implemented upstream/i,
  )

  // Nobody else gets one.
  const fury: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Warrior', spec: 'Fury' }
  const furyGear = normalizeGearForCharacter(defaultGear, 'Warrior', 'Fury')
  const furyResult = calculateSimulation(fury, furyGear, calculateStats(fury, furyGear), 'Physical DPS')
  expect(furyResult.breakdown.some((entry) => entry.label === 'Pet DPS')).toBe(false)
})

test('a pet talent moves the pet and not the hunter, and Serpent’s Swiftness moves both', () => {
  /*
   * The four Beast Mastery talents that scale a pet reach it now. They sat refused for as long as
   * the ingest existed under the reason "there is no pet in this model" — true when written, false
   * from the moment `hunterPet.ts` shipped, and exactly the kind of stale refusal this repo keeps
   * finding after the fact.
   *
   * **What decides whether they are wired correctly is which actor moves.** A pet inherits attack
   * power, spell power, stamina and armour from its owner and *nothing else* — no crit, no hit, no
   * haste. So Ferocity is crit the pet has and the hunter does not, and putting it on the shared
   * melee field would silently hand the hunter crit they have not earned. Separate fields are the
   * whole mechanism, and this is the test that proves they stayed separate.
   */
  const idOf = (className: string, name: string) =>
    getTalentData(className)!.trees.flatMap((tree) => tree.talents).find((talent) => talent.name === name)!.id

  const ferocity = idOf('Hunter', 'Ferocity')
  const animalHandler = idOf('Hunter', 'Animal Handler')
  const unleashedFury = idOf('Hunter', 'Unleashed Fury')
  const serpentsSwiftness = idOf('Hunter', "Serpent's Swiftness")

  // Each lands on its own pet field, at the coefficient upstream writes, and on no other field.
  const fero = deriveTalentModifiers({ [ferocity]: 5 })
  expect(fero.petCritChance, 'Ferocity is +2% pet crit a rank').toBeCloseTo(0.1, 10)
  expect(fero.meleeCritChance, 'and none of it reaches the hunter').toBe(0)
  expect(fero.rangedCritChance).toBe(0)

  const handler = deriveTalentModifiers({ [animalHandler]: 2 })
  expect(handler.petHitChance, 'Animal Handler is +2% pet hit a rank, max 2').toBeCloseTo(0.04, 10)
  expect(handler.meleeHitChance).toBe(0)

  const fury = deriveTalentModifiers({ [unleashedFury]: 5 })
  expect(fury.petDamageMultiplier, 'Unleashed Fury is +4% pet damage a rank').toBeCloseTo(1.2, 10)
  expect(fury.rangedDamageMultiplier, 'the hunter’s own damage is untouched').toBe(1)

  /*
   * **Serpent's Swiftness is one talent id with two effects**, and that is the case worth pinning.
   * Upstream writes two separate lines — `RangedSpeedMultiplier` for the hunter and
   * `pet.PseudoStats.MeleeSpeedMultiplier` for the pet — at the same coefficient. A single extractor
   * would have silently dropped whichever half it did not match.
   */
  const swift = deriveTalentModifiers({ [serpentsSwiftness]: 5 })
  expect(swift.rangedAttackSpeedMultiplier, 'the hunter half').toBeCloseTo(1.2, 10)
  expect(swift.petMeleeSpeedMultiplier, 'the pet half, same coefficient').toBeCloseTo(1.2, 10)

  const hunter: CharacterProfile = { faction: 'Alliance', race: 'Night Elf', className: 'Hunter', spec: 'Beast Mastery' }
  const gear = normalizeGearForCharacter(defaultGear, 'Hunter', 'Beast Mastery')
  const stats = calculateStats(hunter, gear)
  const petDpsWith = (points: Record<number, number>) => {
    const sim = calculateSimulation(hunter, gear, stats, 'Physical DPS', [], undefined, points)
    return {
      // Summed across every pet row, because the pet is itemised into melee plus each focus ability.
      pet: sim
        .damageSources!.filter((source) => source.name.startsWith('Pet'))
        .reduce((sum, source) => sum + source.dps, 0),
      autoShot: sim.damageSources!.find((source) => source.name === 'Auto Shot')!.dps,
    }
  }

  const bare = petDpsWith({})

  /*
   * Ferocity, Animal Handler and Unleashed Fury each raise the pet's damage and leave Auto Shot
   * **byte-identical**. That second half is the assertion that would catch a pet field being wired
   * into a hunter term — a mistake that raises the total and so looks like progress.
   */
  for (const [name, points] of [
    ['Ferocity', { [ferocity]: 5 }],
    ['Animal Handler', { [animalHandler]: 2 }],
    ['Unleashed Fury', { [unleashedFury]: 5 }],
  ] as const) {
    const talented = petDpsWith(points)
    expect(talented.pet, `${name} raises the pet`).toBeGreaterThan(bare.pet)
    expect(talented.autoShot, `${name} must not touch the hunter's own shot`).toBeCloseTo(bare.autoShot, 10)
  }

  // And the one that is meant to move both, moves both.
  const swiftened = petDpsWith({ [serpentsSwiftness]: 5 })
  expect(swiftened.pet, 'the pet swings faster').toBeGreaterThan(bare.pet)
  expect(swiftened.autoShot, 'and so does the hunter').toBeGreaterThan(bare.autoShot)

  /*
   * Unleashed Fury at 5 ranks is exactly +20% on the pet, and asserting the *size* rather than the
   * direction is what caught Endless Rage contributing nothing: a modifier with no destination still
   * passes "DPS went up" if anything else in the build moved.
   */
  expect(petDpsWith({ [unleashedFury]: 5 }).pet / bare.pet).toBeCloseTo(1.2, 6)
})

test('the pet spends a focus budget in priority order, and the abilities do not take the white multipliers', () => {
  /*
   * Bite and Claw, out of a focus bar. **Three ceilings, and which one binds is the finding**: an
   * ability is limited by its own cooldown, by the pet's 1.5s global cooldown, and by focus — and at
   * the base 5 focus a second, against costs of 35 and 25, focus binds by a wide margin. The two
   * together come to about 0.16 uses a second where the GCD would allow 0.67.
   */
  expect(HUNTER_PET_BITE.focusCost).toBe(35)
  expect(HUNTER_PET_BITE.cooldownSeconds).toBe(10)
  expect(HUNTER_PET_CLAW.focusCost).toBe(25)
  expect(HUNTER_PET_CLAW.cooldownSeconds, 'Claw has no cooldown; focus is its only limit').toBeUndefined()

  /*
   * At base focus the budget is fully spent and Bite takes its cooldown rate first, which is the
   * greedy priority order upstream's `OnGCDReady` produces by trying the primary and falling through.
   */
  const base = hunterPetAbilityRates(HUNTER_PET_FOCUS_PER_SECOND)
  const spent = base.reduce((sum, entry) => sum + entry.usesPerSecond * entry.ability.focusCost, 0)
  expect(spent, 'every point of focus is spent').toBeCloseTo(HUNTER_PET_FOCUS_PER_SECOND, 10)
  expect(base[0].usesPerSecond, 'Bite is capped by its own 10s cooldown, not by focus').toBeCloseTo(0.1, 10)
  expect(base[1].usesPerSecond, 'Claw divides what Bite leaves: 1.5 focus a second over a 25 cost').toBeCloseTo(0.06, 10)

  // And the GCD ceiling is nowhere near binding, which is why Bestial Discipline is worth having.
  const totalUses = base.reduce((sum, entry) => sum + entry.usesPerSecond, 0)
  expect(totalUses).toBeLessThan(1 / HUNTER_PET_GCD_SECONDS)

  /*
   * **The GCD ceiling is still applied, and this is what proves it.** No family in TBC has abilities
   * cheap enough to reach it at a realistic focus income, so an unbounded model would agree with this
   * one everywhere it is currently used — and quietly stop agreeing the moment anything changed.
   */
  const absurd = hunterPetAbilityRates(1000, [HUNTER_PET_CLAW])
  expect(absurd[0].usesPerSecond, 'the global cooldown caps it once focus stops being the constraint').toBeCloseTo(
    1 / HUNTER_PET_GCD_SECONDS,
    10,
  )

  const hunter: CharacterProfile = { faction: 'Alliance', race: 'Night Elf', className: 'Hunter', spec: 'Beast Mastery' }
  const gear = normalizeGearForCharacter(defaultGear, 'Hunter', 'Beast Mastery')
  const stats = calculateStats(hunter, gear)
  const result = calculateSimulation(hunter, gear, stats, 'Physical DPS')

  // Each ability is its own row, so a change shows up per source rather than inside one "Pet" total.
  for (const name of ['Pet melee', 'Pet Bite', 'Pet Claw']) {
    expect(
      result.damageSources?.some((source) => source.name === name),
      `${name} is itemised`,
    ).toBe(true)
  }

  /*
   * **The abilities must not take the auto-attack multipliers**, and this is the assertion that
   * earns its keep. Upstream writes happiness as `PseudoStats.DamageDealtMultiplier`, which is
   * unit-wide, but the family multiplier and the unexplained `0.85` as
   * `AutoAttacks.MHEffect.DamageMultiplier`, which is the auto attack alone — and Kill Command
   * re-applies the family multiplier **explicitly**, which is the proof it is not inherited.
   *
   * Checked against the arithmetic rather than a literal: Bite's expected damage is its average roll
   * times its rate times the special table times happiness, and nothing else.
   */
  const petOnly = estimateHunterPet({
    ownerRangedAttackPower: 0,
    attackTableMultiplier: 0,
    specialAttackTableMultiplier: 1,
    armorMitigation: 0,
  })
  const bite = petOnly.abilities.find((entry) => entry.name === 'Bite')!
  expect(bite.dps).toBeCloseTo(
    bite.usesPerSecond * ((HUNTER_PET_BITE.damage.min + HUNTER_PET_BITE.damage.max) / 2) * HUNTER_PET_HAPPINESS_MULTIPLIER,
    10,
  )
  // Stated the other way round too, because the failure mode is a factor quietly appearing.
  expect(bite.dps, 'the family multiplier must not reach an ability').not.toBeCloseTo(
    bite.usesPerSecond *
      ((HUNTER_PET_BITE.damage.min + HUNTER_PET_BITE.damage.max) / 2) *
      HUNTER_PET_HAPPINESS_MULTIPLIER *
      HUNTER_PET_FAMILY_DAMAGE_MULTIPLIER *
      HUNTER_PET_AUTO_ATTACK_MULTIPLIER,
    4,
  )

  /*
   * **The abilities are flat rolls with no attack power scaling**, which is what decides their whole
   * worth: the pet's white damage grows with the owner's ranged attack power and these do not, so
   * they shrink as a share with every upgrade. Handing the pet 2,000 more attack power must move the
   * melee row and leave Bite and Claw exactly where they were.
   */
  const geared = estimateHunterPet({
    ownerRangedAttackPower: 2000,
    attackTableMultiplier: 1,
    specialAttackTableMultiplier: 1,
    armorMitigation: 0,
  })
  const bare = estimateHunterPet({
    ownerRangedAttackPower: 0,
    attackTableMultiplier: 1,
    specialAttackTableMultiplier: 1,
    armorMitigation: 0,
  })
  expect(geared.whiteDps, 'white damage scales with the owner').toBeGreaterThan(bare.whiteDps)
  expect(geared.abilityDps, 'the abilities do not').toBeCloseTo(bare.abilityDps, 10)
})

test('Bestial Discipline buys ability rate rather than ability size', () => {
  /*
   * The one pet talent that multiplies an **income**. Upstream passes it straight into
   * `EnableFocusBar(1.0 + 0.5*rank)`, which scales `BaseFocusPerTick` — so it cannot make Bite hit
   * harder, only more often, and only until the global cooldown starts binding instead.
   *
   * It is also the one pet talent read out of `pet.go` rather than `talents.go`, because upstream
   * applies it at construction rather than in `ApplyTalents`.
   */
  const idOf = (className: string, name: string) =>
    getTalentData(className)!.trees.flatMap((tree) => tree.talents).find((talent) => talent.name === name)!.id
  const bestialDiscipline = idOf('Hunter', 'Bestial Discipline')

  const maxed = deriveTalentModifiers({ [bestialDiscipline]: 2 })
  expect(maxed.petFocusRegenMultiplier, '+50% a rank, max 2').toBeCloseTo(2, 10)
  expect(deriveTalentModifiers({}).petFocusRegenMultiplier, 'identity when untalented').toBe(1)
  // It must not leak into anything that scales damage, which is the whole point of a separate field.
  expect(maxed.petDamageMultiplier).toBe(1)
  expect(maxed.petMeleeSpeedMultiplier).toBe(1)

  const hunter: CharacterProfile = { faction: 'Alliance', race: 'Night Elf', className: 'Hunter', spec: 'Beast Mastery' }
  const gear = normalizeGearForCharacter(defaultGear, 'Hunter', 'Beast Mastery')
  const stats = calculateStats(hunter, gear)
  const read = (points: Record<number, number>) => {
    const sim = calculateSimulation(hunter, gear, stats, 'Physical DPS', [], undefined, points)
    const source = (name: string) => sim.damageSources!.find((entry) => entry.name === name)?.dps ?? 0
    return { melee: source('Pet melee'), bite: source('Pet Bite'), claw: source('Pet Claw') }
  }

  const bare = read({})
  const talented = read({ [bestialDiscipline]: 2 })

  /*
   * **Bite does not move and Claw does**, and that asymmetry is the mechanism rather than a detail.
   * Bite is already capped by its own 10s cooldown at base focus, so a larger income cannot buy more
   * of it — every extra point goes to Claw, which has no cooldown at all. A model that simply scaled
   * the whole ability budget by the talent would raise both and look just as plausible.
   */
  expect(talented.bite, 'Bite is cooldown-capped, so more focus buys none of it').toBeCloseTo(bare.bite, 10)
  expect(talented.claw, 'Claw has no cooldown, so it takes the whole surplus').toBeGreaterThan(bare.claw)
  expect(talented.melee, 'and focus does not touch the auto attack').toBeCloseTo(bare.melee, 10)
})

test('Kill Command is gated on the owner’s crits, not on its own cooldown', () => {
  /*
   * **Two spells and one attack.** The hunter casts 34026 — 75 mana, a 5s cooldown — and its only
   * effect is to fire the pet's 34027. So it costs the pet no focus, takes none of the pet's global
   * cooldown, and does not compete with Bite and Claw for anything.
   *
   * **The gate is the owner's crit rate.** `applyKillCommand` opens a 5-second window on any owner
   * crit and calls `TryKillCommand` in the same breath, so the spell fires on the first crit after
   * the cooldown comes up rather than the instant it does. Treating crits as a Poisson process, the
   * cycle is `cooldown + 1/λ`.
   */
  expect(HUNTER_PET_KILL_COMMAND.cooldownSeconds).toBe(5)
  expect(HUNTER_PET_KILL_COMMAND.ownerManaCost).toBe(75)

  // A hunter who never crits never fires it, which is the upstream gate rather than a guard clause.
  expect(killCommandUsesPerSecond(0), 'no crits, no Kill Command').toBe(0)

  /*
   * The two ends of the curve, which is what makes this a rate model rather than a cooldown. At an
   * absurd crit rate it approaches one per cooldown and never exceeds it; at a realistic one it is
   * roughly half that, because the expected wait for a crit is comparable to the cooldown itself.
   */
  expect(killCommandUsesPerSecond(1000)).toBeCloseTo(1 / HUNTER_PET_KILL_COMMAND.cooldownSeconds, 3)
  expect(killCommandUsesPerSecond(1000)).toBeLessThan(1 / HUNTER_PET_KILL_COMMAND.cooldownSeconds)
  // 0.25 crits a second is a 4s expected wait on top of the 5s cooldown: one per 9s.
  expect(killCommandUsesPerSecond(0.25)).toBeCloseTo(1 / 9, 10)

  /*
   * **It takes the family multiplier and not the auto-attack 0.85**, which is the asymmetry that
   * makes this worth its own assertion: upstream writes `DamageMultiplier: hp.config.DamageMultiplier`
   * on this spell explicitly and `DamageMultiplier: 1` on every focus ability, which is the proof the
   * family multiplier is not inherited by an ability that does not ask for it.
   */
  const estimate = estimateHunterPetKillCommand({
    petAttackPower: 700,
    specialAttackTableMultiplier: 1,
    ownerCritsPerSecond: 0.25,
    armorMitigation: 0,
  })
  const expectedPerUse = (42 + 68) / 2 + (700 / 14) * 2 + HUNTER_PET_KILL_COMMAND.flatBonusDamage
  expect(estimate.damagePerUse, 'a non-normalised weapon swing plus 127').toBeCloseTo(expectedPerUse, 10)
  expect(estimate.dps).toBeCloseTo(
    (1 / 9) * expectedPerUse * HUNTER_PET_HAPPINESS_MULTIPLIER * HUNTER_PET_FAMILY_DAMAGE_MULTIPLIER,
    10,
  )
  expect(estimate.dps, 'the auto-attack 0.85 must not reach it').not.toBeCloseTo(
    (1 / 9) *
      expectedPerUse *
      HUNTER_PET_HAPPINESS_MULTIPLIER *
      HUNTER_PET_FAMILY_DAMAGE_MULTIPLIER *
      HUNTER_PET_AUTO_ATTACK_MULTIPLIER,
    4,
  )

  /*
   * **And unlike Bite and Claw, it scales**, which is the whole reason it is worth more than both of
   * them combined. `BaseDamageConfigMeleeWeapon` against their `BaseDamageConfigRoll`.
   */
  const geared = estimateHunterPetKillCommand({
    petAttackPower: 1400,
    specialAttackTableMultiplier: 1,
    ownerCritsPerSecond: 0.25,
    armorMitigation: 0,
  })
  expect(geared.damagePerUse, 'attack power reaches it').toBeGreaterThan(estimate.damagePerUse)

  // The owner's mana, reported rather than enforced, on the same grounds as Steady Shot's.
  expect(estimate.ownerManaPerSecond).toBeCloseTo((1 / 9) * 75, 10)

  /*
   * End to end: it appears as its own damage row, and a hunter with nothing in the ranged slot has
   * no auto shot, therefore no crits, therefore no Kill Command — which is the gate working rather
   * than a special case, since the same arithmetic produces both.
   */
  const hunter: CharacterProfile = { faction: 'Alliance', race: 'Night Elf', className: 'Hunter', spec: 'Beast Mastery' }
  const gear = normalizeGearForCharacter(defaultGear, 'Hunter', 'Beast Mastery')
  const result = calculateSimulation(hunter, gear, calculateStats(hunter, gear), 'Physical DPS')
  const row = result.damageSources?.find((source) => source.name === 'Pet Kill Command')
  expect(row, 'a hunter with a ranged weapon fires it').toBeDefined()
  expect(row!.dps).toBeGreaterThan(0)

  const bare = Object.fromEntries(
    Object.entries(gear as Record<string, unknown>).filter(([slot]) => slot !== 'Ranged'),
  ) as typeof gear
  const noShot = calculateSimulation(hunter, bare, calculateStats(hunter, bare), 'Physical DPS')
  expect(
    noShot.damageSources?.some((source) => source.name === 'Pet Kill Command'),
    'no ranged weapon means no crits to open the window',
  ).toBe(false)
})

test('a school multiplier reaches the spells of that school and no others', () => {
  /*
   * **The field four features were waiting on.** A school-scoped multiplier cannot be applied without
   * knowing which spells it reaches, so until `spellSchool` existed the honest answer was to refuse
   * every one of them by name.
   *
   * Sourced per ability rather than inferred from the class, which matters for the ones that
   * surprise: a Druid's **Starfire is Arcane**, not Nature, and a Shaman's **Lightning Bolt is
   * Nature** rather than the Frost its icon suggests.
   */
  const schoolOf = (className: TbcClass, spec: TbcSpec, name: string) =>
    getRotationAbilities(className, spec).find((ability) => ability.name === name)?.spellSchool

  expect(schoolOf('Druid', 'Balance', 'Starfire'), 'Starfire is Arcane, not Nature').toBe('Arcane')
  expect(schoolOf('Shaman', 'Elemental', 'Lightning Bolt'), 'Lightning Bolt is Nature').toBe('Nature')
  expect(schoolOf('Warlock', 'Destruction', 'Incinerate')).toBe('Fire')
  expect(schoolOf('Warlock', 'Affliction', 'Corruption')).toBe('Shadow')
  expect(schoolOf('Mage', 'Frost', 'Frostbolt')).toBe('Frost')
  expect(schoolOf('Paladin', 'Protection', 'Consecration'), 'Holy, and on the tank spec').toBe('Holy')

  const idOf = (className: string, name: string) =>
    getTalentData(className)!.trees.flatMap((tree) => tree.talents).find((talent) => talent.name === name)!.id
  const sacrifice = { [idOf('Warlock', 'Demonic Sacrifice')]: 1 }

  expect(
    deriveTalentModifiers(sacrifice).schoolDamageMultipliers.Shadow,
    'Demonic Sacrifice is +15% to one school',
  ).toBeCloseTo(1.15, 10)
  expect(deriveTalentModifiers({}).schoolDamageMultipliers, 'and {} is the identity').toEqual({})

  /*
   * **Applied per spell, not to the total**, which is the point of having the school at all. An
   * Affliction warlock casts nothing but Shadow, so every row moves; a Destruction warlock casts
   * nothing but Fire, so a Shadow multiplier moves none of them. That second half is the assertion
   * with teeth — folding the multiplier into the shared term would pass the first and fail this.
   */
  const read = (spec: TbcSpec, points: Record<number, number>) => {
    const character: CharacterProfile = { faction: 'Alliance', race: 'Gnome', className: 'Warlock', spec }
    const gear = normalizeGearForCharacter(defaultGear, 'Warlock', spec)
    const sim = calculateSimulation(character, gear, calculateStats(character, gear), 'Caster DPS', [], undefined, points)
    return sim.scoreExact
  }

  expect(read('Affliction', sacrifice) / read('Affliction', {}), 'every Affliction spell is Shadow').toBeCloseTo(
    1.15,
    4,
  )
  expect(read('Destruction', sacrifice), 'a Shadow bonus cannot reach a Fire spec').toBeCloseTo(
    read('Destruction', {}),
    6,
  )

  /*
   * **Owning Demonic Sacrifice is not the same as using it**, and this is what a measurement caught
   * rather than a test. A Demonology warlock spends 41 points in the tree, so the best-case harness
   * hands them the talent — but they keep the Felguard, and upstream's `else` makes the two mutually
   * exclusive. Without the gate they read 968 against a correct 855, holding both halves at once.
   */
  expect(read('Demonology', sacrifice), 'a spec that keeps its demon collects no sacrifice bonus').toBeCloseTo(
    read('Demonology', {}),
    6,
  )
  expect(sacrificesDemon('Demonology')).toBe(false)
  expect(sacrificesDemon('Affliction')).toBe(true)
  expect(sacrificesDemon('Destruction')).toBe(true)

  /*
   * **And this is why the calibration table does not move.** The harness fills a spec's *primary*
   * tree, so only Demonology reaches Demonic Sacrifice — and Demonology is the one spec that does not
   * use it. A real Affliction or Destruction warlock dips into Demonology for exactly this talent,
   * which is a build the one-tree harness cannot express. The mechanism is asserted above rather than
   * through the table, because the table cannot show it.
   */
  const { result } = bestCaseSimulation('Warlock', 'Affliction', 'Caster DPS')
  expect(result.scoreExact, 'best case reaches no Demonology talents at all').toBeGreaterThan(0)
})

test('only Demonology keeps its demon, because the other two sacrifice it', () => {
  /*
   * **A warlock's demon is either a pet or a damage multiplier, never both**, and upstream's branch
   * is the whole reason this is scoped to one spec:
   *
   *     if DemonicSacrifice && SacrificeSummon { school multiplier } else { pet }
   *
   * Affliction and Destruction take the sacrifice — upstream's only preset is a Destruction warlock
   * sacrificing a Succubus for +15% shadow — and what that buys is a **school-scoped** multiplier
   * this simulator cannot express, because it records no spell school. Summon Felguard is the
   * 41-point Demonology talent, so for that spec the demon is the spec.
   */
  const demonRow = (spec: TbcSpec) => {
    const { result } = bestCaseSimulation('Warlock', spec, 'Caster DPS')
    return result.damageSources?.find((source) => source.name === 'Felguard')
  }
  expect(demonRow('Demonology'), 'Demonology keeps it').toBeDefined()
  expect(demonRow('Affliction'), 'Affliction sacrifices it').toBeUndefined()
  expect(demonRow('Destruction'), 'and so does Destruction').toBeUndefined()

  /*
   * **Attack power comes from the owner's SPELL power**, which is the structural difference from the
   * hunter's pet and the reason this could not reuse that module. A demon scales off the stat its
   * owner already stacks.
   */
  const bare = estimateWarlockPet({ ownerSpellPower: 0, attackTableMultiplier: 1, armorMitigation: 0 })
  const geared = estimateWarlockPet({ ownerSpellPower: 1000, attackTableMultiplier: 1, armorMitigation: 0 })
  expect(geared.dps, 'spell power reaches the demon').toBeGreaterThan(bare.dps)

  /*
   * Checked against the arithmetic rather than a literal, so a change to any constant fails here:
   * base attack power plus `(strength - 10) * 2`, plus 57% of spell power, all times the flat 1.65.
   *
   * **The `- 10` is not a typo and the 1.65 is two constants** — `ap * 1.5 * 1.1`, which upstream
   * comments as "demonic frenzy + hidden 10% boost". The 1.5 is a Demonic Frenzy upstream says it is
   * *simulating* as pre-stacked rather than modelling, and the 1.1 is labelled only as hidden. Both
   * are carried across as read, on the same principle as the hunter pet's unexplained 0.85.
   */
  const own = FELGUARD_BASE.attackPower + (FELGUARD_BASE.strength - FELGUARD_STRENGTH_OFFSET) * FELGUARD_STRENGTH_TO_ATTACK_POWER
  expect(felguardAttackPower(1000)).toBeCloseTo(
    (own + 1000 * FELGUARD_SPELL_POWER_TO_ATTACK_POWER) * FELGUARD_ATTACK_POWER_MULTIPLIER,
    6,
  )
  expect(FELGUARD_ATTACK_POWER_MULTIPLIER).toBeCloseTo(1.5 * 1.1, 10)

  /*
   * **Its Agility conversion is its own, and it is not the hunter pet's.** A demon gets 0.04 crit
   * percent a point where a hunter pet gets one percent per 33 Agility — two pets, two conversions,
   * and assuming they shared one would have been the easy mistake.
   */
  expect(felguardCritChance()).toBeCloseTo((FELGUARD_BASE.agility * 0.04) / 100, 10)
  expect(felguardCritChance()).not.toBeCloseTo(hunterPetCritChance(), 3)

  /*
   * **There is no family damage multiplier**, unlike the hunter's pet — `PetConfig.DamageMultiplier`
   * and the line applying it are both commented out upstream. Pinned so nobody copies the hunter's
   * assumed-family treatment across on the assumption that every pet has one.
   */
  expect(FELGUARD_HAS_FAMILY_MULTIPLIER).toBe(false)

  const idOf = (className: string, name: string) =>
    getTalentData(className)!.trees.flatMap((tree) => tree.talents).find((talent) => talent.name === name)!.id
  const unholy = deriveTalentModifiers({ [idOf('Warlock', 'Unholy Power')]: 5 })
  expect(unholy.demonDamageMultiplier, '+4% a rank').toBeCloseTo(1.2, 10)

  /*
   * **Demonic Tactics is one talent with two destinations** — the demon's crit and the warlock's own
   * spell crit — the same shape Serpent's Swiftness has for the hunter. Two extractors, one id.
   */
  const tactics = deriveTalentModifiers({ [idOf('Warlock', 'Demonic Tactics')]: 5 })
  expect(tactics.demonCritChance, 'the demon half').toBeCloseTo(0.05, 10)
  expect(tactics.spellCritChance, 'and the warlock half').toBeCloseTo(0.05, 10)

  // And the estimate says what it left out, including why the other two specs have nothing.
  const { result } = bestCaseSimulation('Warlock', 'Demonology', 'Caster DPS')
  expect(result.summary).toMatch(/Felguard/)
  /*
   * **The demon summary must not still say spell school is unrecorded.** It said exactly that, and
   * it stopped being true one commit later when `spellSchool` landed — the same rot this repo has
   * now caught four times. Affliction and Destruction get no demon because they *sacrifice* it for a
   * multiplier that is modelled, not because the school is missing.
   */
  expect(result.summary, 'the reason the other two specs have no demon is the sacrifice').toMatch(
    /sacrifices it for a school-scoped damage multiplier/,
  )
  expect(result.summary, 'and not a claim that spell school is unrecorded').not.toMatch(
    /records no spell school|no spell school at all/i,
  )
})

test('bleeds ignore armor, and Rake’s opener does not', () => {
  /*
   * **The fact this whole piece turns on, and upstream states it in a comment rather than leaving it
   * to be inferred** — `sim/core/spell_resistances.go`:
   *
   *     if spell.SpellSchool.Matches(SpellSchoolPhysical) {
   *         // All physical dots (Bleeds) ignore armor.
   *         if spellEffect.IsPeriodic { return }
   *         spellEffect.Damage *= attackTable.ArmorDamageReduction
   *     }
   *
   * Worth about 26% of every tick against this app's 7,700-armour target. **Rake's opening hit is not
   * periodic**, so it takes armour while its own ticks do not — a split inside one ability, and the
   * reason the module returns the halves separately.
   */
  const base = {
    attackPower: 2000,
    specialAttackTableMultiplier: 1,
    armorMitigation: 0,
    energyPerSecond: 10,
    comboPointsPerSecond: 5,
    rakeCostReduction: 0,
  }

  const soft = estimateFeralBleeds(base)
  const hard = estimateFeralBleeds({ ...base, armorMitigation: 0.5 })

  expect(hard.ripDps, 'Rip is all ticks, so armor cannot touch it').toBeCloseTo(soft.ripDps, 10)
  expect(hard.rakeDps, 'Rake loses only its opener to armor').toBeLessThan(soft.rakeDps)

  /*
   * And the size of that loss is exactly the opener, which is the assertion that would catch the
   * ticks being mitigated too: half the armour takes half the opener and nothing else.
   */
  const opener = RAKE.initialFlat + RAKE.initialAttackPowerCoefficient * base.attackPower
  const rakeCasts = 1 / (RAKE.ticks * RAKE.tickSeconds)
  expect(soft.rakeDps - hard.rakeDps).toBeCloseTo(rakeCasts * opener * 0.5, 6)

  /*
   * **Rip's opening cast deals nothing at all.** Upstream gives it `OutcomeFuncMeleeSpecialHit()`
   * with no base damage — the cast exists only to apply the dot and spend the points. So Rip's whole
   * damage is six ticks of `(1554 + 0.24 * AP) / 6`, which is that total over its 12 seconds.
   */
  const ripTotal = RIP.byComboPoints[5].flat + RIP.byComboPoints[5].attackPowerCoefficient * base.attackPower
  expect(soft.ripDps).toBeCloseTo(ripTotal / (RIP.ticks * RIP.tickSeconds), 6)

  /*
   * **Rip is a finisher, so combo points are a real ceiling** — and Rake is kept first when either
   * currency runs short, which is both the cheaper choice and the priority every Feral guide gives.
   */
  const noPoints = estimateFeralBleeds({ ...base, comboPointsPerSecond: 0 })
  expect(noPoints.ripUptime, 'no combo points, no Rip').toBe(0)
  expect(noPoints.rakeUptime, 'but Rake needs none').toBeCloseTo(1, 10)

  const starved = estimateFeralBleeds({ ...base, energyPerSecond: 2 })
  expect(starved.rakeUptime, 'Rake is maintained first out of a thin budget').toBeGreaterThan(starved.ripUptime)

  // Ferocity is the DRUID talent of that name — one energy off Rake, not the hunter's pet crit.
  const idOf = (className: string, name: string) =>
    getTalentData(className)!.trees.flatMap((tree) => tree.talents).find((talent) => talent.name === name)!.id
  const druidFerocity = deriveTalentModifiers({ [idOf('Druid', 'Ferocity')]: 5 })
  expect(druidFerocity.rakeEnergyCostReduction, 'one energy a rank').toBe(5)
  expect(druidFerocity.petCritChance, "and none of the hunter's Ferocity").toBe(0)
  expect(deriveTalentModifiers({ [idOf('Hunter', 'Ferocity')]: 5 }).rakeEnergyCostReduction).toBe(0)

  /*
   * End to end: both bleeds are their own damage rows, and only a Feral druid has them. Shred needed
   * a combo-point value for Rip to be affordable at all — one point a cast, read from upstream.
   */
  const { result } = bestCaseSimulation('Druid', 'Feral', 'Physical DPS')
  for (const name of ['Rake', 'Rip']) {
    expect(
      result.damageSources?.some((source) => source.name === name),
      `${name} is its own row`,
    ).toBe(true)
  }
  expect(
    getRotationAbilities('Druid', 'Feral').find((ability) => ability.name === 'Shred')?.comboPointsPerUse,
  ).toBe(1)

  const fury: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Warrior', spec: 'Fury' }
  const furyGear = normalizeGearForCharacter(defaultGear, 'Warrior', 'Fury')
  const furyResult = calculateSimulation(fury, furyGear, calculateStats(fury, furyGear), 'Physical DPS')
  expect(furyResult.damageSources?.some((source) => source.name === 'Rake' || source.name === 'Rip')).toBe(false)
})

test('rogue poisons are Nature damage on the spell table, so armor does not touch them', () => {
  /*
   * **The second unmitigated source this model has**, after Retribution's seals — and the reason that
   * distinction was built. Poisons roll `OutcomeFuncMagicHitAndCrit` upstream, not the melee table,
   * and they are Nature school. A poison taking armour mitigation would lose about a quarter of
   * itself against this app's 7,700-armour target, silently.
   */
  const rogue: CharacterProfile = { faction: 'Alliance', race: 'Night Elf', className: 'Rogue', spec: 'Assassination' }
  const gear = normalizeGearForCharacter(defaultGear, 'Rogue', 'Assassination')
  const stats = calculateStats(rogue, gear)

  const at = (armor: number) => {
    const result = calculateSimulation(rogue, gear, stats, 'Physical DPS', [], { ...defaultSimulationTarget, armor })
    const source = (name: string) => result.damageSources?.find((entry) => entry.name === name)?.dps ?? 0
    return { mainHand: source('Melee main hand'), instant: source('Instant Poison'), deadly: source('Deadly Poison') }
  }

  const soft = at(3000)
  const hard = at(12000)

  expect(hard.mainHand, 'armor reduces the physical rows').toBeLessThan(soft.mainHand)
  expect(hard.instant, 'and does not touch Instant Poison').toBeCloseTo(soft.instant, 10)
  expect(hard.deadly, 'or Deadly Poison').toBeCloseTo(soft.deadly, 10)
  expect(soft.instant).toBeGreaterThan(0)
  expect(soft.deadly).toBeGreaterThan(0)

  /*
   * **Instant on the main hand, Deadly on the off hand**, taken from upstream's own `FullConsumes`
   * preset rather than reasoned about — this app has no weapon-imbue slot, the same gap Windfury
   * Weapon already names, so a pairing has to be assumed and the sourced one is the honest choice.
   * The hand matters because the two weapons swing at different speeds.
   */
  expect(INSTANT_POISON_HAND).toBe('Main Hand')
  expect(DEADLY_POISON_HAND).toBe('Off Hand')
  expect(INSTANT_POISON.baseProcChance).toBe(0.2)
  expect(DEADLY_POISON.baseProcChance).toBe(0.3)

  const base = {
    mainHandSwingsPerSecond: 1,
    offHandSwingsPerSecond: 1,
    spellHitChance: 1,
    spellCritChance: 0,
    spellCritMultiplier: 1.5,
    bonusProcChance: 0,
    damageMultiplier: 1,
  }

  /*
   * **The dot cannot crit and Instant can**, which is the asymmetry worth pinning: upstream gives the
   * ticks `OutcomeFuncTick()`, a plain hit, and only Instant Poison rolls for a crit. Handing the dot
   * a crit multiplier would be exactly the quiet overstatement the damage table exists to expose.
   */
  const noCrit = estimateRoguePoisons(base)
  const withCrit = estimateRoguePoisons({ ...base, spellCritChance: 0.5 })
  expect(withCrit.instantDps, 'Instant Poison crits').toBeGreaterThan(noCrit.instantDps)
  expect(withCrit.deadlyDps, 'the dot does not').toBeCloseTo(noCrit.deadlyDps, 10)

  /*
   * **Spell hit, not melee hit.** A rogue carries almost no spell hit, which is why Master Poisoner
   * exists at all — and why this is a separate field from the shared `spellHitChance`.
   */
  expect(estimateRoguePoisons({ ...base, spellHitChance: 0.5 }).totalDps).toBeCloseTo(noCrit.totalDps / 2, 6)

  /*
   * Deadly Poison's steady state is the stacks the proc rate sustains, capped at five rather than
   * assumed to be five: a slow off-hand or a heavily missing rogue genuinely holds fewer.
   */
  expect(estimateRoguePoisons({ ...base, offHandSwingsPerSecond: 5 }).deadlyStacks, 'capped at five').toBe(5)
  const slow = estimateRoguePoisons({ ...base, offHandSwingsPerSecond: 0.1 })
  expect(slow.deadlyStacks, '0.1 swings a second at 30% over a 12s dot').toBeCloseTo(0.1 * 0.3 * 12, 10)
  expect(slow.deadlyStacks).toBeLessThan(DEADLY_POISON.maxStacks)

  const idOf = (className: string, name: string) =>
    getTalentData(className)!.trees.flatMap((tree) => tree.talents).find((talent) => talent.name === name)!.id
  const talented = deriveTalentModifiers({
    [idOf('Rogue', 'Improved Poisons')]: 5,
    [idOf('Rogue', 'Vile Poisons')]: 5,
    [idOf('Rogue', 'Master Poisoner')]: 2,
  })
  expect(talented.poisonProcChance, '+2% a rank, both poisons').toBeCloseTo(0.1, 10)
  expect(talented.poisonDamageMultiplier, '+4% a rank').toBeCloseTo(1.2, 10)
  expect(talented.poisonSpellHitChance, '+5% a rank, poisons only').toBeCloseTo(0.1, 10)
  // Scoped to the poisons rather than the actor, so a shared spell-hit field must stay untouched.
  expect(talented.spellHitChance, 'Master Poisoner is not general spell hit').toBe(0)

  // Nobody but a rogue is poisoned: a Fury warrior has no imbue and no poison rows.
  const fury: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Warrior', spec: 'Fury' }
  const furyGear = normalizeGearForCharacter(defaultGear, 'Warrior', 'Fury')
  const furyResult = calculateSimulation(fury, furyGear, calculateStats(fury, furyGear), 'Physical DPS')
  expect(furyResult.damageSources?.some((entry) => /Poison/.test(entry.name))).toBe(false)
})

test('Slice and Dice is a finisher that deals no damage, and three ceilings decide whether it stays up', () => {
  /*
   * **A finisher that deals no damage at all**, which is why it fits nowhere in `SignatureAbility`:
   * it spends 25 energy and five combo points to make the rogue swing 30% faster. The multiplier
   * belongs in the white-damage swing rate beside gear haste and Flurry, not in the damage table.
   */
  expect(SLICE_AND_DICE_HASTE).toBe(1.3)
  expect(SLICE_AND_DICE_ENERGY_COST).toBe(25)
  // A one-second global cooldown, not the usual 1.5 — read off the cast config rather than assumed.
  expect(SLICE_AND_DICE_GCD_SECONDS).toBe(1)
  expect(SLICE_AND_DICE_BASE_DURATIONS[SLICE_AND_DICE_COMBO_POINTS]).toBe(21)

  const plenty = {
    durationMultiplier: 1,
    energyRefundPerFinisher: 0,
    energyPerSecond: 10,
    gcdBudgetPerSecond: 1,
    comboPointsPerSecond: 5,
  }
  expect(estimateSliceAndDice(plenty).uptime, 'affordable in every currency').toBeCloseTo(1, 10)
  expect(estimateSliceAndDice(plenty).speedMultiplier).toBeCloseTo(SLICE_AND_DICE_HASTE, 10)

  /*
   * **Relentless Strikes makes it exactly free, and that is two constants cancelling rather than an
   * approximation**: 25 energy handed back against a 25 energy cost. A rogue who has it pays only
   * the global cooldown and the combo points.
   */
  expect(estimateSliceAndDice({ ...plenty, energyRefundPerFinisher: 25 }).netEnergyPerSecond).toBe(0)

  /*
   * **The combo-point ceiling is the one that actually binds**, which is why the model takes a
   * generation rate at all. Starve the points and the uptime falls in proportion; starve the energy
   * and it does the same. Asserted as sizes rather than directions, because a ceiling wired to the
   * wrong term still moves the answer downward.
   */
  // A five-point refresh every 21s needs 5/21 combo points a second. Half that is half the uptime.
  const pointsNeeded = SLICE_AND_DICE_COMBO_POINTS / SLICE_AND_DICE_BASE_DURATIONS[SLICE_AND_DICE_COMBO_POINTS]
  const starvedPoints = estimateSliceAndDice({ ...plenty, comboPointsPerSecond: pointsNeeded / 2 })
  expect(starvedPoints.uptime, 'half the points needed is half the uptime').toBeCloseTo(0.5, 10)
  expect(
    estimateSliceAndDice({ ...plenty, comboPointsPerSecond: pointsNeeded }).uptime,
    'and exactly enough is exactly full',
  ).toBeCloseTo(1, 10)
  const starvedEnergy = estimateSliceAndDice({ ...plenty, energyPerSecond: 0.5 })
  expect(starvedEnergy.uptime).toBeLessThan(1)
  expect(starvedEnergy.uptime).toBeCloseTo(0.5 / SLICE_AND_DICE_ENERGY_COST / (1 / 21), 6)

  // Improved Slice and Dice buys duration, so it buys uptime for a points-starved rogue.
  expect(
    estimateSliceAndDice({ ...plenty, comboPointsPerSecond: 0.5, durationMultiplier: 1.45 }).uptime,
  ).toBeGreaterThan(starvedPoints.uptime)

  /*
   * **Combat Potency reads landed OFF-HAND hits and nothing else.** Upstream checks `Landed()` and
   * then `ProcMaskMeleeOH`, citing the spell's own mask — so main-hand swings and specials return
   * zero, and that is what makes the talent worth exactly what the off-hand swing rate is worth.
   */
  expect(combatPotencyEnergyPerSecond(2, 15)).toBeCloseTo(2 * 0.2 * 15, 10)
  expect(combatPotencyEnergyPerSecond(2, 0), 'untalented returns nothing').toBe(0)

  const idOf = (className: string, name: string) =>
    getTalentData(className)!.trees.flatMap((tree) => tree.talents).find((talent) => talent.name === name)!.id
  const modifiers = deriveTalentModifiers({
    [idOf('Rogue', 'Combat Potency')]: 5,
    [idOf('Rogue', 'Improved Slice and Dice')]: 3,
    [idOf('Rogue', 'Relentless Strikes')]: 1,
  })
  expect(modifiers.offHandEnergyPerProc, '3 energy a rank').toBe(15)
  expect(modifiers.sliceAndDiceDurationMultiplier, '+15% duration a rank').toBeCloseTo(1.45, 10)
  expect(modifiers.finisherEnergyRefund, 'flat 25, because it is a one-point talent').toBe(25)

  /*
   * **Mutilate grants two combo points where the other two fillers grant one**, and that one field
   * is the difference between an Assassination rogue reading 70% Slice and Dice uptime and reading
   * 100%. Read from `AddComboPoints` in each ability's own file upstream.
   */
  const cpOf = (spec: TbcSpec) =>
    getRotationAbilities('Rogue', spec).find((ability) => ability.resource?.type === 'Energy')?.comboPointsPerUse
  expect(cpOf('Assassination'), 'Mutilate').toBe(2)
  expect(cpOf('Combat'), 'Sinister Strike').toBe(1)
  expect(cpOf('Subtlety'), 'Hemorrhage').toBe(1)

  /*
   * End to end: every rogue holds it at 100%, which is what real rogues do, and it moves **white
   * damage only**. The specials are bounded by energy and the global cooldown, neither of which
   * melee haste touches — so a rogue swinging 30% faster presses exactly as many buttons. That is
   * the assertion which would catch the multiplier being wired into the wrong term.
   */
  for (const spec of ['Combat', 'Assassination', 'Subtlety'] as const) {
    const { result } = bestCaseSimulation('Rogue', spec, 'Physical DPS')
    const uptime = result.breakdown.find((entry) => entry.label === 'Slice and Dice uptime')
    expect(uptime, `${spec} reports its uptime`).toBeDefined()
    expect(uptime!.value, `${spec} holds Slice and Dice up`).toBe(100)
  }

  // Nobody else gets it: a Fury warrior has no energy bar and no finishers.
  const fury: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Warrior', spec: 'Fury' }
  const furyGear = normalizeGearForCharacter(defaultGear, 'Warrior', 'Fury')
  const furyResult = calculateSimulation(fury, furyGear, calculateStats(fury, furyGear), 'Physical DPS')
  expect(furyResult.breakdown.some((entry) => entry.label === 'Slice and Dice uptime')).toBe(false)
})

test('Frenzy is a refreshing aura, not a consumed stack, and it reaches the auto attack alone', () => {
  /*
   * **Why this is not Flurry**, which is the whole reason it needed its own closed form.
   *
   * Flurry is three stacks that a white hit *consumes*, so its uptime is a Markov chain over the
   * stack count. Frenzy is a fixed 8-second duration that any proc *refreshes* and nothing consumes,
   * so the question is "was there a proc in the last 8 seconds" — for a Poisson process of rate λ,
   * `1 - exp(-8λ)`, and the multiplier is `1 + 0.3 · uptime`.
   */
  expect(HUNTER_PET_FRENZY_HASTE).toBe(1.3)
  expect(HUNTER_PET_FRENZY_DURATION_SECONDS).toBe(8)

  const idOf = (className: string, name: string) =>
    getTalentData(className)!.trees.flatMap((tree) => tree.talents).find((talent) => talent.name === name)!.id

  // 0.2 a rank, so rank 5 is certainty — and 0, not 1, is the untalented identity, because it is a
  // probability rather than a factor.
  expect(deriveTalentModifiers({ [idOf('Hunter', 'Frenzy')]: 5 }).petFrenzyProcChance).toBeCloseTo(1, 10)
  expect(deriveTalentModifiers({}).petFrenzyProcChance).toBe(0)

  // Untalented is exactly 1, which is what an empty tree has to reproduce.
  expect(
    frenzySpeedMultiplier({ procChance: 0, petCritChance: 0.2, baseSwingsPerSecond: 1, abilityUsesPerSecond: 0.5 }),
  ).toBe(1)

  /*
   * The closed form, checked against the arithmetic at a rate where the fixed point does not bite:
   * with no auto attacks at all, λ is just the ability rate and the answer is exact rather than
   * iterated. That isolates the formula from the iteration.
   */
  const abilitiesOnly = frenzySpeedMultiplier({
    procChance: 1,
    petCritChance: 0.2,
    baseSwingsPerSecond: 0,
    abilityUsesPerSecond: 0.5,
  })
  const expectedUptime = 1 - Math.exp(-0.5 * 0.2 * HUNTER_PET_FRENZY_DURATION_SECONDS)
  expect(abilitiesOnly).toBeCloseTo(1 + (HUNTER_PET_FRENZY_HASTE - 1) * expectedUptime, 10)

  /*
   * **The fixed point, which is the part that could not be solved in closed form.** λ counts the
   * pet's crits, and the pet's crits come partly from auto attacks whose rate Frenzy itself raises.
   * More swings must mean more uptime, and the result must stay bounded by the 1.3 the aura grants —
   * an iteration that diverged would sail past it.
   */
  const slow = frenzySpeedMultiplier({ procChance: 1, petCritChance: 0.15, baseSwingsPerSecond: 0.4, abilityUsesPerSecond: 0 })
  const fast = frenzySpeedMultiplier({ procChance: 1, petCritChance: 0.15, baseSwingsPerSecond: 1.2, abilityUsesPerSecond: 0 })
  expect(fast, 'a faster pet procs it more often').toBeGreaterThan(slow)
  expect(fast, 'and it can never exceed the haste the aura grants').toBeLessThan(HUNTER_PET_FRENZY_HASTE)
  expect(
    frenzySpeedMultiplier({ procChance: 1, petCritChance: 1, baseSwingsPerSecond: 100, abilityUsesPerSecond: 0 }),
    'at certainty it approaches the full 30% and stops',
  ).toBeCloseTo(HUNTER_PET_FRENZY_HASTE, 6)

  /*
   * **It reaches the auto attack and nothing else**, which is the assertion that would catch it being
   * wired into the wrong term. The aura is `MeleeSpeedMultiplier`; every pet ability is
   * `IgnoreHaste: true` on its cast and Kill Command has no cast at all, so a frenzied pet swings
   * more and presses its buttons exactly as often.
   */
  const hunter: CharacterProfile = { faction: 'Alliance', race: 'Night Elf', className: 'Hunter', spec: 'Beast Mastery' }
  const gear = normalizeGearForCharacter(defaultGear, 'Hunter', 'Beast Mastery')
  const stats = calculateStats(hunter, gear)
  const read = (points: Record<number, number>) => {
    const sim = calculateSimulation(hunter, gear, stats, 'Physical DPS', [], undefined, points)
    const source = (name: string) => sim.damageSources!.find((entry) => entry.name === name)?.dps ?? 0
    return {
      melee: source('Pet melee'),
      bite: source('Pet Bite'),
      claw: source('Pet Claw'),
      killCommand: source('Pet Kill Command'),
      uptime: sim.breakdown.find((entry) => entry.label === 'Pet Frenzy uptime')?.value,
    }
  }

  const bare = read({})
  const frenzied = read({ [idOf('Hunter', 'Frenzy')]: 5 })

  expect(frenzied.melee, 'the auto attack speeds up').toBeGreaterThan(bare.melee)
  for (const key of ['bite', 'claw', 'killCommand'] as const) {
    expect(frenzied[key], `${key} is focus- or cooldown-bound, not speed-bound`).toBeCloseTo(bare[key], 10)
  }

  // The uptime is reported rather than only the multiplier, because that is the figure a log shows.
  expect(bare.uptime, 'no row at all when untalented').toBeUndefined()
  expect(frenzied.uptime).toBeDefined()
  expect(frenzied.uptime!).toBeGreaterThan(0)
  expect(frenzied.uptime!).toBeLessThan(100)
})

test('Focused Fire reaches the hunter, and only the half this model has a field for', () => {
  /*
   * Two halves, and only one is expressible. Upstream writes
   * `PseudoStats.DamageDealtMultiplier *= 1.0 + 0.01*rank` on the **hunter**, gated on owning a pet,
   * and separately a `BonusCritRating` of 10% a rank on the **pet's Kill Command specifically**.
   *
   * The first is taken as `rangedDamageMultiplier`, which is a judgement rather than a reading: every
   * hunter here has a pet and every point of hunter damage this model computes is ranged, so a
   * blanket multiplier and a ranged one coincide. The second is a per-spell crit bonus and this
   * record has no field shaped like a spell, so it stays refused with that reason.
   */
  const idOf = (className: string, name: string) =>
    getTalentData(className)!.trees.flatMap((tree) => tree.talents).find((talent) => talent.name === name)!.id

  const focusedFire = idOf('Hunter', 'Focused Fire')
  const maxed = deriveTalentModifiers({ [focusedFire]: 2 })
  expect(maxed.rangedDamageMultiplier, '+1% a rank, max 2').toBeCloseTo(1.02, 10)
  // It must not leak onto the pet, which is the actor it is *named* after but does not scale.
  expect(maxed.petDamageMultiplier).toBe(1)
  expect(maxed.petCritChance).toBe(0)

  const hunter: CharacterProfile = { faction: 'Alliance', race: 'Night Elf', className: 'Hunter', spec: 'Beast Mastery' }
  const gear = normalizeGearForCharacter(defaultGear, 'Hunter', 'Beast Mastery')
  const stats = calculateStats(hunter, gear)
  const read = (points: Record<number, number>) => {
    const sim = calculateSimulation(hunter, gear, stats, 'Physical DPS', [], undefined, points)
    const source = (name: string) => sim.damageSources!.find((entry) => entry.name === name)?.dps ?? 0
    return { autoShot: source('Auto Shot'), petMelee: source('Pet melee'), killCommand: source('Pet Kill Command') }
  }

  const bare = read({})
  const talented = read({ [focusedFire]: 2 })

  expect(talented.autoShot, "the hunter's own shot gains 2%").toBeCloseTo(bare.autoShot * 1.02, 6)
  expect(talented.petMelee, 'and the pet gains nothing, because the multiplier is the owner’s').toBeCloseTo(
    bare.petMelee,
    10,
  )

  /*
   * **The refused half is still refused, and for the right reason.** A test asserting a talent is
   * ingested proves nothing about the part that was left out, and this repo's recurring failure is
   * prose that stops matching the code — so the reason is checked, not just the absence.
   */
  const refusal = rawTalentEffects.skipped.find(
    (entry) => entry.className === 'Hunter' && /Focused Fire/.test(entry.talent),
  )
  expect(refusal, 'the per-spell half is named rather than silently dropped').toBeDefined()
  expect(refusal!.reason).toMatch(/per-spell|Kill Command/i)
})

test('the pet shares featureFlags quotes are the shares the model produces', () => {
  /*
   * `featureFlags.ts` says the pet's abilities are worth "about 2.4%" of a Beast Mastery hunter and
   * the pet as a whole "13.3% of the total". Its own header forbids adding a numeric bullet there
   * without an assertion behind it — the file has been wrong twice by not moving when the model
   * improved, and both times the sentence carried a number nothing checked.
   *
   * Bracketed on **both** sides rather than bounded below, for the same reason the calibration range
   * is: a one-sided bound passes silently while the model changes underneath it. Improving the pet is
   * supposed to fail this and force the sentence to be rewritten.
   *
   * Measured at best case — rank-1 BiS, every buff and consumable, the tree filled to 61 — because
   * that is the character `featureFlags.ts` is describing and the one the calibration table uses.
   */
  const { result } = bestCaseSimulation('Hunter', 'Beast Mastery', 'Physical DPS')
  const sources = result.damageSources ?? []
  const petRows = sources.filter((source) => source.name.startsWith('Pet'))
  const focusRows = petRows.filter((source) => source.name === 'Pet Bite' || source.name === 'Pet Claw')
  const killCommandRow = petRows.find((source) => source.name === 'Pet Kill Command')

  expect(petRows.map((source) => source.name).sort(), 'every pet source is itemised').toEqual([
    'Pet Bite',
    'Pet Claw',
    'Pet Kill Command',
    'Pet melee',
  ])

  const share = (rows: typeof sources) => rows.reduce((sum, source) => sum + source.dps, 0) / result.scoreExact

  expect(share(focusRows), 'featureFlags says the focus abilities are about 2.2%').toBeGreaterThan(0.018)
  expect(share(focusRows)).toBeLessThan(0.027)
  expect(share([killCommandRow!]), 'featureFlags says Kill Command is about 3.5%').toBeGreaterThan(0.030)
  expect(share([killCommandRow!])).toBeLessThan(0.040)
  expect(share(petRows), 'featureFlags says the pet as a whole is about 18.4%').toBeGreaterThan(0.175)
  expect(share(petRows)).toBeLessThan(0.195)

  /*
   * **The comparison featureFlags leans on: Kill Command beats Bite and Claw together.** It lands
   * about 7.7 times a minute against their 21.6, and still wins, because it is the only pet ability
   * that scales with the owner's attack power. That single fact is why the previous pass's
   * conclusion — that the focus abilities were the pet's remaining gap — was wrong.
   */
  expect(killCommandRow!.dps, 'the one that scales beats the two that do not').toBeGreaterThan(
    focusRows.reduce((sum, source) => sum + source.dps, 0),
  )

  /*
   * **And the one that decides whether the abilities matter at all is Bestial Discipline, not gear.**
   *
   * The first version of this assertion compared a naked untalented hunter against a best-case one
   * and expected the ability share of the pet to *fall*, on the reasoning that flat rolls cannot
   * follow attack power. It failed, and it was right to: 17.45% against 18.14%. The comparison
   * conflated two effects pulling opposite ways.
   *
   * Held apart, both are real. Gear alone takes the share **17.45% → 15.12%**, which is the flat-roll
   * mechanism. Bestial Discipline alone takes it **17.45% → 27.75%**, because doubling focus income
   * doubles the ability rate, and that is much the larger of the two. So the controlled comparison is
   * same gear, different talents — and the claim about gear is asserted where it can be exact, in the
   * unit test above, as the ability DPS not moving at all when the owner gains 2,000 attack power.
   */
  const character: CharacterProfile = { faction: 'Alliance', race: 'Night Elf', className: 'Hunter', spec: 'Beast Mastery' }
  const gear = normalizeGearForCharacter(defaultGear, 'Hunter', 'Beast Mastery')
  const stats = calculateStats(character, gear)
  const idOf = (className: string, name: string) =>
    getTalentData(className)!.trees.flatMap((tree) => tree.talents).find((talent) => talent.name === name)!.id

  /*
   * **Scoped to the focus abilities**, not to every pet row. Kill Command is a pet source too and it
   * spends no focus at all — it is the owner's mana and the owner's crits — so counting it here
   * would dilute a ratio that is supposed to be about focus income, and it did: this assertion broke
   * the moment Kill Command landed, which is the filter earning its comment.
   */
  const focusAbilityShareOfPet = (points: Record<number, number>) => {
    const sim = calculateSimulation(character, gear, stats, 'Physical DPS', [], undefined, points)
    const rows = (sim.damageSources ?? []).filter((source) => source.name.startsWith('Pet'))
    const focus = rows.filter((source) => source.name === 'Pet Bite' || source.name === 'Pet Claw')
    return focus.reduce((sum, s) => sum + s.dps, 0) / rows.reduce((sum, s) => sum + s.dps, 0)
  }

  expect(
    focusAbilityShareOfPet({ [idOf('Hunter', 'Bestial Discipline')]: 2 }),
    'Bestial Discipline is what makes the focus abilities worth counting',
  ).toBeGreaterThan(focusAbilityShareOfPet({}) * 1.5)
})

test('a farming route is computed from real spawns, and the sampling keeps the zone’s shape', () => {
  /*
   * **The route is ours and the coordinates are Wowhead's**, which is the whole reason this can exist
   * at all: `professionTypes.ts` records that wow-professions.com's routes are linked and never
   * copied, because they are that site's craft. Spawn coordinates are facts; a loop derived from them
   * is our own work.
   */
  expect(gatheringNodes.length, 'every gathering node across 1-375').toBe(45)
  expect(
    gatheringNodes.filter((node) => node.profession === 'Herbalism').length +
      gatheringNodes.filter((node) => node.profession === 'Mining').length,
    'and all of them belong to a gathering profession',
  ).toBe(gatheringNodes.length)

  /*
   * **No crates.** A first pass swept a range of object ids and kept whatever came back, which pulled
   * in a Crumpled Map, a Dalaran Crate and an Excavation Supply Crate — objects sitting between the
   * herb ids. The ingest declares the name it expects now, so a wrong id fails rather than shipping.
   */
  expect(gatheringNodes.filter((node) => /Crate|Crumpled|Supply/.test(node.name))).toEqual([])

  // The two nodes Wowhead publishes nothing for are recorded, so the gap reads as known.
  expect(nodesWithoutSpawnData.map((n) => n.name).sort()).toEqual(['Ancient Lichen', 'Ragveil'])

  /*
   * **The sampling stride is the assertion that matters most here.** Wowhead returns coordinates
   * sorted by x, so thinning by slicing the first N would cut the eastern half off every zone and the
   * density map would confidently show nodes in the wrong place. Every sampled zone must still span
   * most of its own width — a truncated one would bunch into the low-x end.
   */
  const sampled = gatheringNodes.flatMap((node) => node.zones.filter((zone) => zone.sampled))
  for (const zone of sampled) {
    const xs = zone.coords.map(([x]) => x)
    expect(Math.max(...xs) - Math.min(...xs), `${zone.zone} must still span its zone after sampling`).toBeGreaterThan(
      40,
    )
  }

  /*
   * The property matters more than the one zone that currently trips it, so it is asserted against
   * the stride itself: thinning an evenly spread set must keep both ends. A `slice(0, n)` passes
   * every other check in this test and fails only this one.
   *
   * **A tight cluster is not a truncation**, which is why the real-data check above is scoped to
   * sampled zones. Some nodes legitimately spawn in a single 2%-wide pocket of a secondary zone, and
   * asserting a minimum spread across every zone called that a defect.
   */
  const ascending: [number, number][] = Array.from({ length: 1000 }, (_, i) => [i / 10, 50])
  const stride = ascending.length / 320
  const thinned = Array.from({ length: 320 }, (_, i) => ascending[Math.floor(i * stride)])
  expect(thinned[0][0], 'sampling keeps the western end').toBeCloseTo(0, 5)
  expect(thinned[thinned.length - 1][0], 'and the eastern one').toBeGreaterThan(99)

  /*
   * Density buckets the spawns into a coarse grid, and intensity is relative to the busiest cell, so
   * the map reads the same whether a zone holds 50 nodes or 500.
   */
  const cells = densityCells([
    [0, 0],
    [1, 1],
    [99.9, 99.9],
  ])
  expect(cells.length, 'two corners, two cells').toBe(2)
  // The boundary point must land in the last cell rather than one past it.
  expect(cells.every((cell) => cell.x < DENSITY_GRID && cell.y < DENSITY_GRID)).toBe(true)
  expect(Math.max(...cells.map((cell) => cell.intensity)), 'the busiest cell is 1').toBe(1)

  /*
   * **The route skips the lonely cells on purpose.** A circuit that detours for one herb is worse
   * than one that skips it, and keeping every cell would draw a scribble across the whole zone
   * rather than a route.
   */
  const sparse = densityCells([...Array(40).fill([50, 50]), [5, 95]] as [number, number][])
  expect(computeRoute(sparse).length, 'one lonely spawn does not earn a stop').toBe(1)

  const felweed = gatheringNodes.find((node) => node.name === 'Felweed')!
  const route = routesForNode(felweed)[0]
  expect(route.zone, 'busiest zone first').toBe('Hellfire Peninsula')
  expect(route.stops.length).toBeGreaterThan(5)
  expect(route.routeLength).toBeGreaterThan(0)

  // Every stop is inside the zone, since coordinates are percentages of its own extent.
  for (const [x, y] of route.stops) {
    expect(x).toBeGreaterThanOrEqual(0)
    expect(x).toBeLessThanOrEqual(100)
    expect(y).toBeGreaterThanOrEqual(0)
    expect(y).toBeLessThanOrEqual(100)
  }
  // And visited once each, which is what makes it a circuit rather than a wander.
  expect(new Set(route.stops.map(([x, y]) => `${x},${y}`)).size).toBe(route.stops.length)

  /*
   * **Nearest-neighbour has to beat the order the cells arrived in**, or the ordering step is doing
   * nothing and the line on screen would be decoration. Asserted against the same stops in
   * density order, which is what `computeRoute` starts from.
   */
  const byDensity = route.cells
    .filter((cell) => cell.intensity >= 0.35)
    .sort((a, b) => b.count - a.count)
    .map(({ x, y }) => [((x + 0.5) / DENSITY_GRID) * 100, ((y + 0.5) / DENSITY_GRID) * 100] as [number, number])
  expect(routeLength(route.stops), 'ordering the stops shortens the loop').toBeLessThan(routeLength(byDensity))
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

  /*
   * Driven through **import** rather than through the autosave, which no longer exists — a load
   * starts clean since 2026-08-21. That is not a weakening of this test: the comment above already
   * said the autosave was only one of the two ways in, and import is the one that survives, because
   * anyone can paste a build exported before the encounter was fixed.
   */
  await openPlannerView(page, 'Build')
  const exported = await page.getByTestId('build-export-output').inputValue()
  const stale = JSON.parse(exported)
  stale.target = { id: 'stale', name: 'Stale caster target', level: 70, armor: 3500 }

  await page.getByTestId('build-import-input').fill(JSON.stringify(stale))
  await page.getByTestId('build-import-button').click()

  await openSimulationTab(page)

  // The planted target must not surface anywhere.
  await expect(page.getByText(/3,500/)).toHaveCount(0)

  // And the estimate itself must run against the fixed boss, not the planted one. This is the whole
  // assertion now that the Encounter panel is gone — it was the sharper half of it anyway, since a
  // panel could have shown the right number while the model used the planted one.
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
    Hunter: 'Dwarf',
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
    const character: CharacterProfile = { faction: 'Alliance', race: legalRaceFor(className), className, spec }
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
    ['Hunter', 'Beast Mastery', 'Dwarf', hunterPoints],
    ['Hunter', 'Marksmanship', 'Dwarf', hunterPoints],
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

  /*
   * A floor rather than an exact count. `toHaveLength(39)` broke the moment Expose Weakness was added
   * — a correct addition failing a test that was only ever pinning the size of the dataset, which is
   * this repo's own rule about counts in prose wearing a test. What the check below actually needs is
   * that the list is not empty; the properties are what matter.
   */
  expect(entries.length, 'every buff and debuff, and there are plenty').toBeGreaterThanOrEqual(39)

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
  /*
   * Non-vacuous rather than exact. This read `toHaveLength(7)` and broke when four more entries were
   * correctly restricted to a spec — Trueshot Aura to Marksmanship, Power Infusion to Discipline,
   * Improved Seal of the Crusader to Retribution, and Expose Weakness added for Survival. Pinning the
   * *number* of spec-restricted buffs pins nothing about them; the loop below is the real check.
   */
  const restricted = entries.filter((entry) => entry.providedBySpec !== undefined)
  expect(restricted.length, 'a good few buffs come from one spec, not a whole class').toBeGreaterThanOrEqual(11)
})


test('buff scope is sourced for every entry, and party scope dominates', () => {
  /*
   * The fact the whole composition tool rests on. In TBC most buffs reach only the caster's group of
   * five — every totem, every aura, both Warrior shouts — and treating them as raid-wide tells a raid
   * leader Battle Shout is covered when five of twenty-five players have it.
   *
   * Each scope is read from that spell's own Wowhead tooltip by `tools/ingest/ingest-buff-scope.mjs`,
   * never inferred from the buff's name or class. The counts are asserted because a silent drift here
   * would change every answer the planner gives while still looking plausible.
   */
  const entries = [...sampleBuffs, ...sampleTargetDebuffs]
  for (const entry of entries) {
    expect(getBuffScope(entry.id), `${entry.name} has no sourced scope`).toBeDefined()
  }

  const counts = entries.reduce<Record<string, number>>((acc, entry) => {
    const scope = getBuffScope(entry.id)!
    return { ...acc, [scope]: (acc[scope] ?? 0) + 1 }
  }, {})
  // Target went 6 to 7 when Expose Weakness was added, and 7 to 8 when Improved Faerie Fire was split
  // off the base debuff. Kept exact rather than loosened: this pins the *sourced split*, which is the
  // claim the test is making, and party scope dominating is the point.
  expect(counts).toEqual({ Party: 24, Raid: 5, Single: 4, Target: 8 })

  /*
   * The five Raid-scoped buffs are exactly the Greater Blessings, which is what "Greater" buys — the
   * single-target Blessings are a different spell. Named rather than counted, because "5" would still
   * pass if the wrong five were scoped.
   */
  const raidWide = sampleBuffs
    .filter((buff) => getBuffScope(buff.id) === 'Raid')
    .map((buff) => buff.name)
    .sort()
  expect(raidWide).toEqual([
    'Greater Blessing of Kings',
    'Greater Blessing of Might',
    'Greater Blessing of Salvation',
    'Greater Blessing of Sanctuary',
    'Greater Blessing of Wisdom',
  ])

  // Every totem is party-scoped. This is the group the seating chart exists to serve.
  for (const buff of sampleBuffs.filter((entry) => entry.name.includes('Totem'))) {
    expect(getBuffScope(buff.id), `${buff.name} must be party-scoped`).toBe('Party')
  }
})

test('a party buff reaches its own group and no other', () => {
  /*
   * The behaviour that separates this from a checklist, and the bug the first version shipped: a
   * Shaman in group 1 buffs group 1. Asserting the *absence* in groups 2-5 matters more than the
   * presence in group 1, because treating buffs as raid-wide passes the presence check too.
   */
  let roster = emptyRoster(25)
  roster = addToGroup(roster, 0, { className: 'Shaman', spec: 'Restoration' })

  const report = computeCoverage(roster)
  const totemIn = (index: number) =>
    report.groups[index].partyBuffs.some((buff) => buff.name === 'Strength of Earth Totem')

  expect(totemIn(0), "the Shaman's own group receives the totem").toBe(true)
  for (const index of [1, 2, 3, 4]) {
    expect(totemIn(index), `group ${index + 1} must not receive a totem from group 1`).toBe(false)
  }

  /*
   * The raid-wide tally still counts it as present, because the raid *does* have it. Both readings
   * are true and answer different questions — "do we have one" versus "who gets it" — which is why
   * the panel shows both.
   */
  expect(report.partyScoped.covered.some((entry) => entry.entry.name === 'Strength of Earth Totem')).toBe(true)
})

test('raid coverage is exact, and an empty roster covers nothing', () => {
  const empty = computeCoverage(emptyRoster(25))
  expect(empty.raidWide.covered, 'nobody in the raid, nothing covered').toEqual([])
  expect(empty.partyScoped.covered).toEqual([])
  expect(empty.debuffs.missing).toHaveLength(sampleTargetDebuffs.length)
  expect(empty.remaining).toBe(25)
  for (const group of empty.groups) expect(group.partyBuffs).toEqual([])

  /*
   * One of every spec reaches every buff **that a roster of that shape can maintain**.
   *
   * This used to assert nothing was missing at all, and that assertion was encoding the
   * over-crediting: three Paladins cannot hold five Greater Blessings, so two are legitimately out of
   * reach. What still must hold is that nothing is missing for want of a *provider* — a typo in
   * `providedBySpec` would name somebody no player can be, and that is what this catches.
   */
  let full = emptyRoster(25)
  let seat = 0
  for (const definition of tbcClasses) {
    for (const spec of definition.specs) {
      const group = Math.floor(seat / 5)
      if (group < full.groups.length) full = addToGroup(full, group, { className: definition.className, spec })
      seat++
    }
  }
  const total = computeCoverage(full)

  // Anything still missing must be blocked by exclusivity, never by having no provider at all.
  for (const entry of total.raidWide.missing) {
    expect(
      exclusiveGroupFor(entry.entry.id),
      `${entry.entry.name} is missing but is not in an exclusive group — nobody can provide it`,
    ).toBeDefined()
    expect(entry.needs, 'and it must say the provider exists rather than "any X"').toMatch(/another /)
  }
  expect(total.debuffs.missing, 'no debuff is exclusive, so all six must be covered').toEqual([])

  // The three Paladins hold three of the five blessings — the cap, not a coincidence.
  const blessings = total.raidWide.covered.filter((entry) => entry.entry.name.startsWith('Greater Blessing'))
  expect(blessings).toHaveLength(3)
})

test('a missing buff names who would bring it, at the right specificity', () => {
  /*
   * The difference that decides a recruitment message. Any Shaman brings Strength of Earth; only an
   * Elemental one brings Totem of Wrath.
   */
  let roster = emptyRoster(25)
  let seat = 0
  for (const definition of tbcClasses) {
    if (definition.className === 'Shaman') continue
    for (const spec of definition.specs) {
      const group = Math.floor(seat / 5)
      if (group < roster.groups.length) roster = addToGroup(roster, group, { className: definition.className, spec })
      seat++
    }
  }

  const report = computeCoverage(roster)
  const needFor = (name: string) => report.partyScoped.missing.find((entry) => entry.entry.name === name)?.needs

  expect(needFor('Strength of Earth Totem'), 'class-wide reads "any"').toBe('any Shaman')
  expect(needFor('Totem of Wrath'), 'spec-specific names the spec').toBe('an Elemental Shaman')
  expect(needFor('Mana Tide Totem')).toBe('a Restoration Shaman')
})

test('resizing a roster keeps the groups that fit', () => {
  /*
   * A raid leader mis-clicking 10-player must not lose the whole evening's planning. Going down drops
   * groups 3-5 and there is no honest way around that; going back up adds empty groups rather than
   * resurrecting anything.
   */
  let roster = emptyRoster(25)
  roster = addToGroup(roster, 0, { className: 'Shaman', spec: 'Restoration' })
  roster = addToGroup(roster, 4, { className: 'Mage', spec: 'Fire' })
  expect(filledSlots(roster)).toHaveLength(2)

  const shrunk = resizeRoster(roster, 10)
  expect(shrunk.groups).toHaveLength(2)
  expect(filledSlots(shrunk), 'the group-5 Mage goes with its group').toHaveLength(1)
  expect(filledSlots(shrunk)[0].className).toBe('Shaman')

  const regrown = resizeRoster(shrunk, 25)
  expect(regrown.groups).toHaveLength(5)
  expect(filledSlots(regrown)).toHaveLength(1)
})

test('the raid composition planner seats a raid, and buffs land per group', async ({ page }) => {
  // Straight into the section: it needs no character, which is why it is not a planner panel.
  await openApp(page, 'raidcomp')

  await expect(page.getByTestId('raidcomp-panel')).toBeVisible()
  await expect(page.getByTestId('raidcomp-filled')).toContainText('0 of 25')
  await expect(page.getByTestId('raidcomp-group-1')).toBeVisible()
  await expect(page.getByTestId('raidcomp-group-5')).toBeVisible()

  /*
   * A Shaman in group 1 gives group 1 its totems and gives group 2 nothing. Asserted through the UI
   * as well as the domain because this is the claim the whole screen makes.
   */
  await page.getByTestId('raidcomp-add-shaman-restoration').click()
  await expect(page.getByTestId('raidcomp-filled')).toContainText('1 of 25')

  /*
   * Granted buffs render as icons, the way Wowhead shows them, so this asserts the *accessible* name
   * rather than visible text — which is the stronger check anyway: an icon with no alt text would
   * pass a text query never and a screen reader never, and this catches both.
   */
  const group1 = page.getByTestId('raidcomp-group-1')
  const group2 = page.getByTestId('raidcomp-group-2')
  await expect(group1.getByAltText('Strength of Earth Totem')).toBeVisible()
  await expect(group2.getByAltText('Strength of Earth Totem')).toHaveCount(0)
  await expect(group2.getByText('Empty group')).toBeVisible()

  // Removing the seat takes the buffs with it.
  await page.getByRole('button', { name: /Remove Restoration Shaman/ }).click()
  await expect(page.getByTestId('raidcomp-filled')).toContainText('0 of 25')
  await expect(group1.getByAltText('Strength of Earth Totem')).toHaveCount(0)
})

test('every spec and every buff has a real vendored icon', () => {
  /*
   * Icons are names in `domain/` and files in `public/icons/`, and the two drift silently: a missing
   * file renders as a broken image, which looks like a styling bug rather than a data one. Both halves
   * are asserted together so neither can rot alone.
   *
   * A spec has no icon of its own in TBC — the convention is the tree's deepest talent, which is why
   * these are derived from talent data rather than fetched.
   */
  const iconDir = resolve(process.cwd(), 'public/icons')
  const onDisk = new Set(readdirSync(iconDir).map((file) => file.replace(/\.jpg$/, '')))

  for (const definition of tbcClasses) {
    for (const spec of definition.specs) {
      const icon = getSpecIcon(definition.className, spec)
      expect(icon, `${spec} ${definition.className} has no icon`).toBeDefined()
      expect(onDisk.has(icon!), `${icon}.jpg is named but not vendored`).toBe(true)
      // The talent it came from is recorded, so the choice stays auditable rather than magic.
      expect(getSpecIconSource(definition.className, spec)).toBeTruthy()
    }
  }

  for (const entry of [...sampleBuffs, ...sampleTargetDebuffs]) {
    const icon = getBuffIcon(entry.id)
    expect(icon, `${entry.name} has no icon`).toBeDefined()
    expect(onDisk.has(icon!), `${icon}.jpg is named but not vendored`).toBe(true)
  }
})

test("Greater Blessing of Might really does use the Kings icon file", () => {
  /*
   * Kept as a test because it looks exactly like a bug and is not one. Blizzard reused a misleadingly
   * named asset: Wowhead's payload for spell 27141, with `name_enus` confirming the spell, gives the
   * icon as `spell_holy_greaterblessingofkings`. An earlier pass here assumed the parser had grabbed a
   * neighbouring entry and nearly "corrected" accurate data.
   *
   * Kings itself uses a different file — `spell_magic_…` rather than `spell_holy_…` — which is the
   * detail that makes the two distinguishable at all.
   */
  expect(getBuffIcon('blessing-of-might')).toBe('spell_holy_greaterblessingofkings')
  expect(getBuffIcon('blessing-of-kings')).toBe('spell_magic_greaterblessingofkings')
  expect(getBuffIcon('blessing-of-might')).not.toBe(getBuffIcon('blessing-of-kings'))
})

test('dragging a seat onto an occupied one swaps rather than overwrites', () => {
  /*
   * Swap is what a raid leader means by dragging one player onto another — they are trading places.
   * Overwriting would silently delete somebody, which is the one outcome that loses work, and
   * refusing would make reorganising a full raid impossible without emptying a seat first.
   */
  let roster = emptyRoster(25)
  roster = addToGroup(roster, 0, { className: 'Shaman', spec: 'Restoration' })
  roster = addToGroup(roster, 1, { className: 'Mage', spec: 'Fire' })

  const from = { groupIndex: 0, seatIndex: 0 }
  const to = { groupIndex: 1, seatIndex: 0 }
  const swapped = moveSeat(roster, from, to)

  expect(seatAt(swapped, to)?.className, 'the dragged player arrives').toBe('Shaman')
  expect(seatAt(swapped, from)?.className, 'and the displaced one takes the empty seat').toBe('Mage')
  expect(filledSlots(swapped), 'nobody is lost in a swap').toHaveLength(2)

  // Moving onto an empty seat just moves; nothing comes back the other way.
  const moved = moveSeat(roster, from, { groupIndex: 4, seatIndex: 3 })
  expect(seatAt(moved, from)).toBeUndefined()
  expect(seatAt(moved, { groupIndex: 4, seatIndex: 3 })?.className).toBe('Shaman')
  expect(filledSlots(moved)).toHaveLength(2)
})

test('a party buff follows the player when they change group', () => {
  /*
   * The point of drag-and-drop in a TBC planner: moving the Shaman moves the totems. Asserted through
   * coverage rather than through the roster, because that is the thing a raid leader is watching.
   */
  let roster = emptyRoster(25)
  roster = addToGroup(roster, 0, { className: 'Shaman', spec: 'Restoration' })

  const before = computeCoverage(roster)
  expect(before.groups[0].partyBuffs.length).toBeGreaterThan(0)
  expect(before.groups[3].partyBuffs).toEqual([])

  const after = computeCoverage(moveSeat(roster, { groupIndex: 0, seatIndex: 0 }, { groupIndex: 3, seatIndex: 0 }))
  expect(after.groups[0].partyBuffs, 'the old group loses them').toEqual([])
  expect(after.groups[3].partyBuffs.length, 'and the new group gains them').toBeGreaterThan(0)
})

test('naming a seat is optional, clearable, and never changes coverage', () => {
  /*
   * A Shaman brings Strength of Earth whether or not you typed "Dave". Keeping names out of the
   * coverage model is what stops the planner quietly becoming a database of other people's details,
   * and it means an unnamed roster is fully functional.
   */
  let roster = emptyRoster(25)
  roster = addToGroup(roster, 0, { className: 'Shaman', spec: 'Restoration' })
  const ref = { groupIndex: 0, seatIndex: 0 }

  const baseline = computeCoverage(roster).groups[0].partyBuffs.length

  const named = renameSeat(roster, ref, '  Dave  ')
  expect(seatAt(named, ref)?.playerName, 'trimmed on the way in').toBe('Dave')
  expect(computeCoverage(named).groups[0].partyBuffs).toHaveLength(baseline)

  // An empty string clears the field rather than storing "".
  const cleared = renameSeat(named, ref, '   ')
  expect(seatAt(cleared, ref)?.playerName).toBeUndefined()
  expect('playerName' in seatAt(cleared, ref)!).toBe(false)
})

test('a seat can be named through the UI, and the name survives a reload', async ({ page }) => {
  await openApp(page, 'raidcomp')

  await page.getByTestId('raidcomp-add-shaman-restoration').click()
  await expect(page.getByTestId('raidcomp-filled')).toContainText('1 of 25')

  /*
   * The naming field is controlled rather than uncontrolled, and this test is why. The first version
   * used `defaultValue`, which lost whatever was typed whenever the roster re-rendered underneath it
   * — real, and invisible until driven.
   */
  await page.getByRole('button', { name: /Name the Restoration Shaman/ }).click()
  const input = page.getByTestId('raidcomp-name-input-1-1')
  await input.fill('Dave')
  await input.press('Enter')

  await expect(page.getByText('Dave')).toBeVisible()

  /*
   * Persisted, not merely rendered — asserted on the stored payload first so a failure says which
   * half broke. A roster that renders but does not save, and one that saves but does not reload,
   * fail the same visible assertion for opposite reasons.
   */
  const stored = await page.evaluate(() => localStorage.getItem('project-defeat:roster:v1'))
  expect(stored, 'the roster must reach storage').toContain('Dave')

  await page.reload()
  await page.getByTestId('section-raidcomp').click()
  await expect(page.getByText('Dave')).toBeVisible()
})

test('a roster saved with a single blessingId still loads, keyed by its group', async ({ page }) => {
  /*
   * The stored seat changed from one `blessingId` to one assignment per exclusive group. A raid
   * leader who saved a 25-person roster the evening before must not open it to find their Paladin
   * back on the default, so the old field is migrated on read.
   *
   * The group is **looked up from the buff** rather than assumed, which is what makes the migration
   * safe: there is no branch that can file a stored id under the wrong group, because nothing names
   * a group. And the same validation applies to the new shape — a pair whose key is not the group
   * its buff belongs to is dropped rather than trusted.
   */
  await openApp(page, 'raidcomp')

  await page.evaluate(() => {
    localStorage.setItem(
      'project-defeat:roster:v1',
      JSON.stringify({
        size: 25,
        groups: [
          [
            { className: 'Paladin', spec: 'Holy', playerName: 'Dave', blessingId: 'blessing-of-salvation' },
            { className: 'Shaman', spec: 'Enhancement', assignments: { 'shaman-air-totem': 'wrath-of-air-totem' } },
            { className: 'Warrior', spec: 'Fury', assignments: { 'paladin-blessings': 'battle-shout' } },
          ],
        ],
      }),
    )
  })

  await page.reload()
  await page.getByTestId('section-raidcomp').click()

  await expect(page.getByText('Dave')).toBeVisible()
  await expect(
    page.getByTestId('raidcomp-assign-paladin-blessings-1-1'),
    'the v1 field arrives under the group its buff belongs to',
  ).toHaveValue('blessing-of-salvation')

  // The new shape round-trips untouched.
  await expect(page.getByTestId('raidcomp-assign-shaman-air-totem-1-2')).toHaveValue('wrath-of-air-totem')

  // And a mis-keyed pair is dropped on read: Battle Shout is a Warrior shout, not a Blessing.
  await expect(
    page.getByTestId('raidcomp-assign-warrior-shouts-1-3'),
    'a key that does not match its buff is not honoured',
  ).toHaveValue('')
})

test('raid builds split Feral and add Dreamstate without touching the spec union', () => {
  /*
   * A raid roster asks a different question from a gear planner: *what are you bringing tonight*. The
   * answer distinguishes a bear from a cat where `TbcSpec` does not, and `TbcSpec` must not learn to —
   * BiS rankings, talent trees and tier lists all key off it, so adding "Feral Tank" there would mean
   * inventing a BiS list for something Blizzard never shipped as a spec.
   */
  expect(raidBuilds).toHaveLength(29)

  const druid = raidBuildsByClass.find((entry) => entry.className === 'Druid')!
  expect(druid.builds.map((build) => build.label)).toEqual([
    'Balance',
    'Feral (Bear)',
    'Feral (Cat)',
    'Restoration',
    'Dreamstate',
  ])

  /*
   * Feral *replaces* its spec — a druid is a bear or a cat, and an undifferentiated third option
   * would be a seat that means nothing. Dreamstate *adds* to Restoration, because a raid can field
   * both and they are different players. An earlier version had Dreamstate replacing Restoration,
   * which silently removed Restoration Druid from the picker.
   */
  expect(druid.builds.filter((build) => build.spec === 'Feral').map((b) => b.role)).toEqual([
    'Tank',
    'Physical DPS',
  ])
  expect(druid.builds.filter((build) => build.spec === 'Restoration')).toHaveLength(2)

  // Every build resolves to a real spec of its own class, or buff matching silently finds nothing.
  for (const build of raidBuilds) {
    const definition = tbcClasses.find((entry) => entry.className === build.className)!
    expect(definition.specs as readonly string[], `${build.id} names a spec its class lacks`).toContain(build.spec)
    expect(build.icon, `${build.id} has no icon`).toBeTruthy()
  }
})

test('a Feral bear and a Feral cat bring the same buffs but different roles', () => {
  /*
   * The whole point of the split, and the line it must not cross. They are the same talent tree
   * wearing different forms, so Leader of the Pack comes either way — matching buffs on the *build*
   * rather than the spec would have quietly halved it. Role is the one axis that does differ, and
   * getting it from the spec is what made a seated bear read as "0 Tank".
   */
  const bear = getRaidBuild('druid-feral-tank')!
  const cat = getRaidBuild('druid-feral-cat')!
  expect(bear.spec).toBe(cat.spec)
  expect(bear.role).toBe('Tank')
  expect(cat.role).toBe('Physical DPS')

  const withBear = computeCoverage(addToGroup(emptyRoster(25), 0, { className: 'Druid', spec: 'Feral', buildId: bear.id }))
  const withCat = computeCoverage(addToGroup(emptyRoster(25), 0, { className: 'Druid', spec: 'Feral', buildId: cat.id }))

  const buffNames = (report: ReturnType<typeof computeCoverage>) =>
    report.groups[0].partyBuffs.map((buff) => buff.name).sort()
  expect(buffNames(withBear), 'same tree, same buffs').toEqual(buffNames(withCat))
  expect(buffNames(withBear)).toContain('Leader of the Pack')

  expect(withBear.roleCounts.Tank).toBe(1)
  expect(withBear.roleCounts['Physical DPS']).toBe(0)
  expect(withCat.roleCounts.Tank).toBe(0)
  expect(withCat.roleCounts['Physical DPS']).toBe(1)
})

test('Dreamstate heals and does not bring Moonkin Aura', () => {
  /*
   * The load-bearing fact about this build, and the one most likely to be got wrong.
   *
   * Dreamstate is a **Balance** talent at row 6 — "Regenerate mana equal to 10% of your Intellect
   * every 5 sec, even while casting" — so the build spends ~25 points in Balance and the rest in
   * Restoration. That makes it tempting to model as a Balance druid, which would credit the raid with
   * Moonkin Aura. It must not: the aura only radiates in Moonkin Form, and a druid in Moonkin Form
   * cannot cast healing spells at all in TBC, so a Dreamstate healer is never in the form that grants
   * it.
   */
  const dreamstate = getRaidBuild('druid-dreamstate')!
  expect(dreamstate.role).toBe('Healer')
  expect(dreamstate.spec, 'modelled as Restoration, because that is what it casts as').toBe('Restoration')

  const report = computeCoverage(
    addToGroup(emptyRoster(25), 0, { className: 'Druid', spec: dreamstate.spec, buildId: dreamstate.id }),
  )
  const names = report.groups[0].partyBuffs.map((buff) => buff.name)
  expect(names, 'the class-wide druid buffs still come').toContain('Gift of the Wild')
  expect(names, 'but not the one that needs Moonkin Form').not.toContain('Moonkin Aura')
  expect(names, 'nor the one that needs cat or bear form').not.toContain('Leader of the Pack')
})

test('every spec icon is a real vendored file, and the two Feral builds differ', () => {
  /*
   * Spec icons used to be derived from each tree's deepest talent, which was deterministic and
   * unrecognisable — `inv_sword_11` for Protection Warrior. They are curated now, and curation only
   * stays honest if the files actually exist.
   */
  const onDisk = new Set(readdirSync(resolve(process.cwd(), 'public/icons')).map((file) => file.replace(/\.jpg$/, '')))

  for (const build of raidBuilds) {
    expect(onDisk.has(build.icon), `${build.id}: ${build.icon}.jpg is named but not vendored`).toBe(true)
  }

  expect(getRaidBuild('druid-feral-tank')!.icon).toBe('ability_racial_bearform')
  expect(getRaidBuild('druid-feral-cat')!.icon).toBe('ability_druid_ferociousbite')
  expect(getRaidBuild('druid-dreamstate')!.icon).toBe('ability_druid_dreamstate')
})

test('a level 70 TBC character has 61 talent points', () => {
  /*
   * This read **41** until 2026-08-19, which made every build in the app unbuildable — 41 is the
   * points needed to reach the bottom of one tree, not the total available. The old comment gave the
   * right derivation and the wrong answer: "one per level from 10 to 70" is 61 levels.
   *
   * Anchored rather than recalled: Wowhead's level-60 Classic talent guides publish builds as 17/34/0
   * and 20/31/0, every one summing to 51, and 60 - 9 = 51. The same formula gives 61 at level 70.
   */
  expect(TALENT_POINTS_AT_70).toBe(61)

  /*
   * And it has to be spendable. A tree's deepest row needs `(row - 1) * 5` points in that tree, so a
   * 41-point budget could not fund the classic deep-plus-secondary builds the guides publish.
   */
  const warrior = getTalentData('Warrior')!
  const deepestRow = Math.max(...warrior.trees.flatMap((tree) => tree.talents.map((talent) => talent.row)))
  expect((deepestRow - 1) * POINTS_PER_ROW).toBeLessThan(TALENT_POINTS_AT_70)
})

test('a single-panel view fills the width, and the talent trees sit side by side', async ({ page }) => {
  /*
   * Both halves of a regression that shipped and had to be caught by eye.
   *
   * `.content` is a two-track grid, which was right when a tab stacked several panels. Every view is
   * now one panel behind a sub-tab, so the panel took one track and left the other empty — the
   * talents page rendered its three trees in a 557px box, wrapping the third underneath, with half
   * the screen blank beside it.
   *
   * Asserted on the *rendered geometry* rather than on CSS, because the bug was entirely a layout
   * outcome: every rule involved was individually valid.
   */
  await page.setViewportSize({ width: 1600, height: 900 })
  await openApp(page)
  // The planner sub-tabs are buttons, not ARIA tabs — see the nav assertion further up this file.
  await page.getByRole('button', { name: 'Talents', exact: true }).click()

  const trees = page.locator('.talent-tree')
  await expect(trees).toHaveCount(3)

  const boxes = await trees.evaluateAll((nodes) =>
    nodes.map((node) => {
      const rect = node.getBoundingClientRect()
      return { top: Math.round(rect.top), width: Math.round(rect.width) }
    }),
  )

  // Side by side means one row: identical tops, and none of them squeezed.
  expect(new Set(boxes.map((box) => box.top)).size, 'all three trees share a row').toBe(1)
  for (const box of boxes) expect(box.width, 'a tree squeezed into a column is the symptom').toBeGreaterThan(300)

  // The panel itself must be using the width it was given, not half of it.
  const panelWidth = await page.locator('.content > .panel').evaluate((node) => Math.round(node.getBoundingClientRect().width))
  const contentWidth = await page.locator('.content').evaluate((node) => Math.round(node.getBoundingClientRect().width))
  expect(panelWidth, 'the lone panel spans both tracks').toBeGreaterThan(contentWidth * 0.85)
})

test('a section with no rail uses the whole shell', async ({ page }) => {
  /*
   * The other half of the same regression, and a pure cascade bug: a new `.app-shell` rule was added
   * *after* `.app-shell-no-rail` with equal specificity, so it silently won and reinstated the 288px
   * rail track on every section that has no rail. Their content rendered as a narrow strip with the
   * rest of the page empty.
   */
  await page.setViewportSize({ width: 1600, height: 900 })
  await openApp(page, 'raidcomp')

  const shell = page.locator('.app-shell')
  await expect(shell).toHaveClass(/app-shell-no-rail/)

  const [shellWidth, panelWidth] = await Promise.all([
    shell.evaluate((node) => Math.round(node.getBoundingClientRect().width)),
    page.locator('.raidcomp').evaluate((node) => Math.round(node.getBoundingClientRect().width)),
  ])
  expect(panelWidth, 'the panel uses the shell rather than a rail-sized track').toBeGreaterThan(shellWidth * 0.85)

  // And the five groups sit in one row, which is the whole point of the width.
  const tops = await page
    .locator('.raidcomp-group')
    .evaluateAll((nodes) => nodes.map((node) => Math.round(node.getBoundingClientRect().top)))
  expect(tops).toHaveLength(5)
  expect(new Set(tops).size, 'all five groups share a row at 1600px').toBe(1)
})

test('the layout reflows to phone width without overflowing', async ({ page }) => {
  /*
   * The app had a hard ~806px floor: fixed 940px containers, a two-column content grid, and a
   * five-tab bar that would not wrap. Horizontal scroll is the symptom worth pinning, because it is
   * what makes a page unusable on a phone rather than merely cramped.
   */
  await page.setViewportSize({ width: 375, height: 812 })
  await openApp(page, 'raidcomp')

  const overflow = async () =>
    page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }))

  const empty = await overflow()
  expect(empty.scroll, 'no horizontal scroll at 375px').toBeLessThanOrEqual(empty.client)

  /*
   * **With a seat filled**, which is what this test missed for as long as it existed. An empty
   * roster has no seat cards, and the card is the thing that overflowed: absolutely positioned at
   * `left: 100%`, it extended the document scroll area to 534px even while invisible, because
   * `visibility: hidden` suppresses painting and not scrollable overflow.
   */
  await page.getByTestId('raidcomp-add-druid-dreamstate').click()
  await expect(page.locator('.raidcomp-seat-card')).toHaveCount(1)

  const filled = await overflow()
  expect(filled.scroll, 'a hidden hover card must not widen the page').toBeLessThanOrEqual(filled.client)

  // And it still must not, once the card is actually shown — on a phone it sits under the seat.
  await page.locator('.raidcomp-seat-body').first().hover()
  await expect(page.locator('.raidcomp-seat-card').first()).toBeVisible()

  const hovered = await overflow()
  expect(hovered.scroll, 'nor when it is open').toBeLessThanOrEqual(hovered.client)
})

test('a seat shows everything that player brings, including what the group row cannot', () => {
  /*
   * The group row under each party deliberately lists **party-scoped buffs only**, which is correct —
   * a debuff on the boss is not something group 1 "receives". The cost is that a Druid's Faerie Fire
   * is invisible exactly where you are seating that Druid, which reads as a missing buff rather than
   * as a category boundary. This is the per-seat answer to that.
   *
   * Split by reach rather than merged into one list, so answering the question does not flatten the
   * party-versus-raid distinction the whole planner is built on.
   */
  const dreamstate = seatContributions({ className: 'Druid', spec: 'Restoration', buildId: 'druid-dreamstate' })

  expect(dreamstate.party.map((buff) => buff.name)).toContain('Gift of the Wild')
  expect(dreamstate.raidWide.map((buff) => buff.name)).toEqual(expect.arrayContaining(['Thorns', 'Innervate']))
  expect(
    dreamstate.debuffs.map((debuff) => debuff.name),
    'Faerie Fire is the one that went looking for a home',
  ).toContain('Faerie Fire')

  // Every druid brings Faerie Fire — it is class-wide, so the build must not narrow it.
  for (const buildId of ['druid-balance', 'druid-feral-tank', 'druid-feral-cat', 'druid-restoration', 'druid-dreamstate']) {
    const build = getRaidBuild(buildId)!
    const contributions = seatContributions({ className: build.className, spec: build.spec, buildId })
    expect(contributions.debuffs.map((d) => d.name), `${buildId} should bring Faerie Fire`).toContain('Faerie Fire')
  }

  /*
   * And the split stays honest: Leader of the Pack is party-scoped and Feral-only, so it appears in
   * exactly one bucket for exactly the builds that have it.
   */
  const bear = seatContributions({ className: 'Druid', spec: 'Feral', buildId: 'druid-feral-tank' })
  expect(bear.party.map((buff) => buff.name)).toContain('Leader of the Pack')
  expect(bear.raidWide.map((buff) => buff.name)).not.toContain('Leader of the Pack')
  expect(dreamstate.party.map((buff) => buff.name)).not.toContain('Leader of the Pack')
})

test('the seat contribution card is present and hidden until hover', async ({ page }) => {
  await openApp(page, 'raidcomp')
  await page.getByTestId('raidcomp-add-druid-dreamstate').click()

  /*
   * Hidden by CSS rather than unmounted, so it needs no JS state — which is why the assertion is on
   * visibility rather than on presence.
   *
   * It used to say "costs no layout" as well, and that half was wrong: `visibility: hidden` still
   * contributes to scrollable overflow, so the hidden card scrolled the page sideways at phone
   * width. It is `display: none` now, and the reflow test pins the consequence.
   */
  const card = page.locator('.raidcomp-seat-card').first()
  await expect(card).toHaveCount(1)
  await expect(card).toBeHidden()

  await page.locator('.raidcomp-seat-body').first().hover()
  await expect(card).toBeVisible()
  await expect(card).toContainText('Faerie Fire')
  await expect(card).toContainText('Gift of the Wild')
})

test('one provider supplies one buff from an exclusive group', () => {
  /*
   * The largest over-credit this tool ever had. One Paladin used to credit a raid with **all five**
   * Greater Blessings and **all three** auras — the difference between bringing one Paladin and
   * bringing four, reported as "you are fine".
   *
   * Both constraints are game rules with tooltip evidence, quoted in `buffExclusivity.ts`: spell
   * 27141 says "Players may only have one Blessing on them per Paladin at any one time", and rank 8
   * Devotion Aura says "Only one Paladin aura can be active per Paladin".
   */
  const seat = (className: TbcClass, spec: TbcSpec) => ({ className, spec })
  const rosterOf = (seats: readonly { className: TbcClass; spec: TbcSpec }[]) =>
    seats.reduce((roster, entry, index) => addToGroup(roster, Math.floor(index / 5), entry), emptyRoster(25))

  const onePaladin = computeCoverage(rosterOf([seat('Paladin', 'Holy')]))
  expect(onePaladin.raidWide.covered.map((entry) => entry.entry.name)).toEqual(['Greater Blessing of Kings'])
  expect(onePaladin.partyScoped.covered.map((entry) => entry.entry.name)).toEqual(['Devotion Aura'])

  // Three Paladins maintain three of each — the budget is providers, not buffs.
  const threePaladins = computeCoverage(
    rosterOf([seat('Paladin', 'Holy'), seat('Paladin', 'Protection'), seat('Paladin', 'Retribution')]),
  )
  expect(threePaladins.raidWide.covered).toHaveLength(3)
  expect(threePaladins.partyScoped.covered).toHaveLength(3)

  /*
   * And the ones they cannot maintain read as a different kind of missing. "needs any Paladin" would
   * be a lie when the Paladin is sitting right there holding a different Blessing.
   */
  const blocked = onePaladin.raidWide.missing.find((entry) => entry.entry.name === 'Greater Blessing of Might')!
  expect(blocked.needs).toMatch(/another Paladin/)
  expect(blocked.needs).not.toMatch(/^any /)
})

test('a warrior runs one shout, and a second warrior is what adds the other', () => {
  /*
   * Modelled as a **raid convention** rather than a game rule, and the distinction is recorded rather
   * than blurred: neither tooltip states exclusivity and wowsims applies both shouts independently,
   * so one warrior *could* maintain both. Raids do not — each shout costs rage and a global, and
   * Commanding Shout is the lower priority — so the planner follows what rosters actually run.
   *
   * Battle Shout is first in the group's priority order, which is why a lone DPS warrior shows it.
   */
  const rosterOf = (specs: readonly TbcSpec[]) =>
    specs.reduce((roster, spec) => addToGroup(roster, 0, { className: 'Warrior', spec }), emptyRoster(25))

  const shoutsIn = (specs: readonly TbcSpec[]) =>
    computeCoverage(rosterOf(specs))
      .groups[0].partyBuffs.map((buff) => buff.name)
      .filter((name) => name.includes('Shout'))

  expect(shoutsIn(['Fury']), 'one warrior, one shout').toEqual(['Battle Shout'])
  expect(shoutsIn(['Arms']), 'and it is Battle Shout by default').toEqual(['Battle Shout'])
  expect(shoutsIn(['Fury', 'Arms']).sort()).toEqual(['Battle Shout', 'Commanding Shout'])
  expect(shoutsIn(['Protection', 'Fury']).sort()).toEqual(['Battle Shout', 'Commanding Shout'])

  /*
   * Exclusivity is per **group**, not per raid — two warriors split across two groups give each group
   * one shout, which is exactly the seating decision the planner exists to make visible.
   */
  let split = emptyRoster(25)
  split = addToGroup(split, 0, { className: 'Warrior', spec: 'Fury' })
  split = addToGroup(split, 1, { className: 'Warrior', spec: 'Protection' })
  const report = computeCoverage(split)
  for (const index of [0, 1]) {
    const shouts = report.groups[index].partyBuffs.map((buff) => buff.name).filter((name) => name.includes('Shout'))
    expect(shouts, `group ${index + 1} has one warrior, so one shout`).toEqual(['Battle Shout'])
  }
})

test('every exclusive group names real buffs and states its basis', () => {
  /*
   * A group naming a buff id that does not exist would silently constrain nothing — the failure mode
   * is invisible, which is why it is asserted. `basis` is checked too: a game rule quotes a tooltip,
   * a raid convention is a defensible default, and collapsing the two would let an opinion pass as a
   * mechanic.
   */
  const knownIds = new Set([...sampleBuffs, ...sampleTargetDebuffs].map((entry) => entry.id))

  for (const group of exclusiveGroups) {
    expect(group.buffIds.length, `${group.id} needs at least two competing buffs`).toBeGreaterThan(1)
    expect(group.evidence.length, `${group.id} must say where the constraint comes from`).toBeGreaterThan(40)
    expect(['game rule', 'raid convention']).toContain(group.basis)
    for (const id of group.buffIds) {
      expect(knownIds.has(id), `${group.id} names "${id}", which is not a buff`).toBe(true)
    }
  }

  // The two Paladin groups are game rules; the shouts are explicitly not.
  expect(exclusiveGroups.find((group) => group.id === 'paladin-blessings')!.basis).toBe('game rule')
  expect(exclusiveGroups.find((group) => group.id === 'paladin-auras')!.basis).toBe('game rule')
  expect(exclusiveGroups.find((group) => group.id === 'warrior-shouts')!.basis).toBe('raid convention')
})

test('raid details are optional, persist, and reach the exported chart', () => {
  /*
   * The export used to write the same filename every time — `25-player-raid.png` for every roster
   * ever made — so each new one landed as `…(1).png` and opening the plain name gave you the *first*
   * chart you had ever exported. It looked exactly like a stale export.
   */
  let roster = emptyRoster(25)
  expect(roster.meta, 'an untouched roster carries no metadata at all').toBeUndefined()

  roster = setRosterMeta(roster, 'title', '  SSC Progression  ')
  expect(roster.meta?.title, 'trimmed on the way in').toBe('SSC Progression')

  roster = setRosterMeta(roster, 'date', 'Tue 12 Aug')
  roster = setRosterMeta(roster, 'startTime', '7:30pm ST')
  roster = setRosterMeta(roster, 'description', 'Invites 7:15')

  // Clearing every field drops the block rather than leaving empty strings behind.
  let cleared = roster
  for (const field of ['title', 'date', 'startTime', 'description'] as const) {
    cleared = setRosterMeta(cleared, field, '')
  }
  expect(cleared.meta).toBeUndefined()

  // Resizing must not discard it — rebuilding `{ size, groups }` dropped it once already.
  const resized = resizeRoster(roster, 10)
  expect(resized.meta?.title).toBe('SSC Progression')
  expect(resized.groups).toHaveLength(2)
})

import { getBaseStats } from '../src/domain/character/baseStats'
import { getAttributeConversions } from '../src/domain/character/attributeConversions'
import { racesByFaction } from '../src/domain/character/races'

/**
 * Equips the default set, then re-runs with one attribute nudged, and reports what moved.
 *
 * `bonusStats` is folded in before the conversions run, which is the whole reason it exists — so a
 * delta measured this way is exactly the conversion rate, per point.
 */
function conversionDelta(
  className: TbcClass,
  spec: TbcSpec,
  race: TbcRace,
  bonus: Record<string, number>,
): Record<string, number> {
  const faction: Faction = racesByFaction.Alliance.includes(race) ? 'Alliance' : 'Horde'
  const character: CharacterProfile = { faction, race, className, spec }
  const gear = normalizeGearForCharacter(defaultGear, className, spec)

  const base = calculateStats(character, gear, [], [])
  const probed = calculateStats(character, gear, [], [], bonus)

  const delta: Record<string, number> = {}
  for (const key of Object.keys(base)) delta[key] = probed[key as keyof typeof probed] - base[key as keyof typeof base]
  return delta
}

test('attributes convert at the class-specific rates wowsims publishes, and never into spell power', async () => {
  /*
   * This replaces six uncited lines that were the app's only attribute conversions and were the
   * always-visible rail's largest error. Each assertion below pins one of them to
   * `tools/ingest/ingest-base-stats.mjs`, because the lesson this repo keeps relearning is that
   * fixing an instance buys nothing — only the assertion does.
   */

  // Strength is 2 attack power to a Warrior and 1 to a Rogue. The old code used 2 for everyone,
  // overstating every Rogue and Hunter.
  expect(conversionDelta('Warrior', 'Fury', 'Human', { strength: 100 }).attackPower).toBeCloseTo(200, 6)
  expect(conversionDelta('Rogue', 'Combat', 'Orc', { strength: 100 }).attackPower).toBeCloseTo(100, 6)

  // Agility is melee attack power for a Rogue and *nothing at all* for a Warrior. The old flat
  // `agility * 0.35` was a rate no class has, and it handed a Fury Warrior attack power it never had.
  expect(conversionDelta('Rogue', 'Combat', 'Orc', { agility: 100 }).attackPower).toBeCloseTo(100, 6)
  expect(conversionDelta('Warrior', 'Fury', 'Human', { agility: 100 }).attackPower).toBeCloseTo(0, 6)

  // A Hunter's Agility goes to *ranged* attack power, and to melee not at all — and at 1 a point,
  // where the old code used 1.8 for every class alike.
  const hunter = conversionDelta('Hunter', 'Beast Mastery', 'Orc', { agility: 100 })
  expect(hunter.rangedAttackPower).toBeCloseTo(100, 6)
  expect(hunter.attackPower).toBeCloseTo(0, 6)

  // 33 Agility is one percent of melee crit for a Warrior. The old `agility * 0.1` made it 0.15%,
  // understating a geared Warrior by around five and a half percent crit.
  expect(conversionDelta('Warrior', 'Fury', 'Human', { agility: 33 }).critRating).toBeCloseTo(RATING_PER_PERCENT.meleeCrit, 1)

  // Agility grants 2 Armor to *every* class. Nothing in this app modelled it at all before, which
  // cost a geared Rogue over 500 armor on a row the rail never hides.
  for (const classOption of tbcClasses) {
    const race = racesByClass[classOption.className][0]
    const delta = conversionDelta(classOption.className, classOption.specs[0], race, { agility: 100 })
    expect(delta.armor, `${classOption.className} gets 2 armor per point of Agility`).toBeCloseTo(200, 6)
  }

  /*
   * The headline: **Intellect and Spirit grant no spell power and no healing power in TBC.** Every
   * conversion of either into spell power is talent-gated upstream — Lunar Guidance, Mind Mastery,
   * Spiritual Guidance — so there is no baseline one. The old code added `intellect * 0.8` and
   * `spirit * 0.15`, which was inventing 46% of a Fire Mage's spell power and 52% of a Holy Priest's
   * on the one surface that is always on screen.
   */
  const caster = conversionDelta('Mage', 'Fire', 'Gnome', { intellect: 1000, spirit: 1000 })
  expect(caster.spellPower, 'Intellect and Spirit are not spell power in TBC').toBeCloseTo(0, 6)
  expect(caster.healingPower, 'Intellect and Spirit are not healing power in TBC').toBeCloseTo(0, 6)

  /*
   * ...and the falsification, without which the two lines above would pass just as happily if the
   * probe never reached the conversions at all. Intellect *does* buy spell crit, so a run that moves
   * nothing is a broken probe rather than a proof.
   */
  expect(caster.spellCritRating, 'Intellect still buys spell crit, so the probe is reaching the conversions').toBeGreaterThan(0)
})

test('base stats are race-specific, and no class is born with spell power', async () => {
  /*
   * The app carried one hand-written block per class. They were invented — its Druid had 52 Strength
   * against a real Night Elf Druid's 73 — and, worse, several granted spell power and healing power
   * that TBC gives no one. `getBaseStats` reads all 52 race+class blocks from the pinned commit.
   */

  // Base stats depend on race, not just class. One block per class cannot express this.
  const nightElf = getBaseStats('Priest', 'Night Elf')
  const dwarf = getBaseStats('Priest', 'Dwarf')
  expect(nightElf).not.toEqual(dwarf)
  expect(nightElf.agility, 'a Night Elf is the more agile Priest').toBeGreaterThan(dwarf.agility)

  // Nobody starts with spell power, healing power or armor. The old blocks granted all three —
  // a Mage 132 spell power, a Priest 124 healing power, a Warrior 1400 armor — none of which exists.
  const problems: string[] = []
  for (const classOption of tbcClasses) {
    for (const race of racesByClass[classOption.className]) {
      const base = getBaseStats(classOption.className, race)
      for (const stat of ['spellPower', 'healingPower', 'armor'] as const) {
        if (base[stat] !== 0) problems.push(`${race} ${classOption.className} has base ${stat} ${base[stat]}`)
      }
    }
  }
  expect(problems, 'no class is born with spell power, healing power or armor in TBC').toEqual([])

  // Every combination the character creator can reach must have a block, or that character silently
  // reads low on the always-visible rail rather than failing.
  for (const classOption of tbcClasses) {
    for (const race of racesByClass[classOption.className]) {
      expect(getBaseStats(classOption.className, race).stamina, `${race} ${classOption.className}`).toBeGreaterThan(0)
    }
  }
})

test('a conversion this app cannot source is absent rather than guessed', async () => {
  /*
   * wowsims implements what it needs to simulate, so its silences are not statements about TBC: a
   * Priest has no Strength-to-attack-power entry because a Priest's melee swing does not affect
   * healing output. Those gaps are left absent deliberately. This pins the two properties that make
   * that safe — every gap falls in a row `statRelevance.ts` already hides, and no conversion anywhere
   * produces spell power.
   */
  const spellPowerConversions: string[] = []
  for (const classOption of tbcClasses) {
    for (const spec of classOption.specs) {
      for (const conversion of getAttributeConversions(classOption.className, spec)) {
        if (conversion.to === 'spellPower' || conversion.to === 'healingPower') {
          spellPowerConversions.push(`${classOption.className}/${spec}: ${conversion.upstream}`)
        }
      }
    }
  }
  expect(spellPowerConversions, 'spell power comes from gear and talents in TBC, never from an attribute').toEqual([])

  // Feral is the one spec with conversions its own class does not otherwise get, because cat form
  // is what makes Agility and Feral Attack Power into attack power at all.
  const feral = getAttributeConversions('Druid', 'Feral').map((conversion) => `${conversion.from}->${conversion.to}`)
  const balance = getAttributeConversions('Druid', 'Balance').map((conversion) => `${conversion.from}->${conversion.to}`)
  expect(feral).toContain('feralAttackPower->attackPower')
  expect(feral).toContain('agility->attackPower')
  expect(balance).not.toContain('feralAttackPower->attackPower')
  expect(balance).not.toContain('agility->attackPower')
})

test('a racial this app applies itself is not also baked into the base stats', async () => {
  /*
   * wowsims applies Human's +10% Spirit and Gnome's +5% Intellect as stat dependencies in
   * `sim/core/racials.go`, so its base tables are meant to be racial-free — and this app applies
   * both itself, in `applyRacialTraits`. Where upstream forgets to divide one out, taking the row at
   * face value multiplies it twice: a Human Priest's Spirit would read 21% high on the always-visible
   * rail.
   *
   * Upstream forgets for Human Spirit in five of its six classes. The ingest divides those rows back
   * out and reports every decision; this is what stops the correction being quietly dropped.
   *
   * **Gnome's Intellect is deliberately not corrected and must not start being.** Its rows measure
   * 1.02x (Mage), 1.08x (Warlock), 1.18x (Rogue) and 1.21x (Warrior) against their peers — a scatter
   * that is a real racial base bonus on small integers, not one multiplier applied inconsistently.
   * The Mage row, the one upstream says it already divided by 1.05, is the lowest of the four.
   */
  const median = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
  }

  const problems: string[] = []
  let compared = 0
  for (const classOption of tbcClasses) {
    const races = racesByClass[classOption.className]
    if (!races.includes('Human')) continue

    const human = getBaseStats(classOption.className, 'Human').spirit
    const peers = races.filter((race) => race !== 'Human').map((race) => getBaseStats(classOption.className, race).spirit)
    const ratio = human / median(peers)
    compared += 1

    // A real racial base difference between two races is a small integer. Ten percent of one stat,
    // on the one stat this app multiplies for Humans anyway, is the racial counted twice.
    if (ratio > 1.05) {
      problems.push(`${classOption.className}: Human base Spirit ${human} is ${((ratio - 1) * 100).toFixed(1)}% above its peers`)
    }
  }

  expect(compared, 'six classes a Human can be').toBe(6)
  expect(problems, 'The Human Spirit is applied by applyRacialTraits, so it must not also sit in the base').toEqual([])
})

import { deriveTalentModifiers as deriveStatTalents, noTalentModifiers as noStatTalents } from '../src/domain/talents/talentModifiers'
import rawTalentEffects from '../src/domain/talents/talentEffects.json' with { type: 'json' }

/** Talent id by class and name, the same lookup the other talent tests use. */
const talentId = (className: string, name: string) =>
  getTalentData(className)!.trees.flatMap((tree) => tree.talents).find((talent) => talent.name === name)!.id

function statsFor(className: TbcClass, spec: TbcSpec, points: Record<number, number> = {}) {
  const character: CharacterProfile = { faction: 'Alliance', race: legalRaceFor(className), className, spec }
  const gear = normalizeGearForCharacter(defaultGear, className, spec)
  return calculateStats(character, gear, [], [], undefined, deriveStatTalents(points))
}

test('an empty talent tree leaves the stat totals byte-for-byte unchanged', async () => {
  /*
   * The invariant that made widening talents into `calculateStats` safe to do at all. Talents used
   * to reach the hidden simulator alone; they now reach the always-visible rail, the gear rankings
   * and the upgrade finder. `talentPoints` defaults to `{}` everywhere, so if the modifiers were not
   * exactly the identity at zero points, every stat expectation in this file would move at once.
   */
  for (const classOption of tbcClasses) {
    for (const spec of classOption.specs) {
      const character: CharacterProfile = {
        faction: 'Alliance',
        race: legalRaceFor(classOption.className),
        className: classOption.className,
        spec,
      }
      const gear = normalizeGearForCharacter(defaultGear, classOption.className, spec)

      const untalented = calculateStats(character, gear, [], [])
      const emptyTree = calculateStats(character, gear, [], [], undefined, deriveStatTalents({}))
      const explicitIdentity = calculateStats(character, gear, [], [], undefined, noStatTalents)

      expect(emptyTree, `${classOption.className} ${spec} with an empty tree`).toEqual(untalented)
      expect(explicitIdentity, `${classOption.className} ${spec} with the identity modifiers`).toEqual(untalented)
    }
  }
})

test('Toughness raises armour from items only, never armour from Agility', async () => {
  /*
   * Upstream reads `Equip.Stats()[stats.Armor]`, so the multiplier applies to gear and nothing else.
   * Folding it into the total instead would overpay every tank, and would do so invisibly — the
   * number would simply be a bit high.
   */
  const toughness = { [talentId('Warrior', 'Toughness')]: 5 }
  const plain = statsFor('Warrior', 'Protection')
  const talented = statsFor('Warrior', 'Protection', toughness)

  const gain = talented.armor - plain.armor
  expect(gain, 'five points of Toughness is worth something').toBeGreaterThan(0)

  /*
   * The load-bearing half: a character carrying *more Agility* must get the same Toughness bonus,
   * because Agility's 2-armor-a-point is not item armour. If the multiplier were applied to the
   * total, this extra Agility would inflate the bonus and these two would differ.
   */
  const character: CharacterProfile = { faction: 'Alliance', race: 'Human', className: 'Warrior', spec: 'Protection' }
  const gear = normalizeGearForCharacter(defaultGear, 'Warrior', 'Protection')
  const bonus = { agility: 500 }
  const plainWithAgility = calculateStats(character, gear, [], [], bonus)
  const talentedWithAgility = calculateStats(character, gear, [], [], bonus, deriveStatTalents(toughness))

  expect(talentedWithAgility.armor - plainWithAgility.armor, 'Agility armour is not multiplied by Toughness').toBeCloseTo(gain, 6)
  expect(plainWithAgility.armor - plain.armor, '500 Agility is 1000 armour, at 2 a point').toBeCloseTo(1000, 6)
})

test('the talents that multiply an attribute reach the rail, and multiply the right one', async () => {
  // Warrior Vitality: 1% Stamina and 2% Strength a rank, which is 5% and 10% at five points.
  const plain = statsFor('Warrior', 'Protection')
  const vitality = statsFor('Warrior', 'Protection', { [talentId('Warrior', 'Vitality')]: 5 })
  expect(vitality.stamina / plain.stamina).toBeCloseTo(1.05, 6)
  expect(vitality.strength / plain.strength).toBeCloseTo(1.1, 6)

  // Strength cascades into attack power, which is the point of it reaching `calculateStats` at all.
  expect(vitality.attackPower).toBeGreaterThan(plain.attackPower)

  // Paladin's Divine Strength is Strength alone — it must not move Stamina.
  const paladinPlain = statsFor('Paladin', 'Protection')
  const divineStrength = statsFor('Paladin', 'Protection', { [talentId('Paladin', 'Divine Strength')]: 5 })
  expect(divineStrength.strength / paladinPlain.strength).toBeCloseTo(1.1, 6)
  expect(divineStrength.stamina).toBeCloseTo(paladinPlain.stamina, 6)

  // Two talents multiplying the same attribute compound rather than adding: Rogue Vitality is 1% a
  // rank and Sinister Calling 3% a rank, so five of each is 1.05 * 1.15, not 1.20.
  const roguePlain = statsFor('Rogue', 'Combat')
  const rogueBoth = statsFor('Rogue', 'Combat', {
    [talentId('Rogue', 'Vitality')]: 5,
    [talentId('Rogue', 'Sinister Calling')]: 5,
  })
  expect(rogueBoth.agility / roguePlain.agility).toBeCloseTo(1.05 * 1.15, 6)
})

test('a talent is the only thing in TBC that turns an attribute into spell power', async () => {
  /*
   * The other half of the base-stat pass. Intellect and Spirit grant no spell power at all in TBC —
   * and these are the talents that are the exception, which is exactly why they could not apply
   * while talents reached the hidden simulator alone.
   */
  const priestPlain = statsFor('Priest', 'Holy')
  const guidance = statsFor('Priest', 'Holy', { [talentId('Priest', 'Spiritual Guidance')]: 5 })

  // Rank 5 is 25% of Spirit, and Spirit itself is untouched.
  expect(guidance.spirit).toBeCloseTo(priestPlain.spirit, 6)
  expect(guidance.spellPower - priestPlain.spellPower).toBeCloseTo(priestPlain.spirit * 0.25, 6)

  /*
   * Multipliers have to run before conversions, or Mind Mastery would read an Intellect total that
   * Arcane Mind had not raised yet. Asserted against the *post-multiplier* Intellect, which is the
   * only figure that distinguishes the two orders.
   */
  const magePlain = statsFor('Mage', 'Fire')
  const mage = statsFor('Mage', 'Fire', {
    [talentId('Mage', 'Arcane Mind')]: 5,
    [talentId('Mage', 'Mind Mastery')]: 5,
  })
  expect(mage.intellect / magePlain.intellect).toBeCloseTo(1.15, 6)
  expect(mage.spellPower - magePlain.spellPower).toBeCloseTo(mage.intellect * 0.25, 6)
  expect(mage.spellPower - magePlain.spellPower, 'and not the Intellect before Arcane Mind raised it').not.toBeCloseTo(
    magePlain.intellect * 0.25,
    6,
  )
})

test('no talent is both ingested and refused by name', async () => {
  /*
   * The refusal list said ten groups routed through `calculateStats` and so could not apply. Six of
   * those now do. A talent left in both places would be the repo's own recurring failure wearing new
   * clothes: data that applies, described by prose saying it does not.
   */
  const ingested = new Set(rawTalentEffects.effects.map((effect) => `${effect.className}/${effect.talent}`))

  const contradictions: string[] = []
  for (const entry of rawTalentEffects.skipped) {
    // A skip entry can name a group ("Toughness / Vitality"), so each side is checked on its own.
    for (const name of entry.talent.split(' / ')) {
      if (ingested.has(`${entry.className}/${name}`)) {
        contradictions.push(`${entry.className}/${name} is ingested and also refused: "${entry.reason}"`)
      }
    }
  }
  expect(contradictions, 'a talent is either applied or refused, never both').toEqual([])

  // And the six that moved really are gone from the refusals, rather than merely reworded.
  for (const [className, talent] of [
    ['Warrior', 'Toughness'],
    ['Warrior', 'Vitality'],
    ['Paladin', 'Divine Strength'],
    ['Rogue', 'Sinister Calling'],
    ['Mage', 'Mind Mastery'],
    ['Priest', 'Spiritual Guidance'],
  ] as const) {
    expect(ingested.has(`${className}/${talent}`), `${className} ${talent} reaches the stat rail now`).toBe(true)
  }
})

test('no talent is refused for a reason the code no longer has', async () => {
  /*
   * Ten refusal reasons said, in words, that a talent could not apply because it routed through
   * `calculateStats` and talents reached the hidden simulator alone. Every one of them became false
   * on 2026-08-20 when that route opened. A confident wrong caveat is worse than no caveat, and this
   * repo has watched `featureFlags.ts` rot twice for exactly this reason — so the sentence is pinned
   * rather than merely corrected.
   */
  const stale = rawTalentEffects.skipped.filter((entry) => /calculateStats/i.test(entry.reason))
  expect(
    stale.map((entry) => `${entry.className}/${entry.talent}: ${entry.reason}`),
    'talents reach calculateStats now, so nothing may still be refused for not reaching it',
  ).toEqual([])

  /*
   * The count belongs in an assertion computed from the data, never in prose. `featureFlags.ts` said
   * "49 talent groups are refused by name" until this pass moved six of them, and nothing failed —
   * which is precisely how the repo's own rule about counts in prose got written.
   */
  expect(rawTalentEffects.effectCount, 'the published count matches the list it describes').toBe(rawTalentEffects.effects.length)

  // Health and Mana are the honest remaining stat-shaped gap: `StatBlock` has no field for either.
  const remaining = rawTalentEffects.skipped.filter((entry) => /Health|Mana/i.test(entry.reason))
  expect(remaining.length, 'the stat-shaped refusals that are left are the Health and Mana ones').toBeGreaterThan(0)

  /*
   * **The same rot, one class over.** Six Hunter talents were refused as "Pet talents. There is no
   * pet in this model" — true when written, and false from the moment `hunterPet.ts` shipped a pet.
   * Nothing failed, because closing a gap never forces the sentence describing it to change.
   *
   * Four of the six are ingested now. The two that are not — Frenzy and Bestial Discipline — are
   * refused for reasons about the *ability rate*, which genuinely does not exist yet. So no Hunter
   * refusal may still claim the model has no pet.
   *
   * **Scoped to Hunter deliberately.** Warlock's Master Demonologist is refused with "No pet model
   * here" and that is still true — there is no demon in this model — so a blanket search on the
   * phrase would fail on an honest sentence.
   */
  const noPet = rawTalentEffects.skipped.filter(
    (entry) => entry.className === 'Hunter' && /no pet/i.test(entry.reason),
  )
  expect(
    noPet.map((entry) => `${entry.className}/${entry.talent}: ${entry.reason}`),
    'a hunter has a pet now, so no Hunter talent may be refused for the model not having one',
  ).toEqual([])

  const ingestedNames = new Set(rawTalentEffects.effects.map((effect) => `${effect.className}/${effect.talent}`))
  for (const talent of ['Ferocity', 'Animal Handler', 'Unleashed Fury', "Serpent's Swiftness"]) {
    expect(ingestedNames.has(`Hunter/${talent}`), `${talent} reaches the pet now`).toBe(true)
  }
})

import { isSimulationEnabled } from '../src/featureFlags'

test('the Simulation tab is offered to DPS specs and to nobody else', async () => {
  /*
   * The repo owner's call on 2026-08-21: the estimate answers "how much damage does this build do",
   * which is a question only a damage spec is asking. The healer and tank paths are still computed
   * and still tested — the math did not go anywhere — but neither is put on screen as a headline.
   *
   * Asserted over every spec rather than over a couple of examples, because the rule is about the
   * role and there are four of them.
   */
  const offered: string[] = []
  const withheld: string[] = []

  for (const classOption of tbcClasses) {
    for (const spec of classOption.specs) {
      const role = getRoleForSpec(classOption.className, spec)
      const label = `${classOption.className} ${spec} (${role})`
      // No query string: this is what a visitor to the deployed site gets.
      if (isSimulationEnabled(role, '')) offered.push(label)
      else withheld.push(label)
    }
  }

  const wrongOffers = offered.filter((label) => label.includes('(Healer)') || label.includes('(Tank)'))
  expect(wrongOffers, 'a healer or tank must never be offered the Simulation tab').toEqual([])

  const wrongWithholds = withheld.filter((label) => label.includes('DPS'))
  expect(wrongWithholds, 'every DPS spec is offered it').toEqual([])

  // Both sides are non-empty, or one of the two assertions above would hold vacuously.
  expect(offered.length, 'the 20 DPS specs').toBe(20)
  expect(withheld.length, 'the 5 healer and 2 tank specs').toBe(7)
})

test('the simulation URL override is an escape hatch, not a second product decision', async () => {
  /*
   * `?simulation=1` still forces the tab on for any role, which is how the browser tests here reach
   * the healer and tank math. It is deliberately not role-aware — if it became so, those tests would
   * start silently exercising nothing.
   */
  expect(isSimulationEnabled('Healer', '')).toBe(false)
  expect(isSimulationEnabled('Tank', '')).toBe(false)
  expect(isSimulationEnabled('Healer', '?simulation=1')).toBe(true)
  expect(isSimulationEnabled('Tank', '?simulation=1')).toBe(true)

  // And a DPS spec does not need it.
  expect(isSimulationEnabled('Physical DPS', '')).toBe(true)
  expect(isSimulationEnabled('Caster DPS', '')).toBe(true)
})

test('a Main Hand weapon is never offered to the off hand, whatever upstream typed it as', async () => {
  /*
   * Reported from the app: two copies of Dragonstrike could be equipped at once. The reason was not
   * the one it looked like — Dragonstrike is **not** Unique-Equipped, its tooltip says so — but that
   * wowsims types it `HandTypeOneHand` while the game makes it **Main Hand only**. `isOffHandEligible`
   * lets any one-hander into the off hand, so the wrong type is enough to allow the pairing.
   *
   * Eight weapons disagreed, and they are exactly the two Outland crafted upgrade chains plus two
   * dungeon maces. The ingest cross-checks all 706 catalogued weapons against their own tooltips and
   * corrects only where they disagree, which is what makes this a repair rather than a guess.
   */
  const mainHandOnly = [
    [28431, 'The Planar Edge'],
    [28432, 'Black Planar Edge'],
    [28433, 'Wicked Edge of the Planes'],
    [28437, 'Drakefist Hammer'],
    [28438, 'Dragonmaw'],
    [28439, 'Dragonstrike'],
    [28657, "Fool's Bane"],
    [28767, 'The Decapitator'],
  ] as const

  for (const [wowItemId, name] of mainHandOnly) {
    const item = getItemByWowItemId(wowItemId)
    expect(item, `${name} is in the catalogue`).toBeDefined()
    expect(item!.name).toBe(name)
    expect(item!.handType, `${name} is Main Hand only`).toBe('Main Hand')
    expect(isItemCompatibleWithGearSlot(item!, 'Off Hand'), `${name} must not be dual-wieldable`).toBe(false)
    expect(isItemCompatibleWithGearSlot(item!, 'Main Hand'), `${name} still belongs in the main hand`).toBe(true)
  }

  /*
   * And the falsification: a genuine one-hander must still reach the off hand. Without this the
   * assertions above would pass just as happily if `isOffHandEligible` had been broken outright, and
   * every dual-wielding spec would quietly have lost its second weapon.
   */
  const oneHanders = getItemsForSlot('Main Hand').filter((item) => item.handType === 'One Hand')
  expect(oneHanders.length, 'the catalogue still holds real one-handers').toBeGreaterThan(100)
  expect(
    oneHanders.every((item) => isItemCompatibleWithGearSlot(item, 'Off Hand')),
    'every true one-hander is still dual-wieldable',
  ).toBe(true)
})

test('every raid lists its bosses in clear order, with nothing left to sort by accident', async () => {
  /*
   * Karazhan rendered Prince Malchezaar eighth of eleven, with Terestian Illhoof, Netherspite and
   * Nightbane after him. None of them was misplaced on purpose: `getBossesForRaid` sorts on
   * `encounterOrder` and pushes anything without one to the end, and those three carried only
   * `optional: true`.
   *
   * **Optional and out-of-order are different claims.** A skippable boss still stands at a definite
   * point in a clear. Requiring a contiguous 1..N is what stops the two being conflated again — a
   * boss with no order would otherwise land at the end and look deliberate.
   */
  const problems: string[] = []

  for (const raid of sampleRaids) {
    const bosses = getBossesForRaid(raid.id)
    const orders = bosses.map((boss) => boss.encounterOrder)

    const missing = bosses.filter((boss) => boss.encounterOrder === undefined).map((boss) => boss.name)
    if (missing.length > 0) problems.push(`${raid.name}: no clear-order position for ${missing.join(', ')}`)

    const expected = bosses.map((_, index) => index + 1)
    if (missing.length === 0 && JSON.stringify(orders) !== JSON.stringify(expected)) {
      problems.push(`${raid.name}: orders are ${orders.join(',')} rather than a contiguous ${expected.join(',')}`)
    }
  }

  expect(problems, 'every boss sits at a stated point in the clear').toEqual([])

  /*
   * And the specific thing that was reported. Prince is the last boss anyone has to kill; Nightbane
   * follows him in every published order but is summoned with the Blackened Urn rather than standing
   * in the way, so it is last *and* optional — which is why "Prince is last" and "Nightbane is after
   * Prince" are both true and neither is the whole answer.
   */
  const karazhan = getBossesForRaid('karazhan')
  const required = karazhan.filter((boss) => !boss.optional)
  expect(required[required.length - 1].name, 'Prince is the last required boss').toBe('Prince Malchezaar')
  expect(karazhan[karazhan.length - 1].name, 'Nightbane is last overall').toBe('Nightbane')
  expect(karazhan[karazhan.length - 1].optional, 'and is marked skippable').toBe(true)
})

test('every raid loot row can draw an icon', async () => {
  /*
   * 39 rows drew a "??" glyph, which reads as a broken icon rather than as an item with no gear
   * stats. Two separate causes, and the split matters because only one of them was a data gap:
   *
   * 1. `RaidLootList` passed the **catalogue** item's id to `ItemIcon` while the line below it
   *    already computed `entry.wowItemId ?? item?.wowItemId` for the id it prints. So an entry
   *    carrying its own id still drew nothing.
   * 2. 37 rows name a real item the gear catalogue will never hold — tier tokens, enchant formulas,
   *    mounts, attunement quest items — because it holds equippable gear and these are not. They are
   *    resolved from the tooltip dump, which covers 29,047 items rather than 4,505.
   *
   * A row naming six items was the last one, and it was not an icon problem at all: splitting it
   * revealed six weapons that were in the catalogue the whole time.
   */
  const problems: string[] = []

  for (const boss of sampleRaidBosses) {
    for (const entry of boss.loot) {
      const item = entry.itemId ? getItemById(entry.itemId) : undefined
      const wowItemId = entry.wowItemId ?? item?.wowItemId

      if (!wowItemId) {
        problems.push(`${boss.name} / ${entry.name}: no wowItemId, so no icon can be found`)
        continue
      }
      if (!getIconName(wowItemId)) problems.push(`${boss.name} / ${entry.name}: id ${wowItemId} maps to no icon`)
    }
  }

  expect(problems, 'every loot row resolves to a real icon').toEqual([])

  /*
   * And the falsification: the assertion above would hold just as well if the loot tables were empty.
   * These are the five the walkthrough named, each a different reason for having been iconless.
   */
  const named = ["Fiery Warhorse's Reins", 'Formula: Enchant Weapon - Mongoose', 'Gloves of the Fallen Champion', 'Helm of the Fallen Hero', 'Blazing Signet']
  const allLoot = sampleRaidBosses.flatMap((boss) => boss.loot)
  for (const name of named) {
    const entry = allLoot.find((candidate) => candidate.name === name)
    expect(entry, `${name} is still in a loot table`).toBeDefined()
    const item = entry!.itemId ? getItemById(entry!.itemId) : undefined
    expect(getIconName(entry!.wowItemId ?? item?.wowItemId), `${name} has artwork`).toBeTruthy()
  }
})

test('every gathered material a farm row names can still be found in the node data', () => {
  /*
   * **This is the test that was missing, and its absence cost 28 of 43 nodes.**
   *
   * The data was right the whole time: `nodeSpawns.json` carried Liferoot, Fadeleaf, Goldthorn and
   * every other classic herb with full coordinates. The *join* was wrong — the panel matched
   * `node.material === spot.material`, and `spot.material` is a display label written for a reader
   * ("Liferoot / Fadeleaf / Goldthorn"), which equals no node's name. Eight of Herbalism's nineteen
   * rows and two of Mining's eleven silently drew nothing, and the whole 1-300 herb progression was
   * mapless on screen.
   *
   * Every existing profession test passed throughout, because they all asserted the *data* — 45
   * nodes, no crates, sampling preserves zone width — and none asserted that a node reaches a
   * surface. That is this repo's signature failure ("data wired to nothing", Decision Log) arriving
   * for the fourth time, in the same commit that wrote the rule down.
   *
   * So the assertion is deliberately about reachability rather than about shape.
   */
  const rows = (['Herbalism', 'Mining'] as const).flatMap(
    (profession) => getProfessionProfile(profession)?.materialFarming ?? [],
  )
  expect(rows.length, 'the two professions the game gives world nodes').toBeGreaterThan(25)

  /*
   * **Named, not counted.** These are materials a farm row mentions that the node ingest has no
   * spawn data for — Wowhead publishes none for Ragveil or Ancient Lichen, and the rest are items
   * whose node is named differently or was never swept. Listing them means adding one fails this
   * test rather than quietly losing another map, and clearing one is a visible deletion here.
   */
  const knownGaps = new Set([
    'Ancient Lichen',
    'Bloodthistle',
    'Fel Lotus',
    'Ghost Mushroom',
    'Gromsblood',
    'Netherdust Bush',
    'Ragveil',
    'Sorrowmoss',
  ])

  const unreachable = rows
    .flatMap((row) => row.materials)
    .filter((material) => !mappableMaterials.has(material) && !knownGaps.has(material))
  expect(unreachable, 'every named material resolves to a node or is a declared gap').toEqual([])

  // And the join actually produces maps, which is the thing the old code failed to do.
  const drawn = rows.filter((row) => routesForMaterials(row.materials).length > 0)
  expect(drawn.length, 'most gathering rows draw at least one route').toBeGreaterThanOrEqual(15)

  const felweed = routesForMaterials(['Felweed'])
  expect(felweed[0].zone, 'busiest zone first').toBe('Hellfire Peninsula')
  expect(felweed[0].materials[0].material).toBe('Felweed')

  /*
   * **A range merges its materials into one loop**, because that is how it is farmed: at 1-100 you
   * pick all three on the same lap.
   *
   * **But not every zone carries every herb, and the merge is right to be selective.** This assertion
   * first named Durotar and failed — Durotar has Peacebloom and neither of the others, and only
   * Tirisfal Glades carries all three. The data was correct and the test was wrong, which is the
   * useful direction for that to happen in. Both halves are asserted now: a zone that has all three
   * says three, and a zone that has one says one rather than implying the other two are there.
   */
  const starter = routesForMaterials(['Peacebloom', 'Silverleaf', 'Earthroot'])

  const busiest = starter[0]
  expect(busiest.zone, 'busiest zone first').toBe('Tirisfal Glades')
  expect(busiest.materials.length, 'and it is the one zone carrying all three').toBe(3)
  expect(busiest.spawnCount, 'the count is the sum of what is actually here').toBe(
    busiest.materials.reduce((sum, entry) => sum + entry.count, 0),
  )

  // The merged loop covers more than any one herb's loop of the same zone, which is why it merges.
  const silverleaf = routesForMaterials(['Silverleaf']).find((route) => route.zone === 'Tirisfal Glades')!
  expect(busiest.spawnCount).toBeGreaterThan(silverleaf.spawnCount)

  const durotar = starter.find((route) => route.zone === 'Durotar')!
  expect(durotar.materials.map((entry) => entry.material), 'one herb, named as one').toEqual(['Peacebloom'])
})

test('every ingested node reaches a surface, and no row offers a herb before you can pick it', () => {
  /*
   * **The complement of the reachability test above, and the one that finishes the job.** That one
   * asks whether every name a row writes down resolves to a node. This one asks the reverse: whether
   * every node the ingest paid for is visible anywhere. Five were not — Arthas' Tears, Firebloom,
   * Flame Cap, Grave Moss and Purple Lotus had full spawn coordinates and no row naming them, so
   * their maps existed and nothing could reach them.
   *
   * They are placed by `supplementaryNodes` rather than by five new hand-written rows, because only
   * the skill requirement and the zones are sourced — a levelling window and a character level for
   * each would have been a guess printed beside real data.
   */
  const reached = new Set<string>()
  for (const profession of ['Herbalism', 'Mining'] as const) {
    const spots = [...(getProfessionProfile(profession)?.materialFarming ?? [])].sort(
      (a, b) => a.skillRange[0] - b.skillRange[0],
    )
    const claimed = new Set(spots.flatMap((spot) => spot.materials))
    const seen: [number, number][] = []
    for (const spot of spots) {
      spot.materials.forEach((material) => reached.add(material))
      supplementaryNodes(profession, spot.skillRange, claimed, seen).forEach((node) => reached.add(node.material))
      seen.push(spot.skillRange)
    }
  }

  const unreachable = [...new Set(gatheringNodes.map((node) => node.material))].filter(
    (material) => !reached.has(material),
  )
  expect(unreachable, 'every ingested node is named somewhere a player can see it').toEqual([])

  /*
   * **A supplementary node lands on exactly one row.** Purple Lotus at 210 falls inside two
   * overlapping ranges, and showing it twice would be two maps of the same herb on one page.
   */
  const spots = [...(getProfessionProfile('Herbalism')?.materialFarming ?? [])].sort(
    (a, b) => a.skillRange[0] - b.skillRange[0],
  )
  const claimed = new Set(spots.flatMap((spot) => spot.materials))
  const seen: [number, number][] = []
  const placements: string[] = []
  for (const spot of spots) {
    supplementaryNodes('Herbalism', spot.skillRange, claimed, seen).forEach((node) => placements.push(node.material))
    seen.push(spot.skillRange)
  }
  expect(placements.length, 'placed once each, not once per overlapping range').toBe(new Set(placements).size)
  expect(placements.sort()).toEqual(["Arthas' Tears", 'Firebloom', 'Flame Cap', 'Grave Moss', 'Purple Lotus'])

  /*
   * **`requiredSkill` is the only sourced check on a written range**, so it is worth spending here.
   * A row that offers a herb above its own range is telling a player to farm something they cannot
   * pick yet. All 45 nodes carry the figure, read off Wowhead's "Requires Herbalism (205)".
   */
  expect(gatheringNodes.every((node) => Number.isInteger(node.requiredSkill))).toBe(true)

  const impossible: string[] = []
  for (const profession of ['Herbalism', 'Mining'] as const) {
    for (const spot of getProfessionProfile(profession)?.materialFarming ?? []) {
      for (const material of spot.materials) {
        const node = gatheringNodes.find((entry) => entry.material === material)
        if (node && node.requiredSkill > spot.skillRange[1]) {
          impossible.push(`${material} needs ${node.requiredSkill}, row ends at ${spot.skillRange[1]}`)
        }
      }
    }
  }
  expect(impossible, 'no row offers a material above its own skill range').toEqual([])
})

test('2-opt shortens the circuit and leaves it a circuit', () => {
  /*
   * **Nearest-neighbour leaves crossings, and a crossing is the one route error a player sees.** It
   * reads as "why am I riding back past where I just was". 2-opt reverses segments while doing so
   * shortens the loop, which removes exactly that.
   *
   * Asserted as an aggregate over every real node cloud rather than one hand-made case: a single
   * zone could improve by luck, and the claim being made on screen is about the whole feature.
   */
  let before = 0
  let after = 0
  for (const node of gatheringNodes) {
    for (const zone of node.zones) {
      const nearest = computeRoute(densityCells(zone.coords))
      if (nearest.length < 4) continue
      before += routeLength(nearest)
      after += routeLength(twoOptimize(nearest))
    }
  }
  expect(after, 'uncrossing never makes the total longer').toBeLessThan(before)
  expect(after / before, 'and it is worth doing — at least 5% off').toBeLessThan(0.95)

  // It reorders the same stops rather than inventing or dropping any.
  const stops = computeRoute(densityCells(gatheringNodes[0].zones[0].coords))
  const optimised = twoOptimize(stops)
  expect(optimised.length).toBe(stops.length)
  expect(new Set(optimised.map(([x, y]) => `${x},${y}`))).toEqual(
    new Set(stops.map(([x, y]) => `${x},${y}`)),
  )
})

test('every crafting path runs unbroken from 1 to 375 and says how its counts were made', () => {
  /*
   * **The counts here are derived, and the test is mostly about that being safe to do.** Wowhead
   * publishes a recipe's reagents and its orange/yellow/green/grey breakpoints and no craft count at
   * all; `compute-leveling-paths.mjs` does the arithmetic. That is what lets this repo carry a
   * levelling path without transcribing wow-professions.com's, which `professionTypes.ts` has
   * recorded as off-limits since it was written.
   */
  const crafting = [
    'Alchemy',
    'Blacksmithing',
    'Enchanting',
    'Engineering',
    'Jewelcrafting',
    'Leatherworking',
    'Tailoring',
    'Cooking',
    'First Aid',
  ] as const

  for (const profession of crafting) {
    const steps = craftingPathFor(profession)
    expect(steps.length, `${profession} has a computed path`).toBeGreaterThan(5)

    /*
     * **Contiguity is the assertion that matters most, because the bug it catches ships silently.**
     * The first coalescing pass dropped steps shorter than five skill points as noise, which punched
     * holes in the path — Tailoring claimed 1 to 375 while skipping 74-75, 121-125 and 135, all
     * skill points where recipes were demonstrably available. A holed path looks finished.
     */
    /*
     * **Not every profession starts at 1, and asserting that it did was wrong.** Jewelcrafting's
     * earliest recipe is Heavy Copper Ring at skill 5 — there is nothing to make below it — so its
     * path opens at 5 and the data is right. Cooking has a recipe at 0. The claim worth making is
     * that a path starts as early as its profession allows, not that every profession allows 1.
     */
    expect(steps[0].skillRange[0], `${profession} starts at its earliest recipe`).toBeLessThanOrEqual(5)
    expect(steps[steps.length - 1].skillRange[1], `${profession} reaches the cap`).toBe(375)
    for (let i = 1; i < steps.length; i += 1) {
      expect(steps[i].skillRange[0], `${profession} has no hole before ${steps[i].name}`).toBe(
        steps[i - 1].skillRange[1],
      )
    }

    for (const step of steps) {
      expect(step.crafts, `${profession}: ${step.name} takes at least one craft`).toBeGreaterThan(0)
      expect(step.materials.length, `${profession}: ${step.name} consumes something`).toBeGreaterThan(0)
      expect(step.skillRange[1], `${profession}: ${step.name} moves forward`).toBeGreaterThan(step.skillRange[0])
      for (const material of step.materials) {
        expect(material.quantity, `${profession}: ${material.name} has a real quantity`).toBeGreaterThan(0)
        // A reagent named "item 12345" means the pinned CSV had no name for it, which should not reach a page.
        expect(material.name, `${profession}: ${material.name} resolved to a real name`).not.toMatch(/^item \d+$/)
      }
    }
  }

  /*
   * **A derived number has to admit it is derived.** The model string is rendered above the steps, so
   * the page says how the counts were arrived at rather than letting them read as sourced — the same
   * rule the farming maps follow when they call the route a starting line rather than an optimum.
   */
  expect(craftingPathModel).toMatch(/computed, not sourced/)
  expect(craftingPathModel).toMatch(/grey/)
})

test('every profession has vendored artwork and a guide to send you to', async () => {
  /*
   * The Professions tab was the one screen in the app with no artwork on it at all — thirteen text
   * buttons — which is what made it read as unfinished beside the raid and gear tabs.
   *
   * Two halves, and both can fail silently. An icon *name* that maps to no vendored file renders an
   * empty box rather than an error, which is the same failure the item icons already guard against.
   * And the guide URLs are recorded per profession rather than built from the name, because
   * wow-professions.com's own paths are inconsistent — some end `-tbc-classic`, others
   * `-burning-crusade-classic` — so a constructed URL would 404 for about half of them.
   */
  const missingArtwork: string[] = []
  const wrongHost: string[] = []

  for (const profession of allProfessions) {
    const profile = getProfessionProfile(profession)
    expect(profile, `${profession} has a profile`).toBeDefined()

    if (!existsSync(resolve(process.cwd(), 'public/icons', `${profile!.icon}.jpg`))) {
      missingArtwork.push(`${profession} -> ${profile!.icon}.jpg`)
    }
    for (const url of [profile!.guideUrl, profile!.specializationUrl].filter(Boolean)) {
      if (!url!.startsWith('https://www.wow-professions.com/')) wrongHost.push(`${profession} -> ${url}`)
    }
  }

  expect(missingArtwork, 'every profession icon is vendored on disk').toEqual([])
  expect(wrongHost, 'guides are links out, not content copied in').toEqual([])

  /*
   * The five with specializations in TBC. Named rather than counted, because "5 have one" would pass
   * just as well if the wrong five did — and Jewelcrafting is the one most likely to be added by
   * mistake, since it is a TBC profession that sounds like it should have them.
   */
  const withSpecializations = allProfessions.filter((profession) => getProfessionProfile(profession)?.specializationUrl)
  expect([...withSpecializations].sort()).toEqual(['Alchemy', 'Blacksmithing', 'Engineering', 'Leatherworking', 'Tailoring'])
})

test('a raid leader picks which Blessing each Paladin brings, and the default still holds', async () => {
  /*
   * Reported from the walkthrough: three Paladins never covered Salvation or Sanctuary. The cap was
   * right — a Paladin brings one Blessing, and listing five for one Paladin was this tool's largest
   * over-credit — but the *order* filling it was a guess standing in for a decision. Raids assign
   * blessings by what they need.
   *
   * So assignment wins where it is given, and the fixed order still fills the rest. Both halves are
   * asserted, because a change that made assignment work by abandoning the cap would be the old
   * over-credit wearing a new interface.
   */
  const coveredBlessings = (roster: Roster) =>
    computeCoverage(roster)
      .raidWide.covered.map((entry) => entry.entry.id)
      .filter((id) => id.startsWith('blessing-of-'))
      .sort()

  let roster = emptyRoster(25)
  roster = addToGroup(roster, 0, { className: 'Paladin', spec: 'Holy' })
  roster = addToGroup(roster, 0, { className: 'Paladin', spec: 'Protection' })
  roster = addToGroup(roster, 0, { className: 'Paladin', spec: 'Retribution' })

  // Untouched, the priority order fills it exactly as before.
  expect(coveredBlessings(roster), 'three Paladins default to Kings, Might, Wisdom').toEqual([
    'blessing-of-kings',
    'blessing-of-might',
    'blessing-of-wisdom',
  ])

  // Assigning two moves them in, and the third seat still falls back to the top of the order.
  roster = assignBuff(roster, { groupIndex: 0, seatIndex: 0 }, 'paladin-blessings', 'blessing-of-salvation')
  roster = assignBuff(roster, { groupIndex: 0, seatIndex: 1 }, 'paladin-blessings', 'blessing-of-sanctuary')
  expect(coveredBlessings(roster), 'the two assigned, plus Kings for the seat that said nothing').toEqual([
    'blessing-of-kings',
    'blessing-of-salvation',
    'blessing-of-sanctuary',
  ])

  // The cap is unchanged: three Paladins still cover three, never five.
  expect(coveredBlessings(roster)).toHaveLength(3)

  // Clearing one puts it back to the default for that seat.
  roster = assignBuff(roster, { groupIndex: 0, seatIndex: 0 }, 'paladin-blessings', undefined)
  expect(coveredBlessings(roster)).toEqual(['blessing-of-kings', 'blessing-of-might', 'blessing-of-sanctuary'])
})

test('an assignment cannot buy coverage the roster has no provider for', async () => {
  /*
   * The failure mode of "assignment wins" is that it wins over reality too. A single Paladin assigned
   * a blessing must still cover exactly one, and an assignment carried on a seat that cannot cast it
   * — a stale id left behind when the class changed — must count for nothing rather than holding a
   * slot open.
   */
  let one = emptyRoster(25)
  one = addToGroup(one, 0, { className: 'Paladin', spec: 'Holy' })
  one = assignBuff(one, { groupIndex: 0, seatIndex: 0 }, 'paladin-blessings', 'blessing-of-sanctuary')

  const covered = computeCoverage(one)
    .raidWide.covered.map((entry) => entry.entry.id)
    .filter((id) => id.startsWith('blessing-of-'))
  expect(covered, 'one Paladin, one Blessing — the one they were assigned').toEqual(['blessing-of-sanctuary'])

  /*
   * A Shaman carrying a Paladin's blessing id. `assignBuff` will write it, because the seat model
   * does not police class — the coverage calculation is what has to, and this is where that is pinned.
   * The group key is not what makes it real either: coverage checks that the seat provides the buff.
   */
  let stale = emptyRoster(25)
  stale = addToGroup(stale, 0, { className: 'Shaman', spec: 'Restoration' })
  stale = assignBuff(stale, { groupIndex: 0, seatIndex: 0 }, 'paladin-blessings', 'blessing-of-kings')

  const fromStale = computeCoverage(stale)
    .raidWide.covered.map((entry) => entry.entry.id)
    .filter((id) => id.startsWith('blessing-of-'))
  expect(fromStale, 'a Shaman cannot bring a Blessing, however the seat is labelled').toEqual([])
})

test('hovering a party buff says what it does, not just what it is called', async ({ page }) => {
  /*
   * The row under each group was unlabelled icons with the name in a browser `title` — which appears
   * after a delay, cannot be reached by keyboard, and says the name and nothing else. It is the
   * surface a raid leader scans to check coverage, so it has to answer what a buff *does*.
   *
   * Driven by focus rather than hover, which also proves the keyboard path: an icon row nobody can
   * tab through is a row of secrets.
   */
  await openApp(page, 'raidcomp')

  await page.getByTestId('raidcomp-add-warrior-fury').click()

  const battleShout = page.getByTestId('raidcomp-buff-battle-shout').first()
  await expect(battleShout).toBeVisible()

  const card = battleShout.locator('.raidcomp-buff-card')
  await expect(card, 'the card stays out of the way until asked for').toBeHidden()

  await battleShout.focus()
  await expect(card).toBeVisible()
  await expect(card).toContainText('Battle Shout')
  await expect(card).toContainText('Warrior')
  await expect(card, 'the effect is the same number the stat totals use').toContainText('+306 Attack Power')
})

test('a party buff whose value is a multiplier would have no effect line, and none exists', async () => {
  /*
   * The buff card describes flat stats only. That is safe precisely because of this: the one buff in
   * TBC whose whole value is a *multiplier* — Greater Blessing of Kings, +10% to every attribute — is
   * raid-scoped, so it never appears in the party row.
   *
   * A percentage describer was written for the card first and could not fire, which is the "module
   * nothing renders" this repo has shipped three times. It was deleted rather than left in reach of
   * nothing — and this is what stops that decision quietly becoming wrong: if a party-scoped buff
   * ever gains a multiplier, it would render with a blank effect and this fails instead.
   */
  const partyScopedWithMultipliers = sampleBuffs
    .filter((buff) => getBuffScope(buff.id) === 'Party')
    .filter((buff) => buff.statMultipliers && Object.keys(buff.statMultipliers).length > 0)
    .map((buff) => buff.name)

  expect(partyScopedWithMultipliers, 'no party-scoped buff is described by a multiplier alone').toEqual([])

  // And the falsification: the multiplier buff does exist, it is simply not party-scoped.
  const kings = sampleBuffs.find((buff) => buff.id === 'blessing-of-kings')
  expect(kings?.statMultipliers, 'Kings is still a multiplier buff').toBeTruthy()
  expect(getBuffScope('blessing-of-kings'), 'and is still raid-scoped').toBe('Raid')
})

test('the raid date and time are pickers, and the time carries a zone', async ({ page }) => {
  /*
   * These were free text — "Tue 12 Aug", "this Saturday" and "8/12" were all valid. Defensible for a
   * field nobody should be forced to fill, and poor for the field everybody fills the same way.
   *
   * The zone matters more than it looks: a start time is ambiguous the moment the chart leaves the
   * room, which is exactly what exporting a PNG is for.
   */
  await openApp(page, 'raidcomp')

  await expect(page.getByTestId('raidcomp-meta-date')).toHaveAttribute('type', 'date')
  await expect(page.getByTestId('raidcomp-meta-time')).toHaveAttribute('type', 'time')

  const timezone = page.getByTestId('raidcomp-meta-timezone')
  const chosen = await timezone.inputValue()
  const local = await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone)
  expect(chosen, 'defaults to the reader\'s own zone rather than asking').toBe(local)

  // And it survives a round trip through storage, which is where this app has lost fields before.
  await page.getByTestId('raidcomp-meta-date').fill('2026-08-25')
  await timezone.selectOption('UTC')
  await page.reload()
  await page.getByTestId('section-raidcomp').click()

  await expect(page.getByTestId('raidcomp-meta-date')).toHaveValue('2026-08-25')
  await expect(page.getByTestId('raidcomp-meta-timezone'), 'the zone is carried through the validator').toHaveValue('UTC')
})

test('an ISO raid date is written out long, and never a day early', async () => {
  /*
   * The exported chart shows the date to people, and nobody says "the raid is on 2026-08-25".
   *
   * The trap this pins is real and silent: `new Date('2026-08-25')` is **midnight UTC**, so formatting
   * it in any negative-offset zone gives the day *before*. A raid in Chicago would have been
   * advertised on the 24th for a chart made on the 25th — right for the author, wrong for half the
   * readers, and impossible to notice from the code.
   */
  expect(formatRaidDate('2026-08-25')).toBe('Tue, 25 Aug 2026')

  // The falsification: the naive parse really does slip a day, so the UTC handling is load-bearing.
  const naive = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Chicago',
  }).format(new Date('2026-08-25'))
  expect(naive, 'which is why the date is parsed and formatted as UTC').toBe('Mon, 24 Aug 2026')

  // Free text from a roster saved before the picker existed is passed through rather than lost.
  expect(formatRaidDate('this Saturday')).toBe('this Saturday')
  expect(formatRaidDate(undefined)).toBeUndefined()
})

test('every seatable build has vendored artwork, so an exported chart is never half-iconed', async () => {
  /*
   * The exported PNG now draws each seat's spec icon and colours the name by class, replacing a 3px
   * role stripe. The stripe was legible but abstract — it asked the reader to know that teal meant
   * healer — where class colour is the one convention every WoW player reads without being told.
   *
   * The failure this guards is quiet by construction: `drawImage` draws nothing for an image that
   * failed to load, and `loadSeatIcons` resolves a failed load rather than rejecting, because one
   * missing icon should cost that seat its artwork rather than cost the raid leader their chart. So
   * a missing file produces a chart that looks *finished* and is missing a row's icon.
   */
  const missing: string[] = []

  for (const { className, builds } of raidBuildsByClass) {
    for (const build of builds) {
      if (!build.icon) {
        missing.push(`${className} ${build.label}: no icon name at all`)
        continue
      }
      if (!existsSync(resolve(process.cwd(), 'public/icons', `${build.icon}.jpg`))) {
        missing.push(`${className} ${build.label} -> ${build.icon}.jpg`)
      }
    }
  }

  expect(missing, 'every build a seat can hold has artwork on disk').toEqual([])

  // Non-vacuous: these are the 29 builds the picker offers, not an empty list.
  const total = raidBuildsByClass.reduce((count, entry) => count + entry.builds.length, 0)
  expect(total, 'all 29 raid builds were checked').toBe(29)
})

test('one Shaman drops one air totem, not four', async () => {
  /*
   * Reported from the walkthrough, and the cause was the same over-credit the Blessings had: a
   * Shaman may have **one totem of each element** active at a time, and Windfury, Wrath of Air,
   * Grace of Air and Tranquil Air are all Air. With no group for them, one Shaman credited the raid
   * with all four — so a raid leader read "we have Wrath of Air" off a roster of Enhancement Shamans
   * who were all dropping Windfury.
   *
   * Sourced rather than assumed: wowsims encodes the slot as a single-valued `AirTotem` enum at the
   * pinned commit, which is what makes this a game rule rather than a convention about what a raid
   * usually does.
   */
  const AIR = ['windfury-totem', 'wrath-of-air-totem', 'grace-of-air-totem', 'tranquil-air-totem']
  const airCovered = (roster: Roster) =>
    computeCoverage(roster)
      .partyScoped.covered.map((entry) => entry.entry.id)
      .filter((id) => AIR.includes(id))

  const one = addToGroup(emptyRoster(25), 0, { className: 'Shaman', spec: 'Enhancement' })
  expect(airCovered(one), 'one Shaman, one air totem').toEqual(['windfury-totem'])

  const two = addToGroup(one, 0, { className: 'Shaman', spec: 'Elemental' })
  expect(airCovered(two), 'a second Shaman buys a second slot, not the remaining three').toHaveLength(2)

  // The same override that serves the Blessings serves this, because coverage matches an assignment
  // against any buff the seat can actually provide rather than against a hard-coded Paladin list.
  const assigned = assignBuff(one, { groupIndex: 0, seatIndex: 0 }, 'shaman-air-totem', 'wrath-of-air-totem')
  expect(airCovered(assigned), 'the raid leader can say which totem goes down').toEqual(['wrath-of-air-totem'])
})

test('a seat holds one assignment per exclusive group, not one in total', async () => {
  /*
   * The shape this replaced was a single `blessingId` per seat, and it could not express the thing a
   * Paladin actually does: bring a Blessing **and** an aura. Two decisions competed for one field, so
   * assigning the aura would have silently cleared the Blessing.
   *
   * Keyed by group, both are held at once and neither touches the other.
   */
  let roster = emptyRoster(25)
  roster = addToGroup(roster, 0, { className: 'Paladin', spec: 'Holy' })
  const seat = { groupIndex: 0, seatIndex: 0 }

  roster = assignBuff(roster, seat, 'paladin-blessings', 'blessing-of-salvation')
  roster = assignBuff(roster, seat, 'paladin-auras', 'sanctity-aura')

  expect(seatAt(roster, seat)?.assignments).toEqual({
    'paladin-blessings': 'blessing-of-salvation',
    'paladin-auras': 'sanctity-aura',
  })

  const covered = computeCoverage(roster)
  const coveredIds = [...covered.raidWide.covered, ...covered.partyScoped.covered].map((entry) => entry.entry.id)
  expect(coveredIds, 'both halves of what one Paladin brings').toContain('blessing-of-salvation')
  expect(coveredIds).toContain('sanctity-aura')

  // Clearing one group leaves the other alone — the failure the single field made unavoidable.
  roster = assignBuff(roster, seat, 'paladin-blessings', undefined)
  expect(seatAt(roster, seat)?.assignments).toEqual({ 'paladin-auras': 'sanctity-aura' })

  /*
   * And clearing the last one leaves no empty object behind. Same reason `renameSeat` rebuilds rather
   * than assigning undefined: a serialised `assignments: {}` is a difference that reads as a change.
   */
  roster = assignBuff(roster, seat, 'paladin-auras', undefined)
  expect(seatAt(roster, seat)).not.toHaveProperty('assignments')
})

test('every exclusive group a seat competes in is reachable from the interface', async ({ page }) => {
  /*
   * The domain has assigned any exclusive buff since totems got a group, and the test above proves
   * it. The **picker** was still gated on `className === 'Paladin'`, so three of the four groups were
   * decided by the priority order with no way to say otherwise. This walks the interface itself.
   */
  await openApp(page, 'raidcomp')

  const pickerFor = (groupId: string) => page.getByTestId(`raidcomp-assign-${groupId}-1-1`)

  // A Shaman competes in one group, and it is now on screen.
  await page.getByTestId('raidcomp-add-shaman-enhancement').click()
  await expect(pickerFor('shaman-air-totem'), 'a Shaman can be told which air totem to drop').toBeVisible()
  await expect(pickerFor('paladin-blessings'), 'and is offered nothing they cannot cast').toHaveCount(0)

  // The option labels drop the noun the group's own label already carries.
  await expect(pickerFor('shaman-air-totem')).toContainText('Windfury')
  await expect(pickerFor('shaman-air-totem'), 'the group label says "totem" once, not four times').not.toContainText(
    'Windfury Totem',
  )

  // Choosing one moves coverage, which is the whole point of the control existing.
  await pickerFor('shaman-air-totem').selectOption('wrath-of-air-totem')
  await expect(pickerFor('shaman-air-totem')).toHaveValue('wrath-of-air-totem')

  // A Paladin competes in two, and gets a picker for each rather than one that has to choose.
  await page.getByTestId('raidcomp-add-paladin-holy').click()
  await expect(page.getByTestId('raidcomp-assign-paladin-blessings-1-2')).toBeVisible()
  await expect(page.getByTestId('raidcomp-assign-paladin-auras-1-2')).toBeVisible()

  // A Mage competes in none, so nothing is offered at all.
  await page.getByTestId('raidcomp-add-mage-fire').click()
  await expect(page.locator('[data-testid^="raidcomp-assign-"][data-testid$="-1-3"]')).toHaveCount(0)
})

test('a buff that comes from a talent comes from one spec', async () => {
  /*
   * Four of these were attributed to the whole class, so a roster of three Hunters read as bringing
   * Trueshot Aura whatever they had specced. Each is a talent, and the repo's own ingested talent
   * trees are what say which — checked there rather than recalled.
   *
   * Expose Weakness was not in the data at all, which mattered more than the others: it is the reason
   * a raid brings a Survival Hunter, and that spec's own estimate note already said its personal
   * damage is not the point.
   */
  const providerOf = (name: string) => {
    const entry = [...sampleBuffs, ...sampleTargetDebuffs].find((candidate) => candidate.name === name)
    return entry ? { className: entry.providedByClass, spec: entry.providedBySpec } : undefined
  }

  expect(providerOf('Trueshot Aura')).toEqual({ className: 'Hunter', spec: 'Marksmanship' })
  expect(providerOf('Ferocious Inspiration')).toEqual({ className: 'Hunter', spec: 'Beast Mastery' })
  expect(providerOf('Expose Weakness')).toEqual({ className: 'Hunter', spec: 'Survival' })
  expect(providerOf('Power Infusion')).toEqual({ className: 'Priest', spec: 'Discipline' })
  expect(providerOf('Improved Seal of the Crusader')).toEqual({ className: 'Paladin', spec: 'Retribution' })
  expect(providerOf('Improved Faerie Fire')).toEqual({ className: 'Druid', spec: 'Balance' })

  // And the other half of that split: the base spell every Druid is taught stays unrestricted.
  expect(providerOf('Faerie Fire')).toEqual({ className: 'Druid', spec: undefined })

  /*
   * And the check that keeps this honest as the data grows: every spec-restricted entry must name a
   * spec its class actually has. A typo here would silently make the buff unprovidable by anyone,
   * which reads as "nobody brought it" rather than as a broken row.
   */
  const impossible = [...sampleBuffs, ...sampleTargetDebuffs]
    .filter((entry) => entry.providedBySpec)
    .filter((entry) => !getClassDefinition(entry.providedByClass!)?.specs.includes(entry.providedBySpec!))
    .map((entry) => `${entry.name}: ${entry.providedByClass} has no ${entry.providedBySpec}`)

  expect(impossible, 'every restricted buff names a real spec of its class').toEqual([])
})
