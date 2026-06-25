import { defineConfig } from '@playwright/test';

/**
 * Playwright config for InnOSeed landing smoke tests.
 *
 * Viewport per spec — each spec file calls `test.use({ viewport })` so
 * `desktop.spec.js` always uses 1440x900 and `mobile.spec.js` always
 * uses 375x812. We don't use Playwright `projects` because each project
 * runs every spec file, which would make mobile assertions run on a
 * 1440 viewport (and fail in confusing ways).
 *
 * `webServer` boots `vite preview` against the production build so we
 * test the same artifact that ships, not dev-server HMR artifacts.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },

  webServer: {
    command: 'node_modules/.bin/vite preview --port 4173 --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
