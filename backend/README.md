# Markdown Editor Backend

A modern Python monorepo using hatchling, mypy (strict), and ruff for linting/formatting.

## Project Structure

```
.
├── app/              # Main application code
├── packages/         # Shared packages
├── venv/             # Virtual environment (created locally)
├── pyproject.toml    # Project configuration (build, mypy, ruff)
└── Makefile          # Development shortcuts
```

## Setup

### Initial Setup

```bash
source venv/bin/activate
pip install -e .
```

### Development

```bash
# Type checking (strict mypy)
make type

# Linting (strict ruff)
make lint

# Format code
make format

# Check everything
make check

# Clean build artifacts
make clean
```

## Configuration

All tool configuration is centralized in `pyproject.toml`:

- **mypy**: Strict mode with max complexity 8
- **ruff**: Line length 100, McCabe complexity 8, max 5 args per function
- **Build**: hatchling with both app and packages included

## Adding Packages

Create new packages under `packages/`:

```
packages/
├── my_package/
│   ├── __init__.py
│   └── module.py
```

They'll inherit all linting/type-checking rules automatically.
