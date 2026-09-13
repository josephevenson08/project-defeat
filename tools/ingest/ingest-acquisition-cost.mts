/**
 * What a BiS pick actually costs, for the two acquisition types where "where" is not the answer.
 *
 * `parseRankedSource` already tells a reader an item is crafted or bought. That is half a plan: a
 * Tailoring robe and a 41-badge trinket are both "go get it" until you know the robe wants 14 Primal
 * Fire and the trinket wants roughly a fortnight of heroics. This fills the other half.
 *
 * Two shapes come off Wowhead's own item pages, both from the JSON its listviews render from:
 *
 *   * **Crafted** — the `created-by-spell` row carries `reagents` as `[[itemId, quantity], …]`, the
 *     `learnedat` skill, and the specialization spell where one is required. Reagent *names* come
 *     from the same page's `WH.Gatherer` dump, so nothing has to be looked up twice.
 *   * **Vendor** — the `sold-by` row carries `cost` as `[money, [[currencyId, amount], …],
 *     [[itemId, quantity], …]]`. Badges and Apexis shards are items; arena and honor points are
 *     currencies. Both are priced; neither is guessed.
 *
 * Usage:
 *   npx tsx tools/ingest/ingest-acquisition-cost.mts
 *
 * Writes src/domain/gear/acquisitionCosts.json.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bisLists, resolveAcquisition } from '../../src/domain/bis'
import { getItemById } from '../../src/domain/gear/itemCatalogue'

const OUT = resolve('src/domain/gear/acquisitionCosts.json')

/**
 * Currency ids Wowhead uses in a `cost` triple.
 *
 * Only the ones that actually turn up are listed, and an id that is not here is written through as
 * `currency-<id>` rather than dropped — a price nobody can read still beats a price nobody can see,
 * and it shows up in the output as something to name.
 */
const CURRENCIES: Record<number, string> = {
  1900: 'Arena Points',
  1901: 'Honor Points',
}

/** Pulls a listview's embedded data array. `data:` is sometimes followed by a space, sometimes not. */
function listviewData(html: string, listId: string): Record<string, unknown>[] | undefined {
  const at = html.indexOf(`id: '${listId}'`)
  if (at === -1) return undefined
  const match = /data:\s*\[/.exec(html.slice(at, at + 4000))
  if (!match) return undefined
  const start = at + match.index + match[0].length - 1
  let depth = 0
  for (let index = start; index < html.length; index += 1) {
    const character = html[index]
    if (character === '[') depth += 1
    else if (character === ']') {
      depth -= 1
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(start, index + 1))
        } catch {
          return undefined
        }
      }
    }
  }
  return undefined
}

/** Every item name the page happens to mention, which is how reagent ids become reagent names. */
function itemNames(html: string): Map<number, string> {
  const names = new Map<number, string>()
  for (const block of html.matchAll(/WH\.Gatherer\.addData\(3,\s*\d+,\s*(\{[\s\S]*?\})\);/g)) {
    let parsed: Record<string, { name_enus?: string }>
    try {
      parsed = JSON.parse(block[1])
    } catch {
      continue
    }
    for (const [id, value] of Object.entries(parsed)) {
      if (value?.name_enus) names.set(Number(id), value.name_enus)
    }
  }
  return names
}

type Cost = {
  wowItemId: number
  name: string
  type: 'Crafted' | 'Vendor'
  profession?: string
  requiredSkill?: number
  reagents?: { wowItemId: number; name: string; quantity: number }[]
  vendor?: string
  price?: { name: string; quantity: number; wowItemId?: number }[]
  source: string
}

// The items worth pricing: every distinct BiS recommendation that is crafted or bought.
const targets = new Map<number, { name: string; type: 'Crafted' | 'Vendor'; profession?: string }>()
for (const entry of bisLists.flatMap((list) => list.entries)) {
  const item = getItemById(entry.itemId)
  if (!item?.wowItemId || targets.has(item.wowItemId)) continue
  const acquired = resolveAcquisition(entry, item)
  if (acquired.type !== 'Crafted' && acquired.type !== 'Vendor') continue
  targets.set(item.wowItemId, {
    name: item.name,
    type: acquired.type,
    // The guide writes "Tailoring - can be purchased on the Auction House"; the profession is the head of it.
    profession: acquired.craftedBy?.split(/\s*[-(]/)[0].trim() || undefined,
  })
}

console.log(`pricing ${targets.size} items`)

const costs: Cost[] = []
const unresolved: string[] = []

/**
 * Fetch politely, and retry rather than accept a thin page.
 *
 * **The first version of this had neither and quietly destroyed its own good output.** A run that had
 * already priced 109 of 119 items was re-run minutes later; Wowhead throttled the burst, every page
 * came back without its listviews, and the script cheerfully wrote a file containing zero costs. No
 * error, no non-zero exit — just a dataset replaced by nothing.
 *
 * A page with no `WH.Gatherer` block at all is the tell: every real item page has one. That is a
 * better signal than the HTTP status, which stayed 200 throughout.
 */
async function fetchItemPage(url: string): Promise<string> {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(url, { headers: { 'user-agent': 'project-defeat ingest' } })
    const html = await response.text()
    if (response.ok && html.includes('WH.Gatherer.addData')) return html
    // Back off and try again: 2s, 4s, 8s.
    await new Promise((settle) => setTimeout(settle, 2000 * 2 ** (attempt - 1)))
  }
  throw new Error(`${url} → four attempts all came back without item data; you are being throttled.`)
}

let fetched = 0
for (const [wowItemId, target] of targets) {
  const url = `https://www.wowhead.com/tbc/item=${wowItemId}`
  const html = await fetchItemPage(url)
  // A courtesy gap between requests. 119 pages at this rate is about a minute.
  fetched += 1
  if (fetched % 10 === 0) console.log(`  …${fetched}/${targets.size}`)
  await new Promise((settle) => setTimeout(settle, 400))
  const names = itemNames(html)

  if (target.type === 'Crafted') {
    const spell = listviewData(html, 'created-by-spell')?.[0] as
      | { reagents?: [number, number][]; learnedat?: number; skill?: number[] }
      | undefined
    if (!spell?.reagents?.length) {
      unresolved.push(`${target.name} (${wowItemId}): crafted, but no created-by-spell reagents`)
      continue
    }
    costs.push({
      wowItemId,
      name: target.name,
      type: 'Crafted',
      profession: target.profession,
      requiredSkill: spell.learnedat,
      reagents: spell.reagents.map(([id, quantity]) => ({
        wowItemId: id,
        name: names.get(id) ?? `item-${id}`,
        quantity,
      })),
      source: url,
    })
    continue
  }

  const sold = listviewData(html, 'sold-by')?.[0] as
    | { name?: string; cost?: [number, [number, number][], [number, number][]][] }
    | undefined
  const cost = sold?.cost?.[0]
  if (!cost) {
    unresolved.push(`${target.name} (${wowItemId}): vendor, but no sold-by cost`)
    continue
  }
  const [money, currencies, items] = cost
  const price = [
    ...(currencies ?? []).map(([id, quantity]) => ({ name: CURRENCIES[id] ?? `currency-${id}`, quantity })),
    ...(items ?? []).map(([id, quantity]) => ({ name: names.get(id) ?? `item-${id}`, quantity, wowItemId: id })),
  ]

  /*
   * A reputation vendor sells for gold, and the real price is the standing you had to grind to be
   * allowed to buy it. `resolveAcquisition` already carries that gate, so recording the gold here
   * completes the row rather than leaving a vendor item looking unpriced — ten of the fifty are
   * like this, every one of them a reputation reward.
   */
  if (!price.length && money > 0) price.push({ name: 'gold', quantity: Math.round(money / 10000) })

  if (!price.length) {
    unresolved.push(`${target.name} (${wowItemId}): sold-by row carries no price at all`)
    continue
  }
  costs.push({ wowItemId, name: target.name, type: 'Vendor', vendor: sold?.name, price, source: url })
}

costs.sort((a, b) => a.name.localeCompare(b.name))

/*
 * **Refuse to replace a good dataset with a worse one.** See `fetchItemPage` — a throttled run once
 * wrote an empty file over 109 priced items and exited 0. Fewer rows than last time is either
 * throttling or a page-shape change, and both want a human looking rather than a silent overwrite.
 */
if (existsSync(OUT)) {
  const previous = JSON.parse(readFileSync(OUT, 'utf8')) as { costs: unknown[] }
  if (costs.length < previous.costs.length) {
    console.error(
      `Refusing to write: this run priced ${costs.length} items, the file on disk has ${previous.costs.length}.\n` +
        'Re-run when Wowhead is not throttling, or delete the file deliberately if the drop is real.',
    )
    process.exit(1)
  }
}

writeFileSync(
  OUT,
  `${JSON.stringify(
    { fetchedAt: new Date().toISOString().slice(0, 10), source: 'wowhead.com/tbc', costs },
    null,
    2,
  )}\n`,
)

const crafted = costs.filter((cost) => cost.type === 'Crafted').length
console.log(`  ${crafted} crafted priced, ${costs.length - crafted} vendor priced`)
if (unresolved.length) console.log(`\nunresolved (${unresolved.length}):\n  ` + unresolved.join('\n  '))
console.log(`\nwrote ${OUT}`)
