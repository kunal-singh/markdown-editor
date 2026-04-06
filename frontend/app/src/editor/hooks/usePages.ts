import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { toast } from "@markdown-editor/ui";
import {
  createPageApi,
  getPageApi,
  getPageBySlugApi,
  updatePageApi,
  getPageTreeApi,
} from "@markdown-editor/infra";
import { currentUserAtom } from "@/auth/state/authAtoms";
import {
  currentPageAtom,
  pageTreeAtom,
  pageLoadingAtom,
  pageErrorAtom,
  pageTreeFetchedAtom,
} from "@/editor/state/pageAtoms";
import {
  createPageUseCase,
  loadPageTreeUseCase,
  type PageDependencies,
} from "@/editor/useCases/pageUseCases";

export function usePages() {
  const [currentUser] = useAtom(currentUserAtom);
  const [, setCurrentPage] = useAtom(currentPageAtom);
  const [pageTree, setPageTree] = useAtom(pageTreeAtom);
  const [isLoading, setIsLoading] = useAtom(pageLoadingAtom);
  const [error, setError] = useAtom(pageErrorAtom);
  const [, setPageTreeFetched] = useAtom(pageTreeFetchedAtom);
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

  const loadPageTree = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await loadPageTreeUseCase(deps);
      setPageTreeFetched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load page tree");
    } finally {
      setIsLoading(false);
    }
  }, [deps, setIsLoading, setError, setPageTreeFetched]);

  const createPage = useCallback(
    async (title: string, slug: string, parentId?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await createPageUseCase(deps, title, slug, parentId);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to create page";
        setError(msg);
        toast.error("Failed to create page");
      } finally {
        setIsLoading(false);
      }
    },
    [deps, setIsLoading, setError],
  );

  return { createPage, loadPageTree, isLoading, error, pageTree };
}
