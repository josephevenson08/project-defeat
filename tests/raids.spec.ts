import { readdirSync, readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import { bisRankingsFetchedAt } from '../src/domain/bis'
import {
  exampleRaid,
  firstPicks,
  getBossesForRaid,
  getRaidById,
  isContested,
  lootRankFor,
  lootRanks,
  raidDropCount,
  raidersFrom,
  sampleRaids,
  searchRaidLoot,
  setPiecesFor,
  raidLootFetchedAt,
  whoWants,
  type RaidLootEntry,
} from '../src/domain/raids'

/*
 * Raids as decided on 2026-10-11 and ported in step 2 of docs/design/PORT-PLAN.md: design A, the boss
 * journal, with design C's "For my raid" behind a switch, and the search across all five raids. These
 * are the prototype's hands-on check (`checks/raids-handson.mjs`) with its real numbers: 469 drops;
 * Hydross has 2 drops on the Fury list; Gloves of the Searing Grip are #1 on the Feral list; the
 * example 25 has 11 raiders wanting the Belt of One-Hundred Deaths, 8 of them first.
 */

const FURY = { className: 'Warrior', spec: 'Fury' } as const
const FERAL = { className: 'Druid', spec: 'Feral' } as const

function findDrop(name: string): RaidLootEntry {
  for (const raid of sampleRaids) {
    for (const boss of getBossesForRaid(raid.id)) {
      const entry = boss.loot.find((candidate) => candidate.name === name)
      if (entry) return entry
    }
    const trash = raid.notableTrashLoot?.find((candidate) => candidate.name === name)
    if (trash) return trash
  }
  throw new Error(`no drop called ${name}`)
}

test('the loot data the journal reads: 469 drops, ranked on every spec’s Wowhead list', () => {
  expect(sampleRaids.reduce((total, raid) => total + raidDropCount(raid), 0)).toBe(469)

  const hydross = getBossesForRaid('serpentshrine-cavern').find((boss) => boss.name === 'Hydross the Unstable')!
  expect(hydross.loot.filter((entry) => lootRankFor(entry, FURY)).length, 'Hydross drops on the Fury list').toBe(2)

  expect(lootRankFor(findDrop('Gloves of the Searing Grip'), FERAL)?.rank).toBe(1)

  const trophy = findDrop('Dragonspine Trophy')
  expect(lootRanks(trophy).length, 'Dragonspine Trophy is on ten lists').toBe(10)
  expect(lootRankFor(trophy, FURY)?.rank).toBe(1)
})

test('the source line’s dates are the ones the ingests recorded', () => {
  // The loot tables' date is written by hand in raidSources.ts, so it is checked against what the
  // ingest wrote into each raid's file: a re-ingest that forgets to move it fails here.
  const dir = 'tools/ingest/data'
  const recorded = readdirSync(dir)
    .filter((file) => /^raid-loot\..+\.json$/.test(file))
    .map((file) => JSON.parse(readFileSync(`${dir}/${file}`, 'utf8')).fetchedAt as string)
  expect(recorded).toHaveLength(5)
  expect(new Set(recorded)).toEqual(new Set([raidLootFetchedAt]))
  expect(bisRankingsFetchedAt, 'the BiS rankings carry their own date').toMatch(/^\d{4}-\d{2}-\d{2}$/)
})

test('searching all five raids finds a drop where it drops', () => {
  const results = searchRaidLoot('dragonspine')
  expect(results.map((result) => [result.raid.name, result.count])).toEqual([["Gruul's Lair", 1]])
  expect(searchRaidLoot('d'), 'one letter is not a search').toEqual([])
  expect(searchRaidLoot('zzzz')).toEqual([])
})

test('who in the example 25 wants a drop, and which drops are contested', () => {
  const raiders = raidersFrom(exampleRaid(25))
  expect(raiders).toHaveLength(25)
  expect(raiders.filter((raider) => !raider.list).map((raider) => raider.label), 'the Bear tank has no list of its own').toEqual([
    'Feral (Bear) Druid',
  ])

  const belt = whoWants(findDrop('Belt of One-Hundred Deaths'), raiders)
  expect([belt.length, firstPicks(belt)]).toEqual([11, 8])
  expect(isContested(belt)).toBe(true)

  const trophy = whoWants(findDrop('Dragonspine Trophy'), raiders)
  expect([trophy.length, firstPicks(trophy)]).toEqual([9, 9])

  // A tier token is wanted through the set pieces it buys.
  const token = getBossesForRaid('gruuls-lair')
    .flatMap((boss) => boss.loot)
    .find((entry) => entry.dropType === 'Tier Token' && !entry.itemId)!
  expect(setPiecesFor(token).length).toBeGreaterThan(0)
  const wants = whoWants(token, raiders)
  expect(wants.length).toBeGreaterThan(0)
  expect(wants.every((want) => want.via !== undefined), 'every want comes through a set piece').toBe(true)

  expect(raidersFrom(exampleRaid(10))).toHaveLength(10)
  expect(getRaidById('karazhan')?.playerSize).toBe(10)
})

/* ── The tab ─────────────────────────────────────────────────────────────────────────────────── */

const sectionTab = (page: Page, label: string) =>
  page.getByRole('navigation', { name: 'Main sections' }).getByRole('button', { name: label, exact: true })

async function openRaids(page: Page, { asFury = false } = {}) {
  await page.goto('/?simulation=1')
  if (asFury) {
    await page.getByTestId('section-planner').click()
    for (let step = 0; step < 3; step++) await page.getByTestId('creator-next').click()
    await page.getByTestId('creator-confirm').click()
    await sectionTab(page, 'Raids').click()
  } else {
    await page.getByTestId('section-raids').click()
  }
  await expect(page.getByTestId('journal-page')).toBeVisible()
}

const pageTitle = (page: Page) => page.locator('#journal-title')
const rowNamed = (page: Page, name: string) => page.locator('.journal-item', { hasText: name })

test('Raids opens on Serpentshrine Cavern, and each raid takes its own colour', async ({ page }) => {
  await openRaids(page)
  await expect(page.getByTestId('raid-pick-serpentshrine-cavern')).toHaveAttribute('aria-pressed', 'true')
  await expect(pageTitle(page)).toHaveText('Hydross the Unstable')
  expect(await page.evaluate(() => document.documentElement.dataset.raid)).toBe('ssc')

  await page.getByTestId('raid-pick-tempest-keep').click()
  await expect(pageTitle(page)).toHaveText("Al'ar")
  expect(await page.evaluate(() => document.documentElement.dataset.raid), 'Tempest Keep: gold over violet').toBe('tk')

  await page.getByTestId('raid-pick-karazhan').click()
  expect(await page.evaluate(() => document.documentElement.dataset.raid), 'a Phase 1 raid: torchlight').toBe('p1')

  // Leaving the tab takes the raid's colour with it.
  await sectionTab(page, 'Professions').click()
  expect(await page.evaluate(() => document.documentElement.dataset.raid)).toBeUndefined()
  await sectionTab(page, 'Raids').click()

  await expect(page.locator('.topbar-line').getByTestId('provenance')).toContainText("Wowhead's loot tables (ingested 13 Sept 2026)")
})

test('the journal: About, six bosses and the trash; your spec’s picks first, the rest folded', async ({ page }) => {
  await openRaids(page, { asFury: true })
  const rail = page.getByRole('navigation', { name: 'Serpentshrine Cavern: bosses' })
  await expect(rail.getByRole('button')).toHaveCount(8)

  await expect(page.locator('.journal-count')).toHaveText('2 drops here are on the Fury Warrior list')
  const ranks = await page.locator('.journal-loot').first().locator('.loot-rank').allInnerTexts()
  expect(ranks).toHaveLength(2)
  expect(Number.parseInt(ranks[0].slice(1)), 'best first').toBeLessThanOrEqual(Number.parseInt(ranks[1].slice(1)))
  await expect(page.locator('.journal-more summary')).toHaveText('20 other drops')

  await page.getByTestId('journal-page-leotheras-the-blind').click()
  await expect(pageTitle(page)).toHaveText('Leotheras the Blind')
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(pageTitle(page)).toHaveText('Fathom-Lord Karathress')

  await page.getByRole('tab', { name: 'The fight' }).click()
  await expect(page.locator('#journal-body')).toContainText('Four separate targets')
  await page.getByRole('tab', { name: 'Loot' }).click()

  // The open boss is kept for the session, across a visit to another tab.
  await sectionTab(page, 'Spec Tier Lists').click()
  await sectionTab(page, 'Raids').click()
  await expect(pageTitle(page)).toHaveText('Fathom-Lord Karathress')

  // Choosing Raids again goes back to its start.
  await sectionTab(page, 'Raids').click()
  await expect(pageTitle(page)).toHaveText('Hydross the Unstable')
})

test('Loot for any spec: Al’ar’s Gloves of the Searing Grip are #1 for Feral, and every drop has a tooltip', async ({ page }) => {
  await openRaids(page)
  await expect(page.locator('.loot-rank'), 'with no character, every drop unranked').toHaveCount(0)

  await page.getByTestId('raid-pick-tempest-keep').click()
  await page.getByTestId('loot-for').selectOption('Druid|Feral')
  const gloves = page.locator('.journal-loot').first().locator('.journal-item', { hasText: 'Gloves of the Searing Grip' })
  await expect(gloves.locator('.loot-rank')).toHaveText(/#1/)

  await page.getByTestId('raid-pick-gruuls-lair').click()
  await page.getByTestId('journal-page-gruul-the-dragonkiller').click()
  await page.getByTestId('loot-for').selectOption('all')
  await rowNamed(page, 'Dragonspine Trophy').hover()
  const tip = page.getByTestId('item-tip')
  await expect(tip).toContainText('Dragonspine Trophy')
  await expect(tip).toContainText('+40 Attack Power')
  await expect(tip).toContainText('On 10 Wowhead Phase 2 lists')
  await expect(tip, 'Ranged AP that only mirrors Attack Power is not a line').not.toContainText('Ranged AP')
  await page.keyboard.press('Escape')
  await expect(tip).toHaveCount(0)
})

test('About the raid: the attunement chain, and Tempest Keep’s heroic keys need Revered', async ({ page }) => {
  await openRaids(page)
  await page.getByTestId('raid-pick-tempest-keep').click()
  await page.getByTestId('journal-page-about').click()
  await expect(pageTitle(page)).toHaveText('About Tempest Keep: The Eye')
  await expect(page.getByTestId('attunement-chain')).toContainText('The Trial of the Naaru')
  await expect(page.getByTestId('raid-about')).toContainText('Revered with each of the relevant factions')

  // Karazhan's bosses carry the owner's art on the banner.
  await page.getByTestId('raid-pick-karazhan').click()
  await page.getByTestId('journal-page-prince-malchezaar').click()
  await expect(page.locator('.journal-banner')).not.toHaveClass(/journal-banner-plain/)
})

test('search: one match for “dragonspine”, opened where it drops; no match says so; Esc clears', async ({ page }) => {
  await openRaids(page)
  const search = page.getByTestId('loot-search')
  await search.fill('dragonspine')
  const results = page.getByTestId('loot-search-results')
  await expect(results).toContainText('1 drop matches in 1 raid')
  await expect(results).toContainText("Gruul's Lair")
  await expect(page.getByTestId('journal-page'), 'the raid gives way to the results').toHaveCount(0)

  await results.locator('.loot-search-hit').first().click()
  await expect(page.getByTestId('raid-pick-gruuls-lair')).toHaveAttribute('aria-pressed', 'true')
  await expect(search).toHaveValue('')
  await expect(pageTitle(page)).toHaveText('Gruul the Dragonkiller')
  await expect(rowNamed(page, 'Dragonspine Trophy')).toBeFocused()

  await search.fill('zzqx')
  await expect(results).toContainText('No drops match “zzqx”')
  await search.press('Escape')
  await expect(page.getByTestId('journal-page')).toBeVisible()

  // "/" jumps to the search from anywhere on the page.
  await page.locator('#journal-title').click()
  await page.keyboard.press('/')
  await expect(search).toBeFocused()
})

test('For my raid: the example 25, who wants each drop, and what is contested', async ({ page }) => {
  await openRaids(page)
  await page.getByTestId('view-raid').click()
  await expect(page.locator('.raid-plan-raider')).toHaveCount(25)
  await expect(page.getByTestId('raid-plan-source')).toContainText('example 25-player raid')
  await expect(page.locator('.raid-plan-note')).toContainText('Bear tanks have no list of their own')
  await expect(page.locator('.raid-plan-top')).toContainText(/Belt of One-Hundred Deaths\s*11 raiders · 8 rank it first/)

  await page.getByTestId('raid-pick-gruuls-lair').click()
  const trophy = page.locator('.raid-plan-row', { hasText: 'Dragonspine Trophy' })
  await expect(trophy).toContainText('9 raiders · 9 first')
  await expect(trophy).toContainText('Contested')
  const token = page.locator('.raid-plan-row', { hasText: 'Pauldrons of the Fallen Defender' })
  await expect(token.locator('.raid-plan-chip').first(), 'a token is wanted through a set piece').toHaveAttribute('title', /\(for .+\)$/)

  await page.getByTestId('raid-pick-karazhan').click()
  await expect(page.locator('.raid-plan-raider'), 'Karazhan uses the example 10').toHaveCount(10)

  // A raider's wishlist, then everyone again.
  await page.getByTestId('raid-pick-serpentshrine-cavern').click()
  const everyone = await page.locator('.raid-plan-row').count()
  await page.getByTestId('raider-1-0').click()
  await expect(page.locator('.raid-plan-selected')).toContainText('Fury Warrior')
  const theirs = await page.locator('.raid-plan-row').count()
  expect(theirs).toBeGreaterThan(0)
  expect(theirs).toBeLessThan(everyone)
  await expect(page.locator('.raid-plan-row .raid-plan-chip-mine')).toHaveCount(theirs)
  await page.getByRole('button', { name: 'Show everyone' }).click()
  await expect(page.locator('.raid-plan-row')).toHaveCount(everyone)

  // The search says who wants a drop while the raid view is on, and opens it there.
  await page.getByTestId('loot-search').fill('dragonspine')
  await expect(page.getByTestId('loot-search-results')).toContainText(/raiders? wants? it/)
  await page.locator('.loot-search-hit').first().click()
  await expect(page.locator('.raid-plan-row.loot-flash')).toHaveCount(1)

  // The view is kept across a visit to another tab, and the way to plan a raid goes there.
  await sectionTab(page, 'Professions').click()
  await sectionTab(page, 'Raids').click()
  await expect(page.getByTestId('view-raid')).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Plan your own on Raid Composition' }).click()
  await expect(sectionTab(page, 'Raid Composition')).toHaveAttribute('aria-current', 'page')
})

test('a raid planned on Raid Composition replaces the example', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    const seat = (className: string, spec: string, buildId: string, playerName?: string) => ({ className, spec, buildId, playerName })
    const groups = Array.from({ length: 5 }, (_, group) =>
      Array.from({ length: 5 }, (_, index) =>
        group === 0 && index === 0 ? seat('Warrior', 'Fury', 'warrior-fury', 'Grommash') : seat('Mage', 'Fire', 'mage-fire'),
      ),
    )
    localStorage.setItem('project-defeat:roster:v1', JSON.stringify({ size: 25, groups }))
  })
  await openRaids(page)
  await page.getByTestId('view-raid').click()
  await expect(page.getByTestId('raid-plan-source')).toContainText('Your raid from Raid Composition')
  await expect(page.getByTestId('raider-0-0')).toHaveAttribute('title', /^Grommash, Fury Warrior: /)

  // A 25-player raid does not stand in for Karazhan's ten.
  await page.getByTestId('raid-pick-karazhan').click()
  await expect(page.getByTestId('raid-plan-source')).toContainText('the raid you planned is a different size')
})

test('on a phone Raids fits, and its controls are 44px targets', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 860 })
  await openRaids(page)

  const check = async (where: string) => {
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), `${where}: no sideways scroll`).toBeLessThanOrEqual(0)
    const small = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('.raids-hero button, .raids-hero input, .raids-view button, .raids-view select, .raids-view summary')]
        // A button inside a sentence is an inline target, which the 44px rule exempts.
        .filter((element) => element.offsetParent && !element.classList.contains('link-button'))
        .filter((element) => element.getBoundingClientRect().height < 44)
        .map((element) => `${(element.textContent || element.getAttribute('aria-label') || element.tagName).trim().slice(0, 24)} ${Math.round(element.getBoundingClientRect().height)}`),
    )
    expect(small, `${where}: controls under 44px`).toEqual([])
  }

  await check('the journal')
  await page.getByTestId('view-raid').click()
  await check('for my raid')
  await page.getByTestId('loot-search').fill('destroyer')
  await check('search')
})
