import { useAtom } from "jotai";
import { useLocalEditor } from "@markdown-editor/editor";
import { currentUserAtom } from "@/auth/state/authAtoms";
import { EditorCanvas } from "./EditorCanvas";

export function NewPageView() {
  const [authUser] = useAtom(currentUserAtom);
  const editorState = useLocalEditor();

  if (!authUser) return null;

  const currentUser = {
    id: authUser.user.id,
    name: authUser.user.display_name,
    color: "#6366f1",
  };

  return <EditorCanvas editorState={editorState} currentUser={currentUser} title="New page" />;
}
