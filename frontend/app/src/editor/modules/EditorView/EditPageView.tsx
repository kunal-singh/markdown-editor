import { useMemo, useEffect, useState } from "react";
import { useAtom } from "jotai";
import { useParams } from "react-router-dom";
import { useCollaboration } from "@markdown-editor/editor";
import type { CollabUser, CollaborationReady } from "@markdown-editor/editor";
import { getUserApi } from "@markdown-editor/infra";
import { currentUserAtom } from "@/auth/state/authAtoms";
import { pageTreeAtom } from "@/editor/state/pageAtoms";
import type { PageRead, PageTreeNode } from "@markdown-editor/domain";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@markdown-editor/ui";
import { EditorPageLayout } from "./EditorPageLayout";
import { EditorCanvas } from "./EditorCanvas";
import { PageTitleInput } from "./components/PageTitleInput";
import { PageSlugInput } from "./components/PageSlugInput";
import { EditPageFooter } from "./components/EditPageFooter";
import { useEditorForm } from "./hooks/useEditorForm";
import { useEditPage } from "./hooks/useEditPage";
import { NotFoundView } from "@/dashboard/modules/NotFoundView";

function flattenTree(nodes: PageTreeNode[]): { id: string; title: string }[] {
  return nodes.flatMap((n) => [{ id: n.id, title: n.title }, ...flattenTree(n.children)]);
}

const PLACEHOLDER_USER: CollabUser = { id: "anon", name: "Anonymous", color: "#6366f1" };
const WS_URL: string = (import.meta.env.VITE_WS_URL as string | undefined) ?? "ws://localhost:8000";

// Separate component so useCollaboration only runs once currentPage.id (UUID) is known.
// This prevents a "missing" WS connection on initial render.
interface ConnectedEditorProps {
  page: PageRead;
  currentUser: CollabUser;
  onSave: (pageId: string, title: string, parentId: string | null) => void;
  isLoading: boolean;
}

function ConnectedEditor({ page, currentUser, onSave, isLoading }: ConnectedEditorProps) {
  const [authUser] = useAtom(currentUserAtom);
  const [pageTree] = useAtom(pageTreeAtom);
  const token = authUser?.access_token ?? "";
  const [parentId, setParentId] = useState(page.parent_id ?? null);
  const pageOptions = useMemo(
    () => flattenTree(pageTree).filter((p) => p.id !== page.id),
    [pageTree, page.id],
  );

  const editorState: CollaborationReady | null = useCollaboration({
    wsUrl: WS_URL,
    roomName: page.id,
    currentUser,
  });

  const { title, slug, isValid, setTitle, setSlug } = useEditorForm({
    initialTitle: page.title,
    initialSlug: page.slug,
  });

  const [createdByName, setCreatedByName] = useState<string | null>(null);
  const [lastEditedByName, setLastEditedByName] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    if (page.created_by_id) {
      void getUserApi(page.created_by_id, token).then((u) => {
        setCreatedByName(u.display_name);
      });
    }
    if (page.last_edited_by_id) {
      void getUserApi(page.last_edited_by_id, token).then((u) => {
        setLastEditedByName(u.display_name);
      });
    }
  }, [page.created_by_id, page.last_edited_by_id, token]);

  if (!editorState) return null;

  return (
    <EditorPageLayout
      titleInput={<PageTitleInput value={title} onChange={setTitle} placeholder="Page title" />}
      slugInput={<PageSlugInput value={slug} onChange={setSlug} />}
      parentSelector={
        <Select
          value={parentId ?? "none"}
          onValueChange={(v: string) => {
            setParentId(v === "none" ? null : v);
          }}
        >
          <SelectTrigger className="w-56 text-sm">
            <SelectValue placeholder="No parent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No parent</SelectItem>
            {pageOptions.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
      editor={<EditorCanvas editorState={editorState} currentUser={currentUser} />}
      footer={
        <EditPageFooter
          onDelete={() => {
            // TODO: delete API integration
          }}
          onSave={() => {
            onSave(page.id, title, parentId);
          }}
          isSaving={isLoading}
          disabled={!isValid}
          createdByName={createdByName}
          lastEditedByName={lastEditedByName}
          lastEditedAt={page.last_edited_at ?? null}
        />
      }
    />
  );
}

export function EditPageView() {
  const { slug: pageSlug } = useParams<{ slug: string }>();
  const [authUser] = useAtom(currentUserAtom);

  const { loadPage, saveMeta, currentPage, isLoading, notFound } = useEditPage();

  const currentUser = useMemo(
    () =>
      authUser
        ? { id: authUser.user.id, name: authUser.user.display_name, color: "#6366f1" }
        : PLACEHOLDER_USER,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authUser?.user.id],
  );

  useEffect(() => {
    if (pageSlug) void loadPage(pageSlug);
  }, [pageSlug, loadPage]);

  if (!authUser || !pageSlug) return null;

  if (notFound) {
    return <NotFoundView />;
  }

  if (isLoading || !currentPage) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  return (
    <ConnectedEditor
      page={currentPage}
      currentUser={currentUser}
      onSave={(pageId, title, parentId) => {
        void saveMeta(pageId, title, parentId);
      }}
      isLoading={isLoading}
    />
  );
}
