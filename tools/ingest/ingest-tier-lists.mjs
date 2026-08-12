// Ingests Wowhead's three TBC Classic Phase 2 spec tier lists — DPS, healer and tank.
//
// What this takes and what it deliberately leaves behind
// ------------------------------------------------------
// It takes the *facts*: which tier letter a spec sits in, on which of the three lists. It does not
// take Wowhead's analysis prose — the per-spec commentary and the "what S-tier means" definitions are
// their authored writing, not data, so each list carries `sourceUrl` back to the page instead. That is
// a copyright line, and it is also why there is no `note` field per spec to quietly fill with a
// paraphrase later.
//
// These rank *specs*, not items. Nothing here can or should drive the per-slot BiS lists.
//
// The pages are Wowhead guides, so the BBCode-in-served-HTML trick applies (see bis-fetch.mjs). The
// tier structure is markup rather than prose, which makes it far less fragile than the BiS parsing:
//
//   [tier-list=rows]
//     [tier]
//       [tier-label bg=q5]S[/tier-label]
//       [tier-content] [url ...][filter-target=...][spec-badge=arcane-mage][/filter-target][/url] ...
//
// Read the spec from `[spec-badge=...]`, never from the `[url guide= hash=]` around it. On the healer
// page the Discipline Priest badge sits inside a link whose hash is `holy-priest`, because Wowhead
// publishes one shared Priest healing guide — trusting the hash would file Discipline under Holy and
// silently lose a spec.

import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { registerHooks } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const CACHE = resolve(HERE, '.cache/tierlists')
const OUT = resolve(REPO, 'src/domain/tierlists/tierLists.json')
const BASE = 'https://www.wowhead.com/tbc/guide/'

// The app's imports are extensionless because Vite resolves them; Node ESM will not. Same hook the
// other scripts that read app code use.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context)
    } catch (err) {
      if (specifier.startsWith('.')) return nextResolve(`${specifier}.ts`, context)
      throw err
    }
  },
})

// pathToFileURL, not a bare path: Windows drive letters parse as a URL scheme otherwise.
const { tbcClasses } = await import(pathToFileURL(resolve(REPO, 'src/domain/character/tbcClasses.ts')).href)

/**
 * The three lists. `role` is Wowhead's axis, which is not the app's `CharacterRole` — Feral Druid is
 * `Physical DPS` to the app but appears on both the DPS and the tank list here, at different tiers.
 * That is the whole reason placements are keyed by (role, spec) rather than by spec.
 */
const PAGES = [
  { role: 'DPS', slug: 'dps-rankings-tier-list-pve-burning-crusade-classic-wow' },
  { role: 'Healer', slug: 'healer-rankings-tier-list-pve-burning-crusade-classic-wow' },
  { role: 'Tank', slug: 'tank-rankings-tier-list-pve-burning-crusade-classic-wow' },
]

async function fetchCached(slug) {
  mkdirSync(CACHE, { recursive: true })
  const file = resolve(CACHE, `${slug}.html`)
  if (existsSync(file)) return readFileSync(file, 'utf8')

  const res = await fetch(BASE + slug, { headers: { 'User-Agent': 'project-defeat-tierlist-ingest' } })
  if (!res.ok) throw new Error(`${slug}: HTTP ${res.status}`)
  const html = await res.text()
  writeFileSync(file, html)
  await new Promise((r) => setTimeout(r, 600))
  return html
}

/** Same unescape the BiS scripts use: the BBCode source is escaped inside the page's JSON payload. */
function unescapePage(raw) {
  return raw.replaceAll('\\/', '/').replaceAll('\\"', '"').replaceAll('\\r\\n', '\n').replaceAll('\\n', '\n')
}

/** `beast-mastery-hunter` -> { className: 'Hunter', spec: 'Beast Mastery' }, validated against the app. */
function specFromSlug(slug) {
  const parts = slug.split('-')
  const classWord = parts.at(-1)
  const specWords = parts.slice(0, -1)
  if (!classWord || specWords.length === 0) throw new Error(`unparseable spec-badge slug: ${slug}`)

  const titleCase = (words) => words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const className = titleCase([classWord])
  const spec = titleCase(specWords)

  // Validated, not trusted: a Wowhead rename should stop the run, not write a spec the app has no
  // concept of into the domain.
  const definition = tbcClasses.find((entry) => entry.className === className)
  if (!definition) throw new Error(`spec-badge "${slug}" names class "${className}", which the app does not have`)
  if (!definition.specs.includes(spec)) {
    throw new Error(`spec-badge "${slug}" names spec "${spec}", which is not one of ${className}'s (${definition.specs.join(', ')})`)
  }
  return { className, spec }
}

function parseTiers(page, slug) {
  const listBlock = page.match(/\[tier-list=rows\]([\s\S]*?)\[\/tier-list\]/)?.[1]
  if (!listBlock) throw new Error(`${slug}: no [tier-list=rows] block found`)

  const tiers = []
  for (const block of listBlock.matchAll(/\[tier\]([\s\S]*?)\[\/tier\]/g)) {
    const body = block[1]
    // The label carries a `bg=qN` attribute, so it is not a bare [tier-label] tag.
    const label = body.match(/\[tier-label[^\]]*\]([\s\S]*?)\[\/tier-label\]/)?.[1]?.replace(/\[[^\]]*\]/g, '').trim()
    if (!label) throw new Error(`${slug}: a [tier] block has no readable [tier-label]`)

    const placements = [...body.matchAll(/\[spec-badge=([a-z-]+)\]/g)].map((m) => ({ slug: m[1], ...specFromSlug(m[1]) }))
    if (placements.length === 0) throw new Error(`${slug}: tier "${label}" has no [spec-badge] entries`)
    tiers.push({ label, placements })
  }
  if (tiers.length === 0) throw new Error(`${slug}: [tier-list=rows] contained no [tier] blocks`)
  return tiers
}

const lists = []
for (const { role, slug } of PAGES) {
  const html = await fetchCached(slug)
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1]?.trim() ?? ''

  // Two guards, both learned the hard way elsewhere in this repo. Wowhead answers some TBC guide URLs
  // with the Cataclysm version rather than a 404, so the status code proves nothing; and these pages
  // get rewritten in place each phase, so a silent Phase 3 update would otherwise be ingested as if it
  // were still the Phase 2 the rest of this app targets.
  if (!/Burning Crusade Classic|TBC Classic/i.test(title)) throw new Error(`${slug}: not a TBC page — title was "${title}"`)
  if (!/Phase 2/i.test(title)) throw new Error(`${slug}: expected a Phase 2 list — title was "${title}"`)

  lists.push({
    role,
    title,
    sourceUrl: BASE + slug,
    phase: 2,
    // Source order is preserved, but Wowhead does not rank within a tier and neither does this data.
    tiers: parseTiers(unescapePage(html), slug),
  })
}

const placementCount = lists.reduce((n, l) => n + l.tiers.reduce((m, t) => m + t.placements.length, 0), 0)

// Coverage check. The union across the three lists should be every spec the app knows about; a spec
// missing from all three means Wowhead dropped it or a slug stopped parsing, and either way the view
// would show a gap with no explanation.
const covered = new Set(lists.flatMap((l) => l.tiers.flatMap((t) => t.placements.map((p) => `${p.className}|${p.spec}`))))
const missing = tbcClasses.flatMap((c) => c.specs.map((s) => `${c.className}|${s}`)).filter((key) => !covered.has(key))

const payload = {
  $schema: 'wowhead tbc spec tier-list ingestion',
  upstream: {
    site: 'wowhead.com',
    expansion: 'TBC Classic',
    phase: 2,
    note: 'Tier letters and spec placements only. Wowhead\'s per-spec analysis and tier definitions are their authored prose and are deliberately not copied; each list carries sourceUrl instead.',
  },
  generatedBy: 'tools/ingest/ingest-tier-lists.mjs',
  listCount: lists.length,
  placementCount,
  specsCovered: covered.size,
  lists,
}

mkdirSync(dirname(OUT), { recursive: true })
const next = `${JSON.stringify(payload, null, 2)}\n`
const changed = !existsSync(OUT) || readFileSync(OUT, 'utf8') !== next
if (changed) writeFileSync(OUT, next)

console.log(`${lists.length} lists, ${placementCount} placements, ${covered.size} distinct specs covered`)
for (const list of lists) {
  console.log(`  ${list.role.padEnd(7)} ${list.tiers.map((t) => `${t.label}:${t.placements.length}`).join(' ')}`)
}
console.log(missing.length === 0 ? '  every app spec appears on at least one list' : `  MISSING: ${missing.join(', ')}`)
console.log(changed ? `  wrote ${OUT}` : '  0 written (unchanged)')
