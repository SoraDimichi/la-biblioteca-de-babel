import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  use: {
    baseURL: "http://host.docker.internal:4173",
    headless: true,
    viewport: { width: 800, height: 600 },
  },
});
