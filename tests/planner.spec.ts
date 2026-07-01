import { expect, test } from '@playwright/test'
import { enhancementShamanPhase2Bis } from '../src/domain/bis'
import { gearSlots } from '../src/domain/gear/gearSlots'
import { getItemById, getItemsForSlot } from '../src/domain/gear/sampleItems'

function readStatValue(text: string) {
  const match = text.match(/-?\d+/)
  return match ? Number(match[0]) : 0
}

test('user can run a basic local physical DPS simulation', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /project defeat/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /character/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /gear/i })).toBeVisible()
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
    await expect(page.getByLabel(slot, { exact: true }).locator('option')).toHaveCount(itemOptions.length)
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
    expect(item?.slot, `${entry.itemId} should match ${entry.slot}`).toBe(entry.slot)
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
  await page.getByLabel('Relic', { exact: true }).selectOption({ label: 'Totem of the Astral Winds' })

  await expect(page.getByLabel('Main Hand', { exact: true })).toHaveValue('talon-of-the-phoenix')
  await expect(page.getByLabel('Main Hand', { exact: true }).locator('option', { hasText: 'Dragonstrike' })).toHaveCount(1)

  const after = readStatValue(await page.getByTestId('stat-attack-power').innerText())
  expect(after).toBeGreaterThan(before)

  await page.getByRole('button', { name: /run simulation/i }).click()
  await expect(page.getByText(/estimated dps/i)).toBeVisible()
  await expect(page.getByTestId('simulation-score')).toContainText(/\d/)
})
