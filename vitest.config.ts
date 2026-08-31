import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Windows-friendly: avoid minThreads/maxThreads conflict when limiting workers.
    maxWorkers: 1,
    minWorkers: 1,
  },
});
