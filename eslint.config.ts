import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig, includeIgnoreFile } from "eslint/config";
import { join } from "path";


export default defineConfig([
  includeIgnoreFile(join(__dirname, ".gitignore"), { gitignoreResolution: true }),
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: {...globals.browser, ...globals.node} } },
  tseslint.configs.recommended,
  {
    files: ["src/core_mods/**/*.{js,mjs,cjs}"],
    rules: {
      "no-undef": "off"
    }
  }
]);
