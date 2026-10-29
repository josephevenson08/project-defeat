import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  // Pays Vite's first transform once, before the workers start (see the file).
  globalSetup: './tests/global-setup.ts',
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    /*
     * The 3D scene (port step 7) starts switched off in every test, as a visitor who turned it off.
     * The test browser has a real GPU, so the scene would otherwise run behind every test at once and
     * slow them all; `tests/scene.spec.ts` turns it back on where it is the subject.
     */
    storageState: {
      cookies: [],
      origins: [{ origin: 'http://127.0.0.1:5173', localStorage: [{ name: 'project-defeat:scene:v1', value: 'off' }] }],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
