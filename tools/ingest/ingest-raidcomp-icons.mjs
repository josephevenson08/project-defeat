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

/**
 * The conventional TBC spec icons, which is what players actually recognise.
 *
 * **The deepest-talent rule this used to apply was clever and wrong.** It is deterministic and it
 * produced `inv_sword_11` for Protection Warrior and `inv_misc_head_dragon_01` for Fire Mage —
 * defensible as data, unrecognisable as an interface. These are the icons the game and every
 * community tool use for a spec, so they are curated rather than derived.
 *
 * Curated does not mean unverified: `fetch-icons.mjs` downloads every name here and fails loudly on a
 * 404, so a typo cannot ship as a silently broken image.
 */
const SPEC_ICONS = {
  'Warrior|Arms': 'ability_warrior_savageblow',
  'Warrior|Fury': 'ability_warrior_innerrage',
  'Warrior|Protection': 'ability_warrior_defensivestance',
  'Paladin|Holy': 'spell_holy_holybolt',
  'Paladin|Protection': 'spell_holy_devotionaura',
  'Paladin|Retribution': 'spell_holy_auraoflight',
  'Hunter|Beast Mastery': 'ability_hunter_beasttaming',
  'Hunter|Marksmanship': 'ability_marksmanship',
  'Hunter|Survival': 'ability_hunter_swiftstrike',
  'Rogue|Assassination': 'ability_rogue_eviscerate',
  'Rogue|Combat': 'ability_backstab',
  'Rogue|Subtlety': 'ability_stealth',
  'Priest|Discipline': 'spell_holy_wordfortitude',
  'Priest|Holy': 'spell_holy_renew',
  'Priest|Shadow': 'spell_shadow_shadowwordpain',
  'Shaman|Elemental': 'spell_nature_lightning',
  'Shaman|Enhancement': 'spell_nature_lightningshield',
  'Shaman|Restoration': 'spell_nature_magicimmunity',
  'Mage|Arcane': 'spell_holy_magicalsentry',
  'Mage|Fire': 'spell_fire_firebolt02',
  'Mage|Frost': 'spell_frost_frostbolt02',
  'Warlock|Affliction': 'spell_shadow_deathcoil',
  'Warlock|Demonology': 'spell_shadow_metamorphosis',
  'Warlock|Destruction': 'spell_shadow_rainoffire',
  'Druid|Balance': 'spell_nature_starfall',
  // Feral splits into bear and cat in the raid planner; this is the shared fallback.
  'Druid|Feral': 'ability_druid_ferociousbite',
  'Druid|Restoration': 'spell_nature_healingtouch',
}

/** Icons for raid builds that are not a spec of their own — the Feral split and Dreamstate. */
const BUILD_ICONS = {
  'druid-feral-tank': 'ability_racial_bearform',
  'druid-feral-cat': 'ability_druid_ferociousbite',
  'druid-dreamstate': 'ability_druid_dreamstate',
}

const specIcons = {}
for (const definition of tbcClasses) {
  const data = getTalentData(definition.className)
  for (const tree of data.trees) {
    const key = `${definition.className}|${tree.spec}`
    const curated = SPEC_ICONS[key]
    if (!curated) {
      failures.push(`${key}: no curated spec icon`)
      continue
    }
    /* The deepest talent is still recorded, as the audit trail for what the icon used to be. */
    const deepest = tree.talents.reduce((a, b) => (b.row > a.row ? b : a))
    specIcons[key] = {
      className: definition.className,
      spec: tree.spec,
      icon: curated,
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
  buildIcons: BUILD_ICONS,
}

writeFileSync(resolve(REPO, 'src/domain/raidcomp/raidcompIcons.json'), `${JSON.stringify(out, null, 2)}\n`)

console.log(`raidcomp icons: ${Object.keys(spellIcons).length} spells, ${Object.keys(specIcons).length} specs`)
if (failures.length > 0) {
  console.log(`\n${failures.length} unresolved — these need a human, not a guess:`)
  for (const failure of failures) console.log(`  ${failure}`)
}
