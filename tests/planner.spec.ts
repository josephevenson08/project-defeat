import { expect, test } from '@playwright/test'
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
import { tbcClasses } from '../src/domain/character/tbcClasses'
import { getEnchantById } from '../src/domain/enchants/sampleEnchants'
import { deriveItemArmor } from '../src/domain/gear/armorValues'
import { getItemsForSlotAndCharacter } from '../src/domain/gear/characterItemRules'
import { gearSlots } from '../src/domain/gear/gearSlots'
import { getVisibleGearSlotsForSpec } from '../src/domain/gear/slotVisibility'
import { getSignatureAbility } from '../src/domain/abilities'
import { effectUptime } from '../src/domain/simulation/combatConstants'
import {
  buildDefenderAvoidanceBaseline,
  buildIncomingAttackTable,
  computeAttackerBaseCritChance,
} from '../src/domain/simulation/attackTable'
import {
  OFF_HAND_DAMAGE_PENALTY,
  averageSwingDamage,
  computeSpecialDamagePerUse,
} from '../src/domain/simulation/specialAttacks'
import { getItemById, getItemsForSlot } from '../src/domain/gear/sampleItems'
import { isItemCompatibleWithGearSlot } from '../src/domain/gear/slotCompatibility'
import { getGemById } from '../src/domain/gems/sampleGems'
import { sampleRaidBosses } from '../src/domain/raids/sampleRaidBosses'
import { sampleRaids } from '../src/domain/raids/sampleRaids'
import { sampleItems } from '../src/domain/gear/sampleItems'

function readStatValue(text: string) {
  const match = text.match(/-?\d+/)
  return match ? Number(match[0]) : 0
}

test('user can run a basic local physical DPS simulation', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /project defeat/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /character/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Gear', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: /stats/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /simulation/i })).toBeVisible()

  await expect(page.getByLabel('Class')).toHaveValue('Warrior')
  await expect(page.getByLabel('Specialization')).toHaveValue('Fury')
  await expect(page.getByText('Physical DPS', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Main Hand', { exact: true })).toHaveValue('training-sword')

  // Regression check: Warriors have no Relic slot, and the default gear should not silently
  // inherit phantom spell/healing power from an illegally-equipped Totem/Libram/Idol.
  await expect(page.getByLabel('Relic', { exact: true })).toHaveCount(0)
  expect(readStatValue(await page.getByTestId('stat-spell-power').innerText())).toBe(0)
  expect(readStatValue(await page.getByTestId('stat-healing-power').innerText())).toBe(0)

  await page.getByRole('button', { name: /run simulation/i }).click()

  await expect(page.getByText(/estimated dps/i)).toBeVisible()
  await expect(page.getByTestId('simulation-score')).toContainText(/\d/)
  await expect(page.getByText('Attack power', { exact: true })).toBeVisible()
})

test('class, faction, race, gems, and caster simulation flow work', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Faction').selectOption('Horde')
  await expect(page.getByRole('combobox', { name: 'Race' })).toHaveValue('Orc')
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Blood Elf')
  await page.getByLabel('Class').selectOption('Mage')
  await expect(page.getByLabel('Specialization')).toHaveValue('Arcane')
  await page.getByLabel('Specialization').selectOption('Fire')

  await expect(page.getByText(/Blood Elf Fire Mage/i)).toBeVisible()
  await expect(page.getByText('Caster DPS', { exact: true })).toBeVisible()

  await page.getByLabel('Chest', { exact: true }).selectOption('Spellfire Training Robe')
  await page.getByLabel('Main Hand', { exact: true }).selectOption('Apprentice Focus Staff')
  await page.getByLabel('Head Red socket').selectOption('Runed Living Ruby')
  await page.getByLabel('Head enchant').selectOption('Glyph of Power')

  await expect(page.getByTestId('stat-spell-power')).toBeVisible()
  await page.getByRole('button', { name: /run simulation/i }).click()

  await expect(page.getByText(/Estimated DPS/i)).toBeVisible()
  await expect(page.getByText(/Spell hit\/crit table/i)).toBeVisible()
  await expect(page.getByText('Spell power scaling', { exact: true })).toBeVisible()
})

test('healer and tank roles produce role-specific results', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Class').selectOption('Priest')
  await expect(page.getByLabel('Specialization')).toHaveValue('Discipline')
  await page.getByLabel('Specialization').selectOption('Holy')
  await expect(page.getByText('Healer', { exact: true })).toBeVisible()
  await page.getByLabel('Hands', { exact: true }).selectOption("Healer's Grace Gloves")
  await page.getByLabel('Hands enchant').selectOption('Enchant Gloves - Major Healing')
  await page.getByRole('button', { name: /run simulation/i }).click()

  await expect(page.getByText(/Estimated Healing/i)).toBeVisible()
  await expect(page.getByText(/Heal crit\/haste estimate/i)).toBeVisible()

  await page.getByLabel('Class').selectOption('Paladin')
  await page.getByLabel('Specialization').selectOption('Protection')
  await expect(page.getByText('Tank', { exact: true })).toBeVisible()
  await page.getByLabel('Chest', { exact: true }).selectOption('Bulwark Chestguard')
    // Aldori Legacy Defender rather than Shield of Rehearsal: the latter cannot be located in
  // Wowhead's TBC database at all, so a test asserting real block mechanics should not rest on it.
  await page.getByLabel('Off Hand', { exact: true }).selectOption('Aldori Legacy Defender')
  await page.getByRole('button', { name: /run simulation/i }).click()

  await expect(page.getByText('Effective Health', { exact: true })).toBeVisible()

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
  await page.goto('/')

  // Default character is Warrior/Fury, which has no Relic slot in TBC (only Shaman/Paladin/Druid do),
  // so that slot is intentionally not rendered here even though the underlying catalog has Relic items.
  const visibleSlotsForDefaultCharacter = gearSlots.filter((slot) => slot !== 'Relic')

  for (const slot of gearSlots) {
    const itemOptions = getItemsForSlot(slot)
    expect(itemOptions.length, `${slot} should have multiple data options`).toBeGreaterThan(1)
  }

  for (const slot of visibleSlotsForDefaultCharacter) {
    await expect(page.getByLabel(slot, { exact: true }).locator('option')).not.toHaveCount(0)
  }
})

test('Enhancement Shaman Phase 2 starter ranking resolves to catalog items', async () => {
  const rankedSlots = new Set(enhancementShamanPhase2Bis.entries.map((entry) => entry.slot))

  for (const slot of gearSlots) {
    expect(rankedSlots.has(slot), `missing Enhancement Shaman ranking for ${slot}`).toBe(true)
  }

  for (const entry of enhancementShamanPhase2Bis.entries) {
    const item = getItemById(entry.itemId)
    expect(item, `${entry.itemId} should exist in sampleItems`).toBeTruthy()
    expect(item && isItemCompatibleWithGearSlot(item, entry.slot), `${entry.itemId} should fit ${entry.slot}`).toBe(true)
    if (entry.wowItemId) expect(item?.wowItemId).toBe(entry.wowItemId)
  }

  expect(getItemById('cataclysm-helm')?.notes).toMatch(/set-bonus/i)
  expect(getItemById('true-aim-stalker-bands')?.slot).toBe('Wrists')
  expect(getItemById('dragonstrike')?.craftedBy).toBe('Blacksmithing')
  expect(getItemById('totem-of-the-astral-winds')?.allowedClasses).toContain('Shaman')
})

test('Enhancement Shaman can pick expanded Phase 2 options and still simulate', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Faction').selectOption('Horde')
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Troll')
  await page.getByLabel('Class').selectOption('Shaman')
  await page.getByLabel('Specialization').selectOption('Enhancement')

  const before = readStatValue(await page.getByTestId('stat-attack-power').innerText())

  await page.getByLabel('Head', { exact: true }).selectOption({ label: 'Cataclysm Headguard' })
  await page.getByLabel('Wrists', { exact: true }).selectOption({ label: 'True-Aim Stalker Bands' })
  await page.getByLabel('Main Hand', { exact: true }).selectOption({ label: 'Talon of the Phoenix' })
  await page.getByLabel('Off Hand', { exact: true }).selectOption({ label: 'Rod of the Sun King' })
  await page.getByLabel('Totem', { exact: true }).selectOption({ label: 'Totem of the Astral Winds' })

  await expect(page.getByLabel('Main Hand', { exact: true })).toHaveValue('talon-of-the-phoenix')
  await expect(page.getByLabel('Main Hand', { exact: true }).locator('option', { hasText: 'Dragonstrike' })).toHaveCount(1)

  const after = readStatValue(await page.getByTestId('stat-attack-power').innerText())
  expect(after).toBeGreaterThan(before)

  await page.getByRole('button', { name: /run simulation/i }).click()
  await expect(page.getByText(/estimated dps/i)).toBeVisible()
  await expect(page.getByTestId('simulation-score')).toContainText(/\d/)
})

test('Enhancement Shaman filters gear, relics, enchants, and source details by spec', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Faction').selectOption('Horde')
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Troll')
  await page.getByLabel('Class').selectOption('Shaman')
  await page.getByLabel('Specialization').selectOption('Enhancement')

  await expect(page.getByLabel('Off Hand', { exact: true }).locator('option', { hasText: 'Rod of the Sun King' })).toHaveCount(1)
  await expect(page.getByLabel('Off Hand', { exact: true }).locator('option', { hasText: 'Shield of Rehearsal' })).toHaveCount(0)

  await expect(page.getByLabel('Main Hand enchant')).toContainText('Enchant Weapon - Mongoose')
  await expect(page.getByLabel('Off Hand enchant')).toContainText('Enchant Weapon - Mongoose')
  await expect(page.getByLabel('Off Hand enchant')).not.toContainText('Enchant Shield - Defense')

  await expect(page.getByLabel('Ranged', { exact: true })).toHaveCount(0)
  await expect(page.getByText('No Ranged Weapon Recommended')).toHaveCount(0)

  await expect(page.getByLabel('Totem', { exact: true }).locator('option', { hasText: 'Totem of the Astral Winds' })).toHaveCount(1)
  await expect(page.getByLabel('Totem', { exact: true }).locator('option', { hasText: 'Idol of Testing' })).toHaveCount(0)
  await expect(page.getByLabel('Totem', { exact: true }).locator('option', { hasText: 'Libram of Testing' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Totem', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Ranged', exact: true })).toHaveCount(0)

  await expect(page.getByText('Serpentshrine Cavern · Leotheras the Blind · Phase 2')).toBeVisible()
  await expect(page.getByText(/Needs source\/rank verification/i).first()).toBeVisible()

  await page.getByRole('button', { name: /run simulation/i }).click()
  await expect(page.getByText(/estimated dps/i)).toBeVisible()
  await expect(page.getByTestId('simulation-score')).toContainText(/\d/)
})

test('BiS panel shows Enhancement Shaman rankings and equips a listed item', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /BiS \/ Ranked Gear/i })).toBeVisible()

  await page.getByLabel('Faction').selectOption('Horde')
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Troll')
  await page.getByLabel('Class').selectOption('Shaman')
  await page.getByLabel('Specialization').selectOption('Enhancement')

  await expect(page.getByTestId('bis-panel')).toBeVisible()
  await expect(page.getByText('Enhancement Shaman Phase 2 Starter Ranked List')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Head', exact: true })).toBeVisible()
  await expect(page.getByTestId('bis-panel').getByRole('heading', { name: 'Cataclysm Headguard' })).toBeVisible()
  await expect(page.getByText(/Item ID 30190/i)).toBeVisible()

  const before = readStatValue(await page.getByTestId('stat-attack-power').innerText())
  await page.getByRole('button', { name: /Equip Cataclysm Headguard/i }).click()

  await expect(page.getByLabel('Head', { exact: true })).toHaveValue('cataclysm-helm')
  await expect(page.getByRole('button', { name: /Equipped/i }).first()).toBeDisabled()

  const after = readStatValue(await page.getByTestId('stat-attack-power').innerText())
  expect(after).toBeGreaterThan(before)

  await page.getByRole('button', { name: /run simulation/i }).click()
  await expect(page.getByText(/estimated dps/i)).toBeVisible()
  await expect(page.getByTestId('simulation-score')).toContainText(/\d/)
})

test('BiS panel can equip paired trinket targets without duplicating unique items', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Faction').selectOption('Horde')
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Troll')
  await page.getByLabel('Class').selectOption('Shaman')
  await page.getByLabel('Specialization').selectOption('Enhancement')

  const dragonspineRow = page.locator('.bis-entry', { hasText: 'Dragonspine Trophy' })
  const bloodlustRow = page.locator('.bis-entry', { hasText: 'Bloodlust Brooch' })

  await dragonspineRow.getByRole('button', { name: 'Equip Trinket 1' }).click()
  await expect(page.getByLabel('Trinket 1', { exact: true })).toHaveValue('dragonspine-trophy')
  await expect(dragonspineRow.getByRole('button', { name: 'Unique equipped' })).toBeDisabled()

  await bloodlustRow.getByRole('button', { name: 'Equip Trinket 2' }).click()
  await expect(page.getByLabel('Trinket 2', { exact: true })).toHaveValue('bloodlust-brooch')

  await page.getByRole('button', { name: /run simulation/i }).click()
  await expect(page.getByText(/estimated dps/i)).toBeVisible()
  await expect(page.getByTestId('simulation-score')).toContainText(/\d/)
})

test('paired ring and trinket slots share compatible options and block duplicate unique items', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByLabel('Trinket 1', { exact: true }).locator('option', { hasText: 'Dragonspine Trophy' })).toHaveCount(1)
  await expect(page.getByLabel('Trinket 2', { exact: true }).locator('option', { hasText: 'Dragonspine Trophy' })).toHaveCount(1)
  await expect(page.getByLabel('Trinket 1', { exact: true }).locator('option', { hasText: 'Bloodlust Brooch' })).toHaveCount(1)
  await expect(page.getByLabel('Trinket 2', { exact: true }).locator('option', { hasText: 'Bloodlust Brooch' })).toHaveCount(1)

  await page.getByLabel('Trinket 1', { exact: true }).selectOption('dragonspine-trophy')
  await expect(page.getByLabel('Trinket 2', { exact: true }).locator('option[value="dragonspine-trophy"]')).toHaveAttribute('disabled', '')
  await page.getByLabel('Trinket 2', { exact: true }).selectOption('bloodlust-brooch')

  await expect(page.getByLabel('Trinket 1', { exact: true })).toHaveValue('dragonspine-trophy')
  await expect(page.getByLabel('Trinket 2', { exact: true })).toHaveValue('bloodlust-brooch')

  await expect(page.getByLabel('Finger 1', { exact: true }).locator('option', { hasText: 'Ring of a Thousand Marks' })).toHaveCount(1)
  await expect(page.getByLabel('Finger 2', { exact: true }).locator('option', { hasText: 'Ring of a Thousand Marks' })).toHaveCount(1)

  await page.getByLabel('Finger 1', { exact: true }).selectOption('ring-of-a-thousand-marks')
  await expect(page.getByLabel('Finger 2', { exact: true }).locator('option[value="ring-of-a-thousand-marks"]')).toHaveAttribute('disabled', '')
  await page.getByLabel('Finger 2', { exact: true }).selectOption('garonas-signet-ring')

  await expect(page.getByLabel('Finger 1', { exact: true })).toHaveValue('ring-of-a-thousand-marks')
  await expect(page.getByLabel('Finger 2', { exact: true })).toHaveValue('garonas-signet-ring')

  await page.getByRole('button', { name: /run simulation/i }).click()
  await expect(page.getByText(/estimated dps/i)).toBeVisible()
  await expect(page.getByTestId('simulation-score')).toContainText(/\d/)
})

test('Elemental and Restoration Shaman Phase 2 starter rankings resolve to catalog items', async () => {
  for (const bisList of [elementalShamanPhase2Bis, restorationShamanPhase2Bis]) {
    const rankedSlots = new Set(bisList.entries.map((entry) => entry.slot))

    for (const slot of gearSlots) {
      expect(rankedSlots.has(slot), `missing ${bisList.spec} Shaman ranking for ${slot}`).toBe(true)
    }

    for (const entry of bisList.entries) {
      const item = getItemById(entry.itemId)
      expect(item, `${entry.itemId} should exist in sampleItems`).toBeTruthy()
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
    const expectedSlots = gearSlots.filter((slot) => slot !== 'Relic')
    const rankedSlots = new Set(bisList.entries.map((entry) => entry.slot))

    for (const slot of expectedSlots) {
      expect(rankedSlots.has(slot), `missing ${bisList.spec} Warrior ranking for ${slot}`).toBe(true)
    }

    for (const entry of bisList.entries) {
      const item = getItemById(entry.itemId)
      expect(item, `${entry.itemId} should exist in sampleItems`).toBeTruthy()
      expect(item && isItemCompatibleWithGearSlot(item, entry.slot), `${entry.itemId} should fit ${entry.slot}`).toBe(true)
      if (entry.wowItemId) expect(item?.wowItemId).toBe(entry.wowItemId)
    }
  }
})

test('race/class selection enforces real TBC legality in the UI', async ({ page }) => {
  await page.goto('/')

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
  await expect(page.getByText('Caster DPS', { exact: true })).toBeVisible()
})

test('crafted items show recipe source, required skill, and material farm locations', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Class').selectOption('Mage')
  await page.getByLabel('Chest', { exact: true }).selectOption({ label: 'Spellfire Training Robe' })

  const craftingDetails = page.getByLabel('Chest crafting details')
  await expect(craftingDetails).toContainText('Tailoring')
  await expect(craftingDetails).toContainText('350 skill')
  await expect(craftingDetails).toContainText('Spellfire Tailoring')
  await expect(craftingDetails).toContainText('Gidge Spellweave')
  await expect(craftingDetails).toContainText('4x Spellcloth')
  await expect(craftingDetails).toContainText('Primal Mana')
})

test('item quality renders with the standard WoW rarity color', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Faction').selectOption('Horde')
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Troll')
  await page.getByLabel('Class').selectOption('Shaman')
  await page.getByLabel('Specialization').selectOption('Enhancement')
  await page.getByLabel('Head', { exact: true }).selectOption({ label: 'Cataclysm Headguard' })

  const qualityLabel = page.locator('.gear-row', { has: page.getByLabel('Head', { exact: true }) }).locator('small strong')
  await expect(qualityLabel).toHaveText('Epic')
  await expect(qualityLabel).toHaveCSS('color', 'rgb(163, 53, 238)')
})

test('character role sets a distinct accent color across Character, Stats, and Simulator panels', async ({ page }) => {
  await page.goto('/')

  // Default Warrior/Fury is Physical DPS -> amber accent.
  await expect(page.getByRole('region', { name: 'Character' }).locator('.summary-card strong')).toHaveCSS('color', 'rgb(245, 158, 11)')

  await page.getByLabel('Class').selectOption('Priest')
  await page.getByLabel('Specialization').selectOption('Holy')

  // Holy Priest is a Healer -> teal accent, and it should carry through to the Stats and Simulator panels too.
  await expect(page.getByRole('region', { name: 'Character' }).locator('.summary-card strong')).toHaveCSS('color', 'rgb(45, 212, 191)')
  await expect(page.getByRole('region', { name: 'Stats' })).toHaveCSS('border-top-color', 'rgb(45, 212, 191)')
  await expect(page.getByRole('region', { name: 'Simulation' })).toHaveCSS('border-top-color', 'rgb(45, 212, 191)')
})

test('Elemental and Restoration Shaman get Totem/Ranged spec-aware slot treatment and their own BiS list', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Faction').selectOption('Horde')
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Troll')
  await page.getByLabel('Class').selectOption('Shaman')
  await page.getByLabel('Specialization').selectOption('Elemental')

  await expect(page.getByLabel('Ranged', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Totem', exact: true })).toBeVisible()
  await expect(page.getByText('Elemental Shaman Phase 2 Starter Ranked List')).toBeVisible()
  await expect(page.getByLabel('Main Hand', { exact: true }).locator('option', { hasText: 'The Nexus-Key' })).toHaveCount(1)

  await page.getByRole('button', { name: /run simulation/i }).click()
  await expect(page.getByText(/estimated dps/i)).toBeVisible()
  await expect(page.getByTestId('simulation-score')).toContainText(/\d/)

  await page.getByLabel('Specialization').selectOption('Restoration')

  await expect(page.getByLabel('Ranged', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Totem', exact: true })).toBeVisible()
  await expect(page.getByText('Restoration Shaman Phase 2 Starter Ranked List')).toBeVisible()
  await expect(page.getByLabel('Off Hand', { exact: true }).locator('option', { hasText: 'Aegis of the Vindicator' })).toHaveCount(1)
  await expect(page.getByLabel('Off Hand', { exact: true }).locator('option', { hasText: 'Rod of the Sun King' })).toHaveCount(0)

  await page.getByRole('button', { name: /run simulation/i }).click()
  await expect(page.getByText(/estimated healing/i)).toBeVisible()
  await expect(page.getByTestId('simulation-score')).toContainText(/\d/)
})

test('Warrior specs hide the Relic slot and each get their own BiS list', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Class').selectOption('Warrior')
  await page.getByLabel('Specialization').selectOption('Arms')

  await expect(page.getByLabel('Relic', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Arms Warrior Phase 2 Starter Ranked List')).toBeVisible()
  await expect(page.getByLabel('Main Hand', { exact: true }).locator('option', { hasText: 'Twinblade of the Phoenix' })).toHaveCount(1)

  await page.getByLabel('Specialization').selectOption('Protection')

  await expect(page.getByLabel('Relic', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Protection Warrior Phase 2 Starter Ranked List')).toBeVisible()
  await expect(page.getByLabel('Off Hand', { exact: true }).locator('option', { hasText: 'Aldori Legacy Defender' })).toHaveCount(1)

  await page.getByLabel('Chest', { exact: true }).selectOption({ label: 'Destroyer Chestguard' })
  await page.getByRole('button', { name: /run simulation/i }).click()
  await expect(page.getByText('Effective Health', { exact: true })).toBeVisible()
})

test('Holy, Protection, and Retribution Paladin Phase 2 starter rankings resolve to catalog items', async () => {
  for (const bisList of [holyPaladinPhase2Bis, protectionPaladinPhase2Bis, retributionPaladinPhase2Bis]) {
    // Paladin has a Relic (Libram) slot but no Ranged slot (they share the same physical slot in TBC).
    const expectedSlots = gearSlots.filter((slot) => slot !== 'Ranged')
    const rankedSlots = new Set(bisList.entries.map((entry) => entry.slot))

    for (const slot of expectedSlots) {
      expect(rankedSlots.has(slot), `missing ${bisList.spec} Paladin ranking for ${slot}`).toBe(true)
    }

    for (const entry of bisList.entries) {
      const item = getItemById(entry.itemId)
      expect(item, `${entry.itemId} should exist in sampleItems`).toBeTruthy()
      expect(item && isItemCompatibleWithGearSlot(item, entry.slot), `${entry.itemId} should fit ${entry.slot}`).toBe(true)
      if (entry.wowItemId) expect(item?.wowItemId).toBe(entry.wowItemId)
    }
  }
})

test('Paladin specs hide the Ranged slot, label Relic as Libram, and each get their own BiS list', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Class').selectOption('Paladin')
  await page.getByLabel('Specialization').selectOption('Holy')

  await expect(page.getByLabel('Ranged', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Libram', exact: true })).toBeVisible()
  await expect(page.getByText('Holy Paladin Phase 2 Starter Ranked List')).toBeVisible()
  await expect(page.getByLabel('Off Hand', { exact: true }).locator('option', { hasText: 'Aegis of the Vindicator' })).toHaveCount(1)

  await page.getByLabel('Specialization').selectOption('Protection')

  await expect(page.getByLabel('Ranged', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Libram', exact: true })).toBeVisible()
  await expect(page.getByText('Protection Paladin Phase 2 Starter Ranked List')).toBeVisible()

  await page.getByRole('button', { name: /run simulation/i }).click()
  await expect(page.getByText('Effective Health', { exact: true })).toBeVisible()

  await page.getByLabel('Specialization').selectOption('Retribution')

  await expect(page.getByLabel('Ranged', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Libram', exact: true })).toBeVisible()
  await expect(page.getByText('Retribution Paladin Phase 2 Starter Ranked List')).toBeVisible()

  await page.getByRole('button', { name: /run simulation/i }).click()
  await expect(page.getByText(/estimated dps/i)).toBeVisible()
  await expect(page.getByTestId('simulation-score')).toContainText(/\d/)
})

test('Discipline, Holy, and Shadow Priest Phase 2 starter rankings resolve to catalog items', async () => {
  for (const bisList of [disciplinePriestPhase2Bis, holyPriestPhase2Bis, shadowPriestPhase2Bis]) {
    // Priests have no Relic slot in TBC (only Shaman/Paladin/Druid do); they use a real Ranged wand instead.
    const expectedSlots = gearSlots.filter((slot) => slot !== 'Relic')
    const rankedSlots = new Set(bisList.entries.map((entry) => entry.slot))

    for (const slot of expectedSlots) {
      expect(rankedSlots.has(slot), `missing ${bisList.spec} Priest ranking for ${slot}`).toBe(true)
    }

    for (const entry of bisList.entries) {
      const item = getItemById(entry.itemId)
      expect(item, `${entry.itemId} should exist in sampleItems`).toBeTruthy()
      expect(item && isItemCompatibleWithGearSlot(item, entry.slot), `${entry.itemId} should fit ${entry.slot}`).toBe(true)
      if (entry.wowItemId) expect(item?.wowItemId).toBe(entry.wowItemId)
    }
  }
})

test('Priest specs hide the Relic slot, use a real Ranged wand, and each get their own BiS list', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Class').selectOption('Priest')
  await page.getByLabel('Specialization').selectOption('Holy')

  await expect(page.getByLabel('Relic', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Holy Priest Phase 2 Starter Ranked List')).toBeVisible()
  await expect(page.getByLabel('Ranged', { exact: true }).locator('option', { hasText: 'Luminescent Rod of the Naaru' })).toHaveCount(1)

  await page.getByLabel('Specialization').selectOption('Discipline')
  await expect(page.getByText('Discipline Priest Phase 2 Starter Ranked List')).toBeVisible()

  await page.getByLabel('Specialization').selectOption('Shadow')

  await expect(page.getByLabel('Relic', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Shadow Priest Phase 2 Starter Ranked List')).toBeVisible()
  await expect(page.getByLabel('Ranged', { exact: true }).locator('option', { hasText: 'Wand of the Forgotten Star' })).toHaveCount(1)

  await page.getByRole('button', { name: /run simulation/i }).click()
  await expect(page.getByText(/estimated dps/i)).toBeVisible()
  await expect(page.getByTestId('simulation-score')).toContainText(/\d/)
})

test('Balance, Feral, and Restoration Druid Phase 2 starter rankings resolve to catalog items', async () => {
  for (const bisList of [balanceDruidPhase2Bis, feralDruidPhase2Bis, restorationDruidPhase2Bis]) {
    // Druid has a Relic (Idol) slot but no Ranged slot (they share the same physical slot in TBC).
    const expectedSlots = gearSlots.filter((slot) => slot !== 'Ranged')
    const rankedSlots = new Set(bisList.entries.map((entry) => entry.slot))

    for (const slot of expectedSlots) {
      expect(rankedSlots.has(slot), `missing ${bisList.spec} Druid ranking for ${slot}`).toBe(true)
    }

    for (const entry of bisList.entries) {
      const item = getItemById(entry.itemId)
      expect(item, `${entry.itemId} should exist in sampleItems`).toBeTruthy()
      expect(item && isItemCompatibleWithGearSlot(item, entry.slot), `${entry.itemId} should fit ${entry.slot}`).toBe(true)
      if (entry.wowItemId) expect(item?.wowItemId).toBe(entry.wowItemId)
    }
  }
})

test('Druid specs hide the Ranged slot, label Relic as Idol, and each get their own BiS list', async ({ page }) => {
  await page.goto('/')

  // Druid is only legal for Night Elf (Alliance) and Tauren (Horde); pick Night Elf before Class so it's offered.
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Night Elf')
  await page.getByLabel('Class').selectOption('Druid')
  await page.getByLabel('Specialization').selectOption('Balance')

  await expect(page.getByLabel('Ranged', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Idol', exact: true })).toBeVisible()
  await expect(page.getByText('Balance Druid Phase 2 Starter Ranked List')).toBeVisible()

  await page.getByRole('button', { name: /run simulation/i }).click()
  await expect(page.getByText(/estimated dps/i)).toBeVisible()

  await page.getByLabel('Specialization').selectOption('Feral')

  await expect(page.getByLabel('Ranged', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Idol', exact: true })).toBeVisible()
  await expect(page.getByText('Feral Druid (Cat DPS) Phase 2 Starter Ranked List')).toBeVisible()
  await expect(page.getByText('Physical DPS', { exact: true })).toBeVisible()

  await page.getByLabel('Specialization').selectOption('Restoration')

  await expect(page.getByLabel('Ranged', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Idol', exact: true })).toBeVisible()
  await expect(page.getByText('Restoration Druid Phase 2 Starter Ranked List')).toBeVisible()

  await page.getByRole('button', { name: /run simulation/i }).click()
  await expect(page.getByText(/estimated healing/i)).toBeVisible()
  await expect(page.getByTestId('simulation-score')).toContainText(/\d/)
})

test('Beast Mastery, Marksmanship, and Survival Hunter Phase 2 starter rankings resolve to catalog items', async () => {
  for (const bisList of [beastMasteryHunterPhase2Bis, marksmanshipHunterPhase2Bis, survivalHunterPhase2Bis]) {
    // Hunter has no Relic slot (only Shaman/Paladin/Druid do); Ranged is the primary damage slot.
    const expectedSlots = gearSlots.filter((slot) => slot !== 'Relic')
    const rankedSlots = new Set(bisList.entries.map((entry) => entry.slot))

    for (const slot of expectedSlots) {
      expect(rankedSlots.has(slot), `missing ${bisList.spec} Hunter ranking for ${slot}`).toBe(true)
    }

    for (const entry of bisList.entries) {
      const item = getItemById(entry.itemId)
      expect(item, `${entry.itemId} should exist in sampleItems`).toBeTruthy()
      expect(item && isItemCompatibleWithGearSlot(item, entry.slot), `${entry.itemId} should fit ${entry.slot}`).toBe(true)
      if (entry.wowItemId) expect(item?.wowItemId).toBe(entry.wowItemId)
    }
  }
})

test('Hunter specs hide the Relic slot, keep Ranged as the primary weapon, and each get their own BiS list', async ({ page }) => {
  await page.goto('/')

  // Hunter is not legal for the default Human race; pick Dwarf first so Hunter is offered.
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Dwarf')
  await page.getByLabel('Class').selectOption('Hunter')
  await page.getByLabel('Specialization').selectOption('Beast Mastery')

  await expect(page.getByLabel('Relic', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Beast Mastery Hunter Phase 2 Starter Ranked List')).toBeVisible()
  await expect(page.getByLabel('Ranged', { exact: true }).locator('option', { hasText: 'Sunfury Bow of the Phoenix' })).toHaveCount(1)

  await page.getByLabel('Specialization').selectOption('Marksmanship')
  await expect(page.getByText('Marksmanship Hunter Phase 2 Starter Ranked List')).toBeVisible()

  await page.getByLabel('Specialization').selectOption('Survival')

  await expect(page.getByLabel('Relic', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Survival Hunter Phase 2 Starter Ranked List')).toBeVisible()
  await expect(page.getByLabel('Hands', { exact: true }).locator('option', { hasText: 'Gloves of Dexterous Manipulation' })).toHaveCount(1)

  await page.getByRole('button', { name: /run simulation/i }).click()
  await expect(page.getByText(/estimated dps/i)).toBeVisible()
  await expect(page.getByTestId('simulation-score')).toContainText(/\d/)
})

test('Arcane, Fire, and Frost Mage Phase 2 starter rankings resolve to catalog items', async () => {
  for (const bisList of [arcaneMagePhase2Bis, fireMagePhase2Bis, frostMagePhase2Bis]) {
    // Mage has no Relic slot in TBC (only Shaman/Paladin/Druid do); Ranged holds a wand.
    const expectedSlots = gearSlots.filter((slot) => slot !== 'Relic')
    const rankedSlots = new Set(bisList.entries.map((entry) => entry.slot))

    for (const slot of expectedSlots) {
      expect(rankedSlots.has(slot), `missing ${bisList.spec} Mage ranking for ${slot}`).toBe(true)
    }

    for (const entry of bisList.entries) {
      const item = getItemById(entry.itemId)
      expect(item, `${entry.itemId} should exist in sampleItems`).toBeTruthy()
      expect(item && isItemCompatibleWithGearSlot(item, entry.slot), `${entry.itemId} should fit ${entry.slot}`).toBe(true)
      if (entry.wowItemId) expect(item?.wowItemId).toBe(entry.wowItemId)
    }
  }
})

test('Mage specs hide the Relic slot, use a real Ranged wand, and each get their own BiS list', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Class').selectOption('Mage')
  await page.getByLabel('Specialization').selectOption('Arcane')

  await expect(page.getByLabel('Relic', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Arcane Mage Phase 2 Starter Ranked List')).toBeVisible()
  await expect(page.getByLabel('Ranged', { exact: true }).locator('option', { hasText: 'Eredar Wand of Obliteration' })).toHaveCount(1)

  await page.getByLabel('Specialization').selectOption('Fire')
  await expect(page.getByText('Fire Mage Phase 2 Starter Ranked List')).toBeVisible()

  await page.getByLabel('Specialization').selectOption('Frost')

  await expect(page.getByLabel('Relic', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Frost Mage Phase 2 Starter Ranked List')).toBeVisible()
  await expect(page.getByLabel('Ranged', { exact: true }).locator('option', { hasText: 'Wand of the Forgotten Star' })).toHaveCount(1)

  await page.getByRole('button', { name: /run simulation/i }).click()
  await expect(page.getByText(/estimated dps/i)).toBeVisible()
  await expect(page.getByTestId('simulation-score')).toContainText(/\d/)
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

test('Tank BiS lists recommend a Meta-colored gem for their Head Meta socket', async () => {
  for (const bisList of [protectionPaladinPhase2Bis, protectionWarriorPhase2Bis]) {
    const headEntry = bisList.entries.find((entry) => entry.slot === 'Head')
    const metaGemId = headEntry?.recommendedGemIds?.[0]
    const metaGem = metaGemId ? getGemById(metaGemId) : undefined
    expect(metaGem?.color, `${bisList.id} Head gem recommendation should be Meta-colored`).toBe('Meta')
  }
})

test('Assassination, Combat, and Subtlety Rogue Phase 2 starter rankings resolve to catalog items', async () => {
  for (const bisList of [assassinationRoguePhase2Bis, combatRoguePhase2Bis, subtletyRoguePhase2Bis]) {
    // Rogue has no Relic slot (only Shaman/Paladin/Druid do); every spec dual-wields into Off Hand.
    const expectedSlots = gearSlots.filter((slot) => slot !== 'Relic')
    const rankedSlots = new Set(bisList.entries.map((entry) => entry.slot))

    for (const slot of expectedSlots) {
      expect(rankedSlots.has(slot), `missing ${bisList.spec} Rogue ranking for ${slot}`).toBe(true)
    }

    for (const entry of bisList.entries) {
      const item = getItemById(entry.itemId)
      expect(item, `${entry.itemId} should exist in sampleItems`).toBeTruthy()
      expect(item && isItemCompatibleWithGearSlot(item, entry.slot), `${entry.itemId} should fit ${entry.slot}`).toBe(true)
      if (entry.wowItemId) expect(item?.wowItemId).toBe(entry.wowItemId)
    }
  }
})

test('Rogue specs hide the Relic slot, support full dual-wield, and each get their own BiS list', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Class').selectOption('Rogue')
  await page.getByLabel('Specialization').selectOption('Assassination')

  await expect(page.getByLabel('Relic', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Assassination Rogue Phase 2 Starter Ranked List')).toBeVisible()
  await expect(page.getByLabel('Main Hand', { exact: true }).locator('option', { hasText: 'Fang of Vashj' })).toHaveCount(1)
  await expect(page.getByLabel('Off Hand', { exact: true }).locator('option', { hasText: 'Heartrazor' })).toHaveCount(1)
  await expect(page.getByLabel('Ranged', { exact: true }).locator('option', { hasText: 'Arcanite Steam-Pistol' })).toHaveCount(1)

  await page.getByLabel('Specialization').selectOption('Combat')
  await expect(page.getByText('Combat Rogue Phase 2 Starter Ranked List')).toBeVisible()
  await expect(page.getByLabel('Main Hand', { exact: true }).locator('option', { hasText: 'Warp Slicer' })).toHaveCount(1)
  await expect(page.getByLabel('Off Hand', { exact: true }).locator('option', { hasText: "Latro's Shifting Sword" })).toHaveCount(1)

  await page.getByLabel('Specialization').selectOption('Subtlety')

  await expect(page.getByLabel('Relic', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Subtlety Rogue Phase 2 Starter Ranked List')).toBeVisible()
  await expect(page.getByLabel('Off Hand', { exact: true }).locator('option', { hasText: "Latro's Shifting Sword" })).toHaveCount(1)

  await page.getByRole('button', { name: /run simulation/i }).click()
  await expect(page.getByText(/estimated dps/i)).toBeVisible()
  await expect(page.getByTestId('simulation-score')).toContainText(/\d/)
})

test('Affliction, Demonology, and Destruction Warlock Phase 2 starter rankings resolve to catalog items', async () => {
  for (const bisList of [afflictionWarlockPhase2Bis, demonologyWarlockPhase2Bis, destructionWarlockPhase2Bis]) {
    // Warlock has no Relic slot (only Shaman/Paladin/Druid do); Ranged holds a wand.
    const expectedSlots = gearSlots.filter((slot) => slot !== 'Relic')
    const rankedSlots = new Set(bisList.entries.map((entry) => entry.slot))

    for (const slot of expectedSlots) {
      expect(rankedSlots.has(slot), `missing ${bisList.spec} Warlock ranking for ${slot}`).toBe(true)
    }

    for (const entry of bisList.entries) {
      const item = getItemById(entry.itemId)
      expect(item, `${entry.itemId} should exist in sampleItems`).toBeTruthy()
      expect(item && isItemCompatibleWithGearSlot(item, entry.slot), `${entry.itemId} should fit ${entry.slot}`).toBe(true)
      if (entry.wowItemId) expect(item?.wowItemId).toBe(entry.wowItemId)
    }
  }
})

test('Warlock specs hide the Relic slot, use a real Ranged wand, and each get their own BiS list', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Class').selectOption('Warlock')
  await page.getByLabel('Specialization').selectOption('Affliction')

  await expect(page.getByLabel('Relic', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Affliction Warlock Phase 2 Starter Ranked List')).toBeVisible()
  await expect(page.getByLabel('Main Hand', { exact: true }).locator('option', { hasText: 'Fang of the Leviathan' })).toHaveCount(1)
  await expect(page.getByLabel('Off Hand', { exact: true }).locator('option', { hasText: 'Fathomstone' })).toHaveCount(1)
  await expect(page.getByLabel('Ranged', { exact: true }).locator('option', { hasText: 'Wand of the Forgotten Star' })).toHaveCount(1)

  await page.getByLabel('Specialization').selectOption('Demonology')
  await expect(page.getByText('Demonology Warlock Phase 2 Starter Ranked List')).toBeVisible()

  await page.getByLabel('Specialization').selectOption('Destruction')

  await expect(page.getByLabel('Relic', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Destruction Warlock Phase 2 Starter Ranked List')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Head', exact: true })).toBeVisible()
  await expect(page.getByTestId('bis-panel').getByRole('heading', { name: 'Voidheart Cover' })).toBeVisible()

  await page.getByRole('button', { name: /run simulation/i }).click()
  await expect(page.getByText(/estimated dps/i)).toBeVisible()
  await expect(page.getByTestId('simulation-score')).toContainText(/\d/)
})

test('Professions tab shows skill tiers and material farming, and switches between professions', async ({ page }) => {
  await page.goto('/')

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
  await page.goto('/')

  // Default character is a Fury Warrior (melee physical DPS).
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
  await page.goto('/')

  // Hunters run the ranged attack table, so ranged attack power replaces melee AP as the reference.
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Dwarf')
  await page.getByLabel('Class').selectOption('Hunter')
  await expect(page.getByTestId('stat-weight-rangedAttackPower')).toContainText('1.00')
  await expect(page.getByTestId('stat-weight-strength')).toHaveCount(0)
  await expect(page.getByTestId('stat-weight-agility')).toBeVisible()

  // Casters switch to the spell stat set entirely.
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Gnome')
  await page.getByLabel('Class').selectOption('Mage')
  await expect(page.getByTestId('stat-weight-spellPower')).toContainText('1.00')
  await expect(page.getByTestId('stat-weight-spellCritRating')).toBeVisible()
  await expect(page.getByTestId('stat-weight-attackPower')).toHaveCount(0)

  // Healers normalize against healing power and surface MP5 as not-yet-modeled. Gnomes can't be
  // Priests in TBC, so the race has to move first — the Class dropdown genuinely won't offer it.
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Human')
  await page.getByLabel('Class').selectOption('Priest')
  await page.getByLabel('Specialization').selectOption('Holy')
  await expect(page.getByTestId('stat-weight-healingPower')).toContainText('1.00')
  await expect(page.locator('.stat-weights-unmodeled')).toContainText('MP5')

  // Tanks normalize against stamina and get the avoidance stat set.
  await page.getByLabel('Class').selectOption('Warrior')
  await page.getByLabel('Specialization').selectOption('Protection')
  await expect(page.getByTestId('stat-weight-stamina')).toContainText('1.00')
  await expect(page.getByTestId('stat-weight-defenseRating')).toBeVisible()
})

test('encounter settings change armor mitigation and feed back into the simulation', async ({ page }) => {
  await page.goto('/')

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
  await page.goto('/')

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
  await page.goto('/')
  await expect(page.getByLabel('Class')).toHaveValue('Warrior')

  await page.getByLabel('Class').selectOption('Mage')
  await page.getByLabel('Specialization').selectOption('Fire')
  await page.getByRole('button', { name: /Cloth \/ caster target/ }).click()

  // The autosave runs in an effect, so wait for it to actually reach storage before reloading.
  await expect
    .poll(async () => {
      const raw = await page.evaluate(() => localStorage.getItem('project-defeat:build:v1'))
      return raw ? JSON.parse(raw).character.spec : null
    })
    .toBe('Fire')

  await page.reload()

  await expect(page.getByLabel('Class')).toHaveValue('Mage')
  await expect(page.getByLabel('Specialization')).toHaveValue('Fire')
  await expect(page.getByTestId('encounter-armor-mitigation')).toHaveText('24.9%')
})

test('a build can be exported and imported back', async ({ page }) => {
  await page.goto('/')

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
  await page.goto('/')

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
  await page.goto('/')

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

test('melee specials are layered onto white damage, and unmodelled ones say so', async ({ page }) => {
  await page.goto('/')

  // Fury Warrior: Bloodthirst is cooldown-bound, so its rate is defensible and it is modelled.
  await page.getByRole('button', { name: /run simulation/i }).click()
  const withSpecial = Number(await page.getByTestId('simulation-score').innerText())
  const breakdown = page.locator('.breakdown-list')
  await expect(breakdown).toContainText(/Bloodthirst DPS/i)
  await expect(page.locator('.simulation-result p')).toContainText(/used on its 6s cooldown/i)

  // The special has to actually add damage rather than just appear in the breakdown.
  const bloodthirstDps = Number(
    (await breakdown.locator('div', { hasText: /Bloodthirst DPS/i }).innerText()).match(/[\d.]+$/)?.[0] ?? '0',
  )
  expect(bloodthirstDps).toBeGreaterThan(0)
  expect(withSpecial).toBeGreaterThan(bloodthirstDps)

  // Fury presses more than one computable button. Whirlwind has its own 10s cooldown and must be
  // layered on alongside Bloodthirst — modelling only the signature ability understates the spec,
  // which is the gap the rotation work exists to close.
  await expect(breakdown).toContainText(/Whirlwind DPS/i)
  await expect(page.locator('.simulation-result p')).toContainText(/used on its 10s cooldown/i)
  const whirlwindDps = Number(
    (await breakdown.locator('div', { hasText: /Whirlwind DPS/i }).innerText()).match(/[\d.]+$/)?.[0] ?? '0',
  )
  expect(whirlwindDps).toBeGreaterThan(0)
  // Both are real contributions on top of white damage, and neither may swallow the whole estimate.
  expect(withSpecial).toBeGreaterThan(bloodthirstDps + whirlwindDps)

  // Combat Rogue: no cooldown, but a fixed energy cost against a fixed regen rate is computable.
  await page.getByLabel('Class').selectOption('Rogue')
  await page.getByLabel('Specialization').selectOption('Combat')
  await page.getByRole('button', { name: /run simulation/i }).click()
  await expect(breakdown).toContainText(/Sinister Strike DPS/i)
  await expect(page.locator('.simulation-result p')).toContainText(/energy against 10\/sec regen/i)

  // Hunter: Steady Shot is mana-costed with no cooldown, so its sustained rate depends on auto-shot
  // weaving that isn't modelled. It must be named as excluded rather than silently omitted.
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Dwarf')
  await page.getByLabel('Class').selectOption('Hunter')
  await page.getByRole('button', { name: /run simulation/i }).click()
  await expect(breakdown).not.toContainText(/Steady Shot DPS/i)
  await expect(page.locator('.simulation-result p')).toContainText(/Steady Shot is not included/i)
})

test('the Raids tab renders a raid, its bosses and an attunement chain', async ({ page }) => {
  // The raids panel is one of three things this repo has historically shipped that nothing rendered,
  // and it was the only part of the app with that history and no test confirming it still renders.
  await page.goto('/')
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

test('toggling a buff and a consumable actually moves the simulated result', async ({ page }) => {
  // The buffs panel is fully wired into calculateStats, calculateSimulation, stat weights and the
  // upgrade finder, and had no test at all — a regression that silently stopped applying buffs would
  // have passed the whole suite.
  await page.goto('/')
  await page.getByRole('button', { name: /run simulation/i }).click()
  const before = Number(await page.getByTestId('simulation-score').innerText())

  await page.getByTestId('buff-toggle-battle-shout').click()
  await page.getByRole('button', { name: /run simulation/i }).click()
  const withBuff = Number(await page.getByTestId('simulation-score').innerText())
  expect(withBuff, 'Battle Shout is attack power, so a Fury Warrior must gain from it').toBeGreaterThan(before)

  await page.getByTestId('consumable-toggle-flask-of-relentless-assault').click()
  await page.getByRole('button', { name: /run simulation/i }).click()
  const withFlask = Number(await page.getByTestId('simulation-score').innerText())
  expect(withFlask, 'a flask stacks on top of the buff rather than replacing it').toBeGreaterThan(withBuff)

  // Toggling back off must return the original number exactly — a buff that applies but never clears
  // would otherwise look correct on the way up and be wrong for the rest of the session.
  await page.getByTestId('buff-toggle-battle-shout').click()
  await page.getByTestId('consumable-toggle-flask-of-relentless-assault').click()
  await page.getByRole('button', { name: /run simulation/i }).click()
  expect(Number(await page.getByTestId('simulation-score').innerText())).toBe(before)
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

test('armor is derived for pieces that do not record it, and matches real tooltips', async () => {
  // The catalog records armor on 5 of ~143 armour pieces, which left tank mitigation systematically
  // understated. TBC armor is deterministic given item level, armour class, slot and quality, so the
  // rest is derived — and these anchors are real items whose tooltip armor is known, so drift in the
  // fitted coefficients fails here rather than quietly shifting every tank's Effective Health.
  const clothHelm = getItemById('cowl-of-tirisfal')
  expect(clothHelm?.itemLevel).toBe(133)
  expect(deriveItemArmor(clothHelm!)).toBe(181)

  const mailHelm = getItemById('rift-stalker-helm')
  expect(mailHelm?.itemLevel).toBe(133)
  expect(deriveItemArmor(mailHelm!)).toBe(759)

  // An item stating its own armor must never be overridden — a sourced value has to beat the
  // formula, or verifying an item would stop being an improvement.
  const shield = getItemById('aldori-legacy-defender')
  expect(shield?.stats.armor).toBe(5279)
  expect(deriveItemArmor(shield!)).toBeUndefined()

  // Feral druid tank leather sits on a separate, inflated armor track that was never fitted.
  // Deriving it from the ordinary leather line would understate it badly, so it declines to guess.
  const feralTank = { ...clothHelm!, armorType: 'Leather' as const, roles: ['Tank' as const], stats: {} }
  expect(deriveItemArmor(feralTank)).toBeUndefined()
})

test('equipped tier pieces surface their set bonuses, and say they are not scored', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Class').selectOption('Warrior')
  await page.getByLabel('Specialization').selectOption('Fury')

  // Two pieces of the same set, which is the most a player can currently assemble — only Head and
  // Chest of each Tier 5 set are catalogued so far, so the 4-piece bonus is unreachable by design.
  await page.getByLabel('Head', { exact: true }).selectOption('Destroyer Battle-Helm')
  await page.getByLabel('Chest', { exact: true }).selectOption('Destroyer Breastplate')

  const sets = page.getByTestId('set-bonuses')
  await expect(sets).toBeVisible()
  // Deliberately not pinned to an exact count: every verification batch that links another piece to
  // its set raises it, and this test should track the feature rather than the catalog's current size.
  const setLine = await sets.locator('.set-bonus-name').first().innerText()
  const [, equipped, total] = setLine.match(/Destroyer Battlegear \((\d+)\/(\d+)\)/) ?? []
  expect(Number(equipped), 'the two pieces selected above must at least be counted').toBeGreaterThanOrEqual(2)
  expect(Number(total)).toBe(5)

  // The 2-piece is met and must be shown as active; the 4-piece is not and must not claim to be.
  await expect(sets.locator('.set-bonus-active')).toContainText(/Overpower/)
  await expect(sets.locator('.set-bonus-inactive')).toContainText(/5 less rage/)

  // The whole point of showing these is that the score does NOT include them. If that caveat ever
  // disappears, the panel starts implying tier pieces are being valued when they are not.
  await expect(sets).toContainText(/None of these bonuses are applied to the score/i)
  await expect(sets).toContainText(/undervalues tier pieces/i)
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

test('a feral druid swings cat form\'s own weapon, not the equipped one', async ({ page }) => {
  await page.goto('/')
  // Night Elf first — Druid isn't offered to the default race, so the class list wouldn't contain it.
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Night Elf')
  await page.getByLabel('Class').selectOption('Druid')
  await page.getByLabel('Specialization').selectOption('Feral')
  await page.getByRole('button', { name: /run simulation/i }).click()

  // TBC substitutes a fixed internal weapon in cat form — 43.5-66.5 damage on a 1.0s swing, so 55
  // weapon DPS — and every cat ability reads that rather than the equipped item. Reading the equipped
  // weapon's dice meant a Feral druid's damage scaled off a staff the form never actually swings.
  const breakdown = page.locator('.breakdown-list')
  const weaponDamage = Number(
    (await breakdown.locator('div', { hasText: /Weapon damage/i }).first().innerText()).match(/[\d.]+$/)?.[0] ?? '0',
  )
  expect(weaponDamage).toBeCloseTo(55, 1)

  // What the equipped weapon *does* give a Feral druid is Feral Attack Power, an explicit stat TBC
  // prints on druid weapons. It adds 1:1 into attack power, so its weight must land exactly on the
  // reference stat's 1.00 — anything else means the conversion picked up a stray multiplier.
  await expect(page.getByTestId('stat-weight-feralAttackPower')).toContainText('1.00')

  // And it must not be offered to classes that can't shapeshift. For them it isn't an unmodeled
  // stat the sim might learn later, it's genuinely worthless, so it should not be probed at all.
  await page.getByLabel('Class').selectOption('Warrior')
  await expect(page.getByTestId('stat-weight-feralAttackPower')).toHaveCount(0)
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

      const item = sampleItems.find((entry) => entry.id === loot.itemId)
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
  await page.goto('/')

  // Default is a Human Fury Warrior. Human Sword Specialization is conditional on a sword, and the
  // default main hand IS a sword, so it should be active and contributing expertise.
  await expect(page.getByLabel('Main Hand', { exact: true })).toHaveValue('training-sword')
  const swordSpec = page.getByTestId('racial-human-sword-specialization')
  await expect(swordSpec).toContainText(/Included in your stats/i)

  const expertiseWithSword = readStatValue(await page.getByTestId('stat-expertise').innerText())
  expect(expertiseWithSword).toBeGreaterThan(0)

  // Swap to a non-sword main hand: the racial must switch off and the expertise must actually drop.
  await page.getByLabel('Main Hand', { exact: true }).selectOption('dragonstrike')
  await expect(swordSpec).toContainText(/Only while wielding/i)
  expect(readStatValue(await page.getByTestId('stat-expertise').innerText())).toBeLessThan(expertiseWithSword)

  // Unconditional racials are always on. The Human Spirit is a percentage bonus, so it has to be
  // applied before the derivations that read Spirit rather than bolted on afterwards.
  await expect(page.getByTestId('racial-human-the-human-spirit')).toContainText(/Included in your stats/i)

  // On-use and utility racials are listed but explicitly not modelled — a race showing nothing would
  // be indistinguishable from a race that genuinely has nothing.
  await expect(page.getByTestId('racial-human-perception')).toContainText(/Utility/i)
})

test('changing race changes the racial list and the resulting stats', async ({ page }) => {
  await page.goto('/')

  // Gnome's Expansive Mind is a flat +5% Intellect, so it should move Intellect for any class.
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Gnome')
  await page.getByLabel('Class').selectOption('Mage')
  const gnomeIntellect = readStatValue(await page.getByTestId('stat-intellect').innerText())
  await expect(page.getByTestId('racial-gnome-expansive-mind')).toContainText(/Included in your stats/i)

  // Undead has no passive stat racial at all, so the same Mage should end up with less Intellect.
  await page.getByLabel('Faction').selectOption('Horde')
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Undead')
  await page.getByLabel('Class').selectOption('Mage')
  await expect(page.getByTestId('racial-gnome-expansive-mind')).toHaveCount(0)
  await expect(page.getByTestId('racial-undead-will-of-the-forsaken')).toContainText(/not modelled/i)

  expect(readStatValue(await page.getByTestId('stat-intellect').innerText())).toBeLessThan(gnomeIntellect)
})

test('named build slots survive a character switch that would overwrite the autosave', async ({ page }) => {
  await page.goto('/')
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

  // Slots persist across a reload, since they live in storage rather than component state.
  await page.reload()
  await expect(page.getByTestId('build-slot-list')).toContainText('Fury main')

  await page.getByTestId('build-slot-delete-Fury main').click()
  await expect(page.getByTestId('build-slots-empty')).toBeVisible()
})

test('Draenei get the hit racial matching their class, not both', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('combobox', { name: 'Race' }).selectOption('Draenei')

  // Warriors get Heroic Presence (melee/ranged hit) and must NOT also get the caster version.
  await page.getByLabel('Class').selectOption('Warrior')
  await expect(page.getByTestId('racial-draenei-heroic-presence')).toContainText(/Included in your stats/i)
  await expect(page.getByTestId('racial-draenei-inspiring-presence')).toContainText(/Only for/i)
  const warriorSpellHit = readStatValue(await page.getByTestId('stat-spell-hit').innerText())

  // Shamans get Inspiring Presence (spell hit) instead — the two are separate racials in TBC, and
  // granting both would hand every Draenei twice the hit they actually have.
  await page.getByLabel('Class').selectOption('Shaman')
  await expect(page.getByTestId('racial-draenei-inspiring-presence')).toContainText(/Included in your stats/i)
  await expect(page.getByTestId('racial-draenei-heroic-presence')).toContainText(/Only for/i)
  expect(readStatValue(await page.getByTestId('stat-spell-hit').innerText())).toBeGreaterThan(warriorSpellHit)
})
