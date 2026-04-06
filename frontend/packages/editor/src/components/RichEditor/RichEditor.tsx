import { useEditor, EditorContent } from "@tiptap/react";
import { useEffect } from "react";
import type * as Y from "yjs";
import type { WebsocketProvider } from "y-websocket";
import { buildExtensions } from "../../lib/extensions";
import { EditorToolbar } from "./EditorToolbar";
import type { CollabUser } from "../../types/editor";

export interface RichEditorProps {
  doc: Y.Doc;
  // null in local (new-page) mode — skips CollaborationCursor and awareness.
  provider: WebsocketProvider | null;
  currentUser: CollabUser;
  fieldName?: string;
  className?: string;
  readOnly?: boolean;
  showToolbar?: boolean;
  onReady?: () => void;
}

export function RichEditor({
  doc,
  provider,
  currentUser,
  fieldName = "default",
  className,
  readOnly = false,
  showToolbar = true,
  onReady,
}: RichEditorProps) {
  const editor = useEditor({
    extensions: buildExtensions(doc, provider, currentUser, fieldName),
    editable: !readOnly,
  });

  useEffect(() => {
    if (editor && onReady) onReady();
  }, [editor, onReady]);

  useEffect(() => {
    if (editor) editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  return (
    <div className={`flex h-full flex-col ${className ?? ""}`}>
      {showToolbar && editor && <EditorToolbar editor={editor} />}
      <EditorContent
        editor={editor}
        className="tiptap-content-fill flex-1 overflow-y-auto prose prose-sm max-w-none focus:outline-none"
      />
    </div>
  );
}
