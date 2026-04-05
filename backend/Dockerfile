FROM python:3.11-slim

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy workspace manifests and lockfile first for layer caching
COPY pyproject.toml uv.lock ./
COPY packages/core/pyproject.toml packages/core/pyproject.toml
COPY packages/persistence/pyproject.toml packages/persistence/pyproject.toml
COPY packages/collaboration/pyproject.toml packages/collaboration/pyproject.toml
COPY apps/api/pyproject.toml apps/api/pyproject.toml

# Copy source
COPY packages/ packages/
COPY apps/ apps/

# Install all workspace packages
RUN uv sync --frozen --no-dev --all-packages

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "apps.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
