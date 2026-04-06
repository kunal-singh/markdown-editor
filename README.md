# WikiSync

Real-time collaborative markdown wiki.

---

## Table of Contents

1. [Running It](#running-it)
2. [Environment](#environment)
3. [Features](#features)
4. [Architecture Overview](#architecture-overview)
5. [Tech Stack & Why](#tech-stack--why)
6. [Code Quality & AI Guardrails](#code-quality--ai-guardrails)
7. [Real-Time Sync](#real-time-sync)
8. [Database Schema](#database-schema)
9. [Security](#security)
10. [Known Limitations](#known-limitations)
11. [AI Usage](#ai-usage)

---

## Running It

### Production (Docker)

```bash
cp .env.example .env
# ⚠️  **Fill in `JWT_SECRET` before starting — the server will refuse to boot without it.**
# Everything else defaults are fine for local use.
docker compose up --build
```

| Service  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost      |
| API      | http://localhost:8000 |
| Postgres | localhost:5432        |

### Development (HMR)

Run each in a separate terminal:

> **Before running:** open `.env.example`, uncomment the local development values (the `DATABASE_URL` pointing to `localhost`, not `db`), and copy them to `.env`.

```bash
# 1. Postgres only
docker compose up db

# 2. API with hot reload (from backend/)
make dev

# 3. Frontend with HMR (from frontend/)
pnpm dev
```

| Service  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost:5173 |
| API      | http://localhost:8000 |
| Postgres | localhost:5432        |

Vite proxies `/api/*` → `http://localhost:8000` in dev so there are no CORS issues.

---

## Environment

One `.env` at the repo root. Docker Compose loads it automatically.

```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/markdown_editor
JWT_SECRET=                    # required — anything long and random works
ALLOWED_ORIGINS=http://localhost

POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=markdown_editor
```

---

## Features

### Must-haves

- ✅ Page CRUD
- ✅ Live Collaborative Editing
- ✅ Page Organisation — nested hierarchy, sidebar tree
- ✅ Authentication & Multi-User Support — registration/login, presence indicators, last-edited-by
- ✅ Rich Markdown Rendering — code blocks with syntax highlighting, tables
- ✅ Full-text Search — with context snippets

### Bonus

- ✅ Dark Mode
- ☐ Keyboard Shortcuts
- ☐ Version History
- ☐ Auto TOC
- ☐ Image Uploads
- ☐ Export
- ☐ Permissions

---

## Architecture Overview

```
backend/
├── apps/api/               ← FastAPI app
└── packages/
    ├── core/               ← schemas, auth, config
    ├── persistence/        ← SQLAlchemy + asyncpg
    └── collaboration/      ← pycrdt + ypy-websocket

frontend/
├── app/                    ← Vite + React
└── packages/
    ├── ui/                 ← shadcn components + Tailwind theme
    └── editor/             ← TipTap editor with Yjs WebSocket support
```

Each backend package has one job and a clean public surface. The frontend layers components → hooks → use cases → infra, so you can swap the storage backend without touching the WebSocket layer, or rip out the editor without breaking auth.

---

## Tech Stack & Why

### Backend

FastAPI for native async — WebSocket connections and DB calls share the same event loop, no thread pools. The honest trade-off is Node.js has native Yjs bindings; Python uses pycrdt (Rust FFI). It works, but it's an extra dependency layer that you'll notice if something breaks.

Postgres earns its keep here twice: BYTEA columns store CRDT binary state without extra serialization, and native `tsvector`/GIN/`ts_headline` handle full-text search without Elasticsearch. SQLAlchemy 2 async + Pydantic for the ORM and schemas. JWT + bcrypt for auth.

### Frontend

React 19 + Vite. No SSR — this is an authenticated app with no public pages, so there's nothing to gain. TipTap binds Yjs via `y-prosemirror` natively, which means the editor's collaborative state is completely decoupled from React render cycles. Jotai for state — atoms give granular updates and you skip the Redux boilerplate. shadcn/ui + Tailwind v4 for components.

### Infrastructure

Docker Compose + nginx proxy. Splitting persistence, collaboration, and editor into separate packages was worth the setup cost. Changing one doesn't break the others.

---

## Code Quality & AI Guardrails

ruff + mypy on the backend, eslint + prettier on the frontend, commitlint for commit messages — lefthook runs all of it at the commit boundary. The point is that a passing commit actually means something, not just that the code ran locally.

---

## Real-Time Sync

CRDTs (Yjs) over OT or last-write-wins. OT gets brittle once you have more than two concurrent editors and any real network latency. LWW drops edits without telling anyone. Yjs merges correctly without coordination.

pycrdt is Rust-backed, so binary encoding stays fast and the wire format compact. The server relays updates and awareness but isn't the source of truth for in-flight edits — clients hold document state. Idle for 5 seconds, the current Yjs binary flushes to Postgres. Reconnection uses exponential backoff; offline edits merge when the connection comes back. Cursor positions and presence are relayed server-side, not persisted.

---

## Database Schema

Two tables: `users` and `pages`. Pages have a `parent_id` self-reference for the nested hierarchy. A computed `tsvector` column with a GIN index handles full-text search — queries use `ts_headline` to return context snippets with matched terms highlighted. `content_binary` holds the raw Yjs CRDT state.

Schema management is `create_all` in the FastAPI lifespan hook — no migrations. That's fine here. Add Alembic before you have data you care about.

---

## Security

**XSS** — Markdown is rendered by TipTap/ProseMirror, which operates on a structured document model rather than raw HTML strings. No `dangerouslySetInnerHTML` on editor output. Search excerpts from the API contain `<mark>` tags only — rendered in a sanitized container. The backend's `core.sanitization` module strips disallowed HTML before any content reaches the database.

**Auth** — JWT tokens, secrets in environment variables, passwords hashed with bcrypt. No secrets are hardcoded anywhere.

**Input validation** — Pydantic validates all request bodies on the server. Slug format is enforced by regex (`^[a-z0-9]+(?:-[a-z0-9]+)*$`) on both client and server.

**SQL injection** — SQLAlchemy's ORM with parameterized queries throughout. No raw SQL strings.

---

## Known Limitations

**Debounced flushes, not continuous saves.** The backend keeps the active `Y.Doc` in memory and flushes to Postgres after 5 seconds of room inactivity. If the server container crashes in that window, the most recent keystrokes rely on connected clients to re-sync their local state on reconnection. Yjs's CRDT guarantees those edits won't be lost as long as at least one client stayed connected — but a clean crash with no clients will lose the unflushed delta.

**Unpaginated sidebar.** The nested sidebar loads the entire page hierarchy tree in one request. Fast and clean for a small wiki; a performance problem at tens of thousands of deeply nested pages. The fix is lazy-loading children on expand.

**Ghost cursors on abrupt disconnect.** If a user closes their laptop rather than navigating away, the WebSocket termination can delay. Their presence indicator stays visible until the server's heartbeat ping times out and cleans up the connection. Not a data problem — just a slightly misleading UI for a few seconds.

**No refresh tokens.** Access tokens expire and the user gets logged out. Standard refresh token rotation would fix this.

**No migration framework.** Schema changes require dropping and recreating the database. Alembic is the obvious next step.

**Search is English-only.** The `tsvector` configuration uses `english` stemming. Multi-language content would need a different stemmer or a dedicated search service.

**No page version history.** The Yjs binary state is stored per flush, not per edit. Point-in-time history would require storing a snapshot on every save or tracking Yjs update payloads separately.

**WebSocket auth is open.** Any client can connect to any page's WebSocket room without a token. Fine for a trusted internal tool, not for public deployment.

**Image uploads are not implemented.** The editor accepts pasted images but doesn't persist them.

---

## AI Usage

Claude (via Claude Code) was used throughout — architecture planning, boilerplate generation, debugging async SQLAlchemy issues, and writing this README.

The collaboration engine wiring (`pycrdt` + `ypy-websocket` + FastAPI WebSocket) needed the most back-and-forth. The library documentation is sparse and the async lifecycle around room creation and cleanup required reading source code directly to get right.

The frontend layered architecture (components → hooks → use cases → infra) was designed up front with Claude's help and enforced throughout the project. It made the editor wiring significantly cleaner than ad-hoc hooks would have been.

Where AI helped most: generating typed boilerplate — Pydantic schemas, SQLAlchemy models, repository methods — that would have been tedious to write and easy to get slightly wrong. Where it helped least: anything involving `ypy-websocket` internals, which required reading the source directly.
