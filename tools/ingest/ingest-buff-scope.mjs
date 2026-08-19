// Reads whether each raid buff and target debuff is PARTY-scoped or RAID-scoped, from the spell's
// own Wowhead tooltip.
//
// Why this matters more than it looks: in TBC most buffs are **party**-scoped — totems, auras,
// shouts, Arcane Brilliance — and only a few reach the whole raid. A composition tool that treats
// them all as raid-wide tells a raid leader Battle Shout is covered when five of twenty-five players
// actually have it. Group assignment *is* raid composition in TBC, and this field is what makes that
// computable rather than guessed.
//
// The scope is stated in the tooltip text itself, so it is read rather than inferred:
//   Battle Shout               "all party members within 20 yards"       -> Party
//   Greater Blessing of Might  "all members of the raid or group"        -> Raid
//   Arcane Brilliance          "Infuses the target's party"              -> Party
//
// **Spell pages differ from item pages.** A spell writes `g_spells[<id>].tooltip_enus = "…"` — an
// assignment, double-quoted — where an item writes `tooltip_enus: '…'` inside an object literal. The
// item parser silently finds nothing here, which is how this started.
//
// Anything the tooltip does not state plainly is left `undefined` and reported, rather than guessed.
//
// Run: node tools/ingest/ingest-buff-scope.mjs [--refetch]
// Writes: src/domain/buffs/buffScope.json

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { registerHooks } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const CACHE = resolve(HERE, '.cache/buff-scope')
const refetch = process.argv.includes('--refetch')

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context)
    } catch (err) {
      if (!specifier.startsWith('.')) throw err
      try {
        return nextResolve(`${specifier}.ts`, context)
      } catch {
        return nextResolve(`${specifier}/index.ts`, context)
      }
    }
  },
})

const { sampleBuffs } = await import(pathToFileURL(resolve(REPO, 'src/domain/buffs/sampleBuffs.ts')).href)
const { sampleTargetDebuffs } = await import(
  pathToFileURL(resolve(REPO, 'src/domain/buffs/sampleTargetDebuffs.ts')).href
)

mkdirSync(CACHE, { recursive: true })

async function pageFor(spellId) {
  const file = resolve(CACHE, `${spellId}.html`)
  if (!refetch && existsSync(file)) return readFileSync(file, 'utf8')
  const res = await fetch(`https://www.wowhead.com/tbc/spell=${spellId}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })
  if (!res.ok) throw new Error(`spell ${spellId}: HTTP ${res.status}`)
  const html = await res.text()
  writeFileSync(file, html)
  // Wowhead rate-limits once a run makes many requests; the cache means this cost is paid once.
  await new Promise((done) => setTimeout(done, 250))
  return html
}

function tooltipFor(html, spellId) {
  const anchor = html.indexOf(`g_spells[${spellId}].tooltip_enus`)
  if (anchor === -1) return undefined
  let i = html.indexOf('"', anchor) + 1
  let out = ''
  for (; i < html.length; i++) {
    const c = html[i]
    if (c === '\\') {
      out += html[i + 1]
      i++
      continue
    }
    if (c === '"') break
    out += c
  }
  return out
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/**
 * Raid is checked first and deliberately. "all members of the raid or group" contains the word
 * "group", so a party-first test would classify every Greater Blessing as party-scoped — which is
 * the exact inversion that would make the tool most confidently wrong.
 */
const RAID_PATTERNS = [/members of the raid or group/i, /all raid members/i, /raid and party members/i]
/**
 * "group members within 20 yards" is how the totem tooltips phrase party scope — same meaning as
 * "party members", different wording, and it must not be confused with the *raid* pattern above,
 * which is why that one is tested first and anchors on the full "raid or group" phrase.
 */
const PARTY_PATTERNS = [/party members?/i, /target's party/i, /all party/i, /party and raid members/i, /group members/i]
/**
 * Single-target buffs. A raid leader still wants to know they *have* one, but where the provider
 * sits is irrelevant — Innervate goes to whoever needs it, not to whoever shares a group.
 */
const SINGLE_PATTERNS = [/the friendly target/i, /Infuses the target with/i, /increasing the target's/i, /the target's resistance/i, /the target's Spirit/i]

function classify(tooltip) {
  if (!tooltip) return undefined
  for (const pattern of RAID_PATTERNS) if (pattern.test(tooltip)) return 'Raid'
  for (const pattern of PARTY_PATTERNS) if (pattern.test(tooltip)) return 'Party'
  for (const pattern of SINGLE_PATTERNS) if (pattern.test(tooltip)) return 'Single'
  return undefined
}

/**
 * Scopes that cannot be read from the spell page, with the source that establishes each.
 *
 * Kept to the minimum and required to cite evidence, because an override table is exactly where
 * invented data would hide. Spell 30806 renders as "Unleashed Rage Instant Requires Shaman" — the
 * page carries no description at all, since the effect is a passive aura behind a talent.
 */
const OVERRIDES = {
  'unleashed-rage': {
    scope: 'Party',
    why: "Spell page 30806 carries no description. The scope comes from this buff's own sourced rank-5 text, already in sampleBuffs: \"the Shaman's melee critical hits increase all party members' melee attack power by 10%\".",
  },
}

const debuffIds = new Set(sampleTargetDebuffs.map((entry) => entry.id))
const entries = [...sampleBuffs, ...sampleTargetDebuffs]
const scopes = {}
const unresolved = []

for (const entry of entries) {
  if (!entry.spellId) {
    unresolved.push({ name: entry.name, why: 'no spellId' })
    continue
  }
  const tooltip = tooltipFor(await pageFor(entry.spellId), entry.spellId)

  /*
   * A target debuff is not a player buff and has no party/raid scope to read: it lands on the boss,
   * and one applier anywhere in the raid covers it. Classified structurally rather than from the
   * text, because the text is about the target and would never state a player scope.
   */
  const override = OVERRIDES[entry.id]
  const scope = debuffIds.has(entry.id) ? 'Target' : (classify(tooltip) ?? override?.scope)

  if (!scope) {
    unresolved.push({ name: entry.name, spellId: entry.spellId, why: 'tooltip states no scope', tooltip: tooltip?.slice(0, 400) })
    continue
  }
  scopes[entry.id] = {
    name: entry.name,
    spellId: entry.spellId,
    scope,
    evidence: override && !classify(tooltip) ? override.why : tooltip.slice(0, 200),
    ...(override && !classify(tooltip) ? { fromOverride: true } : {}),
  }
}

const out = {
  $schema: 'wowhead spell tooltip scope ingestion',
  source: 'https://www.wowhead.com/tbc/spell=<id>',
  generatedBy: 'tools/ingest/ingest-buff-scope.mjs',
  note: 'Party vs Raid read from each spell tooltip. Entries whose tooltip states no scope are omitted and listed in `unresolved`.',
  scopes,
  unresolved,
}

const target = resolve(REPO, 'src/domain/buffs/buffScope.json')
writeFileSync(target, `${JSON.stringify(out, null, 2)}\n`)

const counts = Object.values(scopes).reduce((acc, entry) => ({ ...acc, [entry.scope]: (acc[entry.scope] ?? 0) + 1 }), {})
console.log(`buff scope: ${Object.keys(scopes).length} of ${entries.length} resolved -> ${JSON.stringify(counts)}`)
for (const entry of Object.values(scopes)) console.log(`  ${entry.scope.padEnd(6)} ${entry.name}`)
if (unresolved.length > 0) {
  console.log(`\nunresolved (${unresolved.length}) — these need a human, not a guess:`)
  for (const entry of unresolved) console.log(`  ${entry.name}: ${entry.why}${entry.tooltip ? `\n      "${entry.tooltip}"` : ''}`)
}
