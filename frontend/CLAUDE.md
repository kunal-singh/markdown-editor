# Frontend Architecture

This project follows a **clean layered architecture** derived from the LoA-Demo-Systems reference codebase. The goal: business logic is fully decoupled from React, components are thin, and every layer has a single responsibility.

---

## Layer Stack

```
┌──────────────────────────────────────────────┐
│  Components  (render only, call hooks)        │
├──────────────────────────────────────────────┤
│  Hooks       (dependency injection + state)   │
├──────────────────────────────────────────────┤
│  Use Cases   (business logic orchestration)   │
├──────────────────────────────────────────────┤
│  Infra       (API calls, external services)   │
├──────────────────────────────────────────────┤
│  Domain      (types, pure domain functions)   │
└──────────────────────────────────────────────┘
```

**Hard rules:**

- Components never import from infra or use cases directly — only hooks.
- Use cases never import from React — no hooks, no context, no atoms.
- Infra never contains business logic — one function, one HTTP call.

---

## Folder Layout (per feature module)

```
app/src/
└── <feature>/
    ├── state/
    │   └── <feature>Atoms.ts        # Jotai atoms (global state only)
    ├── hooks/
    │   ├── index.ts                  # Re-exports
    │   └── use<Feature>.ts           # DI hook: wires infra → use cases → atoms
    ├── useCases/
    │   ├── index.ts
    │   └── <feature>UseCases.ts      # Pure async functions
    └── modules/
        └── <sub-feature>/
            ├── <SubFeature>.tsx      # Component (≤150 lines)
            ├── hooks/
            │   └── use<SubFeature>.ts
            └── useCases/
                └── <subFeature>UseCases.ts
```

Shared workspace packages (add as the project grows):

- `packages/infra/` — all HTTP/API calls
- `packages/domain/` — TypeScript types + pure domain functions

---

## Use Cases

Use cases are **pure async functions**. They:

- Take a typed `Dependencies` object as the **first parameter** (explicit injection, no closures)
- Contain all business logic: validation, sequencing, error normalization
- Never import React, never touch Jotai atoms, never read from module scope
- Return domain types or throw `Error` with actionable messages

```ts
// useCases/editorUseCases.ts

export type SavePageDependencies = {
  savePage: (id: string, content: string) => Promise<void>;
  trackEvent: (name: string) => void;
};

export async function savePageUseCase(
  deps: SavePageDependencies,
  pageId: string,
  content: string,
): Promise<void> {
  if (!content.trim()) throw new Error("Cannot save empty page");
  await deps.savePage(pageId, content);
  deps.trackEvent("page_saved");
}
```

**Do not put orchestration logic in hooks.** If a function coordinates multiple async calls or contains conditional branching, it belongs in a use case.

---

## Hooks (Dependency Injection Layer)

Hooks are the **composition root**. Their only jobs:

1. Build a stable `Dependencies` object via `useMemo` — binding infra functions
2. Call use cases with that dependencies object
3. Manage loading/error state (Jotai atoms for shared state, `useState` for local)
4. Expose a clean, typed API to components

```ts
// hooks/useEditor.ts

export function useEditor() {
  const [isLoading, setIsLoading] = useAtom(editorLoadingAtom);
  const [error, setError] = useAtom(editorErrorAtom);

  const deps = useMemo(() => ({ savePage: infraSavePage, trackEvent: infraTrackEvent }), []);

  const save = useCallback(
    async (pageId: string, content: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await savePageUseCase(deps, pageId, content);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    },
    [deps, setIsLoading, setError],
  );

  return { save, isLoading, error };
}
```

**Rules:**

- Always `useMemo` for the `Dependencies` object — prevents use case re-creation on every render.
- No business logic in hooks. `if/else` inside a hook is a signal the logic belongs in a use case.
- Browser-side effects (creating `<a>` elements for downloads, clipboard access) are acceptable in hooks — they are presentation concerns, not business logic.

---

## State Management (Jotai)

Global state uses **Jotai atoms**. Local component state uses `useState`.

```ts
// state/editorAtoms.ts

export const currentPageAtom = atom<Page | null>(null);
export const editorLoadingAtom = atom(false);
export const editorErrorAtom = atom<string | null>(null);
export const isDirtyAtom = atom(false);
```

**Rules:**

- All atoms go in `state/<feature>Atoms.ts` — never co-locate atoms in hook files.
- Use `atomWithStorage` only for data that must survive page reload (e.g., auth user).
- An atom that is imported across module boundaries signals that state should move up to a shared `state/` at the feature level.

---

## Components

Components are **render-only**. They:

- Call hooks; never import infra, use cases, or atoms directly
- Map state to JSX
- Delegate all events to callbacks from hooks
- Stay under **150 lines** — split sub-views into child components when approaching this limit

When a component is growing large, split it into:

- A **container** (orchestrator): manages layout and composes sub-components
- **Leaf components**: a single focused view (table, dialog, form, panel)

Helper functions that derive display values (e.g., `getStatusColor(level)`) belong in a shared `utils/` or as a named export from `@markdown-editor/ui` — never copy-pasted across files.

---

## Anti-Patterns (do not repeat)

| Anti-pattern                                                 | Correct approach                                      |
| ------------------------------------------------------------ | ----------------------------------------------------- |
| Calling infra directly from a component                      | Wire infra through a hook                             |
| Business logic (`if`/`await` chains) inside a hook           | Move to a use case                                    |
| Duplicating a helper function across component files         | Extract to `shared/utils.ts` or `@markdown-editor/ui` |
| Defining atoms inside hook files                             | Put them in `state/<feature>Atoms.ts`                 |
| `Dependencies` object created inline on every call           | Wrap with `useMemo` in the hook                       |
| Components over 150 lines                                    | Split into container + leaf components                |
| Duplicating use case files per module with minor differences | Parameterize the behavior, share the use case         |

---

## Worked Example: Adding a Feature

**Scenario:** Implement "rename page" functionality.

1. **Infra** — add `renamePage(id, name): Promise<void>` in `packages/infra/`
2. **Domain** — add `Page` type update if needed in `packages/domain/`
3. **Use case** — create `renamePageUseCase(deps, pageId, newName)` in `pages/useCases/pageUseCases.ts`
4. **Hook** — add `rename` callback to `usePages` hook; bind infra function via `useMemo` deps object
5. **Component** — call `const { rename } = usePages()` and wire to an input/button; keep component under 150 lines

Never skip a layer. Never add a layer that isn't needed.
