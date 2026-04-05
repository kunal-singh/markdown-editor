"""Pydantic models for data validation."""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
