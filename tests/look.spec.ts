import { existsSync, readFileSync, statSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

/*
 * Step 0 of the port (docs/design/PORT-PLAN.md, 2026-10-12): the prototypes' look and the shared
 * shell, brought into the app before any tab's layout is. These pin what every later step builds on:
 * each screen's colour, the phase on every screen, the wordmark's way home, and the typefaces.
 */

const TAB_COLOURS = {
  home: 'rgb(79, 216, 200)',
  planner: 'rgb(124, 196, 255)',
  simulation: 'rgb(236, 192, 106)',
  raidcomp: 'rgb(242, 199, 92)',
  tierlists: 'rgb(62, 224, 160)',
  raids: 'rgb(79, 216, 200)',
  professions: 'rgb(255, 181, 71)',
} as const

/** The tab's colour as the page resolves it: `--glow` on the root, read off an element that uses it. */
async function screenColour(page: Page) {
  return page.evaluate(() => {
    const probe = document.createElement('span')
    probe.style.color = 'var(--glow)'
    document.body.append(probe)
    const colour = getComputedStyle(probe).color
    probe.remove()
    return { tab: document.documentElement.dataset.tab, colour }
  })
}

async function createDefaultCharacter(page: Page) {
  for (let step = 0; step < 3; step++) await page.getByTestId('creator-next').click()
  await page.getByTestId('creator-confirm').click()
}

const sectionTab = (page: Page, label: string) =>
  page.getByRole('navigation', { name: 'Main sections' }).getByRole('button', { name: label, exact: true })

test('every screen takes its tab’s colour, and the faction no longer recolours the page', async ({ page }) => {
  await page.goto('/?simulation=1')
  await expect(page.getByTestId('section-planner')).toBeVisible()
  expect(await screenColour(page), 'the front door is Home’s teal').toEqual({ tab: 'home', colour: TAB_COLOURS.home })

  /*
   * A door wears the colour of the room behind it: each card's accent is its tab's colour, so the
   * front door previews the six colours the sections will be drawn in.
   */
  for (const section of ['planner', 'simulation', 'raidcomp', 'tierlists', 'raids', 'professions'] as const) {
    await expect(page.getByTestId(`section-${section}`), `${section}'s door`).toHaveCSS('border-top-color', TAB_COLOURS[section])
  }

  await page.getByTestId('section-planner').click()
  // Creation takes the colour of the section it leads into.
  expect(await screenColour(page)).toEqual({ tab: 'planner', colour: TAB_COLOURS.planner })
  await page.getByTestId('creator-option-horde').click()
  expect(await screenColour(page), 'picking Horde does not turn the page red').toEqual({ tab: 'planner', colour: TAB_COLOURS.planner })
  await createDefaultCharacter(page)

  for (const [label, tab] of [
    ['Simulation', 'simulation'],
    ['Raid Composition', 'raidcomp'],
    ['Spec Tier Lists', 'tierlists'],
    ['Raids', 'raids'],
    ['Professions', 'professions'],
    ['Character Planner', 'planner'],
  ] as const) {
    await sectionTab(page, label).click()
    expect(await screenColour(page), label).toEqual({ tab, colour: TAB_COLOURS[tab] })
  }
  expect(await page.evaluate(() => document.documentElement.dataset.faction), 'nothing stamps a faction theme any more').toBeUndefined()
})

test('every screen says which game and phase its numbers are for', async ({ page }) => {
  await page.goto('/?simulation=1')
  await page.getByTestId('section-raids').click()

  const chip = page.locator('.topbar-line').getByTestId('phase-chip')
  for (const label of ['Raids', 'Raid Composition', 'Spec Tier Lists', 'Professions']) {
    await sectionTab(page, label).click()
    await expect(chip, label).toHaveText('TBC Classic · Phase 2')
  }

  // The planner and the simulator too, once there is a character.
  await sectionTab(page, 'Character Planner').click()
  await createDefaultCharacter(page)
  await expect(chip).toHaveText('TBC Classic · Phase 2')
  await sectionTab(page, 'Simulation').click()
  await expect(chip).toHaveText('TBC Classic · Phase 2')
})

test('the wordmark goes back to the front door, and the doors lead back to the same character', async ({ page }) => {
  await page.goto('/?simulation=1')
  await page.getByTestId('section-planner').click()
  await page.getByTestId('creator-option-horde').click()
  await createDefaultCharacter(page)
  const name = page.getByTestId('character-name')
  const who = await name.textContent()
  expect(who, 'a Horde character, so keeping it is not the default by luck').not.toMatch(/Human/)

  const brand = page.getByTestId('brand-home')
  await expect(brand).toHaveAccessibleName(/^Project Defeat, back to the front page$/)
  await brand.click()
  await expect(page.getByTestId('section-planner')).toBeVisible()
  expect((await screenColour(page)).tab).toBe('home')

  await page.getByTestId('section-planner').click()
  await expect(page.getByTestId('character-creator'), 'no second trip through creation').toHaveCount(0)
  await expect(name).toHaveText(who!)
})

test('the type is the prototypes’ — Marcellus headings, Figtree text — and is served with its licences', async ({ page }) => {
  await page.goto('/?simulation=1')
  await page.getByTestId('section-tierlists').click()

  const family = (selector: string) => page.locator(selector).first().evaluate((el) => getComputedStyle(el).fontFamily)
  expect(await family('.panel h2')).toMatch(/^"?Marcellus"?,/)
  expect(await family('body')).toMatch(/^"?Figtree"?,/)

  // The faces actually load, rather than the fallbacks standing in for them.
  await page.evaluate(() => document.fonts.ready)
  const loaded = await page.evaluate(() => [...document.fonts].filter((face) => face.status === 'loaded').map((face) => face.family.replace(/"/g, '')))
  expect(new Set(loaded)).toEqual(new Set(['Marcellus', 'Figtree', 'JetBrains Mono']))

  /*
   * Self-hosted, never fetched from Google at runtime, and each with its SIL Open Font License beside
   * it — the one condition the licence sets on shipping the files.
   */
  for (const [file, licence] of [
    ['marcellus-400.woff2', 'marcellus-OFL.txt'],
    ['figtree-variable.woff2', 'figtree-OFL.txt'],
    ['jetbrains-mono-variable.woff2', 'jetbrainsmono-OFL.txt'],
  ]) {
    expect(statSync(`public/fonts/${file}`).size, file).toBeGreaterThan(5_000)
    expect(readFileSync(`public/fonts/${licence}`, 'utf8'), licence).toContain('SIL Open Font License')
  }
  expect(existsSync('public/fonts/cinzel-variable.woff2'), 'the old faces are gone, not shipped alongside').toBe(false)
})

test('the page says what it is, in the browser tab and in a pasted link', () => {
  const html = readFileSync('index.html', 'utf8')
  expect(html).toContain('<title>Project Defeat · TBC Classic Phase 2 planner</title>')
  expect(html).toMatch(/<meta\s+name="description"\s+content="[^"]{60,}"/)

  // A link preview needs an absolute image URL, and the image has to be one the build actually serves.
  const image = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1]
  expect(image).toBe('https://josephevenson08.github.io/project-defeat/social-preview.jpg')
  expect(existsSync('public/social-preview.jpg')).toBe(true)

  // The first screen's two faces are preloaded, so the loading title does not flash in a fallback.
  expect(html).toContain('<link rel="preload" href="/fonts/marcellus-400.woff2" as="font" type="font/woff2" crossorigin />')
  expect(html).toContain('<link rel="preload" href="/fonts/figtree-variable.woff2" as="font" type="font/woff2" crossorigin />')
})

test('character creation fits a phone', async ({ page }) => {
  /*
   * Its step list sat beside the stage at every width, which left the stage about 40px wide at 400px:
   * the prompt broke a word to a line and the faction buttons ran off the screen. It stacks now.
   */
  await page.setViewportSize({ width: 400, height: 860 })
  await page.goto('/?simulation=1')
  await page.getByTestId('section-planner').click()
  await expect(page.getByTestId('character-creator')).toBeVisible()

  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 'no sideways scroll').toBeLessThanOrEqual(0)
  const option = await page.getByTestId('creator-option-alliance').boundingBox()
  expect(option!.x + option!.width, 'the first option is wholly on screen').toBeLessThanOrEqual(400)
})
