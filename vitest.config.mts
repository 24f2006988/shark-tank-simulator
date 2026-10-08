import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      // `server-only` throws outside the Next.js server bundle; tests run server code directly.
      "server-only": fileURLToPath(new URL("./tests/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["lib/**", "app/api/**", "components/**"],
      reporter: ["text-summary"],
      // CI fails if coverage drops: backend and routes held high, UI components held at their tested floor.
      thresholds: { "lib/**": { lines: 90 }, "app/api/**": { lines: 95 }, "components/**": { lines: 60 } },
    },
  },
});
