import { expect, test, type Page } from '@playwright/test'
import {
  craftingPathFor,
  fedBy,
  gathererOf,
  guideFor,
  placesFor,
  placesOnLists,
  allProfessions,
  recipeColorAt,
  specLists,
  stepIndexAt,
  suppliesOf,
  trainingMilestones,
  withTrainerStops,
} from '../src/domain/professions'

/*
 * Professions as decided on 2026-10-12 and ported in step 3 of docs/design/PORT-PLAN.md: design A, the
 * profession window, with design B's "Which two" behind a switch. These are the prototype's hands-on
 * check (`checks/profs-handson.mjs`) with its real numbers: Blacksmithing has 33 recipes on the path
 * and four trainer stops; Rough Sharpening Stone (1/15/35/55) is orange at 1 and green at 40; Mining
 * has 9 ranges, with Adamantite at 325-350; Mining supplies 97% of Blacksmithing's farmed materials;
 * for a Fury Warrior, Blacksmithing makes Dragonstrike, the #1 main hand, bind on pickup.
 */

const FURY = { className: 'Warrior', spec: 'Fury' } as const

async function openProfessions(page: Page, { asFury = false } = {}) {
  await page.goto('/')
  if (asFury) {
    await page.getByTestId('section-planner').click()
    for (let step = 0; step < 3; step++) await page.getByTestId('creator-next').click()
    await page.getByTestId('creator-confirm').click()
    await page.getByRole('navigation', { name: 'Main sections' }).getByRole('button', { name: 'Professions', exact: true }).click()
  } else {
    await page.getByTestId('section-professions').click()
  }
  await expect(page.getByTestId('profession-window')).toBeVisible()
}

async function setSkill(page: Page, value: number) {
  await page.getByTestId('profession-skill').fill(String(value))
  await page.getByTestId('profession-skill').press('Enter')
}

test('the window’s data: each recipe’s colours, the step a skill is on, and the trainer stops in the list', () => {
  const blacksmithing = craftingPathFor('Blacksmithing')
  expect(blacksmithing, 'recipes on the path').toHaveLength(33)

  /*
   * **The colours are the recipe's own, as the game publishes them** (Wowhead's thresholds, carried on
   * each step of the computed path since port step 3). Every recipe on every path has four.
   */
  const stone = blacksmithing[0]
  expect(stone.name).toBe('Rough Sharpening Stone')
  expect(stone.colors).toEqual([1, 15, 35, 55])
  expect(recipeColorAt(stone.colors, 1)).toBe('orange')
  expect(recipeColorAt(stone.colors, 15)).toBe('yellow')
  expect(recipeColorAt(stone.colors, 40)).toBe('green')
  expect(recipeColorAt(stone.colors, 55)).toBe('grey')
  for (const profession of allProfessions) {
    for (const step of craftingPathFor(profession)) {
      expect(step.colors, `${profession}: ${step.name}`).toHaveLength(4)
      expect(step.colors[0], `${step.name} turns orange where it is learned`).toBeLessThanOrEqual(step.skillRange[0])
    }
  }

  // The step a skill falls in: half-open, the last one including 375.
  expect(blacksmithing[stepIndexAt(blacksmithing, 40)].name).toBe('Rough Grinding Stone')
  expect(stepIndexAt(blacksmithing, 375)).toBe(blacksmithing.length - 1)
  expect(stepIndexAt(blacksmithing, 1)).toBe(0)

  // Every trainer stop lands in the list once, before the step whose window reaches it.
  const rows = withTrainerStops(blacksmithing, trainingMilestones('Blacksmithing'))
  const stops = rows.filter((row) => row.kind === 'train')
  expect(stops.map((row) => (row.kind === 'train' ? `${row.milestone.tier}@${row.milestone.atSkill}` : ''))).toEqual([
    'Journeyman@50',
    'Expert@125',
    'Artisan@200',
    'Master@275',
  ])
  expect(rows.filter((row) => row.kind === 'step')).toHaveLength(33)
  for (const [index, row] of rows.entries()) {
    if (row.kind !== 'train') continue
    const next = rows.slice(index + 1).find((later) => later.kind === 'step')
    if (next?.kind === 'step') {
      expect(row.milestone.atSkill, `${row.milestone.tier} is in or before the next step`).toBeLessThan(
        blacksmithing[next.index].skillRange[1],
      )
    }
  }
  expect(guideFor('Mining')!.ranges, 'Mining’s ranges').toHaveLength(9)
})

test('who feeds whom, and what each profession makes for a spec', () => {
  /*
   * **Feeding is a share of the crafter's farmed materials** (vendor-only reagents left out, made
   * reagents counted as what they are made from). Mining brings in 97% of Blacksmithing's.
   */
  expect(fedBy('Blacksmithing')).toEqual([{ gatherer: 'Mining', share: 97 }])
  expect(suppliesOf('Mining').map((entry) => entry.crafter)).toEqual(['Blacksmithing', 'Engineering', 'Jewelcrafting'])
  expect(suppliesOf('Skinning').map((entry) => entry.crafter)).toEqual(['Leatherworking'])
  expect(gathererOf('Copper Bar'), 'bars come from what Mining mines').toBe('Mining')
  expect(gathererOf('Light Leather')).toBe('Skinning')
  expect(gathererOf('Empty Vial'), 'a vendor good is nobody’s').toBeUndefined()

  /*
   * **The items are the profession-made places on Wowhead's Phase 2 lists**, the same lists Ranked
   * Gear and Raids read: 165 places over 27 specs. A specialisation names its base profession.
   */
  expect(specLists).toHaveLength(27)
  expect(allProfessions.reduce((sum, profession) => sum + placesOnLists(profession).length, 0)).toBe(165)
  const fury = placesFor('Blacksmithing', FURY)
  expect(fury[0]).toMatchObject({ name: 'Dragonstrike', rank: 1, slot: 'Main Hand', bindsOnPickup: true })
  expect(fury[0].via).toMatch(/Hammersmith/)
  expect(placesFor('Engineering', FURY).map((place) => place.name)).toContain('Furious Gizmatic Goggles')
  expect(placesFor('Mining', FURY), 'a gatherer makes nothing').toEqual([])
})

test('the profession window: pick, set your skill, and the recipes take their colours', async ({ page }) => {
  await openProfessions(page)

  /*
   * **It opens on Blacksmithing at skill 1**: 33 recipes, four trainer stops in the list, and the
   * first recipe orange — it always gives a point.
   */
  await expect(page.getByRole('heading', { name: 'Blacksmithing', exact: true })).toBeVisible()
  await expect(page.getByTestId('profession-row')).toHaveCount(33)
  await expect(page.getByTestId('training-marker')).toHaveCount(4)
  const first = page.locator('.pw-row[data-step="0"]')
  await expect(first).toHaveAttribute('data-color', 'orange')

  // At 40 it turns green, and "You" moves to Rough Grinding Stone.
  await setSkill(page, 40)
  await expect(first).toHaveAttribute('data-color', 'green')
  await expect(page.locator('.pw-row[aria-current="true"]')).toContainText('Rough Grinding Stone')
  await expect(page.locator('.pw-row[aria-current="true"] .pw-here')).toHaveText('You')
  await expect(page.locator('.pw-track')).toHaveAttribute('aria-label', 'Skill 40 of 375')

  // A recipe shows its reagents, who gathers them, and its colours.
  await page.locator('.pw-row', { hasText: 'Runed Copper Belt' }).click()
  const detail = page.getByTestId('profession-detail')
  await expect(detail).toContainText('Copper Bar')
  await expect(detail).toContainText('Farmed: Mining')
  await expect(detail.locator('.pw-cbar')).toHaveAttribute('aria-label', 'Orange from 70, yellow from 110, green from 130, grey from 150')
  await expect(detail, 'not learnable at 40').toContainText('not learnable yet')

  // A vendor-bought reagent says what it costs, and the step what it costs at a vendor in all.
  await page.locator('.pw-row', { hasText: 'Green Iron Bracers' }).click()
  await expect(detail).toContainText('Green Dye')
  await expect(detail).toContainText('Vendor, 1s each')
  await expect(detail).toContainText('A vendor sells part of it: 34s for the step.')

  // Mining: 9 ranges; 325-350 is Adamantite, with its loop on the zone's TBC map.
  await page.getByTestId('profession-pick-mining').click()
  await expect(page.getByTestId('profession-row')).toHaveCount(9)
  await page.locator('.pw-row', { hasText: '325–350' }).click()
  await expect(detail).toContainText('Adamantite Ore')
  await expect(detail.locator('.farming-route-path')).toHaveCount(1)
  await expect(detail.locator('img.farming-route-art')).toHaveAttribute('alt', 'Map of Nagrand')

  // Your skill in each profession is kept while you look at another.
  await page.getByTestId('profession-pick-blacksmithing').click()
  await expect(page.getByTestId('profession-skill')).toHaveValue('40')
  await page.getByTestId('profession-pick-mining').click()
  await expect(page.getByTestId('profession-skill')).toHaveValue('1')

  // And it is kept when you leave the tab and come back, as Raids keeps its place.
  const main = page.getByRole('navigation', { name: 'Main sections' })
  await main.getByRole('button', { name: 'Raids', exact: true }).click()
  await main.getByRole('button', { name: 'Professions', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Mining', exact: true })).toBeVisible()
  await page.getByTestId('profession-pick-blacksmithing').click()
  await expect(page.getByTestId('profession-skill')).toHaveValue('40')
})

test('Which two: what each profession makes for your spec, and a pair that is your character’s', async ({ page }) => {
  await openProfessions(page, { asFury: true })
  await page.getByTestId('view-which').click()
  await expect(page.getByTestId('profession-window')).toHaveCount(0)
  await expect(page.locator('.wt-card')).toHaveCount(13)

  /*
   * **For a Fury Warrior, Blacksmithing leads**, with Dragonstrike as the #1 main hand and binding on
   * pickup; Engineering's goggles are on the list too. The spec is the character's own.
   */
  await expect(page.getByTestId('which-spec')).toHaveValue('Warrior|Fury')
  const firstCard = page.locator('.wt-grid').first().locator('.wt-card').first()
  await expect(firstCard).toHaveAttribute('data-card', 'Blacksmithing')
  const topItem = firstCard.locator('.wt-items li').first()
  await expect(topItem.locator('.wt-rank-first')).toHaveText('#1')
  await expect(topItem).toContainText('Dragonstrike')
  await expect(topItem).toContainText('Main Hand · binds on pickup')
  await expect(page.getByTestId('which-card-engineering')).toContainText('Furious Gizmatic Goggles')

  // Picking Mining and Blacksmithing: Mining feeds 97% of its farmed materials.
  await page.getByTestId('profession-mining').click()
  await page.getByTestId('profession-blacksmithing').click()
  const summary = page.getByTestId('which-summary')
  await expect(summary).toContainText('Mining feeds Blacksmithing: 97% of its farmed materials.')
  await expect(summary).toContainText('including a first pick: Dragonstrike')
  await expect(page.getByTestId('profession-picker')).toContainText('2/2')
  await expect(page.getByTestId('profession-picker')).toContainText('the planner reads them')

  /*
   * **The pair is the character's.** The planner names the two it holds, so a pick here is a pick
   * there; there is one place they are chosen.
   */
  const main = page.getByRole('navigation', { name: 'Main sections' })
  await main.getByRole('button', { name: 'Character Planner', exact: true }).click()
  await expect(page.getByTestId('character-name').locator('xpath=following-sibling::p')).toContainText('Mining')
  await main.getByRole('button', { name: 'Professions', exact: true }).click()

  // With two held, a third says what it replaces, and does: the older of the two.
  const tailoring = page.getByTestId('profession-tailoring')
  await expect(tailoring).toHaveText('Swap in')
  await expect(tailoring).toHaveAttribute('title', 'Replaces Mining, the older of your two')
  await tailoring.click()
  await expect(page.getByTestId('profession-mining')).toHaveAttribute('aria-pressed', 'false')
  await expect(tailoring).toHaveAttribute('aria-pressed', 'true')

  // Drop empties a slot.
  await page.getByTestId('profession-drop-tailoring').click()
  await expect(page.getByTestId('profession-picker')).toContainText('1/2')

  // Another spec reorders the cards by what they make for it.
  await page.getByTestId('which-spec').selectOption('Druid|Feral')
  await expect(page.locator('.wt-section').nth(1)).toContainText('best for Feral Druid first')
  const counts = await page
    .locator('.wt-grid')
    .first()
    .locator('.wt-card')
    .evaluateAll((cards) => cards.map((card) => card.querySelectorAll('.wt-items li').length))
  expect(counts.every((count, index) => index === 0 || count <= counts[index - 1]), counts.join(',')).toBe(true)
})

test('without a character, Which two holds its pair for the visit', async ({ page }) => {
  await openProfessions(page)
  await page.getByTestId('view-which').click()
  await expect(page.getByTestId('which-spec'), 'a Fury Warrior’s list until there is a character').toHaveValue('Warrior|Fury')
  await page.getByTestId('profession-enchanting').click()
  await expect(page.getByTestId('profession-picker')).toContainText('Held for this visit')
  await expect(page.getByTestId('which-summary')).toContainText('Enchanting is the one profession that puts a permanent stat')

  // The switch is remembered while you are away from the tab.
  const main = page.getByRole('navigation', { name: 'Main sections' })
  await main.getByRole('button', { name: 'Raids', exact: true }).click()
  await main.getByRole('button', { name: 'Professions', exact: true }).click()
  await expect(page.getByTestId('view-which')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('profession-enchanting')).toHaveAttribute('aria-pressed', 'true')
})

test('on a phone the Professions tab fits, and its controls are 44px targets', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 860 })
  await openProfessions(page)
  for (const view of ['level', 'which'] as const) {
    await page.getByTestId(`view-${view}`).click()
    const short = await page.evaluate(() =>
      [...document.querySelectorAll('.professions-panel-shell :is(button, input, select, summary)')]
        .filter((element) => (element as HTMLElement).offsetParent && element.getBoundingClientRect().height < 44)
        .map((element) => `${(element.textContent || element.getAttribute('aria-label') || element.tagName).trim().slice(0, 24)} ${Math.round(element.getBoundingClientRect().height)}`),
    )
    expect(short, `${view}: controls under 44px`).toEqual([])
    const sideways = await page.evaluate(() => {
      const y = window.scrollY
      window.scrollTo(60, y)
      const x = window.scrollX
      window.scrollTo(0, y)
      return x
    })
    expect(sideways, `${view}: no sideways scroll`).toBe(0)
  }
})
