.PHONY: help install dev lint type format clean

help:
	@echo "Available commands:"
	@echo "  make install   - Install development dependencies"
	@echo "  make dev       - Start API with hot reload"
	@echo "  make lint      - Run ruff linter"
	@echo "  make type      - Run mypy type checker"
	@echo "  make format    - Format code with ruff"
	@echo "  make check     - Run lint + type checks"
	@echo "  make clean     - Remove build artifacts and cache"

install:
	uv sync --all-packages

dev:
	uv run uvicorn apps.api.main:app --reload --host 0.0.0.0 --port 8000

lint:
	uv run ruff check apps packages

type:
	uv run mypy -p apps.api -p core -p persistence -p collaboration

format:
	uv run ruff format apps packages

check: lint type

clean:
	rm -rf build dist *.egg-info
	fd -t d -H '__pycache__' --exec rm -rf {}
	fd -t d -H '\.mypy_cache' --exec rm -rf {}
	fd -t d -H '\.ruff_cache' --exec rm -rf {}
