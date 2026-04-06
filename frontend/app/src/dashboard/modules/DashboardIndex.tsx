import { Navigate } from "react-router-dom";
import { useAtom } from "jotai";
import { pageTreeAtom, pageTreeFetchedAtom } from "@/editor/state/pageAtoms";

export function DashboardIndex() {
  const [pageTree] = useAtom(pageTreeAtom);
  const [fetched] = useAtom(pageTreeFetchedAtom);

  if (!fetched) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  const firstSlug = pageTree[0]?.slug;
  if (firstSlug) {
    return <Navigate to={`/dashboard/pages/${firstSlug}`} replace />;
  }

  return <Navigate to="/dashboard/pages/new" replace />;
}
