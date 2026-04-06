import { useCollaboration, useLocalEditor } from "@markdown-editor/editor";
import type {
  CollabUser,
  LocalEditorResult,
  UseCollaborationResult,
} from "@markdown-editor/editor";

export type { LocalEditorResult };

export function useCollabEditor(
  pageId: string,
  currentUser: CollabUser,
  wsUrl: string,
): UseCollaborationResult {
  return useCollaboration({ wsUrl, roomName: pageId, currentUser });
}

export { useLocalEditor };
