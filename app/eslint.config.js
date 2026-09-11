import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";

export default [
  { ignores: ["dist", "coverage", "node_modules", "public", ".vercel"] },
  js.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  eslintConfigPrettier,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ["src/components/Icon.vue", "src/components/Pager.vue"],
    rules: {
      "vue/multi-word-component-names": "off",
    },
  },
];
