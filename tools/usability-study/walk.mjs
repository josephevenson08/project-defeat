#!/usr/bin/env node
/**
 * Sends one command to a participant's browser session (`walk-server.mjs`) and prints the result.
 *
 *   node tools/usability-study/walk.mjs <port> <action> [--key value ...]
 *
 *   node tools/usability-study/walk.mjs 9301 look --think "First time here. What is this?"
 *   node tools/usability-study/walk.mjs 9301 click --text "Raid Composition" --think "Curious"
 *   node tools/usability-study/walk.mjs 9301 click --role button --name "Start over"
 *   node tools/usability-study/walk.mjs 9301 press --key Tab
 *
 * Flags rather than a JSON argument, because the think-aloud notes are free text full of apostrophes,
 * and quoting JSON inside a shell command is where an agent's afternoon goes.
 */
const [port, action, ...rest] = process.argv.slice(2)
if (!port || !action) {
  console.error('usage: walk.mjs <port> <action> [--key value ...]')
  process.exit(2)
}

const body = { do: action }
for (let i = 0; i < rest.length; i++) {
  if (!rest[i].startsWith('--')) continue
  const key = rest[i].slice(2)
  const value = rest[i + 1]
  if (value === undefined || value.startsWith('--')) {
    body[key] = true
    continue
  }
  body[key] = /^-?\d+(\.\d+)?$/.test(value) && !['text', 'name', 'label', 'value', 'option', 'think'].includes(key) ? Number(value) : value
  i += 1
}

try {
  const response = await fetch(`http://127.0.0.1:${port}/act`, { method: 'POST', body: JSON.stringify(body) })
  console.log(await response.text())
} catch (error) {
  console.error(`No session answering on port ${port} (${error.cause?.code ?? error.message}). The session may have ended.`)
  process.exit(1)
}
