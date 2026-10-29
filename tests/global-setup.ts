import { chromium, type FullConfig } from '@playwright/test'

/**
 * Warms the dev server once, before any test runs.
 *
 * Vite transforms the app on its first request, and in this OneDrive folder that first transform can
 * take 30 to 45 seconds, longer than a test's 30-second timeout. With several workers opening the cold
 * server at the same moment, a full run kept losing whichever tests came first: page.goto timeouts in
 * three different files on 2026-10-26, each of which passed at once on a warm server. Playwright starts
 * the web server before global setup, so one visit here pays the cost before the workers start. The
 * app imports every tab statically, so loading the front door transforms the whole graph; the lazy
 * scene chunk is left for the tests that turn the scene on.
 */
export default async function globalSetup(config: FullConfig) {
  const { baseURL, channel } = config.projects[0].use
  const browser = await chromium.launch({ channel })
  try {
    const page = await browser.newPage()
    await page.goto(baseURL ?? 'http://127.0.0.1:5173', { waitUntil: 'networkidle', timeout: 180_000 })
  } finally {
    await browser.close()
  }
}
