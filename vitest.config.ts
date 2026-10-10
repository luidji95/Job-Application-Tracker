import { defineConfig } from "vitest/config";

// Unit tests cover pure logic only, so they run in plain Node without a browser.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
