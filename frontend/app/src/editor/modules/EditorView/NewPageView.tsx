import { useAtom } from "jotai";
import { useNavigate } from "react-router-dom";
import { useLocalEditor } from "@markdown-editor/editor";
import { currentUserAtom } from "@/auth/state/authAtoms";
import { usePages } from "@/editor/hooks/usePages";
import { EditorPageLayout } from "./EditorPageLayout";
import { EditorCanvas } from "./EditorCanvas";
import { PageTitleInput } from "./components/PageTitleInput";
import { PageSlugInput } from "./components/PageSlugInput";
import { NewPageFooter } from "./components/NewPageFooter";
import { useEditorForm } from "./hooks/useEditorForm";

export function NewPageView() {
  const [authUser] = useAtom(currentUserAtom);
  const navigate = useNavigate();
  const editorState = useLocalEditor();
  const { title, slug, setTitle, setSlug } = useEditorForm();
  const { createPage, isLoading } = usePages();

  if (!authUser) return null;

  const currentUser = {
    id: authUser.user.id,
    name: authUser.user.display_name,
    color: "#6366f1",
  };

  return (
    <EditorPageLayout
      titleInput={<PageTitleInput value={title} onChange={setTitle} placeholder="Page title" />}
      slugInput={<PageSlugInput value={slug} onChange={setSlug} />}
      editor={<EditorCanvas editorState={editorState} currentUser={currentUser} />}
      footer={
        <NewPageFooter
          onDiscard={() => {
            void navigate("/dashboard/pages");
          }}
          onCreate={() => {
            void createPage(title, slug);
          }}
          isCreating={isLoading}
        />
      }
    />
  );
}
