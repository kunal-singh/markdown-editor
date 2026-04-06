# Frontend ↔ Backend Integration Guide

> For the frontend agent. Read this before touching any collaboration or page code.

---

## Base URLs

| Protocol | Base |
|----------|------|
| HTTP | `http://localhost:8000` |
| WebSocket | `ws://localhost:8000` |

Full OpenAPI spec: `GET http://localhost:8000/openapi.json`
Interactive docs: `http://localhost:8000/docs`

---

## Auth

All HTTP requests that mutate state require a Bearer token in the `Authorization` header.  
The WebSocket endpoint does **not** currently require auth (open room by page ID).

```
Authorization: Bearer <access_token>
```

Tokens are obtained from `POST /auth/login` or `POST /auth/signup`.

---

## Page APIs

### Create a page
```
POST /pages/
Content-Type: application/json

{
  "slug": "my-page",          // kebab-case, unique, required
  "title": "My Page",         // required
  "parent_id": null,          // optional UUID — for nested pages
  "content_text": null        // optional plain text — ignored once Yjs takes over
}
```
Returns `PageRead` (201). The `id` from the response is the **room ID** used for WebSocket.

### Get page by ID
```
GET /pages/{page_id}
```

### Get page by slug
```
GET /pages/by-slug/{slug}
```
Use this for URL-based routing (e.g. `/pages/my-page` in the app).

### Get children
```
GET /pages/{page_id}/children
```
Returns `PageRead[]`. Use for sidebar tree rendering.

### Update page metadata
```
PATCH /pages/{page_id}
Content-Type: application/json

{
  "title": "New Title",     // optional
  "parent_id": "uuid"       // optional — reparent
}
```
Do **not** send `content_text` here for editor content — that is managed by Yjs.

### Get full page tree
```
GET /pages/tree
```
Returns the entire page hierarchy in a single request. Use this to render the sidebar navigation tree.

Response shape (`PageTreeNode[]`):
```json
[
  {
    "id": "920bf55f-...",
    "slug": "my-page",
    "title": "My Page",
    "children": [
      {
        "id": "91b18de2-...",
        "slug": "my-child-page",
        "title": "Child Page",
        "children": []
      }
    ]
  }
]
```

- Root pages (no parent) are top-level items in the array.
- Nesting is unbounded — children can have children.
- No content fields are returned — this is a lightweight shape for tree rendering only.
- Fetch this once on app load and re-fetch after creating/reparenting a page.

### Search pages
```
GET /pages/search?q=your+query
```
Returns `PageSearchResult[]` — each has `title`, `slug`, `excerpt` (HTML string with `<mark>` highlights). Render `excerpt` with `dangerouslySetInnerHTML` inside a sanitised container.

---

## Collaboration — WebSocket + Yjs

### Libraries required

```bash
pnpm add yjs @hocuspocus/provider
# or if using TipTap:
pnpm add @tiptap/extension-collaboration @tiptap/extension-collaboration-cursor
```

The backend speaks the **y-websocket sync protocol** (same wire format as `y-websocket` npm package). Use `WebsocketProvider` from `y-websocket` or Hocuspocus — both are compatible.

### Connecting to a room

The room URL pattern is:
```
ws://localhost:8000/pages/{page_id}/ws
```

`page_id` is the UUID from `PageRead.id`. One room per page.

#### Using `y-websocket` WebsocketProvider

```ts
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

const ydoc = new Y.Doc()

const provider = new WebsocketProvider(
  'ws://localhost:8000',   // server base URL
  `pages/${pageId}/ws`,   // room name — becomes the WS path
  ydoc,
)

provider.on('status', ({ status }: { status: string }) => {
  console.log('connection status:', status) // 'connecting' | 'connected' | 'disconnected'
})
```

#### Using Hocuspocus

```ts
import { HocuspocusProvider } from '@hocuspocus/provider'
import * as Y from 'yjs'

const ydoc = new Y.Doc()

const provider = new HocuspocusProvider({
  url: `ws://localhost:8000/pages/${pageId}/ws`,
  name: pageId,
  document: ydoc,
})
```

### The shared text type

The backend stores editor content under the key `"content"` as a `Y.Text` type.  
**This key must match exactly** — the backend extracts plain text from `ydoc.getText("content")` when saving.

```ts
const ytext = ydoc.getText('content')
```

If you use TipTap, pass `ytext` to the `Collaboration` extension:

```ts
import Collaboration from '@tiptap/extension-collaboration'

const editor = useEditor({
  extensions: [
    // ...other extensions
    Collaboration.configure({ document: ydoc, field: 'content' }),
  ],
})
```

If you use a plain `contenteditable` or ProseMirror directly, bind `ytext` to your editor via `y-prosemirror` or `y-codemirror`.

### Collaborators / Awareness

The backend relays **awareness messages** automatically — clients see each other's cursor position, name, and colour in real time via the Yjs awareness protocol. No extra backend work is needed.

```ts
import { Awareness } from 'y-protocols/awareness'

// provider.awareness is already set up by WebsocketProvider / Hocuspocus
provider.awareness.setLocalStateField('user', {
  name: currentUser.display_name,
  color: '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16),
})

// Read all collaborators currently in the room
const collaborators = Array.from(provider.awareness.getStates().entries())
  .filter(([clientId]) => clientId !== ydoc.clientID)
  .map(([, state]) => state.user)
```

With TipTap + `CollaborationCursor`:

```ts
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'

CollaborationCursor.configure({
  provider,
  user: {
    name: currentUser.display_name,
    color: '#f783ac',
  },
})
```

### Connection lifecycle

```ts
// Disconnect when leaving the page
useEffect(() => {
  return () => provider.destroy()
}, [pageId])
```

Reconnection is handled automatically by `WebsocketProvider` / Hocuspocus with exponential backoff.

---

## Data flow summary

```
User types in editor
  → TipTap / ProseMirror applies change to local Y.Doc
  → WebsocketProvider encodes as Yjs binary update
  → sends over WS to ws://localhost:8000/pages/{id}/ws
  → backend YRoom receives update, merges into server Y.Doc
  → broadcasts merged update to all other connected clients
  → after 5 s of inactivity: backend flushes to Postgres
      content_binary  ← full Yjs state (for future re-hydration)
      content_text    ← plain text extracted from Y.Text("content")
                         (used for full-text search)

User opens a page that already has content
  → backend loads content_binary from Postgres into YRoom before
    any client can send updates (guaranteed by server-side lock)
  → client connects, receives full document state in sync step 2
  → local Y.Doc merges server state → editor shows saved content
```

---

## Key constraints to respect

- **Slug format**: `^[a-z0-9]+(?:-[a-z0-9]+)*$` — lowercase kebab-case only, max 200 chars. Enforce this in the "create page" UI before calling the API.
- **Slug is unique**: `409 Conflict` is returned if a slug already exists. Show a user-friendly error.
- **Do not write `content_text` via PATCH** for editor content — it will be overwritten by the next Yjs flush and will not update the Yjs state seen by collaborators.
- **Yjs text key is `"content"`** — do not change this without coordinating with the backend (`_TEXT_KEY` in `packages/collaboration/collaboration/engine.py`).
- **Room ID = page UUID** — always use `PageRead.id` (not slug) as the WebSocket room identifier.
