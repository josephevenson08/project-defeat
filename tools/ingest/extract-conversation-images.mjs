/**
 * Pull the images attached to this conversation out of its own transcript.
 *
 * Claude Code writes every turn to a .jsonl, and an attached image is stored there as base64 rather
 * than as a file on disk — which is why they cannot simply be copied. Streaming the file line by
 * line keeps a 29 MB transcript off the heap.
 */
import { createReadStream, mkdirSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { resolve } from 'node:path'

const TRANSCRIPT = process.argv[2]
const OUT = process.argv[3]
mkdirSync(OUT, { recursive: true })

const found = []

const rl = createInterface({ input: createReadStream(TRANSCRIPT, { encoding: 'utf8' }), crlfDelay: Infinity })
let lineNo = 0

for await (const line of rl) {
  lineNo += 1
  if (!line.includes('base64')) continue

  let entry
  try {
    entry = JSON.parse(line)
  } catch {
    continue
  }

  // Walk the record for any {type:'image', source:{data}} node, wherever it is nested.
  const stack = [entry]
  while (stack.length) {
    const node = stack.pop()
    if (!node || typeof node !== 'object') continue

    if (node.type === 'image' && node.source?.data) {
      found.push({
        line: lineNo,
        media: node.source.media_type ?? 'image/png',
        bytes: node.source.data.length,
        data: node.source.data,
      })
      continue
    }

    for (const value of Object.values(node)) {
      if (value && typeof value === 'object') stack.push(value)
    }
  }
}

console.log(`images found: ${found.length}`)
for (const [index, image] of found.entries()) {
  console.log(`  [${index}] line ${image.line}  ${image.media}  ${(image.bytes / 1024).toFixed(0)} KB (base64)`)
}

// Write them all out numbered; picking which is which is a human decision.
for (const [index, image] of found.entries()) {
  const ext = image.media.split('/')[1]?.replace('jpeg', 'jpg') ?? 'png'
  writeFileSync(resolve(OUT, `img-${String(index).padStart(3, '0')}.${ext}`), Buffer.from(image.data, 'base64'))
}
console.log(`\nwrote ${found.length} files to ${OUT}`)
