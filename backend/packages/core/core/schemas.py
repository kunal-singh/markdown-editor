from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class HealthResponse(BaseModel):
    status: str


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    display_name: str = Field(min_length=1, max_length=120)


class UserRead(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    email: EmailStr
    display_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class PageCreate(BaseModel):
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=200)
    title: str = Field(min_length=1, max_length=500)
    parent_id: uuid.UUID | None = None
    content_text: str | None = None


class PageRead(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    slug: str
    title: str
    parent_id: uuid.UUID | None
    content_text: str | None
    created_at: datetime
    updated_at: datetime


class PageUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=500)
    content_text: str | None = None
    parent_id: uuid.UUID | None = None


class PageSearchResult(BaseModel):
    title: str
    slug: str
    excerpt: str  # HTML with <mark> highlights from ts_headline
