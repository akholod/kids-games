import { defineConfig, devices } from '@playwright/test';

// PW_PORT / PW_OUT let parallel runs (several agents at once) use their own server and output dir.
const PORT = Number(process.env.PW_PORT) || 8795;
const CI = !!process.env.CI;
// Chromium projects use the system Chrome; PW_CHANNEL='' = Playwright's bundled Chromium (e.g. in the Playwright docker image).
const CHANNEL = process.env.PW_CHANNEL ?? 'chrome';
// WebKit (ipad/iphone/safari) needs libraries this host lacks: those projects run only with PW_WEBKIT=1, via `pnpm test:webkit` (docker).
const WEBKIT = !!process.env.PW_WEBKIT;

export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: process.env.PW_OUT || 'test-results',
  fullyParallel: true,
  retries: CI ? 1 : 0,
  timeout: 45_000,
  expect: {
    timeout: 7_000,
    toHaveScreenshot: { animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.01 },
  },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: process.env.PW_OUT ? `${process.env.PW_OUT}-report` : 'playwright-report' }],
  ],
  webServer: {
    command: `node tests/serve.mjs ${PORT}`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !CI,
    timeout: 15_000,
  },
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    channel: CHANNEL, // system Chrome, no browser download
    reducedMotion: 'reduce',
    actionTimeout: 7_000,
    navigationTimeout: 15_000,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'laptop',
      use: { viewport: { width: 1280, height: 800 } },
      // Screenshots are taken on the phone only.
      testIgnore: /screenshots\.spec/,
    },
    {
      name: 'phone',
      use: { viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 },
      // Keyboard-only flows and the laptop no-scroll guard need a laptop.
      testIgnore: /keyboard\.spec|no-scroll\.spec/,
    },
    // Cross-browser checks of the «what's new» dialog only (iPad/iPhone Safari, Android Chrome, desktop Safari).
    // WebKit = Playwright's own build (`pnpm exec playwright install webkit`); channel '' = no system Chrome (undefined would not override the top-level 'chrome').
    { name: 'ipad', testMatch: /news\.spec/, use: { ...devices['iPad (gen 7)'], channel: '' } },
    { name: 'iphone', testMatch: /news\.spec/, use: { ...devices['iPhone 13'], channel: '' } },
    {
      name: 'android',
      testMatch: /news\.spec/,
      use: { ...(({ defaultBrowserType, ...d }) => d)(devices['Pixel 7']), channel: CHANNEL },
    },
    {
      name: 'safari',
      testMatch: /news\.spec/,
      use: { ...devices['Desktop Safari'], viewport: { width: 1280, height: 800 }, channel: '' },
    },
  ].filter((p) => WEBKIT === ['ipad', 'iphone', 'safari'].includes(p.name)),
});
