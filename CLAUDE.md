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

## LSP Diagnostics

**LSP errors may be false positives.** In this pnpm workspace, packages rely on hoisted `node_modules` at the workspace root. The IDE's TypeScript server, when opened in a package subdirectory, may not resolve hoisted deps and will report spurious "Cannot find module" or JSX errors.

**Before acting on any LSP diagnostic:** run `pnpm --filter <package> typecheck` (or `pnpm typecheck` from `frontend/`). If the CLI passes clean, the LSP error is a false positive — ignore it and do not spend tokens investigating.

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

## LSP Diagnostics

**LSP errors may be false positives.** The IDE's Pyright/Pylance server may not resolve packages installed in the uv venv (especially workspace packages and packages without stubs).

**Before acting on any LSP diagnostic:** run `make check` from `backend/`. If mypy passes clean, the LSP error is a false positive — ignore it and do not spend tokens investigating.

---

## Persistence Layer (`packages/persistence`)

- Import repositories and session from the public surface only: `from persistence import UserRepository, PageRepository, get_session, create_tables`
- ORM models (`User`, `Page`) are internal — never import them outside `persistence`
- All Pydantic schemas live in `core.schemas` — use `UserCreate`, `UserRead`, `PageCreate`, `PageRead`, `PageUpdate`, `PageSearchResult`
- Password hashing is in `core.security` (`hash_password`, `verify_password`) — repositories accept `hashed_password` directly, never raw passwords
- Inject sessions via FastAPI dependency: `SessionDep = Annotated[AsyncSession, Depends(get_session)]`
- `create_tables()` is called in the FastAPI lifespan hook (`apps/api/main.py`) — idempotent, safe on every restart
- `update_binary(session, page_id, binary)` is for debounced Yjs state saves only — does **not** update `content_text` or refresh the search index
- Full-text search uses `PageRepository.search(session, query_str)` — returns `PageSearchResult` with `<mark>`-wrapped excerpts via Postgres `ts_headline`

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
