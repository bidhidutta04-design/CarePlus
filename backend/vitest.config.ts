import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./tests/setup.ts"],
    pool: "forks",
    testTimeout: 60000,
    hookTimeout: 120000,
  },
});
