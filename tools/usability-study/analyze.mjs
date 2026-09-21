#!/usr/bin/env node
/**
 * Turns the participants' recorded sessions into the measures the study reports.
 *
 *   node tools/usability-study/analyze.mjs <study-dir> [--json <out.json>]
 *
 * Everything here is read from `actions.jsonl` — what each participant actually did, as recorded by
 * `walk-server.mjs` — and never from their reports. Human usability studies learned long ago that
 * what people say they did and what they did diverge; the same turns out to be worth assuming of a
 * simulated participant, so the numbers come from the recording and the reports are read against them.
 */
import fs from 'node:fs'
import path from 'node:path'

const dir = process.argv[2]
if (!dir) {
  console.error('usage: analyze.mjs <study-dir> [--json <out.json>]')
  process.exit(2)
}
const jsonOut = process.argv.includes('--json') ? process.argv[process.argv.indexOf('--json') + 1] : undefined

const READ_ONLY = new Set(['look', 'screenshot', 'where', 'outline', 'aria', 'tabs'])

/**
 * Which part of the app a screen belongs to, from the headings on it.
 *
 * The app is a single page whose address never changes, so the headings are the only record of where a
 * participant was. Checked in order, first match wins: the planner's sub-tab headings would otherwise
 * be mistaken for sections of their own.
 */
const SECTIONS = [
  ['Character creation', /^h2: (Faction|Race|Class|Specialization)$/i],
  ['Raid Composition', /^h2: Raid Composition/i],
  ['Spec Tier Lists', /^h[12]: .*tier list/i],
  ['Professions', /^h2: (Professions|Alchemy|Blacksmithing|Enchanting|Engineering|Herbalism|Jewelcrafting|Leatherworking|Mining|Skinning|Tailoring|Cooking|First Aid|Fishing)\b/i],
  ['Raids', /^h2: (Raids|Karazhan|Gruul|Magtheridon|Serpentshrine|Tempest Keep|The Eye)/i],
  ['Simulation', /^h2: Simulation/i],
  ['Planner', /^h2: (CHARACTER|STATS|Gear|Compare|Talents|Buffs|Ranked Gear|Build)$/i],
]

function sectionOf(entry) {
  const headings = entry.headingsOnScreen ?? []
  for (const [name, pattern] of SECTIONS) if (headings.some((h) => pattern.test(h))) return name
  if (headings.includes('h1: Project Defeat') && headings.length === 1) return 'Front page'
  if (entry.url && !entry.url.includes('josephevenson08.github.io/project-defeat')) return `Off site (${new URL(entry.url).hostname})`
  return undefined
}

function scrollFraction(entry) {
  const match = /^(\d+) of (\d+)px/.exec(entry.scroll ?? '')
  if (!match) return undefined
  const [, at, max] = match.map(Number)
  return max === 0 ? 1 : at / max
}

function describeTarget(args) {
  if (!args) return ''
  if (args.text !== undefined) return `"${args.text}"`
  if (args.role) return `${args.role} "${args.name ?? ''}"`
  if (args.label) return `label "${args.label}"`
  if (args.key) return args.key
  if (args.x !== undefined) return `(${args.x},${args.y})`
  if (args.dy !== undefined) return `${args.dy > 0 ? '+' : ''}${args.dy}px`
  if (args.to) return `to ${args.to}`
  if (args.option) return `"${args.option}"`
  return ''
}

/**
 * The System Usability Scale score from a participant's report, or undefined if the table is missing.
 *
 * Scored here rather than trusted from the participant: odd items contribute (answer − 1), even items
 * (5 − answer), and the sum × 2.5 gives 0–100 (Brooke, 1996). The even items are negatively worded, so
 * a participant who averaged the raw answers would get a meaningless number.
 */
function susScore(reportPath) {
  if (!fs.existsSync(reportPath)) return undefined
  const answers = {}
  for (const line of fs.readFileSync(reportPath, 'utf8').split('\n')) {
    const match = /^\|\s*(\d{1,2})\s*\|[^|]*\|\s*([1-5])\s*\|/.exec(line)
    if (match) answers[Number(match[1])] = Number(match[2])
  }
  if (Object.keys(answers).length !== 10) return undefined
  let sum = 0
  for (let item = 1; item <= 10; item++) sum += item % 2 === 1 ? answers[item] - 1 : 5 - answers[item]
  return { score: sum * 2.5, answers: Array.from({ length: 10 }, (_, i) => answers[i + 1]) }
}

const participants = []
for (const id of fs.readdirSync(dir).filter((name) => /^P\d+$/.test(name)).sort()) {
  const file = path.join(dir, id, 'actions.jsonl')
  if (!fs.existsSync(file)) continue
  const entries = fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))
  const arrival = entries.find((e) => e.do === 'arrive')
  const steps = entries.filter((e) => e.do !== 'arrive')
  const acting = steps.filter((e) => !READ_ONLY.has(e.do) && e.do !== 'end')
  const end = steps.find((e) => e.do === 'end')

  const byType = {}
  for (const e of steps) byType[e.do] = (byType[e.do] ?? 0) + 1

  // The route through the app: each change of section, with the step that caused it.
  const route = []
  let current = sectionOf(arrival ?? {}) ?? 'Front page'
  route.push({ step: 0, section: current })
  for (const e of steps) {
    const section = sectionOf(e)
    if (section && section !== current) {
      route.push({ step: e.step, section, via: `${e.do} ${describeTarget(e.args)}`.trim() })
      current = section
    }
  }

  const deepestScroll = {}
  for (const e of steps) {
    const section = sectionOf(e) ?? current
    const fraction = scrollFraction(e)
    if (fraction !== undefined) deepestScroll[section] = Math.max(deepestScroll[section] ?? 0, fraction)
  }

  const firstAct = acting[0]
  participants.push({
    id,
    device: arrival?.args?.device,
    steps: steps.length,
    actingSteps: acting.length,
    // From the first action to the last, not from when the browser opened: the gap before the first
    // action is the participant's research step, and in one session an observer's delay launching it.
    minutes: steps.length ? Math.round(((end ?? steps[steps.length - 1]).elapsedS - steps[0].elapsedS) / 6) / 10 : 0,
    byType,
    firstAction: firstAct ? { step: firstAct.step, what: `${firstAct.do} ${describeTarget(firstAct.args)}`.trim(), afterLooks: firstAct.step - 1 } : null,
    refused: steps.filter((e) => !e.ok && e.error).map((e) => ({ step: e.step, what: `${e.do} ${describeTarget(e.args)}`.trim(), error: e.error })),
    sectionsVisited: [...new Set(route.map((r) => r.section))],
    route,
    deepestScroll: Object.fromEntries(Object.entries(deepestScroll).map(([k, v]) => [k, Math.round(v * 100)])),
    // Keyboard moves only: a mouse click correctly shows no ring under `:focus-visible`, so counting
    // clicks here reported ten "missing" rings for a participant who never touched the keyboard.
    focusRingMissing: steps
      .filter((e) => e.do === 'press' && e.focusRingVisible === false && !/page body/.test(e.focused ?? ''))
      .map((e) => ({ step: e.step, focused: e.focused })),
    newTabs: steps.filter((e) => e.newTab).map((e) => ({ step: e.step, url: e.newTab })),
    ended: end ? { step: end.step, why: end.think } : { step: null, why: '(never ended the session)' },
    sus: susScore(path.join(dir, id, 'report.md')),
    thinks: steps.map((e) => ({ step: e.step, do: e.do, target: describeTarget(e.args), think: e.think, section: sectionOf(e), ok: e.ok })),
  })
}

if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(participants, null, 1))

for (const p of participants) {
  console.log(`\n## ${p.id} (${p.device}) — ${p.steps} steps (${p.actingSteps} acting), ${p.minutes} min`)
  console.log(`types: ${Object.entries(p.byType).map(([k, v]) => `${k} ${v}`).join(', ')}`)
  console.log(`first action: ${p.firstAction ? `${p.firstAction.what} at step ${p.firstAction.step}` : 'none'}`)
  console.log(`route: ${p.route.map((r) => `${r.section}${r.step ? ` [s${r.step}]` : ''}`).join(' → ')}`)
  console.log(`deepest scroll %: ${JSON.stringify(p.deepestScroll)}`)
  if (p.refused.length) console.log(`refused (${p.refused.length}): ${p.refused.map((r) => `s${r.step} ${r.what}`).join('; ')}`)
  if (p.focusRingMissing.length) console.log(`focus ring missing (${p.focusRingMissing.length}): ${p.focusRingMissing.map((f) => `s${f.step} ${f.focused}`).join('; ')}`)
  if (p.newTabs.length) console.log(`new tabs: ${p.newTabs.map((t) => `s${t.step} ${t.url}`).join('; ')}`)
  console.log(`ended: s${p.ended.step} — ${p.ended.why}`)
  console.log(`SUS: ${p.sus ? `${p.sus.score} (answers ${p.sus.answers.join(',')})` : 'no complete questionnaire'}`)
}

const scored = participants.filter((p) => p.sus)
if (scored.length) {
  const scores = scored.map((p) => p.sus.score).sort((a, b) => a - b)
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length
  const median = scores.length % 2 ? scores[(scores.length - 1) / 2] : (scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2
  console.log(`\nSUS across ${scores.length}: mean ${mean.toFixed(1)}, median ${median}, range ${scores[0]}–${scores[scores.length - 1]}`)
}
