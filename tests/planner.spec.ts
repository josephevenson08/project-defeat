import { expect, test } from '@playwright/test'

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
