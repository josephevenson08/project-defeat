// Discovery pass: what do the BiS guides publish about gemming and enchanting?
//
// The ranked gear tables were straightforward. Gems and enchants are written up separately, and this
// reports the shape of those sections across all 25 guides before anything tries to parse them.
//
// Run: node tools/ingest/discover-bis-gems.mjs

import { BIS_GUIDES } from './bis-guides.mjs'
import { fetchGuide, unescapePage } from './bis-fetch.mjs'

const headings = new Map()
const samples = []

for (const guide of BIS_GUIDES) {
  const page = unescapePage(await fetchGuide(guide.path))

  for (const m of page.matchAll(/\[h([234]) toc="([^"]*)"\]([^[]*)\[\/h[234]\]/g)) {
    const [, level, toc, text] = m
    const key = `h${level} | ${toc.trim()}`
    if (!headings.has(key)) headings.set(key, { count: 0, example: text.trim().slice(0, 58) })
    headings.get(key).count += 1

    // Capture what follows a gem/enchant heading, so the parse shape is visible rather than assumed.
    if (samples.length < 2 && /gem|enchant/i.test(toc)) {
      const after = page.slice(m.index + m[0].length, m.index + m[0].length + 900)
      samples.push({ guide: guide.path, toc: toc.trim(), after })
    }
  }
}

process.stdout.write(`distinct headings across ${BIS_GUIDES.length} guides\n`)
for (const [key, info] of [...headings.entries()].sort(([, a], [, b]) => b.count - a.count)) {
  process.stdout.write(`  ${String(info.count).padStart(3)}  ${key}\n`)
}

for (const s of samples) {
  process.stdout.write(`\n--- ${s.guide} :: ${s.toc}\n${s.after.replace(/\n{2,}/g, '\n').slice(0, 700)}\n`)
}
