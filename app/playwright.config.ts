import { defineConfig, devices } from "@playwright/test";

const port = 3100;
const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const useExternalBaseUrl = Boolean(externalBaseUrl);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: useExternalBaseUrl ? externalBaseUrl : `http://127.0.0.1:${port}`,
    trace: "on-first-retry",
  },
  webServer: useExternalBaseUrl
    ? undefined
    : {
        command: `npm run dev -- --port ${port}`,
        url: `http://127.0.0.1:${port}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
