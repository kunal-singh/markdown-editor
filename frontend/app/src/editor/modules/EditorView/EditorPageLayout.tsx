import type { ReactNode } from "react";

interface EditorPageLayoutProps {
  titleInput: ReactNode;
  slugInput: ReactNode;
  editor: ReactNode;
  footer: ReactNode;
}

export function EditorPageLayout({ titleInput, slugInput, editor, footer }: EditorPageLayoutProps) {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-1">
        {titleInput}
        {slugInput}
      </div>
      <hr className="border-border" />
      <div className="min-h-0 flex-1">{editor}</div>
      {footer}
    </div>
  );
}
