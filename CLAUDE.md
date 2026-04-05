# Frontend Monorepo

## Structure

```
frontend/                  ← pnpm workspace root (tooling: eslint, prettier, ts, lefthook)
├── app/                   ← @markdown-editor/app (Vite + React)
└── packages/
    └── ui/                ← @markdown-editor/ui (shadcn components + Tailwind theme)
```

## Rules

- All commands run from `frontend/`
- Node version: 22 (`nvm use 22.15.0`)
- After every task: `pnpm lint && pnpm format`

## Backend Monorepo

## Structure

```
backend/                   ← uv workspace root (tooling: ruff, mypy)
├── apps/
│   └── api/               ← FastAPI app
└── packages/
    ├── core/              ← shared models, auth, config
    ├── persistence/       ← SQLAlchemy + asyncpg
    └── collaboration/     ← pycrdt + ypy-websocket
```

## Rules

- All commands run from `backend/`
- Python version: 3.11
- After every task: `make check` (ruff + mypy)
- Install: `make install` (`uv sync --all-packages`)

---

## Adding a shadcn component

```bash
cd packages/ui
pnpm component <name>          # writes to src/components/ui/<name>.tsx
```

Then add one line to `packages/ui/src/index.ts`:
```ts
export * from "./components/ui/<name>";
```
