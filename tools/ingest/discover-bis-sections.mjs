// Discovery pass: fetch every BiS guide and report the section vocabulary actually used.
//
// The slot names are not guessed. Wowhead writes each section as `[h3 toc="Head"]...[/h3]`, and the
// full set of `toc` values across all 24 guides is what the real ingester maps from. Run this first
// whenever the guides change, then update the slot map in ingest-bis.mjs to match.
//
// Run: node tools/ingest/discover-bis-sections.mjs

import { BIS_GUIDES } from './bis-guides.mjs'
import { fetchGuide, unescapePage } from './bis-fetch.mjs'

const sections = new Map()
const titles = []
const failures = []

for (const guide of BIS_GUIDES) {
  let page
  try {
    page = unescapePage(await fetchGuide(guide.path))
  } catch (err) {
    failures.push(`${guide.path}: ${err.message}`)
    continue
  }

  const title = page.match(/<title>([^<]*)<\/title>/)?.[1] ?? ''
  titles.push(`${guide.path.padEnd(52)} ${title.split(' - ')[0]}`)

  for (const m of page.matchAll(/\[h3 toc="([^"]+)"\]([^[]*)\[\/h3\]/g)) {
    const [, toc, heading] = m
    if (!/Best in Slot/i.test(heading)) continue
    if (!sections.has(toc)) sections.set(toc, { count: 0, example: heading.trim().slice(0, 60) })
    sections.get(toc).count += 1
  }
}

process.stdout.write('PAGE TITLES\n')
for (const t of titles) process.stdout.write(`  ${t}\n`)

process.stdout.write(`\nSECTION toc VALUES (${sections.size} distinct)\n`)
for (const [toc, info] of [...sections.entries()].sort(([, a], [, b]) => b.count - a.count)) {
  process.stdout.write(`  ${toc.padEnd(22)} ${String(info.count).padStart(3)}  e.g. ${info.example}\n`)
}

if (failures.length) {
  process.stdout.write(`\nFAILURES\n`)
  for (const f of failures) process.stdout.write(`  ${f}\n`)
}
