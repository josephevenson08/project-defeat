// Downloads the app's three typefaces from Google Fonts into public/fonts/, latin subset only.
//
// **Self-hosted on purpose** (see src/styles/fonts.css): the app makes no third-party request at
// runtime, so the faces are fetched once, here, and committed. All three are under the SIL Open
// Font License 1.1, which allows bundling them with the site as long as the licence travels with
// them, so each face's OFL.txt is fetched from the google/fonts repository beside it.
//
// Latin only, because the app is English-only and the other subsets would multiply the bytes for
// nothing. Figtree and JetBrains Mono are asked for as weight ranges, so Google serves one variable
// file each rather than a file per weight.
//
// Idempotent: a file already on disk is skipped unless --force is passed. The repo lives in
// OneDrive, and rewriting identical files makes it re-sync them.
//
// Run: node tools/ingest/vendor-fonts.mjs [--force]
// Writes: public/fonts/<name>.woff2 and public/fonts/<family>-OFL.txt

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(HERE, '../../public/fonts')
const force = process.argv.includes('--force')

/*
 * `query` is the css2 family parameter; `file` the name the face is written under, which
 * src/styles/fonts.css and index.html's preloads refer to; `ofl` the family's folder in
 * github.com/google/fonts/tree/main/ofl.
 */
const FACES = [
  { query: 'Marcellus', file: 'marcellus-400.woff2', ofl: 'marcellus' },
  { query: 'Figtree:wght@400..700', file: 'figtree-variable.woff2', ofl: 'figtree' },
  { query: 'JetBrains+Mono:wght@400..500', file: 'jetbrains-mono-variable.woff2', ofl: 'jetbrainsmono' },
]

// Google picks the font format from the user agent; a current desktop Chrome gets woff2.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

async function fetchOk(url, as) {
  const response = await fetch(url, { headers: { 'user-agent': UA } })
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`)
  return as === 'text' ? response.text() : Buffer.from(await response.arrayBuffer())
}

/** The woff2 URL of the `latin` block (not `latin-ext`) in a css2 response. */
function latinUrl(css, query) {
  const block = css.split('/*').find((part) => part.trimStart().startsWith('latin */'))
  const url = block?.match(/url\((https:[^)]+\.woff2)\)/)?.[1]
  if (!url) throw new Error(`no latin woff2 in the CSS for ${query}`)
  return url
}

mkdirSync(OUT_DIR, { recursive: true })

for (const face of FACES) {
  const fontPath = resolve(OUT_DIR, face.file)
  if (force || !existsSync(fontPath)) {
    const css = await fetchOk(`https://fonts.googleapis.com/css2?family=${face.query}&display=swap`, 'text')
    const bytes = await fetchOk(latinUrl(css, face.query), 'bytes')
    writeFileSync(fontPath, bytes)
    console.log(`fonts: ${face.file} (${(bytes.length / 1024).toFixed(1)} KB)`)
  } else {
    console.log(`fonts: ${face.file} already present`)
  }

  const licencePath = resolve(OUT_DIR, `${face.ofl}-OFL.txt`)
  if (force || !existsSync(licencePath)) {
    writeFileSync(licencePath, await fetchOk(`https://raw.githubusercontent.com/google/fonts/main/ofl/${face.ofl}/OFL.txt`, 'text'))
    console.log(`fonts: ${face.ofl}-OFL.txt`)
  }
}
