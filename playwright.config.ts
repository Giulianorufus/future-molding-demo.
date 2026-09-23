import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: "http://127.0.0.1:3003",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev:safe -- --port 3003",
    url: "http://127.0.0.1:3003",
    timeout: 120_000,
    reuseExistingServer: false,
  },
});
