import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  /*
   * GitHub Pages serves this repo as a *project* site, at /project-defeat/ rather than at a domain
   * root, so a production build has to emit asset URLs under that prefix or every script and
   * stylesheet 404s.
   *
   * Build only. The dev server and the Playwright suite both address the app at `/`, and setting
   * this globally would send every test to a path the dev server does not serve.
   */
  base: command === 'build' ? '/project-defeat/' : '/',
}))
