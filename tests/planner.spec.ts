import { expect, test } from '@playwright/test'
import { enhancementShamanPhase2Bis } from '../src/domain/bis'
import { factions } from '../src/domain/character/races'
import { racesByClass, getClassesForRace, getRacesForClassAndFaction } from '../src/domain/character/races'
import { tbcClasses } from '../src/domain/character/tbcClasses'
import { gearSlots } from '../src/domain/gear/gearSlots'
import { getItemById, getItemsForSlot } from '../src/domain/gear/sampleItems'
import { isItemCompatibleWithGearSlot } from '../src/domain/gear/slotCompatibility'

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

  await page.getByRole('button', { name: /run simulation/i }).click()

  await expect(page.getByText(/estimated dps/i)).toBeVisible()
  await expect(page.getByTestId('simulation-score')).toContainText(/\d/)
  await expect(page.getByText('Attack power', { exact: true })).toBeVisible()
})

test('class, faction, race, gems, and caster simulation flow work', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Faction').selectOption('Horde')
  await expect(page.getByLabel('Race')).toHaveValue('Orc')
  await page.getByLabel('Race').selectOption('Blood Elf')
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
  await expect(page.getByText(/Prototype caster formula/i)).toBeVisible()
  await expect(page.getByText('Spell power', { exact: true })).toBeVisible()
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
  await expect(page.getByText(/Prototype healer formula/i)).toBeVisible()

  await page.getByLabel('Class').selectOption('Paladin')
  await page.getByLabel('Specialization').selectOption('Protection')
  await expect(page.getByText('Tank', { exact: true })).toBeVisible()
  await page.getByLabel('Chest', { exact: true }).selectOption('Bulwark Chestguard')
  await page.getByLabel('Off Hand', { exact: true }).selectOption('Shield of Rehearsal')
  await page.getByRole('button', { name: /run simulation/i }).click()

  await expect(page.getByText(/Survivability Score/i)).toBeVisible()
  await expect(page.getByText(/Prototype tank formula/i)).toBeVisible()
})

test('expanded gear foundation has multiple options for every slot', async ({ page }) => {
  await page.goto('/')

  for (const slot of gearSlots) {
    const itemOptions = getItemsForSlot(slot)
    expect(itemOptions.length, `${slot} should have multiple data options`).toBeGreaterThan(1)
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
  await page.getByLabel('Race').selectOption('Troll')
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
  await page.getByLabel('Race').selectOption('Troll')
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
  await expect(page.getByTestId('bis-empty-state')).toContainText(/No ranked list yet for Fury Warrior/i)

  await page.getByLabel('Faction').selectOption('Horde')
  await page.getByLabel('Race').selectOption('Troll')
  await page.getByLabel('Class').selectOption('Shaman')
  await page.getByLabel('Specialization').selectOption('Enhancement')

  await expect(page.getByTestId('bis-panel')).toBeVisible()
  await expect(page.getByText('Enhancement Shaman Phase 2 Starter Ranked List')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Head', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Cataclysm Headguard' })).toBeVisible()
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
  await page.getByLabel('Race').selectOption('Troll')
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

test('race/class selection enforces real TBC legality in the UI', async ({ page }) => {
  await page.goto('/')

  // Default is Alliance/Human; Human cannot be a Shaman, so Shaman should not be a selectable class yet.
  await expect(page.getByLabel('Class').locator('option', { hasText: 'Shaman' })).toHaveCount(0)

  await page.getByLabel('Race').selectOption('Draenei')
  await expect(page.getByLabel('Class').locator('option', { hasText: 'Shaman' })).toHaveCount(1)

  await page.getByLabel('Class').selectOption('Shaman')
  await expect(page.getByLabel('Specialization')).toHaveValue('Elemental')

  // Switching faction should keep the class legal by picking a valid race for it (Draenei -> Horde has no Draenei,
  // so it should land on a Horde race that can still be a Shaman: Orc, Tauren, or Troll).
  await page.getByLabel('Faction').selectOption('Horde')
  await expect(page.getByLabel('Race')).toHaveValue(/Orc|Tauren|Troll/)
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
