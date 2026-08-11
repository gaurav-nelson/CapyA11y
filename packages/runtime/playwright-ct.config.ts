import { defineConfig, devices } from "@playwright/experimental-ct-react";

/**
 * Playwright Component Testing config for CapyA11y runtime isolation.
 * The CLI mounts components programmatically (esbuild + Chromium) using the
 * same isolation model; this config supports optional CT-style test files.
 */
export default defineConfig({
  testDir: "./ct-tests",
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    trace: "on-first-retry",
    ctPort: 3100,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
