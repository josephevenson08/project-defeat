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
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const OUT_DIR = resolve(REPO, 'public/icons')
const CDN = 'https://wow.zamimg.com/images/wow/icons/large'

const force = process.argv.includes('--force')

const { icons } = JSON.parse(readFileSync(resolve(REPO, 'src/domain/icons/icons.json'), 'utf8'))
const names = [...new Set(Object.values(icons))].sort()

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
