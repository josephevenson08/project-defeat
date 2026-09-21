#!/usr/bin/env node
/**
 * Writes one readable page per participant for the published study: who they were, the path they took,
 * their full think-aloud transcript step by step, their plan, and their report.
 *
 *   node tools/usability-study/write-appendix.mjs <study-dir> <out-dir>
 *
 * The transcript is the study's raw data, so it is published whole rather than summarised: anyone
 * reading a finding in USABILITY-STUDY.md can open the participant's page and read the moment it came
 * from, in the participant's own words, next to what the recording says they did.
 */
import fs from 'node:fs'
import path from 'node:path'

const [studyDir, outDir] = process.argv.slice(2)
if (!studyDir || !outDir) {
  console.error('usage: write-appendix.mjs <study-dir> <out-dir>')
  process.exit(2)
}
fs.mkdirSync(outDir, { recursive: true })

const analysis = JSON.parse(fs.readFileSync(path.join(studyDir, 'analysis.json'), 'utf8'))
const personas = fs.readFileSync(path.join(studyDir, 'personas.md'), 'utf8')

/** The persona's own section of personas.md, so each page stands alone. */
function personaSection(id) {
  const start = personas.search(new RegExp(`^## ${id}:`, 'm'))
  if (start < 0) return ''
  const rest = personas.slice(start)
  const next = rest.slice(3).search(/^## P\d+:/m)
  return (next < 0 ? rest : rest.slice(0, next + 3)).replace(/^## /, '### ').trim()
}

const cell = (text) => String(text ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()
const read = (file) => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim() : '')
/** Report and plan headings are demoted two levels so they nest under this page's own sections. */
const demote = (markdown) => markdown.replace(/^(#{1,4}) /gm, (_, hashes) => `${'#'.repeat(Math.min(hashes.length + 2, 6))} `)

for (const p of analysis) {
  const plan = read(path.join(studyDir, p.id, 'plan.md'))
  const report = read(path.join(studyDir, p.id, 'report.md'))
  const lines = []

  lines.push(`# ${p.id}: session record`, '')
  lines.push(`[← Back to the study](../../USABILITY-STUDY.md)`, '')
  lines.push(personaSection(p.id), '')
  lines.push('## The session in numbers', '')
  lines.push('| | |', '|---|---|')
  lines.push(`| Device | ${p.device} |`)
  lines.push(`| Steps | ${p.steps} (${p.actingSteps} that changed something) |`)
  lines.push(`| Length | ${p.minutes} minutes of recorded session |`)
  lines.push(`| First action | ${p.firstAction ? `${cell(p.firstAction.what)}, at step ${p.firstAction.step}` : 'none'} |`)
  lines.push(`| Path | ${p.route.map((r) => r.section).join(' → ')} |`)
  lines.push(`| SUS score | ${p.sus ? `${p.sus.score} / 100` : 'not answered'} |`)
  lines.push(`| Refused actions | ${p.refused.length ? p.refused.map((r) => `step ${r.step}: ${cell(r.what)}`).join('; ') : 'none'} |`)
  lines.push('')

  lines.push('## Think-aloud transcript', '')
  lines.push('Every action the participant took, with what they said as they took it. "Refused" means the')
  lines.push('harness turned the action down, usually because the target was not on screen.', '')
  lines.push('| Step | Action | On | Where | Said |', '|---|---|---|---|---|')
  for (const t of p.thinks) {
    lines.push(`| ${t.step} | ${t.do}${t.ok === false ? ' *(refused)*' : ''} | ${cell(t.target)} | ${cell(t.section ?? '')} | ${cell(t.think)} |`)
  }
  lines.push('')

  lines.push('## Their plan, written before the visit', '')
  lines.push(plan ? demote(plan) : '_No plan was written._', '')
  lines.push('## Their report, written after the visit', '')
  lines.push(report ? demote(report) : '_No report was written._', '')

  fs.writeFileSync(path.join(outDir, `${p.id}.md`), `${lines.join('\n')}\n`)
  console.log(`${p.id}: ${lines.length} lines`)
}
