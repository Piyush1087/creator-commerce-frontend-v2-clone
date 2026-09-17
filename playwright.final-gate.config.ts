import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/canonical-reconciliation/final-gate",
  testMatch: "final-gate.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 1,
  timeout: 45_000,
  globalSetup: "./e2e/canonical-reconciliation/final-gate/sessions.ts",
  outputDir: ".artifacts/final-gate/test-results",
  reporter: [
    ["line"],
    ["json", { outputFile: ".artifacts/final-gate/playwright-results.json" }],
  ],
  use: {
    baseURL: process.env.FINAL_GATE_FRONTEND_URL ?? "http://127.0.0.1:5173",
    headless: true,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
});
