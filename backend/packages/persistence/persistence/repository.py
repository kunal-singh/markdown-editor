from __future__ import annotations

import uuid

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.schemas import PageCreate, PageRead, PageSearchResult, PageTreeNode, PageUpdate, UserRead
from persistence.models import Page, User


class UserRepository:
    @staticmethod
    async def create(
        session: AsyncSession,
        *,
        email: str,
        display_name: str,
        hashed_password: str,
    ) -> UserRead:
        user = User(email=email, display_name=display_name, hashed_password=hashed_password)
        session.add(user)
        await session.flush()
        await session.refresh(user)
        await session.commit()
        return UserRead.model_validate(user)

    @staticmethod
    async def get_by_email(session: AsyncSession, email: str) -> UserRead | None:
        stmt = select(User).where(User.email == email)
        row = (await session.execute(stmt)).scalar_one_or_none()
        return UserRead.model_validate(row) if row is not None else None

    @staticmethod
    async def get_by_id(session: AsyncSession, user_id: uuid.UUID) -> UserRead | None:
        row = await session.get(User, user_id)
        return UserRead.model_validate(row) if row is not None else None

    @staticmethod
    async def get_raw_by_email(session: AsyncSession, email: str) -> User | None:
        """Returns the ORM User row including hashed_password for credential verification."""
        stmt = select(User).where(User.email == email)
        return (await session.execute(stmt)).scalar_one_or_none()


class PageRepository:
    @staticmethod
    async def create(session: AsyncSession, page_create: PageCreate) -> PageRead:
        page = Page(
            slug=page_create.slug,
            title=page_create.title,
            parent_id=page_create.parent_id,
            content_text=page_create.content_text,
        )
        session.add(page)
        await session.flush()
        await session.refresh(page)
        await session.commit()
        return PageRead.model_validate(page)

    @staticmethod
    async def get_by_slug(session: AsyncSession, slug: str) -> PageRead | None:
        stmt = select(Page).where(Page.slug == slug)
        row = (await session.execute(stmt)).scalar_one_or_none()
        return PageRead.model_validate(row) if row is not None else None

    @staticmethod
    async def get_by_id(session: AsyncSession, page_id: uuid.UUID) -> PageRead | None:
        row = await session.get(Page, page_id)
        return PageRead.model_validate(row) if row is not None else None

    @staticmethod
    async def get_children(session: AsyncSession, parent_id: uuid.UUID) -> list[PageRead]:
        stmt = select(Page).where(Page.parent_id == parent_id)
        rows = (await session.execute(stmt)).scalars().all()
        return [PageRead.model_validate(r) for r in rows]

    @staticmethod
    async def update(
        session: AsyncSession,
        page_id: uuid.UUID,
        update: PageUpdate,
    ) -> PageRead | None:
        page = await session.get(Page, page_id)
        if page is None:
            return None
        for field, value in update.model_dump(exclude_unset=True).items():
            setattr(page, field, value)
        await session.flush()
        await session.refresh(page)
        await session.commit()
        return PageRead.model_validate(page)

    @staticmethod
    async def get_all_shallow(session: AsyncSession) -> list[PageTreeNode]:
        """Fetch all pages (id, slug, title, parent_id only) for tree construction."""
        stmt = select(Page.id, Page.slug, Page.title, Page.parent_id)
        rows = (await session.execute(stmt)).all()

        nodes: dict[uuid.UUID, PageTreeNode] = {
            r.id: PageTreeNode(id=r.id, slug=r.slug, title=r.title) for r in rows
        }
        roots: list[PageTreeNode] = []
        for r in rows:
            if r.parent_id is not None and r.parent_id in nodes:
                nodes[r.parent_id].children.append(nodes[r.id])
            else:
                roots.append(nodes[r.id])
        return roots

    @staticmethod
    async def get_binary(session: AsyncSession, page_id: uuid.UUID) -> bytes | None:
        """Return the raw Yjs binary state for a page without mapping to a schema."""
        page = await session.get(Page, page_id)
        if page is None:
            return None
        return page.content_binary

    @staticmethod
    async def update_binary(session: AsyncSession, page_id: uuid.UUID, binary: bytes) -> None:
        page = await session.get(Page, page_id)
        if page is None:
            return
        page.content_binary = binary
        await session.commit()

    @staticmethod
    async def search(session: AsyncSession, query_str: str) -> list[PageSearchResult]:
        ts_query = func.websearch_to_tsquery("english", query_str)
        stmt = (
            select(
                Page.title,
                Page.slug,
                func.ts_headline(
                    "english",
                    Page.content_text,
                    ts_query,
                    "StartSel=<mark>, StopSel=</mark>, MaxWords=30",
                ).label("excerpt"),
            )
            .where(Page.search_vector.op("@@")(ts_query))
            .order_by(desc(func.ts_rank(Page.search_vector, ts_query)))
        )
        rows = (await session.execute(stmt)).all()
        return [PageSearchResult(title=r.title, slug=r.slug, excerpt=r.excerpt or "") for r in rows]
