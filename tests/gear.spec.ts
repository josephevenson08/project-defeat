import { expect, test, type Page } from '@playwright/test'
import { bisLists, checklistTotals, gearChecklist, rankedListsFor } from '../src/domain/bis'
import { racesByClass } from '../src/domain/character/races'
import { getRoleForSpec } from '../src/domain/character/tbcClasses'
import { dropIllegalEnchants } from '../src/domain/enchants/sampleEnchants'
import { normalizeGearForCharacter } from '../src/domain/gear/characterItemRules'
import { sumGearStats } from '../src/domain/gear/gearStats'
import { emptyGear } from '../src/domain/gear/slotCompatibility'
import { getVisibleGearSlotsForSpec } from '../src/domain/gear/slotVisibility'
import { computeBaseMissChance, computeSkillDiff } from '../src/domain/simulation/attackTable'
import { RATING_PER_PERCENT } from '../src/domain/simulation/combatConstants'
import { hitCapFor } from '../src/domain/simulation/hitCap'
import { defaultSimulationTarget } from '../src/domain/simulation/sampleEncounters'
import { getTalentData } from '../src/domain/talents/sampleTalents'
import { buildRecommendedSet } from '../src/features/gear/equipRecommendedSet'

/*
 * The Character Planner's Gear tab as decided on 2026-10-09 and ported in step 6 of
 * docs/design/PORT-PLAN.md: design B's character sheet, with design C's checklist behind a switch as
 * "What's left". These are the prototype's hands-on check (`checks/gear-handson.mjs`, run as `p`) on
 * the app's own data, with its real numbers: Destroyer Battle-Helm has 21 hit, Furious Gizmatic
 * Goggles 13, Glyph of Ferocity 16, and the recommended set totals 140 for a Fury Warrior. The slot
 * pane is the app's (the owner's call, 2026-10-19), so a swap there comes without gems or an enchant
 * and the checklist's fixes put the guide's back; the prototype's part-geared example is not ported.
 *
 * The hit cap is the simulator's own: the special-attack miss chance against a level 73 boss from
 * `attackTable.ts` (9%, with TBC's 1% hit suppression), at 15.8 rating a percent to the nearest point,
 * less 1% a rank of Precision, Heroic Presence and Improved Faerie Fire: 142 untalented and 95 with
 * Precision 3/3, the prototype's numbers.
 */

/** The special-attack miss chance against the boss, in percent, as the attack table has it. */
const SPECIAL_MISS = Math.round(computeBaseMissChance(computeSkillDiff(73)) * 1e4) / 100
const capFor = (percent: number) => Math.round(percent * RATING_PER_PERCENT.meleeHit)
const CAP = {
  untalented: capFor(SPECIAL_MISS),
  precision: capFor(SPECIAL_MISS - 3),
  precisionAndFaerieFire: capFor(SPECIAL_MISS - 6),
  draenei: capFor(SPECIAL_MISS - 1),
}
/** "2 under the cap", "45 over the cap", as the sheet says it. */
const standing = (hit: number, cap: number) => (hit > cap ? `${hit - cap} over the cap` : hit < cap ? `${cap - hit} under the cap` : 'at the cap')

async function openGear(page: Page, { dressed = true } = {}) {
  await page.goto('/')
  await page.getByTestId('section-planner').click()
  for (let step = 0; step < 3; step++) await page.getByTestId('creator-next').click()
  await page.getByTestId('creator-confirm').click()
  if (dressed) await page.getByTestId('equip-recommended').click()
}

const view = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Planner sections' }).getByRole('button', { name, exact: true }).click()
const slot = (page: Page, name: string) => page.getByRole('button', { name: `${name} slot`, exact: true })
const hit = (page: Page) => page.getByTestId('gear-hit')
const message = (page: Page) => page.getByTestId('gear-message')

async function characterField(page: Page, label: 'Faction' | 'Race' | 'Class' | 'Specialization') {
  if (!(await page.getByTestId('character-fields').isVisible())) await page.getByTestId('character-edit').click()
  return page.getByLabel(label)
}

/** Fury points down to Precision 3/3, a rank a click, in row order as the trees require. */
async function spendFuryToPrecision(page: Page) {
  const fury = getTalentData('Warrior')!.trees.find((tree) => tree.spec === 'Fury')!
  const ranks: [string, number][] = [
    ['Cruelty', 5],
    ['Unbridled Wrath', 5],
    ['Commanding Presence', 5],
    ['Enrage', 5],
    ['Dual Wield Specialization', 5],
    ['Weapon Mastery', 2],
    ['Improved Slam', 2],
    ['Flurry', 5],
    ['Precision', 3],
  ]
  await view(page, 'Talents')
  for (const [name, rank] of ranks) {
    const talent = fury.talents.find((entry) => entry.name === name)!
    for (let n = 0; n < rank; n++) await page.getByTestId(`talent-${talent.id}`).click()
  }
  await view(page, 'Gear')
}

test("every spec: the recommended set's checklist, and the hit cap its role uses", () => {
  // The prototype's caps: 9% against a level 73 boss is 142 rating, 95 with Precision 3/3.
  expect(SPECIAL_MISS).toBe(9)
  expect(CAP).toEqual({ untalented: 142, precision: 95, precisionAndFaerieFire: 47, draenei: 126 })

  for (const list of bisLists) {
    const character = { faction: 'Alliance' as const, race: racesByClass[list.className][0], className: list.className, spec: list.spec }
    const set = buildRecommendedSet(character, normalizeGearForCharacter(emptyGear, list.className, list.spec))!
    const gear = dropIllegalEnchants(set.gear, character)
    const slots = getVisibleGearSlotsForSpec(list.className, list.spec)
    const checks = gearChecklist(character, slots, gear, rankedListsFor(list))
    const totals = checklistTotals(checks)
    const name = `${list.spec} ${list.className}`

    // Each slot the guide ranks holds its best item, with every socket filled.
    expect(totals.best, name).toBe(totals.ranked)
    expect(totals.filled, name).toBe(totals.sockets)
    /*
     * And nothing is left. Hunters had one to-do here until the lists hung the guide's advice on each
     * slot's rank 1 after the ranks were made dense rather than before: their off hand (Claw of the
     * Phoenix, #2 in the guide's weapons table) came unenchanted and this offered the guide's Agility.
     */
    const left = checks.filter((check) => check.todo).map((check) => `${check.slot}${check.missingEnchant ? ' enchant' : ''}`)
    expect(left, name).toEqual([])

    const role = getRoleForSpec(list.className, list.spec)
    const cap = hitCapFor({ character, role, gear, talentPoints: {}, activeBuffIds: [], activeTargetDebuffIds: [], target: defaultSimulationTarget })
    if (role === 'Healer') expect(cap, name).toBeUndefined()
    else expect(cap?.kind, name).toBe(role === 'Caster DPS' ? 'spell' : list.className === 'Hunter' ? 'ranged' : 'special')
  }

  // Fury's numbers, as the prototype's: 17 of 17, 11 enchants, 10 sockets, 5 bonuses, 140 hit.
  const fury = bisLists.find((list) => list.className === 'Warrior' && list.spec === 'Fury')!
  const human = { faction: 'Alliance' as const, race: 'Human' as const, className: 'Warrior' as const, spec: 'Fury' as const }
  const gear = dropIllegalEnchants(buildRecommendedSet(human, normalizeGearForCharacter(emptyGear, 'Warrior', 'Fury'))!.gear, human)
  const totals = checklistTotals(gearChecklist(human, getVisibleGearSlotsForSpec('Warrior', 'Fury'), gear, rankedListsFor(fury)))
  expect(totals).toMatchObject({ best: 17, ranked: 17, enchanted: 11, enchantable: 11, filled: 10, sockets: 10, bonusesOn: 5, withBonus: 5, left: 0 })
  expect(sumGearStats(gear).hitRating).toBe(140)

  // A Protection Warrior's guide puts Solid Star of Elune in every socket, so its bonuses stay off by design, not as a to-do.
  const prot = bisLists.find((list) => list.className === 'Warrior' && list.spec === 'Protection')!
  const tank = { ...human, spec: 'Protection' as const }
  const tankGear = dropIllegalEnchants(buildRecommendedSet(tank, normalizeGearForCharacter(emptyGear, 'Warrior', 'Protection'))!.gear, tank)
  const tankChecks = gearChecklist(tank, getVisibleGearSlotsForSpec('Warrior', 'Protection'), tankGear, rankedListsFor(prot))
  expect(checklistTotals(tankChecks)).toMatchObject({ bonusesOn: 1, withBonus: 9, bonusesLeft: 0, left: 0 })
  expect(tankChecks.filter((check) => check.socketBonusOff)).toHaveLength(8)

  // Spells: 17% at level 73, down to the 1% floor, less Inspiring Presence for a Draenei Shaman: 15% at 12.6 a percent.
  const elemental = { faction: 'Alliance' as const, race: 'Draenei' as const, className: 'Shaman' as const, spec: 'Elemental' as const }
  const spell = hitCapFor({ character: elemental, role: 'Caster DPS', gear: emptyGear, talentPoints: {}, activeBuffIds: [], activeTargetDebuffIds: [], target: defaultSimulationTarget })
  expect(spell).toMatchObject({ kind: 'spell', missPercent: 16, leftPercent: 15, cap: 189 })
  expect(spell?.sources).toEqual([{ kind: 'race', name: 'Inspiring Presence', percent: 1 }])
  // Totem of Wrath's 3% spell hit comes off it too, and Improved Faerie Fire does not (melee and ranged only).
  const totem = hitCapFor({
    character: elemental,
    role: 'Caster DPS',
    gear: emptyGear,
    talentPoints: {},
    activeBuffIds: ['totem-of-wrath'],
    activeTargetDebuffIds: ['improved-faerie-fire'],
    target: defaultSimulationTarget,
  })
  expect(totem?.cap).toBe(Math.round(12 * RATING_PER_PERCENT.spellHit))
})

test('the sheet: 17 slots in the game\'s layout with real icons, the gear\'s stats and Hit 140', async ({ page }) => {
  await openGear(page)
  const sheet = page.getByTestId('gear-sheet')
  await expect(sheet).toBeVisible()
  await expect(sheet.getByRole('list', { name: 'Armour' }).locator('.gear-slot')).toHaveCount(6)
  await expect(sheet.locator('.gear-slot-cosmetic')).toHaveCount(2)
  await expect(sheet.getByRole('list', { name: 'Hands, waist, legs, feet, rings and trinkets' }).locator('.gear-slot')).toHaveCount(8)
  await expect(sheet.getByRole('list', { name: 'Weapons' }).locator('.gear-slot')).toHaveCount(3)

  // Real icons, loaded.
  const icons = sheet.locator('.gear-slot-icon img.item-icon')
  await expect(icons).toHaveCount(17)
  // 15 s rather than the default 5: with every worker loading icons at once, 17 of them can take longer.
  await expect
    .poll(() => icons.evaluateAll((nodes) => nodes.every((n) => (n as HTMLImageElement).complete && (n as HTMLImageElement).naturalWidth > 0)), {
      timeout: 15_000,
    })
    .toBe(true)

  await expect(slot(page, 'Head')).toContainText('Destroyer Battle-Helm')
  await expect(slot(page, 'Head')).toContainText('Glyph of Ferocity')
  await expect(sheet.locator('.gear-sheet-set')).toContainText('Destroyer Battlegear')
  await expect(hit(page)).toHaveText(`140 / ${CAP.untalented}`)
  await expect(page.getByTestId('gear-hit-line')).toContainText(`Hit 140 / ${CAP.untalented}, ${standing(140, CAP.untalented)}`)
  await expect(page.getByTestId('gear-hit-line')).toContainText(`The hit cap for special attacks against a level 73 boss is ${SPECIAL_MISS}%`)
  await expect(page.getByTestId('gear-count-best')).toHaveText("17 of 17 slots best on Wowhead's list")
  await expect(page.getByTestId('gear-count-enchants')).toHaveText('11 of 11 enchants')
  await expect(page.getByTestId('gear-count-sockets')).toHaveText('10 of 10 sockets filled')
  await expect(page.getByTestId('gear-count-bonuses')).toHaveText('5 of 5 socket bonuses on')
  await expect(page.getByTestId('view-left')).toHaveAccessibleName("What's left")

  // The tooltip, fitted as worn, with its rank and where it drops.
  await slot(page, 'Head').hover()
  const tip = page.getByTestId('gear-tip')
  await expect(tip).toBeVisible()
  await expect(tip).toContainText('Destroyer Battle-Helm')
  await expect(tip).toContainText('Glyph of Ferocity')
  await expect(tip).toContainText("Rank 1 of 3 on Wowhead's Fury Warrior list")
  await expect(tip).toContainText('Lady Vashj, Serpentshrine Cavern')
})

test('the goggles on Head: 140 → 116 bare, the checklist puts the Glyph back (132) and the helm (140)', async ({ page }) => {
  await openGear(page)

  // The pane swaps the item alone: −21 for the helm and −16 for its Glyph, +13 for the goggles.
  await slot(page, 'Head').click()
  await page.getByLabel('Head', { exact: true }).selectOption('furious-gizmatic-goggles')
  await expect(slot(page, 'Head')).toContainText('Furious Gizmatic Goggles')
  await expect(slot(page, 'Head')).toContainText('no enchant')
  await expect(hit(page)).toHaveText(`116 / ${CAP.untalented}`)
  await expect(page.getByTestId('gear-hit-line')).toContainText(`${CAP.untalented - 116} under the cap`)
  await expect(page.getByTestId('gear-count-best')).toHaveText("16 of 17 slots best on Wowhead's list")
  await expect(page.getByTestId('gear-count-enchants')).toHaveText('10 of 11 enchants')
  await expect(page.getByTestId('gear-count-sockets')).toHaveText('8 of 10 sockets filled')

  // Escape closes the pane and hands focus back to the slot.
  await page.keyboard.press('Escape')
  await expect(page.locator('.slot-pane')).toHaveCount(0)
  await expect(slot(page, 'Head')).toBeFocused()

  // One slot has something left, on the switch; a count opens the checklist filtered to it.
  await expect(page.getByTestId('view-left')).toHaveAccessibleName("What's left, 1 slot with something left")
  await page.getByTestId('gear-count-enchants').click()
  await expect(page.getByTestId('gear-left')).toBeVisible()
  await expect(page.getByTestId('gear-show-left')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('gear-show-left')).toBeFocused()
  const rows = page.locator('.gear-check')
  await expect(rows).toHaveCount(1)
  const head = page.getByTestId('gear-check-Head')
  await expect(head).toContainText('Destroyer Battle-Helm · T5 token · Lady Vashj, Serpentshrine Cavern')
  await expect(page.getByTestId('gear-tile-hit')).toContainText(`116 / ${CAP.untalented}`)

  // The guide's enchant: +16.
  await page.getByTestId('gear-fix-enchant-Head').click()
  await expect(message(page)).toHaveText('Head: enchanted with Glyph of Ferocity.')
  await expect(page.getByTestId('gear-tile-hit')).toContainText(`132 / ${CAP.untalented}`)
  // The guide's gems, which turn the bonus on.
  await page.getByTestId('gear-fix-gems-Head').click()
  await expect(page.getByTestId('gear-tile-sockets')).toContainText('10 / 10')
  // And the helm: back to 140 and nothing left.
  await page.getByTestId('gear-fix-equip-Head').click()
  await expect(message(page)).toHaveText('Head: equipped Destroyer Battle-Helm.')
  await expect(page.getByTestId('gear-tile-hit')).toContainText(`140 / ${CAP.untalented}`)
  await expect(rows).toHaveCount(0)
  await expect(page.getByText('Nothing left to do: every slot is best on the list, enchanted and fully gemmed.')).toBeVisible()
  await expect(page.getByTestId('view-left')).toHaveAccessibleName("What's left")
  await page.getByTestId('view-sheet').click()
  await expect(slot(page, 'Head')).toContainText('Glyph of Ferocity')
})

test("Where it drops: the slot's target under its raid and boss, and Got it equips it", async ({ page }) => {
  await openGear(page)
  await slot(page, 'Head').click()
  await page.getByLabel('Head', { exact: true }).selectOption('warbringer-battle-helm')
  await page.keyboard.press('Escape')

  await page.getByTestId('view-left').click()
  await page.getByTestId('gear-group-where').click()
  await page.getByTestId('gear-show-left').click()
  const ssc = page.getByTestId('gear-where-serpentshrine-cavern')
  await expect(ssc).toContainText('1 upgrade still to get')
  await expect(ssc.locator('.gear-where-boss')).toHaveCount(1)
  await expect(ssc.locator('.gear-where-boss h5')).toHaveText('Lady Vashj')
  await expect(page.getByTestId('gear-loot-Head')).toContainText('replaces Warbringer Battle-Helm (rank 3)')
  await page.getByRole('button', { name: 'Got it: equip Destroyer Battle-Helm in Head' }).click()
  await expect(page.getByText('Nothing left to get: every slot holds the best item on the list.')).toBeVisible()

  // Every slot again, grouped: Lady Vashj's three drops, ticked.
  await page.getByTestId('gear-show-all').click()
  await expect(page.getByTestId('gear-where-serpentshrine-cavern')).toContainText('everything here is equipped')
  await expect(page.getByTestId('gear-loot-Head')).toContainText('✓ equipped')
})

test('unique rings: Finger 2 cannot take the ring Finger 1 wears', async ({ page }) => {
  await openGear(page)
  await slot(page, 'Finger 2').click()
  await expect(page.getByLabel('Finger 2', { exact: true }).locator('option', { hasText: 'Band of the Ranger-General' })).toHaveJSProperty('disabled', true)
})

test('Empty every slot brings the offer back with hit 0, and the recommended set restores 140', async ({ page }) => {
  await openGear(page)
  await page.getByTestId('gear-empty-all').click()
  await expect(message(page)).toHaveText('Emptied every slot.')
  await expect(page.getByTestId('gear-empty')).toBeVisible()
  await expect(hit(page)).toHaveText(`0 / ${CAP.untalented}`)
  await expect(slot(page, 'Head')).toContainText('empty')
  await expect(page.getByTestId('view-left')).toHaveAccessibleName("What's left, 17 slots with something left")

  await page.getByTestId('equip-recommended').click()
  await expect(message(page)).toContainText("Equipped the recommended set: Wowhead's rank 1 in every slot")
  await expect(hit(page)).toHaveText(`140 / ${CAP.untalented}`)

  // Import your character goes to the Build tab.
  await page.getByTestId('gear-import').click()
  await expect(page.getByRole('navigation', { name: 'Planner sections' }).getByRole('button', { name: 'Build', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
})

test('the cap follows the Talents and Buffs tabs: Precision 3/3 lowers it, Improved Faerie Fire lower still', async ({ page }) => {
  await openGear(page)
  await spendFuryToPrecision(page)
  await expect(hit(page)).toHaveText(`140 / ${CAP.precision}`)
  await expect(page.getByTestId('gear-hit-line')).toContainText(`Hit 140 / ${CAP.precision}, ${standing(140, CAP.precision)}.`)
  await expect(page.getByTestId('gear-hit-line')).toContainText(`3% from Precision`)
  await expect(page.getByTestId('gear-hit-line')).toContainText(`${CAP.precision} rating`)

  await view(page, 'Buffs')
  await page.getByTestId('target-debuff-toggle-improved-faerie-fire').click()
  await view(page, 'Gear')
  await expect(hit(page)).toHaveText(`140 / ${CAP.precisionAndFaerieFire}`)
  await expect(page.getByTestId('gear-hit-line')).toContainText('3% from Precision and 3% from Improved Faerie Fire')
})

test("a Draenei's Heroic Presence, a caster's spell cap and Totem, and a healer's no cap", async ({ page }) => {
  await openGear(page, { dressed: false })
  await (await characterField(page, 'Race')).selectOption('Draenei')
  await expect(hit(page)).toHaveText(`0 / ${CAP.draenei}`)
  await expect(page.getByTestId('gear-hit-line')).toContainText('1% from Heroic Presence')

  // An Elemental Shaman: a Totem, the spell cap, 15% after Inspiring Presence.
  await (await characterField(page, 'Class')).selectOption('Shaman')
  await (await characterField(page, 'Specialization')).selectOption('Elemental')
  await expect(slot(page, 'Totem')).toBeVisible()
  await page.getByTestId('equip-recommended').click()
  await expect(page.getByTestId('gear-sheet').locator('dt', { hasText: 'Spell Hit' })).toBeVisible()
  await expect(hit(page)).toHaveText(/^\d+ \/ 189$/)
  await expect(page.getByTestId('gear-hit-line')).toContainText('The hit cap for spells against a level 73 boss is 16%: 1% from Inspiring Presence')

  // A Restoration Shaman: no cap to show.
  await (await characterField(page, 'Specialization')).selectOption('Restoration')
  await expect(page.getByTestId('gear-hit-line')).toHaveCount(0)
  await expect(hit(page)).toHaveCount(0)

})

test('the view, the filter and the grouping are kept across a visit to another tab, and the sources are named', async ({ page }) => {
  await openGear(page)
  await expect(page.getByTestId('provenance')).toContainText(`"best" from Wowhead's Fury Warrior Phase 2 list`)
  await expect(page.getByTestId('provenance')).toContainText("the hit cap from this app's simulator")
  await page.getByTestId('view-left').click()
  await page.getByTestId('gear-show-left').click()
  await page.getByTestId('gear-group-where').click()
  await view(page, 'Compare')
  await view(page, 'Gear')
  await expect(page.getByTestId('view-left')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('gear-show-left')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('gear-group-where')).toHaveAttribute('aria-pressed', 'true')

  // Change opens the slot pane beside the checklist too.
  await page.getByTestId('gear-group-slot').click()
  await page.getByTestId('gear-show-all').click()
  await page.getByRole('button', { name: 'Change Head', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Head options' })).toBeVisible()
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Change Head', exact: true })).toBeFocused()
})

test('a phone: no sideways scroll, the character first, and every control at least 44px', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 860 })
  await openGear(page)
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(await overflow()).toBeLessThanOrEqual(0)

  const mid = await page.locator('.gear-sheet-mid').boundingBox()
  const head = await slot(page, 'Head').boundingBox()
  expect(mid!.y, 'the middle column comes first').toBeLessThan(head!.y)
  await expect(page.locator('.gear-slot-cosmetic').first()).toBeHidden()

  const short = async () =>
    page.evaluate(() =>
      [...document.querySelectorAll('.gear-panel button')]
        .filter((el) => (el as HTMLElement).offsetParent && el.getBoundingClientRect().height < 43.5)
        .map((el) => `${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)} ${Math.round(el.getBoundingClientRect().height)}`),
    )
  expect(await short()).toEqual([])

  await slot(page, 'Chest').click()
  expect(await short()).toEqual([])
  await page.keyboard.press('Escape')

  await page.getByTestId('view-left').click()
  expect(await overflow()).toBeLessThanOrEqual(0)
  expect(await short()).toEqual([])
  await page.getByTestId('gear-group-where').click()
  expect(await overflow()).toBeLessThanOrEqual(0)
  expect(await short()).toEqual([])
})
