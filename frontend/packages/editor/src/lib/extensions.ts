import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import type * as Y from "yjs";
import type { WebsocketProvider } from "y-websocket";
import type { CollabUser } from "../types/editor";

const lowlight = createLowlight(common);

export function buildExtensions(
  doc: Y.Doc,
  provider: WebsocketProvider | null,
  currentUser: CollabUser,
  fieldName: string,
) {
  return [
    StarterKit.configure({ history: false }),
    Collaboration.configure({ document: doc, field: fieldName }),
    // CollaborationCursor requires a live provider — omit in local (new-page) mode.
    ...(provider ? [CollaborationCursor.configure({ provider, user: currentUser })] : []),
    Table.configure({ resizable: true }),
    TableRow,
    TableCell,
    TableHeader,
    CodeBlockLowlight.configure({ lowlight }),
  ];
}
