import { expect, test, type Page } from '@playwright/test'
import { compareWithLogs, getSpecStanding, logsOrder } from '../src/domain/tierlists/specStanding'

/*
 * Spec Tier Lists as decided on 2026-10-12 and ported in step 1 of docs/design/PORT-PLAN.md: design A,
 * the tier board with a card for any spec, and design B's chart against the logs behind a switch.
 * These are the prototype's hands-on check (`checks/tiers-handson.mjs`) turned into tests, with the
 * same real numbers: Retribution Paladin is B on Wowhead and 5th by observed DPS (1,785); Fury
 * Warrior is S on Wowhead, A on archon, 3rd (2,053); Wowhead and archon agree on 9 of the 20.
 */

const sectionTab = (page: Page, label: string) =>
  page.getByRole('navigation', { name: 'Main sections' }).getByRole('button', { name: label, exact: true })

async function openTierLists(page: Page) {
  await page.goto('/?simulation=1')
  await page.getByTestId('section-tierlists').click()
  await expect(page.getByRole('heading', { name: 'DPS tier list' })).toBeVisible()
}

/** Creates the default character (Human Fury Warrior) and comes back to the tier lists. */
async function openTierListsAsFury(page: Page) {
  await page.goto('/?simulation=1')
  await page.getByTestId('section-planner').click()
  for (let step = 0; step < 3; step++) await page.getByTestId('creator-next').click()
  await page.getByTestId('creator-confirm').click()
  await sectionTab(page, 'Spec Tier Lists').click()
  await expect(page.getByRole('heading', { name: 'DPS tier list' })).toBeVisible()
}

const tile = (page: Page, role: 'DPS' | 'Healer' | 'Tank', slug: string) => page.getByTestId(`tier-spec-${role}-${slug}`)
const card = (page: Page) => page.getByTestId('spec-card')

test('the standings come from the app’s own data, and the two opinions are counted, not averaged', () => {
  const fury = getSpecStanding({ className: 'Warrior', spec: 'Fury' })
  expect(fury.places.map((place) => `${place.role} ${place.label}`)).toEqual(['DPS S'])
  expect(fury.logs).toEqual({ dps: 2053, tier: 'A', rank: 3, of: 20 })
  expect(fury.ability).toBe('Bloodthirst')

  const feral = getSpecStanding({ className: 'Druid', spec: 'Feral' })
  expect(feral.places.map((place) => `${place.role} ${place.label}`)).toEqual(['DPS C', 'Tank S'])
  expect(feral.logs?.rank).toBe(10)

  // Healers and tanks have no log numbers in the app, and the standing does not invent any.
  expect(getSpecStanding({ className: 'Priest', spec: 'Holy' }).logs).toBeUndefined()

  expect(logsOrder.map((entry) => `${entry.spec} ${entry.className}`).slice(0, 3)).toEqual([
    'Arcane Mage',
    'Beast Mastery Hunter',
    'Fury Warrior',
  ])

  const comparison = compareWithLogs()
  expect([comparison.agree, comparison.logsHigher, comparison.wowheadHigher, comparison.wowheadD]).toEqual([9, 3, 5, 3])
  expect(comparison.underrated).toMatchObject({ ref: { className: 'Druid', spec: 'Feral' }, rank: 10, wowhead: 'C' })
  expect(comparison.notDpsOrder).toMatchObject({ ref: { className: 'Shaman', spec: 'Elemental' }, rank: 13, archon: 'A' })
})

test('the board: twenty damage specs in five rows, five healers, three tanks, Feral on two lists', async ({ page }) => {
  await openTierLists(page)

  for (const [role, rows, specs] of [
    ['DPS', 5, 20],
    ['Healer', 3, 5],
    ['Tank', 3, 3],
  ] as const) {
    const board = page.getByRole('region', { name: `${role} tier list` })
    await expect(board.locator('.tier-row'), `${role} rows`).toHaveCount(rows)
    await expect(board.locator('.tier-tile'), `${role} specs`).toHaveCount(specs)
  }
  await expect(tile(page, 'DPS', 'feral-druid')).toBeVisible()
  await expect(tile(page, 'Tank', 'feral-druid')).toBeVisible()

  // The page says what these are before anything else, and where they come from.
  await expect(page.locator('.tier-note')).toContainText('These rank specs, not items.')
  await expect(page.locator('.topbar-line').getByTestId('provenance')).toContainText(
    "Sources: Wowhead's Phase 2 PvE tier lists (ingested 12 Aug 2026) · archon.gg logs (read 23 Aug 2026)",
  )
})

test('the card opens on your spec, and pressing Feral lights it on both lists', async ({ page }) => {
  await openTierListsAsFury(page)

  await expect(tile(page, 'DPS', 'fury-warrior')).toHaveAttribute('aria-pressed', 'true')
  await expect(tile(page, 'DPS', 'fury-warrior')).toHaveAccessibleName('Fury Warrior, tier S, your spec')
  await expect(card(page)).toContainText('Fury Warrior')
  await expect(card(page)).toContainText('2,053 DPS average, 3rd of 20')
  await expect(card(page)).toContainText('Bloodthirst')
  await expect(card(page)).toContainText('Your spec')

  await tile(page, 'DPS', 'feral-druid').click()
  await expect(tile(page, 'DPS', 'feral-druid')).toHaveAttribute('aria-pressed', 'true')
  await expect(tile(page, 'Tank', 'feral-druid'), 'the same spec is lit on its other list').toHaveAttribute('aria-pressed', 'true')
  await expect(card(page)).toContainText(/Wowhead · DPS\s*C of S A B C D/)
  await expect(card(page)).toContainText(/Wowhead · Tank\s*S of/)
  await expect(card(page)).toContainText('1,655 DPS average, 10th of 20')

  await tile(page, 'Healer', 'holy-priest').click()
  await expect(card(page)).toContainText('No log numbers in the app for healers')

  // The chosen spec is still chosen after a visit to another tab.
  await sectionTab(page, 'Raids').click()
  await sectionTab(page, 'Spec Tier Lists').click()
  await expect(card(page)).toContainText('Holy Priest')
})

test('with no character the card waits to be asked, and nothing is marked as yours', async ({ page }) => {
  await openTierLists(page)
  await expect(page.locator('.tier-tile[data-current]')).toHaveCount(0)
  await expect(page.locator('.tier-you')).toHaveCount(0)
  await expect(page.getByTestId('spec-card-empty')).toBeVisible()

  await tile(page, 'DPS', 'retribution-paladin').click()
  await expect(card(page)).toContainText('1,785 DPS average, 5th of 20')
})

test('hovering a spec shows its standing in a tooltip', async ({ page }) => {
  await openTierLists(page)
  await tile(page, 'DPS', 'retribution-paladin').hover()
  const tip = page.getByTestId('spec-tip')
  await expect(tip).toContainText('Retribution Paladin')
  await expect(tip).toContainText('B for damage')
  await expect(tip).toContainText('1,785 DPS in the logs · archon B · 5th of 20')

  await page.keyboard.press('Escape')
  await expect(tip).toHaveCount(0)
})

test('the class filter lights one class and dims the rest', async ({ page }) => {
  await openTierLists(page)
  const dps = page.getByRole('region', { name: 'DPS tier list' })
  await dps.getByRole('group', { name: 'Show a class' }).getByRole('button', { name: 'Rogue', exact: true }).click()
  await expect(dps.locator('.tier-tile:not(.tier-tile-dim)')).toHaveCount(3)
  await dps.getByRole('group', { name: 'Show a class' }).getByRole('button', { name: 'All', exact: true }).click()
  await expect(dps.locator('.tier-tile-dim')).toHaveCount(0)
})

test('arrow keys move through a board', async ({ page }) => {
  await openTierLists(page)
  const first = page.getByRole('region', { name: 'DPS tier list' }).locator('.tier-tile').first()
  await first.focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('region', { name: 'DPS tier list' }).locator('.tier-tile').nth(1)).toBeFocused()
})

test('against the logs: twenty specs by observed DPS, both letters, and where they disagree', async ({ page }) => {
  await openTierListsAsFury(page)
  await expect(page.getByTestId('view-board')).toHaveAttribute('aria-pressed', 'true')
  await page.getByTestId('view-logs').click()

  const rows = page.getByTestId('tier-chart').locator('.tier-chart-row')
  await expect(rows).toHaveCount(20)
  await expect(rows.first()).toContainText('Arcane')
  await expect(rows.first()).toContainText('2,084')
  await expect(rows.nth(2)).toContainText('Fury')
  await expect(page.getByRole('region', { name: 'DPS tier list' }), 'the board is gone').toHaveCount(0)

  const summary = page.getByRole('region', { name: 'Two opinions' })
  await expect(summary.locator('.tier-facts')).toContainText(/Agree\s*9 of 20/)
  await expect(summary.locator('.tier-facts')).toContainText(/Logs higher\s*3/)
  await expect(summary.locator('.tier-facts')).toContainText(/Wowhead higher\s*5/)
  await expect(summary.locator('.tier-facts')).toContainText(/Wowhead D, archon C\s*3/)
  await expect(summary).toContainText("Feral Druid averages the 10th-highest DPS of 20, yet sits in Wowhead's C tier.")
  await expect(summary).toContainText('Fury Warrior, your spec: Wowhead S, archon A, 3rd by DPS at 2,053.')

  // Sorted by Wowhead's tier: the four S specs first, the three D specs last.
  await page.getByRole('group', { name: 'Sort' }).getByRole('button', { name: "By Wowhead's tier" }).click()
  const order = await rows.evaluateAll((items) => items.map((item) => item.getAttribute('data-testid')))
  expect(new Set(order.slice(0, 4))).toEqual(
    new Set(['Mage|Arcane', 'Hunter|Beast Mastery', 'Warrior|Fury', 'Warlock|Destruction'].map((key) => `tier-chart-${key}`)),
  )
  expect(new Set(order.slice(-3))).toEqual(
    new Set(['Hunter|Marksmanship', 'Rogue|Assassination', 'Rogue|Subtlety'].map((key) => `tier-chart-${key}`)),
  )

  await page.getByLabel('Only where they disagree').check()
  await expect(rows).toHaveCount(11)
  await page.getByLabel('Only where they disagree').uncheck()

  // A row opens the spec's card.
  const ret = page.getByTestId('tier-chart-Paladin|Retribution')
  await ret.getByRole('button').click()
  await expect(ret).toContainText('1,785 DPS average, 5th of 20')
  await expect(ret).toContainText('Crusader Strike')

  // Healers and tanks are Wowhead's opinion alone, and say so.
  await expect(page.getByRole('region', { name: 'Healer tier list' })).toContainText('no log numbers for healers')
  await expect(page.getByRole('region', { name: 'Tank tier list' })).toContainText('no log numbers for tanks')

  // The view is kept for the session, across a visit to another tab.
  await sectionTab(page, 'Raids').click()
  await sectionTab(page, 'Spec Tier Lists').click()
  await expect(page.getByTestId('view-logs')).toHaveAttribute('aria-pressed', 'true')
})

test('a saved Raid Composition roster is counted on the card', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    const fury = { className: 'Warrior', spec: 'Fury', buildId: 'warrior-fury' }
    const groups = Array.from({ length: 5 }, (_, index) =>
      Array.from({ length: 5 }, (_, seat) => (index === 0 && seat < 2 ? fury : null)),
    )
    localStorage.setItem('project-defeat:roster:v1', JSON.stringify({ size: 25, groups }))
  })
  await openTierLists(page)
  await tile(page, 'DPS', 'fury-warrior').click()
  await expect(card(page)).toContainText('2 players in your raid')
  await tile(page, 'DPS', 'arcane-mage').click()
  await expect(card(page)).toContainText('None in your raid')
})

test('on a phone the tier lists fit, and every control is a 44px target', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 860 })
  await openTierLists(page)

  const check = async (where: string) => {
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), `${where}: no sideways scroll`).toBeLessThanOrEqual(0)
    const small = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('.tier-view button, .tier-view input[type="checkbox"]')]
        .filter((element) => element.offsetParent && element.getBoundingClientRect().height < 44)
        .filter((element) => !(element instanceof HTMLInputElement) || !element.closest('label'))
        .map((element) => `${(element.textContent ?? '').trim().slice(0, 24)} ${Math.round(element.getBoundingClientRect().height)}`),
    )
    expect(small, `${where}: controls under 44px`).toEqual([])
  }

  await check('the board')
  await page.getByTestId('view-logs').click()
  await check('against the logs')
})
