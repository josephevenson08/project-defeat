// Fills catalogue gaps from Wowhead for items the wowsims database does not carry.
//
// The wowsims item database is sim-driven, not exhaustive: 23 items referenced by the Wowhead BiS
// guides are simply absent from it. They are real, obtainable items (item level 93-115), so dropping
// the BiS entries that point at them would silently shorten real rankings.
//
// Wowhead's `item=<id>&xml` endpoint is the same source used to validate the bulk ingestion, where it
// agreed on 32/32 Phase <=2 epics, so it is a reasonable second source rather than a new risk.
//
// Run with --discover first after changing the id list: it reports the field vocabulary actually
// present, so the maps below are built from data rather than from recall.
//
// Run: node tools/ingest/supplement-items.mjs [--discover]
// Writes: src/domain/gear/itemSupplement.json

import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const CACHE = resolve(HERE, '.cache/items')
const OUT_PATH = resolve(REPO, 'src/domain/gear/itemSupplement.json')

/**
 * Ids the BiS guides reference that wowsims has no row for. Regenerate with tools/ingest/ingest-bis.mjs.
 *
 * **25644 is here for a different reason and is worth noting.** It is not BiS-referenced; it is
 * Blessed Book of Nagrand, which reached the catalogue only as a hand-written entry with invented
 * stats. It sat between 25643 and 25645 — both already supplemented — so the gap was an oversight
 * rather than an absence. Sourcing it was what let the last invented stat block be deleted.
 */
const MISSING_IDS = [
  22128, 22401, 23199, 23203, 24692, 25043, 25294, 25295, 25643, 25644, 25645, 28064, 30675, 30676,
  30677, 30680, 30682, 30684, 30685, 30686, 31166, 31201, 31225, 31255,
]

const SLOT_BY_INVENTORY = {
  Head: 'Head',
  Neck: 'Neck',
  Shoulder: 'Shoulders',
  Back: 'Back',
  Chest: 'Chest',
  Robe: 'Chest',
  Wrist: 'Wrists',
  Hands: 'Hands',
  Waist: 'Waist',
  Legs: 'Legs',
  Feet: 'Feet',
  Finger: 'Finger 1',
  Trinket: 'Trinket 1',
  'Two-Hand': 'Main Hand',
  'Main Hand': 'Main Hand',
  'One-Hand': 'Main Hand',
  'Off Hand': 'Off Hand',
  'Held In Off-hand': 'Off Hand',
  Shield: 'Off Hand',
  Ranged: 'Ranged',
  Thrown: 'Ranged',
  Relic: 'Relic',
}

const ARMOR_BY_SUBCLASS = {
  'Cloth Armor': 'Cloth',
  'Leather Armor': 'Leather',
  'Mail Armor': 'Mail',
  'Plate Armor': 'Plate',
  Shields: 'Shield',
  Idols: 'Relic',
  Librams: 'Relic',
  Totems: 'Relic',
  'Miscellaneous (Armor)': 'Other',
  // `Cloaks` is deliberately absent. Cloaks carry no armour class in TBC, and the bulk catalogue
  // leaves armorType unset on all 122 of its Back items — matching that keeps the two sources
  // consistent rather than inventing a class this one source happens to name.
}

const WEAPON_BY_SUBCLASS = {
  Axes: 'Axe',
  'Two-Handed Axes': 'Axe',
  Daggers: 'Dagger',
  'Fist Weapons': 'Fist Weapon',
  Maces: 'Mace',
  'Two-Handed Maces': 'Mace',
  Swords: 'Sword',
  'Two-Handed Swords': 'Sword',
  Staves: 'Staff',
  Polearms: 'Polearm',
  Bows: 'Bow',
  Guns: 'Gun',
  Crossbows: 'Crossbow',
  Wands: 'Wand',
  Thrown: 'Thrown',
  Idols: 'Idol',
  Librams: 'Libram',
  Totems: 'Totem',
  Shields: 'Shield',
}

/** Wowhead jsonEquip key -> StatBlock key. Confirmed against the --discover dump. */
const STAT_BY_JSON_KEY = {
  str: 'strength',
  agi: 'agility',
  sta: 'stamina',
  int: 'intellect',
  spi: 'spirit',
  armor: 'armor',
  atkpwr: 'attackPower',
  mleatkpwr: 'attackPower',
  rgdatkpwr: 'rangedAttackPower',
  rgdhitrtng: 'hitRating',
  feratkpwr: 'feralAttackPower',
  splpwr: 'spellPower',
  splheal: 'healingPower',
  hitrtng: 'hitRating',
  mlehitrtng: 'hitRating',
  splhitrtng: 'spellHitRating',
  critstrkrtng: 'critRating',
  mlecritstrkrtng: 'critRating',
  splcritstrkrtng: 'spellCritRating',
  hastertng: 'hasteRating',
  mlehastertng: 'hasteRating',
  splhastertng: 'spellHasteRating',
  exprtng: 'expertiseRating',
  armorpenrtng: 'armorPenetration',
  defrtng: 'defenseRating',
  dodgertng: 'dodgeRating',
  parryrtng: 'parryRating',
  blockrtng: 'blockRating',
  blockamount: 'blockValue',
  resirtng: 'resilienceRating',
  manargn: 'mp5',
}

const SOCKET_BY_CODE = { 1: 'Meta', 2: 'Red', 3: 'Yellow', 4: 'Blue' }

async function fetchItem(id) {
  mkdirSync(CACHE, { recursive: true })
  const file = resolve(CACHE, `${id}.xml`)
  if (existsSync(file)) return readFileSync(file, 'utf8')
  const res = await fetch(`https://www.wowhead.com/tbc/item=${id}&xml`, {
    headers: { 'User-Agent': 'project-defeat-item-supplement' },
  })
  if (!res.ok) throw new Error(`item ${id}: HTTP ${res.status}`)
  const text = await res.text()
  writeFileSync(file, text)
  await new Promise((r) => setTimeout(r, 350))
  return text
}

function tag(xml, name) {
  return xml.match(new RegExp(`<${name}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${name}>`))?.[1]?.trim()
}

function slugify(name) {
  return name.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

const discover = process.argv.includes('--discover')
const jsonKeys = new Map()
const slots = new Set()
const subclasses = new Set()
const items = []
const unmapped = []

for (const id of MISSING_IDS) {
  const xml = await fetchItem(id)
  const name = tag(xml, 'name')
  const inventorySlot = tag(xml, 'inventorySlot')
  const subclass = tag(xml, 'subclass')
  const itemClass = tag(xml, 'class')
  if (!name) {
    unmapped.push(`${id}: no name in response`)
    continue
  }

  slots.add(inventorySlot)
  subclasses.add(`${itemClass} / ${subclass}`)

  let equip = {}
  const raw = xml.match(/<jsonEquip><!\[CDATA\[([\s\S]*?)\]\]><\/jsonEquip>/)?.[1]
  if (raw) {
    try {
      equip = JSON.parse(`{${raw}}`)
    } catch {
      unmapped.push(`${id}: unparseable jsonEquip`)
    }
  }
  for (const key of Object.keys(equip)) jsonKeys.set(key, (jsonKeys.get(key) ?? 0) + 1)

  // Warlock firestones and spellstones report inventory slot "Relic", but TBC equips them in the
  // ranged slot and the app only shows Relic to Druids, Paladins and Shamans. Left as Relic they
  // would be catalogued into a slot no Warlock can ever open.
  const isWarlockStone = inventorySlot === 'Relic' && subclass === 'Miscellaneous (Armor)'
  const slot = isWarlockStone ? 'Ranged' : SLOT_BY_INVENTORY[inventorySlot]
  if (!slot) {
    unmapped.push(`${id} ${name}: unmapped inventorySlot "${inventorySlot}"`)
    continue
  }

  const stats = {}
  for (const [jsonKey, statKey] of Object.entries(STAT_BY_JSON_KEY)) {
    const value = equip[jsonKey]
    if (typeof value === 'number' && value !== 0) stats[statKey] = (stats[statKey] ?? 0) + value
  }

  // School-specific spell power (e.g. `firsplpwr`) has no StatBlock field, exactly as in the bulk
  // ingestion. Kept rather than dropped so adding those fields later is a display change.
  const extraStats = {}
  for (const [key, value] of Object.entries(equip)) {
    if (STAT_BY_JSON_KEY[key] || typeof value !== 'number') continue
    if (/splpwr$/.test(key) || /^res[a-z]*$/.test(key)) extraStats[key] = value
  }

  const sockets = []
  for (let i = 1; i <= (equip.nsockets ?? 0); i += 1) {
    const colour = SOCKET_BY_CODE[equip[`socket${i}`]]
    if (colour) sockets.push(colour)
  }

  const item = {
    id: slugify(name),
    wowItemId: id,
    name,
    slot,
    quality: tag(xml, 'quality') ?? 'Epic',
    itemLevel: Number(tag(xml, 'level')) || undefined,
    stats,
  }

  const armorType = ARMOR_BY_SUBCLASS[subclass]
  const weaponType = WEAPON_BY_SUBCLASS[subclass]
  if (armorType) item.armorType = armorType
  if (weaponType) item.weaponType = weaponType
  if (sockets.length) item.sockets = sockets
  if (equip.speed) item.weaponSpeed = equip.speed
  if (equip.dmgmin1) item.weaponDamageMin = equip.dmgmin1
  if (equip.dmgmax1) item.weaponDamageMax = equip.dmgmax1
  if (Object.keys(extraStats).length) item.extraStats = extraStats
  // No phase data on the tooltip. These are all guide-referenced Phase <=2 picks, but saying so
  // without a source would be exactly the invented-value problem the catalogue rebuild was for.
  item.needsVerification = true

  items.push(item)
}

if (discover) {
  process.stdout.write(`inventorySlot values: ${[...slots].join(', ')}\n\n`)
  process.stdout.write(`class / subclass values:\n${[...subclasses].map((s) => `  ${s}`).join('\n')}\n\n`)
  process.stdout.write(`jsonEquip keys:\n`)
  for (const [key, count] of [...jsonKeys.entries()].sort(([, a], [, b]) => b - a)) {
    process.stdout.write(`  ${key.padEnd(22)} ${count}${STAT_BY_JSON_KEY[key] ? ` -> ${STAT_BY_JSON_KEY[key]}` : ''}\n`)
  }
  process.exit(0)
}

items.sort((a, b) => a.wowItemId - b.wowItemId)

const payload = {
  $schema: 'wowhead item supplement',
  note: 'Items referenced by the Wowhead BiS guides that the wowsims database does not carry.',
  generatedBy: 'tools/ingest/supplement-items.mjs',
  itemCount: items.length,
  items,
}

const json = `${JSON.stringify(payload, null, 2)}\n`
const previous = existsSync(OUT_PATH) ? readFileSync(OUT_PATH, 'utf8') : ''
const changed = previous !== json
if (changed) writeFileSync(OUT_PATH, json)

process.stdout.write(
  [
    `requested  ${MISSING_IDS.length}`,
    `ingested   ${items.length}`,
    `output     ${changed ? 'written' : 'unchanged (idempotent)'} -> src/domain/gear/itemSupplement.json`,
    '',
  ].join('\n'),
)
if (unmapped.length) {
  process.stdout.write('PROBLEMS:\n')
  for (const u of unmapped) process.stdout.write(`  ${u}\n`)
}
