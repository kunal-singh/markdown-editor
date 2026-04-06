import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { searchPagesApi } from "@markdown-editor/infra";
import type { PageSearchResult } from "@markdown-editor/domain";
import { currentUserAtom } from "@/auth/state/authAtoms";

export function usePageSearch() {
  const [authUser] = useAtom(currentUserAtom);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PageSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const token = authUser?.access_token ?? "";

  useEffect(() => {
    if (!query.trim()) {
      const timer = setTimeout(() => {
        setResults([]);
      }, 0);
      return () => {
        clearTimeout(timer);
      };
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      void searchPagesApi(query, token)
        .then(setResults)
        .catch(() => {
          setResults([]);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [query, token]);

  return { query, setQuery, results, isSearching };
}
