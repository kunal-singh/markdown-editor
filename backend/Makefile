.PHONY: help install lint type format clean

help:
	@echo "Available commands:"
	@echo "  make install   - Install development dependencies"
	@echo "  make lint      - Run ruff linter"
	@echo "  make type      - Run mypy type checker"
	@echo "  make format    - Format code with ruff"
	@echo "  make check     - Run lint + type checks"
	@echo "  make clean     - Remove build artifacts and cache"

install:
	source venv/bin/activate && pip install -e .

lint:
	source venv/bin/activate && ruff check apps packages

type:
	source venv/bin/activate && python -m mypy -p apps.api -p core -p persistence -p collaboration

format:
	source venv/bin/activate && ruff format apps packages

check: lint type

clean:
	rm -rf build dist *.egg-info
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type d -name .mypy_cache -exec rm -rf {} +
	find . -type d -name .ruff_cache -exec rm -rf {} +
