import { useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { buildProviderUrl, normalizeAwarenessUsers } from "../useCases/connectionUseCases";
import type {
  UseCollaborationOptions,
  UseCollaborationResult,
  ConnectionStatus,
  CollabUser,
} from "../types/editor";

export function useCollaboration(options: UseCollaborationOptions): UseCollaborationResult {
  const { wsUrl, roomName, currentUser, authToken } = options;

  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [connectedUsers, setConnectedUsers] = useState<CollabUser[]>([]);

  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);

  // Depend on currentUser.id — not the full object — to prevent reconnect loops
  const stableOptions = useMemo(
    () => ({ wsUrl, roomName, currentUser, authToken }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wsUrl, roomName, currentUser.id, authToken],
  );

  useEffect(() => {
    const doc = new Y.Doc();
    const url = buildProviderUrl(
      stableOptions.wsUrl,
      stableOptions.roomName,
      stableOptions.authToken,
    );
    const provider = new WebsocketProvider(url, stableOptions.roomName, doc);

    provider.awareness.setLocalStateField("user", stableOptions.currentUser);

    docRef.current = doc;
    providerRef.current = provider;

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
      docRef.current = null;
      providerRef.current = null;
    };
  }, [stableOptions]);

  // On first render before the effect runs, return temporary stable objects.
  // This only occurs in StrictMode's first pass — the real objects are set synchronously.
  if (!docRef.current || !providerRef.current) {
    return {
      doc: new Y.Doc(),
      provider: new WebsocketProvider("", "", new Y.Doc(), { connect: false }),
      status,
      connectedUsers,
    };
  }

  return {
    doc: docRef.current,
    provider: providerRef.current,
    status,
    connectedUsers,
  };
}
