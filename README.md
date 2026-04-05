# Markdown Editor

Collaborative markdown editor with real-time sync. React frontend, FastAPI backend.

## Running it

### Production (Docker)

```bash
cp .env.example .env && docker compose up --build
```

Fill in `JWT_SECRET` before you start. The rest of the defaults are fine.

| Service  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost      |
| API      | http://localhost:8000 |
| Postgres | localhost:5432        |

### Development (HMR)

Run each in a separate terminal:

```bash
# 1. Postgres only
docker compose up db

# 2. API with hot reload  (from backend/)
make dev

# 3. Frontend with HMR  (from frontend/)
pnpm dev
```

| Service  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:5173      |
| API      | http://localhost:8000      |
| Postgres | localhost:5432             |

Vite proxies `/api/*` → `http://localhost:8000` so there are no CORS issues in dev.

## Environment

One `.env` at the repo root. Compose loads it automatically, no flags needed.

```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/markdown_editor
JWT_SECRET=                    # required
ALLOWED_ORIGINS=http://localhost

POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=markdown_editor
```

## Structure

```
.
├── frontend/        # React + Vite, served via nginx
├── backend/
│   ├── apps/api/            # FastAPI entry point
│   └── packages/
│       ├── core/            # schemas, auth, sanitization
│       ├── persistence/     # SQLAlchemy models and repository
│       └── collaboration/   # CRDT engine and WebSocket handlers
└── docker-compose.yml
```
