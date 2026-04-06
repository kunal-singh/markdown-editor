# WikiSync

Real-time collaborative markdown wiki.

---

## Table of Contents

1. [Running It](#running-it)
2. [Environment](#environment)
3. [Architecture Overview](#architecture-overview)
4. [Tech Stack & Why](#tech-stack--why)
   - [Backend](#backend)
   - [Frontend](#frontend)
   - [Infrastructure](#infrastructure)
   - [System Extensibility](#system-extensibility-the-monorepo-approach)
5. [Real-Time Sync Strategy](#real-time-sync-strategy)
6. [WebSocket Lifecycle](#websocket-lifecycle)
7. [Database Schema](#database-schema)
8. [Security](#security)
9. [Frontend State Management](#frontend-state-management)
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

## Architecture Overview

```
.
├── frontend/                  # pnpm workspace (Vite + React, served via nginx)
│   ├── app/                   # @markdown-editor/app — main React app
│   └── packages/
│       └── ui/                # @markdown-editor/ui — shadcn components + Tailwind theme
│       └── editor/            # @markdown-editor/editor — titap editor with yjs socket support
│
├── backend/                   # uv workspace (FastAPI)
│   ├── apps/api/              # FastAPI entry point + routing
│   └── packages/
│       ├── core/              # schemas, auth, config, sanitization
│       ├── persistence/       # SQLAlchemy models, repositories, FTS
│       └── collaboration/     # CRDT engine (pycrdt) + WebSocket rooms
│
└── docker-compose.yml         # single-command start
```

The frontend and backend are fully decoupled. The frontend talks to the backend over HTTP (`/api/*`) and WebSocket (`/pages/{id}/ws`). Nginx handles the proxy in production; Vite handles it in dev.

The backend is split into packages so each layer has one job: `persistence` owns the database, `core` owns schemas and auth logic, `collaboration` owns the real-time sync engine. The FastAPI app in `apps/api` just wires them together.

---

## Tech Stack & Why

### Backend

**FastAPI + Python 3.11**

FastAPI was the right call here for two reasons. Async support is first-class — the WebSocket rooms and database calls are all async, and FastAPI doesn't fight you on that. Django would have required more ceremony to get async WebSocket handling working. The automatic OpenAPI spec generation is also genuinely useful during development: the interactive docs at `/docs` let you test every endpoint without a single curl command.

The honest tradeoff: Node.js would have been a stronger fit for the real-time layer specifically. The Yjs ecosystem is JavaScript-native — `yjs`, `y-websocket`, and `hocuspocus` all run on Node without any FFI boundary. On Python, we had to go through `pycrdt` (a Rust-compiled binding) to get Yjs-compatible CRDT operations. It works, but there's a translation layer that wouldn't exist in a Node stack.


**PostgreSQL 16**

Postgres was chosen for two distinct reasons that each ruled out simpler alternatives.

**Binary storage:** The Yjs document state is a compiled CRDT binary — not a string, not JSON. Postgres's `BYTEA` type stores it safely and efficiently. Every time the collaboration engine flushes, it writes the full `Y.Doc` state as raw bytes into `content_binary`. This is what gets loaded back into memory when a room is recreated after a server restart. SQLite handles `BLOB` similarly, but the async write story (below) ruled it out.

**Full-text search:** Rather than deploying Elasticsearch or Meilisearch, we used Postgres's native FTS stack: a `TSVECTOR` computed column over `title` and `content_text`, a GIN index for fast lookups, and `ts_headline` for generating context snippets with `<mark>`-wrapped match highlights. The search infrastructure adds zero ops overhead — it's just the database we already have.

SQLite with WAL mode was considered and dropped. It doesn't handle concurrent async writes cleanly, and `asyncpg` (which gives us non-blocking Postgres I/O) has no SQLite equivalent.

**SQLAlchemy 2 (async) + asyncpg**

SQLAlchemy 2's async API maps cleanly onto FastAPI's dependency injection. Sessions are injected per-request via `Depends(get_session)`, which keeps connection lifetimes predictable. The ORM models are kept internal to the `persistence` package — nothing outside it imports them. All external code talks to typed Pydantic schemas from `core`.

**pycrdt + ypy-websocket**

See [Real-Time Sync Strategy](#real-time-sync-strategy) below.

**JWT (python-jose)**

Stateless auth with short-lived access tokens. No refresh token flow yet (see [Known Limitations](#known-limitations)), but the pattern is straightforward to extend. Passwords are hashed with bcrypt via `passlib`.

---

### Frontend

**React 19 + Vite**

No framework overhead. The app doesn't need SSR — it's a collaborative editor, not a content site — so a plain Vite SPA is the correct scope. React 19's concurrent features are available if we need them for editor responsiveness later.

**TipTap (ProseMirror-based)**

The editor is the hardest UI component to get right. TipTap sits on top of ProseMirror and natively binds to Yjs via the `y-prosemirror` bridge under the hood. This is the key architectural win: the UI layer and the collaborative state layer are cleanly separated. TipTap doesn't know it's in a multi-user session — it just reads and writes to a `Y.XmlFragment`, and Yjs handles syncing that fragment to everyone else. First-party extensions for collaboration (`@tiptap/extension-collaboration`) and collaborative cursors (`@tiptap/extension-collaboration-cursor`) meant zero custom sync code in the editor. CodeMirror was considered and would have worked, but TipTap's rich-text model was a better fit for the wiki use case.

**y-websocket (WebsocketProvider)**

The Yjs WebSocket provider handles sync, reconnection, and awareness out of the box. It speaks the same wire protocol as the backend's `ypy-websocket` server — no custom protocol code needed on either side.

**Jotai**

Lightweight atom-based state. The app's global state surface is small: current user, current page, editor loading/error states. Jotai's atomic model pairs well with how Yjs dispatches updates — changes from a remote user typing a single character trigger a granular Yjs event, not a full document re-render. Jotai atoms update only the specific UI pieces that care about that change. Redux's reducer model would have funnelled everything through a single state tree, making it harder to isolate those fine-grained updates without extra memoization work.

**shadcn/ui + Tailwind CSS v4**

shadcn gives us accessible, composable components without the lock-in of a full component library. We own the component files — they live in `packages/ui` and are fully customizable. Tailwind v4 drops the config file in favor of CSS-native configuration, which cuts setup friction significantly.

**Layered architecture (components → hooks → use cases → infra)**

Components only call hooks. Hooks wire infra to use cases. Use cases contain business logic. Infra makes HTTP calls. The constraint keeps components thin and business logic testable without React. Full details in `frontend/CLAUDE.md`.

---

### Infrastructure

**Docker Compose**

Three services: `api`, `frontend`, `db`. The `api` container runs the FastAPI app under uvicorn. The `frontend` container is a multi-stage build — Node builds the static assets, nginx serves them and proxies `/api/*` to the backend. The `db` container has a health check so the API waits for Postgres to be ready before starting.

**Nginx**

The frontend Dockerfile copies a custom `nginx.conf` that does two things: proxies `/api/` to `http://api:8000/` and falls back to `index.html` for all other routes (SPA routing). Without this proxy rule, API requests 404 against the static file server — which was the first bug caught after the initial Docker build.

### System Extensibility (The Monorepo Approach)

Rather than a monolithic structure where everything lives in one app directory, each domain is isolated into its own package so it can be understood, tested, or swapped independently.

**`packages/persistence/`** — database logic is fully decoupled from the API. If full-text search ever needs to move from Postgres FTS to a dedicated search engine, the `content_text` mirror column remains the clean source of truth. A new search service can simply read from it without touching the collaboration or API layers.

**`packages/collaboration/`** — the CRDT engine is framework-agnostic. It depends on a `DocumentStore` protocol (a typed interface) rather than hardcoded database calls. It knows how to merge `Y.Doc` binaries and extract plain text; it doesn't know about FastAPI, SQLAlchemy, or HTTP. Swapping the persistence backend — say, to Redis for active rooms — only requires a new `DocumentStore` implementation.

**`packages/editor/`** — a pure UI package. The TipTap configuration and WebSocket provider hooks are encapsulated here. The rich text editor could be dropped into a completely different React application by changing the WebSocket URL it points to. Nothing in this package knows about the wiki's routing, auth, or page hierarchy.

---

## Real-Time Sync Strategy

**CRDTs via Yjs (pycrdt on the server, yjs on the client)**

Three approaches were on the table:

1. **Operational Transform** — correct in theory, notoriously hard to implement correctly under network partitions. Not worth building from scratch under time pressure.
2. **Last-write-wins** — simple, but produces data loss when two users type simultaneously. Acceptable for low-collaboration tools, not for a wiki.
3. **CRDTs** — correct by construction. Two users can edit offline and merge without conflicts when they reconnect.

Yjs specifically because it's battle-tested (VS Code Live Share, Liveblocks, and others use it), and the WebSocket sync protocol is standard enough that `y-websocket` on the client speaks to `ypy-websocket` on the server with no custom protocol code. On the server, `pycrdt` handles the CRDT operations — it's backed by a Rust implementation, so binary encoding and merging happen in microseconds even for large documents. Building equivalent OT from scratch in a weekend would have been both slower and almost certainly buggy under edge-case network conditions.

The CRDT model means the server is not the source of truth for in-flight edits — each client has a local copy of the document that merges automatically. The server holds the authoritative persisted state.

Document content lives under the key `"content"` as a `Y.XmlFragment` (TipTap's preferred shared type). After 5 seconds of inactivity in a room, the collaboration engine flushes the full Yjs binary state to `content_binary` in Postgres and extracts plain text into `content_text` for the search index.

When a user opens a page that already has content, the server loads `content_binary` into the room before any client can connect — guaranteed by a server-side lock. The client receives the full document state during the Yjs sync handshake and never sees a flash of empty content.

---

## WebSocket Lifecycle

Each page has one WebSocket room at `ws://localhost:8000/pages/{page_id}/ws`. Rooms are created lazily on first connection and destroyed when the last client disconnects.

**Disconnection and reconnection** are handled by `WebsocketProvider` on the client with exponential backoff. If a user goes offline mid-edit, their local `Y.Doc` retains all their unsaved changes. When they reconnect, Yjs automatically merges their offline edits with whatever happened on the server — no data loss, no manual conflict resolution needed.

**Awareness** (presence indicators) is relayed by the server without custom code. Each client sets its user info on the shared awareness state, and the server broadcasts it to all other clients in the room.

The frontend cleans up the WebSocket connection on page navigation:

```ts
useEffect(() => {
  return () => provider.destroy()
}, [pageId])
```

---

## Database Schema

**Users** — `id`, `email` (unique), `hashed_password`, `display_name`, `created_at`.

**Pages** — `id`, `slug` (unique, kebab-case), `title`, `parent_id` (self-referential FK with `CASCADE`), `created_by_id`, `last_edited_by_id`, `content_text`, `content_binary`, `search_vector` (computed `TSVECTOR`), `created_at`, `updated_at`.

The hierarchy is an adjacency list — `parent_id` points to another page's `id`. This is the right model at this scale. Nested sets or closure tables are faster for deep tree reads but significantly more complex to write to. The adjacency list works with a recursive CTE when the full tree is needed.

`search_vector` is a Postgres computed `TSVECTOR` over `title` and `content_text`. The GIN index on it makes full-text search fast. `ts_headline` generates excerpt snippets with `<mark>`-wrapped match highlights.

`content_binary` stores the full Yjs document state as raw bytes. This is what gets loaded into the room on reconnect — it carries the CRDT's full merge history.

Schema is managed through SQLAlchemy's `create_all` called in the FastAPI lifespan hook. Idempotent and safe on every restart. No migration framework yet — acceptable for a weekend build, not for production (see [Known Limitations](#known-limitations)).

---

## Security

**XSS** — Markdown is rendered by TipTap/ProseMirror, which operates on a structured document model rather than raw HTML strings. No `dangerouslySetInnerHTML` on editor output. Search excerpts from the API contain `<mark>` tags only — rendered in a sanitized container. The backend's `core.sanitization` module strips disallowed HTML before any content reaches the database.

**Auth** — JWT tokens, secrets in environment variables, passwords hashed with bcrypt. No secrets are hardcoded anywhere.

**Input validation** — Pydantic validates all request bodies on the server. Slug format is enforced by regex (`^[a-z0-9]+(?:-[a-z0-9]+)*$`) on both client and server.

**SQL injection** — SQLAlchemy's ORM with parameterized queries throughout. No raw SQL strings.

---

## Frontend State Management

The editor state, WebSocket connection, and rendered preview are kept in sync through a clear separation of concerns:

- **Yjs `Y.Doc`** is the source of truth for document content. TipTap binds directly to it via the `Collaboration` extension — no intermediate React state for editor content.
- **The WebSocket provider** syncs the `Y.Doc` to the server and other clients. It lives outside React in a ref, so reconnections don't trigger re-renders.
- **Jotai atoms** hold UI state: loading flags, error messages, current user, sidebar state. Separate from editor content entirely.
- **The preview** is derived from TipTap's document state, not re-parsed from a string on every keystroke.

No string-based content state bounces between editor, WebSocket, and preview. The Yjs document is the single shared data structure. Everything else reads from it.

---

## Known Limitations

**Debounced flushes, not continuous saves.** The backend keeps the active `Y.Doc` in memory and flushes to Postgres after 5 seconds of room inactivity. If the server container crashes in that window, the most recent keystrokes rely on connected clients to re-sync their local state to the server on reconnection. Yjs's CRDT guarantees those edits won't be lost as long as at least one client stayed connected — but a clean crash with no clients will lose the unflushed delta.

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
