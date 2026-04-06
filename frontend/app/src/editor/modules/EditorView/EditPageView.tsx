import { useMemo } from "react";
import { useAtom } from "jotai";
import { useParams } from "react-router-dom";
import { useCollaboration } from "@markdown-editor/editor";
import type { CollabUser } from "@markdown-editor/editor";
import { currentUserAtom } from "@/auth/state/authAtoms";
import { EditorCanvas } from "./EditorCanvas";

const PLACEHOLDER_USER: CollabUser = { id: "anon", name: "Anonymous", color: "#6366f1" };
const WS_URL: string =
  (import.meta.env.VITE_WS_URL as string | undefined) ?? "ws://localhost:8000/ws/collab";

export function EditPageView() {
  const { pageId } = useParams<{ pageId: string }>();
  const [authUser] = useAtom(currentUserAtom);

  const currentUser = useMemo(
    () =>
      authUser
        ? { id: authUser.user.id, name: authUser.user.display_name, color: "#6366f1" }
        : PLACEHOLDER_USER,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authUser?.user.id],
  );

  // Hook must be called unconditionally — guards below prevent rendering.
  const editorState = useCollaboration({
    wsUrl: WS_URL,
    roomName: pageId ?? "missing",
    currentUser,
  });

  if (!authUser || !pageId) return null;

  return <EditorCanvas editorState={editorState} currentUser={currentUser} title="Edit page" />;
}
