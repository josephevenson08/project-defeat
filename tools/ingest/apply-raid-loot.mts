/**
 * Merges a sourced loot table into a raid's typed boss file, rewriting **only** the `loot:` arrays.
 *
 * Run after `ingest-raid-loot.mjs`, which fetches the table this reads:
 *   node tools/ingest/ingest-raid-loot.mjs serpentshrine-cavern
 *   npx tsx tools/ingest/apply-raid-loot.mts serpentshrine-cavern
 *
 * **A union, never a replace, and that is the whole design.** Each side holds things the other
 * cannot:
 *
 *   * Wowhead has the real drop table — 37 rows Tempest Keep was missing, 17 for Serpentshrine —
 *     each with a real `wowItemId`.
 *   * The hand-written data has what a scrape of a *boss* can never see: the tier set pieces a token
 *     is traded for, the quest rewards an encounter hands out, and Kael'thas's seven encounter
 *     weapons. Replacing would have deleted 32 curated rows from Tempest Keep alone.
 *
 * Mechanics prose and `roleNotes` are never touched — those are hand-written, and no scrape should
 * overwrite a sentence a person reasoned out.
 *
 * Matching is by `wowItemId` **or** normalised name, because our older rows often carry the name and
 * no id. Matching on id alone reported 27 Karazhan rows as new when they were already there.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getItemByWowItemId } from '../../src/domain/gear/itemCatalogue'
import { getBossesForRaid, sampleRaids } from '../../src/domain/raids'
import type { RaidBoss } from '../../src/domain/raids/raidTypes'

/** Which file holds each raid's bosses. Adding a raid means adding a line here. */
const FILES: Record<string, string> = {
  karazhan: 'src/domain/raids/karazhanBosses.ts',
  'gruuls-lair': 'src/domain/raids/gruulsLairBosses.ts',
  'magtheridons-lair': 'src/domain/raids/magtheridonsLairBosses.ts',
  'serpentshrine-cavern': 'src/domain/raids/serpentshrineCavernBosses.ts',
  'tempest-keep': 'src/domain/raids/tempestKeepBosses.ts',
}

/** The tokens that are traded for a set piece, rather than worn. */
const TOKEN = /of the (Fallen|Vanquished) (Champion|Defender|Hero|Protector|Conqueror)$/

const norm = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '')
const quote = (value: string) => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

const raidId = process.argv[2]
const file = FILES[raidId]
if (!file) {
  console.error(`Usage: npx tsx tools/ingest/apply-raid-loot.mts <${Object.keys(FILES).join('|')}>`)
  process.exit(1)
}
if (!sampleRaids.some((raid) => raid.id === raidId)) throw new Error(`no raid '${raidId}' in sampleRaids`)

const sourcedFile = resolve(`tools/ingest/data/raid-loot.${raidId}.json`)
const sourced = JSON.parse(readFileSync(sourcedFile, 'utf8')) as {
  bosses: Record<string, { wowItemId: number; name: string }[]>
}

let text = readFileSync(file, 'utf8')
let added = 0
let kept = 0

function renderRow(fields: string[]) {
  return `      { ${fields.join(', ')} },`
}

for (const boss of getBossesForRaid(raidId) as RaidBoss[]) {
  const drops = sourced.bosses[boss.id]
  if (!drops) throw new Error(`sourced data has no entry for ${boss.id}; re-run ingest-raid-loot.mjs`)

  const byId = new Map(boss.loot.filter((row) => row.wowItemId !== undefined).map((row) => [row.wowItemId!, row]))
  const byName = new Map(boss.loot.map((row) => [norm(row.name), row]))
  const matched = new Set<unknown>()
  const rows: string[] = []

  for (const drop of drops) {
    const prior = byId.get(drop.wowItemId) ?? byName.get(norm(drop.name))
    if (prior) {
      matched.add(prior)
      kept += 1
    } else {
      added += 1
    }

    const item = getItemByWowItemId(drop.wowItemId)
    const fields: string[] = []
    if (item) fields.push(`itemId: ${quote(item.id)}`)
    fields.push(`name: ${quote(drop.name)}`, `wowItemId: ${drop.wowItemId}`)
    fields.push(`dropType: ${quote(TOKEN.test(drop.name) ? 'Tier Token' : (prior?.dropType ?? 'Boss'))}`)
    if (prior?.roles) fields.push(`roles: [${prior.roles.map(quote).join(', ')}]`)

    /*
     * A row with no catalogue entry keeps the flag. Its *provenance* is sourced — it came off
     * Wowhead's own table with a real id — but the app holds no stats for it, and a blank stat line
     * must not read as "this item has no stats".
     */
    if (!item) {
      fields.push('needsVerification: true')
      fields.push(`notes: ${quote(prior?.notes ?? 'Real drop; not in the item catalogue, so it is listed by name only.')}`)
    } else if (prior?.notes) {
      fields.push(`notes: ${quote(prior.notes)}`)
    }
    rows.push(renderRow(fields))
  }

  // Everything curated that the scrape cannot contain, verbatim.
  for (const prior of boss.loot) {
    if (matched.has(prior)) continue
    kept += 1
    const fields: string[] = []
    if (prior.itemId) fields.push(`itemId: ${quote(prior.itemId)}`)
    fields.push(`name: ${quote(prior.name)}`)
    if (prior.wowItemId !== undefined) fields.push(`wowItemId: ${prior.wowItemId}`)
    fields.push(`dropType: ${quote(prior.dropType)}`)
    if (prior.roles) fields.push(`roles: [${prior.roles.map(quote).join(', ')}]`)
    if (prior.needsVerification) fields.push('needsVerification: true')
    if (prior.notes) fields.push(`notes: ${quote(prior.notes)}`)
    rows.push(renderRow(fields))
  }

  // Splice this boss's loot array, leaving everything around it alone.
  const anchor = text.indexOf(`id: '${boss.id}'`)
  if (anchor === -1) throw new Error(`cannot find ${boss.id} in ${file}`)
  const lootAt = text.indexOf('loot: [', anchor)
  if (lootAt === -1) throw new Error(`cannot find a loot array for ${boss.id}`)
  let depth = 0
  let end = -1
  for (let index = text.indexOf('[', lootAt); index < text.length; index += 1) {
    if (text[index] === '[') depth += 1
    else if (text[index] === ']') {
      depth -= 1
      if (depth === 0) {
        end = index + 1
        break
      }
    }
  }
  text = `${text.slice(0, lootAt)}loot: [\n${rows.join('\n')}\n    ]${text.slice(end)}`
  console.log(`  ${boss.name.padEnd(28)} ${String(rows.length).padStart(3)} rows`)
}

writeFileSync(file, text)
console.log(`\n${file}: ${added} rows added, ${kept} kept`)
