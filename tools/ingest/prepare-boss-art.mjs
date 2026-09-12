/**
 * Turns a folder of hand-made boss artwork into the per-encounter panels the raid detail view looks
 * for, named by boss id.
 *
 * The owner's folder is organised the way a person organises things — `Karazhan/Shade of Aran.jpg`,
 * `mags/mag.jpg` — and the app needs `public/raids/bosses/shade-of-aran.jpg`. So this slugifies each
 * filename and matches it against the real boss ids of the raid its folder names, which means **a new
 * image only has to be named after its boss to be picked up**. Serpentshrine and Tempest Keep have no
 * art yet; dropping `Serpentshrine/Lady Vashj.jpg` in and re-running is the whole procedure.
 *
 * **A file it cannot place is an error, not a skip.** Silently ignoring an unmatched name is how you
 * end up with art that never reaches the screen and nobody notices for a month — the same
 * reachability failure this repo has hit twice. It prints what it could not match and exits.
 *
 * Images are also brought down to `MAX_WIDTH`, because the card that shows them is 582px and the
 * lesson from the raid reel is that a box which magnifies its art is both blurry and slow. Anything
 * above twice the card is bytes nobody sees.
 *
 * Usage:
 *   node tools/ingest/prepare-boss-art.mjs ["images for raid bosses"]
 *
 * Writes public/raids/bosses/<boss-id>.jpg
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const SOURCE = resolve(REPO, process.argv[2] ?? 'images for raid bosses')
const OUT = resolve(REPO, 'public/raids/bosses')

/**
 * Twice the 582px card, so a 2x display is served at 1:1 and everything else downsamples.
 *
 * Deliberately not "as large as it came". The five raid panels cost 1.6 MB between them; thirteen
 * boss panels at their original size would cost more than twice that for pictures shown at half the
 * size, and `public/` is checked in.
 */
const MAX_WIDTH = 1200

/** JPEG quality for the output. */
const QUALITY = 0.88

/** Which raid each source folder holds, keyed by the folder name lowercased. */
const RAID_FOLDERS = {
  karazhan: 'karazhan',
  gruuls: 'gruuls-lair',
  "gruul's lair": 'gruuls-lair',
  'gruuls-lair': 'gruuls-lair',
  mags: 'magtheridons-lair',
  magtheridon: 'magtheridons-lair',
  "magtheridon's lair": 'magtheridons-lair',
  'magtheridons-lair': 'magtheridons-lair',
  ssc: 'serpentshrine-cavern',
  serpentshrine: 'serpentshrine-cavern',
  'serpentshrine-cavern': 'serpentshrine-cavern',
  tk: 'tempest-keep',
  'tempest-keep': 'tempest-keep',
  'tempest keep': 'tempest-keep',
}

/**
 * Filenames that do not slugify to their boss id.
 *
 * Short-hand the owner used (`mag`, `maiden`), plus one file that arrived with a generated name.
 * **`grok-image-8b0e…` was identified by looking at it**, not by position in the folder: it is an
 * armoured warrior carrying a great axe with a dark horned steed behind him, which is Attumen the
 * Huntsman — Karazhan's only other unillustrated encounter, Nightbane, is a skeletal dragon. The
 * raid-art ingest learned this lesson the expensive way and nearly put Kael'thas behind Karazhan.
 */
const ALIASES = {
  mag: 'magtheridon',
  maiden: 'maiden-of-virtue',
  moroes: 'moroes',
  'grok-image-8b0e7773-1abd-4bec-8604-600170e995c8': 'attumen-the-huntsman',
}

/** Reads a JPEG's width from its SOF marker, so nothing has to be decoded to decide whether to resize. */
function jpegWidth(bytes) {
  let index = 2
  while (index < bytes.length - 8) {
    if (bytes[index] !== 0xff) {
      index += 1
      continue
    }
    const marker = bytes[index + 1]
    const isStartOfFrame = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
    if (isStartOfFrame) return bytes.readUInt16BE(index + 7)
    index += 2 + bytes.readUInt16BE(index + 2)
  }
  return Number.POSITIVE_INFINITY
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// The boss ids, read from the domain data rather than restated, so a rename cannot drift. One file
// per raid — `karazhanBosses.ts` and so on — each holding `id` immediately above its `raidId`.
const bossIdsByRaid = new Map()
{
  const raidsDir = resolve(REPO, 'src/domain/raids')
  for (const file of readdirSync(raidsDir).filter((name) => name.endsWith('Bosses.ts'))) {
    const source = readFileSync(join(raidsDir, file), 'utf8')
    for (const match of source.matchAll(/id:\s*'([a-z0-9-]+)',\s*\n\s*name:[^\n]*\n\s*raidId:\s*'([a-z0-9-]+)'/g)) {
      const [, bossId, raidId] = match
      if (!bossIdsByRaid.has(raidId)) bossIdsByRaid.set(raidId, new Set())
      bossIdsByRaid.get(raidId).add(bossId)
    }
  }
}
if (!bossIdsByRaid.size) {
  console.error('Could not read any boss ids from src/domain/raids/sampleRaidBosses.ts')
  process.exit(1)
}

if (!existsSync(SOURCE)) {
  console.error(`No source folder at ${SOURCE}`)
  process.exit(1)
}

const jobs = []
const unmatched = []

for (const folder of readdirSync(SOURCE)) {
  const folderPath = join(SOURCE, folder)
  if (!statSync(folderPath).isDirectory()) continue

  const raidId = RAID_FOLDERS[folder.toLowerCase()]
  if (!raidId) {
    unmatched.push(`${folder}/ — no raid known by that folder name`)
    continue
  }
  const bossIds = bossIdsByRaid.get(raidId)
  if (!bossIds) {
    unmatched.push(`${folder}/ — raid '${raidId}' has no bosses in the domain data`)
    continue
  }

  for (const file of readdirSync(folderPath)) {
    if (!/\.(jpe?g|png|webp)$/i.test(file)) continue
    const base = file.slice(0, file.length - extname(file).length)
    const slug = slugify(base)
    const bossId = bossIds.has(slug) ? slug : ALIASES[slug]

    if (!bossId || !bossIds.has(bossId)) {
      unmatched.push(`${folder}/${file} — '${slug}' matches no boss in ${raidId}`)
      continue
    }
    jobs.push({ bossId, raidId, path: join(folderPath, file), label: `${folder}/${file}` })
  }
}

if (unmatched.length) {
  console.error('Could not place these files:\n  ' + unmatched.join('\n  '))
  console.error('\nName a file after its boss, or add an entry to ALIASES. Nothing was written.')
  process.exit(1)
}

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage()

for (const job of jobs) {
  const bytes = readFileSync(job.path)

  /*
   * An image already inside the cap is copied through byte for byte.
   *
   * Re-encoding it would be a second lossy generation for nothing — the first run of this did exactly
   * that and the Karazhan panels came out *larger* than they went in, 309 KB to 314 KB, while quietly
   * losing detail. Only a resize earns a re-encode.
   */
  if (/\.jpe?g$/i.test(job.path) && jpegWidth(bytes) <= MAX_WIDTH) {
    writeFileSync(resolve(OUT, `${job.bossId}.jpg`), bytes)
    console.log(`  ${job.bossId.padEnd(26)} ${'copied'.padEnd(10)} ${(bytes.length / 1024).toFixed(0)} KB   (${job.label})`)
    continue
  }

  const result = await page.evaluate(
    async ({ src, maxWidth, quality }) => {
      const image = new Image()
      await new Promise((done, fail) => {
        image.onload = done
        image.onerror = () => fail(new Error('the browser could not decode that file'))
        // A data URL rather than file://, which counts as cross-origin on about:blank and taints the
        // canvas so toDataURL throws.
        image.src = src
      })

      const scale = Math.min(1, maxWidth / image.naturalWidth)
      const width = Math.round(image.naturalWidth * scale)
      const height = Math.round(image.naturalHeight * scale)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
      context.drawImage(image, 0, 0, width, height)

      return { data: canvas.toDataURL('image/jpeg', quality), width, height }
    },
    { src: `data:image/jpeg;base64,${bytes.toString('base64')}`, maxWidth: MAX_WIDTH, quality: QUALITY },
  )

  const out = Buffer.from(result.data.split(',')[1], 'base64')
  writeFileSync(resolve(OUT, `${job.bossId}.jpg`), out)
  console.log(
    `  ${job.bossId.padEnd(26)} ${String(result.width + 'x' + result.height).padEnd(10)} ` +
      `${(bytes.length / 1024).toFixed(0)} KB -> ${(out.length / 1024).toFixed(0)} KB   (${job.label})`,
  )
}

await browser.close()

// What is still missing, so the gap is named rather than discovered later on screen.
const placed = new Set(jobs.map((job) => job.bossId))
const missing = []
for (const [raidId, bossIds] of bossIdsByRaid) {
  for (const bossId of bossIds) if (!placed.has(bossId)) missing.push(`${raidId}/${bossId}`)
}
console.log(`\nwrote ${jobs.length} boss panels to public/raids/bosses/`)
if (missing.length) console.log(`still without art (${missing.length}):\n  ` + missing.join('\n  '))
