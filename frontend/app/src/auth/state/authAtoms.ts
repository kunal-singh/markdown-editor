import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import type { AuthUser } from "@markdown-editor/domain";

// Synchronous localStorage storage — reads the initial value immediately so
// PrivateRoute never sees a false null on hard refresh.
const syncStorage = createJSONStorage<AuthUser | null>(() => localStorage);

// Persisted to localStorage — survives page reload; long-lived JWT assumption
export const currentUserAtom = atomWithStorage<AuthUser | null>("auth_user", null, syncStorage, {
  getOnInit: true,
});

// Local loading/error atoms — kept here for future global access (e.g. error banner)
export const authLoadingAtom = atom(false);
export const authErrorAtom = atom<string | null>(null);
