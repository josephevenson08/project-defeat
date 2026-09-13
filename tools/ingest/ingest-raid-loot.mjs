/**
 * Pulls a raid's real loot tables off Wowhead, boss by boss.
 *
 * **This exists because the tables were hand-curated and said so.** `karazhanBosses.ts` carried 45
 * drops across 11 encounters under a header admitting it listed "only the drops that still matter to
 * a Phase 2 raider rather than the full loot table". That was a reasonable call while Karazhan was
 * old content nobody opened; it stopped being one when the raid tab grew a card per encounter, so
 * clicking Attumen showed three rows against a real table of fourteen.
 *
 * Wowhead renders its drop tables from a JSON array embedded in the page — `new Listview({id:
 * 'drops', ..., data:[...]})` — so the numbers here are the site's own, not a reading of rendered
 * HTML and not a reading of anyone's memory. Every row carries the real `wowItemId`, which is the
 * field the rest of this repo joins on.
 *
 * Usage:
 *   node tools/ingest/ingest-raid-loot.mjs karazhan
 *
 * Writes tools/ingest/data/raid-loot.<raid>.json — the sourced record. Turning that into the typed
 * `loot` arrays is a separate step, because those files also carry hand-written mechanics prose that
 * no scrape should ever overwrite.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const OUT = resolve(HERE, 'data')

/**
 * The zone each raid's encounters must sit in, asserted per fetch.
 *
 * **This is not belt-and-braces, it caught a real mistake.** Kael'thas Sunstrider has two NPC entries
 * — 19622 in Tempest Keep and 24664 in Sunwell Plateau — and the Sunwell one has the *larger* loot
 * table, so "pick the id with the most drops" would have filled Tempest Keep with Phase 5 gear.
 * Al'ar was worse: a search for the name surfaced 19516, which is Void Reaver. A name match and a
 * drop count are both satisfiable by the wrong NPC; the zone is what actually pins it.
 */
const RAID_ZONES = {
  karazhan: 3457,
  'gruuls-lair': 3923,
  'magtheridons-lair': 3836,
  'serpentshrine-cavern': 3607,
  'tempest-keep': 3845,
}

/**
 * Where each encounter's loot actually lives, which is not always the boss.
 *
 * Two cases in Karazhan alone, and both are the kind of thing that silently yields an empty table:
 * the Opera Event is **three different encounters** sharing one slot in our data, and the Wizard of
 * Oz variant drops from The Crone rather than from Dorothee; the Chess Event drops nothing at all,
 * because its reward is a **chest object** you loot afterwards.
 *
 * Every id here came from Wowhead's own search rather than from memory — see the `npc=` and
 * `object=` ids, each of which was confirmed against the page title before being written down.
 */

const RAIDS = {
  'gruuls-lair': {
    'high-king-maulgar': [['npc', 18831, 'high-king-maulgar']],
    'gruul-the-dragonkiller': [['npc', 19044, 'gruul-the-dragonkiller']],
  },
  'magtheridons-lair': {
    // 21174 is a second Magtheridon entry with no zone; 17257 is the one standing in the Lair.
    magtheridon: [['npc', 17257, 'magtheridon']],
  },
  'serpentshrine-cavern': {
    'hydross-the-unstable': [['npc', 21216, 'hydross-the-unstable']],
    'the-lurker-below': [['npc', 21217, 'the-lurker-below']],
    'leotheras-the-blind': [['npc', 21215, 'leotheras-the-blind']],
    'fathom-lord-karathress': [['npc', 21214, 'fathom-lord-karathress']],
    'morogrim-tidewalker': [['npc', 21213, 'morogrim-tidewalker']],
    'lady-vashj': [['npc', 21212, 'lady-vashj']],
  },
  'tempest-keep': {
    // 19514, not the 19516 a name search offers first — that one is Void Reaver.
    alar: [['npc', 19514, 'alar']],
    'void-reaver': [['npc', 19516, 'void-reaver']],
    'high-astromancer-solarian': [['npc', 18805, 'high-astromancer-solarian']],
    // 19622, not 24664: the latter is the Sunwell Plateau Kael'thas and drops Phase 5 gear.
    'kaelthas-sunstrider': [['npc', 19622, 'kaelthas-sunstrider']],
  },
  karazhan: {
    'attumen-the-huntsman': [['npc', 16152, 'attumen-the-huntsman']],
    moroes: [['npc', 15687, 'moroes']],
    'maiden-of-virtue': [['npc', 16457, 'maiden-of-virtue']],
    // Big Bad Wolf, Romulo & Julianne, and Wizard of Oz — whichever the tower rolls that week.
    'opera-event': [
      ['npc', 17521, 'the-big-bad-wolf'],
      ['npc', 17534, 'julianne'],
      ['npc', 18168, 'the-crone'],
    ],
    'the-curator': [['npc', 15691, 'the-curator']],
    'terestian-illhoof': [['npc', 15688, 'terestian-illhoof']],
    'shade-of-aran': [['npc', 16524, 'shade-of-aran']],
    netherspite: [['npc', 15689, 'netherspite']],
    'chess-event': [['object', 185119, 'dust-covered-chest']],
    'prince-malchezaar': [['npc', 15690, 'prince-malchezaar']],
    nightbane: [['npc', 17225, 'nightbane']],
  },
}

/**
 * Rows that are on the table but are not what anyone means by "what drops here".
 *
 * Badge of Justice drops off every boss and is a currency rather than a piece of loot — including it
 * would put the same row on all eleven cards. The Darkmoon cards are a world-drop deck that happens
 * to be lootable in a raid. The existing hand-written data carried neither, and that was right.
 */
const NOT_LOOT = /^Badge of Justice$|^(Ace|Two|Three|Four|Five|Six|Seven|Eight) of (Lunacy|Blessings|Storms|Furies)$/

/** Quality 3 is Rare. Below that is cloth, motes and grey vendor trash. */
const MIN_QUALITY = 3

/**
 * Lifts the balanced `data:[...]` array out of a Wowhead listview.
 *
 * Balanced rather than regex-matched: the rows contain nested objects with their own brackets, and a
 * lazy match truncates the array at the first inner `]` — which reads as "this boss drops four
 * things" rather than as a parse failure.
 */
function listviewData(html, listId) {
  const at = html.indexOf(`id: '${listId}'`)
  if (at === -1) return undefined
  const start = html.indexOf('data:[', at) + 'data:'.length
  let depth = 0
  for (let index = start; index < html.length; index += 1) {
    const character = html[index]
    if (character === '[') depth += 1
    else if (character === ']') {
      depth -= 1
      if (depth === 0) return JSON.parse(html.slice(start, index + 1))
    }
  }
  return undefined
}

async function dropsFor(kind, id, slug, expectedZone) {
  const url = `https://www.wowhead.com/tbc/${kind}=${id}/${slug}`
  const response = await fetch(url, { headers: { 'user-agent': 'project-defeat ingest' } })
  if (!response.ok) throw new Error(`${url} → HTTP ${response.status}`)
  const html = await response.text()

  /*
   * Refuse an NPC standing somewhere else, rather than quietly importing its loot. Objects carry no
   * zone on the page, so they are trusted on their id — a chest is not a name that repeats.
   */
  if (kind === 'npc' && expectedZone !== undefined) {
    const zones = (html.match(/"location":\[([\d,]+)\]/) || [])[1]
    const found = zones ? zones.split(',').map(Number) : []
    if (!found.includes(expectedZone)) {
      throw new Error(`${url} → sits in zone ${found.join('/') || 'none'}, expected ${expectedZone}. Wrong NPC id.`)
    }
  }

  // An NPC lists `drops`; a chest lists what it `contains`.
  const rows = listviewData(html, 'drops') ?? listviewData(html, 'contains')
  if (!rows) throw new Error(`${url} → no drops/contains listview; page shape changed`)

  return rows
    .filter((row) => !row.commondrop && (row.quality ?? 0) >= MIN_QUALITY && !NOT_LOOT.test(row.name))
    .map((row) => {
      const mode = row.modes && (row.modes['0'] || row.modes['3'])
      return {
        wowItemId: row.id,
        name: row.name,
        quality: row.quality,
        dropChance: mode && mode.outof ? Number(((100 * mode.count) / mode.outof).toFixed(1)) : undefined,
        source: url,
      }
    })
}

const raidId = process.argv[2]
const raid = RAIDS[raidId]
if (!raid) {
  console.error(`Usage: node tools/ingest/ingest-raid-loot.mjs <${Object.keys(RAIDS).join('|')}>`)
  process.exit(1)
}

const result = {}
let total = 0

for (const [bossId, sources] of Object.entries(raid)) {
  const merged = new Map()
  for (const [kind, id, slug] of sources) {
    for (const drop of await dropsFor(kind, id, slug, RAID_ZONES[raidId])) {
      // First sighting wins, so an item shared by two Opera variants is listed once.
      if (!merged.has(drop.wowItemId)) merged.set(drop.wowItemId, drop)
    }
  }
  const drops = [...merged.values()].sort((a, b) => a.name.localeCompare(b.name))
  result[bossId] = drops
  total += drops.length
  console.log(`  ${bossId.padEnd(24)} ${String(drops.length).padStart(3)} drops`)
}

mkdirSync(OUT, { recursive: true })
const path = resolve(OUT, `raid-loot.${raidId}.json`)
writeFileSync(
  path,
  `${JSON.stringify({ raidId, fetchedAt: new Date().toISOString().slice(0, 10), source: 'wowhead.com/tbc', bosses: result }, null, 2)}\n`,
)
console.log(`\n${total} drops written to ${path.replace(REPO, '.')}`)
