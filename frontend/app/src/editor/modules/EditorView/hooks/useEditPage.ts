import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAtom, useSetAtom } from "jotai";
import { toast } from "@markdown-editor/ui";
import {
  createPageApi,
  getPageApi,
  getPageBySlugApi,
  updatePageApi,
  getPageTreeApi,
} from "@markdown-editor/infra";
import { currentUserAtom } from "@/auth/state/authAtoms";
import { currentPageAtom, pageTreeAtom } from "@/editor/state/pageAtoms";
import {
  loadPageBySlugUseCase,
  savePageMetaUseCase,
  type PageDependencies,
} from "@/editor/useCases/pageUseCases";

export function useEditPage() {
  const [currentUser] = useAtom(currentUserAtom);
  const [currentPage] = useAtom(currentPageAtom);
  // useSetAtom gives a stable setter reference — safe to include in useMemo deps
  const setCurrentPage = useSetAtom(currentPageAtom);
  const setPageTree = useSetAtom(pageTreeAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const navigate = useNavigate();

  const token = currentUser?.access_token ?? "";

  const deps = useMemo<PageDependencies>(
    () => ({
      createPage: createPageApi,
      getPage: getPageApi,
      getPageBySlug: getPageBySlugApi,
      updatePage: updatePageApi,
      getPageTree: getPageTreeApi,
      token,
      setCurrentPage,
      setPageTree,
      navigate: (path: string) => {
        void navigate(path);
      },
    }),
    [token, setCurrentPage, setPageTree, navigate],
  );

  const loadPage = useCallback(
    async (slug: string) => {
      setIsLoading(true);
      setError(null);
      setNotFound(false);
      setCurrentPage(null);
      try {
        await loadPageBySlugUseCase(deps, slug);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load page";
        if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
          setNotFound(true);
        } else {
          setError(msg);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [deps, setCurrentPage],
  );

  const saveMeta = useCallback(
    async (pageId: string, title: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await savePageMetaUseCase(deps, pageId, title);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to save page";
        setError(msg);
        toast.error("Failed to save page");
      } finally {
        setIsLoading(false);
      }
    },
    [deps],
  );

  return { loadPage, saveMeta, currentPage, isLoading, error, notFound };
}
