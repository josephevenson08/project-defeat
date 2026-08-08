// Ingests per-spec gem and enchant recommendations from the Wowhead enchants-and-gems guides.
//
// These do not live in the BiS gear guides. A discovery pass over all 24 of those found no gem or
// enchant section at all — every heading is a gear slot, plus Aldor/Scryer and hunter ammunition.
// They are published separately at `<class>/<spec>/<role>-enchants-gems-pve`, which carries two
// summary tables: best gem per socket colour, and best enchant per slot.
//
// Resolving the references is the awkward part, because the two sides do not share a key:
//
//   * Gems are `[item=…]` and match the gem catalogue's `wowItemId` directly.
//   * Enchants are `[item=…]` for some slots and `[spell=…]` for others. wowsims' enchant `ID` is
//     usually an item id but occasionally a spell id, so a straight id match resolves only some of
//     them. The rest are bridged by name: Wowhead's spell page gives the enchant's real name, and
//     that matches the catalogue.
//
// That bridge is not ceremony either. Spell 27927 is "Enchant Ring - Stats"; matching it by id
// proximity would have picked "Ring - Striking", a different enchant.
//
// Run: node tools/ingest/ingest-bis-recommendations.mjs
// Writes: src/domain/bis/bisRecommendations.json

import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BIS_GUIDES, GUIDE_BASE } from './bis-guides.mjs'
import { unescapePage } from './bis-fetch.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const CACHE = resolve(HERE, '.cache/enchants-gems')
const SPELL_CACHE = resolve(HERE, '.cache/spells')
const OUT_PATH = resolve(REPO, 'src/domain/bis/bisRecommendations.json')

/** Guide's socket label -> this repo's SocketColor. */
const SOCKET_BY_LABEL = {
  'meta gem': 'Meta',
  meta: 'Meta',
  'red gem': 'Red',
  red: 'Red',
  'yellow gem': 'Yellow',
  yellow: 'Yellow',
  'blue gem': 'Blue',
  blue: 'Blue',
}

/** Guide's enchant slot label -> this repo's GearSlot. */
const SLOT_BY_LABEL = {
  head: 'Head',
  shoulder: 'Shoulders',
  shoulders: 'Shoulders',
  back: 'Back',
  cloak: 'Back',
  chest: 'Chest',
  bracer: 'Wrists',
  bracers: 'Wrists',
  wrist: 'Wrists',
  wrists: 'Wrists',
  gloves: 'Hands',
  hands: 'Hands',
  legs: 'Legs',
  leg: 'Legs',
  boots: 'Feet',
  feet: 'Feet',
  weapon: 'Main Hand',
  'main hand': 'Main Hand',
  'two-hand': 'Main Hand',
  '2h weapon': 'Main Hand',
  shield: 'Off Hand',
  'off hand': 'Off Hand',
  offhand: 'Off Hand',
  ring: 'Finger 1',
  rings: 'Finger 1',
}

async function fetchCached(dir, key, url) {
  mkdirSync(dir, { recursive: true })
  const file = resolve(dir, `${key}.html`)
  if (existsSync(file)) return readFileSync(file, 'utf8')
  const res = await fetch(url, { headers: { 'User-Agent': 'project-defeat-bis-recommendations' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  writeFileSync(file, text)
  await new Promise((r) => setTimeout(r, 350))
  return text
}

/** Wowhead's spell page title is `<name> - Spell - TBC Classic`. */
async function spellName(id) {
  const html = await fetchCached(SPELL_CACHE, String(id), `https://www.wowhead.com/tbc/spell=${id}`)
  return html.match(/<title>([^<]*)<\/title>/)?.[1]?.split(' - Spell')[0]?.trim()
}

function normaliseEnchantName(name) {
  return name
    .toLowerCase()
    .replace(/^enchant\s+/, '')
    .replace(/['’]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Reads the two-column summary tables: `[tr][td]label[/td][td][item=N] or [spell=N][/td][/tr]`. */
function parseSummaryTable(body) {
  const rows = []
  for (const row of body.split('[tr]').slice(1)) {
    const cells = [...row.matchAll(/\[td[^\]]*\]([\s\S]*?)\[\/td\]/g)].map((m) => m[1])
    if (cells.length < 2) continue
    const label = cells[0].replace(/\[\/?[a-z][^\]]*\]/gi, '').trim()
    const item = cells[1].match(/\[item=(\d+)/)?.[1]
    const spell = cells[1].match(/\[spell=(\d+)/)?.[1]
    if (!label || (!item && !spell)) continue
    rows.push({ label, itemId: item ? Number(item) : undefined, spellId: spell ? Number(spell) : undefined })
  }
  return rows
}

const gemCatalogue = JSON.parse(readFileSync(resolve(REPO, 'src/domain/gems/gemCatalogue.json'), 'utf8'))
const enchantCatalogue = JSON.parse(readFileSync(resolve(REPO, 'src/domain/enchants/enchantCatalogue.json'), 'utf8'))
const enchantSupplement = JSON.parse(readFileSync(resolve(REPO, 'src/domain/enchants/enchantSupplement.json'), 'utf8'))

/**
 * The supplement carries the enchants wowsims does not model, which is most of what the healer guides
 * recommend. Where an enchant is in both, their *ids* are merged rather than one entry winning:
 * "Bracer - Spellpower" is 22534 to wowsims and 46498 to the guides, and dropping either leaves the
 * recommendation citing an id nothing answers to.
 */
const allEnchants = enchantCatalogue.enchants.map((base) => {
  const extra = enchantSupplement.enchants.find((e) => e.id === base.id)
  if (!extra) return base
  const ids = [base.effectId, ...(base.effectIds ?? []), extra.effectId, ...(extra.effectIds ?? [])]
  return { ...base, effectIds: [...new Set(ids.filter((id) => id !== undefined))].sort((a, b) => a - b) }
})
for (const extra of enchantSupplement.enchants) {
  if (!enchantCatalogue.enchants.some((base) => base.id === extra.id)) allEnchants.push(extra)
}

const gemByWowId = new Map(gemCatalogue.gems.map((g) => [g.wowItemId, g]))
const enchantByName = new Map(allEnchants.map((e) => [normaliseEnchantName(e.name), e]))

// One id lookup over every id an enchant answers to: its applying item, its effect, and the extra
// spell ids TBC's 2.4 re-issues introduced.
const enchantByAnyId = new Map()
for (const enchant of allEnchants) {
  for (const id of [enchant.wowEnchantId, enchant.effectId, ...(enchant.effectIds ?? [])]) {
    if (id !== undefined && !enchantByAnyId.has(id)) enchantByAnyId.set(id, enchant)
  }
}
const enchantByWowId = enchantByAnyId

const bySpec = {}
const problems = []
const bridged = []
const wrongExpansion = []

/**
 * Finds the TBC enchants-and-gems guide for a spec.
 *
 * The path shape is the mirror image of the BiS guides: several classes publish these at the
 * *spec-less* `<class>/dps-enchants-gems-pve` and only a redirect at the spec-specific one. That
 * redirect does not 404 — Wowhead answers it with the **Cataclysm Classic** version of the same
 * guide, which is why the title is checked rather than the status code. Four classes' recommendations
 * were silently sourced from the wrong expansion before this guard existed; they parsed to nothing
 * only because Cataclysm pages are laid out differently, which is luck, not safety.
 */
async function loadGuidePage(guide) {
  const specPath = guide.path.replace('-bis-gear-pve-phase-2', '-enchants-gems-pve')
  const classPath = specPath.replace(/^([a-z]+)\/[a-z-]+\//, '$1/')

  for (const path of [...new Set([specPath, classPath])]) {
    let html
    try {
      html = await fetchCached(CACHE, path.replaceAll('/', '_'), GUIDE_BASE + path)
    } catch {
      continue
    }
    // TBC pages carry either "TBC Classic" or "Burning Crusade Classic 2.5.1" — both are this
    // expansion, and only one of them is obvious until you look.
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? ''
    if (/TBC Classic|Burning Crusade Classic/i.test(title)) return { page: unescapePage(html), path }
    // Informational, not a failure: the fallback path usually succeeds straight after.
    wrongExpansion.push(`${path}: ${title.split(' - ').slice(-2).join(' - ')}`)
  }
  return undefined
}

for (const guide of BIS_GUIDES) {
  const loaded = await loadGuidePage(guide)
  if (!loaded) {
    problems.push(`${guide.className} ${guide.specs.join('/')}: no TBC enchants-and-gems guide found`)
    continue
  }
  const { page, path } = loaded

  const tables = [...page.matchAll(/\[table[^\]]*\]([\s\S]*?)\[\/table\]/g)].map((m) => parseSummaryTable(m[1]))

  const gems = {}
  const enchants = {}

  for (const rows of tables) {
    for (const row of rows) {
      const label = row.label.toLowerCase()

      const socket = SOCKET_BY_LABEL[label]
      if (socket && row.itemId) {
        const gem = gemByWowId.get(row.itemId)
        if (gem) gems[socket] = gem.id
        else problems.push(`${path}: gem ${row.itemId} (${row.label}) not in catalogue`)
        continue
      }

      const slot = SLOT_BY_LABEL[label.replace(/\s*enchant$/, '')]
      if (!slot) continue

      let enchant = row.itemId ? enchantByWowId.get(row.itemId) : undefined
      if (!enchant && row.spellId) enchant = enchantByWowId.get(row.spellId)

      // Neither id matched, so bridge through the name Wowhead gives the spell.
      if (!enchant && row.spellId) {
        const name = await spellName(row.spellId)
        if (name) {
          enchant = enchantByName.get(normaliseEnchantName(name))
          if (enchant) bridged.push(`${row.spellId} "${name}" -> ${enchant.id}`)
        }
      }

      if (enchant) enchants[slot] = enchant.id
      else problems.push(`${path}: enchant ${row.itemId ?? `spell ${row.spellId}`} (${row.label}) unresolved`)
    }
  }

  for (const spec of guide.specs) {
    bySpec[`${guide.className}|${spec}`] = {
      className: guide.className,
      spec,
      sourceUrl: GUIDE_BASE + path,
      gems,
      enchants,
    }
  }
}

const payload = {
  $schema: 'wowhead tbc phase 2 gem and enchant recommendations',
  generatedBy: 'tools/ingest/ingest-bis-recommendations.mjs',
  specCount: Object.keys(bySpec).length,
  specs: Object.fromEntries(Object.entries(bySpec).sort(([a], [b]) => a.localeCompare(b))),
}

const json = `${JSON.stringify(payload, null, 2)}\n`
const previous = existsSync(OUT_PATH) ? readFileSync(OUT_PATH, 'utf8') : ''
const changed = previous !== json
if (changed) writeFileSync(OUT_PATH, json)

const gemCounts = Object.values(bySpec).map((s) => Object.keys(s.gems).length)
const enchantCounts = Object.values(bySpec).map((s) => Object.keys(s.enchants).length)
const sum = (xs) => xs.reduce((a, b) => a + b, 0)

process.stdout.write(
  [
    `specs      ${Object.keys(bySpec).length}  (${changed ? 'written' : 'unchanged'})`,
    `gems       ${sum(gemCounts)} recommendations, ${Math.min(...gemCounts)}-${Math.max(...gemCounts)} per spec`,
    `enchants   ${sum(enchantCounts)} recommendations, ${Math.min(...enchantCounts)}-${Math.max(...enchantCounts)} per spec`,
    `bridged    ${bridged.length} enchants resolved by name after both ids missed`,
    '',
  ].join('\n'),
)
if (wrongExpansion.length) {
  process.stdout.write(`\nrejected as wrong expansion, fell back to the class-level guide (${wrongExpansion.length}):\n`)
  for (const w of wrongExpansion) process.stdout.write(`  ${w}\n`)
}
if (problems.length) {
  process.stdout.write(`\nPROBLEMS (${problems.length}):\n`)
  for (const p of [...new Set(problems)].slice(0, 20)) process.stdout.write(`  ${p}\n`)
}
