#!/usr/bin/env node
/**
 * Copies the design prototypes into the built site, so GitHub Pages serves them at /project-defeat/prototypes/.
 *
 * Usage:  npm run build && node tools/publish/copy-prototypes.mjs
 *
 * **Run after the build, never before:** `vite build` empties `dist/`, so it would delete the copy. The deploy
 * workflow runs this as its own step after `npm run build`.
 *
 * **Only what a browser opens is published:** the pages, their scripts and the gallery. Left out are the
 * hands-on test scripts (`tabs/checks/`), the `.mjs` scripts that generate pages and data, the `.md`
 * notes (nothing links to them, and GitHub already shows them as documents) and hidden local folders.
 *
 * **The icons are not copied.** The prototypes use the app's own icons, which the build already puts at
 * `dist/icons/`; the pages pick that folder when they are not opened from `docs/design/prototypes/`.
 */

import { cpSync, existsSync, readdirSync, rmSync, statSync } from 'node:fs'
import { basename, dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const from = join(root, 'docs', 'design', 'prototypes')
const dist = join(root, 'dist')
const to = join(dist, 'prototypes')

if (!existsSync(join(dist, 'index.html'))) {
  console.error('copy-prototypes: dist/index.html is missing. Run `npm run build` first.')
  process.exit(1)
}

const skip = (path) => {
  const rel = relative(from, path).split(sep).join('/')
  if (rel === 'tabs/checks' || rel.startsWith('tabs/checks/')) return true
  const name = basename(path)
  return name.startsWith('.') || name.endsWith('.mjs') || name.endsWith('.md')
}

rmSync(to, { recursive: true, force: true })
cpSync(from, to, { recursive: true, filter: (path) => !skip(path) })

const count = (dir) => readdirSync(dir).reduce((n, name) => {
  const path = join(dir, name)
  return n + (statSync(path).isDirectory() ? count(path) : 1)
}, 0)
console.log(`copy-prototypes: ${count(to)} files copied to dist/prototypes/`)
