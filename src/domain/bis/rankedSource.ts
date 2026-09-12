import type { ItemSource } from '../gear/itemTypes'
import type { RankedGearSource } from './bisTypes'

/**
 * Turns Wowhead's free-text "Source" column into the structured `RankedGearSource` the app can query.
 *
 * **The data was always there and was always unusable.** Every one of the 1,430 ranked rows carries a
 * source string from the guide — `Drop: (Serpentshrine Cavern)`, `Profession: Tailoring - BoP only`,
 * `Vendor: (41 Badges of Justice)` — and `bisLists` was folding it into the free-text `notes` field.
 * A reader could see it; nothing could ask a question of it. "Which of my BiS pieces drop in SSC" and
 * "what do I have to craft" were unanswerable against data that already held both answers.
 *
 * So this parses rather than re-sources. The JSON stays the raw pinned scrape — typos included, see
 * below — and the interpretation lives here where it can be tested, which is the same split the rest
 * of the ingest uses.
 *
 * **Nothing here guesses a type.** A string this cannot classify keeps whatever it *did* yield —
 * usually the instance name — and leaves `type` undefined, because absent means unknown and `'Other'`
 * would be an invented answer. `UNCLASSIFIED_INSTANCES` is asserted empty by a test, so a guide
 * revision that adds an instance fails loudly instead of quietly widening the unknown pile.
 */

/**
 * Wowhead's own misspellings, normalised to the name the rest of this repo uses.
 *
 * **These are not defensive programming.** Every key here is a real string in the pinned scrape:
 * Serpentshrine Cavern alone is spelled five wrong ways across the 24 guides, and Magtheridon's Lair
 * appears as "Liar". Correcting them at the boundary is what lets an instance be a key rather than a
 * label — without it, a filter for Serpentshrine silently misses a third of its own drops.
 */
const INSTANCE_SPELLINGS: Record<string, string> = {
  'serpenshrine cavern': 'Serpentshrine Cavern',
  'serpentshrine cavaern': 'Serpentshrine Cavern',
  'serpentshrine cvaern': 'Serpentshrine Cavern',
  'serpentsrhine cavern': 'Serpentshrine Cavern',
  'serptentshrine cavern': 'Serpentshrine Cavern',
  "magtheridon's liar": "Magtheridon's Lair",
  magtheridon: "Magtheridon's Lair",
  'tempest keep': 'Tempest Keep: The Eye',
  'tempest keep: the eye': 'Tempest Keep: The Eye',
  'classic - naxxramas': 'Naxxramas',
  'classic - ahn’qiraj': "Ahn'Qiraj",
  "classic - ahn'qiraj": "Ahn'Qiraj",
  'blood furnace - heroic': 'Heroic The Blood Furnace',
  'world boss in shadowmoon valley': 'World Boss',
}

/** The five raids this app covers, plus the Classic raids and world bosses TBC BiS lists still reach back into. */
const RAIDS = new Set([
  'Karazhan',
  "Gruul's Lair",
  "Magtheridon's Lair",
  'Serpentshrine Cavern',
  'Tempest Keep: The Eye',
  'Naxxramas',
  "Ahn'Qiraj",
  'Blackwing Lair',
  'World Boss',
])

/** TBC five-mans, by their normal-difficulty names. The heroic variants are detected by prefix. */
const DUNGEONS = new Set([
  'Auchenai Crypts',
  'Hellfire Ramparts',
  'Mana-Tombs',
  'Old Hillsbrad Foothills',
  'Sethekk Halls',
  'Shadow Labyrinth',
  'The Arcatraz',
  'The Black Morass',
  'The Blood Furnace',
  'The Botanica',
  'The Mechanar',
  'The Shattered Halls',
  'The Slave Pens',
  'The Steamvault',
  'The Underbog',
  'Dire Maul East',
  'Caverns of Time',
])

/** Open world, where a "drop" is a zone drop rather than an instance one. */
const ZONES = new Set([
  "Blade's Edge Mountains",
  'Hellfire Peninsula',
  'Netherstorm',
  'Shadowmoon Valley',
  'Terokkar Forest',
  'The Outland',
])

/**
 * Profession specializations, which the guide sometimes writes where an instance would go.
 *
 * `(Master Axesmith)` is a Blacksmithing branch, not a place. Without this it reads as an unknown
 * instance and the item looks like a drop from somewhere nobody can find.
 */
const SPECIALIZATIONS = new Set([
  'Master Axesmith',
  'Master Hammersmith',
  'Master Swordsmith',
  'Master Hammersmithing',
  'Spellfire Tailoring',
  'Shadoweave Tailoring',
  'Mooncloth Tailoring',
  'Primal Mooncloth Tailoring',
  'Tribal Leatherworking',
  'Dragonscale Leatherworking',
  'Elemental Leatherworking',
])

/** Collected for the test that asserts it stays empty, so a new guide spelling cannot pass unnoticed. */
export const UNCLASSIFIED_INSTANCES = new Set<string>()

/** Strings that carry a marker and nothing else — a bare `Quest:`, a lone dash, a stray `25x`. */
function isEmptyish(text: string) {
  return text.length === 0 || /^[-,/\s]*$/.test(text)
}

/** Normalises a captured instance name: trims, collapses spaces, and applies the spelling fixes above. */
function canonicalInstance(raw: string): string | undefined {
  const trimmed = raw.replace(/\s+/g, ' ').trim().replace(/^[-,/]+|[-,/]+$/g, '').trim()
  if (isEmptyish(trimmed)) return undefined
  return INSTANCE_SPELLINGS[trimmed.toLowerCase()] ?? trimmed
}

/**
 * Which kind of content an instance name refers to.
 *
 * Returns undefined rather than a guess for anything not named above, and records the name so the
 * gap is countable. "Heroic X" is read as the heroic version of X, which is also how the scrape
 * writes it — sometimes as a prefix, sometimes as a `- Heroic` suffix that the spelling map folds in.
 */
function contentType(instance: string): ItemSource | undefined {
  if (instance.startsWith('Heroic ')) {
    const normal = instance.slice('Heroic '.length)
    if (DUNGEONS.has(normal) || DUNGEONS.has(`The ${normal}`)) return 'Heroic Dungeon'
    UNCLASSIFIED_INSTANCES.add(instance)
    return undefined
  }
  if (RAIDS.has(instance)) return 'Raid'
  if (DUNGEONS.has(instance)) return 'Dungeon'
  if (ZONES.has(instance)) return 'World Drop'
  if (/seasonal event$/i.test(instance)) return 'Other'
  UNCLASSIFIED_INSTANCES.add(instance)
  return undefined
}

/** Pulls the first parenthesised group out, returning it and the text with it removed. */
function takeParenthesised(text: string): { inside?: string; rest: string } {
  const match = text.match(/\(([^)]*)\)/)
  if (match) {
    return { inside: match[1], rest: (text.slice(0, match.index) + text.slice(match.index! + match[0].length)).trim() }
  }
  // `Drop: (Tempest Keep` — an opening bracket the guide never closed. Reading to the end recovers a
  // real instance name that would otherwise be thrown away with the malformed row.
  const unclosed = text.match(/\(([^)]+)$/)
  if (unclosed) return { inside: unclosed[1], rest: text.slice(0, unclosed.index).trim() }
  return { rest: text }
}

/** Trims the leading marker (`Drop:`, `Profession:`) off, tolerating the scrape's `Drrop:` typo. */
function afterMarker(text: string) {
  return text.replace(/^[A-Za-z'\s]+:?/, '').trim()
}

function detail(...parts: (string | undefined)[]) {
  const kept = parts.map((part) => part?.replace(/\s+/g, ' ').trim().replace(/^[-,/]+|[-,/]+$/g, '').trim()).filter((part): part is string => !!part && !isEmptyish(part))
  return kept.length ? kept.join(' · ') : undefined
}

/**
 * Parses one Wowhead source string.
 *
 * Returns undefined when the string carries nothing at all — a lone `-`, an empty cell — because a
 * record whose every field is absent is worse than no record: the panel would draw a "Source" block
 * with nothing in it.
 */
export function parseRankedSource(raw: string | undefined): RankedGearSource | undefined {
  if (!raw) return undefined
  // `Drop; (Tempest Keep)` is in the scrape. A semicolon where a colon belongs is a typo in the
  // separator, not a different kind of statement.
  const text = raw.replace(/\s+/g, ' ').replace(/;/g, ':').trim()
  if (isEmptyish(text)) return undefined

  const marker = text.match(/^([A-Za-z' ]+?)\s*:/)?.[1]?.trim().toLowerCase()

  /*
   * A row whose prose runs ahead of its marker: `Quest Reward from . Drop: (Tempest Keep)`.
   *
   * The marker match above needs the label at the very start, so a sentence in front of it hides a
   * perfectly good `Drop:`. Re-entering from the marker keeps the location; the leading words say
   * how it is obtained, which the outer type already records.
   */
  if (!marker) {
    const embedded = text.match(/\bdr+op\s*:/i)
    if (embedded?.index !== undefined) {
      const inner = parseRankedSource(text.slice(embedded.index))
      if (inner) return /^quest/i.test(text) ? { ...inner, type: 'Quest' } : inner
    }
  }

  // ── Crafted ────────────────────────────────────────────────────────────────────────────────────
  // `Profession: Tailoring (Spellfire Tailoring) - BoP only`, `Crafted (Jewelcrafting)`.
  if (marker === 'profession' || marker === 'crafted' || marker === 'crafting' || /^crafted\b/i.test(text)) {
    const body = marker ? afterMarker(text) : text.replace(/^crafted\b/i, '').trim()
    const { inside, rest } = takeParenthesised(body)
    // The profession is whichever side names one; the parenthesis holds a specialization as often as
    // it holds the profession itself, and `(BoP)` holds neither.
    const bindingOnly = inside && /^(BoP|BoE)$/i.test(inside.trim())
    const named = detail(rest) ?? (bindingOnly ? undefined : detail(inside))
    const extra = bindingOnly ? inside : rest ? inside : undefined
    return {
      type: 'Crafted',
      ...(named ? { craftedBy: named.replace(/\s*-\s*(BoP|BoE).*$/i, '').trim() || named } : {}),
      ...(detail(extra, named?.match(/-\s*(.*)$/)?.[1]) ? { notes: detail(extra, named?.match(/-\s*(.*)$/)?.[1]) } : {}),
    }
  }

  // ── Vendor, including badge and reputation vendors ─────────────────────────────────────────────
  // `Vendor: G'eras (Badges of Justice)`, `Vendor: (Cenarion Expedition Exalted)`,
  // `Vendor: - Requires Exalted with Lower City`.
  if (marker === 'vendor' || /^sold by\b/i.test(text)) {
    const body = afterMarker(text)
    const { inside, rest } = takeParenthesised(body)
    // A parenthesis naming a faction standing is a reputation gate, not a shopkeeper.
    const isReputation = inside && /(Exalted|Revered|Honored|Friendly)\b/i.test(inside)
    const requires = body.match(/Requires\s+(?:Exalted|Revered|Honored)\s+with\s+(.+)$/i)?.[1]
    return {
      type: 'Vendor',
      ...(isReputation ? { reputation: inside!.trim() } : {}),
      ...(requires ? { reputation: requires.trim() } : {}),
      ...(detail(rest) ? { vendor: detail(rest) } : {}),
      ...(!isReputation && !requires && detail(inside) ? { notes: detail(inside) } : {}),
    }
  }

  // ── Quest ──────────────────────────────────────────────────────────────────────────────────────
  // `Quest: (Tempest Keep: The Eye)`, `Quest: (The Violet Eye Exalted)`, and a bare `Quest:`.
  if (marker === 'quest') {
    const { inside } = takeParenthesised(afterMarker(text))
    const named = inside ? canonicalInstance(inside) : undefined
    if (!named) return { type: 'Quest' }
    // A quest gated on standing names a faction where a dungeon quest names an instance.
    if (/(Exalted|Revered|Honored)\b/i.test(named)) return { type: 'Quest', reputation: named }
    return { type: 'Quest', instance: named }
  }

  // ── PvP ────────────────────────────────────────────────────────────────────────────────────────
  // `Arena: 1875 - Arena Vendor`, `PvP: 2175`, `Purchased from Arena PvP Weapon vendors...`.
  if (marker === 'pvp' || marker === 'arena' || /\barena\b|\bpvp\b|\bgladiator\b/i.test(text)) {
    return { type: 'PvP', ...(detail(marker ? afterMarker(text) : text) ? { notes: detail(marker ? afterMarker(text) : text) } : {}) }
  }

  // ── Drops ──────────────────────────────────────────────────────────────────────────────────────
  // `Drop: (Karazhan)`, `Drop: Trash Mobs (Tempest Keep: The Eye)`, `Drop: Zone Drop (Netherstorm)`,
  // `Drop: Opera Event -`, and the scrape's `Drrop:`.
  if (marker && /^dr+op/i.test(marker)) {
    const body = afterMarker(text)
    const { inside, rest } = takeParenthesised(body)
    const instance = inside ? canonicalInstance(inside) : undefined
    /*
     * **What is left beside the parenthesis is not a boss, and an earlier version of this treated it
     * as one.** The guide's source column names the instance; the text around it is whatever else the
     * author wrote — most often the tier token the item is exchanged for ("Gloves of the Vanquished
     * Champion"), sometimes connective prose ("from"), sometimes a stray bracket. Rendered into a
     * field the panel prints after the instance, all of that reads as an encounter name, so the page
     * confidently said Karazhan drops a boss called "Helm of the Fallen Hero".
     *
     * It goes in `notes` instead, where it reads as the aside it is. The **boss comes from the raid
     * loot tables** — see `resolveAcquisition`, which has real per-encounter data to join against.
     */
    const aside = detail(rest.replace(/\b(zone|world)\s+drop\b/i, ''))
    /*
     * Only the words "world drop" or "zone drop" make this a world drop. A row that simply failed to
     * name a place is an *absence*, and reading it as open-world was actively wrong: `Drop: Trash
     * Mobs`, which is Serpentshrine trash, came out labelled "World Drop · Serpentshrine Cavern"
     * once the raid loot join supplied the instance the guide had left off.
     */
    const worldish = /\b(zone|world)\s+drop\b/i.test(rest)
    return {
      type: instance ? contentType(instance) : worldish ? 'World Drop' : undefined,
      ...(instance ? { instance } : {}),
      ...(aside ? { notes: aside } : {}),
    }
  }

  // ── World drops written as their own marker: `World Drop: The Outland` ─────────────────────────
  // `World Drop: The Outland`, `Zone Drop: (Blade's Edge Mountains) & 50x` — the zone is named either
  // bare or in parentheses, and anything after it is a quantity rather than a place.
  if (/^(world|zone) drop\b/i.test(text)) {
    const body = text.replace(/^(world|zone) drop:?/i, '')
    const { inside } = takeParenthesised(body)
    const zone = canonicalInstance(inside ?? body)
    return { type: 'World Drop', ...(zone ? { instance: zone } : {}) }
  }

  // ── Badge and arena currency, written without a marker ─────────────────────────────────────────
  // `, Shattrath City - 25 Badges of Justice` is a vendor row that lost its label in the scrape.
  if (/badges? of justice/i.test(text)) {
    return { type: 'Vendor', vendor: 'Badges of Justice', ...(detail(text) ? { notes: detail(text) } : {}) }
  }
  if (/\bseason \d\b/i.test(text)) {
    return { type: 'PvP', ...(detail(text) ? { notes: detail(text) } : {}) }
  }

  // ── A bare instance in parentheses, with no marker at all: `(Karazhan)`, `(Master Axesmith)` ────
  const bare = takeParenthesised(text)
  if (bare.inside && isEmptyish(bare.rest)) {
    const inside = bare.inside.replace(/\s+/g, ' ').trim()
    if (SPECIALIZATIONS.has(inside)) return { type: 'Crafted', notes: inside }
    const instance = canonicalInstance(inside)
    if (instance) return { type: contentType(instance), instance }
  }

  /*
   * ── A bare instance with no marker and no parentheses ─────────────────────────────────────────
   *
   * `- Karazhan`, `- Heroic The Underbog`, `- World Boss, Hellfire Peninsula`. These are drop rows
   * whose `Drop:` label the guide simply omitted, and they are only recognisable *because* the name
   * matches one this file already knows — which is why this runs last and why it does not fall back
   * to treating any leftover text as a place.
   */
  const leading = text.replace(/^[-,/\s]+/, '').split(',')[0]
  const named = canonicalInstance(leading)
  if (named && !UNCLASSIFIED_INSTANCES.has(named)) {
    const type = contentType(named)
    // `contentType` records a miss as a side effect; only keep this if it actually recognised one.
    if (type) return { type, instance: named }
    UNCLASSIFIED_INSTANCES.delete(named)
  }

  // Anything else keeps its text rather than being forced into a category it may not belong to.
  return detail(text) ? { notes: detail(text) } : undefined
}
