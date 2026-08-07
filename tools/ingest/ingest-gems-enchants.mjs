// Ingests the wowsims gem and enchant databases.
//
// Why: the catalogue carried 11 hand-written gems and 22 enchants against 4,528 items, which made the
// socket and enchant dropdowns the thinnest part of the app by a wide margin. Same source, pinned
// commit and script shape as the item ingestion, which validated at 32/32 against Wowhead.
//
// The gem data forced a real schema change. TBC gem colours are not socket colours: 118 of the 212
// gems are **hybrids** — Orange fits red or yellow sockets, Purple red or blue, Green yellow or blue.
// The old `SocketColor` type covered only Red/Yellow/Blue/Meta, so more than half the gems had no
// representable colour at all. See `gemFitsSocket` in src/domain/gems/gemTypes.ts.
//
// Run: node tools/ingest/ingest-gems-enchants.mjs
// Writes: src/domain/gems/gemCatalogue.json, src/domain/enchants/enchantCatalogue.json

import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const CACHE = resolve(HERE, '.cache')

/** Same pinned commit as the item ingestion, so the three datasets always describe one snapshot. */
const UPSTREAM_SHA = '3301fca59306a747e521274c36e073e69acc7b77'
const RAW = `https://raw.githubusercontent.com/wowsims/tbc/${UPSTREAM_SHA}/sim/core/items/`

const GEM_OUT = resolve(REPO, 'src/domain/gems/gemCatalogue.json')
const ENCHANT_OUT = resolve(REPO, 'src/domain/enchants/enchantCatalogue.json')

/** wowsims stat key -> StatBlock key. Same table the item ingester uses. */
const STAT_MAP = {
  Strength: 'strength',
  Agility: 'agility',
  Stamina: 'stamina',
  Intellect: 'intellect',
  Spirit: 'spirit',
  AttackPower: 'attackPower',
  RangedAttackPower: 'rangedAttackPower',
  FeralAttackPower: 'feralAttackPower',
  SpellPower: 'spellPower',
  HealingPower: 'healingPower',
  MeleeHit: 'hitRating',
  SpellHit: 'spellHitRating',
  MeleeCrit: 'critRating',
  SpellCrit: 'spellCritRating',
  MeleeHaste: 'hasteRating',
  SpellHaste: 'spellHasteRating',
  Expertise: 'expertiseRating',
  ArmorPenetration: 'armorPenetration',
  Defense: 'defenseRating',
  Dodge: 'dodgeRating',
  Parry: 'parryRating',
  Block: 'blockRating',
  BlockValue: 'blockValue',
  Resilience: 'resilienceRating',
  Armor: 'armor',
  MP5: 'mp5',
}

const CLASS_MAP = {
  Warrior: 'Warrior',
  Paladin: 'Paladin',
  Hunter: 'Hunter',
  Rogue: 'Rogue',
  Priest: 'Priest',
  Shaman: 'Shaman',
  Mage: 'Mage',
  Warlock: 'Warlock',
  Druid: 'Druid',
}

/** Enchant ItemType -> GearSlot. Weapon enchants are refined further by EnchantType. */
const SLOT_BY_ITEM_TYPE = {
  Head: 'Head',
  Shoulder: 'Shoulders',
  Back: 'Back',
  Chest: 'Chest',
  Wrist: 'Wrists',
  Hands: 'Hands',
  Legs: 'Legs',
  Feet: 'Feet',
  Finger: 'Finger 1',
  Ranged: 'Ranged',
  Weapon: 'Main Hand',
}

async function fetchSource(file) {
  mkdirSync(CACHE, { recursive: true })
  const cached = resolve(CACHE, `${file}.${UPSTREAM_SHA.slice(0, 8)}`)
  if (existsSync(cached)) return readFileSync(cached, 'utf8')
  const res = await fetch(RAW + file)
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`)
  const text = await res.text()
  writeFileSync(cached, text)
  return text
}

function parseStats(body, unmapped) {
  const stats = {}
  const extra = {}
  if (!body) return { stats, extra }
  for (const m of body.matchAll(/stats\.(\w+):\s*(-?[\d.]+)/g)) {
    const [, key, raw] = m
    const value = Number(raw)
    if (value === 0) continue
    const mapped = STAT_MAP[key]
    if (mapped) stats[mapped] = (stats[mapped] ?? 0) + value
    else {
      extra[key] = value
      unmapped.set(key, (unmapped.get(key) ?? 0) + 1)
    }
  }
  return { stats, extra }
}

function slugify(name) {
  return name.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function writeIfChanged(path, payload) {
  const json = `${JSON.stringify(payload, null, 2)}\n`
  const previous = existsSync(path) ? readFileSync(path, 'utf8') : ''
  const changed = previous !== json
  if (changed) writeFileSync(path, json)
  return changed
}

// ---------------------------------------------------------------------------
// Gems
// ---------------------------------------------------------------------------

const unmappedGemStats = new Map()
const gemSource = await fetchSource('all_gems.go')
const gems = []
const usedGemIds = new Set()

for (const line of gemSource.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed.startsWith('{Name:')) continue

  const name = trimmed.match(/Name: "((?:[^"\\]|\\.)*)"/)?.[1]
  const id = Number(trimmed.match(/[,{]\s*ID: (\d+)/)?.[1])
  const colour = trimmed.match(/Color: proto\.GemColor_GemColor(\w+)/)?.[1]
  if (!name || !id || !colour) continue

  const { stats, extra } = parseStats(trimmed.match(/Stats: stats\.Stats\{([^}]*)\}/)?.[1], unmappedGemStats)

  let gemId = slugify(name)
  if (usedGemIds.has(gemId)) gemId = `${gemId}-${id}`
  usedGemIds.add(gemId)

  const gem = {
    id: gemId,
    wowItemId: id,
    name,
    color: colour,
    quality: trimmed.match(/Quality: proto\.ItemQuality_ItemQuality(\w+)/)?.[1] ?? 'Common',
    stats,
  }
  const phase = Number(trimmed.match(/[,{]\s*Phase: (\d+)/)?.[1])
  if (phase) gem.phase = phase
  if (/[,{]\s*Unique: true/.test(trimmed)) gem.uniqueEquipped = true
  if (Object.keys(extra).length) gem.extraStats = extra

  gems.push(gem)
}

gems.sort((a, b) => a.wowItemId - b.wowItemId)

const gemsChanged = writeIfChanged(GEM_OUT, {
  $schema: 'wowsims-tbc gem ingestion',
  upstream: { repo: 'wowsims/tbc', sha: UPSTREAM_SHA, path: 'sim/core/items/all_gems.go', license: 'MIT' },
  generatedBy: 'tools/ingest/ingest-gems-enchants.mjs',
  gemCount: gems.length,
  gems,
})

// ---------------------------------------------------------------------------
// Enchants
// ---------------------------------------------------------------------------

const unmappedEnchantStats = new Map()
const enchantSource = await fetchSource('all_enchants.go')
const enchants = []
const usedEnchantIds = new Set()
const unmappedTypes = new Map()

for (const line of enchantSource.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed.startsWith('{ID:')) continue

  const name = trimmed.match(/Name: "((?:[^"\\]|\\.)*)"/)?.[1]
  const id = Number(trimmed.match(/^\{ID: (\d+)/)?.[1])
  const itemType = trimmed.match(/ItemType: proto\.ItemType_ItemType(\w+)/)?.[1]
  if (!name || !id || !itemType) continue

  const slot = SLOT_BY_ITEM_TYPE[itemType]
  if (!slot) {
    unmappedTypes.set(itemType, (unmappedTypes.get(itemType) ?? 0) + 1)
    continue
  }

  const { stats, extra } = parseStats(trimmed.match(/Bonus: stats\.Stats\{([^}]*)\}/)?.[1], unmappedEnchantStats)
  const enchantType = trimmed.match(/EnchantType: proto\.EnchantType_EnchantType(\w+)/)?.[1]

  let enchantId = slugify(name)
  if (usedEnchantIds.has(enchantId)) enchantId = `${enchantId}-${id}`
  usedEnchantIds.add(enchantId)

  const enchant = {
    id: enchantId,
    wowEnchantId: id,
    name,
    slot,
    stats,
  }

  const effectId = Number(trimmed.match(/EffectID: (\d+)/)?.[1])
  if (effectId) enchant.effectId = effectId

  // A weapon enchant is legal in either hand unless it is shield- or two-hand-only.
  if (itemType === 'Weapon') {
    if (enchantType === 'Shield') {
      enchant.slot = 'Off Hand'
      enchant.requiresShield = true
    } else if (enchantType === 'TwoHand') {
      enchant.requiresTwoHand = true
    } else {
      enchant.allowedSlots = ['Main Hand', 'Off Hand']
    }
  }

  const classes = trimmed.match(/ClassAllowlist: \[\]proto\.Class\{([^}]*)\}/)?.[1]
  if (classes) {
    const allowed = [...classes.matchAll(/Class_Class(\w+)/g)].map((m) => CLASS_MAP[m[1]]).filter(Boolean)
    if (allowed.length) enchant.allowedClasses = allowed
  }

  // Procs like Mongoose and Crusader carry no flat stats. Recorded as unmodelled rather than scored
  // at zero, which is the same treatment item procs get.
  if (Object.keys(stats).length === 0) enchant.notModelled = 'Proc or on-use effect; no flat stats to add.'
  if (Object.keys(extra).length) enchant.extraStats = extra

  enchants.push(enchant)
}

enchants.sort((a, b) => a.wowEnchantId - b.wowEnchantId)

const enchantsChanged = writeIfChanged(ENCHANT_OUT, {
  $schema: 'wowsims-tbc enchant ingestion',
  upstream: { repo: 'wowsims/tbc', sha: UPSTREAM_SHA, path: 'sim/core/items/all_enchants.go', license: 'MIT' },
  generatedBy: 'tools/ingest/ingest-gems-enchants.mjs',
  enchantCount: enchants.length,
  enchants,
})

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const byColour = {}
for (const gem of gems) byColour[gem.color] = (byColour[gem.color] ?? 0) + 1
const bySlot = {}
for (const enchant of enchants) bySlot[enchant.slot] = (bySlot[enchant.slot] ?? 0) + 1

process.stdout.write(
  [
    `gems       ${gems.length}  (${gemsChanged ? 'written' : 'unchanged'})`,
    `  colours  ${Object.entries(byColour).sort(([, a], [, b]) => b - a).map(([c, n]) => `${c}:${n}`).join('  ')}`,
    `enchants   ${enchants.length}  (${enchantsChanged ? 'written' : 'unchanged'})`,
    `  slots    ${Object.entries(bySlot).sort(([, a], [, b]) => b - a).map(([s, n]) => `${s}:${n}`).join('  ')}`,
    `  procs    ${enchants.filter((e) => e.notModelled).length} with no flat stats`,
    '',
  ].join('\n'),
)

for (const [label, map] of [['gem', unmappedGemStats], ['enchant', unmappedEnchantStats]]) {
  if (!map.size) continue
  process.stdout.write(`${label} stats with no StatBlock field (kept in extraStats):\n`)
  for (const [key, count] of [...map.entries()].sort(([, a], [, b]) => b - a)) {
    process.stdout.write(`  ${key.padEnd(22)} ${count}\n`)
  }
}
if (unmappedTypes.size) {
  process.stdout.write(`UNMAPPED enchant ItemTypes:\n`)
  for (const [type, count] of unmappedTypes) process.stdout.write(`  ${type} ${count}\n`)
}
