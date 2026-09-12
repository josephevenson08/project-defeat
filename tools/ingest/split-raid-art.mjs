/**
 * Cuts one 3-over-2 boss-art sheet into the five per-raid images the raid picker looks for.
 *
 * **Done in a browser canvas rather than with an image library, on purpose.** Cropping a JPEG means
 * decoding it, and the usual answer is `sharp` — a native dependency with a build step, added to a
 * project that has no image pipeline, to run once. Playwright is already a devDependency and ships a
 * browser that decodes and re-encodes images natively, so this borrows that instead and adds nothing.
 *
 * Usage:
 *   1. Save the sheet as  tools/ingest/data/raid-art-sheet.jpg
 *   2. node tools/ingest/split-raid-art.mjs
 *
 * Writes public/raids/<raid-id>.jpg for all five.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const SHEET = resolve(HERE, 'data/raid-art-sheet.jpg')
const OUT = resolve(REPO, 'public/raids')

/**
 * Where each raid's panel sits on the sheet, as fractions of the whole.
 *
 * **The bottom of every panel is deliberately trimmed.** The sheet has the raid name and its boss
 * burned into the artwork, and the picker draws its own name over the same corner — keeping both
 * would stack two titles on top of each other. Cutting the caption band off means the app's text is
 * the only text, which is also what lets the name follow the app's own typeface and faction theme
 * rather than being frozen in a JPEG.
 *
 * Fractions rather than pixels so a re-render of the sheet at a different size still cuts correctly.
 */
const CAPTION_BAND = 0.1

const PANELS = [
  { id: 'karazhan', x: 0 / 3, y: 0, w: 1 / 3, h: 0.5 },
  { id: 'gruuls-lair', x: 1 / 3, y: 0, w: 1 / 3, h: 0.5 },
  { id: 'magtheridons-lair', x: 2 / 3, y: 0, w: 1 / 3, h: 0.5 },
  { id: 'serpentshrine-cavern', x: 0, y: 0.5, w: 0.5, h: 0.5 },
  { id: 'tempest-keep', x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
]

if (!existsSync(SHEET)) {
  console.error(`No sheet at ${SHEET}`)
  console.error('Save the boss-art image there first, then run this again.')
  process.exit(1)
}

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage()

const crops = await page.evaluate(
  async ({ src, panels, band }) => {
    const image = new Image()
    await new Promise((done, fail) => {
      image.onload = done
      image.onerror = () => fail(new Error('the browser could not decode that file'))
      image.src = src
    })

    return panels.map((panel) => {
      const sx = Math.round(panel.x * image.naturalWidth)
      const sy = Math.round(panel.y * image.naturalHeight)
      const sw = Math.round(panel.w * image.naturalWidth)
      // Trim the burned-in caption so the app's own title is the only one.
      const sh = Math.round(panel.h * image.naturalHeight * (1 - band))

      const canvas = document.createElement('canvas')
      canvas.width = sw
      canvas.height = sh
      canvas.getContext('2d').drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh)

      return { id: panel.id, data: canvas.toDataURL('image/jpeg', 0.86), width: sw, height: sh }
    })
  },
  { src: pathToFileURL(SHEET).href, panels: PANELS, band: CAPTION_BAND },
)

for (const crop of crops) {
  const bytes = Buffer.from(crop.data.split(',')[1], 'base64')
  writeFileSync(resolve(OUT, `${crop.id}.jpg`), bytes)
  console.log(`  ${crop.id}.jpg  ${crop.width}x${crop.height}  ${(bytes.length / 1024).toFixed(0)} KB`)
}

await browser.close()
console.log(`\nwrote ${crops.length} panels to public/raids/`)
