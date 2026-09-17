import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["e2e/canonical-reconciliation/final-gate/**/*.test.ts"],
  },
});
