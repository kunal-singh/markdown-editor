import { useCollaboration, useLocalEditor } from "@markdown-editor/editor";
import type { CollabUser, CollaborationState, LocalEditorResult } from "@markdown-editor/editor";

export type { LocalEditorResult };

export function useCollabEditor(
  pageId: string,
  currentUser: CollabUser,
  wsUrl: string,
): CollaborationState {
  return useCollaboration({ wsUrl, roomName: pageId, currentUser });
}

export { useLocalEditor };
