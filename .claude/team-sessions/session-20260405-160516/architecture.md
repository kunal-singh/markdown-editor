# Architecture: session-20260405-160516

**Status:** Done
**Created:** 2026-04-05T10:35:16.958Z

---

## High-Level Design (HLD)

### System Overview

This document covers the **auth + dashboard shell** feature for the markdown-editor frontend. It introduces two new workspace packages (`packages/infra`, `packages/domain`) and a new `auth` feature module inside the app.

**Scope:**
- Login and signup pages (email + password, JWT-based)
- A post-login dashboard shell with a persistent collapsible sidebar
- Nested routing: `/login`, `/signup`, `/dashboard/*` (pages, settings)
- JWT stored in `localStorage` via Jotai `atomWithStorage`; long-lived, no refresh needed

**Key external dependencies introduced:**
- `react-router-dom` v7 — nested routing + `<Outlet>` layout shell
- `react-hook-form` + `@hookform/resolvers` + `zod` — form state and validation
- shadcn components: `Input`, `Form`, `Sidebar` (added to `@markdown-editor/ui`)

**Interaction with backend:**
- `POST /api/auth/login` — returns `{ access_token: string }`
- `POST /api/auth/signup` — returns `{ access_token: string }`
- All subsequent requests carry `Authorization: Bearer <token>` header (set in infra layer)

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  frontend/                                                           │
│  ├── app/src/                                                        │
│  │   ├── router.tsx               React Router v7 root              │
│  │   ├── auth/                    Feature module                     │
│  │   │   ├── state/authAtoms.ts   currentUserAtom (atomWithStorage)  │
│  │   │   ├── hooks/useAuth.ts     DI hook → use cases                │
│  │   │   ├── useCases/authUseCases.ts  loginUseCase, signupUseCase   │
│  │   │   └── modules/                                                │
│  │   │       ├── LoginPage/       LoginPage.tsx + useLoginPage.ts    │
│  │   │       └── SignupPage/      SignupPage.tsx + useSignupPage.ts  │
│  │   └── dashboard/              Feature module                      │
│  │       └── modules/                                                │
│  │           ├── DashboardShell/  Layout + Sidebar                   │
│  │           ├── PagesView/       Placeholder                        │
│  │           └── SettingsView/    Placeholder                        │
│  │                                                                   │
│  └── packages/                                                       │
│      ├── ui/          @markdown-editor/ui                            │
│      │   └── (adds Input, Form, Sidebar components)                  │
│      ├── domain/      @markdown-editor/domain  ← NEW                 │
│      │   └── src/auth.ts   AuthUser, LoginCredentials, SignupCredentials │
│      └── infra/       @markdown-editor/infra   ← NEW                │
│          └── src/auth.ts   loginApi(), signupApi()                   │
└─────────────────────────────────────────────────────────────────────┘

Public routes:  /login  /signup
Private routes: /dashboard → DashboardShell (<Outlet>)
                  /dashboard/pages   → PagesView
                  /dashboard/settings → SettingsView
```

### Data Flow

**Login flow:**
```
User types email+password
  → LoginPage (RHF form, zod schema)
  → useLoginPage.save() callback
  → useAuth.login(credentials)          [hook builds deps object]
  → loginUseCase(deps, credentials)     [validates, calls infra]
  → loginApi(credentials)               [POST /api/auth/login]
  ← { access_token }
  → loginUseCase sets currentUserAtom   [via deps.setCurrentUser]
  → router.navigate("/dashboard/pages") [via deps.navigate]
```

**Authenticated request flow (future pages):**
```
Any infra function
  → reads token from localStorage (via getToken() helper in infra)
  → sets Authorization: Bearer <token> header on every fetch
```

**Route guard flow:**
```
User navigates to /dashboard/*
  → PrivateRoute reads currentUserAtom
  → if null → redirect to /login
  → if set  → render DashboardShell with <Outlet>
```

**Logout flow:**
```
User clicks Logout in sidebar
  → useAuth.logout()
  → clears currentUserAtom (sets to null → localStorage cleared)
  → router.navigate("/login")
```

## Low-Level Design (LLD)

---

### Component: `@markdown-editor/domain`
**Path:** `frontend/packages/domain/src/auth.ts`

**Responsibility:** Zod schemas and inferred TypeScript types for auth domain objects. No React, no side effects.

**Interfaces:**
```ts
// Zod schemas
export const loginCredentialsSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signupCredentialsSchema = loginCredentialsSchema; // same shape

export const authUserSchema = z.object({
  email: z.string().email(),
  access_token: z.string(),
});

// Inferred types
export type LoginCredentials = z.infer<typeof loginCredentialsSchema>;
export type SignupCredentials = z.infer<typeof signupCredentialsSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
```

**Key decisions:**
- `SignupCredentials` is the same shape as `LoginCredentials` for now (email + password only)
- `AuthUser` includes `email` so the sidebar can display who is logged in
- Password min-length 8 enforced in domain schema (not just UI)

---

### Component: `@markdown-editor/infra` — auth
**Path:** `frontend/packages/infra/src/auth.ts`

**Responsibility:** One function per HTTP call. No business logic, no error transformation beyond re-throwing.

**Interfaces:**
```ts
export async function loginApi(credentials: LoginCredentials): Promise<AuthUser>
export async function signupApi(credentials: SignupCredentials): Promise<AuthUser>
```

**Key decisions:**
- Uses native `fetch` with relative URL `/api/auth/login` (Vite proxy handles base URL)
- Throws `Error` with the server's error message on non-2xx responses
- No token injection here — token is not yet set at call time during login/signup
- Returns `AuthUser` parsed/validated with `authUserSchema.parse()` — fails fast if backend shape changes

---

### Component: `auth/useCases/authUseCases.ts`
**Path:** `frontend/app/src/auth/useCases/authUseCases.ts`

**Responsibility:** Business logic orchestration for auth. Pure async functions with explicit `Dependencies`.

**Interfaces:**
```ts
export type AuthDependencies = {
  loginApi: (c: LoginCredentials) => Promise<AuthUser>;
  signupApi: (c: SignupCredentials) => Promise<AuthUser>;
  setCurrentUser: (user: AuthUser | null) => void;
  navigate: (path: string) => void;
};

export async function loginUseCase(deps: AuthDependencies, credentials: LoginCredentials): Promise<void>
export async function signupUseCase(deps: AuthDependencies, credentials: SignupCredentials): Promise<void>
export function logoutUseCase(deps: Pick<AuthDependencies, "setCurrentUser" | "navigate">): void
```

**Key decisions:**
- Both `loginUseCase` and `signupUseCase` call `deps.setCurrentUser(user)` then `deps.navigate("/dashboard/pages")`
- `logoutUseCase` is synchronous — sets user to `null`, navigates to `/login`
- No validation here — RHF+Zod handles that at the form layer before use cases are called

---

### Component: `auth/hooks/useAuth.ts`
**Path:** `frontend/app/src/auth/hooks/useAuth.ts`

**Responsibility:** Composition root for auth. Builds `AuthDependencies` via `useMemo`, calls use cases, manages loading/error atoms.

**Interfaces:**
```ts
export function useAuth(): {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => void;
  currentUser: AuthUser | null;
  isLoading: boolean;
  error: string | null;
}
```

**Key decisions:**
- `currentUserAtom` is `atomWithStorage<AuthUser | null>("auth_user", null)` — persists to localStorage
- `deps` object built with `useMemo([], [])` — stable reference, binds `loginApi`, `signupApi`, `setCurrentUser`, `navigate`
- `navigate` comes from `useNavigate()` (React Router v7); included in `useMemo` deps
- Loading/error state uses local `useState` (not atoms) — not shared across components

---

### Component: `auth/state/authAtoms.ts`
**Path:** `frontend/app/src/auth/state/authAtoms.ts`

**Interfaces:**
```ts
export const currentUserAtom = atomWithStorage<AuthUser | null>("auth_user", null);
export const authLoadingAtom = atom(false);
export const authErrorAtom = atom<string | null>(null);
```

**Key decisions:**
- `atomWithStorage` key is `"auth_user"` — stored in `localStorage`
- Loading and error atoms are defined here even though `useAuth` uses `useState` for them locally — kept here for future shared access (e.g. a global error banner)

---

### Component: `LoginPage` module
**Path:** `frontend/app/src/auth/modules/LoginPage/LoginPage.tsx`

**Responsibility:** Render-only form. Delegates all logic to `useLoginPage`.

**Interfaces:**
- Uses `useLoginPage()` hook from `./hooks/useLoginPage.ts`
- RHF form wired to `loginCredentialsSchema` via `zodResolver`
- shadcn `<Form>`, `<Input>`, `<Button>` from `@markdown-editor/ui`
- Link to `/signup`
- ≤150 lines

**Sub-hook:** `useLoginPage.ts`
```ts
export function useLoginPage(): {
  form: UseFormReturn<LoginCredentials>;
  onSubmit: (data: LoginCredentials) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}
```
- Calls `useAuth().login` on submit
- `form` created with `useForm({ resolver: zodResolver(loginCredentialsSchema) })`

---

### Component: `SignupPage` module
**Path:** `frontend/app/src/auth/modules/SignupPage/SignupPage.tsx`

**Responsibility:** Identical pattern to LoginPage but calls `useAuth().signup`. Link to `/login`.

---

### Component: `PrivateRoute`
**Path:** `frontend/app/src/router.tsx` (inline component or small helper)

**Responsibility:** Reads `currentUserAtom`; redirects to `/login` if null; renders `<Outlet>` if authenticated.

```ts
function PrivateRoute() {
  const [currentUser] = useAtom(currentUserAtom);
  if (!currentUser) return <Navigate to="/login" replace />;
  return <Outlet />;
}
```

---

### Component: `DashboardShell`
**Path:** `frontend/app/src/dashboard/modules/DashboardShell/DashboardShell.tsx`

**Responsibility:** Layout shell — renders shadcn `<Sidebar>` + `<Outlet>` for child routes. ≤150 lines.

**Sidebar nav items:**
- Pages → `/dashboard/pages`
- Settings → `/dashboard/settings`
- Logout button at bottom → calls `useAuth().logout()`

**Key decisions:**
- shadcn `Sidebar` component used directly from `@markdown-editor/ui`
- No sub-hook needed — sidebar nav is static; logout calls `useAuth()` directly
- `PagesView` and `SettingsView` are placeholder components (empty shells) at this stage

---

### Component: `router.tsx`
**Path:** `frontend/app/src/router.tsx`

**Responsibility:** Single source of truth for all routes.

```
/                  → redirect to /login
/login             → LoginPage
/signup            → SignupPage
/dashboard         → PrivateRoute → DashboardShell
  /dashboard/pages     → PagesView
  /dashboard/settings  → SettingsView
```

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Routing | React Router v7 | Industry standard; nested routes + `<Outlet>` layout shell pattern; data loaders available for future use |
| Form management | react-hook-form + zod | RHF for uncontrolled form state (minimal re-renders); Zod for schema-first validation with TypeScript inference; shadcn Form wraps both |
| Token storage | localStorage via `atomWithStorage` | Long-lived JWT; survives page reload; Jotai atom keeps the rest of the app reactive without prop drilling |
| API base URL | Vite proxy `/api` → `http://localhost:8000` | Already configured in `vite.config.ts`; infra functions use relative paths (`/api/auth/login`) — no env var needed in dev |
| shadcn components added | `Input`, `Form`, `Sidebar` | Added to `@markdown-editor/ui` via `pnpm component <name>`; re-exported from `packages/ui/src/index.ts` |
| Domain types | Zod schemas in `@markdown-editor/domain` | Single source of truth for types; infer TypeScript types from Zod schemas; shared between infra and use cases |
| New workspace packages | `packages/infra`, `packages/domain` | Aligns with architecture spec in `frontend/CLAUDE.md`; infra = one function per HTTP call; domain = pure types + validators |

## Infrastructure

**Dev setup (no changes needed):**
- Vite dev server at `http://localhost:5173`
- Vite proxy: `/api/*` → `http://localhost:8000` (already configured in `frontend/app/vite.config.ts`)
- Backend FastAPI at `http://localhost:8000` (Docker Compose via `backend/Makefile`)

**New workspace packages bootstrap:**
```
frontend/packages/domain/   package.json name: @markdown-editor/domain
frontend/packages/infra/    package.json name: @markdown-editor/infra
```
Both follow the same pattern as `@markdown-editor/ui`:
- `type: "module"`, `exports: { ".": "./src/index.ts" }`
- `tsconfig.json` extending `@kunal-singh/typescript-config/react`
- Listed in `frontend/pnpm-workspace.yaml` (or auto-discovered via `packages/*`)

**shadcn components to install (run from `frontend/packages/ui/`):**
```bash
pnpm component input
pnpm component form
pnpm component sidebar
```
Then add to `packages/ui/src/index.ts`:
```ts
export * from "./components/ui/input";
export * from "./components/ui/form";
export * from "./components/ui/sidebar";
```

**New app dependencies (install from `frontend/`):**
```bash
pnpm --filter @markdown-editor/app add react-router-dom
pnpm --filter @markdown-editor/app add react-hook-form @hookform/resolvers zod
pnpm --filter @markdown-editor/domain add zod
pnpm --filter @markdown-editor/infra add zod
```

## Security Considerations

| Concern | Decision |
|---------|----------|
| Token storage | `localStorage` — acceptable for a personal/internal tool; token is long-lived so no refresh complexity. XSS risk is mitigated by React's default HTML escaping and absence of `dangerouslySetInnerHTML`. |
| Token transmission | `Authorization: Bearer <token>` header on every API call — never in URL query params |
| Password handling | Password never stored or logged on frontend; transmitted only over HTTPS in production. Backend handles hashing via `core.security`. |
| Route protection | `PrivateRoute` component checks `currentUserAtom` before rendering any dashboard content; unauthenticated users are hard-redirected to `/login` |
| Form validation | Zod schema validates email format and password min-length 8 client-side. Backend must also validate independently (not frontend's concern). |
| Token expiry | Long-lived token assumed — no refresh implemented. If a 401 is received from any infra call, the infra layer should clear `currentUserAtom` and redirect to `/login` (future hardening). |

---

## Implementation Plan

> All commands run from `frontend/` unless noted. After every task: `pnpm lint && pnpm format` (zero-warnings policy). Functions ≤100 lines, complexity ≤8, 100-char line limit.

---

### Task 0 — Install shadcn components into `@markdown-editor/ui`

**Files:** `frontend/packages/ui/src/index.ts`, `frontend/packages/ui/src/components/ui/input.tsx`, `form.tsx`, `sidebar.tsx`

**Steps:**
```bash
cd frontend/packages/ui
pnpm component input
pnpm component form
pnpm component sidebar
```

Add to `frontend/packages/ui/src/index.ts`:
```ts
export * from "./components/ui/input";
export * from "./components/ui/form";
export * from "./components/ui/sidebar";
```

**Acceptance:** `pnpm typecheck` passes in `packages/ui/`.

---

### Task 1 — Scaffold `@markdown-editor/domain` package

**Files to create:**
- `frontend/packages/domain/package.json` — name: `@markdown-editor/domain`, type: module, exports `"./": "./src/index.ts"`
- `frontend/packages/domain/tsconfig.json` — extend `@kunal-singh/typescript-config/react`
- `frontend/packages/domain/src/auth.ts` — `loginCredentialsSchema`, `signupCredentialsSchema`, `authUserSchema`, inferred types
- `frontend/packages/domain/src/index.ts` — re-export everything from `./auth`

**Install:** `pnpm --filter @markdown-editor/domain add zod`

**Acceptance:** `pnpm typecheck` passes. `LoginCredentials`, `SignupCredentials`, `AuthUser` are importable.

---

### Task 2 — Scaffold `@markdown-editor/infra` package

**Files to create:**
- `frontend/packages/infra/package.json` — name: `@markdown-editor/infra`
- `frontend/packages/infra/tsconfig.json`
- `frontend/packages/infra/src/auth.ts` — `loginApi()`, `signupApi()`
- `frontend/packages/infra/src/index.ts`

**Install:** `pnpm --filter @markdown-editor/infra add zod` + `pnpm --filter @markdown-editor/infra add --save-peer @markdown-editor/domain`

**Acceptance:** Functions compile. Each function is ≤30 lines. `pnpm typecheck` passes.

---

### Task 3 — Install app dependencies

```bash
pnpm --filter @markdown-editor/app add react-router-dom
pnpm --filter @markdown-editor/app add react-hook-form @hookform/resolvers zod
pnpm --filter @markdown-editor/app add jotai
pnpm --filter @markdown-editor/app add @markdown-editor/domain @markdown-editor/infra
```

**Acceptance:** `pnpm typecheck` passes in `app/`.

---

### Task 4 — Create `auth/state/authAtoms.ts`

**File:** `frontend/app/src/auth/state/authAtoms.ts`

**Exports:** `currentUserAtom` (atomWithStorage), `authLoadingAtom`, `authErrorAtom`

**Acceptance:** No direct imports of atoms outside `auth/` feature folder yet.

---

### Task 5 — Create `auth/useCases/authUseCases.ts`

**File:** `frontend/app/src/auth/useCases/authUseCases.ts`

**Exports:** `AuthDependencies` type, `loginUseCase`, `signupUseCase`, `logoutUseCase`

**Acceptance:** Pure functions, no React imports. `pnpm typecheck` passes.

---

### Task 6 — Create `auth/hooks/useAuth.ts`

**File:** `frontend/app/src/auth/hooks/useAuth.ts`

**Exports:** `useAuth()`

**Key:** `deps` built with `useMemo`. `navigate` from `useNavigate()`. Calls use cases from Task 5.

Also create `frontend/app/src/auth/hooks/index.ts` re-exporting `useAuth`.

**Acceptance:** Hook compiles. No business logic (no `if/else` branching — all in use cases).

---

### Task 7 — Create `LoginPage` module

**Files:**
- `frontend/app/src/auth/modules/LoginPage/hooks/useLoginPage.ts`
- `frontend/app/src/auth/modules/LoginPage/LoginPage.tsx` — ≤150 lines

**Uses:** `useAuth`, RHF, `zodResolver(loginCredentialsSchema)`, shadcn `Form`/`Input`/`Button` from `@markdown-editor/ui`

**Acceptance:** Form renders, validation errors show inline, submit calls `useAuth().login`.

---

### Task 8 — Create `SignupPage` module

**Files:**
- `frontend/app/src/auth/modules/SignupPage/hooks/useSignupPage.ts`
- `frontend/app/src/auth/modules/SignupPage/SignupPage.tsx` — ≤150 lines

**Acceptance:** Same as Task 7 but calls `useAuth().signup`.

---

### Task 9 — Create `DashboardShell` + placeholder views

**Files:**
- `frontend/app/src/dashboard/modules/DashboardShell/DashboardShell.tsx` — ≤150 lines
- `frontend/app/src/dashboard/modules/PagesView/PagesView.tsx` — placeholder `<div>Pages</div>`
- `frontend/app/src/dashboard/modules/SettingsView/SettingsView.tsx` — placeholder `<div>Settings</div>`

**Sidebar nav:** Pages → `/dashboard/pages`, Settings → `/dashboard/settings`, Logout button → `useAuth().logout()`

**Acceptance:** Sidebar renders, `<Outlet>` renders child route, logout clears token and redirects.

---

### Task 10 — Create `router.tsx` and wire `App.tsx`

**Files:**
- `frontend/app/src/router.tsx` — `createBrowserRouter` with all routes + `PrivateRoute`
- `frontend/app/src/App.tsx` — replace boilerplate with `<RouterProvider router={router} />`
- `frontend/app/src/main.tsx` — no changes needed

**Route table:**
```
/              → <Navigate to="/login" />
/login         → LoginPage
/signup        → SignupPage
/dashboard     → PrivateRoute → DashboardShell
  /dashboard/pages    → PagesView
  /dashboard/settings → SettingsView
```

**Acceptance:** Full E2E flow works: visit `/`, redirect to `/login`, login, land on `/dashboard/pages` with sidebar.

---

### Task 11 — Final lint + typecheck pass

```bash
cd frontend
pnpm lint && pnpm format && pnpm typecheck
```

Fix all warnings and errors before committing. Zero-warnings policy applies.

---

## FAQs

<!-- Agents will append Q&A here during review. -->
