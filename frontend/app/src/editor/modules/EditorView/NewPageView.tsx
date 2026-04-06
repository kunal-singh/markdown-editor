import { useAtom } from "jotai";
import { useNavigate } from "react-router-dom";
import { currentUserAtom } from "@/auth/state/authAtoms";
import { usePages } from "@/editor/hooks/usePages";
import { EditorPageLayout } from "./EditorPageLayout";
import { PageTitleInput } from "./components/PageTitleInput";
import { PageSlugInput } from "./components/PageSlugInput";
import { NewPageFooter } from "./components/NewPageFooter";
import { useEditorForm } from "./hooks/useEditorForm";

export function NewPageView() {
  const [authUser] = useAtom(currentUserAtom);
  const navigate = useNavigate();
  const { title, slug, isValid, setTitle, setSlug } = useEditorForm();
  const { createPage, isLoading } = usePages();

  if (!authUser) return null;

  return (
    <EditorPageLayout
      titleInput={<PageTitleInput value={title} onChange={setTitle} placeholder="Page title" />}
      slugInput={<PageSlugInput value={slug} onChange={setSlug} />}
      footer={
        <NewPageFooter
          onDiscard={() => {
            void navigate("/dashboard/pages");
          }}
          onCreate={() => {
            void createPage(title, slug);
          }}
          isCreating={isLoading}
          disabled={!isValid}
        />
      }
    />
  );
}
