// Links raid loot entries to the item catalogue by exact name, and clears the notes that say they
// are not in it.
//
// Why these were unlinked: the raid data was written when the catalogue held 230 hand-written items.
// It now holds 4,560 ingested ones, so notes reading "Real Attumen drop, not yet in the item catalog"
// became false without anything changing them. 85 of the 124 unlinked entries name an item that is
// now present. The visible symptom was the raid loot table drawing a "??" frame instead of an icon.
//
// This invents nothing. It links only where the entry's own `name` matches **exactly one** catalogue
// item, case-insensitively, and it never touches an entry that already carries an `itemId`. Names
// that match two items are left alone and reported, because picking between them would be a guess.
//
// `needsVerification` and the note are cleared only when the note is *only* the stale claim. An entry
// whose note carries something else real ("Mount, very low drop rate") keeps it.
//
// Idempotent: a second run reports 0 linked.
//
// Run: node tools/ingest/link-raid-loot.mjs [--dry]
// Rewrites: src/domain/raids/*Bosses.ts, src/domain/raids/sampleRaids.ts

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { registerHooks } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const dry = process.argv.includes('--dry')

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

const { allItems } = await import(pathToFileURL(resolve(REPO, 'src/domain/gear/itemCatalogue.ts')).href)

/** Name -> ids. Ambiguous names keep every id so they can be reported rather than picked between. */
const idsByName = new Map()
for (const item of allItems) {
  const key = item.name.toLowerCase()
  if (!idsByName.has(key)) idsByName.set(key, [])
  idsByName.get(key).push(item.id)
}

const FILES = [
  'src/domain/raids/karazhanBosses.ts',
  'src/domain/raids/gruulsLairBosses.ts',
  'src/domain/raids/magtheridonsLairBosses.ts',
  'src/domain/raids/serpentshrineCavernBosses.ts',
  'src/domain/raids/tempestKeepBosses.ts',
  'src/domain/raids/sampleRaids.ts',
]

/**
 * The sentence that became false when the catalogue grew from 230 items to 4,560.
 *
 * Trimmed as a *sentence* rather than tested against the whole note, because several notes carry
 * something else that is still true — "Wizard of Oz variant only", "Mount, very low drop rate" —
 * and throwing that away to delete one stale clause would lose real information.
 */
const STALE_SENTENCE = /\s*\b(?:Not|not) (?:yet )?in the item catalog\.?/

const linked = []
const cleaned = []
const ambiguous = []
const stillAbsent = []

for (const relative of FILES) {
  const path = resolve(REPO, relative)
  const before = readFileSync(path, 'utf8')

  // Innermost braced objects only. Loot entries contain no nested braces — `roles: [...]` is
  // brackets — so `[^{}]*` cannot swallow a boss definition by accident. `dropType` is what
  // identifies a loot entry rather than a mechanic or a role note.
  const after = before.replace(/\{[^{}]*\}/g, (block) => {
    if (!block.includes('dropType:')) return block

    let next = block

    // Linking. Skipped for anything already carrying an itemId, which is what makes re-runs a no-op.
    if (!/\bitemId:/.test(next)) {
      const name = next.match(/\bname:\s*(['"])((?:\\.|(?!\1).)*)\1/)?.[2]
      if (!name) return next
      const unescaped = name.replace(/\\'/g, "'").replace(/\\"/g, '"')

      const ids = idsByName.get(unescaped.toLowerCase())
      if (!ids) {
        stillAbsent.push(`${relative}: ${unescaped}`)
        return next
      }
      if (ids.length > 1) {
        ambiguous.push(`${relative}: "${unescaped}" matches ${ids.join(', ')}`)
        return next
      }

      linked.push(`${unescaped} -> ${ids[0]}`)
      next = next.replace(/(\bname:)/, `itemId: '${ids[0]}', $1`)
    }

    // Note cleaning, deliberately independent of the linking above so it also reaches entries linked
    // by an earlier run. Only entries that DO resolve get cleaned — on the 39 that genuinely are not
    // in the catalogue, "Not in the item catalog" is still true and has to stay.
    if (!/\bitemId:/.test(next)) return next

    const noteMatch = next.match(/\bnotes:\s*(['"])((?:\\.|(?!\1).)*)\1/)
    if (noteMatch) {
      const quote = noteMatch[1]
      const trimmed = noteMatch[2].replace(STALE_SENTENCE, '').trim()
      if (trimmed !== noteMatch[2]) {
        cleaned.push(`${relative}: ${trimmed || '(note removed entirely)'}`)
        if (trimmed === '') {
          // Nothing left to say, and the flag was only ever about the missing catalogue entry.
          next = next.replace(/,?\s*\bneedsVerification:\s*true/, '')
          next = next.replace(/,?\s*\bnotes:\s*(['"])(?:\\.|(?!\1).)*\1/, '')
        } else {
          // Something real survives, so `needsVerification` stays — a human should still read it.
          next = next.replace(noteMatch[0], `notes: ${quote}${trimmed}${quote}`)
        }
      }
    }
    return next
  })

  if (after !== before && !dry) writeFileSync(path, after)
}

console.log(`${linked.length} loot entries linked to the catalogue`)
for (const line of linked.slice(0, 10)) console.log(`  ${line}`)
if (linked.length > 10) console.log(`  ...and ${linked.length - 10} more`)
console.log(`\n${cleaned.length} notes had the stale "not in the item catalog" claim trimmed`)
for (const line of cleaned.slice(0, 6)) console.log(`  ${line}`)
if (cleaned.length > 6) console.log(`  ...and ${cleaned.length - 6} more`)
console.log(`\n${ambiguous.length} left unlinked because the name matches more than one item`)
for (const line of ambiguous) console.log(`  ${line}`)
console.log(`\n${stillAbsent.length} genuinely absent from the catalogue (mounts, recipes, tier tokens)`)
for (const line of stillAbsent.slice(0, 8)) console.log(`  ${line}`)
if (stillAbsent.length > 8) console.log(`  ...and ${stillAbsent.length - 8} more`)
if (dry) console.log('\n(dry run — nothing written)')
