import { expect, test } from '@playwright/test'

test('user can run a basic local simulation', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /project defeat/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /character/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /gear/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /stats/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /simulation/i })).toBeVisible()

  await page.getByLabel('Class').selectOption('Mage')
  await expect(page.getByLabel('Specialization')).toHaveValue('Arcane')
  await page.getByLabel('Specialization').selectOption('Fire')
  await page.getByLabel('Weapon').selectOption('Apprentice Focus Staff')

  await page.getByRole('button', { name: /run simulation/i }).click()

  await expect(page.getByText(/estimated dps/i)).toBeVisible()
  await expect(page.locator('.simulation-result strong')).toContainText(/\d/)
  await expect(page.getByText(/prototype calculation/i)).toBeVisible()
})
