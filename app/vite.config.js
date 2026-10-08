import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  // Chemins absolus : les pages sont servies depuis des sous-dossiers (/sujet/x,
  // /scrutin/y) ; avec « ./ », le navigateur y cherchait /sujet/x/assets/… → 404.
  base: "/",
  plugins: [vue()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{js,vue}"],
      exclude: ["src/main.js", "src/router.js", "src/**/*.spec.js", "src/**/__tests__/**"],
      thresholds: {
        lines: 60,
        functions: 60,
        statements: 60,
        branches: 50,
      },
    },
  },
});
