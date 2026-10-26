import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { expect, test, type Page } from '@playwright/test'
import { build, type Plugin } from 'vite'

/*
 * Step 7 of the port (docs/design/PORT-PLAN.md): the prototypes' crystal-and-water scene and their
 * motion, as one optional layer loaded on demand. These pin the three promises the plan made for it:
 * the still backdrop wherever the scene does not run, nothing moving with reduced motion, and a main
 * bundle that does not grow by more than the switch and the loader.
 */

const sectionTab = (page: Page, label: string) =>
  page.getByRole('navigation', { name: 'Main sections' }).getByRole('button', { name: label, exact: true })

/** The lazy chunks and the requests for them, so a test can say a chunk was never fetched. */
function chunkRequests(page: Page) {
  const urls: string[] = []
  page.on('request', (request) => urls.push(request.url()))
  return {
    scene: () => urls.filter((url) => /waterScene|\/three\//.test(url)),
    motion: () => urls.filter((url) => /motionLayer/.test(url)),
  }
}

/** The backdrop step 0 paints behind every screen, as the page resolves it. */
const backdrop = (page: Page) =>
  page.evaluate(() => ({
    image: getComputedStyle(document.body, '::before').backgroundImage,
    sceneOn: document.documentElement.classList.contains('scene-on'),
    canvas: document.querySelectorAll('.scene-canvas').length,
  }))

/** Waits out the time the layer would take to load: it waits for the browser to be idle, up to two seconds. */
const idle = (page: Page) => page.waitForTimeout(2500)

async function openTalents(page: Page) {
  await page.goto('/')
  await page.getByTestId('section-planner').click()
  for (let step = 0; step < 3; step++) await page.getByTestId('creator-next').click()
  await page.getByTestId('creator-confirm').click()
  await page.getByRole('navigation', { name: 'Planner sections' }).getByRole('button', { name: 'Talents', exact: true }).click()
}

test.describe('without WebGL', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...rest: unknown[]) {
        return /webgl/i.test(kind) ? null : (original as (...args: unknown[]) => RenderingContext | null).call(this, kind, ...rest)
      } as typeof original
    })
  })

  test('every screen keeps its still backdrop, the switch says why, and the scene is never fetched', async ({ page }) => {
    // The suite starts with the scene off (playwright.config.ts); this visitor never turned it off.
    await page.addInitScript(() => localStorage.setItem('project-defeat:scene:v1', 'on'))
    const requests = chunkRequests(page)
    await page.goto('/?simulation=1')
    await expect(page.getByTestId('section-planner')).toBeVisible()
    await idle(page)

    const front = await backdrop(page)
    expect(front.image, 'the front door keeps its backdrop').toContain('gradient')
    expect(front.sceneOn).toBe(false)
    expect(front.canvas).toBe(0)

    await page.getByTestId('section-tierlists').click()
    const toggle = page.getByTestId('scene-switch')
    await expect(toggle).toHaveText(/3D scene: unavailable/)
    await expect(toggle).toHaveAttribute('aria-disabled', 'true')
    await expect(toggle).toHaveAttribute('title', /WebGL is off/)
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')

    for (const label of ['Raids', 'Professions', 'Raid Composition']) {
      await sectionTab(page, label).click()
      const shown = await backdrop(page)
      expect(shown.image, `${label} keeps its backdrop`).toContain('gradient')
      expect(shown.canvas, `${label} draws no scene`).toBe(0)
    }

    expect(requests.scene(), 'neither the scene nor three is downloaded').toEqual([])
    // The motion layer is a few CSS animations, so it still runs where the scene cannot.
    expect(requests.motion().length).toBeGreaterThan(0)

    // Pressing a switch that cannot switch changes nothing (dispatched: Playwright will not click an aria-disabled button).
    await toggle.dispatchEvent('click')
    await expect(toggle).toHaveText(/3D scene: unavailable/)
  })
})

test.describe('with reduced motion', () => {
  test('nothing moves: no scene, no motion layer, and no animation runs anywhere', async ({ page }) => {
    // Emulated on the page: `test.use({ reducedMotion })` did not reach it beside this file's launch options.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const requests = chunkRequests(page)
    // The tests' own override, which skips the hardware check, must not get past reduced motion.
    await page.addInitScript(() => localStorage.setItem('project-defeat:scene:v1', 'force'))
    await page.goto('/?simulation=1')
    await page.getByTestId('section-tierlists').click()
    await expect(page.getByRole('heading', { name: 'DPS tier list' })).toBeVisible()
    await idle(page)

    const toggle = page.getByTestId('scene-switch')
    await expect(toggle).toHaveText('3D scene: off (reduced motion)')
    await expect(toggle).toHaveAttribute('aria-disabled', 'true')

    expect(await backdrop(page)).toEqual({ image: expect.stringContaining('gradient'), sceneOn: false, canvas: 0 })
    expect(await page.evaluate(() => document.documentElement.classList.contains('motion'))).toBe(false)
    expect(await page.evaluate(() => document.getAnimations().length), 'the tier board lands without moving').toBe(0)

    // A learned talent, which pulses with motion on, does not.
    await openTalents(page)
    await page.getByTestId('talent-157').click()
    await expect(page.getByTestId('talent-157')).toHaveAttribute('aria-label', /, 1 of 5/)
    await page.waitForTimeout(300)
    expect(await page.evaluate(() => document.getAnimations().length), 'the learned point does not pulse').toBe(0)

    expect(requests.scene()).toEqual([])
    expect(requests.motion()).toEqual([])
  })
})

test.describe('with motion', () => {
  test('a learned talent pulses, the tier tiles land, and the backdrop swells without the scene', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('project-defeat:scene:v1', 'off'))
    await openTalents(page)
    await expect(page.locator('html.motion')).toHaveCount(1)
    await expect(page.getByTestId('scene-switch')).toHaveText('3D scene: off')

    const point = page.getByTestId('talent-157')
    await point.click()
    await expect.poll(() => point.locator('.talent-icon').evaluate((icon) => icon.getAnimations().length), { message: 'the learned point pulses' }).toBeGreaterThan(0)
    // The icon pulses inside the button, whose box stays put, so the next click lands at once.
    expect(await point.evaluate((button) => [button.getAnimations().length, button.getBoundingClientRect().width === button.offsetWidth])).toEqual([0, true])
    await point.click()
    await expect(point).toHaveAttribute('aria-label', /, 2 of 5/)

    await sectionTab(page, 'Spec Tier Lists').click()
    await expect.poll(() => page.evaluate(() => document.querySelectorAll('.tier-tile')[0]?.getAnimations().length ?? 0), { message: 'the tiles land' }).toBeGreaterThan(0)
    // Every moment ends: nothing is left running or hidden once it has played.
    await expect.poll(() => page.evaluate(() => document.getAnimations().length), { timeout: 5000 }).toBe(0)
    await expect(page.locator('.tier-tile').first()).toHaveCSS('opacity', '1')

    // A seat that brings the raid something new swells the scene; with the scene off, the backdrop brightens once.
    await sectionTab(page, 'Raid Composition').click()
    await page.getByTestId('raidcomp-add-warrior-fury').click()
    await expect(page.locator('html.backdrop-swell')).toHaveCount(1)
    await expect(page.locator('html.backdrop-swell')).toHaveCount(0, { timeout: 3000 })
  })
})

test.describe('with WebGL', () => {
  test('the scene runs behind every screen in its colour, and the switch turns it off and on, remembered', async ({ page }) => {
    /*
     * On the test browser's own graphics card. Forcing the software renderer instead kept every core busy
     * for the whole test and pushed other tests in the same run past their time. 'force' (stored below)
     * skips the hardware check, so a browser that only has the software renderer still runs it.
     */
    await page.goto('about:blank')
    test.skip(!(await page.evaluate(() => !!document.createElement('canvas').getContext('webgl2'))), 'this browser has no WebGL 2 at all')
    test.setTimeout(60_000)
    await page.setViewportSize({ width: 800, height: 500 })
    // 'force' on the first load only, so the switch's own choice is what the reload below finds.
    await page.addInitScript(() => {
      if (sessionStorage.getItem('scene-seeded')) return
      sessionStorage.setItem('scene-seeded', '1')
      localStorage.setItem('project-defeat:scene:v1', 'force')
    })
    await page.goto('/?simulation=1')
    await expect(page.locator('.scene-canvas')).toHaveCount(1, { timeout: 15000 })
    // The front door has its own painted art and no 3D: the scene loads, and rests until a section opens.
    await page.waitForTimeout(500)
    await expect(page.locator('canvas.scene-canvas.is-shown')).toHaveCount(0)
    await expect(page.locator('html.scene-on')).toHaveCount(0)

    await page.getByTestId('section-tierlists').click()
    await expect(page.locator('canvas.scene-canvas.is-shown')).toHaveCount(1, { timeout: 15000 })
    await expect(page.locator('html.scene-on')).toHaveCount(1)
    await expect(page.locator('html'), 'the tier lists are emerald').toHaveAttribute('data-scene-theme', 'tiers')
    // With the scene on, the backdrop stays under the canvas and the veil goes over it.
    expect(await page.evaluate(() => getComputedStyle(document.body, '::after').backgroundImage)).toContain('gradient')

    // And back at the front door it rests again.
    await page.getByTestId('brand-home').click()
    await expect(page.locator('canvas.scene-canvas.is-shown')).toHaveCount(0)
    await page.getByTestId('section-tierlists').click()
    await expect(page.locator('canvas.scene-canvas.is-shown')).toHaveCount(1)
    const themes: [string, string][] = [
      ['Raids', 'ssc'],
      ['Professions', 'profs'],
      ['Raid Composition', 'raidcomp'],
    ]
    for (const [label, theme] of themes) {
      await sectionTab(page, label).click()
      await expect(page.locator('html'), `${label}'s theme`).toHaveAttribute('data-scene-theme', theme)
    }
    // Raids lights each raid its own way: Tempest Keep gold over violet, Karazhan its own violet.
    await sectionTab(page, 'Raids').click()
    await page.getByTestId('raid-pick-tempest-keep').click()
    await expect(page.locator('html')).toHaveAttribute('data-scene-theme', 'tk')
    await page.getByTestId('raid-pick-karazhan').click()
    await expect(page.locator('html')).toHaveAttribute('data-scene-theme', 'karazhan')

    const toggle = page.getByTestId('scene-switch')
    await expect(toggle).toHaveText('3D scene: on')
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await toggle.click()
    await expect(toggle).toHaveText('3D scene: off')
    await expect(page.locator('.scene-canvas')).toHaveCount(0)
    await expect(page.locator('html.scene-on')).toHaveCount(0)

    await page.reload()
    await page.getByTestId('section-tierlists').click()
    await expect(page.getByTestId('scene-switch'), 'off is remembered').toHaveText('3D scene: off')
    await idle(page)
    await expect(page.locator('.scene-canvas')).toHaveCount(0)

    await page.getByTestId('scene-switch').click()
    await expect(page.locator('canvas.scene-canvas.is-shown')).toHaveCount(1, { timeout: 15000 })
    await expect(page.locator('html')).toHaveAttribute('data-scene-theme', 'tiers')
  })
})

/*
 * The main bundle, measured. The app is built twice, once as it is and once with the layer's three
 * modules in the main bundle (the cue, the control and the switch) swapped for empty ones, and the
 * difference has to stay within the budget the owner set: 1.5 KB gzipped (2026-10-23), raised to 2 KB
 * (2026-10-26) because the measurement moves about 500 bytes with unrelated content. Merging the talent
 * data took the same layer, unchanged, from 1,241 to 1,723 bytes: the difference of two gzips of a
 * 650 KB bundle shifts with whatever else sits in the compression window. `three` and the
 * scene must not be in the main bundle at all. Measured by hand against ce1dd35 when step 7 went in:
 * 648,751 → 649,992 bytes gzipped, call sites included.
 */
test('the main bundle carries no scene and grows by less than 2 KB gzipped', async () => {
  test.setTimeout(240_000)
  const root = process.cwd()
  const stub: Plugin = {
    name: 'no-scene-layer',
    enforce: 'pre',
    load(id) {
      const file = id.replace(/\\/g, '/')
      if (file.endsWith('/src/lib/motion.ts')) return 'export function cue() {}\nexport function attachMotion() { return () => {} }'
      if (file.endsWith('/src/features/scene/sceneControl.ts'))
        return "export function bootScene() {}\nexport function setScenePreference() {}\nexport function useSceneState() { return { status: 'off' } }"
      if (file.endsWith('/src/features/scene/SceneSwitch.tsx')) return 'export function SceneSwitch() { return null }'
      return undefined
    },
  }

  async function entry(plugins: Plugin[]) {
    const outDir = mkdtempSync(join(tmpdir(), 'pd-scene-'))
    try {
      await build({ root, logLevel: 'silent', plugins, build: { outDir, emptyOutDir: true } })
      const files = readdirSync(join(outDir, 'assets'))
      const main = files.find((file) => /^index-.*\.js$/.test(file))!
      const code = readFileSync(join(outDir, 'assets', main))
      return { files, code: code.toString(), gzip: gzipSync(code, { level: 9 }).length }
    } finally {
      rmSync(outDir, { recursive: true, force: true })
    }
  }

  const withLayer = await entry([])
  const withoutLayer = await entry([stub])
  test.info().annotations.push({ type: 'main bundle, gzipped', description: `${withoutLayer.gzip} without the layer, ${withLayer.gzip} with it` })

  expect(withLayer.files.some((file) => file.startsWith('waterScene-')), 'the scene is its own chunk').toBe(true)
  expect(withLayer.files.some((file) => file.startsWith('motionLayer-')), 'the motion layer is its own chunk').toBe(true)
  expect(withLayer.code, 'three is not in the main bundle').not.toContain('WebGLRenderer')
  expect(withLayer.code, 'nor are the scene’s shaders').not.toContain('float caustic(vec2')
  expect(withLayer.gzip - withoutLayer.gzip, `the main bundle: ${withoutLayer.gzip} → ${withLayer.gzip} bytes gzipped`).toBeLessThanOrEqual(2048)
})
