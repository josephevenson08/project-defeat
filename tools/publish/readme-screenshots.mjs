#!/usr/bin/env node
/**
 * Retakes the README's screenshots and the link-preview image from the running app.
 *
 * Usage:  npm run dev   (in another terminal), then  node tools/publish/readme-screenshots.mjs [address]
 *         The address defaults to the dev server, http://localhost:5173/.
 *
 * Writes:
 *   docs/images/home.jpg            the front door, 1440 x 900 (README)
 *   docs/images/planner.jpg         the planner wearing the recommended set, 1440 x 900 (README)
 *   docs/images/social-preview.jpg  the front door, 1280 x 640 (GitHub's social preview, set by hand
 *                                   in the repository settings)
 *   public/social-preview.jpg       the same, served with the app for `og:image` in index.html
 *
 * **Run it after a change to how the app looks,** so the README and a link pasted into Discord show
 * the app as it is. Runs on the system's Microsoft Edge with reduced motion, like the test suite, so
 * nothing is caught mid-animation.
 */

import { createRequire } from 'node:module'
import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const { chromium } = createRequire(join(root, 'package.json'))('playwright')
const base = process.argv[2] || 'http://localhost:5173/'
const images = join(root, 'docs', 'images')
mkdirSync(images, { recursive: true })

const browser = await chromium.launch({ channel: 'msedge' })

async function open(viewport) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce', deviceScaleFactor: 1 })
  const page = await context.newPage()
  await page.goto(base)
  await page.getByTestId('section-planner').waitFor()
  // The front door's backdrop picture loads after the page; wait for it rather than shoot an empty one.
  await page.waitForLoadState('networkidle')
  return { context, page }
}

const shoot = (page, file) => page.screenshot({ path: join(images, file), type: 'jpeg', quality: 86 })

{
  const { context, page } = await open({ width: 1440, height: 900 })
  await shoot(page, 'home.jpg')
  await context.close()
}

{
  const { context, page } = await open({ width: 1280, height: 640 })
  await shoot(page, 'social-preview.jpg')
  await context.close()
}

{
  const { context, page } = await open({ width: 1440, height: 900 })
  await page.getByTestId('section-planner').click()
  for (let step = 0; step < 3; step++) await page.getByTestId('creator-next').click()
  await page.getByTestId('creator-confirm').click()
  await page.getByTestId('equip-recommended').click()
  await page.waitForLoadState('networkidle')
  await shoot(page, 'planner.jpg')
  await context.close()
}

await browser.close()
copyFileSync(join(images, 'social-preview.jpg'), join(root, 'public', 'social-preview.jpg'))
console.log('readme-screenshots: home.jpg, planner.jpg and social-preview.jpg written (and public/social-preview.jpg)')
