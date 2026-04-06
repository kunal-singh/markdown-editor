import { useLocation } from "react-router-dom";

export function NotFoundView() {
  const { pathname } = useLocation();

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
      <p className="text-4xl font-semibold">404</p>
      <p className="text-lg font-medium">Page not found</p>
      <p className="text-sm text-muted-foreground">
        Nothing exists at <code className="font-mono">{pathname}</code>
      </p>
    </div>
  );
}
