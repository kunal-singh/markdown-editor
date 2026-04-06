import { atom } from "jotai";
import type { PageRead, PageTreeNode } from "@markdown-editor/domain";

export const currentPageAtom = atom<PageRead | null>(null);
export const pageTreeAtom = atom<PageTreeNode[]>([]);
export const pageLoadingAtom = atom(false);
export const pageErrorAtom = atom<string | null>(null);
