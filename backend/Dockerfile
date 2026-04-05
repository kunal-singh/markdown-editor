FROM python:3.11-slim

WORKDIR /app

# Install uv for fast dependency resolution
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy package manifests first for layer caching
COPY packages/core/pyproject.toml packages/core/pyproject.toml
COPY packages/persistence/pyproject.toml packages/persistence/pyproject.toml
COPY packages/collaboration/pyproject.toml packages/collaboration/pyproject.toml
COPY apps/api/pyproject.toml apps/api/pyproject.toml

# Copy source
COPY packages/ packages/
COPY apps/ apps/

# Install all packages
RUN uv pip install --system \
    -e packages/core \
    -e packages/persistence \
    -e packages/collaboration \
    -e apps/api

EXPOSE 8000

CMD ["uvicorn", "apps.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
