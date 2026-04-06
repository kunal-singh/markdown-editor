"""Starlette WebSocket → ypy-websocket Websocket protocol adapter."""

from __future__ import annotations

import contextlib

from starlette.websockets import WebSocket, WebSocketDisconnect


class StarletteAdapter:
    """Adapts a Starlette WebSocket to the ypy-websocket Websocket protocol."""

    def __init__(self, ws: WebSocket) -> None:
        self._ws = ws

    @property
    def path(self) -> str:
        return self._ws.url.path

    def __aiter__(self) -> StarletteAdapter:
        return self

    async def __anext__(self) -> bytes:
        try:
            return await self._ws.receive_bytes()
        except WebSocketDisconnect:
            raise StopAsyncIteration from None

    async def send(self, message: bytes) -> None:
        # Silently drop sends on a closed connection — disconnect is signalled
        # to ypy-websocket via __anext__ raising StopAsyncIteration.
        with contextlib.suppress(RuntimeError, WebSocketDisconnect):
            await self._ws.send_bytes(message)

    async def recv(self) -> bytes:
        # Let WebSocketDisconnect propagate — ypy-websocket catches it via __anext__.
        return await self._ws.receive_bytes()
