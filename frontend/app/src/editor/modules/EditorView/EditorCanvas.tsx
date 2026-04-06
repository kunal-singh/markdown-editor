import { RichEditor, AvatarStack } from "@markdown-editor/editor";
import type { CollabUser, CollaborationReady } from "@markdown-editor/editor";

interface EditorCanvasProps {
  editorState: CollaborationReady;
  currentUser: CollabUser;
}

export function EditorCanvas({ editorState, currentUser }: EditorCanvasProps) {
  const { doc, provider, connectedUsers } = editorState;

  return (
    <div className="flex flex-col gap-4 h-full">
      {connectedUsers.length > 0 && (
        <div className="flex justify-end">
          <AvatarStack users={connectedUsers} />
        </div>
      )}
      <div className="h-full rounded-lg border bg-background">
        <RichEditor
          doc={doc}
          provider={provider}
          currentUser={currentUser}
          fieldName="content"
          className="h-full"
        />
      </div>
    </div>
  );
}
