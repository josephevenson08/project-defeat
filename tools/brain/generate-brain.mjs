#!/usr/bin/env node
/**
 * Generates the Obsidian "brain" — a linked note network under `brain/` that Obsidian's graph view
 * can render as a live map of this project.
 *
 * Three layers, cross-linked:
 *   Architecture/  one note per source module, with real import/importer edges
 *   Project/       roadmap phases, decisions, provenance, session log
 *   Domain/        TBC knowledge derived from the actual domain data (classes, specs, raids, bosses,
 *                  professions) plus curated concept notes
 *
 * Run with `npm run brain`. Safe to re-run: everything below the `<!-- brain:manual -->` marker in
 * any note is preserved verbatim, so hand-written notes survive regeneration.
 *
 * Data is read from the real TypeScript sources rather than duplicated here. Because the project
 * uses extensionless bundler-style imports that Node's ESM loader will not resolve, the domain
 * modules are first bundled with the rolldown already present as a Vite dependency — no extra
 * package is needed.
 */

import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const REPO_ROOT = path.resolve(import.meta.dirname, '../..')
const SRC_ROOT = path.join(REPO_ROOT, 'src')
const VAULT_ROOT = path.join(REPO_ROOT, 'brain')

/**
 * Everything after this marker in an existing note is treated as hand-written and preserved.
 *
 * The match is anchored to its own line: notes are allowed to *mention* the marker inline (the vault
 * guide does), and an unanchored search would treat that prose as the start of the manual section
 * and duplicate the note's tail on every run.
 */
const MANUAL_MARKER = '<!-- brain:manual -->'
const MANUAL_MARKER_LINE = /^<!-- brain:manual -->\s*$/m

const stats = { written: 0, unchanged: 0, preserved: 0 }

// ---------------------------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------------------------

/**
 * Obsidian forbids these in filenames; every generated note title is run through this. Colons are
 * handled separately from the rest so `Tempest Keep: The Eye` reads as `Tempest Keep - The Eye`
 * rather than collapsing into a stray hyphen.
 */
function safeTitle(value) {
  return value
    .replace(/:\s*/g, ' - ')
    .replace(/[\\/*?"<>|#^[\]]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

function link(title, display) {
  const safe = safeTitle(title)
  return display && display !== safe ? `[[${safe}|${display}]]` : `[[${safe}]]`
}

function bullets(items) {
  return items.length > 0 ? items.map((item) => `- ${item}`).join('\n') : '_None._'
}

function frontmatter(fields) {
  const lines = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0))
    .map(([key, value]) => {
      if (Array.isArray(value)) return `${key}: [${value.join(', ')}]`
      if (typeof value === 'string' && /[:#]/.test(value)) return `${key}: "${value.replace(/"/g, '\\"')}"`
      return `${key}: ${value}`
    })
  return `---\n${lines.join('\n')}\n---`
}

function sortUnique(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b))
}

/**
 * Writes a note, preserving any hand-written tail. Returns without touching the file when the
 * generated part is byte-identical, so re-running the generator does not churn mtimes (which
 * matters when the vault lives in OneDrive).
 */
async function writeNote(relativePath, body) {
  const absolute = path.join(VAULT_ROOT, relativePath)
  await mkdir(path.dirname(absolute), { recursive: true })

  let manualTail = ''
  if (existsSync(absolute)) {
    const existing = await readFile(absolute, 'utf8')
    const marker = existing.match(MANUAL_MARKER_LINE)
    if (marker?.index !== undefined) {
      manualTail = existing.slice(marker.index)
      stats.preserved += 1
    }
  }

  const generated = `${body.trimEnd()}\n`
  const next = manualTail
    ? `${generated}\n${manualTail.trimEnd()}\n`
    : `${generated}\n${MANUAL_MARKER}\n\n## Notes\n\n_Anything you write below the marker above is kept when the brain is regenerated._\n`

  if (existsSync(absolute)) {
    const current = await readFile(absolute, 'utf8')
    if (current === next) {
      stats.unchanged += 1
      return
    }
  }

  await writeFile(absolute, next, 'utf8')
  stats.written += 1
}

// ---------------------------------------------------------------------------------------------
// Layer 1: the module graph, read straight out of the source tree
// ---------------------------------------------------------------------------------------------

const LAYER_BY_PREFIX = [
  ['domain/', 'domain'],
  ['features/', 'features'],
  ['components/', 'components'],
  ['data/', 'data'],
  ['lib/', 'lib'],
]

/** `src/domain/raids/raidTypes.ts` -> `domain.raids.raidTypes`, which is unique and reads like a module path. */
function moduleTitle(relativeToSrc) {
  return relativeToSrc.replace(/\.(tsx?|css)$/, '').split('/').join('.')
}

function layerOf(relativeToSrc) {
  for (const [prefix, layer] of LAYER_BY_PREFIX) {
    if (relativeToSrc.startsWith(prefix)) return layer
  }
  return 'app'
}

async function walk(directory) {
  const results = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) results.push(...(await walk(absolute)))
    else results.push(absolute)
  }
  return results
}

function cleanDocComment(raw) {
  return raw
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, '').trimEnd())
    .join('\n')
    .trim()
}

/**
 * Pulls the block comment at the top of the file, for context in the module note.
 *
 * A file header that precedes the imports wins outright. Failing that, the first block comment after
 * the imports is used — but only when it spans multiple lines, because in this codebase a one-liner
 * there is a field/type description (`/** Armour tier a raid rewards. *\/`) rather than anything that
 * describes the module. Purely presentational; a missing comment just means a shorter note.
 */
function leadingDocComment(source) {
  const header = source.match(/^\s*\/\*\*([\s\S]*?)\*\//)
  if (header) return cleanDocComment(header[1])

  const afterImports = source.match(/^(?:\s*(?:\/\/[^\n]*\n|import[^\n]*\n|\n))*\/\*\*([\s\S]*?)\*\//)
  if (!afterImports) return undefined
  const cleaned = cleanDocComment(afterImports[1])
  return cleaned.includes('\n') ? cleaned : undefined
}

function exportedSymbols(source) {
  const symbols = []
  const patterns = [
    [/^export\s+(?:async\s+)?function\s+([A-Za-z0-9_$]+)/gm, 'function'],
    [/^export\s+const\s+([A-Za-z0-9_$]+)/gm, 'const'],
    [/^export\s+type\s+([A-Za-z0-9_$]+)/gm, 'type'],
    [/^export\s+interface\s+([A-Za-z0-9_$]+)/gm, 'interface'],
    [/^export\s+class\s+([A-Za-z0-9_$]+)/gm, 'class'],
  ]
  for (const [pattern, kind] of patterns) {
    for (const match of source.matchAll(pattern)) symbols.push({ name: match[1], kind })
  }
  // Barrel re-exports (`export { a, b } from './x'`) carry the module's real public surface.
  for (const match of source.matchAll(/^export\s+(?:type\s+)?\{([^}]+)\}\s+from/gm)) {
    for (const raw of match[1].split(',')) {
      const name = raw.trim().split(/\s+as\s+/).pop()?.trim()
      if (name) symbols.push({ name, kind: 're-export' })
    }
  }
  return symbols
}

/** Resolves a relative import specifier to a path under src, trying the same extensions Vite does. */
function resolveImport(fromRelative, specifier, known) {
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(fromRelative), specifier))
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`, `${base}.css`]
  return candidates.find((candidate) => known.has(candidate))
}

async function scanModules() {
  const files = (await walk(SRC_ROOT))
    .map((absolute) => path.relative(SRC_ROOT, absolute).split(path.sep).join('/'))
    .filter((relative) => /\.(tsx?|css)$/.test(relative))
    .sort()

  const known = new Set(files)
  const modules = new Map()

  for (const relative of files) {
    const source = await readFile(path.join(SRC_ROOT, relative), 'utf8')
    const specifiers = [
      ...source.matchAll(/(?:from\s+|import\s+)['"](\.[^'"]+)['"]/g),
    ].map((match) => match[1])

    modules.set(relative, {
      relative,
      title: moduleTitle(relative),
      layer: layerOf(relative),
      lines: source.split('\n').length,
      doc: leadingDocComment(source),
      exports: exportedSymbols(source),
      imports: sortUnique(
        specifiers.map((specifier) => resolveImport(relative, specifier, known)).filter(Boolean),
      ),
      importedBy: [],
    })
  }

  for (const module of modules.values()) {
    for (const target of module.imports) modules.get(target)?.importedBy.push(module.relative)
  }
  for (const module of modules.values()) module.importedBy = sortUnique(module.importedBy)

  return modules
}

// ---------------------------------------------------------------------------------------------
// Layer 2: the real domain data, bundled out of src so nothing is duplicated here
// ---------------------------------------------------------------------------------------------

const DOMAIN_ENTRY = `
export { tbcClasses, getRoleForSpec } from '../../src/domain/character/tbcClasses'
export { racesByFaction, racesByClass } from '../../src/domain/character/races'
export { gearSlots } from '../../src/domain/gear/gearSlots'
export { sampleItems } from '../../src/domain/gear/sampleItems'
export { sampleRaids } from '../../src/domain/raids/sampleRaids'
export { sampleRaidBosses } from '../../src/domain/raids/sampleRaidBosses'
export { sampleAttunements } from '../../src/domain/raids/sampleAttunements'
export { sampleSignatureAbilities } from '../../src/domain/abilities/sampleSignatureAbilities'
export { bisLists } from '../../src/domain/bis/bisLists'
export { allProfessions, sampleProfessions } from '../../src/domain/professions/sampleProfessions'
export { sampleBuffs } from '../../src/domain/buffs/sampleBuffs'
export { sampleTargetDebuffs } from '../../src/domain/buffs/sampleTargetDebuffs'
export { sampleConsumables } from '../../src/domain/consumables/sampleConsumables'
export { sampleEnchants } from '../../src/domain/enchants/sampleEnchants'
export { sampleGems } from '../../src/domain/gems/sampleGems'
`

async function loadDomainData() {
  const { rolldown } = await import('rolldown')
  const scratch = await mkdtemp(path.join(tmpdir(), 'brain-'))
  const inside = path.join(REPO_ROOT, 'node_modules', '.brain')
  await mkdir(inside, { recursive: true })

  // The entry has to sit inside the repo so its relative imports resolve; the bundle output can go
  // anywhere. `node_modules/.brain` is already ignored by git and by every tsconfig include.
  const entry = path.join(inside, 'entry.ts')
  await writeFile(entry, DOMAIN_ENTRY, 'utf8')

  const bundle = await rolldown({ input: entry, platform: 'node', logLevel: 'silent' })
  const { output } = await bundle.generate({ format: 'esm' })
  await bundle.close?.()

  const bundlePath = path.join(scratch, 'domain-data.mjs')
  await writeFile(bundlePath, output[0].code, 'utf8')
  const data = await import(pathToFileURL(bundlePath).href)

  await rm(scratch, { recursive: true, force: true })
  await rm(inside, { recursive: true, force: true })
  return data
}

// ---------------------------------------------------------------------------------------------
// Curated concept notes. Prose lives here; the links into it are generated.
// ---------------------------------------------------------------------------------------------

const CONCEPTS = [
  {
    title: 'Attack Table',
    summary: 'The ordered roll that decides what a physical swing does.',
    body: `TBC resolves every physical attack against a single ordered table — miss, dodge, parry, glance, block, crit, hit — rather than rolling each outcome independently. Because the table is ordered and sums to 100%, adding avoidance to the target *pushes crit off the bottom*, which is why hit and expertise are worth so much more than their raw percentages suggest.

Glancing blows only apply to white swings against a higher-level target and cannot be avoided by any amount of gear, which is the single biggest reason a level-70 melee's white DPS against a level-73 boss is lower than the same character's damage in a level-70 duel.`,
    modules: ['domain/simulation/attackTable.ts', 'domain/simulation/combatConstants.ts'],
    related: ['Spell Table', 'Stat Weights', 'Armor Mitigation'],
  },
  {
    title: 'Spell Table',
    summary: 'The spell-side equivalent: hit capped by level difference, then crit.',
    body: `Spells use a much simpler table than physical attacks: they either miss or land, and a landed spell can crit. There is no dodge, parry, glance, or block on the spell side.

Base spell miss against a target three levels above the caster is 17% in TBC, which is where the famous 202 spell-hit-rating cap comes from — 16% of it is removable by gear and the last 1% is not. Talents that grant spell hit (Elemental Precision, Suppression) reduce the amount of rating needed, so the practical cap is spec-dependent.`,
    modules: ['domain/simulation/spellTable.ts', 'domain/simulation/combatConstants.ts'],
    related: ['Attack Table', 'Spell Coefficients', 'Stat Weights'],
  },
  {
    title: 'Spell Coefficients',
    summary: 'How much of your spell power a given ability actually receives.',
    body: `TBC derives almost every spell coefficient from one formula rather than storing it per spell:

- Direct damage and healing: \`castTime / 3.5\`, with the cast time first clamped to [1.5s, 7s]. Every instant cast therefore shares the 1.5/3.5 = 0.4286 floor, and a 3.5s cast reaches 1.0.
- Periodic effects: \`duration / 15\`, split evenly across ticks. An 18s DoT carries 1.2 total.
- Channels use the channel duration in place of a cast time.

Two modifiers explain most values that look wrong at first glance: area-effect abilities receive only **half** the computed coefficient, and each additional non-damage effect (a slow, a stun) costs a further **5%** multiplicatively. Frostbolt's 0.8143 is exactly \`(3.0 / 3.5) * 0.95\` because of its slow.

A handful of abilities are hardcoded exceptions the formula gets wrong — Fireball keeps a full 1.0 on its direct component while its DoT tail scales with nothing. That is why the simulator reads each ability's researched coefficient where one exists instead of recomputing it.`,
    modules: ['domain/simulation/damageFormulas.ts', 'domain/abilities/abilityTypes.ts'],
    related: ['Spell Table', 'Signature Abilities'],
  },
  {
    title: 'Tank Avoidance',
    summary: 'The defender side of the attack table — and the one place this project is knowingly wrong.',
    body: `Avoidance is not symmetric, and TBC uses two genuinely different tables rather than one formula run in both directions. A level-70 player fighting a level-73 boss is the under-skilled party either way: the boss avoids more of the player's attacks, and the player avoids less of the boss's. The level gap therefore enters the two tables with **opposite sign**.

Attacker side (the player swinging at the boss) scales *up* with the gap — the boss reaches 6.5% dodge and 14% parry at three levels above. Defender side (the boss swinging at the player) scales *down*: miss, parry and block each start at a flat 5% and lose 0.2% per attacker level, reaching 4.4% at level 73, while dodge has no flat base at all and takes a straight -0.6% penalty on top of whatever Agility and dodge rating provide.

This project reused the attacker-side helpers for both directions until an audit caught it, which handed the player the boss's own 14% parry and made a *wider* level gap look like better tanking. Both tables are now modelled separately.

Defense Skill is the other half. One point moves five things at once by 0.04%: it adds to dodge, parry and block, adds to the attacker's miss chance, and subtracts from the attacker's crit chance. That last term is where 490 Defense Skill for uncrittable comes from — a level-73 boss crits for 5.6% raw, and 0.056 / 0.0004 is 140 points above the 350 a level 70 already has.

All of it resolves as **one ordered roll**, not a sum: miss, dodge, parry, block, crit, crushing blow, hit. That ordering is the whole mechanic behind uncrushable. A crushing blow is a flat 15% for 150% damage from a three-level-higher attacker, and Defense Rating does nothing to it — the only defence is stacking enough miss/dodge/parry/block that the roll is exhausted before it reaches the crush row. That is why TBC Warriors could become uncrushable through Shield Block and Paladins and Druids could not.

Summing the outcomes instead, which this project did at first, quietly overstates survivability: the parts add up to more than one swing can produce, and the reason avoidance is valuable stops being visible.

What the score still does not do is price *severity*. It weights avoidance, armor and stamina, so it treats a crit and a plain hit as equally bad once they land. The damage-per-swing figure in the breakdown is the number that accounts for crit and crush multipliers, and it counts a blocked swing as a full hit because block subtracts a flat block value rather than a fraction — a slight overestimate for a shield tank.`,
    modules: ['domain/simulation/attackTable.ts', 'features/simulator/calculateSimulation.ts'],
    related: ['Attack Table', 'Armor Mitigation', 'Stat Weights'],
  },
  {
    title: 'Armor Mitigation',
    summary: 'Diminishing physical damage reduction, capped at 75%.',
    body: `Physical damage reduction from armor follows \`armor / (armor + K)\` where K depends on the attacker's level, and is hard-capped at 75%. The curve means each point of armor is worth less than the last, so stacking armor past raid-boss levels returns very little — which is why TBC tank gearing pushes stamina and avoidance rather than raw armor once uncrittable is met.

The same formula runs in both directions in this project: the player's mitigation against a boss, and the boss's mitigation against the player's white damage.`,
    modules: ['domain/simulation/damageFormulas.ts', 'domain/simulation/combatConstants.ts'],
    related: ['Attack Table', 'Tank'],
  },
  {
    title: 'Stat Weights',
    summary: 'Marginal value of one point of a stat, measured by re-running the sim.',
    body: `Stat weights here are computed rather than authored: the simulator runs once for the current build, then once more per stat with a small amount of that stat added, and the difference is the weight. That makes them automatically correct for whatever the sim actually models — and equally, silently blind to whatever it does not.

Weights are reported relative to the best stat, which is the form that is useful while gearing ("is this +hit piece better than that +crit piece?"). Absolute per-point values are also shown because relative weights hide how flat a build's curve is.

The honest caveat: a stat the simulator does not model gets a weight of zero, not a low weight. Anything in the unmodeled list on the panel should be read as "unknown", not "worthless".`,
    modules: ['features/simulator/calculateStatWeights.ts', 'features/simulator/StatWeightsPanel.tsx'],
    related: ['Attack Table', 'Spell Table', 'Best in Slot'],
  },
  {
    title: 'Best in Slot',
    summary: 'Per-spec ranked item lists, phase-scoped.',
    body: `A BiS list in this project is a ranked list per class/spec/phase/slot, not a single answer. Each entry carries its source (raid, boss, vendor, reputation, crafting) so the list doubles as an acquisition plan rather than just a target.

All 27 specs have Phase 1/2 starter rankings. They are guide-shaped rather than tooltip-audited: items whose stats were approximated are flagged so the UI can say so. See [[Needs Verification]].`,
    modules: ['domain/bis/bisTypes.ts', 'domain/bis/bisLists.ts', 'features/bis/BisPanel.tsx'],
    related: ['Needs Verification', 'Content Phases', 'Stat Weights'],
  },
  {
    title: 'Sockets and Gems',
    summary: 'Socket colours, socket bonuses, and the meta-gem activation rule.',
    body: `TBC introduced sockets. Each socket has a colour (Red/Yellow/Blue/Meta); matching every socket's colour grants the item's socket bonus, which is often worth more than upgrading one gem.

Meta gems are the interesting constraint: each carries an activation requirement expressed in coloured gems already socketed elsewhere ("at least 2 Red gems", "more Blue than Yellow"), so a meta gem can be equipped and still be inactive. That coupling between one slot's gem and the rest of the set is why gem choice cannot be optimised slot by slot.`,
    modules: ['domain/gems/gemTypes.ts', 'domain/gems/sampleGems.ts', 'domain/gear/itemTypes.ts'],
    related: ['Best in Slot', 'Enchants', 'Jewelcrafting'],
  },
  {
    title: 'Enchants',
    summary: 'Permanent slot upgrades, with real Phase 1/2 availability gaps.',
    body: `Enchants are modelled per slot with role targeting. The gaps matter as much as the entries: casters and healers had no cloak or leg-armour enchant this early in TBC, so their absence in the data is intentional rather than missing coverage.

Weapon enchants are the largest single upgrade in the system — Mongoose for physical DPS, Soulfrost/Sunfire for casters — and several drop as formulas from raid bosses rather than being trainable.`,
    modules: ['domain/enchants/enchantTypes.ts', 'domain/enchants/sampleEnchants.ts'],
    related: ['Sockets and Gems', 'Best in Slot', 'Enchanting'],
  },
  {
    title: 'Buffs Debuffs and Consumables',
    summary: 'Raid buffs, target debuffs, and flask/elixir/food, all fed into the stat pipeline.',
    body: `Three separate mechanics share one panel because they all resolve into the same stat pipeline:

- **Buffs** apply to the player, as flat stats or percentage multipliers.
- **Target debuffs** modify the *target*, not the player — armor reduction, physical and spell crit taken, spell damage taken. These are why raid DPS is superadditive: Winter's Chill and Improved Scorch make everyone else's damage go up.
- **Consumables** are flasks, elixirs, and food, each carrying its Alchemy or Cooking provenance so the planner can answer "who makes this?".

The distinction that trips people up: buffs multiply your own numbers, debuffs multiply everyone's.`,
    modules: [
      'domain/buffs/buffTypes.ts',
      'domain/buffs/sampleBuffs.ts',
      'domain/buffs/sampleTargetDebuffs.ts',
      'domain/consumables/consumableTypes.ts',
      'features/buffs/BuffsPanel.tsx',
    ],
    related: ['Stat Weights', 'Alchemy', 'Cooking'],
  },
  {
    title: 'Attunement',
    summary: 'The quest chains that gate raid entry, and why they shape the raid week.',
    body: `TBC gates its raids behind attunement chains rather than item level. The chains run through heroic dungeons and earlier raids, which is why Karazhan, Gruul's Lair, and Magtheridon's Lair stay in the weekly rotation long after their loot stops mattering — they hold the keys to Serpentshrine Cavern and Tempest Keep.

Two of the five raids here have their full ordered chain modelled step by step; the other three carry a one-line summary because their requirement is short enough to state in a sentence.`,
    modules: ['domain/raids/raidTypes.ts', 'domain/raids/sampleAttunements.ts', 'features/raids/RaidAttunementChain.tsx'],
    related: ['Content Phases', 'Serpentshrine Cavern', 'Tempest Keep'],
  },
  {
    title: 'Content Phases',
    summary: 'What content is current, and why the data is phase-scoped.',
    body: `TBC Classic releases content in phases, so "best in slot" is only meaningful with a phase attached. Phase 1 covers Karazhan, Gruul's Lair, and Magtheridon's Lair (T4); Phase 2 adds Serpentshrine Cavern and Tempest Keep (T5).

Every item, BiS entry, and raid in this project carries a phase field for exactly this reason. Note the distinction the raid data draws: a raid's \`phase\` is the phase it was *current content* for, not the phase it is still worth running in.`,
    modules: ['domain/gear/itemTypes.ts', 'domain/raids/raidTypes.ts', 'domain/bis/bisTypes.ts'],
    related: ['Best in Slot', 'Attunement'],
  },
  {
    title: 'Needs Verification',
    summary: 'The project-wide honesty flag on approximated data.',
    body: `Any value that was not read off a real source is flagged \`needsVerification: true\` and surfaced in the UI rather than silently presented as fact. This applies to item stats, weapon damage dice, BiS placements, raid drops not yet in the catalog, and the tank avoidance baseline.

The reason it exists: Wowhead's guide pages are JavaScript-rendered, so stat blocks were cross-checked against static summaries and prior knowledge rather than scraped. The flag is what keeps "approximated" from quietly becoming "sourced". Clearing flags is real, ongoing work — see the roadmap phases.`,
    modules: ['domain/gear/itemTypes.ts', 'domain/raids/raidTypes.ts', 'domain/abilities/abilityTypes.ts'],
    related: ['Data Provenance', 'Best in Slot'],
  },
  {
    title: 'Gear Slots',
    summary: 'The 18-slot TBC paperdoll, including the spec-dependent Ranged/Relic swap.',
    body: `The slot model is the full TBC paperdoll, including paired slots (two rings, two trinkets) and the Ranged/Relic slot that swaps meaning by class: Shamans see Totem, Paladins Libram, Druids Idol, and everyone else a bow/gun/crossbow.

Slot *visibility* is therefore spec-aware rather than fixed, and slot *compatibility* has to understand that Finger 1 and Finger 2 accept the same items while respecting unique-equipped.`,
    modules: [
      'domain/gear/gearSlots.ts',
      'domain/gear/slotVisibility.ts',
      'domain/gear/slotCompatibility.ts',
      'domain/gear/characterItemRules.ts',
    ],
    related: ['Best in Slot', 'Sockets and Gems'],
  },
  {
    title: 'Signature Abilities',
    summary: 'One real ability per spec, standing in for a full rotation.',
    body: `Each of the 27 specs has one researched signature ability — a filler nuke, a maintained DoT, a spam heal, or a tank's primary threat button — recorded with its real cast time, base amount, coefficient, resource cost, and rank at level 70.

This is deliberately *not* a rotation model. It exists to replace the generic 3s-nuke and 2.5s-heal placeholders in the simulator with something spec-specific, and every entry's notes say how far that approximation sits from the spec's real rotation. Multi-ability priority, cooldown usage, proc modelling, and talent scaling are all still ahead.

Specs whose signature ability is a physical special (Bloodthirst, Mutilate, Steady Shot) keep the generic cast on the spell side, because those scale off attack power and weapon damage and belong to the physical path instead — where the melee ones are now layered on through a separate yellow attack table.`,
    modules: ['domain/abilities/abilityTypes.ts', 'features/simulator/calculateSimulation.ts'],
    related: ['Spell Coefficients', 'Stat Weights'],
  },
  {
    title: 'Build Serialization',
    summary: 'Turning a planned character into something shareable.',
    body: `A build is character profile + equipped gear + gems + enchants + active buffs, consumables, and target debuffs. Serialization exists so a build can be saved, exported, and re-imported without a backend — the whole point of staying local-first.

This is the foundation the planned CurseForge addon import lands on: the addon exports live in-game state, the site parses it into the same build shape, and every existing panel then works against the player's actual character instead of a hand-picked one.`,
    modules: ['domain/builds/buildTypes.ts', 'domain/builds/buildSerialization.ts'],
    related: ['Phase 5 - Planner Workflows', 'Phase 6 - In-Game Import'],
  },
]

// ---------------------------------------------------------------------------------------------
// Roadmap phases. Status text is authored; module links are generated.
// ---------------------------------------------------------------------------------------------

const PHASES = [
  {
    number: 1,
    title: 'Phase 1 - Local Foundation',
    status: 'complete',
    summary: 'A local React/Vite app with every class and spec, the full slot model, and prototype stat calculation.',
    done: [
      'Local React + TypeScript + Vite app',
      'All nine classes and 27 specs represented',
      'Faction-aware race selection with real TBC race/class legality',
      'Full 18-slot TBC gear model',
      'Prototype stat calculation with role-aware results',
      'Anime.js polish with reduced-motion support',
      'Playwright flow coverage',
    ],
    remaining: [],
    modules: ['domain/character/tbcClasses.ts', 'domain/character/races.ts', 'domain/gear/gearSlots.ts', 'features/stats/calculateStats.ts'],
  },
  {
    number: 2,
    title: 'Phase 2 - Gear Gems Enchants',
    status: 'mostly complete',
    summary: 'Structured item data with sources, sockets, legality rules, and per-spec rankings for every spec.',
    done: [
      'Structured item data with quality, source, phase, sockets, and socket bonuses',
      'Source/farming metadata: instance, boss, vendor, reputation, crafting profession',
      'Full crafting detail on crafted items: skill, specialization, recipe source, per-material farm spots',
      'Class/weapon/relic legality checks',
      'Phase 2 starter BiS for all 27 specs, including role meta gems and role-appropriate enchants',
      'Spec-aware slot labels and hidden-slot rules for every class',
    ],
    remaining: ['Reconcile every `needsVerification` item against a real Wowhead tooltip'],
    modules: ['domain/gear/itemTypes.ts', 'domain/gear/sampleItems.ts', 'domain/bis/bisLists.ts', 'domain/gems/sampleGems.ts', 'domain/enchants/sampleEnchants.ts'],
  },
  {
    number: 3,
    title: 'Phase 3 - Character Systems',
    status: 'partial',
    summary: 'Buffs, debuffs, and consumables are wired into the stat pipeline. Talents are not started.',
    done: [
      'Buffs as flat stats and percentage multipliers',
      'Target debuffs: armor reduction, crit taken, spell damage taken',
      'Consumables with Alchemy/Cooking provenance',
      'All 13 professions: skill tiers, trainer requirements, material farm locations, leveling paths',
    ],
    remaining: [
      'Talent trees',
      'Profession *bonuses to stats* (e.g. extra sockets from Blacksmithing) — distinct from the profession reference data that is done',
      'Race/class-specific assumptions beyond legality checks',
      'Feral bear/cat mode split',
    ],
    modules: ['domain/buffs/sampleBuffs.ts', 'domain/consumables/sampleConsumables.ts', 'domain/professions/sampleProfessions.ts', 'features/buffs/BuffsPanel.tsx'],
  },
  {
    number: 4,
    title: 'Phase 4 - Simulation',
    status: 'partial',
    summary: 'Real TBC attack-table and spell-table mechanics, plus per-spec signature abilities. No rotation model yet.',
    done: [
      'Real attack table: miss/dodge/parry/glance/block/crit with skill differentials',
      'Real spell table: level-based miss, rating conversions, spell crit',
      'Armor mitigation and per-weapon damage dice',
      'Target model that active debuffs actually modify',
      'Per-spec signature abilities feeding the caster and healer estimates',
      'Configurable encounter settings and computed stat weights',
    ],
    remaining: [
      'Multi-ability rotation priority and cooldown usage',
      'Proc modelling and talent scaling',
      'Multi-iteration variance',
      'Result charts',
    ],
    modules: ['domain/simulation/attackTable.ts', 'domain/simulation/spellTable.ts', 'features/simulator/calculateSimulation.ts', 'features/simulator/calculateStatWeights.ts'],
  },
  {
    number: 5,
    title: 'Phase 5 - Planner Workflows',
    status: 'partial',
    summary: 'Upgrade planning, build save/load and import/export all work. Comparison and cost planning do not.',
    done: [
      'Upgrade finder: per-slot candidate scan scored against the live sim',
      'Build serialization foundation (types + encode/decode)',
      'Autosave to localStorage and restore on load, seeded through lazy state initializers',
      'Export to a portable JSON snapshot and import it back, with per-slot issues reported',
      'Named build slots stored separately from the autosave, so switching character cannot destroy a saved build',
    ],
    remaining: [
      'Cloud/shareable builds — slots are browser-local, so they do not follow you to another machine',
      'Side-by-side gear comparison',
      'Source and cost planning',
      'Better responsive/mobile layout',
    ],
    modules: [
      'features/simulator/findUpgrades.ts',
      'features/simulator/UpgradesPanel.tsx',
      'domain/builds/buildSerialization.ts',
      'features/builds/buildStorage.ts',
      'features/builds/BuildPanel.tsx',
    ],
  },
  {
    number: 6,
    title: 'Phase 6 - In-Game Import',
    status: 'not started',
    summary: 'A companion WoW addon that exports live character state for the planner to read.',
    done: [],
    remaining: [
      'Build the CurseForge addon that reads equipped gear, gems, enchants, talents, professions, recipes',
      'Export to a copyable blob or SavedVariables file',
      'Parse the blob client-side and diff it against the spec BiS list',
      'Run the simulator against real gear instead of a hand-picked build',
    ],
    modules: ['domain/builds/buildSerialization.ts'],
  },
]

// ---------------------------------------------------------------------------------------------
// Note writers
// ---------------------------------------------------------------------------------------------

function moduleLinks(relatives, modules) {
  return relatives
    .map((relative) => modules.get(relative))
    .filter(Boolean)
    .map((module) => `${link(module.title)} — \`src/${module.relative}\``)
}

async function writeModuleNotes(modules) {
  for (const module of modules.values()) {
    const grouped = new Map()
    for (const symbol of module.exports) {
      if (!grouped.has(symbol.kind)) grouped.set(symbol.kind, [])
      grouped.get(symbol.kind).push(symbol.name)
    }

    const exportLines = [...grouped.entries()].map(
      ([kind, names]) => `**${kind}** — ${sortUnique(names).map((name) => `\`${name}\``).join(', ')}`,
    )

    const conceptLinks = CONCEPTS.filter((concept) => concept.modules.includes(module.relative)).map((concept) =>
      link(concept.title),
    )
    const phaseLinks = PHASES.filter((phase) => phase.modules.includes(module.relative)).map((phase) => link(phase.title))

    const body = [
      frontmatter({
        type: 'module',
        layer: module.layer,
        source: `src/${module.relative}`,
        lines: module.lines,
        generated: true,
        tags: [`brain/architecture`, `layer/${module.layer}`],
      }),
      '',
      `# ${module.title}`,
      '',
      `\`src/${module.relative}\` · **${module.layer}** layer · ${module.lines} lines`,
      '',
      module.doc
        ? `From the top of the file:\n\n> ${module.doc.split('\n').join('\n> ')}`
        : '_No doc comment at the top of this file._',
      '',
      '## Exports',
      '',
      exportLines.length > 0 ? exportLines.join('\n\n') : '_Nothing exported (side-effect or style module)._',
      '',
      '## Imports',
      '',
      bullets(moduleLinks(module.imports, modules)),
      '',
      '## Imported by',
      '',
      bullets(moduleLinks(module.importedBy, modules)),
      '',
      '## Concepts & phases',
      '',
      bullets([...conceptLinks, ...phaseLinks]),
      '',
      `Up: ${link('Architecture Map')}`,
    ].join('\n')

    await writeNote(path.join('Architecture', 'Modules', `${safeTitle(module.title)}.md`), body)
  }
}

async function writeArchitectureMap(modules) {
  const byLayer = new Map()
  for (const module of modules.values()) {
    if (!byLayer.has(module.layer)) byLayer.set(module.layer, [])
    byLayer.get(module.layer).push(module)
  }

  const layerOrder = ['app', 'components', 'features', 'domain', 'data', 'lib']
  const layerBlurb = {
    app: 'Entry points and the root composition. Owns which tab is showing and holds the planner state every panel reads.',
    components: 'Presentational shell and primitives. No domain knowledge — these would work unchanged in a different app.',
    features: 'Per-feature panels plus the calculation functions that drive them. This is where domain data becomes a number on screen.',
    domain: 'Typed TBC knowledge: rules, formulas, and data. Nothing here imports from `features` or `components`, which is what keeps the domain reusable.',
    data: 'Older guide-oriented data that predates the domain model and is not yet migrated into it.',
    lib: 'Cross-cutting helpers with no domain meaning.',
  }

  // Most-depended-on modules are the ones worth knowing about first.
  const hubs = [...modules.values()]
    .sort((a, b) => b.importedBy.length - a.importedBy.length)
    .slice(0, 12)

  const sections = layerOrder
    .filter((layer) => byLayer.has(layer))
    .map((layer) => {
      const entries = byLayer
        .get(layer)
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((module) => `- ${link(module.title)} · ${module.importedBy.length} importers`)
      return `### ${layer} (${byLayer.get(layer).length})\n\n${layerBlurb[layer] ?? ''}\n\n${entries.join('\n')}`
    })

  const body = [
    frontmatter({ type: 'moc', generated: true, tags: ['brain/architecture', 'moc'] }),
    '',
    '# Architecture Map',
    '',
    `${modules.size} modules across ${byLayer.size} layers. Every module note lists its real imports and importers, so Obsidian's graph view of this folder *is* the dependency graph.`,
    '',
    '## Dependency rule',
    '',
    'The one architectural invariant worth protecting: **`domain/` never imports from `features/` or `components/`.** Domain modules hold typed TBC knowledge that should stay usable outside this UI; features compose it. If that edge ever appears in a module note, it is a regression, not a shortcut.',
    '',
    '## Hubs',
    '',
    'The modules everything else leans on — change these carefully.',
    '',
    hubs.map((module) => `- ${link(module.title)} — ${module.importedBy.length} importers`).join('\n'),
    '',
    '## By layer',
    '',
    sections.join('\n\n'),
    '',
    `Up: ${link('Project Defeat Brain')}`,
  ].join('\n')

  await writeNote(path.join('Architecture', 'Architecture Map.md'), body)
}

async function writeDomainNotes(data, modules) {
  const { tbcClasses, getRoleForSpec, racesByClass, racesByFaction, gearSlots, sampleItems } = data
  const { sampleRaids, sampleRaidBosses, sampleAttunements, sampleSignatureAbilities } = data
  const { allProfessions, sampleProfessions, sampleBuffs, sampleTargetDebuffs, sampleConsumables } = data
  const { sampleEnchants, sampleGems, bisLists } = data

  const specTitle = (className, spec) => (spec === className ? spec : `${spec} ${className}`)

  // --- Roles -----------------------------------------------------------------------------------
  const roleSpecs = new Map()
  for (const entry of tbcClasses) {
    for (const spec of entry.specs) {
      const role = getRoleForSpec(entry.className, spec)
      if (!roleSpecs.has(role)) roleSpecs.set(role, [])
      roleSpecs.get(role).push({ className: entry.className, spec })
    }
  }

  const roleBlurb = {
    'Physical DPS': 'Scores off the attack table: weapon damage plus attack power, run through miss/dodge/parry/glance/crit and then armor mitigation. Hit and expertise punch above their raw percentages because the table is ordered.',
    'Caster DPS': 'Scores off the spell table: spell power scaled by the ability coefficient, gated by spell hit and multiplied by spell crit. The 202 hit-rating cap dominates early gearing.',
    Healer: 'Scores healing throughput from healing power, coefficient, crit, and haste, with MP5 reported alongside. Throughput without a mana model is only half the picture.',
    Tank: 'Scores survivability from avoidance and armor mitigation plus stamina. Uncrittable status still needs ~490 total Defense Skill regardless of the score.',
  }

  for (const [role, specs] of roleSpecs) {
    const body = [
      frontmatter({ type: 'role', generated: true, tags: ['brain/domain', 'domain/role'] }),
      '',
      `# ${role}`,
      '',
      roleBlurb[role] ?? '',
      '',
      `## Specs (${specs.length})`,
      '',
      bullets(specs.map(({ className, spec }) => `${link(specTitle(className, spec))} — ${link(className)}`)),
      '',
      '## Related',
      '',
      bullets([link('Stat Weights'), link('Attack Table'), link('Spell Table'), link('Best in Slot')]),
      '',
      `Up: ${link('TBC Knowledge Map')}`,
    ].join('\n')
    await writeNote(path.join('Domain', 'Roles', `${safeTitle(role)}.md`), body)
  }

  // --- Classes ---------------------------------------------------------------------------------
  for (const entry of tbcClasses) {
    const legalRaces = racesByClass[entry.className] ?? []
    const notableStats = Object.entries(entry.baseStats)
      .filter(([, value]) => typeof value === 'number' && value > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([key, value]) => `\`${key}\` ${value}`)

    const body = [
      frontmatter({ type: 'class', generated: true, tags: ['brain/domain', 'domain/class'] }),
      '',
      `# ${entry.className}`,
      '',
      `## Specs`,
      '',
      bullets(
        entry.specs.map(
          (spec) => `${link(specTitle(entry.className, spec))} — ${link(getRoleForSpec(entry.className, spec))}`,
        ),
      ),
      '',
      `## Legal races (${legalRaces.length})`,
      '',
      bullets(
        legalRaces.map((race) => {
          const faction = racesByFaction.Alliance.includes(race) ? 'Alliance' : 'Horde'
          return `${link(race)} (${faction})`
        }),
      ),
      '',
      '## Base stats at 70',
      '',
      notableStats.join(' · '),
      '',
      '## Where this lives in the code',
      '',
      bullets(moduleLinks(['domain/character/tbcClasses.ts', 'domain/character/races.ts'], modules)),
      '',
      `Up: ${link('TBC Knowledge Map')}`,
    ].join('\n')
    await writeNote(path.join('Domain', 'Classes', `${safeTitle(entry.className)}.md`), body)
  }

  // --- Races -----------------------------------------------------------------------------------
  for (const [faction, races] of Object.entries(racesByFaction)) {
    for (const race of races) {
      const classes = Object.entries(racesByClass)
        .filter(([, legal]) => legal.includes(race))
        .map(([className]) => className)
      const body = [
        frontmatter({ type: 'race', faction, generated: true, tags: ['brain/domain', 'domain/race'] }),
        '',
        `# ${race}`,
        '',
        `**${faction}**`,
        '',
        `## Legal classes (${classes.length})`,
        '',
        bullets(classes.map((className) => link(className))),
        '',
        '## Where this lives in the code',
        '',
        bullets(moduleLinks(['domain/character/races.ts'], modules)),
        '',
        `Up: ${link('TBC Knowledge Map')}`,
      ].join('\n')
      await writeNote(path.join('Domain', 'Races', `${safeTitle(race)}.md`), body)
    }
  }

  // --- Specs -----------------------------------------------------------------------------------
  for (const entry of tbcClasses) {
    for (const spec of entry.specs) {
      const title = specTitle(entry.className, spec)
      const role = getRoleForSpec(entry.className, spec)
      const ability = sampleSignatureAbilities.find(
        (candidate) => candidate.className === entry.className && candidate.spec === spec,
      )
      const bis = (bisLists ?? []).filter(
        (list) => list.className === entry.className && list.spec === spec,
      )
      const bisEntries = bis.flatMap((list) => list.entries ?? [])

      // Which raids this spec's BiS list actually sends you to — the useful cross-link. An entry's
      // instance can come from the BiS source metadata or from the catalog item it points at.
      const bisSourceRaids = sortUnique(
        bisEntries
          .map(
            (bisEntry) =>
              bisEntry.source?.instance ?? sampleItems.find((item) => item.id === bisEntry.itemId)?.instance,
          )
          .filter(Boolean)
          .map((instance) => sampleRaids.find((raid) => raid.instanceNames.includes(instance))?.name)
          .filter(Boolean),
      )

      const flaggedCount = bisEntries.filter((bisEntry) => bisEntry.needsVerification).length
      const slotsCovered = new Set(bisEntries.map((bisEntry) => bisEntry.slot)).size

      const abilityBlock = ability
        ? [
            `**${ability.name}**${ability.rank ? ` (rank ${ability.rank})` : ''} — spell ID ${ability.spellId}, ${ability.effectType}`,
            '',
            `- Cast: ${ability.castTimeSeconds === 0 ? 'instant' : `${ability.castTimeSeconds}s`}${ability.channeled ? ' (channeled)' : ''} · GCD ${ability.gcdSeconds}s${ability.cooldownSeconds ? ` · CD ${ability.cooldownSeconds}s` : ''}`,
            ability.baseAmount ? `- Base amount: ${ability.baseAmount.min}–${ability.baseAmount.max}` : undefined,
            ability.scaling.spellPowerCoefficient !== undefined
              ? `- Spell power coefficient: ${ability.scaling.spellPowerCoefficient} (basis: ${ability.scaling.basis})`
              : `- Scaling basis: ${ability.scaling.basis}`,
            ability.scaling.attackPowerCoefficient !== undefined
              ? `- Attack power coefficient: ${ability.scaling.attackPowerCoefficient}`
              : undefined,
            ability.resource ? `- Cost: ${ability.resource.cost} ${ability.resource.type}${ability.resource.note ? ` (${ability.resource.note})` : ''}` : undefined,
            // Blank line is required here: a blockquote flush against a list renders as part of it.
            ability.notes ? `\n> ${ability.notes}` : undefined,
          ]
            .filter((line) => line !== undefined)
            .join('\n')
        : '_No signature ability recorded for this spec._'

      const body = [
        frontmatter({
          type: 'spec',
          class: entry.className,
          spec,
          role,
          generated: true,
          tags: ['brain/domain', 'domain/spec', `role/${role.replace(/\s+/g, '-')}`],
        }),
        '',
        `# ${title}`,
        '',
        `${link(entry.className)} · ${link(role)}`,
        '',
        '## Signature ability',
        '',
        abilityBlock,
        '',
        `## Best in slot`,
        '',
        bis.length > 0
          ? bullets(
              bis.map(
                (list) =>
                  `**Phase ${list.phase}** — ${(list.entries ?? []).length} ranked entries across ${slotsCovered} slots · source: ${list.sourceName}`,
              ),
            )
          : '_No BiS list yet._',
        '',
        flaggedCount > 0
          ? `${flaggedCount} of ${bisEntries.length} entries are flagged ${link('Needs Verification')}.`
          : '',
        '',
        bisSourceRaids.length > 0
          ? `Sends you to: ${bisSourceRaids.map((raid) => link(raid)).join(', ')}`
          : '',
        '',
        '## Where this lives in the code',
        '',
        bullets(moduleLinks(['domain/bis/bisLists.ts', 'domain/abilities/sampleSignatureAbilities.ts'], modules)),
        '',
        '## Related',
        '',
        bullets([link('Best in Slot'), link('Signature Abilities'), link('Stat Weights'), link('Needs Verification')]),
        '',
        `Up: ${link('TBC Knowledge Map')}`,
      ].join('\n')
      await writeNote(path.join('Domain', 'Specs', `${safeTitle(title)}.md`), body)
    }
  }

  // --- Raids and bosses ------------------------------------------------------------------------
  for (const raid of sampleRaids) {
    const bosses = sampleRaidBosses
      .filter((boss) => boss.raidId === raid.id)
      .sort((a, b) => (a.encounterOrder ?? 99) - (b.encounterOrder ?? 99))
    const chain = sampleAttunements.find((candidate) => candidate.raidId === raid.id)

    const body = [
      frontmatter({
        type: 'raid',
        tier: raid.tier,
        phase: raid.phase,
        players: raid.playerSize,
        // The item catalog and BiS lists spell some instances more than one way ('Tempest Keep' vs.
        // 'The Eye'), so every spelling becomes an alias and [[Tempest Keep]] resolves either way.
        aliases: raid.instanceNames.filter((name) => safeTitle(name) !== safeTitle(raid.name)),
        generated: true,
        tags: ['brain/domain', 'domain/raid', `tier/${raid.tier}`],
      }),
      '',
      `# ${raid.name}`,
      '',
      `${raid.playerSize}-player · ${raid.tier} · ${link('Content Phases', `Phase ${raid.phase}`)} · ${raid.resetDays}-day lockout`,
      '',
      raid.description,
      '',
      '## Getting there',
      '',
      `**Zone:** ${raid.zone}`,
      '',
      raid.location,
      '',
      '## Attunement',
      '',
      raid.attunement,
      '',
      chain ? `Full chain: ${link(chain.name)} (${chain.steps.length} steps) · ${link('Attunement')}` : link('Attunement'),
      '',
      `## Bosses (${bosses.length})`,
      '',
      bullets(
        bosses.map(
          (boss) =>
            `${link(boss.name)}${boss.optional ? ' _(optional)_' : boss.encounterOrder ? ` — encounter ${boss.encounterOrder}` : ''} · ${boss.loot.length} notable drops`,
        ),
      ),
      '',
      raid.notableTrashLoot?.length
        ? `## Notable trash drops\n\n${bullets(raid.notableTrashLoot.map((entry) => `**${entry.name}**${entry.roles ? ` — ${entry.roles.map((role) => link(role)).join(', ')}` : ''}${entry.notes ? ` · ${entry.notes}` : ''}`))}`
        : '',
      '',
      '## Where this lives in the code',
      '',
      bullets(moduleLinks(['domain/raids/sampleRaids.ts', 'domain/raids/sampleRaidBosses.ts', 'features/raids/RaidsPanel.tsx'], modules)),
      '',
      `Up: ${link('TBC Knowledge Map')}`,
    ].join('\n')
    await writeNote(path.join('Domain', 'Raids', `${safeTitle(raid.name)}.md`), body)

    for (const boss of bosses) {
      const bossBody = [
        frontmatter({
          type: 'boss',
          raid: raid.name,
          order: boss.encounterOrder,
          optional: boss.optional ? true : undefined,
          generated: true,
          tags: ['brain/domain', 'domain/boss'],
        }),
        '',
        `# ${boss.name}`,
        '',
        `${link(raid.name)} · ${boss.optional ? 'optional / off the critical path' : boss.encounterOrder ? `encounter ${boss.encounterOrder}` : 'order varies'}`,
        '',
        '## Mechanics',
        '',
        boss.mechanics,
        '',
        boss.roleNotes?.length
          ? `## Per-role\n\n${bullets(boss.roleNotes.map((note) => `${link(note.role)} — ${note.note}`))}`
          : '',
        '',
        `## Notable drops (${boss.loot.length})`,
        '',
        bullets(
          boss.loot.map((entry) => {
            const roles = entry.roles?.length ? ` — ${entry.roles.map((role) => (role === 'Hybrid' ? 'Hybrid' : link(role))).join(', ')}` : ''
            const flag = entry.itemId ? '' : ` _(not in item catalog — ${link('Needs Verification')})_`
            return `**${entry.name}** (${entry.dropType})${roles}${flag}${entry.notes ? `\n  ${entry.notes}` : ''}`
          }),
        ),
        '',
        boss.notes ? `> ${boss.notes}` : '',
        '',
        `Up: ${link(raid.name)}`,
      ].join('\n')
      await writeNote(path.join('Domain', 'Bosses', `${safeTitle(boss.name)}.md`), bossBody)
    }
  }

  // --- Attunement chains -----------------------------------------------------------------------
  for (const chain of sampleAttunements) {
    const raid = sampleRaids.find((candidate) => candidate.id === chain.raidId)
    const body = [
      frontmatter({ type: 'attunement', raid: raid?.name, generated: true, tags: ['brain/domain', 'domain/attunement'] }),
      '',
      `# ${chain.name}`,
      '',
      raid ? `Unlocks ${link(raid.name)} · ${chain.steps.length} steps` : `${chain.steps.length} steps`,
      '',
      chain.summary,
      '',
      '## Before you start',
      '',
      bullets(chain.prerequisites),
      '',
      '## Steps',
      '',
      chain.steps
        .slice()
        .sort((a, b) => a.order - b.order)
        .map(
          (step) =>
            `${step.order}. **${step.title}** — ${step.location}${step.difficulty ? ` (${step.difficulty})` : ''}\n   ${step.questName ? `_Quest: ${step.questName}_\n   ` : ''}${step.requirement}`,
        )
        .join('\n'),
      '',
      '## Reward',
      '',
      chain.reward,
      '',
      `Related: ${link('Attunement')}`,
      '',
      `Up: ${link('TBC Knowledge Map')}`,
    ].join('\n')
    await writeNote(path.join('Domain', 'Attunements', `${safeTitle(chain.name)}.md`), body)
  }

  // --- Professions -----------------------------------------------------------------------------
  for (const profession of allProfessions) {
    const profile = (sampleProfessions ?? []).find((candidate) => candidate.profession === profession)
    const body = [
      frontmatter({
        type: 'profession',
        category: profile?.category,
        generated: true,
        tags: ['brain/domain', 'domain/profession'],
      }),
      '',
      `# ${profession}`,
      '',
      profile?.category ? `**${profile.category}** profession` : '',
      '',
      profile?.notes ? `> ${profile.notes}` : '',
      '',
      profile?.tiers?.length
        ? `## Skill tiers\n\n${bullets(profile.tiers.map((tier) => `**${tier.tier}** — skill ${tier.skillRange[0]}–${tier.skillRange[1]}, level ${tier.requiredCharacterLevel}+ · ${tier.trainedFrom}`))}`
        : '',
      '',
      profile?.materialFarming?.length
        ? `## Material farming\n\n${bullets(profile.materialFarming.slice(0, 12).map((spot) => `**${spot.material}** (skill ${spot.skillRange[0]}–${spot.skillRange[1]}) — ${spot.zones.join(', ')}`))}`
        : '',
      '',
      profile?.levelingPath?.length
        ? `## Leveling path\n\n${bullets(profile.levelingPath.map((step) => `skill ${step.skillRange[0]}–${step.skillRange[1]}: **${step.recipeOrItem}** — ${step.recipeSource}${step.keyMaterials?.length ? ` · ${step.keyMaterials.join(', ')}` : ''}`))}`
        : '',
      '',
      '## Where this lives in the code',
      '',
      bullets(moduleLinks(['domain/professions/sampleProfessions.ts', 'features/professions/ProfessionsPanel.tsx'], modules)),
      '',
      `Up: ${link('TBC Knowledge Map')}`,
    ].join('\n')
    await writeNote(path.join('Domain', 'Professions', `${safeTitle(profession)}.md`), body)
  }

  // --- Concepts --------------------------------------------------------------------------------
  for (const concept of CONCEPTS) {
    const body = [
      frontmatter({ type: 'concept', generated: true, tags: ['brain/domain', 'domain/concept'] }),
      '',
      `# ${concept.title}`,
      '',
      `_${concept.summary}_`,
      '',
      concept.body,
      '',
      '## Where this lives in the code',
      '',
      bullets(moduleLinks(concept.modules, modules)),
      '',
      '## Related',
      '',
      bullets(concept.related.map((title) => link(title))),
      '',
      `Up: ${link('TBC Knowledge Map')}`,
    ].join('\n')
    await writeNote(path.join('Domain', 'Concepts', `${safeTitle(concept.title)}.md`), body)
  }

  // --- Knowledge map ---------------------------------------------------------------------------
  const counts = {
    classes: tbcClasses.length,
    specs: tbcClasses.reduce((total, entry) => total + entry.specs.length, 0),
    raids: sampleRaids.length,
    bosses: sampleRaidBosses.length,
    professions: allProfessions.length,
    items: sampleItems.length,
    // Computed, not written down. A hardcoded count here went stale the moment the next sourcing
    // batch landed, while the README promised the vault "cannot drift from the code" — which was
    // only true of the parts that were actually derived from it.
    itemsFlagged: sampleItems.filter((item) => item.needsVerification).length,
    bisEntries: bisLists.reduce((total, list) => total + list.entries.length, 0),
    bisEntriesRankedDeeperThanOne: bisLists.reduce(
      (total, list) => total + list.entries.filter((entry) => entry.rank > 1).length,
      0,
    ),
    gems: sampleGems.length,
    enchants: sampleEnchants.length,
    buffs: sampleBuffs.length,
    debuffs: sampleTargetDebuffs.length,
    consumables: sampleConsumables.length,
    abilities: sampleSignatureAbilities.length,
    slots: gearSlots.length,
  }

  const body = [
    frontmatter({ type: 'moc', generated: true, tags: ['brain/domain', 'moc'] }),
    '',
    '# TBC Knowledge Map',
    '',
    'Everything the app knows about The Burning Crusade, as notes. Generated from the real data files, so if a count here looks wrong the data is wrong, not the note.',
    '',
    '## Catalog',
    '',
    Object.entries(counts)
      .map(([key, value]) => `- **${value}** ${key}`)
      .join('\n'),
    '',
    '## Roles',
    '',
    bullets([...roleSpecs.keys()].sort().map((role) => `${link(role)} — ${roleSpecs.get(role).length} specs`)),
    '',
    '## Classes',
    '',
    bullets(tbcClasses.map((entry) => `${link(entry.className)} — ${entry.specs.length} specs`)),
    '',
    '## Raids',
    '',
    bullets(
      sampleRaids.map(
        (raid) =>
          `${link(raid.name)} — ${raid.playerSize}-player ${raid.tier}, ${sampleRaidBosses.filter((boss) => boss.raidId === raid.id).length} bosses`,
      ),
    ),
    '',
    '## Professions',
    '',
    bullets(allProfessions.map((profession) => link(profession))),
    '',
    '## Concepts',
    '',
    bullets(CONCEPTS.map((concept) => `${link(concept.title)} — ${concept.summary}`)),
    '',
    `Up: ${link('Project Defeat Brain')}`,
  ].join('\n')

  await writeNote(path.join('Domain', 'TBC Knowledge Map.md'), body)

  return counts
}

async function writeProjectNotes(modules, counts) {
  for (const phase of PHASES) {
    const body = [
      frontmatter({
        type: 'phase',
        number: phase.number,
        status: phase.status,
        generated: true,
        tags: ['brain/project', 'project/phase', `status/${phase.status.replace(/\s+/g, '-')}`],
      }),
      '',
      `# ${phase.title}`,
      '',
      `**Status: ${phase.status}**`,
      '',
      phase.summary,
      '',
      '## Done',
      '',
      bullets(phase.done),
      '',
      '## Remaining',
      '',
      bullets(phase.remaining),
      '',
      '## Key modules',
      '',
      bullets(moduleLinks(phase.modules, modules)),
      '',
      '## Neighbours',
      '',
      bullets(
        [
          phase.number > 1 ? link(PHASES[phase.number - 2].title, 'Previous phase') : undefined,
          phase.number < PHASES.length ? link(PHASES[phase.number].title, 'Next phase') : undefined,
        ].filter(Boolean),
      ),
      '',
      `Up: ${link('Roadmap Board')}`,
    ].join('\n')
    await writeNote(path.join('Project', 'Phases', `${safeTitle(phase.title)}.md`), body)
  }

  const statusIcon = { complete: '✅', 'mostly complete': '🟢', partial: '🟡', 'not started': '⬜' }

  await writeNote(
    path.join('Project', 'Roadmap Board.md'),
    [
      frontmatter({ type: 'moc', generated: true, tags: ['brain/project', 'moc'] }),
      '',
      '# Roadmap Board',
      '',
      'The long-term goal: a local-first TBC Classic Anniversary simulator/planner covering every class and spec, gear, enchants, gems, talents, buffs, debuffs, consumables, rotations, encounter settings, saved builds, import/export, and gear comparison.',
      '',
      '| Phase | Status | Remaining items |',
      '| --- | --- | --- |',
      ...PHASES.map(
        (phase) =>
          `| ${link(phase.title)} | ${statusIcon[phase.status] ?? ''} ${phase.status} | ${phase.remaining.length} |`,
      ),
      '',
      '## Next honest step',
      '',
      'Build save/load is now wired, so the largest remaining gap is an accuracy one rather than a reachability one:',
      '',
      `1. **Multi-ability rotations** — started, and **only Fury and Arms Warrior have more than one ability**. Both now press Whirlwind on its 10s cooldown alongside their signature button, resolved against a shared global-cooldown budget. Every other spec still models exactly one ability, and all specs still lose any special whose sustained rate is not computable (rage-costed abilities with no cooldown, and Steady Shot), so they remain understated by differing amounts. The engine handles arbitrary ability lists; what gates the rest is sourced ability data. Still the biggest accuracy gap in ${link('Phase 4 - Simulation')}.`,
      `2. **Tank score severity weighting** — the tank path now resolves one ordered incoming table including crushing blows (see ${link('Tank Avoidance')}), but the headline Survivability Score still weights avoidance, armor and stamina without pricing how much worse a crit or a crush is than a plain hit. The breakdown carries a damage-per-swing figure that does account for it; folding that into the score is a metric redesign and deliberately hasn't been done unilaterally.`,
      `3. **Item catalog verification** — ${counts.itemsFlagged} of ${counts.items} items in ${link('domain.gear.sampleItems')} still carry \`needsVerification\`, so ${counts.items - counts.itemsFlagged} are now sourced against real tooltips. Every audited batch so far has found real errors — invented stats, fabricated sockets, placeholder item levels — so an unflagged item is meaningfully different from a flagged one, and a sourced-versus-estimated comparison is skewed in the sourced item's favour until the rest catch up.`,
      `4. **BiS lists are one item deep** — ${counts.bisEntries} ranked entries exist across all 27 specs, but only ${counts.bisEntriesRankedDeeperThanOne} of them sit at rank 2 or lower. Every other slot offers a single option while the UI labels it "1 ranked", which presents one guess as a considered ranking. This is a larger gap than the verification backlog and it is the core promise of the planner.`,
      '',
      '## Related',
      '',
      bullets([link('Decision Log'), link('Data Provenance'), link('Known Limitations'), link('Architecture Map')]),
      '',
      `Up: ${link('Project Defeat Brain')}`,
    ].join('\n'),
  )

  await writeNote(
    path.join('Project', 'Data Provenance.md'),
    [
      frontmatter({ type: 'reference', generated: true, tags: ['brain/project'] }),
      '',
      '# Data Provenance',
      '',
      'Wowhead and WoWSims are the primary research sources for item data, BiS rankings, and simulation formulas.',
      '',
      "The practical problem: Wowhead's guide pages are JavaScript-rendered, so item stat blocks could not simply be read off the page. They were cross-checked against static summaries and prior knowledge instead, which is good enough to build against and not good enough to present as fact.",
      '',
      `That gap is what ${link('Needs Verification')} exists for. Every approximated value carries the flag until someone checks it against a real item tooltip, and the UI shows the flag rather than hiding it.`,
      '',
      '## What is sourced vs. approximated',
      '',
      '- **Sourced:** TBC combat mechanics — attack table, spell table, rating conversions, coefficient formulas, armor mitigation. These come from well-documented, stable formulas.',
      '- **Sourced:** signature ability cast times, ranks, base amounts, and coefficients, including the hardcoded exceptions.',
      '- **Approximated:** most item stat blocks, weapon damage dice on non-canonical items, BiS placements, the tank avoidance baseline.',
      '- **Known wrong:** `training-sword`\'s `wowItemId` (28034) resolves to an unrelated real item.',
      '',
      '## Related',
      '',
      bullets([link('Needs Verification'), link('Known Limitations'), link('Best in Slot')]),
      '',
      `Up: ${link('Project Defeat Brain')}`,
    ].join('\n'),
  )

  await writeNote(
    path.join('Project', 'Known Limitations.md'),
    [
      frontmatter({ type: 'reference', generated: true, tags: ['brain/project'] }),
      '',
      '# Known Limitations',
      '',
      'Kept deliberately blunt. A planner that overstates its accuracy is worse than one that admits where it guesses.',
      '',
      '## Simulation',
      '',
      `- The physical path models white damage plus one signature melee special, and only where its rate is defensible (a cooldown, or an energy cost against energy's fixed 10/sec regen). Rage-costed abilities with no cooldown and Hunter's Steady Shot are excluded and named in the result summary. No multi-ability priority, so melee specs remain understated.`,
      `- The caster and healer paths model one real ability per spec (${link('Signature Abilities')}) — no cooldowns, procs, downranking, or multi-spell priority.`,
      '- No multi-iteration variance and no result charts, so every number is a point estimate with no error bar.',
      '- Tank avoidance reuses the player-attacks-target skill formulas symmetrically, which is an approximation flagged in the code.',
      '',
      '## Data',
      '',
      `- The item catalog is largely representative sample gear, not an audited TBC database. See ${link('Data Provenance')}.`,
      `- ${link('Needs Verification')} is set on a large fraction of item stats and BiS placements.`,
      `- Guide data under ${link('data.phase2Enhancements')} and ${link('data.phase2SpecGuides')} predates the domain model and is still disconnected from it.`,
      '',
      '## Scope',
      '',
      '- No talent trees, so no talent scaling anywhere in the sim.',
      '- Feral Druid is treated as physical DPS; bear/cat mode is not split.',
      '- No backend by design. The app stays local-first; shareable links or account sync would be the only reasons to add one.',
      '',
      '## Related',
      '',
      bullets([link('Data Provenance'), link('Roadmap Board'), link('Stat Weights')]),
      '',
      `Up: ${link('Project Defeat Brain')}`,
    ].join('\n'),
  )

  // The decision log is generated once and then owned by hand — every entry below the marker
  // survives regeneration, so this note is a real running log rather than a rewritten stub.
  await writeNote(
    path.join('Project', 'Decision Log.md'),
    [
      frontmatter({ type: 'log', generated: true, tags: ['brain/project'] }),
      '',
      '# Decision Log',
      '',
      'Architectural decisions worth not re-litigating. Add new entries below the manual marker; the generated section above only carries the ones baked into the code today.',
      '',
      '## Local-first, no backend',
      '',
      'Everything runs in the browser against typed data in the repo. This is what makes the project cheap to iterate on and what shapes Phase 6: the addon import parses a pasted blob client-side rather than uploading it anywhere.',
      '',
      '## `domain/` never imports `features/`',
      '',
      `Typed TBC knowledge lives in \`domain/\` and stays free of UI concerns; \`features/\` composes it into panels. See ${link('Architecture Map')} for the full layer breakdown.`,
      '',
      '## Approximated data is flagged, not hidden',
      '',
      `${link('Needs Verification')} is a first-class field on items, raid loot, abilities, and profession tiers, and the UI surfaces it. The alternative — quietly shipping guesses — makes the whole planner untrustworthy.`,
      '',
      '## Per-class BiS files rather than one big table',
      '',
      'BiS data is split one file per class/spec/phase. It keeps diffs reviewable while 27 specs get filled in independently, at the cost of a barrel file that has to stay in sync.',
      '',
      '## Signature ability, not a rotation engine',
      '',
      'One researched ability per spec replaces the generic filler-cast placeholder. This is explicitly an intermediate step: it buys real per-spec cast times and coefficients now, without pretending to be a rotation model.',
      '',
      '## Three ways to answer a systematic gap: derive, surface, or decline',
      '',
      'Three whole-catalog gaps were closed in one pass, and each needed a different answer. That pattern is more reusable than the individual fixes.',
      '',
      '**Derive it** — armor was recorded on 5 of ~143 armour pieces, so tank mitigation read far too low. TBC armor turns out to be deterministic given item level, armour class, slot and quality, so one formula fixed dozens of items at once. Deriving is legitimate when the underlying value genuinely is a function of things already known; it is invented precision when it is not, and the difference has to be established before building, not assumed.',
      '',
      '**Surface it** — of sixteen Tier 5 set bonuses researched, not one is a flat stat addition. They attach to named abilities, to resource costs, or to the party. Recording them as stats would have invented value, so they are listed with their effects and marked as not scored. The honest fix for an invisible bias is to make it visible.',
      '',
      '**Decline it** — the Feral cat rotation is a dynamic conditional priority system tracking energy, time to next energy tick, combo points and fight duration. This engine is closed-form and never advances a clock, so that cannot be approximated inside it. The blocker is architectural, and pretending otherwise would have produced a confidently wrong number.',
      '',
      '## Effective Health, not a weighted survivability score',
      '',
      `The tank metric was \`avoidance*2 + armor*1.5 + stamina*0.1\`, where all three weights were invented. It is now Effective Health — health divided by the fraction of a swing that lands — which has no free parameters and is what TBC tanks were actually compared on. Raw damage-taken-per-second was rejected for a structural reason as much as a theorycrafting one: \`score\` is consumed by the stat-weight engine and the upgrade finder, both of which assume higher is better, so a lower-is-better headline would have silently broken both for one role. See ${link('Tank Avoidance')}.`,
      '',
      '## Item effects are averaged by uptime, or declined outright',
      '',
      'Not one of the fourteen catalogued trinkets is a pure stat stick, and two have no stats at all — so a flat-stats model priced that entire item class at nearly zero. Procs and on-use effects now contribute at `duration / cooldown`. Where the value is not a stat bonus at all — a damage proc, a heal, a buff on the healing target rather than the wearer — the entry records why it is unmodelled instead of approximating it into a stat.',
      '',
      '## The catalog was generated by inference, so treat it as wrong until checked',
      '',
      'Six sourcing batches audited 48 items against real tooltips and **every single one was wrong**. Not randomly: stats invented that the item does not carry, sockets fabricated in both directions, item level left at a flat placeholder across a whole slot, and two healer pieces landing on the identical wrong healing number. The data was produced by inferring what an item *should* look like for its role, which is exactly why it is uniformly plausible. Plausibility is therefore not evidence here, and an unaudited entry should be treated as wrong rather than probably fine.',
      '',
      '## Counts are computed, never written down',
      '',
      'A hardcoded "214 needsVerification flags remain" survived six sourcing batches inside this generator, while the README promised the vault could not drift from the code. It could — the guarantee only ever covered what was actually derived. Coverage figures are now computed from the data, and prose should point at them rather than restate them.',
      '',
      '## Related',
      '',
      bullets([link('Architecture Map'), link('Roadmap Board'), link('Data Provenance')]),
      '',
      `Up: ${link('Project Defeat Brain')}`,
    ].join('\n'),
  )

  await writeNote(
    path.join('Project', 'Vault Guide.md'),
    [
      frontmatter({ type: 'reference', generated: true, tags: ['brain/project'] }),
      '',
      '# Vault Guide',
      '',
      'How this vault works, so future-you does not have to reverse-engineer it.',
      '',
      '## Regenerating',
      '',
      '```bash\nnpm run brain\n```',
      '',
      'The generator reads the real source tree and the real domain data — module edges come from actual import statements, and class/spec/raid/boss/profession notes come from the data files themselves. Nothing about the project is duplicated by hand, so the vault cannot drift from the code without the code changing.',
      '',
      '## Hand-written notes survive',
      '',
      `Every note ends with a \`${MANUAL_MARKER}\` marker. Anything you write below it is preserved verbatim on regeneration. Anything above it will be overwritten.`,
      '',
      '## Reading the graph',
      '',
      '- **Architecture/Modules** — the dependency graph. Hubs are visible as high-degree nodes; a `domain → features` edge here is a layering regression.',
      '- **Domain** — the TBC knowledge wiki. Class → spec → role → raid → boss chains, plus concept notes for the mechanics.',
      '- **Project** — roadmap phases, decisions, provenance, limitations.',
      '',
      'Graph colour groups are configured in `.obsidian/graph.json` so each layer reads at a glance.',
      '',
      '## Note naming',
      '',
      'Module notes use dotted module paths (`domain.raids.raidTypes`) because basenames collide across folders — there are several `index.ts` and two `characterTypes.ts`. Spec notes are `<Spec> <Class>` because spec names are not unique either: Holy, Protection, and Restoration are each shared by two classes.',
      '',
      `Up: ${link('Project Defeat Brain')}`,
    ].join('\n'),
  )

  return counts
}

async function writeHome(modules, counts) {
  const body = [
    frontmatter({ type: 'moc', generated: true, tags: ['brain/home', 'moc'] }),
    '',
    '# Project Defeat Brain',
    '',
    'A local-first TBC Classic Anniversary simulator and gear planner, mapped as a graph. Start here.',
    '',
    '## The three maps',
    '',
    `- ${link('Architecture Map')} — ${modules.size} modules with their real import edges. The dependency graph, browsable.`,
    `- ${link('TBC Knowledge Map')} — ${counts.classes} classes, ${counts.specs} specs, ${counts.raids} raids, ${counts.bosses} bosses, ${counts.professions} professions, and the mechanics behind them.`,
    `- ${link('Roadmap Board')} — six phases, what is done, and what is honestly still missing.`,
    '',
    '## Orientation',
    '',
    `- ${link('Vault Guide')} — how to regenerate this vault and how hand-written notes survive.`,
    `- ${link('Decision Log')} — the calls already made, so they do not get re-argued.`,
    `- ${link('Data Provenance')} — what is sourced, what is approximated, and why.`,
    `- ${link('Known Limitations')} — where the numbers are wrong and by roughly how much.`,
    '',
    '## Repo entry points',
    '',
    `- [[README]] and [[ROADMAP]] at the repo root are part of this vault too, so they show up in the graph.`,
    `- ${link('App')} is the root composition: three tabs (Character Planner, Raids, Professions) over shared planner state.`,
    '',
    '## Start reading here',
    '',
    `If you are picking this project back up cold: ${link('Roadmap Board')} for where things stand, then ${link('Architecture Map')} for the layer rules, then whichever ${link('TBC Knowledge Map')} branch the next feature touches.`,
    '',
    `---\n\n_Generated from the source tree and the domain data. Regenerate with \`npm run brain\`._`,
  ].join('\n')

  await writeNote('Project Defeat Brain.md', body)
}

/**
 * The Obsidian vault root is the repo root, not `brain/` — that is what lets notes link out to
 * README.md and ROADMAP.md. The cost is that Obsidian would otherwise index the entire working tree:
 * `node_modules` alone carries over a hundred package READMEs, which drown real notes in search and
 * add a cloud of orphan nodes to the graph.
 *
 * These are the folders that are never notes. Source files are left visible on purpose — being able
 * to jump from a module note to the file it documents is most of the point of rooting the vault here.
 */
const VAULT_IGNORE_FILTERS = ['node_modules/', 'dist/', 'test-results/', 'playwright-report/', '.claude/', 'coverage/']

/**
 * Owns only `userIgnoreFilters`, so a vault opened on a fresh machine is usable immediately rather
 * than requiring someone to rediscover the exclusion list in settings. Anything else the user sets
 * in app.json is preserved.
 */
async function updateAppConfig() {
  const configPath = path.join(REPO_ROOT, '.obsidian', 'app.json')
  if (!existsSync(configPath)) return

  const config = JSON.parse(await readFile(configPath, 'utf8'))
  const existing = Array.isArray(config.userIgnoreFilters) ? config.userIgnoreFilters : []
  // Preserve anything the user added themselves; only guarantee ours are present.
  const merged = [...new Set([...VAULT_IGNORE_FILTERS, ...existing])]

  const unchanged = existing.length === merged.length && existing.every((entry, index) => entry === merged[index])
  if (unchanged) return

  config.userIgnoreFilters = merged
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8')
}

/**
 * Obsidian's graph is unreadable without colour groups at this note count, so the generator owns
 * that part of the config. Everything else in graph.json is left as the user set it.
 */
async function updateGraphConfig() {
  const configPath = path.join(REPO_ROOT, '.obsidian', 'graph.json')
  if (!existsSync(configPath)) return

  const config = JSON.parse(await readFile(configPath, 'utf8'))
  config.colorGroups = [
    { query: 'path:"brain/Architecture/Modules" layer/domain', color: { a: 1, rgb: 6534764 } },
    { query: 'path:"brain/Architecture/Modules" layer/features', color: { a: 1, rgb: 15637086 } },
    { query: 'path:"brain/Architecture/Modules" layer/components', color: { a: 1, rgb: 6799576 } },
    { query: 'path:"brain/Domain/Specs"', color: { a: 1, rgb: 16755370 } },
    { query: 'path:"brain/Domain/Raids" OR path:"brain/Domain/Bosses"', color: { a: 1, rgb: 15029510 } },
    { query: 'path:"brain/Domain/Concepts"', color: { a: 1, rgb: 6803964 } },
    { query: 'path:"brain/Project"', color: { a: 1, rgb: 16766720 } },
    { query: 'tag:#moc', color: { a: 1, rgb: 16777215 } },
  ]
  config.collapse_color_groups = false
  // The default 250 link distance packs 300 notes into a hairball; loosen it.
  config.linkDistance = 120
  config.repelStrength = 14
  config.showTags = false

  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8')
}

/** Fails loudly on a wikilink that points at a note that does not exist. Aliases count as targets. */
async function checkLinks() {
  const files = (await walk(VAULT_ROOT)).filter((file) => file.endsWith('.md'))
  const titles = new Set(files.map((file) => path.basename(file, '.md')))
  // README.md and ROADMAP.md live at the repo root but are inside the Obsidian vault.
  for (const rootNote of ['README', 'ROADMAP']) {
    if (existsSync(path.join(REPO_ROOT, `${rootNote}.md`))) titles.add(rootNote)
  }

  for (const file of files) {
    const aliasLine = (await readFile(file, 'utf8')).match(/^aliases: \[([^\]]*)\]$/m)
    if (!aliasLine) continue
    for (const alias of aliasLine[1].split(',')) {
      const trimmed = alias.trim()
      if (trimmed) titles.add(trimmed)
    }
  }

  const broken = []
  for (const file of files) {
    const content = await readFile(file, 'utf8')
    for (const match of content.matchAll(/\[\[([^\]|#]+)(?:\|[^\]]*)?\]\]/g)) {
      const target = match[1].trim()
      if (!titles.has(target)) {
        broken.push(`${path.relative(VAULT_ROOT, file)} -> [[${target}]]`)
      }
    }
  }
  return { total: titles.size, broken: sortUnique(broken) }
}

// ---------------------------------------------------------------------------------------------

async function main() {
  const modules = await scanModules()
  const data = await loadDomainData()

  await writeModuleNotes(modules)
  await writeArchitectureMap(modules)
  const counts = await writeDomainNotes(data, modules)
  await writeProjectNotes(modules, counts)
  await writeHome(modules, counts)
  await updateGraphConfig()
  await updateAppConfig()

  const { broken } = await checkLinks()

  console.log(
    `brain: ${stats.written + stats.unchanged} notes (${stats.written} written, ${stats.unchanged} unchanged, ${stats.preserved} with preserved manual sections)`,
  )
  console.log(`brain: ${modules.size} modules mapped`)

  if (broken.length > 0) {
    console.error(`brain: ${broken.length} broken wikilink(s):`)
    for (const entry of broken) console.error(`  ${entry}`)
    process.exitCode = 1
    return
  }
  console.log('brain: all wikilinks resolve')
}

await main()
