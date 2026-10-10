import { defineConfig, devices } from '@playwright/test'
import base from './playwright.config'

/*
 * The same suite, run on the system's Microsoft Edge instead of Playwright's own Chromium.
 *
 * For machines where `npx playwright install chromium` hasn't been run: Edge ships with Windows, so
 * `npx playwright test -c playwright.edge.config.ts` works without downloading a browser.
 */
export default defineConfig({
  ...base,
  projects: [
    {
      name: 'edge',
      use: { ...devices['Desktop Chrome'], channel: 'msedge' },
    },
  ],
})
