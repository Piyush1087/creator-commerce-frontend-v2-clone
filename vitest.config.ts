import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    // Windows-friendly: avoid minThreads/maxThreads conflict when limiting workers.
    maxWorkers: 1,
    minWorkers: 1,
  },
});
