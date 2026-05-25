import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.test.ts"],
    env: {
      JWT_SECRET: "test_secret_for_tests_only_very_long_string_123",
    },
  },
});
