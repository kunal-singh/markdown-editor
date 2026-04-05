"""FastAPI application setup and WebSocket route definitions."""

from fastapi import FastAPI

from core.schemas import HealthResponse

app = FastAPI(title="Markdown Editor API")


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok")
