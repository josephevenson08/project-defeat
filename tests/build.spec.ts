import { expect, test, type Page } from '@playwright/test'
import exampleExport from '../addon/verify/fixture-export.json' with { type: 'json' }
import { parseAddonExport } from '../src/domain/builds/addonImport'
import { summarizeBuild } from '../src/features/builds/buildSummary'

/*
 * The Character Planner's Build tab as decided on 2026-10-10 and ported in step 6 of
 * docs/design/PORT-PLAN.md: design A, the share card (the build first, then its link, named saves and
 * one box to load a link, build text or the addon's export), with design C's "What came in" report on
 * the box. These are the prototype's hands-on check (`checks/build-handson.mjs`) on the app's own data:
 * the card shows the build; the link is always the build on screen and reads back clean; a broken paste
 * changes nothing; reading a paste changes nothing until "Load into the planner"; an export with no
 * talents asks which spec and waits; named saves load back.
 */

async function openBuild(page: Page, { dressed = true } = {}) {
  await page.goto('/')
  await page.getByTestId('section-planner').click()
  for (let step = 0; step < 3; step++) await page.getByTestId('creator-next').click()
  await page.getByTestId('creator-confirm').click()
  if (dressed) await page.getByTestId('equip-recommended').click()
  await page.getByRole('navigation', { name: 'Planner sections' }).getByRole('button', { name: 'Build', exact: true }).click()
}

const view = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Planner sections' }).getByRole('button', { name, exact: true }).click()

test('the example export reads as an Orc Fury Warrior wearing all 17 slots, cleanly', () => {
  const result = parseAddonExport(JSON.stringify(exampleExport))
  expect(result.ok).toBe(true)
  if (!result.ok) return
  expect(result.issues, 'the example is clean').toEqual([])
  const summary = summarizeBuild(result.build)
  expect(summary.title).toBe('Orc Fury Warrior')
  expect(summary.filled).toBe(17)
  expect(summary.slots).toHaveLength(17)
  expect(summary.talentSplit).toEqual([21, 40, 0])
})

test('the card shows the build on screen, and the link is that build, always', async ({ page }) => {
  await openBuild(page)
  const card = page.getByTestId('build-card')
  await expect(card).toContainText('Human Fury Warrior')
  await expect(card).toContainText('17 of 17 slots')
  await expect(card).toContainText(/item level \d+/)
  await expect(card).toContainText('talents 0 / 0 / 0')
  await expect(card).toContainText('0 buffs · 0 consumables')
  await expect(card.locator('.build-card-icons .loot-icon')).toHaveCount(17)

  const link = page.getByTestId('build-share-link')
  await expect(link).toHaveValue(/#build=/)

  // Pasting the link back reads it as a link, cleanly, and changes nothing yet.
  const url = await link.inputValue()
  await page.getByTestId('build-import-input').fill(url)
  await page.getByTestId('build-import-button').click()
  const report = page.getByTestId('build-report')
  await expect(report).toContainText('Read from a build link: Human Fury Warrior, 17 of 17 slots worn')
  await expect(report).toContainText('Everything resolved cleanly. Nothing has changed yet.')
  await expect(report.getByRole('list', { name: 'Gear that came in' }).getByRole('listitem')).toHaveCount(17)
})

test('a broken paste changes nothing and says so, and so does another format’s version', async ({ page }) => {
  await openBuild(page)
  await page.getByTestId('build-import-input').fill('{"version": 1, "character": ')
  await page.getByTestId('build-import-button').click()
  await expect(page.getByTestId('build-status')).toContainText('Nothing was changed')
  await expect(page.getByTestId('build-report')).toHaveCount(0)
  await expect(page.getByTestId('build-card')).toContainText('Human Fury Warrior')
})

test('reading the example export changes nothing; loading it wears it, and the buffs stay', async ({ page }) => {
  await openBuild(page, { dressed: false })
  await view(page, 'Buffs')
  await page.getByTestId('buff-toggle-battle-shout').check()
  await view(page, 'Build')
  const buffsBefore = await page.getByTestId('build-card').locator('li', { hasText: 'consumable' }).innerText()
  expect(buffsBefore).toBe('1 buff · 0 consumables')

  await page.getByTestId('build-import-example').click()
  await page.getByTestId('build-import-button').click()
  const report = page.getByTestId('build-report')
  await expect(report).toContainText("Read from the addon's export: Orc Fury Warrior, 17 of 17 slots worn, talents 21 / 40 / 0.")
  await expect(report).toContainText("the Buffs tab keeps its own")
  // Nothing has changed yet: the card still shows the bare Human.
  await expect(page.getByTestId('build-card')).toContainText('Human Fury Warrior')
  await expect(page.getByTestId('build-card')).toContainText('0 of 17 slots')

  await page.getByTestId('build-import-load').click()
  await expect(page.getByTestId('build-status')).toContainText('Build loaded: 17 of 17 slots and the talents')
  await expect(page.getByTestId('build-card')).toContainText('Orc Fury Warrior')
  await expect(page.getByTestId('build-card')).toContainText('talents 21 / 40 / 0')
  await expect(page.getByTestId('build-card').locator('li', { hasText: 'consumable' })).toHaveText(buffsBefore)
  await expect(page.getByTestId('character-name')).toHaveText('Orc Fury Warrior')
})

test('an export with no talents asks which spec, and waits for the answer', async ({ page }) => {
  await openBuild(page)
  await page.getByTestId('build-import-input').fill(JSON.stringify({ ...exampleExport, talents: [] }))
  await page.getByTestId('build-import-button').click()

  const choice = page.getByTestId('build-spec-choice')
  await expect(choice).toContainText('spent no talent points')
  await expect(choice.getByRole('button')).toHaveCount(3)
  await expect(page.getByTestId('build-import-load'), 'waits for the answer').toBeDisabled()

  await page.getByTestId('build-spec-arms').click()
  await expect(page.getByTestId('build-report')).toContainText('Orc Arms Warrior')
  await page.getByTestId('build-import-load').click()
  await expect(page.getByTestId('character-name')).toHaveText('Orc Arms Warrior')
})

test('a named save keeps the build, with its facts, and loads it back', async ({ page }) => {
  await openBuild(page)
  await page.getByTestId('build-slot-name').fill('Fury BiS')
  await page.getByTestId('build-slot-save').click()
  await expect(page.getByTestId('build-status')).toContainText('Saved as “Fury BiS” in this browser')
  await expect(page.getByTestId('build-slot-list')).toContainText('Human Fury Warrior · 17 of 17 slots · item level')

  // Change the character, then load the save back.
  await page.getByTestId('build-import-example').click()
  await page.getByTestId('build-import-button').click()
  await page.getByTestId('build-import-load').click()
  await expect(page.getByTestId('character-name')).toHaveText('Orc Fury Warrior')
  await page.getByTestId('build-slot-load-Fury BiS').click()
  await expect(page.getByTestId('character-name')).toHaveText('Human Fury Warrior')
})

test('on a phone: no sideways scroll, and every Build control is 44px', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 860 })
  await openBuild(page)
  await page.getByTestId('build-import-example').click()
  await page.getByTestId('build-import-button').click()
  await expect(page.getByTestId('build-report')).toBeVisible()

  const moved = await page.evaluate(() => {
    const y = scrollY
    scrollTo(60, y)
    const x = scrollX
    scrollTo(0, y)
    return x
  })
  expect(moved, 'scrolls sideways').toBe(0)

  const small = await page.evaluate(() =>
    [...document.querySelectorAll('.build-panel-shell button, .build-panel-shell input, .build-panel-shell textarea, .build-panel-shell summary')]
      .filter((element) => (element as HTMLElement).offsetParent && element.getBoundingClientRect().height < 44)
      .map((element) => `${(element.textContent?.trim() || element.getAttribute('aria-label') || element.tagName).slice(0, 24)} ${Math.round(element.getBoundingClientRect().height)}`),
  )
  expect(small, 'controls under 44px').toEqual([])
})
