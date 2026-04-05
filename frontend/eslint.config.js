import config from "@kunal-singh/eslint-config/react";
import { defineConfig } from "eslint/config";

export default defineConfig([{ ignores: ["dist", "*.config.js", ".lintstagedrc.js"] }, ...config]);
