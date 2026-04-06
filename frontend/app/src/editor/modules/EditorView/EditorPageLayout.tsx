import type { ReactNode } from "react";

interface EditorPageLayoutProps {
  titleInput: ReactNode;
  slugInput: ReactNode;
  parentSelector?: ReactNode;
  editor?: ReactNode;
  footer: ReactNode;
}

export function EditorPageLayout({
  titleInput,
  slugInput,
  parentSelector,
  editor,
  footer,
}: EditorPageLayoutProps) {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-start gap-4">
        <div className="flex flex-col gap-1 flex-1">
          {titleInput}
          {slugInput}
        </div>
        {parentSelector && <div className="shrink-0">{parentSelector}</div>}
      </div>
      <hr className="border-border" />
      {editor && <div className="min-h-0 flex-1">{editor}</div>}
      {footer}
    </div>
  );
}
