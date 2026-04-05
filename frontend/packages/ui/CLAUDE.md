# packages/ui

## Import Rules

- Never use `import { cn } from "@/lib/utils"` — the `@/` alias is not configured in this package.
  Use the relative path instead: `import { cn } from "../../lib/utils"`.
