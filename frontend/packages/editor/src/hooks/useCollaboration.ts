import { useEffect, useMemo, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { normalizeAwarenessUsers } from "../useCases/connectionUseCases";
import type {
  UseCollaborationOptions,
  CollaborationState,
  ConnectionStatus,
  CollabUser,
} from "../types/editor";

interface CollabSession {
  doc: Y.Doc;
  provider: WebsocketProvider;
}

export function useCollaboration(options: UseCollaborationOptions): CollaborationState {
  const { wsUrl, roomName, currentUser, authToken } = options;

  const [session, setSession] = useState<CollabSession | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [connectedUsers, setConnectedUsers] = useState<CollabUser[]>([]);

  // Depend on currentUser.id — not the full object — to prevent reconnect loops
  const stableOptions = useMemo(
    () => ({ wsUrl, roomName, currentUser, authToken }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wsUrl, roomName, currentUser.id, authToken],
  );

  useEffect(() => {
    const doc = new Y.Doc();
    const roomPath = `pages/${stableOptions.roomName}/ws`;
    const provider = new WebsocketProvider(stableOptions.wsUrl, roomPath, doc);
    provider.awareness.setLocalStateField("user", stableOptions.currentUser);

    // Expose doc+provider to render via state (refs are invisible to React)
    setSession({ doc, provider });
    setStatus("connecting");

    const handleStatus = ({ status: s }: { status: string }) => {
      setStatus(s as ConnectionStatus);
    };

    const handleAwarenessChange = () => {
      const users = normalizeAwarenessUsers(
        provider.awareness.getStates() as Map<number, Record<string, unknown>>,
        doc.clientID,
      );
      setConnectedUsers(users);
    };

    provider.on("status", handleStatus);
    provider.awareness.on("change", handleAwarenessChange);

    return () => {
      provider.off("status", handleStatus);
      provider.awareness.off("change", handleAwarenessChange);
      provider.destroy();
      doc.destroy();
      setSession(null);
    };
  }, [stableOptions]);

  if (!session) return null;

  return { doc: session.doc, provider: session.provider, status, connectedUsers };
}
