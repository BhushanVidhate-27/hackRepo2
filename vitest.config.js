import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/lib/**/*.js"],
      exclude: ["src/**/*.test.js"],
    },server: {
    proxy: {
      '/api': 'http://localhost:8080'
    }
  }
  },
});
