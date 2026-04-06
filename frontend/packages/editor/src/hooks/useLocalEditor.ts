import { useState } from "react";
import * as Y from "yjs";
import type { LocalEditorResult } from "../types/editor";

export function useLocalEditor(): LocalEditorResult {
  // Lazy initializer ensures a single Y.Doc is created for the lifetime of the component.
  const [doc] = useState<Y.Doc>(() => new Y.Doc());
  return { doc, provider: null, status: "disconnected", connectedUsers: [] };
}
