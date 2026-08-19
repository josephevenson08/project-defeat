// Icon names for the raid-composition planner: one per spec, one per buff and debuff.
//
// Two different sources, because the two things are different kinds of object.
//
// **Buffs and debuffs** carry a spell id, and Wowhead's own page data states the icon. The payload is
// `WH.Gatherer.addData(6, 5, {"<spellId>":{"name_enus":…,"icon":…}})` — keyed JSON, so the entry can
// be looked up by id rather than by position. Every lookup is cross-checked against `name_enus`,
// which is what makes it safe: a mis-keyed read would otherwise return a neighbouring spell's icon
// and look entirely plausible.
//
// **A trap worth recording.** Greater Blessing of Might's icon file is literally called
// `spell_holy_greaterblessingofkings`. That is not a mis-read — Blizzard reused a misleadingly named
// asset, and Wowhead's payload for spell 27141 says so with `name_enus` confirming the spell. An
// earlier pass here assumed the parser was wrong and nearly "corrected" accurate data. Trust the
// id-keyed entry, not what the file name appears to say.
//
// **Specs** have no icon of their own in TBC. The community convention is the tree's deepest talent —
// Mangle for Feral, Shadowstep for Subtlety, Avenger's Shield for Protection Paladin — and the app
// already holds every talent with its icon, so this is derived from data in the repo with no fetch at
// all. Deterministic: the highest `row` in the tree.
//
// Run: node tools/ingest/ingest-raidcomp-icons.mjs
// Writes: src/domain/raidcomp/raidcompIcons.json

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { registerHooks } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const CACHE = resolve(HERE, '.cache/buff-scope')

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
const { getTalentData } = await import(pathToFileURL(resolve(REPO, 'src/domain/talents/sampleTalents.ts')).href)
const { tbcClasses } = await import(pathToFileURL(resolve(REPO, 'src/domain/character/tbcClasses.ts')).href)

mkdirSync(CACHE, { recursive: true })

async function pageFor(spellId) {
  const file = resolve(CACHE, `${spellId}.html`)
  if (existsSync(file)) return readFileSync(file, 'utf8')
  const res = await fetch(`https://www.wowhead.com/tbc/spell=${spellId}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })
  if (!res.ok) throw new Error(`spell ${spellId}: HTTP ${res.status}`)
  const html = await res.text()
  writeFileSync(file, html)
  await new Promise((done) => setTimeout(done, 250))
  return html
}

/** Extracts the `{...}` argument of the Gatherer call by brace-matching, since it is JS, not JSON. */
function gathererPayload(html) {
  const anchor = html.indexOf('Gatherer.addData(6')
  if (anchor === -1) return undefined
  const start = html.indexOf('{', anchor)
  if (start === -1) return undefined

  let depth = 0
  let inString = false
  for (let i = start; i < html.length; i++) {
    const c = html[i]
    if (inString) {
      if (c === '\\') i++
      else if (c === '"') inString = false
      continue
    }
    if (c === '"') inString = true
    else if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(start, i + 1))
        } catch {
          return undefined
        }
      }
    }
  }
  return undefined
}

/**
 * Buffs whose spell page is legitimately named something else, with the reason.
 *
 * The name cross-check below is strict on purpose, so the few real mismatches have to be stated
 * rather than waved through. Spell 24858 is Moonkin *Form* — the aura is what the form grants, so
 * this app's entry is named for the effect while the spell is named for the shapeshift. Wowhead
 * shows the same icon for both.
 */
const NAME_ALIASES = {
  'moonkin-aura': 'Moonkin Form',
}

const spellIcons = {}
const failures = []

for (const entry of [...sampleBuffs, ...sampleTargetDebuffs]) {
  const payload = gathererPayload(await pageFor(entry.spellId))
  const record = payload?.[String(entry.spellId)]

  if (!record?.icon) {
    failures.push(`${entry.name} (${entry.spellId}): no icon in the id-keyed payload`)
    continue
  }

  /*
   * The safeguard that makes this trustworthy. Reading an icon by id is only correct if the id really
   * is the spell we think it is, and the payload states the name — so a drift in either direction
   * fails loudly rather than returning a neighbouring spell's artwork.
   */
  const expected = NAME_ALIASES[entry.id] ?? entry.name
  if (record.name_enus !== expected) {
    failures.push(`${entry.name} (${entry.spellId}): payload names it "${record.name_enus}"`)
    continue
  }

  spellIcons[entry.id] = {
    name: entry.name,
    spellId: entry.spellId,
    icon: record.icon,
    ...(NAME_ALIASES[entry.id] ? { spellName: record.name_enus } : {}),
  }
}

const specIcons = {}
for (const definition of tbcClasses) {
  const data = getTalentData(definition.className)
  for (const tree of data.trees) {
    const deepest = tree.talents.reduce((a, b) => (b.row > a.row ? b : a))
    specIcons[`${definition.className}|${tree.spec}`] = {
      className: definition.className,
      spec: tree.spec,
      icon: deepest.icon,
      /* Recorded so the choice is auditable rather than magic — this is the talent it came from. */
      fromTalent: deepest.name,
    }
  }
}

const out = {
  $schema: 'raid composition icon names',
  generatedBy: 'tools/ingest/ingest-raidcomp-icons.mjs',
  note: 'Buff icons from each spell\'s id-keyed Wowhead payload, cross-checked on name_enus. Spec icons from each talent tree\'s deepest talent, derived from data already in the repo.',
  spellIcons,
  specIcons,
}

writeFileSync(resolve(REPO, 'src/domain/raidcomp/raidcompIcons.json'), `${JSON.stringify(out, null, 2)}\n`)

console.log(`raidcomp icons: ${Object.keys(spellIcons).length} spells, ${Object.keys(specIcons).length} specs`)
if (failures.length > 0) {
  console.log(`\n${failures.length} unresolved — these need a human, not a guess:`)
  for (const failure of failures) console.log(`  ${failure}`)
}
