# packages/ui

## Import Rules

- Use `@ui/` for all internal imports (e.g. `import { cn } from "@ui/lib/utils"`).
- Never use `@/` — shadcn CLI generates it but the `component` script auto-replaces it with `@ui/` via `sed`.
- The alias `@ui/*` maps to `src/*` in `tsconfig.json` and in the app's `vite.config.ts`.
