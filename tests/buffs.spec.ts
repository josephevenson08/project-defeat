import { expect, test, type Page } from '@playwright/test'

/*
 * The Character Planner's Buffs tab as decided on 2026-10-09 and ported in step 6 of
 * docs/design/PORT-PLAN.md: design C, the buffs filled in from who is in your raid and your seat in
 * it, with design A's icon tiles. These are the prototype's hands-on check (`checks/buffs-handson.mjs`,
 * run as `p`) on the app's own data: in the example 25-man a Fury Warrior sits in group 2, and 15 of
 * the 20 counted buffs and debuffs reach them; group 1 has no Enhancement Shaman, so no Strength of
 * Earth Totem; the raid's four Paladins give Kings, Might and Salvation; an elixir takes out the
 * flask. The prototype's hit-cap steps wait for the hit-cap helper (Gear), and its reload step is a
 * visit to another tab here, since the app starts clean on a reload.
 */

async function openBuffs(page: Page, { roster }: { roster?: object } = {}) {
  if (roster) await page.addInitScript((value) => localStorage.setItem('project-defeat:roster:v1', value), JSON.stringify(roster))
  await page.goto('/')
  await page.getByTestId('section-planner').click()
  for (let step = 0; step < 3; step++) await page.getByTestId('creator-next').click()
  await page.getByTestId('creator-confirm').click()
  await view(page, 'Buffs')
}

const view = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Planner sections' }).getByRole('button', { name, exact: true }).click()
const message = (page: Page) => page.getByTestId('buffs-message')
const source = (page: Page, id: string) => page.getByTestId(`buffs-source-${id}`)
const box = (page: Page, name: string) => page.getByRole('region', { name, exact: true })

async function characterField(page: Page, label: 'Faction' | 'Race' | 'Class' | 'Specialization') {
  if (!(await page.getByTestId('character-fields').isVisible())) await page.getByTestId('character-edit').click()
  return page.getByLabel(label)
}

test('it opens By hand with nothing on, and Your raid waits for a Raid Composition roster', async ({ page }) => {
  await openBuffs(page)
  await expect(page.getByRole('region', { name: 'Buffs', exact: true })).toBeVisible()
  await expect(source(page, 'hand')).toHaveAttribute('aria-pressed', 'true')
  await expect(source(page, 'mine')).toBeDisabled()
  await expect(page.getByTestId('buff-toggle-battle-shout')).toHaveAttribute('aria-pressed', 'false')
  await expect(page.locator('.buff-tile.is-on')).toHaveCount(0)
})

test('the example 25-man: group 2, 15 of 20 reach you, and Grace of Air waits on the one Shaman', async ({ page }) => {
  await openBuffs(page)
  await source(page, 'ex25').click()
  await expect(message(page)).toHaveText("Example 25-man: you're in group 2. 15 counted buffs and debuffs reach you; 5 are missing.")
  await expect(page.getByTestId('buffs-seat-1-0')).toHaveAccessibleName('You, Fury Warrior')

  // Your group's buffs, the raid's, and the boss's, each lit.
  await expect(box(page, 'From your group').getByTestId('buff-toggle-battle-shout')).toHaveAttribute('aria-pressed', 'true')
  await expect(box(page, 'From your group').getByTestId('buff-toggle-strength-of-earth-totem')).toHaveAttribute('aria-pressed', 'true')
  await expect(box(page, 'From the raid').getByTestId('buff-toggle-prayer-of-fortitude')).toHaveAttribute('aria-pressed', 'true')
  await expect(box(page, 'On the boss').getByTestId('target-debuff-toggle-sunder-armor')).toHaveAttribute('aria-pressed', 'true')

  // One Enhancement Shaman drops one air totem: Windfury first, so Grace of Air is missing, and says why.
  const missing = page.getByTestId('buffs-missing')
  await expect(missing.getByTestId('buff-toggle-grace-of-air-totem')).toHaveAttribute('aria-pressed', 'false')
  await expect(missing).toContainText('Grace of Air Totem: whoever could give it is already giving Windfury Totem')
  await expect(missing).toContainText('Trueshot Aura: needs a Marksmanship Hunter in your group')

  // The tooltip says how far a buff reaches and who gives it to you.
  await box(page, 'From your group').getByTestId('buff-toggle-strength-of-earth-totem').hover()
  const tip = page.getByTestId('buff-tip')
  await expect(tip).toBeInViewport()
  await expect(tip).toContainText('Your group · from an Enhancement Shaman')
  await expect(tip).toContainText('From Enhancement Shaman, group 2')
})

test('sitting in group 1 loses Strength of Earth: no Enhancement Shaman there', async ({ page }) => {
  await openBuffs(page)
  await source(page, 'ex25').click()
  await page.getByTestId('buffs-seat-0-0').click()
  await expect(message(page)).toContainText("you're in group 1")
  await expect(page.getByTestId('buffs-seat-0-0')).toHaveAccessibleName('You, Fury Warrior')
  await expect(page.getByTestId('buffs-missing')).toContainText('Strength of Earth Totem: needs an Enhancement Shaman in your group')
  await expect(page.getByTestId('buff-toggle-strength-of-earth-totem')).toHaveAttribute('aria-pressed', 'false')
})

test('Paladins: Kings, Might and Salvation by default, and a taken Blessing swaps', async ({ page }) => {
  await openBuffs(page)
  await source(page, 'ex25').click()
  const pals = page.getByRole('region', { name: 'Paladin Blessings' }).getByRole('listitem')
  await expect(pals).toHaveCount(4)
  await expect(page.getByTestId('pal-0-blessing-of-kings')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('pal-1-blessing-of-might')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('pal-2-blessing-of-salvation')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('pal-3-none')).toHaveAttribute('aria-pressed', 'true')

  await page.getByTestId('pal-0-blessing-of-might').click()
  await expect(page.getByTestId('pal-0-blessing-of-might')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('pal-1-blessing-of-kings')).toHaveAttribute('aria-pressed', 'true')
  await expect(message(page)).toContainText('takes Greater Blessing of Kings instead')

  // The Retribution Paladin gave Salvation, so Might moves to them.
  await page.getByTestId('pal-0-blessing-of-salvation').click()
  await expect(page.getByTestId('pal-2-blessing-of-might')).toHaveAttribute('aria-pressed', 'true')
  // A Blessing is the Paladins' to give, so its tile says who gives it rather than switching.
  await expect(box(page, 'From the raid').getByTestId('buff-toggle-blessing-of-might')).toHaveAccessibleName(
    'Greater Blessing of Might, given: from Retribution Paladin, group 4',
  )

  // Nobody on Might any more: it goes missing.
  await page.getByTestId('pal-2-none').click()
  await expect(page.getByTestId('buffs-missing')).toContainText('Greater Blessing of Might: no Paladin is assigned it')
})

test('a buff switched by hand says so, and choosing the raid again undoes it', async ({ page }) => {
  await openBuffs(page)
  await source(page, 'ex25').click()
  await page.getByTestId('target-debuff-toggle-curse-of-recklessness').click()
  await expect(page.locator('.buff-tile-badge')).toHaveCount(1)
  await expect(message(page)).toHaveText('Curse of Recklessness off by hand. Choose the raid again to undo your changes.')
  await source(page, 'ex25').click()
  await expect(page.locator('.buff-tile-badge')).toHaveCount(0)
})

test('a buff the simulator does not count says why', async ({ page }) => {
  await openBuffs(page)
  await page.getByTestId('buff-unmodelled-windfury-totem').click()
  await expect(message(page)).toContainText("Windfury Totem isn't counted:")
})

test('an elixir takes out the flask', async ({ page }) => {
  await openBuffs(page)
  await page.getByTestId('consumable-toggle-flask-of-relentless-assault').click()
  await expect(page.getByTestId('consumable-toggle-flask-of-relentless-assault')).toHaveAttribute('aria-pressed', 'true')
  await page.getByTestId('consumable-toggle-elixir-of-major-strength').click()
  await expect(message(page)).toHaveText(
    'Battle Elixir: Elixir of Major Strength. Took out Flask of Relentless Assault: an elixir can\'t go with a flask.',
  )
  await expect(page.getByTestId('consumable-none-flask')).toHaveAttribute('aria-pressed', 'true')
})

test('Just you is what you bring yourself', async ({ page }) => {
  await openBuffs(page)
  await source(page, 'solo').click()
  await expect(message(page)).toHaveText("Just you: you're in group 1. 2 counted buffs and debuffs reach you; 18 are missing.")
  await expect(page.getByTestId('buff-toggle-battle-shout')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('target-debuff-toggle-sunder-armor')).toHaveAttribute('aria-pressed', 'true')
})

test('Your raid reads the roster on Raid Composition', async ({ page }) => {
  await openBuffs(page, {
    roster: {
      size: 10,
      groups: [
        [
          { className: 'Warrior', spec: 'Fury', buildId: 'warrior-fury', playerName: 'Brakk' },
          { className: 'Shaman', spec: 'Enhancement', buildId: 'shaman-enhancement', playerName: 'Thrallson' },
          null,
          null,
          null,
        ],
        [null, null, null, null, null],
      ],
    },
  })
  await expect(source(page, 'mine')).toBeEnabled()
  await source(page, 'mine').click()
  await expect(message(page)).toContainText("Your raid: you're in group 1.")
  await expect(page.locator('.buffs-note').first()).toHaveText('From the roster on the Raid Composition tab.')
  await expect(page.getByTestId('buffs-seat-0-1')).toHaveAccessibleName('Thrallson, Enhancement Shaman, group 1. Sit here')
  await expect(page.getByTestId('buff-toggle-strength-of-earth-totem')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('region', { name: 'Paladin Blessings' })).toContainText('No Paladin in this raid, so no Blessings.')
})

test('the raid and the seat are kept across a visit to another planner tab, and the buffs reach the stat bar', async ({ page }) => {
  await openBuffs(page)
  const ap = async () => {
    const row = page.getByTestId('stat-attack-power')
    if (!(await row.isVisible())) await page.getByTestId('stat-bar-toggle').click()
    return Number((await row.locator('.stat-value').innerText()).replace(/\D/g, ''))
  }
  const unbuffed = await ap()
  await source(page, 'ex25').click()
  expect(await ap(), 'Battle Shout, Might and the rest reach the attack power on the stat bar').toBeGreaterThan(unbuffed)
  await page.getByTestId('buffs-seat-0-0').click()
  await view(page, 'Gear')
  await view(page, 'Buffs')
  await expect(source(page, 'ex25')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('buffs-seat-0-0')).toHaveAccessibleName('You, Fury Warrior')
})

test('a healer gets the Blessings a healer uses: Kings, then Wisdom', async ({ page }) => {
  await openBuffs(page)
  await (await characterField(page, 'Class')).selectOption('Priest')
  await (await characterField(page, 'Specialization')).selectOption('Holy')
  await view(page, 'Buffs')
  await source(page, 'ex25').click()
  await expect(page.getByTestId('pal-0-blessing-of-kings')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('pal-1-blessing-of-wisdom')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('buff-toggle-arcane-intellect')).toHaveAttribute('aria-pressed', 'true')
  // A melee buff is not a healer's, so it is not listed.
  await expect(page.getByTestId('buff-toggle-battle-shout')).toHaveCount(0)
})

test('on a phone: nothing past the edge, and every Buffs control is at least 44px', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 860 })
  await openBuffs(page)
  await source(page, 'ex25').click()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBe(0)
  // 43.5, not 44: a 44px control can measure a hair short under load, from subpixel layout.
  const short = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('[data-testid="buffs-panel"] button')]
      .filter((element) => element.offsetParent && element.getBoundingClientRect().height < 43.5)
      .map((element) => `${(element.getAttribute('aria-label') ?? element.textContent ?? '').trim().slice(0, 24)} ${Math.round(element.getBoundingClientRect().height)}`),
  )
  expect(short).toEqual([])
})
