import { expect, test, type Page } from '@playwright/test'
import type { TbcClass } from '../src/domain/character/characterTypes'
import { racesByClass } from '../src/domain/character/races'
import { getRoleForSpec, tbcClasses } from '../src/domain/character/tbcClasses'
import { defaultGear } from '../src/domain/gear/defaultGear'
import { hitCapFor } from '../src/domain/simulation/hitCap'
import { defaultSimulationTarget } from '../src/domain/simulation/sampleEncounters'
import { getTalentData } from '../src/domain/talents/sampleTalents'
import { unmodelledTalents } from '../src/domain/talents/talentModifiers'
import { pointsSpent } from '../src/domain/talents/talentTypes'
import {
  hintedTalents,
  raiseTalent,
  talentPresetCount,
  talentPresetFor,
  talentProblems,
  talentSplit,
} from '../src/domain/talents/talentWindow'
import { talentSimStatus } from '../src/features/talents/talentWords'

/*
 * The Character Planner's Talents tab as decided on 2026-10-09 and ported in step 6 of
 * docs/design/PORT-PLAN.md: design A, the game's talent window, with design C's "What's off". These
 * are the prototype's hands-on check (`checks/talents-handson.mjs`, run as `p`) on the app's own data,
 * with its real numbers: the stored wowsims Fury preset is 9 / 39 / 0, 48 of 61 points, and breaks 3
 * rules (Flurry without Enrage, Arms rows 3-4 and Fury rows 6-9 short of points); Enrage 5/5 fixes 2
 * of them. Precision 3/3 puts the special-attack hit cap at 95 rating, 2/3 at 111, and the recommended
 * set has 140 hit.
 *
 * As the owner decided (2026-10-19), the tab opens untalented, since the app starts clean, and the
 * preset is a button where wowsims has one.
 */

const warrior = getTalentData('Warrior')!
const [arms, fury, protection] = warrior.trees
const named = (name: string) => warrior.trees.flatMap((tree) => tree.talents).find((talent) => talent.name === name)!
const furyPreset = talentPresetFor('Warrior', 'Fury')!

async function openTalents(page: Page, { dressed = true } = {}) {
  await page.goto('/')
  await page.getByTestId('section-planner').click()
  for (let step = 0; step < 3; step++) await page.getByTestId('creator-next').click()
  await page.getByTestId('creator-confirm').click()
  if (dressed) await page.getByTestId('equip-recommended').click()
  await view(page, 'Talents')
}

const view = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Planner sections' }).getByRole('button', { name, exact: true }).click()
const talent = (page: Page, name: string) => page.getByTestId(`talent-${named(name).id}`)
const message = (page: Page) => page.getByTestId('talents-message')
const off = (page: Page) => page.getByTestId('talents-off')
const left = (page: Page) => page.getByTestId('talent-points-remaining')
const split = (page: Page) => page.getByTestId('talent-split')
const hitLine = (page: Page) => page.getByTestId('talents-hit-line')
/** A talent's rank, from its accessible name ("Enrage, 5 of 5"). */
const rankOf = async (page: Page, name: string) => Number((await talent(page, name).getAttribute('aria-label'))!.match(/, (\d+) of \d+/)![1])

async function characterField(page: Page, label: 'Race' | 'Class' | 'Specialization') {
  if (!(await page.getByTestId('character-fields').isVisible())) await page.getByTestId('character-edit').click()
  // Within the character's fields: a talent's name is its label too, and "Race" is in Nature's Grace.
  return page.getByTestId('character-fields').getByLabel(label)
}

async function loadFury(page: Page) {
  await page.getByTestId('talents-preset').click()
  await expect(left(page)).toHaveText('13')
}

test('the stored Fury preset is 9 / 39 / 0 and breaks 3 rules; Enrage 5/5 fixes 2', () => {
  expect(talentSplit(warrior.trees, furyPreset.points)).toBe('9 / 39 / 0')
  expect(pointsSpent(warrior.trees, furyPreset.points)).toBe(48)
  expect(furyPreset.source).toBe('sim/warrior/dps/presets.go:FuryTalents')

  const problems = talentProblems(warrior.trees, furyPreset.points)
  expect(problems.map((problem) => problem.text)).toEqual([
    'Flurry needs Enrage at 5/5; it has 0.',
    'Arms is 8 points short in rows 1–2: Anger Management, Deep Wounds and Impale sit in rows 3–4, which need more points above.',
    'Fury is 2 points short in rows 1–5: Flurry, Precision, Bloodthirst, Improved Whirlwind, Improved Berserker Stance and Rampage sit in rows 6–9, which need more points above.',
  ])
  expect(problems[0].kind === 'prerequisite' && problems[0].fix).toEqual({ talentId: named('Enrage').id, rank: 5, label: 'Add Enrage to 5/5' })

  const fixed = raiseTalent(warrior.trees, named('Enrage').id, 5, furyPreset.points)
  expect(fixed.added).toBe(5)
  expect(talentProblems(warrior.trees, fixed.points).map((problem) => problem.kind)).toEqual(['rows'])

  // "Show where" lights Arms talents in rows 1-2 that can take a point now.
  const lit = hintedTalents(warrior.trees, fixed.points, { tree: 'Arms', upTo: 2 })
  expect(lit.size).toBeGreaterThan(0)
  for (const id of lit) expect(arms.talents.find((entry) => entry.id === id)!.row).toBeLessThan(2)
})

test('every preset belongs to its class and spec; the 10 specs without one say so', () => {
  expect(talentPresetCount).toBe(17)
  const withPreset: string[] = []
  for (const { className, specs } of tbcClasses) {
    for (const spec of specs) {
      const preset = talentPresetFor(className, spec)
      if (!preset) continue
      withPreset.push(`${spec} ${className}`)
      const trees = getTalentData(className)!.trees
      const ids = new Set(trees.flatMap((tree) => tree.talents.map((entry) => entry.id)))
      for (const id of Object.keys(preset.points)) expect(ids.has(Number(id)), `${spec} ${className}'s preset names talent ${id}`).toBe(true)
    }
  }
  expect(withPreset).toHaveLength(17)
  expect(withPreset).not.toContain('Marksmanship Hunter')
  expect(withPreset).not.toContain('Holy Priest')
})

test('Precision moves the hit cap: 3/3 → 95, 2/3 → 111', () => {
  const character = { faction: 'Alliance', race: racesByClass.Warrior[0], className: 'Warrior', spec: 'Fury' } as const
  const cap = (precision: number) =>
    hitCapFor({
      character,
      role: getRoleForSpec('Warrior', 'Fury'),
      gear: defaultGear,
      talentPoints: precision ? { [named('Precision').id]: precision } : {},
      activeBuffIds: [],
      activeTargetDebuffIds: [],
      target: defaultSimulationTarget,
    })!.cap
  expect([cap(0), cap(2), cap(3)]).toEqual([142, 111, 95])
})

test('the tooltip says what the simulator reads, in plain words, for every class', () => {
  expect(talentSimStatus('Warrior', named('Flurry'), 4).text).toBe('In the simulation: +20% attack speed for 3 swings after a crit')
  expect(talentSimStatus('Warrior', named('Enrage'), 0).text).toMatch(/^Not simulated: It triggers when you take a crit/)
  expect(talentSimStatus('Warrior', named('Bloodthirst'), 1).text).toBe("Its ability is in the simulated Fury rotation; the talent point itself isn't read.")
  expect(talentSimStatus('Warrior', named('Mace Specialization'), 0).kind).toBe('skip')
  expect(talentSimStatus('Warrior', named('Booming Voice'), 0).kind).toBe('none')

  const find = (className: 'Mage' | 'Shaman', name: string) =>
    getTalentData(className)!.trees.flatMap((tree) => tree.talents).find((entry) => entry.name === name)!
  // Once filed under labels no talent has ("Empowered Fireball / Frostbolt", "Winters Chill").
  expect(talentSimStatus('Mage', find('Mage', 'Empowered Frostbolt'), 0).kind).toBe('skip')
  expect(talentSimStatus('Mage', find('Mage', "Winter's Chill"), 0).kind).toBe('skip')
  // Stormstrike's Nature debuff is skipped, but its strike is in Enhancement's rotation.
  expect(talentSimStatus('Shaman', find('Shaman', 'Stormstrike'), 1).kind).toBe('ability')

  // Every skipped talent says why in plain words, not the ingest's note for developers: a label the
  // plain words' keys no longer match would fall back to that note.
  for (const entry of unmodelledTalents) {
    for (const { talentId } of entry.talents) {
      const talent = getTalentData(entry.className)!.trees.flatMap((tree) => tree.talents).find((each) => each.id === talentId)!
      const status = talentSimStatus(entry.className as TbcClass, talent, 0)
      if (status.kind === 'skip') expect(status.text, `${entry.className} ${talent.name}`).not.toContain(entry.reason)
    }
  }

  for (const { className } of tbcClasses) {
    for (const tree of getTalentData(className)!.trees) {
      for (const entry of tree.talents) expect(talentSimStatus(className, entry, 1).text, `${className} ${entry.name}`).not.toBe('')
    }
  }
})

test('opens untalented with real icons, and the Fury preset loads as stored with its 3 broken rules', async ({ page }) => {
  await openTalents(page)
  await expect(left(page)).toHaveText('61')
  await expect(split(page)).toHaveText('0 / 0 / 0')
  await expect(off(page)).toContainText('Every rule holds; 61 points are unspent.')
  expect(arms.talents.length + fury.talents.length + protection.talents.length).toBe(66)
  await expect(page.locator('.talent')).toHaveCount(66)
  for (const spec of ['Arms', 'Fury', 'Protection']) await expect(page.getByRole('region', { name: `${spec} talents` })).toBeVisible()
  const icon = talent(page, 'Bloodthirst').locator('img.talent-icon')
  await expect.poll(() => icon.evaluate((node) => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0)).toBe(true)

  await loadFury(page)
  await expect(split(page)).toHaveText('9 / 39 / 0')
  await expect(message(page)).toHaveText('Loaded the Fury preset as stored: 9 / 39 / 0, 48 of 61 points. It breaks 3 rules, shown below.')
  await expect(page.getByTestId('talent-tree-points-fury')).toHaveText('39')
  await expect(off(page)).toContainText("This build breaks 3 of the game's rules and leaves 13 points unspent.")
  await expect(off(page)).toContainText('Flurry needs Enrage at 5/5; it has 0.')
  await expect(talent(page, 'Flurry')).toHaveClass(/is-broken-prerequisite/)
  await expect(talent(page, 'Flurry')).toHaveAttribute('aria-label', 'Flurry, 5 of 5, missing its prerequisite')
  await expect(talent(page, 'Rampage')).toHaveClass(/is-broken-row/)
  // The preset's first broken prerequisite is the talent shown under the frame.
  await expect(page.getByTestId('talent-selected')).toContainText('Flurry')
  await expect(page.getByTestId('talent-selected')).toContainText('Requires 5 points in Enrage')
})

test('the hit cap follows Precision: 140 / 95 at 3/3, 111 at 2/3, and the Gear tab agrees', async ({ page }) => {
  await openTalents(page)
  await expect(hitLine(page)).toContainText('Hit 140 / 142, 2 under the cap')
  await loadFury(page)
  await expect(hitLine(page)).toContainText('Hit 140 / 95, 45 over the cap.')
  await expect(hitLine(page)).toContainText('3% from Precision')

  await talent(page, 'Precision').click({ button: 'right' })
  await expect(talent(page, 'Precision')).toHaveAttribute('aria-label', /^Precision, 2 of 3/)
  await expect(hitLine(page)).toContainText('Hit 140 / 111, 29 over the cap.')
  await talent(page, 'Precision').click()
  await expect(hitLine(page)).toContainText('Hit 140 / 95')

  await view(page, 'Gear')
  await expect(page.getByTestId('gear-hit')).toHaveText('140 / 95')
})

test('a locked talent refuses a point and says why; click learns and right-click unlearns', async ({ page }) => {
  await openTalents(page)
  await loadFury(page)

  await talent(page, 'Last Stand').click()
  await expect(message(page)).toHaveText('Can\'t learn Last Stand: Needs 10 points in Protection — you have 0.')
  expect(await rankOf(page, 'Last Stand')).toBe(0)
  await expect(talent(page, 'Last Stand')).toHaveClass(/is-locked/)

  await talent(page, 'Booming Voice').click()
  expect(await rankOf(page, 'Booming Voice')).toBe(1)
  await expect(left(page)).toHaveText('12')
  await expect(message(page)).toHaveText('Booming Voice 1/5. 12 of 61 points left.')
  await talent(page, 'Booming Voice').click({ button: 'right' })
  expect(await rankOf(page, 'Booming Voice')).toBe(0)
  await expect(left(page)).toHaveText('13')

  // Not out from under a talent that needs it.
  await talent(page, 'Sweeping Strikes').click({ button: 'right' })
  await expect(message(page)).toHaveText("Can't unlearn Sweeping Strikes: Bloodthirst needs Sweeping Strikes at 1/1.")
  expect(await rankOf(page, 'Sweeping Strikes')).toBe(1)

  await page.getByTestId('talents-reset').click()
  await expect(left(page)).toHaveText('61')
  await expect(message(page)).toHaveText('Reset: all 61 points are free.')
  await expect(page.getByTestId('talents-reset')).toBeDisabled()
})

test('keyboard: one tab stop per tree, Enter learns, minus unlearns, arrows move, Home and End', async ({ page }) => {
  await openTalents(page)
  await loadFury(page)
  await expect(page.locator('.talent[tabindex="0"]')).toHaveCount(3)

  await talent(page, 'Booming Voice').focus()
  await page.keyboard.press('Enter')
  expect(await rankOf(page, 'Booming Voice')).toBe(1)
  await page.keyboard.press('-')
  expect(await rankOf(page, 'Booming Voice')).toBe(0)
  await page.keyboard.press('+')
  expect(await rankOf(page, 'Booming Voice')).toBe(1)
  await page.keyboard.press('Backspace')
  expect(await rankOf(page, 'Booming Voice')).toBe(0)

  await page.keyboard.press('ArrowRight')
  await expect(talent(page, 'Cruelty')).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(talent(page, 'Unbridled Wrath')).toBeFocused()
  await page.keyboard.press('End')
  await expect(talent(page, 'Rampage')).toBeFocused()
  await page.keyboard.press('Home')
  await expect(talent(page, 'Booming Voice')).toBeFocused()
  // Focus chooses the talent under the frame, so − and + act on it.
  await expect(page.getByTestId('talent-selected')).toContainText('Booming Voice')
  await expect(page.locator('.talent[tabindex="0"]')).toHaveCount(3)
})

test('the − and + under the frame learn and unlearn without a right-click', async ({ page }) => {
  await openTalents(page)
  await loadFury(page)
  await talent(page, 'Booming Voice').click()
  await expect(page.getByTestId('talent-selected')).toContainText('Booming Voice')
  await page.getByTestId('talent-step-down').click()
  expect(await rankOf(page, 'Booming Voice')).toBe(0)
  await expect(page.getByTestId('talent-step-down')).toBeDisabled()
  await page.getByTestId('talent-step-up').click()
  expect(await rankOf(page, 'Booming Voice')).toBe(1)
  await expect(page.getByRole('button', { name: 'Unlearn a point of Booming Voice' })).toBeEnabled()
})

test("What's off: Enrage 5/5 fixes two rules, Show where lights Arms, and Hide clears it", async ({ page }) => {
  await openTalents(page)
  await loadFury(page)

  await off(page).getByRole('button', { name: 'Add Enrage to 5/5' }).click()
  await expect(message(page)).toHaveText('Added 5 points to Enrage (5/5): that fixed 2 problems.')
  expect(await rankOf(page, 'Enrage')).toBe(5)
  await expect(talent(page, 'Flurry')).not.toHaveClass(/is-broken/)
  // The fix button is gone, so focus goes to the talent it raised.
  await expect(talent(page, 'Enrage')).toBeFocused()
  await expect(off(page)).toContainText("This build breaks 1 of the game's rules and leaves 8 points unspent.")
  await expect(off(page)).toContainText('Arms is 8 points short in rows 1–2')

  await off(page).getByRole('button', { name: 'Show where' }).click()
  const lit = page.locator('.talent.is-hint')
  expect(await lit.count()).toBeGreaterThan(0)
  await expect(message(page)).toContainText('Arms talents glowing: each can take a point that counts toward the rows below.')
  await expect(off(page).getByRole('button', { name: 'Hide' })).toHaveAttribute('aria-pressed', 'true')
  await off(page).getByRole('button', { name: 'Hide' }).click()
  await expect(lit).toHaveCount(0)
  await expect(message(page)).toHaveText('Highlight off.')
})

test("tooltips read like the game's: the chosen talent under the frame, and one on hover", async ({ page }) => {
  await openTalents(page)
  await loadFury(page)
  await off(page).getByRole('button', { name: 'Add Enrage to 5/5' }).click()

  await talent(page, 'Flurry').click({ button: 'right' })
  const chosen = page.getByTestId('talent-selected')
  await expect(chosen).toContainText('Rank 4/5')
  await expect(chosen).toContainText('Next rank:')
  await expect(chosen).toContainText('In the simulation: +20% attack speed for 3 swings after a crit')
  await talent(page, 'Flurry').click()

  await talent(page, 'Rampage').hover()
  const tip = page.getByTestId('talent-tip')
  await expect(tip).toBeVisible()
  await expect(tip).toContainText('Rampage')
  await expect(tip).toContainText('Not simulated:')
  await expect(tip).toContainText('Click to learn · right-click to unlearn')
  const box = await tip.boundingBox()
  expect(box!.x >= 0 && box!.y >= 0 && box!.x + box!.width <= 1280, 'the tip is on screen').toBe(true)
})

test('the build, the chosen talent and the sources line stay across tabs', async ({ page }) => {
  await openTalents(page)
  await loadFury(page)
  await talent(page, 'Precision').click({ button: 'right' })
  const sources = page.getByTestId('provenance')
  await expect(sources).toContainText("Wowhead's TBC talent calculator")
  await expect(sources.getByRole('link', { name: /wowsims\/tbc/ })).toHaveAttribute('href', /github\.com\/wowsims\/tbc/)

  await view(page, 'Gear')
  await expect(page.getByTestId('gear-hit')).toHaveText('140 / 111')
  await view(page, 'Talents')
  expect(await rankOf(page, 'Precision')).toBe(2)
  await expect(page.getByTestId('talent-selected')).toContainText('Precision')
})

test('every class and spec: three trees, and the preset button or a note that there is none', async ({ page }) => {
  await openTalents(page, { dressed: false })
  for (const { className, specs } of tbcClasses) {
    await (await characterField(page, 'Race')).selectOption(racesByClass[className][0])
    await (await characterField(page, 'Class')).selectOption(className)
    const trees = getTalentData(className)!.trees
    for (const spec of specs) {
      await (await characterField(page, 'Specialization')).selectOption(spec)
      for (const tree of trees) await expect(page.getByRole('region', { name: `${tree.spec} talents` })).toBeVisible()
      await expect(left(page)).toHaveText('61')
      if (talentPresetFor(className, spec)) {
        await expect(page.getByTestId('talents-preset')).toHaveText(`Load the ${spec} preset`)
        await expect(page.getByTestId('talents-no-preset')).toHaveCount(0)
      } else {
        await expect(page.getByTestId('talents-preset')).toHaveCount(0)
        await expect(page.getByTestId('talents-no-preset')).toHaveText(`wowsims has no preset for ${spec} ${className}s, so there is none to load here.`)
      }
      // A healer has no hit cap to show.
      await expect(hitLine(page)).toHaveCount(getRoleForSpec(className, spec) === 'Healer' ? 0 : 1)
    }
  }
})

test("a preset's arrows run across a row and round an elbow, and a Shadow Priest's preset loads", async ({ page }) => {
  await openTalents(page, { dressed: false })
  await (await characterField(page, 'Class')).selectOption('Paladin')
  // Holy Shield sits beside Improved Holy Shield, to its right.
  await expect(page.getByRole('region', { name: 'Protection talents' }).locator('.talent-arrow.is-left')).toHaveCount(1)

  await (await characterField(page, 'Race')).selectOption(racesByClass.Rogue[0])
  await (await characterField(page, 'Class')).selectOption('Rogue')
  // Serrated Blades is up and to the left of Hemorrhage: across its row, then down.
  const subtlety = page.getByRole('region', { name: 'Subtlety talents' })
  await expect(subtlety.locator('.talent-arrow.is-right.is-elbow')).toHaveCount(1)

  await (await characterField(page, 'Race')).selectOption(racesByClass.Priest[0])
  await (await characterField(page, 'Class')).selectOption('Priest')
  await (await characterField(page, 'Specialization')).selectOption('Shadow')
  const shadow = talentPresetFor('Priest', 'Shadow')!
  const priest = getTalentData('Priest')!.trees
  await page.getByTestId('talents-preset').click()
  await expect(split(page)).toHaveText(talentSplit(priest, shadow.points))
  await expect(off(page)).toContainText(`This build breaks ${talentProblems(priest, shadow.points).length} of the game's rules`)
})

test('on a phone: one tree at a time with tree tabs, nothing past the edge, 44px controls', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 860 })
  await openTalents(page)
  await loadFury(page)

  const tabs = page.getByRole('group', { name: 'Talent tree' })
  await expect(tabs).toBeVisible()
  await expect(page.getByRole('region', { name: 'Fury talents' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Arms talents' })).toBeHidden()
  await page.getByTestId('talent-tree-tab-protection').click()
  await expect(page.getByRole('region', { name: 'Protection talents' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Fury talents' })).toBeHidden()
  await expect(message(page)).toHaveText('Protection tree shown.')

  // "Show where" brings its tree up.
  await off(page).getByRole('button', { name: 'Add Enrage to 5/5' }).click()
  await off(page).getByRole('button', { name: 'Show where' }).click()
  await expect(page.getByRole('region', { name: 'Arms talents' })).toBeVisible()

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow, 'nothing past the edge').toBeLessThanOrEqual(0)
  // 43.5, not 44: a 44px control can measure a hair short under load, from subpixel layout.
  const short = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.talents-panel button')]
      .filter((element) => element.offsetParent && element.getBoundingClientRect().height < 43.5)
      .map((element) => `${element.getAttribute('aria-label') ?? element.textContent} ${Math.round(element.getBoundingClientRect().height)}`),
  )
  expect(short).toEqual([])
})
