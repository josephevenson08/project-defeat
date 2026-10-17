import { expect, test, type Page } from '@playwright/test'
import { castOnAnyGroup, isPartyScoped } from '../src/domain/buffs/buffScope'
import { sampleBuffs } from '../src/domain/buffs/sampleBuffs'
import { bestAddition, buffReach, computeCoverage, partyBuffCount, raidBuilds, raidGaps } from '../src/domain/raidcomp'
import { exampleRaid } from '../src/domain/raids/exampleRaids'

/*
 * Raid Composition as decided on 2026-10-07/08 and ported in step 5 of docs/design/PORT-PLAN.md: the
 * planning table, dark, with a click-to-fill palette, aiming at a group, a pencil for names, Undo, the
 * example roster, and what it adds up to. These are the prototype's hands-on check
 * (`checks/rc-handson.mjs`) with its real numbers: the palette fills group 1 first; aiming at group 3
 * moves the next seat there; Remove, 10-player and Clear each offer Undo; the example is 25 of 25 and
 * marked, and marked edited once a seat moves; its groups receive 8, 7, 4, 5 and 3 of 18 party buffs;
 * only Winter's Chill is missing from it, which needs a Frost Mage; a full raid disables the palette.
 */

const count = (page: Page) => page.getByTestId('raidcomp-filled')
const seat = (page: Page, group: number, seatIndex: number) => page.getByTestId(`raidcomp-group-${group}`).locator('.raidcomp-seat').nth(seatIndex)

async function openRaidComp(page: Page) {
  await page.goto('/')
  await page.getByTestId('section-raidcomp').click()
  await expect(page.getByTestId('raidcomp-panel')).toBeVisible()
}

test('the advice’s data: the example raid’s coverage, its one gap, and what one more seat would add', () => {
  // 18 of the 32 buffs reach only the caster's party, which is what the hero says.
  expect(sampleBuffs.filter((buff) => isPartyScoped(buff.id))).toHaveLength(18)
  expect(partyBuffCount).toBe(18)
  expect(sampleBuffs).toHaveLength(32)

  const example = exampleRaid(25)
  const report = computeCoverage(example)
  expect(report.filled).toBe(25)
  expect(report.groups.map((group) => group.partyBuffs.length), 'party buffs per group').toEqual([8, 7, 4, 5, 3])

  const gaps = raidGaps(example)
  expect(gaps.raid.map((gap) => `${gap.entry.name} → ${gap.needs}`)).toEqual(["Winter's Chill → a Frost Mage"])
  expect(gaps.raid[0].reach).toBe('Boss')
  expect(gaps.groups.map((group) => group.lacking.length)).toEqual([10, 11, 14, 13, 15])

  const groupOne = bestAddition(example.groups[0])!
  expect(groupOne.build.id).toBe('shaman-enhancement')
  expect(groupOne.gains.map((buff) => buff.name)).toEqual(['Strength of Earth Totem', 'Grace of Air Totem', 'Windfury Totem', 'Unleashed Rage'])
  expect(groupOne.openSeat, 'a full group says "if one seat changed"').toBe(-1)

  // How far each buff reaches, as the tags say it.
  expect(buffReach('battle-shout')).toBe('Party')
  expect(buffReach('mark-of-the-wild')).toBe('Any group')
  expect(buffReach('bloodlust')).toBe('Raid')
  expect(buffReach('thorns')).toBe('Single')
  expect(buffReach('winters-chill')).toBe('Boss')
  expect(raidBuilds, 'the palette carries 29 builds').toHaveLength(29)
})

test('it starts empty, and the palette fills group 1 first or the group you aim at', async ({ page }) => {
  await openRaidComp(page)
  await expect(count(page)).toContainText('0 of 25')
  await expect(page.getByTestId('raidcomp-clear')).toBeDisabled()
  await expect(page.getByTestId('raidcomp-roster-tag')).toHaveText('Empty raid · click a spec below, or load the example')
  await expect(page.getByTestId('raidcomp-missing')).toContainText('Nobody is seated yet')
  await expect(page.getByTestId('raidcomp-next-seat')).toHaveText('group 1, seat 1')

  for (const id of ['warrior-protection', 'paladin-holy', 'priest-holy', 'shaman-restoration', 'mage-arcane', 'rogue-combat']) {
    await page.getByTestId(`raidcomp-add-${id}`).click()
  }
  await expect(count(page)).toContainText('6 of 25')
  await expect(seat(page, 1, 0)).toContainText('Protection Warrior')
  await expect(seat(page, 1, 4)).toContainText('Arcane Mage')
  await expect(seat(page, 2, 0)).toContainText('Combat Rogue')
  await expect(page.getByTestId('raidcomp-status')).toContainText('Seated a Combat Rogue in group 2, seat 1.')
  await expect(page.getByTestId('raidcomp-roster-tag')).toHaveText('Your raid · 6 of 25 seated')

  // Aim at group 3, then back to filling in order.
  await page.getByRole('button', { name: 'Group 3: fill this group next' }).click()
  await expect(page.getByTestId('raidcomp-next-seat')).toHaveText('group 3, seat 1')
  await expect(page.getByTestId('raidcomp-group-3')).toHaveClass(/is-aimed/)
  await page.getByRole('button', { name: 'Fill in order' }).click()
  await expect(page.getByTestId('raidcomp-next-seat')).toHaveText('group 2, seat 2')
  await expect(seat(page, 2, 1)).toContainText('next to fill')
})

test('Remove, 10-player and Clear each offer Undo, and Undo puts the raid back', async ({ page }) => {
  await openRaidComp(page)
  await page.getByTestId('raidcomp-add-warrior-fury').click()
  await page.getByRole('button', { name: 'Group 3: fill this group next' }).click()
  await page.getByTestId('raidcomp-add-mage-fire').click()
  await expect(count(page)).toContainText('2 of 25')

  await page.getByRole('button', { name: 'Remove Fury Warrior' }).click()
  await expect(seat(page, 1, 0)).toContainText('Open seat')
  await page.getByTestId('raidcomp-undo').click()
  await expect(seat(page, 1, 0)).toContainText('Fury Warrior')
  await expect(page.getByTestId('raidcomp-status')).toHaveText('Undone. The raid is back as it was.')

  // 10-player drops group 3 and its Fire Mage, with Undo offered.
  await page.getByTestId('raidcomp-size-10').click()
  await expect(page.locator('.raidcomp-group')).toHaveCount(2)
  await expect(page.getByTestId('raidcomp-status')).toContainText('1 player in groups 3 to 5 was removed.')
  await page.getByTestId('raidcomp-undo').click()
  await expect(page.locator('.raidcomp-group')).toHaveCount(5)
  await expect(seat(page, 3, 0)).toContainText('Fire Mage')

  await page.getByTestId('raidcomp-clear').click()
  await expect(count(page)).toContainText('0 of 25')
  await page.getByTestId('raidcomp-undo').click()
  await expect(count(page)).toContainText('2 of 25')
})

test('the example roster is 25 of 25, labelled as the example, and labelled edited once a seat moves', async ({ page }) => {
  await openRaidComp(page)
  await page.getByTestId('raidcomp-add-warrior-fury').click()
  await expect(page.getByTestId('raidcomp-example')).toHaveText('Reset to example')

  await page.getByTestId('raidcomp-example').click()
  await expect(count(page)).toContainText('25 of 25')
  await expect(page.getByTestId('raidcomp-roster-tag')).toContainText('Example roster: invented seating of real specs')
  // It replaced a raid, so Undo is offered.
  await expect(page.getByTestId('raidcomp-undo')).toBeVisible()

  // The groups receive 8, 7, 4, 5 and 3 of 18 party buffs.
  for (const [group, received] of [8, 7, 4, 5, 3].entries()) {
    await expect(page.getByTestId(`raidcomp-group-${group + 1}`).locator('.raidcomp-group-count')).toHaveText(
      `5 of 5 seated · ${received} of 18 party buffs`,
    )
  }
  await expect(page.getByTestId('raidcomp-missing')).toContainText("Winter's Chill")
  await expect(page.getByTestId('raidcomp-missing')).toContainText('nobody brings it. Needs a Frost Mage.')
  await expect(page.getByTestId('raidcomp-one-more')).toContainText(
    'An Enhancement Shaman would add Strength of Earth Totem, Grace of Air Totem, Windfury Totem and Unleashed Rage.',
  )

  // A full raid disables the palette.
  await expect(page.getByTestId('raidcomp-next-seat')).toHaveText('none, the raid is full')
  await expect(page.locator('.raidcomp-spec-add:not([disabled])')).toHaveCount(0)

  // Moving a seat makes it the edited example; the label survives a reload.
  await page.getByTestId('raidcomp-move-1-1').click()
  await page.getByTestId('raidcomp-place-2-1').click()
  await expect(page.getByTestId('raidcomp-roster-tag')).toContainText('Example roster, edited')
  await page.reload()
  await page.getByTestId('section-raidcomp').click()
  await expect(page.getByTestId('raidcomp-roster-tag')).toContainText('Example roster, edited')
})

test('one more seat seats its suggestion, and every suggestion uses the right article', async ({ page }) => {
  await openRaidComp(page)
  const quick = page.getByTestId('raidcomp-quick-1')
  const label = await quick.innerText()
  expect(label).toMatch(/^Seat an? .+ in group 1$/)
  await quick.click()
  await expect(count(page)).toContainText('1 of 25')
  await expect(seat(page, 1, 0)).toContainText(label.replace(/^Seat an? /, '').replace(/ in group 1$/, ''))

  const texts: string[] = []
  for (const id of ['shaman-restoration', 'warrior-fury', 'mage-arcane']) {
    await page.getByTestId(`raidcomp-add-${id}`).click()
    texts.push(await page.getByTestId('raidcomp-one-more').innerText())
  }
  await page.getByTestId('raidcomp-example').click()
  texts.push(await page.getByTestId('raidcomp-one-more').innerText())
  expect(texts.join(' ').match(/\bA [AEIOU]\w+/g), 'no "A Elemental"').toBeNull()
  expect(texts.join(' ').match(/\ba [AEIOU]\w+/g), 'no "a Enhancement"').toBeNull()
})

test('the pencil names a player, and the page names its rules and sources', async ({ page }) => {
  await openRaidComp(page)
  await page.getByTestId('raidcomp-add-shaman-enhancement').click()
  await page.getByRole('button', { name: /Name the Enhancement Shaman/ }).click()
  await page.getByTestId('raidcomp-name-input-1-1').fill('Thrall')
  await page.getByTestId('raidcomp-name-input-1-1').press('Enter')
  await expect(seat(page, 1, 0)).toContainText('Thrall')
  await expect(page.getByTestId('raidcomp-status')).toHaveText('Named the Enhancement Shaman in group 1, seat 1 Thrall.')

  // The hero's counts and names are the data's.
  const anyGroup = sampleBuffs.filter((buff) => castOnAnyGroup(buff.id)).map((buff) => buff.name)
  expect(anyGroup).toHaveLength(4)
  const hero = page.getByRole('heading', { name: /Seat your raid so every group gets its buffs/ }).locator('..')
  await expect(hero).toContainText('18 of the 32 raid buffs reach only the caster')
  for (const name of anyGroup) await expect(hero).toContainText(name)
  await expect(hero).toContainText('Bloodlust reaches the whole raid on Anniversary realms')
  await expect(page.getByTestId('provenance')).toContainText("each buff's reach from its Wowhead spell tooltip")
})

test('on a phone, with the example seated: no sideways scroll and every control 44px', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 860 })
  await openRaidComp(page)
  await page.getByTestId('raidcomp-example').click()
  await page.getByText('Raid details for the exported chart').click()

  const moved = await page.evaluate(() => {
    const y = scrollY
    scrollTo(60, y)
    const x = scrollX
    scrollTo(0, y)
    return x
  })
  expect(moved, 'scrolls sideways').toBe(0)

  const small = await page.evaluate(() =>
    [...document.querySelectorAll('.content button, .content input, .content select, .content summary')]
      .filter((element) => (element as HTMLElement).offsetParent && element.getBoundingClientRect().height < 44)
      .map((element) => `${(element.textContent?.trim() || element.getAttribute('aria-label') || element.tagName).slice(0, 24)} ${Math.round(element.getBoundingClientRect().height)}`),
  )
  expect(small, 'controls under 44px').toEqual([])
})
