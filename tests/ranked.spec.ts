import { expect, test, type Page } from '@playwright/test'
import { bisLists, getBisListForSpec, rankedItems, rankedListsFor, upgradesLeft, whereText } from '../src/domain/bis'
import { emptyGear, getPairedGearSlots } from '../src/domain/gear/slotCompatibility'
import { getVisibleGearSlotsForSpec } from '../src/domain/gear/slotVisibility'
import { getItemById } from '../src/domain/gear/itemCatalogue'

/*
 * The Character Planner's Ranked Gear tab as decided on 2026-10-10 and ported in step 6 of
 * docs/design/PORT-PLAN.md: design A, Wowhead's order slot by slot as game tooltips, with design C's
 * "Where it drops" behind a switch. These are the prototype's hands-on check
 * (`checks/ranked-handson.mjs`, run as `p`) on the app's own data, which matches the prototype's: 57
 * Fury entries over 15 lists, 56 different items (Rod of the Sun King is ranked for both hands); Head is
 * Destroyer Battle-Helm, Furious Gizmatic Goggles, Warbringer Battle-Helm; Ring of Reciprocity is
 * unique; Gloves of the Searing Grip drop from Al'ar, Tempest Keep's first boss. The prototype's
 * part-geared example is the app's recommended set with Head moved down to #3.
 */

async function openRanked(page: Page, { dressed = true } = {}) {
  await page.goto('/')
  await page.getByTestId('section-planner').click()
  for (let step = 0; step < 3; step++) await page.getByTestId('creator-next').click()
  await page.getByTestId('creator-confirm').click()
  if (dressed) await page.getByTestId('equip-recommended').click()
  await view(page, 'Ranked Gear')
}

const view = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Planner sections' }).getByRole('button', { name, exact: true }).click()

const panel = (page: Page) => page.getByTestId('bis-panel')
const pickSlot = (page: Page, slot: string) => page.getByTestId(`ranked-slot-${slot}`).click()
const gearSlot = (page: Page, slot: string) => page.getByRole('button', { name: `${slot} slot`, exact: true })

async function characterField(page: Page, label: 'Faction' | 'Race' | 'Class' | 'Specialization') {
  if (!(await page.getByTestId('character-fields').isVisible())) await page.getByTestId('character-edit').click()
  return page.getByLabel(label)
}

test("every spec's lists cover its slots once each, and Fury's match the prototype's numbers", () => {
  expect(bisLists).toHaveLength(27)
  for (const list of bisLists) {
    const lists = rankedListsFor(list)
    const visible = getVisibleGearSlotsForSpec(list.className, list.spec)
    // One list per slot, rings and trinkets one each: 17 slots, 15 lists, for every spec.
    expect(lists.flatMap((ranked) => ranked.slots), `${list.spec} ${list.className}`).toEqual(visible)
    expect(lists).toHaveLength(15)
    // Every entry lands on a list, and every item says where it comes from.
    expect(lists.reduce((n, ranked) => n + ranked.entries.length, 0)).toBe(list.entries.length)
    for (const item of rankedItems(lists, emptyGear)) expect(whereText(item.where), item.item.name).not.toBe('')
  }

  // The guide leaves three slots empty, and the tab says so rather than hiding them.
  const empty = bisLists.flatMap((list) =>
    rankedListsFor(list)
      .filter((ranked) => ranked.entries.length === 0)
      .map((ranked) => `${list.spec} ${list.className} ${ranked.label}`),
  )
  expect(empty.sort()).toEqual(['Feral Druid Off Hand', 'Holy Paladin Libram', 'Retribution Paladin Off Hand'])

  const fury = getBisListForSpec('Warrior', 'Fury')
  if (!fury) throw new Error('no Fury list')
  const lists = rankedListsFor(fury)
  expect(fury.entries).toHaveLength(57)
  const items = rankedItems(lists, emptyGear)
  expect(items).toHaveLength(56)
  expect(items.find((item) => item.item.name === 'Rod of the Sun King')?.on.map((on) => on.list.label)).toEqual(['Main Hand', 'Off Hand'])
  expect(lists.find((ranked) => ranked.key === 'Finger 1')).toMatchObject({ label: 'Rings', slots: getPairedGearSlots('Finger 1') })
  expect(lists[0].entries.map((entry) => getItemById(entry.itemId)?.name)).toEqual([
    'Destroyer Battle-Helm',
    'Furious Gizmatic Goggles',
    'Warbringer Battle-Helm',
  ])
  // Wearing nothing, everything is an upgrade.
  expect(upgradesLeft(items)).toBe(56)
})

test('Slot by slot: Head is the guide\'s three in order as tooltips, with what you wear marked', async ({ page }) => {
  await openRanked(page)
  await expect(page.getByRole('heading', { name: 'Ranked Gear', exact: true })).toBeVisible()
  await expect(page.getByText('Fury Warrior Phase 2 Ranked List')).toBeVisible()
  await expect(page.getByTestId('view-slot')).toHaveAttribute('aria-pressed', 'true')
  // Your 17 slots, each showing what you wear.
  await expect(page.getByRole('group', { name: 'Slot' }).getByRole('button')).toHaveCount(17)
  await expect(page.getByTestId('ranked-slot-Head')).toHaveAccessibleName('Head: Destroyer Battle-Helm')
  await expect(page.locator('.ranked-head')).toHaveText(/Head\s*3 ranked · you wear #1/)

  const cards = panel(page).locator('.ranked-card')
  await expect(cards).toHaveCount(3)
  await expect(cards.nth(0)).toContainText('#1')
  await expect(cards.nth(0)).toContainText('Best')
  await expect(cards.nth(0)).toContainText('Destroyer Battle-Helm')
  await expect(cards.nth(0)).toContainText('You wear this')
  await expect(cards.nth(0).getByRole('button', { name: 'Equipped' })).toBeDisabled()
  // What you wear is shown as you wear it: the recommended set's enchant and the Destroyer set.
  await expect(cards.nth(0).locator('.item-tip')).toContainText('Glyph of Ferocity')
  await expect(cards.nth(0).locator('.item-tip')).toContainText('Destroyer Battlegear')
  await expect(cards.nth(0).locator('.item-tip')).toContainText('T5 token · Lady Vashj, Serpentshrine Cavern')
  await expect(cards.nth(1)).toContainText('Furious Gizmatic Goggles')
  await expect(cards.nth(1)).toContainText('Great')
  await expect(cards.nth(2)).toContainText('Warbringer Battle-Helm')
  await expect(cards.nth(2)).toContainText('P1 BiS')
})

test('an item you do not wear is shown as Wowhead gems and enchants it', async ({ page }) => {
  await openRanked(page)
  const goggles = page.getByTestId('ranked-card-furious-gizmatic-goggles')
  await expect(goggles.locator('.item-tip')).toContainText('Relentless Earthstorm Diamond')
  await expect(goggles.locator('.item-tip')).toContainText('Glyph of Ferocity')
  await expect(goggles.locator('.item-tip')).toContainText('Crafted: Engineering')
  // The engineering goggles: no socket left bare, and the cost of making them.
  await expect(goggles.locator('.item-tip-socket')).toHaveCount(0)
})

test('rings: one list for both slots, and a unique ring cannot go in twice', async ({ page }) => {
  await openRanked(page)
  await pickSlot(page, 'Finger 1')
  await expect(page.getByTestId('ranked-slot-Finger 1')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.ranked-head')).toContainText('one list for both rings slots')
  // The recommended set wears #1 and #2; Ring of Reciprocity (#2) is unique and already in Finger 2.
  const reciprocity = page.getByTestId('ranked-card-ring-of-reciprocity')
  await expect(reciprocity).toContainText('In your Finger 2')
  await expect(reciprocity.getByRole('button', { name: 'Unique: already in Finger 2' })).toBeDisabled()

  // Trinkets the same way, from the other end: Dragonspine Trophy is in Trinket 1.
  await pickSlot(page, 'Trinket 2')
  await expect(page.getByTestId('ranked-card-dragonspine-trophy').getByRole('button', { name: 'Unique: already in Trinket 1' })).toBeDisabled()
})

test('equip the goggles: the Gear tab wears them with the guide\'s gems, and the card says so', async ({ page }) => {
  await openRanked(page)
  await page.getByRole('button', { name: 'Equip Furious Gizmatic Goggles in Head' }).click()
  await expect(page.getByTestId('ranked-message')).toHaveText('Head: equipped Furious Gizmatic Goggles. The Gear tab shows it too.')
  await expect(page.locator('.ranked-card.is-worn')).toContainText('Furious Gizmatic Goggles')
  await expect(page.locator('.ranked-head')).toContainText('you wear #2')
  // Focus stays on the slot rather than falling to the page.
  await expect(page.getByTestId('ranked-slot-Head')).toBeFocused()

  await view(page, 'Gear')
  await expect(gearSlot(page, 'Head')).toContainText('Furious Gizmatic Goggles')
  await expect(gearSlot(page, 'Head')).toContainText('Glyph of Ferocity')

  // A Gear-tab change shows here too: putting the helm back on in the slot's own picker.
  await gearSlot(page, 'Head').click()
  await page.getByLabel('Head', { exact: true }).selectOption('destroyer-battle-helm')
  await view(page, 'Ranked Gear')
  await expect(page.locator('.ranked-head')).toContainText('you wear #1')
})

test('Where it drops: raids first and in order, bosses in kill order, 56 items once each', async ({ page }) => {
  await openRanked(page)
  await page.getByTestId('view-where').click()
  const groups = await panel(page).locator('.ranked-group > h4').allInnerTexts()
  expect(groups.map((text) => text.split('\n')[0].replace(/ (This|Last) tier.*| (Doom|Professions|Badges).*/, '').trim())).toEqual([
    'Serpentshrine Cavern',
    'Tempest Keep',
    'Karazhan',
    "Gruul's Lair",
    "Magtheridon's Lair",
    'World bosses',
    'Crafted',
    'Everything else',
  ])
  await expect(panel(page).locator('.ranked-row')).toHaveCount(56)
  const count = async (id: string) => page.getByTestId(`ranked-group-${id}`).locator('.ranked-row').count()
  expect(
    [
      await count('serpentshrine-cavern'),
      await count('tempest-keep'),
      await count('karazhan'),
      await count('gruuls-lair'),
      await count('magtheridons-lair'),
      await count('world'),
      await count('craft'),
      await count('other'),
    ],
    'SSC, TK, Karazhan, Gruul, Magtheridon, world bosses, crafted, everything else',
  ).toEqual([20, 12, 4, 3, 2, 5, 5, 5])

  // Al'ar is Tempest Keep's first boss, with Gloves of the Searing Grip.
  const firstBoss = page.getByTestId('ranked-group-tempest-keep').locator('.ranked-boss').first()
  await expect(firstBoss.locator('h5')).toHaveText(/^Boss 1\s*Al'ar$/)
  await expect(firstBoss).toContainText('Gloves of the Searing Grip')
  // Tier pieces sit under the boss whose token buys them, tagged as tokens.
  const vashj = page.getByTestId('ranked-group-serpentshrine-cavern').locator('.ranked-boss', { hasText: 'Lady Vashj' })
  await expect(vashj.getByTestId('ranked-row-destroyer-battle-helm')).toContainText('T5 token')
  const prince = page.getByTestId('ranked-group-karazhan').locator('.ranked-boss', { hasText: 'Prince Malchezaar' })
  await expect(prince.getByTestId('ranked-row-warbringer-battle-helm')).toContainText('T4 token')
  // Everything else says where, in the guide's words.
  await expect(page.getByTestId('ranked-row-bloodlust-brooch')).toContainText('Vendor: 41 Badges of Justice')
  // An item ranked for both hands is one row naming both.
  await expect(page.getByTestId('ranked-row-rod-of-the-sun-king')).toContainText('Main Hand #3 of 4 · Great · Off Hand #2 of 4 · Great')
})

test('the recommended set leaves no upgrades; Head on #3 leaves two, and Equip clears them', async ({ page }) => {
  await openRanked(page)
  await page.getByTestId('view-where').click()
  await expect(page.getByTestId('ranked-summary')).toContainText('No upgrades left: you wear the top pick in every slot')
  await expect(page.getByTestId('view-where')).toHaveAccessibleName('Where it drops')

  // The prototype's part-geared example, the app's way: drop Head to Warbringer Battle-Helm (#3).
  await page.getByTestId('view-slot').click()
  await page.getByRole('button', { name: 'Equip Warbringer Battle-Helm in Head' }).click()
  await expect(page.getByTestId('view-where')).toHaveAccessibleName('Where it drops, 2 upgrades left')
  await page.getByTestId('view-where').click()
  await expect(page.getByTestId('ranked-summary')).toContainText('2 upgrades left')
  await expect(page.getByTestId('ranked-summary')).toContainText('Serpentshrine Cavern 1')

  await page.getByTestId('ranked-only-upgrades').click()
  await expect(page.getByTestId('ranked-only-upgrades')).toHaveAttribute('aria-pressed', 'true')
  await expect(panel(page).locator('.ranked-row')).toHaveCount(2)
  await expect(panel(page).locator('.ranked-row.is-above')).toHaveCount(2)

  await page.getByRole('button', { name: 'Equip Destroyer Battle-Helm in Head' }).click()
  await expect(page.getByTestId('ranked-message')).toHaveText('Head: equipped Destroyer Battle-Helm. The Gear tab shows it too.')
  await expect(page.getByTestId('ranked-summary')).toContainText('No upgrades left')
  await expect(page.getByTestId('ranked-only-upgrades')).toBeFocused()
  await page.getByTestId('ranked-only-upgrades').click()
  await expect(page.getByTestId('ranked-row-destroyer-battle-helm')).toContainText('You wear it')
  await view(page, 'Gear')
  await expect(gearSlot(page, 'Head')).toContainText('Destroyer Battle-Helm')
})

test('a fresh character wears nothing, so every ranked item is an upgrade', async ({ page }) => {
  await openRanked(page, { dressed: false })
  await expect(page.locator('.ranked-head')).toContainText('this slot is empty')
  await expect(page.getByTestId('ranked-slot-Head')).toHaveAccessibleName('Head, empty')
  await expect(page.getByTestId('view-where')).toHaveAccessibleName('Where it drops, 56 upgrades left')
})

test('a row in Where it drops shows the item as its tooltip on hover', async ({ page }) => {
  await openRanked(page)
  await page.getByTestId('view-where').click()
  // Scrolled to first: a scroll hides a tip on a wide screen, since a bubble left behind points at nothing.
  const row = page.getByTestId('ranked-row-gloves-of-the-searing-grip').locator('.ranked-row-item')
  await row.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await page.waitForTimeout(300)
  await row.hover()
  const tip = page.getByTestId('item-tip')
  await expect(tip).toBeVisible()
  // On screen, not merely rendered: inside a glass panel a fixed box was placed against the panel.
  await expect(tip).toBeInViewport()
  await expect(tip).toContainText('Gloves of the Searing Grip')
  await expect(tip).toContainText("Al'ar, Tempest Keep")
  await expect(tip).toContainText('Hands #3 of 4 · Great')
})

test('the view and the slot are kept across a visit to another planner tab', async ({ page }) => {
  await openRanked(page)
  await pickSlot(page, 'Legs')
  await page.getByTestId('view-where').click()
  await view(page, 'Gear')
  await view(page, 'Ranked Gear')
  await expect(page.getByTestId('view-where')).toHaveAttribute('aria-pressed', 'true')
  await page.getByTestId('view-slot').click()
  await expect(page.getByTestId('ranked-slot-Legs')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.ranked-head h4')).toHaveText('Legs')
})

test("other specs read their own lists: a Shaman's Totem, a Feral's off hand, a Holy Paladin's empty Libram", async ({ page }) => {
  await openRanked(page, { dressed: false })

  // A Tauren can be a Shaman or a Druid, and a Blood Elf a Paladin.
  await (await characterField(page, 'Faction')).selectOption('Horde')
  await (await characterField(page, 'Race')).selectOption('Tauren')
  await (await characterField(page, 'Class')).selectOption('Shaman')
  await (await characterField(page, 'Specialization')).selectOption('Enhancement')
  await expect(page.getByText('Enhancement Shaman Phase 2 Ranked List')).toBeVisible()
  await pickSlot(page, 'Relic')
  await expect(page.locator('.ranked-head h4')).toHaveText('Totem')
  await expect(panel(page).locator('.ranked-card').first()).toContainText('#1')
  await page.getByTestId('view-where').click()
  // Cataclysm Helm is not listed under a boss in the loot tables; its token is, under Lady Vashj.
  const vashj = page.getByTestId('ranked-group-serpentshrine-cavern').locator('.ranked-boss', { hasText: 'Lady Vashj' })
  await expect(vashj.getByTestId('ranked-row-cataclysm-helm')).toContainText('T5 token')
  await page.getByTestId('view-slot').click()

  await (await characterField(page, 'Class')).selectOption('Druid')
  await (await characterField(page, 'Specialization')).selectOption('Feral')
  await pickSlot(page, 'Off Hand')
  await expect(page.getByTestId('ranked-none')).toHaveText(
    "Wowhead's Feral Druid list ranks nothing for Off Hand. Its main-hand picks are all two-handed.",
  )

  await (await characterField(page, 'Race')).selectOption('Blood Elf')
  await (await characterField(page, 'Class')).selectOption('Paladin')
  await (await characterField(page, 'Specialization')).selectOption('Holy')
  await pickSlot(page, 'Relic')
  await expect(page.locator('.ranked-head h4')).toHaveText('Libram')
  await expect(page.getByTestId('ranked-none')).toHaveText("Wowhead's Holy Paladin list ranks nothing for Libram.")
})

test('the line under the top bar names the spec\'s own Wowhead list', async ({ page }) => {
  await openRanked(page)
  const sources = page.getByTestId('provenance')
  await expect(sources).toContainText("Wowhead's Fury Warrior Phase 2 list")
  await expect(sources.getByRole('link', { name: "Wowhead's Fury Warrior Phase 2 list" })).toHaveAttribute('href', /wowhead\.com/)
  await view(page, 'Gear')
  await expect(page.getByTestId('provenance')).toHaveCount(0)
})

test('on a phone: nothing past the edge, and every Ranked Gear control is at least 44px', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 860 })
  await openRanked(page)
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  // 43.5, not 44: a 44px control can measure a hair short under load, from subpixel layout.
  const short = () =>
    page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('[data-testid="bis-panel"] button, [data-testid="bis-panel"] summary')]
        .filter((element) => element.offsetParent && element.getBoundingClientRect().height < 43.5)
        .map((element) => `${(element.textContent ?? '').trim().slice(0, 24)} ${Math.round(element.getBoundingClientRect().height)}`),
    )
  expect(await overflow()).toBe(0)
  expect(await short()).toEqual([])
  await page.getByTestId('view-where').click()
  expect(await overflow()).toBe(0)
  expect(await short()).toEqual([])
})
