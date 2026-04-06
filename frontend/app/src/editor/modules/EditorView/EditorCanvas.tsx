import { RichEditor, AvatarStack } from "@markdown-editor/editor";
import type {
  CollabUser,
  LocalEditorResult,
  UseCollaborationResult,
} from "@markdown-editor/editor";

interface EditorCanvasProps {
  editorState: UseCollaborationResult | LocalEditorResult;
  currentUser: CollabUser;
  title: string;
}

export function EditorCanvas({ editorState, currentUser, title }: EditorCanvasProps) {
  const { doc, provider, connectedUsers } = editorState;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{title}</h1>
        {connectedUsers.length > 0 && <AvatarStack users={connectedUsers} />}
      </div>
      <div className="rounded-lg border bg-background">
        <RichEditor doc={doc} provider={provider} currentUser={currentUser} />
      </div>
    </div>
  );
}
