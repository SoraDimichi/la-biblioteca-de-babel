import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  use: {
    baseURL: "http://localhost:4173",
    headless: true,
    viewport: { width: 800, height: 600 },
  },
  webServer: undefined,
});
