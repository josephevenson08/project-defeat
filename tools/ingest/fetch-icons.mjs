// Downloads the icon artwork named by src/domain/icons/icons.json into public/icons/.
//
// Separate from ingest-icons.mjs on purpose. That script derives the id -> icon-name mapping from
// MIT-licensed upstream data and is safe to run any time; this one pulls ~1,238 JPEGs of Blizzard's
// artwork off Wowhead's CDN and puts them in the repo, which is a deliberate act with a licensing
// dimension. Keeping them apart means regenerating the mapping never silently re-downloads art.
//
// `large` is Wowhead's biggest size at 56x56. The frames that render these are 40-44px, so 56 gives
// a little headroom on a high-DPI display; `medium` at 36x36 would be upscaled and soft.
//
// Idempotent: an icon already on disk is skipped, so a re-run after a partial failure only fetches
// what is missing. This matters more than usual here — the repo lives in OneDrive, and rewriting
// 1,238 identical files would make it re-sync all of them.
//
// Run: node tools/ingest/fetch-icons.mjs [--force]
// Writes: public/icons/<icon-name>.jpg

import { mkdirSync, existsSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { registerHooks } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const OUT_DIR = resolve(REPO, 'public/icons')
const CDN = 'https://wow.zamimg.com/images/wow/icons/large'

const force = process.argv.includes('--force')

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context)
    } catch (err) {
      if (!specifier.startsWith('.')) throw err
      try {
        return nextResolve(`${specifier}.ts`, context)
      } catch {
        return nextResolve(`${specifier}/index.ts`, context)
      }
    }
  },
})

// Two sources, one icon directory. Items and gems come from the generated mapping; talents carry
// their own icon slug in the calculator payload, so they need no mapping step at all. They share the
// CDN path and the same 56x56 "large" size, so they share the fetch and the folder.
const { icons } = JSON.parse(readFileSync(resolve(REPO, 'src/domain/icons/icons.json'), 'utf8'))
const { talentIconNames } = await import(pathToFileURL(resolve(REPO, 'src/domain/talents/sampleTalents.ts')).href)

/*
 * The raid planner's icons join the same fetch rather than getting a downloader of their own: they
 * are the same CDN, the same 56x56 size and the same folder, and splitting them would mean two
 * scripts to run and two places for a missing file to hide. Most of them are already here — the spec
 * icons come from talent artwork this repo vendored long ago, so only the buff icons are new.
 */
const raidcomp = JSON.parse(readFileSync(resolve(REPO, 'src/domain/raidcomp/raidcompIcons.json'), 'utf8'))
const raidcompNames = [
  ...Object.values(raidcomp.spellIcons).map((entry) => entry.icon),
  ...Object.values(raidcomp.specIcons).map((entry) => entry.icon),
  // The Feral split and Dreamstate are raid *builds* rather than specs, so their icons live in their
  // own map. Forgetting them here left the bear paw named but never downloaded.
  ...Object.values(raidcomp.buildIcons),
]

const itemNames = new Set(Object.values(icons))

/*
 * Professions are the fourth source. Their trade-skill artwork is not item artwork, so nothing in
 * the generated item mapping covers it -- the tab drew no icons at all until this was added.
 */
const { professionIconNames } = await import(pathToFileURL(resolve(REPO, 'src/domain/professions/sampleProfessions.ts')).href)

/*
 * Materials are the fifth source, and the artwork is item artwork this time -- but trade goods are
 * not in the item catalogue, so the generated id->icon mapping does not reach them. They come from
 * `materialIcons.json`, which joins by name instead. Without this the profession pages named every
 * herb and ore and drew none of them.
 */
const materialIcons = JSON.parse(
  readFileSync(resolve(REPO, 'src/domain/professions/materialIcons.json'), 'utf8'),
)
const materialIconNames = Object.values(materialIcons.materials).map((entry) => entry.icon)

/*
 * The computed crafting paths are the sixth source, and much the largest of the profession ones: a
 * levelling path names every reagent it consumes and every item it makes, which is 324 distinct
 * icons across the nine professions. They come from the recipe ingest rather than a lookup, so a
 * reagent the name-keyed material map has never heard of still arrives with its artwork.
 */
const craftingPaths = JSON.parse(
  readFileSync(resolve(REPO, 'src/domain/professions/craftingPaths.json'), 'utf8'),
)
const craftingIconNames = Object.values(craftingPaths.paths)
  .flat()
  .flatMap((step) => [step.createsIcon, ...step.materials.map((material) => material.icon)])
  .filter(Boolean)

const names = [
  ...new Set([
    ...itemNames,
    ...talentIconNames,
    ...raidcompNames,
    ...professionIconNames,
    ...materialIconNames,
    ...craftingIconNames,
  ]),
].sort()
console.log(
  `${itemNames.size} item/gem + ${talentIconNames.length} talent + ${raidcompNames.length} raidcomp + ${professionIconNames.length} profession + ${materialIconNames.length} material + ${craftingIconNames.length} crafting icons -> ${names.length} distinct`,
)

mkdirSync(OUT_DIR, { recursive: true })

const todo = names.filter((name) => force || !existsSync(resolve(OUT_DIR, `${name}.jpg`)))
console.log(`${names.length} distinct icons, ${todo.length} to fetch, ${names.length - todo.length} already present`)

const failed = []
let done = 0

async function fetchOne(name) {
  const target = resolve(OUT_DIR, `${name}.jpg`)
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${CDN}/${name}.jpg`, { headers: { 'User-Agent': 'project-defeat-icon-fetch' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      // A CDN error page would also be "successful" bytes; a real 56x56 icon is never this small.
      if (buf.length < 500) throw new Error(`suspiciously small (${buf.length} bytes)`)
      writeFileSync(target, buf)
      return
    } catch (err) {
      if (attempt === 3) {
        failed.push(`${name}: ${err.message}`)
        return
      }
      await new Promise((r) => setTimeout(r, 400 * attempt))
    }
  }
}

// Modest concurrency. This is a CDN rather than the rate-limited Wowhead app servers, but there is
// no reason to open 100 sockets at a stranger's expense to save twenty seconds.
const CONCURRENCY = 8
const queue = [...todo]
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (;;) {
      const name = queue.pop()
      if (!name) return
      await fetchOne(name)
      done++
      if (done % 100 === 0) console.log(`  ${done}/${todo.length}`)
    }
  }),
)

const present = names.filter((name) => existsSync(resolve(OUT_DIR, `${name}.jpg`)))
const bytes = present.reduce((total, name) => total + statSync(resolve(OUT_DIR, `${name}.jpg`)).size, 0)

console.log(`${present.length}/${names.length} icons on disk, ${(bytes / 1024 / 1024).toFixed(1)} MB total`)
if (failed.length > 0) {
  console.log(`FAILED (${failed.length}):`)
  for (const line of failed.slice(0, 20)) console.log(`  ${line}`)
  process.exitCode = 1
}
