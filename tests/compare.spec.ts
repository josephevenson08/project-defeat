import { expect, test, type Page } from '@playwright/test'

/*
 * The Character Planner's Compare tab as decided on 2026-10-09 and ported in step 6 of
 * docs/design/PORT-PLAN.md: design A, your item's tooltip beside another's as the game's Shift-compare
 * draws them, with design B's summary of the trade in one sentence. These are the prototype's
 * hands-on check (`checks/compare-handson.mjs`, run as `p`) on the app's own data, which gives the
 * prototype's numbers: Destroyer Battle-Helm → Furious Gizmatic Goggles is −8 Hit and +6 Crit, Hit
 * Rating 140 → 132 for the recommended set. The score is the app's simulator rather than the
 * prototype's example weights, so it is checked for adding up rather than pinned.
 */

async function openCompare(page: Page, { dressed = true, flag = true } = {}) {
  await page.goto(flag ? '/?simulation=1' : '/')
  await page.getByTestId('section-planner').click()
  for (let step = 0; step < 3; step++) await page.getByTestId('creator-next').click()
  await page.getByTestId('creator-confirm').click()
  if (dressed) await page.getByTestId('equip-recommended').click()
  await view(page, 'Compare')
}

const view = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Planner sections' }).getByRole('button', { name, exact: true }).click()
const gearSlot = (page: Page, slot: string) => page.getByRole('button', { name: `${slot} slot`, exact: true })
const pickSlot = (page: Page, slot: string) => page.getByTestId(`compare-slot-${slot}`).click()
/** "−5.6" and "+5.6" as numbers: the page writes a real minus sign. */
const num = (text: string) => Number(text.replace('−', '-').replace('+', ''))

async function characterField(page: Page, label: 'Class' | 'Specialization') {
  if (!(await page.getByTestId('character-fields').isVisible())) await page.getByTestId('character-edit').click()
  return page.getByLabel(label)
}

test('the Head swap: the goggles are −8 Hit and +6 Crit, said in one sentence, and Hit Rating goes 140 → 132', async ({ page }) => {
  await openCompare(page)
  await expect(page.getByRole('region', { name: 'Compare with what you wear' })).toBeVisible()
  await expect(page.getByTestId('compare-slot-Head')).toHaveAttribute('aria-pressed', 'true')

  // Opens on the guide's best Head you do not wear: the goggles, since you wear the helm (#1).
  await expect(page.getByTestId('compare-with-destroyer-battle-helm')).toBeDisabled()
  await expect(page.getByTestId('compare-with-destroyer-battle-helm')).toHaveAccessibleName('Rank 1: Destroyer Battle-Helm, what you wear')
  await expect(page.getByTestId('compare-with-furious-gizmatic-goggles')).toHaveAttribute('aria-pressed', 'true')

  // The two tooltips: yours as you wear it, the other as it would be scored and equipped.
  await expect(page.getByTestId('compare-yours')).toContainText('Currently equipped')
  await expect(page.getByTestId('compare-yours')).toContainText('Destroyer Battle-Helm')
  await expect(page.getByTestId('compare-yours')).toContainText('Relentless Earthstorm Diamond')
  await expect(page.getByTestId('compare-other')).toContainText('Rank 2 · Great')
  await expect(page.getByTestId('compare-other')).toContainText('Furious Gizmatic Goggles')
  await expect(page.getByTestId('compare-other')).toContainText('Crafted: Engineering')

  // Design B's sentence, in the stat sheet's order, and the change list under the other tooltip.
  const summary = page.getByTestId('compare-summary')
  await expect(summary).toContainText('You gain +6 Crit and lose −3 Strength, −17 Stamina, −6 Attack Power, −8 Hit, −59 Armor.')
  const changes = page.getByTestId('compare-changes')
  await expect(changes).toContainText('−8 Hit Rating')
  await expect(changes).toContainText('+6 Crit Rating')

  // The score is the simulator's, and its three numbers add up on screen.
  const values = page.locator('.compare-score-values strong')
  const before = num(await values.nth(0).innerText())
  const after = num(await values.nth(1).innerText())
  const delta = num((await page.getByTestId('compare-score-delta').innerText()).split(' ')[0])
  expect(Math.abs(before + delta - after), `${before} + ${delta} should reach ${after}`).toBeLessThan(0.051)

  // The totals behind it: Hit Rating 140 → 132, every row adding up.
  await page.getByTestId('compare-totals').locator('summary').click()
  const hit = page.getByTestId('compare-table').locator('tr', { hasText: 'Hit Rating' })
  await expect(hit).toHaveText(/Hit Rating\s*140\s*132\s*-8/)
  const rows = await page
    .getByTestId('compare-table')
    .locator('tbody tr')
    .evaluateAll((trs) => trs.map((tr) => [...tr.children].map((cell) => (cell as HTMLElement).innerText.trim())))
  for (const [label, left, right, difference] of rows) expect(Number(left) + Number(difference), label).toBe(Number(right))
})

test('switching slot shows its ranked items, and Equip reaches the Gear tab with the gems it was scored with', async ({ page }) => {
  await openCompare(page)
  await pickSlot(page, 'Main Hand')
  const items = page.getByRole('group', { name: 'Main Hand items' }).getByRole('button')
  await expect(items).toHaveCount(4)
  await expect(items.nth(0)).toHaveAccessibleName('Rank 1: Dragonstrike, what you wear')
  await expect(items.nth(1)).toHaveAccessibleName('Rank 2: Dragonmaw')

  await page.getByTestId('compare-with-dragonmaw').click()
  await page.getByTestId('compare-equip').click()
  await expect(page.getByTestId('compare-message')).toHaveText('Main Hand: equipped Dragonmaw. The Gear tab shows it too.')
  await expect(page.getByTestId('compare-slot-Main Hand')).toBeFocused()
  // Dragonmaw is yours now, and the other side moves to the guide's best one you do not wear.
  await expect(page.getByTestId('compare-yours')).toContainText('Dragonmaw')
  await expect(page.getByTestId('compare-other')).toContainText('Dragonstrike')

  await view(page, 'Gear')
  await expect(gearSlot(page, 'Main Hand')).toContainText('Dragonmaw')
})

test('a Gear-tab change shows in Compare: Warbringer worn on Head', async ({ page }) => {
  await openCompare(page)
  await view(page, 'Gear')
  await gearSlot(page, 'Head').click()
  await page.getByLabel('Head', { exact: true }).selectOption('warbringer-battle-helm')
  await view(page, 'Compare')
  await expect(page.getByTestId('compare-yours')).toContainText('Warbringer Battle-Helm')
  await expect(page.getByTestId('compare-with-warbringer-battle-helm')).toHaveAccessibleName('Rank 3: Warbringer Battle-Helm, what you wear')
  // The guide's best you do not wear is now its #1.
  await expect(page.getByTestId('compare-other')).toContainText('Destroyer Battle-Helm')
})

test('rings: a unique ring already in the other hand is not offered', async ({ page }) => {
  await openCompare(page)
  await pickSlot(page, 'Finger 1')
  const names = await page
    .getByRole('group', { name: 'Finger 1 items' })
    .getByRole('button')
    .evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label')))
  expect(names).toEqual([
    'Rank 1: Band of the Ranger-General, what you wear',
    'Rank 3: Ring of a Thousand Marks',
    'Rank 4: Ancestral Ring of Conquest',
  ])
})

test('any item for the slot, best item level first, and one off the list says so', async ({ page }) => {
  await openCompare(page)
  const any = page.getByTestId('compare-any')
  const levels = (await any.locator('option').allInnerTexts()).slice(1).map((text) => Number(text.match(/\((\d+)\)$/)?.[1] ?? 0))
  expect(levels.length, 'the Head slot takes plenty').toBeGreaterThan(20)
  expect(levels.every((level, index) => index === 0 || levels[index - 1] >= level), 'sorted by item level').toBe(true)

  const offList = await any.locator('option', { hasText: 'Merciless Gladiator\'s Plate Helm' }).getAttribute('value')
  await any.selectOption(offList ?? '')
  await expect(page.getByTestId('compare-other')).toContainText("Not on Wowhead's list")
  await expect(page.getByTestId('compare-other')).toContainText("Merciless Gladiator's Plate Helm")
  await expect(page.locator('.compare-alt[aria-pressed="true"]')).toHaveCount(0)
})

test('an empty slot compares against nothing, with the guide\'s #1 on the other side', async ({ page }) => {
  await openCompare(page, { dressed: false })
  await expect(page.getByTestId('compare-slot-Head')).toHaveAccessibleName('Head, empty')
  await expect(page.getByTestId('compare-yours')).toContainText('Nothing in this slot')
  await expect(page.getByTestId('compare-other')).toContainText('Rank 1 · Best')
  await expect(page.getByTestId('compare-other')).toContainText('Destroyer Battle-Helm')
  await expect(page.getByTestId('compare-summary')).toContainText('+21 Hit')
  await expect(page.getByTestId('compare-summary')).not.toContainText('lose')
})

test('the slot and the item are kept across a visit to another planner tab', async ({ page }) => {
  await openCompare(page)
  await pickSlot(page, 'Legs')
  await page.getByTestId('compare-with-destroyer-greaves').click()
  await view(page, 'Gear')
  await view(page, 'Compare')
  await expect(page.getByTestId('compare-slot-Legs')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('compare-with-destroyer-greaves')).toHaveAttribute('aria-pressed', 'true')
})

test('a healer gets the stat changes but not the simulated score', async ({ page }) => {
  // Without `?simulation=1`, which forces the score on for every role.
  await openCompare(page, { flag: false })
  await (await characterField(page, 'Class')).selectOption('Priest')
  await (await characterField(page, 'Specialization')).selectOption('Holy')
  await view(page, 'Compare')
  await expect(page.getByTestId('compare-score')).toHaveCount(0)
  await expect(page.getByTestId('compare-score-hidden')).toContainText(/damage specs only/i)
  await expect(page.getByTestId('compare-changes')).toBeVisible()
  await expect(page.getByTestId('compare-other')).toContainText('Rank 1')
})

test("the line under the top bar names the spec's own Wowhead list", async ({ page }) => {
  await openCompare(page)
  await expect(page.getByTestId('provenance')).toContainText("ranks from Wowhead's Fury Warrior Phase 2 list")
  await expect(page.getByTestId('provenance')).toContainText("scores from this app's simulator")
})

test('on a phone: nothing past the edge, and every Compare control is at least 44px', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 860 })
  await openCompare(page)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBe(0)
  const short = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.compare-panel-shell button, .compare-panel-shell select, .compare-panel-shell summary')]
      .filter((element) => element.offsetParent && element.getBoundingClientRect().height < 44)
      .map((element) => `${(element.textContent ?? '').trim().slice(0, 24)} ${Math.round(element.getBoundingClientRect().height)}`),
  )
  expect(short).toEqual([])
})
