import config from "@kunal-singh/eslint-config/react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { ignores: ["**/dist/**", "eslint.config.js", "*.config.js", ".lintstagedrc.js"] },
  ...config,
]);
