// Reads spell and item facts off Wowhead so they can be transcribed by hand. Prints; writes nothing.
//
// This exists because the buff and set-bonus data in this repo is deliberately *not* ingested.
// Automated parsing of these two datasets was tried three ways and abandoned (see HANDOFF.md): the
// tooltips are prose, written 33 different ways, and a parser that widens enough to catch them all
// starts matching the wrong number — "Summons a Mana Spring Totem with 5 health ... that restores 20
// mana every 2 seconds" hands a regex the 5. A human reads 20-per-2s and writes 50 mp5.
//
// So this tool does the half a machine is good at — fetching, decoding, and picking the right spell
// out of a name collision — and leaves the reading to a person. Every value it surfaces still has to
// be transcribed deliberately into `src/domain`, with the id it came from recorded alongside it.
//
// Run:
//   node tools/ingest/wowhead-lookup.mjs --spell-name "Mana Spring Totem"   # ranks, levels, classes
//   node tools/ingest/wowhead-lookup.mjs --spell 25570 2825                 # spell tooltips
//   node tools/ingest/wowhead-lookup.mjs --item 30118 30113                 # item tooltips + set bonuses
//   node tools/ingest/wowhead-lookup.mjs --set destroyer-battlegear         # resolves a setId first

import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const CACHE = resolve(HERE, '.cache/wowhead-lookup')

/** Wowhead 403s once a run makes several rapid requests, so every fetch is cached and paced. */
const REQUEST_SPACING_MS = 1200
let lastFetchAt = 0

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchCached(url, key) {
  mkdirSync(CACHE, { recursive: true })
  const file = resolve(CACHE, `${key}.html`)
  if (existsSync(file)) return readFileSync(file, 'utf8')

  const wait = REQUEST_SPACING_MS - (Date.now() - lastFetchAt)
  if (wait > 0) await sleep(wait)
  lastFetchAt = Date.now()

  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`)
  const html = await res.text()
  writeFileSync(file, html)
  return html
}

/**
 * Listing pages hold their rows in `var listviewspells = [...]`. The `new Listview({... data:
 * listviewspells})` call further down only *references* that variable, so reading the call gets you
 * an identifier rather than data — which is what made an earlier attempt at this come back empty.
 */
function extractRows(html) {
  const at = html.indexOf('var listviewspells')
  if (at === -1) return []
  const open = html.indexOf('[', at)
  const end = matchBracket(html, open)
  return end === -1 ? [] : JSON.parse(quoteBareKeys(html.slice(open, end)))
}

function matchBracket(src, open) {
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = open; i < src.length; i++) {
    const ch = src[i]
    if (escaped) { escaped = false; continue }
    if (ch === '\\') { escaped = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '[') depth++
    else if (ch === ']') { depth--; if (depth === 0) return i + 1 }
  }
  return -1
}

/**
 * The rows are JS object literals, not JSON — Wowhead leaves some keys unquoted (`quality:-1`).
 * Quote them, but only outside string literals: spell names legitimately contain a colon
 * ("Power Word: Fortitude"), and a blind regex corrupts them.
 */
function quoteBareKeys(src) {
  let out = ''
  let inString = false
  let escaped = false
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (escaped) { out += ch; escaped = false; continue }
    if (ch === '\\') { out += ch; escaped = true; continue }
    if (ch === '"') { out += ch; inString = !inString; continue }
    if (inString) { out += ch; continue }
    if ((ch === '{' || ch === ',') && /[A-Za-z_]/.test(src[i + 1] ?? '')) {
      const key = src.slice(i + 1).match(/^[A-Za-z0-9_]+/)[0]
      if (src[i + 1 + key.length] === ':') {
        out += `${ch}"${key}"`
        i += key.length
        continue
      }
    }
    out += ch
  }
  return out
}

/** Detail pages carry the rendered tooltip in `g_spells[<id>].tooltip_enus` / `g_items[...]`. */
function extractTooltip(html, kind, id) {
  const at = html.indexOf(`g_${kind}[${id}].tooltip_enus`)
  if (at === -1) return null
  const open = html.indexOf('"', at)
  let escaped = false
  for (let i = open + 1; i < html.length; i++) {
    const ch = html[i]
    if (escaped) { escaped = false; continue }
    if (ch === '\\') { escaped = true; continue }
    if (ch === '"') return JSON.parse(html.slice(open, i + 1))
  }
  return null
}

function toText(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(div|tr|table|p|span)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
}

async function printSpellName(name) {
  const url = `https://www.wowhead.com/tbc/spells/name:${encodeURIComponent(name).replace(/%20/g, '+')}`
  const rows = extractRows(await fetchCached(url, `name-${slugify(name)}`))
  const matches = rows.filter((row) => (row.name ?? '').toLowerCase().includes(name.toLowerCase()))

  console.log(`\n${name} — ${matches.length} of ${rows.length} rows match`)
  console.log('  Pick the highest rank at level <= 70 that requires a class. Rows with no rank and no')
  console.log('  class skill are usually an NPC copy of the spell, carrying quite different numbers.')
  for (const row of matches.sort((a, b) => (a.level ?? 0) - (b.level ?? 0))) {
    console.log(
      [
        String(row.id).padStart(7),
        (row.name ?? '').padEnd(32),
        `rank=${String(row.rank ?? '—').padEnd(8)}`,
        `lvl=${String(row.level ?? '—').padStart(3)}`,
        row.skill?.length ? 'class-trained' : '',
      ].join('  '),
    )
  }
}

async function printTooltip(kind, id) {
  const singular = kind === 'items' ? 'item' : 'spell'
  const html = await fetchCached(`https://www.wowhead.com/tbc/${singular}=${id}`, `${singular}-${id}`)
  const tip = extractTooltip(html, kind, id)
  console.log(`\n===== ${singular} ${id} =====\n${tip ? toText(tip) : '(no tooltip found)'}`)
}

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-')

/** Resolves a domain setId to one of its Wowhead item ids, since an item tooltip carries the set bonuses. */
function itemIdForSet(setId) {
  const catalogue = JSON.parse(readFileSync(resolve(REPO, 'src/domain/gear/itemCatalogue.json'), 'utf8'))
  const piece = (catalogue.items ?? catalogue).find((item) => item.setId === setId && item.wowItemId)
  if (!piece) throw new Error(`no catalogued item carries setId "${setId}"`)
  return piece.wowItemId
}

const argv = process.argv.slice(2)
const flag = argv[0]
const rest = argv.slice(1)

if (!flag || rest.length === 0) {
  console.error('usage: --spell-name <name> | --spell <id>... | --item <id>... | --set <setId>...')
  process.exit(1)
}

if (flag === '--spell-name') {
  await printSpellName(rest.join(' '))
} else if (flag === '--spell') {
  for (const id of rest) await printTooltip('spells', Number(id))
} else if (flag === '--item') {
  for (const id of rest) await printTooltip('items', Number(id))
} else if (flag === '--set') {
  for (const setId of rest) {
    const id = itemIdForSet(setId)
    console.log(`\n(${setId} -> item ${id})`)
    await printTooltip('items', id)
  }
} else {
  console.error(`unknown flag "${flag}"`)
  process.exit(1)
}
