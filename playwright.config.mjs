import { defineConfig } from '@playwright/test';

// PW_PORT / PW_OUT let parallel runs (several agents at once) use their own server and output dir.
const PORT = Number(process.env.PW_PORT) || 8795;
const CI = !!process.env.CI;

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
    channel: 'chrome', // system Chrome, no browser download
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
  ],
});
