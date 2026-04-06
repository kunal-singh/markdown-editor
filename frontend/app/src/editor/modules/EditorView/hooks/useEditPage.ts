import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { createPageApi, getPageApi, updatePageApi, getPageTreeApi } from "@markdown-editor/infra";
import { currentUserAtom } from "@/auth/state/authAtoms";
import {
  currentPageAtom,
  pageTreeAtom,
  pageLoadingAtom,
  pageErrorAtom,
} from "@/editor/state/pageAtoms";
import {
  loadPageUseCase,
  savePageMetaUseCase,
  type PageDependencies,
} from "@/editor/useCases/pageUseCases";

export function useEditPage() {
  const [currentUser] = useAtom(currentUserAtom);
  const [currentPage, setCurrentPage] = useAtom(currentPageAtom);
  const [, setPageTree] = useAtom(pageTreeAtom);
  const [isLoading, setIsLoading] = useAtom(pageLoadingAtom);
  const [error, setError] = useAtom(pageErrorAtom);
  const navigate = useNavigate();

  const token = currentUser?.access_token ?? "";

  const deps = useMemo<PageDependencies>(
    () => ({
      createPage: createPageApi,
      getPage: getPageApi,
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
    async (pageId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await loadPageUseCase(deps, pageId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load page");
      } finally {
        setIsLoading(false);
      }
    },
    [deps, setIsLoading, setError],
  );

  const saveMeta = useCallback(
    async (pageId: string, title: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await savePageMetaUseCase(deps, pageId, title);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save page");
      } finally {
        setIsLoading(false);
      }
    },
    [deps, setIsLoading, setError],
  );

  return { loadPage, saveMeta, currentPage, isLoading, error };
}
