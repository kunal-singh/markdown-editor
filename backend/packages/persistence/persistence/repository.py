from __future__ import annotations

import uuid
from datetime import UTC, datetime

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
            created_by_id=page_create.created_by_id,
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
        edited_by_id: uuid.UUID | None = None,
    ) -> PageRead | None:
        page = await session.get(Page, page_id)
        if page is None:
            return None
        for field, value in update.model_dump(exclude_unset=True).items():
            setattr(page, field, value)
        if edited_by_id is not None:
            page.last_edited_by_id = edited_by_id
            page.last_edited_at = datetime.now(UTC).replace(tzinfo=None)
        await session.flush()
        await session.refresh(page)
        await session.commit()
        return PageRead.model_validate(page)

    @staticmethod
    async def delete(session: AsyncSession, page_id: uuid.UUID) -> bool:
        """Delete a page and all its descendants (cascade). Returns False if not found."""
        page = await session.get(Page, page_id)
        if page is None:
            return False
        await session.delete(page)
        await session.commit()
        return True

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
    async def would_create_cycle(
        session: AsyncSession, page_id: uuid.UUID, proposed_parent_id: uuid.UUID
    ) -> bool:
        """Return True if setting parent_id would create an ancestor cycle.

        Walks up the ancestor chain from proposed_parent_id. If page_id is
        encountered before reaching a root, the assignment is cyclic.
        """
        visited: set[uuid.UUID] = set()
        current_id: uuid.UUID | None = proposed_parent_id
        while current_id is not None:
            if current_id == page_id:
                return True
            if current_id in visited:
                # Existing cycle in data — treat as cycle to be safe.
                return True
            visited.add(current_id)
            row = await session.get(Page, current_id)
            current_id = row.parent_id if row is not None else None
        return False

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
        # Append :* to the last token so partial words match (e.g. "seco" → "second").
        # websearch_to_tsquery is used first to safely tokenise, then the result is
        # cast to text, the trailing quote is replaced with :*', and re-cast to tsquery.
        # Simpler approach: build the prefix query directly via to_tsquery.
        safe = query_str.strip().split()
        prefix_query = " & ".join(f"{t}:*" for t in safe if t)
        ts_query = func.to_tsquery("english", prefix_query)
        stmt = (
            select(
                Page.title,
                Page.slug,
                func.ts_headline(
                    "english",
                    func.coalesce(Page.content_text, ""),
                    ts_query,
                    "StartSel=<mark>, StopSel=</mark>, MaxWords=30",
                ).label("excerpt"),
            )
            .where(Page.search_vector.op("@@")(ts_query))
            .order_by(desc(func.ts_rank(Page.search_vector, ts_query)))
        )
        rows = (await session.execute(stmt)).all()
        return [PageSearchResult(title=r.title, slug=r.slug, excerpt=r.excerpt or "") for r in rows]
