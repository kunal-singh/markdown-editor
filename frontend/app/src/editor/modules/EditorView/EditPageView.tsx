import { useMemo } from "react";
import { useAtom } from "jotai";
import { useParams } from "react-router-dom";
import { useCollaboration } from "@markdown-editor/editor";
import type { CollabUser } from "@markdown-editor/editor";
import { currentUserAtom } from "@/auth/state/authAtoms";
import { EditorPageLayout } from "./EditorPageLayout";
import { EditorCanvas } from "./EditorCanvas";
import { PageTitleInput } from "./components/PageTitleInput";
import { PageSlugInput } from "./components/PageSlugInput";
import { EditPageFooter } from "./components/EditPageFooter";
import { useEditorForm } from "./hooks/useEditorForm";

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

  // Called unconditionally — guards below prevent rendering.
  const editorState = useCollaboration({
    wsUrl: WS_URL,
    roomName: pageId ?? "missing",
    currentUser,
  });

  // Pre-seed slug from route; title will be populated when API integration lands.
  const { title, slug, setTitle, setSlug } = useEditorForm({
    initialTitle: "",
    initialSlug: pageId ?? "",
  });

  if (!authUser || !pageId) return null;

  return (
    <EditorPageLayout
      titleInput={<PageTitleInput value={title} onChange={setTitle} placeholder="Page title" />}
      slugInput={<PageSlugInput value={slug} onChange={setSlug} />}
      editor={<EditorCanvas editorState={editorState} currentUser={currentUser} />}
      footer={
        <EditPageFooter
          onDelete={() => {
            // TODO: API integration (separate task)
          }}
          onSave={() => {
            // TODO: API integration (separate task)
          }}
        />
      }
    />
  );
}
