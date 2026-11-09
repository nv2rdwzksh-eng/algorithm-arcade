import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  base: "/algorithm-arcade/",
  plugins: [vue()],
  test: { include: ["tests/unit/**/*.test.ts"] },
});
