import { expect, test, type Page } from '@playwright/test'
import { getRotationAbilities } from '../src/domain/abilities'
import { dropIllegalEnchants } from '../src/domain/enchants/sampleEnchants'
import { applySavedGear, validateBuild } from '../src/domain/builds/buildSerialization'
import { getRoleForSpec, tbcClasses } from '../src/domain/character/tbcClasses'
import { normalizeGearForCharacter } from '../src/domain/gear/characterItemRules'
import { emptyGear } from '../src/domain/gear/slotCompatibility'
import { defaultSimulationTarget } from '../src/domain/simulation/sampleEncounters'
import { deriveTalentModifiers } from '../src/domain/talents/talentModifiers'
import { specTrust, trustRange } from '../src/features/simulator/bestCase'
import { calculateSimulation } from '../src/features/simulator/calculateSimulation'
import { calculateStats } from '../src/features/stats/calculateStats'

/*
 * Simulation as decided on 2026-10-11 and ported in step 4 of docs/design/PORT-PLAN.md: design C,
 * "What to do next" (your stat priority, your best upgrades, then the estimate and how far to trust
 * it), with design A's damage sources and breakdown under the estimate. These are the prototype's
 * hands-on check (`checks/sim-handson.mjs`) with its real numbers: the estimate is the engine's for
 * the character on screen; it is read against the 2,053 Fury warriors average on archon.gg; the damage
 * sources add up to it; it leads with Strength and the best upgrade; the trust panel lists all 20 DPS
 * specs with Fury marked and reads 1.05× to 2.13× low.
 */

const num = (text: string) => Number(text.replace(/[^\d.\-−]/g, '').replace('−', '-'))

const nav = (page: Page) => page.getByRole('navigation', { name: 'Main sections' })

/** Through the Simulation door, making the default character (Alliance Human Fury Warrior). */
async function openSimulation(page: Page, query = '') {
  await page.goto(`/${query}`)
  await page.getByTestId('section-simulation').click()
  for (let step = 0; step < 3; step++) await page.getByTestId('creator-next').click()
  await page.getByTestId('creator-confirm').click()
  await expect(page.getByRole('heading', { name: 'What to do next' })).toBeVisible()
}

/** Dresses the character in the recommended set on the planner, and comes back. */
async function dress(page: Page) {
  await nav(page).getByRole('button', { name: 'Character Planner', exact: true }).click()
  await page.getByTestId('equip-recommended').click()
  await nav(page).getByRole('button', { name: 'Simulation', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'What to do next' })).toBeVisible()
}

/** What the engine says for the character the page holds, worked out here from its exported build. */
async function engineScore(page: Page) {
  await nav(page).getByRole('button', { name: 'Character Planner', exact: true }).click()
  await page.getByRole('navigation', { name: 'Planner sections' }).getByRole('button', { name: 'Build', exact: true }).click()
  const validated = validateBuild(JSON.parse(await page.getByTestId('build-export-output').inputValue()))
  if (!validated.ok) throw new Error(validated.error)
  const { character, talentPoints = {}, activeBuffIds, activeConsumableIds, activeTargetDebuffIds } = validated.build
  const baseline = normalizeGearForCharacter(emptyGear, character.className, character.spec)
  const gear = dropIllegalEnchants(
    normalizeGearForCharacter(applySavedGear(baseline, validated.build.gear), character.className, character.spec),
    character,
  )
  const stats = calculateStats(character, gear, activeBuffIds, activeConsumableIds, undefined, deriveTalentModifiers(talentPoints))
  const role = getRoleForSpec(character.className, character.spec)
  const result = calculateSimulation(character, gear, stats, role, activeTargetDebuffIds, undefined, talentPoints, activeBuffIds)
  await nav(page).getByRole('button', { name: 'Simulation', exact: true }).click()
  return result.score
}

test('the trust panel’s data: every DPS spec’s best case against the logs, 1.05× to 2.13× low', () => {
  const rows = specTrust()
  expect(rows, 'all 20 DPS specs').toHaveLength(20)
  const fury = rows.find((row) => row.className === 'Warrior' && row.spec === 'Fury')!
  // The prototype's figure (sim-data.js, generated from the same model on 2026-10-11).
  expect(Math.round(fury.best * 10) / 10).toBe(1348.3)
  expect(fury.dps).toBe(2053)

  const { low, high, worst } = trustRange(rows)
  expect(low.toFixed(2)).toBe('1.05')
  expect(high.toFixed(2)).toBe('2.13')
  // Computed, so it follows the model. The prototype's hand-written panel still named Demonology.
  expect(`${worst.spec} ${worst.className}`).toBe('Destruction Warlock')
  for (const row of rows) expect(row.best, `${row.spec} ${row.className} reads above its reference`).toBeLessThan(row.dps)
})

test('it leads with what to do next: your stat priority, then your best upgrades, then the estimate', async ({ page }) => {
  await openSimulation(page)

  const steps = page.locator('.sim-step h3')
  await expect(steps).toHaveText([/Your stat priority/, /Your best upgrades/, /The estimate, and how far to trust it/])
  await expect(page.getByTestId('stat-priority')).toContainText(/^Gem and enchant for Strength, then /)
  await expect(page.locator('.sim-step').nth(1)).toContainText('The biggest single gain is')
  await expect(page.getByTestId('upgrade-list').locator('.upgrade-row')).toHaveCount(8)

  // No Run button: the estimate is always current.
  await expect(page.getByRole('button', { name: /run simulation/i })).toHaveCount(0)
  await expect(page.getByTestId('simulation-score')).toContainText(/\d/)

  // Bare, the missing weapon is the first thing on the page, ahead of the three steps.
  const order = await page.evaluate(() => {
    const note = document.querySelector('[data-testid="simulation-missing-weapon"]')
    const steps = document.querySelector('.sim-steps')
    return note && steps ? note.compareDocumentPosition(steps) & Node.DOCUMENT_POSITION_FOLLOWING : 0
  })
  expect(order, 'the missing-weapon note comes before the steps').toBeTruthy()
  await expect(page.getByTestId('simulation-who')).toContainText('Human Fury Warrior · 0 of 17 slots · talents 0 / 0 / 0')
})

test('the estimate is the engine’s for the character on screen, against what Fury warriors average', async ({ page }) => {
  await openSimulation(page)
  const bare = num(await page.getByTestId('simulation-score').innerText())
  await dress(page)

  const shown = num(await page.getByTestId('simulation-score').innerText())
  expect(Math.abs(shown - (await engineScore(page))), 'shown and engine agree to the decimal').toBeLessThan(0.05)
  expect(shown, 'a change on the planner re-runs everything').not.toBe(bare)
  await expect(page.getByTestId('simulation-missing-weapon')).toHaveCount(0)
  await expect(page.getByTestId('simulation-who')).toContainText('17 of 17 slots')

  // Against the 2,053 Fury warriors average on archon.gg.
  const ratio = (2053 / shown).toFixed(2)
  await expect(page.getByTestId('simulation-versus')).toHaveText(`${ratio}× below what Fury warriors average (2,053, archon.gg)`)

  // The damage sources add up to the estimate.
  const table = page.getByTestId('simulation-damage-sources')
  await expect(table).toContainText('Bloodthirst')
  const dps = (await table.locator('tbody .damage-source-dps').allInnerTexts()).map(num)
  const sum = dps.reduce((total, value) => total + value, 0)
  expect(dps.length).toBeGreaterThan(1)
  expect(Math.abs(sum - shown), `sources ${dps.join(' + ')} = ${sum}, estimate ${shown}`).toBeLessThan(0.5)

  // And how it was computed sits beside them.
  await expect(page.getByTestId('simulation-summary')).toContainText(`vs. a level ${defaultSimulationTarget.level} target`)
  await expect(page.locator('.breakdown-list')).toContainText('Armor mitigation')
})

test('the trust panel lists all 20 DPS specs with yours marked, and the range is computed', async ({ page }) => {
  await openSimulation(page)
  const trust = page.getByTestId('simulation-trust')
  await expect(trust.locator('li')).toHaveCount(20)
  await expect(trust.locator('li[aria-current="true"]')).toHaveCount(1)
  await expect(trust.locator('li[aria-current="true"]')).toContainText('Fury Warrior')
  await expect(trust).toContainText('it reads 1.05× to 2.13× low')
  await expect(page.getByTestId('simulation-range')).toContainText('the model reads 1.05× to 2.13× low')
  await expect(page.getByTestId('simulation-range')).toContainText('Lowest today: Destruction Warlock')

  // The rotation count is the ability catalogue's, not a sentence written by hand.
  const counts = tbcClasses.flatMap((entry) => entry.specs.map((spec) => getRotationAbilities(entry.className, spec).length))
  const multi = counts.filter((count) => count > 1).length
  await expect(page.getByTestId('simulation-rotation-coverage')).toContainText(`Multi-ability rotations cover ${multi} specs of ${counts.length}`)
})

test('Equip makes the swap, says so, and moves the estimate by about what it promised', async ({ page }) => {
  await openSimulation(page)
  await dress(page)
  const before = num(await page.getByTestId('simulation-score').innerText())
  const top = page.getByTestId('upgrade-list').locator('.upgrade-row').first()
  const name = await top.locator('.upgrade-main b').innerText()
  const promised = num(await top.locator('.upgrade-delta strong').innerText())

  await top.getByRole('button', { name: 'Equip' }).click()
  await expect(page.getByRole('status')).toContainText(`equipped ${name}. The Character Planner wears it too.`)
  await expect(page.getByRole('heading', { name: /Your best upgrades/ })).toBeFocused()
  await expect.poll(async () => num(await page.getByTestId('simulation-score').innerText())).not.toBe(before)
  const after = num(await page.getByTestId('simulation-score').innerText())
  expect(Math.abs(after - before - promised), `promised ${promised}, got ${after - before}`).toBeLessThan(0.5)

  // "Show all" opens the rest of the finder's list.
  const more = page.getByRole('button', { name: /^Show all \d+$/ })
  if (await more.count()) {
    const total = num(await more.innerText())
    await more.click()
    await expect(page.getByTestId('upgrade-list').locator('.upgrade-row')).toHaveCount(total)
  }
})

test('the page names its encounter and its sources, and goes back to the planner', async ({ page }) => {
  await openSimulation(page)
  const target = page.getByRole('list', { name: 'The fixed encounter' })
  await expect(target).toContainText(`Level${defaultSimulationTarget.level}`)
  await expect(target).toContainText(`Armor${defaultSimulationTarget.armor.toLocaleString('en-US')}`)
  await expect(page.getByTestId('provenance')).toContainText(`a generic level ${defaultSimulationTarget.level} raid boss`)
  await expect(page.getByTestId('provenance')).toContainText('archon.gg logs (read 23 Aug 2026)')

  await page.getByRole('button', { name: 'Change it on the Character Planner' }).click()
  await expect(page.getByTestId('character-name')).toBeVisible()
})

test('a healer, through the escape hatch, gets the estimate without a DPS comparison', async ({ page }) => {
  await openSimulation(page, '?simulation=1')
  await nav(page).getByRole('button', { name: 'Character Planner', exact: true }).click()
  await page.getByTestId('character-edit').click()
  await page.getByLabel('Class').selectOption('Priest')
  await page.getByLabel('Specialization').selectOption('Holy')
  await nav(page).getByRole('button', { name: 'Simulation', exact: true }).click()

  await expect(page.getByText('Estimated Healing', { exact: true })).toBeVisible()
  await expect(page.getByTestId('simulation-versus')).toHaveCount(0)
  await expect(page.getByTestId('simulation-damage-sources')).toHaveCount(0)
  await expect(page.getByTestId('simulation-trust').locator('li[aria-current="true"]')).toHaveCount(0)
  await expect(page.locator('.stat-weights-unmodeled')).toContainText('MP5')
})

test('on a phone: no sideways scroll, every control 44px, and the stat bars keep their width', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 860 })
  await openSimulation(page)
  await dress(page)

  const moved = await page.evaluate(() => {
    const y = scrollY
    scrollTo(60, y)
    const x = scrollX
    scrollTo(0, y)
    return x
  })
  expect(moved, 'scrolls sideways').toBe(0)

  const small = await page.evaluate(() =>
    [...document.querySelectorAll('.content button, .content a')]
      .filter((element) => (element as HTMLElement).offsetParent && element.getBoundingClientRect().height < 44)
      .map((element) => `${element.textContent?.trim().slice(0, 24)} ${Math.round(element.getBoundingClientRect().height)}`),
  )
  expect(small, 'controls under 44px').toEqual([])

  const bar = await page.getByTestId('stat-weight-strength').locator('.stat-weight-bar').boundingBox()
  expect(bar!.width, 'the stat bar has room on a phone').toBeGreaterThan(200)
})
