import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { AuthUser } from "@markdown-editor/domain";

// Persisted to localStorage — survives page reload; long-lived JWT assumption
export const currentUserAtom = atomWithStorage<AuthUser | null>("auth_user", null);

// Local loading/error atoms — kept here for future global access (e.g. error banner)
export const authLoadingAtom = atom(false);
export const authErrorAtom = atom<string | null>(null);
